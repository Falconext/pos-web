/**
 * El nombre del producto en el kardex cuando hay tallas y colores.
 *
 * Caso real: el cliente buscaba "los movimientos del producto Victoria azul
 * talla 35" y la lista le mostraba todas las variantes con el mismo texto, el
 * del modelo. Sin la talla a la vista no hay forma de saber cuál se movió.
 */
import { etiquetaProducto } from '../etiquetaProducto';

describe('etiquetaProducto', () => {
    it('agrega la talla y el color cuando el nombre no los trae', () => {
        expect(etiquetaProducto({
            descripcion: 'VICTORIA',
            valoresAtributos: { Color: 'Azul', Talla: '35' },
        })).toBe('VICTORIA · Azul · 35');
    });

    it('no repite lo que el nombre ya dice', () => {
        // Varios catálogos guardan la variante con la descripción ya compuesta.
        expect(etiquetaProducto({
            descripcion: 'VICTORIA AZUL TALLA 35',
            valoresAtributos: { Color: 'Azul', Talla: '35' },
        })).toBe('VICTORIA AZUL TALLA 35');
    });

    it('agrega solo lo que falta', () => {
        expect(etiquetaProducto({
            descripcion: 'VICTORIA AZUL',
            valoresAtributos: { Color: 'Azul', Talla: '35' },
        })).toBe('VICTORIA AZUL · 35');
    });

    it('no da por puesta una talla que es parte de otra palabra', () => {
        // "35" no está en "350 ML": si se comparara por substring, la talla
        // desaparecería justo del producto que hay que distinguir.
        expect(etiquetaProducto({
            descripcion: 'GASEOSA 350 ML',
            valoresAtributos: { Talla: '35' },
        })).toBe('GASEOSA 350 ML · 35');
    });

    it('un producto sin variantes queda igual', () => {
        expect(etiquetaProducto({ descripcion: 'GEL FIJADOR 500G' })).toBe('GEL FIJADOR 500G');
        expect(etiquetaProducto({ descripcion: 'GEL', valoresAtributos: null })).toBe('GEL');
    });

    it('ignora atributos vacíos en vez de dejar separadores sueltos', () => {
        expect(etiquetaProducto({
            descripcion: 'VICTORIA',
            valoresAtributos: { Color: '  ', Talla: '35' },
        })).toBe('VICTORIA · 35');
    });
});
