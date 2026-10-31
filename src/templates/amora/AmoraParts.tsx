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
import { mix, amEase } from './motion';

/**
 * Piezas base de la plantilla Amora (carteras con estilo "tienda personalizada" fresco y amable):
 * tema, header claro de dos niveles, footer menta, tarjeta de producto y carrito.
 * Regla de la plantilla: nada inventado. Si un dato no existe en la tienda, la UI se oculta.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

export const amMoney = (v: any) => `S/ ${Number(v || 0).toFixed(2)}`;
/** Precio compacto para títulos grandes: sin decimales cuando son ,00. */
export const amPrice = (v: any) => { const n = Number(v || 0); return `S/ ${Number.isInteger(n) ? n : n.toFixed(2)}`; };
export const editable = (v: any, fallback: string) => String(v || '').trim() || fallback;
export const storeNameOf = (tienda: any, fallback = 'Amora') => tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || fallback;
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

/** Valores por defecto del esquema DisenoRubro: significan "sin personalizar". */
const SCHEMA_DEFAULTS = ['#6a6cff', '#ff6b6b'];
const pick = (v: any, fallback: string) => {
  const s = String(v || '').trim();
  return !s || SCHEMA_DEFAULTS.includes(s.toLowerCase()) ? fallback : s;
};

const BASE_BG = '#FFFFFF';
/** Pasteles de la referencia (menta, durazno, lavanda, rosa, mantequilla, cielo). Decorativos. */
export const PASTELS = { mint: '#E9F4E2', peach: '#FDEDDC', lavender: '#EFE9FB', pink: '#FCE6EE', butter: '#FCF2D3', sky: '#E4EFFA' };
const TILES = [PASTELS.mint, PASTELS.peach, PASTELS.lavender, PASTELS.pink, PASTELS.butter, PASTELS.sky];

// ── Design tokens (verde fresco + coral de la referencia; Poppins + Nunito Sans + Caveat) ──
export function amTheme(diseno: any) {
  const primary = pick(diseno?.colorPrimario, '#2E7D32'); // verde (botones, logo, resaltados)
  const accent = pick(diseno?.colorAccento, '#EF7E6B');   // coral (corazones, detalles)
  const rawBg = String(diseno?.colorSecundario || '').trim();
  const bgLum = luminance(rawBg);
  // "Color de fondo" global: claro → tal cual; saturado u oscuro → tinte suave sobre blanco.
  const bg = !rawBg || rawBg.toLowerCase() === '#ffffff' ? BASE_BG : bgLum !== null && bgLum < 0.78 ? mix(rawBg, 6, BASE_BG) : rawBg;
  const ink = '#1C2A21';
  const pl = luminance(primary);
  const al = luminance(accent);
  const display = `'Poppins', 'Nunito Sans', ui-sans-serif, system-ui, sans-serif`;
  const chrome = mix(primary, 72, '#0D1A11');
  return {
    primary,
    accent,
    /** Principal/acento como texto sobre fondo claro: si son muy claros, caen a tinta. */
    primaryInk: pl !== null && pl > 0.45 ? ink : primary,
    accentInk: al !== null && al > 0.55 ? ink : accent,
    /** Acento como texto sobre fondo OSCURO: si es oscuro, cae a blanco. */
    accentOnDark: al !== null && al < 0.25 ? '#fff' : accent,
    bg,
    surface: '#FFFFFF',
    ink,
    muted: '#66706A',
    soft: mix(primary, 9, '#fff'),
    line: '#E8ECE5',
    /** Fondo verde-gris muy claro de bandas (beneficios, footer). */
    cream: mix(primary, 5, '#F7F8F4'),
    blushDeep: mix(primary, 12, '#fff'),
    sale: '#E5484D',
    chrome,
    chrome2: mix(primary, 80, '#0D1A11'),
    pastels: PASTELS,
    tiles: TILES,
    onPrimary: readableText(primary),
    onAccent: readableText(accent),
    font: `'${diseno?.tipografia && diseno.tipografia !== 'Inter' ? diseno.tipografia : 'Nunito Sans'}', ui-sans-serif, system-ui, sans-serif`,
    display,
    script: `'Caveat', 'Segoe Script', cursive`,
    /** Alias para páginas compartidas que piden "serif"/"mono" de títulos y etiquetas. */
    serif: display,
    mono: display,
  };
}
export type Theme = ReturnType<typeof amTheme>;

/** Color pastel estable para una categoría (la misma categoría siempre cae en el mismo tono). */
export function tileFor(t: Theme, key: any): string {
  const s = String(key || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return t.tiles[h % t.tiles.length];
}

/** Inyecta Poppins + Nunito Sans + Caveat una sola vez. */
export function useAmFont() {
  useEffect(() => {
    const id = 'amora-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Nunito+Sans:opsz,wght@6..12,400..800&family=Caveat:wght@600;700&display=swap';
    document.head.appendChild(link);
  }, []);
}

/** Botón píldora de la referencia. */
export const btnCls = 'inline-flex items-center justify-center gap-2 rounded-full text-[14px] font-semibold transition-[filter,transform,background-color,color,box-shadow,border-color] hover:brightness-105 active:scale-[0.98]';

/** Etiqueta corta en mayúsculas (sobre-títulos). */
export function Eyebrow({ t, children, light = false, className = '' }: { t: Theme; children: ReactNode; light?: boolean; className?: string }) {
  return <p className={`text-[11.5px] font-bold uppercase tracking-[0.12em] ${className}`} style={{ fontFamily: t.display, color: light ? '#fff' : t.primaryInk }}>{children}</p>;
}

/** Estrellas reales; si aún no tiene reseñas, "Nuevo" (nunca estrellas de relleno). */
export function Stars({ producto, t, size = 13, light = false }: { producto: any; t: Theme; size?: number; light?: boolean }) {
  const rating = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const count = Number(producto?.ratingCount || producto?.reviewsCount || 0);
  const muted = light ? 'rgba(255,255,255,.7)' : t.muted;
  if (!(rating > 0 && count > 0)) return <span className="text-[12px] font-semibold" style={{ color: muted }}>Nuevo</span>;
  return (
    <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: muted }} aria-label={`${rating.toFixed(1)} de 5 (${count} reseñas)`}>
      <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon={i < Math.round(rating) ? 'solar:star-bold' : 'solar:star-linear'} width={size} className="text-amber-400" />)}</span>
      <span className="font-semibold">({rating.toFixed(1)})</span>
    </span>
  );
}

/** Logo: imagen real de la tienda o ícono de cartera verde + nombre (como el logo de la referencia). */
export function Logo({ tienda, diseno, t, onClick, light = false }: { tienda: any; diseno: any; t: Theme; onClick?: () => void; light?: boolean }) {
  const name = editable(diseno?.amoraLogoText, storeNameOf(tienda));
  const tagline = optional(diseno?.amoraLogoTagline, '');
  const content = tienda?.logo ? (
    <span className={`flex items-center rounded-xl ${light ? 'bg-white px-2 py-1' : ''}`}>
      <img src={tienda.logo} alt={name} className="h-10 w-auto max-w-[150px] object-contain" />
    </span>
  ) : (
    <span className="flex min-w-0 items-center gap-2">
      <Icon icon="ph:handbag-simple-fill" width={30} className="shrink-0" style={{ color: light ? '#fff' : t.primary }} />
      <span className="min-w-0 leading-none">
        <span className="block max-w-[130px] truncate text-[21px] font-bold tracking-[-0.02em] sm:max-w-[220px] sm:text-[24px]" style={{ fontFamily: t.display, color: light ? '#fff' : t.ink }}>{name}</span>
        {tagline && <span className="mt-1 hidden truncate text-[11px] font-semibold sm:block" style={{ color: light ? 'rgba(255,255,255,.7)' : t.muted }}>{tagline}</span>}
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
  if (tienda?.aceptaEnvio !== false) s.push({ tag: 'ENVÍO', icon: 'solar:delivery-linear', label: 'Envío a domicilio', sub: envio > 0 ? `Tarifa fija de ${amMoney(envio)}` : 'Hasta la puerta de tu casa', ...(envio > 0 ? { value: amPrice(envio), unit: 'tarifa fija' } : {}) });
  if (tienda?.aceptaRecojo) {
    const min = Number(tienda?.tiempoPreparacionMin || 0);
    s.push({ tag: 'RECOJO', icon: 'solar:shop-2-linear', label: 'Recojo en tienda', sub: min > 0 ? `Listo en unos ${min} minutos` : 'Sin costo de envío', value: 'S/ 0', unit: 'de envío' });
  }
  s.push({ tag: 'SEGURA', icon: 'solar:shield-check-linear', label: 'Compra segura', sub: 'Confirmas antes de pagar' });
  if (hasWhatsapp) s.push({ tag: 'ASESORÍA', icon: 'solar:chat-round-like-linear', label: 'Te asesoramos', sub: 'Fotos y medidas por WhatsApp' });
  s.push({ tag: 'TRACKING', icon: 'solar:map-arrow-square-linear', label: 'Seguimiento', sub: 'Sigue tu pedido con un código' });
  return s;
}

// ─────────────────────────────────────────────────────────────── Header ──
/**
 * Header claro de la referencia: logo + buscador gris con botón verde + accesos con etiqueta
 * (Mi pedido, Favoritos, Contacto) + carrito; debajo, la fila "Comprar por categoría" con las
 * categorías reales y "Ofertas" en rojo solo si hay ofertas reales. Estado propio aislado aquí.
 */
export function AmHeader({ tienda, slug, diseno, categories, t, cartCount, favCount, onOpenCart, onOpenFav, navigate, active, hasOffers = false, onOffers }: any) {
  const [menu, setMenu] = useState<null | 'cats' | 'search' | 'mobile'>(null);
  const [q, setQ] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const cats: string[] = categories || [];
  const go = (to: string) => { setMenu(null); navigate(to); };
  const panelRef = useRef<HTMLDivElement>(null);
  const submit = () => go(`/tienda/${slug}/catalogo${q.trim() ? `?search=${encodeURIComponent(q.trim())}` : ''}`);
  const placeholder = editable(diseno?.amoraSearchPlaceholder, 'Busca carteras, mochilas, billeteras…');
  const goOffers = () => { setMenu(null); if (onOffers) onOffers(); else navigate(`/tienda/${slug}#ofertas`); };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!panelRef.current?.contains(e.target as Node)) setMenu(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [menu]);

  const searchForm = (cls: string, autoFocus = false) => (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className={`flex h-12 items-center gap-2 rounded-full border pl-5 pr-1.5 transition-colors focus-within:bg-white ${cls}`} style={{ background: '#F4F6F2', borderColor: t.line }} role="search">
      <input autoFocus={autoFocus} value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label="Buscar productos" className="min-w-0 flex-1 appearance-none border-0 bg-transparent bg-none p-0 text-[14px] outline-none placeholder:text-slate-400 focus:ring-0" style={{ color: t.ink }} />
      <button type="submit" aria-label="Buscar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] transition-[filter] hover:brightness-110" style={{ background: t.primary, color: t.onPrimary }}><Icon icon="solar:magnifer-linear" width={18} /></button>
    </form>
  );

  return (
    <header ref={panelRef} className="sticky top-0 z-30 bg-white/95 backdrop-blur-md transition-shadow" style={{ fontFamily: t.font, boxShadow: scrolled ? '0 10px 30px -22px rgba(28,42,33,.45)' : 'none' }}>
      <div className="mx-auto flex h-[74px] max-w-[1320px] items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Logo tienda={tienda} diseno={diseno} t={t} onClick={() => go(`/tienda/${slug}`)} />
        {searchForm('mx-auto hidden max-w-[520px] flex-1 md:flex')}
        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-2 md:ml-0">
          <span className="md:hidden"><HdrIcon t={t} label="Buscar" icon="solar:magnifer-linear" onClick={() => setMenu(menu === 'search' ? null : 'search')} /></span>
          <HdrIcon t={t} label={editable(diseno?.amoraNavTrack, 'Mi pedido')} icon="solar:box-minimalistic-linear" onClick={() => go(`/tienda/${slug}/seguimiento`)} showLabel hideMobile />
          <HdrIcon t={t} label="Favoritos" icon="solar:heart-linear" onClick={onOpenFav} badge={favCount} showLabel />
          <HdrIcon t={t} label={editable(diseno?.amoraNavContact, 'Contacto')} icon="solar:chat-round-dots-linear" onClick={() => go(`/tienda/${slug}/contacto`)} showLabel hideMobile />
          <HdrIcon t={t} label="Carrito" icon="solar:cart-large-minimalistic-linear" onClick={onOpenCart} badge={cartCount} cart />
          <span className="lg:hidden"><HdrIcon t={t} label="Menú" icon={menu === 'mobile' ? 'solar:close-circle-linear' : 'solar:hamburger-menu-linear'} onClick={() => setMenu(menu === 'mobile' ? null : 'mobile')} /></span>
        </div>
      </div>

      <div className="hidden border-y lg:block" style={{ borderColor: t.line }}>
        <div className="mx-auto flex h-[52px] max-w-[1320px] items-center gap-6 px-6">
          <button type="button" onClick={() => setMenu(menu === 'cats' ? null : 'cats')} aria-expanded={menu === 'cats'} className="flex shrink-0 items-center gap-2 rounded-[10px] px-3.5 py-2 text-[13.5px] font-semibold transition-colors" style={{ background: t.soft, color: t.primaryInk }}>
            <Icon icon="solar:widget-4-linear" width={18} /> {editable(diseno?.amoraNavCategories, 'Comprar por categoría')}
          </button>
          <nav className="flex min-w-0 flex-1 items-center gap-8 overflow-hidden" aria-label="Categorías">
            {[{ label: editable(diseno?.amoraNavShop, 'Ver todo'), key: 'catalog', to: `/tienda/${slug}/catalogo` }, ...cats.slice(0, 6).map((c) => ({ label: c, key: `cat-${c}`, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` }))].map((it) => (
              <button key={it.key} type="button" onClick={() => go(it.to)} className="relative whitespace-nowrap py-1 text-[13.5px] font-semibold transition-colors hover:opacity-100" style={{ color: active === it.key ? t.primaryInk : t.ink, opacity: active === it.key ? 1 : 0.86 }}>
                {it.label}
                {active === it.key && <span className="absolute inset-x-0 -bottom-[15px] h-[2px] rounded-full" style={{ background: t.primary }} />}
              </button>
            ))}
            {hasOffers && <button type="button" onClick={goOffers} className="whitespace-nowrap py-1 text-[13.5px] font-bold" style={{ color: t.sale }}>{editable(diseno?.amoraNavOffers, 'Ofertas')}</button>}
          </nav>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {menu === 'cats' && (
          <motion.div key="cats" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease: amEase }} className="absolute inset-x-0 top-full hidden px-6 pt-2 lg:block">
            <div className="mx-auto grid max-w-[1320px] grid-cols-4 gap-1 rounded-[22px] border bg-white p-3 shadow-[0_30px_60px_-30px_rgba(28,42,33,0.4)]" style={{ borderColor: t.line }}>
              {cats.slice(0, 16).map((c) => (
                <button key={c} type="button" onClick={() => go(`/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`)} className="flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-[14px] font-semibold transition-colors hover:bg-slate-50" style={{ color: t.ink }}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]" style={{ background: tileFor(t, c), color: t.ink }}><Icon icon="ph:handbag-simple" width={18} /></span>
                  <span className="truncate">{c}</span>
                </button>
              ))}
              <button type="button" onClick={() => go(`/tienda/${slug}/catalogo`)} className="flex items-center gap-2 rounded-[14px] px-3 py-2.5 text-[14px] font-bold" style={{ color: t.primaryInk }}>Ver todo el catálogo <Icon icon="solar:arrow-right-linear" width={16} /></button>
            </div>
          </motion.div>
        )}
        {menu === 'search' && (
          <motion.div key="search" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease: amEase }} className="px-4 pb-3 md:hidden">
            {searchForm('w-full', true)}
          </motion.div>
        )}
        {menu === 'mobile' && (
          <motion.nav key="mobile" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease: amEase }} className="max-h-[75vh] overflow-y-auto border-t bg-white px-3 pb-4 pt-2 lg:hidden" style={{ borderColor: t.line }} aria-label="Menú móvil">
            {[
              { label: editable(diseno?.amoraNavHome, 'Inicio'), to: `/tienda/${slug}` },
              { label: editable(diseno?.amoraNavShop, 'Ver todo'), to: `/tienda/${slug}/catalogo` },
              ...cats.slice(0, 10).map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })),
              { label: editable(diseno?.amoraNavTrack, 'Mi pedido'), to: `/tienda/${slug}/seguimiento` },
              { label: editable(diseno?.amoraNavContact, 'Contacto'), to: `/tienda/${slug}/contacto` },
            ].map((it, i) => (
              <button key={`${it.label}-${i}`} type="button" onClick={() => go(it.to)} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[15px] font-semibold hover:bg-slate-50" style={{ color: t.ink }}>
                {it.label}<Icon icon="solar:alt-arrow-right-linear" width={16} style={{ color: t.muted }} />
              </button>
            ))}
            {hasOffers && (
              <button type="button" onClick={goOffers} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[15px] font-bold" style={{ color: t.sale }}>
                {editable(diseno?.amoraNavOffers, 'Ofertas')}<Icon icon="solar:alt-arrow-right-linear" width={16} />
              </button>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function HdrIcon({ t, label, icon, onClick, badge = 0, showLabel = false, hideMobile = false, cart = false }: { t: Theme; label: string; icon: string; onClick: () => void; badge?: number; showLabel?: boolean; hideMobile?: boolean; cart?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={`relative flex flex-col items-center justify-center rounded-xl transition-colors hover:bg-slate-50 ${showLabel ? 'h-12 min-w-[44px] px-1.5 lg:min-w-[58px]' : 'h-11 w-11'} ${hideMobile ? 'hidden sm:flex' : ''}`} style={{ color: t.ink }}>
      <Icon icon={icon} width={cart ? 26 : 23} />
      {showLabel && <span className="mt-0.5 hidden text-[11.5px] font-semibold leading-none lg:block">{label}</span>}
      {badge > 0 && <span className={`absolute flex h-[19px] min-w-[19px] items-center justify-center rounded-full px-1 text-[10.5px] font-bold ring-2 ring-white ${showLabel ? 'right-1 top-0.5' : 'right-0.5 top-0.5'}`} style={{ background: t.primary, color: t.onPrimary, fontFamily: t.display }}>{badge}</span>}
    </button>
  );
}

// ───────────────────────────────────────────────────── Medios de pago ──
/** Medios de pago REALES de la tienda (/payment-config). Carga aislada; si no hay datos, no se muestra nada (ni el título). */
export function PaymentBadges({ slug, fg, line, bg = 'transparent', title, titleStyle }: { slug: string; fg: string; line: string; bg?: string; title?: string; titleStyle?: CSSProperties }) {
  const [cfg, setCfg] = useState<any>(null);
  useEffect(() => {
    if (!slug || slug === 'preview') return;
    let alive = true;
    axios.get(`${BASE_URL}/public/store/${slug}/payment-config`).then((r) => { if (alive) setCfg(r.data?.data || r.data); }).catch(() => {});
    return () => { alive = false; };
  }, [slug]);
  if (!cfg) return null;
  const items: { label: string; icon: string }[] = [];
  if (cfg.aceptaTarjeta || cfg.aceptaNiubiz) items.push({ label: 'Tarjeta', icon: 'solar:card-bold-duotone' });
  if (cfg.aceptaMercadoPago) items.push({ label: 'Mercado Pago', icon: 'simple-icons:mercadopago' });
  if (cfg.yapeQrUrl || cfg.yapeQR || cfg.yapeNumero) items.push({ label: 'Yape', icon: 'solar:smartphone-2-bold-duotone' });
  if (cfg.plinQrUrl || cfg.plinQR || cfg.plinNumero) items.push({ label: 'Plin', icon: 'solar:smartphone-2-bold-duotone' });
  if (Array.isArray(cfg.cuentasBancarias) && cfg.cuentasBancarias.length) items.push({ label: 'Transferencia', icon: 'solar:buildings-2-bold-duotone' });
  if (cfg.aceptaEfectivo) items.push({ label: 'Efectivo', icon: 'solar:wad-of-money-bold-duotone' });
  if (!items.length) return null;
  return (
    <div>
      {title && <p className="mb-3 text-[14px] font-semibold" style={titleStyle}>{title}</p>}
      <div className="flex flex-wrap items-center gap-1.5">
        {items.map((it) => <span key={it.label} className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-bold" style={{ borderColor: line, color: fg, background: bg }}><Icon icon={it.icon} width={14} />{it.label}</span>)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── Footer ──
/**
 * Footer de la referencia: franja de beneficios reales, caja menta con novedades por WhatsApp
 * (en vez de un correo que no se guarda), columnas reales y medios de pago reales; barra final con redes reales.
 */
export function AmFooter({ tienda, slug, diseno, t, categories, navigate }: any) {
  const storeName = storeNameOf(tienda);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const waUrl = buildStorePurchaseWhatsappUrl(waNumber, 'Hola, tengo una consulta.');
  const newsUrl = buildStorePurchaseWhatsappUrl(waNumber, editable(diseno?.amoraNewsMessage, 'Hola, quiero recibir novedades y lanzamientos de la tienda.'));
  const address = [tienda?.direccion, tienda?.distrito].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  const horario = String(tienda?.horarioAtencion || '').trim();
  const socials = [
    tienda?.facebookUrl ? { label: 'Facebook', icon: 'ic:baseline-facebook', url: tienda.facebookUrl } : null,
    tienda?.instagramUrl ? { label: 'Instagram', icon: 'mdi:instagram', url: tienda.instagramUrl } : null,
    tienda?.tiktokUrl ? { label: 'TikTok', icon: 'ic:baseline-tiktok', url: tienda.tiktokUrl } : null,
    waUrl ? { label: 'WhatsApp', icon: 'ic:baseline-whatsapp', url: waUrl } : null,
  ].filter(Boolean) as { label: string; icon: string; url: string }[];
  const cats: string[] = (categories || []).slice(0, 4);
  const intro = String(diseno?.amoraFooterText || tienda?.descripcionTienda || '').trim();
  const services = buildServices(tienda, Boolean(waUrl)).slice(0, 5);
  const cols: { title: string; items: { label: string; to: string }[] }[] = [
    { title: 'Tienda', items: [{ label: 'Ver todo', to: `/tienda/${slug}/catalogo` }, ...cats.map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` }))] },
    { title: 'Ayuda', items: [
      { label: 'Contacto', to: `/tienda/${slug}/contacto` },
      { label: 'Preguntas frecuentes', to: `/tienda/${slug}/contacto#faq` },
      { label: 'Seguimiento de pedido', to: `/tienda/${slug}/seguimiento` },
    ] },
  ];
  const sub = t.muted;

  return (
    <footer className="mt-16" style={{ fontFamily: t.font, color: t.ink }}>
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
        {/* Franja de beneficios (reales) */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-[22px] border px-5 py-5 sm:grid-cols-3 lg:flex lg:justify-between lg:divide-x" style={{ background: t.cream, borderColor: t.line }}>
          {services.map((s) => (
            <div key={s.label} className="flex items-center gap-3 lg:flex-1 lg:justify-center lg:px-3" style={{ borderColor: t.line }}>
              <Icon icon={s.icon} width={30} className="shrink-0" style={{ color: t.primaryInk }} />
              <span className="min-w-0 leading-tight">
                <span className="block text-[13.5px] font-bold" style={{ fontFamily: t.display }}>{s.label}</span>
                <span className="mt-0.5 block text-[12px]" style={{ color: sub }}>{s.sub}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Caja principal */}
        <div className="mt-5 grid gap-x-8 gap-y-9 rounded-[26px] px-6 py-9 sm:px-10 md:grid-cols-[1.35fr_0.8fr_0.9fr_1.1fr]" style={{ background: mix(t.primary, 6, '#F7F9F3') }}>
          <div>
            {newsUrl ? (
              <>
                <p className="text-[21px] font-semibold leading-snug tracking-[-0.01em]" style={{ fontFamily: t.display }}>{editable(diseno?.amoraNewsTitle, 'Recibe novedades y lanzamientos')}</p>
                <p className="mt-1 text-[13.5px]" style={{ color: sub }}>{editable(diseno?.amoraNewsText, 'Directo a tu WhatsApp, sin spam.')}</p>
                <a href={newsUrl} target="_blank" rel="noopener noreferrer" className={`${btnCls} mt-5 h-11 px-5`} style={{ background: t.primary, color: t.onPrimary }}>
                  <Icon icon="ic:baseline-whatsapp" width={19} /> {editable(diseno?.amoraNewsButton, 'Quiero recibirlas')}
                </a>
              </>
            ) : (
              <Logo tienda={tienda} diseno={diseno} t={t} onClick={() => navigate(`/tienda/${slug}`)} />
            )}
            {intro && <p className="mt-5 max-w-sm whitespace-pre-line text-[13px] leading-relaxed" style={{ color: sub }}>{intro}</p>}
            {(address || horario) && (
              <ul className="mt-5 space-y-2 text-[13px]" style={{ color: sub }}>
                {address && <li className="flex gap-2"><Icon icon="solar:map-point-linear" width={16} className="mt-0.5 shrink-0" style={{ color: t.primaryInk }} />{address}</li>}
                {horario && <li className="flex gap-2"><Icon icon="solar:clock-circle-linear" width={16} className="mt-0.5 shrink-0" style={{ color: t.primaryInk }} />{horario}</li>}
              </ul>
            )}
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <p className="text-[14px] font-semibold" style={{ fontFamily: t.display }}>{col.title}</p>
              <ul className="mt-4 space-y-2.5 text-[13.5px]">
                {col.items.map((it) => (
                  <li key={it.label}><button type="button" onClick={() => navigate(it.to)} className="text-left transition-colors hover:underline" style={{ color: sub }}>{it.label}</button></li>
                ))}
              </ul>
            </div>
          ))}
          <PaymentBadges slug={slug} fg={t.ink} line={t.line} bg="#fff" title="Aceptamos" titleStyle={{ fontFamily: t.display, color: t.ink }} />
        </div>

        <div className="flex flex-col gap-3 py-6 text-[12.5px] sm:flex-row sm:items-center sm:justify-between" style={{ color: sub }}>
          <p>© {new Date().getFullYear()} {String(storeName).replace(/\.+$/, '')}. {optional(diseno?.amoraFooterTagline, 'Todos los derechos reservados.')}</p>
          <EnlaceLibroReclamaciones slug={slug} diseno={diseno} />
          {socials.length > 0 && (
            <div className="flex gap-1.5">
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5" style={{ color: t.ink }}><Icon icon={s.icon} width={19} /></a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────── Product card ──
/**
 * Tarjeta de la referencia: foto sobre pastel estable por categoría, sello de descuento real,
 * estrellas reales, precio con tachado real y botón "Agregar +" con cantidad editable.
 * Estado de cantidad aislado aquí.
 */
export function AmProductCard({ producto, slug, t, onOpen, onAdd, tone, dense = false }: { producto: any; slug: string; t: Theme; onOpen: () => void; onAdd: (qty: number) => void; tone?: string; dense?: boolean }) {
  const pricing = getProductPricing(producto);
  const stock = Number(producto?.stock ?? 1);
  const isOut = sinStock(stock);
  const hasVariants = Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const colors = getFashionColors(producto).slice(0, 4);
  const [qty, setQty] = useState(1);
  const [imgError, setImgError] = useState(false);
  const category = nameOf(producto?.categoria);
  const bg = tone || tileFor(t, category || producto?.id);
  const low = !isOut && !hasVariants && pocasUnidades(stock);

  return (
    <article className="group flex h-full cursor-pointer flex-col rounded-[20px] border bg-white p-2.5 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-30px_rgba(28,42,33,0.5)] sm:p-3" style={{ borderColor: t.line }} onClick={onOpen}>
      <div className="relative aspect-square overflow-hidden rounded-[16px]" style={{ background: bg }}>
        {isOut ? (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold" style={{ color: t.muted }}>Agotado</span>
        ) : pricing.enOferta ? (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-full px-2.5 py-1 text-[11.5px] font-bold text-white" style={{ background: t.sale, fontFamily: t.display }}>-{pricing.porcentajeDescuento}%</span>
        ) : producto?.destacado ? (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: t.primary, color: t.onPrimary }}>Destacado</span>
        ) : null}
        <div className="absolute right-2 top-2 z-10 [&_button:nth-child(n+2)]:opacity-0 [&_button]:transition-opacity group-hover:[&_button:nth-child(n+2)]:opacity-100 [@media(hover:none)]:[&_button:nth-child(n+2)]:opacity-100" onClick={(e) => e.stopPropagation()}>
          <ProductCardActions producto={producto} slug={slug} cp={t.primary} />
        </div>
        {producto?.imagenUrl && !imgError ? (
          <img src={producto.imagenUrl} alt={producto.descripcion} loading="lazy" onError={() => setImgError(true)} className={`absolute inset-0 h-full w-full object-contain p-[11%] mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.06] ${isOut ? 'opacity-50 grayscale' : ''}`} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"><Icon icon="ph:handbag-simple-light" width={64} style={{ color: mix(t.ink, 25, bg) }} /></div>
        )}
        {low && <span className="absolute bottom-2.5 left-2.5 z-10 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold" style={{ color: t.sale }}>¡Quedan {stock}!</span>}
      </div>

      <div className="flex flex-1 flex-col px-1 pt-3">
        {category && !dense && <p className="truncate text-[11.5px] font-semibold" style={{ color: t.muted }}>{category}</p>}
        <h3 title={producto?.descripcion} className="line-clamp-2 text-[14px] font-semibold leading-snug" style={{ color: t.ink, fontFamily: t.display }}>{producto?.descripcion}</h3>
        <div className="mt-1.5 flex items-center gap-2">
          <Stars producto={producto} t={t} size={12} />
          {colors.length > 0 && <span className="flex -space-x-1">{colors.map((c) => <span key={c.name} title={c.name} className="h-3 w-3 rounded-full ring-2 ring-white" style={{ background: c.hex }} />)}</span>}
        </div>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="text-[18px] font-bold tracking-[-0.02em]" style={{ color: t.ink, fontFamily: t.display }}>{amMoney(pricing.precioFinal)}</span>
          {pricing.enOferta && <span className="text-[12.5px] font-semibold line-through" style={{ color: t.muted }}>{amMoney(pricing.precioRegular)}</span>}
        </div>

        <div className="mt-auto flex flex-col gap-1.5 pt-3 sm:flex-row" onClick={(e) => e.stopPropagation()}>
          {!hasVariants && !isOut && !dense && (
            <div className="flex h-10 w-full shrink-0 items-center justify-between rounded-full border px-1 sm:w-[84px]" style={{ borderColor: t.line }}>
              <button type="button" aria-label="Restar" onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-8 w-7 items-center justify-center text-[16px] font-bold" style={{ color: t.primaryInk }}>−</button>
              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setQty(d === '' ? 1 : Math.max(1, parseInt(d, 10))); }} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[13.5px] font-bold outline-none focus:ring-0" style={{ color: t.ink }} />
              <button type="button" aria-label="Sumar" onClick={() => setQty(qty + 1)} className="flex h-8 w-7 items-center justify-center text-[16px] font-bold" style={{ color: t.primaryInk }}>+</button>
            </div>
          )}
          <button
            type="button"
            disabled={isOut}
            onClick={() => { if (isOut) return; if (hasVariants) onOpen(); else onAdd(Math.max(1, dense ? 1 : qty)); }}
            className="flex h-10 w-full min-w-0 items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-[filter,transform,background-color,color] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed sm:w-auto sm:flex-1"
            style={isOut ? { background: '#EEF0EC', color: t.muted } : { background: t.primary, color: t.onPrimary }}
          >
            <span className="truncate">{isOut ? 'Agotado' : hasVariants ? 'Ver opciones' : 'Agregar'}</span>
            {!isOut && <Icon icon={hasVariants ? 'solar:alt-arrow-right-linear' : 'solar:add-circle-linear'} width={17} className="shrink-0" />}
          </button>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────── Cart modal ──
export function AmCartModal({ isOpen, onClose, carrito, actualizarCantidad, onCheckout, t, tienda, diseno }: any) {
  const items: any[] = carrito || [];
  const total = items.reduce((a, it) => a + Number(it.precioUnitario || 0) * Number(it.cantidad || 1), 0);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(waNumber, 'x'));
  const pedirWa = () => {
    if (!items.length) return;
    const detail = items.map((it) => `• ${Number(it.cantidad || 1)} x ${it.descripcion} - ${amMoney(Number(it.precioUnitario || 0) * Number(it.cantidad || 1))}`).join('\n');
    const url = buildStorePurchaseWhatsappUrl(waNumber, `Hola, quiero pedir estos productos en ${storeNameOf(tienda)}:\n\n${detail}\n\nTotal estimado: ${amMoney(total)}`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  const drawerStyle: CSSProperties = { background: '#fff', fontFamily: t.font };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button type="button" aria-label="Cerrar carrito" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-[#0D1A11]/40 backdrop-blur-[2px]" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 260 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col shadow-2xl" style={drawerStyle} role="dialog" aria-label="Carrito">
            <header className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: t.line }}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: t.soft, color: t.primaryInk }}><Icon icon="solar:cart-large-minimalistic-bold" width={22} /></span>
                <div>
                  <h2 className="text-[20px] font-semibold leading-none" style={{ fontFamily: t.display, color: t.ink }}>Tu carrito</h2>
                  <p className="mt-1 text-[12.5px]" style={{ color: t.muted }}>{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
                </div>
              </div>
              <button type="button" aria-label="Cerrar" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100" style={{ color: t.ink }}><Icon icon="solar:close-circle-linear" width={24} /></button>
            </header>
            <div className="flex-1 overflow-y-auto p-4" style={{ background: t.cream }}>
              {!items.length ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: PASTELS.mint, color: t.primaryInk }}><Icon icon="ph:handbag-simple" width={36} /></span>
                  <h3 className="mt-5 text-[22px] font-semibold" style={{ color: t.ink, fontFamily: t.display }}>Tu carrito está vacío</h3>
                  <p className="mt-1.5 max-w-[260px] text-[13.5px]" style={{ color: t.muted }}>Encuentra la cartera perfecta en el catálogo.</p>
                  <button type="button" onClick={onClose} className={`${btnCls} mt-6 h-11 px-6`} style={{ background: t.primary, color: t.onPrimary }}>Seguir comprando</button>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {items.map((item) => {
                    const id = item.cartId || item.id;
                    const qty = Number(item.cantidad || 1);
                    const price = Number(item.precioUnitario || 0);
                    return (
                      <li key={id} className="relative grid grid-cols-[76px_1fr] gap-3 rounded-[18px] border bg-white p-2.5" style={{ borderColor: t.line }}>
                        <button type="button" aria-label="Quitar" onClick={() => actualizarCantidad(id, 0)} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"><Icon icon="solar:trash-bin-minimalistic-linear" width={16} /></button>
                        <div className="flex h-[76px] items-center justify-center overflow-hidden rounded-[14px]" style={{ background: tileFor(t, nameOf(item.categoria) || item.id) }}>
                          {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-2 mix-blend-multiply" /> : <Icon icon="ph:handbag-simple-light" width={28} style={{ color: t.muted }} />}
                        </div>
                        <div className="min-w-0 pr-7">
                          <h3 className="line-clamp-2 text-[13.5px] font-semibold leading-snug" style={{ color: t.ink, fontFamily: t.display }}>{item.descripcion}</h3>
                          <div className="mt-2.5 flex items-center justify-between">
                            <div className="flex h-9 items-center overflow-hidden rounded-full border" style={{ borderColor: t.line }}>
                              <button type="button" aria-label="Restar" onClick={() => actualizarCantidad(id, qty - 1)} className="flex w-8 items-center justify-center text-base font-bold" style={{ color: t.primaryInk }}>−</button>
                              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); actualizarCantidad(id, d === '' ? 1 : parseInt(d, 10)); }} onFocus={(e) => e.currentTarget.select()} className="w-9 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[13px] font-bold outline-none focus:ring-0" style={{ color: t.ink }} />
                              <button type="button" aria-label="Sumar" onClick={() => actualizarCantidad(id, qty + 1)} className="flex w-8 items-center justify-center text-base font-bold" style={{ color: t.primaryInk }}>+</button>
                            </div>
                            <span className="text-[15px] font-bold" style={{ color: t.ink, fontFamily: t.display }}>{amMoney(price * qty)}</span>
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
                  <span className="text-[13.5px] font-semibold" style={{ color: t.muted }}>Subtotal</span>
                  <span className="text-[24px] font-bold" style={{ color: t.ink, fontFamily: t.display }}>{amMoney(total)}</span>
                </div>
                <p className="mb-4 text-[12px]" style={{ color: t.muted }}>El envío se calcula en el checkout según tu forma de entrega.</p>
                <button type="button" onClick={() => { onClose(); onCheckout(); }} className={`${btnCls} h-12 w-full`} style={{ background: t.primary, color: t.onPrimary, boxShadow: `0 12px 26px -14px ${t.primary}` }}>
                  Ir a pagar · {amMoney(total)} <Icon icon="solar:arrow-right-linear" width={18} />
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
