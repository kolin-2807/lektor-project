from django.urls import path
from .views import ResultListAPIView

urlpatterns = [
    path("", ResultListAPIView.as_view(), name="result-list"),
]