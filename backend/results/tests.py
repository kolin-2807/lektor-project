from unittest.mock import Mock, patch

from django.test import SimpleTestCase, TestCase

from results.google_forms_service import replace_questions_in_form

class GoogleFormsReplaceQuestionsTests(SimpleTestCase):
    @patch("results.google_forms_service.get_google_credentials")
    @patch("results.google_forms_service.build")
    def test_replace_questions_deletes_all_items_before_recreating(self, mocked_build, mocked_get_credentials):
        mocked_get_credentials.return_value = object()
        forms_service = Mock()
        mocked_build.return_value = forms_service
        forms_service.forms.return_value.get.return_value.execute.return_value = {
            "items": [
                {"itemId": "group-item", "questionGroupItem": {}},
                {"itemId": "question-1", "questionItem": {}},
                {"itemId": "question-2", "questionItem": {}},
            ]
        }

        replace_questions_in_form(
            connection=object(),
            form_id="form-id",
            questions=[
                {
                    "question": "Question?",
                    "options": ["A", "B", "C", "D"],
                    "answer": "A",
                }
            ],
            language="kaz",
        )

        bodies = [
            call.kwargs["body"]
            for call in forms_service.forms.return_value.batchUpdate.call_args_list
        ]

        self.assertEqual(
            bodies[0]["requests"],
            [
                {"deleteItem": {"location": {"index": 2}}},
                {"deleteItem": {"location": {"index": 1}}},
                {"deleteItem": {"location": {"index": 0}}},
            ],
        )
        self.assertIn("createItem", bodies[1]["requests"][0])
        self.assertIn("createItem", bodies[2]["requests"][0])
        self.assertNotIn("updateItem", str(bodies))
