import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { format, formatDistanceToNow, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSoporteSistemaStore } from '@/zustand/soporteSistema';

export default function SistemaSoporte() {
    const {
        conversaciones,
        conversacionActivaId,
        mensajes,
        empresaNombreActiva,
        estadoActiva,
        loadingLista,
        loadingChat,
        enviando,
        cargarConversaciones,
        abrirConversacion,
        enviarMensaje,
        cerrarConversacionActiva,
    } = useSoporteSistemaStore();
    const [filtro, setFiltro] = useState<'ABIERTA' | 'CERRADA' | undefined>('ABIERTA');
    const [texto, setTexto] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        cargarConversaciones(filtro);
    }, [filtro, cargarConversaciones]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes.length]);

    const enviar = async () => {
        const t = texto.trim();
        if (!t || enviando) return;
        setTexto('');
        await enviarMensaje(t);
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-4">
            {/* Lista de consultas */}
            <div className="flex w-80 flex-none flex-col rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-gray-100 p-4 dark:border-slate-800">
                    <h2 className="font-bold text-gray-800 dark:text-white">Soporte a empresarios</h2>
                    <div className="mt-3 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-slate-800">
                        {(['ABIERTA', 'CERRADA'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFiltro(f)}
                                className={`flex-1 rounded-md py-1.5 text-xs font-bold transition ${filtro === f
                                        ? 'bg-white text-violet-600 shadow-sm dark:bg-slate-700 dark:text-violet-300'
                                        : 'text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                {f === 'ABIERTA' ? 'Abiertas' : 'Cerradas'}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loadingLista && (
                        <div className="flex items-center justify-center py-10 text-gray-400">
                            <Icon icon="eos-icons:loading" className="animate-spin" width={22} />
                        </div>
                    )}
                    {!loadingLista && conversaciones.length === 0 && (
                        <p className="px-4 py-10 text-center text-sm text-gray-400">Sin consultas {filtro === 'ABIERTA' ? 'abiertas' : 'cerradas'}</p>
                    )}
                    {conversaciones.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => abrirConversacion(c.id)}
                            className={`flex w-full flex-col gap-0.5 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800/50 ${conversacionActivaId === c.id ? 'bg-violet-50 dark:bg-violet-950/30' : ''
                                }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-sm font-bold text-gray-800 dark:text-white">{c.empresaNombre}</span>
                                {c.noLeidosSistema > 0 && (
                                    <span className="flex h-5 min-w-5 flex-none items-center justify-center rounded-full bg-violet-600 px-1.5 text-[10px] font-bold text-white">
                                        {c.noLeidosSistema}
                                    </span>
                                )}
                            </div>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{c.ultimoMensaje || 'Sin mensajes'}</p>
                            <span className="text-[10px] text-gray-400">
                                {formatDistanceToNow(new Date(c.actualizadoEn), { addSuffix: true, locale: es })}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Hilo de la conversación */}
            <div className="flex flex-1 flex-col rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                {!conversacionActivaId ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-gray-400">
                        <Icon icon="solar:chat-round-line-linear" width={40} />
                        <p className="text-sm">Elige una consulta para responder</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-slate-800">
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-white">{empresaNombreActiva}</h3>
                                <span
                                    className={`text-xs font-semibold ${estadoActiva === 'CERRADA' ? 'text-gray-400' : 'text-emerald-500'}`}
                                >
                                    {estadoActiva === 'CERRADA' ? 'Cerrada' : 'Abierta'}
                                </span>
                            </div>
                            {estadoActiva !== 'CERRADA' && (
                                <button
                                    onClick={cerrarConversacionActiva}
                                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-50 dark:border-slate-700 dark:text-gray-400 dark:hover:bg-slate-800"
                                >
                                    Cerrar consulta
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto bg-[#f6f7fb] px-5 py-4 dark:bg-[#0b0f17]">
                            {loadingChat ? (
                                <div className="flex items-center justify-center py-16 text-gray-400">
                                    <Icon icon="eos-icons:loading" className="animate-spin" width={24} />
                                </div>
                            ) : (
                                (() => {
                                    let lastDay: Date | null = null;
                                    return mensajes.map((m) => {
                                        const date = new Date(m.creadoEn);
                                        const esSistema = m.rol === 'SISTEMA';
                                        const showDay = !lastDay || !isSameDay(date, lastDay);
                                        lastDay = date;
                                        return (
                                            <div key={m.id}>
                                                {showDay && (
                                                    <div className="my-3 flex justify-center">
                                                        <span className="rounded-full bg-white px-3 py-0.5 text-[11px] font-medium text-gray-500 shadow-sm dark:bg-slate-800 dark:text-gray-400">
                                                            {format(date, "d 'de' MMMM", { locale: es })}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={`mt-1 flex ${esSistema ? 'justify-end' : 'justify-start'}`}>
                                                    <div
                                                        className={`max-w-[74%] px-3 py-2 text-sm shadow-sm ${esSistema
                                                                ? 'rounded-2xl rounded-br-md bg-gradient-to-br from-violet-600 to-violet-500 text-white'
                                                                : 'rounded-2xl rounded-bl-md bg-white text-gray-800 dark:bg-slate-800 dark:text-gray-100'
                                                            }`}
                                                    >
                                                        <p className="mb-0.5 text-[11px] font-bold opacity-80">{m.autorNombre}</p>
                                                        <p className="whitespace-pre-wrap break-words leading-relaxed">{m.contenido}</p>
                                                        <span className={`mt-1 block text-right text-[10px] ${esSistema ? 'text-violet-100/80' : 'text-gray-400'}`}>
                                                            {format(date, 'HH:mm')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()
                            )}
                            <div ref={bottomRef} />
                        </div>

                        <div className="flex items-end gap-2 border-t border-gray-100 p-3 dark:border-slate-800">
                            <textarea
                                value={texto}
                                onChange={(e) => setTexto(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        enviar();
                                    }
                                }}
                                placeholder="Responder…"
                                rows={1}
                                className="max-h-32 flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={enviar}
                                disabled={!texto.trim() || enviando}
                                className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-700 disabled:opacity-40"
                            >
                                <Icon icon={enviando ? 'solar:refresh-bold' : 'solar:plain-bold'} className={enviando ? 'animate-spin' : ''} width={18} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
