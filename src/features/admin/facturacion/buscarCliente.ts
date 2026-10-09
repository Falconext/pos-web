/**
 * Búsqueda de clientes en el POS (crear comprobante).
 *
 * El vendedor tiene al cliente delante y escribe lo que recuerda: parte del
 * nombre, el documento, el celular o el apodo con el que lo tiene guardado.
 * Nada de eso coincide necesariamente con la razón social exacta, así que la
 * búsqueda tiene que perdonar tildes, mayúsculas y guiones.
 */

/** Minúsculas, sin tildes y sin espacios sobrantes, para comparar sin sorpresas. */
export const normalizeSearch = (value: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

/** Cuántas letras hay que escribir antes de empezar a sugerir. */
export const MIN_BUSQUEDA = 3;

/** Cuántos resultados se muestran: la lista va debajo del campo y no debe taparlo. */
export const MAX_RESULTADOS = 6;

export function filtrarClientes(items: any[], termino: string): any[] {
  const query = normalizeSearch(termino);
  if (query.length < MIN_BUSQUEDA) return [];
  const compactQuery = query.replace(/[^a-z0-9]/g, '');

  return (Array.isArray(items) ? items : [])
    .filter((client: any) => {
      const fullName = normalizeSearch(
        [
          client?.nombre,
          client?.apellidoPaterno,
          client?.apellidoMaterno,
          client?.razonSocial,
          // El alias se trata como una palabra más del nombre: quien escribe
          // "lucho" tiene que encontrar a "Panadería San Luis S.A.C.".
          client?.alias,
        ]
          .filter(Boolean)
          .join(' '),
      );
      const doc = String(client?.nroDoc || '').replace(/\D/g, '');
      const telefono = String(client?.telefono || '').replace(/\D/g, '');
      return (
        fullName.includes(query) ||
        doc.includes(compactQuery) ||
        normalizeSearch(client?.nroDoc).includes(query) ||
        // El teléfono pide 3 dígitos para no disparar con cualquier número
        // suelto que en realidad era parte de un documento.
        (compactQuery.length >= 3 && telefono.includes(compactQuery))
      );
    })
    .slice(0, MAX_RESULTADOS);
}
