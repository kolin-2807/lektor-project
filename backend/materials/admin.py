from django.contrib import admin
from .models import Material


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "discipline", "category", "created_at")
    list_filter = ("category", "discipline")
    search_fields = ("title", "description")