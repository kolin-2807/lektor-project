from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Material
from .serializers import MaterialSerializer


@api_view(["GET"])
def material_list(request):
    queryset = Material.objects.all().order_by("title")

    discipline_id = request.GET.get("discipline_id")
    if discipline_id:
        queryset = queryset.filter(discipline_id=discipline_id)

    serializer = MaterialSerializer(queryset, many=True)
    return Response(serializer.data)