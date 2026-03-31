from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from materials.models import Material

from .google_forms_service import (
    add_questions_to_form,
    create_google_form,
    get_form_questions,
    get_form_responses,
)
from .google_sheets_service import (
    create_results_sheet,
    extract_spreadsheet_id,
    sync_sheet_data,
    write_headers_to_sheet,
)
from .models import Result, TestSession
from .serializers import ResultSerializer, TestSessionSerializer


def _get_answer_value(answer: dict | None) -> str:
    if not answer:
        return ""

    text_answers = answer.get("textAnswers", {}).get("answers", [])
    values = [item.get("value", "").strip() for item in text_answers if item.get("value")]
    return " | ".join(values)


def _get_correct_answer_value(question_config: dict) -> str:
    direct_value = str(question_config.get("correct_answer") or "").strip()
    if direct_value:
        return direct_value

    options = question_config.get("options") or []

    option_index = question_config.get("correct_option_index")
    if option_index is not None:
        try:
            normalized_index = int(option_index)
            if 0 <= normalized_index < len(options):
                return str(options[normalized_index]).strip()
        except (TypeError, ValueError):
            pass

    for key in ("answer", "correct"):
        raw_value = question_config.get(key)
        normalized_value = str(raw_value or "").strip()
        if not normalized_value:
            continue

        if len(normalized_value) == 1 and normalized_value.upper() in ("A", "B", "C", "D"):
            option_letter_index = ord(normalized_value.upper()) - ord("A")
            if 0 <= option_letter_index < len(options):
                return str(options[option_letter_index]).strip()

        return normalized_value

    return ""


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


def _build_response_payload(session: TestSession, form_questions: list[dict], responses: list[dict]):
    question_blueprint = _get_question_blueprint(session, form_questions)
    answer_headers = [item["title"] for item in question_blueprint[1:]]
    headers = ["Submitted At", "Student Name", "Score"] + answer_headers
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
            is_correct = bool(correct_answer) and answer_value == correct_answer

            if is_correct:
                score += 1

            question_answers.append({
                "question": answer["question"],
                "value": answer["value"],
                "correct_answer": correct_answer,
                "is_correct": is_correct,
            })

        score_label = f"{score}/{max_score}" if max_score else "-"

        ordered_responses.append({
            "response_id": response.get("responseId", ""),
            "submitted_at": response.get("lastSubmittedTime", ""),
            "student_name": student_name or "Name not provided",
            "score": score,
            "max_score": max_score,
            "score_label": score_label,
            "answers": question_answers,
        })

        sheet_rows.append(
            [
                response.get("lastSubmittedTime", ""),
                student_name,
                score_label,
            ] + [answer["value"] for answer in question_answers]
        )

    return headers, sheet_rows, ordered_responses


class ResultListAPIView(generics.ListAPIView):
    serializer_class = ResultSerializer

    def get_queryset(self):
        queryset = Result.objects.select_related("discipline").all().order_by("-created_at")
        discipline_id = self.request.GET.get("discipline_id")

        if discipline_id:
            queryset = queryset.filter(discipline_id=discipline_id)

        return queryset


class ResultViewSet(viewsets.ModelViewSet):
    queryset = Result.objects.all()
    serializer_class = ResultSerializer


class TestSessionViewSet(viewsets.ModelViewSet):
    serializer_class = TestSessionSerializer

    def get_queryset(self):
        queryset = TestSession.objects.all().order_by("-created_at")
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

        try:
            material = Material.objects.get(id=material_id)
        except Material.DoesNotExist:
            return Response(
                {"error": "Material not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        form = create_google_form(f"{material.title} test")
        add_questions_to_form(form["formId"], questions)

        sheet = create_results_sheet(f"{material.title} results")
        write_headers_to_sheet(
            sheet["spreadsheet_id"],
            [
                "Submitted At",
                "Student Name",
                "Score",
                *[
                    question.get("question") or f"Question {index}"
                    for index, question in enumerate(questions, start=1)
                ],
            ],
        )

        session = TestSession.objects.create(
            material=material,
            title=f"{material.title} test",
            form_id=form["formId"],
            form_url=form["responderUri"],
            results_sheet_url=sheet["spreadsheet_url"],
            questions_json=questions,
        )

        return Response({
            "id": session.id,
            "title": session.title,
            "material": session.material_id,
            "form_id": session.form_id,
            "form_url": session.form_url,
            "results_sheet_url": session.results_sheet_url,
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="responses")
    def responses(self, request, pk=None):
        session = self.get_object()

        if not session.form_id:
            return Response(
                {"error": "form_id is not set"},
                status=status.HTTP_400_BAD_REQUEST
            )

        responses = get_form_responses(session.form_id)
        form_questions = get_form_questions(session.form_id)
        headers, sheet_rows, ordered_responses = _build_response_payload(
            session=session,
            form_questions=form_questions,
            responses=responses,
        )

        spreadsheet_id = extract_spreadsheet_id(session.results_sheet_url)
        if spreadsheet_id:
            sync_sheet_data(spreadsheet_id, headers, sheet_rows)

        return Response({
            "session_id": session.id,
            "title": session.title,
            "material": session.material_id,
            "form_id": session.form_id,
            "form_url": session.form_url,
            "results_sheet_url": session.results_sheet_url,
            "question_titles": headers[3:],
            "responses": ordered_responses,
            "response_count": len(ordered_responses),
            "sheet_synced": bool(spreadsheet_id),
        })
