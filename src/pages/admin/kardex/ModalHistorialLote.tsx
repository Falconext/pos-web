
import { Icon } from '@iconify/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    lote: any;
}

const ModalHistorialLote = ({ isOpen, onClose, lote }: Props) => {
    if (!isOpen || !lote) return null;

    // Los movimientos vienen en lote.movimientosKardex (que es MovimientoKardexLote)
    // Ordenados desc por id (según backend)
    const movimientos = lote.movimientosKardex || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Icon icon="solar:history-bold" className="text-blue-600" />
                            Historial de Movimientos
                        </h2>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span className="font-medium px-2 py-0.5 bg-gray-100 rounded text-gray-600">Lote: {lote.lote}</span>
                            <span>•</span>
                            <span>Vence: {format(new Date(lote.fechaVencimiento), 'dd MMM yyyy', { locale: es })}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <Icon icon="solar:close-circle-bold" className="text-gray-400 w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-0 flex-1">
                    {movimientos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center">
                            <Icon icon="solar:clipboard-list-linear" width={48} className="mb-3 opacity-50" />
                            <p className="text-lg font-medium text-gray-500">Sin movimientos registrados</p>
                            <p className="text-sm">Este lote aún no tiene actividad aparte de su creación.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 sticky top-0 z-10 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3 border-b border-gray-100">Fecha</th>
                                    <th className="px-6 py-3 border-b border-gray-100">Concepto</th>
                                    <th className="px-6 py-3 border-b border-gray-100 text-right">Entrada</th>
                                    <th className="px-6 py-3 border-b border-gray-100 text-right">Salida</th>
                                    <th className="px-6 py-3 border-b border-gray-100 text-right">Saldo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {movimientos.map((mkLote: any) => {
                                    const mov = mkLote.movimiento; // Datos del padre (MovimientoKardex)
                                    if (!mov) return null; // Seguridad

                                    const esIngreso = mov.tipoMovimiento === 'INGRESO' || (mov.tipoMovimiento === 'AJUSTE' && mkLote.cantidad > 0 && mkLote.stockActual > mkLote.stockAnterior);
                                    // Tip: en AJUSTE podemos deducir si fue ingreso o salida comparando stock, o confiando en tipoMovimiento si lo guardamos bien.
                                    // Pero el endpoint ajustaStock guarda INGRESO/SALIDA explicitamente.

                                    return (
                                        <tr key={mkLote.id} className="hover:bg-gray-50/50 transition-colors text-sm">
                                            <td className="px-6 py-3.5 whitespace-nowrap text-gray-600">
                                                {format(new Date(mov.fecha), 'dd/MM/yy HH:mm')}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <div className="font-medium text-gray-800">{mov.concepto}</div>
                                                <div className="text-xs text-gray-400 font-mono mt-0.5">{mov.tipoMovimiento}</div>
                                            </td>
                                            <td className="px-6 py-3.5 text-right font-medium text-green-600">
                                                {esIngreso ? `+${mkLote.cantidad}` : '-'}
                                            </td>
                                            <td className="px-6 py-3.5 text-right font-medium text-red-600">
                                                {!esIngreso ? `-${mkLote.cantidad}` : '-'}
                                            </td>
                                            <td className="px-6 py-3.5 text-right font-bold text-gray-700 bg-gray-50/30">
                                                {mkLote.stockActual}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors shadow-sm"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalHistorialLote;
