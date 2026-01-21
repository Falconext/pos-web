import React from 'react';
import Modal from '@/components/Modal';
import InputPro from '@/components/InputPro';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';

interface IProps {
    isOpen: boolean;
    onClose: () => void;
    formValues: any;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    errors: any;
}

const ModalMedicamento = ({ isOpen, onClose, formValues, handleChange, errors }: IProps) => {
    return (
        <Modal
            isOpenModal={isOpen}
            closeModal={onClose}
            title="Detalles del Medicamento"
            position="right"
            width="500px"
            icon="solar:pill-bold-duotone"
            height="auto"
            backdropClassName="bg-transparent"
            style={{ marginRight: '510px' }}
        >
            <div className="space-y-6 pt-2 px-4 pt-4 pb-0">
                {/* Información del Medicamento */}
                <div className="p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
                    <h5 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm">
                            <Icon icon="solar:pill-bold-duotone" width={16} className="text-blue-600" />
                        </div>
                        Farmacología
                    </h5>
                    <div className="space-y-4">
                        <InputPro autocomplete="off" value={(formValues as any)?.principioActivo || ''} name="principioActivo" onChange={handleChange} isLabel label="Principio Activo" placeholder="Ej. Paracetamol" />
                        <InputPro autocomplete="off" value={(formValues as any)?.concentracion || ''} name="concentracion" onChange={handleChange} isLabel label="Concentración" placeholder="Ej. 500 mg" />
                        <InputPro autocomplete="off" value={(formValues as any)?.presentacion || ''} name="presentacion" onChange={handleChange} isLabel label="Presentación" placeholder="Ej. Caja x 100" />
                        <InputPro autocomplete="off" value={(formValues as any)?.laboratorio || ''} name="laboratorio" onChange={handleChange} isLabel label="Laboratorio" placeholder="Ej. Bayer" />
                    </div>
                </div>

                {/* Unidades de Compra/Venta */}
                <div className="p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
                    <h5 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm">
                            <Icon icon="solar:box-minimalistic-bold-duotone" width={16} className="text-green-600" />
                        </div>
                        Unidades y Conversión
                    </h5>
                    <div className="space-y-4">
                        <InputPro autocomplete="off" value={(formValues as any)?.unidadCompra || ''} name="unidadCompra" onChange={handleChange} isLabel label="Unidad Compra" placeholder="Ej. CAJA" />
                        <InputPro autocomplete="off" value={(formValues as any)?.unidadVenta || ''} name="unidadVenta" onChange={handleChange} isLabel label="Unidad Venta" placeholder="Ej. BLISTER" />
                        <div>
                            <InputPro autocomplete="off" type="number" value={(formValues as any)?.factorConversion || 1} name="factorConversion" onChange={handleChange} isLabel label="Factor Conversión" placeholder="Ej. 10" />
                            <p className="text-[10px] text-gray-500 mt-1.5 ml-1">
                                Ejemplo: 1 CAJA = 10 BLÍSTER (Factor = 10)
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 justify-end pt-0 mt-auto pb-4">
                    <Button color="black" className="w-full" onClick={onClose}>
                        Confirmar Detalles
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ModalMedicamento;
