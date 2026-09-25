/**
 * Las fechas del kit van y vienen entre el calendario (DD/MM/YYYY) y la API
 * (YYYY-MM-DD). Antes se desarmaba la cadena a ciegas, así que al borrar la
 * fecha —o mientras se escribía a medias— quedaba "undefined-undefined-": el
 * campo mostraba "/undefined/undefined" y guardar fallaba con "fechaFin must be
 * a valid ISO 8601 date string". Una fecha incompleta ahora simplemente no se
 * guarda, que es lo que significa un campo opcional vacío.
 */
export const aIso = (fecha?: string): string => {
  const [d, m, y] = (fecha || '').split('/');
  return d && m && y ? `${y}-${m}-${d}` : '';
};

export const aDiaMesAnio = (iso?: string): string => {
  const [y, m, d] = (iso || '').split('T')[0].split('-');
  return d && m && y ? `${d}/${m}/${y}` : '';
};
