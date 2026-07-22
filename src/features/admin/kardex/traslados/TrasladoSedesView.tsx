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
import {
    InventoryCard,
    InventoryEmptyState,
    InventoryHero,
    InventoryInfoPill,
    InventoryPage,
    InventoryToolbar,
    InventoryToolbarButton,
} from '../shared/InventoryChrome';


interface SelectedProduct {
    id: number;
    codigo: string;
    descripcion: string;
    stockActual: number;
    cantidad: number;
    unidadMedida: string;
    imagenUrl?: string;
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
            const resp: any = await get(`productos/barcode/${encodeURIComponent(trimmed)}`);
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
                const { data } = await apiClient.get('/productos', {
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

        const stockSede = p.stocks?.find((s: any) => s.sedeId === sedeActiva?.id)?.stock ?? p.stock ?? 0;

        setSelectedProducts([...selectedProducts, {
            id: p.id,
            codigo: p.codigo,
            descripcion: p.descripcion,
            stockActual: stockSede,
            cantidad: 1,
            unidadMedida: p.unidadMedida?.nombre || '',
            imagenUrl: p.imagenUrl
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
    const sedeDestino = sedes.find(s => s.id === destinationSedeId);
    const totalUnidades = selectedProducts.reduce((sum, p) => sum + p.cantidad, 0);
    const hasStockIssues = selectedProducts.some(p => p.cantidad > p.stockActual);

    return (
        <InventoryPage>
            <InventoryHero
                icon="solar:transfer-horizontal-bold-duotone"
                title="Traslado entre sedes"
                subtitle="Coordina movimientos internos de inventario con una vista más limpia y enfocada en operación."
                badge="Seguro"
                actions={
                    <>
                        <InventoryToolbarButton
                            icon="solar:alt-arrow-left-linear"
                            label="Volver al kardex"
                            onClick={() => navigate('/administrador/kardex')}
                        />
                        <InventoryInfoPill
                            icon="solar:box-linear"
                            label={`${selectedProducts.length} productos`}
                        />
                    </>
                }
            />

            {isSuccess && transferData ? (
                <InventoryCard className="p-10 flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 text-green-500 rounded-2xl flex items-center justify-center mb-5">
                        <Icon icon="solar:check-circle-bold" width={44} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Traslado completado</h2>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-8 text-center max-w-md">
                        Los productos han sido descontados de <span className="font-semibold text-gray-600 dark:text-gray-300">{transferData.sedeOrigen?.nombre}</span> y agregados a <span className="font-semibold text-gray-600 dark:text-gray-300">{transferData.sedeDestino?.nombre}</span>.
                    </p>
                    <div className="flex gap-3">
                        <Button color="secondary" onClick={() => handlePrint()}>
                            <Icon icon="solar:printer-minimalistic-bold" className="mr-2" width={16} />
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
                </InventoryCard>
            ) : (
                <InventoryCard>
                    <InventoryToolbar>
                        <div className="flex flex-wrap items-center gap-3">
                            <InventoryInfoPill
                                icon="solar:shop-2-linear"
                                label={sedeActiva?.nombre || 'Sin sede origen'}
                            />
                            {sedeDestino ? (
                                <InventoryInfoPill
                                    icon="solar:route-linear"
                                    label={`Destino: ${sedeDestino.nombre}`}
                                />
                            ) : null}
                        </div>
                        <InventoryToolbarButton
                            icon="solar:transfer-horizontal-bold"
                            label={selectedProducts.length ? 'Traslado en preparación' : 'Agrega productos'}
                            onClick={() => barcodeRef.current?.focus()}
                        />
                    </InventoryToolbar>

                <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-3">

                    {/* Panel Izquierdo */}
                    <div className="lg:col-span-1 space-y-4">

                        {/* Configuración */}
                        <div className="rounded-[26px] border border-slate-100 bg-[#fbfcff] p-5 dark:border-slate-800 dark:bg-slate-900/40">
                            <div className="flex items-center gap-2.5 mb-4">
                                <span className="w-5 h-5 bg-[#4F6EF7] text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">1</span>
                                <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Configuración del Traslado</span>
                            </div>

                            {/* Route visualizer */}
                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-800 mb-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Origen</p>
                                    <div className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800/50 rounded-lg">
                                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate block">{sedeActiva?.nombre}</span>
                                    </div>
                                </div>

                                <div className="flex items-center pt-3 shrink-0">
                                    <div className={`w-4 h-px ${destinationSedeId ? 'bg-indigo-400' : 'bg-gray-200 dark:bg-slate-700'} transition-colors`} />
                                    <Icon
                                        icon="solar:arrow-right-bold"
                                        width={13}
                                        className={`transition-colors ${destinationSedeId ? 'text-[#4F6EF7]' : 'text-gray-300 dark:text-slate-600'}`}
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Destino</p>
                                    <div className={`px-2.5 py-1.5 rounded-lg border transition-all duration-200 ${
                                        destinationSedeId
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700'
                                            : 'bg-white dark:bg-slate-800 border-dashed border-gray-200 dark:border-slate-600'
                                    }`}>
                                        <span className={`text-xs font-semibold truncate block transition-colors ${destinationSedeId ? 'text-[#4F6EF7]' : 'text-gray-400 dark:text-slate-500'}`}>
                                            {sedeDestino?.nombre ?? 'Por seleccionar'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
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

                        {/* Buscador */}
                        <div className="rounded-[26px] border border-slate-100 bg-[#fbfcff] p-5 dark:border-slate-800 dark:bg-slate-900/40 relative" ref={searchRef}>
                            <div className="flex items-center gap-2.5 mb-4">
                                <span className="w-5 h-5 bg-[#4F6EF7] text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">2</span>
                                <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Agregar Productos</span>
                            </div>

                            <BarcodeScannerInput
                                className="mb-3"
                                inputRef={barcodeRef}
                                value={barcodeInput}
                                onChange={(e) => setBarcodeInput(e.target.value)}
                                onScan={handleBarcodeScan}
                                loading={barcodeLoading}
                                hideIcon={true}
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
                                        <Icon icon="line-md:loading-twotone-loop" className="text-[#4F6EF7]" width={18} />
                                    </div>
                                )}
                            </div>

                            {searchResults.length > 0 && (
                                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[#111827] border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto mx-5">
                                    {searchResults.map((p) => {
                                        const stockOrigen = p.stocks?.find((s: any) => s.sedeId === sedeActiva?.id)?.stock ?? p.stock ?? 0;
                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => addProduct(p)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border-b border-gray-50 dark:border-slate-700/50 last:border-0 text-left"
                                            >
                                                <div className="h-10 w-10 rounded-lg border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                                                    {p.imagenUrl ? (
                                                        <img src={p.imagenUrl} alt={p.descripcion} className="h-full w-full object-cover" loading="lazy" />
                                                    ) : (
                                                        <Icon icon="solar:box-minimalistic-linear" className="text-gray-300 dark:text-slate-600" width={16} />
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{p.descripcion}</span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="font-mono text-[10px] text-[#4F6EF7] font-bold">{p.codigo}</span>
                                                        <span className="text-[10px] text-gray-400 dark:text-gray-500">Stock: {stockOrigen} {p.unidadMedida?.nombre}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Panel Derecho: Lista */}
                    <div className="lg:col-span-2">
                        <div className="rounded-[26px] border border-slate-100 bg-[#fbfcff] dark:border-slate-800 dark:bg-slate-900/40 overflow-hidden flex flex-col min-h-[460px]">

                            {/* Table header */}
                            <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-5 h-5 bg-[#4F6EF7] text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">3</span>
                                    <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                        Productos a Trasladar
                                        {selectedProducts.length > 0 && (
                                            <span className="ml-1.5 text-[#4F6EF7]">({selectedProducts.length})</span>
                                        )}
                                    </span>
                                </div>
                                {selectedProducts.length > 0 && (
                                    <button
                                        onClick={() => setSelectedProducts([])}
                                        className="text-xs font-semibold text-red-400 hover:text-red-500 transition-colors"
                                    >
                                        Limpiar lista
                                    </button>
                                )}
                            </div>

                            {/* Table or empty state */}
                            <div className="flex-1 overflow-x-auto">
                                {selectedProducts.length === 0 ? (
                                    <InventoryEmptyState
                                        icon="solar:box-minimalistic-linear"
                                        title="Sin productos agregados"
                                        subtitle="Busca por nombre, código o escanea un código de barras para preparar el traslado."
                                    />
                                ) : (
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-100 dark:border-slate-800">
                                                <th className="text-left px-5 py-3 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Producto</th>
                                                <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Disponible</th>
                                                <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider w-32">Cantidad</th>
                                                <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Restante</th>
                                                <th className="px-4 py-3 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedProducts.map((p) => {
                                                const remaining = p.stockActual - p.cantidad;
                                                const isOver = p.cantidad > p.stockActual;
                                                const isLow = !isOver && remaining <= Math.ceil(p.stockActual * 0.2);

                                                return (
                                                    <tr
                                                        key={p.id}
                                                        className={`border-b border-gray-50 dark:border-slate-800/60 last:border-0 transition-colors ${
                                                            isOver
                                                                ? 'bg-red-50/40 dark:bg-red-900/5'
                                                                : 'hover:bg-gray-50/40 dark:hover:bg-slate-800/20'
                                                        }`}
                                                    >
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-lg border border-gray-100 dark:border-slate-700 overflow-hidden bg-gray-50 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                                                                    {p.imagenUrl ? (
                                                                        <img src={p.imagenUrl} alt={p.descripcion} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <Icon icon="solar:box-minimalistic-linear" className="text-gray-300 dark:text-slate-600" width={18} />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{p.descripcion}</p>
                                                                    <p className="font-mono text-[10px] font-bold text-[#4F6EF7] mt-0.5">{p.codigo}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-center">
                                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                                {p.stockActual}
                                                                {p.unidadMedida && (
                                                                    <span className="text-[10px] text-gray-400 ml-0.5">{p.unidadMedida}</span>
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <input
                                                                type="number"
                                                                value={p.cantidad}
                                                                onChange={(e) => updateQuantity(p.id, Number(e.target.value))}
                                                                className={`w-full h-8 px-3 text-sm font-semibold border rounded-lg focus:ring-2 outline-none transition-all text-center ${
                                                                    isOver
                                                                        ? 'border-red-300 dark:border-red-700/60 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 focus:ring-red-100 dark:focus:ring-red-900/20'
                                                                        : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-200 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 focus:border-[#4F6EF7]'
                                                                }`}
                                                                min={1}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3.5 text-center">
                                                            {isOver ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-[10px] font-bold rounded-full">
                                                                    <Icon icon="solar:danger-circle-bold" width={10} />
                                                                    Sin stock
                                                                </span>
                                                            ) : (
                                                                <span className={`text-sm font-semibold ${isLow ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                                    {remaining}
                                                                    {p.unidadMedida && (
                                                                        <span className="text-[10px] font-normal text-gray-400 ml-0.5">{p.unidadMedida}</span>
                                                                    )}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <button
                                                                onClick={() => removeProduct(p.id)}
                                                                className="h-7 w-7 inline-flex items-center justify-center text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            >
                                                                <Icon icon="solar:trash-bin-trash-linear" width={15} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-5 border-t border-gray-100 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-900/20">
                                {selectedProducts.length > 0 && (
                                    <div className="flex items-center justify-between mb-3 px-0.5">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <p className="text-base font-bold text-gray-800 dark:text-white leading-none">{selectedProducts.length}</p>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Productos</p>
                                            </div>
                                            <div className="w-px h-7 bg-gray-200 dark:bg-slate-700" />
                                            <div>
                                                <p className="text-base font-bold text-gray-800 dark:text-white leading-none">{totalUnidades}</p>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Unidades</p>
                                            </div>
                                        </div>
                                        {hasStockIssues && (
                                            <span className="flex items-center gap-1.5 text-xs text-red-500 font-semibold bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 px-3 py-1.5 rounded-lg">
                                                <Icon icon="solar:danger-triangle-bold" width={13} />
                                                Stock insuficiente
                                            </span>
                                        )}
                                    </div>
                                )}

                                <Button
                                    color="primary"
                                    className="w-full py-3"
                                    onClick={handleTraslado}
                                    disabled={isSubmitting || selectedProducts.length === 0}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Icon icon="line-md:loading-twotone-loop" className="mr-2" width={16} />
                                            Procesando traslado...
                                        </>
                                    ) : (
                                        <>
                                            <Icon icon="solar:transfer-horizontal-bold" className="mr-2" width={16} />
                                            Confirmar Traslado de Mercadería
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                </InventoryCard>
            )}
        </InventoryPage>
    );
}
