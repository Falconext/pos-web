/**
 * Hasta dónde ve un usuario cuando LEE ventas, del lado del panel.
 *
 * Espejo de `backend/src/common/utils/alcance-lectura.ts`: el supervisor
 * (`convertirEnSupervisor`) lee las ventas de todos y de todas las sedes.
 *
 * Es SOLO LECTURA. Lo que un supervisor puede *hacer* sigue dependiendo de sus
 * propios permisos (anular, por ejemplo, vive en `puedeAnularComprobantes`).
 * Si acá se mostrara un filtro de más, el backend igual recorta: esta función
 * decide qué se dibuja, no qué se permite.
 */

export interface AuthConAlcance {
    rol?: string | null;
    convertirEnSupervisor?: boolean | null;
}

export const esAdministrador = (auth: AuthConAlcance | null | undefined): boolean =>
    auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'ADMIN_SISTEMA';

export const esSupervisor = (auth: AuthConAlcance | null | undefined): boolean =>
    Boolean(auth?.convertirEnSupervisor) && !esAdministrador(auth);

/** ¿Se le muestra el filtro por vendedor y el de sede? */
export const puedeLeerVentasDeTodos = (auth: AuthConAlcance | null | undefined): boolean =>
    esAdministrador(auth) || Boolean(auth?.convertirEnSupervisor);
