export interface IAlmacen {
  id: number;
  nombre: string;
  direccion: string;
  codigoUbicacion?: string;
  capacidadM3?: number;
  activo: boolean;
  lat?: number;
  lng?: number;
  creadoEn: string;
}
