import {
  del,
  get,
  post,
  patch,
} from '../../../services/api/Axios/MethodsGeneral';

export const createTherapist = async (data) => {
  try {
    const response = await post('therapists/therapists/', data);
    return response.data;
  } catch (error) {
    console.error('Error en createTherapist:', error);
    throw error;
  }
};

export const getStaff = async (page = 1, perPage = 50) => {
  try {
    const response = await get(`therapists/therapists/?page=${page}&per_page=${perPage}`);

    let data = [];
    let total = 0;
    
    if (response.data) {
      // Nueva estructura de la API con paginación
      if (response.data.results && Array.isArray(response.data.results)) {
        data = response.data.results;
        total = response.data.count || 0;
      }
      // Fallback para estructuras anteriores
      else if (Array.isArray(response.data)) {
        data = response.data;
        total = data.length;
      }
    }

    return {
      data,
      total,
      next: response.data?.next,
      previous: response.data?.previous,
    };
  } catch (error) {
    console.error('Error en getStaff:', error);
    throw error;
  }
};

export const searchStaff = async (term) => {
  try {
    const response = await get(`therapists/therapists/search/?search=${term}&per_page=100`);
    
    let data = [];
    let total = 0;
    
    if (response.data) {
      // Nueva estructura de la API con paginación
      if (response.data.results && Array.isArray(response.data.results)) {
        data = response.data.results;
        total = response.data.count || 0;
      }
      // Fallback para estructuras anteriores
      else if (Array.isArray(response.data)) {
        data = response.data;
        total = data.length;
      }
    }
    
    return {
      data,
      total,
      next: response.data?.next,
      previous: response.data?.previous,
    };
  } catch (error) {
    console.error('Error en searchStaff:', error);
    throw error;
  }
};

export const deleteTherapist = async (therapistId) => {
  try {
    const response = await del(`therapists/therapists/${therapistId}/`);
    return response.data;
  } catch (error) {
    console.error('Error en deleteTherapist:', error);
    throw error;
  }
};

export const updateTherapist = async (therapistId, data) => {
  try {
    const response = await patch(`therapists/therapists/${therapistId}/`, data);
    return response.data;
  } catch (error) {
    console.error('Error actualizando terapeuta:', error);
    throw error;
  }
};

export const getTherapistById = async (therapistId) => {
  try {
    const response = await get(`therapists/therapists/${therapistId}/`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo terapeuta por ID:', error);
    throw error;
  }
};

// Obtener terapeutas inactivos
export const getInactiveTherapists = async () => {
  try {
    const response = await get('therapists/therapists/?active=false');
    
    // La API devuelve: { count, next, previous, results }
    // Extraemos el array results
    return response.data?.results || [];
  } catch (error) {
    console.error('Error en getInactiveTherapists:', error);
    throw error;
  }
};

// Restaurar terapeuta
export const restoreTherapist = async (therapistId) => {
  try {
    const response = await patch(`therapists/therapists/${therapistId}/restore/`);
    return response.data;
  } catch (error) {
    console.error('Error en restoreTherapist:', error);
    throw error;
  }
};
