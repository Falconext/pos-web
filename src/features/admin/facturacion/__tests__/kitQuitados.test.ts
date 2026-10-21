import { alternarQuitado, componentesDeCombo, descripcionKitSin, precioKitSin } from '../kitQuitados';

// "DETALLE TE AMO" a S/ 72: 12 rosas (S/ 6), caja (S/ 15), chocolates (S/ 18), tarjeta (S/ 1).
const combo = {
    items: [
        { productoId: 1, cantidad: 12, producto: { descripcion: 'Rosa roja premium (tallo)', precioUnitario: 6 } },
        { productoId: 2, cantidad: 1, producto: { descripcion: 'Caja kraft para rosas', precioUnitario: 15 } },
        { productoId: 3, cantidad: 1, producto: { descripcion: 'Chocolates Ferrero Rocher x3', precioUnitario: 18 } },
        { productoId: 4, cantidad: 1, producto: { descripcion: 'Tarjeta dedicatoria', precioUnitario: 1 } },
    ],
};
const comps = componentesDeCombo(combo);

describe('quitar productos de un kit en el carrito', () => {
    it('lee los componentes del combo', () => {
        expect(comps.map((c) => [c.productoId, c.cantidad, c.precio])).toEqual([[1, 12, 6], [2, 1, 15], [3, 1, 18], [4, 1, 1]]);
        expect(comps[2].descripcion).toBe('CHOCOLATES FERRERO ROCHER X3');
    });

    it('sin quitar nada el kit vale lo mismo', () => {
        expect(precioKitSin(72, comps, [])).toBe(72);
    });

    it('quitar los chocolates baja su parte del precio del kit', () => {
        // Sueltos suman 106; los chocolates son 18/106 del kit → 72 × 88/106.
        expect(precioKitSin(72, comps, [3])).toBe(59.77);
    });

    it('sin precios sueltos reparte por cantidad', () => {
        const sinPrecio = comps.map((c) => ({ ...c, precio: 0 }));
        expect(precioKitSin(30, sinPrecio, [4])).toBe(28); // quedan 14 de 15 unidades
    });

    it('la descripción dice qué se quitó', () => {
        expect(descripcionKitSin('DETALLE TE AMO', comps, [])).toBe('DETALLE TE AMO');
        expect(descripcionKitSin('DETALLE TE AMO', comps, [3, 4])).toBe('DETALLE TE AMO (SIN CHOCOLATES FERRERO ROCHER X3, TARJETA DEDICATORIA)');
    });

    it('quitar y devolver; no deja el kit vacío', () => {
        expect(alternarQuitado(comps, [], 3)).toEqual([3]);
        expect(alternarQuitado(comps, [3], 3)).toEqual([]);
        expect(alternarQuitado(comps, [1, 2, 3], 4)).toBeNull();
    });
});
