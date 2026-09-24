import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import { StrideHeader, StrideFooter, StrideCartModal, StrideMark, buildServices, strideTheme, useStrideFont, editable, stMoney, storeNameOf, displayStyle, type Theme } from './StrideParts';
import { PageHero, SectionHeader, storeChannels, getName, type Channels } from './StrideSections';
import { mix, stEase, stItem, stReveal, stStagger, stViewport } from './motion';

type Channel = { key: string; icon: string; title: string; value: string; action?: { label: string; href: string; external?: boolean } };

export default function StrideContactPage({ tienda, slug, diseno: disenoProp, allCategories, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, actualizarCantidad, onNavigate }: any) {
  useStrideFont();
  const navigate = useNavigate();
  const diseno = disenoProp || tienda?.diseno || {};
  const t = strideTheme(diseno);
  const ch = storeChannels(tienda, diseno);
  const [showFav, setShowFav] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);
  const categories: string[] = (allCategories || []).map(getName).filter(Boolean);
  const cartCount = (carrito || []).reduce((s: number, i: any) => s + Number(i?.cantidad || 1), 0);
  const storeName = storeNameOf(tienda, 'nuestra tienda');
  const go = (url: string, page?: string) => { if (onNavigate && page) onNavigate(page); else navigate(url); };
  const nav = (url: string) => {
    const page = url.includes('/catalogo') ? 'catalogo' : url.includes('/checkout') ? 'checkout' : url.endsWith(`/${slug}`) ? 'home' : undefined;
    go(url, page);
  };
  const goProduct = (p: any) => go(`/tienda/${slug}/producto/${p.id}`, 'producto');

  // Enlace "Preguntas frecuentes" del footer (/contacto#faq): baja a esa sección al cargar.
  useEffect(() => {
    if (window.location.hash !== '#faq') return;
    const id = window.setTimeout(() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
    return () => window.clearTimeout(id);
  }, []);

  // Solo canales reales, en orden de rapidez de respuesta.
  const channels: Channel[] = [];
  if (ch.hasWhatsapp) channels.push({ key: 'wa', icon: 'ic:baseline-whatsapp', title: 'WhatsApp', value: ch.whatsappLabel || 'Escríbenos', action: { label: 'Escribir ahora', href: ch.wa('Hola, tengo una consulta.') || '#', external: true } });
  if (ch.phoneHref) channels.push({ key: 'tel', icon: 'solar:phone-calling-linear', title: 'Teléfono', value: ch.phoneLabel || '', action: { label: 'Llamar', href: ch.phoneHref } });
  if (ch.email) channels.push({ key: 'mail', icon: 'solar:letter-linear', title: 'Correo', value: ch.email, action: { label: 'Enviar correo', href: `mailto:${ch.email}` } });
  if (ch.address) channels.push({ key: 'map', icon: 'solar:map-point-linear', title: 'Tienda', value: ch.address, action: ch.mapsUrl ? { label: 'Cómo llegar', href: ch.mapsUrl, external: true } : undefined });
  if (ch.horario) channels.push({ key: 'time', icon: 'solar:clock-circle-linear', title: 'Horario', value: ch.horario });
  const cols: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5' };
  const canMessage = ch.hasWhatsapp || Boolean(ch.email);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, fontFamily: t.font }}>
        <StrideHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={nav} />

        <PageHero
          t={t}
          crumbs={[{ label: 'Inicio', onClick: () => go(`/tienda/${slug}`, 'home') }, { label: 'Contacto' }]}
          eyebrow="Contacto"
          title={editable(diseno?.zapatosContactTitle, 'Hablemos de tu próximo par')}
          subtitle={editable(diseno?.zapatosContactSubtitle, `Resolvemos tus dudas sobre tallas, modelos, pedidos y entregas en ${storeName}.`)}
        />

        {channels.length > 0 && (
          <section className="mx-auto max-w-[1320px] px-4 pt-8 lg:px-8">
            <motion.div variants={stStagger} initial="hidden" animate="show" className={`grid gap-3 sm:grid-cols-2 ${cols[channels.length] || 'lg:grid-cols-4'}`}>
              {channels.map((c) => (
                <motion.div key={c.key} variants={stItem} className="flex flex-col rounded-[22px] border bg-white p-6" style={{ borderColor: t.line }}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: c.key === 'wa' ? '#E7F8EE' : mix(t.primary, 9, '#fff'), color: c.key === 'wa' ? '#1FA855' : t.primaryInk }}><Icon icon={c.icon} width={24} /></span>
                  <p className="mt-5 text-[10.5px] font-bold uppercase tracking-[0.16em]" style={{ color: t.muted }}>{c.title}</p>
                  <p className="mt-1.5 break-words text-[14.5px] font-bold leading-snug" style={{ color: t.ink }}>{c.value}</p>
                  {c.action && (
                    <a href={c.action.href} target={c.action.external ? '_blank' : undefined} rel={c.action.external ? 'noopener noreferrer' : undefined} className="group mt-auto inline-flex items-center gap-1.5 pt-5 text-[13px] font-bold" style={{ color: t.ink }}>
                      {c.action.label}<Icon icon="solar:arrow-right-linear" width={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        <section className="mx-auto grid max-w-[1320px] gap-4 px-4 py-10 lg:grid-cols-[1.35fr_1fr] lg:px-8">
          {ch.mapsEmbed ? (
            <motion.div variants={stReveal} initial="hidden" whileInView="show" viewport={stViewport} className="relative min-h-[380px] overflow-hidden rounded-[26px] border bg-white" style={{ borderColor: t.line }}>
              <iframe title={`Ubicación de ${storeName}`} src={ch.mapsEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0" style={{ filter: 'grayscale(0.35) contrast(1.02)' }} />
              <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex sm:right-auto">
                <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/70 bg-white/95 py-2 pl-2 pr-4 shadow-[0_20px_40px_-24px_rgba(28,25,23,0.5)] backdrop-blur">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: t.primary, color: t.onPrimary }}><Icon icon="solar:map-point-bold" width={20} /></span>
                  <div className="min-w-0"><p className="truncate text-[13px] font-bold" style={{ color: t.ink }}>{storeName}</p><p className="truncate text-[11.5px]" style={{ color: t.muted }}>{ch.address}</p></div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div variants={stReveal} initial="hidden" whileInView="show" viewport={stViewport} className="flex min-h-[300px] flex-col items-center justify-center rounded-[26px] border border-dashed bg-white/60 px-8 text-center" style={{ borderColor: t.line }}>
              <Icon icon="solar:delivery-linear" width={48} style={{ color: t.primaryInk }} />
              <p className="mt-4 text-[15px] font-extrabold uppercase" style={displayStyle(t, { color: t.ink })}>Tienda 100% en línea</p>
              <p className="mt-1 max-w-xs text-[13px]" style={{ color: t.muted }}>Haz tu pedido desde la web y te lo hacemos llegar.</p>
            </motion.div>
          )}
          <StoreCard t={t} tienda={tienda} ch={ch} storeName={storeName} onCatalog={() => go(`/tienda/${slug}/catalogo`, 'catalogo')} />
        </section>

        {canMessage && <MessageForm t={t} ch={ch} />}
        <Faq t={t} tienda={tienda} ch={ch} />

        <StrideFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={nav} />

        <StrideCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => go(`/tienda/${slug}/checkout`, 'checkout')} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.primary} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.primary} onGoProduct={(item: any) => goProduct(item)} />
      </div>
    </MotionConfig>
  );
}

// ────────────────────────────────────────────────────────────── piezas ──
function StoreCard({ t, tienda, ch, storeName, onCatalog }: { t: Theme; tienda: any; ch: Channels; storeName: string; onCatalog: () => void }) {
  const services = buildServices(tienda, ch.hasWhatsapp);
  return (
    <motion.div variants={stReveal} initial="hidden" whileInView="show" viewport={stViewport} className="relative flex flex-col overflow-hidden rounded-[26px] p-7 sm:p-8" style={{ background: `linear-gradient(150deg, ${t.primary} 0%, ${mix(t.primary, 70, '#111')} 100%)`, color: t.onPrimary }}>
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
      <StrideMark color="currentColor" size={32} />
      <h3 className="relative mt-4 text-[24px] font-extrabold uppercase leading-tight" style={displayStyle(t)}>{storeName}</h3>
      {tienda?.descripcionTienda && <p className="relative mt-2 whitespace-pre-line text-[13.5px] leading-relaxed opacity-85">{tienda.descripcionTienda}</p>}
      <ul className="relative mt-6 space-y-2.5">
        {services.map((s) => (
          <li key={s.label} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
            <Icon icon={s.icon} width={20} className="shrink-0" />
            <p className="text-[13px]"><span className="font-bold">{s.label}</span> <span className="opacity-75">· {s.sub}</span></p>
          </li>
        ))}
      </ul>
      {ch.socials.length > 0 && (
        <div className="relative mt-6 flex items-center gap-2">
          {ch.socials.map((s) => <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"><Icon icon={s.icon} width={19} /></a>)}
        </div>
      )}
      <div className="relative mt-auto pt-7">
        <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={onCatalog} className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[13.5px] font-bold" style={{ color: t.ink }}>Ver catálogo <Icon icon="solar:arrow-right-linear" width={17} /></motion.button>
      </div>
    </motion.div>
  );
}

const MOTIVOS = ['Consulta de talla', 'Disponibilidad de un modelo', 'Estado de mi pedido', 'Cambios', 'Otro'];

/** Formulario honesto: arma el mensaje y lo abre en WhatsApp (o correo). Nunca simula un "enviado". */
function MessageForm({ t, ch }: { t: Theme; ch: Channels }) {
  const [nombre, setNombre] = useState('');
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [mensaje, setMensaje] = useState('');
  const [errors, setErrors] = useState<{ nombre?: string; mensaje?: string }>({});
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (nombre.trim().length < 2) next.nombre = 'Ingresa tu nombre.';
    if (mensaje.trim().length < 5) next.mensaje = 'Cuéntanos brevemente en qué te ayudamos.';
    setErrors(next);
    if (Object.keys(next).length) return;
    const body = `Hola, soy ${nombre.trim()}.\nMotivo: ${motivo}\n\n${mensaje.trim()}`;
    if (ch.hasWhatsapp) { const url = ch.wa(body); if (url) window.open(url, '_blank', 'noopener,noreferrer'); }
    else if (ch.email) window.location.href = `mailto:${ch.email}?subject=${encodeURIComponent(motivo)}&body=${encodeURIComponent(body)}`;
  };
  const box = (err?: string) => ({ boxShadow: `inset 0 0 0 1px ${err ? '#F43F5E' : t.line}` });
  const base = 'w-full appearance-none rounded-2xl border-0 bg-white bg-none px-4 text-[14px] font-medium text-stone-900 outline-none placeholder:text-stone-400 focus:ring-0';

  return (
    <section className="mx-auto max-w-[1320px] px-4 pb-10 lg:px-8">
      <motion.div variants={stReveal} initial="hidden" whileInView="show" viewport={stViewport} className="grid gap-8 rounded-[28px] border p-7 sm:p-10 lg:grid-cols-[1fr_1.3fr]" style={{ borderColor: t.line, background: mix(t.primary, 4, '#fff') }}>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: t.primaryInk }}>Escríbenos</p>
          <h2 className="mt-2 text-[24px] font-extrabold uppercase leading-tight" style={displayStyle(t, { color: t.ink })}>¿En qué te ayudamos?</h2>
          <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: t.muted }}>Completa el formulario y se abrirá {ch.hasWhatsapp ? 'WhatsApp' : 'tu correo'} con el mensaje listo para enviar. Si es sobre tallas, cuéntanos cuánto mide tu pie o qué número usas normalmente.</p>
        </div>
        <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1.5 block text-[12px] font-semibold" style={{ color: t.muted }}>Nombre *</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" className={`${base} h-12`} style={box(errors.nombre)} aria-invalid={Boolean(errors.nombre)} />
            {errors.nombre && <span className="mt-1 block text-[12px] text-rose-500">{errors.nombre}</span>}
          </label>
          <label>
            <span className="mb-1.5 block text-[12px] font-semibold" style={{ color: t.muted }}>Motivo</span>
            <div className="relative">
              <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className={`${base} h-12 pr-10`} style={box()}>
                {MOTIVOS.map((m) => <option key={m}>{m}</option>)}
              </select>
              <Icon icon="solar:alt-arrow-down-linear" width={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" style={{ color: t.muted }} />
            </div>
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-[12px] font-semibold" style={{ color: t.muted }}>Mensaje *</span>
            <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={5} placeholder="Escribe tu consulta…" className={`${base} resize-none py-3`} style={box(errors.mensaje)} aria-invalid={Boolean(errors.mensaje)} />
            {errors.mensaje && <span className="mt-1 block text-[12px] text-rose-500">{errors.mensaje}</span>}
          </label>
          <motion.button type="submit" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full px-8 text-[14px] font-bold sm:col-span-2 sm:w-max" style={ch.hasWhatsapp ? { background: '#1FA855', color: '#fff' } : { background: t.primary, color: t.onPrimary }}>
            <Icon icon={ch.hasWhatsapp ? 'ic:baseline-whatsapp' : 'solar:letter-linear'} width={20} /> Enviar por {ch.hasWhatsapp ? 'WhatsApp' : 'correo'}
          </motion.button>
        </form>
      </motion.div>
    </section>
  );
}

/** Preguntas frecuentes con respuestas derivadas de la configuración real de la tienda. */
function Faq({ t, tienda, ch }: { t: Theme; tienda: any; ch: Channels }) {
  const envio = Number(tienda?.costoEnvioFijo || 0);
  const minPrep = Number(tienda?.tiempoPreparacionMin || 0);
  const items = [
    { q: '¿Cómo elijo mi talla?', a: `Cada modelo muestra las tallas disponibles en su ficha. Si estás entre dos números, ${ch.hasWhatsapp ? 'escríbenos por WhatsApp y te ayudamos a elegir' : 'te recomendamos elegir la mayor'}.` },
    { q: '¿Hacen envíos?', a: tienda?.aceptaEnvio === false ? 'Por ahora solo atendemos con recojo en tienda.' : `Sí, llevamos tu pedido a domicilio. ${envio > 0 ? `El envío cuesta desde ${stMoney(envio)}.` : 'El costo de envío se muestra al finalizar tu compra.'}` },
    { q: '¿Puedo recoger mi pedido?', a: tienda?.aceptaRecojo ? `Sí. Estará listo ${minPrep > 0 ? `en aproximadamente ${minPrep} minutos` : 'en poco tiempo'}${ch.pickupAddress ? ` en ${ch.pickupAddress}` : ''}.` : 'Por ahora solo realizamos envíos a domicilio.' },
    { q: '¿Qué medios de pago aceptan?', a: 'Verás todos los medios de pago disponibles en el último paso de tu compra, antes de confirmar el pedido.' },
    { q: '¿Cómo sigo mi pedido?', a: 'Al confirmar tu compra recibirás un código de seguimiento para consultar el estado de tu pedido en cualquier momento.' },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-4xl scroll-mt-24 px-4 pb-16 lg:px-8">
      <SectionHeader t={t} eyebrow="Ayuda" title="Preguntas frecuentes" />
      <div className="space-y-2.5">
        {items.map((it, i) => {
          const isOpen = open === i;
          return (
            <div key={it.q} className="overflow-hidden rounded-[20px] border bg-white" style={{ borderColor: isOpen ? mix(t.primary, 35, '#fff') : t.line }}>
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
                <span className="text-[14.5px] font-bold" style={{ color: t.ink }}>{it.q}</span>
                <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.25, ease: stEase }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: isOpen ? t.primary : t.soft, color: isOpen ? t.onPrimary : t.ink }}><Icon icon="solar:add-circle-linear" width={19} /></motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: stEase }}>
                    <p className="px-6 pb-6 text-[13.5px] leading-relaxed" style={{ color: t.muted }}>{it.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
