import { ChangeEvent, Dispatch, useEffect, useState } from "react"
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
import { Icon } from "@iconify/react"

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

    const [newWholesaleRow, setNewWholesaleRow] = useState({ cantidadMinima: '', precio: '' });
    const [wholesaleFocused, setWholesaleFocused] = useState<'cantidadMinima' | 'precio' | null>(null);

    const validateForm = () => {
        const newErrors: any = {
            descripcion: formValues?.descripcion && formValues?.descripcion.trim() !== "" ? "" : "El nombre del producto es obligatorio",
            precioUnitario: formValues?.precioUnitario && Number(formValues?.precioUnitario) > 0 ? "" : "El producto debe tener un precio",
            stock: formValues?.stock && Number(formValues?.stock) > 0 ? "" : "El producto debe tener un stock"
        };
        setErrors(newErrors);
        return Object.values(newErrors).every((error) => !error);
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

    useEffect(() => {
        getUnitOfMeasure();
        getAllCategories({});
    }, [])

    useEffect(() => {
        if (auth !== null) {
            getCodeProduct(auth?.empresaId)
        }
    }, [auth])

    const handleSubmitProduct = async () => {
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

    const wholesaleRules: { cantidadMinima: number; precio: number }[] = formValues.preciosMayorista || [];

    const handleAddWholesaleRow = () => {
        if (!newWholesaleRow.cantidadMinima || !newWholesaleRow.precio) return;
        setFormValues({
            ...formValues,
            preciosMayorista: [
                ...wholesaleRules,
                { cantidadMinima: Number(newWholesaleRow.cantidadMinima), precio: Number(newWholesaleRow.precio) }
            ]
        });
        setNewWholesaleRow({ cantidadMinima: '', precio: '' });
    };

    const handleRemoveWholesaleRow = (idx: number) => {
        setFormValues({
            ...formValues,
            preciosMayorista: wholesaleRules.filter((_, i) => i !== idx)
        });
    };

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
                        <Select defaultValue={formValues.afectacionNombre || "Gravado - operación onerosa"} error={""} isSearch options={afectaciones} id="tipoAfectacionIGV" name="afectacionNombre" value="" onChange={handleChangeSelect} icon="clarity:box-plot-line" isIcon label="Tipo de afectación" />
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

                {/* Precios por Mayorista */}
                <div className="md:px-6 px-3 mt-6">
                    <div className="rounded-xl border border-gray-100 dark:border-slate-700/60 bg-gradient-to-br from-white to-gray-50/50 dark:from-slate-800/60 dark:to-slate-900/40 p-4">
                        {/* Header */}
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-sm flex-shrink-0">
                                <Icon icon="solar:tag-price-bold-duotone" className="text-white" width={16} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-none">Precios por Mayorista</h4>
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Define rangos de precio según cantidad</p>
                            </div>
                            {wholesaleRules.length > 0 && (
                                <span className="text-[11px] font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                                    {wholesaleRules.length} nivel{wholesaleRules.length > 1 ? 'es' : ''}
                                </span>
                            )}
                        </div>

                        {/* Tiers */}
                        {wholesaleRules.length > 0 ? (
                            <div className="space-y-1.5 mb-3">
                                {[...wholesaleRules].sort((a, b) => a.cantidadMinima - b.cantidadMinima).map((rule, idx) => {
                                    const baseP = Number(formValues.precioUnitario) || 0;
                                    const disc = baseP > 0 ? Math.round((1 - rule.precio / baseP) * 100) : 0;
                                    const originalIdx = wholesaleRules.findIndex(r => r.cantidadMinima === rule.cantidadMinima && r.precio === rule.precio);
                                    return (
                                        <div key={idx} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/60 hover:border-green-200 dark:hover:border-green-800/60 transition-colors group">
                                            <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                                                <span className="text-[9px] font-bold text-green-700 dark:text-green-400">{idx + 1}</span>
                                            </div>
                                            <div className="flex-1 flex items-baseline gap-1.5">
                                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{rule.cantidadMinima}+ u</span>
                                                <Icon icon="solar:arrow-right-linear" width={11} className="text-gray-400" />
                                                <span className="text-sm font-bold text-green-700 dark:text-green-400">S/ {Number(rule.precio).toFixed(2)}</span>
                                                {disc > 0 && baseP > 0 && (
                                                    <span className="text-[10px] text-green-500 font-medium">(-{disc}%)</span>
                                                )}
                                            </div>
                                            <button type="button" onClick={() => handleRemoveWholesaleRow(originalIdx)}
                                                className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                                                <Icon icon="solar:trash-bin-2-linear" width={13} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="mb-3 py-4 flex flex-col items-center rounded-xl border border-dashed border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/20">
                                <Icon icon="solar:tag-price-linear" width={22} className="text-gray-300 dark:text-gray-600 mb-1" />
                                <p className="text-xs text-gray-400 dark:text-gray-500">Sin niveles configurados</p>
                            </div>
                        )}

                        <div className={`flex gap-2 p-3 rounded-xl border transition-all ${wholesaleFocused ? 'border-blue-300 dark:border-blue-600 bg-blue-50/30 dark:bg-blue-900/10' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/40'}`}>
                            {/* Cantidad mínima */}
                            <div className="flex-1">
                                <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 ml-0.5">
                                    Cant. mínima
                                </label>
                                <div className={`flex items-center gap-1.5 border rounded-lg px-2 py-1.5 transition-colors ${wholesaleFocused === 'cantidadMinima' ? 'border-blue-400 dark:border-blue-500' : 'border-gray-200 dark:border-slate-600'} bg-white dark:bg-slate-800`}>
                                    <Icon icon="solar:box-minimalistic-linear" width={13} className="text-gray-400 flex-shrink-0" />
                                    <input
                                        type="number"
                                        placeholder="Ej. 12"
                                        min="1"
                                        className="w-full focus:outline-none rounded-none text-sm bg-transparent outline-none text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-600"
                                        value={newWholesaleRow.cantidadMinima}
                                        onFocus={() => setWholesaleFocused('cantidadMinima')}
                                        onBlur={() => setWholesaleFocused(null)}
                                        onChange={(e) => setNewWholesaleRow({ ...newWholesaleRow, cantidadMinima: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddWholesaleRow()}
                                    />
                                </div>
                            </div>
                            {/* Precio */}
                            <div className="flex-1">
                                <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 ml-0.5">
                                    Precio (S/)
                                </label>
                                <div className={`flex items-center gap-1.5 border rounded-lg px-2 py-1.5 transition-colors ${wholesaleFocused === 'precio' ? 'border-blue-400 dark:border-blue-500' : 'border-gray-200 dark:border-slate-600'} bg-white dark:bg-slate-800`}>
                                    <span className="text-xs font-semibold text-gray-400 flex-shrink-0">S/</span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        step="0.01"
                                        className="w-full text-sm bg-transparent outline-none text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-600"
                                        value={newWholesaleRow.precio}
                                        onFocus={() => setWholesaleFocused('precio')}
                                        onBlur={() => setWholesaleFocused(null)}
                                        onChange={(e) => setNewWholesaleRow({ ...newWholesaleRow, precio: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddWholesaleRow()}
                                    />
                                    {newWholesaleRow.precio && Number(formValues?.precioUnitario) > 0 && (
                                        <span className={`text-[10px] font-bold flex-shrink-0 ${Math.round((1 - Number(newWholesaleRow.precio) / Number(formValues.precioUnitario)) * 100) > 0 ? 'text-green-500' : 'text-red-400'}`}>
                                            {Math.round((1 - Number(newWholesaleRow.precio) / Number(formValues.precioUnitario)) * 100) > 0 ? '-' : '+'}
                                            {Math.abs(Math.round((1 - Number(newWholesaleRow.precio) / Number(formValues.precioUnitario)) * 100))}%
                                        </span>
                                    )}
                                </div>
                            </div>
                            {/* Add button */}
                            <div className="flex flex-col justify-end">
                                <button
                                    type="button"
                                    onClick={handleAddWholesaleRow}
                                    disabled={!newWholesaleRow.cantidadMinima || !newWholesaleRow.precio}
                                    className="h-[34px] px-3 flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white disabled:text-gray-400 dark:disabled:text-gray-500 rounded-lg text-xs font-semibold transition-all shadow-sm disabled:shadow-none mt-[22px]"
                                >
                                    <Icon icon="mdi:plus" width={16} />
                                    <span className="hidden sm:inline">Agregar</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-5 justify-end mt-6 mb-5 md:pr-5 pt-5">
                        <Button color="black" outline onClick={() => setIsOpenModal(false)}>Cancelar</Button>
                        <Button color="secondary" onClick={handleSubmitProduct}>{isEdit ? "Editar" : "Guardar"}</Button>
                    </div>
                </div>
            </Modal>
            }
        </>
    )
}

export default ModalProduct
