import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore, type IAuthState } from '@/zustand/auth'
import NotificacionesCampana from '@/components/NotificacionesCampana'
import { hasPermission, getRedirectPath } from '@/utils/permissions'
import { useThemeStore } from '@/zustand/theme'
import Configurator from '@/components/ui/Configurator'

export default function ResellerLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const { auth }: IAuthState = useAuthStore()
    const { sidebarColor, sidebarType, navbarFixed, toggleConfigurator, isCompact, toggleCompact } = useThemeStore()

    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const userMenuRef = useRef<HTMLDivElement | null>(null)

    const theme = {
        sidebarBg: sidebarType === 'dark' ? 'bg-[#1C1C24]' : 'bg-white shadow-xl shadow-gray-200/50 border-r border-gray-100',
        sidebarText: sidebarType === 'white' ? 'text-gray-600' : 'text-gray-400',
        activeLink: `flex items-center w-full px-4 py-3.5 text-sm font-semibold text-white bg-indigo-600 shadow-lg shadow-indigo-500/20 rounded-2xl transition-all duration-200 group`,
        inactiveLink: `flex items-center w-full px-4 py-3.5 text-sm font-medium ${sidebarType === 'white' ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100' : 'text-gray-400 hover:text-white hover:bg-white/5'} rounded-2xl transition-all duration-200 group`
    }

    const logout = () => {
        localStorage.removeItem('ACCESS_TOKEN')
        localStorage.removeItem('REFRESH_TOKEN')
        navigate('/login', { replace: true })
    }

    return (
        <div className="flex overflow-hidden bg-[#F4F5FA] font-sans transition-all duration-300" style={{ height: '100vh' }}>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 ${theme.sidebarBg} p-4 space-y-6 h-full overflow-y-auto w-[280px] transition-transform duration-300 z-50 md:static ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="flex items-center gap-3 px-2 mb-8 mt-2">
                    <div className="flex items-center justify-center p-2 bg-indigo-600 rounded-xl text-white">
                        <Icon icon="solar:shop-bold-duotone" width="24" />
                    </div>
                    <div>
                        <h2 className={`text-xl font-bold tracking-tight leading-none ${sidebarType === 'white' ? 'text-gray-800' : 'text-white'}`}>RESELLER</h2>
                        <p className="text-[10px] text-gray-400 font-medium tracking-wide mt-1">PANEL DISTRIBUIDOR</p>
                    </div>
                </div>

                <nav className="space-y-1.5">
                    <NavLink onClick={() => setIsSidebarOpen(false)} to="/reseller" end className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink}>
                        <Icon icon="solar:chart-2-bold-duotone" className="mr-3 text-xl" /> Dashboard
                    </NavLink>
                    <NavLink onClick={() => setIsSidebarOpen(false)} to="/reseller/clientes" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink}>
                        <Icon icon="solar:users-group-rounded-bold-duotone" className="mr-3 text-xl" /> Mis Clientes
                    </NavLink>
                    <NavLink onClick={() => setIsSidebarOpen(false)} to="/reseller/recargas" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink}>
                        <Icon icon="solar:wallet-money-bold-duotone" className="mr-3 text-xl" /> Recargas
                    </NavLink>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                {/* Header */}
                <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md">
                    <button className="md:hidden" onClick={() => setIsSidebarOpen(true)}>
                        <Icon icon="solar:hamburger-menu-linear" width="24" />
                    </button>
                    <div className="flex-1"></div>
                    <div className="relative" ref={userMenuRef}>
                        <button
                            className="flex items-center gap-3 rounded-full hover:bg-gray-100 p-1 pr-3 transition-all"
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        >
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                {auth?.nombre?.charAt(0)}
                            </div>
                            <div className="hidden md:flex flex-col items-start">
                                <span className="text-sm font-semibold text-gray-700">{auth?.nombre}</span>
                                <span className="text-[10px] font-bold text-indigo-600">DISTRIBUIDOR</span>
                            </div>
                        </button>

                        {isUserMenuOpen && (
                            <div className="absolute right-0 mt-3 w-48 rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden z-50">
                                <button onClick={logout} className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-600 hover:bg-red-50">
                                    <Icon icon="solar:logout-broken" width="20" /> Cerrar sesión
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                <div className="p-6">
                    <Outlet />
                </div>
            </main>

        </div>
    )
}
