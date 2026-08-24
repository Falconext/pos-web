import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { MOTO, MotoCartModal, MotoFooter, MotoHeader, MotoProductCard, MotoWhatsAppFab, motoFont, motoPrimary, waLink, withAlpha } from './MotosParts';
import { motoCard, motoEase, motoPage, motoSection, motoStagger, motoViewport } from './motion';

const navigate = (to: string) => { window.location.href = to; };

const HERO_SLIDE_FALLBACKS = [
  'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1600&q=80',
];
const GEAR_FALLBACK = 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?auto=format&fit=crop&w=800&q=80';
const CATEGORY_FALLBACKS = [
  'https://images.unsplash.com/photo-1517672651691-24622a91b550?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=700&q=80',
];
const SALE_FALLBACK = 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&w=800&q=80';
const PREORDER_FALLBACK = 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80';
const SERVICE_FALLBACKS = [
  'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1591637333472-3b3f5b0d0f0e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&w=800&q=80',
];
const PROMO_FALLBACK = 'https://images.unsplash.com/photo-1547549082-6bc09f2049ae?auto=format&fit=crop&w=1200&q=80';

const SERVICES_DEFAULT = [
  { icon: 'solar:wrench-bold', title: 'Servicio', text: 'Mantenimiento y diagnóstico' },
  { icon: 'solar:bolt-bold', title: 'Tuning', text: 'Personaliza tu moto' },
  { icon: 'mdi:racing-helmet', title: 'Equipamiento', text: 'Cascos, guantes y más' },
  { icon: 'solar:box-bold', title: 'Equipo adicional', text: 'Repuestos y accesorios' },
];

const BRANDS_DEFAULT = ['ECOOTER', 'TINBOT', 'SUPER SOCO', 'HORWIN', 'NIU', 'VOLTIA', 'SEGWAY'];

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

function buildHeroSlides(diseno: any): HeroSlide[] {
  const raw: HeroSlide[] = [
    {
      image: diseno?.motosHeroImage || '',
      eyebrow: diseno?.motosHeroEyebrow || 'Nueva temporada',
      title: diseno?.motosHeroTitle || 'Energía pura.',
      title2: diseno?.motosHeroTitle2 || 'Cero gasolina.',
      subtitle: diseno?.motosHeroSubtitle || 'Motos eléctricas premium con autonomía real, garantía oficial y taller propio.',
      button: diseno?.motosHeroButton || 'Ver catálogo',
      onlyImage: Boolean(diseno?.motosHeroOnlyImage),
      actionKey: 'motosHeroAction',
    },
    {
      image: diseno?.motosSlide2Image || '',
      eyebrow: diseno?.motosSlide2Eyebrow || 'Deportivas',
      title: diseno?.motosSlide2Title || 'Adrenalina',
      title2: diseno?.motosSlide2Title2 || 'silenciosa.',
      subtitle: diseno?.motosSlide2Subtitle || 'Torque instantáneo y diseño agresivo para la ciudad y la ruta.',
      button: diseno?.motosSlide2Button || 'Ver deportivas',
      onlyImage: Boolean(diseno?.motosSlide2OnlyImage),
      actionKey: 'motosSlide2Action',
    },
    {
      image: diseno?.motosSlide3Image || '',
      eyebrow: diseno?.motosSlide3Eyebrow || 'Promoción',
      title: diseno?.motosSlide3Title || 'Hasta 20% OFF',
      title2: diseno?.motosSlide3Title2 || 'y accesorios de regalo.',
      subtitle: diseno?.motosSlide3Subtitle || 'Descuentos exclusivos en modelos seleccionados. Financiamiento disponible.',
      button: diseno?.motosSlide3Button || 'Ver ofertas',
      onlyImage: Boolean(diseno?.motosSlide3OnlyImage),
      actionKey: 'motosSlide3Action',
    },
  ];
  return raw.map((slide, i) => ({ ...slide, image: slide.image || HERO_SLIDE_FALLBACKS[i % HERO_SLIDE_FALLBACKS.length] }));
}

/* ── Banner grande del bento (slider con imagen dominante + textos superpuestos) ── */
function HeroSlider({ slides, slug, primary, diseno }: { slides: HeroSlide[]; slug: string; primary: string; diseno: any }) {
  const navigateRouter = useNavigate();
  const [index, setIndex] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % count), 6500);
    return () => clearInterval(timer);
  }, [count]);

  const goAction = (key: string) => {
    runStoreLinkAction(getStoreLinkAction(diseno, key, { defaultType: 'catalog' }), { slug, navigate: navigateRouter });
  };
  const slide = slides[index];

  return (
    <div className="relative h-[360px] overflow-hidden rounded-3xl md:h-[520px]" style={{ backgroundColor: MOTO.night }}>
      <AnimatePresence mode="wait">
        <motion.button
          key={index}
          type="button"
          onClick={() => goAction(slide.actionKey)}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: motoEase }}
          className="group absolute inset-0 block h-full w-full cursor-pointer text-left"
          aria-label={slide.title || 'Ver más'}
        >
          <img src={slide.image} alt={slide.eyebrow || 'Banner'} className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.05]" />
          {!slide.onlyImage && (
            <>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(8,9,12,0.86) 0%, rgba(8,9,12,0.45) 45%, rgba(8,9,12,0.05) 75%)' }} />
              <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-12">
                {slide.eyebrow && (
                  <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white" style={{ backgroundColor: withAlpha(primary, 'cc') }}>
                    {slide.eyebrow}
                  </span>
                )}
                <h1 className="max-w-lg text-4xl font-extrabold uppercase leading-[0.95] tracking-[-0.01em] text-white md:text-6xl" style={{ fontFamily: MOTO.display }}>
                  {slide.title}
                  {slide.title2 && <span className="mt-1 block" style={{ color: primary }}>{slide.title2}</span>}
                </h1>
                {slide.subtitle && <p className="mt-4 max-w-md text-sm text-white/80 md:text-base">{slide.subtitle}</p>}
                {slide.button && (
                  <span className="mt-7 inline-flex w-fit items-center gap-2 rounded-lg px-7 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-lg transition-transform group-hover:-translate-y-0.5" style={{ backgroundColor: primary }}>
                    {slide.button} <Icon icon="solar:arrow-right-linear" width={16} />
                  </span>
                )}
              </div>
            </>
          )}
        </motion.button>
      </AnimatePresence>

      {count > 1 && (
        <div className="absolute bottom-6 left-8 z-10 flex items-center gap-2 md:left-12">
          {slides.map((_, i) => (
            <button key={i} type="button" onClick={(e) => { e.stopPropagation(); setIndex(i); }} aria-label={`Ir al slide ${i + 1}`} className="h-2.5 rounded-full transition-all" style={{ width: i === index ? 28 : 10, backgroundColor: i === index ? primary : 'rgba(255,255,255,0.5)' }} />
          ))}
        </div>
      )}
    </div>
  );
}

function Eyebrow({ children, color }: { children: ReactNode; color: string }) {
  return (
    <p className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color }}>
      <span className="h-px w-6" style={{ backgroundColor: color }} />
      {children}
    </p>
  );
}

export default function MotosHomePage({
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
  const primary = motoPrimary(cp);
  const font = motoFont(diseno);
  const featured = productos.slice(0, 8);
  const [searchValue, setSearchValue] = useState('');
  const brandsRef = useRef<HTMLDivElement>(null);

  const categoryCards = (allCategories || [])
    .map((cat: any) => (typeof cat === 'string' ? { nombre: cat } : cat))
    .filter((cat: any) => cat?.nombre)
    .slice(0, 3);

  const gearHref = `/tienda/${slug}/catalogo`;
  const catalogHref = `/tienda/${slug}/catalogo`;

  const scrollBrands = (dir: number) => brandsRef.current?.scrollBy({ left: dir * 260, behavior: 'smooth' });

  return (
    <motion.div initial="hidden" animate="show" variants={motoPage} className="min-h-screen" style={{ backgroundColor: MOTO.page, fontFamily: font }}>
      <MotoHeader
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

      <main className="mx-auto max-w-7xl px-6">
        {/* ── Hero bento: banner grande + tarjeta equipamiento ─────────────── */}
        <motion.section variants={motoSection} className="grid gap-4 pt-6 md:pt-8 lg:grid-cols-[1.9fr_1fr]">
          <HeroSlider slides={buildHeroSlides(diseno)} slug={slug} primary={primary} diseno={diseno} />
          <a href={gearHref} className="group relative hidden h-[520px] overflow-hidden rounded-3xl lg:block" style={{ backgroundColor: MOTO.night }}>
            <img src={diseno?.motosGearImage || GEAR_FALLBACK} alt="Equipamiento" className="h-full w-full object-cover opacity-90 transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(8,9,12,0.1) 40%, rgba(8,9,12,0.92) 100%)' }} />
            <div className="absolute inset-x-0 bottom-0 p-7">
              <h2 className="text-2xl font-extrabold uppercase tracking-[0.02em] text-white" style={{ fontFamily: MOTO.display }}>{diseno?.motosGearTitle || 'Motoequipo'}</h2>
              <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: withAlpha(primary, 'ee') }}>
                Ver equipamiento <Icon icon="solar:arrow-right-up-linear" width={14} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </a>
        </motion.section>

        {/* ── Tira de categorías (bento horizontal) ────────────────────────── */}
        <motion.section variants={motoSection} initial="hidden" whileInView="show" viewport={motoViewport} className="mt-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {/* Ofertas */}
            <a href={catalogHref} className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl" style={{ backgroundColor: MOTO.night }}>
              <img src={diseno?.motosSaleImage || SALE_FALLBACK} alt="Ofertas" className="absolute inset-0 h-full w-full object-cover opacity-55 transition-transform duration-[900ms] group-hover:scale-[1.08]" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(8,9,12,0.2), rgba(8,9,12,0.85))' }} />
              <span className="absolute left-4 top-4 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white" style={{ backgroundColor: MOTO.sale }}>Sale</span>
              <h3 className="relative z-10 p-4 text-lg font-extrabold uppercase tracking-[0.02em] text-white" style={{ fontFamily: MOTO.display }}>{diseno?.motosSaleTitle || 'Ofertas'}</h3>
            </a>
            {/* Preventa */}
            <a href={catalogHref} className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl" style={{ backgroundColor: MOTO.nightSoft }}>
              <img src={diseno?.motosPreorderImage || PREORDER_FALLBACK} alt="Preventa" className="absolute inset-0 h-full w-full object-cover opacity-55 transition-transform duration-[900ms] group-hover:scale-[1.08]" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(8,9,12,0.2), rgba(8,9,12,0.85))' }} />
              <span className="absolute left-4 top-4 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white" style={{ backgroundColor: primary }}>New</span>
              <h3 className="relative z-10 p-4 text-lg font-extrabold uppercase tracking-[0.02em] text-white" style={{ fontFamily: MOTO.display }}>{diseno?.motosPreorderTitle || 'Preventa'}</h3>
            </a>
            {/* Categorías reales (tiles oscuros como Ofertas/Preventa) o fallback */}
            {(categoryCards.length ? categoryCards : [{ nombre: 'Deportivas' }, { nombre: 'Urbanas' }]).slice(0, 2).map((cat: any, i: number) => (
              <a key={cat.nombre} href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(cat.nombre)}`} className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl" style={{ backgroundColor: MOTO.night }}>
                <img src={cat.imagenUrl || cat.imagen || CATEGORY_FALLBACKS[i % CATEGORY_FALLBACKS.length]} alt={cat.nombre} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-[900ms] group-hover:scale-[1.08]" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(8,9,12,0.15), rgba(8,9,12,0.85))' }} />
                <div className="relative z-10 flex items-center justify-between p-4">
                  <h3 className="text-lg font-extrabold uppercase tracking-[0.02em] text-white" style={{ fontFamily: MOTO.display }}>{cat.nombre}</h3>
                  <Icon icon="solar:arrow-right-up-linear" width={18} className="text-white/80 transition-transform group-hover:translate-x-0.5" />
                </div>
              </a>
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <a href={catalogHref} className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-sm transition-transform hover:-translate-y-0.5" style={{ backgroundColor: primary }}>
              Todo el catálogo <Icon icon="solar:play-bold" width={13} />
            </a>
          </div>
        </motion.section>

        {/* ── Buscador ancho ───────────────────────────────────────────────── */}
        <motion.section variants={motoSection} initial="hidden" whileInView="show" viewport={motoViewport} className="mt-10">
          <form
            onSubmit={(e) => { e.preventDefault(); navigate(`/tienda/${slug}/catalogo${searchValue.trim() ? `?search=${encodeURIComponent(searchValue.trim())}` : ''}`); }}
            className="flex items-center gap-2 rounded-2xl border bg-white p-2 shadow-[0_1px_2px_rgba(15,18,26,0.04)]"
            style={{ borderColor: MOTO.line }}
          >
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={diseno?.motosSearchPlaceholder || 'Quiero encontrar...'}
              className="h-12 flex-1 border-0 bg-transparent px-4 text-base outline-none focus:ring-0"
              style={{ color: MOTO.ink }}
            />
            <button type="submit" className="flex h-12 shrink-0 items-center gap-2 rounded-xl px-7 text-sm font-bold uppercase tracking-[0.08em] text-white" style={{ backgroundColor: primary }}>
              Buscar <Icon icon="solar:magnifer-linear" width={18} />
            </button>
          </form>
        </motion.section>

        {/* ── Servicios (tarjetas oscuras) ─────────────────────────────────── */}
        <motion.section variants={motoSection} initial="hidden" whileInView="show" viewport={motoViewport} className="mt-12 md:mt-16">
          <motion.div variants={motoStagger} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {SERVICES_DEFAULT.map((s, i) => (
              <motion.a
                key={s.title}
                variants={motoCard}
                whileHover={{ y: -6 }}
                href={catalogHref}
                className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl"
                style={{ backgroundColor: MOTO.night }}
              >
                <img src={SERVICE_FALLBACKS[i % SERVICE_FALLBACKS.length]} alt={s.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-65 transition-all duration-[900ms] ease-out group-hover:scale-[1.08] group-hover:opacity-85" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(8,9,12,0.15) 25%, rgba(8,9,12,0.95) 100%)' }} />
                <div className="relative z-10 p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ backgroundColor: withAlpha(primary, 'e6'), color: '#fff' }}>
                    <Icon icon={s.icon} width={22} />
                  </span>
                  <h3 className="mt-4 text-lg font-extrabold uppercase tracking-[0.02em] text-white" style={{ fontFamily: MOTO.display }}>{s.title}</h3>
                  <p className="mt-1 text-xs text-white/70">{s.text}</p>
                </div>
              </motion.a>
            ))}
          </motion.div>
        </motion.section>

        {/* ── Marcas (carrusel) ────────────────────────────────────────────── */}
        <motion.section variants={motoSection} initial="hidden" whileInView="show" viewport={motoViewport} className="mt-12 md:mt-16">
          <div className="rounded-2xl border bg-white p-4 shadow-[0_1px_2px_rgba(15,18,26,0.04)]" style={{ borderColor: MOTO.line }}>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => scrollBrands(-1)} aria-label="Anterior" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-black/[0.03]" style={{ borderColor: MOTO.line, color: MOTO.ink }}>
                <Icon icon="solar:alt-arrow-left-linear" width={20} />
              </button>
              <div ref={brandsRef} className="flex flex-1 items-center gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {BRANDS_DEFAULT.map((brand) => (
                  <a key={brand} href={catalogHref} className="flex h-16 shrink-0 items-center justify-center rounded-xl px-8 text-lg font-extrabold uppercase tracking-[0.08em] transition-colors" style={{ backgroundColor: MOTO.soft, color: MOTO.faint, fontFamily: MOTO.display, minWidth: 180 }} onMouseEnter={(e) => (e.currentTarget.style.color = MOTO.ink)} onMouseLeave={(e) => (e.currentTarget.style.color = MOTO.faint)}>{brand}</a>
                ))}
              </div>
              <button type="button" onClick={() => scrollBrands(1)} aria-label="Siguiente" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-black/[0.03]" style={{ borderColor: MOTO.line, color: MOTO.ink }}>
                <Icon icon="solar:alt-arrow-right-linear" width={20} />
              </button>
            </div>
          </div>
        </motion.section>

        {/* ── Más vendidos ─────────────────────────────────────────────────── */}
        <motion.section variants={motoSection} initial="hidden" whileInView="show" viewport={motoViewport} className="mt-14 md:mt-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow color={primary}>Top ventas</Eyebrow>
              <h2 className="mt-3 text-3xl font-extrabold uppercase tracking-[-0.01em] md:text-4xl" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>{diseno?.motosBestsellersTitle || 'Los más vendidos'}</h2>
            </div>
            <a href={catalogHref} className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] hover:opacity-70" style={{ color: primary }}>
              Ver todo <Icon icon="solar:arrow-right-linear" width={15} />
            </a>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-black/[0.05]" />)}
            </div>
          ) : featured.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-20 text-center" style={{ borderColor: MOTO.line, color: MOTO.faint }}>Aún no hay productos publicados.</div>
          ) : (
            <motion.div variants={motoStagger} className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
              {featured.map((producto) => (
                <MotoProductCard key={producto.id} producto={producto} slug={slug} cp={primary} onAddToCart={agregarAlCarrito} onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)} />
              ))}
            </motion.div>
          )}
        </motion.section>

        {/* ── Service/taller + financiamiento (banners oscuros) ────────────── */}
        <motion.section variants={motoSection} initial="hidden" whileInView="show" viewport={motoViewport} className="mt-14 md:mt-20">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="relative flex min-h-[300px] items-center overflow-hidden rounded-3xl" style={{ backgroundColor: MOTO.night }}>
              <img src={diseno?.motosPromoImage || PROMO_FALLBACK} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(120deg, rgba(8,9,12,0.95) 40%, rgba(8,9,12,0.55) 100%)' }} />
              <div className="relative z-10 w-full p-8">
                <Eyebrow color={primary}>{diseno?.motosServiceLabel || 'Taller propio'}</Eyebrow>
                <h3 className="mt-3 text-3xl font-extrabold uppercase leading-tight text-white" style={{ fontFamily: MOTO.display }}>{diseno?.motosServiceTitle || 'Agenda tu service'}</h3>
                <p className="mt-2 max-w-sm text-sm text-white/70">{diseno?.motosServiceSubtitle || 'Mantenimiento, diagnóstico y repuestos originales con técnicos especializados.'}</p>
                <a href={waLink(tienda, 'Hola, quiero agendar un service para mi moto')} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-lg px-6 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-white transition-transform hover:-translate-y-0.5" style={{ backgroundColor: primary }}>
                  <Icon icon="mdi:whatsapp" width={17} /> {diseno?.motosServiceButton || 'Reservar cita'}
                </a>
              </div>
            </div>
            <div className="relative flex min-h-[300px] items-center overflow-hidden rounded-3xl" style={{ background: `linear-gradient(135deg, ${primary}, ${MOTO.blueDark})` }}>
              <Icon icon="mdi:motorbike-electric" className="absolute -bottom-8 -right-6 text-[13rem]" style={{ color: 'rgba(255,255,255,0.12)' }} />
              <div className="relative z-10 p-8">
                <Eyebrow color="rgba(255,255,255,0.85)">{diseno?.motosClubLabel || 'Financiamiento'}</Eyebrow>
                <h3 className="mt-3 text-3xl font-extrabold uppercase leading-tight text-white" style={{ fontFamily: MOTO.display }}>{diseno?.motosClubTitle || 'Llévatela hoy, paga en cuotas'}</h3>
                <p className="mt-2 max-w-sm text-sm text-white/85">{diseno?.motosClubSubtitle || 'Aprobación rápida y planes flexibles. Estrena tu moto sin descapitalizarte.'}</p>
                <a href={`/tienda/${slug}/contacto`} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-[11px] font-bold uppercase tracking-[0.14em] transition-transform hover:-translate-y-0.5" style={{ color: MOTO.ink }}>
                  {diseno?.motosClubButton || 'Simular mi cuota'} <Icon icon="solar:arrow-right-linear" width={15} />
                </a>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Newsletter ───────────────────────────────────────────────────── */}
        <motion.section variants={motoSection} initial="hidden" whileInView="show" viewport={motoViewport} className="my-14 md:my-20">
          <div className="flex flex-col items-center gap-6 rounded-3xl border bg-white p-10 text-center shadow-[0_1px_2px_rgba(15,18,26,0.04)] md:flex-row md:justify-between md:text-left" style={{ borderColor: MOTO.line }}>
            <div>
              <h2 className="text-2xl font-extrabold uppercase tracking-[0.02em]" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>{diseno?.motosNewsletterTitle || 'Únete a la comunidad'}</h2>
              <p className="mt-2 text-sm" style={{ color: MOTO.muted }}>{diseno?.motosNewsletterSubtitle || 'Novedades, lanzamientos y ofertas antes que nadie.'}</p>
            </div>
            <form onSubmit={(e) => e.preventDefault()} className="flex w-full max-w-md items-center gap-2 rounded-lg border p-1.5" style={{ borderColor: MOTO.line, backgroundColor: MOTO.soft }}>
              <input type="email" placeholder="Tu correo electrónico" className="h-11 flex-1 border-0 bg-transparent px-4 text-sm outline-none focus:ring-0" style={{ color: MOTO.ink }} />
              <button type="submit" className="h-11 shrink-0 rounded-lg px-6 text-[11px] font-bold uppercase tracking-[0.12em] text-white" style={{ backgroundColor: primary }}>{diseno?.motosNewsletterButton || 'Suscribirme'}</button>
            </form>
          </div>
        </motion.section>
      </main>

      <MotoFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <MotoWhatsAppFab tienda={tienda} />

      <MotoCartModal
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
