export interface IZona {
  id: number;
  nombre: string;
  descripcion?: string;
  poligonoGeojson?: any;
  tarifaBase?: number;
  activa: boolean;
  creadoEn: string;
}
