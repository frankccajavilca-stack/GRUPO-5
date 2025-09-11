from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from ..models import Appointment
from ..serializers import AppointmentSerializer
from ..services import AppointmentService
from django.utils import timezone


# Create your models here.


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las citas médicas.
    Basado en la estructura actualizada del modelo.
    """
    
    queryset = Appointment.objects.filter(deleted_at__isnull=True)
    serializer_class = AppointmentSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'appointment_date', 
        'appointment_status', 
        'appointment_type', 
        'room',
        'patient',
        'therapist'
    ]
    search_fields = [
        'ailments', 
        'diagnosis', 
        'observation', 
        'ticket_number'
    ]
    ordering_fields = [
        'appointment_date', 
        'hour', 
        'created_at', 
        'updated_at'
    ]
    ordering = ['-appointment_date', '-hour']
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = AppointmentService()
    
    def get_queryset(self):
        """
        Filtra el queryset según los parámetros de la request.
        """
        queryset = Appointment.objects.filter(deleted_at__isnull=True)
        
        # Filtros adicionales
        appointment_date = self.request.query_params.get('appointment_date', None)
        if appointment_date:
            queryset = queryset.filter(appointment_date=appointment_date)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """
        Crea una nueva cita con ticket automático.
        """
        return self.service.create(request.data)
    
    def update(self, request, *args, **kwargs):
        """
        Actualiza una cita existente.
        """
        appointment_id = kwargs.get('pk')
        return self.service.update(appointment_id, request.data)
    
    def destroy(self, request, *args, **kwargs):
        """
        Elimina una cita (soft delete).
        """
        appointment_id = kwargs.get('pk')
        return self.service.delete(appointment_id)
    
    def list(self, request, *args, **kwargs):
        """
        Lista todas las citas con filtros y paginación.
        """
        filters = {}
        pagination = {}
        
        # Extraer filtros de query params
        for field in ['appointment_date', 'appointment_status', 'patient', 'therapist']:
            value = request.query_params.get(field)
            if value:
                filters[field] = value
        
        # Extraer parámetros de paginación
        page = request.query_params.get('page')
        page_size = request.query_params.get('page_size')
        if page or page_size:
            pagination['page'] = int(page) if page else 1
            pagination['page_size'] = int(page_size) if page_size else 10
        
        return self.service.list_all(filters, pagination)
    
    @action(detail=False, methods=['get'])
    def completed(self, request):
        """
        Obtiene las citas completadas.
        """
        filters = {}
        for field in ['appointment_status', 'patient', 'therapist']:
            value = request.query_params.get(field)
            if value:
                filters[field] = value
        
        return self.service.get_completed_appointments(filters)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """
        Obtiene las citas pendientes.
        """
        filters = {}
        for field in ['appointment_status', 'patient', 'therapist']:
            value = request.query_params.get(field)
            if value:
                filters[field] = value
        
        return self.service.get_pending_appointments(filters)
    
    @action(detail=False, methods=['get'])
    def by_date_range(self, request):
        """
        Obtiene citas dentro de un rango de fechas.
        """
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response(
                {'error': 'Se requieren start_date y end_date'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        filters = {}
        for field in ['appointment_status', 'patient', 'therapist']:
            value = request.query_params.get(field)
            if value:
                filters[field] = value
        
        return self.service.get_by_date_range(start_date, end_date, filters)
    
    @action(detail=False, methods=['get'])
    def check_availability(self, request):
        """
        Verifica la disponibilidad para una cita.
        """
        date = request.query_params.get('date')
        hour = request.query_params.get('hour')
        duration = request.query_params.get('duration', 60)
        
        if not date or not hour:
            return Response(
                {'error': 'Se requieren date y hour'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from datetime import datetime
            date_obj = datetime.strptime(date, '%Y-%m-%d').date()
            hour_obj = datetime.strptime(hour, '%H:%M').time()
        except ValueError:
            return Response(
                {'error': 'Formato de fecha u hora inválido. Use YYYY-MM-DD y HH:MM'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return self.service.check_availability(date_obj, hour_obj, int(duration))
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancela una cita específica.
        """
        appointment = self.get_object()
        appointment.appointment_status = 'CANCELADO'  # Usar el enum actualizado
        appointment.save(update_fields=['appointment_status', 'updated_at'])
        
        # También cancelar el ticket asociado
        try:
            from ..models import Ticket
            ticket = Ticket.objects.get(appointment=appointment)
            ticket.status = 'cancelled'
            ticket.save(update_fields=['status', 'updated_at'])
        except Ticket.DoesNotExist:
            pass
        
        return Response({'message': 'Cita cancelada exitosamente'})
    
    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        """
        Reprograma una cita específica.
        """
        appointment = self.get_object()
        new_date = request.data.get('appointment_date')
        new_hour = request.data.get('hour')
        
        if not new_date or not new_hour:
            return Response(
                {'error': 'Se requieren appointment_date y hour'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar disponibilidad
        try:
            from datetime import datetime
            date_obj = datetime.strptime(new_date, '%Y-%m-%d').date()
            hour_obj = datetime.strptime(new_hour, '%H:%M').time()
        except ValueError:
            return Response(
                {'error': 'Formato de fecha u hora inválido. Use YYYY-MM-DD y HH:MM'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        availability = self.service.check_availability(date_obj, hour_obj)
        if not availability.data.get('is_available'):
            return Response(
                {'error': 'La fecha y hora seleccionadas no están disponibles'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Actualizar la cita
        appointment.appointment_date = date_obj
        appointment.hour = hour_obj
        appointment.save(update_fields=['appointment_date', 'hour', 'updated_at'])
        
        return Response({'message': 'Cita reprogramada exitosamente'})
