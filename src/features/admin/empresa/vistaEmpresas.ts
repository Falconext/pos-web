/**
 * Vigentes / vencidas y "más activas" en /administrador/empresas.
 *
 * Con el tiempo se juntan muchas empresas vencidas (demos que no compraron,
 * clientes que no renovaron) y tapaban a las que sí están usando el sistema.
 * La vista por defecto es la de vigentes; las vencidas siguen a un clic.
 *
 * "Activa" se mide con lo que el servidor ya calcula por empresa (`salud`):
 * cuántos comprobantes emitió en los últimos 7 y 30 días.
 */

export type VistaEmpresas = 'VIGENTES' | 'VENCIDAS' | 'TODAS';
export type OrdenEmpresas = 'VENCIMIENTO' | 'ACTIVIDAD';

interface FilaEmpresa {
    diasRestantes?: number | null;
    acceso?: 'vigente' | 'gracia' | 'bloqueada';
    salud?: { ventas7?: number; ventas30?: number; diasSinVender?: number } | null;
}

/** Venció su suscripción (con o sin días de gracia). Sin fecha = vigente. */
export const estaVencida = (e: FilaEmpresa): boolean =>
    e.diasRestantes !== null && e.diasRestantes !== undefined && Number(e.diasRestantes) < 0;

export const pasaVista = (e: FilaEmpresa, vista: VistaEmpresas): boolean => {
    if (vista === 'VIGENTES') return !estaVencida(e);
    if (vista === 'VENCIDAS') return estaVencida(e);
    return true;
};

export const contarPorVista = (filas: FilaEmpresa[]) => {
    const vencidas = filas.filter(estaVencida);
    return {
        vigentes: filas.length - vencidas.length,
        vencidas: vencidas.length,
        todas: filas.length,
        // Dentro de las vencidas: las que todavía pueden entrar (gracia) son
        // las que conviene llamar primero.
        enGracia: vencidas.filter((e) => e.acceso === 'gracia').length,
        sinAcceso: vencidas.filter((e) => e.acceso === 'bloqueada').length,
    };
};

const ventas30 = (e: FilaEmpresa) => Number(e.salud?.ventas30 ?? 0);
const ventas7 = (e: FilaEmpresa) => Number(e.salud?.ventas7 ?? 0);
const diasSinVender = (e: FilaEmpresa) => {
    const d = e.salud?.diasSinVender;
    return d === null || d === undefined ? Number.POSITIVE_INFINITY : Number(d);
};

/** Más comprobantes en 30 días primero; a igualdad, la de la última semana y la que vendió más reciente. */
export const compararActividad = (a: FilaEmpresa, b: FilaEmpresa): number =>
    ventas30(b) - ventas30(a) || ventas7(b) - ventas7(a) || diasSinVender(a) - diasSinVender(b);

export const ordenarPorActividad = <T extends FilaEmpresa>(filas: T[]): T[] => [...filas].sort(compararActividad);

/** Ranking de las que más facturan (solo vigentes y con al menos una venta en 30 días). */
export const masActivas = <T extends FilaEmpresa>(filas: T[], cuantas = 8): T[] =>
    ordenarPorActividad(filas.filter((e) => !estaVencida(e) && ventas30(e) > 0)).slice(0, cuantas);
