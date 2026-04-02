from googleapiclient.discovery import build

from users.google_oauth import bypass_broken_local_proxy

from .google_service import get_google_credentials


def create_google_form(title: str):
    with bypass_broken_local_proxy():
        creds = get_google_credentials()
        forms_service = build("forms", "v1", credentials=creds)
        form_body = {"info": {"title": title}}
        return forms_service.forms().create(body=form_body).execute()


def add_questions_to_form(form_id: str, questions: list):
    with bypass_broken_local_proxy():
        creds = get_google_credentials()
        forms_service = build("forms", "v1", credentials=creds)

        name_request = {
            "requests": [
                {
                    "createItem": {
                        "item": {
                            "title": "Аты-жөніңіз",
                            "questionItem": {
                                "question": {
                                    "required": True,
                                    "textQuestion": {"paragraph": False},
                                }
                            },
                        },
                        "location": {"index": 0},
                    }
                }
            ]
        }
        forms_service.forms().batchUpdate(formId=form_id, body=name_request).execute()

        question_requests = []
        for index, question in enumerate(questions, start=1):
            question_requests.append(
                {
                    "createItem": {
                        "item": {
                            "title": question["question"],
                            "questionItem": {
                                "question": {
                                    "required": True,
                                    "choiceQuestion": {
                                        "type": "RADIO",
                                        "options": [{"value": option} for option in question["options"]],
                                        "shuffle": False,
                                    },
                                }
                            },
                        },
                        "location": {"index": index},
                    }
                }
            )

        forms_service.forms().batchUpdate(
            formId=form_id,
            body={"requests": question_requests},
        ).execute()


def get_form_responses(form_id: str):
    with bypass_broken_local_proxy():
        creds = get_google_credentials()
        forms_service = build("forms", "v1", credentials=creds)
        result = forms_service.forms().responses().list(formId=form_id).execute()
        return result.get("responses", [])


def get_form_questions(form_id: str):
    with bypass_broken_local_proxy():
        creds = get_google_credentials()
        forms_service = build("forms", "v1", credentials=creds)
        form = forms_service.forms().get(formId=form_id).execute()

    questions = []
    for item in form.get("items", []):
        question_item = item.get("questionItem") or {}
        question = question_item.get("question") or {}
        question_id = question.get("questionId")

        if not question_id:
            continue

        questions.append(
            {
                "question_id": question_id,
                "title": item.get("title", "").strip(),
            }
        )

    return questions
