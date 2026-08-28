import { type ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { LUX, LuxCartModal, LuxFooter, LuxHeader, LuxProductCard, LuxWhatsAppFab, luxFont, luxPrimary } from './CarterasParts';
import { luxCard, luxEase, luxPage, luxSection, luxStagger, luxTap, luxViewport } from './motion';

const navigate = (to: string) => { window.location.href = to; };

const HERO_SLIDE_FALLBACKS = [
  '/assets/templates/carteras/carterahero1.png',
  'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1600&q=80',
];
const CATEGORY_FALLBACKS = [
  'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=600&q=80',
];
const PROMO_FALLBACK = 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80';

const TRUST = [
  { icon: 'solar:delivery-linear', title: 'Envío gratis', text: 'En compras desde S/ 250' },
  { icon: 'solar:refresh-linear', title: 'Cambios fáciles', text: '30 días sin complicaciones' },
  { icon: 'solar:shield-check-linear', title: 'Pago seguro', text: 'Checkout 100% protegido' },
  { icon: 'solar:headphones-round-linear', title: 'Atención', text: 'Estamos para ayudarte' },
];

function Eyebrow({ children, color, center }: { children: ReactNode; color: string; center?: boolean }) {
  return (
    <p className={`flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.3em] ${center ? 'justify-center' : ''}`} style={{ color }}>
      <span className="h-px w-6" style={{ backgroundColor: color }} />
      {children}
      {center && <span className="h-px w-6" style={{ backgroundColor: color }} />}
    </p>
  );
}

interface HeroSlide {
  image: string;
  eyebrow: string;
  title: string;
  title2: string;
  subtitle: string;
  button: string;
  button2?: string;
  /** true = banner solo imagen (sin textos ni botón), clickeable al destino. */
  onlyImage: boolean;
  /** Clave del enlace (categoría/producto/URL) configurable en el editor. */
  actionKey: string;
}

/** Construye los slides del hero desde `diseno` (todo editable en el editor en vivo). */
function buildHeroSlides(diseno: any): HeroSlide[] {
  const raw: HeroSlide[] = [
    {
      image: diseno?.carterasHeroImage || '',
      eyebrow: diseno?.carterasHeroEyebrow || 'Nueva colección',
      title: diseno?.carterasHeroTitle || 'Estilo atemporal.',
      title2: diseno?.carterasHeroTitle2 || 'Hecho para ti.',
      subtitle: diseno?.carterasHeroSubtitle || 'Carteras y accesorios de lujo elaborados con materiales premium y atención a cada detalle.',
      button: diseno?.carterasHeroButton || 'Comprar novedades',
      button2: diseno?.carterasHeroButton2 || 'Ver colección',
      onlyImage: Boolean(diseno?.carterasHeroOnlyImage),
      actionKey: 'carterasHeroAction',
    },
    {
      image: diseno?.carterasSlide2Image || '',
      eyebrow: diseno?.carterasSlide2Eyebrow || 'Edición limitada',
      title: diseno?.carterasSlide2Title || 'Cuero premium.',
      title2: diseno?.carterasSlide2Title2 || 'Hecho a mano.',
      subtitle: diseno?.carterasSlide2Subtitle || 'Piezas confeccionadas artesanalmente, pensadas para durar y acompañarte por años.',
      button: diseno?.carterasSlide2Button || 'Descubrir',
      onlyImage: Boolean(diseno?.carterasSlide2OnlyImage),
      actionKey: 'carterasSlide2Action',
    },
    {
      image: diseno?.carterasSlide3Image || '',
      eyebrow: diseno?.carterasSlide3Eyebrow || 'Temporada',
      title: diseno?.carterasSlide3Title || 'Hasta 20% OFF.',
      title2: diseno?.carterasSlide3Title2 || 'Solo por hoy.',
      subtitle: diseno?.carterasSlide3Subtitle || 'Aprovecha descuentos exclusivos en estilos seleccionados de la colección.',
      button: diseno?.carterasSlide3Button || 'Ver ofertas',
      onlyImage: Boolean(diseno?.carterasSlide3OnlyImage),
      actionKey: 'carterasSlide3Action',
    },
  ];
  // Cada slide se completa con una imagen de respaldo para que el slider luzca
  // completo por defecto; el emprendedor reemplaza imagen/textos desde el editor.
  return raw.map((slide, i) => ({ ...slide, image: slide.image || HERO_SLIDE_FALLBACKS[i % HERO_SLIDE_FALLBACKS.length] }));
}

function HeroSlider({ slides, slug, primary, diseno }: { slides: HeroSlide[]; slug: string; primary: string; diseno: any }) {
  const navigateRouter = useNavigate();
  const [index, setIndex] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % count), 6000);
    return () => clearInterval(timer);
  }, [count]);

  const go = (dir: number) => setIndex((prev) => (prev + dir + count) % count);
  const goAction = (key: string) => {
    runStoreLinkAction(getStoreLinkAction(diseno, key, { defaultType: 'catalog' }), { slug, navigate: navigateRouter });
  };
  const goCatalog = () => {
    if (slug === 'preview') { window.dispatchEvent(new CustomEvent('preview-nav', { detail: 'catalogo' })); return; }
    navigateRouter(`/tienda/${slug}/catalogo`);
  };
  const slide = slides[index];

  return (
    <section
      className="relative isolate overflow-hidden"
      style={{ background: `linear-gradient(120% 120% at 74% 25%, ${LUX.nude} 0%, ${LUX.cream} 62%)` }}
      aria-roledescription="carousel"
    >
      <div className="mx-auto max-w-7xl px-6">
        {slide.onlyImage ? (
          // Modo banner: solo imagen, todo el banner clickeable al destino.
          <div className="py-6 md:py-8">
            <AnimatePresence mode="wait">
              <motion.button
                key={`only-${index}`}
                type="button"
                onClick={() => goAction(slide.actionKey)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: luxEase }}
                className="group relative block h-64 w-full cursor-pointer overflow-hidden rounded-3xl md:h-[520px]"
                aria-label={slide.eyebrow || 'Ver más'}
              >
                <img src={slide.image} alt={slide.eyebrow || 'Banner'} className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]" />
              </motion.button>
            </AnimatePresence>
          </div>
        ) : (
          <div className="grid items-center gap-8 py-12 md:grid-cols-2 md:gap-12 md:py-16">
            {/* Columna de texto — alineada al logo del header */}
            <div className="order-2 md:order-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`content-${index}`}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.6, ease: luxEase }}
                >
                  {slide.eyebrow && <Eyebrow color={primary}>{slide.eyebrow}</Eyebrow>}
                  <h1 className="mt-5 text-5xl leading-[1.01] tracking-tight md:text-7xl" style={{ fontFamily: LUX.serif, color: LUX.ink }}>
                    {slide.title}
                    {slide.title2 && <span className="mt-1 block italic" style={{ color: primary }}>{slide.title2}</span>}
                  </h1>
                  {slide.subtitle && <p className="mt-6 max-w-md text-base leading-relaxed text-neutral-600">{slide.subtitle}</p>}
                  {(slide.button || slide.button2) && (
                    <div className="mt-9 flex flex-wrap items-center gap-3">
                      {slide.button && (
                        <motion.button
                          type="button"
                          onClick={() => goAction(slide.actionKey)}
                          className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-lg"
                          style={{ backgroundColor: LUX.ink }}
                          whileHover={{ scale: 1.03, y: -2 }}
                          whileTap={luxTap}
                        >
                          {slide.button} <Icon icon="solar:arrow-right-linear" width={16} />
                        </motion.button>
                      )}
                      {slide.button2 && (
                        <button type="button" onClick={goCatalog} className="inline-flex items-center gap-2 rounded-full border px-7 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-800 transition-colors hover:border-neutral-900" style={{ borderColor: LUX.tan }}>
                          {slide.button2}
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Columna de imagen */}
            <div className="order-1 md:order-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`img-${index}`}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: luxEase }}
                  className="relative h-64 overflow-hidden rounded-3xl shadow-[0_40px_90px_-40px_rgba(26,22,19,0.5)] md:h-[540px]"
                >
                  <img src={slide.image} alt={slide.eyebrow || 'Colección'} className="h-full w-full object-cover" />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}

        {count > 1 && (
          <div className="flex items-center justify-center gap-4 pb-8 md:justify-between md:pb-6">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Anterior"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-neutral-800 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-white"
            >
              <Icon icon="solar:alt-arrow-left-linear" width={22} />
            </button>
            <div className="flex items-center gap-2.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Ir al slide ${i + 1}`}
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: i === index ? 32 : 12, backgroundColor: i === index ? primary : 'rgba(26,22,19,0.18)' }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Siguiente"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-neutral-800 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-white"
            >
              <Icon icon="solar:alt-arrow-right-linear" width={22} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default function CarterasHomePage({
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
  const featured = productos.slice(0, 8);

  const categoryCards = (allCategories || [])
    .map((cat: any) => (typeof cat === 'string' ? { nombre: cat } : cat))
    .filter((cat: any) => cat?.nombre)
    .slice(0, 5);

  return (
    <motion.div initial="hidden" animate="show" variants={luxPage} className="min-h-screen" style={{ backgroundColor: LUX.cream, fontFamily: font }}>
      <LuxHeader
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
        {/* ── Hero (banner slider, todo editable) ──────────────────────────── */}
        <HeroSlider slides={buildHeroSlides(diseno)} slug={slug} primary={primary} diseno={diseno} />

        {/* ── Tira de confianza ────────────────────────────────────────────── */}
        <section className="border-y bg-white" style={{ borderColor: LUX.line }}>
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-8 md:grid-cols-4">
            {TRUST.map((t) => (
              <div key={t.title} className="flex items-center gap-3">
                <Icon icon={t.icon} width={30} style={{ color: LUX.ink }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: LUX.ink }}>{t.title}</p>
                  <p className="text-xs text-neutral-500">{t.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Comprar por categoría ────────────────────────────────────────── */}
        {categoryCards.length > 0 && (
          <motion.section variants={luxSection} initial="hidden" whileInView="show" viewport={luxViewport} className="mx-auto max-w-7xl px-6 py-16 md:py-20">
            <div className="mb-10 text-center">
              <h2 className="text-2xl uppercase tracking-[0.14em] md:text-3xl" style={{ fontFamily: LUX.serif, color: LUX.ink }}>{diseno?.carterasCategoriesTitle || 'Comprar por categoría'}</h2>
            </div>
            <motion.div variants={luxStagger} className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {categoryCards.map((cat: any, i: number) => (
                <motion.a
                  key={cat.nombre}
                  variants={luxCard}
                  whileHover={{ y: -6 }}
                  href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(cat.nombre)}`}
                  className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl shadow-sm"
                >
                  <img src={cat.imagenUrl || cat.imagen || CATEGORY_FALLBACKS[i % CATEGORY_FALLBACKS.length]} alt={cat.nombre} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.08]" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(26,22,19,0) 40%, rgba(26,22,19,0.72) 100%)' }} />
                  <div className="relative z-10 p-4 text-center text-white">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.12em]">{cat.nombre}</h3>
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
                      Comprar <Icon icon="solar:arrow-right-linear" width={12} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </motion.a>
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* ── Best sellers ─────────────────────────────────────────────────── */}
        <motion.section variants={luxSection} initial="hidden" whileInView="show" viewport={luxViewport} className="mx-auto max-w-7xl px-6 pb-16 md:pb-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-2xl uppercase tracking-[0.14em] md:text-3xl" style={{ fontFamily: LUX.serif, color: LUX.ink }}>{diseno?.carterasBestsellersTitle || 'Más vendidos'}</h2>
            <a href={`/tienda/${slug}/catalogo`} className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] hover:opacity-70" style={{ color: LUX.ink }}>
              Ver todo <Icon icon="solar:arrow-right-linear" width={15} />
            </a>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-black/[0.04]" />)}
            </div>
          ) : featured.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-20 text-center text-neutral-400" style={{ borderColor: LUX.line }}>Aún no hay productos publicados.</div>
          ) : (
            <motion.div variants={luxStagger} className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
              {featured.map((producto) => (
                <LuxProductCard key={producto.id} producto={producto} slug={slug} cp={primary} onAddToCart={agregarAlCarrito} onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)} />
              ))}
            </motion.div>
          )}
        </motion.section>

        {/* ── Banners promocionales split ──────────────────────────────────── */}
        <motion.section variants={luxSection} initial="hidden" whileInView="show" viewport={luxViewport} className="mx-auto max-w-7xl px-6 pb-16 md:pb-24">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Promo oscura */}
            <div className="relative flex min-h-[280px] items-center overflow-hidden rounded-3xl" style={{ backgroundColor: LUX.charcoal }}>
              <img src={diseno?.carterasPromoImage || PROMO_FALLBACK} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: '78% center' }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(26,22,19,0.92) 0%, rgba(26,22,19,0.6) 34%, rgba(26,22,19,0.18) 58%, rgba(26,22,19,0) 80%)' }} />
              <div className="relative z-10 max-w-xs p-8 text-white" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.4)' }}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: LUX.goldSoft }}>{diseno?.carterasPromoLabel || 'Oferta por tiempo limitado'}</p>
                <h3 className="mt-3 text-3xl leading-tight" style={{ fontFamily: LUX.serif }}>{diseno?.carterasPromoTitle || 'Minimal look. Máximo impacto.'}</h3>
                <p className="mt-3 text-sm text-white/70">{diseno?.carterasPromoSubtitle || 'Hasta 20% de descuento en estilos seleccionados.'}</p>
                <a href={`/tienda/${slug}/catalogo`} className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-900 shadow-lg transition-transform hover:-translate-y-0.5" style={{ textShadow: 'none' }}>
                  {diseno?.carterasPromoButton || 'Ver la oferta'}
                </a>
              </div>
            </div>
            {/* Club / newsletter destacado */}
            <div className="relative flex min-h-[280px] items-center overflow-hidden rounded-3xl" style={{ background: `linear-gradient(135deg, ${LUX.nude}, ${LUX.sand})` }}>
              <div className="relative z-10 p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: primary }}>{diseno?.carterasClubLabel || 'Únete a Luxora Club'}</p>
                <h3 className="mt-3 text-3xl leading-tight" style={{ fontFamily: LUX.serif, color: LUX.ink }}>{diseno?.carterasClubTitle || 'Más beneficios. Más recompensas.'}</h3>
                <p className="mt-3 max-w-sm text-sm text-neutral-600">{diseno?.carterasClubSubtitle || 'Regístrate hoy y disfruta de perks exclusivos, acceso anticipado y más.'}</p>
                <a href={`/tienda/${slug}/catalogo`} className="mt-6 inline-flex rounded-full px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-transform hover:-translate-y-0.5" style={{ backgroundColor: LUX.ink }}>
                  {diseno?.carterasClubButton || 'Unirme ahora'}
                </a>
              </div>
              <Icon icon="solar:bag-heart-bold" className="absolute -bottom-6 -right-4 text-[10rem] opacity-10" style={{ color: LUX.ink }} />
            </div>
          </div>
        </motion.section>

        {/* ── Newsletter ───────────────────────────────────────────────────── */}
        <section className="border-t bg-white" style={{ borderColor: LUX.line }}>
          <motion.div variants={luxSection} initial="hidden" whileInView="show" viewport={luxViewport} className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-14 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <h2 className="text-2xl uppercase tracking-[0.12em]" style={{ fontFamily: LUX.serif, color: LUX.ink }}>{diseno?.carterasNewsletterTitle || 'Mantente al día'}</h2>
              <p className="mt-2 text-sm text-neutral-500">{diseno?.carterasNewsletterSubtitle || 'Novedades, lanzamientos y ofertas exclusivas.'}</p>
            </div>
            <form onSubmit={(e) => e.preventDefault()} className="flex w-full max-w-md items-center gap-2 rounded-full border p-1.5" style={{ borderColor: LUX.tan }}>
              <input type="email" placeholder="Tu correo electrónico" className="h-11 flex-1 border-0 bg-transparent px-4 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:ring-0" />
              <button type="submit" className="h-11 shrink-0 rounded-full px-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-white" style={{ backgroundColor: LUX.ink }}>
                {diseno?.carterasNewsletterButton || 'Suscribirme'}
              </button>
            </form>
          </motion.div>
        </section>
      </main>

      <LuxFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <LuxWhatsAppFab tienda={tienda} />

      <LuxCartModal
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
