import { useState, useEffect, useMemo, useRef } from 'react';
import { get } from '@/utils/fetch';
import useAlertStore from '@/zustand/alert';
import useEmpresasStore from '@/zustand/empresas';
import { useAuthStore } from '@/zustand/auth';
import React from 'react';

type WhatsAppProvider = 'PLATFORM' | 'EMPRESA' | 'DISABLED';

interface WhatsAppSettingsForm {
    provider: WhatsAppProvider;
    phoneNumberId: string;
    businessId: string;
    apiToken: string;
    activo: boolean;
}

interface PerfilData {
    id: number; nombre: string; email: string; rol: string; celular?: string; telefono?: string;
    empresaId: number; estado: string; fechaCreacion: string; fechaActualizacion: string;
    empresa: { id: number; razonSocial: string; nombreComercial: string; direccion: string; logo?: string; ruc: string; tipoEmpresa: string; fechaCreacion: string; fechaActivacion?: string; fechaExpiracion?: string; usaCodigoBarrasManual?: boolean | null; usarPrecioLoteFefo?: boolean | null; directorTecnico?: string | null; whatsappProvider?: WhatsAppProvider | null; whatsappPhoneNumberId?: string | null; whatsappBusinessId?: string | null; whatsappActivo?: boolean | null; whatsappApiTokenConfigured?: boolean; rubro: { id: number; nombre: string; descripcion: string }; plan: { id: number; nombre: string; descripcion: string; costo: number; duracionDias: number; tipoFacturacion: string; esPrueba: boolean; activo: boolean }; departamento?: string; provincia?: string; distrito?: string; ubicacion?: { codigo: string; departamento: string; provincia: string; distrito: string } };
}

const whatsappFormFromPerfil = (perfil: PerfilData): WhatsAppSettingsForm => ({
    provider: perfil.empresa.whatsappProvider || 'PLATFORM',
    phoneNumberId: perfil.empresa.whatsappPhoneNumberId || '',
    businessId: perfil.empresa.whatsappBusinessId || '',
    apiToken: '',
    activo: perfil.empresa.whatsappActivo ?? true,
});

export const usePerfilViewModel = () => {
    const [perfil, setPerfil] = useState<PerfilData | null>(null);
    const [loading, setLoading] = useState(true);
    const [savingBarcodeConfig, setSavingBarcodeConfig] = useState(false);
    const [savingFefoPriceConfig, setSavingFefoPriceConfig] = useState(false);
    const [savingDirectorTecnico, setSavingDirectorTecnico] = useState(false);
    const [savingWhatsAppConfig, setSavingWhatsAppConfig] = useState(false);
    const [whatsAppForm, setWhatsAppForm] = useState<WhatsAppSettingsForm>({
        provider: 'PLATFORM',
        phoneNumberId: '',
        businessId: '',
        apiToken: '',
        activo: true,
    });
    const [usageStats, setUsageStats] = useState<any>(null);
    const fefoToggleInFlight = useRef(false);
    const barcodeToggleInFlight = useRef(false);
    const { alert } = useAlertStore();

    useEffect(() => { cargarPerfil(); cargarUsageStats(); }, []);

    const cargarPerfil = async () => {
        try {
            setLoading(true);
            const response: any = await get('auth/perfil');
            if (response.code === 1) {
                setPerfil(response.data);
                setWhatsAppForm(whatsappFormFromPerfil(response.data));
            }
            else alert('Error al cargar el perfil', 'error');
        } catch { alert('Error al cargar el perfil', 'error'); }
        finally { setLoading(false); }
    };

    const handleBarcodeToggle = async (enabled: boolean) => {
        if (savingBarcodeConfig || barcodeToggleInFlight.current) return;
        if (Boolean(perfil?.empresa?.usaCodigoBarrasManual) === enabled) return;
        try {
            barcodeToggleInFlight.current = true;
            setSavingBarcodeConfig(true);
            await useEmpresasStore.getState().actualizarMiEmpresa({ usaCodigoBarrasManual: enabled });
            setPerfil(prev => {
                if (!prev) return prev;
                return { ...prev, empresa: { ...prev.empresa, usaCodigoBarrasManual: enabled } };
            });
            useAuthStore.setState(state => ({
                auth: state.auth ? { ...state.auth, empresa: { ...(state.auth as any).empresa, usaCodigoBarrasManual: enabled } } : state.auth,
            }));
            useAlertStore.getState().alert('Configuración de código de barras actualizada', 'success');
        } catch (error: any) {
            useAlertStore.getState().alert(error?.response?.data?.message || error?.message || 'No se pudo actualizar la configuración', 'error');
        } finally {
            barcodeToggleInFlight.current = false;
            setSavingBarcodeConfig(false);
        }
    };

    const handleFefoPriceToggle = async (enabled: boolean) => {
        if (savingFefoPriceConfig || fefoToggleInFlight.current) return;
        if (Boolean(perfil?.empresa?.usarPrecioLoteFefo) === enabled) return;
        try {
            fefoToggleInFlight.current = true;
            setSavingFefoPriceConfig(true);
            await useEmpresasStore.getState().actualizarMiEmpresa({ usarPrecioLoteFefo: enabled });
            setPerfil(prev => {
                if (!prev) return prev;
                return { ...prev, empresa: { ...prev.empresa, usarPrecioLoteFefo: enabled } };
            });
            useAuthStore.setState(state => ({
                auth: state.auth ? { ...state.auth, empresa: { ...(state.auth as any).empresa, usarPrecioLoteFefo: enabled } } : state.auth,
            }));
            useAlertStore.getState().alert('Configuración de precio FEFO actualizada', 'success');
        } catch (error: any) {
            useAlertStore.getState().alert(error?.response?.data?.message || error?.message || 'No se pudo actualizar la configuración FEFO', 'error');
        } finally {
            fefoToggleInFlight.current = false;
            setSavingFefoPriceConfig(false);
        }
    };

    const cargarUsageStats = async () => {
        try {
            const response: any = await get('comprobante/usage');
            if (response?.data) setUsageStats(response.data);
            else if (response && !response.error) setUsageStats(response);
        } catch { }
    };

    const formatearFecha = (fecha: string) => new Date(fecha).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const formatearFechaSolo = (fecha: string) => new Date(fecha).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            try {
                await useEmpresasStore.getState().actualizarMiEmpresa({ logo: e.target.files[0] });
                useAlertStore.getState().alert('Logo actualizado correctamente', 'success');
                cargarPerfil();
            } catch { useAlertStore.getState().alert('Error al actualizar logo', 'error'); }
        }
    };

    const obtenerEstadoSuscripcion = () => {
        if (!perfil?.empresa.fechaExpiracion) return 'Sin información';
        const fechaExp = new Date(perfil.empresa.fechaExpiracion);
        const hoy = new Date();
        if (fechaExp < hoy) return 'Expirada';
        const dias = Math.ceil((fechaExp.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        return dias <= 7 ? `Expira en ${dias} días` : 'Activa';
    };

    const obtenerColorEstado = () => {
        const estado = obtenerEstadoSuscripcion();
        if (estado === 'Expirada') return 'text-red-600 bg-red-100';
        if (estado.includes('Expira en')) return 'text-orange-600 bg-orange-100';
        return 'text-green-600 bg-green-100';
    };

    const handleDirectorTecnicoSave = async (valor: string, onDone?: () => void) => {
        if (savingDirectorTecnico) return;
        try {
            setSavingDirectorTecnico(true);
            await useEmpresasStore.getState().actualizarMiEmpresa({ directorTecnico: valor });
            setPerfil(prev => {
                if (!prev) return prev;
                return { ...prev, empresa: { ...prev.empresa, directorTecnico: valor } };
            });
            onDone?.();
            useAlertStore.getState().alert('Director Técnico actualizado', 'success');
        } catch (error: any) {
            useAlertStore.getState().alert(error?.response?.data?.message || error?.message || 'No se pudo actualizar el Director Técnico', 'error');
        } finally {
            setSavingDirectorTecnico(false);
        }
    };

    const whatsappConfigDirty = useMemo(() => {
        if (!perfil) return false;
        const initial = whatsappFormFromPerfil(perfil);
        return (
            whatsAppForm.provider !== initial.provider ||
            whatsAppForm.phoneNumberId !== initial.phoneNumberId ||
            whatsAppForm.businessId !== initial.businessId ||
            whatsAppForm.activo !== initial.activo ||
            whatsAppForm.apiToken.trim().length > 0
        );
    }, [perfil, whatsAppForm]);

    const setWhatsAppProvider = (provider: WhatsAppProvider) => {
        setWhatsAppForm(prev => ({
            ...prev,
            provider,
            activo: provider !== 'DISABLED',
        }));
    };

    const updateWhatsAppField = (field: keyof Omit<WhatsAppSettingsForm, 'provider' | 'activo'>, value: string) => {
        setWhatsAppForm(prev => ({ ...prev, [field]: value }));
    };

    const handleWhatsAppConfigSave = async () => {
        if (!perfil || savingWhatsAppConfig) return;

        const token = whatsAppForm.apiToken.trim();
        const phoneNumberId = whatsAppForm.phoneNumberId.trim();
        const businessId = whatsAppForm.businessId.trim();

        if (whatsAppForm.provider === 'EMPRESA' && !phoneNumberId) {
            useAlertStore.getState().alert('Ingresa el Phone Number ID de Meta', 'error');
            return;
        }

        if (whatsAppForm.provider === 'EMPRESA' && !perfil.empresa.whatsappApiTokenConfigured && !token) {
            useAlertStore.getState().alert('Ingresa el token permanente de WhatsApp Cloud API', 'error');
            return;
        }

        try {
            setSavingWhatsAppConfig(true);
            const payload: {
                whatsappProvider: WhatsAppProvider;
                whatsappPhoneNumberId?: string | null;
                whatsappBusinessId?: string | null;
                whatsappApiToken?: string;
                whatsappActivo: boolean;
            } = {
                whatsappProvider: whatsAppForm.provider,
                whatsappPhoneNumberId: phoneNumberId || null,
                whatsappBusinessId: businessId || null,
                whatsappActivo: whatsAppForm.provider !== 'DISABLED',
            };

            if (token) payload.whatsappApiToken = token;

            await useEmpresasStore.getState().actualizarMiEmpresa(payload);

            setPerfil(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    empresa: {
                        ...prev.empresa,
                        whatsappProvider: whatsAppForm.provider,
                        whatsappPhoneNumberId: phoneNumberId || null,
                        whatsappBusinessId: businessId || null,
                        whatsappActivo: whatsAppForm.provider !== 'DISABLED',
                        whatsappApiTokenConfigured: prev.empresa.whatsappApiTokenConfigured || Boolean(token),
                    },
                };
            });

            setWhatsAppForm(prev => ({ ...prev, apiToken: '', activo: prev.provider !== 'DISABLED' }));
            useAlertStore.getState().alert('Configuración de WhatsApp actualizada', 'success');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'No se pudo actualizar WhatsApp';
            useAlertStore.getState().alert(message, 'error');
        } finally {
            setSavingWhatsAppConfig(false);
        }
    };

    return { perfil, loading, usageStats, savingBarcodeConfig, savingFefoPriceConfig, savingDirectorTecnico, savingWhatsAppConfig, whatsAppForm, whatsappConfigDirty, formatearFecha, formatearFechaSolo, handleLogoChange, handleBarcodeToggle, handleFefoPriceToggle, handleDirectorTecnicoSave, setWhatsAppProvider, updateWhatsAppField, handleWhatsAppConfigSave, obtenerEstadoSuscripcion, obtenerColorEstado };
};
