import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { buildCategoryTiles } from '@/templates/shared/categoryTiles';
import { resolveHeroIntervalMs, usePreloadImages } from '@/templates/shared/heroSlider';
import { getProductPricing, withPricingList } from '@/templates/shared/pricing';
import { sinStock } from '@/templates/shared/ventaSinStock';
import { resolverVideo, proporcionVideo } from '@/templates/shared/video';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import {
  PetalaHeader, PetalaFooter, PetalaCartModal, NoPhoto, buildServices, categoryIcon,
  petalaTheme, usePetalaFont, editable, optional, isOn, lines, flMoney, btnCls, eyebrowCls, goldBtn, FLORERIA_IMG, type Theme, type Service,
} from './PetalaParts';
import { ProductRail, GridSkeleton, SectionHeader, OfferCountdown, soonestOfferEnd, storeChannels, getName, hasImage, type OpenFn, type AddFn } from './PetalaSections';
import { announceAdded, useStoreTotal } from './PetalaExtras';
import { flEase, flHeroText, flItem, flReveal, flStagger, flViewport, mix } from './motion';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

// ═════════════════════════════════════════════════════════════════ PAGE ══
export default function PetalaHomePage(props: TemplateHomePageProps) {
  const { tienda, slug, productos, allCategories, diseno, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, agregarAlCarrito, actualizarCantidad, loading } = props as any;
  usePetalaFont();
  const navigate = useNavigate();
  const t = petalaTheme(diseno);
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
  const tiles = useMemo(() => buildCategoryTiles({ allCategories, diseno, prefix: 'floreria', count: 8, fallbackImages: [] }).map((tile) => {
    const same = (p: any) => getName(p?.categoria).toLowerCase() === tile.nombre.toLowerCase();
    const fromProduct = tile.imagenUrl ? '' : withImg.find(same)?.imagenUrl || '';
    return { ...tile, imagenUrl: tile.imagenUrl || fromProduct, isProduct: Boolean(fromProduct) };
  }), [allCategories, diseno, withImg]);
  const ch = storeChannels(tienda, diseno);
  const services = useMemo(() => buildServices(tienda, ch.hasWhatsapp), [tienda, ch.hasWhatsapp]);

  const cartCount = (carrito || []).reduce((s: number, i: any) => s + Number(i?.cantidad || 1), 0);
  const goCatalog = () => navigate(`/tienda/${slug}/catalogo`);
  const goCategory = (name: string) => navigate(`/tienda/${slug}/catalogo?category=${encodeURIComponent(name)}`);
  const goProduct: OpenFn = (p) => navigate(`/tienda/${slug}/producto/${p.id}`);
  const add: AddFn = (p, qty = 1) => agregarAlCarrito({ ...p, __cantidad: qty });
  const goAction = (key: string) => runStoreLinkAction(getStoreLinkAction(diseno, key, { defaultType: 'catalog' }), { slug, navigate });
  const offerEnd = soonestOfferEnd(offers);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-clip" style={{ background: t.bg, fontFamily: t.font }}>
        <PetalaHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={navigate} active="home" />

        <HeroSlider t={t} diseno={diseno} goAction={goAction} />
        {!isOn(diseno?.floreriaBenefitsHidden) && <BenefitsGlass t={t} services={services} />}

        {tiles.length > 0 && <OccasionTiles t={t} diseno={diseno} slug={slug} tiles={tiles} onPick={goCategory} onAll={goCatalog} />}

        {loading && !list.length ? (
          <section className="mx-auto max-w-[1320px] px-4 py-10 lg:px-8"><GridSkeleton t={t} count={6} cols="lg:grid-cols-6" /></section>
        ) : (
          <ProductRail t={t} eyebrow={editable(diseno?.floreriaPicksEyebrow, 'Ramos populares')} title={optional(diseno?.floreriaPicksTitle, '')} products={picks} slug={slug} onOpen={goProduct} onAdd={add} onMore={goCatalog} />
        )}

        {!isOn(diseno?.floreriaBuilderHidden) && <BouquetBuilder t={t} diseno={diseno} slug={slug} categories={categories} list={list} onAdd={add} onOpen={goProduct} />}

        {/* Con 1–2 ofertas ya se ven con su % en "Ramos populares"; el rail propio luce con 3 o más. */}
        {offers.length >= 3 && (
          <ProductRail
            t={t}
            eyebrow={editable(diseno?.floreriaOffersEyebrow, 'Precios especiales')}
            title={editable(diseno?.floreriaOffersTitle, 'Ofertas de temporada')}
            products={offers.slice(0, 12)}
            slug={slug}
            onOpen={goProduct}
            onAdd={add}
            right={offerEnd ? <div className="flex items-center gap-2.5"><span className="text-[12.5px]" style={{ color: t.muted }}>Terminan en</span><OfferCountdown t={t} endsAt={offerEnd} /></div> : undefined}
          />
        )}

        {!isOn(diseno?.floreriaWhyHidden) && <WhyUs t={t} diseno={diseno} services={services} />}
        <ReviewsAndClub t={t} diseno={diseno} slug={slug} list={list} ch={ch} storeName={tienda?.nombreComercial || tienda?.nombre || ''} />
        <div className="h-14" />

        <PetalaFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <PetalaCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } })} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.primary} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.primary} onGoProduct={(item: any) => goProduct(item)} />
      </div>
    </MotionConfig>
  );
}

// ═════════════════════════════════════════════════════════════════ HERO ══
type Slide = { image: string; onlyImage: boolean; eyebrow: string; title: string; highlight: string; subtitle: string; button: string; action: string };

function slidesFrom(diseno: any): Slide[] {
  const d = diseno || {};
  return [
    { image: d.floreriaHeroImage || FLORERIA_IMG.hero[0], onlyImage: isOn(d.floreriaHeroOnlyImage), eyebrow: optional(d.floreriaHeroEyebrow, ''), title: editable(d.floreriaHeroTitle, 'Emociones|que viven'), highlight: optional(d.floreriaHeroHighlight, 'en el recuerdo'), subtitle: optional(d.floreriaHeroSubtitle, 'Ramos y arreglos de autor para los momentos más importantes de tu vida.'), button: editable(d.floreriaHeroButton, 'Elegir ramo'), action: 'floreriaHeroAction' },
    { image: d.floreriaSlide2Image || FLORERIA_IMG.hero[1], onlyImage: isOn(d.floreriaSlide2OnlyImage), eyebrow: optional(d.floreriaSlide2Eyebrow, ''), title: editable(d.floreriaSlide2Title, 'Rosas que|dicen'), highlight: optional(d.floreriaSlide2Highlight, 'te quiero'), subtitle: optional(d.floreriaSlide2Subtitle, 'Elige el ramo y nosotros nos encargamos de que llegue a tiempo.'), button: editable(d.floreriaSlide2Button, 'Ver rosas'), action: 'floreriaSlide2Action' },
    { image: d.floreriaSlide3Image || FLORERIA_IMG.hero[2], onlyImage: isOn(d.floreriaSlide3OnlyImage), eyebrow: optional(d.floreriaSlide3Eyebrow, ''), title: editable(d.floreriaSlide3Title, 'Detalles|para cada'), highlight: optional(d.floreriaSlide3Highlight, 'ocasión'), subtitle: optional(d.floreriaSlide3Subtitle, 'Cumpleaños, aniversarios y celebraciones que merecen flores.'), button: editable(d.floreriaSlide3Button, 'Ver ocasiones'), action: 'floreriaSlide3Action' },
  ];
}

/** Pétalos que caen (decorativos). Aislados: su animación infinita no toca el resto de la página. */
function Petals({ color, count = 9 }: { color: string; count?: number }) {
  const petals = useMemo(() => Array.from({ length: count }, (_, i) => ({
    left: `${(i * 37 + 11) % 100}%`, size: 10 + ((i * 7) % 12), delay: (i * 1.3) % 9, duration: 11 + ((i * 3) % 7), drift: (i % 2 ? 1 : -1) * (30 + ((i * 13) % 50)), rot: 120 + ((i * 47) % 200),
  })), [count]);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {petals.map((p, i) => (
        <motion.svg key={i} viewBox="0 0 20 24" width={p.size} height={p.size * 1.2} className="absolute -top-8" style={{ left: p.left }} initial={{ y: -40, x: 0, rotate: 0, opacity: 0 }} animate={{ y: 760, x: p.drift, rotate: p.rot, opacity: [0, 0.85, 0.85, 0] }} transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear', times: [0, 0.1, 0.85, 1] }}>
          <path d="M10 0C16 5 20 11 17 18C15 22 12 24 10 24C8 24 5 22 3 18C0 11 4 5 10 0Z" fill={color} />
          <path d="M10 3C11 10 11 16 10 22" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.8" fill="none" />
        </motion.svg>
      ))}
    </div>
  );
}

/** Video del hero: solo existe si el empresario pegó un enlace que se puede reproducir. Estado aislado. */
function HeroVideoButton({ t, url, label }: { t: Theme; url: string; label: string }) {
  const [open, setOpen] = useState(false);
  const video = resolverVideo(url);
  if (!video) return null;
  if (video.tipo === 'enlace') {
    return <a href={video.src} target="_blank" rel="noopener noreferrer" className={`${btnCls} h-12 bg-white/70 pl-2 pr-5 backdrop-blur`} style={{ color: t.ink, boxShadow: `inset 0 0 0 1px ${t.line}` }}><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white" style={{ color: t.primaryInk }}><Icon icon="solar:play-bold" width={14} /></span>{label}</a>;
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${btnCls} h-12 bg-white/70 pl-2 pr-5 backdrop-blur`} style={{ color: t.ink, boxShadow: `inset 0 0 0 1px ${t.line}` }}>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white" style={{ color: t.primaryInk }}><Icon icon="solar:play-bold" width={14} /></span>{label}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setOpen(false)} role="dialog" aria-label={label}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }} transition={{ duration: 0.25, ease: flEase }} className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-black" style={{ aspectRatio: proporcionVideo(video), maxHeight: '85vh' }} onClick={(e) => e.stopPropagation()}>
              {video.tipo === 'archivo' ? <video src={video.src} controls autoPlay className="h-full w-full" /> : <iframe title={label} src={`${video.src}${video.src.includes('?') ? '&' : '?'}autoplay=1`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full border-0" />}
              <button type="button" aria-label="Cerrar video" onClick={() => setOpen(false)} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90" style={{ color: t.ink }}><Icon icon="solar:close-circle-linear" width={22} /></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Slider del hero (foto grande a la derecha, titular serif a la izquierda). Aislado: su timer solo re-renderiza este componente. */
function HeroSlider({ t, diseno, goAction }: { t: Theme; diseno: any; goAction: (k: string) => void }) {
  const slides = useMemo(() => slidesFrom(diseno), [diseno]);
  const interval = resolveHeroIntervalMs(diseno, 'floreriaHeroInterval', 7000);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  usePreloadImages(slides.map((s) => s.image));
  useEffect(() => {
    if (!interval || paused) return;
    const id = window.setTimeout(() => setIdx((v) => (v + 1) % slides.length), interval);
    return () => window.clearTimeout(id);
  }, [idx, interval, paused, slides.length]);
  const s = slides[idx];
  const videoUrl = String(diseno?.floreriaHeroVideoUrl || '').trim();
  const scrollNext = () => { const el = rootRef.current; if (el) window.scrollTo({ top: el.offsetTop + el.offsetHeight - 70, behavior: 'smooth' }); };

  return (
    <section ref={rootRef} className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carrusel">
      <div className="relative mx-auto min-h-[600px] max-w-[1600px] overflow-hidden lg:h-[680px]" style={{ background: `linear-gradient(110deg, ${t.bg} 0%, ${t.blush} 100%)` }}>
        <div aria-hidden className={s.onlyImage ? 'absolute inset-0' : 'absolute inset-x-0 top-0 h-[320px] [mask-image:linear-gradient(180deg,#000_60%,transparent)] lg:inset-y-0 lg:left-auto lg:h-full lg:w-[66%] lg:[mask-image:linear-gradient(90deg,transparent,#000_32%)]'}>
          {slides.map((sl, i) => (
            <motion.img key={sl.action} src={sl.image} alt="" initial={false} animate={{ opacity: i === idx ? 1 : 0, scale: i === idx ? 1 : 1.05 }} transition={{ duration: 1.4, ease: flEase }} className="absolute inset-0 h-full w-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
          ))}
        </div>
        {!isOn(diseno?.floreriaPetalsHidden) && <Petals color={mix(t.accent, 70, '#fff')} />}

        {s.onlyImage ? (
          <button type="button" aria-label={s.title.replace(/\|/g, ' ')} onClick={() => goAction(s.action)} className="absolute inset-0 z-[1]" />
        ) : (
          <div className="relative z-[2] mx-auto flex max-w-[1320px] px-4 pb-32 pt-[300px] lg:h-full lg:items-center lg:px-8 lg:pb-24 lg:pt-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={idx} variants={flStagger} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.25 } }} className="max-w-[600px]">
                {s.eyebrow && <motion.p variants={flHeroText} className={eyebrowCls} style={{ color: t.primaryInk }}>{s.eyebrow}</motion.p>}
                <motion.h1 variants={flHeroText} className="mt-3 whitespace-pre-line text-[46px] font-normal uppercase leading-[0.98] tracking-[0.005em] sm:text-[62px] lg:text-[74px]" style={{ color: t.ink, fontFamily: t.serif }}>
                  {lines(s.title)}
                  {s.highlight && <><br /><span style={{ color: t.primaryInk }}>{s.highlight}</span></>}
                </motion.h1>
                {s.subtitle && <motion.p variants={flHeroText} className="mt-6 max-w-[340px] text-[15px] leading-relaxed" style={{ color: mix(t.ink, 72, t.bg) }}>{s.subtitle}</motion.p>}
                <motion.div variants={flHeroText} className="mt-8 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={() => goAction(s.action)} className={`${btnCls} group h-12 pl-7 pr-6`} style={goldBtn(t)}>
                    {s.button}<Icon icon="solar:arrow-right-linear" width={17} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                  </button>
                  {videoUrl && <HeroVideoButton t={t} url={videoUrl} label={editable(diseno?.floreriaHeroVideoLabel, 'Ver video')} />}
                </motion.div>
                {!isOn(diseno?.floreriaScrollHintHidden) && (
                  <motion.button variants={flHeroText} type="button" onClick={scrollNext} className="mt-12 hidden items-center gap-3 text-[12px] lg:inline-flex" style={{ color: t.muted }}>
                    <span className="relative flex h-8 w-5 justify-center rounded-full" style={{ boxShadow: `inset 0 0 0 1.5px ${mix(t.ink, 35, 'transparent')}` }}>
                      <motion.span className="mt-1.5 h-1.5 w-1 rounded-full" style={{ background: t.ink }} animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
                    </span>
                    {editable(diseno?.floreriaScrollHint, 'Desliza hacia abajo')}
                  </motion.button>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        <div className="absolute bottom-24 right-6 z-[3] flex gap-1.5 rounded-full bg-white/75 px-2.5 py-2 backdrop-blur lg:right-10">
          {slides.map((sl, i) => (
            <button key={sl.action} type="button" aria-label={`Ir al banner ${i + 1}`} aria-current={i === idx} onClick={() => setIdx(i)} className="relative h-1.5 overflow-hidden rounded-full transition-[width] duration-500" style={{ width: i === idx ? 30 : 8, background: mix(t.primary, 25, '#fff') }}>
              {i === idx && <motion.span key={`${idx}-${paused}`} aria-hidden className="absolute inset-0 origin-left rounded-full" style={{ background: t.primary }} initial={{ scaleX: interval && !paused ? 0 : 1 }} animate={{ scaleX: 1 }} transition={{ duration: interval && !paused ? interval / 1000 : 0, ease: 'linear' }} />}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════ BENEFICIOS (vidrio) ══
function BenefitsGlass({ t, services }: { t: Theme; services: Service[] }) {
  if (!services.length) return null;
  const cols: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5' };
  return (
    <section className="relative z-10 mx-auto -mt-16 max-w-[1320px] px-4 lg:px-8">
      <motion.ul key={services.map((x) => x.label).join('|')} variants={flStagger} initial="hidden" whileInView="show" viewport={flViewport} className={`grid grid-cols-2 gap-y-5 rounded-[24px] bg-white/80 px-5 py-6 backdrop-blur-xl sm:grid-cols-3 lg:divide-x ${cols[services.length] || 'lg:grid-cols-5'}`} style={{ boxShadow: `inset 0 0 0 1px ${mix('#fff', 60, 'transparent')}, 0 30px 60px -40px rgba(43,35,33,0.45)`, borderColor: t.line }}>
        {services.map((s) => (
          <motion.li key={s.label} variants={flItem} className="flex items-center gap-3 px-3 lg:justify-center" style={{ borderColor: t.line }}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: t.softer, color: t.primaryInk, boxShadow: `inset 0 0 0 1px ${t.line}` }}><Icon icon={s.icon} width={19} /></span>
            <span className="min-w-0 leading-tight">
              <span className="block text-[12.5px] font-medium" style={{ color: t.ink }}>{s.label}</span>
              <span className="mt-0.5 block text-[11.5px]" style={{ color: t.muted }}>{s.sub}</span>
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

// ═════════════════════════════════════════════════ OCASIONES (tiles) ══
/** Conteo real de ramos de la categoría (API pública). Aislado por tile. */
function TileCount({ slug, category }: { slug: string; category: string }) {
  const n = useStoreTotal(slug, category);
  if (!n) return null;
  return <span className="mt-0.5 block text-[11.5px] text-white/80">{n} {n === 1 ? 'diseño' : 'diseños'}</span>;
}

/** Imagen del tile con fallback si la URL está rota. Estado propio aislado. */
function TileImage({ t, src, name }: { t: Theme; src: string; name: string }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  if (!src || broken) return <span className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(160deg, ${t.blush}, ${mix(t.primary, 30, t.bg)})` }}><Icon icon={categoryIcon(name)} width={54} style={{ color: '#fff' }} /></span>;
  return <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />;
}

function OccasionTiles({ t, diseno, slug, tiles, onPick, onAll }: { t: Theme; diseno: any; slug: string; tiles: { nombre: string; label: string; imagenUrl: string; isProduct: boolean }[]; onPick: (c: string) => void; onAll: () => void }) {
  const showCounts = !isOn(diseno?.floreriaTileCountsHidden);
  // Columnas según las ocasiones reales (sin huecos a la derecha): 4 a 8 por fila en escritorio.
  const cols: Record<number, string> = { 1: 'lg:grid-cols-4', 2: 'lg:grid-cols-4', 3: 'lg:grid-cols-4', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6', 7: 'lg:grid-cols-7', 8: 'lg:grid-cols-8' };
  return (
    <section className="mx-auto max-w-[1320px] px-4 pb-4 pt-16 lg:px-8">
      <SectionHeader t={t} eyebrow={editable(diseno?.floreriaTilesEyebrow, 'Catálogo de colecciones')} title={editable(diseno?.floreriaTilesTitle, 'Elige una idea|para tu ocasión')} onMore={onAll} moreLabel="Ver todo" />
      <motion.div key={tiles.map((x) => x.nombre).join('|')} variants={flStagger} initial="hidden" whileInView="show" viewport={flViewport} className={`-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:gap-4 lg:mx-0 lg:grid ${cols[tiles.length] || 'lg:grid-cols-8'} lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden`}>
        {tiles.map((c) => (
          <motion.button key={c.nombre} type="button" variants={flItem} onClick={() => onPick(c.nombre)} className="group relative aspect-[3/4.3] w-[44%] shrink-0 snap-start overflow-hidden rounded-[20px] text-left sm:w-[28%] lg:w-auto" style={{ background: t.card }}>
            <TileImage t={t} src={c.imagenUrl} name={c.nombre} />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
              <span className="min-w-0">
                <span className="line-clamp-2 block break-words text-[17px] font-medium leading-tight text-white [hyphens:auto]" lang="es" style={{ fontFamily: t.serif }}>{c.label}</span>
                {showCounts && <TileCount slug={slug} category={c.nombre} />}
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur transition-colors group-hover:bg-white/40"><Icon icon="solar:arrow-right-up-linear" width={15} /></span>
            </span>
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════ ARMA TU RAMO ══
type Step = { key: string; label: string; icon: string; category: string };
const STEP_RULES: { label: string; icon: string; re: RegExp }[] = [
  { label: 'Flores', icon: 'ph:flower-tulip-light', re: /rosa|flor|tallo|tulip|girasol|lirio|orquid|peon|clavel|gerber|hortens/ },
  { label: 'Envoltura', icon: 'ph:package-light', re: /envolt|papel|caja|base|florero|jarr|canast|cesta/ },
  { label: 'Extras', icon: 'ph:gift-light', re: /globo|peluche|chocolat|vino|dulce|extra|complement|taza|desayuno/ },
  { label: 'Cinta', icon: 'ph:ribbon-light', re: /cinta|lazo|mono/ },
  { label: 'Tarjeta', icon: 'ph:envelope-simple-light', re: /tarjeta|dedicat|carta|sobre/ },
  { label: 'Aroma', icon: 'ph:drop-light', re: /aroma|perfum|vela|esencia/ },
];
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Pasos del armador: categorías elegidas en el editor o, si no, detectadas por nombre en tus categorías reales. */
function resolveSteps(diseno: any, categories: string[]): Step[] {
  const picked: Step[] = [];
  for (let n = 1; n <= 6; n++) {
    const cat = String(diseno?.[`floreriaBuilderStep${n}Cat`] || '').trim();
    if (!cat || !categories.some((c) => norm(c) === norm(cat))) continue;
    const rule = STEP_RULES.find((r) => r.re.test(norm(cat)));
    picked.push({ key: `s${n}`, label: editable(diseno?.[`floreriaBuilderStep${n}Label`], cat), icon: rule?.icon || 'ph:flower-light', category: cat });
  }
  if (picked.length) return picked;
  // Automático: solo tiene sentido si la tienda vende flores sueltas; si no, el armador no aparece.
  if (!categories.some((c) => STEP_RULES[0].re.test(norm(c)))) return [];
  const used = new Set<string>();
  return STEP_RULES.flatMap((r, i) => {
    const cat = categories.find((c) => !used.has(c) && r.re.test(norm(c)));
    if (!cat) return [];
    used.add(cat);
    return [{ key: `a${i}`, label: r.label, icon: r.icon, category: cat }];
  });
}

const stepCache = new Map<string, Promise<any[]>>();
function fetchStep(slug: string, category: string): Promise<any[]> {
  const key = `${slug}::${category}`;
  if (!stepCache.has(key)) {
    stepCache.set(key, axios.get(`${BASE_URL}/public/store/${slug}/products`, { params: { category, limit: 24 } })
      .then((r) => { const d = r.data?.data ?? r.data; return withPricingList(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []); })
      .catch(() => { stepCache.delete(key); return []; }));
  }
  return stepCache.get(key)!;
}

/**
 * "Arma tu ramo": eliges elementos REALES de la tienda por paso (flores, envoltura, extras…), ves el total
 * real y los agregas al pedido. Cada elemento entra al carrito como producto propio; la florería arma el ramo
 * y el cliente indica la composición en la nota. Todo el estado vive aquí (no re-renderiza la página).
 * Sin pasos que mostrar (la tienda no tiene esas categorías), la sección no aparece.
 */
function BouquetBuilder({ t, diseno, slug, categories, list, onAdd, onOpen }: { t: Theme; diseno: any; slug: string; categories: string[]; list: any[]; onAdd: AddFn; onOpen: OpenFn }) {
  const steps = useMemo(() => resolveSteps(diseno, categories), [diseno, categories]);
  const [active, setActive] = useState(0);
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<Record<string, { producto: any; qty: number }>>({});
  const [last, setLast] = useState<any>(null);
  const [done, setDone] = useState(false);
  const step = steps[Math.min(active, Math.max(0, steps.length - 1))];

  useEffect(() => {
    if (!step) return;
    let alive = true;
    if (!slug || slug === 'preview') {
      setOptions(list.filter((p) => norm(getName(p?.categoria)) === norm(step.category)).slice(0, 24));
      return;
    }
    setLoading(true);
    fetchStep(slug, step.category).then((items) => { if (alive) { setOptions(items); setLoading(false); } });
    return () => { alive = false; };
  }, [slug, step?.category, list]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!steps.length) return null;
  const items = Object.values(picked);
  const total = items.reduce((s, it) => s + getProductPricing(it.producto).precioFinal * it.qty, 0);
  const change = (p: any, delta: number) => {
    setDone(false);
    setPicked((cur) => {
      const k = String(p.id);
      const qty = Math.max(0, (cur[k]?.qty || 0) + delta);
      const next = { ...cur };
      if (qty === 0) delete next[k]; else next[k] = { producto: p, qty };
      return next;
    });
    if (delta > 0) setLast(p);
  };
  const addAll = () => {
    if (!items.length) return;
    items.forEach((it) => onAdd(it.producto, it.qty));
    // Aviso honesto: un resumen del ramo (N elementos, total real), no la cantidad de un solo producto.
    const n = items.reduce((acc, it) => acc + it.qty, 0);
    announceAdded({ descripcion: `Tu ramo · ${n} ${n === 1 ? 'elemento' : 'elementos'}`, imagenUrl: items.find((it) => it.producto?.imagenUrl)?.producto.imagenUrl, precioUnitario: total }, 1);
    setPicked({});
    setDone(true);
  };
  const visual = last?.imagenUrl || diseno?.floreriaBuilderImage || FLORERIA_IMG.builder;

  return (
    <section id="arma-tu-ramo" className="mx-auto max-w-[1320px] scroll-mt-24 px-4 py-10 lg:px-8">
      <motion.div variants={flReveal} initial="hidden" whileInView="show" viewport={flViewport} className="grid gap-5 overflow-hidden rounded-[30px] p-5 sm:p-7 lg:grid-cols-[1fr_190px_1.25fr_0.95fr] lg:items-stretch" style={{ background: `linear-gradient(120deg, ${t.softer} 0%, ${t.soft} 55%, ${t.blush} 100%)`, boxShadow: `inset 0 0 0 1px ${t.line}` }}>
        <div className="flex flex-col justify-center lg:pr-2">
          <p className={eyebrowCls} style={{ color: t.primaryInk }}>{editable(diseno?.floreriaBuilderEyebrow, 'Arma tu ramo')}</p>
          <h2 className="mt-3 whitespace-pre-line text-[34px] font-normal leading-[1.05] sm:text-[40px]" style={{ color: t.ink, fontFamily: t.serif }}>{lines(editable(diseno?.floreriaBuilderTitle, 'Crea el ramo|de tus sueños'))}</h2>
          <p className="mt-3 max-w-xs text-[13.5px] leading-relaxed" style={{ color: t.muted }}>{editable(diseno?.floreriaBuilderText, 'Elige tus flores favoritas, suma los detalles y nosotros armamos una composición única para ti.')}</p>
          <p className="mt-4 flex items-start gap-2 text-[12px]" style={{ color: t.muted }}><Icon icon="solar:info-circle-linear" width={16} className="mt-px shrink-0" style={{ color: t.primaryInk }} />Cada elemento entra a tu pedido con su precio. En la nota del checkout cuéntanos cómo lo quieres.</p>
        </div>

        {/* Pasos (categorías reales) */}
        <div className="flex gap-1.5 overflow-x-auto rounded-[20px] bg-white/70 p-2 backdrop-blur [scrollbar-width:none] lg:flex-col lg:overflow-visible [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Pasos para armar tu ramo">
          {steps.map((st, i) => {
            const on = i === active;
            const n = items.filter((it) => norm(getName(it.producto?.categoria)) === norm(st.category)).reduce((s, it) => s + it.qty, 0);
            return (
              <button key={st.key} type="button" role="tab" aria-selected={on} onClick={() => setActive(i)} className="relative flex shrink-0 items-center gap-2.5 rounded-[14px] px-3 py-2.5 text-left text-[13px] font-medium transition-colors" style={{ color: on ? t.ink : t.muted }}>
                {on && <motion.span layoutId="fl-builder-step" className="absolute inset-0 rounded-[14px]" style={{ background: t.blush }} transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                <Icon icon={st.icon} width={18} className="relative shrink-0" style={{ color: on ? t.primaryInk : t.muted }} />
                <span className="relative">{st.label}</span>
                {n > 0 && <span className="relative ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-semibold" style={{ background: t.primary, color: t.onPrimary }}>{n}</span>}
              </button>
            );
          })}
        </div>

        {/* Visual + opciones del paso */}
        <div className="flex min-w-0 flex-col gap-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-white/60 lg:aspect-auto lg:min-h-[210px] lg:flex-1">
            <AnimatePresence mode="wait" initial={false}>
              <motion.img key={visual} src={visual} alt="" initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: flEase }} className={`absolute inset-0 h-full w-full ${last?.imagenUrl ? 'object-contain p-4 mix-blend-multiply' : 'object-cover'}`} />
            </AnimatePresence>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-live="polite">
            {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[84px] w-[180px] shrink-0 animate-pulse rounded-[16px] bg-white/70" />)
              : !options.length ? <p className="px-2 py-6 text-[13px]" style={{ color: t.muted }}>Aún no hay elementos en esta categoría.</p>
              : options.map((p) => {
                const qty = picked[String(p.id)]?.qty || 0;
                const out = sinStock(p?.stock ?? 1);
                const variants = Array.isArray(p?.variantes) && p.variantes.length > 0;
                return (
                  <div key={p.id} className="flex w-[200px] shrink-0 items-center gap-2.5 rounded-[16px] bg-white p-2" style={{ boxShadow: `inset 0 0 0 ${qty ? 1.5 : 1}px ${qty ? t.primary : t.line}` }}>
                    <button type="button" onClick={() => onOpen(p)} aria-label={`Ver ${p.descripcion}`} className="h-16 w-14 shrink-0 overflow-hidden rounded-[12px]" style={{ background: t.card }}>
                      {p.imagenUrl ? <img src={p.imagenUrl} alt="" loading="lazy" className="h-full w-full object-contain p-1 mix-blend-multiply" /> : <NoPhoto t={t} producto={p} size={22} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[12.5px] font-medium leading-tight" style={{ color: t.ink }}>{p.descripcion}</p>
                      <p className="mt-0.5 text-[12px] font-semibold" style={{ color: t.primaryInk }}>{flMoney(getProductPricing(p).precioFinal)}</p>
                      <div className="mt-1 flex items-center gap-1">
                        {out ? <span className="text-[11px]" style={{ color: t.muted }}>Agotado</span>
                          : variants ? <button type="button" onClick={() => onOpen(p)} className="text-[11px] font-medium underline underline-offset-2" style={{ color: t.ink }}>Elegir opción</button>
                          : (
                            <>
                              {qty > 0 && <button type="button" aria-label="Quitar uno" onClick={() => change(p, -1)} className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: t.softer, color: t.ink }}>−</button>}
                              {qty > 0 && <span className="w-5 text-center text-[12px] font-semibold" style={{ color: t.ink }}>{qty}</span>}
                              <button type="button" aria-label="Agregar uno" onClick={() => change(p, 1)} className="flex h-6 w-6 items-center justify-center rounded-full" style={goldBtn(t)}><Icon icon="solar:add-linear" width={13} /></button>
                            </>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Resumen */}
        <div className="flex flex-col rounded-[22px] bg-white/85 p-5 backdrop-blur" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
          <p className="text-[13px] font-medium" style={{ color: t.muted }}>{editable(diseno?.floreriaBuilderSummary, 'Tu ramo')}</p>
          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
              <Icon icon={done ? 'solar:check-circle-linear' : 'ph:flower-tulip-light'} width={34} style={{ color: t.primaryInk }} />
              <p className="mt-2 max-w-[200px] text-[12.5px]" style={{ color: t.muted }}>{done ? '¡Listo! Lo agregamos a tu pedido.' : 'Suma elementos con el botón + para ver tu ramo aquí.'}</p>
            </div>
          ) : (
            <ul className="mt-3 flex-1 space-y-2.5 overflow-y-auto pr-1 lg:max-h-[220px]">
              {items.map((it) => (
                <li key={it.producto.id} className="flex items-center gap-2.5 text-[12.5px]">
                  <span className="h-7 w-7 shrink-0 overflow-hidden rounded-full" style={{ background: t.card }}>{it.producto.imagenUrl ? <img src={it.producto.imagenUrl} alt="" className="h-full w-full object-cover" /> : <NoPhoto t={t} producto={it.producto} size={14} />}</span>
                  <span className="min-w-0 flex-1 truncate" style={{ color: t.ink }}>{it.producto.descripcion}</span>
                  <span className="shrink-0 tabular-nums" style={{ color: t.muted }}>{it.qty} u.</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex items-center justify-between border-t pt-4" style={{ borderColor: t.line }}>
            <span className="text-[13px]" style={{ color: t.muted }}>Total</span>
            <span className="text-[22px] font-semibold" style={{ color: t.ink }}>{flMoney(total)}</span>
          </div>
          <button type="button" disabled={!items.length} onClick={addAll} className={`${btnCls} mt-3 h-12 w-full disabled:cursor-not-allowed disabled:opacity-45`} style={goldBtn(t)}>
            {editable(diseno?.floreriaBuilderButton, 'Agregar al pedido')}
          </button>
        </div>
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════ POR QUÉ ELEGIRNOS ══
function WhyUs({ t, diseno, services }: { t: Theme; diseno: any; services: Service[] }) {
  const items = services.map((s, i) => ({
    key: s.label,
    img: diseno?.[`floreriaWhy${i + 1}Image`] || FLORERIA_IMG.why[i % FLORERIA_IMG.why.length],
    title: editable(diseno?.[`floreriaWhy${i + 1}Title`], s.label),
    text: editable(diseno?.[`floreriaWhy${i + 1}Text`], s.sub),
  }));
  if (!items.length) return null;
  const cols: Record<number, string> = { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5' };
  return (
    <section className="mx-auto max-w-[1320px] px-4 py-12 lg:px-8">
      <SectionHeader t={t} eyebrow={editable(diseno?.floreriaWhyEyebrow, 'Por qué elegirnos')} title={optional(diseno?.floreriaWhyTitle, '')} />
      <motion.div key={items.map((x) => x.key).join('|')} variants={flStagger} initial="hidden" whileInView="show" viewport={flViewport} className={`grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 ${cols[items.length] || 'lg:grid-cols-5'}`}>
        {items.map((it) => (
          <motion.figure key={it.key} variants={flItem} className="group flex flex-col items-center text-center">
            <div className="relative aspect-square w-full max-w-[210px] overflow-hidden rounded-full" style={{ background: t.card, boxShadow: `0 26px 50px -36px rgba(43,35,33,0.55), inset 0 0 0 6px #fff` }}>
              <img src={it.img} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
            </div>
            <figcaption className="mt-4 max-w-[200px]">
              <span className="block text-[18px] font-medium leading-tight" style={{ color: t.ink, fontFamily: t.serif }}>{it.title}</span>
              <span className="mt-1 block text-[12.5px]" style={{ color: t.muted }}>{it.text}</span>
            </figcaption>
          </motion.figure>
        ))}
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════ RESEÑAS + SUSCRIPCIÓN ══
type Review = { id: number; clienteNombre?: string; rating: number; comentario?: string; compraVerificada?: boolean; producto: string };

/** Reseñas APROBADAS reales (de productos con ratingCount > 0) + club por WhatsApp. Carga aislada aquí. */
function ReviewsAndClub({ t, diseno, slug, list, ch, storeName }: { t: Theme; diseno: any; slug: string; list: any[]; ch: ReturnType<typeof storeChannels>; storeName: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const rated = list.filter((p) => Number(p?.ratingCount || 0) > 0).slice(0, 4);
  const key = rated.map((p) => p.id).join(',');
  useEffect(() => {
    if (!slug || slug === 'preview' || !key) { setReviews([]); return; }
    let alive = true;
    Promise.all(rated.map((p) => axios.get(`${BASE_URL}/public/store/${slug}/products/${p.id}/reviews`)
      .then((r) => ((r.data?.data || r.data)?.reviews || []).map((rv: any) => ({ ...rv, producto: p.descripcion })))
      .catch(() => [])))
      .then((all) => {
        if (!alive) return;
        setReviews((all.flat() as Review[]).filter((r) => String(r.comentario || '').trim().length >= 8).sort((a, b) => Number(b.rating) - Number(a.rating)).slice(0, 3));
      });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, key]);

  const showClub = ch.hasWhatsapp && !isOn(diseno?.floreriaClubHidden);
  if (!reviews.length && !showClub) return null;
  return (
    <section className="mx-auto max-w-[1320px] px-4 py-6 lg:px-8">
      <div className={`grid gap-4 ${reviews.length && showClub ? 'lg:grid-cols-[1.45fr_1fr]' : ''}`}>
        {reviews.length > 0 && (
          <motion.div key={reviews.map((r) => r.id).join('|')} variants={flReveal} initial="hidden" whileInView="show" viewport={flViewport} className="rounded-[26px] bg-white p-6 sm:p-7" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
            <p className={eyebrowCls} style={{ color: t.primaryInk }}>{editable(diseno?.floreriaReviewsTitle, 'Opiniones de clientes')}</p>
            <div className={`mt-5 grid gap-4 ${reviews.length === 1 ? '' : reviews.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
              {reviews.map((r) => (
                <figure key={r.id} className="flex flex-col rounded-[20px] p-4" style={{ background: t.softer }}>
                  <span className="flex" style={{ color: t.star }}>{Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon={i < Math.round(r.rating) ? 'solar:star-bold' : 'solar:star-linear'} width={13} />)}</span>
                  <blockquote className="mt-2 line-clamp-4 text-[13.5px] leading-relaxed" style={{ color: t.ink }}>{String(r.comentario).trim()}</blockquote>
                  <figcaption className="mt-auto flex items-center gap-2.5 pt-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[14px]" style={{ background: t.blush, color: t.primaryInk, fontFamily: t.serif }}>{(r.clienteNombre || 'C').trim().charAt(0).toUpperCase()}</span>
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-[12.5px] font-medium" style={{ color: t.ink }}>{r.clienteNombre || 'Cliente'}</span>
                      <span className="block truncate text-[11px]" style={{ color: t.muted }}>{r.compraVerificada ? 'Compra verificada · ' : ''}{r.producto}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </motion.div>
        )}
        {showClub && <ClubCard t={t} diseno={diseno} wa={ch.wa} storeName={storeName} wide={!reviews.length} />}
      </div>
    </section>
  );
}

/** "Suscríbete": abre WhatsApp con el mensaje listo (no hay registro por correo; nunca simula un alta). */
function ClubCard({ t, diseno, wa, storeName, wide }: { t: Theme; diseno: any; wa: (msg?: string) => string | null; storeName: string; wide: boolean }) {
  const [name, setName] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const who = name.trim() ? `Soy ${name.trim()}. ` : '';
    const url = wa(`Hola${storeName ? ` ${storeName}` : ''}, ${who}quiero recibir sus novedades y colecciones por WhatsApp.`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <motion.div variants={flReveal} initial="hidden" whileInView="show" viewport={flViewport} className={`relative overflow-hidden rounded-[26px] p-6 sm:p-8 ${wide ? 'lg:min-h-[260px]' : ''}`} style={{ background: `linear-gradient(120deg, #fff 0%, ${t.softer} 45%, ${t.blush} 100%)`, boxShadow: `inset 0 0 0 1px ${t.line}` }}>
      <img src={diseno?.floreriaClubImage || FLORERIA_IMG.club} alt="" loading="lazy" className="pointer-events-none absolute -right-10 bottom-0 top-0 hidden h-full w-[46%] object-cover [mask-image:linear-gradient(90deg,transparent,#000_40%)] sm:block" />
      <div className="relative max-w-[360px]">
        <h2 className="whitespace-pre-line text-[24px] font-normal uppercase leading-[1.1] tracking-[0.02em]" style={{ color: t.ink, fontFamily: t.serif }}>{lines(editable(diseno?.floreriaClubTitle, 'Suscríbete y recibe|novedades'))}</h2>
        <p className="mt-2 text-[13px]" style={{ color: t.muted }}>{editable(diseno?.floreriaClubText, 'Nuevas colecciones y fechas especiales, directo a tu WhatsApp.')}</p>
        <form onSubmit={submit} className="mt-5 flex flex-col gap-2 rounded-full bg-white p-1.5 sm:flex-row" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" aria-label="Tu nombre" className="h-11 min-w-0 flex-1 appearance-none rounded-full border-0 bg-transparent bg-none px-4 text-[13.5px] outline-none placeholder:text-stone-400 focus:ring-0" style={{ color: t.ink }} />
          <button type="submit" className={`${btnCls} h-11 px-6`} style={goldBtn(t)}><Icon icon="ic:baseline-whatsapp" width={17} />{editable(diseno?.floreriaClubButton, 'Suscribirme')}</button>
        </form>
      </div>
    </motion.div>
  );
}
