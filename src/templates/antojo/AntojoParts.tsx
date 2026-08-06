import type React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { getProductPricing } from '@/templates/shared/pricing';
import { antojoCard, antojoEase, antojoHover, antojoSection, antojoTap, antojoViewport } from './motion';

/**
 * Paleta de identidad de la plantilla "Antojo" (pizzería + frappes + cremoladas).
 * `cp` (colorPrimario del diseño) manda en los CTAs; estos son los tonos de marca
 * por defecto para secciones decorativas y estados fríos/calientes.
 */
export const ANTOJO = {
  tomato: '#E23744',
  orange: '#FF7A00',
  mint: '#35C4A0',
  cream: '#FFF6EC',
  ink: '#2A1712',
} as const;

/** Patrón de puntos suave para fondos cálidos (tipo mantel de pizzería). */
export const antojoDots = {
  backgroundImage: 'radial-gradient(rgba(0,0,0,0.06) 1.4px, transparent 1.4px)',
  backgroundSize: '18px 18px',
};

const COLD_RX = /frapp|cremolad|helad|granizad|shake|smoothie|jugo|refresc|limonad|frio|frío|malteada|milkshake/i;
const HOT_RX = /pizza|calzone|horno|caliente|pan|lasa|calzon|empanad|parrilla/i;

/** Clasifica un producto como frío / caliente / neutro para su badge. */
export function antojoTemp(producto: any): 'cold' | 'hot' | null {
  const hay = [
    producto?.descripcion,
    producto?.nombre,
    typeof producto?.categoria === 'object' ? producto?.categoria?.nombre : producto?.categoria,
  ]
    .filter(Boolean)
    .join(' ');
  if (COLD_RX.test(hay)) return 'cold';
  if (HOT_RX.test(hay)) return 'hot';
  return null;
}

export function antojoAction(action: any, slug: string, navigate: (to: string) => void, fallback = `/tienda/${slug}/catalogo`) {
  if (!action || typeof action !== 'object') {
    navigate(fallback);
    return;
  }
  if (action.type === 'url' && action.url) {
    window.open(action.url, '_blank');
    return;
  }
  if (action.type === 'product' && action.productId) {
    navigate(`/tienda/${slug}/producto/${action.productId}`);
    return;
  }
  if (action.type === 'category' && action.categoryName) {
    navigate(`/tienda/${slug}/catalogo?category=${encodeURIComponent(action.categoryName)}`);
    return;
  }
  if (action.type === 'search' && action.search) {
    navigate(`/tienda/${slug}/catalogo?search=${encodeURIComponent(action.search)}`);
    return;
  }
  if (action.type === 'none') return;
  navigate(fallback);
}

function storeName(tienda: any, diseno: any) {
  return diseno?.antojoLogoText || tienda?.nombreComercial || tienda?.razonSocial || tienda?.nombre || 'Antojería';
}

/** Imagen del producto o, si no hay, un placeholder cálido con icono. */
export function AntojoProductImage({
  producto,
  className = '',
  imgClassName = '',
}: {
  producto: any;
  className?: string;
  imgClassName?: string;
}) {
  const img = producto?.imagenUrl || producto?.imagen || '';
  const temp = antojoTemp(producto);
  const icon = temp === 'cold' ? 'solar:cup-hot-bold' : temp === 'hot' ? 'solar:pizza-bold' : 'solar:donut-bitten-bold';
  if (img) {
    return (
      <img
        src={img}
        alt={producto?.descripcion || 'Producto'}
        className={`h-full w-full object-cover ${imgClassName}`}
      />
    );
  }
  return (
    <div
      className={`flex h-full w-full items-center justify-center ${className}`}
      style={{ background: `linear-gradient(135deg, ${ANTOJO.orange}22, ${ANTOJO.tomato}22)` }}
    >
      <Icon icon={icon} className="text-6xl" style={{ color: ANTOJO.tomato }} />
    </div>
  );
}

export function AntojoTempBadge({ producto }: { producto: any }) {
  const temp = antojoTemp(producto);
  if (!temp) return null;
  const cold = temp === 'cold';
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white shadow-sm"
      style={{ backgroundColor: cold ? ANTOJO.mint : ANTOJO.orange }}
    >
      <Icon icon={cold ? 'solar:snowflake-bold' : 'solar:fire-bold'} width={13} />
      {cold ? 'Helado' : 'Caliente'}
    </span>
  );
}

export function AntojoHeader({
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
  overlay = false,
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
  overlay?: boolean;
}) {
  const name = storeName(tienda, diseno);
  const categories = allCategories.map((cat) => (typeof cat === 'string' ? cat : cat?.nombre)).filter(Boolean).slice(0, 4);

  return (
    <motion.header
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: antojoEase }}
      className={overlay ? 'relative z-30 bg-transparent' : 'sticky top-0 z-40'}
    >
      <div className="mx-auto max-w-7xl px-4 pb-4 pt-5 md:pt-6">
        <motion.nav
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.08, ease: antojoEase }}
          className="flex min-h-[64px] items-center gap-1 rounded-full bg-white/95 py-2 pl-2 pr-2 shadow-xl shadow-black/10 ring-1 ring-black/5 backdrop-blur md:min-h-[72px] md:gap-2 md:pr-6"
        >
          <button
            type="button"
            onClick={() => (window.location.href = `/tienda/${slug}`)}
            title={name}
            className="group relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-white shadow-md transition-transform hover:scale-105 md:h-[54px] md:w-[54px]"
            style={{ background: `linear-gradient(135deg, ${ANTOJO.orange}, ${cp || ANTOJO.tomato})` }}
          >
            {tienda?.logo ? (
              <img src={tienda.logo} alt={name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-black md:text-2xl">{name.charAt(0).toUpperCase()}</span>
            )}
          </button>
          <a href={`/tienda/${slug}`} className="rounded-full px-3 py-2.5 text-xs font-black text-white md:px-5 md:py-3 md:text-sm" style={{ backgroundColor: cp || ANTOJO.tomato }}>
            Inicio
          </a>
          <a href={`/tienda/${slug}/catalogo`} className="rounded-full px-3 py-2.5 text-xs font-black text-neutral-800 hover:bg-orange-50 md:px-4 md:py-3 md:text-sm">
            Carta
          </a>
          <a href={`/tienda/${slug}/contacto`} className="hidden rounded-full px-3 py-2.5 text-xs font-black text-neutral-800 hover:bg-orange-50 sm:block md:px-4 md:py-3 md:text-sm">
            Contacto
          </a>
          <div className="hidden items-center gap-1 lg:flex">
            {categories.map((category) => (
              <a key={category} href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(category)}`} className="rounded-full px-4 py-3 text-sm font-black text-neutral-800 hover:bg-orange-50">
                {category}
              </a>
            ))}
          </div>
          <form
            onSubmit={(e) => onSearchSubmit?.(e, searchQuery)}
            className="ml-auto hidden min-w-[220px] max-w-sm flex-1 items-center gap-2 rounded-full bg-neutral-100 py-1.5 pl-5 pr-1.5 transition-all focus-within:bg-white focus-within:ring-2 md:flex"
            style={{ ['--tw-ring-color' as any]: `${cp || ANTOJO.tomato}55` }}
          >
            <input
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery?.(e.target.value)}
              placeholder={diseno?.antojoSearchPlaceholder || 'Buscar pizza, frappe, cremolada...'}
              className="w-full appearance-none border-0 bg-transparent p-0 text-sm font-semibold text-neutral-800 shadow-none outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 placeholder:text-neutral-400"
            />
            <button
              type="submit"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: cp || ANTOJO.tomato }}
              title="Buscar"
            >
              <Icon icon="solar:magnifer-linear" width={17} />
            </button>
          </form>
          <button
            type="button"
            onClick={() => (window.location.href = `/tienda/${slug}/catalogo`)}
            className="ml-auto rounded-full p-2 text-neutral-800 hover:bg-orange-50 md:hidden"
            title="Buscar"
          >
            <Icon icon="solar:magnifer-linear" width={22} />
          </button>
          <button type="button" onClick={onOpenCart} className="relative shrink-0 rounded-full p-2 text-neutral-800 hover:bg-orange-50 md:p-3" title="Carrito">
            <Icon icon="solar:bag-4-bold" width={24} />
            {carritoSize > 0 && (
              <span
                className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white"
                style={{ backgroundColor: cp || ANTOJO.tomato }}
              >
                {carritoSize}
              </span>
            )}
          </button>
        </motion.nav>
      </div>
    </motion.header>
  );
}

export function AntojoFooter({ tienda, slug, diseno, cp, categories = [] }: { tienda: any; slug: string; diseno?: any; cp: string; categories?: any[] }) {
  const name = storeName(tienda, diseno);
  const cats = categories.map((cat) => (typeof cat === 'string' ? cat : cat?.nombre)).filter(Boolean).slice(0, 5);
  return (
    <motion.footer initial="hidden" whileInView="show" viewport={antojoViewport} variants={antojoSection} className="mt-4 text-white" style={{ backgroundColor: ANTOJO.ink }}>
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <h3 className="text-3xl font-black">
            <span style={{ color: ANTOJO.orange }}>{name.charAt(0)}</span>
            {name.slice(1)}
          </h3>
          <p className="mt-5 max-w-sm text-sm font-semibold leading-7 text-white/60">
            {diseno?.antojoFooterText || tienda?.descripcionTienda || 'Pizzas al horno, frappes cremosos y cremoladas heladas. Antojos recién hechos, listos para tu delivery o recojo.'}
          </p>
          <div className="mt-6 flex gap-3">
            {['mdi:instagram', 'mdi:facebook', 'ic:baseline-tiktok', 'mdi:whatsapp'].map((icon) => (
              <span key={icon} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20">
                <Icon icon={icon} width={20} />
              </span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-black uppercase tracking-[0.16em]" style={{ color: ANTOJO.orange }}>Carta</h4>
          <div className="space-y-3 text-sm font-semibold text-white/60">
            {cats.length ? (
              cats.map((cat) => (
                <a key={cat} href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(cat)}`} className="block hover:text-white">
                  {cat}
                </a>
              ))
            ) : (
              <a href={`/tienda/${slug}/catalogo`} className="block hover:text-white">Ver toda la carta</a>
            )}
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-black uppercase tracking-[0.16em]" style={{ color: ANTOJO.orange }}>Ayuda</h4>
          <div className="space-y-3 text-sm font-semibold text-white/60">
            <a href={`/tienda/${slug}/seguimiento`} className="block hover:text-white">Seguir mi pedido</a>
            <a href={`/tienda/${slug}/catalogo`} className="block hover:text-white">Carta completa</a>
            <a href={`/tienda/${slug}/contacto`} className="block hover:text-white">Contacto</a>
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-black uppercase tracking-[0.16em]" style={{ color: ANTOJO.orange }}>Pedidos</h4>
          <p className="text-sm font-semibold text-white/60">{diseno?.antojoFooterPhone || tienda?.whatsappTienda || tienda?.telefono || '+51 999 999 999'}</p>
          <p className="mt-3 text-sm font-semibold text-white/60">{diseno?.antojoFooterEmail || tienda?.email || tienda?.correo || 'hola@antojeria.com'}</p>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-5 text-center text-xs font-semibold text-white/40">© 2026 {name}. Powered by Falconext.</div>
    </motion.footer>
  );
}

export function AntojoProductCard({ producto, slug, cp, onAddToCart, onClick }: { producto: any; slug: string; cp: string; onAddToCart?: (producto: any) => void; onClick?: () => void }) {
  const pricing = getProductPricing(producto);
  const ratingAvg = Number(producto?.ratingAvg || producto?.ratingPromedio || producto?.promedioRating || 0);
  const stars = Math.max(1, Math.min(5, Math.round(ratingAvg || 5)));
  return (
    <motion.article
      variants={antojoCard}
      initial="hidden"
      whileInView="show"
      viewport={antojoViewport}
      whileHover={antojoHover}
      whileTap={antojoTap}
      layout
      className="group flex flex-col overflow-hidden rounded-[26px] bg-white shadow-md shadow-black/5 ring-1 ring-black/5 transition-shadow hover:shadow-2xl hover:shadow-black/10"
    >
      <button type="button" onClick={onClick} className="relative block aspect-[4/3] w-full overflow-hidden">
        <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-2">
          <AntojoTempBadge producto={producto} />
          {pricing.enOferta && (
            <span className="rounded-full px-3 py-1 text-[11px] font-black text-white shadow-sm" style={{ backgroundColor: ANTOJO.tomato }}>
              -{pricing.porcentajeDescuento}%
            </span>
          )}
        </div>
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.06]">
          <AntojoProductImage producto={producto} />
        </div>
      </button>
      <div className="flex flex-1 flex-col p-4">
        <button type="button" onClick={onClick} className="text-left">
          <h3 className="line-clamp-2 min-h-[44px] text-base font-black leading-snug text-neutral-900">{producto?.descripcion}</h3>
        </button>
        <div className="mt-1.5 flex items-center gap-1 text-sm">
          <span className="tracking-tight" style={{ color: ANTOJO.orange }}>{'★'.repeat(stars)}<span className="text-neutral-300">{'★'.repeat(5 - stars)}</span></span>
        </div>
        <div className="mt-3 flex flex-1 items-end justify-between gap-2">
          <div className="flex flex-col">
            {pricing.enOferta && <span className="text-xs font-bold text-neutral-400 line-through">S/ {pricing.precioRegular.toFixed(2)}</span>}
            <span className="text-xl font-black text-neutral-900">S/ {pricing.precioFinal.toFixed(2)}</span>
          </div>
          <motion.button
            type="button"
            onClick={() => onAddToCart?.({ ...producto, precioUnitario: pricing.precioFinal, precioRegular: pricing.precioRegular, enOferta: pricing.enOferta })}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-lg transition-transform"
            style={{ backgroundColor: cp || ANTOJO.tomato }}
            whileHover={{ scale: 1.1, rotate: 6 }}
            whileTap={antojoTap}
            title="Agregar al carrito"
          >
            <Icon icon="solar:add-circle-bold" width={24} />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
