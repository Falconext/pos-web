import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { PatitasProductCard, type Theme } from './PatitasParts';
import { mix, ptEase, ptItem, ptReveal, ptStagger, ptViewport } from './motion';

/**
 * Piezas compartidas por Home, Catálogo, Detalle y Contacto de la plantilla Mascotas (Patitas).
 * Todo lo que tiene estado propio (rail con scroll, reloj, carga de reseñas) vive aislado a nivel de módulo.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

export type OpenFn = (p: any) => void;
export type AddFn = (p: any, qty?: number) => void;

export const getName = (item: any) => (typeof item === 'string' ? item : item?.nombre || item?.name || '');
export const hasImage = (p: any) => Boolean(p?.imagenUrl);

/** Ícono por palabra clave de la categoría (solo decorativo; la categoría es la real). */
export function categoryIcon(name: string): string {
  const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/pase|correa|collar|arnes|walk/.test(n)) return 'ph:dog-light';
  if (/aliment|comida|croquet|snack|premio|golosin|feed|plato|comeder/.test(n)) return 'ph:bowl-food-light';
  if (/cama|descans|cucha|casa|transport|jaula|rest/.test(n)) return 'ph:bed-light';
  if (/juguet|jueg|play|pelota/.test(n)) return 'ph:tennis-ball-light';
  if (/bano|higien|shampoo|cepill|groom|estetic|peluq/.test(n)) return 'ph:bathtub-light';
  if (/salud|farmac|medic|antipulg|desparasit|vacun|vet|care|botiquin/.test(n)) return 'ph:first-aid-kit-light';
  if (/gato|felin|arena|rascador/.test(n)) return 'ph:cat-light';
  if (/ropa|abrigo|polo|disfraz/.test(n)) return 'ph:t-shirt-light';
  if (/ave|pez|acuar|roedor|hamster|conejo/.test(n)) return 'ph:fish-light';
  return 'ph:paw-print-light';
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
export function SectionHeader({ t, title, subtitle, icon = 'ph:paw-print-fill', onMore, moreLabel = 'Ver todo', right }: { t: Theme; title: string; subtitle?: string; icon?: string; onMore?: () => void; moreLabel?: string; right?: ReactNode }) {
  return (
    <motion.div variants={ptReveal} initial="hidden" whileInView="show" viewport={ptViewport} className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2.5 text-[22px] font-extrabold leading-tight tracking-[-0.01em] sm:text-[25px]" style={{ color: t.ink }}>
          <Icon icon={icon} width={24} style={{ color: t.primaryInk }} />{title}
        </h2>
        {subtitle && <p className="mt-1 text-[13.5px] font-medium" style={{ color: t.muted }}>{subtitle}</p>}
      </div>
      {right ?? (onMore && (
        <button type="button" onClick={onMore} className="group inline-flex shrink-0 items-center gap-1.5 text-[13.5px] font-extrabold" style={{ color: t.accentInk }}>
          {moreLabel}
          <Icon icon="solar:arrow-right-linear" width={16} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      ))}
    </motion.div>
  );
}

export function ProductGrid({ t, products, slug, onOpen, onAdd, cols = 'lg:grid-cols-4' }: { t: Theme; products: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn; cols?: string }) {
  return (
    <motion.div variants={ptStagger} initial="hidden" whileInView="show" viewport={ptViewport} className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 ${cols}`}>
      {products.map((p, i) => (
        <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={ptItem} className="h-full">
          <PatitasProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export function GridSkeleton({ t, count = 4, cols = 'lg:grid-cols-4' }: { t: Theme; count?: number; cols?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => <div key={i} className="h-[380px] animate-pulse rounded-2xl" style={{ background: t.soft }} />)}
    </div>
  );
}

/** Rail horizontal con flechas laterales (como la referencia). Estado del scroll aislado aquí. */
export function ProductRail({ t, title, subtitle, products, slug, onOpen, onAdd, onMore }: { t: Theme; title: string; subtitle?: string; products: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn; onMore?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const update = () => { const el = ref.current; if (el) setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 }); };
  useEffect(() => { update(); }, [products.length]);
  if (!products.length) return null;
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  const arrow = (dir: number, icon: string, label: string, off: boolean, pos: string) => (
    <button type="button" aria-label={label} disabled={off} onClick={() => scroll(dir)} className={`absolute top-[38%] z-10 hidden h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_10px_24px_-12px_rgba(42,46,38,0.5)] transition-opacity disabled:pointer-events-none disabled:opacity-0 lg:flex ${pos}`} style={{ color: t.ink }}>
      <Icon icon={icon} width={18} />
    </button>
  );
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-10 lg:px-8">
      <SectionHeader t={t} title={title} subtitle={subtitle} onMore={onMore} />
      <div className="relative">
        {arrow(-1, 'solar:alt-arrow-left-linear', 'Anterior', edge.start, '-left-5')}
        {arrow(1, 'solar:alt-arrow-right-linear', 'Siguiente', edge.end, '-right-5')}
        <motion.div ref={ref} onScroll={update} variants={ptStagger} initial="hidden" whileInView="show" viewport={ptViewport} className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-3 [scrollbar-width:none] sm:gap-4 lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
          {products.map((p, i) => (
            <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={ptItem} className="w-[62%] shrink-0 snap-start sm:w-[36%] md:w-[29%] lg:w-[calc((100%-4rem)/5)]">
              <PatitasProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
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
        <span key={label} className="inline-flex items-baseline gap-0.5 rounded-[4px] px-2 py-1 text-[13px] font-semibold tabular-nums" style={light ? { background: 'rgba(255,255,255,.14)', color: '#fff' } : { background: '#fff', color: t.ink }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={value} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }} transition={{ duration: 0.3, ease: ptEase }}>{value}</motion.span>
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
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: ptEase }} className="max-w-xl">
          {eyebrow && <p className="mt-6 text-[12px] font-extrabold uppercase tracking-[0.16em]" style={{ color: t.accentInk }}>{eyebrow}</p>}
          <h1 className="mt-2 text-[34px] font-extrabold leading-[1.05] tracking-[-0.02em] sm:text-[44px]" style={{ color: t.ink }}>{title}</h1>
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
export function RealReviews({ t, slug, products, title }: { t: Theme; slug: string; products: any[]; title: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
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
        setReviews(list.sort((a, b) => Number(b.rating) - Number(a.rating)).slice(0, 3));
      });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, key]);

  if (!reviews.length) return null;
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-8 lg:px-8">
      <motion.div variants={ptReveal} initial="hidden" whileInView="show" viewport={ptViewport} className="rounded-[28px] px-6 py-9 sm:px-10" style={{ background: mix(t.sky, 45, '#fff') }}>
        <h2 className="flex items-center justify-center gap-2 text-center text-[22px] font-extrabold" style={{ color: t.ink }}>{title}<Icon icon="ph:heart-duotone" width={24} style={{ color: t.accentInk }} /></h2>
        <div className={`mt-7 grid gap-6 ${reviews.length === 1 ? 'mx-auto max-w-md' : reviews.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3 md:divide-x'}`} style={{ borderColor: mix(t.ink, 12, t.sky) }}>
          {reviews.map((r) => (
            <figure key={r.id} className="flex flex-col px-2 md:px-6" style={{ borderColor: mix(t.ink, 12, t.sky) }}>
              <Icon icon="ph:quotes-fill" width={28} style={{ color: mix(t.ink, 30, t.sky) }} />
              <blockquote className="mt-2 line-clamp-4 text-[14px] font-semibold leading-relaxed" style={{ color: t.ink }}>{String(r.comentario).trim()}</blockquote>
              <span className="mt-3 flex" style={{ color: '#F2A93B' }}>{Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon={i < Math.round(r.rating) ? 'solar:star-bold' : 'solar:star-linear'} width={13} />)}</span>
              <figcaption className="mt-auto flex items-center gap-2.5 pt-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[13px] font-extrabold" style={{ color: t.primaryInk }}>{(r.clienteNombre || 'C').trim().charAt(0).toUpperCase()}</span>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-[13px] font-extrabold" style={{ color: t.ink }}>— {r.clienteNombre || 'Cliente'}</span>
                  <span className="block truncate text-[11.5px]" style={{ color: t.muted }}>{r.compraVerificada ? 'Compra verificada · ' : ''}{r.producto}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
