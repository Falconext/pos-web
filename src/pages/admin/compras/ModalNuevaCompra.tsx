import React, { useState, useEffect, useRef } from "react";
import { BarcodeScannerInput } from "@/components/BarcodeScannerInput";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import InputPro from "@/components/InputPro";
import Select from "@/components/Select";
import { Icon } from "@iconify/react/dist/iconify.js";
import useAlertStore from "@/zustand/alert";
import { useComprasStore } from "@/zustand/compras";
import { useClientsStore } from "@/zustand/clients";
import { useProductsStore } from "@/zustand/products";
import { get } from "@/utils/fetch";
import moment from "moment";
import { Calendar } from "@/components/Date";

interface ModalNuevaCompraProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const ModalNuevaCompra = ({ isOpen, onClose, onSuccess }: ModalNuevaCompraProps) => {
    const { crearCompra } = useComprasStore();
    const { getAllClients, clients, resetClients } = useClientsStore();
    const { getAllProducts, products, resetProducts } = useProductsStore();
    const { alert } = useAlertStore();

    // Data states
    const [supplierOptions, setSupplierOptions] = useState<any[]>([]);
    const [productOptions, setProductOptions] = useState<any[]>([]);

    // Form states
    const [header, setHeader] = useState({
        serie: 'F001',
        tipoDoc: 'FACTURA',
        numero: '',
        fechaEmision: moment().format('YYYY-MM-DD'),
        fechaVencimiento: moment().format('YYYY-MM-DD'),
        moneda: 'PEN',
        tipoCambio: 1.0,
        proveedorId: 0,
        observaciones: ''
    });

    const [payment, setPayment] = useState({
        condicionPago: 'CONTADO',
        montoPagadoInicial: 0,
        metodoPagoInicial: 'EFECTIVO'
    });

    const [cuotas, setCuotas] = useState<any[]>([]);

    // Item entry state
    const [currentItem, setCurrentItem] = useState({
        productoId: 0,
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
        lote: '',
        fechaVencimiento: ''
    });

    const [items, setItems] = useState<any[]>([]);
    const [barcodeInput, setBarcodeInput] = useState('');
    const [barcodeLoading, setBarcodeLoading] = useState(false);
    const barcodeRef = useRef<HTMLInputElement>(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            resetClients();
            resetProducts();
            setHeader({
                serie: 'F001',
                tipoDoc: 'FACTURA',
                numero: '',
                fechaEmision: moment().format('YYYY-MM-DD'),
                fechaVencimiento: moment().format('YYYY-MM-DD'),
                moneda: 'PEN',
                tipoCambio: 1.0,
                proveedorId: 0,
                observaciones: ''
            });
            setPayment({
                condicionPago: 'CONTADO',
                montoPagadoInicial: 0,
                metodoPagoInicial: 'EFECTIVO'
            });
            setItems([]);
            setCuotas([]);
            setBarcodeInput('');
        }
    }, [isOpen]);

    // Auto-focus barcode input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => barcodeRef.current?.focus(), 150);
        }
    }, [isOpen]);

    // Update options when store changes
    useEffect(() => {
        setSupplierOptions((clients || []).map(c => ({ id: c.id, value: `${c.nroDoc} - ${c.nombre}` })));
    }, [clients]);

    useEffect(() => {
        setProductOptions((products || []).map(p => ({ id: p.id, value: `${p.codigo} - ${p.descripcion} (Stock: ${p.stock})`, data: p })));
    }, [products]);

    // Handlers
    const handleSupplierSearch = (query: string, cb: () => void) => {
        getAllClients({ search: query, persona: 'PROVEEDOR', limit: 20 }, cb);
    };

    const handleProductSearch = (query: string, cb: () => void) => {
        getAllProducts({ search: query, limit: 20 }, cb);
    };

    const onSupplierChange = (id: any, value: string) => {
        setHeader({ ...header, proveedorId: Number(id) });
    };

    const onProductChange = (id: any, value: string) => {
        const prod = products.find(p => p.id === Number(id));
        if (prod) {
            setCurrentItem({
                ...currentItem,
                productoId: prod.id,
                descripcion: prod.descripcion,
                precioUnitario: prod.costoUnitario || 0
            });
        }
    };

    const handleBarcodeScan = async (codigo: string) => {
        const trimmed = codigo.trim();
        if (!trimmed) return;
        setBarcodeLoading(true);
        try {
            const resp: any = await get(`producto/barcode/${encodeURIComponent(trimmed)}`);
            if (resp.code === 1 && resp.data) {
                const prod = resp.data;
                setCurrentItem(prev => ({
                    ...prev,
                    productoId: prod.id,
                    descripcion: prod.descripcion,
                    precioUnitario: prod.costoUnitario || 0,
                    cantidad: 1,
                    lote: '',
                    fechaVencimiento: '',
                }));
                setBarcodeInput('');
            } else {
                alert(`Producto no encontrado: ${trimmed}`, 'error');
                setBarcodeInput('');
            }
        } catch {
            alert(`Código de barras no encontrado: ${trimmed}`, 'error');
            setBarcodeInput('');
        } finally {
            setBarcodeLoading(false);
            barcodeRef.current?.focus();
        }
    };

    const addItem = () => {
        if (!currentItem.productoId) {
            alert("Seleccione un producto", "error");
            return;
        }
        if (currentItem.cantidad <= 0) {
            alert("Cantidad inválida", "error");
            return;
        }

        setItems([...items, { ...currentItem, subtotal: currentItem.cantidad * currentItem.precioUnitario }]);
        setCurrentItem({ ...currentItem, productoId: 0, descripcion: '', cantidad: 1, precioUnitario: 0, lote: '', fechaVencimiento: '' });
    };

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    // Totals
    const subtotal = items.reduce((acc, item) => acc + (item.cantidad * item.precioUnitario), 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    const handleSubmit = async () => {
        if (!header.proveedorId) {
            alert("Seleccione un proveedor", "error");
            return;
        }
        if (items.length === 0) {
            alert("Agregue al menos un producto", "error");
            return;
        }

        const payload = {
            ...header,
            items: undefined,
            detalles: items.map(i => ({
                ...i,
                fechaVencimiento: i.fechaVencimiento ? i.fechaVencimiento : undefined
            })),
            formaPago: payment.condicionPago,
            montoPagadoInicial: payment.condicionPago === 'CONTADO' ? total : Number(payment.montoPagadoInicial),
            metodoPagoInicial: payment.metodoPagoInicial,
            cuotas: payment.condicionPago === 'CREDITO' ? cuotas : undefined,
            subtotal,
            igv,
            total
        };

        const success = await crearCompra(payload);
        if (success) {
            onClose();
            if (onSuccess) onSuccess();
        }
    };

    return (
        <Modal
            isOpenModal={isOpen}
            closeModal={onClose}
            title="Nueva Compra"
            icon="solar:cart-plus-bold-duotone"
            width="1200px"
            position="right"
        >
            <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <div className="px-4 pb-4 space-y-5">
                    {/* Datos del Documento */}
                    <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 mt-5">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3 uppercase tracking-wide">Datos del Documento</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="Proveedor"
                                name="proveedor"
                                options={supplierOptions}
                                onChange={onSupplierChange}
                                isSearch
                                handleGetData={handleSupplierSearch}
                                withLabel
                                error={null}
                                placeholder="Buscar proveedor..."
                            />
                            <InputPro autocomplete="off" label="Serie" name="doc_serie_compra" id="doc_serie_compra" value={header.serie} onChange={(e) => setHeader({ ...header, serie: e.target.value })} isLabel />
                            <InputPro autocomplete="off" label="Nro. Comprobante" name="doc_correlativo" id="doc_correlativo" value={header.numero} onChange={(e) => setHeader({ ...header, numero: e.target.value })} isLabel />
                            <Calendar
                                text="Fecha Emisión"
                                name="fechaEmision"
                                onChange={(date: string, name: string) => {
                                    if (moment(date, 'DD/MM/YYYY', true).isValid()) {
                                        setHeader({ ...header, fechaEmision: moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD') });
                                    }
                                }}
                            />
                            <Calendar
                                text="Fecha Vencimiento"
                                name="fechaVencimiento"
                                onChange={(date: string, name: string) => {
                                    if (moment(date, 'DD/MM/YYYY', true).isValid()) {
                                        setHeader({ ...header, fechaVencimiento: moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD') });
                                    }
                                }}
                            />
                            <div className="md:col-span-2">
                                <InputPro autocomplete="off" label="Observaciones" name="observaciones" value={header.observaciones} onChange={(e) => setHeader({ ...header, observaciones: e.target.value })} isLabel />
                            </div>
                        </div>
                    </div>

                    {/* Detalle de Productos */}
                    <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3 uppercase tracking-wide">Detalle de Productos</h3>

                        {/* Barcode scanner input */}
                        <BarcodeScannerInput
                            className="mb-4"
                            inputRef={barcodeRef}
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            onScan={handleBarcodeScan}
                            loading={barcodeLoading}
                            placeholder="Escanea o escribe el código y presiona Enter..."
                        />

                        {/* Add Item Form */}
                        <div className="grid grid-cols-12 gap-3 mb-4 items-end p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                            <div className="col-span-4">
                                <Select
                                    label="Producto"
                                    name="producto"
                                    options={productOptions}
                                    onChange={onProductChange}
                                    isSearch
                                    handleGetData={handleProductSearch}
                                    withLabel
                                    error={null}
                                    placeholder="Buscar producto..."
                                />
                            </div>
                            <div className="col-span-2">
                                <InputPro autocomplete="off" type="number" label="Cantidad" name="cantidad" value={currentItem.cantidad} onChange={(e) => setCurrentItem({ ...currentItem, cantidad: Number(e.target.value) })} isLabel />
                            </div>
                            <div className="col-span-2">
                                <InputPro autocomplete="off" type="number" label="Costo Unit." name="precioUnitario" value={currentItem.precioUnitario} onChange={(e) => setCurrentItem({ ...currentItem, precioUnitario: Number(e.target.value) })} isLabel />
                            </div>
                            <div className="col-span-2">
                                <InputPro autocomplete="off" label="Lote (Opcional)" name="lote" value={currentItem.lote} onChange={(e) => setCurrentItem({ ...currentItem, lote: e.target.value })} isLabel />
                            </div>
                            <div className="col-span-2">
                                <Button outline color="black" onClick={addItem} className="w-full justify-center !bg-violet-600 !text-white !border-none shadow-md shadow-violet-200 hover:opacity-90">
                                    Agregar
                                    <Icon width={25} icon="solar:add-circle-bold" className="ml-2" />
                                </Button>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="overflow-x-auto border border-gray-100 dark:border-slate-800 rounded-xl">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-medium border-b border-gray-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-3 py-2">Producto</th>
                                        <th className="px-3 py-2 text-center">Cant.</th>
                                        <th className="px-3 py-2 text-right">Costo</th>
                                        <th className="px-3 py-2 text-right">Subtotal</th>
                                        <th className="px-3 py-2 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-8 text-center text-gray-400 dark:text-gray-500">
                                                No hay productos agregados
                                            </td>
                                        </tr>
                                    ) : items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                                            <td className="px-3 py-3">
                                                <div className="font-medium text-gray-800 dark:text-white">{item.descripcion}</div>
                                                {(item.lote || item.fechaVencimiento) && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {item.lote && `Lote: ${item.lote} `}
                                                        {item.fechaVencimiento && `Vence: ${item.fechaVencimiento}`}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-center dark:text-gray-300">{item.cantidad}</td>
                                            <td className="px-3 py-3 text-right dark:text-gray-300">S/ {Number(item.precioUnitario).toFixed(2)}</td>
                                            <td className="px-3 py-3 text-right font-medium text-gray-800 dark:text-white">S/ {Number(item.cantidad * item.precioUnitario).toFixed(2)}</td>
                                            <td className="px-3 py-3 text-center">
                                                <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 p-1">
                                                    <Icon icon="solar:trash-bin-trash-bold" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Resumen y Condiciones */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Resumen */}
                        <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800">
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3 uppercase tracking-wide">Resumen</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>Op. Gravada</span>
                                    <span>S/ {subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>IGV (18%)</span>
                                    <span>S/ {igv.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-slate-700 pt-2">
                                    <span>Total a Pagar</span>
                                    <span>S/ {total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Condiciones de Pago */}
                        <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800">
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3 uppercase tracking-wide">Condiciones de Pago</h3>
                            <div className="space-y-3">
                                <Select
                                    label="Condición"
                                    name="condicionPago"
                                    options={[
                                        { id: 'CONTADO', value: 'Contado' },
                                        { id: 'CREDITO', value: 'Crédito' }
                                    ]}
                                    onChange={(id, val) => {
                                        setPayment({ ...payment, condicionPago: String(id) });
                                        if (id === 'CONTADO') {
                                            setPayment(prev => ({ ...prev, condicionPago: 'CONTADO', montoPagadoInicial: total }));
                                            setCuotas([]);
                                        } else {
                                            setPayment(prev => ({ ...prev, condicionPago: 'CREDITO', montoPagadoInicial: 0 }));
                                            setCuotas([{ monto: total, fechaVencimiento: moment().add(30, 'days').format('YYYY-MM-DD') }]);
                                        }
                                    }}
                                    value={payment.condicionPago}
                                    withLabel
                                    error={null}
                                />

                                {payment.condicionPago === 'CONTADO' && (
                                    <Select
                                        label="Método de Pago"
                                        name="metodoPago"
                                        options={[
                                            { id: 'EFECTIVO', value: 'Efectivo' },
                                            { id: 'TRANSFERENCIA', value: 'Transferencia' },
                                            { id: 'YAPE', value: 'Yape / Plin' },
                                            { id: 'TARJETA', value: 'Tarjeta' }
                                        ]}
                                        onChange={(id, val) => setPayment({ ...payment, metodoPagoInicial: String(id) })}
                                        value={payment.metodoPagoInicial}
                                        withLabel
                                        error={null}
                                    />
                                )}

                                {payment.condicionPago === 'CREDITO' && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cuotas</span>
                                            <button
                                                onClick={() => setCuotas([...cuotas, { monto: 0, fechaVencimiento: moment().add(30 * (cuotas.length + 1), 'days').format('YYYY-MM-DD') }])}
                                                className="text-blue-600 dark:text-blue-400 text-xs hover:underline font-medium"
                                                type="button"
                                            >
                                                + Agregar
                                            </button>
                                        </div>
                                        {cuotas.map((cuota, idx) => (
                                            <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                                                <div className="col-span-5">
                                                    <Calendar
                                                        text={`Vencimiento ${idx + 1}`}
                                                        name={`fechaVencimiento_${idx}`}
                                                        onChange={(date: string) => {
                                                            if (moment(date, 'DD/MM/YYYY', true).isValid()) {
                                                                const newCuotas = [...cuotas];
                                                                newCuotas[idx].fechaVencimiento = moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD');
                                                                setCuotas(newCuotas);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div className="col-span-6">
                                                    <InputPro
                                                        type="number"
                                                        label={`Monto ${idx + 1}`}
                                                        name={`monto_${idx}`}
                                                        value={cuota.monto}
                                                        onChange={(e) => {
                                                            const newCuotas = [...cuotas];
                                                            newCuotas[idx].monto = Number(e.target.value);
                                                            setCuotas(newCuotas);
                                                        }}
                                                        isLabel
                                                        autocomplete="off"
                                                    />
                                                </div>
                                                <div className="col-span-1 flex items-end pb-2">
                                                    <button onClick={() => {
                                                        const newCuotas = [...cuotas];
                                                        newCuotas.splice(idx, 1);
                                                        setCuotas(newCuotas);
                                                    }} className="text-red-500 hover:text-red-700 p-1">
                                                        <Icon icon="solar:trash-bin-trash-bold" width={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="text-xs text-right text-gray-500 dark:text-gray-400 font-medium">
                                            Total Cuotas: S/ {cuotas.reduce((acc, c) => acc + (Number(c.monto) || 0), 0).toFixed(2)}
                                        </div>
                                        {Math.abs(total - cuotas.reduce((acc, c) => acc + (Number(c.monto) || 0), 0)) > 0.01 && (
                                            <div className="text-xs text-red-500 dark:text-red-400 font-bold text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border dark:border-red-900/30">
                                                ⚠️ Las cuotas no suman el total
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-slate-800">
                        <Button color="gray" onClick={onClose} type="button">Cancelar</Button>
                        <Button outline color="black" onClick={handleSubmit} className="!bg-emerald-500 !text-white !border-none shadow-md shadow-emerald-200 dark:shadow-emerald-900/20 hover:opacity-90">Guardar Compra</Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default ModalNuevaCompra;
