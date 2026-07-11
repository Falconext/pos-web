import { IConductor } from '../conductores/ConductoresModel';
import { IVehiculo } from '../vehiculos/VehiculosModel';

export interface IDespacho {
  id: number;
  codigo: string;
  nombre?: string;
  fechaProgramada: string;
  horaInicioProgramada?: string;
  estado: string; // ver ESTADOS_DESPACHO

  conductorId?: number;
  conductor?: IConductor;

  vehiculoId?: number;
  vehiculo?: IVehiculo;

  almacenOrigenId?: number;
  almacenOrigen?: { id: number; nombre: string };

  almacenDestinoId?: number;
  almacenDestino?: { id: number; nombre: string };

  notas?: string;
  creadoEn: string;

  _count?: {
    pedidos: number;
  };
}

// EstadoDespachoLogistica (enum backend)
export const ESTADOS_DESPACHO = [
  { value: 'BORRADOR', label: 'Borrador', color: 'gray' },
  { value: 'PLANIFICADO', label: 'Planificado', color: 'gray' },
  { value: 'APROBADO', label: 'Aprobado', color: 'blue' },
  { value: 'CARGANDO', label: 'Cargando', color: 'blue' },
  { value: 'LISTO', label: 'Listo', color: 'blue' },
  { value: 'EN_CURSO', label: 'En Curso', color: 'blue' },
  { value: 'COMPLETADO', label: 'Completado', color: 'green' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'red' }
];
