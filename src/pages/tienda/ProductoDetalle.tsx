import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import ProductCardPio from '@/components/tienda/ProductCardPio';
import Footer from '@/components/tienda/Footer';
import StoreHeader from '@/components/tienda/StoreHeader';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';
import ProductModifiersSelector from '@/components/tienda/ProductModifiersSelector';
import ShoppingCartModal from '@/components/tienda/ShoppingCartModal';

export default function ProductoDetalle() {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState<number>(1);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [tienda, setTienda] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [search, setSearch] = useState('');

  // Estados para personalización
  const [modificadoresProducto, setModificadoresProducto] = useState<any[]>([]);
  const [selecciones, setSelecciones] = useState<Record<number, number[]>>({});

  // Admin Menu Logic
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!adminMenuRef.current) return;
      if (!adminMenuRef.current.contains(e.target as Node)) setIsAdminOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const [prodRes, tiendaRes] = await Promise.all([
          axios.get(`${BASE_URL}/public/store/${slug}/products/${id}`),
          axios.get(`${BASE_URL}/public/store/${slug}`)
        ]);
        const prod = prodRes.data.data || prodRes.data;
        setProducto(prod);
        setTienda(tiendaRes.data.data || tiendaRes.data);
        if (prod.imagenUrl) setSelectedImage(prod.imagenUrl);

        // Cargar modificadores
        try {
          const modsRes = await axios.get(`${BASE_URL}/public/store/${slug}/products/${prod.id}/modifiers`);
          const mods = modsRes.data.data || modsRes.data || [];
          setModificadoresProducto(mods);

          // Inicializar selecciones por defecto
          const defaults: Record<number, number[]> = {};
          mods.forEach((grupo: any) => {
            const defaultOpciones = grupo.opciones.filter((op: any) => op.esDefault).map((op: any) => op.id);
            // Si es obligatorio y radio (max 1), y no hay default, seleccionar el primero?
            if (grupo.esObligatorio && grupo.seleccionMax === 1 && defaultOpciones.length === 0 && grupo.opciones.length > 0) {
              defaults[grupo.id] = [grupo.opciones[0].id];
            } else {
              defaults[grupo.id] = defaultOpciones;
            }
          });
          setSelecciones(defaults);

        } catch (err) {
          console.error('Error loading modifiers', err);
        }

        // Fetch Related Products
        try {
          const relatedRes = await axios.get(`${BASE_URL}/public/store/${slug}/products/${id}/related`);
          const relatedData = relatedRes.data.data || relatedRes.data;
          setRelatedProducts(Array.isArray(relatedData) ? relatedData : []);
        } catch (err) { console.error('Error fetching related:', err); }

      } catch (e) {
        console.error('Error al cargar datos:', e);
      } finally {
        setLoading(false);
      }
    };
    if (slug && id) cargar();

    // Rehidratar carrito
    try {
      const saved = localStorage.getItem(`tienda:${slug}:carrito`);
      if (saved) setCarrito(JSON.parse(saved));
    } catch { }
  }, [slug, id]);

  // Calcular precio extra y final
  const precioExtra = modificadoresProducto.reduce((total, grupo) => {
    const selectedIds = selecciones[grupo.id] || [];
    const grupoExtra = grupo.opciones
      .filter((op: any) => selectedIds.includes(op.id))
      .reduce((sum: number, op: any) => sum + Number(op.precioExtra || 0), 0);
    return total + grupoExtra;
  }, 0);

  const precioFinal = (Number(producto?.precioUnitario || 0) + precioExtra);


  const handleAgregarProducto = () => {
    if (!producto) return;

    // Validar modificadores obligatorios
    for (const grupo of modificadoresProducto) {
      const seleccionadas = selecciones[grupo.id] || [];
      if (grupo.esObligatorio && seleccionadas.length < (grupo.seleccionMin || 1)) {
        // Mostrar error visual o alert
        alert(`Por favor selecciona una opción para "${grupo.nombre}"`);
        return;
      }
    }

    // Construir lista de modifiers
    const modificadoresSeleccionados: any[] = [];
    modificadoresProducto.forEach((grupo) => {
      const seleccionadas = selecciones[grupo.id] || [];
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

    agregarAlCarritoDirecto(producto, cantidad, modificadoresSeleccionados);
  };

  const agregarAlCarritoDirecto = (prodToAdd: any, quantity: number, modificadores?: any[]) => {
    const qty = Math.max(1, Math.min(Number(quantity) || 1, prodToAdd?.stock || 1));

    // ID único si tiene modificadores
    const itemId = modificadores?.length
      ? `${prodToAdd.id}-${Date.now()}` // Simplificado para unicidad
      : prodToAdd.id;

    const pExtra = modificadores?.reduce((sum: number, mod: any) => sum + Number(mod.precioExtra || 0), 0) || 0;

    const item = {
      ...prodToAdd,
      id: itemId,
      productoId: prodToAdd.id,
      cantidad: qty,
      precioBase: prodToAdd.precioUnitario,
      precioUnitario: Number(prodToAdd.precioUnitario) + pExtra,
      modificadores: modificadores || []
    };

    let current: any[] = [];
    try {
      const saved = localStorage.getItem(`tienda:${slug}:carrito`);
      if (saved) current = JSON.parse(saved) || [];
    } catch { }

    // Si NO tiene modificadores, buscamos coincidencia
    if (!modificadores?.length) {
      const existe = current.find((i) => i.productoId === item.productoId && !i.modificadores?.length);
      if (existe) {
        const updated = current.map((i) => i.productoId === item.productoId && !i.modificadores?.length ? { ...i, cantidad: i.cantidad + qty } : i);
        setCarrito(updated);
        try { localStorage.setItem(`tienda:${slug}:carrito`, JSON.stringify(updated)); } catch { }
        setMostrarCarrito(true);
        return;
      }
    }

    const updated = [...current, item];
    setCarrito(updated);
    try { localStorage.setItem(`tienda:${slug}:carrito`, JSON.stringify(updated)); } catch { }
    setMostrarCarrito(true);
  };

  const actualizarCantidad = (productoId: number | string, cantidad: number) => {
    if (cantidad <= 0) {
      setCarrito(carrito.filter((item) => item.id !== productoId));
      try { localStorage.setItem(`tienda:${slug}:carrito`, JSON.stringify(carrito.filter((item) => item.id !== productoId))); } catch { }
    } else {
      const updated = carrito.map((item) => (item.id === productoId ? { ...item, cantidad } : item));
      setCarrito(updated);
      try { localStorage.setItem(`tienda:${slug}:carrito`, JSON.stringify(updated)); } catch { }
    }
  };

  const calcularSubtotal = () => {
    return carrito.reduce((sum, item) => sum + Number(item.precioUnitario) * Number(item.cantidad || 1), 0);
  };

  const irACheckout = () => {
    if (!producto) return;
    let exists = false;
    let currentCarrito = carrito;

    // Check local storage for latest state just in case
    try {
      const saved = localStorage.getItem(`tienda:${slug}:carrito`);
      if (saved) currentCarrito = JSON.parse(saved);
    } catch { }

    if (modificadoresProducto.length > 0) {

    }

    const simpleMatch = currentCarrito.find(i => i.productoId === producto.id || i.id === producto.id);

    if (simpleMatch) {
      // Already in cart -> Just go
      navigate(`/tienda/${slug}/checkout`, { state: { carrito: currentCarrito, tienda } });
    } else {
      // Not in cart -> Add then go
      agregarYRedirigir();
    }
  };

  const agregarYRedirigir = () => {
    // Re-implement simplified add for redirection
    const qty = Math.max(1, Math.min(Number(cantidad) || 1, producto?.stock || 1));
    const pExtra = modificadoresProducto.reduce((total, grupo) => {
      const selectedIds = selecciones[grupo.id] || [];
      const grupoExtra = grupo.opciones
        .filter((op: any) => selectedIds.includes(op.id))
        .reduce((sum: number, op: any) => sum + Number(op.precioExtra || 0), 0);
      return total + grupoExtra;
    }, 0);

    // Build modifiers list
    const modificadoresSeleccionados: any[] = [];
    modificadoresProducto.forEach((grupo) => {
      const seleccionadas = selecciones[grupo.id] || [];
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

    const itemId = modificadoresSeleccionados.length ? `${producto.id}-${Date.now()}` : producto.id;

    const item = {
      ...producto,
      id: itemId,
      productoId: producto.id,
      cantidad: qty,
      precioBase: producto.precioUnitario,
      precioUnitario: Number(producto.precioUnitario) + pExtra,
      modificadores: modificadoresSeleccionados
    };

    let newCart = [...carrito, item];
    // Check simple existence for non-modified again just to be safe (though irACheckout handled it)
    // If modified, we force add (as unique ID).

    setCarrito(newCart);
    localStorage.setItem(`tienda:${slug}:carrito`, JSON.stringify(newCart));
    navigate(`/tienda/${slug}/checkout`, { state: { carrito: newCart, tienda } });
  };

  const diseno = tienda?.diseno || {};
  const fontFamily = diseno.tipografia || 'Inter, sans-serif';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Icon icon="eos-icons:loading" className="w-12 h-12 text-gray-300" />
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon icon="mdi:alert-circle-outline" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Producto no encontrado</h2>
          <button onClick={() => navigate(`/tienda/${slug}`)} className="text-blue-600 hover:underline">Volver a la tienda</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F6F6] overflow-x-hidden" style={{ fontFamily: '"Mona Sans", ' + fontFamily }}>
      {/* Header Unificado */}
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
        categories={[]} // Categorías no cargadas en detalle
        onSelectCategory={() => { }}
        recommendedProducts={relatedProducts} // Usar productos relacionados para búsqueda
      />

      <main className="max-w-7xl mx-auto px-5 md:px-8 pt-28 md:pt-36 pb-10">
        {/* Carrito Lateral (Drawer) - Professional Design */}
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

        <nav className="mb-6 flex items-center gap-2 text-xs md:text-sm text-gray-500">
          <button onClick={() => navigate(`/tienda/${slug}`)} className="hover:text-[#FF9500] font-medium transition-colors">
            Inicio
          </button>
          <Icon icon="solar:alt-arrow-right-linear" width={14} className="text-gray-300" />
          <button onClick={() => navigate(`/tienda/${slug}/catalogo`)} className="hover:text-[#FF9500] font-medium transition-colors">
            Catálogo
          </button>
          <Icon icon="solar:alt-arrow-right-linear" width={14} className="text-gray-300" />
          <span className="font-semibold text-[#1A1A1A] truncate max-w-[50vw]">
            {typeof producto.categoria === 'object' && producto.categoria !== null ? (producto.categoria.nombre || producto.categoria.codigo || 'General') : (producto.categoria || 'General')}
          </span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Main Image Column */}
          <div className="relative">
            <div className="bg-white border border-gray-100 rounded-3xl aspect-[4/5] flex items-center justify-center p-8 relative overflow-hidden shadow-sm">

              {selectedImage || producto.imagenUrl ? (
                <img src={selectedImage || producto.imagenUrl} alt={producto.descripcion} className="w-full h-full object-contain mix-blend-multiply hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="flex flex-col items-center text-gray-300">
                  <Icon icon="solar:box-linear" className="w-24 h-24 mb-2" />
                  <span className="text-sm">Sin imagen</span>
                </div>
              )}
            </div>
          </div>

          {/* Details Column */}
          <div className="flex flex-col pt-1 bg-white border border-gray-100 rounded-3xl p-5 md:p-7 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FFF3E0] text-[#FF9500] font-bold">Disponible</span>
              <span className="text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-bold">Stock: {producto.stock ?? 0}</span>
            </div>

            <p className="text-gray-500 text-sm mb-1 font-medium">{tienda?.nombreComercial || 'Mi Tienda'}</p>

            {/* Title */}
            <h1 className="text-3xl lg:text-4xl font-black text-[#1A1A1A] mb-3 leading-tight">
              {producto.descripcion}
            </h1>

            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              {producto.descripcionLarga || producto.descripcion || 'Sin descripción disponible para este producto.'}
            </p>

            <div className="flex items-end gap-2 text-[#1A1A1A] mb-6">
              <span className="text-sm font-semibold text-gray-500 pb-1">S/</span>
              <span className="text-5xl font-black tracking-tight leading-none">{precioFinal.toFixed(2)}</span>
            </div>

            {/* Klarna / Installments Box */}
            {/* <div className="border border-gray-100 rounded-xl p-4 flex items-center gap-4 mb-8 bg-white shadow-sm">
              <div className="bg-pink-100 px-3 py-1 rounded text-pink-600 font-bold italic">Klarna.</div>
              <div className="text-sm text-gray-600">
                Paga en 3 cuotas sin interés de <span className="font-bold text-gray-900">S/ {(Number(producto.precioUnitario) / 3).toFixed(2)}</span>
              </div>
            </div> */}

            <ProductModifiersSelector
              modifiers={modificadoresProducto}
              selections={selecciones}
              onChange={setSelecciones}
            />

            <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-6">
              <div className="w-full md:flex-1 flex items-center justify-between bg-[#F3F4F6] rounded-xl px-4 py-2.5 order-1 md:order-none">
                <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} className="text-gray-500 hover:text-black hover:bg-white rounded-md w-7 h-7 flex items-center justify-center transition-colors font-bold">-</button>
                <span className="font-bold text-sm text-gray-900">{cantidad}</span>
                <button onClick={() => setCantidad(Math.min(producto.stock || 99, cantidad + 1))} className="text-gray-500 hover:text-black hover:bg-white rounded-md w-7 h-7 flex items-center justify-center transition-colors font-bold">+</button>
              </div>

              <div className="flex gap-3 md:contents w-full order-2 md:order-none">
                <button
                  onClick={handleAgregarProducto}
                  className="flex-1 bg-[#1A1A1A] hover:bg-black text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors w-full md:w-auto"
                >
                  <Icon icon="solar:cart-large-minimalistic-linear" width={20} />
                  <span className="hidden sm:inline">Agregar</span>
                  <span className="sm:hidden">Agregar</span>
                </button>

                <button
                  onClick={irACheckout}
                  className="flex-1 bg-[#FF9500] hover:bg-[#E08500] text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm w-full md:w-auto"
                >
                  Comprar ahora
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <p className="text-sm text-gray-500 mb-1"><span className="font-bold text-gray-900">SKU:</span> {producto.codigo || 'N/A'}</p>
              <p className="text-sm text-gray-500 mb-1">
                <span className="font-bold text-gray-900">Categoría:</span> {typeof producto.categoria === 'object' && producto.categoria !== null ? (producto.categoria.nombre || 'General') : (producto.categoria || 'General')}
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:gap-4 mt-5">
              <div className="flex-1 bg-[#FAFBFC] rounded-xl p-4 flex items-center gap-4 border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#FF9500] shadow-sm border border-gray-100">
                  <Icon icon="solar:truck-bold-duotone" width={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Entrega rápida</h4>
                  <p className="text-xs text-gray-500">Despacho coordinado con la tienda</p>
                </div>
              </div>
              <div className="flex-1 bg-[#FAFBFC] rounded-xl p-4 flex items-center gap-4 border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#22C55E] shadow-sm border border-gray-100">
                  <Icon icon="solar:hand-shake-bold-duotone" width={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Compra segura</h4>
                  <p className="text-xs text-gray-500">Atención directa por WhatsApp</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Related Products */}
      <div className='max-w-7xl mx-auto px-5 md:px-8'>
        {relatedProducts.length > 0 && (
          <div className="border-t border-gray-200 pt-12 rounded-xl mb-14">
            <h3 className="text-2xl font-black mb-6 text-left text-[#1A1A1A] tracking-tight">Productos similares</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              {relatedProducts.slice(0, 10).map((rp) => (
                <ProductCardPio
                  key={rp.id}
                  producto={rp}
                  slug={slug || ''}
                  diseno={diseno}
                  onAddToCart={(p) => {
                    agregarAlCarritoDirecto(p, 1);
                  }}
                  onClick={() => {
                    navigate(`/tienda/${slug}/producto/${rp.id}`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer tienda={tienda} diseno={diseno} />


    </div>
  );
}
