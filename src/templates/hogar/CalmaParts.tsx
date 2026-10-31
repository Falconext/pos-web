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
import { mix, cmEase } from './motion';

/**
 * Piezas base de la plantilla Hogar (Calma): tema, header, footer, tarjeta y carrito.
 * Regla de la plantilla: nada inventado. Si un dato no existe en la tienda, la UI se oculta.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

export const cmMoney = (v: any) => `S/ ${Number(v || 0).toFixed(2)}`;
/** Precio compacto para títulos grandes: sin decimales cuando son ,00. */
export const cmPrice = (v: any) => { const n = Number(v || 0); return `S/ ${Number.isInteger(n) ? n : n.toFixed(2)}`; };
export const editable = (v: any, fallback: string) => String(v || '').trim() || fallback;
export const storeNameOf = (tienda: any, fallback = 'Calma') => tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || fallback;
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

const BASE_BG = '#F1EEE9'; // gris cálido de la referencia
/** Pasteles de los mosaicos (salvia, mantequilla, niebla, arena, rubor). Decorativos, no son color de marca. */
const TILES = ['#DFE4D6', '#EFE7C9', '#DDE3EE', '#EAE2D8', '#EDDFD6'];

// ── Design tokens (tinta + cobalto de la referencia; Bricolage Grotesque + Geist + Geist Mono) ──
export function calmaTheme(diseno: any) {
  const primary = diseno?.colorPrimario || '#1C1A17'; // tinta (botones píldora, footer, carta)
  const accent = diseno?.colorAccento || '#3D4BD9';   // cobalto (puntos del marquee, camión, enfoque)
  const rawBg = String(diseno?.colorSecundario || '').trim();
  const bgLum = luminance(rawBg);
  // "Color de fondo" global: claro → tal cual; saturado u oscuro → tinte suave sobre el gris cálido.
  const bg = !rawBg ? BASE_BG : bgLum !== null && bgLum < 0.78 ? mix(rawBg, 8, BASE_BG) : rawBg;
  const ink = '#1C1A17';
  const pl = luminance(primary);
  const al = luminance(accent);
  const display = `'Bricolage Grotesque', 'Geist', ui-sans-serif, system-ui, sans-serif`;
  return {
    primary,
    accent,
    /** Principal/acento como texto sobre fondo claro: si son muy claros, caen a tinta. */
    primaryInk: pl !== null && pl > 0.45 ? ink : primary,
    accentInk: al !== null && al > 0.5 ? ink : accent,
    bg,
    /** Superficie de las tarjetas grandes (hueso). */
    surface: '#FAF8F4',
    ink,
    muted: '#6F6A63',
    soft: mix(ink, 5, '#FAF8F4'),
    line: mix(ink, 11, '#FAF8F4'),
    blushDeep: mix(accent, 10, '#fff'),
    tiles: TILES,
    onPrimary: readableText(primary),
    onAccent: readableText(accent),
    font: `'${diseno?.tipografia || 'Geist'}', ui-sans-serif, system-ui, sans-serif`,
    display,
    /** Alias para páginas compartidas que piden "serif" de títulos. */
    serif: display,
    mono: `'Geist Mono', ui-monospace, SFMono-Regular, monospace`,
  };
}
export type Theme = ReturnType<typeof calmaTheme>;

/** Color pastel estable para una categoría (la misma categoría siempre cae en el mismo tono). */
export function tileFor(t: Theme, key: any): string {
  const s = String(key || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return t.tiles[h % t.tiles.length];
}

/** Inyecta Bricolage Grotesque + Geist + Geist Mono una sola vez. */
export function useCalmaFont() {
  useEffect(() => {
    const id = 'calma-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Geist:wght@400..600&family=Geist+Mono:wght@400..500&display=swap';
    document.head.appendChild(link);
  }, []);
}

/** Botón píldora de la referencia. */
export const btnCls = 'inline-flex items-center justify-center gap-2 rounded-full text-[13.5px] font-medium transition-[filter,transform,background-color,color] hover:brightness-110 active:scale-[0.98]';

/** Etiqueta en mayúsculas monoespaciada (los "BROWSE", "MOST LOVED" de la referencia). */
export function Eyebrow({ t, children, light = false, className = '' }: { t: Theme; children: ReactNode; light?: boolean; className?: string }) {
  return <p className={`text-[11px] uppercase tracking-[0.14em] ${className}`} style={{ fontFamily: t.mono, color: light ? mix(t.onPrimary, 60, t.primary) : t.muted }}>{children}</p>;
}

/** Estrellas reales; si aún no tiene reseñas, "Nuevo" (nunca estrellas de relleno). */
export function Stars({ producto, t, size = 12 }: { producto: any; t: Theme; size?: number }) {
  const rating = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const count = Number(producto?.ratingCount || producto?.reviewsCount || 0);
  if (!(rating > 0 && count > 0)) return <span className="text-[12px]" style={{ color: t.muted }}>Nuevo</span>;
  return (
    <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: t.muted }}>
      <Icon icon="solar:star-bold" width={size} style={{ color: t.ink }} />
      <span style={{ color: t.ink }}>{rating.toFixed(1)}</span> ({count})
    </span>
  );
}

export function Logo({ tienda, diseno, t, onClick, light = false }: { tienda: any; diseno: any; t: Theme; onClick?: () => void; light?: boolean }) {
  const name = editable(diseno?.hogarLogoText, storeNameOf(tienda));
  const content = tienda?.logo ? (
    <img src={tienda.logo} alt={name} className="h-9 w-auto max-w-[150px] object-contain" />
  ) : (
    <span className="flex min-w-0 items-center gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: light ? '#fff' : t.primary, color: light ? t.ink : t.onPrimary }}>
        <Icon icon="ph:armchair-fill" width={17} />
      </span>
      <span className="max-w-[118px] truncate text-[16px] font-semibold uppercase tracking-[-0.02em] sm:max-w-[200px] sm:text-[19px]" style={{ fontFamily: t.display, color: light ? '#fff' : t.ink }}>{name}</span>
    </span>
  );
  return onClick ? <button type="button" onClick={onClick} className="flex min-w-0 shrink items-center">{content}</button> : <div className="flex min-w-0 items-center">{content}</div>;
}

// ─────────────────────────────────────────────────────────── Beneficios ──
export type Service = { icon: string; label: string; sub: string; value?: string; unit?: string };

/** Beneficios derivados de la configuración real de la tienda (nada de promesas inventadas). */
export function buildServices(tienda: any, hasWhatsapp = false): Service[] {
  const s: Service[] = [];
  const envio = Number(tienda?.costoEnvioFijo || 0);
  if (tienda?.aceptaEnvio !== false) s.push({ icon: 'solar:delivery-linear', label: 'Envío a domicilio', sub: envio > 0 ? `Tarifa fija de ${cmMoney(envio)} a tu puerta.` : 'El costo se calcula al finalizar tu compra.', ...(envio > 0 ? { value: cmPrice(envio), unit: 'envío' } : {}) });
  if (tienda?.aceptaRecojo) {
    const min = Number(tienda?.tiempoPreparacionMin || 0);
    s.push({ icon: 'solar:shop-2-linear', label: 'Recojo en tienda', sub: min > 0 ? 'Te avisamos cuando tu pedido esté listo.' : 'Sin costo de envío.', ...(min > 0 ? { value: String(min), unit: 'min' } : {}) });
  }
  s.push({ icon: 'solar:shield-check-linear', label: 'Compra segura', sub: 'Revisas y confirmas tu pedido antes de pagar.' });
  if (hasWhatsapp) s.push({ icon: 'solar:chat-round-like-linear', label: 'Te asesoramos', sub: 'Escríbenos por WhatsApp antes de elegir.' });
  s.push({ icon: 'solar:map-arrow-square-linear', label: 'Seguimiento', sub: 'Un código para seguir tu pedido en todo momento.' });
  return s;
}

// ─────────────────────────────────────────────────────────────── Header ──
/** Barra flotante en píldora. Estado propio (búsqueda, menú móvil) aislado aquí. */
export function CalmaHeader({ tienda, slug, diseno, categories, t, cartCount, favCount, onOpenCart, onOpenFav, navigate, active }: any) {
  const [menu, setMenu] = useState<null | 'search' | 'mobile'>(null);
  const [q, setQ] = useState('');
  const cats: string[] = (categories || []).slice(0, 4);
  const go = (to: string) => { setMenu(null); navigate(to); };
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!panelRef.current?.contains(e.target as Node)) setMenu(null); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  const navBtn = (label: string, key: string, to: string) => (
    <button key={key} type="button" onClick={() => go(to)} className="rounded-full px-3.5 py-2 text-[13.5px] transition-colors hover:bg-black/[0.04]" style={active === key ? { background: mix(t.ink, 7, t.surface), color: t.ink } : { color: mix(t.ink, 78, t.surface) }}>
      {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-5">
      <div ref={panelRef} className="mx-auto max-w-[1400px]">
        <div className="flex h-[60px] items-center justify-between gap-3 rounded-full border pl-4 pr-2 shadow-[0_10px_30px_-22px_rgba(28,26,23,0.45)] backdrop-blur-md" style={{ background: mix(t.surface, 92, 'transparent'), borderColor: t.line }}>
          <Logo tienda={tienda} diseno={diseno} t={t} onClick={() => go(`/tienda/${slug}`)} />

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Principal">
            {navBtn(editable(diseno?.hogarNavShop, 'Ver todo'), 'catalog', `/tienda/${slug}/catalogo`)}
            {cats.map((c) => navBtn(c, `cat-${c}`, `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`))}
            {navBtn(editable(diseno?.hogarNavContact, 'Contacto'), 'contact', `/tienda/${slug}/contacto`)}
          </nav>

          <div className="flex shrink-0 items-center gap-0.5">
            <IconBtn t={t} label="Buscar" icon="solar:magnifer-linear" onClick={() => setMenu(menu === 'search' ? null : 'search')} />
            <IconBtn t={t} label="Favoritos" icon="solar:heart-linear" onClick={onOpenFav} badge={favCount} />
            <button type="button" onClick={onOpenCart} aria-label="Carrito" className="ml-1 flex h-11 items-center gap-2 rounded-full pl-3.5 pr-1.5 text-[13px] font-medium transition-[filter] hover:brightness-110" style={{ background: t.primary, color: t.onPrimary }}>
              <Icon icon="solar:bag-4-linear" width={17} />
              <span className="hidden sm:inline">{editable(diseno?.hogarNavCart, 'Bolsa')}</span>
              <span className="flex h-7 min-w-[28px] items-center justify-center rounded-full px-1.5 text-[11.5px] font-semibold" style={{ background: t.onPrimary, color: t.primary }}>{cartCount}</span>
            </button>
            <span className="lg:hidden"><IconBtn t={t} label="Menú" icon={menu === 'mobile' ? 'solar:close-circle-linear' : 'solar:hamburger-menu-linear'} onClick={() => setMenu(menu === 'mobile' ? null : 'mobile')} /></span>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {menu === 'search' && (
            <motion.form key="search" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: cmEase }} onSubmit={(e) => { e.preventDefault(); go(`/tienda/${slug}/catalogo${q.trim() ? `?search=${encodeURIComponent(q.trim())}` : ''}`); }} className="mt-2 flex h-14 items-center gap-3 rounded-full border pl-5 pr-2 shadow-[0_18px_40px_-26px_rgba(28,26,23,0.45)]" style={{ background: t.surface, borderColor: t.line }} role="search">
              <Icon icon="solar:magnifer-linear" width={18} style={{ color: t.muted }} />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={editable(diseno?.hogarSearchPlaceholder, 'Busca roble, lino, lámpara…')} aria-label="Buscar productos" className="min-w-0 flex-1 appearance-none border-0 bg-transparent bg-none p-0 text-[14.5px] outline-none placeholder:text-stone-400 focus:ring-0" style={{ color: t.ink }} />
              <button type="submit" className={`${btnCls} h-10 px-5`} style={{ background: t.primary, color: t.onPrimary }}>Buscar</button>
            </motion.form>
          )}
          {menu === 'mobile' && (
            <motion.nav key="mobile" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: cmEase }} className="mt-2 rounded-[28px] border p-2 shadow-[0_18px_40px_-26px_rgba(28,26,23,0.45)] lg:hidden" style={{ background: t.surface, borderColor: t.line }} aria-label="Menú móvil">
              {[
                { label: editable(diseno?.hogarNavHome, 'Inicio'), to: `/tienda/${slug}` },
                { label: editable(diseno?.hogarNavShop, 'Ver todo'), to: `/tienda/${slug}/catalogo` },
                ...(categories || []).slice(0, 8).map((c: string) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })),
                { label: editable(diseno?.hogarNavContact, 'Contacto'), to: `/tienda/${slug}/contacto` },
              ].map((it, i) => (
                <button key={`${it.label}-${i}`} type="button" onClick={() => go(it.to)} className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-[15px] hover:bg-black/[0.03]" style={{ color: t.ink }}>
                  {it.label}<Icon icon="solar:arrow-right-up-linear" width={16} style={{ color: t.muted }} />
                </button>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

function IconBtn({ t, label, icon, onClick, badge = 0 }: { t: Theme; label: string; icon: string; onClick: () => void; badge?: number }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/[0.05] sm:h-11 sm:w-11" style={{ color: t.ink }}>
      <Icon icon={icon} width={21} />
      {badge > 0 && <span className="absolute right-1 top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[10px] font-semibold" style={{ background: t.accent, color: t.onAccent }}>{badge}</span>}
    </button>
  );
}

// ───────────────────────────────────────────────────── Medios de pago ──
/** Medios de pago REALES de la tienda (/payment-config). Carga aislada; si no hay datos, no se muestra nada. */
function PaymentBadges({ slug, fg, line }: { slug: string; fg: string; line: string }) {
  const [cfg, setCfg] = useState<any>(null);
  useEffect(() => {
    if (!slug || slug === 'preview') return;
    let alive = true;
    axios.get(`${BASE_URL}/public/store/${slug}/payment-config`).then((r) => { if (alive) setCfg(r.data?.data || r.data); }).catch(() => {});
    return () => { alive = false; };
  }, [slug]);
  if (!cfg) return null;
  const items: string[] = [];
  if (cfg.aceptaTarjeta || cfg.aceptaNiubiz) items.push('Tarjeta');
  if (cfg.aceptaMercadoPago) items.push('Mercado Pago');
  if (cfg.yapeQrUrl || cfg.yapeQR || cfg.yapeNumero) items.push('Yape');
  if (cfg.plinQrUrl || cfg.plinQR || cfg.plinNumero) items.push('Plin');
  if (Array.isArray(cfg.cuentasBancarias) && cfg.cuentasBancarias.length) items.push('Transferencia');
  if (cfg.aceptaEfectivo) items.push('Efectivo');
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((it) => <span key={it} className="rounded-full border px-3 py-1 text-[11.5px]" style={{ borderColor: line, color: fg }}>{it}</span>)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── Footer ──
/** Footer oscuro con el nombre de la tienda a todo el ancho (como el logotipo gigante de la referencia). */
export function CalmaFooter({ tienda, slug, diseno, t, categories, navigate }: any) {
  const storeName = storeNameOf(tienda);
  const wordmark = editable(diseno?.hogarFooterWordmark, editable(diseno?.hogarLogoText, storeName)).toUpperCase();
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const waUrl = buildStorePurchaseWhatsappUrl(waNumber, 'Hola, tengo una consulta.');
  const address = [tienda?.direccion, tienda?.distrito].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  const horario = String(tienda?.horarioAtencion || '').trim();
  const socials = [
    tienda?.instagramUrl ? { label: 'Instagram', url: tienda.instagramUrl } : null,
    tienda?.facebookUrl ? { label: 'Facebook', url: tienda.facebookUrl } : null,
    tienda?.tiktokUrl ? { label: 'TikTok', url: tienda.tiktokUrl } : null,
    waUrl ? { label: 'WhatsApp', url: waUrl } : null,
  ].filter(Boolean) as { label: string; url: string }[];
  const cats: string[] = (categories || []).slice(0, 5);
  const tagline = optional(diseno?.hogarFooterTagline, 'Objetos serenos, hechos para vivirse.');
  const intro = String(diseno?.hogarFooterText || tienda?.descripcionTienda || '').trim();
  const cols: { title: string; items: { label: string; to?: string; href?: string }[] }[] = [
    { title: 'Tienda', items: [{ label: 'Ver todo', to: `/tienda/${slug}/catalogo` }, ...cats.map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` }))] },
    { title: 'Ayuda', items: [
      { label: 'Contacto', to: `/tienda/${slug}/contacto` },
      { label: 'Preguntas frecuentes', to: `/tienda/${slug}/contacto#faq` },
      { label: 'Seguimiento de pedido', to: `/tienda/${slug}/seguimiento` },
    ] },
    ...(socials.length ? [{ title: 'Síguenos', items: socials.map((s) => ({ label: s.label, href: s.url })) }] : []),
  ];
  // Nombres cortos se reparten letra por letra como en la referencia; los largos van juntos.
  const spaced = wordmark.replace(/\s/g, '').length <= 7;
  // Textos secundarios derivados del contraste real del color principal (sirve con principal oscuro o claro).
  const sub = mix(t.onPrimary, 62, t.primary);
  const faint = mix(t.onPrimary, 48, t.primary);
  const rule = mix(t.onPrimary, 16, t.primary);

  return (
    <footer className="px-3 pb-3 pt-10 sm:px-5">
      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-[32px] px-6 pt-10 sm:px-10" style={{ background: t.primary, color: t.onPrimary }}>
        <div className="grid gap-10 md:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div>
            {tagline && <p className="max-w-xs text-[24px] font-semibold leading-[1.15] tracking-[-0.02em]" style={{ fontFamily: t.display }}>{tagline}</p>}
            {intro && <p className="mt-4 max-w-sm whitespace-pre-line text-[13px] leading-relaxed" style={{ color: sub }}>{intro}</p>}
            {(address || horario) && (
              <ul className="mt-5 space-y-1.5 text-[12.5px]" style={{ color: sub }}>
                {address && <li className="flex gap-2"><Icon icon="solar:map-point-linear" width={15} className="mt-0.5 shrink-0" />{address}</li>}
                {horario && <li className="flex gap-2"><Icon icon="solar:clock-circle-linear" width={15} className="mt-0.5 shrink-0" />{horario}</li>}
              </ul>
            )}
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <p className="text-[11px] uppercase tracking-[0.14em]" style={{ fontFamily: t.mono, color: faint }}>{col.title}</p>
              <ul className="mt-4 space-y-2.5 text-[14px]">
                {col.items.map((it) => (
                  <li key={it.label}>
                    {it.href
                      ? <a href={it.href} target="_blank" rel="noopener noreferrer" className="opacity-90 transition-opacity hover:opacity-100 hover:underline hover:underline-offset-4">{it.label}</a>
                      : <button type="button" onClick={() => navigate(it.to)} className="text-left opacity-90 transition-opacity hover:opacity-100 hover:underline hover:underline-offset-4">{it.label}</button>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Wordmark text={wordmark} font={t.display} spaced={spaced} />

        <div className="flex flex-col gap-3 border-t py-5 text-[12px] sm:flex-row sm:items-center sm:justify-between" style={{ color: sub, borderColor: rule }}>
          <p>© {new Date().getFullYear()} {storeName}</p>
          <EnlaceLibroReclamaciones slug={slug} diseno={diseno} />
          <PaymentBadges slug={slug} fg={sub} line={rule} />
        </div>
      </div>
    </footer>
  );
}

/**
 * Nombre a todo el ancho. Mide el texto ya pintado (getBBox) y ajusta el viewBox del SVG para que
 * calce exacto con cualquier largo de nombre. Escribe el atributo por ref: no provoca re-renders.
 */
function Wordmark({ text, font, spaced }: { text: string; font: string; spaced: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  useEffect(() => {
    const fit = () => {
      const box = textRef.current?.getBBox();
      if (box && box.width > 0) svgRef.current?.setAttribute('viewBox', `${box.x} ${box.y + box.height * 0.12} ${box.width} ${box.height * 0.8}`);
    };
    fit();
    // La fuente de títulos llega después del primer pintado: volver a medir cuando cargue.
    document.fonts?.ready.then(fit).catch(() => {});
  }, [text, font]);
  return (
    <svg ref={svgRef} viewBox="0 0 1000 200" className="mt-12 block w-full" aria-hidden>
      <text ref={textRef} x="0" y="160" fill="currentColor" fontSize={200} fontWeight={650} letterSpacing={spaced ? 60 : -6} style={{ fontFamily: font }}>{text}</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────── Product card ──
/**
 * Tarjeta de la referencia: foto sobre pastel, datos debajo. Al pasar el mouse (o siempre en táctil)
 * aparece la barra de compra con cantidad editable. Estado de cantidad aislado aquí.
 */
export function CalmaProductCard({ producto, slug, t, onOpen, onAdd, tone }: { producto: any; slug: string; t: Theme; onOpen: () => void; onAdd: (qty: number) => void; tone?: string }) {
  const pricing = getProductPricing(producto);
  const stock = Number(producto?.stock ?? 1);
  const isOut = sinStock(stock);
  const hasVariants = Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const colors = getFashionColors(producto).slice(0, 4);
  const [qty, setQty] = useState(1);
  const category = nameOf(producto?.categoria);
  const bg = tone || tileFor(t, category || producto?.descripcion);
  const badge = isOut ? 'Agotado'
    : pricing.enOferta ? `-${pricing.porcentajeDescuento}%`
    : producto?.destacado ? 'Destacado'
    : !hasVariants && pocasUnidades(stock) ? 'Pocas unidades'
    : '';

  return (
    <article className="group flex h-full cursor-pointer flex-col" onClick={onOpen}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] sm:rounded-[28px]" style={{ background: bg }}>
        {badge && <span className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium backdrop-blur" style={{ color: isOut ? t.muted : t.ink }}>{badge}</span>}
        <div className="absolute right-3 top-3 z-10 [&_button:nth-child(n+2)]:opacity-0 [&_button]:transition-opacity group-hover:[&_button:nth-child(n+2)]:opacity-100 [@media(hover:none)]:[&_button:nth-child(n+2)]:opacity-100" onClick={(e) => e.stopPropagation()}>
          <ProductCardActions producto={producto} slug={slug} cp={t.primary} />
        </div>
        {producto?.imagenUrl ? (
          <img src={producto.imagenUrl} alt={producto.descripcion} loading="lazy" className={`absolute inset-0 h-full w-full object-contain p-[12%] mix-blend-multiply transition-transform duration-700 group-hover:scale-[1.05] ${isOut ? 'opacity-50 grayscale' : ''}`} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"><Icon icon="ph:armchair-light" width={72} style={{ color: mix(t.ink, 25, bg) }} /></div>
        )}
        <span aria-hidden className="pointer-events-none absolute bottom-[9%] left-1/2 h-4 w-[52%] -translate-x-1/2 rounded-[50%] bg-black/10 blur-md" />

        <div className="absolute inset-x-3 bottom-3 z-10 flex gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 [@media(hover:none)]:opacity-100" onClick={(e) => e.stopPropagation()}>
          {!hasVariants && !isOut && (
            <div className="flex h-10 w-[84px] shrink-0 items-center justify-between rounded-full bg-white/95 px-1 backdrop-blur">
              <button type="button" aria-label="Restar" onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-8 w-7 items-center justify-center text-[15px]" style={{ color: t.muted }}>−</button>
              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setQty(d === '' ? 1 : Math.max(1, parseInt(d, 10))); }} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[13px] font-medium outline-none focus:ring-0" style={{ color: t.ink }} />
              <button type="button" aria-label="Sumar" onClick={() => setQty(qty + 1)} className="flex h-8 w-7 items-center justify-center text-[15px]" style={{ color: t.muted }}>+</button>
            </div>
          )}
          <button
            type="button"
            disabled={isOut}
            onClick={() => { if (isOut) return; if (hasVariants) onOpen(); else onAdd(Math.max(1, qty)); }}
            className="flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition-[filter] hover:brightness-110 disabled:cursor-not-allowed"
            style={isOut ? { background: 'rgba(255,255,255,.85)', color: t.muted } : { background: t.primary, color: t.onPrimary }}
          >
            {!isOut && <Icon icon={hasVariants ? 'solar:palette-round-linear' : 'solar:bag-4-linear'} width={15} className="shrink-0" />}
            <span className="truncate">{isOut ? 'Agotado' : hasVariants ? 'Ver opciones' : 'Agregar'}</span>
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-1 items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          {category && <p className="truncate text-[12px]" style={{ color: t.muted }}>{category}</p>}
          <h3 title={producto?.descripcion} className="line-clamp-2 text-[15px] leading-snug" style={{ color: t.ink }}>{producto?.descripcion}</h3>
          <div className="mt-1 flex items-center gap-2">
            <Stars producto={producto} t={t} />
            {colors.length > 0 && <span className="flex -space-x-1">{colors.map((c) => <span key={c.name} title={c.name} className="h-3 w-3 rounded-full ring-2" style={{ background: c.hex, ['--tw-ring-color' as any]: t.bg }} />)}</span>}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[17px] font-semibold tracking-[-0.01em]" style={{ color: t.ink, fontFamily: t.display }}>{cmPrice(pricing.precioFinal)}</p>
          {pricing.enOferta && <p className="text-[12px] line-through" style={{ color: t.muted }}>{cmPrice(pricing.precioRegular)}</p>}
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────── Cart modal ──
export function CalmaCartModal({ isOpen, onClose, carrito, actualizarCantidad, onCheckout, t, tienda, diseno }: any) {
  const items: any[] = carrito || [];
  const total = items.reduce((a, it) => a + Number(it.precioUnitario || 0) * Number(it.cantidad || 1), 0);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(waNumber, 'x'));
  const pedirWa = () => {
    if (!items.length) return;
    const detail = items.map((it) => `• ${Number(it.cantidad || 1)} x ${it.descripcion} - ${cmMoney(Number(it.precioUnitario || 0) * Number(it.cantidad || 1))}`).join('\n');
    const url = buildStorePurchaseWhatsappUrl(waNumber, `Hola, quiero pedir estos productos en ${storeNameOf(tienda)}:\n\n${detail}\n\nTotal estimado: ${cmMoney(total)}`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  const drawerStyle: CSSProperties = { background: t.bg, fontFamily: t.font };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button type="button" aria-label="Cerrar carrito" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-stone-900/30 backdrop-blur-[2px]" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 260 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col p-3 sm:p-4" style={drawerStyle} role="dialog" aria-label="Carrito">
            <div className="flex h-full flex-col overflow-hidden rounded-[28px]" style={{ background: t.surface }}>
              <header className="flex items-center justify-between px-6 py-5">
                <div>
                  <h2 className="text-[26px] font-semibold leading-none tracking-[-0.03em]" style={{ color: t.ink, fontFamily: t.display }}>Tu bolsa</h2>
                  <p className="mt-1.5 text-[11px] uppercase tracking-[0.14em]" style={{ color: t.muted, fontFamily: t.mono }}>{items.length} {items.length === 1 ? 'pieza' : 'piezas'}</p>
                </div>
                <button type="button" aria-label="Cerrar" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/[0.05]" style={{ color: t.ink }}><Icon icon="solar:close-circle-linear" width={22} /></button>
              </header>
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                {!items.length ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <span className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: t.tiles[0], color: t.ink }}><Icon icon="solar:bag-4-linear" width={34} /></span>
                    <h3 className="mt-5 text-[22px] font-semibold tracking-[-0.02em]" style={{ color: t.ink, fontFamily: t.display }}>Tu bolsa está vacía</h3>
                    <p className="mt-1.5 max-w-[260px] text-[13px]" style={{ color: t.muted }}>Encuentra piezas que hagan tu casa más tuya.</p>
                    <button type="button" onClick={onClose} className={`${btnCls} mt-6 h-11 px-6`} style={{ background: t.primary, color: t.onPrimary }}>Seguir mirando</button>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {items.map((item) => {
                      const id = item.cartId || item.id;
                      const qty = Number(item.cantidad || 1);
                      const price = Number(item.precioUnitario || 0);
                      return (
                        <li key={id} className="relative grid grid-cols-[80px_1fr] gap-3 rounded-[20px] p-2.5" style={{ background: t.bg }}>
                          <button type="button" aria-label="Quitar" onClick={() => actualizarCantidad(id, 0)} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-white hover:text-rose-500"><Icon icon="solar:trash-bin-minimalistic-linear" width={16} /></button>
                          <div className="flex h-[80px] items-center justify-center overflow-hidden rounded-[14px]" style={{ background: tileFor(t, nameOf(item.categoria) || item.descripcion) }}>
                            {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-2 mix-blend-multiply" /> : <Icon icon="ph:armchair-light" width={28} style={{ color: t.muted }} />}
                          </div>
                          <div className="min-w-0 pr-7">
                            <h3 className="line-clamp-2 text-[13.5px] leading-snug" style={{ color: t.ink }}>{item.descripcion}</h3>
                            <div className="mt-2.5 flex items-center justify-between">
                              <div className="flex h-9 items-center overflow-hidden rounded-full bg-white">
                                <button type="button" aria-label="Restar" onClick={() => actualizarCantidad(id, qty - 1)} className="flex w-8 items-center justify-center text-base" style={{ color: t.muted }}>−</button>
                                <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); actualizarCantidad(id, d === '' ? 1 : parseInt(d, 10)); }} onFocus={(e) => e.currentTarget.select()} className="w-9 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[13px] font-medium outline-none focus:ring-0" style={{ color: t.ink }} />
                                <button type="button" aria-label="Sumar" onClick={() => actualizarCantidad(id, qty + 1)} className="flex w-8 items-center justify-center text-base" style={{ color: t.muted }}>+</button>
                              </div>
                              <span className="text-[15px] font-semibold" style={{ color: t.ink, fontFamily: t.display }}>{cmMoney(price * qty)}</span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              {items.length > 0 && (
                <footer className="border-t px-6 py-5" style={{ borderColor: t.line }}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[13px]" style={{ color: t.muted }}>Subtotal</span>
                    <span className="text-[24px] font-semibold tracking-[-0.02em]" style={{ color: t.ink, fontFamily: t.display }}>{cmMoney(total)}</span>
                  </div>
                  <p className="mb-4 text-[11.5px]" style={{ color: t.muted }}>El envío se calcula en el checkout según tu forma de entrega.</p>
                  <button type="button" onClick={() => { onClose(); onCheckout(); }} className={`${btnCls} h-12 w-full`} style={{ background: t.primary, color: t.onPrimary }}>
                    Ir a pagar · {cmMoney(total)}
                  </button>
                  {hasWa && (
                    <button type="button" onClick={pedirWa} className={`${btnCls} mt-2 h-11 w-full border bg-white`} style={{ borderColor: t.line, color: t.ink }}>
                      <Icon icon="ic:baseline-whatsapp" width={18} className="text-[#25D366]" /> Pedir por WhatsApp
                    </button>
                  )}
                </footer>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
