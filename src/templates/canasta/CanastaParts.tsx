import EnlaceLibroReclamaciones from '@/components/tienda/EnlaceLibroReclamaciones';
import { useEffect, useState, type CSSProperties } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { getProductPricing } from '@/templates/shared/pricing';
import { getFashionColors } from '@/templates/urbano/fashionVariants';
import ProductCardActions from '@/components/tienda/ProductCardActions';
import { mediosDisponibles, type MedioPagoValue } from '@/components/tienda/MedioPagoSelector';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { useParams } from 'react-router-dom';
import { AddedToast, FreeShippingProgress, SearchBox, announceAdded } from './CanastaExtras';
import { mix } from './motion';

import { sinStock, pocasUnidades } from '@/templates/shared/ventaSinStock';
/**
 * Piezas base de la plantilla Abarrotes (Canasta): tema, barra superior, header, footer, tarjeta y carrito.
 * Regla de la plantilla: nada inventado. Si un dato no existe en la tienda, la UI se oculta.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

export const caMoney = (v: any) => `S/ ${Number(v || 0).toFixed(2)}`;
export const editable = (v: any, fallback: string) => String(v || '').trim() || fallback;
export const storeNameOf = (tienda: any, fallback = 'Canasta') => tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || fallback;
export const nameOf = (v: any): string => (v && typeof v === 'object' ? v.nombre || v.descripcion || '' : typeof v === 'string' ? v : '');
export const isOn = (v: any) => v === true || v === 'true' || v === '1';
/** Texto opcional: si la clave no existe usa el valor por defecto; si el empresario la vació, se oculta. */
export const optional = (v: any, fallback: string) => (v === undefined || v === null ? fallback : String(v).trim());

/** Luminancia relativa (0–1) de un hex; null si no es un hex válido. */
function luminance(color: string): number | null {
  let hex = String(color || '').trim().replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const lin = (i: number) => { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(0) + 0.7152 * lin(2) + 0.0722 * lin(4);
}


const u = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Fotos de ejemplo (reemplazables en Personalizar). Sin marcas visibles. */
export const CANASTA_IMG = {
  hero: [u('1608686207856-001b95cf60ca', 1400), u('1550989460-0adf9ea622e2', 1400), u('1610348725531-843dff563e2c', 1400)],
  season: u('1566385101042-1a0aa0c1268c', 1200),
  side: u('1619566636858-adf3ef46400b', 800),
  promo: [u('1610832958506-aa56368176cf', 900), u('1557844352-761f2565b576', 900)],
  catalog: u('1542838132-92c53300491e', 1400),
  contact: u('1604719312566-8912e9227c6a', 1400),
};

const INK = '#16251B';
/** Color de texto de los botones elegido a mano en el editor, si lo hay. */
function textoBoton(diseno: any): string | null {
  const v = String(diseno?.colorBotonTexto || '').trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) ? v : null;
}
/**
 * Texto sobre un color. Como la referencia, prefiere blanco sobre verdes medios: blanco si llega a 3:1
 * (texto grande/negrita, WCAG AA); si no (amarillos, pasteles), el de MÁS contraste.
 */
function onColor(bg: string): string {
  const L = luminance(bg);
  if (L === null) return '#FFFFFF';
  const vsWhite = 1.05 / (L + 0.05);
  if (vsWhite >= 3) return '#FFFFFF';
  const vsInk = (L + 0.05) / ((luminance(INK) ?? 0.012) + 0.05);
  return vsInk > vsWhite ? INK : '#FFFFFF';
}
/** Valores por defecto del schema (DisenoRubro): no son una elección de marca → se usan los de la plantilla. */
const SCHEMA_DEFAULTS = { primary: '#6A6CFF', bg: '#FFFFFF', accent: '#FF6B6B' };
const pick = (raw: any, schemaDefault: string, fallback: string) => {
  const v = String(raw || '').trim();
  return !v || v.toUpperCase() === schemaDefault ? fallback : v;
};

// ── Design tokens: verde bosque + amarillo de la referencia; Rubik + Nunito Sans (design system) ──
export function canastaTheme(diseno: any) {
  const primary = pick(diseno?.colorPrimario, SCHEMA_DEFAULTS.primary, '#1F7A3A'); // verde (barra superior, botones, títulos)
  const accent = pick(diseno?.colorAccento, SCHEMA_DEFAULTS.accent, '#FFC23D');    // amarillo (sellos de descuento, estrellas)
  const rawBg = pick(diseno?.colorSecundario, SCHEMA_DEFAULTS.bg, '#FFFFFF');
  const bgLum = luminance(rawBg);
  const bg = bgLum !== null && bgLum < 0.78 ? mix(rawBg, 6, '#FFFFFF') : rawBg;
  const pl = luminance(primary);
  const al = luminance(accent);
  // Verde para texto: si el principal es muy claro se oscurece hacia la tinta.
  const primaryInk = pl !== null && pl > 0.3 ? mix(primary, 45, INK) : primary;
  return {
    primary,
    accent,
    primaryInk,
    accentInk: al !== null && al > 0.4 ? mix(accent, 45, INK) : accent,
    bg,
    ink: INK,
    muted: '#65706A',
    line: mix(INK, 10, bg),
    surface: '#FFFFFF',
    /** Tintes de marca para bandas, círculos y fondos suaves. */
    soft: mix(primary, 8, '#FFFFFF'),
    softer: mix(primary, 4, '#FFFFFF'),
    accentSoft: mix(accent, 22, '#FFFFFF'),
    /** Verde muy oscuro del footer (sigue al color principal). */
    deep: mix(primary, 62, '#08170D'),
    /** Rojo semántico de descuentos (no es color de marca). */
    sale: '#E5484D',
    /** Fondo de las fotos de producto (blanco puro para mix-blend-multiply). */
    card: '#FFFFFF',
    onPrimary: textoBoton(diseno) ?? onColor(primary),
    onAccent: onColor(accent),
    star: '#F5A623',
    font: `'Nunito Sans', 'Segoe UI', system-ui, sans-serif`,
    /** Títulos (se llama "serif" por compatibilidad con las piezas compartidas; es Rubik). */
    serif: `'Rubik', 'Nunito Sans', system-ui, sans-serif`,
    script: `'Caveat', 'Rubik', cursive`,
  };
}
export type Theme = ReturnType<typeof canastaTheme>;

/** Inyecta Rubik + Nunito Sans + Caveat una sola vez. */
export function useCanastaFont() {
  useEffect(() => {
    const id = 'canasta-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Rubik:wght@500;600;700;800&family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700;6..12,800&family=Caveat:wght@600;700&display=swap';
    document.head.appendChild(link);
  }, []);
}

/** Botón de la referencia (esquinas suaves, peso fuerte). */
export const btnCls = 'inline-flex items-center justify-center gap-2 rounded-lg text-[13.5px] font-bold transition-[filter,transform] hover:brightness-110 active:scale-[0.98]';

/** Estrellas reales (5 estrellas + conteo). Sin reseñas → nada. */
export function Rating({ producto, t, size = 12 }: { producto: any; t: Theme; size?: number }) {
  const rating = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const count = Number(producto?.ratingCount || producto?.reviewsCount || 0);
  if (!(rating > 0 && count > 0)) return null;
  const r = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${rating.toFixed(1)} de 5 (${count} reseñas)`}>
      <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon={i < r ? 'solar:star-bold' : 'solar:star-linear'} width={size} style={{ color: i < r ? t.star : t.line }} />)}</span>
      <span className="text-[11px] font-semibold" style={{ color: t.muted }}>({count})</span>
    </span>
  );
}

/** Ícono por palabra clave de la categoría (solo decorativo; la categoría es la real). */
export function categoryIcon(name: string): string {
  const n = String(name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (/fruta|verdura|vegetal|hortaliz|fruver/.test(n)) return 'ph:carrot-light';
  if (/lacteo|leche|queso|yogur|huevo|mantequ/.test(n)) return 'ph:egg-light';
  if (/pan|panader|bolleria|reposter|pastel|galleta/.test(n)) return 'ph:bread-light';
  if (/carne|pollo|cerdo|res|embutid|charcut|chorizo|jamon|pescad|marisc/.test(n)) return 'ph:fish-simple-light';
  if (/bebida|gaseosa|jugo|agua|cerveza|vino|licor|refresco/.test(n)) return 'ph:wine-light';
  if (/snack|golosin|dulce|chocolat|caramel|piqueo/.test(n)) return 'ph:cookie-light';
  if (/limpie|detergen|hogar|lejia|jabon|papel/.test(n)) return 'ph:spray-bottle-light';
  if (/aceite|arroz|azucar|fideo|menestra|abarrot|despensa|conserva|harina|cereal/.test(n)) return 'ph:grains-light';
  if (/bebe|panal|infant/.test(n)) return 'ph:baby-light';
  if (/mascota|perro|gato/.test(n)) return 'ph:paw-print-light';
  if (/creatin|protein|suplement|whey|deport|gym/.test(n)) return 'ph:barbell-light';
  if (/natural|salud|vitamin|hierba|organ/.test(n)) return 'ph:leaf-light';
  if (/cuidado|personal|higien|shampoo|belleza/.test(n)) return 'ph:drop-light';
  if (/congelad|helad/.test(n)) return 'ph:snowflake-light';
  return 'ph:basket-light';
}

/** Placeholder para productos sin foto: ícono de su categoría sobre tinte suave. */
export function NoPhoto({ t, producto, size = 44 }: { t: Theme; producto?: any; size?: number }) {
  return (
    <span className="flex h-full w-full items-center justify-center" style={{ background: t.softer }}>
      <Icon icon={categoryIcon(nameOf(producto?.categoria) || producto?.descripcion)} width={size} style={{ color: mix(t.primaryInk, 45, '#fff') }} />
    </span>
  );
}

/** Unidad de venta real para mostrar bajo el nombre ("Precio por kilogramo"). La unidad genérica no se muestra. */
export function unitLabel(producto: any): string {
  const u = producto?.unidadMedida;
  const code = String(typeof u === 'object' ? u?.codigo : u || '').toUpperCase();
  const name = String(typeof u === 'object' ? u?.nombre : '').trim();
  if (!code || code === 'NIU' || code === 'ZZ' || /^unidad/i.test(name)) return '';
  return name ? `Precio por ${name.toLowerCase()}` : '';
}

/** Logo: imagen de la tienda o hoja + nombre + lema (como la referencia). */
export function Logo({ tienda, diseno, t, onClick, light = false }: { tienda: any; diseno: any; t: Theme; onClick?: () => void; light?: boolean }) {
  const name = editable(diseno?.canastaLogoText, storeNameOf(tienda));
  const tagline = optional(diseno?.canastaLogoTagline, '');
  const content = tienda?.logo ? (
    <span className={light ? 'rounded-lg bg-white px-2 py-1' : ''}><img src={tienda.logo} alt={name} className="h-10 w-auto max-w-[170px] object-contain" /></span>
  ) : (
    <span className="flex items-center gap-2">
      <Icon icon="ph:leaf-fill" width={30} style={{ color: light ? t.accent : t.primary }} />
      <span className="min-w-0 leading-none">
        <span className="block max-w-[200px] truncate text-[22px] font-extrabold tracking-[-0.02em]" style={{ color: light ? '#fff' : t.primaryInk, fontFamily: t.serif }}>{name}</span>
        {tagline && <span className="mt-0.5 block max-w-[200px] truncate text-[11px] font-semibold" style={{ color: light ? 'rgba(255,255,255,.75)' : t.muted }}>{tagline}</span>}
      </span>
    </span>
  );
  return onClick ? <button type="button" onClick={onClick} aria-label={name} className="flex shrink-0 items-center">{content}</button> : <div className="flex shrink-0 items-center">{content}</div>;
}

// ─────────────────────────────────────────────────────────── Beneficios ──
export type Service = { icon: string; label: string; sub: string };

/** Beneficios derivados de la configuración real de la tienda (nada de promesas inventadas). */
export function buildServices(tienda: any, hasWhatsapp = false): Service[] {
  const s: Service[] = [];
  const envio = Number(tienda?.costoEnvioFijo || 0);
  if (tienda?.aceptaEnvio !== false) s.push({ icon: 'solar:delivery-linear', label: 'Delivery a domicilio', sub: envio > 0 ? `Desde ${caMoney(envio)}` : 'Costo al finalizar tu compra' });
  if (tienda?.aceptaRecojo) {
    const min = Number(tienda?.tiempoPreparacionMin || 0);
    s.push({ icon: 'solar:shop-2-linear', label: 'Recojo en tienda', sub: min > 0 ? `Listo en ~${min} min` : 'Sin costo de envío' });
  }
  s.push({ icon: 'solar:card-recive-linear', label: 'Compra segura', sub: 'Confirmas antes de pagar' });
  if (hasWhatsapp) s.push({ icon: 'solar:chat-round-dots-linear', label: 'Atención directa', sub: 'Te respondemos por WhatsApp' });
  s.push({ icon: 'solar:map-arrow-square-linear', label: 'Seguimiento', sub: 'Código para tu pedido' });
  return s.slice(0, 4);
}

/** Umbral REAL de envío gratis (/shipping-config). 0 = no configurado. Caché por sesión. */
const shipCache = new Map<string, Promise<number>>();
export function useFreeShippingFrom(slug: string): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!slug || slug === 'preview') { setN(0); return; }
    if (!shipCache.has(slug)) {
      shipCache.set(slug, axios.get(`${BASE_URL}/public/store/${slug}/shipping-config`)
        .then((r) => Number((r.data?.data || r.data)?.envioGratisDesdeSoles || 0))
        .catch(() => { shipCache.delete(slug); return 0; }));
    }
    let alive = true;
    shipCache.get(slug)!.then((v) => { if (alive) setN(v); });
    return () => { alive = false; };
  }, [slug]);
  return n;
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

/** Medios de pago que la tienda realmente tiene configurados (/payment-config). Carga aislada; sin datos → no se muestra. */
export function PaymentMethods({ slug, t, dark = false }: { slug: string; t: Theme; dark?: boolean }) {
  const [medios, setMedios] = useState<MedioPagoValue[]>([]);
  useEffect(() => {
    if (!slug || slug === 'preview') { setMedios([]); return; }
    let alive = true;
    axios.get(`${BASE_URL}/public/store/${slug}/payment-config`)
      .then((r) => { if (alive) setMedios(mediosDisponibles(r.data?.data || r.data)); })
      .catch(() => { if (alive) setMedios([]); });
    return () => { alive = false; };
  }, [slug]);
  if (!medios.length) return null;
  return (
    <div>
      <h4 className="text-[14px] font-bold" style={{ color: dark ? '#fff' : t.ink, fontFamily: t.serif }}>Medios de pago</h4>
      <div className="mt-4 flex flex-wrap gap-2">
        {medios.map((m) => {
          const meta = PAY_META[m];
          return (
            <span key={m} title={meta.label} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-2.5 text-[11.5px] font-bold shadow-[0_1px_0_rgba(0,0,0,.04)]" style={{ boxShadow: `inset 0 0 0 1px ${t.line}`, color: t.ink }}>
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-[5px] px-1 text-[9.5px] font-black text-white" style={{ background: meta.bg }}>{meta.mark ?? <Icon icon={meta.icon!} width={13} />}</span>
              {meta.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────── Barra superior ──
/** Barra verde de la referencia: mensaje a la izquierda (envío gratis real o beneficio) + accesos reales a la derecha. */
function TopBar({ t, diseno, slug, tienda, go }: { t: Theme; diseno: any; slug: string; tienda: any; go: (to: string) => void }) {
  const freeFrom = useFreeShippingFrom(slug);
  const services = buildServices(tienda);
  const fallback = freeFrom > 0 ? `Envío gratis desde ${caMoney(freeFrom)}` : services[0] ? `${services[0].label} · ${services[0].sub}` : '';
  const lead = optional(diseno?.canastaTopLead, '');
  const text = editable(diseno?.canastaTopText, fallback);
  if (isOn(diseno?.canastaTopHidden) || (!lead && !text)) return null;
  return (
    <div style={{ background: t.primary, color: t.onPrimary }}>
      <div className="mx-auto flex h-9 max-w-[1280px] items-center justify-between gap-4 px-4 text-[12px] lg:px-8">
        <p className="flex min-w-0 items-center gap-2 truncate">
          <Icon icon="ph:leaf-fill" width={15} style={{ color: t.accent }} className="shrink-0" />
          {lead && <strong className="font-extrabold">{lead}</strong>}
          {text && <span className="truncate opacity-90">{text}</span>}
        </p>
        <nav className="hidden shrink-0 items-center text-[12px] font-semibold sm:flex" aria-label="Accesos">
          <button type="button" onClick={() => go(`/tienda/${slug}/seguimiento`)} className="px-3 opacity-90 hover:opacity-100">Seguir mi pedido</button>
          <span className="h-3.5 w-px opacity-40" style={{ background: t.onPrimary }} />
          <button type="button" onClick={() => go(`/tienda/${slug}/contacto`)} className="px-3 opacity-90 hover:opacity-100">Ayuda</button>
          <span className="h-3.5 w-px opacity-40" style={{ background: t.onPrimary }} />
          <span className="pl-3 opacity-90">S/ PEN</span>
        </nav>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── Header ──
/**
 * Header de la referencia: barra verde, logo + buscador con botón verde + ubicación real + "Mi pedido" + carrito
 * con total, y barra de categorías con "Todas las categorías" y "Ofertas". Estado propio aislado aquí.
 * `offersHref`: solo el Home lo pasa cuando hay ofertas reales (ancla a la sección).
 */
export function CanastaHeader({ tienda, slug, diseno, categories, t, cartCount, cartTotal, favCount, onOpenCart, onOpenFav, navigate, active, activeCategory, hideCatBar = false, offersHref }: any) {
  const [drawer, setDrawer] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const cats: string[] = categories || [];
  const go = (to: string) => { setDrawer(false); navigate(to); };
  const catUrl = (c: string) => `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`;
  const placeholder = editable(diseno?.canastaSearchPlaceholder, 'Busca frutas, verduras, lácteos, abarrotes…');
  const barCats = hideCatBar || isOn(diseno?.canastaCatBarHidden) ? [] : cats.slice(0, 7);
  const district = String(tienda?.distrito || '').trim();
  const location = district.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_m: string, sp: string, c: string) => sp + c.toUpperCase());

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const search = (cls: string) => (
    <SearchBox t={t} slug={slug} placeholder={placeholder} className={cls} onSearch={(v) => go(`/tienda/${slug}/catalogo${v ? `?search=${encodeURIComponent(v)}` : ''}`)} onOpenProduct={(p) => go(`/tienda/${slug}/producto/${p.id}`)} />
  );

  const drawerLink = (label: string, to: string, isActive: boolean, icon?: string) => (
    <button key={`${label}-${to}`} type="button" onClick={() => go(to)} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[14.5px] font-bold transition-colors hover:bg-black/[0.04]" style={{ color: isActive ? t.primaryInk : t.ink, background: isActive ? t.soft : undefined }}>
      {icon && <Icon icon={icon} width={20} style={{ color: t.primaryInk }} />}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <Icon icon="solar:alt-arrow-right-linear" width={15} style={{ color: t.muted }} />
    </button>
  );

  return (
    <>
      <TopBar t={t} diseno={diseno} slug={slug} tienda={tienda} go={go} />
      <header className="sticky top-0 z-30 border-b bg-white transition-shadow duration-300" style={{ borderColor: t.line, boxShadow: scrolled ? '0 12px 30px -24px rgba(22,37,27,0.55)' : 'none' }}>
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center gap-3 px-4 lg:gap-8 lg:px-8">
          <button type="button" aria-label="Todas las categorías" onClick={() => setDrawer(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-black/[0.04] lg:hidden" style={{ color: t.ink }}><Icon icon="solar:hamburger-menu-linear" width={24} /></button>
          <Logo tienda={tienda} diseno={diseno} t={t} onClick={() => go(`/tienda/${slug}`)} />
          {search('hidden min-w-0 flex-1 md:flex')}
          <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0 lg:gap-4">
            {location && (
              <span className="hidden items-center gap-2 xl:flex" title="Atendemos desde">
                <Icon icon="solar:map-point-linear" width={24} style={{ color: t.ink }} />
                <span className="leading-tight"><span className="block text-[11px]" style={{ color: t.muted }}>Atendemos desde</span><span className="block max-w-[130px] truncate text-[13px] font-bold" style={{ color: t.ink }}>{location}</span></span>
              </span>
            )}
            <button type="button" onClick={() => go(`/tienda/${slug}/seguimiento`)} className="hidden items-center gap-2 rounded-lg px-1 transition-opacity hover:opacity-75 lg:flex">
              <Icon icon="solar:user-rounded-linear" width={24} style={{ color: t.ink }} />
              <span className="text-left leading-tight"><span className="block text-[11px]" style={{ color: t.muted }}>Tu pedido</span><span className="block text-[13px] font-bold" style={{ color: t.ink }}>Seguimiento</span></span>
            </button>
            <IconBtn t={t} label="Favoritos" icon="solar:heart-linear" onClick={onOpenFav} badge={favCount} />
            <button type="button" aria-label="Carrito" onClick={onOpenCart} className="relative flex h-11 items-center gap-2 rounded-lg px-2 transition-colors hover:bg-black/[0.04]" style={{ color: t.ink }}>
              <span className="relative"><Icon icon="solar:cart-large-2-linear" width={25} />{cartCount > 0 && <span className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-extrabold" style={{ background: t.sale, color: '#fff' }}>{cartCount}</span>}</span>
              <span className="hidden text-left leading-tight lg:block"><span className="block text-[11px]" style={{ color: t.muted }}>Carrito</span><span className="block text-[13px] font-bold">{caMoney(cartTotal || 0)}</span></span>
            </button>
          </div>
        </div>
        <div className="px-4 pb-3 md:hidden">{search('w-full')}</div>
        {!hideCatBar && (
          <nav aria-label="Categorías" className="hidden border-t lg:block" style={{ borderColor: t.line, background: t.softer }}>
            <div className="mx-auto flex h-12 max-w-[1280px] items-center gap-1 px-8">
              <button type="button" onClick={() => setDrawer(true)} className="mr-3 inline-flex h-12 shrink-0 items-center gap-2.5 pr-4 text-[14px] font-extrabold" style={{ color: t.ink, borderRight: `1px solid ${t.line}` }}><Icon icon="solar:hamburger-menu-linear" width={20} />{editable(diseno?.canastaNavCategories, 'Todas las categorías')}</button>
              <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
                {barCats.map((c) => {
                  const on = active === 'catalog' && activeCategory === c;
                  return (
                    <button key={c} type="button" onClick={() => go(catUrl(c))} className="group relative inline-flex h-9 shrink-0 items-center rounded-lg px-3 text-[13.5px] font-semibold transition-colors hover:bg-black/[0.04]" style={{ color: on ? t.primaryInk : t.ink }}>
                      {c}
                      <span aria-hidden className={`absolute inset-x-3 bottom-0.5 h-[2px] origin-left rounded-full transition-transform duration-300 ${on ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} style={{ background: t.primary }} />
                    </button>
                  );
                })}
              </div>
              {offersHref && (
                <a href={offersHref} className="ml-auto inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[14px] font-extrabold" style={{ color: t.sale }}>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full text-white" style={{ background: t.sale }}><Icon icon="solar:sale-bold" width={13} /></span>{editable(diseno?.canastaNavOffers, 'Ofertas')}
                </a>
              )}
            </div>
          </nav>
        )}
      </header>
      <AddedToast t={t} onOpenCart={onOpenCart} />

      <AnimatePresence>
        {drawer && (
          <>
            <motion.button type="button" aria-label="Cerrar menú" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} className="fixed inset-0 z-50 bg-stone-900/35 backdrop-blur-[2px]" />
            <motion.nav initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 32, stiffness: 280 }} className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-[360px] flex-col" style={{ background: t.bg, fontFamily: t.font }} aria-label="Menú">
              <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: t.line }}>
                <Logo tienda={tienda} diseno={diseno} t={t} />
                <button type="button" aria-label="Cerrar" onClick={() => setDrawer(false)} className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-black/[0.04]" style={{ color: t.ink }}><Icon icon="solar:close-circle-linear" width={22} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {drawerLink(editable(diseno?.canastaNavHome, 'Inicio'), `/tienda/${slug}`, active === 'home', 'solar:home-2-linear')}
                {drawerLink(editable(diseno?.canastaNavShop, 'Todos los productos'), `/tienda/${slug}/catalogo`, active === 'catalog' && !activeCategory, 'solar:widget-4-linear')}
                {cats.length > 0 && <p className="px-3 pb-1 pt-4 text-[11px] font-extrabold uppercase tracking-[0.14em]" style={{ color: t.muted }}>{editable(diseno?.canastaNavCategories, 'Todas las categorías')}</p>}
                {cats.map((c) => drawerLink(c, catUrl(c), active === 'catalog' && activeCategory === c, categoryIcon(c)))}
                <div className="my-3 h-px" style={{ background: t.line }} />
                {drawerLink(editable(diseno?.canastaNavContact, 'Ayuda y contacto'), `/tienda/${slug}/contacto`, active === 'contact', 'solar:chat-round-dots-linear')}
                {drawerLink('Seguir mi pedido', `/tienda/${slug}/seguimiento`, false, 'solar:map-arrow-square-linear')}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function IconBtn({ t, label, icon, onClick, badge = 0 }: { t: Theme; label: string; icon: string; onClick: () => void; badge?: number }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="relative flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-black/[0.04]" style={{ color: t.ink }}>
      <Icon icon={icon} width={24} />
      {badge > 0 && <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-extrabold" style={{ background: t.sale, color: '#fff' }}>{badge}</span>}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────── Footer ──
/** Footer verde oscuro de la referencia. En vez de "descarga la app" (no existe), muestra los medios de pago reales. */
export function CanastaFooter({ tienda, slug, diseno, t, categories, navigate }: any) {
  const storeName = storeNameOf(tienda);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const waUrl = buildStorePurchaseWhatsappUrl(waNumber, 'Hola, tengo una consulta.');
  const address = (() => {
    const out: string[] = [];
    for (const raw of [tienda?.direccion, tienda?.distrito]) {
      const v = String(raw || '').trim();
      if (v && !out.some((x) => x.toLowerCase().includes(v.toLowerCase()))) out.push(v);
    }
    return out.join(', ');
  })();
  const horario = String(tienda?.horarioAtencion || '').trim();
  const socials = [
    tienda?.facebookUrl ? { icon: 'ic:baseline-facebook', label: 'Facebook', url: tienda.facebookUrl } : null,
    tienda?.instagramUrl ? { icon: 'mdi:instagram', label: 'Instagram', url: tienda.instagramUrl } : null,
    tienda?.tiktokUrl ? { icon: 'ic:baseline-tiktok', label: 'TikTok', url: tienda.tiktokUrl } : null,
    waUrl ? { icon: 'ic:baseline-whatsapp', label: 'WhatsApp', url: waUrl } : null,
  ].filter(Boolean) as { icon: string; label: string; url: string }[];
  const cats: string[] = (categories || []).slice(0, 5);
  const intro = optional(diseno?.canastaFooterText, String(tienda?.descripcionTienda || '').trim() || 'Haz tu pedido en línea, fácil y seguro, desde donde estés.');
  const closing = optional(diseno?.canastaFooterClosing, '');
  const cols: { title: string; items: { label: string; to: string }[] }[] = [
    { title: 'Tienda', items: [{ label: 'Todos los productos', to: `/tienda/${slug}/catalogo` }, ...cats.map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` }))] },
    { title: 'Ayuda', items: [
      { label: 'Seguir mi pedido', to: `/tienda/${slug}/seguimiento` },
      { label: 'Preguntas frecuentes', to: `/tienda/${slug}/contacto#faq` },
      { label: 'Contacto', to: `/tienda/${slug}/contacto` },
    ] },
  ];
  const sub = 'rgba(255,255,255,.72)';

  return (
    <footer style={{ background: t.deep, color: '#fff' }}>
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.1fr_1.4fr] lg:px-8">
        <div>
          <Logo tienda={tienda} diseno={diseno} t={t} light />
          {intro && <p className="mt-4 line-clamp-5 max-w-xs whitespace-pre-line text-[13px] leading-relaxed" style={{ color: sub }}>{intro}</p>}
          {socials.length > 0 && (
            <div className="mt-5 flex gap-1.5">
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20">
                  <Icon icon={s.icon} width={17} />
                </a>
              ))}
            </div>
          )}
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="text-[14px] font-bold" style={{ fontFamily: t.serif }}>{col.title}</h4>
            <ul className="mt-4 space-y-2.5 text-[13px]" style={{ color: sub }}>
              {col.items.map((it) => <li key={it.label}><button type="button" onClick={() => navigate(it.to)} className="text-left transition-colors hover:text-white">{it.label}</button></li>)}
            </ul>
          </div>
        ))}
        {(address || horario) ? (
          <div>
            <h4 className="text-[14px] font-bold" style={{ fontFamily: t.serif }}>Visítanos</h4>
            <ul className="mt-4 space-y-2.5 text-[13px]" style={{ color: sub }}>
              {address && <li className="flex gap-2"><Icon icon="solar:map-point-linear" width={16} className="mt-0.5 shrink-0" />{address}</li>}
              {horario && <li className="flex gap-2"><Icon icon="solar:clock-circle-linear" width={16} className="mt-0.5 shrink-0" />{horario}</li>}
            </ul>
          </div>
        ) : <div className="hidden lg:block" />}
        <PaymentMethods slug={slug} t={t} dark />
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2 px-4 py-5 text-[12px] lg:px-8" style={{ color: sub }}>
          <p>© {new Date().getFullYear()} {storeName}. Todos los derechos reservados.</p>
          <EnlaceLibroReclamaciones slug={slug} diseno={diseno} />
          {closing && <p className="flex items-center gap-1.5 font-semibold text-white">{closing}<Icon icon="ph:leaf-fill" width={14} style={{ color: t.accent }} /></p>}
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────── Product card ──
/**
 * Tarjeta de "Ofertas del día" de la referencia: % rojo, foto sobre blanco, nombre, unidad real, precio con tachado
 * y botón verde "Agregar" con cantidad (estado aislado). Con variantes lleva a elegir en la ficha.
 * `compact` = tarjeta chica de "Recomendados" (botón solo ícono en la esquina).
 */
export function CanastaProductCard({ producto, slug, t, onOpen, onAdd, compact = false }: { producto: any; slug: string; t: Theme; onOpen: () => void; onAdd: (qty: number) => void; compact?: boolean }) {
  const pricing = getProductPricing(producto);
  const stock = Number(producto?.stock ?? 1);
  const isOut = sinStock(stock);
  const hasVariants = Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const colors = getFashionColors(producto).slice(0, 4);
  const unit = unitLabel(producto);
  const [qty, setQty] = useState(1);
  const [broken, setBroken] = useState(false); // URL de imagen rota en los datos → ícono de categoría
  const add = () => { if (isOut) return; if (hasVariants) { onOpen(); return; } const n = Math.max(1, qty); onAdd(n); announceAdded(producto, n); setQty(1); };

  return (
    <article className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl bg-white transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-24px_rgba(22,37,27,0.45)]" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }} onClick={onOpen}>
      <div className={`relative overflow-hidden ${compact ? 'aspect-[5/4]' : 'aspect-[4/3]'}`} style={{ background: t.card }}>
        <div className="absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
          {pricing.enOferta && <span className="rounded-md px-1.5 py-0.5 text-[11px] font-extrabold text-white" style={{ background: t.sale }}>-{pricing.porcentajeDescuento}%</span>}
          {isOut ? <span className="rounded-md bg-stone-800 px-1.5 py-0.5 text-[10.5px] font-bold text-white">Agotado</span>
            : !hasVariants && pocasUnidades(stock) ? <span className="rounded-md px-1.5 py-0.5 text-[10.5px] font-bold" style={{ background: t.accentSoft, color: t.ink }}>¡Quedan {stock}!</span> : null}
        </div>
        <div className="absolute right-1 top-1 z-10 [&_button:nth-child(n+2)]:opacity-0 [&_button]:transition-opacity group-hover:[&_button:nth-child(n+2)]:opacity-100 [@media(hover:none)]:[&_button:nth-child(n+2)]:hidden" onClick={(e) => e.stopPropagation()}>
          <ProductCardActions producto={producto} slug={slug} cp={t.primary} />
        </div>
        {producto?.imagenUrl && !broken ? (
          <img src={producto.imagenUrl} alt={producto.descripcion} loading="lazy" onError={() => setBroken(true)} className={`h-full w-full object-contain p-3 mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.06] ${isOut ? 'opacity-50 grayscale' : ''}`} />
        ) : (
          <NoPhoto t={t} producto={producto} size={compact ? 34 : 44} />
        )}
      </div>

      <div className={`flex flex-1 flex-col border-t ${compact ? 'px-2.5 pb-2.5 pt-2' : 'px-3 pb-3 pt-2.5'}`} style={{ borderColor: t.line }}>
        <h3 title={producto?.descripcion} className={`line-clamp-2 font-semibold leading-snug ${compact ? 'text-[12.5px]' : 'text-[13px]'}`} style={{ color: t.ink }}>{producto?.descripcion}</h3>
        {unit && <p className="mt-0.5 text-[11px]" style={{ color: t.muted }}>{unit}</p>}
        <div className="mt-1"><Rating producto={producto} t={t} size={11} /></div>
        {colors.length > 0 && <div className="mt-1.5 flex gap-1.5">{colors.map((c) => <span key={c.name} title={c.name} className="h-3 w-3 rounded-full" style={{ background: c.hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.12)' }} />)}</div>}

        {compact ? (
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <span className="min-w-0 leading-tight">
              <span className="block text-[13.5px] font-extrabold" style={{ color: pricing.enOferta ? t.sale : t.ink }}>{caMoney(pricing.precioFinal)}</span>
              {pricing.enOferta && <span className="block text-[11px] line-through" style={{ color: t.muted }}>{caMoney(pricing.precioRegular)}</span>}
            </span>
            <button type="button" disabled={isOut} onClick={(e) => { e.stopPropagation(); add(); }} aria-label={isOut ? 'Agotado' : hasVariants ? 'Ver opciones' : 'Agregar al carrito'} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-[filter] hover:brightness-110 disabled:cursor-not-allowed" style={isOut ? { background: t.softer, color: t.muted } : hasVariants ? { background: t.soft, color: t.primaryInk } : { background: t.primary, color: t.onPrimary }}>
              <Icon icon={isOut ? 'solar:close-circle-linear' : hasVariants ? 'solar:tuning-2-linear' : 'solar:cart-plus-linear'} width={18} />
            </button>
          </div>
        ) : (
          <>
            <div className="mt-auto flex items-baseline gap-2 pt-1.5">
              <span className="text-[15px] font-extrabold" style={{ color: t.ink }}>{caMoney(pricing.precioFinal)}</span>
              {pricing.enOferta && <span className="text-[12px] font-semibold line-through" style={{ color: t.muted }}>{caMoney(pricing.precioRegular)}</span>}
            </div>
            <div className="mt-2.5 flex items-stretch gap-1.5" onClick={(e) => e.stopPropagation()}>
              {!hasVariants && !isOut && (
                <div className="flex h-9 w-[70px] shrink-0 items-center justify-between rounded-lg" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                  <button type="button" aria-label="Restar" onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-full w-6 items-center justify-center text-base font-bold" style={{ color: t.muted }}>−</button>
                  <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setQty(d === '' ? 1 : Math.max(1, parseInt(d, 10))); }} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[12.5px] font-extrabold outline-none focus:ring-0" style={{ color: t.ink }} />
                  <button type="button" aria-label="Sumar" onClick={() => setQty(qty + 1)} className="flex h-full w-6 items-center justify-center text-base font-bold" style={{ color: t.muted }}>+</button>
                </div>
              )}
              <button type="button" disabled={isOut} onClick={add} aria-label={isOut ? 'Agotado' : hasVariants ? 'Ver opciones' : 'Agregar al carrito'} className={`${btnCls} h-9 min-w-0 flex-1 px-1.5 text-[12px] disabled:cursor-not-allowed sm:px-2 sm:text-[12.5px]`} style={isOut ? { background: t.softer, color: t.muted } : hasVariants ? { background: t.soft, color: t.primaryInk } : { background: t.primary, color: t.onPrimary }}>
                {!isOut && !hasVariants && <Icon icon="solar:cart-large-2-linear" width={16} className="hidden shrink-0 sm:block" />}
                <span className="truncate">{isOut ? 'Agotado' : hasVariants ? 'Opciones' : 'Agregar'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────── Cart modal ──
export function CanastaCartModal({ isOpen, onClose, carrito, actualizarCantidad, onCheckout, t, tienda, diseno }: any) {
  const { slug = '' } = useParams();
  const items: any[] = carrito || [];
  const total = items.reduce((a, it) => a + Number(it.precioUnitario || 0) * Number(it.cantidad || 1), 0);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(waNumber, 'x'));
  const pedirWa = () => {
    if (!items.length) return;
    const detail = items.map((it) => `• ${Number(it.cantidad || 1)} x ${it.descripcion} - ${caMoney(Number(it.precioUnitario || 0) * Number(it.cantidad || 1))}`).join('\n');
    const url = buildStorePurchaseWhatsappUrl(waNumber, `Hola, quiero pedir estos productos en ${storeNameOf(tienda)}:\n\n${detail}\n\nTotal estimado: ${caMoney(total)}`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  const drawerStyle: CSSProperties = { background: t.bg, fontFamily: t.font };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button type="button" aria-label="Cerrar carrito" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-stone-900/35 backdrop-blur-[2px]" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 280 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[430px] flex-col shadow-2xl" style={drawerStyle} role="dialog" aria-label="Carrito">
            <header className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: t.line }}>
              <div>
                <h2 className="text-[20px] font-extrabold" style={{ color: t.ink }}>Tu carrito</h2>
                <p className="mt-0.5 text-[12.5px] font-semibold" style={{ color: t.muted }}>{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
              </div>
              <button type="button" aria-label="Cerrar" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-black/[0.05]" style={{ color: t.ink }}><Icon icon="solar:close-circle-linear" width={22} /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {!items.length ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: t.soft, color: t.primaryInk }}><Icon icon="solar:cart-large-2-linear" width={36} /></span>
                  <h3 className="mt-5 text-[18px] font-extrabold" style={{ color: t.ink }}>Tu carrito está vacío</h3>
                  <p className="mt-1.5 max-w-[260px] text-[13px]" style={{ color: t.muted }}>Descubre productos que te van a encantar.</p>
                  <button type="button" onClick={onClose} className={`${btnCls} mt-6 h-11 px-6`} style={{ background: t.primary, color: t.onPrimary }}>Seguir comprando</button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => {
                    const id = item.cartId || item.id;
                    const qty = Number(item.cantidad || 1);
                    const price = Number(item.precioUnitario || 0);
                    return (
                      <li key={id} className="relative grid grid-cols-[80px_1fr] gap-3 rounded-2xl bg-white p-3" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                        <button type="button" aria-label="Quitar" onClick={() => actualizarCantidad(id, 0)} className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-500"><Icon icon="solar:trash-bin-minimalistic-linear" width={16} /></button>
                        <div className="h-20 overflow-hidden rounded-xl" style={{ background: t.card }}>
                          {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-1.5 mix-blend-multiply" /> : <NoPhoto t={t} producto={item} size={28} />}
                        </div>
                        <div className="min-w-0 pr-7">
                          <h3 className="line-clamp-2 text-[13px] font-bold leading-snug" style={{ color: t.ink }}>{item.descripcion}</h3>
                          <div className="mt-2.5 flex items-center justify-between">
                            <div className="flex h-9 items-center overflow-hidden rounded-lg" style={{ background: t.softer, boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                              <button type="button" aria-label="Restar" onClick={() => actualizarCantidad(id, qty - 1)} className="flex w-8 items-center justify-center text-base font-bold" style={{ color: t.muted }}>−</button>
                              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); actualizarCantidad(id, d === '' ? 1 : parseInt(d, 10)); }} onFocus={(e) => e.currentTarget.select()} className="w-9 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[13px] font-extrabold outline-none focus:ring-0" style={{ color: t.ink }} />
                              <button type="button" aria-label="Sumar" onClick={() => actualizarCantidad(id, qty + 1)} className="flex w-8 items-center justify-center text-base font-bold" style={{ color: t.muted }}>+</button>
                            </div>
                            <span className="text-[14.5px] font-extrabold" style={{ color: t.ink }}>{caMoney(price * qty)}</span>
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
                  <span className="text-[22px] font-extrabold" style={{ color: t.ink }}>{caMoney(total)}</span>
                </div>
                <p className="mb-3 text-[11.5px]" style={{ color: t.muted }}>El envío se calcula en el checkout según tu forma de entrega.</p>
                <FreeShippingProgress t={t} slug={slug} subtotal={total} />
                <button type="button" onClick={() => { onClose(); onCheckout(); }} className={`${btnCls} h-12 w-full`} style={{ background: t.primary, color: t.onPrimary }}>
                  Ir a pagar <Icon icon="solar:arrow-right-linear" width={17} />
                </button>
                {hasWa && (
                  <button type="button" onClick={pedirWa} className={`${btnCls} mt-2.5 h-11 w-full`} style={{ background: t.softer, color: t.ink, boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                    <Icon icon="ic:baseline-whatsapp" width={18} className="text-[#25D366]" /> Pedir por WhatsApp
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

