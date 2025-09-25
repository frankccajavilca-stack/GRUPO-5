import { useState } from 'react';
import { useToast } from '../../../services/toastify/ToastContext';
import { formatToastMessage } from '../../../utils/messageFormatter';
import {
    getAppointmentsBetweenDates,
    getAppointmentsforTherapist,
    getDailyCash,
    getPatientsByTherapist,
} from '../service/reportsService';

export const useDailyTherapistReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const fetchReport = async (date) => {
    setLoading(true);
    setError(null);
    try {
      // Formatear la fecha a YYYY-MM-DD
      const formattedDate = date.format('YYYY-MM-DD');
      const res = await getAppointmentsforTherapist(formattedDate);
      
      // Debug: Log de la respuesta del API
      console.log('Respuesta del API para reporte de terapeutas:', res);
      
      // Verificar la nueva estructura del API
      if (
        res &&
        typeof res === 'object' &&
        res.date &&
        Array.isArray(res.therapists_appointments) &&
        typeof res.total_appointments_count === 'number'
      ) {
        // Estructura válida del nuevo API
        if (res.therapists_appointments.length === 0 && res.total_appointments_count === 0) {
          // No hay datos pero la respuesta es válida
          setData(res);
          showToast('warning', 'No se encontraron datos para generar el reporte.');
        } else {
          // Hay datos válidos
          setData(res);
          showToast('success', 'Reporte generado exitosamente.');
        }
      } else if (Array.isArray(res) && res.length === 0) {
        // Array vacío (estructura antigua)
        setData(res);
        showToast('warning', 'No se encontraron datos para generar el reporte.');
      } else {
        // Estructura no reconocida
        console.warn('Estructura de respuesta no reconocida:', res);
        setData(res);
        showToast('success', 'Reporte generado exitosamente.');
      }
    } catch (err) {
      setError(err);
      showToast(
        'error',
        formatToastMessage(
          err.response?.data?.message,
          'Error al generar el reporte.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchReport };
};

export const usePatientsByTherapistReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const fetchReport = async (date) => {
    setLoading(true);
    setError(null);
    try {
      const formattedDate = date.format('YYYY-MM-DD');
      const res = await getPatientsByTherapist(formattedDate);
      setData(res);

      if (Array.isArray(res) && res.length === 0) {
        showToast('warning', 'No se encontraron datos para generar el reporte.');
      } else {
        showToast('success', 'Reporte generado exitosamente.');
      }
    } catch (err) {
      setError(err);
      showToast(
        'error',
        formatToastMessage(
          err.response?.data?.message,
          'Error al generar el reporte.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchReport };
};

export const useDailyCashReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const fetchReport = async (date) => {
    setLoading(true);
    setError(null);
    try {
      const formattedDate = date.format('YYYY-MM-DD');
      const res = await getDailyCash(formattedDate);
      
      // Debug: Log de la respuesta del API
      console.log('Respuesta del API para reporte de caja:', res);
      
      // Verificar la nueva estructura del API
      if (
        res &&
        typeof res === 'object' &&
        res.fecha &&
        Array.isArray(res.pagos_detallados) &&
        Array.isArray(res.resumen_por_metodo) &&
        typeof res.total_general === 'number' &&
        typeof res.cantidad_total_pagos === 'number'
      ) {
        // Estructura válida del nuevo API
        if (res.pagos_detallados.length === 0 && res.total_general === 0) {
          setData(res);
          showToast('warning', 'No se encontraron datos para generar el reporte.');
        } else {
          setData(res);
          showToast('success', 'Reporte generado exitosamente.');
        }
      } else if (res && typeof res === 'object' && Object.keys(res).length === 0) {
        // Objeto vacío (estructura antigua)
        setData(res);
        showToast('warning', 'No se encontraron datos para generar el reporte.');
      } else if (res && Object.keys(res).length > 0) {
        // Estructura antigua con datos
        setData(res);
        showToast('success', 'Reporte generado exitosamente.');
      } else {
        // Estructura no reconocida
        console.warn('Estructura de respuesta no reconocida:', res);
        setData(res);
        showToast('success', 'Reporte generado exitosamente.');
      }
    } catch (err) {
      setError(err);
      showToast(
        'error',
        formatToastMessage(
          err.response?.data?.message,
          'Error al generar el reporte.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchReport };
};

export const useAppointmentsBetweenDatesReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const fetchReport = async (startDate, endDate) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAppointmentsBetweenDates(startDate, endDate);
      setData(res);

      if (Array.isArray(res) && res.length === 0) {
        showToast('warning', 'No se encontraron datos para generar el reporte.');
      } else {
        showToast('success', 'Reporte generado exitosamente.');
      }
    } catch (err) {
      setError(err);
      showToast(
        'error',
        formatToastMessage(
          err.response?.data?.message,
          'Error al generar el reporte.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchReport };
};
