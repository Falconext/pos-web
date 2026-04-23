import React from "react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { Icon } from "@iconify/react";
import { IPropsProducts } from "../ProductModalModel";
import { useProductModalViewModel } from "../useProductModalViewModel";
import { ProductImageUploader } from "./ProductImageUploader";
import { ProductFinancialAnalysis } from "./ProductFinancialAnalysis";
import { ProductStockManager } from "./ProductStockManager";
import { ProductWholesalePricing } from "./ProductWholesalePricing";
import { ProductBasicForm } from "./ProductBasicForm";
import ModalMedicamento from "@/pages/admin/kardex/modal-productos/components/ModalMedicamento";
import ModalLotes from "@/pages/admin/kardex/modal-productos/components/ModalLotes";

export const ProductModalView: React.FC<IPropsProducts> = (props) => {
    const vm = useProductModalViewModel(props);

    if (!vm.isOpenModal) return null;

    return (
        <>
            <Modal
                position="right"
                width={vm.isRestaurante ? "900px" : vm.isFarmacia ? "500px" : "1400px"}
                isOpenModal={vm.isOpenModal}
                height="auto"
                closeModal={vm.closeModal}
                title={vm.isEdit ? `Editar ${vm.labels.titulo}` : `Nuevo ${vm.labels.titulo}`}
                icon="solar:box-minimalistic-bold-duotone"
            >
                <div className={`${vm.isRestaurante ? 'grid-cols-1 md:grid-cols-2' : vm.isFarmacia ? 'flex flex-col gap-6' : 'grid-cols-1 md:grid-cols-3'} grid px-4 gap-5`}>

                    {/* Left Column - Image & Financials */}
                    <div className={vm.isFarmacia ? 'w-full' : ''}>
                        <div className={`mt-5 ${vm.isFarmacia ? 'w-full' : ''}`}>
                            <ProductImageUploader vm={vm} />
                            <ProductFinancialAnalysis vm={vm} />
                        </div>
                    </div>

                    {/* Right Columns - Form & Logistics */}
                    <ProductBasicForm vm={vm} />

                </div>

                {/* Submit Actions */}
                <div className="flex gap-4 px-6 justify-end mt-8 pt-6 mb-5 md:pr-5 border-t border-dashed border-gray-200">
                    <Button color="danger" outline className="" onClick={() => vm.setIsOpenModal(false)}>
                        Cancelar
                    </Button>
                    <Button color="primary" className="px-6" onClick={vm.handleSubmitProduct} disabled={vm.loading}>
                        {vm.loading ? (
                            <div className="flex items-center gap-2">
                                <Icon icon="svg-spinners:180-ring-with-bg" />
                                {vm.isEdit ? "Editando cambios..." : "Guardando..."}
                            </div>
                        ) : (
                            vm.isEdit ? "Editar cambios" : "Crear Producto"
                        )}
                    </Button>
                </div>
            </Modal>

            {/* Nested Drawers */}
            <ModalMedicamento
                isOpen={vm.showMedicamentoModal}
                onClose={() => vm.setShowMedicamentoModal(false)}
                formValues={vm.formValues}
                handleChange={vm.handleChange}
                errors={vm.errors}
            />
            <ModalLotes
                isOpen={vm.showLotesModal}
                onClose={() => vm.setShowLotesModal(false)}
                formValues={vm.formValues}
                isEdit={vm.isEdit}
                creationLote={vm.creationLote}
                setCreationLote={vm.setCreationLote}
            />
        </>
    );
};
