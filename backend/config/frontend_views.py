import mimetypes
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404


FRONTEND_ROOT = (settings.BASE_DIR.parent / "frontend").resolve()


def _resolve_frontend_path(relative_path: str) -> Path:
    target_path = (FRONTEND_ROOT / relative_path).resolve()

    if target_path != FRONTEND_ROOT and FRONTEND_ROOT not in target_path.parents:
        raise Http404("Frontend asset not found.")

    if not target_path.exists() or not target_path.is_file():
        raise Http404("Frontend asset not found.")

    return target_path


def frontend_index(_request):
    index_path = _resolve_frontend_path("index.html")
    response = FileResponse(index_path.open("rb"), content_type="text/html")
    response["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response["Pragma"] = "no-cache"
    response["Expires"] = "0"
    return response


def frontend_asset(_request, asset_kind: str, asset_path: str):
    file_path = _resolve_frontend_path(f"{asset_kind}/{asset_path}")
    content_type, _ = mimetypes.guess_type(file_path.name)
    response = FileResponse(file_path.open("rb"), content_type=content_type or "application/octet-stream")

    if file_path.suffix in {".css", ".js"}:
        response["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response["Pragma"] = "no-cache"
        response["Expires"] = "0"

    return response
