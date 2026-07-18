import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
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
    IVehiculo, IVehiculosResponse, EstadoContrato, TipoActa, NivelCombustible,
} from '@/interfaces/vehiculo';
import ChecklistPicker, { type ChecklistState, checklistToPayload } from './ChecklistPicker';
import ModalClient from '@/features/admin/clients/shared/ModalClient';
import { INITIAL_FORM as CLIENTE_INITIAL_FORM, INITIAL_ERRORS as CLIENTE_INITIAL_ERRORS } from '@/features/admin/clients/ClientsModel';
import { useClientsStore } from '@/zustand/clients';
import { useAuthStore } from '@/zustand/auth';
import type { IFormClient } from '@/interfaces/clients';
import { printActa } from './actaPrint';

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
const NIVEL_OPTS = (['LLENO', '3/4', '1/2', '1/4', 'VACIO'] as NivelCombustible[]).map((n) => ({ id: n, value: n }));

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

// Pie de acciones estándar reutilizado por los modales.
function ModalFooter({ onCancel, loading, submitLabel }: { onCancel: () => void; loading?: boolean; submitLabel: string }) {
    return (
        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
            <Button color="gray" className="w-full sm:w-auto" onClick={onCancel}>Cancelar</Button>
            <Button color="secondary" type="submit" isLoading={loading} className="w-full sm:w-auto">{submitLabel}</Button>
        </div>
    );
}

// ─── Modal Vehículo (CRUD) ────────────────────────────────────────────────────
function VehiculoModal({ vehiculo, onClose, onSaved }: { vehiculo?: IVehiculo | null; onClose: () => void; onSaved: () => void }) {
    const { alert } = useAlertStore();
    const [loading, setLoading] = useState(false);
    const [clientes, setClientes] = useState<{ id: number; nombre: string; nroDoc: string }[]>([]);
    const [form, setForm] = useState({
        placa: vehiculo?.placa ?? '', marca: vehiculo?.marca ?? '', modelo: vehiculo?.modelo ?? '',
        color: vehiculo?.color ?? '', anio: vehiculo?.anio?.toString() ?? '', observaciones: vehiculo?.observaciones ?? '',
        clienteId: vehiculo?.clienteId?.toString() ?? '',
    });
    // Checklist de inspección inicial: solo al registrar un vehículo nuevo.
    const [checks, setChecks] = useState<ChecklistState>({});
    // Reutiliza el modal real del módulo de Clientes para registrar el propietario al vuelo.
    const [showNuevoCliente, setShowNuevoCliente] = useState(false);
    const [clienteForm, setClienteForm] = useState<IFormClient>(CLIENTE_INITIAL_FORM);
    const [clienteErrors, setClienteErrors] = useState<any>(CLIENTE_INITIAL_ERRORS);
    // El modal reutilizado agrega el cliente al store de forma asíncrona (fire-and-forget),
    // por eso detectamos el nuevo cliente reactivamente: guardamos el id del tope al abrir
    // y observamos `clients` del store hasta que aparezca uno distinto.
    const storeClients = useClientsStore((s) => s.clients);
    const [clienteTopId, setClienteTopId] = useState<number | null>(null);
    const [esperandoCliente, setEsperandoCliente] = useState(false);

    const abrirNuevoCliente = () => {
        setClienteForm(CLIENTE_INITIAL_FORM);
        setClienteErrors(CLIENTE_INITIAL_ERRORS);
        setClienteTopId(useClientsStore.getState().clients[0]?.id ?? null);
        setEsperandoCliente(true);
        setShowNuevoCliente(true);
    };

    useEffect(() => {
        if (!esperandoCliente) return;
        const creado = storeClients[0];
        if (creado && creado.id !== clienteTopId) {
            setClientes((prev) => [
                { id: creado.id, nombre: creado.nombre, nroDoc: creado.nroDoc },
                ...prev.filter((p) => p.id !== creado.id),
            ]);
            setForm((f) => ({ ...f, clienteId: String(creado.id) }));
            setEsperandoCliente(false);
        }
    }, [storeClients, esperandoCliente, clienteTopId]);

    // Catálogo de clientes para asignar el propietario del vehículo.
    useEffect(() => {
        get('clientes?limit=200')
            .then((resp: any) => setClientes(resp.data?.clientes ?? []))
            .catch(() => { /* silencioso: el selector queda vacío */ });
    }, []);

    const clienteOpts = clientes.map((c) => ({ id: c.id, value: `${c.nombre}${c.nroDoc ? ` — ${c.nroDoc}` : ''}` }));
    const clienteSel =
        clienteOpts.find((o) => String(o.id) === form.clienteId)?.value ??
        (vehiculo?.cliente ? `${vehiculo.cliente.nombre}${vehiculo.cliente.nroDoc ? ` — ${vehiculo.cliente.nroDoc}` : ''}` : '');
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
                clienteId: form.clienteId ? parseInt(form.clienteId) : undefined,
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
        <>
            <Modal
                isOpenModal
                closeModal={onClose}
                title={vehiculo ? 'Editar vehículo' : 'Registrar vehículo'}
                icon="solar:car-bold-duotone"
                width={vehiculo ? '560px' : '720px'}
                position="center"
            >
                <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <InputPro name="placa" value={form.placa} onChange={handleChange} isLabel label="Placa *" placeholder="ABC-123" error={null} />
                        <InputPro name="marca" value={form.marca} onChange={handleChange} isLabel label="Marca *" placeholder="Toyota, Hyundai..." error={null} />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <InputPro name="modelo" value={form.modelo} onChange={handleChange} isLabel label="Modelo" placeholder="Corolla, Accent..." error={null} />
                        <InputPro name="color" value={form.color} onChange={handleChange} isLabel label="Color" placeholder="Blanco, Negro..." error={null} />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <InputPro name="anio" type="number" value={form.anio} onChange={handleChange} isLabel label="Año" placeholder="2024" error={null} />
                        <div>
                            <Select
                                name="clienteId"
                                label="Propietario"
                                options={clienteOpts}
                                value={clienteSel}
                                isSearch
                                onChange={(id: any) => setForm((f) => ({ ...f, clienteId: String(id) }))}
                                placeholder="— Seleccionar cliente —"
                                error={null}
                            />
                            <button type="button" onClick={abrirNuevoCliente}
                                className="mt-1.5 flex items-center gap-1 text-xs font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                                <Icon icon="solar:user-plus-bold" className="text-sm" />¿No está? Registrar cliente nuevo
                            </button>
                        </div>
                    </div>
                    {/* Checklist de inspección inicial — solo al registrar un vehículo nuevo */}
                    {!vehiculo && (
                        <div className="border-t border-gray-100 pt-4 dark:border-slate-800">
                            <ChecklistPicker checks={checks} onChange={setChecks} />
                        </div>
                    )}
                    <InputPro name="observaciones" type="textarea" rows={3} value={form.observaciones} onChange={handleChange} isLabel label="Observaciones" placeholder="Estado general, accesorios instalados..." error={null} />
                    <ModalFooter onCancel={onClose} loading={loading} submitLabel={vehiculo ? 'Actualizar' : 'Registrar'} />
                </form>
            </Modal>

            <ModalClient
                isOpenModal={showNuevoCliente}
                closeModal={() => setShowNuevoCliente(false)}
                setIsOpenModal={(v) => { if (!v) { setShowNuevoCliente(false); setEsperandoCliente(false); } }}
                isEdit={false}
                formValues={clienteForm}
                setFormValues={setClienteForm}
                errors={clienteErrors}
                setErrors={setClienteErrors}
            />
        </>
    );
}

// ─── Modal Acta de Inspección ─────────────────────────────────────────────────
function ActaModal({ vehiculo, onClose, onSaved }: { vehiculo: IVehiculo; onClose: () => void; onSaved: () => void }) {
    const { alert } = useAlertStore();
    const auth = useAuthStore((s) => s.auth);
    const [loading, setLoading] = useState(false);
    const [tipo, setTipo] = useState<TipoActa>('INGRESO');
    const [km, setKm] = useState('');
    const [nivelCombustible, setNivelCombustible] = useState<NivelCombustible | ''>('');
    const [observaciones, setObservaciones] = useState('');
    // Checklist: solo se guardan los ítems marcados con novedad.
    const [checks, setChecks] = useState<ChecklistState>({});

    // Genera el acta imprimible / PDF con lo capturado, para que el cliente la firme.
    const handleImprimir = () => {
        printActa({
            tipo,
            km: km ? parseInt(km) : null,
            nivelCombustible: nivelCombustible || null,
            observaciones: observaciones.trim() || null,
            checklist: checklistToPayload(checks),
            usuarioNombre: (auth as any)?.nombre,
            vehiculo: {
                placa: vehiculo.placa, marca: vehiculo.marca, modelo: vehiculo.modelo,
                color: vehiculo.color, anio: vehiculo.anio, cliente: vehiculo.cliente,
            },
            empresa: (auth as any)?.empresa,
        });
    };

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
        <Modal
            isOpenModal
            closeModal={onClose}
            title="Acta de inspección"
            icon="solar:clipboard-check-bold-duotone"
            width="720px"
            position="center"
        >
            <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-6">
                <p className="font-mono text-xs text-gray-400">{vehiculo.placa} — {vehiculo.marca} {vehiculo.modelo}</p>
                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tipo de acta</label>
                    <div className="grid grid-cols-2 gap-3">
                        {(['INGRESO', 'RETIRO'] as TipoActa[]).map((t) => (
                            <button key={t} type="button" onClick={() => setTipo(t)}
                                className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition ${tipo === t ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-slate-700 dark:text-gray-400'}`}>
                                <Icon icon={t === 'INGRESO' ? 'solar:arrow-right-down-bold' : 'solar:arrow-left-up-bold'} />{t === 'INGRESO' ? 'Ingreso' : 'Retiro'}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InputPro name="km" type="number" value={km} onChange={(e) => setKm(e.target.value)} isLabel label="Kilometraje" placeholder="85000" error={null} />
                    <Select name="nivelCombustible" label="Nivel de combustible" options={NIVEL_OPTS} value={nivelCombustible} onChange={(id: any) => setNivelCombustible(id as NivelCombustible)} placeholder="— Seleccionar —" error={null} />
                </div>

                {/* Checklist de inspección */}
                <ChecklistPicker checks={checks} onChange={setChecks} />

                <InputPro name="observaciones" type="textarea" rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} isLabel label="Observaciones adicionales" placeholder="Cualquier detalle extra no cubierto por el checklist..." error={null} />
                <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                    <Button color="gray" outline type="button" onClick={handleImprimir} className="flex w-full items-center justify-center gap-2 sm:w-auto">
                        <Icon icon="solar:printer-bold" />Imprimir / PDF
                    </Button>
                    <div className="flex flex-col-reverse gap-3 sm:flex-row">
                        <Button color="gray" className="w-full sm:w-auto" onClick={onClose}>Cancelar</Button>
                        <Button color="secondary" type="submit" isLoading={loading} className="w-full sm:w-auto">Registrar acta de {tipo === 'INGRESO' ? 'ingreso' : 'retiro'}</Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}

// ─── Modal Detalle Vehículo ───────────────────────────────────────────────────
function DetalleModal({ vehiculo, onClose, onNuevaActa }: { vehiculo: IVehiculo; onClose: () => void; onNuevaActa: () => void }) {
    const { alert } = useAlertStore();
    const auth = useAuthStore((s) => s.auth);
    const [detalle, setDetalle] = useState<IVehiculo | null>(null);
    const [loadingDetalle, setLoadingDetalle] = useState(true);

    // Reimprime un acta ya guardada para que el cliente la firme.
    const imprimirActa = (acta: NonNullable<IVehiculo['actas']>[number]) => {
        const v = detalle ?? vehiculo;
        printActa({
            tipo: acta.tipo,
            km: acta.km,
            nivelCombustible: acta.nivelCombustible,
            observaciones: acta.observaciones,
            checklist: acta.checklist ?? [],
            fecha: acta.creadoEn,
            usuarioNombre: acta.usuario?.nombre,
            vehiculo: {
                placa: v.placa, marca: v.marca, modelo: v.modelo,
                color: v.color, anio: v.anio, cliente: v.cliente,
            },
            empresa: (auth as any)?.empresa,
        });
    };

    const cargar = useCallback(async () => {
        setLoadingDetalle(true);
        try { const resp: any = await get(`vehiculos/${vehiculo.id}`); setDetalle(resp.data); }
        catch { alert('Error al cargar detalle', 'error'); }
        finally { setLoadingDetalle(false); }
    }, [vehiculo.id]);
    useEffect(() => { cargar(); }, [cargar]);

    const ultimoContrato = detalle?.contratos?.[0];

    return (
        <Modal
            isOpenModal
            closeModal={onClose}
            title={vehiculo.placa}
            icon="mdi:car"
            width="640px"
            position="center"
        >
            <div className="space-y-5 p-4 sm:p-6">
                {/* Hero del vehículo */}
                <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900">
                            <Icon icon="mdi:car" className="text-2xl" />
                        </div>
                        <div>
                            <span className="inline-flex items-center rounded-md border-2 border-gray-900 px-2.5 py-0.5 font-mono text-lg font-bold tracking-[0.2em] text-gray-900 dark:border-white dark:text-white">{vehiculo.placa}</span>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{vehiculo.marca} {vehiculo.modelo} {vehiculo.anio ? `· ${vehiculo.anio}` : ''}</p>
                        </div>
                    </div>
                    <Button color="secondary" onClick={onNuevaActa} className="flex items-center justify-center gap-2">
                        <Icon icon="solar:clipboard-add-bold" />Nueva acta
                    </Button>
                </div>

                {loadingDetalle ? (
                    <div className="flex justify-center py-12"><Icon icon="eos-icons:loading" className="text-4xl text-gray-400" /></div>
                ) : detalle ? (
                    <>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {[
                                { label: 'Propietario', value: detalle.cliente?.nombre || '—', icon: 'solar:user-bold' },
                                { label: 'Documento', value: detalle.cliente?.nroDoc || '—', icon: 'solar:card-bold' },
                                { label: 'Teléfono', value: detalle.cliente?.telefono || '—', icon: 'solar:phone-bold' },
                                { label: 'Color', value: detalle.color || '—', icon: 'solar:palette-bold' },
                            ].map((item) => (
                                <div key={item.label} className="rounded-xl border border-gray-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/40">
                                    <div className="mb-1 flex items-center gap-1.5 text-gray-400"><Icon icon={item.icon} className="text-[13px]" /><span className="text-[10px] font-semibold uppercase tracking-wide">{item.label}</span></div>
                                    <p className="break-words text-sm font-semibold text-gray-800 dark:text-gray-100">{item.value}</p>
                                </div>
                            ))}
                        </div>
                        {ultimoContrato && (
                            <div className={`rounded-xl border p-4 ${ultimoContrato.estado === 'VIGENTE' ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5' : ultimoContrato.estado === 'POR_VENCER' ? 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5' : 'border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/5'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Icon icon="solar:document-bold" className="text-lg text-gray-500" />
                                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Contrato</span>
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estadoBadge[ultimoContrato.estado]}`}>{estadoLabel[ultimoContrato.estado]}</span>
                                    </div>
                                    <p className="text-xs text-gray-500">Vence: {fmt(ultimoContrato.fechaFin)} · <span className={`font-semibold ${diasRestantes(ultimoContrato.fechaFin) < 0 ? 'text-rose-600' : diasRestantes(ultimoContrato.fechaFin) <= 30 ? 'text-amber-600' : 'text-emerald-600'}`}>{diasRestantes(ultimoContrato.fechaFin) < 0 ? `Venció hace ${Math.abs(diasRestantes(ultimoContrato.fechaFin))}d` : `${diasRestantes(ultimoContrato.fechaFin)} días`}</span></p>
                                </div>
                                {ultimoContrato.producto && <p className="ml-6 mt-1 text-xs text-gray-600 dark:text-gray-400">{ultimoContrato.producto.descripcion}</p>}
                            </div>
                        )}
                        <div>
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200"><Icon icon="solar:clipboard-list-bold" className="text-gray-500" />Historial de actas<span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-slate-800 dark:text-gray-400">{detalle.actas?.length ?? 0}</span></h3>
                            {(detalle.actas?.length ?? 0) === 0 ? (
                                <div className="rounded-xl bg-gray-50 py-8 text-center dark:bg-slate-800"><Icon icon="solar:clipboard-bold" className="mx-auto mb-2 text-4xl text-gray-300" /><p className="text-sm text-gray-400">Sin actas registradas</p></div>
                            ) : (
                                <div className="space-y-2.5">
                                    {detalle.actas?.map((acta) => {
                                        const esIngreso = acta.tipo === 'INGRESO';
                                        return (
                                        <div key={acta.id} className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900/40">
                                            <div className="flex items-start gap-3">
                                                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${esIngreso ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'border border-gray-300 text-gray-600 dark:border-slate-600 dark:text-gray-300'}`}><Icon icon={esIngreso ? 'solar:arrow-right-down-bold' : 'solar:arrow-left-up-bold'} className="text-base" /></div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{esIngreso ? 'Ingreso' : 'Retiro'}</span>
                                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:bg-slate-800 dark:text-gray-400">{esIngreso ? 'Entrada' : 'Salida'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-xs text-gray-400">{fmt(acta.creadoEn)}</span>
                                                            <button type="button" title="Imprimir / PDF" onClick={() => imprimirActa(acta)} className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-700 dark:hover:text-gray-200"><Icon icon="solar:printer-bold" className="text-sm" /></button>
                                                        </div>
                                                    </div>
                                                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                                        {acta.km != null && <span className="inline-flex items-center gap-1"><Icon icon="mdi:speedometer" className="text-gray-400" />{acta.km.toLocaleString()} km</span>}
                                                        {acta.nivelCombustible && <span className="inline-flex items-center gap-1"><Icon icon="mdi:gas-station" className="text-gray-400" />{acta.nivelCombustible}</span>}
                                                        {acta.usuario && <span className="inline-flex items-center gap-1"><Icon icon="mdi:account" className="text-gray-400" />{acta.usuario.nombre}</span>}
                                                    </div>
                                                    {acta.observaciones && <p className="mt-1.5 text-xs leading-relaxed text-gray-600 dark:text-gray-400">{acta.observaciones}</p>}
                                                    {acta.checklist && acta.checklist.length > 0 && (
                                                        <div className="mt-2">
                                                            <p className="mb-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400">{acta.checklist.length} novedad{acta.checklist.length !== 1 ? 'es' : ''}</p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {acta.checklist.map((c, i) => (
                                                                    <span key={i} title={c.categoria} className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-slate-800 dark:text-gray-300">
                                                                        <span className="h-1 w-1 rounded-full bg-gray-400" />{c.item}: {c.estado}{c.nota ? ` · ${c.nota}` : ''}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                ) : null}
            </div>
        </Modal>
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

    // Menú de acciones (dropdown) por fila.
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const [menuRow, setMenuRow] = useState<IVehiculo | null>(null);
    const openMenu = (e: React.MouseEvent<HTMLElement>, row: IVehiculo) => { setMenuAnchor(e.currentTarget); setMenuRow(row); };
    const closeMenu = () => { setMenuAnchor(null); setMenuRow(null); };

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
            Placa: <span className="rounded-lg bg-gray-100 px-3 py-1 font-mono text-base font-bold tracking-widest text-gray-800 dark:bg-slate-800 dark:text-gray-100">{v.placa}</span>,
            Vehículo: (
                <div className="min-w-[150px]">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{v.marca} {v.modelo || ''}</p>
                    <p className="text-xs text-gray-400">{v.color} {v.anio ? `· ${v.anio}` : ''}</p>
                </div>
            ),
            Propietario: v.cliente ? (
                <div><p className="text-sm font-medium text-gray-700 dark:text-gray-200">{v.cliente.nombre}</p><p className="text-xs text-gray-400">{v.cliente.telefono || '—'}</p></div>
            ) : <span className="text-sm text-gray-300">—</span>,
            Contrato: contrato ? (
                <div className="flex flex-col gap-0.5">
                    <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${estadoBadge[contrato.estado]}`}>{estadoLabel[contrato.estado]}</span>
                    <span className={`text-xs font-medium ${dias !== null && dias < 0 ? 'text-rose-500' : dias !== null && dias <= 30 ? 'text-amber-500' : 'text-emerald-600'}`}>{dias !== null && dias < 0 ? `Venció hace ${Math.abs(dias)}d` : dias !== null ? `${dias} días` : ''}</span>
                </div>
            ) : <span className="text-xs text-gray-400">Sin contrato</span>,
            Acciones: (
                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                    <button
                        type="button"
                        aria-label="Acciones"
                        onClick={(e) => openMenu(e, v)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                    >
                        <Icon icon="mdi:dots-vertical" width={18} height={18} />
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Vehículos</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Trazabilidad vehicular · {total} vehículo{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}</p>
                </div>
                <Button color="secondary" onClick={() => setModalCrear(true)} className="flex items-center gap-2">
                    <Icon icon="solar:add-circle-bold" className="text-lg" />Nuevo vehículo
                </Button>
            </div>

            {/* Main Content Card */}
            <div className="bg-white dark:bg-[#111827] relative z-0 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                {/* Search Toolbar */}
                <div className="p-5 border-b border-gray-100 dark:border-slate-800">
                    <div className="max-w-md">
                        <InputPro name="search" value={search} onChange={(e) => setSearch(e.target.value)} label="Buscar por placa, marca o propietario" isLabel error={null} />
                    </div>
                </div>

                {/* Table */}
                <div className="p-4">
                    {loading ? (
                        <div className="flex justify-center py-16"><Icon icon="eos-icons:loading" className="text-4xl text-gray-300" /></div>
                    ) : data.length === 0 ? (
                        <div className="py-16 text-center">
                            <Icon icon="solar:car-linear" className="mx-auto mb-3 text-5xl text-gray-300" />
                            <p className="text-gray-500">No hay vehículos registrados</p>
                            <p className="text-sm text-gray-400 mt-1">Agrega el primero con “Nuevo vehículo”</p>
                        </div>
                    ) : (
                        <div className="min-h-[450px]">
                            <DataTable headerColumns={['Placa', 'Vehículo', 'Propietario', 'Contrato', 'Acciones']} bodyData={bodyData} pageSize={15} />
                        </div>
                    )}
                </div>
            </div>

            {/* Dropdown de acciones */}
            <TableActionMenu isOpen={Boolean(menuAnchor)} anchorEl={menuAnchor} onClose={closeMenu} className="w-44">
                {menuRow && (() => {
                    const v = menuRow;
                    return (
                        <>
                            <MenuItem icon="solar:eye-bold" label="Ver detalle" onClick={() => { setVehiculoDetalle(v); closeMenu(); }} />
                            <MenuItem icon="solar:clipboard-add-bold" label="Acta de inspección" onClick={() => { setVehiculoActa(v); closeMenu(); }} />
                            <MenuItem icon="solar:pen-bold" label="Editar" onClick={() => { setVehiculoEditar(v); closeMenu(); }} />
                            <div className="my-1 border-t border-gray-100 dark:border-slate-700" />
                            <MenuItem icon="solar:trash-bin-trash-bold" label="Eliminar" danger onClick={() => { setVehiculoEliminar(v); closeMenu(); }} />
                        </>
                    );
                })()}
            </TableActionMenu>

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
