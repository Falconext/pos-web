import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function ProductoDetalle() {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState<number>(1);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [tienda, setTienda] = useState<any>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [prodRes, tiendaRes] = await Promise.all([
          axios.get(`${BASE_URL}/public/store/${slug}/products/${id}`),
          axios.get(`${BASE_URL}/public/store/${slug}`)
        ]);
        setProducto(prodRes.data.data || prodRes.data);
        setTienda(tiendaRes.data.data || tiendaRes.data);
      } catch (e) {
        console.error('Error al cargar datos:', e);
      } finally {
        setLoading(false);
      }
    };
    cargar();
    // Rehidratar carrito
    try {
      const saved = localStorage.getItem(`tienda:${slug}:carrito`);
      if (saved) setCarrito(JSON.parse(saved));
    } catch { }
  }, [slug, id]);

  const agregarAlCarrito = () => {
    const qty = Math.max(1, Math.min(Number(cantidad) || 1, producto?.stock || 1));
    const item = { ...producto, id: producto.id, cantidad: qty };
    // merge con carrito persistido
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
  };

  const irACheckout = () => {
    if (!producto) return;
    const items = carrito.length > 0 ? carrito : [{ ...producto, id: producto.id, cantidad: Math.max(1, cantidad) }];
    try { localStorage.setItem(`tienda:${slug}:carrito`, JSON.stringify(items)); } catch { }
    navigate(`/tienda/${slug}/checkout`, { state: { carrito: items, tienda } });
  };

  // Helpers de diseño
  const diseno = tienda?.diseno || {};
  const getBordeRadius = () => {
    switch (diseno.bordeRadius) {
      case 'none': return 'rounded-none';
      case 'small': return 'rounded';
      case 'large': return 'rounded-2xl';
      case 'full': return 'rounded-3xl';
      default: return 'rounded-xl';
    }
  };
  const getBotonStyle = () => {
    switch (diseno.estiloBoton) {
      case 'square': return 'rounded-none';
      case 'pill': return 'rounded-full';
      default: return 'rounded-lg';
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
      default: return 'font-sans';
    }
  };

  const borderRadius = getBordeRadius();
  const btnRadius = getBotonStyle();
  const fontFamily = getFontFamily();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon icon="eos-icons:loading" className="w-10 h-10 text-gray-400" />
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon icon="mdi:alert-circle-outline" className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Producto no encontrado</p>
          <button onClick={() => navigate(`/tienda/${slug}`)} className={`mt-4 px-4 py-2 ${btnRadius} border bg-white hover:bg-gray-50`}>Volver a la tienda</button>
        </div>
      </div>
    );
  }

  const img = producto?.imagenUrl
    ? (producto.imagenUrl.startsWith('http') ? producto.imagenUrl : producto.imagenUrl)
    : 'https://via.placeholder.com/600x400?text=Sin+imagen';
  const extras: string[] = Array.isArray(producto?.imagenesExtra) ? producto.imagenesExtra : [];

  return (
    <div className={`min-h-screen bg-gray-50 ${fontFamily}`} style={{ fontFamily: diseno.tipografia }}>
      <div className="max-w-8xl mx-auto px-4 py-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-black mb-6">
          <Icon icon="mdi:arrow-left" /> Volver
        </button>
        <div className="grid md:grid-cols-2 gap-6">
          <div className={`bg-white ${borderRadius} shadow p-4`}>
            <img src={img} alt={producto.descripcion} className={`w-full h-72 object-cover ${borderRadius}`} />
            {extras.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {extras.map((u, i) => (
                  <img key={i} src={u} className={`w-full h-20 object-cover ${borderRadius} border`} />
                ))}
              </div>
            )}
          </div>
          <div className={`bg-white ${borderRadius} shadow p-6`}>
            <h1 className="text-xl font-bold mb-2">{producto.descripcion}</h1>
            {producto.descripcionLarga && (
              <p className="text-sm text-gray-600 mb-4">{producto.descripcionLarga}</p>
            )}
            <div className="text-2xl font-bold mb-2">S/ {Number(producto.precioUnitario).toFixed(2)}</div>
            <div className="text-sm text-gray-500 mb-6">Stock: {producto.stock}</div>
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm text-gray-600">Cantidad</label>
              <input
                type="number"
                min={1}
                max={producto.stock || 1}
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, Number(e.target.value) || 1))}
                className={`w-20 border ${borderRadius} p-2`}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={agregarAlCarrito}
                className={`px-4 py-2 ${btnRadius} text-white hover:opacity-90`}
                style={{ backgroundColor: diseno.colorPrimario || '#000' }}
              >
                Agregar al carrito
              </button>
              <button
                onClick={irACheckout}
                className={`px-4 py-2 ${btnRadius} border bg-white hover:bg-gray-50`}
                style={{ borderColor: diseno.colorPrimario, color: diseno.colorPrimario }}
              >
                Comprar ahora
              </button>
            </div>
            <button onClick={() => navigate(`/tienda/${slug}`)} className={`mt-4 px-4 py-2 ${btnRadius} border bg-white hover:bg-gray-50`}>Volver a la tienda</button>
          </div>
        </div>
      </div>
    </div>
  );
}
