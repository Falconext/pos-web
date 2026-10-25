import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { buildCategoryTiles } from '@/templates/shared/categoryTiles';
import { resolveHeroIntervalMs, usePreloadImages } from '@/templates/shared/heroSlider';
import { getProductPricing } from '@/templates/shared/pricing';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import {
  MaisonHeader, MaisonFooter, MaisonCartModal, Ornament, buildServices, categoryIcon,
  maisonTheme, useMaisonFont, editable, optional, isOn, lines, btnCls, eyebrowCls, goldBtn, ghostBtn, MAISON_IMG, type Theme, type Service,
} from './MaisonParts';
import { ProductGrid, ProductRail, GridSkeleton, SectionHeader, OfferCountdown, soonestOfferEnd, storeChannels, getName, hasImage, type OpenFn, type AddFn } from './MaisonSections';
import { useFreeShipping, useStoreTotal } from './MaisonExtras';
import { msEase, msHeroText, msItem, msReveal, msStagger, msViewport, mix } from './motion';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

// ═════════════════════════════════════════════════════════════════ PAGE ══
export default function MaisonHomePage(props: TemplateHomePageProps) {
  const { tienda, slug, productos, allCategories, diseno, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, agregarAlCarrito, actualizarCantidad, loading } = props as any;
  useMaisonFont();
  const navigate = useNavigate();
  const t = maisonTheme(diseno);
  const [showFav, setShowFav] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);

  const list: any[] = useMemo(() => (Array.isArray(productos) ? productos : []), [productos]);
  const withImg = useMemo(() => list.filter(hasImage), [list]);
  const categories: string[] = useMemo(() => (allCategories || []).map(getName).filter(Boolean), [allCategories]);
  const picks = useMemo(() => {
    const pool = [...withImg, ...list.filter((p) => !hasImage(p))];
    return [...pool.filter((p) => p?.destacado), ...pool.filter((p) => !p?.destacado)].slice(0, 12);
  }, [list, withImg]);
  const offers = useMemo(() => list.filter((p) => getProductPricing(p).enOferta), [list]);
  const maxOff = useMemo(() => offers.reduce((m, p) => Math.max(m, Number(getProductPricing(p).porcentajeDescuento || 0)), 0), [offers]);
  const tiles = useMemo(() => buildCategoryTiles({ allCategories, diseno, prefix: 'maison', count: 6, fallbackImages: [] }).map((tile) => {
    const same = (p: any) => getName(p?.categoria).toLowerCase() === tile.nombre.toLowerCase();
    const fromProduct = tile.imagenUrl ? '' : withImg.find(same)?.imagenUrl || '';
    return { ...tile, imagenUrl: tile.imagenUrl || fromProduct, isProduct: Boolean(fromProduct) };
  }), [allCategories, diseno, withImg]);
  const ch = storeChannels(tienda, diseno);
  const freeFrom = useFreeShipping(slug);
  const services = useMemo(() => buildServices(tienda, ch.hasWhatsapp, freeFrom), [tienda, ch.hasWhatsapp, freeFrom]);

  const cartCount = (carrito || []).reduce((s: number, i: any) => s + Number(i?.cantidad || 1), 0);
  const goCatalog = () => navigate(`/tienda/${slug}/catalogo`);
  const goCategory = (name: string) => navigate(`/tienda/${slug}/catalogo?category=${encodeURIComponent(name)}`);
  const goProduct: OpenFn = (p) => navigate(`/tienda/${slug}/producto/${p.id}`);
  const add: AddFn = (p, qty = 1) => agregarAlCarrito({ ...p, __cantidad: qty });
  const goAction = (key: string) => runStoreLinkAction(getStoreLinkAction(diseno, key, { defaultType: 'catalog' }), { slug, navigate });
  const offerEnd = soonestOfferEnd(offers);
  const gridPicks = picks.slice(0, 6);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-clip" style={{ background: t.bg, fontFamily: t.font }}>
        <MaisonHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={navigate} active="home" />

        <HeroSlider t={t} diseno={diseno} slug={slug} list={list} goAction={goAction} goCatalog={goCatalog} />
        {!isOn(diseno?.maisonBenefitsHidden) && <BenefitsBar t={t} services={services} />}

        {tiles.length > 0 && <CategoryCards t={t} diseno={diseno} slug={slug} tiles={tiles} onPick={goCategory} onAll={goCatalog} />}

        <section className="mx-auto max-w-[1320px] px-4 py-10 lg:px-8">
          <SectionHeader t={t} title={editable(diseno?.maisonPicksTitle, 'Destacados')} onMore={goCatalog} moreLabel={editable(diseno?.maisonPicksMore, 'Ver todos los productos')} />
          {loading && !list.length ? <GridSkeleton t={t} count={6} cols="lg:grid-cols-6" /> : gridPicks.length > 0 ? (
            <ProductGrid t={t} products={gridPicks} slug={slug} onOpen={goProduct} onAdd={add} cols="lg:grid-cols-6" />
          ) : <EmptyStore t={t} />}
        </section>

        {!isOn(diseno?.maisonPromosHidden) && <PromoBanners t={t} diseno={diseno} maxOff={maxOff} offerEnd={offerEnd} goAction={goAction} />}

        {/* Con 1–2 ofertas ya se ven con su % en "Destacados"; el rail propio luce con 3 o más. */}
        {offers.length >= 3 && (
          <ProductRail t={t} title={editable(diseno?.maisonOffersTitle, 'Precios especiales')} products={offers.slice(0, 12)} slug={slug} onOpen={goProduct} onAdd={add}
            right={offerEnd ? <div className="flex items-center gap-2.5"><span className="text-[12px]" style={{ color: t.muted }}>Terminan en</span><OfferCountdown t={t} endsAt={offerEnd} /></div> : undefined} />
        )}

        {!isOn(diseno?.maisonReviewsHidden) && <Testimonials t={t} diseno={diseno} slug={slug} list={list} />}
        <div className="h-12" />

        <MaisonFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <MaisonCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } })} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.primary} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.primary} onGoProduct={(item: any) => goProduct(item)} />
      </div>
    </MotionConfig>
  );
}

function EmptyStore({ t }: { t: Theme }) {
  return (
    <div className="rounded-[6px] bg-white px-6 py-14 text-center" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
      <Icon icon="ph:handbag-light" width={40} className="mx-auto" style={{ color: t.primaryInk }} />
      <p className="mt-3 text-[18px]" style={{ color: t.ink, fontFamily: t.serif }}>Muy pronto, nuevas piezas</p>
      <p className="mt-1 text-[13px]" style={{ color: t.muted }}>Estamos preparando la colección.</p>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════ HERO ══
type Slide = { image: string; onlyImage: boolean; eyebrow: string; title: string; highlight: string; subtitle: string; button: string; button2: string; action: string; action2: string };

function slidesFrom(diseno: any): Slide[] {
  const d = diseno || {};
  const all: (Slide & { hidden: boolean })[] = [
    { hidden: false, image: d.maisonHeroImage || MAISON_IMG.hero[0], onlyImage: isOn(d.maisonHeroOnlyImage), eyebrow: optional(d.maisonHeroEyebrow, 'Diseñadas para ti · Hechas para durar'), title: editable(d.maisonHeroTitle, 'Eleva tu estilo|con piezas'), highlight: optional(d.maisonHeroHighlight, 'atemporales'), subtitle: optional(d.maisonHeroSubtitle, 'Carteras y accesorios que combinan elegancia, funcionalidad y carácter para cada momento de tu día.'), button: editable(d.maisonHeroButton, 'Comprar ahora'), button2: optional(d.maisonHeroButton2, 'Explorar colección'), action: 'maisonHeroAction', action2: 'maisonHeroAction2' },
    { hidden: isOn(d.maisonSlide2Hidden), image: d.maisonSlide2Image || MAISON_IMG.hero[1], onlyImage: isOn(d.maisonSlide2OnlyImage), eyebrow: optional(d.maisonSlide2Eyebrow, 'Nueva temporada'), title: editable(d.maisonSlide2Title, 'Líneas limpias,|tonos'), highlight: optional(d.maisonSlide2Highlight, 'naturales'), subtitle: optional(d.maisonSlide2Subtitle, 'Piezas versátiles que pasan del trabajo a la noche sin esfuerzo.'), button: editable(d.maisonSlide2Button, 'Ver novedades'), button2: '', action: 'maisonSlide2Action', action2: 'maisonHeroAction2' },
    { hidden: isOn(d.maisonSlide3Hidden), image: d.maisonSlide3Image || MAISON_IMG.hero[2], onlyImage: isOn(d.maisonSlide3OnlyImage), eyebrow: optional(d.maisonSlide3Eyebrow, 'Para todos los días'), title: editable(d.maisonSlide3Title, 'El detalle que|completa tu'), highlight: optional(d.maisonSlide3Highlight, 'look'), subtitle: optional(d.maisonSlide3Subtitle, 'Bandoleras, totes y carteras de mano para cada ocasión.'), button: editable(d.maisonSlide3Button, 'Ver colección'), button2: '', action: 'maisonSlide3Action', action2: 'maisonHeroAction2' },
  ];
  const visible = all.filter((s) => !s.hidden);
  return visible.length ? visible : [all[0]];
}

/** Sello circular de la referencia ("Nueva · colección · temporada"), editable y ocultable. */
function HeroSeal({ t, diseno }: { t: Theme; diseno: any }) {
  const top = optional(diseno?.maisonSealTop, 'Nueva');
  const main = optional(diseno?.maisonSealMain, 'Colección');
  const bottom = optional(diseno?.maisonSealBottom, String(new Date().getFullYear()));
  if (isOn(diseno?.maisonSealHidden) || !(top || main || bottom)) return null;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.9, ease: msEase, delay: 0.35 }} className="absolute right-4 top-6 z-[3] hidden h-[132px] w-[132px] items-center justify-center rounded-full bg-white/95 text-center shadow-[0_24px_50px_-26px_rgba(42,38,33,.55)] sm:flex lg:right-10 lg:top-16" style={{ boxShadow: `inset 0 0 0 5px #fff, inset 0 0 0 6px ${t.line}, 0 24px 50px -26px rgba(42,38,33,.55)` }}>
      <span className="flex flex-col items-center leading-tight">
        {top && <span className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: t.primaryInk }}>{top}</span>}
        {main && <span className="mt-1 max-w-[104px] text-[14px] uppercase leading-[1.1] tracking-[0.03em]" style={{ color: t.ink, fontFamily: t.serif }}>{main}</span>}
        {bottom && <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: t.muted }}>{bottom}</span>}
      </span>
    </motion.div>
  );
}

/** Confianza REAL bajo los botones: miniaturas de productos + total de diseños + promedio de reseñas reales. */
function HeroTrust({ t, slug, list }: { t: Theme; slug: string; list: any[] }) {
  const total = useStoreTotal(slug);
  const thumbs = list.filter(hasImage).slice(0, 4);
  const rated = list.filter((p) => Number(p?.ratingCount || 0) > 0 && Number(p?.ratingAvg || p?.ratingPromedio || 0) > 0);
  const count = rated.reduce((s, p) => s + Number(p.ratingCount), 0);
  const avg = count ? rated.reduce((s, p) => s + Number(p.ratingAvg || p.ratingPromedio) * Number(p.ratingCount), 0) / count : 0;
  const n = total || list.length;
  if (!n && !count) return null;
  return (
    <div className="mt-8 flex items-center gap-3.5">
      {thumbs.length > 0 && (
        <span className="flex -space-x-2.5">
          {thumbs.map((p) => <span key={p.id} className="h-10 w-10 overflow-hidden rounded-full bg-white" style={{ boxShadow: `0 0 0 2px ${t.bg}` }}><img src={p.imagenUrl} alt="" className="h-full w-full object-contain p-0.5 mix-blend-multiply" /></span>)}
        </span>
      )}
      <span className="leading-tight">
        {n > 0 && <span className="block text-[12.5px] font-semibold" style={{ color: t.ink }}>{n} {n === 1 ? 'diseño disponible' : 'diseños disponibles'}</span>}
        {count > 0 ? (
          <span className="mt-1 flex items-center gap-1.5 text-[11.5px]" style={{ color: t.muted }}>
            <span className="flex" style={{ color: t.star }}>{Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon={i < Math.round(avg) ? 'solar:star-bold' : 'solar:star-linear'} width={12} />)}</span>
            {avg.toFixed(1)} ({count} {count === 1 ? 'reseña' : 'reseñas'})
          </span>
        ) : <span className="mt-1 block text-[11.5px]" style={{ color: t.muted }}>Elige el tuyo y recíbelo en casa</span>}
      </span>
    </div>
  );
}

/** Hero partido de la referencia (texto a la izquierda sobre crema, foto a la derecha). Aislado: su timer solo re-renderiza este componente. */
function HeroSlider({ t, diseno, slug, list, goAction, goCatalog }: { t: Theme; diseno: any; slug: string; list: any[]; goAction: (k: string) => void; goCatalog: () => void }) {
  const slides = useMemo(() => slidesFrom(diseno), [diseno]);
  const interval = resolveHeroIntervalMs(diseno, 'maisonHeroInterval', 7000);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  usePreloadImages(slides.map((s) => s.image));
  useEffect(() => { if (idx >= slides.length) setIdx(0); }, [idx, slides.length]);
  useEffect(() => {
    if (!interval || paused || slides.length < 2) return;
    const id = window.setTimeout(() => setIdx((v) => (v + 1) % slides.length), interval);
    return () => window.clearTimeout(id);
  }, [idx, interval, paused, slides.length]);
  const s = slides[Math.min(idx, slides.length - 1)];

  return (
    <section className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carrusel">
      <div className="relative mx-auto max-w-[1600px] overflow-hidden lg:h-[600px]" style={{ background: `linear-gradient(100deg, ${t.bg} 0%, ${mix(t.primary, 9, t.bg)} 100%)` }}>
        <div aria-hidden className={s.onlyImage ? 'absolute inset-0' : 'relative h-[300px] sm:h-[380px] lg:absolute lg:inset-y-0 lg:right-0 lg:h-full lg:w-[60%] lg:[mask-image:linear-gradient(90deg,transparent,#000_16%)]'}>
          {slides.map((sl, i) => (
            <motion.img key={sl.action} src={sl.image} alt="" initial={false} animate={{ opacity: sl === s ? 1 : 0, scale: sl === s ? 1 : 1.04 }} transition={{ duration: 1.3, ease: msEase }} className="absolute inset-0 h-full w-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
          ))}
          {!s.onlyImage && <HeroSeal t={t} diseno={diseno} />}
        </div>

        {s.onlyImage ? (
          <button type="button" aria-label={s.title.replace(/\|/g, ' ')} onClick={() => goAction(s.action)} className="absolute inset-0 z-[1] min-h-[420px]" />
        ) : (
          <div className="relative z-[2] mx-auto flex max-w-[1320px] px-4 pb-20 pt-9 lg:h-full lg:items-center lg:px-8 lg:pb-16 lg:pt-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={s.action} variants={msStagger} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.22 } }} className="max-w-[520px] lg:max-w-[460px] xl:max-w-[520px]">
                {s.eyebrow && <motion.p variants={msHeroText} className={eyebrowCls} style={{ color: t.primaryInk }}>{s.eyebrow}</motion.p>}
                <motion.h1 variants={msHeroText} className="mt-4 whitespace-pre-line text-[40px] leading-[1.08] sm:text-[50px] xl:text-[56px]" style={{ color: t.ink, fontFamily: t.serif }}>
                  {lines(s.title)}
                  {s.highlight && <> <span className="italic" style={{ color: t.primaryInk }}>{s.highlight}</span></>}
                </motion.h1>
                <motion.div variants={msHeroText}><Ornament color={t.primaryInk} className="mt-5" /></motion.div>
                {s.subtitle && <motion.p variants={msHeroText} className="mt-5 max-w-[400px] text-[14.5px] leading-relaxed" style={{ color: mix(t.ink, 72, t.bg) }}>{s.subtitle}</motion.p>}
                <motion.div variants={msHeroText} className="mt-7 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={() => goAction(s.action)} className={`${btnCls} h-12 px-7`} style={goldBtn(t)}>{s.button}</button>
                  {s.button2 && <button type="button" onClick={() => (s.action2 ? goAction(s.action2) : goCatalog())} className={`${btnCls} h-12 px-7 hover:bg-white/60`} style={ghostBtn(t)}>{s.button2}</button>}
                </motion.div>
                {!isOn(diseno?.maisonTrustHidden) && <motion.div variants={msHeroText}><HeroTrust t={t} slug={slug} list={list} /></motion.div>}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {slides.length > 1 && (
          <div className="absolute bottom-[86px] left-1/2 z-[3] flex -translate-x-1/2 gap-1.5 rounded-full bg-white/80 px-2.5 py-2 backdrop-blur lg:bottom-20 lg:left-auto lg:right-10 lg:translate-x-0">
            {slides.map((sl, i) => (
              <button key={sl.action} type="button" aria-label={`Ir al banner ${i + 1}`} aria-current={sl === s} onClick={() => setIdx(i)} className="relative h-1.5 overflow-hidden rounded-full transition-[width] duration-500" style={{ width: sl === s ? 28 : 8, background: mix(t.primary, 25, '#fff') }}>
                {sl === s && <motion.span key={`${idx}-${paused}`} aria-hidden className="absolute inset-0 origin-left rounded-full" style={{ background: t.primary }} initial={{ scaleX: interval && !paused ? 0 : 1 }} animate={{ scaleX: 1 }} transition={{ duration: interval && !paused ? interval / 1000 : 0, ease: 'linear' }} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════ BENEFICIOS (franja) ══
function BenefitsBar({ t, services }: { t: Theme; services: Service[] }) {
  if (!services.length) return null;
  const cols: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5' };
  return (
    <section className="relative z-10 mx-auto -mt-14 max-w-[1320px] px-4 lg:-mt-12 lg:px-8">
      <motion.ul key={services.map((x) => x.label).join('|')} variants={msStagger} initial="hidden" whileInView="show" viewport={msViewport} className={`grid grid-cols-2 gap-y-5 rounded-[6px] bg-white px-4 py-6 sm:grid-cols-3 lg:divide-x ${cols[services.length] || 'lg:grid-cols-5'}`} style={{ boxShadow: `inset 0 0 0 1px ${t.line}, 0 26px 50px -36px rgba(42,38,33,.5)` }}>
        {services.map((s) => (
          <motion.li key={s.label} variants={msItem} className="flex items-center gap-3 px-3 lg:justify-center lg:px-4" style={{ borderColor: t.line }}>
            <Icon icon={s.icon} width={28} className="shrink-0" style={{ color: t.primaryInk }} />
            <span className="min-w-0 leading-tight">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: t.ink }}>{s.label}</span>
              <span className="mt-1 block text-[11.5px]" style={{ color: t.muted }}>{s.sub}</span>
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

// ═════════════════════════════════════════════ COMPRA POR CATEGORÍA ══
/** Conteo real de productos de la categoría (API pública). Aislado por tarjeta. */
function TileCount({ slug, category, t }: { slug: string; category: string; t: Theme }) {
  const n = useStoreTotal(slug, category);
  if (!n) return null;
  return <span className="mt-1 block text-[11.5px]" style={{ color: t.muted }}>{n} {n === 1 ? 'producto' : 'productos'}</span>;
}

/** Imagen de la tarjeta con fallback si la URL está rota. Estado propio aislado. */
function TileImage({ t, src, name, isProduct }: { t: Theme; src: string; name: string; isProduct: boolean }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  if (!src || broken) return <span className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(160deg, ${t.card}, ${t.blush})` }}><Icon icon={categoryIcon(name)} width={56} style={{ color: mix(t.primaryInk, 55, '#fff') }} /></span>;
  return <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} className={`absolute inset-0 h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.05] ${isProduct ? 'object-contain p-3 mix-blend-multiply' : 'object-cover'}`} />;
}

function CategoryCards({ t, diseno, slug, tiles, onPick, onAll }: { t: Theme; diseno: any; slug: string; tiles: { nombre: string; label: string; imagenUrl: string; isProduct: boolean }[]; onPick: (c: string) => void; onAll: () => void }) {
  const showCounts = !isOn(diseno?.maisonTileCountsHidden);
  const cols: Record<number, string> = { 1: 'lg:grid-cols-3', 2: 'lg:grid-cols-3', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6' };
  return (
    <section className="mx-auto max-w-[1320px] px-4 pb-4 pt-14 lg:px-8">
      <SectionHeader t={t} title={editable(diseno?.maisonTilesTitle, 'Compra por categoría')} onMore={onAll} moreLabel={editable(diseno?.maisonTilesMore, 'Ver todas las categorías')} />
      <motion.div key={tiles.map((x) => x.nombre).join('|')} variants={msStagger} initial="hidden" whileInView="show" viewport={msViewport} className={`-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:gap-4 lg:mx-0 lg:grid ${cols[tiles.length] || 'lg:grid-cols-6'} lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden`}>
        {tiles.map((c) => (
          <motion.button key={c.nombre} type="button" variants={msItem} onClick={() => onPick(c.nombre)} className="group w-[46%] shrink-0 snap-start overflow-hidden rounded-[6px] bg-white text-center transition-shadow duration-500 hover:shadow-[0_24px_48px_-30px_rgba(42,38,33,.5)] sm:w-[30%] lg:w-auto" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
            <span className="relative block aspect-[1/1] overflow-hidden" style={{ background: t.card }}>
              <TileImage t={t} src={c.imagenUrl} name={c.nombre} isProduct={c.isProduct} />
            </span>
            <span className="relative block px-3 pb-4 pt-8">
              <span className="absolute left-1/2 top-0 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white" style={{ color: t.primaryInk, boxShadow: `0 0 0 1px ${t.line}, 0 10px 20px -12px rgba(42,38,33,.45)` }}><Icon icon={categoryIcon(c.nombre)} width={22} /></span>
              <span className="line-clamp-1 block text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: t.ink }}>{c.label}</span>
              {showCounts && <TileCount slug={slug} category={c.nombre} t={t} />}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════ BANNERS DOBLES ══
/**
 * Dos banners de la referencia. El oscuro solo habla de descuento si hay ofertas REALES ("Hasta X%",
 * con reloj si tienen fecha de fin); si no, muestra un mensaje editable sin promesas.
 */
function PromoBanners({ t, diseno, maxOff, offerEnd, goAction }: { t: Theme; diseno: any; maxOff: number; offerEnd: number | null; goAction: (k: string) => void }) {
  const hasOffer = maxOff > 0;
  const b1 = {
    eyebrow: hasOffer ? editable(diseno?.maisonPromoOfferEyebrow, offerEnd ? 'Oferta por tiempo limitado' : 'Precios especiales') : optional(diseno?.maisonPromoEyebrow, 'Selección especial'),
    title: hasOffer ? `Hasta ${maxOff}% de descuento|${editable(diseno?.maisonPromoOfferTitle, 'en piezas seleccionadas')}` : editable(diseno?.maisonPromoTitle, 'Piezas que|marcan la diferencia'),
    button: editable(diseno?.maisonPromoButton, hasOffer ? 'Ver ofertas' : 'Ver colección'),
    image: diseno?.maisonPromoImage || MAISON_IMG.promo,
  };
  const b2 = {
    eyebrow: optional(diseno?.maisonPromo2Eyebrow, 'Nueva colección'),
    title: editable(diseno?.maisonPromo2Title, 'Estilo moderno,|pensado para ti'),
    button: editable(diseno?.maisonPromo2Button, 'Descubrir'),
    image: diseno?.maisonPromo2Image || MAISON_IMG.promo2,
  };
  return (
    <section className="mx-auto max-w-[1320px] px-4 py-6 lg:px-8">
      <motion.div variants={msStagger} initial="hidden" whileInView="show" viewport={msViewport} className="grid gap-4 lg:grid-cols-2">
        <motion.div variants={msReveal} className="relative grid min-h-[230px] overflow-hidden rounded-[6px] sm:grid-cols-[1.05fr_1fr]" style={{ background: t.dark }}>
          <div className="relative z-[1] flex flex-col justify-center px-7 py-9 sm:px-9">
            {b1.eyebrow && <p className={eyebrowCls} style={{ color: mix(t.primary, 45, '#fff') }}>{b1.eyebrow}</p>}
            <h3 className="mt-3 whitespace-pre-line text-[26px] leading-[1.15] text-white sm:text-[28px]" style={{ fontFamily: t.serif }}>{lines(b1.title)}</h3>
            {hasOffer && offerEnd && <div className="mt-4"><OfferCountdown t={t} endsAt={offerEnd} /></div>}
            <button type="button" onClick={() => goAction('maisonPromoAction')} className={`${btnCls} mt-6 h-10 self-start px-5`} style={goldBtn(t)}>{b1.button}</button>
          </div>
          <img src={b1.image} alt="" loading="lazy" className="h-[200px] w-full object-cover sm:absolute sm:inset-y-0 sm:right-0 sm:h-full sm:w-[48%]" />
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-[46%] hidden w-24 sm:block" style={{ background: `linear-gradient(90deg, ${t.dark}, transparent)` }} />
        </motion.div>
        <motion.div variants={msReveal} className="relative grid min-h-[230px] overflow-hidden rounded-[6px] sm:grid-cols-[1.05fr_1fr]" style={{ background: mix(t.primary, 14, '#EFE6DA') }}>
          <div className="relative z-[1] flex flex-col justify-center px-7 py-9 sm:px-9">
            {b2.eyebrow && <p className={eyebrowCls} style={{ color: t.primaryInk }}>{b2.eyebrow}</p>}
            <h3 className="mt-3 whitespace-pre-line text-[26px] leading-[1.15] sm:text-[28px]" style={{ color: t.ink, fontFamily: t.serif }}>{lines(b2.title)}</h3>
            <button type="button" onClick={() => goAction('maisonPromo2Action')} className={`${btnCls} mt-6 h-10 self-start px-5 hover:bg-white/50`} style={ghostBtn(t)}>{b2.button}</button>
          </div>
          <img src={b2.image} alt="" loading="lazy" className="h-[200px] w-full object-cover sm:absolute sm:inset-y-0 sm:right-0 sm:h-full sm:w-[48%]" />
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-[46%] hidden w-24 sm:block" style={{ background: `linear-gradient(90deg, ${mix(t.primary, 14, '#EFE6DA')}, transparent)` }} />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════ TESTIMONIOS ══
type Review = { id: number; clienteNombre?: string; rating: number; comentario?: string; compraVerificada?: boolean; producto: string };

/** Reseñas APROBADAS reales (de productos con ratingCount > 0) en carrusel con flechas. Carga y estado aislados. */
function Testimonials({ t, diseno, slug, list }: { t: Theme; diseno: any; slug: string; list: any[] }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const rated = list.filter((p) => Number(p?.ratingCount || 0) > 0).slice(0, 5);
  const key = rated.map((p) => p.id).join(',');
  useEffect(() => {
    if (!slug || slug === 'preview' || !key) { setReviews([]); return; }
    let alive = true;
    Promise.all(rated.map((p) => axios.get(`${BASE_URL}/public/store/${slug}/products/${p.id}/reviews`)
      .then((r) => ((r.data?.data || r.data)?.reviews || []).map((rv: any) => ({ ...rv, producto: p.descripcion })))
      .catch(() => [])))
      .then((all) => {
        if (!alive) return;
        setReviews((all.flat() as Review[]).filter((r) => String(r.comentario || '').trim().length >= 8).sort((a, b) => Number(b.rating) - Number(a.rating)).slice(0, 9));
      });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, key]);

  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const update = () => { const el = ref.current; if (el) setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 }); };
  useEffect(() => { update(); }, [reviews.length]);
  if (!reviews.length) return null;
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth, behavior: 'smooth' });
  const arrow = (dir: number, icon: string, label: string, off: boolean) => (
    <button type="button" aria-label={label} disabled={off} onClick={() => scroll(dir)} className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white transition-opacity disabled:opacity-35 md:flex" style={{ color: t.ink, boxShadow: `inset 0 0 0 1px ${t.line}` }}><Icon icon={icon} width={16} /></button>
  );

  return (
    <section className="mx-auto max-w-[1320px] px-4 pb-4 pt-12 lg:px-8">
      <SectionHeader t={t} title={editable(diseno?.maisonReviewsTitle, 'Lo que dicen nuestras clientas')} />
      <div className="flex items-center gap-4">
        {arrow(-1, 'solar:alt-arrow-left-linear', 'Anteriores', edge.start)}
        <div ref={ref} onScroll={update} className="-mx-4 flex flex-1 snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
          {reviews.map((r) => (
            <motion.figure key={r.id} variants={msReveal} initial="hidden" whileInView="show" viewport={msViewport} className={`flex w-[86%] shrink-0 snap-start flex-col rounded-[6px] bg-white p-6 sm:w-[46%] ${reviews.length >= 3 ? 'lg:w-[calc((100%-2rem)/3)]' : 'lg:w-[calc((100%-1rem)/2)]'}`} style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
              <Icon icon="ri:double-quotes-l" width={26} style={{ color: mix(t.primary, 55, '#fff') }} />
              <blockquote className="mt-2 line-clamp-4 text-[13.5px] leading-relaxed" style={{ color: t.ink }}>{String(r.comentario).trim()}</blockquote>
              <figcaption className="mt-auto flex items-end justify-between gap-3 pt-5">
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-[12.5px] font-semibold" style={{ color: t.ink }}>— {r.clienteNombre || 'Cliente'}</span>
                  <span className="mt-0.5 block truncate text-[11px]" style={{ color: t.muted }}>{r.compraVerificada ? 'Compra verificada · ' : ''}{r.producto}</span>
                </span>
                <span className="flex shrink-0" style={{ color: t.star }}>{Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon={i < Math.round(r.rating) ? 'solar:star-bold' : 'solar:star-linear'} width={13} />)}</span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
        {arrow(1, 'solar:alt-arrow-right-linear', 'Siguientes', edge.end)}
      </div>
    </section>
  );
}
