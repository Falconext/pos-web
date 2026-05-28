import { useMemo } from 'react';
import { useResellerDashboardViewModel } from '@/features/reseller/useResellerViewModel';
import { Icon } from '@iconify/react';
import { BRAND } from '@/lib/branding';

// Falconext-only pricing reference (Image #13)
const FALCONEXT_PLANES_REFERENCIA = [
    { plan: 'Emprendedor', precioPublico: 19.90, resellerMensual: 14.90, gananciaPublico: 5.00, resellerAnual: 149.00, gananciaAnual: 50.00 },
    { plan: 'Negocio',     precioPublico: 49.90, resellerMensual: 34.90, gananciaPublico: 15.00, resellerAnual: 349.00, gananciaAnual: 150.00 },
    { plan: 'Corporativo', precioPublico: 89.90, resellerMensual: 59.90, gananciaPublico: 30.00, resellerAnual: 599.00, gananciaAnual: 300.00 },
];

// Volume tier pricing (what platform charges reseller per active client/month) (Image #14)
const FALCONEXT_VOLUME_TIERS = [
    { label: '1 a 5 clientes',   emprendedor: 14.90, negocio: 34.90, corporativo: 59.90 },
    { label: '6 a 15 clientes',  emprendedor: 13.90, negocio: 32.90, corporativo: 56.90 },
    { label: '16 a 30 clientes', emprendedor: 12.90, negocio: 29.90, corporativo: 52.90 },
    { label: '31+ clientes',     emprendedor: 11.90, negocio: 27.90, corporativo: 49.90 },
];

function getCurrentTierIndex(clientesActivos: number): number {
    if (clientesActivos <= 5)  return 0;
    if (clientesActivos <= 15) return 1;
    if (clientesActivos <= 30) return 2;
    return 3;
}

const isFalconext = BRAND.key === 'falconext';

export default function ResellerDashboard() {
    const { auth, stats, clientes } = useResellerDashboardViewModel();

    const latestClientes = useMemo(() => clientes.slice(0, 5), [clientes]);
    const currentTierIndex = getCurrentTierIndex(stats.clientesActivos || 0);
    const currentTier = FALCONEXT_VOLUME_TIERS[currentTierIndex];

    const formatCurrency = (value: number) => `S/ ${value.toFixed(2)}`;

    const openSupportChat = () => {
        if (typeof window !== 'undefined') {
            window.open('https://wa.me/51991065217?text=Hola%20Falconext%2C%20necesito%20recargar%20saldo%20como%20reseller', '_blank');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Hola, {auth?.nombre}</h1>
                <p className="text-gray-500">Resumen de tu actividad como Distribuidor</p>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Icon icon="solar:wallet-money-bold-duotone" width="32" /></div>
                    <div>
                        <p className="text-sm font-medium text-gray-400">Saldo Disponible</p>
                        <h3 className="text-2xl font-bold text-gray-800">S/ {Number(stats.saldo).toFixed(2)}</h3>
                    </div>
                </div>

                {isFalconext ? (
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Icon icon="solar:chart-square-bold-duotone" width="32" /></div>
                        <div>
                            <p className="text-sm font-medium text-gray-400">Tu Nivel de Volumen</p>
                            <h3 className="text-lg font-bold text-gray-800">{currentTier.label}</h3>
                            <p className="text-xs text-emerald-600 font-medium">
                                Emprendedor {formatCurrency(currentTier.emprendedor)} · Negocio {formatCurrency(currentTier.negocio)}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
                        <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl"><Icon icon="solar:tag-price-bold-duotone" width="32" /></div>
                        <div>
                            <p className="text-sm font-medium text-gray-400">Tu Nivel de Descuento</p>
                            <h3 className="text-2xl font-bold text-gray-800">{Number(stats.porcentajeDescuento)}%</h3>
                            <p className="text-xs text-green-600 font-medium">Aplicado a todos los planes</p>
                        </div>
                    </div>
                )}

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Icon icon="solar:users-group-rounded-bold-duotone" width="32" /></div>
                    <div>
                        <p className="text-sm font-medium text-gray-400">Clientes Activos</p>
                        <h3 className="text-2xl font-bold text-gray-800">{stats.clientesActivos || 0}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl"><Icon icon="solar:user-block-bold-duotone" width="32" /></div>
                    <div>
                        <p className="text-sm font-medium text-gray-400">Suspendidos</p>
                        <h3 className="text-2xl font-bold text-gray-800">{stats.clientesSuspendidos || 0}</h3>
                    </div>
                </div>
            </div>

            {/* Recent clients + recharge card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Últimos Clientes Registrados</h3>
                        <button className="text-sm text-indigo-600 font-semibold hover:underline">Ver todos</button>
                    </div>
                    <div className="overflow-x-auto font-inter">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                                    <th className="py-3 font-semibold">Empresa</th>
                                    <th className="py-3 font-semibold">Plan</th>
                                    <th className="py-3 font-semibold">Costo Reseller</th>
                                    <th className="py-3 font-semibold">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-gray-600">
                                {latestClientes.length === 0 ? (
                                    <tr><td className="py-8 text-center text-gray-400" colSpan={4}>Por ahora no hay actividad reciente.</td></tr>
                                ) : (
                                    latestClientes.map((cliente: any) => (
                                        <tr key={cliente.id} className="border-b border-gray-50 last:border-none">
                                            <td className="py-3">
                                                <p className="font-semibold text-gray-800">{cliente.razonSocial}</p>
                                                <span className="text-xs text-gray-500 font-mono">{cliente.ruc}</span>
                                            </td>
                                            <td className="py-3">
                                                {cliente?.plan?.nombre || `Plan ID ${cliente.planId}`}
                                                {cliente?.plan?.maxComprobantes && (
                                                    <p className="text-xs text-gray-400">{cliente.plan.maxComprobantes} comprobantes</p>
                                                )}
                                            </td>
                                            <td className="py-3 font-semibold text-gray-800">{formatCurrency(Number(cliente.costoActivacionReseller ?? cliente.plan?.costo ?? 0))}</td>
                                            <td className="py-3">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${cliente.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                    {cliente.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/30">
                    <h3 className="text-xl font-bold mb-2">Recargar Saldo</h3>
                    <p className="text-indigo-100 text-sm mb-6">Asegura la continuidad de tus clientes manteniendo tu saldo positivo.</p>
                    <div className="space-y-4">
                        <button
                            className="w-full py-3 bg-white text-indigo-700 font-bold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
                            onClick={openSupportChat}
                        >
                            Contactar Soporte
                        </button>
                        <p className="text-xs text-center opacity-70">Las recargas se realizan vía transferencia bancaria y se validan con soporte.</p>
                        <p className="text-xs text-center opacity-70">WhatsApp: 991 065 217</p>
                    </div>
                </div>
            </div>

            {/* Falconext-only pricing section */}
            {isFalconext && (
                <div className="space-y-6">
                    {/* Reference pricing table (Image #13) */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <div className="flex flex-col gap-1 mb-5">
                            <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold">
                                <Icon icon="solar:tag-price-bold-duotone" width="20" />
                                Estructura de precios Falconext
                            </div>
                            <p className="text-sm text-gray-500">Referencia de precios públicos vs. lo que tú pagas. Tú defines cuánto cobras a tu cliente.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-gray-50/60 text-gray-500 text-xs uppercase">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Plan</th>
                                        <th className="px-4 py-3 font-semibold">Precio público Falconext</th>
                                        <th className="px-4 py-3 font-semibold">Tu precio (mensual)</th>
                                        <th className="px-4 py-3 font-semibold text-emerald-600">Ganancia si cobras precio público</th>
                                        <th className="px-4 py-3 font-semibold">Tu precio (anual)</th>
                                        <th className="px-4 py-3 font-semibold text-emerald-600">Ganancia anual</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {FALCONEXT_PLANES_REFERENCIA.map((row) => (
                                        <tr key={row.plan} className="hover:bg-gray-50/40">
                                            <td className="px-4 py-3.5 font-semibold text-gray-800">{row.plan}</td>
                                            <td className="px-4 py-3.5 font-mono text-gray-500">{formatCurrency(row.precioPublico)}</td>
                                            <td className="px-4 py-3.5 font-mono font-semibold text-indigo-700">{formatCurrency(row.resellerMensual)}</td>
                                            <td className="px-4 py-3.5 font-mono font-semibold text-emerald-600">+{formatCurrency(row.gananciaPublico)}</td>
                                            <td className="px-4 py-3.5 font-mono font-semibold text-indigo-700">{formatCurrency(row.resellerAnual)}</td>
                                            <td className="px-4 py-3.5 font-mono font-semibold text-emerald-600">+{formatCurrency(row.gananciaAnual)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Volume tier pricing table (Image #14) */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <div className="flex flex-col gap-1 mb-5">
                            <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold">
                                <Icon icon="solar:layers-minimalistic-bold-duotone" width="20" />
                                Tu costo según volumen de clientes
                            </div>
                            <p className="text-sm text-gray-500">Mientras más clientes activos tienes, menos pagas por cada uno. Tu nivel actual está resaltado.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-gray-50/60 text-gray-500 text-xs uppercase">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Clientes activos</th>
                                        <th className="px-4 py-3 font-semibold">Emprendedor</th>
                                        <th className="px-4 py-3 font-semibold">Negocio</th>
                                        <th className="px-4 py-3 font-semibold">Corporativo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {FALCONEXT_VOLUME_TIERS.map((tier, idx) => {
                                        const isCurrentTier = idx === currentTierIndex;
                                        return (
                                            <tr
                                                key={tier.label}
                                                className={isCurrentTier ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : 'hover:bg-gray-50/40'}
                                            >
                                                <td className={`px-4 py-3.5 font-semibold ${isCurrentTier ? 'text-indigo-700' : 'text-gray-700'}`}>
                                                    {tier.label}
                                                    {isCurrentTier && (
                                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                                                            TU NIVEL
                                                        </span>
                                                    )}
                                                </td>
                                                <td className={`px-4 py-3.5 font-mono font-semibold ${isCurrentTier ? 'text-indigo-700' : 'text-gray-700'}`}>
                                                    {formatCurrency(tier.emprendedor)}
                                                </td>
                                                <td className={`px-4 py-3.5 font-mono font-semibold ${isCurrentTier ? 'text-indigo-700' : 'text-gray-700'}`}>
                                                    {formatCurrency(tier.negocio)}
                                                </td>
                                                <td className={`px-4 py-3.5 font-mono font-semibold ${isCurrentTier ? 'text-indigo-700' : 'text-gray-700'}`}>
                                                    {formatCurrency(tier.corporativo)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                            <Icon icon="solar:info-circle-bold-duotone" width="14" />
                            Actualmente tienes {stats.clientesActivos || 0} cliente{(stats.clientesActivos || 0) !== 1 ? 's' : ''} activo{(stats.clientesActivos || 0) !== 1 ? 's' : ''}. El siguiente nivel baja el costo por cliente.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
