/**
 * Fechas en la zona horaria del negocio (America/Lima).
 *
 * El backend devuelve las fechas en ISO/UTC. Cortarlas con `.slice(0, 10)` toma
 * el día UTC, y como Lima va 5 horas atrás, **toda venta posterior a las 19:00
 * hora Lima ya es del día siguiente en UTC**. Filtrar por ese texto hacía que
 * las ventas de la tarde-noche se contaran en el día equivocado y que las del
 * último día del mes se fueran al mes siguiente (a una vendedora se le caían 11
 * ventas del reporte de agosto por vender después de las 7 p.m. del día 31).
 *
 * 'en-CA' formatea como YYYY-MM-DD, que es el mismo formato con el que se
 * comparan los rangos `desde`/`hasta` y el que usa `parseRangeDates` en el
 * backend.
 */
const ZONA_NEGOCIO = 'America/Lima';

/** Día (YYYY-MM-DD) de una fecha ISO, en hora de Lima. */
export function diaLima(fechaIso: string | Date | null | undefined): string {
  if (!fechaIso) return '';
  const d = fechaIso instanceof Date ? fechaIso : new Date(fechaIso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-CA', { timeZone: ZONA_NEGOCIO });
}

/** Hoy (YYYY-MM-DD) en hora de Lima. */
export function hoyLima(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: ZONA_NEGOCIO });
}

/** `true` si la fecha cae dentro del rango [desde, hasta], ambos YYYY-MM-DD. */
export function dentroDelRangoLima(
  fechaIso: string | Date | null | undefined,
  desde: string,
  hasta: string,
): boolean {
  const dia = diaLima(fechaIso);
  if (!dia) return false;
  return dia >= desde && dia <= hasta;
}
