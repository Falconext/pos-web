import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { onTiendaCartCleared } from '@/utils/tiendaCart';
import { getProductPricing, withPricing, withPricingList } from '@/templates/shared/pricing';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import ProductCardActions from '@/components/tienda/ProductCardActions';
import {
  getFashionColors, getFashionColorGallery, getDefaultVariantSelection, findFashionVariant,
  isFashionVariantAvailable, getVariantOptionNames,
} from '@/templates/urbano/fashionVariants';
import {
  ElanHeader, ElanFooter, ElanCartModal, Stars, buildServices,
  elanTheme, useElanFont, editable, elMoney, nameOf, btnCls, labelCls, type Theme,
} from '@/templates/moda-elegante/ElanParts';
import { ProductRail, OfferCountdown, soonestOfferEnd, storeChannels, getName, photoFit, type Channels } from '@/templates/moda-elegante/ElanSections';
import { mix, elEase, elHeroText, elStagger } from '@/templates/moda-elegante/motion';
import ProductoVideo from '@/components/tienda/ProductoVideo';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';
const optionsOf = (p: any): { nombre: string; valores: string[] }[] => (Array.isArray(p?.opcionesAtributos) ? p.opcionesAtributos : []);

/** Convierte el HTML del editor en texto legible (sin etiquetas ni entidades). */
const htmlToText = (html: any): string => {
  let s = String(html || '').replace(/<\/(p|div|li|h[1-6])>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
  if (typeof document !== 'undefined') { const ta = document.createElement('textarea'); ta.innerHTML = s; s = ta.value; }
  return s.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n').trim();
};

export function ElanProductoDetalleView({ tienda, slug, producto, related = [], allCategories = [], carrito, setCarrito, mostrarCarrito, setMostrarCarrito, actualizarCantidad, onNavigate, onAddToCart }: any) {
  useElanFont();
  const navigate = useNavigate();
  const diseno = tienda?.diseno || {};
  const t = elanTheme(diseno);
  const fit = photoFit(diseno);
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
  const isOut = hasVariants ? allSelected && stock <= 0 : stock <= 0;
  const canAdd = hasVariants ? allSelected && !!activeVariant && stock > 0 : stock > 0;
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
  const offerEnd = showStrike ? soonestOfferEnd([producto]) : null;
  const categories = (allCategories || []).map(getName).filter(Boolean);
  const cartCount = (carrito || []).reduce((s: number, i: any) => s + Number(i?.cantidad || 1), 0);
  const services = buildServices(tienda, ch.hasWhatsapp).slice(0, 3);

  const go = (url: string, page?: string) => { if (onNavigate && page) onNavigate(page); else navigate(url); };
  const nav = (url: string) => go(url, url.includes('/catalogo') ? 'catalogo' : url.includes('/contacto') ? 'contacto' : url.endsWith(`/${slug}`) ? 'home' : undefined);
  const goProduct = (p: any) => go(`/tienda/${slug}/producto/${p.id}`, 'producto');

  /** Arma la línea de carrito con la variante elegida (cada combinación de variante es su propia línea). */
  const buildItem = (quantity: number) => {
    const variantKey = hasVariants ? options.map((o) => selection[o.nombre]).filter(Boolean).join(' / ') : '';
    const img = images[0] || activeVariant?.imagenUrl || producto?.imagenUrl;
    return {
      ...producto,
      id: producto.id,
      productoId: producto.id,
      cartId: variantKey ? `${producto.id}::${variantKey}` : String(producto.id),
      varianteId: activeVariant?.id,
      valoresAtributos: activeVariant?.valoresAtributos || (hasVariants ? selection : undefined),
      precioUnitario: price,
      precioOferta: undefined,
      imagenUrl: img,
      cantidad: Math.max(1, quantity),
      descripcion: variantKey ? `${producto.descripcion} — ${variantKey}` : producto.descripcion,
      codigo: activeVariant?.codigo || producto?.codigo,
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
    pushItem(buildItem(qty));
    if (openCart) setMostrarCarrito(true);
    return true;
  };
  const buyNow = () => { if (addMain(false)) go(`/tienda/${slug}/checkout`, 'checkout'); };
  const askUrl = ch.wa(`Hola, tengo una consulta sobre ${producto?.descripcion}${selection[getVariantOptionNames(producto).size] ? ` (${selection[getVariantOptionNames(producto).size]})` : ''}.`);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden pb-24" style={{ background: t.bg, fontFamily: t.font }}>
        <ElanHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={nav} />

        <nav aria-label="Ruta" className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-1.5 px-4 pt-6 text-[11px] uppercase tracking-[0.12em] lg:px-10" style={{ color: t.muted }}>
          <button type="button" onClick={() => go(`/tienda/${slug}`, 'home')} className="hover:text-stone-900">Inicio</button>
          <Icon icon="solar:alt-arrow-right-linear" width={12} />
          <button type="button" onClick={() => go(`/tienda/${slug}/catalogo`, 'catalogo')} className="hover:text-stone-900">Catálogo</button>
          {categoria && <><Icon icon="solar:alt-arrow-right-linear" width={12} /><button type="button" onClick={() => go(`/tienda/${slug}/catalogo?category=${encodeURIComponent(categoria)}`, 'catalogo')} className="hover:text-stone-900">{categoria}</button></>}
          <Icon icon="solar:alt-arrow-right-linear" width={12} />
          <span className="line-clamp-1 max-w-[260px]" style={{ color: t.ink }}>{producto?.descripcion}</span>
        </nav>

        <main className="mx-auto max-w-[1440px] px-4 py-6 lg:px-10">
          <section className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
            <Gallery t={t} fit={fit} images={images} name={producto?.descripcion} producto={producto} slug={slug} discount={showStrike ? pricing.porcentajeDescuento : 0} isOut={isOut} />

            <motion.div variants={elStagger} initial="hidden" animate="show" className="min-w-0">
              <motion.div variants={elHeroText} className="flex flex-wrap items-center gap-2">
                {categoria && <button type="button" onClick={() => go(`/tienda/${slug}/catalogo?category=${encodeURIComponent(categoria)}`, 'catalogo')} className={labelCls} style={{ color: t.accentInk }}>{categoria}</button>}
                {marca && <span className="border px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: t.line, color: t.muted }}>{marca}</span>}
              </motion.div>
              <motion.h1 variants={elHeroText} className="mt-3 text-[32px] leading-[1.08] sm:text-[42px]" style={{ color: t.ink, fontFamily: t.display }}>{producto?.descripcion}</motion.h1>
              <motion.div variants={elHeroText} className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]" style={{ color: t.muted }}>
                <Stars producto={producto} t={t} size={14} />
                {(activeVariant?.codigo || producto?.codigo) && <span>SKU: <span style={{ color: t.ink }}>{activeVariant?.codigo || producto.codigo}</span></span>}
              </motion.div>

              <motion.div variants={elHeroText} className="mt-6 flex flex-wrap items-end gap-3">
                <span className="text-[24px] font-semibold leading-none" style={{ color: showStrike ? t.accentInk : t.ink }}>{elMoney(price)}</span>
                {showStrike && <span className="pb-1 text-[16px] font-medium line-through" style={{ color: t.muted }}>{elMoney(pricing.precioRegular)}</span>}
                {showStrike && <span className="mb-1 px-2.5 py-1 text-[11.5px] font-semibold" style={{ background: mix(t.accent, 14, '#fff'), color: t.accent }}>-{pricing.porcentajeDescuento}%</span>}
              </motion.div>
              {offerEnd && (
                <motion.div variants={elHeroText} className="mt-4 inline-flex flex-wrap items-center gap-3 py-1.5 pl-4 pr-1.5" style={{ background: mix(t.accent, 10, '#fff') }}>
                  <span className="text-[11.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: t.accent }}>La oferta termina en</span>
                  <OfferCountdown t={t} endsAt={offerEnd} />
                </motion.div>
              )}

              {/* Color */}
              {hasVariants && colors.length > 0 && (
                <motion.div variants={elHeroText} className="mt-7">
                  <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: t.ink }}>{colorName}: <span className="font-medium normal-case tracking-normal" style={{ color: t.muted }}>{selectedColor || 'Elige uno'}</span></p>
                  <div className="flex flex-wrap gap-2.5">
                    {colors.map((c) => {
                      const active = selectedColor === c.name;
                      const available = isFashionVariantAvailable(producto, { [colorName]: c.name });
                      return (
                        <button key={c.name} type="button" title={c.name} aria-label={c.name} aria-pressed={active} onClick={() => { setHint(false); setSelection((cur) => ({ ...cur, [colorName]: c.name })); }} className="relative flex h-12 w-12 items-center justify-center overflow-hidden bg-white transition-shadow" style={{ boxShadow: `inset 0 0 0 ${active ? 2 : 1}px ${active ? t.ink : t.line}`, opacity: available ? 1 : 0.45 }}>
                          {c.useImage && c.image ? <img src={c.image} alt="" className="h-9 w-9 object-cover" /> : <span className="h-7 w-7" style={{ background: c.hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.12)' }} />}
                          {!available && <span aria-hidden className="absolute h-px w-14 rotate-45" style={{ background: t.muted }} />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Talla y otras opciones */}
              {hasVariants && options.filter((o) => o.nombre !== colorName).map((op) => (
                <motion.div key={op.nombre} variants={elHeroText} className="mt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: t.ink }}>{op.nombre}{selection[op.nombre] ? <span className="font-medium normal-case tracking-normal" style={{ color: t.muted }}>: {selection[op.nombre]}</span> : ''}</p>
                    {askUrl && <a href={askUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold underline underline-offset-4" style={{ color: t.muted }}>¿Dudas con la talla o el tamaño?</a>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {op.valores.map((val) => {
                      const active = selection[op.nombre] === val;
                      const available = isFashionVariantAvailable(producto, { ...selection, [op.nombre]: val });
                      return (
                        <button key={val} type="button" disabled={!available} aria-pressed={active} onClick={() => { setHint(false); setSelection((cur) => ({ ...cur, [op.nombre]: val })); }} className="relative flex h-11 min-w-[56px] items-center justify-center px-4 text-[13px] font-medium transition-colors disabled:cursor-not-allowed" style={active ? { background: t.ink, color: '#fff' } : { background: '#fff', boxShadow: `inset 0 0 0 1px ${t.line}`, color: available ? t.ink : mix(t.ink, 30, '#fff') }}>
                          {val}
                          {!available && <span aria-hidden className="absolute h-px w-8 -rotate-45" style={{ background: mix(t.ink, 25, '#fff') }} />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ))}

              <motion.div variants={elHeroText} className="mt-5 inline-flex items-center gap-2 text-[12.5px] font-semibold" style={{ color: isOut ? t.muted : stock <= 5 && (!hasVariants || allSelected) ? t.accent : t.primaryInk }}>
                <Icon icon={isOut ? 'solar:close-circle-linear' : 'solar:check-circle-linear'} width={17} />
                {hasVariants && !allSelected ? `Elige ${String(missing || 'una opción').toLowerCase()} para ver disponibilidad` : isOut ? 'Sin stock en esta opción' : stock <= 5 ? `¡Quedan ${stock}!` : 'Disponible'}
              </motion.div>

              <motion.div variants={elHeroText} ref={ctaRef} className="mt-5 flex flex-col gap-3 sm:flex-row">
                <QtyStepper t={t} qty={qty} setQty={setQty} disabled={isOut} />
                <motion.button type="button" whileHover={isOut ? undefined : { y: -2 }} whileTap={isOut ? undefined : { scale: 0.97 }} disabled={isOut} onClick={() => addMain()} className={`${btnCls} h-14 w-full disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 sm:w-auto sm:flex-1`} style={isOut ? undefined : { background: t.primary, color: t.onPrimary }}>
                  <Icon icon="solar:cart-plus-linear" width={20} /> {isOut ? 'Agotado' : 'Agregar a la bolsa'}
                </motion.button>
              </motion.div>
              <motion.button variants={elHeroText} type="button" whileHover={isOut ? undefined : { y: -2 }} whileTap={isOut ? undefined : { scale: 0.98 }} disabled={isOut} onClick={buyNow} className={`${btnCls} mt-3 h-14 w-full bg-white disabled:cursor-not-allowed disabled:opacity-50`} style={{ boxShadow: `inset 0 0 0 1.5px ${t.ink}`, color: t.ink }}>
                Comprar ahora
              </motion.button>
              <AnimatePresence>
                {hint && !canAdd && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 text-[12.5px] font-semibold" style={{ color: t.accent }}>
                    {missing ? `Selecciona ${missing.toLowerCase()} para continuar.` : 'Esta combinación no está disponible.'}
                  </motion.p>
                )}
              </AnimatePresence>

              {askUrl && (
                <motion.a variants={elHeroText} href={askUrl} target="_blank" rel="noopener noreferrer" className="group mt-5 flex items-center gap-4 border bg-white p-4" style={{ borderColor: t.line }}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center" style={{ background: '#E7F8EE', color: '#1FA855' }}><Icon icon="ic:baseline-whatsapp" width={24} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold" style={{ color: t.ink }}>¿Dudas con la talla o el color?</p>
                    <p className="text-[12px]" style={{ color: t.muted }}>Escríbenos y te asesoramos al instante</p>
                  </div>
                  <Icon icon="solar:arrow-right-linear" width={19} className="transition-transform duration-300 group-hover:translate-x-1" style={{ color: t.muted }} />
                </motion.a>
              )}

              <motion.ul variants={elHeroText} className="mt-5 grid gap-2 sm:grid-cols-3">
                {services.map((s) => (
                  <li key={s.label} className="flex items-center gap-2.5 bg-white/70 px-3.5 py-3">
                    <Icon icon={s.icon} width={20} className="shrink-0" style={{ color: t.primaryInk }} />
                    <div className="min-w-0 leading-tight"><p className="text-[12px] font-semibold" style={{ color: t.ink }}>{s.label}</p><p className="line-clamp-2 text-[10.5px]" style={{ color: t.muted }}>{s.sub}</p></div>
                  </li>
                ))}
              </motion.ul>
            </motion.div>
          </section>

          <DetailTabs t={t} producto={producto} tienda={tienda} ch={ch} marca={marca} categoria={categoria} sku={activeVariant?.codigo || producto?.codigo} />
        </main>

        <ProductoVideo url={producto?.videoUrl} />
        {related.length > 0 && <ProductRail t={t} fit={fit} title={editable(diseno?.modaEleganteRelatedTitle, 'También te puede gustar')} products={related} slug={slug} onOpen={goProduct} onAdd={(p: any, q?: number) => pushItem({ ...p, cartId: String(p.id), productoId: p.id, cantidad: Math.max(1, q || 1), precioUnitario: getProductPricing(p).precioFinal })} />}

        <ElanFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={nav} />

        <StickyBuyBar t={t} watchRef={ctaRef} producto={producto} image={images[0]} price={price} disabled={isOut} onAdd={() => addMain()} onBuy={buyNow} />
        <ElanCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => go(`/tienda/${slug}/checkout`, 'checkout')} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.primary} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.primary} onGoProduct={(item: any) => goProduct(item)} />
      </div>
    </MotionConfig>
  );
}

// ═══════════════════════════════════════════════════════════════ GALERÍA ══
/** Galería aislada: el zoom sigue al mouse escribiendo transform-origin por ref (sin re-renders). */
function Gallery({ t, fit, images, name, producto, slug, discount, isOut }: { t: Theme; fit: 'cover' | 'contain'; images: string[]; name?: string; producto: any; slug: string; discount: number; isOut: boolean }) {
  const [idx, setIdx] = useState(0);
  const [zooming, setZooming] = useState(false);
  const zoomRef = useRef<HTMLDivElement>(null);
  const canHover = useMemo(() => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(hover: hover)').matches), []);
  const sig = images.join('|');
  useEffect(() => setIdx(0), [sig]);
  const src = images[idx];
  const step = (d: number) => setIdx((v) => (v + d + images.length) % images.length);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: elEase }} className="flex flex-col-reverse gap-3 lg:sticky lg:top-24 lg:flex-row lg:self-start">
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] lg:max-h-[720px] lg:w-[84px] lg:flex-col lg:overflow-y-auto lg:pb-0">
          {images.slice(0, 8).map((img, i) => (
            <button key={`${img}-${i}`} type="button" aria-label={`Ver imagen ${i + 1}`} onClick={() => setIdx(i)} className="relative aspect-[4/5] w-[68px] shrink-0 overflow-hidden lg:w-[84px]" style={{ background: t.soft }}>
              <img src={img} alt="" className={`h-full w-full mix-blend-multiply ${fit === 'contain' ? 'object-contain p-1.5' : 'object-cover'}`} />
              {i === idx && <motion.span layoutId="el-thumb-ring" className="absolute inset-0" style={{ boxShadow: `inset 0 0 0 2px ${t.ink}` }} transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
            </button>
          ))}
        </div>
      )}
      <div
        className="group relative aspect-[4/5] min-w-0 flex-1 overflow-hidden"
        style={{ background: t.soft, cursor: src && canHover ? 'zoom-in' : 'default' }}
        onMouseEnter={() => src && canHover && setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        onMouseMove={(e) => {
          if (!zoomRef.current) return;
          const r = e.currentTarget.getBoundingClientRect();
          zoomRef.current.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
        }}
      >
        <div className="absolute left-5 top-5 z-10 flex flex-col gap-2">
          {discount > 0 && <span className="px-3 py-1 text-[11.5px] font-semibold" style={{ background: mix(t.accent, 14, '#fff'), color: t.accent }}>-{discount}%</span>}
          {isOut && <span className="bg-stone-800 px-3 py-1 text-[11.5px] font-semibold text-white">Agotado</span>}
        </div>
        <div className="absolute right-5 top-5 z-10"><ProductCardActions producto={producto} slug={slug} cp={t.primary} /></div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={src || 'empty'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0">
            <div ref={zoomRef} className="h-full w-full transition-transform duration-300 ease-out" style={{ transform: zooming ? 'scale(1.9)' : 'scale(1)', background: t.soft }}>
              {src ? <img src={src} alt={name || ''} className={`h-full w-full mix-blend-multiply ${fit === 'contain' ? 'object-contain p-8 sm:p-12' : 'object-cover'} ${isOut ? 'opacity-60 grayscale' : ''}`} />
                : <div className="flex h-full w-full items-center justify-center"><Icon icon="ph:coat-hanger-thin" width={150} style={{ color: mix(t.ink, 20, t.bg) }} /></div>}
            </div>
          </motion.div>
        </AnimatePresence>
        {images.length > 1 && [{ d: -1, icon: 'solar:alt-arrow-left-linear', pos: 'left-4', label: 'Imagen anterior' }, { d: 1, icon: 'solar:alt-arrow-right-linear', pos: 'right-4', label: 'Imagen siguiente' }].map((b) => (
          <button key={b.d} type="button" aria-label={b.label} onClick={() => step(b.d)} className={`absolute ${b.pos} top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-white/90 opacity-0 shadow-sm transition-opacity duration-300 group-hover:opacity-100 [@media(hover:none)]:opacity-100`} style={{ color: t.ink }}>
            <Icon icon={b.icon} width={20} />
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function QtyStepper({ t, qty, setQty, disabled }: { t: Theme; qty: number; setQty: (n: number) => void; disabled: boolean }) {
  const [text, setText] = useState(String(qty));
  useEffect(() => setText(String(qty)), [qty]);
  return (
    <div className="flex h-14 w-full items-center justify-between bg-white px-2 sm:w-36" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
      <button type="button" aria-label="Restar" disabled={disabled} onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-10 w-10 items-center justify-center disabled:opacity-30" style={{ color: t.ink }}><Icon icon="solar:minus-circle-linear" width={22} /></button>
      <input type="text" inputMode="numeric" aria-label="Cantidad" disabled={disabled} value={text} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setText(d); if (d) setQty(Math.max(1, parseInt(d, 10))); }} onBlur={() => { const n = Math.max(1, parseInt(text || '1', 10) || 1); setQty(n); setText(String(n)); }} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[16px] font-semibold outline-none focus:ring-0" style={{ color: t.ink }} />
      <button type="button" aria-label="Sumar" disabled={disabled} onClick={() => setQty(Math.max(1, qty) + 1)} className="flex h-10 w-10 items-center justify-center disabled:opacity-30" style={{ color: t.ink }}><Icon icon="solar:add-circle-linear" width={22} /></button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════ PESTAÑAS ══
function DetailTabs({ t, producto, tienda, ch, marca, categoria, sku }: { t: Theme; producto: any; tienda: any; ch: Channels; marca: string; categoria: string; sku?: string }) {
  const specs: [string, string][] = Object.entries(producto?.atributosTecnicos || {})
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '' && typeof v !== 'object')
    .map(([k, v]) => [k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase()), String(v)]);
  const rows: [string, string][] = [];
  if (sku) rows.push(['SKU', String(sku)]);
  if (categoria) rows.push(['Categoría', categoria]);
  if (marca) rows.push(['Marca', marca]);
  optionsOf(producto).forEach((o) => { if (o.valores?.length) rows.push([o.nombre, o.valores.join(', ')]); });
  rows.push(...specs);
  const envio = Number(tienda?.costoEnvioFijo || 0);
  const minPrep = Number(tienda?.tiempoPreparacionMin || 0);
  const shipping = [
    { icon: 'solar:delivery-linear', title: 'Envío', text: tienda?.aceptaEnvio === false ? 'Por ahora no realizamos envíos a domicilio.' : envio > 0 ? `Envío a domicilio desde ${elMoney(envio)}.` : 'Envío a domicilio. El costo se muestra al finalizar tu compra.' },
    { icon: 'solar:shop-2-linear', title: 'Recojo', text: tienda?.aceptaRecojo ? `Listo ${minPrep > 0 ? `en aprox. ${minPrep} min` : 'en poco tiempo'}${ch.pickupAddress ? ` en ${ch.pickupAddress}` : ''}.` : 'Por ahora solo realizamos envíos.' },
    { icon: 'solar:map-arrow-square-linear', title: 'Seguimiento', text: 'Al confirmar tu compra recibes un código para seguir tu pedido.' },
  ];
  const description = producto?.descripcionLarga ? htmlToText(producto.descripcionLarga) : '';
  const tabs = [...(description ? [{ key: 'desc', label: 'Descripción' }] : []), ...(rows.length ? [{ key: 'spec', label: 'Detalles' }] : []), { key: 'ship', label: 'Envío y recojo' }];
  const [active, setActive] = useState(tabs[0].key);

  return (
    <section className="mt-14">
      <div className="flex gap-1 overflow-x-auto border-b [scrollbar-width:none]" style={{ borderColor: t.line }} role="tablist">
        {tabs.map((tab) => (
          <button key={tab.key} type="button" role="tab" aria-selected={active === tab.key} onClick={() => setActive(tab.key)} className={`${labelCls} relative shrink-0 px-5 py-4 transition-colors duration-300`} style={{ color: active === tab.key ? t.ink : t.muted }}>
            {tab.label}
            {active === tab.key && <motion.span layoutId="el-detail-tab" className="absolute inset-x-3 -bottom-px h-[2px]" style={{ background: t.ink }} transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: elEase }} className="py-8">
          {active === 'desc' && <p className="max-w-3xl whitespace-pre-line text-[14.5px] leading-[1.75]" style={{ color: mix(t.ink, 78, t.bg) }}>{description}</p>}
          {active === 'spec' && (
            <dl className="max-w-3xl overflow-hidden border bg-white" style={{ borderColor: t.line }}>
              {rows.map(([k, v], i) => (
                <div key={`${k}-${i}`} className="grid grid-cols-[minmax(110px,200px)_1fr] gap-4 px-6 py-3.5 text-[13.5px]" style={{ background: i % 2 ? '#fff' : t.soft }}>
                  <dt className="font-semibold" style={{ color: t.muted }}>{k}</dt>
                  <dd className="font-semibold" style={{ color: t.ink }}>{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {active === 'ship' && (
            <div className="grid gap-3 sm:grid-cols-3">
              {shipping.map((s) => (
                <div key={s.title} className="border bg-white p-6" style={{ borderColor: t.line }}>
                  <Icon icon={s.icon} width={26} style={{ color: t.primaryInk }} />
                  <p className={`${labelCls} mt-4`} style={{ color: t.ink }}>{s.title}</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: t.muted }}>{s.text}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════ BARRA FIJA ══
/** Aparece cuando los botones de compra salen de pantalla. Estado aislado. */
function StickyBuyBar({ t, watchRef, producto, image, price, disabled, onAdd, onBuy }: { t: Theme; watchRef: RefObject<HTMLDivElement | null>; producto: any; image?: string; price: number; disabled: boolean; onAdd: () => void; onBuy: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = watchRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [watchRef]);
  if (disabled) return null;
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ y: 110 }} animate={{ y: 0 }} exit={{ y: 110 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md" style={{ borderColor: t.line, background: mix(t.bg, 94, 'transparent') }}>
          <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-3 lg:px-10">
            {image && <span className="hidden h-12 w-12 shrink-0 items-center justify-center overflow-hidden sm:flex" style={{ background: t.soft }}><img src={image} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" /></span>}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold" style={{ color: t.ink }}>{producto?.descripcion}</p>
              <p className="text-[15px] font-semibold" style={{ color: t.ink }}>{elMoney(price)}</p>
            </div>
            <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={onAdd} className={`${btnCls} h-12 px-6`} style={{ background: t.primary, color: t.onPrimary }}>
              <Icon icon="solar:cart-plus-linear" width={19} /> <span className="hidden sm:inline">Agregar</span>
            </motion.button>
            <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={onBuy} className={`${btnCls} hidden h-12 bg-white px-6 md:flex`} style={{ boxShadow: `inset 0 0 0 1.5px ${t.ink}`, color: t.ink }}>Comprar ahora</motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════ WRAPPER (datos) ══
export default function ElanProductoDetalle() {
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
    try { const saved = localStorage.getItem(`tienda:${slug}:carrito`); if (saved) setCarrito(JSON.parse(saved)); } catch { /* carrito corrupto: se ignora */ }
    return onTiendaCartCleared(slug, () => { setCarrito([]); setMostrarCarrito(false); });
  }, [slug]);

  // El checkout lee el carrito de aquí.
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
        // Primero los que tienen foto: en moda una tarjeta sin foto no vende.
        setRelated(withPricingList([...pool.filter((p: any) => p?.imagenUrl), ...pool.filter((p: any) => !p?.imagenUrl)].slice(0, 10)));
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
  if (loading && !producto) return <div className="flex min-h-screen items-center justify-center bg-white"><Icon icon="solar:refresh-linear" className="h-10 w-10 animate-spin text-stone-300" /></div>;
  if (!producto) return null;

  return (
    <ElanProductoDetalleView
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
