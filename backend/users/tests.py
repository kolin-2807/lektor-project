import os
from pathlib import Path
from unittest.mock import patch

from django.test import Client, RequestFactory, SimpleTestCase, TestCase

from .google_oauth import (
    GoogleOAuthCredentialsError,
    SESSION_FRONTEND_SUCCESS_URL_KEY,
    SESSION_OAUTH_CODE_VERIFIER_KEY,
    SESSION_OAUTH_STATE_KEY,
    build_frontend_redirect_url,
    credentials_from_dict,
    ensure_google_credentials_ready,
    exchange_google_oauth_code,
    fetch_google_userinfo,
    get_frontend_success_url,
    get_oauth_redirect_uri,
)
from .models import GoogleDriveConnection


class GoogleOAuthRuntimeUrlTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_uses_request_origin_for_oauth_redirect_when_env_not_set(self):
        request = self.factory.get(
            "/api/users/drive/connect/",
            HTTP_HOST="demo.trycloudflare.com",
            HTTP_X_FORWARDED_PROTO="https",
        )

        with patch.dict(
            os.environ,
            {
                "GOOGLE_OAUTH_REDIRECT_URI": "",
                "GOOGLE_OAUTH_FRONTEND_SUCCESS_URL": "",
            },
            clear=False,
        ):
            redirect_uri = get_oauth_redirect_uri(request)

        self.assertEqual(
            redirect_uri,
            "https://demo.trycloudflare.com/api/users/drive/callback/",
        )

    def test_uses_request_origin_for_frontend_redirect_when_env_not_set(self):
        request = self.factory.get(
            "/api/users/drive/callback/",
            HTTP_HOST="demo.trycloudflare.com",
            HTTP_X_FORWARDED_PROTO="https",
        )

        with patch.dict(
            os.environ,
            {
                "GOOGLE_OAUTH_FRONTEND_SUCCESS_URL": "",
            },
            clear=False,
        ):
            redirect_url = build_frontend_redirect_url(request, drive="connected")

        self.assertEqual(
            redirect_url,
            "https://demo.trycloudflare.com/?drive=connected",
        )

    def test_exchange_google_oauth_code_ignores_broken_proxy_env(self):
        observed = {}

        class DummyFlow:
            credentials = object()

            def fetch_token(self, code):
                observed["code"] = code
                observed["http_proxy"] = os.environ.get("HTTP_PROXY")
                observed["https_proxy"] = os.environ.get("HTTPS_PROXY")

        with patch.dict(
            os.environ,
            {
                "HTTP_PROXY": "http://127.0.0.1:9",
                "HTTPS_PROXY": "http://127.0.0.1:9",
            },
            clear=False,
        ):
            credentials = exchange_google_oauth_code(DummyFlow(), "demo-code")

        self.assertEqual(observed["code"], "demo-code")
        self.assertIsNone(observed["http_proxy"])
        self.assertIsNone(observed["https_proxy"])
        self.assertIsNotNone(credentials)

    def test_fetch_google_userinfo_ignores_broken_proxy_env(self):
        observed = {}

        class DummyResponse:
            def raise_for_status(self):
                return None

            def json(self):
                return {"email": "demo@example.com"}

        class DummySession:
            def __init__(self, credentials):
                observed["credentials"] = credentials

            def get(self, url, timeout=15):
                observed["url"] = url
                observed["timeout"] = timeout
                observed["http_proxy"] = os.environ.get("HTTP_PROXY")
                observed["https_proxy"] = os.environ.get("HTTPS_PROXY")
                return DummyResponse()

        with patch("users.google_oauth.AuthorizedSession", DummySession):
            with patch.dict(
                os.environ,
                {
                    "HTTP_PROXY": "http://127.0.0.1:9",
                    "HTTPS_PROXY": "http://127.0.0.1:9",
                },
                clear=False,
            ):
                payload = fetch_google_userinfo(object())

        self.assertEqual(payload["email"], "demo@example.com")
        self.assertIsNone(observed["http_proxy"])
        self.assertIsNone(observed["https_proxy"])

    def test_tunnel_request_overrides_localhost_oauth_env_urls(self):
        request = self.factory.get(
            "/api/users/drive/connect/",
            HTTP_HOST="demo.trycloudflare.com",
            HTTP_X_FORWARDED_PROTO="https",
        )

        with patch.dict(
            os.environ,
            {
                "GOOGLE_OAUTH_REDIRECT_URI": "http://127.0.0.1:8000/api/users/drive/callback/",
                "GOOGLE_OAUTH_FRONTEND_SUCCESS_URL": "http://127.0.0.1:5500/",
            },
            clear=False,
        ):
            redirect_uri = get_oauth_redirect_uri(request)
            redirect_url = build_frontend_redirect_url(request, drive="connected")

        self.assertEqual(
            redirect_uri,
            "https://demo.trycloudflare.com/api/users/drive/callback/",
        )
        self.assertEqual(
            redirect_url,
            "https://demo.trycloudflare.com/?drive=connected",
        )

    def test_local_request_overrides_production_oauth_env_urls(self):
        request = self.factory.get(
            "/api/users/drive/connect/",
            HTTP_HOST="127.0.0.1:8000",
            HTTP_ORIGIN="http://127.0.0.1:5500",
        )

        with patch.dict(
            os.environ,
            {
                "GOOGLE_OAUTH_REDIRECT_URI": "https://kajy.pythonanywhere.com/api/users/drive/callback/",
                "GOOGLE_OAUTH_FRONTEND_SUCCESS_URL": "https://kajy.pythonanywhere.com/",
            },
            clear=False,
        ):
            redirect_uri = get_oauth_redirect_uri(request)
            frontend_url = get_frontend_success_url(request)

        self.assertEqual(
            redirect_uri,
            "http://127.0.0.1:8000/api/users/drive/callback/",
        )
        self.assertEqual(frontend_url, "http://127.0.0.1:5500/")

    def test_callback_uses_stored_frontend_success_url(self):
        request = self.factory.get(
            "/api/users/drive/callback/",
            HTTP_HOST="127.0.0.1:8000",
        )
        request.session = {
            SESSION_FRONTEND_SUCCESS_URL_KEY: "http://127.0.0.1:5500/",
        }

        with patch.dict(
            os.environ,
            {
                "GOOGLE_OAUTH_FRONTEND_SUCCESS_URL": "https://kajy.pythonanywhere.com/",
            },
            clear=False,
        ):
            redirect_url = build_frontend_redirect_url(request, drive="connected")

        self.assertEqual(
            redirect_url,
            "http://127.0.0.1:5500/?drive=connected",
        )


class FrontendEntryRouteTests(SimpleTestCase):
    def _read_stream(self, response):
        return b"".join(response.streaming_content)

    def test_root_and_legacy_landing_routes_serve_index_html(self):
        expected_html = (Path(__file__).resolve().parents[2] / "frontend" / "index.html").read_bytes()

        for route in ("/", "/index.html", "/landing.html"):
            with self.subTest(route=route):
                response = self.client.get(route)

                self.assertEqual(response.status_code, 200)
                self.assertEqual(response["Content-Type"], "text/html")
                self.assertEqual(self._read_stream(response), expected_html)


class GoogleOAuthCredentialParsingTests(SimpleTestCase):
    def test_accepts_stored_credentials_without_refresh_token_while_token_is_valid(self):
        credentials = credentials_from_dict(
            {
                "token": "access-token",
                "client_id": "client-id",
                "client_secret": "client-secret",
                "token_uri": "https://oauth2.googleapis.com/token",
                "scopes": ["openid", "https://www.googleapis.com/auth/drive.file"],
                "expiry": "2999-01-01T00:00:00Z",
            }
        )

        self.assertEqual(credentials.token, "access-token")
        self.assertIsNone(credentials.refresh_token)
        self.assertEqual(credentials.client_id, "client-id")

    def test_requires_reconnect_when_expired_credentials_have_no_refresh_token(self):
        credentials = credentials_from_dict(
            {
                "token": "expired-access-token",
                "client_id": "client-id",
                "client_secret": "client-secret",
                "token_uri": "https://oauth2.googleapis.com/token",
                "scopes": ["openid", "https://www.googleapis.com/auth/drive.file"],
                "expiry": "2000-01-01T00:00:00Z",
            }
        )

        with self.assertRaises(GoogleOAuthCredentialsError):
            ensure_google_credentials_ready(credentials)


class GoogleDriveOauthViewTests(TestCase):
    def setUp(self):
        self.client = Client()

    @patch("users.views.build_google_drive_flow")
    @patch("users.views.is_google_drive_oauth_ready", return_value=True)
    def test_drive_connect_requests_consent_and_offline_access(self, _mocked_ready, mocked_build_flow):
        observed = {}

        class DummyFlow:
            code_verifier = "verifier-123"

            def authorization_url(self, **kwargs):
                observed.update(kwargs)
                return "https://accounts.google.com/o/oauth2/auth", "oauth-state-1"

        mocked_build_flow.return_value = DummyFlow()

        response = self.client.get("/api/users/drive/connect/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(observed["access_type"], "offline")
        self.assertEqual(observed["prompt"], "consent")
        self.assertEqual(observed["include_granted_scopes"], "true")

    @patch("users.views.credentials_to_dict")
    @patch("users.views.fetch_google_userinfo")
    @patch("users.views.exchange_google_oauth_code")
    @patch("users.views.build_google_drive_flow")
    @patch("users.views.is_google_drive_oauth_ready", return_value=True)
    def test_drive_callback_preserves_existing_refresh_token(
        self,
        _mocked_ready,
        mocked_build_flow,
        _mocked_exchange,
        mocked_fetch_userinfo,
        mocked_credentials_to_dict,
    ):
        existing = GoogleDriveConnection.objects.create(
            google_email="teacher@example.com",
            google_name="Teacher",
            credentials_json={
                "token": "old-access-token",
                "refresh_token": "saved-refresh-token",
                "client_id": "client-id",
                "client_secret": "client-secret",
                "token_uri": "https://oauth2.googleapis.com/token",
                "scopes": ["openid", "https://www.googleapis.com/auth/drive.file"],
            },
        )

        class DummyFlow:
            credentials = object()

        mocked_build_flow.return_value = DummyFlow()
        mocked_fetch_userinfo.return_value = {
            "email": "teacher@example.com",
            "name": "Teacher Updated",
        }
        mocked_credentials_to_dict.return_value = {
            "token": "new-access-token",
            "client_id": "client-id",
            "client_secret": "client-secret",
            "token_uri": "https://oauth2.googleapis.com/token",
            "scopes": ["openid", "https://www.googleapis.com/auth/drive.file"],
        }

        session = self.client.session
        session[SESSION_OAUTH_STATE_KEY] = "oauth-state-2"
        session[SESSION_OAUTH_CODE_VERIFIER_KEY] = "verifier-456"
        session.save()

        response = self.client.get(
            "/api/users/drive/callback/",
            {
                "state": "oauth-state-2",
                "code": "oauth-code-2",
            },
        )

        self.assertEqual(response.status_code, 302)
        existing.refresh_from_db()
        self.assertEqual(existing.google_name, "Teacher Updated")
        self.assertEqual(existing.credentials_json["token"], "new-access-token")
        self.assertEqual(existing.credentials_json["refresh_token"], "saved-refresh-token")
