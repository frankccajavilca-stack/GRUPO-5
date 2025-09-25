import {
  del,
  get,
  post,
  put,
  patch,
} from '../../../services/api/Axios/MethodsGeneral';

export const getPatients = async (page = 1, perPage = 50) => {
  try {
    const response = await get(`patients/patients/`);

    let data = [];
    if (response.data) {
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (Array.isArray(response.data.data)) {
        data = response.data.data;
      } else if (Array.isArray(response.data.items)) {
        data = response.data.items;
      }
    }

    return {
      data,
      total: response.data?.total || data.length || 0,
    };
  } catch (error) {
    console.error('Error obteniendo pacientes:', error);
    throw error;
  }
};

//==============================================================================
export const updatePatient = async (patientId, patientData) => {
  try {
    const response = await put(`patients/patients/${patientId}/`, patientData);
    return response.data;
  } catch (error) {
    console.error('Error actualizando paciente:', error);
    throw error;
  }
};
//==============================================================================

export const searchPatients = async (term) => {
  try {
    const res = await get(`patients/patients/search/?q=${encodeURIComponent(term)}`);
    console.log('=== RESPUESTA DE BÚSQUEDA ===');
    console.log('Respuesta completa:', res);
    console.log('res.data:', res.data);
    console.log('Tipo de res.data:', typeof res.data);
    console.log('Es array?', Array.isArray(res.data));
    
    let data = [];
    if (Array.isArray(res.data)) {
      data = res.data;
    } else if (res.data && Array.isArray(res.data.results)) {
      data = res.data.results;
    } else if (res.data && Array.isArray(res.data.items)) {
      data = res.data.items;
    } else if (res.data && Array.isArray(res.data.data)) {
      data = res.data.data;
    }
    
    // Procesar los datos para asegurar que tengan full_name
    const processedData = data.map(patient => {
      // Si ya tiene full_name, mantenerlo
      if (patient.full_name) {
        return patient;
      }
      
      // Construir full_name desde campos separados (orden: Nombre + Apellidos)
      const parts = [];
      if (patient.name) parts.push(patient.name);
      if (patient.paternal_lastname) parts.push(patient.paternal_lastname);
      if (patient.maternal_lastname) parts.push(patient.maternal_lastname);
      
      return {
        ...patient,
        full_name: parts.join(' ') || 'Sin nombre'
      };
    });
    
    console.log('Datos procesados:', processedData);
    console.log('Primer elemento:', processedData[0]);
    
    return {
      data: processedData,
      total: res.data?.count || res.data?.total || processedData.length || 0,
    };
  } catch (error) {
    console.error('Error buscando pacientes:', error);
    throw error;
  }
};

export const createPatient = async (data) => {
  try {
    const response = await post('patients/patients/', data);
    return response.data;
  } catch (error) {
    console.error('Error creando paciente:', error);
    throw error;
  }
};

export const deletePatient = async (patientId) => {
  try {
    const response = await del(`patients/patients/${patientId}/`);
    return response.data;
  } catch (error) {
    console.error('Error eliminando paciente:', error);
    throw error;
  }
};

export const getPatientById = async (patientId) => {
  try {
    const response = await get(`patients/patients/${patientId}/`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo paciente por ID:', error);
    throw error;
  }
};
