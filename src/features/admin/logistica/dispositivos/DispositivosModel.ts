export interface IDispositivo {
  id: number;
  nombre: string;
  identificador: string;
  token: string;
  vehiculoId?: number;
  activo: boolean;
  online?: boolean;
  ultimaConexion?: string;
  ultimaLat?: number | string;
  ultimaLng?: number | string;
  creadoEn: string;
  vehiculo?: { id: number; placa: string };
  _count?: { posiciones: number };
}

export interface IResumenDispositivos {
  total: number;
  online: number;
  offline: number;
}
