import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { AUR, AurCartModal, AurFooter, AurHeader, AurProductCard, AurWhatsAppFab, aurFont, aurPrimary } from './AurumParts';
import { aurCard, aurEase, aurPage, aurSection, aurStagger, aurViewport } from './motion';

const navigate = (to: string) => { window.location.href = to; };

const HERO_SLIDE_FALLBACKS = [
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=1600&q=80',
];
const TILE_FALLBACKS = [
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1518131672697-613becd4fab5?auto=format&fit=crop&w=600&q=80',
];
const TILE_TINTS = ['#F3E7D8', '#EFE9DC', '#F1E4E0', '#E6ECE7', '#F0EAD6'];
const STORY_FALLBACKS = [
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1633934542430-0905ccb5f050?auto=format&fit=crop&w=800&q=80',
];

const TRUST = [
  { icon: 'solar:diamond-linear', title: 'autenticidad', text: 'certificado en cada pieza' },
  { icon: 'solar:delivery-linear', title: 'envío asegurado', text: 'a todo el Perú' },
  { icon: 'solar:medal-ribbons-star-linear', title: 'garantía real', text: '30 días + garantía de joya' },
  { icon: 'solar:gift-linear', title: 'estuche premium', text: 'presentación de regalo gratis' },
];

const COMING_SOON = [
  { name: 'Perlas', month: 'Octubre', icon: 'solar:diamond-linear' },
  { name: 'Zafiro', month: 'Octubre', icon: 'solar:medal-ribbons-star-linear' },
  { name: 'Rubí', month: 'Noviembre', icon: 'solar:crown-line-linear' },
];

/* ─────────────────────────── Helpers de sección ─────────────────────────── */

function SectionHead({ title, sub, action, slug }: { title: string; sub?: string; action?: string; slug?: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-3xl font-bold lowercase tracking-tight md:text-4xl" style={{ fontFamily: AUR.serif, color: AUR.ink }}>{title}</h2>
        {sub && <p className="mt-1.5 text-sm text-neutral-500">{sub}</p>}
      </div>
      {action && slug && (
        <a href={`/tienda/${slug}/catalogo`} className="inline-flex items-center gap-1 rounded-full border px-4 py-2 text-[12px] font-semibold transition-colors hover:bg-white" style={{ borderColor: AUR.line, color: AUR.ink }}>
          {action} <Icon icon="solar:arrow-right-linear" width={14} />
        </a>
      )}
    </div>
  );
}

function PromptBar({ placeholder, cta, primary, onSubmit }: { placeholder: string; cta: string; primary: string; onSubmit: (value: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(value); }}
      className="mx-auto flex w-full max-w-xl items-center gap-1.5 rounded-full border bg-white p-1.5 shadow-[0_10px_30px_-18px_rgba(29,27,23,0.5)]"
      style={{ borderColor: AUR.line }}
    >
      <Icon icon="solar:magic-stick-3-linear" width={18} className="ml-3 shrink-0 text-neutral-400" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-9 flex-1 border-0 bg-transparent px-1 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:ring-0"
      />
      <button type="submit" className="h-9 shrink-0 rounded-full px-5 text-[12px] font-bold transition-transform hover:-translate-y-0.5" style={{ backgroundColor: primary, color: AUR.ink }}>
        {cta}
      </button>
    </form>
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
  onlyImage: boolean;
  actionKey: string;
}

function buildHeroSlides(diseno: any): HeroSlide[] {
  const raw: HeroSlide[] = [
    {
      image: diseno?.joyeriaHeroImage || '',
      eyebrow: diseno?.joyeriaHeroEyebrow || 'nueva colección',
      title: diseno?.joyeriaHeroTitle || 'convierte tus ideas',
      title2: diseno?.joyeriaHeroTitle2 || 'en joyas',
      subtitle: diseno?.joyeriaHeroSubtitle || 'joyería fina hecha a mano con oro, plata y piedras seleccionadas. piezas para durar toda la vida.',
      button: diseno?.joyeriaHeroButton || 'explorar',
      onlyImage: Boolean(diseno?.joyeriaHeroOnlyImage),
      actionKey: 'joyeriaHeroAction',
    },
    {
      image: diseno?.joyeriaSlide2Image || '',
      eyebrow: diseno?.joyeriaSlide2Eyebrow || 'hecho a mano',
      title: diseno?.joyeriaSlide2Title || 'oro de 18k',
      title2: diseno?.joyeriaSlide2Title2 || 'detalle eterno',
      subtitle: diseno?.joyeriaSlide2Subtitle || 'cada joya es forjada por nuestros artesanos con metales nobles y acabados impecables.',
      button: diseno?.joyeriaSlide2Button || 'descubrir',
      onlyImage: Boolean(diseno?.joyeriaSlide2OnlyImage),
      actionKey: 'joyeriaSlide2Action',
    },
    {
      image: diseno?.joyeriaSlide3Image || '',
      eyebrow: diseno?.joyeriaSlide3Eyebrow || 'edición especial',
      title: diseno?.joyeriaSlide3Title || 'anillos de',
      title2: diseno?.joyeriaSlide3Title2 || 'compromiso',
      subtitle: diseno?.joyeriaSlide3Subtitle || 'diamantes y gemas certificadas para sellar el momento más importante.',
      button: diseno?.joyeriaSlide3Button || 'ver anillos',
      onlyImage: Boolean(diseno?.joyeriaSlide3OnlyImage),
      actionKey: 'joyeriaSlide3Action',
    },
  ];
  return raw.map((slide, i) => ({ ...slide, image: slide.image || HERO_SLIDE_FALLBACKS[i % HERO_SLIDE_FALLBACKS.length] }));
}

function HeroSlider({ slides, slug, primary, diseno, announcement }: { slides: HeroSlide[]; slug: string; primary: string; diseno: any; announcement: string }) {
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
  const goSearch = (value: string) => {
    const term = value.trim();
    if (slug === 'preview') { window.dispatchEvent(new CustomEvent('preview-nav', { detail: 'catalogo' })); return; }
    navigateRouter(`/tienda/${slug}/catalogo${term ? `?search=${encodeURIComponent(term)}` : ''}`);
  };
  const slide = slides[index];

  return (
    <section className="mx-auto max-w-7xl px-5 pt-5 md:px-6" aria-roledescription="carousel">
      {slide.onlyImage ? (
        <AnimatePresence mode="wait">
          <motion.button
            key={`only-${index}`}
            type="button"
            onClick={() => goAction(slide.actionKey)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: aurEase }}
            className="group relative block h-[380px] w-full cursor-pointer overflow-hidden rounded-3xl md:h-[560px]"
            aria-label={slide.eyebrow || 'Ver más'}
          >
            <img src={slide.image} alt={slide.eyebrow || 'Banner'} className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]" />
          </motion.button>
        </AnimatePresence>
      ) : (
        <div className="relative h-[440px] overflow-hidden rounded-3xl md:h-[580px]" style={{ backgroundColor: AUR.charcoal }}>
          <AnimatePresence mode="wait">
            <motion.img
              key={`img-${index}`}
              src={slide.image}
              alt={slide.eyebrow || 'Colección'}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: aurEase }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(18,15,11,0.48) 0%, rgba(18,15,11,0.22) 36%, rgba(18,15,11,0.86) 100%)' }} />

          {/* Tarjeta flotante (estilo "free shipping") */}
          <div className="absolute right-5 top-5 hidden max-w-[220px] rounded-2xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur md:block">
            <p className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: AUR.ink }}>
              <Icon icon="solar:box-minimalistic-bold" width={16} style={{ color: AUR.gold }} /> envío asegurado
            </p>
            <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-neutral-500">{announcement}</p>
          </div>

          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-14 text-center md:pb-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={`content-${index}`}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.6, ease: aurEase }}
                className="flex flex-col items-center"
              >
                {slide.eyebrow && (
                  <span className="mb-4 rounded-full bg-white/15 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur">{slide.eyebrow}</span>
                )}
                <h1 className="max-w-3xl text-4xl font-bold lowercase leading-[1.02] tracking-tight text-white md:text-7xl" style={{ fontFamily: AUR.serif }}>
                  {slide.title} {slide.title2 && <span style={{ color: primary }}>{slide.title2}</span>}
                </h1>
                {slide.subtitle && <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/85 md:text-base">{slide.subtitle}</p>}
              </motion.div>
            </AnimatePresence>
            <div className="mt-7 w-full">
              <PromptBar placeholder="describe la joya que imaginas..." cta={slide.button || 'explorar'} primary={primary} onSubmit={goSearch} />
            </div>
          </div>

          {count > 1 && (
            <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-2.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Ir al slide ${i + 1}`}
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: i === index ? 30 : 10, backgroundColor: i === index ? primary : 'rgba(255,255,255,0.5)' }}
                />
              ))}
            </div>
          )}
          {count > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} aria-label="Anterior" className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-neutral-800 shadow-sm transition-colors hover:bg-white">
                <Icon icon="solar:alt-arrow-left-linear" width={20} />
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Siguiente" className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-neutral-800 shadow-sm transition-colors hover:bg-white">
                <Icon icon="solar:alt-arrow-right-linear" width={20} />
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────── Dreamboard ─────────────────────────────── */

function chunk4(items: any[]): any[][] {
  const out: any[][] = [];
  for (let i = 0; i + 4 <= items.length && out.length < 6; i += 4) out.push(items.slice(i, i + 4));
  return out;
}

/* ─────────────────────────────────── Página ─────────────────────────────── */

export default function AurumHomePage({
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
  const primary = aurPrimary(cp);
  const font = aurFont(diseno);
  const feed1 = productos.slice(0, 5);
  const feed2 = productos.slice(5, 10).length >= 3 ? productos.slice(5, 10) : productos.slice(0, 5);
  const announcement = diseno?.joyeriaAnnouncement || 'envío asegurado a todo el Perú · certificado de autenticidad · grabado de regalo sin costo';

  const categoryCards = (allCategories || [])
    .map((cat: any) => (typeof cat === 'string' ? { nombre: cat } : cat))
    .filter((cat: any) => cat?.nombre)
    .slice(0, 5);

  const boards = chunk4(productos);
  const goSearch = (value: string) => navigate(`/tienda/${slug}/catalogo${value.trim() ? `?search=${encodeURIComponent(value.trim())}` : ''}`);

  const renderRow = (items: any[], key: string) => (
    <motion.div variants={aurStagger} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((producto, i) => (
        <AurProductCard key={`${key}-${producto.id ?? i}`} producto={producto} slug={slug} cp={primary} onAddToCart={agregarAlCarrito} onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)} />
      ))}
    </motion.div>
  );

  return (
    <motion.div initial="hidden" animate="show" variants={aurPage} className="min-h-screen" style={{ backgroundColor: AUR.cream, fontFamily: font }}>
      <AurHeader
        tienda={tienda}
        slug={slug}
        cp={primary}
        diseno={diseno}
        carritoSize={carrito.reduce((s, i) => s + Number(i.cantidad || 1), 0)}
        onOpenCart={() => setMostrarCarrito(true)}
        allCategories={allCategories}
        onSearchSubmit={(event, value) => { event.preventDefault(); goSearch(value || ''); }}
      />

      <main>
        {/* ── Hero slider ──────────────────────────────────────────────────── */}
        <HeroSlider slides={buildHeroSlides(diseno)} slug={slug} primary={primary} diseno={diseno} announcement={announcement} />

        {/* ── Tira de confianza ────────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-5 py-8 md:px-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {TRUST.map((t) => (
              <div key={t.title} className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3.5" style={{ borderColor: AUR.line }}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ backgroundColor: AUR.nude, color: AUR.ink }}>
                  <Icon icon={t.icon} width={20} />
                </span>
                <div>
                  <p className="text-[13px] font-semibold lowercase" style={{ color: AUR.ink }}>{t.title}</p>
                  <p className="text-[11px] text-neutral-500">{t.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── live feed ────────────────────────────────────────────────────── */}
        <motion.section variants={aurSection} initial="hidden" whileInView="show" viewport={aurViewport} className="mx-auto max-w-7xl px-5 pb-6 pt-4 md:px-6">
          <SectionHead
            title={diseno?.joyeriaBestsellersTitle || 'lo más querido'}
            sub="selección del mes · lo más nuevo · bajo S/100 · para regalar"
            action="ver todo"
            slug={slug}
          />
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-2xl bg-black/[0.04]" />)}
            </div>
          ) : feed1.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-20 text-center text-neutral-400" style={{ borderColor: AUR.line }}>Aún no hay joyas publicadas.</div>
          ) : renderRow(feed1, 'feed1')}
        </motion.section>

        {/* ── Materiales / categorías (tiles) ──────────────────────────────── */}
        {categoryCards.length > 0 && (
          <motion.section variants={aurSection} initial="hidden" whileInView="show" viewport={aurViewport} className="mx-auto max-w-7xl px-5 py-10 md:px-6 md:py-14">
            <div className="mb-8">
              <h2 className="text-3xl font-bold lowercase tracking-tight md:text-4xl" style={{ fontFamily: AUR.serif, color: AUR.ink }}>{diseno?.joyeriaCategoriesTitle || 'los materiales que puedes usar'}</h2>
            </div>
            <motion.div variants={aurStagger} className="grid grid-cols-3 gap-3 md:grid-cols-5 md:gap-4">
              {categoryCards.map((cat: any, i: number) => (
                <motion.a
                  key={cat.nombre}
                  variants={aurCard}
                  whileHover={{ y: -5 }}
                  href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(cat.nombre)}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border bg-white p-2"
                  style={{ borderColor: AUR.line }}
                >
                  <div className="aspect-square overflow-hidden rounded-xl" style={{ backgroundColor: TILE_TINTS[i % TILE_TINTS.length] }}>
                    <img src={cat.imagenUrl || cat.imagen || TILE_FALLBACKS[i % TILE_FALLBACKS.length]} alt={cat.nombre} loading="lazy" className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.08]" />
                  </div>
                  <span className="px-1.5 py-2.5 text-[13px] font-semibold capitalize" style={{ color: AUR.ink }}>{cat.nombre}</span>
                </motion.a>
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* ── Banda editorial "estás entre los primeros" ───────────────────── */}
        <motion.section variants={aurSection} initial="hidden" whileInView="show" viewport={aurViewport} className="mx-auto max-w-7xl px-5 pb-10 md:px-6">
          <div className="grid items-stretch gap-6 rounded-3xl border bg-white p-4 md:grid-cols-2 md:p-5" style={{ borderColor: AUR.line }}>
            <div className="flex flex-col justify-center px-4 py-6 md:px-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: AUR.gold }}>{diseno?.joyeriaPromoLabel || 'servicio exclusivo'}</p>
              <h3 className="mt-3 text-3xl font-bold lowercase leading-tight md:text-4xl" style={{ fontFamily: AUR.serif, color: AUR.ink }}>{diseno?.joyeriaPromoTitle || 'grabado personalizado'}</h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-600">{diseno?.joyeriaPromoSubtitle || 'grabamos iniciales, fechas y mensajes en tu joya sin costo adicional. una pieza única, tan tuya como tu historia.'}</p>
              <a href={`/tienda/${slug}/catalogo`} className="mt-6 inline-flex w-fit items-center gap-2 rounded-full px-6 py-3 text-[12px] font-bold transition-transform hover:-translate-y-0.5" style={{ backgroundColor: primary, color: AUR.ink }}>
                {diseno?.joyeriaPromoButton || 'descubrir'} <Icon icon="solar:arrow-right-linear" width={15} />
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[diseno?.joyeriaPromoImage || STORY_FALLBACKS[0], STORY_FALLBACKS[1]].map((src, i) => (
                <div key={i} className={`overflow-hidden rounded-2xl ${i === 0 ? 'mt-6' : ''}`} style={{ backgroundColor: AUR.mist }}>
                  <img src={src} alt="" loading="lazy" className="h-full min-h-[220px] w-full object-cover md:min-h-[320px]" />
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── Segundo feed con prompt bar ("tus palabras, tu estilo") ───────── */}
        {feed2.length > 0 && (
          <motion.section variants={aurSection} initial="hidden" whileInView="show" viewport={aurViewport} className="mx-auto max-w-7xl px-5 py-6 md:px-6">
            <div className="mb-7 text-center">
              <h2 className="text-3xl font-bold lowercase tracking-tight md:text-4xl" style={{ fontFamily: AUR.serif, color: AUR.ink }}>hecho para ti</h2>
              <p className="mb-6 mt-1.5 text-sm text-neutral-500">personaliza tu joya: describe lo que sueñas y lo hacemos realidad</p>
              <PromptBar placeholder="collar con mi nombre en oro..." cta="crear" primary={primary} onSubmit={goSearch} />
            </div>
            <div className="mt-8">{renderRow(feed2, 'feed2')}</div>
          </motion.section>
        )}

        {/* ── Dreamboards / colecciones ────────────────────────────────────── */}
        {boards.length > 0 && (
          <motion.section variants={aurSection} initial="hidden" whileInView="show" viewport={aurViewport} className="mx-auto max-w-7xl px-5 py-10 md:px-6 md:py-14">
            <SectionHead title="colecciones que te van a encantar" sub="curadurías de nuestras piezas favoritas" />
            <div className="flex snap-x gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {boards.map((board, bi) => (
                <motion.a
                  key={bi}
                  variants={aurCard}
                  href={`/tienda/${slug}/catalogo`}
                  className="group w-[240px] shrink-0 snap-start rounded-2xl border bg-white p-3 transition-shadow hover:shadow-[0_22px_44px_-26px_rgba(29,27,23,0.5)]"
                  style={{ borderColor: AUR.line }}
                >
                  <div className="grid grid-cols-2 gap-1.5">
                    {board.map((p, pi) => (
                      <div key={pi} className="aspect-square overflow-hidden rounded-lg" style={{ backgroundColor: AUR.mist }}>
                        <img src={p?.imagenUrl || p?.imagen || TILE_FALLBACKS[pi % TILE_FALLBACKS.length]} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between px-0.5">
                    <div className="flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-full text-[9px] font-bold" style={{ backgroundColor: AUR.nude, color: AUR.gold }}>◆</span>
                      <span className="text-[13px] font-semibold" style={{ color: AUR.ink }}>Colección {bi + 1}</span>
                    </div>
                    <span className="rounded-full border px-3 py-1 text-[10px] font-bold" style={{ borderColor: AUR.line, color: AUR.ink }}>ver</span>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Banda "donde nace cada joya" ─────────────────────────────────── */}
        <motion.section variants={aurSection} initial="hidden" whileInView="show" viewport={aurViewport} className="mx-auto max-w-7xl px-5 pb-12 md:px-6">
          <div className="grid items-center gap-6 overflow-hidden rounded-3xl md:grid-cols-2" style={{ backgroundColor: AUR.charcoal }}>
            <div className="px-8 py-10 md:py-14">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: primary }}>{diseno?.joyeriaClubLabel || 'artesanía'}</p>
              <h3 className="mt-3 text-3xl font-bold lowercase leading-tight text-white md:text-4xl" style={{ fontFamily: AUR.serif }}>{diseno?.joyeriaClubTitle || 'donde nace cada joya'}</h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/65">{diseno?.joyeriaClubSubtitle || 'nuestros maestros joyeros funden, tallan y pulen cada pieza a mano. tradición y técnica en cada detalle.'}</p>
              <a href={`/tienda/${slug}/catalogo`} className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[12px] font-bold transition-transform hover:-translate-y-0.5" style={{ backgroundColor: primary, color: AUR.ink }}>
                {diseno?.joyeriaClubButton || 'ver colección'} <Icon icon="solar:arrow-right-linear" width={15} />
              </a>
            </div>
            <div className="relative h-full min-h-[280px]">
              <img src={STORY_FALLBACKS[1]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </div>
        </motion.section>

        {/* ── Próximamente + feedback ──────────────────────────────────────── */}
        <motion.section variants={aurSection} initial="hidden" whileInView="show" viewport={aurViewport} className="mx-auto max-w-7xl px-5 pb-16 md:px-6 md:pb-20">
          <SectionHead title={`próximamente en ${storeNameShort(diseno, tienda)}`} sub="nuevos materiales y colecciones en camino" />
          <div className="grid gap-4 md:grid-cols-4">
            {COMING_SOON.map((c) => (
              <div key={c.name} className="flex flex-col rounded-2xl border bg-white p-5" style={{ borderColor: AUR.line }}>
                <span className="grid h-12 w-12 place-items-center rounded-xl" style={{ backgroundColor: AUR.nude, color: AUR.gold }}>
                  <Icon icon={c.icon} width={24} />
                </span>
                <p className="mt-4 text-lg font-bold lowercase" style={{ fontFamily: AUR.serif, color: AUR.ink }}>{c.name}</p>
                <p className="text-xs text-neutral-500">{c.month}</p>
                <button type="button" className="mt-4 w-fit rounded-full border px-4 py-2 text-[11px] font-semibold transition-colors hover:bg-neutral-50" style={{ borderColor: AUR.line, color: AUR.ink }}>Recordarme</button>
              </div>
            ))}
            {/* Tarjeta oscura de feedback / newsletter */}
            <div className="flex flex-col justify-between rounded-2xl p-6" style={{ backgroundColor: AUR.ink }}>
              <div>
                <h3 className="text-2xl font-bold lowercase leading-tight text-white" style={{ fontFamily: AUR.serif }}>{diseno?.joyeriaNewsletterTitle || 'cuéntanos qué imaginas'}</h3>
                <p className="mt-2 text-xs leading-5 text-white/60">{diseno?.joyeriaNewsletterSubtitle || 'suscríbete y recibe lanzamientos y ofertas antes que nadie.'}</p>
              </div>
              <form onSubmit={(e) => e.preventDefault()} className="mt-5 flex items-center gap-1.5 rounded-full bg-white/10 p-1.5">
                <input type="email" placeholder="tu correo" className="h-9 flex-1 border-0 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/40 focus:ring-0" />
                <button type="submit" className="h-9 shrink-0 rounded-full px-4 text-[11px] font-bold" style={{ backgroundColor: primary, color: AUR.ink }}>{diseno?.joyeriaNewsletterButton || 'enviar'}</button>
              </form>
            </div>
          </div>
        </motion.section>
      </main>

      <AurFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <AurWhatsAppFab tienda={tienda} />

      <AurCartModal
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

function storeNameShort(diseno: any, tienda: any): string {
  return String(diseno?.joyeriaLogoText || tienda?.nombreComercial || tienda?.razonSocial || tienda?.nombre || 'Aurum');
}
