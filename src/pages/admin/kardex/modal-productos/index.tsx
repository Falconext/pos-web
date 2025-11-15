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

    // Estados para manejar ajustes de stock
    const [tipoAjusteStock, setTipoAjusteStock] = useState<'ninguno' | 'reemplazar' | 'sumar' | 'restar'>('ninguno');
    const [cantidadAjuste, setCantidadAjuste] = useState<number>(0);
    const [stockOriginal] = useState<number>(formValues?.stock || 0);

    const validateForm = () => {
        const newErrors: any = {
            // codigo: formValues?.codigo && formValues?.codigo.trim() !== "" ? "" : "El código del producto es obligatorio",
            descripcion: formValues?.descripcion && formValues?.descripcion.trim() !== "" ? "" : "El código del producto es obligatorio",
            precioUnitario: formValues?.precioUnitario && Number(formValues?.precioUnitario) > 0 ? "" : "El producto debe tener un precio",
            // En edición, el stock se gestiona con los controles de ajuste; no exigir este campo.
            stock: !isEdit ? (formValues?.stock && Number(formValues?.stock) > 0 ? "" : "El producto debe tener un stock") : ""
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

        // Calcular el stock final basado en el tipo de ajuste
        let stockFinal = Number(formValues?.stock);
        if (isEdit && tipoAjusteStock !== 'ninguno') {
            switch (tipoAjusteStock) {
                case 'reemplazar':
                    stockFinal = cantidadAjuste;
                    break;
                case 'sumar':
                    stockFinal = stockOriginal + cantidadAjuste;
                    break;
                case 'restar':
                    stockFinal = Math.max(0, stockOriginal - cantidadAjuste);
                    break;
                default:
                    stockFinal = stockOriginal;
            }
        }

        if (Number(formValues?.productoId) !== 0 && isEdit) {
            editProduct({
                ...formValues,
                unidadMedidaId: Number(formValues?.unidadMedidaId),
                categoriaId: formValues?.categoriaId === "" ? null : Number(formValues?.categoriaId),
                precioUnitario: Number(formValues?.precioUnitario),
                costoUnitario: formValues?.costoUnitario ? Number(formValues?.costoUnitario) : undefined,
                stock: stockFinal,
                stockMinimo: formValues?.stockMinimo != null ? Number(formValues?.stockMinimo) : undefined,
                stockMaximo: formValues?.stockMaximo != null ? Number(formValues?.stockMaximo) : undefined,
            });
            setFormValues(initialForm)
            closeModal();
        } else {
            const product = await addProduct({
                ...formValues,
                unidadMedidaId: Number(formValues?.unidadMedidaId),
                categoriaId: formValues?.categoriaId === "" ? null : Number(formValues?.categoriaId),
                precioUnitario: Number(formValues?.precioUnitario),
                costoUnitario: formValues?.costoUnitario ? Number(formValues?.costoUnitario) : undefined,
                stock: Number(formValues.stock),
                stockMinimo: formValues?.stockMinimo != null ? Number(formValues?.stockMinimo) : undefined,
                stockMaximo: formValues?.stockMaximo != null ? Number(formValues?.stockMaximo) : undefined,
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
            {isOpenModal && <Modal width="1400px" isOpenModal={isOpenModal} closeModal={closeModal} title={`${isEdit ? `Editar Producto ${formValues?.descripcion}` : 'Nuevo Producto'} - Gestión Completa`}>
                <div className="grid-cols-3 grid px-4 gap-5">
                    <div className="md:px-2 px-3 col-span-2 grid md:grid-cols-2 grid-cols-2 mt-5 md:gap-5 gap-y-2">
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
                        <div className="col-span-3 md:col-span-1 grid grid-cols-2 gap-5">
                            <InputPro
                                autocomplete="off"
                                type="number"
                                step="0.01"
                                value={formValues?.precioUnitario}
                                error={errors.precioUnitario}
                                name="precioUnitario"
                                onChange={handleChange}
                                isLabel
                                label="Precio de Venta (S/)"
                            />
                            <InputPro
                                autocomplete="off"
                                type="number"
                                step="0.01"
                                value={formValues?.costoUnitario || ''}
                                name="costoUnitario"
                                onChange={handleChange}
                                isLabel
                                label="Costo Unitario (S/)"
                                placeholder="Costo de compra/producción"
                            />
                        </div>
                        {/* Stock Management */}
                        <div className="col-span-2">
                            <div className="p-4 rounded-lg border border-gray-200">
                                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Icon icon="mdi:cube-outline" width={16} height={16} />
                                    Gestión de Inventario
                                </h5>

                                {isEdit ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="bg-white p-3 rounded-lg border border-blue-100">
                                                <div className="text-lg font-bold text-blue-600">{stockOriginal}</div>
                                                <div className="text-xs text-gray-600">Stock Actual</div>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg border border-green-100">
                                                <div className="text-lg font-bold text-green-600">
                                                    {tipoAjusteStock === 'ninguno' ? stockOriginal :
                                                        tipoAjusteStock === 'reemplazar' ? cantidadAjuste :
                                                            tipoAjusteStock === 'sumar' ? stockOriginal + cantidadAjuste :
                                                                tipoAjusteStock === 'restar' ? Math.max(0, stockOriginal - cantidadAjuste) : stockOriginal
                                                    }
                                                </div>
                                                <div className="text-xs text-gray-600">Stock Resultante</div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de Ajuste</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {[
                                                        { value: 'ninguno', label: 'Sin cambios', color: 'bg-gray-100 text-gray-700' },
                                                        { value: 'reemplazar', label: 'Reemplazar stock', color: 'bg-blue-100 text-blue-700' },
                                                        { value: 'sumar', label: 'Agregar inventario', color: 'bg-green-100 text-green-700' },
                                                        { value: 'restar', label: 'Quitar inventario', color: 'bg-red-100 text-red-700' }
                                                    ].map((tipo) => (
                                                        <button
                                                            key={tipo.value}
                                                            type="button"
                                                            onClick={() => setTipoAjusteStock(tipo.value as any)}
                                                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${tipoAjusteStock === tipo.value
                                                                    ? tipo.color + ' ring-2 ring-offset-2 ring-blue-400'
                                                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                                                }`}
                                                        >
                                                            {tipo.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {tipoAjusteStock !== 'ninguno' && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                                        {tipoAjusteStock === 'reemplazar' ? 'Nuevo stock total:' :
                                                            tipoAjusteStock === 'sumar' ? 'Cantidad a agregar:' :
                                                                'Cantidad a quitar:'}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={cantidadAjuste}
                                                        onChange={(e) => setCantidadAjuste(Number(e.target.value))}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="Ingrese la cantidad"
                                                    />
                                                </div>
                                            )}

                                            {tipoAjusteStock !== 'ninguno' && (
                                                <div className="text-xs text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                                                    <Icon icon="mdi:information" className="inline mr-1" width={14} height={14} />
                                                    Este ajuste se registrará automáticamente en el kardex como movimiento de inventario.
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                <InputPro
                                                    autocomplete="off"
                                                    type="number"
                                                    value={formValues?.stockMinimo ?? ''}
                                                    name="stockMinimo"
                                                    onChange={handleChange}
                                                    isLabel
                                                    label="Stock mínimo"
                                                    placeholder="Ej. 5"
                                                />
                                                <InputPro
                                                    autocomplete="off"
                                                    type="number"
                                                    value={formValues?.stockMaximo ?? ''}
                                                    name="stockMaximo"
                                                    onChange={handleChange}
                                                    isLabel
                                                    label="Stock máximo (opcional)"
                                                    placeholder="Ej. 100"
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <InputPro
                                            autocomplete="off"
                                            type="number"
                                            value={formValues?.stock}
                                            error={errors.stock}
                                            name="stock"
                                            onChange={handleChange}
                                            isLabel
                                            label="Stock Inicial"
                                            placeholder="Cantidad inicial en inventario"
                                        />
                                        <div className="grid grid-cols-2 gap-4 mt-3">
                                            <InputPro
                                                autocomplete="off"
                                                type="number"
                                                value={formValues?.stockMinimo ?? ''}
                                                name="stockMinimo"
                                                onChange={handleChange}
                                                isLabel
                                                label="Stock mínimo"
                                                placeholder="Ej. 5"
                                            />
                                            <InputPro
                                                autocomplete="off"
                                                type="number"
                                                value={formValues?.stockMaximo ?? ''}
                                                name="stockMaximo"
                                                onChange={handleChange}
                                                isLabel
                                                label="Stock máximo (opcional)"
                                                placeholder="Ej. 100"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                    <div>

                        {/* Análisis Financiero en Tiempo Real */}
                        {(Number(formValues?.precioUnitario || 0) > 0 || Number(formValues?.costoUnitario || 0) > 0 || Number(formValues?.stock || 0) > 0) && (
                            <div className="col-span-2 mt-4 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-1 bg-blue-500 rounded-lg">
                                        <Icon icon="mdi:chart-line" className="text-white" width={20} height={20} />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900">Análisis Financiero</h4>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-4">
                                    {/* Precio de Venta */}
                                    <div className="bg-white p-3 rounded-lg border border-blue-100 text-center">
                                        <div className="text-2xl font-bold text-gray-600">
                                            S/ {Number(formValues?.precioUnitario || 0).toFixed(2)}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1 font-medium">Precio Venta</div>
                                    </div>

                                    {/* Costo Unitario */}
                                    <div className="bg-white p-3 rounded-lg border border-green-100 text-center">
                                        <div className="text-2xl font-bold text-gray-600">
                                            S/ {Number(formValues?.costoUnitario || 0).toFixed(2)}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1 font-medium">Costo Unitario</div>
                                    </div>

                                    {/* Ganancia por Unidad */}
                                    <div className="bg-white p-3 rounded-lg border border-purple-100 text-center">
                                        <div className={`text-2xl font-bold ${(Number(formValues?.precioUnitario || 0) - Number(formValues?.costoUnitario || 0)) > 0
                                                ? 'text-green-600'
                                                : 'text-red-500'
                                            }`}>
                                            S/ {(Number(formValues?.precioUnitario || 0) - Number(formValues?.costoUnitario || 0)).toFixed(2)}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1 font-medium">Ganancia/Unidad</div>
                                    </div>

                                    {/* Margen de Ganancia */}
                                    <div className="bg-white p-3 rounded-lg border border-orange-100 text-center">
                                        <div className={`text-2xl font-bold ${(() => {
                                                const precio = Number(formValues?.precioUnitario || 0);
                                                const costo = Number(formValues?.costoUnitario || 0);
                                                if (precio > 0 && costo > 0) {
                                                    const margen = ((precio - costo) / precio * 100);
                                                    return margen > 0 ? 'text-orange-600' : 'text-red-500';
                                                }
                                                return 'text-gray-400';
                                            })()
                                            }`}>
                                            {(() => {
                                                const precio = Number(formValues?.precioUnitario || 0);
                                                const costo = Number(formValues?.costoUnitario || 0);
                                                if (precio > 0 && costo > 0) {
                                                    const margen = ((precio - costo) / precio * 100);
                                                    return `${margen.toFixed(1)}%`;
                                                }
                                                return '0.0%';
                                            })()}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1 font-medium">Margen</div>
                                    </div>
                                </div>

                                {/* Proyecciones */}
                                {(() => {
                                    const stockParaProyeccion = isEdit && tipoAjusteStock !== 'ninguno'
                                        ? (tipoAjusteStock === 'reemplazar' ? cantidadAjuste :
                                            tipoAjusteStock === 'sumar' ? stockOriginal + cantidadAjuste :
                                                tipoAjusteStock === 'restar' ? Math.max(0, stockOriginal - cantidadAjuste) : stockOriginal)
                                        : Number(formValues?.stock || 0);

                                    return stockParaProyeccion > 0 && Number(formValues?.precioUnitario || 0) > 0 && Number(formValues?.costoUnitario || 0) > 0 && (
                                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                                            <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                <Icon icon="mdi:calculator" width={16} height={16} />
                                                Proyección con Stock {isEdit && tipoAjusteStock !== 'ninguno' ? 'Resultante' : 'Actual'}
                                            </h5>
                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div className="text-center">
                                                    <div className="font-bold text-gray-600">
                                                        S/ {(Number(formValues?.precioUnitario || 0) * stockParaProyeccion).toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">Valor Total Venta</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="font-bold text-green-600">
                                                        S/ {(Number(formValues?.costoUnitario || 0) * stockParaProyeccion).toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">Inversión Total</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="font-bold text-blue-600">
                                                        S/ {((Number(formValues?.precioUnitario || 0) - Number(formValues?.costoUnitario || 0)) * stockParaProyeccion).toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">Ganancia Potencial</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Notas importantes */}
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <Icon icon="mdi:information" className="text-red-600 mt-0.5" width={16} height={16} />
                                        <div className="text-xs text-red-800">
                                            <p className="font-semibold mb-1">Notas importantes:</p>
                                            <ul className="space-y-1 text-xs">
                                                <li>• Al cambiar el stock se registrará automáticamente un movimiento en kardex</li>
                                                <li>• El costo unitario ayuda a calcular el margen de ganancia real</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-5 justify-end mt-5 mb-5 md:pr-5">
                    <Button color="black" outline onClick={() => setIsOpenModal(false)}>Cancelar</Button>
                    <Button color="secondary" onClick={handleSubmitProduct}>{isEdit ? "Editar" : "Guardar"}</Button>
                </div>
            </Modal>
            }
        </>
    )
}

export default ModalProduct