// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import {
  getLocalStorage,
  persistLocalStorage,
} from '../utils/localStorageUtility';
import { get } from '../services/api/Axios/MethodsGeneral';
import { useToast } from '../services/toastify/ToastContext';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const { showToast } = useToast();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [roleName, setRoleName] = useState(null);

  // Función para obtener el rol desde el backend
  const fetchUserRole = async () => {
    try {
      const res = await get('architect/roles/');
      if (res.data) {
        // La respuesta es un array con el rol del usuario
        const userRoleData = res.data[0];
        if (userRoleData) {
          setUserRole(userRoleData.id);
          setRoleName(userRoleData.name);
          persistLocalStorage('user_role', userRoleData.id);
          persistLocalStorage('role_name', userRoleData.name);
          persistLocalStorage('user_id', userRoleData.user_id);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Error fetching user role:', err);
      showToast('intentoFallido', 'No se pudo obtener la información del usuario.');
      return false;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = getLocalStorage('token');
      const refreshToken = getLocalStorage('refresh_token');
      const userId = getLocalStorage('user_id');
      
      if (token && refreshToken && userId) {
        setIsAuthenticated(true);
        
        // Cargar el nombre del rol desde localStorage si existe
        const savedRoleName = getLocalStorage('role_name');
        if (savedRoleName) {
          setRoleName(savedRoleName);
        }
        
        // Obtener el rol del usuario
        const roleFetched = await fetchUserRole();
        if (!roleFetched) {
          // Si no se pudo obtener el rol, limpiar autenticación
          setIsAuthenticated(false);
        }
        
        // Si hay datos del usuario guardados, los restauramos
        const email = getLocalStorage('email');
        if (email) {
          persistLocalStorage('email', email);
        }
      }
      
      setAuthChecked(true);
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        authChecked,
        userRole,
        roleName,
        setUserRole,
        setRoleName,
        setIsAuthenticated,
        fetchUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
