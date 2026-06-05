// ─── Types ───────────────────────────────────────────────────────────────────

export interface PnlResponse {
    periodo: { mes: number; anio: number; label: string };
    ventasNetas: number;
    costoMercaderia: number;
    gananciaBruta: number;
    margenBruto: number;
    gastosTotales: number;
    gastosPorCategoria: Array<{ categoria: string; etiqueta: string | null; monto: number }>;
    gananciaNeta: number;
    margenNeto: number;
    comparacion: {
        mesAnterior: { gananciaNeta: number; margenNeto: number } | null;
        variacionMonto: number | null;
        variacionPorcentaje: number | null;
    };
}

export interface EvolucionPoint {
    mes: number;
    anio: number;
    label: string;
    ventasNetas: number;
    gananciaBruta: number;
    gananciaNeta: number;
}

export interface GastoOperativo {
    id: number;
    categoria: string;
    etiqueta: string | null;
    monto: number;
    descripcion: string | null;
    creadoEn: string;
}

export interface GastoFormData {
    mes: number;
    anio: number;
    categoria: string;
    etiqueta?: string;
    monto: number;
    descripcion?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const CATEGORIAS_FIJAS = [
    { key: 'PUBLICIDAD',      label: 'Publicidad',     icon: 'solar:target-bold-duotone' },
    { key: 'SUELDOS',         label: 'Sueldos',        icon: 'solar:users-group-rounded-bold-duotone' },
    { key: 'ENVIOS',          label: 'Envíos',         icon: 'solar:delivery-bold-duotone' },
    { key: 'COMISIONES',      label: 'Comisiones',     icon: 'solar:card-bold-duotone' },
    { key: 'ALQUILER',        label: 'Alquiler',       icon: 'solar:home-bold-duotone' },
    { key: 'OTROS',           label: 'Otros',          icon: 'solar:box-bold-duotone' },
    { key: 'PERSONALIZADA',   label: 'Personalizada',  icon: 'solar:tag-bold-duotone' },
] as const;

export type CategoriaKey = typeof CATEGORIAS_FIJAS[number]['key'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getCategoriaLabel(key: string): string {
    const found = CATEGORIAS_FIJAS.find(c => c.key === key);
    return found ? found.label : key;
}

export function getCategoriaIcon(key: string): string {
    const found = CATEGORIAS_FIJAS.find(c => c.key === key);
    return found ? found.icon : 'solar:box-bold-duotone';
}

export function formatCurrency(value: number): string {
    return `S/ ${value.toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

export function formatPercent(value: number): string {
    return `${Math.abs(value).toFixed(1)}%`;
}

export const MESES_LABELS = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export function getMesLabel(mes: number): string {
    return MESES_LABELS[mes - 1] ?? String(mes);
}

export function getMesFullLabel(mes: number): string {
    const full = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    return full[mes - 1] ?? String(mes);
}
