import {
    lineasReprecificables,
    precioBaseDeLinea,
    precioAplicable,
} from '../reprecioPorLista';

describe('qué líneas se repreciar al cambiar de lista', () => {
    it('toma los productos normales como unidad base', () => {
        const lineas = lineasReprecificables([
            { productoId: 8403, cantidad: 2, precioUnitario: 7 },
        ]);
        expect(lineas).toEqual([
            { index: 0, productoId: 8403, presentacionCodigo: '', uPaquete: 1 },
        ]);
    });

    it('usa el código del paquete cuando la línea es un pack', () => {
        const lineas = lineasReprecificables([
            {
                productoId: 8403,
                esPaquete: true,
                unidadesPorPaquete: 6,
                codigoBarras: 'SIXPACK-8403',
                cantidad: 6,
            },
        ]);
        expect(lineas[0].presentacionCodigo).toBe('SIXPACK-8403');
        expect(lineas[0].uPaquete).toBe(6);
    });

    it('deja fuera combos e ítems libres: ninguna lista los tarifa', () => {
        const lineas = lineasReprecificables([
            { comboId: 5, descripcion: 'Combo promo' },
            { esItemLibre: true, descripcion: 'Instalación' },
            { productoId: 7818 },
        ]);
        expect(lineas).toHaveLength(1);
        expect(lineas[0].productoId).toBe(7818);
    });

    it('conserva el índice original aunque haya líneas descartadas en medio', () => {
        const lineas = lineasReprecificables([
            { comboId: 1 },
            { productoId: 7818 },
            { esItemLibre: true },
            { productoId: 8403 },
        ]);
        expect(lineas.map((l) => l.index)).toEqual([1, 3]);
    });

    it('acepta líneas que solo traen id (producto agregado desde el catálogo)', () => {
        expect(lineasReprecificables([{ id: 99 }])[0].productoId).toBe(99);
    });

    it('un producto sin paquete marcado no se trata como pack aunque traiga unidades', () => {
        const lineas = lineasReprecificables([
            { productoId: 8403, unidadesPorPaquete: 6, codigoBarras: 'EAN-NORMAL' },
        ]);
        expect(lineas[0].presentacionCodigo).toBe('');
        expect(lineas[0].uPaquete).toBe(1);
    });
});

describe('precio base de la línea', () => {
    it('reparte el precio del pack entre sus unidades', () => {
        // Six-pack a S/ 54 en la lista del bar -> S/ 9 la unidad.
        expect(precioBaseDeLinea(54, 6)).toBe(9);
    });

    it('deja igual el precio de una línea por unidad', () => {
        expect(precioBaseDeLinea(29, 1)).toBe(29);
    });

    it('no divide por cero si el paquete viene mal cargado', () => {
        expect(precioBaseDeLinea(38, 0)).toBe(38);
    });
});

describe('cuándo se aplica el precio devuelto', () => {
    it('aplica números positivos', () => {
        expect(precioAplicable(10)).toBe(true);
    });

    it('ignora null: el producto no está en la lista y conserva su precio', () => {
        expect(precioAplicable(null)).toBe(false);
    });

    it('ignora 0 y negativos: nunca se cobra gratis por cambiar de lista', () => {
        expect(precioAplicable(0)).toBe(false);
        expect(precioAplicable(-5)).toBe(false);
    });
});

/**
 * El bug de la presentación (reportado con CERVEZA PILSEN):
 * la cajera cambiaba la presentación de la línea con el desplegable, cambiaba
 * de lista, y el pack de 12 pasaba de S/ 85 a S/ 10.
 *
 * Causa: la presentación elegida se identificaba por `codigoBarras`, que al
 * cambiarla desde el desplegable seguía siendo el del PRODUCTO. La lista no
 * encontraba esa presentación, devolvía el precio de la unidad y el carrito lo
 * dividía entre 12.
 */
describe('Identidad de la presentación al reprecificar', () => {
    it('usa presentacionCodigo cuando la presentación se eligió en el carrito', () => {
        const linea = lineasReprecificables([
            {
                productoId: 32386,
                esPaquete: true,
                unidadesPorPaquete: 12,
                presentacionCodigo: 'PR605-X12',
                codigoBarras: '1338283289128', // el del PRODUCTO, no el del pack
                cantidad: 12,
            },
        ])[0];
        expect(linea.presentacionCodigo).toBe('PR605-X12');
        expect(linea.uPaquete).toBe(12);
    });

    it('cae a codigoBarras en líneas viejas que no guardaron la presentación', () => {
        // Carrito a medio migrar: la tarjeta de paquete guardaba el código ahí.
        const linea = lineasReprecificables([
            { productoId: 32386, esPaquete: true, unidadesPorPaquete: 6, codigoBarras: 'CERVSIX', cantidad: 6 },
        ])[0];
        expect(linea.presentacionCodigo).toBe('CERVSIX');
    });

    it('una línea por unidad no hereda el código de barras del producto', () => {
        // Si lo heredara, la lista buscaría una presentación inexistente.
        const linea = lineasReprecificables([
            { productoId: 32386, codigoBarras: '1338283289128', cantidad: 3 },
        ])[0];
        expect(linea.presentacionCodigo).toBe('');
        expect(linea.uPaquete).toBe(1);
    });

    it('el precio del pack se reparte entre sus unidades', () => {
        // Barbacoa: PACK 12 = S/ 80 -> 6.6667 por unidad -> 12 × 6.6667 = 80.
        const base = precioBaseDeLinea(80, 12);
        expect(Number((base * 12).toFixed(2))).toBe(80);
    });
});
