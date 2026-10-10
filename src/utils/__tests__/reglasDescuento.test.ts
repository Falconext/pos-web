/**
 * D2 — el descuento del carrito.
 *
 * Lo que de verdad hay que proteger: que dé EXACTAMENTE lo mismo que el
 * backend. Si el carrito dice S/ 127 y la IA dice S/ 137 por los mismos
 * productos, el cliente deja de creerle a los dos.
 *
 * Por eso los casos son los mismos que los del test de backend, con los
 * mismos números.
 */
import {
  calcularDescuento,
  enlaceDePedido,
  mensajeDePedido,
  soles,
  type ReglasDescuento,
} from '../reglasDescuento';

/** Los tramos de Hierba Sana, tal como los sirve el backend. */
const REGLAS: ReglasDescuento = {
  precioUnitarioMinimo: 20,
  envioCuentaEnTotal: true,
  tramos: [
    { descuento: 10, unidades: 3, totalMayorQue: 90 },
    { descuento: 20, unidades: 5, totalMayorQue: 170 },
    { descuento: 30, unidades: 7, totalMayorQue: 250 },
  ],
};

describe('el carrito calcula lo mismo que el backend', () => {
  it('el ejemplo del documento del cliente: 2×31 + 1×60 + envío 10 → −10', () => {
    const r = calcularDescuento(
      [
        { precioUnitario: 31, cantidad: 2 },
        { precioUnitario: 60, cantidad: 1 },
      ],
      10,
      REGLAS,
    );
    expect(r.subtotal).toBe(122);
    expect(r.total).toBe(132);
    expect(r.unidadesValidas).toBe(3);
    expect(r.descuento).toBe(10);
    expect(r.montoAPagar).toBe(122);
  });

  it('solo aplica el escalón más alto, no los suma', () => {
    const r = calcularDescuento([{ precioUnitario: 45, cantidad: 7 }], 15, REGLAS);
    expect(r.total).toBe(330);
    expect(r.descuento).toBe(30);
  });

  it('un producto de S/ 20.00 exactos no cuenta como unidad', () => {
    const r = calcularDescuento(
      [
        { precioUnitario: 20, cantidad: 3 },
        { precioUnitario: 40, cantidad: 1 },
      ],
      15,
      REGLAS,
    );
    expect(r.unidadesValidas).toBe(1);
    expect(r.descuento).toBe(0);
  });

  it('el total clavado en S/ 90 no aplica; un céntimo más, sí', () => {
    const tres = [{ precioUnitario: 25, cantidad: 3 }];
    expect(calcularDescuento(tres, 15, REGLAS).descuento).toBe(0);
    expect(
      calcularDescuento([...tres, { precioUnitario: 0.01, cantidad: 1 }], 15, REGLAS)
        .descuento,
    ).toBe(10);
  });

  it('no arrastra el error de los decimales', () => {
    const r = calcularDescuento(
      [
        { precioUnitario: 0.1, cantidad: 1 },
        { precioUnitario: 0.2, cantidad: 1 },
      ],
      0,
      REGLAS,
    );
    expect(r.total).toBe(0.3);
  });

  it('acepta cantidades y precios que vienen como texto del carrito', () => {
    const r = calcularDescuento(
      [{ precioUnitario: '31', cantidad: '2' }],
      '15' as unknown as number,
      REGLAS,
    );
    expect(r.total).toBe(77);
  });
});

describe('una tienda sin tramos configurados', () => {
  it('no hace descuentos y no revienta', () => {
    const r = calcularDescuento([{ precioUnitario: 100, cantidad: 9 }], 15, null);
    expect(r.descuento).toBe(0);
    expect(r.total).toBe(915);
    expect(r.faltaParaSiguiente).toBeNull();
  });
});

describe('el empujón al siguiente tramo', () => {
  it('aparece cuando el monto ya alcanza y falta una unidad', () => {
    const r = calcularDescuento([{ precioUnitario: 46, cantidad: 4 }], 15, REGLAS);
    expect(r.faltaParaSiguiente).toEqual({ unidades: 1, descuento: 20 });
  });

  it('NO aparece si además le falta dinero', () => {
    // Decirle "te falta 1 producto" cuando también le faltan S/ 55 es
    // empujarlo a una compra que no esperaba.
    const r = calcularDescuento([{ precioUnitario: 25, cantidad: 4 }], 15, REGLAS);
    expect(r.faltaParaSiguiente).toBeNull();
  });
});

describe('el pedido que se manda al chat', () => {
  const carrito = [
    { nombre: 'Moringa 100 cápsulas', precioUnitario: 31, cantidad: 2 },
    { descripcion: 'Berberina', precioUnitario: 60, cantidad: 1 },
  ];

  it('lleva el prefijo que la IA reconoce', () => {
    const m = mensajeDePedido(carrito, calcularDescuento(carrito, 0, REGLAS));
    expect(m.startsWith('PEDIDO WEB')).toBe(true);
  });

  it('lista los productos con cantidad y precio', () => {
    const m = mensajeDePedido(carrito, calcularDescuento(carrito, 0, REGLAS));
    expect(m).toContain('2x Moringa 100 cápsulas - S/ 31.00');
    expect(m).toContain('1x Berberina - S/ 60.00');
  });

  it('NO incluye el envío: depende del distrito y eso lo pregunta el chat', () => {
    const m = mensajeDePedido(carrito, calcularDescuento(carrito, 15, REGLAS));
    expect(m).not.toMatch(/env[íi]o/i);
  });

  it('el enlace va al número de la tienda y lleva el pedido escrito', () => {
    const url = enlaceDePedido('+51 925 085 731', 'PEDIDO WEB\n2x Moringa');
    expect(url.startsWith('https://wa.me/51925085731?text=')).toBe(true);
    expect(decodeURIComponent(url.split('text=')[1])).toContain('2x Moringa');
  });
});

describe('soles', () => {
  it('escribe los importes como el negocio', () => {
    expect(soles(122.5)).toBe('S/ 122.50');
  });
});
