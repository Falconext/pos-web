import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { buildCategoryTiles } from '@/templates/shared/categoryTiles';
import { resolveHeroIntervalMs, usePreloadImages, slidesVisibles } from '@/templates/shared/heroSlider';
import { getProductPricing } from '@/templates/shared/pricing';
import { sinStock } from '@/templates/shared/ventaSinStock';
import { getStoreLinkAction, isLinkActionConfigured, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import {
  CanastaHeader, CanastaFooter, CanastaCartModal, CanastaProductCard, NoPhoto, buildServices, categoryIcon,
  canastaTheme, useCanastaFont, editable, optional, isOn, caMoney, btnCls, CANASTA_IMG, type Theme, type Service,
} from './CanastaParts';
import { ProductGrid, GridSkeleton, SectionHeader, OfferCountdown, soonestOfferEnd, storeChannels, getName, hasImage, listSig, type OpenFn, type AddFn, type Channels } from './CanastaSections';
import { announceAdded } from './CanastaExtras';
import { caEase, caHeroText, caItem, caReveal, caStagger, caViewport, mix } from './motion';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

/** "Frescura que|llega a tu casa" → saltos de línea (el editor es de una línea). */
const lines = (s: string) => s.replace(/\s*\|\s*/g, '\n');
const sameCat = (p: any, cat: string) => getName(p?.categoria).toLowerCase() === cat.toLowerCase();
/** Mayor descuento REAL de una lista (0 si no hay ofertas). */
const maxDiscount = (list: any[]) => list.reduce((m, p) => { const pr = getProductPricing(p); return pr.enOferta ? Math.max(m, Number(pr.porcentajeDescuento || 0)) : m; }, 0);

// ═════════════════════════════════════════════════════════════════ PAGE ══
export default function CanastaHomePage(props: TemplateHomePageProps) {
  const { tienda, slug, productos, allCategories, diseno, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, agregarAlCarrito, actualizarCantidad, loading } = props as any;
  useCanastaFont();
  const navigate = useNavigate();
  const t = canastaTheme(diseno);
  const [showFav, setShowFav] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);

  const list: any[] = useMemo(() => (Array.isArray(productos) ? productos : []), [productos]);
  const withImg = useMemo(() => list.filter(hasImage), [list]);
  const categories: string[] = useMemo(() => (allCategories || []).map(getName).filter(Boolean), [allCategories]);
  const offers = useMemo(() => {
    const o = list.filter((p) => getProductPricing(p).enOferta);
    const hay = (p: any) => !sinStock(Number(p?.stock ?? 1));
    return [...o.filter((p) => hasImage(p) && hay(p)), ...o.filter((p) => !hasImage(p) && hay(p)), ...o.filter((p) => !hay(p))];
  }, [list]);
  const deals = offers.slice(0, 6);
  // Recomendados: destacados y con foto primero, sin repetir lo que ya salió en Ofertas del día.
  const picks = useMemo(() => {
    const shown = new Set(deals.map((p) => p.id));
    // Orden: destacados con stock → con stock → el resto (un "recomendado" agotado no ayuda a vender).
    const pool = [...withImg, ...list.filter((p) => !hasImage(p))].filter((p) => !shown.has(p.id));
    const hay = (p: any) => !sinStock(Number(p?.stock ?? 1));
    return [...pool.filter((p) => p?.destacado && hay(p)), ...pool.filter((p) => !p?.destacado && hay(p)), ...pool.filter((p) => !hay(p))].slice(0, 6);
  }, [list, withImg, deals]);
  const circles = useMemo(() => buildCategoryTiles({ allCategories, diseno, prefix: 'canasta', count: 8, fallbackImages: [] }).map((tile) => {
    const fromProduct = tile.imagenUrl ? '' : withImg.find((p) => sameCat(p, tile.nombre))?.imagenUrl || '';
    return { ...tile, imagenUrl: tile.imagenUrl || fromProduct, isProduct: Boolean(fromProduct) };
  }), [allCategories, diseno, withImg]);
  const ch = storeChannels(tienda, diseno);
  const services = useMemo(() => buildServices(tienda, ch.hasWhatsapp), [tienda, ch.hasWhatsapp]);

  const cartCount = (carrito || []).reduce((s: number, i: any) => s + Number(i?.cantidad || 1), 0);
  const cartTotal = (carrito || []).reduce((s: number, i: any) => s + Number(i?.precioUnitario || 0) * Number(i?.cantidad || 1), 0);
  const goCatalog = () => navigate(`/tienda/${slug}/catalogo`);
  const goCategory = (name: string) => navigate(`/tienda/${slug}/catalogo?category=${encodeURIComponent(name)}`);
  const goProduct: OpenFn = (p) => navigate(`/tienda/${slug}/producto/${p.id}`);
  const add: AddFn = (p, qty = 1) => agregarAlCarrito({ ...p, __cantidad: qty });
  const goAction = (key: string, fallbackCategory?: string) => runStoreLinkAction(
    getStoreLinkAction(diseno, key, fallbackCategory ? { defaultType: 'category', fallbackValue: fallbackCategory } : { defaultType: 'catalog' }),
    { slug, navigate },
  );
  const offerEnd = soonestOfferEnd(offers);
  const showDeals = deals.length > 0 && !isOn(diseno?.canastaDealsHidden);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-clip" style={{ background: t.bg, fontFamily: t.font }}>
        <CanastaHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} cartTotal={cartTotal} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={navigate} active="home" offersHref={showDeals ? '#ofertas' : undefined} />

        <HeroSlider t={t} diseno={diseno} services={services} goAction={goAction} />

        {circles.length > 0 && (
          <section className="mx-auto max-w-[1280px] px-4 pt-10 lg:px-8">
            <SectionHeader t={t} title={editable(diseno?.canastaCatsTitle, 'Compra por categoría')} onMore={goCatalog} />
            <CategoryCircles t={t} circles={circles} onPick={goCategory} />
          </section>
        )}

        {!isOn(diseno?.canastaSeasonHidden) && <SeasonBanners t={t} diseno={diseno} maxPct={maxDiscount(offers)} goAction={goAction} />}

        {loading && !list.length && (
          <section className="mx-auto max-w-[1280px] px-4 py-8 lg:px-8"><GridSkeleton t={t} count={6} cols="lg:grid-cols-6" /></section>
        )}

        {showDeals && (
          <section id="ofertas" className="mx-auto max-w-[1280px] scroll-mt-40 px-4 pt-10 lg:px-8">
            <SectionHeader
              t={t}
              title={editable(diseno?.canastaDealsTitle, 'Ofertas del día')}
              onMore={goCatalog}
              right={(
                <div className="flex flex-1 flex-wrap items-center justify-between gap-3 sm:justify-end">
                  {offerEnd ? <OfferCountdown t={t} endsAt={offerEnd} /> : <span />}
                  <button type="button" onClick={goCatalog} className="group inline-flex items-center gap-1.5 text-[13px] font-bold" style={{ color: t.primaryInk }}>Ver todo<Icon icon="solar:arrow-right-linear" width={16} className="transition-transform duration-300 group-hover:translate-x-1" /></button>
                </div>
              )}
            />
            <DealsGrid t={t} diseno={diseno} slug={slug} deals={deals} maxPct={maxDiscount(offers)} onOpen={goProduct} onAdd={add} onMore={goCatalog} />
          </section>
        )}

        {!isOn(diseno?.canastaPromosHidden) && <CategoryBanners t={t} diseno={diseno} categories={categories} offers={offers} goAction={goAction} />}

        {picks.length > 0 && <PicksAndRanking t={t} diseno={diseno} slug={slug} picks={picks} list={list} onOpen={goProduct} onAdd={add} onMore={goCatalog} />}

        {!isOn(diseno?.canastaBenefitsHidden) && <ServicesRow t={t} services={services} />}
        {!isOn(diseno?.canastaReviewsHidden) && <RealReviews t={t} slug={slug} products={list} title={editable(diseno?.canastaReviewsTitle, 'Lo que dicen nuestros clientes')} />}
        {ch.hasWhatsapp && !isOn(diseno?.canastaClubHidden) && <Community t={t} diseno={diseno} ch={ch} />}
        <div className="h-12" />

        <CanastaFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <CanastaCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } })} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.primary} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.primary} onGoProduct={(item: any) => goProduct(item)} />
      </div>
    </MotionConfig>
  );
}

// ═════════════════════════════════════════════════════════════════ HERO ══
type Slide = { image: string; onlyImage: boolean; title: string; subtitle: string; button: string; action: string };

function slidesFrom(diseno: any): Slide[] {
  const d = diseno || {};
  return slidesVisibles(d, 'canasta', [
    { image: d.canastaHeroImage || CANASTA_IMG.hero[0], onlyImage: isOn(d.canastaHeroOnlyImage), title: editable(d.canastaHeroTitle, 'Frescura que|llega a tu casa'), subtitle: optional(d.canastaHeroSubtitle, 'Frutas, verduras y abarrotes para una mesa más rica y saludable.'), button: editable(d.canastaHeroButton, 'Comprar ahora'), action: 'canastaHeroAction' },
    { image: d.canastaSlide2Image || CANASTA_IMG.hero[1], onlyImage: isOn(d.canastaSlide2OnlyImage), title: editable(d.canastaSlide2Title, 'Del mercado|a tu mesa'), subtitle: optional(d.canastaSlide2Subtitle, 'Todo lo de tu lista en un solo pedido.'), button: editable(d.canastaSlide2Button, 'Ver productos'), action: 'canastaSlide2Action' },
    { image: d.canastaSlide3Image || CANASTA_IMG.hero[2], onlyImage: isOn(d.canastaSlide3OnlyImage), title: editable(d.canastaSlide3Title, 'Tu despensa|siempre lista'), subtitle: optional(d.canastaSlide3Subtitle, 'Arroz, aceite, menestras y más para toda la semana.'), button: editable(d.canastaSlide3Button, 'Llenar mi despensa'), action: 'canastaSlide3Action' },
  ]);
}

/** Slider del hero (titular verde a la izquierda, foto a la derecha, sello circular). Aislado: su timer solo re-renderiza este componente. */
function HeroSlider({ t, diseno, services, goAction }: { t: Theme; diseno: any; services: Service[]; goAction: (k: string) => void }) {
  const slides = useMemo(() => slidesFrom(diseno), [diseno]);
  const interval = resolveHeroIntervalMs(diseno, 'canastaHeroInterval', 6500);
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
  const chips = services.slice(0, 3);
  const stamp = optional(diseno?.canastaHeroStamp, 'Del mercado|a tu mesa');
  const script = optional(diseno?.canastaHeroScript, 'Comida rica,|días felices');

  return (
    <section className="relative overflow-hidden" style={{ background: `linear-gradient(105deg, ${t.softer} 0%, #fff 48%, ${t.softer} 100%)` }} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carrusel">
      <div className="relative mx-auto max-w-[1280px] lg:h-[420px]">
        {/* Fotos apiladas (crossfade sin hueco). Con textos, la foto se funde con el fondo por la izquierda. */}
        <div aria-hidden className={s.onlyImage ? 'absolute inset-0' : 'relative h-[230px] [mask-image:linear-gradient(180deg,#000_70%,transparent)] sm:h-[300px] lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[62%] lg:[mask-image:linear-gradient(90deg,transparent,#000_26%)]'}>
          {slides.map((sl, i) => (
            <motion.img key={sl.action} src={sl.image} alt="" initial={false} animate={{ opacity: i === idx ? 1 : 0, scale: i === idx ? 1 : 1.03 }} transition={{ duration: 1.1, ease: caEase }} className="absolute inset-0 h-full w-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
          ))}
        </div>

        {s.onlyImage ? (
          <button type="button" aria-label={s.title.replace(/\|/g, ' ')} onClick={() => goAction(s.action)} className="absolute inset-0 z-[1] h-[300px] w-full lg:h-full" />
        ) : (
          <div className="relative z-[2] px-4 pb-12 pt-4 lg:flex lg:h-full lg:items-center lg:px-8 lg:pb-0 lg:pt-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={idx} variants={caStagger} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.18 } }} className="max-w-[540px]">
                <motion.h1 variants={caHeroText} className="whitespace-pre-line text-[38px] font-extrabold leading-[1.02] tracking-[-0.02em] sm:text-[48px] lg:text-[56px]" style={{ color: t.primaryInk, fontFamily: t.serif }}>{lines(s.title)}</motion.h1>
                {s.subtitle && <motion.p variants={caHeroText} className="mt-3 max-w-[420px] text-[16px] font-semibold leading-relaxed" style={{ color: mix(t.ink, 80, '#fff') }}>{s.subtitle}</motion.p>}
                <motion.div variants={caHeroText} className="mt-6">
                  <button type="button" onClick={() => goAction(s.action)} className={`${btnCls} group h-12 px-6 text-[15px] shadow-[0_14px_30px_-16px_rgba(22,37,27,0.6)]`} style={{ background: t.primary, color: t.onPrimary }}>
                    {s.button}<Icon icon="solar:arrow-right-linear" width={18} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                  </button>
                </motion.div>
                {chips.length > 0 && (
                  <motion.ul variants={caHeroText} className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
                    {chips.map((c) => (
                      <li key={c.label} className="inline-flex items-center gap-2 text-[13px] font-bold" style={{ color: t.ink }}>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: t.soft, color: t.primaryInk }}><Icon icon={c.icon} width={17} /></span>{c.label}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {!s.onlyImage && stamp && (
          <div aria-hidden className="absolute right-6 top-6 z-[3] hidden h-[118px] w-[118px] flex-col items-center justify-center rounded-full text-center lg:flex" style={{ background: t.primary, color: t.accent, boxShadow: `0 0 0 6px ${mix(t.primary, 22, '#fff')}` }}>
            <Icon icon="ph:leaf-fill" width={22} />
            <span className="mt-1 whitespace-pre-line px-3 text-[15px] font-extrabold uppercase leading-[1.05]" style={{ fontFamily: t.serif }}>{lines(stamp)}</span>
          </div>
        )}
        {!s.onlyImage && script && (
          <p aria-hidden className="absolute bottom-10 right-8 z-[3] hidden max-w-[260px] -rotate-6 whitespace-pre-line rounded-2xl bg-white/85 px-4 py-2 text-right text-[30px] leading-[0.95] shadow-[0_12px_30px_-18px_rgba(0,0,0,.45)] backdrop-blur-sm lg:block" style={{ color: t.primaryInk, fontFamily: t.script }}>{lines(script)}<Icon icon="solar:heart-bold" width={22} className="ml-1 inline" style={{ color: t.primaryInk }} /></p>
        )}

        {slides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 z-[3] flex -translate-x-1/2 gap-1.5">
            {slides.map((sl, i) => (
              <button key={sl.action} type="button" aria-label={`Ir al banner ${i + 1}`} aria-current={i === idx} onClick={() => setIdx(i)} className="flex h-6 items-center">
                <span className="block h-2 rounded-full transition-all duration-500" style={{ width: i === idx ? 22 : 8, background: i === idx ? t.primary : mix(t.primary, 28, '#fff') }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════ CÍRCULOS DE CATEGORÍA ══
function CategoryCircles({ t, circles, onPick }: { t: Theme; circles: { nombre: string; label: string; imagenUrl: string; isProduct: boolean }[]; onPick: (c: string) => void }) {
  return (
    <motion.div key={circles.map((c) => c.nombre).join('|')} variants={caStagger} initial="hidden" whileInView="show" viewport={caViewport} className={`-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden ${circles.length >= 8 ? 'lg:grid lg:grid-cols-8' : 'lg:justify-center lg:gap-10'}`}>
      {circles.map((c) => (
        <motion.button key={c.nombre} type="button" variants={caItem} onClick={() => onPick(c.nombre)} className={`group flex w-[92px] shrink-0 flex-col items-center text-center ${circles.length >= 8 ? 'lg:w-auto' : 'lg:w-[124px]'}`}>
          <span className="relative flex aspect-square w-full max-w-[124px] items-center justify-center overflow-hidden rounded-full transition-transform duration-300 group-hover:scale-[1.04]" style={{ background: c.isProduct || !c.imagenUrl ? t.soft : '#fff', boxShadow: `0 0 0 1px ${t.line}` }}>
            {c.imagenUrl
              ? <img src={c.imagenUrl} alt="" loading="lazy" className={`h-full w-full ${c.isProduct ? 'object-contain p-4 mix-blend-multiply' : 'object-cover'}`} />
              : <Icon icon={categoryIcon(c.nombre)} width={42} style={{ color: t.primaryInk }} />}
          </span>
          <span className="mt-2.5 line-clamp-2 text-[13px] font-bold leading-tight" style={{ color: t.ink }}>{c.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}

// ═════════════════════════════════════════════ BANNER DE TEMPORADA + LATERAL ══
/** Sello amarillo "Hasta X% dto." — solo con un descuento REAL (> 0). */
function DiscountSeal({ t, pct, size = 92 }: { t: Theme; pct: number; size?: number }) {
  if (!(pct > 0)) return null;
  return (
    <span className="flex shrink-0 flex-col items-center justify-center rounded-full text-center leading-none shadow-[0_10px_24px_-12px_rgba(0,0,0,.45)]" style={{ width: size, height: size, background: t.accent, color: t.onAccent, fontFamily: t.serif }}>
      <span className="text-[11px] font-bold uppercase">Hasta</span>
      <span className="text-[30px] font-extrabold tracking-[-0.03em]" style={{ fontSize: size * 0.33 }}>{pct}%</span>
      <span className="text-[11px] font-extrabold uppercase">dto.</span>
    </span>
  );
}

function SeasonBanners({ t, diseno, maxPct, goAction }: { t: Theme; diseno: any; maxPct: number; goAction: (k: string) => void }) {
  const title = editable(diseno?.canastaSeasonTitle, 'Lo mejor de la temporada|fresco y saludable');
  const text = optional(diseno?.canastaSeasonText, 'Del campo a tu casa');
  const button = editable(diseno?.canastaSeasonButton, 'Ver productos');
  const sideTitle = editable(diseno?.canastaSideTitle, 'Opciones sanas,|familias felices');
  const sideScript = mix(t.sale, 55, t.accent);
  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-10 lg:px-8">
      <motion.div variants={caStagger} initial="hidden" whileInView="show" viewport={caViewport} className="grid gap-4 lg:grid-cols-[1.9fr_1fr]">
        <motion.button type="button" variants={caItem} onClick={() => goAction('canastaSeasonAction')} className="group relative flex min-h-[210px] overflow-hidden rounded-2xl text-left" style={{ background: `linear-gradient(110deg, ${t.primary} 0%, ${mix(t.primary, 78, '#0B2A14')} 100%)`, color: t.onPrimary }}>
          <div aria-hidden className="absolute inset-y-0 right-0 w-[58%] [mask-image:linear-gradient(90deg,transparent,#000_34%)]">
            <img src={diseno?.canastaSeasonImage || CANASTA_IMG.season} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.05]" />
          </div>
          <div className="relative z-[1] flex max-w-[60%] flex-col justify-center p-6 sm:p-8">
            <h2 className="whitespace-pre-line text-[24px] font-extrabold leading-[1.08] sm:text-[32px]" style={{ fontFamily: t.serif }}>{lines(title)}</h2>
            {text && <p className="mt-2 text-[14px] font-semibold opacity-90">{text}</p>}
            <span className="mt-5 inline-flex h-10 w-max items-center gap-1.5 rounded-full bg-white px-5 text-[13px] font-bold" style={{ color: t.primaryInk }}>{button}<Icon icon="solar:arrow-right-linear" width={15} className="transition-transform group-hover:translate-x-0.5" /></span>
          </div>
          {maxPct > 0 && <span className="absolute right-[34%] top-1/2 z-[2] hidden -translate-y-1/2 sm:block"><DiscountSeal t={t} pct={maxPct} size={96} /></span>}
        </motion.button>

        <motion.button type="button" variants={caItem} onClick={() => goAction('canastaSideAction')} className="group relative flex min-h-[210px] overflow-hidden rounded-2xl text-left" style={{ background: mix(t.accent, 26, '#FFF3EA') }}>
          <div aria-hidden className="absolute bottom-0 right-0 h-[85%] w-[55%]">
            <img src={diseno?.canastaSideImage || CANASTA_IMG.side} alt="" loading="lazy" className="h-full w-full object-cover [mask-image:linear-gradient(90deg,transparent,#000_30%)] transition-transform duration-[1.2s] group-hover:scale-[1.05]" style={{ borderTopLeftRadius: 999 }} />
          </div>
          <p className="relative z-[1] max-w-[62%] self-center whitespace-pre-line p-6 text-[28px] font-bold leading-[0.98] sm:text-[34px]" style={{ color: sideScript, fontFamily: t.script }}>{lines(sideTitle)}</p>
        </motion.button>
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════ BANNERS DE CATEGORÍA ══
/** Dos banners (naranja y verde). Por defecto llevan el nombre y el enlace de tus dos primeras categorías reales. */
function CategoryBanners({ t, diseno, categories, offers, goAction }: { t: Theme; diseno: any; categories: string[]; offers: any[]; goAction: (k: string, cat?: string) => void }) {
  const orange = mix(t.sale, 38, t.accent);
  const defs = [
    { n: 1, bg: `linear-gradient(110deg, ${orange} 0%, ${mix(orange, 82, '#B23A0E')} 100%)`, fallbackTitle: 'Frutas frescas', fallbackText: 'Para tu mesa de todos los días', img: CANASTA_IMG.promo[0] },
    { n: 2, bg: `linear-gradient(110deg, ${mix(t.primary, 85, '#0B2A14')} 0%, ${t.primary} 100%)`, fallbackTitle: 'Verduras frescas', fallbackText: 'Calidad que se nota', img: CANASTA_IMG.promo[1] },
  ];
  const items = defs.filter((d, i) => {
    // Sin categoría real para este banner y sin configurarlo en el editor → no se inventa uno ("Verduras" en una charcutería).
    const key = `canastaPromo${d.n}Action`;
    return Boolean(categories[i]) || isLinkActionConfigured(diseno, key) || String(diseno?.[`canastaPromo${d.n}Title`] || '').trim() !== '';
  }).map((d) => {
    const i = d.n - 1;
    const key = `canastaPromo${d.n}Action`;
    const cat = isLinkActionConfigured(diseno, key) ? undefined : categories[i];
    const linkedCat = cat || (diseno?.[`${key}Type`] === 'category' ? String(diseno?.[`${key}Value`] || '') : '');
    const pct = maxDiscount(linkedCat ? offers.filter((p) => sameCat(p, linkedCat)) : []);
    return {
      ...d, key, cat, pct,
      title: editable(diseno?.[`canastaPromo${d.n}Title`], cat || d.fallbackTitle),
      text: optional(diseno?.[`canastaPromo${d.n}Text`], d.fallbackText),
      button: editable(diseno?.[`canastaPromo${d.n}Button`], 'Ver productos'),
      image: diseno?.[`canastaPromo${d.n}Image`] || d.img,
    };
  });
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-10 lg:px-8">
      <motion.div variants={caStagger} initial="hidden" whileInView="show" viewport={caViewport} className={`grid gap-4 ${items.length > 1 ? 'md:grid-cols-2' : ''}`}>
        {items.map((b) => (
          <motion.button key={b.key} type="button" variants={caItem} onClick={() => goAction(b.key, b.cat)} className="group relative flex min-h-[170px] overflow-hidden rounded-2xl text-left text-white" style={{ background: b.bg }}>
            <div aria-hidden className="absolute inset-y-0 right-0 w-[52%] [mask-image:linear-gradient(90deg,transparent,#000_32%)]">
              <img src={b.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.06]" />
            </div>
            <div className="relative z-[1] flex max-w-[58%] flex-col justify-center p-6">
              <h3 className="line-clamp-2 text-[24px] font-extrabold leading-[1.05] sm:text-[27px]" style={{ fontFamily: t.serif }}>{b.title}</h3>
              {b.text && <p className="mt-1 text-[14px] font-semibold opacity-90">{b.text}</p>}
              <span className="mt-4 inline-flex h-9 w-max items-center gap-1.5 rounded-full bg-white px-4 text-[12.5px] font-bold" style={{ color: t.ink }}>{b.button}<Icon icon="solar:arrow-right-linear" width={14} className="transition-transform group-hover:translate-x-0.5" /></span>
            </div>
            {b.pct > 0 && <span className="absolute right-[40%] top-1/2 z-[2] hidden -translate-y-1/2 sm:block"><DiscountSeal t={t} pct={b.pct} size={78} /></span>}
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════ OFERTAS DEL DÍA ══
const DEAL_SPAN: Record<number, string> = { 1: 'lg:col-span-5', 2: 'lg:col-span-4', 3: 'lg:col-span-3', 4: 'lg:col-span-2', 5: 'lg:col-span-1' };
/**
 * Grilla de 6 columnas de la referencia. Con menos de 6 ofertas reales, el hueco lo ocupa un panel con el
 * mayor descuento REAL y el acceso al catálogo (nunca se rellena con productos que no están en oferta).
 */
function DealsGrid({ t, diseno, slug, deals, maxPct, onOpen, onAdd, onMore }: { t: Theme; diseno: any; slug: string; deals: any[]; maxPct: number; onOpen: OpenFn; onAdd: AddFn; onMore: () => void }) {
  const filler = deals.length < 6;
  const narrow = deals.length === 5;
  return (
    <motion.div key={listSig(deals)} variants={caStagger} initial="hidden" whileInView="show" viewport={caViewport} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {deals.map((p) => (
        <motion.div key={p.id} variants={caItem} className="h-full">
          <CanastaProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
        </motion.div>
      ))}
      {filler && (
        <motion.button type="button" variants={caItem} onClick={onMore} className={`group relative col-span-2 flex min-h-[150px] items-center gap-5 overflow-hidden rounded-xl p-5 text-left sm:col-span-3 ${DEAL_SPAN[deals.length] || ''} ${narrow ? 'lg:flex-col lg:justify-center lg:text-center' : ''}`} style={{ background: `linear-gradient(120deg, ${t.accentSoft} 0%, ${mix(t.accent, 10, '#fff')} 100%)` }}>
          <Icon icon="ph:basket-fill" aria-hidden width={150} className="pointer-events-none absolute -bottom-8 -right-6 opacity-[0.08]" style={{ color: t.ink }} />
          <DiscountSeal t={t} pct={maxPct} size={narrow ? 80 : 96} />
          <span className="relative min-w-0">
            <span className="block text-[20px] font-extrabold leading-tight" style={{ color: t.ink, fontFamily: t.serif }}>{editable(diseno?.canastaDealsPanelTitle, 'Precios rebajados')}</span>
            {!narrow && <span className="mt-1 block text-[13px]" style={{ color: t.muted }}>{editable(diseno?.canastaDealsPanelText, 'Aprovecha antes de que se acaben.')}</span>}
            <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold" style={{ color: t.primaryInk }}>Ver todo el catálogo<Icon icon="solar:arrow-right-linear" width={15} className="transition-transform group-hover:translate-x-1" /></span>
          </span>
        </motion.button>
      )}
    </motion.div>
  );
}

const PICK_COLS: Record<number, string> = { 0: '', 1: 'lg:grid-cols-4', 2: 'lg:grid-cols-4', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6' };

// ═════════════════════════════════════════ RECOMENDADOS + MEJOR VALORADOS ══
/**
 * Columna derecha con ranking. No hay datos públicos de ventas, así que NO se llama "más vendidos":
 * con reseñas reales ordena por calificación; si no, muestra los destacados por la tienda; si no hay, se oculta.
 */
function PicksAndRanking({ t, diseno, slug, picks, list, onOpen, onAdd, onMore }: { t: Theme; diseno: any; slug: string; picks: any[]; list: any[]; onOpen: OpenFn; onAdd: AddFn; onMore: () => void }) {
  const rated = list.filter((p) => Number(p?.ratingCount || 0) > 0 && Number(p?.ratingAvg || 0) > 0)
    .sort((a, b) => Number(b.ratingAvg) * Math.log2(2 + Number(b.ratingCount)) - Number(a.ratingAvg) * Math.log2(2 + Number(a.ratingCount)));
  const featured = list.filter((p) => p?.destacado);
  const ranking = (rated.length >= 2 ? rated : featured.length >= 2 ? featured : []).slice(0, 4);
  const rankTitle = rated.length >= 2 ? editable(diseno?.canastaRankRatedTitle, 'Mejor valorados') : editable(diseno?.canastaRankFeaturedTitle, 'Favoritos de la casa');
  const showRank = ranking.length >= 2 && !isOn(diseno?.canastaRankHidden);

  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-10 lg:px-8">
      <div className={`grid gap-6 ${showRank ? 'lg:grid-cols-[1fr_330px]' : ''}`}>
        <div className="min-w-0">
          <SectionHeader t={t} title={editable(diseno?.canastaPicksTitle, 'Recomendados para ti')} onMore={onMore} />
          <ProductGrid t={t} products={picks} slug={slug} onOpen={onOpen} onAdd={onAdd} cols={showRank ? (picks.length >= 6 ? 'lg:grid-cols-3 xl:grid-cols-6' : 'lg:grid-cols-3') : PICK_COLS[Math.min(picks.length, 6)]} compact />
        </div>
        {showRank && (
          <div>
            <SectionHeader t={t} title={rankTitle} onMore={onMore} />
            <motion.ol key={listSig(ranking)} variants={caStagger} initial="hidden" whileInView="show" viewport={caViewport} className="space-y-2.5">
              {ranking.map((p, i) => <RankRow key={p.id} t={t} p={p} n={i + 1} onOpen={() => onOpen(p)} onAdd={() => onAdd(p, 1)} />)}
            </motion.ol>
          </div>
        )}
      </div>
    </section>
  );
}

function RankRow({ t, p, n, onOpen, onAdd }: { t: Theme; p: any; n: number; onOpen: () => void; onAdd: () => void }) {
  const pr = getProductPricing(p);
  const hasVariants = Array.isArray(p?.variantes) && p.variantes.length > 0;
  const out = sinStock(Number(p?.stock ?? 1));
  return (
    <motion.li variants={caItem} className="flex items-center gap-3 rounded-xl bg-white p-2.5 pr-3" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold" style={{ background: t.primary, color: t.onPrimary, fontFamily: t.serif }}>{n}</span>
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white">{p.imagenUrl ? <img src={p.imagenUrl} alt="" loading="lazy" className="h-full w-full object-contain mix-blend-multiply" /> : <NoPhoto t={t} producto={p} size={22} />}</span>
        <span className="min-w-0">
          <span className="line-clamp-1 text-[13px] font-semibold" style={{ color: t.ink }}>{p.descripcion}</span>
          <span className="text-[13px] font-extrabold" style={{ color: pr.enOferta ? t.sale : t.ink }}>{caMoney(pr.precioFinal)}</span>
        </span>
      </button>
      <button type="button" disabled={out} aria-label={out ? 'Agotado' : hasVariants ? 'Ver opciones' : 'Agregar al carrito'} onClick={() => { if (out) return; if (hasVariants) { onOpen(); return; } onAdd(); announceAdded(p, 1); }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-[filter] hover:brightness-110 disabled:cursor-not-allowed" style={out ? { background: t.softer, color: t.muted } : { background: t.primary, color: t.onPrimary }}>
        <Icon icon={out ? 'solar:close-circle-linear' : hasVariants ? 'solar:tuning-2-linear' : 'solar:cart-plus-linear'} width={18} />
      </button>
    </motion.li>
  );
}

// ═════════════════════════════════════════════════════════════ BENEFICIOS ══
function ServicesRow({ t, services }: { t: Theme; services: Service[] }) {
  if (!services.length) return null;
  const cols: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };
  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-10 lg:px-8">
      <motion.ul key={services.map((s) => s.label).join('|')} variants={caStagger} initial="hidden" whileInView="show" viewport={caViewport} className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${cols[services.length] || 'lg:grid-cols-4'}`}>
        {services.map((s) => (
          <motion.li key={s.label} variants={caItem} className="flex items-center gap-4 rounded-xl px-5 py-4" style={{ background: t.soft }}>
            <Icon icon={s.icon} width={34} className="shrink-0" style={{ color: t.primaryInk }} />
            <span className="min-w-0 leading-tight">
              <span className="block text-[14px] font-bold" style={{ color: t.ink, fontFamily: t.serif }}>{s.label}</span>
              <span className="mt-0.5 block text-[12.5px]" style={{ color: t.muted }}>{s.sub}</span>
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

// ═════════════════════════════════════════════════════════ RESEÑAS REALES ══
type Review = { id: number; clienteNombre?: string; rating: number; comentario?: string; compraVerificada?: boolean; producto: string };

/**
 * Reseñas APROBADAS reales. Solo consulta productos que ya reportan ratingCount > 0 (máx. 4 peticiones);
 * si no hay ninguna con comentario, la sección no se muestra. Carga y estado aislados aquí.
 */
function RealReviews({ t, slug, products, title }: { t: Theme; slug: string; products: any[]; title: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const withReviews = products.filter((p) => Number(p?.ratingCount || 0) > 0).slice(0, 4);
  const key = withReviews.map((p) => p.id).join(',');

  useEffect(() => {
    if (!slug || slug === 'preview' || !key) { setReviews([]); return; }
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
  }, [slug, key]);

  if (!reviews.length) return null;
  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-10 lg:px-8">
      <SectionHeader t={t} title={title} />
      <motion.div key={reviews.map((r) => r.id).join('|')} variants={caStagger} initial="hidden" whileInView="show" viewport={caViewport} className="grid gap-4 md:grid-cols-3">
        {reviews.map((r) => (
          <motion.figure key={r.id} variants={caItem} className="flex gap-4 rounded-xl bg-white p-5" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[18px] font-extrabold" style={{ background: t.soft, color: t.primaryInk, fontFamily: t.serif }}>{(r.clienteNombre || 'C').trim().charAt(0).toUpperCase()}</span>
            <div className="min-w-0">
              <span className="flex" style={{ color: t.star }}>{Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon={i < Math.round(r.rating) ? 'solar:star-bold' : 'solar:star-linear'} width={14} />)}</span>
              <blockquote className="mt-1.5 line-clamp-3 text-[13.5px] leading-relaxed" style={{ color: t.ink }}>“{String(r.comentario).trim()}”</blockquote>
              <figcaption className="mt-2.5">
                <span className="block text-[13px] font-bold" style={{ color: t.ink }}>{r.clienteNombre || 'Cliente'}</span>
                <span className="block truncate text-[11.5px]" style={{ color: t.muted }}>{r.compraVerificada ? 'Compra verificada · ' : ''}{r.producto}</span>
              </figcaption>
            </div>
          </motion.figure>
        ))}
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ COMUNIDAD ══
/**
 * "Únete a nuestra comunidad". Sin backend de newsletter: arma el mensaje con el correo y lo abre en
 * WhatsApp (nunca simula un "suscrito"). Solo se monta si la tienda tiene WhatsApp.
 */
function Community({ t, diseno, ch }: { t: Theme; diseno: any; ch: Channels }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setError('Ingresa un correo válido.'); return; }
    setError('');
    const url = ch.wa(`Hola, quiero recibir sus ofertas y novedades. Mi correo es ${v}.`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-10 lg:px-8">
      <motion.div variants={caReveal} initial="hidden" whileInView="show" viewport={caViewport} className="relative grid items-center gap-6 overflow-hidden rounded-2xl px-6 py-7 sm:px-10 lg:grid-cols-[auto_1fr_1.15fr]" style={{ background: `linear-gradient(100deg, ${t.soft} 0%, ${t.softer} 100%)` }}>
        <Icon icon="ph:leaf-fill" aria-hidden width={110} className="pointer-events-none absolute -left-6 -top-8 -rotate-12 opacity-[0.12]" style={{ color: t.primary }} />
        <Icon icon="ph:leaf-fill" aria-hidden width={90} className="pointer-events-none absolute -bottom-8 -right-4 rotate-45 opacity-[0.12]" style={{ color: t.primary }} />
        <span className="relative hidden h-16 w-16 items-center justify-center rounded-full lg:flex" style={{ background: t.primary, color: t.onPrimary }}><Icon icon="solar:letter-bold" width={30} /></span>
        <div className="relative">
          <h2 className="text-[22px] font-bold" style={{ color: t.ink, fontFamily: t.serif }}>{editable(diseno?.canastaClubTitle, 'Únete a nuestra comunidad')}</h2>
          <p className="mt-1 max-w-md text-[13.5px]" style={{ color: t.muted }}>{editable(diseno?.canastaClubText, 'Recibe ofertas exclusivas, novedades de temporada y recetas para comer rico.')}</p>
        </div>
        <form onSubmit={submit} noValidate className="relative">
          <div className="flex flex-col gap-2 rounded-xl bg-white p-1.5 sm:flex-row" style={{ boxShadow: `inset 0 0 0 1px ${error ? t.sale : t.line}` }}>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }} placeholder="Tu correo electrónico" aria-label="Tu correo electrónico" aria-invalid={Boolean(error)} className="h-11 min-w-0 flex-1 appearance-none border-0 bg-transparent bg-none px-3 text-[14px] outline-none placeholder:text-stone-400 focus:ring-0" style={{ color: t.ink }} />
            <button type="submit" className={`${btnCls} h-11 px-6`} style={{ background: t.primary, color: t.onPrimary }}>{editable(diseno?.canastaClubButton, 'Suscribirme')}</button>
          </div>
          <p className="mt-2 text-[11.5px]" style={{ color: error ? t.sale : t.muted }}>{error || 'Se abrirá WhatsApp con tu mensaje listo para enviar.'}</p>
        </form>
      </motion.div>
    </section>
  );
}
