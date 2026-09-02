import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { getProductPricing } from '@/templates/shared/pricing';
import { useFavoritosStore } from '@/zustand/favoritos';
import { groCard, groEase, groHover, groSection, groTap, groViewport } from './motion';

/**
 * Identidad visual de la plantilla "Grogin" (abarrotes, minimarket, bodega, supermercado).
 *
 * Estética e-commerce de comestibles inspirada en Grogin/Fulo: limpio y luminoso, verde
 * fresco como color de marca/CTA, texto navy, acentos morados en el hero y amarillo para
 * el rating. Tarjetas de producto con descuento, estrellas y "Agregar al carrito".
 * Tipografía Quicksand (títulos) + Lato (cuerpo). `cp` (colorPrimario) es el acento
 * configurable (por defecto verde Grogin).
 */
export const GRO = {
  green: '#3BB77E',
  greenDark: '#29A56C',
  greenSoft: '#DEF9EC',
  ink: '#253D4E',
  inkSoft: '#7E7E7E',
  purple: '#6A4BBC',
  lavender: '#F3EFFB',
  amber: '#FDC040',
  pink: '#F74B81',
  cream: '#FFFFFF',
  soft: '#F4F6FA',
  soft2: '#FBFCFE',
  line: '#ECECEC',
  display: "'Quicksand', 'Lato', ui-sans-serif, system-ui, sans-serif",
} as const;

export const groPrimary = (cp?: string) => cp || GRO.green;
export const groFont = (diseno?: any) => `'${diseno?.tipografia || 'Lato'}', ui-sans-serif, system-ui, sans-serif`;

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

/** Convierte "ACEITES Y VINAGRES" → "Aceites Y Vinagres" y "AZÚCAR" → "Azúcar" (respeta tildes). */
export const titleCase = (s: any) => String(s || '').toLowerCase().replace(/(^|[\s/&·,-])(\p{L})/gu, (_m, sep, ch) => sep + ch.toUpperCase());

export function withAlpha(hex: string, alpha: string) {
  return /^#([0-9a-fA-F]{6})$/.test(hex) ? `${hex}${alpha}` : hex;
}

export function storeName(tienda: any, diseno: any) {
  return diseno?.abarrotesLogoText || tienda?.nombreComercial || tienda?.razonSocial || tienda?.nombre || 'Grogin';
}

export function waLink(tienda: any, message = 'Hola, quiero más información sobre sus productos') {
  const raw = String(tienda?.whatsappTienda || tienda?.whatsapp || tienda?.telefono || '').replace(/[^\d]/g, '');
  const phone = raw || '51999999999';
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/* ─────────────────────────── Imagen de producto ─────────────────────────── */

export function GroProductImage({ producto, imgClassName = '' }: { producto: any; imgClassName?: string }) {
  const img = producto?.imagenUrl || producto?.imagen || '';
  const [broken, setBroken] = useState(false);
  if (img && !broken) {
    return <img src={img} alt={producto?.descripcion || 'Producto'} loading="lazy" onError={() => setBroken(true)} className={`h-full w-full object-contain ${imgClassName}`} />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ background: GRO.soft }}>
      <Icon icon="solar:cart-large-minimalistic-linear" className="text-6xl" style={{ color: GRO.green }} />
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
          <Icon key={i} icon={i < Math.round(v) ? 'solar:star-bold' : 'solar:star-linear'} width={size} style={{ color: GRO.amber }} />
        ))}
      </div>
      {typeof count === 'number' && <span className="text-[11px] font-medium" style={{ color: GRO.inkSoft }}>({count})</span>}
    </div>
  );
}

/* ──────────────────────────────── Product card ──────────────────────────── */

export function GroProductCard({
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
  const primary = groPrimary(cp);
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
  const rating = Number(producto?.ratingAvg || producto?.ratingPromedio || 0) || 5;
  const reviews = Number(producto?.reviewsCount || producto?.ventas || 0) || undefined;

  return (
    <motion.article
      variants={groCard}
      initial="hidden"
      whileInView="show"
      viewport={groViewport}
      whileHover={groHover}
      layout
      className="group relative flex flex-col rounded-2xl border bg-white p-3 transition-shadow hover:shadow-[0_16px_36px_-20px_rgba(37,61,78,0.35)]"
      style={{ borderColor: GRO.line }}
    >
      <button type="button" onClick={onClick} className="relative block aspect-square w-full overflow-hidden rounded-xl" style={{ backgroundColor: GRO.soft2 }}>
        {pricing.enOferta && (
          <span className="absolute left-2 top-2 z-10 rounded-md px-2 py-0.5 text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: GRO.pink }}>
            -{pricing.porcentajeDescuento}%
          </span>
        )}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); toggleWish(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); toggleWish(); } }}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-neutral-400 shadow-sm ring-1 transition-colors hover:text-neutral-700"
          style={{ ['--tw-ring-color' as any]: GRO.line }}
          title="Favorito"
        >
          <Icon icon={wish ? 'solar:heart-bold' : 'solar:heart-linear'} width={16} style={wish ? { color: GRO.pink } : undefined} />
        </span>
        <div className="h-full w-full p-4 transition-transform duration-500 ease-out group-hover:scale-[1.05]">
          <GroProductImage producto={producto} />
        </div>
      </button>

      <div className="flex flex-1 flex-col pt-3">
        {marca && <p className="mb-1 text-[11px] font-semibold" style={{ color: GRO.green }}>{marca}</p>}
        <button type="button" onClick={onClick} className="text-left">
          <h3 className="line-clamp-2 text-[13.5px] font-semibold leading-snug" style={{ fontFamily: GRO.display, color: GRO.ink }}>{producto?.descripcion}</h3>
        </button>
        <div className="mt-1.5"><StarRating value={rating} count={reviews} /></div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="flex flex-col leading-none">
            <span className="text-[17px] font-extrabold" style={{ fontFamily: GRO.display, color: GRO.green }}>S/ {pricing.precioFinal.toFixed(2)}</span>
            {pricing.enOferta && <span className="mt-1 text-xs font-medium text-neutral-400 line-through">S/ {pricing.precioRegular.toFixed(2)}</span>}
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAddToCart?.({ ...producto, precioUnitario: pricing.precioFinal, precioRegular: pricing.precioRegular, enOferta: pricing.enOferta }); }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition-colors"
            style={{ backgroundColor: GRO.greenSoft, color: GRO.greenDark }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = primary; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = GRO.greenSoft; e.currentTarget.style.color = GRO.greenDark; }}
          >
            <Icon icon="solar:cart-plus-bold" width={15} /> Agregar
          </button>
        </div>
      </div>
    </motion.article>
  );
}

/* ─────────────────────────── Buscador con dropdown ──────────────────────── */

function GroSearchBox({ slug, primary, diseno, initial = '', setValue, onSubmit, mobile = false }: {
  slug: string; primary: string; diseno?: any; initial?: string;
  setValue?: (v: string) => void; onSubmit?: (e: React.FormEvent, value?: string) => void; mobile?: boolean;
}) {
  const [q, setQ] = useState(initial || '');
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const money = (v: number) => `S/ ${Number(v || 0).toFixed(2)}`;

  useEffect(() => { setQ(initial || ''); }, [initial]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2 || slug === 'preview') { setResults([]); setLoading(false); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${BASE_URL}/public/store/${slug}/products?search=${encodeURIComponent(term)}&limit=6`);
        const json = await res.json();
        const arr = json?.data?.data ?? json?.data ?? [];
        setResults(Array.isArray(arr) ? arr.slice(0, 6) : []);
      } catch { setResults([]); } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [q, slug]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const goProduct = (id: any) => { setOpen(false); if (slug === 'preview') { window.dispatchEvent(new CustomEvent('preview-nav', { detail: 'catalogo' })); return; } window.location.href = `/tienda/${slug}/producto/${id}`; };
  const goAll = () => { setOpen(false); const term = q.trim(); if (slug === 'preview') { window.dispatchEvent(new CustomEvent('preview-nav', { detail: 'catalogo' })); return; } window.location.href = `/tienda/${slug}/catalogo${term ? `?search=${encodeURIComponent(term)}` : ''}`; };

  return (
    <div ref={boxRef} className={`relative ${mobile ? '' : 'mx-auto hidden max-w-2xl flex-1 md:block'}`}>
      <form onSubmit={(e) => { e.preventDefault(); setOpen(false); if (onSubmit) onSubmit(e, q); else goAll(); }} className="flex h-11 items-center overflow-hidden rounded-full border bg-white" style={{ borderColor: primary }}>
        <input value={q} onChange={(e) => { setQ(e.target.value); setValue?.(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={diseno?.abarrotesSearchPlaceholder || 'Busca productos, marcas y categorías...'} className="h-full flex-1 border-0 bg-transparent px-5 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:ring-0" />
        <button type="submit" className="flex h-full items-center gap-1.5 px-5 text-sm font-bold text-white" style={{ backgroundColor: primary }}><Icon icon="solar:magnifer-linear" width={17} /> <span className={mobile ? 'hidden' : 'hidden lg:inline'}>Buscar</span></button>
      </form>
      <AnimatePresence>
        {open && q.trim().length >= 2 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }} className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-white shadow-[0_20px_50px_-20px_rgba(37,61,78,0.4)]" style={{ borderColor: GRO.line }}>
            {loading ? (
              <div className="flex items-center gap-2 p-4 text-sm text-neutral-400"><Icon icon="svg-spinners:ring-resize" width={18} /> Buscando…</div>
            ) : results.length === 0 ? (
              <button type="button" onClick={goAll} className="block w-full p-4 text-left text-sm text-neutral-500 hover:bg-neutral-50">Sin coincidencias. Ver todo para “{q.trim()}” →</button>
            ) : (
              <>
                {results.map((p) => (
                  <button key={p.id} type="button" onClick={() => goProduct(p.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-neutral-50">
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg p-1" style={{ backgroundColor: GRO.soft2 }}><GroProductImage producto={p} /></span>
                    <span className="line-clamp-1 min-w-0 flex-1 text-sm font-medium" style={{ color: GRO.ink }}>{p.descripcion || p.nombre}</span>
                    <span className="shrink-0 text-sm font-bold" style={{ color: primary }}>{money(p.precioUnitario ?? p.precio ?? p.precioVenta ?? 0)}</span>
                  </button>
                ))}
                <button type="button" onClick={goAll} className="block w-full border-t px-4 py-2.5 text-center text-[13px] font-bold hover:bg-neutral-50" style={{ borderColor: GRO.line, color: primary }}>Ver todos los resultados →</button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────── Header ─────────────────────────────── */

export function GroHeader({
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
  const primary = groPrimary(cp);
  const name = storeName(tienda, diseno);
  const [openFavs, setOpenFavs] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);
  const categories = allCategories.map((cat) => (typeof cat === 'string' ? cat : cat?.nombre)).filter(Boolean);
  const navCats = categories.slice(0, 5);
  const announcement = diseno?.abarrotesAnnouncement || 'Envío gratis en pedidos desde S/ 80  ·  Productos frescos todos los días';
  const goProduct = (id: any) => {
    if (slug === 'preview') { window.dispatchEvent(new CustomEvent('preview-nav', { detail: 'catalogo' })); return; }
    window.location.href = `/tienda/${slug}/producto/${id}`;
  };

  return (
    <>
      {/* Barra superior */}
      <div className="w-full text-white" style={{ backgroundColor: GRO.ink }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-2 text-[11.5px] font-medium md:px-6">
          <span className="line-clamp-1 opacity-85">{announcement}</span>
          <a href={`/tienda/${slug}/seguimiento`} className="hidden shrink-0 items-center gap-1.5 opacity-85 transition-opacity hover:opacity-100 sm:flex">
            <Icon icon="solar:box-minimalistic-linear" width={15} /> Seguir mi pedido
          </a>
        </div>
      </div>

      {/* Header principal */}
      <header className="border-b bg-white" style={{ borderColor: GRO.line }}>
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-4 md:px-6">
          <motion.a
            href={`/tienda/${slug}`}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: groEase }}
            whileHover={{ scale: 1.02 }}
            className="flex shrink-0 items-center gap-2.5"
          >
            {tienda?.logo ? (
              <img src={tienda.logo} alt={name} className="h-10 w-10 rounded-full object-cover ring-1" style={{ ['--tw-ring-color' as any]: GRO.line }} />
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-full text-white" style={{ backgroundColor: primary }}>
                <Icon icon="solar:leaf-bold" width={20} />
              </span>
            )}
            <span className="text-2xl font-bold lowercase leading-none tracking-tight" style={{ fontFamily: GRO.display, color: GRO.ink }}>{name}</span>
          </motion.a>

          {/* Buscador con dropdown en vivo */}
          <GroSearchBox slug={slug} primary={primary} diseno={diseno} initial={searchQuery} setValue={setSearchQuery} onSubmit={onSearchSubmit} />

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <button type="button" onClick={() => setOpenFavs(true)} className="relative rounded-full p-2.5 transition-colors hover:bg-neutral-100" style={{ color: GRO.ink }} title="Favoritos">
              <Icon icon="solar:heart-linear" width={23} />
              {favoritos.length > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white" style={{ backgroundColor: GRO.pink }}>
                  {favoritos.length}
                </span>
              )}
            </button>
            <button type="button" onClick={onOpenCart} className="relative flex items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-neutral-100" style={{ color: GRO.ink }} title="Carrito">
              <span className="relative">
                <Icon icon="solar:cart-large-2-linear" width={24} />
                {carritoSize > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white" style={{ backgroundColor: primary }}>
                    {carritoSize}
                  </span>
                )}
              </span>
              <span className="hidden text-xs font-bold lg:inline">Mi carrito</span>
            </button>
          </div>
        </div>

        {/* Buscador móvil */}
        <div className="px-5 pb-3 md:hidden">
          <GroSearchBox slug={slug} primary={primary} diseno={diseno} initial={searchQuery} setValue={setSearchQuery} onSubmit={onSearchSubmit} mobile />
        </div>
      </header>

      {/* Barra de navegación */}
      <div className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur" style={{ borderColor: GRO.line }}>
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-5 py-2.5 md:px-6">
          <a href={`/tienda/${slug}/catalogo`} className="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-bold text-white" style={{ backgroundColor: GRO.ink }}>
            <Icon icon="solar:hamburger-menu-linear" width={18} /> Categorías
          </a>
          <nav className="flex items-center gap-0.5 overflow-x-auto">
            <a href={`/tienda/${slug}`} className="whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors hover:text-[var(--gro-cp)]" style={{ color: GRO.ink, ['--gro-cp' as any]: primary }}>Inicio</a>
            <a href={`/tienda/${slug}/catalogo`} className="whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors hover:text-[var(--gro-cp)]" style={{ color: GRO.ink, ['--gro-cp' as any]: primary }}>Tienda</a>
            {navCats.map((category) => (
              <a key={category} href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(category)}`} className="hidden whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold text-neutral-600 transition-colors hover:text-[var(--gro-cp)] lg:inline" style={{ ['--gro-cp' as any]: primary }}>{titleCase(category)}</a>
            ))}
            <a href={`/tienda/${slug}/catalogo`} className="whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors" style={{ color: GRO.pink }}>Ofertas</a>
            <a href={`/tienda/${slug}/contacto`} className="whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold text-neutral-600 transition-colors hover:text-[var(--gro-cp)]" style={{ ['--gro-cp' as any]: primary }}>Contacto</a>
          </nav>
        </div>
      </div>

      <GroFavoritesModal
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

export function GroWhatsAppFab({ tienda }: { tienda: any }) {
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
        ¿Te ayudamos?
      </span>
    </a>
  );
}

/* ─────────────────────────────────── Footer ─────────────────────────────── */

export function GroFooter({ tienda, slug, diseno, cp, categories = [] }: { tienda: any; slug: string; diseno?: any; cp: string; categories?: any[] }) {
  const primary = groPrimary(cp);
  const name = storeName(tienda, diseno);
  const cats = categories.map((cat) => (typeof cat === 'string' ? cat : cat?.nombre)).filter(Boolean).slice(0, 6);

  return (
    <motion.footer initial="hidden" whileInView="show" viewport={groViewport} variants={groSection} style={{ backgroundColor: GRO.soft }}>
      {/* Tira de garantías */}
      <div className="border-y bg-white" style={{ borderColor: GRO.line }}>
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-5 px-6 py-8 md:grid-cols-4">
          {[
            ['solar:delivery-bold', 'Envío rápido', 'A domicilio el mismo día'],
            ['solar:shield-check-bold', 'Pago seguro', 'Protegido al 100%'],
            ['solar:leaf-bold', 'Siempre fresco', 'Productos seleccionados'],
            ['solar:tag-price-bold', 'Mejores precios', 'Ofertas cada semana'],
          ].map(([icon, title, text]) => (
            <div key={title} className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ backgroundColor: GRO.greenSoft, color: GRO.greenDark }}>
                <Icon icon={icon} width={22} />
              </span>
              <div>
                <p className="text-sm font-bold" style={{ fontFamily: GRO.display, color: GRO.ink }}>{title}</p>
                <p className="text-xs" style={{ color: GRO.inkSoft }}>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full text-white" style={{ backgroundColor: primary }}>
              <Icon icon="solar:leaf-bold" width={19} />
            </span>
            <h3 className="text-2xl font-bold lowercase" style={{ fontFamily: GRO.display, color: GRO.ink }}>{name}</h3>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6" style={{ color: GRO.inkSoft }}>
            {diseno?.abarrotesFooterText || tienda?.descripcionTienda || 'Tu supermercado de confianza. Abarrotes, frescos y todo lo que tu hogar necesita, con envío rápido y los mejores precios.'}
          </p>
          <div className="mt-6 flex gap-3">
            {['mdi:instagram', 'mdi:facebook', 'ic:baseline-tiktok', 'mdi:whatsapp'].map((icon) => (
              <a key={icon} href={icon === 'mdi:whatsapp' ? waLink(tienda) : '#'} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-500 ring-1 transition-colors hover:text-white" style={{ ['--tw-ring-color' as any]: GRO.line }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = primary; e.currentTarget.style.color = '#fff'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = ''; }}>
                <Icon icon={icon} width={19} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-bold" style={{ fontFamily: GRO.display, color: GRO.ink }}>Categorías</h4>
          <div className="space-y-2.5 text-sm" style={{ color: GRO.inkSoft }}>
            {cats.length ? (
              cats.map((cat) => (
                <a key={cat} href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(cat)}`} className="block transition-colors hover:text-[var(--gro-cp)]" style={{ ['--gro-cp' as any]: primary }}>{titleCase(cat)}</a>
              ))
            ) : (
              <a href={`/tienda/${slug}/catalogo`} className="block">Ver todo</a>
            )}
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-bold" style={{ fontFamily: GRO.display, color: GRO.ink }}>Ayuda</h4>
          <div className="space-y-2.5 text-sm" style={{ color: GRO.inkSoft }}>
            <a href={`/tienda/${slug}/seguimiento`} className="block transition-colors hover:text-[var(--gro-cp)]" style={{ ['--gro-cp' as any]: primary }}>Seguir mi pedido</a>
            <a href={`/tienda/${slug}/catalogo`} className="block transition-colors hover:text-[var(--gro-cp)]" style={{ ['--gro-cp' as any]: primary }}>Tienda completa</a>
            <a href={`/tienda/${slug}/contacto`} className="block transition-colors hover:text-[var(--gro-cp)]" style={{ ['--gro-cp' as any]: primary }}>Contacto</a>
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-bold" style={{ fontFamily: GRO.display, color: GRO.ink }}>Atención</h4>
          <p className="text-sm" style={{ color: GRO.inkSoft }}>{diseno?.abarrotesFooterPhone || tienda?.whatsappTienda || tienda?.telefono || '+51 999 999 999'}</p>
          <p className="mt-2.5 text-sm" style={{ color: GRO.inkSoft }}>{diseno?.abarrotesFooterEmail || tienda?.email || tienda?.correo || 'hola@grogin.pe'}</p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold" style={{ backgroundColor: GRO.greenSoft, color: GRO.greenDark }}>
            <Icon icon="solar:clock-circle-bold" width={14} /> Lun a Dom · 8am – 10pm
          </span>
        </div>
      </div>
      <div className="border-t px-6 py-5 text-center text-xs" style={{ borderColor: GRO.line, color: GRO.inkSoft }}>© 2026 {name}. Powered by Falconext.</div>
    </motion.footer>
  );
}

/* ─────────────────────────── Modal / Drawer carrito ─────────────────────── */

export function GroCartModal({
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
  const primary = groPrimary(cp);
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
        <div className="fixed inset-0 z-[9999] isolate" style={{ fontFamily: "'Lato', ui-sans-serif, system-ui, sans-serif" }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: GRO.line }}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ backgroundColor: primary }}>
                  <Icon icon="solar:cart-large-2-bold" width={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: GRO.inkSoft }}>Tu compra</p>
                  <h3 className="text-xl font-bold leading-none" style={{ fontFamily: GRO.display, color: GRO.ink }}>Carrito</h3>
                </div>
              </div>
              <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100" title="Cerrar">
                <Icon icon="solar:close-circle-linear" width={22} />
              </button>
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
                    <div key={itemId} className="flex gap-4 border-b py-5" style={{ borderColor: GRO.line }}>
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl p-2" style={{ backgroundColor: GRO.soft2 }}>
                        <GroProductImage producto={item} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold leading-5" style={{ color: GRO.ink }}>{item.descripcion}</p>
                        <p className="mt-1 text-sm font-extrabold" style={{ color: GRO.green }}>{money(price * qty)}</p>
                        <div className="mt-2.5 flex items-center justify-between gap-3">
                          <div className="flex h-9 items-center rounded-full ring-1" style={{ ['--tw-ring-color' as any]: GRO.line }}>
                            <button type="button" onClick={() => actualizarCantidad(itemId, qty - 1)} className="h-9 w-9 text-sm font-bold text-neutral-600">-</button>
                            <span className="w-8 text-center text-sm font-bold">{qty}</span>
                            <button type="button" onClick={() => actualizarCantidad(itemId, qty + 1)} className="h-9 w-9 text-sm font-bold" style={{ color: GRO.green }}>+</button>
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
              <div className="border-t px-6 py-5" style={{ borderColor: GRO.line }}>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: GRO.inkSoft }}>Total</span>
                  <span className="text-2xl font-extrabold" style={{ fontFamily: GRO.display, color: GRO.ink }}>{money(total)}</span>
                </div>
                <button type="button" onClick={onCheckout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5" style={{ backgroundColor: primary }}>
                  Finalizar compra <Icon icon="solar:arrow-right-linear" width={18} />
                </button>
                <button type="button" onClick={cotizar} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border py-3.5 text-sm font-bold transition-colors" style={{ borderColor: '#25D366', color: '#128C4B' }}>
                  <Icon icon="mdi:whatsapp" width={18} /> Pedir por WhatsApp
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

export function GroFavoritesModal({
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
  const primary = groPrimary(cp);
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
        <div className="fixed inset-0 z-[9999] isolate" style={{ fontFamily: "'Lato', ui-sans-serif, system-ui, sans-serif" }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: GRO.line }}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: withAlpha(GRO.pink, '1f'), color: GRO.pink }}>
                  <Icon icon="solar:heart-bold" width={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: GRO.inkSoft }}>Tu lista de deseos</p>
                  <h3 className="text-xl font-bold leading-none" style={{ fontFamily: GRO.display, color: GRO.ink }}>Favoritos</h3>
                </div>
              </div>
              <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100" title="Cerrar">
                <Icon icon="solar:close-circle-linear" width={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              {favoritos.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                  <Icon icon="solar:heart-linear" className="text-5xl text-neutral-300" />
                  <p className="mt-4 text-sm font-medium text-neutral-500">Aún no tienes favoritos.</p>
                  <p className="mt-1 text-xs text-neutral-400">Toca el corazón en un producto para guardarlo aquí.</p>
                </div>
              ) : (
                favoritos.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b py-5" style={{ borderColor: GRO.line }}>
                    <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl p-2" style={{ backgroundColor: GRO.soft2 }}>
                      <GroProductImage producto={item} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="block text-left">
                        <p className="line-clamp-2 text-sm font-semibold leading-5" style={{ color: GRO.ink }}>{item.descripcion}</p>
                      </button>
                      <p className="mt-1 text-sm font-extrabold" style={{ color: GRO.green }}>{money(item.precioUnitario)}</p>
                      <div className="mt-2.5 flex items-center gap-3">
                        <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="rounded-full px-4 py-2 text-[11px] font-bold text-white" style={{ backgroundColor: primary }}>
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

            <div className="border-t px-6 py-5" style={{ borderColor: GRO.line }}>
              <a href={`/tienda/${slug}/catalogo`} className="flex w-full items-center justify-center gap-2 rounded-full border py-3.5 text-sm font-bold transition-colors" style={{ borderColor: primary, color: GRO.greenDark }}>
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
