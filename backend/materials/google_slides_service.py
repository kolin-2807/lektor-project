import re

from google.auth.transport.requests import Request
from googleapiclient.discovery import build

from users.google_oauth import (
    GOOGLE_DRIVE_FULL_SCOPE,
    bypass_broken_local_proxy,
    credentials_from_dict,
    credentials_to_dict,
    ensure_google_credentials_ready,
    has_google_scope,
)
from .slide_templates import get_slide_template_definition, is_master_slide_template


def _refresh_connection_credentials(connection):
    credentials = credentials_from_dict(connection.credentials_json)

    if credentials.expired and credentials.refresh_token:
        with bypass_broken_local_proxy():
            credentials.refresh(Request())
        connection.credentials_json = credentials_to_dict(credentials)
        connection.save(update_fields=["credentials_json", "updated_at"])

    ensure_google_credentials_ready(credentials)

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


THEME = {
    "paper": {"red": 0.955, "green": 0.965, "blue": 0.976},
    "ink": {"red": 0.07, "green": 0.105, "blue": 0.18},
    "muted": {"red": 0.35, "green": 0.4, "blue": 0.5},
    "primary_dark": {"red": 0.035, "green": 0.13, "blue": 0.25},
    "accent": {"red": 0.82, "green": 0.57, "blue": 0.18},
    "white": {"red": 1, "green": 1, "blue": 1},
    "line": {"red": 0.80, "green": 0.86, "blue": 0.92},
    "mark": {"red": 1, "green": 1, "blue": 1},
}


TEMPLATE_THEMES = {
    "ilector-minimal": {
        "paper": {"red": 0.965, "green": 0.972, "blue": 0.985},
        "ink": {"red": 0.05, "green": 0.12, "blue": 0.22},
        "muted": {"red": 0.34, "green": 0.39, "blue": 0.48},
        "primary_dark": {"red": 0.04, "green": 0.16, "blue": 0.3},
        "accent": {"red": 0.72, "green": 0.55, "blue": 0.22},
        "white": {"red": 1, "green": 1, "blue": 1},
        "line": {"red": 0.78, "green": 0.84, "blue": 0.91},
        "mark": {"red": 1, "green": 1, "blue": 1},
    },
    "ilector-focus": {
        "paper": {"red": 0.985, "green": 0.982, "blue": 0.972},
        "ink": {"red": 0.03, "green": 0.03, "blue": 0.03},
        "muted": {"red": 0.38, "green": 0.38, "blue": 0.38},
        "primary_dark": {"red": 0.985, "green": 0.982, "blue": 0.972},
        "accent": {"red": 0.03, "green": 0.03, "blue": 0.03},
        "white": {"red": 1, "green": 1, "blue": 1},
        "line": {"red": 0.74, "green": 0.74, "blue": 0.72},
        "mark": {"red": 0.03, "green": 0.03, "blue": 0.03},
    },
}

MASTER_TEMPLATE_PLACEHOLDERS = {
    "presentation_title": "{{PRESENTATION_TITLE}}",
    "presentation_subtitle": "{{PRESENTATION_SUBTITLE}}",
    "slide_title": "{{SLIDE_TITLE}}",
    "slide_body": "{{SLIDE_BODY}}",
    "slide_number": "{{SLIDE_NUMBER}}",
}

MASTER_TEMPLATE_TEXT_STYLE_FIELDS = [
    "bold",
    "italic",
    "fontSize",
    "foregroundColor",
    "weightedFontFamily",
]
MASTER_TEMPLATE_PARAGRAPH_STYLE_FIELDS = [
    "alignment",
    "lineSpacing",
]


def _template_theme(template_id: str) -> dict:
    theme = {**THEME}
    theme.update(TEMPLATE_THEMES.get(template_id, {}))
    return theme


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


def _shape_request(
    object_id: str,
    page_id: str,
    shape_type: str,
    x: float,
    y: float,
    width: float,
    height: float,
):
    return {
        "createShape": {
            "objectId": object_id,
            "shapeType": shape_type,
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


def _page_background_request(page_id: str, theme: dict | None = None):
    theme = theme or THEME
    return {
        "updatePageProperties": {
            "objectId": page_id,
            "pageProperties": {
                "pageBackgroundFill": {
                    "solidFill": {
                        "color": {"rgbColor": theme["paper"]},
                    }
                }
            },
            "fields": "pageBackgroundFill.solidFill.color",
        }
    }


def _shape_style_request(object_id: str, fill: dict, outline: dict | None = None, weight: float = 0.5):
    outline_color = outline or fill
    return {
        "updateShapeProperties": {
            "objectId": object_id,
            "shapeProperties": {
                "shapeBackgroundFill": {
                    "solidFill": {
                        "color": {"rgbColor": fill},
                    }
                },
                "outline": {
                    "outlineFill": {
                        "solidFill": {
                            "color": {"rgbColor": outline_color},
                        }
                    },
                    "weight": _pt(weight),
                },
            },
            "fields": "shapeBackgroundFill.solidFill.color,outline.outlineFill.solidFill.color,outline.weight",
        }
    }


def _shape_content_alignment_request(object_id: str, alignment: str = "MIDDLE"):
    return {
        "updateShapeProperties": {
            "objectId": object_id,
            "shapeProperties": {
                "contentAlignment": alignment,
            },
            "fields": "contentAlignment",
        }
    }


def _text_style_request(
    object_id: str,
    font_size: float,
    color: dict,
    bold: bool = False,
    font_family: str = "Arial",
    fields: str = "bold,fontSize,foregroundColor,weightedFontFamily",
):
    return {
        "updateTextStyle": {
            "objectId": object_id,
            "textRange": {"type": "ALL"},
            "style": {
                "bold": bold,
                "fontSize": _pt(font_size),
                "foregroundColor": {
                    "opaqueColor": {"rgbColor": color},
                },
                "weightedFontFamily": {
                    "fontFamily": font_family,
                    "weight": 700 if bold else 400,
                },
            },
            "fields": fields,
        }
    }


def _paragraph_style_request(object_id: str, alignment: str = "START", line_spacing: float | None = None):
    style = {"alignment": alignment}
    fields = ["alignment"]

    if line_spacing is not None:
        style["lineSpacing"] = line_spacing
        fields.append("lineSpacing")

    return {
        "updateParagraphStyle": {
            "objectId": object_id,
            "textRange": {"type": "ALL"},
            "style": style,
            "fields": ",".join(fields),
        }
    }


def _move_file_to_folder(drive_service, file_id: str, folder_id: str):
    if not file_id or not folder_id:
        return

    with bypass_broken_local_proxy():
        meta = drive_service.files().get(
            fileId=file_id,
            fields="parents",
            supportsAllDrives=True,
        ).execute()

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


def _collect_presentation_object_ids(presentation: dict) -> tuple[set[str], set[str]]:
    page_ids = set()
    element_ids = set()

    for slide in presentation.get("slides", []) or []:
        page_id = slide.get("objectId")
        if page_id:
            page_ids.add(page_id)

        for element in _iter_page_elements(slide.get("pageElements", []) or []):
            element_id = element.get("objectId")
            if element_id:
                element_ids.add(element_id)

    return page_ids, element_ids


def _presentation_page_ids(presentation: dict) -> list[str]:
    return [
        slide.get("objectId")
        for slide in presentation.get("slides", []) or []
        if slide.get("objectId")
    ]


def _presentation_element_ids(presentation: dict) -> list[str]:
    ids = []

    for slide in presentation.get("slides", []) or []:
        for element in _iter_page_elements(slide.get("pageElements", []) or []):
            element_id = element.get("objectId")
            if element_id:
                ids.append(element_id)

    return ids


def _iter_page_elements(page_elements: list[dict]) -> list[dict]:
    elements = []

    for element in page_elements or []:
        if not isinstance(element, dict):
            continue

        elements.append(element)
        group = element.get("elementGroup") or {}
        children = group.get("children") or []
        if children:
            elements.extend(_iter_page_elements(children))

    return elements


def _text_from_shape(element: dict) -> str:
    text_parts = []

    for text_element in element.get("shape", {}).get("text", {}).get("textElements", []) or []:
        content = text_element.get("textRun", {}).get("content")
        if content:
            text_parts.append(content)

    return "".join(text_parts).strip()


def _normalize_placeholder_fragment(value: str) -> str:
    return re.sub(r"[\s_\-]+", "", str(value or ""))


def _extract_master_text_style(shape: dict) -> tuple[dict, str]:
    style = {}

    for text_element in shape.get("text", {}).get("textElements", []) or []:
        text_run = text_element.get("textRun") or {}
        text_style = text_run.get("style") or {}

        for field_name in MASTER_TEMPLATE_TEXT_STYLE_FIELDS:
            if field_name in text_style and field_name not in style:
                style[field_name] = text_style[field_name]

        if style:
            break

    fields = ",".join(field_name for field_name in MASTER_TEMPLATE_TEXT_STYLE_FIELDS if field_name in style)
    return style, fields


def _extract_master_paragraph_style(shape: dict) -> tuple[dict, str]:
    style = {}

    for text_element in shape.get("text", {}).get("textElements", []) or []:
        paragraph_marker = text_element.get("paragraphMarker") or {}
        paragraph_style = paragraph_marker.get("style") or {}

        for field_name in MASTER_TEMPLATE_PARAGRAPH_STYLE_FIELDS:
            if field_name in paragraph_style and field_name not in style:
                style[field_name] = paragraph_style[field_name]

        if style:
            break

    fields = ",".join(field_name for field_name in MASTER_TEMPLATE_PARAGRAPH_STYLE_FIELDS if field_name in style)
    return style, fields


def _find_master_placeholder_slide_elements(slide: dict, placeholder: str) -> list[dict]:
    placeholder_text = str(placeholder or "")
    normalized_placeholder = _normalize_placeholder_fragment(placeholder_text)
    placeholder_core = placeholder_text.replace("{", "").replace("}", "")
    normalized_core = _normalize_placeholder_fragment(placeholder_core)
    page_elements = _iter_page_elements(slide.get("pageElements", []) or [])

    full_matches = []
    core_matches = []
    brace_matches = []

    for element in page_elements:
        shape = element.get("shape") or {}
        if not shape:
            continue

        shape_text = _text_from_shape(element)
        normalized_shape_text = _normalize_placeholder_fragment(shape_text)
        if not normalized_shape_text:
            continue

        if normalized_placeholder and normalized_placeholder in normalized_shape_text:
            full_matches.append(element)
            continue

        if normalized_core and normalized_core in normalized_shape_text:
            core_matches.append(element)
            continue

        if normalized_shape_text in {"{{", "}}", "{", "}"}:
            brace_matches.append(element)

    if full_matches:
        return full_matches

    if core_matches:
        return [*core_matches, *brace_matches]

    return []


def _anchor_master_placeholder_element(elements: list[dict]) -> dict | None:
    if not elements:
        return None

    return max(
        elements,
        key=lambda item: len(_normalize_placeholder_fragment(_text_from_shape(item))),
    )


def _extract_master_placeholder_style_blueprint(slide: dict) -> dict:
    blueprint = {}

    for placeholder in MASTER_TEMPLATE_PLACEHOLDERS.values():
        matching_elements = _find_master_placeholder_slide_elements(slide, placeholder)
        anchor_element = _anchor_master_placeholder_element(matching_elements)
        if not anchor_element:
            continue

        shape = anchor_element.get("shape") or {}
        if not shape:
            continue

        text_style, text_fields = _extract_master_text_style(shape)
        paragraph_style, paragraph_fields = _extract_master_paragraph_style(shape)
        blueprint[placeholder] = {
            "text_style": text_style,
            "text_fields": text_fields,
            "paragraph_style": paragraph_style,
            "paragraph_fields": paragraph_fields,
        }

    return blueprint


def _adapt_master_placeholder_text_style(style: dict, placeholder: str, replacement_text: str) -> dict:
    normalized_text = " ".join(str(replacement_text or "").split())
    if not normalized_text:
        return style

    font_size = ((style or {}).get("fontSize") or {}).get("magnitude")
    if not font_size:
        return style

    visible_length = len(re.sub(r"\s+", "", normalized_text))
    scale = 1.0

    if placeholder == MASTER_TEMPLATE_PLACEHOLDERS["presentation_title"]:
        if visible_length >= 68:
            scale = 0.66
        elif visible_length >= 54:
            scale = 0.76
        elif visible_length >= 42:
            scale = 0.86
    elif placeholder == MASTER_TEMPLATE_PLACEHOLDERS["slide_title"]:
        if visible_length >= 56:
            scale = 0.72
        elif visible_length >= 42:
            scale = 0.82

    if scale >= 0.999:
        return style

    adapted_style = dict(style)
    adapted_style["fontSize"] = {
        **dict(adapted_style.get("fontSize") or {}),
        "magnitude": max(round(float(font_size) * scale, 2), 14.0),
    }
    return adapted_style


def _collect_master_placeholder_style_requests(
    presentation: dict,
    placeholder_blueprint: dict | None = None,
    slide_ids: list[str] | None = None,
    placeholder_text_map: dict[str, str] | None = None,
) -> list[dict]:
    requests: list[dict] = []
    allowed_slide_ids = set(slide_ids or [])

    for slide in presentation.get("slides", []) or []:
        slide_id = slide.get("objectId")
        if allowed_slide_ids and slide_id not in allowed_slide_ids:
            continue

        for matched_placeholder in MASTER_TEMPLATE_PLACEHOLDERS.values():
            if placeholder_text_map is not None:
                replacement_text = placeholder_text_map.get(matched_placeholder)
                if replacement_text is None or replacement_text == "":
                    continue

            matching_elements = _find_master_placeholder_slide_elements(slide, matched_placeholder)
            anchor_element = _anchor_master_placeholder_element(matching_elements)
            if not anchor_element:
                continue

            object_id = anchor_element.get("objectId")
            shape = anchor_element.get("shape") or {}
            if not object_id or not shape:
                continue

            if placeholder_blueprint and matched_placeholder in placeholder_blueprint:
                text_style = placeholder_blueprint[matched_placeholder].get("text_style") or {}
                text_fields = placeholder_blueprint[matched_placeholder].get("text_fields") or ""
                paragraph_style = placeholder_blueprint[matched_placeholder].get("paragraph_style") or {}
                paragraph_fields = placeholder_blueprint[matched_placeholder].get("paragraph_fields") or ""
            else:
                text_style, text_fields = _extract_master_text_style(shape)
                paragraph_style, paragraph_fields = _extract_master_paragraph_style(shape)

            if placeholder_text_map is not None and matched_placeholder in placeholder_text_map:
                text_style = _adapt_master_placeholder_text_style(
                    text_style,
                    matched_placeholder,
                    placeholder_text_map.get(matched_placeholder) or "",
                )

            if text_style and text_fields:
                requests.append(
                    {
                        "updateTextStyle": {
                            "objectId": object_id,
                            "textRange": {"type": "ALL"},
                            "style": text_style,
                            "fields": text_fields,
                        }
                    }
                )

            if paragraph_style and paragraph_fields:
                requests.append(
                    {
                        "updateParagraphStyle": {
                            "objectId": object_id,
                            "textRange": {"type": "ALL"},
                            "style": paragraph_style,
                            "fields": paragraph_fields,
                        }
                    }
                )

    return requests


def _presentation_text_by_object_id(presentation: dict, object_id: str) -> str:
    for slide in presentation.get("slides", []) or []:
        for element in _iter_page_elements(slide.get("pageElements", []) or []):
            if element.get("objectId") == object_id:
                return _text_from_shape(element)

    return ""


def _body_text_to_bullets(text: str) -> list[str]:
    bullets = []

    for line in str(text or "").splitlines():
        item = re.sub(r"^\s*(?:[\u2022\-]|\d{1,2}[.)]?)\s*", "", line).strip()
        if item:
            bullets.append(item)

    return _normalize_bullets(bullets)


def _is_default_slide_title(text: str) -> bool:
    return bool(re.fullmatch(r"Slide\s+\d+", str(text or "").strip(), flags=re.IGNORECASE))


def _minimalist_visible_bullets_from_presentation(presentation: dict, slide_index: int) -> list[str]:
    bullets = []

    for item_index in range(1, 5):
        text = _presentation_text_by_object_id(
            presentation,
            _safe_object_id(f"{_safe_object_id('minimal', slide_index)}_list_text", item_index),
        )
        if text:
            bullets.append(text)

    if bullets:
        return _normalize_bullets(bullets)

    for item_index in range(1, 5):
        text = _presentation_text_by_object_id(
            presentation,
            _safe_object_id(f"{_safe_object_id('minimal', slide_index)}_roadmap_text", item_index),
        )
        if text:
            bullets.append(text)

    if bullets:
        return _normalize_bullets(bullets)

    for row_index in range(1, 5):
        row_parts = []
        for col_index in range(1, 5):
            text = _presentation_text_by_object_id(
                presentation,
                _safe_object_id(f"{_safe_object_id('minimal', slide_index)}_table_c_{row_index}", col_index),
            )
            if text:
                row_parts.append(text)
        if row_parts:
            bullets.append(" - ".join(row_parts))

    return _normalize_bullets(bullets)


def _extract_outline_from_presentation(presentation: dict, total_slide_count: int) -> tuple[str, str, list[dict]]:
    title = _presentation_text_by_object_id(presentation, _safe_object_id("title_box")) or "Presentation"
    subtitle = _presentation_text_by_object_id(presentation, _safe_object_id("subtitle_box")) or title
    slides = []
    content_slide_count = max(int(total_slide_count or 0) - 2, 0)

    for index in range(1, content_slide_count + 1):
        slide_title = _presentation_text_by_object_id(presentation, _safe_object_id("slide_title", index))
        body_text = _presentation_text_by_object_id(presentation, _safe_object_id("slide_body", index))
        bullets = _body_text_to_bullets(body_text)
        if not bullets:
            bullets = _minimalist_visible_bullets_from_presentation(presentation, index)
        if bullets or (slide_title and not _is_default_slide_title(slide_title)):
            slides.append({
                "title": slide_title or f"Slide {index}",
                "bullets": bullets,
            })

    return title, subtitle, slides


def extract_presentation_outline(connection, presentation_id: str, total_slide_count: int) -> dict:
    if not presentation_id:
        raise ValueError("presentation_id is required.")

    slides_service, _ = _build_services(connection)
    with bypass_broken_local_proxy():
        presentation = slides_service.presentations().get(presentationId=presentation_id).execute()

    title, subtitle, slides = _extract_outline_from_presentation(presentation, total_slide_count)
    return {
        "presentation_title": title,
        "presentation_subtitle": subtitle,
        "slides": slides,
    }


def _copy_presentation_template(drive_service, source_presentation_id: str, new_title: str) -> str:
    with bypass_broken_local_proxy():
        created_file = drive_service.files().copy(
            fileId=source_presentation_id,
            body={"name": new_title},
            fields="id",
            supportsAllDrives=True,
        ).execute()

    return str(created_file.get("id") or "").strip()


def _replace_all_text_request(match_text: str, replace_text: str, page_ids: list[str] | None = None) -> dict:
    request = {
        "replaceAllText": {
            "containsText": {
                "text": match_text,
                "matchCase": True,
            },
            "replaceText": replace_text,
        }
    }
    if page_ids:
        request["replaceAllText"]["pageObjectIds"] = page_ids
    return request


def _replace_shape_text_requests(object_id: str, text: str) -> list[dict]:
    return [
        {
            "deleteText": {
                "objectId": object_id,
                "textRange": {"type": "ALL"},
            }
        },
        {
            "insertText": {
                "objectId": object_id,
                "insertionIndex": 0,
                "text": text,
            }
        },
    ]


def _collect_master_placeholder_content_requests(
    presentation: dict,
    replacement_map: dict[str, str],
    slide_ids: list[str] | None = None,
) -> list[dict]:
    requests: list[dict] = []
    allowed_slide_ids = set(slide_ids or [])

    for slide in presentation.get("slides", []) or []:
        slide_id = slide.get("objectId")
        if allowed_slide_ids and slide_id not in allowed_slide_ids:
            continue

        for placeholder, replacement_text in replacement_map.items():
            matching_elements = _find_master_placeholder_slide_elements(slide, placeholder)
            anchor_element = _anchor_master_placeholder_element(matching_elements)
            if not anchor_element:
                continue

            anchor_object_id = anchor_element.get("objectId")
            if not anchor_object_id:
                continue

            requests.extend(
                _replace_shape_text_requests(
                    object_id=anchor_object_id,
                    text=replacement_text,
                )
            )

            for element in matching_elements:
                object_id = element.get("objectId")
                if object_id and object_id != anchor_object_id:
                    requests.append({"deleteObject": {"objectId": object_id}})

    return requests


def _master_template_requests(
    presentation: dict,
    slides: list[dict],
) -> list[dict]:
    page_ids = _presentation_page_ids(presentation)
    if len(page_ids) < 3:
        raise ValueError(
            "Google Slides master template must contain at least 3 slides: cover, content, and closing."
        )

    content_template_slide_ids = page_ids[1:-1]
    content_slide_total = max(len(slides), 1)
    requests: list[dict] = []

    if len(content_template_slide_ids) > content_slide_total:
        for extra_slide_id in content_template_slide_ids[content_slide_total:]:
            requests.append({"deleteObject": {"objectId": extra_slide_id}})

    if not content_template_slide_ids:
        raise ValueError(
            "Google Slides master template must contain at least one content slide between cover and closing."
        )

    additional_content_slides = max(content_slide_total - len(content_template_slide_ids), 0)
    for index in range(additional_content_slides):
        requests.append(
            {
                "duplicateObject": {
                    "objectId": content_template_slide_ids[index % len(content_template_slide_ids)],
                }
            }
        )

    return requests


def _fill_master_template_content(
    slides_service,
    presentation_id: str,
    safe_title: str,
    safe_subtitle: str,
    slides: list[dict],
    template_definition: dict | None = None,
) -> None:
    with bypass_broken_local_proxy():
        presentation = slides_service.presentations().get(presentationId=presentation_id).execute()

    template_options = (template_definition or {}).get("options") or {}
    show_closing_subtitle = bool(template_options.get("show_closing_subtitle", True))
    initial_slides = presentation.get("slides", []) or []
    cover_style_blueprint = _extract_master_placeholder_style_blueprint(initial_slides[0]) if len(initial_slides) >= 1 else {}
    closing_style_blueprint = _extract_master_placeholder_style_blueprint(initial_slides[-1]) if len(initial_slides) >= 3 else {}

    initial_requests = _master_template_requests(
        presentation=presentation,
        slides=slides,
    )
    if initial_requests:
        with bypass_broken_local_proxy():
            slides_service.presentations().batchUpdate(
                presentationId=presentation_id,
                body={"requests": initial_requests},
            ).execute()

        with bypass_broken_local_proxy():
            presentation = slides_service.presentations().get(presentationId=presentation_id).execute()

    current_page_ids = _presentation_page_ids(presentation)
    cover_slide_id = current_page_ids[0] if current_page_ids else ""
    closing_slide_id = current_page_ids[-1] if current_page_ids else ""
    style_requests: list[dict] = []
    if cover_slide_id and cover_style_blueprint:
        style_requests.extend(
            _collect_master_placeholder_style_requests(
                presentation,
                placeholder_blueprint=cover_style_blueprint,
                slide_ids=[cover_slide_id],
                placeholder_text_map={
                    MASTER_TEMPLATE_PLACEHOLDERS["presentation_title"]: safe_title,
                    MASTER_TEMPLATE_PLACEHOLDERS["presentation_subtitle"]: safe_subtitle or safe_title,
                },
            )
        )
    if closing_slide_id and closing_style_blueprint:
        closing_subtitle_text = safe_subtitle or safe_title if show_closing_subtitle else ""
        style_requests.extend(
            _collect_master_placeholder_style_requests(
                presentation,
                placeholder_blueprint=closing_style_blueprint,
                slide_ids=[closing_slide_id],
                placeholder_text_map={
                    MASTER_TEMPLATE_PLACEHOLDERS["presentation_title"]: safe_title,
                    MASTER_TEMPLATE_PLACEHOLDERS["presentation_subtitle"]: closing_subtitle_text,
                },
            )
        )

    global_requests = _collect_master_placeholder_content_requests(
        presentation,
        replacement_map={MASTER_TEMPLATE_PLACEHOLDERS["presentation_title"]: safe_title},
        slide_ids=current_page_ids,
    )
    subtitle_slide_ids = current_page_ids if show_closing_subtitle or not closing_slide_id else [
        page_id for page_id in current_page_ids if page_id != closing_slide_id
    ]
    subtitle_requests = _collect_master_placeholder_content_requests(
        presentation,
        replacement_map={
            MASTER_TEMPLATE_PLACEHOLDERS["presentation_subtitle"]: safe_subtitle or safe_title,
        },
        slide_ids=subtitle_slide_ids,
    )
    if subtitle_requests:
        global_requests.extend(subtitle_requests)
    if closing_slide_id and not show_closing_subtitle:
        global_requests.extend(
            _collect_master_placeholder_content_requests(
                presentation,
                replacement_map={
                    MASTER_TEMPLATE_PLACEHOLDERS["presentation_subtitle"]: "\u00A0",
                },
                slide_ids=[closing_slide_id],
            )
        )
    if global_requests:
        with bypass_broken_local_proxy():
            slides_service.presentations().batchUpdate(
                presentationId=presentation_id,
                body={"requests": [*global_requests, *style_requests]},
            ).execute()

        with bypass_broken_local_proxy():
            presentation = slides_service.presentations().get(presentationId=presentation_id).execute()

    page_ids = _presentation_page_ids(presentation)
    if len(page_ids) < 3:
        raise ValueError("Copied master template does not contain enough slides after duplication.")

    content_slide_ids = page_ids[1:-1]
    if len(content_slide_ids) < len(slides):
        raise ValueError("Copied master template does not have enough content slides.")

    content_style_blueprints_by_slide_id = {
        slide.get("objectId"): _extract_master_placeholder_style_blueprint(slide)
        for slide in presentation.get("slides", []) or []
        if slide.get("objectId") in content_slide_ids
    }

    content_requests: list[dict] = []
    content_style_requests: list[dict] = []
    for index, slide in enumerate(slides, start=1):
        slide_id = content_slide_ids[index - 1]
        slide_title = " ".join(str(slide.get("title") or "").split()) or f"Slide {index}"
        body_text = "\n".join(_normalize_bullets(slide.get("bullets"))) or "\u00A0"
        content_replacement_map = {
            MASTER_TEMPLATE_PLACEHOLDERS["slide_number"]: f"{index:02}",
            MASTER_TEMPLATE_PLACEHOLDERS["slide_title"]: slide_title,
            MASTER_TEMPLATE_PLACEHOLDERS["slide_body"]: body_text,
        }
        content_requests.extend(
            _collect_master_placeholder_content_requests(
                presentation,
                replacement_map=content_replacement_map,
                slide_ids=[slide_id],
            )
        )
        content_style_requests.extend(
            _collect_master_placeholder_style_requests(
                presentation,
                placeholder_blueprint=content_style_blueprints_by_slide_id.get(slide_id) or {},
                slide_ids=[slide_id],
                placeholder_text_map=content_replacement_map,
            )
        )

    if content_requests:
        with bypass_broken_local_proxy():
            slides_service.presentations().batchUpdate(
                presentationId=presentation_id,
                body={"requests": [*content_requests, *content_style_requests]},
            ).execute()


def _append_shape_style_if_present(
    requests: list[dict],
    object_ids: set[str],
    object_id: str,
    fill: dict,
    outline: dict | None = None,
    weight: float = 0.5,
):
    if object_id in object_ids:
        requests.append(_shape_style_request(object_id, fill, outline, weight))


def _append_text_style_if_present(
    requests: list[dict],
    object_ids: set[str],
    object_id: str,
    font_size: float,
    color: dict,
    bold: bool = False,
):
    if object_id in object_ids:
        requests.append(_text_style_request(object_id, font_size, color, bold=bold))


def _append_paragraph_style_if_present(
    requests: list[dict],
    object_ids: set[str],
    object_id: str,
    alignment: str = "START",
    line_spacing: float | None = None,
):
    if object_id in object_ids:
        requests.append(_paragraph_style_request(object_id, alignment=alignment, line_spacing=line_spacing))


def update_presentation_template(
    connection,
    presentation_id: str,
    total_slide_count: int,
    template_id: str = "ilector-academic",
    language: str = "kaz",
    outline_title: str = "",
    outline_subtitle: str = "",
    outline_slides: list[dict] | None = None,
) -> None:
    if not presentation_id:
        return
    if is_master_slide_template(template_id):
        raise ValueError("Master slide templates must be regenerated instead of updated in place.")

    slides_service, _ = _build_services(connection)
    theme = _template_theme(template_id)

    with bypass_broken_local_proxy():
        presentation = slides_service.presentations().get(presentationId=presentation_id).execute()

    if template_id == "ilector-focus":
        extracted_title, extracted_subtitle, extracted_slides = _extract_outline_from_presentation(presentation, total_slide_count)
        title = " ".join(str(outline_title or extracted_title or "Presentation").split())
        subtitle = " ".join(str(outline_subtitle or extracted_subtitle or title).split())
        slides = outline_slides if outline_slides else extracted_slides
        delete_requests = [{"deleteObject": {"objectId": object_id}} for object_id in _presentation_element_ids(presentation)]

        if delete_requests:
            with bypass_broken_local_proxy():
                slides_service.presentations().batchUpdate(
                    presentationId=presentation_id,
                    body={"requests": delete_requests},
                ).execute()

            with bypass_broken_local_proxy():
                presentation = slides_service.presentations().get(presentationId=presentation_id).execute()

        requests = _minimalist_existing_presentation_requests(
            presentation=presentation,
            safe_title=title,
            safe_subtitle=subtitle,
            slides=slides,
            language=language,
            delete_existing=False,
        )

        if requests:
            with bypass_broken_local_proxy():
                slides_service.presentations().batchUpdate(
                    presentationId=presentation_id,
                    body={"requests": requests},
                ).execute()

        return

    if template_id == "ilector-minimal":
        extracted_title, extracted_subtitle, extracted_slides = _extract_outline_from_presentation(presentation, total_slide_count)
        title = " ".join(str(outline_title or extracted_title or "Presentation").split())
        subtitle = " ".join(str(outline_subtitle or extracted_subtitle or title).split())
        slides = outline_slides if outline_slides else extracted_slides
        requests = _corporate_existing_presentation_requests(
            presentation=presentation,
            safe_title=title,
            safe_subtitle=subtitle,
            slides=slides,
            language=language,
        )

        if requests:
            with bypass_broken_local_proxy():
                slides_service.presentations().batchUpdate(
                    presentationId=presentation_id,
                    body={"requests": requests},
                ).execute()

        return

    if template_id == "ilector-academic":
        extracted_title, extracted_subtitle, extracted_slides = _extract_outline_from_presentation(presentation, total_slide_count)
        title = " ".join(str(outline_title or extracted_title or "Presentation").split())
        subtitle = " ".join(str(outline_subtitle or extracted_subtitle or title).split())
        slides = outline_slides if outline_slides else extracted_slides
        requests = _academic_blue_existing_presentation_requests(
            presentation=presentation,
            safe_title=title,
            safe_subtitle=subtitle,
            slides=slides,
            language=language,
        )

        if requests:
            with bypass_broken_local_proxy():
                slides_service.presentations().batchUpdate(
                    presentationId=presentation_id,
                    body={"requests": requests},
                ).execute()

        return

    page_ids, object_ids = _collect_presentation_object_ids(presentation)
    requests = []

    def add_page_background(page_id: str):
        if page_id in page_ids:
            requests.append(_page_background_request(page_id, theme))

    add_page_background(_safe_object_id("title_slide"))
    _append_shape_style_if_present(requests, object_ids, _safe_object_id("title_top_bar"), theme["primary_dark"])
    _append_shape_style_if_present(requests, object_ids, _safe_object_id("title_accent"), theme["accent"])
    _append_shape_style_if_present(requests, object_ids, _safe_object_id("title_panel"), theme["white"], theme["line"], 1)
    _append_shape_style_if_present(requests, object_ids, _safe_object_id("title_panel_accent"), theme["accent"])
    _append_shape_style_if_present(requests, object_ids, _safe_object_id("title_rule"), theme["accent"])
    _append_text_style_if_present(requests, object_ids, _safe_object_id("title_mark"), 10, theme["mark"], bold=True)
    _append_paragraph_style_if_present(requests, object_ids, _safe_object_id("title_mark"), alignment="END")
    _append_text_style_if_present(requests, object_ids, _safe_object_id("title_box"), 31, theme["ink"], bold=True)
    _append_paragraph_style_if_present(requests, object_ids, _safe_object_id("title_box"), line_spacing=92)
    _append_text_style_if_present(requests, object_ids, _safe_object_id("subtitle_box"), 16, theme["muted"])

    content_slide_count = max(int(total_slide_count or 0) - 2, 0)
    for index in range(1, content_slide_count + 1):
        add_page_background(_safe_object_id("slide", index))
        _append_shape_style_if_present(requests, object_ids, _safe_object_id("slide_top_bar", index), theme["primary_dark"])
        _append_shape_style_if_present(requests, object_ids, _safe_object_id("slide_accent", index), theme["accent"])
        _append_shape_style_if_present(requests, object_ids, _safe_object_id("slide_card", index), theme["white"], theme["line"], 1)
        _append_shape_style_if_present(requests, object_ids, _safe_object_id("slide_card_rail", index), theme["accent"])
        _append_shape_style_if_present(requests, object_ids, _safe_object_id("slide_footer_line", index), theme["line"])
        _append_text_style_if_present(requests, object_ids, _safe_object_id("slide_mark", index), 9.5, theme["mark"], bold=True)
        _append_paragraph_style_if_present(requests, object_ids, _safe_object_id("slide_mark", index), alignment="END")
        _append_text_style_if_present(requests, object_ids, _safe_object_id("slide_title", index), 24, theme["ink"], bold=True)
        _append_paragraph_style_if_present(requests, object_ids, _safe_object_id("slide_title", index), line_spacing=92)
        _append_text_style_if_present(requests, object_ids, _safe_object_id("slide_number", index), 13, theme["accent"], bold=True)
        _append_paragraph_style_if_present(requests, object_ids, _safe_object_id("slide_number", index), alignment="END")
        _append_text_style_if_present(requests, object_ids, _safe_object_id("slide_body", index), 16, theme["ink"])
        _append_paragraph_style_if_present(requests, object_ids, _safe_object_id("slide_body", index), line_spacing=120)

    add_page_background(_safe_object_id("closing_slide"))
    _append_shape_style_if_present(requests, object_ids, _safe_object_id("closing_top_bar"), theme["primary_dark"])
    _append_shape_style_if_present(requests, object_ids, _safe_object_id("closing_accent"), theme["accent"])
    _append_shape_style_if_present(requests, object_ids, _safe_object_id("closing_panel"), theme["white"], theme["line"], 1)
    _append_shape_style_if_present(requests, object_ids, _safe_object_id("closing_panel_accent"), theme["accent"])
    _append_shape_style_if_present(requests, object_ids, _safe_object_id("closing_rule"), theme["accent"])
    _append_text_style_if_present(requests, object_ids, _safe_object_id("closing_mark"), 10, theme["mark"], bold=True)
    _append_paragraph_style_if_present(requests, object_ids, _safe_object_id("closing_mark"), alignment="END")
    _append_text_style_if_present(requests, object_ids, _safe_object_id("closing_title"), 28, theme["ink"], bold=True)
    _append_paragraph_style_if_present(requests, object_ids, _safe_object_id("closing_title"), alignment="CENTER")
    _append_text_style_if_present(requests, object_ids, _safe_object_id("closing_subtitle"), 15, theme["muted"])
    _append_paragraph_style_if_present(requests, object_ids, _safe_object_id("closing_subtitle"), alignment="CENTER")

    if not requests:
        return

    with bypass_broken_local_proxy():
        slides_service.presentations().batchUpdate(
            presentationId=presentation_id,
            body={"requests": requests},
        ).execute()


def _minimalist_text_box(object_id: str, page_id: str, x: float, y: float, width: float, height: float):
    return _text_box_request(object_id, page_id, x, y, width, height)


def _minimalist_rule(object_id: str, page_id: str, x: float, y: float, width: float, color: dict | None = None):
    return [
        _shape_request(object_id, page_id, "RECTANGLE", x, y, width, 1),
        _shape_style_request(object_id, color or {"red": 0.05, "green": 0.05, "blue": 0.05}),
    ]


def _minimalist_numbered_list_requests(
    page_id: str,
    prefix: str,
    bullets: list[str],
    start_x: float = 348,
    start_y: float = 112,
    gap_y: float = 60,
):
    ink = {"red": 0.03, "green": 0.03, "blue": 0.03}
    paper = {"red": 0.985, "green": 0.982, "blue": 0.972}
    requests = []

    for index, text in enumerate(_normalize_bullets(bullets)[:4], start=1):
        y = start_y + ((index - 1) * gap_y)
        circle_id = _safe_object_id(f"{prefix}_circle", index)
        number_id = _safe_object_id(f"{prefix}_num", index)
        text_id = _safe_object_id(f"{prefix}_text", index)

        requests.extend([
            _shape_request(circle_id, page_id, "ELLIPSE", start_x, y, 24, 24),
            _shape_style_request(circle_id, paper, ink, 1.2),
            _minimalist_text_box(number_id, page_id, start_x, y, 24, 24),
            _shape_content_alignment_request(number_id, "MIDDLE"),
            {"insertText": {"objectId": number_id, "insertionIndex": 0, "text": str(index)}},
            _text_style_request(number_id, 10.5, ink, bold=True, font_family="Arial"),
            _paragraph_style_request(number_id, alignment="CENTER"),
            _minimalist_text_box(text_id, page_id, start_x + 40, y - 4, 284, 50),
            {"insertText": {"objectId": text_id, "insertionIndex": 0, "text": text}},
            _text_style_request(text_id, 12.2, ink, font_family="Arial"),
            _paragraph_style_request(text_id, line_spacing=116),
        ])

    return requests


def _minimalist_roadmap_requests(page_id: str, prefix: str, items: list[str]):
    ink = {"red": 0.03, "green": 0.03, "blue": 0.03}
    requests = []
    roadmap_items = _normalize_bullets(items)[:4]

    if len(roadmap_items) < 3:
        return requests

    requests.extend(_minimalist_rule(_safe_object_id(f"{prefix}_axis"), page_id, 350, 232, 312, ink))

    positions = [
        (362, 142, 104, "top"),
        (448, 262, 104, "bottom"),
        (534, 142, 104, "top"),
        (620, 262, 82, "bottom"),
    ]

    for index, text in enumerate(roadmap_items, start=1):
        x, y, width, side = positions[index - 1]
        point_y = 232
        stem_top = y + 46 if side == "top" else point_y
        stem_height = abs(point_y - (y + 46)) if side == "top" else 46

        dot_id = _safe_object_id(f"{prefix}_dot", index)
        stem_id = _safe_object_id(f"{prefix}_stem", index)
        label_id = _safe_object_id(f"{prefix}_label", index)
        text_id = _safe_object_id(f"{prefix}_text", index)

        requests.extend([
            _shape_request(stem_id, page_id, "RECTANGLE", x, stem_top, 1, stem_height),
            _shape_style_request(stem_id, ink),
            _shape_request(dot_id, page_id, "ELLIPSE", x - 4, point_y - 4, 8, 8),
            _shape_style_request(dot_id, ink),
            _minimalist_text_box(label_id, page_id, x + 14, y, width, 20),
            {"insertText": {"objectId": label_id, "insertionIndex": 0, "text": f"Phase {index}"}},
            _text_style_request(label_id, 14, ink, bold=True, font_family="Arial"),
            _minimalist_text_box(text_id, page_id, x + 14, y + 30, width, 44),
            {"insertText": {"objectId": text_id, "insertionIndex": 0, "text": text}},
            _text_style_request(text_id, 11.5, ink, font_family="Arial"),
            _paragraph_style_request(text_id, line_spacing=120),
        ])

    return requests


def _minimalist_table_requests(page_id: str, prefix: str, table: dict, fallback_bullets: list[str]):
    ink = {"red": 0.03, "green": 0.03, "blue": 0.03}
    paper = {"red": 0.985, "green": 0.982, "blue": 0.972}
    header = {"red": 0.08, "green": 0.08, "blue": 0.08}
    requests = []
    columns = [
        " ".join(str(column or "").split())[:80]
        for column in (table or {}).get("columns", [])
        if str(column or "").strip()
    ][:4]
    rows = []

    for row in (table or {}).get("rows", [])[:4]:
        if isinstance(row, list):
            cells = [" ".join(str(cell or "").split())[:110] for cell in row[:len(columns)]]
            if any(cells):
                rows.append(cells)

    if len(columns) < 2 or not rows:
        bullets = _normalize_bullets(fallback_bullets)[:4]
        columns = ["#", "Key point"]
        rows = [[str(index), text] for index, text in enumerate(bullets, start=1)]

    if len(columns) < 2 or not rows:
        return requests

    x = 276
    y = 112
    table_width = 386
    col_count = len(columns)
    col_width = table_width / col_count
    row_height = 38
    header_height = 40
    total_height = header_height + (row_height * len(rows))

    requests.extend([
        _shape_request(_safe_object_id(f"{prefix}_outer"), page_id, "RECTANGLE", x, y, table_width, total_height),
        _shape_style_request(_safe_object_id(f"{prefix}_outer"), paper, ink, 1),
        _shape_request(_safe_object_id(f"{prefix}_header"), page_id, "RECTANGLE", x, y, table_width, header_height),
        _shape_style_request(_safe_object_id(f"{prefix}_header"), header, header, 1),
    ])

    for col_index, column in enumerate(columns):
        cell_x = x + (col_index * col_width)
        header_id = _safe_object_id(f"{prefix}_h", col_index + 1)
        requests.extend([
            _minimalist_text_box(header_id, page_id, cell_x + 6, y + 10, col_width - 12, 18),
            {"insertText": {"objectId": header_id, "insertionIndex": 0, "text": column}},
            _text_style_request(header_id, 10.5, paper, bold=True, font_family="Arial"),
            _paragraph_style_request(header_id, alignment="CENTER"),
        ])

        if col_index:
            vertical_id = _safe_object_id(f"{prefix}_v", col_index)
            requests.extend([
                _shape_request(vertical_id, page_id, "RECTANGLE", cell_x, y, 1, total_height),
                _shape_style_request(vertical_id, ink),
            ])

    for row_index, row in enumerate(rows, start=1):
        row_y = y + header_height + ((row_index - 1) * row_height)
        requests.extend(_minimalist_rule(_safe_object_id(f"{prefix}_r", row_index), page_id, x, row_y, table_width, ink))

        for col_index, column in enumerate(columns):
            cell_x = x + (col_index * col_width)
            cell_id = _safe_object_id(f"{prefix}_c_{row_index}", col_index + 1)
            text = row[col_index] if col_index < len(row) else ""
            requests.extend([
                _minimalist_text_box(cell_id, page_id, cell_x + 7, row_y + 10, col_width - 14, 18),
                {"insertText": {"objectId": cell_id, "insertionIndex": 0, "text": text}},
                _text_style_request(cell_id, 9.5, ink, font_family="Arial"),
                _paragraph_style_request(cell_id, alignment="CENTER"),
            ])

    return requests


def _minimalist_content_visual_requests(page_id: str, prefix: str, slide: dict, slide_bullets: list[str]):
    layout_type = str((slide or {}).get("layout_type") or "numbered_list").strip().lower()

    if layout_type == "roadmap":
        roadmap_items = (slide or {}).get("roadmap_items") or slide_bullets
        requests = _minimalist_roadmap_requests(page_id, _safe_object_id(f"{prefix}_roadmap"), roadmap_items)
        if requests:
            return requests

    if layout_type == "table":
        requests = _minimalist_table_requests(page_id, _safe_object_id(f"{prefix}_table"), (slide or {}).get("table") or {}, slide_bullets)
        if requests:
            return requests

    return _minimalist_numbered_list_requests(page_id, _safe_object_id(f"{prefix}_list"), slide_bullets)


def _minimalist_presentation_requests(
    safe_title: str,
    safe_subtitle: str,
    slides: list[dict],
    language: str,
    default_slide_id: str = "",
) -> list[dict]:
    paper = {"red": 0.985, "green": 0.982, "blue": 0.972}
    ink = {"red": 0.03, "green": 0.03, "blue": 0.03}
    muted = {"red": 0.38, "green": 0.38, "blue": 0.38}
    line = {"red": 0.08, "green": 0.08, "blue": 0.08}
    soft_line = {"red": 0.74, "green": 0.74, "blue": 0.72}
    requests = []

    title_slide_id = _safe_object_id("title_slide")
    title_rule_id = _safe_object_id("minimal_title_rule")
    title_box_id = _safe_object_id("title_box")
    subtitle_box_id = _safe_object_id("subtitle_box")
    title_mark_id = _safe_object_id("title_mark")

    requests.extend([
        {
            "createSlide": {
                "objectId": title_slide_id,
                "slideLayoutReference": {"predefinedLayout": "BLANK"},
            }
        },
        _page_background_request(title_slide_id, {"paper": paper}),
        *_minimalist_rule(title_rule_id, title_slide_id, 112, 104, 496, line),
        _minimalist_text_box(title_box_id, title_slide_id, 60, 132, 600, 120),
        _minimalist_text_box(subtitle_box_id, title_slide_id, 120, 270, 480, 34),
        _minimalist_text_box(title_mark_id, title_slide_id, 310, 360, 100, 18),
        {"insertText": {"objectId": title_box_id, "insertionIndex": 0, "text": safe_title}},
        {"insertText": {"objectId": subtitle_box_id, "insertionIndex": 0, "text": safe_subtitle or safe_title}},
        {"insertText": {"objectId": title_mark_id, "insertionIndex": 0, "text": "iLector"}},
        _text_style_request(title_box_id, 34, ink, bold=True, font_family="Georgia"),
        _paragraph_style_request(title_box_id, alignment="CENTER", line_spacing=96),
        _text_style_request(subtitle_box_id, 10.5, muted, font_family="Arial"),
        _paragraph_style_request(subtitle_box_id, alignment="CENTER"),
        _text_style_request(title_mark_id, 8, muted, font_family="Arial"),
        _paragraph_style_request(title_mark_id, alignment="CENTER"),
    ])

    for index, slide in enumerate(slides, start=1):
        slide_id = _safe_object_id("slide", index)
        number_id = _safe_object_id("slide_number", index)
        title_id = _safe_object_id("slide_title", index)
        body_id = _safe_object_id("slide_body", index)
        mark_id = _safe_object_id("slide_mark", index)
        top_rule_id = _safe_object_id("minimal_top_rule", index)
        bottom_rule_id = _safe_object_id("minimal_bottom_rule", index)
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
            _page_background_request(slide_id, {"paper": paper}),
            *_minimalist_rule(top_rule_id, slide_id, 58, 48, 604, line),
            *_minimalist_rule(bottom_rule_id, slide_id, 58, 356, 604, soft_line),
            _minimalist_text_box(number_id, slide_id, 58, 64, 70, 28),
            _minimalist_text_box(title_id, slide_id, 50, 108, 292, 134),
            _minimalist_text_box(body_id, slide_id, 342, 380, 306, 24),
            _minimalist_text_box(mark_id, slide_id, 582, 366, 80, 16),
            {"insertText": {"objectId": number_id, "insertionIndex": 0, "text": f"{index:02}"}},
            {"insertText": {"objectId": title_id, "insertionIndex": 0, "text": slide_title}},
            {"insertText": {"objectId": body_id, "insertionIndex": 0, "text": body_text}},
            {"insertText": {"objectId": mark_id, "insertionIndex": 0, "text": "iLector"}},
            *_minimalist_content_visual_requests(slide_id, _safe_object_id("minimal", index), slide, slide_bullets),
            _text_style_request(number_id, 10, muted, font_family="Arial"),
            _text_style_request(title_id, 21, ink, bold=True, font_family="Georgia"),
            _paragraph_style_request(title_id, line_spacing=96),
            _text_style_request(body_id, 1, paper, font_family="Arial"),
            _text_style_request(mark_id, 7.5, muted, font_family="Arial"),
            _paragraph_style_request(mark_id, alignment="END"),
        ])

    closing_slide_id = _safe_object_id("closing_slide")
    closing_rule_id = _safe_object_id("minimal_closing_rule")
    closing_title_id = _safe_object_id("closing_title")
    closing_subtitle_id = _safe_object_id("closing_subtitle")
    closing_mark_id = _safe_object_id("closing_mark")
    if language == "eng":
        closing_title = "Thank you"
        closing_subtitle = "Questions and discussion"
    elif language == "rus":
        closing_title = "Спасибо"
        closing_subtitle = "Вопросы и обсуждение"
    else:
        closing_title = "Рахмет"
        closing_subtitle = "Сұрақтар мен талқылау"

    requests.extend([
        {
            "createSlide": {
                "objectId": closing_slide_id,
                "slideLayoutReference": {"predefinedLayout": "BLANK"},
            }
        },
        _page_background_request(closing_slide_id, {"paper": paper}),
        *_minimalist_rule(closing_rule_id, closing_slide_id, 142, 130, 436, line),
        _minimalist_text_box(closing_title_id, closing_slide_id, 130, 170, 460, 64),
        _minimalist_text_box(closing_subtitle_id, closing_slide_id, 160, 252, 400, 32),
        _minimalist_text_box(closing_mark_id, closing_slide_id, 310, 346, 100, 18),
        {"insertText": {"objectId": closing_title_id, "insertionIndex": 0, "text": closing_title}},
        {"insertText": {"objectId": closing_subtitle_id, "insertionIndex": 0, "text": closing_subtitle}},
        {"insertText": {"objectId": closing_mark_id, "insertionIndex": 0, "text": "iLector"}},
        _text_style_request(closing_title_id, 42, ink, bold=True, font_family="Georgia"),
        _paragraph_style_request(closing_title_id, alignment="CENTER"),
        _text_style_request(closing_subtitle_id, 11, muted, font_family="Arial"),
        _paragraph_style_request(closing_subtitle_id, alignment="CENTER"),
        _text_style_request(closing_mark_id, 8, muted, font_family="Arial"),
        _paragraph_style_request(closing_mark_id, alignment="CENTER"),
    ])

    if default_slide_id:
        requests.append({"deleteObject": {"objectId": default_slide_id}})

    return requests


def _minimalist_existing_presentation_requests(
    presentation: dict,
    safe_title: str,
    safe_subtitle: str,
    slides: list[dict],
    language: str,
    delete_existing: bool = True,
) -> list[dict]:
    page_ids = _presentation_page_ids(presentation)
    if not page_ids:
        return []

    paper = {"red": 0.985, "green": 0.982, "blue": 0.972}
    ink = {"red": 0.03, "green": 0.03, "blue": 0.03}
    muted = {"red": 0.38, "green": 0.38, "blue": 0.38}
    line = {"red": 0.08, "green": 0.08, "blue": 0.08}
    soft_line = {"red": 0.74, "green": 0.74, "blue": 0.72}
    requests = [{"deleteObject": {"objectId": object_id}} for object_id in _presentation_element_ids(presentation)] if delete_existing else []

    title_slide_id = page_ids[0]
    requests.extend([
        _page_background_request(title_slide_id, {"paper": paper}),
        *_minimalist_rule(_safe_object_id("minimal_title_rule"), title_slide_id, 112, 104, 496, line),
        _minimalist_text_box(_safe_object_id("title_box"), title_slide_id, 60, 132, 600, 120),
        _minimalist_text_box(_safe_object_id("subtitle_box"), title_slide_id, 120, 270, 480, 34),
        _minimalist_text_box(_safe_object_id("title_mark"), title_slide_id, 310, 360, 100, 18),
        {"insertText": {"objectId": _safe_object_id("title_box"), "insertionIndex": 0, "text": safe_title}},
        {"insertText": {"objectId": _safe_object_id("subtitle_box"), "insertionIndex": 0, "text": safe_subtitle or safe_title}},
        {"insertText": {"objectId": _safe_object_id("title_mark"), "insertionIndex": 0, "text": "iLector"}},
        _text_style_request(_safe_object_id("title_box"), 34, ink, bold=True, font_family="Georgia"),
        _paragraph_style_request(_safe_object_id("title_box"), alignment="CENTER", line_spacing=96),
        _text_style_request(_safe_object_id("subtitle_box"), 10.5, muted, font_family="Arial"),
        _paragraph_style_request(_safe_object_id("subtitle_box"), alignment="CENTER"),
        _text_style_request(_safe_object_id("title_mark"), 8, muted, font_family="Arial"),
        _paragraph_style_request(_safe_object_id("title_mark"), alignment="CENTER"),
    ])

    content_pages = page_ids[1:-1] if len(page_ids) > 2 else page_ids[1:]
    for index, slide_id in enumerate(content_pages, start=1):
        slide = slides[index - 1] if index - 1 < len(slides) else {}
        slide_title = " ".join(str(slide.get("title") or "").split()) or f"Slide {index}"
        slide_bullets = _normalize_bullets(slide.get("bullets"))
        body_text = "\n".join(slide_bullets) or " "

        requests.extend([
            _page_background_request(slide_id, {"paper": paper}),
            *_minimalist_rule(_safe_object_id("minimal_top_rule", index), slide_id, 58, 48, 604, line),
            *_minimalist_rule(_safe_object_id("minimal_bottom_rule", index), slide_id, 58, 356, 604, soft_line),
            _minimalist_text_box(_safe_object_id("slide_number", index), slide_id, 58, 64, 70, 28),
            _minimalist_text_box(_safe_object_id("slide_title", index), slide_id, 50, 108, 292, 134),
            _minimalist_text_box(_safe_object_id("slide_body", index), slide_id, 342, 380, 306, 24),
            _minimalist_text_box(_safe_object_id("slide_mark", index), slide_id, 582, 366, 80, 16),
            {"insertText": {"objectId": _safe_object_id("slide_number", index), "insertionIndex": 0, "text": f"{index:02}"}},
            {"insertText": {"objectId": _safe_object_id("slide_title", index), "insertionIndex": 0, "text": slide_title}},
            {"insertText": {"objectId": _safe_object_id("slide_body", index), "insertionIndex": 0, "text": body_text}},
            {"insertText": {"objectId": _safe_object_id("slide_mark", index), "insertionIndex": 0, "text": "iLector"}},
            *_minimalist_content_visual_requests(slide_id, _safe_object_id("minimal", index), slide, slide_bullets),
            _text_style_request(_safe_object_id("slide_number", index), 10, muted, font_family="Arial"),
            _text_style_request(_safe_object_id("slide_title", index), 21, ink, bold=True, font_family="Georgia"),
            _paragraph_style_request(_safe_object_id("slide_title", index), line_spacing=96),
            _text_style_request(_safe_object_id("slide_body", index), 1, paper, font_family="Arial"),
            _text_style_request(_safe_object_id("slide_mark", index), 7.5, muted, font_family="Arial"),
            _paragraph_style_request(_safe_object_id("slide_mark", index), alignment="END"),
        ])

    closing_slide_id = page_ids[-1]
    if language == "eng":
        closing_title = "Thank you"
        closing_subtitle = "Questions and discussion"
    elif language == "rus":
        closing_title = "Спасибо"
        closing_subtitle = "Вопросы и обсуждение"
    else:
        closing_title = "Рахмет"
        closing_subtitle = "Сұрақтар мен талқылау"

    requests.extend([
        _page_background_request(closing_slide_id, {"paper": paper}),
        *_minimalist_rule(_safe_object_id("minimal_closing_rule"), closing_slide_id, 142, 130, 436, line),
        _minimalist_text_box(_safe_object_id("closing_title"), closing_slide_id, 130, 170, 460, 64),
        _minimalist_text_box(_safe_object_id("closing_subtitle"), closing_slide_id, 160, 252, 400, 32),
        _minimalist_text_box(_safe_object_id("closing_mark"), closing_slide_id, 310, 346, 100, 18),
        {"insertText": {"objectId": _safe_object_id("closing_title"), "insertionIndex": 0, "text": closing_title}},
        {"insertText": {"objectId": _safe_object_id("closing_subtitle"), "insertionIndex": 0, "text": closing_subtitle}},
        {"insertText": {"objectId": _safe_object_id("closing_mark"), "insertionIndex": 0, "text": "iLector"}},
        _text_style_request(_safe_object_id("closing_title"), 42, ink, bold=True, font_family="Georgia"),
        _paragraph_style_request(_safe_object_id("closing_title"), alignment="CENTER"),
        _text_style_request(_safe_object_id("closing_subtitle"), 11, muted, font_family="Arial"),
        _paragraph_style_request(_safe_object_id("closing_subtitle"), alignment="CENTER"),
        _text_style_request(_safe_object_id("closing_mark"), 8, muted, font_family="Arial"),
        _paragraph_style_request(_safe_object_id("closing_mark"), alignment="CENTER"),
    ])

    return requests


def _corporate_background_requests(page_id: str, prefix: str):
    blue = {"red": 0.0, "green": 0.28, "blue": 0.58}
    navy = {"red": 0.0, "green": 0.08, "blue": 0.24}
    light_blue = {"red": 0.25, "green": 0.50, "blue": 0.72}
    soft_blue = {"red": 0.14, "green": 0.39, "blue": 0.65}

    return [
        _page_background_request(page_id, {"paper": blue}),
        _shape_request(_safe_object_id(f"{prefix}_bottom"), page_id, "RECTANGLE", 0, 316, 720, 89),
        _shape_style_request(_safe_object_id(f"{prefix}_bottom"), navy, navy, 0.1),
        _shape_request(_safe_object_id(f"{prefix}_blob_a"), page_id, "ELLIPSE", 520, -70, 260, 330),
        _shape_style_request(_safe_object_id(f"{prefix}_blob_a"), soft_blue, soft_blue, 0.1),
        _shape_request(_safe_object_id(f"{prefix}_blob_b"), page_id, "ELLIPSE", 610, 18, 230, 300),
        _shape_style_request(_safe_object_id(f"{prefix}_blob_b"), light_blue, light_blue, 0.1),
    ]


def _corporate_presentation_requests(
    safe_title: str,
    safe_subtitle: str,
    slides: list[dict],
    language: str,
    default_slide_id: str = "",
) -> list[dict]:
    white = {"red": 1, "green": 1, "blue": 1}
    soft_white = {"red": 0.90, "green": 0.96, "blue": 1.0}
    requests = []

    title_slide_id = _safe_object_id("title_slide")
    requests.extend([
        {"createSlide": {"objectId": title_slide_id, "slideLayoutReference": {"predefinedLayout": "BLANK"}}},
        *_corporate_background_requests(title_slide_id, "corp_title"),
        _text_box_request(_safe_object_id("title_mark"), title_slide_id, 596, 24, 76, 22),
        _text_box_request(_safe_object_id("title_box"), title_slide_id, 96, 120, 470, 96),
        _text_box_request(_safe_object_id("subtitle_box"), title_slide_id, 100, 228, 460, 38),
        {"insertText": {"objectId": _safe_object_id("title_mark"), "insertionIndex": 0, "text": "iLector"}},
        {"insertText": {"objectId": _safe_object_id("title_box"), "insertionIndex": 0, "text": safe_title}},
        {"insertText": {"objectId": _safe_object_id("subtitle_box"), "insertionIndex": 0, "text": safe_subtitle or safe_title}},
        _text_style_request(_safe_object_id("title_mark"), 10, white, bold=True, font_family="Arial"),
        _paragraph_style_request(_safe_object_id("title_mark"), alignment="END"),
        _text_style_request(_safe_object_id("title_box"), 30, white, bold=True, font_family="Arial"),
        _paragraph_style_request(_safe_object_id("title_box"), line_spacing=92),
        _text_style_request(_safe_object_id("subtitle_box"), 15, soft_white, font_family="Arial"),
    ])

    for index, slide in enumerate(slides, start=1):
        slide_id = _safe_object_id("slide", index)
        title_id = _safe_object_id("slide_title", index)
        body_id = _safe_object_id("slide_body", index)
        number_id = _safe_object_id("slide_number", index)
        mark_id = _safe_object_id("slide_mark", index)
        slide_title = " ".join(str(slide.get("title") or "").split()) or f"Slide {index}"
        slide_bullets = _normalize_bullets(slide.get("bullets"))
        body_text = "\n".join(slide_bullets) or " "

        requests.extend([
            {"createSlide": {"objectId": slide_id, "slideLayoutReference": {"predefinedLayout": "BLANK"}}},
            *_corporate_background_requests(slide_id, _safe_object_id("corp", index)),
            _text_box_request(mark_id, slide_id, 596, 24, 76, 22),
            _text_box_request(number_id, slide_id, 72, 60, 46, 26),
            _text_box_request(title_id, slide_id, 292, 56, 330, 70),
            _text_box_request(body_id, slide_id, 292, 140, 326, 142),
            {"insertText": {"objectId": mark_id, "insertionIndex": 0, "text": "iLector"}},
            {"insertText": {"objectId": number_id, "insertionIndex": 0, "text": f"{index:02}"}},
            {"insertText": {"objectId": title_id, "insertionIndex": 0, "text": slide_title}},
            {"insertText": {"objectId": body_id, "insertionIndex": 0, "text": body_text}},
            {"createParagraphBullets": {"objectId": body_id, "textRange": {"type": "ALL"}, "bulletPreset": "BULLET_DISC_CIRCLE_SQUARE"}},
            _text_style_request(mark_id, 10, white, bold=True, font_family="Arial"),
            _paragraph_style_request(mark_id, alignment="END"),
            _text_style_request(number_id, 12, soft_white, bold=True, font_family="Arial"),
            _text_style_request(title_id, 23, white, bold=True, font_family="Arial"),
            _paragraph_style_request(title_id, line_spacing=96),
            _text_style_request(body_id, 14, white, font_family="Arial"),
            _paragraph_style_request(body_id, line_spacing=118),
        ])

    closing_slide_id = _safe_object_id("closing_slide")
    if language == "eng":
        closing_title = "Thank you"
        closing_subtitle = "Questions and discussion"
    elif language == "rus":
        closing_title = "Спасибо"
        closing_subtitle = "Вопросы и обсуждение"
    else:
        closing_title = "Рахмет"
        closing_subtitle = "Сұрақтар мен талқылау"

    requests.extend([
        {"createSlide": {"objectId": closing_slide_id, "slideLayoutReference": {"predefinedLayout": "BLANK"}}},
        *_corporate_background_requests(closing_slide_id, "corp_closing"),
        _text_box_request(_safe_object_id("closing_title"), closing_slide_id, 120, 146, 480, 60),
        _text_box_request(_safe_object_id("closing_subtitle"), closing_slide_id, 146, 224, 428, 34),
        _text_box_request(_safe_object_id("closing_mark"), closing_slide_id, 310, 346, 100, 18),
        {"insertText": {"objectId": _safe_object_id("closing_title"), "insertionIndex": 0, "text": closing_title}},
        {"insertText": {"objectId": _safe_object_id("closing_subtitle"), "insertionIndex": 0, "text": closing_subtitle}},
        {"insertText": {"objectId": _safe_object_id("closing_mark"), "insertionIndex": 0, "text": "iLector"}},
        _text_style_request(_safe_object_id("closing_title"), 38, white, bold=True, font_family="Arial"),
        _paragraph_style_request(_safe_object_id("closing_title"), alignment="CENTER"),
        _text_style_request(_safe_object_id("closing_subtitle"), 15, soft_white, font_family="Arial"),
        _paragraph_style_request(_safe_object_id("closing_subtitle"), alignment="CENTER"),
        _text_style_request(_safe_object_id("closing_mark"), 8, soft_white, font_family="Arial"),
        _paragraph_style_request(_safe_object_id("closing_mark"), alignment="CENTER"),
    ])

    if default_slide_id:
        requests.append({"deleteObject": {"objectId": default_slide_id}})

    return requests


def _replace_request_object_ids(value, object_id_map: dict[str, str]):
    if isinstance(value, dict):
        remapped = {}
        for key, item in value.items():
            if key in {"objectId", "pageObjectId"} and isinstance(item, str):
                remapped[key] = object_id_map.get(item, item)
            else:
                remapped[key] = _replace_request_object_ids(item, object_id_map)
        return remapped

    if isinstance(value, list):
        return [_replace_request_object_ids(item, object_id_map) for item in value]

    return value


def _corporate_existing_presentation_requests(
    presentation: dict,
    safe_title: str,
    safe_subtitle: str,
    slides: list[dict],
    language: str,
) -> list[dict]:
    page_ids = _presentation_page_ids(presentation)
    if not page_ids:
        return []

    requests = [{"deleteObject": {"objectId": object_id}} for object_id in _presentation_element_ids(presentation)]
    fresh_requests = _corporate_presentation_requests(safe_title, safe_subtitle, slides, language)
    page_index = 0
    page_id_map = {}

    for request in fresh_requests:
        create_slide = request.get("createSlide")
        if create_slide:
            requested_page_id = create_slide.get("objectId")
            if page_index < len(page_ids):
                if requested_page_id:
                    page_id_map[requested_page_id] = page_ids[page_index]
                page_index += 1
                continue
            requests.append(request)
            continue

        requests.append(_replace_request_object_ids(request, page_id_map))

    return requests


def _academic_blue_background_requests(page_id: str, prefix: str):
    white = {"red": 1, "green": 1, "blue": 1}
    blue = {"red": 0.18, "green": 0.35, "blue": 0.66}
    light_blue = {"red": 0.70, "green": 0.82, "blue": 0.97}

    return [
        _page_background_request(page_id, {"paper": white}),
        _shape_request(_safe_object_id(f"{prefix}_top_soft"), page_id, "RECTANGLE", 404, 0, 260, 36),
        _shape_style_request(_safe_object_id(f"{prefix}_top_soft"), light_blue, light_blue, 0.1),
        _shape_request(_safe_object_id(f"{prefix}_top_blue"), page_id, "RECTANGLE", 598, 0, 96, 58),
        _shape_style_request(_safe_object_id(f"{prefix}_top_blue"), blue, blue, 0.1),
        _shape_request(_safe_object_id(f"{prefix}_bottom_blue"), page_id, "RECTANGLE", 0, 360, 92, 45),
        _shape_style_request(_safe_object_id(f"{prefix}_bottom_blue"), blue, blue, 0.1),
        _shape_request(_safe_object_id(f"{prefix}_bottom_soft"), page_id, "RECTANGLE", 52, 376, 270, 29),
        _shape_style_request(_safe_object_id(f"{prefix}_bottom_soft"), light_blue, light_blue, 0.1),
    ]


def _academic_blue_presentation_requests(
    safe_title: str,
    safe_subtitle: str,
    slides: list[dict],
    language: str,
    default_slide_id: str = "",
) -> list[dict]:
    ink = {"red": 0.02, "green": 0.02, "blue": 0.02}
    blue = {"red": 0.18, "green": 0.35, "blue": 0.66}
    muted = {"red": 0.34, "green": 0.34, "blue": 0.34}
    requests = []

    title_slide_id = _safe_object_id("title_slide")
    requests.extend([
        {"createSlide": {"objectId": title_slide_id, "slideLayoutReference": {"predefinedLayout": "BLANK"}}},
        *_academic_blue_background_requests(title_slide_id, "acad_title"),
        *_minimalist_rule(_safe_object_id("acad_title_top_rule"), title_slide_id, 46, 58, 500, ink),
        *_minimalist_rule(_safe_object_id("acad_title_bottom_rule"), title_slide_id, 178, 352, 466, ink),
        _shape_request(_safe_object_id("acad_title_top_dot"), title_slide_id, "ELLIPSE", 546, 55, 6, 6),
        _shape_style_request(_safe_object_id("acad_title_top_dot"), ink, ink, 0.1),
        _shape_request(_safe_object_id("acad_title_bottom_dot"), title_slide_id, "ELLIPSE", 176, 349, 6, 6),
        _shape_style_request(_safe_object_id("acad_title_bottom_dot"), ink, ink, 0.1),
        _text_box_request(_safe_object_id("title_box"), title_slide_id, 156, 168, 408, 68),
        _text_box_request(_safe_object_id("subtitle_box"), title_slide_id, 184, 244, 352, 26),
        _text_box_request(_safe_object_id("title_mark"), title_slide_id, 310, 360, 100, 18),
        {"insertText": {"objectId": _safe_object_id("title_box"), "insertionIndex": 0, "text": safe_title}},
        {"insertText": {"objectId": _safe_object_id("subtitle_box"), "insertionIndex": 0, "text": safe_subtitle or safe_title}},
        {"insertText": {"objectId": _safe_object_id("title_mark"), "insertionIndex": 0, "text": "iLector"}},
        _text_style_request(_safe_object_id("title_box"), 34, blue, bold=True, font_family="Arial"),
        _paragraph_style_request(_safe_object_id("title_box"), alignment="CENTER"),
        _text_style_request(_safe_object_id("subtitle_box"), 11, muted, font_family="Arial"),
        _paragraph_style_request(_safe_object_id("subtitle_box"), alignment="CENTER"),
        _text_style_request(_safe_object_id("title_mark"), 8, muted, font_family="Arial"),
        _paragraph_style_request(_safe_object_id("title_mark"), alignment="CENTER"),
    ])

    for index, slide in enumerate(slides, start=1):
        slide_id = _safe_object_id("slide", index)
        title_id = _safe_object_id("slide_title", index)
        body_id = _safe_object_id("slide_body", index)
        number_id = _safe_object_id("slide_number", index)
        mark_id = _safe_object_id("slide_mark", index)
        slide_title = " ".join(str(slide.get("title") or "").split()) or f"Slide {index}"
        slide_bullets = _normalize_bullets(slide.get("bullets"))
        body_text = "\n".join(slide_bullets) or " "

        requests.extend([
            {"createSlide": {"objectId": slide_id, "slideLayoutReference": {"predefinedLayout": "BLANK"}}},
            *_academic_blue_background_requests(slide_id, _safe_object_id("acad", index)),
            _text_box_request(number_id, slide_id, 82, 78, 46, 24),
            _text_box_request(title_id, slide_id, 70, 132, 250, 72),
            *_minimalist_rule(_safe_object_id("acad_mid_rule", index), slide_id, 344, 112, 1, ink),
            _text_box_request(body_id, slide_id, 376, 112, 280, 190),
            _text_box_request(mark_id, slide_id, 584, 360, 72, 16),
            {"insertText": {"objectId": number_id, "insertionIndex": 0, "text": f"{index:02}"}},
            {"insertText": {"objectId": title_id, "insertionIndex": 0, "text": slide_title}},
            {"insertText": {"objectId": body_id, "insertionIndex": 0, "text": body_text}},
            {"insertText": {"objectId": mark_id, "insertionIndex": 0, "text": "iLector"}},
            {"createParagraphBullets": {"objectId": body_id, "textRange": {"type": "ALL"}, "bulletPreset": "BULLET_DISC_CIRCLE_SQUARE"}},
            _text_style_request(number_id, 11, muted, font_family="Arial"),
            _text_style_request(title_id, 27, blue, bold=True, font_family="Arial"),
            _paragraph_style_request(title_id, line_spacing=94),
            _text_style_request(body_id, 14, ink, font_family="Arial"),
            _paragraph_style_request(body_id, line_spacing=116),
            _text_style_request(mark_id, 8, muted, font_family="Arial"),
            _paragraph_style_request(mark_id, alignment="END"),
        ])

    closing_slide_id = _safe_object_id("closing_slide")
    if language == "eng":
        closing_title = "Thank you"
        closing_subtitle = "Questions and discussion"
    elif language == "rus":
        closing_title = "Спасибо"
        closing_subtitle = "Вопросы и обсуждение"
    else:
        closing_title = "Рахмет"
        closing_subtitle = "Сұрақтар мен талқылау"

    requests.extend([
        {"createSlide": {"objectId": closing_slide_id, "slideLayoutReference": {"predefinedLayout": "BLANK"}}},
        *_academic_blue_background_requests(closing_slide_id, "acad_closing"),
        *_minimalist_rule(_safe_object_id("acad_closing_rule"), closing_slide_id, 180, 182, 360, ink),
        _text_box_request(_safe_object_id("closing_title"), closing_slide_id, 140, 142, 440, 56),
        _text_box_request(_safe_object_id("closing_subtitle"), closing_slide_id, 162, 224, 396, 30),
        _text_box_request(_safe_object_id("closing_mark"), closing_slide_id, 310, 352, 100, 18),
        {"insertText": {"objectId": _safe_object_id("closing_title"), "insertionIndex": 0, "text": closing_title}},
        {"insertText": {"objectId": _safe_object_id("closing_subtitle"), "insertionIndex": 0, "text": closing_subtitle}},
        {"insertText": {"objectId": _safe_object_id("closing_mark"), "insertionIndex": 0, "text": "iLector"}},
        _text_style_request(_safe_object_id("closing_title"), 34, blue, bold=True, font_family="Arial"),
        _paragraph_style_request(_safe_object_id("closing_title"), alignment="CENTER"),
        _text_style_request(_safe_object_id("closing_subtitle"), 14, muted, font_family="Arial"),
        _paragraph_style_request(_safe_object_id("closing_subtitle"), alignment="CENTER"),
        _text_style_request(_safe_object_id("closing_mark"), 8, muted, font_family="Arial"),
        _paragraph_style_request(_safe_object_id("closing_mark"), alignment="CENTER"),
    ])

    if default_slide_id:
        requests.append({"deleteObject": {"objectId": default_slide_id}})

    return requests


def _academic_blue_existing_presentation_requests(
    presentation: dict,
    safe_title: str,
    safe_subtitle: str,
    slides: list[dict],
    language: str,
) -> list[dict]:
    page_ids = _presentation_page_ids(presentation)
    if not page_ids:
        return []

    requests = [{"deleteObject": {"objectId": object_id}} for object_id in _presentation_element_ids(presentation)]
    fresh_requests = _academic_blue_presentation_requests(safe_title, safe_subtitle, slides, language)
    page_index = 0
    page_id_map = {}

    for request in fresh_requests:
        create_slide = request.get("createSlide")
        if create_slide:
            requested_page_id = create_slide.get("objectId")
            if page_index < len(page_ids):
                if requested_page_id:
                    page_id_map[requested_page_id] = page_ids[page_index]
                page_index += 1
                continue
            requests.append(request)
            continue

        requests.append(_replace_request_object_ids(request, page_id_map))

    return requests


def create_presentation_from_outline(
    connection,
    title: str,
    subtitle: str,
    slides: list[dict],
    folder_id: str = "",
    language: str = "kaz",
    template_id: str = "ilector-academic",
) -> dict:
    slides_service, drive_service = _build_services(connection)
    safe_title = " ".join((title or "").split()) or "AI Slides"
    safe_subtitle = " ".join((subtitle or "").split())
    template_definition = get_slide_template_definition(template_id)
    resolved_template_id = template_definition.get("id") or template_id
    theme = _template_theme(resolved_template_id)

    if is_master_slide_template(resolved_template_id):
        if not has_google_scope(getattr(connection, "credentials_json", {}), GOOGLE_DRIVE_FULL_SCOPE):
            raise RuntimeError(
                "Google Drive connection uses old permissions. Reconnect Google Drive to grant full Drive access for master slide templates."
            )

        source_presentation_id = str(template_definition.get("source_presentation_id") or "").strip()
        if not source_presentation_id:
            raise ValueError("Google Slides master template source_presentation_id is not configured.")

        presentation_id = _copy_presentation_template(drive_service, source_presentation_id, safe_title)
        if not presentation_id:
            raise ValueError("Google Slides template copy failed.")

        _move_file_to_folder(drive_service, presentation_id, folder_id)
        _fill_master_template_content(
            slides_service=slides_service,
            presentation_id=presentation_id,
            safe_title=safe_title,
            safe_subtitle=safe_subtitle,
            slides=slides,
            template_definition=template_definition,
        )

        base_url = f"https://docs.google.com/presentation/d/{presentation_id}"
        return {
            "presentation_id": presentation_id,
            "slides_url": f"{base_url}/edit",
            "slides_embed_url": f"{base_url}/embed?start=false&loop=false&delayms=4000",
            "slides_download_url": f"{base_url}/export/pptx",
        }

    with bypass_broken_local_proxy():
        presentation = slides_service.presentations().create(body={"title": safe_title}).execute()

    presentation_id = presentation.get("presentationId", "")
    default_slides = presentation.get("slides", [])
    default_slide_id = default_slides[0].get("objectId") if default_slides else ""

    if resolved_template_id == "ilector-academic":
        requests = _academic_blue_presentation_requests(
            safe_title=safe_title,
            safe_subtitle=safe_subtitle,
            slides=slides,
            language=language,
            default_slide_id=default_slide_id,
        )

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

    if resolved_template_id == "ilector-minimal":
        requests = _corporate_presentation_requests(
            safe_title=safe_title,
            safe_subtitle=safe_subtitle,
            slides=slides,
            language=language,
            default_slide_id=default_slide_id,
        )

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

    if resolved_template_id == "ilector-focus":
        requests = _minimalist_presentation_requests(
            safe_title=safe_title,
            safe_subtitle=safe_subtitle,
            slides=slides,
            language=language,
            default_slide_id=default_slide_id,
        )

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

    requests = []

    title_slide_id = _safe_object_id("title_slide")
    title_top_id = _safe_object_id("title_top_bar")
    title_accent_id = _safe_object_id("title_accent")
    title_panel_id = _safe_object_id("title_panel")
    title_panel_accent_id = _safe_object_id("title_panel_accent")
    title_rule_id = _safe_object_id("title_rule")
    title_mark_id = _safe_object_id("title_mark")
    title_box_id = _safe_object_id("title_box")
    subtitle_box_id = _safe_object_id("subtitle_box")

    requests.extend([
        {
            "createSlide": {
                "objectId": title_slide_id,
                "slideLayoutReference": {"predefinedLayout": "BLANK"},
            }
        },
        _page_background_request(title_slide_id, theme),
        _shape_request(title_top_id, title_slide_id, "RECTANGLE", 0, 0, 720, 54),
        _shape_style_request(title_top_id, theme["primary_dark"]),
        _shape_request(title_accent_id, title_slide_id, "RECTANGLE", 0, 54, 720, 6),
        _shape_style_request(title_accent_id, theme["accent"]),
        _shape_request(title_panel_id, title_slide_id, "ROUND_RECTANGLE", 50, 92, 620, 236),
        _shape_style_request(title_panel_id, theme["white"], theme["line"], 1),
        _shape_request(title_panel_accent_id, title_slide_id, "RECTANGLE", 50, 92, 8, 236),
        _shape_style_request(title_panel_accent_id, theme["accent"]),
        _shape_request(title_rule_id, title_slide_id, "RECTANGLE", 82, 284, 150, 3),
        _shape_style_request(title_rule_id, theme["accent"]),
        _text_box_request(title_mark_id, title_slide_id, 594, 17, 76, 24),
        _text_box_request(title_box_id, title_slide_id, 82, 120, 540, 118),
        _text_box_request(subtitle_box_id, title_slide_id, 84, 246, 500, 44),
        {"insertText": {"objectId": title_mark_id, "insertionIndex": 0, "text": "iLector"}},
        {"insertText": {"objectId": title_box_id, "insertionIndex": 0, "text": safe_title}},
        {"insertText": {"objectId": subtitle_box_id, "insertionIndex": 0, "text": safe_subtitle or safe_title}},
        _text_style_request(title_mark_id, 10, theme["mark"], bold=True),
        _paragraph_style_request(title_mark_id, alignment="END"),
        _text_style_request(title_box_id, 31, theme["ink"], bold=True),
        _paragraph_style_request(title_box_id, line_spacing=92),
        _text_style_request(subtitle_box_id, 16, theme["muted"]),
    ])

    for index, slide in enumerate(slides, start=1):
        slide_id = _safe_object_id("slide", index)
        top_bar_id = _safe_object_id("slide_top_bar", index)
        accent_id = _safe_object_id("slide_accent", index)
        mark_id = _safe_object_id("slide_mark", index)
        card_id = _safe_object_id("slide_card", index)
        card_rail_id = _safe_object_id("slide_card_rail", index)
        footer_line_id = _safe_object_id("slide_footer_line", index)
        title_id = _safe_object_id("slide_title", index)
        body_id = _safe_object_id("slide_body", index)
        number_id = _safe_object_id("slide_number", index)
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
            _page_background_request(slide_id, theme),
            _shape_request(top_bar_id, slide_id, "RECTANGLE", 0, 0, 720, 38),
            _shape_style_request(top_bar_id, theme["primary_dark"]),
            _shape_request(accent_id, slide_id, "RECTANGLE", 0, 38, 720, 4),
            _shape_style_request(accent_id, theme["accent"]),
            _text_box_request(mark_id, slide_id, 594, 10, 76, 20),
            _shape_request(card_id, slide_id, "ROUND_RECTANGLE", 44, 112, 632, 278),
            _shape_style_request(card_id, theme["white"], theme["line"], 1),
            _shape_request(card_rail_id, slide_id, "RECTANGLE", 44, 112, 7, 278),
            _shape_style_request(card_rail_id, theme["accent"]),
            _shape_request(footer_line_id, slide_id, "RECTANGLE", 44, 416, 632, 1),
            _shape_style_request(footer_line_id, theme["line"]),
            _text_box_request(title_id, slide_id, 46, 56, 584, 54),
            _text_box_request(number_id, slide_id, 634, 56, 42, 32),
            _text_box_request(body_id, slide_id, 78, 136, 548, 220),
            {"insertText": {"objectId": mark_id, "insertionIndex": 0, "text": "iLector"}},
            {"insertText": {"objectId": title_id, "insertionIndex": 0, "text": slide_title}},
            {"insertText": {"objectId": number_id, "insertionIndex": 0, "text": f"{index:02}"}},
            {"insertText": {"objectId": body_id, "insertionIndex": 0, "text": body_text}},
            {
                "createParagraphBullets": {
                    "objectId": body_id,
                    "textRange": {"type": "ALL"},
                    "bulletPreset": "BULLET_DISC_CIRCLE_SQUARE",
                }
            },
            _text_style_request(mark_id, 9.5, theme["mark"], bold=True),
            _paragraph_style_request(mark_id, alignment="END"),
            _text_style_request(title_id, 24, theme["ink"], bold=True),
            _paragraph_style_request(title_id, line_spacing=92),
            _text_style_request(number_id, 13, theme["accent"], bold=True),
            _paragraph_style_request(number_id, alignment="END"),
            _text_style_request(body_id, 16, theme["ink"]),
            _paragraph_style_request(body_id, line_spacing=120),
        ])

    closing_slide_id = _safe_object_id("closing_slide")
    closing_top_id = _safe_object_id("closing_top_bar")
    closing_accent_id = _safe_object_id("closing_accent")
    closing_rule_id = _safe_object_id("closing_rule")
    closing_panel_id = _safe_object_id("closing_panel")
    closing_panel_accent_id = _safe_object_id("closing_panel_accent")
    closing_mark_id = _safe_object_id("closing_mark")
    closing_title_id = _safe_object_id("closing_title")
    closing_subtitle_id = _safe_object_id("closing_subtitle")
    if language == "eng":
        closing_title = "Thank you for your attention"
        closing_subtitle = "If you have questions, you can ask them."
    elif language == "rus":
        closing_title = "Спасибо за внимание"
        closing_subtitle = "Если есть вопросы, можете задать их."
    else:
        closing_title = "Назарларыңызға рахмет"
        closing_subtitle = "Сұрақтарыңыз болса, қоя аласыздар."

    requests.extend([
        {
            "createSlide": {
                "objectId": closing_slide_id,
                "slideLayoutReference": {"predefinedLayout": "BLANK"},
            }
        },
        _page_background_request(closing_slide_id, theme),
        _shape_request(closing_top_id, closing_slide_id, "RECTANGLE", 0, 0, 720, 54),
        _shape_style_request(closing_top_id, theme["primary_dark"]),
        _shape_request(closing_accent_id, closing_slide_id, "RECTANGLE", 0, 54, 720, 6),
        _shape_style_request(closing_accent_id, theme["accent"]),
        _shape_request(closing_panel_id, closing_slide_id, "ROUND_RECTANGLE", 84, 122, 552, 214),
        _shape_style_request(closing_panel_id, theme["white"], theme["line"], 1),
        _shape_request(closing_panel_accent_id, closing_slide_id, "RECTANGLE", 84, 122, 552, 7),
        _shape_style_request(closing_panel_accent_id, theme["accent"]),
        _shape_request(closing_rule_id, closing_slide_id, "RECTANGLE", 286, 240, 148, 3),
        _shape_style_request(closing_rule_id, theme["accent"]),
        _text_box_request(closing_mark_id, closing_slide_id, 594, 17, 76, 24),
        _text_box_request(closing_title_id, closing_slide_id, 104, 162, 512, 64),
        _text_box_request(closing_subtitle_id, closing_slide_id, 118, 264, 484, 42),
        {"insertText": {"objectId": closing_mark_id, "insertionIndex": 0, "text": "iLector"}},
        {"insertText": {"objectId": closing_title_id, "insertionIndex": 0, "text": closing_title}},
        {"insertText": {"objectId": closing_subtitle_id, "insertionIndex": 0, "text": closing_subtitle}},
        _text_style_request(closing_mark_id, 10, theme["mark"], bold=True),
        _paragraph_style_request(closing_mark_id, alignment="END"),
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
