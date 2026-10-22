import type { RotuloLoteItem } from './RotulosLotePrint';

/**
 * Guías de Shalom en lote: la parte que no toca la red.
 *
 * IMPORTEMOS JUNTOS (empresa 14) generó 252 guías en 30 días, hasta 37 en un
 * día, abriendo el despacho de cada venta y tocando "Generar guía". Con esto
 * se marcan los despachos de Shalom sin guía y se generan uno tras otro, con
 * la misma llamada que usa el modal de cada despacho.
 */

export const COURIERS_SHALOM = new Set(['SHALOM_PRO', 'SHALOM_COD']);

export interface FilaPanelParaGuia {
    comprobanteId: number | null;
    referencia: string;
    cliente: string;
    courier: string;
    estadoDespacho: string;
    nroOrden: string;
    agenciaDestino: string;
    celularDest: string;
    clienteTelefono: string;
    despachoEnComprobanteId?: number | null;
}

export interface PendienteDeGuia {
    comprobanteId: number;
    referencia: string;
    cliente: string;
    courier: string;
    celular: string;
    agenciaDestino: string;
    /** Lo que ya se sabe que falta: con algo acá Shalom la rechazaría. */
    faltan: string[];
}

const vacio = (v: string | null | undefined) => !v || !String(v).trim() || String(v).trim() === '—';

/**
 * Los despachos de la lista que todavía necesitan guía de Shalom: courier
 * Shalom, en Preparando y sin N° de orden. Las notas que van en el paquete de
 * otra no tienen despacho propio (la guía es la de esa otra nota).
 */
export const pendientesDeGuia = (filas: FilaPanelParaGuia[]): PendienteDeGuia[] => {
    const vistos = new Set<number>();
    const salida: PendienteDeGuia[] = [];
    for (const f of filas ?? []) {
        if (!f.comprobanteId || f.despachoEnComprobanteId) continue;
        if (!COURIERS_SHALOM.has(f.courier)) continue;
        if (f.estadoDespacho !== 'PREPARANDO' || !vacio(f.nroOrden)) continue;
        if (vistos.has(f.comprobanteId)) continue;
        vistos.add(f.comprobanteId);
        const celular = !vacio(f.celularDest) ? f.celularDest : (f.clienteTelefono || '');
        const faltan: string[] = [];
        if (vacio(f.agenciaDestino)) faltan.push('agencia de destino');
        if (vacio(celular)) faltan.push('celular');
        salida.push({
            comprobanteId: f.comprobanteId,
            referencia: f.referencia,
            cliente: f.cliente || '',
            courier: f.courier,
            celular,
            agenciaDestino: vacio(f.agenciaDestino) ? '' : f.agenciaDestino,
            faltan,
        });
    }
    return salida;
};

export type EstadoGuiaLote =
    | { estado: 'esperando' }
    | { estado: 'generando' }
    | { estado: 'ok'; nroOrden: string | null }
    | { estado: 'error'; mensaje: string }
    | { estado: 'omitida'; mensaje: string };

/**
 * Shalom ya tenía la guía de este despacho (otra pestaña, la guía automática
 * o un intento que se cortó por tiempo y sí llegó): no es un error, la guía
 * existe.
 */
export const yaTeniaGuia = (mensaje: string) => /ya tiene la gu[ií]a/i.test(mensaje);

/**
 * Corre el lote de a uno: Shalom Pro abre sesión por cada guía y no aguanta
 * varias a la vez. `detener()` corta antes de la siguiente, nunca a la mitad
 * de una que ya se mandó.
 */
export async function generarEnLote(
    ids: number[],
    crear: (comprobanteId: number) => Promise<{ nroOrden?: string | null }>,
    avisar: (comprobanteId: number, estado: EstadoGuiaLote) => void,
    detenido: () => boolean,
    mensajeDeError: (e: unknown) => string,
): Promise<void> {
    for (const id of ids) {
        if (detenido()) break;
        avisar(id, { estado: 'generando' });
        try {
            const guia = await crear(id);
            avisar(id, { estado: 'ok', nroOrden: guia?.nroOrden ?? null });
        } catch (e) {
            const mensaje = mensajeDeError(e);
            avisar(id, yaTeniaGuia(mensaje) ? { estado: 'omitida', mensaje } : { estado: 'error', mensaje });
        }
    }
}

/** Para imprimir después los rótulos de las que salieron bien. */
export const rotulosDeGeneradas = (
    pendientes: PendienteDeGuia[],
    estados: Record<number, EstadoGuiaLote>,
): RotuloLoteItem[] =>
    pendientes
        .filter((p) => estados[p.comprobanteId]?.estado === 'ok')
        .map((p) => ({
            comprobanteId: p.comprobanteId,
            referencia: p.referencia,
            courier: p.courier,
            celular: p.celular,
        }));
