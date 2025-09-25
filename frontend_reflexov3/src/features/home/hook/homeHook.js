import { useState, useEffect } from 'react';
import { getPendingAppointments } from '../service/homeService';
import dayjs from '../../../utils/dayjsConfig';

export const useTodayAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTodayAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPendingAppointments();

      // Manejar la estructura de respuesta del endpoint pending
      let appointmentsData = [];
      if (Array.isArray(data)) {
        appointmentsData = data;
      } else if (data && Array.isArray(data.results)) {
        appointmentsData = data.results;
      } else if (data && Array.isArray(data.data)) {
        appointmentsData = data.data;
      }

      // Obtener fecha actual para filtrar citas de hoy
      const today = dayjs().format('YYYY-MM-DD');

      // Filtrar solo las citas de hoy
      const todayAppointments = appointmentsData.filter((item) => {
        if (!item.appointment_date) return false;
        // Manejar tanto formato con hora como sin hora
        const appointmentDate = item.appointment_date.split('T')[0];
        return appointmentDate === today;
      });

      // Formatear los datos para el componente usando la nueva estructura
      const formattedAppointments = todayAppointments.map((item) => {
        return {
          name: item.patient_name || 'Sin nombre',
          service: item.appointment_type || 'Sin servicio',
          time: item.hour
            ? dayjs(item.hour, 'HH:mm:ss').format('HH:mm')
            : 'Sin hora',
          details: item,
        };
      });

      setAppointments(formattedAppointments);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAppointments();
  }, []);

  return { appointments, loading, error, refetch: fetchTodayAppointments };
};