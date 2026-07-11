export interface IDireccionCliente {
  id: number;
  direccion: string;
  referencia?: string;
  distrito?: string;
  lat?: number;
  lng?: number;
}

export interface IClienteLogistica {
  id: number;
  nombre: string;
  tipoDocumento?: string;
  nroDocumento?: string;
  email?: string;
  celular?: string;
  whatsapp?: string;
  scoreConfianza?: number;
  direcciones?: IDireccionCliente[];
  activo: boolean;
  creadoEn: string;
}
