# appointments_status/models/appointment.py
from django.db import models
from django.utils import timezone


class Appointment(models.Model):
    """
    Modelo para gestionar las citas médicas.
    Basado en la estructura de la tabla appointments de la BD.
    """
    
    # Relaciones con otros módulos
    history = models.ForeignKey('histories_configurations.History', on_delete=models.CASCADE, null=True, blank=True, verbose_name="Historial")
    patient = models.ForeignKey('patients_diagnoses.Patient', on_delete=models.CASCADE, verbose_name="Paciente")
    therapist = models.ForeignKey('therapists.Therapist', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Terapeuta")
    
    # Campos principales de la cita
    appointment_date = models.DateTimeField(blank=True, null=True, verbose_name="Fecha de la cita")
    hour = models.TimeField(blank=True, null=True, verbose_name="Hora de la cita")
    
    # Información médica
    ailments = models.CharField(max_length=1000, blank=True, null=True, verbose_name="Padecimientos")
    diagnosis = models.CharField(max_length=1000, blank=True, null=True, verbose_name="Diagnóstico")
    surgeries = models.CharField(max_length=1000, blank=True, null=True, verbose_name="Cirugías")
    reflexology_diagnostics = models.CharField(max_length=1000, blank=True, null=True, verbose_name="Diagnósticos de reflexología")
    medications = models.CharField(max_length=255, blank=True, null=True, verbose_name="Medicamentos")
    observation = models.CharField(max_length=255, blank=True, null=True, verbose_name="Observaciones")
    
    # Fechas de tratamiento
    initial_date = models.DateField(blank=True, null=True, verbose_name="Fecha inicial")
    final_date = models.DateField(blank=True, null=True, verbose_name="Fecha final")
    
    # Configuración de la cita
    appointment_type = models.CharField(max_length=255, blank=True, null=True, verbose_name="Tipo de cita")
    room = models.IntegerField(blank=True, null=True, verbose_name="Habitación/Consultorio")
    
    # Información de pago
    social_benefit = models.BooleanField(default=True, verbose_name="Beneficio social")
    payment_detail = models.CharField(max_length=255, blank=True, null=True, verbose_name="Detalle de pago")
    payment = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True, verbose_name="Pago")
    ticket_number = models.CharField(max_length=20, blank=True, null=True, db_index=True)
    
    # Relaciones
    payment_type = models.ForeignKey('histories_configurations.PaymentType', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Tipo de pago")
    payment_status = models.ForeignKey('histories_configurations.PaymentStatus', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Estado de pago")
    
    # Estado de la cita (enum en SQL)
    APPOINTMENT_STATUS_CHOICES = [
        ('COMPLETADO', 'Completado'),
        ('PENDIENTE', 'Pendiente'),
        ('ACTIVO', 'Activo'),
    ]
    appointment_status = models.CharField(
        max_length=20,
        choices=APPOINTMENT_STATUS_CHOICES,
        default='PENDIENTE',
        verbose_name="Estado de la cita"
    )
    
    # 🔹 Campos para integración con GHL
    external_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="ID externo en GHL"
    )
    ghl_contact_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="ID de contacto en GHL"
    )
    ghl_location_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="ID de ubicación en GHL"
    )
    ghl_calendar_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="ID de calendario en GHL"
    )
    # 🔹 Campos para integración con GHL
    title = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Título de la cita"
    )
    
    # 🔹 NUEVOS CAMPOS PARA QUE NO DE ERROR 500
    #contact_id = models.CharField(max_length=255, blank=True, null=True, verbose_name="ID de contacto")
    #title = models.CharField(max_length=255, blank=True, null=True, verbose_name="Título de la cita")
    duration_minutes = models.IntegerField(blank=True, null=True, verbose_name="Duración de la cita (minutos)")

    # Campos de auditoría
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Fecha de actualización")
    deleted_at = models.DateTimeField(blank=True, null=True, verbose_name="Fecha de eliminación")
    
    class Meta:
        db_table = 'appointments'
        verbose_name = "Cita"
        verbose_name_plural = "Citas"
        ordering = ['-appointment_date', '-hour']
        indexes = [
            models.Index(fields=['appointment_date', 'hour']),
            models.Index(fields=['appointment_status']),
        ]
    
    def __str__(self):
        return f"Cita {self.id} - {self.appointment_date} {self.hour}"
    
    @property
    def is_completed(self):
        """Verifica si la cita está completada basándose en la fecha"""
        if self.appointment_date is None:
            return False
        return self.appointment_date.date() < timezone.now().date()

    @property
    def is_pending(self):
        """Verifica si la cita está pendiente"""
        if self.appointment_date is None:
            return False
        return self.appointment_date.date() >= timezone.now().date()
