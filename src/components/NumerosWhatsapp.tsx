import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { del, get, patch } from '@/utils/fetch';
import useAlertStore from '@/zustand/alert';
import ConectarWhatsAppButton from './ConectarWhatsAppButton';

export interface NumeroWhatsapp {
    id: number;
    phoneNumberId: string;
    numeroVisible: string | null;
    etiqueta: string | null;
    coexistencia: boolean;
    iaActiva: boolean;
    principal: boolean;
}

export const nombreNumero = (n: Pick<NumeroWhatsapp, 'etiqueta' | 'numeroVisible' | 'phoneNumberId'>) =>
    n.etiqueta || n.numeroVisible || `ID ${n.phoneNumberId}`;

/**
 * Los números de WhatsApp de la empresa. Todos llegan a la misma bandeja; en
 * cada uno se decide si la IA contesta, y el principal es el que usan los
 * avisos de la empresa (despacho, alertas, comprobantes).
 */
export default function NumerosWhatsapp() {
    const { alert } = useAlertStore();
    const [numeros, setNumeros] = useState<NumeroWhatsapp[]>([]);
    const [agregando, setAgregando] = useState(false);
    const [editando, setEditando] = useState<number | null>(null);
    const [etiqueta, setEtiqueta] = useState('');
    const [ocupado, setOcupado] = useState<number | null>(null);
    const [reconectando, setReconectando] = useState(false);
    const [cargado, setCargado] = useState(false);

    const cargar = useCallback(async () => {
        const resp: any = await get('whatsapp/numeros');
        setNumeros(Array.isArray(resp?.data) ? resp.data : []);
        setCargado(true);
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const cambiar = async (n: NumeroWhatsapp, cambios: Partial<Pick<NumeroWhatsapp, 'etiqueta' | 'iaActiva' | 'principal'>>) => {
        setOcupado(n.id);
        const resp: any = await patch(`whatsapp/numeros/${n.id}`, cambios);
        setOcupado(null);
        if (Array.isArray(resp?.data)) setNumeros(resp.data);
        else alert(resp?.error || 'No se pudo guardar', 'error');
    };

    const quitar = async (n: NumeroWhatsapp) => {
        setOcupado(n.id);
        const resp: any = await del(`whatsapp/numeros/${n.id}`);
        setOcupado(null);
        if (Array.isArray(resp?.data)) {
            setNumeros(resp.data);
            alert(`${nombreNumero(n)} ya no está conectado a Krezka`, 'success');
        } else alert(resp?.error || 'No se pudo quitar', 'error');
    };

    const guardarEtiqueta = async (n: NumeroWhatsapp) => {
        setEditando(null);
        if ((n.etiqueta || '') === etiqueta.trim()) return;
        await cambiar(n, { etiqueta: etiqueta.trim() || null });
    };

    // Empresa conectada antes de tener la lista: se ofrece reconectar como siempre.
    if (cargado && numeros.length === 0) return <ConectarWhatsAppButton numeroConectado="tu número" onConectado={cargar} />;
    if (numeros.length === 0) return null;

    return (
        <div data-testid="wa-numeros">
            <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-black text-gray-900 dark:text-white">Tus números</h3>
                <span className="text-[11px] text-gray-400">Todos llegan a la misma bandeja</span>
            </div>
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 dark:divide-slate-800 dark:border-slate-800">
                {numeros.map((n) => (
                    <li key={n.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5" data-testid={`wa-numero-${n.id}`}>
                        <Icon icon={n.coexistencia ? 'solar:smartphone-bold' : 'mdi:whatsapp'} className="shrink-0 text-[#25D366]" width={18} />
                        <div className="min-w-0 flex-1">
                            {editando === n.id ? (
                                <input
                                    autoFocus
                                    value={etiqueta}
                                    maxLength={40}
                                    onChange={(e) => setEtiqueta(e.target.value)}
                                    onBlur={() => guardarEtiqueta(n)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') guardarEtiqueta(n); if (e.key === 'Escape') setEditando(null); }}
                                    placeholder="Ej: Ventas, Campaña TikTok"
                                    className="w-full max-w-xs rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => { setEditando(n.id); setEtiqueta(n.etiqueta || ''); }}
                                    className="group flex items-center gap-1.5 text-left text-sm font-bold text-gray-900 dark:text-white"
                                    title="Ponerle un nombre"
                                >
                                    {nombreNumero(n)}
                                    <Icon icon="solar:pen-linear" width={12} className="text-gray-300 group-hover:text-gray-500" />
                                </button>
                            )}
                            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-400">
                                {n.etiqueta && n.numeroVisible && <span>{n.numeroVisible}</span>}
                                {n.principal && <span className="rounded-full bg-emerald-50 px-1.5 py-px font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Principal</span>}
                                {n.coexistencia && <span>Sigue en la app del celular</span>}
                            </p>
                        </div>
                        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300" title="Si está apagado, los chats de este número los atiende tu equipo">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={n.iaActiva}
                                disabled={ocupado === n.id}
                                onClick={() => cambiar(n, { iaActiva: !n.iaActiva })}
                                data-testid={`wa-ia-${n.id}`}
                                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${n.iaActiva ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'}`}
                            >
                                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${n.iaActiva ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </button>
                            IA contesta
                        </label>
                        {n.principal && (
                            <button
                                type="button"
                                onClick={() => setReconectando((v) => !v)}
                                className="rounded-lg px-2 py-1 text-[11px] font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
                                title="Cambiar el número principal por otro"
                            >
                                Reconectar
                            </button>
                        )}
                        {!n.principal && (
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    disabled={ocupado === n.id}
                                    onClick={() => cambiar(n, { principal: true })}
                                    className="rounded-lg px-2 py-1 text-[11px] font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
                                    title="Los avisos de despacho, alertas y comprobantes salen por el principal"
                                >
                                    Hacer principal
                                </button>
                                <button
                                    type="button"
                                    disabled={ocupado === n.id}
                                    onClick={() => quitar(n)}
                                    className="rounded-lg px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                >
                                    Quitar
                                </button>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
            <p className="mt-2 text-[11px] text-gray-400">
                A cada cliente se le contesta por el número al que escribió. Los avisos de despacho, alertas y comprobantes salen por el principal.
            </p>

            {reconectando && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/40 dark:bg-amber-950/10">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-black text-gray-900 dark:text-white">Reconectar el número principal</p>
                        <button type="button" onClick={() => setReconectando(false)} className="text-[11px] font-bold text-gray-400 hover:text-gray-600">Cancelar</button>
                    </div>
                    <p className="mb-3 text-[11px] text-amber-700 dark:text-amber-300">
                        El número que conectes aquí reemplaza al principal. Para sumar uno sin reemplazar, usa "Agregar otro número".
                    </p>
                    <ConectarWhatsAppButton numeroConectado="tu número" onConectado={() => { setReconectando(false); cargar(); }} />
                </div>
            )}

            {agregando ? (
                <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 dark:border-emerald-900/30 dark:bg-emerald-950/10" data-testid="wa-agregar">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-black text-gray-900 dark:text-white">Agregar otro número</p>
                        <button type="button" onClick={() => setAgregando(false)} className="text-[11px] font-bold text-gray-400 hover:text-gray-600">Cancelar</button>
                    </div>
                    <p className="mb-3 text-[11px] text-gray-500 dark:text-gray-400">Se suma a los que ya tienes: no reemplaza a ninguno.</p>
                    <ConectarWhatsAppButton agregar onConectado={() => { setAgregando(false); cargar(); }} />
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setAgregando(true)}
                    data-testid="wa-agregar-abrir"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-emerald-300 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                >
                    <Icon icon="solar:add-circle-bold" width={16} /> Agregar otro número
                </button>
            )}
        </div>
    );
}
