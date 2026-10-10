interface IDocument {
  id: number
  codigo: string
  descripcion: string
}

export type IClient = {
    id: number
    nombre: string
    /** Apodo con el que el negocio lo reconoce; se busca igual que el nombre. */
    alias?: string | null
    nroDoc: string
    direccion: any
    departamento: string
    distrito: string
    provincia: any
    ubigeo: any
    email: string
    persona: string
    telefono: string
    estado: string
    tipoDocumentoId: number
    empresaId: number
    tipoDocumento: IDocument
    /** Agente de Retención del IGV: al pagarnos nos retiene el 3%. */
    esAgenteRetencion?: boolean
  }
  
  
  export type IFormClient = {
    id: number
    nombre: string
    /** Nombre corto con el que el negocio reconoce al cliente; se busca igual que el nombre. */
    alias?: string | null
    persona: string
    nroDoc: string
    direccion: any
    departamento: string
    distrito: string
    tipoDoc: string
    provincia: any
    ubigeo: any
    email: string
    telefono: string
    estado: string
    tipoDocumentoId: number
    empresaId: number
    tipoDocumento: IDocument
    /** Agente de Retención del IGV: al pagarnos nos retiene el 3%. */
    esAgenteRetencion?: boolean
  }
