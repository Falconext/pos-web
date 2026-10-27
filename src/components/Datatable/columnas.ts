/**
 * Reglas de presentación compartidas por el encabezado y el cuerpo de la
 * tabla. Viven juntas para que una columna de monto quede alineada a la
 * derecha en las dos partes, y no solo en una.
 */

const normalizar = (key: string) =>
    key.toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

const CLAVES_MONTO = new Set([
    'total', 'importe', 'monto', 'subtotal', 'igv', 'precio', 'preciounitario', 'pu', 'precioventa',
    'venta', 'sale', 'costo', 'costounitario', 'saldo', 'pagado', 'deuda', 'pendiente', 'opergravada',
    'mtoimpventa', 'mtoopergravadas', 'montoigv', 'totalventa', 'totalcompra', 'montototal', 'abono',
]);

/** Columna de dinero: se alinea a la derecha con cifras tabulares. */
export const esColumnaMonto = (key: string) => CLAVES_MONTO.has(normalizar(key));

const CLAVES_PERSONA = new Set(['razonsocial', 'nombreorazonsocial', 'client', 'cliente', 'proveedor']);

/**
 * Columna de persona o empresa: lleva avatar de iniciales. Las pantallas usan
 * de clave tanto el campo (`razonSocial`) como la etiqueta ("Nombre o Razon
 * social"). "Nombre" con mayúscula queda fuera: es la etiqueta de categorías,
 * marcas y planes, que no son personas.
 */
export const esColumnaPersona = (key: string) => key === 'nombre' || CLAVES_PERSONA.has(normalizar(key));

export const iniciales = (texto: string) => {
    const palabras = texto.trim().split(/\s+/).filter((p) => /[a-z0-9]/i.test(p));
    if (palabras.length === 0) return '·';
    if (palabras.length === 1) return palabras[0].slice(0, 2);
    return palabras[0][0] + palabras[1][0];
};

/** Mismo nombre → mismo color de avatar en todas las pantallas (4 tonos). */
export const tonoAvatar = (texto: string) => {
    let h = 0;
    for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) | 0;
    return Math.abs(h) % 4;
};

export type TonoEstado = 'spruce' | 'iris' | 'saffron' | 'ember' | 'plain';

/** Color de la píldora de estado. */
export const tonoEstado = (valor: unknown): TonoEstado => {
    switch (valor) {
        case 'EMITIDO': case 'ACTIVO': case 'ACEPTADO': case 'INGRESO': case 'TRANSFERENCIA':
        case 'SENT': case 'Present': case 'COMPLETADO': case 'PRODUCCIÓN':
            return 'spruce';
        case 'PENDIENTE': case 'PENDIENTE_CONCILIACION': case 'PARTIAL':
            return 'iris';
        case 'PENDIENTE_PAGO': case 'PAGO_PARCIAL': case 'AJUSTE': case 'ENVIANDO': case 'DEMO':
        case 'ANULACION_EN_TRAMITE':
            return 'saffron';
        case 'RECHAZADO': case 'ANULADO': case 'SALIDA': case 'FALLIDO_ENVIO':
        case 'ANULACION_NO_CONFIRMADA': case 'INACTIVO': case 'Leave':
            return 'ember';
        default:
            return 'plain';
    }
};
