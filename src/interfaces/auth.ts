export interface Auth {
    token: string
    refreshToken: string
    user: IUser
}

export interface ISede {
    id: number
    nombre: string
    codigo: string | null
    esPrincipal: boolean
    activo: boolean
}

export interface IUser {
    id: number
    nombre: string
    email: string
    rol: 'ADMIN_SISTEMA' | 'ADMIN_EMPRESA' | 'USUARIO_EMPRESA' | 'RESELLER'
    empresaId: any
    resellerId?: number
    estado: string
    empresa: any
    usuario: any
    permisos?: string[]
    sedes?: ISede[]
    subModulos?: { id: number; codigo: string; nombre: string; moduloId: number }[]
}

export interface IResponse {
    code: number;
    data: any;
    total?: number;
    message: string
    status: number
}

export interface IEmail {
    correo: string
}