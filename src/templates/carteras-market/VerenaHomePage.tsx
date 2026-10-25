import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { getProductPricing } from '@/templates/shared/pricing';
import { buildCategoryTiles } from '@/templates/shared/categoryTiles';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import {
  VerenaHeader, VerenaFooter, VerenaCartModal, Stars,
  verenaTheme, useVerenaFont, ed, optional, isOn, VR, type Theme,
} from './VerenaParts';
import {
  CenteredTitle, SectionHeader, ProductGrid, GridSkeleton, OfferCountdown,
  buildBenefits, soonestOfferEnd, storeChannels, getName, hasImage,
  type OpenFn, type AddFn, type Benefit,
} from './VerenaSections';
import { mix, vrEase, vrHeroText, vrItem, vrReveal, vrStagger, vrViewport } from './motion';

const u = (id: string, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Fotos de ejemplo (sin logos de marcas). El dueño las reemplaza en Personalizar. */
export const VR_IMG = {
  slide1: u('1606522754091-a3bbf9ad4cb3'),
  slide2: u('1594223274512-ad4803739b7c'),
  slide3: u('1566150905458-1bf1fc113f0d'),
  contact: u('1483985988355-763728e1935b', 1400),
};

/** Ancho de tile = 1/N de la fila descontando los gaps de 0.75rem (2 → 3 → 4 → 7 por fila). */
const TILE_W = 'w-[calc((100%-0.75rem)/2)] sm:w-[calc((100%-1.5rem)/3)] md:w-[calc((100%-2.25rem)/4)] lg:w-[calc((100%-4.5rem)/7)]';
const BENEFIT_COLS: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };

// ═════════════════════════════════════════════════════════════════ PAGE ══
export default function VerenaHomePage(props: TemplateHomePageProps) {
  const { tienda, slug, productos, allCategories, diseno, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, agregarAlCarrito, actualizarCantidad, loading } = props;
  useVerenaFont();
  const navigate = useNavigate();
  const t = verenaTheme(diseno);
  const [showFav, setShowFav] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);

  const list: any[] = useMemo(() => (Array.isArray(productos) ? productos : []), [productos]);
  const categories: string[] = useMemo(() => (allCategories || []).map(getName).filter(Boolean), [allCategories]);
  // Destacados primero, luego los que tienen foto: así la grilla luce completa con datos reales.
  const featured = useMemo(() => {
    const score = (p: any) => (p?.destacado ? 2 : 0) + (hasImage(p) ? 1 : 0);
    return [...list].sort((a, b) => score(b) - score(a)).slice(0, 10);
  }, [list]);
  const offers = useMemo(() => list.filter((p) => getProductPricing(p).enOferta), [list]);
  const offerEndsAt = useMemo(() => soonestOfferEnd(offers), [offers]);
  const ch = storeChannels(tienda, diseno);
  const benefits = useMemo(() => buildBenefits(tienda, diseno, ch.hasWhatsapp), [tienda, diseno, ch.hasWhatsapp]);
  const showOffersTile = offers.length > 0 && !isOn(diseno, 'OffersHidden');

  const tiles = useMemo(() => {
    const base = buildCategoryTiles({ allCategories, diseno, prefix: VR, count: showOffersTile ? 6 : 7, fallbackImages: [] });
    return base.map((tile) => {
      if (tile.imagenUrl) return { ...tile, img: tile.imagenUrl, fromProduct: false };
      const p = list.find((x) => hasImage(x) && getName(x?.categoria) === tile.nombre);
      return { ...tile, img: p?.imagenUrl || '', fromProduct: Boolean(p) };
    });
  }, [allCategories, diseno, list, showOffersTile]);

  const cartCount = (carrito || []).reduce((s: number, i: any) => s + Number(i?.cantidad || 1), 0);
  const goCatalog = () => navigate(`/tienda/${slug}/catalogo`);
  const goProduct: OpenFn = (p) => navigate(`/tienda/${slug}/producto/${p.id}`);
  const add: AddFn = (p, qty = 1) => agregarAlCarrito({ ...p, __cantidad: qty });
  const goAction = (key: string) => runStoreLinkAction(getStoreLinkAction(diseno, `${VR}${key}`, { defaultType: 'catalog' }), { slug, navigate });
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, fontFamily: t.font }}>
        <VerenaHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} onSearch={(v) => navigate(`/tienda/${slug}/catalogo${v ? `?search=${encodeURIComponent(v)}` : ''}`)} navigate={navigate} active="home" />

        <HeroSlider t={t} diseno={diseno} list={list} benefits={benefits.filter((b) => b.key !== 'quality')} onAction={goAction} onSecondary={() => scrollTo('vr-categorias')} onCatalog={goCatalog} />

        {tiles.length > 0 && (
          <section id="vr-categorias" className="mx-auto max-w-7xl scroll-mt-6 px-4 pt-16 lg:px-6">
            <CenteredTitle t={t} title={ed(diseno, 'CategoriesTitle', 'Compra por categoría')} />
            {/* Tiles de ancho fijo (1/7 en desktop) y centrados: con pocas categorías no se estiran. */}
            <motion.div variants={vrStagger} initial="hidden" whileInView="show" viewport={vrViewport} className="flex flex-wrap justify-center gap-3">
              {tiles.map((tile) => (
                <div key={tile.nombre} className={TILE_W}>
                  <CategoryTile t={t} label={tile.label} img={tile.img} fromProduct={tile.fromProduct} cta={ed(diseno, 'CategoriesCta', 'Comprar')} onClick={() => navigate(`/tienda/${slug}/catalogo?category=${encodeURIComponent(tile.nombre)}`)} />
                </div>
              ))}
              {showOffersTile && <div className={TILE_W}><OffersTile t={t} label={ed(diseno, 'OffersTileTitle', 'Ofertas')} count={offers.length} onClick={() => scrollTo('vr-ofertas')} /></div>}
            </motion.div>
          </section>
        )}

        <section className="mx-auto max-w-7xl px-4 pt-16 lg:px-6">
          <SectionHeader t={t} title={ed(diseno, 'FeaturedTitle', 'Productos destacados')} onMore={goCatalog} moreLabel={ed(diseno, 'FeaturedMore', 'Ver todos los productos')} />
          {loading && !featured.length ? <GridSkeleton t={t} /> : featured.length ? (
            <ProductGrid t={t} products={featured} slug={slug} diseno={diseno} onOpen={goProduct} onAdd={add} />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed bg-white py-16 text-center" style={{ borderColor: t.line }}>
              <Icon icon="solar:bag-4-linear" width={48} style={{ color: t.muted }} />
              <p className="mt-3 text-[15px] font-semibold" style={{ color: t.ink }}>Muy pronto verás nuestros productos aquí</p>
            </div>
          )}
        </section>

        {showOffersTile && (
          <section id="vr-ofertas" className="mx-auto max-w-7xl scroll-mt-6 px-4 pt-16 lg:px-6">
            <SectionHeader
              t={t}
              eyebrow={ed(diseno, 'OffersEyebrow', 'Precios rebajados')}
              title={ed(diseno, 'OffersTitle', 'Ofertas de la semana')}
              right={offerEndsAt ? (
                <div className="flex items-center gap-4">
                  <span className="hidden text-[12px] font-bold uppercase tracking-[0.12em] sm:inline" style={{ color: t.muted }}>Terminan en</span>
                  <OfferCountdown t={t} endsAt={offerEndsAt} size="sm" />
                </div>
              ) : undefined}
            />
            <ProductGrid t={t} products={offers.slice(0, 5)} slug={slug} diseno={diseno} onOpen={goProduct} onAdd={add} />
          </section>
        )}

        <BenefitsStrip t={t} diseno={diseno} benefits={benefits} waUrl={ch.wa(ed(diseno, 'HelpMessage', 'Hola, ¿me ayudan a elegir una cartera?'))} onContact={() => navigate(`/tienda/${slug}/contacto`)} />

        {ch.hasWhatsapp && !isOn(diseno, 'NewsHidden') && <NewsBand t={t} diseno={diseno} wa={ch.wa} />}

        <VerenaFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <VerenaCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } })} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.primary} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.primary} onGoProduct={(item: any) => goProduct(item)} />
      </div>
    </MotionConfig>
  );
}

// ═════════════════════════════════════════════════════════════════ HERO ══
type Slide = { badge: string; title: string; highlight: string; text: string; img: string; button: string; action: string };

function useSlides(diseno: any): Slide[] {
  const year = new Date().getFullYear();
  const defaults = [
    { badge: `Nueva colección ${year}`, title: 'Mejores carteras.', highlight: 'Más estilo.', text: 'Diseños elegidos con cuidado. Calidad que se nota y precios que te encantan.', img: VR_IMG.slide1 },
    { badge: 'Lo más elegido', title: 'Tu cartera ideal', highlight: 'para cada día.', text: 'Del trabajo a la noche: modelos versátiles que combinan con todo.', img: VR_IMG.slide2 },
    { badge: 'Detalles que importan', title: 'Hechas para', highlight: 'acompañarte.', text: 'Materiales nobles, costuras firmes y acabados que duran.', img: VR_IMG.slide3 },
  ];
  const n = isOn(diseno, 'HeroSingle') ? 1 : 3;
  return defaults.slice(0, n).map((d, i) => {
    const k = `Slide${i + 1}`;
    return {
      badge: optional(diseno, `${k}Badge`, d.badge),
      title: ed(diseno, `${k}Title`, d.title),
      highlight: optional(diseno, `${k}Highlight`, d.highlight),
      text: optional(diseno, `${k}Text`, d.text),
      img: String(diseno?.[`${VR}${k}Image`] || '').trim() || d.img,
      button: ed(diseno, `${k}Button`, 'Comprar ahora'),
      action: `${k}Action`,
    };
  });
}

/**
 * Hero con diapositivas. Aislado a nivel de módulo: su intervalo (6.5s) solo
 * re-renderiza este componente, nunca las tarjetas de producto.
 */
function HeroSlider({ t, diseno, list, benefits, onAction, onSecondary, onCatalog }: { t: Theme; diseno: any; list: any[]; benefits: Benefit[]; onAction: (key: string) => void; onSecondary: () => void; onCatalog: () => void }) {
  const slides = useSlides(diseno);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const id = setInterval(() => setIdx((v) => (v + 1) % slides.length), 6500);
    return () => clearInterval(id);
  }, [slides.length, paused]);
  useEffect(() => { if (idx >= slides.length) setIdx(0); }, [idx, slides.length]);
  const s = slides[Math.min(idx, slides.length - 1)];
  const secondary = optional(diseno, 'HeroButton2', 'Ver categorías');

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 lg:px-6" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative overflow-hidden rounded-[28px]" style={{ background: t.cream }}>
        {/* Foto: a la derecha en desktop, arriba en móvil. Se funde con el crema. */}
        <div className="relative h-[280px] sm:h-[360px] lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[56%]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.img key={s.img} src={s.img} alt="" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: vrEase }} className="absolute inset-0 h-full w-full object-cover" />
          </AnimatePresence>
          <div aria-hidden className="absolute inset-0 hidden lg:block" style={{ background: `linear-gradient(90deg, ${t.cream} 0%, transparent 34%)` }} />
          <div aria-hidden className="absolute inset-0 lg:hidden" style={{ background: `linear-gradient(0deg, ${t.cream} 0%, transparent 40%)` }} />
        </div>

        <div className="relative px-6 pb-8 pt-4 sm:px-12 lg:min-h-[560px] lg:w-[54%] lg:pb-10 lg:pt-14">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={idx} variants={vrStagger} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.2 } }}>
              {s.badge && (
                <motion.span variants={vrHeroText} className="inline-flex rounded-full px-3.5 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em]" style={{ background: t.primary, color: t.onPrimary }}>{s.badge}</motion.span>
              )}
              <motion.h1 variants={vrHeroText} className="mt-5 text-[44px] font-extrabold leading-[1.02] tracking-[-0.025em] sm:text-[58px] lg:text-[66px]" style={{ fontFamily: t.serif, color: t.ink }}>
                <span className="block">{s.title}</span>
                {s.highlight && (
                  <span className="mt-1 flex items-center gap-3" style={{ color: t.primary }}>
                    {s.highlight}
                    <Icon aria-hidden icon="ph:leaf-light" className="h-10 w-10 shrink-0 sm:h-12 sm:w-12" />
                  </span>
                )}
              </motion.h1>
              {s.text && <motion.p variants={vrHeroText} className="mt-5 max-w-md text-[17px] leading-relaxed" style={{ color: t.muted }}>{s.text}</motion.p>}
              <motion.div variants={vrHeroText} className="mt-8 flex flex-wrap items-center gap-3">
                <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => onAction(s.action)} className="group inline-flex h-[52px] items-center gap-2 rounded-xl px-7 text-[15px] font-bold" style={{ background: t.primary, color: t.onPrimary, boxShadow: `0 16px 34px -18px ${mix(t.primary, 90, 'transparent')}` }}>
                  {s.button}
                  <Icon icon="solar:arrow-right-linear" width={19} className="transition-transform duration-300 group-hover:translate-x-1" />
                </motion.button>
                {secondary && (
                  <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={onSecondary} className="inline-flex h-[52px] items-center rounded-xl border-2 bg-white/70 px-6 text-[15px] font-bold backdrop-blur" style={{ borderColor: mix(t.ink, 18), color: t.ink }}>
                    {secondary}
                  </motion.button>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {benefits.length > 0 && (
            <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-4 lg:mt-14">
              {benefits.slice(0, 4).map((b) => (
                <li key={b.key} className="flex max-w-[200px] items-start gap-2.5">
                  <Icon icon={b.icon} width={28} className="shrink-0" style={{ color: t.ink }} />
                  <div className="min-w-0 leading-tight">
                    <p className="text-[12.5px] font-bold" style={{ color: t.ink }}>{b.title}</p>
                    <p className="mt-0.5 text-[11.5px]" style={{ color: t.muted }}>{b.sub}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ProofCard t={t} diseno={diseno} list={list} onCatalog={onCatalog} />

        {slides.length > 1 && (
          <div className="relative flex justify-center gap-2.5 pb-6 lg:absolute lg:bottom-6 lg:left-1/2 lg:-translate-x-1/2 lg:pb-0">
            {slides.map((_, i) => (
              <button key={i} type="button" aria-label={`Ver diapositiva ${i + 1}`} aria-current={i === idx} onClick={() => setIdx(i)} className="h-3 w-3 rounded-full border-2 transition-colors duration-300" style={{ borderColor: t.ink, background: i === idx ? t.ink : 'transparent' }} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Tarjeta flotante del hero. Con reseñas reales muestra el promedio y la cantidad;
 * sin reseñas muestra miniaturas de productos reales (nunca avatares ni cifras inventadas).
 */
function ProofCard({ t, diseno, list, onCatalog }: { t: Theme; diseno: any; list: any[]; onCatalog: () => void }) {
  const stats = useMemo(() => {
    let count = 0; let sum = 0;
    for (const p of list) { const c = Number(p?.ratingCount || 0); count += c; sum += Number(p?.ratingAvg || 0) * c; }
    return { count, avg: count ? sum / count : 0 };
  }, [list]);
  const thumbs = useMemo(() => list.filter(hasImage).slice(0, 3), [list]);
  if (isOn(diseno, 'HeroProofHidden') || (!stats.count && thumbs.length < 2)) return null;

  return (
    <motion.button type="button" onClick={onCatalog} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6, ease: vrEase }} className="relative mx-6 mb-6 flex items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-[0_24px_50px_-26px_rgba(23,25,27,0.45)] sm:mx-12 lg:absolute lg:bottom-8 lg:right-8 lg:m-0 lg:max-w-[300px]">
      <div className="flex shrink-0 -space-x-3">
        {thumbs.map((p) => (
          <span key={p.id} className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white" style={{ background: t.tile }}>
            <img src={p.imagenUrl} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" />
          </span>
        ))}
      </div>
      <div className="min-w-0">
        {stats.count > 0 ? (
          <>
            <p className="text-[14px] font-bold leading-snug" style={{ color: t.ink }}>{stats.avg.toFixed(1)} de 5 · {stats.count} {stats.count === 1 ? 'reseña' : 'reseñas'}</p>
            <div className="mt-1"><Stars rating={stats.avg} count={stats.count} size={14} /></div>
          </>
        ) : (
          <>
            <p className="text-[14px] font-bold leading-snug" style={{ color: t.ink }}>{ed(diseno, 'HeroProofText', 'Nuestras favoritas de la temporada')}</p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[12.5px] font-semibold" style={{ color: t.primary }}>Ver colección <Icon icon="solar:arrow-right-linear" width={14} /></p>
          </>
        )}
      </div>
    </motion.button>
  );
}

// ══════════════════════════════════════════════════════════ CATEGORÍAS ══
function CategoryTile({ t, label, img, fromProduct, cta, onClick }: { t: Theme; label: string; img: string; fromProduct: boolean; cta: string; onClick: () => void }) {
  const [broken, setBroken] = useState(false);
  return (
    <motion.button type="button" variants={vrItem} whileHover={{ y: -5 }} onClick={onClick} className="group flex h-full flex-col overflow-hidden rounded-2xl border text-left transition-shadow duration-300 hover:shadow-[0_24px_46px_-30px_rgba(23,25,27,0.45)]" style={{ background: t.cream, borderColor: mix(t.ink, 6, 'transparent') }}>
      <div className="relative flex aspect-[5/4] items-center justify-center overflow-hidden">
        {img && !broken ? (
          <img src={img} alt="" loading="lazy" onError={() => setBroken(true)} className={`h-full w-full transition-transform duration-500 group-hover:scale-[1.06] ${fromProduct ? 'object-contain p-4 mix-blend-multiply' : 'object-cover'}`} />
        ) : (
          <Icon icon="solar:bag-4-bold-duotone" width={58} style={{ color: mix(t.primary, 55) }} />
        )}
      </div>
      <div className="flex flex-1 flex-col items-center px-3 pb-4 pt-3 text-center">
        <p className="line-clamp-2 text-[14.5px] font-bold leading-tight" style={{ color: t.ink }}>{label}</p>
        <span className="mt-auto inline-flex items-center gap-1 pt-1.5 text-[12.5px] font-medium" style={{ color: t.muted }}>
          {cta} <Icon icon="solar:arrow-right-linear" width={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>
    </motion.button>
  );
}

function OffersTile({ t, label, count, onClick }: { t: Theme; label: string; count: number; onClick: () => void }) {
  return (
    <motion.button type="button" variants={vrItem} whileHover={{ y: -5 }} onClick={onClick} className="group flex h-full flex-col overflow-hidden rounded-2xl border text-left transition-shadow duration-300 hover:shadow-[0_24px_46px_-30px_rgba(23,25,27,0.45)]" style={{ background: t.cream, borderColor: mix(t.ink, 6, 'transparent') }}>
      <div className="relative flex aspect-[5/4] items-center justify-center">
        <span className="flex h-[72px] w-[72px] rotate-[-8deg] items-center justify-center rounded-2xl transition-transform duration-300 group-hover:rotate-0" style={{ background: t.primary, color: t.onPrimary }}>
          <Icon icon="ph:seal-percent-fill" width={40} />
        </span>
      </div>
      <div className="flex flex-1 flex-col items-center px-3 pb-4 pt-3 text-center">
        <p className="text-[14.5px] font-bold leading-tight" style={{ color: t.ink }}>{label}</p>
        <span className="mt-auto inline-flex items-center gap-1 pt-1.5 text-[12.5px] font-medium" style={{ color: t.muted }}>
          {count} {count === 1 ? 'producto' : 'productos'} <Icon icon="solar:arrow-right-linear" width={14} />
        </span>
      </div>
    </motion.button>
  );
}

// ═════════════════════════════════════════════════════ BENEFICIOS + AYUDA ══
function BenefitsStrip({ t, diseno, benefits, waUrl, onContact }: { t: Theme; diseno: any; benefits: Benefit[]; waUrl: string | null; onContact: () => void }) {
  if (isOn(diseno, 'BenefitsHidden')) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 pt-16 lg:px-6">
      <motion.div variants={vrReveal} initial="hidden" whileInView="show" viewport={vrViewport} className="grid gap-4 overflow-hidden rounded-[24px] p-4 lg:grid-cols-[1fr_340px] lg:p-5" style={{ background: t.cream }}>
        <ul className={`grid grid-cols-1 gap-5 px-3 py-4 sm:grid-cols-2 lg:gap-0 lg:px-2 ${BENEFIT_COLS[benefits.length] || 'lg:grid-cols-4'}`}>
          {benefits.map((b, i) => (
            <li key={b.key} className={`flex items-center gap-3.5 lg:px-5 ${i > 0 ? 'lg:border-l' : ''}`} style={{ borderColor: mix(t.ink, 12, 'transparent') }}>
              <Icon icon={b.icon} width={38} className="shrink-0" style={{ color: t.ink }} />
              <div className="min-w-0">
                <p className="text-[14px] font-bold leading-tight" style={{ color: t.ink }}>{b.title}</p>
                <p className="mt-1 text-[12.5px] leading-snug" style={{ color: t.muted }}>{b.sub}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="relative flex flex-col justify-center overflow-hidden rounded-[20px] p-6" style={{ background: t.accent, color: t.onAccent }}>
          <Icon aria-hidden icon="ph:handbag-light" width={150} className="pointer-events-none absolute -bottom-6 -right-5 opacity-[0.16]" />
          <p className="relative text-[22px] font-bold leading-tight" style={{ fontFamily: t.serif }}>{ed(diseno, 'HelpTitle', waUrl ? '¿Te ayudamos a elegir?' : '¿Tienes alguna duda?')}</p>
          <p className="relative mt-1.5 max-w-[240px] text-[13.5px] leading-snug opacity-90">{ed(diseno, 'HelpText', waUrl ? 'Te asesoramos por WhatsApp para encontrar tu cartera ideal.' : 'Escríbenos y te respondemos personalmente.')}</p>
          {waUrl ? (
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="relative mt-4 inline-flex h-11 w-max items-center gap-2 rounded-xl bg-white px-5 text-[14px] font-bold" style={{ color: t.ink }}>
              <Icon icon="ic:baseline-whatsapp" width={19} className="text-[#1FA855]" /> {ed(diseno, 'HelpButton', 'Escríbenos')}
            </a>
          ) : (
            <button type="button" onClick={onContact} className="relative mt-4 inline-flex h-11 w-max items-center gap-2 rounded-xl bg-white px-5 text-[14px] font-bold" style={{ color: t.ink }}>
              {ed(diseno, 'HelpButton', 'Contáctanos')} <Icon icon="solar:arrow-right-linear" width={17} />
            </button>
          )}
        </div>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════ NEWSLETTER ══
/** Comunidad por WhatsApp. Estado propio aislado; abre WhatsApp y nunca simula una suscripción. */
function NewsBand({ t, diseno, wa }: { t: Theme; diseno: any; wa: (msg?: string) => string | null }) {
  const [name, setName] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const who = name.trim() ? `Soy ${name.trim()}. ` : '';
    const url = wa(`Hola. ${who}${ed(diseno, 'NewsMessage', 'Quiero unirme a su comunidad y recibir novedades y ofertas por WhatsApp.')}`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  const perks = [
    { icon: 'ph:seal-percent-light', label: ed(diseno, 'NewsPerk1', 'Ofertas para la comunidad') },
    { icon: 'ph:sparkle-light', label: ed(diseno, 'NewsPerk2', 'Novedades primero') },
    { icon: 'ph:gift-light', label: ed(diseno, 'NewsPerk3', 'Lanzamientos anticipados') },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 pt-16 lg:px-6">
      <motion.div variants={vrReveal} initial="hidden" whileInView="show" viewport={vrViewport} className="grid items-center gap-7 rounded-[24px] px-6 py-8 sm:px-10 lg:grid-cols-[auto_1fr_auto] lg:gap-10" style={{ background: t.primary, color: t.onPrimary }}>
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2" style={{ borderColor: mix(t.onPrimary, 35, 'transparent'), background: mix(t.onPrimary, 10, 'transparent') }}>
            <Icon icon="ph:envelope-simple-light" width={32} />
          </span>
          <div>
            <p className="text-[22px] font-bold leading-tight">{ed(diseno, 'NewsTitle', 'Únete a nuestra comunidad')}</p>
            <p className="mt-1 text-[14px] opacity-85">{ed(diseno, 'NewsText', 'Novedades y ofertas directo en tu WhatsApp.')}</p>
          </div>
        </div>
        <form onSubmit={submit} className="flex h-[52px] w-full items-center overflow-hidden rounded-xl bg-white lg:max-w-md">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={ed(diseno, 'NewsPlaceholder', 'Escribe tu nombre')} aria-label="Tu nombre" className="min-w-0 flex-1 border-0 bg-transparent bg-none px-4 text-[14.5px] text-[#17191B] outline-none placeholder:text-[#9A9EA0] focus:ring-0" />
          <button type="submit" className="flex h-full shrink-0 items-center gap-1.5 px-5 text-[14px] font-bold" style={{ background: t.accent, color: t.onAccent }}>
            <Icon icon="ic:baseline-whatsapp" width={19} /> {ed(diseno, 'NewsButton', 'Unirme')}
          </button>
        </form>
        <ul className="grid grid-cols-3 gap-0 lg:flex">
          {perks.map((p, i) => (
            <li key={p.label} className={`flex flex-col items-center gap-1.5 px-3 text-center lg:flex-row lg:gap-2.5 lg:px-5 lg:text-left ${i > 0 ? 'border-l' : ''}`} style={{ borderColor: mix(t.onPrimary, 22, 'transparent') }}>
              <Icon icon={p.icon} width={28} className="shrink-0" />
              <span className="max-w-[110px] text-[12.5px] font-semibold leading-tight">{p.label}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}

export { VerenaFooter } from './VerenaParts';
