from django.urls import path
from .views import material_list, generate_material_test
from .views import material_list, generate_material_test, assistant_command, transcribe_voice

urlpatterns = [
    path("materials/", material_list, name="material-list"),
    path("materials/<int:material_id>/generate-test/", generate_material_test, name="generate-material-test"),
    path("assistant/command/", assistant_command, name="assistant-command"),
    path("assistant/transcribe/", transcribe_voice, name="assistant-transcribe"),
]