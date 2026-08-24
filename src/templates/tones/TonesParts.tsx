import type React from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { getProductPricing } from '@/templates/shared/pricing';
import { useFavoritosStore } from '@/zustand/favoritos';
import { tnCard, tnEase, tnHover, tnViewport } from './motion';

/**
 * Identidad visual de la plantilla "Tones" (ropa infantil / familiar premium).
 *
 * Estética cálida y suave inspirada en marcas boutique de ropa para niños y bebés:
 * fondo crema/greige, tarjetas redondeadas, marrón cacao para CTA y footer, títulos
 * en minúsculas amables (Quicksand) y etiquetas de sección en mayúsculas espaciadas
 * (Plus Jakarta Sans). `cp` (colorPrimario) es el color de ACENTO configurable; por
 * defecto el marrón cacao de la marca.
 */
export const TN = {
  ink: '#2A241F',
  cocoa: '#463A31',
  espresso: '#372E28',
  taupe: '#8C7D6D',
  cream: '#EDE7DC',
  panel: '#F4EFE7',
  sand: '#E5DBCB',
  nude: '#DBCFBC',
  line: 'rgba(42,36,31,0.10)',
  lineStrong: 'rgba(42,36,31,0.18)',
  brand: "'Quicksand', ui-rounded, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
  display: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
} as const;

export const tnPrimary = (cp?: string) => cp || TN.cocoa;
export const tnFont = (diseno?: any) => `'${diseno?.tipografia || 'Inter'}', ui-sans-serif, system-ui, sans-serif`;

/** Añade transparencia hex (#RRGGBB + alpha 00-ff) de forma segura. */
export function withAlpha(hex: string, alpha: string) {
  return /^#([0-9a-fA-F]{6})$/.test(hex) ? `${hex}${alpha}` : hex;
}

export function storeName(tienda: any, diseno: any) {
  return diseno?.tonesLogoText || tienda?.nombreComercial || tienda?.razonSocial || tienda?.nombre || 'Tones';
}

/** Número de WhatsApp de la tienda. */
export function waLink(tienda: any, message = 'Hola, quiero más información sobre sus prendas') {
  const raw = String(tienda?.whatsappTienda || tienda?.whatsapp || tienda?.telefono || '').replace(/[^\d]/g, '');
  const phone = raw || '51999999999';
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/* ─────────────────────────── Imagen de producto ─────────────────────────── */

export function TnProductImage({ producto, imgClassName = '' }: { producto: any; imgClassName?: string }) {
  const img = producto?.imagenUrl || producto?.imagen || '';
  const [broken, setBroken] = useState(false);
  if (img && !broken) {
    return <img src={img} alt={producto?.descripcion || 'Prenda'} loading="lazy" onError={() => setBroken(true)} className={`h-full w-full object-cover ${imgClassName}`} />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ background: `linear-gradient(150deg, ${TN.sand}, ${TN.nude})` }}>
      <Icon icon="solar:t-shirt-linear" className="text-6xl" style={{ color: TN.taupe }} />
    </div>
  );
}

/* ─────────────── Swatches de color (decorativos, look boutique) ─────────── */

const SWATCHES = ['#463A31', '#8C7D6D', '#DBCFBC', '#C8B89E', '#A88F72', '#2A241F'];

export function TnSwatches({ seed }: { seed: number }) {
  const count = 3 + (seed % 3);
  return (
    <div className="mt-2.5 flex items-center gap-1.5">
      {SWATCHES.slice(0, count).map((c, i) => (
        <span key={i} className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: c }} />
      ))}
    </div>
  );
}

/* ──────────────────────────────── Product card ──────────────────────────── */

export function TnProductCard({
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
  const primary = tnPrimary(cp);
  const { toggleFavorito, isFavorito } = useFavoritosStore();
  const wish = isFavorito(Number(producto?.id), slug);
  const pricing = getProductPricing(producto);
  const toggleWish = () => toggleFavorito({
    id: Number(producto?.id),
    descripcion: producto?.descripcion || producto?.nombre || 'Prenda',
    precioUnitario: pricing.precioFinal,
    imagenUrl: producto?.imagenUrl || producto?.imagen || '',
    slug,
  });
  const seed = Number(producto?.id || 0);

  return (
    <motion.article
      variants={tnCard}
      initial="hidden"
      whileInView="show"
      viewport={tnViewport}
      whileHover={tnHover}
      layout
      className="group relative flex flex-col"
    >
      <button type="button" onClick={onClick} className="relative block aspect-[4/5] w-full overflow-hidden rounded-[20px]" style={{ backgroundColor: TN.sand }}>
        {pricing.enOferta && (
          <span className="absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white shadow-sm" style={{ backgroundColor: TN.cocoa }}>
            -{pricing.porcentajeDescuento}%
          </span>
        )}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); toggleWish(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); toggleWish(); } }}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-sm backdrop-blur transition-colors hover:text-neutral-900"
          title="Favorito"
        >
          <Icon icon={wish ? 'solar:heart-bold' : 'solar:heart-linear'} width={17} style={wish ? { color: primary } : undefined} />
        </span>
        <div className="h-full w-full transition-transform duration-[800ms] ease-out group-hover:scale-[1.05]">
          <TnProductImage producto={producto} />
        </div>
        <div className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => { e.stopPropagation(); onAddToCart?.({ ...producto, precioUnitario: pricing.precioFinal, precioRegular: pricing.precioRegular, enOferta: pricing.enOferta }); }}
            className="pointer-events-auto flex h-11 w-full items-center justify-center gap-2 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-lg"
            style={{ backgroundColor: TN.cocoa }}
          >
            <Icon icon="solar:bag-4-linear" width={15} /> Añadir
          </span>
        </div>
      </button>

      <div className="flex flex-1 flex-col pt-3.5">
        <button type="button" onClick={onClick} className="text-left">
          <h3 className="line-clamp-1 text-[14px] font-semibold" style={{ fontFamily: TN.display, color: TN.ink }}>{producto?.descripcion}</h3>
        </button>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[14px] font-bold" style={{ color: TN.cocoa }}>S/ {pricing.precioFinal.toFixed(2)}</span>
          {pricing.enOferta && <span className="text-xs font-medium text-neutral-400 line-through">S/ {pricing.precioRegular.toFixed(2)}</span>}
        </div>
        <TnSwatches seed={seed} />
      </div>
    </motion.article>
  );
}

/* ─────────────────────────────────── Header ─────────────────────────────── */

export function TnHeader({
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
  const primary = tnPrimary(cp);
  const name = storeName(tienda, diseno);
  const [openSearch, setOpenSearch] = useState(false);
  const [openFavs, setOpenFavs] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);
  const categories = allCategories.map((cat) => (typeof cat === 'string' ? cat : cat?.nombre)).filter(Boolean);
  const topCats = categories.slice(0, 4);
  const announcement = diseno?.tonesAnnouncement || 'Envío gratis en pedidos desde S/ 150   ·   Cambios sin complicaciones';
  const catHref = (c: string) => `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`;
  const goProduct = (id: any) => {
    if (slug === 'preview') { window.dispatchEvent(new CustomEvent('preview-nav', { detail: 'catalogo' })); return; }
    window.location.href = `/tienda/${slug}/producto/${id}`;
  };

  return (
    <>
      {/* Barra superior de anuncio */}
      <div className="w-full text-center" style={{ backgroundColor: TN.cocoa }}>
        <div className="mx-auto flex max-w-[1240px] items-center justify-center gap-3 px-6 py-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/80">
          <span className="line-clamp-1">{announcement}</span>
        </div>
      </div>

      <motion.header
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: tnEase }}
        className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{ borderColor: TN.line, backgroundColor: withAlpha(TN.cream, 'e6') }}
      >
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center gap-3 px-4 md:px-6">
          <button
            type="button"
            onClick={() => setOpenMenu((v) => !v)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-800 transition-colors hover:bg-black/5 lg:hidden"
            aria-label="Menú"
          >
            <Icon icon={openMenu ? 'solar:close-square-linear' : 'solar:hamburger-menu-linear'} width={22} />
          </button>

          <a href={`/tienda/${slug}`} className="flex shrink-0 items-center">
            {tienda?.logo ? (
              <img src={tienda.logo} alt={name} className="h-9 object-contain" />
            ) : (
              <span className="text-[30px] leading-none tracking-[-0.02em]" style={{ fontFamily: TN.brand, fontWeight: 700, color: TN.ink }}>{name.toLowerCase()}</span>
            )}
          </a>

          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            <a href={`/tienda/${slug}/catalogo?sort=new`} className="rounded-full px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-700 transition-colors hover:text-neutral-950">Novedades</a>
            {topCats.map((c) => (
              <a key={c} href={catHref(c)} className="rounded-full px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-700 transition-colors hover:text-neutral-950">{c}</a>
            ))}
            <a href={`/tienda/${slug}/catalogo`} className="rounded-full px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-700 transition-colors hover:text-neutral-950">Tienda</a>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            {openSearch ? (
              <form
                onSubmit={(e) => onSearchSubmit?.(e, searchQuery)}
                className="hidden items-center gap-2 rounded-full border bg-white/70 px-4 py-2 md:flex"
                style={{ borderColor: TN.line }}
              >
                <Icon icon="solar:magnifer-linear" width={16} className="text-neutral-400" />
                <input
                  autoFocus
                  value={searchQuery || ''}
                  onChange={(e) => setSearchQuery?.(e.target.value)}
                  placeholder={diseno?.tonesSearchPlaceholder || 'Buscar prendas...'}
                  className="w-44 border-0 bg-transparent p-0 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:ring-0"
                />
              </form>
            ) : (
              <button type="button" onClick={() => setOpenSearch(true)} className="flex h-11 w-11 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-black/5" title="Buscar">
                <Icon icon="solar:magnifer-linear" width={21} />
              </button>
            )}
            <a href={`/tienda/${slug}/seguimiento`} className="hidden h-11 w-11 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-black/5 sm:flex" title="Seguir pedido">
              <Icon icon="solar:user-linear" width={21} />
            </a>
            <button type="button" onClick={() => setOpenFavs(true)} className="relative flex h-11 w-11 items-center justify-center rounded-full text-neutral-800 transition-colors hover:bg-black/5" title="Favoritos">
              <Icon icon="solar:heart-linear" width={22} />
              {favoritos.length > 0 && (
                <span className="absolute right-1 top-1 flex items-center justify-center rounded-full px-1 text-[10px] font-bold text-white" style={{ backgroundColor: primary, height: 18, minWidth: 18 }}>
                  {favoritos.length}
                </span>
              )}
            </button>
            <button type="button" onClick={onOpenCart} className="relative flex h-11 w-11 items-center justify-center rounded-full text-neutral-800 transition-colors hover:bg-black/5" title="Carrito">
              <Icon icon="solar:bag-4-linear" width={22} />
              {carritoSize > 0 && (
                <span className="absolute right-1 top-1 flex items-center justify-center rounded-full px-1 text-[10px] font-bold text-white" style={{ backgroundColor: primary, height: 18, minWidth: 18 }}>
                  {carritoSize}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        <AnimatePresence>
          {openMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: tnEase }}
              className="overflow-hidden border-t bg-white/95 lg:hidden"
              style={{ borderColor: TN.line }}
            >
              <div className="mx-auto max-w-[1240px] px-4 py-4">
                <form onSubmit={(e) => { onSearchSubmit?.(e, searchQuery); setOpenMenu(false); }} className="mb-3 flex items-center gap-2 rounded-full border px-4 py-2.5" style={{ borderColor: TN.line }}>
                  <Icon icon="solar:magnifer-linear" width={17} className="text-neutral-400" />
                  <input
                    value={searchQuery || ''}
                    onChange={(e) => setSearchQuery?.(e.target.value)}
                    placeholder={diseno?.tonesSearchPlaceholder || 'Buscar prendas...'}
                    className="w-full border-0 bg-transparent p-0 text-sm outline-none placeholder:text-neutral-400 focus:ring-0"
                  />
                </form>
                <div className="flex flex-col">
                  <a href={`/tienda/${slug}/catalogo`} className="border-b py-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-neutral-800" style={{ borderColor: TN.line }}>Tienda</a>
                  {topCats.map((c) => (
                    <a key={c} href={catHref(c)} className="border-b py-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-neutral-700" style={{ borderColor: TN.line }}>{c}</a>
                  ))}
                  <a href={`/tienda/${slug}/contacto`} className="py-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-neutral-700">Contacto</a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <TnFavoritesModal
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

export function TnWhatsAppFab({ tienda }: { tienda: any }) {
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

export function TnFooter({ tienda, slug, diseno, cp, categories = [] }: { tienda: any; slug: string; diseno?: any; cp: string; categories?: any[] }) {
  const primary = tnPrimary(cp);
  const name = storeName(tienda, diseno);
  const cats = categories.map((cat) => (typeof cat === 'string' ? cat : cat?.nombre)).filter(Boolean).slice(0, 5);

  return (
    <footer className="text-white" style={{ backgroundColor: TN.espresso }}>
      <div className="mx-auto grid max-w-[1240px] gap-10 px-6 py-16 md:grid-cols-[1.5fr_1fr_1fr_1.4fr]">
        <div>
          <h3 className="text-5xl tracking-[-0.02em]" style={{ fontFamily: TN.brand, fontWeight: 700 }}>{name.toLowerCase()}</h3>
          <p className="mt-5 max-w-xs text-sm leading-7 text-white/55">
            {diseno?.tonesFooterText || tienda?.descripcionTienda || 'Ropa suave y cómoda para los más pequeños. Básicos cálidos, pensados para crecer con ellos.'}
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
          <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">Tienda</h4>
          <div className="space-y-3 text-sm text-white/60">
            {cats.length ? (
              cats.map((cat) => (
                <a key={cat} href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(cat)}`} className="block transition-colors hover:text-white">{cat}</a>
              ))
            ) : (
              <a href={`/tienda/${slug}/catalogo`} className="block transition-colors hover:text-white">Ver todo</a>
            )}
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">Ayuda</h4>
          <div className="space-y-3 text-sm text-white/60">
            <a href={`/tienda/${slug}/seguimiento`} className="block transition-colors hover:text-white">Seguir mi pedido</a>
            <a href={`/tienda/${slug}/catalogo`} className="block transition-colors hover:text-white">Tienda completa</a>
            <a href={`/tienda/${slug}/contacto`} className="block transition-colors hover:text-white">Contacto</a>
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">{diseno?.tonesFooterNewsletterTitle || 'Suscríbete'}</h4>
          <p className="mb-4 text-sm text-white/55">{diseno?.tonesFooterNewsletterText || 'Novedades y ofertas exclusivas para tu bandeja.'}</p>
          <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 rounded-full bg-white/10 p-1.5">
            <input type="email" placeholder="Tu correo" className="h-9 flex-1 border-0 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/45 focus:ring-0" />
            <button type="submit" className="h-9 shrink-0 rounded-full px-5 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-900" style={{ backgroundColor: '#fff' }}>Enviar</button>
          </form>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ backgroundColor: withAlpha(primary, '33'), color: '#fff' }}>
            <Icon icon="solar:shield-check-bold" width={14} /> Compra 100% segura
          </span>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-5 text-center text-xs text-white/40">© 2026 {name}. Powered by Falconext.</div>
    </footer>
  );
}

/* ─────────────────────────── Modal / Drawer carrito ─────────────────────── */

export function TnCartModal({
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
  const primary = tnPrimary(cp);
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
            style={{ backgroundColor: TN.cream, borderColor: TN.line }}
          >
            <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: TN.line }}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: TN.sand, color: TN.cocoa }}>
                  <Icon icon="solar:bag-4-linear" width={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Tu selección</p>
                  <h3 className="text-xl font-bold lowercase leading-none" style={{ fontFamily: TN.brand, color: TN.ink }}>carrito</h3>
                </div>
              </div>
              <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-black/5" title="Cerrar">
                <Icon icon="solar:close-circle-linear" width={22} />
              </button>
            </div>

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
                    <div key={itemId} className="flex gap-4 border-b py-5" style={{ borderColor: TN.line }}>
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl" style={{ backgroundColor: TN.sand }}>
                        <TnProductImage producto={item} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium leading-5" style={{ color: TN.ink }}>{item.descripcion}</p>
                        <p className="mt-1 text-sm font-bold" style={{ color: TN.cocoa }}>{money(price * qty)}</p>
                        <div className="mt-2.5 flex items-center justify-between gap-3">
                          <div className="flex h-9 items-center rounded-full bg-white ring-1" style={{ ['--tw-ring-color' as any]: TN.line }}>
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

            {carrito.length > 0 && (
              <div className="border-t px-6 py-5" style={{ borderColor: TN.line }}>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">Total</span>
                  <span className="text-2xl font-bold" style={{ fontFamily: TN.brand, color: TN.cocoa }}>{money(total)}</span>
                </div>
                <button type="button" onClick={onCheckout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-4 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-lg" style={{ backgroundColor: TN.cocoa }}>
                  Finalizar compra <Icon icon="solar:arrow-right-linear" width={16} />
                </button>
                <button type="button" onClick={cotizar} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border py-3.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors" style={{ borderColor: TN.lineStrong, color: TN.cocoa }}>
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

export function TnFavoritesModal({
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
  const primary = tnPrimary(cp);
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
            style={{ backgroundColor: TN.cream, borderColor: TN.line }}
          >
            <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: TN.line }}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: withAlpha(primary, '1f'), color: primary }}>
                  <Icon icon="solar:heart-bold" width={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Tu lista de deseos</p>
                  <h3 className="text-xl font-bold lowercase leading-none" style={{ fontFamily: TN.brand, color: TN.ink }}>favoritos</h3>
                </div>
              </div>
              <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-black/5" title="Cerrar">
                <Icon icon="solar:close-circle-linear" width={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              {favoritos.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                  <Icon icon="solar:heart-linear" className="text-5xl text-neutral-300" />
                  <p className="mt-4 text-sm font-medium text-neutral-500">Aún no tienes favoritos.</p>
                  <p className="mt-1 text-xs text-neutral-400">Toca el corazón en una prenda para guardarla aquí.</p>
                </div>
              ) : (
                favoritos.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b py-5" style={{ borderColor: TN.line }}>
                    <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl" style={{ backgroundColor: TN.sand }}>
                      <TnProductImage producto={item} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="block text-left">
                        <p className="line-clamp-2 text-sm font-medium leading-5" style={{ color: TN.ink }}>{item.descripcion}</p>
                      </button>
                      <p className="mt-1 text-sm font-bold" style={{ color: TN.cocoa }}>{money(item.precioUnitario)}</p>
                      <div className="mt-2.5 flex items-center gap-3">
                        <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white" style={{ backgroundColor: TN.cocoa }}>
                          Ver prenda
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

            <div className="border-t px-6 py-5" style={{ borderColor: TN.line }}>
              <a href={`/tienda/${slug}/catalogo`} className="flex w-full items-center justify-center gap-2 rounded-full border py-3.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors" style={{ borderColor: TN.lineStrong, color: TN.cocoa }}>
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
