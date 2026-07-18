import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { get, post, patch, del } from '@/utils/fetch';
import useAlertStore from '@/zustand/alert';
import { useDebounce } from '@/hooks/useDebounce';
import DataTable from '@/components/Datatable';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import ModalConfirm from '@/components/ModalConfirm';
import TableActionMenu from '@/components/TableActionMenu';
import type {
    IContratoVehicular, IVehiculo, IContratosResponse, EstadoContrato,
} from '@/interfaces/vehiculo';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: string) =>
    new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(v));
const diasRestantes = (fechaFin: string): number =>
    Math.ceil((new Date(fechaFin).getTime() - Date.now()) / 86400000);

const estadoBadge: Record<EstadoContrato, string> = {
    VIGENTE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    POR_VENCER: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    VENCIDO: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
    CANCELADO: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};
const estadoLabel: Record<EstadoContrato, string> = {
    VIGENTE: 'Vigente', POR_VENCER: 'Por vencer', VENCIDO: 'Vencido', CANCELADO: 'Cancelado',
};
const diasColor = (dias: number) => (dias < 0 ? 'text-rose-600 font-bold' : dias <= 30 ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-medium');

const ESTADO_OPTS = [
    { id: 'TODOS', value: 'Todos los estados' },
    { id: 'VIGENTE', value: 'Vigentes' },
    { id: 'POR_VENCER', value: 'Por vencer' },
    { id: 'VENCIDO', value: 'Vencidos' },
    { id: 'CANCELADO', value: 'Cancelados' },
];
const DURACION_OPTS = [{ id: 6, value: '6 meses' }, { id: 12, value: '12 meses' }, { id: 24, value: '24 meses' }];

const mesesEntre = (inicio: string, fin: string) => {
    const a = new Date(inicio); const b = new Date(fin);
    const m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
    return m > 0 ? m : 12;
};

// ─── Modal Crear / Editar Contrato ────────────────────────────────────────────
function ContratoModal({ contrato, onClose, onSaved }: { contrato?: IContratoVehicular | null; onClose: () => void; onSaved: () => void }) {
    const { alert } = useAlertStore();
    const esEdicion = !!contrato;
    const [loading, setLoading] = useState(false);
    const [vehiculos, setVehiculos] = useState<IVehiculo[]>([]);
    const [productos, setProductos] = useState<{ id: number; descripcion: string; precioUnitario?: number }[]>([]);
    const [form, setForm] = useState({
        vehiculoId: contrato ? String(contrato.vehiculoId) : '',
        fechaInicio: contrato ? new Date(contrato.fechaInicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        duracionMeses: contrato ? String(mesesEntre(contrato.fechaInicio, contrato.fechaFin)) : '12',
        productoId: contrato?.producto?.id ? String(contrato.producto.id) : '',
        montoAnual: contrato?.montoAnual != null ? String(contrato.montoAnual) : '',
        observaciones: contrato?.observaciones ?? '',
    });

    useEffect(() => { if (!esEdicion) get('vehiculos?limit=200').then((resp: any) => setVehiculos(resp.data?.data ?? [])); }, [esEdicion]);
    useEffect(() => {
        get('productos?limit=200&soloVendibles=true')
            .then((resp: any) => setProductos(resp.data?.productos ?? []))
            .catch(() => { /* silencioso: el selector de servicio queda vacío */ });
    }, []);

    const vehiculoOpts = vehiculos.map((v) => ({ id: v.id, value: `${v.placa} — ${v.marca} ${v.modelo || ''}${v.cliente ? ` (${v.cliente.nombre})` : ''}` }));
    const vehiculoSel = vehiculoOpts.find((o) => String(o.id) === form.vehiculoId)?.value || '';
    const productoOpts = productos.map((p) => ({ id: p.id, value: p.descripcion }));
    const productoSel = productoOpts.find((o) => String(o.id) === form.productoId)?.value || '';
    // La duración editada puede no estar en el catálogo base; la añadimos si falta.
    const duracionOpts = DURACION_OPTS.some((o) => String(o.id) === form.duracionMeses)
        ? DURACION_OPTS
        : [...DURACION_OPTS, { id: parseInt(form.duracionMeses), value: `${form.duracionMeses} meses` }];
    const duracionSel = duracionOpts.find((o) => String(o.id) === form.duracionMeses)?.value || '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!esEdicion && !form.vehiculoId) { alert('Selecciona un vehículo', 'warning'); return; }
        setLoading(true);
        try {
            const payload: any = {
                fechaInicio: form.fechaInicio,
                duracionMeses: parseInt(form.duracionMeses),
                productoId: form.productoId ? parseInt(form.productoId) : undefined,
                montoAnual: form.montoAnual ? parseFloat(form.montoAnual) : undefined,
                observaciones: form.observaciones || undefined,
            };
            if (esEdicion) {
                await patch(`contratos-vehiculares/${contrato!.id}`, payload);
                alert('Contrato actualizado', 'success');
            } else {
                await post('contratos-vehiculares', { vehiculoId: parseInt(form.vehiculoId), ...payload });
                alert('Contrato creado exitosamente', 'success');
            }
            onSaved();
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Error al guardar el contrato', 'error');
        } finally { setLoading(false); }
    };

    const fechaFinPreview = (() => {
        if (!form.fechaInicio || !form.duracionMeses) return null;
        const d = new Date(form.fechaInicio); d.setMonth(d.getMonth() + parseInt(form.duracionMeses));
        return fmt(d.toISOString());
    })();

    return (
        <Modal
            isOpenModal
            closeModal={onClose}
            title={esEdicion ? 'Editar contrato' : 'Nuevo contrato'}
            icon={esEdicion ? 'solar:pen-2-bold-duotone' : 'solar:document-add-bold-duotone'}
            width="560px"
            position="center"
        >
            <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6">
                {esEdicion ? (
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">Vehículo</label>
                        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800/50">
                            <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-sm font-bold tracking-widest text-gray-800 dark:bg-slate-800 dark:text-gray-100">{contrato!.vehiculo?.placa}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-300">{contrato!.vehiculo?.marca} {contrato!.vehiculo?.modelo || ''}</span>
                        </div>
                    </div>
                ) : (
                    <Select name="vehiculoId" label="Vehículo *" options={vehiculoOpts} value={vehiculoSel} isSearch onChange={(id: any) => setForm((f) => ({ ...f, vehiculoId: String(id) }))} placeholder="— Seleccionar vehículo —" error={null} />
                )}
                <Select
                    name="productoId"
                    label="Servicio"
                    options={productoOpts}
                    value={productoSel}
                    isSearch
                    onChange={(id: any) => setForm((f) => {
                        const prod = productos.find((p) => String(p.id) === String(id));
                        // Autocompleta el monto con el precio del servicio si aún no se ingresó uno.
                        const montoAnual = f.montoAnual || (prod?.precioUnitario != null ? String(prod.precioUnitario) : '');
                        return { ...f, productoId: String(id), montoAnual };
                    })}
                    placeholder="— Servicio (GPS, monitoreo, alarma...) —"
                    error={null}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InputPro name="fechaInicio" type="date" value={form.fechaInicio} onChange={(e) => setForm((f) => ({ ...f, fechaInicio: e.target.value }))} isLabel label="Fecha de inicio *" error={null} />
                    <Select name="duracionMeses" label="Duración" options={duracionOpts} value={duracionSel} onChange={(id: any) => setForm((f) => ({ ...f, duracionMeses: String(id) }))} error={null} />
                </div>
                {fechaFinPreview && (
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
                        <Icon icon="solar:calendar-mark-bold" className="text-lg text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">Vence el <strong className="text-gray-800 dark:text-gray-100">{fechaFinPreview}</strong></span>
                    </div>
                )}
                <InputPro name="montoAnual" type="number" value={form.montoAnual} onChange={(e) => setForm((f) => ({ ...f, montoAnual: e.target.value }))} isLabel label="Monto anual (S/)" placeholder="500.00" error={null} />
                <InputPro name="observaciones" type="textarea" rows={3} value={form.observaciones} onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))} isLabel label="Observaciones" placeholder="GPS marca X instalado, alarma modelo Y..." error={null} />
                <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
                    <Button color="gray" className="w-full sm:w-auto" onClick={onClose}>Cancelar</Button>
                    <Button color="secondary" type="submit" isLoading={loading} className="w-full sm:w-auto">{esEdicion ? 'Guardar cambios' : 'Crear contrato'}</Button>
                </div>
            </form>
        </Modal>
    );
}

// Ítem de menú reutilizable para el dropdown de acciones.
function MenuItem({ icon, label, onClick, danger }: { icon: string; label: string; onClick: () => void; danger?: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition hover:bg-gray-100 dark:hover:bg-slate-700 ${danger ? 'text-rose-600 dark:text-rose-400' : 'text-gray-700 dark:text-gray-300'}`}
        >
            <Icon icon={icon} width={16} height={16} />
            <span>{label}</span>
        </button>
    );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function ContratosVehicularesPage() {
    const { alert } = useAlertStore();
    const [data, setData] = useState<IContratoVehicular[]>([]);
    const [alertas, setAlertas] = useState<IContratoVehicular[]>([]);
    const [total, setTotal] = useState(0);
    const [estadoFilter, setEstadoFilter] = useState<EstadoContrato | 'TODOS'>('TODOS');
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 350);
    const [loading, setLoading] = useState(false);

    const [modalNuevo, setModalNuevo] = useState(false);
    const [contratoEditar, setContratoEditar] = useState<IContratoVehicular | null>(null);
    const [renovando, setRenovando] = useState<number | null>(null);
    const [contratoRenovar, setContratoRenovar] = useState<IContratoVehicular | null>(null);
    const [contratoCancelar, setContratoCancelar] = useState<IContratoVehicular | null>(null);
    const [cancelando, setCancelando] = useState(false);
    const [contratoEliminar, setContratoEliminar] = useState<IContratoVehicular | null>(null);
    const [eliminando, setEliminando] = useState(false);

    // Menú de acciones (dropdown) por fila.
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const [menuRow, setMenuRow] = useState<IContratoVehicular | null>(null);
    const openMenu = (e: React.MouseEvent<HTMLElement>, row: IContratoVehicular) => { setMenuAnchor(e.currentTarget); setMenuRow(row); };
    const closeMenu = () => { setMenuAnchor(null); setMenuRow(null); };

    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: '1', limit: '100',
                ...(estadoFilter !== 'TODOS' ? { estado: estadoFilter } : {}),
                ...(debouncedSearch ? { search: debouncedSearch } : {}),
            });
            const [resp, alertasResp]: any[] = await Promise.all([
                get(`contratos-vehiculares?${params}`),
                get('contratos-vehiculares/alertas'),
            ]);
            const body: IContratosResponse = resp.data;
            setData(body.data);
            setTotal(body.paginacion?.total ?? body.data.length);
            setAlertas(alertasResp.data ?? []);
        } catch { alert('Error al cargar contratos', 'error'); }
        finally { setLoading(false); }
    }, [estadoFilter, debouncedSearch]);
    useEffect(() => { cargar(); }, [cargar]);

    // Renovar pasa siempre por confirmación para evitar renovaciones por error.
    const confirmarRenovar = async () => {
        if (!contratoRenovar) return;
        const contrato = contratoRenovar;
        setRenovando(contrato.id);
        setContratoRenovar(null);
        try { await patch(`contratos-vehiculares/${contrato.id}/renovar`, {}); alert(`Contrato de ${contrato.vehiculo?.placa} renovado por 12 meses`, 'success'); cargar(); }
        catch (err: any) { alert(err?.response?.data?.message || 'Error al renovar', 'error'); }
        finally { setRenovando(null); }
    };

    const handleCancelar = async () => {
        if (!contratoCancelar) return;
        setCancelando(true);
        try { await patch(`contratos-vehiculares/${contratoCancelar.id}/cancelar`, {}); alert('Contrato cancelado', 'success'); setContratoCancelar(null); cargar(); }
        catch (err: any) { alert(err?.response?.data?.message || 'Error al cancelar', 'error'); }
        finally { setCancelando(false); }
    };

    const handleEliminar = async () => {
        if (!contratoEliminar) return;
        setEliminando(true);
        try { await del(`contratos-vehiculares/${contratoEliminar.id}`); alert('Contrato eliminado', 'success'); setContratoEliminar(null); cargar(); }
        catch (err: any) { alert(err?.response?.data?.message || 'Error al eliminar', 'error'); }
        finally { setEliminando(false); }
    };

    const bodyData = data.map((c) => {
        const dias = diasRestantes(c.fechaFin);
        return {
            id: c.id,
            Vehículo: (
                <div>
                    <span className="rounded-lg bg-gray-100 px-2 py-0.5 font-mono text-sm font-bold tracking-widest text-gray-800 dark:bg-slate-800 dark:text-gray-100">{c.vehiculo?.placa}</span>
                    <p className="mt-0.5 text-xs text-gray-400">{c.vehiculo?.marca} {c.vehiculo?.modelo || ''}</p>
                </div>
            ),
            Propietario: <span className="text-sm text-gray-700 dark:text-gray-200">{c.vehiculo?.cliente?.nombre || '—'}</span>,
            Servicio: c.producto?.descripcion ? <span className="text-sm text-gray-600 dark:text-gray-300">{c.producto.descripcion}</span> : <span className="text-gray-300">—</span>,
            Inicio: <span className="text-sm text-gray-500">{fmt(c.fechaInicio)}</span>,
            Vencimiento: (
                <div><p className="text-sm font-medium text-gray-700 dark:text-gray-200">{fmt(c.fechaFin)}</p><p className={`mt-0.5 text-xs ${diasColor(dias)}`}>{dias < 0 ? `Venció hace ${Math.abs(dias)}d` : `${dias} días`}</p></div>
            ),
            Estado: <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoBadge[c.estado]}`}>{estadoLabel[c.estado]}</span>,
            Acciones: (
                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                    <button
                        type="button"
                        aria-label="Acciones"
                        onClick={(e) => openMenu(e, c)}
                        disabled={renovando === c.id}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                    >
                        {renovando === c.id ? <Icon icon="eos-icons:loading" width={18} /> : <Icon icon="mdi:dots-vertical" width={18} height={18} />}
                    </button>
                </div>
            ),
        };
    });

    return (
        <div className="min-h-screen px-2 pb-4 relative z-1 dark:bg-[#0A0D14]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Contratos y suscripciones</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Trazabilidad vehicular · {total} contrato{total !== 1 ? 's' : ''}</p>
                </div>
                <Button color="secondary" onClick={() => setModalNuevo(true)} className="flex items-center gap-2">
                    <Icon icon="solar:add-circle-bold" className="text-lg" />Nuevo contrato
                </Button>
            </div>

            {/* Alertas de vencimiento */}
            {alertas.length > 0 && (
                <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="mb-3 flex items-center gap-2"><Icon icon="solar:danger-triangle-bold" className="text-xl text-amber-500" /><h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{alertas.length} contrato{alertas.length !== 1 ? 's' : ''} por vencer en los próximos 30 días</h3></div>
                    <div className="flex flex-wrap gap-2">
                        {alertas.slice(0, 8).map((c) => {
                            const dias = diasRestantes(c.fechaFin);
                            return (
                                <div key={c.id} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                                    <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-100">{c.vehiculo?.placa}</span>
                                    <span className={`text-xs ${diasColor(dias)}`}>{dias < 0 ? 'Vencido' : `${dias}d`}</span>
                                    <button onClick={() => setContratoRenovar(c)} disabled={renovando === c.id} className="rounded-lg bg-gray-900 px-2 py-1 text-xs text-white transition hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900">{renovando === c.id ? '...' : 'Renovar'}</button>
                                </div>
                            );
                        })}
                        {alertas.length > 8 && <span className="self-center text-xs text-gray-500">+{alertas.length - 8} más</span>}
                    </div>
                </div>
            )}

            {/* Main Content Card */}
            <div className="bg-white dark:bg-[#111827] relative z-0 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                {/* Toolbar: filtros */}
                <div className="p-5 border-b border-gray-100 dark:border-slate-800">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="w-full sm:w-56">
                            <Select name="estado" label="Estado" options={ESTADO_OPTS} value={ESTADO_OPTS.find((o) => o.id === estadoFilter)?.value || 'Todos los estados'} onChange={(id: any) => setEstadoFilter(id as any)} error={null} />
                        </div>
                        <div className="w-full sm:max-w-xs sm:flex-1">
                            <InputPro name="search" value={search} onChange={(e) => setSearch(e.target.value)} label="Buscar por placa o propietario" isLabel error={null} />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="p-4">
                    {loading ? (
                        <div className="flex justify-center py-16"><Icon icon="eos-icons:loading" className="text-4xl text-gray-300" /></div>
                    ) : data.length === 0 ? (
                        <div className="py-16 text-center">
                            <Icon icon="solar:document-linear" className="mx-auto mb-3 text-5xl text-gray-300" />
                            <p className="text-gray-500">No hay contratos registrados</p>
                            <p className="text-sm text-gray-400 mt-1">Crea el primero con “Nuevo contrato”</p>
                        </div>
                    ) : (
                        <div className="min-h-[450px]">
                            <DataTable headerColumns={['Vehículo', 'Propietario', 'Servicio', 'Inicio', 'Vencimiento', 'Estado', 'Acciones']} bodyData={bodyData} pageSize={15} />
                        </div>
                    )}
                </div>
            </div>

            {/* Dropdown de acciones */}
            <TableActionMenu isOpen={Boolean(menuAnchor)} anchorEl={menuAnchor} onClose={closeMenu} className="w-48">
                {menuRow && (() => {
                    const row = menuRow;
                    return (
                        <>
                            <MenuItem icon="solar:pen-bold" label="Editar contrato" onClick={() => { setContratoEditar(row); closeMenu(); }} />
                            {row.estado !== 'CANCELADO' && (
                                <MenuItem icon="solar:refresh-circle-bold" label="Renovar +12 meses" onClick={() => { setContratoRenovar(row); closeMenu(); }} />
                            )}
                            {row.estado !== 'CANCELADO' && row.estado !== 'VENCIDO' && (
                                <MenuItem icon="solar:close-circle-bold" label="Cancelar contrato" onClick={() => { setContratoCancelar(row); closeMenu(); }} />
                            )}
                            <div className="my-1 border-t border-gray-100 dark:border-slate-700" />
                            <MenuItem icon="solar:trash-bin-trash-bold" label="Eliminar" danger onClick={() => { setContratoEliminar(row); closeMenu(); }} />
                        </>
                    );
                })()}
            </TableActionMenu>

            {(modalNuevo || contratoEditar) && (
                <ContratoModal
                    contrato={contratoEditar}
                    onClose={() => { setModalNuevo(false); setContratoEditar(null); }}
                    onSaved={() => { setModalNuevo(false); setContratoEditar(null); cargar(); }}
                />
            )}
            {contratoRenovar && (
                <ModalConfirm
                    isOpenModal={!!contratoRenovar}
                    setIsOpenModal={(v) => { if (!v) setContratoRenovar(null); }}
                    confirmSubmit={confirmarRenovar}
                    title="Renovar contrato"
                    information={`¿Renovar el contrato del vehículo ${contratoRenovar.vehiculo?.placa} por 12 meses más?`}
                    confirmText="Renovar"
                />
            )}
            {contratoCancelar && (
                <ModalConfirm
                    isOpenModal={!!contratoCancelar}
                    setIsOpenModal={(v) => { if (!v) setContratoCancelar(null); }}
                    confirmSubmit={handleCancelar}
                    title="Cancelar contrato"
                    information={`¿Cancelar el contrato del vehículo ${contratoCancelar.vehiculo?.placa}? El contrato queda inactivo pero conserva su historial.`}
                    confirmText="Cancelar contrato"
                    confirmLoading={cancelando}
                />
            )}
            {contratoEliminar && (
                <ModalConfirm
                    isOpenModal={!!contratoEliminar}
                    setIsOpenModal={(v) => { if (!v) setContratoEliminar(null); }}
                    confirmSubmit={handleEliminar}
                    title="Eliminar contrato"
                    information={`¿Eliminar definitivamente el contrato del vehículo ${contratoEliminar.vehiculo?.placa}? Esta acción no se puede deshacer.`}
                    confirmText="Eliminar"
                    confirmLoading={eliminando}
                />
            )}
        </div>
    );
}
