import { type ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { HD, HdCartModal, HdFooter, HdHeader, HdProductCard, HdWhatsAppFab, hdFont, hdPrimary, storeName } from './HoodieParts';
import { hdCard, hdEase, hdPage, hdSection, hdStagger, hdViewport } from './motion';

const navigate = (to: string) => { window.location.href = to; };

const HERO_SLIDE_FALLBACKS = [
  'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1800&q=80',
];
const CATEGORY_FALLBACKS = [
  'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=700&q=80',
];

const SOCIALS = [
  { label: 'Instagram', icon: 'mdi:instagram' },
  { label: 'Telegram', icon: 'mdi:telegram' },
  { label: 'Facebook', icon: 'mdi:facebook' },
  { label: 'Twitter', icon: 'mdi:twitter' },
];

interface HeroSlide {
  image: string;
  eyebrow: string;
  title: string;
  title2: string;
  subtitle: string;
  button: string;
  onlyImage: boolean;
  actionKey: string;
}

function buildHeroSlides(diseno: any, brand: string): HeroSlide[] {
  const raw: HeroSlide[] = [
    {
      image: diseno?.hoodieHeroImage || '',
      eyebrow: diseno?.hoodieHeroEyebrow || 'Los mejores hoodies solo aquí',
      title: diseno?.hoodieHeroTitle || brand.toUpperCase(),
      title2: diseno?.hoodieHeroTitle2 || '',
      subtitle: diseno?.hoodieHeroSubtitle || 'Descubrir ahora',
      button: diseno?.hoodieHeroButton || 'Swipe',
      onlyImage: Boolean(diseno?.hoodieHeroOnlyImage),
      actionKey: 'hoodieHeroAction',
    },
    {
      image: diseno?.hoodieSlide2Image || '',
      eyebrow: diseno?.hoodieSlide2Eyebrow || 'Nueva temporada',
      title: diseno?.hoodieSlide2Title || 'URBAN',
      title2: diseno?.hoodieSlide2Title2 || 'ESSENTIALS',
      subtitle: diseno?.hoodieSlide2Subtitle || 'Ver colección',
      button: diseno?.hoodieSlide2Button || 'Swipe',
      onlyImage: Boolean(diseno?.hoodieSlide2OnlyImage),
      actionKey: 'hoodieSlide2Action',
    },
    {
      image: diseno?.hoodieSlide3Image || '',
      eyebrow: diseno?.hoodieSlide3Eyebrow || 'Oferta limitada',
      title: diseno?.hoodieSlide3Title || 'HASTA 30% OFF',
      title2: diseno?.hoodieSlide3Title2 || '',
      subtitle: diseno?.hoodieSlide3Subtitle || 'Ver ofertas',
      button: diseno?.hoodieSlide3Button || 'Swipe',
      onlyImage: Boolean(diseno?.hoodieSlide3OnlyImage),
      actionKey: 'hoodieSlide3Action',
    },
  ];
  return raw.map((slide, i) => ({ ...slide, image: slide.image || HERO_SLIDE_FALLBACKS[i % HERO_SLIDE_FALLBACKS.length] }));
}

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
      {slide.onlyImage ? (
        <AnimatePresence mode="wait">
          <motion.button
            key={`only-${index}`}
            type="button"
            onClick={() => goAction(slide.actionKey)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: hdEase }}
            className="group relative block h-[300px] w-full cursor-pointer overflow-hidden rounded-[26px] sm:h-[440px] md:h-[600px]"
            aria-label={slide.eyebrow || 'Ver más'}
          >
            <img src={slide.image} alt={slide.eyebrow || 'Banner'} className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]" />
          </motion.button>
        </AnimatePresence>
      ) : (
        <>
          {/* Eyebrow + logotipo gigante */}
          <div className="mb-4">
            <AnimatePresence mode="wait">
              <motion.div key={`head-${index}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.5, ease: hdEase }}>
                {slide.eyebrow && (
                  <p className="text-right text-[11px] font-bold uppercase tracking-[0.24em] md:text-sm" style={{ color: HD.ink }}>{slide.eyebrow}</p>
                )}
                <h1 className="mt-1 flex flex-wrap items-baseline justify-center gap-x-[0.14em] text-center leading-[0.82] tracking-[-0.05em]" style={{ fontFamily: HD.display, fontWeight: 900, color: HD.ink }}>
                  <span className="text-[clamp(3.4rem,17vw,12rem)]">{slide.title}</span>
                  {slide.title2 && <span className="text-[clamp(3.4rem,17vw,12rem)]" style={{ color: primary === HD.ink ? HD.taupe : primary }}>{slide.title2}</span>}
                </h1>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Imagen full-width con tarjeta "Discover" */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={`img-${index}`}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: hdEase }}
                className="relative h-[320px] overflow-hidden rounded-[26px] sm:h-[460px] md:h-[600px]"
                style={{ backgroundColor: HD.sand }}
              >
                <img src={slide.image} alt={slide.eyebrow || 'Colección'} className="h-full w-full object-cover" />

                {/* Tarjeta Swipe / Discover */}
                <button
                  type="button"
                  onClick={() => goAction(slide.actionKey)}
                  className="group absolute bottom-5 left-5 w-[220px] max-w-[70%] rounded-2xl bg-white p-5 text-left shadow-lg transition-transform hover:-translate-y-0.5 md:bottom-8 md:left-8"
                >
                  <span className="flex items-center justify-between gap-3 text-[13px] font-bold uppercase tracking-[0.14em]" style={{ color: HD.ink }}>
                    {slide.button || 'Swipe'}
                    <Icon icon="solar:arrow-right-linear" width={26} className="transition-transform group-hover:translate-x-1.5" />
                  </span>
                  <span className="mt-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400">{slide.subtitle || 'Descubrir ahora'}</span>
                </button>
              </motion.div>
            </AnimatePresence>

            {count > 1 && (
              <div className="pointer-events-none absolute inset-x-5 bottom-5 flex items-center justify-end gap-3 md:inset-x-8 md:bottom-8">
                <button type="button" onClick={() => go(-1)} aria-label="Anterior" className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-white">
                  <Icon icon="solar:alt-arrow-left-linear" width={22} />
                </button>
                <button type="button" onClick={() => go(1)} aria-label="Siguiente" className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-white">
                  <Icon icon="solar:alt-arrow-right-linear" width={22} />
                </button>
              </div>
            )}
          </div>

          {count > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              {slides.map((_, i) => (
                <button key={i} type="button" onClick={() => setIndex(i)} aria-label={`Ir al slide ${i + 1}`} className="h-1.5 rounded-full transition-all" style={{ width: i === index ? 30 : 10, backgroundColor: i === index ? HD.ink : 'rgba(21,18,14,0.2)' }} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

/* ─────────────────────────── Encabezado de sección ───────────────────────── */

function SectionHead({ title, slug }: { title: ReactNode; slug: string }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <h2 className="text-2xl uppercase tracking-[-0.01em] md:text-[26px]" style={{ fontFamily: HD.display, fontWeight: 800, color: HD.ink }}>{title}</h2>
      <a href={`/tienda/${slug}/catalogo`} className="group inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: HD.ink }}>
        Ver todo <Icon icon="solar:arrow-right-linear" width={16} className="transition-transform group-hover:translate-x-1" />
      </a>
    </div>
  );
}

export default function HoodieHomePage({
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
  const primary = hdPrimary(cp);
  const font = hdFont(diseno);
  const brand = storeName(tienda, diseno);
  const featured = productos.slice(0, 8);

  const categoryCards = (allCategories || [])
    .map((cat: any) => (typeof cat === 'string' ? { nombre: cat } : cat))
    .filter((cat: any) => cat?.nombre)
    .slice(0, 4);

  const marqueeText = diseno?.hoodieMarqueeText || `Los mejores hoodies · ${brand} 2026`;

  return (
    <motion.div initial="hidden" animate="show" variants={hdPage} className="min-h-screen" style={{ backgroundColor: HD.cream, fontFamily: font }}>
      <HdHeader
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
        {/* ── Hero full-width (logotipo gigante + slider) ──────────────────── */}
        <HeroSlider slides={buildHeroSlides(diseno, brand)} slug={slug} primary={primary} diseno={diseno} />

        {/* ── Redes ────────────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-[1240px] px-4 md:px-6">
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 border-b pb-8" style={{ borderColor: HD.line }}>
            {SOCIALS.map((s) => (
              <a key={s.label} href="#" className="group flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-600 transition-colors hover:text-neutral-950">
                <Icon icon={s.icon} width={16} /> {s.label}
              </a>
            ))}
          </div>
        </div>

        {/* ── Shop by collection ───────────────────────────────────────────── */}
        {categoryCards.length > 0 && (
          <motion.section variants={hdSection} initial="hidden" whileInView="show" viewport={hdViewport} className="mx-auto max-w-[1240px] px-4 py-12 md:px-6 md:py-14">
            <SectionHead title={diseno?.hoodieCategoriesTitle || 'Compra por colección'} slug={slug} />
            <motion.div variants={hdStagger} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {categoryCards.map((cat: any, i: number) => (
                <motion.a
                  key={cat.nombre}
                  variants={hdCard}
                  whileHover={{ y: -6 }}
                  href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(cat.nombre)}`}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-[18px]"
                  style={{ backgroundColor: HD.sand }}
                >
                  <img src={cat.imagenUrl || cat.imagen || CATEGORY_FALLBACKS[i % CATEGORY_FALLBACKS.length]} alt={cat.nombre} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]" />
                  <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-xl bg-white px-4 py-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[13px] font-bold uppercase tracking-[0.02em]" style={{ color: HD.ink }}>{cat.nombre}</h3>
                      <span className="mt-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">Shop now</span>
                    </div>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors group-hover:bg-neutral-900 group-hover:text-white" style={{ backgroundColor: HD.sand, color: HD.ink }}>
                      <Icon icon="solar:arrow-right-linear" width={15} />
                    </span>
                  </div>
                </motion.a>
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* ── Best sellers ─────────────────────────────────────────────────── */}
        <motion.section variants={hdSection} initial="hidden" whileInView="show" viewport={hdViewport} className="mx-auto max-w-[1240px] px-4 pb-12 md:px-6 md:pb-16">
          <SectionHead title={diseno?.hoodieBestsellersTitle || 'Más vendidos'} slug={slug} />
          {loading ? (
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-[22px] bg-black/[0.05]" />)}
            </div>
          ) : featured.length === 0 ? (
            <div className="rounded-[22px] border border-dashed py-20 text-center text-neutral-400" style={{ borderColor: HD.line }}>Aún no hay prendas publicadas.</div>
          ) : (
            <motion.div variants={hdStagger} className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {featured.map((producto) => (
                <HdProductCard key={producto.id} producto={producto} slug={slug} cp={primary} onAddToCart={agregarAlCarrito} onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)} />
              ))}
            </motion.div>
          )}
        </motion.section>

        {/* ── Marquee strip ────────────────────────────────────────────────── */}
        <div className="overflow-hidden border-y py-4" style={{ backgroundColor: HD.ink, borderColor: HD.ink }}>
          <motion.div
            className="flex whitespace-nowrap"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 22, ease: 'linear', repeat: Infinity }}
          >
            {Array.from({ length: 2 }).map((_, block) => (
              <div key={block} className="flex shrink-0 items-center">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} className="flex items-center gap-4 px-6 text-lg font-bold uppercase tracking-[0.12em] text-white/85" style={{ fontFamily: HD.display }}>
                    {marqueeText} <Icon icon="solar:hanger-2-bold" width={18} className="text-white/40" />
                  </span>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </main>

      <HdFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <HdWhatsAppFab tienda={tienda} />

      <HdCartModal
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
