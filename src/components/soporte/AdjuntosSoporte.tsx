import { useRef } from 'react';
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

/** Foto o reproductor dentro del globo del mensaje. */
export function Adjunto({ imagenUrl, audioUrl }: { imagenUrl?: string | null; audioUrl?: string | null }) {
    if (imagenUrl) {
        return (
            <a href={imagenUrl} target="_blank" rel="noopener noreferrer" className="mb-1 block">
                <img src={imagenUrl} alt="Imagen enviada" className="max-h-56 w-full rounded-xl object-cover" loading="lazy" />
            </a>
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
