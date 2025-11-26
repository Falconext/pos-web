import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useMemo as _useMemo } from 'react';
import axios from 'axios';

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

  useEffect(() => {
    cargarTienda();
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
    } catch {}
    setIsCartLoaded(true);
  }, [slug]);

  // Persistir carrito solo cuando ya se haya cargado inicialmente
  useEffect(() => {
    if (!isCartLoaded) return;
    try {
      localStorage.setItem(`tienda:${slug}:carrito`, JSON.stringify(carrito));
    } catch {}
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

  const cargarTienda = async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/public/store/${slug}`);
      setTienda(data.data || data);
    } catch (error) {
      console.error('Error al cargar tienda:', error);
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

  const agregarAlCarrito = (producto: any) => {
    const existe = carrito.find((item) => item.id === producto.id);
    if (existe) {
      setCarrito(
        carrito.map((item) =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      );
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
    // Ya no abrir el carrito automáticamente
  };

  const actualizarCantidad = (productoId: number, cantidad: number) => {
    if (cantidad <= 0) {
      setCarrito(carrito.filter((item) => item.id !== productoId));
    } else {
      setCarrito(
        carrito.map((item) => (item.id === productoId ? { ...item, cantidad } : item))
      );
    }
  };

  const calcularTotal = () => {
    return carrito.reduce((sum, item) => sum + Number(item.precioUnitario) * item.cantidad, 0);
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header
        className="bg-white shadow-sm sticky top-0 z-10"
        style={{ backgroundColor: tienda.colorPrimario || '#000' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {tienda.logo && (
              <img src={tienda.logo} alt={tienda.nombreComercial} className="h-12 w-12 object-cover rounded" />
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
                <button onClick={() => setIsAdminOpen((v) => !v)} className="bg-white/20 text-white px-3 py-2 rounded-full hover:bg-white/30 text-sm flex items-center gap-1">
                  <Icon icon="mdi:cog-outline" /> Admin
                </button>
                {isAdminOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/20 bg-white/95 text-gray-800 shadow-lg backdrop-blur">
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
          <div className="w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-4 min-w-[640px]">
              {[1,2,3].map((i) => (
                <div key={i} className="relative h-36 w-[360px] rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md flex items-center p-5 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                  <div className="relative z-10">
                    <p className="text-xs uppercase opacity-90 tracking-wider font-semibold mb-1">Promoción</p>
                    <h3 className="text-xl font-bold leading-tight mb-2">Descubre nuestras<br/>ofertas especiales</h3>
                    <button className="text-xs bg-white text-orange-600 px-3 py-1.5 rounded-full font-bold hover:bg-gray-100 transition">Ver más</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Icon icon="mdi:magnify" className="text-gray-400 group-focus-within:text-orange-500 transition-colors" width={24} />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="¿Qué estás buscando hoy?"
                className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-4 shadow-sm outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all text-gray-700 placeholder:text-gray-400"
              />
            </div>
            <button 
              className="px-6 py-4 rounded-2xl bg-gray-900 text-white font-medium shadow-lg shadow-gray-200 hover:bg-gray-800 transition-all active:scale-95"
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
                    className={`px-4 py-2 rounded-full text-xs border transition ${active ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
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

        {filteredProductos.length === 0 ? (
          <div className="text-center py-12">
            <Icon icon="mdi:package-variant" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No hay productos disponibles</p>
          </div>
        ) : (
          <>
            {/* Vista Cards (Default). Se usa para cualquier vista excepto 'lista' */}
            {(!tienda.diseno?.vistaProductos || tienda.diseno?.vistaProductos !== 'lista') && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProductos.map((producto) => {
                  const fav = !!favorites[producto.id];
                  // Tiempo: priorizar diseño de rubro, luego empresa, luego default
                  const tiempoMin = (tienda as any)?.diseno?.tiempoEntregaMin ?? (tienda as any)?.tiempoPreparacionMin ?? 15;
                  const tiempoMax = (tienda as any)?.diseno?.tiempoEntregaMax ?? (tiempoMin + 10);
                  const free = Boolean((tienda as any)?.aceptaEnvio) && Number((tienda as any)?.costoEnvioFijo ?? 0) === 0;
                  const rating = (producto as any)?.ratingAvg;
                  const ratingCount = (producto as any)?.ratingCount;
                  return (
                    <div key={producto.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 relative group hover:shadow-md transition-all">
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
                        {/* Chips superiores: tiempo estimado y favorito */}
                        <div className="absolute top-2 left-2 flex gap-2">
                          <span className="text-[11px] px-2 py-1 rounded-full bg-black/70 text-white backdrop-blur-sm">{tiempoMin} - {tiempoMax} min</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFav(producto.id); }}
                          className={`absolute top-2 right-2 p-2 rounded-full shadow-sm transition-transform active:scale-95 ${fav ? 'bg-red-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                          <Icon icon={fav ? 'mdi:heart' : 'mdi:heart-outline'} />
                        </button>
                      </div>
                      <div className="p-4">
                        <h3
                          className="font-semibold text-sm mb-1 line-clamp-2 min-h-[2.5rem] cursor-pointer hover:text-orange-600 transition-colors"
                          onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)}
                        >
                          {producto.descripcion}
                        </h3>
                        {/* Badges secundarios */}
                        <div className="flex items-center gap-2 mb-2">
                          {producto?.categoria?.nombre && (
                            <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">{producto.categoria.nombre}</span>
                          )}
                          {free && (
                            <span className="text-[11px] px-2 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200">Free delivery</span>
                          )}
                        </div>

                        {/* Rating si existe */}
                        {rating ? (
                          <div className="flex items-center gap-2 text-[12px] text-gray-700 mb-1">
                            <Icon icon="mdi:star" className="text-yellow-500" />
                            <span className="font-medium">{Number(rating).toFixed(1)}</span>
                            {ratingCount ? <span className="text-gray-500">({ratingCount})</span> : null}
                          </div>
                        ) : null}

                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-lg font-bold text-gray-900 leading-none">S/ {Number(producto.precioUnitario).toFixed(2)}</p>
                          </div>
                          <button
                            onClick={() => agregarAlCarrito(producto)}
                            className="p-2.5 rounded-xl text-white hover:opacity-95 transition shadow-sm"
                            style={{ backgroundColor: tienda.colorPrimario || '#000' }}
                            aria-label="Agregar al carrito"
                          >
                            <Icon icon="mdi:shopping-outline" width={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Vista Lista (Bodega / Minimarket) */}
            {tienda.diseno?.vistaProductos === 'lista' && (
              <div className="flex flex-col gap-3">
                {filteredProductos.map((producto) => {
                  const fav = !!favorites[producto.id];
                  return (
                    <div key={producto.id} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex gap-4 items-center">
                      <div
                        className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
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
                            className="font-medium text-gray-900 truncate pr-4 cursor-pointer hover:text-orange-600"
                            onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)}
                          >
                            {producto.descripcion}
                          </h3>
                          <button onClick={() => toggleFav(producto.id)} className={`${fav ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}>
                            <Icon icon={fav ? 'mdi:heart' : 'mdi:heart-outline'} width={20} />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{producto.categoria?.nombre}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="font-bold text-gray-900">S/ {Number(producto.precioUnitario).toFixed(2)}</span>
                          <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Stock: {producto.stock}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => agregarAlCarrito(producto)}
                        className="p-3 rounded-full text-white shadow-sm hover:shadow-md transition-all active:scale-95 flex-shrink-0"
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
          </>
        )}

        {/* Paginación */}
        {productos.length < total && (
          <div className="flex justify-center mt-8">
            <button
              disabled={loadingMore}
              onClick={() => { setLoadingMore(true); cargarProductos(page + 1); }}
              className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              {loadingMore ? 'Cargando...' : 'Cargar más'}
            </button>
          </div>
        )}
      </main>

      {/* Carrito lateral */}
      {mostrarCarrito && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setMostrarCarrito(false)}>
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
                    <span>S/ {calcularTotal().toFixed(2)}</span>
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
    </div>
  );
}
