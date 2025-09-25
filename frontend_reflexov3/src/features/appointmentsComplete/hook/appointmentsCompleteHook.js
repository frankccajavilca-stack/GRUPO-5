import { useEffect, useState, useCallback, useRef } from 'react';
import dayjs from '../../../utils/dayjsConfig';
import {
  getPaginatedAppointmentsCompleteByDate,
  searchAppointmentsComplete,
  getAllCompletedAppointments,
  getPaginatedCompletedAppointments,
  getCompletedAppointmentsByDate,
  getCompletedAppointmentsByDateRange,
  getCompletedAppointmentById,
} from '../service/appointmentsCompleteService';

export const useAppointmentsComplete = () => {
  // Estados principales
  const [appointmentsComplete, setAppointmentsComplete] = useState([]);
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

  // Función principal para cargar citas
  const loadAppointmentsComplete = useCallback(async () => {
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
        response = await searchAppointmentsComplete(searchTerm, { signal });
      } else {
        response = await getPaginatedAppointmentsCompleteByDate(
          selectedDate,
          pagination.pageSize,
          pagination.currentPage,
          { signal },
        );
      }

      setAppointmentsComplete(response.data || []);
      setPagination((prev) => ({
        ...prev,
        totalItems: response.total || 0,
      }));
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading appointments:', error);
        setError(error);
        setAppointmentsComplete([]);
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
      loadAppointmentsComplete();
    }, 300);

    return () => {
      clearTimeout(debounceTimer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadAppointmentsComplete]);

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

  const loadPaginatedAppointmentsCompleteByDate = useCallback(
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

  // Nueva función: Cargar todas las citas completadas
  const loadAllCompletedAppointments = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setError(null);

    try {
      const response = await getAllCompletedAppointments({ signal });
      setAppointmentsComplete(response.data || []);
      setPagination((prev) => ({
        ...prev,
        totalItems: response.total || 0,
      }));
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading all completed appointments:', error);
        setError(error);
        setAppointmentsComplete([]);
        setPagination((prev) => ({ ...prev, totalItems: 0 }));
      }
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  }, []);

  // Nueva función: Cargar citas completadas por rango de fechas
  const loadAppointmentsByDateRange = useCallback(async (startDate, endDate) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setError(null);

    try {
      const formattedStartDate = dayjs(startDate).format('YYYY-MM-DD');
      const formattedEndDate = dayjs(endDate).format('YYYY-MM-DD');
      
      const response = await getCompletedAppointmentsByDateRange(
        formattedStartDate,
        formattedEndDate,
        { signal }
      );
      
      setAppointmentsComplete(response.data || []);
      setPagination((prev) => ({
        ...prev,
        totalItems: response.total || 0,
      }));
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading appointments by date range:', error);
        setError(error);
        setAppointmentsComplete([]);
        setPagination((prev) => ({ ...prev, totalItems: 0 }));
      }
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  }, []);

  // Nueva función: Cargar cita específica por ID
  const loadAppointmentById = useCallback(async (id) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setError(null);

    try {
      const response = await getCompletedAppointmentById(id, { signal });
      return response;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading appointment by ID:', error);
        setError(error);
        throw error;
      }
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  }, []);

  return {
    // Estados
    appointmentsComplete,
    loading,
    error,
    pagination,
    selectedDate,
    searchTerm,

    // Funciones principales (existentes)
    loadAppointmentsComplete,
    handleDateChange,
    handleSearch,
    handlePageChange,
    loadPaginatedAppointmentsCompleteByDate,

    // Nuevas funciones del Módulo 5
    loadAllCompletedAppointments,
    loadAppointmentsByDateRange,
    loadAppointmentById,

    // Setters
    setSearchTerm,
    setSelectedDate,
    setPagination,
  };
};
