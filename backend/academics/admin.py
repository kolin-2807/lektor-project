from django.contrib import admin
from .models import Course, Discipline


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("id", "number")


@admin.register(Discipline)
class DisciplineAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "course", "language")
    list_filter = ("course", "language")
    search_fields = ("title",)
