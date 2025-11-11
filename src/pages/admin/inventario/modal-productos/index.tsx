import { ChangeEvent, Dispatch, useEffect } from "react"
import Modal from "@/components/Modal"
import Select from "@/components/Select"
import { ICategory } from "@/interfaces/categories"
import { IFormProduct } from "@/interfaces/products"
import { useCategoriesStore } from "@/zustand/categories"
import { IExtentionsState, useExtentionsStore } from "@/zustand/extentions"
import { IProductsState, useProductsStore } from "@/zustand/products"
import { useAuthStore } from "@/zustand/auth"
import InputPro from "@/components/InputPro"
import Button from "@/components/Button"

interface IPropsProducts {
    formValues: IFormProduct
    isOpenModal: boolean
    setErrors: any
    closeModal: any
    isEdit: boolean
    errors: any
    setFormValues: any
    setIsOpenModal: Dispatch<boolean>
    initialForm: IFormProduct
    isInvoice?: boolean
    setSelectProduct?: any
}

const afectaciones = [
    { id: "10", value: "Gravado - Operación Onerosa" },
    { id: "20", value: "Exonerado" },
    { id: "30", value: "Inafecto" },
    { id: "40", value: "Exportación" }
]

const ModalProduct = ({ setSelectProduct, isInvoice, initialForm, formValues, setErrors, isOpenModal, setFormValues, closeModal, isEdit, errors, setIsOpenModal }: IPropsProducts) => {

    const { getUnitOfMeasure }: IExtentionsState = useExtentionsStore();
    const { auth } = useAuthStore();
    const { getAllCategories } = useCategoriesStore();
    const { editProduct, addProduct, getCodeProduct, productCode }: IProductsState = useProductsStore();
    const { unitOfMeasure }: IExtentionsState = useExtentionsStore();
    const { categories } = useCategoriesStore();

    const validateForm = () => {
        const newErrors: any = {
            // codigo: formValues?.codigo && formValues?.codigo.trim() !== "" ? "" : "El código del producto es obligatorio",
            descripcion: formValues?.descripcion && formValues?.descripcion.trim() !== "" ? "" : "El código del producto es obligatorio",
            precioUnitario: formValues?.precioUnitario && Number(formValues?.precioUnitario) > 0 ? "" : "El producto debe tener un precio",
            stock: formValues?.stock && Number(formValues?.stock) > 0 ? "" : "El producto debe tener un stock"
        };
        setErrors(newErrors);
        return Object.values(newErrors).every((error) => !error); // Retorna `true` si no hay errores
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormValues({
            ...formValues,
            [name]: value
        });
    };

    const handleChangeSelect = (idValue: any, value: any, name: any, id: any) => {
        setFormValues({
            ...formValues,
            [name]: value,
            [id]: idValue,
        });
    }

    console.log(auth)

    console.log(formValues)

    useEffect(() => {
        getUnitOfMeasure();

        getAllCategories({
        });
    }, [])

    useEffect(() => {
        if (auth !== null) {
            console.log(auth)
            getCodeProduct(auth?.empresaId)
        }
    }, [auth])

    const handleSubmitProduct = async () => {
        console.log(formValues)
        if (!validateForm()) {
            return;
        }
        if (Number(formValues?.productoId) !== 0 && isEdit) {
            editProduct({
                ...formValues,
                unidadMedidaId: Number(formValues?.unidadMedidaId),
                categoriaId: formValues?.categoriaId === "" ? null : Number(formValues?.categoriaId),
                precioUnitario: Number(formValues?.precioUnitario),
                stock: Number(formValues.stock),
            });
            setFormValues(initialForm)
            closeModal();
        } else {
            const product = await addProduct({
                ...formValues,
                unidadMedidaId: Number(formValues?.unidadMedidaId),
                categoriaId: formValues?.categoriaId === "" ? null : Number(formValues?.categoriaId),
                precioUnitario: Number(formValues?.precioUnitario),
                stock: Number(formValues.stock),
                estado: "ACTIVO"
            });
            setFormValues(initialForm)
            console.log(product)
            if (isInvoice) {
                setSelectProduct(product.data)
            }

            closeModal();
        }
    }


    useEffect(() => {
        if (!isEdit) {
            setFormValues({
                ...formValues,
                codigo: productCode
            })
        }
    }, [productCode])

    console.log(formValues)

    return (
        <>
            {isOpenModal && <Modal width="750px" isOpenModal={isOpenModal} closeModal={closeModal} title={isEdit ? "Editar producto" : "Nuevo producto"}>
                <div className="md:px-6 px-3 grid md:grid-cols-2 grid-cols-2 mt-5 md:gap-5 gap-y-2">
                    <div className="col-span-3 md:col-span-1">
                        <InputPro autocomplete="off" error={errors.codigo} value={formValues?.codigo} name="codigo" onChange={handleChange} isLabel label="Codigo de producto" />
                    </div>
                    <div className="col-span-3 md:col-span-1">
                        <InputPro autocomplete="off" value={formValues?.descripcion} error={errors.descripcion} name="descripcion" onChange={handleChange} isLabel label="Nombre del producto" />
                    </div>
                    <div className="col-span-3 md:col-span-1">
                        <Select defaultValue={formValues.afectacionNombre || "Gravado - operación onerosa"} error={""} isSearch options={afectaciones} id="tipoAfectacionIGV" name="afectacionNombre" value="" onChange={handleChangeSelect} icon="clarity:box-plot-line" isIcon label="Tipo de afectvación" />
                    </div>

                    <div className="col-span-3 md:col-span-1">
                        <Select defaultValue={formValues?.unidadMedidaNombre} error={""} isSearch options={unitOfMeasure?.map((item: ICategory) => ({
                            id: item?.id,
                            value: `${item?.nombre}`
                        }))} id="unidadMedidaId" name="unidadMedidaNombre" value="" onChange={handleChangeSelect} icon="clarity:box-plot-line" isIcon label="Unidad de medida" />
                    </div>
                    <div className="col-span-3 md:col-span-1">
                        <Select defaultValue={formValues.categoriaNombre} error={""} isSearch options={categories?.map((item: ICategory) => ({
                            id: item?.id,
                            value: `${item?.nombre}`
                        }))} id="categoriaId" name="categoriaNombre" value="" onChange={handleChangeSelect} icon="clarity:box-plot-line" isIcon label="Categoria" />
                    </div>
                    <div className="col-start-1 col-end-2 md:col-span-1">
                        <InputPro autocomplete="off" value={formValues?.precioUnitario} error={errors.precioUnitario} name="precioUnitario" onChange={handleChange} isLabel label="Precio del producto" />
                    </div>
                    <div className="col-start-2 col-end-3 md:col-span-1">
                        <InputPro autocomplete="off" value={formValues?.stock} error={errors.stock} name="stock" onChange={handleChange} isLabel label="Stock" />
                    </div>
                </div>
                <div className="flex gap-5 justify-end mt-10 mb-5 md:pr-5 pt-5">
                    <Button color="black" outline onClick={() => setIsOpenModal(false)}>Cancelar</Button>
                    <Button color="secondary" onClick={handleSubmitProduct}>{isEdit ? "Editar" : "Guardar"}</Button>
                </div>
            </Modal>
            }
        </>
    )
}

export default ModalProduct