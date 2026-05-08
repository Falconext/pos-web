import { useState, useEffect, useRef, useCallback } from 'react';
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

const POLLING_MS = 30_000;

const normalizarPedidos = (raw: any[]) =>
    raw.map((p) => ({
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

export const usePedidosViewModel = () => {
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroEstado, setFiltroEstado] = useState('');
    const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
    const [newOrdersCount, setNewOrdersCount] = useState(0);
    const [busqueda, setBusqueda] = useState('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const { alert } = useAlertStore();

    const knownIdsRef = useRef<Set<number>>(new Set());
    const isFirstLoad = useRef(true);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const cargarPedidos = async () => {
        try {
            const { data } = await apiClient.get(`/tienda/pedidos`);
            const responseData = data?.data;
            const raw = (Array.isArray(responseData) ? responseData : responseData?.data || []) as any[];
            const normalizados = normalizarPedidos(raw);

            if (isFirstLoad.current) {
                knownIdsRef.current = new Set(normalizados.map((p) => p.id));
                isFirstLoad.current = false;
            } else {
                const nuevos = normalizados.filter((p) => !knownIdsRef.current.has(p.id));
                if (nuevos.length > 0) {
                    setNewOrdersCount((prev) => prev + nuevos.length);
                    nuevos.forEach((p) => knownIdsRef.current.add(p.id));
                }
            }

            setPedidos(normalizados);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al cargar pedidos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const playBeep = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.6);
        } catch { /* AudioContext not available */ }
    }, []);

    const notificarNuevosPedidos = useCallback((count: number) => {
        playBeep();
        if (Notification.permission === 'granted') {
            new Notification(`🛒 ${count} nuevo${count > 1 ? 's' : ''} pedido${count > 1 ? 's' : ''}`, {
                body: 'Tienes nuevos pedidos en tu tienda virtual',
                icon: '/favicon.ico',
            });
        }
    }, [playBeep]);

    const fetchSilencioso = useCallback(async () => {
        try {
            const { data } = await apiClient.get(`/tienda/pedidos`);
            const responseData = data?.data;
            const raw = (Array.isArray(responseData) ? responseData : responseData?.data || []) as any[];
            const normalizados = normalizarPedidos(raw);

            const nuevos = normalizados.filter((p) => !knownIdsRef.current.has(p.id));
            if (nuevos.length > 0) {
                setNewOrdersCount((prev) => prev + nuevos.length);
                nuevos.forEach((p) => knownIdsRef.current.add(p.id));
                notificarNuevosPedidos(nuevos.length);
            }

            setPedidos(normalizados);
        } catch {
            // silent
        }
    }, [notificarNuevosPedidos]);

    useEffect(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }
        cargarPedidos();
        intervalRef.current = setInterval(fetchSilencioso, POLLING_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchSilencioso]);

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

    const clearNewOrders = () => setNewOrdersCount(0);

    const buildWhatsappUrl = (pedido: any, nuevoEstado: string) => {
        const estadoLabel = getEstadoInfo(nuevoEstado)?.label ?? nuevoEstado;
        const telefono = (pedido.clienteTelefono || '').replace(/\D/g, '');
        if (!telefono) return null;
        const msg = encodeURIComponent(
            `Hola ${pedido.clienteNombre}, tu pedido *#${pedido.codigoSeguimiento}* fue actualizado a *${estadoLabel}*. ¡Gracias por tu preferencia! 🎉`
        );
        return `https://wa.me/${telefono}?text=${msg}`;
    };

    const estadisticas = ESTADOS.map((estado) => ({
        ...estado,
        count: pedidos.filter((p) => p.estado === estado.value).length,
    }));

    const pedidosFiltrados = pedidos.filter((p) => {
        if (filtroEstado && p.estado !== filtroEstado) return false;
        if (busqueda) {
            const q = busqueda.toLowerCase();
            const matchNombre = (p.clienteNombre || '').toLowerCase().includes(q);
            const matchCodigo = (p.codigoSeguimiento || '').toLowerCase().includes(q);
            const matchTelefono = (p.clienteTelefono || '').includes(q);
            if (!matchNombre && !matchCodigo && !matchTelefono) return false;
        }
        if (fechaDesde) {
            const fecha = new Date(p.creadoEn);
            if (fecha < new Date(fechaDesde + 'T00:00:00')) return false;
        }
        if (fechaHasta) {
            const fecha = new Date(p.creadoEn);
            if (fecha > new Date(fechaHasta + 'T23:59:59')) return false;
        }
        return true;
    });

    return {
        loading, pedidos, pedidosFiltrados, estadisticas,
        filtroEstado, setFiltroEstado,
        busqueda, setBusqueda,
        fechaDesde, setFechaDesde,
        fechaHasta, setFechaHasta,
        expandedOrders, newOrdersCount, clearNewOrders,
        cambiarEstado, getEstadoInfo, toggleOrderExpanded,
        buildWhatsappUrl,
    };
};
