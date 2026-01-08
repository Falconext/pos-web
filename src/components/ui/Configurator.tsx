import { Icon } from '@iconify/react';
import { useThemeStore, SidebarColor, SidebarType } from '../../zustand/theme';

export default function Configurator() {
    const {
        isOpen,
        closeConfigurator,
        sidebarColor,
        setSidebarColor,
        sidebarType,
        setSidebarType,
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
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90]"
                onClick={closeConfigurator}
            />

            {/* Panel */}
            <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-[100] p-6 overflow-y-auto animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Falconext UI Configuración</h2>
                        <p className="text-sm text-gray-500">Personaliza tu experiencia visual.</p>
                    </div>
                    <button
                        onClick={closeConfigurator}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <Icon icon="solar:close-circle-bold" className="text-gray-500 text-2xl" />
                    </button>
                </div>

                <hr className="border-gray-100 my-4" />

                {/* Sidenav Colors */}
                <div className="mb-6">
                    <h4 className="font-bold text-gray-800 mb-2">Colores del Menú Lateral</h4>
                    <div className="flex items-center gap-2">
                        {colors.map((c) => (
                            <button
                                key={c.value}
                                onClick={() => setSidebarColor(c.value)}
                                className={`w-6 h-6 rounded-full ${c.color} transition-transform hover:scale-110 flex items-center justify-center ${sidebarColor === c.value ? 'ring-2 ring-gray-400 ring-offset-2' : ''}`}
                            >
                                {sidebarColor === c.value && <Icon icon="solar:check-circle-bold" className="text-white text-xs" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sidenav Type */}
                <div className="mb-6">
                    <h4 className="font-bold text-gray-800 mb-2">Estilo del Menú</h4>
                    <p className="text-xs text-gray-500 mb-3">Elige entre diferentes estilos para el menú.</p>
                    <div className="flex gap-2">
                        {types.map((t) => (
                            <button
                                key={t.value}
                                onClick={() => setSidebarType(t.value)}
                                className={`px-4 py-2 text-xs font-bold uppercase rounded-lg border transition-all ${sidebarType === t.value
                                        ? 'bg-gray-800 text-white border-gray-800 shadow-lg'
                                        : 'bg-transparent text-gray-700 border-gray-800 hover:bg-gray-50'
                                    }`}
                            >
                                {t.name === 'Dark' ? 'Oscuro' : t.name === 'White' ? 'Blanco' : 'Transp.'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Navbar Fixed */}
                <div className="flex justify-between items-center mb-6">
                    <h4 className="font-bold text-gray-800">Barra Superior Fija</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={navbarFixed}
                            onChange={(e) => setNavbarFixed(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800"></div>
                    </label>
                </div>

                <hr className="border-gray-100 my-6" />

                <div className="text-center">
                    <h4 className="font-bold text-gray-800 mb-2">¡Gracias por usar Falconext!</h4>
                    <div className="flex gap-2 justify-center mt-4">
                        <button className="bg-gray-800 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-900 transition-colors">
                            <Icon icon="mdi:twitter" /> TWEET
                        </button>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors">
                            <Icon icon="mdi:facebook" /> COMPARTIR
                        </button>
                    </div>
                </div>

            </div>
        </>
    );
}
