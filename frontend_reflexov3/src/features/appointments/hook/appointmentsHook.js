import dayjs from '../../../utils/dayjsConfig';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createAppointment,
  getAppointmentById,
  getPaginatedAppointmentsByDate,
  getPatients,
  searchAppointments,
  searchPatients,
  updateAppointment,
  deleteAppointment,
} from '../service/appointmentsService';
import { useToast } from '../../../services/toastify/ToastContext';
import { formatToastMessage } from '../../../utils/messageFormatter';

export const useAppointments = () => {
  // Estados principales
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format('YYYY-MM-DD'),
  );

  // Paginación
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalItems: 0,
    pageSize: 10,
  });

  // Referencia para evitar llamadas duplicadas
  const abortControllerRef = useRef(null);

  const { showToast } = useToast();

  // Función principal para cargar citas
  const loadAppointments = useCallback(async () => {
    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Crear nuevo AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setError(null);

    try {
      let response;

      if (searchTerm.trim()) {
        response = await searchAppointments(searchTerm);
      } else {
        console.log('selectedDate:', selectedDate);
        response = await getPaginatedAppointmentsByDate(
          selectedDate,
          pagination.pageSize,
        );
      }

      // Manejar la nueva estructura de respuesta de la API
      const appointmentsData = response.data || [];
      const totalItems = response.total || 0;

      setAppointments(appointmentsData);
      setPagination((prev) => ({
        ...prev,
        totalItems: totalItems,
      }));
    } catch (error) {
      if (error.name !== 'AbortError') {
        showToast(
          'error',
          formatToastMessage(
            error.response?.data?.message,
            'Error al cargar citas',
          ),
        );
        setError(error);
        setAppointments([]);
        setPagination((prev) => ({ ...prev, totalItems: 0 }));
      }
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  }, [searchTerm, selectedDate, pagination.currentPage, pagination.pageSize]);

  // Efecto para cargar citas con debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadAppointments();
    }, 300);

    return () => {
      clearTimeout(debounceTimer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadAppointments]);

  // Cambiar fecha seleccionada
  const handleDateChange = useCallback(
    (date) => {
      const formattedDate = dayjs(date).format('YYYY-MM-DD');
      if (formattedDate !== selectedDate) {
        setSelectedDate(formattedDate);
        setSearchTerm('');
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
      }
    },
    [selectedDate],
  );

  // Cambiar término de búsqueda
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  // Cambiar página
  const handlePageChange = useCallback((page) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  }, []);

  // Crear nueva cita
  const submitNewAppointment = useCallback(
    async (appointmentData) => {
      try {
        setLoading(true);
        // Log para verificar qué está recibiendo el hook
        console.log('=== HOOK RECEIVED DATA ===');
        console.log('appointmentData received:', appointmentData);
        console.log('hour from data:', appointmentData.hour);
        console.log('appointment_hour from data:', appointmentData.appointment_hour);
        console.log('payment from data:', appointmentData.payment);
        console.log('payment_type from data:', appointmentData.payment_type);
        console.log('payment_type_id from data:', appointmentData.payment_type_id);

        // Preparar payload con solo los campos del formulario original
        const payload = {
          // Campos requeridos
          patient: appointmentData.patient_id || appointmentData.patient,
          therapist: appointmentData.therapist || 1,
          appointment_date: dayjs(appointmentData.appointment_date).format('YYYY-MM-DD'),
          appointment_type: appointmentData.appointment_type || "1",
          room: appointmentData.room || 1,
          social_benefit: appointmentData.social_benefit || false,
          
          // Campos del formulario
          hour: appointmentData.hour || appointmentData.appointment_hour || null,
          payment: appointmentData.payment ? appointmentData.payment.toString() : null,
          payment_type: appointmentData.payment_type || appointmentData.payment_type_id || null,
          
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

        // Validar que el campo patient esté presente
        if (!payload.patient) {
          throw new Error('El ID del paciente es requerido');
        }
        
        console.log('=== FINAL PAYLOAD TO SERVICE ===');
        console.log('Final payload:', payload);
        console.log('Final hour:', payload.hour);
        console.log('Final payment:', payload.payment);
        console.log('Final payment_type:', payload.payment_type);
        
        const result = await createAppointment(payload);
        showToast('crearCita');
        await loadAppointments(); // Recargar lista después de crear
        return result;
      } catch (error) {
        showToast(
          'error',
          formatToastMessage(
            error.response?.data?.message,
            'Error creando cita',
          ),
        );
        console.error('Error creating appointment:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [loadAppointments],
  );

  // Nueva función para obtener detalles de una cita
  const getAppointmentDetails = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAppointmentById(id);
      return data;
    } catch (err) {
      console.error(`Error fetching appointment ${id}:`, err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Nueva función para actualizar una cita existente
  const updateExistingAppointment = useCallback(
    async (id, appointmentData) => {
      setLoading(true);
      setError(null);
      try {        
        // Preparar payload según la estructura de la API
        const payload = {
          // Campos principales requeridos
          appointment_date: dayjs(appointmentData.appointment_date).format('YYYY-MM-DD'),
          hour: appointmentData.appointment_hour || appointmentData.hour || null,
          appointment_type: appointmentData.appointment_type || 1,
          room: appointmentData.room || 1,
          social_benefit: appointmentData.social_benefit || false,
          
          // Campos de pago (si están presentes)
          ...(appointmentData.payment && { payment: appointmentData.payment }),
          ...(appointmentData.payment_type_id && { payment_type_id: appointmentData.payment_type_id }),
          
          // Campos adicionales (si están presentes)
          ...(appointmentData.ailments && { ailments: appointmentData.ailments }),
          ...(appointmentData.diagnosis && { diagnosis: appointmentData.diagnosis }),
          ...(appointmentData.surgeries && { surgeries: appointmentData.surgeries }),
          ...(appointmentData.reflexology_diagnostics && { reflexology_diagnostics: appointmentData.reflexology_diagnostics }),
          ...(appointmentData.medications && { medications: appointmentData.medications }),
          ...(appointmentData.observation && { observation: appointmentData.observation }),
          ...(appointmentData.initial_date && { initial_date: dayjs(appointmentData.initial_date).format('YYYY-MM-DD') }),
          ...(appointmentData.final_date && { final_date: dayjs(appointmentData.final_date).format('YYYY-MM-DD') }),
        };
        
        console.log('📤 Payload que se enviará:', payload);
        
        const result = await updateAppointment(id, payload);
        showToast('actualizarCita');
        await loadAppointments(); // Recargar lista después de actualizar
        return result;
      } catch (err) {
        showToast(
          'error',
          formatToastMessage(
            err.response?.data?.message,
            'Error actualizando cita',
          ),
        );
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadAppointments],
  );

  const loadPaginatedAppointmentsByDate = useCallback(
    (date) => {
      const formattedDate = dayjs(date).isValid()
        ? dayjs(date).format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD');

      if (formattedDate !== selectedDate || searchTerm !== '') {
        setSelectedDate(formattedDate);
        setSearchTerm('');
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
      }
    },
    [selectedDate, searchTerm],
  );


  // Eliminar cita
  const removeAppointment = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await deleteAppointment(id);
      showToast('cancelarCita');
      await loadAppointments(); // Recargar lista después de eliminar
      return result;
    } catch (error) {
      showToast(
        'error',
        formatToastMessage(
          error.response?.data?.message || error.message,
          'Error eliminando cita',
        ),
      );
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadAppointments, showToast]);

  return {
    // Estados
    appointments,
    loading,
    error,
    pagination,
    selectedDate,
    searchTerm,

    // Funciones principales
    loadAppointments,
    handleDateChange,
    handleSearch,
    handlePageChange,
    submitNewAppointment,
    loadPaginatedAppointmentsByDate,
    getAppointmentDetails,
    updateExistingAppointment,
    removeAppointment,

    // Setters
    setSearchTerm,
    setSelectedDate,
    setPagination,
  };
};

export const usePatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalItems: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [initialLoad, setInitialLoad] = useState(false);

  // nuevo
  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/patients?search=${searchTerm}`);
      if (!response.ok) throw new Error('Error al obtener pacientes');
      const data = await response.json();
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar pacientes paginados
  const loadPatients = async (page) => {
    if (loading) return; // Evitar llamadas duplicadas
    setLoading(true);
    try {
      const { data, total } = await getPatients(page);
      setPatients(data);
      setPagination({
        currentPage: page,
        totalItems: total,
      });
    } catch (error) {
      setError(error.message);
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para buscar pacientes por término
  const searchPatientsByTerm = async (term) => {
    if (loading) return;
    setLoading(true);
    try {
      const { data, total } = await searchPatients(term);
      setPatients(data);
      setPagination({
        currentPage: 1,
        totalItems: total,
      });
    } catch (error) {
      setError(error.message);
      console.error('Error searching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial solo una vez
  useEffect(() => {
    if (!initialLoad) {
      loadPatients(1);
      setInitialLoad(true);
      fetchPatients();
    }
  }, [searchTerm, initialLoad]);

  // Búsqueda con debounce
  useEffect(() => {
    if (!initialLoad) return;

    const delayDebounce = setTimeout(() => {
      if (searchTerm.trim()) {
        searchPatientsByTerm(searchTerm.trim());
      } else {
        loadPatients(1);
      }
    }, 1200);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, initialLoad]);

  return {
    patients, // Lista de pacientes
    loading, // Estado de carga
    error, // Mensaje de error (si existe)
    pagination, // Información de paginación
    setSearchTerm, // Función para establecer término de búsqueda
    fetchPatients,
    handlePageChange: loadPatients, // Función para cambiar de página
  };
};
