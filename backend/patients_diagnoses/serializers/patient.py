from rest_framework import serializers
from ..models.patient import Patient
from ubi_geo.serializers.region import RegionSerializer
from ubi_geo.serializers.province import ProvinceSerializer
from ubi_geo.serializers.district import DistrictSerializer
from histories_configurations.serializers.document_type import DocumentTypeSerializer
from django.core.validators import RegexValidator
from datetime import date

class PatientSerializer(serializers.ModelSerializer):
    region = RegionSerializer(read_only=True)
    province = ProvinceSerializer(read_only=True)
    district = DistrictSerializer(read_only=True)
    document_type = DocumentTypeSerializer(read_only=True)

    # Para escritura (crear con IDs)
    region_id = serializers.PrimaryKeyRelatedField(queryset=RegionSerializer.Meta.model.objects.all(), source='region', write_only=True)
    province_id = serializers.PrimaryKeyRelatedField(queryset=ProvinceSerializer.Meta.model.objects.all(), source='province', write_only=True)
    district_id = serializers.PrimaryKeyRelatedField(queryset=DistrictSerializer.Meta.model.objects.all(), source='district', write_only=True)
    document_type_id = serializers.PrimaryKeyRelatedField(queryset=DocumentTypeSerializer.Meta.model.objects.all(), source='document_type', write_only=True)

    # Validaciones campo por campo
    document_number = serializers.CharField(
        max_length=255,
        required=True,
        validators=[RegexValidator(r'^\d+$', 'Solo se permiten números.')]
    )
    paternal_lastname = serializers.CharField(required=True, max_length=150)
    maternal_lastname = serializers.CharField(required=True, max_length=150)
    name = serializers.CharField(required=True, max_length=150)
    birth_date = serializers.DateTimeField(required=False, allow_null=True)
    sex = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True)
    phone1 = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    phone2 = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    email = serializers.CharField(max_length=254, required=True)
    ocupation = serializers.CharField(max_length=100, required=True)
    health_condition = serializers.CharField(required=True)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = Patient
        fields = [
            'id',
            'document_number',
            'paternal_lastname',
            'maternal_lastname',
            'name',
            'personal_reference',
            'birth_date',
            'sex',
            'phone1',
            'phone2',
            'email',
            'ocupation',
            'health_condition',
            'address',
            'region',
            'province',
            'district',
            'document_type',
            'region_id',
            'province_id',
            'district_id',
            'document_type_id',
            'created_at',
            'updated_at',
            'deleted_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'deleted_at']

    def validate_document_number(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("El número de documento debe tener al menos 8 dígitos.")
        if not value.isdigit():
          raise serializers.ValidationError("El número de documento debe contener solo números.")
    
        qs = Patient.objects.filter(document_number=value)
        if self.instance:
          qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
         raise serializers.ValidationError("El número de documento ya está registrado.")
        return value

    def validate_email(self, value):
        if value:
            qs = Patient.objects.filter(email=value)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("El correo electrónico ya está registrado.")
        return value

    def validate(self, data):
        # Validación de campos obligatorios
        required_fields = [
            'document_number',
            'paternal_lastname',
            'name',
            'email',
            'ocupation',
            'health_condition',
            'document_type'
        ]
        for field in required_fields:
            if not data.get(field):
                raise serializers.ValidationError({field: "Este campo es obligatorio."})
        return data
    
    def validate_birth_date(self, value):
        if value and value.date() > date.today():
            raise serializers.ValidationError("La fecha de nacimiento no puede ser futura.")
        return value
    
    def validate_phone1(self, value):
        if value and len(value) < 6:
            raise serializers.ValidationError("El teléfono principal debe tener al menos 6 caracteres.")
        return value


class PatientListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listar pacientes."""
    
    full_name = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    region_name = serializers.CharField(source='region.name', read_only=True)
    document_type_name = serializers.CharField(source='document_type.name', read_only=True)
    
    class Meta:
        model = Patient
        fields = [
            'id', 'document_number', 'full_name', 'age', 'sex',
            'phone1', 'email', 'region_name', 'document_type_name',
            'created_at'
        ]
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    
    def get_age(self, obj):
        from datetime import date
        today = date.today()
        if obj.birth_date:
            return today.year - obj.birth_date.year - ((today.month, today.day) < (obj.birth_date.month, obj.birth_date.day))
        return None