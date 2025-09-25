import { get } from '../../../services/api/Axios/MethodsGeneral';

// Obtener todas las citas completadas
export const getAllCompletedAppointments = async (options = {}) => {
  try {
    const res = await get('appointments/appointments/completed/', options);
    console.log('🔍 Todas las citas completadas:', res.data);

    const data = Array.isArray(res.data)
      ? res.data
      : res.data.results || res.data.items || res.data.data || [];
    const total = res.data.count || res.data.total || data.length;

    return { data, total };
  } catch (error) {
    console.error('❌ Error al obtener todas las citas completadas:', error);
    throw error;
  }
};

// Obtener citas completadas con paginación
export const getPaginatedCompletedAppointments = async (page = 1, perPage = 50, options = {}) => {
  try {
    const res = await get(
      `appointments/appointments/completed/?page=${page}&per_page=${perPage}`,
      options
    );
    console.log('🔍 Citas completadas paginadas:', res.data);

    const data = Array.isArray(res.data)
      ? res.data
      : res.data.results || res.data.items || res.data.data || [];
    const total = res.data.count || res.data.total || data.length;

    return { data, total };
  } catch (error) {
    console.error('❌ Error al obtener citas completadas paginadas:', error);
    throw error;
  }
};

// Obtener citas completadas por fecha específica
export const getCompletedAppointmentsByDate = async (date, page = 1, perPage = 50, options = {}) => {
  try {
    const res = await get(
      `appointments/appointments/completed/?date=${date}&page=${page}&per_page=${perPage}`,
      options
    );
    console.log('🔍 Citas completadas por fecha:', res.data);

    const data = Array.isArray(res.data)
      ? res.data
      : res.data.results || res.data.items || res.data.data || [];
    const total = res.data.count || res.data.total || data.length;

    return { data, total };
  } catch (error) {
    console.error('❌ Error al obtener citas completadas por fecha:', error);
    throw error;
  }
};

// Obtener citas completadas por rango de fechas
export const getCompletedAppointmentsByDateRange = async (startDate, endDate, options = {}) => {
  try {
    const res = await get(
      `appointments/appointments/by_date_range/?start_date=${startDate}&end_date=${endDate}`,
      options
    );
    console.log('🔍 Citas completadas por rango de fechas:', res.data);

    const data = Array.isArray(res.data)
      ? res.data
      : res.data.results || res.data.items || res.data.data || [];
    const total = res.data.count || res.data.total || data.length;

    return { data, total };
  } catch (error) {
    console.error('❌ Error al obtener citas completadas por rango de fechas:', error);
    throw error;
  }
};

// Buscar citas completadas (función existente actualizada)
export const searchAppointmentsComplete = async (term, options = {}) => {
  try {
    const res = await get(
      `appointments/appointments/completed/?search=${term}&per_page=100`,
      options
    );
    console.log('🔍 Resultado de búsqueda:', res.data);

    const data = Array.isArray(res.data)
      ? res.data
      : res.data.results || res.data.items || res.data.data || [];
    const total = res.data.count || res.data.total || data.length;

    return { data, total };
  } catch (error) {
    console.error('❌ Error en searchAppointments:', error);
    throw error;
  }
};

// Obtener cita específica por ID
export const getCompletedAppointmentById = async (id, options = {}) => {
  try {
    const res = await get(`appointments/appointments/${id}/`, options);
    console.log('🔍 Cita completada por ID:', res.data);

    return res.data;
  } catch (error) {
    console.error('❌ Error al obtener cita completada por ID:', error);
    throw error;
  }
};

// Función de compatibilidad con el código existente
export const getPaginatedAppointmentsCompleteByDate = async (date, perPage = 50, page = 1, options = {}) => {
  return getCompletedAppointmentsByDate(date, page, perPage, options);
};
