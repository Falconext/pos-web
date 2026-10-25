import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { buildCategoryTiles } from '@/templates/shared/categoryTiles';
import { getProductPricing } from '@/templates/shared/pricing';
import { resolveHeroIntervalMs, usePreloadImages, slidesVisibles } from '@/templates/shared/heroSlider';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import {
  EsenciaHeader, EsenciaFooter, EsenciaCartModal, EsenciaProductCard, buildServices,
  esenciaTheme, useEsenciaFont, editable, optional, isOn, btnCls, type Theme, type Service,
} from './EsenciaParts';
import { SectionHeader, MoreLink, GridSkeleton, getName, hasImage, categoryIcon, soonestOfferEnd, storeChannels, type OpenFn, type AddFn } from './EsenciaSections';
import { esEase, esHeroText, esItem, esReveal, esStagger, esViewport, mix } from './motion';

const u = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Fotos de ejemplo (reemplazables en Personalizar). */
export const ESENCIAL_IMG = {
  hero: [u('1581338834647-b0fb40704e21', 2000), u('1618244972963-dbee1a7edc95', 2000), u('1558769132-cb1aea458c5e', 2000)],
  looks: [u('1592621385612-4d7129426394', 700), u('1589465885857-44edb59bbff2', 700), u('1632149877166-f75d49000351', 700), u('1594633313593-bab3825d0caf', 700)],
  promo: u('1618244972963-dbee1a7edc95', 900),
  catalog: u('1490481651871-ab68de25d43d', 1400),
  contact: u('1603400521630-9f2de124b33b', 1400),
};

const LOOKS = ['Capas suaves', 'Fin de semana', 'Ciudad minimal', 'Neutros sin esfuerzo'];

// ═════════════════════════════════════════════════════════════════ PAGE ══
export default function EsenciaHomePage(props: TemplateHomePageProps) {
  const { tienda, slug, productos, allCategories, diseno, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, agregarAlCarrito, actualizarCantidad, loading } = props as any;
  useEsenciaFont();
  const navigate = useNavigate();
  const t = esenciaTheme(diseno);
  const [showFav, setShowFav] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);

  const list: any[] = useMemo(() => (Array.isArray(productos) ? productos : []), [productos]);
  const withImg = useMemo(() => list.filter(hasImage), [list]);
  const categories: string[] = useMemo(() => (allCategories || []).map(getName).filter(Boolean), [allCategories]);
  // Destacados primero, luego el resto (la API no informa fecha de alta, así que no se rotula como "novedades").
  const ordered = useMemo(() => [...withImg.filter((p) => p?.destacado), ...withImg.filter((p) => !p?.destacado), ...list.filter((p) => !hasImage(p))], [list, withImg]);
  const selection = ordered.slice(0, 4);
  const favorites = useMemo(() => {
    const rated = list.filter((p) => Number(p?.ratingCount || 0) > 0 && Number(p?.ratingAvg || 0) > 0)
      .sort((a, b) => Number(b.ratingAvg) * Number(b.ratingCount) - Number(a.ratingAvg) * Number(a.ratingCount));
    return rated.length ? { rated: true, items: rated.slice(0, 4) } : { rated: false, items: ordered.slice(4, 8) };
  }, [list, ordered]);
  const offers = useMemo(() => list.filter((p) => getProductPricing(p).enOferta), [list]);
  const maxDiscount = useMemo(() => offers.reduce((m, p) => Math.max(m, Number(getProductPricing(p).porcentajeDescuento) || 0), 0), [offers]);
  const offerEnd = useMemo(() => soonestOfferEnd(offers), [offers]);
  const tiles = useMemo(() => buildCategoryTiles({ allCategories, diseno, prefix: 'esencial', count: 6, fallbackImages: [] }).map((tile) => {
    const fromProduct = tile.imagenUrl ? '' : withImg.find((p) => getName(p?.categoria).toLowerCase() === tile.nombre.toLowerCase())?.imagenUrl || '';
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

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, fontFamily: t.font }}>
        <EsenciaHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={navigate} active="home" />

        <HeroSlider t={t} diseno={diseno} goAction={goAction} />

        {tiles.length > 0 && (
          <section className="mx-auto max-w-[1400px] px-4 pt-12 lg:px-8">
            <SectionHeader t={t} title={editable(diseno?.esencialCategoriesTitle, 'Compra por categoría')} onMore={goCatalog} moreLabel={editable(diseno?.esencialCategoriesMore, 'Ver todo')} />
            <CategoryGrid t={t} tiles={tiles} onPick={goCategory} />
          </section>
        )}

        {!isOn(diseno?.esencialLooksHidden) && <Looks t={t} diseno={diseno} goAction={goAction} />}

        <section className="mx-auto max-w-[1400px] px-4 pt-14 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[230px_1fr] lg:gap-10">
            <motion.div variants={esReveal} initial="hidden" whileInView="show" viewport={esViewport} className="lg:pt-10">
              <h2 className="text-[28px] leading-tight sm:text-[32px]" style={{ color: t.ink, fontFamily: t.display }}>{editable(diseno?.esencialSelectTitle, 'Nuestra selección')}</h2>
              <p className="mt-3 max-w-[220px] text-[13.5px] leading-relaxed" style={{ color: t.muted }}>{editable(diseno?.esencialSelectText, 'Piezas pensadas para tu día a día.')}</p>
              <div className="mt-6"><MoreLink t={t} label={editable(diseno?.esencialSelectMore, 'Ver todo')} onClick={goCatalog} /></div>
            </motion.div>
            {loading && !list.length ? <GridSkeleton t={t} count={4} />
              : selection.length ? (
                <motion.div variants={esStagger} initial="hidden" whileInView="show" viewport={esViewport} className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 lg:grid-cols-4">
                  {selection.map((p, i) => <motion.div key={`${p.id}-${i}`} variants={esItem} className="h-full"><EsenciaProductCard producto={p} slug={slug} t={t} onOpen={() => goProduct(p)} onAdd={(q) => add(p, q)} /></motion.div>)}
                </motion.div>
              ) : <p className="py-12 text-[13px]" style={{ color: t.muted }}>Pronto verás aquí nuestras prendas.</p>}
          </div>
        </section>

        <section className="mx-auto grid max-w-[1400px] gap-4 px-4 pt-14 lg:grid-cols-2 lg:px-8">
          {favorites.items.length > 0 && <FavoritesPanel t={t} diseno={diseno} rated={favorites.rated} items={favorites.items} slug={slug} onOpen={goProduct} onAdd={add} onMore={goCatalog} />}
          {!isOn(diseno?.esencialPromoHidden) && <SeasonPromo t={t} diseno={diseno} maxDiscount={maxDiscount} offerEnd={offerEnd} goAction={goAction} full={favorites.items.length === 0} />}
        </section>

        {!isOn(diseno?.esencialBenefitsHidden) && <Benefits t={t} services={services} />}

        <EsenciaFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <EsenciaCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } })} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.primary} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.primary} onGoProduct={(item: any) => goProduct(item)} />
      </div>
    </MotionConfig>
  );
}

// ═════════════════════════════════════════════════════════════════ HERO ══
type Slide = { image: string; onlyImage: boolean; title: string; title2: string; subtitle: string; button: string; button2: string; action: string; action2: string };

function slidesFrom(diseno: any): Slide[] {
  const d = diseno || {};
  return slidesVisibles(d, 'esencial', [
    { image: d.esencialHeroImage || ESENCIAL_IMG.hero[0], onlyImage: isOn(d.esencialHeroOnlyImage), title: editable(d.esencialHeroTitle, 'Esenciales modernos.'), title2: optional(d.esencialHeroTitle2, 'Sin esfuerzo, cada día.'), subtitle: optional(d.esencialHeroSubtitle, 'Piezas atemporales y bien pensadas.\nHechas para la vida real.'), button: editable(d.esencialHeroButton, 'Comprar ahora'), button2: optional(d.esencialHeroButton2, 'Ver categorías'), action: 'esencialHeroAction', action2: 'esencialHeroAction2' },
    { image: d.esencialSlide2Image || ESENCIAL_IMG.hero[1], onlyImage: isOn(d.esencialSlide2OnlyImage), title: editable(d.esencialSlide2Title, 'Capas que acompañan.'), title2: optional(d.esencialSlide2Title2, 'Tonos que combinan.'), subtitle: optional(d.esencialSlide2Subtitle, 'Abrigos, tejidos y básicos para vestir sin pensarlo.'), button: editable(d.esencialSlide2Button, 'Descubrir'), button2: optional(d.esencialSlide2Button2, ''), action: 'esencialSlide2Action', action2: 'esencialSlide2Action2' },
    { image: d.esencialSlide3Image || ESENCIAL_IMG.hero[2], onlyImage: isOn(d.esencialSlide3OnlyImage), title: editable(d.esencialSlide3Title, 'Texturas suaves.'), title2: optional(d.esencialSlide3Title2, 'Calidad que se siente.'), subtitle: optional(d.esencialSlide3Subtitle, 'Punto, algodón y lino en colores neutros.'), button: editable(d.esencialSlide3Button, 'Ver la colección'), button2: optional(d.esencialSlide3Button2, ''), action: 'esencialSlide3Action', action2: 'esencialSlide3Action2' },
  ]);
}

/** Slider del hero. Aislado: su intervalo solo re-renderiza este componente. */
function HeroSlider({ t, diseno, goAction }: { t: Theme; diseno: any; goAction: (k: string) => void }) {
  const slides = useMemo(() => slidesFrom(diseno), [diseno]);
  const interval = resolveHeroIntervalMs(diseno, 'esencialHeroInterval', 6500);
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
      <div className={`relative overflow-hidden sm:min-h-[540px] lg:min-h-[600px] ${s.onlyImage ? 'min-h-[340px]' : ''}`} style={{ background: s.onlyImage ? mix(t.ink, 6, t.bg) : t.bg }}>
        {/* En celular la foto va arriba y se funde con el fondo; desde sm, a todo el ancho detrás del texto. */}
        <div aria-hidden className={s.onlyImage ? 'absolute inset-0' : 'absolute inset-x-0 top-0 h-[340px] [mask-image:linear-gradient(180deg,#000_72%,transparent)] sm:inset-0 sm:h-auto sm:[mask-image:none]'}>
          {slides.map((sl, i) => (
            <motion.img key={sl.action} src={sl.image} alt="" initial={false} animate={{ opacity: i === idx ? 1 : 0, scale: i === idx ? 1 : 1.03 }} transition={{ duration: 1.2, ease: esEase }} className="absolute inset-0 h-full w-full object-cover object-[70%_center]" loading={i === 0 ? 'eager' : 'lazy'} />
          ))}
        </div>
        {s.onlyImage ? (
          <button type="button" aria-label={s.title} onClick={() => goAction(s.action)} className="absolute inset-0 z-[1]" />
        ) : (
          <>
            <div aria-hidden className="absolute inset-0 hidden sm:block" style={{ background: `linear-gradient(90deg, ${mix(t.bg, 88, 'transparent')} 0%, ${mix(t.bg, 60, 'transparent')} 32%, transparent 62%)` }} />
            <div className="relative z-[2] mx-auto flex max-w-[1400px] px-4 pb-16 pt-[310px] sm:min-h-[540px] sm:items-center sm:pb-0 sm:pt-0 lg:min-h-[600px] lg:px-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={idx} variants={esStagger} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.2 } }} className="max-w-[560px]">
                  <motion.h1 variants={esHeroText} className="text-[42px] leading-[1.04] sm:text-[58px] lg:text-[66px]" style={{ color: t.ink, fontFamily: t.display }}>
                    {s.title}{s.title2 && <><br /><span className="text-[0.86em]">{s.title2}</span></>}
                  </motion.h1>
                  {s.subtitle && <motion.p variants={esHeroText} className="mt-6 max-w-[380px] whitespace-pre-line text-[15.5px] leading-relaxed" style={{ color: mix(t.ink, 78, t.bg) }}>{s.subtitle}</motion.p>}
                  <motion.div variants={esHeroText} className="mt-8 flex flex-wrap items-center gap-6">
                    <button type="button" onClick={() => goAction(s.action)} className={`${btnCls} h-12 px-7`} style={{ background: t.primary, color: t.onPrimary }}>{s.button}</button>
                    {s.button2 && (
                      <button type="button" onClick={() => goAction(s.action2)} className="group inline-flex items-center gap-2.5 text-[14px]" style={{ color: t.ink }}>
                        {s.button2}<Icon icon="ph:arrow-right-light" width={19} className="transition-transform duration-300 group-hover:translate-x-1" />
                      </button>
                    )}
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        )}
        {slides.length > 1 && (
          <div className="absolute bottom-6 left-0 right-0 z-[3]">
            <div className="mx-auto flex max-w-[1400px] gap-2 px-4 lg:px-8">
              {slides.map((sl, i) => (
                <button key={sl.action} type="button" aria-label={`Ir al banner ${i + 1}`} aria-current={i === idx} onClick={() => setIdx(i)} className="flex h-6 items-center">
                  <span className="block h-[2px] w-10 origin-left transition-colors duration-500" style={{ background: i === idx ? t.ink : mix(t.ink, 25, t.bg) }} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════ CATEGORÍAS ══
function CategoryGrid({ t, tiles, onPick }: { t: Theme; tiles: { nombre: string; label: string; imagenUrl: string; isProduct: boolean }[]; onPick: (c: string) => void }) {
  const cols: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6' };
  return (
    <motion.div variants={esStagger} initial="hidden" whileInView="show" viewport={esViewport} className={`grid grid-cols-3 gap-3 sm:gap-4 ${cols[tiles.length] || 'lg:grid-cols-6'}`}>
      {tiles.map((c) => (
        <motion.button key={c.nombre} type="button" variants={esItem} onClick={() => onPick(c.nombre)} className="group text-center">
          <span className="relative block aspect-[1/1.05] overflow-hidden" style={{ background: t.soft }}>
            {c.imagenUrl
              ? <img src={c.imagenUrl} alt="" loading="lazy" className={`absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.05] ${c.isProduct ? 'object-contain p-[10%] mix-blend-multiply' : 'object-cover'}`} />
              : <span className="absolute inset-0 flex items-center justify-center"><Icon icon={categoryIcon(c.nombre)} width={54} style={{ color: mix(t.ink, 35, t.soft) }} /></span>}
          </span>
          <span className="mt-3 block truncate text-[13.5px]" style={{ color: t.ink }}>{c.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════ LOOKS ══
/** Looks editables (foto, título, enlace). Contenido editorial del negocio, sin datos inventados. */
function Looks({ t, diseno, goAction }: { t: Theme; diseno: any; goAction: (k: string) => void }) {
  const d = diseno || {};
  const looks = LOOKS.map((title, i) => {
    const n = i + 1;
    return {
      key: `esencialLook${n}Action`,
      img: d[`esencialLook${n}Image`] || ESENCIAL_IMG.looks[i],
      title: editable(d[`esencialLook${n}Title`], title),
      link: optional(d[`esencialLook${n}Link`], 'Ver el look'),
      hidden: isOn(d[`esencialLook${n}Hidden`]),
    };
  }).filter((l) => !l.hidden);
  if (!looks.length) return null;
  return (
    <section id="looks" className="mx-auto max-w-[1400px] px-4 pt-14 lg:px-8">
      <motion.div variants={esReveal} initial="hidden" whileInView="show" viewport={esViewport} className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[230px_1fr] lg:gap-8 lg:p-4 lg:pl-10" style={{ background: t.band }}>
        <div className="flex flex-col justify-center lg:py-8">
          <h2 className="text-[34px] leading-[1.05] sm:text-[40px]" style={{ color: t.ink, fontFamily: t.display }}>{editable(d.esencialLooksTitle, 'Looks curados')}</h2>
          <p className="mt-4 max-w-[200px] text-[13.5px] leading-relaxed" style={{ color: mix(t.ink, 72, t.band) }}>{editable(d.esencialLooksText, 'Conjuntos pensados para cómo vives.')}</p>
          <button type="button" onClick={() => goAction('esencialLooksAction')} className="group mt-8 inline-flex w-max items-center gap-2.5 text-[14px]" style={{ color: t.ink }}>
            {editable(d.esencialLooksButton, 'Explorar looks')}<Icon icon="ph:arrow-right-light" width={19} className="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
        <motion.div variants={esStagger} className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
          {looks.map((l) => (
            <motion.button key={l.key} type="button" variants={esItem} onClick={() => goAction(l.key)} className="group w-[62%] shrink-0 snap-start bg-white text-center sm:w-[38%] lg:w-auto">
              <span className="block aspect-[4/5] overflow-hidden"><img src={l.img} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" /></span>
              <span className="block px-2 pb-4 pt-3">
                <span className="block truncate text-[13.5px]" style={{ color: t.ink }}>{l.title}</span>
                {l.link && <span className="mt-1 inline-block text-[10.5px] uppercase tracking-[0.12em] underline underline-offset-4" style={{ color: mix(t.ink, 75, '#fff') }}>{l.link}</span>}
              </span>
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════ FAVORITOS ══
/** Favoritos reales (mejor valorados). Sin reseñas todavía, se presentan como básicos, sin estrellas falsas. */
function FavoritesPanel({ t, diseno, rated, items, slug, onOpen, onAdd, onMore }: { t: Theme; diseno: any; rated: boolean; items: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn; onMore: () => void }) {
  const title = rated ? editable(diseno?.esencialFavTitle, 'Favoritos de nuestros clientes') : editable(diseno?.esencialBasicsTitle, 'Básicos que no fallan');
  const text = rated ? editable(diseno?.esencialFavText, 'Los mejor valorados por quienes ya compraron.') : editable(diseno?.esencialBasicsText, 'Piezas atemporales para combinar con todo.');
  return (
    <motion.div variants={esReveal} initial="hidden" whileInView="show" viewport={esViewport} className="p-5 sm:p-7" style={{ background: t.bandSoft }}>
      <h2 className="text-[26px] leading-tight sm:text-[30px]" style={{ color: t.ink, fontFamily: t.display }}>{title}</h2>
      <p className="mt-1.5 text-[13px]" style={{ color: t.muted }}>{text}</p>
      <div className="mt-3"><MoreLink t={t} label="Ver todo" onClick={onMore} /></div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((p, i) => <EsenciaProductCard key={`${p.id}-${i}`} producto={p} slug={slug} t={t} compact showRating={rated} onOpen={() => onOpen(p)} onAdd={(q) => onAdd(p, q)} />)}
      </div>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════ PROMO DE TEMPORADA ══
/** Promo editable. El % solo aparece si hay ofertas REALES (descuento máximo); la fecha, solo si existe. */
function SeasonPromo({ t, diseno, maxDiscount, offerEnd, goAction, full }: { t: Theme; diseno: any; maxDiscount: number; offerEnd: number | null; goAction: (k: string) => void; full: boolean }) {
  const d = diseno || {};
  const showDiscount = maxDiscount > 0 && !isOn(d.esencialPromoDiscountHidden);
  const until = offerEnd ? new Date(offerEnd).toLocaleDateString('es-PE', { day: 'numeric', month: 'long' }) : '';
  return (
    <motion.button type="button" variants={esReveal} initial="hidden" whileInView="show" viewport={esViewport} onClick={() => goAction('esencialPromoAction')} className={`group relative grid min-h-[300px] overflow-hidden text-left sm:grid-cols-[1.1fr_1fr] ${full ? 'lg:col-span-2' : ''}`} style={{ background: t.band }}>
      <div className="relative z-10 flex flex-col justify-center p-6 sm:p-8">
        <p className="text-[13px]" style={{ color: t.ink }}>{editable(d.esencialPromoEyebrow, 'Edición de temporada')}</p>
        <h2 className="mt-3 text-[28px] leading-tight sm:text-[32px]" style={{ color: t.ink, fontFamily: t.display }}>{editable(d.esencialPromoTitle, 'Renueva tu clóset')}</h2>
        <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed" style={{ color: mix(t.ink, 72, t.band) }}>{editable(d.esencialPromoText, 'Capas ligeras y tonos frescos.\nNueva temporada, nueva mirada.')}</p>
        {showDiscount && (
          <>
            <p className="mt-5 text-[38px] leading-none sm:text-[44px]" style={{ color: t.ink, fontFamily: t.display }}>Hasta {maxDiscount}% dscto.</p>
            <p className="mt-3 text-[12.5px]" style={{ color: mix(t.ink, 72, t.band) }}>En productos seleccionados{until ? `, hasta el ${until}` : ''}.</p>
          </>
        )}
        <span className={`${btnCls} mt-6 h-10 w-max px-5 text-[12.5px]`} style={{ background: t.primary, color: t.onPrimary }}>
          {editable(d.esencialPromoButton, showDiscount ? 'Ver ofertas' : 'Ver la edición')}<Icon icon="ph:arrow-right-light" width={16} />
        </span>
      </div>
      <div className="relative min-h-[260px]">
        <img src={d.esencialPromoImage || ESENCIAL_IMG.promo} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]" />
      </div>
    </motion.button>
  );
}

// ═════════════════════════════════════════════════════════ BENEFICIOS ══
function Benefits({ t, services }: { t: Theme; services: Service[] }) {
  const shown = services.slice(0, 4);
  if (!shown.length) return null;
  const cols: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-12 lg:px-8">
      <motion.ul variants={esStagger} initial="hidden" whileInView="show" viewport={esViewport} className={`grid grid-cols-2 gap-6 ${cols[shown.length] || 'lg:grid-cols-4'}`}>
        {shown.map((s) => (
          <motion.li key={s.label} variants={esItem} className="flex items-center gap-4 lg:justify-center">
            <Icon icon={s.icon} width={34} className="shrink-0" style={{ color: t.ink }} />
            <span className="leading-tight"><span className="block text-[12.5px] font-medium uppercase tracking-[0.06em]" style={{ color: t.ink }}>{s.label}</span><span className="mt-1 block text-[12.5px]" style={{ color: t.muted }}>{s.sub}</span></span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
