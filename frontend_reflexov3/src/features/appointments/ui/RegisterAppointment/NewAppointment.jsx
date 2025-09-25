import {
  Button,
  Form,
  Radio,
  Table,
  notification,
  DatePicker,
  TimePicker,
  Select,
  Input,
  Checkbox,
  Row,
  Col,
  Typography,
  Space,
  Divider,
} from 'antd';
import UniversalModal from '../../../../components/Modal/UniversalModal';
import dayjs from '../../../../utils/dayjsConfig';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FormComponent from '../../../../components/Form/Form';
import CustomSearch from '../../../../components/Search/CustomSearch';
import NewPatient from '../../../patients/ui/RegisterPatient/NewPatient';
import { useAppointments, usePatients } from '../../hook/appointmentsHook';
import styles from '../RegisterAppointment/NewAppointment.module.css';
import SelectPaymentStatus from '../../../../components/Select/SelectPaymentStatus';
import SelectPrices from '../../../../components/Select/SelectPrices';

const NewAppointment = () => {
  const [showHourField, setShowHourField] = useState(false);
  const [isPaymentRequired, setIsPaymentRequired] = useState(false);
  const [patientType, setPatientType] = useState('continuador');
  const [formValues, setFormValues] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreatePatientModalVisible, setIsCreatePatientModalVisible] =
    useState(false);
  const [selectedRowKey, setSelectedRowKey] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState('');

  const { submitNewAppointment } = useAppointments();
  const { patients, loading, setSearchTerm, fetchPatients } = usePatients(true);

  // Usar form de Ant Design
  const [form] = Form.useForm();

  const navigate = useNavigate();

  // La fecha por defecto se establece ahora con initialValue en el Form.Item

  // Debug: Monitorear cambios en selectedPatient
  useEffect(() => {
    console.log('Selected patient changed:', selectedPatient);
  }, [selectedPatient]);

  // Sincronizar el valor de payment cada vez que cambie el select de precios
  useEffect(() => {
    const unsubscribe = form.subscribe?.(() => {
      const paymentTypeId = form.getFieldValue('payment_type_id');
      const prices = form.getFieldInstance?.('payment_type_id')?.props?.options;
      if (prices && paymentTypeId) {
        const selected = prices.find((item) => item.value === paymentTypeId);
        if (selected) {
          form.setFieldsValue({ payment: selected.price });
        }
      }
    });
    return () => unsubscribe && unsubscribe();
  }, [form]);

  // Callback para actualizar el monto
  const handlePriceChange = (price) => {
    form.setFieldsValue({ payment: price });
    setSelectedPrice(price);
  };

  /**
   * Maneja el cambio de opciones de pago desde el componente SelectPrices
   * @param {string|number} serviceId - ID del servicio seleccionado
   */
  const handleServiceChange = (serviceId) => {
    form.setFieldsValue({
      service_id: serviceId,
    });

    // Buscar el servicio seleccionado para verificar si es "cupon sin costo"
    if (serviceId) {
      // Obtener las opciones de precios predeterminados
      const fetchServiceInfo = async () => {
        try {
          const { getPredeterminedPrices } = await import('../../../../components/Select/SelectsApi');
          const prices = await getPredeterminedPrices();
          const selectedService = prices.find(item => item.value === serviceId);
          
          if (selectedService) {
            const serviceName = selectedService.label?.toLowerCase() || '';
            
            // Verificar si el nombre contiene "cupon sin costo" (case insensitive)
            if (serviceName.includes('cupon sin costo') || serviceName.includes('cupón sin costo')) {
              // Limpiar el campo de detalles de pago
              form.setFieldsValue({
                payment_type_id: '',
              });
              
              console.log('🔍 Debug - Cupon sin costo detectado, limpiando payment_type_id');
            }
          }
        } catch (error) {
          console.error('Error al verificar el servicio seleccionado:', error);
        }
      };
      
      fetchServiceInfo();
    }
  };

  const handleSubmit = async (values) => {
    console.log('Form values:', values);
    console.log('Service ID:', values.service_id);
    console.log('Payment type ID:', values.payment_type_id);
    
    // Si falta payment, usar el estado local
    let paymentValue = values.payment;
    if (!paymentValue) {
      paymentValue = selectedPrice;
    }

    if (!selectedPatient) {
      notification.error({
        message: 'Error',
        description: 'Debe seleccionar o crear un paciente primero',
      });
      return;
    }

    // Validar campos requeridos
    if (!values.appointment_date) {
      notification.error({
        message: 'Error',
        description: 'La fecha de la cita es requerida',
      });
      return;
    }
    if (!values.service_id) {
      notification.error({
        message: 'Error',
        description: 'Las opciones de pago son requeridas',
      });
      return;
    }
    
    // Validar que el service_id sea un número válido
    if (isNaN(Number(values.service_id))) {
      notification.error({
        message: 'Error',
        description: 'Las opciones de pago seleccionadas no son válidas',
      });
      return;
    }
    
    if (!values.payment_type_id) {
      notification.error({
        message: 'Error',
        description: 'El tipo de pago es requerido',
      });
      return;
    }
    if (!paymentValue) {
      notification.error({
        message: 'Error',
        description: 'El monto de pago es requerido',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Lógica para determinar appointment_status_id basada en la fecha
      const appointmentDate = dayjs(values.appointment_date);
      const currentDate = dayjs();

      let appointment_status_id;
      if (appointmentDate.isBefore(currentDate, 'day')) {
        appointment_status_id = 2;
      } else {
        appointment_status_id = 1;
      }

      if (typeof paymentValue === 'string') {
        paymentValue = paymentValue.replace(/[^\d.]/g, '');
        paymentValue = parseFloat(paymentValue);
      }

      // Verificar que el paciente seleccionado tenga la estructura correcta
      console.log('Selected patient:', selectedPatient);
      console.log('Selected patient ID:', selectedPatient?.id);
      console.log('Selected patient name:', selectedPatient?.full_name);
      
      if (!selectedPatient?.id) {
        throw new Error('No se ha seleccionado un paciente válido');
      }

      // Preparar payload con solo los campos del formulario original
      const payload = {
        // Campos requeridos
        patient: selectedPatient.id,
        therapist: 1, // ID por defecto del terapeuta
        appointment_date: dayjs(values.appointment_date).format('YYYY-MM-DD'),
        appointment_type: "1", // Tipo de cita como string
        room: 1, // Sala por defecto
        social_benefit: false, // Por defecto no es beneficio social
        
        // Campos del formulario
        hour: showHourField && values.appointment_hour ? values.appointment_hour : null,
        payment: values.payment ? values.payment.toString() : null,
        payment_type: values.payment_type_id ? values.payment_type_id : null,
        
        // Campos que siempre son null en la creación
        history: null,
        ailments: null,
        diagnosis: null,
        surgeries: null,
        reflexology_diagnostics: null,
        medications: null,
        observation: null,
        initial_date: null,
        final_date: null,
        payment_detail: null,
        payment_status: null,
        ticket_number: null,
        appointment_status: "PENDIENTE",
        is_completed: false,
        is_pending: true,
      };

      // Log para verificar la hora y payment_type
      console.log('=== DEBUGGING APPOINTMENT CREATION ===');
      console.log('All form values:', values);
      console.log('Hour field value:', values.appointment_hour);
      console.log('Show hour field:', showHourField);
      console.log('Final hour in payload:', payload.hour);
      console.log('Payment type ID from form:', values.payment_type_id);
      console.log('Payment type in payload:', payload.payment_type);
      console.log('Payment amount from form:', values.payment);
      console.log('Payment amount in payload:', payload.payment);
      console.log('Complete payload to send:', payload);

      const result = await submitNewAppointment(payload);

      notification.success({
        message: 'Cita registrada',
        description: 'La cita se ha registrado correctamente',
      });

      form.resetFields();
      setSelectedPatient(null);
      setPatientType('continuador');
      setShowHourField(false);
      setIsPaymentRequired(false);
      navigate('/Inicio/citas');
    } catch (error) {
      let errorMessage =
        'No se pudo registrar la cita. Por favor intente nuevamente.';
      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      }
      notification.error({
        message: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsCreatePatientModalVisible(false);
    setIsModalVisible(false);
    navigate('/Inicio/citas');
  };

  const handleCancelSelectModal = () => {
    setIsModalVisible(false);
    setSelectedRowKey(null);
  };

  const handleCancelCreateModal = () => {
    setIsCreatePatientModalVisible(false);
  };

  const handleOpenCreateModal = () => {
    setIsCreatePatientModalVisible(true);
  };

  const handleOpenSelectModal = () => {
    setIsModalVisible(true);
  };

  const handleChangeSelectedPatient = (newPatient) => {
    setSelectedPatient(newPatient);
    form.setFieldsValue({ patient_id: newPatient?.id });
  };

  const handleLogServerResponse = (result) => {
    if (result && typeof result === 'object') {
      // Concatenar el nombre completo
      const concatenatedName =
        `${result.name} ${result.paternal_lastname} ${result.maternal_lastname}`.trim();

      // Convertir todo el objeto a string
      const stringified = JSON.stringify(result);

      // Guardar en estado
      setSelectedPatient({
        ...result,
        full_name: concatenatedName,
        stringifiedData: stringified,
      });
      form.setFieldsValue({ patient_id: result.id });
    } else {
      console.error('El resultado no es un objeto válido:', result);
    }
  };

  // Eliminamos appointmentFields para usar formulario directo como EditAppointment

  const processedPatients = patients.map((patient, index) => ({
    ...patient,
    key: patient.id || `patient-${index}`,
    // Crear el formato: apellido paterno, apellido materno, nombres
    display_name: `${patient.paternal_lastname || ''} ${patient.maternal_lastname || ''} ${patient.name || ''}`.trim(),
  }));

  const columns = [
    {
      title: '',
      dataIndex: 'selection',
      width: 50,
      render: (_, record) => (
        <Radio
          value={record.key}
          checked={selectedRowKey === record.key}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRowKey(record.key);
            }
          }}
          style={{ color: 'var(--color-text-primary)' }}
        />
      ),
    },
    {
      title: 'Apellido Paterno',
      dataIndex: 'paternal_lastname',
      key: 'paternal_lastname',
      width: 150,
      render: (text) => (
        <span style={{ color: 'var(--color-text-primary)' }}>{text}</span>
      ),
    },
    {
      title: 'Apellido Materno',
      dataIndex: 'maternal_lastname',
      key: 'maternal_lastname',
      width: 150,
      render: (text) => (
        <span style={{ color: 'var(--color-text-primary)' }}>{text}</span>
      ),
    },
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text) => (
        <span style={{ color: 'var(--color-text-primary)' }}>{text}</span>
      ),
    },
  ];

  return (
      <div className={styles.container}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ color: 'var(--color-text-primary)' }}
        >
          {/* TÍTULO */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
            <h2 style={{ 
              color: 'var(--color-text-primary)', 
              fontSize: 'var(--font-size-xxl)', 
              fontWeight: 'var(--font-weight-bold)',
              fontFamily: 'var(--font-family)'
            }}>
              REGISTRAR CITA
            </h2>
          </div>

          {/* 
            SECCIÓN: FECHA DE CITA
            Campo requerido para establecer cuándo se realizará la cita
          */}
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="appointment_date"
                label="Fecha de cita"
                rules={[{ required: true, message: 'La fecha es requerida' }]}
                initialValue={dayjs()}
              >
                <DatePicker
                  style={{
                    width: '100%'
                  }}
                  format="DD-MM-YYYY"
                  placeholder="Seleccionar fecha"
                  allowClear={false}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Espacio entre secciones */}
          <div style={{ height: 'var(--spacing-md)' }} />

          {/* 
            SECCIÓN: TIPOS DE PACIENTES
            Lógica específica de Nuevo/Continuador
          */}
          <Row gutter={16} align="middle">
            <Col span={5}>
              <span className={styles.patientTypeLabel}>
                Tipo de Paciente:
              </span>
            </Col>
            <Col span={10}>
              <Radio.Group
                value={patientType}
                onChange={(e) => {
                  setPatientType(e.target.value);
            setSelectedPatient(null);
          }}
                style={{ color: 'var(--color-text-primary)' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                  <Radio value="nuevo" style={{ color: 'var(--color-text-primary)' }}>
                    Nuevo
                  </Radio>
                  <Radio value="continuador" style={{ color: 'var(--color-text-primary)' }}>
                    Continuador
                  </Radio>
                </div>
              </Radio.Group>
            </Col>
            <Col span={9}>
              <Button
                type="primary"
                onClick={() => {
                  if (patientType === 'nuevo') {
                    setIsCreatePatientModalVisible(true);
                  } else {
                    setIsModalVisible(true);
                  }
                }}
                style={{ 
                  width: '100%',
                  height: 'var(--button-height-md)',
                  fontSize: 'var(--font-size-sm)',
                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                  fontWeight: 'var(--font-weight-bold)',
                  fontFamily: 'var(--font-family)'
                }}
              >
                {patientType === 'nuevo' ? 'Crear Paciente' : 'Seleccionar Paciente'}
              </Button>
            </Col>
          </Row>

          {/* Espacio entre secciones */}
          <div style={{ height: 'var(--spacing-md)' }} />

          {/* 
            SECCIÓN: PACIENTE SELECCIONADO
            Muestra el paciente seleccionado
          */}
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Paciente" required>
                <Input
                  value={selectedPatient?.full_name || ''}
                  readOnly
                  style={{ 
                    backgroundColor: 'var(--color-input-bg)',
                    border: '1px solid var(--color-border-primary)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-input-text)'
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Espacio entre secciones */}
          <div style={{ height: 'var(--spacing-md)' }} />

          {/* Separador visual entre secciones */}
          <Divider style={{ borderColor: 'var(--color-border-primary)', marginTop: '1px' }} />

          {/* 
            SECCIÓN: OPCIONES DE PAGO
            Campo para seleccionar el servicio y opciones de pago
          */}
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item 
                name="service_id" 
                label="Opciones de Pago"
                rules={[{ required: true, message: 'Las opciones de pago son requeridas' }]}
              >
                <SelectPrices
                  value={form.getFieldValue('service_id')}
                  initialPrice={form.getFieldValue('payment')}
                  onChange={handleServiceChange}
                  onPriceChange={(price) => {
                    form.setFieldsValue({ payment: price });
                    handlePriceChange(price);
                  }}
                  placeholder="Selecciona una opción"
                  hidePriceInput={true}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Espacio entre secciones */}
          <div style={{ height: 'var(--spacing-sm)' }} />

          {/* 
            SECCIÓN: MÉTODO DE PAGO
            Campo para seleccionar el tipo de método de pago
          */}
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="payment_type_id"
                label="Método de Pago"
                rules={[
                  {
                    required: true,
                    message: 'El método de pago es requerido',
                  },
                ]}
              >
                <SelectPaymentStatus
                  value={form.getFieldValue('payment_type_id')}
                  onChange={(value) =>
                    form.setFieldsValue({ payment_type_id: value })
                  }
                  placeholder="Selecciona método de pago"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Espacio entre secciones */}
          <div style={{ height: 'var(--spacing-sm)' }} />

          {/* 
            SECCIÓN: CAMPO DE MONTO
            Input numérico para el monto del pago con validaciones
          */}
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="payment"
                label="Monto"
                rules={[
                  {
                    required: true,
                    message: 'El monto es requerido',
                  },
                  {
                    validator: (_, value) => {
                      if (
                        value &&
                        (isNaN(Number(value)) || Number(value) <= 0)
                      ) {
                        return Promise.reject(
                          new Error('El monto debe ser mayor a cero'),
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input                   
                  prefix="S/"
                  type="number"
                  step="0.01"
                  min="0"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* SECCIÓN: CHECKBOX PARA INCLUIR HORA */}
          <Row gutter={16}>
            <Col span={24}>
              <Checkbox
                checked={showHourField}
                onChange={(e) => setShowHourField(e.target.checked)}
                style={{ color: 'var(--color-text-primary)' }}
              >
                Incluir hora
              </Checkbox>
            </Col>
          </Row>

          {/* Espacio entre checkbox y campo de hora */}
          <div style={{ height: 'var(--spacing-md)' }} />

          {/* SECCIÓN: HORA DE CITA - SOLO SE MUESTRA SI EL CHECKBOX ESTÁ MARCADO */}
          {showHourField && (
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item 
                  name="appointment_hour"
                  label="Hora de la cita"
                  getValueFromEvent={(time) => {
                    console.log('TimePicker value changed:', time);
                    if (!time) return null;
                    // Formatear la hora como HH:mm:ss para la API
                    const formattedTime = time.format('HH:mm:ss');
                    console.log('Formatted time for API:', formattedTime);
                    return formattedTime;
                  }}
                  getValueProps={(value) => ({
                    value: value ? dayjs(value, 'HH:mm:ss') : null
                  })}
                >
                  <TimePicker
                    style={{
                      width: '100%',
                      height: '40px'
                    }}
                    format="HH:mm"
                    placeholder="Seleccionar hora (ej: 14:30)"
                    allowClear
                    use12Hours={false}
                    showNow={false}
                    popupStyle={{
                      zIndex: 9999
                    }}
                    dropdownStyle={{
                      zIndex: 9999
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* 
            SECCIÓN: BOTONES DE ACCIÓN
            Botones para cancelar la edición o guardar los cambios
          */}
          <Row justify="end" style={{ marginTop: 'var(--spacing-lg)' }}>
            <Col>
              <Space>
                <Button
                  onClick={handleCancel}
                  style={{
                    backgroundColor: 'var(--color-background-secondary)',
                    borderColor: 'var(--color-border-primary)',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-family)'
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSubmitting}
                  style={{
                    fontFamily: 'var(--font-family)'
                  }}
                >
                  Registrar Cita
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>

        {/* MODAL SELECCIONAR CONTRIBUIDOR */}
        <UniversalModal
          title="Seleccionar Contribuidor"
          open={isModalVisible}
          centered
          width={700}
          onCancel={handleCancelSelectModal}
          className="select-contributor-modal modal-themed"
          destroyOnClose={true}
          footer={[
            <Button 
              key="cancel" 
              onClick={handleCancelSelectModal}
            >
              Cancelar
            </Button>,
            <Button
              key="submit"
              type="primary"
              onClick={async () => {
                if (!selectedRowKey) {
                  notification.warning({
                    message: 'Advertencia',
                    description: 'Por favor seleccione un paciente primero',
                  });
                  return;
                }

                const selectedPatient = processedPatients.find(
                  (p) => p.key === selectedRowKey,
                );
                
                // Asegurar que el paciente seleccionado tenga la estructura correcta
                const patientWithFullName = {
                  ...selectedPatient,
                  full_name: selectedPatient.display_name,
                  // Mantener los campos originales del paciente
                  name: selectedPatient.name,
                  paternal_lastname: selectedPatient.paternal_lastname,
                  maternal_lastname: selectedPatient.maternal_lastname,
                };
                
                setSelectedPatient(patientWithFullName);
                form.setFieldsValue({ patient_id: selectedPatient.id });

                setIsModalVisible(false);
                setSelectedRowKey(null);

                notification.success({
                  message: 'Paciente seleccionado',
                  description: `Se ha seleccionado a ${patientWithFullName.full_name}`,
                });
              }}
              style={{
                fontFamily: 'var(--font-family)'
              }}
            >
              Seleccionar
            </Button>,
          ]}
        >
          <CustomSearch
            placeholder="Buscar por Apellido/Nombre o DNI..."
            onSearch={(value) => setSearchTerm(value)}
            width="100%"
            style={{ marginBottom: 'var(--spacing-lg)' }}
          />
          <Table
            dataSource={processedPatients}
            columns={columns}
            pagination={false}
            rowKey="key"
            loading={loading}
            size="middle"
            onRow={(record) => ({
              onClick: () => {
                setSelectedRowKey(record.key);
              },
              style: {
                cursor: 'pointer',
                backgroundColor: selectedRowKey === record.key ? 'var(--color-primary-light)' : 'transparent'
              }
            })}
            style={{
              backgroundColor: 'var(--color-background-primary)',
              color: 'var(--color-text-primary)'
            }}
          />
        </UniversalModal>

        {/* MODAL NUEVO PACIENTE */}
        <UniversalModal
          title="Crear Nuevo Paciente"
          open={isCreatePatientModalVisible}
          onCancel={handleCancelCreateModal}
          footer={null}
          width={800}
          destroyOnClose={true}
          centered={true}
          className="create-patient-modal modal-themed"
        >
          <NewPatient
            onCancel={handleCancelCreateModal}
            isModal={true}
            onSubmit={(result) => {
              console.log('Patient created result:', result);
              if (result && typeof result === 'object') {
                // Crear el formato: apellido paterno, apellido materno, nombres
                const displayName =
                  `${result.paternal_lastname || ''} ${result.maternal_lastname || ''} ${result.name || ''}`.trim();

                // Convertir todo el objeto a string
                const stringified = JSON.stringify(result);

                // Guardar en estado
                const newPatient = {
                  ...result,
                  full_name: displayName, // Mantener para compatibilidad
                  display_name: displayName, // Nuevo formato
                  stringifiedData: stringified,
                };
                
                console.log('Setting selected patient:', newPatient);
                setSelectedPatient(newPatient);
                form.setFieldsValue({ patient_id: result.id });
                
                // Cerrar el modal después de crear el paciente
                console.log('Closing modal...');
                setIsCreatePatientModalVisible(false);
                
                // Mostrar notificación de éxito
                notification.success({
                  message: 'Paciente creado',
                  description: `Se ha creado el paciente ${displayName}`,
                });
              } else {
                console.error('El resultado no es un objeto válido:', result);
                notification.error({
                  message: 'Error',
                  description: 'No se pudo crear el paciente correctamente',
                });
              }
            }}
          />
        </UniversalModal>
      </div>
  );
};

export default NewAppointment;
