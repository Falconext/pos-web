import type React from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { getProductPricing } from '@/templates/shared/pricing';
import { useFavoritosStore } from '@/zustand/favoritos';
import { hdCard, hdEase, hdHover, hdViewport } from './motion';

/**
 * Identidad visual de la plantilla "Hoodie" (ropa urbana / streetwear).
 *
 * Estética editorial tipo magazine: fondo beige/greige cálido, tipografía
 * display grotesca de alto peso (Archivo 900) para el logotipo gigante y los
 * titulares, negro carbón para los CTA y detalles minimalistas de boutique.
 * `cp` (colorPrimario del diseño) es el color de ACENTO configurable; los CTA
 * principales usan `ink` (negro) para mantener el look de alta gama.
 */
export const HD = {
  ink: '#15120E',
  charcoal: '#231F19',
  cream: '#ECE6DB',
  panel: '#F6F2EA',
  sand: '#E3DACC',
  nude: '#D9CEBC',
  taupe: '#8A7F6E',
  line: 'rgba(21,18,14,0.10)',
  lineStrong: 'rgba(21,18,14,0.16)',
  display: "'Archivo', 'Oswald', ui-sans-serif, system-ui, sans-serif",
} as const;

export const hdPrimary = (cp?: string) => cp || HD.ink;
export const hdFont = (diseno?: any) => `'${diseno?.tipografia || 'Inter'}', ui-sans-serif, system-ui, sans-serif`;

/** Añade transparencia hex (#RRGGBB + alpha 00-ff) de forma segura. */
export function withAlpha(hex: string, alpha: string) {
  return /^#([0-9a-fA-F]{6})$/.test(hex) ? `${hex}${alpha}` : hex;
}

export function storeName(tienda: any, diseno: any) {
  return diseno?.hoodieLogoText || tienda?.nombreComercial || tienda?.razonSocial || tienda?.nombre || 'Hoodie';
}

/** Número de WhatsApp de la tienda. */
export function waLink(tienda: any, message = 'Hola, quiero más información sobre sus prendas') {
  const raw = String(tienda?.whatsappTienda || tienda?.whatsapp || tienda?.telefono || '').replace(/[^\d]/g, '');
  const phone = raw || '51999999999';
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/** Rating pseudo-determinista (4.5–4.9) cuando el producto no trae valoración real. */
export function hdRating(producto: any) {
  const real = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  if (real > 0) return Math.min(5, real);
  const seed = Number(producto?.id || 0);
  return 4.5 + ((seed * 7) % 5) / 10; // 4.5..4.9
}

/* ─────────────────────────── Imagen de producto ─────────────────────────── */

export function HdProductImage({ producto, imgClassName = '' }: { producto: any; imgClassName?: string }) {
  const img = producto?.imagenUrl || producto?.imagen || '';
  const [broken, setBroken] = useState(false);
  if (img && !broken) {
    return <img src={img} alt={producto?.descripcion || 'Prenda'} loading="lazy" onError={() => setBroken(true)} className={`h-full w-full object-cover ${imgClassName}`} />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ background: `linear-gradient(150deg, ${HD.sand}, ${HD.nude})` }}>
      <Icon icon="solar:hanger-2-linear" className="text-6xl" style={{ color: HD.taupe }} />
    </div>
  );
}

/* ──────────────────────────────── Product card ──────────────────────────── */

export function HdProductCard({
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
  const primary = hdPrimary(cp);
  const { toggleFavorito, isFavorito } = useFavoritosStore();
  const wish = isFavorito(Number(producto?.id), slug);
  const pricing = getProductPricing(producto);
  const rating = hdRating(producto).toFixed(1);
  const toggleWish = () => toggleFavorito({
    id: Number(producto?.id),
    descripcion: producto?.descripcion || producto?.nombre || 'Prenda',
    precioUnitario: pricing.precioFinal,
    imagenUrl: producto?.imagenUrl || producto?.imagen || '',
    slug,
  });
  const marca = typeof producto?.marca === 'object' ? producto?.marca?.nombre : producto?.marca;

  return (
    <motion.article
      variants={hdCard}
      initial="hidden"
      whileInView="show"
      viewport={hdViewport}
      whileHover={hdHover}
      layout
      className="group relative flex flex-col overflow-hidden rounded-[22px] border p-3 transition-colors"
      style={{ backgroundColor: HD.panel, borderColor: HD.line }}
    >
      <button type="button" onClick={onClick} className="relative block aspect-square w-full overflow-hidden rounded-[16px]" style={{ backgroundColor: HD.sand }}>
        {pricing.enOferta && (
          <span className="absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-sm" style={{ backgroundColor: HD.ink }}>
            -{pricing.porcentajeDescuento}%
          </span>
        )}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); toggleWish(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); toggleWish(); } }}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-sm backdrop-blur transition-colors hover:text-neutral-950"
          title="Favorito"
        >
          <Icon icon={wish ? 'solar:heart-bold' : 'solar:heart-linear'} width={17} style={wish ? { color: primary } : undefined} />
        </span>
        <div className="h-full w-full transition-transform duration-[800ms] ease-out group-hover:scale-[1.06]">
          <HdProductImage producto={producto} />
        </div>
        <div className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => { e.stopPropagation(); onAddToCart?.({ ...producto, precioUnitario: pricing.precioFinal, precioRegular: pricing.precioRegular, enOferta: pricing.enOferta }); }}
            className="pointer-events-auto flex h-11 w-full items-center justify-center gap-2 rounded-full text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-lg"
            style={{ backgroundColor: HD.ink }}
          >
            <Icon icon="solar:bag-4-linear" width={15} /> Añadir
          </span>
        </div>
      </button>

      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3.5">
        {marca && <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: HD.taupe }}>{marca}</p>}
        <button type="button" onClick={onClick} className="text-left">
          <h3 className="line-clamp-1 text-[13px] font-semibold uppercase tracking-[0.03em]" style={{ color: HD.ink }}>{producto?.descripcion}</h3>
        </button>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-bold" style={{ color: HD.ink }}>S/ {pricing.precioFinal.toFixed(2)}</span>
            {pricing.enOferta && <span className="text-xs font-medium text-neutral-400 line-through">S/ {pricing.precioRegular.toFixed(2)}</span>}
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: HD.ink }}>
            {rating} <Icon icon="solar:star-bold" width={12} style={{ color: primary }} />
          </span>
        </div>
      </div>
    </motion.article>
  );
}

/* ─────────────────────────────────── Header ─────────────────────────────── */

export function HdHeader({
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
  const primary = hdPrimary(cp);
  const name = storeName(tienda, diseno);
  const [openFavs, setOpenFavs] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);
  const categories = allCategories.map((cat) => (typeof cat === 'string' ? cat : cat?.nombre)).filter(Boolean);
  const topCats = categories.slice(0, 4);
  const announcement = diseno?.hoodieAnnouncement || 'Envío gratis en pedidos desde S/ 150   ·   -10% en tu primera compra con el código BIENVENIDO';
  const catHref = (c: string) => `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`;
  const goProduct = (id: any) => {
    if (slug === 'preview') { window.dispatchEvent(new CustomEvent('preview-nav', { detail: 'catalogo' })); return; }
    window.location.href = `/tienda/${slug}/producto/${id}`;
  };

  return (
    <>
      {/* Barra superior de anuncio */}
      <div className="w-full text-center" style={{ backgroundColor: HD.ink }}>
        <div className="mx-auto flex max-w-[1240px] items-center justify-center gap-3 px-6 py-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/75">
          <span className="line-clamp-1">{announcement}</span>
        </div>
      </div>

      <motion.header
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: hdEase }}
        className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{ borderColor: HD.line, backgroundColor: withAlpha(HD.cream, 'e6') }}
      >
        <div className="mx-auto max-w-[1240px] px-4 md:px-6">
          {/* Fila principal */}
          <div className="flex h-[68px] items-center gap-3">
            <button
              type="button"
              onClick={() => setOpenMenu((v) => !v)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-white/70 text-neutral-800 transition-colors hover:bg-white lg:hidden"
              style={{ borderColor: HD.line }}
              aria-label="Menú"
            >
              <Icon icon={openMenu ? 'solar:close-square-linear' : 'solar:hamburger-menu-linear'} width={22} />
            </button>

            {/* Nav izquierda (desktop) */}
            <nav className="hidden items-center gap-1 lg:flex">
              <a href={`/tienda/${slug}/catalogo`} className="rounded-full px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-700 transition-colors hover:text-neutral-950">Tienda</a>
              <a href={`/tienda/${slug}/catalogo?sort=new`} className="rounded-full px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-700 transition-colors hover:text-neutral-950">Novedades</a>
            </nav>

            {/* Logotipo centrado */}
            <a href={`/tienda/${slug}`} className="mx-auto flex items-center">
              {tienda?.logo ? (
                <img src={tienda.logo} alt={name} className="h-9 object-contain md:h-10" />
              ) : (
                <span className="text-[26px] leading-none tracking-[-0.04em] md:text-[32px]" style={{ fontFamily: HD.display, fontWeight: 900, color: HD.ink }}>
                  {name.toUpperCase()}
                </span>
              )}
            </a>

            {/* Acciones derecha */}
            <div className="flex items-center gap-1">
              <a href={`/tienda/${slug}/seguimiento`} className="hidden h-11 w-11 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-black/5 sm:flex" title="Seguir pedido">
                <Icon icon="solar:user-linear" width={21} />
              </a>
              <button type="button" onClick={() => setOpenFavs(true)} className="relative flex h-11 w-11 items-center justify-center rounded-full text-neutral-800 transition-colors hover:bg-black/5" title="Favoritos">
                <Icon icon="solar:heart-linear" width={22} />
                {favoritos.length > 0 && (
                  <span className="absolute right-1 top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white" style={{ backgroundColor: primary, height: 18, minWidth: 18 }}>
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

          {/* Fila secundaria — pills individuales (desktop) */}
          <div className="hidden items-center gap-2.5 pb-3 lg:flex">
            <a href={`/tienda/${slug}/catalogo`} className="flex items-center gap-1.5 rounded-full border bg-white/60 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-700 transition-colors hover:bg-white" style={{ borderColor: HD.line }}>
              <Icon icon="solar:widget-2-linear" width={14} /> Categorías <Icon icon="solar:alt-arrow-down-linear" width={13} />
            </a>
            <a href={`/tienda/${slug}/catalogo?sort=new`} className="flex items-center gap-1.5 rounded-full border bg-white/60 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-700 transition-colors hover:bg-white" style={{ borderColor: HD.line }}>
              Novedades <Icon icon="solar:alt-arrow-down-linear" width={13} />
            </a>
            <form
              onSubmit={(e) => onSearchSubmit?.(e, searchQuery)}
              className="flex w-64 items-center gap-2 rounded-full border bg-white/60 px-4 py-2.5"
              style={{ borderColor: HD.line }}
            >
              <input
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery?.(e.target.value)}
                placeholder={diseno?.hoodieSearchPlaceholder || 'Buscar...'}
                className="w-full border-0 bg-transparent p-0 text-[13px] text-neutral-800 outline-none placeholder:text-neutral-400 focus:ring-0"
              />
              <button type="submit" aria-label="Buscar" className="text-neutral-500 transition-colors hover:text-neutral-900"><Icon icon="solar:magnifer-linear" width={16} /></button>
            </form>
            <div className="ml-auto flex items-center gap-2">
              {topCats.map((c) => (
                <a key={c} href={catHref(c)} className="rounded-full border bg-white/60 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-700 transition-colors hover:bg-neutral-900 hover:text-white" style={{ borderColor: HD.line }}>{c}</a>
              ))}
              <a href={`/tienda/${slug}/catalogo?sort=discount`} className="rounded-full border px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-transform hover:-translate-y-0.5" style={{ backgroundColor: HD.ink, borderColor: HD.ink }}>Ofertas</a>
            </div>
          </div>
        </div>

        {/* Menú móvil */}
        <AnimatePresence>
          {openMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: hdEase }}
              className="overflow-hidden border-t bg-white/95 lg:hidden"
              style={{ borderColor: HD.line }}
            >
              <div className="mx-auto max-w-[1240px] px-4 py-4">
                <form onSubmit={(e) => { onSearchSubmit?.(e, searchQuery); setOpenMenu(false); }} className="mb-3 flex items-center gap-2 rounded-full border px-4 py-2.5" style={{ borderColor: HD.line }}>
                  <Icon icon="solar:magnifer-linear" width={17} className="text-neutral-400" />
                  <input
                    value={searchQuery || ''}
                    onChange={(e) => setSearchQuery?.(e.target.value)}
                    placeholder={diseno?.hoodieSearchPlaceholder || 'Buscar prendas...'}
                    className="w-full border-0 bg-transparent p-0 text-sm outline-none placeholder:text-neutral-400 focus:ring-0"
                  />
                </form>
                <div className="flex flex-col">
                  <a href={`/tienda/${slug}/catalogo`} className="border-b py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-neutral-800" style={{ borderColor: HD.line }}>Tienda</a>
                  {topCats.map((c) => (
                    <a key={c} href={catHref(c)} className="border-b py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-neutral-700" style={{ borderColor: HD.line }}>{c}</a>
                  ))}
                  <a href={`/tienda/${slug}/contacto`} className="py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-neutral-700">Contacto</a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <HdFavoritesModal
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

export function HdWhatsAppFab({ tienda }: { tienda: any }) {
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

export function HdFooter({ tienda, slug, diseno, cp, categories = [] }: { tienda: any; slug: string; diseno?: any; cp: string; categories?: any[] }) {
  const primary = hdPrimary(cp);
  const name = storeName(tienda, diseno);
  const cats = categories.map((cat) => (typeof cat === 'string' ? cat : cat?.nombre)).filter(Boolean).slice(0, 5);

  return (
    <footer className="text-white" style={{ backgroundColor: HD.ink }}>
      <div className="mx-auto grid max-w-[1240px] gap-10 px-6 py-16 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <h3 className="text-4xl tracking-[-0.03em]" style={{ fontFamily: HD.display, fontWeight: 900 }}>{name.toUpperCase()}</h3>
          <p className="mt-5 max-w-sm text-sm leading-7 text-white/55">
            {diseno?.hoodieFooterText || tienda?.descripcionTienda || 'Diseño minimalista, máxima comodidad. Ropa urbana premium hecha para tu día a día.'}
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
          <div className="space-y-3 text-sm text-white/55">
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
          <div className="space-y-3 text-sm text-white/55">
            <a href={`/tienda/${slug}/seguimiento`} className="block transition-colors hover:text-white">Seguir mi pedido</a>
            <a href={`/tienda/${slug}/catalogo`} className="block transition-colors hover:text-white">Tienda completa</a>
            <a href={`/tienda/${slug}/contacto`} className="block transition-colors hover:text-white">Contacto</a>
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">Atención</h4>
          <p className="text-sm text-white/55">{diseno?.hoodieFooterPhone || tienda?.whatsappTienda || tienda?.telefono || '+51 999 999 999'}</p>
          <p className="mt-3 text-sm text-white/55">{diseno?.hoodieFooterEmail || tienda?.email || tienda?.correo || 'hola@hoodie.pe'}</p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ backgroundColor: withAlpha(primary, '26'), color: '#fff' }}>
            <Icon icon="solar:shield-check-bold" width={14} /> Compra 100% segura
          </span>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-5 text-center text-xs text-white/40">© 2026 {name}. Powered by Falconext.</div>
    </footer>
  );
}

/* ─────────────────────────── Modal / Drawer carrito ─────────────────────── */

export function HdCartModal({
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
  const primary = hdPrimary(cp);
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
            style={{ backgroundColor: HD.cream, borderColor: HD.line }}
          >
            <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: HD.line }}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: HD.sand, color: HD.ink }}>
                  <Icon icon="solar:bag-4-linear" width={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Tu selección</p>
                  <h3 className="text-lg font-bold uppercase leading-none tracking-[0.02em]" style={{ fontFamily: HD.display, color: HD.ink }}>Carrito</h3>
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
                    <div key={itemId} className="flex gap-4 border-b py-5" style={{ borderColor: HD.line }}>
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl" style={{ backgroundColor: HD.sand }}>
                        <HdProductImage producto={item} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium leading-5" style={{ color: HD.ink }}>{item.descripcion}</p>
                        <p className="mt-1 text-sm font-bold" style={{ color: HD.ink }}>{money(price * qty)}</p>
                        <div className="mt-2.5 flex items-center justify-between gap-3">
                          <div className="flex h-9 items-center rounded-full bg-white ring-1" style={{ ['--tw-ring-color' as any]: HD.line }}>
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
              <div className="border-t px-6 py-5" style={{ borderColor: HD.line }}>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">Total</span>
                  <span className="text-2xl font-bold" style={{ fontFamily: HD.display, color: HD.ink }}>{money(total)}</span>
                </div>
                <button type="button" onClick={onCheckout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-4 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-lg" style={{ backgroundColor: HD.ink }}>
                  Finalizar compra <Icon icon="solar:arrow-right-linear" width={16} />
                </button>
                <button type="button" onClick={cotizar} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border py-3.5 text-xs font-bold uppercase tracking-[0.14em] transition-colors" style={{ borderColor: HD.lineStrong, color: HD.ink }}>
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

export function HdFavoritesModal({
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
  const primary = hdPrimary(cp);
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
            style={{ backgroundColor: HD.cream, borderColor: HD.line }}
          >
            <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: HD.line }}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: withAlpha(primary, '1f'), color: primary }}>
                  <Icon icon="solar:heart-bold" width={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Tu lista de deseos</p>
                  <h3 className="text-lg font-bold uppercase leading-none tracking-[0.02em]" style={{ fontFamily: HD.display, color: HD.ink }}>Favoritos</h3>
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
                  <div key={item.id} className="flex gap-4 border-b py-5" style={{ borderColor: HD.line }}>
                    <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl" style={{ backgroundColor: HD.sand }}>
                      <HdProductImage producto={item} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="block text-left">
                        <p className="line-clamp-2 text-sm font-medium leading-5" style={{ color: HD.ink }}>{item.descripcion}</p>
                      </button>
                      <p className="mt-1 text-sm font-bold" style={{ color: HD.ink }}>{money(item.precioUnitario)}</p>
                      <div className="mt-2.5 flex items-center gap-3">
                        <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white" style={{ backgroundColor: HD.ink }}>
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

            <div className="border-t px-6 py-5" style={{ borderColor: HD.line }}>
              <a href={`/tienda/${slug}/catalogo`} className="flex w-full items-center justify-center gap-2 rounded-full border py-3.5 text-xs font-bold uppercase tracking-[0.14em] transition-colors" style={{ borderColor: HD.lineStrong, color: HD.ink }}>
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
