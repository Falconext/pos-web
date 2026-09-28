import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import { BlushHeader, BlushFooter, BlushCartModal, buildServices, blushTheme, useBlushFont, editable, blMoney, storeNameOf, btnCls, MAQUILLAJE_IMG, type Theme } from './BlushParts';
import { PageHero, SectionHeader, storeChannels, getName, type Channels } from './BlushSections';
import { blEase, blItem, blReveal, blStagger, blViewport, mix } from './motion';

type Channel = { key: string; icon: string; title: string; value: string; action?: { label: string; href: string; external?: boolean } };

export default function BlushContactPage({ tienda, slug, diseno: disenoProp, allCategories, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, actualizarCantidad, onNavigate }: any) {
  useBlushFont();
  const navigate = useNavigate();
  const diseno = disenoProp || tienda?.diseno || {};
  const t = blushTheme(diseno);
  const ch = storeChannels(tienda, diseno);
  const [showFav, setShowFav] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);
  const categories: string[] = (allCategories || []).map(getName).filter(Boolean);
  const cartCount = (carrito || []).reduce((s: number, i: any) => s + Number(i?.cantidad || 1), 0);
  const storeName = storeNameOf(tienda, 'nuestra tienda');
  const go = (url: string, page?: string) => { if (onNavigate && page) onNavigate(page); else navigate(url); };
  const nav = (url: string) => {
    const page = url.includes('/catalogo') ? 'catalogo' : url.includes('/checkout') ? 'checkout' : url.includes('/contacto') ? 'contacto' : url.endsWith(`/${slug}`) ? 'home' : undefined;
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
        <BlushHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={nav} active="contact" />

        <PageHero
          t={t}
          image={diseno?.maquillajeContactImage || MAQUILLAJE_IMG.contact}
          crumbs={[{ label: 'Inicio', onClick: () => go(`/tienda/${slug}`, 'home') }, { label: 'Contacto' }]}
          eyebrow="Contacto"
          title={editable(diseno?.maquillajeContactTitle, 'Estamos para ayudarte')}
          subtitle={editable(diseno?.maquillajeContactSubtitle, `Resolvemos tus dudas sobre productos, tonos, pedidos y entregas en ${storeName}.`)}
        />

        {channels.length > 0 && (
          <section className="mx-auto max-w-[1280px] px-4 pt-10 lg:px-8">
            <motion.div variants={blStagger} initial="hidden" animate="show" className={`grid gap-px ${channels.length === 1 ? 'max-w-md' : `sm:grid-cols-2 ${cols[channels.length] || 'lg:grid-cols-4'}`}`} style={{ background: t.line, boxShadow: `0 0 0 1px ${t.line}` }}>
              {channels.map((c) => (
                <motion.div key={c.key} variants={blItem} className="flex flex-col bg-white p-7">
                  <Icon icon={c.icon} width={24} style={{ color: c.key === 'wa' ? '#1FA855' : t.ink }} />
                  <p className="mt-6 text-[10.5px] font-semibold uppercase tracking-[0.2em]" style={{ color: t.muted }}>{c.title}</p>
                  <p className="mt-1.5 break-words text-[14.5px] font-medium leading-snug" style={{ color: t.ink }}>{c.value}</p>
                  {c.action && (
                    <a href={c.action.href} target={c.action.external ? '_blank' : undefined} rel={c.action.external ? 'noopener noreferrer' : undefined} className="mt-auto w-max border-b pt-6 text-[11px] font-semibold uppercase tracking-[0.16em] transition-opacity hover:opacity-60" style={{ color: t.ink, borderColor: t.ink }}>
                      {c.action.label}
                    </a>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        <section className="mx-auto grid max-w-[1280px] gap-4 px-4 py-10 lg:grid-cols-[1.35fr_1fr] lg:px-8">
          {ch.mapsEmbed ? (
            <motion.div variants={blReveal} initial="hidden" whileInView="show" viewport={blViewport} className="relative min-h-[380px] overflow-hidden" style={{ background: t.card }}>
              <iframe title={`Ubicación de ${storeName}`} src={ch.mapsEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0" style={{ filter: 'grayscale(0.55) contrast(1.02)' }} />
              <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex sm:right-auto">
                <div className="pointer-events-auto flex items-center gap-3 bg-white/95 py-2.5 pl-2.5 pr-5 shadow-[0_20px_40px_-24px_rgba(28,23,24,0.5)] backdrop-blur">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center" style={{ background: t.primary, color: t.onPrimary }}><Icon icon="solar:map-point-bold" width={19} /></span>
                  <div className="min-w-0"><p className="truncate text-[12.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: t.ink }}>{storeName}</p><p className="truncate text-[11.5px]" style={{ color: t.muted }}>{ch.address}</p></div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div variants={blReveal} initial="hidden" whileInView="show" viewport={blViewport} className="flex min-h-[300px] flex-col items-center justify-center px-8 text-center" style={{ background: t.blushSoft }}>
              <Icon icon="solar:delivery-linear" width={40} style={{ color: t.ink }} />
              <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.16em]" style={{ color: t.ink }}>Tienda en línea</p>
              <p className="mt-1.5 max-w-xs text-[13px]" style={{ color: t.muted }}>Haz tu pedido desde la web y te lo hacemos llegar.</p>
            </motion.div>
          )}
          <StoreCard t={t} tienda={tienda} ch={ch} storeName={storeName} onCatalog={() => go(`/tienda/${slug}/catalogo`, 'catalogo')} />
        </section>

        {canMessage && <MessageForm t={t} ch={ch} diseno={diseno} />}
        <Faq t={t} tienda={tienda} ch={ch} diseno={diseno} />

        <BlushFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={nav} />

        <BlushCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => go(`/tienda/${slug}/checkout`, 'checkout')} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.accent} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.accent} onGoProduct={(item: any) => goProduct(item)} />
      </div>
    </MotionConfig>
  );
}

// ────────────────────────────────────────────────────────────── piezas ──
function StoreCard({ t, tienda, ch, storeName, onCatalog }: { t: Theme; tienda: any; ch: Channels; storeName: string; onCatalog: () => void }) {
  const services = buildServices(tienda, ch.hasWhatsapp);
  return (
    <motion.div variants={blReveal} initial="hidden" whileInView="show" viewport={blViewport} className="relative flex flex-col overflow-hidden p-8 sm:p-9" style={{ background: `linear-gradient(150deg, ${t.blush} 0%, ${t.blushDeep} 100%)`, color: t.ink }}>
      <h3 className="text-[28px] leading-tight" style={{ fontFamily: t.serif }}>{storeName}</h3>
      {tienda?.descripcionTienda && <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed" style={{ color: mix(t.ink, 75, t.blush) }}>{tienda.descripcionTienda}</p>}
      <ul className="mt-6 divide-y" style={{ borderColor: mix(t.ink, 12, t.blush) }}>
        {services.map((s) => (
          <li key={s.label} className="flex items-center gap-3 py-3" style={{ borderColor: mix(t.ink, 12, t.blush) }}>
            <Icon icon={s.icon} width={19} className="shrink-0" />
            <p className="text-[13px]"><span className="font-medium">{s.label}</span> <span style={{ color: mix(t.ink, 65, t.blush) }}>· {s.sub}</span></p>
          </li>
        ))}
      </ul>
      {ch.socials.length > 0 && (
        <div className="mt-5 flex items-center gap-1">
          {ch.socials.map((s) => <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-10 w-10 items-center justify-center bg-white/60 transition-colors hover:bg-white"><Icon icon={s.icon} width={18} /></a>)}
        </div>
      )}
      <div className="mt-auto pt-7">
        <button type="button" onClick={onCatalog} className={`${btnCls} h-12 px-7`} style={{ background: t.accent, color: t.onAccent }}>Ver catálogo <Icon icon="solar:arrow-right-linear" width={15} /></button>
      </div>
    </motion.div>
  );
}

const MOTIVOS = ['Consulta sobre un producto', 'Ayuda para elegir mi tono', 'Disponibilidad o stock', 'Estado de mi pedido', 'Otro'];

/** Formulario honesto: arma el mensaje y lo abre en WhatsApp (o correo). Nunca simula un "enviado". */
function MessageForm({ t, ch, diseno }: { t: Theme; ch: Channels; diseno: any }) {
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
  const base = 'w-full appearance-none rounded-none border-0 bg-white bg-none px-4 text-[14px] text-stone-900 outline-none placeholder:text-stone-400 focus:ring-0';

  return (
    <section className="mx-auto max-w-[1280px] px-4 pb-12 lg:px-8">
      <motion.div variants={blReveal} initial="hidden" whileInView="show" viewport={blViewport} className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1fr_1.3fr]" style={{ background: t.blushSoft }}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: t.primaryInk }}>{editable(diseno?.maquillajeFormEyebrow, 'Escríbenos')}</p>
          <h2 className="mt-2 text-[30px] leading-tight" style={{ color: t.ink, fontFamily: t.serif }}>{editable(diseno?.maquillajeFormTitle, '¿En qué te ayudamos?')}</h2>
          <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: t.muted }}>Completa el formulario y se abrirá {ch.hasWhatsapp ? 'WhatsApp' : 'tu correo'} con el mensaje listo para enviar. Si buscas tu tono, cuéntanos tu tipo de piel y el acabado que prefieres.</p>
        </div>
        <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.16em]" style={{ color: t.muted }}>Nombre *</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" className={`${base} h-12`} style={box(errors.nombre)} aria-invalid={Boolean(errors.nombre)} />
            {errors.nombre && <span className="mt-1 block text-[12px] text-rose-500">{errors.nombre}</span>}
          </label>
          <label>
            <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.16em]" style={{ color: t.muted }}>Motivo</span>
            <div className="relative">
              <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className={`${base} h-12 pr-10`} style={box()}>
                {MOTIVOS.map((m) => <option key={m}>{m}</option>)}
              </select>
              <Icon icon="solar:alt-arrow-down-linear" width={15} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" style={{ color: t.muted }} />
            </div>
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.16em]" style={{ color: t.muted }}>Mensaje *</span>
            <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={5} placeholder="Escribe tu consulta…" className={`${base} resize-none py-3`} style={box(errors.mensaje)} aria-invalid={Boolean(errors.mensaje)} />
            {errors.mensaje && <span className="mt-1 block text-[12px] text-rose-500">{errors.mensaje}</span>}
          </label>
          <button type="submit" className={`${btnCls} h-12 px-8 sm:col-span-2 sm:w-max`} style={ch.hasWhatsapp ? { background: '#1FA855', color: '#fff' } : { background: t.accent, color: t.onAccent }}>
            <Icon icon={ch.hasWhatsapp ? 'ic:baseline-whatsapp' : 'solar:letter-linear'} width={17} /> Enviar por {ch.hasWhatsapp ? 'WhatsApp' : 'correo'}
          </button>
        </form>
      </motion.div>
    </section>
  );
}

/** Preguntas frecuentes con respuestas derivadas de la configuración real de la tienda. */
function Faq({ t, tienda, ch, diseno }: { t: Theme; tienda: any; ch: Channels; diseno: any }) {
  const envio = Number(tienda?.costoEnvioFijo || 0);
  const minPrep = Number(tienda?.tiempoPreparacionMin || 0);
  const items = [
    { q: '¿Cómo elijo el tono o producto adecuado?', a: `Revisa la descripción y los detalles de cada producto (tono, acabado, tipo de piel). ${ch.hasWhatsapp ? 'Si tienes dudas, escríbenos por WhatsApp y te ayudamos a elegir.' : ''}`.trim() },
    { q: '¿Hacen envíos?', a: tienda?.aceptaEnvio === false ? 'Por ahora solo atendemos con recojo en tienda.' : `Sí, llevamos tu pedido a domicilio. ${envio > 0 ? `El envío cuesta desde ${blMoney(envio)}.` : 'El costo de envío se muestra al finalizar tu compra.'}` },
    { q: '¿Puedo recoger mi pedido?', a: tienda?.aceptaRecojo ? `Sí. Estará listo ${minPrep > 0 ? `en aproximadamente ${minPrep} minutos` : 'en poco tiempo'}${ch.pickupAddress ? ` en ${ch.pickupAddress}` : ''}.` : 'Por ahora solo realizamos envíos a domicilio.' },
    { q: '¿Qué medios de pago aceptan?', a: 'Verás todos los medios de pago disponibles en el último paso de tu compra, antes de confirmar el pedido.' },
    { q: '¿Cómo sigo mi pedido?', a: 'Al confirmar tu compra recibirás un código de seguimiento para consultar el estado de tu pedido en cualquier momento.' },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-28 px-4 pb-16 lg:px-8">
      <SectionHeader t={t} center title={editable(diseno?.maquillajeFaqTitle, 'Preguntas frecuentes')} />
      <div className="border-t" style={{ borderColor: t.line }}>
        {items.map((it, i) => {
          const isOpen = open === i;
          return (
            <div key={it.q} className="border-b" style={{ borderColor: t.line }}>
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 py-5 text-left">
                <span className="text-[14.5px] font-medium" style={{ color: t.ink }}>{it.q}</span>
                <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.25, ease: blEase }} className="flex h-7 w-7 shrink-0 items-center justify-center" style={{ color: t.ink }}><Icon icon="solar:add-square-linear" width={20} /></motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: blEase }} className="overflow-hidden">
                    <p className="pb-6 pr-10 text-[13.5px] leading-relaxed" style={{ color: t.muted }}>{it.a}</p>
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
