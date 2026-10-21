import React, { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';
import { useAuthStore } from '@/zustand/auth';
import {
    LIMITE_DESCRIPCION,
    LIMITE_TITULO,
    chequeosSeo,
    descripcionEfectiva,
    puntajeSeo,
    tituloEfectivo,
} from '@/lib/seoTienda/puntajeSeo';
import { useProductModalViewModel } from '../useProductModalViewModel';

type ViewProps = ReturnType<typeof useProductModalViewModel>;

const COLOR_NIVEL = {
    bien: { anillo: 'text-emerald-500', chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', texto: 'Bien' },
    mejorable: { anillo: 'text-amber-500', chip: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', texto: 'Mejorable' },
    bajo: { anillo: 'text-rose-500', chip: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300', texto: 'Bajo' },
} as const;

/**
 * Bloque "Google" de la ficha de producto: lo que Rank Math hace en WordPress,
 * dentro del sistema y sin código. Palabra clave, título y descripción para
 * Google (vacíos = automáticos), sugerencia con IA, vista previa de Google y
 * WhatsApp, y un puntaje con lo que falta.
 */
export const ProductSeoGoogle: React.FC<{ vm: ViewProps }> = ({ vm }) => {
    const { productSections, formValues, setFormValues } = vm;
    const { auth } = useAuthStore();
    const [abierto, setAbierto] = useState(false);
    const [sugiriendo, setSugiriendo] = useState(false);

    const fv = formValues as any;
    const nombreTienda: string = (auth as any)?.empresa?.nombreComercial || (auth as any)?.empresa?.razonSocial || 'Tu tienda';
    const fotos = (vm.previewPrincipal || fv.imagenUrl ? 1 : 0) + (Array.isArray(vm.galleryPreviews) ? vm.galleryPreviews.length : 0);

    const datos = useMemo(
        () => ({
            nombre: String(fv.descripcion || 'Producto'),
            nombreTienda,
            precio: Number(fv.precioUnitario) || null,
            categoria: fv.categoriaNombre || null,
            descripcionLarga: fv.descripcionLarga || '',
            seoTitulo: fv.seoTitulo || '',
            seoDescripcion: fv.seoDescripcion || '',
            seoPalabraClave: fv.seoPalabraClave || '',
            cantidadFotos: fotos,
        }),
        [fv.descripcion, fv.precioUnitario, fv.categoriaNombre, fv.descripcionLarga, fv.seoTitulo, fv.seoDescripcion, fv.seoPalabraClave, fotos, nombreTienda],
    );
    const { puntaje, nivel } = puntajeSeo(datos);
    const chequeos = chequeosSeo(datos);
    const titulo = tituloEfectivo(datos);
    const descripcion = descripcionEfectiva(datos);
    const slug = (auth as any)?.empresa?.slugTienda || 'tu-tienda';
    const color = COLOR_NIVEL[nivel];

    if (!productSections.ecommerce) return null;

    const cambiar = (campo: 'seoTitulo' | 'seoDescripcion' | 'seoPalabraClave', valor: string) =>
        setFormValues({ ...formValues, [campo]: valor } as any);

    const sugerir = async () => {
        if (!String(fv.descripcion || '').trim()) {
            useAlertStore.getState().alert('Escribe primero el nombre del producto', 'warning');
            return;
        }
        setSugiriendo(true);
        try {
            const resp = await apiClient.post('/productos/ia/seo', {
                nombre: fv.descripcion,
                categoria: fv.categoriaNombre || undefined,
                marca: fv.marcaNombre || undefined,
                descripcionLarga: fv.descripcionLarga || undefined,
                precio: Number(fv.precioUnitario) || undefined,
                palabraClave: fv.seoPalabraClave || undefined,
            });
            const r = resp.data?.data || resp.data;
            if (!r?.success || !r?.data) {
                useAlertStore.getState().alert(r?.message || 'La IA no pudo sugerir esta vez', 'info');
                return;
            }
            const s = r.data;
            // La descripción del producto solo se completa si estaba vacía o muy corta:
            // nunca se pisa un texto que el negocio ya escribió.
            const largaActual = String(fv.descripcionLarga || '').replace(/<[^>]*>/g, ' ').trim();
            const completarLarga = s.descripcionLarga && largaActual.split(/\s+/).filter(Boolean).length < 30;
            setFormValues({
                ...formValues,
                seoPalabraClave: s.palabraClave || fv.seoPalabraClave || '',
                seoTitulo: s.titulo || '',
                seoDescripcion: s.descripcion || '',
                ...(completarLarga
                    ? { descripcionLarga: String(s.descripcionLarga).split(/\n{2,}/).map((p: string) => `<p>${p.trim()}</p>`).join('') }
                    : {}),
            } as any);
            useAlertStore
                .getState()
                .alert(completarLarga ? 'Listo: revisa el texto y la nueva descripción del producto' : 'Listo: revisa el texto antes de guardar', 'success');
        } catch {
            useAlertStore.getState().alert('La IA no respondió, inténtalo de nuevo', 'error');
        } finally {
            setSugiriendo(false);
        }
    };

    const contador = (n: number, max: number, min: number) => (
        <span className={`tabular-nums ${n === 0 ? 'text-gray-400' : n > max ? 'text-rose-600' : n < min ? 'text-amber-600' : 'text-emerald-600'}`}>
            {n}/{max}
        </span>
    );

    return (
        <div className="mt-4 mb-4" data-testid="producto-seo">
            <div className={`rounded-2xl border overflow-hidden transition-all ${abierto ? 'border-sky-200 dark:border-sky-900/40' : 'border-gray-200 dark:border-slate-700 hover:border-sky-200'}`}>
                <button type="button" onClick={() => setAbierto((o) => !o)} className="w-full flex items-center justify-between gap-3 p-4 text-left bg-white dark:bg-[#1E2435]">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="relative h-10 w-10 shrink-0">
                            <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90">
                                <circle cx="18" cy="18" r="15" fill="none" className="stroke-gray-200 dark:stroke-slate-700" strokeWidth="4" />
                                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className={color.anillo} strokeWidth="4" strokeDasharray={`${(puntaje / 100) * 94.2} 94.2`} strokeLinecap="round" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-gray-800 dark:text-white tabular-nums">{puntaje}</span>
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                Google <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${color.chip}`}>{color.texto}</span>
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Cómo aparece este producto en Google y al compartirlo por WhatsApp</p>
                        </div>
                    </div>
                    <Icon icon={abierto ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'} width={18} className="text-gray-400 shrink-0" />
                </button>

                {abierto && (
                    <div className="space-y-4 border-t border-gray-100 p-4 dark:border-slate-700 bg-white dark:bg-[#1E2435]">
                        <button
                            type="button"
                            onClick={sugerir}
                            disabled={sugiriendo}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                            data-testid="seo-sugerir"
                        >
                            <Icon icon={sugiriendo ? 'eos-icons:loading' : 'solar:magic-stick-3-bold-duotone'} width={18} />
                            {sugiriendo ? 'Escribiendo…' : 'Sugerir con IA'}
                        </button>

                        <label className="block">
                            <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">Palabra clave</span>
                            <input
                                value={fv.seoPalabraClave || ''}
                                onChange={(e) => cambiar('seoPalabraClave', e.target.value)}
                                maxLength={80}
                                placeholder="ej. ramo de rosas a domicilio"
                                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                data-testid="seo-palabra"
                            />
                            <span className="mt-1 block text-[11px] text-gray-400">Lo que escribiría un cliente en Google para encontrar este producto.</span>
                        </label>

                        <label className="block">
                            <span className="mb-1 flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-300">
                                Título para Google {contador((fv.seoTitulo || '').length, LIMITE_TITULO, 30)}
                            </span>
                            <input
                                value={fv.seoTitulo || ''}
                                onChange={(e) => cambiar('seoTitulo', e.target.value)}
                                maxLength={120}
                                placeholder={tituloEfectivo({ ...datos, seoTitulo: '' })}
                                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                data-testid="seo-titulo"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1 flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-300">
                                Descripción para Google {contador((fv.seoDescripcion || '').length, LIMITE_DESCRIPCION, 110)}
                            </span>
                            <textarea
                                value={fv.seoDescripcion || ''}
                                onChange={(e) => cambiar('seoDescripcion', e.target.value)}
                                maxLength={320}
                                rows={3}
                                placeholder={descripcionEfectiva({ ...datos, seoDescripcion: '' })}
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                data-testid="seo-descripcion"
                            />
                            <span className="mt-1 block text-[11px] text-gray-400">Vacío = el sistema lo arma solo con el nombre, la categoría y el precio.</span>
                        </label>

                        <div>
                            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">Así se verá en Google</p>
                            <div className="rounded-xl border border-gray-200 p-3 dark:border-slate-700" data-testid="seo-vista-google">
                                <p className="truncate text-xs text-emerald-700 dark:text-emerald-400">{window.location.host} › tienda › {slug} › producto</p>
                                <p className="mt-0.5 text-base leading-snug text-[#1a0dab] dark:text-sky-300">{titulo}</p>
                                <p className="mt-0.5 text-xs leading-relaxed text-gray-600 dark:text-gray-400">{descripcion}</p>
                            </div>
                        </div>

                        <div>
                            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">Así se verá en WhatsApp</p>
                            <div className="flex gap-3 rounded-xl bg-[#e7fbe9] p-2.5 dark:bg-emerald-950/30">
                                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white/70 dark:bg-slate-800">
                                    {(vm.previewPrincipal || fv.imagenUrlDisplay || fv.imagenUrl) ? (
                                        <img src={vm.previewPrincipal || fv.imagenUrlDisplay || fv.imagenUrl} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-[10px] text-gray-400">sin foto</div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">{titulo}</p>
                                    <p className="line-clamp-2 text-xs text-gray-600 dark:text-gray-400">{descripcion}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">Qué revisa Google</p>
                            <ul className="space-y-1.5" data-testid="seo-chequeos">
                                {chequeos.map((c) => (
                                    <li key={c.id} className="flex items-start gap-2 text-xs">
                                        <Icon icon={c.ok ? 'solar:check-circle-bold' : 'solar:close-circle-bold'} width={16} className={`mt-px shrink-0 ${c.ok ? 'text-emerald-500' : 'text-rose-400'}`} />
                                        <span className={c.ok ? 'text-gray-600 dark:text-gray-300' : 'text-gray-800 dark:text-gray-100'}>
                                            {c.texto}
                                            {!c.ok && c.ayuda && <span className="block text-[11px] text-gray-400">{c.ayuda}</span>}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
