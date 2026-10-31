import EnlaceLibroReclamaciones from '@/components/tienda/EnlaceLibroReclamaciones';
import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { getProductPricing } from '@/templates/shared/pricing';
import { readableText } from '@/templates/shared/color';
import { getFashionColors } from '@/templates/urbano/fashionVariants';
import { sinStock } from '@/templates/shared/ventaSinStock';
import ProductCardActions from '@/components/tienda/ProductCardActions';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { mix, esEase } from './motion';

/**
 * Piezas base de la plantilla Esencial (Esencia): tema, header, footer, tarjeta y carrito.
 * Regla de la plantilla: nada inventado. Si un dato no existe en la tienda, la UI se oculta.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

export const esMoney = (v: any) => `S/ ${Number(v || 0).toFixed(2)}`;
/** Alias con el nombre que usan las páginas compartidas. */
export const rsMoney = esMoney;
export const editable = (v: any, fallback: string) => String(v || '').trim() || fallback;
export const storeNameOf = (tienda: any, fallback = 'Esencia') => tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || fallback;
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

const BASE_BG = '#F7F4EF'; // marfil cálido de la referencia

// ── Design tokens (salvia + topo de la referencia; Gilda Display + Jost) ──
export function esenciaTheme(diseno: any) {
  const primary = diseno?.colorPrimario || '#8A9884'; // salvia (botones)
  const accent = diseno?.colorAccento || '#6F6253';   // topo (enlaces, subrayados, badges)
  const rawBg = String(diseno?.colorSecundario || '').trim();
  const bgLum = luminance(rawBg);
  // "Color de fondo" global: claro → tal cual; saturado u oscuro → tinte suave sobre el marfil.
  const bg = !rawBg ? BASE_BG : bgLum !== null && bgLum < 0.78 ? mix(rawBg, 8, BASE_BG) : rawBg;
  const ink = '#2A2622';
  const pl = luminance(primary);
  const al = luminance(accent);
  const display = `'Gilda Display', 'Cormorant Garamond', Georgia, serif`;
  return {
    primary,
    accent,
    /** Principal/acento como texto sobre fondo claro: si son muy claros, caen a tinta. */
    primaryInk: pl !== null && pl > 0.45 ? ink : primary,
    accentInk: al !== null && al > 0.5 ? ink : accent,
    bg,
    ink,
    muted: '#7B746B',
    /** Fondo de las fotos de producto (gris cálido) y de bandas suaves. */
    soft: mix(ink, 5, BASE_BG),
    /** Banda salvia de "Looks" y "Favoritos" (deriva del principal). */
    band: mix(primary, 20, '#F1EEE8'),
    bandSoft: mix(primary, 10, '#F3F0EA'),
    line: mix(ink, 12, BASE_BG),
    blushDeep: mix(primary, 16, '#fff'),
    onPrimary: readableText(primary),
    onAccent: readableText(accent),
    font: `'${diseno?.tipografia || 'Jost'}', 'Segoe UI', system-ui, sans-serif`,
    display,
    serif: display,
  };
}
export type Theme = ReturnType<typeof esenciaTheme>;

/** Inyecta Gilda Display + Jost una sola vez. */
export function useEsenciaFont() {
  useEffect(() => {
    const id = 'esencia-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Gilda+Display&family=Jost:wght@300;400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);
}

/** Botón recto de la referencia. */
export const btnCls = 'inline-flex items-center justify-center gap-2 rounded-[2px] text-[13.5px] font-medium transition-[filter,transform,background-color,color] hover:brightness-105 active:scale-[0.98]';

/** Estrellas reales; si aún no tiene reseñas, "Nuevo" (nunca estrellas de relleno). */
export function Stars({ producto, t, size = 11 }: { producto: any; t: Theme; size?: number }) {
  const rating = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const count = Number(producto?.ratingCount || producto?.reviewsCount || 0);
  if (!(rating > 0 && count > 0)) return <span className="text-[11px]" style={{ color: t.muted }}>Nuevo</span>;
  const r = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="flex" style={{ color: t.ink }}>
        {Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon={i < r ? 'solar:star-bold' : 'solar:star-linear'} width={size} />)}
      </span>
      <span className="text-[11px]" style={{ color: t.muted }}>({count})</span>
    </span>
  );
}

export function Logo({ tienda, diseno, t, onClick, light = false }: { tienda: any; diseno: any; t: Theme; onClick?: () => void; light?: boolean }) {
  const name = editable(diseno?.esencialLogoText, storeNameOf(tienda));
  const tagline = optional(diseno?.esencialLogoTagline, 'Esenciales');
  // Nombres largos: menos espaciado para que entren sin cortarse.
  const long = name.length > 9;
  const content = tienda?.logo ? (
    <img src={tienda.logo} alt={name} className="h-10 w-auto max-w-[160px] object-contain" />
  ) : (
    <span className="flex flex-col items-center leading-none">
      <span className={`max-w-[190px] truncate uppercase sm:max-w-[380px] ${long ? 'text-[19px] tracking-[0.14em] sm:text-[24px]' : 'text-[24px] tracking-[0.32em] sm:text-[28px]'}`} style={{ fontFamily: t.display, color: light ? '#fff' : t.ink, marginRight: long ? '-0.14em' : '-0.32em' }}>{name}</span>
      {tagline && <span className="mt-1.5 text-[8.5px] uppercase tracking-[0.5em]" style={{ color: light ? 'rgba(255,255,255,.7)' : t.muted, marginRight: '-0.5em' }}>{tagline}</span>}
    </span>
  );
  return onClick ? <button type="button" onClick={onClick} className="flex min-w-0 items-center">{content}</button> : <div className="flex min-w-0 items-center">{content}</div>;
}

// ─────────────────────────────────────────────────────────── Beneficios ──
export type Service = { icon: string; label: string; sub: string };

/** Beneficios derivados de la configuración real de la tienda (nada de promesas inventadas). */
export function buildServices(tienda: any, hasWhatsapp = false): Service[] {
  const s: Service[] = [];
  const envio = Number(tienda?.costoEnvioFijo || 0);
  if (tienda?.aceptaEnvio !== false) s.push({ icon: 'ph:truck-light', label: 'Envío a domicilio', sub: envio > 0 ? `Tarifa fija de ${esMoney(envio)}` : 'Costo al finalizar tu compra' });
  if (tienda?.aceptaRecojo) {
    const min = Number(tienda?.tiempoPreparacionMin || 0);
    s.push({ icon: 'ph:storefront-light', label: 'Recojo en tienda', sub: min > 0 ? `Listo en ~${min} min` : 'Sin costo de envío' });
  }
  s.push({ icon: 'ph:lock-simple-light', label: 'Compra segura', sub: 'Confirmas antes de pagar' });
  if (hasWhatsapp) s.push({ icon: 'ph:headset-light', label: 'Te asesoramos', sub: 'Por WhatsApp' });
  s.push({ icon: 'ph:package-light', label: 'Seguimiento', sub: 'Código para tu pedido' });
  return s;
}

// ─────────────────────────────────────────────────────────────── Header ──
/**
 * Barra de anuncio + header con menú lateral, enlaces y logo centrado. Estado propio
 * (búsqueda, menú lateral) aislado aquí.
 */
export function EsenciaHeader({ tienda, slug, diseno, categories, t, cartCount, favCount, onOpenCart, onOpenFav, navigate, active }: any) {
  const [menu, setMenu] = useState<null | 'search' | 'drawer'>(null);
  const [q, setQ] = useState('');
  const cats: string[] = categories || [];
  const go = (to: string) => { setMenu(null); navigate(to); };
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(tienda?.whatsappTienda ?? diseno?.whatsappTienda, 'x'));
  const announcement = optional(diseno?.esencialTopText, buildServices(tienda, hasWa).slice(0, 2).map((s) => `${s.label}: ${s.sub.toLowerCase()}`).join('  |  '));
  const links = [
    { key: 'catalog', label: editable(diseno?.esencialNavShop, 'Tienda'), to: `/tienda/${slug}/catalogo` },
    ...cats.slice(0, 3).map((c) => ({ key: `cat-${c}`, label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })),
    { key: 'contact', label: editable(diseno?.esencialNavContact, 'Contacto'), to: `/tienda/${slug}/contacto` },
  ];

  useEffect(() => {
    if (menu !== 'drawer') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menu]);

  return (
    <>
      <header className="sticky top-0 z-30">
        {!isOn(diseno?.esencialTopHidden) && announcement && (
          <div className="px-4 py-2 text-center text-[12px] tracking-[0.02em]" style={{ background: mix(t.ink, 6, t.bg), color: mix(t.ink, 80, t.bg) }}>{announcement}</div>
        )}
        <div className="border-b backdrop-blur-md" style={{ borderColor: t.line, background: mix(t.bg, 94, 'transparent') }}>
          <div className="relative mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-4 lg:h-[84px] lg:px-8">
            <div className="flex items-center gap-6">
              <button type="button" aria-label="Abrir menú" onClick={() => setMenu('drawer')} className="-ml-2 flex h-11 w-11 items-center justify-center" style={{ color: t.ink }}><Icon icon="ph:list-light" width={26} /></button>
              <nav className="hidden items-center gap-6 xl:flex" aria-label="Principal">
                {links.map((l) => (
                  <button key={l.key} type="button" onClick={() => go(l.to)} className="relative py-1 text-[13.5px] transition-colors" style={{ color: active === l.key ? t.ink : mix(t.ink, 78, t.bg) }}>
                    {l.label}
                    {active === l.key && <span className="absolute inset-x-0 -bottom-0.5 h-px" style={{ background: t.ink }} />}
                  </button>
                ))}
              </nav>
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"><Logo tienda={tienda} diseno={diseno} t={t} onClick={() => go(`/tienda/${slug}`)} /></div>
            <div className="flex items-center gap-0.5">
              <IconBtn t={t} label="Buscar" icon="ph:magnifying-glass-light" onClick={() => setMenu(menu === 'search' ? null : 'search')} />
              <span className="hidden sm:inline-flex"><IconBtn t={t} label="Favoritos" icon="ph:heart-light" onClick={onOpenFav} badge={favCount} /></span>
              <IconBtn t={t} label="Carrito" icon="ph:handbag-simple-light" onClick={onOpenCart} badge={cartCount} dark />
            </div>
          </div>
          <AnimatePresence initial={false}>
            {menu === 'search' && (
              <motion.form key="search" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: esEase }} onSubmit={(e) => { e.preventDefault(); go(`/tienda/${slug}/catalogo${q.trim() ? `?search=${encodeURIComponent(q.trim())}` : ''}`); }} className="border-t" style={{ borderColor: t.line }} role="search">
                <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 lg:px-8">
                  <Icon icon="ph:magnifying-glass-light" width={19} style={{ color: t.muted }} />
                  <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={editable(diseno?.esencialSearchPlaceholder, 'Busca camisas, tejidos, pantalones…')} aria-label="Buscar productos" className="min-w-0 flex-1 appearance-none border-0 bg-transparent bg-none p-0 text-[14.5px] outline-none placeholder:text-stone-400 focus:ring-0" style={{ color: t.ink }} />
                  <button type="submit" className={`${btnCls} h-9 px-5`} style={{ background: t.primary, color: t.onPrimary }}>Buscar</button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </header>

      <AnimatePresence>
        {menu === 'drawer' && (
          <>
            <motion.button type="button" aria-label="Cerrar menú" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenu(null)} className="fixed inset-0 z-50 bg-stone-900/30 backdrop-blur-[2px]" />
            <motion.nav initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 32, stiffness: 260 }} className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-[380px] flex-col" style={{ background: t.bg, fontFamily: t.font }} aria-label="Menú">
              <div className="flex h-[72px] items-center justify-between border-b px-6" style={{ borderColor: t.line }}>
                <Logo tienda={tienda} diseno={diseno} t={t} />
                <button type="button" aria-label="Cerrar" onClick={() => setMenu(null)} className="flex h-10 w-10 items-center justify-center" style={{ color: t.ink }}><Icon icon="ph:x-light" width={22} /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <button type="button" onClick={() => go(`/tienda/${slug}`)} className="block w-full py-3 text-left text-[22px]" style={{ color: t.ink, fontFamily: t.display }}>{editable(diseno?.esencialNavHome, 'Inicio')}</button>
                <button type="button" onClick={() => go(`/tienda/${slug}/catalogo`)} className="block w-full py-3 text-left text-[22px]" style={{ color: t.ink, fontFamily: t.display }}>{editable(diseno?.esencialNavShop, 'Tienda')}</button>
                {cats.length > 0 && (
                  <div className="mt-4 border-t pt-4" style={{ borderColor: t.line }}>
                    <p className="mb-2 text-[11px] uppercase tracking-[0.18em]" style={{ color: t.muted }}>{editable(diseno?.esencialNavCategories, 'Categorías')}</p>
                    {cats.map((c) => (
                      <button key={c} type="button" onClick={() => go(`/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`)} className="flex w-full items-center justify-between py-2.5 text-left text-[15px]" style={{ color: t.ink }}>
                        {c}<Icon icon="ph:arrow-right-light" width={16} style={{ color: t.muted }} />
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-4 border-t pt-4" style={{ borderColor: t.line }}>
                  <button type="button" onClick={() => go(`/tienda/${slug}/contacto`)} className="block py-2.5 text-[15px]" style={{ color: t.ink }}>{editable(diseno?.esencialNavContact, 'Contacto')}</button>
                  <button type="button" onClick={() => go(`/tienda/${slug}/seguimiento`)} className="block py-2.5 text-[15px]" style={{ color: t.ink }}>Seguimiento de pedido</button>
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function IconBtn({ t, label, icon, onClick, badge = 0, dark = false }: { t: Theme; label: string; icon: string; onClick: () => void; badge?: number; dark?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="relative flex h-11 w-11 items-center justify-center transition-opacity hover:opacity-70" style={{ color: t.ink }}>
      <Icon icon={icon} width={24} />
      {(badge > 0 || dark) && <span className="absolute bottom-1.5 right-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[10px] font-medium" style={dark ? { background: t.ink, color: '#fff' } : { background: t.accent, color: t.onAccent }}>{badge}</span>}
    </button>
  );
}

// ───────────────────────────────────────────────────── Medios de pago ──
/** Medios de pago REALES de la tienda (/payment-config). Carga aislada; si no hay datos, no se muestra nada. */
function PaymentBadges({ slug, t }: { slug: string; t: Theme }) {
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
  return <p className="text-[11.5px]" style={{ color: t.muted }}>Pagos: {items.join(' · ')}</p>;
}

// ─────────────────────────────────────────────────────────────── Footer ──
export function EsenciaFooter({ tienda, slug, diseno, t, categories, navigate }: any) {
  const storeName = storeNameOf(tienda);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const waUrl = buildStorePurchaseWhatsappUrl(waNumber, 'Hola, tengo una consulta.');
  const address = [tienda?.direccion, tienda?.distrito].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  const horario = String(tienda?.horarioAtencion || '').trim();
  const socials = [
    tienda?.instagramUrl ? { icon: 'ph:instagram-logo-light', label: 'Instagram', url: tienda.instagramUrl } : null,
    tienda?.facebookUrl ? { icon: 'ph:facebook-logo-light', label: 'Facebook', url: tienda.facebookUrl } : null,
    tienda?.tiktokUrl ? { icon: 'ph:tiktok-logo-light', label: 'TikTok', url: tienda.tiktokUrl } : null,
    waUrl ? { icon: 'ph:whatsapp-logo-light', label: 'WhatsApp', url: waUrl } : null,
  ].filter(Boolean) as { icon: string; label: string; url: string }[];
  const cats: string[] = (categories || []).slice(0, 7);
  const tagline = optional(diseno?.esencialFooterTagline, 'Pensado para vivirse. Hecho para durar.');
  const intro = String(diseno?.esencialFooterText || tienda?.descripcionTienda || '').trim();
  const cols: { title: string; items: { label: string; to: string }[] }[] = [
    { title: editable(diseno?.esencialFooterCol1, 'Tienda'), items: [{ label: 'Todos los productos', to: `/tienda/${slug}/catalogo` }, ...cats.map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` }))] },
    { title: editable(diseno?.esencialFooterCol2, 'Ayuda'), items: [
      { label: 'Contacto', to: `/tienda/${slug}/contacto` },
      { label: 'Preguntas frecuentes', to: `/tienda/${slug}/contacto#faq` },
      { label: 'Seguimiento de pedido', to: `/tienda/${slug}/seguimiento` },
    ] },
  ];

  return (
    <footer style={{ background: mix(t.ink, 5, t.bg) }}>
      <div className={`mx-auto grid max-w-[1400px] gap-10 px-4 py-14 sm:grid-cols-2 lg:px-8 ${waUrl ? 'lg:grid-cols-[1.4fr_1fr_1fr_1.5fr]' : 'lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]'}`}>
        <div>
          <div className="inline-flex"><Logo tienda={tienda} diseno={diseno} t={t} /></div>
          {tagline && <p className="mt-5 text-[13px]" style={{ color: mix(t.ink, 80, t.bg) }}>{tagline}</p>}
          {intro && <p className="mt-2 max-w-xs whitespace-pre-line text-[12.5px] leading-relaxed" style={{ color: t.muted }}>{intro}</p>}
          {socials.length > 0 && (
            <div className="mt-5 flex gap-3">
              {socials.map((s) => <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="transition-opacity hover:opacity-60" style={{ color: t.ink }}><Icon icon={s.icon} width={21} /></a>)}
            </div>
          )}
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="text-[13.5px] font-medium" style={{ color: t.ink }}>{col.title}</h4>
            <ul className="mt-4 space-y-2 text-[13px]" style={{ color: t.muted }}>
              {col.items.map((it) => <li key={it.label}><button type="button" onClick={() => navigate(it.to)} className="text-left transition-colors hover:text-stone-900">{it.label}</button></li>)}
            </ul>
          </div>
        ))}
        <div>
          {waUrl ? <FooterNewsletter t={t} diseno={diseno} waNumber={waNumber} storeName={storeName} /> : (address || horario) ? (
            <>
              <h4 className="text-[13.5px] font-medium" style={{ color: t.ink }}>Visítanos</h4>
              <ul className="mt-4 space-y-2 text-[13px]" style={{ color: t.muted }}>
                {address && <li>{address}</li>}
                {horario && <li>{horario}</li>}
              </ul>
            </>
          ) : null}
          {waUrl && (address || horario) && <p className="mt-6 text-[12.5px] leading-relaxed" style={{ color: t.muted }}>{[address, horario].filter(Boolean).join(' · ')}</p>}
        </div>
      </div>
      <div className="border-t" style={{ borderColor: t.line }}>
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-5 text-[11.5px] sm:flex-row sm:items-center sm:justify-between lg:px-8" style={{ color: t.muted }}>
          <p>© {new Date().getFullYear()} {storeName}. Todos los derechos reservados.</p>
          <EnlaceLibroReclamaciones slug={slug} diseno={diseno} />
          <PaymentBadges slug={slug} t={t} />
        </div>
      </div>
    </footer>
  );
}

/** "Newsletter" honesto del footer: no hay envío de correos, así que se une por WhatsApp. Estado aislado. */
function FooterNewsletter({ t, diseno, waNumber, storeName }: { t: Theme; diseno: any; waNumber: any; storeName: string }) {
  const [name, setName] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const who = name.trim();
    const url = buildStorePurchaseWhatsappUrl(waNumber, `Hola${who ? `, soy ${who}` : ''}. Quiero recibir las novedades de ${storeName}.`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <>
      <h4 className="text-[13.5px] font-medium" style={{ color: t.ink }}>{editable(diseno?.esencialNewsTitle, 'Novedades')}</h4>
      <p className="mt-3 max-w-xs text-[13px] leading-relaxed" style={{ color: t.muted }}>{editable(diseno?.esencialNewsText, 'Te avisamos por WhatsApp de lo nuevo y de las ofertas.')}</p>
      <form onSubmit={submit} className="mt-4 flex h-11 max-w-sm items-center bg-white pl-4" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={editable(diseno?.esencialNewsPlaceholder, 'Tu nombre')} aria-label="Tu nombre" className="min-w-0 flex-1 appearance-none border-0 bg-transparent bg-none p-0 text-[13px] outline-none placeholder:text-stone-400 focus:ring-0" style={{ color: t.ink }} />
        <button type="submit" aria-label="Unirme por WhatsApp" className="flex h-full w-11 items-center justify-center" style={{ color: t.ink }}><Icon icon="ph:arrow-right-light" width={19} /></button>
      </form>
    </>
  );
}

// ─────────────────────────────────────────────────────────── Product card ──
/**
 * Tarjeta de la referencia: foto sobre gris cálido, nombre y precio debajo. Al pasar el mouse
 * (o siempre en táctil) aparece la compra rápida con cantidad editable. Estado de cantidad aislado aquí.
 */
export function EsenciaProductCard({ producto, slug, t, onOpen, onAdd, showRating = false, compact = false }: { producto: any; slug: string; t: Theme; onOpen: () => void; onAdd: (qty: number) => void; showRating?: boolean; compact?: boolean }) {
  const pricing = getProductPricing(producto);
  const stock = Number(producto?.stock ?? 1);
  const isOut = sinStock(stock);
  const hasVariants = Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const colors = getFashionColors(producto).slice(0, 4);
  const [qty, setQty] = useState(1);
  const badge = isOut ? 'Agotado' : pricing.enOferta ? `-${pricing.porcentajeDescuento}%` : '';

  return (
    <article className="group flex h-full cursor-pointer flex-col" onClick={onOpen}>
      <div className={`relative overflow-hidden ${compact ? 'aspect-square' : 'aspect-[4/5]'}`} style={{ background: t.soft }}>
        {badge && <span className="absolute left-2.5 top-2.5 z-10 bg-white px-2 py-0.5 text-[10.5px] tracking-[0.04em]" style={{ color: isOut ? t.muted : t.ink }}>{badge}</span>}
        <div className="absolute right-2 top-2 z-10 [&_button]:!border-0 [&_button]:!bg-transparent [&_button]:!shadow-none [&_button:nth-child(n+2)]:opacity-0 [&_button]:transition-opacity group-hover:[&_button:nth-child(n+2)]:opacity-100 [@media(hover:none)]:[&_button:nth-child(n+2)]:opacity-100" onClick={(e) => e.stopPropagation()}>
          <ProductCardActions producto={producto} slug={slug} cp={t.ink} />
        </div>
        {producto?.imagenUrl ? (
          <img src={producto.imagenUrl} alt={producto.descripcion} loading="lazy" className={`absolute inset-0 h-full w-full object-contain p-[9%] mix-blend-multiply transition-transform duration-700 group-hover:scale-[1.04] ${isOut ? 'opacity-50 grayscale' : ''}`} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"><Icon icon="ph:t-shirt-light" width={64} style={{ color: mix(t.ink, 25, t.soft) }} /></div>
        )}
        {!compact && (
          <div className="absolute inset-x-2 bottom-2 z-10 flex gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100 [@media(hover:none)]:opacity-100" onClick={(e) => e.stopPropagation()}>
            {!hasVariants && !isOut && (
              <div className="flex h-9 w-[76px] shrink-0 items-center justify-between bg-white px-1">
                <button type="button" aria-label="Restar" onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-8 w-6 items-center justify-center text-[15px]" style={{ color: t.muted }}>−</button>
                <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setQty(d === '' ? 1 : Math.max(1, parseInt(d, 10))); }} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[12.5px] outline-none focus:ring-0" style={{ color: t.ink }} />
                <button type="button" aria-label="Sumar" onClick={() => setQty(qty + 1)} className="flex h-8 w-6 items-center justify-center text-[15px]" style={{ color: t.muted }}>+</button>
              </div>
            )}
            <button
              type="button"
              disabled={isOut}
              onClick={() => { if (isOut) return; if (hasVariants) onOpen(); else onAdd(Math.max(1, qty)); }}
              className="flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 px-2 text-[12px] transition-[filter] hover:brightness-105 disabled:cursor-not-allowed"
              style={isOut ? { background: 'rgba(255,255,255,.85)', color: t.muted } : { background: t.primary, color: t.onPrimary }}
            >
              <span className="truncate">{isOut ? 'Agotado' : hasVariants ? 'Elegir talla y color' : 'Agregar'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="mt-2.5 flex flex-1 flex-col">
        <h3 title={producto?.descripcion} className={`line-clamp-2 leading-snug ${compact ? 'text-[12px]' : 'text-[13.5px]'}`} style={{ color: t.ink }}>{producto?.descripcion}</h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className={compact ? 'text-[12.5px]' : 'text-[13.5px]'} style={{ color: t.ink }}>{esMoney(pricing.precioFinal)}</span>
          {pricing.enOferta && <span className="text-[11.5px] line-through" style={{ color: t.muted }}>{esMoney(pricing.precioRegular)}</span>}
        </div>
        {(showRating || colors.length > 0) && (
          <div className="mt-1 flex items-center gap-2">
            {showRating && <Stars producto={producto} t={t} />}
            {colors.length > 0 && <span className="flex gap-1">{colors.map((c) => <span key={c.name} title={c.name} className="h-2.5 w-2.5 rounded-full" style={{ background: c.hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.15)' }} />)}</span>}
          </div>
        )}
      </div>
    </article>
  );
}
/** Alias con el nombre que usan las páginas compartidas. */
export const EsenciaCard = EsenciaProductCard;

// ─────────────────────────────────────────────────────────────── Cart modal ──
export function EsenciaCartModal({ isOpen, onClose, carrito, actualizarCantidad, onCheckout, t, tienda, diseno }: any) {
  const items: any[] = carrito || [];
  const total = items.reduce((a, it) => a + Number(it.precioUnitario || 0) * Number(it.cantidad || 1), 0);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(waNumber, 'x'));
  const pedirWa = () => {
    if (!items.length) return;
    const detail = items.map((it) => `• ${Number(it.cantidad || 1)} x ${it.descripcion} - ${esMoney(Number(it.precioUnitario || 0) * Number(it.cantidad || 1))}`).join('\n');
    const url = buildStorePurchaseWhatsappUrl(waNumber, `Hola, quiero pedir estos productos en ${storeNameOf(tienda)}:\n\n${detail}\n\nTotal estimado: ${esMoney(total)}`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  const drawerStyle: CSSProperties = { background: t.bg, fontFamily: t.font };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button type="button" aria-label="Cerrar carrito" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-stone-900/30 backdrop-blur-[2px]" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 260 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col shadow-2xl" style={drawerStyle} role="dialog" aria-label="Carrito">
            <header className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: t.line }}>
              <div>
                <h2 className="text-[26px] leading-none" style={{ color: t.ink, fontFamily: t.display }}>Tu bolsa</h2>
                <p className="mt-1.5 text-[12px]" style={{ color: t.muted }}>{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
              </div>
              <button type="button" aria-label="Cerrar" onClick={onClose} className="flex h-10 w-10 items-center justify-center" style={{ color: t.ink }}><Icon icon="ph:x-light" width={22} /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {!items.length ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Icon icon="ph:handbag-simple-light" width={46} style={{ color: t.muted }} />
                  <h3 className="mt-4 text-[24px]" style={{ color: t.ink, fontFamily: t.display }}>Tu bolsa está vacía</h3>
                  <p className="mt-1.5 max-w-[260px] text-[13px]" style={{ color: t.muted }}>Descubre piezas atemporales para tu día a día.</p>
                  <button type="button" onClick={onClose} className={`${btnCls} mt-6 h-11 px-6`} style={{ background: t.primary, color: t.onPrimary }}>Seguir comprando</button>
                </div>
              ) : (
                <ul className="divide-y" style={{ borderColor: t.line }}>
                  {items.map((item) => {
                    const id = item.cartId || item.id;
                    const qty = Number(item.cantidad || 1);
                    const price = Number(item.precioUnitario || 0);
                    return (
                      <li key={id} className="relative grid grid-cols-[76px_1fr] gap-3 py-3.5 first:pt-0" style={{ borderColor: t.line }}>
                        <button type="button" aria-label="Quitar" onClick={() => actualizarCantidad(id, 0)} className="absolute right-0 top-3 flex h-7 w-7 items-center justify-center text-stone-400 transition-colors hover:text-rose-500"><Icon icon="ph:trash-light" width={17} /></button>
                        <div className="flex h-[96px] items-center justify-center overflow-hidden" style={{ background: t.soft }}>
                          {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-1.5 mix-blend-multiply" /> : <Icon icon="ph:t-shirt-light" width={28} style={{ color: t.muted }} />}
                        </div>
                        <div className="min-w-0 pr-8">
                          <h3 className="line-clamp-2 text-[13.5px] leading-snug" style={{ color: t.ink }}>{item.descripcion}</h3>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex h-9 items-center" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                              <button type="button" aria-label="Restar" onClick={() => actualizarCantidad(id, qty - 1)} className="flex w-8 items-center justify-center text-base" style={{ color: t.muted }}>−</button>
                              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); actualizarCantidad(id, d === '' ? 1 : parseInt(d, 10)); }} onFocus={(e) => e.currentTarget.select()} className="w-9 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[13px] outline-none focus:ring-0" style={{ color: t.ink }} />
                              <button type="button" aria-label="Sumar" onClick={() => actualizarCantidad(id, qty + 1)} className="flex w-8 items-center justify-center text-base" style={{ color: t.muted }}>+</button>
                            </div>
                            <span className="text-[14px]" style={{ color: t.ink }}>{esMoney(price * qty)}</span>
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
                  <span className="text-[20px]" style={{ color: t.ink }}>{esMoney(total)}</span>
                </div>
                <p className="mb-4 text-[11.5px]" style={{ color: t.muted }}>El envío se calcula en el checkout según tu forma de entrega.</p>
                <button type="button" onClick={() => { onClose(); onCheckout(); }} className={`${btnCls} h-12 w-full`} style={{ background: t.primary, color: t.onPrimary }}>Ir a pagar <Icon icon="ph:arrow-right-light" width={17} /></button>
                {hasWa && (
                  <button type="button" onClick={pedirWa} className={`${btnCls} mt-2 h-11 w-full bg-white`} style={{ boxShadow: `inset 0 0 0 1px ${t.line}`, color: t.ink }}>
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

