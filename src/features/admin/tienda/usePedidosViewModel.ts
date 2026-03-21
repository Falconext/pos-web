import { useState, useEffect } from 'react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';

export const ESTADOS = [
    { value: 'PENDIENTE', label: 'Pendiente', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'solar:clock-circle-bold' },
    { value: 'CONFIRMADO', label: 'Confirmado', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: 'solar:check-circle-bold' },
    { value: 'EN_PREPARACION', label: 'En Preparación', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: 'solar:chef-hat-bold' },
    { value: 'LISTO', label: 'Listo', color: 'bg-green-50 text-green-700 border-green-200', icon: 'solar:bag-check-bold' },
    { value: 'ENTREGADO', label: 'Entregado', color: 'bg-slate-50 text-slate-700 border-slate-200', icon: 'solar:box-bold' },
    { value: 'CANCELADO', label: 'Cancelado', color: 'bg-red-50 text-red-700 border-red-200', icon: 'solar:close-circle-bold' },
];

export const usePedidosViewModel = () => {
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroEstado, setFiltroEstado] = useState('');
    const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
    const { alert } = useAlertStore();

    useEffect(() => { cargarPedidos(); }, []);

    const cargarPedidos = async () => {
        try {
            const { data } = await apiClient.get(`/tienda/pedidos`);
            const responseData = data?.data;
            const raw = (Array.isArray(responseData) ? responseData : responseData?.data || []) as any[];
            const normalizados = raw.map((p) => ({
                ...p,
                subtotal: Number(p?.subtotal ?? 0),
                igv: Number(p?.igv ?? 0),
                total: Number(p?.total ?? 0),
                costoEnvio: Number(p?.costoEnvio ?? 0),
                items: (p?.items || []).map((it: any) => ({
                    ...it,
                    precioUnit: Number(it?.precioUnit ?? it?.precioUnitario ?? 0),
                    subtotal: Number(it?.subtotal ?? 0),
                })),
            }));
            setPedidos(normalizados);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al cargar pedidos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const cambiarEstado = async (pedidoId: number, nuevoEstado: string) => {
        try {
            await apiClient.patch(`/tienda/pedidos/${pedidoId}/estado`, { estado: nuevoEstado });
            alert('Estado actualizado correctamente', 'success');
            cargarPedidos();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al actualizar estado', 'error');
        }
    };

    const getEstadoInfo = (estado: string) => ESTADOS.find((e) => e.value === estado) || ESTADOS[0];

    const toggleOrderExpanded = (orderId: number) => {
        const newExpanded = new Set(expandedOrders);
        newExpanded.has(orderId) ? newExpanded.delete(orderId) : newExpanded.add(orderId);
        setExpandedOrders(newExpanded);
    };

    const estadisticas = ESTADOS.map(estado => ({
        ...estado,
        count: pedidos.filter(p => p.estado === estado.value).length
    }));

    const pedidosFiltrados = filtroEstado ? pedidos.filter(p => p.estado === filtroEstado) : pedidos;

    return {
        loading, pedidos, pedidosFiltrados, estadisticas,
        filtroEstado, setFiltroEstado,
        expandedOrders,
        cambiarEstado, getEstadoInfo, toggleOrderExpanded,
    };
};
