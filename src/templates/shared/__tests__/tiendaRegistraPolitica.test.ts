/**
 * Toda página que carga la tienda tiene que registrar su política de stock.
 *
 * `sinStock()` sabe si el negocio acepta pedidos de productos agotados porque
 * alguien se lo contó al cargar la tienda. Si una página nueva hace su propio
 * fetch y se olvida de `recordarVentaSinStock(...)`, esa plantilla vuelve a
 * pintar "Agotado" aunque el empresario haya marcado la casilla — y el defecto
 * es invisible: compila, no rompe ninguna otra pantalla, y solo se nota cuando
 * un cliente no puede comprar.
 */
import * as fs from 'fs';
import * as path from 'path';

const raiz = path.join(__dirname, '..', '..', '..');

function archivos(dir: string): string[] {
    const abs = path.join(raiz, dir);
    if (!fs.existsSync(abs)) return [];
    return fs.readdirSync(abs, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory()
            ? archivos(path.join(dir, e.name))
            : /\.tsx?$/.test(e.name) ? [path.join(dir, e.name)] : [],
    );
}

describe('Cada carga de tienda registra la política de stock', () => {
    const conSetTienda = ['pages', 'components']
        .flatMap(archivos)
        .filter((f) => !f.includes('__tests__'))
        .filter((f) => fs.readFileSync(path.join(raiz, f), 'utf-8').includes('setTienda('));

    it('encuentra las páginas de tienda (si no, la prueba no prueba nada)', () => {
        expect(conSetTienda.length).toBeGreaterThan(30);
    });

    it('ninguna llama a setTienda sin registrar la política', () => {
        const olvidadizos = conSetTienda.filter((f) => {
            const src = fs.readFileSync(path.join(raiz, f), 'utf-8');
            // Cada setTienda(...) debe envolver su valor con recordarVentaSinStock.
            const llamadas = (src.match(/setTienda\(/g) || []).length;
            const registros = (src.match(/setTienda\(recordarVentaSinStock\(/g) || []).length;
            const nulos = (src.match(/setTienda\(null\)/g) || []).length;
            return registros + nulos < llamadas;
        });
        expect(olvidadizos).toEqual([]);
    });
});
