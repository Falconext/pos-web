import { useEffect, useRef, useState, type ReactNode } from 'react';
import axios from 'axios';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { OlmoProductCard, type Theme } from './OlmoParts';
import { olEase, olItem, olReveal, olStagger, olViewport, mix } from './motion';
import { productoEnCategoria } from '@/components/tienda/navTienda';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

/**
 * Piezas compartidas por Home, Catálogo, Detalle y Contacto de la plantilla Olmo.
 * Todo lo que tiene estado propio (rail con scroll, reloj, conteos) vive aislado a nivel de módulo.
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
/** Encabezado de sección de la referencia: título serif a la izquierda y "Ver todo →" a la derecha. */
export function SectionHeader({ t, eyebrow, title, subtitle, onMore, moreLabel = 'Ver todo', right, light = false }: { t: Theme; eyebrow?: string; title: string; subtitle?: string; icon?: string; onMore?: () => void; moreLabel?: string; right?: ReactNode; light?: boolean }) {
  return (
    <motion.div variants={olReveal} initial="hidden" whileInView="show" viewport={olViewport} className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.16em]" style={{ color: light ? t.accentOnDark : t.accentInk }}>{eyebrow}</p>}
        <h2 className="text-[28px] font-medium leading-[1.08] tracking-[-0.01em] sm:text-[32px]" style={{ color: light ? '#fff' : t.ink, fontFamily: t.display }}>{title}</h2>
        {subtitle && <p className="mt-1.5 text-[14px]" style={{ color: light ? 'rgba(255,255,255,.72)' : t.muted }}>{subtitle}</p>}
      </div>
      {right ?? (onMore && <MoreLink t={t} label={moreLabel} onClick={onMore} light={light} />)}
    </motion.div>
  );
}

/** "Ver todo →" de la referencia. */
export function MoreLink({ t, label, onClick, light = false }: { t: Theme; label: string; onClick: () => void; light?: boolean }) {
  return (
    <button type="button" onClick={onClick} className="group inline-flex shrink-0 items-center gap-2 text-[13.5px] font-medium" style={{ color: light ? '#fff' : t.ink }}>
      {label}
      <Icon icon="ph:arrow-right" width={17} className="transition-transform duration-300 group-hover:translate-x-1" />
    </button>
  );
}

export function ProductGrid({ t, products, slug, onOpen, onAdd, cols = 'lg:grid-cols-4' }: { t: Theme; products: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn; cols?: string }) {
  return (
    <motion.div key={products.map((p) => p?.id).join(',')} variants={olStagger} initial="hidden" whileInView="show" viewport={olViewport} className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 ${cols}`}>
      {products.map((p, i) => (
        <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={olItem} className="h-full">
          <OlmoProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export function GridSkeleton({ t, count = 4, cols = 'lg:grid-cols-4' }: { t: Theme; count?: number; cols?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[18px] bg-white p-2.5">
          <div className="aspect-[4/5] animate-pulse rounded-[14px]" style={{ background: t.soft }} />
          <div className="mt-3 h-3 w-3/4 animate-pulse rounded-full" style={{ background: t.soft }} />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full" style={{ background: t.soft }} />
        </div>
      ))}
    </div>
  );
}

/** Rail horizontal con flechas laterales (como "Best Sellers"). Estado del scroll aislado aquí. */
export function ProductRail({ t, title, subtitle, eyebrow, products, slug, onOpen, onAdd, onMore, moreLabel, right, bare = false, endCard }: { t: Theme; title: string; subtitle?: string; eyebrow?: string; icon?: string; products: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn; onMore?: () => void; moreLabel?: string; right?: ReactNode; bare?: boolean; endCard?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const update = () => { const el = ref.current; if (el) setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 }); };
  useEffect(() => {
    update();
    // Fuentes e imágenes cambian el ancho después del montaje: se vuelve a medir.
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    return () => ro.disconnect();
  }, [products.length]);
  if (!products.length) return null;
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  const arrow = (dir: number, icon: string, label: string, off: boolean, pos: string) => (
    <button type="button" aria-label={label} disabled={off} onClick={() => scroll(dir)} className={`absolute top-[34%] z-10 hidden h-11 w-11 items-center justify-center rounded-full border bg-white shadow-[0_12px_26px_-16px_rgba(31,28,24,0.5)] transition-opacity disabled:pointer-events-none disabled:opacity-0 lg:flex ${pos}`} style={{ color: t.ink, borderColor: t.line }}>
      <Icon icon={icon} width={18} />
    </button>
  );
  const body = (
    <>
      <SectionHeader t={t} eyebrow={eyebrow} title={title} subtitle={subtitle} onMore={onMore} moreLabel={moreLabel} right={right} />
      <div className="relative">
        {arrow(-1, 'ph:caret-left', 'Anterior', edge.start, '-left-5')}
        {arrow(1, 'ph:caret-right', 'Siguiente', edge.end, '-right-5')}
        <motion.div key={products.map((p) => p?.id).join(',')} ref={ref} onScroll={update} variants={olStagger} initial="hidden" whileInView="show" viewport={olViewport} className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-3 [scrollbar-width:none] sm:gap-4 lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
          {products.map((p, i) => (
            <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={olItem} className="w-[58%] shrink-0 snap-start sm:w-[36%] md:w-[29%] lg:w-[calc((100%-5rem)/6)]">
              <OlmoProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
            </motion.div>
          ))}
          {endCard && <motion.div variants={olItem} className="w-[58%] shrink-0 snap-start sm:w-[36%] md:w-[29%] lg:flex-1 lg:min-w-[calc((100%-5rem)/6)]">{endCard}</motion.div>}
        </motion.div>
      </div>
    </>
  );
  if (bare) return body;
  return <section className="mx-auto max-w-[1320px] px-4 py-12 sm:px-6">{body}</section>;
}

/**
 * Reloj hasta el fin REAL de una oferta. Su tick de 1s solo re-renderiza este componente.
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
        <span key={label} className={`flex flex-col items-center justify-center rounded-[12px] tabular-nums ${big ? 'h-[58px] w-[56px]' : 'h-[48px] w-[48px]'}`} style={light ? { background: 'rgba(255,255,255,.08)', color: '#fff', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.16)' } : { background: '#fff', color: t.ink, boxShadow: `inset 0 0 0 1px ${t.line}` }}>
          <span className="relative block overflow-hidden leading-none">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={value} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} transition={{ duration: 0.28, ease: olEase }} className={`block font-medium ${big ? 'text-[22px]' : 'text-[17px]'}`} style={{ fontFamily: t.display }}>{value}</motion.span>
            </AnimatePresence>
          </span>
          <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em] opacity-70">{label}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * Cabecera de página (catálogo, contacto): panel crema con migas, sobre-título en arena,
 * título serif con remate en cursiva y foto opcional en arco a la derecha.
 */
export function PageHero({ t, crumbs, eyebrow, title, subtitle, image, children }: { t: Theme; crumbs: { label: string; onClick?: () => void }[]; eyebrow?: string; title: string; subtitle?: ReactNode; image?: string; children?: ReactNode }) {
  return (
    <section className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6">
      <nav aria-label="Ruta" className="mb-4 flex flex-wrap items-center gap-1.5 px-1 text-[12.5px]" style={{ color: t.muted }}>
        {crumbs.map((c, i) => (
          <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
            {i > 0 && <Icon icon="ph:caret-right" width={11} />}
            {c.onClick ? <button type="button" onClick={c.onClick} className="hover:underline">{c.label}</button> : <span style={{ color: t.ink }}>{c.label}</span>}
          </span>
        ))}
      </nav>
      <div className="relative overflow-hidden rounded-[28px]" style={{ background: t.sand }}>
        {image && (
          <div aria-hidden className="pointer-events-none absolute bottom-0 right-[4%] top-6 hidden w-[30%] max-w-[380px] overflow-hidden rounded-t-full lg:block">
            <img src={image} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className={`relative flex flex-col gap-6 px-6 py-9 sm:px-10 sm:py-12 lg:flex-row lg:items-end lg:justify-between ${image ? 'lg:pr-[38%]' : ''}`}>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: olEase }} className="max-w-2xl">
            {eyebrow && <p className="text-[11.5px] font-semibold uppercase tracking-[0.18em]" style={{ color: t.accentInk }}>{eyebrow}</p>}
            <h1 className="mt-3 text-[40px] font-medium leading-[1.02] tracking-[-0.015em] sm:text-[56px]" style={{ fontFamily: t.display, color: t.ink }}>{title}</h1>
            {subtitle && <div className="mt-3 max-w-xl text-[15px] leading-relaxed" style={{ color: mix(t.ink, 72, t.bg) }}>{subtitle}</div>}
          </motion.div>
          {children && <div className="relative lg:max-w-[460px] lg:flex-1">{children}</div>}
        </div>
      </div>
    </section>
  );
}

/**
 * Cantidad REAL de productos por categoría (total que devuelve la API con ?category=).
 * Una carga por lista de nombres; sin datos (o en preview sin lista) no hay conteo.
 */
export function useCategoryCounts(slug: string, names: string[], localList: any[] = []) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const key = names.join('|');
  useEffect(() => {
    if (!names.length) { setCounts({}); return; }
    if (!slug || slug === 'preview') {
      const local: Record<string, number> = {};
      names.forEach((n) => { local[n] = localList.filter((p) => productoEnCategoria(p, n)).length; });
      setCounts(local);
      return;
    }
    let alive = true;
    Promise.all(names.map((n) => axios.get(`${BASE_URL}/public/store/${slug}/products`, { params: { category: n, limit: 1 } })
      .then((r) => [n, Number((r.data?.data || r.data)?.total ?? NaN)] as const)
      .catch(() => [n, NaN] as const)))
      .then((pairs) => { if (alive) setCounts(Object.fromEntries(pairs.filter(([, v]) => Number.isFinite(v)))); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, key, slug === 'preview' ? localList.length : 0]);
  return counts;
}

/** Tarjeta de cierre de un riel corto: completa la fila con un llamado al catálogo (sin datos inventados). */
export function RailEndCard({ t, title, label, onClick }: { t: Theme; title: string; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group flex h-full min-h-[300px] w-full flex-col justify-between rounded-[18px] p-6 text-left" style={{ background: t.sand }}>
      <Icon icon="ph:handbag-simple-thin" width={56} style={{ color: t.accentInk }} />
      <span>
        <span className="block text-[26px] font-medium leading-[1.1]" style={{ color: t.ink, fontFamily: t.display }}>{title}</span>
        <span className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: t.ink }}>
          {label}<Icon icon="ph:arrow-right" width={16} className="transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </span>
    </button>
  );
}
