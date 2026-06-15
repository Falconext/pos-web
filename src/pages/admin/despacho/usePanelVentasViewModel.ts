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
    repartidorId: number | null;
    repartidor: string;
    tipoEnvio: string;
    agenciaDestino: string;
    celularDest: string;
    nroPaquetes: number | null;
    turnoEnvio: string;
    vendedor: string;
    sede: string;
    comprobanteId: number | null;
    pedidoId: number | null;
    // Conversión informal → formal
    esConvertida: boolean;
    convertidaEn: string | null;
    origenReferencia: string | null;
    // Courier / Shalom
    courier: string;
    nroOrden: string;
    claveOrden: string;
    // Cobros inline
    saldo: number;
    estadoPagoRaw: string;
    formaPagoTipo: string;
    montoDetraccion: number;
    porcentajeDetraccion: number;
    cuotas: any;
    observaciones: string | null;
    // Productos vendidos
    productos: { nombre: string; cantidad: number; precioUnitario: number; unidad: string }[];
}

export type TabVentas = 'TODO' | 'VENTAS' | 'CON_DESPACHO';

const DESPACHO_TO_PEDIDO: Record<string, { estadoEntrega: string; estadoEnvio: string }> = {
    PREPARANDO: { estadoEntrega: 'CONFIRMADO',           estadoEnvio: 'POR_COORDINAR' },
    EN_CAMINO:  { estadoEntrega: 'EN_TRANSITO',          estadoEnvio: 'EN_REPARTO' },
    EN_DESTINO: { estadoEntrega: 'EN_TRANSITO',          estadoEnvio: 'EN_REPARTO' },
    ENTREGADO:  { estadoEntrega: 'ENTREGADO_COMPLETADO', estadoEnvio: 'ENTREGADO' },
    DEVUELTO:   { estadoEntrega: 'PENDIENTE',            estadoEnvio: 'INCIDENCIA' },
};

export interface RepartidorOpcion {
    id: number | null;
    nombre: string;
}

export function usePanelVentasViewModel() {
    const { auth, sedeActiva } = useAuthStore();
    const { alert } = useAlertStore();

    const [fecha, setFecha] = useState(() => moment().format('YYYY-MM-DD'));
    const [items, setItems] = useState<VentaPanelItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<TabVentas>('TODO');
    const [busqueda, setBusqueda] = useState('');
    const [filtroRepartidorId, setFiltroRepartidorId] = useState<number | null | undefined>(undefined);
    const [filtroUsuarioId, setFiltroUsuarioId] = useState<number | null>(null);
    const canFilterByUsuario = auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'ADMIN_SISTEMA';

    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ fecha });
            if (sedeActiva?.id) params.set('sedeId', String(sedeActiva.id));
            if (canFilterByUsuario && filtroUsuarioId) params.set('usuarioId', String(filtroUsuarioId));
            const { data } = await apiClient.get<any>(`/ventas/panel?${params}`);
            const raw = data?.data?.data ?? data?.data ?? [];
            setItems(Array.isArray(raw) ? raw : []);
        } catch {
            alert('Error al cargar el panel de ventas', 'error');
        } finally {
            setLoading(false);
        }
    }, [fecha, sedeActiva?.id, filtroUsuarioId, canFilterByUsuario, alert]);

    useEffect(() => { cargar(); }, [cargar]);

    const repartidoresOpciones = useMemo<RepartidorOpcion[]>(() => {
        const map = new Map<string, RepartidorOpcion>();
        items.forEach((i) => {
            if (i.estadoDespacho === 'NO_APLICA') return;
            const key = i.repartidorId != null ? String(i.repartidorId) : '__sin__';
            if (!map.has(key)) {
                map.set(key, {
                    id: i.repartidorId,
                    nombre: i.repartidorId != null ? i.repartidor : 'Sin asignar',
                });
            }
        });
        return Array.from(map.values());
    }, [items]);

    const filtrados = useMemo(() => {
        const search = busqueda.toLowerCase().trim();
        let base = items.filter((i) => i.tipo !== 'NOTA_CREDITO');

        if (tab === 'VENTAS') base = base.filter((i) => i.estadoDespacho === 'NO_APLICA');
        else if (tab === 'CON_DESPACHO') base = base.filter((i) => i.estadoDespacho !== 'NO_APLICA');

        if (filtroRepartidorId !== undefined) {
            base = base.filter((i) =>
                filtroRepartidorId === null
                    ? i.repartidorId == null
                    : i.repartidorId === filtroRepartidorId,
            );
        }

        if (search) {
            base = base.filter(
                (i) =>
                    i.cliente.toLowerCase().includes(search) ||
                    i.referencia.toLowerCase().includes(search) ||
                    i.vendedor.toLowerCase().includes(search) ||
                    i.agenciaDestino.toLowerCase().includes(search) ||
                    i.celularDest.includes(search),
            );
        }

        return base;
    }, [items, tab, busqueda, filtroRepartidorId]);

    const actualizarEstado = useCallback(async (item: VentaPanelItem, nuevoEstado: string) => {
        try {
            if (item.comprobanteId) {
                await apiClient.put(`/envio-despacho/comprobante/${item.comprobanteId}`, { estado: nuevoEstado });
            } else if (item.pedidoId) {
                const mapped = DESPACHO_TO_PEDIDO[nuevoEstado];
                if (!mapped) return;
                await apiClient.patch(`/tienda/pedidos/${item.pedidoId}/estado`, mapped);
            } else {
                return;
            }
            setItems((prev) =>
                prev.map((i) =>
                    i.id === item.id && i.tipo === item.tipo
                        ? { ...i, estadoDespacho: nuevoEstado as EstadoDespacho }
                        : i,
                ),
            );
            alert('Estado actualizado', 'success');
        } catch {
            alert('Error al actualizar estado', 'error');
        }
    }, [alert]);

    const countTodo = items.length;
    const countVentas = useMemo(() => items.filter((i) => i.estadoDespacho === 'NO_APLICA').length, [items]);
    const countDespacho = useMemo(() => items.filter((i) => i.estadoDespacho !== 'NO_APLICA').length, [items]);
    // Excluye convertidas y documentos que no son ventas finales (como Notas de Pedido)
    const TIPOS_NO_VENTA = new Set(['NOTA_PEDIDO', 'COTIZACION', 'ORDEN_TRABAJO', 'OTRO']);
    const ventasFinales = useMemo(() => filtrados.filter((i) => !i.esConvertida && !TIPOS_NO_VENTA.has(i.tipo)), [filtrados]);
    const totalVentas = useMemo(() => ventasFinales.reduce((s, i) => s + (i.total ?? 0), 0), [ventasFinales]);
    const totalPorCobrar = useMemo(() => ventasFinales.reduce((s, i) => s + (i.saldo ?? 0), 0), [ventasFinales]);

    return {
        fecha, setFecha,
        items, filtrados,
        loading,
        tab, setTab,
        busqueda, setBusqueda,
        filtroRepartidorId, setFiltroRepartidorId,
        filtroUsuarioId, setFiltroUsuarioId,
        canFilterByUsuario,
        repartidoresOpciones,
        countTodo, countVentas, countDespacho,
        totalVentas,
        totalPorCobrar,
        actualizarEstado,
        cargar,
    };
}
