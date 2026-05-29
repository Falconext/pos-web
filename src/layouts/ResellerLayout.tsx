import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore, type IAuthState } from '@/zustand/auth'
import NotificacionesCampana from '@/components/NotificacionesCampana'
import { hasPermission, getRedirectPath } from '@/utils/permissions'
import { useThemeStore } from '@/zustand/theme'
import Configurator from '@/components/ui/Configurator'
import { BRAND } from '@/lib/branding'

export default function ResellerLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const { auth, logout: authLogout }: IAuthState = useAuthStore()
    const { sidebarColor, sidebarType, navbarFixed, toggleConfigurator, isCompact, toggleCompact } = useThemeStore()

    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const userMenuRef = useRef<HTMLDivElement | null>(null)

    const theme = {
        activeLink: 'flex items-center w-full px-3.5 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-[#4F6EF7] shadow-[0_4px_12px_rgba(79,110,247,0.35)] transition-all duration-200',
        inactiveLink: 'flex items-center w-full px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150'
    }

    const logout = () => {
        authLogout()
        navigate('/login', { replace: true })
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

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 bg-white shadow-[2px_0_20px_rgba(0,0,0,0.06)] p-4 space-y-6 h-full overflow-y-auto w-[260px] transition-transform duration-300 z-50 md:static ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="flex items-center gap-3 px-2 mb-8 mt-2">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#4F6EF7] shadow-md shadow-indigo-200">
                        <img src={BRAND.logo} alt={BRAND.name} className="w-5 h-5 object-contain brightness-0 invert" />
                    </div>
                    <div>
                        <h2 className="text-[15px] font-bold tracking-tight leading-none text-gray-900">{BRAND.name.toUpperCase()}</h2>
                        <p className="text-[9px] text-gray-400 font-semibold tracking-widest mt-0.5 uppercase">Panel Distribuidor</p>
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
                    <NavLink onClick={() => setIsSidebarOpen(false)} to="/reseller/estado-cuenta" className={({ isActive }) => isActive ? theme.activeLink : theme.inactiveLink}>
                        <Icon icon="solar:bill-list-bold-duotone" className="mr-3 text-xl" /> Estado de Cuenta
                    </NavLink>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                {/* Header */}
                <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100">
                    <button className="md:hidden" onClick={() => setIsSidebarOpen(true)}>
                        <Icon icon="solar:hamburger-menu-linear" width="24" />
                    </button>
                    <div className="flex-1"></div>
                    <div className="relative" ref={userMenuRef}>
                        <button
                            className="flex items-center gap-3 rounded-full hover:bg-gray-100 p-1 pr-3 transition-all"
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        >
                            <div className="w-10 h-10 rounded-full bg-[#4F6EF7]/10 flex items-center justify-center text-[#4F6EF7] font-bold">
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
