from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from users.models import GoogleDriveConnection

from .models import Course


class CourseListAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.course = Course.objects.create(number=1)

    def test_course_list_requires_google_session(self):
        response = self.client.get(reverse("course-list"))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.json()["detail"], "Google login required.")

    def test_course_list_returns_courses_for_active_google_session(self):
        connection = GoogleDriveConnection.objects.create(
            google_email="teacher@example.com",
            google_name="Teacher Example",
            credentials_json={},
        )
        session = self.client.session
        session["google_drive_connection_id"] = connection.id
        session.save()

        response = self.client.get(reverse("course-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), [{"id": self.course.id, "number": 1}])
