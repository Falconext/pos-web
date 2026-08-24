import type React from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { getProductPricing } from '@/templates/shared/pricing';
import { useFavoritosStore } from '@/zustand/favoritos';
import { getFashionColors, getFashionColorGallery } from '@/templates/urbano/fashionVariants';
import { minEase, minSection, minViewport } from './motion';

/**
 * Identidad visual de la plantilla "Norda" (moda & calzado minimalista, estilo Everlane).
 *
 * Estética monocroma y editorial: mucho blanco, tipografía sans limpia, líneas finas,
 * enlaces subrayados, botones negros rectangulares y grillas de producto sobrias.
 * `cp` (colorPrimario del diseño) actúa como acento configurable; por defecto es el negro
 * de la marca para conservar el look minimalista.
 */
export const MIN = {
  ink: '#171614',
  soft: '#5A5854',
  muted: '#8C8A85',
  cream: '#F6F4F0',
  stone: '#EDEAE4',
  paper: '#FFFFFF',
  line: '#E4E1DB',
  sale: '#B23A2E',
  sans: "ui-sans-serif, system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
} as const;

export const minPrimary = (cp?: string) => cp || MIN.ink;
export const minFont = (diseno?: any) => `'${diseno?.tipografia || 'Inter'}', ${MIN.sans}`;

/** Añade transparencia hex (#RRGGBB + alpha 00-ff) de forma segura. */
export function withAlpha(hex: string, alpha: string) {
  return /^#([0-9a-fA-F]{6})$/.test(hex) ? `${hex}${alpha}` : hex;
}

export function storeName(tienda: any, diseno: any) {
  return diseno?.modaMinimalLogoText || tienda?.nombreComercial || tienda?.razonSocial || tienda?.nombre || 'Norda';
}

/** Número de WhatsApp de la tienda. */
export function waLink(tienda: any, message = 'Hola, quiero más información sobre sus prendas') {
  const raw = String(tienda?.whatsappTienda || tienda?.whatsapp || tienda?.telefono || '').replace(/[^\d]/g, '');
  const phone = raw || '51999999999';
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/* ─────────────────────────── Imagen de producto ─────────────────────────── */

export function MinProductImage({ producto, imgClassName = '' }: { producto: any; imgClassName?: string }) {
  const img = producto?.imagenUrl || producto?.imagen || '';
  const [broken, setBroken] = useState(false);
  if (img && !broken) {
    return <img src={img} alt={producto?.descripcion || 'Producto'} loading="lazy" onError={() => setBroken(true)} className={`h-full w-full object-cover ${imgClassName}`} />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: MIN.stone }}>
      <Icon icon="solar:t-shirt-linear" className="text-6xl" style={{ color: MIN.muted }} />
    </div>
  );
}

/* ──────────────────────────────── Product card ──────────────────────────── */

export function MinProductCard({
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
  const primary = minPrimary(cp);
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
  const mainImg = producto?.imagenUrl || producto?.imagen || '';
  const extra = Array.isArray(producto?.imagenesExtra) ? producto.imagenesExtra.filter(Boolean) : [];
  // Colores y fotos REALES del producto (variantes / galeriaPorColor).
  const colorOptions = getFashionColors(producto);
  const firstColor = colorOptions[0]?.name;
  const colorGallery = firstColor ? getFashionColorGallery(producto, firstColor) : [];
  // Segunda imagen (hover): primera foto guardada distinta a la principal.
  const hoverImg = [...extra, ...colorGallery].filter(Boolean).find((u: string) => u && u !== mainImg) || null;
  const swatches = colorOptions.slice(0, 5);

  return (
    <div className="group relative flex flex-col">
      <button type="button" onClick={onClick} className="relative block aspect-[3/4] w-full overflow-hidden" style={{ backgroundColor: MIN.stone }}>
        {pricing.enOferta && (
          <span className="absolute left-3 top-3 z-10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ backgroundColor: MIN.paper, color: MIN.sale }}>
            Oferta
          </span>
        )}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); toggleWish(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); toggleWish(); } }}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/80 text-neutral-700 opacity-0 backdrop-blur transition-opacity hover:text-neutral-900 group-hover:opacity-100"
          title="Favorito"
        >
          <Icon icon={wish ? 'solar:heart-bold' : 'solar:heart-linear'} width={16} style={wish ? { color: primary } : undefined} />
        </span>
        <MinProductImage producto={producto} imgClassName="transition-opacity duration-500 group-hover:opacity-0" />
        {hoverImg && (
          <img src={hoverImg} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 px-3 pb-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => { e.stopPropagation(); onAddToCart?.({ ...producto, precioUnitario: pricing.precioFinal, precioRegular: pricing.precioRegular, enOferta: pricing.enOferta }); }}
            className="pointer-events-auto flex h-10 w-full items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white"
            style={{ backgroundColor: MIN.ink }}
          >
            Añadir al carrito
          </span>
        </div>
      </button>

      <div className="flex flex-1 flex-col pt-3">
        {marca && <p className="mb-0.5 text-[10px] font-medium uppercase tracking-[0.18em]" style={{ color: MIN.muted }}>{marca}</p>}
        <button type="button" onClick={onClick} className="text-left">
          <h3 className="line-clamp-1 text-[13px] font-medium" style={{ color: MIN.ink }}>{producto?.descripcion}</h3>
        </button>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[13px]" style={{ color: pricing.enOferta ? MIN.sale : MIN.ink }}>S/ {pricing.precioFinal.toFixed(2)}</span>
          {pricing.enOferta && <span className="text-xs text-neutral-400 line-through">S/ {pricing.precioRegular.toFixed(2)}</span>}
        </div>
        {swatches.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            {swatches.map((c, i) => (
              <span key={i} className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: c.hex }} title={c.name} />
            ))}
            <span className="ml-1 text-[10px] uppercase tracking-[0.08em]" style={{ color: MIN.muted }}>
              {colorOptions.length} color{colorOptions.length === 1 ? '' : 'es'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────── Header ─────────────────────────────── */

export function MinHeader({
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
  const primary = minPrimary(cp);
  const name = storeName(tienda, diseno);
  const [openSearch, setOpenSearch] = useState(false);
  const [openFavs, setOpenFavs] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);
  const cats = allCategories.map((cat) => (typeof cat === 'string' ? cat : cat?.nombre)).filter(Boolean).slice(0, 4);
  const announcement = diseno?.modaMinimalAnnouncement || 'Envío gratis en pedidos desde S/ 199';

  const goProduct = (id: any) => {
    if (slug === 'preview') { window.dispatchEvent(new CustomEvent('preview-nav', { detail: 'catalogo' })); return; }
    window.location.href = `/tienda/${slug}/producto/${id}`;
  };
  const navGo = (path: string, kind: 'catalogo' | 'contacto') => {
    if (slug === 'preview') { window.dispatchEvent(new CustomEvent('preview-nav', { detail: kind })); return; }
    window.location.href = path;
  };

  const NAV = [
    { label: diseno?.modaMinimalNav1 || 'Novedades', path: `/tienda/${slug}/catalogo`, kind: 'catalogo' as const },
    { label: diseno?.modaMinimalNav2 || 'Ropa', path: `/tienda/${slug}/catalogo`, kind: 'catalogo' as const },
    { label: diseno?.modaMinimalNav3 || 'Calzado', path: `/tienda/${slug}/catalogo`, kind: 'catalogo' as const },
    { label: diseno?.modaMinimalNav4 || 'Colección', path: `/tienda/${slug}/catalogo`, kind: 'catalogo' as const },
    { label: diseno?.modaMinimalNav5 || 'Nosotros', path: `/tienda/${slug}/contacto`, kind: 'contacto' as const },
  ];

  return (
    <>
      {announcement && (
        <div className="w-full text-center" style={{ backgroundColor: MIN.ink }}>
          <div className="mx-auto max-w-7xl px-6 py-2 text-[11px] font-medium tracking-[0.08em] text-white/90">{announcement}</div>
        </div>
      )}

      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: minEase }}
        className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur"
        style={{ borderColor: MIN.line }}
      >
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-5 md:px-8">
          {/* Nav izquierda */}
          <nav className="hidden items-center gap-6 lg:flex">
            {NAV.map((item, i) => (
              <button key={`${item.label}-${i}`} type="button" onClick={() => navGo(item.path, item.kind)} className="text-[12px] font-medium uppercase tracking-[0.08em] text-neutral-700 transition-colors hover:text-neutral-950">
                {item.label}
              </button>
            ))}
          </nav>
          <button type="button" onClick={() => setOpenMenu((v) => !v)} className="flex h-9 w-9 items-center justify-center text-neutral-800 lg:hidden" title="Menú">
            <Icon icon={openMenu ? 'solar:close-square-linear' : 'solar:hamburger-menu-linear'} width={22} />
          </button>

          {/* Logo central */}
          <a href={`/tienda/${slug}`} className="justify-self-center">
            {tienda?.logo ? (
              <img src={tienda.logo} alt={name} className="h-8 object-contain" />
            ) : (
              <span className="text-xl font-semibold uppercase tracking-[0.34em] md:text-2xl" style={{ color: MIN.ink }}>{name}</span>
            )}
          </a>

          {/* Iconos derecha */}
          <div className="flex items-center justify-end gap-1">
            {openSearch ? (
              <form onSubmit={(e) => onSearchSubmit?.(e, searchQuery)} className="hidden items-center gap-2 border-b px-1 py-1 md:flex" style={{ borderColor: MIN.ink }}>
                <Icon icon="solar:magnifer-linear" width={15} className="text-neutral-500" />
                <input autoFocus value={searchQuery || ''} onChange={(e) => setSearchQuery?.(e.target.value)} placeholder={diseno?.modaMinimalSearchPlaceholder || 'Buscar'} className="w-36 border-0 bg-transparent p-0 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:ring-0" />
              </form>
            ) : (
              <button type="button" onClick={() => setOpenSearch(true)} className="flex h-9 w-9 items-center justify-center text-neutral-700 transition-colors hover:text-neutral-950" title="Buscar">
                <Icon icon="solar:magnifer-linear" width={19} />
              </button>
            )}
            <button type="button" onClick={() => setOpenFavs(true)} className="relative flex h-9 w-9 items-center justify-center text-neutral-700 transition-colors hover:text-neutral-950" title="Cuenta / Favoritos">
              <Icon icon="solar:user-linear" width={19} />
              {favoritos.length > 0 && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: primary }} />}
            </button>
            <button type="button" onClick={onOpenCart} className="relative flex h-9 w-9 items-center justify-center text-neutral-800 transition-colors hover:text-neutral-950" title="Carrito">
              <Icon icon="solar:bag-3-linear" width={20} />
              {carritoSize > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: MIN.ink }}>{carritoSize}</span>
              )}
            </button>
          </div>
        </div>

        {openMenu && (
          <div className="border-t bg-white px-5 py-3 lg:hidden" style={{ borderColor: MIN.line }}>
            <div className="flex flex-col">
              {NAV.map((item, i) => (
                <button key={`m-${item.label}-${i}`} type="button" onClick={() => { setOpenMenu(false); navGo(item.path, item.kind); }} className="border-b py-3 text-left text-sm font-medium uppercase tracking-[0.08em] text-neutral-700" style={{ borderColor: MIN.line }}>
                  {item.label}
                </button>
              ))}
              {cats.map((c) => (
                <button key={`mc-${c}`} type="button" onClick={() => { setOpenMenu(false); navGo(`/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`, 'catalogo'); }} className="py-2 text-left text-xs uppercase tracking-wide text-neutral-500">
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.header>

      <MinFavoritesModal open={openFavs} onClose={() => setOpenFavs(false)} slug={slug} cp={primary} favoritos={favoritos} onRemove={removeFavorito} onProduct={goProduct} />
    </>
  );
}

/* ─────────────────────────── WhatsApp flotante ──────────────────────────── */

export function MinWhatsAppFab({ tienda }: { tienda: any }) {
  return (
    <a
      href={waLink(tienda)}
      target="_blank"
      rel="noreferrer"
      className="group fixed bottom-6 right-6 z-50 flex h-13 items-center gap-0 overflow-hidden rounded-full text-white shadow-[0_14px_34px_-10px_rgba(37,211,102,0.7)]"
      style={{ backgroundColor: '#25D366' }}
      aria-label="Escríbenos por WhatsApp"
    >
      <span className="flex h-13 w-13 shrink-0 items-center justify-center" style={{ height: 52, width: 52 }}>
        <Icon icon="mdi:whatsapp" width={26} />
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-[200px] group-hover:pr-6">
        ¿Te ayudamos?
      </span>
    </a>
  );
}

/* ─────────────────────────────────── Footer ─────────────────────────────── */

export function MinFooter({ tienda, slug, diseno, cp, categories = [] }: { tienda: any; slug: string; diseno?: any; cp: string; categories?: any[] }) {
  const name = storeName(tienda, diseno);
  const email = diseno?.modaMinimalFooterEmail || tienda?.email || tienda?.correo || 'hola@norda.pe';
  const phone = diseno?.modaMinimalFooterPhone || tienda?.whatsappTienda || tienda?.telefono || '+51 999 999 999';
  const cats = categories.map((cat) => (typeof cat === 'string' ? cat : cat?.nombre)).filter(Boolean).slice(0, 4);

  const Col = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: MIN.ink }}>{title}</h4>
      <div className="space-y-2.5 text-[13px]" style={{ color: MIN.soft }}>{children}</div>
    </div>
  );

  return (
    <motion.footer initial="hidden" whileInView="show" viewport={minViewport} variants={minSection} className="border-t" style={{ backgroundColor: MIN.paper, borderColor: MIN.line }}>
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[1.6fr_1fr_1fr_1fr] md:px-8">
        <div>
          <span className="text-lg font-semibold uppercase tracking-[0.3em]" style={{ color: MIN.ink }}>{name}</span>
          <p className="mt-4 max-w-xs text-[13px] leading-7" style={{ color: MIN.soft }}>
            {diseno?.modaMinimalFooterText || tienda?.descripcionTienda || 'Prendas y calzado de calidad, hechos para durar. Diseño honesto, materiales nobles y precios transparentes.'}
          </p>
          <div className="mt-6 flex gap-3">
            {['mdi:instagram', 'mdi:facebook', 'prime:twitter', 'ic:baseline-tiktok'].map((icon) => (
              <a key={icon} href="#" className="flex h-9 w-9 items-center justify-center border transition-colors hover:bg-black hover:text-white" style={{ borderColor: MIN.line, color: MIN.soft }}>
                <Icon icon={icon} width={17} />
              </a>
            ))}
          </div>
        </div>
        <Col title="Tienda">
          {cats.length ? cats.map((c) => (
            <a key={c} href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`} className="block transition-colors hover:text-black">{c}</a>
          )) : <a href={`/tienda/${slug}/catalogo`} className="block transition-colors hover:text-black">Ver todo</a>}
        </Col>
        <Col title="Ayuda">
          <a href={`/tienda/${slug}/seguimiento`} className="block transition-colors hover:text-black">Seguir mi pedido</a>
          <a href={`/tienda/${slug}/contacto`} className="block transition-colors hover:text-black">Envíos y cambios</a>
          <a href={`/tienda/${slug}/contacto`} className="block transition-colors hover:text-black">Guía de tallas</a>
          <a href={`/tienda/${slug}/contacto`} className="block transition-colors hover:text-black">Contacto</a>
        </Col>
        <Col title="Contacto">
          <p>{email}</p>
          <p>{phone}</p>
        </Col>
      </div>
      <div className="border-t" style={{ borderColor: MIN.line }}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs md:flex-row md:px-8" style={{ color: MIN.muted }}>
          <span>© 2026 {name}. Todos los derechos reservados.</span>
          <span>Powered by Falconext</span>
        </div>
      </div>
    </motion.footer>
  );
}

/* ─────────────────────────── Modal / Drawer carrito ─────────────────────── */

export function MinCartModal({
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
        <div className="fixed inset-0 z-[9999] isolate" style={{ fontFamily: MIN.sans }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40" />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35, ease: minEase }}
            className="fixed inset-y-0 right-0 flex w-full max-w-md flex-col border-l shadow-2xl"
            style={{ backgroundColor: MIN.paper, borderColor: MIN.line }}
          >
            <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: MIN.line }}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: MIN.ink }}>Carrito</h3>
              <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center text-neutral-500 transition-colors hover:text-black" title="Cerrar">
                <Icon icon="solar:close-circle-linear" width={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              {carrito.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                  <Icon icon="solar:bag-cross-linear" className="text-5xl text-neutral-300" />
                  <p className="mt-4 text-sm text-neutral-500">Tu carrito está vacío.</p>
                </div>
              ) : (
                carrito.map((item) => {
                  const itemId = item.cartId || item.id;
                  const qty = Number(item.cantidad || 1);
                  const price = Number(item.precioUnitario || item.precio || 0);
                  return (
                    <div key={itemId} className="flex gap-4 border-b py-5" style={{ borderColor: MIN.line }}>
                      <div className="h-24 w-20 shrink-0 overflow-hidden" style={{ backgroundColor: MIN.stone }}>
                        <MinProductImage producto={item} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium leading-5" style={{ color: MIN.ink }}>{item.descripcion}</p>
                        <p className="mt-1 text-sm" style={{ color: MIN.ink }}>{money(price * qty)}</p>
                        <div className="mt-2.5 flex items-center justify-between gap-3">
                          <div className="flex h-8 items-center border" style={{ borderColor: MIN.line }}>
                            <button type="button" onClick={() => actualizarCantidad(itemId, qty - 1)} className="h-8 w-8 text-sm text-neutral-600">-</button>
                            <span className="w-8 text-center text-sm">{qty}</span>
                            <button type="button" onClick={() => actualizarCantidad(itemId, qty + 1)} className="h-8 w-8 text-sm text-neutral-600">+</button>
                          </div>
                          <button type="button" onClick={() => actualizarCantidad(itemId, 0)} className="text-[11px] uppercase tracking-[0.12em] text-neutral-500 underline hover:text-black">Quitar</button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {carrito.length > 0 && (
              <div className="border-t px-6 py-5" style={{ borderColor: MIN.line }}>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Total</span>
                  <span className="text-xl font-semibold" style={{ color: MIN.ink }}>{money(total)}</span>
                </div>
                <button type="button" onClick={onCheckout} className="mt-4 flex w-full items-center justify-center py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white" style={{ backgroundColor: MIN.ink }}>
                  Finalizar compra
                </button>
                <button type="button" onClick={cotizar} className="mt-3 flex w-full items-center justify-center gap-2 border py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: MIN.ink, color: MIN.ink }}>
                  <Icon icon="mdi:whatsapp" width={17} /> Cotizar por WhatsApp
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

export function MinFavoritesModal({
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
        <div className="fixed inset-0 z-[9999] isolate" style={{ fontFamily: MIN.sans }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40" />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35, ease: minEase }}
            className="fixed inset-y-0 right-0 flex w-full max-w-md flex-col border-l shadow-2xl"
            style={{ backgroundColor: MIN.paper, borderColor: MIN.line }}
          >
            <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: MIN.line }}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: MIN.ink }}>Favoritos</h3>
              <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center text-neutral-500 transition-colors hover:text-black" title="Cerrar">
                <Icon icon="solar:close-circle-linear" width={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              {favoritos.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                  <Icon icon="solar:heart-linear" className="text-5xl text-neutral-300" />
                  <p className="mt-4 text-sm text-neutral-500">Aún no tienes favoritos.</p>
                </div>
              ) : (
                favoritos.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b py-5" style={{ borderColor: MIN.line }}>
                    <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="h-24 w-20 shrink-0 overflow-hidden" style={{ backgroundColor: MIN.stone }}>
                      <MinProductImage producto={item} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="block text-left">
                        <p className="line-clamp-2 text-sm font-medium leading-5" style={{ color: MIN.ink }}>{item.descripcion}</p>
                      </button>
                      <p className="mt-1 text-sm" style={{ color: MIN.ink }}>{money(item.precioUnitario)}</p>
                      <div className="mt-2.5 flex items-center gap-4">
                        <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="text-[11px] font-semibold uppercase tracking-[0.12em] underline" style={{ color: MIN.ink }}>Ver</button>
                        <button type="button" onClick={() => onRemove(Number(item.id), slug)} className="text-[11px] uppercase tracking-[0.12em] text-neutral-500 underline hover:text-black">Quitar</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t px-6 py-5" style={{ borderColor: MIN.line }}>
              <a href={`/tienda/${slug}/catalogo`} className="flex w-full items-center justify-center border py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: MIN.ink, color: MIN.ink }}>
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
