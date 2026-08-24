import type React from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { getProductPricing } from '@/templates/shared/pricing';
import { useFavoritosStore } from '@/zustand/favoritos';
import { aurCard, aurEase, aurHover, aurSection, aurTap, aurViewport } from './motion';

/**
 * Identidad visual de la plantilla "Aurum" (joyería) — estilo marketplace cálido
 * inspirado en Arcade: fondo crema, tipografía grotesque en minúsculas (Space Grotesk
 * display + Outfit para UI), acento amarillo dorado en los CTA (texto oscuro encima),
 * tarjetas de producto tipo "feed" con corazón de favorito, tiles de materiales y
 * bloques editoriales. `cp` (colorPrimario del diseño) es el acento configurable
 * (por defecto amarillo Arcade).
 */
export const AUR = {
  ink: '#1D1B17',
  charcoal: '#24201A',
  accent: '#F4CE1F',
  gold: '#A8842F',
  goldSoft: '#C9B79C',
  tan: '#B4996C',
  rose: '#E5533D',
  sand: '#ECE4D6',
  nude: '#EFE7D8',
  cream: '#F4EFE7',
  mist: '#F6F1E9',
  line: 'rgba(29,27,23,0.10)',
  // `serif` conserva el nombre por compatibilidad, pero es la fuente DISPLAY grotesque.
  serif: "'Space Grotesk', 'Outfit', ui-sans-serif, system-ui, sans-serif",
} as const;

export const aurPrimary = (cp?: string) => cp || AUR.accent;
export const aurFont = (diseno?: any) => `'${diseno?.tipografia || 'Outfit'}', ui-sans-serif, system-ui, sans-serif`;

/** Añade transparencia hex (#RRGGBB + alpha 00-ff) de forma segura. */
export function withAlpha(hex: string, alpha: string) {
  return /^#([0-9a-fA-F]{6})$/.test(hex) ? `${hex}${alpha}` : hex;
}

export function storeName(tienda: any, diseno: any) {
  return diseno?.joyeriaLogoText || tienda?.nombreComercial || tienda?.razonSocial || tienda?.nombre || 'Aurum';
}

/** Número de WhatsApp de la tienda. */
export function waLink(tienda: any, message = 'Hola, quiero más información sobre sus joyas') {
  const raw = String(tienda?.whatsappTienda || tienda?.whatsapp || tienda?.telefono || '').replace(/[^\d]/g, '');
  const phone = raw || '51999999999';
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/* ─────────────────────────── Imagen de producto ─────────────────────────── */

export function AurProductImage({ producto, imgClassName = '' }: { producto: any; imgClassName?: string }) {
  const img = producto?.imagenUrl || producto?.imagen || '';
  const [broken, setBroken] = useState(false);
  if (img && !broken) {
    return <img src={img} alt={producto?.descripcion || 'Joya'} loading="lazy" onError={() => setBroken(true)} className={`h-full w-full object-cover ${imgClassName}`} />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ background: `linear-gradient(150deg, ${AUR.mist}, ${AUR.nude})` }}>
      <Icon icon="solar:diamond-linear" className="text-6xl" style={{ color: AUR.tan }} />
    </div>
  );
}

/* ──────────────────────────────── Product card ──────────────────────────── */

export function AurProductCard({
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
  const primary = aurPrimary(cp);
  const { toggleFavorito, isFavorito } = useFavoritosStore();
  const wish = isFavorito(Number(producto?.id), slug);
  const pricing = getProductPricing(producto);
  const toggleWish = () => toggleFavorito({
    id: Number(producto?.id),
    descripcion: producto?.descripcion || producto?.nombre || 'Joya',
    precioUnitario: pricing.precioFinal,
    imagenUrl: producto?.imagenUrl || producto?.imagen || '',
    slug,
  });
  const marca = typeof producto?.marca === 'object' ? producto?.marca?.nombre : producto?.marca;

  return (
    <motion.article
      variants={aurCard}
      initial="hidden"
      whileInView="show"
      viewport={aurViewport}
      whileHover={aurHover}
      layout
      className="group relative flex flex-col rounded-2xl border bg-white p-2.5 transition-shadow hover:shadow-[0_22px_44px_-26px_rgba(29,27,23,0.55)]"
      style={{ borderColor: AUR.line }}
    >
      <button type="button" onClick={onClick} className="relative block aspect-square w-full overflow-hidden rounded-xl" style={{ backgroundColor: AUR.mist }}>
        {pricing.enOferta && (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] shadow-sm" style={{ backgroundColor: primary, color: AUR.ink }}>
            -{pricing.porcentajeDescuento}%
          </span>
        )}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); toggleWish(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); toggleWish(); } }}
          className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-sm backdrop-blur transition-colors hover:text-neutral-900"
          title="Favorito"
        >
          <Icon icon={wish ? 'solar:heart-bold' : 'solar:heart-linear'} width={16} style={wish ? { color: AUR.rose } : undefined} />
        </span>
        <div className="h-full w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]">
          <AurProductImage producto={producto} />
        </div>
        <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 translate-y-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => { e.stopPropagation(); onAddToCart?.({ ...producto, precioUnitario: pricing.precioFinal, precioRegular: pricing.precioRegular, enOferta: pricing.enOferta }); }}
            className="pointer-events-auto flex h-10 w-full items-center justify-center gap-2 rounded-full text-[11px] font-bold uppercase tracking-[0.12em] shadow-lg"
            style={{ backgroundColor: primary, color: AUR.ink }}
          >
            <Icon icon="solar:bag-4-linear" width={15} /> Añadir
          </span>
        </div>
      </button>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <button type="button" onClick={onClick} className="text-left">
          <h3 className="line-clamp-1 text-[14px] font-medium" style={{ color: AUR.ink }}>{producto?.descripcion}</h3>
        </button>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-bold" style={{ color: AUR.ink }}>S/ {pricing.precioFinal.toFixed(2)}</span>
            {pricing.enOferta && <span className="text-xs font-medium text-neutral-400 line-through">S/ {pricing.precioRegular.toFixed(2)}</span>}
          </div>
          <span className="flex items-center gap-1 text-[11px] font-medium text-neutral-400">
            <span className="grid h-4 w-4 place-items-center rounded-full text-[8px] font-bold" style={{ backgroundColor: AUR.nude, color: AUR.gold }}>◆</span>
            {marca || 'Aurum'}
          </span>
        </div>
      </div>
    </motion.article>
  );
}

/* ─────────────────────────────────── Header ─────────────────────────────── */

export function AurHeader({
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
  const primary = aurPrimary(cp);
  const name = storeName(tienda, diseno);
  const [openSearch, setOpenSearch] = useState(false);
  const [openFavs, setOpenFavs] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);
  const categories = allCategories.map((cat) => (typeof cat === 'string' ? cat : cat?.nombre)).filter(Boolean).slice(0, 4);
  const goProduct = (id: any) => {
    if (slug === 'preview') { window.dispatchEvent(new CustomEvent('preview-nav', { detail: 'catalogo' })); return; }
    window.location.href = `/tienda/${slug}/producto/${id}`;
  };

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: aurEase }}
        className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{ borderColor: AUR.line, backgroundColor: withAlpha(AUR.cream, 'e6') }}
      >
        <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-4 px-5 md:px-6">
          <a href={`/tienda/${slug}`} className="flex shrink-0 items-center gap-2 leading-none">
            {tienda?.logo ? (
              <img src={tienda.logo} alt={name} className="h-9 object-contain" />
            ) : (
              <>
                <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ backgroundColor: AUR.ink, color: primary }}>
                  <Icon icon="solar:diamond-bold" width={17} />
                </span>
                <span className="text-[22px] font-bold tracking-tight" style={{ fontFamily: AUR.serif, color: AUR.ink }}>{name}</span>
              </>
            )}
          </a>

          <nav className="ml-5 hidden items-center gap-1 lg:flex">
            <a href={`/tienda/${slug}/catalogo`} className="rounded-full px-3 py-2 text-[13px] font-medium text-neutral-600 transition-colors hover:text-neutral-950">novedades</a>
            <a href={`/tienda/${slug}/catalogo`} className="rounded-full px-3 py-2 text-[13px] font-medium text-neutral-600 transition-colors hover:text-neutral-950">colección</a>
            {categories.map((category) => (
              <a key={category} href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(category)}`} className="rounded-full px-3 py-2 text-[13px] font-medium capitalize text-neutral-500 transition-colors hover:text-neutral-950">{category}</a>
            ))}
            <a href={`/tienda/${slug}/contacto`} className="rounded-full px-3 py-2 text-[13px] font-medium text-neutral-600 transition-colors hover:text-neutral-950">contacto</a>
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            {openSearch ? (
              <form
                onSubmit={(e) => onSearchSubmit?.(e, searchQuery)}
                className="hidden items-center gap-2 rounded-full border bg-white px-4 py-2 md:flex"
                style={{ borderColor: AUR.line }}
              >
                <Icon icon="solar:magnifer-linear" width={16} className="text-neutral-400" />
                <input
                  autoFocus
                  value={searchQuery || ''}
                  onChange={(e) => setSearchQuery?.(e.target.value)}
                  placeholder={diseno?.joyeriaSearchPlaceholder || 'buscar anillos, collares...'}
                  className="w-44 border-0 bg-transparent p-0 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:ring-0"
                />
              </form>
            ) : (
              <button type="button" onClick={() => setOpenSearch(true)} className="rounded-full p-2.5 text-neutral-700 transition-colors hover:bg-black/5" title="Buscar">
                <Icon icon="solar:magnifer-linear" width={20} />
              </button>
            )}
            <a href={`/tienda/${slug}/seguimiento`} className="hidden rounded-full p-2.5 text-neutral-700 transition-colors hover:bg-black/5 sm:block" title="Seguir pedido">
              <Icon icon="solar:user-linear" width={20} />
            </a>
            <button type="button" onClick={() => setOpenFavs(true)} className="relative rounded-full p-2.5 text-neutral-800 transition-colors hover:bg-black/5" title="Favoritos">
              <Icon icon="solar:heart-linear" width={21} />
              {favoritos.length > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: AUR.rose }}>
                  {favoritos.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onOpenCart}
              className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold shadow-sm transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: primary, color: AUR.ink }}
              title="Carrito"
            >
              <Icon icon="solar:bag-4-bold" width={17} />
              <span>{carritoSize}</span>
            </button>
          </div>
        </div>
      </motion.header>

      <AurFavoritesModal
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

export function AurWhatsAppFab({ tienda }: { tienda: any }) {
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

export function AurFooter({ tienda, slug, diseno, cp, categories = [] }: { tienda: any; slug: string; diseno?: any; cp: string; categories?: any[] }) {
  const primary = aurPrimary(cp);
  const name = storeName(tienda, diseno);
  const cats = categories.map((cat) => (typeof cat === 'string' ? cat : cat?.nombre)).filter(Boolean).slice(0, 5);

  return (
    <motion.footer initial="hidden" whileInView="show" viewport={aurViewport} variants={aurSection} className="text-white" style={{ backgroundColor: AUR.ink }}>
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ backgroundColor: primary, color: AUR.ink }}>
              <Icon icon="solar:diamond-bold" width={17} />
            </span>
            <h3 className="text-2xl font-bold" style={{ fontFamily: AUR.serif }}>{name}</h3>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-7 text-white/55">
            {diseno?.joyeriaFooterText || tienda?.descripcionTienda || 'Joyería fina hecha a mano con metales nobles y piedras seleccionadas. Piezas para acompañar tus momentos más valiosos.'}
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
          <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: primary }}>Colección</h4>
          <div className="space-y-3 text-sm text-white/55">
            {cats.length ? (
              cats.map((cat) => (
                <a key={cat} href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(cat)}`} className="block capitalize transition-colors hover:text-white">{cat}</a>
              ))
            ) : (
              <a href={`/tienda/${slug}/catalogo`} className="block transition-colors hover:text-white">Ver todo</a>
            )}
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: primary }}>Ayuda</h4>
          <div className="space-y-3 text-sm text-white/55">
            <a href={`/tienda/${slug}/seguimiento`} className="block transition-colors hover:text-white">Seguir mi pedido</a>
            <a href={`/tienda/${slug}/catalogo`} className="block transition-colors hover:text-white">Colección completa</a>
            <a href={`/tienda/${slug}/contacto`} className="block transition-colors hover:text-white">Contacto</a>
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: primary }}>Atención</h4>
          <p className="text-sm text-white/55">{diseno?.joyeriaFooterPhone || tienda?.whatsappTienda || tienda?.telefono || '+51 999 999 999'}</p>
          <p className="mt-3 text-sm text-white/55">{diseno?.joyeriaFooterEmail || tienda?.email || tienda?.correo || 'hola@aurum.pe'}</p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold" style={{ backgroundColor: withAlpha(primary, '22'), color: '#fff' }}>
            <Icon icon="solar:shield-check-bold" width={14} /> Compra 100% segura
          </span>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-6 py-10 text-center text-4xl font-bold lowercase text-white/90 md:text-6xl" style={{ fontFamily: AUR.serif }}>
          {diseno?.joyeriaFooterTagline || 'convierte tus ideas en joyas'}
        </p>
      </div>
      <div className="border-t border-white/10 px-6 py-5 text-center text-xs text-white/40">© 2026 {name}. Powered by Falconext.</div>
    </motion.footer>
  );
}

/* ─────────────────────────── Modal / Drawer carrito ─────────────────────── */

export function AurCartModal({
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
  const primary = aurPrimary(cp);
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
    const nombre = tienda?.nombreComercial || tienda?.razonSocial || tienda?.nombre || 'la joyería';
    const lineas = carrito.map((i) => `• ${i.cantidad || 1}x ${i.descripcion} — ${money(Number(i.precioUnitario || i.precio || 0) * Number(i.cantidad || 1))}`).join('\n');
    const msg = `Hola ${nombre}, quiero cotizar estas joyas:\n\n${lineas}\n\nTotal estimado: ${money(total)}`;
    window.open(waLink(tienda, msg), '_blank', 'noopener,noreferrer');
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] isolate" style={{ fontFamily: "'Outfit', ui-sans-serif, system-ui, sans-serif" }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed inset-y-0 right-0 flex w-full max-w-md flex-col border-l shadow-2xl"
            style={{ backgroundColor: AUR.cream, borderColor: AUR.line }}
          >
            <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: AUR.line }}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: primary, color: AUR.ink }}>
                  <Icon icon="solar:bag-4-bold" width={20} />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Tu selección</p>
                  <h3 className="text-2xl font-bold lowercase leading-none" style={{ fontFamily: AUR.serif, color: AUR.ink }}>carrito</h3>
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
                    <div key={itemId} className="flex gap-4 border-b py-5" style={{ borderColor: AUR.line }}>
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl" style={{ backgroundColor: AUR.mist }}>
                        <AurProductImage producto={item} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium leading-5" style={{ color: AUR.ink }}>{item.descripcion}</p>
                        <p className="mt-1 text-sm font-bold" style={{ color: AUR.ink }}>{money(price * qty)}</p>
                        <div className="mt-2.5 flex items-center justify-between gap-3">
                          <div className="flex h-9 items-center rounded-full bg-white ring-1" style={{ ['--tw-ring-color' as any]: AUR.line }}>
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
              <div className="border-t px-6 py-5" style={{ borderColor: AUR.line }}>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Total</span>
                  <span className="text-3xl font-bold" style={{ fontFamily: AUR.serif, color: AUR.ink }}>{money(total)}</span>
                </div>
                <button type="button" onClick={onCheckout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-4 text-xs font-bold uppercase tracking-[0.12em] shadow-lg transition-transform hover:-translate-y-0.5" style={{ backgroundColor: primary, color: AUR.ink }}>
                  Finalizar compra <Icon icon="solar:arrow-right-linear" width={16} />
                </button>
                <button type="button" onClick={cotizar} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border py-3.5 text-xs font-semibold uppercase tracking-[0.1em] transition-colors" style={{ borderColor: AUR.ink, color: AUR.ink }}>
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

export function AurFavoritesModal({
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
  const primary = aurPrimary(cp);
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
        <div className="fixed inset-0 z-[9999] isolate" style={{ fontFamily: "'Outfit', ui-sans-serif, system-ui, sans-serif" }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed inset-y-0 right-0 flex w-full max-w-md flex-col border-l shadow-2xl"
            style={{ backgroundColor: AUR.cream, borderColor: AUR.line }}
          >
            <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: AUR.line }}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: withAlpha(AUR.rose, '1f'), color: AUR.rose }}>
                  <Icon icon="solar:heart-bold" width={20} />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Tu lista de deseos</p>
                  <h3 className="text-2xl font-bold lowercase leading-none" style={{ fontFamily: AUR.serif, color: AUR.ink }}>favoritos</h3>
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
                  <p className="mt-1 text-xs text-neutral-400">Toca el corazón en una joya para guardarla aquí.</p>
                </div>
              ) : (
                favoritos.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b py-5" style={{ borderColor: AUR.line }}>
                    <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl" style={{ backgroundColor: AUR.mist }}>
                      <AurProductImage producto={item} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="block text-left">
                        <p className="line-clamp-2 text-sm font-medium leading-5" style={{ color: AUR.ink }}>{item.descripcion}</p>
                      </button>
                      <p className="mt-1 text-sm font-bold" style={{ color: AUR.ink }}>{money(item.precioUnitario)}</p>
                      <div className="mt-2.5 flex items-center gap-3">
                        <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ backgroundColor: primary, color: AUR.ink }}>
                          Ver joya
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

            <div className="border-t px-6 py-5" style={{ borderColor: AUR.line }}>
              <a href={`/tienda/${slug}/catalogo`} className="flex w-full items-center justify-center gap-2 rounded-full border py-3.5 text-xs font-semibold uppercase tracking-[0.1em] transition-colors" style={{ borderColor: AUR.ink, color: AUR.ink }}>
                Seguir explorando
              </a>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
