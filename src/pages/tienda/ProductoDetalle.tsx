import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import ProductCardGlamora from '@/components/tienda/ProductCardGlamora';
import Footer from '@/components/tienda/Footer';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

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
  const dragging = useRef(false);

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

        // Fetch Related Products from new endpoint
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

  const agregarAlCarrito = (prodToAdd = producto) => {
    const qty = Math.max(1, Math.min(Number(cantidad) || 1, prodToAdd?.stock || 1));
    const item = { ...prodToAdd, id: prodToAdd.id, cantidad: qty };

    let current: any[] = [];
    try {
      const saved = localStorage.getItem(`tienda:${slug}:carrito`);
      if (saved) current = JSON.parse(saved) || [];
    } catch { }

    const existe = current.find((i) => i.id === item.id);
    let updated: any[];
    if (existe) {
      updated = current.map((i) => i.id === item.id ? { ...i, cantidad: i.cantidad + qty } : i);
    } else {
      updated = [...current, item];
    }
    setCarrito(updated);
    try { localStorage.setItem(`tienda:${slug}:carrito`, JSON.stringify(updated)); } catch { }
    setMostrarCarrito(true);
    // alert('Producto agregado al carrito');
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
    agregarAlCarrito();
    navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } });
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
    <div className="min-h-screen bg-[#ECECEC]" style={{ fontFamily }}>
      {/* Header Simple */}
      <header className="border-b border-gray-100 sticky top-0 bg-white z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(`/tienda/${slug}`)}>
            {tienda?.logo && <img src={tienda.logo} className="h-8 w-auto" />}
            <span className="font-bold text-lg uppercase tracking-wide">{tienda?.nombreComercial}</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/tienda/${slug}`)} className="hidden md:flex items-center gap-2 text-sm font-medium hover:text-gray-600">
              TIENDA
            </button>
            <button
              onClick={() => setMostrarCarrito(!mostrarCarrito)}
              className="relative flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
            >
              <div className="relative">
                <Icon icon="solar:bag-linear" className="w-6 h-6" />
                {carrito.length > 0 && <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">{carrito.length}</span>}
              </div>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 bg-[#fff]">
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
                          onClick={() => actualizarCantidad(item.id, 0)}
                          className="absolute -top-2 -left-2 bg-white rounded-full p-1 shadow border border-gray-200 hover:bg-red-50 text-gray-400 hover:text-red-50 z-10"
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
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <span className="cursor-pointer hover:text-black" onClick={() => navigate(`/tienda/${slug}`)}>Inicio</span>
          <Icon icon="mdi:chevron-right" />
          <span className="cursor-pointer hover:text-black">{producto.categoria?.nombre || 'General'}</span>
          <Icon icon="mdi:chevron-right" />
          <span className="text-black font-medium text-ellipsis overflow-hidden whitespace-nowrap max-w-[200px]">{producto.descripcion}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 mb-20">
          {/* Images */}
          <div className="space-y-4 border rounded-xl">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden relative group">
              {selectedImage ? (
                <img src={selectedImage} alt={producto.descripcion} className="w-full h-full object-contain object-center" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300"><Icon icon="mdi:image-off" className="w-20 h-20" /></div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="grid grid-cols-5 gap-4">
                {allImages.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${selectedImage === img ? 'border-black' : 'border-transparent hover:border-gray-200'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">{producto.descripcion}</h1>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-2xl font-bold">S/ {Number(producto.precioUnitario).toFixed(2)}</span>
              {producto.stock > 0 ? (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Disponible ({producto.stock} und)</span>
              ) : (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">Agotado</span>
              )}
            </div>

            <div className="prose prose-sm text-gray-600 mb-8 max-w-none">
              <p>{producto.descripcionLarga || 'Sin descripción detallada.'}</p>
            </div>

            <div className="border-t border-b border-gray-100 py-6 mb-8">
              <div className="flex items-center gap-6">
                <span className="text-sm font-medium text-gray-900 w-20">Cantidad</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} className="px-4 py-2 hover:bg-gray-50 text-gray-500">-</button>
                  <input
                    type="number"
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                    className="w-12 text-center text-sm border-none focus:ring-0 p-0"
                  />
                  <button onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))} className="px-4 py-2 hover:bg-gray-50 text-gray-500">+</button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => agregarAlCarrito()}
                className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-gray-800 transition-transform active:scale-[0.99] shadow-lg"
                disabled={producto.stock <= 0}
              >
                {producto.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
              </button>
              <button
                onClick={irACheckout}
                className="w-full border-2 border-black text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
              >
                Comprar Ahora
              </button>
            </div>

            <div className="mt-8 flex items-center gap-4 text-sm text-gray-500 justify-center">
              <span className="flex items-center gap-2"><Icon icon="mdi:shield-check-outline" /> Compra Segura</span>
              <span className="flex items-center gap-2"><Icon icon="mdi:truck-delivery-outline" /> Envíos locales</span>
            </div>
          </div>
        </div>




      </main>

      {/* Footer */}
      {/* Related Products Slider */}
      <div className='max-w-7xl mx-auto'>
        {relatedProducts.length > 0 && (
          <div className="border-t border-gray-100 pt-16 rounded-xl">
            <h3 className="text-2xl font-bold mb-8 text-left tracking-wide">Productos que otros clientes tambien han comprado</h3>
            <div className="px-0"> {/* Padding for slider arrows */}
              <Slider {...settings}>
                {relatedProducts.map((rp) => (
                  <div key={rp.id} className="rounded-xl" onClickCapture={(e) => {
                    if (dragging.current) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}>
                    <ProductCardGlamora
                      producto={rp}
                      slug={slug || ''}
                      diseno={diseno}
                      onAddToCart={(p) => agregarAlCarrito(p)}
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
