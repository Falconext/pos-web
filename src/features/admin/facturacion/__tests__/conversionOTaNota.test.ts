/**
 * Cuánto se precarga en el modal de pago al CONVERTIR un documento.
 *
 * El modal valida que lo "recibido" cubra el total. Al convertir, parte de ese
 * total ya se cobró en el documento de origen y el backend solo registra en
 * caja la diferencia.
 *
 * Mientras el origen estuviera pagado entero esto no se notaba: precargar lo
 * ya cobrado daba justo el total y el modal decía "Exacto". Con un cobro
 * PARCIAL —el caso normal de una Orden de Trabajo, que casi siempre lleva
 * adelanto— el modal quedaba en "FALTA S/ x" y EMITIR bloqueado: no había
 * forma de convertirla. Lo vi en pantalla con una OT de S/ 24 y adelanto de
 * S/ 9.99.
 */
import { recibidoInicialDeConversion } from '../conversionPago';

const OT = { mtoImpVenta: 24, saldo: 14.01, formaPagoTipo: 'CONTADO' };

describe('monto recibido que se precarga', () => {
  it('al convertir cubre el total, no solo lo ya cobrado', () => {
    // 9.99 ya cobrados + 14.01 que se cobran ahora. Precargar 9.99 bloqueaba.
    expect(recibidoInicialDeConversion(OT, { esConversion: true })).toBeCloseTo(24, 2);
  });

  it('al EDITAR precarga lo que el documento tenía pagado', () => {
    // Editar no es cobrar de nuevo: el pago mostrado es el que ya tiene.
    expect(recibidoInicialDeConversion(OT, { esConversion: false })).toBeCloseTo(9.99, 2);
  });

  it('un origen pagado entero precarga el total por los dos caminos', () => {
    const pagada = { mtoImpVenta: 24, saldo: 0, formaPagoTipo: 'CONTADO' };
    expect(recibidoInicialDeConversion(pagada, { esConversion: true })).toBeCloseTo(24, 2);
    expect(recibidoInicialDeConversion(pagada, { esConversion: false })).toBeCloseTo(24, 2);
  });

  it('si hereda el crédito no precarga el total: el saldo se financia', () => {
    // Con crédito vivo el modal pide cronograma, no efectivo por el total.
    const credito = { mtoImpVenta: 24, saldo: 14.01, formaPagoTipo: 'CREDITO' };
    expect(recibidoInicialDeConversion(credito, { esConversion: true })).toBeCloseTo(9.99, 2);
  });

  it('un documento sin cobro previo no precarga nada al editar', () => {
    const sinCobro = { mtoImpVenta: 24, saldo: 24, formaPagoTipo: 'CONTADO' };
    expect(recibidoInicialDeConversion(sinCobro, { esConversion: false })).toBe(0);
  });
});
