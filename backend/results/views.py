from rest_framework import generics
from .models import Result
from .serializers import ResultSerializer


class ResultListAPIView(generics.ListAPIView):
    serializer_class = ResultSerializer

    def get_queryset(self):
        queryset = Result.objects.select_related("discipline").all().order_by("-created_at")
        discipline_id = self.request.GET.get("discipline_id")

        if discipline_id:
            queryset = queryset.filter(discipline_id=discipline_id)

        return queryset