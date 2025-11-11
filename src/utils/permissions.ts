// Utilidades para manejo de permisos de usuarios

export interface IUserPermissions {
  permisos?: string[];
  rol?: 'ADMIN_SISTEMA' | 'ADMIN_EMPRESA' | 'USUARIO_EMPRESA';
}

const PERM_MAP: Record<string, string> = {
  ventas: 'comprobantes',
  productos: 'kardex',
};

const normalizePerms = (perms: string[] = []): string[] => {
  const mapped = perms.map((p) => PERM_MAP[p] ?? p);
  return Array.from(new Set(mapped));
};

/**
 * Verifica si un usuario tiene permiso para acceder a un módulo específico
 */
export const hasPermission = (user: IUserPermissions | null, modulo: string): boolean => {
  // Si no hay usuario, no tiene acceso
  if (!user) return false;
  
  // Si es admin del sistema o de la empresa, tiene acceso completo
  if (user.rol === 'ADMIN_EMPRESA' || user.rol === 'ADMIN_SISTEMA') return true;
  
  // Si no tiene permisos definidos, no tiene acceso
  if (!user.permisos || user.permisos.length === 0) return false;
  
  // Si tiene acceso completo (*)
  if (user.permisos.includes('*')) return true;
  
  // Si tiene permiso específico al módulo
  const normalized = normalizePerms(user.permisos);
  return normalized.includes(modulo);
};

/**
 * Obtiene los módulos disponibles según los permisos del usuario
 */
export const getAvailableModules = (user: IUserPermissions | null): string[] => {
  if (!user) return [];
  
  // Si es admin, tiene acceso a todos
  if (user.rol === 'ADMIN_EMPRESA' || user.rol === 'ADMIN_SISTEMA') {
    return ['dashboard', 'comprobantes', 'clientes', 'kardex', 'reportes', 'configuracion', 'usuarios', 'caja', 'pagos'];
  }
  
  // Si tiene acceso completo
  if (user.permisos?.includes('*')) {
    return ['dashboard', 'comprobantes', 'clientes', 'kardex', 'reportes', 'configuracion', 'usuarios', 'caja', 'pagos'];
  }
  
  // Devolver permisos específicos
  return normalizePerms(user.permisos || []);
};

/**
 * Filtra elementos del sidebar según permisos
 */
export const filterSidebarItems = (items: any[], user: IUserPermissions | null) => {
  if (!user) return [];
  
  return items.filter(item => {
    // Si no tiene módulo definido, mostrar siempre (ej: items de separación)
    if (!item.module) return true;
    
    // Verificar permiso
    return hasPermission(user, item.module);
  });
};

/**
 * Redirige a una página permitida si el usuario no tiene acceso
 */
export const getRedirectPath = (user: IUserPermissions | null, intendedPath: string): string => {
  if (!user) return '/login';
  
  const availableModules = getAvailableModules(user);
  
  // Si tiene acceso al dashboard, enviarlo ahí
  if (availableModules.includes('dashboard')) {
    return '/administrador';
  }
  
  // Si no, enviarlo al primer módulo disponible
  if (availableModules.length > 0) {
    const firstModule = availableModules[0];
    const moduleRoutes: Record<string, string> = {
      comprobantes: '/administrador/facturacion/comprobantes',
      clientes: '/administrador/clientes',
      kardex: '/administrador/kardex',
      reportes: '/administrador/contabilidad/arqueo',
      configuracion: '/administrador/configuracion',
      usuarios: '/administrador/usuarios',
      caja: '/administrador/caja',
      pagos: '/administrador/pagos',
    };
    
    return moduleRoutes[firstModule] || '/administrador';
  }
  
  // Si no tiene ningún permiso, cerrar sesión
  return '/login';
};