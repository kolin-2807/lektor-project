from django.contrib import admin

from .models import GoogleDriveConnection


@admin.register(GoogleDriveConnection)
class GoogleDriveConnectionAdmin(admin.ModelAdmin):
    list_display = ("google_email", "google_name", "updated_at")
    search_fields = ("google_email", "google_name")
