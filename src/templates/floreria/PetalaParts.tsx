import EnlaceLibroReclamaciones from '@/components/tienda/EnlaceLibroReclamaciones';
import { useEffect, useState, type CSSProperties } from 'react';
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
import { AddedToast, FreeShippingProgress, SearchBox, announceAdded } from './PetalaExtras';
import { flEase, mix } from './motion';

/**
 * Piezas base de la plantilla Florería (Pétala): tema, header, footer, tarjeta y carrito.
 * Regla de la plantilla: nada inventado. Si un dato no existe en la tienda, la UI se oculta.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

export const flMoney = (v: any) => `S/ ${Number(v || 0).toFixed(2)}`;
export const editable = (v: any, fallback: string) => String(v || '').trim() || fallback;
export const storeNameOf = (tienda: any, fallback = 'Pétala') => tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || fallback;
export const nameOf = (v: any): string => (v && typeof v === 'object' ? v.nombre || v.descripcion || '' : typeof v === 'string' ? v : '');
export const isOn = (v: any) => v === true || v === 'true' || v === '1';
/** Texto opcional: si la clave no existe usa el valor por defecto; si el empresario la vació, se oculta. */
export const optional = (v: any, fallback: string) => (v === undefined || v === null ? fallback : String(v).trim());
/** "Emociones que|viven en la memoria" → saltos de línea (el editor es de una línea). */
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

/** Fotos de ejemplo (reemplazables en Personalizar). Sin marcas visibles. */
export const FLORERIA_IMG = {
  hero: [u('1591886960571-74d43a9d4166', 1800), u('1582794543139-8ac9cb0f7b11', 1800), u('1563241527-3004b7be0ffd', 1800)],
  builder: u('1572454591674-2739f30d8c40', 1000),
  why: [u('1518895949257-7621c3c786d7', 600), u('1513201099705-a9746e1e201f', 600), u('1567696153798-9111f9cd3d0d', 600), u('1579208575657-c595a05383b7', 600), u('1566576721346-d4a3b4eaeb55', 600)],
  club: u('1582794543139-8ac9cb0f7b11', 900),
  band: u('1496062031456-07b8f162a322', 1800),
  catalog: u('1589244159943-460088ed5c92', 1600),
  contact: u('1533616688419-b7a585564566', 1400),
};

const INK = '#2B2321';
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

// ── Design tokens: dorado bronce + rubor + marfil de la referencia; Cormorant Garamond + Inter (design system) ──
export function petalaTheme(diseno: any) {
  const primary = pick(diseno?.colorPrimario, SCHEMA_DEFAULTS.primary, '#9A7044'); // dorado bronce (botones, eyebrows, carrito)
  const accent = pick(diseno?.colorAccento, SCHEMA_DEFAULTS.accent, '#D9939F');    // rubor (badges, detalles, pétalos)
  const rawBg = pick(diseno?.colorSecundario, SCHEMA_DEFAULTS.bg, '#FBF7F2');       // marfil
  const bgLum = luminance(rawBg);
  const bg = bgLum !== null && bgLum < 0.78 ? mix(rawBg, 7, '#FFFFFF') : rawBg;
  const pl = luminance(primary);
  const al = luminance(accent);
  const onPrimary = textoBoton(diseno) ?? onColor(primary);
  return {
    primary,
    accent,
    /** Principal/acento como texto sobre fondo claro: si son muy claros, se oscurecen hacia la tinta. */
    primaryInk: pl !== null && pl > 0.28 ? mix(primary, 62, INK) : primary,
    accentInk: al !== null && al > 0.36 ? mix(accent, 48, INK) : accent,
    bg,
    ink: INK,
    muted: '#857873',
    line: mix(INK, 9, bg),
    surface: '#FFFFFF',
    /** Tintes suaves (rubor sobre marfil) para tarjetas, bandas y fondos de foto. */
    soft: mix(accent, 10, bg),
    softer: mix(accent, 5, '#FFFFFF'),
    blush: mix(accent, 18, bg),
    accentSoft: mix(accent, 14, '#FFFFFF'),
    card: mix(accent, 7, '#FFFCFA'),
    /** Banda oscura final de la referencia (espresso, con un toque de la marca). */
    dark: mix(primary, 14, '#231B19'),
    /** Botón dorado con brillo sutil, como la referencia. */
    gold: `linear-gradient(135deg, ${mix(primary, 82, '#fff')} 0%, ${primary} 55%, ${mix(primary, 82, '#2b2321')} 100%)`,
    onPrimary,
    onAccent: textoBoton(diseno) ?? onColor(accent),
    star: '#C9A15F',
    font: `'Inter', 'Segoe UI', system-ui, sans-serif`,
    serif: `'Cormorant Garamond', 'Cormorant', Georgia, 'Times New Roman', serif`,
  };
}
export type Theme = ReturnType<typeof petalaTheme>;

/** Inyecta Cormorant Garamond + Inter una sola vez. */
export function usePetalaFont() {
  useEffect(() => {
    const id = 'petala-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);
}

/** Botón píldora de la referencia. */
export const btnCls = 'inline-flex items-center justify-center gap-2.5 rounded-full text-[13.5px] font-medium tracking-[0.01em] transition-[filter,transform] hover:brightness-[1.06] active:scale-[0.98]';
/** Etiqueta superior de sección (mayúsculas espaciadas, dorado). */
export const eyebrowCls = 'text-[11px] font-medium uppercase tracking-[0.22em]';
/** Estilo del botón dorado principal. */
export const goldBtn = (t: Theme): CSSProperties => ({ background: t.gold, color: t.onPrimary, boxShadow: `0 12px 26px -14px ${mix(t.primary, 80, 'transparent')}` });

/** Estrellas reales; sin reseñas no se muestra nada. */
export function Rating({ producto, t, size = 12 }: { producto: any; t: Theme; size?: number }) {
  const rating = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const count = Number(producto?.ratingCount || producto?.reviewsCount || 0);
  if (!(rating > 0 && count > 0)) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11.5px]" aria-label={`${rating.toFixed(1)} de 5 (${count} reseñas)`}>
      <Icon icon="solar:star-bold" width={size} style={{ color: t.star }} />
      <span style={{ color: t.ink }}>{rating.toFixed(1)}</span>
      <span style={{ color: t.muted }}>({count})</span>
    </span>
  );
}

/** Ícono por palabra clave de la categoría (solo decorativo; la categoría es la real). */
export function categoryIcon(name: string): string {
  const n = String(name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (/rosa|ramo|bouquet|flor|tulip|girasol|lirio|orquid|peon/.test(n)) return 'ph:flower-tulip-light';
  if (/cumple|birthday/.test(n)) return 'ph:cake-light';
  if (/boda|matrim|novia|aniversar|amor|san valent|enamor/.test(n)) return 'ph:heart-light';
  if (/globo|fiesta|evento|baby|gender|nacim/.test(n)) return 'ph:balloon-light';
  if (/caja|box|regalo|detalle|peluche|chocolate|vino|desayuno/.test(n)) return 'ph:gift-light';
  if (/condolen|funeral|corona|simpat/.test(n)) return 'ph:flower-lotus-light';
  if (/planta|maceta|suculent/.test(n)) return 'ph:plant-light';
  if (/empresa|corporat|oficina/.test(n)) return 'ph:briefcase-light';
  return 'ph:flower-light';
}

/** Placeholder para productos sin foto: flor de línea sobre rubor. */
export function NoPhoto({ t, producto, size = 44 }: { t: Theme; producto?: any; size?: number }) {
  return (
    <span className="flex h-full w-full items-center justify-center" style={{ background: `radial-gradient(120% 90% at 30% 20%, ${t.blush} 0%, ${t.card} 70%)` }}>
      <Icon icon={categoryIcon(nameOf(producto?.categoria) || producto?.descripcion)} width={size} style={{ color: mix(t.accentInk, 55, '#fff') }} />
    </span>
  );
}

export function Logo({ tienda, diseno, t, onClick, light = false }: { tienda: any; diseno: any; t: Theme; onClick?: () => void; light?: boolean }) {
  const name = editable(diseno?.floreriaLogoText, storeNameOf(tienda));
  const tagline = String(diseno?.floreriaLogoTagline || '').trim();
  const color = light ? '#fff' : t.ink;
  const content = tienda?.logo ? (
    <img src={tienda.logo} alt={name} className="h-11 w-auto max-w-[180px] object-contain" />
  ) : (
    <span className="flex flex-col items-center leading-none">
      <span className="flex items-center gap-1.5 text-[26px] font-medium tracking-[0.02em]" style={{ fontFamily: t.serif, color }}>
        <Icon icon="ph:flower-tulip-light" width={22} style={{ color: light ? '#fff' : t.primaryInk }} />
        <span className="max-w-[220px] truncate">{name}</span>
      </span>
      {tagline && <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.42em]" style={{ color: light ? 'rgba(255,255,255,.75)' : t.muted }}>{tagline}</span>}
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
  if (tienda?.aceptaEnvio !== false) s.push({ icon: 'solar:delivery-linear', label: 'Entrega a domicilio', sub: envio > 0 ? `Desde ${flMoney(envio)}` : 'Costo al finalizar tu compra' });
  if (tienda?.aceptaRecojo) {
    const min = Number(tienda?.tiempoPreparacionMin || 0);
    s.push({ icon: 'solar:shop-2-linear', label: 'Recojo en tienda', sub: min > 0 ? `Listo en ~${min} min` : 'Sin costo de envío' });
  }
  // La nota del checkout llega con el pedido: es el canal real para la dedicatoria.
  s.push({ icon: 'solar:letter-linear', label: 'Tu dedicatoria', sub: 'Escríbela al finalizar tu pedido' });
  if (hasWhatsapp) s.push({ icon: 'solar:chat-round-like-linear', label: 'Te asesoramos', sub: 'Por WhatsApp' });
  s.push({ icon: 'solar:shield-check-linear', label: 'Compra segura', sub: 'Confirmas antes de pagar' });
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
      <h4 className={eyebrowCls} style={{ color: dark ? 'rgba(255,255,255,.6)' : t.muted }}>Medios de pago</h4>
      <div className="mt-4 flex flex-wrap gap-2">
        {medios.map((m) => {
          const meta = PAY_META[m];
          return (
            <span key={m} title={meta.label} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[11.5px] font-medium" style={dark ? { background: 'rgba(255,255,255,.08)', color: '#fff', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.12)' } : { background: '#fff', color: t.ink, boxShadow: `inset 0 0 0 1px ${t.line}` }}>
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white" style={{ background: meta.bg }}>{meta.mark ?? <Icon icon={meta.icon!} width={12} />}</span>
              {meta.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── Header ──
/**
 * Header de florería: navegación a la izquierda, logo centrado, buscador desplegable y carrito.
 * Estado propio (búsqueda, menú, sombra al bajar) aislado aquí.
 */
export function PetalaHeader({ tienda, slug, diseno, categories, t, cartCount, favCount, onOpenCart, onOpenFav, navigate, active, activeCategory }: any) {
  const [panel, setPanel] = useState<null | 'search' | 'menu'>(null);
  const [scrolled, setScrolled] = useState(false);
  const cats: string[] = categories || [];
  const go = (to: string) => { setPanel(null); navigate(to); };
  const catUrl = (c: string) => `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`;
  const placeholder = editable(diseno?.floreriaSearchPlaceholder, 'Busca ramos, rosas, ocasiones…');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navBtn = (label: string, key: string, to: string, on: boolean) => (
    <button key={key} type="button" onClick={() => go(to)} className="group relative py-2 text-[13px] font-medium tracking-[0.02em] transition-colors" style={{ color: on ? t.primaryInk : t.ink }}>
      <span className="block max-w-[160px] truncate">{label}</span>
      <span aria-hidden className={`absolute inset-x-0 bottom-0.5 h-px origin-left transition-transform duration-300 ${on ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} style={{ background: t.primary }} />
    </button>
  );

  return (
    <>
      <header className="sticky top-0 z-30 border-b backdrop-blur-md transition-shadow duration-300" style={{ borderColor: t.line, background: mix(t.bg, 90, 'transparent'), boxShadow: scrolled ? '0 14px 34px -26px rgba(43,35,33,0.5)' : 'none' }}>
        <div className="mx-auto grid h-[76px] max-w-[1320px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 lg:px-8">
          <div className="flex items-center gap-6 justify-self-start">
            <button type="button" aria-label="Menú" onClick={() => setPanel(panel === 'menu' ? null : 'menu')} className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-black/[0.04] lg:hidden" style={{ color: t.ink }}><Icon icon={panel === 'menu' ? 'solar:close-circle-linear' : 'solar:hamburger-menu-linear'} width={23} /></button>
            <nav className="hidden items-center gap-7 lg:flex" aria-label="Principal">
              {navBtn(editable(diseno?.floreriaNavShop, 'Ramos'), 'shop', `/tienda/${slug}/catalogo`, active === 'catalog' && !activeCategory)}
              {cats.slice(0, 2).map((c) => navBtn(c, `c-${c}`, catUrl(c), active === 'catalog' && activeCategory === c))}
              {navBtn(editable(diseno?.floreriaNavContact, 'Contacto'), 'contact', `/tienda/${slug}/contacto`, active === 'contact')}
            </nav>
          </div>
          <Logo tienda={tienda} diseno={diseno} t={t} onClick={() => go(`/tienda/${slug}`)} />
          <div className="flex items-center gap-1 justify-self-end">
            <IconBtn t={t} label="Buscar" icon="solar:magnifer-linear" onClick={() => setPanel(panel === 'search' ? null : 'search')} />
            <IconBtn t={t} label="Favoritos" icon="solar:heart-linear" onClick={onOpenFav} badge={favCount} />
            <button type="button" aria-label={`Carrito (${cartCount})`} onClick={onOpenCart} className="relative ml-1 flex h-11 items-center gap-2 rounded-full pl-3.5 pr-4 text-[13px] font-medium transition-[filter] hover:brightness-[1.06]" style={goldBtn(t)}>
              <Icon icon="solar:bag-heart-linear" width={19} />
              <span className="tabular-nums">{cartCount}</span>
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {panel === 'search' && (
            <motion.div key="search" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: flEase }} className="border-t" style={{ borderColor: t.line }}>
              <div className="mx-auto max-w-[760px] px-4 py-3">
                <SearchBox t={t} slug={slug} placeholder={placeholder} className="w-full" onSearch={(v) => go(`/tienda/${slug}/catalogo${v ? `?search=${encodeURIComponent(v)}` : ''}`)} onOpenProduct={(p) => go(`/tienda/${slug}/producto/${p.id}`)} />
              </div>
            </motion.div>
          )}
          {panel === 'menu' && (
            <motion.nav key="menu" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: flEase }} className="border-t px-4 pb-4 pt-2 lg:hidden" style={{ borderColor: t.line }} aria-label="Menú móvil">
              {[
                { label: editable(diseno?.floreriaNavHome, 'Inicio'), to: `/tienda/${slug}` },
                { label: editable(diseno?.floreriaNavShop, 'Ramos'), to: `/tienda/${slug}/catalogo` },
                ...cats.slice(0, 8).map((c) => ({ label: c, to: catUrl(c) })),
                { label: editable(diseno?.floreriaNavContact, 'Contacto'), to: `/tienda/${slug}/contacto` },
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

function IconBtn({ t, label, icon, onClick, badge = 0 }: { t: Theme; label: string; icon: string; onClick: () => void; badge?: number }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-black/[0.04]" style={{ color: t.ink }}>
      <Icon icon={icon} width={22} />
      {badge > 0 && <span className="absolute right-1 top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[9.5px] font-semibold" style={{ background: t.accent, color: t.onAccent }}>{badge}</span>}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────── Footer ──
/** Banda final oscura de la referencia (foto + frase en serif) + columnas del pie. */
export function PetalaFooter({ tienda, slug, diseno, t, categories, navigate }: any) {
  const storeName = storeNameOf(tienda);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const waUrl = buildStorePurchaseWhatsappUrl(waNumber, 'Hola, tengo una consulta.');
  const address = [tienda?.direccion, tienda?.distrito].map((v) => String(v || '').trim()).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  const horario = String(tienda?.horarioAtencion || '').trim();
  const socials = [
    tienda?.instagramUrl ? { icon: 'mdi:instagram', label: 'Instagram', url: tienda.instagramUrl } : null,
    tienda?.facebookUrl ? { icon: 'ic:baseline-facebook', label: 'Facebook', url: tienda.facebookUrl } : null,
    tienda?.tiktokUrl ? { icon: 'ic:baseline-tiktok', label: 'TikTok', url: tienda.tiktokUrl } : null,
    waUrl ? { icon: 'ic:baseline-whatsapp', label: 'WhatsApp', url: waUrl } : null,
  ].filter(Boolean) as { icon: string; label: string; url: string }[];
  const cats: string[] = (categories || []).slice(0, 6);
  const slogan = optional(diseno?.floreriaBandTitle, 'Regala emociones|que se quedan|en el corazón');
  const bandImg = diseno?.floreriaBandImage || FLORERIA_IMG.band;
  const intro = String(diseno?.floreriaFooterText || tienda?.descripcionTienda || '').trim();
  const sub = 'rgba(255,255,255,.62)';
  const cols: { title: string; items: { label: string; to: string }[] }[] = [
    { title: 'Tienda', items: [...cats.map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })), { label: 'Ver todos los ramos', to: `/tienda/${slug}/catalogo` }] },
    { title: 'Ayuda', items: [
      { label: 'Contacto', to: `/tienda/${slug}/contacto` },
      { label: 'Preguntas frecuentes', to: `/tienda/${slug}/contacto#faq` },
      { label: 'Seguir mi pedido', to: `/tienda/${slug}/seguimiento` },
    ] },
  ];

  return (
    <footer style={{ background: t.dark, color: '#fff' }}>
      {slogan && !isOn(diseno?.floreriaBandHidden) && (
        <div className="relative overflow-hidden">
          <img src={bandImg} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-70" />
          <span aria-hidden className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${t.dark} 18%, ${mix(t.dark, 55, 'transparent')} 55%, transparent 100%)` }} />
          <div className="relative mx-auto flex min-h-[260px] max-w-[1320px] items-center px-4 py-14 lg:px-8">
            <p className="whitespace-pre-line text-[38px] font-normal leading-[1.08] sm:text-[48px]" style={{ fontFamily: t.serif, color: mix(t.primary, 45, '#fff') }}>{lines(slogan)}</p>
          </div>
        </div>
      )}
      <div className="mx-auto grid max-w-[1320px] gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr_1.3fr] lg:px-8">
        <div>
          <Logo tienda={tienda} diseno={diseno} t={t} light />
          {intro && <p className="mt-4 max-w-xs whitespace-pre-line text-[13px] leading-relaxed" style={{ color: sub }}>{intro}</p>}
          {socials.length > 0 && (
            <div className="mt-5 flex gap-1.5">
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/15" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.18)' }}>
                  <Icon icon={s.icon} width={17} />
                </a>
              ))}
            </div>
          )}
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <h4 className={eyebrowCls} style={{ color: 'rgba(255,255,255,.6)' }}>{col.title}</h4>
            <ul className="mt-4 space-y-2.5 text-[13.5px]">
              {col.items.map((it) => <li key={it.label}><button type="button" onClick={() => navigate(it.to)} className="text-left text-white/85 transition-colors hover:text-white">{it.label}</button></li>)}
            </ul>
          </div>
        ))}
        {(address || horario) ? (
          <div>
            <h4 className={eyebrowCls} style={{ color: 'rgba(255,255,255,.6)' }}>Visítanos</h4>
            <ul className="mt-4 space-y-2.5 text-[13px] text-white/85">
              {address && <li className="flex gap-2"><Icon icon="solar:map-point-linear" width={16} className="mt-0.5 shrink-0" />{address}</li>}
              {horario && <li className="flex gap-2"><Icon icon="solar:clock-circle-linear" width={16} className="mt-0.5 shrink-0" />{horario}</li>}
            </ul>
          </div>
        ) : <div className="hidden lg:block" />}
        <PaymentMethods slug={slug} t={t} dark />
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-[1320px] px-4 py-5 text-center text-[12px] lg:px-8" style={{ color: sub }}>© {new Date().getFullYear()} {storeName}. Todos los derechos reservados. <EnlaceLibroReclamaciones slug={slug} diseno={diseno} className="ml-3 font-semibold" /></p>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────── Product card ──
/**
 * Tarjeta de ramo (estado propio de cantidad aislado): foto alta sobre rubor, nombre, precio,
 * cantidad y botón redondo dorado de carrito. Con variantes lleva a elegir en la ficha.
 */
export function PetalaProductCard({ producto, slug, t, onOpen, onAdd }: { producto: any; slug: string; t: Theme; onOpen: () => void; onAdd: (qty: number) => void }) {
  const pricing = getProductPricing(producto);
  const stock = Number(producto?.stock ?? 1);
  const isOut = sinStock(stock);
  const hasVariants = Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const colors = getFashionColors(producto).slice(0, 4);
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
    <article className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[22px] bg-white p-2 transition-shadow duration-500 hover:shadow-[0_26px_50px_-30px_rgba(43,35,33,0.45)]" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }} onClick={onOpen}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[16px]" style={{ background: t.card }}>
        <div className="absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1">
          {pricing.enOferta && <span className="rounded-full px-2.5 py-1 text-[10.5px] font-semibold" style={{ background: t.accent, color: t.onAccent }}>-{pricing.porcentajeDescuento}%</span>}
          {!pricing.enOferta && producto?.destacado && <span className="rounded-full px-2.5 py-1 text-[10.5px] font-medium" style={{ background: t.dark, color: '#fff' }}>Destacado</span>}
          {isOut ? <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-medium" style={{ color: t.muted }}>Agotado</span>
            : !hasVariants && pocasUnidades(stock) ? <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-medium shadow-sm" style={{ color: t.accentInk }}>Quedan {stock}</span> : null}
        </div>
        <div className="absolute right-2 top-2 z-10 [&_button:nth-child(n+2)]:opacity-0 [&_button]:transition-opacity group-hover:[&_button:nth-child(n+2)]:opacity-100 [@media(hover:none)]:[&_button:nth-child(n+2)]:opacity-100" onClick={(e) => e.stopPropagation()}>
          <ProductCardActions producto={producto} slug={slug} cp={t.primary} />
        </div>
        {producto?.imagenUrl && !broken ? (
          <img src={producto.imagenUrl} alt={producto.descripcion} loading="lazy" onError={() => setBroken(true)} className={`h-full w-full object-contain p-3 mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-[1.05] ${isOut ? 'opacity-50 grayscale' : ''}`} />
        ) : (
          <NoPhoto t={t} producto={producto} />
        )}
      </div>

      <div className="flex flex-1 flex-col px-2 pb-2 pt-3">
        <h3 title={producto?.descripcion} className="line-clamp-2 text-[17px] font-medium leading-[1.15]" style={{ color: t.ink, fontFamily: t.serif }}>{producto?.descripcion}</h3>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <Rating producto={producto} t={t} size={11} />
          {colors.length > 0 && <span className="flex gap-1">{colors.map((c) => <span key={c.name} title={c.name} className="h-3 w-3 rounded-full" style={{ background: c.hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.12)' }} />)}</span>}
        </div>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="whitespace-nowrap text-[15px] font-semibold" style={{ color: t.ink }}>{flMoney(pricing.precioFinal)}</span>
          {pricing.enOferta && <span className="whitespace-nowrap text-[11.5px] line-through" style={{ color: t.muted }}>{flMoney(pricing.precioRegular)}</span>}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex min-w-0 flex-1 items-center">
            {!hasVariants && !isOut ? (
              <div className="flex h-10 w-full max-w-[96px] items-center justify-between rounded-full" style={{ background: t.softer, boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                <button type="button" aria-label="Restar" onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-full w-6 items-center justify-center pl-1 text-[15px]" style={{ color: t.muted }}>−</button>
                <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setQty(d === '' ? 1 : Math.max(1, parseInt(d, 10))); }} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[12.5px] font-semibold outline-none focus:ring-0" style={{ color: t.ink }} />
                <button type="button" aria-label="Sumar" onClick={() => setQty(qty + 1)} className="flex h-full w-6 items-center justify-center pr-1 text-[15px]" style={{ color: t.muted }}>+</button>
              </div>
            ) : <span className="truncate text-[12px]" style={{ color: t.muted }}>{isOut ? 'Agotado' : 'Elige tu opción'}</span>}
          </div>
          <button type="button" disabled={isOut} onClick={add} aria-label={isOut ? 'Agotado' : hasVariants ? 'Ver opciones' : 'Agregar al carrito'} title={isOut ? 'Agotado' : hasVariants ? 'Ver opciones' : 'Agregar al carrito'} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-[filter,transform] hover:brightness-[1.06] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40" style={isOut ? { background: t.softer, color: t.muted } : goldBtn(t)}>
              <Icon icon={hasVariants ? 'solar:arrow-right-linear' : 'solar:cart-large-2-linear'} width={18} />
            </button>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────── Cart modal ──
export function PetalaCartModal({ isOpen, onClose, carrito, actualizarCantidad, onCheckout, t, tienda, diseno }: any) {
  const { slug = '' } = useParams();
  const items: any[] = carrito || [];
  const total = items.reduce((a, it) => a + Number(it.precioUnitario || 0) * Number(it.cantidad || 1), 0);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(waNumber, 'x'));
  const pedirWa = () => {
    if (!items.length) return;
    const detail = items.map((it) => `• ${Number(it.cantidad || 1)} x ${it.descripcion} - ${flMoney(Number(it.precioUnitario || 0) * Number(it.cantidad || 1))}`).join('\n');
    const url = buildStorePurchaseWhatsappUrl(waNumber, `Hola, quiero pedir estos ramos en ${storeNameOf(tienda)}:\n\n${detail}\n\nTotal estimado: ${flMoney(total)}`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  const drawerStyle: CSSProperties = { background: t.bg, fontFamily: t.font };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button type="button" aria-label="Cerrar carrito" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-stone-900/35 backdrop-blur-[2px]" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 270 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[430px] flex-col shadow-2xl" style={drawerStyle} role="dialog" aria-label="Carrito">
            <header className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: t.line }}>
              <div>
                <h2 className="text-[26px] font-medium leading-none" style={{ color: t.ink, fontFamily: t.serif }}>Tu pedido</h2>
                <p className="mt-1 text-[12.5px]" style={{ color: t.muted }}>{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
              </div>
              <button type="button" aria-label="Cerrar" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/[0.05]" style={{ color: t.ink }}><Icon icon="solar:close-circle-linear" width={22} /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {!items.length ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: t.blush, color: t.primaryInk }}><Icon icon="ph:flower-tulip-light" width={38} /></span>
                  <h3 className="mt-5 text-[24px]" style={{ color: t.ink, fontFamily: t.serif }}>Tu pedido está vacío</h3>
                  <p className="mt-1.5 max-w-[260px] text-[13px]" style={{ color: t.muted }}>Elige el ramo perfecto para ese momento especial.</p>
                  <button type="button" onClick={onClose} className={`${btnCls} mt-6 h-11 px-7`} style={goldBtn(t)}>Ver ramos</button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => {
                    const id = item.cartId || item.id;
                    const qty = Number(item.cantidad || 1);
                    const price = Number(item.precioUnitario || 0);
                    return (
                      <li key={id} className="relative grid grid-cols-[80px_1fr] gap-3 rounded-[18px] bg-white p-3" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                        <button type="button" aria-label="Quitar" onClick={() => actualizarCantidad(id, 0)} className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-500"><Icon icon="solar:trash-bin-minimalistic-linear" width={16} /></button>
                        <div className="h-24 overflow-hidden rounded-[14px]" style={{ background: t.card }}>
                          {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-1.5 mix-blend-multiply" /> : <NoPhoto t={t} producto={item} size={28} />}
                        </div>
                        <div className="flex min-w-0 flex-col pr-7">
                          <h3 className="line-clamp-2 text-[16px] font-medium leading-tight" style={{ color: t.ink, fontFamily: t.serif }}>{item.descripcion}</h3>
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <div className="flex h-9 items-center overflow-hidden rounded-full" style={{ background: t.softer, boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                              <button type="button" aria-label="Restar" onClick={() => actualizarCantidad(id, qty - 1)} className="flex w-8 items-center justify-center" style={{ color: t.muted }}>−</button>
                              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); actualizarCantidad(id, d === '' ? 1 : parseInt(d, 10)); }} onFocus={(e) => e.currentTarget.select()} className="w-8 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[13px] font-semibold outline-none focus:ring-0" style={{ color: t.ink }} />
                              <button type="button" aria-label="Sumar" onClick={() => actualizarCantidad(id, qty + 1)} className="flex w-8 items-center justify-center" style={{ color: t.muted }}>+</button>
                            </div>
                            <span className="text-[14.5px] font-semibold" style={{ color: t.ink }}>{flMoney(price * qty)}</span>
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
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[13px]" style={{ color: t.muted }}>Subtotal</span>
                  <span className="text-[22px] font-semibold" style={{ color: t.ink }}>{flMoney(total)}</span>
                </div>
                <p className="mb-3 text-[11.5px]" style={{ color: t.muted }}>Escribe tu dedicatoria y la forma de entrega al finalizar.</p>
                <FreeShippingProgress t={t} slug={slug} subtotal={total} />
                <button type="button" onClick={() => { onClose(); onCheckout(); }} className={`${btnCls} h-12 w-full`} style={goldBtn(t)}>
                  Finalizar pedido <Icon icon="solar:arrow-right-linear" width={17} />
                </button>
                {hasWa && (
                  <button type="button" onClick={pedirWa} className={`${btnCls} mt-2.5 h-11 w-full bg-white`} style={{ color: t.ink, boxShadow: `inset 0 0 0 1px ${t.line}` }}>
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
