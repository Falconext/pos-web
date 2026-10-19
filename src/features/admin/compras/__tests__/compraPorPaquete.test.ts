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
  ordenEnCajas,
  ordenDesdeCajas,
  lineaXmlSinIgv,
  precioOrdenConFactorIgv,
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

/**
 * La ORDEN de compra: pedirle al proveedor "5 cajas de 6", no "30 unidades".
 *
 * La orden guarda la cantidad en unidades igual que el stock —así recibirla no
 * convierte nada— pero en pantalla se escribe en cajas. Estas dos funciones
 * son la traducción, y tienen que ser inversas una de la otra: si no, abrir
 * una orden y guardarla sin tocar nada le cambiaría las cantidades.
 */
describe('la orden de compra, en cajas', () => {
  it('5 cajas de 6 a S/ 36 se guardan como 30 unidades a S/ 6', () => {
    expect(ordenDesdeCajas(5, 36, 6)).toEqual({ cantidad: 30, precioUnitario: 6 });
  });

  it('y se vuelven a leer como 5 cajas a S/ 36', () => {
    expect(ordenEnCajas(30, 6, 6)).toEqual({ cajas: 5, costoPorPaquete: 36 });
  });

  it('ida y vuelta no mueve la orden', () => {
    // Abrir una orden y guardarla sin tocar nada no puede cambiar lo pedido.
    const guardado = ordenDesdeCajas(5, 36, 6);
    const vista = ordenEnCajas(guardado.cantidad, guardado.precioUnitario, 6);
    expect(ordenDesdeCajas(vista.cajas, vista.costoPorPaquete, 6)).toEqual(guardado);
  });

  it('sin caja (pedido por unidad) no toca nada', () => {
    expect(ordenDesdeCajas(7, 12.5, null)).toEqual({ cantidad: 7, precioUnitario: 12.5 });
    expect(ordenEnCajas(7, 12.5, null)).toEqual({ cajas: 7, costoPorPaquete: 12.5 });
  });

  it('no mete el IGV de por medio: el precio ya está en el modo de la orden', () => {
    // A diferencia de la compra, acá dividir entre las unidades no cambia si
    // el precio es neto o con IGV: sigue siendo el mismo modo.
    expect(ordenDesdeCajas(1, 118, 2).precioUnitario).toBe(59);
  });

  it('guarda 4 decimales en el costo por unidad', () => {
    // Caja de 24 a S/ 100: a 2 decimales el total deja de cuadrar con el
    // proveedor.
    expect(ordenDesdeCajas(1, 100, 24).precioUnitario).toBeCloseTo(4.1667, 4);
  });
});

describe('cambiar de presentación en la orden', () => {
  /** Lo que hace la pantalla al elegir otra caja en una línea ya puesta. */
  const cambiarPresentacion = (
    linea: { cantidad: number; precioUnitario: number; unidadesPorPaquete?: number | null },
    unidadesNuevas: number,
  ) => {
    const { cajas } = ordenEnCajas(linea.cantidad, linea.precioUnitario, linea.unidadesPorPaquete);
    return {
      cantidad: cajas * unidadesNuevas,
      precioUnitario: linea.precioUnitario,
      unidadesPorPaquete: unidadesNuevas > 1 ? unidadesNuevas : null,
    };
  };

  it('de Unidad a caja de 6 NO cambia el costo por unidad', () => {
    // Conservar el costo del PAQUETE parece lo simétrico y está mal: S/ 5.08 la
    // unidad se tomaba como el precio de la caja y el costo por unidad caía a
    // S/ 0.85 sin que nadie lo tocara. Lo vi en pantalla antes de arreglarlo.
    const r = cambiarPresentacion({ cantidad: 1, precioUnitario: 5.08 }, 6);
    expect(r.precioUnitario).toBe(5.08);
    expect(r.cantidad).toBe(6);
  });

  it('conserva las cajas pedidas, no las unidades', () => {
    // 5 cajas de 6 y me paso a cajas de 12: sigo queriendo 5 cajas.
    const r = cambiarPresentacion({ cantidad: 30, precioUnitario: 6, unidadesPorPaquete: 6 }, 12);
    expect(r.cantidad).toBe(60);
    expect(r.precioUnitario).toBe(6);
  });

  it('volver a Unidad deja la línea en unidades sueltas', () => {
    const r = cambiarPresentacion({ cantidad: 30, precioUnitario: 6, unidadesPorPaquete: 6 }, 1);
    expect(r.cantidad).toBe(5);
    expect(r.unidadesPorPaquete).toBeNull();
  });
});

describe('lineaXmlSinIgv', () => {
    it('línea con valor e IGV 0 en el XML → sin IGV', () => {
        expect(lineaXmlSinIgv({ igv: 0, subtotal: 50 })).toBe(true);
    });
    it('línea con IGV → gravada', () => {
        expect(lineaXmlSinIgv({ igv: 18, subtotal: 100 })).toBe(false);
    });
    it('bonificación (valor 0) no decide', () => {
        expect(lineaXmlSinIgv({ igv: 0, subtotal: 0 })).toBe(false);
    });
    it('foto IA sin IGV por línea no decide', () => {
        expect(lineaXmlSinIgv({ subtotal: 50 })).toBe(false);
        expect(lineaXmlSinIgv(null)).toBe(false);
    });
});

describe('precioOrdenConFactorIgv', () => {
    it('línea por unidad: ida y vuelta vuelve al mismo precio', () => {
        const con = precioOrdenConFactorIgv(7.33, 1.18);
        expect(con).toBe(8.65);
        expect(precioOrdenConFactorIgv(con, 1 / 1.18)).toBe(7.33);
    });
    it('línea por caja: convierte el costo de la caja, no el unitario', () => {
        const unit = 4.1667; // caja de 12 a S/ 50.00
        const con = precioOrdenConFactorIgv(unit, 1.18, 12);
        expect(ordenEnCajas(24, con, 12).costoPorPaquete).toBe(59);
        const sin = precioOrdenConFactorIgv(con, 1 / 1.18, 12);
        expect(ordenEnCajas(24, sin, 12).costoPorPaquete).toBe(50);
    });
});
