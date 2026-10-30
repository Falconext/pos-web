/**
 * El historial de una empresa guarda `detalle` tal como lo manda el servidor.
 * Al cambiar las series SUNAT se guarda la lista completa en JSON, y el cajón
 * la mostraba cruda ([{"tipoDoc":"01","serie":"F0A1",...}]). Acá se traduce a
 * algo legible: "Factura F0A1", "Boleta B0A1"...
 */

const NOMBRE_DOC: Record<string, string> = {
    '01': 'Factura',
    '03': 'Boleta',
    '07:01': 'NC factura',
    '07:03': 'NC boleta',
    '08:01': 'ND factura',
    '08:03': 'ND boleta',
    '09': 'Guía remitente',
    '31': 'Guía transportista',
};

export interface SerieDelLog {
    texto: string;
    activo: boolean;
}

export type DetalleDelLog =
    | { tipo: 'series'; series: SerieDelLog[] }
    | { tipo: 'texto'; texto: string };

const aSeries = (valor: unknown): SerieDelLog[] | null => {
    if (!Array.isArray(valor)) return null;
    const series = valor
        .filter((s) => s && typeof s === 'object' && typeof (s as any).serie === 'string')
        .map((s: any) => ({
            texto: `${NOMBRE_DOC[String(s.tipoDoc)] ?? `Tipo ${s.tipoDoc}`} ${s.serie}`,
            activo: s.activo !== false,
        }));
    return series.length === valor.length ? series : null;
};

export const detalleDelLog = (accion: string, detalle?: string | null): DetalleDelLog | null => {
    if (!detalle) return null;
    if (accion === 'SERIES_SUNAT_ACTUALIZADAS') {
        try {
            const series = aSeries(JSON.parse(detalle));
            if (series) return { tipo: 'series', series };
        } catch {
            // detalle viejo o a mano: se muestra tal cual
        }
    }
    return { tipo: 'texto', texto: detalle };
};
