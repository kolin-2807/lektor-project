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

    # Temporary fallback until full user accounts are added.
    # In local/dev mode, if there is only one connected teacher, reuse it.
    connection = GoogleDriveConnection.objects.order_by("-updated_at").first()
    if connection and GoogleDriveConnection.objects.count() == 1:
        request.session["google_drive_connection_id"] = connection.id
        request.session.modified = True
        return connection

    return None
