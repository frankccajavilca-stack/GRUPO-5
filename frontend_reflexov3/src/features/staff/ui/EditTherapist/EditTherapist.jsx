import { Form, notification } from 'antd';
import dayjs from '../../../../utils/dayjsConfig';
import { useEffect, useState } from 'react';
import FormGenerator from '../../../../components/Form/Form';
import { useStaff } from '../../hook/staffHook';
import UniversalModal from '../../../../components/Modal/UniversalModal';

// Reutiliza los mismos fields que para crear
const fields = [
  {
    type: 'customRow',
    fields: [
      {
        name: 'document_type_id',
        label: 'Tipo de Documento',
        type: 'typeOfDocument',
        span: 8,
        required: true,
      },
      {
        name: 'document_number',
        label: 'Nro Documento',
        type: 'documentNumber',
        required: true,
        span: 8,
        rules: [
          {
            required: true,
            message: 'Por favor ingrese el número de documento',
          },
        ],
      },
    ],
  },
  {
    type: 'customRow',
    fields: [
      {
        name: 'paternal_lastname',
        label: 'Apellido Paterno',
        type: 'text',
        required: true,
        span: 8,
      },
      {
        name: 'maternal_lastname',
        label: 'Apellido Materno',
        type: 'text',
        span: 8,
      },
      {
        name: 'name',
        label: 'Nombre',
        type: 'text',
        required: true,
        span: 8,
      },
    ],
  },
  {
    type: 'customRow',
    fields: [
      {
        name: 'birth_date',
        label: 'Fecha de Nacimiento',
        type: 'date',
        span: 8,
      },
      {
        name: 'sex',
        label: 'Sexo',
        type: 'select',
        options: [
          { value: 'M', label: 'Masculino' },
          { value: 'F', label: 'Femenino' },
        ],
        span: 8,
        required: true,
      },
    ],
  },
  { type: 'title', label: 'Información de Contacto' },
  {
    type: 'customRow',
    fields: [
      {
        name: 'primary_phone',
        label: 'Teléfono',
        type: 'phoneNumber',
        required: true,
        span: 8,
        rules: [
          {
            required: true,
            message: 'Por favor ingrese su número telefónico',
          },
          () => ({
            validator(_, value) {
              if (!value) {
                return Promise.reject(
                  new Error('Por favor ingrese su teléfono'),
                );
              }
              return Promise();
            },
          }),
        ],
      },
      {
        name: 'email',
        label: 'Correo Electrónico',
        type: 'email',
        span: 16,
      },
    ],
  },
  {
    type: 'customRow',
    fields: [
      {
        name: 'ubicacion',
        label: 'Departamento / Provincia / Distrito',
        type: 'ubigeo',
        span: 12,
      },
      {
        name: 'address',
        label: 'Dirección de Domicilio',
        type: 'text',
        span: 12,
        required: true,
      },
    ],
  },
];

const EditTherapist = ({ therapist, onClose, onSave }) => {
  const [form] = Form.useForm();
  const { handleUpdateTherapist } = useStaff();
  const [loading, setLoading] = useState(false);

  // Actualiza el formulario con los datos recibidos
  const setFormWithTherapist = (data) => {
    if (!data) return;

    // Aceptar tanto ids como objetos { id, name }
    const ubicacion = {
      region_id: data.region?.id || data.region,
      province_id: data.province?.id || data.province,
      district_id: data.district?.id || data.district,
    };

    if (ubicacion.region_id !== null)
      ubicacion.region_id = String(ubicacion.region_id);
    if (ubicacion.province_id !== null)
      ubicacion.province_id = String(ubicacion.province_id);
    if (ubicacion.district_id !== null)
      ubicacion.district_id = String(ubicacion.district_id);

    const normalizeSex = (sexValue) => {
      if (!sexValue) return undefined;
      const val = typeof sexValue === 'string' ? sexValue.toUpperCase() : sexValue;
      if (val === 'MASCULINO' || val === 'MALE' || val === 'H') return 'M';
      if (val === 'FEMENINO' || val === 'FEMALE' || val === 'MUJER' || val === 'F') return 'F';
      return val; // ya podría ser 'M' o 'F'
    };

    const formData = {
      name: data.name || data.first_name || '',
      paternal_lastname: data.paternal_lastname || data.last_name_paternal || '',
      maternal_lastname: data.maternal_lastname || data.last_name_maternal || '',
      document_type_id: (() => {
        const raw = data.document_type?.id ?? data.document_type_id ?? data.document_type;
        return raw !== undefined && raw !== null ? String(raw) : undefined;
      })(),
      document_number: data.document_number || data.dni || '',
      personal_reference: data.personal_reference,
      birth_date: (data.birth_date || data.birthdate || data.date_of_birth)
        ? dayjs(data.birth_date || data.birthdate || data.date_of_birth)
        : null,
      sex: normalizeSex(data.sex || data.gender),
      occupation: data.occupation ?? data.ocupation ?? data.job ?? '',
      primary_phone: data.primary_phone || data.phone1 || data.phone || data.telefono || '',
      secondary_phone: data.secondary_phone || data.phone2 || '',
      email: data.email || '',
      address: data.address || data.address_line || '',
      country_id: data.country_id,
      ubicacion,
    };

    form.setFieldsValue(formData);
    console.log('Valores seteados en el form:', formData);
    console.log('Datos originales del terapeuta:', data);
  };

  // Inicializa el formulario con los datos de la prop therapist
  useEffect(() => {
    setFormWithTherapist(therapist);
  }, [therapist]);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      // Convertir el tipo de documento a número (el form usa document_type_id directamente)
      const dataToSend = { ...formData };
      if (formData.document_type_id !== undefined && formData.document_type_id !== null && formData.document_type_id !== '') {
        dataToSend.document_type_id = Number(formData.document_type_id);
      }

      // Mapear ubicacion -> region_id, province_id, district_id
      if (formData.ubicacion) {
        const { region_id, province_id, district_id } = formData.ubicacion || {};
        if (region_id !== undefined && region_id !== null && region_id !== '') {
          dataToSend.region_id = Number(region_id);
        }
        if (province_id !== undefined && province_id !== null && province_id !== '') {
          dataToSend.province_id = Number(province_id);
        }
        if (district_id !== undefined && district_id !== null && district_id !== '') {
          dataToSend.district_id = Number(district_id);
        }
        delete dataToSend.ubicacion;
      }

      // El email se maneja en el hook para evitar enviar null

      console.log('Datos a enviar al actualizar terapeuta:', dataToSend);
      await handleUpdateTherapist(therapist.id, dataToSend);

      notification.success({
        message: 'Éxito',
        description: 'Terapeuta actualizado correctamente',
      });
      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error('Error completo al actualizar terapeuta:', error);
      console.error('Datos del error:', error.response?.data);
      console.error('Status del error:', error.response?.status);
      
      notification.error({
        message: 'Error',
        description:
          error.response?.data?.message || 
          error.response?.data?.detail ||
          'Error al actualizar el terapeuta',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!therapist) return null;

  const modalTitle =
    therapist.full_name ||
    `${therapist.paternal_lastname || ''} ${therapist.maternal_lastname || ''} ${therapist.name || ''}`.trim();

  return (
    <UniversalModal
      title={`Editar Terapeuta: ${modalTitle}`}
      open={true}
      onCancel={onClose}
      footer={null}
      width={950}
      className="edit-therapist-modal modal-themed"
    >
      <FormGenerator
        form={form}
        fields={fields}
        mode="edit"
        onSubmit={handleSubmit}
        onCancel={onClose}
        loading={loading}
      />
    </UniversalModal>
  );
};

export default EditTherapist;
