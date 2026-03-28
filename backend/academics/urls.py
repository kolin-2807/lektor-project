from django.urls import path
from .views import course_list, discipline_list

urlpatterns = [
    path("courses/", course_list, name="course-list"),
    path("disciplines/", discipline_list, name="discipline-list"),
]