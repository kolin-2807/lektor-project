from googleapiclient.discovery import build

from users.google_oauth import bypass_broken_local_proxy

from .google_service import get_google_credentials


def create_google_form(connection, title: str):
    with bypass_broken_local_proxy():
        creds = get_google_credentials(connection)
        forms_service = build("forms", "v1", credentials=creds)
        form_body = {"info": {"title": title}}
        return forms_service.forms().create(body=form_body).execute()


def update_form_description(connection, form_id: str, description: str):
    with bypass_broken_local_proxy():
        creds = get_google_credentials(connection)
        forms_service = build("forms", "v1", credentials=creds)
        update = {
            "requests": [
                {
                    "updateFormInfo": {
                        "info": {
                            "description": description,
                        },
                        "updateMask": "description",
                    }
                }
            ]
        }
        forms_service.forms().batchUpdate(formId=form_id, body=update).execute()


def set_form_publish_state(connection, form_id: str, *, is_published: bool, is_accepting_responses: bool):
    with bypass_broken_local_proxy():
        creds = get_google_credentials(connection)
        forms_service = build("forms", "v1", credentials=creds)
        forms_service.forms().setPublishSettings(
            formId=form_id,
            body={
                "publishSettings": {
                    "publishState": {
                        "isPublished": is_published,
                        "isAcceptingResponses": is_accepting_responses,
                    }
                }
            },
        ).execute()


def _get_student_name_label(language: str = "kaz") -> str:
    labels = {
        "kaz": "Аты-жөніңіз",
        "rus": "Имя и фамилия",
        "eng": "Full name",
    }
    return labels.get((language or "kaz").strip().lower(), labels["kaz"])


def _build_name_item_request(language: str = "kaz"):
    return {
        "createItem": {
            "item": {
                "title": _get_student_name_label(language),
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


def _build_update_name_item_request(item: dict, language: str = "kaz"):
    return {
        "updateItem": {
            "item": {
                "itemId": item.get("itemId", ""),
                "title": _get_student_name_label(language),
            },
            "location": {"index": 0},
            "updateMask": "title",
        }
    }


def _build_question_create_requests(questions: list):
    requests = []
    for index, question in enumerate(questions, start=1):
        requests.append(
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
    return requests


def add_questions_to_form(connection, form_id: str, questions: list, language: str = "kaz"):
    with bypass_broken_local_proxy():
        creds = get_google_credentials(connection)
        forms_service = build("forms", "v1", credentials=creds)

        forms_service.forms().batchUpdate(
            formId=form_id,
            body={"requests": [_build_name_item_request(language)]},
        ).execute()

        question_requests = _build_question_create_requests(questions)
        if question_requests:
            forms_service.forms().batchUpdate(
                formId=form_id,
                body={"requests": question_requests},
            ).execute()


def replace_questions_in_form(connection, form_id: str, questions: list, language: str = "kaz"):
    with bypass_broken_local_proxy():
        creds = get_google_credentials(connection)
        forms_service = build("forms", "v1", credentials=creds)
        form = forms_service.forms().get(formId=form_id).execute()
        items = form.get("items", []) or []

        delete_requests = [
            {
                "deleteItem": {
                    "location": {"index": index},
                }
            }
            for index in range(len(items) - 1, 0, -1)
        ]

        if delete_requests:
            forms_service.forms().batchUpdate(
                formId=form_id,
                body={"requests": delete_requests},
            ).execute()

        if items:
            forms_service.forms().batchUpdate(
                formId=form_id,
                body={"requests": [_build_update_name_item_request(items[0], language)]},
            ).execute()

        if not items:
            forms_service.forms().batchUpdate(
                formId=form_id,
                body={"requests": [_build_name_item_request(language)]},
            ).execute()

        question_requests = _build_question_create_requests(questions)
        if question_requests:
            forms_service.forms().batchUpdate(
                formId=form_id,
                body={"requests": question_requests},
            ).execute()


def get_form_responses(connection, form_id: str):
    with bypass_broken_local_proxy():
        creds = get_google_credentials(connection)
        forms_service = build("forms", "v1", credentials=creds)
        result = forms_service.forms().responses().list(formId=form_id).execute()
        return result.get("responses", [])


def get_form_questions(connection, form_id: str):
    with bypass_broken_local_proxy():
        creds = get_google_credentials(connection)
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
