import dayjs from '../../../utils/dayjsConfig';
import { useEffect, useState } from 'react';
import {
  createPatient,
  deletePatient,
  getPatients,
  searchPatients,
  updatePatient,
} from '../service/patientsService';
import { useToast } from '../../../services/toastify/ToastContext';
import { formatToastMessage } from '../../../utils/messageFormatter';

export const usePatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalItems: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [initialLoad, setInitialLoad] = useState(false);
  const { showToast } = useToast();

  const loadPatients = async (page) => {
    if (loading) return;
    setLoading(true);
    try {
      const { data, total } = await getPatients(page);
      setPatients(data);
      setPagination({
        currentPage: page,
        totalItems: total,
      });
    } catch (error) {
      setError(error.message);
      showToast(
        'error',
        formatToastMessage(
          error.response?.data?.message,
          'Error al cargar pacientes',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  //================================================================================================
  const handleUpdatePatient = async (patientId, formData) => {
    try {
      const payload = {
        document_number: formData.document_number,
        paternal_lastname:
          formData.paternal_lastname || formData.paternal_lastName,
        maternal_lastname:
          formData.maternal_lastname || formData.maternal_lastName,
        name: formData.name,
        birth_date: formData.birth_date
          ? dayjs(formData.birth_date).format('YYYY-MM-DD')
          : null,
        sex: formData.sex,
        phone1: formData.primary_phone,
        email: formData.email || null,
        ocupation: formData.occupation || null,
        health_condition: formData.health_condition || 'No tiene problemas de salud',
        address: formData.address,
        document_type_id: formData.document_type_id,
      };

      // Solo agregar campos de ubicación si tienen valores válidos
      const regionId = formData.region_id || formData.ubicacion?.region_id;
      const provinceId = formData.province_id || formData.ubicacion?.province_id;
      const districtId = formData.district_id || formData.ubicacion?.district_id;

      if (regionId) payload.region_id = regionId;
      if (provinceId) payload.province_id = provinceId;
      if (districtId) payload.district_id = districtId;

      console.log('Payload de actualización enviado:', payload);
      console.log('phone1 en payload de actualización:', payload.phone1);
      const result = await updatePatient(patientId, payload);
      console.log('Resultado de la actualización:', result);
      showToast('actualizacionPaciente');
      // Recargar los datos actualizados
      if (searchTerm.trim()) {
        await searchPatientsByTerm(searchTerm.trim());
      } else {
        await loadPatients(pagination.currentPage);
      }
      return result;
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Respuesta del servidor:', error.response?.data);
      console.error('Status:', error.response?.status);
      
      // Manejo de errores consistente con la función de creación
      const errorData = error.response?.data;
      const hasValidationErrors = errorData && typeof errorData === 'object' && !errorData.errors;
      
      if (hasValidationErrors || (error.response?.data?.errors && Object.keys(error.response.data.errors).length > 0)) {
        const errorsToProcess = error.response.data.errors || error.response.data;
        const errorMessages = Object.entries(errorsToProcess)
          .map(([field, messages]) => {
            const messageArray = Array.isArray(messages) ? messages : [messages];
            
            // Mensajes personalizados para campos específicos
            if (field === 'email' && messageArray.some(msg => msg.includes('ya está registrado'))) {
              return 'El correo electrónico ya se encuentra registrado';
            }
            if (field === 'document_number' && messageArray.some(msg => msg.includes('ya está registrado'))) {
              return 'El número de documento ya se encuentra registrado';
            }
            if (field === 'health_condition' && messageArray.some(msg => msg.includes('required'))) {
              return 'La condición de salud es requerida';
            }
            
            return `${field}: ${messageArray.join(', ')}`;
          })
          .join('\n');
        
        showToast('error', errorMessages);
      } else {
        const serverMessage = error.response?.data?.message || error.response?.data?.detail;
        if (serverMessage) {
          showToast('error', serverMessage);
        } else {
          showToast('error', 'Error del servidor');
        }
      }
      console.error('Error actualizando paciente:', error);
      throw error;
    }
  };
  //==================================================================================================

  const searchPatientsByTerm = async (term) => {
    if (loading) return;
    setLoading(true);
    setIsSearching(true);
    try {
      console.log('=== BUSCANDO PACIENTES ===');
      console.log('Término de búsqueda:', term);
      const { data, total } = await searchPatients(term);
      console.log('Resultados de búsqueda:', data);
      console.log('Total encontrados:', total);
      setPatients(data);
      setPagination({
        currentPage: 1,
        totalItems: total,
      });
    } catch (error) {
      setError(error.message);
      showToast(
        'error',
        formatToastMessage(
          error.response?.data?.message,
          'Error al buscar pacientes',
        ),
      );
      console.error('Error al buscar pacientes:', error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const clearSearch = async () => {
    setSearchTerm('');
    setIsSearching(false);
    await loadPatients(1);
  };

  const handleDeletePatient = async (patientId) => {
    try {
      await deletePatient(patientId);
      showToast('eliminacionPaciente');
      // Actualización optimista del estado
      setPatients((prev) => prev.filter((p) => p.id !== patientId));
      setPagination((prev) => ({
        ...prev,
        totalItems: prev.totalItems - 1,
      }));

      // Recarga de datos para asegurar consistencia
      if (searchTerm.trim()) {
        await searchPatientsByTerm(searchTerm.trim());
      } else {
        await loadPatients(pagination.currentPage);
      }
    } catch (error) {
      showToast(
        'error',
        formatToastMessage(
          error.response?.data?.message,
          'Error eliminando paciente',
        ),
      );
      console.error('Error eliminando paciente:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (!initialLoad) {
      loadPatients(1);
      setInitialLoad(true);
    }
  }, [initialLoad]);

  useEffect(() => {
    if (!initialLoad) return;

    const delayDebounce = setTimeout(() => {
      if (searchTerm.trim()) {
        searchPatientsByTerm(searchTerm.trim());
      } else {
        loadPatients(1);
      }
    }, 1200);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, initialLoad]);

  const submitNewPatient = async (formData) => {
    const payload = {
      document_number: formData.document_number,
      paternal_lastname:
        formData.paternal_lastname || formData.paternal_lastName,
      maternal_lastname:
        formData.maternal_lastname || formData.maternal_lastName,
      name: formData.name,
      birth_date: formData.birth_date
        ? dayjs(formData.birth_date).format('YYYY-MM-DD')
        : null,
      sex: formData.sex,
      phone1: formData.primary_phone,
      email: formData.email || null,
      ocupation: formData.occupation || null,
      health_condition: 'No tiene problemas de salud', // Campo requerido por el servidor
      address: formData.address,
      document_type_id: formData.document_type_id,
    };

    // Los campos secondary_phone y personal_reference se han removido del formulario
    // health_condition se envía con valor por defecto ya que es requerido por el servidor

    // Solo agregar campos de ubicación si tienen valores válidos
    const regionId = formData.region_id || formData.ubicacion?.region_id;
    const provinceId = formData.province_id || formData.ubicacion?.province_id;
    const districtId = formData.district_id || formData.ubicacion?.district_id;

    if (regionId) payload.region_id = regionId;
    if (provinceId) payload.province_id = provinceId;
    if (districtId) payload.district_id = districtId;

    try {
      console.log('=== CREANDO PACIENTE ===');
      console.log('Payload enviado:', payload);
      console.log('phone1 en payload:', payload.phone1);
      const result = await createPatient(payload);
      console.log('Resultado de la creación:', result);
      console.log('primary_phone en resultado:', result.primary_phone);
      console.log('phone1 en resultado:', result.phone1);
      showToast('registroPaciente');
      await loadPatients(pagination.currentPage); // Recargar lista
      return result;
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Respuesta del servidor:', error.response?.data);
      console.error('Status:', error.response?.status);
      console.error('Headers:', error.response?.headers);
      
      // Debug: verificar la estructura de errores
      console.log('¿Tiene errors?', !!error.response?.data?.errors);
      console.log('Keys de errors:', error.response?.data?.errors ? Object.keys(error.response.data.errors) : 'No hay errors');
      console.log('Valor de errors:', error.response?.data?.errors);
      console.log('Keys de data:', error.response?.data ? Object.keys(error.response.data) : 'No hay data');
      
      // El servidor devuelve errores directamente en data, no en data.errors
      const errorData = error.response?.data;
      const hasValidationErrors = errorData && typeof errorData === 'object' && !errorData.errors;
      
      // Mostrar errores específicos de validación con mensajes personalizados
      if (hasValidationErrors || (error.response?.data?.errors && Object.keys(error.response.data.errors).length > 0)) {
        // Usar data.errors si existe, sino usar data directamente
        const errorsToProcess = error.response.data.errors || error.response.data;
        const errorMessages = Object.entries(errorsToProcess)
          .map(([field, messages]) => {
            const messageArray = Array.isArray(messages) ? messages : [messages];
            
            // Mensajes personalizados para campos específicos
            if (field === 'email' && messageArray.some(msg => msg.includes('ya está registrado'))) {
              return 'El correo electrónico ya se encuentra registrado';
            }
            if (field === 'document_number' && messageArray.some(msg => msg.includes('ya está registrado'))) {
              return 'El número de documento ya se encuentra registrado';
            }
            if (field === 'health_condition' && messageArray.some(msg => msg.includes('required'))) {
              return 'La condición de salud es requerida';
            }
            
            // Mensaje genérico para otros campos
            return `${field}: ${messageArray.join(', ')}`;
          })
          .join('\n');
        
        showToast('error', errorMessages);
      } else {
        // Solo mostrar "Error del servidor" si realmente no hay información específica
        const serverMessage = error.response?.data?.message || error.response?.data?.detail;
        if (serverMessage) {
          showToast('error', serverMessage);
        } else {
          showToast('error', 'Error del servidor');
        }
      }
      console.error('Error creando paciente:', error);
      throw error;
    }
  };

  return {
    patients,
    loading,
    submitNewPatient,
    handleUpdatePatient, // se añadio nueva funcion
    error,
    pagination,
    handlePageChange: loadPatients,
    setSearchTerm,
    handleDeletePatient,
    searchTerm,
    isSearching,
    clearSearch,
  };
};
