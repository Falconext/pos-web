import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { getProductPricing } from '@/templates/shared/pricing';
import { readableText } from '@/templates/shared/color';
import { getFashionColors } from '@/templates/urbano/fashionVariants';
import ProductCardActions from '@/components/tienda/ProductCardActions';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { mix, rsEase } from './motion';

/**
 * Piezas base de la plantilla Bolsos (Rosé): tema, header, footer, tarjeta y carrito.
 * Regla de la plantilla: nada inventado. Si un dato no existe en la tienda, la UI se oculta.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

export const rsMoney = (v: any) => `S/ ${Number(v || 0).toFixed(2)}`;
export const editable = (v: any, fallback: string) => String(v || '').trim() || fallback;
export const storeNameOf = (tienda: any, fallback = 'Rosé') => tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || fallback;
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

const BASE_BG = '#FFFCFB'; // blanco cálido de la referencia

// ── Design tokens (vino + rosa de la referencia; Cormorant Garamond + Montserrat + Parisienne) ──
export function roseTheme(diseno: any) {
  const primary = diseno?.colorPrimario || '#6B1D38'; // vino (botones, barra inferior, contadores)
  const accent = diseno?.colorAccento || '#C0466A';   // rosa (segunda línea del hero, activos, badges)
  const rawBg = String(diseno?.colorSecundario || '').trim();
  const bgLum = luminance(rawBg);
  // "Color de fondo" global: claro → tal cual; saturado u oscuro → tinte suave sobre el blanco cálido.
  const bg = !rawBg ? BASE_BG : bgLum !== null && bgLum < 0.78 ? mix(rawBg, 8, BASE_BG) : rawBg;
  const ink = '#1F1A1C';
  const pl = luminance(primary);
  const al = luminance(accent);
  return {
    primary,
    accent,
    /** Principal/acento como texto sobre fondo claro: si son muy claros, caen a tinta. */
    primaryInk: pl !== null && pl > 0.45 ? ink : primary,
    accentInk: al !== null && al > 0.5 ? ink : accent,
    bg,
    ink,
    muted: '#7A6E72',
    /** Rubor: bandas y fondos de imagen (derivado del acento para respetar los colores globales). */
    blush: mix(accent, 7, '#fff'),
    blushDeep: mix(accent, 14, '#fff'),
    soft: mix(accent, 5, bg),
    line: mix(ink, 10, bg),
    onPrimary: readableText(primary),
    onAccent: readableText(accent),
    font: `'${diseno?.tipografia || 'Montserrat'}', 'Segoe UI', system-ui, sans-serif`,
    serif: `'Cormorant Garamond', 'Playfair Display', Georgia, serif`,
    script: `'Parisienne', 'Cormorant Garamond', cursive`,
  };
}
export type Theme = ReturnType<typeof roseTheme>;

/** Inyecta Cormorant Garamond + Montserrat + Parisienne una sola vez. */
export function useRoseFont() {
  useEffect(() => {
    const id = 'rose-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Montserrat:wght@400;500;600;700&family=Parisienne&display=swap';
    document.head.appendChild(link);
  }, []);
}

/** Botón rectangular de la referencia (esquinas apenas redondeadas, mayúsculas espaciadas). */
export const btnCls = 'inline-flex items-center justify-center gap-2 rounded-[4px] text-[12.5px] font-semibold uppercase tracking-[0.08em] transition-[filter,transform,background-color,color] hover:brightness-110 active:scale-[0.98]';

/** Estrellas reales; si aún no tiene reseñas, "Nuevo" (nunca estrellas de relleno). */
export function Stars({ producto, t, size = 12 }: { producto: any; t: Theme; size?: number }) {
  const rating = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const count = Number(producto?.ratingCount || producto?.reviewsCount || 0);
  if (!(rating > 0 && count > 0)) return <span className="text-[10.5px] font-medium uppercase tracking-[0.14em]" style={{ color: t.muted }}>Nuevo</span>;
  const r = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="flex" style={{ color: '#E8A33D' }}>
        {Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon={i < r ? 'solar:star-bold' : 'solar:star-linear'} width={size} style={i < r ? undefined : { color: t.line }} />)}
      </span>
      <span className="text-[11px]" style={{ color: t.muted }}>({count})</span>
    </span>
  );
}

export function Logo({ tienda, diseno, t, onClick, light = false }: { tienda: any; diseno: any; t: Theme; onClick?: () => void; light?: boolean }) {
  const name = editable(diseno?.bolsosLogoText, storeNameOf(tienda));
  const tagline = optional(diseno?.bolsosLogoTagline, 'Carteras que te definen');
  const color = light ? '#fff' : t.primaryInk;
  const content = tienda?.logo ? (
    <img src={tienda.logo} alt={name} className="h-10 w-auto max-w-[140px] object-contain sm:h-11 sm:max-w-[180px]" />
  ) : (
    <span className="flex items-center gap-2 sm:gap-2.5">
      <Icon icon="ph:handbag-light" width={36} className="h-7 w-7 shrink-0 sm:h-9 sm:w-9" style={{ color }} />
      <span className="flex min-w-0 flex-col leading-none">
        <span className="max-w-[130px] truncate text-[20px] font-semibold uppercase tracking-[0.16em] sm:max-w-[210px] sm:text-[24px] sm:tracking-[0.2em]" style={{ fontFamily: t.serif, color: light ? '#fff' : t.ink }}>{name}</span>
        {tagline && <span className="mt-1 hidden max-w-[210px] truncate text-[8.5px] sm:block font-medium uppercase tracking-[0.32em]" style={{ color: light ? 'rgba(255,255,255,.7)' : t.muted }}>{tagline}</span>}
      </span>
    </span>
  );
  return onClick ? <button type="button" onClick={onClick} className="flex shrink-0 items-center">{content}</button> : <div className="flex shrink-0 items-center">{content}</div>;
}

// ─────────────────────────────────────────────────────────── Beneficios ──
export type Service = { icon: string; label: string; sub: string };

/** Beneficios derivados de la configuración real de la tienda (nada de promesas inventadas). */
export function buildServices(tienda: any, hasWhatsapp = false): Service[] {
  const s: Service[] = [];
  const envio = Number(tienda?.costoEnvioFijo || 0);
  if (tienda?.aceptaEnvio !== false) s.push({ icon: 'solar:delivery-linear', label: 'Envío a domicilio', sub: envio > 0 ? `Desde ${rsMoney(envio)}` : 'Costo al finalizar tu compra' });
  if (tienda?.aceptaRecojo) {
    const min = Number(tienda?.tiempoPreparacionMin || 0);
    s.push({ icon: 'solar:shop-2-linear', label: 'Recojo en tienda', sub: min > 0 ? `Listo en ~${min} min` : 'Sin costo de envío' });
  }
  s.push({ icon: 'solar:shield-check-linear', label: 'Compra segura', sub: 'Confirmas antes de pagar' });
  if (hasWhatsapp) s.push({ icon: 'solar:chat-round-like-linear', label: 'Te asesoramos', sub: 'Por WhatsApp' });
  s.push({ icon: 'solar:map-arrow-square-linear', label: 'Seguimiento', sub: 'Código para tu pedido' });
  return s;
}

// ─────────────────────────────────────────────────────────────── Header ──
/**
 * Barra de beneficios + header. Estado propio (menú de categorías, búsqueda, menú móvil) aislado aquí.
 */
export function RoseHeader({ tienda, slug, diseno, categories, t, cartCount, favCount, onOpenCart, onOpenFav, navigate, active }: any) {
  const [menu, setMenu] = useState<null | 'cats' | 'search' | 'mobile'>(null);
  const [q, setQ] = useState('');
  const catsRef = useRef<HTMLDivElement>(null);
  const cats: string[] = categories || [];
  const go = (to: string) => { setMenu(null); navigate(to); };
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(tienda?.whatsappTienda ?? diseno?.whatsappTienda, 'x'));
  const strip = buildServices(tienda, hasWa).slice(0, 3);

  useEffect(() => {
    if (menu !== 'cats') return;
    const close = (e: MouseEvent) => { if (!catsRef.current?.contains(e.target as Node)) setMenu(null); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  const navBtn = (label: string, key: string, to: string) => (
    <button key={key} type="button" onClick={() => go(to)} className="relative px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors hover:opacity-100" style={{ color: active === key ? t.accentInk : t.ink }}>
      {label}
      {active === key && <span className="absolute inset-x-3 -bottom-0.5 h-[2px]" style={{ background: t.accent }} />}
    </button>
  );

  return (
    <header className="sticky top-0 z-30">
      {!isOn(diseno?.bolsosStripHidden) && strip.length > 0 && (
        <div className="hidden border-b sm:block" style={{ background: t.blush, borderColor: t.line }}>
          <ul className="mx-auto grid max-w-[1320px] grid-cols-3 px-4 py-2.5 text-[12px] lg:px-8" style={{ color: mix(t.ink, 80, '#fff') }}>
            {strip.map((s, i) => (
              <li key={s.label} className={`flex items-center gap-2 ${i === 0 ? 'justify-start' : i === strip.length - 1 ? 'justify-end' : 'justify-center'}`}>
                <Icon icon={s.icon} width={17} style={{ color: t.accentInk }} />
                <span className="font-medium">{s.label}</span><span className="hidden lg:inline" style={{ color: t.muted }}>· {s.sub}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="border-b backdrop-blur-md" style={{ borderColor: t.line, background: mix(t.bg, 92, 'transparent') }}>
        <div className="mx-auto grid h-[68px] max-w-[1320px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:h-[76px] lg:grid-cols-[auto_1fr_auto] lg:px-8">
          <div className="justify-self-start"><Logo tienda={tienda} diseno={diseno} t={t} onClick={() => go(`/tienda/${slug}`)} /></div>

          <nav className="hidden items-center justify-center gap-1 lg:flex" aria-label="Principal">
            {navBtn(editable(diseno?.bolsosNavHome, 'Inicio'), 'home', `/tienda/${slug}`)}
            {navBtn(editable(diseno?.bolsosNavShop, 'Tienda'), 'catalog', `/tienda/${slug}/catalogo`)}
            {cats.length > 0 && (
              <div ref={catsRef} className="relative">
                <button type="button" onClick={() => setMenu(menu === 'cats' ? null : 'cats')} aria-expanded={menu === 'cats'} className="inline-flex items-center gap-1 px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: t.ink }}>
                  {editable(diseno?.bolsosNavCategories, 'Categorías')}
                  <Icon icon="solar:alt-arrow-down-linear" width={13} className={`transition-transform ${menu === 'cats' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {menu === 'cats' && (
                    // Envoltorio: centra con translate de Tailwind y solo anima opacidad; el hijo anima `y`.
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="absolute left-1/2 top-full z-40 mt-3 w-64 -translate-x-1/2">
                      <motion.div initial={{ y: 8 }} animate={{ y: 0 }} exit={{ y: 6 }} transition={{ duration: 0.2, ease: rsEase }} className="rounded-md border bg-white p-2 shadow-[0_24px_50px_-28px_rgba(31,26,28,0.45)]" style={{ borderColor: t.line }}>
                        {cats.slice(0, 12).map((c) => (
                          <button key={c} type="button" onClick={() => go(`/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`)} className="flex w-full items-center justify-between rounded px-3 py-2.5 text-left text-[13px] font-medium transition-colors hover:bg-black/[0.03]" style={{ color: t.ink }}>
                            {c}<Icon icon="solar:alt-arrow-right-linear" width={14} style={{ color: t.muted }} />
                          </button>
                        ))}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            {navBtn(editable(diseno?.bolsosNavContact, 'Contacto'), 'contact', `/tienda/${slug}/contacto`)}
          </nav>

          <div className="flex items-center gap-0.5 justify-self-end">
            <IconBtn t={t} label="Buscar" icon="solar:magnifer-linear" onClick={() => setMenu(menu === 'search' ? null : 'search')} />
            <IconBtn t={t} label="Favoritos" icon="solar:heart-linear" onClick={onOpenFav} badge={favCount} />
            <IconBtn t={t} label="Carrito" icon="solar:bag-4-linear" onClick={onOpenCart} badge={cartCount} />
            <span className="lg:hidden"><IconBtn t={t} label="Menú" icon={menu === 'mobile' ? 'solar:close-circle-linear' : 'solar:hamburger-menu-linear'} onClick={() => setMenu(menu === 'mobile' ? null : 'mobile')} /></span>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {menu === 'search' && (
            <motion.form key="search" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: rsEase }} onSubmit={(e) => { e.preventDefault(); go(`/tienda/${slug}/catalogo${q.trim() ? `?search=${encodeURIComponent(q.trim())}` : ''}`); }} className="border-t" style={{ borderColor: t.line }} role="search">
              <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-3 px-4 lg:px-8">
                <Icon icon="solar:magnifer-linear" width={18} style={{ color: t.muted }} />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={editable(diseno?.bolsosSearchPlaceholder, 'Busca carteras, mochilas, billeteras…')} aria-label="Buscar productos" className="min-w-0 flex-1 appearance-none border-0 bg-transparent bg-none p-0 text-[14px] outline-none placeholder:text-stone-400 focus:ring-0" style={{ color: t.ink }} />
                <button type="submit" className={`${btnCls} h-9 px-5 text-[11.5px]`} style={{ background: t.primary, color: t.onPrimary }}>Buscar</button>
              </div>
            </motion.form>
          )}
          {menu === 'mobile' && (
            <motion.nav key="mobile" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: rsEase }} className="border-t px-4 pb-4 pt-2 lg:hidden" style={{ borderColor: t.line }} aria-label="Menú móvil">
              {[
                { label: editable(diseno?.bolsosNavHome, 'Inicio'), to: `/tienda/${slug}` },
                { label: editable(diseno?.bolsosNavShop, 'Tienda'), to: `/tienda/${slug}/catalogo` },
                ...cats.slice(0, 6).map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })),
                { label: editable(diseno?.bolsosNavContact, 'Contacto'), to: `/tienda/${slug}/contacto` },
              ].map((it, i) => (
                <button key={`${it.label}-${i}`} type="button" onClick={() => go(it.to)} className="flex w-full items-center justify-between border-b px-1 py-3.5 text-left text-[13px] font-semibold uppercase tracking-[0.08em] last:border-b-0" style={{ color: t.ink, borderColor: t.line }}>
                  {it.label}<Icon icon="solar:alt-arrow-right-linear" width={15} style={{ color: t.muted }} />
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
    <button type="button" aria-label={label} title={label} onClick={onClick} className="relative flex h-10 w-10 items-center sm:h-11 sm:w-11 justify-center rounded-full transition-colors hover:bg-black/[0.04]" style={{ color: t.ink }}>
      <Icon icon={icon} width={23} />
      {badge > 0 && <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold" style={{ background: t.accent, color: t.onAccent }}>{badge}</span>}
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
  const items: { key: string; node: ReactNode }[] = [];
  const chip = (text: string) => <span className="text-[11px] font-bold tracking-[0.02em] text-stone-800">{text}</span>;
  if (cfg.aceptaTarjeta || cfg.aceptaNiubiz) {
    items.push({ key: 'visa', node: <Icon icon="logos:visa" height={11} /> });
    items.push({ key: 'mc', node: <Icon icon="logos:mastercard" height={15} /> });
  }
  if (cfg.aceptaMercadoPago) items.push({ key: 'mp', node: chip('Mercado Pago') });
  if (cfg.yapeQrUrl || cfg.yapeQR || cfg.yapeNumero) items.push({ key: 'yape', node: <span className="text-[11.5px] font-extrabold text-[#742284]">yape</span> });
  if (cfg.plinQrUrl || cfg.plinQR || cfg.plinNumero) items.push({ key: 'plin', node: <span className="text-[11.5px] font-extrabold text-[#0B8FD1]">plin</span> });
  if (Array.isArray(cfg.cuentasBancarias) && cfg.cuentasBancarias.length) items.push({ key: 'tr', node: chip('Transferencia') });
  if (cfg.aceptaEfectivo) items.push({ key: 'cash', node: chip('Efectivo') });
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[12px] opacity-80">Aceptamos:</span>
      {items.map((it) => <span key={it.key} className="flex h-7 min-w-[46px] items-center justify-center rounded-[4px] bg-white px-2.5">{it.node}</span>)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── Footer ──
export function RoseFooter({ tienda, slug, diseno, t, categories, navigate }: any) {
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
  const cols: { title: string; items: { label: string; to: string }[] }[] = [
    { title: editable(diseno?.bolsosFooterCol1, 'Tienda'), items: [...cats.map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })), { label: cats.length ? 'Ver todo' : 'Catálogo', to: `/tienda/${slug}/catalogo` }] },
    { title: editable(diseno?.bolsosFooterCol2, 'Atención al cliente'), items: [
      { label: 'Contacto', to: `/tienda/${slug}/contacto` },
      { label: 'Preguntas frecuentes', to: `/tienda/${slug}/contacto#faq` },
      { label: 'Seguimiento de pedido', to: `/tienda/${slug}/seguimiento` },
    ] },
  ];
  const intro = String(diseno?.bolsosFooterText || tienda?.descripcionTienda || '').trim();
  const whatsappLabel = waUrl ? String(waNumber || '').replace(/\D/g, '').replace(/^51(?=\d{9}$)/, '').replace(/^(\d{3})(\d{3})(\d{3})$/, '+51 $1 $2 $3') : '';
  const hasContact = Boolean(address || horario || whatsappLabel);

  return (
    <footer>
      <div className="border-t" style={{ background: t.blush, borderColor: t.line }}>
        <div className={`mx-auto grid max-w-[1320px] gap-10 px-4 py-14 sm:grid-cols-2 lg:px-8 ${hasContact ? 'lg:grid-cols-[1.5fr_1fr_1fr_1.3fr]' : 'lg:grid-cols-[1.6fr_1fr_1fr]'}`}>
          <div>
            <Logo tienda={tienda} diseno={diseno} t={t} />
            {intro && <p className="mt-5 max-w-xs whitespace-pre-line text-[12.5px] leading-relaxed" style={{ color: t.muted }}>{intro}</p>}
            {socials.length > 0 && (
              <div className="mt-5 flex gap-2">
                {socials.map((s) => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-9 w-9 items-center justify-center rounded-full border bg-white transition-colors hover:text-white" style={{ borderColor: t.line, color: t.ink }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = t.primary; e.currentTarget.style.color = t.onPrimary; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = t.ink; }}>
                    <Icon icon={s.icon} width={17} />
                  </a>
                ))}
              </div>
            )}
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: t.ink }}>{col.title}</h4>
              <ul className="mt-5 space-y-2.5 text-[12.5px]" style={{ color: t.muted }}>
                {col.items.map((it) => <li key={it.label}><button type="button" onClick={() => navigate(it.to)} className="text-left transition-colors hover:underline hover:underline-offset-4" style={{ color: 'inherit' }}>{it.label}</button></li>)}
              </ul>
            </div>
          ))}
          {hasContact && (
            <div>
              <h4 className="text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: t.ink }}>Contáctanos</h4>
              <ul className="mt-5 space-y-3 text-[12.5px]" style={{ color: t.muted }}>
                {address && <li className="flex gap-2.5"><Icon icon="solar:map-point-linear" width={17} className="mt-0.5 shrink-0" style={{ color: t.accentInk }} />{address}</li>}
                {whatsappLabel && <li><a href={waUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex gap-2.5 hover:underline"><Icon icon="ic:baseline-whatsapp" width={17} className="mt-0.5 shrink-0" style={{ color: t.accentInk }} />{whatsappLabel}</a></li>}
                {horario && <li className="flex gap-2.5"><Icon icon="solar:clock-circle-linear" width={17} className="mt-0.5 shrink-0" style={{ color: t.accentInk }} />{horario}</li>}
              </ul>
            </div>
          )}
        </div>
      </div>
      <div style={{ background: t.primary, color: t.onPrimary }}>
        <div className="mx-auto flex max-w-[1320px] flex-col gap-3 px-4 py-4 text-[12px] sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p className="opacity-85">© {new Date().getFullYear()} {storeName}. Todos los derechos reservados.</p>
          <PaymentBadges slug={slug} />
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────── Product card ──
/**
 * Tarjeta de producto (estado propio de cantidad aislado). Con variantes (color, tamaño)
 * lleva a elegir en la ficha en vez de agregar a ciegas.
 */
export function RoseProductCard({ producto, slug, t, onOpen, onAdd }: { producto: any; slug: string; t: Theme; onOpen: () => void; onAdd: (qty: number) => void }) {
  const pricing = getProductPricing(producto);
  const stock = Number(producto?.stock ?? 1);
  const isOut = stock <= 0;
  const hasVariants = Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const colors = getFashionColors(producto).slice(0, 4);
  const [qty, setQty] = useState(1);
  const badge = isOut ? { text: 'Agotado', bg: t.ink, fg: '#fff' }
    : pricing.enOferta ? { text: `-${pricing.porcentajeDescuento}%`, bg: t.accent, fg: t.onAccent }
    : producto?.destacado ? { text: 'Destacado', bg: t.primary, fg: t.onPrimary }
    : null;

  return (
    <article className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-md border bg-white transition-shadow duration-300 hover:shadow-[0_22px_44px_-30px_rgba(107,29,56,0.45)]" style={{ borderColor: t.line }} onClick={onOpen}>
      {badge && <span className="absolute left-2.5 top-2.5 z-10 rounded-[3px] px-2 py-1 text-[9.5px] font-bold uppercase tracking-[0.08em]" style={{ background: badge.bg, color: badge.fg }}>{badge.text}</span>}
      <div className="absolute right-2.5 top-2.5 z-10 [&_button:nth-child(n+2)]:opacity-0 [&_button]:transition-opacity group-hover:[&_button:nth-child(n+2)]:opacity-100 [@media(hover:none)]:[&_button:nth-child(n+2)]:opacity-100" onClick={(e) => e.stopPropagation()}>
        <ProductCardActions producto={producto} slug={slug} cp={t.accent} />
      </div>

      <div className="relative m-1.5 flex aspect-square items-center justify-center overflow-hidden rounded" style={{ background: t.soft }}>
        {producto?.imagenUrl ? (
          <img src={producto.imagenUrl} alt={producto.descripcion} loading="lazy" className={`h-full w-full object-contain p-3 mix-blend-multiply transition-transform duration-700 group-hover:scale-[1.06] ${isOut ? 'opacity-50 grayscale' : ''}`} />
        ) : (
          <Icon icon="ph:handbag-light" width={64} style={{ color: mix(t.ink, 22, t.bg) }} />
        )}
      </div>

      <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-2">
        <h3 title={producto?.descripcion} className="line-clamp-2 min-h-[36px] text-[13px] font-medium leading-snug" style={{ color: t.ink }}>{producto?.descripcion}</h3>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <Stars producto={producto} t={t} size={11} />
          {colors.length > 0 && <div className="flex -space-x-1">{colors.map((c) => <span key={c.name} title={c.name} className="h-3 w-3 rounded-full ring-2 ring-white" style={{ background: c.hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.1)' }} />)}</div>}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[15.5px] font-bold" style={{ color: t.ink }}>{rsMoney(pricing.precioFinal)}</span>
          {pricing.enOferta && <span className="text-[11.5px] line-through" style={{ color: t.muted }}>{rsMoney(pricing.precioRegular)}</span>}
        </div>

        <div className="mt-auto flex flex-wrap items-stretch gap-1.5 pt-3.5 sm:flex-nowrap" onClick={(e) => e.stopPropagation()}>
          {!hasVariants && !isOut && (
            <div className="flex h-9 w-full shrink-0 items-center justify-between rounded-[4px] px-0.5 sm:w-[64px]" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
              <button type="button" aria-label="Restar" onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-8 w-6 items-center justify-center text-[15px]" style={{ color: t.muted }}>−</button>
              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setQty(d === '' ? 1 : Math.max(1, parseInt(d, 10))); }} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[12.5px] font-semibold outline-none focus:ring-0" style={{ color: t.ink }} />
              <button type="button" aria-label="Sumar" onClick={() => setQty(qty + 1)} className="flex h-8 w-6 items-center justify-center text-[15px]" style={{ color: t.muted }}>+</button>
            </div>
          )}
          <button
            type="button"
            disabled={isOut}
            onClick={() => { if (isOut) return; if (hasVariants) onOpen(); else onAdd(Math.max(1, qty)); }}
            className="flex h-9 min-w-0 flex-1 basis-full items-center justify-center gap-1.5 rounded-[4px] px-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[color:var(--rs-c)] transition-colors duration-300 enabled:hover:bg-[var(--rs-p)] enabled:hover:text-[color:var(--rs-op)] disabled:cursor-not-allowed disabled:opacity-50 sm:basis-auto"
            style={{ boxShadow: `inset 0 0 0 1px ${isOut ? t.line : mix(t.primary, 45, '#fff')}`, ['--rs-c' as any]: isOut ? t.muted : t.primaryInk, ['--rs-p' as any]: t.primary, ['--rs-op' as any]: t.onPrimary }}
          >
            {!isOut && <Icon icon={hasVariants ? 'solar:palette-round-linear' : 'solar:cart-large-2-linear'} width={14} className="shrink-0" />}
            <span className="truncate">{isOut ? 'Agotado' : hasVariants ? 'Ver opciones' : 'Agregar'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────── Cart modal ──
export function RoseCartModal({ isOpen, onClose, carrito, actualizarCantidad, onCheckout, t, tienda, diseno }: any) {
  const items: any[] = carrito || [];
  const total = items.reduce((a, it) => a + Number(it.precioUnitario || 0) * Number(it.cantidad || 1), 0);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(waNumber, 'x'));
  const pedirWa = () => {
    if (!items.length) return;
    const detail = items.map((it) => `• ${Number(it.cantidad || 1)} x ${it.descripcion} - ${rsMoney(Number(it.precioUnitario || 0) * Number(it.cantidad || 1))}`).join('\n');
    const url = buildStorePurchaseWhatsappUrl(waNumber, `Hola, quiero pedir estos productos en ${storeNameOf(tienda)}:\n\n${detail}\n\nTotal estimado: ${rsMoney(total)}`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  const drawerStyle: CSSProperties = { background: t.bg, fontFamily: t.font };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button type="button" aria-label="Cerrar carrito" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-stone-900/35 backdrop-blur-[2px]" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 260 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[430px] flex-col shadow-2xl" style={drawerStyle} role="dialog" aria-label="Carrito">
            <header className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: t.line }}>
              <div>
                <h2 className="text-[26px] font-semibold leading-none" style={{ color: t.ink, fontFamily: t.serif }}>Tu carrito</h2>
                <p className="mt-1.5 text-[11.5px] font-medium uppercase tracking-[0.12em]" style={{ color: t.muted }}>{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
              </div>
              <button type="button" aria-label="Cerrar" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/[0.05]" style={{ color: t.ink }}><Icon icon="solar:close-circle-linear" width={22} /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {!items.length ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: t.blushDeep, color: t.accentInk }}><Icon icon="ph:handbag-light" width={40} /></span>
                  <h3 className="mt-5 text-[24px] font-semibold" style={{ color: t.ink, fontFamily: t.serif }}>Tu carrito está vacío</h3>
                  <p className="mt-1.5 max-w-[260px] text-[13px]" style={{ color: t.muted }}>Descubre la cartera perfecta para cada ocasión.</p>
                  <button type="button" onClick={onClose} className={`${btnCls} mt-6 h-11 px-6`} style={{ background: t.primary, color: t.onPrimary }}>Seguir comprando</button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => {
                    const id = item.cartId || item.id;
                    const qty = Number(item.cantidad || 1);
                    const price = Number(item.precioUnitario || 0);
                    return (
                      <li key={id} className="relative grid grid-cols-[84px_1fr] gap-3 rounded-md border bg-white p-3" style={{ borderColor: t.line }}>
                        <button type="button" aria-label="Quitar" onClick={() => actualizarCantidad(id, 0)} className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-500"><Icon icon="solar:trash-bin-minimalistic-linear" width={16} /></button>
                        <div className="flex h-[84px] items-center justify-center overflow-hidden rounded" style={{ background: t.soft }}>
                          {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-1.5 mix-blend-multiply" /> : <Icon icon="ph:handbag-light" width={30} style={{ color: t.muted }} />}
                        </div>
                        <div className="min-w-0 pr-7">
                          <h3 className="line-clamp-2 text-[13px] font-medium leading-snug" style={{ color: t.ink }}>{item.descripcion}</h3>
                          <div className="mt-2.5 flex items-center justify-between">
                            <div className="flex h-9 items-center overflow-hidden rounded-[4px]" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                              <button type="button" aria-label="Restar" onClick={() => actualizarCantidad(id, qty - 1)} className="flex w-8 items-center justify-center text-base" style={{ color: t.muted }}>−</button>
                              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); actualizarCantidad(id, d === '' ? 1 : parseInt(d, 10)); }} onFocus={(e) => e.currentTarget.select()} className="w-9 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[13px] font-semibold outline-none focus:ring-0" style={{ color: t.ink }} />
                              <button type="button" aria-label="Sumar" onClick={() => actualizarCantidad(id, qty + 1)} className="flex w-8 items-center justify-center text-base" style={{ color: t.muted }}>+</button>
                            </div>
                            <span className="text-[14.5px] font-bold" style={{ color: t.ink }}>{rsMoney(price * qty)}</span>
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
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: t.muted }}>Subtotal</span>
                  <span className="text-[22px] font-bold" style={{ color: t.ink }}>{rsMoney(total)}</span>
                </div>
                <p className="mb-4 text-[11.5px]" style={{ color: t.muted }}>El envío se calcula en el checkout según tu forma de entrega.</p>
                <button type="button" onClick={() => { onClose(); onCheckout(); }} className={`${btnCls} h-12 w-full`} style={{ background: t.primary, color: t.onPrimary }}>
                  Ir a pagar <Icon icon="solar:arrow-right-linear" width={17} />
                </button>
                {hasWa && (
                  <button type="button" onClick={pedirWa} className={`${btnCls} mt-2.5 h-11 w-full`} style={{ boxShadow: `inset 0 0 0 1px ${t.line}`, color: t.ink }}>
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
