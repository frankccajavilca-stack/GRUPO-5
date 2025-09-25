import { get } from '../../../services/api/Axios/MethodsGeneral';
import { mockData } from '../../../mock/mockData';

export const fetchStatisticData = async (start, end) => {
  try {
    // Validar que las fechas sean válidas
    if (!start || !end) {
      throw new Error('Las fechas de inicio y fin son requeridas');
    }

    // Construir la URL con los parámetros de fecha
    const startDate = start.format('YYYY-MM-DD');
    const endDate = end.format('YYYY-MM-DD');
    const url = `company/reports/statistics/?start=${startDate}&end=${endDate}`;
    
    console.log('Obteniendo estadísticas desde:', url);
    
    const response = await get(url);
    
    console.log('Respuesta de estadísticas:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching statistics data:', error);
    
    // Asignar mockData a la forma de API esperada utilizada por useStatistic.js
    const large = mockData?.large || {};
    const paymentTypes = large.paymentTypes || {};
    const patientTypes = large.patientTypes || { c: 0, cc: 0 };
    const categories = large.categories || [];
    const chartSeries = large.chartSeries?.[0]?.data || [];
    const monthlySessions = large.monthlySessions?.[0]?.data || [];
    const therapists = Array.isArray(large.therapistPerformance)
      ? large.therapistPerformance
      : [];

    // Construir objeto sesiones a partir de chartSeries sobre categorías si están disponibles
    const sesiones = {};
    if (categories.length && chartSeries.length) {
      categories.forEach((cat, idx) => {
        sesiones[cat] = Number(chartSeries[idx] || 0);
      });
    } else {
      // Días predeterminados en inglés para que coincidan con el mapeo en useStatistic.js
      ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(
        (d) => (sesiones[d] = 0),
      );
    }

    // Construir objeto de ingresos (ingresos mensuales)
    const ingresos = {};
    if (categories.length && monthlySessions.length) {
      categories.forEach((cat, idx) => {
        ingresos[cat] = Number(monthlySessions[idx] || 0);
      });
    }

    // Construir terapeutas array en la forma esperada
    const terapeutas = therapists.map((t, i) => ({
      id: t.id ?? i + 1,
      terapeuta: t.name || `Terapeuta ${i + 1}`,
      sesiones: Array.isArray(t.data) ? Number(t.data[0] || 0) : 0,
      ingresos: Array.isArray(t.data) ? Number(t.data[0] || 0) * 100 : 0,
      raiting: 4.0,
    }));

    // Totales
    const ttlpacientes = Number(patientTypes.cc || 0) + Number(patientTypes.c || 0);
    const ttlganancias = Object.values(ingresos).reduce((a, b) => a + Number(b || 0), 0);

    return {
      data: {
        sesiones,
        ingresos,
        metricas: {
          ttlpacientes,
          ttlganancias,
        },
        terapeutas,
        tipos_pago: paymentTypes,
        tipos_pacientes: patientTypes,
      },
    };
  }
};

// Función adicional para obtener estadísticas con parámetros específicos
export const fetchStatisticDataWithParams = async (startDate, endDate, additionalParams = {}) => {
  try {
    // Validar que las fechas sean válidas
    if (!startDate || !endDate) {
      throw new Error('Las fechas de inicio y fin son requeridas');
    }

    // Construir la URL base
    let url = `company/reports/statistics/?start=${startDate}&end=${endDate}`;
    
    // Agregar parámetros adicionales si existen
    Object.keys(additionalParams).forEach(key => {
      if (additionalParams[key] !== null && additionalParams[key] !== undefined) {
        url += `&${key}=${additionalParams[key]}`;
      }
    });
    
    console.log('Obteniendo estadísticas con parámetros desde:', url);
    
    const response = await get(url);
    
    console.log('Respuesta de estadísticas con parámetros:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching statistics data with params:', error);
    throw error;
  }
};

// Función para obtener estadísticas de un rango específico
export const fetchStatisticDataByRange = async (start, end) => {
  // Esta función es un alias para mantener compatibilidad
  return fetchStatisticData(start, end);
};
