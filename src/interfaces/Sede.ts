export interface Sede {
    id: number;
    empresaId: number;
    nombre: string;
    direccion: string | null;
    codigoSunat: string | null;
    esPrincipal: boolean;
    estado: 'ACTIVO' | 'INACTIVO';
    creadoEn?: string;
    actualizadoEn?: string;
}

export interface CreateSedeDto {
    nombre: string;
    direccion?: string;
    codigoSunat?: string;
    esPrincipal?: boolean;
}

export interface UpdateSedeDto extends Partial<CreateSedeDto> {
    estado?: 'ACTIVO' | 'INACTIVO';
}
