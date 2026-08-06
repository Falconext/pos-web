import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import TecnologiaCartModal from '@/components/tienda/TecnologiaCartModal';
import { LUX, LuxuryFooter, LuxuryHeader, LuxuryProductCard, LuxuryProductImage, luxFont, luxPrimary, storeName, withAlpha } from './LuxuryParts';
import { luxCard, luxFade, luxPage, luxSection, luxStagger, luxTap, luxViewport } from './motion';

const navigate = (to: string) => { window.location.href = to; };

/** Colecciones por género/segmento (lo que pidió el cliente). */
const COLLECTIONS = [
  { label: 'Para ella', cat: 'Mujer', icon: 'solar:hearts-bold', desc: 'Florales y sofisticados' },
  { label: 'Para él', cat: 'Hombre', icon: 'mdi:account-tie', desc: 'Amaderados e intensos' },
  { label: 'Unisex', cat: 'Unisex', icon: 'solar:users-group-rounded-bold', desc: 'Sin etiquetas' },
  { label: 'Nicho selecto', cat: 'Nicho', icon: 'solar:crown-bold', desc: 'Ediciones exclusivas' },
];

/** Familias olfativas para "Encuentra tu fragancia". */
const OLFACTIVE = [
  { label: 'Floral', icon: 'solar:flower-bold', q: 'floral' },
  { label: 'Amaderado', icon: 'solar:tree-bold', q: 'amaderado' },
  { label: 'Cítrico', icon: 'solar:citrus-bold', q: 'citrico' },
  { label: 'Oriental', icon: 'solar:fire-bold', q: 'oriental' },
  { label: 'Fresco', icon: 'solar:waterdrops-bold', q: 'fresco' },
  { label: 'Dulce', icon: 'solar:donut-bold', q: 'dulce' },
];

const BRANDS = ['CHANEL', 'DIOR', 'TOM FORD', 'CREED', 'JO MALONE', 'VERSACE', 'YVES SAINT LAURENT', 'ARMANI', 'GIVENCHY', 'CAROLINA HERRERA'];

const TESTIMONIALS = [
  { name: 'Valeria M.', text: 'La fragancia llegó impecable, con un empaque de lujo. Se nota la calidad desde que abres la caja.', initial: 'V' },
  { name: 'Sebastián R.', text: 'Encontré un nicho que buscaba hace meses. Atención por WhatsApp rápida y envío discreto.', initial: 'S' },
  { name: 'Camila T.', text: 'Mi perfume favorito, original y a mejor precio. Ya es mi tienda de cabecera para regalos.', initial: 'C' },
];

function Eyebrow({ children, color }: { children: ReactNode; color: string }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.3em]" style={{ color }}>{children}</p>;
}

export default function LuxuryHomePage({
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
  const primary = luxPrimary(cp);
  const font = luxFont(diseno);
  const name = storeName(tienda, diseno);
  const featured = productos.slice(0, 8);
  const heroProduct = productos[0];
  const cupon = diseno?.luxuryCupon || 'WELCOME15';

  return (
    <motion.div initial="hidden" animate="show" variants={luxPage} className="min-h-screen" style={{ backgroundColor: LUX.porcelain, fontFamily: font }}>
      {/* ── Barra superior ─────────────────────────────────────────────────── */}
      <div className="w-full text-center text-white" style={{ backgroundColor: LUX.ink }}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-1 px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/80">
          <span className="flex items-center gap-1.5"><Icon icon="solar:box-minimalistic-linear" width={13} style={{ color: LUX.gold }} /> Envío a todo el país</span>
          <span className="hidden items-center gap-1.5 sm:flex"><Icon icon="solar:gift-linear" width={13} style={{ color: LUX.gold }} /> Envolvemos para regalo</span>
          <span className="flex items-center gap-1.5"><Icon icon="solar:verified-check-linear" width={13} style={{ color: LUX.gold }} /> 100% originales</span>
        </div>
      </div>

      <LuxuryHeader
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
      />

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative isolate overflow-hidden" style={{ background: `radial-gradient(120% 120% at 85% 10%, ${withAlpha(primary, '26')} 0%, ${LUX.porcelain} 55%)` }}>
          {/* halos decorativos */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-40 blur-3xl" style={{ background: withAlpha(primary, '55') }} aria-hidden />
          <div className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full opacity-30 blur-3xl" style={{ background: withAlpha(LUX.gold, '77') }} aria-hidden />

          <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-14 md:grid-cols-2 md:py-24">
            <motion.div variants={luxSection}>
              <Eyebrow color={primary}>{diseno?.luxuryHeroEyebrow || 'Atrévete a ser inolvidable'}</Eyebrow>
              <h1 className="mt-5 text-5xl leading-[1.02] tracking-tight text-neutral-900 md:text-7xl" style={{ fontFamily: LUX.serif }}>
                {diseno?.luxuryHeroTitle || 'La fragancia que te'}{' '}
                <span className="italic" style={{ color: primary }}>{diseno?.luxuryHeroAccent || 'define'}</span>
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-neutral-500">
                {diseno?.luxuryHeroSubtitle || 'Perfumes de autor y fragancias nicho, seleccionados para dejar una huella que perdura. Descubre la tuya.'}
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <motion.a
                  href={`/tienda/${slug}/catalogo`}
                  className="inline-flex h-13 items-center gap-2 rounded-full px-8 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-lg"
                  style={{ backgroundColor: primary, boxShadow: `0 20px 40px -18px ${withAlpha(primary, 'cc')}` }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={luxTap}
                >
                  Explorar colección <Icon icon="solar:arrow-right-linear" width={16} />
                </motion.a>
                <a href={`/tienda/${slug}/catalogo?search=oferta`} className="inline-flex h-13 items-center gap-2 rounded-full border border-neutral-300 px-7 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-800 transition-colors hover:border-neutral-900">
                  <Icon icon="solar:tag-price-linear" width={16} /> Ver ofertas
                </a>
              </div>
              <div className="mt-10 flex items-center gap-8">
                {[['solar:star-bold', '4.9/5', 'Valoración'], ['solar:box-minimalistic-bold', '+3,000', 'Clientes'], ['solar:verified-check-bold', '100%', 'Originales']].map(([icon, big, small]) => (
                  <div key={small} className="flex items-center gap-2.5">
                    <Icon icon={icon} width={20} style={{ color: LUX.gold }} />
                    <div>
                      <p className="text-base font-semibold text-neutral-900">{big}</p>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">{small}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Producto destacado / imagen */}
            <motion.div variants={luxFade} className="relative">
              <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] border border-white/60 bg-white/60 shadow-[0_40px_90px_-40px_rgba(21,17,28,0.5)] backdrop-blur">
                <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${withAlpha(primary, '1f')}, transparent)` }} />
                {heroProduct ? (
                  <button type="button" onClick={() => navigate(`/tienda/${slug}/producto/${heroProduct.id}`)} className="block h-full w-full">
                    <LuxuryProductImage producto={heroProduct} imgClassName="transition-transform duration-[1200ms] ease-out hover:scale-105" />
                  </button>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Icon icon="mdi:bottle-tonic-plus-outline" className="text-[10rem]" style={{ color: primary }} />
                  </div>
                )}
              </div>
              {heroProduct && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-black/[0.06] bg-white/95 px-5 py-3 shadow-xl backdrop-blur"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full text-white" style={{ backgroundColor: LUX.ink }}>
                    <Icon icon="solar:magic-stick-3-bold" width={16} style={{ color: LUX.gold }} />
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">Los más deseados</p>
                    <p className="line-clamp-1 max-w-[180px] text-sm font-semibold text-neutral-900">{heroProduct.descripcion}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* ── Colecciones ──────────────────────────────────────────────────── */}
        <motion.section variants={luxSection} initial="hidden" whileInView="show" viewport={luxViewport} className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="mb-10 text-center">
            <Eyebrow color={LUX.gold}>Compra por</Eyebrow>
            <h2 className="mt-2 text-3xl text-neutral-900 md:text-4xl" style={{ fontFamily: LUX.serif }}>Nuestras colecciones</h2>
          </div>
          <motion.div variants={luxStagger} className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {COLLECTIONS.map((c) => (
              <motion.a
                key={c.label}
                variants={luxCard}
                whileHover={{ y: -6 }}
                href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(c.cat)}`}
                className="group relative flex flex-col items-start overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-6 transition-shadow hover:shadow-[0_30px_60px_-35px_rgba(21,17,28,0.5)]"
              >
                <span className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-125" style={{ backgroundColor: primary }} />
                <span className="relative flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${LUX.ink})` }}>
                  <Icon icon={c.icon} width={22} />
                </span>
                <h3 className="relative mt-5 text-xl text-neutral-900" style={{ fontFamily: LUX.serif }}>{c.label}</h3>
                <p className="relative mt-1 text-xs text-neutral-500">{c.desc}</p>
                <span className="relative mt-4 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: primary }}>
                  Descubrir <Icon icon="solar:arrow-right-linear" width={13} />
                </span>
              </motion.a>
            ))}
          </motion.div>
        </motion.section>

        {/* ── Encuentra tu fragancia ───────────────────────────────────────── */}
        <motion.section variants={luxSection} initial="hidden" whileInView="show" viewport={luxViewport} className="relative overflow-hidden py-16 md:py-20" style={{ backgroundColor: LUX.ink }}>
          <div className="pointer-events-none absolute -left-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full opacity-20 blur-3xl" style={{ background: primary }} aria-hidden />
          <div className="relative mx-auto max-w-7xl px-6 text-center text-white">
            <Eyebrow color={LUX.gold}>Guía olfativa</Eyebrow>
            <h2 className="mt-2 text-3xl md:text-4xl" style={{ fontFamily: LUX.serif }}>Encuentra tu fragancia</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/55">Elige tu familia olfativa favorita y te mostramos las fragancias que van contigo.</p>
            <motion.div variants={luxStagger} className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {OLFACTIVE.map((o) => (
                <motion.a
                  key={o.label}
                  variants={luxCard}
                  whileHover={{ y: -5 }}
                  href={`/tienda/${slug}/catalogo?search=${encodeURIComponent(o.q)}`}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-white/25 hover:bg-white/[0.08]"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: withAlpha(primary, '33') }}>
                    <Icon icon={o.icon} width={22} style={{ color: LUX.goldSoft }} />
                  </span>
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/85">{o.label}</span>
                </motion.a>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* ── Destacados ───────────────────────────────────────────────────── */}
        <motion.section variants={luxSection} initial="hidden" whileInView="show" viewport={luxViewport} className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow color={LUX.gold}>Selección de la casa</Eyebrow>
              <h2 className="mt-2 text-3xl text-neutral-900 md:text-4xl" style={{ fontFamily: LUX.serif }}>Las más deseadas</h2>
            </div>
            <a href={`/tienda/${slug}/catalogo`} className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-900 hover:opacity-70">
              Ver todo <Icon icon="solar:arrow-right-linear" width={15} />
            </a>
          </div>
          {loading ? (
            <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[420px] animate-pulse rounded-2xl bg-black/[0.04]" />)}
            </div>
          ) : featured.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 py-20 text-center text-neutral-400">Aún no hay fragancias publicadas.</div>
          ) : (
            <motion.div variants={luxStagger} className="grid gap-6 grid-cols-2 lg:grid-cols-4">
              {featured.map((producto) => (
                <LuxuryProductCard key={producto.id} producto={producto} slug={slug} cp={primary} onAddToCart={agregarAlCarrito} onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)} />
              ))}
            </motion.div>
          )}
        </motion.section>

        {/* ── Marcas reconocidas (marquee) ─────────────────────────────────── */}
        <section className="border-y border-black/[0.06] bg-white py-10">
          <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-400">Casas de perfumería que confían</p>
          <div className="relative overflow-hidden" style={{ maskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)' }}>
            <motion.div className="flex w-max gap-14 whitespace-nowrap" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 28, ease: 'linear', repeat: Infinity }}>
              {[...BRANDS, ...BRANDS].map((brand, i) => (
                <span key={`${brand}-${i}`} className="text-lg tracking-[0.2em] text-neutral-400 md:text-2xl" style={{ fontFamily: LUX.serif }}>{brand}</span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Oferta + cupón (banda dramática) ─────────────────────────────── */}
        <motion.section variants={luxSection} initial="hidden" whileInView="show" viewport={luxViewport} className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="relative overflow-hidden rounded-[2rem] px-8 py-14 text-center md:py-20" style={{ background: `linear-gradient(130deg, ${LUX.ink}, ${withAlpha(primary, 'ee')})` }}>
            <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full opacity-25 blur-3xl" style={{ background: LUX.gold }} aria-hidden />
            <div className="relative mx-auto max-w-2xl text-white">
              <Eyebrow color={LUX.goldSoft}>Oferta de bienvenida</Eyebrow>
              <h2 className="mt-3 text-4xl md:text-5xl" style={{ fontFamily: LUX.serif }}>15% de descuento en tu primera compra</h2>
              <p className="mt-4 text-sm text-white/70">Usa el código al finalizar tu pedido y estrena tu fragancia favorita.</p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <span className="rounded-full border border-dashed border-white/40 px-8 py-3.5 text-lg font-semibold uppercase tracking-[0.3em] text-white">{cupon}</span>
                <a href={`/tienda/${slug}/catalogo`} className="inline-flex h-13 items-center gap-2 rounded-full bg-white px-8 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-900 transition-transform hover:scale-105">
                  Comprar ahora <Icon icon="solar:arrow-right-linear" width={16} />
                </a>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Beneficios ───────────────────────────────────────────────────── */}
        <section className="border-y border-black/[0.06] bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
            {[
              ['solar:verified-check-bold', 'Originales', '100% auténticos y sellados'],
              ['solar:box-minimalistic-bold', 'Envío nacional', 'Discreto y asegurado'],
              ['solar:gift-bold', 'Listo para regalar', 'Envolvemos sin costo'],
              ['solar:chat-round-dots-bold', 'Asesoría', 'Te guiamos por WhatsApp'],
            ].map(([icon, title, text]) => (
              <div key={title} className="flex flex-col items-center text-center">
                <Icon icon={icon} width={26} style={{ color: primary }} />
                <p className="mt-3 text-sm font-semibold text-neutral-900">{title}</p>
                <p className="mt-1 text-xs text-neutral-500">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Testimonios ──────────────────────────────────────────────────── */}
        <motion.section variants={luxSection} initial="hidden" whileInView="show" viewport={luxViewport} className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="mb-10 text-center">
            <Eyebrow color={LUX.gold}>Lo que dicen</Eyebrow>
            <h2 className="mt-2 text-3xl text-neutral-900 md:text-4xl" style={{ fontFamily: LUX.serif }}>Amado por miles</h2>
          </div>
          <motion.div variants={luxStagger} className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <motion.div key={t.name} variants={luxCard} className="flex flex-col rounded-2xl border border-black/[0.06] bg-white p-7">
                <div className="flex gap-1" style={{ color: LUX.gold }}>{'★★★★★'}</div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-neutral-600">“{t.text}”</p>
                <div className="mt-6 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${LUX.ink})` }}>{t.initial}</span>
                  <span className="text-sm font-semibold text-neutral-900">{t.name}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      </main>

      <LuxuryFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />

      <TecnologiaCartModal
        isOpen={mostrarCarrito}
        onClose={() => setMostrarCarrito(false)}
        carrito={carrito}
        setCarrito={setCarrito}
        actualizarCantidad={actualizarCantidad}
        onCheckout={() => { window.location.href = `/tienda/${slug}/checkout`; }}
        cp={primary}
        tienda={tienda}
      />
    </motion.div>
  );
}
