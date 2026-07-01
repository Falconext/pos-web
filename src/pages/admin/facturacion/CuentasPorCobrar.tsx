import { useEffect, useState, useMemo, useRef } from 'react';
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
import ModalConfirm from '../../../components/ModalConfirm';
import TableActionMenu from "@/components/TableActionMenu";
import { useReactToPrint } from "react-to-print";
import { useInvoiceStore } from '@/zustand/invoices';
import { useAuthStore } from '@/zustand/auth';
import ComprobantePrintPage from "./comprobanteImprimir";
import { buildComprobantePrintPageStyle } from "@/utils/printStyles";

const CuentasPorCobrar = () => {
    const { getCuentasPorCobrar, cuentasPorCobrar, totalCuentasPorCobrar, loadingCuentas } = usePagosStore();
    const { getInvoice, invoice } = useInvoiceStore();
    const { auth } = useAuthStore();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [searchTerm, setSearchTerm] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [estadoPago, setEstadoPago] = useState('');
    const [clienteFilter, setClienteFilter] = useState('');
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [selectedComprobante, setSelectedComprobante] = useState<any>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showHistorialModal, setShowHistorialModal] = useState(false);
    const [showDetalleModal, setShowDetalleModal] = useState(false);
    const [showNoPhoneModal, setShowNoPhoneModal] = useState(false);
    const [noPhoneClientName, setNoPhoneClientName] = useState('');
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedMenuRow, setSelectedMenuRow] = useState<any>(null);
    const [shouldPrint, setShouldPrint] = useState(false);
    const componentRef = useRef(null);

    const printFn = useReactToPrint({
        // @ts-ignore
        contentRef: componentRef,
        pageStyle: buildComprobantePrintPageStyle({ width: 80, height: 330 }),
    });

    useEffect(() => {
        if (!invoice) return;
        if (shouldPrint && invoice) {
            const timer = setTimeout(() => {
                printFn();
                setShouldPrint(false);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [invoice, shouldPrint]);

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

        const rowBase = {
            id: inv.id,
            fecha: moment(inv.fechaEmision).format('DD/MM/YYYY'),
            comprobante: `${inv.serie}-${String(inv.correlativo).padStart(8, '0')}`.toUpperCase(),
            tipoDocumento: tipoLabel,
            cliente: inv.cliente?.nombre || 'Sin cliente',
            rucDni: inv.cliente?.nroDoc || '-',
            total: `S/ ${Number(inv.mtoImpVenta || 0).toFixed(2)}`,
            saldo: `S/ ${Number(inv.saldo || 0).toFixed(2)}`,
            dias: diasVencidos,
            estadoCobro: estadoLabel,
            celular: inv.cliente?.telefono || '-',
            _raw: inv,
        };

        const acciones = (
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); setSelectedMenuRow(rowBase); }}
                className="px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
                <Icon icon="mdi:dots-vertical" width={18} height={18} />
            </button>
        );

        return { ...rowBase, acciones };
    }) || [];

    const handleCloseMenu = () => {
        setMenuAnchor(null);
        setSelectedMenuRow(null);
    };

    const handleGenerarOrdenDePago = async () => {
        if (selectedMenuRow) {
            setShouldPrint(true);
            await getInvoice(selectedMenuRow.id);
            handleCloseMenu();
        }
    };

    const handleRegistrarPago = () => {
        if (selectedMenuRow) {
            setSelectedComprobante(selectedMenuRow._raw);
            setShowPaymentModal(true);
            handleCloseMenu();
        }
    };

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        setSelectedComprobante(null);
        getCuentasPorCobrar({
            page: currentPage,
            limit: itemsPerPage,
            search: debounce || undefined,
            estadoPago: estadoPago || undefined,
            fechaInicio: fechaInicio || undefined,
            fechaFin: fechaFin || undefined,
        });
    };

    const handleVerHistorial = () => {
        if (selectedMenuRow) {
            setSelectedComprobante(selectedMenuRow._raw);
            setShowHistorialModal(true);
            handleCloseMenu();
        }
    };

    const handleVerDetalle = () => {
        if (selectedMenuRow) {
            setSelectedComprobante(selectedMenuRow._raw);
            setShowDetalleModal(true);
            handleCloseMenu();
        }
    };

    const handleWhatsApp = () => {
        if (selectedMenuRow) {
            const row = selectedMenuRow;
            const phone = row._raw.cliente?.telefono;
            if (!phone || phone === '-') {
                setNoPhoneClientName(row.cliente);
                setShowNoPhoneModal(true);
                handleCloseMenu();
                return;
            }
            const message = `Estimado(a) ${row.cliente}, le escribimos para recordarle cordialmente que tiene una cuenta pendiente de pago correspondiente al comprobante ${row.comprobante}. El saldo actual es de ${row.saldo}. Agradeceremos pueda regularizar este pago a la brevedad posible. Quedamos a su disposición por cualquier consulta.`;
            const whatsappUrl = `https://wa.me/51${phone.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
            handleCloseMenu();
        }
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

    const handleDate = (date: string, name: string) => {
        if (!moment(date, 'DD/MM/YYYY', true).isValid()) return;
        if (name === 'fechaInicio') {
            setFechaInicio(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'));
        } else if (name === 'fechaFin') {
            setFechaFin(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'));
        }
    };

    const activeFilterCount = [
        searchTerm.trim(),
        clienteFilter,
        fechaInicio,
        fechaFin,
        estadoPago,
    ].filter(Boolean).length;

    return (
        <div className="min-h-screen px-2 pb-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Gestión de Pagos</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Administra cobros y cuentas pendientes</p>
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
                                : 'bg-white dark:bg-[#111827] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800'
                            }`
                        }
                    >
                        <Icon icon={tab.icon} className="text-lg" />
                        {tab.label}
                    </NavLink>
                ))}
            </div>

            {/* Main Content Card */}
            <div className="bg-white dark:bg-[#111827] relative z-0 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                {/* Stats Row */}
                <div className="p-5 relative border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        {/* KPI 1 */}
                        <div className="bg-white dark:bg-[#0A0D14] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between group hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-violet-600 dark:text-violet-400 text-[13px] font-bold tracking-wide uppercase">Comprobantes Pendientes</h3>
                                <div className="w-10 h-10 rounded-[14px] bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/20 group-hover:-translate-y-1 transition-transform">
                                    <Icon icon="solar:bill-list-bold-duotone" className="text-xl" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-[28px] leading-none font-extrabold text-gray-900 dark:text-white mb-2">{pendientes?.length || 0}</h2>
                                <div className="flex items-center gap-1.5 opacity-0">
                                    <span className="text-gray-400 text-xs font-medium">.</span>
                                </div>
                            </div>
                        </div>

                        {/* KPI 2 */}
                        <div className="bg-white dark:bg-[#0A0D14] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between group hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-blue-500 dark:text-blue-400 text-[13px] font-bold tracking-wide uppercase">Total por Cobrar</h3>
                                <div className="w-10 h-10 rounded-[14px] bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20 group-hover:-translate-y-1 transition-transform">
                                    <Icon icon="solar:money-bag-bold-duotone" className="text-xl" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-[28px] leading-none font-extrabold text-gray-900 dark:text-white mb-2">S/ {pendientes?.reduce((sum: number, inv: any) => sum + (inv.saldo || 0), 0).toFixed(2) || '0.00'}</h2>
                                <div className="flex items-center gap-1.5 opacity-0">
                                    <span className="text-gray-400 text-xs font-medium">.</span>
                                </div>
                            </div>
                        </div>

                        {/* KPI 3 */}
                        <div className="bg-white dark:bg-[#0A0D14] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between group hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-amber-500 dark:text-amber-400 text-[13px] font-bold tracking-wide uppercase">Vencidos (+30 días)</h3>
                                <div className="w-10 h-10 rounded-[14px] bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200 dark:shadow-amber-900/20 group-hover:-translate-y-1 transition-transform">
                                    <Icon icon="solar:calendar-bold-duotone" className="text-xl" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-[28px] leading-none font-extrabold text-gray-900 dark:text-white mb-2">{pendientes?.filter((inv: any) => calcularDiasVencidos(inv.fechaEmision) > 30).length || 0}</h2>
                                <div className="flex items-center gap-1.5 opacity-0">
                                    <span className="text-gray-400 text-xs font-medium">.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="relative z-0 border-b border-gray-100 p-4 dark:border-slate-800 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                            <Icon icon="solar:filter-bold-duotone" className="text-xl text-blue-600 dark:text-blue-400" />
                            <div className="min-w-0">
                                <h3 className="font-semibold text-gray-800 dark:text-white">Filtros</h3>
                                <p className="truncate text-xs text-gray-400 md:hidden">{activeFilterCount} activos</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsMobileFiltersOpen((value) => !value)}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-black text-white shadow-lg shadow-blue-500/20 md:hidden"
                        >
                            {isMobileFiltersOpen ? 'Ocultar' : 'Ver filtros'}
                            <Icon icon={isMobileFiltersOpen ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'} className="text-base" />
                        </button>
                    </div>
                    <div className={`${isMobileFiltersOpen ? 'grid' : 'hidden'} grid-cols-1 gap-4 md:grid md:grid-cols-2 lg:grid-cols-5`}>
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
                            <Calendar text="Desde" name="fechaInicio" onChange={handleDate} className="admin-date-filter" portal />
                        </div>
                        <div>
                            <Calendar text="Hasta" name="fechaFin" onChange={handleDate} className="admin-date-filter" portal />
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
                                    bodyData={tableData}
                                    headerColumns={[
                                        { label: 'Fecha', key: 'fecha' },
                                        { label: 'Comprobante', key: 'comprobante' },
                                        { label: 'Tipo', key: 'tipoDocumento' },
                                        { label: 'Cliente', key: 'cliente' },
                                        { label: 'RUC/DNI', key: 'rucDni' },
                                        { label: 'Celular', key: 'celular' },
                                        { label: 'Total', key: 'total' },
                                        { label: 'Saldo', key: 'saldo' },
                                        { label: 'Días', key: 'dias' },
                                        { label: 'Estado', key: 'estadoCobro' },
                                        { label: 'Acciones', key: 'acciones' }
                                    ]}
                                />
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
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
                            <Icon icon="solar:check-circle-bold-duotone" className="text-5xl text-green-400 dark:text-green-500/50 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-300 font-medium">¡No hay cuentas pendientes!</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Todos los comprobantes están al día</p>
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

            {/* Dropdown de acciones (TableActionMenu) */}
            <TableActionMenu
                isOpen={Boolean(menuAnchor)}
                anchorEl={menuAnchor}
                onClose={handleCloseMenu}
                className="w-44"
            >
                {selectedMenuRow && (
                    <>
                        <button onClick={handleVerDetalle} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-700 transition-colors">
                            <Icon icon="solar:document-text-bold-duotone" width={16} height={16} color="#8b5cf6" />
                            <span>Ver Detalle</span>
                        </button>
                        <button onClick={handleVerHistorial} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-700 transition-colors">
                            <Icon icon="solar:history-bold-duotone" width={16} height={16} color="#6366f1" />
                            <span>Ver Historial</span>
                        </button>
                        <button onClick={handleRegistrarPago} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-700 transition-colors">
                            <Icon icon="solar:hand-money-bold-duotone" width={16} height={16} color="#10b981" />
                            <span>Registrar Pago</span>
                        </button>
                        <button onClick={handleWhatsApp} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-700 transition-colors">
                            <Icon icon="ic:baseline-whatsapp" width={16} height={16} color="#25D366" />
                            <span>WhatsApp</span>
                        </button>
                        <hr className="my-1 border-gray-100 dark:border-slate-800" />
                        <button onClick={handleGenerarOrdenDePago} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950/30 transition-colors">
                            <Icon icon="solar:printer-minimalistic-bold-duotone" width={16} height={16} />
                            <span>Generar orden de pago</span>
                        </button>
                    </>
                )}
            </TableActionMenu>

            <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', visibility: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
                <ComprobantePrintPage
                    id="print-root"
                    company={auth}
                    componentRef={componentRef}
                    formValues={{
                        ...invoice,
                        fechaVencimientoCredito: invoice?.fechaVencimientoCredito || invoice?.fechaVencimiento || (invoice?.cuotas?.length > 0 ? invoice.cuotas[0].fechaVencimiento : null)
                    }}
                    size="TICKET"
                    serie={invoice?.serie}
                    correlative={invoice?.correlativo}
                    productsInvoice={invoice?.detalles}
                    total={Number(invoice?.mtoImpVenta || 0).toFixed(2)}
                    mode="off"
                    discount={invoice?.discount}
                    receipt="ORDEN DE PAGO"
                    selectedClient={invoice?.cliente}
                />
            </div>


            {/* Modal de Información - Sin Teléfono */}
            <ModalConfirm
                isOpenModal={showNoPhoneModal}
                setIsOpenModal={setShowNoPhoneModal}
                title="Información"
                information={`El cliente ${noPhoneClientName} no tiene un número de celular registrado en el sistema. No es posible enviar un mensaje de WhatsApp.`}
                confirmText="Entendido"
                confirmSubmit={() => setShowNoPhoneModal(false)}
            />
        </div>
    );
};

export default CuentasPorCobrar;
