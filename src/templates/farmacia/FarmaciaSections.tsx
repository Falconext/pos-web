import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { FarmaciaProductCard, farmaciaTheme, formatPhone } from './FarmaciaParts';
import { fmEase, fmItem, fmReveal, fmStagger, fmViewport, mix } from './motion';

/**
 * Piezas compartidas por Home, Catálogo, Detalle y Contacto de la plantilla Farmacia.
 * Regla de la plantilla: nunca mostrar datos inventados (teléfonos, descuentos, urgencias).
 */

export type Theme = ReturnType<typeof farmaciaTheme>;
export type OpenFn = (p: any) => void;
export type AddFn = (p: any, qty?: number) => void;
export type Service = { icon: string; label: string; sub: string; bg: string; fg: string };

export const getName = (item: any) => (typeof item === 'string' ? item : item?.nombre || item?.name || '');
export const hasImage = (p: any) => Boolean(p?.imagenUrl);

/** Servicios derivados de la configuración real de la tienda. */
export function buildServices(tienda: any): Service[] {
  const s: Service[] = [];
  if (tienda?.aceptaEnvio !== false) s.push({ icon: 'solar:delivery-bold', label: 'Delivery', sub: 'Entrega a domicilio', bg: '#E6F6EF', fg: '#0C6B58' });
  if (tienda?.aceptaRecojo) {
    const min = Number(tienda?.tiempoPreparacionMin || 0);
    s.push({ icon: 'solar:shop-2-bold', label: 'Recojo en tienda', sub: min > 0 ? `Listo en ${min} min` : 'Rápido y sin costo', bg: '#EAF0FB', fg: '#3B5BA9' });
  }
  s.push({ icon: 'solar:user-heart-bold', label: 'Asesoría', sub: 'Químico farmacéutico', bg: '#FDEAF1', fg: '#B83280' });
  s.push({ icon: 'solar:shield-check-bold', label: 'Originales', sub: 'Con registro sanitario', bg: '#E9F7F4', fg: '#0E8E7E' });
  s.push({ icon: 'solar:card-2-bold', label: 'Pago seguro', sub: 'Compra protegida', bg: '#FBF0E6', fg: '#C2751A' });
  return s.slice(0, 5);
}

/** Fin real más próximo de una oferta (fechaFinOferta). null = sin fecha → sin reloj. */
export function soonestOfferEnd(offers: any[]): number | null {
  const now = Date.now();
  const ends = offers
    .map((p) => (p?.fechaFinOferta ? new Date(p.fechaFinOferta).getTime() : NaN))
    .filter((n) => Number.isFinite(n) && n > now);
  return ends.length ? Math.min(...ends) : null;
}

/** Canales de contacto REALES de la tienda. Cualquier campo vacío queda en null (y la UI lo oculta). */
export function storeChannels(tienda: any, diseno?: any) {
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const wa = (msg = '') => buildStorePurchaseWhatsappUrl(waNumber, msg);
  const hasWhatsapp = Boolean(wa());
  const phoneRaw = String(tienda?.telefono || '').trim();
  const address = [tienda?.direccion, tienda?.distrito, tienda?.provincia].filter(Boolean).join(', ');
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

// ───────────────────────────────────────────────────────────── UI ──
export function SectionHeader({ t, eyebrow, title, onMore, moreLabel = 'Ver todo', right }: { t: Theme; eyebrow?: string; title: string; onMore?: () => void; moreLabel?: string; right?: ReactNode }) {
  return (
    <motion.div variants={fmReveal} initial="hidden" whileInView="show" viewport={fmViewport} className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-[12px] font-black uppercase tracking-[0.18em]" style={{ color: t.accent }}>{eyebrow}</p>}
        <h2 className="mt-2 text-[28px] font-black leading-[1.1] tracking-[-0.02em] sm:text-[34px]" style={{ color: t.ink }}>{title}</h2>
      </div>
      {right ?? (onMore && (
        <button type="button" onClick={onMore} className="group hidden shrink-0 items-center gap-1.5 text-[14px] font-bold sm:inline-flex" style={{ color: t.primary }}>
          {moreLabel}
          <Icon icon="solar:arrow-right-linear" width={18} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      ))}
    </motion.div>
  );
}

export function ProductGrid({ t, products, slug, onOpen, onAdd, cols = 'lg:grid-cols-5' }: { t: Theme; products: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn; cols?: string }) {
  return (
    <motion.div variants={fmStagger} initial="hidden" whileInView="show" viewport={fmViewport} className={`grid grid-cols-2 gap-4 sm:grid-cols-3 ${cols}`}>
      {products.map((p, i) => (
        <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={fmItem} className="h-full">
          <FarmaciaProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export function GridSkeleton({ t, count = 5, cols = 'lg:grid-cols-5' }: { t: Theme; count?: number; cols?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-4 sm:grid-cols-3 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => <div key={i} className="h-[380px] animate-pulse rounded-2xl" style={{ background: t.soft }} />)}
    </div>
  );
}

export function ProductRail({ t, title, eyebrow = 'Para ti', products, slug, onOpen, onAdd }: { t: Theme; title: string; eyebrow?: string; products: any[]; slug: string; onOpen: OpenFn; onAdd: AddFn }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  if (!products.length) return null;
  const arrow = (dir: number, icon: string, label: string) => (
    <motion.button type="button" aria-label={label} whileTap={{ scale: 0.92 }} onClick={() => scroll(dir)} className="flex h-11 w-11 items-center justify-center rounded-full border bg-white transition-colors hover:bg-black/[0.03]" style={{ borderColor: t.line, color: t.ink }}>
      <Icon icon={icon} width={20} />
    </motion.button>
  );
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 lg:px-6">
      <SectionHeader t={t} eyebrow={eyebrow} title={title} right={<div className="flex gap-2">{arrow(-1, 'solar:alt-arrow-left-linear', 'Anterior')}{arrow(1, 'solar:alt-arrow-right-linear', 'Siguiente')}</div>} />
      <motion.div ref={ref} variants={fmStagger} initial="hidden" whileInView="show" viewport={fmViewport} className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((p, i) => (
          <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={fmItem} className="w-[220px] shrink-0 snap-start sm:w-[240px]">
            <FarmaciaProductCard producto={p} slug={slug} t={t} onOpen={() => onOpen(p)} onAdd={(q: number) => onAdd(p, q)} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/**
 * Reloj hasta el fin REAL de una oferta. Aislado: su tick de 1s solo re-renderiza este componente.
 * size="lg" para bandas de ofertas, "sm" para la ficha de producto.
 */
export function OfferCountdown({ t, endsAt, size = 'lg' }: { t: Theme; endsAt: number; size?: 'lg' | 'sm' }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const s = Math.max(0, Math.floor((endsAt - now) / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  const days = Math.floor(s / 86400);
  const units: [string, string][] = days > 0
    ? [['días', pad(days)], ['hrs', pad(Math.floor((s % 86400) / 3600))], ['min', pad(Math.floor((s % 3600) / 60))]]
    : [['hrs', pad(Math.floor(s / 3600))], ['min', pad(Math.floor((s % 3600) / 60))], ['seg', pad(s % 60)]];
  const big = size === 'lg';
  return (
    <div className="flex items-start gap-2" aria-label="Tiempo restante de la oferta">
      {units.map(([label, value], i) => (
        <div key={label} className="flex items-start gap-2">
          <div className="flex flex-col items-center">
            <div className={`relative flex items-center justify-center overflow-hidden font-black tabular-nums ${big ? 'h-16 w-16 rounded-2xl text-[26px]' : 'h-11 w-11 rounded-xl text-[17px]'}`} style={{ background: t.primary, color: t.onPrimary, boxShadow: `0 16px 30px -18px ${mix(t.primary, 90, 'transparent')}` }}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={value} initial={{ y: -26, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 26, opacity: 0 }} transition={{ duration: 0.4, ease: fmEase }}>{value}</motion.span>
              </AnimatePresence>
            </div>
            <span className={`mt-1.5 font-black uppercase tracking-[0.16em] text-gray-400 ${big ? 'text-[10px]' : 'text-[9px]'}`}>{label}</span>
          </div>
          {i < units.length - 1 && <span className={`font-black ${big ? 'mt-4 text-2xl' : 'mt-2 text-lg'}`} style={{ color: t.primary }}>:</span>}
        </div>
      ))}
    </div>
  );
}

/** Banda superior de página (catálogo / contacto): breadcrumb + título + slot libre. */
export function PageHero({ t, crumbs, eyebrow, title, subtitle, children }: { t: Theme; crumbs: { label: string; onClick?: () => void }[]; eyebrow?: string; title: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b" style={{ borderColor: t.line, background: `linear-gradient(135deg, ${mix(t.primary, 9)} 0%, ${mix(t.accent, 5)} 100%)` }}>
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full blur-3xl" style={{ background: mix(t.primary, 22, 'transparent') }} />
      <div className="relative mx-auto max-w-7xl px-4 py-10 lg:px-6 lg:py-14">
        <motion.nav initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: fmEase }} aria-label="Ruta" className="flex flex-wrap items-center gap-1.5 text-[12.5px] font-semibold text-gray-500">
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
              {i > 0 && <Icon icon="solar:alt-arrow-right-linear" width={13} className="text-gray-400" />}
              {c.onClick ? <button type="button" onClick={c.onClick} className="transition-colors hover:text-gray-800">{c.label}</button> : <span style={{ color: t.ink }}>{c.label}</span>}
            </span>
          ))}
        </motion.nav>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05, ease: fmEase }}>
          {eyebrow && <p className="mt-5 text-[12px] font-black uppercase tracking-[0.2em]" style={{ color: t.accent }}>{eyebrow}</p>}
          <h1 className="mt-2 text-[36px] font-black leading-[1.05] tracking-[-0.03em] sm:text-[46px]" style={{ color: t.ink }}>{title}</h1>
          {subtitle && <div className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-gray-500">{subtitle}</div>}
        </motion.div>
        {children}
      </div>
    </section>
  );
}
