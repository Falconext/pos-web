export interface IGeocerca {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo: string; // CIRCULO | POLIGONO
  lat?: number | string;
  lng?: number | string;
  radio?: number | string;
  coordenadas?: string;
  color?: string;
  activo: boolean;
  creadoEn: string;
  _count?: { eventos: number };
}

export interface IEventoGeocerca {
  id: number;
  tipo: string; // ENTRADA | SALIDA
  lat: number | string;
  lng: number | string;
  timestamp: string;
  geocerca?: { id: number; nombre: string };
  dispositivo?: { id: number; nombre: string };
}

export interface IResumenGeocercas {
  total: number;
  activas: number;
  eventos: number;
}

export const TIPOS_GEOCERCA = [
  { value: 'CIRCULO', label: 'Círculo' },
  { value: 'POLIGONO', label: 'Polígono' },
];
