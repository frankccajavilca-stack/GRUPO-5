import {
  get,
  put,
  post,
  patch,
} from '../../../../services/api/Axios/MethodsGeneral';
import instance from '../../../../services/api/Axios/baseConfig';

// Cache para peticiones - Evita hacer peticiones repetidas en 5 minutos
const apiCache = new Map();

const cachedRequest = async (key, requestFn) => {
  const now = Date.now();

  // Verificar si existe en caché y no ha expirado (5 minutos)
  if (apiCache.has(key)) {
    const { data, timestamp } = apiCache.get(key);
    if (now - timestamp < 300000) {
      // 5 minutos
      return data;
    }
  }

  // Hacer la petición real
  const response = await requestFn();
  apiCache.set(key, {
    data: response.data,
    timestamp: now,
  });

  return response.data;
};

// PETICIÓN 1: Enviar código de verificación por email
export const createPatient = async (data) => {
  try {
    const response = await post('sendVerifyCode', data);
    return response.data;
  } catch (error) {
    console.error('Error en enviar correo:', error);
    throw error;
  }
};

// PETICIÓN 2: Verificar código de verificación enviado por email
export const verifyCode = async (code) => {
  try {
    const response = await post('verification', { code });
    return response.data;
  } catch (error) {
    console.error('Error en verificación de código:', error);
    throw error;
  }
};

// PETICIÓN 3: Actualizar solo el email del perfil (después de verificar código)
export const updateProfileEmail = async (email) => {
  try {
    const response = await patch('profiles/users/me/update/', { email });
    // Invalidar caché del perfil
    apiCache.delete('profiles/users/me/');
    return response.data;
  } catch (error) {
    console.error('Error al actualizar el correo:', error);
    throw error;
  }
};

// PETICIÓN 4: Obtener datos completos del perfil del usuario (con caché de 5 min)
export const getProfile = async () => {
  try {
    const response = await cachedRequest('profiles/users/me/', () => get('profiles/users/me/'));
    
    // Manejar la nueva estructura donde full_name es un objeto
    if (response && response.full_name && typeof response.full_name === 'object') {
      response.full_name = `${response.full_name.name || ''} ${response.full_name.paternal_lastname || ''} ${response.full_name.maternal_lastname || ''}`.trim();
    }
    
    return response;
  } catch (error) {
    console.error('Error in getProfile:', error);
    throw error;
  }
};

// PETICIÓN 5: Actualizar datos básicos del perfil (nombre, apellidos, género, teléfono)
export const updateAllProfile = async (data) => {
  try {
    // Filtrar campos que no deben ser actualizados aquí (correo/contraseñas)
    const {
      email,
      password,
      current_password,
      new_password,
      confirm_password,
      ...allowedData
    } = data || {};

    console.log('Intentando actualizar perfil con PUT:', allowedData);
    
    // Crear FormData en lugar de enviar JSON
    const formData = new FormData();
    
    // Agregar cada campo al FormData
    Object.keys(allowedData).forEach(key => {
      const value = allowedData[key];
      console.log(`Agregando campo ${key}:`, value, typeof value);
      
      if (value !== null && value !== undefined) {
        // Si es photo_url y está vacío, NO enviarlo (omitir el campo)
        if (key === 'photo_url' && (value === '' || value === null)) {
          console.log('Omitiendo photo_url vacío');
          return; // No agregar este campo al FormData
        }
        formData.append(key, value);
      }
    });
    
    // Log para verificar el FormData
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }
    
    // Usar PUT para actualizar datos básicos del perfil
    const res = await instance.put('profiles/users/me/update/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Invalidar caché del perfil
    apiCache.delete('profiles/users/me/');
    return res.data;
  } catch (error) {
    console.error('Error in updateAllProfile:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

export const validatePassword = async (data) => {
  try {
    const res = await post('validate-password', data);
    return res.data;
  } catch (error) {
    console.error('Error in validatePassword:', error);
    throw error;
  }
};

export const changePassword = async (data) => {
  try {
    const res = await put('change-password', data);
    return res.data;
  } catch (error) {
    console.error('Error in changePassword:', error);
    throw error;
  }
};

//CONSEGUIR LA FOTO DE PERFIL -> (GET)
export const getUserPhoto = async () => {
  try {
    // El backend expone la URL de la foto dentro del perfil del usuario
    const profileResponse = await get('profiles/users/me/');
    const photoUrl = profileResponse.data?.profile_photo_url || null;
    return photoUrl;
  } catch (error) {
    console.error('Error fetching user photo:', error);
    throw error;
  }
}

//ACTUALIZAR LA FOTO DE PERFIL -> (POST con Content-Type explícito)
export const uploadProfilePhoto = async (file) => {
  try {
    // Primero obtener la URL actual de la foto del perfil
    let currentPhotoUrl = '';
    try {
      const profileResponse = await get('profiles/users/me/');
      currentPhotoUrl = profileResponse.data?.profile_photo_url || '';
      console.log('URL actual de la foto:', currentPhotoUrl);
    } catch (error) {
      console.log('No se pudo obtener la URL actual, usando cadena vacía');
      currentPhotoUrl = '';
    }

    const formData = new FormData();
    
    // Enviar tanto el archivo como la URL actual
    formData.append('profile_photo', file);
    formData.append('photo_url', currentPhotoUrl || 'null'); // URL actual o 'null' si está vacía
    
    console.log('Subiendo foto con FormData (archivo + URL actual):');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    // Usar POST (como indica la documentación) pero con Content-Type explícito
    const response = await instance.post('profiles/users/me/photo/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Invalidar caché relacionada al perfil
    apiCache.delete('profiles/users/me/');

    return response.data;
  } catch (error) {
    console.error('Error subiendo avatar:', error.response?.data || error.message);
    throw error;
  }
}