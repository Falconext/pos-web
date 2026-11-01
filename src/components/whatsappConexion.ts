/**
 * "Conectar mi WhatsApp" (Evolution API propio): tipos del contrato del
 * backend (`/whatsapp/conexion`) y reglas puras de la tarjeta, separadas para
 * probarlas sin montar nada.
 */

export type EstadoConexion = 'NO_CONECTADO' | 'CONECTANDO' | 'CONECTADO' | 'DESCONECTADO';

export interface ConexionWhatsapp {
    disponible: boolean;
    proveedor: 'EVOLUTION';
    estado: EstadoConexion;
    numero: string | null;
    nombrePerfil: string | null;
    conectadoEn: string | null;
    desconectadoEn: string | null;
    enviadosHoy: number;
    topeDiario: number;
    takiyActivo: boolean;
    enviarComprobante: boolean;
}

export interface QrWhatsapp {
    estado: EstadoConexion;
    qr: string | null;
    codigoEmparejamiento: string | null;
    expiraEnSeg: number;
}

/** Evento de socket `whatsapp-conexion`. */
export interface EventoConexionWhatsapp {
    estado: EstadoConexion;
    qr: string | null;
    codigoEmparejamiento: string | null;
}

/** Sección de Configuración donde vive la tarjeta (deep-link desde otras pantallas). */
export const RUTA_CONEXION_WHATSAPP = '/administrador/perfil?tab=configuracion&seccion=whatsapp-qr';

/** Ritmo de refresco del QR: el que pide el backend, acotado a 10–60 s. */
export const QR_REFRESCO_POR_DEFECTO = 20;
export function segundosRefrescoQr(expiraEnSeg: number | null | undefined): number {
    const s = Number(expiraEnSeg);
    if (!Number.isFinite(s) || s <= 0) return QR_REFRESCO_POR_DEFECTO;
    return Math.min(60, Math.max(10, Math.round(s)));
}

/**
 * Celular peruano para el código de emparejamiento o la prueba: acepta
 * espacios, `+` y el 51 delante. Devuelve los 9 dígitos o null si no sirve.
 */
export function normalizarCelularPe(valor: string): string | null {
    let d = (valor || '').replace(/\D/g, '');
    if (d.length === 11 && d.startsWith('51')) d = d.slice(2);
    return /^9\d{8}$/.test(d) ? d : null;
}

/** "51987654321" → "+51 987 654 321" (lo que no reconoce lo deja con +). */
export function formatearNumeroWhatsapp(numero: string | null | undefined): string {
    const d = (numero || '').replace(/\D/g, '');
    if (!d) return '';
    const m = /^51(9\d{2})(\d{3})(\d{3})$/.exec(d);
    return m ? `+51 ${m[1]} ${m[2]} ${m[3]}` : `+${d}`;
}

/** "KDRZ6CNB" → "KDRZ-6CNB", como lo muestra WhatsApp. */
export function formatearCodigoEmparejamiento(codigo: string | null | undefined): string {
    const c = (codigo || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return c.length === 8 ? `${c.slice(0, 4)}-${c.slice(4)}` : c;
}

export interface UsoDiario {
    porcentaje: number;
    nivel: 'normal' | 'alto' | 'agotado';
}

/** Uso del tope diario por número (protege el número de bloqueos). */
export function usoDiario(enviadosHoy: number, topeDiario: number): UsoDiario {
    if (!topeDiario || topeDiario <= 0) return { porcentaje: 0, nivel: 'normal' };
    const porcentaje = Math.min(100, Math.max(0, Math.round((enviadosHoy / topeDiario) * 100)));
    const nivel = enviadosHoy >= topeDiario ? 'agotado' : porcentaje >= 80 ? 'alto' : 'normal';
    return { porcentaje, nivel };
}

/** Fecha corta en hora de Lima: "1 nov. 2026, 10:05". */
export function formatearFechaConexion(iso: string | null | undefined): string {
    if (!iso) return '';
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) return '';
    return fecha.toLocaleString('es-PE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Lima',
    });
}
