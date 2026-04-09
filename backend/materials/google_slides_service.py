import re

from google.auth.transport.requests import Request
from googleapiclient.discovery import build

from users.google_oauth import bypass_broken_local_proxy, credentials_from_dict, credentials_to_dict


def _refresh_connection_credentials(connection):
    credentials = credentials_from_dict(connection.credentials_json)

    if credentials.expired and credentials.refresh_token:
        with bypass_broken_local_proxy():
            credentials.refresh(Request())
        connection.credentials_json = credentials_to_dict(credentials)
        connection.save(update_fields=["credentials_json", "updated_at"])

    return credentials


def _build_services(connection):
    credentials = _refresh_connection_credentials(connection)

    with bypass_broken_local_proxy():
        slides_service = build("slides", "v1", credentials=credentials)
        drive_service = build("drive", "v3", credentials=credentials)

    return slides_service, drive_service


def _safe_object_id(prefix: str, index: int | None = None) -> str:
    value = f"{prefix}_{index}" if index is not None else prefix
    normalized = re.sub(r"[^A-Za-z0-9_]", "_", value)
    normalized = normalized.strip("_") or "slide_item"

    if not re.match(r"^[A-Za-z_]", normalized):
        normalized = f"id_{normalized}"

    return normalized[:48]


def _pt(value: float) -> dict:
    return {"magnitude": value, "unit": "PT"}


def _normalize_bullets(raw_bullets) -> list[str]:
    bullets = []

    for item in raw_bullets or []:
        text = " ".join(str(item or "").strip().split())
        if text:
            bullets.append(text[:240])

    return bullets[:5]


def _text_box_request(object_id: str, page_id: str, x: float, y: float, width: float, height: float):
    return {
        "createShape": {
            "objectId": object_id,
            "shapeType": "TEXT_BOX",
            "elementProperties": {
                "pageObjectId": page_id,
                "size": {
                    "width": _pt(width),
                    "height": _pt(height),
                },
                "transform": {
                    "scaleX": 1,
                    "scaleY": 1,
                    "translateX": x,
                    "translateY": y,
                    "unit": "PT",
                },
            },
        }
    }


def _move_file_to_folder(drive_service, file_id: str, folder_id: str):
    if not file_id or not folder_id:
        return

    with bypass_broken_local_proxy():
        meta = drive_service.files().get(fileId=file_id, fields="parents").execute()

    existing_parents = ",".join(meta.get("parents", []))
    update_kwargs = {
        "fileId": file_id,
        "addParents": folder_id,
        "fields": "id, parents",
    }

    if existing_parents:
        update_kwargs["removeParents"] = existing_parents

    with bypass_broken_local_proxy():
        drive_service.files().update(**update_kwargs).execute()


def create_presentation_from_outline(
    connection,
    title: str,
    subtitle: str,
    slides: list[dict],
    folder_id: str = "",
    language: str = "kaz",
) -> dict:
    slides_service, drive_service = _build_services(connection)
    safe_title = " ".join((title or "").split()) or "AI Slides"
    safe_subtitle = " ".join((subtitle or "").split())

    with bypass_broken_local_proxy():
        presentation = slides_service.presentations().create(body={"title": safe_title}).execute()

    presentation_id = presentation.get("presentationId", "")
    default_slides = presentation.get("slides", [])
    default_slide_id = default_slides[0].get("objectId") if default_slides else ""

    requests = []

    title_slide_id = _safe_object_id("title_slide")
    title_box_id = _safe_object_id("title_box")
    subtitle_box_id = _safe_object_id("subtitle_box")

    requests.extend([
        {
            "createSlide": {
                "objectId": title_slide_id,
                "slideLayoutReference": {"predefinedLayout": "BLANK"},
            }
        },
        _text_box_request(title_box_id, title_slide_id, 48, 88, 620, 120),
        _text_box_request(subtitle_box_id, title_slide_id, 52, 232, 580, 54),
        {"insertText": {"objectId": title_box_id, "insertionIndex": 0, "text": safe_title}},
        {"insertText": {"objectId": subtitle_box_id, "insertionIndex": 0, "text": safe_subtitle or safe_title}},
        {
            "updateTextStyle": {
                "objectId": title_box_id,
                "textRange": {"type": "ALL"},
                "style": {
                    "bold": True,
                    "fontSize": _pt(30),
                    "foregroundColor": {
                        "opaqueColor": {"rgbColor": {"red": 0.13, "green": 0.17, "blue": 0.31}}
                    },
                },
                "fields": "bold,fontSize,foregroundColor",
            }
        },
        {
            "updateTextStyle": {
                "objectId": subtitle_box_id,
                "textRange": {"type": "ALL"},
                "style": {
                    "fontSize": _pt(16),
                    "foregroundColor": {
                        "opaqueColor": {"rgbColor": {"red": 0.29, "green": 0.35, "blue": 0.48}}
                    },
                },
                "fields": "fontSize,foregroundColor",
            }
        },
    ])

    for index, slide in enumerate(slides, start=1):
        slide_id = _safe_object_id("slide", index)
        title_id = _safe_object_id("slide_title", index)
        body_id = _safe_object_id("slide_body", index)
        slide_title = " ".join(str(slide.get("title") or "").split()) or f"Slide {index}"
        slide_bullets = _normalize_bullets(slide.get("bullets"))
        body_text = "\n".join(slide_bullets) or " "

        requests.extend([
            {
                "createSlide": {
                    "objectId": slide_id,
                    "slideLayoutReference": {"predefinedLayout": "BLANK"},
                }
            },
            _text_box_request(title_id, slide_id, 46, 42, 640, 64),
            _text_box_request(body_id, slide_id, 54, 128, 600, 278),
            {"insertText": {"objectId": title_id, "insertionIndex": 0, "text": slide_title}},
            {"insertText": {"objectId": body_id, "insertionIndex": 0, "text": body_text}},
            {
                "createParagraphBullets": {
                    "objectId": body_id,
                    "textRange": {"type": "ALL"},
                    "bulletPreset": "BULLET_DISC_CIRCLE_SQUARE",
                }
            },
            {
                "updateTextStyle": {
                    "objectId": title_id,
                    "textRange": {"type": "ALL"},
                    "style": {
                        "bold": True,
                        "fontSize": _pt(24),
                        "foregroundColor": {
                            "opaqueColor": {"rgbColor": {"red": 0.14, "green": 0.18, "blue": 0.31}}
                        },
                    },
                    "fields": "bold,fontSize,foregroundColor",
                }
            },
            {
                "updateTextStyle": {
                    "objectId": body_id,
                    "textRange": {"type": "ALL"},
                    "style": {
                        "fontSize": _pt(16),
                        "foregroundColor": {
                            "opaqueColor": {"rgbColor": {"red": 0.21, "green": 0.25, "blue": 0.36}}
                        },
                    },
                    "fields": "fontSize,foregroundColor",
                }
            },
        ])

    closing_slide_id = _safe_object_id("closing_slide")
    closing_title_id = _safe_object_id("closing_title")
    closing_subtitle_id = _safe_object_id("closing_subtitle")
    closing_title = "Спасибо за внимание" if language == "rus" else "Назарларыңызға рахмет"
    closing_subtitle = "Сұрақтарыңыз болса, қоя аласыздар." if language != "rus" else "Если есть вопросы, можете задать их."

    requests.extend([
        {
            "createSlide": {
                "objectId": closing_slide_id,
                "slideLayoutReference": {"predefinedLayout": "BLANK"},
            }
        },
        _text_box_request(closing_title_id, closing_slide_id, 72, 140, 560, 80),
        _text_box_request(closing_subtitle_id, closing_slide_id, 96, 250, 500, 42),
        {"insertText": {"objectId": closing_title_id, "insertionIndex": 0, "text": closing_title}},
        {"insertText": {"objectId": closing_subtitle_id, "insertionIndex": 0, "text": closing_subtitle}},
        {
            "updateTextStyle": {
                "objectId": closing_title_id,
                "textRange": {"type": "ALL"},
                "style": {
                    "bold": True,
                    "fontSize": _pt(28),
                    "foregroundColor": {
                        "opaqueColor": {"rgbColor": {"red": 0.13, "green": 0.17, "blue": 0.31}}
                    },
                },
                "fields": "bold,fontSize,foregroundColor",
            }
        },
        {
            "updateParagraphStyle": {
                "objectId": closing_title_id,
                "textRange": {"type": "ALL"},
                "style": {"alignment": "CENTER"},
                "fields": "alignment",
            }
        },
        {
            "updateTextStyle": {
                "objectId": closing_subtitle_id,
                "textRange": {"type": "ALL"},
                "style": {
                    "fontSize": _pt(15),
                    "foregroundColor": {
                        "opaqueColor": {"rgbColor": {"red": 0.29, "green": 0.35, "blue": 0.48}}
                    },
                },
                "fields": "fontSize,foregroundColor",
            }
        },
        {
            "updateParagraphStyle": {
                "objectId": closing_subtitle_id,
                "textRange": {"type": "ALL"},
                "style": {"alignment": "CENTER"},
                "fields": "alignment",
            }
        },
    ])

    if default_slide_id:
        requests.append({"deleteObject": {"objectId": default_slide_id}})

    with bypass_broken_local_proxy():
        slides_service.presentations().batchUpdate(
            presentationId=presentation_id,
            body={"requests": requests},
        ).execute()

    _move_file_to_folder(drive_service, presentation_id, folder_id)

    base_url = f"https://docs.google.com/presentation/d/{presentation_id}"
    return {
        "presentation_id": presentation_id,
        "slides_url": f"{base_url}/edit",
        "slides_embed_url": f"{base_url}/embed?start=false&loop=false&delayms=4000",
        "slides_download_url": f"{base_url}/export/pptx",
    }
