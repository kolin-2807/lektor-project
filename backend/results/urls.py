from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import ResultListAPIView, ResultViewSet, TestSessionViewSet

router = DefaultRouter()
router.register("results", ResultViewSet, basename="results")
router.register("test-sessions", TestSessionViewSet, basename="test-sessions")

urlpatterns = [
    path("", ResultListAPIView.as_view(), name="result-list"),
]

urlpatterns += router.urls