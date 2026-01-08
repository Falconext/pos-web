import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import moment from 'moment';
import { useComprasStore } from '@/zustand/compras';

interface ModalHistorialPagosCompraProps {
    compra: any; // ICompra
    onClose: () => void;
}

const ModalHistorialPagosCompra = ({ compra, onClose }: ModalHistorialPagosCompraProps) => {
    const { getHistorialPagos } = useComprasStore();
    const [pagos, setPagos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPagado, setTotalPagado] = useState(0);

    useEffect(() => {
        const fetchPagos = async () => {
            try {
                setLoading(true);
                const result: any = await getHistorialPagos(compra.id);
                if (result.success || Array.isArray(result)) { // Adjust based on API structure
                    // Assuming result is { success: true, pagos: [], totalPagado: number } or just [pagos]
                    // Let's assume standard response structure
                    let pagosList = result.pagos || (Array.isArray(result) ? result : []);
                    if (!Array.isArray(pagosList)) pagosList = [];
                    setPagos(pagosList);

                    // Calculate total locally if not provided
                    const total = result.totalPagado ?? pagosList.reduce((sum: number, p: any) => sum + Number(p.monto), 0);
                    setTotalPagado(total);
                }
            } catch (error) {
                console.error('Error fetching pagos:', error);
            } finally {
                setLoading(false);
            }
        };

        if (compra?.id) {
            fetchPagos();
        }
    }, [compra?.id, getHistorialPagos]);

    const totalCompra = Number(compra?.total || 0);
    const saldoPendiente = Number(compra?.saldo || 0);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-[#111] p-4 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <Icon icon="solar:history-bold-duotone" className="text-2xl" />
                        </div>
                        <div>
                            <h3 className="font-bold">Historial de Pagos (Compras)</h3>
                            <p className="text-sm text-white/70">
                                {compra?.serie}-{compra?.numero}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white">
                        <Icon icon="mdi:close" className="text-xl" />
                    </button>
                </div>

                {/* Info de la Compra */}
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500">Proveedor</p>
                            <p className="font-medium text-gray-900">{compra?.proveedor?.nombre || 'Sin nombre'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Fecha Emisión</p>
                            <p className="font-medium text-gray-900">{moment(compra?.fechaEmision).format('DD/MM/YYYY')}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Total</p>
                            <p className="font-medium text-gray-900">S/ {totalCompra.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Saldo</p>
                            <p className={`font-bold ${saldoPendiente > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                S/ {saldoPendiente.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Resumen de Pagos */}
                <div className="p-4 border-b border-gray-100">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-blue-600 mb-1">Total Compra</p>
                            <p className="text-lg font-bold text-blue-700">S/ {totalCompra.toFixed(2)}</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-green-600 mb-1">Total Pagado</p>
                            <p className="text-lg font-bold text-green-700">S/ {totalPagado.toFixed(2)}</p>
                        </div>
                        <div className={`${saldoPendiente > 0 ? 'bg-orange-50' : 'bg-emerald-50'} rounded-xl p-3 text-center`}>
                            <p className={`text-xs ${saldoPendiente > 0 ? 'text-orange-600' : 'text-emerald-600'} mb-1`}>Saldo Pendiente</p>
                            <p className={`text-lg font-bold ${saldoPendiente > 0 ? 'text-orange-700' : 'text-emerald-700'}`}>
                                S/ {saldoPendiente.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Lista de Pagos */}
                <div className="flex-1 overflow-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : pagos.length === 0 ? (
                        <div className="text-center py-8">
                            <Icon icon="solar:wallet-money-linear" className="text-5xl text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No hay pagos registrados</p>
                            <p className="text-sm text-gray-400 mt-1">Esta compra aún no tiene pagos.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pagos.map((pago: any, index: number) => (
                                <div
                                    key={pago.id || index}
                                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <Icon icon="solar:check-circle-bold" className="text-green-600 text-xl" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Pago #{pagos.length - index}</p>
                                                <p className="text-xs text-gray-500">
                                                    {moment(pago.fecha).format('DD/MM/YYYY HH:mm')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-green-600">S/ {Number(pago.monto).toFixed(2)}</p>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                {pago.medioPago}
                                            </span>
                                        </div>
                                    </div>
                                    {(pago.referencia || pago.observacion) && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
                                            {pago.referencia && (
                                                <p className="text-gray-600">
                                                    <span className="text-gray-400">Ref:</span> {pago.referencia}
                                                </p>
                                            )}
                                            {pago.observacion && (
                                                <p className="text-gray-600">
                                                    <span className="text-gray-400">Obs:</span> {pago.observacion}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalHistorialPagosCompra;
