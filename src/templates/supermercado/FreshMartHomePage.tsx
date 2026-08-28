import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { getStoreLinkAction, runStoreLinkAction } from '@/components/tienda/storeLinkActions';
import { FM, FmCartModal, FmFooter, FmHeader, FmProductCard, FmWhatsAppFab, fmFont, fmPrimary } from './FreshMartParts';
import { fmCard, fmEase, fmPage, fmSection, fmStagger, fmTap, fmViewport } from './motion';

const navigate = (to: string) => { window.location.href = to; };

const HERO_FALLBACKS = [
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1000&q=80',
];
const CATEGORY_FALLBACKS = [
  'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1553530666-ba11a90bb0ae?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1568254183919-78a4f43a2877?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80',
];
const SAVER_FALLBACK = 'https://images.unsplash.com/photo-1506617564039-2f3b650b7010?auto=format&fit=crop&w=900&q=80';

const TRUST = [
  { icon: 'solar:leaf-bold', title: 'Producto fresco', text: 'Calidad garantizada' },
  { icon: 'solar:delivery-bold', title: 'Envío gratis', text: 'En pedidos desde S/ 80' },
  { icon: 'solar:shield-check-bold', title: 'Pago seguro', text: 'Protegido al 100%' },
  { icon: 'solar:refresh-bold', title: 'Devolución fácil', text: '7 días de garantía' },
];
const WHY = [
  { icon: 'solar:medal-ribbons-star-bold', title: 'Mejor calidad', text: 'Los productos más frescos y de mejor calidad.' },
  { icon: 'solar:tag-price-bold', title: 'Precios accesibles', text: 'Los mejores precios y ofertas exclusivas.' },
  { icon: 'solar:delivery-bold', title: 'Entrega rápida', text: 'Tu pedido en la puerta a tiempo.' },
  { icon: 'solar:shield-check-bold', title: '100% seguro', text: 'Tus datos y pagos siempre protegidos.' },
  { icon: 'solar:refresh-bold', title: 'Devolución fácil', text: 'Devoluciones sin complicaciones en 7 días.' },
];
const TESTIMONIALS = [
  { name: 'Sarah J.', text: 'Hacer las compras es súper fácil y conveniente. La calidad siempre es de primera y la entrega es rapidísima.' },
  { name: 'Miguel R.', text: 'Los precios son inmejorables y todo llega fresco. Ya no voy al mercado, pido todo por aquí.' },
  { name: 'Ana P.', text: 'Excelente servicio, productos frescos y atención rápida. 100% recomendado para tu despensa.' },
];

interface HeroSlide {
  image: string; eyebrow: string; title: string; title2: string; subtitle: string; badge: string; button: string; button2: string; onlyImage: boolean; actionKey: string;
}

function buildHeroSlides(diseno: any): HeroSlide[] {
  const raw: HeroSlide[] = [
    { image: diseno?.supermercadoHeroImage || '', eyebrow: diseno?.supermercadoHeroEyebrow || 'Frescura en la que puedes confiar', title: diseno?.supermercadoHeroTitle || 'Abarrotes frescos,', title2: diseno?.supermercadoHeroTitle2 || 'mejor vida', subtitle: diseno?.supermercadoHeroSubtitle || 'Recibe las frutas, verduras y esenciales más frescos directo en tu puerta.', badge: diseno?.supermercadoHeroBadge || 'Hasta 30% OFF', button: diseno?.supermercadoHeroButton || 'Comprar ahora', button2: diseno?.supermercadoHeroButton2 || 'Ver ofertas', onlyImage: Boolean(diseno?.supermercadoHeroOnlyImage), actionKey: 'supermercadoHeroAction' },
    { image: diseno?.supermercadoSlide2Image || '', eyebrow: diseno?.supermercadoSlide2Eyebrow || 'Directo del campo', title: diseno?.supermercadoSlide2Title || 'Frutas y verduras', title2: diseno?.supermercadoSlide2Title2 || 'del día', subtitle: diseno?.supermercadoSlide2Subtitle || 'Seleccionamos lo mejor de cada cosecha para tu mesa.', badge: diseno?.supermercadoSlide2Badge || 'Nuevo ingreso', button: diseno?.supermercadoSlide2Button || 'Descubrir', button2: diseno?.supermercadoSlide2Button2 || 'Ver todo', onlyImage: Boolean(diseno?.supermercadoSlide2OnlyImage), actionKey: 'supermercadoSlide2Action' },
    { image: diseno?.supermercadoSlide3Image || '', eyebrow: diseno?.supermercadoSlide3Eyebrow || 'Entrega en 30 minutos', title: diseno?.supermercadoSlide3Title || 'Tu despensa llena,', title2: diseno?.supermercadoSlide3Title2 || 'sin salir de casa', subtitle: diseno?.supermercadoSlide3Subtitle || 'Haz tu pedido y recíbelo el mismo día. Rápido y seguro.', badge: diseno?.supermercadoSlide3Badge || 'Envío gratis', button: diseno?.supermercadoSlide3Button || 'Pedir ahora', button2: diseno?.supermercadoSlide3Button2 || 'Ver ofertas', onlyImage: Boolean(diseno?.supermercadoSlide3OnlyImage), actionKey: 'supermercadoSlide3Action' },
  ];
  return raw.map((s, i) => ({ ...s, image: s.image || HERO_FALLBACKS[i % HERO_FALLBACKS.length] }));
}

function HeroSlider({ slides, slug, primary, diseno }: { slides: HeroSlide[]; slug: string; primary: string; diseno: any }) {
  const navigateRouter = useNavigate();
  const [index, setIndex] = useState(0);
  const count = slides.length;
  useEffect(() => { if (count <= 1) return; const t = setInterval(() => setIndex((p) => (p + 1) % count), 6000); return () => clearInterval(t); }, [count]);
  const goAction = (key: string) => runStoreLinkAction(getStoreLinkAction(diseno, key, { defaultType: 'catalog' }), { slug, navigate: navigateRouter });
  const goCatalog = () => { if (slug === 'preview') { window.dispatchEvent(new CustomEvent('preview-nav', { detail: 'catalogo' })); return; } navigateRouter(`/tienda/${slug}/catalogo`); };
  const slide = slides[index];

  return (
    <section className="relative overflow-hidden" style={{ background: `linear-gradient(120deg, ${FM.greenSoft} 0%, ${FM.greenSoft2} 60%, #FFFFFF 100%)` }} aria-roledescription="carousel">
      <div className="mx-auto max-w-7xl px-5 md:px-6">
        {slide.onlyImage ? (
          <AnimatePresence mode="wait">
            <motion.button key={`only-${index}`} type="button" onClick={() => goAction(slide.actionKey)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: fmEase }} className="group my-6 block h-64 w-full overflow-hidden rounded-2xl md:h-[440px]">
              <img src={slide.image} alt={slide.eyebrow} className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.04]" />
            </motion.button>
          </AnimatePresence>
        ) : (
          <div className="grid items-center gap-8 py-10 md:grid-cols-2 md:py-16">
            <AnimatePresence mode="wait">
              <motion.div key={`c-${index}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.5, ease: fmEase }}>
                <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide" style={{ color: primary }}><span className="h-px w-6" style={{ backgroundColor: primary }} /> {slide.eyebrow}</p>
                <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] md:text-6xl" style={{ fontFamily: FM.display, color: FM.ink }}>
                  {slide.title} <span style={{ color: primary }}>{slide.title2}</span>
                </h1>
                {slide.subtitle && <p className="mt-4 max-w-md text-sm leading-relaxed md:text-base" style={{ color: FM.inkSoft }}>{slide.subtitle}</p>}
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <motion.button type="button" onClick={() => goAction(slide.actionKey)} whileHover={{ scale: 1.03, y: -2 }} whileTap={fmTap} className="inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-sm font-bold text-white shadow-lg" style={{ backgroundColor: primary }}>
                    {slide.button} <Icon icon="solar:arrow-right-linear" width={16} />
                  </motion.button>
                  <button type="button" onClick={goCatalog} className="inline-flex items-center gap-2 rounded-lg border px-6 py-3.5 text-sm font-bold transition-colors" style={{ borderColor: primary, color: primary }}>{slide.button2}</button>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="relative order-first md:order-last">
              {slide.badge && (
                <div className="absolute -left-2 top-2 z-10 grid h-20 w-20 place-items-center rounded-full text-center text-[11px] font-extrabold uppercase leading-tight text-white shadow-lg md:h-24 md:w-24" style={{ backgroundColor: FM.greenDark }}>
                  {slide.badge}
                </div>
              )}
              <AnimatePresence mode="wait">
                <motion.div key={`i-${index}`} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: fmEase }} className="mx-auto aspect-square max-w-md overflow-hidden rounded-2xl">
                  <img src={slide.image} alt={slide.eyebrow} className="h-full w-full object-cover" />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}

        {count > 1 && (
          <div className="flex items-center justify-center gap-2 pb-6">
            {slides.map((_, i) => (
              <button key={i} type="button" onClick={() => setIndex(i)} aria-label={`Slide ${i + 1}`} className="h-2 rounded-full transition-all" style={{ width: i === index ? 26 : 8, backgroundColor: i === index ? primary : 'rgba(31,42,26,0.2)' }} />
            ))}
          </div>
        )}
      </div>

      {/* Trust row */}
      <div className="border-t bg-white/60 backdrop-blur" style={{ borderColor: FM.line }}>
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-5 py-5 md:grid-cols-4 md:px-6">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ backgroundColor: FM.greenSoft, color: FM.greenDark }}><Icon icon={t.icon} width={22} /></span>
              <div>
                <p className="text-[13px] font-bold" style={{ fontFamily: FM.display, color: FM.ink }}>{t.title}</p>
                <p className="text-[11px]" style={{ color: FM.inkSoft }}>{t.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHead({ title, sub, slug, center }: { title: string; sub?: string; slug?: string; center?: boolean }) {
  return (
    <div className={`mb-7 flex flex-wrap items-end gap-2 ${center ? 'flex-col items-center text-center' : 'justify-between'}`}>
      <div>
        <h2 className="text-2xl font-extrabold md:text-3xl" style={{ fontFamily: FM.display, color: FM.ink }}>{title}</h2>
        {sub && <p className="mt-1 text-sm" style={{ color: FM.inkSoft }}>{sub}</p>}
        {center && <span className="mx-auto mt-3 block h-1 w-16 rounded-full" style={{ backgroundColor: FM.green }} />}
      </div>
      {slug && !center && <a href={`/tienda/${slug}/catalogo`} className="inline-flex items-center gap-1 text-[13px] font-bold" style={{ color: FM.green }}>Ver todo <Icon icon="solar:arrow-right-linear" width={14} /></a>}
    </div>
  );
}

export default function FreshMartHomePage({
  tienda, slug, productos, allCategories, cp, diseno, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, agregarAlCarrito, actualizarCantidad, loading,
}: TemplateHomePageProps) {
  const primary = fmPrimary(cp);
  const font = fmFont(diseno);
  const deals = productos.slice(0, 12);
  const cartTotal = carrito.reduce((s, i) => s + Number(i.precioUnitario || 0) * Number(i.cantidad || 1), 0);

  const categoryCards = (allCategories || [])
    .map((c: any) => (typeof c === 'string' ? { nombre: c } : c))
    .filter((c: any) => c?.nombre)
    .slice(0, 8);

  const renderRow = (items: any[], key: string) => (
    <motion.div variants={fmStagger} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((p, i) => (
        <FmProductCard key={`${key}-${p.id ?? i}`} producto={p} slug={slug} cp={primary} onAddToCart={agregarAlCarrito} onClick={() => navigate(`/tienda/${slug}/producto/${p.id}`)} />
      ))}
    </motion.div>
  );

  return (
    <motion.div initial="hidden" animate="show" variants={fmPage} className="min-h-screen" style={{ backgroundColor: FM.cream, fontFamily: font }}>
      <FmHeader tienda={tienda} slug={slug} cp={primary} diseno={diseno} carritoSize={carrito.reduce((s, i) => s + Number(i.cantidad || 1), 0)} cartTotal={cartTotal} onOpenCart={() => setMostrarCarrito(true)} allCategories={allCategories} onSearchSubmit={(e, v) => { e.preventDefault(); navigate(`/tienda/${slug}/catalogo${v ? `?search=${encodeURIComponent(v)}` : ''}`); }} />

      <main>
        <HeroSlider slides={buildHeroSlides(diseno)} slug={slug} primary={primary} diseno={diseno} />

        {/* Shop by Category */}
        {categoryCards.length > 0 && (
          <motion.section variants={fmSection} initial="hidden" whileInView="show" viewport={fmViewport} className="mx-auto max-w-7xl px-5 py-12 md:px-6">
            <SectionHead title={diseno?.supermercadoCategoriesTitle || 'Compra por categoría'} center />
            <motion.div variants={fmStagger} className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-8">
              {categoryCards.map((cat: any, i: number) => (
                <motion.a key={cat.nombre} variants={fmCard} whileHover={{ y: -5 }} href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(cat.nombre)}`} className="group flex flex-col items-center gap-2.5 rounded-xl border bg-white p-4 text-center transition-shadow hover:shadow-[0_16px_30px_-20px_rgba(31,42,26,0.4)]" style={{ borderColor: FM.line }}>
                  <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-full p-1" style={{ backgroundColor: FM.greenSoft }}>
                    <img src={cat.imagenUrl || cat.imagen || CATEGORY_FALLBACKS[i % CATEGORY_FALLBACKS.length]} alt={cat.nombre} loading="lazy" className="h-full w-full rounded-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  </span>
                  <span className="line-clamp-2 text-[12px] font-bold leading-tight" style={{ fontFamily: FM.display, color: FM.ink }}>{cat.nombre}</span>
                </motion.a>
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* Weekend Super Saver + delivery */}
        <motion.section variants={fmSection} initial="hidden" whileInView="show" viewport={fmViewport} className="mx-auto max-w-7xl px-5 pb-12 md:px-6">
          <div className="grid gap-4 md:grid-cols-[1.9fr_1fr]">
            <div className="relative flex min-h-[210px] items-center overflow-hidden rounded-2xl" style={{ backgroundColor: FM.greenDark }}>
              <img src={diseno?.supermercadoSaverImage || SAVER_FALLBACK} alt="" loading="lazy" className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-40" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${FM.greenDark} 40%, rgba(46,90,28,0.4) 100%)` }} />
              <div className="relative z-10 max-w-sm p-8 text-white">
                <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: FM.greenSoft }}>{diseno?.supermercadoSaverLabel || 'Oferta por tiempo limitado'}</p>
                <h3 className="mt-2 text-3xl font-extrabold leading-tight md:text-4xl" style={{ fontFamily: FM.display }}>{diseno?.supermercadoSaverTitle || 'Súper ahorro del fin de semana'}</h3>
                <p className="mt-2 text-sm text-white/70">{diseno?.supermercadoSaverSubtitle || 'Hasta 30% de descuento en productos seleccionados. ¡Solo hasta el domingo!'}</p>
                <a href={`/tienda/${slug}/catalogo`} className="mt-5 inline-flex rounded-lg px-6 py-3 text-[12px] font-bold text-white transition-transform hover:-translate-y-0.5" style={{ backgroundColor: primary }}>{diseno?.supermercadoSaverButton || 'Comprar ahora'}</a>
              </div>
              <span className="absolute right-6 top-1/2 z-10 hidden h-20 w-20 -translate-y-1/2 place-items-center rounded-full text-center text-[13px] font-extrabold text-white shadow-lg md:grid" style={{ backgroundColor: FM.orange }}>30%<br />OFF</span>
            </div>
            <div className="flex flex-col justify-center rounded-2xl border p-7" style={{ borderColor: FM.line, backgroundColor: FM.greenSoft2 }}>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full text-white" style={{ backgroundColor: primary }}><Icon icon="solar:delivery-bold" width={26} /></span>
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: FM.inkSoft }}>Recibe tu pedido en</p>
                  <h3 className="text-2xl font-extrabold" style={{ fontFamily: FM.display, color: FM.ink }}>¡30 minutos!</h3>
                </div>
              </div>
              <p className="mt-3 text-sm" style={{ color: FM.inkSoft }}>Entrega rápida a la puerta de tu casa.</p>
              <a href={`/tienda/${slug}/catalogo`} className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-lg px-5 py-2.5 text-[12px] font-bold text-white" style={{ backgroundColor: FM.greenDark }}>Pedir ahora <Icon icon="solar:arrow-right-linear" width={13} /></a>
            </div>
          </div>
        </motion.section>

        {/* Deal of the Day */}
        <motion.section variants={fmSection} initial="hidden" whileInView="show" viewport={fmViewport} className="mx-auto max-w-7xl px-5 pb-12 md:px-6">
          <SectionHead title={diseno?.supermercadoDealsTitle || 'Ofertas del día'} sub="Los mejores precios, solo por hoy" slug={slug} />
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-black/[0.04]" />)}
            </div>
          ) : deals.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-16 text-center text-neutral-400" style={{ borderColor: FM.line }}>Aún no hay productos publicados.</div>
          ) : renderRow(deals, 'deals')}
        </motion.section>

        {/* Why Choose */}
        <section className="border-y" style={{ borderColor: FM.line, backgroundColor: FM.soft }}>
          <motion.div variants={fmSection} initial="hidden" whileInView="show" viewport={fmViewport} className="mx-auto max-w-7xl px-5 py-14 md:px-6">
            <SectionHead title={diseno?.supermercadoWhyTitle || '¿Por qué elegirnos?'} center />
            <motion.div variants={fmStagger} className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {WHY.map((w) => (
                <motion.div key={w.title} variants={fmCard} className="rounded-xl border bg-white p-5 text-center" style={{ borderColor: FM.line }}>
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full" style={{ backgroundColor: FM.greenSoft, color: FM.greenDark }}><Icon icon={w.icon} width={28} /></span>
                  <p className="mt-3.5 text-[14px] font-bold" style={{ fontFamily: FM.display, color: FM.ink }}>{w.title}</p>
                  <p className="mt-1 text-[12px] leading-5" style={{ color: FM.inkSoft }}>{w.text}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Testimonios + newsletter */}
        <motion.section variants={fmSection} initial="hidden" whileInView="show" viewport={fmViewport} className="mx-auto max-w-7xl px-5 py-14 md:px-6">
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <SectionHead title={diseno?.supermercadoTestimonialsTitle || 'Lo que dicen nuestros clientes'} />
              <motion.div variants={fmStagger} className="grid gap-4 sm:grid-cols-2">
                {TESTIMONIALS.map((t) => (
                  <motion.div key={t.name} variants={fmCard} className="rounded-xl border bg-white p-5" style={{ borderColor: FM.line }}>
                    <div className="flex items-center gap-1" style={{ color: FM.amber }}>{[0, 1, 2, 3, 4].map((i) => <Icon key={i} icon="solar:star-bold" width={15} />)}</div>
                    <p className="mt-3 text-sm leading-6" style={{ color: FM.inkSoft }}>“{t.text}”</p>
                    <p className="mt-3 text-[13px] font-bold" style={{ fontFamily: FM.display, color: FM.ink }}>— {t.name}</p>
                  </motion.div>
                ))}
                <div className="flex flex-col items-center justify-center rounded-xl p-5 text-center text-white" style={{ backgroundColor: FM.greenDark }}>
                  <p className="text-3xl font-extrabold" style={{ fontFamily: FM.display }}>50K+</p>
                  <p className="mt-1 text-sm text-white/80">Clientes felices</p>
                  <div className="mt-2 flex items-center gap-1" style={{ color: FM.amber }}>{[0, 1, 2, 3, 4].map((i) => <Icon key={i} icon="solar:star-bold" width={14} />)}<span className="ml-1 text-xs text-white/70">4.8/5</span></div>
                </div>
              </motion.div>
            </div>
            <div className="flex flex-col justify-center rounded-2xl p-8 text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${FM.greenDark})` }}>
              <h3 className="text-2xl font-extrabold leading-tight" style={{ fontFamily: FM.display }}>{diseno?.supermercadoNewsletterTitle || 'Recibe ofertas exclusivas'}</h3>
              <p className="mt-2 text-sm text-white/80">{diseno?.supermercadoNewsletterSubtitle || 'Suscríbete y recibe las mejores ofertas y novedades.'}</p>
              <form onSubmit={(e) => e.preventDefault()} className="mt-5 flex items-center gap-2 rounded-lg bg-white p-1.5">
                <input type="email" placeholder="Ingresa tu correo" className="h-11 flex-1 border-0 bg-transparent px-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:ring-0" />
                <button type="submit" className="h-11 shrink-0 rounded-lg px-5 text-sm font-bold text-white" style={{ backgroundColor: FM.greenDark }}>{diseno?.supermercadoNewsletterButton || 'Suscribirme'}</button>
              </form>
              <p className="mt-3 text-[11px] text-white/60">Respetamos tu privacidad. Cancela cuando quieras.</p>
            </div>
          </div>
        </motion.section>
      </main>

      <FmFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <FmWhatsAppFab tienda={tienda} />

      <FmCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => { window.location.href = `/tienda/${slug}/checkout`; }} cp={primary} tienda={tienda} />
    </motion.div>
  );
}
