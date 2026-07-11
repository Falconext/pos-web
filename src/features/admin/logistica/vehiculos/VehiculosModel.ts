export interface ITipoVehiculo {
  id: number;
  nombre: string;
  capacidadPesoKg?: number;
  capacidadVolumenM3?: number;
  costoPromedioKm?: number;
}

export interface IVehiculo {
  id: number;
  placa: string;
  marca: string;
  modelo?: string;
  anio?: number;
  tipoVehiculoId?: number;
  tipoVehiculo?: ITipoVehiculo;
  capacidadPesoKg?: number;
  capacidadVolumenM3?: number;
  tipoCombustible?: string; // GASOLINA, DIESEL, GLP, GNV, ELECTRICO, HIBRIDO
  tieneRefrigeracion?: boolean;
  tieneGPSIntegrado?: boolean;
  kilometrajeActual?: number;
  estado: string; // DISPONIBLE, EN_USO, MANTENIMIENTO, AVERIADO, FUERA_SERVICIO
  activo: boolean;
  creadoEn: string;
}

// EstadoVehiculoLogistica (enum backend)
export const ESTADOS_VEHICULO = [
  { value: 'DISPONIBLE', label: 'Disponible', color: 'green' },
  { value: 'EN_USO', label: 'En Uso', color: 'blue' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento', color: 'amber' },
  { value: 'AVERIADO', label: 'Averiado', color: 'red' },
  { value: 'FUERA_SERVICIO', label: 'Fuera de Servicio', color: 'gray' }
];

// TipoCombustibleLogistica (enum backend)
export const TIPOS_COMBUSTIBLE = [
  { value: 'GASOLINA', label: 'Gasolina' },
  { value: 'DIESEL', label: 'Diésel' },
  { value: 'GLP', label: 'GLP' },
  { value: 'GNV', label: 'GNV' },
  { value: 'ELECTRICO', label: 'Eléctrico' },
  { value: 'HIBRIDO', label: 'Híbrido' }
];
