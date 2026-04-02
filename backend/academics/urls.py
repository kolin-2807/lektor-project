from django.urls import path
from .views import course_list, discipline_list, discipline_detail

urlpatterns = [
    path("courses/", course_list, name="course-list"),
    path("disciplines/", discipline_list, name="discipline-list"),
    path("disciplines/<int:pk>/", discipline_detail, name="discipline-detail"),
]
