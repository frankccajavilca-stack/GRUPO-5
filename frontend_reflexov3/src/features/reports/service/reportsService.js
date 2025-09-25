import { get } from '../../../services/api/Axios/MethodsGeneral';

export const getAppointmentsforTherapist = async (date) => {
  try {
    const res = await get(`company/reports/appointments-per-therapist/?date=${date}`);
    return res.data;
  } catch (error) {
    console.error('Error en getAppointmentsforTherapist:', error);
    throw error;
  }
};

export const getPatientsByTherapist = async (date) => {
  try {
    const res = await get(`company/reports/patients-by-therapist/?date=${date}`);
    return res.data;
  } catch (error) {
    console.error('Error en getPatientsByTherapist:', error);
    throw error;
  }
};

export const getDailyCash = async (date) => {
  try {
    const res = await get(`company/reports/improved-daily-cash/?date=${date}`);
    return res.data;
  } catch (error) {
    console.error('Error en getDailyCash:', error);
    throw error;
  }
};

export const getAppointmentsBetweenDates = async (startDate, endDate) => {
  try {
    const res = await get(
      `company/reports/appointments-between-dates/?startDate=${startDate}&endDate=${endDate}`,
    );
    return res.data;
  } catch (error) {
    console.error('Error en getAppointmentsBetweenDates:', error);
    throw error;
  }
};
