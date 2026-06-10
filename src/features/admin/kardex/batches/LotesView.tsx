import { Icon } from '@iconify/react';
import { useLotesViewModel } from './useLotesViewModel';
import { ESTADO_LOTE_OPTIONS, type ILoteGestion } from './LotesModel';
import { Calendar } from '@/components/Date';
import moment from 'moment';

const getBadgeDias = (dias: number) => {
    if (dias < 0) return { label: 'VENCIDO', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' };
    if (dias <= 30) return { label: `${dias}d`, cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' };
    return { label: 'VIGENTE', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' };
};

export default function LotesView() {
    const vm = useLotesViewModel();

    return (
        <div className="p-4 md:p-6 min-h-screen dark:bg-[#0A0D14] space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Gestión de Lotes</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Control FEFO · vencimientos · trazabilidad</p>
                </div>
                <button
                    onClick={vm.exportarExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors"
                >
                    <Icon icon="solar:file-download-bold" />
                    Exportar CSV
                </button>
            </div>

            {/* Banner vencidos */}
            {vm.kpis.vencidosConStock > 0 && (
                <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl px-5 py-3">
                    <Icon icon="solar:danger-triangle-bold" className="text-red-600 dark:text-red-400 text-2xl flex-shrink-0" />
                    <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                        Tienes <strong>{vm.kpis.vencidosConStock} lote{vm.kpis.vencidosConStock !== 1 ? 's' : ''} vencido{vm.kpis.vencidosConStock !== 1 ? 's' : ''}</strong> con stock disponible — requieren acción inmediata.
                    </p>
                    <button onClick={() => vm.setEstado('VENCIDO')} className="ml-auto text-xs font-bold text-red-600 dark:text-red-400 underline underline-offset-2 hover:no-underline flex-shrink-0">
                        Ver vencidos
                    </button>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Lotes activos', value: vm.kpis.totalActivos, icon: 'solar:box-bold-duotone', color: 'blue' },
                    { label: 'Por vencer <30d', value: vm.kpis.porVencer30d, icon: 'solar:clock-circle-bold-duotone', color: 'amber' },
                    { label: 'Vencidos con stock', value: vm.kpis.vencidosConStock, icon: 'solar:danger-circle-bold-duotone', color: 'red' },
                    { label: 'Valor en inventario', value: `S/ ${vm.kpis.valorTotalInventario.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: 'solar:wallet-money-bold-duotone', color: 'emerald' },
                ].map((kpi) => (
                    <div key={kpi.label} className="bg-white dark:bg-[#1E2435] rounded-2xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                            kpi.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20' :
                            kpi.color === 'amber' ? 'bg-amber-50 dark:bg-amber-900/20' :
                            kpi.color === 'red' ? 'bg-red-50 dark:bg-red-900/20' :
                            'bg-emerald-50 dark:bg-emerald-900/20'
                        }`}>
                            <Icon icon={kpi.icon} className={`text-xl ${
                                kpi.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                                kpi.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                                kpi.color === 'red' ? 'text-red-600 dark:text-red-400' :
                                'text-emerald-600 dark:text-emerald-400'
                            }`} />
                        </div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{kpi.value}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{kpi.label}</p>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                    <input
                        type="text"
                        value={vm.search}
                        onChange={(e) => vm.setSearch(e.target.value)}
                        placeholder="Buscar por producto o código de lote..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1E2435] border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    {ESTADO_LOTE_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => vm.setEstado(opt.value)}
                            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                                vm.estado === opt.value
                                    ? 'bg-violet-600 text-white'
                                    : 'bg-white dark:bg-[#1E2435] border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-violet-400'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white dark:bg-[#1E2435] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                {vm.loading ? (
                    <div className="flex items-center justify-center py-20 text-gray-400">
                        <Icon icon="solar:spinner-bold" className="text-3xl animate-spin mr-2" />
                        Cargando lotes...
                    </div>
                ) : vm.lotes.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <Icon icon="solar:box-minimalistic-linear" width={48} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No se encontraron lotes</p>
                        <p className="text-sm mt-1">Prueba cambiando el filtro o la búsqueda</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-slate-800">
                                    {['Producto', 'Lote', 'Vencimiento', 'Stock', 'Costo U.', 'Valor total', 'Ventas', 'Estado', 'Acciones'].map((h) => (
                                        <th key={h} className="text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3 first:pl-5 last:pr-5">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60">
                                {vm.lotes.map((lote) => {
                                    const badge = getBadgeDias(lote.diasAlVencimiento);
                                    return (
                                        <tr key={lote.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-4 py-3 pl-5">
                                                <p className="font-semibold text-gray-900 dark:text-white text-[13px] line-clamp-1">{lote.producto.descripcion}</p>
                                                <p className="text-[11px] text-gray-400">{lote.producto.codigo}</p>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-[12px] font-bold text-gray-700 dark:text-gray-300">{lote.lote}</td>
                                            <td className="px-4 py-3">
                                                <p className="text-[12px] text-gray-700 dark:text-gray-300">{moment(lote.fechaVencimiento).format('DD/MM/YYYY')}</p>
                                                <p className={`text-[10px] font-bold mt-0.5 ${lote.diasAlVencimiento < 0 ? 'text-red-500' : lote.diasAlVencimiento <= 30 ? 'text-amber-500' : 'text-gray-400'}`}>
                                                    {lote.diasAlVencimiento < 0 ? `Vencido hace ${Math.abs(lote.diasAlVencimiento)}d` : `${lote.diasAlVencimiento}d restantes`}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{lote.stockActual}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                {lote.costoUnitario != null ? `S/ ${Number(lote.costoUnitario).toFixed(2)}` : '—'}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-400">
                                                {lote.valorEnStock > 0 ? `S/ ${lote.valorEnStock.toFixed(2)}` : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                                    <Icon icon="solar:cart-check-bold" className="text-xs" />
                                                    {lote.totalVentas}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.cls}`}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 pr-5">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => vm.abrirAjuste(lote)} title="Ajustar stock" className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors">
                                                        <Icon icon="solar:tuning-2-bold" width={15} />
                                                    </button>
                                                    <button onClick={() => vm.abrirEdicion(lote)} title="Editar" className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-500 transition-colors">
                                                        <Icon icon="solar:pen-bold" width={15} />
                                                    </button>
                                                    <button onClick={() => vm.setDesactivarModal({ lote, open: true })} title="Desactivar" className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-colors">
                                                        <Icon icon="solar:trash-bin-trash-bold" width={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Paginación */}
                {vm.pages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-slate-800">
                        <p className="text-xs text-gray-500">
                            Mostrando {((vm.page - 1) * vm.limit) + 1}–{Math.min(vm.page * vm.limit, vm.total)} de {vm.total} lotes
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => vm.setPage(p => Math.max(1, p - 1))} disabled={vm.page === 1}
                                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                                ← Anterior
                            </button>
                            <span className="px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">{vm.page} / {vm.pages}</span>
                            <button onClick={() => vm.setPage(p => Math.min(vm.pages, p + 1))} disabled={vm.page === vm.pages}
                                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                                Siguiente →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modal Ajustar Stock ── */}
            {vm.ajusteModal.open && vm.ajusteModal.lote && (
                <ModalOverlay onClose={() => vm.setAjusteModal({ lote: null, open: false })}>
                    <ModalHeader icon="solar:tuning-2-bold" title="Ajustar Stock" subtitle={`Lote ${vm.ajusteModal.lote.lote} · Stock actual: ${vm.ajusteModal.lote.stockActual}`} onClose={() => vm.setAjusteModal({ lote: null, open: false })} />
                    <div className="space-y-4 p-6 pt-0">
                        <div className="flex gap-2">
                            {(['INCREMENTO', 'DECREMENTO'] as const).map((t) => (
                                <button key={t} onClick={() => vm.setAjusteForm(f => ({ ...f, tipo: t }))}
                                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${vm.ajusteForm.tipo === t ? (t === 'INCREMENTO' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white') : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}>
                                    {t === 'INCREMENTO' ? '+ Ingreso' : '− Salida'}
                                </button>
                            ))}
                        </div>
                        <FormField label="Cantidad *">
                            <input type="number" min="1" value={vm.ajusteForm.cantidad}
                                onChange={e => vm.setAjusteForm(f => ({ ...f, cantidad: e.target.value }))}
                                className={inputCls} placeholder="0" />
                        </FormField>
                        <FormField label="Motivo (opcional)">
                            <input type="text" value={vm.ajusteForm.motivo}
                                onChange={e => vm.setAjusteForm(f => ({ ...f, motivo: e.target.value }))}
                                className={inputCls} placeholder="Ej: Ajuste por inventario físico" />
                        </FormField>
                        <ModalActions loading={vm.actionLoading} onCancel={() => vm.setAjusteModal({ lote: null, open: false })} onConfirm={vm.guardarAjuste} label="Guardar ajuste" />
                    </div>
                </ModalOverlay>
            )}

            {/* ── Modal Editar Metadatos ── */}
            {vm.editModal.open && vm.editModal.lote && (
                <ModalOverlay onClose={() => vm.setEditModal({ lote: null, open: false })}>
                    <ModalHeader icon="solar:pen-bold" title="Editar Lote" subtitle={vm.editModal.lote.producto.descripcion} onClose={() => vm.setEditModal({ lote: null, open: false })} />
                    <div className="space-y-4 p-6 pt-0">
                        <FormField label="Código de lote">
                            <input type="text" value={vm.editForm.lote} onChange={e => vm.setEditForm(f => ({ ...f, lote: e.target.value }))} className={inputCls} />
                        </FormField>
                        <FormField label="Fecha de vencimiento">
                            <Calendar text="" value={vm.editForm.fechaVencimiento ? moment(vm.editForm.fechaVencimiento).format('DD/MM/YYYY') : ''}
                                onChange={(date: string) => {
                                    const [d, m, y] = date.split('/');
                                    vm.setEditForm(f => ({ ...f, fechaVencimiento: `${y}-${m}-${d}` }));
                                }} name="editFechaVenc" />
                        </FormField>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Costo unitario">
                                <input type="number" step="0.01" value={vm.editForm.costoUnitario} onChange={e => vm.setEditForm(f => ({ ...f, costoUnitario: e.target.value }))} className={inputCls} placeholder="0.00" />
                            </FormField>
                            <FormField label="Proveedor">
                                <input type="text" value={vm.editForm.proveedor} onChange={e => vm.setEditForm(f => ({ ...f, proveedor: e.target.value }))} className={inputCls} />
                            </FormField>
                        </div>
                        <ModalActions loading={vm.actionLoading} onCancel={() => vm.setEditModal({ lote: null, open: false })} onConfirm={vm.guardarEdicion} label="Guardar cambios" />
                    </div>
                </ModalOverlay>
            )}

            {/* ── Modal Desactivar ── */}
            {vm.desactivarModal.open && vm.desactivarModal.lote && (
                <ModalOverlay onClose={() => vm.setDesactivarModal({ lote: null, open: false })}>
                    <ModalHeader icon="solar:trash-bin-trash-bold" title="Desactivar Lote" subtitle={`Lote ${vm.desactivarModal.lote.lote}`} onClose={() => vm.setDesactivarModal({ lote: null, open: false })} />
                    <div className="p-6 pt-2 space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {vm.desactivarModal.lote.stockActual > 0
                                ? `Este lote tiene <strong>${vm.desactivarModal.lote.stockActual}</strong> unidades en stock. Al desactivarlo se registrará una salida en el kardex.`
                                : 'El lote está sin stock y se desactivará del sistema.'}
                        </p>
                        <ModalActions loading={vm.actionLoading} onCancel={() => vm.setDesactivarModal({ lote: null, open: false })} onConfirm={vm.guardarDesactivar} label="Sí, desactivar" danger />
                    </div>
                </ModalOverlay>
            )}
        </div>
    );
}

// ── Componentes auxiliares locales ──────────────────────────────

const inputCls = "w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none";

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 top-[-30px] z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50  " onClick={onClose} />
            <div className="relative bg-white dark:bg-[#1E2435] rounded-2xl shadow-2xl w-full max-w-md z-10">
                {children}
            </div>
        </div>
    );
}

function ModalHeader({ icon, title, subtitle, onClose }: { icon: string; title: string; subtitle: string; onClose: () => void }) {
    return (
        <div className="flex items-center justify-between p-6 pb-4">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
                    <Icon icon={icon} className="text-violet-600 dark:text-violet-400 text-lg" />
                </div>
                <div>
                    <h3 className="font-black text-gray-900 dark:text-white text-base">{title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{subtitle}</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <Icon icon="solar:close-circle-linear" className="text-gray-400 text-xl" />
            </button>
        </div>
    );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{label}</label>
            {children}
        </div>
    );
}

function ModalActions({ loading, onCancel, onConfirm, label, danger }: { loading: boolean; onCancel: () => void; onConfirm: () => void; label: string; danger?: boolean }) {
    return (
        <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                Cancelar
            </button>
            <button onClick={onConfirm} disabled={loading}
                className={`flex-1 py-2.5 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-60 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-violet-600 hover:bg-violet-700'}`}>
                {loading ? 'Guardando...' : label}
            </button>
        </div>
    );
}
