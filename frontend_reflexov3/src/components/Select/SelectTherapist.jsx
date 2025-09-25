import { Select } from 'antd';
import { useEffect, useState } from 'react';
import { getStaff } from '../../features/staff/service/staffService';

export function SelectTherapist({ value, onChange, ...rest }) {
  const [options, setOptions] = useState([]);
  const [internalValue, setInternalValue] = useState(value);

  // Cargar opciones de terapeutas
  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        const response = await getStaff();
        const formattedOptions = response.data.map((therapist) => ({
          label: <span style={{ color: '#fff' }}>{therapist.full_name}</span>,
          value: therapist.id,
        }));
        setOptions(formattedOptions);
      } catch (error) {
        console.error('Error al obtener los terapeutas:', error);
        setOptions([]);
      }
    };
    fetchTherapists();
  }, []);

  // Sincronizar el valor y manejar el caso de "0"
  useEffect(() => {
    if (value === 0 || value === null || value === undefined) {
      setInternalValue(null); // Establece null para que se muestre el placeholder
    } else {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = (val) => {
    setInternalValue(val);
    if (onChange) onChange(val);
  };

  return (
    <Select
      {...rest}
      value={internalValue}
      onChange={handleChange}
      showSearch
      filterOption={(input, option) =>
        (option?.label?.props?.children ?? '')
          .toLowerCase()
          .includes(input.toLowerCase())
      }
      placeholder="Seleccionar terapeuta"
      options={options}
      style={{
        width: '100%',
      }}
      allowClear
    />
  );
}

export default SelectTherapist;
