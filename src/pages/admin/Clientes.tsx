"use client";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import Input from "@/components/Input";
import DataTable from "@/components/Datatable";
import { Icon } from "@iconify/react/dist/iconify.js";
import ModalConfirm from "@/components/ModalConfirm";
import Pagination from "@/components/Pagination";
import useAlertStore from "@/zustand/alert";
import TableSkeleton from "@/components/Skeletons/table";
import { useClientsStore } from "@/zustand/clients";
import { IClient, IFormClient } from "@/interfaces/clients";
import { useDebounce } from "@/hooks/useDebounce";
import ModalClient from "./clientes/ModalCliente";
import Button from "@/components/Button";
import InputPro from "@/components/InputPro";
import { useAuthStore } from "@/zustand/auth";
import apiClient from "@/utils/apiClient";

// import ModalClient from "./modal-clientes";

const Clients = () => {


    const { getAllClients, clients, totalClients, toggleStateClient, exportClients, importClients } = useClientsStore();
    const { success } = useAlertStore();
    const { auth } = useAuthStore();

    const [currentPage, setcurrentPage] = useState(1);
    const [itemsPerPage, setitemsPerPage] = useState(50);
    const [isHoveredExp, setIsHoveredExp] = useState(false);
    const [isHoveredImp, setIsHoveredImp] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const pages = [];
    for (let i = 1; i <= Math.ceil(totalClients / itemsPerPage); i++) {
        pages.push(i);
    }

    const initialForm: IFormClient = {
        id: 0,
        nombre: "",
        nroDoc: "",
        direccion: "",
        departamento: "",
        distrito: "",
        provincia: "",
        persona: "CLIENTE",
        ubigeo: "",
        email: "",
        telefono: "",
        tipoDoc: "",
        estado: "",
        tipoDocumentoId: 0,
        empresaId: 0,
        tipoDocumento: {
            codigo: "",
            descripcion: "",
            id: 0
        }
    }

    const [isOpenModal, setIsOpenModal] = useState(false);
    const [isOpenModalConfirm, setIsOpenModalConfirm] = useState(false);
    const [searchClient, setSearchClient] = useState<string>("");
    const [formValues, setFormValues] = useState<IFormClient>(initialForm);
    const [isEdit, setIsEdit] = useState(false);
    const [errors, setErrors] = useState({
        nombre: "",
        nroDoc: "",
        direccion: "",
        departamento: "",
        distrito: "",
        provincia: "",
        ubigeo: "",
        email: "",
        telefono: "",
        estado: "",
        tipoDocumentoId: 0,
        empresaId: 0,
    });
    const debounce = useDebounce(searchClient, 600);
    const [openAccionesId, setOpenAccionesId] = useState<number | null>(null);
    const [visibleColumns, setVisibleColumns] = useState<string[]>([
        'Nombre o Razon social',
        'Documento',
        'Num. doc',
        'Direccion',
        'Correo principal',
        'Persona',
        'Celular',
        'Estado',
        'Acciones'
    ]);
    const [showColumnFilter, setShowColumnFilter] = useState(false);

    const allColumns = [
        'Nombre o Razon social',
        'Documento',
        'Num. doc',
        'Direccion',
        'Correo principal',
        'Persona',
        'Celular',
        'Estado',
        'Acciones'
    ];

    const columnsStorageKey = `datatable:${auth?.empresaId || 'default'}:clientes:visibleColumns`;

    // Cargar columnas: priorizar servidor, fallback a localStorage
    useEffect(() => {
        const loadColumns = async () => {
            if (!auth?.empresaId) return;

            try {
                // Intentar cargar desde servidor primero
                const res = await apiClient.get(`/preferencias/tabla`, {
                    params: { tabla: 'clientes', empresaId: auth.empresaId },
                });
                const serverCols = res?.data?.visibleColumns;
                if (Array.isArray(serverCols) && serverCols.length) {
                    let restored: string[] = allColumns.filter((c) => serverCols.includes(c));
                    if (!restored.includes('Acciones')) restored = [...restored, 'Acciones'];
                    setVisibleColumns(restored);
                    return; // Éxito, no necesitamos localStorage
                }
            } catch (_e) {
                // Si falla servidor, intentar localStorage
            }

            // Fallback a localStorage
            try {
                const defaultKey = columnsStorageKey.replace(`${auth.empresaId}`, 'default');
                const candidates = [columnsStorageKey, defaultKey];
                let parsed: any = null;
                for (const k of candidates) {
                    const raw = localStorage.getItem(k);
                    if (raw) {
                        try { parsed = JSON.parse(raw); } catch { parsed = null; }
                    }
                    if (Array.isArray(parsed)) break;
                }
                if (Array.isArray(parsed)) {
                    let restored: string[] = allColumns.filter((c) => parsed.includes(c));
                    if (!restored.includes('Acciones')) restored = [...restored, 'Acciones'];
                    setVisibleColumns(restored);
                }
            } catch (_e) {
                // noop
            }
        };

        loadColumns();
    }, [auth?.empresaId, columnsStorageKey]);

    // Guardar cambios de columnas en localStorage y backend
    useEffect(() => {
        try {
            const toSave = visibleColumns.includes('Acciones')
                ? visibleColumns
                : [...visibleColumns, 'Acciones'];
            localStorage.setItem(columnsStorageKey, JSON.stringify(toSave));
        } catch (e) {
            // noop
        }
        // Persistir también en backend
        const persist = async () => {
            try {
                const toSave = visibleColumns.includes('Acciones') ? visibleColumns : [...visibleColumns, 'Acciones'];
                await apiClient.put(`/preferencias/tabla`, { visibleColumns: toSave }, {
                    params: { tabla: 'clientes', empresaId: auth?.empresaId },
                });
            } catch (_e) { /* noop */ }
        };
        if (auth?.empresaId) persist();
    }, [visibleColumns, columnsStorageKey, auth?.empresaId]);

    const toggleColumn = (column: string) => {
        if (column === 'Acciones') return; // Siempre visible
        setVisibleColumns(prev => {
            if (prev.includes(column)) {
                // Ocultar columna
                return prev.filter(c => c !== column);
            } else {
                // Mostrar columna en su posición original
                const newVisible = allColumns.filter(col =>
                    prev.includes(col) || col === column
                );
                return newVisible;
            }
        });
    };



    const handleGetProduct = async (data: any) => {
        // await getSignature(data.base64File);
        setIsOpenModal(true);
        setIsEdit(true);
        setFormValues(data);
    };

    const handleImportExcel = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const allowedTypes = [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];
        if (!allowedTypes.includes(file.type)) {
            useAlertStore.getState().alert("Por favor, selecciona un archivo Excel válido (.xlsx o .xls)", "error");
            return;
        }

        await importClients(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        await getAllClients({
            page: currentPage,
            limit: itemsPerPage,
            search: debounce,
        });
    };



    useEffect(() => {
        if (success === true) {
            setIsOpenModal(false);
            setIsEdit(false)
        }
    }, [success])

    console.log(clients)

    useEffect(() => {
        const handleDocClick = () => {
            if (openAccionesId !== null) setOpenAccionesId(null);
            if (showColumnFilter) setShowColumnFilter(false);
        };
        document.addEventListener('click', handleDocClick);
        return () => document.removeEventListener('click', handleDocClick);
    }, [openAccionesId, showColumnFilter]);

    const clientsTable = clients?.map((item: IClient) => {
        const allData: any = {
            id: item?.id,
            'Nombre o Razon social': item?.nombre,
            'Documento': item?.nroDoc.length === 8 ? "DNI" : item?.nroDoc.length === 11 ? "RUC" : "",
            'Num. doc': item?.nroDoc,
            'Direccion': item?.direccion,
            'Correo principal': item.email,
            'Persona': item.persona === "CLIENTE" ? "CLIENTE" : item?.persona === "PROVEEDOR" ? "PROVEEDOR" : "CLIENTE-PROVEEDOR",
            'Celular': item?.telefono,
            'Estado': item.estado
        };

        // Crear rowBase solo con columnas visibles en el orden de allColumns
        const rowBase: any = {};
        allColumns.forEach(col => {
            if (visibleColumns.includes(col) && allData.hasOwnProperty(col)) {
                rowBase[col] = allData[col];
            }
        });
        rowBase.id = item?.id; // Mantener id para acciones

        const isOpen = openAccionesId === item.id;
        const acciones = (
            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    onClick={() => setOpenAccionesId(isOpen ? null : item.id)}
                    className="px-2 py-1 text-xs rounded-lg border border-gray-300 bg-white flex items-center gap-1"
                >
                    <Icon icon="mdi:dots-vertical" width={18} height={18} />
                </button>
                {isOpen && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                        <button
                            type="button"
                            onClick={() => { handleGetProduct(rowBase); setOpenAccionesId(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                        >
                            <Icon icon="material-symbols:edit" width={16} height={16} />
                            <span>Editar</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { handleToggleClientState(rowBase); setOpenAccionesId(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                        >
                            <Icon icon="mdi:power" width={16} height={16} />
                            <span>{rowBase.estado === 'INACTIVO' ? 'Activar' : 'Desactivar'}</span>
                        </button>
                    </div>
                )}
            </div>
        );

        return { ...rowBase, acciones };
    })



    const handleToggleClientState = async (data: any) => {
        console.log(data)
        setFormValues(data);
        setIsOpenModalConfirm(true);
    };

    // Acciones ahora se gestionan por dropdown en la columna 'Acciones'

    useEffect(() => {
        getAllClients({
            page: currentPage,
            limit: itemsPerPage,
            search: debounce
        });
    }, [debounce, currentPage, itemsPerPage]);

    const closeModal = () => {
        setIsOpenModal(false);
        setIsEdit(false)
    }

    console.log(formValues)

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setSearchClient(e.target.value)
    };


    const confirmDeleteProduct = () => {
        toggleStateClient(Number(formValues?.id))
        setIsOpenModalConfirm(false)
    }

    console.log(formValues)

    return (
        <div className="min-h-screen pb-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clientes</h1>
                    <p className="text-sm text-gray-500 mt-1">Administra tu cartera de clientes y proveedores</p>
                </div>
                <Button
                    color="secondary"
                    onClick={() => {
                        setFormValues(initialForm);
                        setErrors({
                            nombre: "",
                            nroDoc: "",
                            direccion: "",
                            departamento: "",
                            distrito: "",
                            provincia: "",
                            ubigeo: "",
                            email: "",
                            telefono: "",
                            estado: "",
                            tipoDocumentoId: 0,
                            empresaId: 0,
                        });
                        setIsOpenModal(true);
                    }}
                    className="flex items-center gap-2"
                >
                    <Icon icon="solar:add-circle-bold" className="text-lg" />
                    Nuevo cliente
                </Button>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Search and Actions */}
                <div className="p-5 border-b border-gray-100">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <InputPro name="cliente" value={searchClient} onChange={handleChange} label="Buscar por cliente y RUC" isLabel />
                        </div>
                        <div className="flex flex-wrap gap-2 items-end">
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <Button
                                    color="lila"
                                    outline
                                    onClick={(e: any) => { e.stopPropagation(); setShowColumnFilter(!showColumnFilter); }}
                                >
                                    <Icon icon="solar:filter-bold-duotone" className="mr-1.5" />
                                    Columnas
                                </Button>
                                {showColumnFilter && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-30 p-3" onClick={(e) => e.stopPropagation()}>
                                        <div className="text-xs font-semibold mb-2 text-gray-700">Mostrar/Ocultar columnas</div>
                                        {allColumns.filter(c => c !== 'Acciones').map(col => (
                                            <label key={col} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-gray-50 px-2 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={visibleColumns.includes(col)}
                                                    onChange={() => toggleColumn(col)}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-xs text-gray-700">{col}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <Button
                                color="success"
                                outline
                                onMouseEnter={() => setIsHoveredExp(true)}
                                onMouseLeave={() => setIsHoveredExp(false)}
                                onClick={() => exportClients(auth?.empresaId, debounce)}
                            >
                                <Icon icon="solar:export-bold" className="mr-1.5" />
                                Exportar
                            </Button>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    ref={fileInputRef}
                                    onChange={handleImportExcel}
                                    className="hidden"
                                />
                                <Button
                                    color="success"
                                    outline
                                    onMouseEnter={() => setIsHoveredImp(true)}
                                    onMouseLeave={() => setIsHoveredImp(false)}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Icon icon="solar:import-bold" className="mr-1.5" />
                                    Importar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="p-4">
                    {clientsTable?.length > 0 ? (
                        <>
                            <div className="overflow-hidden overflow-x-auto">
                                <DataTable bodyData={clientsTable}
                                    headerColumns={visibleColumns} />
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <Pagination
                                    data={clientsTable}
                                    optionSelect
                                    currentPage={currentPage}
                                    indexOfFirstItem={indexOfFirstItem}
                                    indexOfLastItem={indexOfLastItem}
                                    setcurrentPage={setcurrentPage}
                                    setitemsPerPage={setitemsPerPage}
                                    pages={pages}
                                    total={totalClients}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="py-12 text-center">
                            <Icon icon="solar:users-group-rounded-linear" className="text-5xl text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No se encontraron clientes</p>
                            <p className="text-sm text-gray-400 mt-1">Intenta con otros términos de búsqueda</p>
                        </div>
                    )}
                </div>
            </div>

            {isOpenModal && <ModalClient setErrors={setErrors} errors={errors} formValues={formValues} setFormValues={setFormValues} isEdit={isEdit} isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} closeModal={closeModal} />}
            {isOpenModalConfirm && <ModalConfirm confirmSubmit={confirmDeleteProduct} isOpenModal={isOpenModalConfirm} setIsOpenModal={setIsOpenModalConfirm} title="Confirmación" information="¿Estás seguro que deseas cambiar el estado del cliente?" />}
        </div>
    );

};

export default Clients;