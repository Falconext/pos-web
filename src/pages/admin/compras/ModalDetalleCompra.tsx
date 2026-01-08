import React, { useEffect } from "react";
import Modal from "@/components/Modal";
import InputPro from "@/components/InputPro";
import { useComprasStore } from "@/zustand/compras";
import moment from "moment";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    compraId: number | null;
};

const ModalDetalleCompra = ({ isOpen, onClose, compraId }: Props) => {
    const { obtenerCompra, compraDetalle } = useComprasStore();

    useEffect(() => {
        if (isOpen && compraId) {
            obtenerCompra(compraId);
        }
    }, [isOpen, compraId]);

    if (!isOpen) return null;

    const isLoading = !compraDetalle || compraDetalle.id !== compraId;

    // Safety check for calculations
    const total = compraDetalle ? Number(compraDetalle.total) : 0;
    const subtotal = total / 1.18;
    const igv = total - subtotal;

    return (
        <Modal
            isOpenModal={isOpen}
            closeModal={onClose}
            title="Detalle de Compra"
            width="900px"
        >
            {isLoading ? (
                <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="p-4 space-y-6">
                    {/* Header Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                            <label className="block text-xs text-gray-500 font-medium mb-1 mt-1">Proveedor</label>
                            <div className="p-3 bg-white rounded-lg text-sm font-medium text-gray-700 border border-gray-200">
                                {compraDetalle?.proveedor?.nombre || compraDetalle?.proveedor?.nroDoc || '-'}
                            </div>
                        </div>
                        <InputPro label="Serie" name="serie" value={compraDetalle?.serie} disabled isLabel />
                        <InputPro label="Número" name="numero" value={compraDetalle?.numero} disabled isLabel />
                        <InputPro label="Fecha Emisión" name="fechaEmision" value={moment(compraDetalle?.fechaEmision).format('DD/MM/YYYY')} disabled isLabel />
                        <InputPro
                            label="Fecha Vencimiento"
                            name="fechaVencimiento"
                            value={compraDetalle?.fechaVencimiento ? moment(compraDetalle?.fechaVencimiento).format('DD/MM/YYYY') : '-'}
                            disabled
                            isLabel
                        />
                        <div className="col-span-1 md:col-span-2 lg:col-span-3">
                            <label className="block text-xs text-gray-500 font-medium mb-1">Estado</label>
                            <div className="flex gap-2">
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${compraDetalle?.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {compraDetalle?.estado}
                                </span>
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${compraDetalle?.estadoPago === 'PAGADO' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {compraDetalle?.estadoPago}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Productos</h3>
                        <div className="overflow-x-auto border border-gray-100 rounded-xl">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 font-medium">
                                    <tr>
                                        <th className="px-3 py-2">Producto</th>
                                        <th className="px-3 py-2 text-center">Cant.</th>
                                        <th className="px-3 py-2 text-right">Costo</th>
                                        <th className="px-3 py-2 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(!compraDetalle?.detalles || compraDetalle.detalles.length === 0) ? (
                                        <tr>
                                            <td colSpan={4} className="px-3 py-8 text-center text-gray-400">
                                                No hay productos registrados
                                            </td>
                                        </tr>
                                    ) : compraDetalle.detalles.map((item: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-gray-50/50">
                                            <td className="px-3 py-3">
                                                <div className="font-medium text-gray-800">{item.descripcion || item.producto?.descripcion}</div>
                                                {(item.lote || item.fechaVencimiento) && (
                                                    <div className="text-xs text-gray-500">
                                                        {item.lote && `Lote: ${item.lote} `}
                                                        {item.fechaVencimiento && `Vence: ${moment(item.fechaVencimiento).format('DD/MM/YYYY')}`}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-center">{item.cantidad}</td>
                                            <td className="px-3 py-3 text-right">S/ {Number(item.precioUnitario).toFixed(2)}</td>
                                            <td className="px-3 py-3 text-right font-medium text-gray-800">S/ {Number(item.total || (item.cantidad * item.precioUnitario)).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Installments Table */}
                    {compraDetalle?.cuotas && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Cronograma de Pagos</h3>
                            <div className="overflow-x-auto border border-gray-100 rounded-xl">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600 font-medium">
                                        <tr>
                                            <th className="px-3 py-2 text-center">Nro</th>
                                            <th className="px-3 py-2 text-center">Vencimiento</th>
                                            <th className="px-3 py-2 text-right">Monto</th>
                                            <th className="px-3 py-2 text-center">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {(() => {
                                            let cuotasParsed: any[] = [];
                                            try {
                                                if (Array.isArray(compraDetalle.cuotas)) {
                                                    cuotasParsed = compraDetalle.cuotas;
                                                } else if (typeof compraDetalle.cuotas === 'string') {
                                                    cuotasParsed = JSON.parse(compraDetalle.cuotas);
                                                }
                                            } catch (e) {
                                                console.error("Error parsing cuotas:", e);
                                                cuotasParsed = [];
                                            }

                                            if (!Array.isArray(cuotasParsed)) cuotasParsed = [];

                                            return cuotasParsed.map((cuota: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-gray-50/50">
                                                    <td className="px-3 py-3 text-center text-gray-500">{idx + 1}</td>
                                                    <td className="px-3 py-3 text-center">{(cuota.fecha || cuota.fechaVencimiento) ? moment(cuota.fecha || cuota.fechaVencimiento).format('DD/MM/YYYY') : '-'}</td>
                                                    <td className="px-3 py-3 text-right font-medium">S/ {Number(cuota.monto).toFixed(2)}</td>
                                                    <td className="px-3 py-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-xs ${compraDetalle.estadoPago === 'COMPLETADO' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                            {compraDetalle.estadoPago === 'COMPLETADO' ? 'PAGADO' : 'PENDIENTE'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ));
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Footer Totals */}
                    <div className="flex justify-end">
                        <div className="w-full md:w-1/3 space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Op. Gravada</span>
                                <span>S/ {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>IGV (18%)</span>
                                <span>S/ {igv.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2 mt-2">
                                <span>Total</span>
                                <span>S/ {total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default ModalDetalleCompra;
