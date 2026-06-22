export type IProduct = {
  id: number
  codigo: string
  descripcion: string
  categoriaId: number
  unidadMedidaId: number
  tipoAfectacionIGV: string
  precioUnitario: string
  valorUnitario: string
  igvPorcentaje: string
  stock: number
  stockBase?: number
  stockReservado?: number
  stockDisponibleVenta?: number
  localizacion?: string
  porcentajeVenta?: number
  porcentajeProvision?: number
  loteFefoCodigo?: string | null
  loteFefoVencimiento?: string | Date | null
  loteFefoCostoUnitario?: number | null
  stockMinimo?: number
  stockMaximo?: number
  estado: string
  creadoEn: string
  empresaId: number
  costoPromedio?: number
  costoUnitario: number
  costoFijo?: number
  comisionPorVenta?: number
  comisionPorcentaje?: number
  imagenUrl?: string | null
  imagenUrlDisplay?: string | null
  imagenesExtra?: string[]
  unidadMedida: {
    id: number
    codigo: string
    nombre: string
  }
  categoria: {
    id: number
    nombre: string
    empresaId: number
  }
  marca?: {
    id: number
    nombre: string
  }
  // Campos Farmacia
  principioActivo?: string
  concentracion?: string
  presentacion?: string
  laboratorio?: string
  // Campos Bodega/Supermercado
  codigoBarras?: string
  unidadCompra?: string
  unidadVenta?: string
  factorConversion?: number
  // Campos Ofertas
  precioOferta?: number
  fechaInicioOferta?: string | Date
  fechaFinOferta?: string | Date
  // Precios por Mayorista
  preciosMayorista?: { cantidadMinima: number; precio: number }[]
  atributosTecnicos?: Record<string, string | number | boolean | null>
  descripcionLarga?: string | null
  opcionesAtributos?: any
  valoresAtributos?: any
  productoPadreId?: number | null
  variantes?: IProduct[]
}



export type IFormProduct = {
  productoId: number
  descripcion: string,
  categoriaNombre: string
  categoriaId: string | number | null,
  marcaNombre?: string
  marcaId?: number | null,
  afectacionNombre: string
  unidadMedidaNombre: string
  estado: string
  tipoAfectacionIGV: string
  precioUnitario: number,
  stock: number,
  localizacion?: string,
  porcentajeVenta?: number,
  porcentajeProvision?: number,
  stockMinimo?: number,
  stockMaximo?: number,
  codigo: string,
  unidadMedidaId: number
  costoPromedio?: number
  costoUnitario?: number
  costoFijo?: number
  comisionPorVenta?: number
  comisionPorcentaje?: number
  imagenUrl?: string | null
  // Campos Farmacia
  principioActivo?: string
  concentracion?: string
  presentacion?: string
  laboratorio?: string
  // Campos Bodega/Supermercado
  codigoBarras?: string
  unidadCompra?: string
  unidadVenta?: string
  factorConversion?: number
  // Campos Ofertas
  precioOferta?: number
  fechaInicioOferta?: string | Date
  fechaFinOferta?: string | Date
  // Precios por Mayorista
  preciosMayorista?: { cantidadMinima: number; precio: number }[]
  atributosTecnicos?: Record<string, string | number | boolean | null>
  descripcionLarga?: string | null
  opcionesAtributos?: any
  valoresAtributos?: any
  productoPadreId?: number | null
  variantesConfig?: any[]
}
