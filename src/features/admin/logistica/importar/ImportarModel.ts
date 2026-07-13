export type TipoImport = 'vehiculos' | 'conductores';

export interface IResultadoImport {
  total: number;
  creados: number;
  omitidos: number;
  errores: { fila: number; motivo: string }[];
}

export const COLUMNAS: Record<TipoImport, string[]> = {
  vehiculos: ['Placa', 'Marca', 'Modelo', 'Anio', 'Tipo', 'Combustible', 'CapacidadPesoKg', 'CapacidadVolumenM3'],
  conductores: ['Nombre', 'Apellido', 'DNI', 'Celular', 'Email', 'NroLicencia', 'TipoLicencia'],
};
