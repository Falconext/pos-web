import type React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { getProductPricing } from '@/templates/shared/pricing';
import { luxCard, luxEase, luxHover, luxSection, luxTap, luxViewport } from './motion';

/**
 * Identidad visual de la plantilla "Luxury Essence" (perfumería de lujo).
 *
 * `cp` (colorPrimario del diseño) es el color PRIMARIO configurable desde el
 * editor — por defecto púrpura. `gold` e `ink` son acentos fijos que dan el
 * toque premium (fusión púrpura + oro + negro). Ambiente claro con secciones
 * oscuras dramáticas.
 */
export const LUX = {
  purple: '#6D28D9',
  gold: '#C0A15E',
  goldSoft: '#E7D9B5',
  ink: '#15111C',
  porcelain: '#FAF8FF',
  mist: '#F3EEFB',
  serif: "'Playfair Display', 'Bodoni Moda', 'Cormorant Garamond', Georgia, 'Times New Roman', serif",
} as const;

export const luxPrimary = (cp?: string) => cp || LUX.purple;
export const luxFont = (diseno?: any) => `'${diseno?.tipografia || 'Jost'}', 'Inter', ui-sans-serif, system-ui, sans-serif`;

/** Añade transparencia hex (#RRGGBB + alpha 00-ff) de forma segura. */
export function withAlpha(hex: string, alpha: string) {
  return /^#([0-9a-fA-F]{6})$/.test(hex) ? `${hex}${alpha}` : hex;
}

export function storeName(tienda: any, diseno: any) {
  return diseno?.luxuryLogoText || tienda?.nombreComercial || tienda?.razonSocial || tienda?.nombre || 'Luxury Essence';
}

/* ─────────────────────────── Imagen de producto ─────────────────────────── */

export function LuxuryProductImage({ producto, imgClassName = '' }: { producto: any; imgClassName?: string }) {
  const img = producto?.imagenUrl || producto?.imagen || '';
  if (img) {
    return <img src={img} alt={producto?.descripcion || 'Perfume'} loading="lazy" className={`h-full w-full object-cover ${imgClassName}`} />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ background: `linear-gradient(150deg, ${LUX.mist}, #fff)` }}>
      <Icon icon="mdi:bottle-tonic-plus-outline" className="text-6xl" style={{ color: LUX.purple }} />
    </div>
  );
}

/* ──────────────────────────────── Product card ──────────────────────────── */

export function LuxuryProductCard({
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
  const primary = luxPrimary(cp);
  const pricing = getProductPricing(producto);
  const marca = typeof producto?.marca === 'object' ? producto?.marca?.nombre : producto?.marca;
  const ratingAvg = Number(producto?.ratingAvg || producto?.ratingPromedio || producto?.promedioRating || 0);
  const stars = Math.max(1, Math.min(5, Math.round(ratingAvg || 5)));

  return (
    <motion.article
      variants={luxCard}
      initial="hidden"
      whileInView="show"
      viewport={luxViewport}
      whileHover={luxHover}
      layout
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white transition-shadow duration-500 hover:shadow-[0_30px_60px_-30px_rgba(21,17,28,0.45)]"
    >
      <button type="button" onClick={onClick} className="relative block aspect-[3/4] w-full overflow-hidden bg-[#F6F2FB]">
        <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-2">
          {pricing.enOferta && (
            <span className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-sm" style={{ backgroundColor: LUX.ink }}>
              -{pricing.porcentajeDescuento}%
            </span>
          )}
        </div>
        <div className="h-full w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]">
          <LuxuryProductImage producto={producto} />
        </div>
        {/* velo inferior al hover */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </button>

      <div className="flex flex-1 flex-col p-5">
        {marca && (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: LUX.gold }}>{marca}</p>
        )}
        <button type="button" onClick={onClick} className="text-left">
          <h3 className="line-clamp-2 min-h-[44px] text-[1.05rem] leading-snug text-neutral-900" style={{ fontFamily: LUX.serif }}>
            {producto?.descripcion}
          </h3>
        </button>
        <div className="mt-1.5 flex items-center gap-1 text-xs" aria-label={`${stars} de 5`}>
          <span style={{ color: LUX.gold }}>{'★'.repeat(stars)}<span className="text-neutral-300">{'★'.repeat(5 - stars)}</span></span>
        </div>

        <div className="mt-4 flex flex-1 items-end justify-between gap-3">
          <div className="flex flex-col">
            {pricing.enOferta && <span className="text-xs font-medium text-neutral-400 line-through">S/ {pricing.precioRegular.toFixed(2)}</span>}
            <span className="text-lg font-semibold tracking-tight text-neutral-900">S/ {pricing.precioFinal.toFixed(2)}</span>
          </div>
          <motion.button
            type="button"
            onClick={() => onAddToCart?.({ ...producto, precioUnitario: pricing.precioFinal, precioRegular: pricing.precioRegular, enOferta: pricing.enOferta })}
            className="flex h-11 items-center gap-2 rounded-full px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-all"
            style={{ backgroundColor: primary }}
            whileHover={{ scale: 1.04 }}
            whileTap={luxTap}
            title="Añadir al carrito"
          >
            <Icon icon="solar:bag-4-linear" width={16} /> Añadir
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

/* ─────────────────────────────────── Header ─────────────────────────────── */

export function LuxuryHeader({
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
  const primary = luxPrimary(cp);
  const name = storeName(tienda, diseno);
  const categories = allCategories.map((cat) => (typeof cat === 'string' ? cat : cat?.nombre)).filter(Boolean).slice(0, 4);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: luxEase }}
      className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-[70px] max-w-7xl items-center gap-4 px-5 md:h-[78px] md:px-8">
        {/* Logo + nombre */}
        <a href={`/tienda/${slug}`} className="flex shrink-0 items-center gap-3">
          {tienda?.logo ? (
            <img src={tienda.logo} alt={name} className="h-10 w-10 rounded-full object-cover ring-1 ring-black/10" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${LUX.ink})` }}>
              <span className="text-lg" style={{ fontFamily: LUX.serif }}>{name.charAt(0).toUpperCase()}</span>
            </span>
          )}
          <span className="hidden text-lg tracking-wide text-neutral-900 sm:block md:text-xl" style={{ fontFamily: LUX.serif }}>{name}</span>
        </a>

        {/* Nav */}
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          <a href={`/tienda/${slug}`} className="rounded-full px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-neutral-700 transition-colors hover:text-neutral-900">Inicio</a>
          <a href={`/tienda/${slug}/catalogo`} className="rounded-full px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-neutral-700 transition-colors hover:text-neutral-900">Colección</a>
          {categories.map((category) => (
            <a key={category} href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(category)}`} className="rounded-full px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-neutral-600 transition-colors hover:text-neutral-900">{category}</a>
          ))}
          <a href={`/tienda/${slug}/contacto`} className="rounded-full px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-neutral-700 transition-colors hover:text-neutral-900">Contacto</a>
        </nav>

        {/* Búsqueda */}
        <form
          onSubmit={(e) => onSearchSubmit?.(e, searchQuery)}
          className="ml-auto hidden min-w-[200px] max-w-xs flex-1 items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 transition-colors focus-within:border-black/30 md:flex"
        >
          <Icon icon="solar:magnifer-linear" width={16} className="text-neutral-400" />
          <input
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery?.(e.target.value)}
            placeholder={diseno?.luxurySearchPlaceholder || 'Buscar fragancia, marca...'}
            className="w-full border-0 bg-transparent p-0 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:ring-0"
          />
        </form>

        {/* Acciones */}
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

/* ─────────────────────────────────── Footer ─────────────────────────────── */

export function LuxuryFooter({ tienda, slug, diseno, cp, categories = [] }: { tienda: any; slug: string; diseno?: any; cp: string; categories?: any[] }) {
  const primary = luxPrimary(cp);
  const name = storeName(tienda, diseno);
  const cats = categories.map((cat) => (typeof cat === 'string' ? cat : cat?.nombre)).filter(Boolean).slice(0, 5);

  return (
    <motion.footer initial="hidden" whileInView="show" viewport={luxViewport} variants={luxSection} className="text-white" style={{ backgroundColor: LUX.ink }}>
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <h3 className="text-3xl tracking-wide" style={{ fontFamily: LUX.serif }}>{name}</h3>
          <p className="mt-5 max-w-sm text-sm leading-7 text-white/55">
            {diseno?.luxuryFooterText || tienda?.descripcionTienda || 'Fragancias de autor y perfumes nicho seleccionados. Una experiencia olfativa exclusiva, con envolvedor de regalo y envío discreto a todo el país.'}
          </p>
          <div className="mt-6 flex gap-3">
            {['mdi:instagram', 'mdi:facebook', 'ic:baseline-tiktok', 'mdi:whatsapp'].map((icon) => (
              <span key={icon} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/75 transition-colors hover:bg-white/20">
                <Icon icon={icon} width={19} />
              </span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: LUX.gold }}>Colección</h4>
          <div className="space-y-3 text-sm text-white/55">
            {cats.length ? (
              cats.map((cat) => (
                <a key={cat} href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(cat)}`} className="block transition-colors hover:text-white">{cat}</a>
              ))
            ) : (
              <a href={`/tienda/${slug}/catalogo`} className="block transition-colors hover:text-white">Ver toda la colección</a>
            )}
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: LUX.gold }}>Ayuda</h4>
          <div className="space-y-3 text-sm text-white/55">
            <a href={`/tienda/${slug}/seguimiento`} className="block transition-colors hover:text-white">Seguir mi pedido</a>
            <a href={`/tienda/${slug}/catalogo`} className="block transition-colors hover:text-white">Colección completa</a>
            <a href={`/tienda/${slug}/contacto`} className="block transition-colors hover:text-white">Contacto</a>
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: LUX.gold }}>Atención</h4>
          <p className="text-sm text-white/55">{diseno?.luxuryFooterPhone || tienda?.whatsappTienda || tienda?.telefono || '+51 999 999 999'}</p>
          <p className="mt-3 text-sm text-white/55">{diseno?.luxuryFooterEmail || tienda?.email || tienda?.correo || 'hola@luxuryessence.com'}</p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ backgroundColor: withAlpha(primary, '22'), color: '#fff' }}>
            <Icon icon="solar:shield-check-bold" width={14} /> Compra 100% segura
          </span>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-5 text-center text-xs text-white/40">© 2026 {name}. Powered by Falconext.</div>
    </motion.footer>
  );
}
