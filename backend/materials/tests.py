import json
import os
import tempfile
from unittest.mock import Mock, patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, SimpleTestCase, TestCase, override_settings

from academics.models import Course, Discipline
from ai_services.assistant_service import detect_assistant_intent
from ai_services.gemini_service import (
    GeminiServiceError,
    _build_random_answer_slots,
    _build_gemini_service_error,
    _is_predictable_answer_pattern,
    _normalize_slide_outline,
    _normalize_test_items,
    get_gemini_text_response,
)
from materials.models import Material
from ai_services.stt_service import STTServiceError, transcribe_audio
from ai_services.tts_service import TTSServiceError, synthesize_assistant_speech
from materials.google_drive_service import extract_material_text
from materials.google_slides_service import (
    _adapt_master_placeholder_text_style,
    _collect_master_placeholder_content_requests,
    _collect_master_placeholder_style_requests,
    _master_template_requests,
)
from materials.slide_templates import get_slide_template_definition
from materials.views import _build_gemini_error_response, _has_sufficient_material_text


class AssistantIntentServiceTests(SimpleTestCase):
    @override_settings(VOICE_ASSISTANT_NAME="Ayla")
    def test_introduces_named_assistant(self):
        result = detect_assistant_intent(
            "\u0421\u0435\u043d \u043a\u0456\u043c\u0441\u0456\u04a3?",
            context={
                "selected_role": "kaz",
            },
        )

        self.assertEqual(result["action"], "unknown")
        self.assertIn("Ayla", result["reply"])

    def test_detects_greeting_and_returns_kazakh_reply(self):
        result = detect_assistant_intent(
            "\u0421\u04d9\u043b\u0435\u043c",
            context={
                "selected_role": "kaz",
            },
        )

        self.assertEqual(result["action"], "unknown")
        self.assertIn("\u0421\u04d9\u043b\u0435\u043c", result["reply"])
        self.assertGreaterEqual(result["confidence"], 0.9)

    def test_answers_local_capabilities_question(self):
        result = detect_assistant_intent(
            "\u0422\u0435\u0441\u0442\u0442\u0456 \u049b\u0430\u043b\u0430\u0439 \u0430\u0448\u0430\u043c\u044b\u043d?",
            context={
                "selected_role": "kaz",
            },
        )

        self.assertEqual(result["action"], "unknown")
        self.assertIn("\u0442\u0435\u0441\u0442", result["reply"].lower())

    def test_uses_selected_russian_role_for_reply_language(self):
        result = detect_assistant_intent(
            "\u041c\u0430\u0442\u0435\u0440\u0438\u0430\u043b\u0434\u0430\u0440\u0434\u044b \u0430\u0448",
            context={
                "selected_role": "rus",
            },
        )

        self.assertEqual(result["action"], "open_materials")
        self.assertIn("\u0440\u0430\u0437\u0434\u0435\u043b", result["reply"].lower())

    def test_detects_course_navigation(self):
        result = detect_assistant_intent("3 \u043a\u0443\u0440\u0441 \u0430\u0448")

        self.assertEqual(result["action"], "open_course")
        self.assertEqual(result["course_number"], 3)
        self.assertGreaterEqual(result["confidence"], 0.9)


class SlideOutlineNormalizationTests(SimpleTestCase):
    def test_repairs_missing_slide_title_and_short_bullets(self):
        outline = _normalize_slide_outline(
            {
                "presentation_title": "Demo",
                "presentation_subtitle": "Subtitle",
                "slides": [
                    {
                        "title": "",
                        "bullets": ["Only one bullet"],
                    },
                    {
                        "title": "Second slide",
                        "bullets": ["One", "Two"],
                    },
                ],
            },
            slide_count=2,
        )

        self.assertEqual(len(outline["slides"]), 2)
        self.assertEqual(outline["slides"][0]["title"], "Only one bullet")
        self.assertGreaterEqual(len(outline["slides"][0]["bullets"]), 3)
        self.assertEqual(outline["slides"][1]["title"], "Second slide")
        self.assertGreaterEqual(len(outline["slides"][1]["bullets"]), 3)

    def test_pads_missing_slides_to_requested_count(self):
        outline = _normalize_slide_outline(
            {
                "presentation_title": "Demo",
                "presentation_subtitle": "Subtitle",
                "slides": [
                    {
                        "title": "Existing slide",
                        "bullets": ["One", "Two", "Three"],
                    }
                ],
            },
            slide_count=3,
        )

        self.assertEqual(len(outline["slides"]), 3)
        self.assertEqual(outline["slides"][1]["title"], "Slide 2")
        self.assertGreaterEqual(len(outline["slides"][1]["bullets"]), 3)
        self.assertEqual(outline["slides"][2]["title"], "Slide 3")
        self.assertGreaterEqual(len(outline["slides"][2]["bullets"]), 3)

    def test_detects_ordinal_course_navigation_and_returns_natural_reply(self):
        result = detect_assistant_intent("4 \u0448\u0456 \u043a\u0443\u0440\u0441\u0442\u044b \u0430\u0448")

        self.assertEqual(result["action"], "open_course")
        self.assertEqual(result["course_number"], 4)
        self.assertIn("\u0442\u04e9\u0440\u0442\u0456\u043d\u0448\u0456 \u043a\u0443\u0440\u0441\u0442\u044b", result["reply"].lower())

    def test_detects_subject_from_context(self):
        result = detect_assistant_intent(
            "\u0416\u0435\u043b\u0456\u043b\u0456\u043a \u049b\u0430\u0443\u0456\u043f\u0441\u0456\u0437\u0434\u0456\u043a \u043f\u04d9\u043d\u0456\u043d \u0430\u0448",
            context={
                "selected_role": "kaz",
                "available_subjects": [
                    {
                        "id": 12,
                        "title": "\u0416\u0435\u043b\u0456\u043b\u0456\u043a \u049b\u0430\u0443\u0456\u043f\u0441\u0456\u0437\u0434\u0456\u043a",
                        "course_number": 3,
                    }
                ],
            },
        )

        self.assertEqual(result["action"], "open_subject")
        self.assertEqual(result["subject_id"], 12)
        self.assertEqual(result["course_number"], 3)

    def test_detects_material_specific_test_generation(self):
        result = detect_assistant_intent(
            "15 \u0430\u043f\u0442\u0430 \u0434\u04d9\u0440\u0456\u0441\u0456 \u0431\u043e\u0439\u044b\u043d\u0448\u0430 \u0442\u0435\u0441\u0442 \u0436\u0430\u0441\u0430",
            context={
                "selected_role": "kaz",
                "selected_subject": {
                    "id": 12,
                    "title": "\u0416\u0435\u043b\u0456\u043b\u0456\u043a \u049b\u0430\u0443\u0456\u043f\u0441\u0456\u0437\u0434\u0456\u043a",
                    "course_number": 3,
                },
                "available_materials": [
                    {
                        "id": 51,
                        "title": "15 \u0430\u043f\u0442\u0430 \u0434\u04d9\u0440\u0456\u0441\u0456",
                        "type": "lecture",
                        "subject_id": 12,
                        "course_number": 3,
                    },
                    {
                        "id": 52,
                        "title": "\u21161 \u043f\u0440\u0430\u043a\u0442\u0438\u043a\u0430",
                        "type": "practice",
                        "subject_id": 12,
                        "course_number": 3,
                    },
                ],
            },
        )

        self.assertEqual(result["action"], "generate_test")
        self.assertEqual(result["material_id"], 51)
        self.assertEqual(result["material_type"], "lecture")
        self.assertEqual(result["subject_id"], 12)

    def test_extracts_test_parameters_from_command(self):
        result = detect_assistant_intent(
            "\u041e\u0441\u044b \u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b \u0431\u043e\u0439\u044b\u043d\u0448\u0430 10 \u0441\u04b1\u0440\u0430\u049b\u0442\u0430\u043d \u0442\u04b1\u0440\u0430\u0442\u044b\u043d \u0442\u0435\u0441\u0442 \u0434\u0430\u0439\u044b\u043d\u0434\u0430, \u0443\u0430\u049b\u044b\u0442\u044b 7 \u043c\u0438\u043d\u0443\u0442",
            context={
                "selected_role": "kaz",
                "selected_subject": {
                    "id": 12,
                    "title": "\u0416\u0435\u043b\u0456\u043b\u0456\u043a \u049b\u0430\u0443\u0456\u043f\u0441\u0456\u0437\u0434\u0456\u043a",
                    "course_number": 3,
                },
                "selected_material": {
                    "id": 51,
                    "title": "15 \u0430\u043f\u0442\u0430 \u0434\u04d9\u0440\u0456\u0441\u0456",
                    "type": "lecture",
                    "subject_id": 12,
                    "course_number": 3,
                },
            },
        )

        self.assertEqual(result["action"], "generate_test")
        self.assertEqual(result["question_count"], 10)
        self.assertEqual(result["duration_minutes"], 7)

    def test_opens_material_type_from_voice_command(self):
        result = detect_assistant_intent(
            "\u0417\u0435\u0440\u0442\u0445\u0430\u043d\u0430\u043d\u044b \u0430\u0448",
            context={
                "selected_role": "kaz",
                "selected_subject": {
                    "id": 12,
                    "title": "\u0416\u0435\u043b\u0456\u043b\u0456\u043a \u049b\u0430\u0443\u0456\u043f\u0441\u0456\u0437\u0434\u0456\u043a",
                    "course_number": 3,
                },
                "available_materials": [
                    {
                        "id": 51,
                        "title": "15 \u0430\u043f\u0442\u0430 \u0434\u04d9\u0440\u0456\u0441\u0456",
                        "type": "lecture",
                        "subject_id": 12,
                        "course_number": 3,
                    },
                    {
                        "id": 52,
                        "title": "\u0417\u0435\u0440\u0442\u0445\u0430\u043d\u0430\u043b\u044b\u049b \u0436\u04b1\u043c\u044b\u0441",
                        "type": "lab",
                        "subject_id": 12,
                        "course_number": 3,
                    },
                ],
            },
        )

        self.assertEqual(result["action"], "open_materials")
        self.assertEqual(result["material_type"], "lab")

    def test_opens_results_sheet_when_requested(self):
        result = detect_assistant_intent(
            "\u041d\u04d9\u0442\u0438\u0436\u0435\u043b\u0435\u0440\u0434\u0456 Google Sheets \u0444\u043e\u0440\u043c\u0430\u0442\u044b\u043d\u0434\u0430 \u0430\u0448",
            context={
                "selected_role": "kaz",
                "selected_subject": {
                    "id": 12,
                    "title": "\u0416\u0435\u043b\u0456\u043b\u0456\u043a \u049b\u0430\u0443\u0456\u043f\u0441\u0456\u0437\u0434\u0456\u043a",
                    "course_number": 3,
                },
                "selected_material": {
                    "id": 51,
                    "title": "15 \u0430\u043f\u0442\u0430 \u0434\u04d9\u0440\u0456\u0441\u0456",
                    "type": "lecture",
                    "subject_id": 12,
                    "course_number": 3,
                },
            },
        )

        self.assertEqual(result["action"], "open_results_sheet")


class AssistantCommandEndpointTests(SimpleTestCase):
    def setUp(self):
        self.client = Client()

    def test_endpoint_accepts_context_payload(self):
        response = self.client.post(
            "/api/assistant/command/",
            data={
                "text": "\u043d\u04d9\u0442\u0438\u0436\u0435\u043b\u0435\u0440\u0434\u0456 \u0430\u0448",
                "context": {
                    "selected_role": "kaz",
                    "selected_course_number": 2,
                    "selected_subject": {
                        "id": 21,
                        "title": "\u0410\u043b\u0433\u043e\u0440\u0438\u0442\u043c\u0434\u0435\u0440",
                        "course_number": 2,
                    },
                    "selected_material": {
                        "id": 77,
                        "title": "\u0421\u04b1\u0440\u044b\u043f\u0442\u0430\u0443 \u0430\u043b\u0433\u043e\u0440\u0438\u0442\u043c\u0434\u0435\u0440\u0456",
                        "type": "lecture",
                        "subject_id": 21,
                        "course_number": 2,
                    },
                },
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["action"], "open_results")
        self.assertEqual(payload["material_id"], 77)
        self.assertIn("metadata", payload)


class GeminiErrorHandlingTests(SimpleTestCase):
    def test_classifies_quota_error_without_retry(self):
        error = _build_gemini_service_error(RuntimeError("RESOURCE_EXHAUSTED: quota exceeded"), "gemini-2.5-flash")

        self.assertIsInstance(error, GeminiServiceError)
        self.assertEqual(error.code, "gemini_quota_exceeded")
        self.assertEqual(error.http_status, 429)
        self.assertFalse(error.retryable)
        self.assertIn("quota", str(error).lower())

    def test_classifies_busy_error_with_retry_hint(self):
        error = _build_gemini_service_error(RuntimeError("503 service unavailable"), "gemini-2.5-flash")

        self.assertEqual(error.code, "gemini_service_busy")
        self.assertEqual(error.http_status, 503)
        self.assertTrue(error.retryable)
        self.assertEqual(error.retry_after_seconds, 30)

    def test_builds_retry_headers_for_gemini_errors(self):
        error = GeminiServiceError(
            "Gemini service is temporarily busy.",
            code="gemini_service_busy",
            http_status=503,
            retryable=True,
            retry_after_seconds=30,
        )

        response = _build_gemini_error_response(error, "fallback")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data["code"], "gemini_service_busy")
        self.assertEqual(response.data["retry_after_seconds"], 30)
        self.assertEqual(response["Retry-After"], "30")


class VertexGenerationTests(SimpleTestCase):
    @override_settings(
        GEMINI_API_KEY="",
        GOOGLE_CLOUD_PROJECT="vertex-project",
        GOOGLE_CLOUD_LOCATION="us-central1",
        GOOGLE_GENAI_USE_VERTEXAI=True,
        GOOGLE_GENAI_MODEL_NAME="gemini-2.5-flash",
        GOOGLE_GENAI_FALLBACK_MODELS=[],
    )
    @patch("ai_services.gemini_service.requests.post")
    @patch("ai_services.gemini_service.google_auth.default")
    @patch("ai_services.gemini_service.genai", None)
    def test_vertex_generation_uses_adc_without_gemini_api_key(self, mocked_default, mocked_post):
        credentials = Mock(valid=True, token="vertex-token")
        mocked_default.return_value = (credentials, "vertex-project")
        mocked_post.return_value = Mock(
            ok=True,
            status_code=200,
            json=Mock(
                return_value={
                    "candidates": [
                        {
                            "content": {
                                "parts": [
                                    {
                                        "text": "Vertex answer",
                                    }
                                ]
                            }
                        }
                    ]
                }
            ),
        )

        result = get_gemini_text_response("Make a short test")

        self.assertEqual(result, "Vertex answer")
        request_url = mocked_post.call_args.args[0]
        request_headers = mocked_post.call_args.kwargs["headers"]
        self.assertIn(
            "https://us-central1-aiplatform.googleapis.com/v1/projects/vertex-project/locations/us-central1/publishers/google/models/gemini-2.5-flash:generateContent",
            request_url,
        )
        self.assertEqual(request_headers["Authorization"], "Bearer vertex-token")
        self.assertNotIn("x-goog-api-key", request_headers)


class GeminiTestNormalizationTests(SimpleTestCase):
    def test_random_answer_slots_are_balanced_without_cyclic_pattern(self):
        class FakeRandom:
            def __init__(self):
                self.calls = 0

            def shuffle(self, values):
                self.calls += 1
                if self.calls == 1:
                    values[:] = [3, 2, 1, 0, 3, 2, 1, 0]
                else:
                    values[:] = [0, 2, 1, 3, 2, 0, 3, 1]

        slots = _build_random_answer_slots(8, 4, rng=FakeRandom())

        self.assertCountEqual(slots, [0, 0, 1, 1, 2, 2, 3, 3])
        self.assertFalse(_is_predictable_answer_pattern(slots, 4))

    def test_balances_correct_answers_and_strips_option_prefixes(self):
        raw_items = [
            {
                "question": "Question 1",
                "options": ["A. Right 1", "B. Wrong 1A", "C. Wrong 1B", "D. Wrong 1C"],
                "answer": "A",
            },
            {
                "question": "Question 2",
                "options": ["A. Right 2", "B. Wrong 2A", "C. Wrong 2B", "D. Wrong 2C"],
                "answer": "A",
            },
            {
                "question": "Question 3",
                "options": ["A. Right 3", "B. Wrong 3A", "C. Wrong 3B", "D. Wrong 3C"],
                "answer": "A",
            },
            {
                "question": "Question 4",
                "options": ["A. Right 4", "B. Wrong 4A", "C. Wrong 4B", "D. Wrong 4C"],
                "answer": "A",
            },
        ]

        normalized_items = _normalize_test_items(raw_items, question_count=4)

        self.assertEqual(sorted(item["answer"] for item in normalized_items), ["A", "B", "C", "D"])

        for index, item in enumerate(normalized_items, start=1):
            self.assertEqual(set(item["options"]), {f"Right {index}", f"Wrong {index}A", f"Wrong {index}B", f"Wrong {index}C"})
            answer_index = ord(item["answer"]) - ord("A")
            self.assertEqual(item["options"][answer_index], f"Right {index}")


class MaterialTextReadinessTests(SimpleTestCase):
    def test_allows_supported_uploaded_file_with_short_best_effort_text(self):
        material = Mock(
            title="15 апта дәрісі",
            description="",
            category="lecture",
            drive_file_id="drive-file-1",
            mime_type="application/pdf",
            original_filename="lecture.pdf",
            discipline=Mock(title="Желілік қауіпсіздік"),
        )

        self.assertTrue(
            _has_sufficient_material_text(
                material,
                """
                Pan: Желілік қауіпсіздік
                Material atauy: 15 апта дәрісі
                Sipattamasy:
                Kategoriyasy: lecture
                Material matini:
                Негізгі ұғымдар мен қысқаша қорытынды.
                """,
            )
        )

    def test_rejects_short_text_when_uploaded_file_is_not_text_extractable(self):
        material = Mock(
            title="Diagram",
            description="",
            category="lecture",
            drive_file_id="drive-file-2",
            mime_type="image/png",
            original_filename="diagram.png",
            discipline=Mock(title="Желілік қауіпсіздік"),
        )

        self.assertFalse(
            _has_sufficient_material_text(
                material,
                """
                Pan: Желілік қауіпсіздік
                Material atauy: Diagram
                Sipattamasy:
                Kategoriyasy: lecture
                Material matini:
                """,
            )
        )


class MaterialTextExtractionTests(SimpleTestCase):
    def test_google_docs_plain_text_export_is_decoded_as_text(self):
        extracted_text = extract_material_text(
            "Slides outline in plain text".encode("utf-8"),
            mime_type="application/vnd.google-apps.document",
            original_filename="Lecture notes",
        )

        self.assertEqual(extracted_text, "Slides outline in plain text")


class SlideTemplateCatalogTests(SimpleTestCase):
    @override_settings(
        GOOGLE_SLIDES_MASTER_TEMPLATES=[
            {
                "id": "executive-master",
                "source_presentation_id": "template-abc123",
                "tone": "executive",
                "labels": {
                    "kaz": "Executive Dark",
                    "rus": "Executive Dark",
                    "eng": "Executive Dark",
                },
            }
        ]
    )
    def test_catalog_includes_configured_master_template(self):
        client = Client()
        response = client.get("/api/materials/slide-templates/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        template_ids = [item["id"] for item in payload["templates"]]

        self.assertIn("ilector-academic", template_ids)
        self.assertIn("executive-master", template_ids)

        configured_template = next(item for item in payload["templates"] if item["id"] == "executive-master")
        self.assertEqual(configured_template["source_type"], "master")
        self.assertEqual(configured_template["labels"]["kaz"], "Executive Dark")


class MasterTemplateStylePreservationTests(SimpleTestCase):
    def test_adapts_presentation_title_font_size_for_long_text(self):
        style = {
            "fontSize": {"magnitude": 30, "unit": "PT"},
            "bold": True,
        }

        adapted_style = _adapt_master_placeholder_text_style(
            style,
            "{{PRESENTATION_TITLE}}",
            "Kanban және DevOps тәжірибелері бойынша өндірістік командаларға арналған толық шолу",
        )

        self.assertLess(adapted_style["fontSize"]["magnitude"], 30)
        self.assertTrue(adapted_style["bold"])

    def test_collects_text_and_paragraph_style_requests_for_placeholders(self):
        presentation = {
            "slides": [
                {
                    "pageElements": [
                        {
                            "objectId": "title-box-1",
                            "shape": {
                                "text": {
                                    "textElements": [
                                        {
                                            "paragraphMarker": {
                                                "style": {
                                                    "alignment": "CENTER",
                                                    "lineSpacing": 110,
                                                }
                                            }
                                        },
                                        {
                                            "textRun": {
                                                "content": "{{PRESENTATION_TITLE}}",
                                                "style": {
                                                    "bold": True,
                                                    "fontSize": {"magnitude": 28, "unit": "PT"},
                                                    "foregroundColor": {
                                                        "opaqueColor": {
                                                            "rgbColor": {"red": 1, "green": 1, "blue": 1}
                                                        }
                                                    },
                                                },
                                            }
                                        },
                                    ]
                                }
                            },
                        }
                    ]
                }
            ]
        }

        requests = _collect_master_placeholder_style_requests(presentation)

        self.assertEqual(len(requests), 2)
        self.assertEqual(requests[0]["updateTextStyle"]["objectId"], "title-box-1")
        self.assertIn("foregroundColor", requests[0]["updateTextStyle"]["fields"])
        self.assertEqual(requests[1]["updateParagraphStyle"]["objectId"], "title-box-1")
        self.assertIn("alignment", requests[1]["updateParagraphStyle"]["fields"])

    def test_skips_style_requests_for_empty_placeholder_replacements(self):
        presentation = {
            "slides": [
                {
                    "objectId": "slide-1",
                    "pageElements": [
                        {
                            "objectId": "body-box-1",
                            "shape": {
                                "text": {
                                    "textElements": [
                                        {
                                            "paragraphMarker": {
                                                "style": {
                                                    "alignment": "START",
                                                    "lineSpacing": 120,
                                                }
                                            }
                                        },
                                        {
                                            "textRun": {
                                                "content": "{{SLIDE_BODY}}",
                                                "style": {
                                                    "fontSize": {"magnitude": 16, "unit": "PT"},
                                                    "foregroundColor": {
                                                        "opaqueColor": {
                                                            "rgbColor": {"red": 1, "green": 1, "blue": 1}
                                                        }
                                                    },
                                                },
                                            }
                                        },
                                    ]
                                }
                            },
                        }
                    ],
                }
            ]
        }

        requests = _collect_master_placeholder_style_requests(
            presentation,
            slide_ids=["slide-1"],
            placeholder_text_map={"{{SLIDE_BODY}}": ""},
        )

        self.assertEqual(requests, [])

    def test_collects_content_replacement_requests_for_split_placeholder_text(self):
        presentation = {
            "slides": [
                {
                    "objectId": "slide-1",
                    "pageElements": [
                        {
                            "objectId": "title-box-1",
                            "shape": {
                                "text": {
                                    "textElements": [
                                        {"textRun": {"content": "{{"}},
                                        {"textRun": {"content": "PRESENTATION_TITLE"}},
                                        {"textRun": {"content": "}}"}},
                                    ]
                                }
                            },
                        }
                    ],
                }
            ]
        }

        requests = _collect_master_placeholder_content_requests(
            presentation,
            replacement_map={"{{PRESENTATION_TITLE}}": "Kanban әдістемесінің негіздері"},
            slide_ids=["slide-1"],
        )

        self.assertEqual(len(requests), 2)
        self.assertEqual(requests[0]["deleteText"]["objectId"], "title-box-1")
        self.assertEqual(requests[1]["insertText"]["objectId"], "title-box-1")
        self.assertEqual(requests[1]["insertText"]["text"], "Kanban әдістемесінің негіздері")

    def test_master_template_requests_rotate_multiple_content_variants(self):
        presentation = {
            "slides": [
                {"objectId": "cover"},
                {"objectId": "content-a"},
                {"objectId": "content-b"},
                {"objectId": "closing"},
            ]
        }

        requests = _master_template_requests(
            presentation,
            slides=[
                {"title": "Slide 1", "bullets": ["One"]},
                {"title": "Slide 2", "bullets": ["Two"]},
                {"title": "Slide 3", "bullets": ["Three"]},
                {"title": "Slide 4", "bullets": ["Four"]},
                {"title": "Slide 5", "bullets": ["Five"]},
            ],
        )

        duplicate_targets = [item["duplicateObject"]["objectId"] for item in requests]
        self.assertEqual(duplicate_targets, ["content-a", "content-b", "content-a"])


class SlideTemplateCatalogTests(SimpleTestCase):
    @override_settings(
        GOOGLE_SLIDES_MASTER_TEMPLATES=[
            {
                "id": "executive-master",
                "source_presentation_id": "presentation-123",
                "tone": "executive",
                "labels": {"kaz": "Executive Dark"},
                "show_closing_subtitle": False,
            }
        ]
    )
    def test_master_template_supports_closing_subtitle_option(self):
        template = get_slide_template_definition("executive-master")

        self.assertEqual(template["source_type"], "master")
        self.assertFalse(template["options"]["show_closing_subtitle"])

    def test_collects_content_replacement_requests_for_fragmented_placeholder_elements(self):
        presentation = {
            "slides": [
                {
                    "objectId": "slide-1",
                    "pageElements": [
                        {
                            "objectId": "brace-left",
                            "shape": {"text": {"textElements": [{"textRun": {"content": "{{"}}]}},
                        },
                        {
                            "objectId": "title-core",
                            "shape": {"text": {"textElements": [{"textRun": {"content": "PRESENTATION_TITLE"}}]}},
                        },
                        {
                            "objectId": "brace-right",
                            "shape": {"text": {"textElements": [{"textRun": {"content": "}}"}}]}},
                        },
                    ],
                }
            ]
        }

        requests = _collect_master_placeholder_content_requests(
            presentation,
            replacement_map={"{{PRESENTATION_TITLE}}": "Kanban әдістемесінің негіздері"},
            slide_ids=["slide-1"],
        )

        self.assertEqual(requests[0]["deleteText"]["objectId"], "title-core")
        self.assertEqual(requests[1]["insertText"]["objectId"], "title-core")
        self.assertEqual(requests[2]["deleteObject"]["objectId"], "brace-left")
        self.assertEqual(requests[3]["deleteObject"]["objectId"], "brace-right")

    def test_collects_content_replacement_requests_for_space_separated_placeholder_text(self):
        presentation = {
            "slides": [
                {
                    "objectId": "slide-1",
                    "pageElements": [
                        {
                            "objectId": "title-box-1",
                            "shape": {
                                "text": {
                                    "textElements": [
                                        {"textRun": {"content": "{{PRESENTATION TITLE}}"}},
                                    ]
                                }
                            },
                        }
                    ],
                }
            ]
        }

        requests = _collect_master_placeholder_content_requests(
            presentation,
            replacement_map={"{{PRESENTATION_TITLE}}": "Kanban әдістемесінің негіздері"},
            slide_ids=["slide-1"],
        )

        self.assertEqual(requests[0]["deleteText"]["objectId"], "title-box-1")
        self.assertEqual(requests[1]["insertText"]["objectId"], "title-box-1")
        self.assertEqual(requests[1]["insertText"]["text"], "Kanban әдістемесінің негіздері")

    def test_collects_content_replacement_requests_for_grouped_placeholder_elements(self):
        presentation = {
            "slides": [
                {
                    "objectId": "slide-1",
                    "pageElements": [
                        {
                            "objectId": "group-1",
                            "elementGroup": {
                                "children": [
                                    {
                                        "objectId": "title-box-1",
                                        "shape": {
                                            "text": {
                                                "textElements": [
                                                    {"textRun": {"content": "{{SLIDE_TITLE}}"}},
                                                ]
                                            }
                                        },
                                    }
                                ]
                            },
                        }
                    ],
                }
            ]
        }

        requests = _collect_master_placeholder_content_requests(
            presentation,
            replacement_map={"{{SLIDE_TITLE}}": "Жобаның мақсаты"},
            slide_ids=["slide-1"],
        )

        self.assertEqual(requests[0]["deleteText"]["objectId"], "title-box-1")
        self.assertEqual(requests[1]["insertText"]["objectId"], "title-box-1")
        self.assertEqual(requests[1]["insertText"]["text"], "Жобаның мақсаты")


class SlideGenerationFlowTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.course, _ = Course.objects.get_or_create(number=3)
        self.discipline = Discipline.objects.create(
            course=self.course,
            title="Geometry",
            language="kaz",
            owner_email="teacher@example.com",
        )
        self.material = Material.objects.create(
            discipline=self.discipline,
            title="Lecture 1",
            category="lecture",
            cloud_url="https://drive.google.com/file/d/material/view",
            description="Lecture description",
            drive_folder_id="lecture-folder-id",
            owner_email="teacher@example.com",
        )
        self.connection = Mock(google_email="teacher@example.com")

    def test_generate_slides_uses_dedicated_slides_folder_and_saves_total_slide_count(self):
        with (
            patch("materials.views._require_google_session", return_value=(self.connection, None)),
            patch("materials.views._build_material_source_text", return_value="source material text"),
            patch("materials.views._has_sufficient_material_text", return_value=True),
            patch(
                "materials.views.generate_slide_outline_from_text",
                return_value={
                    "presentation_title": "Generated deck",
                    "presentation_subtitle": "Short subtitle",
                    "slides": [
                        {"title": f"Slide {index}", "bullets": ["One", "Two", "Three"]}
                        for index in range(1, 7)
                    ],
                },
            ) as mocked_outline,
            patch(
                "materials.google_drive_service.ensure_slide_output_folder",
                return_value=(Mock(), "slides-folder-id"),
            ) as mocked_ensure_folder,
            patch(
                "materials.google_slides_service.create_presentation_from_outline",
                return_value={
                    "presentation_id": "presentation-123",
                    "slides_url": "https://docs.google.com/presentation/d/presentation-123/edit",
                    "slides_embed_url": "https://docs.google.com/presentation/d/presentation-123/embed",
                    "slides_download_url": "https://docs.google.com/presentation/d/presentation-123/export/pptx",
                },
            ) as mocked_create,
        ):
            response = self.client.post(
                f"/api/materials/{self.material.id}/generate-slides/",
                data=json.dumps({"language": "kaz", "slide_count": 8}),
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.material.refresh_from_db()

        mocked_ensure_folder.assert_called_once_with(self.connection, self.discipline)
        mocked_outline.assert_called_once_with("source material text", language="kaz", slide_count=6)
        mocked_create.assert_called_once()
        self.assertEqual(mocked_create.call_args.kwargs["folder_id"], "slides-folder-id")
        self.assertEqual(payload["slides_count"], 8)
        self.assertEqual(self.material.slides_count, 8)
        self.assertEqual(self.material.slides_presentation_id, "presentation-123")

    def test_reset_slides_deletes_drive_file_and_clears_material_fields(self):
        self.material.slides_presentation_id = "presentation-123"
        self.material.slides_url = "https://docs.google.com/presentation/d/presentation-123/edit"
        self.material.slides_embed_url = "https://docs.google.com/presentation/d/presentation-123/embed"
        self.material.slides_download_url = "https://docs.google.com/presentation/d/presentation-123/export/pptx"
        self.material.slides_count = 8
        self.material.save()

        with (
            patch("materials.views._require_google_session", return_value=(self.connection, None)),
            patch("materials.google_drive_service.delete_material_file") as mocked_delete,
        ):
            response = self.client.post(
                f"/api/materials/{self.material.id}/reset-slides/",
                data=json.dumps({}),
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.material.refresh_from_db()

        mocked_delete.assert_called_once_with(self.connection, "presentation-123")
        self.assertEqual(payload["slides_presentation_id"], "")
        self.assertEqual(payload["slides_count"], 0)
        self.assertEqual(self.material.slides_presentation_id, "")
        self.assertEqual(self.material.slides_url, "")
        self.assertEqual(self.material.slides_embed_url, "")
        self.assertEqual(self.material.slides_download_url, "")
        self.assertEqual(self.material.slides_count, 0)

    @override_settings(
        GOOGLE_SLIDES_MASTER_TEMPLATES=[
            {
                "id": "executive-master",
                "source_presentation_id": "template-abc123",
                "tone": "executive",
                "labels": {
                    "kaz": "Executive Dark",
                    "rus": "Executive Dark",
                    "eng": "Executive Dark",
                },
            }
        ]
    )
    def test_switching_to_master_template_rebuilds_existing_presentation(self):
        self.material.slides_presentation_id = "presentation-old"
        self.material.slides_url = "https://docs.google.com/presentation/d/presentation-old/edit"
        self.material.slides_embed_url = "https://docs.google.com/presentation/d/presentation-old/embed"
        self.material.slides_download_url = "https://docs.google.com/presentation/d/presentation-old/export/pptx"
        self.material.slides_count = 8
        self.material.slides_template_id = "ilector-academic"
        self.material.slides_outline_json = {
            "presentation_title": "Generated deck",
            "presentation_subtitle": "Short subtitle",
            "slides": [
                {"title": f"Slide {index}", "bullets": ["One", "Two", "Three"]}
                for index in range(1, 7)
            ],
        }
        self.material.save()

        with (
            patch("materials.views._require_google_session", return_value=(self.connection, None)),
            patch(
                "materials.google_drive_service.ensure_slide_output_folder",
                return_value=(Mock(), "slides-folder-id"),
            ),
            patch("materials.google_drive_service.delete_material_file") as mocked_delete,
            patch(
                "materials.google_slides_service.create_presentation_from_outline",
                return_value={
                    "presentation_id": "presentation-new",
                    "slides_url": "https://docs.google.com/presentation/d/presentation-new/edit",
                    "slides_embed_url": "https://docs.google.com/presentation/d/presentation-new/embed",
                    "slides_download_url": "https://docs.google.com/presentation/d/presentation-new/export/pptx",
                },
            ) as mocked_create,
        ):
            response = self.client.post(
                f"/api/materials/{self.material.id}/generate-slides/",
                data=json.dumps({"language": "kaz", "slide_count": 8, "template_id": "executive-master"}),
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        self.material.refresh_from_db()

        mocked_delete.assert_called_once_with(self.connection, "presentation-old")
        mocked_create.assert_called_once()
        self.assertEqual(mocked_create.call_args.kwargs["template_id"], "executive-master")
        self.assertEqual(self.material.slides_presentation_id, "presentation-new")
        self.assertEqual(self.material.slides_template_id, "executive-master")

    @override_settings(
        GOOGLE_SLIDES_MASTER_TEMPLATES=[
            {
                "id": "executive-master",
                "source_presentation_id": "template-abc123",
                "tone": "executive",
                "labels": {
                    "kaz": "Executive Dark",
                    "rus": "Executive Dark",
                    "eng": "Executive Dark",
                },
            }
        ]
    )
    def test_regenerating_same_master_template_rebuilds_existing_presentation(self):
        self.material.slides_presentation_id = "presentation-old"
        self.material.slides_url = "https://docs.google.com/presentation/d/presentation-old/edit"
        self.material.slides_embed_url = "https://docs.google.com/presentation/d/presentation-old/embed"
        self.material.slides_download_url = "https://docs.google.com/presentation/d/presentation-old/export/pptx"
        self.material.slides_count = 8
        self.material.slides_template_id = "executive-master"
        self.material.slides_outline_json = {
            "presentation_title": "Generated deck",
            "presentation_subtitle": "Short subtitle",
            "slides": [
                {"title": f"Slide {index}", "bullets": ["One", "Two", "Three"]}
                for index in range(1, 7)
            ],
        }
        self.material.save()

        with (
            patch("materials.views._require_google_session", return_value=(self.connection, None)),
            patch(
                "materials.google_drive_service.ensure_slide_output_folder",
                return_value=(Mock(), "slides-folder-id"),
            ),
            patch("materials.google_drive_service.delete_material_file") as mocked_delete,
            patch(
                "materials.google_slides_service.create_presentation_from_outline",
                return_value={
                    "presentation_id": "presentation-new",
                    "slides_url": "https://docs.google.com/presentation/d/presentation-new/edit",
                    "slides_embed_url": "https://docs.google.com/presentation/d/presentation-new/embed",
                    "slides_download_url": "https://docs.google.com/presentation/d/presentation-new/export/pptx",
                },
            ) as mocked_create,
        ):
            response = self.client.post(
                f"/api/materials/{self.material.id}/generate-slides/",
                data=json.dumps({"language": "kaz", "slide_count": 8, "template_id": "executive-master"}),
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        self.material.refresh_from_db()

        mocked_delete.assert_called_once_with(self.connection, "presentation-old")
        mocked_create.assert_called_once()
        self.assertEqual(mocked_create.call_args.kwargs["template_id"], "executive-master")
        self.assertEqual(self.material.slides_presentation_id, "presentation-new")


class AssistantTranscriptionTests(SimpleTestCase):
    @override_settings(
        AZURE_SPEECH_KEY="azure-key",
        AZURE_SPEECH_REGION="swedencentral",
        AZURE_SPEECH_STT_API_VERSION="2025-10-15",
        AZURE_SPEECH_STT_LOCALES=["kk-KZ"],
        AZURE_SPEECH_STT_TIMEOUT_SECONDS=60,
    )
    @patch("ai_services.stt_service.shutil.which", return_value=None)
    @patch("ai_services.stt_service.requests.post")
    def test_transcribes_audio_with_azure_fast_transcription(self, mocked_post, _mocked_which):
        response = Mock(ok=True)
        response.json.return_value = {"combinedPhrases": [{"text": "Сәлем, жүйе"}]}
        mocked_post.return_value = response

        temp_path = ""
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as audio_file:
            temp_path = audio_file.name
            audio_file.write(b"audio-bytes")

        try:
            transcript = transcribe_audio(
                temp_path,
                filename="voice.webm",
                content_type="audio/webm",
                locale="kk-KZ",
            )
        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

        self.assertEqual(transcript, "Сәлем, жүйе")
        call_args = mocked_post.call_args
        self.assertIn(
            "https://swedencentral.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe",
            call_args.args[0],
        )
        self.assertIn("api-version=2025-10-15", call_args.args[0])
        self.assertEqual(call_args.kwargs["headers"]["Ocp-Apim-Subscription-Key"], "azure-key")
        self.assertEqual(json.loads(call_args.kwargs["data"]["definition"]), {"locales": ["kk-KZ"]})
        self.assertEqual(call_args.kwargs["files"]["audio"][0], "voice.webm")
        self.assertEqual(call_args.kwargs["files"]["audio"][2], "audio/webm")

    @override_settings(
        AZURE_SPEECH_KEY="azure-key",
        AZURE_SPEECH_REGION="swedencentral",
        AZURE_SPEECH_STT_API_VERSION="2025-10-15",
        AZURE_SPEECH_STT_LOCALES=["kk-KZ"],
        AZURE_SPEECH_STT_TIMEOUT_SECONDS=60,
    )
    @patch("ai_services.stt_service.requests.post")
    @patch("ai_services.stt_service.subprocess.run")
    @patch("ai_services.stt_service.shutil.which", return_value="ffmpeg")
    def test_normalizes_browser_audio_before_upload(self, _mocked_which, mocked_run, mocked_post):
        response = Mock(ok=True)
        response.json.return_value = {"combinedPhrases": [{"text": "Сәлем"}]}
        mocked_post.return_value = response

        normalized_output = {"path": ""}

        def fake_run(command, check, capture_output):
            normalized_output["path"] = command[-1]
            with open(command[-1], "wb") as converted_audio:
                converted_audio.write(b"wav-audio")
            return Mock()

        mocked_run.side_effect = fake_run

        temp_path = ""
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as audio_file:
            temp_path = audio_file.name
            audio_file.write(b"audio-bytes")

        try:
            transcript = transcribe_audio(
                temp_path,
                filename="voice.webm",
                content_type="audio/webm",
                locale="kk-KZ",
            )
        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

        self.assertEqual(transcript, "Сәлем")
        call_args = mocked_post.call_args
        self.assertEqual(call_args.kwargs["files"]["audio"][0], "voice.wav")
        self.assertEqual(call_args.kwargs["files"]["audio"][2], "audio/wav")
        self.assertFalse(os.path.exists(normalized_output["path"]))

    @override_settings(AZURE_SPEECH_KEY="", AZURE_SPEECH_REGION="")
    def test_raises_when_azure_transcription_is_not_configured(self):
        with self.assertRaises(STTServiceError) as captured:
            transcribe_audio("missing.webm")

        self.assertEqual(captured.exception.code, "azure_stt_not_configured")

    @patch("materials.views.transcribe_audio", return_value="Дауыстық мәтін")
    def test_assistant_transcribe_endpoint_passes_audio_metadata(self, mocked_transcribe):
        client = Client()
        upload = SimpleUploadedFile("voice.webm", b"audio-bytes", content_type="audio/webm")

        response = client.post(
            "/api/assistant/transcribe/",
            data={"audio": upload, "language": "kk-KZ"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"text": "Дауыстық мәтін"})
        call_kwargs = mocked_transcribe.call_args.kwargs
        self.assertEqual(call_kwargs["filename"], "voice.webm")
        self.assertEqual(call_kwargs["content_type"], "audio/webm")
        self.assertEqual(call_kwargs["locale"], "kk-KZ")


class AssistantSpeechTests(SimpleTestCase):
    @override_settings(
        AZURE_SPEECH_KEY="azure-key",
        AZURE_SPEECH_REGION="swedencentral",
        AZURE_SPEECH_TTS_VOICE_KK="kk-KZ-AigulNeural",
        AZURE_SPEECH_TTS_VOICE_RU="ru-RU-SvetlanaNeural",
        AZURE_SPEECH_TTS_OUTPUT_FORMAT="audio-24khz-48kbitrate-mono-mp3",
    )
    @patch("ai_services.tts_service.requests.post")
    def test_synthesizes_assistant_speech_via_azure(self, mocked_post):
        mocked_post.return_value = Mock(ok=True, content=b"audio-bytes")

        audio_bytes, mime_type, provider = synthesize_assistant_speech("Сәлем", language="kaz")

        self.assertEqual(audio_bytes, b"audio-bytes")
        self.assertEqual(mime_type, "audio/mpeg")
        self.assertEqual(provider, "azure")
        mocked_post.assert_called_once()

    @override_settings(AZURE_SPEECH_KEY="", AZURE_SPEECH_REGION="")
    def test_raises_when_non_kazakh_voice_is_not_configured(self):
        with self.assertRaises(TTSServiceError) as captured:
            synthesize_assistant_speech("Привет", language="rus")

        self.assertEqual(captured.exception.code, "tts_not_configured")

    @patch("materials.views.synthesize_assistant_speech")
    def test_assistant_speak_endpoint_returns_audio(self, mocked_synthesize):
        mocked_synthesize.return_value = (b"voice-data", "audio/mpeg", "azure")
        client = Client()

        response = client.post(
            "/api/assistant/speak/",
            data={"text": "Сәлем", "language": "kaz"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "audio/mpeg")
        self.assertEqual(response["X-TTS-Provider"], "azure")
        self.assertEqual(response.content, b"voice-data")
