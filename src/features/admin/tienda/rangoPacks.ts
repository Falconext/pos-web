/**
 * Rangos del reporte de packs más vendidos, en días de Lima (YYYY-MM-DD), que
 * es como los interpreta el backend (dashboard.parseRange).
 */
export type RangoPacks = 'hoy' | '7d' | 'mes' | 'mes-pasado' | '90d' | 'anio';

export const RANGOS_PACKS: { id: RangoPacks; label: string }[] = [
    { id: 'hoy', label: 'Hoy' },
    { id: '7d', label: '7 días' },
    { id: 'mes', label: 'Este mes' },
    { id: 'mes-pasado', label: 'Mes pasado' },
    { id: '90d', label: '90 días' },
    { id: 'anio', label: 'Este año' },
];

const DIA = 86_400_000;

/** Fecha de Lima (UTC-5, sin horario de verano) como YYYY-MM-DD. */
export const diaLima = (d: Date): string => new Date(d.getTime() - 5 * 3_600_000).toISOString().slice(0, 10);

export function fechasDeRango(rango: RangoPacks, ahora: Date = new Date()): { fechaInicio: string; fechaFin: string } {
    const hoy = diaLima(ahora);
    const [y, m] = hoy.split('-').map(Number);
    const pad = (n: number) => String(n).padStart(2, '0');
    switch (rango) {
        case 'hoy':
            return { fechaInicio: hoy, fechaFin: hoy };
        case '7d':
            return { fechaInicio: diaLima(new Date(ahora.getTime() - 6 * DIA)), fechaFin: hoy };
        case '90d':
            return { fechaInicio: diaLima(new Date(ahora.getTime() - 89 * DIA)), fechaFin: hoy };
        case 'mes-pasado': {
            const py = m === 1 ? y - 1 : y;
            const pm = m === 1 ? 12 : m - 1;
            const ultimo = new Date(Date.UTC(py, pm, 0)).getUTCDate();
            return { fechaInicio: `${py}-${pad(pm)}-01`, fechaFin: `${py}-${pad(pm)}-${pad(ultimo)}` };
        }
        case 'anio':
            return { fechaInicio: `${y}-01-01`, fechaFin: hoy };
        case 'mes':
        default:
            return { fechaInicio: `${y}-${pad(m)}-01`, fechaFin: hoy };
    }
}
