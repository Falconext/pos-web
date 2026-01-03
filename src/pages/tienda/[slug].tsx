import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import SliderBanners from '@/components/tienda/SliderBanners';
import Footer from '@/components/tienda/Footer';
import ComboCard from '@/components/tienda/ComboCard';
import ProductCardGlamora from '@/components/tienda/ProductCardGlamora';
import ProductCardSkeleton from '@/components/tienda/ProductCardSkeleton';
import StoreSidebar from '@/components/tienda/StoreSidebar';

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
  const [search, setSearch] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement | null>(null);
  const [combos, setCombos] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);

  // Estado para modal de personalización
  const [showPersonalizarModal, setShowPersonalizarModal] = useState(false);
  const [productoAPersonalizar, setProductoAPersonalizar] = useState<any>(null);
  const [modificadoresProducto, setModificadoresProducto] = useState<any[]>([]);
  const [seleccionesModificadores, setSeleccionesModificadores] = useState<Record<number, number[]>>({});
  const [loadingModificadores, setLoadingModificadores] = useState(false);

  useEffect(() => {
    cargarTienda();
    cargarCombos();
    cargarCategorias(); // Fetch all categories separately
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

  const cargarCategorias = async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/public/store/${slug}/categories`);
      // Response format: { code: 1, message: "OK", data: ["CAT1", "CAT2", ...] }
      const cats = data?.data || [];
      setAllCategories(Array.isArray(cats) ? cats : []);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
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
          category: selectedCats.length > 0 ? selectedCats.join(',') : undefined,
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
  }, [search, selectedCats, priceRange]);

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
    const mods = await cargarModificadoresProducto(producto.id);

    if (mods.length > 0) {
      // Tiene modificadores, abrir modal
      setProductoAPersonalizar(producto);
      setModificadoresProducto(mods);
      // Inicializar selecciones con defaults
      const defaults: Record<number, number[]> = {};
      mods.forEach((grupo: any) => {
        const defaultOpciones = grupo.opciones
          .filter((op: any) => op.esDefault)
          .map((op: any) => op.id);
        defaults[grupo.id] = defaultOpciones;
      });
      setSeleccionesModificadores(defaults);
      setShowPersonalizarModal(true);
    } else {
      // Sin modificadores, agregar directo
      agregarAlCarritoDirecto(producto);
    }
  };

  const agregarAlCarritoDirecto = (producto: any, modificadores?: any[]) => {
    const itemId = modificadores?.length
      ? `${producto.id}-${Date.now()}` // ID único si tiene modificadores
      : producto.id;

    const precioExtra = modificadores?.reduce((sum, mod) => sum + Number(mod.precioExtra || 0), 0) || 0;

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

  const confirmarPersonalizacion = () => {
    if (!productoAPersonalizar) return;

    // Validar selecciones obligatorias
    for (const grupo of modificadoresProducto) {
      const seleccionadas = seleccionesModificadores[grupo.id] || [];
      if (grupo.esObligatorio && seleccionadas.length < (grupo.seleccionMin || 1)) {
        alert(`Debes seleccionar al menos ${grupo.seleccionMin || 1} opción(es) en "${grupo.nombre}"`);
        return;
      }
    }

    // Construir lista de modificadores seleccionados
    const modificadoresSeleccionados: any[] = [];
    modificadoresProducto.forEach((grupo) => {
      const seleccionadas = seleccionesModificadores[grupo.id] || [];
      grupo.opciones.forEach((opcion: any) => {
        if (seleccionadas.includes(opcion.id)) {
          modificadoresSeleccionados.push({
            grupoId: grupo.id,
            grupoNombre: grupo.nombre,
            opcionId: opcion.id,
            opcionNombre: opcion.nombre,
            precioExtra: opcion.precioExtra,
          });
        }
      });
    });

    agregarAlCarritoDirecto(productoAPersonalizar, modificadoresSeleccionados);
    setShowPersonalizarModal(false);
    setProductoAPersonalizar(null);
    setModificadoresProducto([]);
    setSeleccionesModificadores({});
  };

  const toggleOpcionModificador = (grupoId: number, opcionId: number, seleccionMax: number) => {
    setSeleccionesModificadores((prev) => {
      const actuales = prev[grupoId] || [];

      if (actuales.includes(opcionId)) {
        // Deseleccionar
        return { ...prev, [grupoId]: actuales.filter((id) => id !== opcionId) };
      } else {
        // Seleccionar
        if (seleccionMax === 1) {
          // Radio: solo una opción
          return { ...prev, [grupoId]: [opcionId] };
        } else if (actuales.length < seleccionMax) {
          // Checkbox: agregar si no excede máximo
          return { ...prev, [grupoId]: [...actuales, opcionId] };
        }
        return prev;
      }
    });
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
    <div className={`min-h-screen bg-white`} style={{ fontFamily: diseno.tipografia || 'Inter, sans-serif' }}>
      {/* Header */}
      <header className="bg-white sticky top-0 z-[40] border-b border-gray-100">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/tienda/${slug}`)}>
              {tienda.logo && (
                <img src={tienda.logo} alt={tienda.nombreComercial} className="h-10 w-auto object-contain" />
              )}
              <div className="flex flex-col">
                <h1 className="text-sm font-bold tracking-wide text-gray-900 uppercase leading-none">
                  {tienda.nombreComercial || tienda.razonSocial}
                </h1>
                {tienda.descripcion && (
                  <span className="text-[10px] text-gray-500 mt-0.5 line-clamp-1 max-w-[200px] md:max-w-xs">{tienda.descripcion}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="md:hidden text-gray-600">
              <Icon icon="mdi:magnify" width={24} />
            </button>

            {isLoggedIn && (
              <div className="relative" ref={adminMenuRef}>
                <button onClick={() => setIsAdminOpen((v) => !v)} className="text-xs uppercase font-medium tracking-wide hover:underline mr-4">
                  ADMIN PANEL
                </button>
                {isAdminOpen && (
                  <div className={`absolute right-0 mt-2 w-56 bg-white border border-gray-100 shadow-xl z-50 py-2 rounded-lg`}>
                    <ul className="text-sm">
                      <li><button onClick={() => { setIsAdminOpen(false); navigate('/administrador'); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2">Ir a facturación</button></li>
                      <li><button onClick={() => { setIsAdminOpen(false); navigate('/administrador/kardex/productos'); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2">Productos</button></li>
                      <li><button onClick={() => { setIsAdminOpen(false); navigate('/administrador/tienda/pedidos'); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2">Pedidos</button></li>
                      <li><button onClick={() => { setIsAdminOpen(false); navigate('/administrador/tienda/configuracion'); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2">Configuración tienda</button></li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setMostrarCarrito(!mostrarCarrito)}
              className="relative flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
            >
              <span className="hidden md:inline uppercase text-xs tracking-widest">Carrito</span>
              <div className="relative">
                <Icon icon="heroicons:shopping-bag" className="w-6 h-6 text-gray-900" />
                {carrito.length > 0 && (
                  <span className="absolute -right-1 -bottom-1 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                    {carrito.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        <div className="mb-12">
          <SliderBanners tienda={tienda} diseno={diseno} />
        </div>

        <div className="flex flex-col lg:flex-row gap-12 relative">
          {/* Sidebar (Desktop) */}
          <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-28 h-fit">
            <StoreSidebar
              categories={allCategories}
              selectedCats={selectedCats}
              setSelectedCats={setSelectedCats}
              search={search}
              setSearch={setSearch}
              diseno={diseno}
              totalProducts={total}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              minPrice={minPrice}
              maxPrice={maxPrice}
            />
          </aside>

          {/* Product Grid Area */}
          <div className="flex-1 min-h-[500px]">
            {/* Header: Showing X results... + Sort + Applied Filters */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <p className="text-gray-500 text-sm">
                  Mostrando <span className="font-bold text-gray-900">{filteredProductos.length}</span> resultados
                  {search && <> for "<span className="font-bold text-gray-900">{search}</span>"</>}
                </p>
              </div>

              {/* Applied Filters Chips */}
              {(selectedCats.length > 0 || search || (priceRange[0] > minPrice || priceRange[1] < maxPrice)) && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-400 mr-2">Filtros aplicados:</span>

                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-bold uppercase tracking-wide hover:border-red-500 hover:text-red-500 transition-colors bg-white"
                    >
                      Search: {search} <Icon icon="mdi:close" />
                    </button>
                  )}

                  {selectedCats.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCats((prev: string[]) => prev.filter(c => c !== cat))}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-bold uppercase tracking-wide hover:border-black hover:bg-black hover:text-white transition-colors bg-white group"
                    >
                      {cat} <Icon icon="mdi:close" className="text-gray-400 group-hover:text-white" />
                    </button>
                  ))}

                  {(priceRange[0] > minPrice || priceRange[1] < maxPrice) && (
                    <button
                      onClick={() => setPriceRange([minPrice, maxPrice])}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-bold uppercase tracking-wide hover:border-purple-500 hover:text-purple-500 transition-colors bg-white"
                    >
                      S/ {priceRange[0].toFixed(0)} - S/ {priceRange[1].toFixed(0)} <Icon icon="mdi:close" />
                    </button>
                  )}

                  <button
                    onClick={() => { setSelectedCats([]); setSearch(''); setPriceRange([minPrice, maxPrice]); }}
                    className="text-xs text-gray-400 hover:text-red-500 underline ml-2"
                  >
                    Limpiar todos
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-100 aspect-[3/4] w-full mb-4"></div>
                    <div className="h-4 bg-gray-100 w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-100 w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {filteredProductos.length === 0 ? (
                  <div className="py-20 text-center">
                    <p className="text-gray-500">No se encontraron productos coincidentes.</p>
                    <button onClick={() => { setSearch(''); setSelectedCats([]) }} className="mt-4 text-black underline text-sm">Limpiar filtros</button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                      {loading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                          <ProductCardSkeleton key={i} />
                        ))
                      ) : (
                        productos.map((producto: any) => (
                          <ProductCardGlamora
                            key={producto.id}
                            producto={producto}
                            slug={slug || ''}
                            diseno={diseno}
                            onAddToCart={agregarAlCarrito}
                          />
                        ))
                      )}
                      {loadingMore && (
                        Array.from({ length: 4 }).map((_, i) => (
                          <ProductCardSkeleton key={`more-${i}`} />
                        ))
                      )}
                    </div>

                    {filteredProductos.length > 0 && Math.ceil(total / limit) > 1 && (
                      <div className="mt-16 flex justify-center gap-2">
                        {Array.from({ length: Math.ceil(total / limit) }).map((_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => setPage(i + 1)}
                            className={`w-10 h-10 flex items-center justify-center text-sm transition-colors ${page === (i + 1) ? 'bg-black text-white' : 'text-gray-500 hover:text-black border border-transparent hover:border-gray-200'}`}
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
        </div>
      </main>

      <Footer tienda={tienda} diseno={diseno} />

      {/* Carrito Lateral (Drawer) */}
      {mostrarCarrito && (
        <div className="fixed inset-0 z-[999999] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setMostrarCarrito(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <h2 className="text-lg font-bold uppercase tracking-wide">Tu Bolsa ({carrito.length})</h2>
              <button onClick={() => setMostrarCarrito(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {carrito.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-gray-500">
                  <Icon icon="solar:bag-linear" className="w-16 h-16 opacity-50" />
                  <p>Tu carrito está vacío.</p>
                  <button onClick={() => setMostrarCarrito(false)} className="text-black underline text-sm font-medium">Continuar comprando</button>
                </div>
              ) : (
                carrito.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-20 h-24 bg-gray-100 flex-shrink-0 relative">
                      <button
                        onClick={() => setCarrito(carrito.filter((i) => i.id !== item.id))}
                        className="absolute -top-2 -left-2 bg-white rounded-full p-1 shadow border border-gray-200 hover:bg-red-50 text-gray-400 hover:text-red-500 z-10"
                      >
                        <Icon icon="mdi:close" width={14} />
                      </button>
                      {item.imagenUrl ? (
                        <img src={item.imagenUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400"><Icon icon="mdi:image-off" /></div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{item.descripcion}</h3>
                        {item.modificadores && item.modificadores.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            + {item.modificadores.length} extras
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-gray-200">
                          <button onClick={() => actualizarCantidad(item.id!, (item.cantidad || 1) - 1)} className="px-2 py-1 hover:bg-gray-50">-</button>
                          <span className="text-xs px-2 font-medium">{item.cantidad}</span>
                          <button onClick={() => actualizarCantidad(item.id!, (item.cantidad || 1) + 1)} className="px-2 py-1 hover:bg-gray-50">+</button>
                        </div>
                        <span className="text-sm font-semibold">S/ {(Number(item.precioUnitario) * (item.cantidad || 1)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {carrito.length > 0 && (
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-bold text-lg">S/ {calcularSubtotal().toFixed(2)}</span>
                </div>
                <button
                  onClick={irACheckout}
                  className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest text-sm hover:bg-gray-900 transition-colors"
                >
                  Pagar Ahora
                </button>
                <p className="text-center text-xs text-gray-500 mt-3">Impuestos y envío calculados en el checkout</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Personalización */}
      {showPersonalizarModal && productoAPersonalizar && (
        <div className="fixed inset-0 bg-black/60 z-[1000000] flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="p-4 border-b flex items-center gap-3">
              {productoAPersonalizar.imagenUrl && (
                <img src={productoAPersonalizar.imagenUrl} className="w-16 h-16 object-cover rounded-lg" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{productoAPersonalizar.descripcion}</h3>
                <p className="text-sm font-bold">S/ {Number(productoAPersonalizar.precioUnitario).toFixed(2)}</p>
              </div>
              <button onClick={() => setShowPersonalizarModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><Icon icon="mdi:close" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {loadingModificadores ? (
                <div className="py-8 flex justify-center"><Icon icon="eos-icons:loading" className="w-8 h-8 animate-spin text-gray-400" /></div>
              ) : (
                modificadoresProducto.map((grupo) => (
                  <div key={grupo.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{grupo.nombre}</h4>
                      <span className="text-xs text-gray-500">{grupo.esObligatorio ? 'Obligatorio' : 'Opcional'} {grupo.seleccionMax > 1 && `(Max ${grupo.seleccionMax})`}</span>
                    </div>
                    <div className="space-y-2">
                      {grupo.opciones.map((op: any) => {
                        const isSelected = (seleccionesModificadores[grupo.id] || []).includes(op.id);
                        return (
                          <div
                            key={op.id}
                            onClick={() => toggleOpcionModificador(grupo.id, op.id, grupo.seleccionMax)}
                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'border-black bg-gray-50' : 'border-gray-200'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-black bg-black' : 'border-gray-300'}`}>
                                {isSelected && <Icon icon="mdi:check" className="text-white w-3 h-3" />}
                              </div>
                              <span className="text-sm">{op.nombre}</span>
                            </div>
                            {Number(op.precioExtra) > 0 && <span className="text-xs font-medium text-gray-500">+ S/ {op.precioExtra}</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={confirmarPersonalizacion}
                className="w-full bg-black text-white py-3 font-bold uppercase rounded-lg"
              >
                Agregar al Carrito
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}