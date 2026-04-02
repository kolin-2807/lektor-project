from django.db import models


class GoogleDriveConnection(models.Model):
    google_email = models.EmailField(unique=True)
    google_name = models.CharField(max_length=255, blank=True)
    credentials_json = models.JSONField(default=dict, blank=True)
    root_folder_id = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.google_email


def get_active_google_drive_connection(request):
    connection_id = request.session.get("google_drive_connection_id")
    if connection_id:
        try:
            return GoogleDriveConnection.objects.get(id=connection_id)
        except GoogleDriveConnection.DoesNotExist:
            request.session.pop("google_drive_connection_id", None)

    return None


def resolve_google_drive_connection(request, owner_email: str = ""):
    active_connection = get_active_google_drive_connection(request)
    normalized_owner_email = str(owner_email or "").strip().lower()

    if not active_connection:
        return None

    if normalized_owner_email and active_connection.google_email.strip().lower() != normalized_owner_email:
        return None

    return active_connection
