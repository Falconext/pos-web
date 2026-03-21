import { useResellerRecargasViewModel } from '@/features/reseller/useResellerViewModel';
import { Icon } from '@iconify/react';
import moment from 'moment';

export default function ResellerRecargas() {
    const { recargas, stats } = useResellerRecargasViewModel();

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Mis Recargas</h1>
                    <p className="text-gray-500">Historial de saldo recargado</p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600"><Icon icon="solar:wallet-bold" width="24" /></div>
                    <div><p className="text-sm text-gray-500 font-medium">Saldo Disponible</p><p className="text-2xl font-bold text-gray-800">S/ {Number(stats.saldo).toFixed(2)}</p></div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600"><Icon icon="solar:tag-price-bold" width="24" /></div>
                    <div><p className="text-sm text-gray-500 font-medium">Nivel de Descuento</p><p className="text-2xl font-bold text-gray-800">{stats.porcentajeDescuento}%</p></div>
                </div>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100"><h3 className="font-bold text-gray-800">Historial Reciente</h3></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-semibold">
                            <tr><th className="px-6 py-4">ID</th><th className="px-6 py-4">Fecha</th><th className="px-6 py-4">Monto</th><th className="px-6 py-4">Referencia / Banco</th><th className="px-6 py-4">Estado</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {recargas.length === 0 ? (
                                <tr><td className="px-6 py-12" colSpan={5}><div className="flex flex-col items-center justify-center text-gray-400"><Icon icon="solar:card-search-linear" width="48" className="mb-2 opacity-50" /><p>No hay recargas registradas</p></div></td></tr>
                            ) : (
                                recargas.map((recarga: any) => (
                                    <tr key={recarga.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500">#{recarga.id}</td>
                                        <td className="px-6 py-4 text-gray-800">{moment(recarga.fecha).format('DD MMM YYYY, hh:mm A')}</td>
                                        <td className="px-6 py-4"><span className="font-bold text-emerald-600">+S/ {Number(recarga.monto).toFixed(2)}</span></td>
                                        <td className="px-6 py-4 text-gray-600">{recarga.referencia || '-'}</td>
                                        <td className="px-6 py-4"><span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">Completado</span></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
