import os
from unittest import skipUnless

from django.test import TestCase

from results.google_service import get_google_credentials
from users.models import GoogleDriveConnection


@skipUnless(os.getenv("RUN_LIVE_GOOGLE_TESTS") == "1", "Live Google auth smoke test is disabled.")
class LiveGoogleAuthSmokeTests(TestCase):
    def test_latest_connected_account_credentials_are_valid(self):
        connection = GoogleDriveConnection.objects.order_by("-updated_at").first()
        self.assertIsNotNone(connection, "Connect a Google account first.")

        credentials = get_google_credentials(connection)

        self.assertTrue(credentials.valid)
        self.assertTrue(connection.google_email)
