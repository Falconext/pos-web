import { useState, useEffect } from 'react';
import { get } from '@/utils/fetch';
import useAlertStore from '@/zustand/alert';
import useEmpresasStore from '@/zustand/empresas';
import React from 'react';

interface PerfilData {
    id: number; nombre: string; email: string; rol: string; celular?: string; telefono?: string;
    empresaId: number; estado: string; fechaCreacion: string; fechaActualizacion: string;
    empresa: { id: number; razonSocial: string; nombreComercial: string; direccion: string; logo?: string; ruc: string; tipoEmpresa: string; fechaCreacion: string; fechaActivacion?: string; fechaExpiracion?: string; rubro: { id: number; nombre: string; descripcion: string }; plan: { id: number; nombre: string; descripcion: string; costo: number; duracionDias: number; tipoFacturacion: string; esPrueba: boolean; activo: boolean }; departamento?: string; provincia?: string; distrito?: string; ubicacion?: { codigo: string; departamento: string; provincia: string; distrito: string } };
}

export const usePerfilViewModel = () => {
    const [perfil, setPerfil] = useState<PerfilData | null>(null);
    const [loading, setLoading] = useState(true);
    const [usageStats, setUsageStats] = useState<any>(null);
    const { alert } = useAlertStore();

    useEffect(() => { cargarPerfil(); cargarUsageStats(); }, []);

    const cargarPerfil = async () => {
        try {
            setLoading(true);
            const response: any = await get('auth/perfil');
            if (response.code === 1) setPerfil(response.data);
            else alert('Error al cargar el perfil', 'error');
        } catch { alert('Error al cargar el perfil', 'error'); }
        finally { setLoading(false); }
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

    return { perfil, loading, usageStats, formatearFecha, formatearFechaSolo, handleLogoChange, obtenerEstadoSuscripcion, obtenerColorEstado };
};
