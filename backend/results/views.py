import re
from datetime import timedelta

from django.db import transaction
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.permissions import BasePermission
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

try:
    from googleapiclient.errors import HttpError
except ImportError:  # pragma: no cover - optional dependency in some environments
    class HttpError(Exception):
        pass

from materials.models import Material
from users.models import GoogleDriveConnection, get_active_google_drive_connection, resolve_google_drive_connection

from .models import Result, TestAttempt, TestSession
from .serializers import ResultSerializer, TestSessionSerializer


def _format_google_error(exc, fallback_message: str) -> str:
    if not isinstance(exc, HttpError):
        return str(exc) or fallback_message

    error_text = str(exc)

    if "ACCESS_TOKEN_SCOPE_INSUFFICIENT" in error_text or "insufficient authentication scopes" in error_text.lower():
        return (
            "Google рұқсаттары жеткіліксіз. Google Drive-ты қайта қосып, жаңа рұқсаттарды растаңыз."
        )

    return error_text or fallback_message


def _get_session_google_connection(request, material: Material | None = None):
    owner_email = material.owner_email if material else ""
    return resolve_google_drive_connection(request, owner_email=owner_email)


def _get_material_google_connection(material: Material | None):
    owner_email = str(getattr(material, "owner_email", "") or "").strip().lower()
    if not owner_email:
        return None
    return GoogleDriveConnection.objects.filter(google_email__iexact=owner_email).first()


class HasGoogleSession(BasePermission):
    message = "Google login required."

    def has_permission(self, request, view):
        return get_active_google_drive_connection(request) is not None


def _normalize_student_identifier(name: str) -> str:
    normalized = re.sub(r"\s+", " ", str(name or "").strip().lower())
    return normalized


def _get_answer_value(answer: dict | None) -> str:
    if not answer:
        return ""

    text_answers = answer.get("textAnswers", {}).get("answers", [])
    values = [item.get("value", "").strip() for item in text_answers if item.get("value")]
    return " | ".join(values)


def _strip_option_prefix(value: str) -> str:
    return re.sub(r"^\s*[A-DА-Г0-9]+\s*[\)\.\:\-]\s*", "", str(value or "").strip(), flags=re.IGNORECASE)


def _resolve_option_index(options: list, raw_value) -> int | None:
    if raw_value is None:
        return None

    try:
        numeric_value = int(raw_value)
        if 0 <= numeric_value < len(options):
            return numeric_value
    except (TypeError, ValueError):
        pass

    normalized_value = str(raw_value or "").strip()
    if not normalized_value:
        return None

    match = re.match(r"^\s*([A-D])(?:[\)\.\:\-\s]|$)", normalized_value, flags=re.IGNORECASE)
    if match:
        option_letter_index = ord(match.group(1).upper()) - ord("A")
        if 0 <= option_letter_index < len(options):
            return option_letter_index

    cleaned_value = _strip_option_prefix(normalized_value).casefold()

    for index, option in enumerate(options):
        normalized_option = str(option or "").strip()
        if not normalized_option:
            continue

        if normalized_value.casefold() == normalized_option.casefold():
            return index

        if cleaned_value and cleaned_value == _strip_option_prefix(normalized_option).casefold():
            return index

    return None


def _answers_match(left, right) -> bool:
    normalized_left = str(left or "").strip()
    normalized_right = str(right or "").strip()

    if not normalized_left or not normalized_right:
        return False

    if normalized_left.casefold() == normalized_right.casefold():
        return True

    return _strip_option_prefix(normalized_left).casefold() == _strip_option_prefix(normalized_right).casefold()


def _get_correct_answer_value(question_config: dict) -> str:
    options = question_config.get("options") or []
    direct_value = str(question_config.get("correct_answer") or "").strip()
    if direct_value:
        resolved_index = _resolve_option_index(options, direct_value)
        if resolved_index is not None:
            return str(options[resolved_index]).strip()
        return direct_value

    option_index = _resolve_option_index(options, question_config.get("correct_option_index"))
    if option_index is not None:
        return str(options[option_index]).strip()

    for key in ("answer", "correct"):
        raw_value = question_config.get(key)
        normalized_value = str(raw_value or "").strip()
        if not normalized_value:
            continue

        resolved_index = _resolve_option_index(options, normalized_value)
        if resolved_index is not None:
            return str(options[resolved_index]).strip()

        return normalized_value

    return ""


def _normalize_question_payload(question_config: dict) -> dict:
    options = [str(option or "").strip() for option in (question_config.get("options") or [])]
    normalized_question = {
        **question_config,
        "question": str(question_config.get("question") or "").strip(),
        "options": options,
    }
    raw_answer = (
        question_config.get("correct_answer")
        or question_config.get("answer")
        or question_config.get("correct")
    )
    resolved_index = _resolve_option_index(options, question_config.get("correct_option_index"))
    if resolved_index is None:
        resolved_index = _resolve_option_index(options, raw_answer)

    normalized_question["correct_option_index"] = resolved_index if resolved_index is not None else -1
    normalized_question["correct_answer"] = str(options[resolved_index]).strip() if resolved_index is not None else str(raw_answer or "").strip()

    if raw_answer not in (None, ""):
        normalized_question["answer"] = raw_answer

    return normalized_question


def _get_answer_key_stats(session: TestSession) -> tuple[int, int]:
    questions = session.questions_json or []
    question_count = len(questions)
    answer_key_count = sum(1 for question in questions if _get_correct_answer_value(question))
    return answer_key_count, question_count


def _get_question_blueprint(session: TestSession, form_questions: list[dict]) -> list[dict]:
    if form_questions:
        return [
            {
                "question_id": item["question_id"],
                "title": item["title"] or f"Question {index}",
            }
            for index, item in enumerate(form_questions, start=1)
            if item.get("question_id")
        ]

    fallback_questions = [{"question_id": None, "title": "Student Name"}]

    for index, question in enumerate(session.questions_json or [], start=1):
        fallback_questions.append({
            "question_id": None,
            "title": question.get("question") or f"Question {index}",
        })

    return fallback_questions


def _format_percentage_value(score: int, max_score: int) -> int:
    if not max_score:
        return 0
    return round((score / max_score) * 100)


def _get_results_sheet_headers(session: TestSession, answer_headers: list[str]) -> list[str]:
    language = getattr(session.material.discipline, "language", "kaz")

    if language == "eng":
        base_headers = [
            "Student",
            "Score",
            "Correct answers",
            "Total questions",
            "Percent",
            "Submitted at",
        ]
    elif language == "rus":
        base_headers = [
            "Студент",
            "Балл",
            "Правильных ответов",
            "Всего вопросов",
            "Процент",
            "Время отправки",
        ]
    else:
        base_headers = [
            "Студент",
            "Балл",
            "Дұрыс жауап",
            "Жалпы сұрақ",
            "Пайыз",
            "Жіберілген уақыты",
        ]

    return base_headers + answer_headers


def _get_external_response_identity(response: dict) -> str:
    respondent_email = str(response.get("respondentEmail") or "").strip().lower()
    if respondent_email:
        return f"email:{respondent_email}"
    return ""


def _build_external_response_payload(session: TestSession, form_questions: list[dict], responses: list[dict]):
    question_blueprint = _get_question_blueprint(session, form_questions)
    answer_headers = [item["title"] for item in question_blueprint[1:]]
    headers = _get_results_sheet_headers(session, answer_headers)
    prepared_responses = []
    ordered_responses = []
    sheet_rows = []
    session_questions = session.questions_json or []
    max_score = sum(1 for question in session_questions if _get_correct_answer_value(question))

    sorted_responses = sorted(
        list(responses or []),
        key=lambda item: (
            str(item.get("lastSubmittedTime") or ""),
            str(item.get("responseId") or ""),
        ),
    )

    for response in sorted_responses:
        answers = response.get("answers") or {}

        if form_questions:
            ordered_answers = [
                {
                    "question": item["title"],
                    "value": _get_answer_value(answers.get(item["question_id"])),
                }
                for item in question_blueprint
            ]
        else:
            fallback_answers = list(answers.values())
            ordered_answers = []

            for index, item in enumerate(question_blueprint):
                raw_answer = fallback_answers[index] if index < len(fallback_answers) else None
                ordered_answers.append({
                    "question": item["title"],
                    "value": _get_answer_value(raw_answer),
                })

        student_name = ordered_answers[0]["value"] if ordered_answers else ""
        question_answers = []
        score = 0

        for index, answer in enumerate(ordered_answers[1:]):
            question_config = session_questions[index] if index < len(session_questions) else {}
            correct_answer = _get_correct_answer_value(question_config)
            answer_value = str(answer["value"] or "").strip()
            is_correct = bool(correct_answer) and _answers_match(answer_value, correct_answer)

            if is_correct:
                score += 1

            question_answers.append({
                "question": answer["question"],
                "value": answer["value"],
                "correct_answer": correct_answer,
                "is_correct": is_correct,
            })

        score_label = f"{score}/{max_score}" if max_score else "-"
        percentage_value = _format_percentage_value(score, max_score)
        correct_answers_label = score if max_score else "-"
        total_questions_label = max_score if max_score else "-"
        percentage_label = f"{percentage_value}%" if max_score else "-"

        prepared_responses.append({
            "response_id": response.get("responseId", ""),
            "submitted_at": response.get("lastSubmittedTime", ""),
            "respondent_email": response.get("respondentEmail", ""),
            "student_name": student_name or "Name not provided",
            "score": score,
            "max_score": max_score,
            "score_label": score_label,
            "percentage": percentage_value,
            "answers": question_answers,
            "identity_key": _get_external_response_identity(response),
        })

    seen_identities = set()
    for response in prepared_responses:
        identity_key = response.get("identity_key") or ""
        if identity_key and identity_key in seen_identities:
            continue

        if identity_key:
            seen_identities.add(identity_key)

        ordered_responses.append({
            "response_id": response["response_id"],
            "submitted_at": response["submitted_at"],
            "respondent_email": response.get("respondent_email", ""),
            "student_name": response["student_name"],
            "score": response["score"],
            "max_score": response["max_score"],
            "score_label": response["score_label"],
            "percentage": response["percentage"],
            "answers": response["answers"],
        })

        answer_values = [answer["value"] for answer in response["answers"]]
        correct_answers_label = response["score"] if max_score else "-"
        total_questions_label = max_score if max_score else "-"
        percentage_label = f"{response['percentage']}%" if max_score else "-"

        sheet_rows.append(
            [
                response["student_name"],
                response["score_label"],
                correct_answers_label,
                total_questions_label,
                percentage_label,
                response["submitted_at"],
            ] + answer_values
        )

    return headers, sheet_rows, ordered_responses, answer_headers


def _get_public_questions(session: TestSession) -> list[dict]:
    public_questions = []

    for index, question in enumerate(session.questions_json or [], start=1):
        public_questions.append({
            "index": index,
            "question": question.get("question") or f"Question {index}",
            "options": list(question.get("options") or []),
        })

    return public_questions


def _get_max_score(session: TestSession) -> int:
    answer_key_count, _ = _get_answer_key_stats(session)
    return answer_key_count


def _get_session_remaining_seconds(session: TestSession, now=None) -> int:
    return session.get_remaining_seconds(now=now)


def _get_session_status(session: TestSession, now=None) -> str:
    return session.get_public_status(now=now)


def _format_form_deadline_message(session: TestSession, now=None) -> str:
    now = now or timezone.now()
    remaining_seconds = _get_session_remaining_seconds(session, now=now)
    remaining_minutes = max(1, (remaining_seconds + 59) // 60) if remaining_seconds else 0
    closes_at = timezone.localtime(session.public_expires_at) if session.public_expires_at else None

    language = session.material.discipline.language

    if language == "eng":
        if _get_session_status(session, now=now) == "ready":
            return "The test is prepared, but the teacher has not launched it yet."

        if _get_session_status(session, now=now) == "expired":
            return "The test is closed. The answer submission time has expired."

        return (
            f"The test is open. About {remaining_minutes} min left before closing. "
            f"The form will close at {closes_at.strftime('%H:%M')}."
        )

    if language == "rus":
        if _get_session_status(session, now=now) == "ready":
            return "Тест подготовлен, но еще не запущен преподавателем."

        if _get_session_status(session, now=now) == "expired":
            return "Тест закрыт. Время приема ответов уже истекло."

        return (
            f"Тест открыт. До закрытия осталось примерно {remaining_minutes} мин. "
            f"Форма закроется в {closes_at.strftime('%H:%M')}."
        )

    if _get_session_status(session, now=now) == "ready":
        return "Тест дайын, бірақ оқытушы әлі іске қоспаған."

    if _get_session_status(session, now=now) == "expired":
        return "Тест жабылды. Жауап қабылдау уақыты аяқталды."

    return (
        f"Тест ашық. Жабылуына шамамен {remaining_minutes} минут қалды. "
        f"Форма {closes_at.strftime('%H:%M')} кезінде жабылады."
    )


def _sync_google_form_window(connection, session: TestSession, *, now=None, sync_publish_state: bool = True):
    if not connection or not session.form_id:
        return

    from .google_forms_service import set_form_publish_state, update_form_description

    now = now or timezone.now()
    session_status = _get_session_status(session, now=now)
    update_form_description(connection, session.form_id, _format_form_deadline_message(session, now=now))

    if not sync_publish_state:
        return

    if session_status == "live":
        set_form_publish_state(
            connection,
            session.form_id,
            is_published=True,
            is_accepting_responses=True,
        )
    else:
        set_form_publish_state(
            connection,
            session.form_id,
            is_published=True,
            is_accepting_responses=False,
        )


def _mark_attempt_expired(session: TestSession, attempt: TestAttempt | None) -> bool:
    if not attempt or attempt.status != TestAttempt.STATUS_STARTED:
        return False

    if _get_session_remaining_seconds(session) > 0:
        return False

    attempt.status = TestAttempt.STATUS_EXPIRED
    attempt.save(update_fields=["status"])
    return True


def _serialize_attempt(session: TestSession, attempt: TestAttempt | None):
    if not attempt:
        return None

    _mark_attempt_expired(session, attempt)
    remaining_seconds = _get_session_remaining_seconds(session) if attempt.status == TestAttempt.STATUS_STARTED else 0

    return {
        "id": attempt.id,
        "attempt_token": str(attempt.attempt_token),
        "student_name": attempt.student_name,
        "student_identifier": attempt.student_identifier,
        "device_identifier": attempt.device_identifier,
        "status": attempt.status,
        "score": attempt.score,
        "max_score": attempt.max_score,
        "score_label": f"{attempt.score}/{attempt.max_score}" if attempt.max_score else "-",
        "started_at": attempt.started_at,
        "submitted_at": attempt.submitted_at,
        "time_spent_seconds": attempt.time_spent_seconds,
        "remaining_seconds": remaining_seconds,
        "answers": attempt.answers_json or [],
    }


def _serialize_public_session(session: TestSession, attempt: TestAttempt | None = None):
    return {
        "id": session.id,
        "access_token": str(session.access_token),
        "title": session.title,
        "language": session.material.discipline.language,
        "material_id": session.material_id,
        "material_title": session.material.title,
        "discipline_title": session.material.discipline.title,
        "question_count": session.question_count,
        "duration_minutes": session.duration_minutes,
        "public_started_at": session.public_started_at,
        "public_expires_at": session.public_expires_at,
        "session_status": _get_session_status(session),
        "remaining_seconds": _get_session_remaining_seconds(session),
        "created_at": session.created_at,
        "questions": _get_public_questions(session),
        "attempt": _serialize_attempt(session, attempt),
    }


def _build_internal_response_payload(session: TestSession):
    question_titles = [
        question.get("question") or f"Question {index}"
        for index, question in enumerate(session.questions_json or [], start=1)
    ]
    headers = _get_results_sheet_headers(session, question_titles)
    rows = []
    responses = []

    for attempt in session.attempts.filter(status=TestAttempt.STATUS_SUBMITTED).order_by("-submitted_at", "-started_at"):
        percentage_value = _format_percentage_value(attempt.score, attempt.max_score)
        responses.append({
            "response_id": str(attempt.attempt_token),
            "submitted_at": attempt.submitted_at,
            "student_name": attempt.student_name,
            "score": attempt.score,
            "max_score": attempt.max_score,
            "score_label": f"{attempt.score}/{attempt.max_score}" if attempt.max_score else "-",
            "percentage": percentage_value,
            "answers": attempt.answers_json or [],
        })

        rows.append(
            [
                attempt.student_name,
                f"{attempt.score}/{attempt.max_score}" if attempt.max_score else "-",
                attempt.score if attempt.max_score else "-",
                attempt.max_score if attempt.max_score else "-",
                f"{percentage_value}%" if attempt.max_score else "-",
                attempt.submitted_at.isoformat() if attempt.submitted_at else "",
            ] + [answer.get("value", "") for answer in (attempt.answers_json or [])]
        )

    return question_titles, responses, headers, rows


def _find_attempt_by_identity(
    session: TestSession,
    *,
    attempt_token: str = "",
    device_identifier: str = "",
    student_identifier: str = "",
):
    if attempt_token:
        attempt = session.attempts.filter(attempt_token=attempt_token).first()
        if attempt:
            return attempt

    if device_identifier:
        attempt = session.attempts.filter(device_identifier=device_identifier).first()
        if attempt:
            return attempt

    if student_identifier:
        return session.attempts.filter(student_identifier=student_identifier).first()

    return None


def _render_public_gate_message(title: str, message: str, *, status_code: int = 200) -> HttpResponse:
    html = f"""
    <!doctype html>
    <html lang="kk">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{title}</title>
        <style>
          body {{
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: linear-gradient(180deg, #edf5fb 0%, #dce9f2 100%);
            font-family: Arial, sans-serif;
            color: #1d4768;
          }}
          .card {{
            width: min(520px, calc(100vw - 32px));
            padding: 28px;
            border-radius: 18px;
            background: #ffffff;
            border: 1px solid rgba(0, 93, 176, 0.12);
            box-shadow: 0 18px 40px rgba(20, 58, 93, 0.12);
          }}
          h1 {{
            margin: 0 0 12px;
            font-size: 28px;
            line-height: 1.2;
          }}
          p {{
            margin: 0;
            font-size: 16px;
            line-height: 1.6;
          }}
        </style>
      </head>
      <body>
        <div class="card">
          <h1>{title}</h1>
          <p>{message}</p>
        </div>
      </body>
    </html>
    """
    return HttpResponse(html, status=status_code)


def _evaluate_answers(session: TestSession, submitted_answers: list):
    questions = session.questions_json or []
    answer_rows = []
    score = 0
    max_score = _get_max_score(session)

    for index, question in enumerate(questions):
        options = list(question.get("options") or [])
        raw_value = submitted_answers[index] if index < len(submitted_answers) else None

        try:
            selected_option_index = int(raw_value) if raw_value is not None and raw_value != "" else None
        except (TypeError, ValueError):
            selected_option_index = None

        selected_value = ""
        if selected_option_index is not None and 0 <= selected_option_index < len(options):
            selected_value = str(options[selected_option_index]).strip()

        correct_answer = _get_correct_answer_value(question)
        is_correct = bool(correct_answer) and _answers_match(selected_value, correct_answer)

        if is_correct:
            score += 1

        answer_rows.append({
            "question": question.get("question") or f"Question {index + 1}",
            "selected_option_index": selected_option_index,
            "value": selected_value,
            "correct_answer": correct_answer,
            "is_correct": is_correct,
        })

    return answer_rows, score, max_score


class ResultListAPIView(generics.ListAPIView):
    serializer_class = ResultSerializer
    permission_classes = [HasGoogleSession]

    def get_queryset(self):
        connection = get_active_google_drive_connection(self.request)
        if not connection:
            return Result.objects.none()

        queryset = Result.objects.select_related("discipline").filter(
            discipline__owner_email__iexact=connection.google_email
        ).order_by("-created_at")
        discipline_id = self.request.GET.get("discipline_id")

        if discipline_id:
            queryset = queryset.filter(discipline_id=discipline_id)

        return queryset


class ResultViewSet(viewsets.ModelViewSet):
    serializer_class = ResultSerializer
    permission_classes = [HasGoogleSession]

    def get_queryset(self):
        connection = get_active_google_drive_connection(self.request)
        if not connection:
            return Result.objects.none()

        return Result.objects.filter(
            discipline__owner_email__iexact=connection.google_email
        ).order_by("-created_at")

    def _validate_owned_discipline(self, discipline):
        connection = get_active_google_drive_connection(self.request)
        if not connection or not discipline or discipline.owner_email.lower() != connection.google_email.lower():
            raise ValidationError({"detail": "Result discipline does not belong to the active Google account."})

    def perform_create(self, serializer):
        self._validate_owned_discipline(serializer.validated_data.get("discipline"))
        serializer.save()

    def perform_update(self, serializer):
        discipline = serializer.validated_data.get("discipline", serializer.instance.discipline)
        self._validate_owned_discipline(discipline)
        serializer.save()


class TestSessionViewSet(viewsets.ModelViewSet):
    serializer_class = TestSessionSerializer
    permission_classes = [HasGoogleSession]

    def get_queryset(self):
        connection = get_active_google_drive_connection(self.request)
        if not connection:
            return TestSession.objects.none()

        queryset = TestSession.objects.filter(
            material__owner_email__iexact=connection.google_email
        ).order_by("-created_at")
        material_id = self.request.GET.get("material")

        if material_id:
            queryset = queryset.filter(material_id=material_id)

        return queryset

    def perform_update(self, serializer):
        previous_session = serializer.instance
        previous_duration = previous_session.duration_minutes
        previous_questions = list(previous_session.questions_json or [])

        with transaction.atomic():
            session = serializer.save()

            if session.public_started_at and session.duration_minutes != previous_duration:
                session.public_expires_at = session.public_started_at + timedelta(minutes=session.duration_minutes)
                session.save(update_fields=["public_expires_at"])

            connection = _get_session_google_connection(self.request, session.material)
            if connection:
                try:
                    if session.form_id and (session.questions_json or []) != previous_questions:
                        from .google_forms_service import replace_questions_in_form

                        replace_questions_in_form(
                            connection,
                            session.form_id,
                            session.questions_json or [],
                            language=session.material.discipline.language,
                        )
                    _sync_google_form_window(connection, session)
                except Exception as exc:
                    raise ValidationError({"detail": _format_google_error(exc, "Google Form sync failed")}) from exc

    @action(detail=False, methods=["post"], url_path="create-from-ai")
    def create_from_ai(self, request):
        material_id = request.data.get("material_id")
        questions = request.data.get("questions", [])

        if not material_id:
            return Response(
                {"error": "material_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not questions:
            return Response(
                {"error": "questions are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        normalized_questions = [_normalize_question_payload(question) for question in questions]
        missing_answer_keys = sum(1 for question in normalized_questions if not _get_correct_answer_value(question))

        if missing_answer_keys:
            return Response(
                {
                    "detail": (
                        "AI тесттің кей сұрақтары үшін дұрыс жауап анықталмады. "
                        "Тестті қайта жасап көріңіз."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            question_count = int(request.data.get("question_count") or len(normalized_questions) or 5)
        except (TypeError, ValueError):
            question_count = len(normalized_questions) or 5

        try:
            duration_minutes = int(request.data.get("duration_minutes") or 20)
        except (TypeError, ValueError):
            duration_minutes = 20

        question_count = max(3, min(question_count, 25))
        duration_minutes = max(5, min(duration_minutes, 180))

        try:
            material = Material.objects.get(id=material_id)
        except Material.DoesNotExist:
            return Response(
                {"error": "Material not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        connection = _get_session_google_connection(request, material)
        if not connection:
            return Response(
                {"detail": "Осы материалды жүктеген Google аккаунтымен қайта қосылыңыз."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        session_title = f"{material.title} test"

        try:
            from .google_forms_service import add_questions_to_form, create_google_form
            from .google_sheets_service import create_results_sheet

            form = create_google_form(connection, session_title)
            form_id = form.get("formId", "")
            form_url = form.get("responderUri", "")

            if not form_id or not form_url:
                raise ValueError("Google Form did not return formId/responderUri")

            add_questions_to_form(
                connection,
                form_id,
                normalized_questions,
                language=material.discipline.language,
            )
            sheet = create_results_sheet(connection, f"{session_title} results")

            session = TestSession.objects.create(
                material=material,
                title=session_title,
                form_id=form_id,
                form_url=form_url,
                results_sheet_url=sheet.get("spreadsheet_url", ""),
                questions_json=normalized_questions,
                question_count=min(question_count, len(normalized_questions) or question_count),
                duration_minutes=duration_minutes,
            )
            try:
                _sync_google_form_window(connection, session, sync_publish_state=False)
            except Exception:
                pass
        except Exception as exc:
            return Response(
                {"detail": _format_google_error(exc, "Google Form creation failed")},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(TestSessionSerializer(session).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="launch-public")
    def launch_public(self, request, pk=None):
        session = self.get_object()

        if not session.questions_json:
            return Response(
                {"detail": "This test does not have questions yet."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        session_status = _get_session_status(session, now=now)

        if session_status != "live":
            if session_status == "expired":
                session.attempts.filter(status=TestAttempt.STATUS_STARTED).update(status=TestAttempt.STATUS_EXPIRED)

            session.launch_public_window(now=now)
            session.save(update_fields=["public_started_at", "public_expires_at"])

        connection = _get_session_google_connection(request, session.material)
        if connection:
            try:
                _sync_google_form_window(connection, session, now=now)
            except Exception as exc:
                return Response(
                    {"detail": _format_google_error(exc, "Google Form launch failed")},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

        return Response(TestSessionSerializer(session).data)

    @action(detail=True, methods=["post"], url_path="close-public")
    def close_public(self, request, pk=None):
        session = self.get_object()
        now = timezone.now()

        if not session.public_started_at:
            session.public_started_at = now

        if not session.public_expires_at or session.public_expires_at > now:
            session.public_expires_at = now
            session.save(update_fields=["public_started_at", "public_expires_at"])

        session.attempts.filter(status=TestAttempt.STATUS_STARTED).update(status=TestAttempt.STATUS_EXPIRED)

        connection = _get_session_google_connection(request, session.material)
        if connection:
            try:
                _sync_google_form_window(connection, session, now=now)
            except Exception as exc:
                return Response(
                    {"detail": _format_google_error(exc, "Google Form close failed")},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

        return Response(TestSessionSerializer(session).data)

    @action(detail=True, methods=["get"], url_path="responses")
    def responses(self, request, pk=None):
        session = self.get_object()
        answer_key_count, question_count = _get_answer_key_stats(session)
        scoring_ready = answer_key_count > 0
        question_titles, internal_responses, internal_headers, internal_rows = _build_internal_response_payload(session)

        if session.form_id:
            connection = _get_session_google_connection(request, session.material)
            if not connection:
                return Response(
                    {"detail": "Осы материалды жүктеген Google аккаунтымен қайта қосылыңыз."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            try:
                from .google_forms_service import get_form_questions, get_form_responses
                from .google_sheets_service import extract_spreadsheet_id, sync_sheet_data

                responses = get_form_responses(connection, session.form_id)
                form_questions = get_form_questions(connection, session.form_id)
                headers, sheet_rows, ordered_responses, answer_headers = _build_external_response_payload(
                    session=session,
                    form_questions=form_questions,
                    responses=responses,
                )

                spreadsheet_id = extract_spreadsheet_id(session.results_sheet_url)
                if spreadsheet_id:
                    sync_sheet_data(connection, spreadsheet_id, headers, sheet_rows)
            except Exception as exc:
                return Response(
                    {"detail": _format_google_error(exc, "Google results loading failed")},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            return Response({
                "session_id": session.id,
                "title": session.title,
                "material": session.material_id,
                "form_id": session.form_id,
                "form_url": session.form_url,
                "results_sheet_url": session.results_sheet_url,
                "question_titles": answer_headers,
                "responses": ordered_responses,
                "response_count": len(ordered_responses),
                "sheet_synced": bool(spreadsheet_id),
                "scoring_ready": scoring_ready,
                "answer_key_count": answer_key_count,
                "question_count": question_count,
            })

        if internal_responses:
            sheet_synced = False
            spreadsheet_id = ""
            connection = _get_session_google_connection(request, session.material)

            if connection and session.results_sheet_url:
                try:
                    from .google_sheets_service import extract_spreadsheet_id, sync_sheet_data

                    spreadsheet_id = extract_spreadsheet_id(session.results_sheet_url)
                    if spreadsheet_id:
                        sync_sheet_data(connection, spreadsheet_id, internal_headers, internal_rows)
                        sheet_synced = True
                except Exception:
                    sheet_synced = False

            return Response({
                "session_id": session.id,
                "title": session.title,
                "material": session.material_id,
                "form_id": session.form_id,
                "form_url": session.form_url,
                "results_sheet_url": session.results_sheet_url,
                "question_titles": question_titles,
                "responses": internal_responses,
                "response_count": len(internal_responses),
                "sheet_synced": sheet_synced,
                "scoring_ready": scoring_ready,
                "answer_key_count": answer_key_count,
                "question_count": question_count,
            })

        return Response({
            "session_id": session.id,
            "title": session.title,
            "material": session.material_id,
            "form_id": session.form_id,
            "form_url": session.form_url,
            "results_sheet_url": session.results_sheet_url,
            "question_titles": question_titles,
            "responses": internal_responses,
            "response_count": len(internal_responses),
            "sheet_synced": False,
            "scoring_ready": scoring_ready,
            "answer_key_count": answer_key_count,
            "question_count": question_count,
        })


@api_view(["GET"])
def public_test_detail(request, access_token):
    session = get_object_or_404(TestSession, access_token=access_token)
    attempt_token = str(request.GET.get("attempt_token") or "").strip()
    device_identifier = str(request.GET.get("device_id") or "").strip()
    attempt = _find_attempt_by_identity(
        session,
        attempt_token=attempt_token,
        device_identifier=device_identifier,
    )

    return Response(_serialize_public_session(session, attempt))


def public_test_open(request, access_token):
    session = get_object_or_404(TestSession, access_token=access_token)
    now = timezone.now()
    language = getattr(session.material.discipline, "language", "kaz")
    session_status = _get_session_status(session, now=now)

    if not session.form_url:
        return _render_public_gate_message(
            "Test unavailable",
            "Google Form link is not ready yet.",
            status_code=404,
        )

    connection = _get_material_google_connection(session.material)
    if connection and session.form_id:
        try:
            _sync_google_form_window(connection, session, now=now)
        except Exception:
            pass

    if session_status == "ready":
        if language == "eng":
            return _render_public_gate_message(
                "The test has not started yet",
                "The teacher has not launched the QR yet. Please try again a little later.",
                status_code=423,
            )

        return _render_public_gate_message(
            "Тест әлі ашылған жоқ" if language == "kaz" else "Тест еще не запущен",
            (
                "Оқытушы QR-ды әлі іске қосқан жоқ. Сәл кейінірек қайта кіріп көріңіз."
                if language == "kaz"
                else "Преподаватель еще не запустил QR. Попробуйте зайти немного позже."
            ),
            status_code=423,
        )

    if session_status == "expired":
        return HttpResponseRedirect(session.form_url)

    gate_cookie_name = f"lektor_test_gate_{session.id}"
    if request.COOKIES.get(gate_cookie_name) == "1":
        remaining_seconds = _get_session_remaining_seconds(session, now=now)
        if language == "eng":
            return _render_public_gate_message(
                "The test cannot be reopened",
                f"The QR was already opened on this device. About {remaining_seconds // 60} min left.",
                status_code=409,
            )

        return _render_public_gate_message(
            "Тест қайта ашылмайды" if language == "kaz" else "Тест нельзя открыть повторно",
            (
                f"Бұл құрылғыда QR бұрын ашылған. Қалған уақыт шамамен {remaining_seconds // 60} минут."
                if language == "kaz"
                else f"На этом устройстве QR уже открывали. Оставшееся время примерно {remaining_seconds // 60} мин."
            ),
            status_code=409,
        )

    response = HttpResponseRedirect(session.form_url)
    response.set_cookie(
        gate_cookie_name,
        "1",
        max_age=max(300, _get_session_remaining_seconds(session, now=now) + 300),
        httponly=False,
        samesite="Lax",
    )
    return response


@api_view(["POST"])
def public_test_start(request, access_token):
    session = get_object_or_404(TestSession, access_token=access_token)
    session_status = _get_session_status(session)
    attempt_token = str(request.data.get("attempt_token") or "").strip()
    device_identifier = str(request.data.get("device_id") or "").strip()

    if attempt_token:
        existing_attempt = session.attempts.filter(attempt_token=attempt_token).first()
        if existing_attempt:
            return Response({
                "session": _serialize_public_session(session, existing_attempt),
                "attempt": _serialize_attempt(session, existing_attempt),
            })

    if session_status == "ready":
        return Response(
            {
                "code": "session_not_started",
                "detail": "The teacher has not launched this test yet.",
                "session": _serialize_public_session(session),
            },
            status=status.HTTP_423_LOCKED,
        )

    if session_status == "expired":
        return Response(
            {
                "code": "session_expired",
                "detail": "The public test window is already closed.",
                "session": _serialize_public_session(session),
            },
            status=status.HTTP_410_GONE,
        )

    student_name = str(request.data.get("student_name") or "").strip()
    if not student_name:
        return Response({"detail": "student_name is required"}, status=status.HTTP_400_BAD_REQUEST)

    student_identifier = _normalize_student_identifier(student_name)
    existing_attempt = _find_attempt_by_identity(
        session,
        device_identifier=device_identifier,
        student_identifier=student_identifier,
    )

    if existing_attempt:
        _mark_attempt_expired(session, existing_attempt)
        code = "already_attempted"

        if existing_attempt.status == TestAttempt.STATUS_SUBMITTED:
            code = "already_submitted"
        elif existing_attempt.status == TestAttempt.STATUS_EXPIRED:
            code = "attempt_expired"

        return Response(
            {
                "code": code,
                "detail": "This student already has an attempt for the test.",
                "attempt": _serialize_attempt(session, existing_attempt),
                "session": _serialize_public_session(session, existing_attempt),
            },
            status=status.HTTP_409_CONFLICT,
        )

    attempt = TestAttempt.objects.create(
        session=session,
        student_name=student_name,
        student_identifier=student_identifier,
        device_identifier=device_identifier,
        max_score=_get_max_score(session),
    )

    return Response(
        {
            "session": _serialize_public_session(session, attempt),
            "attempt": _serialize_attempt(session, attempt),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
def public_test_submit(request, access_token):
    session = get_object_or_404(TestSession, access_token=access_token)
    attempt_token = str(request.data.get("attempt_token") or "").strip()
    attempt = session.attempts.filter(attempt_token=attempt_token).first()

    if not attempt:
        return Response({"detail": "Attempt not found"}, status=status.HTTP_404_NOT_FOUND)

    if _mark_attempt_expired(session, attempt):
        return Response(
            {
                "code": "attempt_expired",
                "detail": "Time is over for this test attempt.",
                "session": _serialize_public_session(session, attempt),
                "attempt": _serialize_attempt(session, attempt),
            },
            status=status.HTTP_410_GONE,
        )

    if attempt.status == TestAttempt.STATUS_SUBMITTED:
        return Response(
            {
                "code": "already_submitted",
                "detail": "This attempt was already submitted.",
                "attempt": _serialize_attempt(session, attempt),
            },
            status=status.HTTP_409_CONFLICT,
        )

    submitted_answers = request.data.get("answers")
    if not isinstance(submitted_answers, list):
        return Response({"detail": "answers must be a list"}, status=status.HTTP_400_BAD_REQUEST)

    answer_rows, score, max_score = _evaluate_answers(session, submitted_answers)
    elapsed_seconds = int((timezone.now() - attempt.started_at).total_seconds())
    time_spent_seconds = max(0, elapsed_seconds)

    attempt.answers_json = answer_rows
    attempt.score = score
    attempt.max_score = max_score
    attempt.time_spent_seconds = time_spent_seconds
    attempt.status = TestAttempt.STATUS_SUBMITTED
    attempt.submitted_at = timezone.now()
    attempt.save(
        update_fields=[
            "answers_json",
            "score",
            "max_score",
            "time_spent_seconds",
            "status",
            "submitted_at",
        ]
    )

    return Response(
        {
            "detail": "submitted",
            "attempt": _serialize_attempt(session, attempt),
            "session": _serialize_public_session(session, attempt),
        }
    )
