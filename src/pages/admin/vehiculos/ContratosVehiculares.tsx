import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { get, post, patch } from '@/utils/fetch';
import useAlertStore from '@/zustand/alert';
import { useDebounce } from '@/hooks/useDebounce';
import DataTable from '@/components/Datatable';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import ModalConfirm from '@/components/ModalConfirm';
import type {
    IContratoVehicular, IVehiculo, IContratosResponse, EstadoContrato,
} from '@/interfaces/vehiculo';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: string) =>
    new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(v));
const diasRestantes = (fechaFin: string): number =>
    Math.ceil((new Date(fechaFin).getTime() - Date.now()) / 86400000);

const estadoBadge: Record<EstadoContrato, string> = {
    VIGENTE: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400',
    POR_VENCER: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400',
    VENCIDO: 'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-400',
    CANCELADO: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200 dark:bg-slate-700 dark:text-slate-400',
};
const estadoLabel: Record<EstadoContrato, string> = {
    VIGENTE: 'Vigente', POR_VENCER: 'Por vencer', VENCIDO: 'Vencido', CANCELADO: 'Cancelado',
};
const diasColor = (dias: number) => (dias < 0 ? 'text-red-600 font-bold' : dias <= 30 ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-medium');

const ESTADO_OPTS = [
    { id: 'TODOS', value: 'Todos los estados' },
    { id: 'VIGENTE', value: 'Vigentes' },
    { id: 'POR_VENCER', value: 'Por vencer' },
    { id: 'VENCIDO', value: 'Vencidos' },
    { id: 'CANCELADO', value: 'Cancelados' },
];
const DURACION_OPTS = [{ id: 6, value: '6 meses' }, { id: 12, value: '12 meses' }, { id: 24, value: '24 meses' }];

// ─── Modal Nuevo Contrato ─────────────────────────────────────────────────────
function NuevoContratoModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
    const { alert } = useAlertStore();
    const [loading, setLoading] = useState(false);
    const [vehiculos, setVehiculos] = useState<IVehiculo[]>([]);
    const [form, setForm] = useState({
        vehiculoId: '', fechaInicio: new Date().toISOString().split('T')[0],
        duracionMeses: '12', montoAnual: '', observaciones: '',
    });

    useEffect(() => { get('vehiculos?limit=200').then((resp: any) => setVehiculos(resp.data?.data ?? [])); }, []);

    const vehiculoOpts = vehiculos.map((v) => ({ id: v.id, value: `${v.placa} — ${v.marca} ${v.modelo || ''}${v.cliente ? ` (${v.cliente.nombre})` : ''}` }));
    const vehiculoSel = vehiculoOpts.find((o) => String(o.id) === form.vehiculoId)?.value || '';
    const duracionSel = DURACION_OPTS.find((o) => String(o.id) === form.duracionMeses)?.value || '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.vehiculoId) { alert('Selecciona un vehículo', 'warning'); return; }
        setLoading(true);
        try {
            await post('contratos-vehiculares', {
                vehiculoId: parseInt(form.vehiculoId), fechaInicio: form.fechaInicio,
                duracionMeses: parseInt(form.duracionMeses),
                montoAnual: form.montoAnual ? parseFloat(form.montoAnual) : undefined,
                observaciones: form.observaciones || undefined,
            });
            alert('Contrato creado exitosamente', 'success');
            onSaved();
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Error al crear contrato', 'error');
        } finally { setLoading(false); }
    };

    const fechaFinPreview = (() => {
        if (!form.fechaInicio || !form.duracionMeses) return null;
        const d = new Date(form.fechaInicio); d.setMonth(d.getMonth() + parseInt(form.duracionMeses));
        return fmt(d.toISOString());
    })();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
                <div className="flex items-center justify-between bg-gradient-to-r from-indigo-700 to-indigo-600 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-white/10 p-2"><Icon icon="solar:document-add-bold-duotone" className="text-2xl text-white" /></div>
                        <div><h2 className="text-lg font-semibold text-white">Nuevo contrato</h2><p className="text-xs text-indigo-200">Suscripción anual vehicular</p></div>
                    </div>
                    <button onClick={onClose} className="text-indigo-200 transition hover:text-white"><Icon icon="solar:close-circle-bold" className="text-2xl" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 p-6">
                    <Select name="vehiculoId" label="Vehículo *" options={vehiculoOpts} value={vehiculoSel} isSearch onChange={(id: any) => setForm((f) => ({ ...f, vehiculoId: String(id) }))} placeholder="— Seleccionar vehículo —" error={null} />
                    <div className="grid grid-cols-2 gap-4">
                        <InputPro name="fechaInicio" type="date" value={form.fechaInicio} onChange={(e) => setForm((f) => ({ ...f, fechaInicio: e.target.value }))} isLabel label="Fecha de inicio *" error={null} />
                        <Select name="duracionMeses" label="Duración" options={DURACION_OPTS} value={duracionSel} onChange={(id: any) => setForm((f) => ({ ...f, duracionMeses: String(id) }))} error={null} />
                    </div>
                    {fechaFinPreview && (
                        <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 dark:border-indigo-500/20 dark:bg-indigo-500/5">
                            <Icon icon="solar:calendar-mark-bold" className="text-lg text-indigo-500" />
                            <span className="text-sm text-indigo-700 dark:text-indigo-300">Vence el <strong>{fechaFinPreview}</strong></span>
                        </div>
                    )}
                    <InputPro name="montoAnual" type="number" value={form.montoAnual} onChange={(e) => setForm((f) => ({ ...f, montoAnual: e.target.value }))} isLabel label="Monto anual (S/)" placeholder="500.00" error={null} />
                    <InputPro name="observaciones" type="textarea" rows={3} value={form.observaciones} onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))} isLabel label="Observaciones" placeholder="GPS marca X instalado, alarma modelo Y..." error={null} />
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60">
                            {loading ? <Icon icon="eos-icons:loading" /> : <Icon icon="solar:check-circle-bold" />}Crear contrato
                        </button>
                    </div>
                </form>
            </div>
        </div>
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
    const [renovando, setRenovando] = useState<number | null>(null);
    const [contratoCancelar, setContratoCancelar] = useState<IContratoVehicular | null>(null);
    const [cancelando, setCancelando] = useState(false);

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

    const handleRenovar = async (contrato: IContratoVehicular) => {
        setRenovando(contrato.id);
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

    const bodyData = data.map((c) => {
        const dias = diasRestantes(c.fechaFin);
        return {
            id: c.id,
            Vehículo: (
                <div>
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-sm font-bold tracking-widest text-slate-800 dark:bg-slate-800 dark:text-slate-100">{c.vehiculo?.placa}</span>
                    <p className="mt-0.5 text-xs text-slate-400">{c.vehiculo?.marca} {c.vehiculo?.modelo || ''}</p>
                </div>
            ),
            Propietario: <span className="text-sm text-slate-700 dark:text-slate-200">{c.vehiculo?.cliente?.nombre || '—'}</span>,
            Servicio: c.producto?.descripcion ? <span className="text-sm text-slate-600 dark:text-slate-300">{c.producto.descripcion}</span> : <span className="text-slate-300">—</span>,
            Inicio: <span className="text-sm text-slate-500">{fmt(c.fechaInicio)}</span>,
            Vencimiento: (
                <div><p className="text-sm font-medium text-slate-700 dark:text-slate-200">{fmt(c.fechaFin)}</p><p className={`mt-0.5 text-xs ${diasColor(dias)}`}>{dias < 0 ? `Venció hace ${Math.abs(dias)}d` : `${dias} días`}</p></div>
            ),
            Estado: <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoBadge[c.estado]}`}>{estadoLabel[c.estado]}</span>,
            Acciones: (
                <div className="flex items-center gap-1">
                    {c.estado !== 'CANCELADO' && (
                        <button title="Renovar +12 meses" onClick={() => handleRenovar(c)} disabled={renovando === c.id} className="rounded-lg p-2 text-indigo-500 transition hover:bg-indigo-50 disabled:opacity-50 dark:hover:bg-indigo-500/10">
                            {renovando === c.id ? <Icon icon="eos-icons:loading" className="text-lg" /> : <Icon icon="solar:refresh-circle-bold" className="text-lg" />}
                        </button>
                    )}
                    {c.estado !== 'CANCELADO' && c.estado !== 'VENCIDO' && (
                        <button title="Cancelar contrato" onClick={() => setContratoCancelar(c)} className="rounded-lg p-2 text-red-400 transition hover:bg-red-50 dark:hover:bg-red-500/10"><Icon icon="solar:close-circle-bold" className="text-lg" /></button>
                    )}
                </div>
            ),
        };
    });

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-indigo-600 p-2.5"><Icon icon="solar:document-bold-duotone" className="text-2xl text-white" /></div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Contratos y suscripciones</h1>
                        <p className="text-sm text-slate-400">Trazabilidad vehicular · {total} contrato{total !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <button onClick={() => setModalNuevo(true)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"><Icon icon="solar:add-circle-bold" className="text-lg" />Nuevo contrato</button>
            </div>

            {alertas.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
                    <div className="mb-3 flex items-center gap-2"><Icon icon="solar:danger-triangle-bold" className="text-xl text-amber-600" /><h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400">{alertas.length} contrato{alertas.length !== 1 ? 's' : ''} por vencer en los próximos 30 días</h3></div>
                    <div className="flex flex-wrap gap-2">
                        {alertas.slice(0, 8).map((c) => {
                            const dias = diasRestantes(c.fechaFin);
                            return (
                                <div key={c.id} className="flex items-center gap-2 rounded-xl border border-amber-100 bg-white px-3 py-2 dark:border-amber-500/20 dark:bg-slate-900">
                                    <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-100">{c.vehiculo?.placa}</span>
                                    <span className={`text-xs ${diasColor(dias)}`}>{dias < 0 ? 'Vencido' : `${dias}d`}</span>
                                    <button onClick={() => handleRenovar(c)} disabled={renovando === c.id} className="rounded-lg bg-indigo-600 px-2 py-1 text-xs text-white transition hover:bg-indigo-700 disabled:opacity-60">{renovando === c.id ? '...' : 'Renovar'}</button>
                                </div>
                            );
                        })}
                        {alertas.length > 8 && <span className="self-center text-xs text-amber-600">+{alertas.length - 8} más</span>}
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-end gap-3">
                <div className="w-full sm:w-56">
                    <Select name="estado" label="Estado" options={ESTADO_OPTS} value={ESTADO_OPTS.find((o) => o.id === estadoFilter)?.value || 'Todos los estados'} onChange={(id: any) => setEstadoFilter(id as any)} error={null} />
                </div>
                <div className="w-full max-w-xs flex-1">
                    <InputPro name="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por placa o propietario..." error={null} />
                </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                {loading ? (
                    <div className="flex justify-center py-16"><Icon icon="eos-icons:loading" className="text-4xl text-slate-300" /></div>
                ) : data.length === 0 ? (
                    <div className="py-16 text-center text-slate-400"><Icon icon="solar:document-bold" className="mx-auto mb-3 text-5xl opacity-40" /><p className="text-sm font-semibold">No hay contratos registrados</p></div>
                ) : (
                    <DataTable headerColumns={['Vehículo', 'Propietario', 'Servicio', 'Inicio', 'Vencimiento', 'Estado', 'Acciones']} bodyData={bodyData} pageSize={15} />
                )}
            </div>

            {modalNuevo && <NuevoContratoModal onClose={() => setModalNuevo(false)} onSaved={() => { setModalNuevo(false); cargar(); }} />}
            {contratoCancelar && (
                <ModalConfirm
                    isOpenModal={!!contratoCancelar}
                    setIsOpenModal={(v) => { if (!v) setContratoCancelar(null); }}
                    confirmSubmit={handleCancelar}
                    title="Cancelar contrato"
                    information={`¿Cancelar el contrato del vehículo ${contratoCancelar.vehiculo?.placa}? Esta acción no se puede deshacer.`}
                    confirmText="Cancelar contrato"
                    confirmLoading={cancelando}
                />
            )}
        </div>
    );
}
