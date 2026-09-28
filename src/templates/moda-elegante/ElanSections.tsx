import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { ElanProductCard, labelCls, isOn, type Theme } from './ElanParts';
import { elEase, elItem, elReveal, elStagger, elViewport } from './motion';

/**
 * Piezas compartidas por Home, Catálogo, Detalle y Contacto de la plantilla Moda Elegante (Élan).
 * Todo lo que tiene estado propio (rail con scroll, reloj) vive aislado a nivel de módulo.
 */

export type OpenFn = (p: any) => void;
export type AddFn = (p: any, qty?: number) => void;

export const getName = (item: any) => (typeof item === 'string' ? item : item?.nombre || item?.name || '');
export const hasImage = (p: any) => Boolean(p?.imagenUrl);
/** Ajuste de fotos de producto elegido en Personalizar (recortar a 4:5 o foto completa). */
export const photoFit = (diseno: any): 'cover' | 'contain' => (isOn(diseno?.modaEleganteFotosCompletas) ? 'contain' : 'cover');

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

/** Usuario de Instagram a partir de la URL real (null si no se puede leer). */
export function instagramHandle(url: any): string | null {
  const m = String(url || '').match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  return m && !['p', 'reel', 'stories', 'explore'].includes(m[1].toLowerCase()) ? m[1] : null;
}

/** Une partes de dirección sin repetir las que ya vienen dentro de la dirección (p. ej. "San Isidro, Lima"). */
export function joinAddress(parts: any[]): string {
  const out: string[] = [];
  for (const raw of parts) {
    const v = String(raw || '').trim().replace(/\s+/g, ' ');
    if (v && !out.some((x) => x.toLowerCase().includes(v.toLowerCase()))) out.push(v);
  }
  return out.join(', ');
}

/** Canales de contacto REALES de la tienda. Campo vacío → null (la UI lo oculta). */
export function storeChannels(tienda: any, diseno?: any) {
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const wa = (msg = '') => buildStorePurchaseWhatsappUrl(waNumber, msg);
  const hasWhatsapp = Boolean(wa('Hola'));
  const phoneRaw = String(tienda?.telefono || '').trim();
  const address = joinAddress([tienda?.direccion, tienda?.distrito, tienda?.provincia]);
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
/** Encabezado de sección de la referencia: etiqueta en mayúsculas a la izquierda, enlace a la derecha. */
export function SectionHeader({ t, title, subtitle, onMore, moreLabel = 'Ver todo', right, serif = false }: { t: Theme; title: string; subtitle?: string; onMore?: () => void; moreLabel?: string; right?: ReactNode; serif?: boolean }) {
  return (
    <motion.div variants={elReveal} initial="hidden" whileInView="show" viewport={elViewport} className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {serif
          ? <h2 className="text-[28px] leading-tight sm:text-[34px]" style={{ color: t.ink, fontFamily: t.display }}>{title}</h2>
          : <h2 className={`${labelCls} text-[12.5px] sm:text-[13px]`} style={{ color: t.ink }}>{title}</h2>}
        {subtitle && <p className="mt-1.5 text-[13px]" style={{ color: t.muted }}>{subtitle}</p>}
      </div>
      {right ?? (onMore && (
        <button type="button" onClick={onMore} className={`${labelCls} group inline-flex shrink-0 items-center gap-1.5 pb-0.5`} style={{ color: t.ink }}>
          <span className="bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]" style={{ backgroundImage: `linear-gradient(${t.ink}, ${t.ink})` }}>{moreLabel}</span>
        </button>
      ))}
    </motion.div>
  );
}

export function ProductGrid({ t, products, slug, onOpen, onAdd, cols = 'lg:grid-cols-4', fit = 'cover' }: { t: Theme; products: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn; cols?: string; fit?: 'cover' | 'contain' }) {
  return (
    <motion.div variants={elStagger} initial="hidden" whileInView="show" viewport={elViewport} className={`grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-4 ${cols}`}>
      {products.map((p, i) => (
        <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={elItem} className="h-full">
          <ElanProductCard producto={p} slug={slug} t={t} fit={fit} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export function GridSkeleton({ t, count = 4, cols = 'lg:grid-cols-4' }: { t: Theme; count?: number; cols?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-4 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[4/5] animate-pulse" style={{ background: t.soft }} />
          <div className="mt-3 h-3 w-3/4 animate-pulse" style={{ background: t.soft }} />
          <div className="mt-2 h-3 w-1/3 animate-pulse" style={{ background: t.soft }} />
        </div>
      ))}
    </div>
  );
}

/** Rail horizontal con flechas (relacionados en la ficha). Estado del scroll aislado aquí. */
export function ProductRail({ t, title, subtitle, products, slug, onOpen, onAdd, onMore, fit = 'cover' }: { t: Theme; title: string; subtitle?: string; products: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn; onMore?: () => void; fit?: 'cover' | 'contain' }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const update = () => { const el = ref.current; if (el) setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 }); };
  useEffect(() => { update(); }, [products.length]);
  if (!products.length) return null;
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  const arrows = (
    <div className="hidden items-center gap-1 lg:flex">
      {[{ d: -1, icon: 'solar:alt-arrow-left-linear', label: 'Anterior', off: edge.start }, { d: 1, icon: 'solar:alt-arrow-right-linear', label: 'Siguiente', off: edge.end }].map((b) => (
        <button key={b.d} type="button" aria-label={b.label} disabled={b.off} onClick={() => scroll(b.d)} className="flex h-10 w-10 items-center justify-center border transition-opacity disabled:opacity-30" style={{ borderColor: t.line, color: t.ink }}>
          <Icon icon={b.icon} width={16} />
        </button>
      ))}
    </div>
  );
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-12 lg:px-10">
      <SectionHeader t={t} title={title} subtitle={subtitle} onMore={onMore} right={onMore ? undefined : arrows} />
      <motion.div ref={ref} onScroll={update} variants={elStagger} initial="hidden" whileInView="show" viewport={elViewport} className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-3 [scrollbar-width:none] sm:gap-4 lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
        {products.map((p, i) => (
          <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={elItem} className="w-[58%] shrink-0 snap-start sm:w-[36%] md:w-[29%] lg:w-[calc((100%-5rem)/6)]">
            <ElanProductCard producto={p} slug={slug} t={t} fit={fit} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
          </motion.div>
        ))}
      </motion.div>
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
        <span key={label} className="inline-flex items-baseline gap-0.5 px-2 py-1 text-[13px] font-semibold tabular-nums" style={light ? { background: 'rgba(255,255,255,.14)', color: '#fff' } : { background: '#fff', color: t.ink }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={value} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }} transition={{ duration: 0.3, ease: elEase }}>{value}</motion.span>
          </AnimatePresence>
          <span className="text-[10px] opacity-60">{label}</span>
        </span>
      ))}
    </div>
  );
}

/** Banda superior de página (catálogo / contacto): título serif grande con foto a la derecha. */
export function PageHero({ t, crumbs, eyebrow, title, subtitle, image, children }: { t: Theme; crumbs: { label: string; onClick?: () => void }[]; eyebrow?: string; title: string; subtitle?: ReactNode; image?: string; children?: ReactNode }) {
  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-5 lg:px-10">
      <div className="relative overflow-hidden" style={{ background: t.sand }}>
        {image && (
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] md:block">
            <img src={image} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${t.sand} 0%, transparent 38%)` }} />
          </div>
        )}
        <div className="relative px-6 py-10 sm:px-10 lg:py-14">
          <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1.5 text-[11.5px] uppercase tracking-[0.12em]" style={{ color: t.muted }}>
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
                {i > 0 && <span aria-hidden>/</span>}
                {c.onClick ? <button type="button" onClick={c.onClick} className="hover:text-stone-900">{c.label}</button> : <span style={{ color: t.ink }}>{c.label}</span>}
              </span>
            ))}
          </nav>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: elEase }} className="max-w-xl">
            {eyebrow && <p className={`${labelCls} mt-7`} style={{ color: t.accentInk }}>{eyebrow}</p>}
            <h1 className="mt-3 text-[38px] leading-[1.02] tracking-[-0.01em] sm:text-[54px]" style={{ color: t.ink, fontFamily: t.display }}>{title}</h1>
            {subtitle && <div className="mt-3 text-[13.5px] leading-relaxed" style={{ color: t.muted }}>{subtitle}</div>}
          </motion.div>
          {children}
        </div>
      </div>
    </section>
  );
}
