import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { FOOD, FoodCartModal, FoodHomeTopBar, FoodProductCard, FoodSearchBar, FoodShell, foodPrimary, storeName, withAlpha } from './CrispyParts';
import { foodCard, foodEase, foodPage, foodSection, foodStagger, foodTap, foodViewport } from './motion';

const navigate = (to: string) => { window.location.href = to; };

const HERO_FALLBACKS = [
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
];
const CAT_ICONS = ['mdi:silverware-fork-knife', 'mdi:bowl-mix', 'mdi:pizza', 'mdi:food-steak', 'mdi:cup', 'mdi:cupcake'];
const PROMO_FALLBACK = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';

interface HeroSlide { image: string; badge: string; title: string; subtitle: string; button: string; onlyImage: boolean; actionKey: string; }

function buildHeroSlides(diseno: any): HeroSlide[] {
  const raw: HeroSlide[] = [
    {
      image: diseno?.comidaAppHeroImage || '',
      badge: diseno?.comidaAppHeroBadge || 'Recién hecho',
      title: diseno?.comidaAppHeroTitle || 'El sabor que te encanta',
      subtitle: diseno?.comidaAppHeroSubtitle || 'Preparado al momento y con los mejores ingredientes.',
      button: diseno?.comidaAppHeroButton || 'Pedir ahora',
      onlyImage: Boolean(diseno?.comidaAppHeroOnlyImage),
      actionKey: 'comidaAppHeroAction',
    },
    {
      image: diseno?.comidaAppSlide2Image || '',
      badge: diseno?.comidaAppSlide2Badge || 'Combos',
      title: diseno?.comidaAppSlide2Title || 'Combos para compartir',
      subtitle: diseno?.comidaAppSlide2Subtitle || 'Más sabor, mejor precio.',
      button: diseno?.comidaAppSlide2Button || 'Ver combos',
      onlyImage: Boolean(diseno?.comidaAppSlide2OnlyImage),
      actionKey: 'comidaAppSlide2Action',
    },
    {
      image: diseno?.comidaAppSlide3Image || '',
      badge: diseno?.comidaAppSlide3Badge || 'Oferta',
      title: diseno?.comidaAppSlide3Title || 'Hasta 30% de descuento',
      subtitle: diseno?.comidaAppSlide3Subtitle || 'En productos seleccionados.',
      button: diseno?.comidaAppSlide3Button || 'Aprovechar',
      onlyImage: Boolean(diseno?.comidaAppSlide3OnlyImage),
      actionKey: 'comidaAppSlide3Action',
    },
  ];
  return raw.map((s, i) => ({ ...s, image: s.image || HERO_FALLBACKS[i % HERO_FALLBACKS.length] }));
}

function HeroSlider({ slides, slug, cp, diseno }: { slides: HeroSlide[]; slug: string; cp: string; diseno: any }) {
  const navigateRouter = useNavigate();
  const [index, setIndex] = useState(0);
  const count = slides.length;
  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIndex((p) => (p + 1) % count), 5000);
    return () => clearInterval(t);
  }, [count]);
  const goAction = (key: string) => runStoreLinkAction(getStoreLinkAction(diseno, key, { defaultType: 'catalog' }), { slug, navigate: navigateRouter });
  const slide = slides[index];

  return (
    <div className="px-4 pt-4 lg:px-0 lg:pt-5">
      <div className="relative overflow-hidden rounded-[26px] lg:rounded-[32px]" style={{ backgroundColor: FOOD.red }}>
        <AnimatePresence mode="wait">
          {slide.onlyImage ? (
            <motion.button key={`o-${index}`} type="button" onClick={() => goAction(slide.actionKey)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: foodEase }} className="block h-52 w-full">
              <img src={slide.image} alt={slide.badge} className="h-full w-full object-cover" />
            </motion.button>
          ) : (
            <motion.div key={`s-${index}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.5, ease: foodEase }} className="relative flex min-h-[210px] items-stretch lg:min-h-[380px]">
              {/* Imagen de fondo (más visible) */}
              <img src={slide.image} alt={slide.title} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: '75% center' }} />
              {/* Degradado suave: resalta el texto a la izquierda y deja ver más el plato a la derecha */}
              <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${FOOD.red} 0%, ${withAlpha(FOOD.red, 'd9')} 26%, ${withAlpha(FOOD.red, '73')} 46%, ${withAlpha(FOOD.red, '00')} 66%)` }} />
              <div className="relative z-10 flex max-w-[74%] flex-col justify-center p-5 text-white sm:max-w-[64%] lg:max-w-[54%] lg:p-12" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.28)' }}>
                <span className="mb-2 w-fit rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide backdrop-blur lg:text-[12px]">{slide.badge}</span>
                <h2 className="text-[26px] font-extrabold leading-[1.05] lg:text-[52px]">{slide.title}</h2>
                <p className="mt-1.5 text-[12px] font-medium text-white/90 lg:mt-3 lg:text-[16px]">{slide.subtitle}</p>
                <motion.button whileTap={foodTap} type="button" onClick={() => goAction(slide.actionKey)} className="mt-4 flex w-fit items-center gap-2 rounded-full bg-white py-2.5 pl-5 pr-2.5 text-[13px] font-extrabold shadow-lg lg:mt-6 lg:py-3.5 lg:pl-7 lg:pr-3.5 lg:text-[15px]" style={{ color: FOOD.ink, textShadow: 'none' }}>
                  {slide.button}
                  <span className="flex h-7 w-7 items-center justify-center rounded-full text-white" style={{ backgroundColor: foodPrimary(cp) }}><Icon icon="solar:arrow-right-linear" width={15} /></span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {count > 1 && (
          <div className="absolute bottom-3 left-5 z-10 flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button key={i} type="button" onClick={() => setIndex(i)} aria-label={`Slide ${i + 1}`} className="h-1.5 rounded-full transition-all" style={{ width: i === index ? 20 : 6, backgroundColor: i === index ? '#fff' : 'rgba(255,255,255,0.5)' }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CrispyHomePage({
  tienda, slug, productos, allCategories, cp, diseno,
  carrito, setCarrito, mostrarCarrito, setMostrarCarrito, agregarAlCarrito, actualizarCantidad, loading,
}: TemplateHomePageProps) {
  const primary = foodPrimary(cp);
  const combos = productos.slice(0, 8);

  const cats = (allCategories || []).map((c: any) => (typeof c === 'string' ? { nombre: c } : c)).filter((c: any) => c?.nombre).slice(0, 8);
  const catFallback = ['Todo', 'Entradas', 'Platos', 'Parrillas', 'Bebidas', 'Postres'];
  const catList = cats.length ? cats : catFallback.map((n) => ({ nombre: n }));

  const goCat = (nombre: string) => navigate(`/tienda/${slug}/catalogo${nombre && nombre !== 'Todo' ? `?category=${encodeURIComponent(nombre)}` : ''}`);

  return (
    <FoodShell slug={slug} active="home" cp={primary} diseno={diseno} tienda={tienda} carrito={carrito} onOpenCart={() => setMostrarCarrito(true)} categories={allCategories}>
      <motion.div initial="hidden" animate="show" variants={foodPage}>
        <div className="lg:hidden">
          <FoodHomeTopBar tienda={tienda} slug={slug} diseno={diseno} cp={primary} carrito={carrito} onOpenCart={() => setMostrarCarrito(true)} />
          <FoodSearchBar
            placeholder={diseno?.comidaAppSearchPlaceholder || 'Busca tu antojo...'}
            onSubmit={(e, v) => { e.preventDefault(); navigate(`/tienda/${slug}/catalogo${v ? `?search=${encodeURIComponent(v)}` : ''}`); }}
          />
        </div>

        {/* Saludo (desktop) */}
        <div className="hidden px-0 pt-8 lg:block">
          <p className="text-[15px] font-semibold" style={{ color: FOOD.soft }}>{diseno?.comidaAppGreeting || '¡Hola! 👋'}</p>
          <h1 className="text-[30px] font-extrabold" style={{ color: FOOD.ink }}>{diseno?.comidaAppTagline || storeName(tienda, diseno)}</h1>
        </div>

        {/* Hero */}
        <HeroSlider slides={buildHeroSlides(diseno)} slug={slug} cp={primary} diseno={diseno} />

        {/* Categorías (círculos) */}
        <div className="mt-5 lg:mt-8">
          <div className="no-scrollbar flex gap-4 overflow-x-auto px-4 pb-1 lg:justify-center lg:gap-10 lg:overflow-visible lg:px-0">
            {catList.map((c: any, i: number) => (
              <button key={c.nombre + i} type="button" onClick={() => goCat(c.nombre)} className="flex shrink-0 flex-col items-center gap-1.5">
                <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full shadow-sm" style={{ backgroundColor: FOOD.peach }}>
                  {c.imagenUrl || c.imagen ? <img src={c.imagenUrl || c.imagen} alt={c.nombre} className="h-full w-full object-cover" /> : <Icon icon={CAT_ICONS[i % CAT_ICONS.length]} width={28} style={{ color: FOOD.primary }} />}
                </span>
                <span className="max-w-[70px] truncate text-[11px] font-bold" style={{ color: FOOD.ink }}>{c.nombre}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Popular Combos */}
        <section className="mt-5 px-4 lg:mt-10 lg:px-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[18px] font-extrabold" style={{ color: FOOD.ink }}>{diseno?.comidaAppCombosTitle || 'Combos populares'}</h2>
            <a href={`/tienda/${slug}/catalogo`} className="flex items-center gap-1 text-[12px] font-bold" style={{ color: primary }}>Ver todo <Icon icon="solar:arrow-right-linear" width={14} /></a>
          </div>
          {loading ? (
            <div className="flex gap-3 overflow-hidden">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-64 w-44 shrink-0 animate-pulse rounded-3xl" style={{ backgroundColor: '#00000008' }} />)}</div>
          ) : combos.length === 0 ? (
            <div className="rounded-3xl border border-dashed py-12 text-center text-sm" style={{ borderColor: FOOD.line, color: FOOD.muted }}>Aún no hay productos publicados.</div>
          ) : (
            <motion.div variants={foodStagger} initial="hidden" whileInView="show" viewport={foodViewport} className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0">
              {combos.map((p) => (
                <motion.div key={p.id} variants={foodCard} className="w-44 shrink-0 lg:w-auto">
                  <FoodProductCard producto={p} slug={slug} cp={primary} onAddToCart={agregarAlCarrito} onClick={() => navigate(`/tienda/${slug}/producto/${p.id}`)} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        {/* Promo banner */}
        <motion.section variants={foodSection} initial="hidden" whileInView="show" viewport={foodViewport} className="mt-5 px-4 lg:mt-10 lg:px-0">
          <div className="relative flex min-h-[190px] items-center overflow-hidden rounded-[24px] lg:min-h-[320px] lg:rounded-[32px]" style={{ backgroundColor: FOOD.ink }}>
            {/* Imagen de fondo a todo el ancho (como el hero) */}
            <img src={diseno?.comidaAppPromoImage || PROMO_FALLBACK} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: '75% center' }} />
            {/* Degradado suave que resalta el texto a la izquierda */}
            <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${FOOD.ink} 0%, ${withAlpha(FOOD.ink, 'd9')} 26%, ${withAlpha(FOOD.ink, '73')} 46%, ${withAlpha(FOOD.ink, '00')} 66%)` }} />
            <div className="relative z-10 max-w-[74%] p-5 text-white sm:max-w-[60%] lg:max-w-[52%] lg:p-12" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.35)' }}>
              <p className="text-[12px] font-extrabold" style={{ color: primary }}>{diseno?.comidaAppPromoEyebrow || 'Ofertas 🔥'}</p>
              <h3 className="mt-1 text-[24px] font-extrabold leading-tight lg:text-[40px]">{diseno?.comidaAppPromoTitle || 'Hasta 30% OFF'}</h3>
              <p className="mt-1 text-[12px] font-medium text-white/85 lg:text-[15px]">{diseno?.comidaAppPromoSubtitle || 'En combos seleccionados'}</p>
              <motion.button whileTap={foodTap} type="button" onClick={() => navigate(`/tienda/${slug}/catalogo`)} className="mt-4 flex w-fit items-center gap-2 rounded-full py-2.5 pl-5 pr-2.5 text-[12px] font-extrabold shadow-lg lg:mt-6 lg:py-3.5 lg:pl-7 lg:pr-3.5 lg:text-[14px]" style={{ backgroundColor: '#fff', color: FOOD.ink, textShadow: 'none' }}>
                {diseno?.comidaAppPromoButton || 'Pedir ahora'}
                <span className="flex h-6 w-6 items-center justify-center rounded-full text-white lg:h-7 lg:w-7" style={{ backgroundColor: primary }}><Icon icon="solar:arrow-right-linear" width={13} /></span>
              </motion.button>
            </div>
            <span className="absolute right-4 top-4 z-10 flex h-14 w-14 flex-col items-center justify-center rounded-full text-center text-white shadow-lg lg:h-20 lg:w-20" style={{ backgroundColor: primary }}>
              <span className="text-[15px] font-extrabold leading-none lg:text-[24px]">30%</span>
              <span className="text-[8px] font-bold uppercase lg:text-[10px]">Off</span>
            </span>
          </div>
        </motion.section>
      </motion.div>

      <FoodCartModal
        isOpen={mostrarCarrito}
        onClose={() => setMostrarCarrito(false)}
        carrito={carrito}
        setCarrito={setCarrito}
        actualizarCantidad={actualizarCantidad}
        onCheckout={() => { window.location.href = `/tienda/${slug}/checkout`; }}
        cp={primary}
        tienda={tienda}
      />
    </FoodShell>
  );
}
