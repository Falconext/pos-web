import { type ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { getProductPricing } from '@/templates/shared/pricing';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { URB, UrbCartModal, UrbFooter, UrbHeader, UrbProductCard, UrbWhatsAppFab, urbFont, urbPrimary, withAlpha } from './RopaHombreParts';
import { urbCard, urbEase, urbPage, urbSection, urbStagger, urbTap, urbViewport } from './motion';

const navigate = (to: string) => { window.location.href = to; };

const HERO_FALLBACKS = [
  'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&w=1200&q=80',
];
const CATEGORY_FALLBACKS = [
  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=600&q=80',
];
const PREMIUM_FALLBACK = 'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=900&q=80';
const SALE_FALLBACK = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80';
const TESTIMONIAL_FALLBACK = 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=700&q=80';
const COMMUNITY_FALLBACK = 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=900&q=80';
const AVATAR_FALLBACKS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&q=80',
];

const money = (v: number) => `S/ ${Number(v || 0).toFixed(2)}`;
const nameOf = (p: any) => p?.descripcion || p?.nombre || 'Producto';
const imgOf = (p: any) => p?.imagenUrl || p?.imagen || '';

function Eyebrow({ children, color, center }: { children: ReactNode; color: string; center?: boolean }) {
  return (
    <p className={`flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.28em] ${center ? 'justify-center' : ''}`} style={{ color }}>
      <span className="h-px w-5" style={{ backgroundColor: color }} />
      {children}
      {center && <span className="h-px w-5" style={{ backgroundColor: color }} />}
    </p>
  );
}

/* ─────────────────────────────── Hero slider ─────────────────────────────── */

interface HeroSlide {
  image: string;
  eyebrow: string;
  title: string;
  title2: string;
  subtitle: string;
  button: string;
  button2?: string;
  onlyImage: boolean;
  actionKey: string;
}

function buildHeroSlides(diseno: any): HeroSlide[] {
  const raw: HeroSlide[] = [
    {
      image: diseno?.ropaHombreHeroImage || '',
      eyebrow: diseno?.ropaHombreHeroEyebrow || 'Premium Clothing',
      title: diseno?.ropaHombreHeroTitle || 'Wear your style.',
      title2: diseno?.ropaHombreHeroTitle2 || 'Own your confidence.',
      subtitle: diseno?.ropaHombreHeroSubtitle || 'Ropa de calidad premium, confeccionada con comodidad y diseñada para el hombre moderno.',
      button: diseno?.ropaHombreHeroButton || 'Shop Now',
      button2: diseno?.ropaHombreHeroButton2 || '',
      onlyImage: Boolean(diseno?.ropaHombreHeroOnlyImage),
      actionKey: 'ropaHombreHeroAction',
    },
    {
      image: diseno?.ropaHombreSlide2Image || '',
      eyebrow: diseno?.ropaHombreSlide2Eyebrow || 'Esenciales',
      title: diseno?.ropaHombreSlide2Title || 'Básicos que duran.',
      title2: diseno?.ropaHombreSlide2Title2 || 'Hechos para ti.',
      subtitle: diseno?.ropaHombreSlide2Subtitle || 'Camisas, polos y pantalones que combinan con todo. Calidad que se siente en cada prenda.',
      button: diseno?.ropaHombreSlide2Button || 'Descubrir',
      onlyImage: Boolean(diseno?.ropaHombreSlide2OnlyImage),
      actionKey: 'ropaHombreSlide2Action',
    },
    {
      image: diseno?.ropaHombreSlide3Image || '',
      eyebrow: diseno?.ropaHombreSlide3Eyebrow || 'Temporada',
      title: diseno?.ropaHombreSlide3Title || 'Hasta 40% OFF.',
      title2: diseno?.ropaHombreSlide3Title2 || 'Solo por hoy.',
      subtitle: diseno?.ropaHombreSlide3Subtitle || 'Aprovecha descuentos exclusivos en prendas seleccionadas de la colección.',
      button: diseno?.ropaHombreSlide3Button || 'Ver ofertas',
      onlyImage: Boolean(diseno?.ropaHombreSlide3OnlyImage),
      actionKey: 'ropaHombreSlide3Action',
    },
  ];
  return raw.map((slide, i) => ({ ...slide, image: slide.image || HERO_FALLBACKS[i % HERO_FALLBACKS.length] }));
}

function HeroSlider({ slides, slug, primary, diseno, featured }: { slides: HeroSlide[]; slug: string; primary: string; diseno: any; featured?: any }) {
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

  const featPrice = featured ? getProductPricing(featured).precioFinal : 0;
  const newArrivalLabel = diseno?.ropaHombreHeroNewArrivalLabel || 'New Arrival';

  return (
    <section className="relative isolate overflow-hidden" style={{ background: `radial-gradient(120% 100% at 78% 18%, ${URB.nude} 0%, ${URB.cream} 60%)` }} aria-roledescription="carousel">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {slide.onlyImage ? (
          <div className="py-6 md:py-8">
            <AnimatePresence mode="wait">
              <motion.button
                key={`only-${index}`}
                type="button"
                onClick={() => goAction(slide.actionKey)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: urbEase }}
                className="group relative block h-72 w-full cursor-pointer overflow-hidden rounded-[28px] md:h-[540px]"
                aria-label={slide.eyebrow || 'Ver más'}
              >
                <img src={slide.image} alt={slide.eyebrow || 'Banner'} className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]" />
              </motion.button>
            </AnimatePresence>
          </div>
        ) : (
          <div className="grid items-center gap-10 py-10 md:grid-cols-[1.02fr_1fr] md:py-14">
            {/* Texto */}
            <div className="relative order-2 md:order-1">
              <AnimatePresence mode="wait">
                <motion.div key={`c-${index}`} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.6, ease: urbEase }}>
                  {slide.eyebrow && <div className="mb-5"><Eyebrow color={primary}>{slide.eyebrow}</Eyebrow></div>}
                  <h1 className="text-[13vw] leading-[0.95] tracking-tight sm:text-6xl md:text-[5.2rem]" style={{ fontFamily: URB.serif, color: URB.ink }}>
                    <span className="block">{slide.title}</span>
                    {slide.title2 && <span className="mt-1 block italic" style={{ color: primary }}>{slide.title2}</span>}
                  </h1>
                  {slide.subtitle && <p className="mt-6 max-w-md text-[15px] leading-relaxed text-neutral-600">{slide.subtitle}</p>}
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    {slide.button && (
                      <motion.button type="button" onClick={() => goAction(slide.actionKey)} whileHover={{ scale: 1.03, y: -2 }} whileTap={urbTap}
                        className="inline-flex items-center gap-3 rounded-full py-4 pl-7 pr-3 text-[13px] font-semibold text-white shadow-lg" style={{ backgroundColor: URB.ink }}>
                        {slide.button}
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15"><Icon icon="solar:arrow-right-up-linear" width={16} /></span>
                      </motion.button>
                    )}
                    {slide.button2 && (
                      <button type="button" onClick={goCatalog} className="inline-flex items-center gap-2 rounded-full border px-7 py-4 text-[13px] font-semibold text-neutral-800 transition-colors hover:border-neutral-900" style={{ borderColor: URB.tan }}>
                        {slide.button2}
                      </button>
                    )}
                  </div>

                  {/* Confianza */}
                  <div className="mt-9 flex items-center gap-3">
                    <div className="flex -space-x-3">
                      {AVATAR_FALLBACKS.map((a, i) => (
                        <img key={i} src={a} alt="" className="h-10 w-10 rounded-full border-2 border-white object-cover" />
                      ))}
                    </div>
                    <div className="text-[13px] leading-tight">
                      <p className="font-semibold" style={{ color: URB.ink }}>{diseno?.ropaHombreTrustNumber || 'Trusted by 10K+'}</p>
                      <p className="text-neutral-500">{diseno?.ropaHombreTrustLabel || 'Happy Customers'}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Imagen + tarjeta flotante */}
            <div className="relative order-1 md:order-2">
              {/* Forma beige detrás */}
              <div className="absolute right-2 top-2 -z-10 hidden h-[86%] w-[70%] rounded-[40px_40px_40px_120px] md:block" style={{ backgroundColor: URB.sand, transform: 'rotate(-6deg)' }} />
              <Icon icon="solar:star-bold" className="absolute -right-1 top-1 text-3xl" style={{ color: URB.ink }} />
              <AnimatePresence mode="wait">
                <motion.div key={`i-${index}`} initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, ease: urbEase }}
                  className="relative h-80 overflow-hidden rounded-[28px] shadow-[0_40px_90px_-40px_rgba(26,22,19,0.55)] md:h-[540px]">
                  <img src={slide.image} alt={slide.eyebrow || 'Colección'} className="h-full w-full object-cover" />
                </motion.div>
              </AnimatePresence>

              {/* Tarjeta New Arrival */}
              {featured && (
                <motion.button
                  type="button"
                  onClick={() => navigate(slug === 'preview' ? '#' : `/tienda/${slug}/producto/${featured.id}`)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6, ease: urbEase }}
                  className="absolute -bottom-5 left-4 flex w-[220px] items-center gap-3 rounded-2xl bg-white/95 p-3 text-left shadow-xl backdrop-blur md:left-auto md:right-5"
                >
                  <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl" style={{ backgroundColor: URB.mist }}>
                    {imgOf(featured) ? <img src={imgOf(featured)} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center"><Icon icon="solar:t-shirt-linear" style={{ color: URB.tan }} width={22} /></span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: primary }}>{newArrivalLabel}</span>
                    <span className="line-clamp-1 text-[13px] font-semibold" style={{ color: URB.ink }}>{nameOf(featured)}</span>
                    <span className="text-sm font-bold" style={{ color: URB.ink }}>{money(featPrice)}</span>
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: URB.ink }}><Icon icon="solar:arrow-right-linear" width={15} /></span>
                </motion.button>
              )}
            </div>
          </div>
        )}

        {count > 1 && (
          <div className="flex items-center justify-center gap-4 pb-10 md:justify-end md:pb-8">
            <button type="button" onClick={() => go(-1)} aria-label="Anterior" className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-800 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-neutral-50">
              <Icon icon="solar:alt-arrow-left-linear" width={20} />
            </button>
            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button key={i} type="button" onClick={() => setIndex(i)} aria-label={`Slide ${i + 1}`} className="h-1.5 rounded-full transition-all" style={{ width: i === index ? 30 : 10, backgroundColor: i === index ? primary : 'rgba(26,22,19,0.18)' }} />
              ))}
            </div>
            <button type="button" onClick={() => go(1)} aria-label="Siguiente" className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-800 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-neutral-50">
              <Icon icon="solar:alt-arrow-right-linear" width={20} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ───────────────────────────────── Home ──────────────────────────────────── */

export default function RopaHombreHomePage({
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
  const primary = urbPrimary(cp);
  const font = urbFont(diseno);
  const featured = productos.slice(0, 4);
  const heroProduct = productos[0];
  const freshProduct = productos[1] || productos[0];

  const brands = String(diseno?.ropaHombreBrands || 'ZARA,MANGO,H&M,asos,PULL&BEAR').split(',').map((s) => s.trim()).filter(Boolean);

  const categoryCards = (allCategories || [])
    .map((cat: any) => (typeof cat === 'string' ? { nombre: cat } : cat))
    .filter((cat: any) => cat?.nombre)
    .slice(0, 4);
  const categoryFallbackNames = ['Shirts', 'T-Shirts', 'Jackets', 'Pants'];

  const WHY = [
    { icon: 'solar:settings-minimalistic-linear', title: diseno?.ropaHombreWhy1Title || 'Premium Quality', text: diseno?.ropaHombreWhy1Text || 'Telas finas para una comodidad duradera.' },
    { icon: 'solar:hanger-2-linear', title: diseno?.ropaHombreWhy2Title || 'Modern Design', text: diseno?.ropaHombreWhy2Text || 'Estilo atemporal que sigue las tendencias.' },
    { icon: 'solar:t-shirt-linear', title: diseno?.ropaHombreWhy3Title || 'Perfect Fit', text: diseno?.ropaHombreWhy3Text || 'Diseñado para calzar justo como quieres.' },
    { icon: 'solar:refresh-square-linear', title: diseno?.ropaHombreWhy4Title || 'Easy Returns', text: diseno?.ropaHombreWhy4Text || 'Cambios sin complicaciones en 30 días.' },
  ];

  const freshPrice = freshProduct ? getProductPricing(freshProduct).precioFinal : 0;

  return (
    <motion.div initial="hidden" animate="show" variants={urbPage} className="min-h-screen" style={{ backgroundColor: URB.cream, fontFamily: font }}>
      <UrbHeader
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
        <HeroSlider slides={buildHeroSlides(diseno)} slug={slug} primary={primary} diseno={diseno} featured={heroProduct} />

        {/* ── Tira diagonal de marcas ──────────────────────────────────────── */}
        <div className="relative overflow-hidden py-10">
          <div className="w-[105%] -translate-x-[2.5%] py-4 text-white" style={{ backgroundColor: URB.ink, transform: 'rotate(-2.4deg)' }}>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6">
              {brands.map((b, i) => (
                <span key={`${b}-${i}`} className="flex items-center gap-8 text-lg font-semibold tracking-wide md:text-2xl" style={{ fontFamily: URB.serif }}>
                  {b}
                  {i < brands.length - 1 && <span className="text-white/40">•</span>}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Premium Collection banner ────────────────────────────────────── */}
        <motion.section variants={urbSection} initial="hidden" whileInView="show" viewport={urbViewport} className="mx-auto max-w-7xl px-5 pb-16 md:px-8">
          <div className="grid items-center gap-6 overflow-hidden rounded-[28px] md:grid-cols-2" style={{ backgroundColor: URB.sand }}>
            <div className="p-9 md:p-12">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: primary }}>{diseno?.ropaHombrePremiumEyebrow || 'Premium Collection'}</p>
              <h2 className="mt-3 text-4xl leading-[1.05] md:text-5xl" style={{ fontFamily: URB.serif, color: URB.ink }}>{diseno?.ropaHombrePremiumTitle || 'Elevate your everyday look.'}</h2>
              <button type="button" onClick={() => navigate(`/tienda/${slug}/catalogo`)} className="mt-7 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5" style={{ backgroundColor: URB.ink }}>
                {diseno?.ropaHombrePremiumButton || 'Shop Collection'} <Icon icon="solar:arrow-right-linear" width={15} />
              </button>
            </div>
            <div className="relative h-64 md:h-full md:min-h-[300px]">
              <img src={diseno?.ropaHombrePremiumImage || PREMIUM_FALLBACK} alt="" className="h-full w-full object-cover" />
            </div>
          </div>
        </motion.section>

        {/* ── Shop by category ─────────────────────────────────────────────── */}
        <motion.section variants={urbSection} initial="hidden" whileInView="show" viewport={urbViewport} className="mx-auto max-w-7xl px-5 pb-16 md:px-8">
          <p className="mb-6 text-[12px] font-semibold uppercase tracking-[0.22em] text-neutral-500">{diseno?.ropaHombreCategoriesTitle || 'Shop by Category'}</p>
          <motion.div variants={urbStagger} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {(categoryCards.length ? categoryCards : categoryFallbackNames.map((n) => ({ nombre: n }))).slice(0, 4).map((cat: any, i: number) => (
              <motion.a
                key={cat.nombre + i}
                variants={urbCard}
                whileHover={{ y: -6 }}
                href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(cat.nombre)}`}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
              >
                <div className="relative aspect-[4/5] overflow-hidden" style={{ backgroundColor: URB.mist }}>
                  <img src={cat.imagenUrl || cat.imagen || CATEGORY_FALLBACKS[i % CATEGORY_FALLBACKS.length]} alt={cat.nombre} loading="lazy" className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]" />
                </div>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: URB.ink }}>{cat.nombre}</h3>
                    <span className="text-[11px] font-medium text-neutral-400">Explore Now →</span>
                  </div>
                  <Icon icon="solar:arrow-right-up-linear" width={18} className="text-neutral-400 transition-colors group-hover:text-neutral-900" />
                </div>
              </motion.a>
            ))}
          </motion.div>
        </motion.section>

        {/* ── Summer sale banner ───────────────────────────────────────────── */}
        <motion.section variants={urbSection} initial="hidden" whileInView="show" viewport={urbViewport} className="mx-auto max-w-7xl px-5 pb-16 md:px-8">
          <div className="relative flex min-h-[220px] items-center overflow-hidden rounded-[28px]" style={{ backgroundColor: URB.charcoal }}>
            <img src={diseno?.ropaHombreSaleImage || SALE_FALLBACK} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: '78% center' }} />
            <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${URB.ink} 0%, ${withAlpha(URB.ink, 'e6')} 30%, ${withAlpha(URB.ink, '80')} 52%, ${withAlpha(URB.ink, '00')} 74%)` }} />
            <div className="relative z-10 max-w-md p-9 text-white md:p-12" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.4)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: URB.goldSoft }}>{diseno?.ropaHombreSaleEyebrow || 'Summer Sale'}</p>
              <h2 className="mt-3 text-4xl md:text-5xl" style={{ fontFamily: URB.serif }}>{diseno?.ropaHombreSaleTitle || 'Up to 40% Off'}</h2>
              <p className="mt-2 text-sm text-white/70">{diseno?.ropaHombreSaleSubtitle || 'On Selected Items Only'}</p>
              <button type="button" onClick={() => navigate(`/tienda/${slug}/catalogo`)} className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[13px] font-semibold text-neutral-900 shadow-lg transition-transform hover:-translate-y-0.5" style={{ textShadow: 'none' }}>
                {diseno?.ropaHombreSaleButton || 'Shop Now'} <Icon icon="solar:arrow-right-linear" width={15} />
              </button>
            </div>
            <div className="absolute right-6 top-6 z-10 hidden h-24 w-24 items-center justify-center rounded-full border border-white/25 text-center text-[9px] font-semibold uppercase leading-tight tracking-[0.16em] text-white/80 md:flex">
              {diseno?.ropaHombreSaleBadge || 'Limited · Time · Only'}
            </div>
          </div>
        </motion.section>

        {/* ── Best sellers ─────────────────────────────────────────────────── */}
        <motion.section variants={urbSection} initial="hidden" whileInView="show" viewport={urbViewport} className="mx-auto max-w-7xl px-5 pb-16 md:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: primary }}>{diseno?.ropaHombreBestsellersEyebrow || 'Best Sellers'}</p>
              <h2 className="mt-2 text-3xl md:text-4xl" style={{ fontFamily: URB.serif, color: URB.ink }}>{diseno?.ropaHombreBestsellersTitle || 'Our Most Loved Styles'}</h2>
            </div>
            <a href={`/tienda/${slug}/catalogo`} className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] hover:opacity-70" style={{ color: URB.ink }}>
              View All Products <Icon icon="solar:arrow-right-linear" width={15} />
            </a>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-black/[0.04]" />)}</div>
          ) : featured.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-20 text-center text-neutral-400" style={{ borderColor: URB.line }}>Aún no hay prendas publicadas.</div>
          ) : (
            <motion.div variants={urbStagger} className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
              {featured.map((producto) => (
                <UrbProductCard key={producto.id} producto={producto} slug={slug} cp={primary} onAddToCart={agregarAlCarrito} onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)} />
              ))}
            </motion.div>
          )}
        </motion.section>

        {/* ── Fresh styles (featured split) ────────────────────────────────── */}
        {freshProduct && (
          <motion.section variants={urbSection} initial="hidden" whileInView="show" viewport={urbViewport} className="mx-auto max-w-7xl px-5 pb-16 md:px-8">
            <div className="grid items-stretch gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="relative overflow-hidden rounded-[28px]" style={{ backgroundColor: URB.mist }}>
                <img src={imgOf(freshProduct) || HERO_FALLBACKS[1]} alt={nameOf(freshProduct)} className="h-full min-h-[360px] w-full object-cover" />
                <div className="absolute left-7 top-7 max-w-xs">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: URB.ink }}>{diseno?.ropaHombreFreshEyebrow || 'New Arrivals'}</p>
                  <h2 className="mt-2 text-3xl leading-tight md:text-4xl" style={{ fontFamily: URB.serif, color: URB.ink }}>{diseno?.ropaHombreFreshTitle || 'Fresh styles for every you.'}</h2>
                  <p className="mt-3 text-sm text-neutral-700">{diseno?.ropaHombreFreshSubtitle || 'Descubre las últimas tendencias y básicos atemporales, todo en un solo lugar.'}</p>
                  <a href={`/tienda/${slug}/catalogo`} className="mt-5 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: URB.ink }}>
                    {diseno?.ropaHombreFreshButton || 'View All Collection'} <Icon icon="solar:arrow-right-linear" width={14} />
                  </a>
                </div>
              </div>
              <div className="flex flex-col overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-black/5">
                <button type="button" onClick={() => navigate(`/tienda/${slug}/producto/${freshProduct.id}`)} className="relative aspect-[4/3] w-full overflow-hidden" style={{ backgroundColor: URB.mist }}>
                  {imgOf(freshProduct) ? <img src={imgOf(freshProduct)} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center"><Icon icon="solar:t-shirt-linear" width={54} style={{ color: URB.tan }} /></span>}
                </button>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-xl" style={{ fontFamily: URB.serif, color: URB.ink }}>{nameOf(freshProduct)}</h3>
                  <p className="mt-1 text-lg font-semibold" style={{ color: URB.ink }}>{money(freshPrice)}</p>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Available in 6 colors</p>
                  <div className="mt-2 flex items-center gap-2">
                    {['#E1D3C0', '#8C6A45', '#262220', '#3B4652', '#B79C7C', '#6E5637'].map((c) => (
                      <span key={c} className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <button type="button" onClick={() => { agregarAlCarrito(freshProduct); setMostrarCarrito(true); }} className="mt-auto flex items-center justify-center gap-2 rounded-full py-3.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white" style={{ backgroundColor: URB.ink }}>
                    <Icon icon="solar:bag-4-linear" width={15} /> Shop Now
                  </button>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* ── Testimonial ──────────────────────────────────────────────────── */}
        <motion.section variants={urbSection} initial="hidden" whileInView="show" viewport={urbViewport} className="border-y bg-white" style={{ borderColor: URB.line }}>
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-[1fr_0.7fr] md:px-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: primary }}>{diseno?.ropaHombreTestimonialEyebrow || 'What Our Customers Say'}</p>
              <h2 className="mt-2 text-3xl md:text-4xl" style={{ fontFamily: URB.serif, color: URB.ink }}>{diseno?.ropaHombreTestimonialTitle || 'Real People. Real Style.'}</h2>
              <div className="mt-7 rounded-2xl p-7" style={{ backgroundColor: URB.cream }}>
                <Icon icon="solar:quote-up-square-bold" width={30} style={{ color: primary }} />
                <p className="mt-3 text-[15px] leading-7 text-neutral-700">“{diseno?.ropaHombreTestimonialQuote || 'La calidad es increíble y el calce es perfecto. Urbanic es mi tienda favorita para cada ocasión.'}”</p>
                <div className="mt-5 flex items-center gap-3">
                  <img src={AVATAR_FALLBACKS[1]} alt="" className="h-11 w-11 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: URB.ink }}>{diseno?.ropaHombreTestimonialAuthor || 'James Carter'}</p>
                    <p style={{ color: primary }}>★★★★★</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative h-72 overflow-hidden rounded-[28px] md:h-96">
              <img src={diseno?.ropaHombreTestimonialImage || TESTIMONIAL_FALLBACK} alt="" className="h-full w-full object-cover" />
            </div>
          </div>
        </motion.section>

        {/* ── Why choose us ────────────────────────────────────────────────── */}
        <motion.section variants={urbSection} initial="hidden" whileInView="show" viewport={urbViewport} className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-neutral-500">{diseno?.ropaHombreWhyEyebrow || 'Why Choose Us'}</p>
          <h2 className="mt-2 max-w-md text-4xl leading-[1.05] md:text-5xl" style={{ fontFamily: URB.serif, color: URB.ink }}>{diseno?.ropaHombreWhyTitle || 'Crafted for quality. Made for you.'}</h2>
          <motion.div variants={urbStagger} className="mt-12 grid grid-cols-2 gap-8 lg:grid-cols-4">
            {WHY.map((w) => (
              <motion.div key={w.title} variants={urbCard} className="flex flex-col items-start">
                <span className="flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: URB.mist, color: URB.ink }}>
                  <Icon icon={w.icon} width={26} />
                </span>
                <p className="mt-4 text-base font-semibold" style={{ color: URB.ink }}>{w.title}</p>
                <p className="mt-1.5 text-sm leading-6 text-neutral-500">{w.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* ── Join community ───────────────────────────────────────────────── */}
        <motion.section variants={urbSection} initial="hidden" whileInView="show" viewport={urbViewport} className="mx-auto max-w-7xl px-5 pb-16 md:px-8">
          <div className="relative flex min-h-[240px] items-center overflow-hidden rounded-[28px]" style={{ backgroundColor: URB.ink }}>
            <img src={diseno?.ropaHombreCommunityImage || COMMUNITY_FALLBACK} alt="" className="absolute inset-y-0 right-0 h-full w-1/2 object-cover opacity-60" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${URB.ink} 46%, rgba(26,22,19,0.25) 100%)` }} />
            <div className="relative z-10 max-w-lg p-9 text-white md:p-12">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: URB.goldSoft }}>{diseno?.ropaHombreCommunityEyebrow || 'Stay in Style'}</p>
              <h2 className="mt-3 text-3xl md:text-4xl" style={{ fontFamily: URB.serif }}>{diseno?.ropaHombreCommunityTitle || 'Join our community'}</h2>
              <p className="mt-2 text-sm text-white/65">{diseno?.ropaHombreCommunitySubtitle || 'Recibe ofertas exclusivas, acceso anticipado y tips de estilo.'}</p>
              <form onSubmit={(e) => e.preventDefault()} className="mt-6 flex w-full max-w-md items-center gap-2 rounded-full bg-white/10 p-1.5 ring-1 ring-white/15">
                <input type="email" placeholder="Enter your email" className="h-11 flex-1 border-0 bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/50 focus:ring-0" />
                <button type="submit" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-900" style={{ backgroundColor: '#fff' }}>
                  <Icon icon="solar:arrow-right-linear" width={17} />
                </button>
              </form>
            </div>
          </div>
        </motion.section>
      </main>

      <UrbFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <UrbWhatsAppFab tienda={tienda} />

      <UrbCartModal
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
