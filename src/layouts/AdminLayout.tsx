import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore, type IAuthState } from '@/zustand/auth'
import NotificacionesCampana from '@/components/NotificacionesCampana'
import { hasPermission, hasPlanFeature, hasSubPermission, getRedirectPath } from '@/utils/permissions'
import { useThemeStore, ZOOM_OPTIONS, type ZoomLevel } from '@/zustand/theme'
import Configurator from '@/components/ui/Configurator'
import { BRAND, getBrandByKey } from '@/lib/branding'
import { esRubroFabricacion } from '@/utils/rubro-features'
import { AnimatePresence, motion } from 'framer-motion'
import { accordionReveal, fadeIn, fadeUp, interactiveHover, navItemReveal, navStagger, pageTransition, scaleIn, slideRight } from '@/lib/motion/presets'
import { useReducedMotionPreference } from '@/lib/motion/reducedMotion'
import { MODULE_META, SUBMODULE_META, LEGACY_MODULE_ROUTES, LEGACY_SUBMODULE_ROUTES, type SidebarSubItem } from '@/layouts/sidebar/sidebarMeta'

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
  const [openModuleCode, setOpenModuleCode] = useState<string | null>(null)
  const toggleModule = (codigo: string) => setOpenModuleCode(prev => prev === codigo ? null : codigo)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const autoCollapsePaths = ['/administrador/ventas', '/administrador/tienda/pedidos']
  const isSidebarCollapsed = sidebarCollapsed || autoCollapsePaths.some(p => location.pathname.startsWith(p))
  const [isSedeMenuOpen, setIsSedeMenuOpen] = useState(false)
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const sedeMenuRef = useRef<HTMLDivElement | null>(null)
  const zoomMenuRef = useRef<HTMLDivElement | null>(null)
  const mainRef = useRef<HTMLElement | null>(null)
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

  const logout = () => {
    useAuthStore.getState().logout()
    navigate('/login', { replace: true })
  }

  // Determine theme based on role
  const isSystemAdmin = auth?.rol === 'ADMIN_SISTEMA'

  // Sidebar dinámico: módulos y submódulos del plan, ordenados
  const planModules = useMemo(() => {
    const mods = auth?.empresa?.plan?.modulosAsignados ?? [];
    return [...mods].sort((a, b) => (a.modulo.orden ?? 0) - (b.modulo.orden ?? 0));
  }, [auth?.empresa?.plan?.modulosAsignados]);

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

  // Mapping SidebarColor to gradient backgrounds
  const getSidebarBackground = (color: string) => {
    switch (color) {
      case 'primary': // Pink/Fuchsia
        return 'bg-gradient-to-b from-[#F4F4F4] via-[#F4F4F4] to-fuchsia-100';
      case 'dark': // Gray/Navy
        return 'bg-gradient-to-b from-[#F4F4F4] via-[#F4F4F4] to-slate-200';
      case 'info': // Blue
        return 'bg-gradient-to-b from-[#F4F4F4] via-[#F4F4F4] to-blue-100';
      case 'success': // Green
        return 'bg-gradient-to-b from-[#F4F4F4] via-[#F4F4F4] to-emerald-100';
      case 'warning': // Orange
        return 'bg-gradient-to-b from-[#F4F4F4] via-[#F4F4F4] to-[#FFE5B4]';
      case 'error': // Red
        return 'bg-gradient-to-b from-[#F4F4F4] via-[#F4F4F4] to-red-100';
      default:
        return 'bg-gradient-to-b from-[#F4F4F4] via-[#F4F4F4] to-blue-100';
    }
  };

  // Theme adaptado al diseño de referencia
  const getActiveItemColor = () => {
    switch (sidebarColor) {
      case 'primary': return 'bg-fuchsia-600 shadow-[0_4px_12px_rgba(192,38,211,0.35)]';
      case 'dark': return 'bg-gray-800 shadow-[0_4px_12px_rgba(31,41,55,0.35)] dark:bg-gray-700';
      case 'info': return 'bg-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.35)]';
      case 'success': return 'bg-emerald-600 shadow-[0_4px_12px_rgba(5,150,105,0.35)]';
      case 'warning': return 'bg-orange-500 shadow-[0_4px_12px_rgba(249,115,22,0.35)]';
      case 'error': return 'bg-red-500 shadow-[0_4px_12px_rgba(239,68,68,0.35)]';
      default: return 'bg-violet-600 shadow-[0_4px_12px_rgba(124,58,237,0.35)]';
    }
  };

  const getSubmenuActiveColor = () => {
    switch (sidebarColor) {
      case 'primary': return 'text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-900/30';
      case 'dark': return 'text-gray-800 bg-gray-100 dark:bg-gray-800/50 dark:text-gray-200';
      case 'info': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/30';
      case 'success': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30';
      case 'warning': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/30';
      case 'error': return 'text-red-600 bg-red-50 dark:bg-red-900/30';
      default: return 'text-violet-600 bg-violet-50 dark:bg-violet-900/30';
    }
  };

  const theme = {
    mainPadding: 'p-5',

    get sidebarBg() {
      switch (sidebarType) {
        case 'dark': return 'bg-gray-900 border-r border-gray-800 shadow-[2px_0_20px_rgba(0,0,0,0.2)] text-white';
        case 'transparent': return 'bg-transparent border-r border-transparent text-gray-800 dark:text-white dark:border-slate-800';
        case 'white':
        default: return 'bg-white border-r border-gray-100 dark:bg-[#0A0D14] dark:border-slate-800 shadow-[2px_0_20px_rgba(0,0,0,0.06)] text-gray-900 dark:text-white';
      }
    },

    get sidebarText() {
      return sidebarType === 'dark' ? 'text-white' : 'text-gray-900 dark:text-white';
    },

    get sidebarTextMuted() {
      return sidebarType === 'dark' ? 'text-gray-400' : 'text-gray-400 dark:text-slate-500';
    },

    // Item activo
    get activeLink() {
      return `flex items-center ${isSidebarCollapsed ? 'justify-center mx-auto w-11 h-11 p-0 rounded-xl' : 'w-full px-3.5 py-2.5 rounded-xl'} text-[13px] font-semibold text-white ${getActiveItemColor()} transition-all duration-200 group`;
    },
    // Item inactivo
    get inactiveLink() {
      return `flex items-center ${isSidebarCollapsed ? 'justify-center mx-auto w-11 h-11 p-0 rounded-xl' : 'w-full px-3.5 py-2.5 rounded-xl'} text-[13px] font-medium ${sidebarType === 'dark' ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-slate-800'} transition-all duration-150 group`;
    },
    // Accordion activo e inactivo
    get accordionActive() {
      return `flex items-center ${isSidebarCollapsed ? 'justify-center mx-auto w-11 h-11 p-0 rounded-xl' : 'justify-between w-full px-3.5 py-2.5 rounded-xl'} text-[13px] font-semibold text-white ${getActiveItemColor()} transition-all text-left`;
    },
    get accordionInactive() {
      return `flex items-center ${isSidebarCollapsed ? 'justify-center mx-auto w-11 h-11 p-0 rounded-xl' : 'justify-between w-full px-3.5 py-2.5 rounded-xl'} text-[13px] font-medium ${sidebarType === 'dark' ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-slate-800'} transition-all text-left`;
    },
    // Submenu links
    get submenuBorder() {
      return sidebarType === 'dark' ? 'border-gray-700' : 'border-gray-200 dark:border-slate-800';
    },
    get submenuActiveLink() {
      return `flex items-center px-3.5 py-2 text-[13px] font-semibold ${getSubmenuActiveColor()} rounded-lg transition-all`;
    },
    get submenuInactiveLink() {
      return `flex items-center px-3.5 py-2 text-[13px] font-medium ${sidebarType === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-slate-800'} rounded-lg transition-all`;
    },
  };


  return (
    <motion.div
      className="flex overflow-hidden bg-[#F0F2FA] dark:bg-[#0A0D14] transition-all duration-300"
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        zoom: String(ZOOM_OPTIONS[zoomLevel]?.zoom ?? 1),
        height: ZOOM_OPTIONS[zoomLevel]?.height ?? '100vh'
      }}
      variants={fadeIn}
      initial="initial"
      animate={reduceMotion ? { opacity: 1 } : 'animate'}
    >

      {/* Sidebar/Drawer */}
      <motion.aside
        className={`print:hidden fixed inset-y-0 left-0 ${theme.sidebarBg} flex flex-col pt-5 pb-4 w-[85%] max-w-[260px] transform transition-all duration-300 ease-in-out md:relative ${isSidebarCollapsed ? 'md:w-[76px] items-center px-2' : 'md:w-[260px] px-4'} md:translate-x-0 ${isSidebarOpen ? 'translate-x-0 z-[70]' : '-translate-x-full z-1 md:translate-x-0'}`}
        variants={slideRight}
        initial="initial"
        animate={reduceMotion ? { opacity: 1, x: 0 } : 'animate'}
      >
        {/* Logo area */}
        <div className={`flex items-center w-full relative mb-6 ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-2'}`}>
          <div className={`flex items-center gap-2.5 ${isSidebarCollapsed ? 'flex-col' : ''}`}>
            <div className="flex items-center justify-center w-10 h-10 overflow-hidden rounded-full">
              <img src={sidebarBrand.logoWhite} alt={sidebarBrand.name} className={`object-contain ${isSidebarCollapsed ? 'w-10 h-10 scale-150 object-left' : 'w-10 h-10 rounded-full'}`} />
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <h2 className={`text-[15px] font-bold tracking-tight leading-none truncate ${theme.sidebarText}`}>{sidebarBrand.name.toUpperCase()}</h2>
                <p className={`text-[9px] font-semibold tracking-widest mt-0.5 uppercase truncate ${theme.sidebarTextMuted}`}>Panel Administrativo</p>
              </div>
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          className={`hidden md:flex items-center absolute top-7 -translate-y-1/2 z-[80] justify-center w-8 h-8 bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-700 shadow-xl shadow-gray-950/10 transition-all cursor-pointer -right-4`}
          title={isSidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          <Icon icon={isSidebarCollapsed ? "solar:alt-arrow-right-linear" : "solar:alt-arrow-left-linear"} width="14" />
        </button>

      <div className={`flex-1 space-y-0.5 ${isSidebarCollapsed ? 'px-0 w-full overflow-visible mt-2' : 'pr-1 overflow-y-auto overflow-x-hidden custom-scrollbar'}`}>
          <motion.nav
            className="space-y-0.5 w-full"
            variants={navStagger}
            initial={reduceMotion ? false : 'initial'}
            animate="animate"
          >
            {auth?.rol === 'ADMIN_SISTEMA' && (
              <motion.div variants={navItemReveal} className="space-y-0.5">
                <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/empresas" className={({ isActive }) => isActive || location.pathname.startsWith('/administrador/empresas') ? theme.activeLink : theme.inactiveLink} title="Empresas">
                  <Icon icon="solar:buildings-2-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                  {!isSidebarCollapsed && <span>Empresas</span>}
                </NavLink>

                <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/usuarios" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Usuarios del Sistema">
                  <Icon icon="solar:shield-user-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                  {!isSidebarCollapsed && <span>Usuarios Sistema</span>}
                </NavLink>

                <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/catalogo-global" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Catálogo Global">
                  <Icon icon="solar:database-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                  {!isSidebarCollapsed && <span>Catálogo Global</span>}
                </NavLink>
                <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/planes" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Planes">
                  <Icon icon="solar:card-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                  {!isSidebarCollapsed && <span>Planes</span>}
                </NavLink>
                <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/modulos" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Módulos">
                  <Icon icon="solar:widget-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                  {!isSidebarCollapsed && <span>Módulos</span>}
                </NavLink>
                <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/resellers" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Distribuidores">
                  <Icon icon="solar:users-group-two-rounded-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                  {!isSidebarCollapsed && <span>Distribuidores</span>}
                </NavLink>
                <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/catalogo-web" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Catálogo Web">
                  <Icon icon="solar:shop-2-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                  {!isSidebarCollapsed && <span>Catálogo Web</span>}
                </NavLink>
                <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/rubros" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Rubros de Negocio">
                  <Icon icon="solar:buildings-3-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                  {!isSidebarCollapsed && <span>Rubros</span>}
                </NavLink>
                <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/disenos-tienda" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Diseño de Tiendas">
                  <Icon icon="solar:palette-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                  {!isSidebarCollapsed && <span>Diseño Tiendas</span>}
                </NavLink>
              </motion.div>
            )}

            {auth?.rol === 'ADMIN_SISTEMA' && (
              <motion.div variants={navItemReveal} className="space-y-0.5">
                <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/finanzas" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Finanzas del Sistema">
                  <Icon icon="solar:chart-square-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                  {!isSidebarCollapsed && <span>Finanzas</span>}
                </NavLink>
              </motion.div>
            )}

            {(auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'USUARIO_EMPRESA') && (
              <>
                {/* ── Sidebar dinámico generado desde plan.modulosAsignados ── */}
                {planModules.map(({ modulo }) => {
                  if (!hasPermission(auth, modulo.codigo)) return null;
                  const meta = MODULE_META[modulo.codigo];
                  if (meta?.condition && !meta.condition(auth)) return null;

                  const label = meta?.labelOverride?.(auth) ?? modulo.nombre ?? modulo.codigo;
                  const icon = meta?.iconOverride?.(auth) ?? modulo.icono ?? 'solar:circle-bold-duotone';
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

                  if (allSubItems.length === 0) {
                    return (
                      <NavLink
                        key={modulo.id ?? modulo.codigo}
                        onClick={() => { setIsSidebarOpen(false); setNameNavbar(label); }}
                        to={ruta ?? '#'}
                        end={modulo.codigo === 'dashboard'}
                        className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink}
                        title={label}
                      >
                        <Icon icon={icon} className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                        {!isSidebarCollapsed && <span>{label}</span>}
                      </NavLink>
                    );
                  }

                  return (
                    <div key={modulo.id ?? modulo.codigo} className="relative group">
                      <button
                        onClick={() => {
                          if (isSidebarCollapsed) { navigate(navRoute); }
                          else { toggleModule(modulo.codigo); }
                          setNameNavbar(label);
                        }}
                        className={isModuleActive ? theme.accordionActive : theme.accordionInactive}
                        title={label}
                      >
                        <div className="flex items-center justify-center">
                          <Icon icon={icon} className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                          {!isSidebarCollapsed && <span>{label}</span>}
                        </div>
                        {!isSidebarCollapsed && (
                          <Icon icon="solar:alt-arrow-down-linear" className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} width="18" />
                        )}
                      </button>
                      {/* Collapsed popover */}
                      {isSidebarCollapsed && (
                        <div className="absolute left-full top-0 ml-1 bg-white dark:bg-slate-900 rounded-xl shadow-xl w-48 py-2 z-[9999] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                          <div className="px-4 py-2 text-xs font-bold text-gray-400 mb-1 border-b border-gray-100 dark:border-slate-700">{label}</div>
                          {allSubItems.map(item => (
                            <NavLink key={item.codigo} onClick={() => setIsSidebarOpen(false)} to={item.ruta} end={item.end}
                              className={() => {
                                const active = item.end ? location.pathname === item.ruta : location.pathname.startsWith(item.ruta);
                                return active ? theme.submenuActiveLink : theme.submenuInactiveLink;
                              }}
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
                            className={'ml-4 pl-4 border-l-2 ' + theme.submenuBorder + ' space-y-1 mt-1'}
                            style={{ overflow: 'hidden' }}
                          >
                            {allSubItems.map(item => (
                              <NavLink key={item.codigo} onClick={() => setIsSidebarOpen(false)} to={item.ruta} end={item.end}
                                className={() => {
                                  const active = item.end ? location.pathname === item.ruta : location.pathname.startsWith(item.ruta);
                                  return active ? theme.submenuActiveLink : theme.submenuInactiveLink;
                                }}
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
                    <Icon icon="solar:chart-2-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                    {!isSidebarCollapsed && <span>Dashboard</span>}
                  </NavLink>
                )}

              </>
            )}

          </motion.nav>
        </div>

        {/* Mis Comisiones — solo para vendedores (USUARIO_EMPRESA) */}
        {auth?.rol === 'USUARIO_EMPRESA' && (
          <div className="px-2 pb-1">
            <NavLink
              onClick={() => setIsSidebarOpen(false)}
              to="/administrador/mis-comisiones"
              className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink}
              title="Mis Comisiones"
            >
              <Icon icon="solar:hand-money-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'} text-amber-500`} />
              {!isSidebarCollapsed && <span>Mis Comisiones</span>}
            </NavLink>
          </div>
        )}

        {/* Divider y configuración abajo */}
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-0.5 w-full">
          <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Configuración Settings') }} to="/administrador/perfil" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Settings">
            <Icon icon="solar:settings-bold-duotone" className={`${isSidebarCollapsed ? 'text-xl m-0' : 'mr-3 text-[18px]'}`} />
            {!isSidebarCollapsed && <span>Settings</span>}
          </NavLink>
          <button onClick={() => { setIsSidebarOpen(false); logout() }} className={theme.inactiveLink} title="Logout">
            <Icon icon="solar:logout-bold-duotone" className={`${isSidebarCollapsed ? 'text-xl m-0' : 'mr-3 text-[18px] text-red-400'}`} />
            {!isSidebarCollapsed && <span className="text-red-500">Cerrar sesión</span>}
          </button>
        </div>
      </motion.aside>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            className="print:hidden fixed inset-0 bg-black/40 z-[60] md:hidden"
            onClick={() => setIsSidebarOpen(false)}
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
        className="flex-1 min-h-0 flex flex-col min-w-0 overflow-y-auto print:overflow-visible bg-[#F9FAFC] dark:bg-[#0A0D14]"
      >
        <div className={`shrink-0 z-[50] transition-all duration-300 ${navbarFixed ? 'sticky top-0' : 'relative'}`}>
          <motion.header className="print:hidden flex items-center justify-between px-6 py-3.5 bg-white/90 backdrop-blur-md border-b border-gray-100 dark:bg-[#0A0D14]/90 dark:border-slate-800 transition-all duration-300" variants={fadeUp} initial="initial" animate="animate">
          <div className="flex items-center gap-4">
            <motion.button
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir menú"
              whileHover={interactiveHover.whileHover}
              whileTap={interactiveHover.whileTap}
            >
              <Icon icon="solar:hamburger-menu-linear" width="22" className="text-gray-600" />
            </motion.button>
            <div className="flex items-center gap-1.5 text-[13px] font-medium">
              <span className="text-gray-400">Administrador</span>
              <Icon icon="solar:alt-arrow-right-linear" width="13" className="text-gray-300" />
              <span className="text-violet-600 font-semibold">{nameNavbar}</span>
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
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 border border-violet-100 rounded-lg hover:bg-violet-100 transition-colors"
                  >
                    <Icon icon="solar:city-bold-duotone" className="text-violet-600" width={14} />
                    <span className="text-[12px] font-semibold text-violet-600 truncate max-w-[140px]">{sedeActiva.nombre}</span>
                    <Icon icon="solar:alt-arrow-down-linear" className="text-violet-600" width={12} />
                  </button>
                  <AnimatePresence>
                    {isSedeMenuOpen && (
                    <motion.div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[180px]" variants={scaleIn} initial="initial" animate="animate" exit="exit">
                      <p className="text-[10px] uppercase font-bold text-gray-400 px-3 py-1 tracking-wider">Cambiar sede</p>
                      {todasSedes.filter(s => s.activo).map(sede => (
                        <button
                          key={sede.id}
                          type="button"
                          onClick={() => {
                            selectSede(sede.id)
                            setIsSedeMenuOpen(false)
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${sede.id === sedeActiva.id ? 'bg-violet-50 text-violet-600 font-semibold cursor-default' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          <Icon icon={sede.id === sedeActiva.id ? 'solar:check-circle-bold' : 'solar:city-linear'} width={14} />
                          {sede.nombre}
                          {sede.esPrincipal && <span className="ml-auto text-[10px] text-gray-400 font-normal">Principal</span>}
                        </button>
                      ))}
                    </motion.div>
                  )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 border border-violet-100 rounded-lg">
                  <Icon icon="solar:city-bold-duotone" className="text-violet-600" width={14} />
                  <span className="text-[12px] font-semibold text-violet-600 truncate max-w-[140px]">{sedeActiva.nombre}</span>
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
                          className={zoomLevel === opt.level ? 'text-violet-500' : 'text-gray-400'}
                        />
                        {opt.level === 0 ? 'Normal' : opt.level === 1 ? 'Compacto' : opt.level === 2 ? 'Más compacto' : 'Mínimo'}
                      </span>
                      <span className={`text-xs font-mono ${zoomLevel === opt.level ? 'text-violet-500' : 'text-gray-400'}`}>
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
                className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-lg transition-colors"
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
            <div className="hidden md:block w-px h-6 bg-gray-200 mx-2" />

            {/* User profile */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                className="flex items-center gap-2.5 rounded-full outline-none focus:outline-none hover:bg-gray-50 px-2 py-1.5 transition-all border border-transparent hover:border-gray-200"
                onClick={() => setIsUserMenuOpen((p) => !p)}
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
              >
                <img
                  width={34}
                  height={34}
                  className="rounded-full object-cover ring-2 ring-indigo-100"
                  src={companyLogoSrc}
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = defaultProfileLogo
                  }}
                  alt=""
                />
                <div className="hidden md:flex flex-col items-start gap-0">
                  <span className="text-[13px] font-semibold text-gray-800 leading-tight">{auth?.nombre?.split(' ')[0]}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider leading-tight">{auth?.empresa?.nombreComercial?.split(' ')[0] ?? auth?.rol?.replace('ADMIN_', '')?.replace('USUARIO_', '')}</span>
                </div>
                <Icon icon="solar:alt-arrow-down-bold" className="hidden md:block text-gray-400" width="14" />
              </button>

              <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/60 z-[999999] overflow-hidden" variants={scaleIn} initial="initial" animate="animate" exit="exit">
                  <div className="px-4 py-3.5 bg-gray-50 border-b border-gray-100">
                    <p className="text-[13px] font-bold text-gray-900 truncate">{auth?.nombre}</p>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{auth?.empresa?.nombreComercial}</p>
                  </div>
                  <ul className="py-1.5" role="menu">
                    <li>
                      <button
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-gray-600 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                        onClick={() => { setIsUserMenuOpen(false); navigate('/administrador/perfil') }}
                        role="menuitem"
                      >
                        <Icon icon="solar:user-circle-bold-duotone" width="18" />
                        Perfil
                      </button>
                    </li>
                    {(auth?.empresa?.slugTienda || hasPlanFeature(auth, 'tieneTienda')) && (
                      <li>
                        <button
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-gray-600 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                          onClick={() => { setIsUserMenuOpen(false); if (auth?.empresa?.slugTienda) navigate(`/tienda/${auth.empresa.slugTienda}`); else navigate('/administrador/tienda/configuracion'); }}
                          role="menuitem"
                        >
                          <Icon icon="solar:shop-bold-duotone" width="18" />
                          Ir a tienda virtual
                        </button>
                      </li>
                    )}
                    <li className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors"
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
          <Outlet />
        </div>
      </main>
      <Configurator />
    </motion.div>
  )
}
