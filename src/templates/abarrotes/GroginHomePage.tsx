import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { GRO, GroCartModal, GroFooter, GroHeader, GroProductCard, GroWhatsAppFab, groFont, groPrimary, titleCase } from './GroginParts';
import { groCard, groEase, groPage, groSection, groStagger, groTap, groViewport } from './motion';

const navigate = (to: string) => { window.location.href = to; };

const HERO_FALLBACKS = [
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?auto=format&fit=crop&w=1600&q=80',
];
const CATEGORY_FALLBACKS = [
  'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1553530666-ba11a90bb0ae?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1584473457409-ae5c91d7d8b6?auto=format&fit=crop&w=400&q=80',
];
const PROMO_FALLBACKS = [
  'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1584680226833-0d680d0a0794?auto=format&fit=crop&w=700&q=80',
];
const CARD_FALLBACKS = [
  'https://images.unsplash.com/photo-1573246123716-6b1782bfc499?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&q=80',
];
const CATEGORY_TINTS = ['#E8F6EE', '#F3EFFB', '#FFF3E0', '#FDE9EF', '#E7F1FB', '#EFF7E8', '#FCF3E4', '#EAF6F5'];

/* ─────────────────────────────── Hero slider ─────────────────────────────── */

interface HeroSlide {
  image: string;
  eyebrow: string;
  title: string;
  title2: string;
  subtitle: string;
  price: string;
  button: string;
  onlyImage: boolean;
  actionKey: string;
}

function buildHeroSlides(diseno: any): HeroSlide[] {
  const raw: HeroSlide[] = [
    {
      image: diseno?.abarrotesHeroImage || '',
      eyebrow: diseno?.abarrotesHeroEyebrow || 'Descuentos de la semana',
      title: diseno?.abarrotesHeroTitle || 'Compra con nosotros',
      title2: diseno?.abarrotesHeroTitle2 || 'mejor calidad y precio',
      subtitle: diseno?.abarrotesHeroSubtitle || 'Preparamos descuentos especiales para ti en tus abarrotes. ¡No te pierdas estas oportunidades!',
      price: diseno?.abarrotesHeroPrice || 'Desde S/ 21.67',
      button: diseno?.abarrotesHeroButton || 'Comprar ahora',
      onlyImage: Boolean(diseno?.abarrotesHeroOnlyImage),
      actionKey: 'abarrotesHeroAction',
    },
    {
      image: diseno?.abarrotesSlide2Image || '',
      eyebrow: diseno?.abarrotesSlide2Eyebrow || 'Solo esta semana',
      title: diseno?.abarrotesSlide2Title || 'Frescos todos',
      title2: diseno?.abarrotesSlide2Title2 || 'los días',
      subtitle: diseno?.abarrotesSlide2Subtitle || 'Frutas, verduras y lácteos recién llegados directo a tu puerta.',
      price: diseno?.abarrotesSlide2Price || 'Hasta 30% OFF',
      button: diseno?.abarrotesSlide2Button || 'Ver ofertas',
      onlyImage: Boolean(diseno?.abarrotesSlide2OnlyImage),
      actionKey: 'abarrotesSlide2Action',
    },
    {
      image: diseno?.abarrotesSlide3Image || '',
      eyebrow: diseno?.abarrotesSlide3Eyebrow || 'Envío gratis',
      title: diseno?.abarrotesSlide3Title || 'Tu despensa llena,',
      title2: diseno?.abarrotesSlide3Title2 || 'sin salir de casa',
      subtitle: diseno?.abarrotesSlide3Subtitle || 'Haz tu pedido y recíbelo el mismo día. Rápido, fácil y seguro.',
      price: diseno?.abarrotesSlide3Price || 'Envío gratis desde S/ 80',
      button: diseno?.abarrotesSlide3Button || 'Comprar ahora',
      onlyImage: Boolean(diseno?.abarrotesSlide3OnlyImage),
      actionKey: 'abarrotesSlide3Action',
    },
  ];
  return raw.map((slide, i) => ({ ...slide, image: slide.image || HERO_FALLBACKS[i % HERO_FALLBACKS.length] }));
}

function HeroSlider({ slides, slug, primary, diseno }: { slides: HeroSlide[]; slug: string; primary: string; diseno: any }) {
  const navigateRouter = useNavigate();
  const [index, setIndex] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIndex((p) => (p + 1) % count), 6000);
    return () => clearInterval(t);
  }, [count]);

  const goAction = (key: string) => runStoreLinkAction(getStoreLinkAction(diseno, key, { defaultType: 'catalog' }), { slug, navigate: navigateRouter });
  const slide = slides[index];

  return (
    <section className="mx-auto max-w-7xl px-5 pt-5 md:px-6" aria-roledescription="carousel">
      <div className="relative overflow-hidden rounded-3xl" style={{ background: `linear-gradient(110deg, ${GRO.lavender} 0%, #FBF7FF 55%, #F1FBF5 100%)` }}>
        {slide.onlyImage ? (
          <AnimatePresence mode="wait">
            <motion.button
              key={`only-${index}`}
              type="button"
              onClick={() => goAction(slide.actionKey)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: groEase }}
              className="group block h-64 w-full overflow-hidden md:h-[420px]"
            >
              <img src={slide.image} alt={slide.eyebrow} className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.04]" />
            </motion.button>
          </AnimatePresence>
        ) : (
          <div className="relative h-[440px] overflow-hidden md:h-[520px]">
            <AnimatePresence mode="wait">
              <motion.img
                key={`img-${index}`}
                src={slide.image}
                alt={slide.eyebrow}
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: groEase }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(243,239,251,0.97) 0%, rgba(248,244,254,0.92) 32%, rgba(255,255,255,0.5) 56%, rgba(255,255,255,0.06) 80%, rgba(255,255,255,0) 100%)' }} />
            <div className="absolute inset-0 flex items-center">
              <AnimatePresence mode="wait">
                <motion.div key={`c-${index}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.5, ease: groEase }} className="max-w-lg px-7 md:px-14">
                  <span className="inline-block rounded-full bg-white px-3 py-1 text-[11px] font-bold shadow-sm" style={{ color: GRO.purple }}>{slide.eyebrow}</span>
                  <h1 className="mt-4 text-4xl font-bold leading-[1.05] md:text-[3.1rem]" style={{ fontFamily: GRO.display, color: GRO.ink }}>
                    {slide.title} {slide.title2 && <span style={{ color: primary }}>{slide.title2}</span>}
                  </h1>
                  {slide.subtitle && <p className="mt-4 max-w-md text-sm leading-relaxed md:text-[15px]" style={{ color: GRO.inkSoft }}>{slide.subtitle}</p>}
                  <div className="mt-7 flex flex-wrap items-center gap-4">
                    <motion.button type="button" onClick={() => goAction(slide.actionKey)} whileHover={{ scale: 1.03, y: -2 }} whileTap={groTap} className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white shadow-lg" style={{ backgroundColor: primary }}>
                      {slide.button} <Icon icon="solar:arrow-right-linear" width={17} />
                    </motion.button>
                    {slide.price && <span className="text-sm font-bold" style={{ color: GRO.pink }}>{slide.price}</span>}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}

        {count > 1 && (
          <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2">
            {slides.map((_, i) => (
              <button key={i} type="button" onClick={() => setIndex(i)} aria-label={`Slide ${i + 1}`} className="h-2 rounded-full transition-all" style={{ width: i === index ? 26 : 8, backgroundColor: i === index ? primary : 'rgba(37,61,78,0.2)' }} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────── Sección título ──────────────────────────── */

function SectionHead({ title, sub, slug }: { title: string; sub?: string; slug?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="text-2xl font-bold md:text-[26px]" style={{ fontFamily: GRO.display, color: GRO.ink }}>{title}</h2>
        {sub && <p className="mt-1 text-sm" style={{ color: GRO.inkSoft }}>{sub}</p>}
      </div>
      {slug && (
        <a href={`/tienda/${slug}/catalogo`} className="inline-flex items-center gap-1 text-[13px] font-bold" style={{ color: GRO.green }}>
          Ver todo <Icon icon="solar:arrow-right-linear" width={14} />
        </a>
      )}
    </div>
  );
}

/* ─────────────────────────────────── Página ─────────────────────────────── */

export default function GroginHomePage({
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
  const primary = groPrimary(cp);
  const font = groFont(diseno);
  const editorsPick = productos.slice(0, 10);
  const categoryProducts = productos.slice(10, 16).length >= 3 ? productos.slice(10, 16) : productos.slice(0, 6);
  const bestSellers = productos.slice(0, 8);

  const categoryCards = (allCategories || [])
    .map((cat: any) => (typeof cat === 'string' ? { nombre: cat } : cat))
    .filter((cat: any) => cat?.nombre)
    .slice(0, 8);

  const renderRow = (items: any[], key: string) => (
    <motion.div variants={groStagger} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((p, i) => (
        <GroProductCard key={`${key}-${p.id ?? i}`} producto={p} slug={slug} cp={primary} onAddToCart={agregarAlCarrito} onClick={() => navigate(`/tienda/${slug}/producto/${p.id}`)} />
      ))}
    </motion.div>
  );

  const PROMOS = [
    { img: diseno?.abarrotesPromoOneImage || PROMO_FALLBACKS[0], eyebrow: diseno?.abarrotesPromoOneLabel || 'Solo por hoy', title: diseno?.abarrotesPromoOneTitle || 'Haz tu compra fácil con nosotros', button: diseno?.abarrotesPromoOneButton || 'Comprar ahora', key: 'abarrotesPromoOneAction' },
    { img: diseno?.abarrotesPromoTwoImage || PROMO_FALLBACKS[1], eyebrow: diseno?.abarrotesPromoTwoLabel || 'Esta semana', title: diseno?.abarrotesPromoTwoTitle || 'Todo lo que tu hogar necesita', button: diseno?.abarrotesPromoTwoButton || 'Comprar ahora', key: 'abarrotesPromoTwoAction' },
  ];
  const CARDS = [
    { img: diseno?.abarrotesCardOneImage || CARD_FALLBACKS[0], eyebrow: diseno?.abarrotesCardOneLabel || 'Solo por hoy', title: diseno?.abarrotesCardOneTitle || 'Te damos los productos de mejor calidad', button: diseno?.abarrotesCardOneButton || 'Comprar ahora' },
    { img: diseno?.abarrotesCardTwoImage || CARD_FALLBACKS[1], eyebrow: diseno?.abarrotesCardTwoLabel || 'Esta semana', title: diseno?.abarrotesCardTwoTitle || 'Hacemos tu compra más entretenida', button: diseno?.abarrotesCardTwoButton || 'Comprar ahora' },
    { img: diseno?.abarrotesCardThreeImage || CARD_FALLBACKS[2], eyebrow: diseno?.abarrotesCardThreeLabel || 'Solo por hoy', title: diseno?.abarrotesCardThreeTitle || 'El supermercado que te hace ahorrar', button: diseno?.abarrotesCardThreeButton || 'Comprar ahora' },
  ];

  return (
    <motion.div initial="hidden" animate="show" variants={groPage} className="min-h-screen" style={{ backgroundColor: GRO.cream, fontFamily: font }}>
      <GroHeader
        tienda={tienda}
        slug={slug}
        cp={primary}
        diseno={diseno}
        carritoSize={carrito.reduce((s, i) => s + Number(i.cantidad || 1), 0)}
        onOpenCart={() => setMostrarCarrito(true)}
        allCategories={allCategories}
        onSearchSubmit={(event, value) => { event.preventDefault(); navigate(`/tienda/${slug}/catalogo${value ? `?search=${encodeURIComponent(value)}` : ''}`); }}
      />

      <main>
        {/* Hero */}
        <HeroSlider slides={buildHeroSlides(diseno)} slug={slug} primary={primary} diseno={diseno} />

        {/* Círculos de categorías */}
        {categoryCards.length > 0 && (
          <motion.section variants={groSection} initial="hidden" whileInView="show" viewport={groViewport} className="mx-auto max-w-7xl px-5 py-10 md:px-6">
            <motion.div variants={groStagger} className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-8">
              {categoryCards.map((cat: any, i: number) => (
                <motion.a key={cat.nombre} variants={groCard} whileHover={{ y: -4 }} href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(cat.nombre)}`} className="group flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-colors hover:border-[var(--gro-cp)]" style={{ borderColor: GRO.line, ['--gro-cp' as any]: primary }}>
                  <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-full" style={{ backgroundColor: CATEGORY_TINTS[i % CATEGORY_TINTS.length] }}>
                    <img src={cat.imagenUrl || cat.imagen || CATEGORY_FALLBACKS[i % CATEGORY_FALLBACKS.length]} alt={cat.nombre} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  </span>
                  <span className="line-clamp-2 text-[11.5px] font-bold leading-tight" style={{ fontFamily: GRO.display, color: GRO.ink }}>{titleCase(cat.nombre)}</span>
                </motion.a>
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* Editor's Pick */}
        <motion.section variants={groSection} initial="hidden" whileInView="show" viewport={groViewport} className="mx-auto max-w-7xl px-5 pb-4 md:px-6">
          <SectionHead title={diseno?.abarrotesEditorsTitle || 'Selección destacada'} sub="Los productos con las mejores reseñas" slug={slug} />
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-black/[0.04]" />)}
            </div>
          ) : editorsPick.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-16 text-center text-neutral-400" style={{ borderColor: GRO.line }}>Aún no hay productos publicados.</div>
          ) : renderRow(editorsPick, 'editors')}
        </motion.section>

        {/* Category Products: banners promo + fila */}
        <motion.section variants={groSection} initial="hidden" whileInView="show" viewport={groViewport} className="mx-auto max-w-7xl px-5 py-10 md:px-6">
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            {PROMOS.map((p) => (
              <a key={p.key} href={`/tienda/${slug}/catalogo`} className="group relative flex min-h-[150px] items-center overflow-hidden rounded-2xl">
                <img src={p.img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.75) 45%, rgba(255,255,255,0.05) 100%)' }} />
                <div className="relative z-10 max-w-[62%] p-6">
                  <p className="text-[11px] font-bold" style={{ color: GRO.pink }}>{p.eyebrow}</p>
                  <h3 className="mt-1.5 text-xl font-bold leading-tight" style={{ fontFamily: GRO.display, color: GRO.ink }}>{p.title}</h3>
                  <span className="mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-bold text-white" style={{ backgroundColor: primary }}>{p.button} <Icon icon="solar:arrow-right-linear" width={13} /></span>
                </div>
              </a>
            ))}
          </div>
          {renderRow(categoryProducts, 'catprod')}
        </motion.section>

        {/* Banda de salud/seguridad */}
        <section className="mx-auto max-w-7xl px-5 pb-10 md:px-6">
          <div className="relative flex min-h-[130px] items-center overflow-hidden rounded-2xl" style={{ background: `linear-gradient(100deg, ${GRO.greenSoft}, ${GRO.lavender})` }}>
            <img src={diseno?.abarrotesSafetyImage || CATEGORY_FALLBACKS[0]} alt="" className="absolute right-0 top-0 h-full w-1/3 object-cover opacity-30" />
            <div className="relative z-10 p-7">
              <h3 className="text-xl font-bold md:text-2xl" style={{ fontFamily: GRO.display, color: GRO.ink }}>{diseno?.abarrotesSafetyTitle || 'En tienda o en línea, tu salud es nuestra prioridad'}</h3>
              <p className="mt-1.5 max-w-xl text-sm" style={{ color: GRO.inkSoft }}>{diseno?.abarrotesSafetySubtitle || 'Cuidamos cada producto con los más altos estándares de higiene y frescura.'}</p>
            </div>
          </div>
        </section>

        {/* Best Sellers */}
        <motion.section variants={groSection} initial="hidden" whileInView="show" viewport={groViewport} className="mx-auto max-w-7xl px-5 pb-12 md:px-6">
          <SectionHead title={diseno?.abarrotesBestsellersTitle || 'Los más vendidos'} sub="Lo que más piden nuestros clientes" slug={slug} />
          {!loading && bestSellers.length > 0 && renderRow(bestSellers, 'best')}
        </motion.section>

        {/* Tarjetas inferiores */}
        <motion.section variants={groSection} initial="hidden" whileInView="show" viewport={groViewport} className="mx-auto max-w-7xl px-5 pb-16 md:px-6">
          <div className="grid gap-4 md:grid-cols-3">
            {CARDS.map((c, i) => (
              <div key={i} className="relative flex min-h-[190px] flex-col justify-center overflow-hidden rounded-2xl">
                <img src={c.img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.1) 100%)' }} />
                <div className="relative z-10 max-w-[70%] p-6">
                  <p className="text-[11px] font-bold" style={{ color: GRO.pink }}>{c.eyebrow}</p>
                  <h3 className="mt-1.5 text-lg font-bold leading-tight" style={{ fontFamily: GRO.display, color: GRO.ink }}>{c.title}</h3>
                  <a href={`/tienda/${slug}/catalogo`} className="mt-4 inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[12px] font-bold transition-colors hover:text-white" style={{ borderColor: primary, color: GRO.greenDark }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = primary; e.currentTarget.style.color = '#fff'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = GRO.greenDark; }}>{c.button}</a>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </main>

      <GroFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <GroWhatsAppFab tienda={tienda} />

      <GroCartModal
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
