import io
import zipfile
from pathlib import Path
from xml.etree import ElementTree

from PyPDF2 import PdfReader
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload, MediaIoBaseUpload

from users.google_oauth import bypass_broken_local_proxy, credentials_from_dict, credentials_to_dict


CATEGORY_FOLDER_LABELS = {
    "lecture": {"kaz": "Дәріс", "rus": "Лекция"},
    "practice": {"kaz": "Практикалық жұмыс", "rus": "Практическая работа"},
    "lab": {"kaz": "Зертханалық жұмыс", "rus": "Лабораторная работа"},
    "sowj": {"kaz": "СӨЖ", "rus": "СРС"},
    "syllabus": {"kaz": "Силлабус", "rus": "Силлабус"},
}


def _sanitize_drive_name(name: str) -> str:
    cleaned = " ".join((name or "").strip().split())
    for char in ['\\', '/', ':', '*', '?', '"', '<', '>', '|']:
        cleaned = cleaned.replace(char, "-")
    return cleaned or "Untitled"


def _escape_drive_query(value: str) -> str:
    return value.replace("\\", "\\\\").replace("'", "\\'")


def get_drive_service(connection):
    credentials = credentials_from_dict(connection.credentials_json)

    if credentials.expired and credentials.refresh_token:
        with bypass_broken_local_proxy():
            credentials.refresh(Request())
        connection.credentials_json = credentials_to_dict(credentials)
        connection.save(update_fields=["credentials_json", "updated_at"])

    with bypass_broken_local_proxy():
        return build("drive", "v3", credentials=credentials)


def ensure_folder(service, name: str, parent_id: str | None = None) -> str:
    folder_name = _sanitize_drive_name(name)
    query = [
        f"name = '{_escape_drive_query(folder_name)}'",
        "mimeType = 'application/vnd.google-apps.folder'",
        "trashed = false",
    ]
    if parent_id:
        query.append(f"'{parent_id}' in parents")

    with bypass_broken_local_proxy():
        result = service.files().list(
            q=" and ".join(query),
            spaces="drive",
            fields="files(id, name)",
            pageSize=1,
        ).execute()

    files = result.get("files", [])
    if files:
        return files[0]["id"]

    metadata = {"name": folder_name, "mimeType": "application/vnd.google-apps.folder"}
    if parent_id:
        metadata["parents"] = [parent_id]

    with bypass_broken_local_proxy():
        created = service.files().create(body=metadata, fields="id").execute()
    return created["id"]


def _get_category_folder_name(category: str, language: str) -> str:
    labels = CATEGORY_FOLDER_LABELS.get(category, CATEGORY_FOLDER_LABELS["lecture"])
    return labels["rus"] if language == "rus" else labels["kaz"]


def ensure_material_folder_tree(connection, discipline, category: str):
    service = get_drive_service(connection)
    root_folder_id = connection.root_folder_id or ensure_folder(service, "Lektor")

    if root_folder_id != connection.root_folder_id:
        connection.root_folder_id = root_folder_id
        connection.save(update_fields=["root_folder_id", "updated_at"])

    course_folder_id = ensure_folder(service, f"{discipline.course.number} курс", root_folder_id)
    discipline_folder_id = ensure_folder(service, discipline.title, course_folder_id)
    category_folder_id = ensure_folder(
        service,
        _get_category_folder_name(category, discipline.language),
        discipline_folder_id,
    )

    return service, category_folder_id


def upload_material_file(connection, discipline, category: str, uploaded_file):
    service, category_folder_id = ensure_material_folder_tree(connection, discipline, category)

    original_name = Path(uploaded_file.name or "material").name
    drive_name = _sanitize_drive_name(original_name)
    media = MediaIoBaseUpload(
        io.BytesIO(uploaded_file.read()),
        mimetype=uploaded_file.content_type or "application/octet-stream",
        resumable=True,
    )

    metadata = {"name": drive_name, "parents": [category_folder_id]}

    with bypass_broken_local_proxy():
        created = service.files().create(
            body=metadata,
            media_body=media,
            fields="id, name, mimeType, webViewLink, webContentLink",
        ).execute()

    return {
        "file_id": created.get("id", ""),
        "folder_id": category_folder_id,
        "cloud_url": created.get("webViewLink") or created.get("webContentLink") or "",
        "mime_type": created.get("mimeType", ""),
        "original_filename": original_name,
        "title": Path(original_name).stem,
    }


def delete_material_file(connection, file_id: str):
    if not file_id:
        return

    service = get_drive_service(connection)
    with bypass_broken_local_proxy():
        service.files().delete(fileId=file_id).execute()


def download_material_bytes(connection, file_id: str, mime_type: str = "") -> bytes:
    if not file_id:
        return b""

    service = get_drive_service(connection)
    buffer = io.BytesIO()

    if mime_type == "application/vnd.google-apps.document":
        request = service.files().export_media(fileId=file_id, mimeType="text/plain")
    else:
        request = service.files().get_media(fileId=file_id)

    with bypass_broken_local_proxy():
        downloader = MediaIoBaseDownload(buffer, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()

    return buffer.getvalue()


def _decode_text_bytes(content: bytes) -> str:
    for encoding in ("utf-8", "utf-8-sig", "cp1251", "latin-1"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    return content.decode("utf-8", errors="ignore")


def _extract_docx_text(content: bytes) -> str:
    with zipfile.ZipFile(io.BytesIO(content)) as archive:
        xml_bytes = archive.read("word/document.xml")
    root = ElementTree.fromstring(xml_bytes)
    return "\n".join(node.strip() for node in root.itertext() if node and node.strip())


def _extract_pptx_text(content: bytes) -> str:
    with zipfile.ZipFile(io.BytesIO(content)) as archive:
        slide_files = sorted(
            name for name in archive.namelist()
            if name.startswith("ppt/slides/slide") and name.endswith(".xml")
        )
        chunks = []
        for slide_name in slide_files:
            root = ElementTree.fromstring(archive.read(slide_name))
            slide_text = [node.strip() for node in root.itertext() if node and node.strip()]
            if slide_text:
                chunks.append("\n".join(slide_text))
    return "\n\n".join(chunks)


def _extract_pdf_text(content: bytes) -> str:
    reader = PdfReader(io.BytesIO(content))
    parts = []
    for page in reader.pages:
        text = (page.extract_text() or "").strip()
        if text:
            parts.append(text)
    return "\n\n".join(parts)


def extract_material_text(content: bytes, mime_type: str = "", original_filename: str = "") -> str:
    if not content:
        return ""

    suffix = Path(original_filename or "").suffix.lower()
    normalized_mime = (mime_type or "").lower()

    if normalized_mime.startswith("text/") or suffix in {".txt", ".md", ".csv", ".json", ".html", ".xml"}:
        return _decode_text_bytes(content)

    if normalized_mime == "application/vnd.google-apps.document" or suffix == ".docx":
        return _extract_docx_text(content)

    if suffix == ".pptx" or normalized_mime == "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        return _extract_pptx_text(content)

    if suffix == ".pdf" or normalized_mime == "application/pdf":
        return _extract_pdf_text(content)

    return _decode_text_bytes(content)
