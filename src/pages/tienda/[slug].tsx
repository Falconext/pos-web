import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import SliderBanners from '@/components/tienda/SliderBanners';
import Footer from '@/components/tienda/Footer';
// import ProductCardEmox from '@/components/tienda/ProductCardEmox'; // Unused
import StoreHeader from '@/components/tienda/StoreHeader';
import CategoryCircles from '@/components/tienda/CategoryCircles';
import ProductCardSkeleton from '@/components/tienda/ProductCardSkeleton';
import ComboCard from '@/components/tienda/ComboCard';
import ProductCardPio from '@/components/tienda/ProductCardPio';
import StoreSidebar from '@/components/tienda/StoreSidebar';
import ProductCustomizationModal from '@/components/tienda/ProductCustomizationModal';
import ShoppingCartModal from '@/components/tienda/ShoppingCartModal';

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
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement | null>(null);
  const [combos, setCombos] = useState<any[]>([]);
  const [wholesaleProducts, setWholesaleProducts] = useState<any[]>([]);
  const [allBrands, setAllBrands] = useState<any[]>([]);
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
    cargarMarcas(); // Fetch brands instead of categories
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

  const cargarMarcas = async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/public/store/${slug}/brands`);
      const brands = data?.data || [];
      setAllBrands(Array.isArray(brands) ? brands : []);
    } catch (error) {
      console.error('Error al cargar marcas:', error);
      setAllBrands([]);
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
          brand: selectedBrands.length > 0 ? selectedBrands.join(',') : undefined,
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
  }, [search, selectedBrands, priceRange]);

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

  const isLoggedIn = !!localStorage.getItem('ACCESS_TOKEN');
  const diseno = tienda.diseno || {};
  const fontFamily = 'font-sans'; // Default, we use diseno.tipografia

  return (
    <div className={`min-h-screen bg-gray-50/50`} style={{ fontFamily: '"Mona Sans", ' + (diseno.tipografia || 'Inter, sans-serif') }}>
      {/* New Store Header */}
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
        categories={allBrands}
        onSelectCategory={(cat) => {
          if (cat === '') {
            setSelectedBrands([]);
          } else if (selectedBrands.includes(cat)) {
            setSelectedBrands(selectedBrands.filter(c => c !== cat));
          } else {
            setSelectedBrands([cat]);
          }
          // Scroll hacia los productos
          setTimeout(() => {
            document.getElementById('productos-populares')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        recommendedProducts={productos.slice(0, 10)}
      />

      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto px-6 md:py-8">
        <div className="mb-12">
          <SliderBanners tienda={tienda} diseno={diseno} />
        </div>

        {/* Categories Circles (Now Brands) */}
        <div className="mb-12">
          <CategoryCircles
            categories={allBrands}
            selectedCats={selectedBrands}
            onSelectCategory={(cat) => {
              // Toggle behavior for ease of use
              if (selectedBrands.includes(cat)) {
                setSelectedBrands(selectedBrands.filter(c => c !== cat));
              } else {
                setSelectedBrands([cat]);
              }
            }}
          />
        </div>

        {/* Full width layout - No Sidebar */}
        <div className="flex flex-col gap-8 relative">

          {/* Combos / Kits Section */}
          {combos.length > 0 && !loading && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#045659] mb-4">Kits & Packs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {combos.map((combo) => (
                  <ComboCard
                    key={combo.id}
                    combo={combo}
                    diseno={diseno}
                    onAddToCart={agregarComboAlCarrito}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Wholesale Products Section */}
          {wholesaleProducts.length > 0 && (
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Productos al por mayor</h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-base mb-8">
                Precios especiales para grandes cantidades. Compra más y paga menos.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 text-left">
                {wholesaleProducts.map((producto: any) => (
                  <ProductCardPio
                    key={producto.id}
                    producto={producto}
                    slug={slug || ''}
                    diseno={diseno}
                    onAddToCart={agregarAlCarrito}
                    onClick={() => {
                      navigate(`producto/${producto.id}`);
                    }}
                  />
                ))}
              </div>
              <div className="mt-8">
                <button
                  onClick={() => {
                    // Filter main grid by wholesale? Or navigate to a dedicated page? 
                    // For now just scroll to main grid or maybe we implement a filter toggle later.
                    // Or separate page like /tienda/:slug/mayorista
                    // User didn't ask for a page, just a section.
                  }}
                  className="invisible px-8 py-3 bg-white border border-gray-200 text-gray-900 font-bold rounded-full hover:bg-gray-50 transition-colors"
                >
                  Ver Todos
                </button>
              </div>
            </div>
          )}

          {/* Popular Products Header */}
          <div id="productos-populares" className="mb-8 text-center scroll-mt-44">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Productos Populares</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-base">
              Descubre nuestra selección exclusiva para el hogar y la oficina con la mejor calidad.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white p-4 rounded-xl border border-gray-100">
                  <div className="bg-gray-100 aspect-square w-full mb-4 rounded-lg"></div>
                  <div className="h-4 bg-gray-100 w-3/4 mb-2 rounded"></div>
                  <div className="h-4 bg-gray-100 w-1/4 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {filteredProductos.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon icon="solar:box-linear" className="text-gray-400 text-3xl" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">No se encontraron productos</h3>
                  <p className="text-gray-500 mb-4">Intenta ajustar tus filtros o búsqueda.</p>
                  <button onClick={() => { setSearch(''); setSelectedBrands([]) }} className="text-[#045659] font-bold hover:underline">Limpiar Filtros</button>
                </div>
              ) : (
                <>
                  <div className="grid mb-10 md:mb-0 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
                    {loading ? (
                      Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="bg-white h-64 rounded-xl animate-pulse"></div>
                      ))
                    ) : (
                      productos.map((producto: any) => (
                        <ProductCardPio
                          key={producto.id}
                          producto={producto}
                          slug={slug || ''}
                          diseno={diseno}
                          onAddToCart={agregarAlCarrito}
                          onClick={() => {
                            navigate(`producto/${producto.id}`);
                          }}
                        />
                      ))
                    )}
                  </div>

                  {filteredProductos.length > 0 && Math.ceil(total / limit) > 1 && (
                    <div className="mt-16 flex justify-center gap-2">
                      {Array.from({ length: Math.ceil(total / limit) }).map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setPage(i + 1)}
                          className={`w-10 h-10 flex items-center justify-center text-sm font-bold rounded-full transition-colors ${page === (i + 1) ? 'bg-[#045659] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

        </div>
      </main >

      <Footer tienda={tienda} diseno={diseno} />

      {/* Carrito Lateral (Drawer) */}
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

      {/* Modal Personalización */}
      <ProductCustomizationModal
        isOpen={showPersonalizarModal}
        onClose={() => setShowPersonalizarModal(false)}
        product={productoAPersonalizar}
        modifiers={modificadoresProducto}
        onConfirm={handleConfirmarPersonalizacion}
      />

      {/* Mobile Filter Drawer */}
      {
        showMobileFilters && (
          <div className="fixed inset-0 z-[999999] lg:hidden flex">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowMobileFilters(false)} />
            <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 animate-in slide-in-from-left">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                <h2 className="text-lg font-bold uppercase tracking-wide">Filtros</h2>
                <button onClick={() => setShowMobileFilters(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <Icon icon="mdi:close" className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <StoreSidebar
                  categories={allBrands} // Using brands as categories for now
                  selectedCats={selectedBrands}
                  setSelectedCats={setSelectedBrands}
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
                  className="w-full bg-black text-white py-3 font-bold uppercase rounded-lg"
                >
                  Ver {filteredProductos.length} Resultados
                </button>
              </div>
            </div>
          </div>
        )
      }

    </div >
  );
}