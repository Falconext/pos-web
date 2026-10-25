import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import { VerenaHeader, VerenaFooter, VerenaCartModal, verenaTheme, useVerenaFont, ed, vrMoney, storeNameOf, VR, type Theme } from './VerenaParts';
import { PageHero, SectionHeader, buildBenefits, storeChannels, getName, type Channels } from './VerenaSections';
import { mix, vrEase, vrItem, vrReveal, vrStagger, vrViewport } from './motion';

/** Foto de ejemplo del encabezado (reemplazable en Personalizar). */
const CONTACT_IMG = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=80';

type Channel = { key: string; icon: string; tint: string; color: string; title: string; value: string; action?: { label: string; href: string } };

export default function VerenaContactPage({ tienda, slug, diseno: disenoProp, allCategories, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, actualizarCantidad, onNavigate }: any) {
  useVerenaFont();
  const navigate = useNavigate();
  const diseno = disenoProp || tienda?.diseno || {};
  const t = verenaTheme(diseno);
  const ch = storeChannels(tienda, diseno);
  const [showFav, setShowFav] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);
  const categories: string[] = (allCategories || []).map(getName).filter(Boolean);
  const cartCount = (carrito || []).reduce((s: number, i: any) => s + Number(i?.cantidad || 1), 0);
  const storeName = storeNameOf(tienda) || 'nuestra tienda';

  // En la vista previa del editor, la navegación cambia de página sin salir del panel.
  const pageOf = (url: string) => (url.includes('/catalogo') ? 'catalogo' : url.includes('/contacto') ? 'contacto' : url.includes('/checkout') ? 'checkout' : url.includes('/producto/') ? 'producto' : url.endsWith(`/${slug}`) ? 'home' : undefined);
  const nav = (url: string) => { const page = pageOf(url); if (onNavigate && page) onNavigate(page); else navigate(url); };
  const goProduct = (p: any) => nav(`/tienda/${slug}/producto/${p.id}`);

  useEffect(() => {
    if (window.location.hash !== '#faq') return;
    const id = window.setTimeout(() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
    return () => window.clearTimeout(id);
  }, []);

  const channels: Channel[] = [];
  if (ch.hasWhatsapp) channels.push({ key: 'wa', icon: 'ic:baseline-whatsapp', tint: '#E8F7EE', color: '#1A9E4E', title: 'WhatsApp', value: ch.whatsappLabel || 'Escríbenos', action: { label: 'Escribir ahora', href: ch.wa('Hola, tengo una consulta.') || '#' } });
  if (ch.address) channels.push({ key: 'map', icon: 'solar:map-point-linear', tint: mix(t.primary, 10), color: t.primary, title: 'Visítanos', value: ch.address, action: ch.mapsUrl ? { label: 'Cómo llegar', href: ch.mapsUrl } : undefined });
  if (ch.horario) channels.push({ key: 'time', icon: 'solar:clock-circle-linear', tint: mix(t.accent, 12), color: t.accent, title: 'Horario', value: ch.horario });
  for (const s of ch.socials) channels.push({ key: s.label, icon: s.icon, tint: '#F1EEE9', color: t.ink, title: s.label, value: 'Síguenos', action: { label: 'Ver perfil', href: s.url } });
  const cols: Record<number, string> = { 1: 'lg:grid-cols-1 max-w-md mx-auto', 2: 'lg:grid-cols-2 max-w-3xl mx-auto', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-3' };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, fontFamily: t.font }}>
        <VerenaHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} onSearch={(v) => nav(`/tienda/${slug}/catalogo${v ? `?search=${encodeURIComponent(v)}` : ''}`)} navigate={nav} active="contact" />

        <PageHero
          t={t}
          crumbs={[{ label: 'Inicio', onClick: () => nav(`/tienda/${slug}`) }, { label: 'Contacto' }]}
          eyebrow={ed(diseno, 'ContactEyebrow', 'Contacto')}
          title={ed(diseno, 'ContactTitle', 'Estamos para ayudarte')}
          subtitle={ed(diseno, 'ContactSubtitle', `Dudas sobre modelos, medidas, pedidos o entregas en ${storeName}: te respondemos personalmente.`)}
          image={String(diseno?.[`${VR}ContactImage`] || '').trim() || CONTACT_IMG}
        />

        {channels.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pt-10 lg:px-6">
            <motion.div variants={vrStagger} initial="hidden" animate="show" className={`grid gap-4 sm:grid-cols-2 ${cols[channels.length] || 'lg:grid-cols-4'}`}>
              {channels.map((c) => (
                <motion.div key={c.key} variants={vrItem} whileHover={{ y: -4 }} className="flex flex-col rounded-2xl border bg-white p-6 transition-shadow duration-300 hover:shadow-[0_24px_46px_-30px_rgba(23,25,27,0.45)]" style={{ borderColor: t.line }}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: c.tint, color: c.color }}><Icon icon={c.icon} width={25} /></span>
                  <p className="mt-5 text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: t.muted }}>{c.title}</p>
                  <p className="mt-1.5 break-words text-[15.5px] font-bold leading-snug" style={{ color: t.ink }}>{c.value}</p>
                  {c.action && (
                    <a href={c.action.href} target="_blank" rel="noopener noreferrer" className="group mt-auto inline-flex items-center gap-1.5 pt-5 text-[14px] font-semibold" style={{ color: c.color }}>
                      {c.action.label}
                      <Icon icon="solar:arrow-right-linear" width={17} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 lg:grid-cols-[1.35fr_1fr] lg:px-6">
          {ch.mapsEmbed ? (
            <motion.div variants={vrReveal} initial="hidden" whileInView="show" viewport={vrViewport} className="relative min-h-[380px] overflow-hidden rounded-[24px] border bg-white" style={{ borderColor: t.line }}>
              <iframe title={`Ubicación de ${storeName}`} src={ch.mapsEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0" style={{ filter: 'saturate(0.8) contrast(1.03)' }} />
              <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex sm:right-auto">
                <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-[0_20px_40px_-24px_rgba(23,25,27,0.5)] backdrop-blur">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: t.primary, color: t.onPrimary }}><Icon icon="solar:bag-4-bold" width={21} /></span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-bold" style={{ color: t.ink }}>{storeName}</p>
                    <p className="truncate text-[12.5px]" style={{ color: t.muted }}>{ch.address}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div variants={vrReveal} initial="hidden" whileInView="show" viewport={vrViewport} className="flex min-h-[300px] flex-col items-center justify-center rounded-[24px] px-8 text-center" style={{ background: t.cream }}>
              <Icon icon="solar:bag-heart-linear" width={50} style={{ color: t.primary }} />
              <p className="mt-4 text-[17px] font-bold" style={{ color: t.ink }}>Tienda 100% en línea</p>
              <p className="mt-1 max-w-xs text-[14px]" style={{ color: t.muted }}>Haz tu pedido desde la tienda y te lo hacemos llegar.</p>
            </motion.div>
          )}
          <StoreCard t={t} tienda={tienda} diseno={diseno} ch={ch} storeName={storeName} onCatalog={() => nav(`/tienda/${slug}/catalogo`)} />
        </section>

        {ch.hasWhatsapp && <MessageForm t={t} diseno={diseno} ch={ch} />}
        <Faq t={t} diseno={diseno} tienda={tienda} ch={ch} />

        <VerenaFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={nav} />

        <VerenaCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => nav(`/tienda/${slug}/checkout`)} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.primary} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.primary} onGoProduct={(item: any) => goProduct(item)} />
      </div>
    </MotionConfig>
  );
}

// ────────────────────────────────────────────────────────────── piezas ──
function StoreCard({ t, tienda, diseno, ch, storeName, onCatalog }: { t: Theme; tienda: any; diseno: any; ch: Channels; storeName: string; onCatalog: () => void }) {
  const benefits = buildBenefits(tienda, diseno, ch.hasWhatsapp).filter((b) => b.key !== 'quality');
  return (
    <motion.div variants={vrReveal} initial="hidden" whileInView="show" viewport={vrViewport} className="relative flex flex-col overflow-hidden rounded-[24px] p-8" style={{ background: t.primary, color: t.onPrimary }}>
      <Icon aria-hidden icon="ph:handbag-light" width={220} className="pointer-events-none absolute -bottom-12 -right-10 opacity-[0.08]" />
      <p className="relative text-[12px] font-bold uppercase tracking-[0.16em] opacity-75">Nuestra tienda</p>
      <h3 className="relative mt-2 text-[30px] font-bold leading-tight" style={{ fontFamily: t.serif }}>{storeName}</h3>
      {tienda?.descripcionTienda && <p className="relative mt-3 text-[14.5px] leading-relaxed opacity-85">{tienda.descripcionTienda}</p>}
      <ul className="relative mt-6 space-y-2.5">
        {benefits.map((b) => (
          <li key={b.key} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: mix(t.onPrimary, 10, 'transparent') }}>
            <Icon icon={b.icon} width={24} className="shrink-0" />
            <p className="text-[14px]"><span className="font-bold">{b.title}</span> <span className="opacity-75">· {b.sub}</span></p>
          </li>
        ))}
      </ul>
      <div className="relative mt-auto pt-7">
        <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={onCatalog} className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-[14.5px] font-bold" style={{ color: t.ink }}>
          Ver la colección <Icon icon="solar:arrow-right-linear" width={18} />
        </motion.button>
      </div>
    </motion.div>
  );
}

const MOTIVOS = ['Consulta sobre un producto', 'Disponibilidad de colores o modelos', 'Estado de mi pedido', 'Otro'];

/** Formulario honesto: arma el mensaje y lo abre en WhatsApp. Nunca simula un "enviado". */
function MessageForm({ t, diseno, ch }: { t: Theme; diseno: any; ch: Channels }) {
  const [nombre, setNombre] = useState('');
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [mensaje, setMensaje] = useState('');
  const [errors, setErrors] = useState<{ nombre?: string; mensaje?: string }>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (nombre.trim().length < 2) next.nombre = 'Escribe tu nombre.';
    if (mensaje.trim().length < 5) next.mensaje = 'Cuéntanos brevemente en qué te ayudamos.';
    setErrors(next);
    if (Object.keys(next).length) return;
    const url = ch.wa(`Hola, soy ${nombre.trim()}.\nMotivo: ${motivo}\n\n${mensaje.trim()}`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const box = (err?: string) => ({ borderColor: err ? '#F43F5E' : t.line });
  const ctrl = 'w-full min-w-0 border-0 bg-transparent bg-none p-0 text-[14.5px] font-medium text-[#17191B] outline-none placeholder:font-normal placeholder:text-[#A3A7A9] focus:ring-0';

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 lg:px-6">
      <motion.div variants={vrReveal} initial="hidden" whileInView="show" viewport={vrViewport} className="grid gap-10 overflow-hidden rounded-[28px] p-8 sm:p-12 lg:grid-cols-[1fr_1.3fr]" style={{ background: t.cream }}>
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: t.accent }}>{ed(diseno, 'FormEyebrow', 'Escríbenos')}</p>
          <h2 className="mt-2 text-[32px] font-bold leading-tight tracking-[-0.02em]" style={{ color: t.ink, fontFamily: t.serif }}>{ed(diseno, 'FormTitle', '¿En qué te ayudamos?')}</h2>
          <p className="mt-3 text-[15px] leading-relaxed" style={{ color: t.muted }}>Completa el formulario y se abrirá WhatsApp con tu mensaje listo para enviar. Te responderemos lo antes posible.</p>
        </div>
        <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1.5 block text-[12.5px] font-semibold" style={{ color: t.muted }}>Nombre *</span>
            <span className="flex h-12 items-center rounded-xl border bg-white px-4" style={box(errors.nombre)}><input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" aria-invalid={Boolean(errors.nombre)} className={ctrl} /></span>
            {errors.nombre && <span className="mt-1 block text-[12px] font-medium text-rose-500">{errors.nombre}</span>}
          </label>
          <label>
            <span className="mb-1.5 block text-[12.5px] font-semibold" style={{ color: t.muted }}>Motivo</span>
            <span className="relative flex h-12 items-center rounded-xl border bg-white px-4" style={box()}>
              <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className={`${ctrl} appearance-none pr-6`}>
                {MOTIVOS.map((m) => <option key={m}>{m}</option>)}
              </select>
              <Icon icon="solar:alt-arrow-down-linear" width={16} className="pointer-events-none absolute right-4" style={{ color: t.muted }} />
            </span>
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-[12.5px] font-semibold" style={{ color: t.muted }}>Mensaje *</span>
            <span className="block rounded-xl border bg-white px-4 py-3" style={box(errors.mensaje)}><textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={5} placeholder="Escribe tu consulta…" aria-invalid={Boolean(errors.mensaje)} className={`${ctrl} resize-none`} /></span>
            {errors.mensaje && <span className="mt-1 block text-[12px] font-medium text-rose-500">{errors.mensaje}</span>}
          </label>
          <motion.button type="submit" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl px-8 text-[15px] font-bold text-white sm:col-span-2 sm:w-max" style={{ background: '#1A9E4E' }}>
            <Icon icon="ic:baseline-whatsapp" width={21} /> Enviar por WhatsApp
          </motion.button>
        </form>
      </motion.div>
    </section>
  );
}

/** Preguntas frecuentes con respuestas derivadas de la configuración real de la tienda. */
function Faq({ t, diseno, tienda, ch }: { t: Theme; diseno: any; tienda: any; ch: Channels }) {
  const envio = Number(tienda?.costoEnvioFijo || 0);
  const prep = Number(tienda?.tiempoPreparacionMin || 0);
  const items = [
    {
      q: '¿Hacen envíos a domicilio?',
      a: tienda?.aceptaEnvio === false
        ? 'Por ahora atendemos solo con recojo en tienda.'
        : `Sí, enviamos tu pedido a domicilio. ${envio > 0 ? `El envío cuesta desde ${vrMoney(envio)}.` : 'El costo de envío se muestra al finalizar tu compra.'}`,
    },
    {
      q: '¿Puedo recoger mi pedido en la tienda?',
      a: tienda?.aceptaRecojo
        ? `Sí. Tu pedido estará listo ${prep > 0 ? `en aproximadamente ${prep} minutos` : 'en poco tiempo'}${ch.pickupAddress ? ` en ${ch.pickupAddress}` : ''}.`
        : 'Por ahora solo realizamos envíos a domicilio.',
    },
    { q: '¿Cómo sé qué colores o modelos hay disponibles?', a: 'En la ficha de cada producto verás los colores y opciones con stock real. Si una opción aparece tachada, por ahora no está disponible.' },
    { q: '¿Qué medios de pago aceptan?', a: 'Verás todos los medios de pago disponibles en el último paso de tu compra, antes de confirmar el pedido.' },
    { q: '¿Cómo sigo mi pedido?', a: 'Al confirmar tu compra recibirás un código de seguimiento para consultar el estado de tu pedido cuando quieras.' },
  ];
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-4xl scroll-mt-24 px-4 pb-16 lg:px-6">
      <SectionHeader t={t} eyebrow="Ayuda" title={ed(diseno, 'FaqTitle', 'Preguntas frecuentes')} />
      <motion.div variants={vrStagger} initial="hidden" whileInView="show" viewport={vrViewport} className="space-y-3">
        {items.map((it, i) => {
          const isOpen = open === i;
          return (
            <motion.div key={it.q} variants={vrItem} className="overflow-hidden rounded-2xl border bg-white transition-colors duration-300" style={{ borderColor: isOpen ? mix(t.primary, 35) : t.line }}>
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
                <span className="text-[15.5px] font-bold" style={{ color: t.ink }}>{it.q}</span>
                <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.25, ease: vrEase }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: isOpen ? t.primary : t.cream, color: isOpen ? t.onPrimary : t.primary }}>
                  <Icon icon="solar:add-circle-linear" width={20} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: vrEase }}>
                    <p className="px-6 pb-6 text-[14.5px] leading-relaxed" style={{ color: t.muted }}>{it.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
