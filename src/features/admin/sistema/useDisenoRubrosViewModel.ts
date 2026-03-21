import { useState, useEffect } from 'react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';

interface Rubro { id: number; nombre: string; }
interface DisenoRubro {
    id?: number; rubroId: number; colorPrimario: string; colorSecundario: string;
    colorAccento: string; tipografia: string; espaciado: string;
    bordeRadius: string; estiloBoton: string; plantillaId: string;
    vistaProductos?: string; tiempoEntregaMin?: number; tiempoEntregaMax?: number;
}

export const PLANTILLAS = [
    { id: 'moderna', nombre: 'Moderna', descripcion: 'Diseño minimalista con espacios amplios' },
    { id: 'clasica', nombre: 'Clásica', descripcion: 'Diseño tradicional y elegante' },
    { id: 'vibrante', nombre: 'Vibrante', descripcion: 'Colores intensos y llamativos' },
    { id: 'minimalista', nombre: 'Minimalista', descripcion: 'Simplicidad y funcionalidad' },
];
export const TIPOGRAFIAS = ['Inter', 'Roboto', 'Poppins', 'Montserrat', 'Open Sans', 'Lato'];

const DEFAULT_DISENO = (rubroId: number): DisenoRubro => ({
    rubroId, colorPrimario: '#6A6CFF', colorSecundario: '#ffffff', colorAccento: '#FF6B6B',
    tipografia: 'Inter', espaciado: 'normal', bordeRadius: 'medium',
    estiloBoton: 'rounded', plantillaId: 'moderna', vistaProductos: 'cards',
    tiempoEntregaMin: 15, tiempoEntregaMax: 25,
});

export const useDisenoRubrosViewModel = () => {
    const [rubros, setRubros] = useState<Rubro[]>([]);
    const [rubroSeleccionado, setRubroSeleccionado] = useState<number | null>(null);
    const [diseno, setDiseno] = useState<DisenoRubro>(DEFAULT_DISENO(0));
    const [loading, setLoading] = useState(false);
    const { alert } = useAlertStore();

    useEffect(() => { cargarRubros(); }, []);
    useEffect(() => { if (rubroSeleccionado) cargarDisenoRubro(rubroSeleccionado); }, [rubroSeleccionado]);

    const cargarRubros = async () => {
        try {
            const { data } = await apiClient.get('/extensiones/rubros');
            setRubros(data.data || []);
        } catch { alert('Error al cargar rubros', 'error'); }
    };

    const cargarDisenoRubro = async (rubroId: number) => {
        try {
            setLoading(true);
            const { data } = await apiClient.get(`/diseno-rubro/${rubroId}`);
            const disenoData = data?.data || data;
            setDiseno(disenoData?.id ? disenoData : DEFAULT_DISENO(rubroId));
        } catch { setDiseno(DEFAULT_DISENO(rubroId)); }
        finally { setLoading(false); }
    };

    const guardarDiseno = async () => {
        if (!rubroSeleccionado) { alert('Selecciona un rubro', 'error'); return; }
        try {
            setLoading(true);
            await apiClient.post(`/diseno-rubro/${rubroSeleccionado}`, diseno);
            alert('Diseño guardado correctamente', 'success');
            cargarDisenoRubro(rubroSeleccionado);
        } catch (error: any) { alert(error.response?.data?.message || 'Error al guardar diseño', 'error'); }
        finally { setLoading(false); }
    };

    return { rubros, rubroSeleccionado, setRubroSeleccionado, diseno, setDiseno, loading, guardarDiseno };
};
