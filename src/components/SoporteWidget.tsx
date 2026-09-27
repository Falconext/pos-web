import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSoporteStore } from '@/zustand/soporte';

function etiquetaDia(d: Date): string {
    if (isToday(d)) return 'Hoy';
    if (isYesterday(d)) return 'Ayer';
    return format(d, "d 'de' MMMM", { locale: es });
}

/**
 * Widget flotante de soporte (estilo Hostinger/Intercom): burbuja fija abajo a
 * la derecha, visible en todo el panel de administración. Al abrirse carga el
 * hilo completo (y lo marca como leído); mientras está cerrado solo consulta
 * el contador de no leídos, sin marcar nada como visto.
 */
export default function SoporteWidget() {
    const [abierto, setAbierto] = useState(false);
    const [noLeidos, setNoLeidos] = useState(0);
    const [texto, setTexto] = useState('');
    const { mensajes, loading, enviando, error, cargarMensajes, enviarMensaje, consultarNoLeidos } = useSoporteStore();
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        consultarNoLeidos().then((n) => setNoLeidos(n));
    }, [consultarNoLeidos]);

    // Mientras está cerrado, cualquier mensaje SISTEMA en vivo suma al badge.
    useEffect(() => {
        if (abierto) return;
        const ultimo = mensajes[mensajes.length - 1];
        if (ultimo?.rol === 'SISTEMA') setNoLeidos((n) => n + 1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mensajes.length]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes.length, abierto]);

    const abrir = () => {
        setAbierto(true);
        setNoLeidos(0);
        cargarMensajes();
    };

    const enviar = async () => {
        const t = texto.trim();
        if (!t || enviando) return;
        setTexto('');
        await enviarMensaje(t);
    };

    return (
        <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
            {abierto && (
                <div className="flex h-[520px] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-3 bg-gradient-to-br from-violet-600 to-violet-500 px-4 py-3.5 text-white">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                            <Icon icon="solar:chat-round-dots-bold" width={18} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold">Soporte Krezka</h3>
                            <p className="text-[11px] text-violet-100/90">Te respondemos por aquí</p>
                        </div>
                        <button onClick={() => setAbierto(false)} className="rounded-lg p-1 hover:bg-white/10">
                            <Icon icon="solar:close-circle-bold" width={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-[#f6f7fb] px-3.5 py-3 dark:bg-[#0b0f17]">
                        {loading && mensajes.length === 0 && (
                            <div className="flex items-center justify-center py-14 text-gray-400">
                                <Icon icon="eos-icons:loading" className="animate-spin" width={22} />
                            </div>
                        )}
                        {!loading && mensajes.length === 0 && (
                            <div className="flex flex-col items-center justify-center gap-2 py-14 text-gray-400">
                                <Icon icon="solar:chat-round-line-linear" width={28} />
                                <p className="text-xs">Cuéntanos en qué te podemos ayudar</p>
                            </div>
                        )}
                        {(() => {
                            let lastDay: Date | null = null;
                            return mensajes.map((m) => {
                                const date = new Date(m.creadoEn);
                                const esEmpresa = m.rol === 'EMPRESA';
                                const showDay = !lastDay || !isSameDay(date, lastDay);
                                lastDay = date;
                                return (
                                    <div key={m.id}>
                                        {showDay && (
                                            <div className="my-2.5 flex justify-center">
                                                <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-medium text-gray-500 shadow-sm dark:bg-slate-800 dark:text-gray-400">
                                                    {etiquetaDia(date)}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`mt-1 flex ${esEmpresa ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`max-w-[80%] px-3 py-2 text-[13px] shadow-sm ${esEmpresa
                                                        ? 'rounded-2xl rounded-br-md bg-gradient-to-br from-violet-600 to-violet-500 text-white'
                                                        : 'rounded-2xl rounded-bl-md bg-white text-gray-800 dark:bg-slate-800 dark:text-gray-100'
                                                    }`}
                                            >
                                                {!esEmpresa && (
                                                    <p className="mb-0.5 text-[10px] font-bold text-violet-500 dark:text-violet-300">
                                                        {m.autorNombre || 'Soporte Krezka'}
                                                    </p>
                                                )}
                                                <p className="whitespace-pre-wrap break-words leading-relaxed">{m.contenido}</p>
                                                <span className={`mt-1 block text-right text-[9px] ${esEmpresa ? 'text-violet-100/80' : 'text-gray-400'}`}>
                                                    {format(date, 'HH:mm')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                        <div ref={bottomRef} />
                    </div>

                    {error && (
                        <div className="border-t border-rose-100 bg-rose-50 px-3.5 py-1.5 text-[11px] text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/30">
                            {error}
                        </div>
                    )}

                    <div className="flex items-end gap-2 border-t border-gray-100 p-2.5 dark:border-slate-800">
                        <textarea
                            value={texto}
                            onChange={(e) => setTexto(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    enviar();
                                }
                            }}
                            placeholder="Escribe tu mensaje…"
                            rows={1}
                            className="max-h-24 flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                        <button
                            type="button"
                            onClick={enviar}
                            disabled={!texto.trim() || enviando}
                            className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-700 disabled:opacity-40"
                        >
                            <Icon icon={enviando ? 'solar:refresh-bold' : 'solar:plain-bold'} className={enviando ? 'animate-spin' : ''} width={16} />
                        </button>
                    </div>
                </div>
            )}

            <button
                type="button"
                onClick={() => (abierto ? setAbierto(false) : abrir())}
                className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-violet-500 text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
                title="Soporte Krezka"
            >
                <Icon icon={abierto ? 'solar:close-circle-bold' : 'solar:chat-round-dots-bold'} width={26} />
                {!abierto && noLeidos > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                        {noLeidos}
                    </span>
                )}
            </button>
        </div>
    );
}
