import { mapDetalleToInvoiceProduct } from '../utils/comprobanteProductMapper';

/**
 * Convertir una Nota de Venta que tiene un pack (kit en una sola línea) o un
 * ítem libre: esas líneas se guardan con `productoId: null`. El mapper caía al
 * `id` del DETALLE y lo mandaba como productoId al emitir la boleta: el backend
 * respondía "producto no encontrado" o, si el número coincidía con un producto
 * de la empresa, la línea quedaba como ese otro producto.
 */
describe('mapDetalleToInvoiceProduct con líneas sin producto de catálogo', () => {
  it('un pack vendido como una línea sigue siendo el pack, no un producto', () => {
    const r = mapDetalleToInvoiceProduct({
      id: 98123,
      productoId: null,
      comboId: 7,
      producto: null,
      descripcion: 'RAMO DE ROSAS',
      cantidad: 2,
      mtoPrecioUnitario: 85,
      unidad: 'ZZ',
    });
    expect(r.productoId).toBeNull();
    expect(r.id).toBeNull();
    expect(r.comboId).toBe(7);
    expect(r.esKit).toBe(true);
    expect(r.esItemLibre).toBe(true);
    expect(r.cantidad).toBe(2);
    expect(r.precioUnitario).toBe(85);
  });

  it('un ítem libre queda libre', () => {
    const r = mapDetalleToInvoiceProduct({ id: 555, productoId: null, descripcion: 'ENVOLTURA', cantidad: 1, mtoPrecioUnitario: 5 });
    expect(r.productoId).toBeNull();
    expect(r.id).toBeNull();
    expect(r.esItemLibre).toBe(true);
    expect(r.esKit).toBeUndefined();
  });

  it('una línea con producto sigue igual', () => {
    const r = mapDetalleToInvoiceProduct({ id: 555, productoId: 42, producto: { id: 42, descripcion: 'PELUCHE' }, cantidad: 1, mtoPrecioUnitario: 30 });
    expect(r.productoId).toBe(42);
    expect(r.id).toBe(42);
    expect(r.esItemLibre).toBeUndefined();
  });

  it('un objeto del carrito sin campo productoId usa su id como antes', () => {
    const r = mapDetalleToInvoiceProduct({ id: 42, descripcion: 'PELUCHE', cantidad: 1, precioUnitario: 30 });
    expect(r.productoId).toBe(42);
  });
});
