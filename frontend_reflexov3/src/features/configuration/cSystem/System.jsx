import { useState, useEffect } from 'react';
import { Upload, Input, Button, Spin, Image, message } from 'antd';
import { UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import MiniLogo from '../../../assets/Img/Dashboard/MiniLogoReflexo.png';
import styles from './System.module.css';
import { 
  useUpdateCompanyInfo, 
  useUploadCompanyLogo
} from './hook/systemHook';
import { useCompany } from '../../../context/CompanyContext';
import { deleteCompanyLogo } from './services/systemServices';

const System = () => {
  // Usar el contexto global de la empresa
  const {
    companyInfo,
    logoUrl,
    loading,
    refetchCompanyInfo,
  } = useCompany();
  const { updateCompany, updating } = useUpdateCompanyInfo();
  const { uploadLogo, uploadingLogo, uploadError, uploadSuccess } = useUploadCompanyLogo();
  
  const [companyName, setCompanyName] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  //Establecer nombre de la empresa desde los datos obtenidos
  useEffect(() => {
    if (companyInfo?.company_name) {
      setCompanyName(companyInfo.company_name);
    }
  }, [companyInfo]);

  //Sincronizar vista previa del logo con lo que viene del contexto
  const img = MiniLogo;

  //MOSTRAR MENSAJES DE EXITO/ERROR
  useEffect(() => {
    if (uploadSuccess) {
      message.success('Logo actualizado correctamente');
    }
    if (uploadError) {
      message.error(`Error al subir logo: ${uploadError.message}`);
    }
  }, [uploadSuccess, uploadError]);

  //ACTUALIZA DATOS DE LA EMPRESA (solo nombre)
  const handleNameChange = async () => {
    if (!companyName.trim()) return;
    try {
      await updateCompany({ company_name: companyName });
      await refetchCompanyInfo();
      message.success('Nombre de empresa actualizado');
    } catch (err) {
      console.error('Error al actualizar el nombre:', err);
    }
  };

  //CAMBIAR EL LOGO (igual que Profile)
  const handleLogoChange = async (info) => {
    if (info.file.status !== 'done') return;

    const file = info.file.originFileObj;
    if (!file) return;

    // Vista previa local inmediata (igual que Profile)
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target.result);
    reader.readAsDataURL(file);
    setSelectedFile(file);

    try {
      await uploadLogo(file);
      // Refrescar la información de la empresa para obtener el nuevo logo
      await refetchCompanyInfo();
    } catch (err) {
      console.error('Error al subir el logo:', err);
      // Revertir la vista previa en caso de error
      setLogoPreview(null);
      setSelectedFile(null);
    }
  };



  if (loading)
    return (
      <div className={`${styles.layout} ${styles.loading}`}>
        <Spin size="large" />
      </div>
    );

  return (
    <div className={styles.layout}>
      <main className={styles.mainContent}>
        <section className={styles.container}>
          <div className={styles.box}>
            {/* Logo */}
            <div className={styles.section}>
              <label className={styles.label}>Logo de la empresa:</label>
              <div className={styles.logoRow}>
                <div className={styles.logoBlock}>
                  <span className={styles.logoTitle}>Actual</span>
                  {logoUrl || logoPreview ? (
                    <Image
                      src={logoPreview || logoUrl}
                      alt={`Logo de ${companyName}`}
                      preview={false}
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid var(--color-primary)',
                        padding: '3px',
                        backgroundColor: 'transparent',
                      }}
                    />
                  ) : (
                    <div className={styles.noLogo}>
                      <Image
                        src={MiniLogo}
                        alt="Logo por defecto"
                        preview={false}
                        style={{
                          width: '100px',
                          height: '100px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px dashed var(--color-border-secondary)',
                          padding: '3px',
                          backgroundColor: 'transparent',
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className={styles.logoBlock}>
                  <span className={styles.logoTitle}>Subir nuevo</span>
                  <Upload
                    name="company_logo"
                    listType="picture-circle"
                    className="avatar-uploader"
                    showUploadList={false}
                    accept="image/*"
                    customRequest={({ file, onSuccess }) => {
                      onSuccess('ok');
                    }}
                    beforeUpload={(file) => {
                      const isImage = file.type.startsWith('image/');
                      if (!isImage) {
                        message.error('Solo puedes subir archivos de imagen!');
                      }
                      const isLt2M = file.size / 1024 / 1024 < 2;
                      if (!isLt2M) {
                        message.error('¡La imagen debe ser menor a 2MB!');
                      }
                      return isImage && isLt2M ? true : Upload.LIST_IGNORE;
                    }}
                    onChange={handleLogoChange}
                    style={{
                      borderRadius: '50%',
                      border: '2px dashed var(--color-primary)',
                      width: 97,
                      height: 97,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'var(--color-background-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ color: 'var(--color-text-primary)', textAlign: 'center' }}>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>Subir logo</div>
                    </div>
                  </Upload>
                </div>
              </div>
            </div>

            {/* Nombre */}
            <div className={styles.section}>
              <label className={styles.label} htmlFor="companyNameInput">
                Nombre de la empresa:
              </label>
              <div className={styles.nameRow}>
                <Input
                  id="companyNameInput"
                  className={styles.input}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ingresa el nombre de la empresa"
                />
                <div className={styles.buttonGroup}>
                  <Button
                    type="primary"
                    className={styles.changeBtn}
                    onClick={handleNameChange}
                    loading={updating}
                  >
                    Cambiar Solo Nombre
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default System;

