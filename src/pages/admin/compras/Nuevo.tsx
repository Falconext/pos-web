"use client";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import InputPro from "@/components/InputPro";
import Select from "@/components/Select";
import { Icon } from "@iconify/react/dist/iconify.js";
import useAlertStore from "@/zustand/alert";
import { useComprasStore } from "@/zustand/compras";
import { useClientsStore } from "@/zustand/clients";
import { useProductsStore } from "@/zustand/products";
import moment from "moment";
import { useAuthStore } from "@/zustand/auth";

const NuevaCompra = () => {
    const navigate = useNavigate();
    const { crearCompra } = useComprasStore();
    const { getAllClients, clients, resetClients } = useClientsStore();
    const { getAllProducts, products, resetProducts } = useProductsStore();
    const { alert } = useAlertStore();
    const { auth } = useAuthStore();

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
        condicionPago: 'CONTADO', // New field
        montoPagadoInicial: 0,
        metodoPagoInicial: 'EFECTIVO'
    });

    const [cuotas, setCuotas] = useState<any[]>([]); // New state for installments

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

    // Load initial options
    useEffect(() => {
        resetClients();
        resetProducts();
        // Pre-load some suppliers/products? Maybe not needed if search works
    }, []);

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
                precioUnitario: prod.costoUnitario || 0 // Assuming price exists
            });
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
        // Reset current item partially
        setCurrentItem({ ...currentItem, productoId: 0, descripcion: '', cantidad: 1, precioUnitario: 0, lote: '', fechaVencimiento: '' });
        // We might want to clear the Select input too, but it's tricky with current component
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
            navigate('/administrador/compras');
        }
    };

    return (
        <div className="min-h-screen pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Nueva Compra</h1>
                    <p className="text-sm text-gray-500 mt-1">Registrar ingreso de mercadería</p>
                </div>
                <div className="flex gap-2">
                    <Link to="/administrador/compras">
                        <Button color="gray">Cancelar</Button>
                    </Link>
                    <Button color="secondary" onClick={handleSubmit}>Guardar Compra</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Form & Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header Card */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">Datos del Documento</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            <InputPro label="Serie" name="serie" value={header.serie} onChange={(e) => setHeader({ ...header, serie: e.target.value })} isLabel />
                            <InputPro label="Número" name="numero" value={header.numero} onChange={(e) => setHeader({ ...header, numero: e.target.value })} isLabel />
                            <InputPro type="date" label="Fecha Emisión" name="fechaEmision" value={header.fechaEmision} onChange={(e) => setHeader({ ...header, fechaEmision: e.target.value })} isLabel />
                            <InputPro type="date" label="Fecha Vencimiento" name="fechaVencimiento" value={header.fechaVencimiento} onChange={(e) => setHeader({ ...header, fechaVencimiento: e.target.value })} isLabel />
                            <div className="col-span-1 md:col-span-2 lg:col-span-3">
                                <InputPro label="Observaciones" name="observaciones" value={header.observaciones} onChange={(e) => setHeader({ ...header, observaciones: e.target.value })} isLabel />
                            </div>
                        </div>
                    </div>

                    {/* Items Card */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">Detalle de Productos</h3>

                        {/* Add Item Form */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6 items-end bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="md:col-span-4">
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
                            <div className="md:col-span-2">
                                <InputPro type="number" label="Cantidad" name="cantidad" value={currentItem.cantidad} onChange={(e) => setCurrentItem({ ...currentItem, cantidad: Number(e.target.value) })} isLabel />
                            </div>
                            <div className="md:col-span-2">
                                <InputPro type="number" label="Costo Unit." name="precioUnitario" value={currentItem.precioUnitario} onChange={(e) => setCurrentItem({ ...currentItem, precioUnitario: Number(e.target.value) })} isLabel />
                            </div>
                            <div className="md:col-span-2">
                                <InputPro label="Lote (Opcional)" name="lote" value={currentItem.lote} onChange={(e) => setCurrentItem({ ...currentItem, lote: e.target.value })} isLabel />
                            </div>
                            <div className="md:col-span-2">
                                <Button color="secondary" onClick={addItem} className="w-full justify-center">
                                    <Icon icon="solar:add-circle-bold" />
                                </Button>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 font-medium">
                                    <tr>
                                        <th className="px-3 py-2 rounded-l-lg">Producto</th>
                                        <th className="px-3 py-2 text-center">Cant.</th>
                                        <th className="px-3 py-2 text-right">Costo</th>
                                        <th className="px-3 py-2 text-right">Subtotal</th>
                                        <th className="px-3 py-2 rounded-r-lg text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                                                No hay productos agregados
                                            </td>
                                        </tr>
                                    ) : items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50">
                                            <td className="px-3 py-3">
                                                <div className="font-medium text-gray-800">{item.descripcion}</div>
                                                {(item.lote || item.fechaVencimiento) && (
                                                    <div className="text-xs text-gray-500">
                                                        {item.lote && `Lote: ${item.lote} `}
                                                        {item.fechaVencimiento && `Vence: ${item.fechaVencimiento}`}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-center">{item.cantidad}</td>
                                            <td className="px-3 py-3 text-right">S/ {Number(item.precioUnitario).toFixed(2)}</td>
                                            <td className="px-3 py-3 text-right font-medium text-gray-800">S/ {Number(item.cantidad * item.precioUnitario).toFixed(2)}</td>
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
                </div>

                {/* Right Column: Totals & Payments */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">Resumen</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Op. Gravada</span>
                                <span>S/ {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>IGV (18%)</span>
                                <span>S/ {igv.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-100 pt-3">
                                <span>Total a Pagar</span>
                                <span>S/ {total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">Condiciones de Pago</h3>
                        <div className="space-y-4">
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
                                        // Default 1 cuota
                                        setCuotas([{ monto: total, fechaVencimiento: moment().add(30, 'days').format('YYYY-MM-DD') }]);
                                    }
                                }}
                                value={payment.condicionPago}
                                withLabel
                                error={null}
                            />

                            {payment.condicionPago === 'CONTADO' ? (
                                <>
                                    <InputPro
                                        type="number"
                                        label="Monto a Pagar Ahora"
                                        name="montoPagado"
                                        value={total} // Force total for Contado?? Or let them pay less? "Contado" usually implies full payment. Let's assume full for simplification or edit.
                                        onChange={(e) => setPayment({ ...payment, montoPagadoInicial: Number(e.target.value) })}
                                        isLabel
                                        placeholder="0.00"
                                        disabled
                                    />
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
                                </>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Cuotas</span>
                                        <button
                                            onClick={() => setCuotas([...cuotas, { monto: 0, fechaVencimiento: moment().add(30 * (cuotas.length + 1), 'days').format('YYYY-MM-DD') }])}
                                            className="text-blue-600 text-xs hover:underline"
                                        >
                                            + Agregar
                                        </button>
                                    </div>
                                    {cuotas.map((cuota, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <div className="w-24">
                                                <input
                                                    type="date"
                                                    className="w-full text-xs border rounded px-2 py-1"
                                                    value={cuota.fechaVencimiento}
                                                    onChange={(e) => {
                                                        const newCuotas = [...cuotas];
                                                        newCuotas[idx].fechaVencimiento = e.target.value;
                                                        setCuotas(newCuotas);
                                                    }}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="number"
                                                    className="w-full text-xs border rounded px-2 py-1"
                                                    value={cuota.monto}
                                                    onChange={(e) => {
                                                        const newCuotas = [...cuotas];
                                                        newCuotas[idx].monto = Number(e.target.value);
                                                        setCuotas(newCuotas);
                                                    }}
                                                />
                                            </div>
                                            <button onClick={() => {
                                                const newCuotas = [...cuotas];
                                                newCuotas.splice(idx, 1);
                                                setCuotas(newCuotas);
                                            }} className="text-red-500">
                                                <Icon icon="solar:trash-bin-trash-bold" width={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="text-xs text-right text-gray-500">
                                        Total Cuotas: S/ {cuotas.reduce((acc, c) => acc + (Number(c.monto) || 0), 0).toFixed(2)}
                                    </div>
                                    {Math.abs(total - cuotas.reduce((acc, c) => acc + (Number(c.monto) || 0), 0)) > 0.01 && (
                                        <div className="text-xs text-red-500 font-bold text-center">
                                            ⚠️ Las cuotas no suman el total
                                        </div>
                                    )}
                                </div>
                            )}

                            {payment.condicionPago === 'CREDITO' && (
                                <div className="pt-2 border-t border-gray-100">
                                    <InputPro
                                        type="number"
                                        label="Pago Inicial (Opcional)"
                                        name="montoPagado"
                                        value={payment.montoPagadoInicial}
                                        onChange={(e) => setPayment({ ...payment, montoPagadoInicial: Number(e.target.value) })}
                                        isLabel
                                        placeholder="0.00"
                                    />
                                    {payment.montoPagadoInicial > 0 && (
                                        <div className="mt-2">
                                            <Select
                                                label="Método de Pago Inicial"
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
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NuevaCompra;
