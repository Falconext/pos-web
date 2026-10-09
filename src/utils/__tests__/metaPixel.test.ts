/**
 * D1 — el Pixel de Meta.
 *
 * Lo que de verdad hay que proteger: que una tienda SIN pixel no cargue nada
 * de Meta (la mayoría no hace campañas, y cargarles un rastreador ajeno sería
 * meterles un tercero sin pedirlo), y que no se monte dos veces al navegar.
 */
import {
  _reiniciarPixel,
  datosDeProducto,
  iniciarPixel,
  rastrear,
} from '../metaPixel';

describe('metaPixel', () => {
  beforeEach(() => {
    _reiniciarPixel();
    delete (window as any).fbq;
    delete (window as any)._fbq;
    document.head.querySelectorAll('script').forEach((s) => s.remove());
  });

  const scripts = () =>
    [...document.head.querySelectorAll('script')].filter((s) =>
      s.src.includes('fbevents'),
    );

  it('sin id no carga nada de Meta', () => {
    iniciarPixel(undefined);
    iniciarPixel(null);
    iniciarPixel('');
    iniciarPixel('   ');
    expect(scripts()).toHaveLength(0);
    expect((window as any).fbq).toBeUndefined();
  });

  it('con id carga el script y arranca el pixel', () => {
    iniciarPixel('123456789012345');
    expect(scripts()).toHaveLength(1);
    expect((window as any).fbq).toBeDefined();
  });

  it('no lo monta dos veces al navegar por la tienda', () => {
    iniciarPixel('123456789012345');
    iniciarPixel('123456789012345');
    iniciarPixel('123456789012345');
    expect(scripts()).toHaveLength(1);
  });

  it('no pierde eventos disparados antes de que cargue el script', () => {
    // El script tarda; los eventos se encolan y se envían al llegar.
    iniciarPixel('123456789012345');
    rastrear('PageView');
    expect((window as any).fbq.queue.length).toBeGreaterThan(0);
  });

  it('sin pixel, rastrear no hace nada y no revienta', () => {
    expect(() => rastrear('AddToCart', { value: 10 })).not.toThrow();
    expect((window as any).fbq).toBeUndefined();
  });
});

describe('datosDeProducto', () => {
  it('manda el id como texto, que es lo que Meta espera', () => {
    expect(datosDeProducto({ id: 17737 }).content_ids).toEqual(['17737']);
  });

  it('usa el precio de oferta cuando lo hay', () => {
    const d = datosDeProducto({ precioUnitario: 45, precioOferta: 30 });
    expect(d.value).toBe(30);
  });

  it('siempre en soles', () => {
    expect(datosDeProducto({ id: 1 }).currency).toBe('PEN');
  });

  it('un producto sin precio no rompe el evento', () => {
    expect(datosDeProducto({ id: 1 }).value).toBe(0);
  });
});
