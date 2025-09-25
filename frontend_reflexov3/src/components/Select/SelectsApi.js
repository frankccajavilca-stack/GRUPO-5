import { get } from '../../services/api/Axios/MethodsGeneral';

// Cache global para optimizar las llamadas a la API
const apiCache = {
  countries: null,
  regions: null,
  provinces: {},
  districts: {},
  documentTypes: null,
  paymentStatuses: null,
  predeterminedPrices: null,
};

// Función para limpiar el caché
export const clearApiCache = () => {
  Object.keys(apiCache).forEach((key) => {
    if (typeof apiCache[key] === 'object' && apiCache[key] !== null) {
      if (Array.isArray(apiCache[key])) {
        apiCache[key] = null;
      } else {
        apiCache[key] = {};
      }
    }
  });
};

// Servicios para selects de ubicación
export const getCountries = async () => {
  if (apiCache.countries) {
    return apiCache.countries;
  }

  const response = await get('ubigeo/countries');
  const data = response.data || [];
  apiCache.countries = data;
  return data;
};

export const getDepartaments = async () => {
  if (apiCache.regions) {
    return apiCache.regions;
  }

  const response = await get('locations/regions/');
  const data = response.data?.results || [];
  apiCache.regions = data;
  return data;
};

export const getProvinces = async (departamentId) => {
  if (apiCache.provinces[departamentId]) {
    return apiCache.provinces[departamentId];
  }

  const response = await get(`locations/provinces/?region=${departamentId}`);
  const data = response.data?.results || [];
  apiCache.provinces[departamentId] = data;
  return data;
};

export const getDistricts = async (provinceId) => {
  if (apiCache.districts[provinceId]) {
    return apiCache.districts[provinceId];
  }

  const response = await get(`locations/districts/?province=${provinceId}`);
  // Soportar ambas estructuras: array directo o { results: [] }
  const data = Array.isArray(response.data)
    ? response.data
    : response.data?.results || [];
  apiCache.districts[provinceId] = data;
  return data;
};

// Servicios para selects de documentos
export const getDocumentTypes = async () => {
  if (apiCache.documentTypes) {
    return apiCache.documentTypes;
  }

  const response = await get('configurations/document_types/'); // Endpoint actualizado
  const data =
    response.data?.document_types
      ?.filter((item) => !item.deleted_at) // Filtrar elementos eliminados
      ?.map((item) => ({
        value: item.id,
        label: item.name,
        description: item.description, // Opcional: para tooltips o info adicional
      })) || [];

  apiCache.documentTypes = data;
  return data;
};

// Servicios para estados de pago
export const getPaymentStatuses = async () => {
  if (apiCache.paymentStatuses) {
    return apiCache.paymentStatuses;
  }

  const response = await get('configurations/payment_types/'); // Endpoint actualizado
  const data =
    response.data?.payment_types
      ?.filter((item) => !item.deleted_at) // Filtrar elementos eliminados
      ?.map((item) => ({
        value: item.id,
        label: item.name,
      })) || [];

  apiCache.paymentStatuses = data;
  return data;
};

// Servicios para precios predeterminados
export const getPredeterminedPrices = async () => {
  if (apiCache.predeterminedPrices) {
    return apiCache.predeterminedPrices;
  }

  const response = await get('configurations/predetermined_prices/');
  const data =
    response.data?.predetermined_prices?.map((item) => ({
      value: item.id,
      label: `${item.name} (S/ ${item.price})`, // Nombre del precio (S/ precio)
      price: item.price,
      name: item.name,
    })) || [];

  apiCache.predeterminedPrices = data;
  return data;
};

