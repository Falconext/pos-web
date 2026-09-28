import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { buildCategoryTiles } from '@/templates/shared/categoryTiles';
import { resolveHeroIntervalMs, usePreloadImages } from '@/templates/shared/heroSlider';
import { getStoreLinkAction, isLinkActionConfigured, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import {
  PatitasHeader, PatitasFooter, PatitasCartModal, buildServices,
  patitasTheme, usePatitasFont, editable, optional, isOn, ptMoney, btnCls, type Theme, type Service,
} from './PatitasParts';
import { SectionHeader, ProductRail, GridSkeleton, RealReviews, storeChannels, getName, hasImage, categoryIcon, type OpenFn, type AddFn } from './PatitasSections';
import { mix, ptEase, ptHeroText, ptItem, ptReveal, ptStagger, ptViewport } from './motion';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';
const HOME_PAGE_SIZE = 30; // límite de productos que carga [slug].tsx para el home
const u = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Fotos de ejemplo (reemplazables en Personalizar). */
export const MASCOTAS_IMG = {
  hero: [u('1587300003388-59208cc962cb', 1900), u('1548199973-03cce0bbc87b', 1900), u('1601979031925-424e53b6caaa', 1900)],
  guides: [u('1576201836106-db1758fd1c97', 700), u('1589924691995-400dc9ecc119', 700), u('1450778869180-41d0601e046e', 700), u('1604848698030-c434ba08ece1', 700), u('1516734212186-a967f81ad0d7', 700)],
};

const GUIDES = [
  { title: 'Paseos felices', text: 'Rutinas y accesorios para pasear seguros.' },
  { title: 'Buena alimentación', text: 'Cuánto y cómo darle de comer según su etapa.' },
  { title: 'Descanso reparador', text: 'Un espacio cómodo para dormir mejor.' },
  { title: 'Baño e higiene', text: 'Consejos para un pelaje limpio y sano.' },
  { title: 'Salud al día', text: 'Vacunas, desparasitación y controles.' },
];

// ═════════════════════════════════════════════════════════════════ PAGE ══
export default function PatitasHomePage(props: TemplateHomePageProps) {
  const { tienda, slug, productos, allCategories, diseno, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, agregarAlCarrito, actualizarCantidad, loading } = props as any;
  usePatitasFont();
  const navigate = useNavigate();
  const t = patitasTheme(diseno);
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
  // El home trae como máximo 30 productos: solo si llegaron menos, los conteos por categoría son exactos.
  const exact = list.length < HOME_PAGE_SIZE;
  const circles = useMemo(() => buildCategoryTiles({ allCategories, diseno, prefix: 'mascotas', count: 6, fallbackImages: [] }).map((tile, i) => {
    const same = (p: any) => getName(p?.categoria).toLowerCase() === tile.nombre.toLowerCase();
    const fromProduct = tile.imagenUrl ? '' : withImg.find(same)?.imagenUrl || '';
    const count = exact ? list.filter(same).length : 0;
    const sub = String(diseno?.[`mascotasTile${i + 1}Text`] ?? '').trim() || (count > 0 ? `${count} ${count === 1 ? 'producto' : 'productos'}` : '');
    return { ...tile, imagenUrl: tile.imagenUrl || fromProduct, isProduct: Boolean(fromProduct), sub };
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
        <PatitasHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={navigate} active="home" />

        <HeroSlider t={t} diseno={diseno} services={services} goAction={goAction} />
        {circles.length > 0 && <CategoryCard t={t} circles={circles} onPick={goCategory} />}

        {loading && !list.length ? (
          <section className="mx-auto max-w-[1280px] px-4 py-10 lg:px-8"><GridSkeleton t={t} count={5} cols="lg:grid-cols-5" /></section>
        ) : (
          <ProductRail t={t} title={editable(diseno?.mascotasPicksTitle, 'Recomendados para tu engreído')} products={picks} slug={slug} onOpen={goProduct} onAdd={add} onMore={goCatalog} />
        )}

        <Bundles t={t} diseno={diseno} slug={slug} wa={ch.hasWhatsapp ? ch.wa : null} />
        <Guides t={t} diseno={diseno} goAction={goAction} />
        <RealReviews t={t} slug={slug} products={list} title={editable(diseno?.mascotasReviewsTitle, 'Lo que dicen nuestros clientes')} />
        <div className="h-10" />

        <PatitasFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <PatitasCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } })} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.primary} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.primary} onGoProduct={(item: any) => goProduct(item)} />
      </div>
    </MotionConfig>
  );
}

// ═════════════════════════════════════════════════════════════════ HERO ══
type Slide = { image: string; onlyImage: boolean; title: string; highlight: string; subtitle: string; button: string; action: string };

function slidesFrom(diseno: any): Slide[] {
  const d = diseno || {};
  return [
    { image: d.mascotasHeroImage || MASCOTAS_IMG.hero[0], onlyImage: isOn(d.mascotasHeroOnlyImage), title: editable(d.mascotasHeroTitle, 'Todo lo que tu mascota necesita,'), highlight: optional(d.mascotasHeroHighlight, 'cada día'), subtitle: editable(d.mascotasHeroSubtitle, 'Productos de calidad para una vida más feliz y saludable.'), button: editable(d.mascotasHeroButton, 'Comprar ahora'), action: 'mascotasHeroAction' },
    { image: d.mascotasSlide2Image || MASCOTAS_IMG.hero[1], onlyImage: isOn(d.mascotasSlide2OnlyImage), title: editable(d.mascotasSlide2Title, 'Juegos y paseos'), highlight: optional(d.mascotasSlide2Highlight, 'llenos de energía'), subtitle: editable(d.mascotasSlide2Subtitle, 'Correas, juguetes y todo para sus aventuras.'), button: editable(d.mascotasSlide2Button, 'Ver accesorios'), action: 'mascotasSlide2Action' },
    { image: d.mascotasSlide3Image || MASCOTAS_IMG.hero[2], onlyImage: isOn(d.mascotasSlide3OnlyImage), title: editable(d.mascotasSlide3Title, 'Cuidados desde'), highlight: optional(d.mascotasSlide3Highlight, 'cachorros'), subtitle: editable(d.mascotasSlide3Subtitle, 'Alimento, camitas y cuidados para cada etapa.'), button: editable(d.mascotasSlide3Button, 'Ver productos'), action: 'mascotasSlide3Action' },
  ];
}

/** Slider del hero. Aislado: su intervalo solo re-renderiza este componente. */
function HeroSlider({ t, diseno, services, goAction }: { t: Theme; diseno: any; services: Service[]; goAction: (k: string) => void }) {
  const slides = useMemo(() => slidesFrom(diseno), [diseno]);
  const interval = resolveHeroIntervalMs(diseno, 'mascotasHeroInterval', 6500);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  usePreloadImages(slides.map((s) => s.image));
  useEffect(() => {
    if (!interval || paused) return;
    const id = window.setTimeout(() => setIdx((v) => (v + 1) % slides.length), interval);
    return () => window.clearTimeout(id);
  }, [idx, interval, paused, slides.length]);
  const s = slides[idx];
  const chips = services.slice(0, 3);

  return (
    <section className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative mx-auto min-h-[460px] max-w-[1440px] overflow-hidden lg:min-h-[500px]" style={{ background: mix(t.primary, 6, t.bg) }}>
        {/* Fotos apiladas (crossfade sin hueco). Con textos, la foto se funde con el fondo por máscara. */}
        <div aria-hidden className={s.onlyImage ? 'absolute inset-0' : 'absolute inset-x-0 top-0 h-[280px] [mask-image:linear-gradient(180deg,#000_62%,transparent)] lg:inset-y-0 lg:left-auto lg:h-full lg:w-[72%] lg:[mask-image:linear-gradient(90deg,transparent,#000_30%)]'}>
          {slides.map((sl, i) => (
            <motion.img key={sl.action} src={sl.image} alt="" initial={false} animate={{ opacity: i === idx ? 1 : 0, scale: i === idx ? 1 : 1.03 }} transition={{ duration: 1.1, ease: ptEase }} className="absolute inset-0 h-full w-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
          ))}
        </div>

        {s.onlyImage ? (
          <button type="button" aria-label={s.title} onClick={() => goAction(s.action)} className="absolute inset-0 z-[1]" />
        ) : (
          <div className="relative z-[2] mx-auto flex max-w-[1280px] px-4 pb-24 pt-[270px] lg:min-h-[500px] lg:items-center lg:px-8 lg:pb-24 lg:pt-10">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={idx} variants={ptStagger} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.2 } }} className="max-w-[600px]">
                <motion.h1 variants={ptHeroText} className="text-[36px] font-black leading-[1.05] tracking-[-0.025em] sm:text-[46px] lg:text-[52px]" style={{ color: t.ink }}>
                  {s.title}{s.highlight && <> <span style={{ color: t.accentInk }}>{s.highlight}</span></>}
                </motion.h1>
                <motion.p variants={ptHeroText} className="mt-4 max-w-sm text-[16px] font-semibold leading-relaxed" style={{ color: mix(t.ink, 78, t.bg) }}>{s.subtitle}</motion.p>
                <motion.div variants={ptHeroText} className="mt-7">
                  <button type="button" onClick={() => goAction(s.action)} className={`${btnCls} group h-12 px-6 text-[15px] shadow-[0_14px_30px_-16px_rgba(42,46,38,0.6)]`} style={{ background: t.primary, color: t.onPrimary }}>
                    {s.button}<Icon icon="solar:arrow-right-linear" width={18} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                  </button>
                </motion.div>
                {chips.length > 0 && (
                  <motion.ul variants={ptHeroText} className="mt-8 flex flex-wrap gap-2">
                    {chips.map((c) => (
                      <li key={c.label} className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-[12px] font-bold shadow-sm backdrop-blur" style={{ color: t.ink }}>
                        <Icon icon={c.icon} width={16} style={{ color: t.primaryInk }} />{c.label}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        <div className="absolute bottom-16 right-6 z-[3] flex gap-1.5 lg:right-10">
          {slides.map((sl, i) => (
            <button key={sl.action} type="button" aria-label={`Ir al banner ${i + 1}`} onClick={() => setIdx(i)} className="h-2 rounded-full transition-all duration-500" style={{ width: i === idx ? 24 : 8, background: i === idx ? t.primary : mix(t.primary, 30, '#fff') }} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════ CATEGORÍAS (tarjeta) ══
function CategoryCard({ t, circles, onPick }: { t: Theme; circles: { nombre: string; label: string; imagenUrl: string; isProduct: boolean; sub: string }[]; onPick: (c: string) => void }) {
  const cols: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6' };
  return (
    <section className="relative z-10 mx-auto -mt-12 max-w-[1280px] px-4 lg:px-8">
      <motion.div variants={ptStagger} initial="hidden" whileInView="show" viewport={ptViewport} className={`grid grid-cols-3 gap-x-3 gap-y-6 rounded-[28px] border bg-white px-4 py-7 shadow-[0_24px_60px_-40px_rgba(42,46,38,0.5)] sm:grid-cols-3 sm:px-8 ${cols[circles.length] || 'lg:grid-cols-6'}`} style={{ borderColor: t.line }}>
        {circles.map((c, i) => (
          <motion.button key={c.nombre} type="button" variants={ptItem} onClick={() => onPick(c.nombre)} className="group flex flex-col items-center text-center">
            <span className="relative flex aspect-square w-full max-w-[104px] items-center justify-center overflow-hidden rounded-full transition-transform duration-300 group-hover:scale-[1.05]" style={{ background: t.circles[i % t.circles.length] }}>
              {c.imagenUrl
                ? <img src={c.imagenUrl} alt="" loading="lazy" className={`h-full w-full ${c.isProduct ? 'object-contain p-3 mix-blend-multiply' : 'object-cover'}`} />
                : <Icon icon={categoryIcon(c.nombre)} width={42} style={{ color: mix(t.ink, 70, '#fff') }} />}
            </span>
            <span className="mt-3 line-clamp-1 text-[14.5px] font-extrabold" style={{ color: t.ink }}>{c.label}</span>
            {c.sub && <span className="mt-0.5 line-clamp-2 text-[11.5px] font-semibold leading-snug" style={{ color: t.muted }}>{c.sub}</span>}
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ COMBOS ══
/** El endpoint de combos llega doblemente envuelto ({code, data: {code, data: [...]}}): baja hasta el arreglo. */
function unwrapList(payload: any): any[] {
  let cur = payload;
  for (let i = 0; i < 4 && cur && !Array.isArray(cur); i++) cur = cur.data;
  return Array.isArray(cur) ? cur : [];
}

/**
 * Combos REALES de la tienda (/combos). Carga y estado aislados aquí. El ahorro sale de
 * precioRegular vs precioCombo. Se piden por WhatsApp: el checkout en línea (crearPedido) solo
 * acepta productoId, así que un combo en el carrito haría fallar el pedido. Sin WhatsApp o sin
 * combos vigentes, la sección no aparece.
 */
function Bundles({ t, diseno, slug, wa }: { t: Theme; diseno: any; slug: string; wa: ((msg?: string) => string | null) | null }) {
  const [combos, setCombos] = useState<any[]>([]);
  useEffect(() => {
    if (!slug || slug === 'preview' || !wa || isOn(diseno?.mascotasBundlesHidden)) { setCombos([]); return; }
    let alive = true;
    axios.get(`${BASE_URL}/public/store/${slug}/combos`)
      .then((r) => { if (alive) setCombos(unwrapList(r.data)); })
      .catch(() => { if (alive) setCombos([]); });
    return () => { alive = false; };
  }, [slug, diseno?.mascotasBundlesHidden, Boolean(wa)]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!combos.length || !wa) return null;
  const badgeBg = [t.accent, t.sky, t.accent];
  const cols: Record<number, string> = { 1: 'md:grid-cols-1 max-w-xl', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3' };
  const shown = combos.slice(0, 3);

  return (
    <section id="combos" className="mx-auto max-w-[1280px] scroll-mt-24 px-4 py-10 lg:px-8">
      <SectionHeader t={t} icon="ph:gift-light" title={editable(diseno?.mascotasBundlesTitle, 'Combos para empezar')} subtitle={editable(diseno?.mascotasBundlesSubtitle, 'Ahorra con nuestros packs armados.')} />
      <motion.div variants={ptStagger} initial="hidden" whileInView="show" viewport={ptViewport} className={`grid gap-4 ${cols[shown.length] || 'md:grid-cols-3'}`}>
        {shown.map((c, i) => {
          const regular = Number(c.precioRegular || 0);
          const price = Number(c.precioCombo || 0);
          const pct = Number(c.descuentoPorcentaje) > 0 ? Math.round(Number(c.descuentoPorcentaje)) : regular > price && regular > 0 ? Math.round((1 - price / regular) * 100) : 0;
          const img = c.imagenUrl || c.items?.find((it: any) => it?.producto?.imagenUrl)?.producto?.imagenUrl;
          const out = c.stock !== null && c.stock !== undefined && Number(c.stock) <= 0;
          const until = c.fechaFin ? new Date(c.fechaFin) : null;
          const bg = badgeBg[i % badgeBg.length];
          return (
            <motion.article key={c.id} variants={ptItem} className="relative flex min-h-[200px] overflow-hidden rounded-3xl border p-5" style={{ background: mix(t.primary, 5, '#fff'), borderColor: t.line }}>
              {pct > 0 && (
                <span className="absolute right-4 top-4 z-10 flex h-14 w-14 flex-col items-center justify-center rounded-full text-center leading-none shadow-sm" style={{ background: bg, color: bg === t.sky ? t.ink : t.onAccent }}>
                  <span className="text-[9.5px] font-extrabold uppercase">Ahorra</span><span className="text-[15px] font-black">{pct}%</span>
                </span>
              )}
              <div className="relative z-10 flex max-w-[56%] flex-col">
                <h3 className="text-[16px] font-extrabold leading-tight" style={{ color: t.ink }}>{c.nombre}</h3>
                {c.descripcion && <p className="mt-1 line-clamp-2 text-[12px] font-medium" style={{ color: t.muted }}>{c.descripcion}</p>}
                {!c.descripcion && Array.isArray(c.items) && c.items.length > 0 && <p className="mt-1 text-[12px] font-medium" style={{ color: t.muted }}>{c.items.length} {c.items.length === 1 ? 'producto' : 'productos'} en el pack</p>}
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-[19px] font-black" style={{ color: t.ink }}>{ptMoney(price)}</span>
                  {regular > price && <span className="text-[12px] font-semibold line-through" style={{ color: t.muted }}>{ptMoney(regular)}</span>}
                </div>
                {until && <p className="mt-0.5 text-[11px] font-semibold" style={{ color: t.muted }}>Válido hasta el {until.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}</p>}
                {out ? (
                  <span className={`${btnCls} mt-auto h-10 w-max px-5 text-[12.5px] opacity-60`} style={{ background: t.soft, color: t.muted }}>Agotado</span>
                ) : (
                  <a href={wa(`Hola, quiero pedir el combo "${c.nombre}" a ${ptMoney(price)}.`) || '#'} target="_blank" rel="noopener noreferrer" className={`${btnCls} mt-auto h-10 w-max px-5 text-[12.5px]`} style={{ background: t.primary, color: t.onPrimary }}>
                    <Icon icon="ic:baseline-whatsapp" width={17} /> {editable(diseno?.mascotasBundlesButton, 'Pedir combo')}
                  </a>
                )}
              </div>
              {img && (
                <div aria-hidden className="absolute bottom-3 right-3 top-16 flex w-[44%] items-end justify-center">
                  <img src={img} alt="" loading="lazy" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                </div>
              )}
            </motion.article>
          );
        })}
      </motion.div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════ GUÍAS ══
/** Guías de cuidado editables. Solo son enlace si el empresario configuró un destino (nada de páginas que no existen). */
function Guides({ t, diseno, goAction }: { t: Theme; diseno: any; goAction: (k: string) => void }) {
  if (isOn(diseno?.mascotasGuidesHidden)) return null;
  const items = GUIDES.map((g, i) => {
    const n = i + 1;
    return {
      key: `mascotasGuide${n}Action`,
      img: diseno?.[`mascotasGuide${n}Image`] || MASCOTAS_IMG.guides[i],
      title: editable(diseno?.[`mascotasGuide${n}Title`], g.title),
      text: editable(diseno?.[`mascotasGuide${n}Text`], g.text),
      linked: isLinkActionConfigured(diseno, `mascotasGuide${n}Action`),
    };
  });
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-10 lg:px-8">
      <SectionHeader t={t} icon="ph:book-open-text-light" title={editable(diseno?.mascotasGuidesTitle, 'Guías de cuidado')} subtitle={editable(diseno?.mascotasGuidesSubtitle, 'Consejos para una vida mejor juntos.')} />
      <motion.div variants={ptStagger} initial="hidden" whileInView="show" viewport={ptViewport} className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:gap-4 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
        {items.map((g) => {
          const body = (
            <>
              <div className="aspect-[4/3] overflow-hidden"><img src={g.img} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" /></div>
              <div className="p-4">
                <h3 className="text-[14.5px] font-extrabold" style={{ color: t.ink }}>{g.title}</h3>
                <p className="mt-1 text-[12.5px] font-medium leading-snug" style={{ color: t.muted }}>{g.text}</p>
                {g.linked && <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-extrabold" style={{ color: t.accentInk }}>Leer más <Icon icon="solar:arrow-right-linear" width={14} /></span>}
              </div>
            </>
          );
          const cls = 'group w-[64%] shrink-0 snap-start overflow-hidden rounded-2xl border bg-white text-left sm:w-[40%] lg:w-auto';
          return g.linked
            ? <motion.button key={g.key} type="button" variants={ptItem} onClick={() => goAction(g.key)} className={cls} style={{ borderColor: t.line }}>{body}</motion.button>
            : <motion.div key={g.key} variants={ptItem} className={cls} style={{ borderColor: t.line }}>{body}</motion.div>;
        })}
      </motion.div>
    </section>
  );
}
