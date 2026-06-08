import { useState } from 'react';
import { Icon } from '@iconify/react';
import moment from 'moment';
import { usePanelVentasViewModel, VentaPanelItem, TabVentas, TipoVenta, EstadoDespacho } from './usePanelVentasViewModel';
import { EditarDespachoModal } from './EditarDespachoModal';
import { ModalTrazabilidad } from './ModalTrazabilidad';
import ModalDetalleComprobante from '@/pages/admin/facturacion/ModalDetalleComprobante';
import ModalEnviarWhatsApp from '@/pages/admin/facturacion/ModalEnviarWhatsApp';

// ─── Badge helpers ────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<TipoVenta, { label: string; cls: string }> = {
    BOLETA:              { label: 'Boleta',      cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    FACTURA:             { label: 'Factura',     cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
    NOTA_CREDITO:        { label: 'N.Crédito',   cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
    NOTA_DEBITO:         { label: 'N.Débito',    cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
    TICKET:              { label: 'Ticket',      cls: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
    NOTA_VENTA:          { label: 'N.Venta',     cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    NOTA_PEDIDO:         { label: 'N.Pedido',    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    RECIBO_HONORARIOS:   { label: 'R.Honor.',    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    COMP_PAGO:           { label: 'C.Pago',      cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    OTRO:                { label: 'Otro',        cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
    PEDIDO_TIENDA:       { label: 'Tienda',      cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
};

const PAGO_CONFIG = {
    PAGADO:   { label: 'Pagado',   cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    PARCIAL:  { label: 'Parcial',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    PENDIENTE:{ label: 'Pendiente',cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

const SUNAT_CONFIG = {
    ACEPTADO: { label: 'Aceptado', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    PENDIENTE:{ label: 'Pendiente',cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
    RECHAZADO:{ label: 'Rechazado',cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
    ANULADO:  { label: 'Anulado',  cls: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400' },
    NO_APLICA:{ label: '—',        cls: 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500' },
};

const DESPACHO_CONFIG: Record<EstadoDespacho, { label: string; cls: string }> = {
    PREPARANDO: { label: 'Preparando', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    EN_CAMINO:  { label: 'En camino',  cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    EN_DESTINO: { label: 'En destino', cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
    ENTREGADO:  { label: 'Entregado',  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    DEVUELTO:   { label: 'Devuelto',   cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
    NO_APLICA:  { label: '—',          cls: 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500' },
};

function Badge({ label, cls }: { label: string; cls: string }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${cls}`}>
            {label}
        </span>
    );
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
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

// ─── Main view ────────────────────────────────────────────────────────────────

export default function PanelVentasView() {
    const vm = usePanelVentasViewModel();

    const [detalleId, setDetalleId] = useState<number | null>(null);
    const [editDespachoId, setEditDespachoId] = useState<number | null>(null);
    const [trazabilidadItem, setTrazabilidadItem] = useState<VentaPanelItem | null>(null);
    const [waItem, setWaItem] = useState<VentaPanelItem | null>(null);

    const parseSerie = (ref: string) => ref.split('-')[0] ?? ref;
    const parseCorrelativo = (ref: string) => {
        const parts = ref.split('-');
        return parts.length > 1 ? parseInt(parts[parts.length - 1], 10) || 0 : 0;
    };

    const TABS: { key: TabVentas; label: string; count: number }[] = [
        { key: 'TODO',         label: 'Todo',           count: vm.countTodo },
        { key: 'VENTAS',       label: 'Ventas',         count: vm.countVentas },
        { key: 'CON_DESPACHO', label: 'Con despacho',   count: vm.countDespacho },
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
                    </p>
                </div>
                <div className="flex items-center gap-2">
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

            {/* Tabs + busqueda */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {TABS.map((t) => (
                        <TabBtn key={t.key} active={vm.tab === t.key} onClick={() => vm.setTab(t.key)} label={t.label} count={t.count} />
                    ))}
                </div>
                <div className="relative">
                    <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                    <input
                        type="text"
                        placeholder="Buscar cliente, referencia..."
                        value={vm.busqueda}
                        onChange={(e) => vm.setBusqueda(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-56"
                    />
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800/50">
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Fecha</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Referencia</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Tipo</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Cliente</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Total</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">M.Pago</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Pago</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">SUNAT</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Despacho</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Repartidor</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Vendedor</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Acc.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                            {vm.loading ? (
                                <tr>
                                    <td colSpan={12} className="py-16 text-center text-gray-400 dark:text-slate-500">
                                        <Icon icon="eos-icons:loading" className="text-3xl animate-spin mx-auto mb-2" />
                                        <p className="text-sm">Cargando ventas...</p>
                                    </td>
                                </tr>
                            ) : vm.filtrados.length === 0 ? (
                                <tr>
                                    <td colSpan={12} className="py-16 text-center text-gray-400 dark:text-slate-500">
                                        <Icon icon="solar:sad-square-linear" className="text-4xl mx-auto mb-2 opacity-40" />
                                        <p className="text-sm">No hay ventas para este día</p>
                                    </td>
                                </tr>
                            ) : (
                                vm.filtrados.map((item) => {
                                    const tipoConf = TIPO_CONFIG[item.tipo] ?? { label: item.tipo, cls: 'bg-slate-100 text-slate-500' };
                                    const pagoConf = PAGO_CONFIG[item.estadoPago] ?? PAGO_CONFIG.PENDIENTE;
                                    const sunatConf = SUNAT_CONFIG[item.estadoSunat] ?? SUNAT_CONFIG.NO_APLICA;
                                    const despachoConf = DESPACHO_CONFIG[item.estadoDespacho] ?? DESPACHO_CONFIG.NO_APLICA;

                                    return (
                                        <tr key={`${item.tipo}-${item.id}`} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                                                <div>{moment(item.fecha).format('DD/MM/YY')}</div>
                                                <div className="text-[10px] opacity-70">{moment(item.fecha).format('HH:mm')}</div>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                {item.referencia}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge label={tipoConf.label} cls={tipoConf.cls} />
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 max-w-[160px] truncate" title={item.cliente}>
                                                {item.cliente}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white text-right whitespace-nowrap">
                                                S/ {item.total.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                {item.metodoPago}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge label={pagoConf.label} cls={pagoConf.cls} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge label={sunatConf.label} cls={sunatConf.cls} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge label={despachoConf.label} cls={despachoConf.cls} />
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap max-w-[100px] truncate" title={item.repartidor}>
                                                {item.repartidor}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-[110px] truncate" title={item.vendedor}>
                                                {item.vendedor}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    {/* Ver detalle */}
                                                    {item.comprobanteId && (
                                                        <button
                                                            onClick={() => setDetalleId(item.comprobanteId)}
                                                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                                            title="Ver detalle"
                                                        >
                                                            <Icon icon="solar:eye-linear" className="text-base" />
                                                        </button>
                                                    )}
                                                    {/* Editar despacho */}
                                                    {item.comprobanteId && item.estadoDespacho !== 'NO_APLICA' && (
                                                        <button
                                                            onClick={() => setEditDespachoId(item.comprobanteId)}
                                                            className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition"
                                                            title="Editar despacho"
                                                        >
                                                            <Icon icon="solar:delivery-linear" className="text-base" />
                                                        </button>
                                                    )}
                                                    {/* Trazabilidad */}
                                                    {item.comprobanteId && item.estadoDespacho !== 'NO_APLICA' && (
                                                        <button
                                                            onClick={() => setTrazabilidadItem(item)}
                                                            className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition"
                                                            title="Ver trazabilidad"
                                                        >
                                                            <Icon icon="solar:map-point-wave-linear" className="text-base" />
                                                        </button>
                                                    )}
                                                    {/* WhatsApp */}
                                                    {item.comprobanteId && (
                                                        <button
                                                            onClick={() => setWaItem(item)}
                                                            className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition"
                                                            title="Enviar por WhatsApp/Email"
                                                        >
                                                            <Icon icon="solar:chat-round-linear" className="text-base" />
                                                        </button>
                                                    )}
                                                </div>
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
        </div>
    );
}
