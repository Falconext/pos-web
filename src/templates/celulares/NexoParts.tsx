import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { getProductPricing } from '@/templates/shared/pricing';
import { readableText } from '@/templates/shared/color';
import { sinStock } from '@/templates/shared/ventaSinStock';
import ProductCardActions from '@/components/tienda/ProductCardActions';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { mix, nxEase } from './motion';

/**
 * Piezas base de la plantilla Celulares (Nexo): tema, header, footer, tarjetas y carrito.
 * Regla de la plantilla: nada inventado. Si un dato no existe en la tienda, la UI se oculta.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

export const nxMoney = (v: any) => `S/ ${Number(v || 0).toFixed(2)}`;
/** Precio compacto: sin decimales cuando son ,00. */
export const nxPrice = (v: any) => { const n = Number(v || 0); return `S/ ${Number.isInteger(n) ? n : n.toFixed(2)}`; };
export const editable = (v: any, fallback: string) => String(v || '').trim() || fallback;
export const storeNameOf = (tienda: any, fallback = 'Nexo') => tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || fallback;
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

const BASE_BG = '#F6F8FB'; // gris azulado muy claro de la referencia

// ── Design tokens (azul eléctrico + rojo de ofertas; navy derivado del principal; Manrope + DM Sans) ──
export function nexoTheme(diseno: any) {
  const primary = diseno?.colorPrimario || '#1F6BF0'; // azul (botones, enlaces, precios)
  const accent = diseno?.colorAccento || '#EF4452';   // rojo (ofertas, badges de descuento)
  const rawBg = String(diseno?.colorSecundario || '').trim();
  const bgLum = luminance(rawBg);
  const bg = !rawBg ? BASE_BG : bgLum !== null && bgLum < 0.78 ? mix(rawBg, 6, BASE_BG) : rawBg;
  const ink = '#0E1A33';
  const pl = luminance(primary);
  const al = luminance(accent);
  const display = `'Manrope', 'DM Sans', ui-sans-serif, system-ui, sans-serif`;
  return {
    primary,
    accent,
    primaryInk: pl !== null && pl > 0.45 ? ink : primary,
    accentInk: al !== null && al > 0.5 ? ink : accent,
    /** Navy de la barra superior, hero y footer: tinta con un toque del principal. */
    navy: mix(primary, 16, '#08122B'),
    bg,
    surface: '#FFFFFF',
    ink,
    muted: '#64708A',
    soft: mix(primary, 5, '#F3F5F9'),
    line: mix(ink, 9, '#FFFFFF'),
    blushDeep: mix(primary, 10, '#fff'),
    /** Fondos suaves de tarjetas promocionales (azul, verde menta, lila). */
    tiles: [mix(primary, 9, '#F2F6FD'), mix('#22C55E', 10, '#F2FBF6'), mix('#A855F7', 12, '#FAF5FF'), mix(primary, 14, '#EEF3FD'), mix(accent, 8, '#FFF6F7')],
    onPrimary: readableText(primary),
    onAccent: readableText(accent),
    font: `'${diseno?.tipografia || 'DM Sans'}', ui-sans-serif, system-ui, sans-serif`,
    display,
    serif: display,
    mono: `'DM Sans', ui-sans-serif, system-ui, sans-serif`,
    script: `'Allura', cursive`,
  };
}
export type Theme = ReturnType<typeof nexoTheme>;

/** Tono suave estable por clave (alias para páginas compartidas). */
export function tileFor(t: Theme, key: any): string {
  const s = String(key || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return [t.soft, mix(t.primary, 7, '#F5F8FE'), '#F3F4F6'][h % 3];
}

/** Inyecta Manrope + DM Sans + Allura una sola vez. */
export function useNexoFont() {
  useEffect(() => {
    const id = 'nexo-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=Allura&display=swap';
    document.head.appendChild(link);
  }, []);
}

/** Botón píldora de la referencia. */
export const btnCls = 'inline-flex items-center justify-center gap-2 rounded-full text-[13.5px] font-semibold transition-[filter,transform,background-color,color] hover:brightness-110 active:scale-[0.98]';

/** Etiqueta pequeña (para páginas compartidas). */
export function Eyebrow({ t, children, light = false, className = '' }: { t: Theme; children: ReactNode; light?: boolean; className?: string }) {
  return <p className={`text-[11.5px] font-semibold uppercase tracking-[0.18em] ${className}`} style={{ color: light ? mix(t.onPrimary, 70, t.navy) : t.primaryInk }}>{children}</p>;
}

/** Estrellas reales; si aún no tiene reseñas, "Nuevo" (nunca estrellas de relleno). */
export function Stars({ producto, t, size = 12 }: { producto: any; t: Theme; size?: number }) {
  const rating = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const count = Number(producto?.ratingCount || producto?.reviewsCount || 0);
  if (!(rating > 0 && count > 0)) return <span className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold" style={{ background: t.blushDeep, color: t.primaryInk }}>Nuevo</span>;
  return (
    <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: t.muted }}>
      <Icon icon="solar:star-bold" width={size} className="text-amber-400" />
      <span className="font-semibold" style={{ color: t.ink }}>{rating.toFixed(1)}</span> ({count})
    </span>
  );
}

/** Logotipo: logo subido o nombre en dos tonos (segunda palabra en el color principal) + frase. */
export function Logo({ tienda, diseno, t, onClick, light = false }: { tienda: any; diseno: any; t: Theme; onClick?: () => void; light?: boolean }) {
  const name = editable(diseno?.celularesLogoText, storeNameOf(tienda));
  const tagline = optional(diseno?.celularesLogoTagline, '');
  const words = name.split(' ');
  const first = words.length > 1 ? words.slice(0, -1).join(' ') : name;
  const last = words.length > 1 ? ` ${words[words.length - 1]}` : '';
  const content = tienda?.logo ? (
    <img src={tienda.logo} alt={name} className="h-10 w-auto max-w-[150px] object-contain" />
  ) : (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]" style={{ background: t.primary, color: t.onPrimary }}><Icon icon="solar:smartphone-2-bold" width={20} /></span>
      <span className="flex min-w-0 flex-col leading-none">
        <span className="max-w-[150px] truncate text-[20px] font-extrabold tracking-[-0.03em] sm:max-w-[230px] sm:text-[23px]" style={{ fontFamily: t.display, color: light ? '#fff' : t.ink }}>
          {first}{last && <span style={{ color: light ? mix(t.primary, 55, '#fff') : t.primaryInk }}>{last}</span>}
        </span>
        {tagline && <span className="mt-1 hidden max-w-[230px] truncate text-[10.5px] sm:block" style={{ color: light ? 'rgba(255,255,255,.65)' : t.muted }}>{tagline}</span>}
      </span>
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
  if (tienda?.aceptaEnvio !== false) s.push({ icon: 'solar:delivery-linear', label: 'Envío a domicilio', sub: envio > 0 ? `Tarifa fija de ${nxMoney(envio)}` : 'Costo al finalizar tu compra' });
  if (tienda?.aceptaRecojo) {
    const min = Number(tienda?.tiempoPreparacionMin || 0);
    s.push({ icon: 'solar:shop-2-linear', label: 'Recojo en tienda', sub: min > 0 ? `Listo en ~${min} min` : 'Sin costo de envío' });
  }
  s.push({ icon: 'solar:shield-check-linear', label: 'Compra segura', sub: 'Confirmas antes de pagar' });
  if (hasWhatsapp) s.push({ icon: 'solar:headphones-round-sound-linear', label: 'Te asesoramos', sub: 'Por WhatsApp' });
  s.push({ icon: 'solar:map-arrow-square-linear', label: 'Seguimiento', sub: 'Código para tu pedido' });
  return s;
}

// ─────────────────────────────────────────────────────────────── Header ──
/** Barra superior navy + header con buscador grande + fila de navegación. Estado propio aislado aquí. */
export function NexoHeader({ tienda, slug, diseno, categories, t, cartCount, favCount, onOpenCart, onOpenFav, navigate, active, onDeals }: any) {
  const [menu, setMenu] = useState<null | 'search' | 'mobile'>(null);
  const [q, setQ] = useState('');
  const cats: string[] = (categories || []).slice(0, 5);
  const go = (to: string) => { setMenu(null); navigate(to); };
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(tienda?.whatsappTienda ?? diseno?.whatsappTienda, 'x'));
  const services = buildServices(tienda, hasWa);
  const leftText = optional(diseno?.celularesTopText, services[0] ? `${services[0].label}: ${services[0].sub.toLowerCase()}` : '');
  const rightText = optional(diseno?.celularesTopRight, services.find((s) => s.label === 'Compra segura') ? 'Compra segura: confirmas antes de pagar' : '');
  const search = (e: React.FormEvent) => { e.preventDefault(); go(`/tienda/${slug}/catalogo${q.trim() ? `?search=${encodeURIComponent(q.trim())}` : ''}`); };
  const placeholder = editable(diseno?.celularesSearchPlaceholder, 'Busca celulares, accesorios, marcas…');
  const searchBox = (cls: string, autoFocus = false) => (
    <form onSubmit={search} role="search" className={`flex h-11 items-center rounded-full pl-5 pr-1.5 ${cls}`} style={{ background: t.surface, boxShadow: `inset 0 0 0 1px ${t.line}` }}>
      <input autoFocus={autoFocus} value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label="Buscar productos" className="min-w-0 flex-1 appearance-none border-0 bg-transparent bg-none p-0 text-[13.5px] outline-none placeholder:text-slate-400 focus:ring-0" style={{ color: t.ink }} />
      <button type="submit" aria-label="Buscar" className="flex h-8 w-8 items-center justify-center rounded-full" style={{ color: t.ink }}><Icon icon="solar:magnifer-linear" width={19} /></button>
    </form>
  );
  const navBtn = (label: string, key: string, to: string) => (
    <button key={key} type="button" onClick={() => go(to)} className="relative py-3.5 text-[14px] font-medium transition-colors" style={{ color: active === key ? t.ink : mix(t.ink, 72, '#fff') }}>
      {label}
      {active === key && <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full" style={{ background: t.primary }} />}
    </button>
  );

  return (
    <header className="sticky top-0 z-30">
      {!isOn(diseno?.celularesTopHidden) && (leftText || rightText) && (
        <div className="hidden text-[12.5px] sm:block" style={{ background: t.navy, color: '#fff' }}>
          <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-2 lg:px-8">
            <span className="flex items-center gap-2"><Icon icon="solar:gift-linear" width={16} style={{ color: mix(t.primary, 55, '#fff') }} />{leftText}</span>
            {rightText && <span className="hidden items-center gap-2 md:flex"><Icon icon="solar:shield-check-linear" width={16} style={{ color: mix(t.primary, 55, '#fff') }} />{rightText}</span>}
          </div>
        </div>
      )}
      <div className="border-b bg-white/95 backdrop-blur-md" style={{ borderColor: t.line }}>
        <div className="mx-auto flex h-[70px] max-w-[1320px] items-center gap-4 px-4 lg:h-[76px] lg:px-8">
          <Logo tienda={tienda} diseno={diseno} t={t} onClick={() => go(`/tienda/${slug}`)} />
          <div className="mx-auto hidden w-full max-w-[460px] md:block">{searchBox('w-full')}</div>
          <div className="ml-auto flex items-center gap-0.5 md:ml-0">
            <span className="md:hidden"><IconBtn t={t} label="Buscar" icon="solar:magnifer-linear" onClick={() => setMenu(menu === 'search' ? null : 'search')} /></span>
            <IconBtn t={t} label="Favoritos" icon="solar:heart-linear" onClick={onOpenFav} badge={favCount} />
            <IconBtn t={t} label="Carrito" icon="solar:cart-large-2-linear" onClick={onOpenCart} badge={cartCount} strong />
            <span className="lg:hidden"><IconBtn t={t} label="Menú" icon={menu === 'mobile' ? 'solar:close-circle-linear' : 'solar:hamburger-menu-linear'} onClick={() => setMenu(menu === 'mobile' ? null : 'mobile')} /></span>
          </div>
        </div>
        <div className="mx-auto hidden max-w-[1320px] items-center justify-between px-4 lg:flex lg:px-8">
          <nav className="flex items-center gap-8" aria-label="Principal">
            {navBtn(editable(diseno?.celularesNavHome, 'Inicio'), 'home', `/tienda/${slug}`)}
            {navBtn(editable(diseno?.celularesNavShop, 'Todo'), 'catalog', `/tienda/${slug}/catalogo`)}
            {cats.map((c) => navBtn(c, `cat-${c}`, `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`))}
            {navBtn(editable(diseno?.celularesNavContact, 'Soporte'), 'contact', `/tienda/${slug}/contacto`)}
          </nav>
          {onDeals && (
            <button type="button" onClick={onDeals} className={`${btnCls} h-9 px-5`} style={{ background: t.accent, color: t.onAccent }}>
              <Icon icon="solar:fire-bold" width={16} /> {editable(diseno?.celularesNavDeals, 'Ofertas')}
            </button>
          )}
        </div>
        <AnimatePresence initial={false}>
          {menu === 'search' && (
            <motion.div key="search" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease: nxEase }} className="border-t px-4 py-3 md:hidden" style={{ borderColor: t.line }}>
              {searchBox('w-full', true)}
            </motion.div>
          )}
          {menu === 'mobile' && (
            <motion.nav key="mobile" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease: nxEase }} className="border-t px-4 pb-4 pt-2 lg:hidden" style={{ borderColor: t.line }} aria-label="Menú móvil">
              {[
                { label: editable(diseno?.celularesNavHome, 'Inicio'), to: `/tienda/${slug}` },
                { label: editable(diseno?.celularesNavShop, 'Todo'), to: `/tienda/${slug}/catalogo` },
                ...(categories || []).slice(0, 8).map((c: string) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })),
                { label: editable(diseno?.celularesNavContact, 'Soporte'), to: `/tienda/${slug}/contacto` },
              ].map((it, i) => (
                <button key={`${it.label}-${i}`} type="button" onClick={() => go(it.to)} className="flex w-full items-center justify-between rounded-xl px-2 py-3 text-left text-[14.5px] font-medium" style={{ color: t.ink }}>
                  {it.label}<Icon icon="solar:alt-arrow-right-linear" width={16} style={{ color: t.muted }} />
                </button>
              ))}
              {onDeals && <button type="button" onClick={() => { setMenu(null); onDeals(); }} className={`${btnCls} mt-2 h-11 w-full`} style={{ background: t.accent, color: t.onAccent }}><Icon icon="solar:fire-bold" width={16} /> {editable(diseno?.celularesNavDeals, 'Ofertas')}</button>}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

function IconBtn({ t, label, icon, onClick, badge = 0, strong = false }: { t: Theme; label: string; icon: string; onClick: () => void; badge?: number; strong?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-slate-100" style={{ color: t.ink }}>
      <Icon icon={icon} width={23} />
      {(badge > 0 || strong) && <span className="absolute right-0.5 top-0.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full px-1 text-[10.5px] font-bold" style={{ background: t.primary, color: t.onPrimary }}>{badge}</span>}
    </button>
  );
}

// ───────────────────────────────────────────────────── Medios de pago ──
/** Medios de pago REALES de la tienda (/payment-config). Carga aislada; si no hay datos, no se muestra nada. */
function PaymentBadges({ slug }: { slug: string }) {
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
      {items.map((it) => <span key={it} className="rounded-md border border-white/15 px-2.5 py-1 text-[11.5px] text-white/80">{it}</span>)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── Footer ──
export function NexoFooter({ tienda, slug, diseno, t, categories, navigate }: any) {
  const storeName = storeNameOf(tienda);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const waUrl = buildStorePurchaseWhatsappUrl(waNumber, 'Hola, tengo una consulta.');
  const address = [tienda?.direccion, tienda?.distrito].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  const horario = String(tienda?.horarioAtencion || '').trim();
  const socials = [
    tienda?.facebookUrl ? { icon: 'ic:baseline-facebook', label: 'Facebook', url: tienda.facebookUrl } : null,
    tienda?.instagramUrl ? { icon: 'mdi:instagram', label: 'Instagram', url: tienda.instagramUrl } : null,
    tienda?.tiktokUrl ? { icon: 'ic:baseline-tiktok', label: 'TikTok', url: tienda.tiktokUrl } : null,
    waUrl ? { icon: 'ic:baseline-whatsapp', label: 'WhatsApp', url: waUrl } : null,
  ].filter(Boolean) as { icon: string; label: string; url: string }[];
  const cats: string[] = (categories || []).slice(0, 6);
  const tagline = optional(diseno?.celularesFooterTagline, 'Tecnología que te acompaña.');
  const intro = String(diseno?.celularesFooterText || tienda?.descripcionTienda || '').trim();
  const sub = mix('#fff', 62, t.navy);
  const cols: { title: string; items: { label: string; to: string }[] }[] = [
    { title: editable(diseno?.celularesFooterCol1, 'Tienda'), items: [{ label: 'Todos los productos', to: `/tienda/${slug}/catalogo` }, ...cats.map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` }))] },
    { title: editable(diseno?.celularesFooterCol2, 'Soporte'), items: [
      { label: 'Contacto', to: `/tienda/${slug}/contacto` },
      { label: 'Preguntas frecuentes', to: `/tienda/${slug}/contacto#faq` },
      { label: 'Seguimiento de pedido', to: `/tienda/${slug}/seguimiento` },
    ] },
  ];
  return (
    <footer style={{ background: t.navy, color: '#fff' }}>
      <div className={`mx-auto grid max-w-[1320px] gap-10 px-4 py-12 sm:grid-cols-2 lg:px-8 ${address || horario ? 'lg:grid-cols-[1.6fr_1fr_1fr_1.3fr]' : 'lg:grid-cols-[1.8fr_1fr_1fr]'}`}>
        <div>
          <Logo tienda={tienda} diseno={diseno} t={t} light />
          {tagline && <p className="mt-4 text-[13.5px]" style={{ color: sub }}>{tagline}</p>}
          {intro && <p className="mt-2 max-w-xs whitespace-pre-line text-[12.5px] leading-relaxed" style={{ color: sub }}>{intro}</p>}
          {socials.length > 0 && (
            <div className="mt-5 flex gap-2">
              {socials.map((s) => <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"><Icon icon={s.icon} width={18} /></a>)}
            </div>
          )}
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="text-[14px] font-bold" style={{ fontFamily: t.display }}>{col.title}</h4>
            <ul className="mt-4 space-y-2.5 text-[13px]" style={{ color: sub }}>
              {col.items.map((it) => <li key={it.label}><button type="button" onClick={() => navigate(it.to)} className="text-left transition-colors hover:text-white">{it.label}</button></li>)}
            </ul>
          </div>
        ))}
        {(address || horario) && (
          <div>
            <h4 className="text-[14px] font-bold" style={{ fontFamily: t.display }}>Visítanos</h4>
            <ul className="mt-4 space-y-2.5 text-[13px]" style={{ color: sub }}>
              {address && <li className="flex gap-2"><Icon icon="solar:map-point-linear" width={16} className="mt-0.5 shrink-0" />{address}</li>}
              {horario && <li className="flex gap-2"><Icon icon="solar:clock-circle-linear" width={16} className="mt-0.5 shrink-0" />{horario}</li>}
            </ul>
          </div>
        )}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-3 px-4 py-5 text-[12px] sm:flex-row sm:items-center sm:justify-between lg:px-8" style={{ color: sub }}>
          <p>© {new Date().getFullYear()} {storeName}. Todos los derechos reservados.</p>
          <PaymentBadges slug={slug} />
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────── Product cards ──
/** "128GB | 256GB": valores reales de la primera opción del producto (capacidad, color…); si no hay, la marca. */
export function specLine(producto: any): string {
  const opts = Array.isArray(producto?.opcionesAtributos) ? producto.opcionesAtributos : [];
  const first = opts.find((o: any) => Array.isArray(o?.valores) && o.valores.length);
  if (first) return first.valores.slice(0, 3).join(' | ');
  return nameOf(producto?.marca) || nameOf(producto?.categoria);
}

/** Cantidad + agregar (estado aislado). */
function BuyRow({ t, producto, onOpen, onAdd, wide = false }: { t: Theme; producto: any; onOpen: () => void; onAdd: (q: number) => void; wide?: boolean }) {
  const [qty, setQty] = useState(1);
  const isOut = sinStock(Number(producto?.stock ?? 1));
  const hasVariants = Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  return (
    <div className={`mt-auto flex items-stretch gap-1.5 pt-3 ${wide ? 'flex-col' : ''}`} onClick={(e) => e.stopPropagation()}>
      {!hasVariants && !isOut && (
        <div className={`flex h-9 shrink-0 items-center justify-between rounded-full px-1 ${wide ? 'w-full' : 'w-[76px]'}`} style={{ background: t.soft }}>
          <button type="button" aria-label="Restar" onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-8 w-6 items-center justify-center text-[15px]" style={{ color: t.muted }}>−</button>
          <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setQty(d === '' ? 1 : Math.max(1, parseInt(d, 10))); }} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[13px] font-semibold outline-none focus:ring-0" style={{ color: t.ink }} />
          <button type="button" aria-label="Sumar" onClick={() => setQty(qty + 1)} className="flex h-8 w-6 items-center justify-center text-[15px]" style={{ color: t.muted }}>+</button>
        </div>
      )}
      <button
        type="button"
        disabled={isOut}
        onClick={() => { if (isOut) return; if (hasVariants) onOpen(); else onAdd(Math.max(1, qty)); }}
        className={`${btnCls} h-9 min-w-0 px-3 text-[12.5px] disabled:cursor-not-allowed ${wide ? 'w-full' : 'flex-1'}`}
        style={isOut ? { background: t.soft, color: t.muted } : { background: t.primary, color: t.onPrimary }}
      >
        <span className="truncate">{isOut ? 'Agotado' : hasVariants ? 'Ver opciones' : wide ? 'Agregar al carrito' : 'Agregar'}</span>
      </button>
    </div>
  );
}

/** Tarjeta vertical (catálogo, accesorios). */
export function NexoProductCard({ producto, slug, t, onOpen, onAdd, showSpec = true }: { producto: any; slug: string; t: Theme; onOpen: () => void; onAdd: (qty: number) => void; showSpec?: boolean }) {
  const pricing = getProductPricing(producto);
  const isOut = sinStock(Number(producto?.stock ?? 1));
  const spec = showSpec ? specLine(producto) : '';
  return (
    <article className="group relative flex h-full cursor-pointer flex-col rounded-2xl border bg-white p-3 transition-shadow duration-300 hover:shadow-[0_18px_40px_-26px_rgba(14,26,51,0.4)]" style={{ borderColor: t.line }} onClick={onOpen}>
      {pricing.enOferta && <span className="absolute left-4 top-4 z-10 rounded-full px-2 py-0.5 text-[10.5px] font-bold" style={{ background: t.accent, color: t.onAccent }}>-{pricing.porcentajeDescuento}%</span>}
      {isOut && <span className="absolute left-4 top-4 z-10 rounded-full bg-slate-800 px-2 py-0.5 text-[10.5px] font-bold text-white">Agotado</span>}
      <div className="absolute right-4 top-4 z-10 [&_button:nth-child(n+2)]:opacity-0 [&_button]:transition-opacity group-hover:[&_button:nth-child(n+2)]:opacity-100 [@media(hover:none)]:[&_button:nth-child(n+2)]:opacity-100" onClick={(e) => e.stopPropagation()}>
        <ProductCardActions producto={producto} slug={slug} cp={t.primary} />
      </div>
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl" style={{ background: t.soft }}>
        {producto?.imagenUrl
          ? <img src={producto.imagenUrl} alt={producto.descripcion} loading="lazy" className={`h-full w-full object-contain p-[10%] mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.05] ${isOut ? 'opacity-50 grayscale' : ''}`} />
          : <Icon icon="solar:smartphone-2-linear" width={56} style={{ color: mix(t.ink, 25, t.soft) }} />}
      </div>
      <div className="flex flex-1 flex-col px-1 pt-3">
        <h3 title={producto?.descripcion} className="line-clamp-2 text-[14px] font-bold leading-snug" style={{ color: t.ink, fontFamily: t.display }}>{producto?.descripcion}</h3>
        {spec && <p className="mt-0.5 truncate text-[12px]" style={{ color: t.muted }}>{spec}</p>}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="flex items-baseline gap-1.5">
            <span className="text-[16px] font-extrabold" style={{ color: t.ink, fontFamily: t.display }}>{nxPrice(pricing.precioFinal)}</span>
            {pricing.enOferta && <span className="text-[11.5px] line-through" style={{ color: t.muted }}>{nxPrice(pricing.precioRegular)}</span>}
          </span>
          <Stars producto={producto} t={t} />
        </div>
        <BuyRow t={t} producto={producto} onOpen={onOpen} onAdd={onAdd} />
      </div>
    </article>
  );
}
/** Alias con el nombre que usan las páginas compartidas. */
export const NexoCard = NexoProductCard;

/** Tarjeta horizontal de "Celulares destacados" (foto a la izquierda, datos a la derecha). */
export function NexoWideCard({ producto, slug, t, onOpen, onAdd }: { producto: any; slug: string; t: Theme; onOpen: () => void; onAdd: (qty: number) => void }) {
  const pricing = getProductPricing(producto);
  const spec = specLine(producto);
  return (
    <article className="group relative grid h-full cursor-pointer grid-cols-[42%_1fr] gap-3 rounded-2xl border bg-white p-3 transition-shadow duration-300 hover:shadow-[0_18px_40px_-26px_rgba(14,26,51,0.4)]" style={{ borderColor: t.line }} onClick={onOpen}>
      <div className="relative flex items-center justify-center overflow-hidden rounded-xl" style={{ background: t.soft }}>
        {pricing.enOferta && <span className="absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: t.accent, color: t.onAccent }}>-{pricing.porcentajeDescuento}%</span>}
        {producto?.imagenUrl
          ? <img src={producto.imagenUrl} alt={producto.descripcion} loading="lazy" className="aspect-[3/4] h-full w-full object-contain p-2 mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.05]" />
          : <Icon icon="solar:smartphone-2-linear" width={48} style={{ color: mix(t.ink, 25, t.soft) }} />}
      </div>
      <div className="flex min-w-0 flex-col py-1 pr-1">
        <div className="flex items-start justify-between gap-1">
          <h3 title={producto?.descripcion} className="line-clamp-2 text-[14.5px] font-bold leading-snug" style={{ color: t.ink, fontFamily: t.display }}>{producto?.descripcion}</h3>
          <span className="-mr-1 -mt-1 shrink-0 [&_button:nth-child(n+2)]:hidden" onClick={(e) => e.stopPropagation()}><ProductCardActions producto={producto} slug={slug} cp={t.primary} /></span>
        </div>
        {spec && <p className="mt-0.5 truncate text-[12px]" style={{ color: t.muted }}>{spec}</p>}
        <p className="mt-2 text-[20px] font-extrabold leading-none" style={{ color: t.ink, fontFamily: t.display }}>{nxPrice(pricing.precioFinal)}</p>
        {pricing.enOferta && <p className="mt-0.5 text-[11.5px] line-through" style={{ color: t.muted }}>{nxPrice(pricing.precioRegular)}</p>}
        <div className="mt-2"><Stars producto={producto} t={t} /></div>
        <BuyRow t={t} producto={producto} onOpen={onOpen} onAdd={onAdd} wide />
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────── Cart modal ──
export function NexoCartModal({ isOpen, onClose, carrito, actualizarCantidad, onCheckout, t, tienda, diseno }: any) {
  const items: any[] = carrito || [];
  const total = items.reduce((a, it) => a + Number(it.precioUnitario || 0) * Number(it.cantidad || 1), 0);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(waNumber, 'x'));
  const pedirWa = () => {
    if (!items.length) return;
    const detail = items.map((it) => `• ${Number(it.cantidad || 1)} x ${it.descripcion} - ${nxMoney(Number(it.precioUnitario || 0) * Number(it.cantidad || 1))}`).join('\n');
    const url = buildStorePurchaseWhatsappUrl(waNumber, `Hola, quiero pedir estos productos en ${storeNameOf(tienda)}:\n\n${detail}\n\nTotal estimado: ${nxMoney(total)}`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  const drawerStyle: CSSProperties = { background: t.bg, fontFamily: t.font };
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (isOpen) closeRef.current?.focus(); }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button type="button" aria-label="Cerrar carrito" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px]" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 260 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[430px] flex-col shadow-2xl" style={drawerStyle} role="dialog" aria-label="Carrito">
            <header className="flex items-center justify-between border-b bg-white px-6 py-5" style={{ borderColor: t.line }}>
              <div>
                <h2 className="text-[21px] font-extrabold tracking-[-0.02em]" style={{ color: t.ink, fontFamily: t.display }}>Tu carrito</h2>
                <p className="mt-0.5 text-[12.5px]" style={{ color: t.muted }}>{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
              </div>
              <button ref={closeRef} type="button" aria-label="Cerrar" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100" style={{ color: t.ink }}><Icon icon="solar:close-circle-linear" width={22} /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {!items.length ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: t.blushDeep, color: t.primaryInk }}><Icon icon="solar:cart-large-2-linear" width={36} /></span>
                  <h3 className="mt-5 text-[19px] font-extrabold" style={{ color: t.ink, fontFamily: t.display }}>Tu carrito está vacío</h3>
                  <p className="mt-1.5 max-w-[260px] text-[13px]" style={{ color: t.muted }}>Encuentra tu próximo equipo y los accesorios ideales.</p>
                  <button type="button" onClick={onClose} className={`${btnCls} mt-6 h-11 px-6`} style={{ background: t.primary, color: t.onPrimary }}>Seguir comprando</button>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {items.map((item) => {
                    const id = item.cartId || item.id;
                    const qty = Number(item.cantidad || 1);
                    const price = Number(item.precioUnitario || 0);
                    return (
                      <li key={id} className="relative grid grid-cols-[80px_1fr] gap-3 rounded-2xl border bg-white p-2.5" style={{ borderColor: t.line }}>
                        <button type="button" aria-label="Quitar" onClick={() => actualizarCantidad(id, 0)} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"><Icon icon="solar:trash-bin-minimalistic-linear" width={16} /></button>
                        <div className="flex h-[80px] items-center justify-center overflow-hidden rounded-xl" style={{ background: t.soft }}>
                          {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-1.5 mix-blend-multiply" /> : <Icon icon="solar:smartphone-2-linear" width={28} style={{ color: t.muted }} />}
                        </div>
                        <div className="min-w-0 pr-7">
                          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug" style={{ color: t.ink }}>{item.descripcion}</h3>
                          <div className="mt-2.5 flex items-center justify-between">
                            <div className="flex h-9 items-center overflow-hidden rounded-full" style={{ background: t.soft }}>
                              <button type="button" aria-label="Restar" onClick={() => actualizarCantidad(id, qty - 1)} className="flex w-8 items-center justify-center text-base" style={{ color: t.muted }}>−</button>
                              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); actualizarCantidad(id, d === '' ? 1 : parseInt(d, 10)); }} onFocus={(e) => e.currentTarget.select()} className="w-9 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[13px] font-semibold outline-none focus:ring-0" style={{ color: t.ink }} />
                              <button type="button" aria-label="Sumar" onClick={() => actualizarCantidad(id, qty + 1)} className="flex w-8 items-center justify-center text-base" style={{ color: t.muted }}>+</button>
                            </div>
                            <span className="text-[14.5px] font-extrabold" style={{ color: t.ink, fontFamily: t.display }}>{nxMoney(price * qty)}</span>
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
                  <span className="text-[13px]" style={{ color: t.muted }}>Subtotal</span>
                  <span className="text-[22px] font-extrabold" style={{ color: t.ink, fontFamily: t.display }}>{nxMoney(total)}</span>
                </div>
                <p className="mb-4 text-[11.5px]" style={{ color: t.muted }}>El envío se calcula en el checkout según tu forma de entrega.</p>
                <button type="button" onClick={() => { onClose(); onCheckout(); }} className={`${btnCls} h-12 w-full`} style={{ background: t.primary, color: t.onPrimary }}>Ir a pagar <Icon icon="solar:arrow-right-linear" width={17} /></button>
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
