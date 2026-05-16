import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import moment from "moment";
import Button from "@/components/Button";
import InputPro from "@/components/InputPro";
import { Calendar } from "@/components/Date";
import DataTable from "@/components/Datatable";
import TableActionMenu from "@/components/TableActionMenu";
import { useGuiaRemisionStore } from "@/zustand/guia-remision";
import useAlertStore from "@/zustand/alert";
import { useDebounce } from "@/hooks/useDebounce";
import ModalGuiaRemision from "./components/ModalGuiaRemision";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import GuiaRemisionPrint from "./print/GuiaRemisionPrint";
import { useAuthStore } from "@/zustand/auth";
import { useSedesStore } from "@/zustand/sedes";
import Select from "@/components/Select";
import apiClient from "@/utils/apiClient";
import ModalConfirm from "@/components/ModalConfirm";

const MOTIVOS_TRASLADO: Record<string, string> = {
    "01": "VENTA",
    "02": "COMPRA",
    "03": "CONSIGNACIÓN",
    "04": "DEVOLUCIÓN",
    "05": "TRASLADO ENTRE ESTABLECIMIENTOS DE LA MISMA EMPRESA",
    "06": "TRASLADO PARA EXPORTACIÓN",
    "07": "VENTA CON ENTREGA A TERCEROS",
    "08": "VENTA SUJETA A CONFIRMACIÓN DEL COMPRADOR",
    "09": "TRASLADO DE BIENES PARA TRANSFORMACIÓN",
    "13": "OTROS",
};

const GuiaRemision = () => {
    const navigate = useNavigate();
    const { getAllGuiasRemision, guiasRemision, enviarSunat, deleteGuiaRemision, downloadPdf } = useGuiaRemisionStore();
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Menu Action State
    const [menuOpen, setMenuOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedRow, setSelectedRow] = useState<any>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [guiaToEdit, setGuiaToEdit] = useState<any>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false);
    const [isProcessingSend, setIsProcessingSend] = useState(false);
    const [isProcessingDelete, setIsProcessingDelete] = useState(false);

    // Print State
    const [guiaToPrint, setGuiaToPrint] = useState<any>(null);
    const componentRef = useRef(null);
    const { auth } = useAuthStore();

    const handlePrintReact = useReactToPrint({
        // @ts-ignore
        contentRef: componentRef,
        pageStyle: `@media print { @page { size: 210mm 297mm; margin: 0; } body { margin: 0; width: 210mm; } }`,
    });

    const handlePrint = (guia: any) => {
        handleCloseMenu();
        setGuiaToPrint(guia);
        // Allow time for state update and render
        setTimeout(() => {
            handlePrintReact();
        }, 100);
    };

    const { sedes, listarSedes } = useSedesStore();
    const isAdmin = auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'ADMIN_SISTEMA';

    const sedesOptions = [
        { id: 0, value: "Todas las sedes" },
        ...sedes.map(s => ({ id: s.id, value: s.esPrincipal ? `${s.nombre}` : s.nombre }))
    ];

    // Filtros
    const [fechaInicio, setFechaInicio] = useState(moment().format('YYYY-MM-DD'));
    const [fechaFin, setFechaFin] = useState(moment().format('YYYY-MM-DD'));
    const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null);

    useEffect(() => {
        if (isAdmin) listarSedes();
    }, [isAdmin]);

    useEffect(() => {
        getAllGuiasRemision({
            search: debouncedSearchTerm,
            fechaInicio,
            fechaFin,
            ...(isAdmin && selectedSedeId ? { sedeId: selectedSedeId } : {}),
        });
    }, [debouncedSearchTerm, fechaInicio, fechaFin, selectedSedeId]);

    const handleSearch = (e: any) => {
        setSearchTerm(e.target.value);
    };

    const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>, row: any) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setSelectedRow(row);
        setMenuOpen(true);
    };

    const handleCloseMenu = (clearSelection = true) => {
        setMenuOpen(false);
        setAnchorEl(null);
        if (clearSelection) {
            setSelectedRow(null);
        }
    };

    const handleEnviarSunat = async () => {
        if (!selectedRow) return;
        handleCloseMenu(false);
        setIsSendConfirmOpen(true);
    };

    const handleEliminar = async () => {
        if (!selectedRow) return;
        handleCloseMenu(false);
        setIsDeleteConfirmOpen(true);
    };

    const confirmEnviarSunat = async () => {
        if (!selectedRow) return;
        setIsSendConfirmOpen(false);
        try {
            setIsProcessingSend(true);
            await enviarSunat(selectedRow.id);
        } finally {
            setIsProcessingSend(false);
        }
    };

    const confirmEliminar = async () => {
        if (!selectedRow) return;
        setIsDeleteConfirmOpen(false);
        try {
            setIsProcessingDelete(true);
            await deleteGuiaRemision(selectedRow.id);
        } finally {
            setIsProcessingDelete(false);
        }
    };

    const handleEditar = async () => {
        if (!selectedRow) return;
        setGuiaToEdit(selectedRow);
        setIsModalOpen(true);
        handleCloseMenu();
    }

    const headerColumns = [
        { label: "Fecha y Hora", key: "fechaEmision" },
        { label: "Documento", key: "documento" },
        { label: "Destinatario", key: "destinatario" },
        { label: "Motivo Traslado", key: "motivo" },
        { label: "Estado SUNAT", key: "estadoSunat" },
        { label: "Acciones", key: "acciones", width: "100px" }
    ];

    const selectedEstadoSunat = selectedRow?.estadoSunat || 'PENDIENTE';
    const canEditGuia = ['PENDIENTE', 'FALLIDO_ENVIO', 'RECHAZADO'].includes(selectedEstadoSunat);
    const canDeleteGuia = ['PENDIENTE', 'FALLIDO_ENVIO', 'RECHAZADO'].includes(selectedEstadoSunat);
    const canSendGuia = ['PENDIENTE', 'FALLIDO_ENVIO'].includes(selectedEstadoSunat);
    const isRetryGuia = selectedEstadoSunat === 'FALLIDO_ENVIO';

    const bodyData = guiasRemision.map((guia: any) => ({
        ...guia,
        fechaEmision: `${moment.utc(guia.fechaEmision).format("DD/MM/YYYY")} ${guia.horaEmision || ''}`,
        documento: `${guia.serie}-${guia.correlativo}`,
        destinatario: guia.destinatarioRazonSocial,
        motivo: MOTIVOS_TRASLADO[guia.tipoTraslado] || guia.tipoTraslado,
        estadoSunat: (
            <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border shadow-sm ${
                guia.estadoSunat === 'ACEPTADO' 
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' :
                guia.estadoSunat === 'RECHAZADO' || guia.estadoSunat === 'FALLIDO_ENVIO'
                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-100 dark:border-rose-500/20' :
                guia.estadoSunat === 'ENVIADO' 
                ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-500/20' :
                'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20'
            }`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    guia.estadoSunat === 'ACEPTADO' ? 'bg-emerald-500' :
                    guia.estadoSunat === 'RECHAZADO' || guia.estadoSunat === 'FALLIDO_ENVIO' ? 'bg-rose-500' :
                    guia.estadoSunat === 'ENVIADO' ? 'bg-violet-500' : 'bg-blue-500'
                }`}></span>
                {guia.estadoSunat === 'FALLIDO_ENVIO' ? 'FALLIDO' : (guia.estadoSunat || 'PENDIENTE')}
            </span>
        ),
        acciones: (
            <button
                onClick={(e) => handleOpenMenu(e, guia)}
                className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
                <Icon icon="mdi:dots-vertical" width={20} height={20} />
            </button>
        )
    }));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0A0D14] p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Icon icon="solar:delivery-bold-duotone" className="text-blue-600 dark:text-blue-400" />
                        Guías de Remisión
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión y envío de guías de remitente y transportista</p>
                </div>
                <Button color="primary" onClick={() => setIsModalOpen(true)} className="w-full md:w-auto shadow-lg shadow-blue-500/20">
                    <Icon icon="heroicons:plus" className="mr-2" />
                    Nueva Guía
                </Button>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-all">
                <div className="p-5 border-b border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <Icon icon="solar:filter-bold-duotone" className="text-blue-600 dark:text-blue-400 text-xl" />
                        <h3 className="font-bold text-gray-800 dark:text-white uppercase tracking-wider text-xs">Filtros de búsqueda</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div className="lg:col-span-2">
                            <InputPro
                                label="Búsqueda rápida"
                                name="search"
                                value={searchTerm}
                                onChange={handleSearch}
                                placeholder="Serie, correlativo o destinatario..."
                                isLabel={true}
                            />
                        </div>
                        <div>
                            <Calendar
                                text="Desde"
                                name="fechaInicio"
                                value={moment(fechaInicio).format('DD/MM/YYYY')}
                                onChange={(date: any) => setFechaInicio(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'))}
                            />
                        </div>
                        <div>
                            <Calendar
                                text="Hasta"
                                name="fechaFin"
                                value={moment(fechaFin).format('DD/MM/YYYY')}
                                onChange={(date: any) => setFechaFin(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'))}
                            />
                        </div>
                        {isAdmin && (
                            <div>
                                <Select
                                    error=""
                                    label="Sede"
                                    name="sedeId"
                                    defaultValue="Todas las sedes"
                                    onChange={(id: any, _value: string) => setSelectedSedeId(id === 0 ? null : Number(id))}
                                    options={sedesOptions}
                                />
                            </div>
                        )}
                    </div>
                </div>


                <div className="mt-6">
                    <DataTable
                        headerColumns={headerColumns}
                        bodyData={bodyData}
                        isCompact={false}
                    />
                </div>

                <TableActionMenu
                    isOpen={menuOpen}
                    onClose={() => handleCloseMenu(true)}
                    anchorEl={anchorEl}
                >
                    <div className="py-1">
                        {['PENDIENTE', 'ACEPTADO', 'EMITIDO', 'ENVIADO', 'FALLIDO_ENVIO'].includes(selectedEstadoSunat) ? (
                            <button
                                onClick={() => {
                                    handleCloseMenu();
                                    navigate("/administrador/facturacion/nuevo", { state: { guiaRemision: selectedRow } });
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-700 hover:bg-blue-50"
                            >
                                <Icon icon="solar:bill-bold" width={16} height={16} /> <span>Facturar Guía</span>
                            </button>
                        ) : null}

                        <button
                            onClick={async () => {
                                handleCloseMenu();
                                if (selectedRow) {
                                    await downloadPdf(selectedRow.id);
                                }
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                        >
                            <Icon icon="heroicons:arrow-down-tray" width={16} height={16} /> <span>Descargar PDF</span>
                        </button>

                        <button
                            onClick={() => {
                                handleCloseMenu();
                                // Open PDF in new tab for printing

                                // Strategy: Fetch blob, create ObjectURL, open in new tab.
                                apiClient.get(`guia-remision/${selectedRow.id}/pdf`, { responseType: 'blob' })
                                    .then(response => {
                                        const file = new Blob([response.data], { type: 'application/pdf' });
                                        const fileURL = URL.createObjectURL(file);
                                        window.open(fileURL, '_blank');
                                    })
                                    .catch(err => {
                                        useAlertStore.getState().alert('Error al abrir PDF para imprimir', 'error');
                                    });
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                        >
                            <Icon icon="solar:printer-bold" width={16} height={16} /> <span>Imprimir Formato</span>
                        </button>

                        {canEditGuia && (
                            <>
                                <button
                                    onClick={handleEditar}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                                >
                                    <Icon icon="material-symbols:edit" width={16} height={16} /> <span>Editar</span>
                                </button>
                                {canSendGuia && (
                                    <button
                                        onClick={handleEnviarSunat}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-green-700 hover:bg-green-50"
                                    >
                                        <Icon icon="heroicons:paper-airplane" width={16} height={16} /> <span>{isRetryGuia ? 'Reintentar envío a SUNAT' : 'Enviar a SUNAT'}</span>
                                    </button>
                                )}
                            </>
                        )}

                        {canDeleteGuia && (
                            <button
                                onClick={handleEliminar}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                            >
                                <Icon icon="solar:trash-bin-trash-bold" width={16} height={16} /> <span>Eliminar</span>
                            </button>
                        )}
                    </div>
                </TableActionMenu>

                {/* Modal de Nueva Guía */}
                <ModalGuiaRemision
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setGuiaToEdit(null);
                    }}
                    onSuccess={() => {
                        getAllGuiasRemision({
                            search: debouncedSearchTerm,
                            fechaInicio,
                            fechaFin
                        });
                        setGuiaToEdit(null);
                    }}
                    guiaToEdit={guiaToEdit}
                />
                <ModalConfirm
                    isOpenModal={isSendConfirmOpen}
                    setIsOpenModal={setIsSendConfirmOpen}
                    confirmSubmit={confirmEnviarSunat}
                    title={isRetryGuia ? "Reintentar envío a SUNAT" : "Enviar a SUNAT"}
                    information={isRetryGuia
                        ? "¿Desea reintentar el envío de esta guía a SUNAT?"
                        : "¿Desea enviar esta guía a SUNAT?"}
                    confirmText={isRetryGuia ? "Reintentar" : "Enviar"}
                    confirmLoading={isProcessingSend}
                    confirmDisabled={isProcessingDelete}
                />
                <ModalConfirm
                    isOpenModal={isDeleteConfirmOpen}
                    setIsOpenModal={setIsDeleteConfirmOpen}
                    confirmSubmit={confirmEliminar}
                    title="Eliminar guía de remisión"
                    information="¿Está seguro de eliminar esta guía? Esta acción no se puede deshacer."
                    confirmText="Eliminar"
                    confirmLoading={isProcessingDelete}
                    confirmDisabled={isProcessingSend}
                />
                {/* Componente oculto para impresión */}
                <div style={{ display: "none" }}>
                    <GuiaRemisionPrint
                        ref={componentRef}
                        guia={guiaToPrint}
                        company={auth?.empresa}
                    />
                </div>
            </div>
        </div>
    );
};

export default GuiaRemision;
