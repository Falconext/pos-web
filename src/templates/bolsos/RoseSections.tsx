import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { RoseProductCard, type Theme } from './RoseParts';
import { rsEase, rsItem, rsReveal, rsStagger, rsViewport } from './motion';

/**
 * Piezas compartidas por Home, Catálogo, Detalle y Contacto de la plantilla Bolsos (Rosé).
 * Todo lo que tiene estado propio (rail con scroll, reloj) vive aislado a nivel de módulo.
 */

export type OpenFn = (p: any) => void;
export type AddFn = (p: any, qty?: number) => void;

export const getName = (item: any) => (typeof item === 'string' ? item : item?.nombre || item?.name || '');
export const hasImage = (p: any) => Boolean(p?.imagenUrl);

/** Ícono por palabra clave de la categoría (solo decorativo; la categoría es la real). */
export function categoryIcon(name: string): string {
  const n = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (/mochila|backpack/.test(n)) return 'ph:backpack-light';
  if (/billeter|monedero|wallet|tarjeter/.test(n)) return 'ph:wallet-light';
  if (/maleta|viaje|equipaje|travel/.test(n)) return 'ph:suitcase-rolling-light';
  if (/sobre|clutch|fiesta|noche/.test(n)) return 'ph:envelope-simple-light';
  if (/canguro|rinonera|belt/.test(n)) return 'ph:bag-simple-light';
  if (/accesor|llaver|correa|cinturon|lente/.test(n)) return 'ph:sparkle-light';
  if (/tote|shopper|playa/.test(n)) return 'ph:tote-light';
  return 'ph:handbag-light';
}

/** Fin real más próximo de una oferta (fechaFinOferta). null = sin fecha → sin reloj. */
export function soonestOfferEnd(offers: any[]): number | null {
  const now = Date.now();
  const ends = offers.map((p) => (p?.fechaFinOferta ? new Date(p.fechaFinOferta).getTime() : NaN)).filter((n) => Number.isFinite(n) && n > now);
  return ends.length ? Math.min(...ends) : null;
}

export function formatPhone(raw: any) {
  const value = String(raw || '').trim();
  if (!value) return value;
  const digits = value.replace(/\D/g, '');
  let n = digits;
  if (digits.length === 11 && digits.startsWith('51')) n = digits.slice(2);
  else if (digits.length === 9) n = digits;
  else return value;
  return `+51 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
}

/** Usuario de Instagram a partir de la URL real (null si no se puede deducir). */
export function instagramHandle(url: any): string | null {
  const m = String(url || '').match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  return m && !['p', 'reel', 'explore', 'stories'].includes(m[1].toLowerCase()) ? m[1] : null;
}

/** Canales de contacto REALES de la tienda. Campo vacío → null (la UI lo oculta). */
export function storeChannels(tienda: any, diseno?: any) {
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const wa = (msg = '') => buildStorePurchaseWhatsappUrl(waNumber, msg);
  const hasWhatsapp = Boolean(wa('Hola'));
  const phoneRaw = String(tienda?.telefono || '').trim();
  const address = [tienda?.direccion, tienda?.distrito, tienda?.provincia].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  const pickup = String(tienda?.direccionRecojo || '').trim() || address;
  const socials = [
    tienda?.instagramUrl ? { icon: 'mdi:instagram', label: 'Instagram', url: tienda.instagramUrl } : null,
    tienda?.facebookUrl ? { icon: 'ic:baseline-facebook', label: 'Facebook', url: tienda.facebookUrl } : null,
    tienda?.tiktokUrl ? { icon: 'ic:baseline-tiktok', label: 'TikTok', url: tienda.tiktokUrl } : null,
  ].filter(Boolean) as { icon: string; label: string; url: string }[];
  return {
    wa,
    hasWhatsapp,
    whatsappLabel: hasWhatsapp ? formatPhone(waNumber) : null,
    phoneHref: phoneRaw ? `tel:${phoneRaw.replace(/\s/g, '')}` : null,
    phoneLabel: phoneRaw ? formatPhone(phoneRaw) : null,
    email: String(tienda?.email || '').trim() || null,
    address: address || null,
    pickupAddress: pickup || null,
    mapsUrl: address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null,
    mapsEmbed: address ? `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed` : null,
    horario: String(tienda?.horarioAtencion || '').trim() || null,
    instagramUrl: String(tienda?.instagramUrl || '').trim() || null,
    socials,
  };
}
export type Channels = ReturnType<typeof storeChannels>;

// ───────────────────────────────────────────────────────────── UI ──
/** Encabezado de sección de la referencia: título en mayúsculas a la izquierda y "Ver todo →" a la derecha. */
export function SectionHeader({ t, title, subtitle, onMore, moreLabel = 'Ver todo', right, center = false }: { t: Theme; title: string; subtitle?: string; onMore?: () => void; moreLabel?: string; right?: ReactNode; center?: boolean }) {
  return (
    <motion.div variants={rsReveal} initial="hidden" whileInView="show" viewport={rsViewport} className={`mb-7 flex flex-wrap items-end gap-4 ${center ? 'flex-col items-center text-center' : 'justify-between'}`}>
      <div>
        <h2 className="text-[19px] font-semibold uppercase tracking-[0.06em] sm:text-[21px]" style={{ color: t.ink }}>{title}</h2>
        {subtitle && <p className="mt-1.5 text-[13px]" style={{ color: t.muted }}>{subtitle}</p>}
      </div>
      {right ?? (onMore && (
        <button type="button" onClick={onMore} className="group inline-flex shrink-0 items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: t.ink }}>
          {moreLabel}
          <Icon icon="solar:arrow-right-linear" width={17} className="transition-transform duration-300 group-hover:translate-x-1" style={{ color: t.accentInk }} />
        </button>
      ))}
    </motion.div>
  );
}

export function ProductGrid({ t, products, slug, onOpen, onAdd, cols = 'lg:grid-cols-4' }: { t: Theme; products: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn; cols?: string }) {
  return (
    <motion.div variants={rsStagger} initial="hidden" whileInView="show" viewport={rsViewport} className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 ${cols}`}>
      {products.map((p, i) => (
        <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={rsItem} className="h-full">
          <RoseProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export function GridSkeleton({ t, count = 4, cols = 'lg:grid-cols-4' }: { t: Theme; count?: number; cols?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => <div key={i} className="h-[360px] animate-pulse rounded-md" style={{ background: t.soft }} />)}
    </div>
  );
}

/** Rail horizontal con flechas laterales. Estado del scroll aislado aquí. */
export function ProductRail({ t, title, subtitle, products, slug, onOpen, onAdd, onMore, right }: { t: Theme; title: string; subtitle?: string; products: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn; onMore?: () => void; right?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const update = () => { const el = ref.current; if (el) setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 }); };
  useEffect(() => { update(); }, [products.length]);
  if (!products.length) return null;
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  const arrow = (dir: number, icon: string, label: string, off: boolean, pos: string) => (
    <button type="button" aria-label={label} disabled={off} onClick={() => scroll(dir)} className={`absolute top-[38%] z-10 hidden h-11 w-11 items-center justify-center rounded-full border bg-white shadow-[0_10px_24px_-14px_rgba(31,26,28,0.5)] transition-opacity disabled:pointer-events-none disabled:opacity-0 lg:flex ${pos}`} style={{ color: t.ink, borderColor: t.line }}>
      <Icon icon={icon} width={18} />
    </button>
  );
  return (
    <section className="mx-auto max-w-[1320px] px-4 py-10 lg:px-8">
      <SectionHeader t={t} title={title} subtitle={subtitle} onMore={onMore} right={right} />
      <div className="relative">
        {arrow(-1, 'solar:alt-arrow-left-linear', 'Anterior', edge.start, '-left-5')}
        {arrow(1, 'solar:alt-arrow-right-linear', 'Siguiente', edge.end, '-right-5')}
        <motion.div ref={ref} onScroll={update} variants={rsStagger} initial="hidden" whileInView="show" viewport={rsViewport} className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-3 [scrollbar-width:none] sm:gap-4 lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
          {products.map((p, i) => (
            <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={rsItem} className="w-[62%] shrink-0 snap-start sm:w-[36%] md:w-[29%] lg:w-[calc((100%-5rem)/6)]">
              <RoseProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/** Reloj hasta el fin REAL de una oferta. Su tick de 1s solo re-renderiza este componente. */
export function OfferCountdown({ t, endsAt, light = false }: { t: Theme; endsAt: number; light?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const s = Math.max(0, Math.floor((endsAt - now) / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  const days = Math.floor(s / 86400);
  const units: [string, string][] = days > 0
    ? [['d', pad(days)], ['h', pad(Math.floor((s % 86400) / 3600))], ['m', pad(Math.floor((s % 3600) / 60))]]
    : [['h', pad(Math.floor(s / 3600))], ['m', pad(Math.floor((s % 3600) / 60))], ['s', pad(s % 60)]];
  return (
    <div className="flex items-center gap-1.5" aria-label="Tiempo restante de la oferta">
      {units.map(([label, value]) => (
        <span key={label} className="inline-flex items-baseline gap-0.5 rounded-[4px] px-2 py-1 text-[13px] font-semibold tabular-nums" style={light ? { background: 'rgba(255,255,255,.14)', color: '#fff' } : { background: '#fff', color: t.ink, boxShadow: `inset 0 0 0 1px ${t.line}` }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={value} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }} transition={{ duration: 0.3, ease: rsEase }}>{value}</motion.span>
          </AnimatePresence>
          <span className="text-[10px] opacity-70">{label}</span>
        </span>
      ))}
    </div>
  );
}

/** Banda superior de página (catálogo / contacto): rubor con foto fundida a la derecha. */
export function PageHero({ t, crumbs, eyebrow, title, subtitle, image, children }: { t: Theme; crumbs: { label: string; onClick?: () => void }[]; eyebrow?: string; title: string; subtitle?: ReactNode; image?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b" style={{ borderColor: t.line, background: t.blush }}>
      {image && (
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] [mask-image:linear-gradient(90deg,transparent,#000_45%)] md:block">
          <img src={image} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="relative mx-auto max-w-[1320px] px-4 py-12 lg:px-8 lg:py-16">
        <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1.5 text-[11.5px] uppercase tracking-[0.1em]" style={{ color: t.muted }}>
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
              {i > 0 && <Icon icon="solar:alt-arrow-right-linear" width={12} />}
              {c.onClick ? <button type="button" onClick={c.onClick} className="uppercase hover:text-stone-900">{c.label}</button> : <span style={{ color: t.ink }}>{c.label}</span>}
            </span>
          ))}
        </nav>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: rsEase }} className="max-w-xl">
          {eyebrow && <p className="mt-6 text-[26px] leading-none" style={{ color: t.accentInk, fontFamily: t.script }}>{eyebrow}</p>}
          <h1 className="mt-2 text-[40px] font-semibold uppercase leading-[1] tracking-[0.01em] sm:text-[54px]" style={{ color: t.ink, fontFamily: t.serif }}>{title}</h1>
          {subtitle && <div className="mt-4 text-[14px] leading-relaxed" style={{ color: t.muted }}>{subtitle}</div>}
        </motion.div>
        {children}
      </div>
    </section>
  );
}
