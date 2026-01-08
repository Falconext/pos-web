import { Icon } from '@iconify/react';
import moment from 'moment';

interface ModalDetalleCuentaProps {
    comprobante: any;
    onClose: () => void;
}

const ModalDetalleCuenta = ({ comprobante, onClose }: ModalDetalleCuentaProps) => {
    if (!comprobante) return null;

    const tieneRetencion = comprobante.montoDetraccion > 0 && comprobante.porcentajeDetraccion === 3;
    const tieneDetraccion = comprobante.montoDetraccion > 0 && comprobante.porcentajeDetraccion !== 3;
    const cuotas = comprobante.cuotas || [];
    const totalComprobante = Number(comprobante.mtoImpVenta || 0);
    const montoRetencionDetraccion = Number(comprobante.montoDetraccion || 0);
    const saldoNeto = totalComprobante - montoRetencionDetraccion;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-[#111] p-5 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Icon icon="solar:document-text-bold-duotone" className="text-2xl" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Detalle de Crédito</h3>
                                <p className="text-sm text-white/80">
                                    {comprobante.serie}-{String(comprobante.correlativo).padStart(8, '0')}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white/80 hover:text-white">
                            <Icon icon="mdi:close" className="text-2xl" />
                        </button>
                    </div>
                </div>

                {/* Información General */}
                <div className="p-5 border-b border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Icon icon="solar:info-circle-bold-duotone" className="text-blue-500" />
                        Información General
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-gray-500">Cliente</p>
                            <p className="font-medium text-gray-900">{comprobante.cliente?.nombre || 'Sin cliente'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">RUC/DNI</p>
                            <p className="font-medium text-gray-900">{comprobante.cliente?.nroDoc || '-'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Fecha Emisión</p>
                            <p className="font-medium text-gray-900">{moment(comprobante.fechaEmision).format('DD/MM/YYYY')}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Forma de Pago</p>
                            <p className="font-medium text-gray-900">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                    {comprobante.formaPagoTipo}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Montos */}
                <div className="p-5 border-b border-gray-100 bg-gray-50">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Icon icon="solar:calculator-bold-duotone" className="text-green-500" />
                        Desglose de Montos
                    </h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Total Comprobante:</span>
                            <span className="font-semibold text-gray-900">S/ {totalComprobante.toFixed(2)}</span>
                        </div>

                        {(tieneRetencion || tieneDetraccion) && (
                            <>
                                <div className="flex justify-between text-orange-600">
                                    <span className="flex items-center gap-1">
                                        <Icon icon="solar:minus-circle-bold-duotone" className="text-sm" />
                                        {tieneRetencion ? 'Retención 3% IGV:' : `Detracción ${comprobante.porcentajeDetraccion}%:`}
                                    </span>
                                    <span className="font-semibold">- S/ {montoRetencionDetraccion.toFixed(2)}</span>
                                </div>
                                <hr className="border-dashed" />
                                <div className="flex justify-between text-lg font-bold text-green-600">
                                    <span>Saldo Neto a Cobrar:</span>
                                    <span>S/ {saldoNeto.toFixed(2)}</span>
                                </div>
                            </>
                        )}

                        {!tieneRetencion && !tieneDetraccion && (
                            <div className="flex justify-between text-lg font-bold text-green-600">
                                <span>Total a Cobrar:</span>
                                <span>S/ {totalComprobante.toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cuotas */}
                {cuotas.length > 0 && (
                    <div className="p-5 border-b border-gray-100">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Icon icon="solar:calendar-bold-duotone" className="text-purple-500" />
                            Plan de Cuotas ({cuotas.length})
                        </h4>
                        <div className="space-y-2">
                            {cuotas.map((cuota: any, index: number) => {
                                const fechaVenc = moment(cuota.fechaVencimiento);
                                const vencida = fechaVenc.isBefore(moment(), 'day');
                                const hoy = fechaVenc.isSame(moment(), 'day');

                                return (
                                    <div
                                        key={index}
                                        className={`flex items-center justify-between p-3 rounded-lg border ${vencida ? 'bg-red-50 border-red-200' :
                                                hoy ? 'bg-yellow-50 border-yellow-200' :
                                                    'bg-gray-50 border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${vencida ? 'bg-red-200 text-red-700' :
                                                    hoy ? 'bg-yellow-200 text-yellow-700' :
                                                        'bg-gray-200 text-gray-700'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Cuota {String(index + 1).padStart(3, '0')}</p>
                                                <p className={`text-xs ${vencida ? 'text-red-600' : 'text-gray-500'}`}>
                                                    Vence: {fechaVenc.format('DD/MM/YYYY')}
                                                    {vencida && ' (Vencida)'}
                                                    {hoy && ' (Hoy)'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="font-bold text-gray-900">
                                            S/ {Number(cuota.monto).toFixed(2)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Estado Actual */}
                <div className="p-5 bg-blue-50">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Icon icon="solar:chart-bold-duotone" className="text-blue-500" />
                        Estado Actual
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl p-4 text-center border border-blue-200">
                            <p className="text-sm text-gray-500 mb-1">Saldo Pendiente</p>
                            <p className="text-2xl font-black text-blue-600">
                                S/ {Number(comprobante.saldo || 0).toFixed(2)}
                            </p>
                        </div>
                        <div className={`rounded-xl p-4 text-center border ${comprobante.estadoPago === 'COMPLETADO'
                                ? 'bg-green-50 border-green-200'
                                : 'bg-orange-50 border-orange-200'
                            }`}>
                            <p className="text-sm text-gray-500 mb-1">Estado</p>
                            <p className={`text-lg font-bold ${comprobante.estadoPago === 'COMPLETADO'
                                    ? 'text-green-600'
                                    : 'text-orange-600'
                                }`}>
                                {comprobante.estadoPago === 'PENDIENTE_PAGO' ? 'PENDIENTE' :
                                    comprobante.estadoPago === 'PAGO_PARCIAL' ? 'PAGO PARCIAL' :
                                        comprobante.estadoPago}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-[#111] text-white rounded-lg hover:bg-[#333] transition-colors font-medium"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalDetalleCuenta;
