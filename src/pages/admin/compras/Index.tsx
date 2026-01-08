"use client";
import { useEffect, useState } from "react";
import InputPro from "@/components/InputPro";
import DataTable from "@/components/Datatable";
import { Icon } from "@iconify/react";
import Pagination from "@/components/Pagination";
import { useComprasStore, ICompra } from "@/zustand/compras";
import { useDebounce } from "@/hooks/useDebounce";
import Button from "@/components/Button";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
import ModalDetalleCompra from "./ModalDetalleCompra";
import ModalRegistrarPagoCompra from "./ModalRegistrarPagoCompra";
import ModalHistorialPagosCompra from "./ModalHistorialPagosCompra";
import Select from '@/components/Select';
import { Calendar } from '../../../components/Date';

const ComprasIndex = () => {
    const { listarCompras, compras, totalCompras } = useComprasStore();
    const navigate = useNavigate();

    // Modal state
    const [isOpenDetalle, setIsOpenDetalle] = useState(false);
    const [selectedCompraId, setSelectedCompraId] = useState<number | null>(null);
    const [selectedCompra, setSelectedCompra] = useState<any>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showHistorialModal, setShowHistorialModal] = useState(false);

    const [currentPage, setcurrentPage] = useState(1);
    const [itemsPerPage, setitemsPerPage] = useState(50);
    const [search, setSearch] = useState("");
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [estadoPago, setEstadoPago] = useState('TODOS');

    const debounce = useDebounce(search, 600);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const pages = Array.from(
        { length: Math.ceil((totalCompras || 0) / itemsPerPage) },
        (_, i) => i + 1
    );

    useEffect(() => {
        const params: any = {
            page: currentPage,
            limit: itemsPerPage,
            search: debounce,
            estadoPago: estadoPago === 'TODOS' ? undefined : estadoPago
        };

        if (fechaInicio) params.fechaInicio = fechaInicio;
        if (fechaFin) params.fechaFin = fechaFin;

        listarCompras(params);
    }, [debounce, currentPage, itemsPerPage, estadoPago, fechaInicio, fechaFin]);

    const calcularDiasVencidos = (fechaVencimiento: string | undefined, fechaEmision: string) => {
        const targetDate = fechaVencimiento ? moment(fechaVencimiento) : moment(fechaEmision);
        const hoy = moment();
        return hoy.diff(targetDate, 'days');
    };

    const tableData = compras?.map((item: ICompra) => {
        const diasVencidos = calcularDiasVencidos(item.fechaVencimiento, item.fechaEmision);
        let estadoLabel = 'PENDIENTE';
        switch (item.estadoPago) {
            case 'PAGO_PARCIAL': estadoLabel = 'PAGO PARCIAL'; break;
            case 'PENDIENTE_PAGO': estadoLabel = 'PENDIENTE DE PAGO'; break; // Fixed label consistency
            case 'COMPLETADO': estadoLabel = 'PAGADO'; break;
            default: estadoLabel = item.estadoPago;
        }

        return {
            id: item.id,
            'Fecha': moment(item.fechaEmision).format('DD/MM/YYYY'),
            'Proveedor': item.proveedor?.nombre || item.proveedor?.nroDoc || 'Sin nombre',
            'Comprobante': `${item.serie}-${item.numero}`,
            'Total': `S/ ${Number(item.total).toFixed(2)}`,
            'Saldo': `S/ ${Number(item.saldo || 0).toFixed(2)}`,
            'Días Venc.': diasVencidos > 0 ? diasVencidos : 0,
            'Estado': item.estado, // REGISTRADO/ANULADO
            'Pago': estadoLabel,
            _raw: item
        };
    });

    const handleRegistrarPago = (row: any) => {
        setSelectedCompra(row._raw);
        setShowPaymentModal(true);
    };

    const handleVerHistorial = (row: any) => {
        setSelectedCompra(row._raw);
        setShowHistorialModal(true);
    };

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        setSelectedCompra(null);
        // Refresh
        const params: any = {
            page: currentPage,
            limit: itemsPerPage,
            search: debounce,
            estadoPago: estadoPago === 'TODOS' ? undefined : estadoPago
        };
        if (fechaInicio) params.fechaInicio = fechaInicio;
        if (fechaFin) params.fechaFin = fechaFin;
        listarCompras(params);
    };

    const handleDate = (date: string, name: string) => {
        if (!moment(date, 'DD/MM/YYYY', true).isValid()) return;
        if (name === 'fechaInicio') {
            setFechaInicio(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'));
        } else if (name === 'fechaFin') {
            setFechaFin(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'));
        }
    };

    const actions = [
        {
            icon: <Icon icon="solar:history-bold-duotone" width="20" height="20" color="#6366f1" />,
            tooltip: 'Ver Historial',
            className: 'history',
            onClick: handleVerHistorial,
        },
        {
            icon: <Icon icon="solar:hand-money-bold-duotone" width="20" height="20" color="#10b981" />,
            tooltip: 'Registrar Pago',
            className: 'payment',
            onClick: handleRegistrarPago,
            hide: (row: any) => row._raw.estadoPago === 'COMPLETADO'
        },
        {
            icon: <Icon icon="solar:eye-bold" />,
            tooltip: 'Ver detalle',
            className: 'edit',
            onClick: (row: any) => {
                setSelectedCompraId(row.id);
                setIsOpenDetalle(true);
            }
        },
    ];

    const visibleColumns = [
        'Fecha',
        'Comprobante',
        'Proveedor',
        'Total',
        'Saldo',
        'Días Venc.',
        'Pago'
    ];

    // Calculate Stats from current view (approximate as it uses pagination, ideally backend should respond with stats)
    // For now, consistent with previous implementation
    const pendientes = compras;
    const totalPorPagar = pendientes?.reduce((sum: number, item: any) => sum + Number(item.saldo || 0), 0) || 0;
    const totalVencidos = pendientes?.filter((item: any) => calcularDiasVencidos(item.fechaVencimiento, item.fechaEmision) > 0).length || 0;

    return (
        <div className="min-h-screen px-2 pb-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cuentas por Pagar / Compras</h1>
                    <p className="text-sm text-gray-500 mt-1">Gestión de compras y pagos a proveedores</p>
                </div>
                <Link to="/administrador/compras/nuevo">
                    <Button color="secondary" className="flex items-center gap-2">
                        <Icon icon="solar:cart-plus-bold" className="text-lg" />
                        Nueva Compra
                    </Button>
                </Link>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Stats Row */}
                <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Icon icon="solar:bill-list-bold-duotone" className="text-blue-600 text-2xl" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Facturas (Vista)</p>
                                <p className="text-xl font-bold text-gray-900">{totalCompras || 0}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                <Icon icon="solar:money-bag-bold-duotone" className="text-red-600 text-2xl" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Saldo por Pagar</p>
                                <p className="text-xl font-bold text-gray-900">
                                    S/ {totalPorPagar.toFixed(2)}
                                    <span className="text-xs font-normal text-gray-500 block">(Página actual)</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                <Icon icon="solar:calendar-bold-duotone" className="text-yellow-600 text-2xl" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Vencidos (+1 día)</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {totalVencidos}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="p-5 border-b border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-1">
                            <InputPro
                                name="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                label="Buscar por documento o proveedor"
                                isLabel
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
                                label="Estado Pago"
                                name="estadoPago"
                                defaultValue="TODOS"
                                onChange={(id: any, value: string) => setEstadoPago(value)}
                                options={[
                                    { value: 'TODOS', label: 'Todos' },
                                    { value: 'PENDIENTE_PAGO', label: 'Pendiente' },
                                    { value: 'PAGO_PARCIAL', label: 'Pago Parcial' },
                                    { value: 'COMPLETADO', label: 'Pagado' },
                                ]}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4">
                    {tableData?.length > 0 ? (
                        <>
                            <div className="overflow-hidden overflow-x-auto">
                                <DataTable
                                    bodyData={tableData}
                                    headerColumns={visibleColumns}
                                    actions={actions}
                                />
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <Pagination
                                    data={tableData}
                                    optionSelect
                                    currentPage={currentPage}
                                    indexOfFirstItem={indexOfFirstItem}
                                    indexOfLastItem={indexOfLastItem}
                                    setcurrentPage={setcurrentPage}
                                    setitemsPerPage={setitemsPerPage}
                                    pages={pages}
                                    total={totalCompras}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="py-12 text-center">
                            <Icon icon="solar:cart-large-minimalistic-linear" className="text-5xl text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No se encontraron compras</p>
                        </div>
                    )}
                </div>
            </div>

            <ModalDetalleCompra
                isOpen={isOpenDetalle}
                onClose={() => {
                    setIsOpenDetalle(false);
                    setSelectedCompraId(null);
                }}
                compraId={selectedCompraId}
            />

            {showPaymentModal && selectedCompra && (
                <ModalRegistrarPagoCompra
                    compra={selectedCompra}
                    onClose={() => {
                        setShowPaymentModal(false);
                        setSelectedCompra(null);
                    }}
                    onSuccess={handlePaymentSuccess}
                />
            )}

            {showHistorialModal && selectedCompra && (
                <ModalHistorialPagosCompra
                    compra={selectedCompra}
                    onClose={() => {
                        setShowHistorialModal(false);
                        setSelectedCompra(null);
                    }}
                />
            )}
        </div >
    );
}

export default ComprasIndex;
