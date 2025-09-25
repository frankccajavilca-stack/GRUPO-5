# appointments_status/services/appointment_service.py
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from ..models import Appointment, Ticket
from decimal import Decimal
from appointments_status.models.appointment import Appointment
from appointments_status.services.ghl_service import GHLService
from appointments_status.serializers.appointment import AppointmentSerializer



class AppointmentService:
    """
    Servicio para gestionar las operaciones de citas médicas.
    Basado en la estructura actualizada del modelo.
    """
    
    @transaction.atomic
    def create(self, data):
        """
        Crea una nueva cita médica con ticket automático.
        
        Args:
            data (dict): Datos de la cita a crear
            
        Returns:
            Response: Respuesta con la cita creada o error
        """
        #de aqui
        try:
            appointment = Appointment.objects.create(
                patient_id=data["patient_id"],
                therapist_id=data.get("therapist_id"),
                appointment_date=data["appointment_date"],
                hour=data["hour"],
                ghl_contact_id=data.get("ghl_contact_id"),
                ghl_location_id=data.get("ghl_location_id"),
                ghl_calendar_id=data.get("ghl_calendar_id"),
                title=data.get("title"),
                duration_minutes=data.get("duration_minutes")
            )
            return {"status": "success", "appointment": appointment}
        except Exception as e:
            return {"status": "error", "error": str(e)}
        #hasta qui            
        try:
            # Validar datos requeridos (temporalmente solo appointment_date y hour)
            required_fields = ['appointment_date', 'hour']
            for field in required_fields:
                if field not in data:
                    return Response(
                        {'error': f'El campo {field} es requerido'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Asignar valores por defecto si no se proporcionan
            if 'patient' not in data:
                data['patient_id'] = 1  # Usar ID 1 por defecto
            # Terapeuta es opcional
            if 'therapist' not in data:
                data['therapist_id'] = None
            
            # Separar campos de GHL de los campos del modelo
            ghl_data = {}
            appointment_data = {}
            
            for key, value in data.items():
                if key in ['contact_id', 'location_id', 'calendar_id', 'duration_minutes', 'title']:
                    ghl_data[key] = value
                else:
                    appointment_data[key] = value
            
            # Mapear campos de GHL a campos del modelo
            if 'contact_id' in ghl_data:
                appointment_data['ghl_contact_id'] = ghl_data['contact_id']
            if 'location_id' in ghl_data:
                appointment_data['ghl_location_id'] = ghl_data['location_id']
            if 'calendar_id' in ghl_data:
                appointment_data['ghl_calendar_id'] = ghl_data['calendar_id']
            
            # Crear la cita
            appointment = Appointment.objects.create(**appointment_data)

            # Intentar sincronizar con GHL si vienen los datos necesarios
            # Requiere al menos contact_id; locationId y calendarId pueden venir por ENV
            if 'contact_id' in ghl_data:
                # Construir start/end en ISO 8601. Si no se indica duración, usar 60 minutos
                from datetime import datetime, timedelta
                appointment_date = data.get('appointment_date')
                hour = data.get('hour')

                # Normalizar tipos (pueden venir como string por request)
                if isinstance(appointment_date, str):
                    # Intentar parsear date o datetime
                    try:
                        # YYYY-MM-DDTHH:MM or full ISO
                        appointment_dt = datetime.fromisoformat(appointment_date)
                    except ValueError:
                        # YYYY-MM-DD
                        appointment_dt = datetime.strptime(appointment_date, '%Y-%m-%d')
                elif isinstance(appointment_date, datetime):
                    appointment_dt = appointment_date
                else:
                    # Date object
                    appointment_dt = datetime.combine(appointment_date, datetime.min.time())

                if isinstance(hour, str):
                    hour_dt = datetime.strptime(hour, '%H:%M').time()
                else:
                    hour_dt = hour

                start_dt = datetime.combine(appointment_dt.date(), hour_dt)
                # Duración configurable opcional
                duration_minutes = int(ghl_data.get('duration_minutes', 60))
                end_dt = start_dt + timedelta(minutes=duration_minutes)

                # Asegurar formato ISO con 'Z' en UTC si USE_TZ
                if timezone.is_naive(start_dt):
                    start_dt = timezone.make_aware(start_dt, timezone.get_current_timezone())
                if timezone.is_naive(end_dt):
                    end_dt = timezone.make_aware(end_dt, timezone.get_current_timezone())
                # Convertir a UTC ISO 8601
                start_iso = start_dt.astimezone(timezone.utc).isoformat().replace('+00:00', 'Z')
                end_iso = end_dt.astimezone(timezone.utc).isoformat().replace('+00:00', 'Z')

                ghl_payload = {
                    "contact_id": ghl_data["contact_id"],
                    "location_id": ghl_data.get("location_id"),
                    "start_time": start_iso,
                    "end_time": end_iso,
                    "title": ghl_data.get("title") or f"Cita {appointment.id}",
                }
                try:
                    ghl_response = GHLService.create_appointment(ghl_payload, ghl_data.get("calendar_id"))
                    # Guardar el ID de la cita creada en GHL
                    appointment.external_id = ghl_response.get("id")
                    appointment.save(update_fields=["external_id"])
                except Exception as e:
                    # Registrar el error y continuar
                    print(f"Error al sincronizar con GHL: {e}")

            # El ticket se crea automáticamente mediante el signal
            # Verificar que se creó correctamente
            try:
                ticket = Ticket.objects.get(appointment=appointment)
                serializer = AppointmentSerializer(appointment)
                return Response({
                    'message': 'Cita creada exitosamente con ticket automático',
                    'appointment': serializer.data,
                    'ticket_number': ticket.ticket_number
                }, status=status.HTTP_201_CREATED)
            except Ticket.DoesNotExist:
                return Response(
                    {'error': 'Error al crear el ticket automático'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            return Response(
                {'error': f'Error al crear la cita: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_by_id(self, appointment_id):
        """
        Obtiene una cita por su ID.
        
        Args:
            appointment_id (int): ID de la cita
            
        Returns:
            Response: Respuesta con la cita o error si no existe
        """
        try:
            appointment = Appointment.objects.get(id=appointment_id, deleted_at__isnull=True)
            serializer = AppointmentSerializer(appointment)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Appointment.DoesNotExist:
            return Response(
                {'error': 'Cita no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error al obtener la cita: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @transaction.atomic
    def update(self, appointment_id, data):
        """
        Actualiza una cita existente.
        
        Args:
            appointment_id (int): ID de la cita a actualizar
            data (dict): Nuevos datos de la cita
            
        Returns:
            Response: Respuesta con la cita actualizada o error
        """
        try:
            appointment = Appointment.objects.get(id=appointment_id, deleted_at__isnull=True)
            
            # Actualizar campos
            for field, value in data.items():
                if hasattr(appointment, field):
                    setattr(appointment, field, value)
            
            appointment.save()
            
            # El ticket se actualiza automáticamente mediante el signal
            serializer = AppointmentSerializer(appointment)
            return Response({
                'message': 'Cita actualizada exitosamente',
                'appointment': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Appointment.DoesNotExist:
            return Response(
                {'error': 'Cita no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error al actualizar la cita: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, appointment_id):
        """
        Elimina una cita (soft delete).
        
        Args:
            appointment_id (int): ID de la cita a eliminar
            
        Returns:
            Response: Respuesta de confirmación o error
        """
        try:
            appointment = Appointment.objects.get(id=appointment_id, deleted_at__isnull=True)
            appointment.soft_delete()
            
            # También desactivar el ticket asociado
            try:
                ticket = Ticket.objects.get(appointment=appointment)
                ticket.soft_delete()
            except Ticket.DoesNotExist:
                pass  # Si no hay ticket, no hay problema
            
            return Response({
                'message': 'Cita eliminada exitosamente'
            }, status=status.HTTP_200_OK)
            
        except Appointment.DoesNotExist:
            return Response(
                {'error': 'Cita no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error al eliminar la cita: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def list_all(self, filters=None, pagination=None):
        """
        Lista todas las citas con filtros opcionales.
        
        Args:
            filters (dict): Filtros a aplicar
            pagination (dict): Configuración de paginación
            
        Returns:
            Response: Respuesta con la lista de citas
        """
        try:
            queryset = Appointment.objects.filter(deleted_at__isnull=True)
            
            # Aplicar filtros
            if filters:
                if 'appointment_date' in filters:
                    queryset = queryset.filter(appointment_date=filters['appointment_date'])
                if 'appointment_status' in filters:
                    queryset = queryset.filter(appointment_status=filters['appointment_status'])
                if 'patient' in filters:
                    queryset = queryset.filter(patient=filters['patient'])
                if 'therapist' in filters:
                    queryset = queryset.filter(therapist=filters['therapist'])
            
            # Aplicar paginación básica
            if pagination:
                page = pagination.get('page', 1)
                page_size = pagination.get('page_size', 10)
                start = (page - 1) * page_size
                end = start + page_size
                queryset = queryset[start:end]
            
            serializer = AppointmentSerializer(queryset, many=True)
            return Response({
                'count': queryset.count(),
                'results': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Error al listar las citas: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_by_date_range(self, start_date, end_date, filters=None):
        """
        Obtiene citas dentro de un rango de fechas.
        
        Args:
            start_date (date): Fecha de inicio
            end_date (date): Fecha de fin
            filters (dict): Filtros adicionales
            
        Returns:
            Response: Respuesta con las citas en el rango
        """
        try:
            queryset = Appointment.objects.filter(
                appointment_date__range=[start_date, end_date],
                deleted_at__isnull=True
            )
            
            # Aplicar filtros adicionales
            if filters:
                if 'appointment_status' in filters:
                    queryset = queryset.filter(appointment_status=filters['appointment_status'])
                if 'patient' in filters:
                    queryset = queryset.filter(patient=filters['patient'])
                if 'therapist' in filters:
                    queryset = queryset.filter(therapist=filters['therapist'])
            
            serializer = AppointmentSerializer(queryset, many=True)
            return Response({
                'count': queryset.count(),
                'results': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Error al obtener citas por rango: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_completed_appointments(self, filters=None):
        """
        Obtiene las citas completadas.
        
        Args:
            filters (dict): Filtros adicionales
            
        Returns:
            Response: Respuesta con las citas completadas
        """
        try:
            today = timezone.now().date()
            queryset = Appointment.objects.filter(
                appointment_date__lt=today,
                deleted_at__isnull=True
            )
            
            # Aplicar filtros adicionales
            if filters:
                if 'appointment_status' in filters:
                    queryset = queryset.filter(appointment_status=filters['appointment_status'])
                if 'patient' in filters:
                    queryset = queryset.filter(patient=filters['patient'])
                if 'therapist' in filters:
                    queryset = queryset.filter(therapist=filters['therapist'])
            
            serializer = AppointmentSerializer(queryset, many=True)
            return Response({
                'count': queryset.count(),
                'results': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Error al obtener citas completadas: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_pending_appointments(self, filters=None):
        """
        Obtiene las citas pendientes.
        
        Args:
            filters (dict): Filtros adicionales
            
        Returns:
            Response: Respuesta con las citas pendientes
        """
        try:
            today = timezone.now().date()
            queryset = Appointment.objects.filter(
                appointment_date__gte=today,
                deleted_at__isnull=True
            )
            
            # Aplicar filtros adicionales
            if filters:
                if 'appointment_status' in filters:
                    queryset = queryset.filter(appointment_status=filters['appointment_status'])
                if 'patient' in filters:
                    queryset = queryset.filter(patient=filters['patient'])
                if 'therapist' in filters:
                    queryset = queryset.filter(therapist=filters['therapist'])
            
            serializer = AppointmentSerializer(queryset, many=True)
            return Response({
                'count': queryset.count(),
                'results': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Error al obtener citas pendientes: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def check_availability(self, date, hour, duration=60):
        """
        Verifica la disponibilidad para una cita.
        
        Args:
            date (date): Fecha de la cita
            hour (time): Hora de la cita
            duration (int): Duración en minutos
            
        Returns:
            Response: Respuesta con la disponibilidad
        """
        try:
            # Convertir la hora de inicio a datetime
            from datetime import datetime, timedelta
            start_datetime = datetime.combine(date, hour)
            end_datetime = start_datetime + timedelta(minutes=duration)
            
            # Buscar citas que se solapen
            conflicting_appointments = Appointment.objects.filter(
                appointment_date=date,
                deleted_at__isnull=True
            ).exclude(
                hour__gte=end_datetime.time()
            ).exclude(
                hour__lte=start_datetime.time()
            )
            
            is_available = not conflicting_appointments.exists()
            
            return Response({
                'is_available': is_available,
                'conflicting_appointments': conflicting_appointments.count() if not is_available else 0
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Error al verificar disponibilidad: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
