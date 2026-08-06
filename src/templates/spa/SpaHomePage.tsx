import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import TecnologiaCartModal from '@/components/tienda/TecnologiaCartModal';
import { SPA, SpaFooter, SpaHeader, SpaProductCard, SpaProductImage, SpaWhatsAppFab, spaFont, spaPrimary, storeName, waLink, withAlpha } from './SpaParts';
import { spaCard, spaFade, spaPage, spaSection, spaStagger, spaTap, spaViewport } from './motion';

const navigate = (to: string) => { window.location.href = to; };

/** Servicios estrella del spa (enlazan al catálogo por búsqueda). */
const SERVICES = [
  { label: 'Faciales & Skincare', desc: 'Limpieza profunda, antiedad e hidratación.', icon: 'mdi:face-woman-shimmer', q: 'facial', img: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=600&q=80' },
  { label: 'Masajes & Corporales', desc: 'Relajantes, descontracturantes y spa.', icon: 'mdi:spa-outline', q: 'masaje', img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80' },
  { label: 'Uñas · Mani & Pedi', desc: 'Nail art y esmaltado semipermanente.', icon: 'solar:hand-stars-bold', q: 'uñas', img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cabello & Maquillaje', desc: 'Color, peinado y makeup profesional.', icon: 'mdi:content-cut', q: 'cabello', img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80' },
];

const RITUAL = [
  { icon: 'solar:magic-stick-3-bold', title: 'Diagnóstico personalizado', text: 'Analizamos tu piel y necesidades antes de comenzar.' },
  { icon: 'solar:leaf-bold', title: 'Productos de alta gama', text: 'Cosmética profesional dermatológicamente probada.' },
  { icon: 'solar:heart-bold', title: 'Ambiente de descanso', text: 'Espacios amplios, privados y aromatizados para relajarte.' },
];

const PLANS = [
  { name: 'Esencial', price: '149', desc: 'Ideal para mantener tu rutina de cuidado al día.', feats: ['1 facial express al mes', '10% dscto. en tienda', 'Reserva prioritaria'], featured: false },
  { name: 'Aura Glow', price: '289', desc: 'La experiencia completa de bienestar y belleza.', feats: ['2 faciales + 1 masaje al mes', '20% dscto. en todos los servicios', '1 manicure spa de regalo', 'Kit de bienvenida premium'], featured: true },
  { name: 'Luxe', price: '499', desc: 'Cuidado ilimitado y atención de concierge.', feats: ['Servicios faciales ilimitados', '2 masajes + cabello incluido', 'Especialista asignada', 'Invitación a eventos VIP'], featured: false },
];

const GALLERY = [
  'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=600&q=80',
];

const TEAM = [
  { name: 'Sofía Mendoza', role: 'Cosmetóloga · Faciales', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=500&q=80' },
  { name: 'Lucía Fernández', role: 'Terapeuta · Masajes', img: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=500&q=80' },
  { name: 'Mariana Cruz', role: 'Estilista · Color & Cabello', img: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=500&q=80' },
  { name: 'Daniela Ponce', role: 'Makeup Artist', img: 'https://images.unsplash.com/photo-1614289371518-722f2615943d?auto=format&fit=crop&w=500&q=80' },
];

const TESTIMONIALS = [
  { name: 'Valeria Ríos', role: 'Cliente Aura Glow', text: 'Salí renovada. El facial fue increíble y el trato de principio a fin, impecable. Mi piel nunca se había sentido tan cuidada.' },
  { name: 'Camila Torres', role: 'Manicure & Spa', text: 'Reservé por WhatsApp en un minuto. El ambiente es de otro nivel, elegante y súper relajante. Ya soy clienta fija.' },
  { name: 'Andrea Salas', role: 'Pack Novia', text: 'Me maquillaron para mi boda y quedé espectacular. Profesionales de verdad, puntuales y con muchísimo detalle.' },
];

function Eyebrow({ children, color, center }: { children: ReactNode; color: string; center?: boolean }) {
  return (
    <p className={`flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.3em] ${center ? 'justify-center' : ''}`} style={{ color }}>
      <span className="h-px w-6" style={{ backgroundColor: SPA.gold }} />
      {children}
      {center && <span className="h-px w-6" style={{ backgroundColor: SPA.gold }} />}
    </p>
  );
}

export default function SpaHomePage({
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
  const primary = spaPrimary(cp);
  const font = spaFont(diseno);
  const name = storeName(tienda, diseno);
  const featured = productos.slice(0, 8);
  const heroImg = diseno?.spaHeroImage || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80';

  return (
    <motion.div initial="hidden" animate="show" variants={spaPage} className="min-h-screen" style={{ backgroundColor: SPA.cream, fontFamily: font }}>
      {/* ── Barra superior ─────────────────────────────────────────────────── */}
      <div className="w-full text-center" style={{ backgroundColor: SPA.espresso }}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-1 px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/80">
          <span className="flex items-center gap-1.5"><Icon icon="solar:calendar-linear" width={13} style={{ color: SPA.goldSoft }} /> Reserva online 24/7</span>
          <span className="hidden items-center gap-1.5 sm:flex"><Icon icon="solar:heart-linear" width={13} style={{ color: SPA.goldSoft }} /> Atención personalizada</span>
          <span className="flex items-center gap-1.5"><Icon icon="solar:leaf-linear" width={13} style={{ color: SPA.goldSoft }} /> Productos premium</span>
        </div>
      </div>

      <SpaHeader
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
        <section className="relative isolate overflow-hidden" style={{ background: `radial-gradient(110% 110% at 82% 8%, ${SPA.blush} 0%, ${SPA.cream} 55%)` }}>
          <div className="pointer-events-none absolute -bottom-24 left-[8%] h-72 w-72 rounded-full opacity-40 blur-3xl" style={{ background: withAlpha(SPA.nude, 'aa') }} aria-hidden />
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-14 md:grid-cols-2 md:py-20">
            <motion.div variants={spaSection}>
              <Eyebrow color={primary}>{diseno?.spaHeroEyebrow || 'Belleza · Bienestar · Alta cosmética'}</Eyebrow>
              <h1 className="mt-5 text-5xl leading-[1.03] tracking-tight md:text-7xl" style={{ fontFamily: SPA.serif, color: SPA.ink }}>
                {diseno?.spaHeroTitle || 'Renace tu'}{' '}
                <span className="italic" style={{ color: primary }}>{diseno?.spaHeroAccent || 'belleza'}</span>{' '}
                {diseno?.spaHeroTitle2 || 'natural'}
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-neutral-500">
                {diseno?.spaHeroSubtitle || 'Un santuario de lujo donde el cuidado personalizado, los rituales faciales y la relajación profunda se encuentran. Realza tu esencia con manos expertas.'}
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <motion.a
                  href={waLink(tienda, `Hola ${name}, quiero reservar una cita`)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-lg"
                  style={{ backgroundColor: SPA.espresso, boxShadow: `0 20px 40px -18px ${withAlpha(SPA.espresso, 'cc')}` }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={spaTap}
                >
                  Reservar mi cita <Icon icon="solar:arrow-right-linear" width={16} />
                </motion.a>
                <a href={`/tienda/${slug}/catalogo`} className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-7 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-800 transition-colors hover:border-neutral-900">
                  <Icon icon="solar:bag-4-linear" width={16} /> Ver tienda
                </a>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
                {[['solar:check-circle-bold', 'Productos premium'], ['solar:medal-ribbon-bold', 'Especialistas certificados'], ['solar:heart-bold', 'Trato personalizado']].map(([icon, label]) => (
                  <span key={label} className="flex items-center gap-2 text-sm font-medium" style={{ color: SPA.ink }}>
                    <Icon icon={icon} width={18} style={{ color: primary }} /> {label}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Imagen hero */}
            <motion.div variants={spaFade} className="relative">
              <div className="relative mx-auto h-[440px] w-full max-w-md overflow-hidden shadow-[0_40px_90px_-40px_rgba(62,44,48,0.5)] md:h-[560px]" style={{ borderRadius: '280px 280px 26px 26px', background: `linear-gradient(135deg, ${SPA.blush}, ${SPA.nude})` }}>
                <img src={heroImg} alt={name} className="h-full w-full object-cover" />
              </div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }} className="absolute left-1 top-6 flex items-center gap-3 rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-xl backdrop-blur">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: SPA.blush, color: primary }}>
                  <Icon icon="solar:star-bold" width={20} />
                </span>
                <div>
                  <p className="text-sm font-bold" style={{ color: SPA.ink }}>4.9 / 5.0</p>
                  <p className="text-[11px] text-neutral-500">+1,200 reseñas felices</p>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.6 }} className="absolute bottom-8 right-1 flex items-center gap-3 rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-xl backdrop-blur">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: SPA.blush, color: primary }}>
                  <Icon icon="solar:calendar-linear" width={20} />
                </span>
                <div>
                  <p className="text-sm font-bold" style={{ color: SPA.ink }}>Reserva 24/7</p>
                  <p className="text-[11px] text-neutral-500">Cita en 60 segundos</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Servicios ────────────────────────────────────────────────────── */}
        <motion.section variants={spaSection} initial="hidden" whileInView="show" viewport={spaViewport} className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="mb-12 text-center">
            <Eyebrow color={primary} center>Nuestros servicios</Eyebrow>
            <h2 className="mt-4 text-3xl md:text-5xl" style={{ fontFamily: SPA.serif, color: SPA.ink }}>Rituales pensados para <span className="italic" style={{ color: primary }}>tu bienestar</span></h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-neutral-500">Cada tratamiento combina técnica profesional, productos de alta gama y un ambiente diseñado para desconectar.</p>
          </div>
          <motion.div variants={spaStagger} className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {SERVICES.map((s) => (
              <motion.a
                key={s.label}
                variants={spaCard}
                whileHover={{ y: -8 }}
                href={`/tienda/${slug}/catalogo?search=${encodeURIComponent(s.q)}`}
                className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-3xl shadow-sm"
              >
                <img src={s.img} alt={s.label} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(62,44,48,0) 38%, rgba(62,44,48,0.8) 100%)' }} />
                <div className="relative z-10 p-5 text-white">
                  <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: withAlpha(primary, 'e6') }}>
                    <Icon icon={s.icon} width={22} />
                  </span>
                  <h3 className="text-xl" style={{ fontFamily: SPA.serif }}>{s.label}</h3>
                  <p className="mt-1 text-xs text-white/80">{s.desc}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]">
                    Reservar <Icon icon="solar:arrow-right-linear" width={14} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </motion.a>
            ))}
          </motion.div>
        </motion.section>

        {/* ── Ritual / experiencia ─────────────────────────────────────────── */}
        <section style={{ background: `linear-gradient(120deg, ${SPA.mist}, ${SPA.blush})` }}>
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
            <motion.div variants={spaSection} initial="hidden" whileInView="show" viewport={spaViewport}>
              <Eyebrow color={primary}>La experiencia {name}</Eyebrow>
              <h2 className="mt-4 text-3xl md:text-4xl" style={{ fontFamily: SPA.serif, color: SPA.ink }}>Un ritual completo, de principio a fin</h2>
              <p className="mt-4 max-w-md text-sm text-neutral-500">Diseñamos cada visita como una experiencia sensorial: aromaterapia, música envolvente y atención uno a uno.</p>
              <div className="mt-8 space-y-5">
                {RITUAL.map((r) => (
                  <div key={r.title} className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm" style={{ color: primary }}>
                      <Icon icon={r.icon} width={22} />
                    </span>
                    <div>
                      <h4 className="text-base font-semibold" style={{ color: SPA.ink }}>{r.title}</h4>
                      <p className="text-sm text-neutral-500">{r.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <a href={waLink(tienda, `Hola ${name}, quiero vivir la experiencia`)} target="_blank" rel="noreferrer" className="mt-9 inline-flex items-center gap-2 rounded-full px-8 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white" style={{ backgroundColor: SPA.espresso }}>
                Vivir la experiencia <Icon icon="solar:arrow-right-linear" width={16} />
              </a>
            </motion.div>
            <motion.div variants={spaFade} initial="hidden" whileInView="show" viewport={spaViewport} className="relative">
              <div className="relative aspect-[4/3.4] overflow-hidden rounded-3xl shadow-[0_40px_90px_-40px_rgba(62,44,48,0.5)]">
                <img src="https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=800&q=80" alt="Ambiente relajante del spa" className="h-full w-full object-cover" />
              </div>
              <div className="absolute bottom-5 left-5 flex items-center gap-4 rounded-2xl bg-white/95 px-5 py-4 shadow-xl backdrop-blur">
                <span className="text-3xl leading-none" style={{ fontFamily: SPA.serif, color: primary }}>12+</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: SPA.ink }}>Años de experiencia</p>
                  <p className="text-[11px] text-neutral-500">Cuidando tu belleza</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Tienda / productos destacados ────────────────────────────────── */}
        <motion.section variants={spaSection} initial="hidden" whileInView="show" viewport={spaViewport} className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow color={primary}>Tienda virtual</Eyebrow>
              <h2 className="mt-4 text-3xl md:text-4xl" style={{ fontFamily: SPA.serif, color: SPA.ink }}>Belleza para llevar a casa</h2>
            </div>
            <a href={`/tienda/${slug}/catalogo`} className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] hover:opacity-70" style={{ color: SPA.ink }}>
              Ver todo <Icon icon="solar:arrow-right-linear" width={15} />
            </a>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[380px] animate-pulse rounded-3xl bg-black/[0.04]" />)}
            </div>
          ) : featured.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-black/10 py-20 text-center text-neutral-400">Aún no hay productos publicados.</div>
          ) : (
            <motion.div variants={spaStagger} className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {featured.map((producto) => (
                <SpaProductCard key={producto.id} producto={producto} slug={slug} cp={primary} onAddToCart={agregarAlCarrito} onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)} />
              ))}
            </motion.div>
          )}
        </motion.section>

        {/* ── Membresías & paquetes ────────────────────────────────────────── */}
        <section style={{ background: `linear-gradient(180deg, ${SPA.cream}, ${SPA.mist})` }}>
          <motion.div variants={spaSection} initial="hidden" whileInView="show" viewport={spaViewport} className="mx-auto max-w-7xl px-6 py-16 md:py-24">
            <div className="mb-12 text-center">
              <Eyebrow color={primary} center>Membresías & Paquetes</Eyebrow>
              <h2 className="mt-4 text-3xl md:text-5xl" style={{ fontFamily: SPA.serif, color: SPA.ink }}>Consiente tu belleza <span className="italic" style={{ color: primary }}>todo el año</span></h2>
            </div>
            <motion.div variants={spaStagger} className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
              {PLANS.map((p) => (
                <motion.div
                  key={p.name}
                  variants={spaCard}
                  className="relative flex flex-col rounded-3xl p-8 shadow-sm"
                  style={p.featured ? { background: `linear-gradient(165deg, ${SPA.espresso}, #573E3C)`, color: '#F1E4DC' } : { backgroundColor: '#fff', border: '1px solid #EADCD1' }}
                >
                  {p.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-white" style={{ backgroundColor: SPA.gold }}>Más popular</span>
                  )}
                  <p className="text-[13px] font-semibold uppercase tracking-[0.14em]" style={{ color: p.featured ? SPA.goldSoft : SPA.roseDeep }}>{p.name}</p>
                  <p className="mt-3 text-4xl" style={{ fontFamily: SPA.serif, color: p.featured ? '#fff' : SPA.ink }}>S/ {p.price}<span className="text-sm font-normal text-neutral-400">/mes</span></p>
                  <p className="mt-3 border-b pb-5 text-sm" style={{ borderColor: p.featured ? 'rgba(255,255,255,0.15)' : '#EADCD1', color: p.featured ? 'rgba(255,255,255,0.75)' : '#6C575B' }}>{p.desc}</p>
                  <ul className="my-6 flex-1 space-y-3">
                    {p.feats.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm" style={{ color: p.featured ? '#F0E4DC' : '#6C575B' }}>
                        <Icon icon="solar:check-circle-bold" width={18} style={{ color: p.featured ? SPA.goldSoft : primary }} className="mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={waLink(tienda, `Hola ${name}, me interesa la membresía ${p.name}`)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto inline-flex items-center justify-center rounded-full px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] transition-transform hover:-translate-y-0.5"
                    style={p.featured ? { backgroundColor: primary, color: '#fff' } : { border: `1.5px solid ${SPA.nude}`, color: SPA.espresso }}
                  >
                    Elegir {p.name}
                  </a>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ── Galería ──────────────────────────────────────────────────────── */}
        <motion.section variants={spaSection} initial="hidden" whileInView="show" viewport={spaViewport} className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="mb-12 text-center">
            <Eyebrow color={primary} center>Galería</Eyebrow>
            <h2 className="mt-4 text-3xl md:text-5xl" style={{ fontFamily: SPA.serif, color: SPA.ink }}>Resultados que <span className="italic" style={{ color: primary }}>hablan por sí solos</span></h2>
          </div>
          <motion.div variants={spaStagger} className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {GALLERY.map((src, i) => (
              <motion.div key={src} variants={spaCard} className={`group relative overflow-hidden rounded-2xl ${i === 0 ? 'md:row-span-2 md:col-span-1' : ''} ${i === 2 ? 'col-span-2' : ''}`} style={{ aspectRatio: i === 0 ? '3/4' : i === 2 ? '2/1' : '1/1' }}>
                <img src={src} alt="Trabajo del spa" loading="lazy" className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.08]" />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* ── Testimonios ──────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden" style={{ backgroundColor: SPA.espresso }}>
          <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full opacity-40 blur-3xl" style={{ background: `radial-gradient(circle, ${withAlpha(primary, '66')}, transparent 70%)` }} aria-hidden />
          <motion.div variants={spaSection} initial="hidden" whileInView="show" viewport={spaViewport} className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
            <div className="mb-12 text-center">
              <Eyebrow color={SPA.goldSoft} center>Testimonios</Eyebrow>
              <h2 className="mt-4 text-3xl text-white md:text-5xl" style={{ fontFamily: SPA.serif }}>Lo que dicen nuestras <span className="italic" style={{ color: SPA.rose }}>clientas</span></h2>
            </div>
            <motion.div variants={spaStagger} className="grid gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <motion.div key={t.name} variants={spaCard} className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.05] p-8 backdrop-blur">
                  <div className="mb-4 flex gap-1" style={{ color: SPA.gold }}>{'★★★★★'}</div>
                  <blockquote className="flex-1 text-[17px] leading-relaxed text-white/90" style={{ fontFamily: SPA.serif, fontStyle: 'italic' }}>“{t.text}”</blockquote>
                  <div className="mt-6 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${SPA.espresso})` }}>{t.name.charAt(0)}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-xs" style={{ color: SPA.goldSoft }}>{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ── Equipo ───────────────────────────────────────────────────────── */}
        <motion.section variants={spaSection} initial="hidden" whileInView="show" viewport={spaViewport} className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="mb-12 text-center">
            <Eyebrow color={primary} center>Nuestro equipo</Eyebrow>
            <h2 className="mt-4 text-3xl md:text-5xl" style={{ fontFamily: SPA.serif, color: SPA.ink }}>Especialistas que <span className="italic" style={{ color: primary }}>aman lo que hacen</span></h2>
          </div>
          <motion.div variants={spaStagger} className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {TEAM.map((m) => (
              <motion.div key={m.name} variants={spaCard} className="text-center">
                <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-3xl shadow-sm">
                  <img src={m.img} alt={m.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
                </div>
                <h4 className="text-lg" style={{ fontFamily: SPA.serif, color: SPA.ink }}>{m.name}</h4>
                <p className="text-sm" style={{ color: SPA.roseDeep }}>{m.role}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* ── Reserva CTA ──────────────────────────────────────────────────── */}
        <section style={{ background: `linear-gradient(150deg, ${SPA.blush}, ${SPA.nude})` }}>
          <motion.div variants={spaSection} initial="hidden" whileInView="show" viewport={spaViewport} className="mx-auto max-w-4xl px-6 py-16 text-center md:py-24">
            <Eyebrow color={primary} center>Reserva online</Eyebrow>
            <h2 className="mt-4 text-3xl md:text-5xl" style={{ fontFamily: SPA.serif, color: SPA.ink }}>Agenda tu cita en <span className="italic" style={{ color: primary }}>60 segundos</span></h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-neutral-600">Escríbenos por WhatsApp, elige tu servicio y recibe confirmación al instante. Sin llamadas, sin esperas.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a href={waLink(tienda, `Hola ${name}, quiero reservar una cita`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-lg" style={{ backgroundColor: '#25D366' }}>
                <Icon icon="mdi:whatsapp" width={18} /> Reservar por WhatsApp
              </a>
              <a href={`/tienda/${slug}/catalogo`} className="inline-flex items-center gap-2 rounded-full border border-neutral-400/50 px-8 py-4 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: SPA.espresso }}>
                Comprar productos
              </a>
            </div>
          </motion.div>
        </section>

        {/* ── Beneficios ───────────────────────────────────────────────────── */}
        <section className="border-y border-black/[0.05] bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
            {[
              ['solar:leaf-bold', 'Productos premium', 'Cosmética de alta gama'],
              ['solar:medal-ribbon-bold', 'Especialistas', 'Equipo certificado'],
              ['solar:calendar-bold', 'Reserva 24/7', 'Agenda cuando quieras'],
              ['solar:heart-bold', 'Trato personalizado', 'Atención uno a uno'],
            ].map(([icon, title, text]) => (
              <div key={title} className="flex flex-col items-center text-center">
                <Icon icon={icon} width={26} style={{ color: primary }} />
                <p className="mt-3 text-sm font-semibold" style={{ color: SPA.ink }}>{title}</p>
                <p className="mt-1 text-xs text-neutral-500">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SpaFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <SpaWhatsAppFab tienda={tienda} />

      <TecnologiaCartModal
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
