import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { NordicaProductCard, type Theme } from './NordicaParts';
import { mix, ndEase, ndItem, ndReveal, ndStagger, ndViewport } from './motion';

/**
 * Piezas compartidas por Home, Catálogo, Detalle y Contacto de la plantilla Mueblería (Nórdica).
 * Todo lo que tiene estado propio (rail con scroll, reloj, carga de reseñas) vive aislado a nivel de módulo.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

export type OpenFn = (p: any) => void;
export type AddFn = (p: any, qty?: number) => void;

export const getName = (item: any) => (typeof item === 'string' ? item : item?.nombre || item?.name || '');
export const hasImage = (p: any) => Boolean(p?.imagenUrl);

/** Ícono por palabra clave del ambiente (solo decorativo; la categoría es la real). */
export function categoryIcon(name: string): string {
  const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/sala|sofa|living|sillon/.test(n)) return 'ph:couch-light';
  if (/dormit|cama|colchon|velador|bed/.test(n)) return 'ph:bed-light';
  if (/comedor|mesa|dining|silla/.test(n)) return 'ph:chair-light';
  if (/oficina|escritorio|office|estudio/.test(n)) return 'ph:desk-light';
  if (/ilumin|lampar|luz|luminar/.test(n)) return 'ph:lamp-light';
  if (/almacen|ropero|closet|comoda|aparador|estante|repostero|organiz/.test(n)) return 'ph:archive-light';
  if (/exterior|jardin|terraza|outdoor/.test(n)) return 'ph:tree-light';
  if (/decor|cuadro|espejo|alfombra|cojin|textil/.test(n)) return 'ph:plant-light';
  if (/infantil|nino|kids|bebe/.test(n)) return 'ph:baby-light';
  if (/cocina|kitchen/.test(n)) return 'ph:cooking-pot-light';
  return 'ph:armchair-light';
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
export function Eyebrow({ t, children, className = '' }: { t: Theme; children: ReactNode; className?: string }) {
  return <p className={`text-[10.5px] font-semibold uppercase tracking-[0.24em] ${className}`} style={{ color: t.muted }}>{children}</p>;
}

export function SectionHeader({ t, title, eyebrow, onMore, moreLabel = 'Ver todo', right }: { t: Theme; title: string; eyebrow?: string; onMore?: () => void; moreLabel?: string; right?: ReactNode }) {
  return (
    <motion.div variants={ndReveal} initial="hidden" whileInView="show" viewport={ndViewport} className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <Eyebrow t={t} className="mb-2">{eyebrow}</Eyebrow>}
        <h2 className="text-[24px] font-medium leading-tight tracking-[-0.01em] sm:text-[28px]" style={{ color: t.ink }}>{title}</h2>
      </div>
      {right ?? (onMore && (
        <button type="button" onClick={onMore} className="group inline-flex shrink-0 items-center gap-2 text-[13px] font-medium" style={{ color: t.ink }}>
          {moreLabel}
          <Icon icon="solar:arrow-right-linear" width={16} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      ))}
    </motion.div>
  );
}

export function ProductGrid({ t, products, slug, onOpen, onAdd, cols = 'lg:grid-cols-4' }: { t: Theme; products: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn; cols?: string }) {
  return (
    <motion.div variants={ndStagger} initial="hidden" whileInView="show" viewport={ndViewport} className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 ${cols}`}>
      {products.map((p, i) => (
        <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={ndItem} className="h-full">
          <NordicaProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export function GridSkeleton({ t, count = 4, cols = 'lg:grid-cols-4' }: { t: Theme; count?: number; cols?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => <div key={i} className="h-[380px] animate-pulse rounded-[10px]" style={{ background: t.soft }} />)}
    </div>
  );
}

/** Rail horizontal con flechas. Estado del scroll aislado en este componente. */
export function ProductRail({ t, title, eyebrow, products, slug, onOpen, onAdd, onMore }: { t: Theme; title: string; eyebrow?: string; products: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn; onMore?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const update = () => { const el = ref.current; if (el) setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 }); };
  useEffect(() => { update(); }, [products.length]);
  if (!products.length) return null;
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  const arrow = (dir: number, icon: string, label: string, off: boolean) => (
    <button type="button" aria-label={label} disabled={off} onClick={() => scroll(dir)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white transition-opacity disabled:opacity-35" style={{ boxShadow: `inset 0 0 0 1px ${t.line}`, color: t.ink }}>
      <Icon icon={icon} width={17} />
    </button>
  );
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-12 lg:px-8">
      <SectionHeader t={t} eyebrow={eyebrow} title={title} right={
        <div className="flex items-center gap-3">
          {onMore && <button type="button" onClick={onMore} className="group hidden items-center gap-2 text-[13px] font-medium sm:inline-flex" style={{ color: t.ink }}>Ver todo <Icon icon="solar:arrow-right-linear" width={16} className="transition-transform duration-300 group-hover:translate-x-1" /></button>}
          {arrow(-1, 'solar:alt-arrow-left-linear', 'Anterior', edge.start)}
          {arrow(1, 'solar:alt-arrow-right-linear', 'Siguiente', edge.end)}
        </div>
      } />
      <motion.div ref={ref} onScroll={update} variants={ndStagger} initial="hidden" whileInView="show" viewport={ndViewport} className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-3 [scrollbar-width:none] sm:gap-5 lg:-mx-8 lg:scroll-px-8 lg:px-8 [&::-webkit-scrollbar]:hidden">
        {products.map((p, i) => (
          <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={ndItem} className="w-[64%] shrink-0 snap-start sm:w-[38%] md:w-[30%] lg:w-[calc((100%-3.75rem)/4)]">
            <NordicaProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
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
        <span key={label} className="inline-flex items-baseline gap-0.5 rounded-[4px] px-2 py-1 text-[13px] font-semibold tabular-nums" style={light ? { background: 'rgba(255,255,255,.14)', color: '#fff' } : { background: '#fff', color: t.ink }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={value} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }} transition={{ duration: 0.3, ease: ndEase }}>{value}</motion.span>
          </AnimatePresence>
          <span className="text-[10px] opacity-70">{label}</span>
        </span>
      ))}
    </div>
  );
}

/** Banda superior de página (catálogo / contacto). */
export function PageHero({ t, crumbs, eyebrow, title, subtitle, image, children }: { t: Theme; crumbs: { label: string; onClick?: () => void }[]; eyebrow?: string; title: string; subtitle?: ReactNode; image?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b" style={{ borderColor: t.line, background: t.soft }}>
      {image && (
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[50%] [mask-image:linear-gradient(90deg,transparent,#000_42%)] md:block">
          <img src={image} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="relative mx-auto max-w-[1280px] px-4 py-12 lg:px-8 lg:py-16">
        <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1.5 text-[12px]" style={{ color: t.muted }}>
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
              {i > 0 && <Icon icon="solar:alt-arrow-right-linear" width={12} />}
              {c.onClick ? <button type="button" onClick={c.onClick} className="hover:text-stone-900">{c.label}</button> : <span style={{ color: t.ink }}>{c.label}</span>}
            </span>
          ))}
        </nav>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: ndEase }} className="max-w-xl">
          {eyebrow && <Eyebrow t={t} className="mt-6">{eyebrow}</Eyebrow>}
          <h1 className="mt-2 text-[32px] font-medium leading-[1.08] tracking-[-0.02em] sm:text-[42px]" style={{ color: t.ink }}>{title}</h1>
          {subtitle && <div className="mt-3 text-[14px] leading-relaxed" style={{ color: t.muted }}>{subtitle}</div>}
        </motion.div>
        {children}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════ TESTIMONIOS REALES ══
type Review = { id: number; clienteNombre?: string; rating: number; comentario?: string; compraVerificada?: boolean; producto: string };

/**
 * Reseñas APROBADAS reales. Solo consulta productos que ya reportan ratingCount > 0 (máx. 4 peticiones);
 * si no hay ninguna con comentario, la sección no se muestra. Carga y estado aislados aquí.
 */
export function RealReviews({ t, slug, products, title, eyebrow }: { t: Theme; slug: string; products: any[]; title: string; eyebrow: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const withReviews = products.filter((p) => Number(p?.ratingCount || 0) > 0).slice(0, 4);
  const key = withReviews.map((p) => p.id).join(',');

  useEffect(() => {
    if (!slug || slug === 'preview' || !key) { setReviews([]); return; }
    let alive = true;
    Promise.all(withReviews.map((p) => axios.get(`${BASE_URL}/public/store/${slug}/products/${p.id}/reviews`)
      .then((r) => ((r.data?.data || r.data)?.reviews || []).map((rv: any) => ({ ...rv, producto: p.descripcion })))
      .catch(() => [])))
      .then((all) => {
        if (!alive) return;
        const list: Review[] = all.flat().filter((r: Review) => String(r.comentario || '').trim().length >= 8);
        setReviews(list.sort((a, b) => Number(b.rating) - Number(a.rating)).slice(0, 9));
      });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, key]);

  if (!reviews.length) return null;
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-12 lg:px-8">
      <SectionHeader t={t} eyebrow={eyebrow} title={title} right={reviews.length > 3 ? (
        <div className="flex gap-2">
          {[[-1, 'solar:alt-arrow-left-linear', 'Anterior'], [1, 'solar:alt-arrow-right-linear', 'Siguiente']].map(([d, ic, l]) => (
            <button key={String(d)} type="button" aria-label={String(l)} onClick={() => scroll(Number(d))} className="flex h-10 w-10 items-center justify-center rounded-full bg-white" style={{ boxShadow: `inset 0 0 0 1px ${t.line}`, color: t.ink }}><Icon icon={String(ic)} width={17} /></button>
          ))}
        </div>
      ) : undefined} />
      <div ref={ref} className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
        {reviews.map((r) => (
          <motion.figure key={r.id} variants={ndItem} initial="hidden" whileInView="show" viewport={ndViewport} className="flex w-[84%] shrink-0 snap-start flex-col rounded-[10px] border bg-white p-6 sm:w-[46%] lg:w-[calc((100%-2rem)/3)]" style={{ borderColor: t.line }}>
            <span className="flex" style={{ color: '#D9A43B' }}>{Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon={i < Math.round(r.rating) ? 'solar:star-bold' : 'solar:star-linear'} width={14} />)}</span>
            <blockquote className="mt-3 line-clamp-4 text-[14px] leading-relaxed" style={{ color: t.ink }}>“{String(r.comentario).trim()}”</blockquote>
            <figcaption className="mt-auto flex items-center gap-3 pt-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold" style={{ background: t.soft, color: t.ink }}>{(r.clienteNombre || 'C').trim().charAt(0).toUpperCase()}</span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[13px] font-semibold" style={{ color: t.ink }}>{r.clienteNombre || 'Cliente'}</span>
                <span className="block truncate text-[11.5px]" style={{ color: t.muted }}>{r.compraVerificada ? 'Compra verificada · ' : ''}{r.producto}</span>
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

/** Nota manuscrita (Caveat) de la referencia. */
export function ScriptNote({ t, text, className = '' }: { t: Theme; text: string; className?: string }) {
  if (!text) return null;
  return <p aria-hidden className={`whitespace-pre-line text-[22px] leading-[1.05] ${className}`} style={{ fontFamily: t.script, color: mix(t.ink, 70, t.bg) }}>{text}</p>;
}
