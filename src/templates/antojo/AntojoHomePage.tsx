import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import TecnologiaCartModal from '@/components/tienda/TecnologiaCartModal';
import { ANTOJO, AntojoFooter, AntojoHeader, AntojoProductCard, antojoAction, antojoDots } from './AntojoParts';
import { antojoCard, antojoPage, antojoPop, antojoSection, antojoStagger, antojoTap, antojoViewport } from './motion';

const pickSelected = (productos: any[], ids?: any[]) => {
  if (!Array.isArray(ids) || ids.length === 0) return productos;
  const wanted = new Set(ids.map((id) => String(id)));
  const selected = productos.filter((p) => wanted.has(String(p.id)));
  return selected.length ? selected : productos;
};

const CATEGORY_FALLBACK = [
  { nombre: 'Pizzas', icon: 'solar:pizza-bold', tint: ANTOJO.tomato },
  { nombre: 'Frappes', icon: 'solar:cup-hot-bold', tint: ANTOJO.mint },
  { nombre: 'Cremoladas', icon: 'solar:snowflake-bold', tint: '#7C5CFF' },
  { nombre: 'Combos', icon: 'solar:donut-bitten-bold', tint: ANTOJO.orange },
];

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <motion.div variants={antojoPop} className="mb-9 text-center">
      <p className="text-sm font-black uppercase tracking-[0.28em]" style={{ color: ANTOJO.orange }}>{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-neutral-900 md:text-5xl">{title}</h2>
    </motion.div>
  );
}

export default function AntojoHomePage({
  tienda,
  slug,
  productos,
  allCategories,
  cp,
  diseno,
  carrito,
  setCarrito,
  mostrarCarrito,
  setMostrarCarrito,
  agregarAlCarrito,
  actualizarCantidad,
  loading,
}: TemplateHomePageProps) {
  const primary = cp || ANTOJO.tomato;
  const featured = pickSelected(productos, diseno?.antojoFeaturedProducts).slice(0, 8);
  const populares = pickSelected(productos, diseno?.antojoLatestProducts).slice(0, 4);
  const categoryItems = (allCategories.length ? allCategories.slice(0, 4) : CATEGORY_FALLBACK).map((c: any, i: number) => ({
    nombre: typeof c === 'string' ? c : c?.nombre,
    icon: CATEGORY_FALLBACK[i % CATEGORY_FALLBACK.length].icon,
    tint: CATEGORY_FALLBACK[i % CATEGORY_FALLBACK.length].tint,
  }));
  const navigate = (to: string) => {
    window.location.href = to;
  };

  return (
    <motion.div initial="hidden" animate="show" variants={antojoPage} className="min-h-screen" style={{ backgroundColor: ANTOJO.cream, fontFamily: `'${diseno?.tipografia || 'Poppins'}', sans-serif` }}>
      {/* ── Hero cálido con degradado y antojos flotantes ─────────────────── */}
      <motion.section variants={antojoSection} className="relative isolate overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${ANTOJO.orange})` }}>
        <div className="absolute inset-0 z-0 opacity-30" style={antojoDots} aria-hidden />
        {[
          { icon: 'solar:pizza-bold', className: 'left-[6%] top-[24%] text-white/20', size: 90, dur: 6 },
          { icon: 'solar:cup-hot-bold', className: 'right-[8%] top-[18%] text-white/20', size: 76, dur: 7 },
          { icon: 'solar:snowflake-bold', className: 'right-[16%] bottom-[14%] text-white/15', size: 64, dur: 5.5 },
        ].map((f) => (
          <motion.div
            key={f.icon}
            aria-hidden
            className={`pointer-events-none absolute hidden md:block ${f.className}`}
            animate={{ y: [0, -18, 0], rotate: [-6, 6, -6] }}
            transition={{ duration: f.dur, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Icon icon={f.icon} width={f.size} />
          </motion.div>
        ))}

        <AntojoHeader
          tienda={tienda}
          slug={slug}
          cp={primary}
          diseno={diseno}
          carritoSize={carrito.reduce((s, i) => s + Number(i.cantidad || 1), 0)}
          onOpenCart={() => setMostrarCarrito(true)}
          allCategories={allCategories}
          onSearchSubmit={(event, value) => {
            event.preventDefault();
            navigate(`/tienda/${slug}/catalogo${value ? `?search=${encodeURIComponent(value)}` : ''}`);
          }}
          overlay
        />

        <div className="relative z-10 mx-auto max-w-7xl px-5 pb-24 pt-10 text-center md:pb-32 md:pt-16">
          <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-black uppercase tracking-wide text-white backdrop-blur">
            <Icon icon="solar:fire-bold" /> {diseno?.antojoHeroEyebrow || 'Recién hecho, siempre antojable'}
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }} className="mx-auto mt-6 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-white drop-shadow md:text-7xl">
            {diseno?.antojoHeroTitle || 'Pizzas, frappes y cremoladas'}
          </motion.h1>
          <p className="mx-auto mt-5 max-w-xl text-base font-semibold text-white/85 md:text-lg">
            {diseno?.antojoHeroSubtitle || 'El caliente y el helado que se te antojan, en un solo lugar. Pide delivery o recoge en tienda.'}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <motion.button
              type="button"
              onClick={() => antojoAction(diseno?.antojoHeroAction, slug, navigate)}
              className="inline-flex h-13 items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-black uppercase tracking-wide shadow-lg"
              style={{ color: primary }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={antojoTap}
            >
              <Icon icon="solar:bag-4-bold" /> {diseno?.antojoHeroButton || 'Ver la carta'}
            </motion.button>
            <a href={`/tienda/${slug}/seguimiento`} className="inline-flex h-13 items-center gap-2 rounded-full bg-black/25 px-7 py-3.5 text-sm font-black uppercase tracking-wide text-white backdrop-blur transition-transform hover:scale-105">
              <Icon icon="solar:map-point-bold" /> Seguir pedido
            </a>
          </div>
        </div>
        {/* Onda inferior */}
        <div className="absolute inset-x-0 bottom-0 z-0" aria-hidden>
          <svg viewBox="0 0 1440 120" className="h-[60px] w-full md:h-[90px]" preserveAspectRatio="none">
            <path d="M0,64 C240,120 480,0 720,32 C960,64 1200,120 1440,72 L1440,120 L0,120 Z" fill={ANTOJO.cream} />
          </svg>
        </div>
      </motion.section>

      <main>
        {/* ── Categorías circulares ─────────────────────────────────────────── */}
        <motion.section variants={antojoSection} initial="hidden" whileInView="show" viewport={antojoViewport} className="mx-auto max-w-7xl px-5 pt-14 pb-6">
          <motion.div variants={antojoStagger} className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {categoryItems.map((cat, index) => (
              <motion.a
                key={`${cat.nombre}-${index}`}
                variants={antojoCard}
                whileHover={{ y: -6 }}
                href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(cat.nombre)}`}
                className="group flex flex-col items-center rounded-[26px] bg-white p-6 text-center shadow-md shadow-black/5 ring-1 ring-black/5 transition-shadow hover:shadow-xl"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full text-white shadow-inner transition-transform group-hover:scale-110" style={{ backgroundColor: cat.tint }}>
                  <Icon icon={cat.icon} width={38} />
                </span>
                <h3 className="mt-4 text-base font-black text-neutral-900">{cat.nombre}</h3>
              </motion.a>
            ))}
          </motion.div>
        </motion.section>

        {/* ── Antojos del día (destacados) ──────────────────────────────────── */}
        <motion.section variants={antojoSection} initial="hidden" whileInView="show" viewport={antojoViewport} className="mx-auto max-w-7xl px-5 py-14">
          <SectionTitle eyebrow={diseno?.antojoFeaturedEyebrow || 'Lo más pedido'} title={diseno?.antojoFeaturedTitle || 'Antojos del día'} />
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[360px] animate-pulse rounded-[26px] bg-black/5" />)}
            </div>
          ) : (
            <motion.div variants={antojoStagger} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((producto) => (
                <AntojoProductCard key={producto.id} producto={producto} slug={slug} cp={primary} onAddToCart={agregarAlCarrito} onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)} />
              ))}
            </motion.div>
          )}
        </motion.section>

        {/* ── Banda promo caliente vs helado ────────────────────────────────── */}
        <motion.section variants={antojoSection} initial="hidden" whileInView="show" viewport={antojoViewport} className="mx-auto max-w-7xl px-5 pb-14">
          <div className="grid gap-6 md:grid-cols-2">
            <motion.button
              type="button"
              onClick={() => antojoAction(diseno?.antojoPromoHotAction, slug, navigate, `/tienda/${slug}/catalogo?search=pizza`)}
              whileHover={{ y: -5, scale: 1.01 }}
              whileTap={antojoTap}
              className="relative flex min-h-[190px] items-center overflow-hidden rounded-[28px] p-8 text-left text-white shadow-lg"
              style={{ background: `linear-gradient(120deg, ${ANTOJO.tomato}, ${ANTOJO.orange})` }}
            >
              <Icon icon="solar:pizza-bold" className="absolute -right-4 -bottom-6 text-white/20" width={190} />
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-3 py-1 text-[11px] font-black uppercase"><Icon icon="solar:fire-bold" width={13} /> Caliente</span>
                <h3 className="mt-3 max-w-[16ch] text-3xl font-black leading-tight">{diseno?.antojoPromoHotTitle || 'Pizzas recién horneadas'}</h3>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-black underline underline-offset-4">Pedir ahora <Icon icon="solar:arrow-right-bold" /></span>
              </div>
            </motion.button>
            <motion.button
              type="button"
              onClick={() => antojoAction(diseno?.antojoPromoColdAction, slug, navigate, `/tienda/${slug}/catalogo?search=frappe`)}
              whileHover={{ y: -5, scale: 1.01 }}
              whileTap={antojoTap}
              className="relative flex min-h-[190px] items-center overflow-hidden rounded-[28px] p-8 text-left text-white shadow-lg"
              style={{ background: `linear-gradient(120deg, ${ANTOJO.mint}, #7C5CFF)` }}
            >
              <Icon icon="solar:cup-hot-bold" className="absolute -right-4 -bottom-6 text-white/20" width={190} />
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-3 py-1 text-[11px] font-black uppercase"><Icon icon="solar:snowflake-bold" width={13} /> Helado</span>
                <h3 className="mt-3 max-w-[16ch] text-3xl font-black leading-tight">{diseno?.antojoPromoColdTitle || 'Frappes y cremoladas'}</h3>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-black underline underline-offset-4">Refréscate <Icon icon="solar:arrow-right-bold" /></span>
              </div>
            </motion.button>
          </div>
        </motion.section>

        {/* ── Cómo funciona ─────────────────────────────────────────────────── */}
        <motion.section variants={antojoSection} initial="hidden" whileInView="show" viewport={antojoViewport} className="relative isolate overflow-hidden py-16" style={{ backgroundColor: '#fff' }}>
          <div className="mx-auto max-w-7xl px-5">
            <SectionTitle eyebrow={diseno?.antojoStepsEyebrow || 'Fácil y rápido'} title={diseno?.antojoStepsTitle || 'Tu antojo en 3 pasos'} />
            <motion.div variants={antojoStagger} className="grid gap-6 md:grid-cols-3">
              {[
                ['solar:hamburger-menu-bold', 'Elige de la carta', 'Arma tu pedido con pizzas, frappes y cremoladas.'],
                ['solar:cart-check-bold', 'Confirma tu pedido', 'Delivery o recojo, pago con Yape, Plin o efectivo.'],
                ['solar:box-bold', 'Recíbelo caliente o helado', 'Seguimos tu pedido hasta tu puerta.'],
              ].map(([icon, title, text], i) => (
                <motion.div key={title} variants={antojoCard} className="rounded-[26px] p-7 text-center" style={{ backgroundColor: ANTOJO.cream }}>
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-white" style={{ backgroundColor: [ANTOJO.tomato, ANTOJO.orange, ANTOJO.mint][i] }}>
                    <Icon icon={icon} width={30} />
                  </span>
                  <h3 className="mt-5 text-lg font-black text-neutral-900">{title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-neutral-500">{text}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* ── Populares ─────────────────────────────────────────────────────── */}
        {populares.length > 0 && (
          <motion.section variants={antojoSection} initial="hidden" whileInView="show" viewport={antojoViewport} className="mx-auto max-w-7xl px-5 py-16">
            <SectionTitle eyebrow={diseno?.antojoPopularEyebrow || 'Los favoritos'} title={diseno?.antojoPopularTitle || 'También te va a encantar'} />
            <motion.div variants={antojoStagger} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {populares.map((producto) => (
                <AntojoProductCard key={producto.id} producto={producto} slug={slug} cp={primary} onAddToCart={agregarAlCarrito} onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)} />
              ))}
            </motion.div>
            <div className="mt-10 text-center">
              <a href={`/tienda/${slug}/catalogo`} className="inline-flex h-13 items-center gap-2 rounded-full px-8 py-3.5 text-sm font-black uppercase tracking-wide text-white shadow-lg transition-transform hover:scale-105" style={{ backgroundColor: primary }}>
                Ver la carta completa <Icon icon="solar:arrow-right-bold" />
              </a>
            </div>
          </motion.section>
        )}
      </main>

      <AntojoFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <TecnologiaCartModal
        isOpen={mostrarCarrito}
        onClose={() => setMostrarCarrito(false)}
        carrito={carrito}
        setCarrito={setCarrito}
        actualizarCantidad={actualizarCantidad}
        onCheckout={() => {
          window.location.href = `/tienda/${slug}/checkout`;
        }}
        cp={primary}
        tienda={tienda}
      />
    </motion.div>
  );
}
