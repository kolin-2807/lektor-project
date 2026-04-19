import os
from unittest.mock import patch

from django.test import RequestFactory, SimpleTestCase

from .google_oauth import (
    SESSION_FRONTEND_SUCCESS_URL_KEY,
    build_frontend_redirect_url,
    exchange_google_oauth_code,
    fetch_google_userinfo,
    get_frontend_success_url,
    get_oauth_redirect_uri,
)


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
