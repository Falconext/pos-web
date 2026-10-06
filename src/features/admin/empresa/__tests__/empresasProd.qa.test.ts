/**
 * QA funcional del listado de /administrador/empresas con las 62 empresas
 * reales de producción (snapshot del 05/10/2026, sin datos sensibles).
 *
 * Verifica lo que se reportó: "no se ve la que creo" y "ponle paginado".
 */
import { ordenarGrupo, filasDePagina, totalDePaginas, paginaDeEmpresa, esEmpresaNueva, POR_PAGINA } from '../ordenGrupoEmpresas';
import empresas from './empresasProd.fixture.json';

const HOY = new Date('2026-10-05T12:00:00Z');

/** Mismo criterio de agrupación que useEmpresaIndexViewModel. */
const grupoDe = (e: any): 'DEMO' | 'MENSUAL' | 'ANUAL' => {
    const plan = e?.plan ?? {};
    const nombre = String(plan.nombre ?? '');
    if (plan.esPrueba === true || e?.usaDemo === true || /\b(demo|prueba)\b/i.test(nombre)) return 'DEMO';
    const tipo = String(plan.tipoFacturacion ?? '').toUpperCase();
    if (tipo === 'ANUAL' || /\banual\b/i.test(nombre)) return 'ANUAL';
    return 'MENSUAL';
};

const agrupar = () => {
    const grupos: Record<string, any[]> = { DEMO: [], MENSUAL: [], ANUAL: [] };
    (empresas as any[]).forEach((e) => grupos[grupoDe(e)].push(e));
    Object.keys(grupos).forEach((k) => { grupos[k] = ordenarGrupo(grupos[k], HOY); });
    return grupos;
};

/** Orden viejo: solo por vencimiento. */
const ordenViejo = (lista: any[]) =>
    [...lista].sort((a, b) => (a.diasRestantes ?? Infinity) - (b.diasRestantes ?? Infinity));

describe('QA con los datos reales de producción (62 empresas)', () => {
    const grupos = agrupar();

    it('las 62 entran, ninguna se pierde al agrupar', () => {
        const total = grupos.DEMO.length + grupos.MENSUAL.length + grupos.ANUAL.length;
        expect(total).toBe(62);
        expect(new Set((empresas as any[]).map((e) => e.id)).size).toBe(62);
    });

    it('ANTES: TIENDA MINERA (la última creada) quedaba fuera de las 5 primeras', () => {
        const mensuales = ordenViejo(grupos.MENSUAL);
        const posicion = mensuales.findIndex((e) => e.id === 88);
        expect(posicion).toBeGreaterThan(4); // no se veía sin "Ver todos"
    });

    it('AHORA: TIENDA MINERA aparece primera en su grupo', () => {
        expect(grupos.MENSUAL[0].id).toBe(88);
        expect(grupos.MENSUAL[0]['Razon Social']).toBe('TIENDA MINERA S.A.C.');
    });

    it('las cuatro altas de la última semana están todas en la primera página', () => {
        const nuevas = (empresas as any[]).filter((e) => esEmpresaNueva(e, HOY));
        expect(nuevas.length).toBeGreaterThan(0);
        for (const n of nuevas) {
            const grupo = grupos[grupoDe(n)];
            expect(paginaDeEmpresa(grupo, n.id)).toBe(1);
        }
    });

    it('ninguna empresa vieja se cuela como nueva', () => {
        const nuevas = (empresas as any[]).filter((e) => esEmpresaNueva(e, HOY));
        for (const n of nuevas) {
            const dias = Math.floor((HOY.getTime() - new Date(n.fechaActivacion).getTime()) / 86400000);
            expect(dias).toBeLessThanOrEqual(7);
        }
    });

    it('debajo de las nuevas, el orden de cobranza sigue intacto', () => {
        for (const g of ['DEMO', 'MENSUAL', 'ANUAL']) {
            const resto = grupos[g].filter((e) => !esEmpresaNueva(e, HOY));
            const dias = resto.map((e) => e.diasRestantes ?? Infinity);
            expect(dias).toEqual([...dias].sort((a, b) => a - b));
        }
    });

    it('el vencido más urgente sigue estando arriba del resto', () => {
        const resto = grupos.MENSUAL.filter((e) => !esEmpresaNueva(e, HOY));
        const minimo = Math.min(...resto.map((e) => e.diasRestantes ?? Infinity));
        expect(resto[0].diasRestantes).toBe(minimo);
    });

    it('el grupo grande se parte en páginas en vez de una lista de un tirón', () => {
        const mayor = ['DEMO', 'MENSUAL', 'ANUAL'].map((g) => grupos[g].length).sort((a, b) => b - a)[0];
        expect(mayor).toBeGreaterThan(POR_PAGINA);
        const g = ['DEMO', 'MENSUAL', 'ANUAL'].find((k) => grupos[k].length === mayor)!;
        expect(totalDePaginas(grupos[g].length)).toBeGreaterThan(1);
        expect(filasDePagina(grupos[g], 1)).toHaveLength(POR_PAGINA);
    });

    it('recorriendo todas las páginas de cada grupo se ven todas las empresas, sin repetir', () => {
        const vistas: number[] = [];
        for (const g of ['DEMO', 'MENSUAL', 'ANUAL']) {
            for (let p = 1; p <= totalDePaginas(grupos[g].length); p++) {
                filasDePagina(grupos[g], p).forEach((e: any) => vistas.push(e.id));
            }
        }
        expect(vistas).toHaveLength(62);
        expect(new Set(vistas).size).toBe(62);
    });

    it('la última página de cada grupo nunca queda vacía', () => {
        for (const g of ['DEMO', 'MENSUAL', 'ANUAL']) {
            if (grupos[g].length === 0) continue;
            const ultima = totalDePaginas(grupos[g].length);
            expect(filasDePagina(grupos[g], ultima).length).toBeGreaterThan(0);
        }
    });

    it('simula dar de alta una empresa nueva: aparece primera y en la página 1', () => {
        const nueva = {
            id: 999, 'Razon Social': 'CLIENTE RECIEN CREADO S.A.C.',
            fechaActivacion: '2026-10-05T11:00:00Z', diasRestantes: 30,
            plan: { nombre: 'NEGOCIO', tipoFacturacion: 'MENSUAL', esPrueba: false }, usaDemo: false,
        };
        const mensuales = ordenarGrupo([...grupos.MENSUAL, nueva], HOY);
        expect(mensuales[0].id).toBe(999);
        expect(paginaDeEmpresa(mensuales, 999)).toBe(1);
        expect(filasDePagina(mensuales, 1).map((e: any) => e.id)).toContain(999);
    });
});
