import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { obtenerTiendaPublica } from '@/lib/tiendaPublica';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { onTiendaCartCleared } from '@/utils/tiendaCart';
import { getProductPricing, withPricing, withPricingList } from '@/templates/shared/pricing';
import { recordarVentaSinStock, sinStock, pocasUnidades } from '@/templates/shared/ventaSinStock';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import TiendaFloatingButtons from '@/components/tienda/TiendaFloatingButtons';
import ProductCardActions from '@/components/tienda/ProductCardActions';
import ProductoVideo from '@/components/tienda/ProductoVideo';
import {
  getFashionColors, getFashionColorGallery, getDefaultVariantSelection, findFashionVariant,
  isFashionVariantAvailable, getVariantOptionNames,
} from '@/templates/urbano/fashionVariants';
import {
  VerenaHeader, VerenaFooter, VerenaCartModal, Stars,
  verenaTheme, useVerenaFont, ed, vrMoney, nameOf, type Theme,
} from '@/templates/carteras-market/VerenaParts';
import { ProductRail, OfferCountdown, buildBenefits, soonestOfferEnd, storeChannels, getName, type Channels } from '@/templates/carteras-market/VerenaSections';
import { mix, vrEase, vrHeroText, vrStagger } from '@/templates/carteras-market/motion';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';
const optionsOf = (p: any): { nombre: string; valores: string[] }[] => (Array.isArray(p?.opcionesAtributos) ? p.opcionesAtributos : []);

/** Convierte el HTML del editor en texto legible (sin etiquetas ni entidades). */
const htmlToText = (html: any): string => {
  let s = String(html || '').replace(/<\/(p|div|li|h[1-6])>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
  if (typeof document !== 'undefined') { const ta = document.createElement('textarea'); ta.innerHTML = s; s = ta.value; }
  return s.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n').trim();
};

export function VerenaProductoDetalleView({ tienda, slug, producto, related = [], allCategories = [], carrito, setCarrito, mostrarCarrito, setMostrarCarrito, actualizarCantidad, onNavigate, onAddToCart }: any) {
  useVerenaFont();
  const navigate = useNavigate();
  const diseno = tienda?.diseno || {};
  const t = verenaTheme(diseno);
  const ch = storeChannels(tienda, diseno);
  const pricing = getProductPricing(producto);
  const [showFav, setShowFav] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);

  // ── Variantes reales (color / material / medida) ──
  const options = optionsOf(producto);
  const hasVariants = options.length > 0 && Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const colorName = getVariantOptionNames(producto).color;
  const colors = useMemo(() => getFashionColors(producto), [producto]);
  const [selection, setSelection] = useState<Record<string, string>>(() => getDefaultVariantSelection(producto));
  const [qty, setQty] = useState(1);
  const [hint, setHint] = useState(false);
  useEffect(() => { setSelection(getDefaultVariantSelection(producto)); setQty(1); setHint(false); }, [producto?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedColor = selection[colorName] || colors[0]?.name || '';
  const activeVariant = useMemo(() => (hasVariants ? findFashionVariant(producto, selection) : null), [producto, selection, hasVariants]);
  const allSelected = hasVariants ? options.every((o) => !!selection[o.nombre]) : true;
  const stock = activeVariant ? Number(activeVariant.stock || 0) : Number(producto?.stock ?? 0);
  const isOut = hasVariants ? allSelected && sinStock(stock) : sinStock(stock);
  const canAdd = hasVariants ? allSelected && !!activeVariant && !sinStock(stock) : !sinStock(stock);
  const price = activeVariant ? Number(activeVariant.precioUnitario || pricing.precioFinal) : pricing.precioFinal;
  const showStrike = !activeVariant && pricing.enOferta;
  const missing = hasVariants ? options.find((o) => !selection[o.nombre])?.nombre : '';

  const images: string[] = useMemo(() => {
    const byColor = hasVariants && selectedColor ? getFashionColorGallery(producto, selectedColor) : [];
    if (byColor.length) return byColor;
    const extra = Array.isArray(producto?.imagenesExtra) ? producto.imagenesExtra.map((x: any) => (typeof x === 'string' ? x : x?.url || x?.imagenUrl)) : [];
    return Array.from(new Set([producto?.imagenUrl, ...extra].filter(Boolean))) as string[];
  }, [producto, selectedColor, hasVariants]);

  const marca = nameOf(producto?.marca);
  const categoria = nameOf(producto?.categoria);
  const rating = Number(producto?.ratingAvg || 0);
  const ratingCount = Number(producto?.ratingCount || 0);
  const offerEnd = showStrike ? soonestOfferEnd([producto]) : null;
  const savings = showStrike ? Math.max(0, pricing.precioRegular - pricing.precioFinal) : 0;
  const categories = (allCategories || []).map(getName).filter(Boolean);
  const cartCount = (carrito || []).reduce((s: number, i: any) => s + Number(i?.cantidad || 1), 0);
  const benefits = buildBenefits(tienda, diseno, ch.hasWhatsapp).filter((b) => b.key !== 'quality').slice(0, 3);

  const pageOf = (url: string) => (url.includes('/catalogo') ? 'catalogo' : url.includes('/contacto') ? 'contacto' : url.includes('/checkout') ? 'checkout' : url.includes('/producto/') ? 'producto' : url.endsWith(`/${slug}`) ? 'home' : undefined);
  const nav = (url: string) => { const page = pageOf(url); if (onNavigate && page) onNavigate(page); else navigate(url); };
  const goProduct = (p: any) => nav(`/tienda/${slug}/producto/${p.id}`);

  /** Línea de carrito con la variante elegida (cada combinación es su propia línea). */
  const buildItem = (base: any, quantity: number, withVariant: boolean) => {
    const pr = getProductPricing(base);
    const variantKey = withVariant && hasVariants ? options.map((o) => selection[o.nombre]).filter(Boolean).join(' / ') : '';
    const img = withVariant ? (images[0] || activeVariant?.imagenUrl || base?.imagenUrl) : base?.imagenUrl;
    return {
      ...base,
      id: base.id,
      productoId: base.id,
      cartId: variantKey ? `${base.id}::${variantKey}` : String(base.id),
      varianteId: withVariant ? activeVariant?.id : undefined,
      valoresAtributos: withVariant ? (activeVariant?.valoresAtributos || (hasVariants ? selection : undefined)) : undefined,
      precioUnitario: withVariant ? price : pr.precioFinal,
      precioOferta: undefined,
      imagenUrl: img,
      cantidad: Math.max(1, quantity),
      descripcion: variantKey ? `${base.descripcion} — ${variantKey}` : base.descripcion,
      codigo: (withVariant && activeVariant?.codigo) || base?.codigo,
    };
  };
  const pushItem = (item: any) => {
    if (onAddToCart) { onAddToCart(item); return; }
    const current: any[] = carrito || [];
    const exists = current.find((c) => String(c.cartId || c.id) === String(item.cartId));
    const next = exists ? current.map((c) => (String(c.cartId || c.id) === String(item.cartId) ? { ...c, cantidad: Number(c.cantidad || 1) + item.cantidad } : c)) : [...current, item];
    setCarrito?.(next);
  };
  const addMain = (openCart = true) => {
    if (!canAdd) { setHint(true); return false; }
    pushItem(buildItem(producto, qty, true));
    if (openCart) setMostrarCarrito(true);
    return true;
  };
  /** "Comprar ahora": agrega al carrito y va directo al checkout. */
  const buyNow = () => { if (addMain(false)) nav(`/tienda/${slug}/checkout`); };
  const addRelated = (p: any, q = 1) => {
    if (Array.isArray(p?.variantes) && p.variantes.length) { goProduct(p); return; }
    pushItem(buildItem(p, q, false));
    setMostrarCarrito(true);
  };
  const askUrl = ch.wa(`Hola, tengo una consulta sobre ${producto?.descripcion}${selectedColor && hasVariants ? ` (${selectedColor})` : ''}.`);

  const stockLine = hasVariants && !allSelected
    ? { icon: 'solar:info-circle-linear', color: t.muted, text: `Elige ${String(missing || 'una opción').toLowerCase()} para ver disponibilidad` }
    : isOut
      ? { icon: 'solar:close-circle-linear', color: t.muted, text: hasVariants ? 'Sin stock en esta opción' : 'Sin stock por ahora' }
      : pocasUnidades(stock, 5)
        ? { icon: 'solar:danger-triangle-linear', color: t.accent, text: `¡Quedan solo ${stock}!` }
        : { icon: 'solar:check-circle-linear', color: t.primary, text: 'Disponible' };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden pb-24" style={{ background: t.bg, fontFamily: t.font }}>
        <VerenaHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} onSearch={(v) => nav(`/tienda/${slug}/catalogo${v ? `?search=${encodeURIComponent(v)}` : ''}`)} navigate={nav} active="none" />

        <nav aria-label="Ruta" className="mx-auto flex max-w-7xl flex-wrap items-center gap-1.5 px-4 pt-6 text-[13px] lg:px-6" style={{ color: t.muted }}>
          <button type="button" onClick={() => nav(`/tienda/${slug}`)} className="hover:text-[#17191B]">Inicio</button>
          <Icon icon="solar:alt-arrow-right-linear" width={13} />
          <button type="button" onClick={() => nav(`/tienda/${slug}/catalogo`)} className="hover:text-[#17191B]">Catálogo</button>
          {categoria && <><Icon icon="solar:alt-arrow-right-linear" width={13} /><button type="button" onClick={() => nav(`/tienda/${slug}/catalogo?category=${encodeURIComponent(categoria)}`)} className="hover:text-[#17191B]">{categoria}</button></>}
          <Icon icon="solar:alt-arrow-right-linear" width={13} />
          <span className="line-clamp-1 max-w-[260px]" style={{ color: t.ink }}>{producto?.descripcion}</span>
        </nav>

        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
          <section className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
            <Gallery t={t} images={images} name={producto?.descripcion} producto={producto} slug={slug} discount={showStrike ? pricing.porcentajeDescuento : 0} isOut={isOut} />

            <motion.div variants={vrStagger} initial="hidden" animate="show" className="min-w-0">
              <motion.div variants={vrHeroText} className="flex flex-wrap items-center gap-2">
                {categoria && <button type="button" onClick={() => nav(`/tienda/${slug}/catalogo?category=${encodeURIComponent(categoria)}`)} className="rounded-full px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.08em]" style={{ background: t.primary, color: t.onPrimary }}>{categoria}</button>}
                {marca && <span className="rounded-full border px-3 py-1 text-[11.5px] font-semibold uppercase tracking-[0.08em]" style={{ borderColor: t.line, color: t.muted }}>{marca}</span>}
              </motion.div>

              <motion.h1 variants={vrHeroText} className="mt-4 text-[32px] font-bold leading-[1.1] tracking-[-0.02em] sm:text-[40px]" style={{ color: t.ink, fontFamily: t.serif }}>{producto?.descripcion}</motion.h1>

              <motion.div variants={vrHeroText} className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]" style={{ color: t.muted }}>
                <Stars rating={rating} count={ratingCount} size={16} />
                {producto?.codigo && <span>Código: <span className="font-semibold" style={{ color: t.ink }}>{activeVariant?.codigo || producto.codigo}</span></span>}
              </motion.div>

              <motion.div variants={vrHeroText} className="mt-6 rounded-2xl p-5" style={{ background: t.cream }}>
                <div className="flex flex-wrap items-end gap-3">
                  <span className="text-[38px] font-bold leading-none tracking-[-0.02em]" style={{ color: t.ink }}>{vrMoney(price)}</span>
                  {showStrike && <span className="pb-1 text-[17px] font-medium line-through" style={{ color: '#9A9EA0' }}>{vrMoney(pricing.precioRegular)}</span>}
                  {showStrike && <span className="mb-1 rounded-md px-2.5 py-1 text-[12px] font-bold" style={{ background: t.primary, color: t.onPrimary }}>-{pricing.porcentajeDescuento}%</span>}
                </div>
                <p className="mt-2 text-[13px]" style={{ color: t.muted }}>
                  IGV incluido{savings > 0 && <span className="ml-2 font-bold" style={{ color: t.primary }}>Ahorras {vrMoney(savings)}</span>}
                </p>
                {offerEnd && (
                  <div className="mt-4 flex flex-wrap items-center gap-4 border-t pt-4" style={{ borderColor: mix(t.ink, 10, 'transparent') }}>
                    <p className="text-[12px] font-bold uppercase tracking-[0.12em]" style={{ color: t.primary }}>La oferta termina en</p>
                    <OfferCountdown t={t} endsAt={offerEnd} size="sm" />
                  </div>
                )}
              </motion.div>

              {hasVariants && colors.length > 0 && (
                <motion.div variants={vrHeroText} className="mt-7">
                  <p className="mb-3 text-[13.5px] font-semibold" style={{ color: t.ink }}>{colorName}: <span className="font-normal" style={{ color: t.muted }}>{selectedColor || 'Elige uno'}</span></p>
                  <div className="flex flex-wrap gap-2.5">
                    {colors.map((c) => {
                      const active = selectedColor === c.name;
                      const available = isFashionVariantAvailable(producto, { [colorName]: c.name });
                      return (
                        <button key={c.name} type="button" title={c.name} aria-label={c.name} aria-pressed={active} onClick={() => { setHint(false); setSelection((cur) => ({ ...cur, [colorName]: c.name })); }} className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white transition-shadow" style={{ boxShadow: `inset 0 0 0 ${active ? 2 : 1}px ${active ? t.ink : t.line}`, opacity: available ? 1 : 0.45 }}>
                          {c.useImage && c.image ? <img src={c.image} alt="" className="h-9 w-9 rounded-lg object-cover" /> : <span className="h-7 w-7 rounded-full" style={{ background: c.hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.12)' }} />}
                          {!available && <span aria-hidden className="absolute h-px w-14 rotate-45" style={{ background: t.muted }} />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {hasVariants && options.filter((o) => o.nombre !== colorName).map((op) => (
                <motion.div key={op.nombre} variants={vrHeroText} className="mt-6">
                  <p className="mb-3 text-[13.5px] font-semibold" style={{ color: t.ink }}>{op.nombre}{selection[op.nombre] ? <span className="font-normal" style={{ color: t.muted }}>: {selection[op.nombre]}</span> : ''}</p>
                  <div className="flex flex-wrap gap-2">
                    {op.valores.map((val) => {
                      const active = selection[op.nombre] === val;
                      const available = isFashionVariantAvailable(producto, { ...selection, [op.nombre]: val });
                      return (
                        <button key={val} type="button" disabled={!available} aria-pressed={active} onClick={() => { setHint(false); setSelection((cur) => ({ ...cur, [op.nombre]: val })); }} className="relative flex h-11 min-w-[56px] items-center justify-center rounded-xl px-4 text-[13.5px] font-semibold transition-colors disabled:cursor-not-allowed" style={active ? { background: t.ink, color: '#fff' } : { background: '#fff', boxShadow: `inset 0 0 0 1px ${t.line}`, color: available ? t.ink : '#B9BCBE' }}>
                          {val}
                          {!available && <span aria-hidden className="absolute h-px w-8 -rotate-45" style={{ background: '#C9CCCE' }} />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ))}

              <motion.p variants={vrHeroText} className="mt-6 inline-flex items-center gap-2 text-[13.5px] font-semibold" style={{ color: stockLine.color }}>
                <Icon icon={stockLine.icon} width={18} /> {stockLine.text}
              </motion.p>
              <AnimatePresence>
                {hint && missing && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 text-[13px] font-semibold text-rose-500">Elige {missing.toLowerCase()} antes de agregar.</motion.p>
                )}
              </AnimatePresence>

              <motion.div variants={vrHeroText} ref={ctaRef} className="mt-5 flex flex-col gap-3 sm:flex-row">
                <QtyStepper t={t} qty={qty} setQty={setQty} disabled={isOut} />
                <motion.button type="button" whileHover={isOut ? undefined : { y: -2 }} whileTap={isOut ? undefined : { scale: 0.97 }} disabled={isOut} onClick={() => addMain()} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl text-[15px] font-bold disabled:cursor-not-allowed disabled:bg-[#E9E5DE] disabled:text-[#9A9EA0]" style={isOut ? undefined : { background: t.primary, color: t.onPrimary }}>
                  <Icon icon="solar:bag-3-linear" width={20} /> {isOut ? 'Agotado' : 'Agregar al carrito'}
                </motion.button>
              </motion.div>
              <motion.button variants={vrHeroText} type="button" whileHover={isOut ? undefined : { y: -2 }} whileTap={isOut ? undefined : { scale: 0.98 }} disabled={isOut} onClick={buyNow} className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 bg-white text-[15px] font-bold disabled:cursor-not-allowed disabled:opacity-50" style={{ borderColor: t.ink, color: t.ink }}>
                <Icon icon="solar:bolt-linear" width={19} /> Comprar ahora
              </motion.button>

              {askUrl && (
                <motion.a variants={vrHeroText} href={askUrl} target="_blank" rel="noopener noreferrer" className="group mt-5 flex items-center gap-4 rounded-2xl border bg-white p-4 transition-shadow hover:shadow-[0_18px_40px_-28px_rgba(23,25,27,0.45)]" style={{ borderColor: t.line }}>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: '#E8F7EE', color: '#1A9E4E' }}><Icon icon="ic:baseline-whatsapp" width={26} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-bold" style={{ color: t.ink }}>¿Tienes dudas sobre este modelo?</p>
                    <p className="text-[13px]" style={{ color: t.muted }}>Medidas, colores o materiales: pregúntanos por WhatsApp</p>
                  </div>
                  <Icon icon="solar:arrow-right-linear" width={20} className="transition-transform duration-300 group-hover:translate-x-1" style={{ color: t.muted }} />
                </motion.a>
              )}

              {benefits.length > 0 && (
                <motion.ul variants={vrHeroText} className="mt-5 grid gap-3 sm:grid-cols-3">
                  {benefits.map((b) => (
                    <li key={b.key} className="flex items-center gap-3 rounded-xl px-3.5 py-3" style={{ background: t.cream }}>
                      <Icon icon={b.icon} width={26} className="shrink-0" style={{ color: t.ink }} />
                      <div className="min-w-0 leading-tight">
                        <p className="text-[13px] font-bold" style={{ color: t.ink }}>{b.title}</p>
                        <p className="text-[11.5px]" style={{ color: t.muted }}>{b.sub}</p>
                      </div>
                    </li>
                  ))}
                </motion.ul>
              )}
            </motion.div>
          </section>

          <DetailTabs t={t} producto={producto} tienda={tienda} ch={ch} marca={marca} categoria={categoria} />
        </main>

        <ProductoVideo url={producto?.videoUrl} />
        {related.length > 0 && (
          <ProductRail t={t} eyebrow="Relacionados" title={ed(diseno, 'RelatedTitle', 'También te puede gustar')} products={related} slug={slug} diseno={diseno} onOpen={goProduct} onAdd={addRelated} />
        )}

        <VerenaFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={nav} />

        <StickyBuyBar t={t} watchRef={ctaRef} producto={producto} price={price} isOut={isOut} onAdd={() => addMain()} onBuy={buyNow} />
        <TiendaFloatingButtons diseno={diseno} tienda={tienda} />
        <VerenaCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => nav(`/tienda/${slug}/checkout`)} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.primary} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.primary} onGoProduct={(item: any) => goProduct(item)} />
      </div>
    </MotionConfig>
  );
}

// ═══════════════════════════════════════════════════════════════ GALERÍA ══
/** Galería aislada: el zoom sigue al mouse escribiendo transform-origin por ref (sin re-renders). */
function Gallery({ t, images, name, producto, slug, discount, isOut }: { t: Theme; images: string[]; name?: string; producto: any; slug: string; discount: number; isOut: boolean }) {
  const [idx, setIdx] = useState(0);
  const [zooming, setZooming] = useState(false);
  const zoomRef = useRef<HTMLDivElement>(null);
  const canHover = useMemo(() => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(hover: hover)').matches), []);
  useEffect(() => setIdx(0), [images]);
  const src = images[idx];
  const step = (d: number) => setIdx((v) => (v + d + images.length) % images.length);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: vrEase }} className="flex flex-col-reverse gap-3 lg:sticky lg:top-6 lg:flex-row lg:self-start">
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] lg:max-h-[560px] lg:flex-col lg:overflow-y-auto lg:pb-0">
          {images.slice(0, 7).map((img, i) => (
            <button key={img} type="button" aria-label={`Ver imagen ${i + 1}`} onClick={() => setIdx(i)} className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-xl p-1.5" style={{ background: t.tile }}>
              {i === idx && <motion.span layoutId="vr-thumb-ring" className="absolute -inset-px rounded-xl border-2" style={{ borderColor: t.ink }} transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
              <img src={img} alt="" className="h-full w-full object-contain mix-blend-multiply" />
            </button>
          ))}
        </div>
      )}

      <div
        className="group relative aspect-square min-w-0 flex-1 overflow-hidden rounded-[24px]"
        style={{ background: t.tile, cursor: src && canHover ? 'zoom-in' : 'default' }}
        onMouseEnter={() => src && canHover && setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        onMouseMove={(e) => {
          if (!zoomRef.current) return;
          const r = e.currentTarget.getBoundingClientRect();
          zoomRef.current.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
        }}
      >
        <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
          {discount > 0 && <span className="rounded-md px-2.5 py-1 text-[12px] font-bold" style={{ background: t.primary, color: t.onPrimary }}>Oferta -{discount}%</span>}
          {isOut && <span className="rounded-md bg-[#3F4246] px-2.5 py-1 text-[12px] font-bold text-white">Agotado</span>}
        </div>
        <div className="absolute right-4 top-4 z-10"><ProductCardActions producto={producto} slug={slug} cp={t.primary} /></div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={src || 'empty'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="absolute inset-0">
            <div ref={zoomRef} className="h-full w-full transition-transform duration-300 ease-out" style={{ transform: zooming ? 'scale(1.9)' : 'scale(1)' }}>
              {src ? (
                <img src={src} alt={name || ''} className={`h-full w-full object-contain p-10 mix-blend-multiply ${isOut ? 'opacity-60 grayscale' : ''}`} />
              ) : (
                <div className="flex h-full w-full items-center justify-center"><Icon icon="solar:bag-4-bold-duotone" width={150} style={{ color: mix(t.primary, 45) }} /></div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {images.length > 1 && [{ d: -1, icon: 'solar:alt-arrow-left-linear', pos: 'left-4', label: 'Imagen anterior' }, { d: 1, icon: 'solar:alt-arrow-right-linear', pos: 'right-4', label: 'Imagen siguiente' }].map((b) => (
          <button key={b.d} type="button" aria-label={b.label} onClick={() => step(b.d)} className={`absolute ${b.pos} top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-sm backdrop-blur transition-opacity duration-300 group-hover:opacity-100`} style={{ color: t.ink }}>
            <Icon icon={b.icon} width={20} />
          </button>
        ))}
        {src && canHover && !zooming && (
          <span className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1.5 text-[11.5px] font-semibold opacity-0 shadow-sm transition-opacity duration-300 group-hover:opacity-100" style={{ color: t.muted }}>
            <Icon icon="solar:magnifer-zoom-in-linear" width={13} className="mr-1 inline" />Pasa el mouse para ampliar
          </span>
        )}
      </div>
    </motion.div>
  );
}

function QtyStepper({ t, qty, setQty, disabled }: { t: Theme; qty: number; setQty: (n: number) => void; disabled: boolean }) {
  const [text, setText] = useState(String(qty));
  useEffect(() => setText(String(qty)), [qty]);
  return (
    <div className="flex h-14 w-full items-center justify-between rounded-xl border bg-white px-2 sm:w-40" style={{ borderColor: t.line }}>
      <motion.button type="button" whileTap={{ scale: 0.85 }} aria-label="Restar" disabled={disabled} onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-black/[0.04] disabled:opacity-40" style={{ color: t.ink }}><Icon icon="solar:minus-circle-linear" width={22} /></motion.button>
      <input
        type="text"
        inputMode="numeric"
        aria-label="Cantidad"
        disabled={disabled}
        value={text}
        onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setText(d); if (d) setQty(Math.max(1, parseInt(d, 10))); }}
        onBlur={() => { const n = Math.max(1, parseInt(text || '1', 10) || 1); setQty(n); setText(String(n)); }}
        onFocus={(e) => e.currentTarget.select()}
        className="w-full min-w-0 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[17px] font-bold outline-none focus:ring-0"
        style={{ color: t.ink }}
      />
      <motion.button type="button" whileTap={{ scale: 0.85 }} aria-label="Sumar" disabled={disabled} onClick={() => setQty(Math.max(1, qty) + 1)} className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-black/[0.04] disabled:opacity-40" style={{ color: t.ink }}><Icon icon="solar:add-circle-linear" width={22} /></motion.button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════ PESTAÑAS ══
function DetailTabs({ t, producto, tienda, ch, marca, categoria }: { t: Theme; producto: any; tienda: any; ch: Channels; marca: string; categoria: string }) {
  const description = htmlToText(producto?.descripcionLarga);
  const rows: [string, string][] = [];
  if (producto?.codigo) rows.push(['Código', String(producto.codigo)]);
  if (categoria) rows.push(['Categoría', categoria]);
  if (marca) rows.push(['Marca', marca]);
  const unidad = nameOf(producto?.unidadMedida);
  if (unidad) rows.push(['Unidad', unidad]);
  const ficha = producto?.fichaTecnica;
  const grupos: { nombre: string; items: { label: string; value: string }[] }[] = Array.isArray(ficha?.grupos) ? ficha.grupos.filter((g: any) => Array.isArray(g?.items) && g.items.length) : [];
  if (!grupos.length) {
    Object.entries(producto?.atributosTecnicos || {})
      .filter(([k, v]) => !k.startsWith('__') && v !== null && v !== undefined && typeof v !== 'object' && String(v).trim() !== '')
      .forEach(([k, v]) => rows.push([k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase()), String(v)]));
  }

  const envio = Number(tienda?.costoEnvioFijo || 0);
  const prep = Number(tienda?.tiempoPreparacionMin || 0);
  const shipping = [
    tienda?.aceptaEnvio !== false && { icon: 'ph:truck-light', title: 'Envío a domicilio', text: envio > 0 ? `Llevamos tu pedido desde ${vrMoney(envio)}.` : 'El costo de envío se muestra al finalizar tu compra.' },
    tienda?.aceptaRecojo && { icon: 'ph:storefront-light', title: 'Recojo en tienda', text: `Listo ${prep > 0 ? `en aprox. ${prep} min` : 'en poco tiempo'}${ch.pickupAddress ? ` en ${ch.pickupAddress}` : ''}.` },
    { icon: 'ph:map-trifold-light', title: 'Seguimiento', text: 'Al confirmar tu compra recibes un código para seguir tu pedido.' },
  ].filter(Boolean) as { icon: string; title: string; text: string }[];

  const tabs = [{ key: 'desc', label: 'Descripción' }, ...(rows.length || grupos.length ? [{ key: 'spec', label: 'Detalles' }] : []), { key: 'ship', label: 'Envío y recojo' }];
  const [active, setActive] = useState('desc');

  return (
    <section className="mt-16">
      <div className="flex gap-1 overflow-x-auto border-b [scrollbar-width:none]" style={{ borderColor: t.line }} role="tablist">
        {tabs.map((tab) => (
          <button key={tab.key} type="button" role="tab" aria-selected={active === tab.key} onClick={() => setActive(tab.key)} className="relative shrink-0 px-5 py-4 text-[15px] font-bold transition-colors duration-300" style={{ color: active === tab.key ? t.ink : '#A3A7A9' }}>
            {tab.label}
            {active === tab.key && <motion.span layoutId="vr-detail-tab" className="absolute inset-x-3 -bottom-px h-[2.5px] rounded-full" style={{ background: t.ink }} transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: vrEase }} className="py-8">
          {active === 'desc' && (
            <div className="max-w-3xl whitespace-pre-line text-[15.5px] leading-[1.8]" style={{ color: t.muted }}>
              {description || `${producto?.descripcion}${categoria ? `, de nuestra colección de ${categoria.toLowerCase()}` : ''}. Si quieres conocer medidas, materiales o colores disponibles, escríbenos y te ayudamos.`}
            </div>
          )}

          {active === 'spec' && (
            <div className="grid gap-6 lg:grid-cols-2">
              {rows.length > 0 && <SpecTable t={t} title="Información general" rows={rows} />}
              {grupos.map((g) => <SpecTable key={g.nombre} t={t} title={g.nombre} rows={g.items.map((it) => [it.label, String(it.value)] as [string, string])} />)}
            </div>
          )}

          {active === 'ship' && (
            <div className="grid gap-4 sm:grid-cols-3">
              {shipping.map((s) => (
                <div key={s.title} className="rounded-2xl p-6" style={{ background: t.cream }}>
                  <Icon icon={s.icon} width={36} style={{ color: t.ink }} />
                  <p className="mt-4 text-[15.5px] font-bold" style={{ color: t.ink }}>{s.title}</p>
                  <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: t.muted }}>{s.text}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function SpecTable({ t, title, rows }: { t: Theme; title: string; rows: [string, string][] }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: t.line }}>
      <p className="px-6 pb-2 pt-5 text-[13px] font-bold uppercase tracking-[0.12em]" style={{ color: t.muted }}>{title}</p>
      <dl>
        {rows.map(([k, v], i) => (
          <div key={`${k}-${i}`} className="grid grid-cols-[minmax(110px,190px)_1fr] gap-4 border-t px-6 py-3.5 text-[14px]" style={{ borderColor: t.line }}>
            <dt style={{ color: t.muted }}>{k}</dt>
            <dd className="font-semibold" style={{ color: t.ink }}>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════ BARRA FIJA ══
/** Barra de compra fija: aparece cuando los botones salen de pantalla. Estado aislado. */
function StickyBuyBar({ t, watchRef, producto, price, isOut, onAdd, onBuy }: { t: Theme; watchRef: RefObject<HTMLDivElement | null>; producto: any; price: number; isOut: boolean; onAdd: () => void; onBuy: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = watchRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [watchRef]);
  if (isOut) return null;
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ y: 110 }} animate={{ y: 0 }} exit={{ y: 110 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 shadow-[0_-18px_40px_-28px_rgba(23,25,27,0.45)] backdrop-blur-md" style={{ borderColor: t.line }}>
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:pr-24 lg:px-6 lg:pr-24">
            {producto?.imagenUrl && <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-lg sm:flex" style={{ background: t.tile }}><img src={producto.imagenUrl} alt="" className="h-10 w-10 object-contain mix-blend-multiply" /></span>}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold" style={{ color: t.ink }}>{producto?.descripcion}</p>
              <p className="text-[16px] font-bold" style={{ color: t.primary }}>{vrMoney(price)}</p>
            </div>
            <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={onAdd} className="flex h-12 items-center gap-2 rounded-xl px-5 text-[14px] font-bold" style={{ background: t.primary, color: t.onPrimary }}>
              <Icon icon="solar:bag-3-linear" width={19} /> <span className="hidden sm:inline">Agregar</span>
            </motion.button>
            <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={onBuy} className="hidden h-12 items-center gap-2 rounded-xl border-2 px-5 text-[14px] font-bold md:flex" style={{ borderColor: t.ink, color: t.ink }}>
              Comprar ahora
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════ WRAPPER (datos) ══
export default function VerenaProductoDetalle() {
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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!slug) return;
    try { const saved = localStorage.getItem(`tienda:${slug}:carrito`); if (saved) setCarrito(JSON.parse(saved)); } catch { /* carrito corrupto: se ignora */ }
    setHydrated(true);
    return onTiendaCartCleared(slug, () => { setCarrito([]); setMostrarCarrito(false); });
  }, [slug]);

  // El checkout lee el carrito de aquí (solo después de leer el guardado, para no pisarlo).
  useEffect(() => { if (slug && hydrated) localStorage.setItem(`tienda:${slug}:carrito`, JSON.stringify(carrito)); }, [carrito, slug, hydrated]);

  useEffect(() => {
    if (!slug || !id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [storeRes, catRes, productRes] = await Promise.all([
          obtenerTiendaPublica(slug),
          axios.get(`${BASE_URL}/public/store/${slug}/categories`),
          axios.get(`${BASE_URL}/public/store/${slug}/products/${id}`),
        ]);
        const store = storeRes.data.data || storeRes.data;
        const product = withPricing(productRes.data.data || productRes.data);
        setTienda(recordarVentaSinStock(store));
        setAllCategories(Array.isArray(catRes.data?.data) ? catRes.data.data : []);
        setProducto(product);
        window.scrollTo({ top: 0 });
        // Relacionados: primero la misma categoría; si son pocos, se completa con otros productos.
        const listOf = (res: any) => (Array.isArray(res.data?.data?.data) ? res.data.data.data : Array.isArray(res.data?.data) ? res.data.data : []);
        const category = nameOf(product.categoria);
        let pool: any[] = category ? listOf(await axios.get(`${BASE_URL}/public/store/${slug}/products`, { params: { category, limit: 11 } })) : [];
        pool = pool.filter((item: any) => Number(item.id) !== Number(id));
        if (pool.length < 5) {
          const seen = new Set(pool.map((p: any) => Number(p.id)));
          const more = listOf(await axios.get(`${BASE_URL}/public/store/${slug}/products`, { params: { limit: 12 } })).filter((item: any) => Number(item.id) !== Number(id) && !seen.has(Number(item.id)));
          pool = [...pool, ...more];
        }
        setRelated(withPricingList(pool.slice(0, 10)));
      } catch {
        navigate(`/tienda/${slug}${previewPlantillaId ? `?previewPlantilla=${encodeURIComponent(previewPlantillaId)}` : ''}`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, id, navigate, previewPlantillaId]);

  // Carrito por cartId: cada variante es su propia línea.
  const addToCart = (item: any) => {
    const cartId = String(item.cartId || item.id);
    setCarrito((cur) => {
      const i = cur.findIndex((c) => String(c.cartId || c.id) === cartId);
      if (i >= 0) { const copy = [...cur]; copy[i] = { ...copy[i], cantidad: Number(copy[i].cantidad || 1) + Number(item.cantidad || 1) }; return copy; }
      return [...cur, { ...item, cartId, cantidad: Number(item.cantidad || 1) }];
    });
  };
  const actualizarCantidad = (cartId: number | string, cantidad: number) => {
    setCarrito((cur) => (cantidad <= 0
      ? cur.filter((i) => String(i.cartId || i.id) !== String(cartId))
      : cur.map((i) => (String(i.cartId || i.id) === String(cartId) ? { ...i, cantidad } : i))));
  };

  const memoStore = useMemo(() => tienda || {}, [tienda]);
  if (loading && !producto) return <div className="flex min-h-screen items-center justify-center bg-[#FCFAF6]"><Icon icon="solar:refresh-linear" className="h-10 w-10 animate-spin text-[#C9C2B6]" /></div>;
  if (!producto) return null;

  return (
    <VerenaProductoDetalleView
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
      onAddToCart={addToCart}
    />
  );
}
