import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import SliderBanners from '@/components/tienda/SliderBanners';
import Footer from '@/components/tienda/Footer';
import ComboCard from '@/components/tienda/ComboCard';

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
  const [favorites, setFavorites] = useState<Record<number, boolean>>({});
  const [showFavs, setShowFavs] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement | null>(null);
  const [combos, setCombos] = useState<any[]>([]);
  
  // Estado para modal de personalización
  const [showPersonalizarModal, setShowPersonalizarModal] = useState(false);
  const [productoAPersonalizar, setProductoAPersonalizar] = useState<any>(null);
  const [modificadoresProducto, setModificadoresProducto] = useState<any[]>([]);
  const [seleccionesModificadores, setSeleccionesModificadores] = useState<Record<number, number[]>>({});
  const [loadingModificadores, setLoadingModificadores] = useState(false);

  useEffect(() => {
    cargarTienda();
    cargarCombos();
    // reset de productos al cambiar slug
    setProductos([]);
    setPage(1);
    setTotal(0);
    cargarProductos(1, true);

    // rehidratar carrito persistido
    try {
      const saved = localStorage.getItem(`tienda:${slug}:carrito`);
      if (saved) {
        setCarrito(JSON.parse(saved));
      }
    } catch { }
    setIsCartLoaded(true);
  }, [slug]);

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

  const categories = useMemo(() => {
    const set = new Set<string>();
    productos.forEach((p) => {
      const n = p?.categoria?.nombre;
      if (n) set.add(n);
    });
    return Array.from(set);
  }, [productos]);

  const filteredProductos = useMemo(() => {
    // Búsqueda se hace en servidor; aquí solo filtramos por categoría y favoritos
    return productos.filter((p) => {
      const cat = p?.categoria?.nombre;
      const byCat = selectedCats.length
        ? (cat ? selectedCats.includes(cat) : false)
        : true;
      const byFav = showFavs ? !!favorites[p.id] : true;
      return byCat && byFav;
    });
  }, [productos, selectedCats, showFavs, favorites]);

  const toggleFav = (id: number) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const cargarProductos = async (p = page, reset = false) => {
    try {
      const { data } = await axios.get(`${BASE_URL}/public/store/${slug}/products`, {
        params: { page: p, limit, search: search.trim() || undefined },
      });

      // Normalizar posibles formatos de respuesta
      // 1) [ {...}, ... ]
      // 2) { data: [...], total, page, limit }
      // 3) { code: 1, data: { data: [...], total, page, limit } }
      let items: any[] = [];
      let totalItems = 0;
      let currentPage = p;
      let currentLimit = limit;

      if (Array.isArray(data)) {
        items = data;
        totalItems = data.length;
      } else if (Array.isArray(data?.data?.data)) {
        // wrapper con code + data
        items = data.data.data;
        totalItems = data.data.total ?? items.length;
        currentPage = data.data.page ?? p;
        currentLimit = data.data.limit ?? limit;
      } else if (Array.isArray(data?.data)) {
        // objeto paginado directo
        items = data.data;
        totalItems = data.total ?? items.length;
        currentPage = data.page ?? p;
        currentLimit = data.limit ?? limit;
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

  // Debounce búsqueda y reset de paginado
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      setProductos([]);
      setPage(1);
      setTotal(0);
      cargarProductos(1, true);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

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
      return data.data || [];
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
        return prev; // No agregar si ya alcanzó el máximo
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

  // Nota: el total general ya se calcula arriba e incluye envío.

  const irACheckout = () => {
    navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Icon icon="eos-icons:loading" className="w-12 h-12 text-gray-400" />
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

  // Helpers de diseño
  const diseno = tienda.diseno || {};

  const getBordeRadius = () => {
    switch (diseno.bordeRadius) {
      case 'none': return 'rounded-none';
      case 'small': return 'rounded';
      case 'large': return 'rounded-2xl';
      case 'full': return 'rounded-3xl'; // Para contenedores grandes
      default: return 'rounded-xl'; // medium
    }
  };

  const getBotonStyle = () => {
    switch (diseno.estiloBoton) {
      case 'square': return 'rounded-none';
      case 'pill': return 'rounded-full';
      default: return 'rounded-lg'; // rounded
    }
  };

  const getFontFamily = () => {
    switch (diseno.tipografia) {
      case 'Roboto': return 'font-roboto';
      case 'Open Sans': return 'font-opensans';
      case 'Lato': return 'font-lato';
      case 'Montserrat': return 'font-montserrat';
      case 'Poppins': return 'font-poppins';
      case 'Raleway': return 'font-raleway';
      case 'Ubuntu': return 'font-ubuntu';
      case 'Manrope': return 'font-manrope';
      case 'Rubik': return 'font-rubik';
      case 'Inter': return 'font-inter';
      default: return 'font-sans'; // Inter por defecto en Tailwind
    }
  };

  const getEspaciado = () => {
    switch (diseno.espaciado) {
      case 'compact': return 'gap-2';
      case 'spacious': return 'gap-8';
      default: return 'gap-4';
    }
  };

  const borderRadius = getBordeRadius();
  const btnRadius = getBotonStyle();
  const fontFamily = getFontFamily();
  const gap = getEspaciado();

  console.log(tienda.diseno)

  return (
    <div className={`min-h-screen bg-gray-50 ${fontFamily}`} style={{ fontFamily: diseno.tipografia }}>
      {/* Header */}
      <header
        className="bg-white shadow-sm sticky top-0 z-[999999] backdrop-blur-sm"
        style={{ backgroundColor: tienda.colorPrimario || '#000' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {tienda.logo && (
              <img src={tienda.logo} alt={tienda.nombreComercial} className={`h-12 w-12 object-cover ${borderRadius}`} />
            )}
            <div>
              <h1 className="text-sm md:text-xl font-bold text-white">{tienda.nombreComercial || tienda.razonSocial}</h1>
              {tienda.descripcionTienda && (
                <p className="text-sm hidden md:block text-white/80">{tienda.descripcionTienda}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLoggedIn && (
              <div className="relative" ref={adminMenuRef}>
                <button onClick={() => setIsAdminOpen((v) => !v)} className={`bg-white/20 text-white px-3 py-2 ${btnRadius} hover:bg-white/30 text-sm flex items-center gap-1`}>
                  <Icon icon="mdi:cog-outline" /> Admin
                </button>
                {isAdminOpen && (
                  <div className={`absolute right-0 mt-2 w-56 ${borderRadius} border border-white/20 bg-white/95 text-gray-800 shadow-lg backdrop-blur`}>
                    <ul className="py-1 text-sm">
                      <li>
                        <button onClick={() => { setIsAdminOpen(false); navigate('/administrador'); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"><Icon icon="mdi:receipt-text-outline" /> Ir a facturación</button>
                      </li>
                      <li>
                        <button onClick={() => { setIsAdminOpen(false); navigate('/administrador/kardex/productos'); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"><Icon icon="mdi:package-variant" /> Productos</button>
                      </li>
                      <li>
                        <button onClick={() => { setIsAdminOpen(false); navigate('/administrador/tienda/pedidos'); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"><Icon icon="mdi:cart-outline" /> Pedidos</button>
                      </li>
                      <li>
                        <button onClick={() => { setIsAdminOpen(false); navigate('/administrador/tienda/configuracion'); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"><Icon icon="mdi:cog-outline" /> Configuración tienda</button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setMostrarCarrito(!mostrarCarrito)}
              className="relative bg-white/20 text-white p-3 rounded-full hover:bg-white/30"
            >
              <Icon icon="mdi:cart" className="w-6 h-6" />
              {carrito.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {carrito.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Productos */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6 mb-8">
          {/* Banners / Slider */}
          <SliderBanners tienda={tienda} diseno={diseno} />

          {/* Buscador */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Icon icon="mdi:magnify" className="text-gray-400 group-focus-within:text-orange-500 transition-colors" width={24} style={{ color: diseno.colorPrimario }} />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="¿Qué estás buscando hoy?"
                className={`w-full bg-white border border-gray-200 ${borderRadius} pl-12 pr-4 py-4 shadow-sm outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all text-gray-700 placeholder:text-gray-400`}
                style={{ borderColor: 'transparent' }}
              />
            </div>
            <button
              className={`px-6 py-4 ${btnRadius} bg-gray-900 text-white font-medium shadow-lg shadow-gray-200 hover:bg-gray-800 transition-all active:scale-95`}
              style={{ backgroundColor: tienda.colorPrimario || '#111827' }}
            >
              Buscar
            </button>
          </div>

          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((c) => {
                const active = selectedCats.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => setSelectedCats((prev) => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                    className={`px-4 py-2 ${btnRadius} text-xs border transition ${active ? 'text-white' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    style={active ? { backgroundColor: diseno.colorAccento || diseno.colorPrimario, borderColor: diseno.colorAccento || diseno.colorPrimario } : {}}
                  >
                    {c}
                  </button>
                );
              })}
              {selectedCats.length > 0 && (
                <button onClick={() => setSelectedCats([])} className="px-3 py-2 text-xs text-gray-600 underline">Limpiar</button>
              )}
            </div>
          )}
        </div>

        {/* Sección de Combos */}
        {combos.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
                  <Icon icon="mdi:fire" width={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">🔥 Combos Especiales</h2>
                  <p className="text-sm text-gray-500">¡Aprovecha nuestras ofertas exclusivas!</p>
                </div>
              </div>
              <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                {combos.length} combo{combos.length > 1 ? 's' : ''} disponible{combos.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${gap}`}>
              {combos.map((combo) => (
                <ComboCard
                  key={combo.id}
                  combo={combo}
                  onAddToCart={agregarComboAlCarrito}
                  diseno={diseno}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sección de Productos */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gray-900 text-white" style={{ backgroundColor: tienda.colorPrimario }}>
              <Icon icon="mdi:package-variant" width={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Productos</h2>
          </div>
        </div>

        {filteredProductos.length === 0 ? (
          <div className="text-center py-12">
            <Icon icon="mdi:package-variant" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No hay productos disponibles</p>
          </div>
        ) : (
          <>
            {/* Vista Cards (Default). Se usa para cualquier vista excepto 'lista' */}
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${gap}`}>
              {filteredProductos.map((producto) => {
                const fav = !!favorites[producto.id];
                return (
                  <div key={producto.id} className={`bg-white ${borderRadius} shadow-sm overflow-hidden border border-gray-100 relative group hover:shadow-md transition-all`}>
                    <div
                      className="relative cursor-pointer"
                      onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)}
                    >
                      {producto.imagenUrl ? (
                        <img src={producto.imagenUrl} alt={producto.descripcion} className="w-full h-44 object-cover" />
                      ) : (
                        <div className="w-full h-44 bg-gray-200 flex items-center justify-center">
                          <Icon icon="mdi:image-off" className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex gap-2">
                        {producto?.categoria?.nombre && (
                          <span className={`text-[11px] px-2 py-1 ${borderRadius} bg-white/90 border border-gray-200 backdrop-blur-sm`}>{producto.categoria.nombre}</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFav(producto.id); }}
                        className={`absolute top-2 right-2 p-2 ${btnRadius} shadow-sm transition-transform active:scale-95 ${fav ? 'bg-red-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        style={fav ? { backgroundColor: diseno.colorAccento || '#ef4444' } : {}}
                      >
                        <Icon icon={fav ? 'mdi:heart' : 'mdi:heart-outline'} />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3
                        className="font-semibold text-sm mb-1 line-clamp-2 min-h-[2.5rem] cursor-pointer transition-colors"
                        style={{ ':hover': { color: diseno.colorPrimario } } as any}
                        onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)}
                      >
                        {producto.descripcion}
                      </h3>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-lg font-bold text-gray-900">S/ {Number(producto.precioUnitario).toFixed(2)}</p>
                        <p className={`text-[11px] text-gray-500 bg-gray-100 px-2 py-1 ${borderRadius}`}>Stock: {producto.stock}</p>
                      </div>
                      <button
                        onClick={() => agregarAlCarrito(producto)}
                        className={`w-full text-white py-2.5 ${btnRadius} hover:opacity-90 text-sm font-medium transition-colors flex items-center justify-center gap-2`}
                        style={{ backgroundColor: tienda.colorPrimario || '#000' }}
                      >
                        <Icon icon="mdi:cart-plus" width={18} />
                        Agregar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vista Lista (Bodega / Minimarket) */}
            {tienda.diseno?.vistaProductos === 'lista' && (
              <div className="flex flex-col gap-3">
                {filteredProductos.map((producto) => {
                  const fav = !!favorites[producto.id];
                  return (
                    <div key={producto.id} className={`bg-white ${borderRadius} p-3 border border-gray-100 shadow-sm flex gap-4 items-center`}>
                      <div
                        className={`w-20 h-20 flex-shrink-0 bg-gray-100 ${borderRadius} overflow-hidden cursor-pointer`}
                        onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)}
                      >
                        {producto.imagenUrl ? (
                          <img src={producto.imagenUrl} alt={producto.descripcion} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Icon icon="mdi:image-off" width={24} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3
                            className="font-medium text-gray-900 truncate pr-4 cursor-pointer hover:opacity-80"
                            style={{ color: diseno.colorPrimario }}
                            onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)}
                          >
                            {producto.descripcion}
                          </h3>
                          <button onClick={() => toggleFav(producto.id)} className={`${fav ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`} style={fav ? { color: diseno.colorAccento } : {}}>
                            <Icon icon={fav ? 'mdi:heart' : 'mdi:heart-outline'} width={20} />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{producto.categoria?.nombre}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="font-bold text-gray-900">S/ {Number(producto.precioUnitario).toFixed(2)}</span>
                          <span className={`text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 ${borderRadius}`}>Stock: {producto.stock}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => agregarAlCarrito(producto)}
                        className={`p-3 ${btnRadius} text-white shadow-sm hover:shadow-md transition-all active:scale-95 flex-shrink-0`}
                        style={{ backgroundColor: tienda.colorPrimario || '#000' }}
                      >
                        <Icon icon="mdi:cart-plus" width={20} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Vista Tabla no se usa actualmente en tienda pública */}
            {/* Paginación */}
            {filteredProductos.length > 0 && (
              <div className="mt-12 flex justify-center items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`p-2 ${borderRadius} border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Icon icon="mdi:chevron-left" width={24} />
                </button>

                {Array.from({ length: Math.ceil(total / limit) }).map((_, i) => {
                  const p = i + 1;
                  // Mostrar solo algunas páginas si hay muchas (lógica simple por ahora)
                  if (Math.ceil(total / limit) > 7 && Math.abs(p - page) > 2 && p !== 1 && p !== Math.ceil(total / limit)) {
                    if (Math.abs(p - page) === 3) return <span key={p} className="text-gray-400">...</span>;
                    return null;
                  }

                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-10 h-10 flex items-center justify-center ${borderRadius} font-semibold transition-colors ${page === p
                        ? 'text-white'
                        : 'bg-white border hover:bg-gray-50 text-gray-700'
                        }`}
                      style={page === p ? { backgroundColor: diseno.colorPrimario || '#000' } : {}}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(total / limit)}
                  className={`p-2 ${borderRadius} border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Icon icon="mdi:chevron-right" width={24} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer tienda={tienda} diseno={diseno} />

      {/* Carrito lateral */}
      {mostrarCarrito && (
        <div className="fixed inset-0 bg-black/50 z-[999999]" onClick={() => setMostrarCarrito(false)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Mi carrito</h2>
                <p className="text-xs text-gray-500">{carrito.length} item{carrito.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                {carrito.length > 0 && (
                  <button
                    onClick={() => setCarrito([])}
                    className="text-sm text-gray-600 hover:text-black underline"
                  >
                    Vaciar
                  </button>
                )}
                <button onClick={() => setMostrarCarrito(false)} className="p-2 rounded-full hover:bg-gray-100">
                  <Icon icon="mdi:close" className="w-5 h-5" />
                </button>
              </div>
            </div>

            {carrito.length === 0 ? (
              <div className="text-center py-16">
                <Icon icon="mdi:cart-outline" className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">Tu carrito está vacío</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {carrito.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      {item.imagenUrl ? (
                        <img src={item.imagenUrl} alt={item.descripcion} className="w-14 h-14 rounded object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                          <Icon icon="mdi:image-off" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-sm">{item.descripcion}</p>
                        {/* Mostrar modificadores seleccionados */}
                        {item.modificadores && item.modificadores.length > 0 && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {item.modificadores.map((mod: any, idx: number) => (
                              <span key={mod.opcionId}>
                                {mod.opcionNombre}
                                {Number(mod.precioExtra) > 0 && ` (+S/${Number(mod.precioExtra).toFixed(2)})`}
                                {idx < item.modificadores.length - 1 && ', '}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-gray-500">S/ {Number(item.precioUnitario).toFixed(2)}</p>
                        <div className="mt-2 inline-flex items-center rounded-full border border-gray-200">
                          <button
                            onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-l-full"
                          >
                            <Icon icon="mdi:minus" />
                          </button>
                          <span className="w-10 text-center text-sm">{item.cantidad}</span>
                          <button
                            onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-r-full"
                          >
                            <Icon icon="mdi:plus" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => setCarrito(carrito.filter((i) => i.id !== item.id))}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                          aria-label="Eliminar"
                        >
                          <Icon icon="mdi:trash-can-outline" />
                        </button>
                        <div className="text-sm font-semibold">S/ {(Number(item.precioUnitario) * item.cantidad).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 mb-6 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span>S/ {calcularSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Delivery</span>
                    <span>{Number(tienda?.costoEnvioFijo ?? 0) === 0 && tienda?.aceptaEnvio ? 'Free' : (tienda?.aceptaEnvio ? `S/ ${Number(tienda?.costoEnvioFijo || 0).toFixed(2)}` : 'No disponible')}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Delivery time</span>
                    <span>{(tienda as any)?.diseno?.tiempoEntregaMin ?? (tienda as any)?.tiempoPreparacionMin ?? 15}-{((tienda as any)?.diseno?.tiempoEntregaMax ?? (((tienda as any)?.diseno?.tiempoEntregaMin ?? (tienda as any)?.tiempoPreparacionMin ?? 15) + 10))} min</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span>S/ {calcularTotal().toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={irACheckout}
                  className="w-full text-white py-3 rounded-xl font-semibold hover:opacity-95"
                  style={{ backgroundColor: tienda.colorPrimario || '#f97316' }}
                >
                  Proceder al checkout
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navbar - mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40">
        <div className="grid grid-cols-4 text-xs">
          <button
            onClick={() => { setShowFavs(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`py-3 flex flex-col items-center ${!showFavs ? 'text-orange-600' : 'text-gray-600'}`}
          >
            <Icon icon="mdi:home-outline" className="text-xl" />
            <span>Inicio</span>
          </button>
          <button
            onClick={() => setShowFavs(true)}
            className={`py-3 flex flex-col items-center ${showFavs ? 'text-orange-600' : 'text-gray-600'}`}
          >
            <Icon icon="mdi:heart-outline" className="text-xl" />
            <span>Favoritos</span>
          </button>
          <button
            onClick={() => setMostrarCarrito(true)}
            className="py-3 flex flex-col items-center text-gray-600 relative"
          >
            <Icon icon="mdi:cart-outline" className="text-xl" />
            <span>Carrito</span>
            {carrito.length > 0 && (
              <span className="absolute top-1 right-6 bg-red-500 text-white text-[10px] min-w-[16px] h-4 rounded-full px-1 flex items-center justify-center">
                {carrito.length}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/tienda/login')}
            className="py-3 flex flex-col items-center text-gray-600"
          >
            <Icon icon="mdi:account-circle-outline" className="text-xl" />
            <span>Perfil</span>
          </button>
        </div>
      </nav>

      {/* Modal de Personalización de Producto */}
      {showPersonalizarModal && productoAPersonalizar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-3">
              {productoAPersonalizar.imagenUrl && (
                <img
                  src={productoAPersonalizar.imagenUrl}
                  alt={productoAPersonalizar.descripcion}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{productoAPersonalizar.descripcion}</h3>
                <p className="text-primary font-bold">S/{Number(productoAPersonalizar.precioUnitario).toFixed(2)}</p>
              </div>
              <button
                onClick={() => {
                  setShowPersonalizarModal(false);
                  setProductoAPersonalizar(null);
                  setModificadoresProducto([]);
                  setSeleccionesModificadores({});
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <Icon icon="mdi:close" className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {loadingModificadores ? (
                <div className="flex items-center justify-center py-8">
                  <Icon icon="eos-icons:loading" className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : (
                modificadoresProducto.map((grupo) => (
                  <div key={grupo.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-800">{grupo.nombre}</h4>
                        <p className="text-sm text-gray-500">
                          {grupo.esObligatorio ? 'Obligatorio' : 'Opcional'}
                          {grupo.seleccionMax > 1 && ` • Máx. ${grupo.seleccionMax}`}
                        </p>
                      </div>
                      {grupo.esObligatorio && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                          Requerido
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {grupo.opciones.map((opcion: any) => {
                        const isSelected = (seleccionesModificadores[grupo.id] || []).includes(opcion.id);
                        const isRadio = grupo.seleccionMax === 1;

                        return (
                          <button
                            key={opcion.id}
                            onClick={() => toggleOpcionModificador(grupo.id, opcion.id, grupo.seleccionMax)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 flex items-center justify-center border-2 transition-colors ${
                                  isRadio ? 'rounded-full' : 'rounded'
                                } ${
                                  isSelected
                                    ? 'border-primary bg-primary'
                                    : 'border-gray-300'
                                }`}
                              >
                                {isSelected && (
                                  <Icon
                                    icon={isRadio ? 'mdi:circle' : 'mdi:check'}
                                    className={`text-white ${isRadio ? 'w-2 h-2' : 'w-3 h-3'}`}
                                  />
                                )}
                              </div>
                              <span className={isSelected ? 'font-medium text-gray-800' : 'text-gray-600'}>
                                {opcion.nombre}
                              </span>
                            </div>
                            {Number(opcion.precioExtra) > 0 && (
                              <span className="text-sm text-green-600 font-medium">
                                +S/{Number(opcion.precioExtra).toFixed(2)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer con precio y botón */}
            <div className="p-4 border-t bg-gray-50">
              {(() => {
                const precioBase = Number(productoAPersonalizar.precioUnitario);
                const precioExtras = Object.entries(seleccionesModificadores).reduce((total, [grupoId, opcionIds]) => {
                  const grupo = modificadoresProducto.find((g) => g.id === Number(grupoId));
                  if (!grupo) return total;
                  return total + opcionIds.reduce((sum, opId) => {
                    const opcion = grupo.opciones.find((o: any) => o.id === opId);
                    return sum + Number(opcion?.precioExtra || 0);
                  }, 0);
                }, 0);
                const precioTotal = precioBase + precioExtras;

                return (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-xl font-bold text-primary">S/{precioTotal.toFixed(2)}</p>
                      {precioExtras > 0 && (
                        <p className="text-xs text-gray-400">
                          Base: S/{precioBase.toFixed(2)} + Extras: S/{precioExtras.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={confirmarPersonalizacion}
                      className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                      <Icon icon="mdi:cart-plus" className="w-5 h-5" />
                      Agregar al carrito
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
