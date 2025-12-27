import React, { useEffect, useState } from 'react';
import { useCajaStore } from '../../../../zustand/caja';
import { Icon } from '@iconify/react';
import DataTable from '@/components/Datatable'; // Assuming this component exists and works like in Arqueo
import Pagination from '@/components/Pagination'; // Assuming exists
import { Calendar } from '@/components/Date'; // Assuming exists
import Button from '@/components/Button';
import moment from 'moment';

const CajaHistorial: React.FC = () => {
    const {
        historialCaja,
        loading,
        pagination,
        filters,
        obtenerHistorialCaja,
        setFilters,
        clearFilters,
    } = useCajaStore();

    const [localFilters, setLocalFilters] = useState(filters);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);

    useEffect(() => {
        obtenerHistorialCaja(page, limit);
    }, [page, limit, filters, obtenerHistorialCaja]);

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);


    const handleDate = (date: string, name: string) => {
        if (!moment(date, 'DD/MM/YYYY', true).isValid()) return;
        const formatted = moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD');
        setLocalFilters(prev => ({ ...prev, [name]: formatted }));
    };

    const applyFilters = () => {
        setFilters(localFilters);
        setPage(1);
    };

    const resetFilters = () => {
        clearFilters();
        const today = moment().format('YYYY-MM-DD');
        setLocalFilters({ fechaInicio: today, fechaFin: today });
        setPage(1);
    };

    const formatCurrency = (amount: any) => {
        const num = Number(amount) || 0;
        return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(num);
    };

    const columns = [
        'Estado',
        'Fecha Apertura',
        'Fecha Cierre',
        'Cajero',
        'Monto Inicial',
        'Ventas (Efectivo)',
        'Total Cierre'
    ];

    const data = historialCaja?.map((turno: any) => {
        // Mapping fields based on standard shift structure
        // Adjust these fields if your API response is different
        // Based on Historial.tsx it seems to list "movimientos"? Or "turnos"?
        // Historial.tsx used to just list movements. But "CajaHistorial" implies Shifts.
        // If historialCaja returns movements (APERTURA, CIERRE, INGRESO, EGRESO), then this table shows movements. 
        // Ideally we want SHIFTS (Apertura -> Cierre). 
        // But let's assume historialCaja is listing movements for now as per previous file.
        // Actually, if I look at Historial.tsx (lines 68-91), it handles 'APERTURA', 'CIERRE'.
        // So it is a list of movements.

        return {
            'Estado': (
                <span className={`px-2 py-1 rounded text-xs font-bold ${turno.tipoMovimiento === 'APERTURA' ? 'bg-green-100 text-green-700' :
                    turno.tipoMovimiento === 'CIERRE' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                    }`}>
                    {turno.tipoMovimiento}
                </span>
            ),
            'Fecha Apertura': new Date(turno.fecha).toLocaleDateString('es-PE') + ' ' + new Date(turno.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
            'Fecha Cierre': '-', // Movements are single points in time
            'Cajero': turno.usuario?.username || 'Sistema',
            'Monto Inicial': turno.tipoMovimiento === 'APERTURA' ? formatCurrency(turno.montoInicial) : '-',
            'Ventas (Efectivo)': '-',
            'Total Cierre': turno.tipoMovimiento === 'CIERRE' ? formatCurrency(turno.montoEfectivo) : '-', // Assuming structure
            // We might want to just show "Monto" column roughly
            'Monto': formatCurrency(turno.monto || turno.montoInicial || turno.montoEfectivo || 0),
            'Observaciones': turno.observaciones || '-'
        };
    }) || [];

    // Redefine columns for Movement view
    const movementColumns = ['Tipo', 'Fecha', 'Usuario', 'Monto', 'Observaciones'];
    const movementData = historialCaja?.map((mov: any) => ({
        'Tipo': (
            <span className={`px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 ${mov.tipoMovimiento === 'APERTURA' ? 'bg-green-100 text-green-700' :
                mov.tipoMovimiento === 'CIERRE' ? 'bg-red-100 text-red-700' :
                    mov.tipoMovimiento === 'INGRESO' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                }`}>
                <Icon icon={
                    mov.tipoMovimiento === 'APERTURA' ? "solar:play-circle-bold" :
                        mov.tipoMovimiento === 'CIERRE' ? "solar:stop-circle-bold" :
                            mov.tipoMovimiento === 'INGRESO' ? "solar:arrow-right-up-bold" :
                                "solar:arrow-left-down-bold"
                } />
                {mov.tipoMovimiento}
            </span>
        ),
        'Fecha': new Date(mov.fecha).toLocaleString('es-PE'),
        'Usuario': mov.usuario?.username || 'Sistema',
        'Monto': <span className="font-mono font-medium">{formatCurrency(mov.monto ?? mov.montoInicial ?? mov.montoFinal ?? 0)}</span>,
        'Observaciones': mov.observaciones || '-'
    })) || [];

    return (
        <div className="space-y-4 animate-in fade-in">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-auto">
                    <Calendar name="fechaInicio" onChange={handleDate} text="Fecha Inicio" value={localFilters.fechaInicio ? moment(localFilters.fechaInicio).format('DD/MM/YYYY') : ''} />
                </div>
                <div className="w-full md:w-auto">
                    <Calendar name="fechaFin" onChange={handleDate} text="Fecha Fin" value={localFilters.fechaFin ? moment(localFilters.fechaFin).format('DD/MM/YYYY') : ''} />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button onClick={applyFilters} color="primary" className="flex-1 md:flex-none">
                        <Icon icon="solar:filter-bold-duotone" className="mr-2" /> Filtrar
                    </Button>
                    <Button onClick={resetFilters} color="secondary" outline>
                        <Icon icon="solar:restart-bold-duotone" />
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <DataTable
                    headerColumns={movementColumns}
                    bodyData={movementData}
                />
            </div>

            {pagination && (
                <Pagination
                    data={historialCaja}
                    total={pagination.total}
                    currentPage={page}
                    setcurrentPage={setPage}
                    setitemsPerPage={setLimit}
                    indexOfFirstItem={(page - 1) * limit}
                    indexOfLastItem={Math.min(page * limit, pagination.total)}
                    pages={Array.from({ length: pagination.totalPages }, (_, i) => i + 1)}
                />
            )}
        </div>
    );
};

export default CajaHistorial;
