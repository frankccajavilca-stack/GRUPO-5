import {
  get,
  post,
  put,
  del,
} from '../../../services/api/Axios/MethodsGeneral';
// =============================== //
// FUNCIONES PRINCIPALES DE CITAS  //
// =============================== //

// Crear una nueva cita
export const createAppointment = async (data) => {
  try {
    console.log('Sending appointment data to backend:', data);
    const response = await post('appointments/appointments/', data);
    return response.data;
  } catch (error) {
    console.error('Error en createAppointment:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

// Buscar citas por término de búsqueda
export const searchAppointments = async (term) => {
  try {
    const res = await get(`appointments/appointments/?search=${term}&per_page=100`);
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

// Obtener citas por fecha específica
export const getPaginatedAppointmentsByDate = async (date, perPage = 100) => {
  try {
    const res = await get(
      `appointments/appointments/?appointment_date=${date}&per_page=${perPage}`,
    );
    const data = Array.isArray(res.data)
      ? res.data
      : res.data.results || res.data.items || res.data.data || [];
    const total = res.data.count || res.data.total || data.length;

    return { data, total };
  } catch (error) {
    console.error('❌ Error al obtener citas por fecha:', error);
    throw error;
  }
};

// Obtener una cita específica por ID
export const getAppointmentById = async (id) => {
  try {
    const response = await get(`appointments/appointments/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error en getAppointmentById para ID ${id}:`, error);
    throw error;
  }
};

// Actualizar una cita existente
export const updateAppointment = async (id, data) => {
  try {
    console.log('🚀 Actualizando cita ID:', id);
    console.log('📤 Datos enviados:', JSON.stringify(data, null, 2));
    const response = await put(`appointments/appointments/${id}/`, data);
    console.log('✅ Respuesta exitosa:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error en updateAppointment para ID ${id}:`, error);
    console.error('📋 Respuesta del servidor:', error.response?.data);
    throw error;
  }
};

// Eliminar una cita
export const deleteAppointment = async (id) => {
  try {
    const response = await del(`appointments/appointments/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar la cita con ID ${id}:`, error);
    throw error;
  }
};

// Obtener lista de pacientes con paginación
export const getPatients = async (page = 1, perPage = 10) => {
  try {
    const response = await get(`patients/patients/?page=${page}&per_page=${perPage}`);

    let data = [];
    if (response.data) {
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (Array.isArray(response.data.results)) {
        data = response.data.results;
      } else if (Array.isArray(response.data.data)) {
        data = response.data.data;
      } else if (Array.isArray(response.data.items)) {
        data = response.data.items;
      }
    }

    return {
      data,
      total: response.data?.count || response.data?.total || data.length || 0,
      status: response.status,
    };
  } catch (error) {
    console.error('Error en getPatients:', error);
    throw error;
  }
};

// Buscar pacientes por término de búsqueda
export const searchPatients = async (term) => {
  try {
    const res = await get(`patients/patients/search/?q=${term}&per_page=50`);
    console.log('🔍 Resultado de búsqueda de pacientes:', res.data);

    const data = Array.isArray(res.data)
      ? res.data
      : res.data.results || res.data.items || res.data.data || [];
    const total = res.data.count || res.data.total || data.length;

    return { data, total };
  } catch (error) {
    console.error('❌ Error en searchPatients:', error);
    throw error;
  }
};