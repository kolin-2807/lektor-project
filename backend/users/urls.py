from django.urls import path

from .views import (
    drive_callback,
    drive_connect,
    drive_disconnect,
    drive_status,
)


urlpatterns = [
    path("users/drive/status/", drive_status, name="drive-status"),
    path("users/drive/connect/", drive_connect, name="drive-connect"),
    path("users/drive/callback/", drive_callback, name="drive-callback"),
    path("users/drive/disconnect/", drive_disconnect, name="drive-disconnect"),
]
