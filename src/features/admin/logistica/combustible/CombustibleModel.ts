export interface ICombustible {
  id: number;
  vehiculoId: number;
  fecha: string; // ISO
  tipoCombustible: string;
  cantidadLitros: number | string;
  costoTotal: number | string;
  costoPorLitro?: number | string;
  odometroKm?: number;
  estacion?: string;
  numeroComprobante?: string;
  notas?: string;
  creadoEn: string;
  vehiculo?: { id: number; placa: string; marca: string; modelo?: string };
}

export interface IResumenCombustible {
  registrosMes: number;
  gastoMes: number;
  litrosMes: number;
  gastoTotal: number;
}

export const TIPOS_COMBUSTIBLE = [
  { value: 'GASOLINA', label: 'Gasolina' },
  { value: 'DIESEL', label: 'Diésel' },
  { value: 'GLP', label: 'GLP' },
  { value: 'GNV', label: 'GNV' },
  { value: 'ELECTRICO', label: 'Eléctrico' },
  { value: 'HIBRIDO', label: 'Híbrido' },
];
