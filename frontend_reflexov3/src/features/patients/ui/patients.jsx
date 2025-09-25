import { Button, Space, notification, Spin } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import CustomButton from '../../../components/Button/CustomButtom';
import CustomSearch from '../../../components/Search/CustomSearch';
import ModeloTable from '../../../components/Table/Tabla';
import { usePatients } from '../hook/patientsHook';
import EditPatient from '../ui/EditPatient/EditPatient';
import { getPatientById } from '../service/patientsService';
import InfoPatient from './InfoPatient/infopatient';

export default function Patients() {
  const navigate = useNavigate();
  const [editingPatient, setEditingPatient] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loadingEditId, setLoadingEditId] = useState(null);
  const [loadingDeleteId, setLoadingDeleteId] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const {
    patients,
    loading,
    pagination,
    handlePageChange,
    setSearchTerm,
    handleDeletePatient,
  } = usePatients();

  // Handler para editar: hace GET antes de abrir el modal
  const handleEdit = async (record) => {
    console.log('Iniciando edición del paciente:', record);
    setLoadingEditId(record.id);
    try {
      const freshPatient = await getPatientById(record.id);
      console.log('Datos del paciente obtenidos:', freshPatient);
      setEditingPatient(freshPatient);
      setIsEditModalOpen(true); // ← Esta línea es crucial para abrir el modal
      console.log('Modal debería abrirse ahora');
    } catch (e) {
      console.error('Error obteniendo datos del paciente:', e);
      notification.error({
        message: 'Error',
        description: 'No se pudo obtener los datos actualizados.',
      });
    } finally {
      setLoadingEditId(null);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingPatient(null);
  };

  const handleCloseInfoModal = () => {
    setShowInfoModal(false);
    setPatientInfo(null);
  };

  const handleDelete = async (id) => {
    setLoadingDeleteId(id);
    try {
      await handleDeletePatient(id);
    } finally {
      setLoadingDeleteId(null);
    }
  };

  const handleInfo = async (record) => {
    console.log('Iniciando visualización de información del paciente:', record);
    setLoadingEditId(record.id); // Reutilizar el estado de loading
    try {
      // Obtener datos frescos del paciente para mostrar información completa
      const freshPatient = await getPatientById(record.id);
      console.log('Datos del paciente obtenidos para info:', freshPatient);
      setPatientInfo(freshPatient);
      setShowInfoModal(true);
    } catch (e) {
      console.error('Error obteniendo datos del paciente:', e);
      notification.error({
        message: 'Error',
        description: 'No se pudo obtener la información del paciente.',
      });
    } finally {
      setLoadingEditId(null);
    }
  };

  const handleAction = (action, record) => {
    switch (action) {
      case 'edit':
        return (
          <Button
            style={{
              backgroundColor: '#0066FF',
              color: '#fff',
              border: 'none',
              minWidth: 80,
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
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
              minWidth: 80,
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
            }}
            onClick={() => handleInfo(record)}
            disabled={loadingEditId === record.id}
          >
            {loadingEditId === record.id ? (
              <Spin size="small" style={{ color: '#fff' }} />
            ) : (
              'Más Info'
            )}
          </Button>
        );
      case 'history':
        return (
          <Button
            style={{
              backgroundColor: '#8800CC',
              color: '#fff',
              border: 'none',
              height: '36px',
              borderRadius: '4px',
            }}
            onClick={() => navigate(`historia/${record.id}`)}
          >
            Historia
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
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
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
  };

  const handleButton = () => {
    navigate('registrar');
  };

  const columns = [
    {
      title: 'Nro. Documento',
      dataIndex: 'document_number',
      key: 'document_number',
      width: '150px',
    },
    {
      title: 'Apellido Paterno',
      dataIndex: 'paternal_lastname',
      key: 'paternal_lastname',
    },
    {
      title: 'Apellido Materno',
      dataIndex: 'maternal_lastname',
      key: 'maternal_lastname',
    },
    {
      title: 'Nombres',
      dataIndex: 'name',
      key: 'name',
    },

    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {handleAction('edit', record)}
          {handleAction('info', record)}
          {handleAction('history', record)}
          {handleAction('delete', record)}
        </Space>
      ),
    },
  ];

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
        <CustomButton text="Crear Paciente" onClick={handleButton} />
        <CustomSearch
          placeholder="Buscar por Apellido/Nombre o DNI..."
          onSearch={setSearchTerm}
          width="100%"
        />
      </div>

      <ModeloTable
        columns={columns}
        data={patients}
        loading={loading}
        pagination={{
          current: pagination.currentPage,
          total: pagination.totalItems,
          pageSize: 50,
          onChange: handlePageChange,
        }}
      />

      {/* Modal de edición */}
      {console.log('Estado del modal:', {
        editingPatient: !!editingPatient,
        isEditModalOpen,
      })}
      {editingPatient && isEditModalOpen && (
        <EditPatient
          patient={editingPatient}
          onClose={handleCloseEditModal}
          onSave={() => handlePageChange(pagination.currentPage)}
        />
      )}

      {patientInfo && (
        <InfoPatient
          patient={patientInfo}
          open={showInfoModal}
          onClose={handleCloseInfoModal}
        />
      )}
    </div>
  );
}
