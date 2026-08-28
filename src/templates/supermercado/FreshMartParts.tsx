import type React from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { getProductPricing } from '@/templates/shared/pricing';
import { useFavoritosStore } from '@/zustand/favoritos';
import { fmCard, fmEase, fmHover, fmSection, fmTap, fmViewport } from './motion';

/**
 * Identidad visual de la plantilla "FreshMart" (supermercado, abarrotes, minimarket).
 *
 * Estética grocery verde & blanca luminosa: verde hoja como marca/CTA, verde oscuro en
 * banners/footer, naranja/rojo para descuentos. Barra utilitaria superior, buscador con
 * selector de categorías, tarjetas tipo "Deal of the Day" con "Agregar al carrito".
 * Tipografía Poppins (títulos) + Inter (cuerpo). `cp` (colorPrimario) es el acento
 * configurable (por defecto verde FreshMart).
 */
export const FM = {
  green: '#4CA82F',
  greenDark: '#2E5A1C',
  greenSoft: '#EAF5E6',
  greenSoft2: '#F1F8EE',
  ink: '#1F2A1A',
  inkSoft: '#6B7280',
  orange: '#F5842A',
  amber: '#F5A623',
  red: '#E23B2E',
  cream: '#FFFFFF',
  soft: '#F5F7F4',
  line: '#E7EBE4',
  display: "'Poppins', 'Inter', ui-sans-serif, system-ui, sans-serif",
} as const;

export const fmPrimary = (cp?: string) => cp || FM.green;
export const fmFont = (diseno?: any) => `'${diseno?.tipografia || 'Inter'}', ui-sans-serif, system-ui, sans-serif`;

export function withAlpha(hex: string, alpha: string) {
  return /^#([0-9a-fA-F]{6})$/.test(hex) ? `${hex}${alpha}` : hex;
}

export function storeName(tienda: any, diseno: any) {
  return diseno?.supermercadoLogoText || tienda?.nombreComercial || tienda?.razonSocial || tienda?.nombre || 'FreshMart';
}

export function storeTagline(tienda: any, diseno: any) {
  return diseno?.supermercadoLogoTagline || tienda?.slogan || 'Fresco. Calidad. Cada día.';
}

export function waLink(tienda: any, message = 'Hola, quiero más información sobre sus productos') {
  const raw = String(tienda?.whatsappTienda || tienda?.whatsapp || tienda?.telefono || '').replace(/[^\d]/g, '');
  const phone = raw || '51999999999';
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/* ─────────────────────────── Imagen de producto ─────────────────────────── */

export function FmProductImage({ producto, imgClassName = '' }: { producto: any; imgClassName?: string }) {
  const img = producto?.imagenUrl || producto?.imagen || '';
  const [broken, setBroken] = useState(false);
  if (img && !broken) {
    return <img src={img} alt={producto?.descripcion || 'Producto'} loading="lazy" onError={() => setBroken(true)} className={`h-full w-full object-contain ${imgClassName}`} />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ background: FM.soft }}>
      <Icon icon="solar:bag-4-linear" className="text-6xl" style={{ color: FM.green }} />
    </div>
  );
}

/* ─────────────────────────────── Rating estrellas ────────────────────────── */

export function StarRating({ value = 5, count, size = 13 }: { value?: number; count?: number; size?: number }) {
  const v = Math.max(0, Math.min(5, value));
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[0, 1, 2, 3, 4].map((i) => (
          <Icon key={i} icon={i < Math.round(v) ? 'solar:star-bold' : 'solar:star-linear'} width={size} style={{ color: FM.amber }} />
        ))}
      </div>
      {typeof count === 'number' && <span className="text-[11px] font-medium" style={{ color: FM.inkSoft }}>({count})</span>}
    </div>
  );
}

/* ──────────────────────────────── Product card ──────────────────────────── */

export function FmProductCard({
  producto,
  slug = '',
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
  const primary = fmPrimary(cp);
  const { toggleFavorito, isFavorito } = useFavoritosStore();
  const wish = isFavorito(Number(producto?.id), slug);
  const pricing = getProductPricing(producto);
  const toggleWish = () => toggleFavorito({
    id: Number(producto?.id),
    descripcion: producto?.descripcion || producto?.nombre || 'Producto',
    precioUnitario: pricing.precioFinal,
    imagenUrl: producto?.imagenUrl || producto?.imagen || '',
    slug,
  });
  const rating = Number(producto?.ratingAvg || producto?.ratingPromedio || 0) || 5;
  const peso = producto?.presentacion || producto?.unidadMedida || producto?.peso || '';

  return (
    <motion.article
      variants={fmCard}
      initial="hidden"
      whileInView="show"
      viewport={fmViewport}
      whileHover={fmHover}
      layout
      className="group relative flex flex-col rounded-xl border bg-white p-3 transition-shadow hover:shadow-[0_16px_34px_-20px_rgba(31,42,26,0.35)]"
      style={{ borderColor: FM.line }}
    >
      <button type="button" onClick={onClick} className="relative block aspect-square w-full overflow-hidden rounded-lg" style={{ backgroundColor: FM.cream }}>
        {pricing.enOferta && (
          <span className="absolute left-0 top-2 z-10 rounded-r-md px-2.5 py-1 text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: primary }}>
            {pricing.porcentajeDescuento}% OFF
          </span>
        )}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); toggleWish(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); toggleWish(); } }}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-neutral-400 shadow-sm ring-1 transition-colors hover:text-neutral-700"
          style={{ ['--tw-ring-color' as any]: FM.line }}
          title="Favorito"
        >
          <Icon icon={wish ? 'solar:heart-bold' : 'solar:heart-linear'} width={16} style={wish ? { color: FM.red } : undefined} />
        </span>
        <div className="h-full w-full p-3 transition-transform duration-500 ease-out group-hover:scale-[1.06]">
          <FmProductImage producto={producto} />
        </div>
      </button>

      <div className="flex flex-1 flex-col pt-3">
        <button type="button" onClick={onClick} className="text-left">
          <h3 className="line-clamp-2 text-[13.5px] font-semibold leading-snug" style={{ fontFamily: FM.display, color: FM.ink }}>{producto?.descripcion}</h3>
        </button>
        {peso && <p className="mt-0.5 text-[11px]" style={{ color: FM.inkSoft }}>{peso}</p>}
        <div className="mt-1.5"><StarRating value={rating} /></div>
        <div className="mt-auto flex items-center gap-2 pt-2.5">
          <span className="text-[16px] font-bold" style={{ fontFamily: FM.display, color: primary }}>S/ {pricing.precioFinal.toFixed(2)}</span>
          {pricing.enOferta && <span className="text-xs font-medium text-neutral-400 line-through">S/ {pricing.precioRegular.toFixed(2)}</span>}
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onAddToCart?.({ ...producto, precioUnitario: pricing.precioFinal, precioRegular: pricing.precioRegular, enOferta: pricing.enOferta }); }}
          className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-[11.5px] font-bold transition-colors"
          style={{ borderColor: primary, color: primary }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = primary; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = primary; }}
        >
          <Icon icon="solar:cart-plus-bold" width={15} /> Agregar al carrito
        </button>
      </div>
    </motion.article>
  );
}

/* ─────────────────────────────────── Header ─────────────────────────────── */

export function FmHeader({
  tienda,
  slug,
  cp,
  diseno,
  carritoSize,
  cartTotal = 0,
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
  cartTotal?: number;
  onOpenCart: () => void;
  searchQuery?: string;
  setSearchQuery?: (value: string) => void;
  onSearchSubmit?: (e: React.FormEvent, value?: string) => void;
  allCategories?: any[];
}) {
  const primary = fmPrimary(cp);
  const name = storeName(tienda, diseno);
  const tagline = storeTagline(tienda, diseno);
  const [openFavs, setOpenFavs] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);
  const categories = allCategories.map((c) => (typeof c === 'string' ? c : c?.nombre)).filter(Boolean);
  const navCats = categories.slice(0, 5);
  const address = diseno?.supermercadoContactAddress || tienda?.direccionTienda || tienda?.direccion || 'Av. Principal 123, Lima';
  const phone = diseno?.supermercadoContactPhone || tienda?.whatsappTienda || tienda?.telefono || '+51 999 999 999';
  const hours = diseno?.supermercadoContactHours || 'Lun a Dom · 8am – 10pm';
  const goProduct = (id: any) => {
    if (slug === 'preview') { window.dispatchEvent(new CustomEvent('preview-nav', { detail: 'catalogo' })); return; }
    window.location.href = `/tienda/${slug}/producto/${id}`;
  };

  return (
    <>
      {/* Barra utilitaria */}
      <div className="hidden border-b text-[12px] md:block" style={{ borderColor: FM.line, backgroundColor: FM.soft, color: FM.inkSoft }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-2">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5"><Icon icon="solar:map-point-linear" width={14} style={{ color: primary }} /> {address}</span>
            <span className="flex items-center gap-1.5"><Icon icon="solar:delivery-linear" width={14} style={{ color: primary }} /> Envío gratis desde S/ 80</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5"><Icon icon="solar:phone-linear" width={14} style={{ color: primary }} /> {phone}</span>
            <span className="hidden items-center gap-1.5 lg:flex"><Icon icon="solar:clock-circle-linear" width={14} style={{ color: primary }} /> {hours}</span>
            <span className="flex items-center gap-2">
              {['mdi:facebook', 'mdi:instagram', 'mdi:whatsapp'].map((ic) => (
                <a key={ic} href={ic === 'mdi:whatsapp' ? waLink(tienda) : '#'} target="_blank" rel="noreferrer" className="transition-colors hover:text-[var(--fm-cp)]" style={{ ['--fm-cp' as any]: primary }}><Icon icon={ic} width={15} /></a>
              ))}
            </span>
          </div>
        </div>
      </div>

      {/* Header principal */}
      <header className="border-b bg-white" style={{ borderColor: FM.line }}>
        <div className="mx-auto flex max-w-7xl items-center gap-5 px-5 py-4 md:px-6">
          <a href={`/tienda/${slug}`} className="flex shrink-0 items-center gap-2.5">
            {tienda?.logo ? (
              <img src={tienda.logo} alt={name} className="h-11 object-contain" />
            ) : (
              <>
                <span className="grid h-10 w-10 place-items-center rounded-lg text-white" style={{ backgroundColor: primary }}><Icon icon="solar:cart-large-2-bold" width={22} /></span>
                <span className="leading-none">
                  <span className="block text-xl font-extrabold" style={{ fontFamily: FM.display, color: FM.ink }}>{name}</span>
                  <span className="mt-0.5 block text-[10px] font-medium" style={{ color: FM.inkSoft }}>{tagline}</span>
                </span>
              </>
            )}
          </a>

          <form onSubmit={(e) => onSearchSubmit?.(e, searchQuery)} className="mx-auto hidden h-11 max-w-2xl flex-1 items-center overflow-hidden rounded-lg border md:flex" style={{ borderColor: primary }}>
            <input
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery?.(e.target.value)}
              placeholder={diseno?.supermercadoSearchPlaceholder || 'Buscar productos, categorías...'}
              className="h-full flex-1 border-0 bg-transparent px-4 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:ring-0"
            />
            <button type="submit" className="flex h-full items-center gap-1.5 px-6 text-sm font-bold text-white" style={{ backgroundColor: primary }}><Icon icon="solar:magnifer-linear" width={17} /> <span className="hidden lg:inline">Buscar</span></button>
          </form>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <a href={`/tienda/${slug}/seguimiento`} className="hidden items-center gap-1.5 text-sm font-medium sm:flex" style={{ color: FM.ink }} title="Mi cuenta">
              <Icon icon="solar:user-circle-linear" width={26} style={{ color: primary }} />
              <span className="hidden leading-tight lg:block"><span className="block text-[11px]" style={{ color: FM.inkSoft }}>Seguir</span><span className="block text-[12px] font-bold">Mi pedido</span></span>
            </a>
            <button type="button" onClick={() => setOpenFavs(true)} className="relative rounded-full p-2.5 transition-colors hover:bg-neutral-100" style={{ color: FM.ink }} title="Favoritos">
              <Icon icon="solar:heart-linear" width={23} />
              {favoritos.length > 0 && <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white" style={{ backgroundColor: FM.red }}>{favoritos.length}</span>}
            </button>
            <button type="button" onClick={onOpenCart} className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-neutral-100" style={{ color: FM.ink }} title="Carrito">
              <span className="relative">
                <Icon icon="solar:cart-large-2-linear" width={26} style={{ color: primary }} />
                {carritoSize > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white" style={{ backgroundColor: primary }}>{carritoSize}</span>}
              </span>
              <span className="hidden leading-tight lg:block"><span className="block text-[11px]" style={{ color: FM.inkSoft }}>Mi carrito</span><span className="block text-[12px] font-bold" style={{ color: primary }}>S/ {Number(cartTotal || 0).toFixed(2)}</span></span>
            </button>
          </div>
        </div>

        <div className="px-5 pb-3 md:hidden">
          <form onSubmit={(e) => onSearchSubmit?.(e, searchQuery)} className="flex h-11 items-center overflow-hidden rounded-lg border" style={{ borderColor: primary }}>
            <input value={searchQuery || ''} onChange={(e) => setSearchQuery?.(e.target.value)} placeholder="Buscar productos..." className="h-full flex-1 border-0 bg-transparent px-4 text-sm outline-none placeholder:text-neutral-400 focus:ring-0" />
            <button type="submit" className="flex h-full items-center px-5 text-white" style={{ backgroundColor: primary }}><Icon icon="solar:magnifer-linear" width={18} /></button>
          </form>
        </div>
      </header>

      {/* Barra de navegación */}
      <div className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur" style={{ borderColor: FM.line }}>
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-5 py-2.5 md:px-6">
          <a href={`/tienda/${slug}/catalogo`} className="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-bold text-white" style={{ backgroundColor: primary }}>
            <Icon icon="solar:hamburger-menu-linear" width={18} /> Categorías
          </a>
          <nav className="flex items-center gap-0.5 overflow-x-auto">
            <a href={`/tienda/${slug}`} className="whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors hover:text-[var(--fm-cp)]" style={{ color: FM.ink, ['--fm-cp' as any]: primary }}>Inicio</a>
            <a href={`/tienda/${slug}/catalogo`} className="whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors hover:text-[var(--fm-cp)]" style={{ color: FM.ink, ['--fm-cp' as any]: primary }}>Tienda</a>
            {navCats.map((c) => (
              <a key={c} href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`} className="hidden whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold text-neutral-600 transition-colors hover:text-[var(--fm-cp)] lg:inline" style={{ ['--fm-cp' as any]: primary }}>{c}</a>
            ))}
            <a href={`/tienda/${slug}/contacto`} className="whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold text-neutral-600 transition-colors hover:text-[var(--fm-cp)]" style={{ ['--fm-cp' as any]: primary }}>Contacto</a>
            <a href={`/tienda/${slug}/catalogo`} className="ml-1 flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-bold text-white" style={{ backgroundColor: FM.orange }}><Icon icon="solar:fire-bold" width={14} /> Ofertas flash</a>
          </nav>
        </div>
      </div>

      <FmFavoritesModal open={openFavs} onClose={() => setOpenFavs(false)} slug={slug} cp={primary} favoritos={favoritos} onRemove={removeFavorito} onProduct={goProduct} />
    </>
  );
}

/* ─────────────────────────── WhatsApp flotante ──────────────────────────── */

export function FmWhatsAppFab({ tienda }: { tienda: any }) {
  return (
    <a href={waLink(tienda)} target="_blank" rel="noreferrer" className="group fixed bottom-6 right-6 z-50 flex h-14 items-center gap-0 overflow-hidden rounded-full text-white shadow-[0_14px_34px_-10px_rgba(37,211,102,0.7)]" style={{ backgroundColor: '#25D366' }} aria-label="WhatsApp">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center"><Icon icon="mdi:whatsapp" width={28} /></span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-[200px] group-hover:pr-6">¿Te ayudamos?</span>
    </a>
  );
}

/* ─────────────────────────────────── Footer ─────────────────────────────── */

const PAYMENTS = ['logos:visa', 'logos:mastercard', 'logos:paypal', 'logos:apple-pay', 'logos:google-pay'];

export function FmFooter({ tienda, slug, diseno, cp, categories = [] }: { tienda: any; slug: string; diseno?: any; cp: string; categories?: any[] }) {
  const primary = fmPrimary(cp);
  const name = storeName(tienda, diseno);
  const cats = categories.map((c) => (typeof c === 'string' ? c : c?.nombre)).filter(Boolean).slice(0, 6);

  return (
    <motion.footer initial="hidden" whileInView="show" viewport={fmViewport} variants={fmSection} className="text-white" style={{ backgroundColor: FM.greenDark }}>
      <div className="mx-auto grid max-w-7xl gap-9 px-6 py-14 md:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-lg" style={{ backgroundColor: primary }}><Icon icon="solar:cart-large-2-bold" width={22} /></span>
            <span className="leading-none">
              <span className="block text-xl font-extrabold" style={{ fontFamily: FM.display }}>{name}</span>
              <span className="mt-0.5 block text-[10px] text-white/60">{storeTagline(tienda, diseno)}</span>
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">{diseno?.supermercadoFooterText || tienda?.descripcionTienda || 'Tu tienda de confianza para abarrotes frescos y esenciales del hogar. Calidad garantizada, envío rápido.'}</p>
          <div className="mt-5 flex gap-3">
            {['mdi:facebook', 'mdi:instagram', 'ic:baseline-tiktok', 'mdi:whatsapp'].map((icon) => (
              <a key={icon} href={icon === 'mdi:whatsapp' ? waLink(tienda) : '#'} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/75 transition-colors hover:bg-white/20"><Icon icon={icon} width={19} /></a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-bold" style={{ fontFamily: FM.display }}>Enlaces</h4>
          <div className="space-y-2.5 text-sm text-white/65">
            <a href={`/tienda/${slug}`} className="block transition-colors hover:text-white">Inicio</a>
            <a href={`/tienda/${slug}/catalogo`} className="block transition-colors hover:text-white">Tienda</a>
            <a href={`/tienda/${slug}/seguimiento`} className="block transition-colors hover:text-white">Seguir mi pedido</a>
            <a href={`/tienda/${slug}/contacto`} className="block transition-colors hover:text-white">Contacto</a>
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-bold" style={{ fontFamily: FM.display }}>Categorías</h4>
          <div className="space-y-2.5 text-sm text-white/65">
            {cats.length ? cats.map((c) => (
              <a key={c} href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`} className="block transition-colors hover:text-white">{c}</a>
            )) : <a href={`/tienda/${slug}/catalogo`} className="block transition-colors hover:text-white">Ver todo</a>}
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-bold" style={{ fontFamily: FM.display }}>Contáctanos</h4>
          <p className="text-sm text-white/65">{diseno?.supermercadoContactAddress || tienda?.direccionTienda || 'Av. Principal 123, Lima'}</p>
          <p className="mt-2.5 text-sm text-white/65">{diseno?.supermercadoFooterPhone || tienda?.whatsappTienda || tienda?.telefono || '+51 999 999 999'}</p>
          <p className="mt-2.5 text-sm text-white/65">{diseno?.supermercadoFooterEmail || tienda?.email || tienda?.correo || 'hola@freshmart.pe'}</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-5 text-center text-xs text-white/50 md:flex-row md:text-left">
          <span>© 2026 {name}. Powered by Falconext.</span>
          <div className="flex items-center gap-2">
            <span className="mr-1 text-white/40">Aceptamos:</span>
            {PAYMENTS.map((p) => (
              <span key={p} className="flex h-6 w-9 items-center justify-center rounded bg-white"><Icon icon={p} width={26} /></span>
            ))}
          </div>
        </div>
      </div>
    </motion.footer>
  );
}

/* ─────────────────────────── Modal / Drawer carrito ─────────────────────── */

export function FmCartModal({
  isOpen, onClose, carrito, actualizarCantidad, onCheckout, cp, tienda,
}: {
  isOpen: boolean;
  onClose: () => void;
  carrito: any[];
  setCarrito?: (c: any[]) => void;
  actualizarCantidad: (id: number | string, cantidad: number) => void;
  onCheckout: () => void;
  cp: string;
  tienda?: any;
}) {
  const primary = fmPrimary(cp);
  const money = (v: number) => `S/ ${Number(v || 0).toFixed(2)}`;
  const total = carrito.reduce((acc, item) => acc + Number(item.precioUnitario || item.precio || 0) * Number(item.cantidad || 1), 0);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  const cotizar = () => {
    if (!carrito.length) return;
    const nombre = tienda?.nombreComercial || tienda?.razonSocial || tienda?.nombre || 'la tienda';
    const lineas = carrito.map((i) => `• ${i.cantidad || 1}x ${i.descripcion} — ${money(Number(i.precioUnitario || i.precio || 0) * Number(i.cantidad || 1))}`).join('\n');
    const msg = `Hola ${nombre}, quiero pedir estos productos:\n\n${lineas}\n\nTotal estimado: ${money(total)}`;
    window.open(waLink(tienda, msg), '_blank', 'noopener,noreferrer');
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] isolate" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 220 }} className="fixed inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 text-white" style={{ backgroundColor: primary }}>
              <div className="flex items-center gap-3">
                <Icon icon="solar:cart-large-2-bold" width={24} />
                <h3 className="text-xl font-bold" style={{ fontFamily: FM.display }}>Mi carrito</h3>
              </div>
              <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/20" title="Cerrar"><Icon icon="solar:close-circle-linear" width={22} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              {carrito.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                  <Icon icon="solar:cart-cross-linear" className="text-5xl text-neutral-300" />
                  <p className="mt-4 text-sm font-medium text-neutral-500">Tu carrito está vacío.</p>
                </div>
              ) : (
                carrito.map((item) => {
                  const itemId = item.cartId || item.id;
                  const qty = Number(item.cantidad || 1);
                  const price = Number(item.precioUnitario || item.precio || 0);
                  return (
                    <div key={itemId} className="flex gap-4 border-b py-5" style={{ borderColor: FM.line }}>
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg p-2" style={{ backgroundColor: FM.soft }}><FmProductImage producto={item} /></div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold leading-5" style={{ color: FM.ink }}>{item.descripcion}</p>
                        <p className="mt-1 text-sm font-bold" style={{ color: primary }}>{money(price * qty)}</p>
                        <div className="mt-2.5 flex items-center justify-between gap-3">
                          <div className="flex h-9 items-center rounded-lg ring-1" style={{ ['--tw-ring-color' as any]: FM.line }}>
                            <button type="button" onClick={() => actualizarCantidad(itemId, qty - 1)} className="h-9 w-9 text-sm font-bold text-neutral-600">-</button>
                            <span className="w-8 text-center text-sm font-bold">{qty}</span>
                            <button type="button" onClick={() => actualizarCantidad(itemId, qty + 1)} className="h-9 w-9 text-sm font-bold" style={{ color: primary }}>+</button>
                          </div>
                          <button type="button" onClick={() => actualizarCantidad(itemId, 0)} className="flex h-9 w-9 items-center justify-center rounded-full text-red-500 hover:bg-red-50"><Icon icon="solar:trash-bin-trash-linear" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {carrito.length > 0 && (
              <div className="border-t px-6 py-5" style={{ borderColor: FM.line }}>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: FM.inkSoft }}>Total</span>
                  <span className="text-2xl font-extrabold" style={{ fontFamily: FM.display, color: FM.ink }}>{money(total)}</span>
                </div>
                <button type="button" onClick={onCheckout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-4 text-sm font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5" style={{ backgroundColor: primary }}>Finalizar compra <Icon icon="solar:arrow-right-linear" width={18} /></button>
                <button type="button" onClick={cotizar} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border py-3.5 text-sm font-bold transition-colors" style={{ borderColor: '#25D366', color: '#128C4B' }}><Icon icon="mdi:whatsapp" width={18} /> Pedir por WhatsApp</button>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ─────────────────────────── Modal / Drawer favoritos ───────────────────── */

export function FmFavoritesModal({
  open, onClose, slug, cp, favoritos, onRemove, onProduct,
}: {
  open: boolean;
  onClose: () => void;
  slug: string;
  cp: string;
  favoritos: any[];
  onRemove: (id: number, slug: string) => void;
  onProduct: (id: number | string) => void;
}) {
  const primary = fmPrimary(cp);
  const money = (v: number) => `S/ ${Number(v || 0).toFixed(2)}`;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] isolate" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 220 }} className="fixed inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: FM.line }}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: withAlpha(FM.red, '1f'), color: FM.red }}><Icon icon="solar:heart-bold" width={20} /></span>
                <h3 className="text-xl font-bold" style={{ fontFamily: FM.display, color: FM.ink }}>Favoritos</h3>
              </div>
              <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100" title="Cerrar"><Icon icon="solar:close-circle-linear" width={22} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              {favoritos.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                  <Icon icon="solar:heart-linear" className="text-5xl text-neutral-300" />
                  <p className="mt-4 text-sm font-medium text-neutral-500">Aún no tienes favoritos.</p>
                </div>
              ) : (
                favoritos.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b py-5" style={{ borderColor: FM.line }}>
                    <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg p-2" style={{ backgroundColor: FM.soft }}><FmProductImage producto={item} /></button>
                    <div className="min-w-0 flex-1">
                      <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="block text-left"><p className="line-clamp-2 text-sm font-semibold leading-5" style={{ color: FM.ink }}>{item.descripcion}</p></button>
                      <p className="mt-1 text-sm font-bold" style={{ color: primary }}>{money(item.precioUnitario)}</p>
                      <div className="mt-2.5 flex items-center gap-3">
                        <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="rounded-lg px-4 py-2 text-[11px] font-bold text-white" style={{ backgroundColor: primary }}>Ver producto</button>
                        <button type="button" onClick={() => onRemove(Number(item.id), slug)} className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 hover:bg-red-50" title="Quitar"><Icon icon="solar:trash-bin-trash-linear" width={18} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t px-6 py-5" style={{ borderColor: FM.line }}>
              <a href={`/tienda/${slug}/catalogo`} className="flex w-full items-center justify-center gap-2 rounded-lg border py-3.5 text-sm font-bold transition-colors" style={{ borderColor: primary, color: primary }}>Seguir comprando</a>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
