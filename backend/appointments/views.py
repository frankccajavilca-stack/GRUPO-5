from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import CitaSerializer
from .models import Cita
from .ghl_services import create_appointment_in_ghl


class AppointmentCreateView(APIView):
    def post(self, request):
        serializer = CitaSerializer(data=request.data)
        if serializer.is_valid():
            cita = serializer.save()
            
            # Llamada a GHL
            try:
                create_appointment_in_ghl(
                    calendar_id=request.data.get("calendarId"),
                    contact_id=request.data.get("contactId"),
                    title=cita.paciente_nombre,
                    start_dt_iso=cita.start_time.isoformat(),
                    end_dt_iso=cita.end_time.isoformat(),
                    notes=cita.notas
                )
            except Exception as e:
                return Response({
                    "detail": "Error creando appointment en GHL",
                    "error": str(e)
                }, status=status.HTTP_400_BAD_REQUEST)

            return Response(CitaSerializer(cita).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
