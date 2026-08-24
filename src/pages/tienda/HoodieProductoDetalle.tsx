import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { getProductPricing, withPricing, withPricingList } from '@/templates/shared/pricing';
import { onTiendaCartCleared } from '@/utils/tiendaCart';
import { HD, HdCartModal, HdFooter, HdHeader, HdProductCard, HdProductImage, HdWhatsAppFab, hdFont, hdPrimary, hdRating, waLink, withAlpha } from '@/templates/hoodie/HoodieParts';
import { hdCard, hdFade, hdPage, hdSection, hdStagger, hdTap, hdViewport } from '@/templates/hoodie/motion';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

const money = (v: number) => `S/ ${Number(v || 0).toFixed(2)}`;
const getImg = (p: any) => p?.imagenUrl || p?.imagen || '';
const nameOf = (p: any) => p?.descripcion || p?.nombre || 'Prenda';
const catOf = (p: any) => (typeof p?.categoria === 'object' ? p?.categoria?.nombre : p?.categoria) || '';
const marcaOf = (p: any) => (typeof p?.marca === 'object' ? p?.marca?.nombre : p?.marca) || '';

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

export function HoodieProductoDetalleView({
  tienda,
  slug,
  producto,
  related = [],
  allCategories = [],
  cp,
  carrito,
  setCarrito,
  mostrarCarrito,
  setMostrarCarrito,
  actualizarCantidad,
  onNavigate,
  onAddToCart,
}: {
  tienda: any;
  slug: string;
  producto: any;
  related?: any[];
  allCategories?: any[];
  cp?: string;
  carrito: any[];
  setCarrito?: (items: any[]) => void;
  mostrarCarrito: boolean;
  setMostrarCarrito: (value: boolean) => void;
  actualizarCantidad: (productoId: number | string, cantidad: number) => void;
  onNavigate?: (page: 'home' | 'catalogo' | 'producto' | 'checkout') => void;
  onAddToCart?: (producto: any) => void;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const previewPlantillaId = searchParams.get('previewPlantilla');
  const diseno = tienda?.diseno || {};
  const primary = hdPrimary(cp || diseno?.colorPrimario);
  const font = hdFont(diseno);
  const pricing = getProductPricing(producto);

  const name = nameOf(producto);
  const marca = marcaOf(producto);
  const categoria = catOf(producto);
  const stock = Number(producto?.stock ?? 12);
  const outOfStock = stock <= 0;
  const desc = producto?.detalle || producto?.descripcionCorta ||
    'Prenda confeccionada con tela premium de tacto suave. Corte moderno, costuras reforzadas y comodidad pensada para el día a día.';
  const rating = hdRating(producto);
  const stars = Math.max(1, Math.min(5, Math.round(rating)));

  const extraImages = Array.isArray(producto?.imagenesExtra) ? producto.imagenesExtra : [];
  const gallery = [getImg(producto), ...extraImages].filter(Boolean);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState('M');

  const go = (url: string, page?: 'home' | 'catalogo' | 'producto' | 'checkout') => {
    if (onNavigate && page) { onNavigate(page); return; }
    if (previewPlantillaId) { navigate(`${url}?previewPlantilla=${encodeURIComponent(previewPlantillaId)}`); return; }
    navigate(url);
  };

  const add = (n = qty) => {
    const item = { ...producto, ...pricing, precioUnitario: pricing.precioFinal, cantidad: n, talla: size, id: producto.id, productoId: producto.id };
    if (onAddToCart) onAddToCart(item);
    else actualizarCantidad(producto.id, (carrito.find((c) => c.id === producto.id)?.cantidad || 0) + n);
    setMostrarCarrito(true);
  };
  const buyNow = () => { add(qty); go(`/tienda/${slug}/checkout`, 'checkout'); };

  const cartCount = carrito.reduce((s, i) => s + Number(i?.cantidad || 1), 0);
  const relatedFiltered = related.filter((p) => String(p.id) !== String(producto.id)).slice(0, 4);
  const accentOnDark = primary === HD.ink ? HD.taupe : primary;

  return (
    <motion.div initial="hidden" animate="show" variants={hdPage} className="min-h-screen" style={{ backgroundColor: HD.cream, fontFamily: font }}>
      <HdHeader
        tienda={tienda}
        slug={slug}
        cp={primary}
        diseno={diseno}
        carritoSize={cartCount}
        onOpenCart={() => setMostrarCarrito(true)}
        allCategories={allCategories}
        onSearchSubmit={(event, value) => {
          event.preventDefault();
          if (value?.trim()) go(`/tienda/${slug}/catalogo`, 'catalogo');
        }}
      />

      {/* Breadcrumb */}
      <div className="border-b" style={{ borderColor: HD.line, background: `linear-gradient(120% 120% at 85% 0%, ${HD.sand}, ${HD.cream} 62%)` }}>
        <div className="mx-auto max-w-[1240px] px-6 py-6 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">
          <button type="button" onClick={() => go(`/tienda/${slug}`, 'home')} className="hover:text-neutral-900">Inicio</button>
          <span className="mx-2">/</span>
          <button type="button" onClick={() => go(`/tienda/${slug}/catalogo`, 'catalogo')} className="hover:text-neutral-900">Tienda</button>
          <span className="mx-2">/</span>
          <span className="text-neutral-700">{name}</span>
        </div>
      </div>

      <main className="mx-auto max-w-[1240px] px-6 py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Galería */}
          <motion.div variants={hdFade}>
            <div className="relative aspect-square overflow-hidden rounded-[26px] border" style={{ backgroundColor: HD.sand, borderColor: HD.line }}>
              {gallery[activeImage] ? (
                <img src={gallery[activeImage]} alt={name} className="h-full w-full object-cover" />
              ) : (
                <HdProductImage producto={producto} />
              )}
              {pricing.enOferta && (
                <span className="absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white" style={{ backgroundColor: HD.ink }}>
                  -{pricing.porcentajeDescuento}%
                </span>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {gallery.slice(0, 5).map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className="h-20 w-20 overflow-hidden rounded-xl border-2 transition-colors"
                    style={{ backgroundColor: HD.sand, borderColor: i === activeImage ? HD.ink : 'transparent' }}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div variants={hdSection}>
            {marca && <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: HD.taupe }}>{marca}</p>}
            <h1 className="mt-2 text-4xl uppercase leading-[0.95] tracking-[-0.03em] md:text-5xl" style={{ fontFamily: HD.display, fontWeight: 900, color: HD.ink }}>{name}</h1>

            <div className="mt-4 flex items-center gap-3">
              <span style={{ color: accentOnDark }}>{'★'.repeat(stars)}<span className="text-neutral-300">{'★'.repeat(5 - stars)}</span></span>
              <span className="text-sm text-neutral-400">{rating.toFixed(1)} · {categoria || 'Ropa'}</span>
            </div>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-4xl font-bold" style={{ fontFamily: HD.display, color: HD.ink }}>{money(pricing.precioFinal)}</span>
              {pricing.enOferta && <span className="text-lg font-medium text-neutral-400 line-through">{money(pricing.precioRegular)}</span>}
            </div>

            <p className="mt-6 max-w-lg text-sm leading-relaxed text-neutral-600">{desc}</p>

            {/* Tallas */}
            <div className="mt-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">Talla</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className="flex h-11 w-11 items-center justify-center rounded-full border text-sm font-bold transition-colors"
                    style={size === s ? { backgroundColor: HD.ink, color: '#fff', borderColor: HD.ink } : { backgroundColor: '#fff', color: HD.ink, borderColor: HD.line }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 text-sm">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${outOfStock ? 'bg-neutral-100 text-neutral-500' : 'text-white'}`} style={outOfStock ? undefined : { backgroundColor: HD.ink }}>
                <Icon icon={outOfStock ? 'solar:close-circle-bold' : 'solar:check-circle-bold'} width={14} />
                {outOfStock ? 'Agotado' : 'Disponible'}
              </span>
            </div>

            {/* Acciones */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="inline-flex h-[52px] items-center rounded-full border bg-white" style={{ borderColor: HD.line }}>
                <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-[52px] w-12 place-items-center text-lg text-neutral-500 hover:text-neutral-900">−</button>
                <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                <button type="button" onClick={() => setQty(qty + 1)} className="grid h-[52px] w-12 place-items-center text-lg text-neutral-500 hover:text-neutral-900">+</button>
              </div>
              <motion.button
                type="button"
                disabled={outOfStock}
                onClick={() => add()}
                whileHover={outOfStock ? undefined : { scale: 1.02, y: -2 }}
                whileTap={outOfStock ? undefined : hdTap}
                className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full px-6 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: HD.ink }}
              >
                <Icon icon="solar:bag-4-linear" width={17} /> Añadir al carrito
              </motion.button>
            </div>
            <motion.button
              type="button"
              disabled={outOfStock}
              onClick={buyNow}
              whileHover={outOfStock ? undefined : { y: -2 }}
              whileTap={outOfStock ? undefined : hdTap}
              className="mt-3 w-full rounded-full border py-4 text-xs font-bold uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderColor: HD.ink, color: HD.ink }}
            >
              Comprar ahora
            </motion.button>

            {/* Beneficios */}
            <div className="mt-8 grid gap-4 border-t pt-8 sm:grid-cols-3" style={{ borderColor: HD.line }}>
              {[
                ['solar:medal-ribbon-star-linear', 'Calidad premium'],
                ['solar:refresh-square-linear', 'Cambios fáciles'],
                ['solar:box-minimalistic-linear', 'Envío a domicilio'],
              ].map(([icon, text]) => (
                <div key={text} className="flex items-center gap-2.5 text-xs text-neutral-600">
                  <Icon icon={icon} width={20} style={{ color: HD.ink }} />
                  {text}
                </div>
              ))}
            </div>

            {/* Compartir */}
            <div className="mt-8 flex items-center gap-3 border-t pt-6" style={{ borderColor: HD.line }}>
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">Compartir</span>
              {['mdi:whatsapp', 'mdi:facebook', 'mdi:instagram'].map((ic) => (
                <a key={ic} href={ic === 'mdi:whatsapp' ? waLink(tienda, `Hola, me interesa: ${name}`) : '#'} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-full border text-neutral-500 transition-colors hover:text-neutral-900" style={{ borderColor: HD.line, backgroundColor: withAlpha(primary, '0d') }}>
                  <Icon icon={ic} width={17} />
                </a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Descripción larga */}
        <motion.section initial="hidden" whileInView="show" viewport={hdViewport} variants={hdSection} className="mt-14 rounded-[22px] border p-8 md:p-10" style={{ backgroundColor: HD.panel, borderColor: HD.line }}>
          <h2 className="text-2xl uppercase tracking-[-0.01em]" style={{ fontFamily: HD.display, fontWeight: 900, color: HD.ink }}>Sobre esta prenda</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-600">{producto?.descripcionLarga ? String(producto.descripcionLarga).replace(/<[^>]+>/g, ' ') : desc}</p>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <p><span className="font-bold" style={{ color: HD.ink }}>Categoría:</span> <span className="text-neutral-500">{categoria || '—'}</span></p>
            <p><span className="font-bold" style={{ color: HD.ink }}>Marca:</span> <span className="text-neutral-500">{marca || '—'}</span></p>
            <p><span className="font-bold" style={{ color: HD.ink }}>SKU:</span> <span className="text-neutral-500">{producto?.codigo || producto?.sku || '—'}</span></p>
            <p><span className="font-bold" style={{ color: HD.ink }}>Disponibilidad:</span> <span className="text-neutral-500">{outOfStock ? 'Agotado' : `${stock} unidades`}</span></p>
          </div>
        </motion.section>

        {/* Relacionados */}
        {relatedFiltered.length > 0 && (
          <motion.section initial="hidden" whileInView="show" viewport={hdViewport} variants={hdSection} className="mt-16">
            <div className="mb-8 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: HD.taupe }}>Descubre más</p>
              <h2 className="mt-2 text-3xl uppercase tracking-[-0.02em]" style={{ fontFamily: HD.display, fontWeight: 900, color: HD.ink }}>También te encantará</h2>
            </div>
            <motion.div variants={hdStagger} className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {relatedFiltered.map((p) => (
                <HdProductCard key={p.id} producto={p} slug={slug} cp={primary} onAddToCart={onAddToCart || ((prod) => actualizarCantidad(prod.id, 1))} onClick={() => go(`/tienda/${slug}/producto/${p.id}`, 'producto')} />
              ))}
            </motion.div>
          </motion.section>
        )}
      </main>

      <HdFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <HdWhatsAppFab tienda={tienda} />

      {setCarrito && (
        <HdCartModal
          isOpen={mostrarCarrito}
          onClose={() => setMostrarCarrito(false)}
          carrito={carrito}
          setCarrito={setCarrito}
          actualizarCantidad={actualizarCantidad}
          onCheckout={() => go(`/tienda/${slug}/checkout`, 'checkout')}
          cp={primary}
          tienda={tienda}
        />
      )}
    </motion.div>
  );
}

/* ─────────────── Wrapper que hace fetch (tienda real) ─────────────── */
export default function HoodieProductoDetalle() {
  const { slug = '', id = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const previewPlantillaId = searchParams.get('previewPlantilla');
  const [tienda, setTienda] = useState<any>(null);
  const [producto, setProducto] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    try { const saved = localStorage.getItem(`tienda:${slug}:carrito`); if (saved) setCarrito(JSON.parse(saved)); } catch {}
    return onTiendaCartCleared(slug, () => { setCarrito([]); setMostrarCarrito(false); });
  }, [slug]);

  useEffect(() => {
    if (slug) localStorage.setItem(`tienda:${slug}:carrito`, JSON.stringify(carrito));
  }, [carrito, slug]);

  useEffect(() => {
    if (!slug || !id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [storeRes, catRes, productRes] = await Promise.all([
          axios.get(`${BASE_URL}/public/store/${slug}`),
          axios.get(`${BASE_URL}/public/store/${slug}/categories`),
          axios.get(`${BASE_URL}/public/store/${slug}/products/${id}`),
        ]);
        const store = storeRes.data.data || storeRes.data;
        const product = withPricing(productRes.data.data || productRes.data);
        setTienda(store);
        setAllCategories(Array.isArray(catRes.data?.data) ? catRes.data.data : []);
        setProducto(product);
        const category = catOf(product);
        if (category) {
          const relatedRes = await axios.get(`${BASE_URL}/public/store/${slug}/products`, { params: { category, limit: 6 } });
          const arr = Array.isArray(relatedRes.data?.data?.data) ? relatedRes.data.data.data : Array.isArray(relatedRes.data?.data) ? relatedRes.data.data : [];
          setRelated(withPricingList(arr.filter((item: any) => Number(item.id) !== Number(id)).slice(0, 4)));
        }
      } catch {
        navigate(`/tienda/${slug}${previewPlantillaId ? `?previewPlantilla=${encodeURIComponent(previewPlantillaId)}` : ''}`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, id, navigate, previewPlantillaId]);

  const actualizarCantidad = (productoId: number | string, cantidad: number) => {
    setCarrito((current) => {
      const exists = current.some((item) => item.id === productoId || item.productoId === productoId);
      if (cantidad <= 0) return current.filter((item) => item.id !== productoId && item.productoId !== productoId);
      if (exists) return current.map((item) => (item.id === productoId || item.productoId === productoId) ? { ...item, cantidad } : item);
      if (producto) {
        const pr = getProductPricing(producto);
        return [...current, { ...producto, ...pr, precioUnitario: pr.precioFinal, cantidad, id: producto.id, productoId: producto.id }];
      }
      return current;
    });
  };

  const memoStore = useMemo(() => tienda || {}, [tienda]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-white"><Icon icon="eos-icons:loading" className="h-12 w-12 animate-spin text-gray-300" /></div>;
  if (!producto) return null;

  return (
    <HoodieProductoDetalleView
      tienda={memoStore}
      slug={slug}
      producto={producto}
      related={related}
      allCategories={allCategories}
      carrito={carrito}
      setCarrito={setCarrito}
      mostrarCarrito={mostrarCarrito}
      setMostrarCarrito={setMostrarCarrito}
      actualizarCantidad={actualizarCantidad}
    />
  );
}
