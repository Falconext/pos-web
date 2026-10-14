/**
 * Comprar por caja cuando el stock se lleva en unidades.
 *
 * Pedido de la dueña de PURA VIDA: "yo compro en caja y vendo en unidades".
 * El sistema ya lo hacía al escanear el código de la caja, pero por el
 * desplegable de producto preguntaba la CANTIDAD EN UNIDADES mientras mostraba
 * el nombre del paquete: quien quería 2 cajas escribía "2" y compraba 2
 * unidades. Me pasó a mí probándolo antes de notarlo.
 *
 * Las cuentas que no pueden salir mal son dos: cuántas unidades entran al
 * almacén, y a qué costo queda cada una — porque contra ese costo se mide el
 * margen de cada venta suelta.
 */
import {
  costoUnitarioDesdePaquete,
  expandirPaqueteAUnidades,
  etiquetaDePaquete,
  desglosePorPaquete,
} from '../utils/compraPorPaquete';

// Caja de 6 cervezas a S/ 36 (precio final del proveedor, IGV incluido).
const CAJA = { costoPaqueteConIgv: 36, unidadesPorPaquete: 6 };

describe('de cajas a unidades', () => {
  it('5 cajas de 6 son 30 unidades', () => {
    const r = expandirPaqueteAUnidades({
      ...CAJA, paquetes: 5, esGravado: true, compraIncluyeIgv: true,
    });
    expect(r.cantidad).toBe(30);
    expect(r.paquetes).toBe(5);
  });

  it('con la compra en modo CON IGV, la unidad cuesta lo que dice la boleta', () => {
    // 36 / 6 = 6.00. Es la cuenta que ella verifica de cabeza.
    const r = expandirPaqueteAUnidades({
      ...CAJA, paquetes: 5, esGravado: true, compraIncluyeIgv: true,
    });
    expect(r.precioUnitario).toBeCloseTo(6, 4);
    expect(r.subtotal).toBeCloseTo(180, 2);
  });

  it('con la compra en modo NETO, se le saca el IGV al costo de la caja', () => {
    // 36 / 1.18 / 6 = 5.0847. El total con IGV sigue siendo 180.
    const r = expandirPaqueteAUnidades({
      ...CAJA, paquetes: 5, esGravado: true, compraIncluyeIgv: false,
    });
    expect(r.precioUnitario).toBeCloseTo(5.0847, 4);
    expect(r.subtotal * 1.18).toBeCloseTo(180, 1);
  });

  it('un producto EXONERADO no se divide entre 1.18 aunque la compra sea neta', () => {
    // Arroz, leche, pan: sin IGV. Dividirlos igual inventaría un costo menor
    // y un margen que no existe.
    const r = expandirPaqueteAUnidades({
      ...CAJA, paquetes: 5, esGravado: false, compraIncluyeIgv: false,
    });
    expect(r.precioUnitario).toBeCloseTo(6, 4);
  });

  it('guarda 4 decimales: redondear a 2 mueve el margen', () => {
    // Caja de 24 a S/ 100 → 4.1667 por unidad. A 4.17 la compra entera se
    // desvía y el costo del inventario deja de cuadrar.
    const r = expandirPaqueteAUnidades({
      paquetes: 1, costoPaqueteConIgv: 100, unidadesPorPaquete: 24,
      esGravado: true, compraIncluyeIgv: true,
    });
    expect(r.precioUnitario).toBeCloseTo(4.1667, 4);
  });

  it('cero cajas no rompe ni deja un costo raro', () => {
    const r = expandirPaqueteAUnidades({
      ...CAJA, paquetes: 0, esGravado: true, compraIncluyeIgv: true,
    });
    expect(r.cantidad).toBe(0);
    expect(r.subtotal).toBe(0);
  });

  it('un paquete mal configurado (0 unidades) se trata como 1, no divide entre cero', () => {
    const r = expandirPaqueteAUnidades({
      paquetes: 3, costoPaqueteConIgv: 36, unidadesPorPaquete: 0,
      esGravado: true, compraIncluyeIgv: true,
    });
    expect(r.cantidad).toBe(3);
    expect(Number.isFinite(r.precioUnitario)).toBe(true);
  });
});

describe('el rótulo de la línea', () => {
  it('lleva las cajas REALES, no un "1 paq." fijo', () => {
    // Queda así en el kardex y en el detalle de la compra: decir "1 paquete"
    // cuando entraron 5 es describir mal lo que se recibió.
    expect(etiquetaDePaquete('CERVEZA PILSEN', 5, 6)).toBe('CERVEZA PILSEN (5 paq. x6)');
  });

  it('una presentación de 1 unidad no ensucia la descripción', () => {
    expect(etiquetaDePaquete('CERVEZA PILSEN', 3, 1)).toBe('CERVEZA PILSEN');
  });
});

describe('el desglose que se muestra en pantalla', () => {
  it('va CON IGV, que es la moneda en la que está escrito el rótulo', () => {
    // El campo pide el costo "tal como sale en la boleta (IGV incluido)", así
    // que las cifras de al lado tienen que estar en esa misma moneda.
    const d = desglosePorPaquete(5, 36, 6);
    expect(d.unidades).toBe(30);
    expect(d.precioUnitarioConIgv).toBeCloseTo(6, 2);
    expect(d.total).toBeCloseTo(180, 2);
  });

  it('es la división directa, sin pasar por el modo IGV de la compra', () => {
    // Es lo que hacía que el escaneo mostrara S/ 6.00 y la fila manual S/ 5.08
    // para la misma caja: dos números distintos para la misma operación. La
    // primera versión de esta prueba comparaba la función consigo misma, que
    // es verdad siempre y no prueba nada.
    expect(desglosePorPaquete(5, 36, 6)).toEqual({
      unidades: 30,
      precioUnitarioConIgv: 6,
      total: 180,
    });
  });
});

describe('las dos funciones cuentan la misma historia', () => {
  it('el total mostrado es el que se termina pagando con IGV', () => {
    const mostrado = desglosePorPaquete(5, 36, 6);
    const guardado = expandirPaqueteAUnidades({
      ...CAJA, paquetes: 5, esGravado: true, compraIncluyeIgv: false,
    });
    expect(guardado.cantidad).toBe(mostrado.unidades);
    expect(guardado.subtotal * 1.18).toBeCloseTo(mostrado.total, 1);
  });
});

describe('costoUnitarioDesdePaquete por separado', () => {
  it('sin unidades devuelve 0 en vez de Infinity', () => {
    expect(costoUnitarioDesdePaquete(36, 0, { esGravado: true, compraIncluyeIgv: true })).toBe(0);
  });
});
