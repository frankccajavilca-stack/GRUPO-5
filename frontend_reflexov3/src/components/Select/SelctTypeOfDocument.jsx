import { Select } from 'antd';
import { useEffect, useState, useCallback } from 'react';
import { getDocumentTypes } from './SelectsApi';

export function SelectTypeOfDocument({ value, onChange, ...rest }) {
  const [options, setOptions] = useState([]);
  const [internalValue, setInternalValue] = useState(value);
  const [loading, setLoading] = useState(false);
  const [displayLabel, setDisplayLabel] = useState(undefined);

  // Cargar opciones con caché
  useEffect(() => {
    const fetchDocumentTypes = async () => {
      setLoading(true);
      try {
        const data = await getDocumentTypes();
        const formattedOptions = data.map((item) => ({
          label: item.label || item.name,
          value: String(item.value),
        }));

        setOptions(formattedOptions);
      } catch (error) {
        console.error('Error al obtener tipos de documento:', error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDocumentTypes();
  }, []);

  // Sincronizar value cuando cambian las opciones o el value externo
  useEffect(() => {
    if (value !== undefined && value !== null) {
      // Si las opciones ya están cargadas y el value existe en ellas, sincroniza
      if (
        options.length > 0 &&
        options.some((opt) => String(opt.value) === String(value))
      ) {
        setInternalValue(String(value));
        const opt = options.find((o) => String(o.value) === String(value));
        setDisplayLabel(opt?.label ?? String(value));
      } else if (options.length === 0) {
        // Si aún no hay opciones, guarda el value para sincronizarlo después
        setInternalValue(String(value));
        setDisplayLabel(undefined);
      }
    } else {
      setInternalValue(undefined);
      setDisplayLabel(undefined);
    }
  }, [value, options]);

  const handleChange = useCallback(
    (val) => {
      setInternalValue(val);
      if (onChange) onChange(val);
    },
    [onChange],
  );

  const filterOption = useCallback((input, option) => {
    const text = String(option?.label ?? '');
    return text.toLowerCase().includes(input.toLowerCase());
  }, []);

  return (
    <Select
      {...rest}
      labelInValue
      value={
        internalValue !== undefined && internalValue !== null
          ? { value: internalValue, label: displayLabel || internalValue }
          : undefined
      }
      onChange={(obj) => handleChange(obj?.value)}
      showSearch
      filterOption={filterOption}
      optionLabelProp="label"
      placeholder="Tipo de documento"
      options={options}
      loading={loading}
      style={{
        width: '100%',
      }}
    />
  );
}

export default SelectTypeOfDocument;
