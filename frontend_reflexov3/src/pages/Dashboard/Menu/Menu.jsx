import {
  House, // Inicio
  Users, // Pacientes
  Calendar, // Citas
  CalendarCheck, // Citas completas
  UserGear, // Terapeutas
  ChartPie, // Reportes
  CalendarBlank, // Calendario
  ChartLine, // Estadísticas
  Gear, // Configuraciones
  CurrencyDollar, // Pagos
  User, // Perfil
  Cpu, // Sistema
  UserList, // Usuarios
  FileText, // Alternativa para Reportes
  ChartBar, // Alternativa para Estadísticas
  FileDoc, // Alternativa para Configuraciones
  AddressBook, // Alternativa para Terapeutas
  Wrench,
} from '@phosphor-icons/react';
import { Menu } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';

import { useAuth } from '../../../routes/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import Style from './Menu.module.css';
export default function MenuDashboard() {
  const { isDarkMode } = useTheme();
  const { userRole } = useAuth();
  const [isMenuMode, setIsMenuMode] = useState(window.innerHeight > 804);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMenuMode(window.innerHeight > 768);
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Función simple para obtener las claves seleccionadas (solo resaltado)
  const getSelectedKeys = () => {
    const currentPath = location.pathname;

    // Verificar elementos del submenú de configuraciones
    if (currentPath === '/configPagos') return ['33'];
    if (currentPath === '/configPerfil') return ['16'];
    if (currentPath === '/configSistema') return ['17'];
    if (currentPath === '/configUser') return ['14'];

    // Elementos principales del menú
    if (currentPath === '/Inicio' || currentPath === '/' || currentPath === '')
      return ['1'];
    if (currentPath === '/pacientes') return ['3'];
    if (currentPath === '/citas') return ['5'];
    if (currentPath === '/citasCompletas') return ['6'];
    if (currentPath === '/terapeutas') return ['8'];
    if (currentPath === '/reportes') return ['9'];
    if (currentPath === '/calendar') return ['10'];
    if (currentPath === '/estadisticas') return ['11'];

    return [];
  };

  const items = [
    // Elementos comunes para todos los roles
    {
      key: '1',
      label: <Link to="/Inicio">Inicio</Link>,
      icon: (
        <div className={Style.icon}>
          <House weight="regular" />
        </div>
      ),
    },
    {
      key: '3',
      label: <Link to="pacientes">Pacientes</Link>,
      icon: (
        <div className={Style.icon}>
          <Users weight="regular" />
        </div>
      ),
    },
    {
      key: '5',
      label: <Link to="citas">Citas</Link>,
      icon: (
        <div className={Style.icon}>
          <Calendar weight="regular" />
        </div>
      ),
    },
    {
      key: '6',
      label: <Link to="citasCompletas">Citas completadas</Link>,
      icon: (
        <div className={Style.icon}>
          <CalendarCheck weight="regular" />
        </div>
      ),
    },
    {
      key: '8',
      label: <Link to="terapeutas">Terapeutas</Link>,
      icon: (
        <div className={Style.icon}>
          <AddressBook />
        </div>
      ),
    },
    {
      key: '9',
      label: <Link to="reportes">Reportes</Link>,
      icon: (
        <div className={Style.icon}>
          <FileDoc />
        </div>
      ),
    },
    {
      key: '10',
      label: <Link to="calendar">Calendario</Link>,
      icon: (
        <div className={Style.icon}>
          <CalendarBlank weight="regular" />
        </div>
      ),
    },
    // Elementos solo para Admin (userRole === 1)
    ...(userRole === 1 ? [
      {
        key: '11',
        label: <Link to="estadisticas">Estadísticas</Link>,
        icon: (
          <div className={Style.icon}>
            <ChartLine weight="regular" />
          </div>
        ),
      },
    ] : []),
    // Submenú de configuraciones con elementos condicionales
    {
      key: '12',
      label: 'Configuraciones',
      icon: (
        <div className={Style.icon}>
          <Gear weight="regular" />
        </div>
      ),
      children: [
        // Solo Admin
        ...(userRole === 1 ? [
          {
            key: '33',
            label: <Link to="configPagos">Pagos</Link>,
            icon: <CurrencyDollar weight="regular" />,
          },
          {
            key: '17',
            label: <Link to="configSistema">Sistema</Link>,
            icon: <Cpu weight="regular" />,
          },
          {
            key: '14',
            label: <Link to="configUser">Usuarios</Link>,
            icon: <UserList weight="regular" />,
          },
        ] : []),
        // Todos los usuarios
        {
          key: '16',
          label: <Link to="configPerfil">Perfil</Link>,
          icon: <User weight="regular" />,
        },
      ],
    },
  ];
  //////Funciones para tener solo 1 submenu abierto/////////
  const [stateOpenKeys, setStateOpenKeys] = useState([]);
  const onOpenChange = (openKeys) => {
    const currentOpenKey = openKeys.find(
      (key) => stateOpenKeys.indexOf(key) === -1,
    );
    // open
    if (currentOpenKey !== undefined) {
      const repeatIndex = openKeys
        .filter((key) => key !== currentOpenKey)
        .findIndex((key) => levelKeys[key] === levelKeys[currentOpenKey]);
      setStateOpenKeys(
        openKeys
          // remove repeat key
          .filter((_, index) => index !== repeatIndex)
          // remove current level all child
          .filter((key) => levelKeys[key] <= levelKeys[currentOpenKey]),
      );
    } else {
      // close
      setStateOpenKeys(openKeys);
    }
  };
  const getLevelKeys = (items1) => {
    const key = {};
    const func = (items2, level = 1) => {
      items2.forEach((item) => {
        if (item.key) {
          key[item.key] = level;
        }
        if (item.children) {
          func(item.children, level + 1);
        }
      });
    };
    func(items1);
    return key;
  };
  const levelKeys = getLevelKeys(items);
  //////////////////////////////////////////////////////////

  /////Funciones para cambiar el modo del menu/////////////

  ////////////////////////////////////////////////////////
  return (
    <>
      <Menu
        theme={isDarkMode ? 'dark' : 'light'}
        mode={isMenuMode ? 'inline' : 'vertical'}
        defaultSelectedKeys={['1']}
        style={{
          height: '100%',
          borderRight: 0,
          fontFamily: 'var(--font-family)',
          backgroundColor: 'transparent',
        }}
        items={items}
        openKeys={stateOpenKeys}
        onOpenChange={onOpenChange}
      />
    </>
  );
}
