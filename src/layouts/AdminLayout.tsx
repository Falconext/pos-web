import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore, type IAuthState } from '@/zustand/auth'
import NotificacionesCampana from '@/components/NotificacionesCampana'
import { hasPermission, getRedirectPath } from '@/utils/permissions'

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { auth }: IAuthState = useAuthStore()

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
    setIsCotizSubmenuOpen(false)
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
  const toggleAccordion = (key: 'fact' | 'informal' | 'cont' | 'kardex' | 'caja' | 'tienda' | 'cotiz') => {
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

  console.log(auth)

  // Determine theme based on role
  const isSystemAdmin = auth?.rol === 'ADMIN_SISTEMA'

  const theme = {
    primaryBg: isSystemAdmin ? 'bg-indigo-600' : 'bg-blue-600',
    primaryLightBg: isSystemAdmin ? 'bg-indigo-50' : 'bg-blue-50',
    primaryText: isSystemAdmin ? 'text-indigo-700' : 'text-blue-700',
    primaryBorder: isSystemAdmin ? 'border-indigo-100' : 'border-blue-100',
    activeLink: isSystemAdmin
      ? 'flex items-center bg-indigo-50 text-indigo-700 px-4 py-3 text-sm font-semibold rounded-xl transition-all'
      : 'flex items-center bg-blue-50 text-blue-700 px-4 py-3 text-sm font-semibold rounded-lg transition-all',
    inactiveLink: isSystemAdmin
      ? 'flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all'
      : 'flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all',
    mainPadding: isSystemAdmin ? 'p-2 md:p-4' : 'p-6', // Revert padding for company
    sidebarRadius: isSystemAdmin ? 'rounded-xl' : 'rounded-lg',
    sidebarLogoShadow: isSystemAdmin ? 'shadow-indigo-200' : 'shadow-blue-200',
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">

      {/* Sidebar/Drawer */}
      <aside className={`fixed inset-y-0 left-0 bg-white border-r border-gray-200 p-5 space-y-6 h-screen overflow-y-auto w-[85%] max-w-[280px] transform transition-transform duration-300 ease-in-out md:static md:w-[280px] md:translate-x-0 ${isSidebarOpen ? 'translate-x-0 z-[70]' : '-translate-x-full z-1 md:translate-x-0'}`}>
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className={`w-10 h-10 flex items-center justify-center rounded-full shadow-lg ${theme.sidebarLogoShadow} overflow-hidden`}>
            <img src="/fnlogo.png" alt="Falconext" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight leading-none">FALCONEXT</h2>
            <p className="text-[10px] text-gray-500 font-medium tracking-wide">PANEL ADMINISTRATIVO</p>
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
              {/* Dashboard - disponible para todos los usuarios */}
              {hasPermission(auth, 'dashboard') && (
                <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Administrador') }} to="/administrador" end className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink}>
                  <Icon icon="solar:chart-2-bold-duotone" className="mr-3 text-xl" /> Dashboard
                </NavLink>
              )}
              {/* Kardex / Catálogo (según rubro) */}
              {hasPermission(auth, 'kardex') && (
                <div>
                  <button onClick={() => { toggleAccordion('kardex'); setNameNavbar(menuLabels.kardexTitle) }} className={location.pathname.includes('/administrador/kardex') ? `flex items-center justify-between w-full ${theme.primaryLightBg} ${theme.primaryText} px-4 py-3 text-sm font-semibold ${theme.sidebarRadius} transition-all text-left` : `flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 ${theme.sidebarRadius} transition-all text-left`}>
                    <div className="flex items-center">
                      <Icon icon={isRestaurante ? 'solar:chef-hat-bold-duotone' : 'solar:box-bold-duotone'} className="mr-3 text-xl" />
                      {menuLabels.kardexTitle}
                    </div>
                    <Icon icon="solar:alt-arrow-down-linear" className={`transition-transform duration-200 ${isKardexSubmenuOpen ? 'rotate-180' : ''}`} width="18" />
                  </button>
                  {isKardexSubmenuOpen && (
                    <div className={`ml-4 pl-4 border-l-2 ${theme.primaryBorder} space-y-1 mt-1`}>
                      <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/kardex/dashboard" className={({ isActive }) => isActive ? `flex items-center px-4 py-2 text-sm font-medium ${theme.primaryText} rounded-lg ${theme.primaryLightBg}/50` : 'flex items-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg'}>
                        Dashboard
                      </NavLink>
                      <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/kardex/productos" className={({ isActive }) => isActive ? `flex items-center px-4 py-2 text-sm font-medium ${theme.primaryText} rounded-lg ${theme.primaryLightBg}/50` : 'flex items-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg'}>
                        {menuLabels.productosLabel}
                      </NavLink>
                      {/* Lotes - Solo para farmacias/boticas */}
                      {(() => {
                        const rubroNombre = auth?.empresa?.rubro?.nombre?.toLowerCase() || '';
                        const esFarmacia = rubroNombre.includes('farmacia') || rubroNombre.includes('botica');
                        return esFarmacia ? (
                          <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/kardex/lotes" className={({ isActive }) => isActive ? `flex items-center px-4 py-2 text-sm font-medium ${theme.primaryText} rounded-lg ${theme.primaryLightBg}/50` : 'flex items-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg'}>
                            <Icon icon="solar:pill-bold-duotone" className="mr-2" width={16} />
                            Lotes y Vencimientos
                          </NavLink>
                        ) : null;
                      })()}
                      {auth?.empresa?.plan?.tieneTienda && (
                        <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/kardex/combos" className={({ isActive }) => isActive ? `flex items-center px-4 py-2 text-sm font-medium ${theme.primaryText} rounded-lg ${theme.primaryLightBg}/50` : 'flex items-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg'}>
                          Combos
                        </NavLink>
                      )}
                      <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/kardex" end className={({ isActive }) => isActive ? `flex items-center px-4 py-2 text-sm font-medium ${theme.primaryText} rounded-lg ${theme.primaryLightBg}/50` : 'flex items-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg'}>
                        Movimientos
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

              {/* Comprobantes */}
              {hasPermission(auth, 'comprobantes') && (
                <>
                  {/* Facturación SUNAT - Solo para empresas formales */}
                  {auth?.empresa?.tipoEmpresa === 'FORMAL' && (
                    <div>
                      <button onClick={() => { toggleAccordion('fact'); setNameNavbar('Facturacion') }} className={(location.pathname.includes('/administrador/facturacion/comprobantes') || location.pathname.includes('/administrador/facturacion/nuevo')) && !location.pathname.includes('informales') ? `flex items-center justify-between w-full ${theme.primaryLightBg} ${theme.primaryText} px-4 py-3 text-sm font-semibold ${theme.sidebarRadius} transition-all text-left` : `flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 ${theme.sidebarRadius} transition-all text-left`}>
                        <div className="flex items-center">
                          <Icon icon="solar:bill-list-bold-duotone" className="mr-3 text-xl" /> Fact. SUNAT
                        </div>
                        <Icon icon="solar:alt-arrow-down-linear" className={`transition-transform duration-200 ${isFactSubmenuOpen ? 'rotate-180' : ''}`} width="18" />
                      </button>
                      {isFactSubmenuOpen && (
                        <div className={`ml-4 pl-4 border-l-2 ${theme.primaryBorder} space-y-1 mt-1`}>
                          <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/facturacion/comprobantes" className={({ isActive }) => isActive ? `flex items-center px-4 py-2 text-sm font-medium ${theme.primaryText} rounded-lg ${theme.primaryLightBg}/50` : 'flex items-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg'}>
                            Comprobantes SUNAT
                          </NavLink>
                          <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/facturacion/nuevo" className={({ isActive }) => isActive ? `flex items-center px-4 py-2 text-sm font-medium ${theme.primaryText} rounded-lg ${theme.primaryLightBg}/50` : 'flex items-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg'}>
                            Crear comprobantes
                          </NavLink>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comprobantes informales - Para empresas informales */}
                  {(auth?.empresa?.tipoEmpresa === 'FORMAL' || auth?.empresa?.tipoEmpresa === 'INFORMAL') && (
                    <div>
                      <button onClick={() => { toggleAccordion('informal'); setNameNavbar('Comprobantes Informales') }} className={location.pathname.includes('/administrador/facturacion/comprobantes-informales') ? `flex items-center justify-between w-full ${theme.primaryLightBg} ${theme.primaryText} px-4 py-3 text-sm font-semibold ${theme.sidebarRadius} transition-all text-left` : `flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 ${theme.sidebarRadius} transition-all text-left`}>
                        <div className="flex items-center">
                          <Icon icon="solar:notes-bold-duotone" className="mr-3 text-xl" /> Notas de Pedido
                        </div>
                        <Icon icon="solar:alt-arrow-down-linear" className={`transition-transform duration-200 ${isInformalSubmenuOpen ? 'rotate-180' : ''}`} width="18" />
                      </button>
                      {isInformalSubmenuOpen && (
                        <div className={`ml-4 pl-4 border-l-2 ${theme.primaryBorder} space-y-1 mt-1`}>
                          <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/facturacion/comprobantes-informales" className={({ isActive }) => isActive ? `flex items-center px-4 py-2 text-sm font-medium ${theme.primaryText} rounded-lg ${theme.primaryLightBg}/50` : 'flex items-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg'}>
                            Notas de ventas
                          </NavLink>
                          {
                            auth?.empresa?.tipoEmpresa === 'INFORMAL' && (
                              <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/facturacion/nuevo" className={({ isActive }) => isActive ? `flex items-center px-4 py-2 text-sm font-medium ${theme.primaryText} rounded-lg ${theme.primaryLightBg}/50` : 'flex items-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg'}>
                                Crear comprobantes
                              </NavLink>
                            )
                          }
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pagos - visible si tiene permiso 'pagos' */}
                  {hasPermission(auth, 'pagos') && (
                    <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Pagos') }} to="/administrador/pagos" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink}>
                      <Icon icon="solar:wallet-money-bold-duotone" className="mr-3 text-xl" /> Gestión de Pagos
                    </NavLink>
                  )}

                  {/* Cotizaciones */}
                  {hasPermission(auth, 'cotizaciones') && (
                    <div>
                      <button onClick={() => { toggleAccordion('cotiz'); setNameNavbar('Cotizaciones') }} className={location.pathname.includes('/administrador/cotizaciones') ? `flex items-center justify-between w-full ${theme.primaryLightBg} ${theme.primaryText} px-4 py-3 text-sm font-semibold ${theme.sidebarRadius} transition-all text-left` : `flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 ${theme.sidebarRadius} transition-all text-left`}>
                        <div className="flex items-center">
                          <Icon icon="solar:document-text-bold-duotone" className="mr-3 text-xl" /> Cotizaciones
                        </div>
                        <Icon icon="solar:alt-arrow-down-linear" className={`transition-transform duration-200 ${isCotizSubmenuOpen ? 'rotate-180' : ''}`} width="18" />
                      </button>
                      {isCotizSubmenuOpen && (
                        <div className={`ml-4 pl-4 border-l-2 ${theme.primaryBorder} space-y-1 mt-1`}>
                          <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/cotizaciones" className={({ isActive }) => isActive ? `flex items-center px-4 py-2 text-sm font-medium ${theme.primaryText} rounded-lg ${theme.primaryLightBg}/50` : 'flex items-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg'}>
                            Ver cotizaciones
                          </NavLink>
                          <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/cotizaciones/nuevo" className={({ isActive }) => isActive ? `flex items-center px-4 py-2 text-sm font-medium ${theme.primaryText} rounded-lg ${theme.primaryLightBg}/50` : 'flex items-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg'}>
                            Nueva cotización
                          </NavLink>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              {/* Reportes/Contabilidad */}
              {hasPermission(auth, 'reportes') && (
                <div>
                  <button onClick={() => { toggleAccordion('cont'); setNameNavbar('Contabilidad') }} className={location.pathname.includes('/administrador/contabilidad') ? `flex items-center justify-between w-full ${theme.primaryLightBg} ${theme.primaryText} px-4 py-3 text-sm font-semibold ${theme.sidebarRadius} transition-all text-left` : `flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 ${theme.sidebarRadius} transition-all text-left`}>
                    <div className="flex items-center">
                      <Icon icon="solar:calculator-bold-duotone" className="mr-3 text-xl" /> Contabilidad
                    </div>
                    <Icon icon="solar:alt-arrow-down-linear" className={`transition-transform duration-200 ${isContSubmenuOpen ? 'rotate-180' : ''}`} width="18" />
                  </button>
                  {isContSubmenuOpen && (
                    <div className={`ml-4 pl-4 border-l-2 ${theme.primaryBorder} space-y-1 mt-1`}>
                      {auth?.empresa?.tipoEmpresa === 'FORMAL' && (
                        <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/contabilidad/reporte" className={({ isActive }) => isActive ? `flex items-center px-4 py-2 text-sm font-medium ${theme.primaryText} rounded-lg ${theme.primaryLightBg}/50` : 'flex items-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg'}>
                          Reporte Formales (SUNAT)
                        </NavLink>
                      )}
                      {auth?.empresa?.tipoEmpresa === 'INFORMAL' && (
                        <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/contabilidad/reporte-informales" className={({ isActive }) => isActive ? `flex items-center px-4 py-2 text-sm font-medium ${theme.primaryText} rounded-lg ${theme.primaryLightBg}/50` : 'flex items-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg'}>
                          Reporte Informales
                        </NavLink>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Caja - visible si tiene permiso 'caja' */}
              {hasPermission(auth, 'caja') && (
                <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Caja') }} to="/administrador/caja" className={({ isActive }) => (isActive && location.pathname === '/administrador/caja') ? theme.activeLink : theme.inactiveLink}>
                  <Icon icon="solar:cash-out-bold-duotone" className="mr-3 text-xl" /> Control de Caja
                </NavLink>
              )}

              {/* Tienda Virtual - Solo si el plan lo permite */}
              {auth?.empresa?.plan?.tieneTienda && (auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'USUARIO_EMPRESA') && (
                <div>
                  <button onClick={() => { toggleAccordion('tienda'); setNameNavbar('Tienda Virtual') }} className={location.pathname.includes('/administrador/tienda') ? `flex items-center justify-between w-full ${theme.primaryLightBg} ${theme.primaryText} px-4 py-3 text-sm font-semibold ${theme.sidebarRadius} transition-all text-left` : `flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 ${theme.sidebarRadius} transition-all text-left`}>
                    <div className="flex items-center">
                      <Icon icon="solar:shop-bold-duotone" className="mr-3 text-xl" /> Tienda Virtual
                    </div>
                    <Icon icon="solar:alt-arrow-down-linear" className={`transition-transform duration-200 ${isTiendaSubmenuOpen ? 'rotate-180' : ''}`} width="18" />
                  </button>
                  {isTiendaSubmenuOpen && (
                    <div className={`ml-4 pl-4 border-l-2 ${theme.primaryBorder} space-y-1 mt-1`}>
                      <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/tienda/pedidos" className={({ isActive }) => isActive ? `flex items-center px-4 py-2 text-sm font-medium ${theme.primaryText} rounded-lg ${theme.primaryLightBg}/50` : 'flex items-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg'}>
                        Pedidos
                      </NavLink>
                      {isRestaurante && (
                        <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/tienda/modificadores" className={({ isActive }) => isActive ? `flex items-center px-4 py-2 text-sm font-medium ${theme.primaryText} rounded-lg ${theme.primaryLightBg}/50` : 'flex items-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg'}>
                          Modificadores
                        </NavLink>
                      )}
                      <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/tienda/configuracion" className={({ isActive }) => isActive ? `flex items-center px-4 py-2 text-sm font-medium ${theme.primaryText} rounded-lg ${theme.primaryLightBg}/50` : 'flex items-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg'}>
                        Configuración
                      </NavLink>
                    </div>
                  )}
                </div>
              )}

              {/* Usuarios - Solo para Administradores */}
              {hasPermission(auth, 'usuarios') && (
                <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Usuarios') }} to="/administrador/usuarios" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink}>
                  <Icon icon="solar:users-group-two-rounded-bold-duotone" className="mr-3 text-xl" /> Usuarios
                </NavLink>
              )}

              {/* Notificaciones - Para usuarios de empresa */}
              {(auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'USUARIO_EMPRESA') && (
                <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Notificaciones') }} to="/administrador/notificaciones" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink}>
                  <Icon icon="solar:bell-bold-duotone" className="mr-3 text-xl" /> Notificaciones
                </NavLink>
              )}

              {/* Perfil - disponible para todos */}
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
      <main className="flex-1 overflow-y-auto bg-gray-50/50">
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors focus:ring-2 focus:ring-indigo-100"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Icon icon="solar:hamburger-menu-linear" width="24" className="text-gray-700" />
            </button>
            <h2 className="text-lg font-bold text-gray-800 tracking-tight">{nameNavbar}</h2>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            {(auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'USUARIO_EMPRESA') && (
              <div className="hidden md:block">
                <NotificacionesCampana />
              </div>
            )}

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                className="flex items-center gap-3 rounded-full outline-none focus:outline-none hover:bg-gray-50 p-1 md:pr-3 transition-colors border border-transparent hover:border-gray-200"
                onClick={() => setIsUserMenuOpen((p) => !p)}
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
              >
                <img
                  width={38}
                  height={38}
                  className="rounded-full shadow-sm object-cover"
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
                <div className="absolute right-0 mt-3 w-60 rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/50 z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900 truncate">{auth?.nombre}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{auth?.empresa?.nombreComercial}</p>
                  </div>
                  <ul className="py-2" role="menu">
                    <li>
                      <button
                        className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-600 hover:${theme.primaryLightBg} hover:${theme.primaryText} transition-colors`}
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
                          className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-600 hover:${theme.primaryLightBg} hover:${theme.primaryText} transition-colors`}
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
    </div>
  )
}
