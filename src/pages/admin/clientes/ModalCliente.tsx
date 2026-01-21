import { ChangeEvent, Dispatch, useEffect } from "react";
import Modal from "@/components/Modal";
import Select from "@/components/Select";
import { IFormClient } from "@/interfaces/clients";
import { useClientsStore } from "@/zustand/clients";
import InputPro from "@/components/InputPro";
import SelectUbigeo from "@/components/Select/SelectUbigeo";
import { useExtentionsStore } from "@/zustand/extentions";
import Button from "@/components/Button";

interface IProps {
    isOpenModal: any
    closeModal: any
    isEdit: boolean
    setIsOpenModal: Dispatch<boolean>
    formValues: IFormClient
    setFormValues: any
    errors: any
    setErrors: any
}

const ModalClient = ({ isOpenModal, closeModal, setIsOpenModal, isEdit, formValues, setFormValues, errors, setErrors }: IProps) => {

    const { editClients, addClients, getClientFromDoc } = useClientsStore();
    const { ubigeos, getUbigeos } = useExtentionsStore();

    const persons = [{ id: "CLIENTE", value: "CLIENTE" }, { id: "PROVEEDOR", value: "PROVEEDOR" }, { id: "CLIENTE_PROVEEDOR", value: "CLIENTE-PROVEEDOR" }]
    const handleChange = async (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormValues({
            ...formValues,
            [name]: value
        });
        if (name === "nroDoc") {
            const cleanValue = value.trim();
            if (cleanValue.length === 8 || cleanValue.length === 11) {
                const result = await getClientFromDoc(cleanValue);
                console.log(result)
                if (result) {
                    setFormValues((prev: IFormClient) => ({
                        ...prev,
                        departamento: result.departamento || "",
                        distrito: result.distrito || "",
                        provincia: result.provincia || "",
                        ubigeo: result.ubigeo_sunat || "",
                        nombre: result.nombre_completo || result.nombre_o_razon_social || "",
                        direccion: result.direccion || "",
                    }));
                }
            }
        }
    };

    useEffect(() => {
        getUbigeos();
    }, [])

    console.log(formValues)

    const validateForm = () => {
        const newErrors: any = {
            nombre: formValues?.nombre && formValues?.nombre.trim() !== "" ? "" : "La Razon social o el nombre de cliente es obligatorio",
            nroDoc: (() => {
                const doc = formValues?.nroDoc?.trim() || "";

                // Si está vacío
                if (!doc) {
                    return "El número de documento es obligatorio";
                }

                // Validar según el tipo de documento
                if (formValues.persona === "CLIENTE" || formValues.persona === "CLIENTE-PROVEEDOR") {
                    // Validación para DNI (8 dígitos)
                    if (doc.length === 8) {
                        if (!/^\d{8}$/.test(doc)) {
                            return "El DNI debe contener exactamente 8 dígitos numéricos";
                        }
                        return "";
                    }
                    // Validación para RUC (11 dígitos)
                    if (doc.length === 11) {
                        if (!/^(10|20)\d{9}$/.test(doc)) {
                            return "El RUC debe contener 11 dígitos y comenzar con 10 o 20";
                        }
                        return "";
                    }
                    return "El documento debe ser un DNI (8 dígitos) o RUC (11 dígitos)";
                }
                return "";
            })(),
        };
        setErrors(newErrors);
        return Object.values(newErrors).every((error) => !error); // Retorna `true` si no hay errores
    };

    const handleSubmitProduct = async () => {
        console.log(formValues)
        if (!validateForm()) {
            return;
        }
        if (Number(formValues?.id) !== 0 && isEdit) {
            editClients({
                ...formValues,
                tipoDoc: formValues.nroDoc.length === 8 ? "DNI" : "RUC"
            });
            closeModal();
        } else {
            addClients({
                ...formValues,
                tipoDoc: formValues.nroDoc.length === 8 ? "DNI" : "RUC",
                estado: "ACTIVO"
            });
            closeModal();
        }
    }

    const handleChangeSelect = (idValue: any, value: any, name: any, id: any) => {
        setFormValues({
            ...formValues,
            [name]: value,
            [id]: idValue,
        });
    }

    console.log(formValues)

    return (
        <div>
            {isOpenModal && <Modal width="600px" height="auto" position="right" isOpenModal={isOpenModal} closeModal={closeModal} title={isEdit ? "Editar cliente" : "Nuevo cliente"}>
                <div className="md:px-6 grid grid-cols-1 mt-5 gap-5">
                    <div className="">
                        <InputPro autocomplete="off" error={errors.nroDoc} value={formValues?.nroDoc} name="nroDoc" onChange={handleChange} isLabel label="Nro. documento" />
                    </div>
                    <div className="">
                        <Select defaultValue={formValues?.persona} error={""} isSearch options={persons} id="persona" name="personaName" value="" onChange={handleChangeSelect} icon="clarity:box-plot-line" isIcon label="Persona" />
                    </div>
                    <div className="col-start-1 col-end-3">
                        <InputPro autocomplete="off" value={formValues?.nombre} error={errors.nombre} name="nombre" onChange={handleChange} isLabel label="Nombre o Razon social" />
                    </div>
                    <div className="col-start-1 col-end-3">
                        <InputPro autocomplete="off" error={errors.direccion} value={formValues?.direccion} name="direccion" onChange={handleChange} isLabel label="Direccion" />
                    </div>
                    <div className="">
                        <InputPro autocomplete="off" value={formValues?.email} error={errors.email} name="email" onChange={handleChange} isLabel label="Correo principal" />
                    </div>
                    <div className="">
                        <InputPro autocomplete="off" value={formValues?.telefono} error={errors.telefono} name="phone" onChange={handleChange} isLabel label="Celular" />
                    </div>
                    <div className="col-start-1 col-end-3">
                        <SelectUbigeo value={formValues?.departamento ? `${formValues?.departamento}/${formValues?.provincia}/${formValues?.distrito}` : ""} isSearch options={ubigeos} name="nombreUbigeo" id="ubigeo" onChange={handleChangeSelect} label="Seleccionar ubigeo de la empresa" />
                    </div>
                </div>
                <div className="flex gap-5 justify-end mt-10 mb-5 md:pr-5">
                    <Button color="gray" onClick={() => setIsOpenModal(false)}>Cancelar</Button>
                    <Button color="secondary" onClick={handleSubmitProduct}>{isEdit ? "Editar" : "Guardar"}</Button>
                </div>
            </Modal>
            }
        </div>
    )
}

export default ModalClient;