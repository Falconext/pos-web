import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import useAlertStore from '@/zustand/alert';
import { formatoDuracion, MAX_SEGUNDOS_NOTA, useGrabadoraNota } from '@/features/admin/leads/notaDeVoz';

/**
 * Fotos y notas de voz del chat de soporte, compartidas por el widget del
 * empresario y la bandeja del equipo de Krezka.
 */

/** "[Imagen] pie" → "pie"; "[Nota de voz]" → "". La marca es para la lista y el asistente. */
export const textoSinMarca = (contenido: string) =>
    contenido.replace(/^\[(Imagen|Nota de voz)\]\s*/, '');

/**
 * La foto en grande, encima de todo y en la misma pantalla (como WhatsApp):
 * se cierra con la X, con Esc o tocando afuera.
 */
function VisorImagen({ url, onCerrar }: { url: string; onCerrar: () => void }) {
    useEffect(() => {
        const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
        window.addEventListener('keydown', alTeclear);
        return () => window.removeEventListener('keydown', alTeclear);
    }, [onCerrar]);
    return createPortal(
        <div
            className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            onClick={onCerrar}
            role="dialog"
            aria-label="Imagen en grande"
        >
            <div className="absolute right-4 top-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                <a
                    href={url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                    title="Descargar"
                >
                    <Icon icon="solar:download-minimalistic-linear" width={20} />
                </a>
                <button
                    type="button"
                    onClick={onCerrar}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                    title="Cerrar (Esc)"
                >
                    <Icon icon="solar:close-circle-linear" width={22} />
                </button>
            </div>
            <img
                src={url}
                alt="Imagen en grande"
                onClick={(e) => e.stopPropagation()}
                className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
            />
        </div>,
        document.body,
    );
}

/** Foto o reproductor dentro del globo del mensaje. */
export function Adjunto({ imagenUrl, audioUrl }: { imagenUrl?: string | null; audioUrl?: string | null }) {
    const [enGrande, setEnGrande] = useState(false);
    if (imagenUrl) {
        return (
            <>
                <button type="button" onClick={() => setEnGrande(true)} className="mb-1 block w-full cursor-zoom-in" title="Ver en grande">
                    <img src={imagenUrl} alt="Imagen enviada" className="max-h-56 w-full rounded-xl object-cover" loading="lazy" />
                </button>
                {enGrande && <VisorImagen url={imagenUrl} onCerrar={() => setEnGrande(false)} />}
            </>
        );
    }
    if (audioUrl) return <audio controls preload="metadata" src={audioUrl} className="mb-1 h-9 w-56 max-w-full" />;
    return null;
}

/**
 * Botones de clip (foto) y micrófono (nota de voz). Mientras graba, el
 * micrófono se vuelve un contador con "cancelar" y "enviar".
 */
export function BotonesAdjunto({
    deshabilitado,
    onImagen,
    onAudio,
}: {
    deshabilitado?: boolean;
    onImagen: (archivo: File) => void;
    onAudio: (archivo: File) => void;
}) {
    const input = useRef<HTMLInputElement>(null);
    const grabadora = useGrabadoraNota((mensaje) => useAlertStore.getState().alert(mensaje, 'error'));

    const terminar = async () => {
        const nota = await grabadora.detener();
        if (nota) onAudio(nota.archivo);
    };

    if (grabadora.grabando || grabadora.pendiente) {
        return (
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-[12px] font-semibold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
                Grabando {formatoDuracion(grabadora.segundos)} / {formatoDuracion(MAX_SEGUNDOS_NOTA)}
                <button type="button" onClick={grabadora.cancelar} className="ml-auto rounded-lg p-1 hover:bg-rose-100 dark:hover:bg-rose-900/40" title="Cancelar">
                    <Icon icon="solar:trash-bin-minimalistic-linear" width={16} />
                </button>
                <button type="button" onClick={terminar} className="rounded-lg bg-rose-600 p-1.5 text-white hover:bg-rose-700" title="Enviar nota de voz">
                    <Icon icon="solar:plain-bold" width={14} />
                </button>
            </div>
        );
    }

    return (
        <>
            <input
                ref={input}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const archivo = e.target.files?.[0];
                    e.target.value = '';
                    if (archivo) onImagen(archivo);
                }}
            />
            <button
                type="button"
                disabled={deshabilitado}
                onClick={() => input.current?.click()}
                className="flex h-9 w-9 flex-none items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-slate-800"
                title="Enviar una foto o captura"
            >
                <Icon icon="solar:gallery-add-linear" width={18} />
            </button>
            <button
                type="button"
                disabled={deshabilitado}
                onClick={() => grabadora.empezar()}
                className="flex h-9 w-9 flex-none items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-slate-800"
                title="Grabar una nota de voz"
            >
                <Icon icon="solar:microphone-3-linear" width={18} />
            </button>
        </>
    );
}

/** Imagen pegada con Ctrl/Cmd+V en el cuadro de texto (una captura de pantalla). */
export const imagenPegada = (e: React.ClipboardEvent): File | null => {
    for (const item of Array.from(e.clipboardData?.items ?? [])) {
        if (item.kind === 'file' && item.type.startsWith('image/')) return item.getAsFile();
    }
    return null;
};

/** Imagen soltada sobre el chat (arrastrar y soltar, como en WhatsApp Web). */
export const imagenSoltada = (e: React.DragEvent): File | null =>
    Array.from(e.dataTransfer?.files ?? []).find((f) => f.type.startsWith('image/')) ?? null;

/**
 * La foto elegida o pegada, antes de enviarla: como en WhatsApp, primero se ve
 * y se puede escribir el mensaje que la acompaña; se manda con el botón enviar.
 */
export function VistaPreviaImagen({ archivo, onQuitar }: { archivo: File; onQuitar: () => void }) {
    const url = useMemo(() => URL.createObjectURL(archivo), [archivo]);
    useEffect(() => () => URL.revokeObjectURL(url), [url]);
    return (
        <div className="flex items-center gap-2.5 border-t border-gray-100 px-3 pt-2 dark:border-slate-800">
            <div className="relative">
                <img src={url} alt="Imagen a enviar" className="h-16 w-16 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-slate-700" />
                <button
                    type="button"
                    onClick={onQuitar}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white shadow hover:bg-black"
                    title="Quitar imagen"
                >
                    <Icon icon="solar:close-circle-bold" width={14} />
                </button>
            </div>
            <p className="text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                Escribe un mensaje si quieres y pulsa enviar.
            </p>
        </div>
    );
}

/**
 * Mantiene el chat pegado al último mensaje, como WhatsApp.
 *
 * Bajar cuando cambia la cantidad de mensajes no alcanzaba: la foto y el
 * reproductor de audio terminan de cargar DESPUÉS y empujan el contenido, y la
 * vista quedaba a mitad de la conversación. Esto vigila el alto del chat y, si
 * el que lee estaba abajo (o acaba de enviar), lo vuelve a llevar al final.
 * Si subió a leer algo viejo, no lo mueve.
 */
export function usePegadoAlFinal(finalRef: React.RefObject<HTMLDivElement | null>, activo = true) {
    const pegado = useRef(true);
    useEffect(() => {
        const caja = finalRef.current?.parentElement;
        if (!caja || !activo) return;
        const alFinal = () => {
            caja.scrollTop = caja.scrollHeight;
        };
        const alDesplazar = () => {
            pegado.current = caja.scrollHeight - caja.scrollTop - caja.clientHeight < 80;
        };
        const siPegado = () => pegado.current && alFinal();
        caja.addEventListener('scroll', alDesplazar, { passive: true });
        // `load` de fotos y `loadedmetadata` de audios no burbujean: se escuchan en captura.
        caja.addEventListener('load', siPegado, true);
        caja.addEventListener('loadedmetadata', siPegado, true);
        const observador = new MutationObserver(siPegado);
        observador.observe(caja, { childList: true, subtree: true });
        pegado.current = true;
        alFinal();
        return () => {
            caja.removeEventListener('scroll', alDesplazar);
            caja.removeEventListener('load', siPegado, true);
            caja.removeEventListener('loadedmetadata', siPegado, true);
            observador.disconnect();
        };
    }, [finalRef, activo]);
    /** Al enviar: siempre al final, aunque estuviera leyendo arriba. */
    return () => {
        pegado.current = true;
        const caja = finalRef.current?.parentElement;
        if (caja) caja.scrollTop = caja.scrollHeight;
    };
}
