import React, { useEffect, useState } from 'react';
import { useCajaStore, MovimientoCaja } from '../../../../zustand/caja';
import { Icon } from '@iconify/react';
import ModalEditarGasto from './ModalEditarGasto';
import ModalConfirm from '@/components/ModalConfirm';
import DataTable from '@/components/Datatable'; // Assuming this component exists and works like in Arqueo
import Pagination from '@/components/Pagination'; // Assuming exists
import { Calendar } from '@/components/Date'; // Assuming exists
import Button from '@/components/Button';
import Select from '@/components/Select';
import moment from 'moment';
import { useAuthStore } from '@/zustand/auth';
import { useSedesStore } from '@/zustand/sedes';

const CajaHistorial: React.FC = () => {
    const {
        historialCaja,
        loading,
        pagination,
        filters,
        obtenerHistorialCaja,
        exportarArqueo,
        eliminarEgreso,
        setFilters,
        clearFilters,
    } = useCajaStore();

    const [egresoEditar, setEgresoEditar] = useState<MovimientoCaja | null>(null);
    const [egresoEliminarId, setEgresoEliminarId] = useState<number | null>(null);
    const [loadingEliminar, setLoadingEliminar] = useState(false);

    const { auth, sedeActiva } = useAuthStore();
    const { sedes, listarSedes } = useSedesStore();

    const isAdmin = auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'ADMIN_SISTEMA';
    const esPrincipal = !sedeActiva || sedeActiva.esPrincipal === true;

    const sedesOptions = [
        { id: 0, value: "Todas las sedes" },
        ...sedes.map(s => ({ id: s.id, value: s.esPrincipal ? `${s.nombre}` : s.nombre }))
    ];

    const [localFilters, setLocalFilters] = useState(filters);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        if (isAdmin && esPrincipal) listarSedes();
    }, [isAdmin, esPrincipal]);

    // Cuando la sede activa cambia y no es principal, aplicar filtro automáticamente
    useEffect(() => {
        if (!esPrincipal && sedeActiva?.id) {
            setFilters({ ...filters, sedeId: sedeActiva.id });
        }
    }, [sedeActiva, esPrincipal]);

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

    const handleExport = async () => {
        setExporting(true);
        try {
            await exportarArqueo(localFilters.fechaInicio, localFilters.fechaFin);
        } catch (error) {
            console.error("Error exporting:", error);
        } finally {
            setExporting(false);
        }
    };

    const resetFilters = () => {
        clearFilters();
        const today = moment().format('YYYY-MM-DD');
        setLocalFilters({ fechaInicio: today, fechaFin: today, sedeId: null });
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
            'Cajero': turno.usuario?.nombre || turno.usuario?.email || 'Sistema',
            'Monto Inicial': turno.tipoMovimiento === 'APERTURA' ? formatCurrency(turno.montoInicial) : '-',
            'Ventas (Efectivo)': '-',
            'Total Cierre': turno.tipoMovimiento === 'CIERRE' ? formatCurrency(turno.montoEfectivo) : '-', // Assuming structure
            // We might want to just show "Monto" column roughly
            'Monto': formatCurrency(turno.monto || turno.montoInicial || turno.montoEfectivo || 0),
            'Observaciones': turno.observaciones || '-'
        };
    }) || [];

    // Redefine columns for Movement view
    const movementColumns = ['Tipo', 'Fecha', 'Usuario', 'Monto', 'Categoría', 'Detalle', 'Acciones'];
    const movementData = historialCaja?.map((mov: any) => ({
        'Tipo': (
            <span className={`px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 ${mov.tipoMovimiento === 'APERTURA' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                mov.tipoMovimiento === 'CIERRE' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                    mov.tipoMovimiento === 'INGRESO' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                        'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
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
        'Usuario': mov.usuario?.nombre || mov.usuario?.email || 'Sistema',
        'Monto': <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(mov.monto ?? mov.montoInicial ?? mov.montoFinal ?? 0)}</span>,
        'Categoría': mov.categoriaGasto
            ? (
                <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-100 dark:border-orange-800/30 whitespace-nowrap">
                    {mov.categoriaGasto}
                </span>
            )
            : <span className="text-gray-400 dark:text-gray-600">—</span>,
        'Detalle': (
            <span className="text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate block">
                {mov.descripcionGasto || mov.observaciones || '—'}
            </span>
        ),
        'Acciones': mov.tipoMovimiento === 'EGRESO' ? (
            <div className="flex gap-2">
                <button
                    onClick={() => setEgresoEditar(mov)}
                    className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    title="Editar gasto"
                >
                    <Icon icon="solar:pen-bold" className="text-base" />
                </button>
                <button
                    onClick={() => setEgresoEliminarId(mov.id)}
                    className="p-1.5 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Eliminar gasto"
                >
                    <Icon icon="solar:trash-bin-trash-bold" className="text-base" />
                </button>
            </div>
        ) : <span className="text-gray-300 dark:text-gray-700">—</span>,
    })) || [];

    return (
        <div className="animate-in fade-in">
            <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                {/* Filters Section */}
                <div className="p-5 border-b border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <Icon icon="solar:filter-bold-duotone" className="text-blue-600 dark:text-blue-400 text-xl" />
                        <h3 className="font-bold text-gray-800 dark:text-white uppercase tracking-wider text-xs">Filtros de búsqueda</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                        <div>
                            <Calendar
                                name="fechaInicio"
                                onChange={handleDate}
                                text="Fecha Inicio"
                                value={localFilters.fechaInicio ? moment(localFilters.fechaInicio).format('DD/MM/YYYY') : ''}
                            />
                        </div>
                        <div>
                            <Calendar
                                name="fechaFin"
                                onChange={handleDate}
                                text="Fecha Fin"
                                value={localFilters.fechaFin ? moment(localFilters.fechaFin).format('DD/MM/YYYY') : ''}
                            />
                        </div>
                        {isAdmin && esPrincipal && (
                            <div>
                                <Select
                                    error=""
                                    label="Sede"
                                    name="sedeId"
                                    defaultValue="Todas las sedes"
                                    onChange={(id: any, _value: string) =>
                                        setLocalFilters(prev => ({ ...prev, sedeId: id === 0 ? null : Number(id) }))
                                    }
                                    options={sedesOptions}
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-4 justify-end">
                        <Button onClick={applyFilters} color="primary">
                            <Icon icon="solar:filter-bold-duotone" className="mr-2 text-lg" />
                            Filtrar
                        </Button>
                        <Button onClick={resetFilters} color="secondary" outline>
                            <Icon icon="solar:restart-bold-duotone" className="mr-2 text-lg" />
                            Limpiar
                        </Button>
                        <Button
                            onClick={handleExport}
                            fill
                            style={{ backgroundColor: '#079669', color: '#ECFEF6' }}
                            disabled={exporting}
                        >
                            {exporting
                                ? <Icon icon="eos-icons:loading" className="mr-2" />
                                : <Icon icon="solar:file-download-bold-duotone" className="mr-2 text-xl" />
                            }
                            {exporting ? 'Exportando...' : 'Exportar Excel'}
                        </Button>
                    </div>
                </div>

                {/* Table Content */}
                <div className="p-4 relative z-0">
                    <div className="overflow-x-auto">
                        <DataTable
                            headerColumns={movementColumns}
                            bodyData={movementData}
                        />
                    </div>

                    {pagination && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
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
                        </div>
                    )}
                </div>
            </div>

            <ModalEditarGasto
                egreso={egresoEditar}
                isOpen={!!egresoEditar}
                onClose={() => setEgresoEditar(null)}
                onSuccess={() => obtenerHistorialCaja(page, limit)}
            />

            <ModalConfirm
                isOpenModal={!!egresoEliminarId}
                setIsOpenModal={(v) => { if (!v) setEgresoEliminarId(null); }}
                title="Eliminar gasto"
                information="¿Seguro que quieres eliminar este gasto? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                confirmLoading={loadingEliminar}
                confirmSubmit={async () => {
                    if (!egresoEliminarId) return;
                    setLoadingEliminar(true);
                    await eliminarEgreso(egresoEliminarId);
                    setLoadingEliminar(false);
                    setEgresoEliminarId(null);
                    obtenerHistorialCaja(page, limit);
                }}
            />
        </div>
    );
};

export default CajaHistorial;
