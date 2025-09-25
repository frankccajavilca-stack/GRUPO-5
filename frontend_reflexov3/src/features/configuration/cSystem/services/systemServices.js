import { get, post, put, del } from "../../../../services/api/Axios/MethodsGeneral";
import instance from '../../../../services/api/Axios/baseConfig';

// Listar todas las empresas
export const getCompanies = async () => {
    try {
        const response = await get('company/company/');
        return response.data;
    } catch (error) {
        console.error("Error fetching companies:", error);
        throw error;
    }
};

// Obtener información específica de la empresa ID 1 (Reflexo Peru v3)
export const getSystemInfo = async () => {
    try {
        // Siempre obtener la empresa con ID 1 que tiene el logo
        const response = await get('company/company/');
        const companies = response.data.data || response.data.results || response.data;
        
        if (companies && companies.length > 0) {
            // Buscar específicamente la empresa con ID 1
            const targetCompany = companies.find(company => company.id === 1);
            if (targetCompany) {
                // Asegurar que el logo_url esté disponible
                const companyData = {
                    ...targetCompany,
                    logo_url: targetCompany.logo_url || targetCompany.company_logo || null,
                    company_name: targetCompany.company_name || targetCompany.name || 'Empresa'
                };
                return companyData;
            } else {
                // Si no encuentra la empresa ID 1, usar la primera disponible
                const firstCompany = companies[0];
                const companyData = {
                    ...firstCompany,
                    logo_url: firstCompany.logo_url || firstCompany.company_logo || null,
                    company_name: firstCompany.company_name || firstCompany.name || 'Empresa'
                };
                return companyData;
            }
        } else {
            throw new Error('No hay empresas registradas');
        }
    } catch (error) {
        console.error("Error fetching system info:", error);
        throw error;
    }
};

// Crear una nueva empresa
export const createCompany = async (data) => {
    try {
        const response = await post('company/company/', data);
        return response.data;
    } catch (error) {
        console.error("Error creating company:", error);
        throw error;
    }
};

// Actualizar datos de la empresa (solo nombre) - usando ID 1
export const updateSystemaInfo = async (data) => {
    try {
        console.log("Voy a enviar al backend:", data);
        const response = await put(`company/company/1/`, data);
        return response.data;
    } catch (error) {
        console.error("Error actualizando la info del sistema:", error);
        throw error;
    }
};

// Actualizar datos de la empresa (solo nombre)
export const updateSystemInfo = async (companyId, data) => {
    try {
        const response = await put(`company/company/${companyId}/`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating system info:", error);
        throw error;
    }
};



// Subir logo a una empresa específica (primera vez)
export const uploadCompanyLogo = async (companyId, file) => {
    try {
        const formData = new FormData();
        formData.append('company_logo', file);
        
        const response = await instance.post(`company/company/${companyId}/upload_logo/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error uploading company logo:", error.response?.data || error.message);
        throw error;
    }
};

// Subir/Actualizar logo (PUT funciona tanto para crear como actualizar)
export const updateCompanyLogo = async (file) => {
    try {       
        const formData = new FormData();
        formData.append('company_logo', file);
        const response = await instance.put('company/company/1/upload_logo/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    } catch (error) {
        console.error("Error subiendo el logo:", error.response?.data || error.message);
        throw error;
    }
};

// Eliminar logo de la empresa (usando ID 1 para Reflexo)
export const deleteCompanyLogo = async () => {
    try {
        const response = await del('company/company/1/delete_logo/');
        return response.data;
    } catch (error) {
        console.error("Error deleting company logo:", error);
        throw error;
    }
};

// Eliminar empresa
export const deleteCompany = async (companyId) => {
    try {
        const response = await del(`company/company/${companyId}/`);
        return response.data;
    } catch (error) {
        console.error("Error deleting company:", error);
        throw error;
    }
};