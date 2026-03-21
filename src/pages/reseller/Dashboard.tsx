import { useResellerDashboardViewModel } from '@/features/reseller/useResellerViewModel';
import { Icon } from '@iconify/react';

export default function ResellerDashboard() {
    const { auth, stats } = useResellerDashboardViewModel();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Hola, {auth?.nombre}</h1>
                <p className="text-gray-500">Resumen de tu actividad como Distribuidor</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Icon icon="solar:wallet-money-bold-duotone" width="32" /></div>
                    <div><p className="text-sm font-medium text-gray-400">Saldo Disponible</p><h3 className="text-2xl font-bold text-gray-800">S/ {Number(stats.saldo).toFixed(2)}</h3></div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
                    <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl"><Icon icon="solar:tag-price-bold-duotone" width="32" /></div>
                    <div><p className="text-sm font-medium text-gray-400">Tu Nivel de Descuento</p><h3 className="text-2xl font-bold text-gray-800">{Number(stats.porcentajeDescuento)}%</h3><p className="text-xs text-green-600 font-medium">Aplicado a todos los planes</p></div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Icon icon="solar:users-group-rounded-bold-duotone" width="32" /></div>
                    <div><p className="text-sm font-medium text-gray-400">Clientes Activos</p><h3 className="text-2xl font-bold text-gray-800">{stats.clientesActivos || 0}</h3></div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl"><Icon icon="solar:user-block-bold-duotone" width="32" /></div>
                    <div><p className="text-sm font-medium text-gray-400">Suspendidos</p><h3 className="text-2xl font-bold text-gray-800">{stats.clientesSuspendidos || 0}</h3></div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-gray-800">Últimos Clientes Registrados</h3><button className="text-sm text-indigo-600 font-semibold hover:underline">Ver todos</button></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead><tr className="text-xs text-gray-400 uppercase border-b border-gray-100"><th className="py-3 font-semibold">Empresa</th><th className="py-3 font-semibold">Plan</th><th className="py-3 font-semibold">Estado</th><th className="py-3 font-semibold">Fecha</th></tr></thead>
                            <tbody className="text-sm text-gray-600"><tr><td className="py-8 text-center text-gray-400" colSpan={4}>Por ahora no hay actividad reciente.</td></tr></tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/30">
                    <h3 className="text-xl font-bold mb-2">Recargar Saldo</h3>
                    <p className="text-indigo-100 text-sm mb-6">Asegura la continuidad de tus clientes manteniendo tu saldo positivo.</p>
                    <div className="space-y-4">
                        <button className="w-full py-3 bg-white text-indigo-700 font-bold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95">Contactar Soporte</button>
                        <p className="text-xs text-center opacity-70">Las recargas se realizan vía transferencia bancaria y se validan con soporte.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
