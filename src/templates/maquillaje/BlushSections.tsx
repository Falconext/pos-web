import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { BlushProductCard, type Theme } from './BlushParts';
import { blEase, blItem, blReveal, blStagger, blViewport } from './motion';

/**
 * Piezas compartidas por Home, Catálogo, Detalle y Contacto de la plantilla Maquillaje (Blush).
 * Todo lo que tiene estado propio (rail con scroll, reloj) vive aislado a nivel de módulo.
 */

export type OpenFn = (p: any) => void;
export type AddFn = (p: any, qty?: number) => void;

export const getName = (item: any) => (typeof item === 'string' ? item : item?.nombre || item?.name || '');
export const hasImage = (p: any) => Boolean(p?.imagenUrl);

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

/** "@usuario" a partir de la URL real de Instagram (null si no se puede leer). */
export function instagramHandle(url: any): string | null {
  const m = String(url || '').match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  return m && !['p', 'reel', 'explore', 'stories'].includes(m[1].toLowerCase()) ? `@${m[1]}` : null;
}

/** Canales de contacto REALES de la tienda. Campo vacío → null (la UI lo oculta). */
export function storeChannels(tienda: any, diseno?: any) {
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const wa = (msg = '') => buildStorePurchaseWhatsappUrl(waNumber, msg);
  const hasWhatsapp = Boolean(wa('Hola'));
  const phoneRaw = String(tienda?.telefono || '').trim();
  const address = [tienda?.direccion, tienda?.distrito, tienda?.provincia].map((v) => String(v || '').trim()).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  const pickup = String(tienda?.direccionRecojo || '').trim() || address;
  const socials = [
    tienda?.instagramUrl ? { icon: 'mdi:instagram', label: 'Instagram', url: tienda.instagramUrl } : null,
    tienda?.tiktokUrl ? { icon: 'ic:baseline-tiktok', label: 'TikTok', url: tienda.tiktokUrl } : null,
    tienda?.facebookUrl ? { icon: 'ic:baseline-facebook', label: 'Facebook', url: tienda.facebookUrl } : null,
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
/** Título de sección de la referencia: mayúsculas espaciadas a la izquierda + "Ver todo" subrayado a la derecha. */
export function SectionHeader({ t, title, subtitle, onMore, moreLabel = 'Ver todo', right, center = false }: { t: Theme; title: string; subtitle?: string; onMore?: () => void; moreLabel?: string; right?: ReactNode; center?: boolean }) {
  return (
    <motion.div variants={blReveal} initial="hidden" whileInView="show" viewport={blViewport} className={`mb-7 flex flex-wrap items-end gap-4 ${center ? 'flex-col items-center text-center' : 'justify-between'}`}>
      <div>
        <h2 className="text-[17px] font-semibold uppercase tracking-[0.12em] sm:text-[19px]" style={{ color: t.ink }}>{title}</h2>
        {subtitle && <p className="mt-1.5 text-[13px]" style={{ color: t.muted }}>{subtitle}</p>}
      </div>
      {right ?? (onMore && (
        <button type="button" onClick={onMore} className="shrink-0 border-b pb-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-opacity hover:opacity-60" style={{ color: t.ink, borderColor: t.ink }}>
          {moreLabel}
        </button>
      ))}
    </motion.div>
  );
}

export function ProductGrid({ t, products, slug, onOpen, onAdd, cols = 'lg:grid-cols-4' }: { t: Theme; products: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn; cols?: string }) {
  return (
    <motion.div key={products.map((p) => p?.id ?? p?.descripcion).join('|')} variants={blStagger} initial="hidden" whileInView="show" viewport={blViewport} className={`grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-5 ${cols}`}>
      {products.map((p, i) => (
        <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={blItem} className="h-full">
          <BlushProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export function GridSkeleton({ t, count = 4, cols = 'lg:grid-cols-4' }: { t: Theme; count?: number; cols?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-5 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[4/5] animate-pulse" style={{ background: t.card }} />
          <div className="mt-3.5 h-3 w-3/4 animate-pulse" style={{ background: t.card }} />
          <div className="mt-2 h-3 w-1/3 animate-pulse" style={{ background: t.card }} />
        </div>
      ))}
    </div>
  );
}

/** Rail horizontal (5 por fila en escritorio, como la referencia). Estado del scroll aislado aquí. */
export function ProductRail({ t, title, subtitle, products, slug, onOpen, onAdd, onMore, right }: { t: Theme; title: string; subtitle?: string; products: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn; onMore?: () => void; right?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const update = () => { const el = ref.current; if (el) setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 }); };
  const sig = products.map((p) => p?.id ?? p?.descripcion).join('|');
  useEffect(() => { update(); }, [sig]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!products.length) return null;
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  const arrow = (dir: number, icon: string, label: string, off: boolean, pos: string) => (
    <button type="button" aria-label={label} disabled={off} onClick={() => scroll(dir)} className={`absolute top-[34%] z-10 hidden h-10 w-10 items-center justify-center bg-white shadow-[0_10px_24px_-14px_rgba(28,23,24,0.55)] transition-opacity disabled:pointer-events-none disabled:opacity-0 lg:flex ${pos}`} style={{ color: t.ink }}>
      <Icon icon={icon} width={17} />
    </button>
  );
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-12 lg:px-8">
      <SectionHeader t={t} title={title} subtitle={subtitle} onMore={onMore} right={right} />
      <div className="relative">
        {arrow(-1, 'solar:alt-arrow-left-linear', 'Anterior', edge.start, '-left-5')}
        {arrow(1, 'solar:alt-arrow-right-linear', 'Siguiente', edge.end, '-right-5')}
        {/* key = firma de la lista: si cambian los productos (otra ficha), el escalonado vuelve a correr en vez de dejar tarjetas nuevas ocultas. */}
        <motion.div key={sig} ref={ref} onScroll={update} variants={blStagger} initial="hidden" whileInView="show" viewport={blViewport} className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:gap-5 lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
          {products.map((p, i) => (
            <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={blItem} className="w-[58%] shrink-0 snap-start sm:w-[34%] md:w-[28%] lg:w-[calc((100%-5rem)/5)]">
              <BlushProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
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
        <span key={label} className="inline-flex items-baseline gap-0.5 px-2 py-1 text-[13px] font-medium tabular-nums" style={light ? { background: 'rgba(255,255,255,.16)', color: '#fff' } : { background: '#fff', color: t.ink }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={value} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }} transition={{ duration: 0.3, ease: blEase }}>{value}</motion.span>
          </AnimatePresence>
          <span className="text-[10px] opacity-70">{label}</span>
        </span>
      ))}
    </div>
  );
}

/** Banda superior de página (catálogo / contacto) sobre el tinte rosado. */
export function PageHero({ t, crumbs, eyebrow, title, subtitle, image, children }: { t: Theme; crumbs: { label: string; onClick?: () => void }[]; eyebrow?: string; title: string; subtitle?: ReactNode; image?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden" style={{ background: `linear-gradient(100deg, ${t.blushSoft} 0%, ${t.blush} 100%)` }}>
      {image && (
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] [mask-image:linear-gradient(90deg,transparent,#000_40%)] md:block">
          <img src={image} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="relative mx-auto max-w-[1280px] px-4 py-12 lg:px-8 lg:py-16">
        <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1.5 text-[11px] uppercase tracking-[0.14em]" style={{ color: t.muted }}>
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
              {i > 0 && <span aria-hidden>/</span>}
              {c.onClick ? <button type="button" onClick={c.onClick} className="uppercase hover:text-stone-900">{c.label}</button> : <span style={{ color: t.ink }}>{c.label}</span>}
            </span>
          ))}
        </nav>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: blEase }} className="max-w-xl">
          {eyebrow && <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: t.primaryInk }}>{eyebrow}</p>}
          <h1 className="mt-2 text-[34px] font-semibold uppercase leading-[1.02] tracking-[0.02em] sm:text-[46px]" style={{ color: t.ink }}>{title}</h1>
          {subtitle && <div className="mt-3 text-[14px] leading-relaxed" style={{ color: t.muted }}>{subtitle}</div>}
        </motion.div>
        {children}
      </div>
    </section>
  );
}
