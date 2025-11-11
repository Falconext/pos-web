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
    const debounce = useDebounce(searchClient, 1000);



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

    const clientsTable = clients?.map((item: IClient) => ({
        id: item?.id,
        nombre: item?.nombre,
        documento: item?.nroDoc.length === 8 ? "DNI" : item?.nroDoc.length === 11 ? "RUC" : "",
        nroDoc: item?.nroDoc,
        direccion: item?.direccion,
        departamento: item?.departamento,
        provincia: item?.provincia,
        distrito: item?.distrito,
        email: item.email,
        persona: item.persona === "CLIENTE" ? "CLIENTE" : item?.persona === "PROVEEDOR" ? "PROVEEDOR" : "CLIENTE-PROVEEDOR",
        telefono: item?.telefono,
        estado: item.estado
    }))



    const handleToggleClientState = async (data: any) => {
        console.log(data)
        setFormValues(data);
        setIsOpenModalConfirm(true);
    };

    const actions: any =
        [
            {
                onClick: handleGetProduct,
                className: "edit",
                icon: <Icon color="#66AD78" icon="material-symbols:edit" />,
                tooltip: "Editar"
            },
            {
                onClick: handleToggleClientState,
                className: "delete", // Usaremos esta clase genérica y la lógica estará en TableBody
                icon: <Icon icon="healthicons:cancel-24px" color="#EF443C" />,
                tooltip: "Eliminar", // Tooltip genérico (se cambiará en TableBody)
            }
        ]
        ;

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
        <div className="px-0 py-0 md:px-8 md:py-4">
            <div className="md:p-10 px-4 pt-0 z-0 md:px-8 bg-[#fff] rounded-lg">
                <div className="md:flex md:justify-between items-center mb-5 pt-5 md:pt-0">
                    <div className="md:w-2/5 w-full">
                        <InputPro name="cliente" onChange={handleChange} label="Buscar por cliente y RUC" isLabel />
                    </div>
                    <div className="flex md:items-center items-start gap-5 mt-5 md:mt-0">
                        <Button
                            color="success"
                            onMouseEnter={() => setIsHoveredExp(true)}
                            onMouseLeave={() => setIsHoveredExp(false)}
                            onClick={() => {
                                exportClients(auth?.empresaId, debounce);
                            }}
                        >
                            <Icon
                                className="mr-4"
                                color={isHoveredExp ? '#fff' : '#00C851'}
                                icon="icon-park-outline:excel"
                                width="20"
                                height="20"
                            />
                            Exportar Exc.
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
                                onMouseEnter={() => setIsHoveredImp(true)}
                                onMouseLeave={() => setIsHoveredImp(false)}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Icon
                                    className="mr-4"
                                    color={isHoveredImp ? '#fff' : '#00C851'}
                                    icon="icon-park-outline:excel"
                                    width="20"
                                    height="20"
                                />
                                Importar Exc.
                            </Button>
                        </div>
                        <Button color="secondary" onClick={() => {
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
                        }}>Nuevo cliente</Button>
                    </div>
                </div>
                <div className=''>

                    {
                        clientsTable?.length > 0 ? (
                            <>
                                <div className="overflow-hidden overflow-x-scroll md:overflow-x-visible">
                                    <DataTable actions={actions} bodyData={clientsTable}
                                        headerColumns={[

                                            'Nombre o Razon social',
                                            'Documento',
                                            'Num. doc',
                                            'Direccion',
                                            'Correo principal',
                                            'Persona',
                                            'Celular',
                                            'Estado'
                                        ]} />
                                </div>
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
                            </>
                        ) :
                            <TableSkeleton />
                    }
                </div>
                {isOpenModal && <ModalClient setErrors={setErrors} errors={errors} formValues={formValues} setFormValues={setFormValues} isEdit={isEdit} isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} closeModal={closeModal} />}

                {isOpenModalConfirm && <ModalConfirm confirmSubmit={confirmDeleteProduct} isOpenModal={isOpenModalConfirm} setIsOpenModal={setIsOpenModalConfirm} title="Confirmación" information="¿Estás seguro que deseas cambiar el estado del cliente?" />}
            </div>
        </div>
    );
};

export default Clients;