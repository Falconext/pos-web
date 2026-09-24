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
  StrideHeader, StrideFooter, StrideCartModal, StrideMark, StrideProductCard, buildServices,
  strideTheme, useStrideFont, editable, storeNameOf, displayStyle, type Theme, type Service,
} from './StrideParts';
import {
  SectionHeader, ProductGrid, GridSkeleton, ProductRail, OfferCountdown,
  soonestOfferEnd, storeChannels, getName, hasImage, categoryIcon,
  type OpenFn, type AddFn,
} from './StrideSections';
import { mix, stEase, stHeroText, stItem, stReveal, stStagger, stViewport } from './motion';

const HOME_PAGE_SIZE = 30; // límite de productos que carga [slug].tsx para el home

export const ZAPATOS_HERO_FALLBACKS = [
  'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1800&q=80',
];
export const ZAPATOS_TILE_FALLBACKS = [
  'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1100&q=80',
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1100&q=80',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1100&q=80',
  'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=1100&q=80',
];

const GUIDE = [
  { icon: 'ph:wave-sine-bold', title: 'Amortiguación', text: 'Para correr o caminar mucho, busca una suela que absorba el impacto.' },
  { icon: 'ph:arrows-out-line-horizontal-bold', title: 'Flexibilidad', text: 'La planta debe doblarse con tu pie, no contra él.' },
  { icon: 'ph:mountains-bold', title: 'Agarre', text: 'Suela con buen dibujo para pisos mojados o terreno irregular.' },
  { icon: 'ph:wind-bold', title: 'Transpirable', text: 'Mallas y forros ligeros mantienen el pie fresco todo el día.' },
  { icon: 'ph:footprints-bold', title: 'Soporte', text: 'Un talón firme da estabilidad en cada pisada.' },
  { icon: 'ph:ruler-bold', title: 'Talla correcta', text: 'Mide tu pie por la tarde y deja un dedo de espacio adelante.' },
];

// ═════════════════════════════════════════════════════════════════ PAGE ══
export default function StrideHomePage(props: TemplateHomePageProps) {
  const { tienda, slug, productos, allCategories, diseno, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, agregarAlCarrito, actualizarCantidad, loading } = props as any;
  useStrideFont();
  const navigate = useNavigate();
  const t = strideTheme(diseno);
  const [showFav, setShowFav] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);

  const list: any[] = useMemo(() => (Array.isArray(productos) ? productos : []), [productos]);
  const categories: string[] = useMemo(() => (allCategories || []).map(getName).filter(Boolean), [allCategories]);
  const featured = useMemo(() => {
    const withImg = [...list.filter(hasImage), ...list.filter((p) => !hasImage(p))];
    return [...withImg.filter((p) => p?.destacado), ...withImg.filter((p) => !p?.destacado)].slice(0, 12);
  }, [list]);
  const newest = useMemo(() => {
    const shown = new Set(featured.slice(0, 5).map((p) => p?.id));
    const pool = [...list].sort((a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0)).filter((p) => !shown.has(p?.id));
    return pool.slice(0, pool.length >= 8 ? 8 : 4); // filas completas de 4
  }, [list, featured]);
  const offers = useMemo(() => list.filter((p) => getProductPricing(p).enOferta), [list]);
  const offerEndsAt = useMemo(() => soonestOfferEnd(offers), [offers]);
  // El home trae como máximo 30 productos: solo si llegaron menos, los conteos por categoría son exactos.
  const countByCat = useMemo(() => {
    const m = new Map<string, number>();
    if (list.length >= HOME_PAGE_SIZE) return m;
    list.forEach((p) => { const c = getName(p?.categoria).toLowerCase(); if (c) m.set(c, (m.get(c) || 0) + 1); });
    return m;
  }, [list]);
  const tiles = useMemo(() => buildCategoryTiles({ allCategories, diseno, prefix: 'zapatos', count: 4, fallbackImages: ZAPATOS_TILE_FALLBACKS }), [allCategories, diseno]);
  const ch = storeChannels(tienda, diseno);
  const services = useMemo(() => buildServices(tienda, ch.hasWhatsapp), [tienda, ch.hasWhatsapp]);
  const heroThumbs = useMemo(() => list.filter(hasImage).slice(0, 3).map((p) => p.imagenUrl as string), [list]);

  const cartCount = (carrito || []).reduce((s: number, i: any) => s + Number(i?.cantidad || 1), 0);
  const goCatalog = () => navigate(`/tienda/${slug}/catalogo`);
  const goCategory = (name: string) => navigate(`/tienda/${slug}/catalogo?category=${encodeURIComponent(name)}`);
  const goProduct: OpenFn = (p) => navigate(`/tienda/${slug}/producto/${p.id}`);
  const add: AddFn = (p, qty = 1) => agregarAlCarrito({ ...p, __cantidad: qty });
  const goAction = (key: string) => runStoreLinkAction(getStoreLinkAction(diseno, key, { defaultType: 'catalog' }), { slug, navigate });
  const scrollToFeatured = () => document.getElementById('st-destacados')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const joinUrl = ch.wa(`Hola, quiero unirme a la comunidad de ${storeNameOf(tienda)} para recibir novedades.`);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, fontFamily: t.font }}>
        <StrideHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={navigate} />

        <HeroSlider t={t} diseno={diseno} services={services} thumbs={heroThumbs} modelCount={list.length} goAction={goAction} onSecondary={scrollToFeatured} />
        <SearchChips t={t} diseno={diseno} categories={categories} onSearch={(v) => navigate(`/tienda/${slug}/catalogo${v ? `?search=${encodeURIComponent(v)}` : ''}`)} onCategory={goCategory} onAll={goCatalog} />

        <div id="st-destacados" className="scroll-mt-24">
          {loading && !list.length ? (
            <section className="mx-auto max-w-[1320px] px-4 py-10 lg:px-8"><GridSkeleton t={t} count={5} cols="lg:grid-cols-5" /></section>
          ) : (
            <ProductRail t={t} title={editable(diseno?.zapatosFeaturedTitle, 'Destacados')} products={featured} slug={slug} onOpen={goProduct} onAdd={add} onMore={goCatalog} moreLabel="Ver todo" />
          )}
        </div>

        {tiles.length > 0 && <CategoryTiles t={t} tiles={tiles} diseno={diseno} countByCat={countByCat} onPick={goCategory} />}

        {offers.length > 0 && <OffersBand t={t} title={editable(diseno?.zapatosOffersTitle, 'En oferta')} offers={offers} endsAt={offerEndsAt} slug={slug} onOpen={goProduct} onAdd={add} onMore={goCatalog} />}

        <Guide t={t} diseno={diseno} />

        {newest.length >= 4 && (
          <section className="mx-auto max-w-[1320px] px-4 py-10 lg:px-8">
            <SectionHeader t={t} title={editable(diseno?.zapatosNewTitle, 'Recién llegados')} onMore={goCatalog} />
            <ProductGrid t={t} products={newest} slug={slug} onOpen={goProduct} onAdd={add} />
          </section>
        )}

        {joinUrl && <Community t={t} diseno={diseno} storeName={storeNameOf(tienda)} url={joinUrl} />}
        <TrustBar t={t} services={services} />

        <StrideFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <StrideCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } })} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.primary} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.primary} onGoProduct={(item: any) => goProduct(item)} />
      </div>
    </MotionConfig>
  );
}

// ═════════════════════════════════════════════════════════════════ HERO ══
type Slide = { image: string; onlyImage: boolean; eyebrow: string; title: string; subtitle: string; button: string; action: string };

function slidesFrom(diseno: any): Slide[] {
  const d = diseno || {};
  const on = (v: any) => v === true || v === 'true' || v === '1';
  return [
    { image: d.zapatosHeroImage || ZAPATOS_HERO_FALLBACKS[0], onlyImage: on(d.zapatosHeroOnlyImage), eyebrow: editable(d.zapatosHeroEyebrow, 'Colección premium'), title: editable(d.zapatosHeroTitle, 'Zapatillas para tu ritmo y tu ciudad'), subtitle: editable(d.zapatosHeroSubtitle, 'Comodidad, estilo y tecnología en cada paso. Elige el par que va contigo.'), button: editable(d.zapatosHeroButton, 'Ver catálogo'), action: 'zapatosHeroAction' },
    { image: d.zapatosSlide2Image || ZAPATOS_HERO_FALLBACKS[1], onlyImage: on(d.zapatosSlide2OnlyImage), eyebrow: editable(d.zapatosSlide2Eyebrow, 'Running'), title: editable(d.zapatosSlide2Title, 'Corre más lejos en cada salida'), subtitle: editable(d.zapatosSlide2Subtitle, 'Modelos ligeros con buena amortiguación para entrenar o competir.'), button: editable(d.zapatosSlide2Button, 'Ver modelos'), action: 'zapatosSlide2Action' },
    { image: d.zapatosSlide3Image || ZAPATOS_HERO_FALLBACKS[2], onlyImage: on(d.zapatosSlide3OnlyImage), eyebrow: editable(d.zapatosSlide3Eyebrow, 'Lifestyle'), title: editable(d.zapatosSlide3Title, 'Clásicos que combinan con todo'), subtitle: editable(d.zapatosSlide3Subtitle, 'Pares versátiles para el día a día, del trabajo al fin de semana.'), button: editable(d.zapatosSlide3Button, 'Descubrir'), action: 'zapatosSlide3Action' },
  ];
}

/** Slider del hero. Aislado: su intervalo solo re-renderiza este componente (las tarjetas no parpadean). */
function HeroSlider({ t, diseno, services, thumbs, modelCount, goAction, onSecondary }: { t: Theme; diseno: any; services: Service[]; thumbs: string[]; modelCount: number; goAction: (k: string) => void; onSecondary: () => void }) {
  const slides = useMemo(() => slidesFrom(diseno), [diseno]);
  const interval = resolveHeroIntervalMs(diseno, 'zapatosHeroInterval', 6500);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  usePreloadImages(slides.map((s) => s.image));
  useEffect(() => {
    if (!interval || paused) return;
    const id = window.setTimeout(() => setIdx((v) => (v + 1) % slides.length), interval);
    return () => window.clearTimeout(id);
  }, [idx, interval, paused, slides.length]);
  const s = slides[idx];
  const secondaryLabel = editable(diseno?.zapatosHeroSecondary, 'Destacados');

  return (
    <section className="mx-auto max-w-[1320px] px-4 pt-5 lg:px-8" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative min-h-[560px] overflow-hidden rounded-[30px] sm:min-h-[600px] lg:min-h-[640px]" style={{ background: t.soft }}>
        {/* Imágenes apiladas: nunca se desmontan, así el cambio es un crossfade sin hueco.
            Con textos, la foto se funde con el fondo por máscara (el texto queda sobre fondo limpio, con cualquier foto). */}
        <div aria-hidden className={s.onlyImage ? 'absolute inset-0' : 'absolute inset-x-0 top-0 h-[60%] [mask-image:linear-gradient(180deg,#000_55%,transparent)] lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:w-[68%] lg:[mask-image:linear-gradient(90deg,transparent,#000_40%)]'}>
          {slides.map((sl, i) => (
            <motion.img key={sl.action} src={sl.image} alt="" initial={false} animate={{ opacity: i === idx ? 1 : 0, scale: i === idx ? 1 : 1.04 }} transition={{ duration: 1.1, ease: stEase }} className="absolute inset-0 h-full w-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
          ))}
        </div>

        {s.onlyImage ? (
          <button type="button" aria-label={s.title} onClick={() => goAction(s.action)} className="absolute inset-0 z-[1]" />
        ) : (
          <div className="relative z-[2] flex min-h-[560px] flex-col justify-end p-6 pb-14 sm:min-h-[600px] sm:p-10 sm:pb-16 lg:min-h-[640px] lg:max-w-[640px] lg:justify-center lg:p-14">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={idx} variants={stStagger} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.2 } }}>
                <motion.span variants={stHeroText} className="inline-flex rounded-full bg-white/85 px-3.5 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] backdrop-blur" style={{ color: t.ink }}>{s.eyebrow}</motion.span>
                <motion.h1 variants={stHeroText} className="mt-5 text-[38px] font-extrabold uppercase leading-[0.98] sm:text-[52px] lg:text-[60px]" style={displayStyle(t, { color: t.ink })}>{s.title}</motion.h1>
                <motion.p variants={stHeroText} className="mt-5 max-w-md text-[14.5px] leading-relaxed" style={{ color: mix(t.ink, 72, t.bg) }}>{s.subtitle}</motion.p>
                <motion.div variants={stHeroText} className="mt-8 flex flex-wrap items-center gap-3">
                  <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => goAction(s.action)} className="group inline-flex h-[52px] items-center gap-3 rounded-full pl-6 pr-1.5 text-[14px] font-bold" style={{ background: t.primary, color: t.onPrimary }}>
                    {s.button}
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90" style={{ color: t.ink }}><Icon icon="solar:arrow-right-linear" width={18} className="transition-transform duration-300 group-hover:translate-x-0.5" /></span>
                  </motion.button>
                  <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={onSecondary} className="inline-flex h-[52px] items-center rounded-full bg-white/85 px-6 text-[14px] font-semibold backdrop-blur" style={{ color: t.ink }}>
                    {secondaryLabel}
                  </motion.button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Beneficios reales de la tienda (glass) */}
        {!s.onlyImage && services.length > 0 && (
          <motion.ul variants={stStagger} initial="hidden" animate="show" className="absolute right-6 top-6 z-[2] hidden w-[176px] flex-col gap-2.5 lg:flex">
            {services.slice(0, 3).map((sv) => (
              <motion.li key={sv.label} variants={stItem} className="rounded-[18px] border border-white/60 bg-white/70 p-3.5 shadow-[0_18px_40px_-28px_rgba(28,25,23,0.5)] backdrop-blur-md">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white" style={{ color: t.primaryInk }}><Icon icon={sv.icon} width={19} /></span>
                <p className="mt-2.5 text-[12px] font-bold leading-tight" style={{ color: t.ink }}>{sv.label}</p>
                <p className="mt-0.5 text-[10.5px] leading-snug" style={{ color: t.muted }}>{sv.sub}</p>
              </motion.li>
            ))}
          </motion.ul>
        )}

        {/* Prueba real: modelos del catálogo (no "10 000 clientes" inventados) */}
        {!s.onlyImage && thumbs.length > 0 && modelCount > 0 && (
          <div className="absolute bottom-6 right-6 z-[2] hidden items-center gap-3 rounded-full border border-white/60 bg-white/75 py-2 pl-2 pr-5 shadow-[0_18px_40px_-28px_rgba(28,25,23,0.5)] backdrop-blur-md md:flex">
            <div className="flex -space-x-2.5">
              {thumbs.map((src) => <span key={src} className="h-9 w-9 overflow-hidden rounded-full border-2 border-white bg-white"><img src={src} alt="" className="h-full w-full object-contain mix-blend-multiply" /></span>)}
            </div>
            <div className="leading-tight">
              <p className="text-[13px] font-extrabold" style={{ color: t.ink }}>{modelCount >= HOME_PAGE_SIZE ? `${HOME_PAGE_SIZE}+` : modelCount} modelos</p>
              <p className="text-[10.5px]" style={{ color: t.muted }}>en catálogo</p>
            </div>
          </div>
        )}

        <div className="absolute bottom-6 left-1/2 z-[3] flex -translate-x-1/2 gap-1.5 lg:left-14 lg:translate-x-0">
          {slides.map((sl, i) => (
            <button key={sl.action} type="button" aria-label={`Ir al banner ${i + 1}`} onClick={() => setIdx(i)} className="h-1.5 rounded-full transition-all duration-500" style={{ width: i === idx ? 26 : 8, background: i === idx ? t.ink : mix(t.ink, 22, 'transparent') }} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════ BÚSQUEDA + CHIPS ══
/** Buscador con estado propio: escribir no re-renderiza la página. */
function SearchChips({ t, diseno, categories, onSearch, onCategory, onAll }: { t: Theme; diseno: any; categories: string[]; onSearch: (v: string) => void; onCategory: (c: string) => void; onAll: () => void }) {
  const [q, setQ] = useState('');
  return (
    <motion.section variants={stReveal} initial="hidden" whileInView="show" viewport={stViewport} className="mx-auto flex max-w-[1320px] flex-col gap-3 px-4 pt-6 lg:flex-row lg:items-center lg:px-8">
      <form onSubmit={(e) => { e.preventDefault(); onSearch(q.trim()); }} className="flex h-[52px] w-full shrink-0 items-center rounded-full border bg-white pl-5 pr-1.5 lg:w-[380px]" style={{ borderColor: t.line }} role="search">
        <Icon icon="solar:magnifer-linear" width={18} style={{ color: t.muted }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={editable(diseno?.zapatosSearchPlaceholder, 'Busca por modelo, marca o categoría…')} aria-label="Buscar productos" className="min-w-0 flex-1 border-0 bg-transparent bg-none px-3 text-[13.5px] outline-none placeholder:text-stone-400 focus:ring-0" style={{ color: t.ink }} />
        <button type="submit" aria-label="Buscar" className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: t.primary, color: t.onPrimary }}><Icon icon="solar:magnifer-linear" width={18} /></button>
      </form>
      {categories.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
          {categories.slice(0, 6).map((c) => (
            <button key={c} type="button" onClick={() => onCategory(c)} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border bg-white px-4 text-[12.5px] font-semibold transition-colors hover:bg-stone-50" style={{ borderColor: t.line, color: t.ink }}>
              <Icon icon={categoryIcon(c)} width={17} style={{ color: t.primaryInk }} /> {c}
            </button>
          ))}
          <button type="button" onClick={onAll} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border bg-white px-4 text-[12.5px] font-semibold" style={{ borderColor: t.line, color: t.ink }}>
            <Icon icon="solar:widget-4-linear" width={17} style={{ color: t.primaryInk }} /> Todas las categorías
          </button>
        </div>
      )}
    </motion.section>
  );
}

// ═══════════════════════════════════════════════════ CATEGORÍAS 2×2 ══
function CategoryTiles({ t, tiles, diseno, countByCat, onPick }: { t: Theme; tiles: CategoryTile[]; diseno: any; countByCat: Map<string, number>; onPick: (c: string) => void }) {
  return (
    <section className="mx-auto max-w-[1320px] px-4 py-6 lg:px-8">
      <motion.div variants={stStagger} initial="hidden" whileInView="show" viewport={stViewport} className="grid gap-4 md:grid-cols-2">
        {tiles.map((tile, i) => {
          const count = countByCat.get(tile.nombre.toLowerCase()) || 0;
          const text = String(diseno?.[`zapatosTile${i + 1}Text`] ?? '').trim() || (count > 0 ? `${count} ${count === 1 ? 'modelo disponible' : 'modelos disponibles'}` : 'Descubre la colección');
          return (
            <motion.button key={`${tile.nombre}-${i}`} type="button" variants={stItem} whileHover="hover" onClick={() => onPick(tile.nombre)} className="group relative flex h-[220px] overflow-hidden rounded-[26px] text-left sm:h-[250px]" style={{ background: t.soft }}>
              {tile.imagenUrl && (
                <div aria-hidden className="absolute inset-y-0 right-0 w-[58%] overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_45%)] sm:w-[70%]">
                  <motion.img src={tile.imagenUrl} alt="" variants={{ hover: { scale: 1.05 } }} transition={{ duration: 0.6, ease: stEase }} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="relative z-10 flex max-w-[52%] flex-col justify-between p-6 sm:p-8">
                <div>
                  <h3 className="text-[22px] font-extrabold uppercase leading-none sm:text-[26px]" style={displayStyle(t, { color: t.ink })}>{tile.label}</h3>
                  <p className="mt-3 text-[12.5px] leading-snug" style={{ color: t.muted }}>{text}</p>
                </div>
                <span className="inline-flex items-center gap-2 text-[12.5px] font-bold" style={{ color: t.ink }}>
                  Ver modelos <Icon icon="solar:arrow-right-linear" width={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ OFERTAS ══
/** Banda de ofertas REALES: panel de marca + hasta 3 tarjetas (sin huecos aunque haya 1 o 2). */
function OffersBand({ t, title, offers, endsAt, slug, onOpen, onAdd, onMore }: { t: Theme; title: string; offers: any[]; endsAt: number | null; slug: string; onOpen: OpenFn; onAdd: AddFn; onMore: () => void }) {
  const items = offers.slice(0, 3);
  const maxOff = Math.max(...offers.map((p) => getProductPricing(p).porcentajeDescuento));
  return (
    <section className="mx-auto max-w-[1320px] px-4 py-10 lg:px-8">
      <motion.div variants={stReveal} initial="hidden" whileInView="show" viewport={stViewport} className="flex flex-col gap-4 lg:flex-row">
        <div className="relative flex min-h-[260px] flex-1 flex-col justify-between overflow-hidden rounded-[26px] p-7 sm:p-9" style={{ background: `linear-gradient(140deg, ${t.primary} 0%, ${mix(t.primary, 72, '#111')} 100%)`, color: t.onPrimary }}>
          <div aria-hidden className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-75">Precios especiales</p>
            <h2 className="mt-3 text-[30px] font-extrabold uppercase leading-none sm:text-[38px]" style={displayStyle(t)}>{title}</h2>
            <p className="mt-3 text-[13.5px] opacity-80">{offers.length} {offers.length === 1 ? 'modelo' : 'modelos'} con hasta {maxOff}% de descuento.</p>
          </div>
          <div className="relative mt-6 flex flex-wrap items-center gap-3">
            {endsAt && <div className="flex items-center gap-2"><span className="text-[11.5px] font-semibold opacity-80">Termina en</span><OfferCountdown t={t} endsAt={endsAt} compact /></div>}
            <button type="button" onClick={onMore} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[13px] font-bold" style={{ color: t.ink }}>Ver catálogo <Icon icon="solar:arrow-right-linear" width={16} /></button>
          </div>
        </div>
        <motion.div variants={stStagger} initial="hidden" whileInView="show" viewport={stViewport} className="grid grid-cols-2 gap-3 sm:gap-4 lg:flex lg:shrink-0">
          {items.map((p) => (
            <motion.div key={p.id} variants={stItem} className="h-full lg:w-[250px]">
              <StrideProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════ GUÍA ══
function Guide({ t, diseno }: { t: Theme; diseno: any }) {
  if (diseno?.zapatosGuideHidden === true || diseno?.zapatosGuideHidden === 'true') return null;
  const items = GUIDE.map((g, i) => ({
    icon: g.icon,
    title: editable(diseno?.[`zapatosGuide${i + 1}Title`], g.title),
    text: editable(diseno?.[`zapatosGuide${i + 1}Text`], g.text),
  }));
  return (
    <section className="mx-auto max-w-[1320px] px-4 py-10 lg:px-8">
      <SectionHeader t={t} eyebrow={editable(diseno?.zapatosGuideEyebrow, 'Guía rápida')} title={editable(diseno?.zapatosGuideTitle, 'Encuentra tu par ideal')} />
      <motion.ul variants={stStagger} initial="hidden" whileInView="show" viewport={stViewport} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((it) => (
          <motion.li key={it.title} variants={stItem} className="flex flex-col items-center rounded-[22px] border bg-white/60 px-4 pb-6 pt-7 text-center" style={{ borderColor: t.line }}>
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: mix(t.primary, 9, '#fff'), color: t.primaryInk }}><Icon icon={it.icon} width={28} /></span>
            <p className="mt-4 text-[11.5px] font-extrabold uppercase tracking-[0.02em]" style={displayStyle(t, { color: t.ink })}>{it.title}</p>
            <p className="mt-2 text-[12px] leading-snug" style={{ color: t.muted }}>{it.text}</p>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

// ══════════════════════════════════════════════════════════ COMUNIDAD ══
function Community({ t, diseno, storeName, url }: { t: Theme; diseno: any; storeName: string; url: string }) {
  const perks = [
    { icon: 'solar:bell-bing-linear', text: editable(diseno?.zapatosClubPerk1, 'Lanzamientos primero') },
    { icon: 'solar:ruler-angular-linear', text: editable(diseno?.zapatosClubPerk2, 'Aviso cuando vuelve tu talla') },
    { icon: 'solar:chat-round-like-linear', text: editable(diseno?.zapatosClubPerk3, 'Asesoría personalizada') },
  ];
  return (
    <section className="mx-auto max-w-[1320px] px-4 py-10 lg:px-8">
      <motion.div variants={stReveal} initial="hidden" whileInView="show" viewport={stViewport} className="grid items-center gap-8 overflow-hidden rounded-[28px] p-6 sm:p-10 lg:grid-cols-[300px_1fr_auto]" style={{ background: `linear-gradient(110deg, ${mix(t.primary, 16, t.bg)} 0%, ${mix(t.primary, 5, '#fff')} 100%)` }}>
        {/* Tarjeta de marca dibujada en CSS con el nombre real de la tienda */}
        <motion.div initial={{ rotate: -6, y: 10 }} whileInView={{ rotate: -4, y: 0 }} viewport={stViewport} transition={{ duration: 0.9, ease: stEase }} className="relative mx-auto aspect-[1.6] w-full max-w-[300px] overflow-hidden rounded-[18px] p-5 shadow-[0_28px_50px_-26px_rgba(28,25,23,0.6)]" style={{ background: `linear-gradient(135deg, ${mix(t.primary, 78, '#fff')} 0%, ${t.primary} 100%)`, color: t.onPrimary }}>
          <div aria-hidden className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
          <StrideMark color="currentColor" size={30} />
          <p className="mt-3 line-clamp-2 text-[20px] font-extrabold uppercase leading-none" style={displayStyle(t)}>{storeName}</p>
          <p className="absolute bottom-4 left-5 text-[9.5px] font-bold uppercase tracking-[0.3em] opacity-80">Comunidad</p>
        </motion.div>
        <div>
          <h2 className="text-[22px] font-extrabold uppercase leading-tight sm:text-[26px]" style={displayStyle(t, { color: t.ink })}>{editable(diseno?.zapatosClubTitle, `Únete a la comunidad ${storeName}`)}</h2>
          <p className="mt-2 max-w-lg text-[13.5px] leading-relaxed" style={{ color: t.muted }}>{editable(diseno?.zapatosClubText, 'Recibe por WhatsApp los nuevos ingresos y reposiciones de tallas antes que nadie.')}</p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {perks.map((p) => (
              <li key={p.text} className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-2 text-[12px] font-semibold" style={{ color: t.ink }}><Icon icon={p.icon} width={16} style={{ color: t.primaryInk }} />{p.text}</li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-start gap-2 lg:items-center">
          <motion.a href={url} target="_blank" rel="noopener noreferrer" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="inline-flex h-[52px] items-center gap-2.5 rounded-full px-7 text-[14px] font-bold" style={{ background: t.primary, color: t.onPrimary }}>
            <Icon icon="ic:baseline-whatsapp" width={20} /> {editable(diseno?.zapatosClubButton, 'Unirme gratis')}
          </motion.a>
          <span className="text-[11px]" style={{ color: t.muted }}>Sin costo · te das de baja cuando quieras</span>
        </div>
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════ TRUST BAR ══
const TRUST_COLS: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };

function TrustBar({ t, services }: { t: Theme; services: Service[] }) {
  if (!services.length) return null;
  return (
    <section className="mx-auto max-w-[1320px] px-4 py-6 lg:px-8">
      <motion.ul variants={stStagger} initial="hidden" whileInView="show" viewport={stViewport} className={`grid grid-cols-2 gap-y-6 rounded-[24px] border bg-white/60 px-4 py-6 lg:divide-x ${TRUST_COLS[services.length] || 'lg:grid-cols-4'}`} style={{ borderColor: t.line }}>
        {services.map((s) => (
          <motion.li key={s.label} variants={stItem} className="flex items-center gap-3 px-3 lg:justify-center" style={{ borderColor: t.line }}>
            <Icon icon={s.icon} width={26} className="shrink-0" style={{ color: t.ink }} />
            <div className="min-w-0 leading-tight">
              <p className="text-[12.5px] font-bold" style={{ color: t.ink }}>{s.label}</p>
              <p className="mt-0.5 text-[11px]" style={{ color: t.muted }}>{s.sub}</p>
            </div>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
