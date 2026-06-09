from __future__ import annotations

import json
import os
import re
from copy import deepcopy

from django.conf import settings


DEFAULT_SLIDE_TEMPLATE_ID = "ilector-academic"
SUPPORTED_TEMPLATE_TONES = {"academic", "minimal", "focus", "executive", "research"}

BUILT_IN_SLIDE_TEMPLATES = [
    {
        "id": "ilector-academic",
        "source_type": "built_in",
        "tone": "academic",
        "preview_variant": "standard",
        "preview_title": "Presentation",
        "labels": {
            "kaz": "Академиялық шаблон",
            "rus": "Академический шаблон",
            "eng": "Academic template",
        },
    },
    {
        "id": "ilector-minimal",
        "source_type": "built_in",
        "tone": "minimal",
        "preview_variant": "standard",
        "preview_title": "Presentation",
        "labels": {
            "kaz": "Корпоративтік шаблон",
            "rus": "Корпоративный шаблон",
            "eng": "Corporate template",
        },
    },
    {
        "id": "ilector-focus",
        "source_type": "built_in",
        "tone": "focus",
        "preview_variant": "cover",
        "preview_title": "Presentation",
        "labels": {
            "kaz": "Минималистік шаблон",
            "rus": "Минималистский шаблон",
            "eng": "Minimalist template",
        },
    },
]


def _normalize_template_id(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9_-]+", "-", str(value or "").strip().lower()).strip("-")
    return normalized[:64]


def _normalize_labels(raw_labels, fallback_label: str) -> dict[str, str]:
    labels = raw_labels if isinstance(raw_labels, dict) else {}
    fallback = str(fallback_label or "").strip() or "Template"
    return {
        "kaz": str(labels.get("kaz") or fallback).strip() or fallback,
        "rus": str(labels.get("rus") or fallback).strip() or fallback,
        "eng": str(labels.get("eng") or fallback).strip() or fallback,
    }


def _load_raw_master_templates():
    configured_templates = getattr(settings, "GOOGLE_SLIDES_MASTER_TEMPLATES", None)
    if configured_templates is not None:
        return configured_templates

    raw_json = os.getenv("GOOGLE_SLIDES_MASTER_TEMPLATES_JSON", "").strip()
    if not raw_json:
        return []

    try:
        return json.loads(raw_json)
    except json.JSONDecodeError:
        return []


def _normalize_master_template(raw_template) -> dict | None:
    if not isinstance(raw_template, dict):
        return None

    template_id = _normalize_template_id(raw_template.get("id") or raw_template.get("template_id"))
    source_presentation_id = str(
        raw_template.get("source_presentation_id")
        or raw_template.get("presentation_id")
        or raw_template.get("master_presentation_id")
        or ""
    ).strip()
    if not template_id or not source_presentation_id:
        return None

    tone = str(raw_template.get("tone") or "executive").strip().lower() or "executive"
    if tone not in SUPPORTED_TEMPLATE_TONES:
        tone = "executive"

    preview_variant = str(raw_template.get("preview_variant") or "standard").strip().lower() or "standard"
    if preview_variant not in {"standard", "cover"}:
        preview_variant = "standard"
    preview_skin = str(raw_template.get("preview_skin") or raw_template.get("previewSkin") or tone).strip().lower() or tone
    preview_skin = _normalize_template_id(preview_skin) or tone

    fallback_label = str(raw_template.get("label") or raw_template.get("name") or template_id).strip() or template_id
    preview_title = str(raw_template.get("preview_title") or "Presentation").strip() or "Presentation"
    raw_options = raw_template.get("options") if isinstance(raw_template.get("options"), dict) else {}
    show_closing_subtitle = raw_options.get("show_closing_subtitle")
    if show_closing_subtitle is None:
        show_closing_subtitle = raw_template.get("show_closing_subtitle")
    if show_closing_subtitle is None:
        show_closing_subtitle = True

    return {
        "id": template_id,
        "source_type": "master",
        "source_presentation_id": source_presentation_id,
        "tone": tone,
        "preview_variant": preview_variant,
        "preview_skin": preview_skin,
        "preview_title": preview_title,
        "labels": _normalize_labels(raw_template.get("labels"), fallback_label),
        "options": {
            "show_closing_subtitle": bool(show_closing_subtitle),
        },
    }


def get_slide_template_catalog() -> list[dict]:
    catalog = [deepcopy(item) for item in BUILT_IN_SLIDE_TEMPLATES]
    seen_ids = {item["id"] for item in catalog}

    raw_templates = _load_raw_master_templates()
    if isinstance(raw_templates, list):
        for raw_template in raw_templates:
            normalized = _normalize_master_template(raw_template)
            if not normalized or normalized["id"] in seen_ids:
                continue
            catalog.append(normalized)
            seen_ids.add(normalized["id"])

    return catalog


def get_slide_template_definition(template_id: str) -> dict:
    normalized_id = _normalize_template_id(template_id)
    for template in get_slide_template_catalog():
        if template["id"] == normalized_id:
            return template
    return deepcopy(BUILT_IN_SLIDE_TEMPLATES[0])


def get_supported_slide_template_ids() -> list[str]:
    return [template["id"] for template in get_slide_template_catalog()]


def get_default_slide_template_id() -> str:
    return BUILT_IN_SLIDE_TEMPLATES[0]["id"]


def is_master_slide_template(template_id: str) -> bool:
    return get_slide_template_definition(template_id).get("source_type") == "master"
