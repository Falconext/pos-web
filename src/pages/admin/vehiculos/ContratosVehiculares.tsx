import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { get } from '@/utils/fetch';
import { useContratosVehicularesStore } from '@/zustand/contratosVehiculares';
import useAlertStore from '@/zustand/alert';
import { useDebounce } from '@/hooks/useDebounce';
import DataTable from '@/components/Datatable';
import Pagination from '@/components/Pagination';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import ModalConfirm from '@/components/ModalConfirm';
import TableActionMenu from '@/components/TableActionMenu';
import type {
    IContratoVehicular, IVehiculo, EstadoContrato,
} from '@/interfaces/vehiculo';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { useAuthStore } from '@/zustand/auth';
import { printContrato } from './contratoPrint';

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
const DURACION_OPTS = [{ id: 1, value: '1 mes' }, { id: 2, value: '2 meses' }, { id: 3, value: '3 meses' }, { id: 6, value: '6 meses' }, { id: 12, value: '12 meses' }, { id: 24, value: '24 meses' }];

const mesesEntre = (inicio: string, fin: string) => {
    const a = new Date(inicio); const b = new Date(fin);
    const m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
    return m > 0 ? m : 12;
};

// Una unidad (vehículo) dentro del formulario de contrato.
interface UnidadForm { vehiculoId: number; placa: string; desc: string; montoAnual: string }

// Deriva las unidades iniciales de un contrato para el modo edición.
const unidadesDeContrato = (c?: IContratoVehicular | null): UnidadForm[] => {
    if (!c) return [];
    if (c.unidades?.length) {
        return c.unidades.map((u) => ({
            vehiculoId: u.vehiculoId,
            placa: u.vehiculo?.placa || '',
            desc: `${u.vehiculo?.marca || ''} ${u.vehiculo?.modelo || ''}`.trim(),
            montoAnual: u.montoAnual != null ? String(u.montoAnual) : '',
        }));
    }
    // Contrato legacy (sin unidades): usa el vehículo principal.
    return [{
        vehiculoId: c.vehiculoId,
        placa: c.vehiculo?.placa || '',
        desc: `${c.vehiculo?.marca || ''} ${c.vehiculo?.modelo || ''}`.trim(),
        montoAnual: c.montoAnual != null ? String(c.montoAnual) : '',
    }];
};

// ─── Modal Crear / Editar Contrato ────────────────────────────────────────────
function ContratoModal({ contrato, onClose, onSaved }: { contrato?: IContratoVehicular | null; onClose: () => void; onSaved: () => void }) {
    const { alert } = useAlertStore();
    const addContrato = useContratosVehicularesStore((s) => s.addContrato);
    const updateContrato = useContratosVehicularesStore((s) => s.updateContrato);
    const esEdicion = !!contrato;
    const [loading, setLoading] = useState(false);
    const [vehiculos, setVehiculos] = useState<IVehiculo[]>([]);
    const [productos, setProductos] = useState<{ id: number; descripcion: string; precioUnitario?: number }[]>([]);
    // Vehículos incluidos en el contrato (multi-vehículo).
    const [unidades, setUnidades] = useState<UnidadForm[]>(() => unidadesDeContrato(contrato));
    const [vehiculoPick, setVehiculoPick] = useState('');
    const [form, setForm] = useState({
        fechaInicio: contrato ? new Date(contrato.fechaInicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        duracionMeses: contrato ? String(mesesEntre(contrato.fechaInicio, contrato.fechaFin)) : '12',
        productoId: contrato?.producto?.id ? String(contrato.producto.id) : '',
        montoAnual: contrato?.montoAnual != null ? String(contrato.montoAnual) : '', // solo edición (total)
        observaciones: contrato?.observaciones ?? '',
    });

    useEffect(() => { get('vehiculos?limit=200').then((resp: any) => setVehiculos(resp.data?.data ?? [])); }, []);
    useEffect(() => {
        get('productos?limit=200&soloVendibles=true')
            .then((resp: any) => setProductos(resp.data?.productos ?? []))
            .catch(() => { /* silencioso: el selector de servicio queda vacío */ });
    }, []);

    // Vehículos disponibles = catálogo menos los ya agregados.
    const vehiculoOpts = vehiculos
        .filter((v) => !unidades.some((u) => u.vehiculoId === v.id))
        .map((v) => ({ id: v.id, value: `${v.placa} — ${v.marca} ${v.modelo || ''}${v.cliente ? ` (${v.cliente.nombre})` : ''}` }));
    const vehiculoPickLabel = vehiculoOpts.find((o) => String(o.id) === vehiculoPick)?.value || '';
    const productoOpts = productos.map((p) => ({ id: p.id, value: p.descripcion }));
    const productoSel = productoOpts.find((o) => String(o.id) === form.productoId)?.value || '';
    // La duración editada puede no estar en el catálogo base; la añadimos si falta.
    const duracionOpts = DURACION_OPTS.some((o) => String(o.id) === form.duracionMeses)
        ? DURACION_OPTS
        : [...DURACION_OPTS, { id: parseInt(form.duracionMeses), value: `${form.duracionMeses} meses` }];
    const duracionSel = duracionOpts.find((o) => String(o.id) === form.duracionMeses)?.value || '';

    const totalUnidades = unidades.reduce((acc, u) => acc + (parseFloat(u.montoAnual) || 0), 0);

    const agregarVehiculo = (id: number) => {
        if (unidades.some((u) => u.vehiculoId === id)) { setVehiculoPick(''); return; }
        const v = vehiculos.find((x) => x.id === id);
        if (!v) return;
        const prod = productos.find((p) => String(p.id) === form.productoId);
        setUnidades((prev) => [...prev, {
            vehiculoId: id,
            placa: v.placa,
            desc: `${v.marca} ${v.modelo || ''}`.trim(),
            montoAnual: prod?.precioUnitario != null ? String(prod.precioUnitario) : '',
        }]);
        setVehiculoPick('');
    };
    const quitarVehiculo = (id: number) => setUnidades((prev) => prev.filter((u) => u.vehiculoId !== id));
    const setUnidadMonto = (id: number, monto: string) =>
        setUnidades((prev) => prev.map((u) => (u.vehiculoId === id ? { ...u, montoAnual: monto } : u)));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (unidades.length === 0) { alert('Agrega al menos un vehículo', 'warning'); return; }
        setLoading(true);
        try {
            const base: any = {
                fechaInicio: form.fechaInicio,
                duracionMeses: parseInt(form.duracionMeses),
                productoId: form.productoId ? parseInt(form.productoId) : undefined,
                observaciones: form.observaciones || undefined,
                // El set de vehículos ahora es editable también en edición: se envían las
                // unidades y el backend las sincroniza (agrega/quita/actualiza montos).
                vehiculos: unidades.map((u) => ({
                    vehiculoId: u.vehiculoId,
                    montoAnual: u.montoAnual ? parseFloat(u.montoAnual) : undefined,
                })),
            };
            const ok = esEdicion
                ? await updateContrato(contrato!.id, base)
                : await addContrato(base);
            if (ok) onSaved(); // el store ya mostró el toast (éxito o error)
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
            width="600px"
            position="center"
        >
            <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6">
                {/* Servicio primero: al agregar vehículos, autocompleta su monto con el precio del servicio */}
                <Select
                    name="productoId"
                    label="Servicio"
                    options={productoOpts}
                    value={productoSel}
                    isSearch
                    onChange={(id: any) => setForm((f) => ({ ...f, productoId: String(id) }))}
                    placeholder="— Servicio (GPS, monitoreo, alarma...) —"
                    error={null}
                />

                {/* Selector de vehículos (multi-vehículo) — disponible al crear y al editar */}
                <div>
                    <Select
                        name="vehiculoPick"
                        label="Agregar vehículo(s) *"
                        options={vehiculoOpts}
                        value={vehiculoPickLabel}
                        isSearch
                        onChange={(id: any) => { setVehiculoPick(String(id)); agregarVehiculo(Number(id)); }}
                        placeholder="— Buscar y agregar vehículo —"
                        error={null}
                    />
                    <p className="mt-1 text-xs text-gray-400">Puedes agregar, quitar o cambiar los vehículos del contrato.</p>
                </div>

                {/* Lista de vehículos del contrato */}
                {unidades.length > 0 && (
                    <div className="rounded-xl border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2 dark:border-slate-800">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Vehículos ({unidades.length})</span>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-slate-800">
                            {unidades.map((u) => (
                                <div key={u.vehiculoId} className="flex items-center gap-3 px-4 py-2.5">
                                    <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-sm font-bold tracking-widest text-gray-800 dark:bg-slate-800 dark:text-gray-100">{u.placa}</span>
                                    <span className="flex-1 truncate text-sm text-gray-600 dark:text-gray-300">{u.desc}</span>
                                    <div className="w-32">
                                        <InputPro
                                            name={`monto-${u.vehiculoId}`}
                                            type="number"
                                            value={u.montoAnual}
                                            onChange={(e) => setUnidadMonto(u.vehiculoId, e.target.value)}
                                            isLabel={false}
                                            placeholder="Monto S/"
                                            error={null}
                                        />
                                    </div>
                                    <button type="button" onClick={() => quitarVehiculo(u.vehiculoId)} aria-label="Quitar" className="text-gray-400 transition hover:text-rose-500">
                                        <Icon icon="solar:trash-bin-trash-bold" width={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        {totalUnidades > 0 && (
                            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5 dark:border-slate-800">
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total anual</span>
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">S/ {totalUnidades.toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                )}

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
                {/* El monto total es la suma de los montos por vehículo (ver "Total anual"). */}
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
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs whitespace-nowrap transition hover:bg-gray-100 dark:hover:bg-slate-700 ${danger ? 'text-rose-600 dark:text-rose-400' : 'text-gray-700 dark:text-gray-300'}`}
        >
            <Icon icon={icon} width={16} height={16} className="shrink-0" />
            <span>{label}</span>
        </button>
    );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function ContratosVehicularesPage() {
    const { alert } = useAlertStore();
    const auth = useAuthStore((s) => s.auth);
    // Estado de la lista desde el store (se actualiza reactivamente en cada CRUD).
    const data = useContratosVehicularesStore((s) => s.contratos);
    const alertas = useContratosVehicularesStore((s) => s.alertas);
    const total = useContratosVehicularesStore((s) => s.totalContratos);
    const estadisticas = useContratosVehicularesStore((s) => s.estadisticas);
    const loading = useContratosVehicularesStore((s) => s.loadingContratos);
    const getContratos = useContratosVehicularesStore((s) => s.getContratos);
    const renovarContrato = useContratosVehicularesStore((s) => s.renovarContrato);
    const cancelarContrato = useContratosVehicularesStore((s) => s.cancelarContrato);
    const deleteContrato = useContratosVehicularesStore((s) => s.deleteContrato);

    const [estadoFilter, setEstadoFilter] = useState<EstadoContrato | 'TODOS'>('TODOS');
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 350);
    // Paginación client-side (mismo patrón que Comprobantes / Kardex Productos).
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);

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

    useEffect(() => {
        getContratos({ estado: estadoFilter, search: debouncedSearch });
    }, [estadoFilter, debouncedSearch, getContratos]);

    // Al cambiar filtros o tamaño de página, volver a la página 1.
    useEffect(() => {
        setCurrentPage(1);
    }, [estadoFilter, debouncedSearch, itemsPerPage]);

    // Renovar pasa siempre por confirmación para evitar renovaciones por error.
    const confirmarRenovar = async () => {
        if (!contratoRenovar) return;
        const contrato = contratoRenovar;
        setRenovando(contrato.id);
        setContratoRenovar(null);
        await renovarContrato(contrato.id);
        setRenovando(null);
    };

    const handleCancelar = async () => {
        if (!contratoCancelar) return;
        setCancelando(true);
        const ok = await cancelarContrato(contratoCancelar.id);
        if (ok) setContratoCancelar(null);
        setCancelando(false);
    };

    // Placas del contrato (todas las unidades; respaldo al vehículo principal).
    const placasDeContrato = (c: IContratoVehicular): string[] => {
        if (c.unidades?.length) return c.unidades.map((u) => u.vehiculo?.placa || '').filter(Boolean);
        return c.vehiculo?.placa ? [c.vehiculo.placa] : [];
    };

    // Abre WhatsApp con un recordatorio de vencimiento prellenado para el propietario.
    const recordarWhatsApp = (c: IContratoVehicular) => {
        const tel = c.vehiculo?.cliente?.telefono;
        if (!tel) { alert('Este propietario no tiene teléfono registrado', 'warning'); return; }
        const dias = diasRestantes(c.fechaFin);
        const nombre = c.vehiculo?.cliente?.nombre || 'estimado(a) cliente';
        const servicio = c.producto?.descripcion ? ` (${c.producto.descripcion})` : '';
        const placas = placasDeContrato(c);
        const vehiculosTxt = placas.length > 1
            ? `sus vehículos ${placas.join(', ')}`
            : `su vehículo ${placas[0] || ''}`;
        const estadoTxt = dias < 0
            ? `venció hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? '' : 's'}`
            : dias === 0 ? 'vence hoy'
                : `vence en ${dias} día${dias === 1 ? '' : 's'}`;
        const mensaje =
            `Hola ${nombre}, le recordamos que el contrato/suscripción de ${vehiculosTxt}${servicio} ${estadoTxt} (${fmt(c.fechaFin)}). ` +
            `Le invitamos a renovarlo para mantener su servicio activo. ¡Gracias!`;
        const url = buildStorePurchaseWhatsappUrl(tel, mensaje);
        if (!url) { alert('No se pudo generar el enlace de WhatsApp', 'warning'); return; }
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // Genera el PDF/impresión del contrato con la lista completa de vehículos.
    const imprimirContrato = (c: IContratoVehicular) => {
        const vehiculos = c.unidades?.length
            ? c.unidades.map((u) => ({
                placa: u.vehiculo?.placa || '',
                marca: u.vehiculo?.marca, modelo: u.vehiculo?.modelo,
                color: u.vehiculo?.color, anio: u.vehiculo?.anio,
                montoAnual: u.montoAnual,
            }))
            : [{
                placa: c.vehiculo?.placa || '',
                marca: c.vehiculo?.marca, modelo: c.vehiculo?.modelo,
                color: c.vehiculo?.color, anio: undefined,
                montoAnual: c.montoAnual,
            }];
        printContrato({
            numero: c.id,
            estado: estadoLabel[c.estado],
            servicio: c.producto?.descripcion,
            fechaInicio: c.fechaInicio,
            fechaFin: c.fechaFin,
            montoTotalAnual: c.montoAnual,
            observaciones: c.observaciones,
            cliente: c.vehiculo?.cliente,
            vehiculos,
            empresa: (auth as any)?.empresa,
        });
    };

    const handleEliminar = async () => {
        if (!contratoEliminar) return;
        setEliminando(true);
        const ok = await deleteContrato(contratoEliminar.id);
        if (ok) setContratoEliminar(null);
        setEliminando(false);
    };

    const bodyData = data.map((c) => {
        const dias = diasRestantes(c.fechaFin);
        return {
            id: c.id,
            Vehículo: (() => {
                const placas = placasDeContrato(c);
                const extra = placas.length - 1;
                return (
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="rounded-lg bg-gray-100 px-2 py-0.5 font-mono text-sm font-bold tracking-widest text-gray-800 dark:bg-slate-800 dark:text-gray-100">{c.vehiculo?.placa}</span>
                            {extra > 0 && (
                                <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" title={placas.join(', ')}>+{extra}</span>
                            )}
                        </div>
                        <p className="mt-0.5 text-xs text-gray-400">{extra > 0 ? `${placas.length} vehículos` : `${c.vehiculo?.marca || ''} ${c.vehiculo?.modelo || ''}`}</p>
                    </div>
                );
            })(),
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

    // Paginación client-side: se pasa al DataTable solo la porción de la página
    // actual (sin usar la paginación interna del DataTable) y se controla con el
    // componente <Pagination>, igual que Comprobantes / Kardex Productos.
    const totalItems = bodyData.length;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const pages: number[] = [];
    for (let i = 1; i <= Math.ceil(totalItems / itemsPerPage); i++) pages.push(i);
    const paginatedBody = bodyData.slice(indexOfFirstItem, indexOfLastItem);

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

            {/* KPIs / cuadritos informativos */}
            {estadisticas && (() => {
                const mes = new Date().toLocaleDateString('es-PE', { month: 'long' });
                const cards = [
                    { label: 'Vigentes', value: estadisticas.vigentes, sub: `de ${estadisticas.total} en total`, icon: 'solar:check-circle-bold', iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
                    { label: 'Vencen este mes', value: estadisticas.vencenEsteMes, sub: `en ${mes}`, icon: 'solar:calendar-bold', iconClass: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
                    { label: 'Por vencer (30 días)', value: estadisticas.porVencer, sub: estadisticas.proximo ? `Próximo: ${estadisticas.proximo.placa} · ${estadisticas.proximo.dias}d` : 'Sin próximos', icon: 'solar:alarm-bold', iconClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
                    { label: 'Vencidos', value: estadisticas.vencidos, sub: 'Renuévalos o cancélalos', icon: 'solar:danger-triangle-bold', iconClass: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' },
                ];
                return (
                    <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {cards.map((c) => (
                            <div key={c.label} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{c.label}</p>
                                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.iconClass}`}><Icon icon={c.icon} width={18} /></span>
                                </div>
                                <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">{c.value}</p>
                                <p className="mt-0.5 truncate text-[11px] text-gray-400" title={c.sub}>{c.sub}</p>
                            </div>
                        ))}
                    </div>
                );
            })()}

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
                                    {c.vehiculo?.cliente?.telefono && (
                                        <button onClick={() => recordarWhatsApp(c)} title="Avisar al cliente por WhatsApp" className="flex items-center justify-center rounded-lg bg-emerald-500 p-1.5 text-white transition hover:bg-emerald-600">
                                            <Icon icon="mdi:whatsapp" width={15} height={15} />
                                        </button>
                                    )}
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
                        <div>
                            <DataTable headerColumns={['Vehículo', 'Propietario', 'Servicio', 'Inicio', 'Vencimiento', 'Estado', 'Acciones']} bodyData={paginatedBody} />
                            {pages.length > 1 && (
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                                    <Pagination
                                        data={paginatedBody}
                                        optionSelect
                                        currentPage={currentPage}
                                        indexOfFirstItem={indexOfFirstItem}
                                        indexOfLastItem={indexOfLastItem}
                                        setcurrentPage={setCurrentPage}
                                        setitemsPerPage={setItemsPerPage}
                                        pages={pages}
                                        total={totalItems}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Dropdown de acciones */}
            <TableActionMenu isOpen={Boolean(menuAnchor)} anchorEl={menuAnchor} onClose={closeMenu} className="w-56">
                {menuRow && (() => {
                    const row = menuRow;
                    return (
                        <>
                            <MenuItem icon="solar:pen-bold" label="Editar contrato" onClick={() => { setContratoEditar(row); closeMenu(); }} />
                            <MenuItem icon="solar:printer-bold" label="Imprimir / PDF" onClick={() => { imprimirContrato(row); closeMenu(); }} />
                            <MenuItem icon="mdi:whatsapp" label="Recordar por WhatsApp" onClick={() => { recordarWhatsApp(row); closeMenu(); }} />
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
                    onSaved={() => { setModalNuevo(false); setContratoEditar(null); }}
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
