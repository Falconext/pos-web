import { useEffect } from 'react';

/**
 * Utilidades compartidas por los sliders del hero de las plantillas de tienda.
 *
 * - `resolveHeroIntervalMs`: lee del diseño el campo "Segundos entre slides"
 *   (`<prefijo>HeroInterval`) y lo convierte a ms. Vacío → valor por defecto de
 *   la plantilla; 0 → sin avance automático; mínimo 1 s.
 * - `usePreloadImages`: descarga por adelantado las imágenes de los slides para
 *   que el cambio de banner no muestre un hueco mientras carga la siguiente.
 */
export function resolveHeroIntervalMs(diseno: any, key: string, defaultMs: number): number {
  const raw = String(diseno?.[key] ?? '').trim().replace(',', '.');
  if (!raw) return defaultMs;
  const secs = Number(raw);
  if (!Number.isFinite(secs)) return defaultMs;
  if (secs <= 0) return 0;
  return Math.max(1000, Math.round(secs * 1000));
}

export function usePreloadImages(urls: Array<string | null | undefined>) {
  const signature = urls.filter(Boolean).join('|');
  useEffect(() => {
    if (!signature) return;
    signature.split('|').forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [signature]);
}

/** Campo de texto del editor para el intervalo del hero (mismo texto en todas las plantillas). */
export function heroIntervalField(key: string, group: string, defaultSecs: number) {
  return {
    key,
    label: 'Segundos entre slides',
    placeholder: String(defaultSecs),
    group,
    hint: 'Tiempo que se muestra cada banner antes de pasar al siguiente (mín. 1). Pon 0 para desactivar el avance automático.',
  };
}

/**
 * La clave del interruptor "ocultar" del slide N de una plantilla.
 *
 * Sigue la misma convención que las imágenes: `<prefijo>HeroImage`,
 * `<prefijo>Slide2Image`, `<prefijo>Slide3Image`.
 */
export const claveSlideOculto = (prefijo: string, indice: number) =>
  indice === 0 ? `${prefijo}HeroOculto` : `${prefijo}Slide${indice + 1}Oculto`;

const estaEncendido = (v: unknown) =>
  v === true || v === 'true' || v === '1' || v === 1 || v === 'on' || v === 'si';

/**
 * Los slides que el negocio realmente quiere mostrar.
 *
 * Las plantillas traen tres banners de ejemplo, y hasta ahora no había forma de
 * usar menos: quien tenía una sola foto quedaba obligado a inventar dos más o a
 * dejar las de muestra en su tienda.
 *
 * Nunca devuelve una lista vacía: si alguien oculta los tres, se conserva el
 * primero. Un hero en blanco se ve como una tienda rota, y el editor no avisa
 * de eso en el momento.
 */
export function slidesVisibles<T>(diseno: any, prefijo: string, slides: T[]): T[] {
  const visibles = slides.filter(
    (_, i) => !estaEncendido(diseno?.[claveSlideOculto(prefijo, i)]),
  );
  return visibles.length ? visibles : slides.slice(0, 1);
}

/** Campo del editor para ocultar un banner (mismo texto en todas las plantillas). */
export function heroSlideOcultoField(prefijo: string, indice: number, group: string) {
  return {
    key: claveSlideOculto(prefijo, indice),
    label: indice === 0 ? 'No mostrar este banner' : `No mostrar el banner ${indice + 1}`,
    type: 'toggle' as const,
    group,
    hint: 'Ocúltalo si no lo vas a usar. Si ocultas todos, se conserva el primero.',
  };
}
