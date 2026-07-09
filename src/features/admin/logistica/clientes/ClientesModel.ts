export interface IClienteLogistica {
  id: number;
  nombre: string;
  nroDocumento: string;
  tipoDocumento: string;
  telefono?: string;
  email?: string;
  direccionPrincipal?: string;
  lat?: number;
  lng?: number;
  zonaId?: number;
  zona?: {
    id: number;
    nombre: string;
  };
  notas?: string;
  activo: boolean;
  creadoEn: string;
}
