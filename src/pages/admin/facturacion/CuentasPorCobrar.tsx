import { useEffect, useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { NavLink } from 'react-router-dom';
import moment from 'moment';
import DataTable from '../../../components/Datatable';
import Pagination from '../../../components/Pagination';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import { Calendar } from '../../../components/Date';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagosStore } from '@/zustand/pagos';
import ModalRegistrarPago from './ModalRegistrarPago';
import ModalHistorialPagos from './ModalHistorialPagos';
import ModalDetalleCuenta from './ModalDetalleCuenta';

const CuentasPorCobrar = () => {
    const { getCuentasPorCobrar, cuentasPorCobrar, totalCuentasPorCobrar, loadingCuentas } = usePagosStore();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [searchTerm, setSearchTerm] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [estadoPago, setEstadoPago] = useState('');
    const [clienteFilter, setClienteFilter] = useState('');
    const [selectedComprobante, setSelectedComprobante] = useState<any>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showHistorialModal, setShowHistorialModal] = useState(false);
    const [showDetalleModal, setShowDetalleModal] = useState(false);

    const debounce = useDebounce(searchTerm, 500);

    const tabs = [
        { label: 'Historial de Pagos', to: '/administrador/pagos', icon: 'solar:wallet-money-bold-duotone' },
        { label: 'Cuentas por Cobrar', to: '/administrador/pagos/cuentas-cobrar', icon: 'solar:bill-list-bold-duotone' },
    ];

    useEffect(() => {
        const params: any = {
            page: currentPage,
            limit: itemsPerPage,
            search: debounce,
        };
        if (estadoPago) params.estadoPago = estadoPago;
        if (fechaInicio) params.fechaInicio = fechaInicio;
        if (fechaFin) params.fechaFin = fechaFin;
        getCuentasPorCobrar(params);
    }, [debounce, currentPage, itemsPerPage, fechaInicio, fechaFin, estadoPago]);

    // Ya vienen filtrados del store
    const pendientes = cuentasPorCobrar;

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const pages = Array.from(
        { length: Math.ceil((pendientes?.length || 0) / itemsPerPage) },
        (_, i) => i + 1
    );

    const calcularDiasVencidos = (fechaEmision: string) => {
        const emision = moment(fechaEmision);
        const hoy = moment();
        return hoy.diff(emision, 'days');
    };

    const tableData = pendientes?.map((inv: any) => {
        const diasVencidos = calcularDiasVencidos(inv.fechaEmision);
        const tipoLabel = inv.tipoDoc === 'NP' ? 'NOTA PEDIDO' : inv.tipoDoc === 'OT' ? 'ORDEN TRABAJO' : inv.comprobante || inv.tipoDoc;

        // Mapear estado de pago a etiqueta clara
        let estadoLabel = 'PENDIENTE';
        if (inv.estadoPago === 'PAGO_PARCIAL') estadoLabel = 'PAGO PARCIAL';
        else if (inv.estadoPago === 'PENDIENTE_PAGO') estadoLabel = 'PENDIENTE DE PAGO';
        else if (inv.estadoPago) estadoLabel = inv.estadoPago;

        return {
            id: inv.id,
            fecha: moment(inv.fechaEmision).format('DD/MM/YYYY'),
            comprobante: `${inv.serie}-${String(inv.correlativo).padStart(8, '0')}`,
            tipoDocumento: tipoLabel,
            cliente: inv.cliente?.nombre || 'Sin cliente',
            rucDni: inv.cliente?.nroDoc || '-',
            total: `S/ ${Number(inv.mtoImpVenta || 0).toFixed(2)}`,
            saldo: `S/ ${Number(inv.saldo || 0).toFixed(2)}`,
            dias: diasVencidos,
            estadoCobro: estadoLabel,
            _raw: inv,
        };
    }) || [];

    const handleRegistrarPago = (row: any) => {
        setSelectedComprobante(row._raw);
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        setSelectedComprobante(null);
        // Recargar lista usando el store
        getCuentasPorCobrar({
            page: currentPage,
            limit: itemsPerPage,
            estadoPago: estadoPago || undefined,
        });
    };

    const handleVerHistorial = (row: any) => {
        setSelectedComprobante(row._raw);
        setShowHistorialModal(true);
    };

    const handleVerDetalle = (row: any) => {
        setSelectedComprobante(row._raw);
        setShowDetalleModal(true);
    };

    // Obtener lista única de clientes para el filtro
    const clienteOptions = useMemo(() => {
        const clientes = new Map();
        cuentasPorCobrar?.forEach((inv: any) => {
            if (inv.cliente?.id && !clientes.has(inv.cliente.id)) {
                clientes.set(inv.cliente.id, {
                    id: inv.cliente.id,
                    value: inv.cliente.nombre || 'Sin nombre',
                });
            }
        });
        return [{ id: '', value: 'Todos los clientes' }, ...Array.from(clientes.values())];
    }, [cuentasPorCobrar]);

    // Filtrar por cliente si está seleccionado
    const pendientesFiltrados = useMemo(() => {
        if (!clienteFilter) return pendientes;
        return pendientes?.filter((inv: any) => inv.cliente?.id === Number(clienteFilter));
    }, [pendientes, clienteFilter]);

    const actions = [
        {
            onClick: handleVerDetalle,
            className: 'detail',
            icon: <Icon icon="solar:document-text-bold-duotone" width="20" height="20" color="#8b5cf6" />,
            tooltip: 'Ver Detalle',
        },
        {
            onClick: handleVerHistorial,
            className: 'history',
            icon: <Icon icon="solar:history-bold-duotone" width="20" height="20" color="#6366f1" />,
            tooltip: 'Ver Historial',
        },
        {
            onClick: handleRegistrarPago,
            className: 'payment',
            icon: <Icon icon="solar:hand-money-bold-duotone" width="20" height="20" color="#10b981" />,
            tooltip: 'Registrar Pago',
        },
    ];

    const handleDate = (date: string, name: string) => {
        if (!moment(date, 'DD/MM/YYYY', true).isValid()) return;
        if (name === 'fechaInicio') {
            setFechaInicio(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'));
        } else if (name === 'fechaFin') {
            setFechaFin(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'));
        }
    };

    return (
        <div className="min-h-screen px-2 pb-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Pagos</h1>
                    <p className="text-sm text-gray-500 mt-1">Administra cobros y cuentas pendientes</p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-2 mb-4">
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        end={tab.to === '/administrador/pagos'}
                        className={({ isActive }) =>
                            `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`
                        }
                    >
                        <Icon icon={tab.icon} className="text-lg" />
                        {tab.label}
                    </NavLink>
                ))}
            </div>

            {/* Main Content Card */}
            <div className="bg-white relative z-0 rounded-2xl shadow-sm border border-gray-100">
                {/* Stats Row */}
                <div className="p-5 relative border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Icon icon="solar:bill-list-bold-duotone" className="text-blue-600 text-2xl" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Comprobantes Pendientes</p>
                                <p className="text-xl font-bold text-gray-900">{pendientes?.length || 0}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                <Icon icon="solar:money-bag-bold-duotone" className="text-red-600 text-2xl" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total por Cobrar</p>
                                <p className="text-xl font-bold text-gray-900">
                                    S/ {pendientes?.reduce((sum: number, inv: any) => sum + (inv.saldo || 0), 0).toFixed(2) || '0.00'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                <Icon icon="solar:calendar-bold-duotone" className="text-yellow-600 text-2xl" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Vencidos (+30 días)</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {pendientes?.filter((inv: any) => calcularDiasVencidos(inv.fechaEmision) > 30).length || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="p-5 relative z-0 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <Icon icon="solar:filter-bold-duotone" className="text-blue-600 text-xl" />
                        <h3 className="font-semibold text-gray-800">Filtros</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="lg:col-span-1">
                            <InputPro
                                name="search"
                                onChange={(e: any) => setSearchTerm(e.target.value)}
                                label="Buscar cliente o comprobante"
                                isLabel
                            />
                        </div>
                        <div>
                            <Select
                                error=""
                                label="Cliente"
                                name="clienteFilter"
                                onChange={(id: any, value: string) => setClienteFilter(id)}
                                options={clienteOptions}
                            />
                        </div>
                        <div>
                            <Calendar text="Desde" name="fechaInicio" onChange={handleDate} />
                        </div>
                        <div>
                            <Calendar text="Hasta" name="fechaFin" onChange={handleDate} />
                        </div>
                        <div>
                            <Select
                                error=""
                                label="Estado"
                                name="estadoPago"
                                onChange={(id: any, value: string) => setEstadoPago(value === 'TODOS' ? '' : value)}
                                options={[
                                    { value: 'TODOS', label: 'Todos' },
                                    { value: 'PENDIENTE_PAGO', label: 'Pendiente' },
                                    { value: 'PAGO_PARCIAL', label: 'Pago Parcial' },
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="p-4">
                    {tableData.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <DataTable
                                    actions={actions}
                                    bodyData={tableData}
                                    headerColumns={[
                                        { label: 'Fecha', key: 'fecha' },
                                        { label: 'Comprobante', key: 'comprobante' },
                                        { label: 'Tipo', key: 'tipoDocumento' },
                                        { label: 'Cliente', key: 'cliente' },
                                        { label: 'RUC/DNI', key: 'rucDni' },
                                        { label: 'Total', key: 'total' },
                                        { label: 'Saldo', key: 'saldo' },
                                        { label: 'Días', key: 'dias' },
                                        { label: 'Estado', key: 'estadoCobro' },
                                    ]}
                                />
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <Pagination
                                    data={tableData}
                                    optionSelect
                                    currentPage={currentPage}
                                    indexOfFirstItem={indexOfFirstItem}
                                    indexOfLastItem={indexOfLastItem}
                                    setcurrentPage={setCurrentPage}
                                    setitemsPerPage={setItemsPerPage}
                                    pages={pages}
                                    total={pendientes?.length || 0}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="py-12 text-center">
                            <Icon icon="solar:check-circle-bold-duotone" className="text-5xl text-green-400 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">¡No hay cuentas pendientes!</p>
                            <p className="text-sm text-gray-400 mt-1">Todos los comprobantes están al día</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Registrar Pago */}
            {showPaymentModal && selectedComprobante && (
                <ModalRegistrarPago
                    comprobante={selectedComprobante}
                    onClose={() => {
                        setShowPaymentModal(false);
                        setSelectedComprobante(null);
                    }}
                    onSuccess={handlePaymentSuccess}
                />
            )}

            {/* Modal Historial de Pagos */}
            {showHistorialModal && selectedComprobante && (
                <ModalHistorialPagos
                    comprobante={selectedComprobante}
                    onClose={() => {
                        setShowHistorialModal(false);
                        setSelectedComprobante(null);
                    }}
                />
            )}

            {/* Modal Detalle de Cuenta por Cobrar */}
            {showDetalleModal && selectedComprobante && (
                <ModalDetalleCuenta
                    comprobante={selectedComprobante}
                    onClose={() => {
                        setShowDetalleModal(false);
                        setSelectedComprobante(null);
                    }}
                />
            )}
        </div>
    );
};

export default CuentasPorCobrar;
