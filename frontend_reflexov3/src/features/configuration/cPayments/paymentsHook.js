import { useEffect, useState } from 'react';
import {
  getPayments,
  getPrices,
  createPaymentType,
  updatePaymentType,
  deletePaymentType,
  createPrice,
  updatePrice,
  deletePrice,
} from './paymentsServices';
import { useToast } from '../../../services/toastify/ToastContext'; // Ajusta la ruta según tu estructura

export const usePaymentTypes = () => {
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchPaymentTypes = async () => {
    try {
      setLoading(true);
      const response = await getPayments();
      // La API devuelve: {"payment_types": [{"id": 2, "name": "Efectivo"}]}
      const data = response.payment_types || [];
      const formatted = data.map((item) => ({
        id: item.id,
        name: item.name,
      }));
      setPaymentTypes(formatted);
    } catch (error) {
      console.error('Error al cargar tipos de pago:', error);
      showToast('error', 'Error al cargar los tipos de pago');
    } finally {
      setLoading(false);
    }
  };

  const addPaymentType = async (newPayment) => {
    try {
      await createPaymentType(newPayment);
      await fetchPaymentTypes();
      showToast('success', 'Tipo de pago creado correctamente');
    } catch (error) {
      console.error('Error al crear tipo de pago:', error);
      showToast(
        'error',
        error.response?.data?.message || 'Error al crear el tipo de pago',
      );
      throw error;
    }
  };

  const editPaymentType = async (id, updatedData) => {
    try {
      await updatePaymentType(id, updatedData);
      await fetchPaymentTypes();
      showToast('success', 'Tipo de pago actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar tipo de pago:', error);
      showToast(
        'error',
        error.response?.data?.message || 'Error al actualizar el tipo de pago',
      );
      throw error;
    }
  };

  const removePaymentType = async (id) => {
    try {
      await deletePaymentType(id);
      await fetchPaymentTypes();
      showToast('success', 'Tipo de pago eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar tipo de pago:', error);
      showToast(
        'error',
        error.response?.data?.message || 'Error al eliminar el tipo de pago',
      );
      throw error;
    }
  };

  useEffect(() => {
    fetchPaymentTypes();
  }, []);

  return {
    paymentTypes,
    loading,
    addPaymentType,
    editPaymentType,
    removePaymentType,
    refreshPaymentTypes: fetchPaymentTypes,
  };
};

export const usePrices = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const response = await getPrices();
      // La API devuelve: {"predetermined_prices": [{"id": 1, "name": "Cupon sin costo", "price": "50.00"}]}
      const data = response.predetermined_prices || [];
      const formatted = data.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
      }));
      setPrices(formatted);
    } catch (error) {
      console.error('Error al cargar precios:', error);
      showToast('error', 'Error al cargar los precios');
    } finally {
      setLoading(false);
    }
  };

  const addPrice = async (newPrice) => {
    try {
      await createPrice(newPrice);
      await fetchPrices();
      showToast('success', 'Precio creado correctamente');
    } catch (error) {
      console.error('Error al crear precio:', error);
      showToast(
        'error',
        error.response?.data?.message || 'Error al crear el precio',
      );
      throw error;
    }
  };

  const editPrice = async (id, updatedData) => {
    try {
      await updatePrice(id, updatedData);
      await fetchPrices();
      showToast('success', 'Precio actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar precio:', error);
      showToast(
        'error',
        error.response?.data?.message || 'Error al actualizar el precio',
      );
      throw error;
    }
  };

  const removePrice = async (id) => {
    try {
      await deletePrice(id);
      await fetchPrices();
      showToast('success', 'Precio eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar precio:', error);
      showToast(
        'error',
        error.response?.data?.message || 'Error al eliminar el precio',
      );
      throw error;
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  return {
    prices,
    loading,
    addPrice,
    editPrice,
    removePrice,
    refreshPrices: fetchPrices,
  };
};
