import { Descriptions, Avatar, Button } from 'antd';
import {
  UserOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import {
  getDepartaments,
  getProvinces,
  getDistricts,
} from '../../../../components/Select/SelectsApi';
import UniversalModal from '../../../../components/Modal/UniversalModal';
import { useTheme } from '../../../../context/ThemeContext';

const InfoPatient = ({ patient, open, onClose }) => {
  const { isDarkMode } = useTheme();
  
  if (!patient) return null;

  // Construir nombre completo
  const fullName =
    patient.full_name ||
    `${patient.paternal_lastname || ''} ${patient.maternal_lastname || ''} ${patient.name || ''}`.trim();

  // Debug temporal
  console.log('InfoPatient - patient data:', patient);
  console.log('InfoPatient - fullName:', fullName);
  console.log('InfoPatient - document:', patient.document_type?.name, patient.document_number);

  // Función para formatear la fecha de nacimiento
  const formatBirthDate = (dateString) => {
    if (!dateString) return 'No registrado';
    
    try {
      // Si viene en formato ISO (2007-02-03T00:00:00Z)
      const date = new Date(dateString);
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      // Formatear a DD/MM/YYYY
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha inválida';
    }
  };

  const formattedBirthDate = formatBirthDate(patient.birth_date);

  // Función para extraer el teléfono de manera robusta
  const getPhoneNumber = (patientData) => {
    const phoneFields = [
      'primary_phone',
      'phone1', 
      'phone2',
      'phone',
      'telefono',
      'celular',
      'mobile'
    ];
    
    for (const field of phoneFields) {
      if (patientData[field] && patientData[field] !== null && patientData[field] !== '') {
        console.log(`Teléfono encontrado en campo ${field}:`, patientData[field]);
        return patientData[field];
      }
    }
    
    console.log('No se encontró ningún teléfono válido');
    return null;
  };

  const phoneNumber = getPhoneNumber(patient);

  // Avatar: usar foto si hay, si no, icono. Evitar deformación del icono.
  const avatarUrl = patient.photo_url || null;
  const avatarProps = avatarUrl
    ? { src: avatarUrl }
    : { icon: <UserOutlined style={{ fontSize: 38 }} /> };

  // Estado para ubigeo
  const [ubigeo, setUbigeo] = useState({
    departamento: '-',
    provincia: '-',
    distrito: '-',
  });

  useEffect(() => {
    async function fetchUbigeo() {
      console.log('InfoPatient - Datos de ubicación del paciente:', {
        region: patient.region,
        province: patient.province,
        district: patient.district,
        region_id: patient.region_id,
        province_id: patient.province_id,
        district_id: patient.district_id
      });

      // La API devuelve objetos con id y name, no solo IDs
      const region_id = patient.region?.id || patient.region_id || patient.departamento_id;
      const province_id = patient.province?.id || patient.province_id || patient.provincia_id;
      const district_id = patient.district?.id || patient.district_id || patient.distrito_id;

      console.log('InfoPatient - IDs extraídos:', { region_id, province_id, district_id });

      // Verificar si ya tenemos los nombres directamente de la API
      const regionName = patient.region?.name;
      const provinceName = patient.province?.name;
      const districtName = patient.district?.name;

      console.log('InfoPatient - Nombres directos de la API:', { regionName, provinceName, districtName });

      // Si ya tenemos los nombres de la API, usarlos directamente
      if (regionName || provinceName || districtName) {
        console.log('InfoPatient - Usando nombres directos de la API');
        setUbigeo({ 
          departamento: regionName || '-', 
          provincia: provinceName || '-', 
          distrito: districtName || '-' 
        });
      } else if (region_id || province_id || district_id) {
        let departamento = '-';
        let provincia = '-';
        let distrito = '-';
        if (region_id) {
          console.log('InfoPatient - Buscando departamento con ID:', region_id);
          const departamentos = await getDepartaments();
          console.log('InfoPatient - Departamentos disponibles:', departamentos);
          const found = departamentos.find(
            (d) => String(d.id) === String(region_id),
          );
          if (found) {
            departamento = found.name;
            console.log('InfoPatient - Departamento encontrado:', found.name);
          } else {
            console.log('InfoPatient - Departamento no encontrado para ID:', region_id);
          }
        }
        if (province_id) {
          console.log('InfoPatient - Buscando provincia con ID:', province_id);
          const provincias = await getProvinces(region_id);
          console.log('InfoPatient - Provincias disponibles:', provincias);
          const found = provincias.find(
            (p) => String(p.id) === String(province_id),
          );
          if (found) {
            provincia = found.name;
            console.log('InfoPatient - Provincia encontrada:', found.name);
          } else {
            console.log('InfoPatient - Provincia no encontrada para ID:', province_id);
          }
        }
        if (district_id) {
          console.log('InfoPatient - Buscando distrito con ID:', district_id);
          const distritos = await getDistricts(province_id);
          console.log('InfoPatient - Distritos disponibles:', distritos);
          const found = distritos.find(
            (d) => String(d.id) === String(district_id),
          );
          if (found) {
            distrito = found.name;
            console.log('InfoPatient - Distrito encontrado:', found.name);
          } else {
            console.log('InfoPatient - Distrito no encontrado para ID:', district_id);
          }
        }
        console.log('InfoPatient - Ubigeo final:', { departamento, provincia, distrito });
        setUbigeo({ departamento, provincia, distrito });
      } else {
        setUbigeo({ departamento: '-', provincia: '-', distrito: '-' });
      }
    }
    if (open) fetchUbigeo();
  }, [open, patient]);

  return (
    <UniversalModal
      title="Información del Paciente"
      open={open}
      onCancel={onClose}
      footer={[
        <Button
          key="close"
          onClick={onClose}
          type="primary"
          style={{ 
            background: 'var(--color-primary)', 
            borderColor: 'var(--color-primary)',
            color: '#ffffff'
          }}
        >
          Cerrar
        </Button>,
      ]}
      width={600}
      className="info-patient-modal modal-themed"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          marginBottom: 24,
        }}
      >
        <Avatar
          size={80}
          {...avatarProps}
          style={{
            background: 'var(--color-primary)',
            color: '#ffffff',
            objectFit: 'cover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
        <div>
          <div style={{ 
            fontSize: 22, 
            fontWeight: 700, 
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-family)'
          }}>
            {fullName}
          </div>
          <div style={{ 
            color: 'var(--color-text-secondary)', 
            fontSize: 16,
            fontFamily: 'var(--font-family)'
          }}>
            {patient.document_type?.name || 'Documento'}:{' '}
            {patient.document_number || '-'}
          </div>
        </div>
      </div>
      <Descriptions
        column={1}
        labelStyle={{ 
          color: 'var(--color-primary)', 
          fontWeight: 600, 
          width: 200,
          fontFamily: 'var(--font-family)',
          minWidth: 200
        }}
        contentStyle={{ 
          color: 'var(--color-text-primary)', 
          fontWeight: 400,
          fontFamily: 'var(--font-family)'
        }}
        bordered
        size="middle"
        style={{ 
          background: 'var(--color-background-secondary)', 
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-primary)'
        }}
      >
        <Descriptions.Item label="Email">
          {patient.email || 'No registrado'}
        </Descriptions.Item>
        <Descriptions.Item label="Teléfono">
          {phoneNumber || 'No registrado'}
        </Descriptions.Item>
        <Descriptions.Item label="Sexo">
          {patient.sex === 'M'
            ? 'Masculino'
            : patient.sex === 'F'
              ? 'Femenino'
              : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Fecha de nacimiento">
          {formattedBirthDate}
        </Descriptions.Item>
        <Descriptions.Item label="Dirección">
          {patient.address || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Departamento">
          {ubigeo.departamento}
        </Descriptions.Item>
        <Descriptions.Item label="Provincia">
          {ubigeo.provincia}
        </Descriptions.Item>
        <Descriptions.Item label="Distrito">
          {ubigeo.distrito}
        </Descriptions.Item>
        <Descriptions.Item label="Ocupación">
          {patient.ocupation || patient.occupation || '-'}
        </Descriptions.Item>
      </Descriptions>
    </UniversalModal>
  );
};

export default InfoPatient;
