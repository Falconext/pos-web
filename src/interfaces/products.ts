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
  stockMinimo?: number
  stockMaximo?: number
  estado: string
  creadoEn: string
  empresaId: number
  costoPromedio?: number
  costoUnitario: number
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
}



export type IFormProduct = {
  productoId: number
  descripcion: string,
  categoriaNombre: string
  categoriaId: string | number | null,
  afectacionNombre: string
  unidadMedidaNombre: string
  estado: string
  tipoAfectacionIGV: string
  precioUnitario: number,
  stock: number,
  stockMinimo?: number,
  stockMaximo?: number,
  codigo: string,
  unidadMedidaId: number
  costoPromedio?: number
  costoUnitario?: number
}
