from django.db import models
from decimal import Decimal


class Ticket(models.Model):
    """
    Modelo para gestionar los tickets de las citas médicas.
    Basado en la estructura del módulo Laravel 05_appointments_status.
    """
    
    appointment = models.ForeignKey('Appointment', on_delete=models.CASCADE, verbose_name="Cita")
    
    # Información del ticket
    ticket_number = models.CharField(
        max_length=50, 
        unique=True, 
        verbose_name="Número de ticket"
    )
    payment_date = models.DateTimeField(
        auto_now_add=True, 
        verbose_name="Fecha de pago"
    )
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        verbose_name="Monto"
    )
    payment_method = models.CharField(
        max_length=50, 
        verbose_name="Método de pago"
    )
    
    # Información adicional
    description = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Descripción"
    )
    status = models.CharField(
        max_length=20, 
        default='pending', 
        choices=[
            ('pending', 'Pendiente'),
            ('paid', 'Pagado'),
            ('cancelled', 'Cancelado'),
            ('refunded', 'Reembolsado'),
        ],
        verbose_name="Estado del ticket"
    )
    
    # Campos de auditoría
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Fecha de actualización")
    deleted_at = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="Fecha de eliminación"
    )
    is_active = models.BooleanField(default=True, verbose_name="Activo")
    
    class Meta:
        db_table = 'tickets'
        verbose_name = "Ticket"
        verbose_name_plural = "Tickets"
        ordering = ['-payment_date']
        indexes = [
            models.Index(fields=['ticket_number']),
            models.Index(fields=['payment_date']),
            models.Index(fields=['status']),
            models.Index(fields=['appointment']),  # Índice para la foreign key
        ]
    
    def __str__(self):
        return f"Ticket {self.ticket_number} - ${self.amount}"
    
    @property
    def is_paid(self):
        """Verifica si el ticket está pagado"""
        return self.status == 'paid'
    
    @property
    def is_pending(self):
        """Verifica si el ticket está pendiente"""
        return self.status == 'pending'
    
    def mark_as_paid(self):
        """Marca el ticket como pagado"""
        self.status = 'paid'
        self.save(update_fields=['status', 'updated_at'])
    
    def mark_as_cancelled(self):
        """Marca el ticket como cancelado"""
        self.status = 'cancelled'
        self.save(update_fields=['status', 'updated_at'])
    
    def soft_delete(self):
        """Eliminación suave del ticket"""
        from django.utils import timezone
        self.is_active = False
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_active', 'deleted_at', 'updated_at'])
    
    def restore(self):
        """Restaura un ticket eliminado"""
        self.is_active = True
        self.deleted_at = None
        self.save(update_fields=['is_active', 'deleted_at', 'updated_at'])
