from django.http import HttpResponseRedirect
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .google_oauth import (
    SESSION_CONNECTION_KEY,
    SESSION_OAUTH_CODE_VERIFIER_KEY,
    SESSION_OAUTH_STATE_KEY,
    build_frontend_redirect_url,
    build_google_drive_flow,
    credentials_to_dict,
    fetch_google_userinfo,
    is_google_drive_oauth_ready,
    is_local_oauth_redirect,
)
from .models import GoogleDriveConnection, get_active_google_drive_connection


def _get_session_connection(request):
    return get_active_google_drive_connection(request)


@ensure_csrf_cookie
@api_view(["GET"])
def drive_status(request):
    connection = _get_session_connection(request)
    return Response(
        {
            "configured": is_google_drive_oauth_ready(),
            "connected": connection is not None,
            "google_email": connection.google_email if connection else "",
            "google_name": connection.google_name if connection else "",
        }
    )


@api_view(["GET"])
def drive_connect(request):
    if not is_google_drive_oauth_ready():
        return Response(
            {
                "detail": "Google Drive OAuth әлі бапталмаған. Google Cloud-та Web OAuth client қосу керек."
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    flow = build_google_drive_flow()
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        prompt="consent",
    )

    request.session[SESSION_OAUTH_STATE_KEY] = state
    request.session[SESSION_OAUTH_CODE_VERIFIER_KEY] = getattr(flow, "code_verifier", "")
    request.session.modified = True

    return Response({"authorization_url": authorization_url})


@require_GET
def drive_callback(request):
    if not is_google_drive_oauth_ready():
        return HttpResponseRedirect(
            build_frontend_redirect_url(
                drive="error",
                message="google_drive_oauth_not_configured",
            )
        )

    expected_state = request.session.get(SESSION_OAUTH_STATE_KEY)
    incoming_state = request.GET.get("state")
    if (not expected_state or expected_state != incoming_state) and not is_local_oauth_redirect():
        return HttpResponseRedirect(
            build_frontend_redirect_url(
                drive="error",
                message="invalid_google_oauth_state",
            )
        )

    authorization_code = request.GET.get("code", "").strip()
    if not authorization_code:
        return HttpResponseRedirect(
            build_frontend_redirect_url(
                drive="error",
                message="missing_google_oauth_code",
            )
        )

    code_verifier = request.session.get(SESSION_OAUTH_CODE_VERIFIER_KEY) or None
    try:
        flow = build_google_drive_flow(state=incoming_state, code_verifier=code_verifier)
        flow.fetch_token(code=authorization_code)
    except Exception as exc:
        print("Google Drive token exchange error:", repr(exc))
        return HttpResponseRedirect(
            build_frontend_redirect_url(
                drive="error",
                message=f"google_drive_token_exchange_failed:{exc.__class__.__name__}",
            )
        )

    credentials = flow.credentials
    userinfo = fetch_google_userinfo(credentials)
    email = userinfo.get("email", "").strip()

    if not email:
        return HttpResponseRedirect(
            build_frontend_redirect_url(
                drive="error",
                message="google_email_not_received",
            )
        )

    connection, _ = GoogleDriveConnection.objects.update_or_create(
        google_email=email,
        defaults={
            "google_name": userinfo.get("name", ""),
            "credentials_json": credentials_to_dict(credentials),
        },
    )

    request.session[SESSION_CONNECTION_KEY] = connection.id
    request.session.pop(SESSION_OAUTH_STATE_KEY, None)
    request.session.pop(SESSION_OAUTH_CODE_VERIFIER_KEY, None)
    request.session.modified = True

    return HttpResponseRedirect(
        build_frontend_redirect_url(
            drive="connected",
            email=connection.google_email,
        )
    )


@api_view(["POST"])
def drive_disconnect(request):
    request.session.pop(SESSION_CONNECTION_KEY, None)
    request.session.pop(SESSION_OAUTH_STATE_KEY, None)
    request.session.pop(SESSION_OAUTH_CODE_VERIFIER_KEY, None)
    request.session.modified = True
    return Response({"success": True})
