export interface IPedidoLogistica {
  id: number;
  codigo: string;
  clienteId: number;
  cliente: {
    id: number;
    nombre: string;
    nroDocumento: string;
  };
  zonaId?: number;
  zona?: {
    id: number;
    nombre: string;
  };
  direccionEntrega: string;
  lat?: number;
  lng?: number;
  fechaPrometida?: string;
  ventanaInicio?: string;
  ventanaFin?: string;
  prioridad: string; // BAJA, MEDIA, ALTA, URGENTE
  estado: string; // PENDIENTE, ASIGNADO, EN_RUTA, ENTREGADO, FALLIDO, CANCELADO
  pesoTotalKg?: number;
  volumenTotalM3?: number;
  bultos?: number;
  origenVentaId?: number;
  notas?: string;
  motivoFallo?: string;
  creadoEn: string;
}

export const ESTADOS_PEDIDO = [
  { value: 'PENDIENTE', label: 'Pendiente', color: 'gray' },
  { value: 'ASIGNADO', label: 'Asignado', color: 'blue' },
  { value: 'EN_RUTA', label: 'En Ruta', color: 'indigo' },
  { value: 'ENTREGADO', label: 'Entregado', color: 'green' },
  { value: 'FALLIDO', label: 'Fallido', color: 'red' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'gray' }
];

export const PRIORIDADES_PEDIDO = [
  { value: 'BAJA', label: 'Baja', color: 'gray' },
  { value: 'MEDIA', label: 'Media', color: 'blue' },
  { value: 'ALTA', label: 'Alta', color: 'orange' },
  { value: 'URGENTE', label: 'Urgente', color: 'red' }
];
