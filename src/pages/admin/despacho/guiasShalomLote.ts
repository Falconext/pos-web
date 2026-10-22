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
    estadoSunat?: string;
    estadoPagoRaw?: string;
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
 * Celular peruano: 9 dígitos que empiezan con 9 (se acepta con +51 delante).
 * Shalom registra la guía con cualquier número —aceptó "12345" en el QA—, y
 * con uno así el destinatario no recibe sus avisos de llegada.
 */
export const celularValido = (v: string | null | undefined): boolean => {
    let d = String(v ?? '').replace(/\D/g, '');
    if (d.length === 11 && d.startsWith('51')) d = d.slice(2);
    return /^9\d{8}$/.test(d);
};

/**
 * Los despachos de la lista que todavía necesitan guía de Shalom: courier
 * Shalom, en Preparando y sin N° de orden. Las notas que van en el paquete de
 * otra no tienen despacho propio (la guía es la de esa otra nota). Una venta
 * anulada o rechazada por SUNAT no se despacha, aunque su despacho siga en
 * Preparando.
 */
export const pendientesDeGuia = (filas: FilaPanelParaGuia[]): PendienteDeGuia[] => {
    const vistos = new Set<number>();
    const salida: PendienteDeGuia[] = [];
    for (const f of filas ?? []) {
        if (!f.comprobanteId || f.despachoEnComprobanteId) continue;
        if (!COURIERS_SHALOM.has(f.courier)) continue;
        if (f.estadoDespacho !== 'PREPARANDO' || !vacio(f.nroOrden)) continue;
        if (f.estadoSunat === 'ANULADO' || f.estadoSunat === 'RECHAZADO' || f.estadoPagoRaw === 'ANULADO') continue;
        if (vistos.has(f.comprobanteId)) continue;
        vistos.add(f.comprobanteId);
        const celular = !vacio(f.celularDest) ? f.celularDest : (f.clienteTelefono || '');
        const faltan: string[] = [];
        if (vacio(f.agenciaDestino)) faltan.push('agencia de destino');
        if (vacio(celular)) faltan.push('celular');
        else if (!celularValido(celular)) faltan.push(`un celular válido (${celular} no es un celular de 9 dígitos)`);
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
    | { estado: 'omitida'; mensaje: string }
    | { estado: 'detenida' };

/**
 * Shalom ya tenía la guía de este despacho (otra pestaña, la guía automática
 * o un intento que se cortó por tiempo y sí llegó): no es un error, la guía
 * existe.
 */
export const yaTeniaGuia = (mensaje: string) => /ya tiene la gu[ií]a/i.test(mensaje);

/** Cuántos errores iguales seguidos hacen sospechar de la cuenta, no del pedido. */
export const ERRORES_IGUALES_PARA_CORTAR = 3;

/**
 * Errores propios de un pedido (su DNI, su celular, su agencia): que se
 * repitan no dice nada de la cuenta, pueden ser tres clientes sin DNI.
 */
const esErrorDelPedido = (mensaje: string) =>
    /destinatario|destino|celular|DNI|documento|ya tiene la gu[ií]a/i.test(mensaje);

/**
 * Corre el lote de a uno: Shalom Pro abre sesión por cada guía y no aguanta
 * varias a la vez. `detener()` corta antes de la siguiente, nunca a la mitad
 * de una que ya se mandó; las que faltaban quedan como "detenida".
 *
 * También se corta solo si varias seguidas fallan con el mismo error que no
 * es de un pedido (la cuenta Shalom se desconectó, Shalom está caído): con 37
 * pedidos eran 37 errores iguales y varios minutos esperando. Devuelve ese
 * error para explicarlo.
 */
export async function generarEnLote(
    ids: number[],
    crear: (comprobanteId: number) => Promise<{ nroOrden?: string | null }>,
    avisar: (comprobanteId: number, estado: EstadoGuiaLote) => void,
    detenido: () => boolean,
    mensajeDeError: (e: unknown) => string,
): Promise<{ cortadoPor: string | null }> {
    let cortadoPor: string | null = null;
    let ultimo = '';
    let seguidos = 0;
    for (const id of ids) {
        if (detenido() || cortadoPor) {
            avisar(id, { estado: 'detenida' });
            continue;
        }
        avisar(id, { estado: 'generando' });
        try {
            const guia = await crear(id);
            avisar(id, { estado: 'ok', nroOrden: guia?.nroOrden ?? null });
            seguidos = 0;
        } catch (e) {
            const mensaje = mensajeDeError(e);
            avisar(id, yaTeniaGuia(mensaje) ? { estado: 'omitida', mensaje } : { estado: 'error', mensaje });
            if (esErrorDelPedido(mensaje)) {
                seguidos = 0;
            } else {
                seguidos = mensaje === ultimo ? seguidos + 1 : 1;
                if (seguidos >= ERRORES_IGUALES_PARA_CORTAR) cortadoPor = mensaje;
            }
            ultimo = mensaje;
        }
    }
    return { cortadoPor };
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
