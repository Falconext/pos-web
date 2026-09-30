import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { getProductPricing } from '@/templates/shared/pricing';
import { buildCategoryTiles } from '@/templates/shared/categoryTiles';
import { resolveHeroIntervalMs, usePreloadImages, slidesVisibles } from '@/templates/shared/heroSlider';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import {
  NordicaHeader, NordicaFooter, NordicaCartModal, NordicaProductCard, buildServices,
  nordicaTheme, useNordicaFont, editable, storeNameOf, isOn, btnCls, type Theme, type Service,
} from './NordicaParts';
import {
  SectionHeader, ProductGrid, GridSkeleton, OfferCountdown, RealReviews, ScriptNote, Eyebrow,
  soonestOfferEnd, storeChannels, getName, hasImage, categoryIcon, type OpenFn, type AddFn,
} from './NordicaSections';
import { mix, ndEase, ndHeroText, ndItem, ndReveal, ndStagger, ndViewport } from './motion';

const HOME_PAGE_SIZE = 30; // límite de productos que carga [slug].tsx para el home
const u = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Fotos de ejemplo (reemplazables en Personalizar). Se exportan para que el editor muestre las mismas. */
export const MUEBLERIA_IMG = {
  hero: [u('1616486338812-3dadae4b4ace', 1900), u('1631679706909-1844bbd07221', 1900), u('1600210492486-724fe5c67fb0', 1900)],
  promo: [u('1493663284031-b7e3aefcae8e', 1100), u('1505693416388-ac5ce068fe85', 1100)],
  story: u('1617806118233-18e1de247200', 1100),
  inspo: u('1586023492125-27b2c045efd7', 1100),
  club: u('1519947486511-46149fa0a254', 900),
  gallery: ['1556228453-efd6c1ff04f6', '1618220179428-22790b461013', '1560185893-a55cbc8c57e8', '1538688525198-9b88f6f53126', '1524758631624-e2822e304c36', '1600585154340-be6161a56a0c'].map((id) => u(id, 600)),
};

// ═════════════════════════════════════════════════════════════════ PAGE ══
export default function NordicaHomePage(props: TemplateHomePageProps) {
  const { tienda, slug, productos, allCategories, diseno, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, agregarAlCarrito, actualizarCantidad, loading } = props as any;
  useNordicaFont();
  const navigate = useNavigate();
  const t = nordicaTheme(diseno);
  const [showFav, setShowFav] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);

  const list: any[] = useMemo(() => (Array.isArray(productos) ? productos : []), [productos]);
  const withImg = useMemo(() => list.filter(hasImage), [list]);
  const categories: string[] = useMemo(() => (allCategories || []).map(getName).filter(Boolean), [allCategories]);
  const featured = useMemo(() => {
    const pool = [...withImg, ...list.filter((p) => !hasImage(p))];
    return [...pool.filter((p) => p?.destacado), ...pool.filter((p) => !p?.destacado)].slice(0, 4);
  }, [list, withImg]);
  const offers = useMemo(() => list.filter((p) => getProductPricing(p).enOferta), [list]);
  const offerEndsAt = useMemo(() => soonestOfferEnd(offers), [offers]);
  const ch = storeChannels(tienda, diseno);
  const services = useMemo(() => buildServices(tienda, ch.hasWhatsapp), [tienda, ch.hasWhatsapp]);
  // Círculos de categoría: imagen del editor > de la categoría > primera foto real de un producto de esa categoría.
  const circles = useMemo(() => buildCategoryTiles({ allCategories, diseno, prefix: 'muebleria', count: 8, fallbackImages: [] }).map((tile) => {
    const fromProduct = tile.imagenUrl ? '' : withImg.find((p) => getName(p?.categoria).toLowerCase() === tile.nombre.toLowerCase())?.imagenUrl || '';
    return { ...tile, imagenUrl: tile.imagenUrl || fromProduct, isProduct: Boolean(fromProduct) };
  }), [allCategories, diseno, withImg]);
  const productImgs = useMemo(() => withImg.map((p) => p.imagenUrl as string), [withImg]);

  const cartCount = (carrito || []).reduce((s: number, i: any) => s + Number(i?.cantidad || 1), 0);
  const goCatalog = () => navigate(`/tienda/${slug}/catalogo`);
  const goCategory = (name: string) => navigate(`/tienda/${slug}/catalogo?category=${encodeURIComponent(name)}`);
  const goProduct: OpenFn = (p) => navigate(`/tienda/${slug}/producto/${p.id}`);
  const add: AddFn = (p, qty = 1) => agregarAlCarrito({ ...p, __cantidad: qty });
  const goAction = (key: string) => runStoreLinkAction(getStoreLinkAction(diseno, key, { defaultType: 'catalog' }), { slug, navigate });
  const joinUrl = ch.wa(`Hola, quiero unirme a la comunidad de ${storeNameOf(tienda)} para recibir novedades.`);
  const productCount = list.length >= HOME_PAGE_SIZE ? `${HOME_PAGE_SIZE}+` : String(list.length);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, fontFamily: t.font }}>
        <NordicaHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={navigate} active="home" />

        <HeroSlider t={t} diseno={diseno} goAction={goAction} stats={[
          ...(list.length ? [{ value: productCount, label: 'Productos' }] : []),
          ...(categories.length ? [{ value: String(categories.length), label: 'Ambientes' }] : []),
          { value: editable(diseno?.muebleriaHeroStatValue, 'Atemporal'), label: editable(diseno?.muebleriaHeroStatLabel, 'Diseño') },
        ]} />
        <BenefitsBar t={t} services={services} />

        {circles.length > 0 && <CategoryCircles t={t} diseno={diseno} circles={circles} onPick={goCategory} onMore={goCatalog} />}
        <PromoPair t={t} diseno={diseno} goAction={goAction} />

        <section className="mx-auto max-w-[1280px] px-4 py-12 lg:px-8">
          <SectionHeader t={t} eyebrow={editable(diseno?.muebleriaFeaturedEyebrow, 'Destacados')} title={editable(diseno?.muebleriaFeaturedTitle, 'Nuestros muebles favoritos')} onMore={goCatalog} />
          {loading && !list.length ? <GridSkeleton t={t} /> : <ProductGrid t={t} products={featured} slug={slug} onOpen={goProduct} onAdd={add} cols="lg:grid-cols-4" />}
        </section>

        {offers.length > 0 && <OffersBand t={t} diseno={diseno} offers={offers} endsAt={offerEndsAt} slug={slug} onOpen={goProduct} onAdd={add} onMore={goCatalog} />}

        <StoryBlock t={t} diseno={diseno} goAction={goAction} />
        <ValuesRow t={t} diseno={diseno} />
        <InspirationBlock t={t} diseno={diseno} goAction={goAction} images={productImgs} />

        <RealReviews t={t} slug={slug} products={list} eyebrow={editable(diseno?.muebleriaReviewsEyebrow, 'Lo que dicen nuestros clientes')} title={editable(diseno?.muebleriaReviewsTitle, 'Hogares que nos eligieron')} />
        <Gallery t={t} diseno={diseno} instagramUrl={ch.instagramUrl} />
        {joinUrl && <Community t={t} diseno={diseno} url={joinUrl} />}

        <NordicaFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <NordicaCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } })} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.primary} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.primary} onGoProduct={(item: any) => goProduct(item)} />
      </div>
    </MotionConfig>
  );
}

// ═════════════════════════════════════════════════════════════════ HERO ══
type Slide = { image: string; onlyImage: boolean; eyebrow: string; title: string; subtitle: string; button: string; note: string; action: string };

function slidesFrom(diseno: any): Slide[] {
  const d = diseno || {};
  const note = (v: any, fb: string) => (v === undefined || v === null ? fb : String(v).trim()); // vacío = sin nota
  return slidesVisibles(d, 'muebleria', [
    { image: d.muebleriaHeroImage || MUEBLERIA_IMG.hero[0], onlyImage: isOn(d.muebleriaHeroOnlyImage), eyebrow: editable(d.muebleriaHeroEyebrow, 'Espacios naturales, mejor vida'), title: editable(d.muebleriaHeroTitle, 'Muebles para un hogar más sereno'), subtitle: editable(d.muebleriaHeroSubtitle, 'Piezas pensadas para la comodidad, el estilo y el día a día de tu casa.'), button: editable(d.muebleriaHeroButton, 'Ver catálogo'), note: note(d.muebleriaHeroNote, 'Un día a día\nmás bonito ♡'), action: 'muebleriaHeroAction' },
    { image: d.muebleriaSlide2Image || MUEBLERIA_IMG.hero[1], onlyImage: isOn(d.muebleriaSlide2OnlyImage), eyebrow: editable(d.muebleriaSlide2Eyebrow, 'Sala'), title: editable(d.muebleriaSlide2Title, 'Sofás que invitan a quedarse'), subtitle: editable(d.muebleriaSlide2Subtitle, 'Formas suaves y tejidos cálidos para el corazón de tu casa.'), button: editable(d.muebleriaSlide2Button, 'Ver sala'), note: note(d.muebleriaSlide2Note, 'Tu rincón\nfavorito ♡'), action: 'muebleriaSlide2Action' },
    { image: d.muebleriaSlide3Image || MUEBLERIA_IMG.hero[2], onlyImage: isOn(d.muebleriaSlide3OnlyImage), eyebrow: editable(d.muebleriaSlide3Eyebrow, 'Dormitorio'), title: editable(d.muebleriaSlide3Title, 'Descanso con calma y estilo'), subtitle: editable(d.muebleriaSlide3Subtitle, 'Camas, veladores y almacenaje para empezar bien cada mañana.'), button: editable(d.muebleriaSlide3Button, 'Ver dormitorio'), note: note(d.muebleriaSlide3Note, 'Dulces\nsueños ♡'), action: 'muebleriaSlide3Action' },
  ]);
}

/** Slider del hero. Aislado: su intervalo solo re-renderiza este componente. */
function HeroSlider({ t, diseno, goAction, stats }: { t: Theme; diseno: any; goAction: (k: string) => void; stats: { value: string; label: string }[] }) {
  const slides = useMemo(() => slidesFrom(diseno), [diseno]);
  const interval = resolveHeroIntervalMs(diseno, 'muebleriaHeroInterval', 7000);
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
    <section className="mx-auto max-w-[1280px] lg:px-8" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative min-h-[420px] overflow-hidden lg:min-h-[600px] lg:rounded-b-[4px]" style={{ background: t.soft }}>
        {/* Fotos apiladas (crossfade sin hueco). Con textos, la foto se funde con el fondo por máscara. */}
        <div aria-hidden className={s.onlyImage ? 'absolute inset-0' : 'absolute inset-x-0 top-0 h-[300px] [mask-image:linear-gradient(180deg,#000_62%,transparent)] lg:inset-y-0 lg:left-auto lg:h-full lg:w-[70%] lg:[mask-image:linear-gradient(90deg,transparent,#000_34%)]'}>
          {slides.map((sl, i) => (
            <motion.img key={sl.action} src={sl.image} alt="" initial={false} animate={{ opacity: i === idx ? 1 : 0, scale: i === idx ? 1 : 1.03 }} transition={{ duration: 1.2, ease: ndEase }} className="absolute inset-0 h-full w-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
          ))}
        </div>

        {s.onlyImage ? (
          <button type="button" aria-label={s.title} onClick={() => goAction(s.action)} className="absolute inset-0 z-[1]" />
        ) : (
          <div className="relative z-[2] flex flex-col px-6 pb-20 pt-[280px] sm:px-10 lg:min-h-[600px] lg:max-w-[560px] lg:justify-center lg:px-14 lg:pb-14 lg:pt-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={idx} variants={ndStagger} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.2 } }}>
                <motion.div variants={ndHeroText}><Eyebrow t={t}>{s.eyebrow}</Eyebrow></motion.div>
                <motion.h1 variants={ndHeroText} className="mt-4 text-[38px] font-medium leading-[1.06] tracking-[-0.025em] sm:text-[48px] lg:text-[54px]" style={{ color: t.ink }}>{s.title}</motion.h1>
                <motion.p variants={ndHeroText} className="mt-5 max-w-sm text-[14.5px] leading-relaxed" style={{ color: mix(t.ink, 72, t.bg) }}>{s.subtitle}</motion.p>
                <motion.div variants={ndHeroText} className="mt-8">
                  <button type="button" onClick={() => goAction(s.action)} className={`${btnCls} group h-12 px-6`} style={{ background: t.primary, color: t.onPrimary }}>
                    {s.button}<Icon icon="solar:arrow-right-linear" width={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                  </button>
                </motion.div>
                {stats.length > 0 && (
                  <motion.dl variants={ndHeroText} className="mt-10 flex items-stretch divide-x" style={{ borderColor: t.line }}>
                    {stats.map((st) => (
                      <div key={st.label} className="flex flex-col-reverse px-5 first:pl-0" style={{ borderColor: mix(t.ink, 18, t.bg) }}>
                        <dt className="text-[11.5px]" style={{ color: t.muted }}>{st.label}</dt>
                        <dd className="text-[19px] font-semibold leading-tight" style={{ color: t.ink }}>{st.value}</dd>
                      </div>
                    ))}
                  </motion.dl>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {!s.onlyImage && <ScriptNote t={t} text={s.note} className="absolute right-8 top-8 z-[2] hidden rotate-[-4deg] text-right [text-shadow:0_1px_12px_rgba(255,255,255,.85)] lg:block" />}

        <div className="absolute bottom-6 right-6 z-[3] flex items-center gap-3 lg:right-10">
          <span className="text-[13px] font-semibold tabular-nums" style={{ color: s.onlyImage ? '#fff' : t.ink }}>{String(idx + 1).padStart(2, '0')}<span className="font-normal opacity-60"> / {String(slides.length).padStart(2, '0')}</span></span>
          <button type="button" aria-label="Banner anterior" onClick={() => step(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur" style={{ color: t.ink }}><Icon icon="solar:alt-arrow-left-linear" width={17} /></button>
          <button type="button" aria-label="Banner siguiente" onClick={() => step(1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm" style={{ color: t.ink }}><Icon icon="solar:alt-arrow-right-linear" width={17} /></button>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════ BENEFICIOS ══
const COLS: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };

function BenefitsBar({ t, services }: { t: Theme; services: Service[] }) {
  if (!services.length) return null;
  return (
    <section className="border-y" style={{ borderColor: t.line, background: mix(t.primary, 4, t.bg) }}>
      <motion.ul variants={ndStagger} initial="hidden" whileInView="show" viewport={ndViewport} className={`mx-auto grid max-w-[1280px] grid-cols-2 gap-y-5 px-4 py-6 lg:px-8 ${COLS[services.length] || 'lg:grid-cols-4'}`}>
        {services.map((s) => (
          <motion.li key={s.label} variants={ndItem} className="flex items-center gap-3 lg:justify-center">
            <Icon icon={s.icon} width={26} className="shrink-0" style={{ color: t.ink }} />
            <div className="min-w-0 leading-tight">
              <p className="text-[12.5px] font-semibold" style={{ color: t.ink }}>{s.label}</p>
              <p className="mt-0.5 text-[11px]" style={{ color: t.muted }}>{s.sub}</p>
            </div>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

// ═══════════════════════════════════════════════════ CÍRCULOS CATEGORÍA ══
function CategoryCircles({ t, diseno, circles, onPick, onMore }: { t: Theme; diseno: any; circles: { nombre: string; label: string; imagenUrl: string; isProduct: boolean }[]; onPick: (c: string) => void; onMore: () => void }) {
  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-14 lg:px-8">
      <SectionHeader t={t} eyebrow={editable(diseno?.muebleriaCategoriesEyebrow, 'Compra por ambiente')} title={editable(diseno?.muebleriaCategoriesTitle, 'Muebles para cada espacio')} onMore={onMore} />
      <motion.div variants={ndStagger} initial="hidden" whileInView="show" viewport={ndViewport} className="grid grid-cols-4 gap-x-3 gap-y-6 sm:gap-x-5 lg:grid-cols-8">
        {circles.map((c) => (
          <motion.button key={c.nombre} type="button" variants={ndItem} onClick={() => onPick(c.nombre)} className="group flex flex-col items-center text-center">
            <span className="relative flex aspect-square w-full max-w-[124px] items-center justify-center overflow-hidden rounded-full transition-shadow duration-300 group-hover:shadow-[0_18px_36px_-22px_rgba(43,38,33,0.55)]" style={{ background: t.soft }}>
              {c.imagenUrl
                ? <img src={c.imagenUrl} alt="" loading="lazy" className={`h-full w-full transition-transform duration-500 group-hover:scale-[1.07] ${c.isProduct ? 'object-contain p-2 mix-blend-multiply' : 'object-cover'}`} />
                : <Icon icon={categoryIcon(c.nombre)} width={38} style={{ color: mix(t.ink, 45, t.bg) }} />}
            </span>
            <span className="mt-3 line-clamp-2 text-[12.5px] font-medium leading-tight" style={{ color: t.ink }}>{c.label}</span>
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ PROMOS ══
function PromoPair({ t, diseno, goAction }: { t: Theme; diseno: any; goAction: (k: string) => void }) {
  if (isOn(diseno?.muebleriaPromosHidden)) return null;
  const d = diseno || {};
  const cards = [
    { key: 'muebleriaPromo1', img: d.muebleriaPromo1Image || MUEBLERIA_IMG.promo[0], eyebrow: editable(d.muebleriaPromo1Eyebrow, 'Colección destacada'), title: editable(d.muebleriaPromo1Title, 'Sala moderna'), text: editable(d.muebleriaPromo1Text, 'Sofás, mesas de centro y más — pensados para la vida real.'), button: editable(d.muebleriaPromo1Button, 'Explorar') },
    { key: 'muebleriaPromo2', img: d.muebleriaPromo2Image || MUEBLERIA_IMG.promo[1], eyebrow: editable(d.muebleriaPromo2Eyebrow, 'Esenciales de dormitorio'), title: editable(d.muebleriaPromo2Title, 'Descansa.\nCon estilo.'), text: editable(d.muebleriaPromo2Text, 'Camas y almacenaje para empezar mejor cada mañana.'), button: editable(d.muebleriaPromo2Button, 'Ver dormitorio') },
  ];
  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-12 lg:px-8">
      <motion.div variants={ndStagger} initial="hidden" whileInView="show" viewport={ndViewport} className="grid gap-4 md:grid-cols-2">
        {cards.map((c) => (
          <motion.button key={c.key} type="button" variants={ndItem} whileHover="hover" onClick={() => goAction(`${c.key}Action`)} className="group relative flex min-h-[230px] overflow-hidden rounded-[6px] text-left" style={{ background: t.soft }}>
            <div aria-hidden className="absolute inset-y-0 right-0 w-[46%] overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_38%)] sm:w-[62%]">
              <motion.img src={c.img} alt="" variants={{ hover: { scale: 1.05 } }} transition={{ duration: 0.7, ease: ndEase }} className="h-full w-full object-cover" />
            </div>
            <div className="relative z-10 flex max-w-[58%] flex-col p-7 sm:p-8">
              <Eyebrow t={t}>{c.eyebrow}</Eyebrow>
              <h3 className="mt-3 whitespace-pre-line text-[24px] font-medium leading-[1.12] tracking-[-0.01em]" style={{ color: t.ink }}>{c.title}</h3>
              <p className="mt-2.5 text-[12.5px] leading-relaxed" style={{ color: t.muted }}>{c.text}</p>
              <span className={`${btnCls} mt-6 h-10 w-max px-5`} style={{ background: t.primary, color: t.onPrimary }}>{c.button}<Icon icon="solar:arrow-right-linear" width={15} /></span>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ OFERTAS ══
/** Solo con ofertas REALES: panel verde bosque + hasta 3 tarjetas, sin huecos. */
function OffersBand({ t, diseno, offers, endsAt, slug, onOpen, onAdd, onMore }: { t: Theme; diseno: any; offers: any[]; endsAt: number | null; slug: string; onOpen: OpenFn; onAdd: AddFn; onMore: () => void }) {
  const items = offers.slice(0, 3);
  const maxOff = Math.max(...offers.map((p) => getProductPricing(p).porcentajeDescuento));
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-6 lg:px-8">
      <motion.div variants={ndReveal} initial="hidden" whileInView="show" viewport={ndViewport} className="flex flex-col gap-4 lg:flex-row">
        <div className="flex min-h-[260px] flex-1 flex-col justify-between rounded-[6px] p-8" style={{ background: t.accent, color: t.onAccent }}>
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] opacity-75">{editable(diseno?.muebleriaOffersEyebrow, 'Precios especiales')}</p>
            <h2 className="mt-3 text-[30px] font-medium leading-tight tracking-[-0.01em]">{editable(diseno?.muebleriaOffersTitle, 'Ofertas de temporada')}</h2>
            <p className="mt-2 text-[13.5px] opacity-80">{offers.length} {offers.length === 1 ? 'pieza' : 'piezas'} con hasta {maxOff}% de descuento.</p>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {endsAt && <div className="flex items-center gap-2"><span className="text-[11.5px] opacity-80">Termina en</span><OfferCountdown t={t} endsAt={endsAt} light /></div>}
            <button type="button" onClick={onMore} className={`${btnCls} h-10 bg-white px-5`} style={{ color: t.ink }}>Ver catálogo <Icon icon="solar:arrow-right-linear" width={15} /></button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:flex lg:shrink-0">
          {items.map((p) => (
            <div key={p.id} className="h-full lg:w-[260px]"><NordicaProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} /></div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ HISTORIA ══
function StoryBlock({ t, diseno, goAction }: { t: Theme; diseno: any; goAction: (k: string) => void }) {
  if (isOn(diseno?.muebleriaStoryHidden)) return null;
  const d = diseno || {};
  const points = [1, 2, 3, 4].map((n, i) => editable(d[`muebleriaPanel${n}`], ['Piezas seleccionadas', 'Acabados cuidados', 'Pensadas para durar', 'Atención cercana'][i]));
  const icons = ['solar:leaf-linear', 'solar:magic-stick-3-linear', 'solar:shield-check-linear', 'solar:hand-heart-linear'];
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-12 lg:px-8">
      <motion.div variants={ndStagger} initial="hidden" whileInView="show" viewport={ndViewport} className="grid overflow-hidden rounded-[6px] lg:grid-cols-[1.15fr_1fr_0.85fr]" style={{ background: '#fff' }}>
        <motion.div variants={ndItem} className="min-h-[280px] overflow-hidden"><img src={d.muebleriaStoryImage || MUEBLERIA_IMG.story} alt="" loading="lazy" className="h-full w-full object-cover" /></motion.div>
        <motion.div variants={ndItem} className="flex flex-col justify-center p-8 sm:p-10">
          <Eyebrow t={t}>{editable(d.muebleriaStoryEyebrow, 'Una forma más bonita de vivir')}</Eyebrow>
          <h2 className="mt-3 text-[28px] font-medium leading-[1.12] tracking-[-0.015em]" style={{ color: t.ink }}>{editable(d.muebleriaStoryTitle, 'Diseño atemporal para la vida moderna')}</h2>
          <p className="mt-4 max-w-sm text-[13.5px] leading-relaxed" style={{ color: t.muted }}>{editable(d.muebleriaStoryText, 'Seleccionamos muebles funcionales y bonitos, cuidando cada detalle para que tu casa se sienta tuya.')}</p>
          <button type="button" onClick={() => goAction('muebleriaStoryAction')} className={`${btnCls} mt-7 h-11 w-max px-5`} style={{ background: t.primary, color: t.onPrimary }}>{editable(d.muebleriaStoryButton, 'Ver colección')}<Icon icon="solar:arrow-right-linear" width={15} /></button>
        </motion.div>
        {!isOn(d.muebleriaPanelHidden) && (
          <motion.div variants={ndItem} className="relative flex flex-col justify-center overflow-hidden p-8 sm:p-10" style={{ background: t.accent, color: t.onAccent }}>
            <Icon aria-hidden icon="ph:tree-evergreen-light" width={260} className="pointer-events-none absolute -bottom-12 -right-10 opacity-[0.08]" />
            <h3 className="relative whitespace-pre-line text-[20px] font-medium leading-snug">{editable(d.muebleriaPanelTitle, 'Mejores hogares,\nmás tranquilos')}</h3>
            <ul className="relative mt-6 space-y-3.5">
              {points.map((pt, i) => (
                <li key={`${pt}-${i}`} className="flex items-center gap-3 text-[13px]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/25"><Icon icon={icons[i]} width={16} /></span>{pt}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ VALORES ══
function ValuesRow({ t, diseno }: { t: Theme; diseno: any }) {
  if (isOn(diseno?.muebleriaValuesHidden)) return null;
  const defs = [
    { icon: 'ph:leaf-light', title: 'Diseño cálido', text: 'Formas simples y acogedoras' },
    { icon: 'ph:diamond-light', title: 'Buena calidad', text: 'Elegida para el uso diario' },
    { icon: 'ph:house-line-light', title: 'Estilo moderno', text: 'Minimal y atemporal' },
    { icon: 'ph:heart-light', title: 'Para tu casa', text: 'Piezas para cada ambiente' },
  ];
  const items = defs.map((v, i) => ({ icon: v.icon, title: editable(diseno?.[`muebleriaValue${i + 1}Title`], v.title), text: editable(diseno?.[`muebleriaValue${i + 1}Text`], v.text) }));
  return (
    <section className="mx-auto max-w-[1280px] px-4 lg:px-8">
      <motion.ul variants={ndStagger} initial="hidden" whileInView="show" viewport={ndViewport} className="grid grid-cols-2 gap-y-8 border-y py-8 lg:grid-cols-4 lg:divide-x" style={{ borderColor: t.line }}>
        {items.map((v) => (
          <motion.li key={v.title} variants={ndItem} className="flex flex-col items-center px-4 text-center" style={{ borderColor: t.line }}>
            <Icon icon={v.icon} width={30} style={{ color: t.ink }} />
            <p className="mt-3 text-[13px] font-semibold" style={{ color: t.ink }}>{v.title}</p>
            <p className="mt-0.5 text-[11.5px]" style={{ color: t.muted }}>{v.text}</p>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════ INSPIRACIÓN ══
function InspirationBlock({ t, diseno, goAction, images }: { t: Theme; diseno: any; goAction: (k: string) => void; images: string[] }) {
  if (isOn(diseno?.muebleriaInspoHidden)) return null;
  const d = diseno || {};
  const collage = [1, 2, 3].map((n, i) => d[`muebleriaInspo${n}Image`] || images[i + 1] || '').filter(Boolean);
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-12 lg:px-8">
      <motion.div variants={ndStagger} initial="hidden" whileInView="show" viewport={ndViewport} className="grid items-stretch gap-6 overflow-hidden rounded-[6px] lg:grid-cols-[1fr_1fr_0.95fr]" style={{ background: mix(t.primary, 4, '#fff') }}>
        <motion.div variants={ndItem} className="min-h-[260px] overflow-hidden"><img src={d.muebleriaInspoImage || MUEBLERIA_IMG.inspo} alt="" loading="lazy" className="h-full w-full object-cover" /></motion.div>
        <motion.div variants={ndItem} className="flex flex-col justify-center px-6 pb-6 lg:px-2 lg:py-10">
          <Eyebrow t={t}>{editable(d.muebleriaInspoEyebrow, 'Inspira tu espacio')}</Eyebrow>
          <h2 className="mt-3 text-[28px] font-medium leading-[1.12] tracking-[-0.015em]" style={{ color: t.ink }}>{editable(d.muebleriaInspoTitle, 'Pequeños cambios, gran diferencia')}</h2>
          <p className="mt-4 max-w-sm text-[13.5px] leading-relaxed" style={{ color: t.muted }}>{editable(d.muebleriaInspoText, 'Ideas y combinaciones para renovar tus ambientes con piezas de nuestro catálogo.')}</p>
          <button type="button" onClick={() => goAction('muebleriaInspoAction')} className={`${btnCls} mt-7 h-11 w-max px-5`} style={{ background: t.primary, color: t.onPrimary }}>{editable(d.muebleriaInspoButton, 'Inspírate')}<Icon icon="solar:arrow-right-linear" width={15} /></button>
        </motion.div>
        {collage.length >= 2 && (
          <motion.div variants={ndItem} className="relative grid grid-cols-2 gap-3 px-6 pb-6 lg:pb-14 lg:pl-0 lg:pr-8 lg:pt-8">
            {collage.slice(0, 3).map((src, i) => (
              <div key={`${src}-${i}`} className={`overflow-hidden rounded-[4px] ${i === 0 ? 'row-span-2' : ''}`} style={{ background: t.soft }}>
                <img src={src} alt="" loading="lazy" className="h-full min-h-[120px] w-full object-cover mix-blend-multiply" />
              </div>
            ))}
            <ScriptNote t={t} text={d.muebleriaInspoNote === undefined || d.muebleriaInspoNote === null ? 'Buen diseño,\ndías más bonitos ♡' : String(d.muebleriaInspoNote).trim()} className="pointer-events-none absolute bottom-2 right-8 hidden rotate-[-4deg] text-right lg:block" />
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ GALERÍA ══
/**
 * Galería de ambientes: fotos subidas en Personalizar (o de ejemplo, reemplazables). Título neutro por defecto:
 * no afirma "hogares reales" si no lo son. El enlace a Instagram solo aparece si la tienda lo configuró.
 */
function Gallery({ t, diseno, instagramUrl }: { t: Theme; diseno: any; instagramUrl: string | null }) {
  if (isOn(diseno?.muebleriaGalleryHidden)) return null;
  const imgs = [1, 2, 3, 4, 5, 6].map((n, i) => diseno?.[`muebleriaGallery${n}Image`] || MUEBLERIA_IMG.gallery[i]);
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-12 lg:px-8">
      <SectionHeader t={t} eyebrow={editable(diseno?.muebleriaGalleryEyebrow, instagramUrl ? 'Síguenos en Instagram' : 'Inspiración')} title={editable(diseno?.muebleriaGalleryTitle, 'Ideas para tu hogar')} right={instagramUrl ? (
        <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2 text-[13px] font-medium" style={{ color: t.ink }}>Ver en Instagram <Icon icon="solar:arrow-right-linear" width={16} className="transition-transform duration-300 group-hover:translate-x-1" /></a>
      ) : undefined} />
      <motion.div variants={ndStagger} initial="hidden" whileInView="show" viewport={ndViewport} className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6">
        {imgs.map((src, i) => (
          <motion.div key={`${src}-${i}`} variants={ndItem} className="group aspect-square overflow-hidden rounded-[4px]" style={{ background: t.soft }}>
            <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ COMUNIDAD ══
function Community({ t, diseno, url }: { t: Theme; diseno: any; url: string }) {
  const d = diseno || {};
  return (
    <section className="mt-6" style={{ background: t.soft }}>
      <motion.div variants={ndReveal} initial="hidden" whileInView="show" viewport={ndViewport} className="relative mx-auto grid max-w-[1280px] items-center gap-6 overflow-hidden px-4 py-12 lg:grid-cols-[1.2fr_1fr] lg:px-8">
        <div className="relative z-10">
          <h2 className="text-[26px] font-medium tracking-[-0.01em]" style={{ color: t.ink }}>{editable(d.muebleriaClubTitle, 'Únete a nuestra comunidad')}</h2>
          <p className="mt-2 max-w-md text-[13.5px] leading-relaxed" style={{ color: t.muted }}>{editable(d.muebleriaClubText, 'Recibe por WhatsApp los nuevos ingresos, ofertas e ideas para tu casa.')}</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className={`${btnCls} mt-6 h-12 px-6`} style={{ background: t.primary, color: t.onPrimary }}>
            <Icon icon="ic:baseline-whatsapp" width={18} /> {editable(d.muebleriaClubButton, 'Unirme por WhatsApp')}
          </a>
        </div>
        <div className="relative hidden h-[220px] lg:block">
          <div aria-hidden className="absolute inset-y-0 left-0 w-[70%] overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_30%)]">
            <img src={d.muebleriaClubImage || MUEBLERIA_IMG.club} alt="" loading="lazy" className="h-full w-full object-cover" />
          </div>
          <ScriptNote t={t} text={d.muebleriaClubNote === undefined || d.muebleriaClubNote === null ? 'Mejores espacios,\npersonas más felices ♡' : String(d.muebleriaClubNote).trim()} className="absolute right-0 top-1/2 -translate-y-1/2 rotate-[-4deg] text-right" />
        </div>
      </motion.div>
    </section>
  );
}
