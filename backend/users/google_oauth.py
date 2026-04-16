import json
import os
from contextlib import contextmanager
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
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/forms.body",
    "https://www.googleapis.com/auth/forms.responses.readonly",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/presentations",
]

SESSION_CONNECTION_KEY = "google_drive_connection_id"
SESSION_OAUTH_STATE_KEY = "google_drive_oauth_state"
SESSION_OAUTH_CODE_VERIFIER_KEY = "google_drive_oauth_code_verifier"
BROKEN_LOCAL_PROXY_MARKERS = ("127.0.0.1:9", "localhost:9")


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
        return configured_uri

    if request_origin:
        return f"{request_origin}/api/users/drive/callback/"

    return "http://127.0.0.1:8000/api/users/drive/callback/"


def get_frontend_success_url(request=None):
    configured_url = os.getenv("GOOGLE_OAUTH_FRONTEND_SUCCESS_URL", "").strip()
    request_origin = _get_request_origin(request)

    if configured_url:
        configured_host = urlparse(configured_url).hostname
        request_host = urlparse(request_origin).hostname if request_origin else ""
        if request_origin and not _is_local_hostname(request_host) and _is_local_hostname(configured_host):
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


def credentials_from_dict(data: dict):
    if Credentials is None:
        raise RuntimeError("Google OAuth dependencies are not installed.")
    granted_scopes = data.get("scopes") or OAUTH_SCOPES
    return Credentials.from_authorized_user_info(data, granted_scopes)


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
