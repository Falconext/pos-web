import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { buildCategoryTiles } from '@/templates/shared/categoryTiles';
import { resolveHeroIntervalMs, usePreloadImages } from '@/templates/shared/heroSlider';
import { getProductPricing } from '@/templates/shared/pricing';
import { getStoreLinkAction, isLinkActionConfigured, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import {
  ElanHeader, ElanFooter, ElanCartModal, buildServices,
  elanTheme, useElanFont, editable, optional, isOn, btnCls, labelCls, type Theme, type Service,
} from './ElanParts';
import { SectionHeader, ProductGrid, GridSkeleton, OfferCountdown, soonestOfferEnd, storeChannels, instagramHandle, photoFit, getName, hasImage, type OpenFn, type AddFn, type Channels } from './ElanSections';
import { mix, elEase, elHeroText, elItem, elReveal, elStagger, elViewport } from './motion';

const u = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Fotos de ejemplo (reemplazables en Personalizar). */
export const ELAN_IMG = {
  hero: [u('1487222477894-8943e31ef7b2', 2000), u('1483985988355-763728e1935b', 2000), u('1543163521-1bf539c55dd2', 2000)],
  collections: [u('1485968579580-b6d095142e6e', 900), u('1496747611176-843222e1e57c', 900), u('1509631179647-0177331693ae', 900), u('1548036328-c9fa89d128fa', 900)],
  sale: u('1490481651871-ab68de25d43d', 1200),
  inspiration: [u('1515886657613-9f3515b0c78f', 700), u('1469334031218-e382a71b716b', 700), u('1539109136881-3be0616acf4b', 700), u('1529139574466-a303027c1d8b', 700), u('1524504388940-b1c1722653e1', 700), u('1581044777550-4cfa60707c03', 700), u('1475180098004-ca77a66827be', 700)],
};

const COLLECTIONS = ['Nueva temporada', 'Esenciales', 'Sastrería', 'Accesorios'];
const HOME_PAGE_SIZE = 30; // límite de productos que carga [slug].tsx para el home

// ═════════════════════════════════════════════════════════════════ PAGE ══
export default function ElanHomePage(props: TemplateHomePageProps) {
  const { tienda, slug, productos, allCategories, diseno, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, agregarAlCarrito, actualizarCantidad, loading } = props as any;
  useElanFont();
  const navigate = useNavigate();
  const t = elanTheme(diseno);
  const fit = photoFit(diseno);
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
  const circles = useMemo(() => buildCategoryTiles({ allCategories, diseno, prefix: 'modaElegante', count: 7, fallbackImages: [] }).map((tile) => {
    const same = (p: any) => getName(p?.categoria).toLowerCase() === tile.nombre.toLowerCase();
    return { ...tile, imagenUrl: tile.imagenUrl || withImg.find(same)?.imagenUrl || '' };
  }), [allCategories, diseno, withImg]);
  const ch = storeChannels(tienda, diseno);
  const services = useMemo(() => buildServices(tienda, ch.hasWhatsapp), [tienda, ch.hasWhatsapp]);

  const cartCount = (carrito || []).reduce((s: number, i: any) => s + Number(i?.cantidad || 1), 0);
  const goCatalog = () => navigate(`/tienda/${slug}/catalogo`);
  const goCategory = (name: string) => navigate(`/tienda/${slug}/catalogo?category=${encodeURIComponent(name)}`);
  const goProduct: OpenFn = (p) => navigate(`/tienda/${slug}/producto/${p.id}`);
  // Al agregar se abre la bolsa: confirma la acción y muestra el subtotal.
  const add: AddFn = (p, qty = 1) => { agregarAlCarrito({ ...p, __cantidad: qty }); setMostrarCarrito(true); };
  const goAction = (key: string, fallbackCategory?: string) => runStoreLinkAction(
    getStoreLinkAction(diseno, key, fallbackCategory ? { defaultType: 'category', fallbackValue: fallbackCategory } : { defaultType: 'catalog' }),
    { slug, navigate },
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, fontFamily: t.font }}>
        <ElanHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={navigate} />

        <HeroSlider t={t} diseno={diseno} goAction={goAction} />
        {(circles.length > 0 || list.length > 0) && <CategoryCircles t={t} diseno={diseno} circles={circles} newImage={picks.find(hasImage)?.imagenUrl || ''} onAll={goCatalog} onPick={goCategory} />}
        <Collections t={t} diseno={diseno} categories={categories} products={withImg} goAction={goAction} />

        <section className="mx-auto max-w-[1440px] px-4 py-12 lg:px-10">
          <SectionHeader t={t} title={editable(diseno?.modaElegantePicksTitle, 'Selección destacada')} onMore={goCatalog} moreLabel={editable(diseno?.modaElegantePicksMore, 'Ver todo')} />
          {loading && !list.length
            ? <GridSkeleton t={t} count={6} cols="lg:grid-cols-6" />
            : picks.length > 0 && <ProductGrid t={t} products={picks} slug={slug} onOpen={goProduct} onAdd={add} cols="lg:grid-cols-6" fit={fit} />}
        </section>

        <SaleBand t={t} diseno={diseno} offers={offers} goAction={goAction} />
        <ServicesRow t={t} services={services} />
        <Inspiration t={t} diseno={diseno} instagramUrl={ch.instagramUrl} />
        <Newsletter t={t} diseno={diseno} ch={ch} />

        <ElanFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <ElanCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } })} t={t} tienda={tienda} diseno={diseno} />
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
  return [
    { image: d.modaEleganteHeroImage || ELAN_IMG.hero[0], onlyImage: isOn(d.modaEleganteHeroOnlyImage), eyebrow: optional(d.modaEleganteHeroEyebrow, 'Nueva temporada'), title: editable(d.modaEleganteHeroTitle, 'Elegancia moderna'), subtitle: optional(d.modaEleganteHeroSubtitle, 'Piezas atemporales con estilo contemporáneo. Pensadas para ti.'), button: editable(d.modaEleganteHeroButton, 'Ver la colección'), action: 'modaEleganteHeroAction' },
    { image: d.modaEleganteSlide2Image || ELAN_IMG.hero[1], onlyImage: isOn(d.modaEleganteSlide2OnlyImage), eyebrow: optional(d.modaEleganteSlide2Eyebrow, 'Recién llegados'), title: editable(d.modaEleganteSlide2Title, 'Lo nuevo de la semana'), subtitle: optional(d.modaEleganteSlide2Subtitle, 'Prendas que combinan con todo y duran temporadas.'), button: editable(d.modaEleganteSlide2Button, 'Descubrir'), action: 'modaEleganteSlide2Action' },
    { image: d.modaEleganteSlide3Image || ELAN_IMG.hero[2], onlyImage: isOn(d.modaEleganteSlide3OnlyImage), eyebrow: optional(d.modaEleganteSlide3Eyebrow, 'Calzado'), title: editable(d.modaEleganteSlide3Title, 'Pasos con estilo'), subtitle: optional(d.modaEleganteSlide3Subtitle, 'Tacones, sandalias y zapatillas para cada ocasión.'), button: editable(d.modaEleganteSlide3Button, 'Ver calzado'), action: 'modaEleganteSlide3Action' },
  ];
}

/** Slider del hero. Aislado: su intervalo solo re-renderiza este componente. */
function HeroSlider({ t, diseno, goAction }: { t: Theme; diseno: any; goAction: (k: string) => void }) {
  const slides = useMemo(() => slidesFrom(diseno), [diseno]);
  const interval = resolveHeroIntervalMs(diseno, 'modaEleganteHeroInterval', 6500);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  usePreloadImages(slides.map((s) => s.image));
  useEffect(() => {
    if (!interval || paused) return;
    const id = window.setTimeout(() => setIdx((v) => (v + 1) % slides.length), interval);
    return () => window.clearTimeout(id);
  }, [idx, interval, paused, slides.length]);
  const s = slides[idx];
  const step = (d: number) => setIdx((v) => (v + d + slides.length) % slides.length);

  return (
    <section className="relative mx-auto mt-5 max-w-[1440px] lg:px-10" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carrusel">
      <div className={`relative overflow-hidden lg:h-[600px] ${s.onlyImage ? 'h-[520px]' : ''}`} style={{ background: s.onlyImage ? t.soft : t.bg }}>
        <div className={`${s.onlyImage ? 'absolute inset-0' : 'relative h-[400px] sm:h-[460px]'} overflow-hidden lg:absolute lg:inset-0 lg:h-auto`} style={{ background: t.soft }}>
        {/* Fotos apiladas (crossfade sin hueco). */}
        {slides.map((sl, i) => (
          <motion.img key={sl.action} src={sl.image} alt="" aria-hidden initial={false} animate={{ opacity: i === idx ? 1 : 0, scale: i === idx ? 1 : 1.04 }} transition={{ duration: 1.2, ease: elEase }} className="absolute inset-0 h-full w-full object-cover object-[70%_center]" loading={i === 0 ? 'eager' : 'lazy'} />
        ))}
        </div>

        {s.onlyImage ? (
          <button type="button" aria-label={s.title} onClick={() => goAction(s.action)} className="absolute inset-0 z-[1]" />
        ) : (
          <>
            {/* Velo claro a la izquierda en escritorio; en móvil el texto va debajo de la foto. */}
            <div aria-hidden className="absolute inset-0 z-[1] hidden lg:block" style={{ background: `linear-gradient(90deg, ${mix(t.bg, 78, 'transparent')} 0%, ${mix(t.bg, 45, 'transparent')} 34%, transparent 58%)` }} />
            <div className="relative z-[2] flex min-h-[300px] px-5 pb-10 pt-7 sm:px-10 lg:h-full lg:min-h-0 lg:items-center lg:px-16 lg:py-0">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={idx} variants={elStagger} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.2 } }} className="max-w-[520px]">
                  {s.eyebrow && <motion.p variants={elHeroText} className={labelCls} style={{ color: t.ink }}>{s.eyebrow}</motion.p>}
                  <motion.h1 variants={elHeroText} className="mt-3 text-[40px] leading-[1.04] tracking-[-0.015em] sm:text-[56px] lg:mt-4 lg:text-[76px]" style={{ color: t.ink, fontFamily: t.display }}>{s.title}</motion.h1>
                  {s.subtitle && <motion.p variants={elHeroText} className="mt-5 max-w-[340px] text-[15px] leading-relaxed" style={{ color: mix(t.ink, 82, t.bg) }}>{s.subtitle}</motion.p>}
                  <motion.div variants={elHeroText} className="mt-8">
                    <button type="button" onClick={() => goAction(s.action)} className={`${btnCls} group h-[52px] px-9`} style={{ background: t.primary, color: t.onPrimary }}>
                      {s.button}<Icon icon="solar:arrow-right-linear" width={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                    </button>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        )}

        <div className={`absolute right-4 z-[3] flex items-center gap-4 lg:bottom-8 lg:right-8 lg:top-auto ${s.onlyImage ? 'bottom-5' : 'top-[336px] sm:top-[396px]'}`}>
          <div className="flex gap-1.5">
            {slides.map((sl, i) => (
              <button key={sl.action} type="button" aria-label={`Ir al banner ${i + 1}`} aria-current={i === idx} onClick={() => setIdx(i)} className="flex h-6 w-6 items-center justify-center">
                <span className="block h-[7px] w-[7px] rounded-full transition-colors duration-500" style={{ background: i === idx ? t.ink : 'rgba(255,255,255,.85)', boxShadow: '0 0 0 1px rgba(0,0,0,.12)' }} />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {[{ d: -1, icon: 'solar:alt-arrow-left-linear', label: 'Banner anterior' }, { d: 1, icon: 'solar:alt-arrow-right-linear', label: 'Banner siguiente' }].map((b) => (
              <button key={b.d} type="button" aria-label={b.label} onClick={() => step(b.d)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_8px_20px_-10px_rgba(0,0,0,.35)] transition-transform hover:scale-105" style={{ color: t.ink }}>
                <Icon icon={b.icon} width={17} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════ CÍRCULOS DE CATEGORÍA ══
function CategoryCircles({ t, diseno, circles, newImage, onAll, onPick }: { t: Theme; diseno: any; circles: { nombre: string; label: string; imagenUrl: string }[]; newImage: string; onAll: () => void; onPick: (c: string) => void }) {
  const showNew = !isOn(diseno?.modaEleganteNewHidden);
  const items = [
    ...(showNew ? [{ key: '__new', label: editable(diseno?.modaEleganteNewLabel, 'Novedades'), img: diseno?.modaEleganteNewImage || newImage, badge: editable(diseno?.modaEleganteNewBadge, 'Nuevo'), onClick: onAll }] : []),
    ...circles.map((c) => ({ key: c.nombre, label: c.label, img: c.imagenUrl, badge: '', onClick: () => onPick(c.nombre) })),
  ];
  if (!items.length) return null;
  const cols: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6', 7: 'lg:grid-cols-7', 8: 'lg:grid-cols-8' };
  return (
    <section className="mx-auto max-w-[1440px] border-b px-4 lg:px-10" style={{ borderColor: t.line }}>
      <motion.div variants={elStagger} initial="hidden" whileInView="show" viewport={elViewport} className={`-mx-4 flex gap-5 overflow-x-auto px-4 py-8 [scrollbar-width:none] lg:mx-0 lg:grid lg:gap-4 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden ${cols[items.length] || 'lg:grid-cols-8'}`}>
        {items.map((c) => (
          <motion.button key={c.key} type="button" variants={elItem} onClick={c.onClick} className="group flex w-[88px] shrink-0 flex-col items-center text-center lg:w-auto">
            <span className="relative block aspect-square w-full max-w-[112px]">
              <span className="absolute inset-0 overflow-hidden rounded-full" style={{ background: t.soft }}>
                {c.img
                  ? <img src={c.img} alt="" loading="lazy" className="h-full w-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-[1.08]" />
                  : <span className="flex h-full w-full items-center justify-center text-[30px]" style={{ color: mix(t.ink, 55, t.soft), fontFamily: t.display }}>{c.label.trim().charAt(0).toUpperCase()}</span>}
              </span>
              {c.badge && <span className="absolute -right-1 top-[18%] rounded-full bg-white px-2 py-[3px] text-[9px] font-semibold uppercase tracking-[0.12em] shadow-sm" style={{ color: t.ink }}>{c.badge}</span>}
            </span>
            <span className="mt-3 line-clamp-2 text-[10.5px] font-semibold uppercase leading-tight tracking-[0.14em] sm:text-[11px]" style={{ color: t.ink }}>{c.label}</span>
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════ COLECCIONES (tarjetas) ══
/** Colecciones editoriales. Por defecto cada tarjeta lleva el nombre, el enlace y una foto de una categoría real. */
function Collections({ t, diseno, categories, products, goAction }: { t: Theme; diseno: any; categories: string[]; products: any[]; goAction: (k: string, cat?: string) => void }) {
  if (isOn(diseno?.modaEleganteColsHidden)) return null;
  const items = COLLECTIONS.map((fallback, i) => {
    const n = i + 1;
    const cat = categories[i];
    return {
      key: `modaEleganteCol${n}Action`,
      cat: isLinkActionConfigured(diseno, `modaEleganteCol${n}Action`) ? undefined : cat,
      // Foto: la del editor; si la tarjeta es una categoría real, la de un producto de esa categoría; si no, el ejemplo.
      img: diseno?.[`modaEleganteCol${n}Image`] || (cat && products.find((p) => getName(p?.categoria).toLowerCase() === cat.toLowerCase())?.imagenUrl) || ELAN_IMG.collections[i],
      title: editable(diseno?.[`modaEleganteCol${n}Title`], cat || fallback),
    };
  });
  const button = editable(diseno?.modaEleganteColsButton, 'Comprar');
  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-12 lg:px-10">
      <SectionHeader t={t} title={editable(diseno?.modaEleganteColsTitle, 'Colecciones')} />
      <motion.div variants={elStagger} initial="hidden" whileInView="show" viewport={elViewport} className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible sm:gap-4 lg:mx-0 lg:grid-cols-4 lg:px-0 [&::-webkit-scrollbar]:hidden">
        {items.map((c) => (
          <motion.button key={c.key} type="button" variants={elItem} onClick={() => goAction(c.key, c.cat)} className="group relative block aspect-[4/5] w-[72%] shrink-0 snap-start overflow-hidden text-left sm:w-auto lg:aspect-[5/4.4]">
            <img src={c.img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.05]" />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <span className="absolute inset-x-5 bottom-5 text-white">
              <span className="block text-[26px] leading-[1.05] lg:text-[28px]" style={{ fontFamily: t.display }}>{c.title}</span>
              <span className="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
                {button}<Icon icon="solar:arrow-right-linear" width={15} className="transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </span>
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════ BANDA DE OFERTAS ══
/**
 * Con ofertas reales: "Hasta X% dto." calculado del mayor descuento vigente y reloj solo si hay
 * fechaFinOferta. Sin ofertas: banda editorial 100% editable (sin porcentajes).
 */
function SaleBand({ t, diseno, offers, goAction }: { t: Theme; diseno: any; offers: any[]; goAction: (k: string) => void }) {
  if (isOn(diseno?.modaEleganteSaleHidden)) return null;
  const maxPct = offers.reduce((m, p) => Math.max(m, Number(getProductPricing(p).porcentajeDescuento || 0)), 0);
  const hasSale = offers.length > 0 && maxPct > 0;
  const endsAt = hasSale ? soonestOfferEnd(offers) : null;
  const eyebrow = hasSale ? editable(diseno?.modaEleganteSaleEyebrow, 'Ofertas de temporada') : editable(diseno?.modaEleganteBandEyebrow, 'Colección de temporada');
  const title = hasSale ? `Hasta ${maxPct}% dto.` : editable(diseno?.modaEleganteBandTitle, 'Viste tu mejor versión');
  const text = hasSale
    ? editable(diseno?.modaEleganteSaleText, endsAt ? 'En prendas seleccionadas, por tiempo limitado.' : 'En prendas seleccionadas.')
    : optional(diseno?.modaEleganteBandText, 'Piezas versátiles para combinar todos los días.');
  const button = hasSale ? editable(diseno?.modaEleganteSaleButton, 'Ver ofertas') : editable(diseno?.modaEleganteBandButton, 'Explorar');
  const image = diseno?.modaEleganteSaleImage || ELAN_IMG.sale;

  return (
    <section className="mx-auto max-w-[1440px] px-4 lg:px-10">
      <motion.div variants={elReveal} initial="hidden" whileInView="show" viewport={elViewport} className="relative grid overflow-hidden md:grid-cols-[0.9fr_2fr]" style={{ background: t.sand }}>
        <div className="relative h-40 md:h-auto">
          <img src={image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <div aria-hidden className="absolute inset-0 hidden md:block" style={{ background: `linear-gradient(90deg, transparent 55%, ${t.sand} 100%)` }} />
        </div>
        <div className="flex flex-col gap-6 px-6 py-8 sm:px-10 md:flex-row md:items-center md:justify-between md:py-9">
          <div>
            <p className={labelCls} style={{ color: t.accentInk }}>{eyebrow}</p>
            <h2 className="mt-2 text-[36px] leading-none sm:text-[44px]" style={{ color: t.ink, fontFamily: t.display }}>{title}</h2>
          </div>
          <div className="flex flex-col gap-4 md:max-w-[300px] md:items-start">
            {text && <p className="text-[13px] leading-relaxed" style={{ color: mix(t.ink, 75, t.sand) }}>{text}</p>}
            {endsAt && <OfferCountdown t={t} endsAt={endsAt} />}
          </div>
          <button type="button" onClick={() => goAction(hasSale ? 'modaEleganteSaleAction' : 'modaEleganteBandAction')} className={`${btnCls} h-12 shrink-0 self-start px-8 md:self-center`} style={{ background: t.primary, color: t.onPrimary }}>{button}</button>
        </div>
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ BENEFICIOS ══
function ServicesRow({ t, services }: { t: Theme; services: Service[] }) {
  if (!services.length) return null;
  const cols: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };
  return (
    <section className="mx-auto max-w-[1440px] px-4 lg:px-10">
      <motion.ul variants={elStagger} initial="hidden" whileInView="show" viewport={elViewport} className={`grid grid-cols-2 gap-x-4 gap-y-6 border-b py-9 ${cols[services.length] || 'lg:grid-cols-4'}`} style={{ borderColor: t.line }}>
        {services.map((s) => (
          <motion.li key={s.label} variants={elItem} className="flex items-center gap-3.5 lg:justify-center">
            <Icon icon={s.icon} width={26} className="shrink-0" style={{ color: t.ink }} />
            <span className="min-w-0 leading-tight">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: t.ink }}>{s.label}</span>
              <span className="mt-1 block text-[12px]" style={{ color: t.muted }}>{s.sub}</span>
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

// ═════════════════════════════════════════════════════ INSPIRACIÓN DE ESTILO ══
/** Galería editorial editable. Enlaza a Instagram solo si la tienda lo tiene configurado. */
function Inspiration({ t, diseno, instagramUrl }: { t: Theme; diseno: any; instagramUrl: string | null }) {
  if (isOn(diseno?.modaEleganteInspHidden)) return null;
  const handle = instagramHandle(instagramUrl);
  const imgs = ELAN_IMG.inspiration.map((fb, i) => diseno?.[`modaEleganteInsp${i + 1}Image`] || fb);
  const follow = instagramUrl ? (
    <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className={`${labelCls} inline-flex items-center gap-2`} style={{ color: t.ink }}>
      <Icon icon="mdi:instagram" width={16} />{handle ? `Síguenos @${handle}` : 'Síguenos en Instagram'}
    </a>
  ) : <span />;
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-12 lg:px-10">
      <SectionHeader t={t} title={editable(diseno?.modaEleganteInspTitle, 'Inspiración de estilo')} right={follow} />
      <motion.div variants={elStagger} initial="hidden" whileInView="show" viewport={elViewport} className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-7 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
        {imgs.map((src, i) => {
          const body = (
            <>
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
              {instagramUrl && <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-[opacity,background-color] duration-300 group-hover:bg-black/25 group-hover:opacity-100"><Icon icon="mdi:instagram" width={26} /></span>}
            </>
          );
          const cls = 'group relative block aspect-[3/4] w-[42%] shrink-0 snap-start overflow-hidden sm:w-[28%] lg:w-auto';
          return instagramUrl
            ? <motion.a key={i} variants={elItem} href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Ver en Instagram" className={cls} style={{ background: t.soft }}>{body}</motion.a>
            : <motion.div key={i} variants={elItem} className={cls} style={{ background: t.soft }}>{body}</motion.div>;
        })}
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════ NEWSLETTER ══
/**
 * "Entérate primero". Sin backend de newsletter: con WhatsApp real, arma el mensaje con el correo
 * y lo abre en WhatsApp (nunca simula un "suscrito"). Sin WhatsApp, la sección no aparece.
 */
function Newsletter({ t, diseno, ch }: { t: Theme; diseno: any; ch: Channels }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  if (!ch.hasWhatsapp || isOn(diseno?.modaEleganteNewsHidden)) return null;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setError('Ingresa un correo válido.'); return; }
    setError('');
    const url = ch.wa(`Hola, quiero recibir novedades y lanzamientos. Mi correo es ${v}.`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <section className="mx-auto max-w-[1440px] px-4 pb-14 lg:px-10">
      <motion.div variants={elReveal} initial="hidden" whileInView="show" viewport={elViewport} className="grid items-center gap-6 px-6 py-9 sm:px-10 lg:grid-cols-[auto_1fr_1.1fr] lg:gap-10" style={{ background: t.sand }}>
        <Icon icon="solar:letter-linear" width={46} className="hidden lg:block" style={{ color: t.ink }} />
        <div>
          <h2 className={labelCls} style={{ color: t.ink }}>{editable(diseno?.modaEleganteNewsTitle, 'Entérate primero')}</h2>
          <p className="mt-2 max-w-md text-[13px] leading-relaxed" style={{ color: mix(t.ink, 72, t.sand) }}>{editable(diseno?.modaEleganteNewsText, 'Recibe los nuevos ingresos, ofertas exclusivas e ideas de estilo.')}</p>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }} placeholder="Tu correo electrónico" aria-label="Tu correo electrónico" aria-invalid={Boolean(error)} className="h-12 min-w-0 flex-1 appearance-none border-0 bg-white bg-none px-4 text-[13.5px] outline-none placeholder:text-stone-400 focus:ring-0" style={{ color: t.ink, boxShadow: `inset 0 0 0 1px ${error ? '#E11D48' : t.line}` }} />
            <button type="submit" className={`${btnCls} h-12 px-8`} style={{ background: t.primary, color: t.onPrimary }}>{editable(diseno?.modaEleganteNewsButton, 'Suscribirme')}</button>
          </div>
          <p className="mt-2 text-[11.5px]" style={{ color: error ? '#E11D48' : t.muted }}>{error || 'Se abrirá WhatsApp con tu mensaje listo para enviar.'}</p>
        </form>
      </motion.div>
    </section>
  );
}
