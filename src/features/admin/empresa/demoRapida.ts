/**
 * Demo rápida y pase a producción en /administrador/empresas.
 *
 * Para la demo se ofrece el plan más completo: que el cliente pruebe todo lo
 * que podría comprar. El plan real se elige al pasarlo a producción.
 */

export interface PlanLite {
    id: number;
    nombre: string;
    costo?: number | string | null;
    producto?: string | null;
    plataforma?: string | null;
    esPrueba?: boolean | null;
    duracionDias?: number | null;
    tipoFacturacion?: string | null;
}

export const DIAS_DEMO = [1, 7, 15, 30] as const;

const costo = (p: PlanLite) => Number(p.costo ?? 0) || 0;

/**
 * Planes vendibles del producto y la marca del admin, del más caro al más
 * barato. Los de costo 0 (prueba, consola de developers, QA) no se venden.
 */
export const planesVendibles = (planes: PlanLite[], producto: string, plataforma: string): PlanLite[] =>
    (Array.isArray(planes) ? planes : [])
        .filter(
            (p) =>
                !p.esPrueba &&
                costo(p) > 0 &&
                String(p.producto || 'facturacion').toLowerCase() === producto.toLowerCase() &&
                String(p.plataforma || 'falconext').toLowerCase() === plataforma.toLowerCase(),
        )
        .sort((a, b) => costo(b) - costo(a) || a.nombre.localeCompare(b.nombre));

/** Corporativo si existe; si no, el más caro. */
export const planParaDemo = (planes: PlanLite[]): PlanLite | undefined =>
    planes.find((p) => /corporativo/i.test(p.nombre)) ?? planes[0];

export const rucCompleto = (ruc: string) => /^\d{11}$/.test(ruc.trim());

/** Texto para pegar en WhatsApp con el acceso de la demo. */
export const mensajeDeAcceso = (d: {
    razonSocial: string;
    email: string;
    password: string;
    vence: string;
    url: string;
    marca: string;
}) => {
    const vence = new Date(d.vence).toLocaleDateString('es-PE', { day: 'numeric', month: 'long' });
    return [
        `¡Hola! Ya está lista la demo de ${d.marca} para ${d.razonSocial}.`,
        '',
        `Ingresa en: ${d.url}`,
        `Usuario: ${d.email}`,
        `Contraseña: ${d.password}`,
        '',
        `La prueba está activa hasta el ${vence}. Los comprobantes que emitas son de prueba y no llegan a SUNAT.`,
    ].join('\n');
};
