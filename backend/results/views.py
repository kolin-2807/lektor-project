import re
from datetime import timedelta

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.permissions import BasePermission
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response

try:
    from googleapiclient.errors import HttpError
except ImportError:  # pragma: no cover - optional dependency in some environments
    class HttpError(Exception):
        pass

from materials.models import Material
from users.models import get_active_google_drive_connection, resolve_google_drive_connection

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

    if language == "rus":
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


def _build_external_response_payload(session: TestSession, form_questions: list[dict], responses: list[dict]):
    question_blueprint = _get_question_blueprint(session, form_questions)
    answer_headers = [item["title"] for item in question_blueprint[1:]]
    headers = _get_results_sheet_headers(session, answer_headers)
    ordered_responses = []
    sheet_rows = []
    session_questions = session.questions_json or []
    max_score = sum(1 for question in session_questions if _get_correct_answer_value(question))

    for response in responses:
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

        ordered_responses.append({
            "response_id": response.get("responseId", ""),
            "submitted_at": response.get("lastSubmittedTime", ""),
            "student_name": student_name or "Name not provided",
            "score": score,
            "max_score": max_score,
            "score_label": score_label,
            "percentage": percentage_value,
            "answers": question_answers,
        })

        sheet_rows.append(
            [
                student_name,
                score_label,
                correct_answers_label,
                total_questions_label,
                percentage_label,
                response.get("lastSubmittedTime", ""),
            ] + [answer["value"] for answer in question_answers]
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


def _get_remaining_seconds(session: TestSession, attempt: TestAttempt, now=None) -> int:
    now = now or timezone.now()
    expires_at = attempt.started_at + timedelta(minutes=session.duration_minutes)
    remaining = int((expires_at - now).total_seconds())
    return max(0, remaining)


def _mark_attempt_expired(session: TestSession, attempt: TestAttempt | None) -> bool:
    if not attempt or attempt.status != TestAttempt.STATUS_STARTED:
        return False

    if _get_remaining_seconds(session, attempt) > 0:
        return False

    attempt.status = TestAttempt.STATUS_EXPIRED
    attempt.save(update_fields=["status"])
    return True


def _serialize_attempt(session: TestSession, attempt: TestAttempt | None):
    if not attempt:
        return None

    _mark_attempt_expired(session, attempt)
    remaining_seconds = _get_remaining_seconds(session, attempt) if attempt.status == TestAttempt.STATUS_STARTED else 0

    return {
        "id": attempt.id,
        "attempt_token": str(attempt.attempt_token),
        "student_name": attempt.student_name,
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
        "created_at": session.created_at,
        "questions": _get_public_questions(session),
        "attempt": _serialize_attempt(session, attempt),
    }


def _build_internal_response_payload(session: TestSession):
    question_titles = [
        question.get("question") or f"Question {index}"
        for index, question in enumerate(session.questions_json or [], start=1)
    ]
    responses = []

    for attempt in session.attempts.filter(status=TestAttempt.STATUS_SUBMITTED).order_by("-submitted_at", "-started_at"):
        responses.append({
            "response_id": str(attempt.attempt_token),
            "submitted_at": attempt.submitted_at,
            "student_name": attempt.student_name,
            "score": attempt.score,
            "max_score": attempt.max_score,
            "score_label": f"{attempt.score}/{attempt.max_score}" if attempt.max_score else "-",
            "answers": attempt.answers_json or [],
        })

    return question_titles, responses


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
        queryset = Result.objects.select_related("discipline").all().order_by("-created_at")
        discipline_id = self.request.GET.get("discipline_id")

        if discipline_id:
            queryset = queryset.filter(discipline_id=discipline_id)

        return queryset


class ResultViewSet(viewsets.ModelViewSet):
    queryset = Result.objects.all()
    serializer_class = ResultSerializer
    permission_classes = [HasGoogleSession]


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

            add_questions_to_form(connection, form_id, normalized_questions)
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
        except Exception as exc:
            return Response(
                {"detail": _format_google_error(exc, "Google Form creation failed")},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(TestSessionSerializer(session).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="responses")
    def responses(self, request, pk=None):
        session = self.get_object()
        answer_key_count, question_count = _get_answer_key_stats(session)
        scoring_ready = answer_key_count > 0

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

        question_titles, ordered_responses = _build_internal_response_payload(session)
        return Response({
            "session_id": session.id,
            "title": session.title,
            "material": session.material_id,
            "form_id": session.form_id,
            "form_url": session.form_url,
            "results_sheet_url": session.results_sheet_url,
            "question_titles": question_titles,
            "responses": ordered_responses,
            "response_count": len(ordered_responses),
            "sheet_synced": False,
            "scoring_ready": scoring_ready,
            "answer_key_count": answer_key_count,
            "question_count": question_count,
        })


@api_view(["GET"])
def public_test_detail(request, access_token):
    session = get_object_or_404(TestSession, access_token=access_token)
    attempt = None
    attempt_token = str(request.GET.get("attempt_token") or "").strip()

    if attempt_token:
        attempt = session.attempts.filter(attempt_token=attempt_token).first()

    return Response(_serialize_public_session(session, attempt))


@api_view(["POST"])
def public_test_start(request, access_token):
    session = get_object_or_404(TestSession, access_token=access_token)
    attempt_token = str(request.data.get("attempt_token") or "").strip()

    if attempt_token:
        existing_attempt = session.attempts.filter(attempt_token=attempt_token).first()
        if existing_attempt:
            return Response({
                "session": _serialize_public_session(session, existing_attempt),
                "attempt": _serialize_attempt(session, existing_attempt),
            })

    student_name = str(request.data.get("student_name") or "").strip()
    if not student_name:
        return Response({"detail": "student_name is required"}, status=status.HTTP_400_BAD_REQUEST)

    student_identifier = _normalize_student_identifier(student_name)
    existing_attempt = session.attempts.filter(student_identifier=student_identifier).first()

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
    remaining_seconds = _get_remaining_seconds(session, attempt)
    total_seconds = session.duration_minutes * 60
    time_spent_seconds = max(0, total_seconds - remaining_seconds)

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
