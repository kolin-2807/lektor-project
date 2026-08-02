import logging

from django.http import HttpResponseRedirect
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .google_oauth import (
    SESSION_CONNECTION_KEY,
    SESSION_FRONTEND_SUCCESS_URL_KEY,
    SESSION_OAUTH_CODE_VERIFIER_KEY,
    SESSION_OAUTH_STATE_KEY,
    _is_allowed_frontend_url,
    build_frontend_redirect_url,
    build_google_drive_flow,
    credentials_to_dict,
    exchange_google_oauth_code,
    fetch_google_userinfo,
    get_frontend_success_url,
    is_google_drive_oauth_ready,
    is_local_oauth_redirect,
)
from .models import GoogleDriveConnection, get_active_google_drive_connection


logger = logging.getLogger(__name__)
SESSION_EXPECTED_GOOGLE_EMAIL_KEY = "google_drive_expected_email"


def _get_session_connection(request):
    return get_active_google_drive_connection(request)


def _merge_saved_google_credentials(existing_connection, new_payload: dict) -> dict:
    merged = dict(new_payload or {})
    saved_payload = dict(getattr(existing_connection, "credentials_json", {}) or {}) if existing_connection else {}

    for key in ("refresh_token", "client_id", "client_secret", "token_uri", "id_token"):
        if not str(merged.get(key) or "").strip() and str(saved_payload.get(key) or "").strip():
            merged[key] = saved_payload[key]

    if not merged.get("scopes") and saved_payload.get("scopes"):
        merged["scopes"] = saved_payload["scopes"]

    return merged


@ensure_csrf_cookie
@api_view(["GET"])
def drive_status(request):
    connection = _get_session_connection(request)
    return Response(
        {
            "configured": is_google_drive_oauth_ready(request),
            "connected": connection is not None,
            "google_email": connection.google_email if connection else "",
            "google_name": connection.google_name if connection else "",
        }
    )


@api_view(["GET"])
def drive_connect(request):
    if not is_google_drive_oauth_ready(request):
        return Response(
            {
                "detail": "Google Drive OAuth әлі бапталмаған. Google Cloud-та Web OAuth client қосу керек."
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    flow = build_google_drive_flow(request=request)
    login_hint = request.GET.get("login_hint", "").strip()
    expected_email = request.GET.get("expected_email", "").strip().lower()
    return_to = request.GET.get("return_to", "").strip()
    auth_params = {
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
    }
    if login_hint:
        auth_params["login_hint"] = login_hint

    authorization_url, state = flow.authorization_url(**auth_params)

    request.session[SESSION_OAUTH_STATE_KEY] = state
    request.session[SESSION_OAUTH_CODE_VERIFIER_KEY] = getattr(flow, "code_verifier", "")
    if return_to and _is_allowed_frontend_url(return_to, request):
        request.session[SESSION_FRONTEND_SUCCESS_URL_KEY] = return_to
    else:
        request.session[SESSION_FRONTEND_SUCCESS_URL_KEY] = get_frontend_success_url(request)
    if expected_email:
        request.session[SESSION_EXPECTED_GOOGLE_EMAIL_KEY] = expected_email
    else:
        request.session.pop(SESSION_EXPECTED_GOOGLE_EMAIL_KEY, None)
    request.session.modified = True

    return Response({"authorization_url": authorization_url})


@require_GET
def drive_callback(request):
    if not is_google_drive_oauth_ready(request):
        return HttpResponseRedirect(
            build_frontend_redirect_url(
                request,
                drive="error",
                message="google_drive_oauth_not_configured",
            )
        )

    expected_state = request.session.get(SESSION_OAUTH_STATE_KEY)
    incoming_state = request.GET.get("state")
    if (not expected_state or expected_state != incoming_state) and not is_local_oauth_redirect(request):
        return HttpResponseRedirect(
            build_frontend_redirect_url(
                request,
                drive="error",
                message="invalid_google_oauth_state",
            )
        )

    authorization_code = request.GET.get("code", "").strip()
    if not authorization_code:
        return HttpResponseRedirect(
            build_frontend_redirect_url(
                request,
                drive="error",
                message="missing_google_oauth_code",
            )
        )

    code_verifier = request.session.get(SESSION_OAUTH_CODE_VERIFIER_KEY) or None
    try:
        flow = build_google_drive_flow(request=request, state=incoming_state, code_verifier=code_verifier)
        exchange_google_oauth_code(flow, authorization_code)
    except Exception as exc:
        logger.exception("Google Drive token exchange failed")
        return HttpResponseRedirect(
            build_frontend_redirect_url(
                request,
                drive="error",
                message=f"google_drive_token_exchange_failed:{exc.__class__.__name__}",
            )
        )

    credentials = flow.credentials
    try:
        userinfo = fetch_google_userinfo(credentials)
    except Exception:
        logger.exception("Google Drive userinfo lookup failed")
        return HttpResponseRedirect(
            build_frontend_redirect_url(
                request,
                drive="error",
                message="Google Drive байланысын тексеру мүмкін болмады. Интернетті тексеріп, қайта қосылып көріңіз.",
            )
        )
    email = userinfo.get("email", "").strip()
    expected_email = request.session.get(SESSION_EXPECTED_GOOGLE_EMAIL_KEY, "").strip().lower()

    if not email:
        return HttpResponseRedirect(
            build_frontend_redirect_url(
                request,
                drive="error",
                message="google_email_not_received",
            )
        )

    if expected_email and email.lower() != expected_email:
        request.session.pop(SESSION_OAUTH_STATE_KEY, None)
        request.session.pop(SESSION_OAUTH_CODE_VERIFIER_KEY, None)
        request.session.pop(SESSION_FRONTEND_SUCCESS_URL_KEY, None)
        request.session.pop(SESSION_EXPECTED_GOOGLE_EMAIL_KEY, None)
        request.session.modified = True
        return HttpResponseRedirect(
            build_frontend_redirect_url(
                request,
                drive="error",
                message="Google аккаунты сәйкес келмеді. Өрістегі email-мен қайта кіріп көріңіз.",
            )
        )

    existing_connection = GoogleDriveConnection.objects.filter(google_email__iexact=email).first()
    credentials_payload = credentials_to_dict(credentials)
    credentials_payload = _merge_saved_google_credentials(existing_connection, credentials_payload)

    if not str(credentials_payload.get("refresh_token") or "").strip():
        logger.warning("Google OAuth credentials for %s were stored without a refresh token", email)

    connection, _ = GoogleDriveConnection.objects.update_or_create(
        google_email=email,
        defaults={
            "google_name": userinfo.get("name", ""),
            "credentials_json": credentials_payload,
        },
    )

    request.session[SESSION_CONNECTION_KEY] = connection.id
    redirect_url = build_frontend_redirect_url(
        request,
        drive="connected",
        email=connection.google_email,
    )
    request.session.pop(SESSION_OAUTH_STATE_KEY, None)
    request.session.pop(SESSION_OAUTH_CODE_VERIFIER_KEY, None)
    request.session.pop(SESSION_FRONTEND_SUCCESS_URL_KEY, None)
    request.session.pop(SESSION_EXPECTED_GOOGLE_EMAIL_KEY, None)
    request.session.modified = True

    return HttpResponseRedirect(redirect_url)


@api_view(["POST"])
def drive_disconnect(request):
    request.session.pop(SESSION_CONNECTION_KEY, None)
    request.session.pop(SESSION_OAUTH_STATE_KEY, None)
    request.session.pop(SESSION_OAUTH_CODE_VERIFIER_KEY, None)
    request.session.pop(SESSION_FRONTEND_SUCCESS_URL_KEY, None)
    request.session.pop(SESSION_EXPECTED_GOOGLE_EMAIL_KEY, None)
    request.session.modified = True
    return Response({"success": True})
