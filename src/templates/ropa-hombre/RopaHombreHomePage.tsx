import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { getProductPricing } from '@/templates/shared/pricing';
import { buildCategoryTiles, type CategoryTile } from '@/templates/shared/categoryTiles';
import { resolveHeroIntervalMs, usePreloadImages } from '@/templates/shared/heroSlider';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import {
  UrbHeader, UrbFooter, UrbCartModal, buildServices, urbTheme, useUrbFont,
  editable, optional, isOn, nameOf, serif, btnCls, type Theme, type Service,
} from './RopaHombreParts';
import { SectionHeader, ProductGrid, GridSkeleton, ProductRail, OfferCountdown, RealReviews, Eyebrow, soonestOfferEnd, storeChannels, getName, hasImage, type OpenFn, type AddFn } from './RopaHombreSections';
import { mix, urEase, urHeroText, urItem, urReveal, urStagger, urViewport } from './motion';

const u = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Fotografía de ejemplo (reemplazable en Personalizar). */
export const URBANIC_IMG = {
  hero: [u('1507679799987-c73779587ccf', 2000), u('1617127365659-c47fa864d8bc', 2000), u('1618886614638-80e3c103d31a', 2000)],
  tiles: [u('1552374196-1ab2a1c593e8', 1100), u('1602810316693-3667c854239a', 900), u('1622519407650-3df9883f76a5', 800), u('1473966968600-fa801b869a1a', 800)],
  manifesto: [u('1593030761757-71fae45fa0e7', 700), u('1504593811423-6dd665756598', 700)],
  editorial: u('1480429370139-e0132c086e2a', 1300),
  sale: u('1602810318383-e386cc2a3ccf', 1100),
  community: u('1491336477066-31156b5e4f35', 1100),
};

// ═════════════════════════════════════════════════════════════════ PAGE ══
export default function RopaHombreHomePage(props: TemplateHomePageProps) {
  const { tienda, slug, productos, allCategories, diseno, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, agregarAlCarrito, actualizarCantidad, loading } = props as any;
  useUrbFont();
  const navigate = useNavigate();
  const t = urbTheme(diseno);
  const [showFav, setShowFav] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);

  const list: any[] = useMemo(() => (Array.isArray(productos) ? productos : []), [productos]);
  const withImg = useMemo(() => list.filter(hasImage), [list]);
  const categories: string[] = useMemo(() => (allCategories || []).map(getName).filter(Boolean), [allCategories]);
  const newest = useMemo(() => {
    const pool = [...list].sort((a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0));
    return pool.slice(0, pool.length >= 8 ? 8 : Math.min(4, pool.length));
  }, [list]);
  const essentials = useMemo(() => {
    const seen = new Set(newest.slice(0, 4).map((p) => p?.id));
    const pool = [...withImg.filter((p) => p?.destacado), ...withImg.filter((p) => !p?.destacado)];
    return pool.filter((p) => !seen.has(p?.id)).slice(0, 10);
  }, [withImg, newest]);
  const offers = useMemo(() => list.filter((p) => getProductPricing(p).enOferta), [list]);
  const offerEndsAt = useMemo(() => soonestOfferEnd(offers), [offers]);
  const brands = useMemo(() => Array.from(new Set(list.map((p) => nameOf(p?.marca).trim()).filter(Boolean))).slice(0, 10), [list]);
  const tiles = useMemo(() => buildCategoryTiles({ allCategories, diseno, prefix: 'ropaHombre', count: 4, fallbackImages: URBANIC_IMG.tiles }), [allCategories, diseno]);
  const ch = storeChannels(tienda, diseno);
  const services = useMemo(() => buildServices(tienda, ch.hasWhatsapp), [tienda, ch.hasWhatsapp]);

  const cartCount = (carrito || []).reduce((s: number, i: any) => s + Number(i?.cantidad || 1), 0);
  const goCatalog = () => navigate(`/tienda/${slug}/catalogo`);
  const goCategory = (name: string) => navigate(`/tienda/${slug}/catalogo?category=${encodeURIComponent(name)}`);
  const goProduct: OpenFn = (p) => navigate(`/tienda/${slug}/producto/${p.id}`);
  const add: AddFn = (p, qty = 1) => agregarAlCarrito({ ...p, __cantidad: qty });
  const goAction = (key: string) => runStoreLinkAction(getStoreLinkAction(diseno, key, { defaultType: 'catalog' }), { slug, navigate });
  const advisorUrl = ch.wa('Hola, quisiera asesoría de estilo para elegir mis prendas.');

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, fontFamily: t.font }}>
        <UrbHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={navigate} overlay />

        <HeroSlider t={t} diseno={diseno} goAction={goAction} />
        <Manifesto t={t} diseno={diseno} />
        {tiles.length > 0 && <Collections t={t} diseno={diseno} tiles={tiles} onPick={goCategory} />}

        <section id="novedades" className="mx-auto max-w-[1440px] scroll-mt-28 px-5 py-20 lg:px-10">
          <SectionHeader t={t} index="03" eyebrow={editable(diseno?.ropaHombreFreshEyebrow, 'Recién llegado')} title={editable(diseno?.ropaHombreFreshTitle, 'Novedades de la temporada')} onMore={goCatalog} moreLabel={editable(diseno?.ropaHombreFreshButton, 'Ver todo')} />
          {loading && !list.length ? <GridSkeleton t={t} /> : <ProductGrid t={t} products={newest} slug={slug} onOpen={goProduct} onAdd={add} />}
        </section>

        <Editorial t={t} diseno={diseno} goAction={goAction} />
        {offers.length > 0 && <SaleBand t={t} diseno={diseno} offers={offers} endsAt={offerEndsAt} slug={slug} onOpen={goProduct} onAdd={add} onMore={goCatalog} />}
        {essentials.length >= 4 && <ProductRail t={t} eyebrow={`05 — ${editable(diseno?.ropaHombreBestsellersEyebrow, 'Siempre en el armario')}`} title={editable(diseno?.ropaHombreBestsellersTitle, 'Los esenciales')} products={essentials} slug={slug} onOpen={goProduct} onAdd={add} onMore={goCatalog} />}
        {brands.length >= 3 && <BrandStrip t={t} diseno={diseno} brands={brands} />}
        <RealReviews t={t} slug={slug} products={list} eyebrow={editable(diseno?.ropaHombreTestimonialEyebrow, 'Clientes de la casa')} title={editable(diseno?.ropaHombreTestimonialTitle, 'Lo que dicen de nosotros')} />
        <ServicesRow t={t} diseno={diseno} services={services} />
        {advisorUrl && <Advisor t={t} diseno={diseno} url={advisorUrl} />}

        <UrbFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <UrbCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } })} t={t} tienda={tienda} diseno={diseno} />
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
  return [
    { image: d.ropaHombreHeroImage || URBANIC_IMG.hero[0], onlyImage: isOn(d.ropaHombreHeroOnlyImage), eyebrow: editable(d.ropaHombreHeroEyebrow, 'Colección de temporada'), title: editable(d.ropaHombreHeroTitle, 'El arte de'), title2: line2(d.ropaHombreHeroTitle, d.ropaHombreHeroTitle2, 'vestir bien'), subtitle: editable(d.ropaHombreHeroSubtitle, 'Cortes precisos, tejidos nobles y piezas pensadas para durar.'), button: editable(d.ropaHombreHeroButton, 'Descubrir la colección'), action: 'ropaHombreHeroAction' },
    { image: d.ropaHombreSlide2Image || URBANIC_IMG.hero[1], onlyImage: isOn(d.ropaHombreSlide2OnlyImage), eyebrow: editable(d.ropaHombreSlide2Eyebrow, 'Sastrería'), title: editable(d.ropaHombreSlide2Title, 'Presencia'), title2: line2(d.ropaHombreSlide2Title, d.ropaHombreSlide2Title2, 'sin esfuerzo'), subtitle: editable(d.ropaHombreSlide2Subtitle, 'Sacos y camisas con líneas limpias para cada ocasión.'), button: editable(d.ropaHombreSlide2Button, 'Ver sastrería'), action: 'ropaHombreSlide2Action' },
    { image: d.ropaHombreSlide3Image || URBANIC_IMG.hero[2], onlyImage: isOn(d.ropaHombreSlide3OnlyImage), eyebrow: editable(d.ropaHombreSlide3Eyebrow, 'Esenciales'), title: editable(d.ropaHombreSlide3Title, 'Menos, pero'), title2: line2(d.ropaHombreSlide3Title, d.ropaHombreSlide3Title2, 'mejor'), subtitle: editable(d.ropaHombreSlide3Subtitle, 'Básicos impecables que combinan con todo tu armario.'), button: editable(d.ropaHombreSlide3Button, 'Ver esenciales'), action: 'ropaHombreSlide3Action' },
  ];
}

const PROGRESS_CSS = `
@keyframes ur-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.ur-progress { transform-origin: left; animation: ur-progress var(--ur-dur) linear forwards; }
.ur-paused .ur-progress { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .ur-progress { animation: none; transform: scaleX(1); } }
`;

/** Hero a pantalla completa. Aislado: su temporizador solo re-renderiza este componente. */
function HeroSlider({ t, diseno, goAction }: { t: Theme; diseno: any; goAction: (k: string) => void }) {
  const slides = useMemo(() => slidesFrom(diseno || {}), [diseno]);
  const interval = resolveHeroIntervalMs(diseno, 'ropaHombreHeroInterval', 7000);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  usePreloadImages(slides.map((s) => s.image));
  useEffect(() => {
    if (!interval || paused) return;
    const id = window.setTimeout(() => setIdx((v) => (v + 1) % slides.length), interval);
    return () => window.clearTimeout(id);
  }, [idx, interval, paused, slides.length]);
  const s = slides[idx];
  const secondary = optional(diseno?.ropaHombreHeroButton2, 'Ver novedades');

  return (
    <section className={`relative h-[100svh] min-h-[620px] overflow-hidden bg-black ${paused ? 'ur-paused' : ''}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <style>{PROGRESS_CSS}</style>
      {slides.map((sl, i) => (
        <motion.img key={sl.action} src={sl.image} alt="" initial={false} animate={{ opacity: i === idx ? 1 : 0, scale: i === idx ? 1.04 : 1.1 }} transition={{ opacity: { duration: 1.4, ease: urEase }, scale: { duration: 8, ease: 'linear' } }} className="absolute inset-0 h-full w-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
      ))}
      {!s.onlyImage && <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.35)_0%,rgba(0,0,0,0)_28%,rgba(0,0,0,0)_45%,rgba(0,0,0,.72)_100%)]" />}
      {s.onlyImage && <button type="button" aria-label={s.title} onClick={() => goAction(s.action)} className="absolute inset-0 z-[1]" />}

      {!s.onlyImage && (
        <div className="absolute inset-x-0 bottom-0 z-[2] mx-auto max-w-[1440px] px-5 pb-28 lg:px-10 lg:pb-24">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={idx} variants={urStagger} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.3 } }} className="max-w-3xl text-white">
              <motion.p variants={urHeroText} className="text-[11px] font-medium uppercase tracking-[0.32em] text-white/80">{s.eyebrow}</motion.p>
              <motion.h1 variants={urHeroText} className="mt-5 text-[56px] leading-[0.92] sm:text-[84px] lg:text-[112px]" style={serif(t)}>
                {s.title}{s.title2 && <><br /><em className="font-normal">{s.title2}</em></>}
              </motion.h1>
              <motion.p variants={urHeroText} className="mt-6 max-w-md text-[15px] leading-relaxed text-white/85">{s.subtitle}</motion.p>
              <motion.div variants={urHeroText} className="mt-9 flex flex-wrap items-center gap-6">
                <button type="button" onClick={() => goAction(s.action)} className={`${btnCls} h-14 px-9`} style={{ background: t.bg, color: t.ink }}>{s.button}</button>
                {idx === 0 && secondary && (
                  <button type="button" onClick={() => document.getElementById('novedades')?.scrollIntoView({ behavior: 'smooth' })} className="group inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
                    {secondary}<span className="h-px w-10 origin-left bg-white transition-transform duration-500 group-hover:scale-x-150" />
                  </button>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Progreso de slides con su nombre */}
      <div className="absolute inset-x-0 bottom-8 z-[3] mx-auto flex max-w-[1440px] justify-end px-5 lg:px-10">
        <div className="grid w-full max-w-[520px] grid-cols-3 gap-4">
          {slides.map((sl, i) => (
            <button key={sl.action} type="button" onClick={() => setIdx(i)} aria-label={`Ir a ${sl.eyebrow}`} className="group text-left">
              <span className="relative block h-px w-full overflow-hidden bg-white/30">
                {i === idx && interval > 0 && <span key={`p-${idx}`} className="ur-progress absolute inset-0 bg-white" style={{ ['--ur-dur' as any]: `${interval}ms` }} />}
                {i === idx && !interval && <span className="absolute inset-0 bg-white" />}
              </span>
              <span className={`mt-3 hidden text-[10px] font-medium uppercase tracking-[0.24em] transition-opacity sm:block ${i === idx ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}>{String(i + 1).padStart(2, '0')} — {sl.eyebrow}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ MANIFIESTO ══
function Manifesto({ t, diseno }: { t: Theme; diseno: any }) {
  if (isOn(diseno?.ropaHombreManifestoHidden)) return null;
  const imgs = [diseno?.ropaHombreManifestoImage1 || URBANIC_IMG.manifesto[0], diseno?.ropaHombreManifestoImage2 || URBANIC_IMG.manifesto[1]];
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-24 lg:px-10 lg:py-36">
      <motion.div variants={urStagger} initial="hidden" whileInView="show" viewport={urViewport} className="grid items-end gap-12 lg:grid-cols-[0.8fr_2fr]">
        <motion.div variants={urItem} className="flex gap-4 lg:flex-col">
          <Eyebrow t={t}>01 — {editable(diseno?.ropaHombreManifestoEyebrow, 'La casa')}</Eyebrow>
          <div className="hidden aspect-[3/4] w-40 overflow-hidden lg:block"><img src={imgs[0]} alt="" loading="lazy" className="h-full w-full object-cover" /></div>
        </motion.div>
        <motion.div variants={urItem}>
          <p className="text-[32px] leading-[1.18] sm:text-[44px] lg:text-[56px]" style={serif(t, { color: t.ink })}>
            {editable(diseno?.ropaHombreManifesto, 'Prendas pensadas para durar: cortes precisos, materiales que mejoran con el tiempo y un estilo que no depende de la temporada.')}
          </p>
          <div className="mt-10 flex items-center gap-6">
            <div className="aspect-[4/3] w-44 overflow-hidden sm:w-56"><img src={imgs[1]} alt="" loading="lazy" className="h-full w-full object-cover" /></div>
            <span className="h-px flex-1" style={{ background: t.line }} />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════ COLECCIONES (grilla asimétrica) ══
function Collections({ t, diseno, tiles, onPick }: { t: Theme; diseno: any; tiles: CategoryTile[]; onPick: (c: string) => void }) {
  // 4 bloques: uno alto a la izquierda y tres a la derecha. Con menos, grilla simple y pareja.
  const layout = tiles.length >= 4
    ? ['lg:col-span-6 lg:row-span-2', 'lg:col-span-6', 'lg:col-span-3', 'lg:col-span-3']
    : tiles.length === 3 ? ['lg:col-span-4', 'lg:col-span-4', 'lg:col-span-4'] : ['lg:col-span-6', 'lg:col-span-6', 'lg:col-span-12'];
  return (
    <section className="mx-auto max-w-[1440px] px-5 pb-8 lg:px-10">
      <SectionHeader t={t} index="02" eyebrow={editable(diseno?.ropaHombreCategoriesEyebrow, 'Colecciones')} title={editable(diseno?.ropaHombreCategoriesTitle, 'Vestir para cada momento')} />
      <motion.div variants={urStagger} initial="hidden" whileInView="show" viewport={urViewport} className={`grid grid-cols-2 gap-3 lg:grid-cols-12 lg:gap-4 ${tiles.length >= 4 ? 'lg:h-[840px] lg:grid-rows-2' : 'lg:h-[560px]'}`}>
        {tiles.slice(0, 4).map((tile, i) => (
          <motion.button key={`${tile.nombre}-${i}`} type="button" variants={urItem} onClick={() => onPick(tile.nombre)} className={`group relative overflow-hidden text-left ${i === 0 && tiles.length >= 4 ? 'col-span-2 aspect-[4/5] lg:aspect-auto' : 'aspect-[3/4] lg:aspect-auto'} ${layout[i] || ''}`} style={{ background: t.soft }}>
            {tile.imagenUrl && <img src={tile.imagenUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.05]" />}
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(0,0,0,.6)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white lg:p-8">
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/75">{String(i + 1).padStart(2, '0')}</p>
              <h3 className={`mt-1 leading-none ${i === 0 && tiles.length >= 4 ? 'text-[40px] lg:text-[64px]' : 'text-[26px] lg:text-[36px]'}`} style={serif(t)}>{tile.label}</h3>
              <span className="mt-4 inline-flex items-center gap-3 text-[10.5px] font-semibold uppercase tracking-[0.22em]">Descubrir<span className="h-px w-6 origin-left bg-white transition-transform duration-500 group-hover:scale-x-[2.2]" /></span>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ EDITORIAL ══
function Editorial({ t, diseno, goAction }: { t: Theme; diseno: any; goAction: (k: string) => void }) {
  if (isOn(diseno?.ropaHombreEditorialHidden)) return null;
  return (
    <section className="grid lg:grid-cols-2" style={{ background: t.primary, color: t.onPrimary }}>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={urViewport} transition={{ duration: 1.2, ease: urEase }} className="relative min-h-[520px] overflow-hidden lg:min-h-[760px]">
        <img src={diseno?.ropaHombrePremiumImage || URBANIC_IMG.editorial} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      </motion.div>
      <motion.div variants={urStagger} initial="hidden" whileInView="show" viewport={urViewport} className="flex flex-col justify-center px-6 py-20 sm:px-14 lg:px-20">
        <motion.p variants={urItem} className="text-[10.5px] font-medium uppercase tracking-[0.3em]" style={{ color: mix(t.onPrimary, 60, t.primary) }}>04 — {editable(diseno?.ropaHombrePremiumEyebrow, 'Lookbook')}</motion.p>
        <motion.h2 variants={urItem} className="mt-6 text-[44px] leading-[1] sm:text-[64px]" style={serif(t)}>{editable(diseno?.ropaHombrePremiumTitle, 'La elegancia está en los detalles')}</motion.h2>
        <motion.p variants={urItem} className="mt-6 max-w-md text-[15px] leading-relaxed" style={{ color: mix(t.onPrimary, 75, t.primary) }}>{editable(diseno?.ropaHombrePremiumText, 'Costuras limpias, botones bien puestos y un calce que acompaña. Así se reconoce una buena prenda.')}</motion.p>
        <motion.div variants={urItem} className="mt-10">
          <button type="button" onClick={() => goAction('ropaHombrePremiumAction')} className={`${btnCls} h-14 px-9`} style={{ background: t.bg, color: t.ink }}>{editable(diseno?.ropaHombrePremiumButton, 'Ver la colección')}</button>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ OFERTAS ══
/** Solo con ofertas REALES. El "hasta X%" sale del mayor descuento vigente; el reloj, de fechaFinOferta. */
function SaleBand({ t, diseno, offers, endsAt, slug, onOpen, onAdd, onMore }: { t: Theme; diseno: any; offers: any[]; endsAt: number | null; slug: string; onOpen: OpenFn; onAdd: AddFn; onMore: () => void }) {
  const maxOff = Math.max(...offers.map((p) => getProductPricing(p).porcentajeDescuento));
  const few = offers.length < 4; // con pocas ofertas van junto al texto: sin filas a medias
  const head = (
    <div>
      <Eyebrow t={t}>{editable(diseno?.ropaHombreSaleEyebrow, 'Precios especiales')}</Eyebrow>
      <h2 className="mt-4 text-[48px] leading-[0.95] sm:text-[72px]" style={serif(t, { color: t.ink })}>{editable(diseno?.ropaHombreSaleTitle, 'Selección en oferta')}</h2>
      <p className="mt-5 text-[15px]" style={{ color: t.muted }}>{editable(diseno?.ropaHombreSaleSubtitle, `Hasta ${maxOff}% de descuento en ${offers.length} ${offers.length === 1 ? 'pieza' : 'piezas'} seleccionadas.`)}</p>
      <div className="mt-8 flex flex-wrap items-center gap-6">
        <button type="button" onClick={onMore} className={`${btnCls} h-14 px-9`} style={{ background: t.primary, color: t.onPrimary }}>{editable(diseno?.ropaHombreSaleButton, 'Ver ofertas')}</button>
        {endsAt && <div className="flex items-center gap-3"><span className="text-[10.5px] uppercase tracking-[0.22em]" style={{ color: t.muted }}>Termina en</span><OfferCountdown t={t} endsAt={endsAt} /></div>}
      </div>
    </div>
  );
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-24 lg:px-10">
      <motion.div variants={urReveal} initial="hidden" whileInView="show" viewport={urViewport} className={`grid gap-10 lg:grid-cols-[1fr_1.1fr] ${few ? 'items-start' : 'mb-14 items-end'}`}>
        <div className={`${few ? 'aspect-[4/5] lg:sticky lg:top-32' : 'aspect-[16/10]'} overflow-hidden`} style={{ background: t.soft }}><img src={diseno?.ropaHombreSaleImage || URBANIC_IMG.sale} alt="" loading="lazy" className="h-full w-full object-cover" /></div>
        {few ? (
          <div className="flex flex-col gap-12">
            {head}
            <ProductGrid t={t} products={offers} slug={slug} onOpen={onOpen} onAdd={onAdd} cols="sm:!grid-cols-2 lg:!grid-cols-2" />
          </div>
        ) : head}
      </motion.div>
      {!few && <ProductGrid t={t} products={offers.slice(0, 4)} slug={slug} onOpen={onOpen} onAdd={onAdd} />}
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ MARCAS ══
/** Marcas REALES del catálogo (campo marca de los productos). Con menos de 3, la franja no aparece. */
function BrandStrip({ t, diseno, brands }: { t: Theme; diseno: any; brands: string[] }) {
  return (
    <section className="border-y" style={{ borderColor: t.line }}>
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-6 px-5 py-12 lg:flex-row lg:gap-14 lg:px-10">
        <Eyebrow t={t} className="shrink-0">{editable(diseno?.ropaHombreBrandsTitle, 'Marcas en la casa')}</Eyebrow>
        <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 lg:justify-start">
          {brands.map((b) => <li key={b} className="text-[26px] leading-none" style={serif(t, { color: mix(t.ink, 70, t.bg) })}>{b}</li>)}
        </ul>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ SERVICIOS ══
function ServicesRow({ t, diseno, services }: { t: Theme; diseno: any; services: Service[] }) {
  if (!services.length) return null;
  const cols: Record<number, string> = { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-20 lg:px-10">
      <div className="mb-12 text-center">
        <Eyebrow t={t}>{editable(diseno?.ropaHombreWhyEyebrow, 'Servicio')}</Eyebrow>
        <h2 className="mt-3 text-[34px] leading-tight sm:text-[44px]" style={serif(t, { color: t.ink })}>{editable(diseno?.ropaHombreWhyTitle, 'Atención a la medida')}</h2>
      </div>
      <motion.ul variants={urStagger} initial="hidden" whileInView="show" viewport={urViewport} className={`grid grid-cols-2 gap-y-10 ${cols[services.length] || 'lg:grid-cols-4'}`}>
        {services.map((s) => (
          <motion.li key={s.label} variants={urItem} className="flex flex-col items-center px-4 text-center">
            <Icon icon={s.icon} width={40} style={{ color: t.ink }} />
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: t.ink }}>{s.label}</p>
            <p className="mt-1.5 text-[13px]" style={{ color: t.muted }}>{s.sub}</p>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ ASESORÍA ══
function Advisor({ t, diseno, url }: { t: Theme; diseno: any; url: string }) {
  return (
    <section className="mx-auto max-w-[1440px] px-5 pb-24 lg:px-10">
      <motion.div variants={urReveal} initial="hidden" whileInView="show" viewport={urViewport} className="grid overflow-hidden lg:grid-cols-2" style={{ background: t.soft }}>
        <div className="flex flex-col justify-center px-6 py-16 sm:px-14">
          <Eyebrow t={t}>{editable(diseno?.ropaHombreCommunityEyebrow, 'Asesoría personal')}</Eyebrow>
          <h2 className="mt-4 text-[40px] leading-[1] sm:text-[54px]" style={serif(t, { color: t.ink })}>{editable(diseno?.ropaHombreCommunityTitle, 'Te ayudamos a elegir')}</h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed" style={{ color: t.muted }}>{editable(diseno?.ropaHombreCommunitySubtitle, 'Cuéntanos la ocasión, tu talla habitual y tu estilo. Te respondemos personalmente por WhatsApp.')}</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className={`${btnCls} mt-9 h-14 w-max px-9`} style={{ background: t.primary, color: t.onPrimary }}>
            <Icon icon="ic:baseline-whatsapp" width={17} /> {editable(diseno?.ropaHombreCommunityButton, 'Escribir a un asesor')}
          </a>
        </div>
        <div className="relative min-h-[380px]"><img src={diseno?.ropaHombreCommunityImage || URBANIC_IMG.community} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" /></div>
      </motion.div>
    </section>
  );
}
