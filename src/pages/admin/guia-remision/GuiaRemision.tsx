import { useState, useEffect } from "react";
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
    const { getAllGuiasRemision, guiasRemision, enviarSunat, deleteGuiaRemision } = useGuiaRemisionStore();
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Menu Action State
    const [menuOpen, setMenuOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedRow, setSelectedRow] = useState<any>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [guiaToEdit, setGuiaToEdit] = useState<any>(null);

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

    // Filtros
    const [fechaInicio, setFechaInicio] = useState(moment().format('YYYY-MM-DD'));
    const [fechaFin, setFechaFin] = useState(moment().format('YYYY-MM-DD'));

    useEffect(() => {
        getAllGuiasRemision({
            search: debouncedSearchTerm,
            fechaInicio,
            fechaFin
        });
    }, [debouncedSearchTerm, fechaInicio, fechaFin]);

    const handleSearch = (e: any) => {
        setSearchTerm(e.target.value);
    };

    const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>, row: any) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setSelectedRow(row);
        setMenuOpen(true);
    };

    const handleCloseMenu = () => {
        setMenuOpen(false);
        setAnchorEl(null);
        setSelectedRow(null);
    };

    const handleEnviarSunat = async () => {
        if (!selectedRow) return;
        handleCloseMenu();
        // TODO: Obtener personaId y token real. Aquí usamos valores placeholder o del auth
        await enviarSunat(selectedRow.id);
    };

    const handleAnular = async () => {
        if (!selectedRow) return;
        handleCloseMenu();
        if (confirm("¿Está seguro de anular esta guía?")) {
            // Anulación lógica o llamar a endpoint de baja
            useAlertStore.getState().alert("Funcionalidad de anulación pendiente", "info");
        }
    };

    const handleEliminar = async () => {
        if (!selectedRow) return;
        handleCloseMenu();
        if (confirm("¿Está seguro de eliminar este borrador?")) {
            await deleteGuiaRemision(selectedRow.id);
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

    const bodyData = guiasRemision.map((guia: any) => ({
        ...guia,
        fechaEmision: `${moment.utc(guia.fechaEmision).format("DD/MM/YYYY")} ${guia.horaEmision || ''}`,
        documento: `${guia.serie}-${guia.correlativo}`,
        destinatario: guia.destinatarioRazonSocial,
        motivo: MOTIVOS_TRASLADO[guia.tipoTraslado] || guia.tipoTraslado,
        estadoSunat: (
            <span className={`px-2 py-1 rounded text-xs font-semibold ${guia.estadoSunat === 'ACEPTADO' ? 'bg-green-100 text-green-800' :
                guia.estadoSunat === 'RECHAZADO' ? 'bg-red-100 text-red-800' :
                    guia.estadoSunat === 'ENVIADO' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                }`}>
                {guia.estadoSunat || 'PENDIENTE'}
            </span>
        ),
        acciones: (
            <button
                onClick={(e) => handleOpenMenu(e, guia)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
                <Icon icon="mdi:dots-vertical" className="text-gray-600 text-xl" />
            </button>
        )
    }));

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Guías de Remisión</h1>
                <Button color="primary" onClick={() => setIsModalOpen(true)}>
                    <Icon icon="heroicons:plus" className="mr-2" />
                    Nueva Guía
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-4">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full md:w-1/3">
                        <InputPro
                            label="Buscar..."
                            name="search"
                            value={searchTerm}
                            onChange={handleSearch}
                            placeholder="Serie, Correlativo o Cliente..."
                            isLabel={true}
                        />
                    </div>
                    <div className="w-full md:w-auto">
                        <Calendar
                            text="Desde"
                            name="fechaInicio"
                            value={moment(fechaInicio).format('DD/MM/YYYY')}
                            onChange={(date: any) => setFechaInicio(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'))}
                        />
                    </div>
                    <div className="w-full md:w-auto">
                        <Calendar
                            text="Hasta"
                            name="fechaFin"
                            value={moment(fechaFin).format('DD/MM/YYYY')}
                            onChange={(date: any) => setFechaFin(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'))}
                        />
                    </div>
                </div>
            </div>

            <DataTable
                headerColumns={headerColumns}
                bodyData={bodyData}
                isCompact={false}
            />

            <TableActionMenu
                isOpen={menuOpen}
                onClose={handleCloseMenu}
                anchorEl={anchorEl}
            >
                <div className="py-1">
                    <button
                        onClick={() => {
                            handleCloseMenu();
                            if (selectedRow?.pdfUrl || selectedRow?.s3PdfUrl) {
                                window.open(selectedRow.pdfUrl || selectedRow.s3PdfUrl, '_blank');
                            } else {
                                useAlertStore.getState().alert("PDF no disponible aún", "info");
                            }
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                        <Icon icon="heroicons:document-text" className="mr-2" /> Ver PDF
                    </button>

                    <button
                        onClick={() => handlePrint(selectedRow)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                        <Icon icon="solar:printer-bold" className="mr-2" /> Imprimir Formato
                    </button>

                    {selectedRow?.estadoSunat === 'PENDIENTE' && (
                        <>
                            <button
                                onClick={handleEditar}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                                <Icon icon="heroicons:pencil" className="mr-2" /> Editar
                            </button>
                            <button
                                onClick={handleEnviarSunat}
                                className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center"
                            >
                                <Icon icon="heroicons:paper-airplane" className="mr-2" /> Enviar a SUNAT
                            </button>
                            <button
                                onClick={handleEliminar}
                                className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center"
                            >
                                <Icon icon="heroicons:trash" className="mr-2" /> Eliminar
                            </button>
                        </>
                    )}
                </div>
            </TableActionMenu>

            {/* Modal de Nueva Guía */}
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
            {/* Componente oculto para impresión */}
            <div style={{ display: "none" }}>
                <GuiaRemisionPrint
                    ref={componentRef}
                    guia={guiaToPrint}
                    company={auth?.empresa}
                />
            </div>
        </div>
    );
};

export default GuiaRemision;
