import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { MotionConfig, motion } from 'framer-motion';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { buildCategoryTiles } from '@/templates/shared/categoryTiles';
import { getProductPricing } from '@/templates/shared/pricing';
import { pocasUnidades, sinStock } from '@/templates/shared/ventaSinStock';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { persistTiendaCart } from '@/utils/tiendaCart';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import {
  KtHeader, KtFooter, KtCartModal, KtProductCard, PaymentBadges, buildServices, tileFor,
  ktTheme, useKtFont, editable, optional, isOn, btnCls, ktMoney, storeNameOf, nameOf, type Theme, type Service,
} from './KarteraParts';
import { SectionHeader, GridSkeleton, OfferCountdown, Confetti, storeChannels, soonestOfferEnd, getName, hasImage, categoryIcon, type OpenFn, type AddFn, type Channels } from './KarteraSections';
import { ktEase, ktHeroText, ktItem, ktReveal, ktStagger, ktViewport, mix } from './motion';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';
const u = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Fotos de ejemplo (reemplazables en Personalizar). */
export const KT_IMG = {
  hero: u('1483985988355-763728e1935b', 1200),
  promo: u('1594223274512-ad4803739b7c', 1100),
  promo2: u('1590874103328-eac38a683ce7', 1100),
};

// ═════════════════════════════════════════════════════════════════ PAGE ══
export default function KarteraHomePage(props: TemplateHomePageProps) {
  const { tienda, slug, productos, allCategories, diseno, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, agregarAlCarrito, actualizarCantidad, loading } = props as any;
  useKtFont();
  const navigate = useNavigate();
  const t = ktTheme(diseno);
  const d = diseno || {};
  const [showFav, setShowFav] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);

  const list: any[] = useMemo(() => (Array.isArray(productos) ? productos : []), [productos]);
  const withImg = useMemo(() => list.filter(hasImage), [list]);
  const categories: string[] = useMemo(() => (allCategories || []).map(getName).filter(Boolean), [allCategories]);

  // Ofertas reales (precio de oferta vigente), de mayor a menor descuento.
  const offers = useMemo(() => list
    .filter((p) => !sinStock(Number(p?.stock ?? 1)) && getProductPricing(p).enOferta)
    .sort((a, b) => getProductPricing(b).porcentajeDescuento - getProductPricing(a).porcentajeDescuento), [list]);
  const maxOff = offers.length ? getProductPricing(offers[0]).porcentajeDescuento : 0;
  // Stock real bajo (y sin variantes, donde el stock por talla/color no es el total).
  const lastUnits = useMemo(() => list.filter((p) => !(Array.isArray(p?.variantes) && p.variantes.length) && pocasUnidades(Number(p?.stock ?? 0))).slice(0, 4), [list]);
  const popular = useMemo(() => {
    // Vitrina de populares: sin agotados; destacados primero.
    const inStock = list.filter((p) => !sinStock(Number(p?.stock ?? 1)));
    const dest = inStock.filter((p) => p?.destacado);
    const rest = inStock.filter((p) => !p?.destacado);
    return [...dest, ...rest].slice(0, 12);
  }, [list]);
  const heroProducts = useMemo(() => {
    const pool = [...offers.filter(hasImage), ...withImg.filter((p) => p?.destacado), ...withImg];
    return pool.filter((p, i) => pool.findIndex((x) => x.id === p.id) === i).slice(0, 4);
  }, [offers, withImg]);
  const buyProduct = useMemo(() => withImg.find((p) => !(Array.isArray(p?.variantes) && p.variantes.length) && !sinStock(Number(p?.stock ?? 1)) && p?.destacado)
    || withImg.find((p) => !(Array.isArray(p?.variantes) && p.variantes.length) && !sinStock(Number(p?.stock ?? 1))) || null, [withImg]);

  const tiles = useMemo(() => buildCategoryTiles({ allCategories, diseno, prefix: 'kartera', count: 8, fallbackImages: [] }).map((tile) => {
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
  const scrollToDeals = () => document.getElementById('kt-ofertas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const alertMsg = editable(d.karteraAlertMessage, 'Hola, quiero recibir avisos de nuevas ofertas y novedades.');

  /** "Comprar ahora": deja el carrito nuevo guardado y lo pasa al checkout (si no, el checkout ve el viejo). */
  const buyNow = (p: any, qty: number) => {
    if (slug === 'preview') { add(p, qty); setMostrarCarrito(true); return; }
    const items: any[] = carrito || [];
    const existe = items.find((it) => it.id === p.id && !it.modificadores?.length);
    const next = existe
      ? items.map((it) => (it === existe ? { ...it, cantidad: Number(it.cantidad || 1) + qty } : it))
      : [...items, { ...p, id: p.id, productoId: p.id, cantidad: qty, precioBase: p.precioUnitario, precioUnitario: Number(p.precioUnitario), modificadores: [] }];
    setCarrito(next);
    persistTiendaCart(slug, next);
    navigate(`/tienda/${slug}/checkout`, { state: { carrito: next, tienda } });
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, fontFamily: t.font }}>
        <KtHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={navigate} active="home" />

        <Hero t={t} diseno={diseno} services={services} products={heroProducts} maxOff={maxOff}
          onCta={() => (d.karteraHeroAction ? goAction('karteraHeroAction') : offers.length ? scrollToDeals() : goCatalog())} goProduct={goProduct} />

        {tiles.length > 0 && <CategoryStrip t={t} diseno={diseno} tiles={tiles} onPick={goCategory} onMore={goCatalog} />}

        {loading && !list.length && (
          <section className="mx-auto max-w-[1400px] px-4 pt-12 sm:px-6"><GridSkeleton t={t} count={4} /></section>
        )}

        {!isOn(d.karteraDealsHidden) && offers.length > 0 && (
          <DailyDeals t={t} diseno={diseno} offers={offers.slice(0, 4)} total={offers.length} endsAt={soonestOfferEnd(offers)} slug={slug} onOpen={goProduct} onAdd={add} onMore={goCatalog} />
        )}

        <PromoDuo t={t} diseno={diseno} ch={ch} maxOff={maxOff} storeName={storeNameOf(tienda)} goAction={goAction} alertMsg={alertMsg} />

        {popular.length > 0 && (
          <section className="mx-auto max-w-[1400px] px-4 pt-14 sm:px-6">
            <SectionHeader t={t} icon="solar:fire-bold-duotone" title={editable(d.karteraPopularTitle, 'Más populares')} subtitle={optional(d.karteraPopularSubtitle, 'Selección de la tienda')} onMore={goCatalog} moreLabel="Ver todo" />
            <motion.div variants={ktStagger} initial="hidden" whileInView="show" viewport={ktViewport} className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6">
              {popular.slice(0, 12).map((p, i) => (
                <motion.div key={`${p.id}-${i}`} variants={ktItem} className="h-full">
                  <KtProductCard producto={p} slug={slug} t={t} onOpen={() => goProduct(p)} onAdd={(q: number) => add(p, q)} />
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        {!isOn(d.karteraLastHidden) && lastUnits.length > 0 && <LastUnits t={t} diseno={diseno} items={lastUnits} onOpen={goProduct} onMore={goCatalog} />}

        <Perks t={t} diseno={diseno} services={services} ch={ch} alertMsg={alertMsg} />

        {!isOn(d.karteraEasyHidden) && <EasyCheckout t={t} diseno={diseno} tienda={tienda} slug={slug} product={buyProduct} onBuy={buyNow} goProduct={goProduct} />}

        <RealReviews t={t} slug={slug} products={list} diseno={diseno} />

        <KtFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <KtCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } })} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.primary} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.primary} onGoProduct={(item: any) => goProduct(item)} />
      </div>
    </MotionConfig>
  );
}

// ═══════════════════════════════════════════════════════════════════ HERO ══
/** Hero de la referencia: titular gigante con la 2ª línea resaltada en lima, chips reales y collage. */
function Hero({ t, diseno, services, products, maxOff, onCta, goProduct }: { t: Theme; diseno: any; services: Service[]; products: any[]; maxOff: number; onCta: () => void; goProduct: OpenFn }) {
  const d = diseno || {};
  const title = editable(d.karteraHeroTitle, 'Carteras que enamoran.');
  const title2 = optional(d.karteraHeroTitle2, 'Precios que convencen.');
  const subtitle = optional(d.karteraHeroSubtitle, 'Compra fácil, paga seguro y luce increíble.');
  const button = editable(d.karteraHeroButton, maxOff > 0 ? 'Ver ofertas del día' : 'Explorar la tienda');
  const chips = isOn(d.karteraHeroChipsHidden) ? [] : [
    ...(maxOff > 0 ? [{ icon: 'solar:tag-price-bold', label: `Hasta -${maxOff}%` }] : []),
    ...services.slice(0, maxOff > 0 ? 2 : 3).map((s) => ({ icon: s.icon, label: s.label })),
  ];
  const image = d.karteraHeroImage || KT_IMG.hero;

  return (
    <section className="relative overflow-hidden">
      <Confetti t={t} dense />
      <div className="relative mx-auto grid max-w-[1400px] items-center gap-10 px-4 pb-10 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-14 lg:pt-14">
        <motion.div variants={ktStagger} initial="hidden" animate="show" className="relative z-10 min-w-0">
          <motion.h1 variants={ktHeroText} className="text-[44px] font-black leading-[0.98] tracking-[-0.04em] sm:text-[64px] xl:text-[78px]" style={{ color: t.ink, fontFamily: t.display }}>
            <span className="block">{title}</span>
            {title2 && (
              <span className="mt-1 block">
                {/* Resaltado tipo marcador: se repite en cada renglón si el texto baja de línea. */}
                <span className="rounded-[8px] px-2 leading-[1.12] [-webkit-box-decoration-break:clone] [box-decoration-break:clone]" style={{ background: t.accent, color: t.onAccent }}>{title2}</span>
              </span>
            )}
          </motion.h1>
          {subtitle && <motion.p variants={ktHeroText} className="mt-6 max-w-lg text-[18px] font-semibold sm:text-[21px]" style={{ color: mix(t.ink, 82, t.bg) }}>{subtitle}</motion.p>}
          {chips.length > 0 && (
            <motion.ul variants={ktHeroText} className="mt-6 flex flex-wrap gap-2">
              {chips.map((c) => (
                <li key={c.label} className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-bold" style={{ borderColor: mix(t.accent, 70, t.ink), background: mix(t.accent, 22, '#fff'), color: t.ink }}>
                  <Icon icon={c.icon} width={15} />{c.label}
                </li>
              ))}
            </motion.ul>
          )}
          <motion.div variants={ktHeroText} className="mt-8">
            <button type="button" onClick={onCta} className={`${btnCls} h-[58px] px-8 text-[16px]`} style={{ background: t.primary, color: t.onPrimary, boxShadow: `0 18px 36px -16px ${t.primary}, 0 0 0 5px ${mix(t.primary, 14, t.bg)}` }}>
              {button} <Icon icon="solar:arrow-right-linear" width={20} />
            </button>
          </motion.div>
        </motion.div>

        <HeroCollage t={t} image={image} products={products} goProduct={goProduct} />
      </div>
    </section>
  );
}

const FLOAT_SPOTS = [
  'left-[0%] top-[4%] w-[30%] rotate-[-6deg]',
  'right-[0%] top-[0%] w-[27%] rotate-[7deg]',
  'left-[2%] bottom-[6%] w-[28%] rotate-[5deg]',
  'right-[2%] bottom-[2%] w-[30%] rotate-[-5deg]',
];

/** Foto principal + productos reales flotando alrededor (con su descuento real). Animación aislada aquí. */
function HeroCollage({ t, image, products, goProduct }: { t: Theme; image: string; products: any[]; goProduct: OpenFn }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: ktEase }} className="relative mx-auto aspect-[1/0.92] w-full max-w-[620px]">
      <div aria-hidden className="absolute inset-[8%] rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, ${mix(t.primary, 30, '#fff')}, ${t.primary} 70%)` }} />
      <div className="absolute inset-x-[19%] inset-y-[6%] overflow-hidden rounded-[999px_999px_36px_36px] shadow-[0_40px_70px_-30px_rgba(23,18,43,0.55)]" style={{ background: t.primary }}>
        <img src={image} alt="" className="h-full w-full object-cover" />
      </div>
      {products.map((p, i) => (
        <div key={p.id} className={`absolute z-10 ${FLOAT_SPOTS[i]}`}>
          <FloatCard t={t} producto={p} delay={i * 0.6} onOpen={() => goProduct(p)} />
        </div>
      ))}
    </motion.div>
  );
}

/** Tarjetita flotante: el envoltorio posiciona/rota (CSS) y este hijo flota con framer (no se mezclan transforms). */
function FloatCard({ t, producto, delay, onOpen }: { t: Theme; producto: any; delay: number; onOpen: () => void }) {
  const pricing = getProductPricing(producto);
  return (
    <motion.button
      type="button" onClick={onOpen} aria-label={producto.descripcion}
      animate={{ y: [0, -10, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay }}
      className="relative block w-full rounded-[18px] bg-white p-2 shadow-[0_22px_40px_-20px_rgba(23,18,43,0.5)]"
    >
      <span className="block aspect-square overflow-hidden rounded-[13px]" style={{ background: tileFor(t, nameOf(producto?.categoria) || producto.descripcion) }}>
        <img src={producto.imagenUrl} alt="" className="h-full w-full object-contain p-2 mix-blend-multiply" />
      </span>
      {pricing.enOferta
        ? <span className="absolute -bottom-2.5 -right-2.5 rounded-full px-2.5 py-1 text-[13px] font-black shadow-md" style={{ background: t.accent, color: t.onAccent, fontFamily: t.display }}>-{pricing.porcentajeDescuento}%</span>
        : <span className="absolute -bottom-2.5 -right-2.5 rounded-full px-2.5 py-1 text-[12px] font-extrabold shadow-md" style={{ background: t.primary, color: t.onPrimary, fontFamily: t.display }}>{ktMoney(pricing.precioFinal).replace('.00', '')}</span>}
    </motion.button>
  );
}

// ═════════════════════════════════════════════════════════════ CATEGORÍAS ══
type Tile = { nombre: string; label: string; imagenUrl: string; isProduct: boolean };

function CategoryStrip({ t, diseno, tiles, onPick, onMore }: { t: Theme; diseno: any; tiles: Tile[]; onPick: (c: string) => void; onMore: () => void }) {
  return (
    <section className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6">
      <div className="rounded-[24px] bg-white p-4 shadow-[0_24px_50px_-40px_rgba(23,18,43,0.5)] sm:p-6">
        <SectionHeader t={t} title={editable(diseno?.karteraCategoriesTitle, 'Compra por categoría')} onMore={onMore} moreLabel={editable(diseno?.karteraCategoriesMore, 'Ver todo')} />
        {/* En escritorio las columnas se reparten según cuántas categorías hay (4 a 8): nunca queda un hueco. */}
        <motion.div variants={ktStagger} initial="hidden" whileInView="show" viewport={ktViewport} className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:[grid-template-columns:var(--kt-cols)] [&::-webkit-scrollbar]:hidden" style={{ ['--kt-cols' as any]: `repeat(${Math.min(8, Math.max(4, tiles.length))}, minmax(0, 1fr))` }}>
          {tiles.map((tile) => {
            const bg = tileFor(t, tile.nombre);
            return (
              <motion.button key={tile.nombre} variants={ktItem} type="button" onClick={() => onPick(tile.nombre)} className="group flex w-[38%] shrink-0 snap-start flex-col overflow-hidden rounded-[16px] text-left sm:w-auto" style={{ background: bg }}>
                <span className="relative block aspect-[1/0.9] overflow-hidden">
                  {tile.imagenUrl
                    ? <img src={tile.imagenUrl} alt="" loading="lazy" className={`h-full w-full transition-transform duration-500 group-hover:scale-[1.07] ${tile.isProduct ? 'object-contain p-3 mix-blend-multiply' : 'object-cover'}`} />
                    : <span className="flex h-full w-full items-center justify-center"><Icon icon={categoryIcon(tile.nombre)} width={54} style={{ color: mix(t.ink, 55, bg) }} /></span>}
                </span>
                <span className="block truncate px-3 py-2.5 text-center text-[13.5px] font-bold" style={{ color: t.ink }}>{tile.label}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════ OFERTAS DEL DÍA ══
function DailyDeals({ t, diseno, offers, total, endsAt, slug, onOpen, onAdd, onMore }: { t: Theme; diseno: any; offers: any[]; total: number; endsAt: number | null; slug: string; onOpen: OpenFn; onAdd: AddFn; onMore: () => void }) {
  const d = diseno || {};
  return (
    <section id="kt-ofertas" className="mx-auto mt-12 max-w-[1400px] scroll-mt-28 px-4 sm:px-6">
      <motion.div variants={ktReveal} initial="hidden" whileInView="show" viewport={ktViewport} className="relative overflow-hidden rounded-[26px] px-4 pb-5 pt-6 sm:px-7 sm:pb-7" style={{ background: `linear-gradient(115deg, ${mix(t.primary, 82, '#0E0A1D')}, ${t.primary} 55%, ${mix(t.primary, 85, '#fff')})` }}>
        <Confetti t={t} />
        <div className="relative mb-6 flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <Icon icon="solar:bolt-bold" width={44} style={{ color: t.accentOnDark }} />
            <div>
              <h2 className="text-[28px] font-black leading-none tracking-[-0.02em] text-white sm:text-[36px]" style={{ fontFamily: t.display }}>{editable(d.karteraDealsTitle, 'Ofertas del día')}</h2>
              <p className="mt-1.5 text-[14.5px] font-semibold text-white/80">{optional(d.karteraDealsSubtitle, `${total} ${total === 1 ? 'producto rebajado' : 'productos rebajados'} ahora mismo`)}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {endsAt && (
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-bold text-white/80">Termina en:</span>
                <OfferCountdown t={t} endsAt={endsAt} light big />
              </div>
            )}
            <button type="button" onClick={onMore} className={`${btnCls} h-12 px-6`} style={{ background: t.accent, color: t.onAccent }}>
              {editable(d.karteraDealsButton, 'Ver todas')} <Icon icon="solar:arrow-right-linear" width={18} />
            </button>
          </div>
        </div>
        <motion.div variants={ktStagger} initial="hidden" whileInView="show" viewport={ktViewport} className="relative grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {offers.map((p) => (
            <motion.div key={p.id} variants={ktItem} className="h-full">
              <KtProductCard producto={p} slug={slug} t={t} tone="#F6F3FF" onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
            </motion.div>
          ))}
          {/* Con menos de 4 ofertas, la fila se cierra con un acceso al catálogo (sin inventar productos). */}
          {offers.length < 4 && (
            <motion.button variants={ktItem} type="button" onClick={onMore} className={`group flex h-full min-h-[220px] flex-col items-start justify-between rounded-[18px] p-6 text-left ${offers.length % 2 === 0 ? 'col-span-2 lg:col-span-1' : ''}`} style={{ background: t.accent, color: t.onAccent }}>
              <Icon icon="solar:tag-horizontal-bold-duotone" width={44} />
              <span>
                <span className="block text-[24px] font-black leading-tight" style={{ fontFamily: t.display }}>{editable(d.karteraDealsMoreTitle, 'Descubre todo el catálogo')}</span>
                <span className="mt-3 inline-flex items-center gap-2 text-[14px] font-bold">{editable(d.karteraDealsButton, 'Ver todas')} <Icon icon="solar:arrow-right-linear" width={18} className="transition-transform group-hover:translate-x-1" /></span>
              </span>
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════ PROMO DUO ══
/** Las dos tarjetas de la referencia: banner lima editable + club por WhatsApp (o 2º banner si no hay WhatsApp). */
function PromoDuo({ t, diseno, ch, maxOff, storeName, goAction, alertMsg }: { t: Theme; diseno: any; ch: Channels; maxOff: number; storeName: string; goAction: (k: string) => void; alertMsg: string }) {
  const d = diseno || {};
  const showClub = ch.hasWhatsapp && !isOn(d.karteraClubHidden);
  const showPromo2 = !showClub && !isOn(d.karteraPromo2Hidden);
  if (isOn(d.karteraPromoHidden) && !showClub && !showPromo2) return null;
  return (
    <section className="mx-auto grid max-w-[1400px] gap-4 px-4 pt-12 sm:px-6 lg:grid-cols-2">
      {!isOn(d.karteraPromoHidden) && (
        <PromoBanner
          t={t} light={false} bg={t.accent} fg={t.onAccent}
          icon="solar:gift-bold-duotone"
          title={editable(d.karteraPromoTitle, 'Arma tu look')}
          subtitle={optional(d.karteraPromoSubtitle, 'Combina cartera, billetera y accesorios.')}
          button={editable(d.karteraPromoButton, 'Explorar combinaciones')}
          image={d.karteraPromoImage || KT_IMG.promo}
          badge={maxOff > 0 && !isOn(d.karteraPromoBadgeHidden) ? `Hasta -${maxOff}%` : ''}
          onClick={() => goAction('karteraPromoAction')}
        />
      )}
      {showClub && (
        <motion.div variants={ktReveal} initial="hidden" whileInView="show" viewport={ktViewport} className="relative overflow-hidden rounded-[24px] p-6 sm:p-8" style={{ background: `linear-gradient(120deg, ${t.primary}, ${mix(t.primary, 70, '#0E0A1D')})`, color: t.onPrimary }}>
          <Confetti t={t} />
          <div aria-hidden className="pointer-events-none absolute -bottom-8 -right-6 hidden sm:block">
            <motion.div animate={{ rotate: [0, -6, 0, 6, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
              <span className="flex h-40 w-40 items-center justify-center rounded-[36px]" style={{ background: `linear-gradient(140deg, ${t.accent}, ${mix(t.accent, 55, t.primary)})`, color: t.onAccent }}>
                <Icon icon="ph:handbag-simple-fill" width={92} />
              </span>
            </motion.div>
          </div>
          <div className="relative max-w-[340px]">
            <div className="flex items-center gap-3">
              <Icon icon="solar:crown-star-bold-duotone" width={38} style={{ color: t.accentOnDark }} />
              <h3 className="text-[24px] font-black leading-tight sm:text-[28px]" style={{ fontFamily: t.display }}>{editable(d.karteraClubTitle, `Club ${storeName}`)}</h3>
            </div>
            <p className="mt-2 text-[14px] font-semibold" style={{ color: mix(t.onPrimary, 80, t.primary) }}>{optional(d.karteraClubSubtitle, 'Únete por WhatsApp y entérate primero.')}</p>
            <ul className="mt-4 space-y-2">
              {[1, 2, 3, 4].map((n) => optional(d[`karteraClubPerk${n}`], ['Novedades antes que nadie', 'Aviso cuando haya ofertas', 'Fotos y colores a pedido', 'Atención personalizada'][n - 1])).filter(Boolean).map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-[14px] font-semibold"><Icon icon="solar:check-circle-bold" width={18} style={{ color: t.accentOnDark }} />{perk}</li>
              ))}
            </ul>
            <a href={ch.wa(alertMsg) || undefined} target="_blank" rel="noopener noreferrer" className={`${btnCls} mt-6 h-12 px-6`} style={{ background: t.accent, color: t.onAccent }}>
              <Icon icon="ic:baseline-whatsapp" width={19} /> {editable(d.karteraClubButton, 'Unirme por WhatsApp')}
            </a>
          </div>
        </motion.div>
      )}
      {showPromo2 && (
        <PromoBanner
          t={t} light bg={t.primary} fg={t.onPrimary}
          icon="solar:stars-bold-duotone"
          title={editable(d.karteraPromo2Title, 'Lo nuevo en la tienda')}
          subtitle={optional(d.karteraPromo2Subtitle, 'Modelos recién llegados para todos los días.')}
          button={editable(d.karteraPromo2Button, 'Ver novedades')}
          image={d.karteraPromo2Image || KT_IMG.promo2}
          badge=""
          onClick={() => goAction('karteraPromo2Action')}
        />
      )}
    </section>
  );
}

function PromoBanner({ t, light, bg, fg, icon, title, subtitle, button, image, badge, onClick }: { t: Theme; light: boolean; bg: string; fg: string; icon: string; title: string; subtitle: string; button: string; image: string; badge: string; onClick: () => void }) {
  return (
    <motion.div variants={ktReveal} initial="hidden" whileInView="show" viewport={ktViewport} className="group relative grid min-h-[250px] overflow-hidden rounded-[24px] sm:grid-cols-[1fr_1.05fr]" style={{ background: bg, color: fg }}>
      <div className="relative z-10 flex flex-col p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <Icon icon={icon} width={38} />
          <h3 className="text-[24px] font-black leading-tight sm:text-[28px]" style={{ fontFamily: t.display }}>{title}</h3>
        </div>
        {subtitle && <p className="mt-2 text-[14.5px] font-semibold opacity-80">{subtitle}</p>}
        <div className="mt-6 sm:mt-auto sm:pt-6">
          <button type="button" onClick={onClick} className={`${btnCls} h-12 px-6`} style={light ? { background: t.accent, color: t.onAccent } : { background: t.chrome, color: '#fff' }}>
            {button} <Icon icon="solar:arrow-right-linear" width={18} />
          </button>
        </div>
      </div>
      <div className="relative min-h-[200px] overflow-hidden">
        <img src={image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05] sm:[mask-image:linear-gradient(90deg,transparent,#000_28%)]" />
        {badge && <span className="absolute right-4 top-4 rounded-full px-3.5 py-1.5 text-[13px] font-black shadow-lg" style={{ background: t.chrome, color: '#fff', fontFamily: t.display }}>{badge}</span>}
      </div>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════ ÚLTIMAS UNIDADES ══
/** "Limited drops" de la referencia, con datos reales: productos con stock bajo (sin variantes). */
function LastUnits({ t, diseno, items, onOpen, onMore }: { t: Theme; diseno: any; items: any[]; onOpen: OpenFn; onMore: () => void }) {
  const d = diseno || {};
  return (
    <section className="mx-auto max-w-[1400px] px-4 pt-14 sm:px-6">
      <motion.div variants={ktReveal} initial="hidden" whileInView="show" viewport={ktViewport} className="relative grid items-center gap-6 overflow-hidden rounded-[26px] p-5 sm:p-7 lg:grid-cols-[240px_1fr_auto]" style={{ background: t.chrome }}>
        <div>
          <div className="flex items-center gap-3">
            <Icon icon="solar:rocket-2-bold-duotone" width={40} style={{ color: t.accentOnDark }} />
            <h2 className="text-[26px] font-black leading-tight text-white" style={{ fontFamily: t.display }}>
              {editable(d.karteraLastTitle, 'Últimas unidades')}
            </h2>
          </div>
          <p className="mt-2 text-[14px] font-semibold text-white/70">{optional(d.karteraLastSubtitle, 'Stock limitado: cuando se acaban, se acaban.')}</p>
        </div>
        <motion.div variants={ktStagger} initial="hidden" whileInView="show" viewport={ktViewport} className="grid grid-cols-2 gap-3 sm:[grid-template-columns:var(--kt-cols)]" style={{ ['--kt-cols' as any]: `repeat(${Math.max(2, items.length)}, minmax(0, 1fr))` }}>
          {items.map((p) => {
            const stock = Number(p?.stock ?? 0);
            return (
              <motion.button key={p.id} variants={ktItem} type="button" onClick={() => onOpen(p)} className="group flex flex-col rounded-[18px] p-2.5 text-left transition-colors" style={{ background: t.chrome2, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08)' }}>
                <span className="block aspect-[4/3] overflow-hidden rounded-[13px] bg-white">
                  {p.imagenUrl ? <img src={p.imagenUrl} alt="" loading="lazy" className="h-full w-full object-contain p-2 mix-blend-multiply transition-transform duration-500 group-hover:scale-105" /> : <span className="flex h-full items-center justify-center"><Icon icon="ph:handbag-simple-light" width={44} style={{ color: t.muted }} /></span>}
                </span>
                <span className="mt-2.5 line-clamp-1 px-1 text-center text-[13px] font-bold text-white">{p.descripcion}</span>
                <span className="mx-auto mt-2 rounded-full border px-3 py-0.5 text-[11.5px] font-extrabold" style={{ borderColor: t.accentOnDark, color: t.accentOnDark }}>{stock === 1 ? 'Última unidad' : `Solo quedan ${stock}`}</span>
              </motion.button>
            );
          })}
        </motion.div>
        <button type="button" onClick={onMore} className={`${btnCls} h-12 w-max px-6`} style={{ background: t.accent, color: t.onAccent }}>
          {editable(d.karteraLastButton, 'Ver catálogo')} <Icon icon="solar:arrow-right-linear" width={18} />
        </button>
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════ BENEFICIOS + AVISOS ══
/** "Grab your coupons" de la referencia → beneficios reales de compra en forma de cupón + avisos por WhatsApp. */
function Perks({ t, diseno, services, ch, alertMsg }: { t: Theme; diseno: any; services: Service[]; ch: Channels; alertMsg: string }) {
  const d = diseno || {};
  const tickets = services.slice(0, 3);
  const showAlert = ch.hasWhatsapp && !isOn(d.karteraAlertHidden);
  if (isOn(d.karteraPerksHidden) && !showAlert) return null;
  return (
    <section className={`mx-auto grid max-w-[1400px] gap-4 px-4 pt-14 sm:px-6 ${showAlert && !isOn(d.karteraPerksHidden) ? 'lg:grid-cols-[1.25fr_1fr]' : ''}`}>
      {!isOn(d.karteraPerksHidden) && (
        <motion.div variants={ktReveal} initial="hidden" whileInView="show" viewport={ktViewport} className="rounded-[24px] bg-white p-5 shadow-[0_24px_50px_-40px_rgba(23,18,43,0.5)] sm:p-7">
          <SectionHeader t={t} icon="solar:ticket-sale-bold-duotone" title={editable(d.karteraPerksTitle, 'Beneficios de tu compra')} subtitle={optional(d.karteraPerksSubtitle, 'Vienen con cada pedido, sin códigos.')} />
          <div className={`grid gap-3 ${tickets.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            {tickets.map((s) => (
              <div key={s.tag} className="relative rounded-[16px] border-2 border-dashed px-4 pb-4 pt-6 text-center" style={{ borderColor: mix(t.primary, 45, '#fff'), background: mix(t.primary, 4, '#fff') }}>
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-3.5 py-1 text-[12px] font-black tracking-[0.06em]" style={{ background: t.primary, color: t.onPrimary, fontFamily: t.display }}>{s.tag}</span>
                <span aria-hidden className="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white" style={{ boxShadow: `inset -2px 0 0 ${mix(t.primary, 45, '#fff')}` }} />
                <span aria-hidden className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white" style={{ boxShadow: `inset 2px 0 0 ${mix(t.primary, 45, '#fff')}` }} />
                <p className="text-[19px] font-black leading-tight" style={{ color: t.ink, fontFamily: t.display }}>{s.value ? `${s.value} ${s.unit || ''}`.trim() : s.label}</p>
                <p className="mt-1 text-[12.5px] font-semibold" style={{ color: t.muted }}>{s.value ? s.label : s.sub}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      {showAlert && <AlertCard t={t} diseno={diseno} url={ch.wa(alertMsg)} message={alertMsg} />}
    </section>
  );
}

/** "Never miss a deal" de la referencia: el teléfono muestra el mensaje real que se enviará por WhatsApp. */
function AlertCard({ t, diseno, url, message }: { t: Theme; diseno: any; url: string | null; message: string }) {
  const d = diseno || {};
  return (
    <motion.div variants={ktReveal} initial="hidden" whileInView="show" viewport={ktViewport} className="relative grid items-center gap-5 overflow-hidden rounded-[24px] p-5 sm:grid-cols-[150px_1fr] sm:p-7" style={{ background: `linear-gradient(120deg, ${mix(t.primary, 70, '#0E0A1D')}, ${t.primary})`, color: t.onPrimary }}>
      <Confetti t={t} />
      <div aria-hidden className="relative mx-auto hidden w-[140px] rotate-[-8deg] rounded-[26px] border-[5px] bg-white p-2.5 shadow-2xl sm:block" style={{ borderColor: t.chrome }}>
        <span className="block rounded-xl px-2.5 py-1.5 text-[11px] font-black" style={{ background: t.primary, color: t.onPrimary, fontFamily: t.display }}>{editable(d.karteraAlertBubble, '¡Aviso de ofertas!')}</span>
        <span className="mt-2 block rounded-xl rounded-tr-sm bg-[#DCF8C6] p-2 text-[10.5px] font-semibold leading-snug text-[#1f2c1f]">{message}</span>
        <span className="mt-2 block h-14 rounded-xl" style={{ background: `linear-gradient(135deg, ${t.accent}, ${mix(t.accent, 50, t.primary)})` }} />
      </div>
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[24px] font-black leading-tight sm:text-[28px]" style={{ fontFamily: t.display }}>{editable(d.karteraAlertTitle, 'No te pierdas ninguna oferta')}</h3>
          <motion.span animate={{ rotate: [0, -14, 12, -8, 0] }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.4 }} className="shrink-0"><Icon icon="solar:bell-bing-bold-duotone" width={40} style={{ color: t.accentOnDark }} /></motion.span>
        </div>
        <p className="mt-2 text-[14px] font-semibold" style={{ color: mix(t.onPrimary, 78, t.primary) }}>{optional(d.karteraAlertText, 'Escríbenos por WhatsApp y te avisamos de las novedades y rebajas.')}</p>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className={`${btnCls} mt-5 h-12 w-full sm:w-max sm:px-7`} style={{ background: t.accent, color: t.onAccent }}>
            <Icon icon="ic:baseline-whatsapp" width={19} /> {editable(d.karteraAlertButton, 'Activar avisos')}
          </a>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════ COMPRA FÁCIL ══
const STEPS = ['Carrito', 'Tus datos', 'Pago', 'Listo'];

/** "Fast, secure & easy checkout": pasos reales del checkout + mini pedido con un producto real que sí se compra. */
function EasyCheckout({ t, diseno, tienda, slug, product, onBuy, goProduct }: { t: Theme; diseno: any; tienda: any; slug: string; product: any | null; onBuy: (p: any, qty: number) => void; goProduct: OpenFn }) {
  const d = diseno || {};
  const envio = Number(tienda?.costoEnvioFijo || 0);
  return (
    <section className="mx-auto max-w-[1400px] px-4 pt-14 sm:px-6">
      <motion.div variants={ktReveal} initial="hidden" whileInView="show" viewport={ktViewport} className="grid items-center gap-6 rounded-[24px] p-5 sm:p-7 lg:grid-cols-[1fr_1.15fr]" style={{ background: `linear-gradient(110deg, ${mix(t.primary, 10, '#fff')}, ${mix(t.primary, 4, '#F2F8FF')})` }}>
        <div>
          <h2 className="text-[26px] font-black leading-tight tracking-[-0.02em] sm:text-[30px]" style={{ color: t.ink, fontFamily: t.display }}>{editable(d.karteraEasyTitle, 'Compra rápida, segura y fácil')}</h2>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-bold" style={{ color: mix(t.ink, 80, '#fff') }}>
            <li className="flex items-center gap-1.5"><Icon icon="solar:card-bold-duotone" width={17} style={{ color: t.primaryInk }} />Medios de pago de la tienda</li>
            <li className="flex items-center gap-1.5"><Icon icon="solar:shield-check-bold-duotone" width={17} style={{ color: t.primaryInk }} />Confirmas antes de pagar</li>
            <li className="flex items-center gap-1.5"><Icon icon="solar:map-arrow-square-bold-duotone" width={17} style={{ color: t.primaryInk }} />Código de seguimiento</li>
          </ul>
          <div className="mt-5"><PaymentBadges slug={slug} fg={t.ink} line={t.line} bg="#fff" /></div>
        </div>

        <div>
          <ol className="mb-4 flex items-center justify-between gap-1 px-1">
            {STEPS.map((s, i) => (
              <li key={s} className="flex flex-1 items-center gap-1.5 last:flex-none">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white" style={{ background: '#22B55E' }}><Icon icon="solar:check-read-linear" width={14} /></span>
                <span className="text-[12px] font-bold" style={{ color: t.ink }}>{s}</span>
                {i < STEPS.length - 1 && <span aria-hidden className="mx-1 hidden h-[2px] flex-1 rounded-full sm:block" style={{ background: mix('#22B55E', 35, '#fff') }} />}
              </li>
            ))}
          </ol>
          {product && <MiniOrder t={t} product={product} envio={envio} acceptsShipping={tienda?.aceptaEnvio !== false} onBuy={onBuy} goProduct={goProduct} />}
        </div>
      </motion.div>
    </section>
  );
}

/** Mini pedido con cantidad propia (estado aislado aquí). */
function MiniOrder({ t, product, envio, acceptsShipping, onBuy, goProduct }: { t: Theme; product: any; envio: number; acceptsShipping: boolean; onBuy: (p: any, qty: number) => void; goProduct: OpenFn }) {
  const [qty, setQty] = useState(1);
  const pricing = getProductPricing(product);
  const subtotal = pricing.precioFinal * qty;
  return (
    <div className="grid gap-4 rounded-[18px] bg-white p-4 shadow-[0_24px_50px_-36px_rgba(23,18,43,0.5)] sm:grid-cols-[1fr_190px]">
      <div className="flex min-w-0 gap-3">
        <button type="button" onClick={() => goProduct(product)} className="h-20 w-20 shrink-0 overflow-hidden rounded-[12px]" style={{ background: t.soft }} aria-label={product.descripcion}>
          <img src={product.imagenUrl} alt="" className="h-full w-full object-contain p-1.5 mix-blend-multiply" />
        </button>
        <div className="min-w-0">
          <p className="line-clamp-2 text-[13.5px] font-bold leading-snug" style={{ color: t.ink }}>{product.descripcion}</p>
          <p className="mt-1 text-[14px] font-extrabold" style={{ color: t.ink, fontFamily: t.display }}>{ktMoney(pricing.precioFinal)}</p>
          <div className="mt-2 flex h-8 w-[92px] items-center justify-between rounded-full px-1" style={{ background: t.soft }}>
            <button type="button" aria-label="Restar" onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-7 w-7 items-center justify-center font-bold" style={{ color: t.primaryInk }}>−</button>
            <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setQty(v === '' ? 1 : Math.max(1, parseInt(v, 10))); }} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[13px] font-bold outline-none focus:ring-0" style={{ color: t.ink }} />
            <button type="button" aria-label="Sumar" onClick={() => setQty(qty + 1)} className="flex h-7 w-7 items-center justify-center font-bold" style={{ color: t.primaryInk }}>+</button>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 text-[12.5px] font-semibold" style={{ color: t.muted }}>
        <div className="flex justify-between"><span>Subtotal</span><span style={{ color: t.ink }}>{ktMoney(subtotal)}</span></div>
        {acceptsShipping && <div className="flex justify-between"><span>Envío</span><span style={{ color: t.ink }}>{envio > 0 ? ktMoney(envio) : 'Al pagar'}</span></div>}
        <div className="mt-1 flex justify-between border-t pt-2 text-[14px] font-extrabold" style={{ borderColor: t.line, color: t.ink }}><span>Total</span><span style={{ fontFamily: t.display }}>{ktMoney(subtotal + (acceptsShipping ? envio : 0))}</span></div>
        <button type="button" onClick={() => onBuy(product, qty)} className={`${btnCls} mt-1.5 h-11 w-full`} style={{ background: t.primary, color: t.onPrimary }}>
          Comprar ahora <Icon icon="solar:arrow-right-linear" width={17} />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════ RESEÑAS ══
type Review = { id: number; clienteNombre?: string; rating: number; comentario?: string; compraVerificada?: boolean; producto: string };

/** "Loved by thousands" con reseñas REALES (máximo 4 productos consultados). Sin reseñas, no se muestra. */
function RealReviews({ t, slug, products, diseno }: { t: Theme; slug: string; products: any[]; diseno: any }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const withReviews = products.filter((p) => Number(p?.ratingCount || 0) > 0).slice(0, 4);
  const key = withReviews.map((p) => p.id).join(',');

  useEffect(() => {
    if (!slug || slug === 'preview' || !key || isOn(diseno?.karteraReviewsHidden)) { setReviews([]); return; }
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
  }, [slug, key, diseno?.karteraReviewsHidden]);

  if (!reviews.length) return null;
  return (
    <section className="mx-auto max-w-[1400px] px-4 pt-14 sm:px-6">
      <div className="grid items-center gap-5 rounded-[24px] bg-white p-5 shadow-[0_24px_50px_-40px_rgba(23,18,43,0.5)] sm:p-7 lg:grid-cols-[230px_1fr]">
        <div className="flex items-center gap-3">
          <Icon icon="solar:heart-bold" width={36} style={{ color: t.primaryInk }} />
          <div>
            <h2 className="text-[22px] font-black leading-tight" style={{ color: t.ink, fontFamily: t.display }}>{editable(diseno?.karteraReviewsTitle, 'Lo que dicen')}</h2>
            <p className="text-[13px] font-semibold" style={{ color: t.muted }}>{optional(diseno?.karteraReviewsSubtitle, 'Reseñas reales de clientas')}</p>
          </div>
        </div>
        <motion.div variants={ktStagger} initial="hidden" whileInView="show" viewport={ktViewport} className={`grid gap-3 ${reviews.length >= 3 ? 'md:grid-cols-3' : reviews.length === 2 ? 'md:grid-cols-2' : ''}`}>
          {reviews.map((r) => (
            <motion.figure key={r.id} variants={ktItem} className="flex gap-3 rounded-[16px] p-4" style={{ background: t.soft }}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-black" style={{ background: tileFor(t, r.clienteNombre), color: t.ink, fontFamily: t.display }}>{(r.clienteNombre || 'C').trim().charAt(0).toUpperCase()}</span>
              <div className="min-w-0">
                <figcaption className="flex flex-wrap items-center gap-x-2 text-[13px] font-bold" style={{ color: t.ink }}>
                  {r.clienteNombre || 'Cliente'}
                  <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon={i < Math.round(r.rating) ? 'solar:star-bold' : 'solar:star-linear'} width={12} className="text-amber-400" />)}</span>
                </figcaption>
                <blockquote className="mt-1 line-clamp-3 text-[12.5px] font-semibold leading-relaxed" style={{ color: mix(t.ink, 78, '#fff') }}>“{String(r.comentario).trim()}”</blockquote>
                <p className="mt-1 truncate text-[11.5px]" style={{ color: t.muted }}>{r.compraVerificada ? 'Compra verificada · ' : ''}{r.producto}</p>
              </div>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

