import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSoporteSistemaStore, type FichaEmpresaSoporte } from '@/zustand/soporteSistema';
import { fueVisto, tipoDeArchivo } from '@/zustand/soporte';
import { Link } from 'react-router-dom';
import { PREGUNTAS_SOPORTE } from '@/data/preguntasSoporte';
import { Adjunto, BotonesAdjunto, VistaPreviaImagen, usePegadoAlFinal, imagenPegada, imagenSoltada, textoSinMarca } from '@/components/soporte/AdjuntosSoporte';

/**
 * Respuestas guardadas del equipo: se eligen escribiendo "/" en la respuesta.
 * Las de las preguntas frecuentes salen del mismo banco que ve el empresario,
 * así lo que se contesta acá no se aparta de lo que dice la ayuda.
 */
const RESPUESTAS_GUARDADAS: { titulo: string; texto: string }[] = [
    { titulo: 'Saludo', texto: '¡Hola! Soy del equipo de Krezka, gracias por escribirnos. Ya reviso tu consulta.' },
    { titulo: 'Lo revisamos', texto: 'Lo estamos revisando y te escribimos por aquí apenas lo tengamos.' },
    { titulo: 'Pedir captura', texto: '¿Nos puedes mandar una captura de la pantalla donde te sale el problema? Así lo vemos más rápido.' },
    { titulo: 'Se sube hoy', texto: 'Listo, ya quedó. El cambio se sube al cierre del día; mañana ya lo ves en tu sistema.' },
    { titulo: 'Cierre', texto: '¿Te podemos ayudar en algo más? Cualquier cosa, nos escribes por aquí.' },
    ...PREGUNTAS_SOPORTE.map((p) => ({
        titulo: p.pregunta,
        texto: [p.respuesta, ...(p.pasos ?? []).map((paso, i) => `${i + 1}. ${paso}`)].join('\n'),
    })),
];

const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

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
        enviarAdjunto,
        cerrarConversacionActiva,
        leidoPorEmpresaEn,
        ficha,
    } = useSoporteSistemaStore();
    // Panel con los datos de la empresa, como el "Info. del contacto" de WhatsApp.
    const [verFicha, setVerFicha] = useState(true);
    const [filtro, setFiltro] = useState<'ABIERTA' | 'CERRADA' | undefined>('ABIERTA');
    const [texto, setTexto] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);
    // "/anular" filtra las respuestas guardadas; elegir una reemplaza el texto.
    const atajo = texto.startsWith('/') ? normalizar(texto.slice(1).trim()) : null;
    const guardadas =
        atajo === null
            ? []
            : RESPUESTAS_GUARDADAS.filter((r) => !atajo || normalizar(`${r.titulo} ${r.texto}`).includes(atajo)).slice(0, 8);

    useEffect(() => {
        cargarConversaciones(filtro);
    }, [filtro, cargarConversaciones]);

    // Pegado al último mensaje (ver usePegadoAlFinal); se rearma al cambiar de consulta.
    const irAlFinal = usePegadoAlFinal(bottomRef, Boolean(conversacionActivaId) && !loadingChat);

    // Foto elegida, pegada o soltada que espera el botón enviar (como en WhatsApp).
    const [imagen, setImagen] = useState<File | null>(null);
    useEffect(() => setImagen(null), [conversacionActivaId]);

    // Como en WhatsApp: el cuadro se limpia y el mensaje aparece al instante.
    const enviar = () => {
        const t = texto.trim();
        if (imagen) {
            enviarAdjunto(tipoDeArchivo(imagen), imagen, t.startsWith('/') ? '' : t);
            setImagen(null);
            setTexto('');
            irAlFinal();
            return;
        }
        if (!t) return;
        setTexto('');
        enviarMensaje(t);
        irAlFinal();
    };

    // Alto hasta el borde inferior de la ventana, como WhatsApp Web: se mide
    // dónde empieza la bandeja y se le da el resto de la pantalla.
    const marcoRef = useRef<HTMLDivElement>(null);
    const [alto, setAlto] = useState<number>();
    useLayoutEffect(() => {
        const medir = () => {
            const el = marcoRef.current;
            if (!el) return;
            // Con el zoom del panel (p. ej. 90 %) el rectángulo viene en píxeles de
            // pantalla y el alto se aplica sin zoom: se convierte con la escala real.
            const caja = el.getBoundingClientRect();
            const escala = el.offsetWidth ? caja.width / el.offsetWidth : 1;
            // 20 = el margen inferior del contenedor de la página (p-5).
            setAlto(Math.max(420, (window.innerHeight - caja.top) / escala - 20));
        };
        medir();
        window.addEventListener('resize', medir);
        return () => window.removeEventListener('resize', medir);
    }, []);

    const textoDe = (m: (typeof mensajes)[number]) =>
        m.imagenUrl || m.audioUrl || m.archivoUrl ? textoSinMarca(m.contenido) : m.contenido;

    return (
        <div
            ref={marcoRef}
            style={{ height: alto }}
            className="flex overflow-hidden rounded-xl border border-[#e9edef] bg-white shadow-sm dark:border-[#222d34] dark:bg-[#111b21]"
        >
            {/* Lista de consultas */}
            <div className="flex w-[340px] flex-none flex-col border-r border-[#e9edef] bg-white dark:border-[#222d34] dark:bg-[#111b21]">
                <div className="bg-[#f0f2f5] px-4 pb-3 pt-4 dark:bg-[#202c33]">
                    <h2 className="text-[17px] font-bold text-[#111b21] dark:text-[#e9edef]">Soporte a empresarios</h2>
                    <div className="mt-3 flex gap-2">
                        {(['ABIERTA', 'CERRADA'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFiltro(f)}
                                className={`rounded-full px-3 py-1 text-[13px] font-medium transition ${
                                    filtro === f
                                        ? 'bg-[#d9fdd3] text-[#008069] dark:bg-[#0a332c] dark:text-[#00a884]'
                                        : 'bg-white text-[#54656f] hover:bg-[#e9edef] dark:bg-[#111b21] dark:text-[#8696a0]'
                                }`}
                            >
                                {f === 'ABIERTA' ? 'Abiertas' : 'Cerradas'}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loadingLista && conversaciones.length === 0 && (
                        <div className="flex items-center justify-center py-10 text-[#8696a0]">
                            <Icon icon="eos-icons:loading" className="animate-spin" width={22} />
                        </div>
                    )}
                    {!loadingLista && conversaciones.length === 0 && (
                        <p className="px-4 py-10 text-center text-sm text-[#667781]">Sin consultas {filtro === 'ABIERTA' ? 'abiertas' : 'cerradas'}</p>
                    )}
                    {conversaciones.map((c) => {
                        const activa = conversacionActivaId === c.id;
                        const sinLeer = c.noLeidosSistema > 0;
                        return (
                            <button
                                key={c.id}
                                onClick={() => abrirConversacion(c.id)}
                                className={`flex w-full items-center gap-3 px-3 text-left transition ${
                                    activa ? 'bg-[#f0f2f5] dark:bg-[#2a3942]' : 'hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]'
                                }`}
                            >
                                <Avatar nombre={c.empresaNombre} />
                                <div className="min-w-0 flex-1 border-b border-[#e9edef] py-3 dark:border-[#222d34]">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <span className="truncate text-[15px] text-[#111b21] dark:text-[#e9edef]">{c.empresaNombre}</span>
                                        <span className={`flex-none text-[12px] ${sinLeer ? 'font-medium text-[#1fa855]' : 'text-[#667781]'}`}>
                                            {horaDeLista(c.actualizadoEn)}
                                        </span>
                                    </div>
                                    <div className="mt-0.5 flex items-center justify-between gap-2">
                                        <p className="truncate text-[13px] text-[#667781] dark:text-[#8696a0]">{c.ultimoMensaje || 'Sin mensajes'}</p>
                                        {sinLeer && (
                                            <span className="flex h-5 min-w-5 flex-none items-center justify-center rounded-full bg-[#25d366] px-1.5 text-[11px] font-bold text-white">
                                                {c.noLeidosSistema}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Hilo de la conversación */}
            <div className="flex min-w-0 flex-1 flex-col">
                {!conversacionActivaId ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 border-b-[6px] border-[#25d366] bg-[#f0f2f5] text-[#667781] dark:bg-[#222e35] dark:text-[#8696a0]">
                        <Icon icon="solar:chat-round-dots-linear" width={56} className="text-[#aebac1]" />
                        <p className="text-[22px] font-light text-[#41525d] dark:text-[#e9edef]">Soporte Krezka</p>
                        <p className="text-sm">Elige una consulta para responder.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 border-l border-[#e9edef] bg-[#f0f2f5] px-4 py-2.5 dark:border-[#222d34] dark:bg-[#202c33]">
                            <Avatar nombre={empresaNombreActiva ?? ''} chico />
                            <div className="min-w-0 flex-1">
                                <h3 className="truncate text-[16px] text-[#111b21] dark:text-[#e9edef]">{empresaNombreActiva}</h3>
                                <span className="text-[13px] text-[#667781] dark:text-[#8696a0]">
                                    {estadoActiva === 'CERRADA' ? 'Consulta cerrada' : 'Consulta abierta'}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setVerFicha((v) => !v)}
                                className={`rounded-full p-2 text-[#54656f] hover:bg-[#e9edef] dark:text-[#aebac1] dark:hover:bg-[#2a3942] ${verFicha ? 'bg-[#e9edef] dark:bg-[#2a3942]' : ''}`}
                                title="Datos de la empresa"
                            >
                                <Icon icon="solar:info-circle-linear" width={20} />
                            </button>
                            {estadoActiva !== 'CERRADA' && (
                                <button
                                    onClick={cerrarConversacionActiva}
                                    className="rounded-full px-3 py-1.5 text-[13px] font-medium text-[#008069] hover:bg-[#e9edef] dark:text-[#00a884] dark:hover:bg-[#2a3942]"
                                >
                                    Cerrar consulta
                                </button>
                            )}
                        </div>

                        {/* Fondo del chat: beige de WhatsApp con un punteado suave (sin su dibujo, que es de ellos). */}
                        <div className="flex-1 overflow-y-auto bg-[#efeae2] bg-[radial-gradient(rgba(0,0,0,0.035)_1px,transparent_1px)] [background-size:18px_18px] px-[6%] py-4 dark:bg-[#0b141a] dark:bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)]">
                            {loadingChat ? (
                                <div className="flex items-center justify-center py-16 text-[#8696a0]">
                                    <Icon icon="eos-icons:loading" className="animate-spin" width={24} />
                                </div>
                            ) : (
                                (() => {
                                    let lastDay: Date | null = null;
                                    let rolAnterior: string | null = null;
                                    return mensajes.map((m) => {
                                        const date = new Date(m.creadoEn);
                                        const esSistema = m.rol === 'SISTEMA';
                                        const showDay = !lastDay || !isSameDay(date, lastDay);
                                        // Como WhatsApp: la "colita" y el nombre solo en el primero de una racha.
                                        const primero = showDay || rolAnterior !== m.rol;
                                        lastDay = date;
                                        rolAnterior = m.rol;
                                        const texto = textoDe(m);
                                        return (
                                            <div key={m.id}>
                                                {showDay && (
                                                    <div className="my-3 flex justify-center">
                                                        <span className="rounded-lg bg-white px-3 py-1 text-[12.5px] text-[#54656f] shadow-[0_1px_0.5px_rgba(11,20,26,.13)] dark:bg-[#182229] dark:text-[#8696a0]">
                                                            {etiquetaDeDia(date)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={`flex ${esSistema ? 'justify-end' : 'justify-start'} ${primero ? 'mt-3' : 'mt-0.5'}`}>
                                                    <div
                                                        className={`relative max-w-[65%] rounded-lg px-2 pb-1.5 pt-1.5 text-[14.2px] text-[#111b21] shadow-[0_1px_0.5px_rgba(11,20,26,.13)] dark:text-[#e9edef] ${
                                                            esSistema ? 'bg-[#d9fdd3] dark:bg-[#005c4b]' : 'bg-white dark:bg-[#202c33]'
                                                        } ${primero ? (esSistema ? 'rounded-tr-none' : 'rounded-tl-none') : ''} ${m.fallido ? 'opacity-70' : ''}`}
                                                    >
                                                        {primero && (
                                                            <span
                                                                aria-hidden
                                                                className={`absolute top-0 h-0 w-0 border-t-[8px] ${
                                                                    esSistema
                                                                        ? '-right-[7px] border-r-[8px] border-r-transparent border-t-[#d9fdd3] dark:border-t-[#005c4b]'
                                                                        : '-left-[7px] border-l-[8px] border-l-transparent border-t-white dark:border-t-[#202c33]'
                                                                }`}
                                                            />
                                                        )}
                                                        {primero && (
                                                            <p className={`mb-0.5 px-1 text-[12.8px] font-medium ${esSistema ? 'text-[#1fa855]' : 'text-[#7f66ff]'}`}>
                                                                {m.autorNombre}
                                                            </p>
                                                        )}
                                                        <div className="px-1">
                                                            <Adjunto imagenUrl={m.imagenUrl} audioUrl={m.audioUrl} archivoUrl={m.archivoUrl} archivoNombre={m.archivoNombre} />
                                                        </div>
                                                        <div className="flex flex-wrap items-end justify-end gap-x-2 px-1">
                                                            {texto && <p className="mr-auto whitespace-pre-wrap break-words leading-[19px]">{texto}</p>}
                                                            <span className="ml-auto flex items-center gap-0.5 text-[11px] leading-4 text-[#667781] dark:text-[#8696a0]">
                                                                {format(date, 'HH:mm')}
                                                                {m.pendiente && <Icon icon="solar:clock-circle-linear" width={12} />}
                                                                {/* ✓ enviado; ✓✓ azul cuando el empresario ya lo vio. */}
                                                                {esSistema && !m.pendiente && !m.fallido && (
                                                                    fueVisto(m.creadoEn, leidoPorEmpresaEn) ? (
                                                                        <Icon icon="mdi:check-all" width={15} className="text-[#53bdeb]" />
                                                                    ) : (
                                                                        <Icon icon="mdi:check" width={15} className="text-[#8696a0]" />
                                                                    )
                                                                )}
                                                            </span>
                                                        </div>
                                                        {m.fallido && <p className="px-1 text-[11px] font-medium text-[#ea0038]">No se envió</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {guardadas.length > 0 && (
                            <div className="max-h-56 overflow-y-auto border-t border-[#e9edef] bg-white py-1 dark:border-[#222d34] dark:bg-[#111b21]">
                                {guardadas.map((r) => (
                                    <button
                                        key={r.titulo}
                                        type="button"
                                        onClick={() => setTexto(r.texto)}
                                        className="block w-full px-4 py-2 text-left hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]"
                                    >
                                        <p className="text-[13px] font-medium text-[#111b21] dark:text-[#e9edef]">{r.titulo}</p>
                                        <p className="truncate text-[12px] text-[#667781]">{r.texto}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                        {imagen && <VistaPreviaImagen archivo={imagen} onQuitar={() => setImagen(null)} />}
                        <div
                            className="flex items-end gap-1 bg-[#f0f2f5] px-3 py-2.5 dark:bg-[#202c33]"
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
                                deshabilitado={false}
                                onImagen={setImagen}
                                onAudio={(archivo) => {
                                    enviarAdjunto('audio', archivo);
                                    irAlFinal();
                                }}
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
                                        // Con la lista de guardadas abierta, Enter elige la primera.
                                        if (guardadas.length) setTexto(guardadas[0].texto);
                                        else enviar();
                                    }
                                }}
                                placeholder="Escribe un mensaje  ·  / para respuestas guardadas"
                                rows={1}
                                className="max-h-32 flex-1 resize-none rounded-lg border-0 bg-white px-3 py-[9px] text-[15px] text-[#111b21] shadow-none outline-none placeholder:text-[#8696a0] focus:ring-0 dark:bg-[#2a3942] dark:text-[#e9edef]"
                            />
                            <button
                                type="button"
                                onClick={enviar}
                                disabled={!texto.trim() && !imagen}
                                className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#00a884] text-white transition hover:bg-[#008f72] disabled:bg-transparent disabled:text-[#8696a0]"
                                title="Enviar"
                            >
                                <Icon icon={enviando ? 'solar:refresh-bold' : 'solar:plain-bold'} className={enviando ? 'animate-spin' : ''} width={20} />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {conversacionActivaId && verFicha && ficha && <FichaEmpresa ficha={ficha} />}
        </div>
    );
}

/**
 * Datos de la empresa al costado del chat: para ayudar sin ir a buscarlos.
 * "Ver en Empresas" abre la lista ya filtrada por su RUC.
 */
function FichaEmpresa({ ficha }: { ficha: FichaEmpresaSoporte }) {
    const vence = ficha.vence ? new Date(ficha.vence) : null;
    const dias = vence ? Math.ceil((vence.getTime() - Date.now()) / 86_400_000) : null;
    const Fila = ({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) => (
        <div className="py-2">
            <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">{etiqueta}</p>
            <div className="text-[14px] text-[#111b21] dark:text-[#e9edef]">{valor}</div>
        </div>
    );
    return (
        <aside className="hidden w-[300px] flex-none flex-col overflow-y-auto border-l border-[#e9edef] bg-white xl:flex dark:border-[#222d34] dark:bg-[#111b21]">
            <div className="flex flex-col items-center gap-2 bg-[#f0f2f5] px-4 pb-5 pt-6 text-center dark:bg-[#202c33]">
                <Avatar nombre={ficha.nombreComercial || ficha.razonSocial} />
                <p className="text-[16px] font-medium text-[#111b21] dark:text-[#e9edef]">{ficha.nombreComercial || ficha.razonSocial}</p>
                <p className="text-[13px] text-[#667781]">RUC {ficha.ruc}</p>
                <Link
                    to={`/administrador/empresas?buscar=${encodeURIComponent(ficha.ruc)}`}
                    className="mt-1 rounded-full border border-[#d1d7db] px-3 py-1 text-[13px] font-medium text-[#008069] hover:bg-white dark:border-[#2a3942] dark:text-[#00a884]"
                >
                    Ver en Empresas
                </Link>
            </div>
            <div className="divide-y divide-[#e9edef] px-4 dark:divide-[#222d34]">
                <Fila etiqueta="Razón social" valor={ficha.razonSocial} />
                <Fila etiqueta="Plan" valor={ficha.plan ?? '—'} />
                <Fila
                    etiqueta="Vence"
                    valor={
                        vence ? (
                            <span className={dias !== null && dias <= 7 ? 'font-medium text-[#ea0038]' : ''}>
                                {format(vence, 'dd/MM/yyyy')}
                                {dias !== null && <span className="text-[12px] text-[#667781]"> · {dias < 0 ? `venció hace ${-dias} d` : `en ${dias} d`}</span>}
                            </span>
                        ) : (
                            '—'
                        )
                    }
                />
                <Fila etiqueta="Estado" valor={ficha.estado === 'ACTIVO' ? 'Activa' : ficha.estado} />
                {ficha.rubro && <Fila etiqueta="Rubro" valor={ficha.rubro} />}
                {ficha.escribieron.length > 0 && <Fila etiqueta="Escribieron" valor={ficha.escribieron.join(', ')} />}
                {ficha.administradores.length > 0 && (
                    <div className="py-2">
                        <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">Administradores</p>
                        {ficha.administradores.map((a) => (
                            <div key={a.email} className="mt-1.5">
                                <p className="text-[14px] text-[#111b21] dark:text-[#e9edef]">{a.nombre}</p>
                                <p className="truncate text-[12px] text-[#667781]">{a.email}</p>
                                {a.celular && (
                                    <a
                                        href={`https://wa.me/${a.celular.replace(/\D/g, '').replace(/^9/, '519')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[12px] font-medium text-[#008069] hover:underline dark:text-[#00a884]"
                                    >
                                        <Icon icon="mdi:whatsapp" width={14} /> {a.celular}
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
}

/** Iniciales en un círculo gris, como el avatar por defecto de WhatsApp. */
function Avatar({ nombre, chico }: { nombre: string; chico?: boolean }) {
    const iniciales =
        nombre
            .replace(/S\.?A\.?C\.?|E\.?I\.?R\.?L\.?|S\.?R\.?L\.?/gi, '')
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((p) => p[0])
            .join('')
            .toUpperCase() || '?';
    return (
        <span
            className={`flex flex-none items-center justify-center rounded-full bg-[#dfe5e7] font-semibold text-[#54656f] dark:bg-[#6a7175] dark:text-[#e9edef] ${
                chico ? 'h-10 w-10 text-[14px]' : 'h-[49px] w-[49px] text-[16px]'
            }`}
        >
            {iniciales}
        </span>
    );
}

/** Hora en la lista como WhatsApp: hoy "14:05", ayer "Ayer", antes la fecha. */
function horaDeLista(iso: string) {
    const d = new Date(iso);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return 'Ayer';
    return format(d, 'dd/MM/yyyy');
}

function etiquetaDeDia(d: Date) {
    if (isToday(d)) return 'Hoy';
    if (isYesterday(d)) return 'Ayer';
    return format(d, "d 'de' MMMM", { locale: es });
}
