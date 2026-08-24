import type React from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { getProductPricing } from '@/templates/shared/pricing';
import { useFavoritosStore } from '@/zustand/favoritos';
import { urbCard, urbEase, urbHover, urbSection, urbTap, urbViewport } from './motion';

/**
 * Identidad visual de la plantilla "Urbanic" (ropa de hombre / moda urbana premium).
 *
 * Estética editorial beige/crema/negro inspirada en catálogos de moda masculina de alta
 * gama. Paleta neutra cálida con acento tostado/bronce. `cp` (colorPrimario del diseño) es
 * el color de ACENTO configurable desde el editor — por defecto bronce cálido. Los CTA
 * principales usan `ink` (negro) para conservar el look premium.
 */
export const URB = {
  ink: '#1A1613',
  charcoal: '#262220',
  gold: '#8C6A45',
  goldSoft: '#B79C7C',
  tan: '#9A7B58',
  sand: '#ECE3D6',
  nude: '#E1D3C0',
  cream: '#F7F2EA',
  mist: '#F1E9DD',
  line: 'rgba(26,22,19,0.08)',
  serif: "'Playfair Display', 'Cormorant Garamond', Georgia, 'Times New Roman', serif",
} as const;

export const urbPrimary = (cp?: string) => cp || URB.gold;
export const urbFont = (diseno?: any) => `'${diseno?.tipografia || 'Inter'}', ui-sans-serif, system-ui, sans-serif`;

/** Añade transparencia hex (#RRGGBB + alpha 00-ff) de forma segura. */
export function withAlpha(hex: string, alpha: string) {
  return /^#([0-9a-fA-F]{6})$/.test(hex) ? `${hex}${alpha}` : hex;
}

export function storeName(tienda: any, diseno: any) {
  return diseno?.ropaHombreLogoText || tienda?.nombreComercial || tienda?.razonSocial || tienda?.nombre || 'Urbanic';
}

/** Número de WhatsApp de la tienda. */
export function waLink(tienda: any, message = 'Hola, quiero más información sobre sus prendas') {
  const raw = String(tienda?.whatsappTienda || tienda?.whatsapp || tienda?.telefono || '').replace(/[^\d]/g, '');
  const phone = raw || '51999999999';
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/* ─────────────────────────── Imagen de producto ─────────────────────────── */

export function UrbProductImage({ producto, imgClassName = '' }: { producto: any; imgClassName?: string }) {
  const img = producto?.imagenUrl || producto?.imagen || '';
  const [broken, setBroken] = useState(false);
  if (img && !broken) {
    return <img src={img} alt={producto?.descripcion || 'Producto'} loading="lazy" onError={() => setBroken(true)} className={`h-full w-full object-cover ${imgClassName}`} />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ background: `linear-gradient(150deg, ${URB.mist}, ${URB.nude})` }}>
      <Icon icon="solar:t-shirt-linear" className="text-6xl" style={{ color: URB.tan }} />
    </div>
  );
}

/* ─────────────── Swatches de color (decorativos, look editorial) ─────────── */

const SWATCHES = ['#1A1613', '#6E5637', '#B79C7C', '#E1D3C0', '#3B4652', '#8A8078'];

function ColorSwatches({ seed }: { seed: number }) {
  const count = 3 + (seed % 3);
  return (
    <div className="mt-3 flex items-center gap-1.5">
      {SWATCHES.slice(0, count).map((c, i) => (
        <span key={i} className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: c }} />
      ))}
    </div>
  );
}

/* ──────────────────────────────── Product card ──────────────────────────── */

export function UrbProductCard({
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
  const primary = urbPrimary(cp);
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
  const marca = typeof producto?.marca === 'object' ? producto?.marca?.nombre : producto?.marca;
  const seed = Number(producto?.id || 0);

  return (
    <motion.article
      variants={urbCard}
      initial="hidden"
      whileInView="show"
      viewport={urbViewport}
      whileHover={urbHover}
      layout
      className="group relative flex flex-col"
    >
      <button type="button" onClick={onClick} className="relative block aspect-[4/5] w-full overflow-hidden rounded-2xl" style={{ backgroundColor: URB.mist }}>
        {pricing.enOferta && (
          <span className="absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-sm" style={{ backgroundColor: primary }}>
            -{pricing.porcentajeDescuento}%
          </span>
        )}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); toggleWish(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); toggleWish(); } }}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/85 text-neutral-700 shadow-sm backdrop-blur transition-colors hover:text-neutral-900"
          title="Favorito"
        >
          <Icon icon={wish ? 'solar:heart-bold' : 'solar:heart-linear'} width={17} style={wish ? { color: primary } : undefined} />
        </span>
        <div className="h-full w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]">
          <UrbProductImage producto={producto} />
        </div>
        <div className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => { e.stopPropagation(); onAddToCart?.({ ...producto, precioUnitario: pricing.precioFinal, precioRegular: pricing.precioRegular, enOferta: pricing.enOferta }); }}
            className="pointer-events-auto flex h-11 w-full items-center justify-center gap-2 rounded-full text-[11px] font-semibold uppercase tracking-[0.16em] text-white shadow-lg"
            style={{ backgroundColor: URB.ink }}
          >
            <Icon icon="solar:bag-4-linear" width={15} /> Añadir
          </span>
        </div>
      </button>

      <div className="flex flex-1 flex-col pt-4">
        {marca && <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: URB.gold }}>{marca}</p>}
        <button type="button" onClick={onClick} className="text-left">
          <h3 className="line-clamp-1 text-[13px] font-medium uppercase tracking-[0.06em]" style={{ color: URB.ink }}>{producto?.descripcion}</h3>
        </button>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[15px] font-semibold" style={{ color: URB.ink }}>S/ {pricing.precioFinal.toFixed(2)}</span>
          {pricing.enOferta && <span className="text-xs font-medium text-neutral-400 line-through">S/ {pricing.precioRegular.toFixed(2)}</span>}
        </div>
        <ColorSwatches seed={seed} />
      </div>
    </motion.article>
  );
}

/* ─────────────────────────────────── Header ─────────────────────────────── */

export function UrbHeader({
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
  const primary = urbPrimary(cp);
  const name = storeName(tienda, diseno);
  const tagline = diseno?.ropaHombreLogoTagline || 'Clothing Co.';
  const [openSearch, setOpenSearch] = useState(false);
  const [openFavs, setOpenFavs] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);
  const cats = allCategories.map((cat) => (typeof cat === 'string' ? cat : cat?.nombre)).filter(Boolean).slice(0, 3);
  const goProduct = (id: any) => {
    if (slug === 'preview') { window.dispatchEvent(new CustomEvent('preview-nav', { detail: 'catalogo' })); return; }
    window.location.href = `/tienda/${slug}/producto/${id}`;
  };
  const navGo = (path: string) => {
    if (slug === 'preview') { window.dispatchEvent(new CustomEvent('preview-nav', { detail: path.includes('contacto') ? 'contacto' : 'catalogo' })); return; }
    window.location.href = path;
  };

  const NAV = [
    { label: diseno?.ropaHombreNavHome || 'Home', path: `/tienda/${slug}`, kind: 'home' as const },
    { label: diseno?.ropaHombreNavShop || 'Shop', path: `/tienda/${slug}/catalogo`, kind: 'catalogo' as const },
    { label: diseno?.ropaHombreNavCollections || 'Collections', path: `/tienda/${slug}/catalogo`, kind: 'catalogo' as const },
    { label: diseno?.ropaHombreNavNew || 'New Arrivals', path: `/tienda/${slug}/catalogo`, kind: 'catalogo' as const },
    { label: diseno?.ropaHombreNavAbout || 'About Us', path: `/tienda/${slug}/contacto`, kind: 'contacto' as const },
    { label: diseno?.ropaHombreNavContact || 'Contact', path: `/tienda/${slug}/contacto`, kind: 'contacto' as const },
  ];

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: urbEase }}
        className="sticky top-0 z-40 border-b bg-[#F7F2EA]/90 backdrop-blur-xl"
        style={{ borderColor: URB.line }}
      >
        <div className="mx-auto flex h-[74px] max-w-7xl items-center gap-4 px-5 md:px-8">
          {/* Logo */}
          <a href={`/tienda/${slug}`} className="flex shrink-0 flex-col items-start leading-none">
            {tienda?.logo ? (
              <img src={tienda.logo} alt={name} className="h-10 object-contain" />
            ) : (
              <>
                <span className="text-[22px] font-semibold tracking-[0.02em] md:text-2xl" style={{ fontFamily: URB.serif, color: URB.ink }}>{name}</span>
                <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.44em] text-neutral-500">{tagline}</span>
              </>
            )}
          </a>

          {/* Nav centrada */}
          <nav className="mx-auto hidden items-center gap-7 lg:flex">
            {NAV.map((item, i) => (
              <button
                key={`${item.label}-${i}`}
                type="button"
                onClick={() => navGo(item.path)}
                className="text-[13px] font-medium text-neutral-700 transition-colors hover:text-neutral-950"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Acciones */}
          <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
            {openSearch ? (
              <form
                onSubmit={(e) => onSearchSubmit?.(e, searchQuery)}
                className="hidden items-center gap-2 rounded-full border bg-white px-3.5 py-2 md:flex"
                style={{ borderColor: URB.line }}
              >
                <Icon icon="solar:magnifer-linear" width={15} className="text-neutral-400" />
                <input
                  autoFocus
                  value={searchQuery || ''}
                  onChange={(e) => setSearchQuery?.(e.target.value)}
                  placeholder={diseno?.ropaHombreSearchPlaceholder || 'Buscar camisas, jeans...'}
                  className="w-40 border-0 bg-transparent p-0 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:ring-0"
                />
              </form>
            ) : (
              <button type="button" onClick={() => setOpenSearch(true)} className="rounded-full p-2 text-neutral-700 transition-colors hover:bg-black/5" title="Buscar">
                <Icon icon="solar:magnifer-linear" width={20} />
              </button>
            )}
            <button type="button" onClick={() => setOpenFavs(true)} className="relative rounded-full p-2 text-neutral-800 transition-colors hover:bg-black/5" title="Favoritos">
              <Icon icon="solar:user-linear" width={20} />
              {favoritos.length > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: primary }}>
                  {favoritos.length}
                </span>
              )}
            </button>
            <button type="button" onClick={onOpenCart} className="relative rounded-full p-2 text-neutral-800 transition-colors hover:bg-black/5" title="Carrito">
              <Icon icon="solar:bag-4-linear" width={20} />
              {carritoSize > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: primary }}>
                  {carritoSize}
                </span>
              )}
            </button>
            <button type="button" onClick={() => navGo(`/tienda/${slug}/catalogo`)} className="ml-1 hidden rounded-full px-6 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 sm:inline-flex" style={{ backgroundColor: URB.ink }}>
              {diseno?.ropaHombreSignUpLabel || 'Sign Up'}
            </button>
            <button type="button" onClick={() => setOpenMenu((v) => !v)} className="rounded-full p-2 text-neutral-800 transition-colors hover:bg-black/5 lg:hidden" title="Menú">
              <Icon icon={openMenu ? 'solar:close-square-linear' : 'solar:hamburger-menu-linear'} width={22} />
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {openMenu && (
          <div className="border-t bg-[#F7F2EA] px-5 py-4 lg:hidden" style={{ borderColor: URB.line }}>
            <div className="flex flex-col gap-1">
              {NAV.map((item, i) => (
                <button key={`m-${item.label}-${i}`} type="button" onClick={() => { setOpenMenu(false); navGo(item.path); }} className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-neutral-700 hover:bg-black/5">
                  {item.label}
                </button>
              ))}
              {cats.map((c) => (
                <button key={`mc-${c}`} type="button" onClick={() => { setOpenMenu(false); navGo(`/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`); }} className="rounded-lg px-3 py-2 text-left text-xs uppercase tracking-wide text-neutral-500 hover:bg-black/5">
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.header>

      <UrbFavoritesModal
        open={openFavs}
        onClose={() => setOpenFavs(false)}
        slug={slug}
        cp={primary}
        favoritos={favoritos}
        onRemove={removeFavorito}
        onProduct={goProduct}
      />
    </>
  );
}

/* ─────────────────────────── WhatsApp flotante ──────────────────────────── */

export function UrbWhatsAppFab({ tienda }: { tienda: any }) {
  return (
    <a
      href={waLink(tienda)}
      target="_blank"
      rel="noreferrer"
      className="group fixed bottom-6 right-6 z-50 flex h-14 items-center gap-0 overflow-hidden rounded-full text-white shadow-[0_14px_34px_-10px_rgba(37,211,102,0.7)]"
      style={{ backgroundColor: '#25D366' }}
      aria-label="Escríbenos por WhatsApp"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center">
        <Icon icon="mdi:whatsapp" width={28} />
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-[200px] group-hover:pr-6">
        ¿Te asesoramos?
      </span>
    </a>
  );
}

/* ─────────────────────────────────── Footer ─────────────────────────────── */

export function UrbFooter({ tienda, slug, diseno, cp, categories = [] }: { tienda: any; slug: string; diseno?: any; cp: string; categories?: any[] }) {
  const name = storeName(tienda, diseno);
  const tagline = diseno?.ropaHombreLogoTagline || 'Clothing Co.';
  const email = diseno?.ropaHombreFooterEmail || tienda?.email || tienda?.correo || 'info@urbanic.com';
  const phone = diseno?.ropaHombreFooterPhone || tienda?.whatsappTienda || tienda?.telefono || '+1 234 567 8900';
  const address = diseno?.ropaHombreContactAddress || tienda?.direccionTienda || tienda?.direccion || 'New York, USA';
  const shop = [['All Products', `/tienda/${slug}/catalogo`], ['New Arrivals', `/tienda/${slug}/catalogo`], ['Best Sellers', `/tienda/${slug}/catalogo`], ['Sale', `/tienda/${slug}/catalogo`]];
  const company = [['About Us', `/tienda/${slug}/contacto`], ['Our Team', `/tienda/${slug}/contacto`], ['Careers', `/tienda/${slug}/contacto`], ['News', `/tienda/${slug}/contacto`]];
  const help = [['FAQs', `/tienda/${slug}/contacto`], ['Shipping & Returns', `/tienda/${slug}/contacto`], ['Size Guide', `/tienda/${slug}/contacto`], ['Contact Us', `/tienda/${slug}/contacto`]];

  const Col = ({ title, items }: { title: string; items: string[][] }) => (
    <div>
      <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-white">{title}</h4>
      <div className="space-y-2.5 text-[13px] text-white/50">
        {items.map(([label, href]) => (
          <a key={label} href={href} className="block transition-colors hover:text-white">{label}</a>
        ))}
      </div>
    </div>
  );

  return (
    <motion.footer initial="hidden" whileInView="show" viewport={urbViewport} variants={urbSection} className="text-white" style={{ backgroundColor: URB.ink }}>
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[1.8fr_1fr_1fr_1.1fr] md:px-8">
        <div>
          <div className="flex flex-col leading-none">
            <span className="text-2xl font-semibold" style={{ fontFamily: URB.serif }}>{name}</span>
            <span className="mt-1 text-[8px] font-semibold uppercase tracking-[0.44em] text-white/40">{tagline}</span>
          </div>
          <p className="mt-5 max-w-xs text-[13px] leading-7 text-white/50">
            {diseno?.ropaHombreFooterText || tienda?.descripcionTienda || 'Ropa de hombre confeccionada para durar, con estilo y confianza.'}
          </p>
          <div className="mt-6 flex gap-2.5">
            {['mdi:instagram', 'mdi:facebook', 'prime:twitter', 'mdi:pinterest'].map((icon) => (
              <a key={icon} href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20">
                <Icon icon={icon} width={17} />
              </a>
            ))}
          </div>
        </div>
        <Col title="Shop" items={shop} />
        <Col title="Company" items={company} />
        <div>
          <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-white">Help</h4>
          <div className="space-y-2.5 text-[13px] text-white/50">
            {help.map(([label, href]) => (
              <a key={label} href={href} className="block transition-colors hover:text-white">{label}</a>
            ))}
          </div>
          <div className="mt-6 space-y-1.5 text-[13px] text-white/50">
            <p className="flex items-center gap-2"><Icon icon="solar:letter-linear" width={15} /> {email}</p>
            <p className="flex items-center gap-2"><Icon icon="solar:phone-linear" width={15} /> {phone}</p>
            <p className="flex items-center gap-2"><Icon icon="solar:map-point-linear" width={15} /> {address}</p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-white/40 md:flex-row md:px-8">
          <span>© 2026 {name}. All rights reserved.</span>
          <span>Powered by Falconext</span>
        </div>
      </div>
    </motion.footer>
  );
}

/* ─────────────────────────── Modal / Drawer carrito ─────────────────────── */

export function UrbCartModal({
  isOpen,
  onClose,
  carrito,
  actualizarCantidad,
  onCheckout,
  cp,
  tienda,
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
  const primary = urbPrimary(cp);
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
    const msg = `Hola ${nombre}, quiero cotizar estas prendas:\n\n${lineas}\n\nTotal estimado: ${money(total)}`;
    window.open(waLink(tienda, msg), '_blank', 'noopener,noreferrer');
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] isolate" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed inset-y-0 right-0 flex w-full max-w-md flex-col border-l shadow-2xl"
            style={{ backgroundColor: URB.cream, borderColor: URB.line }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: URB.line }}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: URB.mist, color: URB.ink }}>
                  <Icon icon="solar:bag-4-linear" width={20} />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Tu selección</p>
                  <h3 className="text-xl leading-none" style={{ fontFamily: URB.serif, color: URB.ink }}>Carrito</h3>
                </div>
              </div>
              <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-black/5" title="Cerrar">
                <Icon icon="solar:close-circle-linear" width={22} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6">
              {carrito.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                  <Icon icon="solar:bag-cross-linear" className="text-5xl text-neutral-300" />
                  <p className="mt-4 text-sm font-medium text-neutral-500">Tu carrito está vacío.</p>
                </div>
              ) : (
                carrito.map((item) => {
                  const itemId = item.cartId || item.id;
                  const qty = Number(item.cantidad || 1);
                  const price = Number(item.precioUnitario || item.precio || 0);
                  return (
                    <div key={itemId} className="flex gap-4 border-b py-5" style={{ borderColor: URB.line }}>
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl" style={{ backgroundColor: URB.mist }}>
                        <UrbProductImage producto={item} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium leading-5" style={{ color: URB.ink }}>{item.descripcion}</p>
                        <p className="mt-1 text-sm font-semibold" style={{ color: URB.ink }}>{money(price * qty)}</p>
                        <div className="mt-2.5 flex items-center justify-between gap-3">
                          <div className="flex h-9 items-center rounded-full bg-white ring-1" style={{ ['--tw-ring-color' as any]: URB.line }}>
                            <button type="button" onClick={() => actualizarCantidad(itemId, qty - 1)} className="h-9 w-9 text-sm font-bold text-neutral-600">-</button>
                            <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                            <button type="button" onClick={() => actualizarCantidad(itemId, qty + 1)} className="h-9 w-9 text-sm font-bold text-neutral-600">+</button>
                          </div>
                          <button type="button" onClick={() => actualizarCantidad(itemId, 0)} className="flex h-9 w-9 items-center justify-center rounded-full text-red-500 hover:bg-red-50">
                            <Icon icon="solar:trash-bin-trash-linear" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {carrito.length > 0 && (
              <div className="border-t px-6 py-5" style={{ borderColor: URB.line }}>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Total</span>
                  <span className="text-2xl font-semibold" style={{ fontFamily: URB.serif, color: URB.ink }}>{money(total)}</span>
                </div>
                <button type="button" onClick={onCheckout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-lg" style={{ backgroundColor: URB.ink }}>
                  Finalizar compra <Icon icon="solar:arrow-right-linear" width={16} />
                </button>
                <button type="button" onClick={cotizar} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border py-3.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors" style={{ borderColor: URB.tan, color: URB.ink }}>
                  <Icon icon="mdi:whatsapp" width={18} /> Cotizar por WhatsApp
                </button>
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

export function UrbFavoritesModal({
  open,
  onClose,
  slug,
  cp,
  favoritos,
  onRemove,
  onProduct,
}: {
  open: boolean;
  onClose: () => void;
  slug: string;
  cp: string;
  favoritos: any[];
  onRemove: (id: number, slug: string) => void;
  onProduct: (id: number | string) => void;
}) {
  const primary = urbPrimary(cp);
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
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed inset-y-0 right-0 flex w-full max-w-md flex-col border-l shadow-2xl"
            style={{ backgroundColor: URB.cream, borderColor: URB.line }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: URB.line }}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: withAlpha(primary, '1f'), color: primary }}>
                  <Icon icon="solar:heart-bold" width={20} />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Tu lista de deseos</p>
                  <h3 className="text-xl leading-none" style={{ fontFamily: URB.serif, color: URB.ink }}>Favoritos</h3>
                </div>
              </div>
              <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-black/5" title="Cerrar">
                <Icon icon="solar:close-circle-linear" width={22} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6">
              {favoritos.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                  <Icon icon="solar:heart-linear" className="text-5xl text-neutral-300" />
                  <p className="mt-4 text-sm font-medium text-neutral-500">Aún no tienes favoritos.</p>
                  <p className="mt-1 text-xs text-neutral-400">Toca el corazón en una prenda para guardarla aquí.</p>
                </div>
              ) : (
                favoritos.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b py-5" style={{ borderColor: URB.line }}>
                    <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl" style={{ backgroundColor: URB.mist }}>
                      <UrbProductImage producto={item} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="block text-left">
                        <p className="line-clamp-2 text-sm font-medium leading-5" style={{ color: URB.ink }}>{item.descripcion}</p>
                      </button>
                      <p className="mt-1 text-sm font-semibold" style={{ color: URB.ink }}>{money(item.precioUnitario)}</p>
                      <div className="mt-2.5 flex items-center gap-3">
                        <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white" style={{ backgroundColor: URB.ink }}>
                          Ver producto
                        </button>
                        <button type="button" onClick={() => onRemove(Number(item.id), slug)} className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 hover:bg-red-50" title="Quitar">
                          <Icon icon="solar:trash-bin-trash-linear" width={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-5" style={{ borderColor: URB.line }}>
              <a href={`/tienda/${slug}/catalogo`} className="flex w-full items-center justify-center gap-2 rounded-full border py-3.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors" style={{ borderColor: URB.tan, color: URB.ink }}>
                Seguir comprando
              </a>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
