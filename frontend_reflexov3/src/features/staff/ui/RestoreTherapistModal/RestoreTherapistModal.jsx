import React, { useState, useEffect } from 'react';
import { Table, Button, notification, Space, Spin } from 'antd';
import { getInactiveTherapists, restoreTherapist } from '../../service/staffService';
import { LoadingOutlined } from '@ant-design/icons';
import UniversalModal from '../../../../components/Modal/UniversalModal';
import { useTheme } from '../../../../context/ThemeContext';
import styles from './RestoreTherapistModal.module.css';

const RestoreTherapistModal = ({ open, onClose, onRestore }) => {
  const { isDarkMode } = useTheme();
  const [inactiveTherapists, setInactiveTherapists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(null);

  // Cargar terapeutas inactivos cuando se abre el modal
  useEffect(() => {
    if (open) {
      fetchInactiveTherapists();
    }
  }, [open]);

  const fetchInactiveTherapists = async () => {
    setLoading(true);
    try {
      const data = await getInactiveTherapists();
      // El servicio ya devuelve un array directamente
      setInactiveTherapists(Array.isArray(data) ? data : []);
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'No se pudieron cargar los terapeutas inactivos.',
      });
      // En caso de error, asegurar que sea un array vacío
      setInactiveTherapists([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (therapistId) => {
    setRestoreLoading(therapistId);
    try {
      await restoreTherapist(therapistId);
      notification.success({
        message: 'Éxito',
        description: 'Terapeuta restaurado correctamente.',
      });
      
      // Actualizar la lista de terapeutas inactivos
      await fetchInactiveTherapists();
      
      // Notificar al componente padre para actualizar la lista principal
      if (onRestore) {
        onRestore();
      }
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'No se pudo restaurar el terapeuta.',
      });
    } finally {
      setRestoreLoading(null);
    }
  };

  const columns = [
    {
      title: 'Apellido Paterno',
      dataIndex: 'last_name_paternal',
      key: 'last_name_paternal',
      width: '28%',
      render: (text) => (
        <span style={{ 
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-family)',
          fontWeight: 500,
          fontSize: 'var(--font-size-md)',
          lineHeight: 1.4
        }}>
          {text || '-'}
        </span>
      ),
    },
    {
      title: 'Apellido Materno',
      dataIndex: 'last_name_maternal',
      key: 'last_name_maternal',
      width: '28%',
      render: (text) => (
        <span style={{ 
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-family)',
          fontWeight: 500,
          fontSize: 'var(--font-size-md)',
          lineHeight: 1.4
        }}>
          {text || '-'}
        </span>
      ),
    },
    {
      title: 'Nombres',
      dataIndex: 'first_name',
      key: 'first_name',
      width: '28%',
      render: (text) => (
        <span style={{ 
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-family)',
          fontWeight: 500,
          fontSize: 'var(--font-size-md)',
          lineHeight: 1.4
        }}>
          {text || '-'}
        </span>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: '16%',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleRestore(record.id)}
          loading={restoreLoading === record.id}
          style={{
            backgroundColor: 'var(--color-success)',
            borderColor: 'var(--color-success)',
            color: '#ffffff',
            fontFamily: 'var(--font-family)',
            fontWeight: 500,
            height: '36px',
            minWidth: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition-normal)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            padding: '0 16px',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#389e0d';
            e.target.style.borderColor = '#389e0d';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'var(--color-success)';
            e.target.style.borderColor = 'var(--color-success)';
          }}
        >
          {restoreLoading === record.id ? (
            <Space size="small">
              <Spin size="small" style={{ color: '#ffffff' }} />
              <span>Restaurando...</span>
            </Space>
          ) : (
            'Restaurar'
          )}
        </Button>
      ),
    },
  ];

  return (
    <UniversalModal
      title="Restaurar Terapeutas"
      open={open}
      onCancel={onClose}
      footer={[
        <Button 
          key="cancel" 
          onClick={onClose}
          style={{
            backgroundColor: 'var(--color-background-secondary)',
            borderColor: 'var(--color-border-primary)',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-family)',
            fontWeight: 500,
            height: '40px',
            minWidth: '100px',
            transition: 'var(--transition-normal)',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'var(--color-background-tertiary)';
            e.target.style.borderColor = 'var(--color-primary)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'var(--color-background-secondary)';
            e.target.style.borderColor = 'var(--color-border-primary)';
          }}
        >
          Cancelar
        </Button>,
      ]}
      width={800}
      className={`${styles.restoreTherapistModal} restore-therapist-modal modal-themed`}
    >
      <div style={{ 
        marginBottom: 24,
        padding: '16px',
        backgroundColor: 'var(--color-background-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '2px solid var(--color-border-primary)',
        boxShadow: 'var(--shadow-soft)'
      }}>
        <p style={{ 
          margin: 0, 
          color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-family)',
          fontSize: 'var(--font-size-md)',
          fontWeight: 500,
          lineHeight: 1.5
        }}>
           Selecciona un terapeuta inactivo para restaurar su acceso al sistema
        </p>
      </div>
      
      <Table
        columns={columns}
        dataSource={inactiveTherapists}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} de ${total} terapeutas`,
          style: {
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-family)',
            fontSize: 'var(--font-size-sm)',
          }
        }}
        scroll={{ y: 400 }}
        size="middle"
        style={{
          backgroundColor: 'var(--color-background-primary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-primary)',
        }}
        className={`${styles.restoreTherapistTable} restore-therapist-table`}
      />
    </UniversalModal>
  );
};

export default RestoreTherapistModal;