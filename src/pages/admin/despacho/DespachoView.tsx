import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import moment from 'moment';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';
import DataTable from '@/components/Datatable';
import { Calendar } from '@/components/Date';

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

const COURIER_LABEL: Record<string, string> = {
    SHALOM_PRO: 'Shalom PRO',
    SHALOM_COD: 'Shalom COD',
    OLVA: 'Olva Courier',
    URBANO: 'Urbano Express',
    CRUZ_SUR: 'Cruz del Sur',
    PROPIOS: 'Reparto propio',
    OTRO: 'Otro',
};

const COURIER_COLOR: Record<string, string> = {
    SHALOM_PRO: 'bg-slate-900 text-white',
    SHALOM_COD: 'bg-red-600 text-white',
    OLVA: 'bg-emerald-600 text-white',
    URBANO: 'bg-orange-500 text-white',
    CRUZ_SUR: 'bg-blue-700 text-white',
    PROPIOS: 'bg-fuchsia-600 text-white',
    OTRO: 'bg-slate-400 text-white',
};

interface DespachoItem {
    tipo: 'COMPROBANTE' | 'PEDIDO_TIENDA';
    id: number;
    comprobanteId?: number;
    pedidoId?: number;
    referencia: string;
    cliente: string;
    telefono: string;
    vendedor: string;
    total: number;
    courier: string;
    tipoEnvio: string;
    agenciaDestino: string;
    celularDest: string;
    nroPaquetes: number;
    turnoEnvio: string;
    codigoGuia: string;
    estado: string;
    creadoEn: string;
}

const HEADER_COLUMNS = ['Tipo', 'Referencia', 'Cliente', 'Vendedor', 'Courier', 'Agencia destino', 'Celular', 'Paquetes', 'Turno', 'Total', 'Estado', 'WhatsApp'];

export default function DespachoView() {
    const [items, setItems] = useState<DespachoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const { alert } = useAlertStore();

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
        if (item.tipo !== 'COMPROBANTE' || !item.comprobanteId) return;
        try {
            await apiClient.put(`/envio-despacho/comprobante/${item.comprobanteId}`, { estado: nuevoEstado });
            setItems(prev => prev.map(i =>
                i.tipo === 'COMPROBANTE' && i.id === item.id ? { ...i, estado: nuevoEstado } : i
            ));
        } catch {
            alert('Error al actualizar estado', 'error');
        }
    };

    const filtrados = items.filter(i => {
        if (filtroEstado && i.estado !== filtroEstado) return false;
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
            'Celular': <span className="text-xs text-slate-600 dark:text-slate-300">{celular || '—'}</span>,
            'Paquetes': <span className="text-xs text-center block text-slate-600 dark:text-slate-300">{item.nroPaquetes ?? 1}</span>,
            'Turno': <span className="text-xs text-slate-600 dark:text-slate-300">{item.turnoEnvio === 'MANANA' ? 'Mañana' : item.turnoEnvio === 'TARDE' ? 'Tarde' : item.turnoEnvio === 'NOCHE' ? 'Noche' : '—'}</span>,
            'Total': <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">S/ {Number(item.total).toFixed(2)}</span>,
            'Estado': item.tipo === 'COMPROBANTE'
                ? (
                    <select
                        value={item.estado}
                        onChange={e => actualizarEstado(item, e.target.value)}
                        className={`h-8 px-2 text-xs rounded-lg border outline-none transition ${ESTADO_COLOR[item.estado] || 'bg-slate-100 text-slate-600 border-slate-200'}`}
                    >
                        {ESTADOS_DESPACHO.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                    </select>
                ) : (
                    <span className={`text-[10px] font-medium px-2 py-1 rounded-lg border ${ESTADO_COLOR[item.estado] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {item.estado}
                    </span>
                ),
            'WhatsApp': celular ? (
                <a
                    href={`https://wa.me/51${celular.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, su pedido ${item.referencia} está siendo procesado para envío. Gracias.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                    onClick={e => e.stopPropagation()}
                >
                    <Icon icon="mdi:whatsapp" className="text-base" />
                </a>
            ) : null,
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
        </div>
    );
}
