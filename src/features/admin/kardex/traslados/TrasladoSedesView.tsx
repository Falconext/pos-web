import React, { useState, useEffect, useRef } from 'react';
import { BarcodeScannerInput } from '@/components/BarcodeScannerInput';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import Select from '@/components/Select';
import { useAuthStore } from '@/zustand/auth';
import { useSedesStore } from '@/zustand/sedes';
import apiClient from '@/utils/apiClient';
import { get } from '@/utils/fetch';
import useAlertStore from '@/zustand/alert';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import TrasladoPrintPage from './TrasladoPrintPage';


interface SelectedProduct {
    id: number;
    codigo: string;
    descripcion: string;
    stockActual: number;
    cantidad: number;
    unidadMedida: string;
}

export default function TrasladoSedesView() {
    const navigate = useNavigate();
    const { auth, sedeActiva } = useAuthStore();
    const { sedes, listarSedes } = useSedesStore();
    const { alert } = useAlertStore();

    const [destinationSedeId, setDestinationSedeId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [observacion, setObservacion] = useState('');

    const [isSuccess, setIsSuccess] = useState(false);
    const [transferData, setTransferData] = useState<any>(null);
    const printComponentRef = useRef<HTMLDivElement>(null);

    const [barcodeInput, setBarcodeInput] = useState('');
    const [barcodeLoading, setBarcodeLoading] = useState(false);
    const barcodeRef = useRef<HTMLInputElement>(null);

    const handleBarcodeScan = async (codigo: string) => {
        const trimmed = codigo.trim();
        if (!trimmed) return;
        setBarcodeLoading(true);
        try {
            const resp: any = await get(`producto/barcode/${encodeURIComponent(trimmed)}`);
            if (resp.code === 1 && resp.data) {
                addProduct(resp.data);
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

    const handlePrint = useReactToPrint({
        // @ts-ignore
        contentRef: printComponentRef,
        pageStyle: `@media print {
            @page { size: A4; margin: 0; }
            body { background-color: #fff; }
        }`
    });

    const searchRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        listarSedes();
    }, [listarSedes]);

    useEffect(() => {
        const fetchProducts = async () => {
            if (searchTerm.length < 2) {
                setSearchResults([]);
                return;
            }
            try {
                setLoadingProducts(true);
                const { data } = await apiClient.get('/producto/listar', {
                    params: {
                        search: searchTerm.trim(),
                        limit: 10,
                        sedeId: sedeActiva?.id
                    }
                });

                const payload = data?.data?.data ?? data?.data ?? data;
                const items = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.productos)
                        ? payload.productos
                        : Array.isArray(payload?.items)
                            ? payload.items
                            : [];

                setSearchResults(items);
            } catch (error) {
                console.error("Error searching products:", error);
                setSearchResults([]);
            } finally {
                setLoadingProducts(false);
            }
        };

        const timer = setTimeout(fetchProducts, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, sedeActiva?.id]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchResults([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addProduct = (p: any) => {
        if (selectedProducts.find(item => item.id === p.id)) {
            alert('El producto ya está en la lista', 'warning');
            return;
        }

        // Obtener stock específico de la sede actual
        const stockSede = p.stocks?.find((s: any) => s.sedeId === sedeActiva?.id)?.stock ?? p.stock ?? 0;

        setSelectedProducts([...selectedProducts, {
            id: p.id,
            codigo: p.codigo,
            descripcion: p.descripcion,
            stockActual: stockSede,
            cantidad: 1,
            unidadMedida: p.unidadMedida?.nombre || ''
        }]);
        setSearchTerm('');
        setSearchResults([]);
    };

    const removeProduct = (id: number) => {
        setSelectedProducts(selectedProducts.filter(p => p.id !== id));
    };

    const updateQuantity = (id: number, qty: number) => {
        setSelectedProducts(selectedProducts.map(p => {
            if (p.id === id) {
                return { ...p, cantidad: Math.max(1, qty) };
            }
            return p;
        }));
    };

    const handleTraslado = async () => {
        if (!destinationSedeId) {
            alert('Debe seleccionar una sede de destino', 'error');
            return;
        }
        if (selectedProducts.length === 0) {
            alert('Debe agregar al menos un producto', 'error');
            return;
        }

        // Validar stock
        for (const p of selectedProducts) {
            if (p.cantidad > p.stockActual) {
                alert(`Stock insuficiente para ${p.descripcion}. Disponible: ${p.stockActual}`, 'error');
                return;
            }
        }

        try {
            setIsSubmitting(true);
            await apiClient.post('/kardex/traslado', {
                sedeOrigenId: sedeActiva?.id,
                sedeDestinoId: destinationSedeId,
                observacion,
                items: selectedProducts.map(p => ({
                    productoId: p.id,
                    cantidad: p.cantidad
                }))
            });

            const sedeDestinoObj = sedes.find(s => s.id === destinationSedeId);
            setTransferData({
                company: auth,
                sedeOrigen: sedeActiva,
                sedeDestino: sedeDestinoObj,
                user: auth?.usuario,
                date: new Date(),
                products: [...selectedProducts],
                observacion
            });
            
            setIsSuccess(true);
            alert('Traslado guardado correctamente', 'success');
        } catch (error: any) {

            alert(error.response?.data?.message || 'Error al realizar el traslado', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const sedesDestino = sedes.filter(s => s.activo && s.id !== sedeActiva?.id);

    return (
        <div className="min-h-screen px-4 pb-8 font-inter dark:bg-[#0A0D14]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Traslado de Stock entre Sedes</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Mueve mercadería de forma segura entre tus sucursales</p>
                </div>
                <Button outline onClick={() => navigate('/administrador/kardex')}>
                    <Icon icon="solar:alt-arrow-left-linear" className="mr-2" />
                    Volver al Kardex
                </Button>
            </div>

            {isSuccess && transferData ? (
                <div className="bg-white dark:bg-[#111827] p-10 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mb-6">
                        <Icon icon="solar:check-circle-bold" width={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">¡Traslado completado con éxito!</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 text-center max-w-md">
                        Los productos han sido descontados de tu sede origen y agregados a la sede destino correctamente.
                    </p>
                    <div className="flex gap-4">
                        <Button color="secondary" onClick={() => handlePrint()}>
                            <Icon icon="solar:printer-minimalistic-bold" className="mr-2" />
                            Imprimir Reporte
                        </Button>
                        <Button outline onClick={() => {
                            setIsSuccess(false);
                            setSelectedProducts([]);
                            setDestinationSedeId(null);
                            setObservacion('');
                            setTransferData(null);
                        }}>
                            Nuevo Traslado
                        </Button>
                    </div>

                    <TrasladoPrintPage
                        componentRef={printComponentRef}
                        company={transferData.company}
                        sedeOrigen={transferData.sedeOrigen}
                        sedeDestino={transferData.sedeDestino}
                        user={transferData.user}
                        date={transferData.date}
                        products={transferData.products}
                        observacion={transferData.observacion}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Panel Izquierdo: Configuración y Búsqueda */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                        <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">1. Configuración del Traslado</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Sede de Origen</label>
                                <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-400 dark:text-gray-400">
                                    <Icon icon="solar:city-bold-duotone" width={18} />
                                    <span className="text-sm font-medium dark:text-gray-300">{sedeActiva?.nombre} (Actual)</span>
                                </div>
                            </div>

                            <Select
                                label="Sede de Destino"
                                name="sedeDestino"
                                options={sedesDestino.map(s => ({ id: s.id, value: s.nombre }))}
                                onChange={(val) => setDestinationSedeId(Number(val))}
                                error={!destinationSedeId ? "Selecciona destino" : ""}
                            />

                            <InputPro
                                label="Observación (Opcional)"
                                name="observacion"
                                value={observacion}
                                onChange={(e: any) => setObservacion(e.target.value)}
                                isLabel
                            />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 relative" ref={searchRef}>
                        <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">2. Agregar Productos</h3>

                        {/* Barcode scanner */}
                        <BarcodeScannerInput
                            className="mb-3"
                            inputRef={barcodeRef}
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            onScan={handleBarcodeScan}
                            loading={barcodeLoading}
                        />

                        <div className="relative">
                            <InputPro
                                name="buscarProductos"
                                placeholder="Buscar por nombre o código..."
                                value={searchTerm}
                                onChange={(e: any) => setSearchTerm(e.target.value)}
                            />
                            {loadingProducts && (
                                <div className="absolute right-3 top-3">
                                    <Icon icon="line-md:loading-twotone-loop" className="text-[#4F6EF7]" width={20} />
                                </div>
                            )}
                        </div>

                        {searchResults.length > 0 && (
                            <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#111827] border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto m-5">
                                {searchResults.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => addProduct(p)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border-b border-gray-50 dark:border-slate-700 last:border-0"
                                    >
                                        <div className="h-11 w-11 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                                            {p.imagenUrl ? (
                                                <img
                                                    src={p.imagenUrl}
                                                    alt={p.descripcion}
                                                    className="h-full w-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <Icon icon="solar:box-minimalistic-linear" className="text-gray-300" width={18} />
                                            )}
                                        </div>

                                        <div className="flex flex-col min-w-0 flex-1">
                                            <div className="flex justify-between items-start gap-2 w-full">
                                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{p.descripcion}</span>
                                                <span className="text-xs font-bold text-[#4F6EF7] shrink-0">{p.codigo}</span>
                                            </div>
                                            <div className="flex justify-between w-full mt-1">
                                                <span className="text-[11px] text-gray-400 dark:text-gray-500">Stock actual: {p.stocks?.find((s: any) => s.sedeId === sedeActiva?.id)?.stock ?? p.stock ?? 0}</span>
                                                <span className="text-[11px] text-gray-400 dark:text-gray-500">{p.unidadMedida?.nombre}</span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Panel Derecho: Lista de Selección */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden min-h-[400px] flex flex-col">
                        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/30">
                            <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Productos a trasladar ({selectedProducts.length})</h3>
                            {selectedProducts.length > 0 && (
                                <button onClick={() => setSelectedProducts([])} className="text-xs font-semibold text-red-500 hover:text-red-600">Limpiar lista</button>
                            )}
                        </div>

                        <div className="flex-1 overflow-x-auto">
                            {selectedProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-20 text-gray-300 dark:text-slate-700">
                                    <Icon icon="solar:box-minimalistic-linear" width={64} className="mb-4 opacity-20" />
                                    <p className="text-sm font-medium">No has agregado productos aún</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-white dark:bg-[#111827] border-b border-gray-100 dark:border-slate-800">
                                            <th className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Producto</th>
                                            <th className="text-center px-5 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Stock Origen</th>
                                            <th className="text-center px-5 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-32">Cantidad</th>
                                            <th className="text-right px-5 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedProducts.map((p) => (
                                            <tr key={p.id} className="border-b border-gray-50 dark:border-slate-800 last:border-0 hover:bg-gray-50/30 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{p.descripcion}</span>
                                                        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">{p.codigo}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{p.stockActual} {p.unidadMedida}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            value={p.cantidad}
                                                            onChange={(e) => updateQuantity(p.id, Number(e.target.value))}
                                                            className="w-full h-9 px-3 text-sm border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-[#4F6EF7] outline-none transition-all text-center bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-200"
                                                            min={1}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        onClick={() => removeProduct(p.id)}
                                                        className="h-8 w-8 inline-flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Icon icon="solar:trash-bin-trash-linear" width={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="p-5 bg-gray-50/50 dark:bg-slate-900/30 border-t border-gray-100 dark:border-slate-800">
                            <Button
                                color="primary"
                                className="w-full py-3.5 shadow-lg shadow-indigo-100"
                                onClick={handleTraslado}
                                disabled={isSubmitting || selectedProducts.length === 0}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Icon icon="line-md:loading-twotone-loop" className="mr-2" />
                                        Procesando traslado...
                                    </>
                                ) : (
                                    <>
                                        <Icon icon="solar:transfer-horizontal-bold" className="mr-2" />
                                        Confirmar Traslado de Mercadería
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
}
