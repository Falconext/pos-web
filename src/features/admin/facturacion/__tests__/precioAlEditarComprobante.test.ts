import { lineasAReprecificar } from '../reprecioPorLista';

/**
 * Editar una venta ya emitida no puede cambiarle el total por sí solo.
 *
 * El caso vivido: la NV01-19 se vendió a S/ 8.00 y al abrirla para editar se
 * mostraba en S/ 10.00 (el precio de hoy). Si alguien corregía el nombre del
 * cliente y guardaba, la venta pasaba a valer S/ 10.00 sin que nadie lo pidiera.
 */
describe('Precio de las líneas al editar un comprobante', () => {
    const carrito = [
        { descripcion: 'CERVEZA PILSEN', precioDelDocumento: true },   // vino del documento
        { descripcion: 'QUESO MANTECOSO' },                            // la agregó el cajero ahora
    ];
    const lineas = [{ index: 0 }, { index: 1 }];

    it('el reprecio AUTOMÁTICO no toca lo que vino del documento', () => {
        expect(lineasAReprecificar(lineas, carrito, { respetarPrecioDelDocumento: true }))
            .toEqual([{ index: 1 }]);
    });

    it('pero sí reprecia las líneas agregadas en esta venta', () => {
        const soloNuevas = lineasAReprecificar(lineas, carrito, { respetarPrecioDelDocumento: true });
        expect(soloNuevas).toHaveLength(1);
        expect(carrito[soloNuevas[0].index].descripcion).toBe('QUESO MANTECOSO');
    });

    it('el cambio de tarifa A MANO sí aplica a todo: lo pidió el cajero', () => {
        expect(lineasAReprecificar(lineas, carrito)).toEqual(lineas);
        expect(lineasAReprecificar(lineas, carrito, {})).toEqual(lineas);
    });

    it('una venta nueva (ninguna línea del documento) se reprecia entera', () => {
        const nuevas = [{ descripcion: 'A' }, { descripcion: 'B' }];
        expect(lineasAReprecificar(lineas, nuevas, { respetarPrecioDelDocumento: true }))
            .toEqual(lineas);
    });

    it('un carrito vacío no revienta', () => {
        expect(lineasAReprecificar(lineas, [], { respetarPrecioDelDocumento: true })).toEqual(lineas);
        expect(lineasAReprecificar([], carrito, { respetarPrecioDelDocumento: true })).toEqual([]);
    });
});
