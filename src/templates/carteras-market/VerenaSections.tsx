import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { VerenaProductCard, formatPhone, ed, vrMoney, type Theme } from './VerenaParts';
import { vrEase, vrItem, vrReveal, vrStagger, vrViewport } from './motion';

/**
 * Piezas compartidas por Home, Catálogo, Detalle y Contacto de Verena.
 * Todo lo que muestra sale de la tienda real; si un dato falta, devuelve null y la UI lo oculta.
 */

export type { Theme };
export type OpenFn = (p: any) => void;
export type AddFn = (p: any, qty?: number) => void;
export type Benefit = { key: string; icon: string; title: string; sub: string };

export const getName = (item: any) => (typeof item === 'string' ? item : item?.nombre || item?.name || '');
export const hasImage = (p: any) => Boolean(p?.imagenUrl);

/** Beneficios derivados de la configuración REAL de la tienda (+ textos editables). */
export function buildBenefits(tienda: any, diseno: any, hasWhatsapp: boolean): Benefit[] {
  const envio = Number(tienda?.costoEnvioFijo || 0);
  const prep = Number(tienda?.tiempoPreparacionMin || 0);
  const out: Benefit[] = [];
  out.push({ key: 'quality', icon: 'ph:diamond-light', title: ed(diseno, 'BenefitQualityTitle', 'Selección cuidada'), sub: ed(diseno, 'BenefitQualityText', 'Modelos elegidos uno a uno') });
  out.push({ key: 'secure', icon: 'ph:lock-key-light', title: ed(diseno, 'BenefitSecureTitle', 'Pago seguro'), sub: ed(diseno, 'BenefitSecureText', 'Tus datos siempre protegidos') });
  if (tienda?.aceptaEnvio !== false) out.push({ key: 'ship', icon: 'ph:truck-light', title: 'Envío a domicilio', sub: envio > 0 ? `Desde ${vrMoney(envio)}` : 'Coordinamos tu entrega' });
  if (tienda?.aceptaRecojo) out.push({ key: 'pick', icon: 'ph:storefront-light', title: 'Recojo en tienda', sub: prep > 0 ? `Listo en ${prep} min` : 'Sin costo adicional' });
  if (hasWhatsapp) out.push({ key: 'help', icon: 'ph:chat-circle-dots-light', title: 'Atención cercana', sub: 'Te asesoramos por WhatsApp' });
  return out.slice(0, 4);
}

/** Fin real más próximo de una oferta (fechaFinOferta). null = sin fecha → sin reloj. */
export function soonestOfferEnd(offers: any[]): number | null {
  const now = Date.now();
  const ends = offers
    .map((p) => (p?.fechaFinOferta ? new Date(p.fechaFinOferta).getTime() : NaN))
    .filter((n) => Number.isFinite(n) && n > now);
  return ends.length ? Math.min(...ends) : null;
}

/** Canales de contacto REALES. El payload público no trae teléfono ni correo: solo WhatsApp, dirección, horario y redes. */
export function storeChannels(tienda: any, diseno?: any) {
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const wa = (msg = '') => buildStorePurchaseWhatsappUrl(waNumber, msg);
  const hasWhatsapp = Boolean(wa());
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
    address: address || null,
    pickupAddress: pickup || null,
    mapsUrl: address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null,
    mapsEmbed: address ? `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed` : null,
    horario: String(tienda?.horarioAtencion || '').trim() || null,
    socials,
  };
}
export type Channels = ReturnType<typeof storeChannels>;

// ────────────────────────────────────────────────────────────────── UI ──
/** Título centrado con líneas a los lados (como "Compra por categoría" de la referencia). */
export function CenteredTitle({ t, title, icon = 'ph:leaf-light' }: { t: Theme; title: string; icon?: string }) {
  return (
    <motion.div variants={vrReveal} initial="hidden" whileInView="show" viewport={vrViewport} className="mb-9 flex items-center justify-center gap-3 sm:gap-4">
      <span aria-hidden className="hidden h-px w-16 sm:block" style={{ background: t.ink, opacity: 0.55 }} />
      <h2 className="text-center text-[24px] font-bold tracking-[-0.02em] sm:text-[30px]" style={{ color: t.ink }}>{title}</h2>
      <Icon aria-hidden icon={icon} width={24} className="shrink-0" style={{ color: t.primary }} />
      <span aria-hidden className="hidden h-px w-16 sm:block" style={{ background: t.ink, opacity: 0.55 }} />
    </motion.div>
  );
}

/** Título a la izquierda con enlace a la derecha (como "Productos destacados" de la referencia). */
export function SectionHeader({ t, eyebrow, title, onMore, moreLabel = 'Ver todo', right }: { t: Theme; eyebrow?: string; title: string; onMore?: () => void; moreLabel?: string; right?: ReactNode }) {
  return (
    <motion.div variants={vrReveal} initial="hidden" whileInView="show" viewport={vrViewport} className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: t.accent }}>{eyebrow}</p>}
        <h2 className="mt-1 text-[26px] font-bold tracking-[-0.02em] sm:text-[30px]" style={{ color: t.ink }}>{title}</h2>
      </div>
      {right ?? (onMore && (
        <button type="button" onClick={onMore} className="group inline-flex shrink-0 items-center gap-1.5 text-[14.5px] font-semibold" style={{ color: t.primary }}>
          {moreLabel}
          <Icon icon="solar:arrow-right-linear" width={18} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      ))}
    </motion.div>
  );
}

export function ProductGrid({ t, products, slug, diseno, onOpen, onAdd, cols = 'lg:grid-cols-5' }: { t: Theme; products: any[]; slug: string; diseno?: any; onOpen: OpenFn; onAdd: AddFn; cols?: string }) {
  return (
    <motion.div variants={vrStagger} initial="hidden" whileInView="show" viewport={vrViewport} className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 ${cols}`}>
      {products.map((p, i) => (
        <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={vrItem} className="h-full">
          <VerenaProductCard producto={p} slug={slug} t={t} diseno={diseno} onOpen={() => onOpen(p)} onAdd={(q) => onAdd(p, q)} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export function GridSkeleton({ t, count = 5, cols = 'lg:grid-cols-5' }: { t: Theme; count?: number; cols?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border bg-white p-3" style={{ borderColor: t.line }}>
          <div className="aspect-square animate-pulse rounded-xl" style={{ background: t.tile }} />
          <div className="mt-4 h-3.5 w-4/5 animate-pulse rounded" style={{ background: t.tile }} />
          <div className="mt-2 h-3.5 w-2/5 animate-pulse rounded" style={{ background: t.tile }} />
          <div className="mt-5 h-10 animate-pulse rounded-lg" style={{ background: t.tile }} />
        </div>
      ))}
    </div>
  );
}

/** Riel horizontal con flechas. El scroll no re-renderiza (solo usa el ref). */
export function ProductRail({ t, title, eyebrow, products, slug, diseno, onOpen, onAdd, id }: { t: Theme; title: string; eyebrow?: string; products: any[]; slug: string; diseno?: any; onOpen: OpenFn; onAdd: AddFn; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  if (!products.length) return null;
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  const arrow = (dir: number, icon: string, label: string) => (
    <motion.button type="button" aria-label={label} whileTap={{ scale: 0.92 }} onClick={() => scroll(dir)} className="flex h-11 w-11 items-center justify-center rounded-full border bg-white transition-colors hover:bg-black/[0.03]" style={{ borderColor: t.line, color: t.ink }}>
      <Icon icon={icon} width={20} />
    </motion.button>
  );
  return (
    <section id={id} className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 lg:px-6">
      <SectionHeader t={t} eyebrow={eyebrow} title={title} right={<div className="flex gap-2">{arrow(-1, 'solar:alt-arrow-left-linear', 'Anterior')}{arrow(1, 'solar:alt-arrow-right-linear', 'Siguiente')}</div>} />
      <motion.div ref={ref} variants={vrStagger} initial="hidden" whileInView="show" viewport={vrViewport} className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((p, i) => (
          <motion.div key={`${p.id ?? p.descripcion}-${i}`} variants={vrItem} className="w-[210px] shrink-0 snap-start sm:w-[230px]">
            <VerenaProductCard producto={p} slug={slug} t={t} diseno={diseno} onOpen={() => onOpen(p)} onAdd={(q) => onAdd(p, q)} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/**
 * Reloj hasta el fin REAL de una oferta. Aislado a nivel de módulo: su tick de 1s
 * solo re-renderiza este componente (las tarjetas no parpadean).
 */
export function OfferCountdown({ t, endsAt, size = 'lg', onDark = false }: { t: Theme; endsAt: number; size?: 'lg' | 'sm'; onDark?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const s = Math.max(0, Math.floor((endsAt - now) / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  const days = Math.floor(s / 86400);
  const units: [string, string][] = days > 0
    ? [['días', pad(days)], ['hrs', pad(Math.floor((s % 86400) / 3600))], ['min', pad(Math.floor((s % 3600) / 60))]]
    : [['hrs', pad(Math.floor(s / 3600))], ['min', pad(Math.floor((s % 3600) / 60))], ['seg', pad(s % 60)]];
  const big = size === 'lg';
  const boxBg = onDark ? 'rgba(255,255,255,0.12)' : t.primary;
  const boxFg = onDark ? '#fff' : t.onPrimary;
  return (
    <div className="flex items-start gap-2" aria-label="Tiempo restante de la oferta">
      {units.map(([label, value], i) => (
        <div key={label} className="flex items-start gap-2">
          <div className="flex flex-col items-center">
            <div className={`relative flex items-center justify-center overflow-hidden font-bold tabular-nums ${big ? 'h-14 w-14 rounded-xl text-[22px]' : 'h-10 w-10 rounded-lg text-[15px]'}`} style={{ background: boxBg, color: boxFg }}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={value} initial={{ y: -22, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 22, opacity: 0 }} transition={{ duration: 0.4, ease: vrEase }}>{value}</motion.span>
              </AnimatePresence>
            </div>
            <span className={`mt-1 font-semibold uppercase tracking-[0.12em] ${big ? 'text-[10px]' : 'text-[9px]'}`} style={{ color: onDark ? 'rgba(255,255,255,0.7)' : t.muted }}>{label}</span>
          </div>
          {i < units.length - 1 && <span className={`font-bold ${big ? 'mt-3.5 text-xl' : 'mt-2 text-base'}`} style={{ color: onDark ? '#fff' : t.primary }}>:</span>}
        </div>
      ))}
    </div>
  );
}

/** Cabecera de página (catálogo / contacto): tarjeta crema con breadcrumb, título y slot libre. */
export function PageHero({ t, crumbs, eyebrow, title, subtitle, image, mosaic = [], children }: { t: Theme; crumbs: { label: string; onClick?: () => void }[]; eyebrow?: string; title: string; subtitle?: ReactNode; image?: string | null; mosaic?: string[]; children?: ReactNode }) {
  const [broken, setBroken] = useState(false);
  const tiles = mosaic.filter(Boolean).slice(0, 3);
  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 lg:px-6">
      <div className="relative grid overflow-hidden rounded-[28px] lg:grid-cols-[1.25fr_1fr]" style={{ background: t.cream }}>
        <div className="relative px-7 py-10 sm:px-12 sm:py-14">
          <motion.nav initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: vrEase }} aria-label="Ruta" className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium" style={{ color: t.muted }}>
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
                {i > 0 && <Icon icon="solar:alt-arrow-right-linear" width={13} />}
                {c.onClick ? <button type="button" onClick={c.onClick} className="transition-colors hover:text-[#17191B]">{c.label}</button> : <span style={{ color: t.ink }}>{c.label}</span>}
              </span>
            ))}
          </motion.nav>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.05, ease: vrEase }}>
            {eyebrow && <span className="mt-6 inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ background: t.primary, color: t.onPrimary }}>{eyebrow}</span>}
            <h1 className="mt-4 text-[38px] font-bold leading-[1.04] tracking-[-0.02em] sm:text-[50px]" style={{ color: t.ink, fontFamily: t.serif }}>{title}</h1>
            {subtitle && <div className="mt-3 max-w-xl text-[16px] leading-relaxed" style={{ color: t.muted }}>{subtitle}</div>}
          </motion.div>
          {children}
        </div>
        {image && !broken ? (
          <div className="relative hidden min-h-[280px] lg:block">
            <img src={image} alt="" onError={() => setBroken(true)} className="absolute inset-0 h-full w-full object-cover" />
            <div aria-hidden className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${t.cream} 0%, transparent 38%)` }} />
          </div>
        ) : tiles.length >= 2 ? (
          // Sin foto configurada: mosaico con fotos REALES de los productos de la tienda.
          <div className="relative hidden items-center justify-center lg:flex" aria-hidden>
            {tiles.map((src, i) => (
              <motion.div key={src} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 + i * 0.1, ease: vrEase }} className="absolute flex h-44 w-44 items-center justify-center rounded-3xl bg-white shadow-[0_26px_50px_-30px_rgba(23,25,27,0.45)]" style={{ left: `${12 + i * 22}%`, top: i === 1 ? '14%' : '34%', zIndex: i === 1 ? 2 : 1, rotate: i === 0 ? -6 : i === 2 ? 6 : 0 }}>
                <img src={src} alt="" className="h-full w-full object-contain p-5 mix-blend-multiply" />
              </motion.div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
