import { Form, notification } from 'antd';
import dayjs from '../../../../utils/dayjsConfig';
import { useEffect, useState } from 'react';
import FormGenerator from '../../../../components/Form/Form';
import { usePatients } from '../../hook/patientsHook';
import UniversalModal from '../../../../components/Modal/UniversalModal';

// Campos idénticos al registro que funciona
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
      {
        name: 'occupation',
        label: 'Ocupación',
        type: 'text',
        span: 8,
        capitalize: 'first',
      },
    ],
  },
  { type: 'title', label: 'Información de contacto' },
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
];

const EditPatient = ({ patient, onClose, onSave }) => {
  const [form] = Form.useForm();
  const { handleUpdatePatient } = usePatients();
  const [loading, setLoading] = useState(false);

  console.log('EditPatient renderizado con patient:', patient);

  // Actualiza el formulario con los datos recibidos
  const setFormWithPatient = (data) => {
    console.log('=== DATOS COMPLETOS DEL PACIENTE ===');
    console.log('Datos del paciente recibidos:', data);
    console.log('document_type:', data.document_type);
    console.log('document_type_id:', data.document_type_id);
    console.log('document_type_name:', data.document_type_name);
    console.log('primary_phone:', data.primary_phone);
    console.log('phone1:', data.phone1);
    console.log('phone2:', data.phone2);
    console.log('phone:', data.phone);
    console.log('telefono:', data.telefono);
    console.log('TODOS LOS CAMPOS CON PHONE:', Object.keys(data).filter(key => key.toLowerCase().includes('phone')));
    console.log('TODOS LOS CAMPOS DISPONIBLES:', Object.keys(data));
    
    // Buscar cualquier campo que contenga un número de teléfono
    Object.keys(data).forEach(key => {
      if (data[key] && typeof data[key] === 'string' && data[key].match(/\d{9}/)) {
        console.log(`Campo ${key} contiene número de teléfono:`, data[key]);
      }
    });
    console.log('region:', data.region);
    console.log('region_id:', data.region_id);
    console.log('region_name:', data.region_name);
    console.log('province:', data.province);
    console.log('province_id:', data.province_id);
    console.log('district:', data.district);
    console.log('district_id:', data.district_id);
    console.log('=====================================');

    if (!data) {
      console.log('No hay datos del paciente');
      return;
    }

    // Mapear ubicación correctamente - la API devuelve objetos con id y name
    const ubicacion = {
      region_id: data.region?.id || data.region_id,
      province_id: data.province?.id || data.province_id,
      district_id: data.district?.id || data.district_id,
    };

    if (ubicacion.region_id !== null && ubicacion.region_id !== undefined)
      ubicacion.region_id = String(ubicacion.region_id);
    if (ubicacion.province_id !== null && ubicacion.province_id !== undefined)
      ubicacion.province_id = String(ubicacion.province_id);
    if (ubicacion.district_id !== null && ubicacion.district_id !== undefined)
      ubicacion.district_id = String(ubicacion.district_id);

    const formData = {
      name: data.name || '',
      paternal_lastname: data.paternal_lastname || '',
      maternal_lastname: data.maternal_lastname || '',
      // La API devuelve document_type como objeto con id y name
      document_type_id: data.document_type?.id ? String(data.document_type.id) : 
                       (data.document_type_id ? String(data.document_type_id) : '1'),
      document_number: data.document_number || '',
      birth_date: data.birth_date ? dayjs(data.birth_date) : null,
      sex: data.sex || 'M',
      // Mapear phone1 del backend a primary_phone del formulario
      primary_phone: data.phone1 || data.primary_phone || data.phone || data.telefono || '',
      email: data.email || '',
      occupation: data.ocupation || '',
      address: data.address || '',
      ubicacion,
    };

    console.log('Valores seteados en el form:', formData);
    console.log('Valor específico del teléfono:', formData.primary_phone);

    // Establecer los valores en el formulario
    form.setFieldsValue(formData);

    // Verificar que el valor se estableció correctamente
    setTimeout(() => {
      const currentValues = form.getFieldsValue();
      console.log('Valores actuales del formulario:', currentValues);
      console.log('Teléfono en el formulario:', currentValues.primary_phone);
    }, 100);
  };

  // Inicializa el formulario con los datos de la prop patient
  useEffect(() => {
    setFormWithPatient(patient);
  }, [patient]);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      // Convertir el tipo de documento a número
      const dataToSend = {
        ...formData,
        document_type_id: Number(formData.document_type_id),
      };

      // No eliminar el email, la API PUT requiere todos los campos
      // if (formData.email === patient.email) {
      //   delete dataToSend.email;
      // }

      await handleUpdatePatient(patient.id, dataToSend);
      notification.success({
        message: 'Éxito',
        description: 'Paciente actualizado correctamente',
      });
      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error('Error actualizando paciente:', error);
      console.error('Respuesta del servidor:', error.response?.data);
      
      // Manejo de errores consistente con el hook
      const errorData = error.response?.data;
      const hasValidationErrors = errorData && typeof errorData === 'object' && !errorData.errors;
      
      if (hasValidationErrors || (error.response?.data?.errors && Object.keys(error.response.data.errors).length > 0)) {
        const errorsToProcess = error.response.data.errors || error.response.data;
        const errorMessages = Object.entries(errorsToProcess)
          .map(([field, messages]) => {
            const messageArray = Array.isArray(messages) ? messages : [messages];
            
            // Mensajes personalizados para campos específicos
            if (field === 'email' && messageArray.some(msg => msg.includes('ya está registrado'))) {
              return 'El correo electrónico ya se encuentra registrado';
            }
            if (field === 'document_number' && messageArray.some(msg => msg.includes('ya está registrado'))) {
              return 'El número de documento ya se encuentra registrado';
            }
            
            return `${field}: ${messageArray.join(', ')}`;
          })
          .join('\n');
        
        notification.error({
          message: 'Error de validación',
          description: errorMessages,
          duration: 0,
        });
      } else {
        const serverMessage = error.response?.data?.message || error.response?.data?.detail;
        notification.error({
          message: 'Error',
          description: serverMessage || 'Error al actualizar el paciente',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!patient) return null;

  const modalTitle =
    patient.full_name ||
    `${patient.paternal_lastname || ''} ${patient.maternal_lastname || ''} ${patient.name || ''}`.trim();

  return (
    <UniversalModal
      title={`Editar Paciente: ${modalTitle}`}
      open={!!patient}
      onCancel={onClose}
      footer={null}
      width={950}
      className="edit-patient-modal modal-themed"
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

export default EditPatient;