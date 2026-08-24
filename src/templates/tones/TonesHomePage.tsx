import { type ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { TN, TnCartModal, TnFooter, TnHeader, TnProductCard, TnWhatsAppFab, tnFont, tnPrimary } from './TonesParts';
import { tnCard, tnEase, tnPage, tnSection, tnStagger, tnTap, tnViewport } from './motion';

const navigate = (to: string) => { window.location.href = to; };

const HERO_SLIDE_FALLBACKS = [
  'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=1600&q=80',
];
const SPLIT_FALLBACKS = [
  'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1596870230751-ebdfce98ec1e?auto=format&fit=crop&w=1000&q=80',
];
const FEATURE_FALLBACK = 'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?auto=format&fit=crop&w=1000&q=80';
const BANNER_FALLBACK = 'https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=1600&q=80';

const CATEGORY_ICONS = ['solar:t-shirt-linear', 'solar:hanger-2-linear', 'solar:sock-linear', 'solar:cap-linear', 'solar:bag-3-linear', 'solar:star-linear'];

interface HeroSlide {
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  button: string;
  onlyImage: boolean;
  actionKey: string;
}

function buildHeroSlides(diseno: any): HeroSlide[] {
  const raw: HeroSlide[] = [
    {
      image: diseno?.tonesHeroImage || '',
      eyebrow: diseno?.tonesHeroEyebrow || 'Nueva colección',
      title: diseno?.tonesHeroTitle || 'básicos para cada día',
      subtitle: diseno?.tonesHeroSubtitle || 'Prendas suaves y cómodas, pensadas para acompañar cada aventura.',
      button: diseno?.tonesHeroButton || 'Comprar ahora',
      onlyImage: Boolean(diseno?.tonesHeroOnlyImage),
      actionKey: 'tonesHeroAction',
    },
    {
      image: diseno?.tonesSlide2Image || '',
      eyebrow: diseno?.tonesSlide2Eyebrow || 'Temporada cálida',
      title: diseno?.tonesSlide2Title || 'suaves como un abrazo',
      subtitle: diseno?.tonesSlide2Subtitle || 'Algodón premium en tonos neutros para combinar con todo.',
      button: diseno?.tonesSlide2Button || 'Ver colección',
      onlyImage: Boolean(diseno?.tonesSlide2OnlyImage),
      actionKey: 'tonesSlide2Action',
    },
    {
      image: diseno?.tonesSlide3Image || '',
      eyebrow: diseno?.tonesSlide3Eyebrow || 'Solo por hoy',
      title: diseno?.tonesSlide3Title || 'hasta 30% de descuento',
      subtitle: diseno?.tonesSlide3Subtitle || 'Aprovecha precios especiales en prendas seleccionadas.',
      button: diseno?.tonesSlide3Button || 'Ver ofertas',
      onlyImage: Boolean(diseno?.tonesSlide3OnlyImage),
      actionKey: 'tonesSlide3Action',
    },
  ];
  return raw.map((slide, i) => ({ ...slide, image: slide.image || HERO_SLIDE_FALLBACKS[i % HERO_SLIDE_FALLBACKS.length] }));
}

/* ─────────────────────────── Encabezado de sección ───────────────────────── */

function SectionHead({ label, title, slug, action = 'Ver todo' }: { label?: string; title: ReactNode; slug: string; action?: string }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        {label && <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: TN.taupe }}>{label}</p>}
        <h2 className="text-2xl lowercase tracking-[-0.01em] md:text-[30px]" style={{ fontFamily: TN.brand, fontWeight: 700, color: TN.ink }}>{title}</h2>
      </div>
      <a href={`/tienda/${slug}/catalogo`} className="group inline-flex shrink-0 items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: TN.cocoa }}>
        {action} <Icon icon="solar:arrow-right-linear" width={16} className="transition-transform group-hover:translate-x-1" />
      </a>
    </div>
  );
}

/* ─────────────────────────────────── Hero ────────────────────────────────── */

function HeroSlider({ slides, slug, primary, diseno }: { slides: HeroSlide[]; slug: string; primary: string; diseno: any }) {
  const navigateRouter = useNavigate();
  const [index, setIndex] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % count), 6500);
    return () => clearInterval(timer);
  }, [count]);

  const go = (dir: number) => setIndex((prev) => (prev + dir + count) % count);
  const goAction = (key: string) => {
    runStoreLinkAction(getStoreLinkAction(diseno, key, { defaultType: 'catalog' }), { slug, navigate: navigateRouter });
  };
  const slide = slides[index];

  return (
    <section className="mx-auto max-w-[1240px] px-4 pt-6 md:px-6 md:pt-8">
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={`hero-${index}`}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: tnEase }}
            className="relative h-[440px] overflow-hidden rounded-[28px] sm:h-[520px] md:h-[600px]"
            style={{ backgroundColor: TN.sand }}
          >
            <img src={slide.image} alt={slide.eyebrow || 'Colección'} className="h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(42,36,31,0) 55%, rgba(42,36,31,0.28) 100%)' }} />

            {!slide.onlyImage && (
              <div className="absolute bottom-5 left-5 w-[300px] max-w-[80%] rounded-[22px] bg-white/85 p-6 shadow-lg backdrop-blur-md md:bottom-8 md:left-8">
                {slide.eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: TN.taupe }}>{slide.eyebrow}</p>}
                <h1 className="mt-2 text-[28px] lowercase leading-[1.05] tracking-[-0.01em] md:text-[34px]" style={{ fontFamily: TN.brand, fontWeight: 700, color: TN.ink }}>{slide.title}</h1>
                {slide.subtitle && <p className="mt-2 text-sm leading-relaxed text-neutral-600">{slide.subtitle}</p>}
                {slide.button && (
                  <motion.button
                    type="button"
                    onClick={() => goAction(slide.actionKey)}
                    className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-md"
                    style={{ backgroundColor: TN.cocoa }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={tnTap}
                  >
                    {slide.button} <Icon icon="solar:arrow-right-linear" width={15} />
                  </motion.button>
                )}
              </div>
            )}
            {slide.onlyImage && (
              <button type="button" onClick={() => goAction(slide.actionKey)} className="absolute inset-0" aria-label={slide.eyebrow || 'Ver más'} />
            )}
          </motion.div>
        </AnimatePresence>

        {count > 1 && (
          <div className="absolute inset-x-5 bottom-5 flex items-center justify-end gap-3 md:inset-x-8 md:bottom-8">
            <button type="button" onClick={() => go(-1)} aria-label="Anterior" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-white">
              <Icon icon="solar:alt-arrow-left-linear" width={22} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Siguiente" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-white">
              <Icon icon="solar:alt-arrow-right-linear" width={22} />
            </button>
          </div>
        )}
      </div>
      {count > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button key={i} type="button" onClick={() => setIndex(i)} aria-label={`Ir al slide ${i + 1}`} className="h-1.5 rounded-full transition-all" style={{ width: i === index ? 30 : 10, backgroundColor: i === index ? primary : 'rgba(42,36,31,0.2)' }} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────── Tarjeta split (shop) ────────────────────────── */

function SplitCard({ image, eyebrow, title, button, actionKey, slug, diseno }: { image: string; eyebrow: string; title: string; button: string; actionKey: string; slug: string; diseno: any }) {
  const navigateRouter = useNavigate();
  const go = () => runStoreLinkAction(getStoreLinkAction(diseno, actionKey, { defaultType: 'catalog' }), { slug, navigate: navigateRouter });
  return (
    <motion.button
      type="button"
      variants={tnCard}
      whileHover={{ y: -5 }}
      onClick={go}
      className="group relative flex h-[300px] w-full flex-col justify-end overflow-hidden rounded-[24px] text-left md:h-[360px]"
      style={{ backgroundColor: TN.sand }}
    >
      <img src={image} alt={title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(42,36,31,0) 40%, rgba(42,36,31,0.6) 100%)' }} />
      <div className="relative z-10 p-6 md:p-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">{eyebrow}</p>
        <h3 className="mt-1.5 text-2xl lowercase leading-tight text-white md:text-[26px]" style={{ fontFamily: TN.brand, fontWeight: 700 }}>{title}</h3>
        <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-900 transition-transform group-hover:-translate-y-0.5">
          {button} <Icon icon="solar:arrow-right-linear" width={14} />
        </span>
      </div>
    </motion.button>
  );
}

export default function TonesHomePage({
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
  const primary = tnPrimary(cp);
  const font = tnFont(diseno);
  const favorites = productos.slice(0, 8);
  const featurePair = productos.slice(0, 2);

  const categoryCards = (allCategories || [])
    .map((cat: any) => (typeof cat === 'string' ? { nombre: cat } : cat))
    .filter((cat: any) => cat?.nombre)
    .slice(0, 6);

  return (
    <motion.div initial="hidden" animate="show" variants={tnPage} className="min-h-screen" style={{ backgroundColor: TN.cream, fontFamily: font }}>
      <TnHeader
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
        <HeroSlider slides={buildHeroSlides(diseno)} slug={slug} primary={primary} diseno={diseno} />

        {/* ── Nuestros favoritos ───────────────────────────────────────────── */}
        <motion.section variants={tnSection} initial="hidden" whileInView="show" viewport={tnViewport} className="mx-auto max-w-[1240px] px-4 py-12 md:px-6 md:py-14">
          <SectionHead label={diseno?.tonesFavoritesLabel || 'Selección'} title={diseno?.tonesFavoritesTitle || 'nuestros favoritos'} slug={slug} />
          {loading ? (
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-[20px] bg-black/[0.05]" />)}
            </div>
          ) : favorites.length === 0 ? (
            <div className="rounded-[22px] border border-dashed py-20 text-center text-neutral-400" style={{ borderColor: TN.line }}>Aún no hay prendas publicadas.</div>
          ) : (
            <motion.div variants={tnStagger} className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {favorites.slice(0, 4).map((producto) => (
                <TnProductCard key={producto.id} producto={producto} slug={slug} cp={primary} onAddToCart={agregarAlCarrito} onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)} />
              ))}
            </motion.div>
          )}
        </motion.section>

        {/* ── Dos tarjetas split ───────────────────────────────────────────── */}
        <motion.section variants={tnStagger} initial="hidden" whileInView="show" viewport={tnViewport} className="mx-auto max-w-[1240px] px-4 pb-12 md:px-6 md:pb-14">
          <div className="grid gap-5 md:grid-cols-2">
            <SplitCard
              image={diseno?.tonesSplit1Image || SPLIT_FALLBACKS[0]}
              eyebrow={diseno?.tonesSplit1Eyebrow || 'Para ellas'}
              title={diseno?.tonesSplit1Title || 'estilos que sacan sonrisas'}
              button={diseno?.tonesSplit1Button || 'Ver niñas'}
              actionKey="tonesSplit1Action"
              slug={slug}
              diseno={diseno}
            />
            <SplitCard
              image={diseno?.tonesSplit2Image || SPLIT_FALLBACKS[1]}
              eyebrow={diseno?.tonesSplit2Eyebrow || 'Para ellos'}
              title={diseno?.tonesSplit2Title || 'listos para cada aventura'}
              button={diseno?.tonesSplit2Button || 'Ver niños'}
              actionKey="tonesSplit2Action"
              slug={slug}
              diseno={diseno}
            />
          </div>
        </motion.section>

        {/* ── Por categoría ────────────────────────────────────────────────── */}
        {categoryCards.length > 0 && (
          <motion.section variants={tnSection} initial="hidden" whileInView="show" viewport={tnViewport} className="mx-auto max-w-[1240px] px-4 pb-12 md:px-6 md:pb-14">
            <SectionHead label={diseno?.tonesCategoriesLabel || 'Explora'} title={diseno?.tonesCategoriesTitle || 'por categoría'} slug={slug} />
            <motion.div variants={tnStagger} className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {categoryCards.map((cat: any, i: number) => (
                <motion.a
                  key={cat.nombre}
                  variants={tnCard}
                  whileHover={{ y: -5 }}
                  href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(cat.nombre)}`}
                  className="group flex flex-col items-center gap-3 rounded-[18px] border p-4 text-center transition-colors hover:border-transparent"
                  style={{ backgroundColor: TN.panel, borderColor: TN.line }}
                >
                  <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: TN.sand }}>
                    {cat.imagenUrl || cat.imagen ? (
                      <img src={cat.imagenUrl || cat.imagen} alt={cat.nombre} className="h-full w-full object-cover" />
                    ) : (
                      <Icon icon={CATEGORY_ICONS[i % CATEGORY_ICONS.length]} width={28} style={{ color: TN.cocoa }} />
                    )}
                  </span>
                  <span className="line-clamp-1 text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: TN.ink }}>{cat.nombre}</span>
                </motion.a>
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* ── Feature + productos ──────────────────────────────────────────── */}
        <motion.section variants={tnStagger} initial="hidden" whileInView="show" viewport={tnViewport} className="mx-auto max-w-[1240px] px-4 pb-12 md:px-6 md:pb-14">
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <motion.a
              variants={tnCard}
              href={`/tienda/${slug}/catalogo`}
              className="group relative flex h-[340px] flex-col justify-end overflow-hidden rounded-[24px] lg:h-auto lg:min-h-[420px]"
              style={{ backgroundColor: TN.sand }}
            >
              <img src={diseno?.tonesFeatureImage || FEATURE_FALLBACK} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.05]" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(42,36,31,0) 45%, rgba(42,36,31,0.62) 100%)' }} />
              <div className="relative z-10 p-6 md:p-7">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">{diseno?.tonesFeatureEyebrow || 'Lo último'}</p>
                <h3 className="mt-1.5 text-2xl lowercase leading-tight text-white md:text-3xl" style={{ fontFamily: TN.brand, fontWeight: 700 }}>{diseno?.tonesFeatureTitle || 'lo nuevo para los más pequeños'}</h3>
                <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-900 transition-transform group-hover:-translate-y-0.5">
                  {diseno?.tonesFeatureButton || 'Comprar ahora'} <Icon icon="solar:arrow-right-linear" width={14} />
                </span>
              </div>
            </motion.a>

            <div className="grid grid-cols-2 gap-5">
              {featurePair.length > 0 ? featurePair.map((producto) => (
                <div key={producto.id} className="rounded-[22px] border p-4" style={{ backgroundColor: TN.panel, borderColor: TN.line }}>
                  <TnProductCard producto={producto} slug={slug} cp={primary} onAddToCart={agregarAlCarrito} onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)} />
                </div>
              )) : (
                <div className="col-span-2 flex items-center justify-center rounded-[22px] border border-dashed p-10 text-center text-sm text-neutral-400" style={{ borderColor: TN.line }}>
                  Publica prendas para destacarlas aquí.
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* ── Banner ancho ─────────────────────────────────────────────────── */}
        <motion.section variants={tnSection} initial="hidden" whileInView="show" viewport={tnViewport} className="mx-auto max-w-[1240px] px-4 pb-14 md:px-6 md:pb-16">
          <a
            href={`/tienda/${slug}/catalogo`}
            className="group relative flex h-[280px] items-end overflow-hidden rounded-[26px] md:h-[360px]"
            style={{ backgroundColor: TN.nude }}
          >
            <img src={diseno?.tonesBannerImage || BANNER_FALLBACK} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1000ms] group-hover:scale-[1.04]" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(42,36,31,0.6) 20%, rgba(42,36,31,0.05) 75%)' }} />
            <div className="relative z-10 p-7 md:p-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">{diseno?.tonesBannerEyebrow || 'Esenciales'}</p>
              <h3 className="mt-2 max-w-md text-3xl lowercase leading-tight text-white md:text-4xl" style={{ fontFamily: TN.brand, fontWeight: 700 }}>{diseno?.tonesBannerTitle || 'básicos para su día a día'}</h3>
              <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-900 transition-transform group-hover:-translate-y-0.5">
                {diseno?.tonesBannerButton || 'Comprar ahora'} <Icon icon="solar:arrow-right-linear" width={14} />
              </span>
            </div>
          </a>
        </motion.section>
      </main>

      <TnFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <TnWhatsAppFab tienda={tienda} />

      <TnCartModal
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
