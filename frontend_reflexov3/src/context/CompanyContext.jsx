import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from 'react';
import {
  getSystemInfo,
} from '../features/configuration/cSystem/services/systemServices';
import {
  persistLocalStorage,
  getLocalStorage,
} from '../utils/localStorageUtility';

const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
  const [companyInfo, setCompanyInfo] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetchCompanyInfo = useCallback(async () => {
    try {
      setError(null);
      const response = await getSystemInfo();
      // La respuesta viene directamente como el objeto de la empresa
      setCompanyInfo(response);
      // Usar logo_url directamente de la respuesta
      setLogoUrl(response?.logo_url || null);
      if (response?.company_name) {
        persistLocalStorage('company_name', response.company_name);
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
      setError(error);
      setCompanyInfo(null);
      setLogoUrl(null);
    }
  }, []);

  // Función para forzar la recarga de datos (útil para después del login)
  const forceReload = useCallback(async () => {
    const token = getLocalStorage('token');
    if (token) {
      setLoading(true);
      await refetchCompanyInfo();
      setLoading(false);
    }
  }, [refetchCompanyInfo]);


  // Efecto principal para cargar datos de la empresa
  useEffect(() => {
    const loadCompanyData = async () => {
      const token = getLocalStorage('token');
      if (token) {
        setLoading(true);
        await refetchCompanyInfo();
        setLoading(false);
      } else {
        // Si no hay token, limpiar los datos
        setCompanyInfo(null);
        setLogoUrl(null);
        setError(null);
        setLoading(false);
      }
    };

    loadCompanyData();
  }, []); // Solo se ejecuta al montar el componente

  // Efecto para detectar cambios en el token y recargar datos
  useEffect(() => {
    const checkTokenAndLoad = () => {
      const token = getLocalStorage('token');
      const hasToken = !!token;
      const hasData = !!companyInfo;
      
      if (hasToken && !hasData && !loading) {
        // Hay token pero no hay datos y no está cargando - cargar datos
        setLoading(true);
        refetchCompanyInfo().finally(() => {
          setLoading(false);
        });
      } else if (!hasToken && hasData) {
        // No hay token pero hay datos - limpiar datos
        setCompanyInfo(null);
        setLogoUrl(null);
        setError(null);
        setLoading(false);
      }
    };

    // Verificar inmediatamente
    checkTokenAndLoad();

    // Verificar periódicamente para detectar cambios
    const interval = setInterval(checkTokenAndLoad, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [companyInfo, loading, refetchCompanyInfo]);

  const value = {
    companyInfo,
    logoUrl,
    loading,
    error,
    refetchCompanyInfo,
    forceReload,
  };

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
