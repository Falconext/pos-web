import { useCallback, useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';
import { useAuthStore } from '@/zustand/auth';

export type TipoVenta =
    | 'BOLETA' | 'FACTURA' | 'NOTA_CREDITO' | 'NOTA_DEBITO'
    | 'TICKET' | 'NOTA_VENTA' | 'NOTA_PEDIDO' | 'RECIBO_HONORARIOS' | 'COMP_PAGO' | 'OTRO'
    | 'PEDIDO_TIENDA';

export type EstadoPago = 'PAGADO' | 'PENDIENTE' | 'PARCIAL';
export type EstadoSunat = 'ACEPTADO' | 'PENDIENTE' | 'RECHAZADO' | 'NO_APLICA' | 'ANULADO';
export type EstadoDespacho = 'PREPARANDO' | 'EN_CAMINO' | 'EN_DESTINO' | 'ENTREGADO' | 'DEVUELTO' | 'NO_APLICA';

export interface VentaPanelItem {
    id: number;
    tipo: TipoVenta;
    referencia: string;
    fecha: string;
    cliente: string;
    total: number;
    estadoPago: EstadoPago;
    metodoPago: string;
    estadoSunat: EstadoSunat;
    estadoDespacho: EstadoDespacho;
    repartidor: string;
    vendedor: string;
    sede: string;
    comprobanteId: number | null;
    pedidoId: number | null;
}

export type TabVentas = 'TODO' | 'VENTAS' | 'CON_DESPACHO';

export function usePanelVentasViewModel() {
    const { sedeActiva } = useAuthStore();
    const { alert } = useAlertStore();

    const [fecha, setFecha] = useState(() => moment().format('YYYY-MM-DD'));
    const [items, setItems] = useState<VentaPanelItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<TabVentas>('TODO');
    const [busqueda, setBusqueda] = useState('');

    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ fecha });
            if (sedeActiva?.id) params.set('sedeId', String(sedeActiva.id));
            const { data } = await apiClient.get<any>(`/ventas/panel?${params}`);
            const raw = data?.data?.data ?? data?.data ?? [];
            setItems(Array.isArray(raw) ? raw : []);
        } catch {
            alert('Error al cargar el panel de ventas', 'error');
        } finally {
            setLoading(false);
        }
    }, [fecha, sedeActiva?.id, alert]);

    useEffect(() => { cargar(); }, [cargar]);

    const filtrados = useMemo(() => {
        const search = busqueda.toLowerCase().trim();
        let base = items;
        if (search) {
            base = base.filter(
                (i) =>
                    i.cliente.toLowerCase().includes(search) ||
                    i.referencia.toLowerCase().includes(search) ||
                    i.vendedor.toLowerCase().includes(search),
            );
        }
        if (tab === 'VENTAS') return base.filter((i) => i.estadoDespacho === 'NO_APLICA');
        if (tab === 'CON_DESPACHO') return base.filter((i) => i.estadoDespacho !== 'NO_APLICA');
        return base;
    }, [items, tab, busqueda]);

    const countTodo = items.length;
    const countVentas = useMemo(() => items.filter((i) => i.estadoDespacho === 'NO_APLICA').length, [items]);
    const countDespacho = useMemo(() => items.filter((i) => i.estadoDespacho !== 'NO_APLICA').length, [items]);

    const totalVentas = useMemo(
        () => filtrados.reduce((s, i) => s + (i.total ?? 0), 0),
        [filtrados],
    );

    return {
        fecha, setFecha,
        items, filtrados,
        loading,
        tab, setTab,
        busqueda, setBusqueda,
        countTodo, countVentas, countDespacho,
        totalVentas,
        cargar,
    };
}
