import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { MotionConfig, animate, motion, useInView, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { buildCategoryTiles } from '@/templates/shared/categoryTiles';
import { getProductPricing } from '@/templates/shared/pricing';
import { getStoreLinkAction, isLinkActionConfigured, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import {
  CalmaHeader, CalmaFooter, CalmaCartModal, CalmaProductCard, Eyebrow, buildServices, tileFor,
  calmaTheme, useCalmaFont, editable, optional, isOn, btnCls, cmPrice, storeNameOf, nameOf, type Theme, type Service,
} from './CalmaParts';
import { SectionHeader, MoreLink, GridSkeleton, storeChannels, getName, hasImage, categoryIcon, type OpenFn, type AddFn, type Channels } from './CalmaSections';
import { cmEase, cmHeroText, cmItem, cmReveal, cmStagger, cmViewport, mix } from './motion';
import { productoEnCategoria, categoriasDeProducto } from '@/components/tienda/navTienda';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';
const HOME_PAGE_SIZE = 30; // límite de productos que carga [slug].tsx para el home
const u = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Fotos de ejemplo (reemplazables en Personalizar). */
export const CALMA_IMG = {
  featured: u('1555041469-a586c61ea9bc', 1100),
  room: u('1631679706909-1844bbd07221', 1400),
  letter: u('1615529182904-14819c35db37', 1200),
  catalog: u('1616486338812-3dadae4b4ace', 1400),
  contact: u('1586023492125-27b2c045efd7', 1400),
};

/** Producto elegido en el editor (selector de productos guarda [{id}]) o null. */
function pickProduct(list: any[], sel: any): any | null {
  const id = Array.isArray(sel) ? sel[0]?.id : null;
  return id ? list.find((p) => String(p.id) === String(id)) || null : null;
}

// ═════════════════════════════════════════════════════════════════ PAGE ══
export default function CalmaHomePage(props: TemplateHomePageProps) {
  const { tienda, slug, productos, allCategories, diseno, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, agregarAlCarrito, actualizarCantidad, loading } = props as any;
  useCalmaFont();
  const navigate = useNavigate();
  const t = calmaTheme(diseno);
  const [showFav, setShowFav] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);

  const list: any[] = useMemo(() => (Array.isArray(productos) ? productos : []), [productos]);
  const withImg = useMemo(() => list.filter(hasImage), [list]);
  const categories: string[] = useMemo(() => (allCategories || []).map(getName).filter(Boolean), [allCategories]);
  // El home trae como máximo 30 productos: solo si llegaron menos, los conteos por categoría son exactos.
  const exact = list.length < HOME_PAGE_SIZE;
  const countIn = (name: string) => list.filter((p) => productoEnCategoria(p, name)).length;

  const featured = useMemo(() => pickProduct(list, diseno?.hogarFeaturedProducts) || withImg.find((p) => p?.destacado) || withImg[0] || null, [list, withImg, diseno?.hogarFeaturedProducts]);
  const roomProduct = useMemo(() => pickProduct(list, diseno?.hogarRoomProducts) || withImg.find((p) => p?.destacado && p !== featured) || withImg.find((p) => p !== featured) || null, [list, withImg, featured, diseno?.hogarRoomProducts]);
  const rating = useMemo(() => {
    const rated = list.filter((p) => Number(p?.ratingCount || 0) > 0 && Number(p?.ratingAvg || 0) > 0);
    const count = rated.reduce((s, p) => s + Number(p.ratingCount), 0);
    const avg = count ? rated.reduce((s, p) => s + Number(p.ratingAvg) * Number(p.ratingCount), 0) / count : 0;
    return { avg, count, thumbs: rated.filter(hasImage).slice(0, 3).map((p) => p.imagenUrl as string) };
  }, [list]);

  const tiles = useMemo(() => buildCategoryTiles({ allCategories, diseno, prefix: 'hogar', count: 5, fallbackImages: [] }).map((tile) => {
    const same = (p: any) => productoEnCategoria(p, tile.nombre);
    const fromProduct = tile.imagenUrl ? '' : withImg.find(same)?.imagenUrl || '';
    const n = exact ? list.filter(same).length : 0;
    return { ...tile, imagenUrl: tile.imagenUrl || fromProduct, isProduct: Boolean(fromProduct), count: n };
  }), [allCategories, diseno, withImg, list, exact]);

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
        <CalmaHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={navigate} active="home" />

        <HeroBento
          t={t} diseno={diseno} tienda={tienda} slug={slug} featured={featured} rating={rating} services={services}
          categories={categories} withImg={withImg} countIn={exact ? countIn : null}
          goAction={goAction} goCategory={goCategory} goProduct={goProduct} add={add}
        />

        {!isOn(diseno?.hogarMarqueeHidden) && <Marquee t={t} words={marqueeWords(diseno, categories)} />}

        {tiles.length > 0 && (
          <section className="mx-auto max-w-[1400px] px-3 pt-14 sm:px-5">
            <SectionHeader t={t} eyebrow={editable(diseno?.hogarCategoriesEyebrow, 'Explora')} title={editable(diseno?.hogarCategoriesTitle, 'Encuentra tu rincón')} onMore={goCatalog} moreLabel={editable(diseno?.hogarCategoriesMore, 'Todos los productos')} />
            <CategoryBento t={t} tiles={tiles} onPick={goCategory} />
          </section>
        )}

        <section className="mx-auto max-w-[1400px] px-3 pt-16 sm:px-5">
          {loading && !list.length ? (
            <>
              <SectionHeader t={t} eyebrow={editable(diseno?.hogarFavEyebrow, 'Los más queridos')} title={editable(diseno?.hogarFavTitle, 'Selección de la casa')} />
              <GridSkeleton t={t} count={4} />
            </>
          ) : list.length > 0 ? (
            <Favorites t={t} diseno={diseno} list={list} slug={slug} onOpen={goProduct} onAdd={add} onMore={goCatalog} />
          ) : null}
        </section>

        {!isOn(diseno?.hogarStoryHidden) && <OurWay t={t} diseno={diseno} list={list} exact={exact} categories={categories} rating={rating} roomProduct={roomProduct} goProduct={goProduct} />}
        {!isOn(diseno?.hogarPromiseHidden) && services.length > 0 && <PromiseSection t={t} diseno={diseno} services={services} />}
        <RealReviews t={t} slug={slug} products={list} diseno={diseno} />
        {!isOn(diseno?.hogarLetterHidden) && ch.hasWhatsapp && <Letter t={t} diseno={diseno} ch={ch} storeName={storeNameOf(tienda)} />}

        <CalmaFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <CalmaCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } })} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.primary} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.primary} onGoProduct={(item: any) => goProduct(item)} />
      </div>
    </MotionConfig>
  );
}

// ═════════════════════════════════════════════════════════════ HERO BENTO ══
type Rating = { avg: number; count: number; thumbs: string[] };

function HeroBento({ t, diseno, tienda, slug, featured, rating, services, categories, withImg, countIn, goAction, goCategory, goProduct, add }: {
  t: Theme; diseno: any; tienda: any; slug: string; featured: any | null; rating: Rating; services: Service[]; categories: string[]; withImg: any[];
  countIn: ((name: string) => number) | null; goAction: (k: string) => void; goCategory: (c: string) => void; goProduct: OpenFn; add: AddFn;
}) {
  const d = diseno || {};
  const cat2 = categories[1] || categories[0] || '';
  const chip = optional(d.hogarHeroChip, 'Nueva temporada · piezas que acaban de llegar');
  const title = editable(d.hogarHeroTitle, 'Objetos serenos para hogares sin prisa.');
  const subtitle = optional(d.hogarHeroSubtitle, 'Madera, lino y cerámica elegidos para durar. Piezas que se ven mejor cuanto más tiempo viven contigo.');
  const button = editable(d.hogarHeroButton, 'Ver la colección');
  const button2 = optional(d.hogarHeroButton2, cat2 ? `Explorar ${cat2.toLowerCase()}` : '');
  const goButton2 = () => (isLinkActionConfigured(d, 'hogarHeroAction2') || !cat2 ? goAction('hogarHeroAction2') : goCategory(cat2));

  // Categoría del mosaico chico: la elegida en el editor o la segunda de la tienda.
  const spotName = String(d.hogarSpotCat || '').trim() || cat2;
  const spotImg = d.hogarSpotImage || withImg.find((p) => productoEnCategoria(p, spotName))?.imagenUrl || '';
  const spotCount = spotName && countIn ? countIn(spotName) : 0;

  return (
    <section className="mx-auto max-w-[1400px] px-3 pt-3 sm:px-5">
      <div className="grid gap-3 lg:grid-cols-[1.42fr_1fr] lg:grid-rows-[auto_auto]">
        {/* Tarjeta principal */}
        <motion.div variants={cmStagger} initial="hidden" animate="show" className="relative flex min-h-[460px] flex-col justify-between overflow-hidden rounded-[32px] p-6 sm:p-9 lg:min-h-[500px]" style={{ background: t.surface }}>
          <div>
            {chip && (
              <motion.span variants={cmHeroText} className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px]" style={{ background: t.soft, color: t.ink }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.accent }} />{chip}
              </motion.span>
            )}
            <motion.h1 variants={cmHeroText} className="mt-7 max-w-[640px] text-[48px] font-semibold leading-[0.93] tracking-[-0.055em] sm:text-[72px] lg:text-[84px]" style={{ color: t.ink, fontFamily: t.display }}>{title}</motion.h1>
          </div>
          <motion.div variants={cmHeroText} className="mt-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              {subtitle && <p className="max-w-[420px] text-[15px] leading-relaxed" style={{ color: mix(t.ink, 72, t.surface) }}>{subtitle}</p>}
              <div className="mt-6 flex flex-wrap gap-2.5">
                <button type="button" onClick={() => goAction('hogarHeroAction')} className={`${btnCls} group h-12 px-6`} style={{ background: t.primary, color: t.onPrimary }}>
                  {button}<Icon icon="solar:arrow-right-linear" width={17} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                </button>
                {button2 && <button type="button" onClick={goButton2} className={`${btnCls} h-12 border bg-white/60 px-6 hover:bg-white`} style={{ borderColor: t.line, color: t.ink }}>{button2}</button>}
              </div>
            </div>
            {rating.count > 0 && (
              <div className="flex items-center gap-3">
                {rating.thumbs.length > 0 && (
                  <span className="flex -space-x-2.5">
                    {rating.thumbs.map((src, i) => <span key={i} className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white" style={{ background: t.tiles[i % t.tiles.length] }}><img src={src} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" /></span>)}
                  </span>
                )}
                <span className="leading-tight">
                  <span className="flex items-center gap-1 text-[13.5px] font-medium" style={{ color: t.ink }}><Icon icon="solar:star-bold" width={14} />{rating.avg.toFixed(1)} de promedio</span>
                  <span className="text-[12.5px]" style={{ color: t.muted }}>en {rating.count} {rating.count === 1 ? 'reseña' : 'reseñas'}</span>
                </span>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Producto estrella (alto, ocupa dos filas) */}
        <FeaturedCard t={t} diseno={diseno} tienda={tienda} product={featured} goProduct={goProduct} add={add} goAction={goAction} />

        {/* Fila inferior: categoría + entrega */}
        <div className="grid gap-3 sm:grid-cols-2">
          {spotName ? (
            <motion.button type="button" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: cmEase, delay: 0.15 }} onClick={() => goCategory(spotName)} className="group relative flex min-h-[220px] overflow-hidden rounded-[32px] p-6 text-left" style={{ background: t.tiles[1] }}>
              <div className="relative z-10 flex flex-col justify-between">
                <Eyebrow t={t}>{editable(d.hogarSpotEyebrow, 'Categoría')}</Eyebrow>
                <div>
                  <p className="text-[28px] font-semibold leading-none tracking-[-0.04em]" style={{ color: t.ink, fontFamily: t.display }}>{editable(d.hogarSpotTitle, spotName)}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-[13px]" style={{ color: mix(t.ink, 70, t.tiles[1]) }}>{spotCount > 0 ? `${spotCount} ${spotCount === 1 ? 'pieza' : 'piezas'}` : 'Ver piezas'} <Icon icon="solar:arrow-right-up-linear" width={14} /></p>
                </div>
              </div>
              {spotImg
                ? <img src={spotImg} alt="" className="absolute bottom-0 right-0 top-0 w-[58%] object-contain p-4 mix-blend-multiply transition-transform duration-700 group-hover:scale-[1.05]" />
                : <Icon icon={categoryIcon(spotName)} width={96} className="absolute bottom-6 right-6" style={{ color: mix(t.ink, 30, t.tiles[1]) }} />}
            </motion.button>
          ) : <div className="hidden sm:block" />}
          <DeliveryCard t={t} tienda={tienda} diseno={diseno} services={services} />
        </div>
      </div>
    </section>
  );
}

/** Tarjeta del producto estrella con sello giratorio. Si la tienda aún no tiene productos con foto, muestra la imagen editable sin precio. */
function FeaturedCard({ t, diseno, tienda, product, goProduct, add, goAction }: { t: Theme; diseno: any; tienda: any; product: any | null; goProduct: OpenFn; add: AddFn; goAction: (k: string) => void }) {
  const d = diseno || {};
  const bg = t.tiles[0];
  const pricing = product ? getProductPricing(product) : null;
  const hasVariants = Array.isArray(product?.variantes) && product.variantes.length > 0;
  const label = product ? (pricing?.enOferta ? `Oferta · -${pricing.porcentajeDescuento}%` : product.destacado ? 'Destacado' : nameOf(product.categoria) || 'Destacado') : editable(d.hogarFeaturedEyebrow, 'Colección');
  const badgeText = editable(d.hogarBadgeText, `${storeNameOf(tienda)} · ${nameOf(product?.categoria) || 'Hogar'} · `);
  const image = d.hogarFeaturedImage || product?.imagenUrl || CALMA_IMG.featured;
  const fromProduct = !d.hogarFeaturedImage && Boolean(product?.imagenUrl);

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: cmEase, delay: 0.08 }} className="relative flex min-h-[520px] flex-col overflow-hidden rounded-[32px] lg:row-span-2" style={{ background: bg }}>
      <div className="relative z-10 flex items-start justify-between gap-4 p-6 sm:p-7">
        <div className="min-w-0">
          <Eyebrow t={t}>{label}</Eyebrow>
          <p className="mt-1.5 line-clamp-2 text-[22px] font-semibold leading-tight tracking-[-0.03em]" style={{ color: t.ink, fontFamily: t.display }}>{product ? product.descripcion : editable(d.hogarFeaturedTitle, 'Piezas para quedarse')}</p>
        </div>
        <RotatingBadge t={t} text={badgeText} />
      </div>
      <button type="button" onClick={() => (product ? goProduct(product) : goAction('hogarHeroAction'))} aria-label={product ? product.descripcion : 'Ver colección'} className="group relative flex flex-1 items-center justify-center px-8">
        <img src={image} alt="" className={`max-h-[420px] w-full transition-transform duration-[900ms] group-hover:scale-[1.04] ${fromProduct ? 'object-contain mix-blend-multiply' : 'h-full rounded-[24px] object-cover'}`} />
        {fromProduct && <span aria-hidden className="pointer-events-none absolute bottom-[8%] left-1/2 h-6 w-[50%] -translate-x-1/2 rounded-[50%] bg-black/15 blur-xl" />}
      </button>
      {product && pricing && (
        <div className="relative z-10 m-3 flex items-center justify-between gap-3 rounded-full bg-white/90 py-1.5 pl-5 pr-1.5 backdrop-blur">
          <span className="text-[17px] font-semibold tracking-[-0.01em]" style={{ color: t.ink, fontFamily: t.display }}>
            {cmPrice(pricing.precioFinal)}{pricing.enOferta && <span className="ml-2 text-[12.5px] font-normal line-through" style={{ color: t.muted, fontFamily: t.font }}>{cmPrice(pricing.precioRegular)}</span>}
          </span>
          <span className="flex items-center gap-1">
            <button type="button" onClick={() => goProduct(product)} className="rounded-full px-3.5 py-2 text-[13px] hover:bg-black/[0.04]" style={{ color: t.ink }}>Detalles</button>
            <button type="button" onClick={() => (hasVariants ? goProduct(product) : add(product, 1))} className={`${btnCls} h-10 px-5`} style={{ background: t.primary, color: t.onPrimary }}>{hasVariants ? 'Elegir' : 'Agregar'}</button>
          </span>
        </div>
      )}
    </motion.div>
  );
}

/** Sello circular con texto que gira. Aislado: su animación infinita no toca a la página. */
function RotatingBadge({ t, text }: { t: Theme; text: string }) {
  const reduce = useReducedMotion();
  const id = useMemo(() => `calma-badge-${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <div className="relative h-[78px] w-[78px] shrink-0" aria-hidden>
      <motion.svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}>
        <defs><path id={id} d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" /></defs>
        <circle cx="50" cy="50" r="49" fill="#fff" />
        <text fontSize="9.5" letterSpacing="2.2" fill={t.ink} style={{ fontFamily: t.mono, textTransform: 'uppercase' }}>
          <textPath href={`#${id}`}>{text.toUpperCase().repeat(text.length < 28 ? 2 : 1)}</textPath>
        </text>
      </motion.svg>
      <span className="absolute inset-0 flex items-center justify-center" style={{ color: t.ink }}><Icon icon="ph:leaf-light" width={22} /></span>
    </div>
  );
}

/** Tarjeta de entrega con datos reales y un camión que recorre la línea. Aislado. */
function DeliveryCard({ t, tienda, diseno, services }: { t: Theme; tienda: any; diseno: any; services: Service[] }) {
  const reduce = useReducedMotion();
  const envio = Number(tienda?.costoEnvioFijo || 0);
  const min = Number(tienda?.tiempoPreparacionMin || 0);
  const delivers = tienda?.aceptaEnvio !== false;
  const title = editable(diseno?.hogarDeliveryTitle, delivers ? (envio > 0 ? `Envío desde ${cmPrice(envio)}` : 'Envío a domicilio') : 'Recojo en tienda');
  const sub = optional(diseno?.hogarDeliveryText, tienda?.aceptaRecojo && min > 0 ? `${delivers ? 'O recógelo: ' : ''}listo en ~${min} min.` : services.find((s) => s.label === 'Seguimiento') ? 'Sigue tu pedido con tu código.' : '');
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: cmEase, delay: 0.22 }} className="flex min-h-[220px] flex-col justify-between rounded-[32px] p-6" style={{ background: t.surface }}>
      <Eyebrow t={t}>{editable(diseno?.hogarDeliveryEyebrow, 'Entrega')}</Eyebrow>
      <div>
        <p className="text-[26px] font-semibold leading-none tracking-[-0.04em]" style={{ color: t.ink, fontFamily: t.display }}>{title}</p>
        {sub && <p className="mt-2 text-[13px]" style={{ color: t.muted }}>{sub}</p>}
        <div className="relative mt-6 h-9">
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed" style={{ borderColor: mix(t.ink, 25, t.surface) }} />
          <div className="absolute inset-y-0 left-0 right-9">
            <motion.div className="absolute inset-0" initial={{ x: '-100%' }} animate={reduce ? { x: '0%' } : { x: ['-100%', '0%'] }} transition={reduce ? { duration: 0 } : { duration: 3.6, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1.2 }}>
              <span className="absolute -right-9 top-0 flex h-9 w-9 items-center justify-center rounded-full" style={{ background: t.accent, color: t.onAccent }}><Icon icon="solar:delivery-bold" width={17} /></span>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════ MARQUEE ══
function marqueeWords(diseno: any, categories: string[]): string[] {
  const custom = String(diseno?.hogarMarquee || '').split(/[,·•\n]/).map((w) => w.trim()).filter(Boolean);
  return custom.length ? custom : categories.slice(0, 8);
}

/** Cinta de palabras grandes. Aislada: el bucle infinito solo anima su propio transform. */
function Marquee({ t, words }: { t: Theme; words: string[] }) {
  const reduce = useReducedMotion();
  if (!words.length) return null;
  const row = (k: string) => (
    <div key={k} className="flex shrink-0 items-center">
      {words.map((w, i) => (
        <span key={`${k}-${i}`} className="flex items-center whitespace-nowrap px-5 text-[44px] font-semibold tracking-[-0.045em] sm:text-[64px]" style={{ color: t.ink, fontFamily: t.display }}>
          {w}<span aria-hidden className="ml-10 h-2.5 w-2.5 rounded-full" style={{ background: t.accent }} />
        </span>
      ))}
    </div>
  );
  return (
    <section aria-label="Lo que encontrarás" className="overflow-hidden py-8">
      <motion.div className="flex w-max" animate={reduce ? undefined : { x: ['0%', '-50%'] }} transition={{ duration: Math.max(18, words.length * 5), ease: 'linear', repeat: Infinity }}>
        {row('a')}{row('b')}
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════ CATEGORÍAS (bento) ══
type Tile = { nombre: string; label: string; imagenUrl: string; isProduct: boolean; count: number };

function CategoryBento({ t, tiles, onPick }: { t: Theme; tiles: Tile[]; onPick: (c: string) => void }) {
  const big = tiles.length >= 3;
  return (
    <motion.div variants={cmStagger} initial="hidden" whileInView="show" viewport={cmViewport} className={`grid grid-cols-2 gap-3 ${big ? 'lg:grid-cols-4 lg:grid-rows-2' : 'lg:grid-cols-2'}`}>
      {tiles.map((c, i) => {
        const hero = big && i === 0;
        const bg = t.tiles[i % t.tiles.length];
        return (
          <motion.button key={c.nombre} type="button" variants={cmItem} onClick={() => onPick(c.nombre)} className={`group relative flex overflow-hidden rounded-[28px] p-5 text-left sm:p-6 ${hero ? 'col-span-2 min-h-[340px] lg:row-span-2 lg:min-h-[560px]' : 'min-h-[200px] lg:min-h-[270px]'}`} style={{ background: bg }}>
            <div className="relative z-10 flex w-full items-start justify-between gap-2">
              <div className="min-w-0">
                <p className={`break-words font-semibold leading-none tracking-[-0.04em] ${hero ? 'text-[34px] sm:text-[44px]' : 'text-[19px] sm:text-[26px]'}`} style={{ color: t.ink, fontFamily: t.display }}>{c.label}</p>
                {c.count > 0 && <p className="mt-2 text-[13px]" style={{ color: mix(t.ink, 65, bg) }}>{c.count} {c.count === 1 ? 'pieza' : 'piezas'}</p>}
              </div>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90 transition-transform duration-300 group-hover:rotate-[-45deg] sm:h-10 sm:w-10" style={{ color: t.ink }}><Icon icon="solar:arrow-right-linear" width={16} /></span>
            </div>
            {c.imagenUrl ? (
              <img src={c.imagenUrl} alt="" loading="lazy" className={`absolute inset-x-0 bottom-0 mx-auto transition-transform duration-700 group-hover:scale-[1.05] ${c.isProduct ? 'h-[68%] w-[78%] object-contain mix-blend-multiply' : 'h-[64%] w-[86%] rounded-t-[22px] object-cover'}`} />
            ) : (
              <Icon icon={categoryIcon(c.nombre)} width={hero ? 150 : 90} className="absolute bottom-6 left-1/2 -translate-x-1/2" style={{ color: mix(t.ink, 28, bg) }} />
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════ FAVORITOS ══
/** Grilla con filtros por categoría (los de la referencia). Estado del filtro aislado aquí. */
function Favorites({ t, diseno, list, slug, onOpen, onAdd, onMore }: { t: Theme; diseno: any; list: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn; onMore: () => void }) {
  const [active, setActive] = useState<string | null>(null);
  const ordered = useMemo(() => [...list.filter((p) => p?.destacado && hasImage(p)), ...list.filter((p) => !(p?.destacado && hasImage(p)))], [list]);
  const filters = useMemo(() => {
    const counts = new Map<string, number>();
    ordered.forEach((p) => categoriasDeProducto(p).forEach((c) => counts.set(c, (counts.get(c) || 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([c]) => c);
  }, [ordered]);
  const shown = (active ? ordered.filter((p) => productoEnCategoria(p, active)) : ordered).slice(0, 8);

  const pills = filters.length > 1 && (
    <div className="-mx-3 flex max-w-[calc(100%+1.5rem)] gap-1 overflow-x-auto px-3 [scrollbar-width:none] sm:mx-0 sm:max-w-full sm:px-0 [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Filtrar por categoría"><div className="flex shrink-0 gap-1 rounded-full p-1" style={{ background: t.surface }}>
      {[null, ...filters].map((c) => {
        const on = active === c;
        return (
          <button key={c ?? '__all'} type="button" role="tab" aria-selected={on} onClick={() => setActive(c)} className="relative rounded-full px-4 py-2 text-[13px] transition-colors" style={{ color: on ? t.onPrimary : t.ink }}>
            {on && <motion.span layoutId="calma-fav-pill" className="absolute inset-0 rounded-full" style={{ background: t.primary }} transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
            <span className="relative whitespace-nowrap">{c ?? 'Todo'}</span>
          </button>
        );
      })}
    </div></div>
  );

  return (
    <>
      <SectionHeader t={t} eyebrow={editable(diseno?.hogarFavEyebrow, 'Los más queridos')} title={editable(diseno?.hogarFavTitle, 'Selección de la casa')} right={pills || <MoreLink t={t} label="Ver todo" onClick={onMore} />} />
      <motion.div key={active ?? 'all'} variants={cmStagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 lg:grid-cols-4">
        {shown.map((p, i) => (
          <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={cmItem} className="h-full">
            <CalmaProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
          </motion.div>
        ))}
      </motion.div>
      {pills && <div className="mt-8 flex justify-center"><MoreLink t={t} label="Ver todos los productos" onClick={onMore} /></div>}
    </>
  );
}

// ═════════════════════════════════════════════════════════ NUESTRA FORMA ══
function OurWay({ t, diseno, list, exact, categories, rating, roomProduct, goProduct }: { t: Theme; diseno: any; list: any[]; exact: boolean; categories: string[]; rating: Rating; roomProduct: any | null; goProduct: OpenFn }) {
  const statement = editable(diseno?.hogarStoryText, 'Cada pieza está hecha para vivirse. Para sentarse, usarse a diario y mudarse de casa contigo. Elegimos lo que dura, no lo que pasa de moda.');
  // Cifras reales: piezas publicadas, categorías y valoración (si existe).
  const stats: { value: number; suffix?: string; label: string; decimals?: number }[] = [];
  if (list.length) stats.push({ value: list.length, suffix: exact ? '' : '+', label: 'piezas en tienda' });
  if (categories.length) stats.push({ value: categories.length, label: categories.length === 1 ? 'categoría' : 'categorías' });
  if (rating.count > 0) stats.push({ value: rating.avg, decimals: 1, label: 'de valoración' });
  const room = diseno?.hogarRoomImage || CALMA_IMG.room;
  const roomPrice = roomProduct ? getProductPricing(roomProduct).precioFinal : 0;

  return (
    <section className="mx-auto max-w-[1400px] px-3 pt-20 sm:px-5">
      <div className="grid gap-3 lg:grid-cols-2">
        <motion.div variants={cmReveal} initial="hidden" whileInView="show" viewport={cmViewport} className="flex flex-col justify-between rounded-[32px] p-7 sm:p-10" style={{ background: t.surface }}>
          <Eyebrow t={t}>{editable(diseno?.hogarStoryEyebrow, 'Nuestra forma')}</Eyebrow>
          <ScrollWords t={t} text={statement} />
          {stats.length > 0 && (
            <div className="mt-10 grid grid-cols-3 gap-4 border-t pt-6" style={{ borderColor: t.line }}>
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-[34px] font-semibold leading-none tracking-[-0.04em] sm:text-[40px]" style={{ color: t.ink, fontFamily: t.display }}><CountUp value={s.value} decimals={s.decimals} />{s.suffix}</p>
                  <p className="mt-1.5 text-[12.5px]" style={{ color: t.muted }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
        <motion.div variants={cmReveal} initial="hidden" whileInView="show" viewport={cmViewport} className="relative min-h-[420px] overflow-hidden rounded-[32px] lg:min-h-[560px]">
          <img src={room} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          {roomProduct && (
            <button type="button" onClick={() => goProduct(roomProduct)} className="group absolute bottom-4 left-4 flex max-w-[calc(100%-2rem)] items-center gap-3 rounded-[20px] bg-white/90 p-2 pr-3 text-left shadow-[0_20px_40px_-24px_rgba(0,0,0,.5)] backdrop-blur">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[14px]" style={{ background: tileFor(t, nameOf(roomProduct.categoria)) }}>
                {roomProduct.imagenUrl ? <img src={roomProduct.imagenUrl} alt="" className="h-full w-full object-contain p-1.5 mix-blend-multiply" /> : <Icon icon="ph:armchair-light" width={24} />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-medium" style={{ color: t.ink }}>{roomProduct.descripcion}</span>
                <span className="block text-[12.5px]" style={{ color: t.muted }}>{editable(diseno?.hogarRoomLabel, 'En este ambiente')} · {cmPrice(roomPrice)}</span>
              </span>
              <span className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:rotate-45" style={{ background: t.primary, color: t.onPrimary }}><Icon icon="solar:arrow-right-up-linear" width={16} /></span>
            </button>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/** Texto que se "enciende" palabra por palabra al hacer scroll (solo opacidad). Aislado. */
function ScrollWords({ t, text }: { t: Theme; text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 45%'] });
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <p ref={ref} className="my-10 text-[30px] font-semibold leading-[1.12] tracking-[-0.035em] sm:text-[40px]" style={{ color: t.ink, fontFamily: t.display }}>
      {words.map((w, i) => <Word key={i} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} reduce={Boolean(reduce)} />)}
    </p>
  );
}

function Word({ word, progress, range, reduce }: { word: string; progress: MotionValue<number>; range: [number, number]; reduce: boolean }) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  return <motion.span style={{ opacity: reduce ? 1 : opacity }}>{word} </motion.span>;
}

/** Cifra que cuenta al entrar en pantalla; escribe en el DOM por ref (sin re-renders). */
function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!inView || reduce) { el.textContent = value.toFixed(decimals); return; }
    const controls = animate(0, value, { duration: 1.4, ease: cmEase, onUpdate: (v) => { el.textContent = v.toFixed(decimals); } });
    return () => controls.stop();
  }, [inView, value, decimals, reduce]);
  return <span ref={ref}>{value.toFixed(decimals)}</span>;
}

// ═════════════════════════════════════════════════════════ LA PROMESA ══
/** Tarjetas de beneficios con datos reales; la cifra grande solo aparece cuando la tienda la tiene. */
function PromiseSection({ t, diseno, services }: { t: Theme; diseno: any; services: Service[] }) {
  const shown = services.slice(0, 4);
  const cols: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };
  return (
    <section className="mx-auto max-w-[1400px] px-3 pt-20 sm:px-5">
      <SectionHeader t={t} eyebrow={editable(diseno?.hogarPromiseEyebrow, 'La promesa')} title={editable(diseno?.hogarPromiseTitle, 'Compra con calma')} />
      <motion.div variants={cmStagger} initial="hidden" whileInView="show" viewport={cmViewport} className={`grid gap-3 sm:grid-cols-2 ${cols[shown.length] || 'lg:grid-cols-4'}`}>
        {shown.map((s, i) => {
          const bg = t.tiles[(i + 2) % t.tiles.length];
          return (
            <motion.div key={s.label} variants={cmItem} className="flex min-h-[230px] flex-col rounded-[28px] p-6" style={{ background: bg }}>
              <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white" style={{ color: t.ink }}><Icon icon={s.icon} width={21} /></span>
              <div className="mt-auto pt-8">
                {s.value && <p className="text-[44px] font-semibold leading-none tracking-[-0.045em]" style={{ color: t.ink, fontFamily: t.display }}>{s.value}<span className="ml-1 text-[18px] tracking-[-0.02em]">{s.unit}</span></p>}
                <p className={`${s.value ? 'mt-3 text-[14px]' : 'text-[22px] tracking-[-0.03em]'} font-semibold`} style={{ color: t.ink, fontFamily: s.value ? t.font : t.display }}>{s.label}</p>
                <p className="mt-1 text-[13px] leading-snug" style={{ color: mix(t.ink, 62, bg) }}>{s.sub}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════ RESEÑAS ══
type Review = { id: number; clienteNombre?: string; rating: number; comentario?: string; compraVerificada?: boolean; producto: string };

/**
 * Reseñas APROBADAS reales. Solo consulta productos que ya reportan ratingCount > 0 (máx. 4 peticiones);
 * si no hay ninguna con comentario, la sección no se muestra. Carga y estado aislados aquí.
 */
function RealReviews({ t, slug, products, diseno }: { t: Theme; slug: string; products: any[]; diseno: any }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const withReviews = products.filter((p) => Number(p?.ratingCount || 0) > 0).slice(0, 4);
  const key = withReviews.map((p) => p.id).join(',');

  useEffect(() => {
    if (!slug || slug === 'preview' || !key || isOn(diseno?.hogarReviewsHidden)) { setReviews([]); return; }
    let alive = true;
    Promise.all(withReviews.map((p) => axios.get(`${BASE_URL}/public/store/${slug}/products/${p.id}/reviews`)
      .then((r) => ((r.data?.data || r.data)?.reviews || []).map((rv: any) => ({ ...rv, producto: p.descripcion })))
      .catch(() => [])))
      .then((all) => {
        if (!alive) return;
        const list: Review[] = all.flat().filter((r: Review) => String(r.comentario || '').trim().length >= 8);
        setReviews(list.sort((a, b) => Number(b.rating) - Number(a.rating)).slice(0, 3));
      });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, key, diseno?.hogarReviewsHidden]);

  if (!reviews.length) return null;
  return (
    <section className="mx-auto max-w-[1400px] px-3 pt-20 sm:px-5">
      <SectionHeader t={t} eyebrow={editable(diseno?.hogarReviewsEyebrow, 'Reseñas')} title={editable(diseno?.hogarReviewsTitle, 'Vivido y querido')} />
      <motion.div variants={cmStagger} initial="hidden" whileInView="show" viewport={cmViewport} className={`grid gap-3 ${reviews.length === 1 ? 'max-w-xl' : reviews.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
        {reviews.map((r) => (
          <motion.figure key={r.id} variants={cmItem} className="flex flex-col rounded-[28px] p-6 sm:p-7" style={{ background: t.surface }}>
            <span className="flex gap-0.5" style={{ color: t.ink }}>{Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon={i < Math.round(r.rating) ? 'solar:star-bold' : 'solar:star-linear'} width={15} />)}</span>
            <blockquote className="mt-4 line-clamp-5 text-[15.5px] leading-relaxed" style={{ color: t.ink }}>“{String(r.comentario).trim()}”</blockquote>
            <figcaption className="mt-auto flex items-center gap-3 pt-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-semibold" style={{ background: t.tiles[r.id % t.tiles.length], color: t.ink }}>{(r.clienteNombre || 'C').trim().charAt(0).toUpperCase()}</span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[14px] font-medium" style={{ color: t.ink }}>{r.clienteNombre || 'Cliente'}</span>
                <span className="block truncate text-[12.5px]" style={{ color: t.muted }}>{r.compraVerificada ? 'Compra verificada · ' : ''}{r.producto}</span>
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════ LA CARTA ══
/** "Newsletter" honesto: no hay envío de correos, así que se une por WhatsApp con el mensaje listo. Estado aislado. */
function Letter({ t, diseno, ch, storeName }: { t: Theme; diseno: any; ch: Channels; storeName: string }) {
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) { setErr('Escribe tu nombre.'); return; }
    setErr('');
    const url = ch.wa(`Hola, soy ${name.trim()} y quiero recibir las novedades de ${storeName}.`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  const image = diseno?.hogarLetterImage || CALMA_IMG.letter;
  return (
    <section className="mx-auto max-w-[1400px] px-3 pt-20 sm:px-5">
      <motion.div variants={cmReveal} initial="hidden" whileInView="show" viewport={cmViewport} className="grid overflow-hidden rounded-[32px] lg:grid-cols-2" style={{ background: t.primary, color: t.onPrimary }}>
        <div className="flex flex-col justify-center p-7 sm:p-12">
          <Eyebrow t={t} light>{editable(diseno?.hogarLetterEyebrow, 'La carta')}</Eyebrow>
          <h2 className="mt-3 max-w-md text-[40px] font-semibold leading-[0.95] tracking-[-0.045em] sm:text-[54px]" style={{ fontFamily: t.display }}>{editable(diseno?.hogarLetterTitle, 'Mira primero lo nuevo.')}</h2>
          <p className="mt-4 max-w-sm text-[14px] leading-relaxed" style={{ color: mix(t.onPrimary, 70, t.primary) }}>{editable(diseno?.hogarLetterText, 'Te escribimos por WhatsApp cuando llegan piezas nuevas. Sin ruido: solo lo que vale la pena.')}</p>
          <form onSubmit={submit} noValidate className="mt-7 flex max-w-md gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={editable(diseno?.hogarLetterPlaceholder, 'Tu nombre')} aria-label="Tu nombre" aria-invalid={Boolean(err)} className="h-12 min-w-0 flex-1 appearance-none rounded-full border-0 bg-none px-5 text-[14px] outline-none placeholder:text-[color:var(--cm-ph)] focus:ring-0" style={{ color: t.onPrimary, background: mix(t.onPrimary, 8, t.primary), ['--cm-ph' as any]: mix(t.onPrimary, 45, t.primary), boxShadow: `inset 0 0 0 1px ${err ? '#F87171' : mix(t.onPrimary, 22, t.primary)}` }} />
            <button type="submit" className={`${btnCls} h-12 shrink-0 px-6`} style={{ background: t.onPrimary, color: t.primary }}>
              <Icon icon="ic:baseline-whatsapp" width={17} /> {editable(diseno?.hogarLetterButton, 'Unirme')}
            </button>
          </form>
          {err && <p className="mt-2 text-[12px] text-rose-300">{err}</p>}
        </div>
        <div className="relative min-h-[280px]"><img src={image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" /></div>
      </motion.div>
    </section>
  );
}
