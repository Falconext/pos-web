import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { get } from '@/utils/fetch';
import { LIMITE_DESCRIPCION, LIMITE_TITULO, recortar } from '@/lib/seoTienda/puntajeSeo';
import type { PaginaSeo } from '@/lib/seoTienda/inyectarSeo';

interface Props {
    formData: { slugTienda: string; descripcionTienda: string; seoTitulo: string; seoDescripcion: string; googleVerificacion: string };
    handleChange: (e: any) => void;
    nombreTienda: string;
}

const contador = (n: number, max: number, min: number) => (
    <span className={`tabular-nums text-xs ${n === 0 ? 'text-gray-400' : n > max ? 'text-rose-600' : n < min ? 'text-amber-600' : 'text-emerald-600'}`}>
        {n}/{max}
    </span>
);

/**
 * Tienda Virtual → Configuración → Google. Título y descripción de la portada
 * de la tienda (vacíos = automáticos) y la etiqueta de Search Console del
 * negocio, para que vea sus propias búsquedas sin pedir nada a Krezka.
 */
export default function TiendaSeoGoogle({ formData, handleChange, nombreTienda }: Props) {
    const [ayuda, setAyuda] = useState(false);
    // Lo que el sistema publica hoy (mismas reglas que verá Google): sirve de
    // vista previa cuando los campos están vacíos y avisa si la tienda no se indexa.
    const [publicado, setPublicado] = useState<PaginaSeo | null>(null);
    useEffect(() => {
        if (!formData.slugTienda) return;
        get<PaginaSeo>(`public/seo?path=${encodeURIComponent(`/tienda/${formData.slugTienda}`)}`).then((r) => {
            if (r.success && r.data) setPublicado(r.data);
        });
    }, [formData.slugTienda]);
    const nombre = nombreTienda || 'Tu tienda';
    const titulo = recortar(formData.seoTitulo || publicado?.titulo || `${nombre} | Tienda online`, LIMITE_TITULO);
    const descripcion = recortar(
        formData.seoDescripcion || publicado?.descripcion || formData.descripcionTienda || `${nombre}. Compra online o pide por WhatsApp.`,
        LIMITE_DESCRIPCION,
    );
    const noIndexada = publicado?.robots?.startsWith('noindex');
    const url = `${window.location.origin}/tienda/${formData.slugTienda || 'tu-tienda'}`;

    return (
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-transparent p-6" data-testid="tienda-seo">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <Icon icon="logos:google-icon" className="text-lg" />
                Google
            </h3>
            <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
                Cómo aparece tu tienda en Google y al compartir el enlace. Si lo dejas vacío, se arma solo con el nombre y la descripción de arriba.
                Cada producto tiene su propio bloque Google en su ficha.
            </p>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="space-y-4">
                    <label className="block">
                        <span className="mb-1 flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                            Título para Google {contador(formData.seoTitulo.length, LIMITE_TITULO, 30)}
                        </span>
                        <input
                            name="seoTitulo"
                            value={formData.seoTitulo}
                            onChange={handleChange}
                            maxLength={120}
                            placeholder={publicado?.titulo || `${nombre} | Tienda online`}
                            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </label>
                    <label className="block">
                        <span className="mb-1 flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                            Descripción para Google {contador(formData.seoDescripcion.length, LIMITE_DESCRIPCION, 110)}
                        </span>
                        <textarea
                            name="seoDescripcion"
                            value={formData.seoDescripcion}
                            onChange={handleChange}
                            maxLength={320}
                            rows={3}
                            placeholder="Qué vendes, dónde y por qué comprarte. Ej: Ramos de rosas y arreglos florales con entrega el mismo día en San Borja y Lima."
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </label>
                    <label className="block">
                        <span className="mb-1 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                            Verificación de Google Search Console (opcional)
                            <button type="button" onClick={() => setAyuda((a) => !a)} className="text-xs font-semibold text-blue-600 hover:underline">
                                {ayuda ? 'Ocultar pasos' : '¿Qué es esto?'}
                            </button>
                        </span>
                        <input
                            name="googleVerificacion"
                            value={formData.googleVerificacion}
                            onChange={handleChange}
                            maxLength={300}
                            placeholder='<meta name="google-site-verification" content="…" />'
                            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </label>
                    {ayuda && (
                        <ol className="list-decimal space-y-1 rounded-xl bg-gray-50 p-4 pl-8 text-xs text-gray-600 dark:bg-slate-800/50 dark:text-gray-300">
                            <li>Entra a <b>search.google.com/search-console</b> con tu cuenta de Google.</li>
                            <li>Agrega una propiedad de tipo <b>Prefijo de la URL</b> con: <span className="break-all font-mono">{url}/</span></li>
                            <li>Elige el método <b>Etiqueta HTML</b>, copia la etiqueta y pégala aquí. Guarda.</li>
                            <li>Vuelve a Search Console y pulsa <b>Verificar</b>. Desde ahí verás qué buscan los clientes que llegan a tu tienda.</li>
                        </ol>
                    )}
                </div>

                <div>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">Así se verá en Google</p>
                    <div className="rounded-xl border border-gray-200 p-4 dark:border-slate-700">
                        <p className="truncate text-xs text-emerald-700 dark:text-emerald-400">{url.replace(/^https?:\/\//, '').replace(/\//g, ' › ')}</p>
                        <p className="mt-1 text-lg leading-snug text-[#1a0dab] dark:text-sky-300">{titulo}</p>
                        <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{descripcion}</p>
                    </div>
                    {noIndexada ? (
                        <p className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200" data-testid="tienda-noindex">
                            <Icon icon="solar:danger-triangle-bold" width={16} className="mt-px shrink-0" />
                            Esta tienda está marcada como demo, prueba o inactiva: Google no la va a mostrar. El enlace sí funciona para compartir.
                        </p>
                    ) : (
                        <p className="mt-3 text-xs text-gray-400">
                            Google tarda unas semanas en mostrar los cambios. La vista previa de WhatsApp se actualiza en minutos.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
