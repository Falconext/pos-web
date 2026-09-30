import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
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
  BlushHeader, BlushFooter, BlushCartModal, buildServices,
  blushTheme, useBlushFont, editable, optional, isOn, btnCls, eyebrowCls, MAQUILLAJE_IMG, type Theme, type Service,
} from './BlushParts';
import { ProductRail, GridSkeleton, OfferCountdown, SectionHeader, soonestOfferEnd, storeChannels, instagramHandle, getName, hasImage, type OpenFn, type AddFn } from './BlushSections';
import { blEase, blHeroText, blItem, blReveal, blStagger, blViewport, mix } from './motion';

/** "Brilla.|Define.|Sé tú." → saltos de línea (el editor es de una línea). */
const lines = (s: string) => s.replace(/\s*\|\s*/g, '\n');

// ═════════════════════════════════════════════════════════════════ PAGE ══
export default function BlushHomePage(props: TemplateHomePageProps) {
  const { tienda, slug, productos, allCategories, diseno, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, agregarAlCarrito, actualizarCantidad, loading } = props as any;
  useBlushFont();
  const navigate = useNavigate();
  const t = blushTheme(diseno);
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
  const offers = useMemo(() => list.filter((p) => getProductPricing(p).enOferta).slice(0, 10), [list]);
  const tiles = useMemo(() => buildCategoryTiles({ allCategories, diseno, prefix: 'maquillaje', count: 4, fallbackImages: [] }).map((tile) => {
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
      <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, fontFamily: t.font }}>
        <BlushHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={navigate} active="home" />

        <HeroSlider t={t} diseno={diseno} goAction={goAction} />
        {!isOn(diseno?.maquillajeBenefitsHidden) && <BenefitsBar t={t} services={services} />}

        {loading && !list.length ? (
          <section className="mx-auto max-w-[1280px] px-4 py-12 lg:px-8"><GridSkeleton t={t} count={5} cols="lg:grid-cols-5" /></section>
        ) : (
          <ProductRail t={t} title={editable(diseno?.maquillajePicksTitle, 'Destacados')} products={picks} slug={slug} onOpen={goProduct} onAdd={add} onMore={goCatalog} />
        )}

        {!isOn(diseno?.maquillajePromosHidden) && <PromoBanners t={t} diseno={diseno} goAction={goAction} />}

        {/* Con 1–2 ofertas ya se ven con su % en Destacados; el rail propio luce solo con 3 o más. */}
        {offers.length >= 3 && (
          <ProductRail
            t={t}
            title={editable(diseno?.maquillajeOffersTitle, 'Ofertas')}
            products={offers}
            slug={slug}
            onOpen={goProduct}
            onAdd={add}
            right={offerEnd ? (
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: t.muted }}>Termina en</span>
                <div className="p-1" style={{ background: t.blush }}><OfferCountdown t={t} endsAt={offerEnd} /></div>
              </div>
            ) : undefined}
          />
        )}

        {tiles.length > 0 && <PopularCategories t={t} diseno={diseno} tiles={tiles} onPick={goCategory} />}
        {ch.instagramUrl && !isOn(diseno?.maquillajeInstaHidden) && <InstagramStrip t={t} diseno={diseno} url={ch.instagramUrl} products={withImg} />}
        {ch.hasWhatsapp && !isOn(diseno?.maquillajeClubHidden) && <ClubBand t={t} diseno={diseno} wa={ch.wa} storeName={tienda?.nombreComercial || tienda?.nombre || ''} />}
        <div className="h-12" />

        <BlushFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <BlushCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } })} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.accent} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.accent} onGoProduct={(item: any) => goProduct(item)} />
      </div>
    </MotionConfig>
  );
}

// ═════════════════════════════════════════════════════════════════ HERO ══
type Slide = { image: string; onlyImage: boolean; eyebrow: string; title: string; subtitle: string; button: string; action: string };

function slidesFrom(diseno: any): Slide[] {
  const d = diseno || {};
  return slidesVisibles(d, 'maquillaje', [
    { image: d.maquillajeHeroImage || MAQUILLAJE_IMG.hero[0], onlyImage: isOn(d.maquillajeHeroOnlyImage), eyebrow: optional(d.maquillajeHeroEyebrow, 'Tu rutina de belleza'), title: editable(d.maquillajeHeroTitle, 'Brilla.|Define.|Sé tú.'), subtitle: optional(d.maquillajeHeroSubtitle, 'Belleza sin esfuerzo, con productos pensados para realzar lo que ya eres.'), button: editable(d.maquillajeHeroButton, 'Comprar ahora'), action: 'maquillajeHeroAction' },
    { image: d.maquillajeSlide2Image || MAQUILLAJE_IMG.hero[1], onlyImage: isOn(d.maquillajeSlide2OnlyImage), eyebrow: optional(d.maquillajeSlide2Eyebrow, 'Cuidado de la piel'), title: editable(d.maquillajeSlide2Title, 'Piel que|brilla.'), subtitle: optional(d.maquillajeSlide2Subtitle, 'Una rutina simple para una piel luminosa todos los días.'), button: editable(d.maquillajeSlide2Button, 'Descubrir'), action: 'maquillajeSlide2Action' },
    { image: d.maquillajeSlide3Image || MAQUILLAJE_IMG.hero[2], onlyImage: isOn(d.maquillajeSlide3OnlyImage), eyebrow: optional(d.maquillajeSlide3Eyebrow, 'Maquillaje'), title: editable(d.maquillajeSlide3Title, 'Tu tono,|tu estilo.'), subtitle: optional(d.maquillajeSlide3Subtitle, 'Del nude natural al color intenso, para cada momento.'), button: editable(d.maquillajeSlide3Button, 'Ver maquillaje'), action: 'maquillajeSlide3Action' },
  ]);
}

/** Slider del hero (foto a la izquierda, texto sobre rosado a la derecha). Aislado: su timer solo re-renderiza este componente. */
function HeroSlider({ t, diseno, goAction }: { t: Theme; diseno: any; goAction: (k: string) => void }) {
  const slides = useMemo(() => slidesFrom(diseno), [diseno]);
  const interval = resolveHeroIntervalMs(diseno, 'maquillajeHeroInterval', 6500);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  usePreloadImages(slides.map((s) => s.image));
  useEffect(() => {
    if (!interval || paused) return;
    const id = window.setTimeout(() => setIdx((v) => (v + 1) % slides.length), interval);
    return () => window.clearTimeout(id);
  }, [idx, interval, paused, slides.length]);
  const s = slides[idx];
  const photos = (cls: string) => (
    <div aria-hidden className={cls}>
      {slides.map((sl, i) => (
        <motion.img key={sl.action} src={sl.image} alt="" initial={false} animate={{ opacity: i === idx ? 1 : 0, scale: i === idx ? 1 : 1.04 }} transition={{ duration: 1.1, ease: blEase }} className="absolute inset-0 h-full w-full object-cover object-[center_30%]" loading={i === 0 ? 'eager' : 'lazy'} />
      ))}
    </div>
  );
  const dots = (
    <div className="flex gap-2">
      {slides.map((sl, i) => (
        <button key={sl.action} type="button" aria-label={`Ir al banner ${i + 1}`} aria-current={i === idx} onClick={() => setIdx(i)} className="flex h-6 items-center">
          <span className="block h-[2px] transition-all duration-500" style={{ width: i === idx ? 34 : 16, background: i === idx ? t.ink : mix(t.ink, 25, 'transparent') }} />
        </button>
      ))}
    </div>
  );

  return (
    <section className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carrusel">
      {s.onlyImage ? (
        <div className="relative mx-auto h-[420px] max-w-[1440px] overflow-hidden sm:h-[500px] lg:h-[540px]" style={{ background: t.blush }}>
          {photos('absolute inset-0')}
          <button type="button" aria-label={s.title.replace(/\|/g, ' ')} onClick={() => goAction(s.action)} className="absolute inset-0 z-[1]" />
          <div className="absolute bottom-5 left-1/2 z-[2] -translate-x-1/2 bg-white/80 px-3 backdrop-blur">{dots}</div>
        </div>
      ) : (
        <div className="relative mx-auto grid max-w-[1440px] overflow-hidden lg:h-[540px] lg:grid-cols-[1.08fr_1fr]" style={{ background: `linear-gradient(120deg, ${t.blushSoft} 0%, ${t.blush} 55%, ${t.blushDeep} 100%)` }}>
          {photos('relative h-[360px] overflow-hidden sm:h-[440px] lg:h-full')}
          <div className="relative flex items-center px-6 py-12 sm:px-10 lg:px-14 lg:py-0">
            <span aria-hidden className="pointer-events-none absolute -bottom-40 -right-32 h-[520px] w-[520px] rounded-full" style={{ background: `radial-gradient(circle, ${mix(t.primary, 38, 'transparent')} 0%, transparent 68%)` }} />
            <span aria-hidden className="pointer-events-none absolute right-8 top-8 hidden text-[13px] tabular-nums tracking-[0.2em] lg:block" style={{ color: mix(t.ink, 55, 'transparent'), fontFamily: t.serif }}>{String(idx + 1).padStart(2, '0')} — {String(slides.length).padStart(2, '0')}</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={idx} variants={blStagger} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.2 } }} className="relative z-[1] max-w-[440px]">
                {s.eyebrow && <motion.p variants={blHeroText} className={eyebrowCls} style={{ color: t.ink }}>{s.eyebrow}</motion.p>}
                <motion.h1 variants={blHeroText} className="mt-4 whitespace-pre-line text-[44px] font-semibold uppercase leading-[1.02] tracking-[0.01em] sm:text-[54px] lg:text-[60px]" style={{ color: t.ink }}>{lines(s.title)}</motion.h1>
                {s.subtitle && <motion.p variants={blHeroText} className="mt-5 max-w-[320px] text-[14.5px] leading-relaxed" style={{ color: mix(t.ink, 78, t.blush) }}>{s.subtitle}</motion.p>}
                <motion.div variants={blHeroText} className="mt-7">
                  <button type="button" onClick={() => goAction(s.action)} className={`${btnCls} group h-12 px-8`} style={{ background: t.accent, color: t.onAccent }}>
                    {s.button}<Icon icon="solar:arrow-right-linear" width={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                  </button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
            <div className="absolute bottom-5 left-6 z-[1] sm:left-10 lg:left-14">{dots}</div>
          </div>
        </div>
      )}
    </section>
  );
}

// ═════════════════════════════════════════════════════════ BENEFICIOS ══
function BenefitsBar({ t, services }: { t: Theme; services: Service[] }) {
  if (!services.length) return null;
  const cols: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };
  return (
    <section style={{ background: t.blushSoft }}>
      <motion.ul variants={blStagger} initial="hidden" whileInView="show" viewport={blViewport} className={`mx-auto grid max-w-[1280px] grid-cols-2 gap-x-4 gap-y-5 px-4 py-6 lg:px-8 ${cols[services.length] || 'lg:grid-cols-4'}`}>
        {services.map((s) => (
          <motion.li key={s.label} variants={blItem} className="flex items-center gap-3 lg:justify-center">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ boxShadow: `inset 0 0 0 1px ${mix(t.ink, 22, t.blushSoft)}`, color: t.ink }}><Icon icon={s.icon} width={19} /></span>
            <span className="min-w-0 leading-tight">
              <span className="block text-[10.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: t.ink }}>{s.label}</span>
              <span className="mt-0.5 block truncate text-[11.5px]" style={{ color: t.muted }}>{s.sub}</span>
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

// ═════════════════════════════════════════════════════ BANNERS PROMO ══
function PromoBanners({ t, diseno, goAction }: { t: Theme; diseno: any; goAction: (k: string) => void }) {
  const d = diseno || {};
  const banners = [
    { key: 'maquillajePromo1Action', img: d.maquillajePromo1Image || MAQUILLAJE_IMG.promo[0], title: editable(d.maquillajePromo1Title, 'Labios que|hablan'), text: optional(d.maquillajePromo1Text, 'Encuentra tu tono ideal: nudes, rosas y rojos para cada día.'), button: editable(d.maquillajePromo1Button, 'Ver labios'), bg: t.blushDeep },
    { key: 'maquillajePromo2Action', img: d.maquillajePromo2Image || MAQUILLAJE_IMG.promo[1], title: editable(d.maquillajePromo2Title, 'Piel que|brilla'), text: optional(d.maquillajePromo2Text, 'Una piel radiante empieza con la rutina correcta.'), button: editable(d.maquillajePromo2Button, 'Ver skincare'), bg: t.blush },
  ];
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-6 lg:px-8">
      <motion.div variants={blStagger} initial="hidden" whileInView="show" viewport={blViewport} className="grid gap-4 md:grid-cols-2">
        {banners.map((b) => (
          <motion.button key={b.key} type="button" variants={blItem} onClick={() => goAction(b.key)} className="group relative flex min-h-[250px] overflow-hidden text-left sm:min-h-[280px]" style={{ background: b.bg }}>
            <div aria-hidden className="absolute inset-y-0 right-0 w-[58%]">
              <img src={b.img} alt="" loading="lazy" className="h-full w-full object-cover mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-[1.05]" />
            </div>
            <div aria-hidden className="absolute inset-y-0 left-[38%] w-[24%]" style={{ background: `linear-gradient(90deg, ${b.bg}, transparent)` }} />
            <div className="relative z-[1] flex max-w-[52%] flex-col justify-center p-7 sm:p-9">
              <h3 className="whitespace-pre-line text-[24px] font-semibold uppercase leading-[1.05] tracking-[0.02em] sm:text-[28px]" style={{ color: t.ink }}>{lines(b.title)}</h3>
              {b.text && <p className="mt-3 text-[13px] leading-relaxed" style={{ color: mix(t.ink, 75, b.bg) }}>{b.text}</p>}
              <span className={`${btnCls} mt-5 h-9 w-max px-5 text-[10px]`} style={{ background: t.accent, color: t.onAccent }}>{b.button}</span>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════ CATEGORÍAS POPULARES ══
function PopularCategories({ t, diseno, tiles, onPick }: { t: Theme; diseno: any; tiles: { nombre: string; label: string; imagenUrl: string; isProduct: boolean }[]; onPick: (c: string) => void }) {
  const cols: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-12 lg:px-8">
      <SectionHeader t={t} title={editable(diseno?.maquillajeCategoriesTitle, 'Categorías populares')} />
      <motion.div variants={blStagger} initial="hidden" whileInView="show" viewport={blViewport} className={`grid grid-cols-2 gap-3 sm:gap-4 ${cols[tiles.length] || 'lg:grid-cols-4'}`}>
        {tiles.map((c) => {
          const photo = c.imagenUrl && !c.isProduct;
          return (
            <motion.button key={c.nombre} type="button" variants={blItem} onClick={() => onPick(c.nombre)} className="group relative aspect-[4/3] overflow-hidden" style={{ background: c.isProduct ? t.card : `linear-gradient(135deg, ${t.blushSoft}, ${t.blushDeep})` }}>
              {c.imagenUrl && <img src={c.imagenUrl} alt="" loading="lazy" className={`absolute inset-0 h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.06] ${photo ? 'object-cover' : 'object-contain p-6 pb-12 mix-blend-multiply'}`} />}
              {photo && <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-black/5" />}
              <span className={`absolute inset-x-3 text-center text-[14px] font-semibold uppercase tracking-[0.18em] sm:text-[16px] ${photo ? 'top-1/2 -translate-y-1/2 text-white [text-shadow:0_1px_12px_rgba(0,0,0,.25)]' : c.imagenUrl ? 'bottom-4' : 'top-1/2 -translate-y-1/2'}`} style={photo ? undefined : { color: t.ink }}>
                {c.label}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════ INSTAGRAM ══
/**
 * Bloque de comunidad: solo existe si la tienda tiene Instagram real. Las fotos son las que el
 * empresario sube en Personalizar; si no subió ninguna, se muestran fotos reales de sus productos.
 */
function InstagramStrip({ t, diseno, url, products }: { t: Theme; diseno: any; url: string; products: any[] }) {
  const custom = [1, 2, 3, 4].map((n) => String(diseno?.[`maquillajeInsta${n}Image`] || '').trim()).filter(Boolean);
  // Sin fotos propias: productos reales del final de la lista (los primeros ya salen en Destacados).
  const imgs = custom.length ? custom.slice(0, 4) : products.slice(-4).map((p) => p.imagenUrl);
  const fromProducts = !custom.length;
  const handle = editable(diseno?.maquillajeInstaHandle, instagramHandle(url) || 'Instagram');
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-8 lg:px-8">
      <motion.div variants={blStagger} initial="hidden" whileInView="show" viewport={blViewport} className="grid items-center gap-5 lg:grid-cols-[1fr_4fr]">
        <motion.div variants={blItem}>
          <p className="break-all text-[15px] font-semibold uppercase tracking-[0.1em]" style={{ color: t.ink }}>{handle}</p>
          <p className="mt-2 text-[13px]" style={{ color: t.muted }}>{editable(diseno?.maquillajeInstaText, 'Únete a nuestra comunidad')}</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className={`${btnCls} mt-5 h-9 px-5 text-[10px]`} style={{ background: t.accent, color: t.onAccent }}>
            <Icon icon="mdi:instagram" width={15} /> {editable(diseno?.maquillajeInstaButton, 'Síguenos')}
          </a>
        </motion.div>
        {imgs.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {imgs.map((src, i) => (
              <motion.a key={`${src}-${i}`} variants={blItem} href={url} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${handle} en Instagram`} className="group relative aspect-square overflow-hidden" style={{ background: fromProducts ? t.card : t.blush }}>
                <img src={src} alt="" loading="lazy" className={`h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.06] ${fromProducts ? 'object-contain p-5 mix-blend-multiply' : 'object-cover'}`} />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-[opacity,background-color] duration-300 group-hover:bg-black/20 group-hover:opacity-100"><Icon icon="mdi:instagram" width={26} /></span>
              </motion.a>
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════ CLUB ══
/** Banda "Únete al club": abre WhatsApp con el mensaje listo (no hay registro por correo; nunca simula un alta). */
function ClubBand({ t, diseno, wa, storeName }: { t: Theme; diseno: any; wa: (msg?: string) => string | null; storeName: string }) {
  const [name, setName] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const who = name.trim() ? `Soy ${name.trim()}. ` : '';
    const url = wa(`Hola${storeName ? ` ${storeName}` : ''}, ${who}quiero unirme al club para recibir novedades y lanzamientos.`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-6 lg:px-8">
      <motion.div variants={blReveal} initial="hidden" whileInView="show" viewport={blViewport} className="grid items-center gap-6 px-6 py-8 sm:px-10 lg:grid-cols-[1.2fr_1fr]" style={{ background: t.blushDeep }}>
        <div>
          <h2 className="text-[17px] font-semibold uppercase tracking-[0.12em]" style={{ color: t.ink }}>{editable(diseno?.maquillajeClubTitle, 'Únete al club')}</h2>
          <p className="mt-1.5 text-[13px]" style={{ color: mix(t.ink, 75, t.blushDeep) }}>{editable(diseno?.maquillajeClubText, 'Recibe primero nuestras novedades y lanzamientos por WhatsApp.')}</p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" aria-label="Tu nombre" className="h-11 min-w-0 flex-1 appearance-none rounded-[2px] border-0 bg-white/85 bg-none px-4 text-[13px] outline-none placeholder:text-stone-400 focus:ring-0" style={{ color: t.ink }} />
          <button type="submit" className={`${btnCls} h-11 px-6`} style={{ background: t.accent, color: t.onAccent }}>
            <Icon icon="ic:baseline-whatsapp" width={16} /> {editable(diseno?.maquillajeClubButton, 'Unirme')}
          </button>
        </form>
      </motion.div>
    </section>
  );
}
