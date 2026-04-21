import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import StoreHeader from '@/components/tienda/StoreHeader';
import Footer from '@/components/tienda/Footer';
import ProductCardPio from '@/components/tienda/ProductCardPio';
import ProductCustomizationModal from '@/components/tienda/ProductCustomizationModal';
import ShoppingCartModal from '@/components/tienda/ShoppingCartModal';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function Catalogo() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [tienda, setTienda] = useState<any>(null);
    const [productos, setProductos] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const limit = 30;

    const [carrito, setCarrito] = useState<any[]>([]);
    const [isCartLoaded, setIsCartLoaded] = useState(false);
    const [mostrarCarrito, setMostrarCarrito] = useState(false);

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [isAdminOpen, setIsAdminOpen] = useState(false);
    const adminMenuRef = useRef<HTMLDivElement | null>(null);

    const [allBrands, setAllBrands] = useState<any[]>([]);
    const [allCategories, setAllCategories] = useState<any[]>([]);
    const [selectedBrands, setSelectedBrands] = useState<string[]>(() => {
        const b = searchParams.get('brand');
        return b ? [b] : [];
    });
    const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
        const c = searchParams.get('category');
        return c ? [c] : [];
    });
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(1000);
    const [brandSearch, setBrandSearch] = useState('');
    const [openSections, setOpenSections] = useState({ categories: true, price: true, brands: true });
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const [showPersonalizarModal, setShowPersonalizarModal] = useState(false);
    const [productoAPersonalizar, setProductoAPersonalizar] = useState<any>(null);
    const [modificadoresProducto, setModificadoresProducto] = useState<any[]>([]);

    useEffect(() => {
        cargarTienda();
        cargarMarcas();
        cargarCategorias();
        cargarRangoPrecios();
        try {
            const saved = localStorage.getItem(`tienda:${slug}:carrito`);
            if (saved) setCarrito(JSON.parse(saved));
        } catch { }
        setIsCartLoaded(true);
    }, [slug]);

    useEffect(() => {
        if (!isCartLoaded) return;
        try { localStorage.setItem(`tienda:${slug}:carrito`, JSON.stringify(carrito)); } catch { }
    }, [carrito, isCartLoaded, slug]);

    useEffect(() => {
        const t = setTimeout(() => {
            setLoading(true);
            setProductos([]);
            setPage(1);
            setTotal(0);
            cargarProductos(1, true);
        }, 350);
        return () => clearTimeout(t);
    }, [search, selectedBrands, selectedCategories, priceRange]);

    const cargarTienda = async () => {
        try {
            const { data } = await axios.get(`${BASE_URL}/public/store/${slug}`);
            setTienda(data.data || data);
        } catch { }
    };

    const cargarMarcas = async () => {
        try {
            const { data } = await axios.get(`${BASE_URL}/public/store/${slug}/brands`);
            setAllBrands(Array.isArray(data?.data) ? data.data : []);
        } catch { }
    };

    const cargarCategorias = async () => {
        try {
            const { data } = await axios.get(`${BASE_URL}/public/store/${slug}/categories`);
            setAllCategories(Array.isArray(data?.data) ? data.data : []);
        } catch { }
    };

    const cargarRangoPrecios = async () => {
        try {
            const { data } = await axios.get(`${BASE_URL}/public/store/${slug}/price-range`);
            const pd = data?.data || { min: 0, max: 1000 };
            setMinPrice(pd.min); setMaxPrice(pd.max); setPriceRange([pd.min, pd.max]);
        } catch { setMinPrice(0); setMaxPrice(1000); setPriceRange([0, 1000]); }
    };

    const cargarProductos = async (p = 1, reset = false) => {
        try {
            const { data } = await axios.get(`${BASE_URL}/public/store/${slug}/products`, {
                params: {
                    page: p, limit,
                    search: search.trim() || undefined,
                    brand: selectedBrands.length > 0 ? selectedBrands.join(',') : undefined,
                    category: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
                    minPrice: priceRange[0] !== minPrice ? priceRange[0] : undefined,
                    maxPrice: priceRange[1] !== maxPrice ? priceRange[1] : undefined,
                },
            });
            let items: any[] = [];
            let totalItems = 0;
            let currentPage = p;
            if (Array.isArray(data?.data?.data)) { items = data.data.data; totalItems = data.data.total ?? items.length; currentPage = data.data.page ?? p; }
            else if (Array.isArray(data?.data)) { items = data.data; totalItems = data.total ?? items.length; currentPage = data.page ?? p; }
            else if (Array.isArray(data)) { items = data; totalItems = data.length; }
            setTotal(totalItems); setPage(currentPage);
            if (reset) setProductos(items); else setProductos(prev => [...prev, ...items]);
        } catch { }
        finally { setLoading(false); }
    };

    const cargarModificadores = async (productoId: number) => {
        try {
            const { data } = await axios.get(`${BASE_URL}/public/store/${slug}/products/${productoId}/modifiers`);
            return data.data || data || [];
        } catch { return []; }
    };

    const handleAgregarProducto = async (producto: any) => {
        const mods = await cargarModificadores(producto.id);
        if (mods.length > 0) {
            setProductoAPersonalizar(producto); setModificadoresProducto(mods); setShowPersonalizarModal(true);
        } else { agregarAlCarritoDirecto(producto); }
    };

    const agregarAlCarritoDirecto = (producto: any, modificadores?: any[]) => {
        const itemId = modificadores?.length ? `${producto.id}-${Date.now()}` : producto.id;
        const precioExtra = modificadores?.reduce((sum, mod) => sum + Number(mod.precioExtra || 0), 0) || 0;
        const nuevoItem = { ...producto, id: itemId, productoId: producto.id, cantidad: 1, precioBase: producto.precioUnitario, precioUnitario: Number(producto.precioUnitario) + precioExtra, modificadores: modificadores || [] };
        if (!modificadores?.length) {
            const existe = carrito.find(item => item.id === producto.id && !item.modificadores?.length);
            if (existe) { setCarrito(carrito.map(item => item.id === producto.id && !item.modificadores?.length ? { ...item, cantidad: item.cantidad + 1 } : item)); return; }
        }
        setCarrito([...carrito, nuevoItem]);
    };

    const actualizarCantidad = (productoId: any, cantidad: number) => {
        if (cantidad <= 0) setCarrito(carrito.filter(item => item.id !== productoId));
        else setCarrito(carrito.map(item => item.id === productoId ? { ...item, cantidad } : item));
    };

    const irACheckout = () => navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } });

    const toggleSection = (section: keyof typeof openSections) => setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    const toggleBrand = (name: string) => setSelectedBrands(prev => prev.includes(name) ? prev.filter(b => b !== name) : [...prev, name]);
    const toggleCategory = (name: string) => setSelectedCategories(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);

    const filteredBrands = allBrands.filter(b => {
        const name = typeof b === 'string' ? b : b.nombre;
        return !brandSearch || name.toLowerCase().includes(brandSearch.toLowerCase());
    });

    const hasActiveFilters = selectedBrands.length > 0 || selectedCategories.length > 0 || priceRange[0] !== minPrice || priceRange[1] !== maxPrice;
    const pageTitle = selectedCategories[0] || selectedBrands[0] || 'Todos los productos';
    const diseno = tienda?.diseno || {};

    if (!tienda && loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <Icon icon="eos-icons:loading" className="w-12 h-12 text-[#FF9500]" />
            </div>
        );
    }

    const FilterSidebar = () => (
        <div className="bg-white rounded-2xl p-4 space-y-1">
            {/* Categories */}
            {allCategories.length > 0 && (
                <div className="border-b border-gray-100 pb-4 mb-1">
                    <button onClick={() => toggleSection('categories')} className="w-full flex items-center justify-between py-2 text-sm font-bold text-[#1A1A1A]">
                        Categorías
                        <Icon icon="solar:alt-arrow-down-linear" width={14} className={`transition-transform ${openSections.categories ? 'rotate-180' : ''}`} />
                    </button>
                    {openSections.categories && (
                        <div className="mt-2 space-y-2.5">
                            {allCategories.map((cat, i) => {
                                const name = typeof cat === 'string' ? cat : cat.nombre;
                                return (
                                    <label key={i} className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleCategory(name)}>
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selectedCategories.includes(name) ? 'border-[#FF9500]' : 'border-gray-300 group-hover:border-[#FF9500]'}`}>
                                            {selectedCategories.includes(name) && <div className="w-2 h-2 rounded-full bg-[#FF9500]" />}
                                        </div>
                                        <span className="text-sm text-[#1A1A1A]">{name}</span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Price */}
            <div className="border-b border-gray-100 pb-4 mb-1">
                <button onClick={() => toggleSection('price')} className="w-full flex items-center justify-between py-2 text-sm font-bold text-[#1A1A1A]">
                    Precio
                    <Icon icon="solar:alt-arrow-down-linear" width={14} className={`transition-transform ${openSections.price ? 'rotate-180' : ''}`} />
                </button>
                {openSections.price && (
                    <div className="mt-3 space-y-3">
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Desde"
                                value={priceRange[0]}
                                onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])}
                                className="w-1/2 bg-[#F5F5F5] rounded-lg px-3 py-2 text-xs border-none focus:outline-none focus:ring-1 focus:ring-[#FF9500]"
                            />
                            <input
                                type="number"
                                placeholder="Hasta"
                                value={priceRange[1]}
                                onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                                className="w-1/2 bg-[#F5F5F5] rounded-lg px-3 py-2 text-xs border-none focus:outline-none focus:ring-1 focus:ring-[#FF9500]"
                            />
                        </div>
                        <input
                            type="range"
                            min={minPrice} max={maxPrice}
                            value={priceRange[1]}
                            onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                            className="w-full accent-[#FF9500]"
                        />
                    </div>
                )}
            </div>

            {/* Brands */}
            {allBrands.length > 0 && (
                <div className="pb-2">
                    <button onClick={() => toggleSection('brands')} className="w-full flex items-center justify-between py-2 text-sm font-bold text-[#1A1A1A]">
                        Marcas
                        <Icon icon="solar:alt-arrow-down-linear" width={14} className={`transition-transform ${openSections.brands ? 'rotate-180' : ''}`} />
                    </button>
                    {openSections.brands && (
                        <div className="mt-2 space-y-3">
                            <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-lg px-3 py-2">
                                <Icon icon="solar:magnifer-linear" className="text-gray-400" width={14} />
                                <input
                                    type="text"
                                    placeholder="Buscar"
                                    value={brandSearch}
                                    onChange={e => setBrandSearch(e.target.value)}
                                    className="bg-transparent text-xs border-none focus:outline-none w-full"
                                />
                            </div>
                            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                                {filteredBrands.map((brand, i) => {
                                    const name = typeof brand === 'string' ? brand : brand.nombre;
                                    return (
                                        <label key={i} className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleBrand(name)}>
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selectedBrands.includes(name) ? 'border-[#FF9500]' : 'border-gray-300 group-hover:border-[#FF9500]'}`}>
                                                {selectedBrands.includes(name) && <div className="w-2 h-2 rounded-full bg-[#FF9500]" />}
                                            </div>
                                            <span className="text-sm text-[#1A1A1A]">{name}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {hasActiveFilters && (
                <button
                    onClick={() => { setSelectedBrands([]); setSelectedCategories([]); setPriceRange([minPrice, maxPrice]); }}
                    className="w-full mt-3 py-2 text-xs font-bold text-[#FF9500] border border-[#FF9500] rounded-full hover:bg-[#FF9500] hover:text-white transition-colors"
                >
                    Limpiar filtros
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F6F6F6]" style={{ fontFamily: '"Mona Sans", Inter, sans-serif' }}>
            <StoreHeader
                tienda={tienda || {}}
                slug={slug || ''}
                carritoCount={carrito.length}
                onToggleCart={() => setMostrarCarrito(!mostrarCarrito)}
                isAdminOpen={isAdminOpen}
                setIsAdminOpen={setIsAdminOpen}
                adminMenuRef={adminMenuRef}
                search={search}
                setSearch={setSearch}
                categories={allBrands}
                onSelectCategory={(cat) => {
                    if (cat === '') setSelectedBrands([]);
                    else setSelectedBrands([cat]);
                }}
                recommendedProducts={productos.slice(0, 10)}
                onSearch={() => { }}
            />

            <main className="pt-[116px] pb-16">
                <div className="max-w-screen-xl mx-auto px-5 md:px-8 py-6">

                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-3 flex-wrap">
                        <button onClick={() => navigate(`/tienda/${slug}`)} className="flex items-center gap-1 hover:text-[#FF9500] transition-colors">
                            <Icon icon="solar:alt-arrow-left-linear" width={16} />
                            Inicio
                        </button>
                        {selectedCategories.map((c, i) => (
                            <span key={i} className="flex items-center gap-1.5">
                                <span className="text-gray-300">/</span>
                                <span className="text-[#1A1A1A] font-medium">{c}</span>
                            </span>
                        ))}
                        {selectedBrands.map((b, i) => (
                            <span key={i} className="flex items-center gap-1.5">
                                <span className="text-gray-300">/</span>
                                <span className="text-[#1A1A1A] font-medium">{b}</span>
                            </span>
                        ))}
                    </nav>

                    <div className="flex items-center justify-between mb-5">
                        <h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A]">{pageTitle}</h1>
                        {/* Mobile filter toggle */}
                        <button
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                            className="md:hidden flex items-center gap-2 bg-white rounded-full px-4 py-2 text-sm font-bold border border-gray-200"
                        >
                            <Icon icon="solar:filter-bold" width={16} className="text-[#FF9500]" />
                            Filtros
                            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[#FF9500]" />}
                        </button>
                    </div>

                    {/* Mobile filters drawer */}
                    {showMobileFilters && (
                        <div className="md:hidden mb-4">
                            <FilterSidebar />
                        </div>
                    )}

                    <div className="flex gap-6">
                        {/* Left Sidebar */}
                        <aside className="w-60 flex-shrink-0 hidden md:block">
                            <div className="sticky top-28">
                                <FilterSidebar />
                            </div>
                        </aside>

                        {/* Product Grid */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm text-gray-500">
                                    {loading ? 'Cargando...' : `${total} producto${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
                                </p>
                            </div>

                            {loading ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <div key={i} className="animate-pulse bg-white rounded-2xl overflow-hidden">
                                            <div className="bg-[#FAF6F1] aspect-square w-full" />
                                            <div className="p-3 space-y-2">
                                                <div className="h-4 bg-gray-100 w-1/2 rounded" />
                                                <div className="h-3 bg-gray-100 w-3/4 rounded" />
                                                <div className="h-8 bg-[#FEF0DC] w-full rounded mt-3" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : productos.length === 0 ? (
                                <div className="py-24 text-center">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Icon icon="solar:box-linear" className="text-gray-300 text-3xl" />
                                    </div>
                                    <h3 className="font-black text-[#1A1A1A] mb-2">Sin resultados</h3>
                                    <p className="text-sm text-gray-500 mb-4">Intenta ajustar tus filtros.</p>
                                    <button
                                        onClick={() => { setSearch(''); setSelectedBrands([]); setSelectedCategories([]); setPriceRange([minPrice, maxPrice]); }}
                                        className="text-sm font-bold text-[#FF9500] border border-[#FF9500] px-5 py-2 rounded-full hover:bg-[#FF9500] hover:text-white transition-all"
                                    >
                                        Limpiar Filtros
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                                        {productos.map((producto) => (
                                            <ProductCardPio
                                                key={producto.id}
                                                producto={producto}
                                                slug={slug || ''}
                                                diseno={diseno}
                                                onAddToCart={handleAgregarProducto}
                                                onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)}
                                            />
                                        ))}
                                    </div>

                                    {productos.length < total && (
                                        <div className="mt-8 flex justify-center">
                                            <button
                                                onClick={() => {
                                                    const next = page + 1;
                                                    setPage(next);
                                                    cargarProductos(next);
                                                }}
                                                className="px-8 py-3 rounded-full font-bold text-sm border-2 border-[#FF9500] text-[#FF9500] hover:bg-[#FF9500] hover:text-white transition-colors"
                                            >
                                                Cargar más productos
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer tienda={tienda || {}} diseno={diseno} />

            {tienda && mostrarCarrito && (
                <ShoppingCartModal
                    isOpen={mostrarCarrito}
                    onClose={() => setMostrarCarrito(false)}
                    carrito={carrito}
                    tienda={tienda}
                    actualizarCantidad={actualizarCantidad}
                    onCheckout={irACheckout}
                />
            )}

            {showPersonalizarModal && productoAPersonalizar && (
                <ProductCustomizationModal
                    isOpen={showPersonalizarModal}
                    onClose={() => { setShowPersonalizarModal(false); setProductoAPersonalizar(null); }}
                    product={productoAPersonalizar}
                    modifiers={modificadoresProducto}
                    onConfirm={(producto, mods) => { agregarAlCarritoDirecto(producto, mods); setShowPersonalizarModal(false); setProductoAPersonalizar(null); }}
                />
            )}
        </div>
    );
}
