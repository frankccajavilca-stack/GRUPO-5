import { PDFViewer, pdf } from '@react-pdf/renderer';
import { Button, Modal, Space, Spin, notification } from 'antd';
import dayjs from '../../../utils/dayjsConfig';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../../components/Button/CustomButtom';
import CustomTimeFilter from '../../../components/DateSearch/CustomTimeFilter';
import FichaPDF from '../../../components/PdfTemplates/FichaPDF';
import TicketPDF from '../../../components/PdfTemplates/TicketPDF';
import CustomSearch from '../../../components/Search/CustomSearch';
import ModeloTable from '../../../components/Table/Tabla';
import {
  getAppointmentsByPatientId,
  getPatientHistoryById,
} from '../../history/service/historyService';
import { useAppointments } from '../hook/appointmentsHook';
import EditAppointment from '../ui/EditAppointment/EditAppointment';
import UniversalModal from '../../../components/Modal/UniversalModal';
import { deleteAppointment } from '../service/appointmentsService';
import { useToast } from '../../../services/toastify/ToastContext';
import { defaultConfig } from '../../../services/toastify/toastConfig';
import { formatToastMessage } from '../../../utils/messageFormatter';

export default function Appointments() {
  const navigate = useNavigate();
  const {
    appointments,
    loading,
    pagination,
    handlePageChange,
    setSearchTerm,
    loadPaginatedAppointmentsByDate,
    loadAppointments,
    removeAppointment,
  } = useAppointments();

  // Cambiado: Estado como objeto dayjs en lugar de string
  const [selectDate, setSelectDate] = useState(dayjs());
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showFichaModal, setShowFichaModal] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState(null);
  const [visitasFicha, setVisitasFicha] = useState(0);

  // Estado para manejar el modal de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [appointmentIdToEdit, setAppointmentIdToEdit] = useState(null);
  const [loadingEditId, setLoadingEditId] = useState(null);
  const [loadingDeleteId, setLoadingDeleteId] = useState(null);
  const [loadingPrintFichaId, setLoadingPrintFichaId] = useState(null);
  const [loadingPrintTicketId, setLoadingPrintTicketId] = useState(null);

  const { showToast } = useToast();

  useEffect(() => {
    // Cambiado: Convertir a formato YYYY-MM-DD para la API
    loadPaginatedAppointmentsByDate(selectDate.format('YYYY-MM-DD'));
  }, [selectDate]);

  const columns = [
    {
      title: 'Nro Ticket',
      dataIndex: 'ticket_number',
      key: 'ticket_number',
      width: '60px',
    },
    {
      title: 'Paciente',
      key: 'patient_id',
      dataIndex: 'patient_name',
      width: '180px',
      
    },
    {
      title: 'Sala',
      dataIndex: 'room',
      key: 'room',
      width: '65px',
    },
    {
      title: 'Fecha cita',
      dataIndex: 'appointment_date',
      key: 'appointment_date',
      render: (date) => {
        if (!date) return '-';
        
        const dateOnly = date.split('T')[0]; // "2025-09-15T00:00:00Z" -> "2025-09-15"
        return dayjs(dateOnly).format('DD/MM/YYYY');
      },
    },
    {
      title: 'Hora',
      dataIndex: 'hour',
      key: 'appointment_hour',
      width: '70px',
    },
    {
      title: 'Metodo Pago',
      key: 'payment_type_name',
      width: '100px',
      dataIndex: 'payment_type_name',
      render: (paymentTypeName) => {
        return paymentTypeName || 'sin metodo';
      },
    },
    {
      title: 'Pago',
      dataIndex: 'payment',
      key: 'payment',
      width: '70px',
    },
    {
      title: 'Creación de cita',
      dataIndex: 'created_at',
      key: 'created_at',
      width: '150px',
      render: (date) => {
        if (!date) return '-';
        return dayjs(date).format('DD-MM-YYYY HH:mm:ss');
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: '450px',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            style={{
              backgroundColor: '#555555',
              color: '#fff',
              border: 'none',
              minWidth: 70,
              height: 30,
              padding: '4px 12px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={async () => {
              setLoadingEditId(record.id);
              setAppointmentIdToEdit(record.id);
              setIsEditModalOpen(true);
              setLoadingEditId(null);
            }}
            disabled={loadingEditId === record.id}
          >
            {loadingEditId === record.id ? (
              <Spin size="small" style={{ color: '#fff' }} />
            ) : (
              'Editar'
            )}
          </Button>
          <Button
            size="small"
            style={{
              backgroundColor: '#00AA55',
              color: '#fff',
              border: 'none',
              minWidth: 90,
              height: 30,
              padding: '4px 12px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => handleAction('history', record)}
          >
            Rellenar Historia
          </Button>
          <Button
            size="small"
            style={{
              backgroundColor: '#0066FF',
              color: '#fff',
              border: 'none',
              minWidth: 70,
              height: 30,
              padding: '4px 12px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => handleAction('imprimir', record)}
            disabled={loadingPrintFichaId === record.id}
          >
            {loadingPrintFichaId === record.id ? (
              <Spin size="small" />
            ) : (
              'Imprimir'
            )}
          </Button>
          <Button
            size="small"
            style={{
              backgroundColor: '#69276F',
              color: '#fff',
              border: 'none',
              minWidth: 100,
              height: 30,
              padding: '4px 12px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => handleAction('boleta', record)}
            disabled={loadingPrintTicketId === record.id}
          >
            {loadingPrintTicketId === record.id ? (
              <Spin size="small" />
            ) : (
              'Boleta'
            )}
          </Button>
          <Button
            size="small"
            style={{
              backgroundColor: '#FF3333',
              color: '#fff',
              border: 'none',
              minWidth: 70,
              height: 30,
              padding: '4px 12px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => handleAction('delete', record)}
            disabled={loadingDeleteId === record.id}
          >
            {loadingDeleteId === record.id ? <Spin size="small" /> : 'Eliminar'}
          </Button>
        </Space>
      ),
    },
  ];

  const handleAction = async (action, record) => {
    switch (action) {
      case 'edit':
        setLoadingEditId(record.id);
        setAppointmentIdToEdit(record.id);
        setIsEditModalOpen(true);
        break;
      case 'delete':
        setLoadingDeleteId(record.id);
        try {
          const response = await deleteAppointment(record.id);
          const backendMsg = response?.message || response?.msg;
          showToast(
            'cancelarCita',
            backendMsg
              ? formatToastMessage(
                  backendMsg,
                  defaultConfig.cancelarCita.message,
                )
              : undefined,
          );
          await loadAppointments();
        } catch (error) {
          showToast(
            'error',
            formatToastMessage(
              error?.response?.data?.message,
              defaultConfig.error.message,
            ),
          );
        }
        setLoadingDeleteId(null);
        break;
      case 'imprimir':
        setLoadingPrintFichaId(record.id);
        await handlePrintFicha(record);
        setLoadingPrintFichaId(null);
        break;
      case 'boleta':
        setLoadingPrintTicketId(record.id);
        setSelectedAppointment(record);
        setShowTicketModal(true);
        setLoadingPrintTicketId(null);
        break;
      case 'history':
        navigate(`/Inicio/pacientes/historia/${record.patient.id}`, {
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

  const handlePrintFicha = async (record) => {
    try {
      const res = await getAppointmentsByPatientId(record.patient.id);
      const visitas = Array.isArray(res) ? res.length : 0;
      await printFichaPDF(record, visitas);
    } catch (e) {
      await printFichaPDF(record, 0);
    }
  };

  const printFichaPDF = async (record, visitas) => {
    let historia = {};
    try {
      historia = await getPatientHistoryById(record.patient.id);
    } catch (e) {
      historia = {};
    }
    const doc = (
      <FichaPDF
        cita={record}
        paciente={record.patient}
        visitas={visitas}
        historia={historia.data || {}}
      />
    );
    const asPdf = pdf([]);
    asPdf.updateContainer(doc);
    const blob = await asPdf.toBlob();
    const url = URL.createObjectURL(blob);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);

    const cleanUp = () => {
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 100);
      iframe.contentWindow.removeEventListener('afterprint', cleanUp);
    };

    iframe.onload = function () {
      setTimeout(() => {
        iframe.contentWindow.addEventListener('afterprint', cleanUp);
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }, 500);
    };
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
        <CustomButton text="Registrar Cita" onClick={handleButton} />

        <CustomSearch
          placeholder="Buscar por Apellido/Nombre o DNI..."
          onSearch={handleSearch}
          width="100%"
        />

        <CustomTimeFilter
          onDateChange={setSelectDate} // Ahora recibe objeto dayjs
          value={selectDate} // Pasa el valor actual
          width="250px"
          showTime={false}
          format="DD-MM-YYYY"
        />
      </div>

      <ModeloTable
        columns={columns}
        data={appointments}
        loading={loading}
        pagination={{
          current: pagination.currentPage,
          total: pagination.totalItems,
          pageSize: 50,
          onChange: handlePageChange,
        }}
      />

      {/* Modal para mostrar el ticket */}
      <Modal
        open={showTicketModal}
        onCancel={() => setShowTicketModal(false)}
        footer={null}
        width={420}
        bodyStyle={{ padding: 0 }}
      >
        {selectedAppointment && (
          <PDFViewer width="100%" height={600} showToolbar={true}>
            <TicketPDF
              company={{
                name: 'REFLEXOPERU',
                address: 'Calle Las Golondrinas N° 153 - Urb. Los Nogales',
                phone: '01-503-8416',
                email: 'reflexoperu@reflexoperu.com',
                city: 'LIMA - PERU',
                exonerated: 'EXONERADO DE TRIBUTOS',
                di: 'D.I. 626-D.I.23211',
              }}
              ticket={{
                number: selectedAppointment.ticket_number,
                date: (() => {
                  const dateOnly = selectedAppointment.appointment_date.split('T')[0];
                  return dayjs(dateOnly).format('DD/MM/YYYY');
                })(),
                patient:
                  `${selectedAppointment.patient?.paternal_lastname || ''} ${selectedAppointment.patient?.maternal_lastname || ''} ${selectedAppointment.patient?.name || ''}`.trim(),
                service: 'Consulta',
                unit: 1,
                amount: `S/ ${Number(selectedAppointment.payment).toFixed(2)}`,
                paymentType:
                  selectedAppointment.payment_type?.name || 'Sin especificar',
              }}
            />
          </PDFViewer>
        )}
      </Modal>

      {/* Modal para editar cita */}
      <UniversalModal
        title="Editar Cita"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        width={730}
      >
        {appointmentIdToEdit && (
          <EditAppointment
            appointmentId={appointmentIdToEdit}
            onEditSuccess={async () => {
              setIsEditModalOpen(false);
              setLoadingEditId(null);
              await loadAppointments();
            }}
          />
        )}
      </UniversalModal>
    </div>
  );
}
