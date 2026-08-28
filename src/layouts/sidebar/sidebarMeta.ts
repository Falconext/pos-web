import { detectarFuncionesRubro, esRubroFabricacion, esRubroVeterinaria } from '@/utils/rubro-features';
import { hasPlanFeature } from '@/utils/permissions';

const isDesktopBuild = String(import.meta.env.VITE_FALCONEXT_DESKTOP || '').toLowerCase() === 'true';

export interface SidebarSubItem {
  codigo: string;
  nombre: string;
  ruta: string;
  end?: boolean;
}

export interface ModuleMeta {
  condition?: (auth: any) => boolean;
  labelOverride?: (auth: any) => string | undefined;
  iconOverride?: (auth: any) => string | undefined;
  navRoute?: (auth: any) => string;
  pathPrefix?: (auth: any) => string;
  exactPath?: boolean;
  extraItems?: (auth: any) => SidebarSubItem[];
}

export interface SubModuleMeta {
  condition?: (auth: any) => boolean;
  labelOverride?: (auth: any) => string | undefined;
  end?: boolean;
}

const isRestaurante = (auth: any) => {
  const r = auth?.empresa?.rubro?.nombre?.toLowerCase() || '';
  return r.includes('restaurante') || r.includes('comida') || r.includes('alimento');
};

const isFarmacia = (auth: any) => {
  const r = auth?.empresa?.rubro?.nombre?.toLowerCase() || '';
  return r.includes('farmacia') || r.includes('botica') || r.includes('medicament') || r.includes('drogueria') || r.includes('droguería');
};

const isVehicular = (auth: any) => {
  const r = auth?.empresa?.rubro?.nombre?.toLowerCase() || '';
  return (
    r.includes('vehicular') ||
    r.includes('vehiculo') ||
    r.includes('vehículo') ||
    r.includes('alarma') ||
    r.includes('gps') ||
    r.includes('rastreo') ||
    r.includes('monitoreo') ||
    (r.includes('seguridad') && (
      r.includes('integral') ||
      r.includes('electronica') ||
      r.includes('electrónica') ||
      r.includes('tecsi')
    ))
  );
};

// Fallback routes for modules that don't have ruta set in DB yet
export const LEGACY_MODULE_ROUTES: Record<string, string> = {
  dashboard: '/administrador',
  kardex: '/administrador/kardex/productos',
  produccion: '/administrador/produccion/recetas',
  comprobantes: '/administrador/facturacion/comprobantes',
  cotizaciones: '/administrador/facturacion/cotizaciones',
  'guias-remision': '/administrador/facturacion/guia-remision',
  clientes: '/administrador/clientes',
  compras: '/administrador/compras',
  reportes: '/administrador/finanzas/dashboard',
  contabilidad: '/administrador/contabilidad/reporte',
  caja: '/administrador/ventas/caja',
  pagos: '/administrador/ventas/pagos',
  tienda: '/administrador/tienda/pedidos',
  usuarios: '/administrador/usuarios',
  sedes: '/administrador/sedes',
  notificaciones: '/administrador/notificaciones',
  ventas: '/administrador/ventas',
  finanzas: '/administrador/mi-negocio/marketing/finanzas',
  'mi-negocio': '/administrador/ecommerce/resumen',
  ecommerce: '/administrador/mi-negocio/resumen',
  marketing: '/administrador/mi-negocio/marketing/campanas',
  vehiculos: '/administrador/vehiculos',
  'contratos-vehiculares': '/administrador/vehiculos/contratos',
  logistica: '/administrador/logistica/dashboard',
};

// Fallback routes for submodules that don't have ruta set in DB yet
export const LEGACY_SUBMODULE_ROUTES: Record<string, string> = {
  'kardex:dashboard': '/administrador/kardex/dashboard',
  'kardex:productos': '/administrador/kardex/productos',
  'kardex:traslados': '/administrador/kardex/traslados',
  'kardex:combos': '/administrador/kardex/combos',
  'kardex:movimientos': '/administrador/kardex',
  'kardex:reservas': '/administrador/reservas',
  'kardex:series-garantias': '/administrador/kardex/series-garantias',
  'comprobantes:lista': '/administrador/facturacion/comprobantes',
  'comprobantes:emitir': '/administrador/facturacion/nuevo',
  'comprobantes:informales': '/administrador/facturacion/comprobantes-informales',
  'cotizaciones:lista': '/administrador/facturacion/cotizaciones',
  'cotizaciones:nueva': '/administrador/facturacion/cotizaciones/nuevo',
  'compras:gestion': '/administrador/compras',
  'compras:proveedores': '/administrador/compras/proveedores',
  'compras:ordenes': '/administrador/compras/ordenes',
  'reportes:formal': '/administrador/contabilidad/reporte',
  'reportes:informal': '/administrador/contabilidad/reporte-informales',
  'reportes:finanzas': '/administrador/finanzas/dashboard',
  'contabilidad:sire-ventas': '/administrador/sire/ventas',
  'contabilidad:sire-compras': '/administrador/sire/compras',
  'tienda:pedidos': '/administrador/tienda/pedidos',
  'tienda:reviews': '/administrador/tienda/reviews',
  'tienda:blog': '/administrador/tienda/blog',
  'tienda:modificadores': '/administrador/tienda/modificadores',
  'tienda:configuracion': '/administrador/tienda/configuracion',
  'tienda:template': '/administrador/tienda/template',
  'usuarios:gestion': '/administrador/usuarios',
  'usuarios:repartidores': '/administrador/usuarios/repartidores',
  'usuarios:clientes': '/administrador/usuarios/clientes',
  'usuarios:proveedores': '/administrador/usuarios/proveedores',
  'ventas:panel': '/administrador/ventas',
  'tienda:despacho': '/administrador/ventas',
  'tienda:repartidores': '/administrador/repartidores',
  'tienda:vendedores': '/administrador/usuarios/vendedores',
  'logistica:dashboard': '/administrador/logistica/dashboard',
  'logistica:pedidos': '/administrador/logistica/pedidos',
  'logistica:despachos': '/administrador/logistica/despachos',
  'logistica:tracking': '/administrador/logistica/tracking',
  'logistica:conductores': '/administrador/logistica/conductores',
  'logistica:vehiculos': '/administrador/logistica/vehiculos',
  'logistica:almacenes': '/administrador/logistica/almacenes',
  'logistica:zonas': '/administrador/logistica/zonas',
  'logistica:clientes': '/administrador/logistica/clientes',
  'logistica:mantenimiento': '/administrador/logistica/mantenimiento',
  'logistica:combustible': '/administrador/logistica/combustible',
  'logistica:peajes': '/administrador/logistica/peajes',
  'logistica:documentos': '/administrador/logistica/documentos',
  'logistica:dispositivos': '/administrador/logistica/dispositivos',
  'logistica:geocercas': '/administrador/logistica/geocercas',
  'logistica:importar': '/administrador/logistica/importar',
  'logistica:integraciones': '/administrador/logistica/integraciones',
};

export const MODULE_META: Record<string, ModuleMeta> = {
  dashboard: {
    navRoute: () => '/administrador',
    pathPrefix: () => '/administrador',
  },

  kardex: {
    labelOverride: (auth) => isRestaurante(auth) ? 'Catálogo' : undefined,
    iconOverride: (auth) => isRestaurante(auth) ? 'solar:chef-hat-bold-duotone' : 'solar:box-bold-duotone',
    navRoute: () => '/administrador/kardex/productos',
    pathPrefix: () => '/administrador/kardex',
    extraItems: (auth) => {
      const items: SidebarSubItem[] = [];
      if (isFarmacia(auth)) {
        items.push(
          { codigo: 'kardex:lotes', nombre: 'Lotes', ruta: '/administrador/kardex/lotes' },
          { codigo: 'kardex:libro-control', nombre: 'Libro Control', ruta: '/administrador/kardex/libro-control' },
        );
      }
      // Listas de Precio: solo el ADMIN_EMPRESA las gestiona.
      if (auth?.rol === 'ADMIN_EMPRESA') {
        items.push({ codigo: 'kardex:listas-precio', nombre: 'Listas de Precio', ruta: '/administrador/listas-precio' });
      }
      return items;
    },
  },

  produccion: {
    condition: (auth) => esRubroFabricacion(auth?.empresa?.rubro?.nombre),
    navRoute: () => '/administrador/produccion/recetas',
    pathPrefix: () => '/administrador/produccion',
  },

  comprobantes: {
    navRoute: () => '/administrador/facturacion/comprobantes',
    pathPrefix: () => '/administrador/facturacion',
  },

  cotizaciones: {
    navRoute: () => '/administrador/facturacion/cotizaciones',
    pathPrefix: () => '/administrador/facturacion/cotizaciones',
  },

  'guias-remision': {
    condition: (auth) => auth?.empresa?.tipoEmpresa === 'FORMAL',
    navRoute: () => '/administrador/facturacion/guia-remision',
    pathPrefix: () => '/administrador/facturacion/guia-remision',
  },

  compras: {
    navRoute: () => '/administrador/compras',
    pathPrefix: (auth) => {
      const p = auth?._location ?? '';
      return p.includes('por_pagar') ? '___' : '/administrador/compras';
    },
  },

  reportes: {
    navRoute: (auth) =>
      auth?.empresa?.tipoEmpresa === 'INFORMAL'
        ? '/administrador/contabilidad/reporte-informales'
        : '/administrador/contabilidad/reporte',
    pathPrefix: () => '/administrador/contabilidad',
  },

  contabilidad: {
    navRoute: (auth) =>
      auth?.empresa?.tipoEmpresa === 'INFORMAL'
        ? '/administrador/contabilidad/reporte-informales'
        : '/administrador/contabilidad/reporte',
    pathPrefix: () => '/administrador/contabilidad',
  },

  finanzas: {
    navRoute: () => '/administrador/mi-negocio/marketing/finanzas',
    pathPrefix: () => '/administrador/mi-negocio/marketing/finanzas',
    exactPath: true,
  },

  'mi-negocio': {
    navRoute: () => '/administrador/mi-negocio/resumen',
    pathPrefix: () => '/administrador/mi-negocio',
  },

  ecommerce: {
    navRoute: () => '/administrador/mi-negocio/resumen',
    pathPrefix: () => '/administrador/mi-negocio',
  },

  marketing: {
    navRoute: () => '/administrador/mi-negocio/marketing/campanas',
    pathPrefix: () => '/administrador/mi-negocio/marketing',
  },

  ventas: {
    navRoute: () => '/administrador/ventas',
    pathPrefix: () => '/administrador/ventas',
  },

  caja: {
    // Bancos vive como pestaña dentro de la página de Caja (mismo módulo).
    labelOverride: () => 'Caja y Bancos',
    navRoute: () => '/administrador/ventas/caja',
    pathPrefix: () => '/administrador/ventas/caja',
  },

  pagos: {
    navRoute: () => '/administrador/ventas/pagos',
    pathPrefix: () => '/administrador/ventas/pagos',
  },

  tienda: {
    // La ruta principal del módulo es "pedidos" (ecommerce). Si el usuario tiene
    // la restricción ocultarPedidosEcommerce, se oculta todo el módulo tienda.
    condition: (auth) => !isDesktopBuild && hasPlanFeature(auth, 'tieneTienda') && !auth?.ocultarPedidosEcommerce,
    navRoute: () => '/administrador/tienda/pedidos',
    pathPrefix: () => '/administrador/tienda',
    extraItems: () => [
      { codigo: 'tienda:reviews', nombre: 'Comentarios y rating', ruta: '/administrador/tienda/reviews' },
      { codigo: 'tienda:blog', nombre: 'Blog', ruta: '/administrador/tienda/blog' },
      { codigo: 'tienda:template', nombre: 'Diseño y template', ruta: '/administrador/tienda/template' },
    ],
  },

  usuarios: {
    navRoute: () => '/administrador/usuarios',
    pathPrefix: () => '/administrador/usuarios',
  },

  clientes: {
    labelOverride: (auth) => esRubroVeterinaria(auth?.empresa?.rubro?.nombre) ? 'Dueños' : undefined,
    iconOverride: (auth) => esRubroVeterinaria(auth?.empresa?.rubro?.nombre) ? 'solar:user-heart-bold-duotone' : undefined,
    navRoute: () => '/administrador/clientes',
    pathPrefix: () => '/administrador/clientes',
    extraItems: (auth) => {
      if (isFarmacia(auth)) {
        return [
          { codigo: 'clientes:medicos', nombre: '🩺 Médicos', ruta: '/administrador/medicos' },
        ];
      }
      if (esRubroVeterinaria(auth?.empresa?.rubro?.nombre)) {
        return [
          { codigo: 'clientes:medicos', nombre: 'Veterinarios', ruta: '/administrador/medicos' },
        ];
      }
      return [];
    },
  },

  vehiculos: {
    condition: (auth) => isVehicular(auth),
    navRoute: () => '/administrador/vehiculos',
    pathPrefix: () => '/administrador/vehiculos',
    extraItems: () => [
      // `end: true` → match exacto: no se marca activo en /vehiculos/contratos.
      { codigo: 'vehiculos:lista', nombre: 'Vehículos registrados', ruta: '/administrador/vehiculos', end: true },
      { codigo: 'vehiculos:contratos', nombre: 'Contratos / Suscripciones', ruta: '/administrador/vehiculos/contratos' },
    ],
  },

  logistica: {
    navRoute: () => '/administrador/logistica/dashboard',
    pathPrefix: () => '/administrador/logistica',
    extraItems: () => [
      { codigo: 'logistica:dashboard', nombre: 'Dashboard', ruta: '/administrador/logistica/dashboard' },
      { codigo: 'logistica:vehiculos', nombre: 'Vehículos', ruta: '/administrador/logistica/vehiculos' },
      { codigo: 'logistica:conductores', nombre: 'Conductores', ruta: '/administrador/logistica/conductores' },
      { codigo: 'logistica:mantenimiento', nombre: 'Mantenimiento', ruta: '/administrador/logistica/mantenimiento' },
      { codigo: 'logistica:combustible', nombre: 'Combustible', ruta: '/administrador/logistica/combustible' },
      { codigo: 'logistica:peajes', nombre: 'Peajes y Multas', ruta: '/administrador/logistica/peajes' },
      { codigo: 'logistica:documentos', nombre: 'Documentos y Alertas', ruta: '/administrador/logistica/documentos' },
      { codigo: 'logistica:dispositivos', nombre: 'Dispositivos GPS', ruta: '/administrador/logistica/dispositivos' },
      { codigo: 'logistica:geocercas', nombre: 'Geocercas', ruta: '/administrador/logistica/geocercas' },
      { codigo: 'logistica:almacenes', nombre: 'Almacenes', ruta: '/administrador/logistica/almacenes' },
      { codigo: 'logistica:zonas', nombre: 'Zonas', ruta: '/administrador/logistica/zonas' },
      { codigo: 'logistica:clientes', nombre: 'Clientes', ruta: '/administrador/logistica/clientes' },
      { codigo: 'logistica:pedidos', nombre: 'Pedidos', ruta: '/administrador/logistica/pedidos' },
      { codigo: 'logistica:despachos', nombre: 'Despachos', ruta: '/administrador/logistica/despachos' },
      { codigo: 'logistica:tracking', nombre: 'Tracking', ruta: '/administrador/logistica/tracking' },
      { codigo: 'logistica:importar', nombre: 'Importar Flota', ruta: '/administrador/logistica/importar' },
      { codigo: 'logistica:integraciones', nombre: 'Integraciones', ruta: '/administrador/logistica/integraciones' },
    ],
  },
};

export const SUBMODULE_META: Record<string, SubModuleMeta> = {
  'comprobantes:lista': {
    condition: (auth) => auth?.empresa?.tipoEmpresa === 'FORMAL',
    end: true,
  },
  'reportes:formal': {
    condition: (auth) => auth?.empresa?.tipoEmpresa === 'FORMAL',
  },
  'reportes:informal': {
    condition: (auth) => auth?.empresa?.tipoEmpresa === 'INFORMAL',
  },
  'contabilidad:sire-ventas': {
    condition: (auth) => auth?.empresa?.tipoEmpresa === 'FORMAL',
  },
  'contabilidad:sire-compras': {
    condition: (auth) => auth?.empresa?.tipoEmpresa === 'FORMAL',
  },
  'kardex:combos': {
    condition: (auth) => !isFarmacia(auth),
  },
  'kardex:movimientos': { end: true },
  'cotizaciones:lista': { end: true },
  'compras:gestion': { end: true },
  'ventas:panel': { end: true },
  'usuarios:gestion': { end: true },
  'usuarios:usuarios': { end: true },
  'kardex:productos': {
    labelOverride: (auth) => isRestaurante(auth) ? 'Platos' : undefined,
  },
  'kardex:series-garantias': {
    condition: (auth) => detectarFuncionesRubro(auth?.empresa?.rubro).controlSeriesGarantia,
  },
};
