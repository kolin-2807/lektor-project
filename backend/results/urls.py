from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    ResultListAPIView,
    ResultViewSet,
    TestSessionViewSet,
    public_test_detail,
    public_test_start,
    public_test_submit,
)

router = DefaultRouter()
router.register("results", ResultViewSet, basename="results")
router.register("test-sessions", TestSessionViewSet, basename="test-sessions")

urlpatterns = [
    path("", ResultListAPIView.as_view(), name="result-list"),
    path("public-test/<uuid:access_token>/", public_test_detail, name="public-test-detail"),
    path("public-test/<uuid:access_token>/start/", public_test_start, name="public-test-start"),
    path("public-test/<uuid:access_token>/submit/", public_test_submit, name="public-test-submit"),
]

urlpatterns += router.urls
