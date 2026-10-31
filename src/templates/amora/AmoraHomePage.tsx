import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { MotionConfig, motion } from 'framer-motion';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { buildCategoryTiles } from '@/templates/shared/categoryTiles';
import { getProductPricing } from '@/templates/shared/pricing';
import { sinStock } from '@/templates/shared/ventaSinStock';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import {
  AmHeader, AmFooter, AmCartModal, AmProductCard, buildServices, tileFor, PASTELS,
  amTheme, useAmFont, editable, optional, isOn, btnCls, nameOf, type Theme, type Service,
} from './AmoraParts';
import {
  SectionHeader, GridSkeleton, OfferCountdown, Sparkle, HeartDoodle, ScribbleUnderline,
  storeChannels, soonestOfferEnd, getName, hasImage, type OpenFn, type AddFn, type Channels,
} from './AmoraSections';
import { amEase, amHeroText, amItem, amReveal, amStagger, amViewport, mix } from './motion';
import { productoEnCategoria } from '@/components/tienda/navTienda';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';
const u = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Fotos de ejemplo (verificadas, sin logos de marcas; reemplazables en Personalizar). */
export const AM_IMG = {
  hero: u('1483985988355-763728e1935b', 1200),
  promo: u('1605733513597-a8f8341084e6', 900),
  promo2: u('1598532163257-ae3c6b2524b6', 900),
};

/** Ícono ilustrado por palabra clave de la categoría (solo decorativo; la categoría es la real). */
function emojiFor(name: string): string {
  const n = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (/mochil|backpack/.test(n)) return 'fluent-emoji-flat:backpack';
  if (/billeter|monedero|tarjetero|wallet/.test(n)) return 'fluent-emoji-flat:purse';
  if (/maleta|viaje|equipaje/.test(n)) return 'fluent-emoji-flat:luggage';
  if (/sobre|clutch|fiesta|noche/.test(n)) return 'fluent-emoji-flat:clutch-bag';
  if (/maletin|portafolio|laptop|oficina/.test(n)) return 'fluent-emoji-flat:briefcase';
  if (/zapat|calzad|sandal|bota|taco/.test(n)) return 'fluent-emoji-flat:high-heeled-shoe';
  if (/lente|gafa|sol/.test(n)) return 'fluent-emoji-flat:sunglasses';
  if (/reloj/.test(n)) return 'fluent-emoji-flat:watch';
  if (/joy|arete|collar|pulser|anillo|bisuter/.test(n)) return 'fluent-emoji-flat:gem-stone';
  if (/sombrer|gorr/.test(n)) return 'fluent-emoji-flat:womans-hat';
  if (/accesor|correa|llaver|panuel|chalina/.test(n)) return 'fluent-emoji-flat:ribbon';
  if (/tote|shopper|playa/.test(n)) return 'fluent-emoji-flat:shopping-bags';
  return 'fluent-emoji-flat:handbag';
}

/**
 * Totales REALES por categoría (y del catálogo completo) con `products?limit=1`. Aislado en un hook:
 * si la consulta falla o es el preview, no hay número y la UI muestra "Ver colección".
 */
function useCategoryCounts(slug: string, names: string[]) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const key = names.join('|');
  useEffect(() => {
    if (!slug || slug === 'preview') return;
    let alive = true;
    Promise.all(['', ...names].map((c) => axios.get(`${BASE_URL}/public/store/${slug}/products`, { params: { page: 1, limit: 1, ...(c ? { category: c } : {}) } })
      .then((r) => { const body = r.data?.data ?? r.data; const total = Number(body?.total); return [c, Number.isFinite(total) ? total : NaN] as const; })
      .catch(() => [c, NaN] as const)))
      .then((pairs) => { if (alive) setCounts(Object.fromEntries(pairs.filter(([, n]) => Number.isFinite(n)))); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, key]);
  return counts;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// ═════════════════════════════════════════════════════════════════ PAGE ══
export default function AmoraHomePage(props: TemplateHomePageProps) {
  const { tienda, slug, productos, allCategories, diseno, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, agregarAlCarrito, actualizarCantidad, loading } = props;
  useAmFont();
  const navigate = useNavigate();
  const t = amTheme(diseno);
  const d = diseno || {};
  const [showFav, setShowFav] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);

  const list: any[] = useMemo(() => (Array.isArray(productos) ? productos : []), [productos]);
  const withImg = useMemo(() => list.filter(hasImage), [list]);
  const categories: string[] = useMemo(() => (allCategories || []).map(getName).filter(Boolean), [allCategories]);
  const counts = useCategoryCounts(slug, categories.slice(0, 6));

  // Ofertas reales (precio de oferta vigente), de mayor a menor descuento.
  const offers = useMemo(() => list
    .filter((p) => !sinStock(Number(p?.stock ?? 1)) && getProductPricing(p).enOferta)
    .sort((a, b) => getProductPricing(b).porcentajeDescuento - getProductPricing(a).porcentajeDescuento), [list]);
  const maxOff = offers.length ? getProductPricing(offers[0]).porcentajeDescuento : 0;
  // "Elegidos para ti": destacados con foto primero, luego el resto con foto; sin agotados.
  const picks = useMemo(() => {
    const pool = withImg.filter((p) => !sinStock(Number(p?.stock ?? 1)));
    return [...pool.filter((p) => p?.destacado), ...pool.filter((p) => !p?.destacado)].slice(0, 4);
  }, [withImg]);
  const more = useMemo(() => {
    const used = new Set([...picks, ...offers.slice(0, 4)].map((p) => p.id));
    const rest = list.filter((p) => !used.has(p.id) && !sinStock(Number(p?.stock ?? 1))).slice(0, 8);
    // Filas completas de 4 en escritorio (con menos de 4 se muestran todos).
    return rest.length > 4 ? rest.slice(0, rest.length - (rest.length % 4)) : rest;
  }, [list, picks, offers]);

  const tiles = useMemo(() => buildCategoryTiles({ allCategories, diseno, prefix: 'amora', count: 4, fallbackImages: [] }).map((tile) => {
    const same = (p: any) => productoEnCategoria(p, tile.nombre);
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
  const scrollToOffers = () => document.getElementById('ofertas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const showOffers = !isOn(d.amoraDealsHidden) && offers.length > 0;

  // Deep link /tienda/:slug#ofertas (desde el header de otras páginas).
  useEffect(() => {
    if (window.location.hash !== '#ofertas' || !showOffers) return;
    const id = setTimeout(scrollToOffers, 250);
    return () => clearTimeout(id);
  }, [showOffers]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-clip" style={{ background: t.bg, fontFamily: t.font }}>
        <AmHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={navigate} active="home" hasOffers={showOffers} onOffers={scrollToOffers} />

        <Hero t={t} diseno={diseno} tienda={tienda} services={services} thumbs={withImg.slice(0, 3)} total={counts[''] ?? null} maxOff={maxOff}
          onCta={() => (d.amoraHeroAction ? goAction('amoraHeroAction') : goCatalog())}
          onCta2={() => (d.amoraHeroAction2 ? goAction('amoraHeroAction2') : showOffers ? scrollToOffers() : goCatalog())}
          hasOffers={showOffers} />

        {categories.length > 0 && !isOn(d.amoraChipsHidden) && <CollectionChips t={t} names={categories.slice(0, 6)} counts={counts} onPick={goCategory} />}

        {loading && !list.length && (
          <section className="mx-auto max-w-[1320px] px-4 pt-12 sm:px-6"><GridSkeleton t={t} count={4} /></section>
        )}

        {picks.length > 0 && <Picks t={t} diseno={diseno} items={picks} slug={slug} onOpen={goProduct} onAdd={add} onMore={goCatalog} />}

        <FeatureStrip t={t} diseno={diseno} slug={slug} favCount={favoritos.length} services={services} ch={ch} onFav={() => setShowFav(true)} navigate={navigate} />

        {showOffers && (
          <Offers t={t} diseno={diseno} offers={offers.slice(0, 4)} total={offers.length} endsAt={soonestOfferEnd(offers)} slug={slug} onOpen={goProduct} onAdd={add} onMore={goCatalog} />
        )}

        {!isOn(d.amoraStepsHidden) && <EasySteps t={t} diseno={diseno} tienda={tienda} onStart={() => (d.amoraStepsAction ? goAction('amoraStepsAction') : goCatalog())} />}

        <PromoDuo t={t} diseno={diseno} ch={ch} maxOff={maxOff} goAction={goAction} onOffers={showOffers ? scrollToOffers : goCatalog} />

        {tiles.length > 0 && !isOn(d.amoraInspirationHidden) && <Inspiration t={t} diseno={diseno} tiles={tiles} counts={counts} onPick={goCategory} onMore={goCatalog} />}

        {more.length > 0 && (
          <section className="mx-auto max-w-[1320px] px-4 pt-16 sm:px-6">
            <SectionHeader t={t} title={editable(d.amoraMoreTitle, 'Más para descubrir')} subtitle={optional(d.amoraMoreSubtitle, 'Lo nuevo y lo que más se lleva')} onMore={goCatalog} moreLabel="Ver catálogo" />
            <motion.div key={more.map((p) => p.id).join(',')} variants={amStagger} initial="hidden" whileInView="show" viewport={amViewport} className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {more.map((p, i) => (
                <motion.div key={`${p.id}-${i}`} variants={amItem} className="h-full">
                  <AmProductCard producto={p} slug={slug} t={t} onOpen={() => goProduct(p)} onAdd={(q: number) => add(p, q)} />
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        <RealReviews t={t} slug={slug} products={list} diseno={diseno} />

        <AmFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <AmCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } })} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.primary} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.primary} onGoProduct={(item: any) => goProduct(item)} />
      </div>
    </MotionConfig>
  );
}

// ═══════════════════════════════════════════════════════════════════ HERO ══
/**
 * Hero de la referencia: pastilla, titular con la palabra clave en letra manuscrita verde + subrayado,
 * dos botones, prueba social real (total del catálogo + miniaturas reales), foto grande redondeada
 * con tarjetas flotantes de beneficios reales y garabatos decorativos.
 */
function Hero({ t, diseno, tienda, services, thumbs, total, maxOff, onCta, onCta2, hasOffers }: { t: Theme; diseno: any; tienda: any; services: Service[]; thumbs: any[]; total: number | null; maxOff: number; onCta: () => void; onCta2: () => void; hasOffers: boolean }) {
  const d = diseno || {};
  const pill = optional(d.amoraHeroPill, maxOff > 0 ? `Hasta -${maxOff}% en modelos seleccionados` : 'Nueva colección disponible');
  const title = editable(d.amoraHeroTitle, 'Carteras hechas');
  const title2 = editable(d.amoraHeroTitle2, 'para');
  const script = editable(d.amoraHeroScript, 'tu estilo');
  const subtitle = optional(d.amoraHeroSubtitle, 'Encuentra la cartera perfecta para cada momento: diseños que combinan con todo, calidad que se nota y envío hasta tu puerta.');
  const button = editable(d.amoraHeroButton, 'Comprar ahora');
  const button2 = optional(d.amoraHeroButton2, hasOffers ? 'Ver ofertas' : 'Ver catálogo');
  const image = editable(d.amoraHeroImage, AM_IMG.hero);
  const label = optional(d.amoraHeroLabel, 'Elige, combina y luce');
  const label2 = optional(d.amoraHeroLabel2, storeName(tienda));
  const chips = isOn(d.amoraHeroChipsHidden) ? [] : services.slice(0, 2);
  const prep = Number(tienda?.tiempoPreparacionMin || 0);
  const horario = String(tienda?.horarioAtencion || '').trim();
  const proofText = editable(d.amoraHeroProofText, 'listos para elegir hoy');

  return (
    <section className="relative mx-auto max-w-[1320px] px-4 pb-6 pt-8 sm:px-6 lg:pt-12">
      <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_1fr] lg:gap-6">
        <motion.div variants={amStagger} initial="hidden" animate="show" className="relative z-10">
          {pill && (
            <motion.p variants={amHeroText} className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold" style={{ background: t.soft, color: t.primaryInk }}>
              <Icon icon="solar:leaf-bold" width={15} /> {pill}
            </motion.p>
          )}
          <motion.h1 variants={amHeroText} className="mt-5 text-[40px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[56px] lg:text-[62px]" style={{ color: t.ink, fontFamily: t.display }}>
            {title}
            <br />
            {title2}{' '}
            <span className="relative inline-block whitespace-nowrap">
              <span className="relative z-10 text-[1.22em] font-bold leading-none" style={{ fontFamily: t.script, color: t.primaryInk }}>{script}</span>
              <ScribbleUnderline color={t.accent} className="absolute -bottom-1 left-0 h-3 w-full sm:-bottom-2 sm:h-4" />
              <HeartDoodle color={t.accent} className="absolute -right-12 top-1 hidden h-9 w-9 rotate-12 sm:block" />
            </span>
          </motion.h1>
          {subtitle && <motion.p variants={amHeroText} className="mt-6 max-w-[500px] text-[15.5px] leading-relaxed" style={{ color: t.muted }}>{subtitle}</motion.p>}
          <motion.div variants={amHeroText} className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={onCta} className={`${btnCls} h-[52px] px-7 text-[15px]`} style={{ background: t.primary, color: t.onPrimary, boxShadow: `0 16px 30px -16px ${t.primary}` }}>
              {button} <Icon icon="solar:arrow-right-linear" width={19} />
            </button>
            {button2 && (
              <button type="button" onClick={onCta2} className={`${btnCls} h-[52px] border bg-white px-7 text-[15px]`} style={{ borderColor: t.line, color: t.ink }}>
                {button2}
              </button>
            )}
          </motion.div>

          {(thumbs.length > 0 || total) && !isOn(d.amoraHeroProofHidden) ? (
            <motion.div variants={amHeroText} className="mt-9 flex items-center gap-4">
              {thumbs.length > 0 && (
                <div className="flex -space-x-3">
                  {thumbs.map((p) => (
                    <span key={p.id} className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full ring-[3px] ring-white" style={{ background: tileFor(t, nameOf(p.categoria) || p.id) }}>
                      <img src={p.imagenUrl} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" />
                    </span>
                  ))}
                </div>
              )}
              <div className="leading-tight">
                {total ? (
                  <>
                    <p className="text-[17px] font-bold" style={{ color: t.ink, fontFamily: t.display }}>{plural(total, 'modelo', 'modelos')}</p>
                    <p className="text-[13px]" style={{ color: t.muted }}>{proofText}</p>
                  </>
                ) : (
                  <p className="text-[15px] font-semibold first-letter:uppercase" style={{ color: t.ink, fontFamily: t.display }}>{proofText}</p>
                )}
              </div>
            </motion.div>
          ) : null}
        </motion.div>

        <div className="relative mx-auto w-full max-w-[600px]">
          <div aria-hidden className="absolute inset-x-[6%] bottom-0 top-[8%] rounded-[44%_56%_48%_52%/52%_44%_56%_48%]" style={{ background: PASTELS.mint }} />
          <Sparkle color={t.accent} size={26} className="absolute -left-2 top-[14%] z-20" />
          <Sparkle color={t.primary} size={16} className="absolute right-[4%] top-[4%] z-20 opacity-70" />
          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: amEase, delay: 0.1 }} className="relative overflow-hidden rounded-[32px] shadow-[0_40px_70px_-45px_rgba(28,42,33,0.55)]">
            <img src={image} alt={label || 'Colección'} className="aspect-[5/4] w-full object-cover sm:aspect-[6/5]" />
            {(label || label2) && (
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 rounded-[18px] bg-white/90 px-4 py-3 backdrop-blur sm:left-auto sm:right-5 sm:max-w-[290px]">
                <span className="min-w-0 leading-tight">
                  {label && <span className="block truncate text-[14.5px] font-bold" style={{ color: t.ink, fontFamily: t.display }}>{label}</span>}
                  {label2 && <span className="mt-0.5 block truncate text-[12px]" style={{ color: t.muted }}>{label2}</span>}
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: t.accent, color: t.onAccent }}><Icon icon="solar:heart-bold" width={17} /></span>
              </div>
            )}
          </motion.div>

          {chips[0] && (
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: amEase, delay: 0.45 }} className="absolute -left-3 top-[20%] z-20 hidden items-center gap-3 rounded-[18px] bg-white px-4 py-3 shadow-[0_20px_40px_-24px_rgba(28,42,33,0.45)] sm:flex lg:-left-10">
              <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: t.soft, color: t.primaryInk }}><Icon icon={chips[0].icon} width={21} /></span>
              <span className="leading-tight">
                <span className="block text-[13.5px] font-bold" style={{ color: t.ink, fontFamily: t.display }}>{chips[0].label}</span>
                <span className="block text-[11.5px]" style={{ color: t.muted }}>{chips[0].sub}</span>
              </span>
            </motion.div>
          )}
          {(chips[1] || prep > 0 || horario) && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: amEase, delay: 0.6 }} className="absolute -right-2 top-[6%] z-20 hidden max-w-[270px] rounded-[18px] bg-white px-4 py-3 shadow-[0_20px_40px_-24px_rgba(28,42,33,0.45)] md:block lg:-right-6">
              {horario ? (
                <>
                  <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.08em]" style={{ color: t.primaryInk }}><Icon icon="solar:clock-circle-bold" width={14} /> Atención</p>
                  <p className="mt-1 line-clamp-2 text-[13px] font-semibold" style={{ color: t.ink }}>{horario}</p>
                </>
              ) : chips[1] ? (
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: PASTELS.peach, color: t.ink }}><Icon icon={chips[1].icon} width={21} /></span>
                  <span className="leading-tight">
                    <span className="block text-[13.5px] font-bold" style={{ color: t.ink, fontFamily: t.display }}>{chips[1].label}</span>
                    <span className="block text-[11.5px]" style={{ color: t.muted }}>{chips[1].sub}</span>
                  </span>
                </div>
              ) : (
                <p className="text-[13px] font-semibold" style={{ color: t.ink }}>Listo en unos {prep} min</p>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

const storeName = (tienda: any) => tienda?.nombreComercial || tienda?.nombre || '';

// ═══════════════════════════════════════════════════════ CATEGORÍAS ══
/** Fila de "chips" de colección de la referencia: ícono ilustrado + nombre real + total real. */
function CollectionChips({ t, names, counts, onPick }: { t: Theme; names: string[]; counts: Record<string, number>; onPick: (c: string) => void }) {
  return (
    <section className="mx-auto max-w-[1320px] px-4 pt-8 sm:px-6">
      <motion.div key={names.join('|')} variants={amStagger} initial="hidden" whileInView="show" viewport={amViewport} className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6 [&::-webkit-scrollbar]:hidden">
        {names.map((c) => {
          const n = counts[c];
          return (
            <motion.button key={c} variants={amItem} type="button" onClick={() => onPick(c)} whileHover={{ y: -3 }} className="group flex w-[200px] shrink-0 snap-start items-center gap-3 rounded-[18px] border bg-white p-3 text-left transition-shadow hover:shadow-[0_16px_30px_-22px_rgba(28,42,33,0.45)] sm:w-auto" style={{ borderColor: t.line }}>
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px]" style={{ background: tileFor(t, c) }}><Icon icon={emojiFor(c)} width={32} /></span>
              <span className="min-w-0 leading-tight">
                <span className="line-clamp-2 block text-[14px] font-semibold" style={{ color: t.ink, fontFamily: t.display }}>{c}</span>
                <span className="mt-1 block text-[12px]" style={{ color: t.muted }}>{Number.isFinite(n) ? plural(n, 'producto', 'productos') : 'Ver colección'}</span>
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════ ELEGIDOS ══
/** "Elegidos para ti ♡": tarjetas grandes sobre pastel con productos reales. */
function Picks({ t, diseno, items, slug, onOpen, onAdd, onMore }: { t: Theme; diseno: any; items: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn; onMore: () => void }) {
  const tones = [PASTELS.mint, PASTELS.peach, PASTELS.lavender, PASTELS.pink];
  return (
    <section className="mx-auto max-w-[1320px] px-4 pt-14 sm:px-6">
      <SectionHeader t={t} heart title={editable(diseno?.amoraPicksTitle, 'Elegidos para ti')} subtitle={optional(diseno?.amoraPicksSubtitle, 'Los favoritos de la tienda esta temporada')} onMore={onMore} moreLabel="Ver catálogo" />
      <motion.div key={items.map((p) => p.id).join(',')} variants={amStagger} initial="hidden" whileInView="show" viewport={amViewport} className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        {items.map((p, i) => (
          <motion.div key={p.id} variants={amItem} className="h-full">
            <AmProductCard producto={p} slug={slug} t={t} tone={tones[i % tones.length]} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════ FUNCIONES ══
/** Franja de 4 funciones reales de la tienda (favoritos, seguimiento, entrega, asesoría). Cada una hace algo. */
function FeatureStrip({ t, diseno, slug, favCount, services, ch, onFav, navigate }: { t: Theme; diseno: any; slug: string; favCount: number; services: Service[]; ch: Channels; onFav: () => void; navigate: (to: string) => void }) {
  if (isOn(diseno?.amoraFeaturesHidden)) return null;
  const delivery = services[0];
  const items = [
    { icon: 'solar:heart-angle-linear', tone: PASTELS.pink, title: 'Tus favoritos', sub: favCount > 0 ? plural(favCount, 'guardado', 'guardados') : 'Guarda lo que te gusta', onClick: onFav },
    { icon: 'solar:box-minimalistic-linear', tone: PASTELS.sky, title: 'Sigue tu pedido', sub: 'Con tu código de compra', onClick: () => navigate(`/tienda/${slug}/seguimiento`) },
    ...(delivery ? [{ icon: delivery.icon, tone: PASTELS.butter, title: delivery.label, sub: delivery.sub, onClick: () => navigate(`/tienda/${slug}/contacto#faq`) }] : []),
    ch.hasWhatsapp
      ? { icon: 'ic:baseline-whatsapp', tone: PASTELS.mint, title: 'Asesoría por WhatsApp', sub: 'Fotos y medidas reales', onClick: () => { const url = ch.wa('Hola, quiero asesoría para elegir una cartera.'); if (url) window.open(url, '_blank', 'noopener,noreferrer'); } }
      : { icon: 'solar:chat-round-dots-linear', tone: PASTELS.mint, title: 'Escríbenos', sub: 'Resolvemos tus dudas', onClick: () => navigate(`/tienda/${slug}/contacto`) },
  ];
  return (
    <section className="mx-auto max-w-[1320px] px-4 pt-12 sm:px-6">
      <motion.div variants={amStagger} initial="hidden" whileInView="show" viewport={amViewport} className="grid grid-cols-2 gap-2.5 rounded-[24px] border bg-white p-2.5 sm:gap-3 lg:grid-cols-4" style={{ borderColor: t.line }}>
        {items.map((it) => (
          <motion.button key={it.title} variants={amItem} type="button" onClick={it.onClick} className="group flex flex-col items-start gap-2.5 rounded-[18px] p-3 text-left transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-3 sm:p-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ background: it.tone, color: t.ink }}><Icon icon={it.icon} width={24} /></span>
            <span className="min-w-0 leading-tight">
              <span className="line-clamp-2 block text-[14px] font-semibold" style={{ color: t.ink, fontFamily: t.display }}>{it.title}</span>
              <span className="mt-1 line-clamp-2 block text-[12px]" style={{ color: t.muted }}>{it.sub}</span>
            </span>
            <Icon icon="solar:alt-arrow-right-linear" width={16} className="ml-auto hidden shrink-0 transition-transform group-hover:translate-x-0.5 sm:block" style={{ color: t.muted }} />
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════ OFERTAS ══
/** Ofertas reales (precio de oferta vigente). Reloj solo si hay fecha de fin real. */
function Offers({ t, diseno, offers, total, endsAt, slug, onOpen, onAdd, onMore }: { t: Theme; diseno: any; offers: any[]; total: number; endsAt: number | null; slug: string; onOpen: OpenFn; onAdd: AddFn; onMore: () => void }) {
  return (
    <section id="ofertas" className="mx-auto max-w-[1320px] scroll-mt-32 px-4 pt-16 sm:px-6">
      <div className="rounded-[28px] p-4 sm:p-7" style={{ background: PASTELS.peach }}>
        <SectionHeader t={t} icon="solar:tag-price-bold" title={editable(diseno?.amoraDealsTitle, 'Ofertas de la semana')} subtitle={total > 4 ? `${total} productos con precio especial` : optional(diseno?.amoraDealsSubtitle, 'Precios especiales por tiempo limitado')}
          right={endsAt ? <div className="flex items-center gap-3"><span className="hidden text-[13px] font-semibold sm:block" style={{ color: t.ink }}>Termina en</span><OfferCountdown t={t} endsAt={endsAt} /></div> : undefined} />
        <motion.div key={offers.map((p) => p.id).join(',')} variants={amStagger} initial="hidden" whileInView="show" viewport={amViewport} className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {offers.map((p) => (
            <motion.div key={p.id} variants={amItem} className="h-full">
              <AmProductCard producto={p} slug={slug} t={t} tone="#FFFFFF" onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
            </motion.div>
          ))}
          {offers.length < 4 && (
            <motion.button variants={amItem} type="button" onClick={onMore} className={`group hidden h-full min-h-[280px] flex-col items-center justify-center rounded-[20px] border-2 border-dashed p-6 text-center lg:flex ${offers.length === 2 ? 'lg:col-span-2' : ''} ${offers.length === 1 ? 'lg:col-span-3' : ''}`} style={{ borderColor: mix(t.ink, 18, PASTELS.peach) }}>
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white transition-transform duration-300 group-hover:scale-110" style={{ color: t.primaryInk }}><Icon icon="solar:bag-heart-linear" width={26} /></span>
              <span className="mt-4 text-[17px] font-bold" style={{ color: t.ink, fontFamily: t.display }}>{editable(diseno?.amoraDealsMoreTitle, 'Descubre todo el catálogo')}</span>
              <span className="mt-1 text-[13px]" style={{ color: t.muted }}>Más modelos te esperan</span>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold" style={{ color: t.primaryInk }}>Ver catálogo <Icon icon="solar:arrow-right-linear" width={16} className="transition-transform group-hover:translate-x-1" /></span>
            </motion.button>
          )}
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════ CÓMO COMPRAR ══
/** Banda mantequilla "Comprar es así de fácil": 4 pasos con flechas punteadas. El último depende de la entrega real. */
function EasySteps({ t, diseno, tienda, onStart }: { t: Theme; diseno: any; tienda: any; onStart: () => void }) {
  const envio = tienda?.aceptaEnvio !== false;
  const recojo = Boolean(tienda?.aceptaRecojo);
  const steps = [
    { icon: 'solar:magnifer-linear', title: 'Elige', sub: 'Explora y encuentra tu modelo' },
    { icon: 'solar:cart-plus-linear', title: 'Agrega al carrito', sub: 'Ajusta la cantidad que quieras' },
    { icon: 'solar:card-linear', title: 'Paga seguro', sub: 'Confirmas antes de pagar' },
    { icon: envio ? 'solar:delivery-linear' : 'solar:shop-2-linear', title: envio && recojo ? 'Recíbela o recógela' : envio ? 'Recíbela en casa' : 'Recógela en tienda', sub: envio && recojo ? 'Envío a domicilio o recojo' : envio ? 'Hasta la puerta de tu casa' : 'Sin costo de envío' },
  ];
  return (
    <section className="mx-auto max-w-[1320px] px-4 pt-16 sm:px-6">
      <motion.div variants={amReveal} initial="hidden" whileInView="show" viewport={amViewport} className="relative overflow-hidden rounded-[28px] px-5 py-9 sm:px-10 sm:py-11" style={{ background: PASTELS.butter }}>
        <Sparkle color={t.accent} size={22} className="absolute right-8 top-7 hidden sm:block" />
        <div className="grid items-center gap-9 lg:grid-cols-[300px_1fr]">
          <div>
            <h2 className="text-[28px] font-bold leading-[1.1] tracking-[-0.02em] sm:text-[34px]" style={{ color: t.ink, fontFamily: t.display }}>
              {editable(diseno?.amoraStepsTitle, 'Comprar es')}
              <span className="block text-[1.2em] leading-[1.05]" style={{ fontFamily: t.script, color: t.primaryInk }}>{editable(diseno?.amoraStepsScript, 'así de fácil')}</span>
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed" style={{ color: t.muted }}>{optional(diseno?.amoraStepsText, 'Cuatro pasos y tu cartera nueva va en camino.')}</p>
            <button type="button" onClick={onStart} className={`${btnCls} mt-6 h-12 px-6`} style={{ background: t.primary, color: t.onPrimary }}>
              {editable(diseno?.amoraStepsButton, 'Empezar a comprar')} <Icon icon="solar:arrow-right-linear" width={18} />
            </button>
          </div>
          <ol className="grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="relative flex flex-col items-center text-center">
                {i < steps.length - 1 && (
                  <svg aria-hidden viewBox="0 0 120 20" className="absolute left-[calc(50%+42px)] top-7 hidden h-5 w-[calc(100%-84px)] md:block" preserveAspectRatio="none" fill="none" stroke={mix(t.ink, 35, PASTELS.butter)} strokeWidth={2} strokeDasharray="5 6" strokeLinecap="round">
                    <path d="M2 14C40 2 80 2 116 12" />
                  </svg>
                )}
                <span className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full bg-white shadow-[0_14px_26px_-18px_rgba(28,42,33,0.5)]" style={{ color: t.primaryInk }}>
                  <Icon icon={s.icon} width={28} />
                  <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[11.5px] font-bold" style={{ background: t.primary, color: t.onPrimary, fontFamily: t.display }}>{i + 1}</span>
                </span>
                <span className="mt-3 text-[14.5px] font-semibold" style={{ color: t.ink, fontFamily: t.display }}>{s.title}</span>
                <span className="mt-1 max-w-[160px] text-[12.5px] leading-snug" style={{ color: t.muted }}>{s.sub}</span>
              </li>
            ))}
          </ol>
        </div>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════ PROMOS ══
/**
 * Dos banners de la referencia. Izquierda (lavanda): descuento real si hay ofertas; si no, "Nueva colección".
 * Derecha (menta): comunidad por WhatsApp → Instagram → segundo banner editable, según lo que exista.
 */
function PromoDuo({ t, diseno, ch, maxOff, goAction, onOffers }: { t: Theme; diseno: any; ch: Channels; maxOff: number; goAction: (key: string) => void; onOffers: () => void }) {
  const d = diseno || {};
  if (isOn(d.amoraPromosHidden)) return null;
  const leftTag = maxOff > 0 ? `Hasta -${maxOff}%` : editable(d.amoraPromoTag, 'Nueva colección');
  const right = ch.hasWhatsapp
    ? { tag: 'Comunidad', title: editable(d.amoraPromo2Title, 'Únete a nuestra comunidad'), text: optional(d.amoraPromo2Text, 'Entérate primero de los lanzamientos y reposiciones.'), button: editable(d.amoraPromo2Button, 'Unirme por WhatsApp'), icon: 'ic:baseline-whatsapp', onClick: () => { const url = ch.wa(editable(d.amoraPromo2Message, 'Hola, quiero unirme a la comunidad y recibir novedades.')); if (url) window.open(url, '_blank', 'noopener,noreferrer'); } }
    : ch.instagramUrl
      ? { tag: 'Instagram', title: editable(d.amoraPromo2Title, 'Inspírate con nuestros looks'), text: optional(d.amoraPromo2Text, 'Novedades y combinaciones en nuestro Instagram.'), button: editable(d.amoraPromo2Button, 'Seguirnos'), icon: 'mdi:instagram', onClick: () => window.open(ch.instagramUrl!, '_blank', 'noopener,noreferrer') }
      : { tag: editable(d.amoraPromo2Tag, 'Para cada día'), title: editable(d.amoraPromo2Title, 'Bolsos que van contigo'), text: optional(d.amoraPromo2Text, 'Prácticos, ligeros y con espacio para todo.'), button: editable(d.amoraPromo2Button, 'Ver modelos'), icon: 'solar:arrow-right-linear', onClick: () => goAction('amoraPromo2Action') };

  const card = (bg: string, tag: string, title: string, text: string, button: string, icon: string, img: string, onClick: () => void, key: string) => (
    <motion.div key={key} variants={amItem} className="group relative grid min-h-[260px] overflow-hidden rounded-[28px] sm:grid-cols-[1.1fr_1fr]" style={{ background: bg }}>
      <div className="relative z-10 flex flex-col items-start p-7 sm:p-9">
        <span className="rounded-full bg-white px-3 py-1 text-[12px] font-bold" style={{ color: t.primaryInk, fontFamily: t.display }}>{tag}</span>
        <h3 className="mt-4 text-[24px] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[28px]" style={{ color: t.ink, fontFamily: t.display }}>{title}</h3>
        {text && <p className="mt-2 max-w-[300px] text-[13.5px] leading-relaxed" style={{ color: t.muted }}>{text}</p>}
        <button type="button" onClick={onClick} className={`${btnCls} mt-6 h-11 px-5`} style={{ background: t.primary, color: t.onPrimary }}>
          {button} <Icon icon={icon} width={18} />
        </button>
      </div>
      <div className="relative h-44 sm:h-auto">
        <img src={img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] sm:[mask-image:linear-gradient(90deg,transparent,#000_28%)]" />
      </div>
    </motion.div>
  );

  return (
    <section className="mx-auto max-w-[1320px] px-4 pt-16 sm:px-6">
      <motion.div variants={amStagger} initial="hidden" whileInView="show" viewport={amViewport} className="grid gap-4 lg:grid-cols-2">
        {card(PASTELS.lavender, leftTag, editable(d.amoraPromoTitle, maxOff > 0 ? 'Tu favorita, a mejor precio' : 'Lo último en carteras'), optional(d.amoraPromoText, maxOff > 0 ? 'Modelos seleccionados con precio especial.' : 'Diseños recién llegados para estrenar.'), editable(d.amoraPromoButton, maxOff > 0 ? 'Ver ofertas' : 'Descubrir'), 'solar:arrow-right-linear', editable(d.amoraPromoImage, AM_IMG.promo), () => (d.amoraPromoAction ? goAction('amoraPromoAction') : onOffers()), 'l')}
        {card(PASTELS.mint, right.tag, right.title, right.text, right.button, right.icon, editable(d.amoraPromo2Image, AM_IMG.promo2), right.onClick, 'r')}
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════ INSPIRACIÓN ══
/** "Inspiración para cada día": 4 tarjetas de categorías reales con foto (editor > categoría > producto real). */
function Inspiration({ t, diseno, tiles, counts, onPick, onMore }: { t: Theme; diseno: any; tiles: { nombre: string; label: string; imagenUrl: string; isProduct: boolean }[]; counts: Record<string, number>; onPick: (c: string) => void; onMore: () => void }) {
  return (
    <section className="mx-auto max-w-[1320px] px-4 pt-16 sm:px-6">
      <SectionHeader t={t} title={editable(diseno?.amoraInspirationTitle, 'Inspiración para cada día')} subtitle={optional(diseno?.amoraInspirationSubtitle, 'Encuentra el estilo que va contigo')} onMore={onMore} moreLabel="Ver todo" />
      <motion.div key={tiles.map((x) => x.nombre).join('|')} variants={amStagger} initial="hidden" whileInView="show" viewport={amViewport} className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        {tiles.map((tile) => {
          const n = counts[tile.nombre];
          const bg = tileFor(t, tile.nombre);
          return (
            <motion.button key={tile.nombre} variants={amItem} type="button" onClick={() => onPick(tile.nombre)} className="group flex h-full flex-col overflow-hidden rounded-[22px] border bg-white text-left" style={{ borderColor: t.line }}>
              <span className="relative block aspect-[4/3] overflow-hidden" style={{ background: bg }}>
                {tile.imagenUrl ? (
                  <img src={tile.imagenUrl} alt={tile.label} loading="lazy" className={`absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.05] ${tile.isProduct ? 'object-contain p-[12%] mix-blend-multiply' : 'object-cover'}`} />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center"><Icon icon={emojiFor(tile.nombre)} width={64} /></span>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold" style={{ color: t.primaryInk }}>{tile.nombre}</span>
              </span>
              <span className="flex flex-1 items-center justify-between gap-3 p-4">
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-[15px] font-semibold" style={{ color: t.ink, fontFamily: t.display }}>{tile.label}</span>
                  <span className="mt-1 block text-[12px]" style={{ color: t.muted }}>{Number.isFinite(n) ? plural(n, 'producto', 'productos') : 'Ver colección'}</span>
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors group-hover:border-transparent" style={{ borderColor: t.line, color: t.ink }}><Icon icon="solar:arrow-right-up-linear" width={17} /></span>
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════ RESEÑAS ══
type Review = { id: number; clienteNombre?: string; rating: number; comentario?: string; compraVerificada?: boolean; producto: string };

/** Reseñas REALES (máximo 4 productos consultados). Sin reseñas, no se muestra. */
function RealReviews({ t, slug, products, diseno }: { t: Theme; slug: string; products: any[]; diseno: any }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const withReviews = products.filter((p) => Number(p?.ratingCount || 0) > 0).slice(0, 4);
  const key = withReviews.map((p) => p.id).join(',');

  useEffect(() => {
    if (!slug || slug === 'preview' || !key || isOn(diseno?.amoraReviewsHidden)) { setReviews([]); return; }
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
  }, [slug, key, diseno?.amoraReviewsHidden]);

  if (!reviews.length) return null;
  return (
    <section className="mx-auto max-w-[1320px] px-4 pt-16 sm:px-6">
      <SectionHeader t={t} heart title={editable(diseno?.amoraReviewsTitle, 'Lo que dicen nuestras clientas')} subtitle={optional(diseno?.amoraReviewsSubtitle, 'Reseñas reales de compras en la tienda')} />
      <motion.div variants={amStagger} initial="hidden" whileInView="show" viewport={amViewport} className={`grid gap-3 ${reviews.length >= 3 ? 'md:grid-cols-3' : reviews.length === 2 ? 'md:grid-cols-2' : ''}`}>
        {reviews.map((r) => (
          <motion.figure key={r.id} variants={amItem} className="flex flex-col rounded-[22px] border bg-white p-5" style={{ borderColor: t.line }}>
            <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon={i < Math.round(r.rating) ? 'solar:star-bold' : 'solar:star-linear'} width={15} className="text-amber-400" />)}</span>
            <blockquote className="mt-3 line-clamp-4 text-[14px] leading-relaxed" style={{ color: mix(t.ink, 82, '#fff') }}>“{String(r.comentario).trim()}”</blockquote>
            <figcaption className="mt-auto flex items-center gap-3 pt-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-bold" style={{ background: tileFor(t, r.clienteNombre), color: t.ink, fontFamily: t.display }}>{(r.clienteNombre || 'C').trim().charAt(0).toUpperCase()}</span>
              <span className="min-w-0 leading-tight">
                <span className="block text-[13.5px] font-semibold" style={{ color: t.ink }}>{r.clienteNombre || 'Cliente'}</span>
                <span className="mt-0.5 block truncate text-[11.5px]" style={{ color: t.muted }}>{r.compraVerificada ? 'Compra verificada · ' : ''}{r.producto}</span>
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </motion.div>
    </section>
  );
}

