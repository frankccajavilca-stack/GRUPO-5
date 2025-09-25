import axios from 'axios';
import {
  get,
  post,
  put,
  del,
} from '../../../services/api/Axios/MethodsGeneral';

export const getPayments = async () => {
  try {
    const res = await get(`configurations/payment_types/`);
    return res.data;
  } catch (error) {
    console.error('Error en getPayments:', error);
    throw error;
  }
};

export const getPrices = async () => {
  try {
    const res = await get(`configurations/predetermined_prices/`);
    return res.data;
  } catch (error) {
    console.error('Error en getPrices:', error);
    throw error;
  }
};

export const createPaymentType = async (data) => {
  try {
    const res = await post(`configurations/payment_types/create/`, data);
    return res.data;
  } catch (error) {
    console.error('Error en createPaymentType:', error);
    throw error;
  }
};

export const updatePaymentType = async (id, data) => {
  try {
    const res = await put(`configurations/payment_types/${id}/edit/`, data);
    return res.data;
  } catch (error) {
    console.error('Error en updatePaymentType:', error);
    throw error;
  }
};

export const deletePaymentType = async (id) => {
  try {
    const res = await del(`configurations/payment_types/${id}/delete/`);
    return res.data;
  } catch (error) {
    console.error('Error en deletePaymentType:', error);
    throw error;
  }
};

export const createPrice = async (data) => {
  try {
    const res = await post(`configurations/predetermined_prices/create/`, data);
    return res.data;
  } catch (error) {
    console.error('Error en createPrice:', error);
    throw error;
  }
};

export const updatePrice = async (id, data) => {
  try {
    const res = await put(`configurations/predetermined_prices/${id}/edit/`, data);
    return res.data;
  } catch (error) {
    console.error('Error en updatePrice:', error);
    throw error;
  }
};

export const deletePrice = async (id) => {
  try {
    const res = await del(`configurations/predetermined_prices/${id}/delete/`);
    return res.data;
  } catch (error) {
    console.error('Error en deletePrice:', error);
    throw error;
  }
};
