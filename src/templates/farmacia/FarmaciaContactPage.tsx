import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import { FarmaciaHeader, FarmaciaFooter, FarmaciaCartModal, farmaciaTheme, useFarmaciaFont, editable, fmMoney } from './FarmaciaParts';
import { PageHero, SectionHeader, buildServices, storeChannels, getName, type Theme } from './FarmaciaSections';
import { fmEase, fmItem, fmReveal, fmStagger, fmViewport, mix } from './motion';

type Channel = { key: string; icon: string; tint: string; color: string; title: string; value: string; action?: { label: string; href: string; external?: boolean } };

export default function FarmaciaContactPage({ tienda, slug, diseno: disenoProp, allCategories, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, actualizarCantidad, onNavigate }: any) {
  useFarmaciaFont();
  const navigate = useNavigate();
  const diseno = disenoProp || tienda?.diseno || {};
  const t = farmaciaTheme(diseno);
  const ch = storeChannels(tienda, diseno);
  const [showFav, setShowFav] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);
  const categories: string[] = (allCategories || []).map(getName).filter(Boolean);
  const cartCount = (carrito || []).reduce((s: number, i: any) => s + Number(i?.cantidad || 1), 0);
  const storeName = tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || 'nuestra farmacia';
  const go = (url: string, page?: string) => { if (onNavigate && page) onNavigate(page); else navigate(url); };
  const goProduct = (p: any) => go(`/tienda/${slug}/producto/${p.id}`, 'producto');
  // Enlace "Preguntas frecuentes" del footer (/contacto#faq): baja a esa sección al cargar.
  useEffect(() => {
    if (window.location.hash !== '#faq') return;
    const id = window.setTimeout(() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
    return () => window.clearTimeout(id);
  }, []);

  // Solo canales reales, en orden de rapidez de respuesta.
  const channels: Channel[] = [];
  if (ch.hasWhatsapp) channels.push({ key: 'wa', icon: 'ic:baseline-whatsapp', tint: '#E7F8EE', color: '#1FA855', title: 'WhatsApp', value: ch.whatsappLabel || 'Escríbenos', action: { label: 'Escribir ahora', href: ch.wa('Hola, tengo una consulta.') || '#', external: true } });
  if (ch.phoneHref) channels.push({ key: 'tel', icon: 'solar:phone-calling-bold-duotone', tint: mix(t.primary, 11), color: t.primary, title: 'Teléfono', value: ch.phoneLabel || '', action: { label: 'Llamar', href: ch.phoneHref } });
  if (ch.email) channels.push({ key: 'mail', icon: 'solar:letter-bold-duotone', tint: '#EAF0FB', color: '#3B5BA9', title: 'Correo', value: ch.email, action: { label: 'Enviar correo', href: `mailto:${ch.email}` } });
  if (ch.address) channels.push({ key: 'map', icon: 'solar:map-point-wave-bold-duotone', tint: '#FDEAF1', color: '#B83280', title: 'Visítanos', value: ch.address, action: ch.mapsUrl ? { label: 'Cómo llegar', href: ch.mapsUrl, external: true } : undefined });
  if (ch.horario) channels.push({ key: 'time', icon: 'solar:clock-circle-bold-duotone', tint: '#FBF0E6', color: '#C2751A', title: 'Horario', value: ch.horario });
  const cols: Record<number, string> = { 1: 'lg:grid-cols-1 max-w-md mx-auto', 2: 'lg:grid-cols-2 max-w-3xl mx-auto', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5' };

  const canMessage = ch.hasWhatsapp || Boolean(ch.email);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, fontFamily: t.font }}>
        <FarmaciaHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} onSearch={(v: string) => go(`/tienda/${slug}/catalogo?search=${encodeURIComponent(v)}`, 'catalogo')} navigate={navigate} />

        <PageHero
          t={t}
          crumbs={[{ label: 'Inicio', onClick: () => go(`/tienda/${slug}`, 'home') }, { label: 'Contacto' }]}
          eyebrow="Contacto"
          title={editable(diseno?.farmaciaContactTitle, 'Estamos para cuidarte')}
          subtitle={editable(diseno?.farmaciaContactSubtitle, `Resolvemos tus dudas sobre medicamentos, pedidos y entregas en ${storeName}.`)}
        />

        {/* Canales */}
        {channels.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pt-12 lg:px-6">
            <motion.div variants={fmStagger} initial="hidden" animate="show" className={`grid gap-4 sm:grid-cols-2 ${cols[channels.length] || 'lg:grid-cols-4'}`}>
              {channels.map((c) => (
                <motion.div key={c.key} variants={fmItem} whileHover={{ y: -5 }} className="flex flex-col rounded-3xl border bg-white p-6 transition-shadow duration-300 hover:shadow-[0_26px_50px_-30px_rgba(15,23,42,0.4)]" style={{ borderColor: t.line }}>
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: c.tint, color: c.color }}><Icon icon={c.icon} width={28} /></span>
                  <p className="mt-5 text-[12px] font-black uppercase tracking-[0.16em] text-gray-400">{c.title}</p>
                  <p className="mt-1.5 break-words text-[15.5px] font-black leading-snug" style={{ color: t.ink }}>{c.value}</p>
                  {c.action && (
                    <a href={c.action.href} target={c.action.external ? '_blank' : undefined} rel={c.action.external ? 'noopener noreferrer' : undefined} className="group mt-auto inline-flex items-center gap-1.5 pt-5 text-[13.5px] font-bold" style={{ color: c.color }}>
                      {c.action.label}
                      <Icon icon="solar:arrow-right-linear" width={17} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        {/* Mapa + ficha de la farmacia */}
        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 lg:grid-cols-[1.35fr_1fr] lg:px-6">
          {ch.mapsEmbed ? (
            <motion.div variants={fmReveal} initial="hidden" whileInView="show" viewport={fmViewport} className="relative min-h-[380px] overflow-hidden rounded-[32px] border bg-white" style={{ borderColor: t.line }}>
              <iframe title={`Ubicación de ${storeName}`} src={ch.mapsEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0" style={{ filter: 'saturate(0.85) contrast(1.03)' }} />
              <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex sm:right-auto">
                <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.45)] backdrop-blur">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: t.primary, color: t.onPrimary }}><Icon icon="solar:health-bold" width={22} /></span>
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-black" style={{ color: t.ink }}>{storeName}</p>
                    <p className="truncate text-[12px] text-gray-500">{ch.address}</p>
                  </div>
                  {ch.mapsUrl && <a href={ch.mapsUrl} target="_blank" rel="noopener noreferrer" aria-label="Abrir en Google Maps" className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: mix(t.primary, 12), color: t.primary }}><Icon icon="solar:arrow-right-up-linear" width={18} /></a>}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div variants={fmReveal} initial="hidden" whileInView="show" viewport={fmViewport} className="flex min-h-[300px] flex-col items-center justify-center rounded-[32px] border border-dashed bg-white px-8 text-center" style={{ borderColor: t.line }}>
              <Icon icon="solar:map-point-search-bold-duotone" width={52} style={{ color: t.primary }} />
              <p className="mt-4 text-[16px] font-black" style={{ color: t.ink }}>Atención 100% en línea</p>
              <p className="mt-1 max-w-xs text-[13.5px] text-gray-500">Haz tu pedido desde la tienda y te lo llevamos.</p>
            </motion.div>
          )}

          <StoreCard t={t} tienda={tienda} ch={ch} storeName={storeName} onCatalog={() => go(`/tienda/${slug}/catalogo`, 'catalogo')} />
        </section>

        {canMessage && <MessageForm t={t} ch={ch} />}

        <Faq t={t} tienda={tienda} ch={ch} />

        <FarmaciaFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <FarmaciaCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => go(`/tienda/${slug}/checkout`, 'checkout')} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.primary} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.primary} onGoProduct={(item: any) => goProduct(item)} />
      </div>
    </MotionConfig>
  );
}

// ────────────────────────────────────────────────────────────── piezas ──
function StoreCard({ t, tienda, ch, storeName, onCatalog }: { t: Theme; tienda: any; ch: ReturnType<typeof storeChannels>; storeName: string; onCatalog: () => void }) {
  const services = buildServices(tienda);
  return (
    <motion.div variants={fmReveal} initial="hidden" whileInView="show" viewport={fmViewport} className="relative flex flex-col overflow-hidden rounded-[32px] p-8" style={{ background: `linear-gradient(150deg, ${t.primary} 0%, ${mix(t.primary, 72, '#0B1220')} 100%)`, color: t.onPrimary }}>
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <p className="relative text-[12px] font-black uppercase tracking-[0.2em] opacity-75">Nuestra farmacia</p>
      <h3 className="relative mt-2 text-[28px] font-black leading-tight tracking-[-0.02em]">{storeName}</h3>
      {tienda?.descripcionTienda && <p className="relative mt-3 text-[14px] leading-relaxed opacity-85">{tienda.descripcionTienda}</p>}

      <ul className="relative mt-6 space-y-3">
        {services.map((s) => (
          <li key={s.label} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white" style={{ color: t.primary }}><Icon icon={s.icon} width={19} /></span>
            <p className="text-[13.5px]"><span className="font-black">{s.label}</span> <span className="opacity-75">· {s.sub}</span></p>
          </li>
        ))}
      </ul>

      {ch.socials.length > 0 && (
        <div className="relative mt-6 flex items-center gap-2">
          <span className="mr-1 text-[12px] font-bold opacity-75">Síguenos</span>
          {ch.socials.map((s) => (
            <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"><Icon icon={s.icon} width={20} /></a>
          ))}
        </div>
      )}

      <div className="relative mt-auto pt-7">
        <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={onCatalog} className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[14px] font-black" style={{ color: t.ink }}>
          Ver catálogo <Icon icon="solar:arrow-right-linear" width={18} />
        </motion.button>
      </div>
    </motion.div>
  );
}

const MOTIVOS = ['Consulta sobre un producto', 'Pedido con receta médica', 'Estado de mi pedido', 'Otro'];

/** Formulario honesto: arma el mensaje y lo abre en WhatsApp (o correo). Nunca simula un "enviado". */
function MessageForm({ t, ch }: { t: Theme; ch: ReturnType<typeof storeChannels> }) {
  const [nombre, setNombre] = useState('');
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [mensaje, setMensaje] = useState('');
  const [errors, setErrors] = useState<{ nombre?: string; mensaje?: string }>({});
  const via = ch.hasWhatsapp ? 'WhatsApp' : 'tu correo';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (nombre.trim().length < 2) next.nombre = 'Ingresa tu nombre.';
    if (mensaje.trim().length < 5) next.mensaje = 'Cuéntanos brevemente en qué te ayudamos.';
    setErrors(next);
    if (Object.keys(next).length) return;
    const body = `Hola, soy ${nombre.trim()}.\nMotivo: ${motivo}\n\n${mensaje.trim()}`;
    if (ch.hasWhatsapp) {
      const url = ch.wa(body);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } else if (ch.email) {
      window.location.href = `mailto:${ch.email}?subject=${encodeURIComponent(motivo)}&body=${encodeURIComponent(body)}`;
    }
  };

  const field = (hasError?: string) => `w-full rounded-2xl border bg-white px-4 text-[14.5px] font-semibold text-gray-800 outline-none transition-shadow placeholder:font-medium placeholder:text-gray-400 focus:shadow-[0_0_0_4px_var(--fm-ring)] ${hasError ? 'border-rose-400' : ''}`;
  const ring = { ['--fm-ring' as any]: mix(t.primary, 18, 'transparent') };

  return (
    <section className="mx-auto max-w-7xl px-4 pb-14 lg:px-6">
      <motion.div variants={fmReveal} initial="hidden" whileInView="show" viewport={fmViewport} className="grid gap-10 overflow-hidden rounded-[36px] border bg-white p-8 sm:p-12 lg:grid-cols-[1fr_1.3fr]" style={{ borderColor: t.line }}>
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.18em]" style={{ color: t.accent }}>Escríbenos</p>
          <h2 className="mt-2 text-[30px] font-black leading-tight tracking-[-0.02em]" style={{ color: t.ink }}>¿En qué te podemos ayudar?</h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-gray-500">Completa el formulario y se abrirá {via} con tu mensaje listo para enviar. Nuestro químico farmacéutico te responderá personalmente.</p>
          <div className="mt-7 flex items-center gap-3 rounded-2xl p-4" style={{ background: mix(t.primary, 7) }}>
            <Icon icon="solar:shield-keyhole-bold-duotone" width={26} style={{ color: t.primary }} />
            <p className="text-[12.5px] leading-snug text-gray-600">No compartas datos sensibles de salud por este medio si no es necesario.</p>
          </div>
        </div>

        <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2" style={ring}>
          <label className="sm:col-span-1">
            <span className="mb-1.5 block text-[12.5px] font-bold text-gray-600">Nombre *</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" className={`${field(errors.nombre)} h-12`} style={{ borderColor: errors.nombre ? undefined : t.line }} aria-invalid={Boolean(errors.nombre)} />
            {errors.nombre && <span className="mt-1 block text-[12px] font-semibold text-rose-500">{errors.nombre}</span>}
          </label>
          <label className="sm:col-span-1">
            <span className="mb-1.5 block text-[12.5px] font-bold text-gray-600">Motivo</span>
            <div className="relative">
              <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className={`${field()} h-12 appearance-none pr-10`} style={{ borderColor: t.line }}>
                {MOTIVOS.map((m) => <option key={m}>{m}</option>)}
              </select>
              <Icon icon="solar:alt-arrow-down-linear" width={17} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-[12.5px] font-bold text-gray-600">Mensaje *</span>
            <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={5} placeholder="Escribe tu consulta…" className={`${field(errors.mensaje)} resize-none py-3`} style={{ borderColor: errors.mensaje ? undefined : t.line }} aria-invalid={Boolean(errors.mensaje)} />
            {errors.mensaje && <span className="mt-1 block text-[12px] font-semibold text-rose-500">{errors.mensaje}</span>}
          </label>
          <motion.button type="submit" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full px-8 text-[15px] font-black sm:col-span-2 sm:w-max" style={{ background: ch.hasWhatsapp ? '#1FA855' : t.primary, color: '#fff' }}>
            <Icon icon={ch.hasWhatsapp ? 'ic:baseline-whatsapp' : 'solar:letter-bold'} width={21} /> Enviar por {ch.hasWhatsapp ? 'WhatsApp' : 'correo'}
          </motion.button>
        </form>
      </motion.div>
    </section>
  );
}

/** Preguntas frecuentes con respuestas derivadas de la configuración real de la tienda. */
function Faq({ t, tienda, ch }: { t: Theme; tienda: any; ch: ReturnType<typeof storeChannels> }) {
  const envio = Number(tienda?.costoEnvioFijo || 0);
  const minPrep = Number(tienda?.tiempoPreparacionMin || 0);
  const items = [
    {
      q: '¿Hacen delivery?',
      a: tienda?.aceptaEnvio === false
        ? 'Por ahora solo atendemos con recojo en tienda.'
        : `Sí, llevamos tu pedido a domicilio. ${envio > 0 ? `El envío cuesta desde ${fmMoney(envio)}.` : 'El costo de envío se muestra al finalizar tu compra.'}`,
    },
    {
      q: '¿Puedo recoger mi pedido en la farmacia?',
      a: tienda?.aceptaRecojo
        ? `Sí. Tu pedido estará listo ${minPrep > 0 ? `en aproximadamente ${minPrep} minutos` : 'en poco tiempo'}${ch.pickupAddress ? ` en ${ch.pickupAddress}` : ''}.`
        : 'Por ahora solo realizamos envíos a domicilio.',
    },
    { q: '¿Necesito receta para comprar?', a: 'Los productos de venta libre no requieren receta. Para medicamentos que la requieren, te pediremos la receta médica vigente antes de despachar tu pedido.' },
    { q: '¿Qué medios de pago aceptan?', a: 'Verás todos los medios de pago disponibles en el último paso de tu compra, antes de confirmar el pedido.' },
    { q: '¿Cómo sigo el estado de mi pedido?', a: 'Al confirmar tu compra recibirás un código de seguimiento para consultar el estado de tu pedido en cualquier momento.' },
  ];
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-4xl scroll-mt-24 px-4 pb-20 lg:px-6">
      <SectionHeader t={t} eyebrow="Ayuda" title="Preguntas frecuentes" />
      <motion.div variants={fmStagger} initial="hidden" whileInView="show" viewport={fmViewport} className="space-y-3">
        {items.map((it, i) => {
          const isOpen = open === i;
          return (
            <motion.div key={it.q} variants={fmItem} className="overflow-hidden rounded-2xl border bg-white transition-shadow duration-300" style={{ borderColor: isOpen ? mix(t.primary, 35) : t.line, boxShadow: isOpen ? `0 20px 44px -30px ${mix(t.primary, 70, 'transparent')}` : undefined }}>
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
                <span className="text-[15.5px] font-black" style={{ color: t.ink }}>{it.q}</span>
                <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.25, ease: fmEase }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: isOpen ? t.primary : mix(t.primary, 10), color: isOpen ? t.onPrimary : t.primary }}>
                  <Icon icon="solar:add-circle-linear" width={20} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: fmEase }}>
                    <p className="px-6 pb-6 text-[14.5px] leading-relaxed text-gray-500">{it.a}</p>
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
