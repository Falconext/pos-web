// Utilidades para manejo de permisos de usuarios

export interface IUserPermissions {
  permisos?: string[];
  rol?: 'ADMIN_SISTEMA' | 'ADMIN_EMPRESA' | 'USUARIO_EMPRESA' | 'RESELLER';
  subModulos?: { id: number; codigo: string; nombre: string; moduloId: number }[];
  empresa?: {
    plan?: {
      modulosAsignados?: { modulo: { codigo: string } }[];
      subModulosAsignados?: { subModulo: { id: number; codigo: string; moduloId: number } }[];
    }
  }
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
  if (!user) return false;
  if (user.rol === 'ADMIN_SISTEMA') return true;

  // 1. Validar restricción del Plan
  const planModulos = user.empresa?.plan?.modulosAsignados?.map((m) => m.modulo.codigo);
  if (planModulos && planModulos.length > 0) {
    if (!planModulos.includes(modulo)) return false;
  }

  if (user.rol === 'ADMIN_EMPRESA') return true;

  // 2. Validar permisos individuales de usuario
  if (!user.permisos || user.permisos.length === 0) return false;
  if (user.permisos.includes('*')) return true;

  const normalized = normalizePerms(user.permisos);
  return normalized.includes(modulo);
};

/**
 * Verifica si un usuario tiene acceso a un submódulo específico.
 *
 * Lógica de dos capas:
 * 1. Capa Plan: si el plan tiene subModulosAsignados, solo los incluidos están disponibles.
 *    Si el plan NO tiene ningún submodulo configurado, no se restringe (backward compat).
 * 2. Capa Usuario: si el usuario tiene subModulos propios, debe incluir el solicitado.
 *    Si el usuario no tiene subModulos (lista vacía o ausente), y es ADMIN_EMPRESA, accede a todos los del plan.
 */
export const hasSubPermission = (user: IUserPermissions | null, subModuloCodigo: string): boolean => {
  if (!user) return false;
  if (user.rol === 'ADMIN_SISTEMA') return true;

  // Capa 1: restricción del Plan
  const planSubModulos = user.empresa?.plan?.subModulosAsignados?.map((s) => s.subModulo.codigo);
  if (planSubModulos && planSubModulos.length > 0) {
    if (!planSubModulos.includes(subModuloCodigo)) return false;
  }
  // Si el plan no tiene subModulosAsignados configurados, no se restringe a nivel plan

  if (user.rol === 'ADMIN_EMPRESA') return true;

  // Capa 2: restricción del Usuario
  const userSubModulos = user.subModulos?.map((s) => s.codigo);
  if (!userSubModulos || userSubModulos.length === 0) {
    // Usuario sin submodulos configurados: accede a todos los que el plan permita
    return true;
  }

  return userSubModulos.includes(subModuloCodigo);
};

/**
 * Obtiene los módulos disponibles según los permisos del usuario
 */
export const getAvailableModules = (user: IUserPermissions | null): string[] => {
  if (!user) return [];

  let allModules = ['dashboard', 'comprobantes', 'clientes', 'kardex', 'reportes', 'configuracion', 'usuarios', 'caja', 'pagos', 'cotizaciones', 'guias-remision', 'compras'];

  if (user.rol === 'ADMIN_SISTEMA') return allModules;

  const planModulos = user.empresa?.plan?.modulosAsignados?.map((m) => m.modulo.codigo);
  if (planModulos && planModulos.length > 0) {
    allModules = allModules.filter(m => planModulos.includes(m));
  }

  if (user.rol === 'ADMIN_EMPRESA') return allModules;

  if (user.permisos?.includes('*')) return allModules;

  const userPerms = normalizePerms(user.permisos || []);
  return allModules.filter(m => userPerms.includes(m));
};

/**
 * Filtra elementos del sidebar según permisos
 */
export const filterSidebarItems = (items: any[], user: IUserPermissions | null) => {
  if (!user) return [];
  return items.filter(item => {
    if (!item.module) return true;
    return hasPermission(user, item.module);
  });
};

/**
 * Redirige a una página permitida si el usuario no tiene acceso
 */
export const getRedirectPath = (user: IUserPermissions | null, intendedPath: string): string => {
  if (!user) return '/login';

  const availableModules = getAvailableModules(user);

  if (availableModules.includes('dashboard')) return '/administrador';

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
      cotizaciones: '/administrador/cotizaciones',
      'guias-remision': '/administrador/guia-remision',
      compras: '/administrador/compras',
      dashboard: '/administrador'
    };
    return moduleRoutes[firstModule] || '/administrador';
  }

  return '/login';
};
