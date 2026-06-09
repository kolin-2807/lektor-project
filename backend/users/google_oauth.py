import json
import os
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlencode, urlparse

from django.conf import settings

try:
    from google.auth.transport.requests import AuthorizedSession
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import Flow
except ImportError:  # pragma: no cover - optional dependency in some environments
    AuthorizedSession = None
    Credentials = None
    Flow = None


OAUTH_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    # `drive.file` is too narrow for manually created Google Slides master templates.
    # We need full Drive access so the authenticated user can copy a template they own.
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/forms.body",
    "https://www.googleapis.com/auth/forms.responses.readonly",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/presentations",
]

DEFAULT_GOOGLE_TOKEN_URI = "https://oauth2.googleapis.com/token"
GOOGLE_DRIVE_FULL_SCOPE = "https://www.googleapis.com/auth/drive"

SESSION_CONNECTION_KEY = "google_drive_connection_id"
SESSION_OAUTH_STATE_KEY = "google_drive_oauth_state"
SESSION_OAUTH_CODE_VERIFIER_KEY = "google_drive_oauth_code_verifier"
SESSION_FRONTEND_SUCCESS_URL_KEY = "google_drive_frontend_success_url"
BROKEN_LOCAL_PROXY_MARKERS = ("127.0.0.1:9", "localhost:9")


class GoogleOAuthCredentialsError(RuntimeError):
    """Raised when stored Google OAuth credentials can no longer be used safely."""


@contextmanager
def bypass_broken_local_proxy():
    removed_values = {}

    for key in ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"):
        value = os.environ.get(key)
        if value and any(marker in value for marker in BROKEN_LOCAL_PROXY_MARKERS):
            removed_values[key] = value
            os.environ.pop(key, None)

    try:
        yield
    finally:
        for key, value in removed_values.items():
            os.environ[key] = value


def _get_request_origin(request=None):
    if request is None:
        return ""

    try:
        return request.build_absolute_uri("/").rstrip("/")
    except Exception:
        return ""


def _is_local_hostname(hostname: str | None) -> bool:
    return (hostname or "").strip().lower() in {"127.0.0.1", "localhost"}


def _normalize_origin(raw_value: str) -> str:
    parsed = urlparse(str(raw_value or "").strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return ""
    return f"{parsed.scheme}://{parsed.netloc}"


def _normalize_frontend_url(raw_value: str) -> str:
    parsed = urlparse(str(raw_value or "").strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return ""

    path = parsed.path or "/"
    normalized = f"{parsed.scheme}://{parsed.netloc}{path}"
    if parsed.query:
        normalized = f"{normalized}?{parsed.query}"
    return normalized


def _origin_hostname(origin: str) -> str:
    return (urlparse(origin).hostname or "").strip().lower()


def _is_allowed_frontend_origin(origin: str, request=None) -> bool:
    normalized_origin = _normalize_origin(origin)
    if not normalized_origin:
        return False

    if settings.DEBUG and _is_local_hostname(_origin_hostname(normalized_origin)):
        return True

    allowed_origins = {
        _normalize_origin(item)
        for item in [
            getattr(settings, "PUBLIC_APP_ORIGIN", ""),
            os.getenv("GOOGLE_OAUTH_FRONTEND_SUCCESS_URL", ""),
            _get_request_origin(request),
            *getattr(settings, "CORS_ALLOWED_ORIGINS", []),
            *getattr(settings, "CSRF_TRUSTED_ORIGINS", []),
        ]
        if item
    }

    return normalized_origin in allowed_origins


def _is_allowed_frontend_url(url: str, request=None) -> bool:
    normalized_url = _normalize_frontend_url(url)
    if not normalized_url:
        return False

    return _is_allowed_frontend_origin(_normalize_origin(normalized_url), request)


def _get_request_frontend_origin(request=None) -> str:
    if request is None:
        return ""

    origin = _normalize_origin(request.headers.get("Origin", ""))
    if origin and _is_allowed_frontend_origin(origin, request):
        return origin

    referer = _normalize_origin(request.headers.get("Referer", ""))
    if referer and _is_allowed_frontend_origin(referer, request):
        return referer

    return ""


def _load_web_client_config(request=None):
    client_id = os.getenv("GOOGLE_OAUTH_WEB_CLIENT_ID", "").strip()
    client_secret = os.getenv("GOOGLE_OAUTH_WEB_CLIENT_SECRET", "").strip()

    if client_id and client_secret:
        return {
            "web": {
                "client_id": client_id,
                "project_id": os.getenv("GOOGLE_OAUTH_PROJECT_ID", "lektor-google-drive"),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_secret": client_secret,
                "redirect_uris": [get_oauth_redirect_uri(request)],
            }
        }

    credentials_file = Path(settings.BASE_DIR) / "credentials.json"
    if settings.DEBUG and credentials_file.exists():
        data = json.loads(credentials_file.read_text(encoding="utf-8"))
        if "web" in data:
            return data

    return None


def get_oauth_redirect_uri(request=None):
    configured_uri = os.getenv("GOOGLE_OAUTH_REDIRECT_URI", "").strip()
    request_origin = _get_request_origin(request)

    if configured_uri:
        configured_host = urlparse(configured_uri).hostname
        request_host = urlparse(request_origin).hostname if request_origin else ""
        if request_origin and not _is_local_hostname(request_host) and _is_local_hostname(configured_host):
            return f"{request_origin}/api/users/drive/callback/"
        if request_origin and _is_local_hostname(request_host) and configured_host and not _is_local_hostname(configured_host):
            return f"{request_origin}/api/users/drive/callback/"
        return configured_uri

    if request_origin:
        return f"{request_origin}/api/users/drive/callback/"

    return "http://127.0.0.1:8000/api/users/drive/callback/"


def get_frontend_success_url(request=None):
    session_url = ""
    if request is not None:
        session_url = _normalize_frontend_url(getattr(request, "session", {}).get(SESSION_FRONTEND_SUCCESS_URL_KEY, ""))
        if session_url and _is_allowed_frontend_url(session_url, request):
            return session_url

    frontend_origin = _get_request_frontend_origin(request)
    if frontend_origin:
        return f"{frontend_origin}/"

    configured_url = os.getenv("GOOGLE_OAUTH_FRONTEND_SUCCESS_URL", "").strip()
    request_origin = _get_request_origin(request)

    if configured_url:
        configured_host = urlparse(configured_url).hostname
        request_host = urlparse(request_origin).hostname if request_origin else ""
        if request_origin and not _is_local_hostname(request_host) and _is_local_hostname(configured_host):
            return f"{request_origin}/"
        if request_origin and _is_local_hostname(request_host) and configured_host and not _is_local_hostname(configured_host):
            return f"{request_origin}/"
        return configured_url

    if request_origin:
        return f"{request_origin}/"

    return "http://127.0.0.1:5500/"


def _allow_local_insecure_oauth_transport(request=None):
    redirect_uri = get_oauth_redirect_uri(request)
    parsed_uri = urlparse(redirect_uri)

    if parsed_uri.scheme == "https":
        return

    if parsed_uri.hostname in {"127.0.0.1", "localhost"}:
        os.environ.setdefault("OAUTHLIB_INSECURE_TRANSPORT", "1")

    os.environ.setdefault("OAUTHLIB_RELAX_TOKEN_SCOPE", "1")


def is_local_oauth_redirect(request=None):
    redirect_uri = get_oauth_redirect_uri(request)
    parsed_uri = urlparse(redirect_uri)
    return parsed_uri.hostname in {"127.0.0.1", "localhost"}


def is_google_drive_oauth_ready(request=None):
    return _load_web_client_config(request) is not None


def build_google_drive_flow(request=None, state=None, code_verifier=None):
    config = _load_web_client_config(request)
    if not config:
        raise RuntimeError("Google Drive OAuth is not configured.")

    if Flow is None:
        raise RuntimeError("Google OAuth dependencies are not installed.")

    _allow_local_insecure_oauth_transport(request)
    flow = Flow.from_client_config(
        config,
        scopes=OAUTH_SCOPES,
        state=state,
        code_verifier=code_verifier,
    )
    flow.redirect_uri = get_oauth_redirect_uri(request)
    return flow


def exchange_google_oauth_code(flow, code: str):
    with bypass_broken_local_proxy():
        flow.fetch_token(code=code)
    return flow.credentials


def credentials_to_dict(credentials: Any) -> dict:
    if credentials is None:
        raise RuntimeError("Google OAuth dependencies are not installed.")
    return json.loads(credentials.to_json())


def _parse_google_expiry(raw_value: Any):
    raw_text = str(raw_value or "").strip()
    if not raw_text:
        return None

    normalized = raw_text.replace("Z", "+00:00")
    try:
        expiry = datetime.fromisoformat(normalized)
        if expiry.tzinfo is not None:
            expiry = expiry.astimezone(timezone.utc).replace(tzinfo=None)
        return expiry
    except ValueError:
        return None


def _build_google_credentials(data: dict, granted_scopes: list[str]):
    token = str(data.get("token") or "").strip()
    client_id = str(data.get("client_id") or "").strip()
    client_secret = str(data.get("client_secret") or "").strip()
    token_uri = str(data.get("token_uri") or DEFAULT_GOOGLE_TOKEN_URI).strip() or DEFAULT_GOOGLE_TOKEN_URI

    if not token or not client_id or not client_secret:
        raise GoogleOAuthCredentialsError(
            "Stored Google Drive connection is incomplete. Reconnect Google Drive and try again."
        )

    return Credentials(
        token=token,
        refresh_token=str(data.get("refresh_token") or "").strip() or None,
        id_token=data.get("id_token"),
        token_uri=token_uri,
        client_id=client_id,
        client_secret=client_secret,
        scopes=granted_scopes,
        expiry=_parse_google_expiry(data.get("expiry")),
    )


def credentials_from_dict(data: dict):
    if Credentials is None:
        raise RuntimeError("Google OAuth dependencies are not installed.")
    if not isinstance(data, dict) or not data:
        raise GoogleOAuthCredentialsError(
            "Google Drive connection is missing. Reconnect Google Drive and try again."
        )

    granted_scopes = data.get("scopes") or OAUTH_SCOPES
    refresh_token = str(data.get("refresh_token") or "").strip()

    if refresh_token:
        try:
            return Credentials.from_authorized_user_info(data, granted_scopes)
        except ValueError:
            pass

    return _build_google_credentials(data, granted_scopes)


def ensure_google_credentials_ready(credentials):
    if credentials is None:
        raise GoogleOAuthCredentialsError(
            "Google Drive connection is missing. Reconnect Google Drive and try again."
        )

    if getattr(credentials, "expired", False) and not getattr(credentials, "refresh_token", None):
        raise GoogleOAuthCredentialsError(
            "Google Drive connection expired. Reconnect Google Drive and grant access again."
        )

    return credentials


def has_google_scope(data: dict | None, required_scope: str) -> bool:
    if not isinstance(data, dict):
        return False

    scopes = data.get("scopes") or []
    if not isinstance(scopes, list):
        return False

    normalized_required_scope = str(required_scope or "").strip()
    return normalized_required_scope in {str(scope or "").strip() for scope in scopes}


def fetch_google_userinfo(credentials) -> dict:
    if AuthorizedSession is None:
        raise RuntimeError("Google OAuth dependencies are not installed.")
    with bypass_broken_local_proxy():
        session = AuthorizedSession(credentials)
        response = session.get("https://www.googleapis.com/oauth2/v2/userinfo", timeout=15)
        response.raise_for_status()
        return response.json()


def build_frontend_redirect_url(request=None, **params):
    base_url = get_frontend_success_url(request)
    if not params:
        return base_url
    separator = "&" if "?" in base_url else "?"
    return f"{base_url}{separator}{urlencode(params)}"
