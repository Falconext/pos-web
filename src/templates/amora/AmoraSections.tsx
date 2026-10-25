import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { AmProductCard, type Theme } from './AmoraParts';
import { amEase, amItem, amReveal, amStagger, amViewport, mix } from './motion';

/**
 * Piezas compartidas por Home, Catálogo, Detalle y Contacto de la plantilla Amora.
 * Todo lo que tiene estado propio (rail con scroll, reloj) vive aislado a nivel de módulo.
 */

export type OpenFn = (p: any) => void;
export type AddFn = (p: any, qty?: number) => void;

export const getName = (item: any) => (typeof item === 'string' ? item : item?.nombre || item?.name || '');
export const hasImage = (p: any) => Boolean(p?.imagenUrl);

/** Ícono por palabra clave de la categoría (solo decorativo; la categoría es la real). */
export function categoryIcon(name: string): string {
  const n = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (/mochil|backpack/.test(n)) return 'ph:backpack';
  if (/billeter|monedero|tarjetero|wallet/.test(n)) return 'ph:wallet';
  if (/maleta|viaje|equipaje/.test(n)) return 'ph:suitcase-rolling';
  if (/canguro|rinonera|bandolera|cruzad|crossbody/.test(n)) return 'ph:bag-simple';
  if (/sobre|clutch|fiesta|noche/.test(n)) return 'ph:envelope-simple';
  if (/zapat|calzad|sandal|bota/.test(n)) return 'ph:sneaker';
  if (/lente|gafa|sol/.test(n)) return 'ph:sunglasses';
  if (/reloj/.test(n)) return 'ph:watch';
  if (/joy|arete|collar|pulser|anillo|bisuter/.test(n)) return 'ph:diamond';
  if (/accesor|correa|llaver|panuel|chalina/.test(n)) return 'ph:sparkle';
  return 'ph:handbag-simple';
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
/** Encabezado de sección de la referencia: título bold con corazón opcional en script, subtítulo y botón "Ver todo". */
export function SectionHeader({ t, eyebrow, title, subtitle, icon, onMore, moreLabel = 'Ver todo', right, light = false, heart = false }: { t: Theme; eyebrow?: string; title: string; subtitle?: string; icon?: string; onMore?: () => void; moreLabel?: string; right?: ReactNode; light?: boolean; heart?: boolean }) {
  return (
    <motion.div variants={amReveal} initial="hidden" whileInView="show" viewport={amViewport} className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {icon && <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: light ? 'rgba(255,255,255,.14)' : t.soft, color: light ? '#fff' : t.primaryInk }}><Icon icon={icon} width={22} /></span>}
        <div className="min-w-0">
          {eyebrow && <p className="mb-1 text-[11.5px] font-bold uppercase tracking-[0.12em]" style={{ color: light ? t.accentOnDark : t.primaryInk, fontFamily: t.display }}>{eyebrow}</p>}
          <h2 className="flex items-center gap-2 text-[24px] font-bold leading-[1.1] tracking-[-0.02em] sm:text-[30px]" style={{ color: light ? '#fff' : t.ink, fontFamily: t.display }}>
            {title}
            {heart && <Icon icon="solar:heart-bold" width={24} className="shrink-0" style={{ color: t.accent }} />}
          </h2>
          {subtitle && <p className="mt-1 text-[14px]" style={{ color: light ? 'rgba(255,255,255,.72)' : t.muted }}>{subtitle}</p>}
        </div>
      </div>
      {right ?? (onMore && <MoreLink t={t} label={moreLabel} onClick={onMore} light={light} />)}
    </motion.div>
  );
}

/** Botón "Ver todo" con borde de la referencia. */
export function MoreLink({ t, label, onClick, light = false }: { t: Theme; label: string; onClick: () => void; light?: boolean }) {
  return (
    <button type="button" onClick={onClick} className="group inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[13.5px] font-semibold transition-colors hover:bg-white" style={{ color: light ? '#fff' : t.ink, borderColor: light ? 'rgba(255,255,255,.3)' : t.line }}>
      {label}
      <Icon icon="solar:arrow-right-linear" width={16} className="transition-transform duration-300 group-hover:translate-x-1" />
    </button>
  );
}

export function ProductGrid({ t, products, slug, onOpen, onAdd, cols = 'lg:grid-cols-4' }: { t: Theme; products: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn; cols?: string }) {
  return (
    <motion.div variants={amStagger} initial="hidden" whileInView="show" viewport={amViewport} className={`grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 ${cols}`}>
      {products.map((p, i) => (
        <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={amItem} className="h-full">
          <AmProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export function GridSkeleton({ t, count = 4, cols = 'lg:grid-cols-4' }: { t: Theme; count?: number; cols?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[18px] border bg-white p-3" style={{ borderColor: t.line }}>
          <div className="aspect-square animate-pulse rounded-[14px]" style={{ background: t.soft }} />
          <div className="mt-3 h-3 w-3/4 animate-pulse rounded-full" style={{ background: t.soft }} />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full" style={{ background: t.soft }} />
        </div>
      ))}
    </div>
  );
}

/** Rail horizontal con flechas laterales. Estado del scroll aislado aquí. */
export function ProductRail({ t, title, subtitle, icon, products, slug, onOpen, onAdd, onMore, right }: { t: Theme; title: string; subtitle?: string; icon?: string; products: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn; onMore?: () => void; right?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const update = () => { const el = ref.current; if (el) setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 }); };
  useEffect(() => { update(); }, [products.length]);
  if (!products.length) return null;
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  const arrow = (dir: number, icon: string, label: string, off: boolean, pos: string) => (
    <button type="button" aria-label={label} disabled={off} onClick={() => scroll(dir)} className={`absolute top-[36%] z-10 hidden h-11 w-11 items-center justify-center rounded-full border bg-white shadow-[0_10px_24px_-14px_rgba(23,18,43,0.5)] transition-opacity disabled:pointer-events-none disabled:opacity-0 lg:flex ${pos}`} style={{ color: t.ink, borderColor: t.line }}>
      <Icon icon={icon} width={18} />
    </button>
  );
  return (
    <section className="mx-auto max-w-[1320px] px-4 py-12 sm:px-6">
      <SectionHeader t={t} title={title} subtitle={subtitle} icon={icon} onMore={onMore} right={right} />
      <div className="relative">
        {arrow(-1, 'solar:alt-arrow-left-linear', 'Anterior', edge.start, '-left-5')}
        {arrow(1, 'solar:alt-arrow-right-linear', 'Siguiente', edge.end, '-right-5')}
        <motion.div ref={ref} onScroll={update} variants={amStagger} initial="hidden" whileInView="show" viewport={amViewport} className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-px-4 px-4 pb-3 [scrollbar-width:none] sm:gap-4 lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
          {products.map((p, i) => (
            <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={amItem} className="w-[58%] shrink-0 snap-start sm:w-[36%] md:w-[29%] lg:w-[calc((100%-4rem)/5)]">
              <AmProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Reloj hasta el fin REAL de una oferta, en cajitas como la referencia ("08 Hrs · 24 Min · 51 Sec").
 * Su tick de 1s solo re-renderiza este componente.
 */
export function OfferCountdown({ t, endsAt, light = false, big = false }: { t: Theme; endsAt: number; light?: boolean; big?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const s = Math.max(0, Math.floor((endsAt - now) / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  const days = Math.floor(s / 86400);
  const units: [string, string][] = days > 0
    ? [['Días', pad(days)], ['Hrs', pad(Math.floor((s % 86400) / 3600))], ['Min', pad(Math.floor((s % 3600) / 60))]]
    : [['Hrs', pad(Math.floor(s / 3600))], ['Min', pad(Math.floor((s % 3600) / 60))], ['Seg', pad(s % 60)]];
  return (
    <div className="flex items-center gap-1.5" aria-label="Tiempo restante de la oferta">
      {units.map(([label, value]) => (
        <span key={label} className={`flex flex-col items-center justify-center rounded-[12px] tabular-nums ${big ? 'h-[58px] w-[56px]' : 'h-[46px] w-[46px]'}`} style={light ? { background: 'rgba(255,255,255,.12)', color: '#fff', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.16)' } : { background: '#fff', color: t.ink, boxShadow: `inset 0 0 0 1px ${t.line}` }}>
          <span className="relative block overflow-hidden leading-none">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={value} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} transition={{ duration: 0.28, ease: amEase }} className={`block font-extrabold ${big ? 'text-[22px]' : 'text-[16px]'}`} style={{ fontFamily: t.display }}>{value}</motion.span>
            </AnimatePresence>
          </span>
          <span className="mt-1 text-[9.5px] font-bold uppercase opacity-70">{label}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * Cabecera de página clara: migas, banda menta con título grande, subtítulo, espacio a la derecha
 * (buscador, filtros) y foto opcional fundida a la derecha.
 */
export function PageHero({ t, crumbs, eyebrow, title, subtitle, image, children }: { t: Theme; crumbs: { label: string; onClick?: () => void }[]; eyebrow?: string; title: string; subtitle?: ReactNode; image?: string; children?: ReactNode }) {
  return (
    <section className="mx-auto max-w-[1320px] px-4 pt-5 sm:px-6">
      <nav aria-label="Ruta" className="mb-3 flex flex-wrap items-center gap-1.5 px-1 text-[12.5px] font-semibold" style={{ color: t.muted }}>
        {crumbs.map((c, i) => (
          <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
            {i > 0 && <Icon icon="solar:alt-arrow-right-linear" width={12} />}
            {c.onClick ? <button type="button" onClick={c.onClick} className="hover:underline">{c.label}</button> : <span style={{ color: t.ink }}>{c.label}</span>}
          </span>
        ))}
      </nav>
      <div className="relative overflow-hidden rounded-[26px]" style={{ background: `linear-gradient(115deg, ${t.pastels.mint}, ${mix(t.primary, 4, '#FBFCF8')})`, color: t.ink }}>
        {image && (
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[40%] [mask-image:linear-gradient(90deg,transparent,#000_40%)] lg:block">
            <img src={image} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <Sparkle className="pointer-events-none absolute left-[46%] top-6 hidden lg:block" color={t.accent} size={22} />
        <div className="relative flex flex-col gap-6 px-6 py-8 sm:px-10 sm:py-10 lg:flex-row lg:items-end lg:justify-between">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: amEase }} className="max-w-2xl">
            {eyebrow && <p className="inline-flex rounded-full bg-white px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.1em]" style={{ color: t.primaryInk, fontFamily: t.display }}>{eyebrow}</p>}
            <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.025em] sm:text-[48px]" style={{ fontFamily: t.display }}>{title}</h1>
            {subtitle && <div className="mt-3 text-[14.5px] leading-relaxed" style={{ color: t.muted }}>{subtitle}</div>}
          </motion.div>
          {children && <div className="relative lg:max-w-[500px] lg:flex-1">{children}</div>}
        </div>
      </div>
    </section>
  );
}

/** Destello de cuatro puntas de la referencia (decorativo). */
export function Sparkle({ color, size = 20, className = '' }: { color: string; size?: number; className?: string }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M12 0c.6 6.2 2.3 9.9 12 12-9.7 2.1-11.4 5.8-12 12-.6-6.2-2.3-9.9-12-12C9.7 9.9 11.4 6.2 12 0Z" fill={color} />
    </svg>
  );
}

/** Garabato de corazón a mano alzada (decorativo, como el de la referencia). */
export function HeartDoodle({ color, className = '' }: { color: string; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 64 56" className={className} fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 50C14 38 5 28 6 17 7 8 16 3 24 6c4 1.5 6.5 4.6 8 8 1.6-3.6 4.4-6.7 8.6-8C49 3.6 58 9 58 18.5 58 29 49 38.5 32 50Z" />
      <path d="M44 8c3 .4 6 2.6 7 6" opacity=".6" />
    </svg>
  );
}

/** Subrayado a mano alzada para la palabra en script. */
export function ScribbleUnderline({ color, className = '' }: { color: string; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 220 18" preserveAspectRatio="none" className={className} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round">
      <path d="M4 12C46 5 98 3 150 6c24 1.4 44 3.6 66 6.5" />
    </svg>
  );
}
