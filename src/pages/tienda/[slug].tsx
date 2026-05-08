import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import SliderBanners from '@/components/tienda/SliderBanners';
import Footer from '@/components/tienda/Footer';
import StoreHeader from '@/components/tienda/StoreHeader';
import CategoryCircles from '@/components/tienda/CategoryCircles';
import ComboCard from '@/components/tienda/ComboCard';
import ProductCardPio from '@/components/tienda/ProductCardPio';
import StoreSidebar from '@/components/tienda/StoreSidebar';
import ProductCustomizationModal from '@/components/tienda/ProductCustomizationModal';
import ShoppingCartModal from '@/components/tienda/ShoppingCartModal';
import PromoBanners from '@/components/tienda/PromoBanners';
import MembershipBanner from '@/components/tienda/MembershipBanner';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function TiendaPublica() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [tienda, setTienda] = useState<any>(null);
  const [productos, setProductos] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 30;
  const [carrito, setCarrito] = useState<any[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement | null>(null);
  const [combos, setCombos] = useState<any[]>([]);
  const [wholesaleProducts, setWholesaleProducts] = useState<any[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);

  // Estado para modal de personalización
  const [showPersonalizarModal, setShowPersonalizarModal] = useState(false);
  const [productoAPersonalizar, setProductoAPersonalizar] = useState<any>(null);
  const [modificadoresProducto, setModificadoresProducto] = useState<any[]>([]);
  const [loadingModificadores, setLoadingModificadores] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);


  useEffect(() => {
    cargarTienda();
    cargarCombos();
    cargarProductosMayoristas();
    cargarCategorias(); // Fetch categories
    cargarRangoPrecios(); // Fetch price bounds
    // reset de productos al cambiar slug
    setProductos([]);
    setPage(1);
    setTotal(0);
    cargarProductos(1, true);

    // rehidratar carrito persistido
    try {
      const saved = localStorage.getItem(`tienda:${slug}:carrito`);
      if (saved) {
        const carritoGuardado = JSON.parse(saved);
        setCarrito(carritoGuardado);
        // Refrescar URLs de imágenes que podrían haber expirado
        refrescarImagenesCarrito(carritoGuardado);
      }
    } catch { }
    setIsCartLoaded(true);
  }, [slug]);


  const productIdParam = searchParams.get('product');

  useEffect(() => {
    if (productIdParam && slug) {
      const fetchAndAction = async () => {
        try {
          const { data } = await axios.get(`${BASE_URL}/public/store/${slug}/products/${productIdParam}`);
          const product = data.data || data;
          if (product) {
            handleAgregarProducto(product);
            // Remove param to avoid re-triggering on refresh
            navigate('.', { replace: true });
          }
        } catch (e) { console.error('Error handling banner product link:', e) }
      }
      fetchAndAction();
    }
  }, [productIdParam, slug]);

  // Función para refrescar las URLs de imágenes del carrito
  const refrescarImagenesCarrito = async (carritoActual: any[]) => {
    try {
      // Obtener IDs de productos únicos
      const productosIds = [...new Set(carritoActual
        .filter(item => !item.esCombo && item.productoId)
        .map(item => item.productoId))];

      if (productosIds.length === 0) return;

      // Solicitar datos actualizados de los productos
      const { data } = await axios.get(`${BASE_URL}/public/store/${slug}/products`, {
        params: { ids: productosIds.join(','), limit: 100 }
      });

      const productosActualizados = data?.data?.data || data?.data || [];

      // Crear mapa de IDs a URLs de imagen actualizadas
      const imagenUrlMap = new Map();
      productosActualizados.forEach((p: any) => {
        if (p.id && p.imagenUrl) {
          imagenUrlMap.set(p.id, p.imagenUrl);
        }
      });

      // Actualizar carrito con nuevas URLs
      setCarrito(prevCarrito =>
        prevCarrito.map(item => {
          if (item.esCombo || !item.productoId) return item;
          const nuevaUrl = imagenUrlMap.get(item.productoId);
          return nuevaUrl ? { ...item, imagenUrl: nuevaUrl } : item;
        })
      );
    } catch (error) {
      console.error('Error refrescando imágenes del carrito:', error);
    }
  };

  // Persistir carrito solo cuando ya se haya cargado inicialmente
  useEffect(() => {
    if (!isCartLoaded) return;
    try {
      localStorage.setItem(`tienda:${slug}:carrito`, JSON.stringify(carrito));
    } catch { }
  }, [carrito, slug, isCartLoaded]);

  const cargarProductosMayoristas = async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/public/store/${slug}/products`, {
        params: {
          wholesale: 'true',
          limit: 8 // Show top 8 wholesale products
        }
      });
      setWholesaleProducts(data.data || []);
    } catch (e) { console.error('Error loading wholesale products:', e); }
  };

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!adminMenuRef.current) return;
      if (!adminMenuRef.current.contains(e.target as Node)) setIsAdminOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsAdminOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  // Calculos de totales en el carrito (página de tienda)
  const calcularSubtotal = () => {
    return carrito.reduce((sum, item) => sum + Number(item.precioUnitario) * Number(item.cantidad || 1), 0);
  };
  const calcularCostoEnvio = () => {
    const envio = Number(tienda?.costoEnvioFijo || 0);
    return tienda?.aceptaEnvio ? envio : 0;
  };
  const calcularTotal = () => {
    return calcularSubtotal() + calcularCostoEnvio();
  };

  const cargarTienda = async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/public/store/${slug}`);
      setTienda(data.data || data);
    } catch (error) {
      console.error('Error al cargar tienda:', error);
    }
  };

  const cargarCombos = async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/public/store/${slug}/combos`);
      setCombos(data.data || data || []);
    } catch (error) {
      console.error('Error al cargar combos:', error);
      setCombos([]);
    }
  };

  const [allCategories, setAllCategories] = useState<any[]>([]);

  const cargarCategorias = async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/public/store/${slug}/categories`);
      const cats = data?.data || [];
      setAllCategories(Array.isArray(cats) ? cats : []);
    } catch (error) {
      console.error('Error al cargar categorias:', error);
      setAllCategories([]);
    }
  };

  const cargarRangoPrecios = async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/public/store/${slug}/price-range`);
      const priceData = data?.data || { min: 0, max: 1000 };
      setMinPrice(priceData.min);
      setMaxPrice(priceData.max);
      setPriceRange([priceData.min, priceData.max]);
    } catch (error) {
      console.error('Error al cargar rango de precios:', error);
      setMinPrice(0);
      setMaxPrice(1000);
      setPriceRange([0, 1000]);
    }
  };

  const filteredProductos = productos; // Filtering is now done on server


  const cargarProductos = async (p = page, reset = false) => {
    try {
      const { data } = await axios.get(`${BASE_URL}/public/store/${slug}/products`, {
        params: {
          page: p,
          limit,
          search: search.trim() || undefined,
          category: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
          minPrice: priceRange[0] !== minPrice ? priceRange[0] : undefined,
          maxPrice: priceRange[1] !== maxPrice ? priceRange[1] : undefined,
        },
      });

      // Normalizar posibles formatos de respuesta
      let items: any[] = [];
      let totalItems = 0;
      let currentPage = p;

      if (Array.isArray(data)) {
        items = data;
        totalItems = data.length;
      } else if (Array.isArray(data?.data?.data)) {
        items = data.data.data;
        totalItems = data.data.total ?? items.length;
        currentPage = data.data.page ?? p;
      } else if (Array.isArray(data?.data)) {
        items = data.data;
        totalItems = data.total ?? items.length;
        currentPage = data.page ?? p;
      }

      setTotal(totalItems || 0);
      setPage(currentPage || p);

      if (reset) setProductos(items || []);
      else setProductos((prev) => [...prev, ...(items || [])]);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Debounce búsqueda, categorías y precios
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      setProductos([]);
      setPage(1);
      setTotal(0);
      cargarProductos(1, true);
    }, 350);
    return () => clearTimeout(t);
  }, [search, selectedCategories, priceRange]);

  // Cargar productos cuando cambia la página
  useEffect(() => {
    if (page > 1) {
      setLoading(true);
      cargarProductos(page, true);
    }
  }, [page]);

  // Cargar modificadores de un producto
  const cargarModificadoresProducto = async (productoId: number) => {
    try {
      setLoadingModificadores(true);
      const { data } = await axios.get(`${BASE_URL}/public/store/${slug}/products/${productoId}/modifiers`);
      return data.data || data || [];
    } catch (error) {
      console.error('Error al cargar modificadores:', error);
      return [];
    } finally {
      setLoadingModificadores(false);
    }
  };

  // Abrir modal de personalización o agregar directo si no tiene modificadores
  const handleAgregarProducto = async (producto: any) => {
    // Eliminada la restricción de rubros para permitir "Precios por Docena/Ciento" en ferreterías/limpieza

    const mods = await cargarModificadoresProducto(producto.id);

    if (mods.length > 0) {
      // Tiene modificadores, abrir modal
      setProductoAPersonalizar(producto);
      setModificadoresProducto(mods);
      setShowPersonalizarModal(true);
    } else {
      // Sin modificadores, agregar directo
      agregarAlCarritoDirecto(producto);
    }
  };

  const handleConfirmarPersonalizacion = (producto: any, modificadoresSeleccionados: any[]) => {
    agregarAlCarritoDirecto(producto, modificadoresSeleccionados);
    setShowPersonalizarModal(false);
    setProductoAPersonalizar(null);
    setModificadoresProducto([]);
  };

  const agregarAlCarritoDirecto = (producto: any, modificadores?: any[]) => {
    const itemId = modificadores?.length
      ? `${producto.id}-${Date.now()}` // ID único si tiene modificadores
      : producto.id;

    const precioExtra = modificadores?.reduce((sum: number, mod: any) => sum + Number(mod.precioExtra || 0), 0) || 0;

    const nuevoItem = {
      ...producto,
      id: itemId,
      productoId: producto.id,
      cantidad: 1,
      precioBase: producto.precioUnitario,
      precioUnitario: Number(producto.precioUnitario) + precioExtra,
      modificadores: modificadores || [],
    };

    if (!modificadores?.length) {
      // Sin modificadores: buscar si ya existe y sumar cantidad
      const existe = carrito.find((item) => item.id === producto.id && !item.modificadores?.length);
      if (existe) {
        setCarrito(
          carrito.map((item) =>
            item.id === producto.id && !item.modificadores?.length
              ? { ...item, cantidad: item.cantidad + 1 }
              : item
          )
        );
        return;
      }
    }

    setCarrito([...carrito, nuevoItem]);
  };

  const agregarAlCarrito = (producto: any) => {
    handleAgregarProducto(producto);
  };

  const agregarComboAlCarrito = (combo: any) => {
    const itemCombo = {
      id: `combo-${combo.id}`,
      esCombo: true,
      comboId: combo.id,
      descripcion: combo.nombre,
      imagenUrl: combo.imagenUrl,
      precioUnitario: combo.precioCombo,
      cantidad: 1,
      comboItems: combo.items,
      descuentoPorcentaje: combo.descuentoPorcentaje
    };
    setCarrito([...carrito, itemCombo]);
  };

  const actualizarCantidad = (productoId: number | string, cantidad: number) => {
    if (cantidad <= 0) {
      setCarrito(carrito.filter((item) => item.id !== productoId));
    } else {
      setCarrito(
        carrito.map((item) => (item.id === productoId ? { ...item, cantidad } : item))
      );
    }
  };

  const irACheckout = () => {
    navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } });
  };

  if (loading && !tienda) {
    // First load
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <Icon icon="eos-icons:loading" className="w-12 h-12 text-gray-300" />
      </div>
    );
  }

  if (!tienda) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Icon icon="mdi:store-off" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-xl text-gray-600">Tienda no encontrada</p>
        </div>
      </div>
    );
  }

  const diseno = tienda.diseno || {};

  // Section header with brand filter pills
  const SectionHeader = ({
    title,
    onMore,
  }: {
    title: string;
    onMore?: () => void;
  }) => (
    <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-2xl md:text-3xl font-black text-[#1A1A1A]">{title}</h2>
        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategories([])}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full transition-colors ${selectedCategories.length === 0 ? 'bg-[#FF9500] text-white' : 'border border-[#2D2D2D] text-[#2D2D2D] hover:bg-[#2D2D2D] hover:text-white'}`}
          >
            <Icon icon="solar:widget-bold" width={12} />
            Todos
          </button>
          {allCategories.slice(0, 5).map((category: any) => {
            const name = typeof category === 'string' ? category : category.nombre;
            return (
              <button
                key={name}
                onClick={() => {
                  if (selectedCategories.includes(name)) setSelectedCategories(selectedCategories.filter(b => b !== name));
                  else setSelectedCategories([name]);
                }}
                className={`flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full transition-colors ${selectedCategories.includes(name) ? 'bg-[#FF9500] text-white' : 'border border-[#2D2D2D] text-[#2D2D2D] hover:bg-[#2D2D2D] hover:text-white'}`}
              >
                <Icon icon="solar:tag-bold" width={12} />
                {name}
              </button>
            );
          })}
        </div>
      </div>
      {/* Right: arrows + More */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#FF9500] hover:text-[#FF9500] transition-colors text-gray-400">
          <Icon icon="solar:alt-arrow-left-linear" width={14} />
        </button>
        <button className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#FF9500] hover:text-[#FF9500] transition-colors text-gray-400">
          <Icon icon="solar:alt-arrow-right-linear" width={14} />
        </button>
        {onMore && (
          <button onClick={onMore} className="text-sm font-bold text-[#FF9500] hover:underline flex items-center gap-1">
            Más <Icon icon="solar:alt-arrow-right-bold" width={14} />
          </button>
        )}
      </div>
    </div>
  );

  // Skeleton grid
  const SkeletonGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
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
  );

  // Product grid
  const ProductGrid = ({ items }: { items: any[] }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
      {items.map((producto: any) => (
        <ProductCardPio
          key={producto.id}
          producto={producto}
          slug={slug || ''}
          diseno={diseno}
          onAddToCart={agregarAlCarrito}
          onClick={() => navigate(`producto/${producto.id}`)}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F6F6]" style={{ fontFamily: '"Mona Sans", ' + (diseno.tipografia || 'Inter, sans-serif') }}>

      {/* Header */}
      <StoreHeader
        tienda={tienda}
        slug={slug || ''}
        carritoCount={carrito.length}
        onToggleCart={() => setMostrarCarrito(!mostrarCarrito)}
        isAdminOpen={isAdminOpen}
        setIsAdminOpen={setIsAdminOpen}
        adminMenuRef={adminMenuRef}
        search={search}
        setSearch={setSearch}
        categories={allCategories}
        onSelectCategory={(cat) => {
          if (cat === '') {
            setSelectedCategories([]);
            setTimeout(() => document.getElementById('productos-populares')?.scrollIntoView({ behavior: 'smooth' }), 100);
          } else {
            navigate(`/tienda/${slug}/catalogo?category=${encodeURIComponent(cat)}`);
          }
        }}
        recommendedProducts={productos.slice(0, 10)}
      />

      {/* Main */}
      <main className="pt-[116px] md:pt-[116px] pb-12">

        {/* ── Hero Banner ── */}
        <div className="pt-6 mb-2">
          <SliderBanners tienda={tienda} diseno={diseno} />
        </div>

        {/* ── Popular Section ── */}
        <section id="productos-populares" className="max-w-screen-xl mx-auto px-5 md:px-8 mb-10 scroll-mt-32">
          <SectionHeader title="Popular" onMore={() => navigate(`/tienda/${slug}/catalogo`)} />
          {loading ? <SkeletonGrid /> : filteredProductos.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon icon="solar:box-linear" className="text-gray-300 text-3xl" />
              </div>
              <h3 className="font-black text-[#1A1A1A] mb-2">Sin resultados</h3>
              <p className="text-sm text-gray-500 mb-4">Intenta ajustar tus filtros.</p>
              <button
                onClick={() => { setSearch(''); setSelectedCategories([]); }}
                className="text-sm font-bold text-[#FF9500] border border-[#FF9500] px-5 py-2 rounded-full hover:bg-[#FF9500] hover:text-white transition-all"
              >
                Limpiar Filtros
              </button>
            </div>
          ) : (
            <>
              <ProductGrid items={productos.slice(0, 10)} />
              {/* {Math.ceil(total / limit) > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  {Array.from({ length: Math.ceil(total / limit) }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`w-10 h-10 flex items-center justify-center text-sm font-bold rounded-full transition-all ${page === (i + 1) ? 'bg-[#FF9500] text-white' : 'bg-white text-gray-500 hover:border-[#FF9500] hover:text-[#FF9500] border border-gray-200'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )} */}
            </>
          )}
        </section>
        {/* ── Membership Banner ── */}
        <MembershipBanner tienda={tienda} />

        {productos.length > 10 && (
          <section className="max-w-screen-xl mx-auto px-5 md:px-8 mb-10">
            <SectionHeader title="También te podría interesar" onMore={() => navigate(`/tienda/${slug}/catalogo`)} />
            <ProductGrid items={productos.slice(10, 20)} />
          </section>
        )}

        {/* ── Promo Banners Row 1 ── */}
        <PromoBanners tienda={tienda} />

        {/* ── Categories Bento ── */}
        {/* <CategoryCircles
          categories={allCategories}
          selectedCats={selectedCategories}
          onSelectCategory={(cat) => {
            if (selectedCategories.includes(cat)) setSelectedCategories(selectedCategories.filter(c => c !== cat));
            else setSelectedCategories([cat]);
          }}
        /> */}

        {/* ── Special Deals (Combos) ── */}
        {combos.length > 0 && (
          <section className="max-w-screen-xl mx-auto px-5 md:px-8 mb-10">
            <SectionHeader title="Ofertas Especiales" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {combos.map((combo) => (
                <ComboCard key={combo.id} combo={combo} diseno={diseno} onAddToCart={agregarComboAlCarrito} />
              ))}
            </div>
          </section>
        )}



        {/* ── Wholesale Section ── */}
        {wholesaleProducts.length > 0 && (
          <section className="max-w-screen-xl mx-auto px-5 md:px-8 mb-10">
            <SectionHeader title="Al por mayor" onMore={() => navigate(`/tienda/${slug}/catalogo?wholesale=true`)} />
            <ProductGrid items={wholesaleProducts} />
          </section>
        )}
      </main>

      <Footer tienda={tienda} diseno={diseno} />

      {/* Cart Drawer */}
      <ShoppingCartModal
        isOpen={mostrarCarrito}
        onClose={() => setMostrarCarrito(false)}
        carrito={carrito}
        tienda={tienda}
        actualizarCantidad={actualizarCantidad}
        onCheckout={irACheckout}
        slug={slug}
        setCarrito={setCarrito}
      />

      {/* Customization Modal */}
      <ProductCustomizationModal
        isOpen={showPersonalizarModal}
        onClose={() => setShowPersonalizarModal(false)}
        product={productoAPersonalizar}
        modifiers={modificadoresProducto}
        onConfirm={handleConfirmarPersonalizacion}
      />

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-[999999] lg:hidden flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
          <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-black">Filtros</h2>
              <button onClick={() => setShowMobileFilters(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <StoreSidebar
                categories={allCategories}
                selectedCats={selectedCategories}
                setSelectedCats={setSelectedCategories}
                search={search}
                setSearch={setSearch}
                diseno={diseno}
                totalProducts={total}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                minPrice={minPrice}
                maxPrice={maxPrice}
              />
            </div>
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full bg-[#FF9500] text-white py-3 font-bold rounded-full"
              >
                Ver {filteredProductos.length} Resultados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}