import { useResellerRecargasViewModel } from '@/features/reseller/useResellerViewModel';
import { Icon } from '@iconify/react';
import moment from 'moment';
import { useMemo, useState } from 'react';
import DataTable from '@/components/Datatable';

export default function ResellerRecargas() {
    const { recargas, stats, renovaciones, renovacionesResumen, getRenovaciones, auth } = useResellerRecargasViewModel();
    const [estadoFiltro, setEstadoFiltro] = useState<'' | 'APLICADO' | 'PENDIENTE' | 'RECHAZADO'>('');

    const aplicarFiltro = async (estado: '' | 'APLICADO' | 'PENDIENTE' | 'RECHAZADO') => {
        setEstadoFiltro(estado);
        if (auth?.resellerId) {
            await getRenovaciones(auth.resellerId, estado);
        }
    };

    const recargasTable = useMemo(
        () => recargas.map((recarga: any) => ({
            id: `#${recarga.id}`,
            fecha: moment(recarga.fecha).format('DD MMM YYYY, hh:mm A'),
            monto: `+S/ ${Number(recarga.monto).toFixed(2)}`,
            referencia: recarga.referencia || '-',
            estado: 'COMPLETADO',
        })),
        [recargas],
    );

    const renovacionesTable = useMemo(
        () => renovaciones.map((mov: any) => ({
            fecha: moment(mov.fecha).format('DD MMM YYYY, hh:mm A'),
            cliente: mov.empresa?.razonSocial || 'Cliente eliminado',
            ruc: mov.empresa?.ruc || '-',
            monto: `S/ ${Number(mov.monto).toFixed(2)}`,
            intento: `#${mov.intento || 1}`,
            estado: mov.estado || 'APLICADO',
            detalle: mov.descripcion || '-',
        })),
        [renovaciones],
    );

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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800">Historial Reciente</h3>
                </div>
                <div className="p-4 relative z-0">
                    <div className="overflow-x-auto font-inter">
                        <DataTable
                            headerColumns={[
                                { label: 'ID', key: 'id' },
                                { label: 'Fecha', key: 'fecha' },
                                { label: 'Monto', key: 'monto' },
                                { label: 'Referencia', key: 'referencia' },
                                { label: 'Estado', key: 'estado' },
                            ]}
                            bodyData={recargasTable}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="font-bold text-gray-800">Renovaciones de Clientes</h3>
                        <p className="text-xs text-gray-500">Seguimiento de cobros mensuales, intentos y suspensiones</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: 'Todos', value: '' as const },
                            { label: 'Aplicados', value: 'APLICADO' as const },
                            { label: 'Pendientes', value: 'PENDIENTE' as const },
                            { label: 'Rechazados', value: 'RECHAZADO' as const },
                        ].map((item) => (
                            <button
                                key={item.label}
                                onClick={() => aplicarFiltro(item.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                    estadoFiltro === item.value
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 border-b border-gray-100 bg-gray-50/40">
                    <div className="rounded-xl border border-gray-100 bg-white p-3">
                        <p className="text-[11px] uppercase font-semibold text-gray-500">Total</p>
                        <p className="text-xl font-bold text-gray-800">{renovacionesResumen.total || 0}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                        <p className="text-[11px] uppercase font-semibold text-emerald-600">Aplicados</p>
                        <p className="text-xl font-bold text-emerald-700">{renovacionesResumen.aplicados || 0}</p>
                    </div>
                    <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
                        <p className="text-[11px] uppercase font-semibold text-amber-600">Pendientes</p>
                        <p className="text-xl font-bold text-amber-700">{renovacionesResumen.pendientes || 0}</p>
                    </div>
                    <div className="rounded-xl border border-red-100 bg-red-50/50 p-3">
                        <p className="text-[11px] uppercase font-semibold text-red-600">Rechazados</p>
                        <p className="text-xl font-bold text-red-700">{renovacionesResumen.rechazados || 0}</p>
                    </div>
                </div>

                <div className="p-4 relative z-0">
                    <div className="overflow-x-auto font-inter">
                        <DataTable
                            headerColumns={[
                                { label: 'Fecha', key: 'fecha' },
                                { label: 'Cliente', key: 'cliente' },
                                { label: 'RUC', key: 'ruc' },
                                { label: 'Monto', key: 'monto' },
                                { label: 'Intento', key: 'intento' },
                                { label: 'Estado', key: 'estado' },
                                { label: 'Detalle', key: 'detalle' },
                            ]}
                            bodyData={renovacionesTable}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
