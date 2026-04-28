import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useComprasStore } from '@/zustand/compras';
import { useAuthStore } from '@/zustand/auth';
import Select from '@/components/Select';
// import PaymentReceipt from '@/components/PaymentReceipt'; // Reuse or create new one? For now simple success message

interface ModalRegistrarPagoCompraProps {
    compra: any;
    onClose: () => void;
    onSuccess: () => void;
}

const ModalRegistrarPagoCompra = ({ compra, onClose, onSuccess }: ModalRegistrarPagoCompraProps) => {
    const { auth } = useAuthStore();
    const { registrarPagoCompra, loading } = useComprasStore(); // We'll add this method
    const [monto, setMonto] = useState('');
    const [medioPago, setMedioPago] = useState('EFECTIVO');
    const [observacion, setObservacion] = useState('');
    const [referencia, setReferencia] = useState('');
    const [showReceipt, setShowReceipt] = useState(false);
    const [pagoRegistrado, setPagoRegistrado] = useState<any>(null);
    const [nuevoSaldoFinal, setNuevoSaldoFinal] = useState<number>(0);

    const saldoActual = Number(compra?.saldo || 0);
    const montoNum = Number(monto) || 0;
    const nuevoSaldo = Math.max(0, saldoActual - montoNum);

    const handleSubmit = async () => {
        if (montoNum <= 0) return;
        if (montoNum > saldoActual) return;

        // Assuming registrarPagoCompra signature: (id, payload)
        const result = await registrarPagoCompra(compra.id, {
            monto: montoNum,
            medioPago,
            observacion: observacion || undefined,
            referencia: referencia || undefined,
        });

        if (result && result.success) { // adjust based on store return
            setPagoRegistrado({
                ...result.pago,
                monto: montoNum,
                medioPago,
                observacion,
                referencia,
            });
            setNuevoSaldoFinal(result.nuevoSaldo ?? nuevoSaldo);
            // setShowReceipt(true); // Disable receipt for now, just success
            onSuccess();
        }
    };

    const handlePagarTodo = () => {
        setMonto(saldoActual.toFixed(2));
    };

    const handleCloseReceipt = () => {
        setShowReceipt(false);
        onSuccess();
    };

    // Modal de Registro de Pago
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border dark:border-slate-800">
                {/* Header */}
                <div className="bg-[#111] dark:bg-slate-900 p-5 text-white border-b dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Icon icon="solar:hand-money-bold-duotone" className="text-2xl" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Registrar Pago a Proveedor</h3>
                                <p className="text-sm text-white/80">
                                    {compra?.serie}-{compra?.numero}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white/80 hover:text-white">
                            <Icon icon="mdi:close" className="text-2xl" />
                        </button>
                    </div>
                </div>

                {/* Info de la Compra */}
                <div className="p-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">Proveedor</p>
                            <p className="font-medium text-gray-900 dark:text-white">{compra?.proveedor?.nombre || 'Sin nombre'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">RUC/DNI</p>
                            <p className="font-medium text-gray-900 dark:text-white">{compra?.proveedor?.nroDoc || '-'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">Total Compra</p>
                            <p className="font-medium text-gray-900 dark:text-white">S/ {Number(compra?.total || 0).toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">Saldo Pendiente</p>
                            <p className="font-bold text-red-600 dark:text-red-400 text-lg">S/ {saldoActual.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="p-5 space-y-4">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto a Abonar</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">S/</span>
                                <input
                                    type="number"
                                    value={monto}
                                    onChange={(e) => setMonto(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    max={saldoActual}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handlePagarTodo}
                            className="mt-6 px-4 py-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium"
                        >
                            Pagar Todo
                        </button>
                    </div>

                    <div>
                        <Select
                            error=""
                            label="Medio de Pago"
                            name="medioPago"
                            defaultValue="EFECTIVO"
                            onChange={(id: any, value: string) => setMedioPago(value)}
                            options={[
                                { value: 'EFECTIVO', label: 'Efectivo' },
                                { value: 'YAPE', label: 'Yape' },
                                { value: 'PLIN', label: 'Plin' },
                                { value: 'TRANSFERENCIA', label: 'Transferencia' },
                                { value: 'TARJETA', label: 'Tarjeta' },
                            ]}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referencia (opcional)</label>
                        <input
                            type="text"
                            value={referencia}
                            onChange={(e) => setReferencia(e.target.value)}
                            placeholder="Nro. operación, voucher, etc."
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observación (opcional)</label>
                        <textarea
                            value={observacion}
                            onChange={(e) => setObservacion(e.target.value)}
                            placeholder="Notas adicionales..."
                            rows={2}
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                    </div>

                    {montoNum > 0 && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border dark:border-blue-900/30">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Nuevo saldo después del pago:</span>
                                <span className={`font-bold ${nuevoSaldo > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                                    S/ {nuevoSaldo.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 dark:border-slate-800 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || montoNum <= 0 || montoNum > saldoActual}
                        className="px-5 py-2.5 bg-[#111] dark:bg-indigo-600 text-white rounded-lg hover:bg-[#333] dark:hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Procesando...
                            </>
                        ) : (
                            <>
                                <Icon icon="solar:check-circle-bold" />
                                Registrar Pago
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalRegistrarPagoCompra;
