import { useEffect, useMemo, useRef, useState, Suspense } from 'react'
import PantallaNoCargo from '@/components/PantallaNoCargo';
import { Icon } from '@iconify/react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore, type IAuthState } from '@/zustand/auth'
import NotificacionesCampana from '@/components/NotificacionesCampana'
import { useNotificacionesStore } from '@/zustand/notificaciones'
import SoporteWidget from '@/components/SoporteWidget'
import { hasPermission, hasPlanFeature, hasSubPermission, getRedirectPath } from '@/utils/permissions'
import { useThemeStore, ZOOM_OPTIONS, type ZoomLevel } from '@/zustand/theme'
import Configurator from '@/components/ui/Configurator'
import { BRAND, getBrandByKey } from '@/lib/branding'
import { esRubroFabricacion } from '@/utils/rubro-features'
import { AnimatePresence, motion } from 'framer-motion'
import { accordionReveal, fadeIn, fadeUp, interactiveHover, navItemReveal, navStagger, pageTransition, scaleIn, slideRight } from '@/lib/motion/presets'
import { useReducedMotionPreference } from '@/lib/motion/reducedMotion'
import { MODULE_META, SUBMODULE_META, LEGACY_MODULE_ROUTES, LEGACY_SUBMODULE_ROUTES, type SidebarSubItem } from '@/layouts/sidebar/sidebarMeta'
import { contarNovedadesSinVer, hayNovedadesSinVer, marcarNovedadesVistas } from '@/data/novedades'
import { hayLanzamientoSinVer } from '@/data/lanzamiento'
import NovedadesModal from '@/components/NovedadesModal'
import LanzamientoModal from '@/components/LanzamientoModal'
import AvisoSuscripcion from '@/components/AvisoSuscripcion'
import SidebarPill, { revealSidebarItems } from '@/layouts/sidebar/SidebarPill'
import '@/layouts/sidebar/sidebar.css'

// El sidebar usa íconos de trazo (como el resto del menú lineal); los módulos
// guardan su ícono duotono en BD, así que se pide la variante lineal de Solar.
const lineIcon = (icon: string) => icon.replace(/-bold-duotone$|-bold$/, '-linear')

// Varios módulos tienen en BD íconos rellenos de otra familia (mdi:*). En el
// sidebar se fija el trazo lineal por código para que todo el menú sea parejo.
const MODULE_LINE_ICONS: Record<string, string> = {
  dashboard: 'solar:widget-2-linear',
  comprobantes: 'solar:document-text-linear',
  cotizaciones: 'solar:clipboard-list-linear',
  'guias-remision': 'solar:delivery-linear',
  kardex: 'solar:box-linear',
  produccion: 'solar:settings-minimalistic-linear',
  clientes: 'solar:users-group-rounded-linear',
  usuarios: 'solar:users-group-two-rounded-linear',
  compras: 'solar:cart-large-2-linear',
  ventas: 'solar:sale-linear',
  caja: 'solar:wallet-money-linear',
  pagos: 'solar:card-linear',
  tienda: 'solar:shop-linear',
  reportes: 'solar:chart-2-linear',
  finanzas: 'solar:chart-2-linear',
  contabilidad: 'solar:calculator-minimalistic-linear',
  'mi-negocio': 'solar:graph-up-linear',
  sedes: 'solar:map-point-linear',
  notificaciones: 'solar:bell-linear',
  api: 'solar:code-square-linear',
  leads: 'solar:chat-round-dots-linear',
  logistica: 'solar:routing-2-linear',
}

const isDesktopBuild = String(import.meta.env.VITE_FALCONEXT_DESKTOP || '').toLowerCase() === 'true'

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { auth, sedeActiva, selectSede }: IAuthState = useAuthStore()
  const { sidebarColor, sidebarType, sidebarCollapsed, setSidebarCollapsed, navbarFixed, toggleConfigurator, zoomLevel, setZoomLevel, isDarkMode, toggleDarkMode, initTheme } = useThemeStore()

  // Detectar si el rubro es restaurante para cambiar nombres del menú
  const isRestaurante = useMemo(() => {
    const rubroNombre = auth?.empresa?.rubro?.nombre?.toLowerCase() || ''
    return rubroNombre.includes('restaurante') || rubroNombre.includes('comida') || rubroNombre.includes('alimento')
  }, [auth?.empresa?.rubro?.nombre])

  const isFabricacion = useMemo(() => {
    return esRubroFabricacion(auth?.empresa?.rubro?.nombre)
  }, [auth?.empresa?.rubro?.nombre])

  const [nameNavbar, setNameNavbar] = useState<string>('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // El WebSocket de notificaciones antes solo se conectaba dentro de la campana
  // (oculta para ADMIN_SISTEMA), así que el chat de Soporte nunca llegaba en
  // vivo del lado Krezka. Se conecta aquí, para cualquier rol, sin depender de
  // la campana. Es idempotente (no abre una segunda conexión si ya hay una).
  const iniciarWebSocket = useNotificacionesStore((s) => s.iniciarWebSocket)
  const detenerWebSocket = useNotificacionesStore((s) => s.detenerWebSocket)
  useEffect(() => {
    iniciarWebSocket()
    return () => detenerWebSocket()
  }, [iniciarWebSocket, detenerWebSocket])
  // Novedades sin ver: alimenta el punto del menú. Se calcula una sola vez al
  // montar (la lista es estática) y se apaga al entrar a la sección.
  const [novedadesSinVer, setNovedadesSinVer] = useState(() => contarNovedadesSinVer())
  const [novedadesAbierto, setNovedadesAbierto] = useState(false)
  // `true` cuando el modal se abrió solo (no porque el usuario lo pidiera):
  // cambia el encabezado para que se lea como un saludo.
  const [novedadesAuto, setNovedadesAuto] = useState(false)

  // Portada del lanzamiento (una vez por versión). Manda sobre el modal clásico:
  // si hay portada sin ver se abre esa y las novedades quedan como leídas al
  // cerrarla, para no encadenar dos modales.
  const [lanzamientoAbierto, setLanzamientoAbierto] = useState(false)

  // Las novedades se abren solas la primera vez que hay algo sin ver, sin
  // importar si el usuario acaba de iniciar sesión o ya estaba dentro. No hace
  // falta otra marca: al abrirse se dan por leídas, así que no vuelve a saltar.
  useEffect(() => {
    if (hayLanzamientoSinVer()) {
      setLanzamientoAbierto(true)
      return
    }
    if (!hayNovedadesSinVer()) return
    setNovedadesAuto(true)
    setNovedadesAbierto(true)
  }, [])

  // El menú "Novedades" abre la portada; desde ahí se llega al historial.
  const abrirNovedades = () => {
    setNovedadesAuto(false)
    setLanzamientoAbierto(true)
  }
  const cerrarNovedades = () => {
    setNovedadesAbierto(false)
    setNovedadesAuto(false)
    setNovedadesSinVer(0)
  }
  const cerrarLanzamiento = () => {
    setLanzamientoAbierto(false)
    marcarNovedadesVistas()
    setNovedadesSinVer(0)
  }
  const verHistorialNovedades = () => {
    setLanzamientoAbierto(false)
    setNovedadesAuto(false)
    setNovedadesAbierto(true)
  }
  const [openModuleCode, setOpenModuleCode] = useState<string | null>(null)
  const toggleModule = (codigo: string) => setOpenModuleCode(prev => prev === codigo ? null : codigo)
  // El tour de bienvenida pide abrir un módulo para poder resaltar su submódulo.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const codigo = (e as CustomEvent<string>).detail;
      if (codigo) { setOpenModuleCode(codigo); setSidebarCollapsed(false); }
    };
    window.addEventListener('tour:open-module', onOpen);
    return () => window.removeEventListener('tour:open-module', onOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const autoCollapsePaths = ['/administrador/ventas', '/administrador/tienda/pedidos']
  const isSidebarCollapsed = sidebarCollapsed || autoCollapsePaths.some(p => location.pathname.startsWith(p))
  const [isSedeMenuOpen, setIsSedeMenuOpen] = useState(false)
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const sedeMenuRef = useRef<HTMLDivElement | null>(null)
  const zoomMenuRef = useRef<HTMLDivElement | null>(null)
  const mainRef = useRef<HTMLElement | null>(null)
  const sideNavRef = useRef<HTMLDivElement | null>(null)
  const scrollYRef = useRef(0)
  const defaultProfileLogo = 'https://icons.veryicon.com/png/o/miscellaneous/two-color-icon-library/user-286.png'
  const reduceMotion = useReducedMotionPreference()

  const companyLogoSrc = useMemo(() => {
    const logo = auth?.empresa?.logo?.trim()
    if (!logo) return defaultProfileLogo
    if (/^data:image\//i.test(logo)) return logo
    if (/^(https?:)?\/\//i.test(logo) || logo.startsWith('/')) return logo
    return `data:image/png;base64,${logo}`
  }, [auth?.empresa?.logo])

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!userMenuRef.current) return
      if (!userMenuRef.current.contains(e.target as Node)) setIsUserMenuOpen(false)
      if (sedeMenuRef.current && !sedeMenuRef.current.contains(e.target as Node)) setIsSedeMenuOpen(false)
      if (zoomMenuRef.current && !zoomMenuRef.current.contains(e.target as Node)) setIsZoomMenuOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setIsUserMenuOpen(false); setIsSedeMenuOpen(false) }
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEsc)
    initTheme()

    // Controlar el overflow de la etiqueta html solo para rutas de administrador
    document.documentElement.classList.add('is-admin')

    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEsc)
      document.documentElement.classList.remove('is-admin')
    }
  }, [])

  useEffect(() => {
    if (location.pathname === '/administrador') setNameNavbar('Administrador')
    else if (location.pathname.startsWith('/administrador/')) {
      const name = location.pathname.replace('/administrador/', '')
      setNameNavbar(name.charAt(0).toUpperCase() + name.slice(1))
    }
  }, [location.pathname])

  const isAlmacen = sedeActiva?.tipo === 'ALMACEN'
  // Almacén con facturación habilitada: además de kardex, permite el módulo de comprobantes.
  const almacenFactura = isAlmacen && sedeActiva?.permiteFacturacion === true

  // Redireccionar a primer módulo permitido si no tiene acceso a dashboard
  useEffect(() => {
    if (!auth) return
    if (location.pathname === '/administrador' && !hasPermission(auth, 'dashboard')) {
      const path = getRedirectPath(auth, location.pathname)
      if (path && path !== location.pathname) {
        navigate(path, { replace: true })
      }
    }
  }, [auth, location.pathname, navigate])

  // Sede tipo ALMACEN: solo kardex permitido (y facturación si la sede lo habilita)
  useEffect(() => {
    if (!isAlmacen) return
    const allowedPrefixes = ['/administrador/kardex']
    if (almacenFactura) allowedPrefixes.push('/administrador/facturacion')
    const permitido = allowedPrefixes.some((p) => location.pathname.startsWith(p))
    if (!permitido) {
      navigate('/administrador/kardex/productos', { replace: true })
    }
  }, [isAlmacen, almacenFactura, location.pathname, navigate])

  // Robust scroll lock for mobile drawer using position:fixed and restoring scroll
  useEffect(() => {
    const body = document.body

    // Prevent body scroll in admin layout to avoid double scrollbars
    const originalOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    const lock = () => {
      scrollYRef.current = window.scrollY
      body.style.position = 'fixed'
      body.style.top = `-${scrollYRef.current}px`
      body.style.left = '0'
      body.style.right = '0'
      body.style.width = '100%'
    }
    const unlock = () => {
      const y = Math.abs(parseInt(body.style.top || '0', 10)) || 0
      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      body.style.width = ''
      if (y) window.scrollTo(0, y)
    }

    if (isSidebarOpen && window.innerWidth < 768) lock()
    else unlock()

    return () => {
      unlock()
      body.style.overflow = originalOverflow;
    }
  }, [isSidebarOpen])

  // Al abrir el menú en el celular, los ítems entran en cascada.
  useEffect(() => {
    if (isSidebarOpen && !reduceMotion && window.innerWidth < 768) revealSidebarItems(sideNavRef.current)
  }, [isSidebarOpen, reduceMotion])

  const logout = () => {
    useAuthStore.getState().logout()
    navigate('/login', { replace: true })
  }

  // Determine theme based on role
  const isSystemAdmin = auth?.rol === 'ADMIN_SISTEMA'

  // Sidebar dinámico: módulos y submódulos del plan, ordenados
  const planModules = useMemo(() => {
    const mods = auth?.empresa?.plan?.modulosAsignados ?? [];
    // El sidebar refleja los módulos del plan (incluye "logistica" solo si el
    // plan lo tiene asignado). Ya no se inyecta manualmente.
    return [...mods].sort((a, b) => (a.modulo.orden ?? 0) - (b.modulo.orden ?? 0));
  }, [auth?.empresa?.plan?.modulosAsignados]);

  // Comisiones (Mis Comisiones / Comisiones del equipo) viven dentro del dashboard
  // de finanzas, que pertenece al módulo "mi-negocio" (actual) o "reportes" (legacy).
  // Solo se muestran si el plan incluye ese módulo financiero — así el plan Negocio
  // las tiene y el plan Emprendedor (que no accede a finanzas) no.
  const planTieneFinanzas = useMemo(
    () => planModules.some(({ modulo }) => modulo.codigo === 'mi-negocio' || modulo.codigo === 'reportes'),
    [planModules],
  );

  const planSubModulesAll = useMemo(() => {
    return auth?.empresa?.plan?.subModulosAsignados ?? [];
  }, [auth?.empresa?.plan?.subModulosAsignados]);

  const mapSubModuleToSidebarItem = (subModulo: any): SidebarSubItem | null => {
    if (!hasSubPermission(auth, subModulo.codigo)) return null;
    const smMeta = SUBMODULE_META[subModulo.codigo];
    if (smMeta?.condition && !smMeta.condition(auth)) return null;
    return {
      codigo: subModulo.codigo,
      nombre: smMeta?.labelOverride?.(auth) ?? subModulo.nombre ?? subModulo.codigo,
      ruta: subModulo.ruta ?? LEGACY_SUBMODULE_ROUTES[subModulo.codigo] ?? '#',
      end: smMeta?.end,
    } as SidebarSubItem;
  };

  const getModuleSubItems = (modulo: any): SidebarSubItem[] => {
    const moduloId = modulo.id ?? 0;
    const assignedSubModules = (planSubModulesAll as any[])
      .filter((psm: any) => psm.subModulo.moduloId === moduloId)
      .sort((a: any, b: any) => (a.subModulo.orden ?? 0) - (b.subModulo.orden ?? 0))
      .map(({ subModulo }: any) => subModulo);

    const sourceSubModules = assignedSubModules.length > 0
      ? assignedSubModules
      : [...(modulo.subModulos ?? [])].sort((a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0));

    return sourceSubModules
      .map(mapSubModuleToSidebarItem)
      .filter(Boolean) as SidebarSubItem[];
  };

  // Para ADMIN_SISTEMA con sistemaNegocio asignado, usar branding de su plataforma
  const sidebarBrand = isSystemAdmin && auth?.sistemaNegocio
    ? getBrandByKey(auth.sistemaNegocio)
    : BRAND

  const theme = {
    mainPadding: 'p-5',

    // Ítems del sidebar: el activo lo marcan aria-current / is-active (ver sidebar.css)
    activeLink: 'krk-nav',
    inactiveLink: 'krk-nav',
    accordionActive: 'krk-nav krk-nav--acc is-active',
    accordionInactive: 'krk-nav krk-nav--acc',
    submenuActiveLink: 'krk-sub is-active',
    submenuInactiveLink: 'krk-sub',
  };


  return (
    <motion.div
      data-accent={sidebarColor}
      className="relative flex overflow-hidden transition-all duration-300"
      style={{
        fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        zoom: String(ZOOM_OPTIONS[zoomLevel]?.zoom ?? 1),
        height: ZOOM_OPTIONS[zoomLevel]?.height ?? '100vh'
      }}
      variants={fadeIn}
      initial="initial"
      animate={reduceMotion ? { opacity: 1 } : 'animate'}
    >
      <div className="krk-glow print:hidden" aria-hidden="true"><i className="krk-glow__a" /><i className="krk-glow__b" /></div>

      <motion.aside
        data-type={sidebarType}
        className={`krk-side ${isSidebarCollapsed ? 'is-mini' : ''} print:hidden fixed inset-y-0 left-0 flex flex-col pt-[18px] pb-3.5 w-[86%] max-w-[300px] transform transition-[transform,width] duration-500 ease-[cubic-bezier(.16,1,.3,1)] md:relative ${isSidebarCollapsed ? 'md:w-[80px] px-3' : 'md:w-[256px] px-3.5'} md:translate-x-0 ${isSidebarOpen ? 'translate-x-0 z-[70] shadow-[30px_0_60px_-20px_rgba(0,0,0,0.5)] md:shadow-none' : '-translate-x-full z-[45] md:translate-x-0'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Marca + contraer */}
        <div className={`flex items-center min-h-[44px] ${isSidebarCollapsed ? 'flex-col gap-3' : 'justify-between gap-2 pl-1.5 pr-0.5'}`}>
          <div className="krk-brand">
            <span className="krk-brand__mark">
              <img src={sidebarBrand.favicon ?? sidebarBrand.logoWhite} alt="" />
            </span>
            {!isSidebarCollapsed && (
              <span className="krk-brand__name min-w-0 truncate">
                {sidebarBrand.name}
                <small>Panel administrativo</small>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className="krk-side__collapse hidden md:grid"
            title={isSidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
            aria-label={isSidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
          >
            <Icon icon={isSidebarCollapsed ? 'solar:alt-arrow-right-linear' : 'solar:alt-arrow-left-linear'} width="16" />
          </button>
        </div>

      <div ref={sideNavRef} className={`krk-side__nav flex-1 min-h-0 -mx-1 px-1 ${isSidebarCollapsed ? 'w-full overflow-visible' : 'overflow-y-auto overflow-x-hidden'}`}>
          <SidebarPill containerRef={sideNavRef} routeKey={location.pathname + location.search} collapsed={isSidebarCollapsed} reduceMotion={reduceMotion} />
          <motion.nav
            className="flex flex-col gap-0.5 w-full"
            variants={navStagger}
            initial={reduceMotion ? false : 'initial'}
            animate="animate"
          >
            <p className="krk-side__group">{auth?.rol === 'ADMIN_SISTEMA' ? 'Plataforma' : 'Menú principal'}</p>
            {auth?.rol === 'ADMIN_SISTEMA' && (
              <motion.div variants={navItemReveal} className="flex flex-col gap-0.5">
                <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/empresas" className={({ isActive }) => isActive || location.pathname.startsWith('/administrador/empresas') ? theme.activeLink : theme.inactiveLink} title="Empresas">
                  <Icon icon="solar:buildings-2-linear" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                  {!isSidebarCollapsed && <span>Empresas</span>}
                </NavLink>

                {!isDesktopBuild && (
                  <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/finanzas" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Finanzas del Sistema">
                    <Icon icon="solar:chart-square-linear" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                    {!isSidebarCollapsed && <span>Finanzas</span>}
                  </NavLink>
                )}

                {!isDesktopBuild && (
                  <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/cobros" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Cobros de mensualidades">
                    <Icon icon="solar:bill-list-linear" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                    {!isSidebarCollapsed && <span>Cobros</span>}
                  </NavLink>
                )}

                <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/usuarios" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Usuarios del Sistema">
                  <Icon icon="solar:shield-user-linear" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                  {!isSidebarCollapsed && <span>Usuarios Sistema</span>}
                </NavLink>

                <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/catalogo-global" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Catálogo Global">
                  <Icon icon="solar:database-linear" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                  {!isSidebarCollapsed && <span>Catálogo Global</span>}
                </NavLink>
                {!isDesktopBuild && (
                  <>
                    <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/planes" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Planes">
                      <Icon icon="solar:card-linear" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                      {!isSidebarCollapsed && <span>Planes</span>}
                    </NavLink>
                    <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/modulos" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Módulos">
                      <Icon icon="solar:widget-linear" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                      {!isSidebarCollapsed && <span>Módulos</span>}
                    </NavLink>
                    <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/resellers" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Distribuidores">
                      <Icon icon="solar:users-group-two-rounded-linear" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                      {!isSidebarCollapsed && <span>Distribuidores</span>}
                    </NavLink>
                    <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/catalogo-web" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Catálogo Web">
                      <Icon icon="solar:shop-2-linear" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                      {!isSidebarCollapsed && <span>Catálogo Web</span>}
                    </NavLink>
                  </>
                )}
                <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/rubros" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Rubros de Negocio">
                  <Icon icon="solar:buildings-3-linear" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                  {!isSidebarCollapsed && <span>Rubros</span>}
                </NavLink>
                {!isDesktopBuild && (
                  <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/disenos-tienda" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Diseño de Tiendas">
                    <Icon icon="solar:palette-linear" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                    {!isSidebarCollapsed && <span>Diseño Tiendas</span>}
                  </NavLink>
                )}
                <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/soporte" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Soporte a Empresarios">
                  <Icon icon="solar:chat-round-dots-linear" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                  {!isSidebarCollapsed && <span>Soporte</span>}
                </NavLink>
              </motion.div>
            )}


            {(auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'USUARIO_EMPRESA') && (
              <>
                {/* Aviso visual cuando la sede es un Almacén */}
                {isAlmacen && !isSidebarCollapsed && (
                  <div className="mx-1 mb-2 px-3 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20">
                    <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                      <Icon icon="solar:box-linear" width={12} /> Modo Almacén
                    </p>
                    <p className="text-[10px] text-amber-200/70 mt-0.5">{almacenFactura ? 'Acceso a Kardex y Facturación' : 'Solo acceso a Kardex'}</p>
                  </div>
                )}

                {/* ── Sidebar dinámico generado desde plan.modulosAsignados ── */}
                {planModules.map(({ modulo }) => {
                  // En modo almacén solo mostrar kardex (y comprobantes si la sede habilita facturación)
                  if (isAlmacen && modulo.codigo !== 'kardex' && !(almacenFactura && modulo.codigo === 'comprobantes')) return null;
                  if (!hasPermission(auth, modulo.codigo)) return null;
                  const meta = MODULE_META[modulo.codigo];
                  if (meta?.condition && !meta.condition(auth)) return null;

                  const label = meta?.labelOverride?.(auth) ?? modulo.nombre ?? modulo.codigo;
                  const override = meta?.iconOverride?.(auth);
                  const icon = override ?? MODULE_LINE_ICONS[modulo.codigo] ?? modulo.icono ?? 'solar:circle-bold-duotone';
                  const ruta = modulo.ruta ?? LEGACY_MODULE_ROUTES[modulo.codigo];
                  const navRoute = meta?.navRoute?.(auth) ?? ruta ?? '#';
                  const pathPrefix = meta?.pathPrefix?.(auth) ?? ruta ?? '___';
                  const isOpen = openModuleCode === modulo.codigo;
                  const isModuleActive = location.pathname === '/administrador' && modulo.codigo === 'dashboard'
                    ? location.pathname === '/administrador'
                    : location.pathname.startsWith(pathPrefix);

                  const dbSubItems = getModuleSubItems(modulo);
                  const extraItems = meta?.extraItems?.(auth) ?? [];
                  const allSubItems = [...dbSubItems, ...extraItems];
                  // Solo UNA opción del submenú puede estar marcada. Con
                  // `startsWith` suelto, "/listas-precio/reprecio" encendía
                  // también a "/listas-precio" y se veían dos seleccionadas.
                  // Gana la coincidencia más específica; el `/` final evita que
                  // "/listas-precioXYZ" cuente como hija de "/listas-precio".
                  const rutaSubActiva = allSubItems
                    .filter((item) => item.end
                      ? location.pathname === item.ruta
                      : (location.pathname === item.ruta || location.pathname.startsWith(item.ruta + '/')))
                    .sort((a, b) => b.ruta.length - a.ruta.length)[0]?.ruta;

                  if (allSubItems.length === 0) {
                    return (
                      <NavLink
                        key={modulo.id ?? modulo.codigo}
                        data-tour={`mod:${modulo.codigo}`}
                        onClick={() => { setIsSidebarOpen(false); setNameNavbar(label); }}
                        to={ruta ?? '#'}
                        end={modulo.codigo === 'dashboard'}
                        className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink}
                        title={label}
                      >
                        <Icon icon={lineIcon(icon)} className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                        {!isSidebarCollapsed && <span>{label}</span>}
                      </NavLink>
                    );
                  }

                  return (
                    <div key={modulo.id ?? modulo.codigo} className="relative group">
                      <button
                        data-tour={`mod:${modulo.codigo}`}
                        onClick={() => {
                          if (isSidebarCollapsed) { navigate(navRoute); }
                          else { toggleModule(modulo.codigo); }
                          setNameNavbar(label);
                        }}
                        className={isModuleActive ? theme.accordionActive : theme.accordionInactive}
                        // Contraído ya sale el menú flotante con el nombre: el
                        // globito nativo se le encimaba.
                        title={isSidebarCollapsed ? undefined : label}
                      >
                        <div className="flex items-center justify-center">
                          <Icon icon={lineIcon(icon)} className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                          {!isSidebarCollapsed && <span>{label}</span>}
                        </div>
                        {!isSidebarCollapsed && (
                          <Icon icon="solar:alt-arrow-down-linear" className={`krk-nav__chev transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} width="16" />
                        )}
                      </button>
                      {/* Collapsed popover */}
                      {isSidebarCollapsed && (
                        <div className="krk-side__float absolute left-full top-0 ml-2 rounded-xl w-52 p-1.5 z-[9999] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                          <div className="krk-side__float-title">{label}</div>
                          {allSubItems.map(item => (
                            <NavLink key={item.codigo} onClick={() => setIsSidebarOpen(false)} to={item.ruta} end={item.end}
                              className={() => (item.ruta === rutaSubActiva ? theme.submenuActiveLink : theme.submenuInactiveLink)}
                            >{item.nombre}</NavLink>
                          ))}
                        </div>
                      )}
                      <AnimatePresence initial={false}>
                        {!isSidebarCollapsed && isOpen && (
                          <motion.div
                            variants={accordionReveal}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="krk-subs flex flex-col gap-0.5"
                            style={{ overflow: 'hidden' }}
                          >
                            {allSubItems.map(item => (
                              <NavLink key={item.codigo} data-tour={`sub:${item.codigo}`} onClick={() => setIsSidebarOpen(false)} to={item.ruta} end={item.end}
                                className={() => (item.ruta === rutaSubActiva ? theme.submenuActiveLink : theme.submenuInactiveLink)}
                              >{item.nombre}</NavLink>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* LEGACY: dashboard dashboard no existente en plan (fallback) */}
                {!planModules.some(m => hasPermission(auth, m.modulo.codigo)) && (
                  <NavLink data-tour="dashboard" onClick={() => { setIsSidebarOpen(false); setNameNavbar('Administrador') }} to="/administrador" end className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Dashboard">
                    <Icon icon="solar:chart-2-linear" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                    {!isSidebarCollapsed && <span>Dashboard</span>}
                  </NavLink>
                )}

                {/* Comisiones — parte del módulo financiero (reportes); sigue el patrón de las demás opciones */}
                {planTieneFinanzas && (auth?.rol === 'USUARIO_EMPRESA' || auth?.rol === 'ADMIN_EMPRESA') && (
                  <NavLink
                    onClick={() => { setIsSidebarOpen(false); setNameNavbar('Mis Comisiones'); }}
                    to="/administrador/mis-comisiones"
                    className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink}
                    title="Mis Comisiones"
                  >
                    <Icon icon="solar:hand-money-linear" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                    {!isSidebarCollapsed && <span>Mis Comisiones</span>}
                  </NavLink>
                )}

                {planTieneFinanzas && auth?.rol === 'ADMIN_EMPRESA' && (
                  <NavLink
                    onClick={() => { setIsSidebarOpen(false); setNameNavbar('Comisiones del equipo'); }}
                    to="/administrador/finanzas/dashboard?tab=comisiones"
                    className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink}
                    title="Comisiones del equipo"
                  >
                    <Icon icon="solar:users-group-rounded-linear" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                    {!isSidebarCollapsed && <span>Comisiones del equipo</span>}
                  </NavLink>
                )}

              </>
            )}

          </motion.nav>
        </div>

        {/* Pie: cuenta */}
        <div className="krk-side__foot flex flex-col gap-0.5 w-full">
          <p className="krk-side__group">Cuenta</p>
          <button
            type="button"
            onClick={() => { setIsSidebarOpen(false); abrirNovedades() }}
            className={theme.inactiveLink}
            title={novedadesSinVer > 0 ? `Novedades · ${novedadesSinVer} sin ver` : 'Novedades'}
          >
            <span className="relative flex items-center">
              <Icon icon="solar:confetti-minimalistic-linear" />
              {/* Punto de "sin leer": se apaga al abrir el modal de novedades. */}
              {novedadesSinVer > 0 && isSidebarCollapsed && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--krk-accent)] ring-2 ring-[var(--side-bg)]" />
              )}
            </span>
            {!isSidebarCollapsed && <span>Novedades</span>}
            {!isSidebarCollapsed && novedadesSinVer > 0 && <span className="krk-nav__badge">{novedadesSinVer}</span>}
          </button>
          {/* Su suscripción. Va en el pie del menú, junto a Configuración: se
              consulta de vez en cuando, no todos los días. */}
          {auth?.rol === 'ADMIN_EMPRESA' && (
            <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Mi plan') }} to="/administrador/mi-plan" className={theme.inactiveLink} title="Mi plan">
              <Icon icon="solar:crown-linear" />
              {!isSidebarCollapsed && <span>Mi plan</span>}
            </NavLink>
          )}
          <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Configuración') }} to="/administrador/perfil" className={theme.inactiveLink} title="Configuración">
            <Icon icon="solar:settings-linear" />
            {!isSidebarCollapsed && <span>Configuración</span>}
          </NavLink>

          <div className={`krk-me mt-2 ${isSidebarCollapsed ? '' : 'pr-1'}`}>
            <button
              type="button"
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
              onClick={() => { setIsSidebarOpen(false); navigate('/administrador/perfil') }}
              title={auth?.nombre ?? 'Perfil'}
            >
              <img
                src={companyLogoSrc}
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = defaultProfileLogo
                }}
                alt=""
              />
              {!isSidebarCollapsed && (
                <span className="min-w-0">
                  <b>{auth?.nombre}</b>
                  <small>{auth?.empresa?.nombreComercial ?? auth?.rol?.replace('ADMIN_', '')?.replace('USUARIO_', '')}</small>
                </span>
              )}
            </button>
            {!isSidebarCollapsed && (
              <button type="button" className="krk-me__out" onClick={() => { setIsSidebarOpen(false); logout() }} title="Cerrar sesión" aria-label="Cerrar sesión">
                <Icon icon="solar:logout-2-linear" width="17" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            key="sidebar-backdrop"
            role="button"
            aria-label="Cerrar menú"
            tabIndex={0}
            className="print:hidden fixed inset-0 bg-black/40 z-[60] md:hidden cursor-pointer"
            onClick={() => setIsSidebarOpen(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsSidebarOpen(false)}
            variants={fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <main
        ref={mainRef}
        className="flex-1 min-h-0 flex flex-col min-w-0 overflow-y-auto print:overflow-visible"
      >
        <div className={`shrink-0 z-[40] transition-all duration-300 ${navbarFixed ? 'sticky top-0' : 'relative'}`}>
          <motion.header className="print:hidden flex items-center justify-between px-6 py-3.5 bg-white/90 backdrop-blur-md border-b border-gray-100 dark:bg-[#0A0D14]/90 dark:border-slate-800 transition-all duration-300" variants={fadeUp} initial="initial" animate="animate">
          <div className="flex items-center gap-4">
            <motion.button
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir menú"
              whileHover={interactiveHover.whileHover}
              whileTap={interactiveHover.whileTap}
            >
              <Icon icon="solar:hamburger-menu-linear" width="22" className="text-gray-600 dark:text-gray-300" />
            </motion.button>
            <div className="flex items-center gap-1.5 text-[13px] font-medium">
              <span className="text-gray-400 dark:text-gray-500">Administrador</span>
              <Icon icon="solar:alt-arrow-right-linear" width="13" className="text-gray-300 dark:text-gray-600" />
              <span className="text-violet-600 dark:text-violet-400 font-semibold">{nameNavbar}</span>
            </div>
            {/* Sede activa badge / switcher */}
            {sedeActiva && (() => {
              const todasSedes = auth?.sedes || []
              const otrasSedesActivas = todasSedes.filter(s => s.activo && s.id !== sedeActiva.id)
              const puedesCambiar = otrasSedesActivas.length > 0

              return puedesCambiar ? (
                <div className="relative hidden md:block" ref={sedeMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsSedeMenuOpen(p => !p)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/40 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
                  >
                    <Icon icon={sedeActiva.tipo === 'ALMACEN' ? 'solar:box-bold-duotone' : 'solar:city-bold-duotone'} className="text-violet-600 dark:text-violet-400" width={14} />
                    <span className="text-[12px] font-semibold text-violet-600 dark:text-violet-400 truncate max-w-[140px]">{sedeActiva.nombre}</span>
                    {sedeActiva.tipo === 'ALMACEN' && (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Almacén</span>
                    )}
                    <Icon icon="solar:alt-arrow-down-linear" className="text-violet-600 dark:text-violet-400" width={12} />
                  </button>
                  <AnimatePresence>
                    {isSedeMenuOpen && (
                    <motion.div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg py-1 min-w-[200px]" variants={scaleIn} initial="initial" animate="animate" exit="exit">
                      <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 px-3 py-1 tracking-wider">Cambiar sede</p>
                      {todasSedes.filter(s => s.activo).map(sede => (
                        <button
                          key={sede.id}
                          type="button"
                          onClick={() => {
                            selectSede(sede.id)
                            setIsSedeMenuOpen(false)
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${sede.id === sedeActiva.id ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 font-semibold cursor-default' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                        >
                          <Icon icon={sede.id === sedeActiva.id ? 'solar:check-circle-bold' : sede.tipo === 'ALMACEN' ? 'solar:box-linear' : 'solar:city-linear'} width={14} />
                          {sede.nombre}
                          {sede.tipo === 'ALMACEN'
                            ? <span className="ml-auto text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full uppercase">Almacén</span>
                            : sede.esPrincipal
                              ? <span className="ml-auto text-[10px] text-gray-400 dark:text-slate-500 font-normal">Principal</span>
                              : null}
                        </button>
                      ))}
                    </motion.div>
                  )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/40 rounded-lg">
                  <Icon icon={sedeActiva.tipo === 'ALMACEN' ? 'solar:box-bold-duotone' : 'solar:city-bold-duotone'} className="text-violet-600 dark:text-violet-400" width={14} />
                  <span className="text-[12px] font-semibold text-violet-600 dark:text-violet-400 truncate max-w-[140px]">{sedeActiva.nombre}</span>
                  {sedeActiva.tipo === 'ALMACEN' && (
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Almacén</span>
                  )}
                </div>
              )
            })()}
          </div>

          <div className="flex items-center gap-1">
            {/* Dark mode toggle */}
            <div>
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-amber-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-100'}`}
                title={isDarkMode ? 'Desactivar Modo Oscuro' : 'Activar Modo Oscuro'}
              >
                <Icon icon={isDarkMode ? 'solar:sun-bold-duotone' : 'solar:moon-bold-duotone'} width="20" />
              </button>
            </div>

            {/* Zoom selector */}
            <div className="relative hidden md:block" ref={zoomMenuRef}>
              <button
                onClick={() => setIsZoomMenuOpen(o => !o)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors text-xs font-bold ${
                  zoomLevel > 0
                    ? 'text-violet-600 bg-violet-50 dark:bg-violet-900/20'
                    : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800'
                }`}
                title="Ajustar nivel de zoom"
              >
                <Icon icon="solar:minimize-square-3-bold" width="16" />
                <span>{ZOOM_OPTIONS[zoomLevel]?.label}</span>
              </button>

              {isZoomMenuOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 w-44 rounded-xl border border-gray-100 bg-white dark:bg-slate-900 dark:border-slate-700 shadow-xl py-1.5 overflow-hidden">
                  <p className="px-3 pb-1.5 pt-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-700 mb-1">
                    Nivel de zoom
                  </p>
                  {ZOOM_OPTIONS.map(opt => (
                    <button
                      key={opt.level}
                      onClick={() => { setZoomLevel(opt.level as ZoomLevel); setIsZoomMenuOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                        zoomLevel === opt.level
                          ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 font-bold'
                          : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon
                          icon={opt.level === 0 ? 'solar:maximize-square-3-linear' : 'solar:minimize-square-3-bold'}
                          width="15"
                          className={zoomLevel === opt.level ? 'text-violet-500 dark:text-violet-400' : 'text-gray-400 dark:text-slate-500'}
                        />
                        {opt.level === 0 ? 'Normal' : opt.level === 1 ? 'Compacto' : opt.level === 2 ? 'Más compacto' : 'Mínimo'}
                      </span>
                      <span className={`text-xs font-mono ${zoomLevel === opt.level ? 'text-violet-500 dark:text-violet-400' : 'text-gray-400 dark:text-slate-500'}`}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Configurator */}
            <div className="hidden md:block">
              <button
                onClick={toggleConfigurator}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg transition-colors"
                title="Configuración de UI"
              >
                <Icon icon="solar:settings-linear" width="20" />
              </button>
            </div>

            {/* Notificaciones */}
            {(auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'USUARIO_EMPRESA') && (
              <div className="hidden md:block">
                <NotificacionesCampana />
              </div>
            )}

            {/* Divider */}
            <div className="hidden md:block w-px h-6 bg-gray-200 dark:bg-slate-700 mx-2" />

            {/* User profile */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                className="flex items-center gap-2.5 rounded-full outline-none focus:outline-none hover:bg-gray-50 dark:hover:bg-slate-800 px-2 py-1.5 transition-all border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
                onClick={() => setIsUserMenuOpen((p) => !p)}
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
              >
                <img
                  width={34}
                  height={34}
                  className="rounded-full object-cover ring-2 ring-indigo-100 dark:ring-indigo-900/50"
                  src={companyLogoSrc}
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = defaultProfileLogo
                  }}
                  alt=""
                />
                <div className="hidden md:flex flex-col items-start gap-0">
                  <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 leading-tight">{auth?.nombre?.split(' ')[0]}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider leading-tight">{auth?.empresa?.nombreComercial?.split(' ')[0] ?? auth?.rol?.replace('ADMIN_', '')?.replace('USUARIO_', '')}</span>
                </div>
                <Icon icon="solar:alt-arrow-down-bold" className="hidden md:block text-gray-400 dark:text-gray-500" width="14" />
              </button>

              <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl shadow-gray-200/60 dark:shadow-black/40 z-[999999] overflow-hidden" variants={scaleIn} initial="initial" animate="animate" exit="exit">
                  <div className="px-4 py-3.5 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700">
                    <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate">{auth?.nombre}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{auth?.empresa?.nombreComercial}</p>
                  </div>
                  <ul className="py-1.5" role="menu">
                    {!isAlmacen && (
                      <li>
                        <button
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-gray-600 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                          onClick={() => { setIsUserMenuOpen(false); navigate('/administrador/perfil') }}
                          role="menuitem"
                        >
                          <Icon icon="solar:user-circle-bold-duotone" width="18" />
                          Perfil
                        </button>
                      </li>
                    )}
                    {!isDesktopBuild && !isAlmacen && (auth?.empresa?.slugTienda || hasPlanFeature(auth, 'tieneTienda')) && (
                      <li>
                        <button
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-gray-600 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                          onClick={() => { setIsUserMenuOpen(false); if (auth?.empresa?.slugTienda) navigate(`/tienda/${auth.empresa.slugTienda}`); else navigate('/administrador/tienda/configuracion'); }}
                          role="menuitem"
                        >
                          <Icon icon="solar:shop-bold-duotone" width="18" />
                          Ir a tienda virtual
                        </button>
                      </li>
                    )}
                    <li className="border-t border-gray-100 dark:border-slate-700 mt-1 pt-1">
                      <button
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        onClick={() => { setIsUserMenuOpen(false); logout() }}
                        role="menuitem"
                      >
                        <Icon icon="solar:logout-bold-duotone" width="18" />
                        Cerrar sesión
                      </button>
                    </li>
                  </ul>
                </motion.div>
              )}
              </AnimatePresence>
            </div>
            </div>
          </motion.header>
        </div>

        <div className={`flex-1 ${theme.mainPadding} transition-all duration-300`}>
          {/* Va acá y no en el dashboard: la deuda tiene que acompañarlo en
              todas las pantallas, no solo en la que entra al abrir sesión. */}
          <AvisoSuscripcion />
          {/* Las páginas se descargan al abrirlas (App.tsx): el menú queda fijo y solo el
              contenido muestra la espera. */}
          <PantallaNoCargo clave={location.pathname}>
          <Suspense fallback={<div className="flex h-64 items-center justify-center" role="status" aria-label="Cargando"><div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" /></div>}>
            <Outlet />
          </Suspense>
          </PantallaNoCargo>
        </div>
      </main>
      <LanzamientoModal
        abierto={lanzamientoAbierto}
        onClose={cerrarLanzamiento}
        onVerHistorial={verHistorialNovedades}
      />
      <NovedadesModal
        abierto={novedadesAbierto}
        onClose={cerrarNovedades}
        autoAbierto={novedadesAuto}
      />
      <Configurator />
      {/* Chat de soporte con Krezka: primero las preguntas frecuentes, después el equipo. */}
      {(auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'USUARIO_EMPRESA') && <SoporteWidget />}
    </motion.div>
  )
}
