import { alternarQuitado, componentesDeCombo, precioKitSin } from '../kitQuitados';

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

    it('quitar un producto resta lo que cuesta suelto', () => {
        expect(precioKitSin(72, comps, [4])).toBe(71); // tarjeta S/ 1
        expect(precioKitSin(72, comps, [3])).toBe(54); // chocolates S/ 18
        expect(precioKitSin(72, comps, [3, 4])).toBe(53);
    });

    it('el precio no baja de 0', () => {
        expect(precioKitSin(20, comps, [1])).toBe(0); // 12 rosas × S/ 6 = 72 > 20
    });

    it('quitar y devolver; no deja el kit vacío', () => {
        expect(alternarQuitado(comps, [], 3)).toEqual([3]);
        expect(alternarQuitado(comps, [3], 3)).toEqual([]);
        expect(alternarQuitado(comps, [1, 2, 3], 4)).toBeNull();
    });
});
