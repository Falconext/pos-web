import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { buildCategoryTiles } from '@/templates/shared/categoryTiles';
import { getProductPricing } from '@/templates/shared/pricing';
import { resolveHeroIntervalMs, usePreloadImages, slidesVisibles } from '@/templates/shared/heroSlider';
import { getStoreLinkAction, isLinkActionConfigured, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import {
  NexoHeader, NexoFooter, NexoCartModal, NexoProductCard, NexoWideCard, buildServices,
  nexoTheme, useNexoFont, editable, optional, isOn, btnCls, storeNameOf, type Theme, type Service,
} from './NexoParts';
import { SectionHeader, GridSkeleton, OfferCountdown, storeChannels, getName, hasImage, categoryIcon, soonestOfferEnd, type OpenFn, type AddFn, type Channels } from './NexoSections';
import { nxEase, nxHeroText, nxItem, nxReveal, nxStagger, nxViewport, mix } from './motion';

const u = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Fotos de ejemplo (reemplazables en Personalizar). Sin logos de marcas visibles. */
export const CELULARES_IMG = {
  hero: [u('1695048133142-1a20484d2569', 1400), u('1605236453806-6ff36851218e', 1400), u('1512499617640-c74ae3a79d37', 1400)],
  compare: u('1546054454-aa26e2b734c7', 800),
  why: u('1567581935884-3349723552ca', 700),
  promoA: u('1572569511254-d8f925fe2cbb', 900),
  promoB: u('1610945265064-0e34e5519bbf', 900),
  catalog: u('1592750475338-74b7b21085ab', 1400),
  contact: u('1511707171634-5f897ff02aa9', 1400),
};

const ACCESSORY_RE = /accesor|audif|auricul|cargad|cable|funda|case|protector|mica|power|bateri|parlante|reloj|watch/i;

// ═════════════════════════════════════════════════════════════════ PAGE ══
export default function NexoHomePage(props: TemplateHomePageProps) {
  const { tienda, slug, productos, allCategories, diseno, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, agregarAlCarrito, actualizarCantidad, loading } = props as any;
  useNexoFont();
  const navigate = useNavigate();
  const t = nexoTheme(diseno);
  const [showFav, setShowFav] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);

  const list: any[] = useMemo(() => (Array.isArray(productos) ? productos : []), [productos]);
  const withImg = useMemo(() => list.filter(hasImage), [list]);
  const categories: string[] = useMemo(() => (allCategories || []).map(getName).filter(Boolean), [allCategories]);
  const ordered = useMemo(() => [...withImg.filter((p) => p?.destacado), ...withImg.filter((p) => !p?.destacado), ...list.filter((p) => !hasImage(p))], [list, withImg]);

  // Accesorios: la categoría elegida en el editor o la primera que suena a accesorio.
  const accCat = useMemo(() => {
    const picked = String(diseno?.celularesAccCat || '').trim();
    return picked || categories.find((c) => ACCESSORY_RE.test(c)) || '';
  }, [diseno?.celularesAccCat, categories]);
  const isAcc = (p: any) => accCat && getName(p?.categoria).toLowerCase() === accCat.toLowerCase();
  const featured = useMemo(() => ordered.filter((p) => !isAcc(p)).slice(0, 4), [ordered, accCat]); // eslint-disable-line react-hooks/exhaustive-deps
  const accessories = useMemo(() => ordered.filter((p) => isAcc(p)).slice(0, 5), [ordered, accCat]); // eslint-disable-line react-hooks/exhaustive-deps
  const offers = useMemo(() => list.filter((p) => getProductPricing(p).enOferta), [list]);
  const maxDiscount = useMemo(() => offers.reduce((m, p) => Math.max(m, Number(getProductPricing(p).porcentajeDescuento) || 0), 0), [offers]);
  const offerEnd = useMemo(() => soonestOfferEnd(offers), [offers]);
  const tiles = useMemo(() => buildCategoryTiles({ allCategories, diseno, prefix: 'celulares', count: 6, fallbackImages: [] }).map((tile) => {
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
  const goOffers = offers.length ? () => document.getElementById('ofertas')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) : undefined;

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, fontFamily: t.font }}>
        <NexoHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={navigate} active="home" onDeals={goOffers} />

        <HeroSlider t={t} diseno={diseno} services={services} goAction={goAction} />

        {tiles.length > 0 && <CategoryStrip t={t} diseno={diseno} tiles={tiles} onPick={goCategory} onAll={goCatalog} />}

        <section className="mx-auto max-w-[1320px] px-4 pt-10 lg:px-8">
          <SectionHeader t={t} title={editable(diseno?.celularesFeaturedTitle, 'Celulares destacados')} onMore={goCatalog} moreLabel={editable(diseno?.celularesFeaturedMore, 'Ver todo')} />
          {loading && !list.length ? <GridSkeleton t={t} count={4} />
            : featured.length ? (
              <motion.div variants={nxStagger} initial="hidden" whileInView="show" viewport={nxViewport} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {featured.map((p, i) => <motion.div key={`${p.id}-${i}`} variants={nxItem} className="h-full"><NexoWideCard producto={p} slug={slug} t={t} onOpen={() => goProduct(p)} onAdd={(q) => add(p, q)} /></motion.div>)}
              </motion.div>
            ) : <p className="rounded-2xl border border-dashed px-6 py-12 text-center text-[13px]" style={{ borderColor: t.line, color: t.muted }}>Pronto verás aquí nuestros equipos.</p>}
        </section>

        <section className="mx-auto grid max-w-[1320px] gap-4 px-4 pt-6 lg:grid-cols-2 lg:px-8">
          {!isOn(diseno?.celularesCompareHidden) && <CompareCard t={t} diseno={diseno} onGo={goCatalog} />}
          {!isOn(diseno?.celularesWhyHidden) && <WhyCard t={t} diseno={diseno} tienda={tienda} services={services} />}
        </section>

        {accessories.length > 0 && (
          <section className="mx-auto max-w-[1320px] px-4 pt-10 lg:px-8">
            <SectionHeader t={t} title={editable(diseno?.celularesAccTitle, accCat || 'Accesorios')} onMore={() => goCategory(accCat)} moreLabel="Ver todo" />
            <motion.div variants={nxStagger} initial="hidden" whileInView="show" viewport={nxViewport} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {accessories.map((p, i) => <motion.div key={`${p.id}-${i}`} variants={nxItem} className="h-full"><NexoProductCard producto={p} slug={slug} t={t} onOpen={() => goProduct(p)} onAdd={(q) => add(p, q)} /></motion.div>)}
            </motion.div>
          </section>
        )}

        {offers.length > 0 && (
          <section id="ofertas" className="mx-auto max-w-[1320px] scroll-mt-40 px-4 pt-10 lg:px-8">
            <SectionHeader
              t={t}
              title={editable(diseno?.celularesOffersTitle, 'Ofertas')}
              right={offerEnd ? <span className="flex items-center gap-2.5"><span className="text-[12.5px] font-semibold" style={{ color: t.accentInk }}>Terminan en</span><OfferCountdown t={t} endsAt={offerEnd} /></span> : undefined}
            />
            <motion.div variants={nxStagger} initial="hidden" whileInView="show" viewport={nxViewport} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {offers.slice(0, 10).map((p, i) => <motion.div key={`${p.id}-${i}`} variants={nxItem} className="h-full"><NexoProductCard producto={p} slug={slug} t={t} onOpen={() => goProduct(p)} onAdd={(q) => add(p, q)} /></motion.div>)}
            </motion.div>
          </section>
        )}

        {!isOn(diseno?.celularesPromosHidden) && <PromoPair t={t} diseno={diseno} maxDiscount={maxDiscount} ch={ch} goAction={goAction} goOffers={goOffers} navigate={navigate} slug={slug} />}
        {!isOn(diseno?.celularesBenefitsHidden) && <Benefits t={t} services={services} />}
        {!isOn(diseno?.celularesNewsHidden) && ch.hasWhatsapp && <NewsBand t={t} diseno={diseno} ch={ch} storeName={storeNameOf(tienda)} />}

        <NexoFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <NexoCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } })} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.primary} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.primary} onGoProduct={(item: any) => goProduct(item)} />
      </div>
    </MotionConfig>
  );
}

// ═════════════════════════════════════════════════════════════════ HERO ══
type Slide = { image: string; onlyImage: boolean; eyebrow: string; title: string; title2: string; product: string; subtitle: string; button: string; script: string; action: string };

function slidesFrom(diseno: any): Slide[] {
  const d = diseno || {};
  return slidesVisibles(d, 'celulares', [
    { image: d.celularesHeroImage || CELULARES_IMG.hero[0], onlyImage: isOn(d.celularesHeroOnlyImage), eyebrow: optional(d.celularesHeroEyebrow, 'Nueva generación'), title: editable(d.celularesHeroTitle, 'Captura más'), title2: optional(d.celularesHeroTitle2, 'de lo que vives'), product: optional(d.celularesHeroProduct, ''), subtitle: optional(d.celularesHeroSubtitle, 'Los equipos y accesorios que necesitas, en un solo lugar.'), button: editable(d.celularesHeroButton, 'Comprar ahora'), script: optional(d.celularesHeroScript, 'Más allá de lo común'), action: 'celularesHeroAction' },
    { image: d.celularesSlide2Image || CELULARES_IMG.hero[1], onlyImage: isOn(d.celularesSlide2OnlyImage), eyebrow: optional(d.celularesSlide2Eyebrow, 'Potencia y diseño'), title: editable(d.celularesSlide2Title, 'Tu próximo'), title2: optional(d.celularesSlide2Title2, 'equipo te espera'), product: optional(d.celularesSlide2Product, ''), subtitle: optional(d.celularesSlide2Subtitle, 'Compara modelos y elige el que va contigo.'), button: editable(d.celularesSlide2Button, 'Ver celulares'), script: optional(d.celularesSlide2Script, ''), action: 'celularesSlide2Action' },
    { image: d.celularesSlide3Image || CELULARES_IMG.hero[2], onlyImage: isOn(d.celularesSlide3OnlyImage), eyebrow: optional(d.celularesSlide3Eyebrow, 'Accesorios'), title: editable(d.celularesSlide3Title, 'Completa'), title2: optional(d.celularesSlide3Title2, 'tu equipo'), product: optional(d.celularesSlide3Product, ''), subtitle: optional(d.celularesSlide3Subtitle, 'Audífonos, cargadores, fundas y más.'), button: editable(d.celularesSlide3Button, 'Ver accesorios'), script: optional(d.celularesSlide3Script, ''), action: 'celularesSlide3Action' },
  ]);
}

/** Slider del hero en tarjeta navy. Aislado: su intervalo solo re-renderiza este componente. */
function HeroSlider({ t, diseno, services, goAction }: { t: Theme; diseno: any; services: Service[]; goAction: (k: string) => void }) {
  const slides = useMemo(() => slidesFrom(diseno), [diseno]);
  const interval = resolveHeroIntervalMs(diseno, 'celularesHeroInterval', 6500);
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
  const chips = isOn(diseno?.celularesHeroChipsHidden) ? [] : services.slice(0, 3);

  return (
    <section className="mx-auto max-w-[1320px] px-4 pt-4 lg:px-8" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carrusel">
      <div className="relative overflow-hidden rounded-[22px]" style={{ background: t.navy }}>
        <div aria-hidden className={s.onlyImage ? 'absolute inset-0' : 'absolute inset-x-0 top-0 h-[260px] [mask-image:linear-gradient(180deg,#000_60%,transparent)] md:inset-y-0 md:left-auto md:h-full md:w-[60%] md:[mask-image:linear-gradient(90deg,transparent,#000_35%)]'}>
          {slides.map((sl, i) => (
            <motion.img key={sl.action} src={sl.image} alt="" initial={false} animate={{ opacity: i === idx ? 1 : 0, scale: i === idx ? 1 : 1.04 }} transition={{ duration: 1.1, ease: nxEase }} className="absolute inset-0 h-full w-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
          ))}
        </div>
        {s.onlyImage ? (
          <button type="button" aria-label={s.title} onClick={() => goAction(s.action)} className="relative z-[1] block h-[300px] w-full sm:h-[400px]" />
        ) : (
          <div className="relative z-[2] flex min-h-[420px] flex-col justify-end px-6 pb-12 pt-[230px] sm:px-12 md:min-h-[400px] md:justify-center md:pt-12 lg:min-h-[420px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={idx} variants={nxStagger} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.2 } }} className="max-w-[520px] text-white">
                {s.eyebrow && <motion.p variants={nxHeroText} className="text-[12px] font-semibold uppercase tracking-[0.28em]" style={{ color: mix(t.primary, 45, '#fff') }}>{s.eyebrow}</motion.p>}
                <motion.h1 variants={nxHeroText} className="mt-3 text-[38px] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-[48px] lg:text-[54px]" style={{ fontFamily: t.display }}>
                  {s.title}{s.title2 && <><br />{s.title2}</>}
                </motion.h1>
                {s.product && <motion.p variants={nxHeroText} className="mt-4 text-[18px] font-bold" style={{ fontFamily: t.display }}>{s.product}</motion.p>}
                {s.subtitle && <motion.p variants={nxHeroText} className={`${s.product ? 'mt-0.5' : 'mt-4'} max-w-[380px] text-[15.5px] leading-relaxed text-white/80`}>{s.subtitle}</motion.p>}
                <motion.div variants={nxHeroText} className="mt-6">
                  <button type="button" onClick={() => goAction(s.action)} className={`${btnCls} group h-12 bg-white px-7`} style={{ color: t.ink }}>
                    {s.button}<Icon icon="solar:arrow-right-linear" width={17} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                  </button>
                </motion.div>
                {chips.length > 0 && (
                  <motion.ul variants={nxHeroText} className="mt-8 flex flex-wrap gap-x-7 gap-y-3">
                    {chips.map((c) => (
                      <li key={c.label} className="flex items-center gap-2.5">
                        <Icon icon={c.icon} width={26} className="shrink-0 text-white/90" />
                        <span className="text-[12px] leading-tight"><span className="block font-semibold">{c.label}</span><span className="block text-white/65">{c.sub}</span></span>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
        {!s.onlyImage && s.script && (
          <p aria-hidden className="pointer-events-none absolute right-8 top-1/2 z-[2] hidden -translate-y-1/2 -rotate-12 text-[54px] leading-none text-white/90 xl:block" style={{ fontFamily: t.script }}>{s.script}</p>
        )}
        {slides.length > 1 && (
          <div className="absolute bottom-5 right-6 z-[3] flex gap-1.5">
            {slides.map((sl, i) => (
              <button key={sl.action} type="button" aria-label={`Ir al banner ${i + 1}`} aria-current={i === idx} onClick={() => setIdx(i)} className="flex h-5 items-center">
                <span className="block h-1.5 rounded-full transition-all duration-500" style={{ width: i === idx ? 22 : 8, background: i === idx ? '#fff' : 'rgba(255,255,255,.4)' }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════ CATEGORÍAS ══
function CategoryStrip({ t, diseno, tiles, onPick, onAll }: { t: Theme; diseno: any; tiles: { nombre: string; label: string; imagenUrl: string; isProduct: boolean }[]; onPick: (c: string) => void; onAll: () => void }) {
  const tile = (key: string, label: string, onClick: () => void, inner: ReactNode) => (
    <motion.button key={key} type="button" variants={nxItem} onClick={onClick} className="group flex w-[27%] shrink-0 flex-col items-center sm:w-[18%] lg:w-auto">
      <span className="relative flex aspect-square w-full max-w-[112px] items-center justify-center overflow-hidden rounded-[26px] transition-transform duration-300 group-hover:-translate-y-0.5" style={{ background: mix(t.primary, 6, '#EEF1F6') }}>{inner}</span>
      <span className="mt-2.5 line-clamp-1 text-[13.5px] font-semibold" style={{ color: t.ink }}>{label}</span>
    </motion.button>
  );
  return (
    <section className="mx-auto max-w-[1320px] px-4 pt-8 lg:px-8">
      <motion.div variants={nxStagger} initial="hidden" whileInView="show" viewport={nxViewport} className={`-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:grid lg:gap-4 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden ${['', 'lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4', 'lg:grid-cols-5', 'lg:grid-cols-6', 'lg:grid-cols-7'][tiles.length] || 'lg:grid-cols-7'}`}>
        {tiles.map((c) => tile(c.nombre, c.label, () => onPick(c.nombre), c.imagenUrl
          ? <img src={c.imagenUrl} alt="" loading="lazy" className={`h-full w-full transition-transform duration-500 group-hover:scale-[1.06] ${c.isProduct ? 'object-contain p-3 mix-blend-multiply' : 'object-cover'}`} />
          : <Icon icon={categoryIcon(c.nombre)} width={42} style={{ color: t.primaryInk }} />))}
        {tile('__all', editable(diseno?.celularesAllLabel, 'Ver todo'), onAll, <Icon icon="solar:widget-5-bold" width={38} style={{ color: t.ink }} />)}
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════ COMPARA / POR QUÉ ══
/** El comparador es real (botón ⇄ de cada tarjeta + barra de comparación). */
function CompareCard({ t, diseno, onGo }: { t: Theme; diseno: any; onGo: () => void }) {
  return (
    <motion.div variants={nxReveal} initial="hidden" whileInView="show" viewport={nxViewport} className="relative flex min-h-[170px] overflow-hidden rounded-2xl p-6 sm:p-7" style={{ background: t.tiles[0] }}>
      <div className="relative z-10 sm:max-w-[60%]">
        <h3 className="text-[21px] font-extrabold tracking-[-0.02em]" style={{ color: t.ink, fontFamily: t.display }}>{editable(diseno?.celularesCompareTitle, 'Compara equipos')}</h3>
        <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: t.muted }}>{editable(diseno?.celularesCompareText, 'Toca el ícono ⇄ en hasta 4 productos y compáralos lado a lado.')}</p>
        <button type="button" onClick={onGo} className={`${btnCls} mt-5 h-10 whitespace-nowrap px-5`} style={{ background: t.navy, color: '#fff' }}>{editable(diseno?.celularesCompareButton, 'Empezar a comparar')}<Icon icon="solar:arrow-right-linear" width={16} /></button>
      </div>
      <img src={diseno?.celularesCompareImage || CELULARES_IMG.compare} alt="" loading="lazy" className="absolute bottom-0 right-0 hidden h-full w-[44%] object-contain object-right-bottom mix-blend-multiply sm:block" />
    </motion.div>
  );
}

/** "¿Por qué {tienda}?": los puntos son los beneficios REALES de la tienda. */
function WhyCard({ t, diseno, tienda, services }: { t: Theme; diseno: any; tienda: any; services: Service[] }) {
  const points = services.slice(0, 4);
  return (
    <motion.div variants={nxReveal} initial="hidden" whileInView="show" viewport={nxViewport} className="relative flex min-h-[170px] overflow-hidden rounded-2xl p-6 sm:p-7" style={{ background: t.tiles[1] }}>
      <div className="relative z-10 max-w-[62%]">
        <h3 className="text-[21px] font-extrabold tracking-[-0.02em]" style={{ color: t.ink, fontFamily: t.display }}>{editable(diseno?.celularesWhyTitle, `¿Por qué ${storeNameOf(tienda)}?`)}</h3>
        <ul className="mt-3 space-y-1.5">
          {points.map((p) => (
            <li key={p.label} className="flex items-center gap-2 text-[13.5px]" style={{ color: t.ink }}>
              <Icon icon="solar:check-circle-bold" width={18} className="shrink-0 text-emerald-500" />{p.label}<span className="hidden sm:inline" style={{ color: t.muted }}>· {p.sub}</span>
            </li>
          ))}
        </ul>
      </div>
      <div aria-hidden className="absolute bottom-0 right-0 top-0 w-[40%]">
        <img src={diseno?.celularesWhyImage || CELULARES_IMG.why} alt="" loading="lazy" className="h-full w-full object-cover [mask-image:linear-gradient(90deg,transparent,#000_35%)]" />
        <span className="absolute bottom-5 left-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg"><Icon icon="solar:shield-check-bold" width={30} /></span>
      </div>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════ PROMOS ══
/** Dos banners editables. El primero muestra el % solo si hay ofertas REALES. */
function PromoPair({ t, diseno, maxDiscount, ch, goAction, goOffers, navigate, slug }: { t: Theme; diseno: any; maxDiscount: number; ch: Channels; goAction: (k: string) => void; goOffers?: () => void; navigate: (to: string) => void; slug: string }) {
  const d = diseno || {};
  const go = (key: string, fallback: () => void) => (isLinkActionConfigured(d, key) ? goAction(key) : fallback());
  const banners = [
    {
      key: 'celularesPromo1Action',
      bg: `linear-gradient(120deg, ${mix('#E9D5FF', 70, '#fff')} 0%, ${mix('#F5D0FE', 80, '#fff')} 100%)`,
      title: editable(d.celularesPromo1Title, maxDiscount > 0 ? 'Ofertas en tecnología' : 'Accesorios que suman'),
      highlight: maxDiscount > 0 && !isOn(d.celularesPromo1DiscountHidden) ? `Hasta ${maxDiscount}% dscto.` : '',
      text: optional(d.celularesPromo1Text, maxDiscount > 0 ? '' : 'Audífonos, cargadores y fundas para tu equipo.'),
      button: editable(d.celularesPromo1Button, maxDiscount > 0 ? 'Ver ofertas' : 'Ver accesorios'),
      img: d.celularesPromo1Image || CELULARES_IMG.promoA,
      onClick: () => go('celularesPromo1Action', goOffers || (() => navigate(`/tienda/${slug}/catalogo`))),
    },
    {
      key: 'celularesPromo2Action',
      bg: `linear-gradient(120deg, ${mix(t.primary, 12, '#fff')} 0%, ${mix(t.primary, 22, '#fff')} 100%)`,
      title: editable(d.celularesPromo2Title, '¿No sabes cuál elegir?'),
      highlight: '',
      text: optional(d.celularesPromo2Text, ch.hasWhatsapp ? 'Escríbenos y te ayudamos a encontrar el equipo ideal.' : 'Cuéntanos qué buscas y te ayudamos a elegir.'),
      button: editable(d.celularesPromo2Button, ch.hasWhatsapp ? 'Escríbenos' : 'Contáctanos'),
      img: d.celularesPromo2Image || CELULARES_IMG.promoB,
      onClick: () => go('celularesPromo2Action', () => {
        const wa = ch.hasWhatsapp ? ch.wa('Hola, quiero ayuda para elegir un equipo.') : null;
        if (wa) window.open(wa, '_blank', 'noopener,noreferrer'); else navigate(`/tienda/${slug}/contacto`);
      }),
    },
  ];
  return (
    <section className="mx-auto grid max-w-[1320px] gap-4 px-4 pt-10 lg:grid-cols-2 lg:px-8">
      {banners.map((b) => (
        <motion.button key={b.key} type="button" variants={nxReveal} initial="hidden" whileInView="show" viewport={nxViewport} onClick={b.onClick} className="group relative flex min-h-[170px] overflow-hidden rounded-2xl p-6 text-left sm:p-7" style={{ background: b.bg }}>
          <div className="relative z-10 max-w-[58%]">
            <h3 className="text-[22px] font-extrabold leading-tight tracking-[-0.02em]" style={{ color: t.ink, fontFamily: t.display }}>{b.title}</h3>
            {b.highlight && <p className="mt-1 text-[22px] font-extrabold" style={{ color: t.accentInk, fontFamily: t.display }}>{b.highlight}</p>}
            {b.text && <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: mix(t.ink, 75, '#fff') }}>{b.text}</p>}
            <span className={`${btnCls} mt-4 h-10 px-5`} style={{ background: t.navy, color: '#fff' }}>{b.button}<Icon icon="solar:arrow-right-linear" width={16} /></span>
          </div>
          <img src={b.img} alt="" loading="lazy" className="absolute bottom-0 right-0 top-0 h-full w-[44%] object-cover transition-transform duration-700 [mask-image:linear-gradient(90deg,transparent,#000_30%)] group-hover:scale-[1.04]" />
        </motion.button>
      ))}
    </section>
  );
}

// ═════════════════════════════════════════════════════════ BENEFICIOS ══
function Benefits({ t, services }: { t: Theme; services: Service[] }) {
  const shown = services.slice(0, 4);
  if (!shown.length) return null;
  const cols: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };
  return (
    <section className="mx-auto max-w-[1320px] px-4 py-10 lg:px-8">
      <motion.ul variants={nxStagger} initial="hidden" whileInView="show" viewport={nxViewport} className={`grid grid-cols-2 gap-6 ${cols[shown.length] || 'lg:grid-cols-4'}`}>
        {shown.map((s) => (
          <motion.li key={s.label} variants={nxItem} className="flex items-center gap-4 lg:justify-center">
            <Icon icon={s.icon} width={36} className="shrink-0" style={{ color: t.ink }} />
            <span className="leading-tight"><span className="block text-[14px] font-bold" style={{ color: t.ink, fontFamily: t.display }}>{s.label}</span><span className="mt-0.5 block text-[12.5px]" style={{ color: t.muted }}>{s.sub}</span></span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

// ═════════════════════════════════════════════════════ NOVEDADES (WA) ══
/** "Newsletter" honesto: no hay envío de correos, así que se une por WhatsApp con el mensaje listo. Estado aislado. */
function NewsBand({ t, diseno, ch, storeName }: { t: Theme; diseno: any; ch: Channels; storeName: string }) {
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) { setErr('Escribe tu nombre.'); return; }
    setErr('');
    const url = ch.wa(`Hola, soy ${name.trim()} y quiero recibir las ofertas y lanzamientos de ${storeName}.`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <section className="mx-auto max-w-[1320px] px-4 pb-10 lg:px-8">
      <motion.div variants={nxReveal} initial="hidden" whileInView="show" viewport={nxViewport} className="flex flex-col gap-5 rounded-2xl p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between" style={{ background: mix(t.primary, 6, '#EEF1F6') }}>
        <div className="flex items-center gap-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ background: t.primary, color: t.onPrimary }}><Icon icon="solar:letter-linear" width={26} /></span>
          <div>
            <h2 className="text-[22px] font-extrabold tracking-[-0.02em]" style={{ color: t.ink, fontFamily: t.display }}>{editable(diseno?.celularesNewsTitle, 'Mantente al día')}</h2>
            <p className="mt-0.5 text-[13.5px]" style={{ color: t.muted }}>{editable(diseno?.celularesNewsText, 'Recibe por WhatsApp las ofertas, lanzamientos y novedades.')}</p>
          </div>
        </div>
        <form onSubmit={submit} noValidate className="w-full lg:max-w-[440px]">
          <div className="flex h-12 overflow-hidden rounded-full bg-white" style={{ boxShadow: `inset 0 0 0 1px ${err ? '#F43F5E' : t.line}` }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={editable(diseno?.celularesNewsPlaceholder, 'Tu nombre')} aria-label="Tu nombre" className="min-w-0 flex-1 appearance-none border-0 bg-transparent bg-none px-5 text-[14px] outline-none placeholder:text-slate-400 focus:ring-0" style={{ color: t.ink }} />
            <button type="submit" className={`${btnCls} m-1 shrink-0 px-6`} style={{ background: t.primary, color: t.onPrimary }}><Icon icon="ic:baseline-whatsapp" width={17} />{editable(diseno?.celularesNewsButton, 'Suscribirme')}</button>
          </div>
          {err && <p className="mt-1.5 pl-4 text-[12px] text-rose-500">{err}</p>}
        </form>
      </motion.div>
    </section>
  );
}
