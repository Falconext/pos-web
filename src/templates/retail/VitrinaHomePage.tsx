import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { buildCategoryTiles } from '@/templates/shared/categoryTiles';
import { resolveHeroIntervalMs, usePreloadImages, slidesVisibles } from '@/templates/shared/heroSlider';
import { getProductPricing } from '@/templates/shared/pricing';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import {
  VitrinaHeader, VitrinaFooter, VitrinaCartModal, buildServices, categoryIcon, nameOf,
  vitrinaTheme, useVitrinaFont, editable, optional, isOn, btnCls, RETAIL_IMG, type Theme, type Service,
} from './VitrinaParts';
import { ProductRail, ProductGrid, GridSkeleton, SectionHeader, OfferCountdown, StatBlock, Swoosh, soonestOfferEnd, storeChannels, getName, hasImage, type OpenFn, type AddFn } from './VitrinaSections';
import { vtEase, vtHeroText, vtItem, vtReveal, vtStagger, vtViewport, mix } from './motion';
import { CategoryCount, useStoreTotal, useViewedProducts } from './VitrinaExtras';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';
const HOME_PAGE_SIZE = 30; // límite de productos que carga [slug].tsx para el home

/** "Hecho para tu|forma de" → saltos de línea (el editor es de una línea). */
const lines = (s: string) => s.replace(/\s*\|\s*/g, '\n');

// ═════════════════════════════════════════════════════════════════ PAGE ══
export default function VitrinaHomePage(props: TemplateHomePageProps) {
  const { tienda, slug, productos, allCategories, diseno, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, agregarAlCarrito, actualizarCantidad, loading } = props as any;
  useVitrinaFont();
  const navigate = useNavigate();
  const t = vitrinaTheme(diseno);
  const [showFav, setShowFav] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);

  const list: any[] = useMemo(() => (Array.isArray(productos) ? productos : []), [productos]);
  const withImg = useMemo(() => list.filter(hasImage), [list]);
  const categories: string[] = useMemo(() => (allCategories || []).map(getName).filter(Boolean), [allCategories]);
  const picks = useMemo(() => {
    const pool = [...withImg, ...list.filter((p) => !hasImage(p))];
    return [...pool.filter((p) => p?.destacado), ...pool.filter((p) => !p?.destacado)].slice(0, 10);
  }, [list, withImg]);
  const offers = useMemo(() => list.filter((p) => getProductPricing(p).enOferta), [list]);
  // "Descubre más": primero lo que no salió en Recomendados (ofertas adelante), luego se completa.
  const more = useMemo(() => {
    const shown = new Set(picks.map((p) => p.id));
    const rest = [...offers, ...withImg, ...list].filter((p, i, a) => !shown.has(p.id) && a.findIndex((x) => x.id === p.id) === i);
    return (rest.length >= 6 ? rest : [...rest, ...picks.slice().reverse()].filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i)).slice(0, 6);
  }, [list, withImg, offers, picks]);
  const tiles = useMemo(() => buildCategoryTiles({ allCategories, diseno, prefix: 'retail', count: 6, fallbackImages: [] }).map((tile) => {
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
        <VitrinaHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={navigate} active="home" />

        <HeroSlider t={t} diseno={diseno} services={services} goAction={goAction} />
        <CategoryStrip t={t} diseno={diseno} slug={slug} tiles={tiles} onPick={goCategory} onAll={goCatalog} />
        {!isOn(diseno?.retailBenefitsHidden) && <BenefitsBar t={t} services={services} />}

        {loading && !list.length ? (
          <section className="mx-auto max-w-[1280px] px-4 py-8 lg:px-8"><GridSkeleton t={t} count={5} cols="lg:grid-cols-5" /></section>
        ) : (
          <ProductRail t={t} title={editable(diseno?.retailPicksTitle, 'Recomendados para ti')} products={picks} slug={slug} onOpen={goProduct} onAdd={add} onMore={goCatalog} />
        )}

        {!isOn(diseno?.retailPromosHidden) && <PromoBanners t={t} diseno={diseno} hasOffers={offers.length > 0} goAction={goAction} />}

        {/* Con 1–2 ofertas ya se ven con su % en las demás filas; el rail propio luce solo con 3 o más. */}
        {offers.length >= 3 && (
          <ProductRail
            t={t}
            title={editable(diseno?.retailOffersTitle, 'Ofertas de la semana')}
            products={offers.slice(0, 10)}
            slug={slug}
            onOpen={goProduct}
            onAdd={add}
            right={offerEnd ? <div className="flex items-center gap-2.5"><span className="text-[12.5px] font-bold" style={{ color: t.muted }}>Terminan en</span><OfferCountdown t={t} endsAt={offerEnd} /></div> : undefined}
          />
        )}

        {more.length >= 3 && (
          <section className="mx-auto max-w-[1280px] px-4 py-8 lg:px-8">
            <SectionHeader t={t} title={editable(diseno?.retailMoreTitle, 'Descubre más')} onMore={goCatalog} />
            <ProductGrid t={t} products={more} slug={slug} onOpen={goProduct} onAdd={add} cols="lg:grid-cols-6" compact />
          </section>
        )}

        <ViewedRail t={t} diseno={diseno} slug={slug} onOpen={goProduct} onAdd={add} />

        {!isOn(diseno?.retailTrustHidden) && <TrustBand t={t} diseno={diseno} slug={slug} tienda={tienda} list={list} categories={categories.length} />}
        {ch.hasWhatsapp && !isOn(diseno?.retailClubHidden) && <ClubBand t={t} diseno={diseno} wa={ch.wa} storeName={tienda?.nombreComercial || tienda?.nombre || ''} />}
        <div className="h-10" />

        <VitrinaFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <VitrinaCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } })} t={t} tienda={tienda} diseno={diseno} />
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
  return slidesVisibles(d, 'retail', [
    { image: d.retailHeroImage || RETAIL_IMG.hero[0], onlyImage: isOn(d.retailHeroOnlyImage), eyebrow: optional(d.retailHeroEyebrow, 'Descubre. Elige. Disfruta.'), title: editable(d.retailHeroTitle, 'Hecho para tu|forma de'), highlight: optional(d.retailHeroHighlight, 'comprar.'), subtitle: optional(d.retailHeroSubtitle, 'Productos de calidad, elegidos para ti. Compra fácil y seguro.'), button: editable(d.retailHeroButton, 'Comprar ahora'), action: 'retailHeroAction' },
    { image: d.retailSlide2Image || RETAIL_IMG.hero[1], onlyImage: isOn(d.retailSlide2OnlyImage), eyebrow: optional(d.retailSlide2Eyebrow, 'Para tu hogar'), title: editable(d.retailSlide2Title, 'Espacios con|más'), highlight: optional(d.retailSlide2Highlight, 'estilo.'), subtitle: optional(d.retailSlide2Subtitle, 'Todo para darle un toque nuevo a tu casa.'), button: editable(d.retailSlide2Button, 'Ver productos'), action: 'retailSlide2Action' },
    { image: d.retailSlide3Image || RETAIL_IMG.hero[2], onlyImage: isOn(d.retailSlide3OnlyImage), eyebrow: optional(d.retailSlide3Eyebrow, 'Para ti'), title: editable(d.retailSlide3Title, 'Encuentra tu|nuevo'), highlight: optional(d.retailSlide3Highlight, 'favorito.'), subtitle: optional(d.retailSlide3Subtitle, 'Explora todas nuestras categorías en un solo lugar.'), button: editable(d.retailSlide3Button, 'Explorar'), action: 'retailSlide3Action' },
  ]);
}

/** Slider del hero (foto de estilo de vida a la derecha, titular serif a la izquierda). Aislado: su timer solo re-renderiza este componente. */
function HeroSlider({ t, diseno, services, goAction }: { t: Theme; diseno: any; services: Service[]; goAction: (k: string) => void }) {
  const slides = useMemo(() => slidesFrom(diseno), [diseno]);
  const interval = resolveHeroIntervalMs(diseno, 'retailHeroInterval', 6500);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  usePreloadImages(slides.map((s) => s.image));
  useEffect(() => {
    if (!interval || paused) return;
    const id = window.setTimeout(() => setIdx((v) => (v + 1) % slides.length), interval);
    return () => window.clearTimeout(id);
  }, [idx, interval, paused, slides.length]);
  const s = slides[idx];
  const chips = services.slice(0, 2);

  return (
    <section className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carrusel">
      {/* Con "solo imagen" el hero va de borde a borde y su alto lo da la propia
          imagen. El banner que sube el cliente ya trae su texto y su composición
          adentro: encerrarlo en 1440px lo dejaba como una caja flotando con
          fondo crema a los costados, y forzarle 620px de alto le recortaba
          parte del mensaje. Con la composición partida se sigue usando el
          contenedor de siempre, porque ahí la mitad izquierda ES el fondo. */}
      <div
        className={
          s.onlyImage
            ? 'relative w-full overflow-hidden'
            : 'relative mx-auto min-h-[540px] max-w-[1440px] overflow-hidden lg:h-[620px]'
        }
        style={{ background: t.bg }}
      >
        {/* En "solo imagen" el alto lo marca la propia imagen: se pone la activa
            en el flujo, invisible, y las demás quedan superpuestas para el
            crossfade. Con un alto fijo, un banner más alto o más ancho que el
            del diseño quedaba recortado o con barras a los costados — y el
            banner del cliente trae su texto adentro, así que recortarlo le come
            parte del mensaje. */}
        {s.onlyImage && (
          <img src={s.image} alt="" aria-hidden className="block w-full opacity-0" />
        )}
        {/* Fotos apiladas (crossfade sin hueco). Con textos, la foto se funde con el fondo por máscara. */}
        <div aria-hidden className={s.onlyImage ? 'absolute inset-0' : 'absolute inset-x-0 top-0 h-[300px] [mask-image:linear-gradient(180deg,#000_60%,transparent)] lg:inset-y-0 lg:left-auto lg:h-full lg:w-[66%] lg:[mask-image:linear-gradient(90deg,transparent,#000_34%)]'}>
          {slides.map((sl, i) => (
            <motion.img key={sl.action} src={sl.image} alt="" initial={false} animate={{ opacity: i === idx ? 1 : 0, scale: i === idx ? 1 : 1.04 }} transition={{ duration: 1.1, ease: vtEase }} className="absolute inset-0 h-full w-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
          ))}
        </div>

        {s.onlyImage ? (
          <button type="button" aria-label={s.title.replace(/\|/g, ' ')} onClick={() => goAction(s.action)} className="absolute inset-0 z-[1]" />
        ) : (
          <div className="relative z-[2] mx-auto flex max-w-[1280px] px-4 pb-24 pt-[270px] lg:h-full lg:items-center lg:px-8 lg:pb-16 lg:pt-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={idx} variants={vtStagger} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.2 } }} className="max-w-[560px]">
                {s.eyebrow && <motion.p variants={vtHeroText} className="text-[13px] font-extrabold uppercase tracking-[0.14em]" style={{ color: t.accentInk }}>{s.eyebrow}</motion.p>}
                <motion.h1 variants={vtHeroText} className="mt-3 whitespace-pre-line text-[44px] leading-[1] tracking-[-0.01em] sm:text-[56px] lg:text-[66px]" style={{ color: t.ink, fontFamily: t.serif }}>
                  {lines(s.title)}
                  {s.highlight && <> <span className="relative inline-block whitespace-nowrap" style={{ color: t.primaryInk }}>{s.highlight}<Swoosh color={t.accent} className="absolute -bottom-2 left-0 h-3 w-full" /></span></>}
                </motion.h1>
                {s.subtitle && <motion.p variants={vtHeroText} className="mt-6 max-w-[360px] text-[16px] leading-relaxed" style={{ color: mix(t.ink, 78, t.bg) }}>{s.subtitle}</motion.p>}
                <motion.div variants={vtHeroText} className="mt-7">
                  <button type="button" onClick={() => goAction(s.action)} className={`${btnCls} group h-12 px-6 text-[15px] shadow-[0_14px_30px_-16px_rgba(27,29,28,0.6)]`} style={{ background: t.primary, color: t.onPrimary }}>
                    {s.button}<Icon icon="solar:arrow-right-linear" width={18} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                  </button>
                </motion.div>
                {chips.length > 0 && (
                  <motion.ul variants={vtHeroText} className="mt-7 flex flex-wrap gap-2">
                    {chips.map((c) => (
                      <li key={c.label} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white/90 py-1.5 pl-1.5 pr-3.5 text-[12px] font-bold shadow-sm backdrop-blur" style={{ color: t.ink }}>
                        <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: t.soft, color: t.primaryInk }}><Icon icon={c.icon} width={15} /></span>
                        {c.label} <span className="font-semibold" style={{ color: t.muted }}>· {c.sub}</span>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        <div className="absolute bottom-20 right-6 z-[3] flex gap-1.5 rounded-full bg-white/80 px-2.5 py-2 backdrop-blur lg:right-10">
          {slides.map((sl, i) => (
            <button key={sl.action} type="button" aria-label={`Ir al banner ${i + 1}`} aria-current={i === idx} onClick={() => setIdx(i)} className="relative h-2 overflow-hidden rounded-full transition-[width] duration-500" style={{ width: i === idx ? 34 : 8, background: mix(t.primary, 28, '#fff') }}>
              {/* Progreso del autoplay: se llena durante el intervalo real; en pausa o sin autoplay queda lleno. */}
              {i === idx && <motion.span key={`${idx}-${paused}`} aria-hidden className="absolute inset-0 origin-left rounded-full" style={{ background: t.primary }} initial={{ scaleX: interval && !paused ? 0 : 1 }} animate={{ scaleX: 1 }} transition={{ duration: interval && !paused ? interval / 1000 : 0, ease: 'linear' }} />}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════ CATEGORÍAS (franja) ══
function CategoryStrip({ t, diseno, slug, tiles, onPick, onAll }: { t: Theme; diseno: any; slug: string; tiles: { nombre: string; label: string; imagenUrl: string; isProduct: boolean }[]; onPick: (c: string) => void; onAll: () => void }) {
  if (!tiles.length) return null;
  const tileBg = mix(t.primary, 6, '#FFF9F2');
  const cta = editable(diseno?.retailTileCta, 'Explorar');
  const showCounts = !isOn(diseno?.retailTileCountsHidden);
  const tile = (key: string, label: string, onClick: () => void, visual: ReactNode, category?: string) => (
    <motion.button key={key} type="button" variants={vtItem} onClick={onClick} className="group flex w-[112px] shrink-0 flex-col items-center rounded-2xl p-2.5 text-center transition-colors hover:bg-black/[0.025] lg:w-auto">
      <span className="relative flex aspect-square w-full max-w-[96px] items-center justify-center overflow-hidden rounded-2xl transition-transform duration-300 group-hover:scale-[1.05]" style={{ background: tileBg }}>{visual}</span>
      <span className="mt-2.5 line-clamp-1 text-[13.5px] font-bold" style={{ color: t.ink }}>{label}</span>
      {category && showCounts ? <CategoryCount slug={slug} category={category} fallback={cta} t={t} /> : <span className="mt-0.5 text-[11.5px] font-bold" style={{ color: t.primaryInk }}>{cta}</span>}
    </motion.button>
  );
  return (
    <section className="relative z-10 mx-auto -mt-14 max-w-[1280px] px-4 lg:px-8">
      <motion.div key={tiles.map((c) => c.nombre).join('|')} variants={vtStagger} initial="hidden" whileInView="show" viewport={vtViewport} className="flex gap-1 overflow-x-auto rounded-[26px] bg-white p-3 shadow-[0_24px_60px_-38px_rgba(27,29,28,0.55)] [scrollbar-width:none] lg:grid lg:grid-cols-7 lg:overflow-visible [&::-webkit-scrollbar]:hidden" style={{ boxShadow: `inset 0 0 0 1px ${t.line}, 0 24px 60px -38px rgba(27,29,28,0.55)` }}>
        {tiles.map((c) => tile(c.nombre, c.label, () => onPick(c.nombre), <TileVisual t={t} src={c.imagenUrl} isProduct={c.isProduct} name={c.nombre} />, c.nombre))}
        {tile('__all', editable(diseno?.retailTileAllLabel, 'Ver todo'), onAll, <Icon icon="ph:squares-four-light" width={40} style={{ color: t.accentInk }} />)}
      </motion.div>
    </section>
  );
}

/** Imagen del bloque de categoría con estado propio: si la URL está rota, cae al ícono de la categoría. */
function TileVisual({ t, src, isProduct, name }: { t: Theme; src: string; isProduct: boolean; name: string }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  if (!src || broken) return <Icon icon={categoryIcon(name)} width={40} style={{ color: t.primaryInk }} />;
  return <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} className={`h-full w-full ${isProduct ? 'object-contain p-2.5 mix-blend-multiply' : 'object-cover'}`} />;
}

/** "Vistos recientemente": historial del propio visitante con precios actuales. Aislado (carga propia). */
function ViewedRail({ t, diseno, slug, onOpen, onAdd }: { t: Theme; diseno: any; slug: string; onOpen: OpenFn; onAdd: AddFn }) {
  const items = useViewedProducts(slug);
  if (isOn(diseno?.retailViewedHidden) || items.length < 2) return null;
  return <ProductRail t={t} title={editable(diseno?.retailViewedTitle, 'Vistos recientemente')} products={items} slug={slug} onOpen={onOpen} onAdd={onAdd} />;
}

// ═════════════════════════════════════════════════════════ BENEFICIOS ══
function BenefitsBar({ t, services }: { t: Theme; services: Service[] }) {
  if (!services.length) return null;
  const cols: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };
  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-6 lg:px-8">
      <motion.ul key={services.map((x) => x.label).join('|')} variants={vtStagger} initial="hidden" whileInView="show" viewport={vtViewport} className={`grid grid-cols-2 gap-y-4 rounded-2xl px-4 py-5 lg:divide-x ${cols[services.length] || 'lg:grid-cols-4'}`} style={{ background: mix(t.primary, 5, '#F7F0E6'), borderColor: t.line }}>
        {services.map((s) => (
          <motion.li key={s.label} variants={vtItem} className="flex items-center gap-3 px-3 lg:justify-center" style={{ borderColor: mix(t.ink, 12, 'transparent') }}>
            <Icon icon={s.icon} width={30} className="shrink-0" style={{ color: t.ink }} />
            <span className="min-w-0 leading-tight">
              <span className="block text-[13.5px] font-extrabold" style={{ color: t.ink }}>{s.label}</span>
              <span className="mt-0.5 block truncate text-[12px]" style={{ color: t.muted }}>{s.sub}</span>
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

// ═════════════════════════════════════════════════════ BANNERS PROMO ══
function PromoBanners({ t, diseno, hasOffers, goAction }: { t: Theme; diseno: any; hasOffers: boolean; goAction: (k: string) => void }) {
  const d = diseno || {};
  const sand = mix(t.accent, 22, '#F6D38A');
  const banners = [
    { key: 'retailPromo1Action', img: d.retailPromo1Image || RETAIL_IMG.promo[0], title: editable(d.retailPromo1Title, hasOffers ? 'Ofertas que te|van a encantar' : 'Lo mejor de|la tienda'), text: optional(d.retailPromo1Text, hasOffers ? 'Productos con precio rebajado.' : 'Descubre nuestros favoritos.'), button: editable(d.retailPromo1Button, hasOffers ? 'Ver ofertas' : 'Ver productos'), bg: t.primary, fg: t.onPrimary, btn: { background: '#fff', color: t.ink } },
    { key: 'retailPromo2Action', img: d.retailPromo2Image || RETAIL_IMG.promo[1], title: editable(d.retailPromo2Title, 'Renueva tu|hogar'), text: optional(d.retailPromo2Text, 'Ideas para darle estilo a tus espacios.'), button: editable(d.retailPromo2Button, 'Ver más'), bg: sand, fg: t.ink, btn: { background: t.ink, color: '#fff' } },
    { key: 'retailPromo3Action', img: d.retailPromo3Image || RETAIL_IMG.promo[2], title: editable(d.retailPromo3Title, 'Regalos para|cada ocasión'), text: optional(d.retailPromo3Text, 'Encuentra el detalle perfecto.'), button: editable(d.retailPromo3Button, 'Explorar'), bg: t.accent, fg: t.onAccent, btn: { background: '#fff', color: t.ink } },
  ];
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-6 lg:px-8">
      <motion.div variants={vtStagger} initial="hidden" whileInView="show" viewport={vtViewport} className="grid gap-4 md:grid-cols-3">
        {banners.map((b) => (
          <motion.button key={b.key} type="button" variants={vtItem} onClick={() => goAction(b.key)} className="group relative flex min-h-[220px] overflow-hidden rounded-2xl text-left" style={{ background: b.bg }}>
            <div aria-hidden className="absolute inset-y-0 right-0 w-[52%]">
              <img src={b.img} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]" />
              <span className="absolute inset-y-0 left-0 w-1/2" style={{ background: `linear-gradient(90deg, ${b.bg}, transparent)` }} />
            </div>
            <div className="relative z-[1] flex max-w-[58%] flex-col justify-center p-6">
              <h3 className="whitespace-pre-line text-[21px] font-extrabold leading-[1.1] tracking-[-0.015em]" style={{ color: b.fg }}>{lines(b.title)}</h3>
              {b.text && <p className="mt-2 text-[13px] font-semibold leading-snug" style={{ color: b.fg, opacity: 0.85 }}>{b.text}</p>}
              <span className={`${btnCls} mt-4 h-9 w-max rounded-lg px-4 text-[12.5px]`} style={b.btn}>{b.button}<Icon icon="solar:arrow-right-linear" width={15} /></span>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
}

// ══════════════════════════════════════════════════ BANDA DE CONFIANZA ══
type Review = { id: number; clienteNombre?: string; rating: number; comentario?: string; compraVerificada?: boolean; producto: string };

/**
 * Banda de confianza con datos REALES: una reseña aprobada (si existe), la calificación promedio de las reseñas
 * reales y cifras de la tienda (productos, categorías, marcas). Lo que no existe no se muestra.
 * Carga de reseñas aislada aquí.
 */
function TrustBand({ t, diseno, slug, tienda, list, categories }: { t: Theme; diseno: any; slug: string; tienda: any; list: any[]; categories: number }) {
  const [review, setReview] = useState<Review | null>(null);
  const rated = list.filter((p) => Number(p?.ratingCount || 0) > 0 && Number(p?.ratingAvg || 0) > 0);
  const key = rated.slice(0, 4).map((p) => p.id).join(',');
  useEffect(() => {
    if (!slug || slug === 'preview' || !key) { setReview(null); return; }
    let alive = true;
    Promise.all(rated.slice(0, 4).map((p) => axios.get(`${BASE_URL}/public/store/${slug}/products/${p.id}/reviews`)
      .then((r) => ((r.data?.data || r.data)?.reviews || []).map((rv: any) => ({ ...rv, producto: p.descripcion })))
      .catch(() => [])))
      .then((all) => {
        if (!alive) return;
        const best = (all.flat() as Review[]).filter((r) => String(r.comentario || '').trim().length >= 12).sort((a, b) => Number(b.rating) - Number(a.rating))[0];
        setReview(best || null);
      });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, key]);

  const reviewsCount = rated.reduce((s, p) => s + Number(p.ratingCount || 0), 0);
  const avg = reviewsCount ? rated.reduce((s, p) => s + Number(p.ratingAvg) * Number(p.ratingCount), 0) / reviewsCount : 0;
  // El home trae como máximo 30 productos: si llegaron 30, la cifra real es "30+".
  const exactTotal = useStoreTotal(slug);
  const truncated = list.length >= HOME_PAGE_SIZE;
  const brands = new Set(list.map((p) => nameOf(p?.marca).trim().toLowerCase()).filter(Boolean)).size;
  const stats = [
    exactTotal && exactTotal > 0 ? { icon: 'ph:package-light', value: exactTotal.toLocaleString('es-PE'), label: 'Productos disponibles' }
      : list.length > 0 ? { icon: 'ph:package-light', value: `${list.length}${truncated ? '+' : ''}`, label: 'Productos disponibles' } : null,
    categories > 0 ? { icon: 'ph:squares-four-light', value: String(categories), label: categories === 1 ? 'Categoría' : 'Categorías' } : null,
    brands > 1 ? { icon: 'ph:seal-check-light', value: `${brands}${truncated ? '+' : ''}`, label: 'Marcas' } : null,
  ].filter(Boolean) as { icon: string; value: string; label: string }[];
  const about = String(diseno?.retailTrustText || tienda?.descripcionTienda || '').trim();
  const left = review || about;
  if (!left && !reviewsCount && stats.length < 2) return null;
  const onlyStats = !left && !reviewsCount;

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-6 lg:px-8">
      <motion.div key={[Boolean(review), reviewsCount, ...stats.map((x) => x.value)].join('|')} variants={vtStagger} initial="hidden" whileInView="show" viewport={vtViewport} className={`grid items-center gap-6 rounded-2xl px-6 py-7 ${onlyStats ? '' : 'lg:grid-cols-[1.3fr_auto_1.7fr] lg:gap-0 lg:divide-x'}`} style={{ background: mix(t.primary, 9, '#F4F1EA'), borderColor: mix(t.ink, 10, 'transparent') }}>
        {left && (
          <motion.figure variants={vtItem} className="flex gap-3 lg:pr-8">
            <Icon icon="ph:quotes-fill" width={30} className="shrink-0" style={{ color: t.primaryInk }} />
            {review ? (
              <div className="min-w-0">
                <blockquote className="line-clamp-3 text-[14px] font-bold leading-snug" style={{ color: t.ink }}>{String(review.comentario).trim()}</blockquote>
                <figcaption className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px]" style={{ color: t.muted }}>
                  — {review.clienteNombre || 'Cliente'}{review.compraVerificada ? ' · Compra verificada' : ''}
                  <span className="flex" style={{ color: t.star }}>{Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon={i < Math.round(review.rating) ? 'solar:star-bold' : 'solar:star-linear'} width={13} />)}</span>
                </figcaption>
              </div>
            ) : (
              <div className="min-w-0">
                <p className="text-[12px] font-extrabold uppercase tracking-[0.12em]" style={{ color: t.primaryInk }}>{editable(diseno?.retailTrustTitle, 'Sobre nosotros')}</p>
                <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-[14px] font-semibold leading-snug" style={{ color: t.ink }}>{about}</p>
              </div>
            )}
          </motion.figure>
        )}
        {reviewsCount > 0 ? (
          <motion.div variants={vtItem} className="flex flex-col items-center px-8 text-center">
            <span className="text-[13px] font-bold" style={{ color: t.ink }}>Calificación {avg.toFixed(1)}/5</span>
            <span className="mt-1 flex" style={{ color: t.star }}>{Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon={i < Math.round(avg) ? 'solar:star-bold' : 'solar:star-linear'} width={16} />)}</span>
            <span className="mt-1 text-[12px]" style={{ color: t.muted }}>{reviewsCount} {reviewsCount === 1 ? 'reseña real' : 'reseñas reales'}</span>
          </motion.div>
        ) : !onlyStats && <span className="hidden lg:block" />}
        {stats.length > 0 && (
          <div className={`grid gap-4 ${onlyStats ? 'mx-auto w-full max-w-2xl sm:gap-8' : 'lg:pl-4'} ${stats.length === 3 ? 'grid-cols-3' : stats.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {stats.map((s) => <StatBlock key={s.label} t={t} icon={s.icon} value={s.value} label={s.label} />)}
          </div>
        )}
      </motion.div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════ CLUB ══
/** "Entérate primero": abre WhatsApp con el mensaje listo (no hay registro por correo; nunca simula un alta). */
function ClubBand({ t, diseno, wa, storeName }: { t: Theme; diseno: any; wa: (msg?: string) => string | null; storeName: string }) {
  const [name, setName] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const who = name.trim() ? `Soy ${name.trim()}. ` : '';
    const url = wa(`Hola${storeName ? ` ${storeName}` : ''}, ${who}quiero recibir sus novedades y ofertas por WhatsApp.`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-6 lg:px-8">
      <motion.div variants={vtReveal} initial="hidden" whileInView="show" viewport={vtViewport} className="grid items-center gap-5 rounded-2xl px-6 py-6 sm:px-8 lg:grid-cols-[auto_1fr_1.1fr]" style={{ background: t.accentSoft }}>
        <span className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-white lg:flex" style={{ color: t.accentInk }}><Icon icon="solar:letter-unread-linear" width={30} /></span>
        <div>
          <h2 className="text-[19px] font-extrabold" style={{ color: t.ink }}>{editable(diseno?.retailClubTitle, 'Entérate primero')}</h2>
          <p className="mt-0.5 text-[13px]" style={{ color: t.muted }}>{editable(diseno?.retailClubText, 'Recibe novedades, ofertas y llegadas nuevas por WhatsApp.')}</p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" aria-label="Tu nombre" className="h-12 min-w-0 flex-1 appearance-none rounded-xl border-0 bg-white bg-none px-4 text-[14px] outline-none placeholder:text-stone-400 focus:ring-0" style={{ color: t.ink }} />
          <button type="submit" className={`${btnCls} h-12 px-6`} style={{ background: t.primary, color: t.onPrimary }}>
            <Icon icon="ic:baseline-whatsapp" width={18} /> {editable(diseno?.retailClubButton, 'Suscribirme')}
          </button>
        </form>
      </motion.div>
    </section>
  );
}
