export interface Auth {
    token: string
    refreshToken: string
    user: IUser
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
    permisos?: string[]
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