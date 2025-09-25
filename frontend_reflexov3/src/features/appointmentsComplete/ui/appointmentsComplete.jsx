import React, { useEffect, useState } from 'react';
import estilo from './appointmentsComplete.module.css';
import ModeloTable from '../../../components/Table/Tabla';
import CustomSearch from '../../../components/Search/CustomSearch';
import CustomTimeFilter from '../../../components/DateSearch/CustomTimeFilter';
import { useNavigate } from 'react-router';
import { useAppointmentsComplete } from '../hook/appointmentsCompleteHook';
import dayjs from '../../../utils/dayjsConfig';
import { Space, Button } from 'antd';

export default function AppointmentsComplete() {
  const navigate = useNavigate();
  const {
    appointmentsComplete,
    loading,
    error,
    pagination,
    handlePageChange,
    setSearchTerm,
    loadPaginatedAppointmentsCompleteByDate,
  } = useAppointmentsComplete();

  // Cambiado: Estado como objeto dayjs en lugar de string
  const [selectDate, setSelectDate] = useState(dayjs());

  useEffect(() => {
    // Convertir a formato YYYY-MM-DD para la API
    loadPaginatedAppointmentsCompleteByDate(selectDate.format('YYYY-MM-DD'));
  }, [selectDate]);

  const columns = [
    {
      title: 'Nro Ticket',
      dataIndex: 'ticket_number',
      key: 'ticket_number',
      width: '70px',
    },
    {
      title: 'Paciente',
      key: 'patient_name',
      dataIndex: 'patient_name',
      width: '160px',
      render: (text, record) => {
        return record.patient_name || 'Sin paciente';
      },
    },
    {
      title: 'Terapeuta',
      key: 'therapist_name',
      dataIndex: 'therapist_name',
      width: '160px',
      render: (text, record) => {
        return record.therapist_name || 'Sin asignar';
      },
    },
    {
      title: 'Sala',
      dataIndex: 'room',
      key: 'room',
      width: '60px',
    },
    {
      title: 'Fecha cita',
      dataIndex: 'appointment_date',
      key: 'appointment_date',
      width: '70px',
      render: (date) => {
        if (!date) return '-';
        return dayjs(date).format('DD/MM/YYYY');
      },
    },
    {
      title: 'Hora',
      dataIndex: 'hour',
      key: 'hour',
      width: '60px',
    },
    {
      title: 'Metodo Pago',
      key: 'payment_type_name',
      dataIndex: 'payment_type_name',
      width: '100px',
      render: (text, record) => record.payment_type_name || 'Sin método',
    },
    {
      title: 'Pago',
      dataIndex: 'payment',
      key: 'payment',
      width: '70px',
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: '100px',
      render: (_, record) => (
        <Space size="small">
          <Button
            style={{
              backgroundColor: '#00AA55',
              color: '#fff',
              border: 'none',
            }}
            onClick={() => handleAction('history', record)}
          >
            Editar Historia
          </Button>
        </Space>
      ),
    },
  ];

  const handleAction = (action, record) => {
    switch (action) {
      case 'history':
        if (!record || !record.patient) return;
        navigate(`/Inicio/pacientes/historia/${record.patient}` , {
          state: { appointment: record },
        });
        break;
      default:
        break;
    }
  };

  const handleButton = () => {
    navigate('registrar');
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

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
        <CustomSearch
          placeholder="Buscar por Apellido/Nombre o DNI..."
          onSearch={handleSearch}
          width="100%"
        />

        <CustomTimeFilter
          onDateChange={setSelectDate} // Recibe objeto dayjs
          value={selectDate} // Pasa el valor actual
          width="250px"
          showTime={false}
          format="DD-MM-YYYY" // Formato visual DD-MM-YYYY
        />
      </div>

      <ModeloTable
        columns={columns}
        data={appointmentsComplete}
        loading={loading}
        pagination={{
          current: pagination.currentPage,
          total: pagination.totalItems,
          pageSize: 50,
          onChange: handlePageChange,
        }}
      />
    </div>
  );
}
