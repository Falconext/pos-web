/**
 * Anchos de la tabla de productos del A4.
 *
 * Dos cosas se rompieron acá y ninguna la vio un test:
 *
 *  1. La fila separadora que da aire arriba de la tabla en la página 2 es la
 *     PRIMERA del <thead>, y con `table-layout: fixed` el navegador toma los
 *     anchos de la primera fila. Como es una sola celda con colSpan, repartía
 *     las 7 columnas en partes iguales (97px cada una, medido en vivo) y los
 *     `w-[x%]` de los <th> no hacían nada. Por eso los anchos viven en
 *     <colgroup>, que manda sin importar cuál sea la primera fila.
 *
 *  2. Con los anchos en el colgroup hay que repartir 100% completo: dejar una
 *     columna sin ancho hace que el navegador le dé lo que sobre, y la
 *     descripción quedó tan angosta que el documento pasó de 2 hojas a 4.
 *
 * jsdom no calcula layout, así que lo que se puede defender es la aritmética:
 * que haya un <col> por columna y que los porcentajes sumen 100. Los anchos
 * concretos (que el título MONEDA no se monte sobre P.UNIT.) se midieron en el
 * navegador; acá solo se evita que alguien vuelva a dejar el reparto cojo.
 */
import { render } from '@testing-library/react';
import ComprobantePrintPage from '../comprobanteImprimir';

jest.mock('@iconify/react', () => ({ Icon: () => null }));
jest.mock('@/zustand/auth', () => ({ useAuthStore: (sel: any) => sel({ sedeActiva: null }) }));
jest.mock('@/zustand/sedes', () => ({ useSedesStore: () => ({ sedes: [], listarSedes: jest.fn() }) }));
jest.mock('@/lib/branding', () => ({ BRAND: { name: 'Falconext', website: 'https://falconext.pe' } }));

const empresa = { razonSocial: 'WAWABB EIRL', ruc: '20607846147', rubro: { nombre: 'Bazar' } };

const pintar = (receipt: string, conImagenes = false) =>
  render(
    <ComprobantePrintPage
      company={{ email: 'diegovs@wawabb.com', empresa }}
      includeProductImages={conImagenes}
      formValues={{ serie: 'NV01', correlativo: '16', fechaEmision: new Date().toISOString(), mtoImpVenta: 1540.87 }}
      size="A4"
      serie="NV01"
      correlative="16"
      receipt={receipt}
      productsInvoice={[{ codigo: 'W69S55BOC700S', cantidad: 1, descripcion: 'AJUAR X 3', precioUnitario: 51.35 }]}
      total="1540.87"
      mode="off"
    />,
  );

const tablaDeProductos = (c: HTMLElement) =>
  [...c.querySelectorAll('table')].find((t) => t.querySelector('colgroup col'))!;

const anchos = (t: HTMLTableElement) =>
  [...t.querySelectorAll('colgroup col')].map((c) => parseFloat((c as HTMLElement).style.width));

describe.each(['NOTA DE VENTA', 'FACTURA'])('tabla de productos del A4 — %s', (receipt) => {
  it('reparte el 100% del ancho entre todas las columnas', () => {
    const { container } = pintar(receipt);
    const w = anchos(tablaDeProductos(container));
    expect(w).toHaveLength(7);
    expect(w.some(Number.isNaN)).toBe(false);
    expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 5);
  });

  it('sigue repartiendo 100% con la columna de imagen', () => {
    const { container } = pintar(receipt, true);
    const w = anchos(tablaDeProductos(container));
    // Si esto da 7 el test no está mirando la variante con imágenes y el
    // reparto de 8 columnas podría estar roto sin que nadie se entere.
    expect(w).toHaveLength(8);
    expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 5);
  });

  it('los anchos van en el colgroup, no en los <th>: la fila separadora es la primera', () => {
    const { container } = pintar(receipt);
    const t = tablaDeProductos(container);
    expect(t.style.tableLayout).toBe('fixed');

    const filas = t.querySelectorAll('thead tr');
    // La primera fila del thead es la separadora (una sola celda con colSpan).
    // Mientras siga siendo la primera, los <th> no pueden mandar el ancho.
    expect(filas[0].querySelectorAll('th')).toHaveLength(1);
    expect(filas[0].querySelector('th')!.getAttribute('colspan')).toBe('7');

    const titulos = [...filas[1].querySelectorAll('th')];
    expect(titulos.map((th) => th.textContent)).toEqual(
      expect.arrayContaining(['CÓDIGO', 'CANT.', 'UNIDAD', 'DESCRIPCIÓN', 'MONEDA']),
    );
    // Si alguien devuelve los w-[x%] a los <th> creyendo que arregla algo,
    // volvemos al bug: no hacen nada y confunden al que lea el archivo.
    expect(titulos.some((th) => /\bw-\[/.test(th.className))).toBe(false);
  });

  it('la cabecera va sin fondo: el cliente la pidió sin color', () => {
    const { container } = pintar(receipt);
    const thead = tablaDeProductos(container).querySelector('thead')!;
    expect(thead.className).not.toMatch(/\bbg-/);
  });

  it('la descripción se lleva la mayor parte del ancho', () => {
    const { container } = pintar(receipt);
    const w = anchos(tablaDeProductos(container));
    const descripcion = w[3];
    expect(descripcion).toBe(Math.max(...w));
    // Con el código al 18% y sin ancho propio, la descripción quedaba en lo que
    // sobrara y cada línea se partía en seis.
    expect(descripcion).toBeGreaterThanOrEqual(40);
  });
});
