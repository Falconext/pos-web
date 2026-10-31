import type React from 'react';
import { BRAND } from '@/lib/branding';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { getProductPricing } from '@/templates/shared/pricing';
import { useFavoritosStore } from '@/zustand/favoritos';
import { foodTap } from './motion';
import { EnlaceTienda, itemsDeMenu, useIrEnTienda, type ItemMenu } from '@/components/tienda/navTienda';
import { useCategoriasTienda } from '@/templates/shared/enlacesTienda';
import { COMIDA_APP_MENU } from './menu';

/**
 * Identidad visual de la plantilla "Crispy" (app de comida / delivery, estilo food-app).
 *
 * UI mobile-first centrada en una columna tipo teléfono (se ve igual en web y celular):
 * fondo crema, acentos rojo/naranja, tarjetas muy redondeadas, badges, barra inferior de
 * pestañas. `cp` (colorPrimario del diseño) es el acento principal (por defecto naranja).
 */
export const FOOD = {
  cream: '#FBF1E6',
  card: '#FFFFFF',
  primary: '#E8542A',
  red: '#B81E1E',
  ink: '#2A211C',
  soft: '#7A6E64',
  muted: '#A99E93',
  peach: '#FCE3CB',
  line: '#F0E4D6',
  amber: '#F2A93B',
  green: '#2FA84F',
  sans: "'Nunito', 'Poppins', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
} as const;

export const foodPrimary = (cp?: string) => cp || FOOD.primary;
export const foodFont = (diseno?: any) => `'${diseno?.tipografia || 'Nunito'}', ${FOOD.sans}`;

export function withAlpha(hex: string, alpha: string) {
  return /^#([0-9a-fA-F]{6})$/.test(hex) ? `${hex}${alpha}` : hex;
}

export function storeName(tienda: any, diseno: any) {
  return diseno?.comidaAppLogoText || tienda?.nombreComercial || tienda?.razonSocial || tienda?.nombre || 'Mi Restaurante';
}

export function waLink(tienda: any, message = 'Hola, quiero hacer un pedido') {
  const raw = String(tienda?.whatsappTienda || tienda?.whatsapp || tienda?.telefono || '').replace(/[^\d]/g, '');
  const phone = raw || '51999999999';
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export const cartCount = (carrito: any[]) => carrito.reduce((s, i) => s + Number(i.cantidad || 1), 0);

/* ─────────────────────────── Imagen de producto ─────────────────────────── */

export function FoodProductImage({ producto, className = '' }: { producto: any; className?: string }) {
  const img = producto?.imagenUrl || producto?.imagen || '';
  const [broken, setBroken] = useState(false);
  if (img && !broken) {
    return <img src={img} alt={producto?.descripcion || 'Producto'} loading="lazy" onError={() => setBroken(true)} className={`h-full w-full object-cover ${className}`} />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: FOOD.peach }}>
      <Icon icon="mdi:food" className="text-5xl" style={{ color: FOOD.primary }} />
    </div>
  );
}

/* ── Badge de producto (BESTSELLER / POPULAR / SAVE %) ── */
function ProductBadge({ producto, cp }: { producto: any; cp: string }) {
  const pricing = getProductPricing(producto);
  if (pricing.enOferta) return <span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white" style={{ backgroundColor: cp }}>-{pricing.porcentajeDescuento}%</span>;
  if (producto?.destacado) return <span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white" style={{ backgroundColor: FOOD.red }}>Top</span>;
  return null;
}

/* ──────────────────────────────── Product card ──────────────────────────── */

export function FoodProductCard({
  producto,
  slug = '',
  cp,
  onAddToCart,
  onClick,
  className = '',
}: {
  producto: any;
  slug?: string;
  cp: string;
  onAddToCart?: (producto: any) => void;
  onClick?: () => void;
  className?: string;
}) {
  const primary = foodPrimary(cp);
  const { toggleFavorito, isFavorito } = useFavoritosStore();
  const wish = isFavorito(Number(producto?.id), slug);
  const pricing = getProductPricing(producto);
  const rating = Number(producto?.ratingAvg || 0) || 4.8;
  const reviews = Number(producto?.ratingCount || 0);
  const subtitle = producto?.descripcionCorta || producto?.detalle || (typeof producto?.categoria === 'object' ? producto?.categoria?.nombre : producto?.categoria) || '';

  const toggleWish = () => toggleFavorito({
    id: Number(producto?.id),
    descripcion: producto?.descripcion || producto?.nombre || 'Producto',
    precioUnitario: pricing.precioFinal,
    imagenUrl: producto?.imagenUrl || producto?.imagen || '',
    slug,
  });

  return (
    <div className={`flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_10px_30px_-16px_rgba(42,33,28,0.35)] ${className}`}>
      <button type="button" onClick={onClick} className="relative block aspect-[5/4] w-full overflow-hidden" style={{ backgroundColor: FOOD.peach }}>
        <div className="absolute left-2.5 top-2.5 z-10"><ProductBadge producto={producto} cp={primary} /></div>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); toggleWish(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); toggleWish(); } }}
          className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-sm"
          title="Favorito"
        >
          <Icon icon={wish ? 'solar:heart-bold' : 'solar:heart-linear'} width={15} style={{ color: wish ? primary : FOOD.soft }} />
        </span>
        <FoodProductImage producto={producto} className="transition-transform duration-500 group-hover:scale-105" />
      </button>

      <div className="flex flex-1 flex-col p-3">
        <button type="button" onClick={onClick} className="text-left">
          <h3 className="line-clamp-1 text-[14px] font-extrabold" style={{ color: FOOD.ink }}>{producto?.descripcion}</h3>
        </button>
        {subtitle && <p className="mt-0.5 line-clamp-1 text-[11px] font-medium" style={{ color: FOOD.muted }}>{subtitle}</p>}
        <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold" style={{ color: FOOD.ink }}>
          <Icon icon="solar:star-bold" width={13} style={{ color: FOOD.amber }} /> {rating.toFixed(1)}
          {reviews > 0 && <span className="font-medium" style={{ color: FOOD.muted }}>({reviews})</span>}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[16px] font-extrabold" style={{ color: FOOD.ink }}>S/ {pricing.precioFinal.toFixed(2)}</span>
            {pricing.enOferta && <span className="text-[11px] font-semibold text-neutral-400 line-through">S/ {pricing.precioRegular.toFixed(2)}</span>}
          </div>
          <motion.button
            type="button"
            whileTap={foodTap}
            onClick={() => onAddToCart?.({ ...producto, precioUnitario: pricing.precioFinal, precioRegular: pricing.precioRegular, enOferta: pricing.enOferta })}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white shadow-md"
            style={{ backgroundColor: primary }}
            aria-label="Agregar"
          >
            <Icon icon="solar:add-linear" width={18} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Barra superior (home) ──────────────────────── */

export function FoodHomeTopBar({ tienda, slug, diseno, cp, carrito, onOpenCart }: { tienda: any; slug: string; diseno: any; cp: string; carrito: any[]; onOpenCart: () => void }) {
  const primary = foodPrimary(cp);
  const count = cartCount(carrito);
  return (
    <div className="flex items-center gap-3 px-4 pt-4">
      <EnlaceTienda href={`/tienda/${slug}/catalogo`} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm" style={{ color: FOOD.ink }} slug={slug} diseno={diseno}>
        <Icon icon="solar:hamburger-menu-linear" width={22} />
      </EnlaceTienda>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-semibold" style={{ color: FOOD.soft }}>{diseno?.comidaAppGreeting || '¡Hola! 👋'}</p>
        <h1 className="truncate text-[17px] font-extrabold leading-tight" style={{ color: FOOD.ink }}>{diseno?.comidaAppTagline || storeName(tienda, diseno)}</h1>
      </div>
      <EnlaceTienda href={`/tienda/${slug}/seguimiento`} className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm" style={{ color: FOOD.ink }} title="Notificaciones" slug={slug} diseno={diseno}>
        <Icon icon="solar:bell-linear" width={21} />
      </EnlaceTienda>
      <button type="button" onClick={onOpenCart} className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm" style={{ color: FOOD.ink }} title="Carrito">
        <Icon icon="solar:bag-3-linear" width={21} />
        {count > 0 && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold text-white" style={{ backgroundColor: primary }}>{count}</span>}
      </button>
    </div>
  );
}

/* ── Barra superior (subpáginas: back + título + carrito) ── */
export function FoodSubHeader({ title, slug, cp, carrito, onOpenCart, onBack, diseno }: { title: string; slug: string; cp: string; carrito: any[]; onOpenCart?: () => void; onBack?: () => void; diseno?: any }) {
  const primary = foodPrimary(cp);
  const count = cartCount(carrito);
  const ir = useIrEnTienda(slug, diseno);
  const back = () => { if (onBack) return onBack(); ir(`/tienda/${slug}`); };
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3" style={{ backgroundColor: FOOD.cream }}>
      <button type="button" onClick={back} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm" style={{ color: FOOD.ink }}>
        <Icon icon="solar:alt-arrow-left-linear" width={20} />
      </button>
      <h1 className="flex-1 truncate text-[16px] font-extrabold" style={{ color: FOOD.ink }}>{title}</h1>
      {onOpenCart && (
        <button type="button" onClick={onOpenCart} className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm" style={{ color: FOOD.ink }}>
          <Icon icon="solar:bag-3-linear" width={20} />
          {count > 0 && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold text-white" style={{ backgroundColor: primary }}>{count}</span>}
        </button>
      )}
    </div>
  );
}

/* ── Buscador ── */
export function FoodSearchBar({ value, setValue, onSubmit, placeholder }: { value?: string; setValue?: (v: string) => void; onSubmit?: (e: React.FormEvent, v?: string) => void; placeholder?: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4 pt-4">
      <form onSubmit={(e) => onSubmit?.(e, value)} className="flex flex-1 items-center gap-2.5 rounded-2xl bg-white px-4 py-3 shadow-sm">
        <Icon icon="solar:magnifer-linear" width={19} style={{ color: FOOD.muted }} />
        <input value={value || ''} onChange={(e) => setValue?.(e.target.value)} placeholder={placeholder || 'Busca tu antojo...'} className="w-full border-0 bg-transparent p-0 text-sm font-medium outline-none placeholder:text-neutral-400 focus:ring-0" style={{ color: FOOD.ink }} />
      </form>
      <button type="button" onClick={(e) => onSubmit?.(e as any, value)} className="flex h-[46px] w-[46px] items-center justify-center rounded-2xl text-white shadow-md" style={{ backgroundColor: FOOD.ink }} aria-label="Filtros">
        <Icon icon="solar:tuning-2-linear" width={20} />
      </button>
    </div>
  );
}

/* ─────────────────────────── Header web (desktop) ───────────────────────── */

export function FoodWebHeader({ tienda, slug, diseno, cp, carrito = [], onOpenCart, active, ofertas }: { tienda: any; slug: string; diseno?: any; cp: string; carrito?: any[]; onOpenCart?: () => void; active: 'home' | 'menu' | 'orders' | 'offers' | 'profile'; ofertas?: ItemMenu | null }) {
  const primary = foodPrimary(cp);
  const name = storeName(tienda, diseno);
  const count = cartCount(carrito);
  const [q, setQ] = useState('');
  const activeKey = active === 'orders' ? 'menu' : active === 'profile' ? 'contacto' : active === 'offers' ? 'offers' : active;
  const ir = useIrEnTienda(slug, diseno);
  const go = (path: string, externo = false) => {
    if (externo) { window.open(path, '_blank', 'noopener,noreferrer'); return; }
    ir(path);
  };
  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    ir(`/tienda/${slug}/catalogo${term ? `?search=${encodeURIComponent(term)}` : ''}`);
  };
  const NAV: { label: string; key: string; path: string; externo?: boolean }[] = [
    { label: 'Inicio', key: 'home', path: `/tienda/${slug}` },
    { label: 'Menú', key: 'menu', path: `/tienda/${slug}/catalogo` },
    ...(ofertas ? [{ label: ofertas.label, key: 'offers', path: ofertas.href as string, externo: ofertas.externo }] : []),
    { label: 'Contacto', key: 'contacto', path: `/tienda/${slug}/contacto` },
  ];
  return (
    <header className="sticky top-0 z-40 hidden border-b lg:block" style={{ backgroundColor: withAlpha(FOOD.cream, 'f2'), borderColor: FOOD.line, backdropFilter: 'blur(8px)' }}>
      <div className="mx-auto flex h-[72px] max-w-6xl items-center gap-5 px-8">
        <EnlaceTienda href={`/tienda/${slug}`} className="flex shrink-0 items-center gap-2.5" slug={slug} diseno={diseno}>
          {tienda?.logo ? <img src={tienda.logo} alt={name} className="h-10 object-contain" /> : <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: FOOD.red }}><Icon icon="mdi:silverware-fork-knife" width={22} /></span>}
          <span className="text-xl font-extrabold" style={{ color: FOOD.ink }}>{name}</span>
        </EnlaceTienda>
        <nav className="flex shrink-0 items-center gap-1">
          {NAV.map((n) => (
            <button key={n.key} type="button" onClick={() => go(n.path, n.externo)} className="rounded-full px-3.5 py-2 text-sm font-bold transition-colors" style={{ color: activeKey === n.key ? primary : FOOD.soft }}>{n.label}</button>
          ))}
        </nav>
        <form onSubmit={search} className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-sm">
          <Icon icon="solar:magnifer-linear" width={18} style={{ color: FOOD.muted }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={diseno?.comidaAppSearchPlaceholder || 'Busca tu plato favorito...'} className="w-full border-0 bg-transparent p-0 text-sm font-medium outline-none placeholder:text-neutral-400 focus:ring-0" style={{ color: FOOD.ink }} />
        </form>
        <div className="flex shrink-0 items-center gap-3">
          <EnlaceTienda href={`/tienda/${slug}/seguimiento`} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm" style={{ color: FOOD.ink }} title="Seguir pedido" slug={slug} diseno={diseno}><Icon icon="solar:bell-linear" width={20} /></EnlaceTienda>
          <button type="button" onClick={onOpenCart} className="relative flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-extrabold text-white shadow-md" style={{ backgroundColor: primary }}>
            <Icon icon="solar:bag-3-linear" width={19} /> Carrito
            {count > 0 && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-[11px] font-extrabold" style={{ color: primary }}>{count}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────── Barra inferior (tabs) ──────────────────────── */

export function FoodBottomNav({ slug, active, cp, diseno, ofertas }: { slug: string; active: 'home' | 'menu' | 'orders' | 'offers' | 'profile'; cp: string; diseno?: any; ofertas?: ItemMenu | null }) {
  const primary = foodPrimary(cp);
  const ir = useIrEnTienda(slug, diseno);
  const go = (path: string, externo = false) => {
    if (externo) { window.open(path, '_blank', 'noopener,noreferrer'); return; }
    ir(path);
  };
  const tabs: { key: any; label: string; icon: string; path: string; externo?: boolean }[] = [
    { key: 'home', label: 'Inicio', icon: 'solar:home-2-linear', path: `/tienda/${slug}` },
    { key: 'menu', label: 'Menú', icon: 'solar:widget-5-linear', path: `/tienda/${slug}/catalogo` },
    { key: 'orders', label: 'Pedidos', icon: 'solar:bag-check-linear', path: `/tienda/${slug}/checkout` },
    ...(ofertas ? [{ key: 'offers', label: ofertas.label, icon: 'solar:tag-price-linear', path: ofertas.href as string, externo: ofertas.externo }] : []),
    { key: 'profile', label: 'Perfil', icon: 'solar:user-linear', path: `/tienda/${slug}/contacto` },
  ];
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center lg:hidden">
      <div className="pointer-events-auto mx-auto mb-3 flex w-[calc(100%-24px)] max-w-[456px] items-center justify-between rounded-[26px] bg-white px-3 py-2.5 shadow-[0_14px_40px_-12px_rgba(42,33,28,0.4)]">
        {tabs.map((t) => {
          const isActive = active === t.key;
          if (t.key === 'orders') {
            return (
              <button key={t.key} type="button" onClick={() => go(t.path, t.externo)} className="-mt-7 flex h-14 w-14 flex-col items-center justify-center rounded-full text-white shadow-lg" style={{ backgroundColor: primary }}>
                <Icon icon={t.icon} width={24} />
              </button>
            );
          }
          return (
            <button key={t.key} type="button" onClick={() => go(t.path, t.externo)} className="flex flex-1 flex-col items-center gap-0.5">
              <Icon icon={isActive ? t.icon.replace('-linear', '-bold') : t.icon} width={22} style={{ color: isActive ? primary : FOOD.muted }} />
              <span className="text-[10px] font-bold" style={{ color: isActive ? primary : FOOD.muted }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── WhatsApp flotante (sobre la barra inferior) ── */
export function FoodWhatsAppFab({ tienda }: { tienda: any }) {
  return (
    <a href={waLink(tienda)} target="_blank" rel="noreferrer" className="fixed bottom-[88px] right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg lg:bottom-6 lg:right-6 lg:h-14 lg:w-14" style={{ backgroundColor: '#25D366' }} aria-label="WhatsApp">
      <Icon icon="mdi:whatsapp" width={26} />
    </a>
  );
}

/* ─────────────────────────────────── Footer ─────────────────────────────── */

export function FoodFooter({ tienda, slug, diseno, cp, categories = [] }: { tienda: any; slug: string; diseno?: any; cp: string; categories?: any[] }) {
  const primary = foodPrimary(cp);
  const name = storeName(tienda, diseno);
  const email = diseno?.comidaAppContactEmail || tienda?.email || tienda?.correo || '';
  const phone = diseno?.comidaAppContactPhone || tienda?.whatsappTienda || tienda?.telefono || '';
  const address = diseno?.comidaAppContactAddress || tienda?.direccionTienda || tienda?.direccion || '';
  const hours = diseno?.comidaAppContactHours || 'Lun a Dom · 11:00 – 23:00';
  const cats = categories.map((c) => (typeof c === 'string' ? c : c?.nombre)).filter(Boolean).slice(0, 5);
  // Redes: solo las que tienen enlace (antes Instagram/Facebook/TikTok iban a "#").
  const urlRed = (u?: string) => { const s = String(u || '').trim(); return !s ? '' : /^https?:\/\//i.test(s) ? s : s.includes('.') ? `https://${s}` : ''; };
  const redes = [
    { ic: 'mdi:instagram', url: urlRed(tienda?.instagramUrl) },
    { ic: 'mdi:facebook', url: urlRed(tienda?.facebookUrl) },
    { ic: 'mdi:whatsapp', url: waLink(tienda) },
    { ic: 'ic:baseline-tiktok', url: urlRed(tienda?.tiktokUrl) },
  ].filter((r) => r.url);

  return (
    <footer className="mt-8 w-full text-white" style={{ backgroundColor: FOOD.ink }}>
      <div className="mx-auto max-w-6xl px-6 pb-28 pt-10 lg:px-8 lg:pb-10">
        <div className="grid gap-8 md:grid-cols-[1.6fr_1fr_1fr_1.3fr]">
          <div>
            <div className="flex items-center gap-2.5">
              {tienda?.logo ? <img src={tienda.logo} alt={name} className="h-9 object-contain" /> : <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: primary }}><Icon icon="mdi:silverware-fork-knife" width={20} /></span>}
              <span className="text-lg font-extrabold">{name}</span>
            </div>
            <p className="mt-4 max-w-xs text-[13px] leading-6 text-white/60">{diseno?.comidaAppFooterText || tienda?.descripcionTienda || 'Comida recién hecha, con ingredientes frescos y mucho sabor. Pide en minutos y disfruta.'}</p>
            <div className="mt-5 flex gap-2.5">
              {redes.map(({ ic, url }) => (
                <a key={ic} href={url} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20"><Icon icon={ic} width={17} /></a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-[12px] font-extrabold uppercase tracking-wide text-white/80">Menú</h4>
            <div className="space-y-2 text-[13px] text-white/60">
              {cats.length ? cats.map((c) => (<EnlaceTienda key={c} href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`} className="block transition-colors hover:text-white" slug={slug} diseno={diseno}>{c}</EnlaceTienda>)) : <EnlaceTienda href={`/tienda/${slug}/catalogo`} className="block transition-colors hover:text-white" slug={slug} diseno={diseno}>Ver menú</EnlaceTienda>}
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-[12px] font-extrabold uppercase tracking-wide text-white/80">Ayuda</h4>
            <div className="space-y-2 text-[13px] text-white/60">
              <EnlaceTienda href={`/tienda/${slug}/seguimiento`} className="block transition-colors hover:text-white" slug={slug} diseno={diseno}>Seguir pedido</EnlaceTienda>
              <EnlaceTienda href={`/tienda/${slug}/catalogo`} className="block transition-colors hover:text-white" slug={slug} diseno={diseno}>Menú completo</EnlaceTienda>
              <EnlaceTienda href={`/tienda/${slug}/contacto`} className="block transition-colors hover:text-white" slug={slug} diseno={diseno}>Contacto</EnlaceTienda>
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-[12px] font-extrabold uppercase tracking-wide text-white/80">Contacto</h4>
            <div className="space-y-1.5 text-[13px] text-white/60">
              {address && <p className="flex items-start gap-2"><Icon icon="solar:map-point-linear" width={15} className="mt-0.5 shrink-0" /> {address}</p>}
              {phone && <p className="flex items-center gap-2"><Icon icon="solar:phone-linear" width={15} /> {phone}</p>}
              {email && <p className="flex items-center gap-2"><Icon icon="solar:letter-linear" width={15} /> {email}</p>}
              <p className="flex items-center gap-2"><Icon icon="solar:clock-circle-linear" width={15} /> {hours}</p>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-5 text-xs text-white/40 md:flex-row">
          <span>© 2026 {name}. Todos los derechos reservados.</span>
          <span>Powered by {BRAND.name}</span>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────── Shell (columna app) ────────────────────────── */

export function FoodShell({ children, slug, active, cp, diseno, tienda, carrito, onOpenCart, categories = [] }: { children: React.ReactNode; slug: string; active: 'home' | 'menu' | 'orders' | 'offers' | 'profile'; cp: string; diseno?: any; tienda?: any; carrito?: any[]; onOpenCart?: () => void; categories?: any[] }) {
  // "Ofertas" (header web y barra inferior): destino configurable; oculto si el dueño eligió "Sin enlace".
  const categoriasMenu = useCategoriasTienda(slug, categories);
  const ofertas = useMemo(() => itemsDeMenu(COMIDA_APP_MENU, { diseno, slug, categorias: categoriasMenu })[0] ?? null, [diseno, slug, categoriasMenu]);
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: FOOD.cream, fontFamily: foodFont(diseno) }}>
      <FoodWebHeader tienda={tienda} slug={slug} diseno={diseno} cp={cp} carrito={carrito} onOpenCart={onOpenCart} active={active} ofertas={ofertas} />
      <div className="relative mx-auto w-full max-w-[480px] px-0 pb-6 lg:max-w-6xl lg:px-8 lg:pb-6">{children}</div>
      <FoodFooter tienda={tienda} slug={slug} diseno={diseno} cp={cp} categories={categories} />
      <FoodWhatsAppFab tienda={tienda} />
      <FoodBottomNav slug={slug} active={active} cp={cp} diseno={diseno} ofertas={ofertas} />
    </div>
  );
}

/* ─────────────────────────── Carrito (bottom sheet) ─────────────────────── */

export function FoodCartModal({
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
  const primary = foodPrimary(cp);
  const money = (v: number) => `S/ ${Number(v || 0).toFixed(2)}`;
  const total = carrito.reduce((acc, item) => acc + Number(item.precioUnitario || item.precio || 0) * Number(item.cantidad || 1), 0);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center" style={{ fontFamily: FOOD.sans }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/45" />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative flex max-h-[85vh] w-full max-w-[480px] flex-col rounded-t-[28px] bg-white"
          >
            <div className="flex items-center justify-between px-5 pb-3 pt-4">
              <h3 className="text-[17px] font-extrabold" style={{ color: FOOD.ink }}>Tu pedido</h3>
              <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: FOOD.cream, color: FOOD.ink }}><Icon icon="solar:close-linear" width={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-5">
              {carrito.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <Icon icon="solar:bag-cross-linear" className="text-5xl" style={{ color: FOOD.muted }} />
                  <p className="mt-3 text-sm font-semibold" style={{ color: FOOD.soft }}>Tu carrito está vacío.</p>
                </div>
              ) : (
                carrito.map((item) => {
                  const itemId = item.cartId || item.id;
                  const qty = Number(item.cantidad || 1);
                  const price = Number(item.precioUnitario || item.precio || 0);
                  return (
                    <div key={itemId} className="flex items-center gap-3 border-b py-3.5" style={{ borderColor: FOOD.line }}>
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl" style={{ backgroundColor: FOOD.peach }}><FoodProductImage producto={item} /></div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-bold" style={{ color: FOOD.ink }}>{item.descripcion}</p>
                        <p className="mt-0.5 text-sm font-extrabold" style={{ color: primary }}>{money(price * qty)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => actualizarCantidad(itemId, qty - 1)} className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: FOOD.cream, color: FOOD.ink }}><Icon icon="solar:minus-linear" width={14} /></button>
                        <span className="w-5 text-center text-sm font-bold" style={{ color: FOOD.ink }}>{qty}</span>
                        <button type="button" onClick={() => actualizarCantidad(itemId, qty + 1)} className="flex h-7 w-7 items-center justify-center rounded-full text-white" style={{ backgroundColor: primary }}><Icon icon="solar:add-linear" width={14} /></button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {carrito.length > 0 && (
              <div className="px-5 pb-6 pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ color: FOOD.soft }}>Total</span>
                  <span className="text-xl font-extrabold" style={{ color: FOOD.ink }}>{money(total)}</span>
                </div>
                <motion.button whileTap={foodTap} type="button" onClick={onCheckout} className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-extrabold text-white shadow-lg" style={{ backgroundColor: primary }}>
                  Continuar al pago <Icon icon="solar:arrow-right-linear" width={18} />
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
