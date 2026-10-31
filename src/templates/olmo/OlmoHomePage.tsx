import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { buildCategoryTiles } from '@/templates/shared/categoryTiles';
import { getProductPricing } from '@/templates/shared/pricing';
import { sinStock } from '@/templates/shared/ventaSinStock';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import ProductCardActions from '@/components/tienda/ProductCardActions';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import {
  OlmoHeader, OlmoFooter, OlmoCartModal, buildServices, tileFor,
  olTheme, useOlmoFont, editable, optional, isOn, btnCls, olMoney, storeNameOf, nameOf, type Theme, type Service,
} from './OlmoParts';
import { SectionHeader, ProductRail, RailEndCard, GridSkeleton, OfferCountdown, storeChannels, soonestOfferEnd, getName, hasImage, categoryIcon, useCategoryCounts, type OpenFn, type AddFn, type Channels } from './OlmoSections';
import { olEase, olHeroText, olItem, olPop, olReveal, olStagger, olViewport, mix } from './motion';
import { productoEnCategoria } from '@/components/tienda/navTienda';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';
const u = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Fotos de ejemplo (reemplazables en Personalizar). */
export const OLMO_IMG = {
  hero: u('1606522754091-a3bbf9ad4cb3', 1100),
  promo: u('1594223274512-ad4803739b7c', 1200),
  club: u('1590874103328-eac38a683ce7', 900),
};

const hasVariants = (p: any) => Array.isArray(p?.variantes) && p.variantes.length > 0;
const inStock = (p: any) => !sinStock(Number(p?.stock ?? 1));

// ═════════════════════════════════════════════════════════════════ PAGE ══
export default function OlmoHomePage(props: TemplateHomePageProps) {
  const { tienda, slug, productos, allCategories, diseno, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, agregarAlCarrito, actualizarCantidad, loading } = props as any;
  useOlmoFont();
  const navigate = useNavigate();
  const t = olTheme(diseno);
  const d = diseno || {};
  const [showFav, setShowFav] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);

  const list: any[] = useMemo(() => (Array.isArray(productos) ? productos : []), [productos]);
  const withImg = useMemo(() => list.filter(hasImage), [list]);
  const categories: string[] = useMemo(() => (allCategories || []).map(getName).filter(Boolean), [allCategories]);

  // Ofertas reales (precio de oferta vigente), de mayor a menor descuento.
  const offers = useMemo(() => list
    .filter((p) => inStock(p) && getProductPricing(p).enOferta)
    .sort((a, b) => getProductPricing(b).porcentajeDescuento - getProductPricing(a).porcentajeDescuento), [list]);
  const maxOff = offers.length ? getProductPricing(offers[0]).porcentajeDescuento : 0;
  const offersEnd = useMemo(() => soonestOfferEnd(offers), [offers]);

  // Vitrina "de la casa": sin agotados; destacados primero y luego mejor valorados (reseñas reales).
  const favorites = useMemo(() => {
    const pool = list.filter(inStock);
    const score = (p: any) => (p?.destacado ? 1000 : 0) + Number(p?.ratingAvg || 0) * Math.min(Number(p?.ratingCount || 0), 20);
    return [...pool].sort((a, b) => score(b) - score(a)).slice(0, 12);
  }, [list]);
  // Tarjeta flotante del hero: piezas con foto, destacadas u ofertas primero.
  const spotlight = useMemo(() => {
    const pool = [...withImg.filter((p) => p?.destacado && inStock(p)), ...offers.filter(hasImage), ...withImg.filter(inStock)];
    return pool.filter((p, i) => pool.findIndex((x) => x.id === p.id) === i).slice(0, 3);
  }, [withImg, offers]);

  const tiles = useMemo(() => buildCategoryTiles({ allCategories, diseno, prefix: 'olmo', count: 7, fallbackImages: [] }).map((tile) => {
    const same = (p: any) => productoEnCategoria(p, tile.nombre);
    const fromProduct = tile.imagenUrl ? '' : withImg.find(same)?.imagenUrl || '';
    return { ...tile, imagenUrl: tile.imagenUrl || fromProduct, isProduct: Boolean(fromProduct) };
  }), [allCategories, diseno, withImg]);
  const tileNames = useMemo(() => tiles.map((x) => x.nombre), [tiles]);
  const counts = useCategoryCounts(slug, tileNames, list);

  const ch = storeChannels(tienda, diseno);
  const services = useMemo(() => buildServices(tienda, ch.hasWhatsapp), [tienda, ch.hasWhatsapp]);
  const cartCount = (carrito || []).reduce((s: number, i: any) => s + Number(i?.cantidad || 1), 0);
  const goCatalog = () => navigate(`/tienda/${slug}/catalogo`);
  const goCategory = (name: string) => navigate(`/tienda/${slug}/catalogo?category=${encodeURIComponent(name)}`);
  const goProduct: OpenFn = (p) => navigate(`/tienda/${slug}/producto/${p.id}`);
  const add: AddFn = (p, qty = 1) => agregarAlCarrito({ ...p, __cantidad: qty });
  const goAction = (key: string) => runStoreLinkAction(getStoreLinkAction(diseno, key, { defaultType: 'catalog' }), { slug, navigate });
  const scrollToDeals = () => document.getElementById('olmo-ofertas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, fontFamily: t.font }}>
        <OlmoHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={navigate} active="home" />

        <Hero t={t} diseno={diseno} slug={slug} services={services} spotlight={spotlight}
          onCta={() => (d.olmoHeroAction ? goAction('olmoHeroAction') : goCatalog())} onOpen={goProduct} onAdd={add} />

        {!isOn(d.olmoCategoriesHidden) && tiles.length > 0 && <CategoryCircles t={t} diseno={diseno} tiles={tiles} counts={counts} onPick={goCategory} onMore={goCatalog} />}

        {loading && !list.length && (
          <section className="mx-auto max-w-[1320px] px-4 pt-12 sm:px-6"><GridSkeleton t={t} count={4} /></section>
        )}

        {!isOn(d.olmoPromoHidden) && (
          <PromoBanner t={t} diseno={diseno} maxOff={maxOff} endsAt={offersEnd}
            onCta={() => (d.olmoPromoAction ? goAction('olmoPromoAction') : offers.length ? scrollToDeals() : goCatalog())} />
        )}

        {!isOn(d.olmoDealsHidden) && offers.length > 0 && (
          <div id="olmo-ofertas" className="scroll-mt-32">
            <ProductRail t={t} eyebrow={maxOff > 0 ? `Hasta -${maxOff}%` : undefined} title={editable(d.olmoDealsTitle, 'En oferta ahora')} products={offers.slice(0, 12)} slug={slug} onOpen={goProduct} onAdd={add} onMore={goCatalog}
              endCard={offers.length < 6 ? <RailEndCard t={t} title={editable(d.olmoDealsEndTitle, 'Descubre toda la colección')} label={editable(d.olmoMoreLabel, 'Ver todo')} onClick={goCatalog} /> : undefined}
              right={offersEnd ? <div className="flex items-center gap-3"><span className="hidden text-[12px] font-semibold uppercase tracking-[0.12em] sm:block" style={{ color: t.muted }}>Termina en</span><OfferCountdown t={t} endsAt={offersEnd} /></div> : undefined} />
          </div>
        )}

        {favorites.length > 0 && (
          <ProductRail t={t} title={editable(d.olmoBestTitle, 'Favoritas de la casa')} subtitle={optional(d.olmoBestSubtitle, '')} products={favorites} slug={slug} onOpen={goProduct} onAdd={add} onMore={goCatalog} moreLabel={editable(d.olmoMoreLabel, 'Ver todo')} />
        )}

        {!isOn(d.olmoClubHidden) && <Club t={t} diseno={diseno} ch={ch} storeName={storeNameOf(tienda)} />}

        {!isOn(d.olmoValuesHidden) && <Values t={t} diseno={diseno} services={services} categoriesCount={categories.length} />}

        <RealReviews t={t} slug={slug} products={list} diseno={diseno} />

        <OlmoFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <OlmoCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } })} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.primary} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.accent} onGoProduct={(item: any) => goProduct(item)} />
      </div>
    </MotionConfig>
  );
}

// ═══════════════════════════════════════════════════════════════════ HERO ══
/**
 * Hero de la referencia: sobre-título en arena, titular serif con remate en cursiva, botón píldora,
 * fila de beneficios reales en círculos y, a la derecha, foto en arco sobre un gran círculo con la
 * tarjeta flotante de productos reales.
 */
function Hero({ t, diseno, slug, services, spotlight, onCta, onOpen, onAdd }: { t: Theme; diseno: any; slug: string; services: Service[]; spotlight: any[]; onCta: () => void; onOpen: OpenFn; onAdd: AddFn }) {
  const d = diseno || {};
  const eyebrow = optional(d.olmoHeroEyebrow, 'La colección');
  const title = editable(d.olmoHeroTitle, 'Carteras que');
  const title2 = optional(d.olmoHeroTitle2, 'inspiran estilo.');
  const subtitle = optional(d.olmoHeroSubtitle, 'Carteras, mochilas y accesorios elegidos pieza por pieza para acompañarte todos los días.');
  const button = editable(d.olmoHeroButton, 'Comprar ahora');
  const perks = isOn(d.olmoHeroPerksHidden) ? [] : services.slice(0, 4);
  const image = d.olmoHeroImage || OLMO_IMG.hero;

  return (
    <section className="relative">
      <div className="relative mx-auto grid max-w-[1320px] items-center gap-12 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-6 lg:pb-16 lg:pt-14">
        <motion.div variants={olStagger} initial="hidden" animate="show" className="relative z-10 min-w-0">
          {eyebrow && <motion.p variants={olHeroText} className="text-[12px] font-semibold uppercase tracking-[0.2em]" style={{ color: t.accentInk }}>{eyebrow}</motion.p>}
          <motion.h1 variants={olHeroText} className="mt-5 text-[46px] font-medium leading-[1.04] tracking-[-0.02em] sm:text-[60px] xl:text-[70px]" style={{ color: t.ink, fontFamily: t.display }}>
            <span className="block">{title}</span>
            {title2 && <span className="block font-normal italic" style={{ color: t.primaryInk }}>{title2}</span>}
          </motion.h1>
          {subtitle && <motion.p variants={olHeroText} className="mt-6 max-w-[440px] text-[16px] leading-relaxed sm:text-[17px]" style={{ color: mix(t.ink, 72, t.bg) }}>{subtitle}</motion.p>}
          <motion.div variants={olHeroText} className="mt-8">
            <button type="button" onClick={onCta} className={`${btnCls} group h-[52px] px-8`} style={{ background: t.strong, color: t.onPrimary, boxShadow: `0 18px 34px -20px ${t.strong}` }}>
              {button} <Icon icon="ph:arrow-right" width={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </motion.div>
          {perks.length > 0 && (
            <motion.ul variants={olHeroText} className={`mt-8 grid max-w-[560px] grid-cols-2 gap-x-3 gap-y-4 sm:mt-11 sm:gap-x-4 sm:gap-y-6 ${perks.length >= 4 ? 'sm:grid-cols-4' : perks.length === 3 ? 'sm:grid-cols-3' : ''}`}>
              {perks.map((s) => (
                <li key={s.label} className="flex items-center gap-2.5 text-left sm:flex-col sm:items-center sm:gap-0 sm:text-center">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white/60 sm:h-[52px] sm:w-[52px]" style={{ borderColor: t.line, color: t.primaryInk }}><Icon icon={s.icon} width={22} /></span>
                  <span className="min-w-0 sm:contents"><span className="block text-[12.5px] font-semibold leading-tight sm:mt-2.5" style={{ color: t.ink }}>{s.label}</span>
                  <span className="mt-0.5 hidden text-[11.5px] leading-snug sm:block" style={{ color: t.muted }}>{s.sub}</span></span>
                </li>
              ))}
            </motion.ul>
          )}
        </motion.div>

        <div className="relative mx-auto w-full max-w-[680px]">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, ease: olPop }} className="relative aspect-[1/0.88] w-full">
            <div aria-hidden className="absolute left-[4%] top-[2%] aspect-square w-[78%] rounded-full" style={{ background: `radial-gradient(circle at 40% 35%, #fff, ${t.sand} 72%)` }} />
            <div className="absolute bottom-0 left-[14%] top-[10%] w-[52%] overflow-hidden rounded-t-full rounded-b-[30px] shadow-[0_40px_70px_-40px_rgba(31,28,24,0.55)]" style={{ background: t.soft }}>
              <img src={image} alt="" className="h-full w-full object-cover" />
            </div>
          </motion.div>
          {spotlight.length > 0 && (
            <div className="relative z-10 -mt-24 ml-auto w-[min(260px,72%)] sm:absolute sm:right-0 sm:top-[2%] sm:mt-0 sm:w-[250px]">
              <SpotlightCard t={t} slug={slug} products={spotlight} onOpen={onOpen} onAdd={onAdd} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Tarjeta flotante del hero (producto real, rota sola cada 5s, puntos para elegir).
 * Su propio intervalo vive aquí: no re-renderiza la página.
 */
function SpotlightCard({ t, slug, products, onOpen, onAdd }: { t: Theme; slug: string; products: any[]; onOpen: OpenFn; onAdd: AddFn }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (products.length < 2 || paused) return;
    const id = setInterval(() => setI((n) => (n + 1) % products.length), 5000);
    return () => clearInterval(id);
  }, [products.length, paused]);
  const p = products[Math.min(i, products.length - 1)];
  if (!p) return null;
  const pricing = getProductPricing(p);
  const variants = hasVariants(p);

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35, ease: olEase }}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      className="rounded-[22px] bg-white p-3 shadow-[0_34px_60px_-30px_rgba(31,28,24,0.45)]">
      <div className="relative aspect-[4/4.2] overflow-hidden rounded-[16px]" style={{ background: t.soft }}>
        <div className="absolute right-2 top-2 z-10 [&_button:nth-child(n+2)]:hidden"><ProductCardActions producto={p} slug={slug} cp={t.strong} /></div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.button key={p.id} type="button" onClick={() => onOpen(p)} aria-label={p.descripcion}
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: olEase }}
            className="absolute inset-0">
            <img src={p.imagenUrl} alt="" className="h-full w-full object-contain p-[10%] mix-blend-multiply" />
          </motion.button>
        </AnimatePresence>
        {pricing.enOferta && <span className="absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: t.strong, color: t.onPrimary }}>-{pricing.porcentajeDescuento}%</span>}
      </div>
      <div className="px-1.5 pb-1 pt-3">
        <button type="button" onClick={() => onOpen(p)} className="line-clamp-1 text-left text-[14.5px] font-semibold" style={{ color: t.ink }}>{p.descripcion}</button>
        {nameOf(p?.categoria) && <p className="truncate text-[12.5px]" style={{ color: t.muted }}>{nameOf(p.categoria)}</p>}
        <p className="mt-1.5 flex items-baseline gap-2 text-[16px] font-semibold" style={{ color: t.ink }}>
          {olMoney(pricing.precioFinal)}
          {pricing.enOferta && <span className="text-[12px] font-normal line-through" style={{ color: t.muted }}>{olMoney(pricing.precioRegular)}</span>}
        </p>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => (variants ? onOpen(p) : onAdd(p, 1))} className={`${btnCls} h-11 flex-1 text-[11.5px]`} style={{ background: t.strong, color: t.onPrimary }}>
            {variants ? 'Ver opciones' : 'Agregar'}
          </button>
          <button type="button" onClick={() => onOpen(p)} aria-label="Ver detalle" title="Ver detalle" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-[#F6F1E9]" style={{ borderColor: t.line, color: t.ink }}>
            <Icon icon="ph:plus" width={18} />
          </button>
        </div>
        {products.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {products.map((x, n) => (
              <button key={x.id} type="button" onClick={() => setI(n)} aria-label={`Producto ${n + 1}`} className="flex h-5 w-5 items-center justify-center">
                <span className="h-[7px] w-[7px] rounded-full border transition-colors" style={{ borderColor: t.strong, background: n === i ? t.strong : 'transparent' }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════ CATEGORÍAS ══
type Tile = { nombre: string; label: string; imagenUrl: string; isProduct?: boolean };

/** "Compra por categoría": panel blanco con círculos (foto real o del editor) y conteo real de piezas. */
function CategoryCircles({ t, diseno, tiles, counts, onPick, onMore }: { t: Theme; diseno: any; tiles: Tile[]; counts: Record<string, number>; onPick: (c: string) => void; onMore: () => void }) {
  const cols = tiles.length >= 7 ? 'lg:grid-cols-7' : tiles.length === 6 ? 'lg:grid-cols-6' : tiles.length === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4';
  return (
    <section className="mx-auto max-w-[1320px] px-4 sm:px-6">
      <div className="rounded-[28px] bg-white px-5 py-8 shadow-[0_24px_60px_-50px_rgba(31,28,24,0.45)] sm:px-9 sm:py-9">
        <SectionHeader t={t} title={editable(diseno?.olmoCategoriesTitle, 'Compra por categoría')} onMore={onMore} moreLabel={editable(diseno?.olmoMoreLabel, 'Ver todo')} />
        <motion.ul variants={olStagger} initial="hidden" whileInView="show" viewport={olViewport} className={`-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-0 sm:grid sm:grid-cols-4 sm:gap-6 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden ${cols}`}>
          {tiles.map((tile) => {
            const n = counts[tile.nombre];
            return (
              <motion.li key={tile.nombre} variants={olItem} className="w-[104px] shrink-0 snap-start sm:w-auto">
                <button type="button" onClick={() => onPick(tile.nombre)} className="group flex w-full flex-col items-center text-center">
                  <span className="relative block aspect-square w-full overflow-hidden rounded-full transition-shadow duration-500 group-hover:shadow-[0_18px_34px_-22px_rgba(31,28,24,0.6)]" style={{ background: tileFor(t, tile.nombre) }}>
                    {tile.imagenUrl ? (
                      <img src={tile.imagenUrl} alt="" loading="lazy" className={`h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.07] ${tile.isProduct ? 'object-cover mix-blend-multiply' : 'object-cover'}`} />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center" style={{ color: t.primaryInk }}><Icon icon={categoryIcon(tile.nombre)} width={40} /></span>
                    )}
                  </span>
                  <span className="mt-3 line-clamp-1 text-[14px] font-semibold capitalize" style={{ color: t.ink }}>{tile.label.toLowerCase()}</span>
                  {Number.isFinite(n) && n > 0 && <span className="mt-0.5 text-[12px]" style={{ color: t.muted }}>{n} {n === 1 ? 'pieza' : 'piezas'}</span>}
                </button>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════ BANNER ══
/**
 * Banner "Book Lover's Sale" de la referencia: panel verde con texto, sello circular en arena
 * con el descuento REAL máximo y foto a la derecha. Sin ofertas → banner de colección, sin sello.
 */
function PromoBanner({ t, diseno, maxOff, endsAt, onCta }: { t: Theme; diseno: any; maxOff: number; endsAt: number | null; onCta: () => void }) {
  const d = diseno || {};
  const sale = maxOff > 0;
  const eyebrow = sale ? (endsAt ? 'Oferta por tiempo limitado' : 'Ofertas de la tienda') : optional(d.olmoPromoEyebrow, 'Colección');
  const title = sale ? editable(d.olmoPromoTitle, '¡Ofertas que enamoran!') : editable(d.olmoPromoAltTitle, 'Encuentra tu próxima favorita');
  const text = sale ? `Hasta ${maxOff}% de descuento en piezas seleccionadas.` : optional(d.olmoPromoAltText, 'Recorre la colección completa y elige la que va contigo.');
  const button = sale ? editable(d.olmoPromoButton, 'Ver ofertas') : editable(d.olmoPromoAltButton, 'Ver colección');
  const image = d.olmoPromoImage || OLMO_IMG.promo;

  return (
    <section className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6">
      <motion.div variants={olReveal} initial="hidden" whileInView="show" viewport={olViewport} className="relative grid overflow-hidden rounded-[28px] lg:grid-cols-[1fr_1.15fr]" style={{ background: t.chrome }}>
        <div className="relative z-10 px-7 py-10 sm:px-12 sm:py-12" style={{ color: t.onPrimary }}>
          <p className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.18em]" style={{ color: t.accentOnDark }}><Icon icon="ph:sparkle" width={15} />{eyebrow}</p>
          <h2 className="mt-4 text-[38px] font-medium leading-[1.05] sm:text-[46px]" style={{ fontFamily: t.display }}>{title}</h2>
          {text && <p className="mt-3 max-w-sm text-[15px] leading-relaxed" style={{ color: mix(t.onPrimary, 76, t.chrome) }}>{text}</p>}
          {sale && endsAt && <div className="mt-6"><OfferCountdown t={t} endsAt={endsAt} light /></div>}
          <button type="button" onClick={onCta} className={`${btnCls} group mt-8 h-[50px] px-7`} style={{ background: t.accent, color: t.onAccent }}>
            {button} <Icon icon="ph:arrow-right" width={17} className="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
        <div className="relative min-h-[240px] lg:min-h-[320px]">
          <img src={image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <div aria-hidden className="absolute inset-y-0 left-0 hidden w-24 lg:block" style={{ background: `linear-gradient(90deg, ${t.chrome}, transparent)` }} />
        </div>
        {sale && (
          // El envoltorio posiciona (translate de Tailwind); el hijo anima la escala (framer). No se mezclan.
          <div className="absolute right-6 top-6 z-20 lg:left-[46.5%] lg:right-auto lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2">
            <motion.div initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={olViewport} transition={{ duration: 0.7, ease: olPop, delay: 0.2 }}
              className="flex h-[112px] w-[112px] flex-col items-center justify-center rounded-full text-center shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)] lg:h-[132px] lg:w-[132px]"
              style={{ background: t.accent, color: t.onAccent, boxShadow: `0 0 0 6px ${mix(t.accent, 30, t.chrome)}, 0 20px 40px -20px rgba(0,0,0,.5)` }}>
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em]">Hasta</span>
              <span className="text-[36px] font-medium leading-none lg:text-[42px]" style={{ fontFamily: t.display }}>{maxOff}%</span>
              <span className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.16em]">dscto.</span>
            </motion.div>
          </div>
        )}
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════ CLUB ══
/**
 * "Join the Circle" de la referencia, sin correos inventados: el cliente deja su nombre y se une
 * por WhatsApp real (mensaje armado). Sin WhatsApp → invita a Instagram real; sin ninguno, se oculta.
 */
function Club({ t, diseno, ch, storeName }: { t: Theme; diseno: any; ch: Channels; storeName: string }) {
  const d = diseno || {};
  const [name, setName] = useState('');
  if (!ch.hasWhatsapp && !ch.instagramUrl) return null;
  const title = editable(d.olmoClubTitle, `Únete al círculo ${storeName}`);
  const text = optional(d.olmoClubText, ch.hasWhatsapp ? 'Entérate primero de las piezas nuevas, ofertas y reposiciones. Te escribimos por WhatsApp.' : 'Mira las piezas nuevas y cómo se llevan en nuestro Instagram.');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const msg = `${editable(d.olmoClubMessage, `Hola, quiero unirme al círculo de ${storeName} para enterarme de novedades y ofertas.`)}${name.trim() ? `\nMi nombre es ${name.trim()}.` : ''}`;
    const url = ch.wa(msg);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6">
      <motion.div variants={olReveal} initial="hidden" whileInView="show" viewport={olViewport} className="relative overflow-hidden rounded-[28px] px-6 py-8 sm:px-10" style={{ background: t.sand }}>
        <Icon icon="ph:handbag-simple-thin" aria-hidden width={170} className="pointer-events-none absolute -bottom-8 right-4 hidden opacity-60 lg:block" style={{ color: t.accentInk }} />
        <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_1.05fr] lg:pr-44">
          <div className="flex items-start gap-5">
            <span className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[16px]" style={{ background: t.strong, color: t.onPrimary }}><Icon icon={ch.hasWhatsapp ? 'ph:envelope-simple-light' : 'ph:instagram-logo-light'} width={28} /></span>
            <div className="min-w-0">
              <h2 className="text-[24px] font-medium leading-tight sm:text-[28px]" style={{ color: t.ink, fontFamily: t.display }}>{title}</h2>
              {text && <p className="mt-1.5 max-w-md text-[14px] leading-relaxed" style={{ color: mix(t.ink, 70, t.bg) }}>{text}</p>}
            </div>
          </div>
          {ch.hasWhatsapp ? (
            <form onSubmit={submit} className="flex h-[56px] items-center gap-2 rounded-full bg-white pl-6 pr-1.5 shadow-[0_14px_30px_-24px_rgba(31,28,24,0.5)]">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={editable(d.olmoClubPlaceholder, 'Tu nombre')} aria-label="Tu nombre" className="min-w-0 flex-1 appearance-none border-0 bg-transparent bg-none p-0 text-[14.5px] outline-none placeholder:text-[#A39C93] focus:ring-0" style={{ color: t.ink }} />
              <button type="submit" className={`${btnCls} h-[44px] shrink-0 px-5 sm:px-6`} style={{ background: t.strong, color: t.onPrimary }}>
                <Icon icon="ic:baseline-whatsapp" width={17} /> {editable(d.olmoClubButton, 'Unirme')}
              </button>
            </form>
          ) : (
            <a href={ch.instagramUrl!} target="_blank" rel="noopener noreferrer" className={`${btnCls} h-[52px] justify-self-start px-7`} style={{ background: t.strong, color: t.onPrimary }}>
              <Icon icon="mdi:instagram" width={18} /> Seguir en Instagram
            </a>
          )}
        </div>
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ VALORES ══
/** Franja de 5 valores de la referencia, con datos reales (categorías y beneficios configurados). */
function Values({ t, diseno, services, categoriesCount }: { t: Theme; diseno: any; services: Service[]; categoriesCount: number }) {
  const items = [
    ...(categoriesCount > 1 ? [{ icon: 'ph:handbag-light', label: editable(diseno?.olmoValueSelection, 'Gran selección'), sub: `${categoriesCount} categorías para elegir` }] : []),
    ...services.map((s) => ({ icon: s.icon, label: s.label, sub: s.sub })),
  ].slice(0, 5);
  if (items.length < 3) return null;
  const cols = items.length === 5 ? 'lg:grid-cols-5' : items.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3';
  return (
    <section className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6">
      <motion.ul variants={olStagger} initial="hidden" whileInView="show" viewport={olViewport} className={`grid grid-cols-2 gap-y-6 rounded-[28px] border bg-white/50 px-4 py-7 sm:grid-cols-3 ${cols}`} style={{ borderColor: t.line }}>
        {items.map((it, i) => (
          <motion.li key={it.label} variants={olItem} className={`flex items-center gap-3.5 px-3 sm:px-5 ${i > 0 ? 'lg:border-l' : ''}`} style={{ borderColor: t.line }}>
            <Icon icon={it.icon} width={30} className="shrink-0" style={{ color: t.primaryInk }} />
            <span className="min-w-0 leading-tight">
              <span className="block text-[13.5px] font-semibold" style={{ color: t.ink }}>{it.label}</span>
              <span className="mt-1 block text-[12px]" style={{ color: t.muted }}>{it.sub}</span>
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ RESEÑAS ══
type Review = { id: any; clienteNombre?: string; rating: number; comentario?: string; compraVerificada?: boolean; producto?: string };

/** Reseñas REALES (endpoint por producto, solo productos con reseñas). Sin reseñas, no se muestra. */
function RealReviews({ t, slug, products, diseno }: { t: Theme; slug: string; products: any[]; diseno: any }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const withReviews = products.filter((p) => Number(p?.ratingCount || 0) > 0).slice(0, 4);
  const key = withReviews.map((p) => p.id).join(',');

  useEffect(() => {
    if (!slug || slug === 'preview' || !key || isOn(diseno?.olmoReviewsHidden)) { setReviews([]); return; }
    let alive = true;
    Promise.all(withReviews.map((p) => axios.get(`${BASE_URL}/public/store/${slug}/products/${p.id}/reviews`)
      .then((r) => ((r.data?.data || r.data)?.reviews || []).map((rv: any) => ({ ...rv, producto: p.descripcion })))
      .catch(() => [])))
      .then((all) => {
        if (!alive) return;
        const list: Review[] = all.flat().filter((r: Review) => String(r.comentario || '').trim().length >= 8);
        setReviews(list.sort((a, b) => Number(b.rating) - Number(a.rating)).slice(0, 3));
      });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, key, diseno?.olmoReviewsHidden]);

  if (!reviews.length) return null;
  return (
    <section className="mx-auto max-w-[1320px] px-4 pt-14 sm:px-6">
      <SectionHeader t={t} eyebrow={optional(diseno?.olmoReviewsEyebrow, 'Reseñas reales')} title={editable(diseno?.olmoReviewsTitle, 'Lo que dicen nuestras clientas')} />
      <motion.div variants={olStagger} initial="hidden" whileInView="show" viewport={olViewport} className={`grid gap-4 ${reviews.length >= 3 ? 'md:grid-cols-3' : reviews.length === 2 ? 'md:grid-cols-2' : ''}`}>
        {reviews.map((r) => (
          <motion.figure key={r.id} variants={olItem} className="flex flex-col rounded-[22px] bg-white p-6">
            <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon={i < Math.round(r.rating) ? 'solar:star-bold' : 'solar:star-linear'} width={14} style={{ color: t.accent }} />)}</span>
            <blockquote className="mt-4 line-clamp-4 text-[18px] italic leading-snug" style={{ color: t.ink, fontFamily: t.display }}>“{String(r.comentario).trim()}”</blockquote>
            <figcaption className="mt-auto flex items-center gap-3 pt-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] italic" style={{ background: t.sand, color: t.ink, fontFamily: t.display }}>{(r.clienteNombre || 'C').trim().charAt(0).toUpperCase()}</span>
              <span className="min-w-0 leading-tight">
                <span className="block text-[13.5px] font-semibold" style={{ color: t.ink }}>{r.clienteNombre || 'Cliente'}</span>
                <span className="mt-0.5 block truncate text-[12px]" style={{ color: t.muted }}>{r.compraVerificada ? 'Compra verificada · ' : ''}{r.producto}</span>
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </motion.div>
    </section>
  );
}

