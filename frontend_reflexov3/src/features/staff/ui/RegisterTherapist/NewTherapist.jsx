import React from 'react';
import { notification } from 'antd';
import FormGenerator from '../../../../components/Form/Form';
import { useStaff } from '../../hook/staffHook';
import { useNavigate } from 'react-router';

// Definir campos del formulario con estilos personalizados
const fields = [
  {
    type: 'title',
    label: 'REGISTRAR TERAPEUTA',
  },
  {

    type: 'separator',
  },
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
        required: true,
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
  {
    type: 'title',
    label: 'Información de Contacto',
  },
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
              return Promise.resolve();
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
        required: true,
        span: 12,
      },
      {
        name: 'address',
        label: 'Dirección de Domicilio',
        type: 'text',
        required: true,
        span: 12,
      },
    ],
  },
];

const NewTherapist = () => {
  const { submitNewTherapist } = useStaff();
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    console.log('📝 Formulario enviado:', formData);

    try {
      if (
        !formData.document_number ||
        !formData.name ||
        !formData.primary_phone ||
        !formData.paternal_lastname ||
        !formData.maternal_lastname ||
        !formData.sex ||
        !formData.ubicacion?.region_id ||
        !formData.ubicacion?.province_id ||
        !formData.ubicacion?.district_id ||
        !formData.address
      ) {
        notification.error({
          message: 'Error',
          description:
            'Completa los campos obligatorios: documento, nombres y apellidos, sexo, teléfono, ubicación y dirección',
        });
        return;
      }

      const result = await submitNewTherapist(formData);
      console.log('🎉 Terapeuta creado con éxito:', result);
      notification.success({
        message: 'Éxito',
        description: 'Terapeuta registrado correctamente',
      });
      navigate('/Inicio/terapeutas');
      return result;
    } catch (error) {
      console.error('❌ Error al crear terapeuta:', error);
      notification.error({
        message: 'Error',
        description: 'Ocurrió un error al registrar el terapeuta',
      });
      throw error;
    }
  };

  const handleCancel = () => {
    navigate('/Inicio/terapeutas');
  };

  return (
    <FormGenerator
      fields={fields}
      mode="create"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      initialValues={{
        document_type_id: 1,
      }}
    />
  );
};

export default NewTherapist;
