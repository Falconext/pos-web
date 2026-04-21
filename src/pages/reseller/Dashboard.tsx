import { useMemo } from 'react';
import { useResellerDashboardViewModel } from '@/features/reseller/useResellerViewModel';
import { Icon } from '@iconify/react';

const COSTO_SUNAT_COMPROBANTE = 0.05;
const PRICING_PLANS = [
    { plan: 'Plan 100', comprobantesMes: 100, mensual: 29.9, anual: 299 },
    { plan: 'Plan 300', comprobantesMes: 300, mensual: 39.9, anual: 399 },
    { plan: 'Plan 500', comprobantesMes: 500, mensual: 49.9, anual: 500 },
    { plan: 'Plan 600', comprobantesMes: 600, mensual: 69.9, anual: 699 },
    { plan: 'Plan 800', comprobantesMes: 800, mensual: 89.9, anual: 899 },
    { plan: 'Plan 1200', comprobantesMes: 1200, mensual: 119.9, anual: 1199 },
];

export default function ResellerDashboard() {
    const { auth, stats, clientes } = useResellerDashboardViewModel();

    const latestClientes = useMemo(() => clientes.slice(0, 5), [clientes]);
    const discountTiers = [20, 30, 35];
    const simulatorRows = useMemo(() => {
        return PRICING_PLANS.map((plan) => {
            const costoSunatMensual = plan.comprobantesMes * COSTO_SUNAT_COMPROBANTE;
            const costoSunatAnual = costoSunatMensual * 12;

            const tiers = discountTiers.map((tier) => {
                const resellerMensual = plan.mensual * (1 - tier / 100);
                const plataformaMensual = plan.mensual - resellerMensual;
                const resellerAnual = plan.anual * (1 - tier / 100);
                const plataformaAnual = plan.anual - resellerAnual;
                return {
                    tier,
                    resellerMensual,
                    plataformaMensual,
                    resellerAnual,
                    plataformaAnual,
                };
            });

            return {
                ...plan,
                costoSunatMensual,
                costoSunatAnual,
                tiers,
            };
        });
    }, []);

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

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col gap-2 mb-6">
                    <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold">
                        <Icon icon="solar:calculator-bold-duotone" width="20" />
                        Simulador de precios y margen
                    </div>
                    <p className="text-sm text-gray-500">Analiza cuánto te cuesta cada plan según los descuentos protegidos (20%, 30% y 35%) para que definas tu precio final al cliente.</p>
                </div>
                <div className="overflow-x-auto font-inter">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-gray-50/60 text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="px-4 py-3">Plan</th>
                                <th className="px-4 py-3">Comp./Mes</th>
                                <th className="px-4 py-3">Precio Público</th>
                                <th className="px-4 py-3">Costo SUNAT (incl. IGV)</th>
                                <th className="px-4 py-3">Reseller Mensual (20/30/35)</th>
                                <th className="px-4 py-3">Margen Plataforma</th>
                                <th className="px-4 py-3">Reseller Anual (20/30/35)</th>
                                <th className="px-4 py-3">Margen Plataforma</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {simulatorRows.map((row) => (
                                <tr key={row.plan} className="hover:bg-gray-50/40">
                                    <td className="px-4 py-3 font-semibold text-gray-800">{row.plan}</td>
                                    <td className="px-4 py-3 text-gray-700">{row.comprobantesMes}</td>
                                    <td className="px-4 py-3 font-mono">{formatCurrency(row.mensual)}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{formatCurrency(row.costoSunatMensual)}</td>
                                    <td className="px-4 py-3 text-xs">
                                        {row.tiers.map(({ tier, resellerMensual }) => (
                                            <div key={`${row.plan}-m-${tier}`} className="font-mono text-gray-700">
                                                {tier}%: {formatCurrency(resellerMensual)}
                                            </div>
                                        ))}
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        {row.tiers.map(({ tier, plataformaMensual }) => (
                                            <div key={`${row.plan}-pm-${tier}`} className="font-mono text-gray-600">
                                                {tier}%: {formatCurrency(plataformaMensual)}
                                            </div>
                                        ))}
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        {row.tiers.map(({ tier, resellerAnual }) => (
                                            <div key={`${row.plan}-a-${tier}`} className="font-mono text-gray-700">
                                                {tier}%: {formatCurrency(resellerAnual)}
                                            </div>
                                        ))}
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        {row.tiers.map(({ tier, plataformaAnual }) => (
                                            <div key={`${row.plan}-pa-${tier}`} className="font-mono text-gray-600">
                                                {tier}%: {formatCurrency(plataformaAnual)}
                                            </div>
                                        ))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
