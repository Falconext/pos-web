export interface IZona {
  id: number;
  nombre: string;
  codigo?: string;
  color?: string;
  costoBase?: number;
  costoPorKm?: number;
  dificultad?: string;
  activa: boolean;
  creadoEn: string;
}

export const DIFICULTADES_ZONA = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' }
];
