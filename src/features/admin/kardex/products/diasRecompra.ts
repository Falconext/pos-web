/**
 * Días de recompra para el backend: vacío = null (lo de la empresa), "0" = no
 * se recompra. Borrar el número manda null para que de verdad vuelva al valor
 * de la empresa.
 *
 * undefined (el campo nunca llegó al formulario, por ejemplo si se guarda
 * antes de que termine de cargar el producto completo) no se manda: mandar
 * null ahí borraría los días que el producto ya tenía.
 */
export const diasRecompraParaGuardar = (v: unknown): number | null | undefined => {
  if (v === undefined) return undefined;
  if (v === null || String(v).trim() === '') return null;
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 365) : null;
};
