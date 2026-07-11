export interface IAlmacen {
  id: number;
  nombre: string;
  codigo?: string;
  tipo?: string;
  direccion: string;
  distrito?: string;
  ciudad?: string;
  departamento?: string;
  activo: boolean;
  lat?: number;
  lng?: number;
  creadoEn: string;
}

export const TIPOS_ALMACEN = [
  { value: 'PRINCIPAL', label: 'Principal' },
  { value: 'SUCURSAL', label: 'Sucursal' },
  { value: 'TRANSITO', label: 'Tránsito / Cross-docking' },
  { value: 'DEVOLUCIONES', label: 'Devoluciones' }
];
