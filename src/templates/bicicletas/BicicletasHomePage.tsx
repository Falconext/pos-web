import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { VELO, VeloCartModal, VeloFooter, VeloHeader, VeloProductCard, VeloWhatsAppFab, veloFont, veloPrimary } from './BicicletasParts';
import { veloCard, veloEase, veloPage, veloSection, veloStagger, veloViewport } from './motion';

const navigate = (to: string) => { window.location.href = to; };

const HERO_SLIDE_FALLBACKS = [
  'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&w=1400&q=80',
];
const COLLECTION_FALLBACKS = [
  'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1557687790-902ede7ab58c?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=700&q=80',
];

const TRUST = [
  { icon: 'solar:delivery-linear', title: 'Envío gratis', text: 'En compras desde S/ 500' },
  { icon: 'mdi:wrench-outline', title: 'Armado incluido', text: 'Ajuste profesional de fábrica' },
  { icon: 'solar:shield-check-linear', title: 'Garantía real', text: 'Cobertura de cuadro y partes' },
  { icon: 'solar:headphones-round-linear', title: 'Soporte experto', text: 'Ciclistas listos para ayudarte' },
];

function catName(p: any) {
  const c = p?.categoria;
  return (typeof c === 'object' ? c?.nombre : c) || '';
}

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

/** Construye los slides del hero desde `diseno` (todo editable en el editor en vivo). */
function buildHeroSlides(diseno: any): HeroSlide[] {
  const raw: HeroSlide[] = [
    {
      image: diseno?.bicicletasHeroImage || '',
      eyebrow: diseno?.bicicletasHeroEyebrow || 'Serie Trek',
      title: diseno?.bicicletasHeroTitle || 'Vonica Trek',
      title2: diseno?.bicicletasHeroTitle2 || 'Series Bike',
      subtitle: diseno?.bicicletasHeroSubtitle || '',
      button: diseno?.bicicletasHeroButton || 'Ver colección',
      onlyImage: Boolean(diseno?.bicicletasHeroOnlyImage),
      actionKey: 'bicicletasHeroAction',
    },
    {
      image: diseno?.bicicletasSlide2Image || '',
      eyebrow: diseno?.bicicletasSlide2Eyebrow || 'Mountain Bikes',
      title: diseno?.bicicletasSlide2Title || 'Terreno',
      title2: diseno?.bicicletasSlide2Title2 || 'Extremo',
      subtitle: diseno?.bicicletasSlide2Subtitle || '',
      button: diseno?.bicicletasSlide2Button || 'Ver mountain bikes',
      onlyImage: Boolean(diseno?.bicicletasSlide2OnlyImage),
      actionKey: 'bicicletasSlide2Action',
    },
    {
      image: diseno?.bicicletasSlide3Image || '',
      eyebrow: diseno?.bicicletasSlide3Eyebrow || 'Temporada',
      title: diseno?.bicicletasSlide3Title || 'Hasta 33%',
      title2: diseno?.bicicletasSlide3Title2 || 'De descuento',
      subtitle: diseno?.bicicletasSlide3Subtitle || '',
      button: diseno?.bicicletasSlide3Button || 'Ver ofertas',
      onlyImage: Boolean(diseno?.bicicletasSlide3OnlyImage),
      actionKey: 'bicicletasSlide3Action',
    },
  ];
  return raw.map((slide, i) => ({ ...slide, image: slide.image || HERO_SLIDE_FALLBACKS[i % HERO_SLIDE_FALLBACKS.length] }));
}

/* ───────────────────────────────── Hero slider ──────────────────────────── */

function HeroSlider({ slides, slug, primary, diseno, storeName }: { slides: HeroSlide[]; slug: string; primary: string; diseno: any; storeName: string }) {
  const navigateRouter = useNavigate();
  const [index, setIndex] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % count), 6000);
    return () => clearInterval(timer);
  }, [count]);

  const goAction = (key: string) => runStoreLinkAction(getStoreLinkAction(diseno, key, { defaultType: 'catalog' }), { slug, navigate: navigateRouter });
  const slide = slides[index];
  const prev = slides[(index - 1 + count) % count];
  const next = slides[(index + 1) % count];

  return (
    <section className="relative isolate overflow-hidden bg-white">
      {/* Marca de agua */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <span className="select-none whitespace-nowrap text-[24vw] font-bold uppercase leading-none tracking-tight text-neutral-900/[0.035]" style={{ fontFamily: VELO.display }}>{storeName}</span>
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
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
                transition={{ duration: 0.5, ease: veloEase }}
                className="group relative block h-64 w-full cursor-pointer overflow-hidden rounded-2xl md:h-[520px]"
                aria-label={slide.eyebrow || 'Ver más'}
              >
                <img src={slide.image} alt={slide.eyebrow || 'Banner'} className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]" />
              </motion.button>
            </AnimatePresence>
          </div>
        ) : (
          <div className="relative flex min-h-[460px] items-center py-10 md:min-h-[600px]">
            {/* Imágenes vecinas asomando */}
            <img src={prev.image} alt="" aria-hidden className="pointer-events-none absolute left-[-9%] top-1/2 hidden w-[20%] -translate-y-1/2 object-contain opacity-40 lg:block" />
            <img src={next.image} alt="" aria-hidden className="pointer-events-none absolute right-[-9%] top-1/2 hidden w-[20%] -translate-y-1/2 object-contain opacity-40 lg:block" />

            {/* Imagen principal centrada */}
            <div className="relative mx-auto w-full">
              <AnimatePresence mode="wait">
                <motion.img
                  key={`img-${index}`}
                  src={slide.image}
                  alt={slide.eyebrow || 'Bicicleta'}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: veloEase }}
                  className="mx-auto h-[280px] w-auto max-w-full object-contain md:h-[500px]"
                />
              </AnimatePresence>

              {/* Titular superpuesto a la izquierda */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`content-${index}`}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, ease: veloEase }}
                  className="absolute left-0 top-1/2 max-w-[62%] -translate-y-1/2 sm:max-w-sm"
                >
                  {slide.eyebrow && <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: primary }}>{slide.eyebrow}</p>}
                  <h1 className="text-4xl font-bold uppercase leading-[0.92] tracking-tight md:text-6xl" style={{ fontFamily: VELO.display, color: VELO.ink }}>
                    {slide.title}
                    {slide.title2 && <span className="block">{slide.title2}</span>}
                  </h1>
                  {slide.subtitle && <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-500">{slide.subtitle}</p>}
                  <button
                    type="button"
                    onClick={() => goAction(slide.actionKey)}
                    className="group mt-6 inline-flex items-center gap-2 border-b-2 pb-1 text-[12px] font-bold uppercase tracking-[0.2em]"
                    style={{ color: VELO.ink, borderColor: VELO.ink }}
                  >
                    {slide.button}
                    <Icon icon="solar:arrow-right-linear" width={15} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}

        {count > 1 && (
          <div className="flex items-center justify-center gap-2.5 pb-8">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ir al slide ${i + 1}`}
                className="h-2.5 rounded-full transition-all"
                style={{ width: i === index ? 26 : 10, backgroundColor: i === index ? primary : 'rgba(14,14,18,0.18)' }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────────── Banda de 3 tarjetas de colección ────────────────────── */

function CollectionCards({ slug, diseno }: { slug: string; diseno: any }) {
  const navigateRouter = useNavigate();
  const cards = [
    {
      image: diseno?.bicicletasCollection1Image || COLLECTION_FALLBACKS[0],
      title: diseno?.bicicletasCollection1Title || '25% OFF en bicicletas de montaña',
      button: diseno?.bicicletasCollection1Button || 'Ver colección',
      actionKey: 'bicicletasCollection1Action',
    },
    {
      image: diseno?.bicicletasCollection2Image || COLLECTION_FALLBACKS[1],
      title: diseno?.bicicletasCollection2Title || 'Ofertas en accesorios',
      button: diseno?.bicicletasCollection2Button || 'Ver colección',
      actionKey: 'bicicletasCollection2Action',
    },
    {
      image: diseno?.bicicletasCollection3Image || COLLECTION_FALLBACKS[2],
      title: diseno?.bicicletasCollection3Title || 'Colección clásica de ruta',
      button: diseno?.bicicletasCollection3Button || 'Ver colección',
      actionKey: 'bicicletasCollection3Action',
    },
  ];
  const goAction = (key: string) => runStoreLinkAction(getStoreLinkAction(diseno, key, { defaultType: 'catalog' }), { slug, navigate: navigateRouter });

  return (
    <motion.section variants={veloStagger} initial="hidden" whileInView="show" viewport={veloViewport} className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <div className="grid gap-5 md:grid-cols-3">
        {cards.map((card) => (
          <motion.div
            key={card.actionKey}
            variants={veloCard}
            className="group relative flex items-center overflow-hidden rounded-lg pl-7"
            style={{ backgroundColor: VELO.mist }}
          >
            <div className="relative z-10 max-w-[55%] py-8">
              <h3 className="text-xl font-bold uppercase leading-tight" style={{ fontFamily: VELO.display, color: VELO.ink }}>{card.title}</h3>
              <button
                type="button"
                onClick={() => goAction(card.actionKey)}
                className="mt-4 inline-flex items-center bg-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] shadow-sm ring-1 ring-black/5 transition-transform hover:-translate-y-0.5"
                style={{ color: VELO.ink }}
              >
                {card.button}
              </button>
            </div>
            <img src={card.image} alt={card.title} loading="lazy" className="absolute right-0 top-1/2 h-[85%] w-[46%] -translate-y-1/2 object-contain transition-transform duration-500 group-hover:scale-105" />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

/* ─────────────────────────────── Top categorías ──────────────────────────── */

function TopCategories({
  slug,
  primary,
  diseno,
  productos,
  allCategories,
  loading,
  onAddToCart,
}: {
  slug: string;
  primary: string;
  diseno: any;
  productos: any[];
  allCategories: any[];
  loading: boolean;
  onAddToCart: (p: any) => void;
}) {
  const tabs = useMemo(() => (allCategories || [])
    .map((c: any) => (typeof c === 'string' ? c : c?.nombre))
    .filter(Boolean)
    .slice(0, 4) as string[], [allCategories]);
  const [active, setActive] = useState<string>('');
  const current = active || tabs[0] || '';

  const filtered = useMemo(() => {
    if (!current) return productos.slice(0, 8);
    const byCat = productos.filter((p) => catName(p).toLowerCase() === current.toLowerCase());
    return (byCat.length ? byCat : productos).slice(0, 8);
  }, [productos, current]);

  return (
    <motion.section variants={veloSection} initial="hidden" whileInView="show" viewport={veloViewport} className="mx-auto max-w-7xl px-6 py-10 md:py-14">
      <div className="text-center">
        <h2 className="text-3xl font-bold uppercase tracking-[0.04em] md:text-4xl" style={{ fontFamily: VELO.display, color: VELO.ink }}>{diseno?.bicicletasCategoriesTitle || 'Top categorías'}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">{diseno?.bicicletasCategoriesSubtitle || 'Encuentra la bicicleta ideal para tu ritmo y ve a donde quieras.'}</p>
      </div>

      {tabs.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {tabs.map((tab) => {
            const isActive = current.toLowerCase() === tab.toLowerCase();
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActive(tab)}
                className="relative px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] transition-colors"
                style={isActive ? { backgroundColor: primary, color: '#fff' } : { backgroundColor: VELO.mist, color: VELO.steel }}
              >
                {tab}
                {isActive && <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent" style={{ borderTopColor: primary }} />}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-black/[0.04]" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed py-20 text-center text-neutral-400" style={{ borderColor: VELO.line }}>Aún no hay productos publicados.</div>
      ) : (
        <motion.div variants={veloStagger} className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {filtered.map((producto) => (
            <VeloProductCard key={producto.id} producto={producto} slug={slug} cp={primary} onAddToCart={onAddToCart} onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)} />
          ))}
        </motion.div>
      )}

      <div className="mt-10 text-center">
        <a href={`/tienda/${slug}/catalogo`} className="inline-flex items-center gap-2 px-8 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-lg" style={{ backgroundColor: primary }}>
          Ver toda la tienda <Icon icon="solar:arrow-right-linear" width={16} />
        </a>
      </div>
    </motion.section>
  );
}

function TrustStrip({ items }: { items: { icon: string; title: string; text: string }[] }) {
  return (
    <section className="border-y bg-white" style={{ borderColor: VELO.line }}>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-8 md:grid-cols-4">
        {items.map((t) => (
          <div key={t.title} className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: VELO.mist }}>
              <Icon icon={t.icon} width={24} style={{ color: VELO.ink }} />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.04em]" style={{ color: VELO.ink }}>{t.title}</p>
              <p className="text-xs text-neutral-500">{t.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function BicicletasHomePage({
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
  const primary = veloPrimary(cp);
  const font = veloFont(diseno);
  const brand = diseno?.bicicletasLogoText || tienda?.nombreComercial || tienda?.razonSocial || tienda?.nombre || 'Vonica';

  return (
    <motion.div initial="hidden" animate="show" variants={veloPage} className="min-h-screen" style={{ backgroundColor: '#fff', fontFamily: font }}>
      <VeloHeader
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
        <HeroSlider slides={buildHeroSlides(diseno)} slug={slug} primary={primary} diseno={diseno} storeName={brand} />
        <CollectionCards slug={slug} diseno={diseno} />
        <TopCategories
          slug={slug}
          primary={primary}
          diseno={diseno}
          productos={productos}
          allCategories={allCategories}
          loading={loading}
          onAddToCart={agregarAlCarrito}
        />

        <TrustStrip items={TRUST} />

        {/* ── Newsletter ───────────────────────────────────────────────────── */}
        <section className="bg-white">
          <motion.div variants={veloSection} initial="hidden" whileInView="show" viewport={veloViewport} className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-14 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <h2 className="text-3xl font-bold uppercase tracking-[0.04em]" style={{ fontFamily: VELO.display, color: VELO.ink }}>{diseno?.bicicletasNewsletterTitle || 'Sube de nivel'}</h2>
              <p className="mt-2 text-sm text-neutral-500">{diseno?.bicicletasNewsletterSubtitle || 'Novedades, lanzamientos y ofertas exclusivas para ciclistas.'}</p>
            </div>
            <form onSubmit={(e) => e.preventDefault()} className="flex w-full max-w-md items-center gap-2 border p-1.5" style={{ borderColor: VELO.ink }}>
              <input type="email" placeholder="Tu correo electrónico" className="h-11 flex-1 border-0 bg-transparent px-4 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:ring-0" />
              <button type="submit" className="h-11 shrink-0 px-6 text-[11px] font-bold uppercase tracking-[0.16em] text-white" style={{ backgroundColor: primary }}>
                {diseno?.bicicletasNewsletterButton || 'Suscribirme'}
              </button>
            </form>
          </motion.div>
        </section>
      </main>

      <VeloFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <VeloWhatsAppFab tienda={tienda} />

      <VeloCartModal
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
