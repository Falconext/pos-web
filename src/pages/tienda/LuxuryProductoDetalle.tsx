import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { getProductPricing, withPricing, withPricingList } from '@/templates/shared/pricing';
import { onTiendaCartCleared } from '@/utils/tiendaCart';
import TecnologiaCartModal from '@/components/tienda/TecnologiaCartModal';
import { LUX, LuxuryFooter, LuxuryHeader, LuxuryProductCard, LuxuryProductImage, luxFont, luxPrimary, withAlpha } from '@/templates/luxury/LuxuryParts';
import { luxCard, luxFade, luxPage, luxSection, luxStagger, luxTap, luxViewport } from '@/templates/luxury/motion';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

const money = (v: number) => `S/ ${Number(v || 0).toFixed(2)}`;
const getImg = (p: any) => p?.imagenUrl || p?.imagen || '';
const nameOf = (p: any) => p?.descripcion || p?.nombre || 'Perfume';
const catOf = (p: any) => (typeof p?.categoria === 'object' ? p?.categoria?.nombre : p?.categoria) || '';
const marcaOf = (p: any) => (typeof p?.marca === 'object' ? p?.marca?.nombre : p?.marca) || '';

export function LuxuryProductoDetalleView({
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
  const primary = luxPrimary(cp || diseno?.colorPrimario);
  const font = luxFont(diseno);
  const pricing = getProductPricing(producto);

  const name = nameOf(producto);
  const marca = marcaOf(producto);
  const categoria = catOf(producto);
  const stock = Number(producto?.stock ?? 12);
  const outOfStock = stock <= 0;
  const desc = producto?.detalle || producto?.descripcionCorta ||
    'Una fragancia de autor que envuelve la piel con carácter y elegancia. Notas cuidadosamente seleccionadas para dejar una estela memorable, de día y de noche.';
  const ratingAvg = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const stars = Math.max(1, Math.min(5, Math.round(ratingAvg || 5)));

  const extraImages = Array.isArray(producto?.imagenesExtra) ? producto.imagenesExtra : [];
  const gallery = [getImg(producto), ...extraImages].filter(Boolean);
  const [activeImage, setActiveImage] = useState(0);
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
  const buyNow = () => { add(qty); go(`/tienda/${slug}/checkout`, 'checkout'); };

  const cartCount = carrito.reduce((s, i) => s + Number(i?.cantidad || 1), 0);
  const relatedFiltered = related.filter((p) => String(p.id) !== String(producto.id)).slice(0, 4);

  return (
    <motion.div initial="hidden" animate="show" variants={luxPage} className="min-h-screen" style={{ backgroundColor: LUX.porcelain, fontFamily: font }}>
      <LuxuryHeader
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
      <div className="border-b border-black/[0.06]" style={{ background: `radial-gradient(120% 120% at 85% 0%, ${primary}18, ${LUX.porcelain} 60%)` }}>
        <div className="mx-auto max-w-7xl px-6 py-6 text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
          <button type="button" onClick={() => go(`/tienda/${slug}`, 'home')} className="hover:text-neutral-900">Inicio</button>
          <span className="mx-2">/</span>
          <button type="button" onClick={() => go(`/tienda/${slug}/catalogo`, 'catalogo')} className="hover:text-neutral-900">Colección</button>
          <span className="mx-2">/</span>
          <span className="text-neutral-700">{name}</span>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Galería */}
          <motion.div variants={luxFade}>
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-black/[0.06] bg-[#F6F2FB]">
              {gallery[activeImage] ? (
                <img src={gallery[activeImage]} alt={name} className="h-full w-full object-cover" />
              ) : (
                <LuxuryProductImage producto={producto} />
              )}
              {pricing.enOferta && (
                <span className="absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white" style={{ backgroundColor: LUX.ink }}>
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
                    className="h-20 w-20 overflow-hidden rounded-xl border-2 bg-[#F6F2FB] transition-colors"
                    style={{ borderColor: i === activeImage ? primary : 'transparent' }}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div variants={luxSection}>
            {marca && <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: LUX.gold }}>{marca}</p>}
            <h1 className="mt-2 text-4xl leading-tight text-neutral-900 md:text-5xl" style={{ fontFamily: LUX.serif }}>{name}</h1>

            <div className="mt-4 flex items-center gap-3">
              <span style={{ color: LUX.gold }}>{'★'.repeat(stars)}<span className="text-neutral-300">{'★'.repeat(5 - stars)}</span></span>
              <span className="text-sm text-neutral-400">{categoria || 'Fragancia'}</span>
            </div>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-4xl font-semibold text-neutral-900" style={{ fontFamily: LUX.serif }}>{money(pricing.precioFinal)}</span>
              {pricing.enOferta && <span className="text-lg font-medium text-neutral-400 line-through">{money(pricing.precioRegular)}</span>}
            </div>

            <p className="mt-6 max-w-lg text-sm leading-relaxed text-neutral-600">{desc}</p>

            {/* Disponibilidad */}
            <div className="mt-6 flex items-center gap-2 text-sm">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${outOfStock ? 'bg-neutral-100 text-neutral-500' : 'text-white'}`} style={outOfStock ? undefined : { backgroundColor: primary }}>
                <Icon icon={outOfStock ? 'solar:close-circle-bold' : 'solar:check-circle-bold'} width={14} />
                {outOfStock ? 'Agotado' : 'Disponible'}
              </span>
            </div>

            {/* Acciones */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="inline-flex h-13 items-center rounded-full border border-neutral-200 bg-white">
                <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-13 w-12 place-items-center text-lg text-neutral-500 hover:text-neutral-900">−</button>
                <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                <button type="button" onClick={() => setQty(qty + 1)} className="grid h-13 w-12 place-items-center text-lg text-neutral-500 hover:text-neutral-900">+</button>
              </div>
              <motion.button
                type="button"
                disabled={outOfStock}
                onClick={() => add()}
                whileHover={outOfStock ? undefined : { scale: 1.02, y: -2 }}
                whileTap={outOfStock ? undefined : luxTap}
                className="flex h-13 flex-1 items-center justify-center gap-2 rounded-full px-6 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: primary }}
              >
                <Icon icon="solar:bag-4-linear" width={17} /> Añadir al carrito
              </motion.button>
            </div>
            <motion.button
              type="button"
              disabled={outOfStock}
              onClick={buyNow}
              whileHover={outOfStock ? undefined : { y: -2 }}
              whileTap={outOfStock ? undefined : luxTap}
              className="mt-3 w-full rounded-full border py-4 text-xs font-semibold uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderColor: LUX.ink, color: LUX.ink }}
            >
              Comprar ahora
            </motion.button>

            {/* Beneficios */}
            <div className="mt-8 grid gap-4 border-t border-black/[0.06] pt-8 sm:grid-cols-3">
              {[
                ['solar:verified-check-linear', 'Original y sellado'],
                ['solar:gift-linear', 'Envoltura de regalo'],
                ['solar:box-minimalistic-linear', 'Envío discreto'],
              ].map(([icon, text]) => (
                <div key={text} className="flex items-center gap-2.5 text-xs text-neutral-600">
                  <Icon icon={icon} width={20} style={{ color: primary }} />
                  {text}
                </div>
              ))}
            </div>

            {/* Compartir */}
            <div className="mt-8 flex items-center gap-3 border-t border-black/[0.06] pt-6">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Compartir</span>
              {['mdi:whatsapp', 'mdi:facebook', 'mdi:instagram'].map((ic) => (
                <span key={ic} className="grid h-9 w-9 place-items-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:text-neutral-900" style={{ backgroundColor: withAlpha(primary, '0d') }}>
                  <Icon icon={ic} width={17} />
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Descripción larga */}
        <motion.section initial="hidden" whileInView="show" viewport={luxViewport} variants={luxSection} className="mt-14 rounded-2xl border border-black/[0.06] bg-white p-8 md:p-10">
          <h2 className="text-2xl text-neutral-900" style={{ fontFamily: LUX.serif }}>Sobre esta fragancia</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-600">{producto?.descripcionLarga ? String(producto.descripcionLarga).replace(/<[^>]+>/g, ' ') : desc}</p>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <p><span className="font-semibold text-neutral-900">Categoría:</span> <span className="text-neutral-500">{categoria || '—'}</span></p>
            <p><span className="font-semibold text-neutral-900">Marca:</span> <span className="text-neutral-500">{marca || '—'}</span></p>
            <p><span className="font-semibold text-neutral-900">SKU:</span> <span className="text-neutral-500">{producto?.codigo || producto?.sku || '—'}</span></p>
            <p><span className="font-semibold text-neutral-900">Disponibilidad:</span> <span className="text-neutral-500">{outOfStock ? 'Agotado' : `${stock} unidades`}</span></p>
          </div>
        </motion.section>

        {/* Relacionados */}
        {relatedFiltered.length > 0 && (
          <motion.section initial="hidden" whileInView="show" viewport={luxViewport} variants={luxSection} className="mt-16">
            <div className="mb-8 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em]" style={{ color: LUX.gold }}>Descubre más</p>
              <h2 className="mt-2 text-3xl text-neutral-900" style={{ fontFamily: LUX.serif }}>También te encantará</h2>
            </div>
            <motion.div variants={luxStagger} className="grid gap-6 grid-cols-2 lg:grid-cols-4">
              {relatedFiltered.map((p) => (
                <LuxuryProductCard key={p.id} producto={p} slug={slug} cp={primary} onAddToCart={onAddToCart || ((prod) => actualizarCantidad(prod.id, 1))} onClick={() => go(`/tienda/${slug}/producto/${p.id}`, 'producto')} />
              ))}
            </motion.div>
          </motion.section>
        )}
      </main>

      <LuxuryFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />

      {setCarrito && (
        <TecnologiaCartModal
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
export default function LuxuryProductoDetalle() {
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
    <LuxuryProductoDetalleView
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
