import { Fragment } from 'react';
import { useModulosViewModel } from '@/features/admin/sistema/useModulosViewModel';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Modal from '@/components/Modal';
import ModalConfirm from '@/components/ModalConfirm';
import { Icon } from '@iconify/react';
import { ISubModulo } from '@/zustand/modulos';
import DataTableStyles from '@/components/Datatable/table.module.css';
import AutoScrollTable from '@/components/Autoscrolltable';
import TableSkeleton from '@/components/Skeletons/table';

const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800 last:border-0">
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
        <button
            type="button"
            onClick={() => onChange(!value)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${value ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'}`}
        >
            <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${value ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    </div>
);

const ProductoBadge = ({ producto }: { producto?: string }) =>
    producto === 'hotel' ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Icon icon="solar:bed-bold-duotone" width={11} />
            Hotel
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
            <Icon icon="solar:bill-list-bold-duotone" width={11} />
            Facturación
        </span>
    );

const EstadoBadge = ({ activo }: { activo: boolean }) =>
    activo ? (
        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">Activo</span>
    ) : (
        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-500 dark:bg-rose-900/20 dark:text-rose-400">Inactivo</span>
    );

const ModulosPage = () => {
    const vm = useModulosViewModel();

    if (vm.loading && vm.modulos.length === 0) return <TableSkeleton />;

    return (
        <div className="min-h-screen px-2 pb-4 bg-gray-50 dark:bg-[#0A0D14]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pt-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Icon icon="solar:widget-bold-duotone" className="text-blue-600 dark:text-blue-400" />
                        Módulos del Sistema
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Gestiona los módulos y submódulos disponibles para cada producto y plan
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {!vm.productoScope && (
                        <div className="flex items-center rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#111827] p-1 gap-0.5">
                            {([
                                { id: '' as const, label: 'Todos', icon: 'solar:layers-bold-duotone' },
                                { id: 'facturacion' as const, label: 'Facturación', icon: 'solar:bill-list-bold-duotone' },
                                { id: 'hotel' as const, label: 'Hotel', icon: 'solar:bed-bold-duotone' },
                            ]).map((item) => (
                                <button
                                    key={item.id || 'all'}
                                    type="button"
                                    onClick={() => vm.setProductoFiltro(item.id)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${vm.productoFiltro === item.id ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                                >
                                    <Icon icon={item.icon} width={13} />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}
                    <button
                        onClick={vm.handleOpenCreate}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        <Icon icon="solar:add-circle-bold" className="text-lg" />
                        Nuevo Módulo
                    </button>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                    { label: 'Total módulos', value: vm.modulos.length, icon: 'solar:widget-bold-duotone', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
                    { label: 'Activos', value: vm.modulos.filter(m => m.activo).length, icon: 'solar:check-circle-bold-duotone', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Facturación', value: vm.modulos.filter(m => m.producto !== 'hotel').length, icon: 'solar:bill-list-bold-duotone', color: 'text-sky-500 bg-sky-50 dark:bg-sky-900/20' },
                    { label: 'Hotel', value: vm.modulos.filter(m => m.producto === 'hotel').length, icon: 'solar:bed-bold-duotone', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white dark:bg-[#111827] rounded-xl border border-gray-100 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                            <Icon icon={stat.icon} width={18} />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{stat.value}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                <AutoScrollTable>
                    <div className="px-4 w-max min-w-full">
                        {vm.modulos.length > 0 ? (
                            <table className={DataTableStyles.table}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'center', width: 40 }}>#</th>
                                        <th style={{ textAlign: 'center', width: 44 }}>Icono</th>
                                        <th>Código</th>
                                        <th>Nombre</th>
                                        <th>Descripción</th>
                                        <th style={{ textAlign: 'center' }}>Producto</th>
                                        <th style={{ textAlign: 'center' }}>Estado</th>
                                        <th style={{ textAlign: 'center' }}>Submódulos</th>
                                        <th style={{ textAlign: 'center' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vm.modulos.map(modulo => {
                                        const isExpanded = vm.expandedModulos.has(modulo.id);
                                        const subCount = modulo.subModulos?.length || 0;
                                        return (
                                            <Fragment key={modulo.id}>
                                                {/* ── Módulo row ── */}
                                                <tr className="group">
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span className="text-xs text-gray-400 dark:text-slate-500 font-mono">{modulo.orden}</span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-slate-800 flex items-center justify-center mx-auto">
                                                            <Icon icon={modulo.icono || 'solar:widget-bold-duotone'} width={18} className="text-gray-500 dark:text-slate-400" />
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-2 py-1 rounded-md">
                                                            {modulo.codigo}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="font-semibold text-gray-800 dark:text-slate-200">{modulo.nombre}</span>
                                                    </td>
                                                    <td>
                                                        <span className="text-gray-500 dark:text-slate-400 text-xs max-w-xs truncate block" title={modulo.descripcion}>
                                                            {modulo.descripcion || '—'}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <ProductoBadge producto={modulo.producto} />
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <EstadoBadge activo={modulo.activo} />
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button
                                                            onClick={() => vm.toggleExpanded(modulo.id)}
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                                                                subCount > 0
                                                                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 hover:bg-indigo-100'
                                                                    : 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500'
                                                            }`}
                                                        >
                                                            {subCount}
                                                            {subCount > 0 && (
                                                                <Icon icon={isExpanded ? 'solar:alt-arrow-up-bold' : 'solar:alt-arrow-down-bold'} width={10} />
                                                            )}
                                                        </button>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <div className="flex items-center justify-center gap-1">
                                                            <div className={DataTableStyles.tooltipContainer}>
                                                                <button
                                                                    onClick={() => vm.toggleExpanded(modulo.id)}
                                                                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400 transition-all"
                                                                >
                                                                    <Icon icon={isExpanded ? 'solar:alt-arrow-up-bold' : 'solar:alt-arrow-down-bold'} width={13} />
                                                                </button>
                                                                <p className={DataTableStyles.tooltip}>{isExpanded ? 'Ocultar' : 'Ver submódulos'}</p>
                                                            </div>
                                                            <div className={DataTableStyles.tooltipContainer}>
                                                                <button
                                                                    onClick={() => vm.handleOpenCreateSub(modulo.id)}
                                                                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 transition-all"
                                                                >
                                                                    <Icon icon="solar:add-circle-bold" width={14} />
                                                                </button>
                                                                <p className={DataTableStyles.tooltip}>Agregar submódulo</p>
                                                            </div>
                                                            <div className={DataTableStyles.tooltipContainer}>
                                                                <button
                                                                    onClick={() => vm.handleOpenEdit(modulo)}
                                                                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-violet-50 text-violet-600 hover:bg-violet-100 border border-violet-100 dark:bg-violet-900/20 dark:border-violet-800 dark:text-violet-400 transition-all"
                                                                >
                                                                    <Icon icon="solar:pen-bold" width={13} />
                                                                </button>
                                                                <p className={DataTableStyles.tooltip}>Editar</p>
                                                            </div>
                                                            <div className={DataTableStyles.tooltipContainer}>
                                                                <button
                                                                    onClick={() => vm.confirmDelete(modulo.id)}
                                                                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400 transition-all"
                                                                >
                                                                    <Icon icon="solar:trash-bin-trash-bold" width={13} />
                                                                </button>
                                                                <p className={DataTableStyles.tooltip}>Eliminar</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* ── Submódulos expandibles ── */}
                                                {isExpanded && (
                                                    subCount === 0 ? (
                                                        <tr>
                                                            <td colSpan={9}>
                                                                <div className="flex items-center gap-2 pl-16 py-2 text-xs text-gray-400 dark:text-slate-500 italic">
                                                                    <Icon icon="solar:info-circle-bold-duotone" width={14} className="text-gray-300" />
                                                                    Sin submódulos. Usa el botón
                                                                    <Icon icon="solar:add-circle-bold" className="text-emerald-500" width={14} />
                                                                    para agregar.
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        modulo.subModulos.map((sub: ISubModulo) => (
                                                            <tr key={`sub-${sub.id}`} style={{ backgroundColor: 'var(--sub-row-bg, #f8fafc)' }} className="dark:[--sub-row-bg:#0d1117]">
                                                                <td style={{ textAlign: 'center' }}>
                                                                    <span className="text-[10px] text-gray-300 dark:text-slate-600 font-mono">{sub.orden}</span>
                                                                </td>
                                                                <td style={{ textAlign: 'center' }}>
                                                                    <Icon icon="solar:arrow-right-down-bold" width={14} className="text-gray-300 dark:text-slate-600 mx-auto" />
                                                                </td>
                                                                <td>
                                                                    <span className="text-[11px] bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-md">
                                                                        {sub.codigo}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className="text-sm text-gray-700 dark:text-slate-300">{sub.nombre}</span>
                                                                </td>
                                                                <td>
                                                                    <span className="text-xs text-gray-400 dark:text-slate-500 max-w-xs truncate block" title={sub.descripcion}>
                                                                        {sub.descripcion || '—'}
                                                                    </span>
                                                                </td>
                                                                <td />
                                                                <td style={{ textAlign: 'center' }}>
                                                                    <EstadoBadge activo={sub.activo} />
                                                                </td>
                                                                <td />
                                                                <td style={{ textAlign: 'center' }}>
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <div className={DataTableStyles.tooltipContainer}>
                                                                            <button
                                                                                onClick={() => vm.handleOpenEditSub(sub)}
                                                                                className="w-7 h-7 rounded-lg flex items-center justify-center bg-violet-50 text-violet-600 hover:bg-violet-100 border border-violet-100 dark:bg-violet-900/20 dark:border-violet-800 dark:text-violet-400 transition-all"
                                                                            >
                                                                                <Icon icon="solar:pen-bold" width={13} />
                                                                            </button>
                                                                            <p className={DataTableStyles.tooltip}>Editar</p>
                                                                        </div>
                                                                        <div className={DataTableStyles.tooltipContainer}>
                                                                            <button
                                                                                onClick={() => vm.confirmDeleteSub(sub.id)}
                                                                                className="w-7 h-7 rounded-lg flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400 transition-all"
                                                                            >
                                                                                <Icon icon="solar:trash-bin-trash-bold" width={13} />
                                                                            </button>
                                                                            <p className={DataTableStyles.tooltip}>Eliminar</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <div className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-full mb-4">
                                    <Icon icon="solar:widget-linear" className="text-6xl text-gray-300 dark:text-slate-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">No hay módulos registrados</h3>
                                <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
                                    {vm.productoFiltro ? `No hay módulos para "${vm.productoFiltro}"` : 'Crea el primer módulo del sistema'}
                                </p>
                                <button
                                    onClick={vm.handleOpenCreate}
                                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all"
                                >
                                    <Icon icon="solar:add-circle-bold" />
                                    Crear Módulo
                                </button>
                            </div>
                        )}
                    </div>
                </AutoScrollTable>
            </div>

            {/* ── Modal Módulo ── */}
            <Modal isOpenModal={vm.isModalOpen} closeModal={() => vm.setIsModalOpen(false)} title={vm.isEdit ? 'Editar Módulo' : 'Nuevo Módulo'}>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                        <InputPro isLabel label="Código (Identificador)" name="codigo" value={vm.form.codigo} onChange={(e) => vm.setForm({ ...vm.form, codigo: e.target.value })} placeholder="Ej. kardex, ventas..." disabled={vm.isEdit} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <InputPro isLabel label="Nombre Visible" name="nombre" value={vm.form.nombre} onChange={(e) => vm.setForm({ ...vm.form, nombre: e.target.value })} placeholder="Ej. Inventario" />
                    </div>
                    {!vm.productoScope && (
                        <div className="col-span-2">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Producto</p>
                            <div className="grid grid-cols-2 gap-3">
                                {([
                                    { id: 'facturacion', label: 'Facturación', icon: 'solar:bill-list-bold-duotone', color: '#0EA5E9' },
                                    { id: 'hotel', label: 'Hotel', icon: 'solar:bed-bold-duotone', color: '#F59E0B' },
                                ] as const).map((product) => {
                                    const selected = (vm.form.producto || 'facturacion') === product.id;
                                    return (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => vm.setForm({ ...vm.form, producto: product.id })}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${selected ? 'border-sky-500 bg-sky-50 shadow-sm dark:bg-sky-900/20 dark:border-sky-600' : 'border-gray-200 dark:border-slate-700 hover:border-sky-300 bg-white dark:bg-slate-800'}`}
                                        >
                                            <Icon icon={product.icon} width={20} style={{ color: selected ? product.color : '#9CA3AF' }} />
                                            <span className={`font-semibold text-sm ${selected ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{product.label}</span>
                                            {selected && <Icon icon="solar:check-circle-bold" width={16} className="ml-auto text-sky-500" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    <div className="col-span-2">
                        <InputPro isLabel label="Descripción" name="descripcion" value={vm.form.descripcion} onChange={(e) => vm.setForm({ ...vm.form, descripcion: e.target.value })} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <InputPro isLabel label="Icono (Iconify)" name="icono" value={vm.form.icono} onChange={(e) => vm.setForm({ ...vm.form, icono: e.target.value })} placeholder="Ej. solar:box-bold-duotone" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <InputPro isLabel label="Orden" name="orden" type="number" value={vm.form.orden} onChange={(e) => vm.setForm({ ...vm.form, orden: Number(e.target.value) })} />
                    </div>
                    <div className="col-span-2 mt-2">
                        <Toggle label="Módulo Activo" value={vm.form.activo || false} onChange={v => vm.setForm({ ...vm.form, activo: v })} />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Si se desactiva, no aparecerá disponible para asignar a nuevos planes.</p>
                    </div>
                    {vm.form.icono && (
                        <div className="col-span-2 mt-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3 rounded-xl text-sm text-blue-800 dark:text-blue-300 flex items-center gap-3">
                            <Icon icon="solar:eye-bold-duotone" width={16} />
                            <span>Preview:</span>
                            <Icon icon={vm.form.icono || 'mdi:help-circle'} className="text-2xl" />
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2 p-4 pt-0">
                    <Button onClick={() => vm.setIsModalOpen(false)} color="secondary" outline>Cancelar</Button>
                    <Button onClick={vm.handleSubmit} color="primary" disabled={vm.loading}>{vm.loading ? 'Guardando...' : 'Guardar'}</Button>
                </div>
            </Modal>

            {/* ── Modal SubMódulo ── */}
            <Modal isOpenModal={vm.isSubModalOpen} closeModal={() => vm.setIsSubModalOpen(false)} title={vm.isSubEdit ? 'Editar Submódulo' : 'Nuevo Submódulo'}>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {!vm.isSubEdit && (
                        <div className="col-span-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg px-4 py-2 text-sm text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                            <Icon icon="solar:info-circle-bold-duotone" width={16} />
                            Submódulo de: <strong>{vm.modulos.find(m => m.id === vm.subForm.moduloId)?.nombre}</strong>
                        </div>
                    )}
                    <div className="col-span-2 md:col-span-1">
                        <InputPro isLabel label="Código" name="codigo" value={vm.subForm.codigo} onChange={(e) => vm.setSubForm({ ...vm.subForm, codigo: e.target.value })} placeholder="Ej. comprobantes:emitir" disabled={vm.isSubEdit} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <InputPro isLabel label="Nombre Visible" name="nombre" value={vm.subForm.nombre} onChange={(e) => vm.setSubForm({ ...vm.subForm, nombre: e.target.value })} placeholder="Ej. Emitir comprobante" />
                    </div>
                    <div className="col-span-2">
                        <InputPro isLabel label="Descripción" name="descripcion" value={vm.subForm.descripcion} onChange={(e) => vm.setSubForm({ ...vm.subForm, descripcion: e.target.value })} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <InputPro isLabel label="Orden" name="orden" type="number" value={vm.subForm.orden} onChange={(e) => vm.setSubForm({ ...vm.subForm, orden: Number(e.target.value) })} />
                    </div>
                    <div className="col-span-2 mt-2">
                        <Toggle label="Submódulo Activo" value={vm.subForm.activo} onChange={v => vm.setSubForm({ ...vm.subForm, activo: v })} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 p-4 pt-0">
                    <Button onClick={() => vm.setIsSubModalOpen(false)} color="secondary" outline>Cancelar</Button>
                    <Button onClick={vm.handleSubmitSub} color="primary" disabled={vm.loading}>{vm.loading ? 'Guardando...' : 'Guardar'}</Button>
                </div>
            </Modal>

            <ModalConfirm
                isOpenModal={vm.modalConfirmOpen}
                setIsOpenModal={vm.setModalConfirmOpen}
                confirmSubmit={vm.handleDelete}
                title="¿Eliminar Módulo?"
                information="Esta acción eliminará el módulo y todos sus submódulos. Los planes que lo usen perderán acceso a él."
            />
            <ModalConfirm
                isOpenModal={vm.modalConfirmSubOpen}
                setIsOpenModal={vm.setModalConfirmSubOpen}
                confirmSubmit={vm.handleDeleteSub}
                title="¿Eliminar Submódulo?"
                information="Se eliminará el submódulo y se revocarán los permisos de todos los usuarios que lo tenían asignado."
            />
        </div>
    );
};

export default ModulosPage;
