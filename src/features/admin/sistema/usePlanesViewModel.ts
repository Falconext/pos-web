import { useState, useEffect } from 'react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';
import { useModulosStore } from '@/zustand/modulos';
import { useAuthStore } from '@/zustand/auth';

export interface Plan {
    id: number; nombre: string; descripcion?: string; costo: number;
    producto?: 'facturacion' | 'hotel';
    duracionDias: number; limiteUsuarios: number; maxSedes: number;
    maxImagenesProducto: number;
    maxBanners: number; maxComprobantes: number; esPrueba: boolean;
    tieneTienda: boolean; tieneBanners: boolean; tieneGaleria: boolean;
    tieneCulqi: boolean; tieneDeliveryGPS: boolean; tieneTicketera: boolean;
    _count?: { empresas: number };
    modulosAsignados?: { modulo: { id: number; codigo: string; nombre: string; descripcion: string; icono: string; } }[];
    subModulosAsignados?: { subModulo: { id: number; codigo: string; nombre: string; moduloId: number } }[];
}

const initialForm: Partial<Plan> & { moduloIds?: number[]; subModuloIds?: number[] } = {
    producto: 'facturacion',
    nombre: '', descripcion: '', costo: 0, duracionDias: 30,
    limiteUsuarios: 1, maxSedes: 1, maxImagenesProducto: 1, maxBanners: 0, maxComprobantes: 100,
    esPrueba: false, tieneTienda: false, tieneBanners: false, tieneGaleria: false,
    tieneCulqi: false, tieneDeliveryGPS: false, tieneTicketera: false,
    moduloIds: [], subModuloIds: [],
};

export const usePlanesViewModel = () => {
    const [planes, setPlanes] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [showFeaturesModal, setShowFeaturesModal] = useState(false);
    const [showModulesModal, setShowModulesModal] = useState(false);
    const [form, setForm] = useState<Partial<Plan> & { moduloIds?: number[]; subModuloIds?: number[] }>(initialForm);
    const [modalConfirmOpen, setModalConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const { alert } = useAlertStore();
    const { getAllModulos } = useModulosStore();
    const { auth } = useAuthStore();
    const productoScope = (String(auth?.sistemaProducto || '').toLowerCase() === 'hotel' ? 'hotel' : String(auth?.sistemaProducto || '').toLowerCase() === 'facturacion' ? 'facturacion' : '') as '' | 'facturacion' | 'hotel';
    const [productoFiltro, setProductoFiltro] = useState<'' | 'facturacion' | 'hotel'>(productoScope);

    useEffect(() => {
        setProductoFiltro(productoScope);
    }, [productoScope]);

    useEffect(() => {
        loadPlanes();
    }, [productoFiltro, productoScope]);

    const loadPlanes = async () => {
        try {
            setLoading(true);
            const producto = productoScope || productoFiltro;
            const qs = producto ? `?producto=${producto}` : '';
            const { data } = await apiClient.get(`/plan${qs}`);
            setPlanes(Array.isArray(data) ? data : (data.data || []));
        } catch { alert('Error al cargar planes', 'error'); }
        finally { setLoading(false); }
    };

    const handleOpenCreate = () => {
        setIsEdit(false);
        const producto = productoScope || 'facturacion';
        setForm({ ...initialForm, producto, moduloIds: [], subModuloIds: [] });
        getAllModulos(true, producto);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (plan: Plan) => {
        const producto = (plan.producto || 'facturacion') as 'facturacion' | 'hotel';
        setIsEdit(true);
        setCurrentId(plan.id);
        setForm({
            ...plan,
            producto,
            moduloIds: plan.modulosAsignados?.map(m => m.modulo.id) || [],
            subModuloIds: plan.subModulosAsignados?.map(s => s.subModulo.id) || [],
        });
        getAllModulos(true, producto);
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.nombre || form.costo === undefined) { alert('Nombre y costo son obligatorios', 'warning'); return; }
        try {
            setLoading(true);
            const payload = {
                ...form,
                producto: (productoScope || form.producto || 'facturacion') as 'facturacion' | 'hotel',
                costo: Number(form.costo),
                duracionDias: Number(form.duracionDias),
                limiteUsuarios: Number(form.limiteUsuarios),
                maxSedes: Number(form.maxSedes ?? 1),
                maxImagenesProducto: Number(form.maxImagenesProducto),
                maxBanners: Number(form.maxBanners),
            };
            if (isEdit && currentId) {
                await apiClient.put(`/plan/${currentId}`, payload);
                alert('Plan actualizado', 'success');
            } else {
                await apiClient.post('/plan', payload);
                alert('Plan creado', 'success');
            }
            setIsModalOpen(false);
            await loadPlanes();
        } catch (error: any) { alert(error.response?.data?.message || 'Error al guardar', 'error'); }
        finally { setLoading(false); }
    };

    const confirmDelete = (id: number) => { setDeleteId(id); setModalConfirmOpen(true); };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await apiClient.delete(`/plan/${deleteId}`);
            alert('Plan eliminado', 'success');
            setModalConfirmOpen(false);
            loadPlanes();
        } catch (error: any) { alert(error.response?.data?.message || 'Error al eliminar', 'error'); }
    };

    return {
        planes, loading,
        productoFiltro, setProductoFiltro,
        isModalOpen, setIsModalOpen, isEdit, form, setForm,
        showFeaturesModal, setShowFeaturesModal,
        showModulesModal, setShowModulesModal,
        modalConfirmOpen, setModalConfirmOpen,
        handleOpenCreate, handleOpenEdit, handleSubmit, confirmDelete, handleDelete,
    };
};
