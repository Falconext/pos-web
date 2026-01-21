import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import InputPro from '@/components/InputPro';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import { Calendar } from '@/components/Date';
import moment from 'moment';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';

interface IProps {
    isOpen: boolean;
    onClose: () => void;
    formValues: any;
    isEdit: boolean;
    creationLote: any;
    setCreationLote: (value: any) => void;
}

const ModalLotes = ({ isOpen, onClose, formValues, isEdit, creationLote, setCreationLote }: IProps) => {
    // Estados locales para gestión de lotes (solo edición)
    const [lotes, setLotes] = useState<any[]>([]);
    const [showLoteForm, setShowLoteForm] = useState(false);
    const [loteForm, setLoteForm] = useState({
        lote: '',
        fechaVencimiento: '',
        stockInicial: '',
        costoUnitario: '',
        proveedor: ''
    });
    const [loteErrors, setLoteErrors] = useState<Record<string, string>>({});

    // Cargar lotes al abrir
    useEffect(() => {
        if (isOpen && isEdit && formValues?.productoId) {
            cargarLotesProducto(Number(formValues.productoId));
        }
    }, [isOpen, isEdit, formValues?.productoId]);

    const cargarLotesProducto = async (productoId: number) => {
        try {
            const { data } = await apiClient.get(`/producto/${productoId}/lotes`);
            setLotes(data?.data || data || []);
        } catch (error) {
            console.error('Error al cargar lotes:', error);
        }
    };

    const handleLoteFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setLoteForm(prev => ({ ...prev, [name]: value }));
        setLoteErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateLoteForm = () => {
        const errors: Record<string, string> = {};
        if (!loteForm.lote.trim()) errors.lote = 'El código de lote es obligatorio';
        if (!loteForm.fechaVencimiento) errors.fechaVencimiento = 'La fecha de vencimiento es obligatoria';
        if (!loteForm.stockInicial || Number(loteForm.stockInicial) <= 0) {
            errors.stockInicial = 'El stock inicial debe ser mayor a 0';
        }
        setLoteErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAgregarLote = async () => {
        if (!validateLoteForm()) return;
        if (!formValues.productoId) return;

        try {
            await apiClient.post('/producto/lotes', {
                productoId: Number(formValues.productoId),
                lote: loteForm.lote,
                fechaVencimiento: loteForm.fechaVencimiento,
                stockInicial: Number(loteForm.stockInicial),
                costoUnitario: loteForm.costoUnitario ? Number(loteForm.costoUnitario) : undefined,
                proveedor: loteForm.proveedor || undefined,
            });
            useAlertStore.getState().alert('Lote agregado correctamente', 'success');
            setLoteForm({ lote: '', fechaVencimiento: '', stockInicial: '', costoUnitario: '', proveedor: '' });
            setShowLoteForm(false);
            cargarLotesProducto(Number(formValues.productoId));
        } catch (error: any) {
            const message = error.response?.data?.message || 'Error al agregar lote';
            useAlertStore.getState().alert(message, 'error');
        }
    };

    const calcularDiasParaVencer = (fechaVencimiento: string) => {
        const hoy = new Date();
        const vencimiento = new Date(fechaVencimiento);
        const diferencia = vencimiento.getTime() - hoy.getTime();
        return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
    };

    return (
        <Modal
            isOpenModal={isOpen}
            closeModal={onClose}
            title="Gestión de Lotes"
            position="right"
            width="600px"
            icon="solar:box-minimalistic-bold-duotone"
            height="auto"
            backdropClassName="bg-transparent"
            style={{ marginRight: '510px' }}
        >
            <div className="pt-2">
                {isEdit && formValues.productoId ? (
                    <div className="space-y-4 px-4 pb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-gray-800">Historial de Lotes</h4>
                            <Button
                                color="black"
                                onClick={() => setShowLoteForm(!showLoteForm)}
                                className="text-xs py-2"
                            >
                                <Icon icon={showLoteForm ? "solar:close-circle-bold" : "solar:add-circle-bold"} width={16} className="mr-1" />
                                {showLoteForm ? 'Cancelar' : 'Nuevo Lote'}
                            </Button>
                        </div>

                        {/* Formulario Agregar Lote */}
                        {showLoteForm && (
                            <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300 mb-4 animate-fade-in-down">
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <InputPro name="lote" value={loteForm.lote} onChange={handleLoteFormChange} error={loteErrors.lote} label="Código de Lote" placeholder="L2024-001" isLabel />
                                    <div className="relative">
                                        <Calendar text="Vencimiento *" value={loteForm.fechaVencimiento ? moment(loteForm.fechaVencimiento).format('DD/MM/YYYY') : ''} onChange={(date: string) => {
                                            const [day, month, year] = date.split('/');
                                            setLoteForm(prev => ({ ...prev, fechaVencimiento: `${year}-${month}-${day}` }));
                                            setLoteErrors(prev => ({ ...prev, fechaVencimiento: '' }));
                                        }} name="fechaVencimiento" />
                                        {loteErrors.fechaVencimiento && <p className="text-xs text-red-500 mt-1">{loteErrors.fechaVencimiento}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <InputPro type="number" name="stockInicial" value={loteForm.stockInicial} onChange={handleLoteFormChange} error={loteErrors.stockInicial} label="Stock Inicial" placeholder="100" isLabel />
                                    <InputPro type="number" step="0.01" name="costoUnitario" value={loteForm.costoUnitario} onChange={handleLoteFormChange} label="Costo (Opcional)" placeholder="0.00" isLabel />
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Button outline color="black" onClick={handleAgregarLote}>Guardar Lote</Button>
                                </div>
                            </div>
                        )}

                        {/* Lista de Lotes */}
                        <div className="space-y-3">
                            {lotes.length > 0 ? lotes.map((lote: any) => {
                                const diasRestantes = calcularDiasParaVencer(lote.fechaVencimiento);
                                const isVencido = diasRestantes < 0;
                                const isPorVencer = diasRestantes >= 0 && diasRestantes <= 30;

                                return (
                                    <div key={lote.id} className="p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-300 transition-colors shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-gray-800">{lote.lote}</span>
                                                    {isVencido ? (
                                                        <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">VENCIDO</span>
                                                    ) : isPorVencer ? (
                                                        <span className="text-[10px] px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-bold">{diasRestantes} DÍAS</span>
                                                    ) : (
                                                        <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">VIGENTE</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    Vence: {moment(lote.fechaVencimiento).format('DD/MM/YYYY')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-lg text-gray-900">{lote.stockActual}</div>
                                                <div className="text-[10px] text-gray-400 uppercase font-medium">Stock Actual</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center py-8 text-gray-400">
                                    <Icon icon="solar:box-minimalistic-linear" width={48} className="mx-auto mb-2 opacity-30" />
                                    No hay lotes registrados
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className='px-4 pt-2'>
                        <div className="p-6 rounded-xl border border-dashed border-indigo-200 bg-[#FCFDFD]">
                            <h5 className="font-bold text-gray-900 mb-2">Lote Inicial</h5>
                            <p className="text-sm text-gray-500 mb-6">Registra el primer lote junto con la creación del producto.</p>

                            <div className="space-y-4">
                                <InputPro
                                    name="lote"
                                    value={creationLote.lote}
                                    onChange={(e) => setCreationLote({ ...creationLote, lote: e.target.value })}
                                    label="Código Lote"
                                    placeholder="Ej: L2024-001"
                                    isLabel
                                />
                                <div className="relative">
                                    <Calendar
                                        text="Fecha Vencimiento"
                                        value={creationLote.fechaVencimiento ? moment(creationLote.fechaVencimiento).format('DD/MM/YYYY') : ''}
                                        onChange={(date: string) => {
                                            const [day, month, year] = date.split('/');
                                            setCreationLote({ ...creationLote, fechaVencimiento: `${year}-${month}-${day}` });
                                        }}
                                        name="fechaVencimiento"
                                    />
                                </div>
                            </div>

                        </div>
                        <div className="mt-6 flex justify-end pb-4">
                            <Button color="black" className="w-full" onClick={onClose}>Confirmar Lote Inicial</Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ModalLotes;
