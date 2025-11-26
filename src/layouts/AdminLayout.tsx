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

  const [nameNavbar, setNameNavbar] = useState<string>('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isFactSubmenuOpen, setIsFactSubmenuOpen] = useState(false)
  const [isInformalSubmenuOpen, setIsInformalSubmenuOpen] = useState(false)
  const [isContSubmenuOpen, setIsContSubmenuOpen] = useState(false)
  const [isKardexSubmenuOpen, setIsKardexSubmenuOpen] = useState(false)
  const [isCajaSubmenuOpen, setIsCajaSubmenuOpen] = useState(false)
  const [isTiendaSubmenuOpen, setIsTiendaSubmenuOpen] = useState(false)
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
  const toggleAccordion = (key: 'fact' | 'informal' | 'cont' | 'kardex' | 'caja' | 'tienda') => {
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

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Sidebar/Drawer */}
      <aside className={`fixed inset-y-0 left-0 bg-white p-5 space-y-4 h-screen overflow-y-auto w-[85%] max-w-[320px] transform transition-transform duration-300 ease-in-out md:static md:w-[260px] md:translate-x-0 ${isSidebarOpen ? 'translate-x-0 z-[70]' : '-translate-x-full z-1 md:translate-x-0'}`}>
        <h2 className="text-xl mb-10 font-bold flex items-center text-[#4d4d4d] ml-3">
          <img width={35} src="/fnlogo.png" className="ml-0 mr-1 rounded-xl" alt="logo" />
          FALCONEXT
        </h2>

        <nav className="space-y-2">
          {auth?.rol === 'ADMIN_SISTEMA' && (
            <>
              <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/empresas" className={({ isActive }) => isActive || location.pathname.startsWith('/administrador/empresas') ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                <Icon icon="mdi:company" className="mr-2" width="24" height="24" /> Empresas
              </NavLink>
              <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/sistema/diseno-rubros" className={({ isActive }) => isActive ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                <Icon icon="mdi:palette-outline" className="mr-2" width="24" height="24" /> Diseño por Rubro
              </NavLink>
            </>
          )}

          {(auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'USUARIO_EMPRESA') && (
            <>
              {/* Dashboard - disponible para todos los usuarios */}
              {hasPermission(auth, 'dashboard') && (
                <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Administrador') }} to="/administrador" end className={({ isActive }) => isActive ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                  <Icon icon="basil:chart-pie-alt-outline" className="mr-2" width="24" height="24" /> Dashboard
                </NavLink>
              )}
              {/* Kardex */}
              {hasPermission(auth, 'kardex') && (
                <div>
                  <button onClick={() => { toggleAccordion('kardex'); setNameNavbar('Kardex') }} className={location.pathname.includes('/administrador/kardex') ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl w-full text-left' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d] w-full text-left'}>
                    <Icon icon="basil:book-open-outline" className="mr-2" width="24" height="24" /> Kardex
                    <Icon icon={isKardexSubmenuOpen ? 'basil:caret-up-outline' : 'mdi:chevron-down'} className="ml-auto" width="20" />
                  </button>
                  {isKardexSubmenuOpen && (
                    <div className="ml-8 space-y-2 mt-2">
                      <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/kardex/dashboard" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                        Dashboard
                      </NavLink>
                      <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/kardex/productos" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                        Productos
                      </NavLink>
                      <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/kardex" end className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                        Movimientos
                      </NavLink>
                    </div>
                  )}
                </div>
              )}

              {/* Clientes */}
              {hasPermission(auth, 'clientes') && (
                <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Clientes') }} to="/administrador/clientes" className={({ isActive }) => isActive ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                  <Icon icon="basil:user-plus-outline" className="mr-2" width="24" height="24" /> Clientes
                </NavLink>
              )}

              {/* Comprobantes */}
              {hasPermission(auth, 'comprobantes') && (
                <>
                  {/* Facturación SUNAT - Solo para empresas formales */}
                  {auth?.empresa?.tipoEmpresa === 'FORMAL' && (
                    <div>
                      <button onClick={() => { toggleAccordion('fact'); setNameNavbar('Facturacion') }} className={(location.pathname.includes('/administrador/facturacion/comprobantes') || location.pathname.includes('/administrador/facturacion/nuevo')) && !location.pathname.includes('informales') ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl w-full text-left' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d] w-full text-left'}>
                        <Icon icon="basil:file-outline" className="mr-2" width="24" height="24" /> Fact. SUNAT
                        <Icon icon={isFactSubmenuOpen ? 'basil:caret-up-outline' : 'basil:caret-down-solid'} className="ml-auto" width="20" />
                      </button>
                      {isFactSubmenuOpen && (
                        <div className="ml-8 space-y-2 mt-2">
                          <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/facturacion/comprobantes" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                            Comprobantes SUNAT
                          </NavLink>
                          <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/facturacion/nuevo" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                            Crear comprobantes
                          </NavLink>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comprobantes informales - Para empresas informales */}
                  {(auth?.empresa?.tipoEmpresa === 'FORMAL' || auth?.empresa?.tipoEmpresa === 'INFORMAL') && (
                    <div>
                      <button onClick={() => { toggleAccordion('informal'); setNameNavbar('Comprobantes Informales') }} className={location.pathname.includes('/administrador/facturacion/comprobantes-informales') ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl w-full text-left' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d] w-full text-left'}>
                        <Icon icon="raphael:paper" className="mr-2" width="24" height="24" /> Notas de Pedido
                        <Icon icon={isInformalSubmenuOpen ? 'basil:caret-up-outline' : 'basil:caret-down-solid'} className="ml-auto" width="20" />
                      </button>
                      {isInformalSubmenuOpen && (
                        <div className="ml-8 space-y-2 mt-2">
                          <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/facturacion/comprobantes-informales" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                            Notas de ventas
                          </NavLink>
                          {
                            auth?.empresa?.tipoEmpresa === 'INFORMAL' && (
                              <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/facturacion/nuevo" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
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
                    <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Pagos') }} to="/administrador/pagos" className={({ isActive }) => isActive ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                      <Icon icon="hugeicons:money-bag-01" className="mr-2" width="24" height="24" /> Gestión de Pagos
                    </NavLink>
                  )}
                </>
              )}
              {/* Reportes/Contabilidad */}
              {hasPermission(auth, 'reportes') && (
                <div>
                  <button onClick={() => { toggleAccordion('cont'); setNameNavbar('Contabilidad') }} className={location.pathname.includes('/administrador/contabilidad') ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl w-full text-left' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d] w-full text-left'}>
                    <Icon icon="solar:calculator-linear" className="mr-2" width="24" height="24" /> Contabilidad
                    <Icon icon={isContSubmenuOpen ? 'basil:caret-up-outline' : 'basil:caret-down-solid'} className="ml-auto" width="20" />
                  </button>
                  {isContSubmenuOpen && (
                    <div className="ml-8 space-y-2 mt-2">
                      {auth?.empresa?.tipoEmpresa === 'FORMAL' && (
                        <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/contabilidad/reporte" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                          Reporte Formales (SUNAT)
                        </NavLink>
                      )}
                      {auth?.empresa?.tipoEmpresa === 'INFORMAL' && (
                        <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/contabilidad/reporte-informales" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                          Reporte Informales
                        </NavLink>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Caja - visible si tiene permiso 'caja' */}
              {hasPermission(auth, 'caja') && (
                <div>
                  <button onClick={() => { toggleAccordion('caja'); setNameNavbar('Caja') }} className={location.pathname.includes('/administrador/caja') ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl w-full text-left' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d] w-full text-left'}>
                    <Icon icon="hugeicons:atm-01" className="mr-2" width="24" height="24" /> Caja
                    <Icon icon={isCajaSubmenuOpen ? 'basil:caret-up-outline' : 'basil:caret-down-solid'} className="ml-auto" width="20" />
                  </button>
                  {isCajaSubmenuOpen && (
                    <div className="ml-8 space-y-2 mt-2">
                      <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/caja" end className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                        Dashboard
                      </NavLink>
                      <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/caja/historial" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                        Historial
                      </NavLink>
                      <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/caja/arqueo" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                        Arqueo
                      </NavLink>
                      <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/caja/reporte-turno" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                        Reporte de Turno
                      </NavLink>
                      <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/caja/reporte-usuarios" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                        Reporte de Usuarios
                      </NavLink>
                    </div>
                  )}
                </div>
              )}

              {/* Tienda Virtual - Solo si el plan lo permite */}
              {auth?.empresa?.plan?.tieneTienda && (auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'USUARIO_EMPRESA') && (
                <div>
                  <button onClick={() => { toggleAccordion('tienda'); setNameNavbar('Tienda Virtual') }} className={location.pathname.includes('/administrador/tienda') ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl w-full text-left' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d] w-full text-left'}>
                    <Icon icon="mdi:storefront-outline" className="mr-2" width="24" height="24" /> Tienda Virtual
                    <Icon icon={isTiendaSubmenuOpen ? 'basil:caret-up-outline' : 'basil:caret-down-solid'} className="ml-auto" width="20" />
                  </button>
                  {isTiendaSubmenuOpen && (
                    <div className="ml-8 space-y-2 mt-2">
                      <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/tienda/pedidos" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                        Pedidos
                      </NavLink>
                      <NavLink onClick={() => setIsSidebarOpen(false)} to="/administrador/tienda/configuracion" className={({ isActive }) => isActive ? 'flex bg-[#f0f0f5] px-4 py-2 text-[14px] text-[#474747] rounded-xl' : 'text-[14px] flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                        Configuración
                      </NavLink>
                    </div>
                  )}
                </div>
              )}

              {/* Usuarios - Solo para Administradores */}
              {hasPermission(auth, 'usuarios') && (
                <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Usuarios') }} to="/administrador/usuarios" className={({ isActive }) => isActive ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                  <Icon icon="solar:user-broken" className="mr-2" width="24" height="24" /> Usuarios
                </NavLink>
              )}

              {/* Notificaciones - Para usuarios de empresa */}
              {(auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'USUARIO_EMPRESA') && (
                <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Notificaciones') }} to="/administrador/notificaciones" className={({ isActive }) => isActive ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                  <Icon icon="basil:notification-outline" className="mr-2" width="24" height="24" /> Notificaciones
                </NavLink>
              )}

              {/* Perfil - disponible para todos */}
              <NavLink onClick={() => { setIsSidebarOpen(false); setNameNavbar('Perfil') }} to="/administrador/perfil" className={({ isActive }) => isActive ? 'flex bg-[#6A6CFF] px-4 py-2 text-[16px] text-white rounded-xl' : 'flex px-4 py-2 rounded-xl text-[#4d4d4d]'}>
                <Icon icon="solar:user-circle-broken" className="mr-2" width="24" height="24" /> Perfil
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
      <main className="flex-1 overflow-y-auto bg-[#F3F4F6]">
        <div className="bg-white p-3 px-3 md:px-5 mt-5 md:ml-8 mb-0 ml-3 mr-3 md:mb-0 md:mr-8 flex justify-between items-center rounded-xl">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Icon icon="mdi:menu" width="24" className="text-gray-700" />
            </button>
            <h2 className="font-bold">{nameNavbar}</h2>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {(auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'USUARIO_EMPRESA') && (
              <div className="hidden md:block">
                <NotificacionesCampana />
              </div>
            )}

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full outline-none focus:outline-none"
                onClick={() => setIsUserMenuOpen((p) => !p)}
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
              >
                <img
                  width={40}
                  height={40}
                  className="border border-[#afafb0] rounded-full"
                  src={
                    auth?.empresa?.logo
                      ? auth.empresa.logo.startsWith('data:image')
                        ? auth.empresa.logo
                        : `data:image/png;base64,${auth.empresa.logo}`
                      : 'https://icons.veryicon.com/png/o/miscellaneous/two-color-icon-library/user-286.png'
                  }
                  alt=""
                />
                <div className="hidden md:flex flex-col items-start">
                  <label className="font-medium leading-4">{auth?.nombre}</label>
                  <p className="text-[12px] text-[#666] leading-5">{auth?.empresa?.nombreComercial}</p>
                </div>
                <Icon icon="mdi:chevron-down" className="hidden md:block text-[#666]" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border-gray-200 bg-white shadow-lg z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium truncate">{auth?.nombre}</p>
                    <p className="text-xs text-gray-500 truncate">{auth?.empresa?.nombreComercial}</p>
                  </div>
                  <ul className="py-1" role="menu">
                    <li>
                      <button
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                        onClick={() => { setIsUserMenuOpen(false); navigate('/administrador/perfil') }}
                        role="menuitem"
                      >
                        <Icon icon="solar:user-circle-broken" width="18" />
                        Perfil
                      </button>
                    </li>
                    {(auth?.empresa?.slugTienda || auth?.empresa?.plan?.tieneTienda) && (
                      <li>
                        <button
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                          onClick={() => { setIsUserMenuOpen(false); if (auth?.empresa?.slugTienda) navigate(`/tienda/${auth.empresa.slugTienda}`); else navigate('/administrador/tienda/configuracion'); }}
                          role="menuitem"
                        >
                          <Icon icon="mdi:storefront-outline" width="18" />
                          Ir a tienda virtual
                        </button>
                      </li>
                    )}
                    {(auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'USUARIO_EMPRESA') && (
                      <li>
                        <button
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                          onClick={() => { setIsUserMenuOpen(false); navigate('/administrador/notificaciones') }}
                          role="menuitem"
                        >
                          <Icon icon="basil:notification-outline" width="18" />
                          Notificaciones
                        </button>
                      </li>
                    )}
                    <li>
                      <button
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        onClick={() => { setIsUserMenuOpen(false); logout() }}
                        role="menuitem"
                      >
                        <Icon icon="mdi:logout" width="18" />
                        Cerrar sesión
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="p-3 md:p-0">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
