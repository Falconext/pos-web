export interface IPedidoItem {
  sku?: string;
  descripcion: string;
  cantidad: number;
  pesoUnitarioKg?: number;
  volumenUnitarioM3?: number;
  valorDeclarado?: number;
}

export interface IPedidoLogistica {
  id: number;
  codigo: string;
  clienteId: number;
  cliente: {
    id: number;
    nombre: string;
    nroDocumento?: string;
  };
  direccionEntregaId?: number;
  direccionEntrega?: {
    id: number;
    direccion: string;
    referencia?: string;
  };
  nroOrdenExterna?: string;
  fechaSolicitada?: string;
  ventanaInicio?: string;
  ventanaFin?: string;
  prioridad: string; // BAJA, MEDIA, ALTA, URGENTE
  esUrgente?: boolean;
  requiereFirma?: boolean;
  requiereFoto?: boolean;
  cobroContraEntrega?: boolean;
  estado: string; // ver ESTADOS_PEDIDO
  pesoTotalKg?: number;
  volumenTotalM3?: number;
  items?: IPedidoItem[];
  notasCliente?: string;
  notasInternas?: string;
  motivoFallo?: string;
  creadoEn: string;
}

// EstadoPedidoLogistica (enum backend)
export const ESTADOS_PEDIDO = [
  { value: 'PENDIENTE', label: 'Pendiente', color: 'gray' },
  { value: 'VALIDADO', label: 'Validado', color: 'blue' },
  { value: 'ASIGNADO', label: 'Asignado', color: 'blue' },
  { value: 'LISTO_RECOGER', label: 'Listo p/ Recoger', color: 'indigo' },
  { value: 'RECOGIDO', label: 'Recogido', color: 'indigo' },
  { value: 'EN_TRANSITO', label: 'En Tránsito', color: 'indigo' },
  { value: 'LLEGANDO', label: 'Llegando', color: 'indigo' },
  { value: 'EN_UBICACION', label: 'En Ubicación', color: 'indigo' },
  { value: 'ENTREGADO', label: 'Entregado', color: 'green' },
  { value: 'ENTREGA_PARCIAL', label: 'Entrega Parcial', color: 'amber' },
  { value: 'FALLIDO', label: 'Fallido', color: 'red' },
  { value: 'DEVUELTO', label: 'Devuelto', color: 'red' },
  { value: 'REPROGRAMADO', label: 'Reprogramado', color: 'amber' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'gray' }
];

// Estados terminales (sin más transiciones / sin confirmación de entrega)
export const ESTADOS_TERMINALES = ['ENTREGADO', 'FALLIDO', 'DEVUELTO', 'CANCELADO'];

export const PRIORIDADES_PEDIDO = [
  { value: 'BAJA', label: 'Baja', color: 'gray' },
  { value: 'MEDIA', label: 'Media', color: 'blue' },
  { value: 'ALTA', label: 'Alta', color: 'orange' },
  { value: 'URGENTE', label: 'Urgente', color: 'red' }
];

export const METODOS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'YAPE', label: 'Yape' },
  { value: 'PLIN', label: 'Plin' },
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' }
];
