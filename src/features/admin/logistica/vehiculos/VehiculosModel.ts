export interface IVehiculo {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  anio?: number;
  tipo: string; // MOTO, AUTO, CAMIONETA, CAMION_LIGERO, CAMION_PESADO
  capacidadCargaKg?: number;
  capacidadVolumenM3?: number;
  tipoCombustible?: string; // GASOLINA, DIESEL, GNV, GLP, ELECTRICO
  kilometrajeActual?: number;
  estado: string; // DISPONIBLE, EN_RUTA, MANTENIMIENTO, INACTIVO
  activo: boolean;
  creadoEn: string;
}

export const TIPOS_VEHICULO = [
  { value: 'MOTO', label: 'Motocicleta' },
  { value: 'AUTO', label: 'Automóvil' },
  { value: 'CAMIONETA', label: 'Camioneta / SUV' },
  { value: 'CAMION_LIGERO', label: 'Camión Ligero' },
  { value: 'CAMION_PESADO', label: 'Camión Pesado' }
];

export const ESTADOS_VEHICULO = [
  { value: 'DISPONIBLE', label: 'Disponible', color: 'green' },
  { value: 'EN_RUTA', label: 'En Ruta', color: 'blue' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento', color: 'amber' },
  { value: 'INACTIVO', label: 'Inactivo', color: 'gray' }
];
