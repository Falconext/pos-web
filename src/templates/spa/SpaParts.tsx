import type React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { getProductPricing } from '@/templates/shared/pricing';
import { spaCard, spaEase, spaHover, spaSection, spaTap, spaViewport } from './motion';

/**
 * Identidad visual de la plantilla "Aura Spa" (salón de belleza & spa).
 *
 * Paleta Nude & Rosa Empolvado: crema, nude, rosa empolvado + acentos espresso
 * y champagne (oro suave). `cp` (colorPrimario del diseño) es el color PRIMARIO
 * configurable desde el editor — por defecto rosa empolvado. `espresso` y `gold`
 * son acentos fijos que aportan el toque premium y relajante.
 */
export const SPA = {
  rose: '#BE837C',
  roseDeep: '#A5655E',
  blush: '#F3DEDB',
  nude: '#E7D6C7',
  espresso: '#43302F',
  gold: '#B08D57',
  goldSoft: '#CBB08A',
  ink: '#3E2C30',
  cream: '#FBF6F1',
  mist: '#F5ECE3',
  serif: "'Playfair Display', 'Cormorant Garamond', Georgia, 'Times New Roman', serif",
} as const;

export const spaPrimary = (cp?: string) => cp || SPA.rose;
export const spaFont = (diseno?: any) => `'${diseno?.tipografia || 'Inter'}', ui-sans-serif, system-ui, sans-serif`;

/** Añade transparencia hex (#RRGGBB + alpha 00-ff) de forma segura. */
export function withAlpha(hex: string, alpha: string) {
  return /^#([0-9a-fA-F]{6})$/.test(hex) ? `${hex}${alpha}` : hex;
}

export function storeName(tienda: any, diseno: any) {
  return diseno?.spaLogoText || tienda?.nombreComercial || tienda?.razonSocial || tienda?.nombre || 'Aura Beauty Spa';
}

/** Número de WhatsApp de la tienda para reservas. */
export function waLink(tienda: any, message = 'Hola, quiero reservar una cita') {
  const raw = String(tienda?.whatsappTienda || tienda?.whatsapp || tienda?.telefono || '').replace(/[^\d]/g, '');
  const phone = raw || '51999999999';
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/* ─────────────────────────── Imagen de producto ─────────────────────────── */

export function SpaProductImage({ producto, imgClassName = '' }: { producto: any; imgClassName?: string }) {
  const img = producto?.imagenUrl || producto?.imagen || '';
  const [broken, setBroken] = useState(false);
  if (img && !broken) {
    return <img src={img} alt={producto?.descripcion || 'Producto'} loading="lazy" onError={() => setBroken(true)} className={`h-full w-full object-cover ${imgClassName}`} />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ background: `linear-gradient(150deg, ${SPA.blush}, ${SPA.nude})` }}>
      <Icon icon="mdi:spa-outline" className="text-6xl" style={{ color: SPA.rose }} />
    </div>
  );
}

/* ──────────────────────────────── Product card ──────────────────────────── */

export function SpaProductCard({
  producto,
  slug,
  cp,
  onAddToCart,
  onClick,
}: {
  producto: any;
  slug?: string;
  cp: string;
  onAddToCart?: (producto: any) => void;
  onClick?: () => void;
}) {
  const primary = spaPrimary(cp);
  const pricing = getProductPricing(producto);
  const marca = typeof producto?.marca === 'object' ? producto?.marca?.nombre : producto?.marca;
  const ratingAvg = Number(producto?.ratingAvg || producto?.ratingPromedio || producto?.promedioRating || 0);
  const stars = Math.max(1, Math.min(5, Math.round(ratingAvg || 5)));

  return (
    <motion.article
      variants={spaCard}
      initial="hidden"
      whileInView="show"
      viewport={spaViewport}
      whileHover={spaHover}
      layout
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-black/[0.05] bg-white transition-shadow duration-500 hover:shadow-[0_30px_60px_-30px_rgba(62,44,48,0.35)]"
    >
      <button type="button" onClick={onClick} className="relative block aspect-square w-full overflow-hidden" style={{ backgroundColor: SPA.mist }}>
        <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-2">
          {pricing.enOferta && (
            <span className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-sm" style={{ backgroundColor: primary }}>
              -{pricing.porcentajeDescuento}%
            </span>
          )}
        </div>
        <div className="h-full w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]">
          <SpaProductImage producto={producto} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </button>

      <div className="flex flex-1 flex-col p-5">
        {marca && (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: SPA.gold }}>{marca}</p>
        )}
        <button type="button" onClick={onClick} className="text-left">
          <h3 className="line-clamp-2 min-h-[44px] text-[1.05rem] leading-snug" style={{ fontFamily: SPA.serif, color: SPA.ink }}>
            {producto?.descripcion}
          </h3>
        </button>
        <div className="mt-1.5 flex items-center gap-1 text-xs" aria-label={`${stars} de 5`}>
          <span style={{ color: SPA.gold }}>{'★'.repeat(stars)}<span className="text-neutral-300">{'★'.repeat(5 - stars)}</span></span>
        </div>

        <div className="mt-4 flex flex-1 items-end justify-between gap-3">
          <div className="flex flex-col">
            {pricing.enOferta && <span className="text-xs font-medium text-neutral-400 line-through">S/ {pricing.precioRegular.toFixed(2)}</span>}
            <span className="text-lg font-semibold tracking-tight" style={{ color: SPA.ink }}>S/ {pricing.precioFinal.toFixed(2)}</span>
          </div>
          <motion.button
            type="button"
            onClick={() => onAddToCart?.({ ...producto, precioUnitario: pricing.precioFinal, precioRegular: pricing.precioRegular, enOferta: pricing.enOferta })}
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-white transition-all"
            style={{ backgroundColor: SPA.espresso }}
            whileHover={{ scale: 1.06, backgroundColor: primary }}
            whileTap={spaTap}
            title="Añadir al carrito"
          >
            <Icon icon="solar:bag-4-linear" width={18} />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

/* ─────────────────────────────────── Header ─────────────────────────────── */

export function SpaHeader({
  tienda,
  slug,
  cp,
  diseno,
  carritoSize,
  onOpenCart,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  allCategories = [],
}: {
  tienda: any;
  slug: string;
  cp: string;
  diseno?: any;
  carritoSize: number;
  onOpenCart: () => void;
  searchQuery?: string;
  setSearchQuery?: (value: string) => void;
  onSearchSubmit?: (e: React.FormEvent, value?: string) => void;
  allCategories?: any[];
}) {
  const primary = spaPrimary(cp);
  const name = storeName(tienda, diseno);
  const categories = allCategories.map((cat) => (typeof cat === 'string' ? cat : cat?.nombre)).filter(Boolean).slice(0, 4);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: spaEase }}
      className="sticky top-0 z-40 border-b border-black/[0.05] bg-white/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-[70px] max-w-7xl items-center gap-4 px-5 md:h-[78px] md:px-8">
        <a href={`/tienda/${slug}`} className="flex shrink-0 items-center gap-3">
          {tienda?.logo ? (
            <img src={tienda.logo} alt={name} className="h-11 w-11 rounded-full object-cover ring-1 ring-black/10" />
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ background: `radial-gradient(circle at 30% 30%, ${SPA.blush}, ${primary} 75%)` }}>
              <span className="text-lg" style={{ fontFamily: SPA.serif }}>{name.charAt(0).toUpperCase()}</span>
            </span>
          )}
          <span className="hidden text-lg tracking-wide sm:block md:text-xl" style={{ fontFamily: SPA.serif, color: SPA.ink }}>{name}</span>
        </a>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          <a href={`/tienda/${slug}`} className="rounded-full px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-neutral-700 transition-colors hover:text-neutral-900">Inicio</a>
          <a href={`/tienda/${slug}/catalogo`} className="rounded-full px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-neutral-700 transition-colors hover:text-neutral-900">Servicios</a>
          {categories.map((category) => (
            <a key={category} href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(category)}`} className="rounded-full px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-neutral-600 transition-colors hover:text-neutral-900">{category}</a>
          ))}
          <a href={`/tienda/${slug}/contacto`} className="rounded-full px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-neutral-700 transition-colors hover:text-neutral-900">Contacto</a>
        </nav>

        <form
          onSubmit={(e) => onSearchSubmit?.(e, searchQuery)}
          className="ml-auto hidden min-w-[200px] max-w-xs flex-1 items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 transition-colors focus-within:border-black/30 md:flex"
        >
          <Icon icon="solar:magnifer-linear" width={16} className="text-neutral-400" />
          <input
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery?.(e.target.value)}
            placeholder={diseno?.spaSearchPlaceholder || 'Buscar producto o servicio...'}
            className="w-full border-0 bg-transparent p-0 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:ring-0"
          />
        </form>

        <a
          href={waLink(tienda)}
          target="_blank"
          rel="noreferrer"
          className="hidden shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-transform hover:-translate-y-0.5 md:inline-flex"
          style={{ backgroundColor: SPA.espresso }}
        >
          <Icon icon="solar:calendar-linear" width={16} /> Reservar
        </a>

        <button type="button" onClick={() => (window.location.href = `/tienda/${slug}/catalogo`)} className="rounded-full p-2 text-neutral-700 hover:bg-neutral-100 md:hidden" title="Buscar">
          <Icon icon="solar:magnifer-linear" width={22} />
        </button>
        <button type="button" onClick={onOpenCart} className="relative shrink-0 rounded-full p-2 text-neutral-800 transition-colors hover:bg-neutral-100" title="Carrito">
          <Icon icon="solar:bag-4-linear" width={23} />
          {carritoSize > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: primary }}>
              {carritoSize}
            </span>
          )}
        </button>
      </div>
    </motion.header>
  );
}

/* ─────────────────────────── WhatsApp flotante ──────────────────────────── */

export function SpaWhatsAppFab({ tienda }: { tienda: any }) {
  return (
    <a
      href={waLink(tienda, 'Hola Aura Beauty Spa, quiero reservar una cita')}
      target="_blank"
      rel="noreferrer"
      className="group fixed bottom-6 right-6 z-50 flex h-14 items-center gap-0 overflow-hidden rounded-full text-white shadow-[0_14px_34px_-10px_rgba(37,211,102,0.7)]"
      style={{ backgroundColor: '#25D366' }}
      aria-label="Reservar por WhatsApp"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center">
        <Icon icon="mdi:whatsapp" width={28} />
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-[200px] group-hover:pr-6">
        ¿Reservamos tu cita?
      </span>
    </a>
  );
}

/* ─────────────────────────────────── Footer ─────────────────────────────── */

export function SpaFooter({ tienda, slug, diseno, cp, categories = [] }: { tienda: any; slug: string; diseno?: any; cp: string; categories?: any[] }) {
  const primary = spaPrimary(cp);
  const name = storeName(tienda, diseno);
  const cats = categories.map((cat) => (typeof cat === 'string' ? cat : cat?.nombre)).filter(Boolean).slice(0, 5);

  return (
    <motion.footer initial="hidden" whileInView="show" viewport={spaViewport} variants={spaSection} className="text-white" style={{ backgroundColor: '#2E2020' }}>
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <h3 className="text-3xl tracking-wide" style={{ fontFamily: SPA.serif }}>{name}</h3>
          <p className="mt-5 max-w-sm text-sm leading-7 text-white/55">
            {diseno?.spaFooterText || tienda?.descripcionTienda || 'Tu santuario de belleza y bienestar. Rituales de lujo, cuidado personalizado y resultados que enamoran.'}
          </p>
          <div className="mt-6 flex gap-3">
            {['mdi:instagram', 'mdi:facebook', 'ic:baseline-tiktok', 'mdi:whatsapp'].map((icon) => (
              <a key={icon} href={icon === 'mdi:whatsapp' ? waLink(tienda) : '#'} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/75 transition-colors hover:bg-white/20">
                <Icon icon={icon} width={19} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: SPA.goldSoft }}>Servicios</h4>
          <div className="space-y-3 text-sm text-white/55">
            {cats.length ? (
              cats.map((cat) => (
                <a key={cat} href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(cat)}`} className="block transition-colors hover:text-white">{cat}</a>
              ))
            ) : (
              <a href={`/tienda/${slug}/catalogo`} className="block transition-colors hover:text-white">Ver todos los servicios</a>
            )}
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: SPA.goldSoft }}>Aura</h4>
          <div className="space-y-3 text-sm text-white/55">
            <a href={`/tienda/${slug}/seguimiento`} className="block transition-colors hover:text-white">Seguir mi pedido</a>
            <a href={`/tienda/${slug}/catalogo`} className="block transition-colors hover:text-white">Tienda completa</a>
            <a href={`/tienda/${slug}/contacto`} className="block transition-colors hover:text-white">Contacto</a>
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: SPA.goldSoft }}>Atención</h4>
          <p className="text-sm text-white/55">{diseno?.spaFooterPhone || tienda?.whatsappTienda || tienda?.telefono || '+51 999 999 999'}</p>
          <p className="mt-3 text-sm text-white/55">{diseno?.spaFooterEmail || tienda?.email || tienda?.correo || 'hola@aurabeautyspa.pe'}</p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ backgroundColor: withAlpha(primary, '22'), color: '#fff' }}>
            <Icon icon="solar:shield-check-bold" width={14} /> Reserva 100% segura
          </span>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-5 text-center text-xs text-white/40">© 2026 {name}. Powered by Falconext.</div>
    </motion.footer>
  );
}
