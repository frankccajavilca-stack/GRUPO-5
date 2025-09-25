import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from 'react';
import {
  getProfile,
  getUserPhoto,
} from '../features/configuration/cProfile/service/profileService';
import {
  persistLocalStorage,
  getLocalStorage,
} from '../utils/localStorageUtility';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetchProfile = useCallback(async (force = false) => {
    try {
      setError(null);
      const profileData = await getProfile();
      setProfile(profileData);
      
      // Manejar full_name que puede ser string o objeto
      let fullName = profileData?.full_name;
      if (typeof fullName === 'object' && fullName !== null) {
        fullName = `${fullName.name || ''} ${fullName.paternal_lastname || ''} ${fullName.maternal_lastname || ''}`.trim();
      }
      
      // Persistir datos en localStorage
      persistLocalStorage('user_full_name', fullName);
      persistLocalStorage('user_name', profileData?.name);
      persistLocalStorage('user_email', profileData?.email);
      
      console.log('Perfil actualizado en contexto:', profileData);
    } catch (error) {
      console.error('Error fetching user profile for context', error);
      setError(error);
      // Limpiar datos en caso de error
      setProfile(null);
      persistLocalStorage('user_full_name', '');
      persistLocalStorage('user_name', '');
      persistLocalStorage('user_email', '');
    }
  }, []);

  const refetchPhoto = useCallback(async () => {
    try {
      setError(null);
      const photoDataUrl = await getUserPhoto();
      setPhotoUrl(photoDataUrl);
      console.log('Foto actualizada en contexto:', photoDataUrl);
    } catch (photoError) {
      console.error('Error fetching user photo for context', photoError);
      setPhotoUrl(null);
      // No establecer error aquí ya que la foto no es crítica
    }
  }, []);

  const refetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([refetchProfile(), refetchPhoto()]);
    } catch (error) {
      console.error('Error refetching all user data', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [refetchProfile, refetchPhoto]);

  // Función para limpiar el contexto
  const clearUserData = useCallback(() => {
    setProfile(null);
    setPhotoUrl(null);
    setError(null);
    setLoading(false);
    
    // Limpiar localStorage
    persistLocalStorage('user_full_name', '');
    persistLocalStorage('user_name', '');
    persistLocalStorage('user_email', '');
  }, []);

  useEffect(() => {
    const token = getLocalStorage('token');
    if (token) {
      refetchAll();
    } else {
      // Si no hay token, limpiar datos
      clearUserData();
    }
  }, [refetchAll, clearUserData]);

  // Detectar cambios en el token y recargar datos
  useEffect(() => {
    const checkToken = () => {
      const token = getLocalStorage('token');
      if (!token && profile) {
        // Token removido, limpiar datos
        clearUserData();
      } else if (token && !profile && !loading) {
        // Token agregado, cargar datos
        refetchAll();
      }
    };

    // Verificar cada segundo si el token cambió
    const interval = setInterval(checkToken, 1000);
    return () => clearInterval(interval);
  }, [profile, loading, clearUserData, refetchAll]);

  const value = {
    profile,
    userName: profile?.name,
    userEmail: profile?.email,
    fullName: profile?.full_name,
    photoUrl,
    loading,
    error,
    refetchProfile,
    refetchPhoto,
    refetchAll,
    clearUserData,
    // Helpers útiles
    isAuthenticated: !!profile,
    hasPhoto: !!photoUrl,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
