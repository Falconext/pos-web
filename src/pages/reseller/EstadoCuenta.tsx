import { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import moment from 'moment';
import DataTable from '@/components/Datatable';
import { useResellerEstadoCuentaViewModel } from '@/features/reseller/useResellerViewModel';
import type { ResellerEstadoCuentaMovimiento } from '@/zustand/reseller-panel';

type EstadoFilter = '' | 'APLICADO' | 'PENDIENTE' | 'RECHAZADO';
type TipoFilter = '' | 'RECARGA' | 'ACTIVACION' | 'MENSUALIDAD' | 'DEVOLUCION';

export default function ResellerEstadoCuenta() {
    const { auth, estadoCuenta, getEstadoCuenta } = useResellerEstadoCuentaViewModel();
    const [desde, setDesde] = useState(moment().startOf('month').format('YYYY-MM-DD'));
    const [hasta, setHasta] = useState(moment().format('YYYY-MM-DD'));
    const [estado, setEstado] = useState<EstadoFilter>('');
    const [tipo, setTipo] = useState<TipoFilter>('');

    const onFiltrar = async () => {
        if (!auth?.resellerId) return;
        await getEstadoCuenta(auth.resellerId, { desde, hasta, estado, tipo, page: 1, limit: 100 });
    };

    const rows = useMemo(
        () =>
            (estadoCuenta?.movimientos || []).map((mov: ResellerEstadoCuentaMovimiento) => ({
                fecha: moment(mov.fecha).format('DD/MM/YYYY HH:mm'),
                tipo: mov.tipo,
                cliente: mov.empresa?.razonSocial || '-',
                ruc: mov.empresa?.ruc || '-',
                monto: `${mov.monto >= 0 ? '+' : '-'}S/ ${Math.abs(Number(mov.monto || 0)).toFixed(2)}`,
                estado: mov.estado || '-',
                intento: mov.intento || 1,
                detalle: mov.descripcion || '-',
            })),
        [estadoCuenta?.movimientos],
    );

    const exportarCSV = () => {
        const data = estadoCuenta?.movimientos || [];
        if (!data.length) return;

        const headers = ['FECHA', 'TIPO', 'CLIENTE', 'RUC', 'MONTO', 'ESTADO', 'INTENTO', 'DETALLE'];
        const lines = data.map((mov) => [
            moment(mov.fecha).format('YYYY-MM-DD HH:mm:ss'),
            mov.tipo,
            mov.empresa?.razonSocial || '',
            mov.empresa?.ruc || '',
            Number(mov.monto || 0).toFixed(2),
            mov.estado || '',
            String(mov.intento || 1),
            (mov.descripcion || '').replace(/"/g, "'"),
        ]);

        const csv = [headers, ...lines].map((row) => row.map((value) => `"${value}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `estado-cuenta-${moment().format('YYYYMMDD-HHmm')}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const resumen = estadoCuenta?.resumen;

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Estado de Cuenta</h1>
                    <p className="text-sm text-gray-500">Control de recargas, activaciones y renovaciones de tus clientes.</p>
                </div>
                <button
                    onClick={exportarCSV}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-semibold"
                >
                    <Icon icon="solar:download-minimalistic-linear" width="18" />
                    Exportar CSV
                </button>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
                <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
                <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
                <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoFilter)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm">
                    <option value="">Todos los tipos</option>
                    <option value="RECARGA">Recarga</option>
                    <option value="ACTIVACION">Activación</option>
                    <option value="MENSUALIDAD">Mensualidad</option>
                    <option value="DEVOLUCION">Devolución</option>
                </select>
                <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoFilter)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm">
                    <option value="">Todos los estados</option>
                    <option value="APLICADO">Aplicado</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="RECHAZADO">Rechazado</option>
                </select>
                <button
                    onClick={onFiltrar}
                    className="h-11 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors text-sm"
                >
                    Filtrar
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <CardKpi title="Saldo Actual" value={`S/ ${Number(estadoCuenta?.reseller?.saldoActual || 0).toFixed(2)}`} color="text-indigo-700" />
                <CardKpi title="Total Recargado" value={`S/ ${Number(resumen?.recargas.total || 0).toFixed(2)}`} color="text-emerald-700" />
                <CardKpi title="Total Cobrado" value={`S/ ${Number(resumen?.totalCobrado || 0).toFixed(2)}`} color="text-rose-700" />
                <CardKpi title="Flujo Neto Periodo" value={`S/ ${Number(resumen?.flujoNeto || 0).toFixed(2)}`} color="text-slate-700" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <h3 className="font-bold text-gray-800 mb-1">Movimientos del periodo</h3>
                <p className="text-xs text-gray-500 mb-4">
                    Desde {moment(estadoCuenta?.periodo?.desde || desde).format('DD/MM/YYYY')} hasta {moment(estadoCuenta?.periodo?.hasta || hasta).format('DD/MM/YYYY')}
                </p>
                <DataTable
                    headerColumns={[
                        { label: 'Fecha', key: 'fecha' },
                        { label: 'Tipo', key: 'tipo' },
                        { label: 'Cliente', key: 'cliente' },
                        { label: 'RUC', key: 'ruc' },
                        { label: 'Monto', key: 'monto' },
                        { label: 'Estado', key: 'estado' },
                        { label: 'Intento', key: 'intento' },
                        { label: 'Detalle', key: 'detalle' },
                    ]}
                    bodyData={rows}
                    pageSize={15}
                />
            </div>
        </div>
    );
}

function CardKpi({ title, value, color }: { title: string; value: string; color: string }) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
            <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
        </div>
    );
}
