import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import { get } from '@/utils/fetch';

/**
 * Confirmación para eliminar una empresa.
 *
 * Va aparte del `ModalConfirm` genérico por dos razones, las dos aprendidas de
 * cómo estaba antes:
 *
 *  1. Se disparaba con UN clic sobre una fila de una tabla con decenas de
 *     empresas. Acá hay que escribir el RUC: obliga a mirar cuál se está
 *     borrando, y el backend lo exige igual —no alcanza con esconder el botón.
 *  2. No decía qué se llevaba. El borrado alcanza más de cien tablas y no se
 *     deshace; antes de confirmar hay que ver el tamaño real de lo que se
 *     pierde, no una advertencia genérica.
 */
interface Props {
    empresa: { id: number; razonSocial: string; ruc?: string } | null;
    onCancelar: () => void;
    onConfirmar: (ruc: string) => Promise<void> | void;
}

interface Previa {
    totalFilas: number;
    tablasAfectadas: number;
    detalle: { tabla: string; filas: number }[];
}

export default function ModalEliminarEmpresa({ empresa, onCancelar, onConfirmar }: Props) {
    const [previa, setPrevia] = useState<Previa | null>(null);
    const [cargando, setCargando] = useState(false);
    const [rucEscrito, setRucEscrito] = useState('');
    const [eliminando, setEliminando] = useState(false);

    useEffect(() => {
        setPrevia(null);
        setRucEscrito('');
        if (!empresa) return;
        let vigente = true;
        setCargando(true);
        get(`empresa/${empresa.id}/eliminar/previsualizar`)
            .then((r: any) => { if (vigente) setPrevia(r?.data ?? r); })
            .catch(() => { /* sin previa igual se puede borrar: el backend valida */ })
            .finally(() => { if (vigente) setCargando(false); });
        return () => { vigente = false; };
    }, [empresa?.id]);

    if (!empresa) return null;

    const rucEsperado = String(empresa.ruc ?? '').trim();
    const puedeBorrar = !rucEsperado || rucEscrito.trim() === rucEsperado;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-xl">
                <div className="flex items-start gap-3 border-b border-gray-100 dark:border-slate-800 p-5">
                    <div className="rounded-full bg-rose-100 dark:bg-rose-900/30 p-2">
                        <Icon icon="solar:trash-bin-trash-bold" className="text-xl text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Eliminar empresa</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{empresa.razonSocial}</p>
                    </div>
                </div>

                <div className="space-y-4 p-5">
                    <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 p-3 text-sm text-rose-800 dark:text-rose-200">
                        Se borra toda su información de forma permanente. <span className="font-semibold">No se puede deshacer.</span>
                    </div>

                    {/* Lo que se pierde, en números. La advertencia sola no dice nada:
                        no es igual borrar una empresa de prueba que una con años de
                        comprobantes. */}
                    {cargando ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Revisando qué información tiene…</p>
                    ) : previa ? (
                        <div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                Se eliminarán <span className="font-bold">{previa.totalFilas.toLocaleString('es-PE')}</span> registros
                                en <span className="font-bold">{previa.tablasAfectadas}</span> tablas:
                            </p>
                            <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-gray-100 dark:border-slate-800">
                                <table className="w-full text-xs">
                                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                        {previa.detalle.map((d) => (
                                            <tr key={d.tabla}>
                                                <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400">{d.tabla}</td>
                                                <td className="px-3 py-1.5 text-right font-semibold text-gray-900 dark:text-gray-100">
                                                    {d.filas.toLocaleString('es-PE')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : null}

                    {rucEsperado && (
                        <div>
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Escribe el RUC <span className="font-mono">{rucEsperado}</span> para confirmar
                            </label>
                            <input
                                autoFocus
                                value={rucEscrito}
                                onChange={(e) => setRucEscrito(e.target.value)}
                                placeholder={rucEsperado}
                                className="mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono text-gray-900 dark:text-white outline-none focus:border-rose-400"
                            />
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-slate-800 p-4">
                    <Button variant="default" onClick={onCancelar} disabled={eliminando}>Cancelar</Button>
                    <Button
                        variant="danger"
                        disabled={!puedeBorrar || eliminando}
                        onClick={async () => {
                            setEliminando(true);
                            try { await onConfirmar(rucEscrito.trim()); } finally { setEliminando(false); }
                        }}
                    >
                        {eliminando ? 'Eliminando…' : 'Eliminar definitivamente'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
