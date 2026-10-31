import { useEffect, useState, type CSSProperties } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { getProductPricing } from '@/templates/shared/pricing';
import { sinStock, pocasUnidades } from '@/templates/shared/ventaSinStock';
import { mediosDisponibles, type MedioPagoValue } from '@/components/tienda/MedioPagoSelector';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { AddedToast, FreeShippingProgress, announceAdded } from './MostradorExtras';
import { mix } from './motion';
import EnlaceLibroReclamaciones from '@/components/tienda/EnlaceLibroReclamaciones';

/**
 * Piezas base de la plantilla Mostrador: tienda de UNA página que arranca en el catálogo.
 * Tema, cabecera, panel de información, tarjeta (con cantidad sincronizada al carrito) y carrito.
 * Regla de la plantilla: nada inventado. Si un dato no existe en la tienda, la UI se oculta.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

export const moMoney = (v: any) => `S/ ${Number(v || 0).toFixed(2)}`;
export const editable = (v: any, fallback: string) => String(v || '').trim() || fallback;
export const storeNameOf = (tienda: any, fallback = 'Mi tienda') => tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || fallback;
export const nameOf = (v: any): string => (v && typeof v === 'object' ? v.nombre || v.descripcion || '' : typeof v === 'string' ? v : '');
export const isOn = (v: any) => v === true || v === 'true' || v === '1';
export const isLive = (slug?: string) => Boolean(slug) && slug !== 'preview';

/** Luminancia relativa (0–1) de un hex; null si no es un hex válido. */
function luminance(color: string): number | null {
  let hex = String(color || '').trim().replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const lin = (i: number) => { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(0) + 0.7152 * lin(2) + 0.0722 * lin(4);
}
const INK = '#1F2328';
/** Texto sobre un color: el que dé MÁS contraste WCAG (blanco vs tinta). */
function onColor(bg: string): string {
  const L = luminance(bg);
  if (L === null) return '#FFFFFF';
  return (L + 0.05) / ((luminance(INK) ?? 0.016) + 0.05) > 1.05 / (L + 0.05) ? INK : '#FFFFFF';
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

// ── Design tokens: naranja de la referencia sobre gris claro; Plus Jakarta Sans ──
export function mostradorTheme(diseno: any) {
  const primary = pick(diseno?.colorPrimario, SCHEMA_DEFAULTS.primary, '#F0782E'); // naranja (cabecera, botones, activo)
  const accent = pick(diseno?.colorAccento, SCHEMA_DEFAULTS.accent, '#E5484D');    // rojo suave (ofertas, contadores)
  const rawBg = pick(diseno?.colorSecundario, SCHEMA_DEFAULTS.bg, '#F4F5F7');       // gris claro del lienzo
  const bgLum = luminance(rawBg);
  const bg = bgLum !== null && bgLum < 0.78 ? mix(rawBg, 8, '#FFFFFF') : rawBg;
  const pl = luminance(primary);
  const al = luminance(accent);
  const onPrimary = textoBoton(diseno) ?? onColor(primary);
  return {
    primary,
    accent,
    primaryInk: pl !== null && pl > 0.3 ? mix(primary, 62, INK) : primary,
    accentInk: al !== null && al > 0.36 ? mix(accent, 55, INK) : accent,
    bg,
    ink: INK,
    muted: '#6B7280',
    line: mix(INK, 9, '#FFFFFF'),
    surface: '#FFFFFF',
    soft: mix(primary, 10, '#FFFFFF'),
    softer: mix(primary, 5, '#FFFFFF'),
    blush: mix(primary, 16, '#FFFFFF'),
    accentSoft: mix(accent, 12, '#FFFFFF'),
    card: '#F7F7F8',
    /** Banda de la cabecera: degradado de la marca, como la referencia. */
    band: `linear-gradient(120deg, ${primary} 0%, ${mix(primary, 72, '#FFD9B8')} 55%, ${mix(primary, 45, '#FFF1E4')} 100%)`,
    onPrimary,
    onAccent: textoBoton(diseno) ?? onColor(accent),
    onBand: onColor(primary),
    star: '#F2A93B',
    font: `'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif`,
    serif: `'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif`,
  };
}
export type Theme = ReturnType<typeof mostradorTheme>;

/** Inyecta Plus Jakarta Sans una sola vez. */
export function useMostradorFont() {
  useEffect(() => {
    const id = 'mostrador-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  }, []);
}

export const btnCls = 'inline-flex items-center justify-center gap-2 rounded-xl text-[13.5px] font-semibold transition-[filter,transform] hover:brightness-105 active:scale-[0.98]';
export const primaryBtn = (t: Theme): CSSProperties => ({ background: t.primary, color: t.onPrimary });

/** Placeholder para productos sin foto. */
export function NoPhoto({ t, size = 40 }: { t: Theme; size?: number }) {
  return <span className="flex h-full w-full items-center justify-center" style={{ background: t.card }}><Icon icon="solar:gallery-wide-linear" width={size} style={{ color: mix(t.ink, 22, '#fff') }} /></span>;
}

export function Logo({ tienda, diseno, t, onClick, light = true }: { tienda: any; diseno: any; t: Theme; onClick?: () => void; light?: boolean }) {
  const name = editable(diseno?.mostradorLogoText, storeNameOf(tienda));
  const color = light ? t.onBand : t.ink;
  const content = (
    <span className="flex items-center gap-2.5">
      {tienda?.logo
        ? <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-1 shadow-sm"><img src={tienda.logo} alt="" className="h-full w-full object-contain" /></span>
        : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90" style={{ color: t.primaryInk }}><Icon icon="solar:shop-2-bold" width={20} /></span>}
      {!isOn(diseno?.mostradorLogoNameHidden) && <span className="max-w-[38vw] truncate text-[18px] font-extrabold sm:max-w-[420px] sm:text-[22px] tracking-[-0.01em]" style={{ color }}>{name}</span>}
    </span>
  );
  return onClick ? <button type="button" onClick={onClick} aria-label={name} className="flex shrink-0 items-center">{content}</button> : <div className="flex shrink-0 items-center">{content}</div>;
}

// ─────────────────────────────────────────────────────── Beneficios reales ──
export type Service = { icon: string; label: string; sub: string };
export function buildServices(tienda: any, hasWhatsapp = false): Service[] {
  const s: Service[] = [];
  const envio = Number(tienda?.costoEnvioFijo || 0);
  if (tienda?.aceptaEnvio !== false) s.push({ icon: 'solar:delivery-linear', label: 'Envío a domicilio', sub: envio > 0 ? `Desde ${moMoney(envio)}` : 'Costo al finalizar tu compra' });
  if (tienda?.aceptaRecojo) {
    const min = Number(tienda?.tiempoPreparacionMin || 0);
    s.push({ icon: 'solar:shop-2-linear', label: 'Recojo en tienda', sub: min > 0 ? `Listo en ~${min} min` : 'Sin costo de envío' });
  }
  if (hasWhatsapp) s.push({ icon: 'solar:chat-round-like-linear', label: 'Atención por WhatsApp', sub: 'Resolvemos tus dudas' });
  s.push({ icon: 'solar:shield-check-linear', label: 'Compra segura', sub: 'Confirmas antes de pagar' });
  return s;
}

/** Canales de contacto REALES de la tienda. Campo vacío → null (la UI lo oculta). */
export function storeChannels(tienda: any, diseno?: any) {
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const wa = (msg = '') => buildStorePurchaseWhatsappUrl(waNumber, msg);
  const hasWhatsapp = Boolean(wa('Hola'));
  const address = [tienda?.direccion, tienda?.distrito, tienda?.provincia].map((v) => String(v || '').trim()).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  const socials = [
    tienda?.facebookUrl ? { icon: 'ic:baseline-facebook', label: 'Facebook', url: tienda.facebookUrl } : null,
    tienda?.instagramUrl ? { icon: 'mdi:instagram', label: 'Instagram', url: tienda.instagramUrl } : null,
    tienda?.tiktokUrl ? { icon: 'ic:baseline-tiktok', label: 'TikTok', url: tienda.tiktokUrl } : null,
  ].filter(Boolean) as { icon: string; label: string; url: string }[];
  return {
    wa,
    hasWhatsapp,
    address: address || null,
    mapsUrl: address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null,
    horario: String(tienda?.horarioAtencion || '').trim() || null,
    socials,
  };
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
function PaymentChips({ slug, t }: { slug: string; t: Theme }) {
  const [medios, setMedios] = useState<MedioPagoValue[]>([]);
  useEffect(() => {
    if (!isLive(slug)) { setMedios([]); return; }
    let alive = true;
    axios.get(`${BASE_URL}/public/store/${slug}/payment-config`)
      .then((r) => { if (alive) setMedios(mediosDisponibles(r.data?.data || r.data)); })
      .catch(() => { if (alive) setMedios([]); });
    return () => { alive = false; };
  }, [slug]);
  if (!medios.length) return null;
  return (
    <div>
      <p className="text-[11.5px] font-bold uppercase tracking-[0.12em]" style={{ color: t.muted }}>Medios de pago</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {medios.map((m) => {
          const meta = PAY_META[m];
          return (
            <span key={m} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-2.5 text-[12px] font-semibold" style={{ color: t.ink, boxShadow: `inset 0 0 0 1px ${t.line}` }}>
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-[5px] px-1 text-[9px] font-black text-white" style={{ background: meta.bg }}>{meta.mark ?? <Icon icon={meta.icon!} width={12} />}</span>
              {meta.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────── Cabecera ──
/**
 * Banda superior con el degradado de la marca (como la referencia): logo + nombre, información,
 * seguimiento y carrito. La tienda es de una sola página: no hay menú de secciones.
 * Estado propio (panel de información) aislado aquí.
 */
/** Pie mínimo de Mostrador: nombre, seguimiento y el Libro de Reclamaciones. */
export function MostradorFooter({ tienda, slug, diseno, t }: { tienda: any; slug: string; diseno: any; t: Theme }) {
  const navigate = useNavigate();
  const live = isLive(slug);
  return (
    <footer className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 pb-8 text-center text-[12px]" style={{ color: t.muted }}>
      <span>© {new Date().getFullYear()} {storeNameOf(tienda)}</span>
      {live && <> · <button type="button" onClick={() => navigate(`/tienda/${slug}/seguimiento`)} className="underline underline-offset-2">Seguir mi pedido</button></>}
      <span aria-hidden="true"> · </span>
      <EnlaceLibroReclamaciones slug={slug} diseno={diseno} iconSize={16} />
    </footer>
  );
}

export function MostradorHeader({ tienda, slug, diseno, t, cartCount, onOpenCart, navigate }: any) {
  const [info, setInfo] = useState(false);
  const ch = storeChannels(tienda, diseno);
  const services = buildServices(tienda, ch.hasWhatsapp);
  const description = String(diseno?.mostradorInfoText || tienda?.descripcionTienda || '').trim();
  const iconBtn = 'relative flex h-10 items-center gap-2 rounded-full px-2.5 text-[13px] font-semibold transition-colors hover:bg-white/15 sm:px-3';

  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[150px] overflow-hidden" style={{ background: t.band }}>
        <span className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-white/10" />
        <span className="absolute left-1/3 -top-40 h-72 w-72 rounded-full bg-white/[0.07]" />
      </div>
      <header className="relative z-20 mx-auto flex h-[68px] max-w-[1400px] items-center justify-between gap-3 px-4 lg:px-6">
        <Logo tienda={tienda} diseno={diseno} t={t} onClick={() => navigate(`/tienda/${slug}/catalogo`)} />
        <div className="flex items-center gap-1" style={{ color: t.onBand }}>
          <button type="button" onClick={() => setInfo(true)} className={iconBtn} aria-label="Información de la tienda">
            <Icon icon="solar:info-circle-linear" width={21} /><span className="hidden sm:inline">{editable(diseno?.mostradorInfoLabel, 'Información')}</span>
          </button>
          <button type="button" onClick={() => navigate(`/tienda/${slug}/seguimiento`)} className={`${iconBtn} hidden sm:flex`} aria-label="Seguir mi pedido">
            <Icon icon="solar:map-arrow-square-linear" width={21} /><span className="hidden md:inline">Mi pedido</span>
          </button>
          <button type="button" onClick={onOpenCart} className="relative ml-1 flex h-10 items-center gap-2 rounded-full bg-white px-3.5 text-[13px] font-bold shadow-sm" style={{ color: t.ink }} aria-label={`Carrito (${cartCount})`}>
            <Icon icon="solar:cart-large-2-linear" width={19} style={{ color: t.primaryInk }} />
            <span className="tabular-nums">{cartCount}</span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {info && (
          <>
            <motion.button type="button" aria-label="Cerrar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInfo(false)} className="fixed inset-0 z-50 bg-stone-900/35 backdrop-blur-[2px]" />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 32, stiffness: 280 }} className="fixed inset-y-0 left-0 z-50 flex w-[88%] max-w-[400px] flex-col bg-white" style={{ fontFamily: t.font }} role="dialog" aria-label="Información de la tienda">
              <div className="relative overflow-hidden px-6 pb-6 pt-5" style={{ background: t.band }}>
                <button type="button" aria-label="Cerrar" onClick={() => setInfo(false)} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/20" style={{ color: t.onBand }}><Icon icon="solar:close-circle-linear" width={20} /></button>
                <Logo tienda={tienda} diseno={diseno} t={t} />
                {description && <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed" style={{ color: t.onBand, opacity: 0.9 }}>{description}</p>}
              </div>
              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                <ul className="space-y-2.5">
                  {services.map((s) => (
                    <li key={s.label} className="flex items-center gap-3 rounded-xl p-3" style={{ background: t.softer }}>
                      <Icon icon={s.icon} width={22} style={{ color: t.primaryInk }} />
                      <span className="text-[13px]"><span className="font-bold" style={{ color: t.ink }}>{s.label}</span> <span style={{ color: t.muted }}>· {s.sub}</span></span>
                    </li>
                  ))}
                </ul>
                {(ch.address || ch.horario) && (
                  <ul className="space-y-2.5 text-[13px]" style={{ color: t.ink }}>
                    {ch.address && <li className="flex gap-2.5"><Icon icon="solar:map-point-linear" width={18} className="mt-0.5 shrink-0" style={{ color: t.primaryInk }} /><span>{ch.address}{ch.mapsUrl && <> · <a href={ch.mapsUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2" style={{ color: t.primaryInk }}>Cómo llegar</a></>}</span></li>}
                    {ch.horario && <li className="flex gap-2.5"><Icon icon="solar:clock-circle-linear" width={18} className="mt-0.5 shrink-0" style={{ color: t.primaryInk }} />{ch.horario}</li>}
                  </ul>
                )}
                <PaymentChips slug={slug} t={t} />
                <button type="button" onClick={() => { setInfo(false); navigate(`/tienda/${slug}/seguimiento`); }} className="flex w-full items-center gap-3 rounded-xl p-3 text-left text-[13px] font-semibold" style={{ boxShadow: `inset 0 0 0 1px ${t.line}`, color: t.ink }}>
                  <Icon icon="solar:map-arrow-square-linear" width={20} style={{ color: t.primaryInk }} />Seguir mi pedido<Icon icon="solar:alt-arrow-right-linear" width={15} className="ml-auto" style={{ color: t.muted }} />
                </button>
                {ch.socials.length > 0 && (
                  <div className="flex gap-2">
                    {ch.socials.map((s) => <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: t.softer, color: t.ink }}><Icon icon={s.icon} width={19} /></a>)}
                  </div>
                )}
              </div>
              {ch.hasWhatsapp && (
                <div className="border-t p-5" style={{ borderColor: t.line }}>
                  <a href={ch.wa('Hola, tengo una consulta.') || '#'} target="_blank" rel="noopener noreferrer" className={`${btnCls} h-12 w-full`} style={{ background: '#1FA855', color: '#fff' }}><Icon icon="ic:baseline-whatsapp" width={19} />Escríbenos por WhatsApp</a>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <AddedToast t={t} onOpenCart={onOpenCart} />
    </>
  );
}

// ─────────────────────────────────────────────────────── Tarjeta ──
/**
 * Tarjeta de la referencia: foto, código, nombre, precio y "+". Cuando el producto ya está en el carrito,
 * el "+" se vuelve un selector − n + que edita la línea real del carrito (sin abrir nada).
 * Con variantes, el "+" abre la vista rápida para elegir la opción.
 */
export function MostradorProductCard({ producto, t, inCart, onOpen, onAdd, onSetQty }: { producto: any; t: Theme; inCart: number; onOpen: () => void; onAdd: () => void; onSetQty: (qty: number) => void }) {
  const pricing = getProductPricing(producto);
  const stock = Number(producto?.stock ?? 1);
  const isOut = sinStock(stock);
  const hasVariants = Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const [broken, setBroken] = useState(false);
  const [text, setText] = useState(String(inCart));
  useEffect(() => setText(String(inCart)), [inCart]);
  const code = String(producto?.codigo || '').trim();

  return (
    <article className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-white transition-shadow duration-300 hover:shadow-[0_18px_40px_-26px_rgba(31,35,40,0.45)]" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }} onClick={onOpen}>
      <div className="relative aspect-square overflow-hidden" style={{ background: t.card }}>
        <div className="absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
          {pricing.enOferta && <span className="rounded-md px-1.5 py-0.5 text-[11px] font-extrabold" style={{ background: t.accent, color: t.onAccent }}>-{pricing.porcentajeDescuento}%</span>}
          {isOut ? <span className="rounded-md bg-stone-800 px-1.5 py-0.5 text-[10.5px] font-bold text-white">Agotado</span>
            : !hasVariants && pocasUnidades(stock) ? <span className="rounded-md bg-white/95 px-1.5 py-0.5 text-[10.5px] font-bold shadow-sm" style={{ color: t.accentInk }}>Quedan {stock}</span> : null}
        </div>
        {producto?.imagenUrl && !broken
          ? <img src={producto.imagenUrl} alt={producto.descripcion} loading="lazy" onError={() => setBroken(true)} className={`h-full w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.04] ${isOut ? 'opacity-50 grayscale' : ''}`} />
          : <NoPhoto t={t} />}
      </div>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
        {code && <p className="truncate text-[11.5px] font-medium" style={{ color: t.muted }}>{code}</p>}
        <h3 title={producto?.descripcion} className="mt-0.5 line-clamp-2 text-[13.5px] font-semibold leading-snug" style={{ color: t.ink }}>{producto?.descripcion}</h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2.5" onClick={(e) => e.stopPropagation()}>
          <div className="min-w-0 leading-tight">
            <span className="block text-[15px] font-extrabold" style={{ color: t.ink }}>{moMoney(pricing.precioFinal)}</span>
            {pricing.enOferta && <span className="block text-[11px] line-through" style={{ color: t.muted }}>{moMoney(pricing.precioRegular)}</span>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" aria-label="Vista rápida" title="Vista rápida" onClick={onOpen} className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/[0.05]" style={{ color: t.primaryInk }}><Icon icon="solar:eye-linear" width={18} /></button>
            {inCart > 0 && !hasVariants ? (
              <div className="flex h-8 items-center rounded-full" style={{ background: t.soft }}>
                <button type="button" aria-label="Restar" onClick={() => onSetQty(inCart - 1)} className="flex h-8 w-7 items-center justify-center text-[16px] font-bold" style={{ color: t.primaryInk }}>−</button>
                <input type="text" inputMode="numeric" aria-label="Cantidad en el carrito" value={text} onChange={(e) => setText(e.target.value.replace(/\D/g, ''))} onBlur={() => { const n = parseInt(text || '0', 10) || 0; onSetQty(n); }} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} onFocus={(e) => e.currentTarget.select()} className="w-8 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[13px] font-extrabold outline-none focus:ring-0" style={{ color: t.ink }} />
                <button type="button" aria-label="Sumar" onClick={() => onSetQty(inCart + 1)} className="flex h-8 w-7 items-center justify-center text-[16px] font-bold" style={{ color: t.primaryInk }}>+</button>
              </div>
            ) : (
              <button type="button" disabled={isOut} aria-label={hasVariants ? 'Elegir opción' : 'Agregar al carrito'} title={hasVariants ? 'Elegir opción' : 'Agregar al carrito'} onClick={() => { if (isOut) return; if (hasVariants) { onOpen(); return; } onAdd(); announceAdded(producto, 1); }} className="flex h-8 w-8 items-center justify-center rounded-full transition-[filter,transform] hover:brightness-105 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40" style={{ background: t.soft, color: t.primaryInk }}>
                <Icon icon={hasVariants ? 'solar:tuning-2-linear' : 'solar:add-circle-linear'} width={hasVariants ? 16 : 20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────── Carrito ──
export function MostradorCartModal({ isOpen, onClose, carrito, actualizarCantidad, onCheckout, t, tienda, diseno }: any) {
  const { slug = '' } = useParams();
  const items: any[] = carrito || [];
  const total = items.reduce((a, it) => a + Number(it.precioUnitario || 0) * Number(it.cantidad || 1), 0);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(waNumber, 'x'));
  const pedirWa = () => {
    if (!items.length) return;
    const detail = items.map((it) => `• ${Number(it.cantidad || 1)} x ${it.codigo ? `[${it.codigo}] ` : ''}${it.descripcion} - ${moMoney(Number(it.precioUnitario || 0) * Number(it.cantidad || 1))}`).join('\n');
    const url = buildStorePurchaseWhatsappUrl(waNumber, `Hola, quiero pedir estos productos en ${storeNameOf(tienda)}:\n\n${detail}\n\nTotal estimado: ${moMoney(total)}`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button type="button" aria-label="Cerrar carrito" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-stone-900/35 backdrop-blur-[2px]" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 280 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col shadow-2xl" style={{ background: t.bg, fontFamily: t.font }} role="dialog" aria-label="Carrito">
            <header className="flex items-center justify-between border-b bg-white px-6 py-5" style={{ borderColor: t.line }}>
              <div>
                <h2 className="text-[20px] font-extrabold" style={{ color: t.ink }}>Tu carrito</h2>
                <p className="mt-0.5 text-[12.5px]" style={{ color: t.muted }}>{items.length} {items.length === 1 ? 'producto' : 'productos'} · {items.reduce((s, it) => s + Number(it.cantidad || 1), 0)} unidades</p>
              </div>
              <button type="button" aria-label="Cerrar" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/[0.05]" style={{ color: t.ink }}><Icon icon="solar:close-circle-linear" width={22} /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {!items.length ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: t.soft, color: t.primaryInk }}><Icon icon="solar:cart-large-2-linear" width={36} /></span>
                  <h3 className="mt-5 text-[18px] font-extrabold" style={{ color: t.ink }}>Tu carrito está vacío</h3>
                  <p className="mt-1.5 max-w-[260px] text-[13px]" style={{ color: t.muted }}>Toca "+" en cualquier producto para agregarlo.</p>
                  <button type="button" onClick={onClose} className={`${btnCls} mt-6 h-11 px-6`} style={primaryBtn(t)}>Seguir comprando</button>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {items.map((item) => {
                    const id = item.cartId || item.id;
                    const qty = Number(item.cantidad || 1);
                    const price = Number(item.precioUnitario || 0);
                    return (
                      <li key={id} className="relative grid grid-cols-[68px_1fr] gap-3 rounded-2xl bg-white p-3" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                        <button type="button" aria-label="Quitar" onClick={() => actualizarCantidad(id, 0)} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-500"><Icon icon="solar:trash-bin-minimalistic-linear" width={16} /></button>
                        <div className="h-[68px] overflow-hidden rounded-xl" style={{ background: t.card }}>
                          {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain mix-blend-multiply" /> : <NoPhoto t={t} size={24} />}
                        </div>
                        <div className="min-w-0 pr-7">
                          {item.codigo && <p className="truncate text-[11px]" style={{ color: t.muted }}>{item.codigo}</p>}
                          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug" style={{ color: t.ink }}>{item.descripcion}</h3>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex h-8 items-center overflow-hidden rounded-full" style={{ background: t.soft }}>
                              <button type="button" aria-label="Restar" onClick={() => actualizarCantidad(id, qty - 1)} className="flex w-8 items-center justify-center font-bold" style={{ color: t.primaryInk }}>−</button>
                              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); actualizarCantidad(id, d === '' ? 1 : parseInt(d, 10)); }} onFocus={(e) => e.currentTarget.select()} className="w-9 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[13px] font-extrabold outline-none focus:ring-0" style={{ color: t.ink }} />
                              <button type="button" aria-label="Sumar" onClick={() => actualizarCantidad(id, qty + 1)} className="flex w-8 items-center justify-center font-bold" style={{ color: t.primaryInk }}>+</button>
                            </div>
                            <span className="text-[14px] font-extrabold" style={{ color: t.ink }}>{moMoney(price * qty)}</span>
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
                  <span className="text-[22px] font-extrabold" style={{ color: t.ink }}>{moMoney(total)}</span>
                </div>
                <p className="mb-3 text-[11.5px]" style={{ color: t.muted }}>El envío se calcula al finalizar según tu forma de entrega.</p>
                <FreeShippingProgress t={t} slug={slug} subtotal={total} />
                <button type="button" onClick={() => { onClose(); onCheckout(); }} className={`${btnCls} h-12 w-full`} style={primaryBtn(t)}>
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

