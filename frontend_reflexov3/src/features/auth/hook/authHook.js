import {
  login as LoginService,
  logOut as LogOutService,
  validateCode as validateCodeService,
  changePassword as changePasswordService,
  sendVerifyCode as sendVerifyCodeService,
} from '../service/authService';
import { useNavigate } from 'react-router';
import { useState } from 'react';
import { useToast } from '../../../services/toastify/ToastContext';
import {
  getLocalStorage,
  persistLocalStorage,
  removeLocalStorage,
} from '../../../utils/localStorageUtility';
import { useAuth as useAuthentication } from '../../../routes/AuthContext';
import { useUser } from '../../../context/UserContext';
import { useCompany } from '../../../context/CompanyContext';

export const useAuthActions = () => {
  const { showToast } = useToast();
  const { setIsAuthenticated, fetchUserRole } = useAuthentication();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { refetchPhoto, refetchProfile } = useUser();
  const { refetchCompanyLogo, refetchCompanyInfo } = useCompany();


  const login = async (credentials) => {
    setLoading(true);
    try {
      const loginData = await LoginService(credentials);

      if (loginData.status === 200 && loginData.data) {
        // Guardar los tokens y datos del usuario de la nueva API
        const { access, refresh, user_id, email } = loginData.data;
        
        // Guardar tokens en localStorage
        persistLocalStorage('token', access);
        persistLocalStorage('refresh_token', refresh);
        persistLocalStorage('user_id', user_id);
        persistLocalStorage('email', email);
        
        // Establecer autenticación
        setIsAuthenticated(true);
        
        // Obtener el rol del usuario
        const roleFetched = await fetchUserRole();
        if (roleFetched) {
          // Navegar al inicio solo si se obtuvo el rol correctamente
          navigate('/Inicio');
          showToast('inicioSesionExitoso');

          // Refrescar datos del usuario y empresa
          (async () => {
            await refetchPhoto();
            await refetchCompanyLogo();
            await refetchProfile();
            await refetchCompanyInfo();
          })();
        } else {
          // Si no se pudo obtener el rol, limpiar autenticación
          setIsAuthenticated(false);
          removeLocalStorage('token');
          removeLocalStorage('refresh_token');
          removeLocalStorage('user_id');
          removeLocalStorage('email');
        }
      }
    } catch (error) {
      const backendMsg = error?.response?.data?.message || null;
      showToast('intentoFallido', backendMsg);
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    try {
      await LogOutService();
      showToast('cierreSesion');
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      removeLocalStorage('token');
      removeLocalStorage('refresh_token');
      removeLocalStorage('user_id');
      removeLocalStorage('email');
      removeLocalStorage('name');
      removeLocalStorage('user_role');
      setIsAuthenticated(false);
      navigate('/');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const validateCode = async (code) => {
    try {
      const data = await validateCodeService(code, getLocalStorage('user_id'));
      // El backend responde con { valid: true/false, message: ... }
      if (data.data?.valid) {
        showToast('codigoVerificado');
        persistLocalStorage('token', data.data.token);
        navigate('/cambiarContraseña');
      } else {
        showToast('intentoFallido', data.data?.message || 'Código incorrecto');
        // No navega ni permite avanzar
      }
    } catch (error) {
      const backendMsg = error?.response?.data?.message || null;
      showToast('intentoFallido', backendMsg);
    }
  };

  const changePassword = async (data) => {
    try {
      const response = await changePasswordService(data);
      if (response.status == '200') {
        showToast('contraseñaCambiada');
        // Después de cambiar contraseña, redirigir al inicio
        setIsAuthenticated(true);
        navigate('/Inicio');
        (async () => {
          await refetchPhoto();
          await refetchCompanyLogo();
          await refetchProfile();
          await refetchCompanyInfo();
        })();
      } else {
        showToast('intentoFallido');
      }
    } catch (error) {
      const backendMsg = error?.response?.data?.message || null;
      showToast('intentoFallido', backendMsg);
    }
  };

  const sendVerifyCode = async () => {
    try {
      const response = await sendVerifyCodeService(getLocalStorage('user_id'));
      if (response.status == '200') {
        showToast('codigoEnviado');
      } else {
        showToast('intentoFallido');
      }
    } catch (error) {
      const backendMsg = error?.response?.data?.message || null;
      showToast('intentoFallido', backendMsg);
    }
  };

  return {
    login,
    loading,
    logOut,
    validateCode,
    changePassword,
    sendVerifyCode,
  };
};
