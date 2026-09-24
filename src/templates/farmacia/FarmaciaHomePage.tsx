import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { getProductPricing } from '@/templates/shared/pricing';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import {
  FarmaciaHeader, FarmaciaFooter, FarmaciaCartModal,
  farmaciaTheme, useFarmaciaFont, editable, fmMoney,
} from './FarmaciaParts';
import { fmEase, fmHeroText, fmItem, fmReveal, fmStagger, fmViewport, mix } from './motion';
import {
  SectionHeader, ProductGrid, GridSkeleton, ProductRail, OfferCountdown,
  buildServices, soonestOfferEnd, storeChannels, getName, hasImage,
  type Theme, type OpenFn, type AddFn, type Service,
} from './FarmaciaSections';

const SERVICE_COLS: Record<number, string> = { 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5' };

type RxMode = 'whatsapp' | 'phone' | 'visit';

const CATEGORY_ICONS = ['solar:bottle-bold-duotone', 'solar:pills-3-bold-duotone', 'solar:hand-heart-bold-duotone', 'solar:leaf-bold-duotone', 'solar:medical-kit-bold-duotone', 'solar:health-bold-duotone', 'solar:tea-cup-bold-duotone', 'solar:hearts-bold-duotone', 'solar:shield-plus-bold-duotone', 'solar:heart-pulse-bold-duotone', 'solar:cosmetic-bold-duotone', 'solar:dumbbell-large-bold-duotone'];
const CATEGORY_FALLBACK = ['Cuidado del bebé', 'Diabetes', 'Adulto mayor', 'Alimentos saludables', 'Equipos médicos', 'Cuidado masculino', 'Vitaminas', 'Cuidado personal', 'Salud íntima', 'Dermocosmética', 'Nutrición deportiva', 'Cuidado femenino'];

const MARQUEE_CSS = `
@keyframes fm-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.fm-marquee { animation: fm-marquee 38s linear infinite; }
.fm-marquee:hover { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .fm-marquee { animation: none; } }
`;

// ═════════════════════════════════════════════════════════════════ PAGE ══
export default function FarmaciaHomePage(props: TemplateHomePageProps) {
  const { tienda, slug, productos, allCategories, diseno, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, agregarAlCarrito, actualizarCantidad, loading } = props as any;
  useFarmaciaFont();
  const navigate = useNavigate();
  const t = farmaciaTheme(diseno);
  const [showFav, setShowFav] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);

  const list: any[] = useMemo(() => (Array.isArray(productos) ? productos : []), [productos]);
  const withImg = useMemo(() => list.filter(hasImage), [list]);
  const categories: string[] = useMemo(() => (allCategories || []).map(getName).filter(Boolean), [allCategories]);
  const catTiles = useMemo(() => {
    const real = categories.length > 0;
    return (real ? categories : CATEGORY_FALLBACK).slice(0, 12).map((name, i) => ({ name, real, icon: CATEGORY_ICONS[i % CATEGORY_ICONS.length] }));
  }, [categories]);
  // Ofertas REALES únicamente (sin rellenar con productos a precio normal).
  const offers = useMemo(() => list.filter((p) => getProductPricing(p).enOferta), [list]);
  const offerEndsAt = useMemo(() => soonestOfferEnd(offers), [offers]);
  // Recomendados sin repetir lo que ya se ve en la 1ra pestaña (top 10).
  const recommended = useMemo(() => {
    const topIds = new Set([...list].sort((a, b) => Number(b?.vendidos ?? 0) - Number(a?.vendidos ?? 0)).slice(0, 10).map((p) => p?.id));
    return [...withImg, ...list.filter((p) => !hasImage(p))].filter((p) => !topIds.has(p?.id)).slice(0, 12);
  }, [list, withImg]);
  const services = useMemo(() => buildServices(tienda), [tienda]);
  const brands = useMemo(() => {
    const names = list.map((p) => (typeof p?.marca === 'object' ? p?.marca?.nombre : p?.marca)).filter(Boolean).map((s) => String(s).trim());
    return Array.from(new Set(names)).slice(0, 14);
  }, [list]);

  const cartCount = (carrito || []).reduce((s: number, i: any) => s + Number(i?.cantidad || 1), 0);
  const goCatalog = () => navigate(`/tienda/${slug}/catalogo`);
  const goCategory = (name: string, real: boolean) => navigate(real ? `/tienda/${slug}/catalogo?category=${encodeURIComponent(name)}` : `/tienda/${slug}/catalogo`);
  const goProduct: OpenFn = (p) => navigate(`/tienda/${slug}/producto/${p.id}`);
  const add: AddFn = (p, qty = 1) => agregarAlCarrito({ ...p, __cantidad: qty });
  const goAction = (key: string) => runStoreLinkAction(getStoreLinkAction(diseno, key, { defaultType: 'catalog' }), { slug, navigate });

  // Canales REALES de la tienda (null si no están configurados → la UI los oculta).
  const ch = storeChannels(tienda, diseno);
  const waRxUrl = ch.wa('Hola, quiero enviar mi receta médica para cotizar mi pedido.');
  const waNewsUrl = ch.wa('Hola, quiero recibir las ofertas y novedades de la farmacia.');
  // Banda de receta: WhatsApp > llamada > visita (mapa). Sin canal → se oculta.
  const rx: { mode: RxMode; url: string } | null = waRxUrl ? { mode: 'whatsapp', url: waRxUrl } : ch.phoneHref ? { mode: 'phone', url: ch.phoneHref } : ch.mapsUrl ? { mode: 'visit', url: ch.mapsUrl } : null;
  const scrollToRx = () => document.getElementById('fm-receta')?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, fontFamily: t.font }}>
        <style>{MARQUEE_CSS}</style>
        <FarmaciaHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} onSearch={(v: string) => navigate(`/tienda/${slug}/catalogo?search=${encodeURIComponent(v)}`)} navigate={navigate} />

        <HeroSection
          t={t}
          diseno={diseno}
          products={withImg}
          onShop={() => goAction('farmaciaHeroAction')}
          secondary={rx
            ? { label: editable(diseno?.farmaciaHeroSecondaryButton, 'Tengo una receta'), icon: 'solar:document-medicine-bold-duotone', onClick: scrollToRx }
            : { label: 'Ver catálogo', icon: 'solar:widget-5-bold-duotone', onClick: goCatalog }}
        />
        <ServicesRail t={t} services={services} onClick={goCatalog} />
        <CategoryGrid t={t} title={editable(diseno?.farmaciaCategoriesTitle, 'Compra por categoría')} tiles={catTiles} onPick={goCategory} onMore={goCatalog} />
        <PromoBento t={t} diseno={diseno} goAction={goAction} />
        {offers.length > 0 && <FlashDeals t={t} title={editable(diseno?.farmaciaFlashTitle, 'Ofertas relámpago')} products={offers.slice(0, 5)} endsAt={offerEndsAt} slug={slug} onOpen={goProduct} onAdd={add} onMore={goCatalog} />}
        {rx && <RxBand t={t} diseno={diseno} mode={rx.mode} url={rx.url} />}
        <ProductTabs t={t} diseno={diseno} list={list} slug={slug} loading={loading} onOpen={goProduct} onAdd={add} onMore={goCatalog} />
        {brands.length >= 4 && <BrandsMarquee t={t} title={editable(diseno?.farmaciaBrandsTitle, 'Marcas que confían en nosotros')} brands={brands} />}
        {recommended.length >= 4 && <ProductRail t={t} title={editable(diseno?.farmaciaRecommendedTitle, 'Recomendado para ti')} products={recommended} slug={slug} onOpen={goProduct} onAdd={add} />}
        {waNewsUrl && <Newsletter t={t} diseno={diseno} waUrl={waNewsUrl} />}

        <FarmaciaFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <FarmaciaCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } })} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.primary} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.primary} onGoProduct={(item: any) => goProduct(item)} />
      </div>
    </MotionConfig>
  );
}

// ═══════════════════════════════════════════════════════════════ SHARED ══

// ═════════════════════════════════════════════════════════════════ HERO ══
function HeroSection({ t, diseno, products, onShop, secondary }: { t: Theme; diseno: any; products: any[]; onShop: () => void; secondary: { label: string; icon: string; onClick: () => void } }) {
  const trust = [
    editable(diseno?.farmaciaHeroTrustOne, 'Químico farmacéutico en línea'),
    editable(diseno?.farmaciaHeroTrustTwo, 'Productos 100% originales'),
    editable(diseno?.farmaciaHeroTrustThree, 'Pagos 100% seguros'),
  ];
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -left-48 -top-48 h-[560px] w-[560px] rounded-full blur-3xl" style={{ background: mix(t.primary, 20, 'transparent') }} />
      <div aria-hidden className="pointer-events-none absolute -right-40 top-24 h-[440px] w-[440px] rounded-full blur-3xl" style={{ background: mix(t.accent, 14, 'transparent') }} />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-10 lg:grid-cols-[1.05fr_1fr] lg:px-6 lg:pb-24 lg:pt-16">
        <motion.div variants={fmStagger} initial="hidden" animate="show">
          <motion.span variants={fmHeroText} className="inline-flex items-center gap-2 rounded-full border bg-white/80 px-3.5 py-1.5 text-[12px] font-bold backdrop-blur" style={{ borderColor: t.line, color: t.ink }}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: t.accent }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: t.accent }} />
            </span>
            {editable(diseno?.farmaciaHeroBadge, 'Farmacia abierta · Delivery hoy')}
          </motion.span>

          <motion.h1 variants={fmHeroText} className="mt-6 text-[40px] font-black leading-[1.03] tracking-[-0.035em] sm:text-[54px] lg:text-[62px]" style={{ color: t.ink }}>
            {editable(diseno?.farmaciaHeroTitle, 'Tu salud y bienestar,')}{' '}
            <span className="relative inline-block" style={{ color: t.primary }}>
              {editable(diseno?.farmaciaHeroHighlight, 'a un clic de casa')}
              <svg aria-hidden viewBox="0 0 300 20" preserveAspectRatio="none" className="absolute -bottom-2.5 left-0 h-3.5 w-full overflow-visible">
                <motion.path d="M4 14 C 80 3, 220 3, 296 12" fill="none" stroke={t.accent} strokeWidth="6" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, delay: 0.7, ease: fmEase }} />
              </svg>
            </span>
          </motion.h1>

          <motion.p variants={fmHeroText} className="mt-7 max-w-lg text-[17px] leading-relaxed text-gray-500">
            {editable(diseno?.farmaciaHeroSubtitle, 'Medicamentos, vitaminas y dermocosmética con asesoría farmacéutica profesional y entrega rápida a tu puerta.')}
          </motion.p>

          <motion.div variants={fmHeroText} className="mt-9 flex flex-wrap items-center gap-3">
            <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={onShop} className="group inline-flex h-14 items-center gap-2.5 rounded-full px-8 text-[15px] font-black" style={{ background: t.accent, color: t.onAccent, boxShadow: `0 18px 40px -16px ${mix(t.accent, 85, 'transparent')}` }}>
              {editable(diseno?.farmaciaHeroButton, 'Comprar ahora')}
              <Icon icon="solar:arrow-right-linear" width={20} className="transition-transform duration-300 group-hover:translate-x-1" />
            </motion.button>
            <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={secondary.onClick} className="inline-flex h-14 items-center gap-2.5 rounded-full border bg-white px-7 text-[15px] font-bold" style={{ borderColor: t.line, color: t.ink }}>
              <Icon icon={secondary.icon} width={22} style={{ color: t.primary }} />
              {secondary.label}
            </motion.button>
          </motion.div>

          <motion.ul variants={fmHeroText} className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-[13px] font-semibold text-gray-500">
            {trust.map((x) => (
              <li key={x} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: mix(t.primary, 14), color: t.primary }}><Icon icon="solar:check-read-linear" width={13} /></span>
                {x}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <HeroVisual t={t} products={products} />
      </div>
    </section>
  );
}

/** Composición del hero. Aislada: su rotación (4.5s) solo re-renderiza este componente. */
function HeroVisual({ t, products }: { t: Theme; products: any[] }) {
  const items = useMemo(() => products.slice(0, 5), [products]);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setIdx((v) => (v + 1) % items.length), 4500);
    return () => clearInterval(id);
  }, [items.length]);

  const current = items[idx];
  const src = current?.imagenUrl;
  const pricing = current ? getProductPricing(current) : null;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.15, ease: fmEase }} className="relative mx-auto aspect-square w-full max-w-[540px]">
      <div className="absolute inset-[5%] rounded-[48px]" style={{ background: `linear-gradient(145deg, ${mix(t.primary, 20)} 0%, ${mix(t.accent, 12)} 100%)` }} />
      <div aria-hidden className="absolute inset-[5%] rounded-[48px]" style={{ backgroundImage: `radial-gradient(${mix(t.primary, 35, 'transparent')} 1.2px, transparent 1.2px)`, backgroundSize: '20px 20px', maskImage: 'radial-gradient(circle at center, black 25%, transparent 72%)', WebkitMaskImage: 'radial-gradient(circle at center, black 25%, transparent 72%)' }} />

      {/* Anillo orbital (wrapper centra, el hijo rota: no mezclar translate de Tailwind con transform de framer) */}
      <div aria-hidden className="absolute inset-0 flex items-center justify-center">
        <motion.div className="h-[74%] w-[74%] rounded-full border-2 border-dashed" style={{ borderColor: mix(t.primary, 30, 'transparent') }} animate={{ rotate: 360 }} transition={{ duration: 70, repeat: Infinity, ease: 'linear' }} />
      </div>

      {/* Plataforma + producto */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex h-[58%] w-[58%] items-center justify-center rounded-full bg-white" style={{ boxShadow: `0 50px 90px -35px ${mix(t.primary, 60, 'transparent')}` }}>
          <AnimatePresence mode="popLayout" initial={false}>
            {src ? (
              <motion.img key={src} src={src} alt={current?.descripcion || ''} initial={{ opacity: 0, scale: 0.8, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.9, rotate: 8 }} transition={{ duration: 0.75, ease: fmEase }} className="absolute h-[74%] w-[74%] object-contain mix-blend-multiply" />
            ) : (
              <motion.span key="fm-icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute"><Icon icon="solar:pills-3-bold-duotone" width={150} style={{ color: t.primary }} /></motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <FloatChip t={t} className="left-0 top-[14%]" delay={0} icon="solar:delivery-bold" title="Entrega rápida" sub="Delivery y recojo" />
      <FloatChip t={t} className="right-0 top-[34%]" delay={1.4} icon="solar:shield-check-bold" title="Atención experta" sub="Químico farmacéutico" />

      {current && pricing && (
        <motion.div className="absolute bottom-[7%] left-[3%] z-10 w-[58%] max-w-[250px]" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: [0, -8, 0] }} transition={{ opacity: { duration: 0.6, delay: 1.1 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.7 } }}>
          <div className="rounded-2xl border border-white/70 bg-white/90 p-3 shadow-[0_24px_50px_-24px_rgba(15,23,42,0.4)] backdrop-blur-md">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={current.id ?? idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35 }} className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: t.soft }}>
                  <img src={current.imagenUrl} alt="" className="h-9 w-9 object-contain mix-blend-multiply" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-bold" style={{ color: t.ink }}>{current.descripcion}</p>
                  <p className="text-[14px] font-black" style={{ color: t.primary }}>{fmMoney(pricing.precioFinal)}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {items.length > 1 && (
        <div className="absolute bottom-[3%] right-[8%] z-10 flex gap-1.5">
          {items.map((p, i) => (
            <button key={p.id ?? i} type="button" aria-label={`Ver producto ${i + 1}`} onClick={() => setIdx(i)} className="h-2 rounded-full transition-all duration-500" style={{ width: i === idx ? 22 : 8, background: i === idx ? t.primary : mix(t.primary, 30) }} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function FloatChip({ t, icon, title, sub, className, delay = 0 }: { t: Theme; icon: string; title: string; sub: string; className: string; delay?: number }) {
  return (
    <motion.div className={`absolute z-10 ${className}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: [0, -10, 0] }} transition={{ opacity: { duration: 0.6, delay: 0.8 + delay * 0.25 }, y: { duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay } }}>
      <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/90 px-3.5 py-2.5 shadow-[0_24px_50px_-24px_rgba(15,23,42,0.4)] backdrop-blur-md">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: mix(t.primary, 14), color: t.primary }}><Icon icon={icon} width={20} /></span>
        <div className="leading-tight">
          <p className="text-[12.5px] font-black" style={{ color: t.ink }}>{title}</p>
          <p className="text-[11px] font-semibold text-gray-400">{sub}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════ SERVICES / CATS ══
function ServicesRail({ t, services, onClick }: { t: Theme; services: Service[]; onClick: () => void }) {
  return (
    <section className="mx-auto max-w-7xl px-4 lg:px-6">
      <motion.div variants={fmStagger} initial="hidden" whileInView="show" viewport={fmViewport} className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${SERVICE_COLS[services.length] || 'lg:grid-cols-5'}`}>
        {services.map((b) => (
          <motion.button key={b.label} type="button" variants={fmItem} whileHover={{ y: -4 }} onClick={onClick} className="group flex items-center gap-3.5 rounded-2xl border bg-white p-4 text-left transition-shadow duration-300 hover:shadow-[0_22px_44px_-26px_rgba(15,23,42,0.35)]" style={{ borderColor: t.line }}>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" style={{ background: b.bg, color: b.fg }}><Icon icon={b.icon} width={26} /></span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-black" style={{ color: t.ink }}>{b.label}</p>
              <p className="text-[11.5px] font-bold" style={{ color: b.fg }}>{b.sub}</p>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
}

function CategoryGrid({ t, title, tiles, onPick, onMore }: { t: Theme; title: string; tiles: { name: string; real: boolean; icon: string }[]; onPick: (name: string, real: boolean) => void; onMore: () => void }) {
  const vars = { '--fm-c1': t.primary, '--fm-c2': t.onPrimary } as CSSProperties;
  return (
    <section className="mx-auto max-w-7xl px-4 pb-6 pt-16 lg:px-6">
      <SectionHeader t={t} eyebrow="Explora" title={title} onMore={onMore} />
      {/* flex-wrap centrado: la última fila incompleta queda equilibrada al centro */}
      <motion.div variants={fmStagger} initial="hidden" whileInView="show" viewport={fmViewport} className="flex flex-wrap justify-center gap-3" style={vars}>
        {tiles.map((c) => (
          <motion.button key={c.name} type="button" variants={fmItem} whileHover={{ y: -6 }} onClick={() => onPick(c.name, c.real)} className="group flex w-[calc((100%-1.5rem)/3)] flex-col items-center gap-3 rounded-3xl border bg-white px-3 pb-5 pt-6 text-center transition-shadow duration-300 hover:shadow-[0_26px_50px_-30px_rgba(15,23,42,0.4)] sm:w-[calc((100%-2.25rem)/4)] lg:w-[calc((100%-3.75rem)/6)]" style={{ borderColor: t.line }}>
            <span className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl" style={{ background: mix(t.primary, 11) }}>
              <span className="absolute inset-0 scale-50 rounded-2xl opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" style={{ background: t.primary }} />
              <Icon icon={c.icon} width={32} className="relative text-[color:var(--fm-c1)] transition-colors duration-300 group-hover:text-[color:var(--fm-c2)]" />
            </span>
            <span className="line-clamp-2 text-[12.5px] font-bold leading-tight" style={{ color: t.ink }}>{c.name}</span>
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════ PROMOS ══
/** Fotos por defecto (curadas y verificadas). El dueño las reemplaza en Personalizar. */
const BANNER_DEFAULTS = {
  one: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=1400&q=75',
  two: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1400&q=75',
  b1: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&w=900&q=75',
  b2: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=900&q=75',
};

type Banner = { key: string; big: boolean; span: string; tone: string; eyebrow: string; title: string; img: string; action: string };

function PromoBento({ t, diseno, goAction }: { t: Theme; diseno: any; goAction: (key: string) => void }) {
  const cta = editable(diseno?.farmaciaPromoButton, 'Ver productos');
  const banners: Banner[] = [
    { key: 'one', big: true, span: 'sm:col-span-2 lg:col-span-2 lg:row-span-2', tone: t.primary, eyebrow: editable(diseno?.farmaciaPromoOneEyebrow, 'Tu farmacia de confianza'), title: editable(diseno?.farmaciaPromoOneTitle, 'Todo para tu salud en un solo lugar'), img: diseno?.farmaciaPromoOneImageUrl || BANNER_DEFAULTS.one, action: 'farmaciaPromoOneAction' },
    { key: 'two', big: false, span: 'sm:col-span-2 lg:col-span-2', tone: '#0E7C86', eyebrow: editable(diseno?.farmaciaPromoTwoEyebrow, 'Favoritos'), title: editable(diseno?.farmaciaPromoTwoTitle, 'Lo más pedido por nuestros clientes'), img: diseno?.farmaciaPromoTwoImageUrl || BANNER_DEFAULTS.two, action: 'farmaciaPromoTwoAction' },
    { key: 'b1', big: false, span: '', tone: '#1D6FB8', eyebrow: editable(diseno?.farmaciaBannerOneSub, 'Garantizado'), title: editable(diseno?.farmaciaBannerOneTitle, '100% originales'), img: diseno?.farmaciaBannerOneImageUrl || BANNER_DEFAULTS.b1, action: 'farmaciaBannerOneAction' },
    { key: 'b2', big: false, span: '', tone: '#C2611F', eyebrow: editable(diseno?.farmaciaBannerTwoSub, 'Cada día'), title: editable(diseno?.farmaciaBannerTwoTitle, 'Precios justos'), img: diseno?.farmaciaBannerTwoImageUrl || BANNER_DEFAULTS.b2, action: 'farmaciaBannerTwoAction' },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
      <motion.div variants={fmStagger} initial="hidden" whileInView="show" viewport={fmViewport} className="grid gap-4 sm:grid-cols-2 lg:h-[520px] lg:grid-cols-4 lg:grid-rows-2">
        {banners.map((b) => <BannerCard key={b.key} t={t} b={b} cta={cta} onClick={() => goAction(b.action)} />)}
      </motion.div>
    </section>
  );
}

/**
 * Banner fotográfico a sangre completa: la imagen cubre la tarjeta y un velo degradado
 * garantiza la lectura del texto blanco. Si la imagen falla, queda el degradado de marca.
 */
function BannerCard({ t, b, cta, onClick }: { t: Theme; b: Banner; cta: string; onClick: () => void }) {
  const [broken, setBroken] = useState(false);
  const veil = b.big
    ? 'linear-gradient(180deg, rgba(6,14,24,0.10) 0%, rgba(6,14,24,0.28) 40%, rgba(6,14,24,0.86) 100%)'
    : 'linear-gradient(100deg, rgba(6,14,24,0.86) 0%, rgba(6,14,24,0.55) 48%, rgba(6,14,24,0.08) 100%)';
  return (
    <motion.button
      type="button"
      variants={fmItem}
      whileHover="hover"
      onClick={onClick}
      className={`group relative isolate flex overflow-hidden rounded-[28px] text-left shadow-[0_24px_60px_-40px_rgba(6,14,24,0.7)] ${b.big ? 'min-h-[360px]' : 'min-h-[230px]'} ${b.span}`}
      style={{ background: `linear-gradient(140deg, ${mix(b.tone, 88, '#0B1220')} 0%, ${mix(b.tone, 55, '#0B1220')} 100%)` }}
    >
      {!broken && (
        <motion.img
          src={b.img}
          alt=""
          loading="lazy"
          onError={() => setBroken(true)}
          variants={{ hover: { scale: 1.07 } }}
          transition={{ duration: 0.9, ease: fmEase }}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
      )}
      <div aria-hidden className="absolute inset-0 -z-10" style={{ background: veil }} />

      <div className={`relative flex w-full flex-col text-white ${b.big ? 'justify-end p-8 sm:p-10' : 'justify-between p-6'}`}>
        <div className={b.big ? 'max-w-lg' : 'max-w-[78%]'}>
          <span className="inline-flex rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[10.5px] font-black uppercase tracking-[0.16em] backdrop-blur-md">{b.eyebrow}</span>
          <h3 className={`mt-3 font-black leading-[1.06] tracking-[-0.02em] [text-wrap:balance] ${b.big ? 'text-[34px] sm:text-[46px]' : 'text-[21px] sm:text-[23px]'}`}>{b.title}</h3>
        </div>
        <span className={`inline-flex w-max items-center gap-2 rounded-full bg-white font-black shadow-lg ${b.big ? 'mt-7 px-6 py-3 text-[14px]' : 'mt-4 px-4 py-2 text-[12.5px]'}`} style={{ color: t.ink }}>
          {cta}
          <Icon icon="solar:arrow-right-linear" width={b.big ? 18 : 15} className="transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </motion.button>
  );
}

// ═════════════════════════════════════════════════════════ FLASH DEALS ══
function FlashDeals({ t, title, products, endsAt, slug, onOpen, onAdd, onMore }: { t: Theme; title: string; products: any[]; endsAt: number | null; slug: string; onOpen: OpenFn; onAdd: AddFn; onMore: () => void }) {
  return (
    <section className="relative py-16" style={{ background: `linear-gradient(180deg, ${mix(t.primary, 9, t.bg)} 0%, ${mix(t.primary, 3, t.bg)} 100%)` }}>
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <motion.div variants={fmReveal} initial="hidden" whileInView="show" viewport={fmViewport} className="mb-9 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider" style={{ background: t.accent, color: t.onAccent }}>
              <Icon icon="solar:bolt-bold" width={14} /> Por tiempo limitado
            </span>
            <h2 className="mt-3 text-[30px] font-black tracking-[-0.02em] sm:text-[36px]" style={{ color: t.ink }}>{title}</h2>
            <button type="button" onClick={onMore} className="group mt-1 inline-flex items-center gap-1.5 text-[14px] font-bold" style={{ color: t.primary }}>
              Ver todas las ofertas <Icon icon="solar:arrow-right-linear" width={17} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
          {endsAt && <OfferCountdown t={t} endsAt={endsAt} />}
        </motion.div>
        <ProductGrid t={t} products={products} slug={slug} onOpen={onOpen} onAdd={onAdd} />
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════ RECETA (Rx) ══
const RX_COPY: Record<RxMode, { text: string; cta: string; ctaIcon: string; steps: { icon: string; title: string; text: string }[] }> = {
  whatsapp: {
    text: 'Envíanos una foto por WhatsApp y nuestro químico farmacéutico prepara tu pedido. Sin filas, sin esperas.',
    cta: 'Enviar por WhatsApp',
    ctaIcon: 'ic:baseline-whatsapp',
    steps: [
      { icon: 'solar:camera-bold-duotone', title: 'Toma una foto', text: 'de tu receta médica' },
      { icon: 'solar:chat-round-check-bold-duotone', title: 'La validamos', text: 'con un químico farmacéutico' },
      { icon: 'solar:delivery-bold-duotone', title: 'Recíbela en casa', text: 'o recoge en tienda' },
    ],
  },
  phone: {
    text: 'Llámanos y nuestro químico farmacéutico te ayuda a preparar tu pedido con tu receta.',
    cta: 'Llamar a la farmacia',
    ctaIcon: 'solar:phone-calling-bold',
    steps: [
      { icon: 'solar:phone-calling-bold-duotone', title: 'Llámanos', text: 'con tu receta a la mano' },
      { icon: 'solar:chat-round-check-bold-duotone', title: 'La validamos', text: 'con un químico farmacéutico' },
      { icon: 'solar:delivery-bold-duotone', title: 'Recíbela en casa', text: 'o recoge en tienda' },
    ],
  },
  visit: {
    text: 'Tráela a nuestra farmacia y te atendemos al momento con asesoría profesional.',
    cta: 'Cómo llegar',
    ctaIcon: 'solar:map-point-wave-bold',
    steps: [
      { icon: 'solar:document-medicine-bold-duotone', title: 'Trae tu receta', text: 'a nuestra farmacia' },
      { icon: 'solar:chat-round-check-bold-duotone', title: 'La validamos', text: 'con un químico farmacéutico' },
      { icon: 'solar:bag-heart-bold-duotone', title: 'Llévate tu pedido', text: 'al instante' },
    ],
  },
};

function RxBand({ t, diseno, mode, url }: { t: Theme; diseno: any; mode: RxMode; url: string }) {
  const copy = RX_COPY[mode];
  const steps = copy.steps;
  const cta = {
    label: copy.cta,
    icon: copy.ctaIcon,
    onClick: () => (mode === 'phone' ? (window.location.href = url) : window.open(url, '_blank', 'noopener,noreferrer')),
  };

  return (
    <section id="fm-receta" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 lg:px-6">
      <motion.div variants={fmReveal} initial="hidden" whileInView="show" viewport={fmViewport} className="relative grid items-center gap-10 overflow-hidden rounded-[36px] px-7 py-11 sm:px-12 sm:py-14 lg:grid-cols-[1fr_1.2fr]" style={{ background: `linear-gradient(125deg, ${t.primary} 0%, ${mix(t.primary, 72, '#0B1220')} 100%)`, color: t.onPrimary }}>
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <Icon aria-hidden icon="solar:health-bold" width={380} className="pointer-events-none absolute -bottom-28 -left-24 opacity-[0.07]" />

        <div className="relative">
          <p className="text-[12px] font-black uppercase tracking-[0.2em] opacity-75">{editable(diseno?.farmaciaRxEyebrow, 'Pedidos con receta')}</p>
          <h2 className="mt-3 text-[32px] font-black leading-[1.06] tracking-[-0.02em] sm:text-[40px]">{editable(diseno?.farmaciaRxTitle, '¿Tienes una receta médica?')}</h2>
          <p className="mt-4 max-w-md text-[15.5px] leading-relaxed opacity-85">{editable(diseno?.farmaciaRxText, copy.text)}</p>
          <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={cta.onClick} className="mt-8 inline-flex h-14 items-center gap-2.5 rounded-full bg-white px-7 text-[15px] font-black shadow-xl" style={{ color: t.ink }}>
            <Icon icon={cta.icon} width={22} style={{ color: mode === 'whatsapp' ? '#25D366' : t.primary }} />
            {cta.label}
          </motion.button>
        </div>

        <motion.ol variants={fmStagger} initial="hidden" whileInView="show" viewport={fmViewport} className="relative grid gap-4 sm:grid-cols-3">
          <motion.span aria-hidden className="absolute left-[16%] right-[16%] top-9 hidden h-px origin-left sm:block" style={{ background: 'rgba(255,255,255,0.35)' }} initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={fmViewport} transition={{ duration: 1.2, delay: 0.3, ease: fmEase }} />
          {steps.map((s, i) => (
            <motion.li key={s.title} variants={fmItem} className="relative flex flex-col items-center rounded-3xl border border-white/15 bg-white/10 px-4 pb-6 pt-5 text-center backdrop-blur-sm">
              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg" style={{ color: t.primary }}>
                <Icon icon={s.icon} width={28} />
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black" style={{ background: t.accent, color: t.onAccent }}>{i + 1}</span>
              </span>
              <p className="mt-4 text-[15px] font-black">{s.title}</p>
              <p className="mt-1 text-[12.5px] opacity-75">{s.text}</p>
            </motion.li>
          ))}
        </motion.ol>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════ PRODUCT TABS ══
/** Tabs aislados: cambiar de pestaña solo re-renderiza esta sección. */
function ProductTabs({ t, diseno, list, slug, loading, onOpen, onAdd, onMore }: { t: Theme; diseno: any; list: any[]; slug: string; loading?: boolean; onOpen: OpenFn; onAdd: AddFn; onMore: () => void }) {
  const tabs = useMemo(() => {
    const top = [...list].sort((a, b) => Number(b?.vendidos ?? 0) - Number(a?.vendidos ?? 0));
    const nuevos = [...list].sort((a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0));
    const ofertas = list.filter((p) => getProductPricing(p).enOferta);
    return [
      { key: 'top', label: editable(diseno?.farmaciaColTrendTitle, 'Más vendidos'), items: top.slice(0, 10) },
      { key: 'new', label: editable(diseno?.farmaciaColNewTitle, 'Nuevos ingresos'), items: nuevos.slice(0, 10) },
      { key: 'sale', label: editable(diseno?.farmaciaColSaleTitle, 'En oferta'), items: ofertas.slice(0, 10) },
    ];
  }, [list, diseno?.farmaciaColTrendTitle, diseno?.farmaciaColNewTitle, diseno?.farmaciaColSaleTitle]);
  const [active, setActive] = useState('top');
  const current = tabs.find((x) => x.key === active) || tabs[0];

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 lg:px-6">
      <SectionHeader
        t={t}
        eyebrow="Lo más buscado"
        title={editable(diseno?.farmaciaTabsTitle, 'Nuestros productos')}
        right={
          <div className="flex max-w-full overflow-x-auto rounded-full border bg-white p-1 [scrollbar-width:none]" style={{ borderColor: t.line }} role="tablist">
            {tabs.map((tab) => (
              <button key={tab.key} type="button" role="tab" aria-selected={active === tab.key} onClick={() => setActive(tab.key)} className="relative shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 text-[13px] font-bold transition-colors duration-300 sm:px-5" style={{ color: active === tab.key ? t.onPrimary : t.ink }}>
                {active === tab.key && <motion.span layoutId="fm-tab-pill" className="absolute inset-0 rounded-full" style={{ background: t.primary }} transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                <span className="relative">{tab.label}</span>
              </button>
            ))}
          </div>
        }
      />
      {loading ? <GridSkeleton t={t} /> : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={active} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: fmEase }}>
            {current.items.length ? (
              <ProductGrid t={t} products={current.items} slug={slug} onOpen={onOpen} onAdd={onAdd} />
            ) : (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed bg-white py-16 text-center" style={{ borderColor: t.line }}>
                <Icon icon="solar:tag-price-linear" width={48} className="text-gray-300" />
                <p className="mt-3 text-[15px] font-bold" style={{ color: t.ink }}>Pronto tendremos productos aquí</p>
                <button type="button" onClick={onMore} className="mt-4 text-[13px] font-bold" style={{ color: t.primary }}>Ver todo el catálogo →</button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </section>
  );
}

// ══════════════════════════════════════════════════════ BRANDS / RAIL ══
function BrandsMarquee({ t, title, brands }: { t: Theme; title: string; brands: string[] }) {
  const loop = [...brands, ...brands];
  const fade = 'linear-gradient(90deg, transparent, black 10%, black 90%, transparent)';
  return (
    <section className="border-y bg-white py-10" style={{ borderColor: t.line }}>
      <p className="mb-7 text-center text-[12px] font-black uppercase tracking-[0.22em] text-gray-400">{title}</p>
      <div className="overflow-hidden" style={{ maskImage: fade, WebkitMaskImage: fade }}>
        <div className="fm-marquee flex w-max gap-4">
          {loop.map((b, i) => (
            <span key={`${b}-${i}`} className="flex h-14 shrink-0 items-center rounded-2xl border px-8 text-[17px] font-black tracking-tight" style={{ borderColor: t.line, color: t.ink }}>{b}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════ NEWSLETTER ══
function Newsletter({ t, diseno, waUrl }: { t: Theme; diseno: any; waUrl: string }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 pt-4 lg:px-6">
      <motion.div variants={fmReveal} initial="hidden" whileInView="show" viewport={fmViewport} className="relative grid items-center gap-8 overflow-hidden rounded-[36px] border bg-white px-8 py-12 sm:px-14 lg:grid-cols-[1.3fr_1fr]" style={{ borderColor: t.line }}>
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full blur-3xl" style={{ background: mix(t.primary, 22, 'transparent') }} />
        <div className="relative">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: mix(t.primary, 12), color: t.primary }}><Icon icon="solar:bell-bing-bold-duotone" width={26} /></span>
          <h3 className="mt-5 text-[28px] font-black leading-tight tracking-[-0.02em] sm:text-[32px]" style={{ color: t.ink }}>{editable(diseno?.farmaciaNewsletterTitle, 'Recibe ofertas exclusivas')}</h3>
          <p className="mt-2 max-w-md text-[15px] leading-relaxed text-gray-500">{editable(diseno?.farmaciaNewsletterText, 'Únete a nuestra lista de WhatsApp y entérate primero de descuentos, nuevos productos y campañas de salud.')}</p>
        </div>
        <div className="relative flex lg:justify-end">
          <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => window.open(waUrl, '_blank', 'noopener,noreferrer')} className="inline-flex h-14 items-center gap-2.5 rounded-full px-8 text-[15px] font-black" style={{ background: t.primary, color: t.onPrimary }}>
            <Icon icon="ic:baseline-whatsapp" width={22} /> Unirme por WhatsApp
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}

export { FarmaciaFooter } from './FarmaciaParts';
