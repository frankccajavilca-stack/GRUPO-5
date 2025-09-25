from django.db import models
from ubi_geo.models import Region, Province, District
from histories_configurations.models import DocumentType


class Therapist(models.Model):
    """
    Modelo para gestionar los terapeutas.
    Basado en la estructura de la tabla therapists de la BD.
    """
    
    # Datos personales
    document_type = models.ForeignKey(
        DocumentType,
        on_delete=models.CASCADE,
        verbose_name="Tipo de documento",
        null=True, blank=True
    )
    document_number = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="Número de documento",
        null=True, blank=True
    )
    last_name_paternal = models.CharField(
        max_length=150,
        verbose_name="Apellido paterno",
        null=True, blank=True
    )
    last_name_maternal = models.CharField(
        max_length=150,
        verbose_name="Apellido materno",
        null=True, blank=True
    )
    first_name = models.CharField(
        max_length=150,
        verbose_name="Nombre",
        null=True, blank=True
    )
    birth_date = models.DateTimeField(
        verbose_name="Fecha de nacimiento",
        null=True, blank=True
    )
    gender = models.CharField(
        max_length=50,
        verbose_name="Sexo",
        null=True, blank=True
    )
    personal_reference = models.CharField(
        max_length=255,
        verbose_name="Referencia personal",
        null=True, blank=True
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Activo"
    )

    # Información de contacto
    phone = models.CharField(
        max_length=20,
        verbose_name="Teléfono",
        null=True, blank=True
    )
    email = models.CharField(
        max_length=254,
        verbose_name="Email",
        null=True, blank=True
    )

    # Ubicación
    region = models.ForeignKey(
        Region,
        on_delete=models.CASCADE,
        verbose_name="Región",
        null=True, blank=True
    )
    province = models.ForeignKey(
        Province,
        on_delete=models.CASCADE,
        verbose_name="Provincia",
        null=True, blank=True
    )
    district = models.ForeignKey(
        District,
        on_delete=models.CASCADE,
        verbose_name="Distrito",
        null=True, blank=True
    )

    address = models.TextField(
        verbose_name="Dirección",
        null=True, blank=True
    )
    profile_picture = models.CharField(
        max_length=255,
        verbose_name="Foto de perfil",
        null=True, blank=True
    )
    
    # Campos de auditoría
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de creación"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Fecha de actualización"
    )
    deleted_at = models.DateTimeField(
        verbose_name="Fecha de eliminación",
        null=True, blank=True
    )

    def get_full_name(self):
        """Obtiene el nombre completo del terapeuta."""
        return f"{self.first_name or ''} {self.last_name_paternal or ''} {self.last_name_maternal or ''}".strip()
    
    def __str__(self):
        return self.get_full_name()

    class Meta:
        db_table = 'therapists'
        verbose_name = "Terapeuta"
        verbose_name_plural = "Terapeutas"
        ordering = ['first_name', 'last_name_paternal']
