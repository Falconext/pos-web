import EnlaceLibroReclamaciones from '@/components/tienda/EnlaceLibroReclamaciones';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { getProductPricing } from '@/templates/shared/pricing';
import { readableText } from '@/templates/shared/color';
import { getFashionColors } from '@/templates/urbano/fashionVariants';
import { sinStock, pocasUnidades } from '@/templates/shared/ventaSinStock';
import ProductCardActions from '@/components/tienda/ProductCardActions';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { mix, olEase } from './motion';

/**
 * Piezas base de la plantilla Olmo (carteras · editorial verde botella, crema y arena):
 * tema, barra de avisos + header, footer claro, tarjeta de producto y carrito.
 * Regla de la plantilla: nada inventado. Si un dato no existe en la tienda, la UI se oculta.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

export const olMoney = (v: any) => `S/ ${Number(v || 0).toFixed(2)}`;
/** Precio compacto para títulos grandes: sin decimales cuando son ,00. */
export const olPrice = (v: any) => { const n = Number(v || 0); return `S/ ${Number.isInteger(n) ? n : n.toFixed(2)}`; };
export const editable = (v: any, fallback: string) => String(v || '').trim() || fallback;
export const storeNameOf = (tienda: any, fallback = 'Olmo') => tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || fallback;
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

const BASE_BG = '#F6F1E9'; // crema de la referencia
const INK = '#1F1C18';
/** #FF6B6B es el default del esquema (colorAccento sin personalizar) → arena de la referencia. */
const SCHEMA_ACCENT = '#ff6b6b';

// ── Design tokens (verde botella + arena sobre crema; Playfair Display + DM Sans) ──
export function olTheme(diseno: any) {
  const primary = diseno?.colorPrimario || '#24392F';
  const rawAccent = String(diseno?.colorAccento || '').trim();
  const accent = !rawAccent || rawAccent.toLowerCase() === SCHEMA_ACCENT ? '#B59A6A' : rawAccent;
  const rawBg = String(diseno?.colorSecundario || '').trim();
  const bgLum = luminance(rawBg);
  // "Color de fondo" global: claro → tal cual; saturado u oscuro → tinte suave sobre el crema.
  const bg = !rawBg ? BASE_BG : bgLum !== null && bgLum < 0.78 ? mix(rawBg, 8, BASE_BG) : rawBg;
  const pl = luminance(primary);
  const al = luminance(accent);
  // Los paneles oscuros (barra de avisos, banner, club) piden un principal profundo:
  // si la marca eligió un principal claro, se hunde hacia tinta para que el blanco se lea.
  const lightPrimary = pl !== null && pl > 0.42;
  const strong = lightPrimary ? mix(primary, 26, INK) : primary;
  const onStrong = lightPrimary ? '#fff' : readableText(primary);
  return {
    primary,
    accent,
    /** Principal de botones y paneles oscuros (legible siempre con `onPrimary`). */
    strong,
    /** Principal/acento como texto sobre fondo claro: si son muy claros, caen a tinta. */
    primaryInk: lightPrimary ? INK : primary,
    accentInk: al !== null && al > 0.38 ? mix(accent, 62, INK) : accent,
    /** Acento como texto sobre fondo OSCURO: si es oscuro, cae a crema. */
    accentOnDark: al !== null && al < 0.22 ? '#F3E9D8' : accent,
    bg,
    surface: '#FFFFFF',
    ink: INK,
    muted: '#77706A',
    /** Fondo de fotos y campos: crema un poco más hondo. */
    soft: mix(accent, 10, '#FBF8F3'),
    /** Arena clara de los círculos de categoría y del club. */
    sand: mix(accent, 24, '#FBF7F0'),
    line: '#E7DFD2',
    sale: '#B4483C',
    /** Paneles oscuros (barra de avisos, banner de oferta). */
    chrome: strong,
    chrome2: mix(strong, 88, '#000'),
    tiles: [mix(accent, 22, '#fff'), mix(primary, 12, '#fff'), mix(accent, 34, '#fff'), mix(primary, 8, '#F6F1E9')],
    onPrimary: onStrong,
    onAccent: readableText(accent, INK),
    font: `'${diseno?.tipografia && diseno.tipografia !== 'Inter' ? diseno.tipografia : 'DM Sans'}', ui-sans-serif, system-ui, sans-serif`,
    display: `'Playfair Display', 'Times New Roman', Georgia, serif`,
    /** Alias para páginas compartidas que piden "serif"/"mono" de títulos y etiquetas. */
    serif: `'Playfair Display', Georgia, serif`,
    mono: `'DM Sans', ui-sans-serif, system-ui, sans-serif`,
  };
}
export type Theme = ReturnType<typeof olTheme>;

/** Tono suave estable para una categoría (la misma categoría siempre cae en el mismo tono). */
export function tileFor(t: Theme, key: any): string {
  const s = String(key || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return t.tiles[h % t.tiles.length];
}

/** Inyecta Playfair Display + DM Sans una sola vez. */
export function useOlmoFont() {
  useEffect(() => {
    const id = 'olmo-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap';
    document.head.appendChild(link);
  }, []);
}

/** Botón píldora de la referencia: mayúscula pequeña con tracking y flecha. */
export const btnCls = 'inline-flex items-center justify-center gap-2.5 rounded-full text-[12.5px] font-semibold uppercase tracking-[0.08em] transition-[filter,transform,background-color,color,box-shadow] hover:brightness-110 active:scale-[0.98]';

/** Etiqueta corta en mayúsculas (sobre-títulos, en arena). */
export function Eyebrow({ t, children, light = false, className = '' }: { t: Theme; children: ReactNode; light?: boolean; className?: string }) {
  return <p className={`text-[11.5px] font-semibold uppercase tracking-[0.16em] ${className}`} style={{ color: light ? t.accentOnDark : t.accentInk }}>{children}</p>;
}

/** Estrellas reales; si aún no tiene reseñas, "Nuevo" (nunca estrellas de relleno). */
export function Stars({ producto, t, size = 13, light = false }: { producto: any; t: Theme; size?: number; light?: boolean }) {
  const rating = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const count = Number(producto?.ratingCount || producto?.reviewsCount || 0);
  const muted = light ? 'rgba(255,255,255,.65)' : t.muted;
  if (!(rating > 0 && count > 0)) return <span className="text-[11.5px] font-medium uppercase tracking-[0.08em]" style={{ color: muted }}>Nuevo</span>;
  return (
    <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: muted }} aria-label={`${rating.toFixed(1)} de 5 (${count} reseñas)`}>
      <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon={i < Math.round(rating) ? 'solar:star-bold' : 'solar:star-linear'} width={size} style={{ color: t.accent }} />)}</span>
      <span>({count})</span>
    </span>
  );
}

/** Logo: imagen real de la tienda o monograma serif + nombre espaciado + frase. */
export function Logo({ tienda, diseno, t, onClick, light = false }: { tienda: any; diseno: any; t: Theme; onClick?: () => void; light?: boolean }) {
  const name = editable(diseno?.olmoLogoText, storeNameOf(tienda));
  const tagline = optional(diseno?.olmoLogoTagline, 'Carteras · Accesorios');
  const long = name.length > 10;
  const content = tienda?.logo ? (
    <span className={`flex items-center rounded-xl ${light ? 'bg-white px-2 py-1' : ''}`}>
      <img src={tienda.logo} alt={name} className="h-10 w-auto max-w-[150px] object-contain" />
    </span>
  ) : (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]" style={{ background: t.strong, color: t.onPrimary }}>
        <span className="text-[24px] italic leading-none" style={{ fontFamily: t.display }}>{name.trim().charAt(0).toUpperCase()}</span>
        <span aria-hidden className="absolute bottom-[7px] right-[7px] h-[5px] w-[5px] rounded-full" style={{ background: t.accent }} />
      </span>
      <span className="min-w-0 leading-none">
        <span className={`block max-w-[150px] truncate text-[19px] font-medium uppercase sm:max-w-[230px] sm:text-[21px] ${long ? 'tracking-[0.06em]' : 'tracking-[0.18em]'}`} style={{ fontFamily: t.display, color: light ? '#fff' : t.ink }}>{name}</span>
        {tagline && <span className="mt-1.5 hidden truncate text-[9.5px] font-semibold uppercase tracking-[0.3em] sm:block" style={{ color: light ? 'rgba(255,255,255,.62)' : t.muted }}>{tagline}</span>}
      </span>
    </span>
  );
  return onClick ? <button type="button" onClick={onClick} className="flex min-w-0 shrink items-center" aria-label={`${name} — inicio`}>{content}</button> : <div className="flex min-w-0 items-center">{content}</div>;
}

// ─────────────────────────────────────────────────────────── Beneficios ──
export type Service = { icon: string; label: string; sub: string; value?: string; unit?: string; tag: string };

/** Beneficios derivados de la configuración real de la tienda (nada de promesas inventadas). */
export function buildServices(tienda: any, hasWhatsapp = false): Service[] {
  const s: Service[] = [];
  const envio = Number(tienda?.costoEnvioFijo || 0);
  if (tienda?.aceptaEnvio !== false) s.push({ tag: 'ENVÍO', icon: 'ph:truck-light', label: 'Envío a domicilio', sub: envio > 0 ? `Tarifa fija de ${olMoney(envio)}` : 'Costo según tu distrito', ...(envio > 0 ? { value: olPrice(envio), unit: 'tarifa fija' } : {}) });
  if (tienda?.aceptaRecojo) {
    const min = Number(tienda?.tiempoPreparacionMin || 0);
    s.push({ tag: 'RECOJO', icon: 'ph:storefront-light', label: 'Recojo en tienda', sub: min > 0 ? `Listo en unos ${min} min` : 'Sin costo de envío', value: 'S/ 0', unit: 'de envío' });
  }
  s.push({ tag: 'SEGURA', icon: 'ph:shield-check-light', label: 'Pago seguro', sub: 'Confirmas antes de pagar' });
  if (hasWhatsapp) s.push({ tag: 'ASESORÍA', icon: 'ph:headset-light', label: 'Te asesoramos', sub: 'Fotos y medidas por WhatsApp' });
  s.push({ tag: 'TRACKING', icon: 'ph:package-light', label: 'Seguimiento', sub: 'Sigue tu pedido con un código' });
  return s;
}

// ─────────────────────────────────────────────────────────────── Header ──
/**
 * Barra de avisos verde (beneficios reales) + header crema con logo, menú centrado y
 * buscar/mi pedido/favoritos/bolsa a la derecha. Estado propio (búsqueda, menús) aislado aquí.
 */
export function OlmoHeader({ tienda, slug, diseno, categories, t, cartCount, favCount, onOpenCart, onOpenFav, navigate, active }: any) {
  const [menu, setMenu] = useState<null | 'cats' | 'search' | 'mobile'>(null);
  const [q, setQ] = useState('');
  const cats: string[] = categories || [];
  const go = (to: string) => { setMenu(null); navigate(to); };
  const panelRef = useRef<HTMLDivElement>(null);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(waNumber, 'Hola'));
  const submit = () => go(`/tienda/${slug}/catalogo${q.trim() ? `?search=${encodeURIComponent(q.trim())}` : ''}`);
  const placeholder = editable(diseno?.olmoSearchPlaceholder, 'Busca carteras, mochilas, billeteras…');

  // Barra de avisos: textos editables; vacíos → beneficios reales de la tienda.
  const services = buildServices(tienda, hasWa);
  const derived = [
    services.find((s) => s.tag === 'ENVÍO') ? { icon: 'ph:truck-light', text: services.find((s) => s.tag === 'ENVÍO')!.value ? `Envío a domicilio · ${services.find((s) => s.tag === 'ENVÍO')!.value}` : 'Envío a domicilio' } : null,
    services.find((s) => s.tag === 'RECOJO') ? { icon: 'ph:storefront-light', text: 'Recojo en tienda sin costo' } : { icon: 'ph:package-light', text: 'Seguimiento de tu pedido' },
    { icon: 'ph:lock-simple-light', text: 'Pago 100% seguro' },
  ].filter(Boolean) as { icon: string; text: string }[];
  const bar = [1, 2, 3].map((n, i) => {
    const custom = String(diseno?.[`olmoTopbar${n}`] || '').trim();
    const base = derived[i];
    return custom ? { icon: base?.icon || 'ph:sparkle-light', text: custom } : base;
  }).filter(Boolean) as { icon: string; text: string }[];

  const showBar = !isOn(diseno?.olmoTopbarHidden) && bar.length > 0;

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!panelRef.current?.contains(e.target as Node)) setMenu(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [menu]);

  const navLink = (label: string, key: string, to: string) => (
    <button key={key} type="button" onClick={() => go(to)} className="relative whitespace-nowrap py-2 text-[12.5px] font-semibold uppercase tracking-[0.08em] transition-colors" style={{ color: active === key ? t.ink : mix(t.ink, 78, t.bg) }}>
      {label}
      <span className={`absolute inset-x-0 -bottom-0.5 h-px origin-left transition-transform duration-300 ${active === key ? 'scale-x-100' : 'scale-x-0'}`} style={{ background: t.ink }} />
    </button>
  );

  return (
    // Con barra de avisos, el header se pega a -36px: la barra se va al hacer scroll y queda la fila principal.
    <header ref={panelRef} className={`sticky z-30 ${showBar ? '-top-9' : 'top-0'}`} style={{ fontFamily: t.font }}>
      {showBar && (
        <div style={{ background: t.chrome, color: t.onPrimary }}>
          <div className="mx-auto flex h-9 max-w-[1320px] items-center justify-center gap-10 overflow-hidden px-4 text-[11px] font-medium uppercase tracking-[0.1em] sm:justify-between sm:px-6">
            {bar.map((b, i) => (
              <span key={b.text} className={`items-center gap-2 whitespace-nowrap ${i === 0 ? 'flex' : 'hidden sm:flex'}`}>
                <Icon icon={b.icon} width={16} style={{ color: t.accentOnDark }} />{b.text}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="border-b backdrop-blur-md" style={{ background: mix(t.bg, 92, 'transparent'), borderColor: t.line }}>
        <div className="mx-auto flex h-[78px] max-w-[1320px] items-center gap-4 px-4 sm:px-6">
          <Logo tienda={tienda} diseno={diseno} t={t} onClick={() => go(`/tienda/${slug}`)} />
          <nav className="mx-auto hidden min-w-0 items-center gap-7 lg:flex" aria-label="Principal">
            {navLink(editable(diseno?.olmoNavHome, 'Inicio'), 'home', `/tienda/${slug}`)}
            {navLink(editable(diseno?.olmoNavShop, 'Tienda'), 'catalog', `/tienda/${slug}/catalogo`)}
            {cats.length > 0 && (
              <button type="button" onClick={() => setMenu(menu === 'cats' ? null : 'cats')} aria-expanded={menu === 'cats'} className="flex items-center gap-1 py-2 text-[12.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: mix(t.ink, 78, t.bg) }}>
                {editable(diseno?.olmoNavCategories, 'Categorías')}
                <Icon icon="ph:caret-down" width={13} className={`transition-transform ${menu === 'cats' ? 'rotate-180' : ''}`} />
              </button>
            )}
            {cats.slice(0, 3).map((c) => navLink(c, `cat-${c}`, `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`))}
            {navLink(editable(diseno?.olmoNavContact, 'Contacto'), 'contact', `/tienda/${slug}/contacto`)}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-0.5 lg:ml-0">
            <HdrIcon t={t} label="Buscar" icon="ph:magnifying-glass" onClick={() => setMenu(menu === 'search' ? null : 'search')} />
            <span className="hidden sm:block"><HdrIcon t={t} label={editable(diseno?.olmoNavTrack, 'Mi pedido')} icon="ph:user" onClick={() => go(`/tienda/${slug}/seguimiento`)} /></span>
            <HdrIcon t={t} label="Favoritos" icon="ph:heart" onClick={onOpenFav} badge={favCount} />
            <HdrIcon t={t} label="Bolsa" icon="ph:handbag" onClick={onOpenCart} badge={cartCount} />
            <span className="lg:hidden"><HdrIcon t={t} label="Menú" icon={menu === 'mobile' ? 'ph:x' : 'ph:list'} onClick={() => setMenu(menu === 'mobile' ? null : 'mobile')} /></span>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {menu === 'cats' && (
          <motion.div key="cats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-x-0 top-full hidden px-6 pt-2 lg:block">
            <motion.div initial={{ y: -6 }} animate={{ y: 0 }} exit={{ y: -6 }} transition={{ duration: 0.22, ease: olEase }} className="mx-auto grid max-w-[1000px] grid-cols-3 gap-1 rounded-[22px] border bg-white p-3 shadow-[0_30px_60px_-34px_rgba(31,28,24,0.45)]" style={{ borderColor: t.line }}>
              {cats.slice(0, 15).map((c) => (
                <button key={c} type="button" onClick={() => go(`/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`)} className="flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-[14px] font-medium transition-colors hover:bg-[#F6F1E9]" style={{ color: t.ink }}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: t.sand, color: t.primaryInk }}><Icon icon="ph:handbag-simple-light" width={18} /></span>
                  <span className="truncate">{c}</span>
                </button>
              ))}
              <button type="button" onClick={() => go(`/tienda/${slug}/catalogo`)} className="flex items-center gap-2 rounded-[14px] px-3 py-2.5 text-[12.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: t.primaryInk }}>Ver todo <Icon icon="ph:arrow-right" width={15} /></button>
            </motion.div>
          </motion.div>
        )}
        {menu === 'search' && (
          <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-x-0 top-full border-b px-4 py-4 sm:px-6" style={{ background: t.bg, borderColor: t.line }}>
            <form onSubmit={(e) => { e.preventDefault(); submit(); }} role="search" className="mx-auto flex h-12 max-w-[720px] items-center gap-3 rounded-full border bg-white pl-5 pr-1.5" style={{ borderColor: t.line }}>
              <Icon icon="ph:magnifying-glass" width={19} style={{ color: t.muted }} />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label="Buscar productos" className="min-w-0 flex-1 appearance-none border-0 bg-transparent bg-none p-0 text-[15px] outline-none placeholder:text-[#A39C93] focus:ring-0" style={{ color: t.ink }} />
              <button type="submit" className={`${btnCls} h-9 px-5`} style={{ background: t.strong, color: t.onPrimary }}>Buscar</button>
            </form>
          </motion.div>
        )}
        {menu === 'mobile' && (
          <motion.nav key="mobile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-x-0 top-full max-h-[75vh] overflow-y-auto border-b px-3 pb-4 pt-2 lg:hidden" style={{ background: t.bg, borderColor: t.line }} aria-label="Menú móvil">
            {[
              { label: editable(diseno?.olmoNavHome, 'Inicio'), to: `/tienda/${slug}` },
              { label: editable(diseno?.olmoNavShop, 'Tienda'), to: `/tienda/${slug}/catalogo` },
              ...cats.slice(0, 10).map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })),
              { label: editable(diseno?.olmoNavTrack, 'Mi pedido'), to: `/tienda/${slug}/seguimiento` },
              { label: editable(diseno?.olmoNavContact, 'Contacto'), to: `/tienda/${slug}/contacto` },
            ].map((it, i) => (
              <button key={`${it.label}-${i}`} type="button" onClick={() => go(it.to)} className="flex w-full items-center justify-between border-b px-3 py-3.5 text-left text-[15px] font-medium last:border-0" style={{ color: t.ink, borderColor: t.line }}>
                {it.label}<Icon icon="ph:arrow-right" width={16} style={{ color: t.muted }} />
              </button>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function HdrIcon({ t, label, icon, onClick, badge = 0 }: { t: Theme; label: string; icon: string; onClick: () => void; badge?: number }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-black/[0.04]" style={{ color: t.ink }}>
      <Icon icon={icon} width={23} />
      {badge > 0 && <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold" style={{ background: t.accent, color: t.onAccent }}>{badge}</span>}
    </button>
  );
}

// ───────────────────────────────────────────────────── Medios de pago ──
/** Medios de pago REALES de la tienda (/payment-config). Carga aislada; si no hay datos, no se muestra nada. */
export function PaymentBadges({ slug, fg, line, bg = 'transparent', title }: { slug: string; fg: string; line: string; bg?: string; title?: ReactNode }) {
  const [cfg, setCfg] = useState<any>(null);
  useEffect(() => {
    if (!slug || slug === 'preview') return;
    let alive = true;
    axios.get(`${BASE_URL}/public/store/${slug}/payment-config`).then((r) => { if (alive) setCfg(r.data?.data || r.data); }).catch(() => {});
    return () => { alive = false; };
  }, [slug]);
  if (!cfg) return null;
  const items: { label: string; icon: string }[] = [];
  if (cfg.aceptaTarjeta || cfg.aceptaNiubiz) items.push({ label: 'Tarjeta', icon: 'ph:credit-card-light' });
  if (cfg.aceptaMercadoPago) items.push({ label: 'Mercado Pago', icon: 'simple-icons:mercadopago' });
  if (cfg.yapeQrUrl || cfg.yapeQR || cfg.yapeNumero) items.push({ label: 'Yape', icon: 'ph:device-mobile-light' });
  if (cfg.plinQrUrl || cfg.plinQR || cfg.plinNumero) items.push({ label: 'Plin', icon: 'ph:device-mobile-light' });
  if (Array.isArray(cfg.cuentasBancarias) && cfg.cuentasBancarias.length) items.push({ label: 'Transferencia', icon: 'ph:bank-light' });
  if (cfg.aceptaEfectivo) items.push({ label: 'Efectivo', icon: 'ph:money-light' });
  if (!items.length) return null;
  const badges = (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((it) => <span key={it.label} className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-semibold" style={{ borderColor: line, color: fg, background: bg }}><Icon icon={it.icon} width={15} />{it.label}</span>)}
    </div>
  );
  return title ? <div>{title}{badges}</div> : badges;
}

// ─────────────────────────────────────────────────────────────── Footer ──
/** Footer claro de la referencia: marca + redes, columnas reales y pagos seguros reales. */
export function OlmoFooter({ tienda, slug, diseno, t, categories, navigate }: any) {
  const storeName = storeNameOf(tienda);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const waUrl = buildStorePurchaseWhatsappUrl(waNumber, 'Hola, tengo una consulta.');
  const address = [tienda?.direccion, tienda?.distrito].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  const horario = String(tienda?.horarioAtencion || '').trim();
  const socials = [
    tienda?.instagramUrl ? { label: 'Instagram', icon: 'mdi:instagram', url: tienda.instagramUrl } : null,
    tienda?.facebookUrl ? { label: 'Facebook', icon: 'ic:baseline-facebook', url: tienda.facebookUrl } : null,
    tienda?.tiktokUrl ? { label: 'TikTok', icon: 'ic:baseline-tiktok', url: tienda.tiktokUrl } : null,
    waUrl ? { label: 'WhatsApp', icon: 'ic:baseline-whatsapp', url: waUrl } : null,
  ].filter(Boolean) as { label: string; icon: string; url: string }[];
  const cats: string[] = (categories || []).slice(0, 6);
  const intro = String(diseno?.olmoFooterText || tienda?.descripcionTienda || '').trim();
  const cols: { title: string; items: { label: string; to: string }[] }[] = [
    { title: editable(diseno?.olmoFooterCol1, 'Tienda'), items: [{ label: 'Ver todo', to: `/tienda/${slug}/catalogo` }, ...cats.map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` }))] },
    { title: editable(diseno?.olmoFooterCol2, 'Atención'), items: [
      { label: 'Seguimiento de pedido', to: `/tienda/${slug}/seguimiento` },
      { label: 'Preguntas frecuentes', to: `/tienda/${slug}/contacto#faq` },
      { label: 'Contacto', to: `/tienda/${slug}/contacto` },
    ] },
  ];

  return (
    <footer className="mt-20 border-t" style={{ background: mix(t.bg, 70, '#fff'), color: t.ink, fontFamily: t.font, borderColor: t.line }}>
      <div className="mx-auto max-w-[1320px] px-5 pt-14 sm:px-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[1.5fr_1fr_1fr_1.4fr]">
          <div className="col-span-2 md:col-span-1 md:pr-8">
            <Logo tienda={tienda} diseno={diseno} t={t} onClick={() => navigate(`/tienda/${slug}`)} />
            {intro && <p className="mt-5 max-w-xs whitespace-pre-line text-[13.5px] leading-relaxed" style={{ color: t.muted }}>{intro}</p>}
            {socials.length > 0 && (
              <div className="mt-6 flex gap-2">
                {socials.map((s) => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-white" style={{ borderColor: t.line, color: t.ink }}><Icon icon={s.icon} width={18} /></a>
                ))}
              </div>
            )}
          </div>
          {cols.map((col) => (
            <div key={col.title} className="md:border-l md:pl-8" style={{ borderColor: t.line }}>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em]">{col.title}</p>
              <ul className="mt-5 space-y-3 text-[13.5px]">
                {col.items.map((it) => (
                  <li key={it.label}><button type="button" onClick={() => navigate(it.to)} className="text-left transition-colors hover:opacity-100" style={{ color: t.muted }}>{it.label}</button></li>
                ))}
              </ul>
            </div>
          ))}
          <div className="col-span-2 md:col-span-1 md:border-l md:pl-8" style={{ borderColor: t.line }}>
            {(address || horario) && (
              <>
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em]">{editable(diseno?.olmoFooterCol3, 'Visítanos')}</p>
                <ul className="mt-5 space-y-3 text-[13.5px]" style={{ color: t.muted }}>
                  {address && <li className="flex gap-2.5"><Icon icon="ph:map-pin-light" width={18} className="mt-0.5 shrink-0" style={{ color: t.primaryInk }} />{address}</li>}
                  {horario && <li className="flex gap-2.5"><Icon icon="ph:clock-light" width={18} className="mt-0.5 shrink-0" style={{ color: t.primaryInk }} />{horario}</li>}
                </ul>
              </>
            )}
            <FooterPayments slug={slug} t={t} spaced={Boolean(address || horario)} />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t py-6 text-[12.5px] sm:flex-row sm:items-center sm:justify-between" style={{ color: t.muted, borderColor: t.line }}>
          <p>© {new Date().getFullYear()} {storeName}. {optional(diseno?.olmoFooterTagline, 'Todos los derechos reservados.')}</p>
          <EnlaceLibroReclamaciones slug={slug} diseno={diseno} />
        </div>
      </div>
    </footer>
  );
}

/** Bloque "Pagos seguros" del footer: título solo si la tienda tiene medios configurados. */
function FooterPayments({ slug, t, spaced }: { slug: string; t: Theme; spaced: boolean }) {
  return (
    <div className={spaced ? 'mt-8' : ''}>
      <PaymentBadges slug={slug} fg={t.ink} line={t.line} bg="#fff" title={<p className="mb-4 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em]"><Icon icon="ph:lock-simple-light" width={16} style={{ color: t.primaryInk }} /> Pagos seguros</p>} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────── Product card ──
/**
 * Tarjeta de la referencia: blanca, foto sobre crema con corazón (favoritos/comparar/zoom reales),
 * nombre, categoría, precio con tachado real, estrellas reales y fila de compra con cantidad editable.
 * Estado de cantidad aislado aquí.
 */
export function OlmoProductCard({ producto, slug, t, onOpen, onAdd, tone, dense = false }: { producto: any; slug: string; t: Theme; onOpen: () => void; onAdd: (qty: number) => void; tone?: string; dense?: boolean }) {
  const pricing = getProductPricing(producto);
  const stock = Number(producto?.stock ?? 1);
  const isOut = sinStock(stock);
  const hasVariants = Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const colors = getFashionColors(producto).slice(0, 4);
  const [qty, setQty] = useState(1);
  const [broken, setBroken] = useState(false);
  const category = nameOf(producto?.categoria);
  const bg = tone || t.soft;
  const low = !isOut && !hasVariants && pocasUnidades(stock);

  return (
    <article className="group flex h-full cursor-pointer flex-col rounded-[18px] bg-white p-2.5 shadow-[0_1px_0_rgba(31,28,24,0.04),0_14px_34px_-28px_rgba(31,28,24,0.4)] transition-shadow duration-300 hover:shadow-[0_1px_0_rgba(31,28,24,0.04),0_26px_46px_-28px_rgba(31,28,24,0.5)]" onClick={onOpen}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[14px]" style={{ background: bg }}>
        {isOut ? (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-white px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: t.muted }}>Agotado</span>
        ) : pricing.enOferta ? (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: t.strong, color: t.onPrimary }}>-{pricing.porcentajeDescuento}%</span>
        ) : producto?.destacado ? (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: t.accentInk }}>Destacado</span>
        ) : null}
        <div className="absolute right-2 top-2 z-10 [&_button:nth-child(n+2)]:opacity-0 [&_button]:transition-opacity group-hover:[&_button:nth-child(n+2)]:opacity-100 [@media(hover:none)]:[&_button:nth-child(n+2)]:opacity-100" onClick={(e) => e.stopPropagation()}>
          <ProductCardActions producto={producto} slug={slug} cp={t.strong} />
        </div>
        {producto?.imagenUrl && !broken ? (
          <img src={producto.imagenUrl} alt={producto.descripcion} loading="lazy" onError={() => setBroken(true)} className={`absolute inset-[7%] h-[86%] w-[86%] rounded-[10px] object-contain mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-[1.05] ${isOut ? 'opacity-50 grayscale' : ''}`} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"><Icon icon="ph:handbag-simple-thin" width={64} style={{ color: mix(t.ink, 25, '#fff') }} /></div>
        )}
        {low && <span className="absolute bottom-2.5 left-2.5 z-10 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold" style={{ color: t.sale }}>Quedan {stock}</span>}
      </div>

      <div className="flex flex-1 flex-col px-1.5 pt-3">
        <h3 title={producto?.descripcion} className="line-clamp-2 text-[14px] font-semibold leading-snug" style={{ color: t.ink }}>{producto?.descripcion}</h3>
        {category && !dense && <p className="mt-0.5 truncate text-[12.5px]" style={{ color: t.muted }}>{category}</p>}
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
          <span className="text-[15px] font-semibold" style={{ color: t.ink }}>{olMoney(pricing.precioFinal)}</span>
          {pricing.enOferta && <span className="text-[12px] line-through" style={{ color: t.muted }}>{olMoney(pricing.precioRegular)}</span>}
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <Stars producto={producto} t={t} size={12} />
          {colors.length > 0 && <span className="ml-auto flex -space-x-1">{colors.map((c) => <span key={c.name} title={c.name} className="h-3 w-3 rounded-full ring-2 ring-white" style={{ background: c.hex }} />)}</span>}
        </div>

        <div className="mt-auto flex items-center gap-1.5 pt-3" onClick={(e) => e.stopPropagation()}>
          {!hasVariants && !isOut && !dense && (
            <div className="flex h-10 w-[74px] shrink-0 items-center justify-between rounded-full border px-0.5" style={{ borderColor: t.line }}>
              <button type="button" aria-label="Restar" onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-8 w-6 items-center justify-center text-[15px]" style={{ color: t.ink }}>−</button>
              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setQty(d === '' ? 1 : Math.max(1, parseInt(d, 10))); }} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[13px] font-semibold outline-none focus:ring-0" style={{ color: t.ink }} />
              <button type="button" aria-label="Sumar" onClick={() => setQty(qty + 1)} className="flex h-8 w-6 items-center justify-center text-[15px]" style={{ color: t.ink }}>+</button>
            </div>
          )}
          <button
            type="button"
            disabled={isOut}
            onClick={() => { if (isOut) return; if (hasVariants) onOpen(); else onAdd(Math.max(1, dense ? 1 : qty)); }}
            className="flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2 text-[11px] font-semibold uppercase tracking-[0.04em] transition-[filter,transform] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed"
            style={isOut ? { background: '#EFEAE2', color: t.muted } : { background: t.strong, color: t.onPrimary }}
          >
            {!isOut && (hasVariants || dense) && <Icon icon={hasVariants ? 'ph:swatches' : 'ph:handbag'} width={16} className="shrink-0" />}
            <span className="truncate">{isOut ? 'Agotado' : hasVariants ? 'Ver opciones' : 'Agregar'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────── Cart modal ──
export function OlmoCartModal({ isOpen, onClose, carrito, actualizarCantidad, onCheckout, t, tienda, diseno }: any) {
  const items: any[] = carrito || [];
  const total = items.reduce((a, it) => a + Number(it.precioUnitario || 0) * Number(it.cantidad || 1), 0);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(waNumber, 'x'));
  const pedirWa = () => {
    if (!items.length) return;
    const detail = items.map((it) => `• ${Number(it.cantidad || 1)} x ${it.descripcion} - ${olMoney(Number(it.precioUnitario || 0) * Number(it.cantidad || 1))}`).join('\n');
    const url = buildStorePurchaseWhatsappUrl(waNumber, `Hola, quiero pedir estos productos en ${storeNameOf(tienda)}:\n\n${detail}\n\nTotal estimado: ${olMoney(total)}`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  const drawerStyle: CSSProperties = { background: t.bg, fontFamily: t.font };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button type="button" aria-label="Cerrar bolsa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-[#1F1C18]/40 backdrop-blur-[2px]" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 34, stiffness: 260 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col" style={drawerStyle} role="dialog" aria-label="Bolsa de compras">
            <header className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: t.line }}>
              <div>
                <h2 className="text-[26px] font-medium leading-none" style={{ fontFamily: t.display, color: t.ink }}>Tu bolsa</h2>
                <p className="mt-1.5 text-[12px] uppercase tracking-[0.12em]" style={{ color: t.muted }}>{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
              </div>
              <button type="button" aria-label="Cerrar" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border hover:bg-white" style={{ borderColor: t.line, color: t.ink }}><Icon icon="ph:x" width={18} /></button>
            </header>
            <div className="flex-1 overflow-y-auto p-4">
              {!items.length ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: t.sand, color: t.primaryInk }}><Icon icon="ph:handbag-light" width={36} /></span>
                  <h3 className="mt-5 text-[24px] font-medium" style={{ color: t.ink, fontFamily: t.display }}>Tu bolsa está vacía</h3>
                  <p className="mt-1.5 max-w-[260px] text-[13.5px]" style={{ color: t.muted }}>Descubre las piezas de la colección en el catálogo.</p>
                  <button type="button" onClick={onClose} className={`${btnCls} mt-6 h-11 px-6`} style={{ background: t.strong, color: t.onPrimary }}>Seguir comprando</button>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {items.map((item) => {
                    const id = item.cartId || item.id;
                    const qty = Number(item.cantidad || 1);
                    const price = Number(item.precioUnitario || 0);
                    return (
                      <li key={id} className="relative grid grid-cols-[80px_1fr] gap-3 rounded-[16px] bg-white p-2.5">
                        <button type="button" aria-label="Quitar" onClick={() => actualizarCantidad(id, 0)} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-[#F6F1E9]" style={{ color: t.muted }}><Icon icon="ph:trash-light" width={16} /></button>
                        <div className="flex h-[92px] items-center justify-center overflow-hidden rounded-[12px]" style={{ background: t.soft }}>
                          {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-2 mix-blend-multiply" /> : <Icon icon="ph:handbag-simple-thin" width={28} style={{ color: t.muted }} />}
                        </div>
                        <div className="flex min-w-0 flex-col pr-7">
                          <h3 className="line-clamp-2 text-[13.5px] font-semibold leading-snug" style={{ color: t.ink }}>{item.descripcion}</h3>
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <div className="flex h-9 items-center overflow-hidden rounded-full border" style={{ borderColor: t.line }}>
                              <button type="button" aria-label="Restar" onClick={() => actualizarCantidad(id, qty - 1)} className="flex w-8 items-center justify-center text-base" style={{ color: t.ink }}>−</button>
                              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); actualizarCantidad(id, d === '' ? 1 : parseInt(d, 10)); }} onFocus={(e) => e.currentTarget.select()} className="w-9 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[13px] font-semibold outline-none focus:ring-0" style={{ color: t.ink }} />
                              <button type="button" aria-label="Sumar" onClick={() => actualizarCantidad(id, qty + 1)} className="flex w-8 items-center justify-center text-base" style={{ color: t.ink }}>+</button>
                            </div>
                            <span className="text-[15px] font-semibold" style={{ color: t.ink }}>{olMoney(price * qty)}</span>
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
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: t.muted }}>Subtotal</span>
                  <span className="text-[26px] font-medium" style={{ color: t.ink, fontFamily: t.display }}>{olMoney(total)}</span>
                </div>
                <p className="mb-4 text-[12px]" style={{ color: t.muted }}>El envío se calcula en el checkout según tu forma de entrega.</p>
                <button type="button" onClick={() => { onClose(); onCheckout(); }} className={`${btnCls} h-12 w-full`} style={{ background: t.strong, color: t.onPrimary }}>
                  Ir a pagar · {olMoney(total)} <Icon icon="ph:arrow-right" width={17} />
                </button>
                {hasWa && (
                  <button type="button" onClick={pedirWa} className={`${btnCls} mt-2 h-11 w-full border bg-white`} style={{ borderColor: t.line, color: t.ink }}>
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
