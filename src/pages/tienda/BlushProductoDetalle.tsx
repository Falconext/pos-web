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
  BlushHeader, BlushFooter, BlushCartModal, Stars, Monogram, buildServices,
  blushTheme, useBlushFont, editable, blMoney, nameOf, btnCls, type Theme,
} from '@/templates/maquillaje/BlushParts';
import { ProductRail, OfferCountdown, soonestOfferEnd, storeChannels, getName, type Channels } from '@/templates/maquillaje/BlushSections';
import { mix, blEase, blHeroText, blStagger } from '@/templates/maquillaje/motion';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';
const optionsOf = (p: any): { nombre: string; valores: string[] }[] => (Array.isArray(p?.opcionesAtributos) ? p.opcionesAtributos : []);

/** Convierte el HTML del editor en texto legible (sin etiquetas ni entidades). */
const htmlToText = (html: any): string => {
  let s = String(html || '').replace(/<\/(p|div|li|h[1-6])>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
  if (typeof document !== 'undefined') { const ta = document.createElement('textarea'); ta.innerHTML = s; s = ta.value; }
  return s.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n').trim();
};

export function BlushProductoDetalleView({ tienda, slug, producto, related = [], allCategories = [], carrito, setCarrito, mostrarCarrito, setMostrarCarrito, actualizarCantidad, onNavigate, onAddToCart }: any) {
  useBlushFont();
  const navigate = useNavigate();
  const diseno = tienda?.diseno || {};
  const t = blushTheme(diseno);
  const ch = storeChannels(tienda, diseno);
  const pricing = getProductPricing(producto);
  const [showFav, setShowFav] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);

  // ── Variantes reales (tono / tamaño / acabado) ──
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
  const shortDesc = producto?.descripcionLarga ? htmlToText(producto.descripcionLarga) : '';

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
  const chosen = hasVariants ? options.map((o) => selection[o.nombre]).filter(Boolean).join(' / ') : '';
  const askUrl = ch.wa(`Hola, tengo una consulta sobre ${producto?.descripcion}${chosen ? ` (${chosen})` : ''}.`);
  const crumbCls = 'uppercase transition-colors hover:text-stone-900';

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden pb-24" style={{ background: t.bg, fontFamily: t.font }}>
        <BlushHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={nav} active="catalog" activeCategory={categoria} />

        <nav aria-label="Ruta" className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-1.5 px-4 pt-7 text-[11px] tracking-[0.14em] lg:px-8" style={{ color: t.muted }}>
          <button type="button" onClick={() => go(`/tienda/${slug}`, 'home')} className={crumbCls}>Inicio</button>
          <span aria-hidden>/</span>
          <button type="button" onClick={() => go(`/tienda/${slug}/catalogo`, 'catalogo')} className={crumbCls}>Tienda</button>
          {categoria && <><span aria-hidden>/</span><button type="button" onClick={() => go(`/tienda/${slug}/catalogo?category=${encodeURIComponent(categoria)}`, 'catalogo')} className={crumbCls}>{categoria}</button></>}
          <span aria-hidden>/</span>
          <span className="line-clamp-1 max-w-[260px] uppercase" style={{ color: t.ink }}>{producto?.descripcion}</span>
        </nav>

        <main className="mx-auto max-w-[1280px] px-4 py-7 lg:px-8">
          <section className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
            <Gallery t={t} images={images} name={producto?.descripcion} producto={producto} slug={slug} discount={showStrike ? pricing.porcentajeDescuento : 0} isOut={isOut} />

            <motion.div variants={blStagger} initial="hidden" animate="show" className="min-w-0 lg:pt-2">
              <motion.div variants={blHeroText} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
                {marca && <span style={{ color: t.ink }}>{marca}</span>}
                {marca && categoria && <span aria-hidden style={{ color: t.line }}>|</span>}
                {categoria && <button type="button" onClick={() => go(`/tienda/${slug}/catalogo?category=${encodeURIComponent(categoria)}`, 'catalogo')} className="uppercase transition-opacity hover:opacity-60" style={{ color: t.primaryInk }}>{categoria}</button>}
              </motion.div>
              <motion.h1 variants={blHeroText} className="mt-3 text-[26px] font-medium uppercase leading-[1.12] tracking-[0.03em] sm:text-[32px]" style={{ color: t.ink }}>{producto?.descripcion}</motion.h1>
              {(Number(producto?.ratingCount || 0) > 0 || activeVariant?.codigo || producto?.codigo) && (
                <motion.div variants={blHeroText} className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]" style={{ color: t.muted }}>
                  <Stars producto={producto} t={t} size={13} />
                  {(activeVariant?.codigo || producto?.codigo) && <span>Código: <span style={{ color: t.ink }}>{activeVariant?.codigo || producto.codigo}</span></span>}
                </motion.div>
              )}

              <motion.div variants={blHeroText} className="mt-6 flex flex-wrap items-baseline gap-3">
                <span className="text-[28px] font-medium leading-none" style={{ color: t.ink }}>{blMoney(price)}</span>
                {showStrike && <span className="text-[15px] line-through" style={{ color: t.muted }}>{blMoney(pricing.precioRegular)}</span>}
                {showStrike && <span className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ background: t.accent, color: t.onAccent }}>-{pricing.porcentajeDescuento}%</span>}
              </motion.div>
              {offerEnd && (
                <motion.div variants={blHeroText} className="mt-4 inline-flex flex-wrap items-center gap-3 py-1.5 pl-4 pr-1.5" style={{ background: t.blush }}>
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em]" style={{ color: t.ink }}>La oferta termina en</span>
                  <OfferCountdown t={t} endsAt={offerEnd} />
                </motion.div>
              )}
              {shortDesc && <motion.p variants={blHeroText} className="mt-5 line-clamp-3 max-w-xl text-[14px] leading-relaxed" style={{ color: mix(t.ink, 72, t.bg) }}>{shortDesc}</motion.p>}

              {/* Tono / color */}
              {hasVariants && colors.length > 0 && (
                <motion.div variants={blHeroText} className="mt-7">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: t.ink }}>{colorName}: <span className="font-normal normal-case tracking-normal" style={{ color: t.muted }}>{selectedColor || 'Elige uno'}</span></p>
                  <div className="flex flex-wrap gap-2.5">
                    {colors.map((c) => {
                      const active = selectedColor === c.name;
                      const available = isFashionVariantAvailable(producto, { [colorName]: c.name });
                      return (
                        <button key={c.name} type="button" title={c.name} aria-label={c.name} aria-pressed={active} onClick={() => { setHint(false); setSelection((cur) => ({ ...cur, [colorName]: c.name })); }} className="relative flex h-11 w-11 items-center justify-center rounded-full transition-shadow" style={{ boxShadow: active ? `0 0 0 1.5px ${t.ink}` : 'none', opacity: available ? 1 : 0.4 }}>
                          {c.useImage && c.image ? <img src={c.image} alt="" className="h-9 w-9 rounded-full object-cover" /> : <span className="h-9 w-9 rounded-full" style={{ background: c.hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.1)' }} />}
                          {!available && <span aria-hidden className="absolute h-px w-10 rotate-45" style={{ background: t.ink }} />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Tamaño / acabado y otras opciones */}
              {hasVariants && options.filter((o) => o.nombre !== colorName || !colors.length).map((op) => (
                <motion.div key={op.nombre} variants={blHeroText} className="mt-6">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: t.ink }}>{op.nombre}{selection[op.nombre] ? <span className="font-normal normal-case tracking-normal" style={{ color: t.muted }}>: {selection[op.nombre]}</span> : ''}</p>
                  <div className="flex flex-wrap gap-2">
                    {op.valores.map((val) => {
                      const active = selection[op.nombre] === val;
                      const available = isFashionVariantAvailable(producto, { ...selection, [op.nombre]: val });
                      return (
                        <button key={val} type="button" disabled={!available} aria-pressed={active} onClick={() => { setHint(false); setSelection((cur) => ({ ...cur, [op.nombre]: val })); }} className="relative flex h-10 min-w-[52px] items-center justify-center px-4 text-[12.5px] transition-colors disabled:cursor-not-allowed" style={active ? { background: t.ink, color: '#fff' } : { background: '#fff', boxShadow: `inset 0 0 0 1px ${t.line}`, color: available ? t.ink : mix(t.ink, 30, '#fff') }}>
                          {val}
                          {!available && <span aria-hidden className="absolute h-px w-8 -rotate-45" style={{ background: mix(t.ink, 25, '#fff') }} />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ))}

              <motion.div variants={blHeroText} className="mt-6 inline-flex items-center gap-2 text-[12px]" style={{ color: isOut ? t.muted : t.ink }}>
                <span className="h-2 w-2 rounded-full" style={{ background: isOut ? mix(t.ink, 25, '#fff') : stock <= 5 && (!hasVariants || allSelected) ? t.primary : '#3FA36B' }} />
                {hasVariants && !allSelected ? `Elige ${String(missing || 'una opción').toLowerCase()} para ver disponibilidad` : isOut ? 'Sin stock en esta opción' : stock <= 5 ? `Quedan ${stock} unidades` : 'Disponible'}
              </motion.div>

              <motion.div variants={blHeroText} ref={ctaRef} className="mt-4 flex flex-col gap-3 sm:flex-row">
                <QtyStepper t={t} qty={qty} setQty={setQty} disabled={isOut} />
                <button type="button" disabled={isOut} onClick={() => addMain()} className={`${btnCls} h-[52px] w-full sm:flex-1 disabled:cursor-not-allowed disabled:opacity-50`} style={{ background: t.accent, color: t.onAccent }}>
                  <Icon icon="solar:bag-3-linear" width={17} /> {isOut ? 'Agotado' : 'Agregar a la bolsa'}
                </button>
              </motion.div>
              <motion.div variants={blHeroText}>
                <button type="button" disabled={isOut} onClick={buyNow} className={`${btnCls} mt-3 h-[52px] w-full bg-white disabled:cursor-not-allowed disabled:opacity-50`} style={{ boxShadow: `inset 0 0 0 1px ${t.ink}`, color: t.ink }}>
                  Comprar ahora
                </button>
              </motion.div>
              <AnimatePresence>
                {hint && !canAdd && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 text-[12.5px]" style={{ color: t.primaryInk }}>
                    {missing ? `Selecciona ${missing.toLowerCase()} para continuar.` : 'Esta combinación no está disponible.'}
                  </motion.p>
                )}
              </AnimatePresence>

              {askUrl && (
                <motion.a variants={blHeroText} href={askUrl} target="_blank" rel="noopener noreferrer" className="group mt-5 flex items-center gap-4 p-4" style={{ background: t.blushSoft }}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white" style={{ color: '#1FA855' }}><Icon icon="ic:baseline-whatsapp" width={22} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: t.ink }}>¿Dudas con tu tono?</p>
                    <p className="text-[12.5px]" style={{ color: t.muted }}>Escríbenos y te ayudamos a elegir</p>
                  </div>
                  <Icon icon="solar:arrow-right-linear" width={18} className="transition-transform duration-300 group-hover:translate-x-1" style={{ color: t.ink }} />
                </motion.a>
              )}

              <motion.ul variants={blHeroText} className="mt-6 grid gap-px sm:grid-cols-3" style={{ background: t.line, boxShadow: `0 0 0 1px ${t.line}` }}>
                {services.map((s) => (
                  <li key={s.label} className="flex items-center gap-2.5 bg-white px-3.5 py-3.5">
                    <Icon icon={s.icon} width={19} className="shrink-0" style={{ color: t.ink }} />
                    <div className="min-w-0 leading-tight"><p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: t.ink }}>{s.label}</p><p className="mt-0.5 line-clamp-2 text-[11px]" style={{ color: t.muted }}>{s.sub}</p></div>
                  </li>
                ))}
              </motion.ul>
            </motion.div>
          </section>

          <DetailTabs key={producto?.id} t={t} producto={producto} tienda={tienda} ch={ch} marca={marca} categoria={categoria} sku={activeVariant?.codigo || producto?.codigo} />
        </main>

        {related.length > 0 && <ProductRail t={t} title={editable(diseno?.maquillajeRelatedTitle, 'También te puede gustar')} products={related} slug={slug} onOpen={goProduct} onAdd={(p: any, q?: number) => pushItem({ ...p, cartId: String(p.id), productoId: p.id, cantidad: Math.max(1, q || 1), precioUnitario: getProductPricing(p).precioFinal })} />}

        <BlushFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={nav} />

        <StickyBuyBar t={t} watchRef={ctaRef} producto={producto} image={images[0]} price={price} disabled={isOut} onAdd={() => addMain()} onBuy={buyNow} />
        <BlushCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => go(`/tienda/${slug}/checkout`, 'checkout')} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.accent} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.accent} onGoProduct={(item: any) => goProduct(item)} />
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
  const sig = images.join('|');
  useEffect(() => setIdx(0), [sig]);
  const src = images[idx];
  const step = (d: number) => setIdx((v) => (v + d + images.length) % images.length);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: blEase }} className="flex flex-col-reverse gap-3 lg:sticky lg:top-28 lg:flex-row lg:self-start">
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] lg:max-h-[620px] lg:w-[80px] lg:flex-col lg:overflow-y-auto lg:pb-0">
          {images.slice(0, 8).map((img, i) => (
            <button key={`${img}-${i}`} type="button" aria-label={`Ver imagen ${i + 1}`} onClick={() => setIdx(i)} className="relative h-[92px] w-[74px] shrink-0 overflow-hidden lg:h-[100px] lg:w-[80px]" style={{ background: t.card }}>
              <img src={img} alt="" className="h-full w-full object-contain p-1.5 mix-blend-multiply" />
              {i === idx && <motion.span layoutId="bl-thumb-ring" className="absolute inset-0" style={{ boxShadow: `inset 0 0 0 1.5px ${t.ink}` }} transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
            </button>
          ))}
        </div>
      )}
      <div
        className="group relative aspect-[4/5] min-w-0 flex-1 overflow-hidden lg:aspect-square"
        style={{ background: t.card, cursor: src && canHover ? 'zoom-in' : 'default' }}
        onMouseEnter={() => src && canHover && setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        onMouseMove={(e) => {
          if (!zoomRef.current) return;
          const r = e.currentTarget.getBoundingClientRect();
          zoomRef.current.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
        }}
      >
        <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
          {discount > 0 && <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ background: t.accent, color: t.onAccent }}>-{discount}%</span>}
          {isOut && <span className="bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: t.muted }}>Agotado</span>}
        </div>
        <div className="absolute right-4 top-4 z-10"><ProductCardActions producto={producto} slug={slug} cp={t.accent} /></div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={src || 'empty'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0">
            <div ref={zoomRef} className="h-full w-full transition-transform duration-300 ease-out" style={{ transform: zooming ? 'scale(1.9)' : 'scale(1)', background: t.card }}>
              {src ? <img src={src} alt={name || ''} className={`h-full w-full object-contain p-10 mix-blend-multiply sm:p-14 ${isOut ? 'opacity-60 grayscale' : ''}`} />
                : <Monogram t={t} text={name} size={160} />}
            </div>
          </motion.div>
        </AnimatePresence>
        {images.length > 1 && [{ d: -1, icon: 'solar:alt-arrow-left-linear', pos: 'left-4', label: 'Imagen anterior' }, { d: 1, icon: 'solar:alt-arrow-right-linear', pos: 'right-4', label: 'Imagen siguiente' }].map((b) => (
          <button key={b.d} type="button" aria-label={b.label} onClick={() => step(b.d)} className={`absolute ${b.pos} top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-white/90 opacity-0 shadow-sm transition-opacity duration-300 group-hover:opacity-100 [@media(hover:none)]:opacity-100`} style={{ color: t.ink }}>
            <Icon icon={b.icon} width={18} />
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
    <div className="flex h-[52px] w-full items-center justify-between bg-white px-1 sm:w-32" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
      <button type="button" aria-label="Restar" disabled={disabled} onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-10 w-10 items-center justify-center text-[18px] disabled:opacity-30" style={{ color: t.ink }}>−</button>
      <input type="text" inputMode="numeric" aria-label="Cantidad" disabled={disabled} value={text} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setText(d); if (d) setQty(Math.max(1, parseInt(d, 10))); }} onBlur={() => { const n = Math.max(1, parseInt(text || '1', 10) || 1); setQty(n); setText(String(n)); }} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[15px] font-medium outline-none focus:ring-0" style={{ color: t.ink }} />
      <button type="button" aria-label="Sumar" disabled={disabled} onClick={() => setQty(Math.max(1, qty) + 1)} className="flex h-10 w-10 items-center justify-center text-[18px] disabled:opacity-30" style={{ color: t.ink }}>+</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════ PESTAÑAS ══
function DetailTabs({ t, producto, tienda, ch, marca, categoria, sku }: { t: Theme; producto: any; tienda: any; ch: Channels; marca: string; categoria: string; sku?: string }) {
  const specs: [string, string][] = Object.entries(producto?.atributosTecnicos || {})
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '' && typeof v !== 'object')
    .map(([k, v]) => [k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase()), String(v)]);
  const rows: [string, string][] = [];
  if (sku) rows.push(['Código', String(sku)]);
  if (categoria) rows.push(['Categoría', categoria]);
  if (marca) rows.push(['Marca', marca]);
  optionsOf(producto).forEach((o) => { if (o.valores?.length) rows.push([o.nombre, o.valores.join(', ')]); });
  rows.push(...specs);
  const envio = Number(tienda?.costoEnvioFijo || 0);
  const minPrep = Number(tienda?.tiempoPreparacionMin || 0);
  const shipping = [
    { icon: 'solar:delivery-linear', title: 'Envío', text: tienda?.aceptaEnvio === false ? 'Por ahora no realizamos envíos a domicilio.' : envio > 0 ? `Envío a domicilio desde ${blMoney(envio)}.` : 'Envío a domicilio. El costo se muestra al finalizar tu compra.' },
    { icon: 'solar:shop-2-linear', title: 'Recojo', text: tienda?.aceptaRecojo ? `Listo ${minPrep > 0 ? `en aprox. ${minPrep} min` : 'en poco tiempo'}${ch.pickupAddress ? ` en ${ch.pickupAddress}` : ''}.` : 'Por ahora solo realizamos envíos.' },
    { icon: 'solar:map-arrow-square-linear', title: 'Seguimiento', text: 'Al confirmar tu compra recibes un código para seguir tu pedido.' },
  ];
  const description = producto?.descripcionLarga ? htmlToText(producto.descripcionLarga) : '';
  const tabs = [...(description ? [{ key: 'desc', label: 'Descripción' }] : []), ...(rows.length ? [{ key: 'spec', label: 'Detalles' }] : []), { key: 'ship', label: 'Envío y recojo' }];
  const [active, setActive] = useState(tabs[0].key);

  return (
    <section className="mt-16">
      <div className="flex justify-start gap-8 overflow-x-auto border-b [scrollbar-width:none] sm:justify-center" style={{ borderColor: t.line }} role="tablist">
        {tabs.map((tab) => (
          <button key={tab.key} type="button" role="tab" aria-selected={active === tab.key} onClick={() => setActive(tab.key)} className="relative shrink-0 py-4 text-[11.5px] font-semibold uppercase tracking-[0.18em] transition-colors duration-300" style={{ color: active === tab.key ? t.ink : t.muted }}>
            {tab.label}
            {active === tab.key && <motion.span layoutId="bl-detail-tab" className="absolute inset-x-0 -bottom-px h-[2px]" style={{ background: t.ink }} transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: blEase }} className="mx-auto max-w-3xl py-10">
          {active === 'desc' && <p className="whitespace-pre-line text-[14.5px] leading-[1.8]" style={{ color: mix(t.ink, 78, t.bg) }}>{description}</p>}
          {active === 'spec' && (
            <dl className="border-t" style={{ borderColor: t.line }}>
              {rows.map(([k, v], i) => (
                <div key={`${k}-${i}`} className="grid grid-cols-[minmax(110px,200px)_1fr] gap-4 border-b py-3.5 text-[13.5px]" style={{ borderColor: t.line }}>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: t.muted }}>{k}</dt>
                  <dd style={{ color: t.ink }}>{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {active === 'ship' && (
            <div className="grid gap-4 sm:grid-cols-3">
              {shipping.map((s) => (
                <div key={s.title} className="p-6" style={{ background: t.blushSoft }}>
                  <Icon icon={s.icon} width={24} style={{ color: t.ink }} />
                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: t.ink }}>{s.title}</p>
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
          <div className="mx-auto flex max-w-[1280px] items-center gap-4 px-4 py-3 lg:px-8">
            <span className="hidden h-12 w-10 shrink-0 overflow-hidden sm:block" style={{ background: t.card }}>{image ? <img src={image} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" /> : <Monogram t={t} text={producto?.descripcion} size={18} />}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-medium uppercase tracking-[0.06em]" style={{ color: t.ink }}>{producto?.descripcion}</p>
              <p className="text-[14px] font-semibold" style={{ color: t.ink }}>{blMoney(price)}</p>
            </div>
            <button type="button" onClick={onAdd} className={`${btnCls} h-11 px-5`} style={{ background: t.accent, color: t.onAccent }}>
              <Icon icon="solar:bag-3-linear" width={16} /> <span className="hidden sm:inline">Agregar</span>
            </button>
            <button type="button" onClick={onBuy} className={`${btnCls} hidden h-11 bg-white px-6 md:flex`} style={{ boxShadow: `inset 0 0 0 1px ${t.ink}`, color: t.ink }}>Comprar ahora</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════ WRAPPER (datos) ══
export default function BlushProductoDetalle() {
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
  if (loading && !producto) return <div className="flex min-h-screen items-center justify-center bg-white"><Icon icon="solar:refresh-linear" className="h-10 w-10 animate-spin text-stone-300" /></div>;
  if (!producto) return null;

  return (
    <BlushProductoDetalleView
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
