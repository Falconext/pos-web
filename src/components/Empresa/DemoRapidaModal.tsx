import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import apiClient from '@/utils/apiClient';
import { BRAND } from '@/lib/branding';
import { useAuthStore } from '@/zustand/auth';
import { useExtentionsStore } from '@/zustand/extentions';
import { DIAS_DEMO, mensajeDeAcceso, planesVendibles, planParaDemo, rucCompleto, type PlanLite } from '@/features/admin/empresa/demoRapida';

/**
 * Demo rápida: con el RUC, un correo y un celular la empresa queda lista para
 * probar. SUNAT completa razón social y dirección, el PSE da las credenciales
 * de prueba y la contraseña se genera. Al final se muestra el acceso UNA vez,
 * listo para pegarlo en WhatsApp.
 */
interface Props {
    open: boolean;
    onClose: () => void;
    onCreada: (empresaId: number) => void;
}

interface Resultado {
    empresaId: number;
    razonSocial: string;
    email: string;
    password: string;
    vence: string;
    sunatEstado?: string;
    pse: { ok: boolean; mensaje?: string };
}

const INICIAL = { ruc: '', email: '', celular: '', nombre: '', rubroId: 0, planId: 0, dias: 15 };

const inputCls =
    'mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-violet-400';
const labelCls = 'text-xs font-semibold text-gray-700 dark:text-gray-300';

const mensajeDeError = (e: any, porDefecto: string) => {
    const m = e?.response?.data?.message ?? e?.message;
    return Array.isArray(m) ? m.join(' · ') : m || porDefecto;
};

export default function DemoRapidaModal({ open, onClose, onCreada }: Props) {
    const { auth } = useAuthStore();
    const { planes, rubros, getPlanes, getRubros } = useExtentionsStore();
    const [form, setForm] = useState(INICIAL);
    const [sunat, setSunat] = useState<{ razonSocial: string; estado: string; direccion: string } | null>(null);
    const [buscandoRuc, setBuscandoRuc] = useState(false);
    const [errorRuc, setErrorRuc] = useState<string | null>(null);
    const [creando, setCreando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resultado, setResultado] = useState<Resultado | null>(null);
    const [copiado, setCopiado] = useState(false);

    const producto = String(auth?.sistemaProducto || 'facturacion').toLowerCase();
    const plataforma = String(auth?.sistemaNegocio || BRAND.key || 'krezka').toLowerCase();
    const vendibles = useMemo(
        () => planesVendibles((planes as PlanLite[]) || [], producto, plataforma),
        [planes, producto, plataforma],
    );

    useEffect(() => {
        if (!open) return;
        setForm(INICIAL);
        setSunat(null);
        setErrorRuc(null);
        setError(null);
        setResultado(null);
        setCopiado(false);
        getPlanes();
        getRubros();
    }, [open, getPlanes, getRubros]);

    // Plan por defecto en cuanto llegan los planes.
    useEffect(() => {
        if (!open || form.planId) return;
        const plan = planParaDemo(vendibles);
        if (plan) setForm((f) => ({ ...f, planId: plan.id }));
    }, [open, vendibles, form.planId]);

    // Razón social de SUNAT apenas el RUC tiene 11 dígitos: se ve qué empresa es
    // antes de crearla.
    useEffect(() => {
        setSunat(null);
        setErrorRuc(null);
        if (!open || !rucCompleto(form.ruc)) return;
        let vigente = true;
        setBuscandoRuc(true);
        apiClient
            .get(`/empresa/consultar-ruc/${form.ruc.trim()}`)
            .then((resp: any) => {
                if (!vigente) return;
                const d = resp?.data?.data ?? resp?.data;
                if (!d?.nombre_o_razon_social) {
                    setErrorRuc('SUNAT no devolvió datos para ese RUC.');
                    return;
                }
                setSunat({
                    razonSocial: d.nombre_o_razon_social,
                    estado: String(d.estado ?? '').toUpperCase(),
                    direccion: d.direccion_completa || d.direccion || '',
                });
            })
            .catch((e: any) => vigente && setErrorRuc(mensajeDeError(e, 'No se pudo consultar el RUC.')))
            .finally(() => vigente && setBuscandoRuc(false));
        return () => {
            vigente = false;
        };
    }, [open, form.ruc]);

    if (!open) return null;

    const set = (campo: keyof typeof INICIAL, valor: string | number) => setForm((f) => ({ ...f, [campo]: valor }));
    const listo =
        !!sunat && /\S+@\S+\.\S+/.test(form.email) && form.celular.trim().length >= 6 && form.rubroId > 0 && form.planId > 0;

    const crear = async () => {
        setCreando(true);
        setError(null);
        try {
            const resp: any = await apiClient.post('/empresa/demo-rapida', {
                ruc: form.ruc.trim(),
                email: form.email.trim(),
                celular: form.celular.trim(),
                nombre: form.nombre.trim() || undefined,
                rubroId: Number(form.rubroId),
                planId: Number(form.planId),
                dias: form.dias,
            });
            const r: Resultado | undefined = resp?.data?.data;
            if (!r?.empresaId) {
                setError(resp?.data?.message || 'No se pudo crear la demo.');
                return;
            }
            setResultado(r);
            onCreada(r.empresaId);
        } catch (e: any) {
            setError(mensajeDeError(e, 'No se pudo crear la demo.'));
        } finally {
            setCreando(false);
        }
    };

    const mensaje = resultado
        ? mensajeDeAcceso({
              razonSocial: resultado.razonSocial,
              email: resultado.email,
              password: resultado.password,
              vence: resultado.vence,
              url: `${BRAND.dashboardUrl}/login`,
              marca: BRAND.name,
          })
        : '';

    const copiar = async () => {
        try {
            await navigator.clipboard.writeText(mensaje);
            setCopiado(true);
            window.setTimeout(() => setCopiado(false), 2000);
        } catch {
            setCopiado(false);
        }
    };

    const celularWa = (resultado ? form.celular : '').replace(/\D/g, '');
    const waUrl = celularWa
        ? `https://wa.me/${celularWa.length === 9 ? `51${celularWa}` : celularWa}?text=${encodeURIComponent(mensaje)}`
        : '';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 shadow-xl">
                <div className="flex items-start gap-3 border-b border-gray-100 dark:border-slate-800 p-5">
                    <div className="rounded-full bg-violet-100 dark:bg-violet-900/30 p-2">
                        <Icon icon="solar:rocket-2-bold-duotone" className="text-xl text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                            {resultado ? 'Demo lista' : 'Demo rápida'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {resultado
                                ? resultado.razonSocial
                                : 'Con el RUC basta: SUNAT completa los datos y la facturación queda en prueba.'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800" aria-label="Cerrar">
                        <Icon icon="solar:close-circle-linear" width={20} />
                    </button>
                </div>

                {resultado ? (
                    <div className="space-y-4 p-5">
                        <div className="rounded-xl border border-gray-100 dark:border-slate-800 divide-y divide-gray-50 dark:divide-slate-800 text-sm">
                            {[
                                ['Ingreso', `${BRAND.dashboardUrl}/login`],
                                ['Usuario', resultado.email],
                                ['Contraseña', resultado.password],
                                ['Vence', new Date(resultado.vence).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })],
                            ].map(([k, v]) => (
                                <div key={k} className="flex items-center justify-between gap-3 px-3 py-2">
                                    <span className="text-gray-500 dark:text-gray-400">{k}</span>
                                    <span className={`font-semibold text-gray-900 dark:text-white ${k === 'Contraseña' ? 'font-mono' : ''}`} data-testid={`demo-${k}`}>
                                        {v}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                            La contraseña se muestra solo esta vez. Cópiala o envíala ahora.
                        </p>
                        {!resultado.pse.ok && (
                            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-200">
                                La demo se creó, pero el PSE no dio las credenciales de prueba ({resultado.pse.mensaje}). Puede usar el sistema;
                                para emitir de prueba carga el usuario PSE al editar la empresa, o pásala a producción cuando compre.
                            </div>
                        )}
                        {resultado.sunatEstado && resultado.sunatEstado !== 'ACTIVO' && (
                            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-200">
                                SUNAT tiene este RUC como "{resultado.sunatEstado}": no podrá pasar a producción hasta regularizarlo.
                            </div>
                        )}
                        <div className="flex flex-wrap justify-end gap-2">
                            <Button variant="default" onClick={copiar}>
                                <Icon icon={copiado ? 'solar:check-circle-bold' : 'solar:copy-bold-duotone'} className="mr-1" />
                                {copiado ? 'Copiado' : 'Copiar mensaje'}
                            </Button>
                            {waUrl && (
                                <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700"
                                >
                                    <Icon icon="ic:baseline-whatsapp" /> Enviar por WhatsApp
                                </a>
                            )}
                            <Button variant="primary" onClick={onClose}>Listo</Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4 p-5">
                            <div>
                                <label className={labelCls}>RUC</label>
                                <input
                                    autoFocus
                                    inputMode="numeric"
                                    maxLength={11}
                                    value={form.ruc}
                                    onChange={(e) => set('ruc', e.target.value.replace(/\D/g, ''))}
                                    placeholder="20xxxxxxxxx"
                                    className={`${inputCls} font-mono`}
                                    data-testid="demo-ruc"
                                />
                                {buscandoRuc && <p className="mt-1 text-xs text-gray-500">Consultando SUNAT…</p>}
                                {errorRuc && <p className="mt-1 text-xs text-rose-600">{errorRuc}</p>}
                                {sunat && (
                                    <div className="mt-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 px-3 py-2 text-xs">
                                        <p className="font-semibold text-gray-900 dark:text-white" data-testid="demo-razon">{sunat.razonSocial}</p>
                                        <p className="text-gray-500 dark:text-gray-400 truncate">{sunat.direccion}</p>
                                        {sunat.estado && sunat.estado !== 'ACTIVO' && (
                                            <p className="mt-1 font-semibold text-amber-600">SUNAT: {sunat.estado}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Correo del dueño</label>
                                    <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} data-testid="demo-email" />
                                </div>
                                <div>
                                    <label className={labelCls}>Celular</label>
                                    <input inputMode="tel" value={form.celular} onChange={(e) => set('celular', e.target.value)} className={inputCls} data-testid="demo-celular" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Rubro</label>
                                    <select
                                        value={form.rubroId}
                                        onChange={(e) => set('rubroId', Number(e.target.value))}
                                        className={inputCls}
                                        data-testid="demo-rubro"
                                    >
                                        <option value={0}>Elige un rubro</option>
                                        {(rubros as { id: number; value: string }[]).map((r) => (
                                            <option key={r.id} value={r.id}>{r.value}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Plan de la demo</label>
                                    <select
                                        value={form.planId}
                                        onChange={(e) => set('planId', Number(e.target.value))}
                                        className={inputCls}
                                        data-testid="demo-plan"
                                    >
                                        {vendibles.length === 0 && <option value={0}>Sin planes</option>}
                                        {vendibles.map((p) => (
                                            <option key={p.id} value={p.id}>{p.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>Nombre del contacto (opcional)</label>
                                <input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Si lo dejas vacío se usa la razón social" className={inputCls} />
                            </div>

                            <div>
                                <label className={labelCls}>Días de prueba</label>
                                <div className="mt-1 inline-flex rounded-xl bg-gray-100 dark:bg-slate-800 p-1">
                                    {DIAS_DEMO.map((d) => (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => set('dias', d)}
                                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${form.dias === d ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                                        >
                                            {d} días
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 p-3 text-sm text-rose-800 dark:text-rose-200">{error}</div>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-slate-800 p-4">
                            <Button variant="default" onClick={onClose} disabled={creando}>Cancelar</Button>
                            <Button variant="primary" onClick={crear} disabled={!listo || creando} data-testid="demo-crear">
                                {creando ? 'Creando…' : 'Crear demo'}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
