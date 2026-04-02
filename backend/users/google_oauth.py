import json
import os
from contextlib import contextmanager
from pathlib import Path
from urllib.parse import urlencode, urlparse

from django.conf import settings
from google.auth.transport.requests import AuthorizedSession
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow


OAUTH_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/forms.body",
    "https://www.googleapis.com/auth/forms.responses.readonly",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
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


def _load_web_client_config():
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
                "redirect_uris": [get_oauth_redirect_uri()],
            }
        }

    credentials_file = Path(settings.BASE_DIR) / "credentials.json"
    if credentials_file.exists():
        data = json.loads(credentials_file.read_text(encoding="utf-8"))
        if "web" in data:
            return data

    return None


def get_oauth_redirect_uri():
    return os.getenv(
        "GOOGLE_OAUTH_REDIRECT_URI",
        "http://127.0.0.1:8000/api/users/drive/callback/",
    ).strip()


def get_frontend_success_url():
    return os.getenv(
        "GOOGLE_OAUTH_FRONTEND_SUCCESS_URL",
        "http://127.0.0.1:5500/",
    ).strip()


def _allow_local_insecure_oauth_transport():
    redirect_uri = get_oauth_redirect_uri()
    parsed_uri = urlparse(redirect_uri)

    if parsed_uri.scheme == "https":
        return

    if parsed_uri.hostname in {"127.0.0.1", "localhost"}:
        os.environ.setdefault("OAUTHLIB_INSECURE_TRANSPORT", "1")

    # Google may return granted scopes in a different order / shape than requested.
    # Relaxing token scope validation avoids oauthlib turning that into a hard error.
    os.environ.setdefault("OAUTHLIB_RELAX_TOKEN_SCOPE", "1")


def is_local_oauth_redirect():
    redirect_uri = get_oauth_redirect_uri()
    parsed_uri = urlparse(redirect_uri)
    return parsed_uri.hostname in {"127.0.0.1", "localhost"}


def is_google_drive_oauth_ready():
    return _load_web_client_config() is not None


def build_google_drive_flow(state=None, code_verifier=None):
    config = _load_web_client_config()
    if not config:
        raise RuntimeError(
            "Google Drive OAuth әлі бапталмаған. Web OAuth client credentials қосу керек."
        )

    _allow_local_insecure_oauth_transport()
    flow = Flow.from_client_config(
        config,
        scopes=OAUTH_SCOPES,
        state=state,
        code_verifier=code_verifier,
    )
    flow.redirect_uri = get_oauth_redirect_uri()
    return flow


def credentials_to_dict(credentials: Credentials) -> dict:
    return json.loads(credentials.to_json())


def credentials_from_dict(data: dict) -> Credentials:
    return Credentials.from_authorized_user_info(data, OAUTH_SCOPES)


def fetch_google_userinfo(credentials: Credentials) -> dict:
    session = AuthorizedSession(credentials)
    response = session.get("https://www.googleapis.com/oauth2/v2/userinfo", timeout=15)
    response.raise_for_status()
    return response.json()


def build_frontend_redirect_url(**params):
    base_url = get_frontend_success_url()
    if not params:
        return base_url
    separator = "&" if "?" in base_url else "?"
    return f"{base_url}{separator}{urlencode(params)}"
