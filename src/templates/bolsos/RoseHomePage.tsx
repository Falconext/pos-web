import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { buildCategoryTiles } from '@/templates/shared/categoryTiles';
import { getProductPricing } from '@/templates/shared/pricing';
import { resolveHeroIntervalMs, usePreloadImages } from '@/templates/shared/heroSlider';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import {
  RoseHeader, RoseFooter, RoseCartModal, RoseProductCard, buildServices,
  roseTheme, useRoseFont, editable, optional, isOn, btnCls, storeNameOf, type Theme, type Service,
} from './RoseParts';
import {
  SectionHeader, ProductGrid, GridSkeleton, OfferCountdown, storeChannels, getName, hasImage,
  categoryIcon, soonestOfferEnd, instagramHandle, type OpenFn, type AddFn, type Channels,
} from './RoseSections';
import { mix, rsEase, rsHeroText, rsItem, rsReveal, rsStagger, rsViewport } from './motion';

const u = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Fotos de ejemplo (reemplazables en Personalizar). Sin logos de marcas de terceros. */
export const BOLSOS_IMG = {
  hero: [u('1566150905458-1bf1fc113f0d', 1900), u('1575032617751-6ddec2089882', 1900), u('1606522754091-a3bbf9ad4cb3', 1900)],
  banners: [u('1600857062241-98e5dba7f214', 900), u('1614179689702-355944cd0918', 900), u('1622560480605-d83c853bc5c3', 900)],
  gallery: [u('1512201078372-9c6b2a0d528a', 600), u('1612902456551-333ac5afa26e', 600), u('1628149455678-16f37bc392f4', 600), u('1483985988355-763728e1935b', 600), u('1590874103328-eac38a683ce7', 600), u('1591561954557-26941169b49e', 600)],
  catalog: u('1606522754091-a3bbf9ad4cb3', 1400),
};

// ═════════════════════════════════════════════════════════════════ PAGE ══
export default function RoseHomePage(props: TemplateHomePageProps) {
  const { tienda, slug, productos, allCategories, diseno, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, agregarAlCarrito, actualizarCantidad, loading } = props as any;
  useRoseFont();
  const navigate = useNavigate();
  const t = roseTheme(diseno);
  const [showFav, setShowFav] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);

  const list: any[] = useMemo(() => (Array.isArray(productos) ? productos : []), [productos]);
  const withImg = useMemo(() => list.filter(hasImage), [list]);
  const categories: string[] = useMemo(() => (allCategories || []).map(getName).filter(Boolean), [allCategories]);
  const featured = useMemo(() => {
    const pool = [...withImg, ...list.filter((p) => !hasImage(p))];
    return [...pool.filter((p) => p?.destacado), ...pool.filter((p) => !p?.destacado)].slice(0, 12);
  }, [list, withImg]);
  const offers = useMemo(() => list.filter((p) => getProductPricing(p).enOferta), [list]);
  const maxDiscount = useMemo(() => offers.reduce((m, p) => Math.max(m, Number(getProductPricing(p).porcentajeDescuento) || 0), 0), [offers]);
  const offerEnd = useMemo(() => soonestOfferEnd(offers), [offers]);
  const circles = useMemo(() => buildCategoryTiles({ allCategories, diseno, prefix: 'bolsos', count: 7, fallbackImages: [] }).map((tile) => {
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

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, fontFamily: t.font }}>
        <RoseHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={navigate} active="home" />

        <HeroSlider t={t} diseno={diseno} services={services} maxDiscount={maxDiscount} goAction={goAction} />

        {circles.length > 0 && (
          <section className="mx-auto max-w-[1320px] px-4 pt-14 lg:px-8">
            <SectionHeader t={t} title={editable(diseno?.bolsosCategoriesTitle, 'Comprar por categoría')} onMore={goCatalog} moreLabel={editable(diseno?.bolsosCategoriesMore, 'Ver todas')} />
            <CategoryCircles t={t} circles={circles} onPick={goCategory} />
          </section>
        )}

        <section className="mx-auto max-w-[1320px] px-4 pb-4 pt-12 lg:px-8">
          <SectionHeader t={t} title={editable(diseno?.bolsosFeaturedTitle, 'Productos destacados')} onMore={goCatalog} moreLabel={editable(diseno?.bolsosFeaturedMore, 'Ver todos')} />
          {loading && !list.length ? <GridSkeleton t={t} count={6} cols="lg:grid-cols-4 xl:grid-cols-6" />
            : featured.length ? <ProductGrid t={t} products={featured} slug={slug} onOpen={goProduct} onAdd={add} cols="lg:grid-cols-4 xl:grid-cols-6" />
            : <p className="rounded-md border border-dashed px-6 py-12 text-center text-[13px]" style={{ borderColor: t.line, color: t.muted }}>Pronto verás aquí nuestras carteras.</p>}
        </section>

        <PromoBanners t={t} diseno={diseno} maxDiscount={maxDiscount} goAction={goAction} />

        {offers.length > 0 && <OffersBand t={t} diseno={diseno} offers={offers} maxDiscount={maxDiscount} offerEnd={offerEnd} slug={slug} onOpen={goProduct} onAdd={add} onMore={goCatalog} />}

        {!isOn(diseno?.bolsosBenefitsHidden) && <BenefitsStrip t={t} services={services} />}
        <Lookbook t={t} diseno={diseno} tienda={tienda} />
        {!isOn(diseno?.bolsosClubHidden) && ch.hasWhatsapp && <ClubBand t={t} diseno={diseno} ch={ch} storeName={storeNameOf(tienda)} />}

        <RoseFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <RoseCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } })} t={t} tienda={tienda} diseno={diseno} />
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
    { image: d.bolsosHeroImage || BOLSOS_IMG.hero[0], onlyImage: isOn(d.bolsosHeroOnlyImage), eyebrow: optional(d.bolsosHeroEyebrow, 'Lleva tu confianza'), title: editable(d.bolsosHeroTitle, 'Carteras únicas'), highlight: optional(d.bolsosHeroHighlight, 'para cada día'), subtitle: optional(d.bolsosHeroSubtitle, 'Descubre nuestra colección de carteras pensadas para acompañarte y elevar tu estilo.'), button: editable(d.bolsosHeroButton, 'Comprar ahora'), action: 'bolsosHeroAction' },
    { image: d.bolsosSlide2Image || BOLSOS_IMG.hero[1], onlyImage: isOn(d.bolsosSlide2OnlyImage), eyebrow: optional(d.bolsosSlide2Eyebrow, 'Nueva temporada'), title: editable(d.bolsosSlide2Title, 'Elegancia'), highlight: optional(d.bolsosSlide2Highlight, 'que se nota'), subtitle: optional(d.bolsosSlide2Subtitle, 'Modelos de mano, bandolera y hombro para cada ocasión.'), button: editable(d.bolsosSlide2Button, 'Descubrir'), action: 'bolsosSlide2Action' },
    { image: d.bolsosSlide3Image || BOLSOS_IMG.hero[2], onlyImage: isOn(d.bolsosSlide3OnlyImage), eyebrow: optional(d.bolsosSlide3Eyebrow, 'Detalles que enamoran'), title: editable(d.bolsosSlide3Title, 'Tu look'), highlight: optional(d.bolsosSlide3Highlight, 'empieza aquí'), subtitle: optional(d.bolsosSlide3Subtitle, 'Mochilas, billeteras y accesorios que combinan contigo.'), button: editable(d.bolsosSlide3Button, 'Ver colección'), action: 'bolsosSlide3Action' },
  ];
}

/** Slider del hero. Aislado: su intervalo solo re-renderiza este componente. */
function HeroSlider({ t, diseno, services, maxDiscount, goAction }: { t: Theme; diseno: any; services: Service[]; maxDiscount: number; goAction: (k: string) => void }) {
  const slides = useMemo(() => slidesFrom(diseno), [diseno]);
  const interval = resolveHeroIntervalMs(diseno, 'bolsosHeroInterval', 6500);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  usePreloadImages(slides.map((s) => s.image));
  useEffect(() => {
    if (!interval || paused) return;
    const id = window.setTimeout(() => setIdx((v) => (v + 1) % slides.length), interval);
    return () => window.clearTimeout(id);
  }, [idx, interval, paused, slides.length]);
  const s = slides[idx];
  const button2 = optional(diseno?.bolsosHeroButton2, 'Ver colección');
  const showBadge = maxDiscount > 0 && !isOn(diseno?.bolsosHeroBadgeHidden) && !s.onlyImage;
  // Fila de valores: 2 editables de la marca + beneficios reales de la tienda.
  const values: Service[] = [
    { icon: 'ph:seal-check-light', label: editable(diseno?.bolsosValue1Title, 'Calidad premium'), sub: editable(diseno?.bolsosValue1Text, 'Acabados que se notan') },
    { icon: 'ph:diamond-light', label: editable(diseno?.bolsosValue2Title, 'Diseños en tendencia'), sub: editable(diseno?.bolsosValue2Text, 'Para cada ocasión') },
    ...services.filter((sv) => sv.label === 'Compra segura' || sv.label === 'Te asesoramos' || sv.label === 'Seguimiento').slice(0, 2),
  ];
  const step = (d: number) => setIdx((v) => (v + d + slides.length) % slides.length);

  return (
    <section className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carrusel">
      <div className="relative overflow-hidden" style={{ background: t.blush }}>
        <div className="relative mx-auto min-h-[520px] max-w-[1600px] lg:min-h-[560px]">
          {/* Fotos apiladas (crossfade sin hueco). Con textos, la foto se funde con el rubor por máscara. */}
          <div aria-hidden className={s.onlyImage ? 'absolute inset-0' : 'absolute inset-x-0 top-0 h-[300px] [mask-image:linear-gradient(180deg,#000_60%,transparent)] lg:inset-y-0 lg:left-auto lg:h-full lg:w-[66%] lg:[mask-image:linear-gradient(90deg,transparent,#000_28%)]'}>
            {slides.map((sl, i) => (
              <motion.img key={sl.action} src={sl.image} alt="" initial={false} animate={{ opacity: i === idx ? 1 : 0, scale: i === idx ? 1 : 1.04 }} transition={{ duration: 1.2, ease: rsEase }} className="absolute inset-0 h-full w-full object-cover object-center" loading={i === 0 ? 'eager' : 'lazy'} />
            ))}
          </div>

          {s.onlyImage ? (
            <button type="button" aria-label={s.title} onClick={() => goAction(s.action)} className="absolute inset-0 z-[1]" />
          ) : (
            <div className="relative z-[2] mx-auto flex max-w-[1320px] px-4 pb-32 pt-[280px] lg:min-h-[560px] lg:items-center lg:px-8 lg:pb-28 lg:pt-10">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={idx} variants={rsStagger} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.2 } }} className="max-w-[660px]">
                  {s.eyebrow && (
                    <motion.p variants={rsHeroText} className="flex items-center gap-3 text-[25px] leading-none sm:text-[28px]" style={{ color: t.accentInk, fontFamily: t.script }}>
                      {s.eyebrow}
                      <span aria-hidden className="flex items-center gap-1.5" style={{ color: mix(t.accent, 60, '#fff') }}><span className="h-px w-14" style={{ background: 'currentColor' }} /><Icon icon="ph:heart-light" width={14} /></span>
                    </motion.p>
                  )}
                  <motion.h1 variants={rsHeroText} className="mt-4 text-[40px] font-semibold uppercase leading-[0.98] tracking-[0.005em] sm:text-[54px] lg:text-[62px]" style={{ color: t.ink, fontFamily: t.serif }}>
                    {s.title}{s.highlight && <><br /><span style={{ color: t.accentInk }}>{s.highlight}</span></>}
                  </motion.h1>
                  {s.subtitle && <motion.p variants={rsHeroText} className="mt-5 max-w-[400px] text-[15px] leading-relaxed" style={{ color: mix(t.ink, 78, t.bg) }}>{s.subtitle}</motion.p>}
                  <motion.div variants={rsHeroText} className="mt-8 flex flex-wrap gap-3">
                    <button type="button" onClick={() => goAction(s.action)} className={`${btnCls} group h-12 px-6 shadow-[0_14px_30px_-18px_rgba(107,29,56,0.7)]`} style={{ background: t.primary, color: t.onPrimary }}>
                      {s.button}<Icon icon="solar:arrow-right-linear" width={17} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                    </button>
                    {button2 && idx === 0 && (
                      <button type="button" onClick={() => goAction('bolsosHeroAction2')} className={`${btnCls} h-12 bg-white/70 px-6 backdrop-blur hover:bg-white`} style={{ boxShadow: `inset 0 0 0 1px ${t.ink}`, color: t.ink }}>
                        {button2}
                      </button>
                    )}
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          <AnimatePresence>
            {showBadge && (
              <motion.div key="badge" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.6, ease: rsEase }} className="absolute right-4 top-[150px] z-[3] flex h-[104px] w-[104px] sm:right-6 sm:h-[118px] sm:w-[118px] flex-col items-center justify-center rounded-full bg-white/95 text-center shadow-[0_24px_50px_-26px_rgba(31,26,28,0.45)] backdrop-blur lg:right-[6%] lg:top-1/2 lg:h-[150px] lg:w-[150px] lg:-mt-16">
                <span className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: t.ink }}>Hasta</span>
                <span className="text-[34px] font-bold leading-none sm:text-[40px] lg:text-[50px]" style={{ color: t.accentInk, fontFamily: t.serif }}>{maxDiscount}%</span>
                <span className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: t.ink }}>Dscto.</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Fila de valores + controles del slider */}
        <div className="absolute inset-x-0 bottom-0 z-[3]">
          <div className="mx-auto flex max-w-[1320px] items-end justify-between gap-6 px-4 pb-6 lg:px-8">
            {!isOn(diseno?.bolsosValuesHidden) ? (
              <ul className="hidden items-center rounded-md bg-white/80 px-5 py-3 shadow-[0_18px_40px_-30px_rgba(31,26,28,0.5)] backdrop-blur-md md:flex">
                {values.map((v, i) => (
                  <li key={`${v.label}-${i}`} className={`flex items-center gap-3 pr-5 ${i > 0 ? 'border-l pl-5' : ''} ${i > 2 ? 'hidden xl:flex' : ''}`} style={{ borderColor: t.line }}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white" style={{ borderColor: mix(t.accent, 30, '#fff'), color: t.accentInk }}><Icon icon={v.icon} width={22} /></span>
                    <span className="leading-tight"><span className="block text-[12px] font-semibold" style={{ color: t.ink }}>{v.label}</span><span className="block text-[11.5px]" style={{ color: t.muted }}>{v.sub}</span></span>
                  </li>
                ))}
              </ul>
            ) : <span />}
            <div className="flex items-center gap-3">
              <button type="button" aria-label="Banner anterior" onClick={() => step(-1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur transition-colors hover:bg-white" style={{ color: t.ink }}><Icon icon="solar:arrow-left-linear" width={16} /></button>
              <div className="flex gap-2">
                {slides.map((sl, i) => (
                  <button key={sl.action} type="button" aria-label={`Ir al banner ${i + 1}`} aria-current={i === idx} onClick={() => setIdx(i)} className="flex h-5 w-5 items-center justify-center">
                    <span className="h-2 w-2 rounded-full transition-all duration-500" style={{ background: i === idx ? t.primary : 'transparent', boxShadow: `0 0 0 1.5px ${i === idx ? t.primary : mix(t.ink, 35, '#fff')}`, transform: i === idx ? 'scale(1.25)' : 'scale(1)' }} />
                  </button>
                ))}
              </div>
              <button type="button" aria-label="Banner siguiente" onClick={() => step(1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur transition-colors hover:bg-white" style={{ color: t.ink }}><Icon icon="solar:arrow-right-linear" width={16} /></button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════ CATEGORÍAS ══
function CategoryCircles({ t, circles, onPick }: { t: Theme; circles: { nombre: string; label: string; imagenUrl: string; isProduct: boolean }[]; onPick: (c: string) => void }) {
  const cols: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6', 7: 'lg:grid-cols-7' };
  return (
    <motion.div variants={rsStagger} initial="hidden" whileInView="show" viewport={rsViewport} className={`-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:grid lg:gap-6 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden ${cols[circles.length] || 'lg:grid-cols-7'}`}>
      {circles.map((c) => (
        <motion.button key={c.nombre} type="button" variants={rsItem} onClick={() => onPick(c.nombre)} className="group flex w-[30%] shrink-0 flex-col items-center text-center sm:w-[22%] lg:w-auto">
          <span className="relative flex aspect-square w-full max-w-[150px] items-center justify-center overflow-hidden rounded-full transition-shadow duration-500 group-hover:shadow-[0_18px_40px_-24px_rgba(107,29,56,0.55)]" style={{ background: t.blushDeep }}>
            {c.imagenUrl
              ? <img src={c.imagenUrl} alt="" loading="lazy" className={`h-full w-full transition-transform duration-700 group-hover:scale-[1.08] ${c.isProduct ? 'object-cover mix-blend-multiply' : 'object-cover'}`} />
              : <Icon icon={categoryIcon(c.nombre)} width={52} style={{ color: mix(t.ink, 60, '#fff') }} />}
          </span>
          <span className="mt-3.5 line-clamp-1 text-[11.5px] font-semibold uppercase tracking-[0.1em] transition-colors" style={{ color: t.ink }}>{c.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════ BANNERS PROMO ══
/** Tres banners editables. El tercero, por defecto, muestra el descuento REAL máximo si hay ofertas. */
function PromoBanners({ t, diseno, maxDiscount, goAction }: { t: Theme; diseno: any; maxDiscount: number; goAction: (k: string) => void }) {
  if (isOn(diseno?.bolsosBannersHidden)) return null;
  const defaults = [
    { eyebrow: 'Novedades', title: 'Estilos frescos\npara ti', sub: '' },
    { eyebrow: 'Colección', title: 'Clásicos que\nnunca fallan', sub: 'Para el día a día' },
    maxDiscount > 0 ? { eyebrow: 'Ofertas', title: `Hasta ${maxDiscount}%\nde descuento`, sub: 'En productos seleccionados' } : { eyebrow: 'Accesorios', title: 'Completa\ntu look', sub: '' },
  ];
  const tints = [t.blushDeep, mix(t.ink, 5, '#F7F2EE'), mix(t.primary, 7, '#F6EEE8')];
  const banners = defaults.map((d, i) => {
    const n = i + 1;
    return {
      key: `bolsosBanner${n}Action`,
      img: diseno?.[`bolsosBanner${n}Image`] || BOLSOS_IMG.banners[i],
      eyebrow: optional(diseno?.[`bolsosBanner${n}Eyebrow`], d.eyebrow),
      title: editable(diseno?.[`bolsosBanner${n}Title`], d.title),
      sub: optional(diseno?.[`bolsosBanner${n}Text`], d.sub),
      button: optional(diseno?.[`bolsosBanner${n}Button`], 'Comprar'),
      bg: tints[i],
    };
  });
  return (
    <section className="mx-auto max-w-[1320px] px-4 py-10 lg:px-8">
      <motion.div variants={rsStagger} initial="hidden" whileInView="show" viewport={rsViewport} className="grid gap-4 md:grid-cols-3">
        {banners.map((b) => (
          <motion.button key={b.key} type="button" variants={rsItem} onClick={() => goAction(b.key)} className="group relative flex min-h-[200px] overflow-hidden rounded-md text-left lg:min-h-[220px]" style={{ background: b.bg }}>
            <div aria-hidden className="absolute inset-y-0 right-0 w-[58%] [mask-image:linear-gradient(90deg,transparent,#000_34%)]">
              <img src={b.img} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.05]" />
            </div>
            <div className="relative z-10 flex max-w-[62%] flex-col justify-center p-6 lg:p-7">
              {b.eyebrow && <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em]" style={{ color: t.ink }}>{b.eyebrow}</p>}
              <h3 className="mt-2 whitespace-pre-line text-[26px] font-semibold leading-[1.02] lg:text-[30px]" style={{ color: t.ink, fontFamily: t.serif }}>{b.title}</h3>
              {b.sub && <p className="mt-2 text-[12px]" style={{ color: t.muted }}>{b.sub}</p>}
              {b.button && (
                <span className="mt-5 inline-flex h-9 w-max items-center gap-2 rounded-[4px] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.1em] shadow-sm transition-colors duration-300 text-[color:var(--rs-c)] group-hover:bg-[var(--rs-p)] group-hover:text-[color:var(--rs-op)]" style={{ ['--rs-c' as any]: t.primaryInk, ['--rs-p' as any]: t.primary, ['--rs-op' as any]: t.onPrimary }}>
                  {b.button}<Icon icon="solar:arrow-right-linear" width={15} />
                </span>
              )}
            </div>
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ OFERTAS ══
/**
 * Panel de ofertas REALES: descuento máximo calculado de tus precios y reloj solo si alguna
 * oferta tiene fecha de fin. A la derecha, las tarjetas en carrusel (estado de scroll aislado).
 */
function OffersBand({ t, diseno, offers, maxDiscount, offerEnd, slug, onOpen, onAdd, onMore }: { t: Theme; diseno: any; offers: any[]; maxDiscount: number; offerEnd: number | null; slug: string; onOpen: OpenFn; onAdd: AddFn; onMore: () => void }) {
  const shown = offers.slice(0, 10);
  return (
    <section className="mx-auto max-w-[1320px] px-4 py-10 lg:px-8">
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <motion.div variants={rsReveal} initial="hidden" whileInView="show" viewport={rsViewport} className="relative flex flex-col overflow-hidden rounded-md p-7" style={{ background: t.primary, color: t.onPrimary }}>
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full" style={{ background: mix(t.onPrimary, 8, 'transparent') }} />
          <p className="relative text-[28px] leading-none" style={{ fontFamily: t.script }}>{editable(diseno?.bolsosOffersTitle, 'Ofertas especiales')}</p>
          {maxDiscount > 0 && (
            <p className="relative mt-5 leading-none">
              <span className="block text-[12px] font-semibold uppercase tracking-[0.16em] opacity-80">Hasta</span>
              <span className="block text-[72px] font-semibold" style={{ fontFamily: t.serif }}>{maxDiscount}%</span>
              <span className="block text-[12px] font-semibold uppercase tracking-[0.16em] opacity-80">de descuento</span>
            </p>
          )}
          <p className="relative mt-4 text-[12.5px] opacity-80">{offers.length} {offers.length === 1 ? 'producto en oferta' : 'productos en oferta'}</p>
          {offerEnd && (
            <div className="relative mt-5">
              <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] opacity-80">Termina en</p>
              <OfferCountdown t={t} endsAt={offerEnd} light />
            </div>
          )}
          <button type="button" onClick={onMore} className={`${btnCls} relative mt-auto h-11 w-max bg-white px-5`} style={{ color: t.ink }}>
            Ver todo <Icon icon="solar:arrow-right-linear" width={16} />
          </button>
        </motion.div>
        <OffersRail t={t} products={shown} slug={slug} onOpen={onOpen} onAdd={onAdd} />
      </div>
    </section>
  );
}

function OffersRail({ t, products, slug, onOpen, onAdd }: { t: Theme; products: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const update = () => { const el = ref.current; if (el) setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 }); };
  useEffect(() => { update(); }, [products.length]);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  return (
    <div className="relative min-w-0">
      {[{ d: -1, icon: 'solar:alt-arrow-left-linear', off: edge.start, pos: 'left-2', label: 'Anterior' }, { d: 1, icon: 'solar:alt-arrow-right-linear', off: edge.end, pos: 'right-2', label: 'Siguiente' }].map((b) => (
        <button key={b.d} type="button" aria-label={b.label} disabled={b.off} onClick={() => scroll(b.d)} className={`absolute top-[36%] z-10 hidden h-10 w-10 items-center justify-center rounded-full border bg-white shadow-[0_10px_24px_-14px_rgba(31,26,28,0.5)] transition-opacity disabled:pointer-events-none disabled:opacity-0 lg:flex ${b.pos}`} style={{ color: t.ink, borderColor: t.line }}>
          <Icon icon={b.icon} width={17} />
        </button>
      ))}
      <motion.div ref={ref} onScroll={update} variants={rsStagger} initial="hidden" whileInView="show" viewport={rsViewport} className="-mx-4 flex h-full snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 [scrollbar-width:none] sm:gap-4 lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
        {products.map((p, i) => (
          <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={rsItem} className="w-[62%] shrink-0 snap-start sm:w-[36%] md:w-[29%] lg:w-[calc((100%-3rem)/4)]">
            <RoseProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════ BENEFICIOS ══
function BenefitsStrip({ t, services }: { t: Theme; services: Service[] }) {
  if (!services.length) return null;
  const cols: Record<number, string> = { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5' };
  return (
    <section className="mx-auto max-w-[1320px] px-4 py-6 lg:px-8">
      <motion.ul variants={rsStagger} initial="hidden" whileInView="show" viewport={rsViewport} className={`grid grid-cols-2 gap-y-6 border-y py-7 sm:grid-cols-3 ${cols[services.length] || 'lg:grid-cols-5'}`} style={{ borderColor: t.line }}>
        {services.map((s) => (
          <motion.li key={s.label} variants={rsItem} className="flex items-center gap-3 px-2 lg:justify-center">
            <Icon icon={s.icon} width={30} className="shrink-0" style={{ color: t.accentInk }} />
            <span className="leading-tight"><span className="block text-[11.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: t.ink }}>{s.label}</span><span className="mt-0.5 block text-[11.5px]" style={{ color: t.muted }}>{s.sub}</span></span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

// ═════════════════════════════════════════════════════════ LOOKBOOK ══
/**
 * Galería editable. Si la tienda tiene Instagram real, el título muestra @usuario y las fotos enlazan allí;
 * si no, es solo inspiración (sin enlaces a ningún sitio).
 */
function Lookbook({ t, diseno, tienda }: { t: Theme; diseno: any; tienda: any }) {
  if (isOn(diseno?.bolsosGalleryHidden)) return null;
  const igUrl = String(tienda?.instagramUrl || '').trim();
  const handle = instagramHandle(igUrl);
  const photos = BOLSOS_IMG.gallery.map((fallback, i) => diseno?.[`bolsosGallery${i + 1}Image`] || fallback);
  const title = editable(diseno?.bolsosGalleryTitle, handle ? `Síguenos @${handle}` : igUrl ? 'Síguenos en Instagram' : 'Inspírate');
  const sub = optional(diseno?.bolsosGalleryText, igUrl ? 'Etiquétanos en tus fotos para aparecer aquí.' : 'Ideas para lucir tus carteras en cada ocasión.');
  return (
    <section className="mx-auto grid max-w-[1320px] items-center gap-6 px-4 py-10 lg:grid-cols-[260px_1fr] lg:px-8">
      <motion.div variants={rsReveal} initial="hidden" whileInView="show" viewport={rsViewport}>
        <h2 className="text-[19px] font-semibold uppercase tracking-[0.06em]" style={{ color: t.ink }}>{title}</h2>
        {sub && <p className="mt-2 text-[13px]" style={{ color: t.muted }}>{sub}</p>}
        {igUrl && <a href={igUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: t.accentInk }}><Icon icon="mdi:instagram" width={18} /> Ver perfil</a>}
      </motion.div>
      <motion.div variants={rsStagger} initial="hidden" whileInView="show" viewport={rsViewport} className="grid grid-cols-3 gap-2.5 sm:grid-cols-6 sm:gap-3">
        {photos.map((src, i) => {
          const img = <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.07]" />;
          return igUrl ? (
            <motion.a key={i} variants={rsItem} href={igUrl} target="_blank" rel="noopener noreferrer" aria-label="Ver en Instagram" className="group relative aspect-square overflow-hidden rounded-md">
              {img}
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-all duration-300 group-hover:bg-black/25 group-hover:opacity-100"><Icon icon="mdi:instagram" width={26} /></span>
            </motion.a>
          ) : (
            <motion.div key={i} variants={rsItem} className="group relative aspect-square overflow-hidden rounded-md">{img}</motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════ COMUNIDAD (WA) ══
/** "Newsletter" honesto: no hay envío de correos, así que se une por WhatsApp con el mensaje listo. Estado aislado. */
function ClubBand({ t, diseno, ch, storeName }: { t: Theme; diseno: any; ch: Channels; storeName: string }) {
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) { setErr('Escribe tu nombre.'); return; }
    setErr('');
    const url = ch.wa(`Hola, soy ${name.trim()} y quiero unirme a la comunidad de ${storeName} para recibir novedades y ofertas.`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <section className="mt-6" style={{ background: t.blush }}>
      <motion.div variants={rsReveal} initial="hidden" whileInView="show" viewport={rsViewport} className="mx-auto grid max-w-[1320px] items-center gap-6 px-4 py-10 lg:grid-cols-[1fr_1.1fr] lg:px-8">
        <div className="flex items-start gap-5">
          <Icon icon="ph:envelope-simple-light" width={48} className="shrink-0" style={{ color: t.accentInk }} />
          <div>
            <h2 className="text-[17px] font-semibold uppercase tracking-[0.08em]" style={{ color: t.ink }}>{editable(diseno?.bolsosClubTitle, 'Únete a nuestra comunidad')}</h2>
            <p className="mt-1.5 max-w-md text-[13px] leading-relaxed" style={{ color: t.muted }}>{editable(diseno?.bolsosClubText, 'Recibe por WhatsApp las novedades, lanzamientos y ofertas antes que nadie.')}</p>
          </div>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="flex h-[52px] overflow-hidden rounded-[4px] bg-white" style={{ boxShadow: `inset 0 0 0 1px ${err ? '#F43F5E' : mix(t.accent, 25, '#fff')}` }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={editable(diseno?.bolsosClubPlaceholder, 'Tu nombre')} aria-label="Tu nombre" aria-invalid={Boolean(err)} className="min-w-0 flex-1 appearance-none border-0 bg-transparent bg-none px-5 text-[14px] outline-none placeholder:text-stone-400 focus:ring-0" style={{ color: t.ink }} />
            <button type="submit" className={`${btnCls} h-full shrink-0 rounded-none px-5 sm:px-8`} style={{ background: t.primary, color: t.onPrimary }}>
              <Icon icon="ic:baseline-whatsapp" width={18} /> <span className="hidden sm:inline">{editable(diseno?.bolsosClubButton, 'Unirme')}</span>
            </button>
          </div>
          {err && <p className="mt-1.5 text-[12px] text-rose-500">{err}</p>}
        </form>
      </motion.div>
    </section>
  );
}
