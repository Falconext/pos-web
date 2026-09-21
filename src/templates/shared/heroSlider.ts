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
