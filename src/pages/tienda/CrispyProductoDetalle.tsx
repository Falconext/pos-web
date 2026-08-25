import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { getProductPricing, withPricing, withPricingList } from '@/templates/shared/pricing';
import { useFavoritosStore } from '@/zustand/favoritos';
import { onTiendaCartCleared } from '@/utils/tiendaCart';
import { FOOD, FoodCartModal, FoodProductCard, FoodProductImage, FoodShell, foodFont, foodPrimary, waLink } from '@/templates/comida-app/CrispyParts';
import { foodPage, foodSection, foodStagger, foodTap, foodViewport } from '@/templates/comida-app/motion';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';
const money = (v: number) => `S/ ${Number(v || 0).toFixed(2)}`;
const getImg = (p: any) => p?.imagenUrl || p?.imagen || '';
const nameOf = (p: any) => p?.descripcion || p?.nombre || 'Producto';
const catOf = (p: any) => (typeof p?.categoria === 'object' ? p?.categoria?.nombre : p?.categoria) || '';

const htmlToText = (html: any): string => {
  let s = String(html || '').replace(/<\/(p|div|li|h[1-6])>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
  if (typeof document !== 'undefined') { const ta = document.createElement('textarea'); ta.innerHTML = s; s = ta.value; }
  else { s = s.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&'); }
  return s.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n').trim();
};

export function CrispyProductoDetalleView({
  tienda, slug, producto, related = [], allCategories = [], cp,
  carrito, setCarrito, mostrarCarrito, setMostrarCarrito, actualizarCantidad, onNavigate, onAddToCart,
}: {
  tienda: any; slug: string; producto: any; related?: any[]; allCategories?: any[]; cp?: string;
  carrito: any[]; setCarrito?: (items: any[]) => void; mostrarCarrito: boolean; setMostrarCarrito: (v: boolean) => void;
  actualizarCantidad: (productoId: number | string, cantidad: number) => void;
  onNavigate?: (page: 'home' | 'catalogo' | 'producto' | 'checkout') => void; onAddToCart?: (producto: any) => void;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const previewPlantillaId = searchParams.get('previewPlantilla');
  const diseno = tienda?.diseno || {};
  const primary = foodPrimary(cp || diseno?.colorPrimario);
  const pricing = getProductPricing(producto);
  const { toggleFavorito, isFavorito } = useFavoritosStore();
  const wish = isFavorito(Number(producto?.id), slug);

  const name = nameOf(producto);
  const categoria = catOf(producto);
  const stock = Number(producto?.stock ?? 20);
  const outOfStock = stock <= 0;
  const rating = Number(producto?.ratingAvg || 0) || 4.8;
  const reviews = Number(producto?.ratingCount || 0);
  const desc = producto?.descripcionLarga ? htmlToText(producto.descripcionLarga) : (producto?.detalle || producto?.descripcionCorta || 'Delicioso, recién preparado y listo para disfrutar. Ingredientes frescos y mucho sabor en cada bocado.');
  const [qty, setQty] = useState(1);

  const go = (url: string, page?: 'home' | 'catalogo' | 'producto' | 'checkout') => {
    if (onNavigate && page) { onNavigate(page); return; }
    if (previewPlantillaId) { navigate(`${url}?previewPlantilla=${encodeURIComponent(previewPlantillaId)}`); return; }
    navigate(url);
  };

  const add = (n = qty) => {
    const item = { ...producto, ...pricing, precioUnitario: pricing.precioFinal, cantidad: n, id: producto.id, productoId: producto.id };
    if (onAddToCart) onAddToCart(item);
    else actualizarCantidad(producto.id, (carrito.find((c) => c.id === producto.id)?.cantidad || 0) + n);
    setMostrarCarrito(true);
  };
  const back = () => { if (onNavigate) return onNavigate('catalogo'); if (slug === 'preview') { window.dispatchEvent(new CustomEvent('preview-nav', { detail: 'catalogo' })); return; } window.history.back(); };
  const toggleWish = () => toggleFavorito({ id: Number(producto?.id), descripcion: name, precioUnitario: pricing.precioFinal, imagenUrl: getImg(producto), slug });
  const relatedFiltered = related.filter((p) => String(p.id) !== String(producto.id)).slice(0, 6);

  return (
    <FoodShell slug={slug} active="menu" cp={primary} diseno={diseno} tienda={tienda} carrito={carrito} onOpenCart={() => setMostrarCarrito(true)} categories={allCategories}>
      <motion.div initial="hidden" animate="show" variants={foodPage}>
        <div className="lg:grid lg:grid-cols-2 lg:gap-10 lg:pt-8">
        {/* Imagen grande */}
        <div className="relative lg:self-start">
          <div className="h-72 w-full overflow-hidden rounded-b-[32px] lg:h-[460px] lg:rounded-[28px]" style={{ backgroundColor: FOOD.peach }}>
            <FoodProductImage producto={producto} />
          </div>
          <button type="button" onClick={back} className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-md lg:hidden" style={{ color: FOOD.ink }}><Icon icon="solar:alt-arrow-left-linear" width={20} /></button>
          <button type="button" onClick={toggleWish} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-md"><Icon icon={wish ? 'solar:heart-bold' : 'solar:heart-linear'} width={19} style={{ color: wish ? primary : FOOD.ink }} /></button>
        </div>

        <div className="px-4 pt-4 lg:px-0 lg:pt-0">
          <button type="button" onClick={back} className="mb-3 hidden items-center gap-1.5 text-sm font-bold lg:flex" style={{ color: FOOD.soft }}><Icon icon="solar:alt-arrow-left-linear" width={16} /> Volver al menú</button>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-[22px] font-extrabold leading-tight" style={{ color: FOOD.ink }}>{name}</h1>
            <span className="shrink-0 rounded-full px-3 py-1.5 text-[15px] font-extrabold text-white shadow-md" style={{ backgroundColor: primary }}>{money(pricing.precioFinal)}</span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-[12px] font-bold" style={{ color: FOOD.ink }}>
            <span className="flex items-center gap-1"><Icon icon="solar:star-bold" width={14} style={{ color: FOOD.amber }} /> {rating.toFixed(1)} {reviews > 0 && <span className="font-medium" style={{ color: FOOD.muted }}>({reviews})</span>}</span>
            {categoria && <span className="rounded-full px-2.5 py-1 text-[11px]" style={{ backgroundColor: FOOD.peach, color: FOOD.primary }}>{categoria}</span>}
            <span className="flex items-center gap-1 font-medium" style={{ color: FOOD.muted }}><Icon icon="solar:clock-circle-linear" width={13} /> 20-30 min</span>
          </div>

          {pricing.enOferta && <p className="mt-2 text-[13px] font-semibold text-neutral-400"><span className="line-through">{money(pricing.precioRegular)}</span> <span style={{ color: primary }}>· -{pricing.porcentajeDescuento}%</span></p>}

          <p className="mt-4 whitespace-pre-line text-[14px] leading-relaxed" style={{ color: FOOD.soft }}>{desc}</p>

          {/* Beneficios */}
          <div className="mt-4 flex gap-2">
            {[['mdi:fire', 'Recién hecho'], ['solar:delivery-linear', 'Delivery rápido'], ['mdi:leaf', 'Ingredientes frescos']].map(([ic, t]) => (
              <div key={t} className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-white p-3 text-center shadow-sm">
                <Icon icon={ic} width={20} style={{ color: primary }} />
                <span className="text-[10px] font-bold" style={{ color: FOOD.ink }}>{t}</span>
              </div>
            ))}
          </div>

          {/* Compartir */}
          <div className="mt-5 flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: FOOD.muted }}>Compartir</span>
            {['mdi:whatsapp', 'mdi:facebook', 'mdi:instagram'].map((ic) => (
              <a key={ic} href={ic === 'mdi:whatsapp' ? waLink(tienda, `Hola, quiero pedir: ${name}`) : '#'} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm" style={{ color: FOOD.soft }}><Icon icon={ic} width={16} /></a>
            ))}
          </div>

          {/* Acción inline (desktop) */}
          <div className="mt-6 hidden items-center gap-3 lg:flex">
            <div className="flex items-center gap-2 rounded-2xl px-2 py-2" style={{ backgroundColor: FOOD.cream }}>
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white" style={{ color: FOOD.ink }}><Icon icon="solar:minus-linear" width={16} /></button>
              <span className="w-6 text-center text-sm font-extrabold" style={{ color: FOOD.ink }}>{qty}</span>
              <button type="button" onClick={() => setQty(qty + 1)} className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ backgroundColor: primary }}><Icon icon="solar:add-linear" width={16} /></button>
            </div>
            <motion.button whileTap={foodTap} type="button" disabled={outOfStock} onClick={() => add()} className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-sm font-extrabold text-white shadow-md disabled:opacity-50" style={{ backgroundColor: primary }}>
              {outOfStock ? 'Agotado' : `Agregar · ${money(pricing.precioFinal * qty)}`}
            </motion.button>
          </div>
        </div>
        </div>

        {/* Relacionados */}
        {relatedFiltered.length > 0 && (
          <motion.section variants={foodSection} initial="hidden" whileInView="show" viewport={foodViewport} className="mt-6 px-4">
            <h2 className="mb-3 text-[17px] font-extrabold" style={{ color: FOOD.ink }}>También te puede gustar</h2>
            <motion.div variants={foodStagger} className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
              {relatedFiltered.map((p) => (
                <div key={p.id} className="w-40 shrink-0"><FoodProductCard producto={p} slug={slug} cp={primary} onAddToCart={onAddToCart || ((prod) => actualizarCantidad(prod.id, 1))} onClick={() => go(`/tienda/${slug}/producto/${p.id}`, 'producto')} /></div>
              ))}
            </motion.div>
          </motion.section>
        )}
      </motion.div>

      {/* Barra inferior de acción (cantidad + agregar) — solo móvil */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center pb-[84px] lg:hidden">
        <div className="pointer-events-auto mx-auto flex w-[calc(100%-24px)] max-w-[456px] items-center gap-3 rounded-3xl bg-white p-2.5 shadow-[0_-6px_30px_-10px_rgba(42,33,28,0.3)]">
          <div className="flex items-center gap-2 rounded-2xl px-2 py-1.5" style={{ backgroundColor: FOOD.cream }}>
            <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white" style={{ color: FOOD.ink }}><Icon icon="solar:minus-linear" width={16} /></button>
            <span className="w-5 text-center text-sm font-extrabold" style={{ color: FOOD.ink }}>{qty}</span>
            <button type="button" onClick={() => setQty(qty + 1)} className="flex h-8 w-8 items-center justify-center rounded-xl text-white" style={{ backgroundColor: primary }}><Icon icon="solar:add-linear" width={16} /></button>
          </div>
          <motion.button whileTap={foodTap} type="button" disabled={outOfStock} onClick={() => add()} className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-extrabold text-white shadow-md disabled:opacity-50" style={{ backgroundColor: primary }}>
            {outOfStock ? 'Agotado' : `Agregar · ${money(pricing.precioFinal * qty)}`}
          </motion.button>
        </div>
      </div>

      {setCarrito && (
        <FoodCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => go(`/tienda/${slug}/checkout`, 'checkout')} cp={primary} tienda={tienda} />
      )}
    </FoodShell>
  );
}

/* ─────────────── Wrapper que hace fetch (tienda real) ─────────────── */
export default function CrispyProductoDetalle() {
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

  useEffect(() => { if (slug) localStorage.setItem(`tienda:${slug}:carrito`, JSON.stringify(carrito)); }, [carrito, slug]);

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
          const relatedRes = await axios.get(`${BASE_URL}/public/store/${slug}/products`, { params: { category, limit: 8 } });
          const arr = Array.isArray(relatedRes.data?.data?.data) ? relatedRes.data.data.data : Array.isArray(relatedRes.data?.data) ? relatedRes.data.data : [];
          setRelated(withPricingList(arr.filter((item: any) => Number(item.id) !== Number(id)).slice(0, 6)));
        }
      } catch {
        navigate(`/tienda/${slug}${previewPlantillaId ? `?previewPlantilla=${encodeURIComponent(previewPlantillaId)}` : ''}`);
      } finally { setLoading(false); }
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
  if (loading) return <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#FBF1E6' }}><Icon icon="eos-icons:loading" className="h-12 w-12 animate-spin" style={{ color: '#E8542A' }} /></div>;
  if (!producto) return null;

  return (
    <CrispyProductoDetalleView
      tienda={memoStore} slug={slug} producto={producto} related={related} allCategories={allCategories}
      carrito={carrito} setCarrito={setCarrito} mostrarCarrito={mostrarCarrito} setMostrarCarrito={setMostrarCarrito} actualizarCantidad={actualizarCantidad}
    />
  );
}
