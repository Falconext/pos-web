import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { getProductPricing, withPricing, withPricingList } from '@/templates/shared/pricing';
import { onTiendaCartCleared } from '@/utils/tiendaCart';
import { MOTO, MotoCartModal, MotoFooter, MotoHeader, MotoProductCard, MotoProductImage, MotoWhatsAppFab, money, motoFont, motoPrimary, waLink, withAlpha } from '@/templates/motos/MotosParts';
import { motoCard, motoFade, motoPage, motoSection, motoStagger, motoTap, motoViewport } from '@/templates/motos/motion';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

const getImg = (p: any) => p?.imagenUrl || p?.imagen || '';
const nameOf = (p: any) => p?.descripcion || p?.nombre || 'Producto';
const catOf = (p: any) => (typeof p?.categoria === 'object' ? p?.categoria?.nombre : p?.categoria) || '';
const marcaOf = (p: any) => (typeof p?.marca === 'object' ? p?.marca?.nombre : p?.marca) || '';

export function MotosProductoDetalleView({
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
  const primary = motoPrimary(cp || diseno?.colorPrimario);
  const font = motoFont(diseno);
  const pricing = getProductPricing(producto);

  const name = nameOf(producto);
  const marca = marcaOf(producto);
  const categoria = catOf(producto);
  const stock = Number(producto?.stock ?? 6);
  const outOfStock = stock <= 0;
  const desc = producto?.detalle || producto?.descripcionCorta ||
    'Una moto pensada para el día a día: torque instantáneo, autonomía real y mantenimiento mínimo. Entrega lista para rodar, con garantía oficial y respaldo de taller propio.';
  const ratingAvg = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const stars = Math.max(1, Math.min(5, Math.round(ratingAvg || 5)));

  const seed = Number(producto?.id || 0);
  const specs = [
    { icon: 'solar:battery-charge-linear', label: 'Autonomía', value: `${60 + (seed % 9) * 10} km` },
    { icon: 'solar:bolt-linear', label: 'Potencia', value: `${3 + (seed % 5)} kW` },
    { icon: 'solar:speedometer-max-linear', label: 'Velocidad máx.', value: `${70 + (seed % 6) * 10} km/h` },
    { icon: 'solar:clock-circle-linear', label: 'Carga', value: `${3 + (seed % 4)} h` },
  ];

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
    <motion.div initial="hidden" animate="show" variants={motoPage} className="min-h-screen" style={{ backgroundColor: MOTO.page, fontFamily: font }}>
      <MotoHeader
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
      <div className="border-b" style={{ borderColor: MOTO.line, backgroundColor: MOTO.card }}>
        <div className="mx-auto max-w-7xl px-6 py-6 text-xs font-medium uppercase tracking-[0.16em]" style={{ color: MOTO.faint }}>
          <button type="button" onClick={() => go(`/tienda/${slug}`, 'home')} className="hover:text-neutral-900">Inicio</button>
          <span className="mx-2">/</span>
          <button type="button" onClick={() => go(`/tienda/${slug}/catalogo`, 'catalogo')} className="hover:text-neutral-900">Catálogo</button>
          <span className="mx-2">/</span>
          <span style={{ color: MOTO.muted }}>{name}</span>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          {/* Galería — imagen completa sobre fondo de estudio */}
          <motion.div variants={motoFade}>
            <div className="group relative overflow-hidden rounded-3xl border" style={{ borderColor: MOTO.line, background: `radial-gradient(120% 120% at 50% 0%, ${withAlpha(primary, '14')} 0%, ${MOTO.card} 55%)` }}>
              {marca && (
                <span className="absolute left-5 top-5 z-10 rounded-full border bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur" style={{ borderColor: MOTO.line, color: MOTO.ink }}>{marca}</span>
              )}
              {pricing.enOferta && (
                <span className="absolute right-5 top-5 z-10 rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-sm" style={{ backgroundColor: MOTO.sale }}>
                  Oferta -{pricing.porcentajeDescuento}%
                </span>
              )}
              <div className="flex aspect-[4/3] w-full items-center justify-center p-8 md:p-12">
                {gallery[activeImage] ? (
                  <img src={gallery[activeImage]} alt={name} className="max-h-full max-w-full object-contain drop-shadow-[0_24px_40px_rgba(15,18,26,0.18)] transition-transform duration-[800ms] ease-out group-hover:scale-[1.05]" />
                ) : (
                  <MotoProductImage producto={producto} imgClassName="!object-contain" />
                )}
              </div>
            </div>
            {gallery.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {gallery.slice(0, 6).map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border-2 p-2 transition-colors"
                    style={{ background: 'linear-gradient(180deg, #FFFFFF, #F1F3F6)', borderColor: i === activeImage ? primary : MOTO.line }}
                  >
                    <img src={src} alt="" className="max-h-full max-w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info — tarjeta sticky */}
          <motion.div variants={motoSection} className="h-fit lg:sticky lg:top-28">
            <div className="rounded-3xl border p-7 shadow-[0_1px_2px_rgba(15,18,26,0.04)] md:p-8" style={{ backgroundColor: MOTO.card, borderColor: MOTO.line }}>
              {marca && <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: primary }}>{marca}</p>}
              <h1 className="mt-2 text-3xl font-extrabold uppercase leading-[1.02] tracking-[-0.01em] md:text-4xl" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>{name}</h1>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-base leading-none" style={{ color: primary }}>{'★'.repeat(stars)}<span style={{ color: MOTO.raise }}>{'★'.repeat(5 - stars)}</span></span>
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold" style={{ backgroundColor: MOTO.soft, color: MOTO.body }}>
                  <Icon icon="solar:tag-linear" width={13} /> {categoria || 'Motos'}
                </span>
              </div>

              <div className="mt-6 flex items-end justify-between gap-3 rounded-2xl p-5" style={{ backgroundColor: MOTO.soft }}>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: MOTO.faint }}>Desde</span>
                  <span className="text-4xl font-extrabold" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>{money(pricing.precioFinal)}</span>
                </div>
                <div className="flex flex-col items-end">
                  {pricing.enOferta && <span className="text-sm font-medium line-through" style={{ color: MOTO.faint }}>{money(pricing.precioRegular)}</span>}
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: outOfStock ? MOTO.faint : '#16A34A' }}>
                    <Icon icon={outOfStock ? 'solar:close-circle-bold' : 'solar:check-circle-bold'} width={14} />
                    {outOfStock ? 'Agotado' : 'En stock'}
                  </span>
                </div>
              </div>

              <p className="mt-5 text-sm leading-relaxed" style={{ color: MOTO.body }}>{desc}</p>

              {/* Acciones */}
              <div className="mt-6 flex items-center gap-3">
                <div className="inline-flex h-[52px] items-center rounded-lg border" style={{ borderColor: MOTO.line, backgroundColor: MOTO.soft }}>
                  <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-[52px] w-11 place-items-center text-lg" style={{ color: MOTO.muted }}>−</button>
                  <span className="w-8 text-center text-sm font-semibold" style={{ color: MOTO.ink }}>{qty}</span>
                  <button type="button" onClick={() => setQty(qty + 1)} className="grid h-[52px] w-11 place-items-center text-lg" style={{ color: MOTO.muted }}>+</button>
                </div>
                <motion.button
                  type="button"
                  disabled={outOfStock}
                  onClick={() => add()}
                  whileHover={outOfStock ? undefined : { scale: 1.02, y: -2 }}
                  whileTap={outOfStock ? undefined : motoTap}
                  className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-lg px-6 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: primary }}
                >
                  <Icon icon="solar:cart-plus-linear" width={17} /> Añadir al carrito
                </motion.button>
              </div>
              <motion.button
                type="button"
                disabled={outOfStock}
                onClick={buyNow}
                whileHover={outOfStock ? undefined : { y: -2 }}
                whileTap={outOfStock ? undefined : motoTap}
                className="mt-3 w-full rounded-lg py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: MOTO.ink }}
              >
                Comprar ahora
              </motion.button>

              {/* Beneficios */}
              <div className="mt-7 grid gap-3 border-t pt-6 sm:grid-cols-3" style={{ borderColor: MOTO.line }}>
                {[
                  ['solar:shield-check-linear', 'Garantía oficial'],
                  ['solar:wrench-linear', 'Taller propio'],
                  ['solar:box-minimalistic-linear', 'Entrega nacional'],
                ].map(([icon, text]) => (
                  <div key={text} className="flex items-center gap-2 text-xs" style={{ color: MOTO.body }}>
                    <Icon icon={icon} width={18} style={{ color: primary }} />
                    {text}
                  </div>
                ))}
              </div>

              {/* Financiamiento + compartir */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-6" style={{ borderColor: MOTO.line }}>
                <span className="inline-flex items-center gap-2 text-xs font-semibold" style={{ color: MOTO.body }}>
                  <Icon icon="solar:card-linear" width={16} style={{ color: primary }} /> Financiamiento disponible
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: MOTO.faint }}>Compartir</span>
                  {['mdi:whatsapp', 'mdi:facebook', 'mdi:instagram'].map((ic) => (
                    <a key={ic} href={ic === 'mdi:whatsapp' ? waLink(tienda, `Hola, me interesa: ${name}`) : '#'} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-lg border transition-colors hover:bg-black/[0.03]" style={{ borderColor: MOTO.line, color: MOTO.muted }}>
                      <Icon icon={ic} width={17} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Ficha técnica */}
        <motion.section initial="hidden" whileInView="show" viewport={motoViewport} variants={motoSection} className="mt-12 md:mt-16">
          <div className="mb-6 flex items-center gap-2.5">
            <span className="h-px w-6" style={{ backgroundColor: primary }} />
            <h2 className="text-2xl font-extrabold uppercase tracking-[0.02em]" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>Ficha técnica</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {specs.map((s) => (
              <div key={s.label} className="rounded-2xl border p-5 text-center shadow-[0_1px_2px_rgba(15,18,26,0.04)]" style={{ backgroundColor: MOTO.card, borderColor: MOTO.line }}>
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg" style={{ backgroundColor: withAlpha(primary, '14'), color: primary }}>
                  <Icon icon={s.icon} width={22} />
                </span>
                <p className="mt-3 text-lg font-extrabold" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>{s.value}</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: MOTO.faint }}>{s.label}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Descripción larga */}
        <motion.section initial="hidden" whileInView="show" viewport={motoViewport} variants={motoSection} className="mt-8 rounded-3xl border p-8 shadow-[0_1px_2px_rgba(15,18,26,0.04)] md:p-10" style={{ backgroundColor: MOTO.card, borderColor: MOTO.line }}>
          <h2 className="text-2xl font-extrabold uppercase tracking-[0.02em]" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>Sobre esta moto</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7" style={{ color: MOTO.body }}>{producto?.descripcionLarga ? String(producto.descripcionLarga).replace(/<[^>]+>/g, ' ') : desc}</p>
          <div className="mt-6 grid gap-3 border-t pt-6 text-sm sm:grid-cols-2" style={{ borderColor: MOTO.line }}>
            <p><span className="font-semibold" style={{ color: MOTO.ink }}>Categoría:</span> <span style={{ color: MOTO.muted }}>{categoria || '—'}</span></p>
            <p><span className="font-semibold" style={{ color: MOTO.ink }}>Marca:</span> <span style={{ color: MOTO.muted }}>{marca || '—'}</span></p>
            <p><span className="font-semibold" style={{ color: MOTO.ink }}>SKU:</span> <span style={{ color: MOTO.muted }}>{producto?.codigo || producto?.sku || '—'}</span></p>
            <p><span className="font-semibold" style={{ color: MOTO.ink }}>Disponibilidad:</span> <span style={{ color: MOTO.muted }}>{outOfStock ? 'Agotado' : `${stock} unidades`}</span></p>
          </div>
        </motion.section>

        {/* Relacionados */}
        {relatedFiltered.length > 0 && (
          <motion.section initial="hidden" whileInView="show" viewport={motoViewport} variants={motoSection} className="mt-16">
            <div className="mb-8 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: primary }}>Descubre más</p>
              <h2 className="mt-2 text-3xl font-extrabold uppercase tracking-[0.02em]" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>También te puede interesar</h2>
            </div>
            <motion.div variants={motoStagger} className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
              {relatedFiltered.map((p) => (
                <MotoProductCard key={p.id} producto={p} slug={slug} cp={primary} onAddToCart={onAddToCart || ((prod) => actualizarCantidad(prod.id, 1))} onClick={() => go(`/tienda/${slug}/producto/${p.id}`, 'producto')} />
              ))}
            </motion.div>
          </motion.section>
        )}
      </main>

      <MotoFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <MotoWhatsAppFab tienda={tienda} />

      {setCarrito && (
        <MotoCartModal
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
export default function MotosProductoDetalle() {
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

  if (loading) return <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: MOTO.page }}><Icon icon="eos-icons:loading" className="h-12 w-12 animate-spin" style={{ color: MOTO.faint }} /></div>;
  if (!producto) return null;

  return (
    <MotosProductoDetalleView
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
