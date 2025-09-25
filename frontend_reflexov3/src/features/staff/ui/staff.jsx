import { Button, Space, notification, Spin } from 'antd';
import { useNavigate } from 'react-router';
import { useState, useCallback, useMemo } from 'react';
import CustomButton from '../../../components/Button/CustomButtom';
import CustomSearch from '../../../components/Search/CustomSearch';
import ModeloTable from '../../../components/Table/Tabla';
import { useStaff } from '../hook/staffHook';
import EditTherapist from './EditTherapist/EditTherapist';
import { getTherapistById } from '../service/staffService';
import { LoadingOutlined } from '@ant-design/icons';
import InfoTherapist from './infoTherapist/infoTherapist';
import RestoreTherapistModal from './RestoreTherapistModal/RestoreTherapistModal';

const whiteSpinIndicator = (
  <LoadingOutlined style={{ fontSize: 20, color: '#fff' }} spin />
);

export default function Staff() {
  const navigate = useNavigate();
  const {
    staff,
    loading,
    pagination,
    handlePageChange,
    setSearchTerm,
    handleDeleteTherapist,
  } = useStaff();
  const [editingTherapist, setEditingTherapist] = useState(null);
  const [loadingEditId, setLoadingEditId] = useState(null);
  const [loadingDeleteId, setLoadingDeleteId] = useState(null);
  const [therapistInfo, setTherapistInfo] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // Handler optimizado para editar: hace GET antes de abrir el modal
  const handleEdit = useCallback(async (record) => {
    setLoadingEditId(record.id);
    setEditingTherapist(record);
    try {
      const freshTherapist = await getTherapistById(record.id);
      setEditingTherapist(freshTherapist);
    } catch (e) {
      notification.error({
        message: 'Error',
        description: 'No se pudo obtener los datos actualizados.',
      });
    } finally {
      setLoadingEditId(null);
    }
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      setLoadingDeleteId(id);
      try {
        await handleDeleteTherapist(id);
      } finally {
        setLoadingDeleteId(null);
      }
    },
    [handleDeleteTherapist],
  );

  const handleInfo = useCallback((record) => {
    setTherapistInfo(record);
    setShowInfoModal(true);
  }, []);

  const handleAction = useCallback(
    (action, record) => {
      switch (action) {
        case 'edit':
          return (
            <Button
              style={{
                backgroundColor: '#0066FF',
                color: '#fff',
                border: 'none',
                minWidth: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => handleEdit(record)}
              disabled={loadingEditId === record.id}
            >
              {loadingEditId === record.id ? (
                <Spin size="small" style={{ color: '#fff' }} />
              ) : (
                'Editar'
              )}
            </Button>
          );
        case 'info':
          return (
            <Button
              style={{
                backgroundColor: '#00AA55',
                color: '#fff',
                border: 'none',
              }}
              onClick={() => handleInfo(record)}
            >
              Más Info
            </Button>
          );
        case 'delete':
          return (
            <Button
              style={{
                backgroundColor: '#FF3333',
                color: '#fff',
                border: 'none',
                minWidth: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => handleDelete(record.id)}
              disabled={loadingDeleteId === record.id}
            >
              {loadingDeleteId === record.id ? <Spin /> : 'Eliminar'}
            </Button>
          );
        default:
          return null;
      }
    },
    [handleEdit, handleInfo, handleDelete, loadingEditId, loadingDeleteId],
  );

  const handleButton = useCallback(() => {
    navigate('registrar');
  }, [navigate]);

  const handleSearch = useCallback(
    (value) => {
      setSearchTerm(value);
    },
    [setSearchTerm],
  );

  const handleRestore = useCallback(() => {
    setShowRestoreModal(true);
  }, []);

  const handleRestoreModalClose = useCallback(() => {
    setShowRestoreModal(false);
  }, []);

  const handleTherapistRestored = useCallback(() => {
    // Actualizar la lista principal después de restaurar un terapeuta
    handlePageChange(pagination.currentPage);
  }, [handlePageChange, pagination.currentPage]);

  const columns = useMemo(
    () => [
      {
        title: 'Nro. Documento',
        dataIndex: 'document_number',
        key: 'document_number',
        width: '150px',
      },
      {
        title: 'Apellido paterno',
        dataIndex: 'last_name_paternal',
        key: 'paternal_lastname',
        width: '120px',
      },
      {
        title: 'Apellido materno',
        dataIndex: 'last_name_maternal',
        key: 'maternal_lastname',
        width: '120px',
      },
      {
        title: 'Nombres',
        dataIndex: 'first_name',
        key: 'name',
        width: '120px',
      },
      {
        title: 'Teléfono',
        dataIndex: 'phone',
        key: 'phone',
        width: '120px',
      },
      {
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
        width: '200px',
      },
      {
        title: 'Acciones',
        key: 'actions',
        width: '200px',
        render: (_, record) => (
          <Space size="small">
            {handleAction('edit', record)}
            {handleAction('info', record)}
            {handleAction('delete', record)}
          </Space>
        ),
      },
    ],
    [handleAction],
  );

  return (
    <div
      style={{
        height: '100%',
        paddingTop: '50px',
        maxWidth: 'calc(100% - 200px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          margin: '0 auto',
        }}
      >
        <CustomButton text="Crear Personal" onClick={handleButton} />

        <CustomSearch
          placeholder="Buscar por Apellido/Nombre o DNI..."
          onSearch={handleSearch}
          width="100%"
        />

        <CustomButton text="Restaurar" onClick={handleRestore} />
      </div>

      <ModeloTable
        columns={columns}
        data={staff}
        loading={loading}
        pagination={useMemo(
          () => ({
            current: pagination.currentPage,
            total: pagination.totalItems,
            pageSize: 50,
            onChange: handlePageChange,
          }),
          [pagination.currentPage, pagination.totalItems, handlePageChange],
        )}
      />

      {editingTherapist && (
        <EditTherapist
          therapist={editingTherapist}
          onClose={() => setEditingTherapist(null)}
          onSave={() => handlePageChange(pagination.currentPage)}
        />
      )}

      {therapistInfo && (
        <InfoTherapist
          therapist={therapistInfo}
          open={showInfoModal}
          onClose={() => setShowInfoModal(false)}
        />
      )}

      <RestoreTherapistModal
        open={showRestoreModal}
        onClose={handleRestoreModalClose}
        onRestore={handleTherapistRestored}
      />
    </div>
  );
}
