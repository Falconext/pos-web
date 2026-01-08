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
  const { auth }: IAuthState = useAuthStore()
  const { sidebarColor, sidebarType, navbarFixed, toggleConfigurator } = useThemeStore()

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
  const [isComprasSubmenuOpen, setIsComprasSubmenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
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
  }

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!userMenuRef.current) return
      if (!userMenuRef.current.contains(e.target as Node)) setIsUserMenuOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEsc)
    }
  }, [])

  // Alternar acordeón exclusivo
  const toggleAccordion = (key: 'fact' | 'informal' | 'cont' | 'kardex' | 'caja' | 'tienda' | 'cotiz' | 'compras') => {
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

  /* THEME CONFIGURATION - VELOURÉ STYLE (DYNAMIC) */
  const theme = {
    // Layout
    mainPadding: 'p-4 pt-4',
    sidebarRadius: 'rounded-none md:rounded-r-none',
    sidebarLogoShadow: 'shadow-none',

    // Sidebar Dynamic Styles
    sidebarBg: sidebarType === 'dark'
      ? 'bg-[#1C1C24]'
      : sidebarType === 'white'
        ? 'bg-white shadow-xl shadow-gray-200/50 border-r border-gray-100'
        : 'bg-transparent',

    sidebarText: sidebarType === 'white' ? 'text-gray-600' : 'text-gray-400',
    sidebarBorder: sidebarType === 'white' ? 'border-r border-gray-100' : 'border-none',

    // Color Mappings
    activeColors: {
      primary: 'bg-fuchsia-600 shadow-fuchsia-500/20',
      dark: 'bg-gray-900 shadow-gray-500/20',
      info: 'bg-blue-500 shadow-blue-500/20',
      success: 'bg-emerald-500 shadow-emerald-500/20',
      warning: 'bg-orange-500 shadow-orange-500/20',
      error: 'bg-red-500 shadow-red-500/20',
    },

    // Dynamic Classes Helpers
    get activeLink() {
      const colorClass = this.activeColors[sidebarColor] || this.activeColors.info;
      const textColor = 'text-white';
      return `flex items-center w-full px-4 py-3.5 text-sm font-semibold ${textColor} ${colorClass} rounded-2xl shadow-lg transition-all duration-200 group`;
    },

    get inactiveLink() {
      const textColor = sidebarType === 'white' ? 'text-gray-500 hover:text-gray-900' : 'text-gray-400 hover:text-white';
      const bgHover = sidebarType === 'white' ? 'hover:bg-gray-100' : 'hover:bg-white/5';
      return `flex items-center w-full px-4 py-3.5 text-sm font-medium ${textColor} ${bgHover} rounded-2xl transition-all duration-200 group`;
    },

    // Accordions
    get accordionActive() {
      const colorClass = this.activeColors[sidebarColor] || this.activeColors.info;
      const textColor = 'text-white';
      return `flex items-center justify-between w-full px-4 py-3.5 text-sm font-semibold ${textColor} ${colorClass} rounded-2xl transition-all text-left shadow-lg`;
    },

    get accordionInactive() {
      const textColor = sidebarType === 'white' ? 'text-gray-500 hover:text-gray-900' : 'text-gray-400 hover:text-white';
      const bgHover = sidebarType === 'white' ? 'hover:bg-gray-50' : 'hover:bg-white/5';
      return `flex items-center justify-between w-full px-4 py-3.5 text-sm font-medium ${textColor} ${bgHover} rounded-2xl transition-all text-left`;
    },

    // Submenu
    submenuBorder: sidebarType === 'white' ? 'border-gray-200' : 'border-gray-700',

    get submenuActiveLink() {
      const textColor = sidebarType === 'white' ? 'text-gray-900' : 'text-white';
      const bgHover = sidebarType === 'white' ? 'hover:bg-gray-100' : 'hover:bg-white/5';
      return `flex items-center px-4 py-2.5 text-sm font-bold ${textColor} ${bgHover} rounded-xl transition-all`;
    },

    get submenuInactiveLink() {
      const textColor = sidebarType === 'white' ? 'text-gray-500 hover:text-gray-900' : 'text-gray-500 hover:text-white';
      const bgHover = sidebarType === 'white' ? 'hover:bg-gray-50' : 'hover:bg-white/5';
      return `flex items-center px-4 py-2.5 text-sm font-medium ${textColor} ${bgHover} rounded-xl transition-all`;
    },

    // Legacy support
    primaryBg: 'bg-indigo-600',
    primaryLightBg: 'bg-white/5',
    primaryText: 'text-white',
    primaryBorder: 'border-gray-700',
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F5FA] font-sans">

      {/* Sidebar/Drawer */}
      <aside className={`fixed inset-y-0 left-0 ${theme.sidebarBg} ${theme.sidebarBorder} p-4 space-y-6 h-screen overflow-y-auto w-[85%] max-w-[280px] transform transition-transform duration-300 ease-in-out md:static md:w-[280px] md:translate-x-0 ${isSidebarOpen ? 'translate-x-0 z-[70]' : '-translate-x-full z-1 md:translate-x-0'}`}>
        <div className="flex items-center gap-3 px-2 mb-8 mt-2">
          <div className="flex items-center justify-center">
            <img src="/fnlogo.png" alt="Falconext" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight leading-none ${sidebarType === 'white' ? 'text-gray-800' : 'text-white'}`}>FALCONEXT</h2>
            <p className="text-[10px] text-gray-400 font-medium tracking-wide mt-1">PANEL ADMINISTRATIVO</p>
          </div>
        </div>

        <nav className="space-y-1.5">
          {auth?.rol === 'ADMIN_SISTEMA' && (
            <>
              <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/empresas" className={({ isActive }) => isActive || location.pathname.startsWith('/administrador/empresas') ? theme.activeLink : theme.inactiveLink}>
                <Icon icon="solar:buildings-2-bold-duotone" className="mr-3 text-xl" /> Empresas
              </NavLink>
              <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/diseno-rubros" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink}>
                <Icon icon="solar:palette-bold-duotone" className="mr-3 text-xl" /> Diseño por Rubro
              </NavLink>
              <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/catalogo-global" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink}>
                <Icon icon="solar:database-bold-duotone" className="mr-3 text-xl" /> Catálogo Global
              </NavLink>
              <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/planes" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink}>
                <Icon icon="solar:card-bold-duotone" className="mr-3 text-xl" /> Planes
              </NavLink>
            </>
          )}

          {(auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'USUARIO_EMPRESA') && (
            <>
              {/* Dashboard */}
              {hasPermission(auth, 'dashboard') && (
                <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Administrador') }} to="/administrador" end className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink}>
                  <Icon icon="solar:chart-2-bold-duotone" className="mr-3 text-xl" /> Dashboard
                </NavLink>
              )}

              {/* TÍTULO: INVENTARIO / CATÁLOGO */}
              <div className="px-4 mt-6 mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Inventario</span>
              </div>

              {/* Kardex / Catálogo */}
              {hasPermission(auth, 'kardex') && (
                <div>
                  <button onClick={() => { toggleAccordion('kardex'); setNameNavbar(menuLabels.kardexTitle) }} className={location.pathname.includes('/administrador/kardex') ? theme.accordionActive : theme.accordionInactive}>
                    <div className="flex items-center">
                      <Icon icon={isRestaurante ? 'solar:chef-hat-bold-duotone' : 'solar:box-bold-duotone'} className="mr-3 text-xl" />
                      {menuLabels.kardexTitle}
                    </div>
                    <Icon icon="solar:alt-arrow-down-linear" className={`transition-transform duration-200 ${isKardexSubmenuOpen ? 'rotate-180' : ''}`} width="18" />
                  </button>
                  {isKardexSubmenuOpen && (
                    <div className={`ml-4 pl-4 border-l-2 ${theme.primaryBorder} space-y-1 mt-1`}>
                      <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/kardex/dashboard" className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                        Dashboard
                      </NavLink>
                      <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/kardex/productos" className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                        {menuLabels.productosLabel}
                      </NavLink>
                      {/* Lotes */}
                      {(() => {
                        const rubroNombre = auth?.empresa?.rubro?.nombre?.toLowerCase() || '';
                        const esFarmacia = rubroNombre.includes('farmacia') || rubroNombre.includes('botica');
                        return esFarmacia ? (
                          <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/kardex/lotes" className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                            Lotes y Vencimientos
                          </NavLink>
                        ) : null;
                      })()}
                      {/* Combos */}
                      {(() => {
                        const rubroNombre = auth?.empresa?.rubro?.nombre?.toLowerCase() || '';
                        const esFarmacia = rubroNombre.includes('farmacia') || rubroNombre.includes('botica');
                        return auth?.empresa?.plan?.tieneTienda && !esFarmacia ? (
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
              <div className="px-4 mt-6 mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ventas</span>
              </div>

              {/* Facturación SUNAT - Solo para empresas formales */}
              {hasPermission(auth, 'comprobantes') && auth?.empresa?.tipoEmpresa === 'FORMAL' && (
                <div>
                  <button onClick={() => { toggleAccordion('fact'); setNameNavbar('Facturacion') }} className={(location.pathname.includes('/administrador/facturacion/comprobantes') || location.pathname.includes('/administrador/facturacion/nuevo')) && !location.pathname.includes('informales') ? theme.accordionActive : theme.accordionInactive}>
                    <div className="flex items-center">
                      <Icon icon="solar:bill-list-bold-duotone" className="mr-3 text-xl" /> Fact. SUNAT
                    </div>
                    <Icon icon="solar:alt-arrow-down-linear" className={`transition-transform duration-200 ${isFactSubmenuOpen ? 'rotate-180' : ''}`} width="18" />
                  </button>
                  {isFactSubmenuOpen && (
                    <div className={`ml-4 pl-4 border-l-2 ${theme.primaryBorder} space-y-1 mt-1`}>
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
                <div>
                  <button onClick={() => { toggleAccordion('informal'); setNameNavbar('Comprobantes Informales') }} className={location.pathname.includes('/administrador/facturacion/comprobantes-informales') ? theme.accordionActive : theme.accordionInactive}>
                    <div className="flex items-center">
                      <Icon icon="solar:notes-bold-duotone" className="mr-3 text-xl" /> Notas de Pedido
                    </div>
                    <Icon icon="solar:alt-arrow-down-linear" className={`transition-transform duration-200 ${isInformalSubmenuOpen ? 'rotate-180' : ''}`} width="18" />
                  </button>
                  {isInformalSubmenuOpen && (
                    <div className={`ml-4 pl-4 border-l-2 ${theme.primaryBorder} space-y-1 mt-1`}>
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
                <div>
                  <button onClick={() => { toggleAccordion('cotiz'); setNameNavbar('Cotizaciones') }} className={location.pathname.includes('/administrador/cotizaciones') ? theme.accordionActive : theme.accordionInactive}>
                    <div className="flex items-center">
                      <Icon icon="solar:document-text-bold-duotone" className="mr-3 text-xl" /> Cotizaciones
                    </div>
                    <Icon icon="solar:alt-arrow-down-linear" className={`transition-transform duration-200 ${isCotizSubmenuOpen ? 'rotate-180' : ''}`} width="18" />
                  </button>
                  {isCotizSubmenuOpen && (
                    <div className={`ml-4 pl-4 border-l-2 ${theme.primaryBorder} space-y-1 mt-1`}>
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

              {/* Clientes */}
              {hasPermission(auth, 'clientes') && (
                <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Clientes') }} to="/administrador/clientes" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink}>
                  <Icon icon="solar:users-group-rounded-bold-duotone" className="mr-3 text-xl" /> Clientes
                </NavLink>
              )}

              {/* TÍTULO: COMPRAS */}
              <div className="px-4 mt-6 mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Compras</span>
              </div>

              {/* Compras */}
              {hasPermission(auth, 'kardex') && (
                <div>
                  <button onClick={() => { toggleAccordion('compras'); setNameNavbar('Compras') }} className={location.pathname.includes('/administrador/compras') ? theme.accordionActive : theme.accordionInactive}>
                    <div className="flex items-center">
                      <Icon icon="solar:cart-large-minimalistic-bold-duotone" className="mr-3 text-xl" />
                      Compras
                    </div>
                    <Icon icon="solar:alt-arrow-down-linear" className={`transition-transform duration-200 ${isComprasSubmenuOpen ? 'rotate-180' : ''}`} width="18" />
                  </button>
                  {isComprasSubmenuOpen && (
                    <div className={`ml-4 pl-4 border-l-2 ${theme.primaryBorder} space-y-1 mt-1`}>
                      <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/compras" end className={({ isActive }) => isActive && location.pathname === '/administrador/compras' ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                        Gestión de Compras
                      </NavLink>
                      <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/compras/nuevo" className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                        Nueva Compra
                      </NavLink>
                      <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/compras/proveedores" className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                        Proveedores
                      </NavLink>
                    </div>
                  )}
                </div>
              )}

              {/* TÍTULO: FINANZAS / TESORERÍA */}
              <div className="px-4 mt-6 mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Finanzas / Tesorería</span>
              </div>

              {/* Dashboard Financiero */}
              {hasPermission(auth, 'dashboard') && (
                <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Dashboard Financiero') }} to="/administrador/finanzas/dashboard" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink}>
                  <Icon icon="solar:chart-square-bold-duotone" className="mr-3 text-xl" /> Dashboard
                </NavLink>
              )}

              {/* Caja */}
              {hasPermission(auth, 'caja') && (
                <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Caja') }} to="/administrador/caja" className={({ isActive }) => (isActive && location.pathname === '/administrador/caja') ? theme.activeLink : theme.inactiveLink}>
                  <Icon icon="solar:cash-out-bold-duotone" className="mr-3 text-xl" /> Control de Caja
                </NavLink>
              )}

              {/* Pagos */}
              {hasPermission(auth, 'pagos') && (
                <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Pagos') }} to="/administrador/pagos" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink}>
                  <Icon icon="solar:wallet-money-bold-duotone" className="mr-3 text-xl" /> Cuentas por Cobrar
                </NavLink>
              )}

              {/* Cuentas por Pagar */}
              {hasPermission(auth, 'kardex') && (
                <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Cuentas por Pagar') }} to="/administrador/compras?tab=por_pagar" className={({ isActive }) => location.search.includes('por_pagar') ? theme.activeLink : theme.inactiveLink}>
                  <Icon icon="solar:bill-check-bold-duotone" className="mr-3 text-xl" /> Cuentas por Pagar
                </NavLink>
              )}

              {/* Reportes/Contabilidad */}
              {hasPermission(auth, 'reportes') && (
                <div>
                  <button onClick={() => { toggleAccordion('cont'); setNameNavbar('Contabilidad') }} className={location.pathname.includes('/administrador/contabilidad') ? theme.accordionActive : theme.accordionInactive}>
                    <div className="flex items-center">
                      <Icon icon="solar:calculator-bold-duotone" className="mr-3 text-xl" /> Contabilidad
                    </div>
                    <Icon icon="solar:alt-arrow-down-linear" className={`transition-transform duration-200 ${isContSubmenuOpen ? 'rotate-180' : ''}`} width="18" />
                  </button>
                  {isContSubmenuOpen && (
                    <div className={`ml-4 pl-4 border-l-2 ${theme.primaryBorder} space-y-1 mt-1`}>
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
                  <div className="px-4 mt-6 mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Canales Digitales</span>
                  </div>
                  <div>
                    <button onClick={() => { toggleAccordion('tienda'); setNameNavbar('Tienda Virtual') }} className={location.pathname.includes('/administrador/tienda') ? theme.accordionActive : theme.accordionInactive}>
                      <div className="flex items-center">
                        <Icon icon="solar:shop-bold-duotone" className="mr-3 text-xl" /> Tienda Virtual
                      </div>
                      <Icon icon="solar:alt-arrow-down-linear" className={`transition-transform duration-200 ${isTiendaSubmenuOpen ? 'rotate-180' : ''}`} width="18" />
                    </button>
                    {isTiendaSubmenuOpen && (
                      <div className={`ml-4 pl-4 border-l-2 ${theme.primaryBorder} space-y-1 mt-1`}>
                        <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/tienda/pedidos" className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                          Pedidos
                        </NavLink>
                        {isRestaurante && (
                          <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/tienda/modificadores" className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                            Modificadores
                          </NavLink>
                        )}
                        <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/tienda/configuracion" className={({ isActive }) => isActive ? theme.submenuActiveLink : theme.submenuInactiveLink}>
                          Configuración
                        </NavLink>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* TÍTULO: SISTEMA */}
              <div className="px-4 mt-6 mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sistema</span>
              </div>

              {/* Usuarios */}
              {hasPermission(auth, 'usuarios') && (
                <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Usuarios') }} to="/administrador/usuarios" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink}>
                  <Icon icon="solar:users-group-two-rounded-bold-duotone" className="mr-3 text-xl" /> Usuarios
                </NavLink>
              )}

              {/* Notificaciones */}
              {(auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'USUARIO_EMPRESA') && (
                <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Notificaciones') }} to="/administrador/notificaciones" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink}>
                  <Icon icon="solar:bell-bold-duotone" className="mr-3 text-xl" /> Notificaciones
                </NavLink>
              )}

              {/* Perfil */}
              <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Perfil') }} to="/administrador/perfil" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink}>
                <Icon icon="solar:user-circle-bold-duotone" className="mr-3 text-xl" /> Perfil
              </NavLink>
            </>
          )}
        </nav>
      </aside>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <header className={`sticky top-0 z-30 flex items-center justify-between px-6 py-4 backdrop-blur-md transition-all duration-300 ${navbarFixed ? 'sticky top-0' : 'relative'} ${sidebarType === 'white' ? 'bg-white/80' : 'bg-[#F4F5FA]/80'}`}>
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors focus:ring-2 focus:ring-indigo-100"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Icon icon="solar:hamburger-menu-linear" width="24" className="text-gray-700" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                <span>Administrador</span>
                <Icon icon="solar:alt-arrow-right-linear" width="14" />
                <span className="text-indigo-600">{nameNavbar}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="hidden md:block">
              <button
                onClick={toggleConfigurator}
                className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-full transition-colors"
                title="Configuración de UI"
              >
                <Icon icon="solar:settings-linear" width="24" />
              </button>
            </div>

            {(auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'USUARIO_EMPRESA') && (
              <div className="hidden md:block">
                <NotificacionesCampana />
              </div>
            )}

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                className="flex items-center gap-3 rounded-full outline-none focus:outline-none hover:bg-white p-1 md:pr-3 transition-all border border-transparent hover:border-gray-200 hover:shadow-sm"
                onClick={() => setIsUserMenuOpen((p) => !p)}
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
              >
                <img
                  width={45}
                  height={45}
                  className="rounded-full object-cover"
                  src={
                    auth?.empresa?.logo
                      ? auth.empresa.logo.startsWith('data:image')
                        ? auth.empresa.logo
                        : `data:image/png;base64,${auth.empresa.logo}`
                      : 'https://icons.veryicon.com/png/o/miscellaneous/two-color-icon-library/user-286.png'
                  }
                  alt=""
                />
                <div className="hidden md:flex flex-col items-start gap-0.5">
                  <span className="text-sm font-semibold text-gray-700 leading-none">{auth?.nombre?.split(' ')[0]}</span>
                  <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider leading-none">{auth?.rol?.replace('ADMIN_', '')?.replace('USUARIO_', '')}</span>
                </div>
                <Icon icon="solar:alt-arrow-down-bold" className="hidden md:block text-gray-400" width="16" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-60 rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-200/50 z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900 truncate">{auth?.nombre}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{auth?.empresa?.nombreComercial}</p>
                  </div>
                  <ul className="py-2" role="menu">
                    <li>
                      <button
                        className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors`}
                        onClick={() => { setIsUserMenuOpen(false); navigate('/administrador/perfil') }}
                        role="menuitem"
                      >
                        <Icon icon="solar:user-circle-broken" width="20" />
                        Perfil
                      </button>
                    </li>
                    {(auth?.empresa?.slugTienda || auth?.empresa?.plan?.tieneTienda) && (
                      <li>
                        <button
                          className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors`}
                          onClick={() => { setIsUserMenuOpen(false); if (auth?.empresa?.slugTienda) navigate(`/tienda/${auth.empresa.slugTienda}`); else navigate('/administrador/tienda/configuracion'); }}
                          role="menuitem"
                        >
                          <Icon icon="solar:shop-linear" width="20" />
                          Ir a tienda virtual
                        </button>
                      </li>
                    )}
                    <li>
                      <button
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        onClick={() => { setIsUserMenuOpen(false); logout() }}
                        role="menuitem"
                      >
                        <Icon icon="solar:logout-broken" width="20" />
                        Cerrar sesión
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className={`${theme.mainPadding} mx-auto`}>
          <Outlet />
        </div>
      </main>
      <Configurator />
    </div>
  )
}
