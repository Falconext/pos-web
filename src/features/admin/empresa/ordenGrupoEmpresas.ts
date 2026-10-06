/**
 * Orden y paginado de cada grupo de planes en /administrador/empresas.
 *
 * El listado agrupa por tipo de cliente (DEMO / MENSUAL / ANUAL) y ordena cada
 * grupo por vencimiento, que es lo correcto para cobrar: lo que vence primero,
 * arriba. El efecto no buscado es que una empresa recién creada —la que tiene
 * el vencimiento más lejano de todas— cae al final del grupo. Como además solo
 * se mostraban las 5 primeras, el que la acababa de dar de alta no la veía.
 *
 * Acá viven tres reglas: cuáles son "nuevas", cómo se ordena cada grupo y cómo
 * se parte en páginas.
 */

/** Una empresa se considera nueva durante sus primeros días de alta. */
export const DIAS_PARA_NUEVA = 7;

/** Filas por página dentro de cada grupo. */
export const POR_PAGINA = 10;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

const fechaDeAlta = (empresa: any): Date | null => {
    const valor = empresa?.fechaActivacion ?? empresa?.creadoEn ?? null;
    if (!valor) return null;
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
};

/** Días transcurridos desde el alta. `null` si no se puede saber. */
export const diasDesdeElAlta = (empresa: any, hoy: Date = new Date()): number | null => {
    const alta = fechaDeAlta(empresa);
    if (!alta) return null;
    return Math.floor((hoy.getTime() - alta.getTime()) / MS_POR_DIA);
};

/**
 * Recién dada de alta. Una fecha futura también cuenta como nueva: se da de
 * alta con activación adelantada y seguiría siendo la última de la lista.
 */
export const esEmpresaNueva = (
    empresa: any,
    hoy: Date = new Date(),
    dias: number = DIAS_PARA_NUEVA,
): boolean => {
    const transcurridos = diasDesdeElAlta(empresa, hoy);
    if (transcurridos === null) return false;
    return transcurridos <= dias;
};

const vencimientoDe = (empresa: any): number => {
    const dias = empresa?.diasRestantes;
    return dias === null || dias === undefined ? Number.POSITIVE_INFINITY : Number(dias);
};

/**
 * Las nuevas primero (la más reciente arriba) y después el resto por
 * vencimiento. Así el que acaba de dar de alta a un cliente lo ve sin buscar,
 * y la lista de cobranza de siempre queda intacta debajo.
 */
export const ordenarGrupo = <T extends Record<string, any>>(empresas: T[], hoy: Date = new Date()): T[] => {
    const lista = Array.isArray(empresas) ? [...empresas] : [];
    return lista.sort((a, b) => {
        const nuevaA = esEmpresaNueva(a, hoy);
        const nuevaB = esEmpresaNueva(b, hoy);
        if (nuevaA !== nuevaB) return nuevaA ? -1 : 1;
        if (nuevaA && nuevaB) {
            const altaA = fechaDeAlta(a)?.getTime() ?? 0;
            const altaB = fechaDeAlta(b)?.getTime() ?? 0;
            if (altaA !== altaB) return altaB - altaA;
        }
        return vencimientoDe(a) - vencimientoDe(b);
    });
};

export const totalDePaginas = (cantidad: number, porPagina: number = POR_PAGINA): number =>
    Math.max(1, Math.ceil(Math.max(0, Number(cantidad) || 0) / Math.max(1, porPagina)));

/** Mantiene la página dentro de lo que existe (al filtrar, la lista se acorta). */
export const paginaSegura = (pagina: unknown, cantidad: number, porPagina: number = POR_PAGINA): number => {
    const pedida = Math.trunc(Number(pagina));
    if (!Number.isFinite(pedida) || pedida < 1) return 1;
    return Math.min(pedida, totalDePaginas(cantidad, porPagina));
};

export const filasDePagina = <T>(empresas: T[], pagina: unknown, porPagina: number = POR_PAGINA): T[] => {
    const lista = Array.isArray(empresas) ? empresas : [];
    const actual = paginaSegura(pagina, lista.length, porPagina);
    const desde = (actual - 1) * porPagina;
    return lista.slice(desde, desde + porPagina);
};

/** En qué página quedó una empresa, para saltar ahí después de crearla. */
export const paginaDeEmpresa = (
    empresas: any[],
    empresaId: unknown,
    porPagina: number = POR_PAGINA,
): number => {
    const lista = Array.isArray(empresas) ? empresas : [];
    const indice = lista.findIndex((e) => Number(e?.id) === Number(empresaId));
    if (indice < 0) return 1;
    return Math.floor(indice / porPagina) + 1;
};

/** "Mostrando 1–10 de 23" */
export const rangoMostrado = (pagina: unknown, cantidad: number, porPagina: number = POR_PAGINA) => {
    const total = Math.max(0, Number(cantidad) || 0);
    if (total === 0) return { desde: 0, hasta: 0, total };
    const actual = paginaSegura(pagina, total, porPagina);
    const desde = (actual - 1) * porPagina + 1;
    return { desde, hasta: Math.min(desde + porPagina - 1, total), total };
};
