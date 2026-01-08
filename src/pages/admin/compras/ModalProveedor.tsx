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

const ModalProveedor = ({ isOpenModal, closeModal, setIsOpenModal, isEdit, formValues, setFormValues, errors, setErrors }: IProps) => {

    const { editClients, addClients, getClientFromDoc } = useClientsStore();
    const { ubigeos, getUbigeos } = useExtentionsStore();

    // Only allow PROVEEDOR
    const persons = [{ id: "PROVEEDOR", value: "PROVEEDOR" }];

    useEffect(() => {
        // Force persona to PROVEEDOR on mount
        setFormValues((prev: any) => ({ ...prev, persona: 'PROVEEDOR' }));
    }, []);

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

    const validateForm = () => {
        const newErrors: any = {
            nombre: formValues?.nombre && formValues?.nombre.trim() !== "" ? "" : "La Razón social es obligatoria",
            nroDoc: (() => {
                const doc = formValues?.nroDoc?.trim() || "";
                if (!doc) {
                    return "El número de documento es obligatorio";
                }
                if (doc.length === 8) {
                    if (!/^\d{8}$/.test(doc)) return "El DNI debe contener 8 dígitos";
                    return "";
                }
                if (doc.length === 11) {
                    if (!/^(10|20)\d{9}$/.test(doc)) return "El RUC debe comenzar con 10 o 20 y tener 11 dígitos";
                    return "";
                }
                return "Debe ser DNI (8) o RUC (11)";
            })(),
        };
        setErrors(newErrors);
        return Object.values(newErrors).every((error) => !error);
    };

    const handleSubmitProduct = async () => {
        if (!validateForm()) return;

        const payload = {
            ...formValues,
            tipoDoc: formValues.nroDoc.length === 8 ? "DNI" : "RUC",
            persona: "PROVEEDOR" // Force it
        };

        if (Number(formValues?.id) !== 0 && isEdit) {
            editClients(payload);
            closeModal();
        } else {
            addClients({
                ...payload,
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

    return (
        <div>
            {isOpenModal && <Modal width="750px" isOpenModal={isOpenModal} closeModal={closeModal} title={isEdit ? "Editar Proveedor" : "Nuevo Proveedor"}>
                <div className="md:px-6 grid md:grid-cols-2 mt-5 gap-5">
                    <div className="">
                        <InputPro autocomplete="off" error={errors.nroDoc} value={formValues?.nroDoc} name="nroDoc" onChange={handleChange} isLabel label="RUC / DNI" />
                    </div>
                    {/* Hidden or read-only selection for Persona */}
                    <div className="">
                        <InputPro isLabel label="Tipo Persona" value="PROVEEDOR" disabled={true} name="personaDisplay" />
                    </div>
                    <div className="col-start-1 col-end-3">
                        <InputPro autocomplete="off" value={formValues?.nombre} error={errors.nombre} name="nombre" onChange={handleChange} isLabel label="Razón Social / Nombre" />
                    </div>
                    <div className="col-start-1 col-end-3">
                        <InputPro autocomplete="off" error={errors.direccion} value={formValues?.direccion} name="direccion" onChange={handleChange} isLabel label="Dirección" />
                    </div>
                    <div className="">
                        <InputPro autocomplete="off" value={formValues?.email} error={errors.email} name="email" onChange={handleChange} isLabel label="Correo electrónico" />
                    </div>
                    <div className="">
                        <InputPro autocomplete="off" value={formValues?.telefono} error={errors.telefono} name="phone" onChange={handleChange} isLabel label="Teléfono / Celular" />
                    </div>
                    <div className="col-start-1 col-end-3">
                        <SelectUbigeo value={`${formValues?.departamento}/${formValues?.provincia}/${formValues?.distrito}`} isSearch options={ubigeos} name="nombreUbigeo" id="ubigeo" onChange={handleChangeSelect} label="Ubicación" />
                    </div>
                </div>
                <div className="flex gap-5 justify-end mt-10 mb-5 md:pr-5">
                    <Button color="gray" onClick={() => setIsOpenModal(false)}>Cancelar</Button>
                    <Button color="secondary" onClick={handleSubmitProduct}>{isEdit ? "Guardar Cambios" : "Registrar Proveedor"}</Button>
                </div>
            </Modal>
            }
        </div>
    )
}

export default ModalProveedor;
