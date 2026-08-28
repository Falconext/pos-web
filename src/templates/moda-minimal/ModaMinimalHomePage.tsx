import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { MIN, MinCartModal, MinFooter, MinHeader, MinProductCard, MinWhatsAppFab, minFont, minPrimary } from './ModaMinimalParts';
import { minCard, minEase, minPage, minSection, minStagger, minViewport } from './motion';

const navigate = (to: string) => { window.location.href = to; };

const HERO_FALLBACKS = [
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1900&q=80',
  'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=1900&q=80',
  'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1900&q=80',
];
const TILE_FALLBACKS = [
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80',
];
const EDITORIAL_FALLBACK = 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1600&q=80';

function ShopLink({ children, onClick, dark }: { children: React.ReactNode; onClick: () => void; dark?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-b pb-0.5 text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors"
      style={{ color: dark ? MIN.ink : '#fff', borderColor: dark ? MIN.ink : '#fff' }}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────── Hero slider ─────────────────────────────── */

interface HeroSlide {
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  button: string;
  button2?: string;
  onlyImage: boolean;
  actionKey: string;
}

function buildHeroSlides(diseno: any): HeroSlide[] {
  const raw: HeroSlide[] = [
    {
      image: diseno?.modaMinimalHeroImage || '',
      eyebrow: diseno?.modaMinimalHeroEyebrow || 'Nueva temporada',
      title: diseno?.modaMinimalHeroTitle || 'Lo esencial, mejor hecho.',
      subtitle: diseno?.modaMinimalHeroSubtitle || 'Prendas y calzado atemporal, en materiales nobles y a un precio justo.',
      button: diseno?.modaMinimalHeroButton || 'Comprar ropa',
      button2: diseno?.modaMinimalHeroButton2 || 'Comprar calzado',
      onlyImage: Boolean(diseno?.modaMinimalHeroOnlyImage),
      actionKey: 'modaMinimalHeroAction',
    },
    {
      image: diseno?.modaMinimalSlide2Image || '',
      eyebrow: diseno?.modaMinimalSlide2Eyebrow || 'Colección',
      title: diseno?.modaMinimalSlide2Title || 'Básicos que duran años.',
      subtitle: diseno?.modaMinimalSlide2Subtitle || 'Cortes limpios y telas premium pensadas para el uso diario.',
      button: diseno?.modaMinimalSlide2Button || 'Ver colección',
      button2: diseno?.modaMinimalSlide2Button2 || '',
      onlyImage: Boolean(diseno?.modaMinimalSlide2OnlyImage),
      actionKey: 'modaMinimalSlide2Action',
    },
    {
      image: diseno?.modaMinimalSlide3Image || '',
      eyebrow: diseno?.modaMinimalSlide3Eyebrow || 'Rebajas',
      title: diseno?.modaMinimalSlide3Title || 'Hasta 40% en seleccionados.',
      subtitle: diseno?.modaMinimalSlide3Subtitle || 'Aprovecha precios especiales por tiempo limitado.',
      button: diseno?.modaMinimalSlide3Button || 'Ver ofertas',
      button2: diseno?.modaMinimalSlide3Button2 || '',
      onlyImage: Boolean(diseno?.modaMinimalSlide3OnlyImage),
      actionKey: 'modaMinimalSlide3Action',
    },
  ];
  return raw.map((slide, i) => ({ ...slide, image: slide.image || HERO_FALLBACKS[i % HERO_FALLBACKS.length] }));
}

function HeroSlider({ slides, slug, diseno }: { slides: HeroSlide[]; slug: string; diseno: any }) {
  const navigateRouter = useNavigate();
  const [index, setIndex] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % count), 6500);
    return () => clearInterval(timer);
  }, [count]);

  const go = (dir: number) => setIndex((prev) => (prev + dir + count) % count);
  const goAction = (key: string) => runStoreLinkAction(getStoreLinkAction(diseno, key, { defaultType: 'catalog' }), { slug, navigate: navigateRouter });
  const goCatalog = () => {
    if (slug === 'preview') { window.dispatchEvent(new CustomEvent('preview-nav', { detail: 'catalogo' })); return; }
    navigateRouter(`/tienda/${slug}/catalogo`);
  };
  const slide = slides[index];

  return (
    <section className="relative isolate" aria-roledescription="carousel">
      <div className="relative h-[62vh] min-h-[440px] w-full overflow-hidden md:h-[78vh]">
        <AnimatePresence mode="wait">
          {slide.onlyImage ? (
            <motion.button
              key={`only-${index}`}
              type="button"
              onClick={() => goAction(slide.actionKey)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: minEase }}
              className="absolute inset-0 h-full w-full cursor-pointer"
              aria-label={slide.eyebrow || 'Ver más'}
            >
              <img src={slide.image} alt={slide.eyebrow || 'Banner'} className="h-full w-full object-cover" />
            </motion.button>
          ) : (
            <motion.div key={`slide-${index}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, ease: minEase }} className="absolute inset-0">
              <img src={slide.image} alt={slide.eyebrow || 'Colección'} className="h-full w-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%)' }} />
              <div className="absolute inset-x-0 bottom-0">
                <div className="mx-auto max-w-7xl px-6 pb-12 md:px-8 md:pb-16">
                  <div className="max-w-xl text-white">
                    {slide.eyebrow && <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em]">{slide.eyebrow}</p>}
                    <h1 className="text-3xl font-medium leading-[1.08] tracking-tight md:text-5xl">{slide.title}</h1>
                    {slide.subtitle && <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85 md:text-base">{slide.subtitle}</p>}
                    <div className="mt-6 flex flex-wrap items-center gap-5">
                      {slide.button && <ShopLink onClick={() => goAction(slide.actionKey)}>{slide.button}</ShopLink>}
                      {slide.button2 && <ShopLink onClick={goCatalog}>{slide.button2}</ShopLink>}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Anterior" className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-white/85 text-neutral-800 transition-colors hover:bg-white">
              <Icon icon="solar:alt-arrow-left-linear" width={20} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Siguiente" className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-white/85 text-neutral-800 transition-colors hover:bg-white">
              <Icon icon="solar:alt-arrow-right-linear" width={20} />
            </button>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
              {slides.map((_, i) => (
                <button key={i} type="button" onClick={() => setIndex(i)} aria-label={`Slide ${i + 1}`} className="h-1 transition-all" style={{ width: i === index ? 28 : 14, backgroundColor: i === index ? '#fff' : 'rgba(255,255,255,0.5)' }} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ───────────────────────────────── Home ──────────────────────────────────── */

export default function ModaMinimalHomePage({
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
  const primary = minPrimary(cp);
  const font = minFont(diseno);
  const nuevos = productos.slice(0, 8);
  const favoritos = productos.slice(0, 4);

  const tiles = (allCategories || [])
    .map((cat: any) => (typeof cat === 'string' ? { nombre: cat } : cat))
    .filter((cat: any) => cat?.nombre)
    .slice(0, 3);
  const tileFallbackNames = ['Mujer', 'Hombre', 'Calzado'];

  const VALUES = [
    { title: diseno?.modaMinimalValue1Title || 'Calidad primero', text: diseno?.modaMinimalValue1Text || 'Materiales nobles y confección cuidada, prenda por prenda.' },
    { title: diseno?.modaMinimalValue2Title || 'Precios honestos', text: diseno?.modaMinimalValue2Text || 'Pagas por la calidad, no por el margen. Sin sobreprecio.' },
    { title: diseno?.modaMinimalValue3Title || 'Hecho para durar', text: diseno?.modaMinimalValue3Text || 'Diseño atemporal que acompaña temporada tras temporada.' },
  ];

  return (
    <motion.div initial="hidden" animate="show" variants={minPage} className="min-h-screen" style={{ backgroundColor: MIN.paper, fontFamily: font }}>
      <MinHeader
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
        <HeroSlider slides={buildHeroSlides(diseno)} slug={slug} diseno={diseno} />

        {/* ── Tiles por categoría ──────────────────────────────────────────── */}
        <motion.section variants={minSection} initial="hidden" whileInView="show" viewport={minViewport} className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
          <motion.div variants={minStagger} className="grid gap-4 md:grid-cols-3">
            {(tiles.length ? tiles : tileFallbackNames.map((n) => ({ nombre: n }))).slice(0, 3).map((cat: any, i: number) => (
              <motion.a
                key={cat.nombre + i}
                variants={minCard}
                href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(cat.nombre)}`}
                className="group relative flex aspect-[4/5] items-end justify-center overflow-hidden"
                style={{ backgroundColor: MIN.stone }}
              >
                <img src={cat.imagenUrl || cat.imagen || TILE_FALLBACKS[i % TILE_FALLBACKS.length]} alt={cat.nombre} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.05]" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)' }} />
                <div className="relative z-10 mb-8 text-center text-white">
                  <h3 className="mb-3 text-lg font-medium">{cat.nombre}</h3>
                  <span className="border-b border-white pb-0.5 text-[11px] font-semibold uppercase tracking-[0.16em]">Comprar</span>
                </div>
              </motion.a>
            ))}
          </motion.div>
        </motion.section>

        {/* ── Novedades ────────────────────────────────────────────────────── */}
        <motion.section variants={minSection} initial="hidden" whileInView="show" viewport={minViewport} className="mx-auto max-w-7xl px-5 pb-14 md:px-8 md:pb-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="text-xl font-medium tracking-tight md:text-2xl" style={{ color: MIN.ink }}>{diseno?.modaMinimalNewTitle || 'Novedades'}</h2>
            <a href={`/tienda/${slug}/catalogo`} className="border-b pb-0.5 text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: MIN.ink, borderColor: MIN.ink }}>Ver todo</a>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse" style={{ backgroundColor: MIN.stone }} />)}</div>
          ) : nuevos.length === 0 ? (
            <div className="border border-dashed py-20 text-center text-sm text-neutral-400" style={{ borderColor: MIN.line }}>Aún no hay prendas publicadas.</div>
          ) : (
            <motion.div variants={minStagger} className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
              {nuevos.map((producto) => (
                <MinProductCard key={producto.id} producto={producto} slug={slug} cp={primary} onAddToCart={agregarAlCarrito} onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)} />
              ))}
            </motion.div>
          )}
        </motion.section>

        {/* ── Banner editorial ─────────────────────────────────────────────── */}
        <motion.section variants={minSection} initial="hidden" whileInView="show" viewport={minViewport} className="relative">
          <div className="relative h-[420px] w-full overflow-hidden md:h-[520px]">
            <img src={diseno?.modaMinimalEditorialImage || EDITORIAL_FALLBACK} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: '75% center' }} />
            <div className="absolute inset-0 flex items-center" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.08) 55%, rgba(0,0,0,0) 72%)' }}>
              <div className="mx-auto w-full max-w-7xl px-6 md:px-8">
                <div className="max-w-md text-white" style={{ textShadow: '0 2px 18px rgba(0,0,0,0.35)' }}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em]">{diseno?.modaMinimalEditorialEyebrow || 'Nuestra promesa'}</p>
                  <h2 className="mt-3 text-3xl font-medium leading-tight md:text-4xl">{diseno?.modaMinimalEditorialTitle || 'Transparencia radical.'}</h2>
                  <p className="mt-4 text-sm leading-relaxed text-white/85">{diseno?.modaMinimalEditorialText || 'Conoce el origen de cada prenda: los materiales, quién la hizo y cuánto cuesta realmente producirla.'}</p>
                  <button type="button" onClick={() => navigate(`/tienda/${slug}/catalogo`)} className="mt-6 inline-flex bg-white px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-900 shadow-lg transition-transform hover:-translate-y-0.5" style={{ textShadow: 'none' }}>
                    {diseno?.modaMinimalEditorialButton || 'Conocer más'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Valores ──────────────────────────────────────────────────────── */}
        <motion.section variants={minSection} initial="hidden" whileInView="show" viewport={minViewport} className="border-b" style={{ borderColor: MIN.line }}>
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 text-center md:grid-cols-3 md:px-8">
            {VALUES.map((v, i) => (
              <div key={v.title}>
                <span className="text-2xl font-semibold" style={{ color: MIN.muted }}>0{i + 1}</span>
                <h3 className="mt-3 text-base font-semibold uppercase tracking-[0.12em]" style={{ color: MIN.ink }}>{v.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-6" style={{ color: MIN.soft }}>{v.text}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── Los favoritos ────────────────────────────────────────────────── */}
        {favoritos.length > 0 && (
          <motion.section variants={minSection} initial="hidden" whileInView="show" viewport={minViewport} className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
            <div className="mb-8 flex items-end justify-between gap-4">
              <h2 className="text-xl font-medium tracking-tight md:text-2xl" style={{ color: MIN.ink }}>{diseno?.modaMinimalBestTitle || 'Los favoritos'}</h2>
              <a href={`/tienda/${slug}/catalogo`} className="border-b pb-0.5 text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: MIN.ink, borderColor: MIN.ink }}>Ver todo</a>
            </div>
            <motion.div variants={minStagger} className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
              {favoritos.map((producto) => (
                <MinProductCard key={producto.id} producto={producto} slug={slug} cp={primary} onAddToCart={agregarAlCarrito} onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)} />
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* ── Newsletter ───────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: MIN.cream }}>
          <motion.div variants={minSection} initial="hidden" whileInView="show" viewport={minViewport} className="mx-auto max-w-2xl px-6 py-16 text-center md:py-20">
            <h2 className="text-2xl font-medium tracking-tight" style={{ color: MIN.ink }}>{diseno?.modaMinimalNewsletterTitle || 'Suscríbete y obtén 10% de descuento'}</h2>
            <p className="mt-3 text-sm" style={{ color: MIN.soft }}>{diseno?.modaMinimalNewsletterSubtitle || 'Novedades, lanzamientos y ofertas exclusivas en tu correo.'}</p>
            <form onSubmit={(e) => e.preventDefault()} className="mx-auto mt-7 flex max-w-md items-center border-b" style={{ borderColor: MIN.ink }}>
              <input type="email" placeholder="Tu correo electrónico" className="h-11 flex-1 border-0 bg-transparent px-1 text-sm outline-none placeholder:text-neutral-400 focus:ring-0" style={{ color: MIN.ink }} />
              <button type="submit" className="h-11 px-2 text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: MIN.ink }}>
                {diseno?.modaMinimalNewsletterButton || 'Suscribirme'}
              </button>
            </form>
          </motion.div>
        </section>
      </main>

      <MinFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <MinWhatsAppFab tienda={tienda} />

      <MinCartModal
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
