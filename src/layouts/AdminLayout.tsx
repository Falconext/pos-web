import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore, type IAuthState } from '@/zustand/auth'
import NotificacionesCampana from '@/components/NotificacionesCampana'
import { hasPermission, getRedirectPath } from '@/utils/permissions'
import { useThemeStore } from '@/zustand/theme'
import Configurator from '@/components/ui/Configurator'

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { auth, sedeActiva, selectSede }: IAuthState = useAuthStore()
  const { sidebarColor, sidebarType, navbarFixed, toggleConfigurator, isCompact, toggleCompact } = useThemeStore()

  // Detectar si el rubro es restaurante para cambiar nombres del menú
  const isRestaurante = useMemo(() => {
    const rubroNombre = auth?.empresa?.rubro?.nombre?.toLowerCase() || ''
    return rubroNombre.includes('restaurante') || rubroNombre.includes('comida') || rubroNombre.includes('alimento')
  }, [auth?.empresa?.rubro?.nombre])

  // Nombres dinámicos según el rubro
  const menuLabels = useMemo(() => ({
    kardexTitle: isRestaurante ? 'Catálogo' : 'Kardex',
    productosLabel: isRestaurante ? 'Platos' : 'Productos',
    kardexIcon: isRestaurante ? 'mdi:silverware-fork-knife' : 'basil:book-open-outline'
  }), [isRestaurante])

  const [nameNavbar, setNameNavbar] = useState<string>('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isFactSubmenuOpen, setIsFactSubmenuOpen] = useState(false)
  const [isInformalSubmenuOpen, setIsInformalSubmenuOpen] = useState(false)
  const [isContSubmenuOpen, setIsContSubmenuOpen] = useState(false)
  const [isKardexSubmenuOpen, setIsKardexSubmenuOpen] = useState(false)
  const [isCajaSubmenuOpen, setIsCajaSubmenuOpen] = useState(false)
  const [isTiendaSubmenuOpen, setIsTiendaSubmenuOpen] = useState(false)
  const [isCotizSubmenuOpen, setIsCotizSubmenuOpen] = useState(false)
  const [isGuiasSubmenuOpen, setIsGuiasSubmenuOpen] = useState(false)
  const [isComprasSubmenuOpen, setIsComprasSubmenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false) // NUEVO ESTADO PARA DESKTOP
  const [isSedeMenuOpen, setIsSedeMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const sedeMenuRef = useRef<HTMLDivElement | null>(null)
  const scrollYRef = useRef(0)

  // Cerrar todos los acordeones
  const closeAllAccordions = () => {
    setIsFactSubmenuOpen(false)
    setIsInformalSubmenuOpen(false)
    setIsContSubmenuOpen(false)
    setIsKardexSubmenuOpen(false)
    setIsCajaSubmenuOpen(false)
    setIsTiendaSubmenuOpen(false)
    setIsTiendaSubmenuOpen(false)
    setIsCotizSubmenuOpen(false)
    setIsComprasSubmenuOpen(false)
    setIsGuiasSubmenuOpen(false)
  }

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!userMenuRef.current) return
      if (!userMenuRef.current.contains(e.target as Node)) setIsUserMenuOpen(false)
      if (sedeMenuRef.current && !sedeMenuRef.current.contains(e.target as Node)) setIsSedeMenuOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setIsUserMenuOpen(false); setIsSedeMenuOpen(false) }
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEsc)
    }
  }, [])

  // Alternar acordeón exclusivo
  const toggleAccordion = (key: 'fact' | 'informal' | 'cont' | 'kardex' | 'caja' | 'tienda' | 'cotiz' | 'compras' | 'guias') => {
    if (key === 'fact') {
      const next = !isFactSubmenuOpen
      closeAllAccordions()
      setIsFactSubmenuOpen(next)
    } else if (key === 'informal') {
      const next = !isInformalSubmenuOpen
      closeAllAccordions()
      setIsInformalSubmenuOpen(next)
    } else if (key === 'cont') {
      const next = !isContSubmenuOpen
      closeAllAccordions()
      setIsContSubmenuOpen(next)
    } else if (key === 'kardex') {
      const next = !isKardexSubmenuOpen
      closeAllAccordions()
      setIsKardexSubmenuOpen(next)
    } else if (key === 'caja') {
      const next = !isCajaSubmenuOpen
      closeAllAccordions()
      setIsCajaSubmenuOpen(next)
    } else if (key === 'tienda') {
      const next = !isTiendaSubmenuOpen
      closeAllAccordions()
      setIsTiendaSubmenuOpen(next)
    } else if (key === 'cotiz') {
      const next = !isCotizSubmenuOpen
      closeAllAccordions()
      setIsCotizSubmenuOpen(next)
    } else if (key === 'compras') {
      const next = !isComprasSubmenuOpen
      closeAllAccordions()
      setIsComprasSubmenuOpen(next)
    } else if (key === 'guias') {
      const next = !isGuiasSubmenuOpen
      closeAllAccordions()
      setIsGuiasSubmenuOpen(next)
    }
  }

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
    return () => unlock()
  }, [isSidebarOpen])

  const logout = () => {
    localStorage.removeItem('ACCESS_TOKEN')
    localStorage.removeItem('REFRESH_TOKEN')
    navigate('/login', { replace: true })
  }

  // Determine theme based on role
  const isSystemAdmin = auth?.rol === 'ADMIN_SISTEMA'

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

  // Theme adaptado al diseño de referencia (sidebar blanco + ítem activo azul sólido)
  const theme = {
    mainPadding: 'p-5',
    sidebarBg: 'bg-white',
    sidebarBorder: 'border-none',

    // Item activo: pill azul-índigo sólido, texto blanco
    get activeLink() {
      return `flex items-center ${isSidebarCollapsed ? 'justify-center mx-auto w-11 h-11 p-0 rounded-xl' : 'w-full px-3.5 py-2.5 rounded-xl'} text-[13px] font-semibold text-white bg-[#4F6EF7] shadow-[0_4px_12px_rgba(79,110,247,0.35)] transition-all duration-200 group`;
    },
    // Item inactivo: texto gris oscuro, hover sutil
    get inactiveLink() {
      return `flex items-center ${isSidebarCollapsed ? 'justify-center mx-auto w-11 h-11 p-0 rounded-xl' : 'w-full px-3.5 py-2.5 rounded-xl'} text-[13px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150 group`;
    },
    // Accordion activo e inactivo
    get accordionActive() {
      return `flex items-center ${isSidebarCollapsed ? 'justify-center mx-auto w-11 h-11 p-0 rounded-xl' : 'justify-between w-full px-3.5 py-2.5 rounded-xl'} text-[13px] font-semibold text-white bg-[#4F6EF7] shadow-[0_4px_12px_rgba(79,110,247,0.35)] transition-all text-left`;
    },
    get accordionInactive() {
      return `flex items-center ${isSidebarCollapsed ? 'justify-center mx-auto w-11 h-11 p-0 rounded-xl' : 'justify-between w-full px-3.5 py-2.5 rounded-xl'} text-[13px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all text-left`;
    },
    // Submenu links
    submenuBorder: 'border-gray-200',
    get submenuActiveLink() {
      return `flex items-center px-3.5 py-2 text-[13px] font-semibold text-[#4F6EF7] bg-indigo-50 rounded-lg transition-all`;
    },
    get submenuInactiveLink() {
      return `flex items-center px-3.5 py-2 text-[13px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all`;
    },
    primaryBorder: 'border-gray-200',
  }

  return (
    <div
      className="flex overflow-hidden bg-[#F0F2FA] transition-all duration-300"
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        zoom: isCompact ? '0.9' : '1',
        height: isCompact ? '110vh' : '100vh'
      }}
    >

      {/* Sidebar/Drawer */}
      <aside className={`fixed inset-y-0 left-0 bg-white shadow-[2px_0_20px_rgba(0,0,0,0.06)] flex flex-col pt-5 pb-4 w-[85%] max-w-[260px] transform transition-all duration-300 ease-in-out md:static ${isSidebarCollapsed ? 'md:w-[76px] items-center px-2' : 'md:w-[260px] px-4'} md:translate-x-0 ${isSidebarOpen ? 'translate-x-0 z-[70]' : '-translate-x-full z-1 md:translate-x-0'}`}>
        {/* Logo area */}
        <div className={`flex items-center mb-6 ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-2'}`}>
          <div className={`flex items-center gap-2.5 ${isSidebarCollapsed ? 'flex-col' : ''}`}>
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#4F6EF7] shadow-md shadow-indigo-200">
              <img src="/fnlogo.png" alt="Falconext" className="w-5 h-5 object-contain brightness-0 invert" />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <h2 className="text-[15px] font-bold tracking-tight leading-none text-gray-900">FALCONEXT</h2>
                <p className="text-[9px] text-gray-400 font-semibold tracking-widest mt-0.5 uppercase">Panel Administrativo</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex items-center justify-center w-7 h-7 bg-gray-100 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
          >
            <Icon icon={isSidebarCollapsed ? "solar:alt-arrow-right-linear" : "solar:alt-arrow-left-linear"} width="14" />
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto overflow-x-hidden space-y-0.5 ${isSidebarCollapsed ? 'px-0 w-full scrollbar-none [&::-webkit-scrollbar]:hidden' : 'pr-1 custom-scrollbar'}`}>
          <nav className="space-y-0.5 w-full">
            {auth?.rol === 'ADMIN_SISTEMA' && (
              <>
                <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/empresas" className={({ isActive }) => isActive || location.pathname.startsWith('/administrador/empresas') ? theme.activeLink : theme.inactiveLink} title="Empresas">
                  <Icon icon="solar:buildings-2-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                  {!isSidebarCollapsed && <span>Empresas</span>}
                </NavLink>
                <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/diseno-rubros" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Diseño por Rubro">
                  <Icon icon="solar:palette-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                  {!isSidebarCollapsed && <span>Diseño por Rubro</span>}
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
              </>
            )}

            {(auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'USUARIO_EMPRESA') && (
              <>
                {/* Dashboard */}
                {hasPermission(auth, 'dashboard') && (
                  <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Administrador') }} to="/administrador" end className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Dashboard">
                    <Icon icon="solar:chart-2-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                    {!isSidebarCollapsed && <span>Dashboard</span>}
                  </NavLink>
                )}

                {/* TÍTULO: INVENTARIO / CATÁLOGO */}
                {!isSidebarCollapsed && (
                  <div className="px-2 mt-5 mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em]">Inventario</span>
                  </div>
                )}
                {isSidebarCollapsed && <div className="h-4"></div>}

                {/* Kardex / Catálogo */}
                {hasPermission(auth, 'kardex') && (
                  <div className="relative group/submenu">
                    <button onClick={() => { if (isSidebarCollapsed) { navigate('/administrador/kardex/productos'); } else { toggleAccordion('kardex'); } setNameNavbar(menuLabels.kardexTitle) }} className={location.pathname.includes('/administrador/kardex') ? theme.accordionActive : theme.accordionInactive} title={menuLabels.kardexTitle}>
                      <div className="flex items-center justify-center">
                        <Icon icon={isRestaurante ? 'solar:chef-hat-bold-duotone' : 'solar:box-bold-duotone'} className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                        {!isSidebarCollapsed && <span>{menuLabels.kardexTitle}</span>}
                      </div>
                      {!isSidebarCollapsed && <Icon icon="solar:alt-arrow-down-linear" className={`transition-transform duration-200 ${isKardexSubmenuOpen ? 'rotate-180' : ''}`} width="18" />}
                    </button>
                    {((!isSidebarCollapsed && isKardexSubmenuOpen) || isSidebarCollapsed) && (
                      <div className={`${isSidebarCollapsed ? 'absolute left-full top-0 ml-2 bg-white rounded-xl shadow-xl w-48 py-2 z-50 opacity-0 invisible group-hover/submenu:opacity-100 group-hover/submenu:visible transition-all' : 'ml-4 pl-4 border-l-2 ' + theme.primaryBorder + ' space-y-1 mt-1'}`}>
                        {isSidebarCollapsed && <div className="px-4 py-2 text-xs font-bold text-gray-400 mb-1 border-b border-gray-100">{menuLabels.kardexTitle}</div>}
                        <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/kardex/dashboard" className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                          Dashboard
                        </NavLink>
                        <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/kardex/productos" className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                          {menuLabels.productosLabel}
                        </NavLink>
                        <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/kardex/traslados" className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                          Traslado entre sedes
                        </NavLink>
                        {/* Combos */}
                        {(() => {
                          const rubroNombre = auth?.empresa?.rubro?.nombre?.toLowerCase() || '';
                          const esFarmacia = rubroNombre.includes('farmacia') || rubroNombre.includes('botica');
                          return !esFarmacia ? (
                            <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/kardex/combos" className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                              Kits / Packs
                            </NavLink>
                          ) : null;
                        })()}
                        <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/kardex" end className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                          Movimientos
                        </NavLink>
                      </div>
                    )}
                  </div>
                )}

                {/* TÍTULO: VENTAS */}
                {!isSidebarCollapsed && (
                  <div className="px-2 mt-5 mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em]">Ventas</span>
                  </div>
                )}
                {isSidebarCollapsed && <div className="h-4"></div>}

                {/* Facturación SUNAT - Solo para empresas formales */}
                {hasPermission(auth, 'comprobantes') && auth?.empresa?.tipoEmpresa === 'FORMAL' && (
                  <div className="relative group/submenu">
                    <button onClick={() => { if (isSidebarCollapsed) { navigate('/administrador/facturacion/comprobantes'); } else { toggleAccordion('fact'); } setNameNavbar('Facturacion') }} className={(location.pathname.includes('/administrador/facturacion/comprobantes') || location.pathname.includes('/administrador/facturacion/nuevo')) && !location.pathname.includes('informales') ? theme.accordionActive : theme.accordionInactive} title="Fact. SUNAT">
                      <div className="flex items-center justify-center">
                        <Icon icon="solar:bill-list-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                        {!isSidebarCollapsed && <span>Fact. SUNAT</span>}
                      </div>
                      {!isSidebarCollapsed && <Icon icon="solar:alt-arrow-down-linear" className={`transition-transform duration-200 ${isFactSubmenuOpen ? 'rotate-180' : ''}`} width="18" />}
                    </button>
                    {((!isSidebarCollapsed && isFactSubmenuOpen) || isSidebarCollapsed) && (
                      <div className={`${isSidebarCollapsed ? 'absolute left-full top-0 ml-2 bg-white rounded-xl shadow-xl w-48 py-2 z-50 opacity-0 invisible group-hover/submenu:opacity-100 group-hover/submenu:visible transition-all' : 'ml-4 pl-4 border-l-2 ' + theme.primaryBorder + ' space-y-1 mt-1'}`}>
                        {isSidebarCollapsed && <div className="px-4 py-2 text-xs font-bold text-gray-400 mb-1 border-b border-gray-100">Fact. SUNAT</div>}
                        <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/facturacion/comprobantes" className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                          Comprobantes SUNAT
                        </NavLink>
                        <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/facturacion/nuevo" className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                          Crear comprobantes
                        </NavLink>
                      </div>
                    )}
                  </div>
                )}

                {/* Comprobantes Informales */}
                {hasPermission(auth, 'comprobantes') && (auth?.empresa?.tipoEmpresa === 'FORMAL' || auth?.empresa?.tipoEmpresa === 'INFORMAL') && (
                  <div className="relative group/submenu">
                    <button onClick={() => { if (isSidebarCollapsed) { navigate('/administrador/facturacion/comprobantes-informales'); } else { toggleAccordion('informal'); } setNameNavbar('Comprobantes Informales') }} className={location.pathname.includes('/administrador/facturacion/comprobantes-informales') ? theme.accordionActive : theme.accordionInactive} title="Notas de Pedido">
                      <div className="flex items-center justify-center">
                        <Icon icon="solar:notes-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                        {!isSidebarCollapsed && <span>Notas de Pedido</span>}
                      </div>
                      {!isSidebarCollapsed && <Icon icon="solar:alt-arrow-down-linear" className={`transition-transform duration-200 ${isInformalSubmenuOpen ? 'rotate-180' : ''}`} width="18" />}
                    </button>
                    {((!isSidebarCollapsed && isInformalSubmenuOpen) || isSidebarCollapsed) && (
                      <div className={`${isSidebarCollapsed ? 'absolute left-full top-0 ml-2 bg-white rounded-xl shadow-xl w-48 py-2 z-50 opacity-0 invisible group-hover/submenu:opacity-100 group-hover/submenu:visible transition-all' : 'ml-4 pl-4 border-l-2 ' + theme.primaryBorder + ' space-y-1 mt-1'}`}>
                        {isSidebarCollapsed && <div className="px-4 py-2 text-xs font-bold text-gray-400 mb-1 border-b border-gray-100">Notas de Pedido</div>}
                        <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/facturacion/comprobantes-informales" className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                          Notas de ventas
                        </NavLink>
                        {auth?.empresa?.tipoEmpresa === 'INFORMAL' && (
                          <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/facturacion/nuevo" className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                            Crear comprobantes
                          </NavLink>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Cotizaciones */}
                {hasPermission(auth, 'cotizaciones') && (
                  <div className="relative group/submenu">
                    <button onClick={() => { if (isSidebarCollapsed) { navigate('/administrador/cotizaciones'); } else { toggleAccordion('cotiz'); } setNameNavbar('Cotizaciones') }} className={location.pathname.includes('/administrador/cotizaciones') ? theme.accordionActive : theme.accordionInactive} title="Cotizaciones">
                      <div className="flex items-center justify-center">
                        <Icon icon="solar:document-text-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                        {!isSidebarCollapsed && <span>Cotizaciones</span>}
                      </div>
                      {!isSidebarCollapsed && <Icon icon="solar:alt-arrow-down-linear" className={`transition-transform duration-200 ${isCotizSubmenuOpen ? 'rotate-180' : ''}`} width="18" />}
                    </button>
                    {((!isSidebarCollapsed && isCotizSubmenuOpen) || isSidebarCollapsed) && (
                      <div className={`${isSidebarCollapsed ? 'absolute left-full top-0 ml-2 bg-white rounded-xl shadow-xl w-48 py-2 z-50 opacity-0 invisible group-hover/submenu:opacity-100 group-hover/submenu:visible transition-all' : 'ml-4 pl-4 border-l-2 ' + theme.primaryBorder + ' space-y-1 mt-1'}`}>
                        {isSidebarCollapsed && <div className="px-4 py-2 text-xs font-bold text-gray-400 mb-1 border-b border-gray-100">Cotizaciones</div>}
                        <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/cotizaciones" end className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                          Ver cotizaciones
                        </NavLink>
                        <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/cotizaciones/nuevo" className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                          Nueva cotización
                        </NavLink>
                      </div>
                    )}
                  </div>
                )}

                {/* Guías de Remisión - Solo para empresas formales */}
                {hasPermission(auth, 'guias-remision') && auth?.empresa?.tipoEmpresa === 'FORMAL' && (
                  <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Guías de Remisión') }} to="/administrador/guia-remision" className={({ isActive }) => isActive || location.pathname.includes('/administrador/guia-remision') ? theme.activeLink : theme.inactiveLink} title="Guías de Remisión">
                    <Icon icon="solar:delivery-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                    {!isSidebarCollapsed && <span>Guías de Remisión</span>}
                  </NavLink>
                )}

                {/* Clientes */}
                {hasPermission(auth, 'clientes') && (
                  <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Clientes') }} to="/administrador/clientes" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Clientes">
                    <Icon icon="solar:users-group-rounded-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                    {!isSidebarCollapsed && <span>Clientes</span>}
                  </NavLink>
                )}

                {/* TÍTULO: COMPRAS */}
                {!isSidebarCollapsed && (
                  <div className="px-2 mt-5 mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em]">Compras</span>
                  </div>
                )}
                {isSidebarCollapsed && <div className="h-4"></div>}

                {/* Compras */}
                {hasPermission(auth, 'compras') && (
                  <div className="relative group/submenu">
                    <button onClick={() => { if (isSidebarCollapsed) { navigate('/administrador/compras'); } else { toggleAccordion('compras'); } setNameNavbar('Compras') }} className={location.pathname.includes('/administrador/compras') && !location.search.includes('por_pagar') ? theme.accordionActive : theme.accordionInactive} title="Compras">
                      <div className="flex items-center justify-center">
                        <Icon icon="solar:cart-large-minimalistic-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                        {!isSidebarCollapsed && <span>Compras</span>}
                      </div>
                      {!isSidebarCollapsed && <Icon icon="solar:alt-arrow-down-linear" className={`transition-transform duration-200 ${isComprasSubmenuOpen ? 'rotate-180' : ''}`} width="18" />}
                    </button>
                    {((!isSidebarCollapsed && isComprasSubmenuOpen) || isSidebarCollapsed) && (
                      <div className={`${isSidebarCollapsed ? 'absolute left-full top-0 ml-2 bg-white rounded-xl shadow-xl w-48 py-2 z-50 opacity-0 invisible group-hover/submenu:opacity-100 group-hover/submenu:visible transition-all' : 'ml-4 pl-4 border-l-2 ' + theme.primaryBorder + ' space-y-1 mt-1'}`}>
                        {isSidebarCollapsed && <div className="px-4 py-2 text-xs font-bold text-gray-400 mb-1 border-b border-gray-100">Compras</div>}
                        <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/compras" end className={({ isActive }) => isActive && location.pathname === '/administrador/compras' ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                          Gestión de Compras
                        </NavLink>
                        <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/compras/proveedores" className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                          Proveedores
                        </NavLink>
                      </div>
                    )}
                  </div>
                )}

                {/* TÍTULO: FINANZAS / TESORERÍA */}
                {!isSidebarCollapsed && (
                  <div className="px-2 mt-5 mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em]">Finanzas / Tesorería</span>
                  </div>
                )}
                {isSidebarCollapsed && <div className="h-4"></div>}

                {/* Dashboard Financiero */}
                {hasPermission(auth, 'dashboard') && (
                  <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Dashboard Financiero') }} to="/administrador/finanzas/dashboard" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Dashboard Financiero">
                    <Icon icon="solar:chart-square-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                    {!isSidebarCollapsed && <span>Dashboard Financiero</span>}
                  </NavLink>
                )}

                {/* Caja */}
                {hasPermission(auth, 'caja') && (
                  <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Caja') }} to="/administrador/caja" className={({ isActive }) => (isActive && location.pathname === '/administrador/caja') ? theme.activeLink : theme.inactiveLink} title="Control de Caja">
                    <Icon icon="solar:cash-out-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                    {!isSidebarCollapsed && <span>Control de Caja</span>}
                  </NavLink>
                )}

                {/* Pagos */}
                {hasPermission(auth, 'pagos') && (
                  <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Pagos') }} to="/administrador/pagos" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Cuentas por Cobrar">
                    <Icon icon="solar:wallet-money-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                    {!isSidebarCollapsed && <span>Cuentas por Cobrar</span>}
                  </NavLink>
                )}

                {/* Cuentas por Pagar */}
                {hasPermission(auth, 'kardex') && (
                  <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Cuentas por Pagar') }} to="/administrador/compras?tab=por_pagar" className={({ isActive }) => location.search.includes('por_pagar') ? theme.activeLink : theme.inactiveLink} title="Cuentas por Pagar">
                    <Icon icon="solar:bill-check-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                    {!isSidebarCollapsed && <span>Cuentas por Pagar</span>}
                  </NavLink>
                )}

                {/* Reportes/Contabilidad */}
                {hasPermission(auth, 'reportes') && (
                  <div className="relative group/submenu">
                    <button onClick={() => { if (isSidebarCollapsed) { navigate(auth?.empresa?.tipoEmpresa === 'INFORMAL' ? '/administrador/contabilidad/reporte-informales' : '/administrador/contabilidad/reporte'); } else { toggleAccordion('cont'); } setNameNavbar('Contabilidad') }} className={location.pathname.includes('/administrador/contabilidad') ? theme.accordionActive : theme.accordionInactive} title="Contabilidad">
                      <div className="flex items-center justify-center">
                        <Icon icon="solar:calculator-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                        {!isSidebarCollapsed && <span>Contabilidad</span>}
                      </div>
                      {!isSidebarCollapsed && <Icon icon="solar:alt-arrow-down-linear" className={`transition-transform duration-200 ${isContSubmenuOpen ? 'rotate-180' : ''}`} width="18" />}
                    </button>
                    {((!isSidebarCollapsed && isContSubmenuOpen) || isSidebarCollapsed) && (
                      <div className={`${isSidebarCollapsed ? 'absolute left-full top-0 ml-2 bg-white rounded-xl shadow-xl w-48 py-2 z-50 opacity-0 invisible group-hover/submenu:opacity-100 group-hover/submenu:visible transition-all' : 'ml-4 pl-4 border-l-2 ' + theme.primaryBorder + ' space-y-1 mt-1'}`}>
                        {isSidebarCollapsed && <div className="px-4 py-2 text-xs font-bold text-gray-400 mb-1 border-b border-gray-100">Contabilidad</div>}
                        {auth?.empresa?.tipoEmpresa === 'FORMAL' && (
                          <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/contabilidad/reporte" className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                            Reporte Formales (SUNAT)
                          </NavLink>
                        )}
                        {auth?.empresa?.tipoEmpresa === 'INFORMAL' && (
                          <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/contabilidad/reporte-informales" className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                            Reporte Informales
                          </NavLink>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Tienda Virtual */}
                {auth?.empresa?.plan?.tieneTienda && (auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'USUARIO_EMPRESA') && (
                  <>
                    {!isSidebarCollapsed && (
                      <div className="px-2 mt-5 mb-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em]">Canales Digitales</span>
                      </div>
                    )}
                    {isSidebarCollapsed && <div className="h-4"></div>}
                    <div className="relative group/submenu">
                      <button onClick={() => { if (isSidebarCollapsed) { navigate('/administrador/tienda/pedidos'); } else { toggleAccordion('tienda'); } setNameNavbar('Tienda Virtual') }} className={location.pathname.includes('/administrador/tienda') ? theme.accordionActive : theme.accordionInactive} title="Tienda Virtual">
                        <div className="flex items-center justify-center">
                          <Icon icon="solar:shop-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                          {!isSidebarCollapsed && <span>Tienda Virtual</span>}
                        </div>
                        {!isSidebarCollapsed && <Icon icon="solar:alt-arrow-down-linear" className={`transition-transform duration-200 ${isTiendaSubmenuOpen ? 'rotate-180' : ''}`} width="18" />}
                      </button>
                      {((!isSidebarCollapsed && isTiendaSubmenuOpen) || isSidebarCollapsed) && (
                        <div className={`${isSidebarCollapsed ? 'absolute left-full top-0 ml-2 bg-white rounded-xl shadow-xl w-48 py-2 z-50 opacity-0 invisible group-hover/submenu:opacity-100 group-hover/submenu:visible transition-all' : 'ml-4 pl-4 border-l-2 ' + theme.primaryBorder + ' space-y-1 mt-1'}`}>
                          {isSidebarCollapsed && <div className="px-4 py-2 text-xs font-bold text-gray-400 mb-1 border-b border-gray-100">Tienda Virtual</div>}
                          <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/tienda/pedidos" className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                            Pedidos
                          </NavLink>
                          <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/tienda/modificadores" className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                            Modificadores
                          </NavLink>
                          <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/tienda/configuracion" className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                            Configuración
                          </NavLink>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* TÍTULO: SISTEMA */}
                {!isSidebarCollapsed && (
                  <div className="px-2 mt-5 mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em]">Sistema</span>
                  </div>
                )}
                {isSidebarCollapsed && <div className="h-4"></div>}

                {/* Usuarios */}
                {hasPermission(auth, 'usuarios') && (
                  <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Usuarios') }} to="/administrador/usuarios" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Usuarios">
                    <Icon icon="solar:users-group-two-rounded-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                    {!isSidebarCollapsed && <span>Usuarios</span>}
                  </NavLink>
                )}

                {/* Sedes */}
                {(auth?.rol === 'ADMIN_EMPRESA' || hasPermission(auth, 'configuracion')) && (
                  <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Sedes') }} to="/administrador/sedes" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Sedes">
                    <Icon icon="solar:city-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                    {!isSidebarCollapsed && <span>Sedes</span>}
                  </NavLink>
                )}

                {/* Notificaciones */}
                {(auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'USUARIO_EMPRESA') && (
                  <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Notificaciones') }} to="/administrador/notificaciones" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink} title="Notificaciones">
                    <Icon icon="solar:bell-bold-duotone" className={`${isSidebarCollapsed ? 'text-2xl m-0' : 'mr-3 text-xl'}`} />
                    {!isSidebarCollapsed && <span>Notificaciones</span>}
                  </NavLink>
                )}
              </>
            )}

          </nav>
        </div>

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
      </aside>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-[#F0F2FA]">
        <header className={`z-10 flex items-center justify-between px-6 py-3.5 bg-white border-b border-gray-100 transition-all duration-300 ${navbarFixed ? 'sticky top-0' : 'relative'}`}>
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Icon icon="solar:hamburger-menu-linear" width="22" className="text-gray-600" />
            </button>
            <div className="flex items-center gap-1.5 text-[13px] font-medium">
              <span className="text-gray-400">Administrador</span>
              <Icon icon="solar:alt-arrow-right-linear" width="13" className="text-gray-300" />
              <span className="text-[#4F6EF7] font-semibold">{nameNavbar}</span>
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
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Icon icon="solar:city-bold-duotone" className="text-[#4F6EF7]" width={14} />
                    <span className="text-[12px] font-semibold text-[#4F6EF7] truncate max-w-[140px]">{sedeActiva.nombre}</span>
                    <Icon icon="solar:alt-arrow-down-linear" className="text-[#4F6EF7]" width={12} />
                  </button>
                  {isSedeMenuOpen && (
                    <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[180px]">
                      <p className="text-[10px] uppercase font-bold text-gray-400 px-3 py-1 tracking-wider">Cambiar sede</p>
                      {todasSedes.filter(s => s.activo).map(sede => (
                        <button
                          key={sede.id}
                          type="button"
                          onClick={() => {
                            selectSede(sede.id)
                            setIsSedeMenuOpen(false)
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${sede.id === sedeActiva.id ? 'bg-indigo-50 text-[#4F6EF7] font-semibold cursor-default' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          <Icon icon={sede.id === sedeActiva.id ? 'solar:check-circle-bold' : 'solar:city-linear'} width={14} />
                          {sede.nombre}
                          {sede.esPrincipal && <span className="ml-auto text-[10px] text-gray-400 font-normal">Principal</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <Icon icon="solar:city-bold-duotone" className="text-[#4F6EF7]" width={14} />
                  <span className="text-[12px] font-semibold text-[#4F6EF7] truncate max-w-[140px]">{sedeActiva.nombre}</span>
                </div>
              )
            })()}
          </div>

          <div className="flex items-center gap-1">
            {/* Compact toggle */}
            <div className="hidden md:block">
              <button
                onClick={toggleCompact}
                className={`p-2 rounded-lg transition-colors ${isCompact ? 'text-[#4F6EF7] bg-indigo-50' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                title={isCompact ? 'Desactivar Vista Compacta' : 'Activar Vista Compacta'}
              >
                <Icon icon={isCompact ? 'solar:minimize-square-3-bold' : 'solar:maximize-square-3-linear'} width="20" />
              </button>
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
                  src={
                    auth?.empresa?.logo
                      ? auth.empresa.logo.startsWith('data:image')
                        ? auth.empresa.logo
                        : `data:image/png;base64,${auth.empresa.logo}`
                      : 'https://icons.veryicon.com/png/o/miscellaneous/two-color-icon-library/user-286.png'
                  }
                  alt=""
                />
                <div className="hidden md:flex flex-col items-start gap-0">
                  <span className="text-[13px] font-semibold text-gray-800 leading-tight">{auth?.nombre?.split(' ')[0]}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider leading-tight">{auth?.empresa?.nombreComercial?.split(' ')[0] ?? auth?.rol?.replace('ADMIN_', '')?.replace('USUARIO_', '')}</span>
                </div>
                <Icon icon="solar:alt-arrow-down-bold" className="hidden md:block text-gray-400" width="14" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/60 z-[999999] overflow-hidden">
                  <div className="px-4 py-3.5 bg-gray-50 border-b border-gray-100">
                    <p className="text-[13px] font-bold text-gray-900 truncate">{auth?.nombre}</p>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{auth?.empresa?.nombreComercial}</p>
                  </div>
                  <ul className="py-1.5" role="menu">
                    <li>
                      <button
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-gray-600 hover:bg-indigo-50 hover:text-[#4F6EF7] transition-colors"
                        onClick={() => { setIsUserMenuOpen(false); navigate('/administrador/perfil') }}
                        role="menuitem"
                      >
                        <Icon icon="solar:user-circle-bold-duotone" width="18" />
                        Perfil
                      </button>
                    </li>
                    {(auth?.empresa?.slugTienda || auth?.empresa?.plan?.tieneTienda) && (
                      <li>
                        <button
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-gray-600 hover:bg-indigo-50 hover:text-[#4F6EF7] transition-colors"
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
                </div>
              )}
            </div>
          </div>
        </header>

        <div className={`${theme.mainPadding} transition-all duration-300`}>
          <Outlet />
        </div>
      </main>
      <Configurator />
    </div>
  )
}
