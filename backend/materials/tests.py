from django.test import Client, SimpleTestCase

from ai_services.assistant_service import detect_assistant_intent


class AssistantIntentServiceTests(SimpleTestCase):
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

    def test_prefers_kazakh_reply_for_kazakh_text_even_if_role_is_russian(self):
        result = detect_assistant_intent(
            "\u041c\u0430\u0442\u0435\u0440\u0438\u0430\u043b\u0434\u0430\u0440\u0434\u044b \u0430\u0448",
            context={
                "selected_role": "rus",
            },
        )

        self.assertEqual(result["action"], "open_materials")
        self.assertIn("\u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b", result["reply"].lower())

    def test_detects_course_navigation(self):
        result = detect_assistant_intent("3 \u043a\u0443\u0440\u0441 \u0430\u0448")

        self.assertEqual(result["action"], "open_course")
        self.assertEqual(result["course_number"], 3)
        self.assertGreaterEqual(result["confidence"], 0.9)

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
