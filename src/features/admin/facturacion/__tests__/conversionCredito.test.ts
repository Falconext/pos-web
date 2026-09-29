/**
 * Qué condición de pago hereda una nota de venta al convertirse.
 *
 * Reportado por OWENSOFT: NV01-297 era a crédito pero ya estaba cobrada entera
 * (S/280 de S/280, saldo 0). Al convertirla a boleta el sistema heredaba el
 * crédito, mostraba "el resto queda a crédito" cuando no había resto, y la
 * emisión terminaba en "todas las cuotas deben tener monto mayor a cero". Era
 * un callejón sin salida: no se podía emitir el documento de ninguna forma.
 */

// Se importa la función REAL: una prueba que reimplementa la regla no prueba
// el código que corre en producción.
import { heredaCredito } from '../conversionPago';

describe('Condición de pago al convertir una nota de venta', () => {
  it('EL CASO DE OWENSOFT: crédito ya cobrado entero se convierte como contado', () => {
    // NV01-297 tal cual está en producción.
    expect(heredaCredito({ formaPagoTipo: 'Credito', saldo: 0 })).toBe(false);
  });

  it('crédito con saldo pendiente SÍ se hereda', () => {
    // Lo que no hay que romper: el crédito de verdad sigue siendo crédito.
    expect(heredaCredito({ formaPagoTipo: 'Credito', saldo: 180 })).toBe(true);
  });

  it('crédito con un adelanto parcial sigue siendo crédito', () => {
    expect(heredaCredito({ formaPagoTipo: 'CREDITO', saldo: 0.01 })).toBe(true);
  });

  it('una venta al contado nunca hereda crédito', () => {
    expect(heredaCredito({ formaPagoTipo: 'Contado', saldo: 0 })).toBe(false);
    expect(heredaCredito({ formaPagoTipo: 'CONTADO', saldo: 50 })).toBe(false);
  });

  it('no le importa cómo venga escrito el tipo', () => {
    expect(heredaCredito({ formaPagoTipo: 'credito', saldo: 100 })).toBe(true);
    expect(heredaCredito({ formaPagoTipo: 'Credito', saldo: 100 })).toBe(true);
  });

  it('un saldo nulo o negativo cuenta como pagado', () => {
    // saldo null pasa cuando el informal nunca registró crédito; tratarlo como
    // pendiente mandaría al empresario al mismo callejón sin salida.
    expect(heredaCredito({ formaPagoTipo: 'Credito', saldo: null })).toBe(false);
    expect(heredaCredito({ formaPagoTipo: 'Credito' })).toBe(false);
    expect(heredaCredito({ formaPagoTipo: 'Credito', saldo: -5 })).toBe(false);
  });

  it('sin forma de pago no inventa un crédito', () => {
    expect(heredaCredito({ saldo: 500 })).toBe(false);
    expect(heredaCredito({})).toBe(false);
  });
});
