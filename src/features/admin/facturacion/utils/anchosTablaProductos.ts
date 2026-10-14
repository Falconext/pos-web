/**
 * Anchos de las columnas de la tabla de productos del comprobante impreso.
 *
 * Por qué no pueden ser los mismos porcentajes en A4 y en A5: los TÍTULOS miden
 * lo mismo en píxeles en las dos hojas —la fuente no cambia— pero la tabla de
 * A5 es un 31% más angosta (medido: 678px en A4, 467px en A5). Con el reparto
 * de A4, en A5 la palabra "MONEDA" (49px) caía en una celda de 35px útiles y se
 * montaba sobre P.UNIT.: el mismo defecto que se corrigió en A4, reaparecido en
 * la otra hoja. Lo mismo, más chico, en CANT. y UNIDAD.
 *
 * El ancho de cada columna angosta lo manda el MAYOR entre su título y su dato:
 * "MONEDA" es más largo que "S/", y el código de producto más largo del cliente
 * (W69S55BOC700S, 13 caracteres) mide 108px y es más ancho que la palabra
 * "CÓDIGO". La descripción se queda con lo que sobra, que es lo correcto:
 * envuelve en varias líneas sin romper nada.
 *
 * TICKET no pasa por acá: tiene su propia plantilla de una sola columna.
 */
export type TamanoHoja = 'A4' | 'A5' | 'TICKET' | string;

export interface AnchosTabla {
  codigo: number;
  cantidad: number;
  unidad: number;
  imagen: number;
  descripcion: number;
  moneda: number;
  precioUnitario: number;
  total: number;
}

/** A5: la hoja angosta necesita más porcentaje para lo mismo. */
const A5_SIN_IMAGEN: AnchosTabla = {
  codigo: 24, cantidad: 8, unidad: 10, imagen: 0,
  descripcion: 26, moneda: 12, precioUnitario: 10, total: 10,
};
const A5_CON_IMAGEN: AnchosTabla = { ...A5_SIN_IMAGEN, imagen: 9, descripcion: 17 };

/** A4: la hoja ancha puede darle casi la mitad a la descripción. */
const A4_SIN_IMAGEN: AnchosTabla = {
  codigo: 18, cantidad: 6, unidad: 7, imagen: 0,
  descripcion: 43, moneda: 8, precioUnitario: 9, total: 9,
};
const A4_CON_IMAGEN: AnchosTabla = { ...A4_SIN_IMAGEN, imagen: 9, descripcion: 34 };

export const anchosTablaProductos = (
  tamano: TamanoHoja,
  conImagenes: boolean,
): AnchosTabla => {
  const esA5 = String(tamano).toUpperCase() === 'A5';
  if (esA5) return conImagenes ? A5_CON_IMAGEN : A5_SIN_IMAGEN;
  return conImagenes ? A4_CON_IMAGEN : A4_SIN_IMAGEN;
};

/** Lo que suman las columnas visibles. Debe dar 100: una columna sin ancho se
 *  queda con lo que sobre, y ahí la descripción se partía en seis líneas. */
export const sumaAnchos = (a: AnchosTabla, conImagenes: boolean): number =>
  a.codigo + a.cantidad + a.unidad + (conImagenes ? a.imagen : 0) +
  a.descripcion + a.moneda + a.precioUnitario + a.total;
