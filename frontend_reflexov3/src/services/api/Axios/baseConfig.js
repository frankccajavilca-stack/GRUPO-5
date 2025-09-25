import axios from 'axios';
import {
  getLocalStorage,
  removeLocalStorage,
  persistLocalStorage,
} from '../../../utils/localStorageUtility';

const BaseURL =
  'http://178.156.204.38/api/';

const instance = axios.create({
  baseURL: BaseURL,
});

// Variable para evitar múltiples llamadas de refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

const refreshTokenRequest = async () => {
  const refreshToken = getLocalStorage('refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await axios.post(`${BaseURL}architect/auth/token/refresh/`, {
      refresh: refreshToken
    });
    
    const { access } = response.data;
    persistLocalStorage('token', access);
    return access;
  } catch (error) {
    // Si el refresh token también expiró, cerrar sesión
    removeLocalStorage('token');
    removeLocalStorage('refresh_token');
    removeLocalStorage('user_id');
    removeLocalStorage('email');
    window.location.href = '/';
    throw error;
  }
};

instance.interceptors.request.use(
  (config) => {
    const token = getLocalStorage('token') || null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Solo intentar refresh token en errores 401 y si no es una petición de refresh
    if (
      error.response?.status === 401 && 
      !originalRequest._retry &&
      !originalRequest.url?.includes('token/refresh') &&
      window.location.pathname.includes('/Inicio')
    ) {
      if (isRefreshing) {
        // Si ya se está refrescando, agregar a la cola
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return instance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshTokenRequest();
        processQueue(null, newToken);
        
        // Reintentar la petición original con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return instance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Para otros errores 403 o cualquier otro error, manejar normalmente
    if (
      (error.response?.status === 403) &&
      window.location.pathname.includes('/Inicio')
    ) {
      removeLocalStorage('token');
      removeLocalStorage('refresh_token');
      removeLocalStorage('user_id');
      removeLocalStorage('email');
      window.location.href = '/error500';
    }

    return Promise.reject(error);
  },
);

export default instance;
