import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getSystemInfo,
  updateSystemaInfo,
  updateCompanyLogo,
  deleteCompanyLogo,
  createCompany,
} from '../services/systemServices';
import { persistLocalStorage } from '../../../../utils/localStorageUtility';
import { useToast } from '../../../../services/toastify/ToastContext';
import { formatToastMessage } from '../../../../utils/messageFormatter';

//CONSIGUE EL LOGO (función vacía ya que show_logo no funciona)
export const useSystemHook = (companyId) => {
  const [logoUrl, setLogoUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    // Función vacía ya que show_logo no funciona
    setLogoUrl(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    logoUrl,
    loading,
    error,
    refetch,
  };
};

//ACTUALIZA EL LOGO
export const useUploadCompanyLogo = () => {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const { showToast } = useToast();

  const uploadLogo = async (file) => {
    setUploadingLogo(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      // Usar el servicio original que ya funcionaba
      const response = await updateCompanyLogo(file);
      setUploadSuccess(true);
      showToast(
        'imageUploadSuccess',
        response.message || 'Logo actualizado correctamente',
      );
    } catch (err) {
      setUploadError(err);
      const errorMessage = err.response?.data?.company_logo?.[0] || 
                          err.response?.data?.error || 
                          err.response?.data?.message ||
                          'Error al subir el logo';
      showToast('error', errorMessage);
    } finally {
      setUploadingLogo(false);
    }
  };

  return { uploadLogo, uploadingLogo, uploadError, uploadSuccess };
};

//CONSIGUE LOS DATOS DE LA EMPRESA
export const useCompanyInfo = () => {
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);

  const fetchCompanyInfo = async () => {
    setLoadingInfo(true);
    setErrorInfo(null);

    try {
      const data = await getSystemInfo();
      setCompanyInfo(data); // Ahora data ya es el objeto de la empresa directamente

      //  Guardamos también en localStorage
      if (data?.company_name) {
        persistLocalStorage('company_name', data.company_name);
      }
    } catch (err) {
      setErrorInfo(err);
      console.error('Error fetching company info:', err);
    } finally {
      setLoadingInfo(false);
    }
  };

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  return {
    companyInfo,
    loadingInfo,
    errorInfo,
    refetchCompanyInfo: fetchCompanyInfo,
  };
};

//ACTUALIZA LOS DATOS DE LA EMPRESA
export const useUpdateCompanyInfo = () => {
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const { showToast } = useToast();

  const updateCompany = async (newData) => {
    setUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      // Usar el servicio original que ya funcionaba
      const response = await updateSystemaInfo(newData);
      setUpdateSuccess(true);
      showToast('datoGuardado');
      if (newData?.company_name) {
        persistLocalStorage('company_name', newData.company_name);
      }
      return response;
    } catch (error) {
      setUpdateError(error);
      const errorMessage = error.response?.data?.company_name?.[0] || 
                          error.response?.data?.message ||
                          'Error al actualizar la información';
      showToast('error', errorMessage);
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  return {
    updateCompany,
    updating,
    updateError,
    updateSuccess,
  };
};

