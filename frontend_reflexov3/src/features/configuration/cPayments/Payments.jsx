import React, { useState, useEffect } from 'react';
import ModeloTable from '../../../components/Table/Tabla';
import styles from './Payments.module.css';
import { usePaymentTypes, usePrices } from './paymentsHook';
import {
  Button,
  Space,
  Form,
  Input,
  message,
  Popconfirm,
} from 'antd';
import BaseModal from '../../../components/Modal/BaseModalPayments/BaseModalPayments';


const Payments = () => {
  const [form] = Form.useForm();
  const {
    paymentTypes,
    loading: loadingPayments,
    addPaymentType,
    editPaymentType,
    removePaymentType,
    refreshPaymentTypes,
  } = usePaymentTypes();

  const {
    prices,
    loading: loadingPrices,
    addPrice,
    editPrice,
    removePrice,
    refreshPrices,
  } = usePrices();

  const [modalVisible, setModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [modalType, setModalType] = useState('');
  const [action, setAction] = useState('');

  // Preparar los valores iniciales para el modal
  const getInitialValues = () => {
    if (action === 'edit' && currentRecord) {
      const formData = {
        name: currentRecord.name,
      };

      // Si es un precio, agregar el campo price
      if (modalType === 'price' && currentRecord.price) {
        formData.price = parseFloat(currentRecord.price);
      }

      return formData;
    }

    // Valores por defecto para crear
    return {
      name: '',
      ...(modalType === 'price' && { price: '' }),
    };
  };

  const handleAction = (action, record) => {
    setAction(action);
    setCurrentRecord(record);
    setModalType(record.price !== undefined ? 'price' : 'payment');

    // Resetear el formulario antes de abrir el modal
    form.resetFields();

    setModalVisible(true);

    // Usar setTimeout para asegurar que el modal se haya renderizado
    setTimeout(() => {
      if (action === 'edit') {
        const formData = {
          name: record.name, // Mantener el formato original para mostrar
          status: record.status === 'Habilitado',
        };

        if (record.price !== undefined) {
          formData.price = parseFloat(record.price);
        }

        form.setFieldsValue(formData);
      }
    }, 0);
  };

  const handleCreate = (type) => {
    setAction('create');
    setModalType(type);
    setCurrentRecord(null);

    // Resetear completamente el formulario
    form.resetFields();

    setModalVisible(true);

    // Establecer valores por defecto después de abrir el modal
    setTimeout(() => {
      form.setFieldsValue({
        name: '',
        status: true,
        ...(type === 'price' && { price: '' }),
      });
    }, 0);
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        // Convertir el nombre según el tipo: mayúsculas para payment, capitalizar primera letra para price
        name: modalType === 'payment' 
          ? values.name?.toUpperCase().trim()
          : values.name?.charAt(0).toUpperCase() + values.name?.slice(1).toLowerCase().trim(),
        status: values.status ? 'active' : 'inactive',
      };

      if (modalType === 'payment') {
        if (action === 'create') {
          await addPaymentType({ name: payload.name, status: payload.status });
        } else {
          await editPaymentType(currentRecord.id, {
            name: payload.name,
            status: payload.status,
          });
        }
        refreshPaymentTypes();
      } else {
        if (action === 'create') {
          await addPrice({
            name: payload.name,
            price: payload.price,
            status: payload.status,
          });
        } else {
          await editPrice(currentRecord.id, {
            name: payload.name,
            price: payload.price,
            status: payload.status,
          });
        }
        refreshPrices();
      }

      message.success(
        action === 'create'
          ? 'Registro creado exitosamente'
          : 'Registro actualizado exitosamente',
      );
      handleModalCancel();
    } catch (error) {
      message.error('Ocurrió un error al procesar la solicitud');
      console.error(error);
    }
  };

  const handleDelete = async (record) => {
    try {
      if (record.price !== undefined) {
        await removePrice(record.id);
        refreshPrices();
        message.success('Precio eliminado exitosamente');
      } else {
        await removePaymentType(record.id);
        refreshPaymentTypes();
        message.success('Tipo de pago eliminado exitosamente');
      }
    } catch (error) {
      message.error('Ocurrió un error al eliminar el registro');
      console.error(error);
    }
  };


  const handleModalCancel = () => {
    setModalVisible(false);
    setCurrentRecord(null);
    setAction('');
    setModalType('');
    // Resetear el formulario al cancelar
    form.resetFields();
  };

  // Efecto para resetear el formulario cuando cambia el modal
  useEffect(() => {
    if (!modalVisible) {
      form.resetFields();
    }
  }, [modalVisible, form]);

  const paymentTypeColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Tipo de pago',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Acciones',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            className={styles.editButton}
            onClick={() => handleAction('edit', record)}
          >
            Editar
          </Button>
          <Popconfirm
            title="¿Estás seguro de eliminar este tipo de pago?"
            onConfirm={() => handleDelete(record)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
          >
            <Button
              className={styles.deleteButton}
              danger
            >
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const priceColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Precio',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `S/ ${price}`,
    },
    {
      title: 'Acciones',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            className={styles.editButton}
            onClick={() => handleAction('edit', record)}
          >
            Editar
          </Button>
          <Popconfirm
            title="¿Estás seguro de eliminar este precio predeterminado?"
            onConfirm={() => handleDelete(record)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
          >
            <Button
              className={styles.deleteButton}
              danger
            >
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
        {/* Tipos de Pago */}
        <div>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Método de pago</h2>
            <Button
              type="primary"
              className={styles.addButton}
              onClick={() => handleCreate('payment')}
            >
              Agregar
            </Button>
          </div>
          <ModeloTable
            columns={paymentTypeColumns}
            data={paymentTypes}
            loading={loadingPayments}
            pagination={false}
            maxHeight="auto"
          />
        </div>

        {/* Precios */}
        <div>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Opciones de Pago</h2>
            <Button
              type="primary"
              className={styles.addButton}
              onClick={() => handleCreate('price')}
            >
              Agregar
            </Button>
          </div>
          <ModeloTable
            columns={priceColumns}
            data={prices}
            loading={loadingPrices}
            pagination={false}
          />
        </div>

        {/* Modal con BaseModal */}
        <BaseModal
          visible={modalVisible}
          onCancel={handleModalCancel}
          onOk={handleSubmit}
          title={
            action === 'create'
              ? `Agregar nuevo ${modalType === 'payment' ? 'tipo de pago' : 'precio'}`
              : `Editar ${modalType === 'payment' ? 'tipo de pago' : 'precio'}`
          }
          okText={action === 'create' ? 'Crear' : 'Actualizar'}
          cancelText="Cancelar"
          width={500}
          form={form}
          initialValues={getInitialValues()}
        >
          <Form.Item
            name="name"
            label={
              modalType === 'payment'
                ? 'Nombre del tipo de pago'
                : 'Nombre del precio'
            }
            rules={[{ required: true, message: 'Este campo es requerido' }]}
          >
            <Input
              size="large"
              className={styles.inputField}
              placeholder={`Ingrese el nombre del ${modalType === 'payment' ? 'tipo de pago' : 'precio'}`}
              onChange={(e) => {
                // Solo convertir a mayúsculas para tipos de pago, para precios mantener el texto original
                const value = modalType === 'payment' 
                  ? e.target.value.toUpperCase()
                  : e.target.value;
                form.setFieldValue('name', value);
              }}
            />
          </Form.Item>

          {modalType === 'price' && (
            <Form.Item
              name="price"
              label="Costo"
              rules={[
                { required: true, message: 'Este campo es requerido' },
                {
                  pattern: /^\d+(\.\d{1,2})?$/,
                  message: 'Ingrese un valor válido (ej: 10.50)',
                },
              ]}
            >
              <Input
                prefix="S/"
                type="number"
                step="0.01"
                size="large"
                className={styles.inputField}
                placeholder="0.00"
              />
            </Form.Item>
          )}
        </BaseModal>
      </div>
  );
};

export default Payments;
