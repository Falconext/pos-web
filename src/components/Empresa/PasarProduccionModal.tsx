import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import apiClient from '@/utils/apiClient';
import { BRAND } from '@/lib/branding';
import { useAuthStore } from '@/zustand/auth';
import { useExtentionsStore } from '@/zustand/extentions';
import { planesVendibles, type PlanLite } from '@/features/admin/empresa/demoRapida';

/**
 * Pasar una demo a producción: el cliente compró.
 *
 * En QPSE el RUC pasa a producción y eso NO se deshace; por eso hay que
 * escribir el RUC para confirmar, igual que al eliminar una empresa. Se elige
 * el plan que compró y, si se quiere, se borran las ventas de prueba para que
 * la primera factura real salga con el N° 1.
 */
interface Props {
    empresa: { id: number; razonSocial?: string; ruc?: string; planId?: number } | null;
    onClose: () => void;
    onHecho: () => void;
}

const mensajeDeError = (e: any, porDefecto: string) => {
    const m = e?.response?.data?.message ?? e?.message;
    return Array.isArray(m) ? m.join(' · ') : m || porDefecto;
};

export default function PasarProduccionModal({ empresa, onClose, onHecho }: Props) {
    const { auth } = useAuthStore();
    const { planes, getPlanes } = useExtentionsStore();
    const [planId, setPlanId] = useState(0);
    const [borrarPruebas, setBorrarPruebas] = useState(true);
    const [previa, setPrevia] = useState<{ comprobantes: number; guias: number } | null>(null);
    const [rucEscrito, setRucEscrito] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hecho, setHecho] = useState<{ plan: string } | null>(null);

    const producto = String(auth?.sistemaProducto || 'facturacion').toLowerCase();
    const plataforma = String(auth?.sistemaNegocio || BRAND.key || 'krezka').toLowerCase();
    const vendibles = useMemo(
        () => planesVendibles((planes as PlanLite[]) || [], producto, plataforma),
        [planes, producto, plataforma],
    );

    useEffect(() => {
        setPlanId(0);
        setBorrarPruebas(true);
        setPrevia(null);
        setRucEscrito('');
        setError(null);
        setHecho(null);
        if (!empresa) return;
        getPlanes();
        let vigente = true;
        apiClient
            .get(`/empresa/${empresa.id}/pase-produccion`)
            .then((resp: any) => {
                const d = resp?.data?.data;
                if (vigente && typeof d?.comprobantes === 'number') {
                    setPrevia({ comprobantes: d.comprobantes, guias: d.guias });
                    if (d.empresa?.planId) setPlanId(d.empresa.planId);
                }
            })
            .catch(() => undefined);
        return () => {
            vigente = false;
        };
    }, [empresa?.id, getPlanes]);

    if (!empresa) return null;

    const rucEsperado = String(empresa.ruc ?? '').trim();
    const planValido = vendibles.some((p) => p.id === planId);
    const puede = planValido && rucEscrito.trim() === rucEsperado && !enviando;

    const pasar = async () => {
        setEnviando(true);
        setError(null);
        try {
            const resp: any = await apiClient.post(
                `/empresa/${empresa.id}/pase-produccion`,
                { planId, confirmar: true, borrarPruebas },
                { timeout: 120_000 },
            );
            const r = resp?.data?.data;
            if (!r?.plan) {
                setError(resp?.data?.message || 'No se pudo pasar a producción.');
                return;
            }
            setHecho({ plan: r.plan });
            onHecho();
        } catch (e: any) {
            setError(mensajeDeError(e, 'No se pudo pasar a producción.'));
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 shadow-xl">
                <div className="flex items-start gap-3 border-b border-gray-100 dark:border-slate-800 p-5">
                    <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-2">
                        <Icon icon="solar:verified-check-bold-duotone" className="text-xl text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                            {hecho ? 'Ya está en producción' : 'Pasar a producción'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{empresa.razonSocial}</p>
                    </div>
                </div>

                {hecho ? (
                    <div className="space-y-3 p-5 text-sm text-gray-700 dark:text-gray-300">
                        <p>
                            Plan <span className="font-semibold">{hecho.plan}</span>. Las fechas corren desde hoy y lo que emita va a SUNAT.
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            SUNAT puede tardar hasta 24 horas en habilitar el RUC con el PSE. Si la primera factura sale rechazada por
                            "no autorizado", reintenta al día siguiente.
                        </p>
                        <div className="flex justify-end">
                            <Button variant="primary" onClick={onClose}>Listo</Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4 p-5">
                            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-200">
                                Desde ahora sus comprobantes van a SUNAT de verdad. En el PSE <span className="font-semibold">no se puede volver a prueba</span>.
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Plan que compró</label>
                                <select
                                    value={planId}
                                    onChange={(e) => setPlanId(Number(e.target.value))}
                                    className="mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-400"
                                    data-testid="prod-plan"
                                >
                                    {!planValido && <option value={0}>Elige el plan</option>}
                                    {vendibles.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.nombre} · S/ {Number(p.costo ?? 0).toFixed(2)}
                                            {p.tipoFacturacion ? ` / ${p.tipoFacturacion.toLowerCase()}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-gray-100 dark:border-slate-800 p-3">
                                <input
                                    type="checkbox"
                                    checked={borrarPruebas}
                                    onChange={(e) => setBorrarPruebas(e.target.checked)}
                                    className="mt-0.5"
                                    data-testid="prod-borrar"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Borrar las ventas de prueba
                                    {previa && (
                                        <span className="text-gray-500 dark:text-gray-400">
                                            {' '}({previa.comprobantes} comprobante{previa.comprobantes === 1 ? '' : 's'}
                                            {previa.guias ? `, ${previa.guias} guía${previa.guias === 1 ? '' : 's'}` : ''})
                                        </span>
                                    )}
                                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        La numeración vuelve a 1. Productos, clientes, stock y caja se quedan como están.
                                    </span>
                                </span>
                            </label>

                            <div>
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Escribe el RUC <span className="font-mono">{rucEsperado}</span> para confirmar
                                </label>
                                <input
                                    value={rucEscrito}
                                    onChange={(e) => setRucEscrito(e.target.value)}
                                    placeholder={rucEsperado}
                                    className="mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono text-gray-900 dark:text-white outline-none focus:border-emerald-400"
                                    data-testid="prod-ruc"
                                />
                            </div>

                            {error && (
                                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 p-3 text-sm text-rose-800 dark:text-rose-200">{error}</div>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-slate-800 p-4">
                            <Button variant="default" onClick={onClose} disabled={enviando}>Cancelar</Button>
                            <Button variant="success" onClick={pasar} disabled={!puede} data-testid="prod-confirmar">
                                {enviando ? 'Pasando…' : 'Pasar a producción'}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
