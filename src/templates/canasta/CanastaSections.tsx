import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { CanastaProductCard, type Theme } from './CanastaParts';
import { caEase, caItem, caReveal, caStagger, caViewport, mix } from './motion';

/**
 * Piezas compartidas por Home, Catálogo, Detalle y Contacto de la plantilla Abarrotes (Canasta).
 * Todo lo que tiene estado propio (rail con scroll, reloj) vive aislado a nivel de módulo.
 */

export type OpenFn = (p: any) => void;
export type AddFn = (p: any, qty?: number) => void;

export const getName = (item: any) => (typeof item === 'string' ? item : item?.nombre || item?.name || '');
export const hasImage = (p: any) => Boolean(p?.imagenUrl);
/** Firma de una lista: si cambian los productos, el contenedor escalonado se remonta y vuelve a entrar. */
export const listSig = (products: any[]) => products.map((p) => p?.id ?? p?.descripcion).join('|');

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

/** Canales de contacto REALES de la tienda. Campo vacío → null (la UI lo oculta). */
export function storeChannels(tienda: any, diseno?: any) {
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const wa = (msg = '') => buildStorePurchaseWhatsappUrl(waNumber, msg);
  const hasWhatsapp = Boolean(wa('Hola'));
  const phoneRaw = String(tienda?.telefono || '').trim();
  // Une sin repetir partes que ya vienen dentro de la dirección ("… LIMA - SAN MIGUEL" + "SAN MIGUEL").
  const address = [tienda?.direccion, tienda?.distrito, tienda?.provincia].map((v) => String(v || '').trim()).filter(Boolean)
    .reduce((acc: string[], v) => (acc.some((x) => x.toLowerCase().includes(v.toLowerCase())) ? acc : [...acc, v]), []).join(', ');
  const pickup = String(tienda?.direccionRecojo || '').trim() || address;
  const socials = [
    tienda?.facebookUrl ? { icon: 'ic:baseline-facebook', label: 'Facebook', url: tienda.facebookUrl } : null,
    tienda?.instagramUrl ? { icon: 'mdi:instagram', label: 'Instagram', url: tienda.instagramUrl } : null,
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
    socials,
  };
}
export type Channels = ReturnType<typeof storeChannels>;

// ───────────────────────────────────────────────────────────── UI ──
/** Título de sección de la referencia: título fuerte a la izquierda + "Ver todo →" en color de marca. */
export function SectionHeader({ t, title, subtitle, onMore, moreLabel = 'Ver todo', right }: { t: Theme; title: string; subtitle?: string; onMore?: () => void; moreLabel?: string; right?: ReactNode }) {
  return (
    <motion.div variants={caReveal} initial="hidden" whileInView="show" viewport={caViewport} className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-[20px] font-bold tracking-[-0.01em] sm:text-[24px]" style={{ color: t.ink, fontFamily: t.serif }}>{title}</h2>
        {subtitle && <p className="mt-0.5 text-[13px]" style={{ color: t.muted }}>{subtitle}</p>}
      </div>
      {right ?? (onMore && (
        <button type="button" onClick={onMore} className="group inline-flex shrink-0 items-center gap-1.5 text-[13px] font-bold" style={{ color: t.primaryInk }}>
          {moreLabel}<Icon icon="solar:arrow-right-linear" width={16} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      ))}
    </motion.div>
  );
}

export function ProductGrid({ t, products, slug, onOpen, onAdd, cols = 'lg:grid-cols-4', compact = false }: { t: Theme; products: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn; cols?: string; compact?: boolean }) {
  return (
    <motion.div key={listSig(products)} variants={caStagger} initial="hidden" whileInView="show" viewport={caViewport} className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${cols}`}>
      {products.map((p, i) => (
        <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={caItem} className="h-full">
          <CanastaProductCard producto={p} slug={slug} t={t} compact={compact} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export function GridSkeleton({ t, count = 4, cols = 'lg:grid-cols-4' }: { t: Theme; count?: number; cols?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => <div key={i} className="h-[340px] animate-pulse rounded-2xl" style={{ background: t.soft }} />)}
    </div>
  );
}

/** Rail horizontal (5 por fila en escritorio). Estado del scroll aislado aquí. */
export function ProductRail({ t, title, subtitle, products, slug, onOpen, onAdd, onMore, right }: { t: Theme; title: string; subtitle?: string; products: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn; onMore?: () => void; right?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const sig = listSig(products);
  const update = () => { const el = ref.current; if (el) setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 }); };
  useEffect(() => { update(); }, [sig]);
  if (!products.length) return null;
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  const arrow = (dir: number, icon: string, label: string, off: boolean, pos: string) => (
    <button type="button" aria-label={label} disabled={off} onClick={() => scroll(dir)} className={`absolute top-[36%] z-10 hidden h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_10px_24px_-12px_rgba(27,29,28,0.5)] transition-opacity disabled:pointer-events-none disabled:opacity-0 lg:flex ${pos}`} style={{ color: t.ink }}>
      <Icon icon={icon} width={17} />
    </button>
  );
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-8 lg:px-8">
      <SectionHeader t={t} title={title} subtitle={subtitle} onMore={onMore} right={right} />
      <div className="relative">
        {arrow(-1, 'solar:alt-arrow-left-linear', 'Anterior', edge.start, '-left-5')}
        {arrow(1, 'solar:alt-arrow-right-linear', 'Siguiente', edge.end, '-right-5')}
        <motion.div key={sig} ref={ref} onScroll={update} variants={caStagger} initial="hidden" whileInView="show" viewport={caViewport} className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
          {products.map((p, i) => (
            <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={caItem} className="w-[62%] shrink-0 snap-start sm:w-[36%] md:w-[29%] lg:w-[calc((100%-3rem)/5)]">
              <CanastaProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/** Reloj hasta el fin REAL de una oferta. Su tick de 1s solo re-renderiza este componente. */
export function OfferCountdown({ t, endsAt, label = 'Termina en' }: { t: Theme; endsAt: number; label?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const s = Math.max(0, Math.floor((endsAt - now) / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  const days = Math.floor(s / 86400);
  const parts = days > 0
    ? [`${days}d`, pad(Math.floor((s % 86400) / 3600)), pad(Math.floor((s % 3600) / 60))]
    : [pad(Math.floor(s / 3600)), pad(Math.floor((s % 3600) / 60)), pad(s % 60)];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12.5px] font-bold" style={{ background: mix(t.sale, 12, '#fff'), color: t.sale }} aria-label="Tiempo restante de la oferta">
      <Icon icon="solar:clock-circle-bold" width={15} />{label}
      <span className="inline-flex items-center gap-0.5 tabular-nums">
        {parts.map((v, i) => (
          <span key={i} className="inline-flex items-center">
            {i > 0 && <span className="px-0.5 opacity-70">:</span>}
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={v} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 6, opacity: 0 }} transition={{ duration: 0.28, ease: caEase }} className="inline-block">{v}</motion.span>
            </AnimatePresence>
          </span>
        ))}
      </span>
    </span>
  );
}

/** Banda superior de página (catálogo / contacto). */
export function PageHero({ t, crumbs, eyebrow, title, subtitle, image, children }: { t: Theme; crumbs: { label: string; onClick?: () => void }[]; eyebrow?: string; title: string; subtitle?: ReactNode; image?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden" style={{ background: `linear-gradient(100deg, ${t.bg} 0%, ${t.soft} 100%)` }}>
      {image && (
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] [mask-image:linear-gradient(90deg,transparent,#000_42%)] md:block">
          <img src={image} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="relative mx-auto max-w-[1280px] px-4 py-10 lg:px-8 lg:py-14">
        <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1.5 text-[12px] font-semibold" style={{ color: t.muted }}>
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
              {i > 0 && <Icon icon="solar:alt-arrow-right-linear" width={12} />}
              {c.onClick ? <button type="button" onClick={c.onClick} className="hover:text-stone-900">{c.label}</button> : <span style={{ color: t.ink }}>{c.label}</span>}
            </span>
          ))}
        </nav>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: caEase }} className="max-w-xl">
          {eyebrow && <p className="mt-6 text-[12px] font-extrabold uppercase tracking-[0.16em]" style={{ color: t.accentInk }}>{eyebrow}</p>}
          <h1 className="mt-2 text-[38px] leading-[1.02] sm:text-[50px]" style={{ color: t.ink, fontFamily: t.serif }}>{title}</h1>
          {subtitle && <div className="mt-3 text-[14px] leading-relaxed" style={{ color: t.muted }}>{subtitle}</div>}
        </motion.div>
        {children}
      </div>
    </section>
  );
}

/** Subrayado a mano alzada de la referencia (SVG, se tiñe con el acento). */
export function Swoosh({ color, className = '' }: { color: string; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 220 18" preserveAspectRatio="none" className={className}>
      <path d="M3 13c38-7 92-11 150-9 22 1 43 3 64 6" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════ ESTADÍSTICAS ══
/** Tarjeta de estadística de la banda de confianza. */
export function StatBlock({ t, icon, value, label }: { t: Theme; icon: string; value: string; label: string }) {
  return (
    <motion.div variants={caItem} className="flex flex-col items-center px-3 text-center">
      <Icon icon={icon} width={26} style={{ color: t.primaryInk }} />
      <span className="mt-1.5 text-[22px] font-extrabold leading-none" style={{ color: t.ink }}>{value}</span>
      <span className="mt-1 text-[12px] font-semibold" style={{ color: t.muted }}>{label}</span>
    </motion.div>
  );
}

