import os

import django


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from results.google_service import get_google_credentials
from users.models import GoogleDriveConnection


connection = GoogleDriveConnection.objects.order_by("-updated_at").first()
if not connection:
    raise SystemExit("No GoogleDriveConnection found. Connect a Google account first.")

creds = get_google_credentials(connection)
print("Google auth OK")
print(creds.valid)
print(connection.google_email)
