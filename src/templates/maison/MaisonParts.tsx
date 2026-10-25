import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { getProductPricing } from '@/templates/shared/pricing';
import { sinStock, pocasUnidades } from '@/templates/shared/ventaSinStock';
import { getFashionColors } from '@/templates/urbano/fashionVariants';
import ProductCardActions from '@/components/tienda/ProductCardActions';
import { mediosDisponibles, type MedioPagoValue } from '@/components/tienda/MedioPagoSelector';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { AddedToast, FreeShippingProgress, SearchBox, announceAdded, useFreeShipping } from './MaisonExtras';
import { msEase, mix } from './motion';

/**
 * Piezas base de la plantilla Maison (carteras): tema, barra superior, header, footer, tarjeta y carrito.
 * Regla de la plantilla: nada inventado. Si un dato no existe en la tienda, la UI se oculta.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

export const msMoney = (v: any) => `S/ ${Number(v || 0).toFixed(2)}`;
export const editable = (v: any, fallback: string) => String(v || '').trim() || fallback;
export const storeNameOf = (tienda: any, fallback = 'Maison') => tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || fallback;
export const nameOf = (v: any): string => (v && typeof v === 'object' ? v.nombre || v.descripcion || '' : typeof v === 'string' ? v : '');
export const isOn = (v: any) => v === true || v === 'true' || v === '1';
/** Texto opcional: si la clave no existe usa el valor por defecto; si el empresario la vació, se oculta. */
export const optional = (v: any, fallback: string) => (v === undefined || v === null ? fallback : String(v).trim());
/** "Eleva tu|estilo" → saltos de línea (el editor es de una línea). */
export const lines = (s: string) => s.replace(/\s*\|\s*/g, '\n');

/** Luminancia relativa (0–1) de un hex; null si no es un hex válido. */
function luminance(color: string): number | null {
  let hex = String(color || '').trim().replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const lin = (i: number) => { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(0) + 0.7152 * lin(2) + 0.0722 * lin(4);
}

const u = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Fotos de ejemplo (reemplazables en Personalizar). Sin logos de marca visibles. */
export const MAISON_IMG = {
  hero: [u('1606522754091-a3bbf9ad4cb3', 1800), u('1608060434411-0c3fa9049e7b', 1800), u('1622560480605-d83c853bc5c3', 1800)],
  promo: u('1622560480605-d83c853bc5c3', 1200),
  promo2: u('1608060434411-0c3fa9049e7b', 1200),
  catalog: u('1590739225287-bd31519780c3', 1600),
  contact: u('1575032617751-6ddec2089882', 1400),
};

const INK = '#2A2621';
/** Texto sobre un color: el que dé MÁS contraste WCAG (blanco vs tinta). */
function onColor(bg: string): string {
  const L = luminance(bg);
  if (L === null) return '#FFFFFF';
  const vsWhite = 1.05 / (L + 0.05);
  const vsInk = (L + 0.05) / ((luminance(INK) ?? 0.016) + 0.05);
  return vsInk > vsWhite ? INK : '#FFFFFF';
}
/** Color de texto de los botones elegido a mano en el editor, si lo hay. */
function textoBoton(diseno: any): string | null {
  const v = String(diseno?.colorBotonTexto || '').trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) ? v : null;
}
/** Valores por defecto del schema (DisenoRubro): no son una elección de marca → se usan los de la plantilla. */
const SCHEMA_DEFAULTS = { primary: '#6A6CFF', bg: '#FFFFFF', accent: '#FF6B6B' };
const pick = (raw: any, schemaDefault: string, fallback: string) => {
  const v = String(raw || '').trim();
  return !v || v.toUpperCase() === schemaDefault ? fallback : v;
};

// ── Design tokens: cuero coñac + oliva profundo + crema de la referencia; Libre Caslon + Inter ──
export function maisonTheme(diseno: any) {
  const primary = pick(diseno?.colorPrimario, SCHEMA_DEFAULTS.primary, '#8A4B2C'); // coñac (botones, precios, detalles)
  const accent = pick(diseno?.colorAccento, SCHEMA_DEFAULTS.accent, '#3B3A2E');    // oliva profundo (barra, banner, pie)
  const rawBg = pick(diseno?.colorSecundario, SCHEMA_DEFAULTS.bg, '#F6F2EC');       // crema
  const bgLum = luminance(rawBg);
  const bg = bgLum !== null && bgLum < 0.78 ? mix(rawBg, 7, '#FFFFFF') : rawBg;
  const pl = luminance(primary);
  const al = luminance(accent);
  const onPrimary = textoBoton(diseno) ?? onColor(primary);
  /** Superficie oscura (barra superior, banner, pie): el acento; si es claro, se oscurece. */
  const dark = al !== null && al > 0.12 ? mix(accent, 45, '#1E1C17') : accent;
  return {
    primary,
    accent,
    /** Principal/acento como texto sobre fondo claro: si son muy claros, se oscurecen hacia la tinta. */
    primaryInk: pl !== null && pl > 0.22 ? mix(primary, 62, INK) : primary,
    accentInk: al !== null && al > 0.3 ? mix(accent, 48, INK) : accent,
    bg,
    ink: INK,
    muted: '#7A7168',
    line: mix(INK, 10, bg),
    surface: '#FFFFFF',
    /** Tintes cálidos para fotos, bandas y fondos. */
    soft: mix(primary, 7, bg),
    softer: mix(primary, 4, '#FFFFFF'),
    blush: mix(primary, 14, bg),
    accentSoft: mix(accent, 10, '#FFFFFF'),
    card: mix(primary, 6, '#F4EFE8'),
    dark,
    onDark: '#FFFFFF',
    /** Botón sólido coñac (rectangular, como la referencia). */
    gold: primary,
    onPrimary,
    onAccent: textoBoton(diseno) ?? onColor(accent),
    star: '#C2913F',
    font: `'Inter', 'Segoe UI', system-ui, sans-serif`,
    serif: `'Libre Caslon Text', 'Cormorant Garamond', Georgia, 'Times New Roman', serif`,
  };
}
export type Theme = ReturnType<typeof maisonTheme>;

/** Inyecta Libre Caslon Text + Inter una sola vez. */
export function useMaisonFont() {
  useEffect(() => {
    const id = 'maison-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);
}

/** Botón rectangular de la referencia: esquinas suaves, mayúsculas espaciadas. */
export const btnCls = 'inline-flex items-center justify-center gap-2 rounded-[4px] text-[11.5px] font-semibold uppercase tracking-[0.14em] transition-[filter,transform,background-color,color] hover:brightness-[1.07] active:scale-[0.98]';
/** Etiqueta superior de sección (mayúsculas espaciadas). */
export const eyebrowCls = 'text-[11px] font-semibold uppercase tracking-[0.2em]';
/** Botón sólido principal. */
export const goldBtn = (t: Theme): CSSProperties => ({ background: t.primary, color: t.onPrimary });
/** Botón de contorno (EXPLORAR COLECCIÓN). */
export const ghostBtn = (t: Theme): CSSProperties => ({ background: 'transparent', color: t.primaryInk, boxShadow: `inset 0 0 0 1px ${mix(t.primary, 70, 'transparent')}` });

/** Separador de la referencia: línea – rombo – línea bajo los títulos. */
export function Ornament({ color, className = '' }: { color: string; className?: string }) {
  return (
    <span aria-hidden className={`flex items-center gap-1.5 ${className}`} style={{ color }}>
      <span className="h-px w-6" style={{ background: 'currentColor', opacity: 0.55 }} />
      <span className="h-[5px] w-[5px] rotate-45" style={{ boxShadow: 'inset 0 0 0 1px currentColor' }} />
      <span className="h-px w-6" style={{ background: 'currentColor', opacity: 0.55 }} />
    </span>
  );
}

/** Estrellas reales; sin reseñas no se muestra nada. */
export function Rating({ producto, t, size = 12 }: { producto: any; t: Theme; size?: number }) {
  const rating = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const count = Number(producto?.ratingCount || producto?.reviewsCount || 0);
  if (!(rating > 0 && count > 0)) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px]" aria-label={`${rating.toFixed(1)} de 5 (${count} reseñas)`}>
      <span className="flex" style={{ color: t.star }}>{Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon={i < Math.round(rating) ? 'solar:star-bold' : 'solar:star-linear'} width={size} />)}</span>
      <span style={{ color: t.muted }}>({count})</span>
    </span>
  );
}

/** Ícono por palabra clave de la categoría (solo decorativo; la categoría es la real). */
export function categoryIcon(name: string): string {
  const n = String(name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (/mochil|backpack/.test(n)) return 'ph:backpack-light';
  if (/billeter|monedero|tarjeter|wallet/.test(n)) return 'ph:wallet-light';
  if (/maleta|viaje|equipaje|travel/.test(n)) return 'ph:suitcase-rolling-light';
  if (/maletin|portafol|laptop|ejecutiv|oficina/.test(n)) return 'ph:briefcase-light';
  if (/tote|shopper|playa|canasta|tejid/.test(n)) return 'ph:tote-light';
  if (/clutch|sobre|fiesta|noche|cartera de mano/.test(n)) return 'ph:envelope-simple-light';
  if (/riñon|canguro|banano|cintur|correa|cinturon/.test(n)) return 'ph:belt-light';
  if (/lente|gafa|sunglass/.test(n)) return 'ph:sunglasses-light';
  if (/reloj|watch/.test(n)) return 'ph:watch-light';
  if (/joya|collar|arete|pulser|anillo|bisuter/.test(n)) return 'ph:diamond-light';
  if (/bandoler|cruzad|crossbody|bolso|cartera|handbag|bag/.test(n)) return 'ph:handbag-simple-light';
  return 'ph:handbag-light';
}

/** Placeholder para productos sin foto: cartera de línea sobre crema. */
export function NoPhoto({ t, producto, size = 44 }: { t: Theme; producto?: any; size?: number }) {
  return (
    <span className="flex h-full w-full items-center justify-center" style={{ background: `linear-gradient(160deg, ${t.card} 0%, ${t.blush} 100%)` }}>
      <Icon icon={categoryIcon(nameOf(producto?.categoria) || producto?.descripcion)} width={size} style={{ color: mix(t.primaryInk, 45, '#fff') }} />
    </span>
  );
}

export function Logo({ tienda, diseno, t, onClick, light = false }: { tienda: any; diseno: any; t: Theme; onClick?: () => void; light?: boolean }) {
  const name = editable(diseno?.maisonLogoText, storeNameOf(tienda));
  const tagline = optional(diseno?.maisonLogoTagline, '');
  const color = light ? '#fff' : t.ink;
  const content = tienda?.logo ? (
    <img src={tienda.logo} alt={name} className={`h-10 w-auto max-w-[170px] object-contain ${light ? 'rounded bg-white/95 p-1' : ''}`} />
  ) : (
    <span className="flex flex-col items-center leading-none">
      <span className="max-w-[46vw] truncate text-[21px] uppercase tracking-[0.16em] sm:max-w-[240px] sm:text-[24px]" style={{ fontFamily: t.serif, color }}>{name}</span>
      {tagline && <span className="mt-1.5 text-[8.5px] font-medium uppercase tracking-[0.5em]" style={{ color: light ? 'rgba(255,255,255,.7)' : t.muted }}>{tagline}</span>}
    </span>
  );
  return onClick ? <button type="button" onClick={onClick} aria-label={name} className="flex shrink-0 items-center">{content}</button> : <div className="flex shrink-0 items-center">{content}</div>;
}

// ─────────────────────────────────────────────────────────── Beneficios ──
export type Service = { icon: string; label: string; sub: string };

/** Beneficios derivados de la configuración real de la tienda (nada de promesas inventadas). */
export function buildServices(tienda: any, hasWhatsapp = false, freeFrom = 0): Service[] {
  const s: Service[] = [];
  const envio = Number(tienda?.costoEnvioFijo || 0);
  if (tienda?.aceptaEnvio !== false) {
    s.push(freeFrom > 0
      ? { icon: 'solar:delivery-linear', label: 'Envío gratis', sub: `En compras desde ${msMoney(freeFrom)}` }
      : { icon: 'solar:delivery-linear', label: 'Envío a domicilio', sub: envio > 0 ? `Desde ${msMoney(envio)}` : 'Costo al finalizar tu compra' });
  }
  if (tienda?.aceptaRecojo) s.push({ icon: 'solar:shop-2-linear', label: 'Recojo en tienda', sub: 'Sin costo de envío' });
  s.push({ icon: 'solar:shield-check-linear', label: 'Compra segura', sub: 'Confirmas antes de pagar' });
  if (hasWhatsapp) s.push({ icon: 'solar:headphones-round-linear', label: 'Atención personal', sub: 'Te asesoramos por WhatsApp' });
  s.push({ icon: 'solar:map-arrow-square-linear', label: 'Seguimiento', sub: 'Código para tu pedido' });
  return s.slice(0, 5);
}

// ─────────────────────────────────────────────────── Medios de pago reales ──
const PAY_META: Record<MedioPagoValue, { label: string; bg: string; mark: string | null; icon?: string }> = {
  MERCADO_PAGO: { label: 'Mercado Pago', bg: '#009EE3', mark: null, icon: 'simple-icons:mercadopago' },
  YAPE: { label: 'Yape', bg: '#742284', mark: 'yape' },
  PLIN: { label: 'Plin', bg: '#00B4A6', mark: 'plin' },
  TARJETA: { label: 'Tarjeta', bg: '#111827', mark: null, icon: 'solar:card-2-bold' },
  TRANSFERENCIA: { label: 'Transferencia', bg: '#334155', mark: null, icon: 'solar:card-transfer-bold' },
  EFECTIVO: { label: 'Efectivo', bg: '#16A34A', mark: null, icon: 'solar:banknote-2-bold' },
};

/** Medios de pago que la tienda realmente tiene configurados (/payment-config). Carga aislada. */
export function usePaymentMethods(slug: string): MedioPagoValue[] {
  const [medios, setMedios] = useState<MedioPagoValue[]>([]);
  useEffect(() => {
    if (!slug || slug === 'preview') { setMedios([]); return; }
    let alive = true;
    axios.get(`${BASE_URL}/public/store/${slug}/payment-config`)
      .then((r) => { if (alive) setMedios(mediosDisponibles(r.data?.data || r.data)); })
      .catch(() => { if (alive) setMedios([]); });
    return () => { alive = false; };
  }, [slug]);
  return medios;
}

export function PaymentMethods({ slug, t, dark = false }: { slug: string; t: Theme; dark?: boolean }) {
  const medios = usePaymentMethods(slug);
  if (!medios.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {medios.map((m) => {
        const meta = PAY_META[m];
        return (
          <span key={m} title={meta.label} className="inline-flex h-8 items-center gap-1.5 rounded-[4px] px-2.5 text-[11px] font-medium" style={dark ? { background: 'rgba(255,255,255,.07)', color: '#fff', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.12)' } : { background: '#fff', color: t.ink, boxShadow: `inset 0 0 0 1px ${t.line}` }}>
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[8.5px] font-bold text-white" style={{ background: meta.bg }}>{meta.mark ?? <Icon icon={meta.icon!} width={11} />}</span>
            {meta.label}
          </span>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────── Barra superior ──
/** Barra oscura de la referencia: envío gratis REAL a la izquierda, frase editable al centro, seguimiento y ayuda a la derecha. */
function TopBar({ t, slug, diseno, navigate }: { t: Theme; slug: string; diseno: any; navigate: (to: string) => void }) {
  const freeFrom = useFreeShipping(slug);
  const center = optional(diseno?.maisonTopText, 'Diseño atemporal · Hechas para acompañarte');
  const left = freeFrom > 0 ? `Envío gratis desde ${msMoney(freeFrom)}` : '';
  if (isOn(diseno?.maisonTopHidden)) return null;
  return (
    <div className="text-[11.5px]" style={{ background: t.dark, color: 'rgba(255,255,255,.86)' }}>
      <div className="mx-auto grid h-9 max-w-[1320px] grid-cols-1 items-center px-4 md:grid-cols-[1fr_auto_1fr] lg:px-8">
        <span className="hidden items-center gap-2 md:flex">{left && <><Icon icon="solar:delivery-linear" width={15} />{left}</>}</span>
        <span className="flex items-center justify-center gap-2 truncate text-center tracking-[0.04em]">
          {(center || left) && <Icon icon="ph:sparkle-light" width={13} className="shrink-0 opacity-80" />}
          <span className="truncate">{center || left}</span>
          {(center || left) && <Icon icon="ph:sparkle-light" width={13} className="hidden shrink-0 opacity-80 sm:block" />}
        </span>
        <span className="hidden items-center justify-end gap-5 md:flex">
          <button type="button" onClick={() => navigate(`/tienda/${slug}/seguimiento`)} className="inline-flex items-center gap-1.5 transition-colors hover:text-white"><Icon icon="solar:delivery-linear" width={14} />Seguir mi pedido</button>
          <button type="button" onClick={() => navigate(`/tienda/${slug}/contacto`)} className="inline-flex items-center gap-1.5 transition-colors hover:text-white"><Icon icon="solar:headphones-round-linear" width={14} />Ayuda</button>
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── Header ──
/**
 * Header de la referencia: logo a la izquierda, navegación centrada en mayúsculas con desplegable de
 * categorías, buscador/favoritos/carrito a la derecha. Estado propio (panel, sombra) aislado aquí.
 */
export function MaisonHeader({ tienda, slug, diseno, categories, t, cartCount, favCount, onOpenCart, onOpenFav, navigate, active, activeCategory }: any) {
  const [panel, setPanel] = useState<null | 'search' | 'menu' | 'shop'>(null);
  const [scrolled, setScrolled] = useState(false);
  const cats: string[] = categories || [];
  const go = (to: string) => { setPanel(null); navigate(to); };
  const catUrl = (c: string) => `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`;
  const placeholder = editable(diseno?.maisonSearchPlaceholder, 'Busca carteras, bolsos, colores…');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navCls = 'relative inline-flex items-center gap-1 py-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] transition-colors';
  const underline = (on: boolean) => <span aria-hidden className={`absolute inset-x-0 -bottom-0.5 h-[1.5px] origin-left transition-transform duration-300 ${on ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} style={{ background: t.primary }} />;
  const navBtn = (label: string, key: string, to: string, on: boolean) => (
    <button key={key} type="button" onClick={() => go(to)} className={`group ${navCls}`} style={{ color: on ? t.primaryInk : t.ink }}>
      <span className="block max-w-[150px] truncate">{label}</span>{underline(on)}
    </button>
  );
  const featured = cats.slice(0, 2);

  return (
    <>
      <TopBar t={t} slug={slug} diseno={diseno} navigate={go} />
      <header className="sticky top-0 z-30 transition-shadow duration-300" style={{ background: mix(t.bg, 94, 'transparent'), backdropFilter: 'blur(12px)', boxShadow: scrolled ? '0 12px 30px -24px rgba(42,38,33,.45)' : `inset 0 -1px 0 ${t.line}` }} onMouseLeave={() => panel === 'shop' && setPanel(null)}>
        <div className="mx-auto grid h-[74px] max-w-[1320px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4 lg:grid-cols-[1fr_auto_1fr] lg:px-8">
          <div className="flex items-center gap-1 justify-self-start">
            <button type="button" aria-label="Menú" onClick={() => setPanel(panel === 'menu' ? null : 'menu')} className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-black/[0.04] lg:hidden" style={{ color: t.ink }}><Icon icon={panel === 'menu' ? 'solar:close-square-linear' : 'solar:hamburger-menu-linear'} width={23} /></button>
            <Logo tienda={tienda} diseno={diseno} t={t} onClick={() => go(`/tienda/${slug}`)} />
          </div>
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Principal">
            {navBtn(editable(diseno?.maisonNavHome, 'Inicio'), 'home', `/tienda/${slug}`, active === 'home')}
            <button type="button" aria-expanded={panel === 'shop'} onClick={() => go(`/tienda/${slug}/catalogo`)} onMouseEnter={() => cats.length > 0 && setPanel('shop')} className={`group ${navCls}`} style={{ color: active === 'catalog' && !activeCategory ? t.primaryInk : t.ink }}>
              {editable(diseno?.maisonNavShop, 'Tienda')}{cats.length > 0 && <Icon icon="solar:alt-arrow-down-linear" width={12} />}{underline(active === 'catalog' && !activeCategory)}
            </button>
            {featured.map((c) => navBtn(c, `c-${c}`, catUrl(c), active === 'catalog' && activeCategory === c))}
            {navBtn(editable(diseno?.maisonNavContact, 'Contacto'), 'contact', `/tienda/${slug}/contacto`, active === 'contact')}
          </nav>
          <div className="flex items-center gap-0.5 justify-self-end">
            <IconBtn t={t} label="Buscar" icon="solar:magnifer-linear" onClick={() => setPanel(panel === 'search' ? null : 'search')} />
            <IconBtn t={t} label="Favoritos" icon="solar:heart-linear" onClick={onOpenFav} badge={favCount} />
            <IconBtn t={t} label={`Carrito (${cartCount})`} icon="solar:bag-3-linear" onClick={onOpenCart} badge={cartCount} strong />
          </div>
        </div>

        <AnimatePresence initial={false}>
          {panel === 'shop' && cats.length > 0 && (
            <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-x-0 top-full hidden lg:block">
              <motion.div initial={{ y: -6 }} animate={{ y: 0 }} exit={{ y: -6 }} transition={{ duration: 0.22, ease: msEase }} className="mx-auto max-w-[1320px] px-8">
                <div className="mx-auto grid max-w-[880px] grid-cols-3 gap-x-8 gap-y-1 rounded-b-[6px] bg-white px-8 py-6" style={{ boxShadow: `0 24px 50px -30px rgba(42,38,33,.45), inset 0 0 0 1px ${t.line}` }}>
                  {cats.slice(0, 12).map((c) => (
                    <button key={c} type="button" onClick={() => go(catUrl(c))} className="flex items-center gap-2.5 rounded-[4px] px-2 py-2 text-left text-[13px] transition-colors hover:bg-black/[0.03]" style={{ color: t.ink }}>
                      <Icon icon={categoryIcon(c)} width={18} style={{ color: t.primaryInk }} /><span className="truncate">{c}</span>
                    </button>
                  ))}
                  <button type="button" onClick={() => go(`/tienda/${slug}/catalogo`)} className="col-span-3 mt-2 inline-flex items-center gap-2 border-t pt-4 text-[11.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: t.primaryInk, borderColor: t.line }}>Ver toda la tienda<Icon icon="solar:arrow-right-linear" width={15} /></button>
                </div>
              </motion.div>
            </motion.div>
          )}
          {panel === 'search' && (
            <motion.div key="search" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: msEase }} className="border-t" style={{ borderColor: t.line }}>
              <div className="mx-auto max-w-[760px] px-4 py-3">
                <SearchBox t={t} slug={slug} placeholder={placeholder} className="w-full" onSearch={(v) => go(`/tienda/${slug}/catalogo${v ? `?search=${encodeURIComponent(v)}` : ''}`)} onOpenProduct={(p) => go(`/tienda/${slug}/producto/${p.id}`)} />
              </div>
            </motion.div>
          )}
          {panel === 'menu' && (
            <motion.nav key="menu" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: msEase }} className="border-t px-4 pb-4 pt-2 lg:hidden" style={{ borderColor: t.line }} aria-label="Menú móvil">
              {[
                { label: editable(diseno?.maisonNavHome, 'Inicio'), to: `/tienda/${slug}` },
                { label: editable(diseno?.maisonNavShop, 'Tienda'), to: `/tienda/${slug}/catalogo` },
                ...cats.slice(0, 8).map((c) => ({ label: c, to: catUrl(c) })),
                { label: editable(diseno?.maisonNavContact, 'Contacto'), to: `/tienda/${slug}/contacto` },
                { label: 'Seguir mi pedido', to: `/tienda/${slug}/seguimiento` },
              ].map((it, i) => (
                <button key={`${it.label}-${i}`} type="button" onClick={() => go(it.to)} className="flex w-full items-center justify-between border-b py-3.5 text-left text-[15px] last:border-b-0" style={{ color: t.ink, borderColor: t.line, fontFamily: t.serif }}>
                  {it.label}<Icon icon="solar:alt-arrow-right-linear" width={15} style={{ color: t.muted }} />
                </button>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
      <AddedToast t={t} onOpenCart={onOpenCart} />
    </>
  );
}

function IconBtn({ t, label, icon, onClick, badge = 0, strong = false }: { t: Theme; label: string; icon: string; onClick: () => void; badge?: number; strong?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-black/[0.04]" style={{ color: t.ink }}>
      <Icon icon={icon} width={22} />
      {badge > 0 && <span className="absolute right-1 top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[9.5px] font-semibold tabular-nums" style={strong ? { background: t.primary, color: t.onPrimary } : { background: t.dark, color: '#fff' }}>{badge}</span>}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────── Footer ──
/** Novedades por WhatsApp (no hay registro por correo: nunca simula un alta). Estado aislado. */
function FooterNews({ t, diseno, wa, storeName }: { t: Theme; diseno: any; wa: (msg?: string) => string | null; storeName: string }) {
  const [name, setName] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const who = name.trim() ? `Soy ${name.trim()}. ` : '';
    const url = wa(`Hola${storeName ? ` ${storeName}` : ''}, ${who}quiero recibir sus novedades y nuevas colecciones por WhatsApp.`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <div>
      <h4 className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-white">{editable(diseno?.maisonNewsTitle, 'Novedades')}</h4>
      <p className="mt-4 max-w-[280px] text-[13px] leading-relaxed text-white/65">{editable(diseno?.maisonNewsText, 'Recibe nuevas colecciones e ingresos directo en tu WhatsApp.')}</p>
      <form onSubmit={submit} className="mt-4 flex max-w-[340px] overflow-hidden rounded-[4px] bg-white">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" aria-label="Tu nombre" className="h-11 min-w-0 flex-1 appearance-none border-0 bg-transparent bg-none px-3.5 text-[13px] outline-none placeholder:text-stone-400 focus:ring-0" style={{ color: t.ink }} />
        <button type="submit" className={`${btnCls} h-11 shrink-0 rounded-none px-4`} style={goldBtn(t)}><Icon icon="ic:baseline-whatsapp" width={15} />{editable(diseno?.maisonNewsButton, 'Suscribirme')}</button>
      </form>
    </div>
  );
}

/** Pie oscuro de la referencia: marca + redes, columnas, novedades y barra legal con medios de pago. */
export function MaisonFooter({ tienda, slug, diseno, t, categories, navigate }: any) {
  const storeName = storeNameOf(tienda);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const wa = (msg = '') => buildStorePurchaseWhatsappUrl(waNumber, msg);
  const waUrl = wa('Hola, tengo una consulta.');
  const address = [tienda?.direccion, tienda?.distrito].map((v) => String(v || '').trim()).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  const horario = String(tienda?.horarioAtencion || '').trim();
  const socials = [
    tienda?.facebookUrl ? { icon: 'ic:baseline-facebook', label: 'Facebook', url: tienda.facebookUrl } : null,
    tienda?.instagramUrl ? { icon: 'mdi:instagram', label: 'Instagram', url: tienda.instagramUrl } : null,
    tienda?.tiktokUrl ? { icon: 'ic:baseline-tiktok', label: 'TikTok', url: tienda.tiktokUrl } : null,
    waUrl ? { icon: 'ic:baseline-whatsapp', label: 'WhatsApp', url: waUrl } : null,
  ].filter(Boolean) as { icon: string; label: string; url: string }[];
  const cats: string[] = (categories || []).slice(0, 5);
  const intro = optional(diseno?.maisonFooterText, String(tienda?.descripcionTienda || '').trim() || 'Carteras y accesorios para acompañarte todos los días.');
  const cols: { title: string; items: { label: string; to: string }[] }[] = [
    { title: 'Tienda', items: [{ label: 'Todos los productos', to: `/tienda/${slug}/catalogo` }, ...cats.map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` }))] },
    { title: 'Atención al cliente', items: [
      { label: 'Contacto', to: `/tienda/${slug}/contacto` },
      { label: 'Preguntas frecuentes', to: `/tienda/${slug}/contacto#faq` },
      { label: 'Seguir mi pedido', to: `/tienda/${slug}/seguimiento` },
    ] },
  ];
  const medios = usePaymentMethods(slug);

  return (
    <footer style={{ background: t.dark, color: '#fff' }}>
      <div className="mx-auto grid max-w-[1320px] gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.5fr] lg:px-8">
        <div>
          <Logo tienda={tienda} diseno={diseno} t={t} light />
          {intro && <p className="mt-5 max-w-[260px] whitespace-pre-line text-[13px] leading-relaxed text-white/65">{intro}</p>}
          {socials.length > 0 && (
            <div className="mt-5 flex gap-2">
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20">
                  <Icon icon={s.icon} width={16} />
                </a>
              ))}
            </div>
          )}
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-white">{col.title}</h4>
            <ul className="mt-4 space-y-2.5 text-[13px]">
              {col.items.map((it) => <li key={it.label}><button type="button" onClick={() => navigate(it.to)} className="text-left text-white/65 transition-colors hover:text-white">{it.label}</button></li>)}
            </ul>
          </div>
        ))}
        {(address || horario) ? (
          <div>
            <h4 className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-white">Visítanos</h4>
            <ul className="mt-4 space-y-2.5 text-[13px] text-white/65">
              {address && <li className="flex gap-2"><Icon icon="solar:map-point-linear" width={16} className="mt-0.5 shrink-0" />{address}</li>}
              {horario && <li className="flex gap-2"><Icon icon="solar:clock-circle-linear" width={16} className="mt-0.5 shrink-0" />{horario}</li>}
            </ul>
          </div>
        ) : <div className="hidden lg:block" />}
        {waUrl && !isOn(diseno?.maisonNewsHidden) ? <FooterNews t={t} diseno={diseno} wa={wa} storeName={storeName} /> : <div className="hidden lg:block" />}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-4 px-4 py-5 text-[12px] text-white/55 lg:flex-row lg:px-8">
          <p>© {new Date().getFullYear()} {storeName}. Todos los derechos reservados.</p>
          {medios.length > 0 && <div className="flex flex-wrap items-center justify-center gap-3"><span className="inline-flex items-center gap-1.5"><Icon icon="solar:lock-keyhole-minimalistic-linear" width={15} />Pago seguro con</span><PaymentMethods slug={slug} t={t} dark /></div>}
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────── Product card ──
/**
 * Tarjeta de la referencia (estado de cantidad aislado): foto sobre crema con corazón arriba a la derecha,
 * nombre, precio, estrellas reales y fila de cantidad + "Agregar". Con variantes lleva a elegir en la ficha.
 */
export function MaisonProductCard({ producto, slug, t, onOpen, onAdd }: { producto: any; slug: string; t: Theme; onOpen: () => void; onAdd: (qty: number) => void }) {
  const pricing = getProductPricing(producto);
  const stock = Number(producto?.stock ?? 1);
  const isOut = sinStock(stock);
  const hasVariants = Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const colors = getFashionColors(producto).slice(0, 5);
  const [qty, setQty] = useState(1);
  const [broken, setBroken] = useState(false); // URL de imagen rota en los datos → placeholder

  const add = () => {
    if (isOut) return;
    if (hasVariants) { onOpen(); return; }
    const n = Math.max(1, qty);
    onAdd(n);
    announceAdded(producto, n);
    setQty(1);
  };

  return (
    <article className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[6px] bg-white transition-shadow duration-500 hover:shadow-[0_24px_48px_-30px_rgba(42,38,33,0.5)]" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }} onClick={onOpen}>
      <div className="relative aspect-square overflow-hidden" style={{ background: t.card }}>
        <div className="absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1">
          {pricing.enOferta && <span className="rounded-[3px] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ background: t.primary, color: t.onPrimary }}>-{pricing.porcentajeDescuento}%</span>}
          {!pricing.enOferta && producto?.destacado && <span className="rounded-[3px] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ background: t.dark, color: '#fff' }}>Destacado</span>}
          {isOut ? <span className="rounded-[3px] bg-white/95 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em]" style={{ color: t.muted }}>Agotado</span>
            : !hasVariants && pocasUnidades(stock) ? <span className="rounded-[3px] bg-white/95 px-2 py-1 text-[10px] font-medium" style={{ color: t.primaryInk }}>Quedan {stock}</span> : null}
        </div>
        <div className="absolute right-2 top-2 z-10 [&_button:nth-child(n+2)]:opacity-0 [&_button]:transition-opacity group-hover:[&_button:nth-child(n+2)]:opacity-100 [@media(hover:none)]:[&_button:nth-child(n+2)]:opacity-100" onClick={(e) => e.stopPropagation()}>
          <ProductCardActions producto={producto} slug={slug} cp={t.primary} />
        </div>
        {producto?.imagenUrl && !broken ? (
          <img src={producto.imagenUrl} alt={producto.descripcion} loading="lazy" onError={() => setBroken(true)} className={`h-full w-full object-contain p-2.5 mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-[1.05] ${isOut ? 'opacity-50 grayscale' : ''}`} />
        ) : (
          <NoPhoto t={t} producto={producto} />
        )}
      </div>

      <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3">
        <h3 title={producto?.descripcion} className="line-clamp-2 text-[13.5px] font-semibold leading-snug" style={{ color: t.ink }}>{producto?.descripcion}</h3>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
          <span className="whitespace-nowrap text-[14.5px] font-semibold" style={{ color: t.ink }}>{msMoney(pricing.precioFinal)}</span>
          {pricing.enOferta && <span className="whitespace-nowrap text-[11.5px] line-through" style={{ color: t.muted }}>{msMoney(pricing.precioRegular)}</span>}
        </div>
        <div className="mt-1.5 flex min-h-[14px] flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <Rating producto={producto} t={t} size={11} />
          {colors.length > 0 && <span className="flex gap-1">{colors.map((c) => <span key={c.name} title={c.name} className="h-3 w-3 rounded-full" style={{ background: c.hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.14)' }} />)}</span>}
        </div>

        <div className="mt-auto flex items-center gap-2 pt-3" onClick={(e) => e.stopPropagation()}>
          {!hasVariants && !isOut ? (
            <>
              <div className="flex h-9 min-w-0 flex-1 items-center justify-between rounded-[4px]" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                <button type="button" aria-label="Restar" onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-full w-7 items-center justify-center text-[14px]" style={{ color: t.muted }}>−</button>
                <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setQty(d === '' ? 1 : Math.max(1, parseInt(d, 10))); }} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[12.5px] font-semibold outline-none focus:ring-0" style={{ color: t.ink }} />
                <button type="button" aria-label="Sumar" onClick={() => setQty(qty + 1)} className="flex h-full w-7 items-center justify-center text-[14px]" style={{ color: t.muted }}>+</button>
              </div>
              <button type="button" onClick={add} aria-label="Agregar al carrito" title="Agregar al carrito" className="flex h-9 w-10 shrink-0 items-center justify-center rounded-[4px] transition-[filter,transform] hover:brightness-[1.07] active:scale-95" style={goldBtn(t)}>
                <Icon icon="solar:bag-3-linear" width={17} />
              </button>
            </>
          ) : (
            <button type="button" disabled={isOut} onClick={add} aria-label={isOut ? 'Agotado' : 'Ver opciones'} className={`${btnCls} h-9 min-w-0 flex-1 px-2 text-[10.5px] disabled:cursor-not-allowed disabled:opacity-45`} style={isOut ? { background: t.card, color: t.muted } : ghostBtn(t)}>
              {!isOut && <Icon icon="solar:palette-round-linear" width={15} className="shrink-0" />}
              <span className="truncate">{isOut ? 'Agotado' : 'Ver opciones'}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────── Cart modal ──
export function MaisonCartModal({ isOpen, onClose, carrito, actualizarCantidad, onCheckout, t, tienda, diseno }: any) {
  const { slug = '' } = useParams();
  const items: any[] = carrito || [];
  const total = items.reduce((a, it) => a + Number(it.precioUnitario || 0) * Number(it.cantidad || 1), 0);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(waNumber, 'x'));
  const pedirWa = () => {
    if (!items.length) return;
    const detail = items.map((it) => `• ${Number(it.cantidad || 1)} x ${it.descripcion} - ${msMoney(Number(it.precioUnitario || 0) * Number(it.cantidad || 1))}`).join('\n');
    const url = buildStorePurchaseWhatsappUrl(waNumber, `Hola, quiero pedir en ${storeNameOf(tienda)}:\n\n${detail}\n\nTotal estimado: ${msMoney(total)}`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  const drawerStyle: CSSProperties = { background: t.bg, fontFamily: t.font };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button type="button" aria-label="Cerrar carrito" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-[2px]" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 270 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[430px] flex-col shadow-2xl" style={drawerStyle} role="dialog" aria-label="Carrito">
            <header className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: t.line }}>
              <div>
                <h2 className="text-[24px] leading-none" style={{ color: t.ink, fontFamily: t.serif }}>Tu bolsa</h2>
                <p className="mt-1.5 text-[12.5px]" style={{ color: t.muted }}>{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
              </div>
              <button type="button" aria-label="Cerrar" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/[0.05]" style={{ color: t.ink }}><Icon icon="solar:close-circle-linear" width={22} /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {!items.length ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: t.blush, color: t.primaryInk }}><Icon icon="ph:handbag-light" width={38} /></span>
                  <h3 className="mt-5 text-[22px]" style={{ color: t.ink, fontFamily: t.serif }}>Tu bolsa está vacía</h3>
                  <p className="mt-1.5 max-w-[260px] text-[13px]" style={{ color: t.muted }}>Descubre la pieza que acompañe tu estilo.</p>
                  <button type="button" onClick={onClose} className={`${btnCls} mt-6 h-11 px-7`} style={goldBtn(t)}>Seguir comprando</button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => {
                    const id = item.cartId || item.id;
                    const qty = Number(item.cantidad || 1);
                    const price = Number(item.precioUnitario || 0);
                    return (
                      <li key={id} className="relative grid grid-cols-[84px_1fr] gap-3 rounded-[6px] bg-white p-3" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                        <button type="button" aria-label="Quitar" onClick={() => actualizarCantidad(id, 0)} className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-500"><Icon icon="solar:trash-bin-minimalistic-linear" width={16} /></button>
                        <div className="h-24 overflow-hidden rounded-[4px]" style={{ background: t.card }}>
                          {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-1.5 mix-blend-multiply" /> : <NoPhoto t={t} producto={item} size={28} />}
                        </div>
                        <div className="flex min-w-0 flex-col pr-7">
                          <h3 className="line-clamp-2 text-[13.5px] font-semibold leading-snug" style={{ color: t.ink }}>{item.descripcion}</h3>
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <div className="flex h-9 items-center overflow-hidden rounded-[4px]" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                              <button type="button" aria-label="Restar" onClick={() => actualizarCantidad(id, qty - 1)} className="flex w-8 items-center justify-center" style={{ color: t.muted }}>−</button>
                              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); actualizarCantidad(id, d === '' ? 1 : parseInt(d, 10)); }} onFocus={(e) => e.currentTarget.select()} className="w-8 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[13px] font-semibold outline-none focus:ring-0" style={{ color: t.ink }} />
                              <button type="button" aria-label="Sumar" onClick={() => actualizarCantidad(id, qty + 1)} className="flex w-8 items-center justify-center" style={{ color: t.muted }}>+</button>
                            </div>
                            <span className="text-[14.5px] font-semibold" style={{ color: t.ink }}>{msMoney(price * qty)}</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {items.length > 0 && (
              <footer className="border-t px-6 py-5" style={{ borderColor: t.line, background: t.softer }}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[13px]" style={{ color: t.muted }}>Subtotal</span>
                  <span className="text-[22px] font-semibold" style={{ color: t.ink }}>{msMoney(total)}</span>
                </div>
                <FreeShippingProgress t={t} slug={slug} subtotal={total} />
                <button type="button" onClick={() => { onClose(); onCheckout(); }} className={`${btnCls} h-12 w-full`} style={goldBtn(t)}>
                  Finalizar compra <Icon icon="solar:arrow-right-linear" width={16} />
                </button>
                {hasWa && (
                  <button type="button" onClick={pedirWa} className={`${btnCls} mt-2.5 h-11 w-full bg-white`} style={{ color: t.ink, boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                    <Icon icon="ic:baseline-whatsapp" width={17} className="text-[#25D366]" /> Pedir por WhatsApp
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
