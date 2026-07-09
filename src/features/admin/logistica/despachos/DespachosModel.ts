import { IConductor } from '../conductores/ConductoresModel';
import { IVehiculo } from '../vehiculos/VehiculosModel';

export interface IDespacho {
  id: number;
  codigo: string;
  fechaProgramada: string;
  estado: string; // PROGRAMADO, EN_CURSO, COMPLETADO, CANCELADO
  
  conductorId?: number;
  conductor?: IConductor;
  
  vehiculoId?: number;
  vehiculo?: IVehiculo;
  
  almacenOrigenId?: number;
  almacenOrigen?: { id: number; nombre: string };
  
  kilometrajeInicial?: number;
  kilometrajeFinal?: number;
  
  notas?: string;
  creadoEn: string;
  
  _count?: {
    pedidos: number;
  };
}

export const ESTADOS_DESPACHO = [
  { value: 'PROGRAMADO', label: 'Programado', color: 'gray' },
  { value: 'EN_CURSO', label: 'En Curso', color: 'blue' },
  { value: 'COMPLETADO', label: 'Completado', color: 'green' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'red' }
];
