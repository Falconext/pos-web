/**
 * En Perfil → Configuración, ningún componente puede definirse dentro de otro.
 *
 * Reportado sobre app.krezka.com: las siete tarjetas de configuración
 * "pestañeaban". La causa: `SeccionConfig` y `Field` estaban declarados dentro
 * de `PerfilIndex`. Cada render crea un TIPO de componente nuevo, React no lo
 * reconoce como el mismo y desmonta y vuelve a montar todo el subárbol. Con 20
 * piezas de estado en esa página, cualquier tecla o interruptor remontaba las
 * siete tarjetas, sus modales y todo lo de adentro —y los bloques que consultan
 * su plan al montarse lo volvían a consultar cada vez—.
 *
 * Es un defecto que no se ve: compila, pasa el typecheck y no rompe ninguna
 * prueba de comportamiento. Solo se nota mirando la pantalla. Por eso el
 * guardián lee el archivo.
 */
import * as fs from 'fs';
import * as path from 'path';

const ARCHIVO = path.join(__dirname, '..', 'Index.tsx');
const fuente = fs.readFileSync(ARCHIVO, 'utf-8');

/**
 * Un componente declarado dentro de otro queda indentado. A nivel de módulo
 * empieza en la columna 0.
 */
const anidados = (): string[] => {
    const out: string[] = [];
    fuente.split('\n').forEach((linea, i) => {
        // `    const Algo = (` / `    function Algo(` con mayúscula inicial.
        if (/^\s+(const|function)\s+[A-Z][A-Za-z0-9]*\s*[=(]/.test(linea)) {
            // Se descartan los tipos y las constantes de datos: solo interesan
            // los que reciben props y devuelven JSX.
            if (/=>\s*\(|=>\s*{|\)\s*{\s*$|: *\{/.test(linea)) {
                out.push(`línea ${i + 1}: ${linea.trim().slice(0, 80)}`);
            }
        }
    });
    return out;
};

describe('Perfil → Configuración no remonta sus tarjetas', () => {
    it('no define componentes dentro de otro componente', () => {
        expect(anidados()).toEqual([]);
    });

    it('SeccionConfig y Field viven a nivel de módulo', () => {
        // Si vuelven adentro, la página parpadea otra vez.
        expect(fuente).toMatch(/^const SeccionConfig = /m);
        expect(fuente).toMatch(/^const Field = /m);
    });

    it('siguen recibiendo todo por props, sin tomar nada del padre', () => {
        // Sacarlos afuera solo funciona si no dependen del alcance de la página.
        const bloque = fuente.slice(
            fuente.indexOf('const SeccionConfig = '),
            fuente.indexOf('export default function PerfilIndex'),
        );
        for (const delPadre of ['empresa?.', 'auth?.', 'seccionAbierta', 'toggleSeccion(']) {
            expect(bloque).not.toContain(delPadre);
        }
    });
});
