import { useEffect, useRef, useState } from 'react';
import {
    TEXTO_DESPLIEGUE,
    TEXTO_HORARIO,
    dentroDeHorario,
    proximaAtencion,
} from './soporteHorario';
import { Icon } from '@iconify/react';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useSoporteStore } from '@/zustand/soporte';
import { Adjunto, BotonesAdjunto, VistaPreviaImagen, imagenPegada, imagenSoltada, textoSinMarca } from './soporte/AdjuntosSoporte';
import {
    PREGUNTAS_SOPORTE,
    TEMAS_SOPORTE,
    buscarPreguntas,
    type PreguntaSoporte,
    type TemaSoporte,
} from '@/data/preguntasSoporte';

function etiquetaDia(d: Date): string {
    if (isToday(d)) return 'Hoy';
    if (isYesterday(d)) return 'Ayer';
    return format(d, "d 'de' MMMM", { locale: es });
}

/**
 * Pestaña Ayuda: el banco de preguntas frecuentes. Resuelve lo de siempre sin
 * esperar al equipo; si no alcanza, "Escribir al equipo" pasa al chat con la
 * pregunta ya escrita.
 */
function Ayuda({
    abierta,
    onAbrir,
    onEscribir,
    onIr,
}: {
    abierta: PreguntaSoporte | null;
    onAbrir: (p: PreguntaSoporte | null) => void;
    onEscribir: (texto: string) => void;
    onIr: (ruta: string) => void;
}) {
    const [busqueda, setBusqueda] = useState('');
    const [tema, setTema] = useState<TemaSoporte | null>(null);

    if (abierta) {
        return (
            <div className="flex-1 overflow-y-auto bg-[#f6f7fb] px-3.5 py-3 dark:bg-[#0b0f17]">
                <button
                    type="button"
                    onClick={() => onAbrir(null)}
                    className="mb-2 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-300"
                >
                    <Icon icon="solar:alt-arrow-left-linear" width={14} /> Volver
                </button>
                <div className="rounded-2xl bg-white p-3.5 shadow-sm dark:bg-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-violet-500">{abierta.tema}</p>
                    <h4 className="mt-0.5 text-[14px] font-bold text-gray-900 dark:text-white">{abierta.pregunta}</h4>
                    <p className="mt-2 text-[13px] leading-relaxed text-gray-700 dark:text-gray-200">{abierta.respuesta}</p>
                    {abierta.pasos && (
                        <ol className="mt-2.5 space-y-1.5">
                            {abierta.pasos.map((paso, i) => (
                                <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-gray-700 dark:text-gray-200">
                                    <span className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
                                        {i + 1}
                                    </span>
                                    {paso}
                                </li>
                            ))}
                        </ol>
                    )}
                    {abierta.ruta && (
                        <button
                            type="button"
                            onClick={() => onIr(abierta.ruta!)}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-[12px] font-bold text-white hover:bg-violet-700"
                        >
                            <Icon icon="solar:square-top-down-linear" width={14} /> Ir ahí
                        </button>
                    )}
                </div>
                <div className="mt-3 rounded-2xl border border-dashed border-gray-200 p-3 text-center dark:border-slate-700">
                    <p className="text-[12px] text-gray-500 dark:text-gray-400">¿No se resolvió?</p>
                    <button
                        type="button"
                        onClick={() => onEscribir(abierta.pregunta)}
                        className="mt-1 text-[12px] font-bold text-violet-600 hover:text-violet-700 dark:text-violet-300"
                    >
                        Escribir al equipo de Krezka
                    </button>
                </div>
            </div>
        );
    }

    const resultados = busqueda.trim()
        ? buscarPreguntas(busqueda, 8)
        : PREGUNTAS_SOPORTE.filter((p) => !tema || p.tema === tema);

    return (
        <div className="flex flex-1 flex-col overflow-hidden bg-[#f6f7fb] dark:bg-[#0b0f17]">
            <div className="px-3.5 pt-3">
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                    <Icon icon="solar:magnifer-linear" width={15} className="text-gray-400" />
                    <input
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Busca tu duda: anular boleta, caja…"
                        className="w-full border-0 bg-transparent p-0 text-[13px] shadow-none outline-none focus:outline-none focus:ring-0 dark:text-white"
                    />
                </div>
                {!busqueda.trim() && (
                    <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                        {TEMAS_SOPORTE.map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setTema((actual) => (actual === t ? null : t))}
                                className={`flex-none rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                    tema === t
                                        ? 'bg-violet-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-violet-50 dark:bg-slate-800 dark:text-gray-300'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex-1 space-y-1.5 overflow-y-auto px-3.5 py-2">
                {resultados.map((p) => (
                    <button
                        key={p.id}
                        type="button"
                        onClick={() => onAbrir(p)}
                        className="flex w-full items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-left text-[12.5px] font-medium text-gray-800 shadow-sm hover:bg-violet-50 dark:bg-slate-800 dark:text-gray-100 dark:hover:bg-slate-700"
                    >
                        <span className="flex-1">{p.pregunta}</span>
                        <Icon icon="solar:alt-arrow-right-linear" width={14} className="flex-none text-gray-400" />
                    </button>
                ))}
                {busqueda.trim() && resultados.length === 0 && (
                    <div className="px-2 py-6 text-center">
                        <p className="text-[12px] text-gray-500 dark:text-gray-400">No encontramos esa duda en las preguntas frecuentes.</p>
                        <button
                            type="button"
                            onClick={() => onEscribir(busqueda.trim())}
                            className="mt-1.5 text-[12px] font-bold text-violet-600 hover:text-violet-700 dark:text-violet-300"
                        >
                            Escribir al equipo de Krezka
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
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
    const { mensajes, loading, enviando, error, cargarMensajes, enviarMensaje, enviarAdjunto, consultarNoLeidos } = useSoporteStore();
    const bottomRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    // Primero la ayuda: la mayoría de las dudas ya tienen respuesta y no hace
    // falta esperar a una persona. Con mensajes sin leer se abre el chat.
    const [vista, setVista] = useState<'ayuda' | 'chat'>('ayuda');
    const [preguntaAbierta, setPreguntaAbierta] = useState<PreguntaSoporte | null>(null);
    // Mientras escribe en el chat, la respuesta que ya existe, por si le sirve.
    const sugeridas = vista === 'chat' && texto.trim().split(/\s+/).length >= 2 ? buscarPreguntas(texto, 2) : [];

    // Se revisa cada minuto: si dejan el chat abierto y dan las 6, el aviso
    // tiene que cambiar solo, no quedarse diciendo "estamos atendiendo".
    const [enHorario, setEnHorario] = useState(dentroDeHorario);
    const [proxima, setProxima] = useState(proximaAtencion);
    // Cada minuto: si dejan el chat abierto y dan las 6, el aviso cambia solo
    // en vez de quedarse diciendo que hay alguien del otro lado.
    useEffect(() => {
        const id = setInterval(() => {
            setEnHorario(dentroDeHorario());
            setProxima(proximaAtencion());
        }, 60_000);
        return () => clearInterval(id);
    }, []);

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
        setVista(noLeidos > 0 ? 'chat' : 'ayuda');
        setNoLeidos(0);
        cargarMensajes();
    };

    const escribirAlEquipo = (inicial: string) => {
        setPreguntaAbierta(null);
        setVista('chat');
        setTexto(inicial);
    };

    const verPregunta = (p: PreguntaSoporte) => {
        setPreguntaAbierta(p);
        setVista('ayuda');
    };

    const irA = (ruta: string) => {
        setAbierto(false);
        navigate(ruta);
    };

    // Foto elegida, pegada o soltada que espera el botón enviar (como en WhatsApp).
    const [imagen, setImagen] = useState<File | null>(null);

    const enviar = async () => {
        const t = texto.trim();
        if (enviando) return;
        if (imagen) {
            // La foto se lleva lo escrito como pie: captura y explicación llegan juntas.
            if (await enviarAdjunto('imagen', imagen, t)) {
                setImagen(null);
                setTexto('');
            }
            return;
        }
        if (!t) return;
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
                            {/* El subtítulo dice el estado real en vez de una frase fija:
                                es el lugar más visible y no cuesta espacio. */}
                            <p className="flex items-center gap-1.5 text-[11px] text-violet-100/90">
                                <span
                                    className={`h-1.5 w-1.5 flex-none rounded-full ${
                                        enHorario ? 'bg-emerald-300' : 'bg-violet-300/60'
                                    }`}
                                />
                                {enHorario ? 'En línea ahora' : `Volvemos ${proxima}`}
                            </p>
                        </div>
                        <button onClick={() => setAbierto(false)} className="rounded-lg p-1 hover:bg-white/10">
                            <Icon icon="solar:close-circle-bold" width={20} />
                        </button>
                    </div>

                    <div className="flex border-b border-gray-100 bg-white text-[12px] font-bold dark:border-slate-800 dark:bg-slate-900">
                        {(['ayuda', 'chat'] as const).map((v) => (
                            <button
                                key={v}
                                type="button"
                                onClick={() => setVista(v)}
                                className={`flex-1 py-2 ${
                                    vista === v
                                        ? 'border-b-2 border-violet-600 text-violet-700 dark:text-violet-300'
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                }`}
                            >
                                {v === 'ayuda' ? 'Preguntas frecuentes' : 'Chat con el equipo'}
                            </button>
                        ))}
                    </div>

                    {vista === 'ayuda' ? (
                        <Ayuda
                            abierta={preguntaAbierta}
                            onAbrir={setPreguntaAbierta}
                            onEscribir={escribirAlEquipo}
                            onIr={irA}
                        />
                    ) : (
                    <>

                    <div className="flex-1 overflow-y-auto bg-[#f6f7fb] px-3.5 py-3 dark:bg-[#0b0f17]">
                        {loading && mensajes.length === 0 && (
                            <div className="flex items-center justify-center py-14 text-gray-400">
                                <Icon icon="eos-icons:loading" className="animate-spin" width={22} />
                            </div>
                        )}
                        {!loading && mensajes.length === 0 && (
                            <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-gray-400">
                                <Icon icon="solar:chat-round-line-linear" width={28} />
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Cuéntanos en qué te podemos ayudar
                                </p>
                                {/* El horario completo se muestra donde hay lugar y sirve:
                                    la primera vez, antes de escribir nada. */}
                                <p className="text-[11px] leading-relaxed text-gray-400">
                                    {TEXTO_HORARIO}
                                </p>
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
                                                <Adjunto imagenUrl={m.imagenUrl} audioUrl={m.audioUrl} />
                                                {(m.imagenUrl || m.audioUrl ? textoSinMarca(m.contenido) : m.contenido) && (
                                                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                                                        {m.imagenUrl || m.audioUrl ? textoSinMarca(m.contenido) : m.contenido}
                                                    </p>
                                                )}
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

                    {/* La promesa de despliegue vive acá, pegada al momento en que
                        el empresario va a pedir algo. Discreta a propósito: importa,
                        pero no tiene que competir con la conversación. */}
                    <div className="border-t border-gray-100 px-3.5 pb-1 pt-2 text-[10px] leading-snug text-gray-400 dark:border-slate-800">
                        {TEXTO_DESPLIEGUE}
                    </div>

                    {sugeridas.length > 0 && (
                        <div className="border-t border-gray-100 px-3 pt-2 dark:border-slate-800">
                            <p className="text-[10px] font-semibold text-gray-400">Quizás ya tiene respuesta:</p>
                            {sugeridas.map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => verPregunta(p)}
                                    className="mt-1 flex w-full items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-left text-[12px] font-medium text-violet-800 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-200"
                                >
                                    <Icon icon="solar:lightbulb-linear" width={13} className="flex-none" />
                                    {p.pregunta}
                                </button>
                            ))}
                        </div>
                    )}

                    {imagen && <VistaPreviaImagen archivo={imagen} onQuitar={() => setImagen(null)} />}
                    <div
                        className="flex items-end gap-1 px-2.5 pb-2.5 pt-1"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            const soltada = imagenSoltada(e);
                            if (soltada) {
                                e.preventDefault();
                                setImagen(soltada);
                            }
                        }}
                    >
                        <BotonesAdjunto
                            deshabilitado={enviando}
                            onImagen={setImagen}
                            onAudio={(archivo) => enviarAdjunto('audio', archivo)}
                        />
                        <textarea
                            onPaste={(e) => {
                                const pegada = imagenPegada(e);
                                if (pegada) {
                                    e.preventDefault();
                                    setImagen(pegada);
                                }
                            }}
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
                            disabled={(!texto.trim() && !imagen) || enviando}
                            className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-700 disabled:opacity-40"
                        >
                            <Icon icon={enviando ? 'solar:refresh-bold' : 'solar:plain-bold'} className={enviando ? 'animate-spin' : ''} width={16} />
                        </button>
                    </div>
                    </>
                    )}
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
