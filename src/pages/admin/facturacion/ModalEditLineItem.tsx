import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import InputPro from "@/components/InputPro";
import Button from "@/components/Button";

interface IProps {
    isOpen: boolean;
    onClose: () => void;
    item: any;
    onSave: (newData: any) => void;
}

const ModalEditLineItem = ({ isOpen, onClose, item, onSave }: IProps) => {
    const [formValues, setFormValues] = useState<any>({
        precioUnitario: 0,
        cantidad: 0,
        descuento: 0,
        descripcion: ""
    });

    useEffect(() => {
        if (item) {
            setFormValues({
                precioUnitario: Number(item.precioUnitario),
                cantidad: Number(item.cantidad),
                descuento: Number(item.descuento || 0),
                descripcion: item.descripcion
            });
        }
    }, [item]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormValues({ ...formValues, [name]: value });
    };

    const handleSubmit = () => {
        onSave({
            ...item,
            precioUnitario: Number(formValues.precioUnitario),
            cantidad: Number(formValues.cantidad),
            descuento: Number(formValues.descuento),
            descripcion: formValues.descripcion
        });
        onClose();
    };

    return (
        <Modal isOpenModal={isOpen} closeModal={onClose} title="Editar Item" width="500px">
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">Descripción del Producto</label>
                    <InputPro
                        name="descripcion"
                        value={formValues.descripcion}
                        onChange={handleChange}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1">Precio Unitario (S/)</label>
                        <InputPro
                            name="precioUnitario"
                            type="number"
                            value={formValues.precioUnitario}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1">Cantidad</label>
                        <InputPro
                            name="cantidad"
                            type="number"
                            value={formValues.cantidad}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1">Descuento (%)</label>
                        <InputPro
                            name="descuento"
                            type="number"
                            value={formValues.descuento}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button color="secondary" outline onClick={onClose}>Cancelar</Button>
                    <Button color="primary" onClick={handleSubmit}>Guardar</Button>
                </div>
            </div>
        </Modal>
    );
};

export default ModalEditLineItem;
