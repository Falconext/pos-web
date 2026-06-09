export type PlataformaAds = 'META' | 'TIKTOK';
export type EstadoCampana = 'ACTIVA' | 'PAUSADA';

export interface CampanaProducto {
  id: number;
  descripcion: string;
  precioUnitario: number;
  costoUnitario: number;
  costoFijo: number;
}

export interface PnlUnidad {
  precio: number;
  costoProducto: number;
  costoFijo: number;
  comisionVenta: number;
  cpa: number;
  gananciaReal: number;
}

export interface Campana {
  id: number;
  nombre: string;
  plataforma: PlataformaAds;
  producto: CampanaProducto | null;
  presupuestoDiario: number;
  moneda: string;
  fechaInicio: string;
  estado: EstadoCampana;
  diasActivos: number;
  diasProyectados: number;
  gastoEstimado: number;
  ventasAtribuidas: number;
  cpa: number;
  pnlUnidad: PnlUnidad | null;
}

export interface ResumenCampanas {
  gastoTotalEstimado: number;
  ventasAtribuidas: number;
  cpaPromedio: number;
  roas: number;
}

export interface ListaCampanasResponse {
  mes: number;
  anio: number;
  resumen: ResumenCampanas;
  campanas: Campana[];
}

export interface CampanaForm {
  nombre: string;
  plataforma: PlataformaAds;
  productoId: number | null;
  presupuestoDiario: number;
  moneda: 'PEN' | 'USD';
  fechaInicio: string;
}

export const initialCampanaForm: CampanaForm = {
  nombre: '',
  plataforma: 'META',
  productoId: null,
  presupuestoDiario: 0,
  moneda: 'PEN',
  fechaInicio: new Date().toISOString().slice(0, 10),
};

export const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export function formatCurrency(n: number, moneda = 'PEN') {
  const sym = moneda === 'USD' ? '$' : 'S/';
  return `${sym} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
