import { useState, useEffect, useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react';
import moment from 'moment';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';
import DataTable from '@/components/Datatable';
import { Calendar } from '@/components/Date';
import { useLocation, useNavigate } from 'react-router-dom';
import { EditarDespachoModal } from './EditarDespachoModal';
import { ModalTrazabilidad } from './ModalTrazabilidad';
import { useRepartidoresStore } from '@/zustand/repartidores';

const ESTADOS_WA_NOTIFICADOS = new Set(['EN_CAMINO', 'ENTREGADO']);

const WA_CONFIG_DEFAULTS = {
    mensajeEnCamino: 'Hola {{nombre}}, tu pedido {{pedido}} ya está en camino 🚚. Repartidor: {{repartidor}}.',
    mensajeEntregado: 'Hola {{nombre}}, tu pedido {{pedido}} fue entregado exitosamente ✅. ¡Gracias por tu preferencia!',
};

function buildWaMessage(item: DespachoItem, config: typeof WA_CONFIG_DEFAULTS): string {
    const interpolar = (tpl: string) =>
        tpl
            .replace(/\{\{nombre\}\}/g, item.cliente || 'Cliente')
            .replace(/\{\{pedido\}\}/g, item.referencia || '')
            .replace(/\{\{repartidor\}\}/g, item.repartidor || 'nuestro repartidor')
            .replace(/\{\{empresa\}\}/g, 'nuestra empresa');

    switch (item.estado) {
        case 'PREPARANDO':
        case 'POR_COORDINAR':
            return `Hola ${item.cliente}, estamos preparando tu pedido ${item.referencia} para el envío. Pronto te avisamos cuando esté en camino. 📦`;
        case 'EN_CAMINO':
        case 'EN_REPARTO':
        case 'ENVIADO':
            return interpolar(config.mensajeEnCamino);
        case 'EN_DESTINO':
            return `Hola ${item.cliente}, tu pedido ${item.referencia} está llegando a su destino. ¡Por favor estate atento! 🚚`;
        case 'ENTREGADO':
        case 'ENTREGADO_COMPLETADO':
            return interpolar(config.mensajeEntregado);
        case 'DEVUELTO':
        case 'INCIDENCIA':
            return `Hola ${item.cliente}, hubo un inconveniente con tu pedido ${item.referencia}. Por favor contáctanos para coordinar. Disculpa las molestias. 🙏`;
        default:
            return `Hola ${item.cliente}, tu pedido ${item.referencia} está siendo procesado. Gracias.`;
    }
}

const ESTADO_COLOR: Record<string, string> = {
    PREPARANDO: 'bg-amber-50 text-amber-700 border-amber-200',
    EN_CAMINO: 'bg-blue-50 text-blue-700 border-blue-200',
    EN_DESTINO: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    ENTREGADO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    DEVUELTO: 'bg-red-50 text-red-700 border-red-200',
    SIN_ASIGNAR: 'bg-slate-100 text-slate-600 border-slate-200',
    POR_COORDINAR: 'bg-amber-50 text-amber-700 border-amber-200',
    ENVIADO: 'bg-blue-50 text-blue-700 border-blue-200',
    EN_REPARTO: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    INCIDENCIA: 'bg-red-50 text-red-700 border-red-200',
    NO_APLICA: 'bg-slate-50 text-slate-400 border-slate-100',
};

const ESTADOS_DESPACHO = [
    { value: 'PREPARANDO', label: 'Preparando' },
    { value: 'EN_CAMINO', label: 'En camino' },
    { value: 'EN_DESTINO', label: 'En destino' },
    { value: 'ENTREGADO', label: 'Entregado' },
    { value: 'DEVUELTO', label: 'Devuelto' },
];

const DESPACHO_TO_PEDIDO: Record<string, { estadoEntrega: string; estadoEnvio: string }> = {
    PREPARANDO: { estadoEntrega: 'CONFIRMADO', estadoEnvio: 'POR_COORDINAR' },
    EN_CAMINO: { estadoEntrega: 'EN_TRANSITO', estadoEnvio: 'EN_REPARTO' },
    EN_DESTINO: { estadoEntrega: 'EN_TRANSITO', estadoEnvio: 'EN_REPARTO' },
    ENTREGADO: { estadoEntrega: 'ENTREGADO_COMPLETADO', estadoEnvio: 'ENTREGADO' },
    DEVUELTO: { estadoEntrega: 'PENDIENTE', estadoEnvio: 'INCIDENCIA' },
};

const toDespachoEstado = (estado: string) => {
    if (ESTADOS_DESPACHO.some(e => e.value === estado)) return estado;
    if (['POR_COORDINAR', 'SIN_ASIGNAR', 'NO_APLICA'].includes(estado)) return 'PREPARANDO';
    if (['ENVIADO', 'EN_REPARTO'].includes(estado)) return 'EN_CAMINO';
    if (['ENTREGADO_COMPLETADO'].includes(estado)) return 'ENTREGADO';
    if (['INCIDENCIA'].includes(estado)) return 'DEVUELTO';
    return 'PREPARANDO';
};

const COURIER_LABEL: Record<string, string> = {
    SHALOM_PRO: 'Shalom PRO',
    SHALOM_COD: 'Shalom COD',
    OLVA: 'Olva Courier',
    URBANO: 'Urbano Express',
    CRUZ_SUR: 'Cruz del Sur',
    PROPIOS: 'Reparto propio',
    RECOJO_TIENDA: 'Recojo tienda',
    SIN_AGENCIA: 'Sin agencia',
    OTRO: 'Otro',
};

const COURIER_COLOR: Record<string, string> = {
    SHALOM_PRO: 'bg-slate-900 text-white',
    SHALOM_COD: 'bg-red-600 text-white',
    OLVA: 'bg-emerald-600 text-white',
    URBANO: 'bg-orange-500 text-white',
    CRUZ_SUR: 'bg-blue-700 text-white',
    PROPIOS: 'bg-fuchsia-600 text-white',
    RECOJO_TIENDA: 'bg-blue-600 text-white',
    SIN_AGENCIA: 'bg-slate-100 text-slate-600',
    OTRO: 'bg-slate-400 text-white',
};

const normalizeCourier = (value: string | null | undefined) => {
    if (!value || value === '—') return 'PROPIOS';
    if (COURIER_LABEL[value]) return value;
    const label = value.toUpperCase();
    if (label.includes('SHALOM') && label.includes('COD')) return 'SHALOM_COD';
    if (label.includes('SHALOM')) return 'SHALOM_PRO';
    if (label.includes('OLVA')) return 'OLVA';
    if (label.includes('URBANO')) return 'URBANO';
    if (label.includes('CRUZ')) return 'CRUZ_SUR';
    if (label.includes('RECOJO')) return 'RECOJO_TIENDA';
    if (label.includes('PROPIO')) return 'PROPIOS';
    if (label.includes('SIN')) return 'SIN_AGENCIA';
    return 'OTRO';
};

interface DespachoItem {
    tipo: 'COMPROBANTE' | 'PEDIDO_TIENDA';
    id: number;
    comprobanteId?: number;
    comprobanteTipoDoc?: string | null;
    pedidoId?: number;
    referencia: string;
    cliente: string;
    telefono: string;
    vendedor: string;
    total: number;
    montoPagado?: number;
    saldoPendiente?: number;
    courier: string;
    tipoEnvio: string;
    agenciaDestino: string;
    celularDest: string;
    nroPaquetes: number;
    turnoEnvio: string;
    codigoGuia: string;
    estado: string;
    creadoEn: string;
    repartidorId?: number | null;
    repartidor?: string;
    estadoEntrega?: string;
    items?: Array<{
        productoId?: number | null;
        cantidad: number;
        precioUnit?: number;
        producto?: { id?: number; codigo?: string | null; descripcion?: string | null } | null;
    }>;
}

interface RepartidorStat {
    repartidorId: number | null;
    nombre: string;
    preparando: number;
    enCamino: number;
    entregado: number;
    total: number;
}

const HEADER_COLUMNS = ['Tipo', 'Referencia', 'Cliente', 'Vendedor', 'Courier', 'Agencia destino', 'Celular', 'Paquetes', 'Guía', 'Total', 'Estado', 'Acciones'];

interface HistorialPedidoEntry {
    id: number;
    estadoAnterior: string | null;
    estadoNuevo: string;
    creadoEn: string;
    notas?: string | null;
    usuario?: { nombre?: string | null } | null;
}

interface EditarPedidoTiendaDespachoModalProps {
    item: DespachoItem;
    onClose: () => void;
    onSuccess: () => void;
}

function EditarPedidoTiendaDespachoModal({ item, onClose, onSuccess }: EditarPedidoTiendaDespachoModalProps) {
    const { repartidores, fetchRepartidores, loading: loadingRepartidores } = useRepartidoresStore();
    const { alert } = useAlertStore();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        agenciaEnvio: normalizeCourier(item.courier),
        clienteDireccion: item.agenciaDestino && item.agenciaDestino !== '—' ? item.agenciaDestino : '',
        clienteTelefono: item.celularDest || item.telefono || '',
        numeroTracking: item.codigoGuia || '',
        repartidorId: item.repartidorId ? String(item.repartidorId) : '',
        notasInternas: '',
    });

    useEffect(() => {
        fetchRepartidores();
    }, [fetchRepartidores]);

    const updateField = (field: keyof typeof form, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const guardar = async () => {
        if (!item.pedidoId) return;
        if (!form.clienteTelefono.trim()) {
            alert('Ingresa el celular de entrega', 'warning');
            return;
        }
        setSaving(true);
        try {
            await apiClient.patch(`/tienda/pedidos/${item.pedidoId}/estado`, {
                agenciaEnvio: form.agenciaEnvio,
                clienteDireccion: form.clienteDireccion.trim(),
                clienteTelefono: form.clienteTelefono.trim(),
                numeroTracking: form.numeroTracking.trim(),
                repartidorId: form.repartidorId ? Number(form.repartidorId) : null,
                notasInternas: form.notasInternas.trim(),
            });
            alert('Despacho del pedido actualizado', 'success');
            onSuccess();
        } catch {
            alert('Error al actualizar el pedido de tienda', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
            <div className="w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <span className="h-11 w-11 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
                            <Icon icon="solar:delivery-bold-duotone" className="text-2xl" />
                        </span>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">Editar despacho tienda</h2>
                            <p className="text-xs text-slate-500">{item.referencia} · {item.cliente}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                        <Icon icon="solar:close-circle-linear" className="text-xl" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                    <label className="space-y-1.5">
                        <span className="text-[11px] font-black uppercase text-slate-500">Courier / modalidad</span>
                        <select
                            value={form.agenciaEnvio}
                            onChange={e => updateField('agenciaEnvio', e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 text-sm text-slate-800 dark:text-white outline-none"
                        >
                            {Object.entries(COURIER_LABEL).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </label>

                    <label className="space-y-1.5">
                        <span className="text-[11px] font-black uppercase text-slate-500">Repartidor</span>
                        <select
                            value={form.repartidorId}
                            onChange={e => updateField('repartidorId', e.target.value)}
                            disabled={loadingRepartidores}
                            className="h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 text-sm text-slate-800 dark:text-white outline-none"
                        >
                            <option value="">Sin asignar</option>
                            {repartidores.filter(r => r.activo).map(r => (
                                <option key={r.id} value={r.id}>{r.nombre}</option>
                            ))}
                        </select>
                    </label>

                    <label className="space-y-1.5 md:col-span-2">
                        <span className="text-[11px] font-black uppercase text-slate-500">Dirección / destino</span>
                        <input
                            value={form.clienteDireccion}
                            onChange={e => updateField('clienteDireccion', e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 text-sm text-slate-800 dark:text-white outline-none"
                            placeholder="Dirección de entrega"
                        />
                    </label>

                    <label className="space-y-1.5">
                        <span className="text-[11px] font-black uppercase text-slate-500">Celular entrega</span>
                        <input
                            value={form.clienteTelefono}
                            onChange={e => updateField('clienteTelefono', e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 text-sm text-slate-800 dark:text-white outline-none"
                            placeholder="999999999"
                        />
                    </label>

                    <label className="space-y-1.5">
                        <span className="text-[11px] font-black uppercase text-slate-500">Guía / tracking</span>
                        <input
                            value={form.numeroTracking}
                            onChange={e => updateField('numeroTracking', e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 text-sm text-slate-800 dark:text-white outline-none"
                            placeholder="Código de guía"
                        />
                    </label>

                    <label className="space-y-1.5 md:col-span-2">
                        <span className="text-[11px] font-black uppercase text-slate-500">Nota interna</span>
                        <textarea
                            value={form.notasInternas}
                            onChange={e => updateField('notasInternas', e.target.value)}
                            rows={3}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-white outline-none resize-none"
                            placeholder="Indicaciones para despacho"
                        />
                    </label>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 px-6 py-4">
                    <button type="button" onClick={onClose} className="h-11 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300">
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={guardar}
                        disabled={saving}
                        className="h-11 px-5 rounded-xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {saving ? 'Guardando...' : 'Guardar despacho'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ModalTrazabilidadPedidoTienda({ item, onClose }: { item: DespachoItem; onClose: () => void }) {
    const { alert } = useAlertStore();
    const [loading, setLoading] = useState(true);
    const [historial, setHistorial] = useState<HistorialPedidoEntry[]>([]);

    useEffect(() => {
        if (!item.pedidoId) return;
        setLoading(true);
        apiClient.get(`/tienda/pedidos/${item.pedidoId}/historial`)
            .then(({ data }) => {
                const payload = data?.data ?? data;
                setHistorial(Array.isArray(payload) ? payload.slice().reverse() : []);
            })
            .catch(() => alert('Error al cargar trazabilidad del pedido', 'error'))
            .finally(() => setLoading(false));
    }, [item.pedidoId, alert]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
            <div className="w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <span className="h-11 w-11 rounded-2xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center">
                            <Icon icon="solar:route-bold-duotone" className="text-2xl" />
                        </span>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">Trazabilidad pedido tienda</h2>
                            <p className="text-xs text-slate-500">{item.referencia} · {item.cliente}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                        <Icon icon="solar:close-circle-linear" className="text-xl" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                        <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 p-4">
                            <p className="text-[11px] uppercase font-black text-slate-400">Estado actual</p>
                            <p className="mt-1 text-sm font-black text-slate-800 dark:text-white">{toDespachoEstado(item.estado)}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 p-4">
                            <p className="text-[11px] uppercase font-black text-slate-400">Repartidor</p>
                            <p className="mt-1 text-sm font-black text-slate-800 dark:text-white">{item.repartidor || 'Sin asignar'}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 p-4">
                            <p className="text-[11px] uppercase font-black text-slate-400">Destino</p>
                            <p className="mt-1 text-sm font-black text-slate-800 dark:text-white line-clamp-1">{item.agenciaDestino || '—'}</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Icon icon="eos-icons:loading" className="text-3xl text-indigo-500" />
                        </div>
                    ) : historial.length === 0 ? (
                        <p className="text-center py-10 text-sm text-slate-400">Sin historial registrado</p>
                    ) : (
                        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                            {historial.map((h) => (
                                <div key={h.id} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">
                                                {h.estadoAnterior || 'Inicio'} → {h.estadoNuevo}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">{h.notas || 'Actualización de pedido'}</p>
                                        </div>
                                        <p className="text-[11px] text-slate-400 whitespace-nowrap">{moment(h.creadoEn).format('DD/MM/YYYY HH:mm')}</p>
                                    </div>
                                    {h.usuario?.nombre && <p className="mt-2 text-[11px] text-slate-400">Por {h.usuario.nombre}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function DespachoView() {
    const location = useLocation();
    const navigate = useNavigate();
    const query = new URLSearchParams(location.search);
    const queryFecha = query.get('fecha');
    const queryComprobanteId = Number(query.get('comprobanteId') || 0) || null;
    const queryPedidoId = Number(query.get('pedidoId') || 0) || null;
    const queryRepartidorId = query.get('repartidorId');
    const [items, setItems] = useState<DespachoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [fecha, setFecha] = useState(() => queryFecha || moment().format('YYYY-MM-DD'));
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [filtroRepartidor, setFiltroRepartidor] = useState<number | null | undefined>(
        () => queryRepartidorId ? Number(queryRepartidorId) : undefined
    );
    const [editingDespacho, setEditingDespacho] = useState<number | null>(null);
    const [editingPedidoTienda, setEditingPedidoTienda] = useState<DespachoItem | null>(null);
    const [trazabilidadItem, setTrazabilidadItem] = useState<DespachoItem | null>(null);
    const [trazabilidadPedidoTienda, setTrazabilidadPedidoTienda] = useState<DespachoItem | null>(null);
    const [waConfig, setWaConfig] = useState(WA_CONFIG_DEFAULTS);
    const { alert } = useAlertStore();

    const pedidoTiendaDocumento = (item: DespachoItem) => ({
        id: item.pedidoId || item.id,
        codigoSeguimiento: item.referencia,
        clienteNombre: item.cliente,
        clienteTelefono: item.celularDest || item.telefono || '',
        clienteDireccion: item.agenciaDestino && item.agenciaDestino !== '—' ? item.agenciaDestino : '',
        tipoEntrega: 'ENVIO',
        estadoEntrega: item.estadoEntrega || (toDespachoEstado(item.estado) === 'ENTREGADO' ? 'ENTREGADO_COMPLETADO' : 'CONFIRMADO'),
        estadoEnvio: item.estado,
        agenciaEnvio: item.courier,
        total: item.total,
        montoPagado: item.montoPagado ?? item.total,
        saldoPendiente: item.saldoPendiente ?? 0,
        items: item.items || [],
    });

    const puedeDocumentarPedidoTienda = (item: DespachoItem) => (
        item.tipo === 'PEDIDO_TIENDA'
        && (toDespachoEstado(item.estado) === 'ENTREGADO' || (item.saldoPendiente !== undefined && Number(item.saldoPendiente) <= 0.01))
    );

    const puedeDocumentarComprobante = (item: DespachoItem) => (
        item.tipo === 'COMPROBANTE'
        && Boolean(item.comprobanteId)
        && toDespachoEstado(item.estado) === 'ENTREGADO'
        && !['01', '03'].includes(String(item.comprobanteTipoDoc || '').toUpperCase())
    );

    const cargarComprobante = async (comprobanteId: number) => {
        const { data } = await apiClient.get<any>(`/comprobante/${comprobanteId}`);
        return data?.data ?? data;
    };

    const mapProductosComprobante = (comprobante: any) => (
        Array.isArray(comprobante?.detalles) ? comprobante.detalles.map((detalle: any) => ({
            productoId: detalle.producto?.id || detalle.productoId || 0,
            descripcion: detalle.descripcion || detalle.producto?.descripcion || 'Producto',
            cantidad: Number(detalle.cantidad || 1),
            precioUnitario: Number(detalle.mtoPrecioUnitario || detalle.precioUnitario || 0),
            unidad: detalle.unidad || detalle.unidadMedida || 'NIU',
        })) : []
    );

    const navegarComprobanteDesdePos = async (item: DespachoItem, defaultType: 'BOLETA' | 'FACTURA') => {
        if (!item.comprobanteId) return;
        try {
            const comprobante = await cargarComprobante(item.comprobanteId);
            const cliente = comprobante?.cliente || null;
            const esRuc = String(cliente?.nroDoc || '').length === 11;
            navigate('/administrador/facturacion/nuevo', {
                state: {
                    defaultType,
                    fromNotaDeVenta: true,
                    notaDeVentaData: {
                        origenComprobanteId: item.comprobanteId,
                        cliente: defaultType === 'FACTURA' && !esRuc ? null : cliente,
                        clienteId: defaultType === 'FACTURA' && !esRuc ? null : comprobante?.clienteId,
                        observaciones: comprobante?.observaciones,
                        productos: mapProductosComprobante(comprobante),
                    },
                },
            });
        } catch {
            alert('No se pudo cargar el comprobante para convertirlo', 'error');
        }
    };

    const navegarGuiaDesdePos = async (item: DespachoItem) => {
        if (!item.comprobanteId) return;
        try {
            const comprobante = await cargarComprobante(item.comprobanteId);
            navigate('/administrador/guia-remision', {
                state: {
                    fromDespachoComprobante: true,
                    comprobanteGuia: {
                        id: item.comprobanteId,
                        referencia: item.referencia,
                        clienteNombre: comprobante?.cliente?.nombre || item.cliente,
                        clienteNroDoc: comprobante?.cliente?.nroDoc || '10000000',
                        clienteDireccion: item.agenciaDestino && item.agenciaDestino !== '—' ? item.agenciaDestino : comprobante?.cliente?.direccion || '',
                        agenciaEnvio: item.courier,
                        items: mapProductosComprobante(comprobante),
                    },
                },
            });
        } catch {
            alert('No se pudo cargar el comprobante para generar guía', 'error');
        }
    };

    const navegarComprobantePedidoTienda = (item: DespachoItem, defaultType: 'BOLETA' | 'FACTURA') => {
        navigate('/administrador/facturacion/nuevo', {
            state: {
                defaultType,
                defaultClient: 'CLIENTES_VARIOS',
                fromPedidoTienda: true,
                pedidoTiendaData: pedidoTiendaDocumento(item),
            },
        });
    };

    const navegarGuiaPedidoTienda = (item: DespachoItem) => {
        navigate('/administrador/guia-remision', {
            state: {
                fromPedidoTienda: true,
                pedidoTiendaGuia: pedidoTiendaDocumento(item),
            },
        });
    };

    useEffect(() => {
        apiClient.get<any>('/envio-despacho/config').then(({ data }) => {
            const p = data?.data ?? data;
            if (p) setWaConfig({
                mensajeEnCamino: p.mensajeEnCamino || WA_CONFIG_DEFAULTS.mensajeEnCamino,
                mensajeEntregado: p.mensajeEntregado || WA_CONFIG_DEFAULTS.mensajeEntregado,
            });
        }).catch(() => {});
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const nextFecha = params.get('fecha');
        if (nextFecha) setFecha(nextFecha);
        const nextRepartidorId = params.get('repartidorId');
        setFiltroRepartidor(nextRepartidorId ? Number(nextRepartidorId) : undefined);
    }, [location.search]);

    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (fecha) params.set('fecha', fecha);
            const { data } = await apiClient.get<any>(`/envio-despacho/panel?${params}`);
            const raw = data?.data?.data ?? data?.data ?? [];
            setItems(Array.isArray(raw) ? raw : []);
        } catch {
            alert('Error al cargar el panel de despacho', 'error');
        } finally {
            setLoading(false);
        }
    }, [fecha, alert]);

    useEffect(() => { cargar(); }, [cargar]);

    const actualizarEstado = async (item: DespachoItem, nuevoEstado: string) => {
        try {
            if (item.tipo === 'COMPROBANTE' && item.comprobanteId) {
                await apiClient.put(`/envio-despacho/comprobante/${item.comprobanteId}`, { estado: nuevoEstado });
            } else if (item.tipo === 'PEDIDO_TIENDA' && item.pedidoId) {
                const mapped = DESPACHO_TO_PEDIDO[nuevoEstado];
                if (!mapped) return;
                await apiClient.patch(`/tienda/pedidos/${item.pedidoId}/estado`, mapped);
            } else {
                return;
            }
            setItems(prev => prev.map(i =>
                i.tipo === item.tipo && i.id === item.id ? { ...i, estado: nuevoEstado } : i
            ));
            alert('Estado sincronizado correctamente', 'success');
        } catch {
            alert('Error al actualizar estado', 'error');
        }
    };

    const repartidorStats = useMemo<RepartidorStat[]>(() => {
        const map = new Map<string, RepartidorStat>();
        items.forEach(item => {
            const key = item.repartidorId != null ? String(item.repartidorId) : '__sin__';
            const nombre = item.repartidorId != null ? (item.repartidor || 'Repartidor') : 'Sin asignar';
            if (!map.has(key)) {
                map.set(key, { repartidorId: item.repartidorId ?? null, nombre, preparando: 0, enCamino: 0, entregado: 0, total: 0 });
            }
            const s = map.get(key)!;
            s.total++;
            if (['PREPARANDO', 'POR_COORDINAR'].includes(item.estado)) s.preparando++;
            else if (['EN_CAMINO', 'EN_REPARTO', 'ENVIADO'].includes(item.estado)) s.enCamino++;
            else if (['ENTREGADO', 'ENTREGADO_COMPLETADO'].includes(item.estado)) s.entregado++;
        });
        return Array.from(map.values()).sort((a, b) => (b.repartidorId != null ? 1 : 0) - (a.repartidorId != null ? 1 : 0) || b.total - a.total);
    }, [items]);

    const hayRepartidores = repartidorStats.some(r => r.repartidorId !== null);

    const filtrados = items.filter(i => {
        if (queryComprobanteId && i.comprobanteId !== queryComprobanteId) return false;
        if (queryPedidoId && i.pedidoId !== queryPedidoId) return false;
        if (filtroEstado && toDespachoEstado(i.estado) !== filtroEstado) return false;
        if (filtroRepartidor !== undefined) {
            if (filtroRepartidor === null) {
                if (i.repartidorId != null) return false;
            } else {
                if (i.repartidorId !== filtroRepartidor) return false;
            }
        }
        if (busqueda) {
            const q = busqueda.toLowerCase();
            return i.cliente.toLowerCase().includes(q)
                || i.referencia.toLowerCase().includes(q)
                || i.telefono.includes(q)
                || i.agenciaDestino.toLowerCase().includes(q);
        }
        return true;
    });

    const kpis = {
        total: items.length,
        preparando: items.filter(i => i.estado === 'PREPARANDO' || i.estado === 'POR_COORDINAR').length,
        enCamino: items.filter(i => i.estado === 'EN_CAMINO' || i.estado === 'ENVIADO' || i.estado === 'EN_REPARTO').length,
        entregado: items.filter(i => i.estado === 'ENTREGADO' || i.estado === 'ENTREGADO_COMPLETADO').length,
    };

    const tableData = filtrados.map(item => {
        const partes = (item.vendedor ?? '').trim().split(' ').filter(Boolean);
        const iniciales = ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase();
        const nombreCorto = [partes[0], partes[1]].filter(Boolean).join(' ');
        const celular = item.celularDest || item.telefono || '';

        return {
            id: item.id,
            'Tipo': (
                <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${item.tipo === 'COMPROBANTE' ? 'bg-violet-100 text-violet-700' : 'bg-sky-100 text-sky-700'}`}>
                    {item.tipo === 'COMPROBANTE' ? 'POS' : 'TIENDA'}
                </span>
            ),
            'Referencia': <span className="text-xs text-slate-600 dark:text-slate-300">{item.referencia}</span>,
            'Cliente': <span className="text-xs uppercase text-slate-700 dark:text-slate-200">{item.cliente}</span>,
            'Vendedor': (
                <span className="inline-flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-medium">
                        {iniciales || '?'}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300">{nombreCorto || '—'}</span>
                </span>
            ),
            'Courier': item.courier && item.courier !== '—'
                ? <span className={`text-[10px] font-medium px-2 py-1 rounded-lg ${COURIER_COLOR[item.courier] || 'bg-slate-200 text-slate-700'}`}>{COURIER_LABEL[item.courier] || item.courier}</span>
                : <span className="text-slate-400 text-xs">—</span>,
            'Agencia destino': <span className="text-xs text-slate-600 dark:text-slate-300">{item.agenciaDestino || '—'}</span>,
            'Celular': (
                <span className="inline-flex items-center gap-1.5">
                    <span className="text-xs text-slate-600 dark:text-slate-300">{celular || '—'}</span>
                    {celular && ESTADOS_WA_NOTIFICADOS.has(item.estado) && (
                        <span title="Notificación WhatsApp enviada automáticamente">
                            <Icon icon="mdi:whatsapp" className="text-emerald-500 text-sm" />
                        </span>
                    )}
                </span>
            ),
            'Paquetes': <span className="text-xs text-center block text-slate-600 dark:text-slate-300">{item.nroPaquetes ?? 1}</span>,
            'Guía': item.codigoGuia
                ? <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg">{item.codigoGuia}</span>
                : <span className="text-slate-400 text-xs">—</span>,
            'Total': <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">S/ {Number(item.total).toFixed(2)}</span>,
            'Estado': (
                <select
                    value={toDespachoEstado(item.estado)}
                    onChange={e => actualizarEstado(item, e.target.value)}
                    className={`h-8 px-2 text-xs rounded-lg border outline-none transition ${ESTADO_COLOR[item.estado] || 'bg-slate-100 text-slate-600 border-slate-200'}`}
                >
                    {ESTADOS_DESPACHO.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
            ),
            'Acciones': (
                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    {item.tipo === 'COMPROBANTE' && item.comprobanteId && (
                        <button
                            type="button"
                            onClick={() => setTrazabilidadItem(item)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500 text-white hover:bg-violet-600 transition-colors"
                            title="Ver trazabilidad"
                        >
                            <Icon icon="solar:route-bold-duotone" className="text-base" />
                        </button>
                    )}
                    {item.tipo === 'PEDIDO_TIENDA' && item.pedidoId && (
                        <button
                            type="button"
                            onClick={() => setTrazabilidadPedidoTienda(item)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500 text-white hover:bg-violet-600 transition-colors"
                            title="Ver trazabilidad"
                        >
                            <Icon icon="solar:route-bold-duotone" className="text-base" />
                        </button>
                    )}
                    {puedeDocumentarPedidoTienda(item) && (
                        <>
                            <button
                                type="button"
                                onClick={() => navegarComprobantePedidoTienda(item, 'BOLETA')}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500 text-white hover:bg-violet-600 transition-colors"
                                title="Hacer boleta"
                            >
                                <Icon icon="solar:bill-list-bold" className="text-base" />
                            </button>
                            <button
                                type="button"
                                onClick={() => navegarComprobantePedidoTienda(item, 'FACTURA')}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                title="Hacer factura"
                            >
                                <Icon icon="solar:document-add-bold" className="text-base" />
                            </button>
                            <button
                                type="button"
                                onClick={() => navegarGuiaPedidoTienda(item)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                                title="Hacer guía de remisión"
                            >
                                <Icon icon="solar:route-bold-duotone" className="text-base" />
                            </button>
                        </>
                    )}
                    {puedeDocumentarComprobante(item) && (
                        <>
                            <button
                                type="button"
                                onClick={() => navegarComprobanteDesdePos(item, 'BOLETA')}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500 text-white hover:bg-violet-600 transition-colors"
                                title="Hacer boleta"
                            >
                                <Icon icon="solar:bill-list-bold" className="text-base" />
                            </button>
                            <button
                                type="button"
                                onClick={() => navegarComprobanteDesdePos(item, 'FACTURA')}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                title="Hacer factura"
                            >
                                <Icon icon="solar:document-add-bold" className="text-base" />
                            </button>
                            <button
                                type="button"
                                onClick={() => navegarGuiaDesdePos(item)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                                title="Hacer guía de remisión"
                            >
                                <Icon icon="solar:route-bold-duotone" className="text-base" />
                            </button>
                        </>
                    )}
                    {celular ? (
                        <a
                            href={`https://wa.me/51${celular.replace(/\D/g, '')}?text=${encodeURIComponent(buildWaMessage(item, waConfig))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                            title={`WhatsApp · ${item.estado}`}
                        >
                            <Icon icon="mdi:whatsapp" className="text-base" />
                        </a>
                    ) : null}
                    {item.tipo === 'COMPROBANTE' && item.comprobanteId && (
                        <button
                            type="button"
                            onClick={() => setEditingDespacho(item.comprobanteId!)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                            title="Editar despacho"
                        >
                            <Icon icon="solar:pen-bold" className="text-base" />
                        </button>
                    )}
                    {item.tipo === 'PEDIDO_TIENDA' && item.pedidoId && (
                        <button
                            type="button"
                            onClick={() => setEditingPedidoTienda(item)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                            title="Editar despacho"
                        >
                            <Icon icon="solar:pen-bold" className="text-base" />
                        </button>
                    )}
                </div>
            ),
        };
    });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0A0D14] px-4 pb-8 pt-4">
            {/* Header */}
            <div className="mb-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600">
                            <Icon icon="solar:delivery-bold-duotone" className="text-2xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Panel de Despacho</h1>
                            <p className="text-sm text-slate-500">Comprobantes + pedidos online pendientes de envío</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar
                            text="Fecha"
                            name="fecha"
                            value={moment(fecha).format('DD/MM/YYYY')}
                            onChange={(date) => {
                                if (moment(date, 'DD/MM/YYYY', true).isValid()) {
                                    setFecha(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'));
                                }
                            }}
                        />
                        <button
                            onClick={() => navigate('/administrador/despacho/config')}
                            className="relative top-2 h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                            title="Configurar notificaciones WhatsApp"
                        >
                            <Icon icon="mdi:whatsapp" />
                        </button>
                        <button
                            onClick={cargar}
                            className="relative top-2 h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        >
                            <Icon icon="solar:refresh-bold" />
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Total hoy', value: kpis.total, icon: 'solar:box-bold-duotone', color: 'blue' },
                        { label: 'Por preparar', value: kpis.preparando, icon: 'solar:clock-circle-bold-duotone', color: 'amber' },
                        { label: 'En tránsito', value: kpis.enCamino, icon: 'solar:delivery-bold-duotone', color: 'indigo' },
                        { label: 'Entregados', value: kpis.entregado, icon: 'solar:check-circle-bold-duotone', color: 'emerald' },
                    ].map(k => (
                        <div key={k.label} className={`rounded-xl border p-3 flex items-center gap-3 bg-${k.color}-50 dark:bg-${k.color}-900/20 border-${k.color}-100 dark:border-${k.color}-800/30`}>
                            <Icon icon={k.icon} className={`text-2xl text-${k.color}-600 dark:text-${k.color}-400`} />
                            <div>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{k.value}</p>
                                <p className="text-xs text-slate-500">{k.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Cards por repartidor */}
                {hayRepartidores && (
                    <div className="mt-4">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Por repartidor</p>
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                            {/* Card "Todos" */}
                            <button
                                type="button"
                                onClick={() => setFiltroRepartidor(undefined)}
                                className={`shrink-0 rounded-xl border px-4 py-2.5 text-xs font-black transition-all ${
                                    filtroRepartidor === undefined
                                        ? 'bg-indigo-600 border-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-1 dark:ring-offset-[#111827]'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 bg-white dark:bg-slate-800/50'
                                }`}
                            >
                                TODOS
                            </button>

                            {repartidorStats.map(rep => {
                                const partes = rep.nombre.trim().split(' ').filter(Boolean);
                                const iniciales = ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || '?';
                                const isSelected = filtroRepartidor === rep.repartidorId;
                                const isSinAsignar = rep.repartidorId === null;

                                return (
                                    <button
                                        key={rep.repartidorId ?? '__sin__'}
                                        type="button"
                                        onClick={() => setFiltroRepartidor(isSelected ? undefined : rep.repartidorId)}
                                        className={`shrink-0 rounded-xl border p-3 text-left transition-all w-44 ${
                                            isSelected
                                                ? 'bg-indigo-600 border-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-1 dark:ring-offset-[#111827]'
                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-indigo-300 dark:hover:border-indigo-600'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-bold shrink-0 ${
                                                isSelected
                                                    ? 'bg-white/20 text-white'
                                                    : isSinAsignar
                                                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                                                        : 'bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-700 dark:text-fuchsia-300'
                                            }`}>
                                                {isSinAsignar ? <Icon icon="solar:user-cross-bold" className="text-sm" /> : iniciales}
                                            </span>
                                            <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                                                {partes[0]}{partes[1] ? ` ${partes[1]}` : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${isSelected ? 'bg-amber-400/30 text-amber-100' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                                                <span>{rep.preparando}</span>
                                                <Icon icon="solar:clock-circle-bold" className="text-[10px]" />
                                            </span>
                                            <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${isSelected ? 'bg-blue-400/30 text-blue-100' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                                <span>{rep.enCamino}</span>
                                                <Icon icon="solar:delivery-bold" className="text-[10px]" />
                                            </span>
                                            <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${isSelected ? 'bg-emerald-400/30 text-emerald-100' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                                                <span>{rep.entregado}</span>
                                                <Icon icon="solar:check-circle-bold" className="text-[10px]" />
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Filtros */}
                <div className="mt-4 flex flex-wrap gap-2">
                    <div className="relative flex-1 min-w-[200px]">
                        <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                        <input
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            placeholder="Buscar cliente, código, agencia..."
                            className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-800 dark:text-white outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setFiltroEstado('')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${!filtroEstado ? 'bg-indigo-600 text-white' : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                    >
                        TODOS
                    </button>
                    {ESTADOS_DESPACHO.map(e => (
                        <button
                            key={e.value}
                            onClick={() => setFiltroEstado(filtroEstado === e.value ? '' : e.value)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${filtroEstado === e.value ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                        >
                            {e.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabla */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Icon icon="eos-icons:loading" className="text-4xl text-indigo-500" />
                    </div>
                ) : filtrados.length === 0 ? (
                    <div className="flex flex-col items-center py-20 text-slate-400">
                        <Icon icon="solar:delivery-bold-duotone" className="text-5xl mb-3" />
                        <p className="font-bold">Sin envíos pendientes para este día</p>
                    </div>
                ) : (
                    <DataTable
                        headerColumns={HEADER_COLUMNS}
                        bodyData={tableData}
                        color="white"
                        idTable="despacho-table"
                    />
                )}
            </div>

            {editingDespacho && (
                <EditarDespachoModal
                    comprobanteId={editingDespacho}
                    onClose={() => setEditingDespacho(null)}
                    onSuccess={() => {
                        setEditingDespacho(null);
                        cargar();
                    }}
                />
            )}

            {trazabilidadItem && trazabilidadItem.comprobanteId && (
                <ModalTrazabilidad
                    comprobanteId={trazabilidadItem.comprobanteId}
                    referencia={trazabilidadItem.referencia}
                    cliente={trazabilidadItem.cliente}
                    onClose={() => setTrazabilidadItem(null)}
                />
            )}

            {editingPedidoTienda && (
                <EditarPedidoTiendaDespachoModal
                    item={editingPedidoTienda}
                    onClose={() => setEditingPedidoTienda(null)}
                    onSuccess={() => {
                        setEditingPedidoTienda(null);
                        cargar();
                    }}
                />
            )}

            {trazabilidadPedidoTienda && (
                <ModalTrazabilidadPedidoTienda
                    item={trazabilidadPedidoTienda}
                    onClose={() => setTrazabilidadPedidoTienda(null)}
                />
            )}
        </div>
    );
}
