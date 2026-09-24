import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { StrideProductCard, displayStyle, type Theme } from './StrideParts';
import { mix, stEase, stItem, stReveal, stStagger, stViewport } from './motion';

/**
 * Piezas compartidas por Home, Catálogo, Detalle y Contacto de la plantilla Zapatos (Stride).
 * Todo lo que tiene estado propio (rail con scroll, reloj) vive aislado aquí a nivel de módulo.
 */

export type OpenFn = (p: any) => void;
export type AddFn = (p: any, qty?: number) => void;

export const getName = (item: any) => (typeof item === 'string' ? item : item?.nombre || item?.name || '');
export const hasImage = (p: any) => Boolean(p?.imagenUrl);

/** Ícono por palabra clave de la categoría (solo decorativo; la categoría es la real). */
export function categoryIcon(name: string): string {
  const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/run|corr|trail|atlet/.test(n)) return 'mdi:run-fast';
  if (/basket|basq/.test(n)) return 'mdi:basketball';
  if (/futbol|soccer|chimpun|tachon/.test(n)) return 'mdi:soccer';
  if (/train|gym|entren|fitness/.test(n)) return 'mdi:dumbbell';
  if (/sandal|chancl|slide|playa/.test(n)) return 'mdi:shoe-cleat';
  if (/bota|botin|boot/.test(n)) return 'mdi:shoe-formal';
  if (/tacon|taco|mujer|dama|stiletto/.test(n)) return 'mdi:shoe-heel';
  if (/nino|nina|infant|kids|escolar|bebe/.test(n)) return 'mdi:baby-face-outline';
  if (/vestir|formal|oxford|derby|mocas|cuero/.test(n)) return 'mdi:shoe-formal';
  if (/zapatill|sneaker|urban|casual|lifestyle|tenis/.test(n)) return 'mdi:shoe-sneaker';
  if (/accesor|medias|calcet|plantill|cordon|limp/.test(n)) return 'solar:tag-linear';
  return 'mdi:shoe-print';
}

/** Fin real más próximo de una oferta (fechaFinOferta). null = sin fecha → sin reloj. */
export function soonestOfferEnd(offers: any[]): number | null {
  const now = Date.now();
  const ends = offers
    .map((p) => (p?.fechaFinOferta ? new Date(p.fechaFinOferta).getTime() : NaN))
    .filter((n) => Number.isFinite(n) && n > now);
  return ends.length ? Math.min(...ends) : null;
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
    socials,
  };
}
export type Channels = ReturnType<typeof storeChannels>;

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

// ───────────────────────────────────────────────────────────── UI ──
export function SectionHeader({ t, title, eyebrow, onMore, moreLabel = 'Ver todo', right }: { t: Theme; title: string; eyebrow?: string; onMore?: () => void; moreLabel?: string; right?: ReactNode }) {
  return (
    <motion.div variants={stReveal} initial="hidden" whileInView="show" viewport={stViewport} className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: t.primaryInk }}>{eyebrow}</p>}
        <h2 className="text-[20px] font-extrabold uppercase leading-[1.1] sm:text-[24px]" style={displayStyle(t, { color: t.ink })}>{title}</h2>
      </div>
      {right ?? (onMore && (
        <button type="button" onClick={onMore} className="group inline-flex shrink-0 items-center gap-2 text-[13px] font-semibold" style={{ color: t.ink }}>
          {moreLabel}
          <Icon icon="solar:arrow-right-linear" width={17} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      ))}
    </motion.div>
  );
}

export function ProductGrid({ t, products, slug, onOpen, onAdd, cols = 'lg:grid-cols-4' }: { t: Theme; products: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn; cols?: string }) {
  return (
    <motion.div variants={stStagger} initial="hidden" whileInView="show" viewport={stViewport} className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 ${cols}`}>
      {products.map((p, i) => (
        <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={stItem} className="h-full">
          <StrideProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export function GridSkeleton({ t, count = 4, cols = 'lg:grid-cols-4' }: { t: Theme; count?: number; cols?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => <div key={i} className="h-[360px] animate-pulse rounded-[22px]" style={{ background: t.soft }} />)}
    </div>
  );
}

/** Rail horizontal con flechas. Estado del scroll aislado en este componente. */
export function ProductRail({ t, title, eyebrow, products, slug, onOpen, onAdd, onMore, moreLabel }: { t: Theme; title: string; eyebrow?: string; products: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn; onMore?: () => void; moreLabel?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const update = () => {
    const el = ref.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  };
  useEffect(() => { update(); }, [products.length]);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  if (!products.length) return null;
  const arrow = (dir: number, icon: string, label: string, hidden: boolean) => (
    <button type="button" aria-label={label} disabled={hidden} onClick={() => scroll(dir)} className="flex h-11 w-11 items-center justify-center rounded-full border bg-white transition-opacity disabled:opacity-35" style={{ borderColor: t.line, color: t.ink }}>
      <Icon icon={icon} width={19} />
    </button>
  );
  return (
    <section className="mx-auto max-w-[1320px] px-4 py-10 lg:px-8">
      <SectionHeader
        t={t}
        eyebrow={eyebrow}
        title={title}
        right={
          <div className="flex items-center gap-3">
            {onMore && <button type="button" onClick={onMore} className="group hidden items-center gap-2 text-[13px] font-semibold sm:inline-flex" style={{ color: t.ink }}>{moreLabel || 'Ver todo'} <Icon icon="solar:arrow-right-linear" width={17} className="transition-transform duration-300 group-hover:translate-x-1" /></button>}
            {arrow(-1, 'solar:alt-arrow-left-linear', 'Anterior', edge.start)}
            {arrow(1, 'solar:alt-arrow-right-linear', 'Siguiente', edge.end)}
          </div>
        }
      />
      <motion.div ref={ref} onScroll={update} variants={stStagger} initial="hidden" whileInView="show" viewport={stViewport} className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-3 [scrollbar-width:none] sm:gap-4 lg:-mx-8 lg:scroll-px-8 lg:px-8 [&::-webkit-scrollbar]:hidden">
        {products.map((p, i) => (
          <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={stItem} className="w-[62%] shrink-0 snap-start sm:w-[36%] md:w-[29%] lg:w-[calc((100%-4rem)/5)]">
            <StrideProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/** Reloj hasta el fin REAL de una oferta (fechaFinOferta). Su tick de 1s solo re-renderiza este componente. */
export function OfferCountdown({ t, endsAt, compact = false }: { t: Theme; endsAt: number; compact?: boolean }) {
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
        <span key={label} className={`inline-flex items-baseline gap-0.5 rounded-full bg-white font-bold tabular-nums ${compact ? 'px-2 py-1 text-[12px]' : 'px-3 py-1.5 text-[14px]'}`} style={{ color: t.ink }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={value} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }} transition={{ duration: 0.3, ease: stEase }}>{value}</motion.span>
          </AnimatePresence>
          <span className="text-[10px] font-semibold" style={{ color: t.muted }}>{label}</span>
        </span>
      ))}
    </div>
  );
}

/** Banda superior de página (catálogo / contacto): tarjeta redondeada como el hero del home. */
export function PageHero({ t, crumbs, eyebrow, title, subtitle, image, children }: { t: Theme; crumbs: { label: string; onClick?: () => void }[]; eyebrow?: string; title: string; subtitle?: ReactNode; image?: string; children?: ReactNode }) {
  return (
    <section className="mx-auto max-w-[1320px] px-4 pt-5 lg:px-8">
      <div className="relative overflow-hidden rounded-[28px] px-6 py-9 sm:px-10 sm:py-12" style={{ background: `linear-gradient(120deg, ${mix(t.primary, 9, '#fff')} 0%, ${mix(t.primary, 4, t.bg)} 100%)` }}>
        {image && (
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] [mask-image:linear-gradient(90deg,transparent,#000_45%)] md:block">
            <img src={image} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="relative max-w-2xl">
          <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1.5 text-[12px] font-medium" style={{ color: t.muted }}>
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
                {i > 0 && <Icon icon="solar:alt-arrow-right-linear" width={12} />}
                {c.onClick ? <button type="button" onClick={c.onClick} className="hover:text-stone-900">{c.label}</button> : <span style={{ color: t.ink }}>{c.label}</span>}
              </span>
            ))}
          </nav>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: stEase }}>
            {eyebrow && <span className="mt-5 inline-flex rounded-full bg-white/80 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.16em]" style={{ color: t.ink }}>{eyebrow}</span>}
            <h1 className="mt-3 text-[30px] font-extrabold uppercase leading-[1.02] sm:text-[42px]" style={displayStyle(t, { color: t.ink })}>{title}</h1>
            {subtitle && <div className="mt-3 max-w-xl text-[14px] leading-relaxed" style={{ color: t.muted }}>{subtitle}</div>}
          </motion.div>
          {children}
        </div>
      </div>
    </section>
  );
}
