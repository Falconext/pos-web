/**
 * El catálogo PDF no puede empezar con una hoja en blanco.
 *
 * Reportado por CORPORACION MAYE TEC: al imprimir, la primera página salía solo
 * con el encabezado y el resto vacío; el contenido arrancaba recién en la 2.
 *
 * La causa era `avoid-break` (page-break-inside: avoid) puesto en el bloque de
 * UNA CATEGORÍA ENTERA. Con 92 productos ese bloque mide varias páginas: el
 * navegador no lo puede partir, así que lo empuja completo a la hoja siguiente
 * y deja la primera con el encabezado y en blanco.
 *
 * `avoid-break` es correcto en piezas chicas —una fila, una tarjeta de
 * producto—, que sí caben en una hoja. Se verificó con puppeteer: con la regla
 * vieja el PDF salía en 4 páginas y la primera vacía; con la nueva, 3 páginas y
 * 29 productos ya en la primera.
 */
import * as fs from 'fs';
import * as path from 'path';

const PLANTILLA = fs.readFileSync(
    path.join(__dirname, '..', 'CatalogoPrintTemplate.tsx'), 'utf-8',
);

describe('El bloque de categoría se puede partir entre páginas', () => {
    it('la categoría NO lleva avoid-break', () => {
        // Este era el defecto exacto.
        expect(PLANTILLA).not.toContain('key={categoria} className="avoid-break');
        expect(PLANTILLA).toContain('key={categoria} className="categoria-bloque');
    });

    it('y su regla la deja partirse', () => {
        expect(PLANTILLA).toMatch(/\.categoria-bloque \{[^}]*page-break-inside: auto/);
        expect(PLANTILLA).toMatch(/\.categoria-bloque \{[^}]*break-inside: auto/);
    });

    it('pero el título no queda solo al pie de una hoja', () => {
        expect(PLANTILLA).toMatch(/\.categoria-titulo \{[^}]*page-break-after: avoid/);
        expect(PLANTILLA).toContain('categoria-titulo');
    });
});

describe('avoid-break se queda donde sí corresponde', () => {
    it('sigue existiendo para las piezas chicas', () => {
        // Una fila o una tarjeta sí caben en una hoja: ahí evitar el corte es
        // lo correcto.
        expect(PLANTILLA).toMatch(/\.avoid-break \{[^}]*page-break-inside: avoid/);
    });

    it('las filas de la tabla lo conservan', () => {
        expect(PLANTILLA).toContain('key={p.id} className="avoid-break hover:bg-gray-50"');
    });
});

describe('La tabla se sigue entendiendo en la página 2', () => {
    it('el encabezado de columnas se repite en cada hoja', () => {
        // Sin esto, de la segunda página en adelante no se sabe qué es cada
        // columna.
        expect(PLANTILLA).toMatch(/thead \{ display: table-header-group; \}/);
    });

    it('una fila no se parte a la mitad entre páginas', () => {
        expect(PLANTILLA).toMatch(/\n\s*tr \{ page-break-inside: avoid/);
    });
});

describe('La imagen del catálogo Técnica se ve', () => {
    it('mide 80px, no los 40px de antes', () => {
        // A 40px el producto no se distinguía. Medido con puppeteer sobre 92
        // productos con los nombres reales: el catálogo pasa de 8 a 10 páginas.
        expect(PLANTILLA).toContain('w-20 h-20 bg-white rounded border border-gray-200');
        expect(PLANTILLA).not.toContain('w-10 h-10 bg-white rounded border border-gray-200');
    });

    it('la columna acompaña el ancho nuevo', () => {
        expect(PLANTILLA).toContain('<th className="py-3 px-4 w-24">Img</th>');
    });

    it('se muestra el producto entero, sin recortarlo', () => {
        // `object-cover` recortaba los bordes de la foto; `contain` la encaja.
        expect(PLANTILLA).toContain('object-contain p-0.5');
    });
});
