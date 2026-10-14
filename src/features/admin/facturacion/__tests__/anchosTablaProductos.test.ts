/**
 * Anchos de la tabla de productos del comprobante impreso.
 *
 * Esto nació de un defecto que arreglé mal: ajusté el reparto mirando solo la
 * hoja A4 y lo dejé fijo, sin notar que A5 usa la MISMA plantilla. Como los
 * títulos miden lo mismo en píxeles en las dos hojas y la tabla de A5 es un 31%
 * más angosta (678px contra 467px, medido en pantalla), en A5 la palabra
 * "MONEDA" caía en 35px útiles y se montaba sobre P.UNIT. — el mismo defecto
 * que había corregido en A4, reaparecido en la otra hoja.
 *
 * jsdom no calcula posiciones, así que lo que se puede defender acá es la
 * aritmética y los mínimos que salieron de medir en el navegador. Los píxeles
 * concretos están verificados en pantalla y anotados en cada caso.
 */
import { anchosTablaProductos, sumaAnchos } from '../utils/anchosTablaProductos';

/** Ancho de la tabla en pantalla, medido con la vista de impresión abierta. */
const ANCHO_TABLA: Record<string, number> = { A4: 678, A5: 467 };

/**
 * Lo que necesita cada columna, en píxeles, con la fuente de 12px que usan las
 * dos hojas. Es el MAYOR entre el título y el dato más ancho.
 */
const NECESITA: Record<string, number> = {
  codigo: 108,        // W69S55BOC700S, el código más largo del cliente
  cantidad: 34,       // la palabra "CANT."
  unidad: 42,         // la palabra "UNIDAD"
  moneda: 49,         // la palabra "MONEDA", más ancha que "S/"
  precioUnitario: 40, // "P.UNIT."
  total: 35,          // "TOTAL"
};
const PADDING = 2;

describe.each(['A4', 'A5'])('reparto de la hoja %s', (hoja) => {
  it.each([false, true])('suma 100%% (con imágenes: %s)', (conImagenes) => {
    // Dejar una columna sin ancho hace que el navegador le dé lo que sobre, y
    // así la descripción se partía en seis líneas y el documento crecía.
    expect(sumaAnchos(anchosTablaProductos(hoja, conImagenes), conImagenes)).toBe(100);
  });

  it('ninguna columna angosta queda por debajo de su título', () => {
    const a = anchosTablaProductos(hoja, false);
    const tabla = ANCHO_TABLA[hoja];
    const cortas = Object.entries(NECESITA)
      .map(([col, necesita]) => {
        const util = (tabla * (a as any)[col]) / 100 - PADDING;
        return { col, util: Math.round(util), necesita, entra: util >= necesita };
      })
      .filter((x) => !x.entra);
    expect(cortas).toEqual([]);
  });

  it('la descripción se queda con el resto, y es la columna más ancha', () => {
    const a = anchosTablaProductos(hoja, false);
    const otras = [a.codigo, a.cantidad, a.unidad, a.moneda, a.precioUnitario, a.total];
    expect(a.descripcion).toBeGreaterThan(Math.max(...otras));
  });
});

describe('A5 no hereda el reparto de A4', () => {
  it('le da más porcentaje a MONEDA, que es donde se rompía', () => {
    // 8% de 678 = 54px alcanza; 8% de 467 = 37px no, y la palabra se salía.
    expect(anchosTablaProductos('A5', false).moneda)
      .toBeGreaterThan(anchosTablaProductos('A4', false).moneda);
  });

  it('y más a CÓDIGO, que si no corta el código del producto', () => {
    expect(anchosTablaProductos('A5', false).codigo)
      .toBeGreaterThan(anchosTablaProductos('A4', false).codigo);
  });

  it('a costa de la descripción, que es la única que puede envolver', () => {
    expect(anchosTablaProductos('A5', false).descripcion)
      .toBeLessThan(anchosTablaProductos('A4', false).descripcion);
  });
});

describe('qué hoja cae en cada reparto', () => {
  it('"a5" en minúscula también es A5', () => {
    expect(anchosTablaProductos('a5', false)).toEqual(anchosTablaProductos('A5', false));
  });

  it('cualquier otra cosa usa el reparto ancho', () => {
    // TICKET tiene su propia plantilla y no llega acá; si llegara, que no
    // reparta como A5 —que es más angosta— sino como la hoja completa.
    expect(anchosTablaProductos('TICKET', false)).toEqual(anchosTablaProductos('A4', false));
    expect(anchosTablaProductos('', false)).toEqual(anchosTablaProductos('A4', false));
  });
});
