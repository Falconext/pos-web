import { useEffect, useState, type CSSProperties } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { getProductPricing } from '@/templates/shared/pricing';
import { readableText } from '@/templates/shared/color';
import { getFashionColors, getFashionSizes } from '@/templates/urbano/fashionVariants';
import ProductCardActions from '@/components/tienda/ProductCardActions';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { mix, stEase } from './motion';

/**
 * Piezas base de la plantilla Zapatos (Stride): tema, header, footer, tarjeta y carrito.
 * Regla de la plantilla: nada inventado. Si un dato no existe en la tienda, la UI se oculta.
 */

export const stMoney = (v: any) => `S/ ${Number(v || 0).toFixed(2)}`;
export const editable = (v: any, fallback: string) => String(v || '').trim() || fallback;
export const storeNameOf = (tienda: any, fallback = 'Stride') => tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || fallback;
export const nameOf = (v: any): string => (v && typeof v === 'object' ? v.nombre || v.descripcion || '' : typeof v === 'string' ? v : '');

/** Luminancia relativa (0–1) de un hex; null si no es un hex válido. */
function luminance(color: string): number | null {
  let hex = String(color || '').trim().replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const lin = (i: number) => { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(0) + 0.7152 * lin(2) + 0.0722 * lin(4);
}

const BASE_BG = '#F4F2EC'; // beige cálido de la referencia

// ── Design tokens (oliva + beige cálido de la referencia, tinta y stone del design system) ──
export function strideTheme(diseno: any) {
  const primary = diseno?.colorPrimario || '#4B5237'; // oliva profundo (CTA, marca)
  const accent = diseno?.colorAccento || '#B45A3C';   // terracota (ofertas, destacados)
  // "Color de fondo" global: si es claro se usa tal cual; si es saturado u oscuro se usa como tinte
  // sobre el beige base, para que el texto oscuro y las tarjetas blancas sigan siendo legibles.
  const rawBg = String(diseno?.colorSecundario || '').trim();
  const bgLum = luminance(rawBg);
  const bg = !rawBg ? BASE_BG : bgLum !== null && bgLum < 0.78 ? mix(rawBg, 10, BASE_BG) : rawBg;
  const ink = '#1C1917';
  const primaryLum = luminance(primary);
  return {
    primary,
    /** Principal usado como texto/ícono sobre fondo claro: si es muy claro, cae a tinta para ser legible. */
    primaryInk: primaryLum !== null && primaryLum > 0.45 ? ink : primary,
    accent,
    bg,
    ink,
    muted: '#78716C',
    card: '#FFFFFF',
    soft: mix(ink, 4, bg),      // fondo de imagen de producto
    softer: mix(primary, 5, bg),
    line: mix(ink, 10, bg),
    onPrimary: readableText(primary),
    onAccent: readableText(accent),
    font: `'${diseno?.tipografia || 'Montserrat'}', 'Segoe UI', system-ui, sans-serif`,
    display: `'Archivo', '${diseno?.tipografia || 'Montserrat'}', system-ui, sans-serif`,
  };
}
export type Theme = ReturnType<typeof strideTheme>;

/** Estilo de los titulares: grotesca ancha en mayúsculas (como la referencia). */
export const displayStyle = (t: Theme, extra?: CSSProperties): CSSProperties => ({ fontFamily: t.display, fontStretch: '118%', ...extra });

/** Inyecta Archivo (eje de ancho) + Montserrat una sola vez. */
export function useStrideFont() {
  useEffect(() => {
    const id = 'stride-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,500..900&family=Montserrat:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  }, []);
}

/** Rango de tallas real a partir de las opciones del producto ("35–44", "S · M · L"). */
export function sizeLabel(producto: any): string {
  const sizes = getFashionSizes(producto);
  if (!sizes.length) return '';
  const nums = sizes.map((s) => Number(String(s).replace(',', '.')));
  if (nums.every((n) => Number.isFinite(n))) {
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    return min === max ? String(min) : `${min}–${max}`;
  }
  return sizes.length <= 4 ? sizes.join(' · ') : `${sizes[0]}–${sizes[sizes.length - 1]}`;
}

/** Rating real del producto: "★ 4.8" o "Nuevo" si aún no tiene reseñas. */
export function RatingChip({ producto, t, size = 12 }: { producto: any; t: Theme; size?: number }) {
  const rating = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const count = Number(producto?.ratingCount || producto?.reviewsCount || 0);
  if (!(rating > 0 && count > 0)) return <span className="text-[11px] font-semibold" style={{ color: t.muted }}>Nuevo</span>;
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-bold" style={{ color: t.ink }}>
      <Icon icon="solar:star-bold" width={size} style={{ color: '#E0A526' }} />
      {rating.toFixed(1)}
      <span className="font-medium" style={{ color: t.muted }}>({count})</span>
    </span>
  );
}

/** Isotipo genérico (dos trazos de movimiento), se usa solo si la tienda no subió logo. */
export function StrideMark({ color, size = 34 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size * 0.62} viewBox="0 0 52 32" fill="none" aria-hidden>
      <path d="M2 26 C 16 24, 30 14, 50 3" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <path d="M8 30 C 20 29, 34 23, 46 15" stroke={color} strokeWidth="3.2" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

function Logo({ tienda, diseno, t, onClick, light = false }: { tienda: any; diseno: any; t: Theme; onClick?: () => void; light?: boolean }) {
  const name = editable(diseno?.zapatosLogoText, storeNameOf(tienda));
  const tagline = String(diseno?.zapatosLogoTagline ?? '').trim();
  const color = light ? '#fff' : t.ink;
  const content = tienda?.logo ? (
    <img src={tienda.logo} alt={name} className="h-10 w-auto max-w-[170px] object-contain" />
  ) : (
    <span className="flex items-center gap-2.5">
      <StrideMark color={light ? '#fff' : t.primaryInk} />
      <span className="flex flex-col leading-none">
        <span className="max-w-[190px] truncate text-[17px] font-extrabold uppercase tracking-[0.02em]" style={displayStyle(t, { color })}>{name}</span>
        {tagline && <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.28em]" style={{ color: light ? 'rgba(255,255,255,.7)' : t.muted }}>{tagline}</span>}
      </span>
    </span>
  );
  return onClick ? <button type="button" onClick={onClick} className="flex shrink-0 items-center">{content}</button> : <div className="flex shrink-0 items-center">{content}</div>;
}

// ─────────────────────────────────────────────────────────────── Header ──
/** Header con estado propio (menú móvil) aislado: abrirlo no re-renderiza la página. */
export function StrideHeader({ tienda, slug, diseno, categories, t, cartCount, favCount, onOpenCart, onOpenFav, navigate }: any) {
  const [open, setOpen] = useState(false);
  const cats: string[] = (categories || []).slice(0, 3);
  const nav: { label: string; to: string }[] = [
    { label: editable(diseno?.zapatosNavHome, 'Inicio'), to: `/tienda/${slug}` },
    { label: editable(diseno?.zapatosNavShop, 'Catálogo'), to: `/tienda/${slug}/catalogo` },
    ...cats.map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })),
    { label: editable(diseno?.zapatosNavContact, 'Contacto'), to: `/tienda/${slug}/contacto` },
  ];
  const go = (to: string) => { setOpen(false); navigate(to); };
  const announcement = String(diseno?.zapatosAnnouncement ?? '').trim();

  return (
    <header className="sticky top-0 z-30">
      {announcement && (
        <div className="px-4 py-2 text-center text-[11.5px] font-semibold tracking-wide" style={{ background: t.primary, color: t.onPrimary }}>{announcement}</div>
      )}
      <div className="border-b backdrop-blur-md" style={{ borderColor: t.line, background: mix(t.bg, 88, 'transparent') }}>
        <div className="mx-auto flex h-[72px] max-w-[1320px] items-center gap-6 px-4 lg:px-8">
          <Logo tienda={tienda} diseno={diseno} t={t} onClick={() => go(`/tienda/${slug}`)} />

          <nav className="mx-auto hidden items-center gap-1 lg:flex" aria-label="Principal">
            {nav.map((item, i) => (
              <button key={`${item.label}-${i}`} type="button" onClick={() => go(item.to)} className="rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-black/[0.05]" style={{ color: t.ink }}>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <button type="button" onClick={onOpenFav} aria-label="Favoritos" className="relative flex h-11 items-center gap-2 rounded-full border bg-white/70 px-3.5 text-[13px] font-semibold transition-colors hover:bg-white sm:px-4" style={{ borderColor: t.line, color: t.ink }}>
              <Icon icon="solar:heart-linear" width={19} />
              <span className="hidden sm:inline">Favoritos</span>
              {favCount > 0 && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold" style={{ background: t.accent, color: t.onAccent }}>{favCount}</span>}
            </button>
            <button type="button" onClick={onOpenCart} aria-label="Carrito" className="relative flex h-11 items-center gap-2 rounded-full pl-3.5 pr-2 text-[13px] font-semibold transition-transform hover:scale-[1.02] sm:pl-4" style={{ background: t.primary, color: t.onPrimary }}>
              <Icon icon="solar:cart-large-2-linear" width={19} />
              <span className="hidden sm:inline">Carrito</span>
              <span className="flex h-7 min-w-[28px] items-center justify-center rounded-full bg-white/90 px-1.5 text-[11px] font-bold" style={{ color: t.ink }}>{cartCount}</span>
            </button>
            <button type="button" onClick={() => setOpen((v) => !v)} aria-label="Menú" aria-expanded={open} className="flex h-11 w-11 items-center justify-center rounded-full border bg-white/70 lg:hidden" style={{ borderColor: t.line, color: t.ink }}>
              <Icon icon={open ? 'solar:close-circle-linear' : 'solar:hamburger-menu-linear'} width={22} />
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.nav initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: stEase }} className="border-t px-4 pb-4 pt-2 lg:hidden" style={{ borderColor: t.line }} aria-label="Menú móvil">
              {nav.map((item, i) => (
                <button key={`${item.label}-m-${i}`} type="button" onClick={() => go(item.to)} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[14px] font-semibold hover:bg-black/[0.04]" style={{ color: t.ink }}>
                  {item.label}
                  <Icon icon="solar:alt-arrow-right-linear" width={16} style={{ color: t.muted }} />
                </button>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────── Trust bar ──
export type Service = { icon: string; label: string; sub: string };

/** Beneficios derivados de la configuración real de la tienda (nada de promesas inventadas). */
export function buildServices(tienda: any, hasWhatsapp = false): Service[] {
  const s: Service[] = [];
  const envio = Number(tienda?.costoEnvioFijo || 0);
  if (tienda?.aceptaEnvio !== false) s.push({ icon: 'solar:delivery-linear', label: 'Envío a domicilio', sub: envio > 0 ? `Desde ${stMoney(envio)}` : 'Costo al finalizar tu compra' });
  if (tienda?.aceptaRecojo) {
    const min = Number(tienda?.tiempoPreparacionMin || 0);
    s.push({ icon: 'solar:shop-2-linear', label: 'Recojo en tienda', sub: min > 0 ? `Listo en ~${min} min` : 'Sin costo de envío' });
  }
  s.push({ icon: 'solar:shield-check-linear', label: 'Compra segura', sub: 'Confirmas antes de pagar' });
  if (hasWhatsapp) s.push({ icon: 'solar:chat-round-dots-linear', label: 'Asesoría de talla', sub: 'Te ayudamos por WhatsApp' });
  s.push({ icon: 'solar:map-arrow-square-linear', label: 'Seguimiento', sub: 'Código para tu pedido' });
  return s.slice(0, 4);
}

// ─────────────────────────────────────────────────────────────── Footer ──
export function StrideFooter({ tienda, slug, diseno, t, categories, navigate }: any) {
  const storeName = storeNameOf(tienda);
  const wa = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const waUrl = buildStorePurchaseWhatsappUrl(wa, 'Hola, tengo una consulta.');
  const address = [tienda?.direccion, tienda?.distrito].filter(Boolean).join(', ');
  const horario = String(tienda?.horarioAtencion || '').trim();
  const socials = [
    tienda?.instagramUrl ? { icon: 'mdi:instagram', label: 'Instagram', url: tienda.instagramUrl } : null,
    tienda?.facebookUrl ? { icon: 'ic:baseline-facebook', label: 'Facebook', url: tienda.facebookUrl } : null,
    tienda?.tiktokUrl ? { icon: 'ic:baseline-tiktok', label: 'TikTok', url: tienda.tiktokUrl } : null,
    waUrl ? { icon: 'ic:baseline-whatsapp', label: 'WhatsApp', url: waUrl } : null,
  ].filter(Boolean) as { icon: string; label: string; url: string }[];
  const cats: string[] = (categories || []).slice(0, 6);
  const cols: { title: string; items: { label: string; to: string }[] }[] = [
    ...(cats.length ? [{ title: 'Catálogo', items: [...cats.map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })), { label: 'Ver todo', to: `/tienda/${slug}/catalogo` }] }] : []),
    { title: 'Tienda', items: [
      { label: 'Inicio', to: `/tienda/${slug}` },
      { label: 'Catálogo', to: `/tienda/${slug}/catalogo` },
      { label: 'Seguimiento de pedido', to: `/tienda/${slug}/seguimiento` },
    ] },
    { title: 'Ayuda', items: [
      { label: 'Contacto', to: `/tienda/${slug}/contacto` },
      { label: 'Preguntas frecuentes', to: `/tienda/${slug}/contacto#faq` },
    ] },
  ];
  const about = String(diseno?.zapatosFooterText || tienda?.descripcionTienda || '').trim();

  return (
    <footer className="mt-10 border-t" style={{ borderColor: t.line, background: t.bg }}>
      <div className="mx-auto grid max-w-[1320px] gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)] lg:px-8">
        <div>
          <Logo tienda={tienda} diseno={diseno} t={t} />
          {about && <p className="mt-5 max-w-xs whitespace-pre-line text-[13px] leading-relaxed" style={{ color: t.muted }}>{about}</p>}
          {socials.length > 0 && (
            <div className="mt-6 flex gap-2">
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-10 w-10 items-center justify-center rounded-full border bg-white transition-colors hover:bg-black/[0.03]" style={{ borderColor: t.line, color: t.ink }}>
                  <Icon icon={s.icon} width={18} />
                </a>
              ))}
            </div>
          )}
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="text-[12px] font-extrabold uppercase tracking-[0.08em]" style={displayStyle(t, { color: t.ink })}>{col.title}</h4>
            <ul className="mt-5 space-y-3 text-[13px]" style={{ color: t.muted }}>
              {col.items.map((it) => (
                <li key={it.label}><button type="button" onClick={() => navigate(it.to)} className="text-left transition-colors hover:text-stone-900">{it.label}</button></li>
              ))}
            </ul>
          </div>
        ))}
        {(address || horario) && (
          <div>
            <h4 className="text-[12px] font-extrabold uppercase tracking-[0.08em]" style={displayStyle(t, { color: t.ink })}>Visítanos</h4>
            <ul className="mt-5 space-y-3 text-[13px]" style={{ color: t.muted }}>
              {address && <li className="flex gap-2"><Icon icon="solar:map-point-linear" width={16} className="mt-0.5 shrink-0" />{address}</li>}
              {horario && <li className="flex gap-2"><Icon icon="solar:clock-circle-linear" width={16} className="mt-0.5 shrink-0" />{horario}</li>}
            </ul>
          </div>
        )}
      </div>
      <div className="border-t" style={{ borderColor: t.line }}>
        <p className="mx-auto max-w-[1320px] px-4 py-5 text-[12px] lg:px-8" style={{ color: t.muted }}>© {new Date().getFullYear()} {storeName}. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────── Product card ──
/**
 * Tarjeta de producto. Estado propio (cantidad) aislado en la tarjeta.
 * Con variantes (talla/color) no agrega a ciegas: lleva a elegir la talla en la ficha.
 */
export function StrideProductCard({ producto, slug, t, onOpen, onAdd }: { producto: any; slug: string; t: Theme; onOpen: () => void; onAdd: (qty: number) => void }) {
  const pricing = getProductPricing(producto);
  const stock = Number(producto?.stock ?? 1);
  const isOut = stock <= 0;
  const hasVariants = Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const sizes = sizeLabel(producto);
  const colors = getFashionColors(producto).slice(0, 4);
  const subtitle = nameOf(producto?.marca) || nameOf(producto?.categoria);
  const [qty, setQty] = useState(1);

  return (
    <article className="group relative flex h-full cursor-pointer flex-col rounded-[22px] border bg-white p-3 transition-shadow duration-300 hover:shadow-[0_24px_48px_-30px_rgba(28,25,23,0.45)]" style={{ borderColor: t.line }} onClick={onOpen}>
      <div className="absolute left-5 top-5 z-10 flex flex-col items-start gap-1.5">
        {pricing.enOferta && <span className="rounded-full px-2.5 py-1 text-[10.5px] font-bold" style={{ background: mix(t.accent, 14), color: t.accent }}>-{pricing.porcentajeDescuento}%</span>}
        {isOut ? <span className="rounded-full bg-stone-800 px-2.5 py-1 text-[10.5px] font-bold text-white">Agotado</span>
          : !hasVariants && stock <= 5 ? <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10.5px] font-bold" style={{ color: t.ink }}>Últimas {stock}</span> : null}
      </div>
      <div className="absolute right-5 top-5 z-10 [&_button:nth-child(n+2)]:opacity-0 [&_button]:transition-opacity group-hover:[&_button:nth-child(n+2)]:opacity-100 [@media(hover:none)]:[&_button:nth-child(n+2)]:opacity-100" onClick={(e) => e.stopPropagation()}>
        <ProductCardActions producto={producto} slug={slug} cp={t.primary} />
      </div>

      <div className="relative flex aspect-[5/4] items-center justify-center overflow-hidden rounded-[16px]" style={{ background: t.soft }}>
        {producto?.imagenUrl ? (
          <img src={producto.imagenUrl} alt={producto.descripcion} loading="lazy" className={`h-full w-full object-contain p-4 mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.06] ${isOut ? 'opacity-50 grayscale' : ''}`} />
        ) : (
          <Icon icon="mdi:shoe-sneaker" width={72} style={{ color: mix(t.ink, 25, t.bg) }} />
        )}
      </div>

      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3.5">
        <h3 title={producto?.descripcion} className="line-clamp-2 min-h-[34px] text-[12.5px] font-extrabold uppercase leading-[1.35] tracking-[0.01em]" style={displayStyle(t, { color: t.ink, fontStretch: '108%' })}>{producto?.descripcion}</h3>
        <p className="mt-1 min-h-[16px] truncate text-[11.5px]" style={{ color: t.muted }}>{subtitle}</p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[16px] font-extrabold" style={{ color: t.ink }}>{stMoney(pricing.precioFinal)}</span>
            {pricing.enOferta && <span className="text-[11.5px] font-medium line-through" style={{ color: t.muted }}>{stMoney(pricing.precioRegular)}</span>}
          </div>
          <RatingChip producto={producto} t={t} />
        </div>
        {(sizes || colors.length > 0) && (
          <div className="mt-2 flex items-center justify-between gap-2">
            {colors.length > 0 ? (
              <div className="flex -space-x-1">
                {colors.map((c) => <span key={c.name} title={c.name} className="h-3.5 w-3.5 rounded-full ring-2 ring-white" style={{ background: c.hex }} />)}
              </div>
            ) : <span />}
            {sizes && <span className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold" style={{ background: t.soft, color: t.muted }}>Tallas {sizes}</span>}
          </div>
        )}

        <div className="mt-auto flex items-stretch gap-2 pt-3.5" onClick={(e) => e.stopPropagation()}>
          {!hasVariants && !isOut && (
            <div className="flex h-10 w-[76px] shrink-0 items-center justify-between rounded-full border px-1.5 text-[13px] font-bold" style={{ borderColor: t.line }}>
              <button type="button" aria-label="Restar" onClick={() => setQty(Math.max(1, qty - 1))} className="px-1.5 text-base leading-none" style={{ color: t.muted }}>−</button>
              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setQty(d === '' ? 1 : Math.max(1, parseInt(d, 10))); }} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 appearance-none border-0 bg-transparent bg-none p-0 text-center font-bold outline-none focus:ring-0" style={{ color: t.ink }} />
              <button type="button" aria-label="Sumar" onClick={() => setQty(qty + 1)} className="px-1.5 text-base leading-none" style={{ color: t.muted }}>+</button>
            </div>
          )}
          <button
            type="button"
            disabled={isOut}
            onClick={() => { if (isOut) return; if (hasVariants) onOpen(); else onAdd(Math.max(1, qty)); }}
            className="flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-[12.5px] font-bold transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
            style={isOut ? undefined : hasVariants ? { background: t.soft, color: t.ink } : { background: t.primary, color: t.onPrimary }}
          >
            <Icon icon={hasVariants ? 'solar:ruler-angular-linear' : 'solar:cart-plus-linear'} width={16} className="shrink-0" />
            <span className="truncate">{isOut ? 'Agotado' : hasVariants ? 'Elegir talla' : 'Agregar'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────── Cart modal ──
export function StrideCartModal({ isOpen, onClose, carrito, actualizarCantidad, onCheckout, t, tienda, diseno }: any) {
  const items: any[] = carrito || [];
  const total = items.reduce((a, it) => a + Number(it.precioUnitario || 0) * Number(it.cantidad || 1), 0);
  const storeName = storeNameOf(tienda);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const pedirWa = () => {
    if (!items.length) return;
    const detail = items.map((it) => `• ${Number(it.cantidad || 1)} x ${it.descripcion} - ${stMoney(Number(it.precioUnitario || 0) * Number(it.cantidad || 1))}`).join('\n');
    const url = buildStorePurchaseWhatsappUrl(waNumber, `Hola, quiero pedir estos productos en ${storeName}:\n\n${detail}\n\nTotal estimado: ${stMoney(total)}`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(waNumber, 'x'));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button type="button" aria-label="Cerrar carrito" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-[2px]" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 260 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col shadow-2xl" style={{ background: t.bg, fontFamily: t.font }} role="dialog" aria-label="Carrito">
            <header className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: t.line }}>
              <div>
                <h2 className="text-[20px] font-extrabold uppercase" style={displayStyle(t, { color: t.ink })}>Tu carrito</h2>
                <p className="mt-0.5 text-[12.5px]" style={{ color: t.muted }}>{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
              </div>
              <button type="button" aria-label="Cerrar" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border bg-white" style={{ borderColor: t.line, color: t.ink }}><Icon icon="solar:close-circle-linear" width={22} /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {!items.length ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white" style={{ color: t.primaryInk }}><Icon icon="mdi:shoe-sneaker" width={40} /></span>
                  <h3 className="mt-5 text-[16px] font-extrabold uppercase" style={displayStyle(t, { color: t.ink })}>Aún no hay pares aquí</h3>
                  <p className="mt-1.5 max-w-[260px] text-[13px]" style={{ color: t.muted }}>Explora el catálogo y encuentra el par que va con tu ritmo.</p>
                  <button type="button" onClick={onClose} className="mt-6 rounded-full px-6 py-3 text-[13px] font-bold" style={{ background: t.primary, color: t.onPrimary }}>Seguir comprando</button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => {
                    const id = item.cartId || item.id;
                    const qty = Number(item.cantidad || 1);
                    const price = Number(item.precioUnitario || 0);
                    return (
                      <li key={id} className="relative grid grid-cols-[84px_1fr] gap-3 rounded-[18px] border bg-white p-3" style={{ borderColor: t.line }}>
                        <button type="button" aria-label="Quitar" onClick={() => actualizarCantidad(id, 0)} className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-500"><Icon icon="solar:trash-bin-minimalistic-linear" width={16} /></button>
                        <div className="flex h-[84px] items-center justify-center overflow-hidden rounded-[14px]" style={{ background: t.soft }}>
                          {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-1.5 mix-blend-multiply" /> : <Icon icon="mdi:shoe-sneaker" width={32} style={{ color: t.muted }} />}
                        </div>
                        <div className="min-w-0 pr-7">
                          <h3 className="line-clamp-2 text-[12.5px] font-bold leading-snug" style={{ color: t.ink }}>{item.descripcion}</h3>
                          <div className="mt-2.5 flex items-center justify-between">
                            <div className="flex h-9 items-center overflow-hidden rounded-full border" style={{ borderColor: t.line }}>
                              <button type="button" aria-label="Restar" onClick={() => actualizarCantidad(id, qty - 1)} className="flex w-8 items-center justify-center text-base font-bold" style={{ color: t.muted }}>−</button>
                              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); actualizarCantidad(id, d === '' ? 1 : parseInt(d, 10)); }} onFocus={(e) => e.currentTarget.select()} className="w-9 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[13px] font-bold outline-none focus:ring-0" style={{ color: t.ink }} />
                              <button type="button" aria-label="Sumar" onClick={() => actualizarCantidad(id, qty + 1)} className="flex w-8 items-center justify-center text-base font-bold" style={{ color: t.muted }}>+</button>
                            </div>
                            <span className="text-[14.5px] font-extrabold" style={{ color: t.ink }}>{stMoney(price * qty)}</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {items.length > 0 && (
              <footer className="border-t bg-white px-6 py-5" style={{ borderColor: t.line }}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[13px] font-semibold" style={{ color: t.muted }}>Subtotal</span>
                  <span className="text-[22px] font-extrabold" style={{ color: t.ink }}>{stMoney(total)}</span>
                </div>
                <p className="mb-4 text-[11.5px]" style={{ color: t.muted }}>El envío se calcula en el checkout según tu forma de entrega.</p>
                <button type="button" onClick={() => { onClose(); onCheckout(); }} className="flex h-[52px] w-full items-center justify-between rounded-full pl-6 pr-1.5 text-[14px] font-bold" style={{ background: t.primary, color: t.onPrimary }}>
                  Ir a pagar
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90" style={{ color: t.ink }}><Icon icon="solar:arrow-right-linear" width={18} /></span>
                </button>
                {hasWa && (
                  <button type="button" onClick={pedirWa} className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-full border text-[13px] font-semibold" style={{ borderColor: t.line, color: t.ink }}>
                    <Icon icon="ic:baseline-whatsapp" width={19} className="text-[#25D366]" /> Pedir por WhatsApp
                  </button>
                )}
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
