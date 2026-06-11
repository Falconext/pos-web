import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import moment from 'moment';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';
import { useInvoiceStore } from '@/zustand/invoices';
import {
    usePanelVentasViewModel,
    VentaPanelItem,
    TabVentas,
    TipoVenta,
    EstadoDespacho,
} from './usePanelVentasViewModel';
import { EditarDespachoModal } from './EditarDespachoModal';
import { ModalTrazabilidad } from './ModalTrazabilidad';
import ModalDetalleComprobante from '@/pages/admin/facturacion/ModalDetalleComprobante';
import ModalEnviarWhatsApp from '@/pages/admin/facturacion/ModalEnviarWhatsApp';
import ModalRegistrarPago from '@/pages/admin/facturacion/ModalRegistrarPago';
import ModalHistorialPagos from '@/pages/admin/facturacion/ModalHistorialPagos';
import ModalDetalleCuenta from '@/pages/admin/facturacion/ModalDetalleCuenta';
import TableActionMenu from '@/components/TableActionMenu';

// ─── Config badges ────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<TipoVenta, { label: string; cls: string }> = {
    BOLETA:            { label: 'Boleta',    cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    FACTURA:           { label: 'Factura',   cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
    NOTA_CREDITO:      { label: 'N.Crédito', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
    NOTA_DEBITO:       { label: 'N.Débito',  cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
    TICKET:            { label: 'Ticket',    cls: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
    NOTA_VENTA:        { label: 'N.Venta',   cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    NOTA_PEDIDO:       { label: 'N.Pedido',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    RECIBO_HONORARIOS: { label: 'R.Honor.',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    COMP_PAGO:         { label: 'C.Pago',    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    OTRO:              { label: 'Otro',      cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
    PEDIDO_TIENDA:     { label: 'Tienda',    cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
};

const PAGO_CONFIG: Record<string, { label: string; cls: string }> = {
    PAGADO:   { label: 'Pagado',    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    PARCIAL:  { label: 'Parcial',   cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    PENDIENTE:{ label: 'Pendiente', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

const SUNAT_CONFIG: Record<string, { label: string; cls: string }> = {
    ACEPTADO: { label: 'Aceptado',  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    PENDIENTE:{ label: 'Pendiente', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
    RECHAZADO:{ label: 'Rechazado', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
    ANULADO:  { label: 'Anulado',   cls: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400' },
    NO_APLICA:{ label: '—',         cls: 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500' },
};

const ESTADOS_DESPACHO: { value: EstadoDespacho; label: string }[] = [
    { value: 'PREPARANDO', label: 'Preparando' },
    { value: 'EN_CAMINO',  label: 'En camino' },
    { value: 'EN_DESTINO', label: 'En destino' },
    { value: 'ENTREGADO',  label: 'Entregado' },
    { value: 'DEVUELTO',   label: 'Devuelto' },
];

const DESPACHO_CLS: Record<EstadoDespacho, string> = {
    PREPARANDO: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    EN_CAMINO:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    EN_DESTINO: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    ENTREGADO:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    DEVUELTO:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    NO_APLICA:  'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
};

// ─── Small components ─────────────────────────────────────────────────────────

function Badge({ label, cls }: { label: string; cls: string }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${cls}`}>
            {label}
        </span>
    );
}

function TabBtn({ active, onClick, label, count }: {
    active: boolean; onClick: () => void; label: string; count: number;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                active
                    ? '!bg-blue-500 text-white shadow-md shadow-blue-200/50 border-none'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
        >
            {label}
            <span className={`min-w-[22px] h-5 px-1.5 flex items-center justify-center rounded-full text-xs font-bold ${
                active ? 'bg-white text-blue-600' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
            }`}>
                {count}
            </span>
        </button>
    );
}

// Dropdown selector de estado inline para filas con despacho
function EstadoDespachoSelector({ item, onChange }: {
    item: VentaPanelItem;
    onChange: (item: VentaPanelItem, nuevoEstado: string) => void;
}) {
    if (item.estadoDespacho === 'NO_APLICA') {
        return <Badge label="—" cls={DESPACHO_CLS.NO_APLICA} />;
    }
    return (
        <select
            value={item.estadoDespacho}
            onChange={(e) => onChange(item, e.target.value)}
            className={`text-[10px] font-bold rounded-full px-2 py-0.5 border-none outline-none cursor-pointer ${DESPACHO_CLS[item.estadoDespacho] ?? DESPACHO_CLS.PREPARANDO}`}
        >
            {ESTADOS_DESPACHO.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
            ))}
        </select>
    );
}

// ─── Conversion helpers ───────────────────────────────────────────────────────

const TIPOS_INFORMALES = new Set<TipoVenta>([
    'TICKET', 'NOTA_VENTA', 'NOTA_PEDIDO', 'RECIBO_HONORARIOS', 'COMP_PAGO', 'OTRO',
]);

function mapProductosComprobante(comprobante: any) {
    return Array.isArray(comprobante?.detalles)
        ? comprobante.detalles.map((d: any) => ({
              productoId: d.producto?.id || d.productoId || 0,
              descripcion: d.descripcion || d.producto?.descripcion || 'Producto',
              cantidad: Number(d.cantidad || 1),
              precioUnitario: Number(d.mtoPrecioUnitario || d.precioUnitario || 0),
              unidad: d.unidad || d.unidadMedida || 'NIU',
          }))
        : [];
}

// ─── Shalom ───────────────────────────────────────────────────────────────────

const SHALOM_COURIERS = new Set(['SHALOM_PRO', 'SHALOM_COD']);

const SHALOM_TIMELINE = [
    { key: 'registrado', label: 'Registrado' },
    { key: 'origen',     label: 'En origen' },
    { key: 'transito',   label: 'En tránsito' },
    { key: 'destino',    label: 'En destino / Agencia' },
    { key: 'entregado',  label: 'Entregado' },
];

function openBlob(blob: Blob, filename: string, mimeType: string) {
    const url = URL.createObjectURL(new Blob([blob], { type: mimeType }));
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    if (mimeType === 'application/pdf') a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function ShalomTrackingModal({ orderNumber, orderCode, onClose, onEntregado }: {
    orderNumber: string;
    orderCode: string;
    onClose: () => void;
    onEntregado?: () => Promise<void>;
}) {
    const [trackData, setTrackData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [blobLoading, setBlobLoading] = useState<'ticket' | 'label' | null>(null);
    const [markingEntregado, setMarkingEntregado] = useState(false);

    useEffect(() => {
        apiClient.post('/shalom/track', { orderNumber, orderCode })
            .then(res => {
                const payload = res.data?.data ?? res.data;
                setTrackData(payload);
            })
            .catch(() => setError('No se pudo obtener el tracking. Verifica el N° de orden.'))
            .finally(() => setLoading(false));
    }, [orderNumber, orderCode]);

    const openTicket = async () => {
        setBlobLoading('ticket');
        try {
            const res = await apiClient.get(`/shalom/ticket/${orderNumber}/${orderCode}`, { responseType: 'blob' });
            openBlob(res.data, `ticket-${orderNumber}.png`, 'image/png');
        } catch { useAlertStore.getState().alert('No se pudo obtener el ticket', 'error'); }
        finally { setBlobLoading(null); }
    };

    const openLabel = async () => {
        setBlobLoading('label');
        try {
            const res = await apiClient.get(`/shalom/label/${orderNumber}/${orderCode}`, { responseType: 'blob' });
            openBlob(res.data, `etiqueta-${orderNumber}.pdf`, 'application/pdf');
        } catch { useAlertStore.getState().alert('No se pudo obtener la etiqueta', 'error'); }
        finally { setBlobLoading(null); }
    };

    const search = trackData?.search?.data ?? trackData?.search ?? null;
    const statuses = trackData?.statuses?.data ?? trackData?.statuses ?? null;

    return (
        <div className="fixed inset-0 top-[-30px] z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50  " onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white dark:bg-[#111827] rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                            <Icon icon="solar:delivery-bold-duotone" className="text-white text-lg" />
                        </div>
                        <div>
                            <p className="text-white font-black text-sm">Tracking Shalom</p>
                            <p className="text-slate-400 text-xs">Orden #{orderNumber} · clave {orderCode}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                        <Icon icon="solar:close-circle-bold" />
                    </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                    {loading && (
                        <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
                            <Icon icon="eos-icons:loading" className="animate-spin text-xl" />
                            <span className="text-sm">Consultando Shalom...</span>
                        </div>
                    )}
                    {error && <p className="text-sm text-red-500 text-center py-6">{error}</p>}

                    {search && !loading && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-xs space-y-1.5">
                            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{search.contenido}</p>
                            <div className="flex gap-4 text-slate-500 dark:text-slate-400">
                                <span>De: <strong className="text-slate-700 dark:text-slate-200">{search.origen?.nombre}</strong></span>
                                <span>→</span>
                                <span>A: <strong className="text-slate-700 dark:text-slate-200">{search.destino?.nombre}</strong></span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400">
                                Destinatario: <strong className="text-slate-700 dark:text-slate-200">{search.destinatario?.nombre}</strong>
                            </p>
                            {search.entregado && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-bold">
                                    <Icon icon="solar:check-circle-bold" width={12} /> Entregado
                                </span>
                            )}
                        </div>
                    )}

                    {statuses && !loading && (
                        <div className="space-y-0">
                            {SHALOM_TIMELINE.map((step, i) => {
                                const ev = statuses[step.key];
                                const done = Boolean(ev?.fecha);
                                const isLast = i === SHALOM_TIMELINE.length - 1;
                                return (
                                    <div key={step.key} className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-3 h-3 rounded-full mt-0.5 flex-shrink-0 ${done ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                            {!isLast && <div className={`w-0.5 flex-1 my-0.5 ${done ? 'bg-indigo-200 dark:bg-indigo-900' : 'bg-slate-100 dark:bg-slate-800'}`} style={{ minHeight: 20 }} />}
                                        </div>
                                        <div className="pb-3">
                                            <p className={`text-sm font-semibold ${done ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>{step.label}</p>
                                            {ev?.fecha && <p className="text-xs text-slate-400 dark:text-slate-500">{ev.fecha}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {onEntregado && search?.entregado && (
                        <button
                            type="button"
                            disabled={markingEntregado}
                            onClick={async () => {
                                setMarkingEntregado(true);
                                try { await onEntregado(); onClose(); }
                                finally { setMarkingEntregado(false); }
                            }}
                            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60"
                        >
                            {markingEntregado
                                ? <Icon icon="eos-icons:loading" className="animate-spin" />
                                : <Icon icon="solar:check-circle-bold-duotone" />}
                            Marcar como entregado en el panel
                        </button>
                    )}
                    <div className="flex gap-3">
                        <button type="button" onClick={openTicket} disabled={blobLoading === 'ticket'}
                            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-60">
                            {blobLoading === 'ticket' ? <Icon icon="eos-icons:loading" className="animate-spin" /> : <Icon icon="solar:ticket-bold-duotone" />}
                            Ver ticket
                        </button>
                        <button type="button" onClick={openLabel} disabled={blobLoading === 'label'}
                            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60">
                            {blobLoading === 'label' ? <Icon icon="eos-icons:loading" className="animate-spin" /> : <Icon icon="solar:tag-price-bold-duotone" />}
                            Etiqueta PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function PanelVentasView() {
    const vm = usePanelVentasViewModel();
    const navigate = useNavigate();
    const { alert } = useAlertStore();

    const [detalleId, setDetalleId] = useState<number | null>(null);
    const [editDespachoId, setEditDespachoId] = useState<number | null>(null);
    const [trazabilidadItem, setTrazabilidadItem] = useState<VentaPanelItem | null>(null);
    const [waItem, setWaItem] = useState<VentaPanelItem | null>(null);
    const [pagoItem, setPagoItem] = useState<VentaPanelItem | null>(null);
    const [historialItem, setHistorialItem] = useState<VentaPanelItem | null>(null);
    const [detalleCuentaItem, setDetalleCuentaItem] = useState<VentaPanelItem | null>(null);
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [menuItem, setMenuItem] = useState<VentaPanelItem | null>(null);
    const [shalomTracking, setShalomTracking] = useState<{ orderNumber: string; orderCode: string; item: VentaPanelItem } | null>(null);
    const [anularItem, setAnularItem] = useState<VentaPanelItem | null>(null);
    const { cancelInvoice } = useInvoiceStore((s) => s);

    const handleOpenMenu = (e: React.MouseEvent<HTMLElement>, item: VentaPanelItem) => {
        e.stopPropagation();
        setMenuAnchor(e.currentTarget);
        setMenuItem(item);
    };
    const handleCloseMenu = () => {
        setMenuAnchor(null);
        setMenuItem(null);
    };

    const parseSerie = (ref: string) => ref.split('-')[0] ?? ref;
    const parseCorrelativo = (ref: string) => {
        const parts = ref.split('-');
        return parts.length > 1 ? parseInt(parts[parts.length - 1], 10) || 0 : 0;
    };

    const toComprobanteObj = (item: VentaPanelItem) => ({
        id: item.comprobanteId,
        serie: parseSerie(item.referencia),
        correlativo: parseCorrelativo(item.referencia),
        mtoImpVenta: item.total,
        saldo: item.saldo,
        estadoPago: item.estadoPagoRaw,
        fechaEmision: item.fecha,
        formaPagoTipo: item.formaPagoTipo,
        montoDetraccion: item.montoDetraccion,
        porcentajeDetraccion: item.porcentajeDetraccion,
        cuotas: item.cuotas,
        observaciones: item.observaciones,
        cliente: { nombre: item.cliente, nroDoc: null },
        comprobante: TIPO_CONFIG[item.tipo]?.label ?? item.tipo,
    });

    const puedeRegistrarCobro = (item: VentaPanelItem) =>
        item.comprobanteId !== null && (item.estadoPago === 'PARCIAL' || item.estadoPago === 'PENDIENTE');

    // Guarda: ¿se puede convertir este comprobante informal a boleta/factura?
    const puedeDocumentarComprobante = (item: VentaPanelItem) =>
        item.comprobanteId !== null &&
        TIPOS_INFORMALES.has(item.tipo) &&
        !item.esConvertida &&
        item.estadoPago === 'PAGADO';

    // Guarda: ¿se puede documentar este pedido de tienda?
    const puedeDocumentarPedidoTienda = (item: VentaPanelItem) =>
        item.tipo === 'PEDIDO_TIENDA' &&
        item.estadoPago === 'PAGADO';

    const convertirComprobante = useCallback(async (item: VentaPanelItem, defaultType: 'BOLETA' | 'FACTURA') => {
        if (!item.comprobanteId) return;
        try {
            const { data } = await apiClient.get<any>(`/comprobante/${item.comprobanteId}`);
            const comp = data?.data ?? data;
            const cliente = comp?.cliente || null;
            const esRuc = String(cliente?.nroDoc || '').length === 11;
            navigate('/administrador/facturacion/nuevo', {
                state: {
                    defaultType,
                    fromNotaDeVenta: true,
                    notaDeVentaData: {
                        origenComprobanteId: item.comprobanteId,
                        cliente: defaultType === 'FACTURA' && !esRuc ? null : cliente,
                        clienteId: defaultType === 'FACTURA' && !esRuc ? null : comp?.clienteId,
                        observaciones: comp?.observaciones,
                        productos: mapProductosComprobante(comp),
                    },
                },
            });
        } catch {
            alert('No se pudo cargar el comprobante para convertirlo', 'error');
        }
    }, [navigate, alert]);

    const convertirGuiaComprobante = useCallback(async (item: VentaPanelItem) => {
        if (!item.comprobanteId) return;
        try {
            const { data } = await apiClient.get<any>(`/comprobante/${item.comprobanteId}`);
            const comp = data?.data ?? data;
            navigate('/administrador/facturacion/guia-remision', {
                state: {
                    fromDespachoComprobante: true,
                    comprobanteGuia: {
                        id: item.comprobanteId,
                        referencia: item.referencia,
                        clienteNombre: comp?.cliente?.nombre || item.cliente,
                        clienteNroDoc: comp?.cliente?.nroDoc || '10000000',
                        clienteDireccion: item.agenciaDestino && item.agenciaDestino !== '—' ? item.agenciaDestino : comp?.cliente?.direccion || '',
                        agenciaEnvio: item.tipoEnvio,
                        items: mapProductosComprobante(comp),
                    },
                },
            });
        } catch {
            alert('No se pudo cargar el comprobante para generar la guía', 'error');
        }
    }, [navigate, alert]);

    const convertirPedidoTienda = useCallback(async (item: VentaPanelItem, defaultType: 'BOLETA' | 'FACTURA') => {
        if (!item.pedidoId) return;
        try {
            const { data } = await apiClient.get<any>(`/tienda/pedidos/${item.pedidoId}`);
            const pedido = data?.data ?? data;
            navigate('/administrador/facturacion/nuevo', {
                state: {
                    defaultType,
                    defaultClient: 'CLIENTES_VARIOS',
                    fromPedidoTienda: true,
                    pedidoTiendaData: {
                        id: item.pedidoId,
                        codigoSeguimiento: item.referencia,
                        clienteNombre: item.cliente,
                        clienteTelefono: item.celularDest || '',
                        clienteDireccion: item.agenciaDestino && item.agenciaDestino !== '—' ? item.agenciaDestino : '',
                        tipoEntrega: 'ENVIO',
                        estadoEntrega: item.estadoDespacho === 'ENTREGADO' ? 'ENTREGADO_COMPLETADO' : 'CONFIRMADO',
                        estadoEnvio: item.estadoDespacho,
                        agenciaEnvio: item.tipoEnvio,
                        total: item.total,
                        montoPagado: item.total,
                        saldoPendiente: 0,
                        items: pedido?.items || pedido?.detalles || [],
                    },
                },
            });
        } catch {
            alert('No se pudo cargar el pedido para convertirlo', 'error');
        }
    }, [navigate, alert]);

    const convertirGuiaPedidoTienda = useCallback(async (item: VentaPanelItem) => {
        if (!item.pedidoId) return;
        navigate('/administrador/facturacion/guia-remision', {
            state: {
                fromPedidoTienda: true,
                pedidoTiendaGuia: {
                    id: item.pedidoId,
                    codigoSeguimiento: item.referencia,
                    clienteNombre: item.cliente,
                    clienteTelefono: item.celularDest || '',
                    clienteDireccion: item.agenciaDestino && item.agenciaDestino !== '—' ? item.agenciaDestino : '',
                    tipoEntrega: 'ENVIO',
                    estadoEnvio: item.estadoDespacho,
                    agenciaEnvio: item.tipoEnvio,
                    total: item.total,
                    montoPagado: item.total,
                    saldoPendiente: 0,
                    items: [],
                },
            },
        });
    }, [navigate]);

    const TABS: { key: TabVentas; label: string; count: number }[] = [
        { key: 'TODO',         label: 'Todo',         count: vm.countTodo },
        { key: 'VENTAS',       label: 'Ventas',       count: vm.countVentas },
        { key: 'CON_DESPACHO', label: 'Con despacho', count: vm.countDespacho },
    ];

    return (
        <div className="p-4 md:p-6 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">Panel de Ventas</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        {vm.filtrados.length} registro{vm.filtrados.length !== 1 ? 's' : ''} ·{' '}
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            S/ {vm.totalVentas.toFixed(2)}
                        </span>
                        {vm.totalPorCobrar > 0 && (
                            <>
                                {' '}·{' '}
                                <span className="font-semibold text-red-500 dark:text-red-400">
                                    S/ {vm.totalPorCobrar.toFixed(2)} por cobrar
                                </span>
                            </>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => vm.setFecha(moment(vm.fecha).subtract(1, 'day').format('YYYY-MM-DD'))}
                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                    >
                        <Icon icon="solar:arrow-left-linear" className="text-lg" />
                    </button>
                    <input
                        type="date"
                        value={vm.fecha}
                        onChange={(e) => vm.setFecha(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                        onClick={() => vm.setFecha(moment(vm.fecha).add(1, 'day').format('YYYY-MM-DD'))}
                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                    >
                        <Icon icon="solar:arrow-right-linear" className="text-lg" />
                    </button>
                    <button
                        onClick={vm.cargar}
                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                        title="Recargar"
                    >
                        <Icon icon="solar:refresh-linear" className={`text-lg ${vm.loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Tabs + filtros */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {TABS.map((t) => (
                        <TabBtn key={t.key} active={vm.tab === t.key} onClick={() => vm.setTab(t.key)} label={t.label} count={t.count} />
                    ))}
                </div>
                <div className="flex gap-2 flex-wrap ml-auto">
                    {/* Filtro repartidor */}
                    {vm.repartidoresOpciones.length > 0 && (
                        <select
                            value={vm.filtroRepartidorId === undefined ? '' : vm.filtroRepartidorId === null ? 'sin' : String(vm.filtroRepartidorId)}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (v === '') vm.setFiltroRepartidorId(undefined);
                                else if (v === 'sin') vm.setFiltroRepartidorId(null);
                                else vm.setFiltroRepartidorId(Number(v));
                            }}
                            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="">Todos los repartidores</option>
                            <option value="sin">Sin asignar</option>
                            {vm.repartidoresOpciones
                                .filter((r) => r.id !== null)
                                .map((r) => (
                                    <option key={r.id} value={String(r.id)}>{r.nombre}</option>
                                ))}
                        </select>
                    )}
                    {/* Búsqueda */}
                    <div className="relative">
                        <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={vm.busqueda}
                            onChange={(e) => vm.setBusqueda(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48"
                        />
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800/50">
                                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Fecha</th>
                                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Referencia</th>
                                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Tipo</th>
                                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Cliente</th>
                                <th className="px-3 py-3 text-right text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Total</th>
                                <th className="px-3 py-3 text-right text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Saldo</th>
                                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">M.Pago</th>
                                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Pago</th>
                                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">SUNAT</th>
                                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Despacho</th>
                                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Turno</th>
                                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Celular</th>
                                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Agencia</th>
                                <th className="px-3 py-3 text-center text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">Paq.</th>
                                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Repartidor</th>
                                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Vendedor</th>
                                <th className="px-3 py-3 text-center text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Acc.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                            {vm.loading ? (
                                <tr>
                                    <td colSpan={17} className="py-16 text-center text-gray-400 dark:text-slate-500">
                                        <Icon icon="eos-icons:loading" className="text-3xl animate-spin mx-auto mb-2" />
                                        <p className="text-sm">Cargando ventas...</p>
                                    </td>
                                </tr>
                            ) : vm.filtrados.length === 0 ? (
                                <tr>
                                    <td colSpan={17} className="py-16 text-center text-gray-400 dark:text-slate-500">
                                        <Icon icon="solar:sad-square-linear" className="text-4xl mx-auto mb-2 opacity-40" />
                                        <p className="text-sm">No hay ventas para este día</p>
                                    </td>
                                </tr>
                            ) : (
                                vm.filtrados.map((item) => {
                                    const tipoConf = TIPO_CONFIG[item.tipo] ?? { label: item.tipo, cls: 'bg-slate-100 text-slate-500' };
                                    const pagoConf = PAGO_CONFIG[item.estadoPago] ?? PAGO_CONFIG.PENDIENTE;
                                    const sunatConf = SUNAT_CONFIG[item.estadoSunat] ?? SUNAT_CONFIG.NO_APLICA;
                                    const rowCls = item.esConvertida
                                        ? 'opacity-50 bg-slate-50/60 dark:bg-slate-900/40'
                                        : 'hover:bg-gray-50/50 dark:hover:bg-slate-800/40';

                                    return (
                                        <tr key={`${item.tipo}-${item.id}`} className={`transition-colors ${rowCls}`}>
                                            <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                                                <div>{moment(item.fecha).format('DD/MM/YY')}</div>
                                                <div className="text-[10px] opacity-70">{moment(item.fecha).format('HH:mm')}</div>
                                            </td>
                                            <td className="px-3 py-2.5 font-mono text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                <span className={item.esConvertida ? 'line-through' : ''}>
                                                    {item.referencia}
                                                </span>
                                                {item.esConvertida && item.convertidaEn && (
                                                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                                                        → {item.convertidaEn}
                                                    </div>
                                                )}
                                                {item.origenReferencia && (
                                                    <div className="text-[10px] text-violet-500 font-normal mt-0.5">
                                                        origen: {item.origenReferencia}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <div className="flex flex-col gap-0.5">
                                                    <Badge label={tipoConf.label} cls={tipoConf.cls} />
                                                    {item.esConvertida && (
                                                        <Badge label="Convertida" cls="bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-gray-800 dark:text-gray-200 max-w-[140px] truncate" title={item.cliente}>
                                                {item.cliente}
                                            </td>
                                            <td className="px-3 py-2.5 text-xs font-bold text-right whitespace-nowrap">
                                                <span className={item.esConvertida ? 'line-through text-slate-400' : 'text-gray-900 dark:text-white'}>
                                                    S/ {item.total.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-xs font-bold text-right whitespace-nowrap">
                                                {item.saldo > 0 ? (
                                                    <span className="text-red-500 dark:text-red-400">
                                                        S/ {item.saldo.toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600">—</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                {item.metodoPago}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <Badge label={pagoConf.label} cls={pagoConf.cls} />
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <Badge label={sunatConf.label} cls={sunatConf.cls} />
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <EstadoDespachoSelector item={item} onChange={vm.actualizarEstado} />
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                {item.estadoDespacho !== 'NO_APLICA' ? (item.turnoEnvio ?? '—') : '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                {item.estadoDespacho !== 'NO_APLICA' ? (item.celularDest ?? '—') : '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400 max-w-[120px] truncate" title={item.agenciaDestino}>
                                                {item.estadoDespacho !== 'NO_APLICA' ? (item.agenciaDestino ?? '—') : '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-center text-gray-600 dark:text-gray-400">
                                                {item.estadoDespacho !== 'NO_APLICA' ? (item.nroPaquetes ?? '—') : '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap max-w-[100px] truncate" title={item.repartidor}>
                                                {item.estadoDespacho !== 'NO_APLICA' ? item.repartidor : '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400 max-w-[100px] truncate" title={item.vendedor}>
                                                {item.vendedor}
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleOpenMenu(e, item)}
                                                    className="px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors mx-auto"
                                                >
                                                    <Icon icon="mdi:dots-vertical" width={18} height={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modales */}
            {detalleId && (
                <ModalDetalleComprobante
                    comprobanteId={detalleId}
                    isOpen={true}
                    onClose={() => setDetalleId(null)}
                />
            )}
            {editDespachoId && (
                <EditarDespachoModal
                    comprobanteId={editDespachoId}
                    onClose={() => setEditDespachoId(null)}
                    onSuccess={() => { setEditDespachoId(null); vm.cargar(); }}
                />
            )}
            {trazabilidadItem?.comprobanteId && (
                <ModalTrazabilidad
                    comprobanteId={trazabilidadItem.comprobanteId}
                    referencia={trazabilidadItem.referencia}
                    cliente={trazabilidadItem.cliente}
                    onClose={() => setTrazabilidadItem(null)}
                />
            )}
            {waItem?.comprobanteId && (
                <ModalEnviarWhatsApp
                    isOpen={true}
                    onClose={() => setWaItem(null)}
                    comprobante={{
                        id: waItem.comprobanteId,
                        serie: parseSerie(waItem.referencia),
                        correlativo: parseCorrelativo(waItem.referencia),
                        comprobante: TIPO_CONFIG[waItem.tipo]?.label ?? waItem.tipo,
                        total: waItem.total,
                        clienteNombre: waItem.cliente,
                    }}
                />
            )}

            {/* Cobros inline */}
            {pagoItem?.comprobanteId && (
                <ModalRegistrarPago
                    comprobante={toComprobanteObj(pagoItem)}
                    onClose={() => setPagoItem(null)}
                    onSuccess={() => { setPagoItem(null); vm.cargar(); }}
                />
            )}
            {historialItem?.comprobanteId && (
                <ModalHistorialPagos
                    comprobante={toComprobanteObj(historialItem)}
                    onClose={() => setHistorialItem(null)}
                />
            )}
            {detalleCuentaItem?.comprobanteId && (
                <ModalDetalleCuenta
                    comprobante={toComprobanteObj(detalleCuentaItem)}
                    onClose={() => setDetalleCuentaItem(null)}
                />
            )}

            {/* Dropdown de acciones por fila */}
            <TableActionMenu
                isOpen={Boolean(menuAnchor)}
                anchorEl={menuAnchor}
                onClose={handleCloseMenu}
            >
                {menuItem && (() => {
                    const it = menuItem;
                    const canDetalle = Boolean(it.comprobanteId);
                    const canDespacho = Boolean(it.comprobanteId) && it.estadoDespacho !== 'NO_APLICA';
                    const canWa = Boolean(it.comprobanteId);
                    const canConvertirComp = puedeDocumentarComprobante(it);
                    const canConvertirPedido = puedeDocumentarPedidoTienda(it);
                    const canCobro = puedeRegistrarCobro(it);

                    return (
                        <>
                            {/* — Visualización — */}
                            {canDetalle && (
                                <button type="button"
                                    onClick={() => { setDetalleId(it.comprobanteId); handleCloseMenu(); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium"
                                >
                                    <Icon icon="solar:eye-bold-duotone" width={15} />
                                    <span>Ver detalle</span>
                                </button>
                            )}
                            {canWa && (
                                <button type="button"
                                    onClick={() => { setWaItem(it); handleCloseMenu(); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                >
                                    <Icon icon="mdi:whatsapp" width={15} />
                                    <span>Enviar WhatsApp / Email</span>
                                </button>
                            )}

                            {/* — Despacho — */}
                            {canDespacho && (
                                <>
                                    <div className="border-t border-gray-100 dark:border-slate-700 my-0.5" />
                                    <button type="button"
                                        onClick={() => { setEditDespachoId(it.comprobanteId); handleCloseMenu(); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                    >
                                        <Icon icon="solar:delivery-bold-duotone" width={15} />
                                        <span>Editar despacho</span>
                                    </button>
                                    <button type="button"
                                        onClick={() => { setTrazabilidadItem(it); handleCloseMenu(); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                    >
                                        <Icon icon="solar:map-point-wave-bold-duotone" width={15} />
                                        <span>Trazabilidad</span>
                                    </button>
                                    {SHALOM_COURIERS.has(it.courier) && (
                                        <button type="button"
                                            onClick={() => {
                                                handleCloseMenu();
                                                if (!it.nroOrden) {
                                                    useAlertStore.getState().alert('Agrega el N° de orden Shalom en "Editar despacho" primero', 'warning');
                                                    return;
                                                }
                                                setShalomTracking({ orderNumber: it.nroOrden, orderCode: it.claveOrden ?? '', item: it });
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                        >
                                            <Icon icon="solar:delivery-bold-duotone" width={15} />
                                            <span>{it.nroOrden ? `Tracking Shalom #${it.nroOrden}` : 'Tracking Shalom (sin N° orden)'}</span>
                                        </button>
                                    )}
                                </>
                            )}

                            {/* — Conversión informal → formal — */}
                            {canConvertirComp && (
                                <>
                                    <div className="border-t border-gray-100 dark:border-slate-700 my-0.5" />
                                    <button type="button"
                                        onClick={() => { convertirComprobante(it, 'BOLETA'); handleCloseMenu(); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 font-medium"
                                    >
                                        <Icon icon="solar:bill-list-bold-duotone" width={15} />
                                        <span>Convertir a Boleta</span>
                                    </button>
                                    <button type="button"
                                        onClick={() => { convertirComprobante(it, 'FACTURA'); handleCloseMenu(); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium"
                                    >
                                        <Icon icon="solar:document-add-bold-duotone" width={15} />
                                        <span>Convertir a Factura</span>
                                    </button>
                                    <button type="button"
                                        onClick={() => { convertirGuiaComprobante(it); handleCloseMenu(); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-medium"
                                    >
                                        <Icon icon="solar:route-bold-duotone" width={15} />
                                        <span>Hacer Guía de Remisión</span>
                                    </button>
                                </>
                            )}

                            {/* — Conversión pedido tienda → formal — */}
                            {canConvertirPedido && (
                                <>
                                    <div className="border-t border-gray-100 dark:border-slate-700 my-0.5" />
                                    <button type="button"
                                        onClick={() => { convertirPedidoTienda(it, 'BOLETA'); handleCloseMenu(); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 font-medium"
                                    >
                                        <Icon icon="solar:bill-list-bold-duotone" width={15} />
                                        <span>Hacer Boleta</span>
                                    </button>
                                    <button type="button"
                                        onClick={() => { convertirPedidoTienda(it, 'FACTURA'); handleCloseMenu(); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium"
                                    >
                                        <Icon icon="solar:document-add-bold-duotone" width={15} />
                                        <span>Hacer Factura</span>
                                    </button>
                                    <button type="button"
                                        onClick={() => { convertirGuiaPedidoTienda(it); handleCloseMenu(); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-medium"
                                    >
                                        <Icon icon="solar:route-bold-duotone" width={15} />
                                        <span>Hacer Guía de Remisión</span>
                                    </button>
                                </>
                            )}

                            {/* — Cobros — */}
                            {(canCobro || canDetalle) && (
                                <>
                                    <div className="border-t border-gray-100 dark:border-slate-700 my-0.5" />
                                    {canCobro && (
                                        <button type="button"
                                            onClick={() => { setPagoItem(it); handleCloseMenu(); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-medium"
                                        >
                                            <Icon icon="solar:hand-money-bold-duotone" width={15} />
                                            <span>Registrar cobro</span>
                                        </button>
                                    )}
                                    {canDetalle && (
                                        <>
                                            <button type="button"
                                                onClick={() => { setHistorialItem(it); handleCloseMenu(); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                                            >
                                                <Icon icon="solar:history-bold-duotone" width={15} />
                                                <span>Historial de pagos</span>
                                            </button>
                                            <button type="button"
                                                onClick={() => { setDetalleCuentaItem(it); handleCloseMenu(); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                                            >
                                                <Icon icon="solar:document-text-bold-duotone" width={15} />
                                                <span>Detalle de cuenta</span>
                                            </button>
                                        </>
                                    )}
                                </>
                            )}

                            {/* — Anular — */}
                            {it.comprobanteId && it.estadoSunat !== 'ANULADO' && !it.esConvertida && (
                                <>
                                    <div className="border-t border-gray-100 dark:border-slate-700 my-0.5" />
                                    <button type="button"
                                        onClick={() => { setAnularItem(it); handleCloseMenu(); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <Icon icon="mdi:cancel" width={15} />
                                        <span>Anular</span>
                                    </button>
                                </>
                            )}
                        </>
                    );
                })()}
            </TableActionMenu>

            {/* Modal confirmación anulación */}
            {anularItem && (
                <div className="fixed inset-0 z-[999999] top-[-30px] flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Anular comprobante</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">
                            ¿Estás seguro que deseas anular este comprobante? Se revertirá el stock y se eliminarán los pagos registrados.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setAnularItem(null)}
                                className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={async () => {
                                    const id = anularItem.comprobanteId!;
                                    setAnularItem(null);
                                    const res = await cancelInvoice(id);
                                    if (res.success) vm.cargar();
                                }}
                                className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700"
                            >
                                Sí, anular
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {shalomTracking && (
                <ShalomTrackingModal
                    orderNumber={shalomTracking.orderNumber}
                    orderCode={shalomTracking.orderCode}
                    onClose={() => setShalomTracking(null)}
                    onEntregado={async () => { await vm.actualizarEstado(shalomTracking.item, 'ENTREGADO'); }}
                />
            )}
        </div>
    );
}
