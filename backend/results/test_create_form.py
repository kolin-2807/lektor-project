import os

import django


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from results.google_forms_service import add_questions_to_form, create_google_form
from users.models import GoogleDriveConnection


questions = [
    {
        "question": "Android қандай құрылғыға арналған операциялық жүйе?",
        "options": [
            "Смартфондар мен планшеттерге",
            "Тек принтерлерге",
            "Тек серверлерге",
            "Тек телевизорларға",
        ],
    },
    {
        "question": "Ақпараттық қауіпсіздіктің мақсаты қандай?",
        "options": [
            "Деректерді қорғау",
            "Дизайнды өзгерту",
            "Файл өлшемін үлкейту",
            "Жүйені баяулату",
        ],
    },
]

connection = GoogleDriveConnection.objects.order_by("-updated_at").first()
if not connection:
    raise SystemExit("No GoogleDriveConnection found. Connect a Google account first.")

form = create_google_form(connection, "5-Дәріс тесті")
add_questions_to_form(connection, form["formId"], questions)

print(form["formId"])
print(form["responderUri"])
print(connection.google_email)
