import os
from unittest import skipUnless

from django.test import TestCase

from results.google_forms_service import add_questions_to_form, create_google_form
from users.models import GoogleDriveConnection


@skipUnless(os.getenv("RUN_LIVE_GOOGLE_TESTS") == "1", "Live Google Form smoke test is disabled.")
class LiveGoogleFormSmokeTests(TestCase):
    def test_create_form_with_latest_connected_account(self):
        connection = GoogleDriveConnection.objects.order_by("-updated_at").first()
        self.assertIsNotNone(connection, "Connect a Google account first.")

        questions = [
            {
                "question": "Android қандай құрылғыға арналған операциялық жүйе?",
                "options": [
                    "Смартфондар мен планшеттерге",
                    "Тек принтерлерге",
                    "Тек серверлерге",
                    "Тек телевизорларға",
                ],
                "answer": "A",
            },
            {
                "question": "Ақпараттық қауіпсіздіктің мақсаты қандай?",
                "options": [
                    "Деректерді қорғау",
                    "Дизайнды өзгерту",
                    "Файл өлшемін үлкейту",
                    "Жүйені баяулату",
                ],
                "answer": "A",
            },
        ]

        form = create_google_form(connection, "Live smoke test")
        add_questions_to_form(connection, form["formId"], questions)

        self.assertTrue(form.get("formId"))
        self.assertTrue(form.get("responderUri"))
