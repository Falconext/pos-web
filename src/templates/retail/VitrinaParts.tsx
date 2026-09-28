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
import { AddedToast, FreeShippingProgress, SearchBox, announceAdded } from './VitrinaExtras';
import { mix } from './motion';

/**
 * Piezas base de la plantilla Retail (Vitrina): tema, header, footer, tarjeta y carrito.
 * Regla de la plantilla: nada inventado. Si un dato no existe en la tienda, la UI se oculta.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

export const vtMoney = (v: any) => `S/ ${Number(v || 0).toFixed(2)}`;
export const editable = (v: any, fallback: string) => String(v || '').trim() || fallback;
export const storeNameOf = (tienda: any, fallback = 'Vitrina') => tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || fallback;
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
export const RETAIL_IMG = {
  hero: [u('1483985988355-763728e1935b', 1600), u('1556228453-efd6c1ff04f6', 1600), u('1558769132-cb1aea458c5e', 1600)],
  promo: [u('1573855619003-97b4799dcd8b', 900), u('1586023492125-27b2c045efd7', 900), u('1513201099705-a9746e1e201f', 900)],
  catalog: u('1558769132-cb1aea458c5e', 1400),
  contact: u('1556742049-0cfed4f6a45d', 1400),
};

const INK = '#1B1D1C';
/** Texto sobre un color: el que dé MÁS contraste WCAG (blanco vs tinta). Evita blanco sobre amarillos/pasteles. */
function onColor(bg: string): string {
  const L = luminance(bg);
  if (L === null) return '#FFFFFF';
  const vsWhite = 1.05 / (L + 0.05);
  const vsInk = (L + 0.05) / ((luminance(INK) ?? 0.012) + 0.05);
  return vsInk > vsWhite ? INK : '#FFFFFF';
}
/** Valores por defecto del schema (DisenoRubro): no son una elección de marca → se usan los de la plantilla. */
const SCHEMA_DEFAULTS = { primary: '#6A6CFF', bg: '#FFFFFF', accent: '#FF6B6B' };
const pick = (raw: any, schemaDefault: string, fallback: string) => {
  const v = String(raw || '').trim();
  return !v || v.toUpperCase() === schemaDefault ? fallback : v;
};

// ── Design tokens: teal + naranja + crema de la referencia; DM Serif Display + Nunito Sans (design system) ──
export function vitrinaTheme(diseno: any) {
  const primary = pick(diseno?.colorPrimario, SCHEMA_DEFAULTS.primary, '#1F5E5B'); // teal (botones, logo, enlaces)
  const accent = pick(diseno?.colorAccento, SCHEMA_DEFAULTS.accent, '#E4703C');    // naranja (destacados, badges, contadores)
  const rawBg = pick(diseno?.colorSecundario, SCHEMA_DEFAULTS.bg, '#FBF7F1');       // crema cálida
  const bgLum = luminance(rawBg);
  const bg = bgLum !== null && bgLum < 0.78 ? mix(rawBg, 7, '#FFFFFF') : rawBg;
  const pl = luminance(primary);
  const al = luminance(accent);
  return {
    primary,
    accent,
    /** Principal/acento como texto sobre fondo claro: si son muy claros (ej. amarillo), se oscurecen hacia la tinta. */
    primaryInk: pl !== null && pl > 0.32 ? mix(primary, 45, INK) : primary,
    accentInk: al !== null && al > 0.4 ? mix(accent, 50, INK) : accent,
    bg,
    ink: INK,
    muted: '#6E6A64',
    line: mix(INK, 9, bg),
    surface: '#FFFFFF',
    /** Tintes de marca para bandas y fondos suaves. */
    soft: mix(primary, 7, bg),
    softer: mix(primary, 4, '#FFFFFF'),
    accentSoft: mix(accent, 14, '#FFFFFF'),
    /** Fondo de las fotos de producto (blanco puro para mix-blend-multiply). */
    card: '#FFFFFF',
    onPrimary: onColor(primary),
    onAccent: onColor(accent),
    star: '#F2A93B',
    font: `'Nunito Sans', 'Segoe UI', system-ui, sans-serif`,
    serif: `'DM Serif Display', Georgia, 'Times New Roman', serif`,
  };
}
export type Theme = ReturnType<typeof vitrinaTheme>;

/** Inyecta Nunito Sans + DM Serif Display una sola vez. */
export function useVitrinaFont() {
  useEffect(() => {
    const id = 'vitrina-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Nunito+Sans:opsz,wght@6..12,400;6..12,500;6..12,600;6..12,700;6..12,800;6..12,900&family=DM+Serif+Display&display=swap';
    document.head.appendChild(link);
  }, []);
}

/** Botón de la referencia (esquinas suaves, peso fuerte). */
export const btnCls = 'inline-flex items-center justify-center gap-2 rounded-xl text-[13.5px] font-bold transition-[filter,transform] hover:brightness-110 active:scale-[0.98]';

/** Estrellas reales (una estrella + promedio + conteo, como la referencia). Sin reseñas → nada. */
export function Rating({ producto, t, size = 12 }: { producto: any; t: Theme; size?: number }) {
  const rating = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const count = Number(producto?.ratingCount || producto?.reviewsCount || 0);
  if (!(rating > 0 && count > 0)) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold" aria-label={`${rating.toFixed(1)} de 5 (${count} reseñas)`}>
      <Icon icon="solar:star-bold" width={size} style={{ color: t.star }} />
      <span style={{ color: t.ink }}>{rating.toFixed(1)}</span>
      <span style={{ color: t.muted }}>({count})</span>
    </span>
  );
}

/** Ícono por palabra clave de la categoría (solo decorativo; la categoría es la real). */
export function categoryIcon(name: string): string {
  const n = String(name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (/ropa|polo|polera|camis|vestid|pantal|moda|textil|casaca/.test(n)) return 'ph:t-shirt-light';
  if (/tecno|audio|audif|parlant|celular|comput|gadget|electr|mouse|cargad|cable/.test(n)) return 'ph:headphones-light';
  if (/hogar|casa|mueble|deco|cocina|bano|cama|sala/.test(n)) return 'ph:armchair-light';
  if (/belleza|cosmet|maquill|perfum|cuidado|skin/.test(n)) return 'ph:drop-half-bottom-light';
  if (/accesor|bolso|cartera|mochila|billet/.test(n)) return 'ph:handbag-light';
  if (/calzad|zapat|zapatill/.test(n)) return 'ph:sneaker-light';
  if (/juguet|rompecab|juego|nino/.test(n)) return 'ph:puzzle-piece-light';
  if (/regalo|detalle|personaliz/.test(n)) return 'ph:gift-light';
  if (/taza|tomatodo|botella|termo|vaso/.test(n)) return 'ph:coffee-light';
  if (/imprent|papel|libre|utiles|afiche|banner|foto/.test(n)) return 'ph:printer-light';
  if (/deport|fitness|gym/.test(n)) return 'ph:barbell-light';
  if (/aliment|comida|abarrot|snack|bebida/.test(n)) return 'ph:basket-light';
  return 'ph:shopping-bag-open-light';
}

/** Placeholder para productos sin foto: ícono de su categoría sobre tinte suave. */
export function NoPhoto({ t, producto, size = 44 }: { t: Theme; producto?: any; size?: number }) {
  return (
    <span className="flex h-full w-full items-center justify-center" style={{ background: t.softer }}>
      <Icon icon={categoryIcon(nameOf(producto?.categoria) || producto?.descripcion)} width={size} style={{ color: mix(t.primaryInk, 45, '#fff') }} />
    </span>
  );
}

export function Logo({ tienda, diseno, t, onClick, light = false }: { tienda: any; diseno: any; t: Theme; onClick?: () => void; light?: boolean }) {
  const name = editable(diseno?.retailLogoText, storeNameOf(tienda));
  const content = tienda?.logo ? (
    <img src={tienda.logo} alt={name} className="h-10 w-auto max-w-[170px] object-contain" />
  ) : (
    <span className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: light ? 'rgba(255,255,255,.15)' : t.primary, color: light ? '#fff' : t.onPrimary }}><Icon icon="solar:bag-4-bold" width={18} /></span>
      <span className="max-w-[200px] truncate text-[22px] font-extrabold tracking-[-0.02em]" style={{ color: light ? '#fff' : t.ink }}>{name}</span>
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
  if (tienda?.aceptaEnvio !== false) s.push({ icon: 'solar:delivery-linear', label: 'Envío a domicilio', sub: envio > 0 ? `Desde ${vtMoney(envio)}` : 'Costo al finalizar tu compra' });
  if (tienda?.aceptaRecojo) {
    const min = Number(tienda?.tiempoPreparacionMin || 0);
    s.push({ icon: 'solar:shop-2-linear', label: 'Recojo en tienda', sub: min > 0 ? `Listo en ~${min} min` : 'Sin costo de envío' });
  }
  s.push({ icon: 'solar:shield-check-linear', label: 'Compra segura', sub: 'Confirmas antes de pagar' });
  if (hasWhatsapp) s.push({ icon: 'solar:headphones-round-linear', label: 'Atención directa', sub: 'Te respondemos por WhatsApp' });
  s.push({ icon: 'solar:map-arrow-square-linear', label: 'Seguimiento', sub: 'Código para tu pedido' });
  return s.slice(0, 4);
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
export function PaymentMethods({ slug, t }: { slug: string; t: Theme }) {
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
      <h4 className="text-[13.5px] font-extrabold" style={{ color: t.ink }}>Medios de pago</h4>
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

// ─────────────────────────────────────────────────────────────── Header ──
/**
 * Header de la referencia: menú (categorías), logo, buscador central, favoritos y carrito con contador.
 * Estado propio (búsqueda, cajón de categorías) aislado aquí.
 */
export function VitrinaHeader({ tienda, slug, diseno, categories, t, cartCount, favCount, onOpenCart, onOpenFav, navigate, active, activeCategory, hideCatBar = false }: any) {
  const [drawer, setDrawer] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const cats: string[] = categories || [];
  const go = (to: string) => { setDrawer(false); navigate(to); };
  const catUrl = (c: string) => `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`;
  const placeholder = editable(diseno?.retailSearchPlaceholder, 'Busca productos, marcas y más…');
  const barCats = hideCatBar || isOn(diseno?.retailCatBarHidden) ? [] : cats.slice(0, 9);

  // Sombra del header al bajar (estado propio del header; no toca la página).
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const search = (cls: string) => (
    <SearchBox t={t} slug={slug} placeholder={placeholder} className={cls} onSearch={(v) => go(`/tienda/${slug}/catalogo${v ? `?search=${encodeURIComponent(v)}` : ''}`)} onOpenProduct={(p) => go(`/tienda/${slug}/producto/${p.id}`)} />
  );

  const drawerLink = (label: string, to: string, isActive: boolean, icon?: string) => (
    <button key={`${label}-${to}`} type="button" onClick={() => go(to)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[14.5px] font-bold transition-colors hover:bg-black/[0.04]" style={{ color: isActive ? t.primaryInk : t.ink, background: isActive ? t.soft : undefined }}>
      {icon && <Icon icon={icon} width={20} style={{ color: t.primaryInk }} />}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <Icon icon="solar:alt-arrow-right-linear" width={15} style={{ color: t.muted }} />
    </button>
  );

  return (
    <>
      <header className="sticky top-0 z-30 border-b backdrop-blur-md transition-shadow duration-300" style={{ borderColor: t.line, background: mix(t.bg, 92, 'transparent'), boxShadow: scrolled ? '0 12px 30px -24px rgba(27,29,28,0.55)' : 'none' }}>
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center gap-3 px-4 lg:gap-6 lg:px-8">
          <button type="button" aria-label="Categorías" onClick={() => setDrawer(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-black/[0.04]" style={{ color: t.ink }}><Icon icon="solar:hamburger-menu-linear" width={24} /></button>
          <Logo tienda={tienda} diseno={diseno} t={t} onClick={() => go(`/tienda/${slug}`)} />
          {search('mx-auto hidden w-full max-w-[520px] md:flex')}
          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <IconBtn t={t} label="Favoritos" icon="solar:heart-linear" onClick={onOpenFav} badge={favCount} />
            <IconBtn t={t} label="Carrito" icon="solar:cart-large-2-linear" onClick={onOpenCart} badge={cartCount} />
          </div>
        </div>
        <div className="px-4 pb-3 md:hidden">{search('w-full')}</div>
        {barCats.length > 0 && (
          <nav aria-label="Categorías" className="hidden border-t lg:block" style={{ borderColor: t.line }}>
            <div className="mx-auto flex h-11 max-w-[1280px] items-center gap-1 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button type="button" onClick={() => setDrawer(true)} className="mr-1 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-extrabold" style={{ background: t.soft, color: t.primaryInk }}><Icon icon="solar:widget-4-linear" width={16} />{editable(diseno?.retailNavCategories, 'Categorías')}</button>
              {barCats.map((c) => {
                const on = active === 'catalog' && activeCategory === c;
                return (
                  <button key={c} type="button" onClick={() => go(catUrl(c))} className="group relative inline-flex h-8 shrink-0 items-center rounded-lg px-2.5 text-[13px] font-bold transition-colors hover:bg-black/[0.035]" style={{ color: on ? t.primaryInk : t.ink }}>
                    {c}
                    <span aria-hidden className={`absolute inset-x-2.5 -bottom-[6px] h-[2px] origin-left rounded-full transition-transform duration-300 ${on ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} style={{ background: t.accent }} />
                  </button>
                );
              })}
              <button type="button" onClick={() => go(`/tienda/${slug}/contacto`)} className="ml-auto inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-bold hover:bg-black/[0.035]" style={{ color: t.muted }}><Icon icon="solar:chat-round-dots-linear" width={16} />{editable(diseno?.retailNavContact, 'Contacto y ayuda')}</button>
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
                <button type="button" aria-label="Cerrar" onClick={() => setDrawer(false)} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-black/[0.04]" style={{ color: t.ink }}><Icon icon="solar:close-circle-linear" width={22} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {drawerLink(editable(diseno?.retailNavHome, 'Inicio'), `/tienda/${slug}`, active === 'home', 'solar:home-2-linear')}
                {drawerLink(editable(diseno?.retailNavShop, 'Todos los productos'), `/tienda/${slug}/catalogo`, active === 'catalog' && !activeCategory, 'solar:widget-4-linear')}
                {cats.length > 0 && <p className="px-3 pb-1 pt-4 text-[11px] font-extrabold uppercase tracking-[0.14em]" style={{ color: t.muted }}>{editable(diseno?.retailNavCategories, 'Categorías')}</p>}
                {cats.map((c) => drawerLink(c, catUrl(c), active === 'catalog' && activeCategory === c, categoryIcon(c)))}
                <div className="my-3 h-px" style={{ background: t.line }} />
                {drawerLink(editable(diseno?.retailNavContact, 'Contacto y ayuda'), `/tienda/${slug}/contacto`, active === 'contact', 'solar:chat-round-dots-linear')}
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
    <button type="button" aria-label={label} title={label} onClick={onClick} className="relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-black/[0.04]" style={{ color: t.ink }}>
      <Icon icon={icon} width={24} />
      {badge > 0 && <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-extrabold" style={{ background: t.accent, color: t.onAccent }}>{badge}</span>}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────── Footer ──
export function VitrinaFooter({ tienda, slug, diseno, t, categories, navigate }: any) {
  const storeName = storeNameOf(tienda);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const waUrl = buildStorePurchaseWhatsappUrl(waNumber, 'Hola, tengo una consulta.');
  const address = [tienda?.direccion, tienda?.distrito].map((v) => String(v || '').trim()).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  const horario = String(tienda?.horarioAtencion || '').trim();
  const socials = [
    tienda?.facebookUrl ? { icon: 'ic:baseline-facebook', label: 'Facebook', url: tienda.facebookUrl } : null,
    tienda?.instagramUrl ? { icon: 'mdi:instagram', label: 'Instagram', url: tienda.instagramUrl } : null,
    tienda?.tiktokUrl ? { icon: 'ic:baseline-tiktok', label: 'TikTok', url: tienda.tiktokUrl } : null,
    waUrl ? { icon: 'ic:baseline-whatsapp', label: 'WhatsApp', url: waUrl } : null,
  ].filter(Boolean) as { icon: string; label: string; url: string }[];
  const cats: string[] = (categories || []).slice(0, 6);
  const intro = optional(diseno?.retailFooterText, String(tienda?.descripcionTienda || '').trim() || 'Tu tienda de confianza para comprar fácil, rápido y seguro.');
  const cols: { title: string; items: { label: string; to: string }[] }[] = [
    { title: 'Tienda', items: [...cats.map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })), { label: 'Todos los productos', to: `/tienda/${slug}/catalogo` }] },
    { title: 'Atención al cliente', items: [
      { label: 'Contacto', to: `/tienda/${slug}/contacto` },
      { label: 'Preguntas frecuentes', to: `/tienda/${slug}/contacto#faq` },
      { label: 'Seguir mi pedido', to: `/tienda/${slug}/seguimiento` },
    ] },
  ];
  const hasVisit = Boolean(address || horario);

  return (
    <footer className="border-t" style={{ background: mix(t.primary, 5, '#F5EFE6'), borderColor: t.line, color: t.ink }}>
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr_1.3fr] lg:px-8">
        <div>
          <Logo tienda={tienda} diseno={diseno} t={t} />
          {intro && <p className="mt-4 max-w-xs whitespace-pre-line text-[13px] leading-relaxed" style={{ color: t.muted }}>{intro}</p>}
          {socials.length > 0 && (
            <div className="mt-5 flex gap-1.5">
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-9 w-9 items-center justify-center rounded-full bg-white transition-transform hover:-translate-y-0.5" style={{ color: t.ink, boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                  <Icon icon={s.icon} width={17} />
                </a>
              ))}
            </div>
          )}
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="text-[13.5px] font-extrabold">{col.title}</h4>
            <ul className="mt-4 space-y-2.5 text-[13px]" style={{ color: t.muted }}>
              {col.items.map((it) => <li key={it.label}><button type="button" onClick={() => navigate(it.to)} className="text-left transition-colors hover:text-stone-900">{it.label}</button></li>)}
            </ul>
          </div>
        ))}
        {hasVisit ? (
          <div>
            <h4 className="text-[13.5px] font-extrabold">Visítanos</h4>
            <ul className="mt-4 space-y-2.5 text-[13px]" style={{ color: t.muted }}>
              {address && <li className="flex gap-2"><Icon icon="solar:map-point-linear" width={16} className="mt-0.5 shrink-0" />{address}</li>}
              {horario && <li className="flex gap-2"><Icon icon="solar:clock-circle-linear" width={16} className="mt-0.5 shrink-0" />{horario}</li>}
            </ul>
          </div>
        ) : <div className="hidden lg:block" />}
        <PaymentMethods slug={slug} t={t} />
      </div>
      <div className="border-t" style={{ borderColor: t.line }}>
        <p className="mx-auto max-w-[1280px] px-4 py-5 text-center text-[12px] lg:px-8" style={{ color: t.muted }}>© {new Date().getFullYear()} {storeName}. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────── Product card ──
/**
 * Tarjeta de producto (estado propio de cantidad aislado). Con variantes lleva a elegir en la ficha.
 * `compact` = versión de la fila "tendencias" (6 por fila).
 */
export function VitrinaProductCard({ producto, slug, t, onOpen, onAdd, compact = false }: { producto: any; slug: string; t: Theme; onOpen: () => void; onAdd: (qty: number) => void; compact?: boolean }) {
  const pricing = getProductPricing(producto);
  const stock = Number(producto?.stock ?? 1);
  const isOut = stock <= 0;
  const hasVariants = Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const colors = getFashionColors(producto).slice(0, 4);
  const [qty, setQty] = useState(1);
  const [broken, setBroken] = useState(false); // URL de imagen rota en los datos → ícono de categoría

  return (
    <article className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-white p-2 transition-shadow duration-300 hover:shadow-[0_20px_40px_-26px_rgba(27,29,28,0.45)]" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }} onClick={onOpen}>
      <div className="relative aspect-square overflow-hidden rounded-xl" style={{ background: t.card }}>
        <div className="absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
          {pricing.enOferta && <span className="rounded-md px-2 py-0.5 text-[11px] font-extrabold" style={{ background: t.accent, color: t.onAccent }}>-{pricing.porcentajeDescuento}%</span>}
          {isOut ? <span className="rounded-md bg-stone-800 px-2 py-0.5 text-[10.5px] font-bold text-white">Agotado</span>
            : !hasVariants && stock <= 5 ? <span className="rounded-md bg-white/95 px-2 py-0.5 text-[10.5px] font-bold shadow-sm" style={{ color: t.accentInk }}>¡Quedan {stock}!</span> : null}
        </div>
        <div className="absolute right-1.5 top-1.5 z-10 [&_button:nth-child(n+2)]:opacity-0 [&_button]:transition-opacity group-hover:[&_button:nth-child(n+2)]:opacity-100 [@media(hover:none)]:[&_button:nth-child(n+2)]:opacity-100" onClick={(e) => e.stopPropagation()}>
          <ProductCardActions producto={producto} slug={slug} cp={t.primary} />
        </div>
        {producto?.imagenUrl && !broken ? (
          <img src={producto.imagenUrl} alt={producto.descripcion} loading="lazy" onError={() => setBroken(true)} className={`h-full w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.05] ${compact ? 'p-3' : 'p-4'} ${isOut ? 'opacity-50 grayscale' : ''}`} />
        ) : (
          <NoPhoto t={t} producto={producto} />
        )}
      </div>

      <div className={`flex flex-1 flex-col ${compact ? 'px-1.5 pb-1.5 pt-2.5' : 'px-2 pb-2 pt-3'}`}>
        <h3 title={producto?.descripcion} className={`line-clamp-2 font-bold leading-snug ${compact ? 'text-[12.5px]' : 'text-[13.5px]'}`} style={{ color: t.ink }}>{producto?.descripcion}</h3>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <span className="flex items-baseline gap-1.5">
            <span className={`font-extrabold ${compact ? 'text-[13.5px]' : 'text-[15px]'}`} style={{ color: t.ink }}>{vtMoney(pricing.precioFinal)}</span>
            {pricing.enOferta && <span className="text-[11.5px] font-semibold line-through" style={{ color: t.muted }}>{vtMoney(pricing.precioRegular)}</span>}
          </span>
          <Rating producto={producto} t={t} size={compact ? 11 : 12} />
        </div>
        {colors.length > 0 && <div className="mt-2 flex gap-1.5">{colors.map((c) => <span key={c.name} title={c.name} className="h-3.5 w-3.5 rounded-full" style={{ background: c.hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.12)' }} />)}</div>}

        <div className="mt-auto flex items-stretch gap-1.5 pt-3" onClick={(e) => e.stopPropagation()}>
          {!hasVariants && !isOut && (
            <div className={`flex shrink-0 items-center justify-between rounded-lg ${compact ? 'h-9 w-[66px]' : 'h-10 w-[78px]'}`} style={{ background: t.softer, boxShadow: `inset 0 0 0 1px ${t.line}` }}>
              <button type="button" aria-label="Restar" onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-full w-6 items-center justify-center text-base font-bold" style={{ color: t.muted }}>−</button>
              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setQty(d === '' ? 1 : Math.max(1, parseInt(d, 10))); }} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[12.5px] font-extrabold outline-none focus:ring-0" style={{ color: t.ink }} />
              <button type="button" aria-label="Sumar" onClick={() => setQty(qty + 1)} className="flex h-full w-6 items-center justify-center text-base font-bold" style={{ color: t.muted }}>+</button>
            </div>
          )}
          <button
            type="button"
            disabled={isOut}
            onClick={() => { if (isOut) return; if (hasVariants) { onOpen(); return; } const n = Math.max(1, qty); onAdd(n); announceAdded(producto, n); setQty(1); }}
            aria-label={isOut ? 'Agotado' : hasVariants ? 'Ver opciones' : 'Agregar al carrito'}
            className={`${btnCls} min-w-0 flex-1 rounded-lg px-2 disabled:cursor-not-allowed ${compact ? 'h-9 text-[11.5px]' : 'h-10 text-[12.5px]'}`}
            style={isOut ? { background: t.softer, color: t.muted } : hasVariants ? { background: t.soft, color: t.primaryInk } : { background: t.primary, color: t.onPrimary }}
          >
            {!isOut && !hasVariants && <Icon icon="solar:cart-plus-linear" width={compact ? 18 : 16} className={`shrink-0 ${compact ? '' : 'hidden sm:block'}`} />}
            {/* En la versión compacta (6 por fila) el botón de agregar es solo ícono para no truncar el texto. */}
            <span className={`truncate ${compact && !isOut && !hasVariants ? 'sr-only' : ''}`}>{isOut ? 'Agotado' : hasVariants ? 'Ver opciones' : 'Agregar'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────── Cart modal ──
export function VitrinaCartModal({ isOpen, onClose, carrito, actualizarCantidad, onCheckout, t, tienda, diseno }: any) {
  const { slug = '' } = useParams();
  const items: any[] = carrito || [];
  const total = items.reduce((a, it) => a + Number(it.precioUnitario || 0) * Number(it.cantidad || 1), 0);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(waNumber, 'x'));
  const pedirWa = () => {
    if (!items.length) return;
    const detail = items.map((it) => `• ${Number(it.cantidad || 1)} x ${it.descripcion} - ${vtMoney(Number(it.precioUnitario || 0) * Number(it.cantidad || 1))}`).join('\n');
    const url = buildStorePurchaseWhatsappUrl(waNumber, `Hola, quiero pedir estos productos en ${storeNameOf(tienda)}:\n\n${detail}\n\nTotal estimado: ${vtMoney(total)}`);
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
                            <span className="text-[14.5px] font-extrabold" style={{ color: t.ink }}>{vtMoney(price * qty)}</span>
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
                  <span className="text-[22px] font-extrabold" style={{ color: t.ink }}>{vtMoney(total)}</span>
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

