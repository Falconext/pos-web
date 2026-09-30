import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { getProductPricing } from '@/templates/shared/pricing';
import { buildCategoryTiles, type CategoryTile } from '@/templates/shared/categoryTiles';
import { resolveHeroIntervalMs, usePreloadImages, slidesVisibles } from '@/templates/shared/heroSlider';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import {
  HdHeader, HdFooter, HdCartModal, HdProductCard, Marquee, Tag, buildServices, hdTheme, useHdFont,
  editable, isOn, display, mono, btnCls, type Theme, type Service,
} from './HoodieParts';
import { SectionHeader, ProductGrid, GridSkeleton, ProductRail, OfferCountdown, RealReviews, soonestOfferEnd, storeChannels, getName, hasImage, type OpenFn, type AddFn } from './HoodieSections';
import { hdEase, hdHeroText, hdItem, hdReveal, hdStagger, hdViewport, mix } from './motion';

const HOME_PAGE_SIZE = 30; // límite de productos que carga [slug].tsx para el home
const u = (id: string, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Fotografía de ejemplo (reemplazable en Personalizar). */
export const HOODIE_IMG = {
  hero: [u('1509942774463-acf339cf87d5', 1400), u('1523398002811-999ca8dec234', 1400), u('1556821840-3a63f95609a7', 1400)],
  tiles: [u('1520975954732-35dd22299614', 900), u('1515886657613-9f3515b0c78f', 900), u('1578587018452-892bacefd3f2', 900), u('1622519407650-3df9883f76a5', 900)],
  crew: u('1490578474895-699cd4e2cf59', 1200),
};

// ═════════════════════════════════════════════════════════════════ PAGE ══
export default function HoodieHomePage(props: TemplateHomePageProps) {
  const { tienda, slug, productos, allCategories, diseno, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, agregarAlCarrito, actualizarCantidad, loading } = props as any;
  useHdFont();
  const navigate = useNavigate();
  const t = hdTheme(diseno);
  const [showFav, setShowFav] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);

  const list: any[] = useMemo(() => (Array.isArray(productos) ? productos : []), [productos]);
  const withImg = useMemo(() => list.filter(hasImage), [list]);
  const categories: string[] = useMemo(() => (allCategories || []).map(getName).filter(Boolean), [allCategories]);
  const drop = useMemo(() => {
    const pool = [...list].sort((a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0));
    return pool.slice(0, pool.length >= 8 ? 8 : Math.min(4, pool.length));
  }, [list]);
  const featured = useMemo(() => {
    const seen = new Set(drop.slice(0, 4).map((p) => p?.id));
    return [...withImg.filter((p) => p?.destacado), ...withImg.filter((p) => !p?.destacado)].filter((p) => !seen.has(p?.id)).slice(0, 10);
  }, [withImg, drop]);
  const offers = useMemo(() => list.filter((p) => getProductPricing(p).enOferta), [list]);
  const offerEndsAt = useMemo(() => soonestOfferEnd(offers), [offers]);
  const tiles = useMemo(() => buildCategoryTiles({ allCategories, diseno, prefix: 'hoodie', count: 4, fallbackImages: HOODIE_IMG.tiles }), [allCategories, diseno]);
  // Índice: todas las categorías reales con su foto (bloque del editor > categoría > producto real).
  const exact = list.length < HOME_PAGE_SIZE;
  const index = useMemo(() => categories.slice(0, 10).map((name) => {
    const same = (p: any) => getName(p?.categoria).toLowerCase() === name.toLowerCase();
    const tile = tiles.find((x) => x.nombre.toLowerCase() === name.toLowerCase() && !x.placeholder);
    const img = (tile && tile.imagenUrl) || withImg.find(same)?.imagenUrl || '';
    return { name, img, count: exact ? list.filter(same).length : 0 };
  }), [categories, tiles, withImg, list, exact]);
  const ch = storeChannels(tienda, diseno);
  const services = useMemo(() => buildServices(tienda, ch.hasWhatsapp), [tienda, ch.hasWhatsapp]);
  const marqueeItems = useMemo(() => {
    const custom = String(diseno?.hoodieMarqueeText ?? '').trim();
    if (custom) return custom.split(/\s*[✦|·,]\s*/).filter(Boolean);
    return categories.length ? categories.slice(0, 6) : ['Nuevo drop'];
  }, [diseno?.hoodieMarqueeText, categories]);

  const cartCount = (carrito || []).reduce((s: number, i: any) => s + Number(i?.cantidad || 1), 0);
  const goCatalog = () => navigate(`/tienda/${slug}/catalogo`);
  const goCategory = (name: string) => navigate(`/tienda/${slug}/catalogo?category=${encodeURIComponent(name)}`);
  const goProduct: OpenFn = (p) => navigate(`/tienda/${slug}/producto/${p.id}`);
  const add: AddFn = (p, qty = 1) => agregarAlCarrito({ ...p, __cantidad: qty });
  const goAction = (key: string) => runStoreLinkAction(getStoreLinkAction(diseno, key, { defaultType: 'catalog' }), { slug, navigate });
  const crewUrl = ch.wa('Hola, quiero unirme al crew para enterarme de los nuevos drops.');

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, fontFamily: t.font }}>
        <HdHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={navigate} />

        <HeroDrop t={t} diseno={diseno} goAction={goAction} onAll={goCatalog} count={list.length} />
        <Marquee t={t} items={marqueeItems} bg={t.accent} color={t.onAccent} big speed={34} />

        <section className="mx-auto max-w-[1600px] px-4 py-14 lg:px-8">
          <SectionHeader t={t} index="01" eyebrow={editable(diseno?.hoodieDropEyebrow, 'Recién salido')} title={editable(diseno?.hoodieDropTitle, 'Último drop')} onMore={goCatalog} />
          {loading && !list.length ? <GridSkeleton t={t} /> : <ProductGrid t={t} products={drop} slug={slug} onOpen={goProduct} onAdd={add} />}
        </section>

        {index.length > 0 && <CategoryIndex t={t} diseno={diseno} items={index} onPick={goCategory} />}
        {tiles.length > 0 && <Lookbook t={t} diseno={diseno} tiles={tiles} onPick={goCategory} />}
        {offers.length > 0 && <SaleBlock t={t} diseno={diseno} offers={offers} endsAt={offerEndsAt} slug={slug} onOpen={goProduct} onAdd={add} onMore={goCatalog} />}
        {featured.length >= 4 && <ProductRail t={t} eyebrow={`[ 05 ] ${editable(diseno?.hoodieBestsellersEyebrow, 'Selección')}`} title={editable(diseno?.hoodieBestsellersTitle, 'Destacados')} products={featured} slug={slug} onOpen={goProduct} onAdd={add} onMore={goCatalog} />}
        <RealReviews t={t} slug={slug} products={list} eyebrow="[ Reseñas reales ]" title={editable(diseno?.hoodieReviewsTitle, 'Dicen del drop')} />
        {crewUrl && <Crew t={t} diseno={diseno} url={crewUrl} />}
        <ServicesStrip t={t} services={services} />

        <HdFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <HdCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } })} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.primary} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.primary} onGoProduct={(item: any) => goProduct(item)} />
      </div>
    </MotionConfig>
  );
}

// ═════════════════════════════════════════════════════════════════ HERO ══
type Slide = { image: string; onlyImage: boolean; eyebrow: string; title: string; title2: string; subtitle: string; button: string; action: string };

/** Línea 2 del titular: si el dueño cambió la línea 1 y no tocó la 2, no se le pega el texto de ejemplo. */
const line2 = (title: any, title2: any, fallback: string) => (title2 !== undefined && title2 !== null ? String(title2).trim() : String(title || '').trim() ? '' : fallback);

function slidesFrom(d: any = {}): Slide[] {
  return slidesVisibles(d, 'hoodie', [
    { image: d.hoodieHeroImage || HOODIE_IMG.hero[0], onlyImage: isOn(d.hoodieHeroOnlyImage), eyebrow: editable(d.hoodieHeroEyebrow, 'Nuevo drop'), title: editable(d.hoodieHeroTitle, 'Hecho para'), title2: line2(d.hoodieHeroTitle, d.hoodieHeroTitle2, 'la calle'), subtitle: editable(d.hoodieHeroSubtitle, 'Hoodies, polos y básicos oversize. Pocas unidades por modelo.'), button: editable(d.hoodieHeroButton, 'Comprar el drop'), action: 'hoodieHeroAction' },
    { image: d.hoodieSlide2Image || HOODIE_IMG.hero[1], onlyImage: isOn(d.hoodieSlide2OnlyImage), eyebrow: editable(d.hoodieSlide2Eyebrow, 'Street'), title: editable(d.hoodieSlide2Title, 'Sin reglas'), title2: line2(d.hoodieSlide2Title, d.hoodieSlide2Title2, 'sin filtro'), subtitle: editable(d.hoodieSlide2Subtitle, 'Piezas para combinar a tu manera, todos los días.'), button: editable(d.hoodieSlide2Button, 'Ver colección'), action: 'hoodieSlide2Action' },
    { image: d.hoodieSlide3Image || HOODIE_IMG.hero[2], onlyImage: isOn(d.hoodieSlide3OnlyImage), eyebrow: editable(d.hoodieSlide3Eyebrow, 'Esenciales'), title: editable(d.hoodieSlide3Title, 'Básicos'), title2: line2(d.hoodieSlide3Title, d.hoodieSlide3Title2, 'pesados'), subtitle: editable(d.hoodieSlide3Subtitle, 'Algodón grueso, calce amplio y colores que combinan con todo.'), button: editable(d.hoodieSlide3Button, 'Ver básicos'), action: 'hoodieSlide3Action' },
  ]);
}

/** Hero en bloque negro. Aislado: su temporizador solo re-renderiza este componente. */
function HeroDrop({ t, diseno, goAction, onAll, count }: { t: Theme; diseno: any; goAction: (k: string) => void; onAll: () => void; count: number }) {
  const slides = useMemo(() => slidesFrom(diseno || {}), [diseno]);
  const interval = resolveHeroIntervalMs(diseno, 'hoodieHeroInterval', 6000);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  usePreloadImages(slides.map((s) => s.image));
  useEffect(() => {
    if (!interval || paused) return;
    const id = window.setTimeout(() => setIdx((v) => (v + 1) % slides.length), interval);
    return () => window.clearTimeout(id);
  }, [idx, interval, paused, slides.length]);
  const s = slides[idx];

  if (s.onlyImage) {
    return (
      <section className="relative h-[78vh] min-h-[520px] overflow-hidden border-b" style={{ background: t.primary, borderColor: t.ink }} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        {slides.map((sl, i) => <motion.img key={sl.action} src={sl.image} alt="" initial={false} animate={{ opacity: i === idx ? 1 : 0 }} transition={{ duration: 0.6 }} className="absolute inset-0 h-full w-full object-cover" />)}
        <button type="button" aria-label={s.title} onClick={() => goAction(s.action)} className="absolute inset-0 z-[1]" />
        <Dots t={t} slides={slides} idx={idx} setIdx={setIdx} className="absolute bottom-5 left-4 z-[2] lg:left-8" />
      </section>
    );
  }

  return (
    <section className="border-b" style={{ background: t.primary, color: t.onPrimary, borderColor: t.ink }} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[1.08fr_1fr]">
        <div className="flex flex-col justify-between gap-10 px-4 py-10 lg:border-r lg:px-8 lg:py-14" style={{ borderColor: mix(t.onPrimary, 18, t.primary) }}>
          <div className="flex items-center justify-between">
            <Tag t={t} color={t.accent}>[ {s.eyebrow} ]</Tag>
            <Tag t={t} color={mix(t.onPrimary, 55, t.primary)}>{String(idx + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</Tag>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={idx} variants={hdStagger} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.15 } }}>
              <motion.h1 variants={hdHeroText} className="text-[76px] leading-[0.84] sm:text-[124px] xl:text-[160px]" style={display(t)}>
                {s.title}{s.title2 && <><br /><span style={{ color: t.accent }}>{s.title2}</span></>}
              </motion.h1>
              <motion.p variants={hdHeroText} className="mt-6 max-w-md text-[13px] uppercase leading-relaxed" style={mono(t, { color: mix(t.onPrimary, 72, t.primary) })}>{s.subtitle}</motion.p>
              <motion.div variants={hdHeroText} className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={() => goAction(s.action)} className={`${btnCls} h-14 px-7 text-[13px]`} style={{ background: t.accent, color: t.onAccent, fontFamily: t.mono }}>{s.button} →</button>
                <button type="button" onClick={onAll} className={`${btnCls} h-14 border px-7 text-[13px]`} style={{ borderColor: t.onPrimary, color: t.onPrimary, fontFamily: t.mono }}>{count > 0 ? `Ver todo (${count >= HOME_PAGE_SIZE ? `${HOME_PAGE_SIZE}+` : count})` : 'Ver todo'}</button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
          <Dots t={t} slides={slides} idx={idx} setIdx={setIdx} />
        </div>

        <div className="relative min-h-[440px] overflow-hidden lg:min-h-[640px]">
          {slides.map((sl, i) => (
            <motion.img key={sl.action} src={sl.image} alt="" initial={false} animate={{ opacity: i === idx ? 1 : 0, scale: i === idx ? 1 : 1.06 }} transition={{ duration: 0.7, ease: hdEase }} className="absolute inset-0 h-full w-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
          ))}
          {/* Sticker: el envoltorio posiciona, el hijo gira con framer (no se mezclan transforms) */}
          <div className="absolute right-5 top-5 z-[2] lg:right-8 lg:top-8">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} className="relative flex h-28 w-28 items-center justify-center rounded-full lg:h-36 lg:w-36" style={{ background: t.accent, color: t.onAccent }}>
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
                <defs><path id="hd-circle" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" /></defs>
                <text style={{ fontFamily: t.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }} fill="currentColor"><textPath href="#hd-circle">{`${s.eyebrow} ✦ ${s.eyebrow} ✦ `}</textPath></text>
              </svg>
              <Icon icon="ph:arrow-up-right-bold" width={30} />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Dots({ t, slides, idx, setIdx, className = '' }: { t: Theme; slides: Slide[]; idx: number; setIdx: (i: number) => void; className?: string }) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {slides.map((sl, i) => (
        <button key={sl.action} type="button" aria-label={`Ir al banner ${i + 1}`} onClick={() => setIdx(i)} className="h-2 transition-all duration-300" style={{ width: i === idx ? 40 : 14, background: i === idx ? t.accent : mix(t.onPrimary, 30, t.primary) }} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════ ÍNDICE DE CATEGORÍAS ══
/**
 * Lista gigante de categorías reales. En escritorio, una foto sigue al mouse (posición escrita por ref:
 * sin re-render por movimiento); el estado solo cambia al pasar a otra fila, y vive aislado aquí.
 */
function CategoryIndex({ t, diseno, items, onPick }: { t: Theme; diseno: any; items: { name: string; img: string; count: number }[]; onPick: (c: string) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = floatRef.current;
    if (el) el.style.transform = `translate3d(${e.clientX + 24}px, ${e.clientY - 120}px, 0)`;
  };
  const current = hover !== null ? items[hover] : null;
  return (
    <section className="border-y" style={{ borderColor: t.ink }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <div className="mx-auto max-w-[1600px] px-4 pt-14 lg:px-8">
        <SectionHeader t={t} index="02" eyebrow={editable(diseno?.hoodieCategoriesEyebrow, 'Índice')} title={editable(diseno?.hoodieCategoriesTitle, 'Categorías')} />
      </div>
      <ul className="mx-auto max-w-[1600px] border-t lg:px-8" style={{ borderColor: t.ink }}>
        {items.map((it, i) => (
          <li key={it.name} className="border-b" style={{ borderColor: t.ink }}>
            <button type="button" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onClick={() => onPick(it.name)} className="group flex w-full items-center gap-4 px-4 py-3 text-left transition-colors lg:px-0" style={{ background: hover === i ? t.accent : 'transparent', color: hover === i ? t.onAccent : t.ink }}>
              <span className="w-10 shrink-0 text-[12px]" style={mono(t)}>{String(i + 1).padStart(2, '0')}</span>
              {it.img && <span className="h-14 w-14 shrink-0 overflow-hidden border lg:hidden" style={{ borderColor: t.ink }}><img src={it.img} alt="" loading="lazy" className="h-full w-full object-cover" /></span>}
              <span className="min-w-0 flex-1 truncate text-[30px] leading-[1] min-[400px]:text-[36px] sm:text-[64px] lg:text-[88px]" style={display(t)}>{it.name}</span>
              {it.count > 0 && <span className="hidden text-[12px] sm:inline" style={mono(t)}>{it.count} {it.count === 1 ? 'pieza' : 'piezas'}</span>}
              <Icon icon="ph:arrow-up-right-bold" width={28} className="shrink-0 transition-transform duration-300 group-hover:rotate-45" />
            </button>
          </li>
        ))}
      </ul>
      {/* Foto flotante (solo escritorio con mouse) */}
      <div ref={floatRef} aria-hidden className="pointer-events-none fixed left-0 top-0 z-30 hidden [@media(hover:hover)]:lg:block" style={{ transform: 'translate3d(-999px,-999px,0)' }}>
        <div className="h-[260px] w-[200px] overflow-hidden border-2 transition-opacity duration-200" style={{ borderColor: t.ink, opacity: current?.img ? 1 : 0, background: t.soft }}>
          {current?.img && <img key={current.img} src={current.img} alt="" className="h-full w-full object-cover" />}
        </div>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ LOOKBOOK ══
function Lookbook({ t, diseno, tiles, onPick }: { t: Theme; diseno: any; tiles: CategoryTile[]; onPick: (c: string) => void }) {
  if (isOn(diseno?.hoodieLookbookHidden)) return null;
  const cols: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };
  return (
    <section className="mx-auto max-w-[1600px] px-4 py-14 lg:px-8">
      <SectionHeader t={t} index="03" eyebrow={editable(diseno?.hoodieLookbookEyebrow, 'Cómo se lleva')} title={editable(diseno?.hoodieLookbookTitle, 'Lookbook')} />
      <motion.div variants={hdStagger} initial="hidden" whileInView="show" viewport={hdViewport} className={`grid grid-cols-2 gap-px border ${cols[tiles.length] || 'lg:grid-cols-4'}`} style={{ background: t.ink, borderColor: t.ink }}>
        {tiles.map((tile, i) => (
          <motion.button key={`${tile.nombre}-${i}`} type="button" variants={hdItem} onClick={() => onPick(tile.nombre)} className="group relative aspect-[3/4] overflow-hidden text-left" style={{ background: t.soft }}>
            {tile.imagenUrl && <img src={tile.imagenUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover grayscale transition-[filter,transform] duration-700 group-hover:scale-[1.04] group-hover:grayscale-0" />}
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3" style={{ background: t.bg, borderTop: `1px solid ${t.ink}` }}>
              <span className="min-w-0 truncate text-[26px] leading-none" style={display(t, { color: t.ink })}>{tile.label}</span>
              <Tag t={t} color={t.ink}>LK/{String(i + 1).padStart(2, '0')}</Tag>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ REBAJAS ══
/** Solo con ofertas REALES: "hasta -X%" del mayor descuento vigente; reloj solo hasta fechaFinOferta real. */
function SaleBlock({ t, diseno, offers, endsAt, slug, onOpen, onAdd, onMore }: { t: Theme; diseno: any; offers: any[]; endsAt: number | null; slug: string; onOpen: OpenFn; onAdd: AddFn; onMore: () => void }) {
  const maxOff = Math.max(...offers.map((p) => getProductPricing(p).porcentajeDescuento));
  const few = offers.length < 3;
  return (
    <section className="border-y" style={{ background: t.primary, color: t.onPrimary, borderColor: t.ink }}>
      <div className={`mx-auto max-w-[1600px] px-4 py-14 lg:px-8 ${few ? 'lg:grid lg:grid-cols-[1fr_1.15fr] lg:items-end lg:gap-12' : ''}`}>
        <motion.div variants={hdReveal} initial="hidden" whileInView="show" viewport={hdViewport} className={few ? 'mb-8 flex flex-col gap-6 lg:mb-0' : 'mb-8 flex flex-wrap items-end justify-between gap-6'}>
          <div>
            <Tag t={t} color={t.accent}>[ 04 ] {editable(diseno?.hoodieSaleEyebrow, 'Rebajas')}</Tag>
            <h2 className="mt-2 text-[64px] leading-[0.85] sm:text-[120px]" style={display(t)}>{editable(diseno?.hoodieSaleTitle, 'Hasta')} <span style={{ color: t.accent }}>-{maxOff}%</span></h2>
          </div>
          <div className={`flex flex-col items-start gap-3 ${few ? '' : 'lg:items-end'}`}>
            {endsAt && <div className="flex items-center gap-3"><Tag t={t} color={mix(t.onPrimary, 60, t.primary)}>Termina en</Tag><OfferCountdown t={t} endsAt={endsAt} light /></div>}
            <button type="button" onClick={onMore} className={`${btnCls} h-12 px-6`} style={{ background: t.accent, color: t.onAccent, fontFamily: t.mono }}>{editable(diseno?.hoodieSaleButton, 'Ver rebajas')} →</button>
          </div>
        </motion.div>
        {few ? (
          // 1–2 ofertas: van al lado del titular para no dejar media grilla vacía.
          <motion.div variants={hdStagger} initial="hidden" whileInView="show" viewport={hdViewport} className={`grid gap-px border ${offers.length === 1 ? 'grid-cols-1 sm:max-w-sm' : 'grid-cols-2'}`} style={{ background: t.ink, borderColor: t.ink }}>
            {offers.map((p, i) => (
              <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={hdItem} className="h-full">
                <HdProductCard producto={p} slug={slug} t={t} index={i} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <ProductGrid t={t} products={offers.slice(0, 4)} slug={slug} onOpen={onOpen} onAdd={onAdd} cols={offers.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} />
        )}
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ CREW ══
function Crew({ t, diseno, url }: { t: Theme; diseno: any; url: string }) {
  return (
    <section className="border-y" style={{ borderColor: t.ink }}>
      <motion.div variants={hdReveal} initial="hidden" whileInView="show" viewport={hdViewport} className="grid lg:grid-cols-[1.2fr_1fr]" style={{ background: t.accent, color: t.onAccent }}>
        <div className="flex flex-col justify-center px-4 py-14 lg:px-8">
          <Tag t={t} color={t.onAccent}>[ WhatsApp ]</Tag>
          <h2 className="mt-2 text-[72px] leading-[0.85] sm:text-[128px]" style={display(t)}>{editable(diseno?.hoodieCrewTitle, 'Únete al crew')}</h2>
          <p className="mt-5 max-w-md text-[13px] uppercase leading-relaxed" style={mono(t)}>{editable(diseno?.hoodieCrewText, 'Entérate primero de cada drop y de las reposiciones de tallas.')}</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className={`${btnCls} mt-8 h-14 w-max px-7 text-[13px]`} style={{ background: t.primary, color: t.onPrimary, fontFamily: t.mono }}>
            <Icon icon="ic:baseline-whatsapp" width={18} /> {editable(diseno?.hoodieCrewButton, 'Entrar al grupo')} →
          </a>
        </div>
        <div className="relative min-h-[320px] border-t lg:border-l lg:border-t-0" style={{ borderColor: t.ink }}>
          <img src={diseno?.hoodieCrewImage || HOODIE_IMG.crew} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover grayscale" />
        </div>
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ SERVICIOS ══
function ServicesStrip({ t, services }: { t: Theme; services: Service[] }) {
  if (!services.length) return null;
  const cols: Record<number, string> = { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };
  return (
    <section className="mx-auto max-w-[1600px] px-4 py-10 lg:px-8">
      <ul className={`grid grid-cols-2 gap-px border ${cols[services.length] || 'lg:grid-cols-4'}`} style={{ background: t.ink, borderColor: t.ink }}>
        {services.map((s) => (
          <li key={s.label} className="flex items-center gap-3 p-5" style={{ background: t.bg }}>
            <Icon icon={s.icon} width={26} className="shrink-0" style={{ color: t.ink }} />
            <div className="min-w-0">
              <p className="text-[12.5px] font-bold uppercase" style={{ color: t.ink }}>{s.label}</p>
              <p className="text-[11px] uppercase" style={mono(t, { color: t.muted })}>{s.sub}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
