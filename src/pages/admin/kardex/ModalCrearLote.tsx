import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import InputPro from '@/components/InputPro';
import Button from '@/components/Button';
import Select from '@/components/Select';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';
import { useProductsStore } from '@/zustand/products';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    productoIdPrefill?: number;
}

const ModalCrearLote = ({ isOpen, onClose, onSuccess, productoIdPrefill }: Props) => {
    const { products, getAllProducts } = useProductsStore();

    const [formValues, setFormValues] = useState({
        productoId: productoIdPrefill || '',
        lote: '',
        fechaVencimiento: '',
        stockInicial: '',
        costoUnitario: '',
        proveedor: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && (!products || products.length === 0)) {
            getAllProducts({ page: 1, limit: 1000 });
        }
    }, [isOpen]);

    useEffect(() => {
        if (productoIdPrefill) {
            setFormValues(prev => ({ ...prev, productoId: productoIdPrefill }));
        }
    }, [productoIdPrefill]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormValues(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSelectChange = (idValue: any, value: any, name: any) => {
        setFormValues(prev => ({ ...prev, [name]: idValue }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formValues.productoId) newErrors.productoId = 'Selecciona un producto';
        if (!formValues.lote.trim()) newErrors.lote = 'El código de lote es obligatorio';
        if (!formValues.fechaVencimiento) newErrors.fechaVencimiento = 'La fecha de vencimiento es obligatoria';
        if (!formValues.stockInicial || Number(formValues.stockInicial) <= 0) {
            newErrors.stockInicial = 'El stock inicial debe ser mayor a 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            await apiClient.post('/producto/lotes', {
                productoId: Number(formValues.productoId),
                lote: formValues.lote,
                fechaVencimiento: formValues.fechaVencimiento,
                stockInicial: Number(formValues.stockInicial),
                costoUnitario: formValues.costoUnitario ? Number(formValues.costoUnitario) : undefined,
                proveedor: formValues.proveedor || undefined,
            });

            useAlertStore.getState().alert('Lote creado correctamente', 'success');
            setFormValues({
                productoId: productoIdPrefill || '',
                lote: '',
                fechaVencimiento: '',
                stockInicial: '',
                costoUnitario: '',
                proveedor: '',
            });
            onSuccess();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Error al crear lote';
            useAlertStore.getState().alert(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormValues({
            productoId: '',
            lote: '',
            fechaVencimiento: '',
            stockInicial: '',
            costoUnitario: '',
            proveedor: '',
        });
        setErrors({});
        onClose();
    };

    return (
        <Modal
            isOpenModal={isOpen}
            closeModal={handleClose}
            title="Nuevo Lote"
            width="600px"
        >
            <div className="px-4 pb-4">
                <div className="space-y-4">
                    {/* Producto */}
                    <div>
                        <Select
                            defaultValue={formValues.productoId ? products.find(p => p.id === Number(formValues.productoId))?.descripcion : ''}
                            error={errors.productoId}
                            isSearch
                            options={(products || []).map(p => ({
                                id: p.id,
                                value: `${p.codigo} - ${p.descripcion}`,
                            }))}
                            id="productoId"
                            name="productoId"
                            value=""
                            onChange={handleSelectChange}
                            icon="solar:box-bold-duotone"
                            isIcon
                            label="Producto"
                        />
                    </div>

                    {/* Código de Lote */}
                    <div>
                        <InputPro
                            name="lote"
                            value={formValues.lote}
                            onChange={handleChange}
                            error={errors.lote}
                            label="Código de Lote"
                            placeholder="Ej: L2024-001"
                            isLabel
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Código único del lote proporcionado por el proveedor
                        </p>
                    </div>

                    {/* Fecha de Vencimiento */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha de Vencimiento *
                        </label>
                        <input
                            type="date"
                            name="fechaVencimiento"
                            value={formValues.fechaVencimiento}
                            onChange={handleChange}
                            className={`w-full px-3 py-2.5 border ${errors.fechaVencimiento ? 'border-red-500' : 'border-gray-300'
                                } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6A6CFF] focus:border-transparent`}
                            min={new Date().toISOString().split('T')[0]}
                        />
                        {errors.fechaVencimiento && (
                            <p className="text-xs text-red-500 mt-1">{errors.fechaVencimiento}</p>
                        )}
                    </div>

                    {/* Grid con Stock y Costo */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputPro
                                type="number"
                                name="stockInicial"
                                value={formValues.stockInicial}
                                onChange={handleChange}
                                error={errors.stockInicial}
                                label="Stock Inicial"
                                placeholder="Ej: 100"
                                isLabel
                            />
                        </div>
                        <div>
                            <InputPro
                                type="number"
                                step="0.01"
                                name="costoUnitario"
                                value={formValues.costoUnitario}
                                onChange={handleChange}
                                label="Costo Unitario (Opcional)"
                                placeholder="S/ 0.00"
                                isLabel
                            />
                        </div>
                    </div>

                    {/* Proveedor */}
                    <div>
                        <InputPro
                            name="proveedor"
                            value={formValues.proveedor}
                            onChange={handleChange}
                            label="Proveedor (Opcional)"
                            placeholder="Nombre del proveedor"
                            isLabel
                        />
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <Icon icon="solar:info-circle-bold" className="text-blue-600 mt-0.5" width={18} />
                            <div className="text-xs text-blue-800">
                                <p className="font-semibold mb-1">Información importante:</p>
                                <ul className="space-y-1">
                                    <li>• El sistema usará FEFO (First Expire, First Out) automáticamente</li>
                                    <li>• Recibirás alertas cuando el lote esté próximo a vencer</li>
                                    <li>• El stock de este lote se sumará al stock total del producto</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                    <Button
                        color="lila"
                        outline
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        color="secondary"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Icon icon="mdi:loading" className="animate-spin" width={18} />
                                Creando...
                            </>
                        ) : (
                            <>
                                <Icon icon="solar:check-circle-bold" width={18} />
                                Crear Lote
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ModalCrearLote;
