import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import { get } from '@/utils/fetch';
import { useReactToPrint } from 'react-to-print';
import CatalogoPrintTemplate from './CatalogoPrintTemplate';
import { useAuthStore } from '@/zustand/auth';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function ModalPreviewCatalogo({ isOpen, onClose }: Props) {
    const { auth } = useAuthStore();
    const [productos, setProductos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState<'moderna' | 'tecnica' | 'minimal' | 'menu'>('moderna');
    const [onlyTienda, setOnlyTienda] = useState(false);
    const [showPrice, setShowPrice] = useState(true);
    const [showStock, setShowStock] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [prodSearch, setProdSearch] = useState('');

    const toggleOne = (id: number) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const toggleAll = () =>
        setSelectedIds(prev => prev.length === productos.length ? [] : productos.map(p => p.id));

    const selectedProductos = productos.filter(p => selectedIds.includes(p.id));
    const listProductos = productos.filter(p =>
        `${p.nombre || ''} ${p.codigo || ''}`.toLowerCase().includes(prodSearch.toLowerCase()));

    // Auto-detect theme based on rubro
    useEffect(() => {
        if (!auth?.empresa?.rubro?.nombre) return;
        const rubro = auth.empresa.rubro.nombre;
        if (['Ferretería', 'Tecnología y software', 'Ventas de accesorios y repuestos de cómputo', 'Automotriz y repuestos'].includes(rubro)) {
            setTheme('tecnica');
        } else if (['Restaurante y alimentos', 'Panadería y Pastelería', 'Restaurantes y comida'].includes(rubro)) {
            setTheme('menu');
        } else if (['Textil y confección', 'Belleza y cuidado personal'].includes(rubro)) {
            setTheme('minimal');
        } else {
            setTheme('moderna');
        }
    }, [auth?.empresa?.rubro?.nombre]);

    useEffect(() => {
        if (isOpen) {
            fetchProducts();
        }
    }, [isOpen, onlyTienda]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            // Fetch up to 500 products to avoid huge PDFs, filtered by status ACTIVO
            let query = 'estado=ACTIVO&limit=500';
            if (onlyTienda) {
                query += '&publicarEnTienda=true';
            }
            const resp: any = await get(`productos?${query}`);
            if (resp.code === 1 && resp.data?.productos) {
                setProductos(resp.data.productos);
                setSelectedIds(resp.data.productos.map((p: any) => p.id));
            }
        } catch (error) {
            console.error('Error fetching catalog products:', error);
        } finally {
            setLoading(false);
        }
    };

    const componentRef = useRef(null);
    const printFn = useReactToPrint({
        // @ts-ignore
        contentRef: componentRef,
        documentTitle: `Catalogo_${auth?.empresa?.razonSocial?.replace(/\s+/g, '_') || 'Productos'}`,
    });

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-6xl h-[95vh] flex flex-col border border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Icon icon="solar:book-bookmark-bold-duotone" className="text-blue-600 text-xl" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Generar Catálogo PDF</h2>
                            <p className="text-xs text-gray-500">Imprime un PDF con tus productos ({selectedProductos.length} de {productos.length} seleccionados)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <Icon icon="solar:close-circle-bold" className="text-2xl" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Configuration */}
                    <div className="w-72 border-r border-gray-100 dark:border-slate-800 p-5 flex flex-col gap-6 overflow-y-auto bg-white dark:bg-slate-900">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Diseño del Catálogo</label>
                            <select
                                value={theme}
                                onChange={(e) => setTheme(e.target.value as any)}
                                className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white outline-none"
                            >
                                <option value="moderna">Moderna (Grilla de imágenes)</option>
                                <option value="tecnica">Técnica (Lista con detalles)</option>
                                <option value="minimal">Minimalista (Lista compacta)</option>
                                <option value="menu">Menú (Categorías separadas)</option>
                                <option value="premium-tech">Tecnología Premium (Laptops/Celulares)</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Filtros</label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={onlyTienda}
                                    onChange={(e) => setOnlyTienda(e.target.checked)}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                Solo productos "Públicos" (Tienda)
                            </label>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Mostrar en el catálogo</label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showPrice}
                                        onChange={(e) => setShowPrice(e.target.checked)}
                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                    />
                                    Precios
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showStock}
                                        onChange={(e) => setShowStock(e.target.checked)}
                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                    />
                                    Stock disponible
                                </label>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Productos ({selectedIds.length}/{productos.length})
                                </label>
                                <button
                                    onClick={toggleAll}
                                    disabled={productos.length === 0}
                                    className="text-[11px] font-semibold text-blue-600 hover:underline disabled:opacity-40"
                                >
                                    {selectedIds.length === productos.length && productos.length > 0 ? 'Ninguno' : 'Todos'}
                                </button>
                            </div>
                            <input
                                value={prodSearch}
                                onChange={(e) => setProdSearch(e.target.value)}
                                placeholder="Buscar producto..."
                                className="w-full mb-2 p-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
                            />
                            <div className="border border-gray-100 dark:border-slate-800 rounded-lg overflow-y-auto max-h-52 divide-y divide-gray-50 dark:divide-slate-800">
                                {listProductos.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-4">Sin resultados</p>
                                ) : listProductos.map(p => (
                                    <label key={p.id} className="flex items-center gap-2 px-2.5 py-1.5 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(p.id)}
                                            onChange={() => toggleOne(p.id)}
                                            className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 shrink-0"
                                        />
                                        <span className="truncate text-gray-700 dark:text-gray-300">{p.nombre}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-slate-800">
                            <Button
                                color="primary"
                                className="w-full py-3 text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                                onClick={() => printFn()}
                                disabled={loading || selectedProductos.length === 0}
                            >
                                <Icon icon="solar:printer-bold" className="text-lg" />
                                Imprimir / Guardar PDF
                            </Button>
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 overflow-auto p-8 bg-gray-200 dark:bg-slate-950 flex justify-center relative">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center text-gray-500 h-full absolute inset-0">
                                <Icon icon="line-md:loading-twotone-loop" className="text-4xl text-blue-500 mb-2" />
                                <p>Cargando catálogo...</p>
                            </div>
                        ) : selectedProductos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-gray-500 h-full absolute inset-0 text-center">
                                <Icon icon="solar:box-minimalistic-broken" className="text-5xl text-gray-400 mb-3" />
                                <p className="font-semibold text-gray-600 dark:text-gray-300">
                                    {productos.length === 0 ? 'No hay productos disponibles' : 'Selecciona al menos un producto'}
                                </p>
                                <p className="text-sm opacity-70 mt-1 max-w-sm">
                                    {productos.length === 0
                                        ? 'Intenta registrar más productos activos o cambia el filtro de "Solo productos Públicos".'
                                        : 'Marca los productos que quieres incluir en el catálogo desde el panel de la izquierda.'}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white shadow-2xl rounded-sm w-[210mm] min-h-[297mm] origin-top transform sm:scale-[0.6] md:scale-75 lg:scale-90 xl:scale-100 transition-transform">
                                <CatalogoPrintTemplate
                                    componentRef={componentRef}
                                    productos={selectedProductos}
                                    theme={theme}
                                    company={auth?.empresa}
                                    showPrice={showPrice}
                                    showStock={showStock}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
