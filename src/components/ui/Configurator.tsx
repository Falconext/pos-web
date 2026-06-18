import { Icon } from '@iconify/react';
import { useThemeStore, SidebarColor, SidebarType } from '../../zustand/theme';
import { BRAND, getBrandByKey } from '@/lib/branding';
import { useAuthStore } from '../../zustand/auth';

export default function Configurator() {
    const { auth } = useAuthStore();
    const isSystemAdmin = auth?.rol === 'ADMIN_SISTEMA';
    const configBrand = isSystemAdmin && auth?.sistemaNegocio
        ? getBrandByKey(auth.sistemaNegocio)
        : BRAND;

    const {
        isOpen,
        closeConfigurator,
        sidebarColor,
        setSidebarColor,
        sidebarType,
        setSidebarType,
        sidebarCollapsed,
        setSidebarCollapsed,
        navbarFixed,
        setNavbarFixed
    } = useThemeStore();

    if (!isOpen) return null;

    const colors: { name: string; value: SidebarColor; color: string }[] = [
        { name: 'Primary', value: 'primary', color: 'bg-fuchsia-600' }, // Pink/Fuchsia
        { name: 'Dark', value: 'dark', color: 'bg-gray-900' },
        { name: 'Info', value: 'info', color: 'bg-blue-500' },
        { name: 'Success', value: 'success', color: 'bg-emerald-500' },
        { name: 'Warning', value: 'warning', color: 'bg-orange-500' },
        { name: 'Error', value: 'error', color: 'bg-red-500' },
    ];

    const types: { name: string; value: SidebarType }[] = [
        { name: 'Dark', value: 'dark' },
        { name: 'Transparent', value: 'transparent' },
        { name: 'White', value: 'white' },
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20   z-[90]"
                onClick={closeConfigurator}
            />

            {/* Panel */}
            <div className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-[#111827] shadow-2xl z-[100] p-6 overflow-y-auto animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{configBrand.name} UI Configuración</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Personaliza tu experiencia visual.</p>
                    </div>
                    <button
                        onClick={closeConfigurator}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <Icon icon="solar:close-circle-bold" className="text-gray-500 dark:text-gray-400 text-2xl" />
                    </button>
                </div>

                <hr className="border-gray-100 dark:border-slate-800 my-4" />

                {/* Sidenav Colors */}
                <div className="mb-6">
                    <h4 className="font-bold text-gray-800 dark:text-white mb-2">Colores del Menú Lateral</h4>
                    <div className="flex items-center gap-2">
                        {colors.map((c) => (
                            <button
                                key={c.value}
                                onClick={() => setSidebarColor(c.value)}
                                className={`w-6 h-6 rounded-full ${c.color} transition-transform hover:scale-110 flex items-center justify-center ${sidebarColor === c.value ? 'ring-2 ring-gray-400 dark:ring-gray-500 ring-offset-2 dark:ring-offset-[#111827]' : ''}`}
                            >
                                {sidebarColor === c.value && <Icon icon="solar:check-circle-bold" className="text-white text-xs" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sidenav Type */}
                <div className="mb-6">
                    <h4 className="font-bold text-gray-800 dark:text-white mb-2">Estilo del Menú</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Elige entre diferentes estilos para el menú.</p>
                    <div className="flex gap-2">
                        {types.map((t) => (
                            <button
                                key={t.value}
                                onClick={() => setSidebarType(t.value)}
                                className={`px-4 py-2 text-xs font-bold uppercase rounded-lg border transition-all ${sidebarType === t.value
                                        ? 'bg-gray-800 text-white border-gray-800 dark:bg-white dark:text-gray-900 dark:border-white shadow-lg'
                                        : 'bg-transparent text-gray-700 dark:text-gray-300 border-gray-800 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {t.name === 'Dark' ? 'Oscuro' : t.name === 'White' ? 'Blanco' : 'Transp.'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sidebar Collapsed */}
                <label className="mb-4 flex cursor-pointer items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:bg-gray-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800">
                    <div>
                        <h4 className="font-bold text-gray-800 dark:text-white">Contraer Menú Lateral</h4>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {sidebarCollapsed ? 'Muestra solo íconos para ganar espacio.' : 'Muestra íconos y nombres completos.'}
                        </p>
                    </div>
                    <span className="relative inline-flex items-center">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={sidebarCollapsed}
                            onChange={(e) => setSidebarCollapsed(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800 dark:peer-checked:bg-white"></div>
                    </span>
                </label>

                {/* Navbar Fixed */}
                <label className="mb-6 flex cursor-pointer items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:bg-gray-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800">
                    <div>
                        <h4 className="font-bold text-gray-800 dark:text-white">Barra Superior Fija</h4>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {navbarFixed ? 'El header permanece visible al desplazarte.' : 'El header se desplaza con el contenido.'}
                        </p>
                    </div>
                    <span className="relative inline-flex items-center">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={navbarFixed}
                            onChange={(e) => setNavbarFixed(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800 dark:peer-checked:bg-white"></div>
                    </span>
                </label>

                <hr className="border-gray-100 dark:border-slate-800 my-6" />

                <div className="text-center">
                    <h4 className="font-bold text-gray-800 dark:text-white mb-2">¡Gracias por usar {configBrand.name}!</h4>
                </div>

            </div>
        </>
    );
}
