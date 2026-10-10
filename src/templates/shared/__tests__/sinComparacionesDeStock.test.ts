/**
 * Ninguna plantilla debe volver a decidir "Agotado" por su cuenta.
 *
 * El ajuste "Acepto pedidos de productos agotados" se agregó al backend, pero
 * las 31 plantillas seguían comparando el stock a mano (`stock <= 0`) y nunca
 * lo miraban: el empresario marcaba la casilla y su tienda seguía igual.
 *
 * Esta prueba recorre la tienda entera y falla si alguien vuelve a comparar el
 * stock en crudo para habilitar o bloquear la compra. La decisión vive en
 * `sinStock()`, que es el único lugar que conoce la política del negocio.
 */
import * as fs from 'fs';
import * as path from 'path';

const raiz = path.join(__dirname, '..', '..', '..');
const CARPETAS = ['pages/tienda', 'components/tienda', 'templates'];

/** La implementación de la política sí compara el stock: es su trabajo. */
const EXENTOS = ['templates/shared/ventaSinStock.ts'];

const EXENTOS_LINEA = [
    /**
     * Elegir por defecto la variante que tiene stock no es bloquear la compra:
     * si ninguna tiene, igual se ofrece la primera.
     */
    /choices\.find\(\(choice\) => choice\.stock > 0\)/,
    /**
     * "Bajo pedido" es justamente lo que hay que decir cuando el stock no
     * alcanza y el negocio igual acepta el pedido: no bloquea nada.
     */
    /stock < unidadesPorCompra/,
    /** JSX, no una comparación: `{stock}</span>`. */
    /[Ss]tock\s*\}?\s*<\//,
];

function archivos(dir: string): string[] {
    const abs = path.join(raiz, dir);
    if (!fs.existsSync(abs)) return [];
    return fs.readdirSync(abs, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory()
            ? archivos(path.join(dir, e.name))
            : /\.tsx?$/.test(e.name) ? [path.join(dir, e.name)] : [],
    );
}

describe('La tienda no compara el stock a mano', () => {
    const todos = CARPETAS.flatMap(archivos).filter(
        (f) => !EXENTOS.includes(f) && !f.includes('__tests__'),
    );

    it('encuentra los archivos de la tienda (si no, la prueba no prueba nada)', () => {
        expect(todos.length).toBeGreaterThan(50);
    });

    it('nadie compara el stock a mano para decidir qué se puede comprar', () => {
        const culpables: string[] = [];
        for (const f of todos) {
            fs.readFileSync(path.join(raiz, f), 'utf-8')
                .split('\n')
                .forEach((linea, i) => {
                    // Cualquier comparación del stock, no solo contra cero: el
                    // defecto que se escapó la primera vez era
                    // `stock >= unidadesPorPaquete`, que bloqueaba cada
                    // presentación ("por metro", "por rollo") de la plantilla.
                    if (!/[Ss]tock[A-Za-z]*\s*(<=?|>=?)[^=]/.test(linea)) return;
                    if (/\b(sinStock|pocasUnidades|limiteCantidad)\(/.test(linea)) return;
                    if (EXENTOS_LINEA.some((re) => re.test(linea))) return;
                    culpables.push(`${f}:${i + 1}  ${linea.trim().slice(0, 90)}`);
                });
        }
        expect(culpables).toEqual([]);
    });
});
