"use client";
import { ChangeEvent, useEffect, useState } from "react";
import InputPro from "@/components/InputPro";
import DataTable from "@/components/Datatable";
import { Icon } from "@iconify/react/dist/iconify.js";
import ModalConfirm from "@/components/ModalConfirm";
import Pagination from "@/components/Pagination";
import useAlertStore from "@/zustand/alert";
import { useClientsStore } from "@/zustand/clients";
import { IClient, IFormClient } from "@/interfaces/clients";
import { useDebounce } from "@/hooks/useDebounce";
import ModalProveedor from "./ModalProveedor";
import Button from "@/components/Button";
import { useAuthStore } from "@/zustand/auth";

const Proveedores = () => {

    const { getAllClients, clients, totalClients, toggleStateClient } = useClientsStore();
    const { success } = useAlertStore();
    const { auth } = useAuthStore();

    const [currentPage, setcurrentPage] = useState(1);
    const [itemsPerPage, setitemsPerPage] = useState(50);

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
        persona: "PROVEEDOR",
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

    // Columns specific for Proveedores
    const [visibleColumns, setVisibleColumns] = useState<string[]>([
        'Razón Social / Nombre',
        'Documento',
        'Nro. Doc',
        'Celular',
        'Dirección',
        'Estado',
        'Acciones'
    ]);

    const handleGetProduct = async (data: any) => {
        setIsOpenModal(true);
        setIsEdit(true);
        setFormValues(data);
    };

    useEffect(() => {
        if (success === true) {
            setIsOpenModal(false);
            setIsEdit(false)
        }
    }, [success])

    useEffect(() => {
        const handleDocClick = () => {
            if (openAccionesId !== null) setOpenAccionesId(null);
        };
        document.addEventListener('click', handleDocClick);
        return () => document.removeEventListener('click', handleDocClick);
    }, [openAccionesId]);

    const clientsTable = clients?.map((item: IClient) => {
        // Map data to columns
        const rowBase: any = {
            id: item.id,
            'Razón Social / Nombre': item.nombre,
            'Documento': item.nroDoc.length === 8 ? "DNI" : "RUC",
            'Nro. Doc': item.nroDoc,
            'Celular': item.telefono,
            'Dirección': item.direccion,
            'Estado': item.estado
        };

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
                            onClick={() => { handleGetProduct(item); setOpenAccionesId(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                        >
                            <Icon icon="material-symbols:edit" width={16} height={16} />
                            <span>Editar</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { handleToggleClientState(item); setOpenAccionesId(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                        >
                            <Icon icon="mdi:power" width={16} height={16} />
                            <span>{item.estado === 'INACTIVO' ? 'Activar' : 'Desactivar'}</span>
                        </button>
                    </div>
                )}
            </div>
        );

        return { ...rowBase, Acciones: acciones };
    });

    const handleToggleClientState = async (data: any) => {
        setFormValues(data);
        setIsOpenModalConfirm(true);
    };

    useEffect(() => {
        // Fetch only PROVEEDOR
        getAllClients({
            page: currentPage,
            limit: itemsPerPage,
            search: debounce,
            persona: 'PROVEEDOR'
        });
    }, [debounce, currentPage, itemsPerPage]);

    const closeModal = () => {
        setIsOpenModal(false);
        setIsEdit(false)
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setSearchClient(e.target.value)
    };

    const confirmDeleteProduct = () => {
        toggleStateClient(Number(formValues?.id))
        setIsOpenModalConfirm(false)
    }

    return (
        <div className="min-h-screen px-2 pb-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Proveedores</h1>
                    <p className="text-sm text-gray-500 mt-1">Gestión de proveedores para compras</p>
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
                    Nuevo Proveedor
                </Button>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Search */}
                <div className="p-5 border-b border-gray-100">
                    <div className="max-w-md">
                        <InputPro name="cliente" value={searchClient} onChange={handleChange} label="Buscar proveedor" isLabel />
                    </div>
                </div>

                {/* Table Content */}
                <div className="p-4">
                    {clientsTable?.length > 0 ? (
                        <>
                            <div className="overflow-hidden overflow-x-auto">
                                <DataTable bodyData={clientsTable} headerColumns={visibleColumns} />
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
                            <p className="text-gray-500">No se encontraron proveedores</p>
                        </div>
                    )}
                </div>
            </div>

            {isOpenModal && <ModalProveedor setErrors={setErrors} errors={errors} formValues={formValues} setFormValues={setFormValues} isEdit={isEdit} isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} closeModal={closeModal} />}
            {isOpenModalConfirm && <ModalConfirm confirmSubmit={confirmDeleteProduct} isOpenModal={isOpenModalConfirm} setIsOpenModal={setIsOpenModalConfirm} title="Confirmación" information="¿Estás seguro que deseas cambiar el estado del proveedor?" />}
        </div>
    );
};

export default Proveedores;
