
import { useState } from 'react';
import { Icon } from '@iconify/react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    lote: any;
    onSuccess: () => void;
}

const ModalAjusteStockLote = ({ isOpen, onClose, lote, onSuccess }: Props) => {
    const [cantidad, setCantidad] = useState('');
    const [tipo, setTipo] = useState<'INCREMENTO' | 'DECREMENTO'>('INCREMENTO');
    const [motivo, setMotivo] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !lote) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cantidad || Number(cantidad) <= 0) {
            useAlertStore.getState().alert('Ingrese una cantidad válida', 'error');
            return;
        }
        if (!motivo.trim()) {
            useAlertStore.getState().alert('El motivo es obligatorio', 'error');
            return;
        }

        try {
            setLoading(true);
            await apiClient.patch(`/producto/lotes/${lote.id}/ajustar-stock`, {
                productoId: lote.productoId,
                cantidad: Number(cantidad),
                tipo,
                motivo
            });

            useAlertStore.getState().alert('Stock ajustado correctamente', 'success');
            onSuccess();
            onClose();
            // Reset form
            setCantidad('');
            setMotivo('');
            setTipo('INCREMENTO');
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'Error al ajustar stock';
            useAlertStore.getState().alert(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Ajustar Stock de Lote</h2>
                        <p className="text-sm text-gray-500 mt-1">Lote: {lote.lote} - Stock Actual: {lote.stockActual}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Icon icon="solar:close-circle-bold" className="text-gray-400 w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Selector de Tipo */}
                    <div className="grid grid-cols-2 gap-3 p-1 bg-gray-50 rounded-xl border border-gray-100">
                        <button
                            type="button"
                            onClick={() => setTipo('INCREMENTO')}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tipo === 'INCREMENTO'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Icon icon="solar:add-circle-bold" width={18} />
                            Ingreso
                        </button>
                        <button
                            type="button"
                            onClick={() => setTipo('DECREMENTO')}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tipo === 'DECREMENTO'
                                    ? 'bg-orange-600 text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Icon icon="solar:minus-circle-bold" width={18} />
                            Salida
                        </button>
                    </div>

                    {/* Cantidad */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Cantidad a {tipo === 'INCREMENTO' ? 'agregar' : 'quitar'}</label>
                        <div className="relative">
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={cantidad}
                                onChange={(e) => setCantidad(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                placeholder="0"
                                required
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Icon icon="solar:box-minimalistic-bold" width={20} />
                            </div>
                        </div>
                    </div>

                    {/* Motivo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Motivo del ajuste</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                placeholder="Ej: Conteo físico, Merma, Devolución..."
                                required
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Icon icon="solar:notes-bold" width={20} />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 py-2.5 text-sm font-medium text-white rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                                }`}
                        >
                            {loading ? (
                                <Icon icon="line-md:loading-loop" width={20} />
                            ) : (
                                <>
                                    <Icon icon="solar:check-circle-bold" width={18} />
                                    Confirmar Ajuste
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default ModalAjusteStockLote;
