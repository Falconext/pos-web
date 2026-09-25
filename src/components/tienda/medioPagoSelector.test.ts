/**
 * Qué medios ofrece la tienda. Lo que se cuida acá: una tienda que configuró
 * Niubiz (y no Culqi) tiene que mostrar "Tarjeta"; antes la opción dependía de
 * la llave pública de Culqi y esas tiendas se quedaban sin cobrar con tarjeta.
 */
import { mediosDisponibles } from './MedioPagoSelector';

describe('Medios de pago ofrecidos en la tienda', () => {
  it('con Niubiz configurado se ofrece Tarjeta aunque no haya Culqi', () => {
    expect(mediosDisponibles({ aceptaNiubiz: true })).toContain('TARJETA');
  });

  it('con Culqi configurado se sigue ofreciendo Tarjeta', () => {
    expect(mediosDisponibles({ aceptaTarjeta: true, culqiPublicKey: 'pk_test' })).toContain('TARJETA');
  });

  it('sin ninguna pasarela no se ofrece Tarjeta', () => {
    expect(mediosDisponibles({ aceptaEfectivo: true })).not.toContain('TARJETA');
  });

  it('Culqi a medias (interruptor sin llave) no ofrece Tarjeta', () => {
    expect(mediosDisponibles({ aceptaTarjeta: true })).not.toContain('TARJETA');
    expect(mediosDisponibles({ culqiPublicKey: 'pk_test' })).not.toContain('TARJETA');
  });

  it('las pasarelas no pisan a los demás medios', () => {
    const medios = mediosDisponibles({
      aceptaNiubiz: true, aceptaEfectivo: true, yapeNumero: '999888777',
      cuentasBancarias: [{ banco: 'BCP' }],
    });
    expect(medios).toEqual(expect.arrayContaining(['EFECTIVO', 'YAPE', 'TARJETA', 'TRANSFERENCIA']));
  });
});
