from results.google_forms_service import create_google_form, add_questions_to_form

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

form = create_google_form("5-Дәріс тесті")
add_questions_to_form(form["formId"], questions)

print(form["formId"])
print(form["responderUri"])