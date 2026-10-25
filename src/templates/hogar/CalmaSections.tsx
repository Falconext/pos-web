import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { CalmaProductCard, Eyebrow, type Theme } from './CalmaParts';
import { cmEase, cmItem, cmReveal, cmStagger, cmViewport } from './motion';

/**
 * Piezas compartidas por Home, Catálogo, Detalle y Contacto de la plantilla Hogar (Calma).
 * Todo lo que tiene estado propio (rail con scroll, reloj) vive aislado a nivel de módulo.
 */

export type OpenFn = (p: any) => void;
export type AddFn = (p: any, qty?: number) => void;

export const getName = (item: any) => (typeof item === 'string' ? item : item?.nombre || item?.name || '');
export const hasImage = (p: any) => Boolean(p?.imagenUrl);

/** Ícono por palabra clave de la categoría (solo decorativo; la categoría es la real). */
export function categoryIcon(name: string): string {
  const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/silla|sillon|sofa|butaca|asiento|banco|puff|taburete|seat/.test(n)) return 'ph:armchair-light';
  if (/lampar|luz|ilumin|foco|light/.test(n)) return 'ph:lamp-light';
  if (/mesa|escritor|comedor|table/.test(n)) return 'ph:table-light';
  if (/cama|colchon|dormit|almohad/.test(n)) return 'ph:bed-light';
  if (/textil|manta|cojin|cortina|alfombra|lino|sabana/.test(n)) return 'ph:dress-light';
  if (/ceram|jarron|florero|vaso|plato|bowl|cocina|vajilla/.test(n)) return 'ph:coffee-light';
  if (/plant|maceta|jardin/.test(n)) return 'ph:plant-light';
  if (/decor|cuadro|espejo|arte|vela/.test(n)) return 'ph:frame-corners-light';
  if (/estante|repisa|mueble|ropero|organiz/.test(n)) return 'ph:books-light';
  return 'ph:house-line-light';
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
/** Encabezado de sección de la referencia: etiqueta mono, título grande y enlace con flecha en círculo. */
export function SectionHeader({ t, eyebrow, title, subtitle, onMore, moreLabel = 'Ver todo', right }: { t: Theme; eyebrow?: string; title: string; subtitle?: string; onMore?: () => void; moreLabel?: string; right?: ReactNode }) {
  return (
    <motion.div variants={cmReveal} initial="hidden" whileInView="show" viewport={cmViewport} className="mb-7 flex flex-wrap items-end justify-between gap-5">
      <div className="min-w-0">
        {eyebrow && <Eyebrow t={t}>{eyebrow}</Eyebrow>}
        <h2 className="mt-2 text-[38px] font-semibold leading-[0.95] tracking-[-0.045em] sm:text-[52px] lg:text-[60px]" style={{ color: t.ink, fontFamily: t.display }}>{title}</h2>
        {subtitle && <p className="mt-3 max-w-xl text-[14px]" style={{ color: t.muted }}>{subtitle}</p>}
      </div>
      {right ?? (onMore && <MoreLink t={t} label={moreLabel} onClick={onMore} />)}
    </motion.div>
  );
}

/** "Todos los productos (→)" de la referencia. */
export function MoreLink({ t, label, onClick }: { t: Theme; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group inline-flex shrink-0 items-center gap-2.5 text-[14px]" style={{ color: t.ink }}>
      {label}
      <span className="flex h-8 w-8 items-center justify-center rounded-full border bg-white transition-transform duration-300 group-hover:translate-x-0.5" style={{ borderColor: t.line }}><Icon icon="solar:arrow-right-linear" width={15} /></span>
    </button>
  );
}

export function ProductGrid({ t, products, slug, onOpen, onAdd, cols = 'lg:grid-cols-4' }: { t: Theme; products: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn; cols?: string }) {
  return (
    <motion.div variants={cmStagger} initial="hidden" whileInView="show" viewport={cmViewport} className={`grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 ${cols}`}>
      {products.map((p, i) => (
        <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={cmItem} className="h-full">
          <CalmaProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export function GridSkeleton({ t, count = 4, cols = 'lg:grid-cols-4' }: { t: Theme; count?: number; cols?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-[28px]" style={{ background: t.soft }} />)}
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
    <section className="mx-auto max-w-[1400px] px-3 py-12 sm:px-5">
      <SectionHeader t={t} title={title} subtitle={subtitle} onMore={onMore} right={right} />
      <div className="relative">
        {arrow(-1, 'solar:alt-arrow-left-linear', 'Anterior', edge.start, '-left-5')}
        {arrow(1, 'solar:alt-arrow-right-linear', 'Siguiente', edge.end, '-right-5')}
        <motion.div ref={ref} onScroll={update} variants={cmStagger} initial="hidden" whileInView="show" viewport={cmViewport} className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-3 [scrollbar-width:none] sm:gap-4 lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
          {products.map((p, i) => (
            <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={cmItem} className="w-[62%] shrink-0 snap-start sm:w-[36%] md:w-[29%] lg:w-[calc((100%-3rem)/4)]">
              <CalmaProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
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
            <motion.span key={value} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }} transition={{ duration: 0.3, ease: cmEase }}>{value}</motion.span>
          </AnimatePresence>
          <span className="text-[10px] opacity-70">{label}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * Cabecera de página de la referencia ("9 PIECES / Shop all"): tarjeta hueso redondeada, migas,
 * etiqueta mono, título grande y un espacio a la derecha (buscador/orden). Foto opcional a la derecha.
 */
export function PageHero({ t, crumbs, eyebrow, title, subtitle, image, children }: { t: Theme; crumbs: { label: string; onClick?: () => void }[]; eyebrow?: string; title: string; subtitle?: ReactNode; image?: string; children?: ReactNode }) {
  return (
    <section className="mx-auto max-w-[1400px] px-3 pt-4 sm:px-5">
      <nav aria-label="Ruta" className="mb-3 flex flex-wrap items-center gap-1.5 px-2 text-[12.5px]" style={{ color: t.muted }}>
        {crumbs.map((c, i) => (
          <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
            {i > 0 && <Icon icon="solar:alt-arrow-right-linear" width={12} />}
            {c.onClick ? <button type="button" onClick={c.onClick} className="hover:text-stone-900">{c.label}</button> : <span style={{ color: t.ink }}>{c.label}</span>}
          </span>
        ))}
      </nav>
      <div className="relative overflow-hidden rounded-[32px] shadow-[0_20px_50px_-40px_rgba(28,26,23,0.5)]" style={{ background: t.surface }}>
        {image && (
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[40%] [mask-image:linear-gradient(90deg,transparent,#000_40%)] lg:block">
            <img src={image} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="relative flex flex-col gap-6 px-6 py-8 sm:px-9 sm:py-10 lg:flex-row lg:items-end lg:justify-between">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: cmEase }} className="max-w-2xl">
            {eyebrow && <Eyebrow t={t}>{eyebrow}</Eyebrow>}
            <h1 className="mt-3 text-[46px] font-semibold leading-[0.92] tracking-[-0.05em] sm:text-[72px]" style={{ color: t.ink, fontFamily: t.display }}>{title}</h1>
            {subtitle && <div className="mt-4 text-[14px] leading-relaxed" style={{ color: t.muted }}>{subtitle}</div>}
          </motion.div>
          {children && <div className="relative lg:max-w-[520px] lg:flex-1">{children}</div>}
        </div>
      </div>
    </section>
  );
}
