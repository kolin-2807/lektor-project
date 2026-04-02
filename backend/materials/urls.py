from django.urls import path
from .views import (
    assistant_command,
    delete_material,
    generate_material_test,
    material_list,
    transcribe_voice,
    upload_material,
)

urlpatterns = [
    path("materials/", material_list, name="material-list"),
    path("materials/upload/", upload_material, name="material-upload"),
    path("materials/<int:material_id>/", delete_material, name="material-delete"),
    path("materials/<int:material_id>/generate-test/", generate_material_test, name="generate-material-test"),
    path("assistant/command/", assistant_command, name="assistant-command"),
    path("assistant/transcribe/", transcribe_voice, name="assistant-transcribe"),
]
