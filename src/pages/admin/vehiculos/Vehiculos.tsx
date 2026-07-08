import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import { Icon } from '@iconify/react';
import { get, post, patch, del } from '@/utils/fetch';
import useAlertStore from '@/zustand/alert';
import { useDebounce } from '@/hooks/useDebounce';
import DataTable from '@/components/Datatable';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import ModalConfirm from '@/components/ModalConfirm';
import type {
    IVehiculo, IVehiculosResponse, EstadoContrato, TipoActa, NivelCombustible,
} from '@/interfaces/vehiculo';
import ChecklistPicker, { type ChecklistState, checklistToPayload } from './ChecklistPicker';

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
const NIVEL_OPTS = (['LLENO', '3/4', '1/2', '1/4', 'VACIO'] as NivelCombustible[]).map((n) => ({ id: n, value: n }));

// ─── Modal Vehículo (CRUD) ────────────────────────────────────────────────────
function VehiculoModal({ vehiculo, onClose, onSaved }: { vehiculo?: IVehiculo | null; onClose: () => void; onSaved: () => void }) {
    const { alert } = useAlertStore();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        placa: vehiculo?.placa ?? '', marca: vehiculo?.marca ?? '', modelo: vehiculo?.modelo ?? '',
        color: vehiculo?.color ?? '', anio: vehiculo?.anio?.toString() ?? '', observaciones: vehiculo?.observaciones ?? '',
    });
    // Checklist de inspección inicial: solo al registrar un vehículo nuevo.
    const [checks, setChecks] = useState<ChecklistState>({});
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: name === 'placa' ? value.toUpperCase() : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.placa.trim() || !form.marca.trim()) { alert('Placa y marca son requeridos', 'warning'); return; }
        setLoading(true);
        try {
            const payload = {
                placa: form.placa.toUpperCase().trim(), marca: form.marca.trim(),
                modelo: form.modelo.trim() || undefined, color: form.color.trim() || undefined,
                anio: form.anio ? parseInt(form.anio) : undefined, observaciones: form.observaciones.trim() || undefined,
            };
            if (vehiculo) {
                await patch(`vehiculos/${vehiculo.id}`, payload);
                alert('Vehículo actualizado', 'success');
            } else {
                const res: any = await post('vehiculos', payload);
                // Registra un acta de INGRESO inicial con la inspección hecha al registrar.
                const nuevoId = res?.data?.id;
                const checklist = checklistToPayload(checks);
                if (nuevoId && checklist.length) {
                    await post(`vehiculos/${nuevoId}/acta`, {
                        tipo: 'INGRESO',
                        observaciones: 'Inspección inicial al registrar el vehículo.',
                        fotos: [],
                        checklist,
                    });
                }
                alert('Vehículo registrado', 'success');
            }
            onSaved();
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Error al guardar', 'error');
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 ${vehiculo ? 'max-w-lg' : 'max-w-3xl'}`}>
                <div className="flex flex-shrink-0 items-center justify-between bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-white/10 p-2"><Icon icon="solar:car-bold-duotone" className="text-2xl text-white" /></div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">{vehiculo ? 'Editar Vehículo' : 'Registrar Vehículo'}</h2>
                            <p className="text-xs text-slate-400">Seguridad Electrónica Vehicular</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 transition-colors hover:text-white"><Icon icon="solar:close-circle-bold" className="text-2xl" /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 space-y-4 overflow-y-auto p-6">
                        <div className="grid grid-cols-2 gap-4">
                            <InputPro name="placa" value={form.placa} onChange={handleChange} isLabel label="Placa *" placeholder="ABC-123" error={null} />
                            <InputPro name="marca" value={form.marca} onChange={handleChange} isLabel label="Marca *" placeholder="Toyota, Hyundai..." error={null} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <InputPro name="modelo" value={form.modelo} onChange={handleChange} isLabel label="Modelo" placeholder="Corolla, Accent..." error={null} />
                            <InputPro name="color" value={form.color} onChange={handleChange} isLabel label="Color" placeholder="Blanco, Negro..." error={null} />
                        </div>
                        <InputPro name="anio" type="number" value={form.anio} onChange={handleChange} isLabel label="Año" placeholder="2024" error={null} />
                        {/* Checklist de inspección inicial — solo al registrar un vehículo nuevo */}
                        {!vehiculo && (
                            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                                <ChecklistPicker checks={checks} onChange={setChecks} />
                            </div>
                        )}
                        <InputPro name="observaciones" type="textarea" rows={3} value={form.observaciones} onChange={handleChange} isLabel label="Observaciones" placeholder="Estado general, accesorios instalados..." error={null} />
                    </div>
                    <div className="flex flex-shrink-0 gap-3 border-t border-slate-100 p-4 dark:border-slate-800">
                        <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-800 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60">
                            {loading ? <Icon icon="eos-icons:loading" /> : <Icon icon="solar:check-circle-bold" />}{vehiculo ? 'Actualizar' : 'Registrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Modal Acta de Inspección ─────────────────────────────────────────────────
function ActaModal({ vehiculo, onClose, onSaved }: { vehiculo: IVehiculo; onClose: () => void; onSaved: () => void }) {
    const { alert } = useAlertStore();
    const [loading, setLoading] = useState(false);
    const [tipo, setTipo] = useState<TipoActa>('INGRESO');
    const [km, setKm] = useState('');
    const [nivelCombustible, setNivelCombustible] = useState<NivelCombustible | ''>('');
    const [observaciones, setObservaciones] = useState('');
    // Checklist: solo se guardan los ítems marcados con novedad.
    const [checks, setChecks] = useState<ChecklistState>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const checklist = checklistToPayload(checks);
            await post(`vehiculos/${vehiculo.id}/acta`, {
                tipo, km: km ? parseInt(km) : undefined,
                nivelCombustible: nivelCombustible || undefined,
                observaciones: observaciones.trim() || undefined, fotos: [],
                checklist: checklist.length ? checklist : undefined,
            });
            alert(`Acta de ${tipo === 'INGRESO' ? 'ingreso' : 'retiro'} registrada`, 'success');
            onSaved();
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Error al registrar acta', 'error');
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
                <div className={`flex flex-shrink-0 items-center justify-between bg-gradient-to-r px-6 py-4 ${tipo === 'INGRESO' ? 'from-blue-600 to-blue-500' : 'from-orange-600 to-orange-500'}`}>
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-white/10 p-2"><Icon icon={tipo === 'INGRESO' ? 'solar:arrow-right-down-bold' : 'solar:arrow-left-up-bold'} className="text-2xl text-white" /></div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Acta de inspección</h2>
                            <p className="font-mono text-xs text-white/70">{vehiculo.placa} — {vehiculo.marca} {vehiculo.modelo}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 transition hover:text-white"><Icon icon="solar:close-circle-bold" className="text-2xl" /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 space-y-5 overflow-y-auto p-6">
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tipo de acta</label>
                            <div className="grid grid-cols-2 gap-3">
                                {(['INGRESO', 'RETIRO'] as TipoActa[]).map((t) => (
                                    <button key={t} type="button" onClick={() => setTipo(t)}
                                        className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition ${tipo === t ? (t === 'INGRESO' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10' : 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-500/10') : 'border-slate-200 text-slate-400 hover:border-slate-300 dark:border-slate-700'}`}>
                                        <Icon icon={t === 'INGRESO' ? 'solar:arrow-right-down-bold' : 'solar:arrow-left-up-bold'} />{t === 'INGRESO' ? 'Ingreso' : 'Retiro'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <InputPro name="km" type="number" value={km} onChange={(e) => setKm(e.target.value)} isLabel label="Kilometraje" placeholder="85000" error={null} />
                            <Select name="nivelCombustible" label="Nivel de combustible" options={NIVEL_OPTS} value={nivelCombustible} onChange={(id: any) => setNivelCombustible(id as NivelCombustible)} placeholder="— Seleccionar —" error={null} />
                        </div>

                        {/* Checklist de inspección */}
                        <ChecklistPicker checks={checks} onChange={setChecks} />

                        <InputPro name="observaciones" type="textarea" rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} isLabel label="Observaciones adicionales" placeholder="Cualquier detalle extra no cubierto por el checklist..." error={null} />
                    </div>

                    <div className="flex flex-shrink-0 gap-3 border-t border-slate-100 p-4 dark:border-slate-800">
                        <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
                        <button type="submit" disabled={loading} className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${tipo === 'INGRESO' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
                            {loading ? <Icon icon="eos-icons:loading" /> : <Icon icon="solar:clipboard-check-bold" />}Registrar acta de {tipo === 'INGRESO' ? 'ingreso' : 'retiro'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Modal Detalle Vehículo ───────────────────────────────────────────────────
function DetalleModal({ vehiculo, onClose, onNuevaActa }: { vehiculo: IVehiculo; onClose: () => void; onNuevaActa: () => void }) {
    const { alert } = useAlertStore();
    const [detalle, setDetalle] = useState<IVehiculo | null>(null);
    const [loadingDetalle, setLoadingDetalle] = useState(true);

    const cargar = useCallback(async () => {
        setLoadingDetalle(true);
        try { const resp: any = await get(`vehiculos/${vehiculo.id}`); setDetalle(resp.data); }
        catch { alert('Error al cargar detalle', 'error'); }
        finally { setLoadingDetalle(false); }
    }, [vehiculo.id]);
    useEffect(() => { cargar(); }, [cargar]);

    const ultimoContrato = detalle?.contratos?.[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
                <div className="flex flex-shrink-0 items-center justify-between bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-white/10 p-2.5"><Icon icon="solar:car-bold-duotone" className="text-3xl text-white" /></div>
                        <div>
                            <p className="font-mono text-xl font-bold tracking-widest text-white">{vehiculo.placa}</p>
                            <p className="text-sm text-slate-400">{vehiculo.marca} {vehiculo.modelo} {vehiculo.anio ? `· ${vehiculo.anio}` : ''}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onNuevaActa} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/20"><Icon icon="solar:clipboard-add-bold" />Nueva acta</button>
                        <button onClick={onClose} className="text-slate-400 transition hover:text-white"><Icon icon="solar:close-circle-bold" className="text-2xl" /></button>
                    </div>
                </div>
                <div className="flex-1 space-y-6 overflow-y-auto p-6">
                    {loadingDetalle ? (
                        <div className="flex justify-center py-12"><Icon icon="eos-icons:loading" className="text-4xl text-slate-400" /></div>
                    ) : detalle ? (
                        <>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: 'Color', value: detalle.color || '—', icon: 'solar:palette-bold' },
                                    { label: 'Propietario', value: detalle.cliente?.nombre || '—', icon: 'solar:user-bold' },
                                    { label: 'Teléfono', value: detalle.cliente?.telefono || '—', icon: 'solar:phone-bold' },
                                ].map((item) => (
                                    <div key={item.label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                                        <div className="mb-1 flex items-center gap-1.5 text-slate-400"><Icon icon={item.icon} className="text-sm" /><span className="text-xs font-medium uppercase tracking-wide">{item.label}</span></div>
                                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                            {ultimoContrato && (
                                <div className={`rounded-xl border p-4 ${ultimoContrato.estado === 'VIGENTE' ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5' : ultimoContrato.estado === 'POR_VENCER' ? 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5' : 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/5'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Icon icon="solar:document-bold" className="text-lg text-slate-500" />
                                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Contrato</span>
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estadoBadge[ultimoContrato.estado]}`}>{estadoLabel[ultimoContrato.estado]}</span>
                                        </div>
                                        <p className="text-xs text-slate-500">Vence: {fmt(ultimoContrato.fechaFin)} · <span className={`font-semibold ${diasRestantes(ultimoContrato.fechaFin) < 0 ? 'text-red-600' : diasRestantes(ultimoContrato.fechaFin) <= 30 ? 'text-amber-600' : 'text-emerald-600'}`}>{diasRestantes(ultimoContrato.fechaFin) < 0 ? `Venció hace ${Math.abs(diasRestantes(ultimoContrato.fechaFin))}d` : `${diasRestantes(ultimoContrato.fechaFin)} días`}</span></p>
                                    </div>
                                    {ultimoContrato.producto && <p className="ml-6 mt-1 text-xs text-slate-600 dark:text-slate-400">{ultimoContrato.producto.descripcion}</p>}
                                </div>
                            )}
                            <div>
                                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><Icon icon="solar:clipboard-list-bold" className="text-slate-500" />Historial de actas<span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">{detalle.actas?.length ?? 0}</span></h3>
                                {(detalle.actas?.length ?? 0) === 0 ? (
                                    <div className="rounded-xl bg-slate-50 py-8 text-center dark:bg-slate-800"><Icon icon="solar:clipboard-bold" className="mx-auto mb-2 text-4xl text-slate-300" /><p className="text-sm text-slate-400">Sin actas registradas</p></div>
                                ) : (
                                    <div className="space-y-2">
                                        {detalle.actas?.map((acta) => (
                                            <div key={acta.id} className={`flex items-start gap-3 rounded-xl border p-3 ${acta.tipo === 'INGRESO' ? 'border-blue-100 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/5' : 'border-orange-100 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/5'}`}>
                                                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${acta.tipo === 'INGRESO' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20' : 'bg-orange-100 text-orange-600 dark:bg-orange-500/20'}`}><Icon icon={acta.tipo === 'INGRESO' ? 'solar:arrow-right-down-bold' : 'solar:arrow-left-up-bold'} className="text-lg" /></div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between"><span className={`text-xs font-semibold ${acta.tipo === 'INGRESO' ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>{acta.tipo === 'INGRESO' ? 'Ingreso' : 'Retiro'}</span><span className="text-xs text-slate-400">{fmt(acta.creadoEn)}</span></div>
                                                    <div className="mt-0.5 flex gap-4 text-xs text-slate-500">
                                                        {acta.km != null && <span>🚗 {acta.km.toLocaleString()} km</span>}
                                                        {acta.nivelCombustible && <span>⛽ {acta.nivelCombustible}</span>}
                                                        {acta.usuario && <span>👤 {acta.usuario.nombre}</span>}
                                                    </div>
                                                    {acta.observaciones && <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{acta.observaciones}</p>}
                                                    {acta.checklist && acta.checklist.length > 0 && (
                                                        <div className="mt-2">
                                                            <p className="mb-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">{acta.checklist.length} novedad{acta.checklist.length !== 1 ? 'es' : ''}:</p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {acta.checklist.map((c, i) => (
                                                                    <span key={i} title={c.categoria} className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
                                                                        {c.item}: {c.estado}{c.nota ? ` · ${c.nota}` : ''}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function VehiculosPage() {
    const { alert } = useAlertStore();
    const [data, setData] = useState<IVehiculo[]>([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 350);
    const [loading, setLoading] = useState(false);

    const [modalCrear, setModalCrear] = useState(false);
    const [vehiculoEditar, setVehiculoEditar] = useState<IVehiculo | null>(null);
    const [vehiculoDetalle, setVehiculoDetalle] = useState<IVehiculo | null>(null);
    const [vehiculoActa, setVehiculoActa] = useState<IVehiculo | null>(null);
    const [vehiculoEliminar, setVehiculoEliminar] = useState<IVehiculo | null>(null);
    const [eliminando, setEliminando] = useState(false);

    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: '1', limit: '100', ...(debouncedSearch ? { search: debouncedSearch } : {}) });
            const resp: any = await get(`vehiculos?${params}`);
            const body: IVehiculosResponse = resp.data;
            setData(body.data);
            setTotal(body.paginacion?.total ?? body.data.length);
        } catch { alert('Error al cargar vehículos', 'error'); }
        finally { setLoading(false); }
    }, [debouncedSearch]);
    useEffect(() => { cargar(); }, [cargar]);

    const handleEliminar = async () => {
        if (!vehiculoEliminar) return;
        setEliminando(true);
        try { await del(`vehiculos/${vehiculoEliminar.id}`); alert('Vehículo eliminado', 'success'); setVehiculoEliminar(null); cargar(); }
        catch (err: any) { alert(err?.response?.data?.message || 'Error al eliminar', 'error'); }
        finally { setEliminando(false); }
    };

    const contratoActivo = (v: IVehiculo) => v.contratos?.find((c) => c.estado === 'VIGENTE' || c.estado === 'POR_VENCER');

    const bodyData = data.map((v) => {
        const contrato = contratoActivo(v);
        const dias = contrato ? diasRestantes(contrato.fechaFin) : null;
        return {
            id: v.id,
            Placa: <span className="rounded-lg bg-slate-100 px-3 py-1 font-mono text-base font-bold tracking-widest text-slate-800 dark:bg-slate-800 dark:text-slate-100">{v.placa}</span>,
            Vehículo: (
                <div className="min-w-[150px]">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{v.marca} {v.modelo || ''}</p>
                    <p className="text-xs text-slate-400">{v.color} {v.anio ? `· ${v.anio}` : ''}</p>
                </div>
            ),
            Propietario: v.cliente ? (
                <div><p className="text-sm font-medium text-slate-700 dark:text-slate-200">{v.cliente.nombre}</p><p className="text-xs text-slate-400">{v.cliente.telefono || '—'}</p></div>
            ) : <span className="text-sm text-slate-300">—</span>,
            Contrato: contrato ? (
                <div className="flex flex-col gap-0.5">
                    <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${estadoBadge[contrato.estado]}`}>{estadoLabel[contrato.estado]}</span>
                    <span className={`text-xs font-medium ${dias !== null && dias < 0 ? 'text-red-500' : dias !== null && dias <= 30 ? 'text-amber-500' : 'text-emerald-600'}`}>{dias !== null && dias < 0 ? `Venció hace ${Math.abs(dias)}d` : dias !== null ? `${dias} días` : ''}</span>
                </div>
            ) : <span className="text-xs text-slate-400">Sin contrato</span>,
            Acciones: (
                <div className="flex items-center gap-1">
                    <button title="Ver detalle" onClick={() => setVehiculoDetalle(v)} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"><Icon icon="solar:eye-bold" className="text-lg" /></button>
                    <button title="Acta de inspección" onClick={() => setVehiculoActa(v)} className="rounded-lg p-2 text-blue-500 transition hover:bg-blue-50 dark:hover:bg-blue-500/10"><Icon icon="solar:clipboard-add-bold" className="text-lg" /></button>
                    <button title="Editar" onClick={() => setVehiculoEditar(v)} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"><Icon icon="solar:pen-bold" className="text-lg" /></button>
                    <button title="Eliminar" onClick={() => setVehiculoEliminar(v)} className="rounded-lg p-2 text-red-400 transition hover:bg-red-50 dark:hover:bg-red-500/10"><Icon icon="solar:trash-bin-trash-bold" className="text-lg" /></button>
                </div>
            ),
        };
    });

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Vehículos</h1>
                    <p className="text-sm text-slate-400">Trazabilidad vehicular · {total} vehículo{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => setModalCrear(true)} className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"><Icon icon="solar:add-circle-bold" className="text-lg" />Nuevo vehículo</button>
            </div>

            <div className="max-w-md">
                <InputPro name="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por placa, marca, propietario..." error={null} />
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                {loading ? (
                    <div className="flex justify-center py-16"><Icon icon="eos-icons:loading" className="text-4xl text-slate-300" /></div>
                ) : data.length === 0 ? (
                    <div className="py-16 text-center text-slate-400"><Icon icon="solar:car-bold" className="mx-auto mb-3 text-5xl opacity-40" /><p className="text-sm font-semibold">No hay vehículos registrados. ¡Agrega el primero!</p></div>
                ) : (
                    <DataTable headerColumns={['Placa', 'Vehículo', 'Propietario', 'Contrato', 'Acciones']} bodyData={bodyData} pageSize={15} />
                )}
            </div>

            {(modalCrear || vehiculoEditar) && (
                <VehiculoModal vehiculo={vehiculoEditar} onClose={() => { setModalCrear(false); setVehiculoEditar(null); }} onSaved={() => { setModalCrear(false); setVehiculoEditar(null); cargar(); }} />
            )}
            {vehiculoDetalle && <DetalleModal vehiculo={vehiculoDetalle} onClose={() => setVehiculoDetalle(null)} onNuevaActa={() => setVehiculoActa(vehiculoDetalle)} />}
            {vehiculoActa && <ActaModal vehiculo={vehiculoActa} onClose={() => setVehiculoActa(null)} onSaved={() => { setVehiculoActa(null); cargar(); }} />}
            {vehiculoEliminar && (
                <ModalConfirm
                    isOpenModal={!!vehiculoEliminar}
                    setIsOpenModal={(v) => { if (!v) setVehiculoEliminar(null); }}
                    confirmSubmit={handleEliminar}
                    title="Eliminar vehículo"
                    information={`¿Eliminar el vehículo con placa ${vehiculoEliminar.placa}? Se eliminarán todas sus actas e historial.`}
                    confirmText="Eliminar"
                    confirmLoading={eliminando}
                />
            )}
        </div>
    );
}
