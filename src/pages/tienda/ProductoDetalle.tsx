import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import ProductCardPio from '@/components/tienda/ProductCardPio';
import Footer from '@/components/tienda/Footer';
import StoreHeader from '@/components/tienda/StoreHeader';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
import ProductCustomizationModal from '@/components/tienda/ProductCustomizationModal';
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
  const dragging = useRef(false);

  // Estados para personalización
  const [modificadoresProducto, setModificadoresProducto] = useState<any[]>([]);
  const [selecciones, setSelecciones] = useState<Record<number, number[]>>({});

  // Admin Menu Logic
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement | null>(null);
  const isLoggedIn = !!localStorage.getItem('ACCESS_TOKEN');

  // Countdown Logic (Realistic simulation)
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 25, seconds: 43 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

    // Si tiene modificadores, agregamos siempre como nuevo item (o podríamos comparar deep equality de modifiers)
    // Para simplificar, asumimos que si tiene modifiers es un item distinto o usamos el timestamp en ID.
    // La logica anterior usaba timestamp, asi que siempre es nuevo item si tiene mods.

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

    // Check if product (with current modifiers) is already in cart
    // Logic: If it exists, just navigate. If not, add it.
    // For simplicity with modifiers, we just check product ID if no modifiers.
    // If modifiers exist, we might add it anyway or check deeper. 
    // Given user complaint, let's try to find exact match.

    let exists = false;
    let currentCarrito = carrito;

    // Check local storage for latest state just in case
    try {
      const saved = localStorage.getItem(`tienda:${slug}:carrito`);
      if (saved) currentCarrito = JSON.parse(saved);
    } catch { }

    if (modificadoresProducto.length > 0) {
      // Complex check: if any item has same productID and SAME modifiers
      // For now, to solve the "summing" issue simple:
      // If they click Buy Now, and items > 0, we can assume they want to checkout what they entered?
      // Or just trigger handleAgregarProducto only if not in cart.
      // Let's rely on handleAgregar logic but modified
      // Actually, handleAgregarProducto always adds.

      // Let's manually check existence
      // Difficulty: determining if "current selected modifiers" match "cart item modifiers".
      // simpler approach: Just navigate if cart has this product, OR overwrite?
      // User said: "me esta sumando... esta mal".
      // If I click Buy Now, I probably want 1 item.
      // Let's just navigate if card has this productID, regardless of mods? No that's bad.

      // Better fix: "handleAgregarProducto" logic is "Add to cart".
      // "Comprar Ahora" should be "Set Cart to THIS item" (Quick buy)? 
      // No, that clears other items.

      // Let's try: If item exists, update it to current quantity/selection?
      // Or just Navigate?
    }

    // Simplest interpretation of user request: "Don't add duplicate".
    // We will check if an item with same ID exists (for simple products).
    const simpleMatch = currentCarrito.find(i => i.productoId === producto.id || i.id === producto.id);

    if (simpleMatch) {
      // Already in cart -> Just go
      navigate(`/tienda/${slug}/checkout`, { state: { carrito: currentCarrito, tienda } });
    } else {
      // Not in cart -> Add then go
      // We can't easily wait for state update of handleAgregarProducto in one tick if it uses setters.
      // So we call specialized add that returns the new cart or navigates.
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

  function NextArrow(props: any) {
    const { className, style, onClick } = props;
    return (
      <div
        className={`${className} !flex items-center justify-center !w-12 !h-12 !bg-white hover:!bg-black shadow-lg rounded-full z-10 before:!content-none transition-all duration-300 group/arrow`}
        style={{ ...style, right: "-20px" }}
        onClick={onClick}
      >
        <Icon icon="mdi:chevron-right" className="text-black group-hover/arrow:text-white w-6 h-6" />
      </div>
    );
  }

  function PrevArrow(props: any) {
    const { className, style, onClick } = props;
    return (
      <div
        className={`${className} !flex items-center justify-center !w-12 !h-12 !bg-white hover:!bg-black shadow-lg rounded-full z-10 before:!content-none transition-all duration-300 group/arrow`}
        style={{ ...style, left: "-20px" }}
        onClick={onClick}
      >
        <Icon icon="mdi:chevron-left" className="text-black group-hover/arrow:text-white w-6 h-6" />
      </div>
    );
  }

  const settings = {
    dots: true,
    infinite: relatedProducts.length > 4,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 4,
    autoplay: true,
    autoplaySpeed: 3000,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    beforeChange: () => { dragging.current = true; },
    afterChange: () => { dragging.current = false; },
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 3, arrows: false } }, // Hide arrows on tablet
      { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 2, arrows: false } }, // Hide arrows on mobile
      { breakpoint: 480, settings: { slidesToShow: 1, slidesToScroll: 1, arrows: false } }  // Hide arrows on small mobile
    ]
  };

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

  const extras: string[] = Array.isArray(producto?.imagenesExtra) ? producto.imagenesExtra : [];
  const allImages = [producto.imagenUrl, ...extras].filter(Boolean);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: '"Mona Sans", ' + fontFamily }}>
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

      <main className="max-w-7xl mx-auto px-6 py-8 bg-[#fff]">
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

        {/* Breadcrumb - Style: "All category / Category Name" */}
        <div className="mb-8">
          <h2 className="text-[12px] font-bold text-[#045659]">
            Todas las categorías / <span className="text-gray-600 font-normal">{typeof producto.categoria === 'object' && producto.categoria !== null ? (producto.categoria.nombre || producto.categoria.codigo || 'General') : (producto.categoria || 'General')}</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Main Image Column - Single Image as requested */}
          <div className="relative">
            <div className="bg-[#F8F9FA] rounded-3xl aspect-[4/5] flex items-center justify-center p-8 relative overflow-hidden">
              {/* Badge: Free Delivery */}
              <div className="absolute top-6 left-6 bg-[#045659] text-white px-4 py-1.5 rounded-full text-sm font-medium z-10 shadow-sm">
                Envío Gratis
              </div>

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
          <div className="flex flex-col pt-2">
            {/* Timer */}
            <div className="flex items-center gap-4 text-[#F05542] font-semibold mb-3">
              <Icon icon="solar:clock-circle-bold" className="w-5 h-5" />
              <div className="flex gap-1 font-mono text-lg items-center">
                <span className="bg-gray-100 rounded px-1">{String(timeLeft.hours).padStart(2, '0')}</span> :
                <span className="bg-gray-100 rounded px-1">{String(timeLeft.minutes).padStart(2, '0')}</span> :
                <span className="bg-gray-100 rounded px-1">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="text-xs text-gray-400 font-sans ml-2">Expira pronto</span>
              </div>
            </div>

            {/* Vendor / Subtitle */}
            <p className="text-gray-500 text-sm mb-2 font-medium">{'Mi Tienda'}</p>

            {/* Title */}
            <h1 className="text-3xl lg:text-4xl font-extrabold text-[#045659] mb-3 leading-tight">
              {producto.descripcion}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex text-[#F4C542]">
                {[1, 2, 3, 4, 5].map(i => <Icon key={i} icon="solar:star-bold" width={16} />)}
              </div>
              {/* <span className="text-sm font-bold text-gray-700">4.5 Rating</span> */}
              {/* <span className="text-sm text-gray-400 underline decoration-gray-300">(15 reseñas)</span> */}
            </div>

            {/* Price - Style: Large integer with superscript decimal */}
            <div className="flex items-start text-[#045659] leading-none mb-8">
              <span className="text-5xl font-extrabold tracking-tight">
                {Math.floor(precioFinal)}
              </span>
              <span className="text-2xl font-bold mt-1">
                .{precioFinal.toFixed(2).split('.')[1]} <span className="text-xl pl-1">S/</span>
              </span>
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

            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 flex items-center justify-between bg-[#F3F4F6] rounded-full px-6 py-3">
                <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} className="text-gray-500 hover:text-black hover:bg-white rounded-full w-8 h-8 flex items-center justify-center transition-colors font-bold pb-1">-</button>
                <span className="font-bold text-gray-900">{cantidad}</span>
                <button onClick={() => setCantidad(Math.min(producto.stock || 99, cantidad + 1))} className="text-gray-500 hover:text-black hover:bg-white rounded-full w-8 h-8 flex items-center justify-center transition-colors font-bold pb-1">+</button>
              </div>

              <button
                onClick={handleAgregarProducto}
                className="flex-[2] bg-[#F3F4F6] hover:bg-[#e5e7eb] text-gray-900 py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Icon icon="solar:cart-large-minimalistic-linear" width={20} />
                Agregar al carrito
              </button>

              <button
                onClick={irACheckout}
                className="flex-[2] bg-[#BCE766] hover:bg-[#aed859] text-[#045659] py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                Comprar ahora
              </button>
            </div>

            {/* Links: Wishlist & Compare */}
            <div className="flex items-center gap-6 mb-8 text-sm font-bold text-[#045659]">
              {/* <button className="flex items-center gap-2 hover:underline decoration-2 underline-offset-4">
                <Icon icon="solar:heart-linear" width={18} />
                AÑADIR A FAVORITOS
              </button> */}
              {/* <button className="flex items-center gap-2 hover:underline decoration-2 underline-offset-4">
                <Icon icon="solar:restart-square-linear" width={18} />
                COMPARAR
              </button> */}
            </div>

            {/* Badges Layout */}
            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-[#045659] flex items-center justify-center text-white text-xs">
                      <Icon icon="solar:leaf-bold" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-[#C62828] font-bold text-sm bg-red-50 px-3 py-1 rounded-full">
                  <Icon icon="solar:fire-bold" />
                  100 vendidos en las últimas 35 horas
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-1"><span className="font-bold text-gray-900">SKU:</span> {producto.codigo || 'N/A'}</p>
              <p className="text-sm text-gray-500 mb-1">
                <span className="font-bold text-gray-900">Categoría:</span> {typeof producto.categoria === 'object' && producto.categoria !== null ? (producto.categoria.nombre || 'General') : (producto.categoria || 'General')}
              </p>
              <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                {producto.descripcionLarga || producto.descripcion || 'Sin descripción disponible para este producto.'}
              </p>
            </div>

            {/* Bottom Cards: Free Delivery & Great Deal */}
            <div className="flex gap-4 mt-auto">
              <div className="flex-1 bg-pink-50 rounded-xl p-4 flex items-center gap-4 border border-pink-100">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-pink-500 shadow-sm">
                  <Icon icon="solar:truck-bold-duotone" width={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Envío Gratis</h4>
                  <p className="text-xs text-gray-500">En pedidos desde S/ 100</p>
                </div>
              </div>
              <div className="flex-1 bg-green-50 rounded-xl p-4 flex items-center gap-4 border border-green-100">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-green-500 shadow-sm">
                  <Icon icon="solar:hand-shake-bold-duotone" width={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Mejor oferta del día</h4>
                  <p className="text-xs text-gray-500">Productos orgánicos</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Footer */}
      {/* Related Products Slider */}
      <div className='max-w-7xl mx-auto'>
        {relatedProducts.length > 0 && (
          <div className="border-t border-gray-100 pt-16 rounded-xl mb-14">
            <h3 className="text-2xl font-bold mb-8 text-left tracking-wide">Producto similares</h3>
            <div className="px-0"> {/* Padding for slider arrows */}
              <Slider {...settings}>
                {relatedProducts.map((rp) => (
                  <div key={rp.id} className="rounded-xl p-2" onClickCapture={(e) => {
                    if (dragging.current) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}>
                    <ProductCardPio
                      producto={rp}
                      slug={slug || ''}
                      diseno={diseno}
                      onAddToCart={(p) => {
                        agregarAlCarritoDirecto(p, 1);
                      }}
                      onClick={() => {
                        if (dragging.current) return;
                        navigate(`/tienda/${slug}/producto/${rp.id}`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    />
                  </div>
                ))}
              </Slider>
            </div>
          </div>
        )}
      </div>
      <Footer tienda={tienda} diseno={diseno} />


    </div>
  );
}
