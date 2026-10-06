import {
    DIAS_PARA_NUEVA,
    POR_PAGINA,
    diasDesdeElAlta,
    esEmpresaNueva,
    ordenarGrupo,
    totalDePaginas,
    paginaSegura,
    filasDePagina,
    paginaDeEmpresa,
    rangoMostrado,
} from '../ordenGrupoEmpresas';

const HOY = new Date('2026-10-05T12:00:00Z');

/** Una empresa como la arma el viewmodel. */
const empresa = (id: number, alta: string, diasRestantes: number | null = 30) => ({
    id,
    'Razon Social': `EMPRESA ${id}`,
    fechaActivacion: alta,
    diasRestantes,
});

describe('esEmpresaNueva', () => {
    it('la dada de alta hoy es nueva', () => {
        expect(esEmpresaNueva(empresa(1, '2026-10-05T10:00:00Z'), HOY)).toBe(true);
    });

    it('sigue siendo nueva al séptimo día', () => {
        expect(esEmpresaNueva(empresa(1, '2026-09-28T12:00:00Z'), HOY)).toBe(true);
    });

    it('al octavo día deja de serlo', () => {
        expect(esEmpresaNueva(empresa(1, '2026-09-27T00:00:00Z'), HOY)).toBe(false);
    });

    it('una activación futura también cuenta como nueva', () => {
        expect(esEmpresaNueva(empresa(1, '2026-10-20T00:00:00Z'), HOY)).toBe(true);
    });

    it('sin fecha de alta no se inventa que es nueva', () => {
        expect(esEmpresaNueva({ id: 1 }, HOY)).toBe(false);
        expect(esEmpresaNueva({ id: 1, fechaActivacion: 'no-es-fecha' }, HOY)).toBe(false);
        expect(esEmpresaNueva(null, HOY)).toBe(false);
    });

    it('diasDesdeElAlta cuenta bien y devuelve null si no hay fecha', () => {
        expect(diasDesdeElAlta(empresa(1, '2026-10-01T12:00:00Z'), HOY)).toBe(4);
        expect(diasDesdeElAlta({ id: 1 }, HOY)).toBeNull();
    });

    it('el umbral por defecto son 7 días', () => {
        expect(DIAS_PARA_NUEVA).toBe(7);
    });
});

describe('ordenarGrupo — el problema que se reportó', () => {
    it('la recién creada deja de quedar última y pasa a primera', () => {
        const grupo = [
            empresa(80, '2026-05-01T00:00:00Z', 2),
            empresa(81, '2026-06-01T00:00:00Z', 15),
            empresa(88, '2026-10-03T00:00:00Z', 29),
        ];
        expect(ordenarGrupo(grupo, HOY).map((e) => e.id)).toEqual([88, 80, 81]);
    });

    it('entre varias nuevas, la más reciente va primera', () => {
        const grupo = [
            empresa(86, '2026-10-01T00:00:00Z', 26),
            empresa(88, '2026-10-03T00:00:00Z', 29),
            empresa(87, '2026-10-03T08:00:00Z', 29),
        ];
        expect(ordenarGrupo(grupo, HOY).map((e) => e.id)).toEqual([87, 88, 86]);
    });

    it('el resto conserva el orden por vencimiento (sirve para cobrar)', () => {
        const grupo = [
            empresa(10, '2026-01-01T00:00:00Z', 40),
            empresa(11, '2026-01-01T00:00:00Z', -3),
            empresa(12, '2026-01-01T00:00:00Z', 5),
        ];
        expect(ordenarGrupo(grupo, HOY).map((e) => e.diasRestantes)).toEqual([-3, 5, 40]);
    });

    it('las que no tienen vencimiento quedan al final, no arriba', () => {
        const grupo = [
            empresa(10, '2026-01-01T00:00:00Z', null),
            empresa(11, '2026-01-01T00:00:00Z', 90),
        ];
        expect(ordenarGrupo(grupo, HOY).map((e) => e.id)).toEqual([11, 10]);
    });

    it('no muta el arreglo que recibe', () => {
        const grupo = [empresa(10, '2026-01-01T00:00:00Z', 40), empresa(88, '2026-10-03T00:00:00Z', 29)];
        const copia = [...grupo];
        ordenarGrupo(grupo, HOY);
        expect(grupo).toEqual(copia);
    });

    it('lista vacía o inválida no revienta', () => {
        expect(ordenarGrupo([], HOY)).toEqual([]);
        expect(ordenarGrupo(undefined as any, HOY)).toEqual([]);
    });
});

describe('paginado', () => {
    const veintitres = Array.from({ length: 23 }, (_, i) => empresa(i + 1, '2026-01-01T00:00:00Z', i));

    it('reparte en páginas de 10', () => {
        expect(POR_PAGINA).toBe(10);
        expect(totalDePaginas(23)).toBe(3);
        expect(filasDePagina(veintitres, 1)).toHaveLength(10);
        expect(filasDePagina(veintitres, 3)).toHaveLength(3);
    });

    it('la página 2 trae las filas 11 a 20', () => {
        expect(filasDePagina(veintitres, 2).map((e) => e.id)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    });

    it('una lista corta es una sola página', () => {
        expect(totalDePaginas(5)).toBe(1);
        expect(totalDePaginas(0)).toBe(1);
    });

    it('si la lista se acorta al filtrar, la página se ajusta sola', () => {
        expect(paginaSegura(3, 8)).toBe(1);
        expect(filasDePagina(veintitres.slice(0, 8), 3)).toHaveLength(8);
    });

    it('una página inválida cae a la primera', () => {
        for (const p of [0, -2, NaN, null, undefined, 'abc']) {
            expect(paginaSegura(p, 23)).toBe(1);
        }
    });

    it('el texto del rango es el que el usuario lee', () => {
        expect(rangoMostrado(1, 23)).toEqual({ desde: 1, hasta: 10, total: 23 });
        expect(rangoMostrado(3, 23)).toEqual({ desde: 21, hasta: 23, total: 23 });
        expect(rangoMostrado(1, 0)).toEqual({ desde: 0, hasta: 0, total: 0 });
    });

    it('sabe en qué página quedó una empresa', () => {
        expect(paginaDeEmpresa(veintitres, 1)).toBe(1);
        expect(paginaDeEmpresa(veintitres, 11)).toBe(2);
        expect(paginaDeEmpresa(veintitres, 23)).toBe(3);
    });

    it('si la empresa no está en la lista, apunta a la primera página', () => {
        expect(paginaDeEmpresa(veintitres, 9999)).toBe(1);
    });
});

describe('el orden y el paginado trabajan juntos', () => {
    it('la recién creada cae en la primera página de su grupo', () => {
        const grupo = [
            ...Array.from({ length: 22 }, (_, i) => empresa(i + 1, '2026-01-01T00:00:00Z', i)),
            empresa(99, '2026-10-05T09:00:00Z', 364),
        ];
        const ordenado = ordenarGrupo(grupo, HOY);
        expect(paginaDeEmpresa(ordenado, 99)).toBe(1);
        expect(filasDePagina(ordenado, 1)[0].id).toBe(99);
    });
});
