import { useEffect, useState, type CSSProperties } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { getProductPricing } from '@/templates/shared/pricing';
import { readableText } from '@/templates/shared/color';
import { getFashionColors } from '@/templates/urbano/fashionVariants';
import ProductCardActions from '@/components/tienda/ProductCardActions';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { blEase, mix } from './motion';

import { sinStock, pocasUnidades } from '@/templates/shared/ventaSinStock';
/**
 * Piezas base de la plantilla Maquillaje (Blush): tema, header, footer, tarjeta y carrito.
 * Regla de la plantilla: nada inventado. Si un dato no existe en la tienda, la UI se oculta.
 */

export const blMoney = (v: any) => `S/ ${Number(v || 0).toFixed(2)}`;
export const editable = (v: any, fallback: string) => String(v || '').trim() || fallback;
export const storeNameOf = (tienda: any, fallback = 'Blush') => tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || fallback;
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
export const MAQUILLAJE_IMG = {
  hero: [u('1487412947147-5cebf100ffc2', 1400), u('1617897903246-719242758050', 1400), u('1596462502278-27bfdc403348', 1400)],
  promo: [u('1625093742435-6fa192b6fb10', 900), u('1600428877878-1a0fd85beda8', 900)],
  catalog: u('1596462502278-27bfdc403348', 1400),
  contact: u('1487412912498-0447578fcca8', 1400),
};

const INK = '#1C1718';
const SCHEMA_DEFAULT_ACCENT = '#FF6B6B';

// ── Design tokens: rosa empolvado + CTA tinta de la referencia; Jost + Playfair Display del design system ──
export function blushTheme(diseno: any) {
  const primary = diseno?.colorPrimario || '#C98B86'; // rosa empolvado (barra superior, bandas, tintes)
  // '#FF6B6B' es el default del schema (DisenoRubro.colorAccento), no una elección de marca:
  // se trata como "sin personalizar" y cae al negro tinta de la referencia.
  const rawAccent = String(diseno?.colorAccento || '').trim();
  const accent = !rawAccent || rawAccent.toUpperCase() === SCHEMA_DEFAULT_ACCENT ? '#171314' : rawAccent; // botones
  const rawBg = String(diseno?.colorSecundario || '').trim();
  const bgLum = luminance(rawBg);
  // "Color de fondo" global: claro → tal cual; saturado u oscuro → tinte muy suave sobre blanco.
  const bg = !rawBg ? '#FFFFFF' : bgLum !== null && bgLum < 0.78 ? mix(rawBg, 6, '#FFFFFF') : rawBg;
  const pl = luminance(primary);
  const al = luminance(accent);
  return {
    primary,
    accent,
    /** Principal/acento como texto sobre fondo claro: si son muy claros, se oscurecen hacia la tinta. */
    primaryInk: pl !== null && pl > 0.3 ? mix(primary, 58, INK) : primary,
    accentInk: al !== null && al > 0.45 ? INK : accent,
    bg,
    ink: INK,
    muted: '#877C7A',
    line: mix(INK, 10, bg),
    /** Tintes rosados derivados del color principal (hero, bandas, banners). */
    blush: mix(primary, 20, bg),
    blushSoft: mix(primary, 9, bg),
    blushDeep: mix(primary, 34, bg),
    /** Fondo de las fotos de producto (gris cálido de la referencia, teñido apenas). */
    card: mix(primary, 5, '#F6F4F3'),
    onPrimary: readableText(primary),
    onAccent: readableText(accent),
    font: `'Jost', 'Segoe UI', system-ui, sans-serif`,
    serif: `'Playfair Display', Georgia, 'Times New Roman', serif`,
  };
}
export type Theme = ReturnType<typeof blushTheme>;

/** Inyecta Jost + Playfair Display una sola vez. */
export function useBlushFont() {
  useEffect(() => {
    const id = 'blush-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);
}

/** Botón rectangular de la referencia (mayúsculas espaciadas). */
export const btnCls = 'inline-flex items-center justify-center gap-2 rounded-[2px] text-[11px] font-semibold uppercase tracking-[0.16em] transition-[opacity,transform] hover:opacity-90 active:scale-[0.98]';
/** Etiqueta pequeña en mayúsculas espaciadas. */
export const eyebrowCls = 'text-[11px] font-semibold uppercase tracking-[0.22em]';

/** Estrellas solo si hay reseñas reales; si no, no se muestra nada. */
export function Stars({ producto, t, size = 12 }: { producto: any; t: Theme; size?: number }) {
  const rating = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const count = Number(producto?.ratingCount || producto?.reviewsCount || 0);
  if (!(rating > 0 && count > 0)) return null;
  const r = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${rating.toFixed(1)} de 5 (${count} reseñas)`}>
      <span className="flex" style={{ color: t.ink }}>
        {Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon={i < r ? 'solar:star-bold' : 'solar:star-linear'} width={size} style={i < r ? undefined : { color: t.line }} />)}
      </span>
      <span className="text-[11px]" style={{ color: t.muted }}>({count})</span>
    </span>
  );
}

/** Placeholder elegante para productos sin foto: monograma en serif sobre el tinte de marca. */
export function Monogram({ t, text, size = 64 }: { t: Theme; text?: string; size?: number }) {
  const letter = String(text || '').trim().charAt(0).toUpperCase() || '·';
  return (
    <span className="flex h-full w-full items-center justify-center" style={{ background: `radial-gradient(120% 90% at 30% 20%, ${mix(t.primary, 16, '#fff')} 0%, ${t.card} 70%)` }}>
      <span style={{ fontFamily: t.serif, fontSize: size, color: mix(t.primary, 55, t.ink), opacity: 0.55, lineHeight: 1 }}>{letter}</span>
    </span>
  );
}

export function Logo({ tienda, diseno, t, onClick, light = false }: { tienda: any; diseno: any; t: Theme; onClick?: () => void; light?: boolean }) {
  const name = editable(diseno?.maquillajeLogoText, storeNameOf(tienda));
  const tagline = String(diseno?.maquillajeLogoTagline || '').trim();
  const color = light ? '#fff' : t.ink;
  const content = tienda?.logo ? (
    <img src={tienda.logo} alt={name} className="h-10 w-auto max-w-[170px] object-contain" />
  ) : (
    <span className="flex flex-col items-center leading-none">
      <span className="max-w-[220px] truncate text-[24px] font-medium uppercase tracking-[0.06em]" style={{ fontFamily: t.serif, color }}>{name}</span>
      {tagline && <span className="mt-1 text-[8.5px] font-medium uppercase tracking-[0.5em]" style={{ color: light ? 'rgba(255,255,255,.8)' : t.muted }}>{tagline}</span>}
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
  if (tienda?.aceptaEnvio !== false) s.push({ icon: 'solar:delivery-linear', label: 'Envío a domicilio', sub: envio > 0 ? `Desde ${blMoney(envio)}` : 'Costo al finalizar tu compra' });
  if (tienda?.aceptaRecojo) {
    const min = Number(tienda?.tiempoPreparacionMin || 0);
    s.push({ icon: 'solar:shop-2-linear', label: 'Recojo en tienda', sub: min > 0 ? `Listo en ~${min} min` : 'Sin costo de envío' });
  }
  if (hasWhatsapp) s.push({ icon: 'solar:chat-round-like-linear', label: 'Asesoría de belleza', sub: 'Por WhatsApp' });
  s.push({ icon: 'solar:shield-check-linear', label: 'Compra segura', sub: 'Confirmas antes de pagar' });
  s.push({ icon: 'solar:map-arrow-square-linear', label: 'Seguimiento', sub: 'Código para tu pedido' });
  return s.slice(0, 4);
}

// ─────────────────────────────────────────────────────────────── Header ──
/**
 * Barra de anuncio + header. Estado propio (búsqueda, menú móvil) aislado aquí.
 */
export function BlushHeader({ tienda, slug, diseno, categories, t, cartCount, favCount, onOpenCart, onOpenFav, navigate, active, activeCategory }: any) {
  const [menu, setMenu] = useState<null | 'search' | 'mobile'>(null);
  const [q, setQ] = useState('');
  const cats: string[] = categories || [];
  const inline = cats.slice(0, 4);
  const go = (to: string) => { setMenu(null); navigate(to); };
  const services = buildServices(tienda);
  const topText = editable(diseno?.maquillajeTopText, services.slice(0, 2).map((s) => (s.sub.startsWith('Desde') ? `${s.label} ${s.sub.replace(/^Desde/, 'desde')}` : s.label)).join('  ·  '));
  const catUrl = (c: string) => `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`;

  const navBtn = (label: string, key: string, to: string, isActive: boolean) => (
    <button key={key} type="button" onClick={() => go(to)} className="group relative py-2 text-[11.5px] font-medium uppercase tracking-[0.16em] transition-opacity hover:opacity-100" style={{ color: t.ink, opacity: isActive ? 1 : 0.82 }}>
      <span className="block max-w-[150px] truncate">{label}</span>
      <span aria-hidden className={`absolute inset-x-0 -bottom-0.5 h-px origin-left transition-transform duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} style={{ background: t.ink }} />
    </button>
  );

  return (
    <header className="sticky top-0 z-30">
      {!isOn(diseno?.maquillajeTopHidden) && topText && (
        <div className="px-4 py-[7px] text-center text-[11px] font-medium tracking-[0.06em]" style={{ background: t.primary, color: t.onPrimary }}>{topText}</div>
      )}
      <div className="border-b backdrop-blur-md" style={{ borderColor: t.line, background: mix(t.bg, 94, 'transparent') }}>
        <div className="mx-auto grid h-[76px] max-w-[1280px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 lg:grid-cols-[auto_1fr_auto] lg:gap-10 lg:px-8">
          <span className="lg:hidden"><IconBtn t={t} label="Menú" icon={menu === 'mobile' ? 'solar:close-square-linear' : 'solar:hamburger-menu-linear'} onClick={() => setMenu(menu === 'mobile' ? null : 'mobile')} /></span>
          <div className="justify-self-center lg:justify-self-start"><Logo tienda={tienda} diseno={diseno} t={t} onClick={() => go(`/tienda/${slug}`)} /></div>

          <nav className="hidden items-center justify-center gap-8 lg:flex" aria-label="Principal">
            {navBtn(editable(diseno?.maquillajeNavShop, 'Tienda'), 'shop', `/tienda/${slug}/catalogo`, active === 'catalog' && !activeCategory)}
            {inline.map((c) => navBtn(c, `c-${c}`, catUrl(c), active === 'catalog' && activeCategory === c))}
            {navBtn(editable(diseno?.maquillajeNavContact, 'Contacto'), 'contact', `/tienda/${slug}/contacto`, active === 'contact')}
          </nav>

          <div className="flex items-center gap-0.5 justify-self-end">
            <IconBtn t={t} label="Buscar" icon="solar:magnifer-linear" onClick={() => setMenu(menu === 'search' ? null : 'search')} />
            <IconBtn t={t} label="Favoritos" icon="solar:heart-linear" onClick={onOpenFav} badge={favCount} />
            <button type="button" aria-label={`Carrito (${cartCount})`} onClick={onOpenCart} className="flex h-11 items-center gap-1 px-2 transition-opacity hover:opacity-70" style={{ color: t.ink }}>
              <Icon icon="solar:bag-3-linear" width={21} />
              <span className="text-[12px] font-medium tabular-nums">({cartCount})</span>
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {menu === 'search' && (
            <motion.form key="search" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: blEase }} onSubmit={(e) => { e.preventDefault(); go(`/tienda/${slug}/catalogo${q.trim() ? `?search=${encodeURIComponent(q.trim())}` : ''}`); }} className="border-t" style={{ borderColor: t.line }} role="search">
              <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-3 px-4 lg:px-8">
                <Icon icon="solar:magnifer-linear" width={18} style={{ color: t.muted }} />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={editable(diseno?.maquillajeSearchPlaceholder, 'Busca labiales, bases, sérums…')} aria-label="Buscar productos" className="min-w-0 flex-1 appearance-none border-0 bg-transparent bg-none p-0 text-[14.5px] outline-none placeholder:text-stone-400 focus:ring-0" style={{ color: t.ink }} />
                <button type="submit" className={`${btnCls} h-9 px-5`} style={{ background: t.accent, color: t.onAccent }}>Buscar</button>
              </div>
            </motion.form>
          )}
          {menu === 'mobile' && (
            <motion.nav key="mobile" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: blEase }} className="border-t px-4 pb-4 pt-2 lg:hidden" style={{ borderColor: t.line }} aria-label="Menú móvil">
              {[
                { label: editable(diseno?.maquillajeNavHome, 'Inicio'), to: `/tienda/${slug}` },
                { label: editable(diseno?.maquillajeNavShop, 'Tienda'), to: `/tienda/${slug}/catalogo` },
                ...cats.slice(0, 8).map((c) => ({ label: c, to: catUrl(c) })),
                { label: editable(diseno?.maquillajeNavContact, 'Contacto'), to: `/tienda/${slug}/contacto` },
              ].map((it, i) => (
                <button key={`${it.label}-${i}`} type="button" onClick={() => go(it.to)} className="flex w-full items-center justify-between border-b px-1 py-3.5 text-left text-[12.5px] font-medium uppercase tracking-[0.14em] last:border-b-0" style={{ color: t.ink, borderColor: t.line }}>
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
    <button type="button" aria-label={label} title={label} onClick={onClick} className="relative flex h-11 w-10 items-center justify-center transition-opacity hover:opacity-70" style={{ color: t.ink }}>
      <Icon icon={icon} width={21} />
      {badge > 0 && <span className="absolute right-0.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9.5px] font-semibold" style={{ background: t.primary, color: t.onPrimary }}>{badge}</span>}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────── Footer ──
export function BlushFooter({ tienda, slug, diseno, t, categories, navigate }: any) {
  const storeName = storeNameOf(tienda);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const waUrl = buildStorePurchaseWhatsappUrl(waNumber, 'Hola, tengo una consulta.');
  const address = [tienda?.direccion, tienda?.distrito].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  const horario = String(tienda?.horarioAtencion || '').trim();
  const socials = [
    tienda?.instagramUrl ? { icon: 'mdi:instagram', label: 'Instagram', url: tienda.instagramUrl } : null,
    tienda?.tiktokUrl ? { icon: 'ic:baseline-tiktok', label: 'TikTok', url: tienda.tiktokUrl } : null,
    tienda?.facebookUrl ? { icon: 'ic:baseline-facebook', label: 'Facebook', url: tienda.facebookUrl } : null,
    waUrl ? { icon: 'ic:baseline-whatsapp', label: 'WhatsApp', url: waUrl } : null,
  ].filter(Boolean) as { icon: string; label: string; url: string }[];
  const cats: string[] = (categories || []).slice(0, 6);
  const tagline = optional(diseno?.maquillajeFooterTagline, 'Belleza que se siente.\nSimple. Luminosa. Tuya.');
  const intro = String(diseno?.maquillajeFooterText || tienda?.descripcionTienda || '').trim();
  const cols: { title: string; items: { label: string; to: string }[] }[] = [
    { title: 'Tienda', items: [...cats.map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })), { label: 'Ver todo', to: `/tienda/${slug}/catalogo` }] },
    { title: 'Ayuda', items: [
      { label: 'Contacto', to: `/tienda/${slug}/contacto` },
      { label: 'Preguntas frecuentes', to: `/tienda/${slug}/contacto#faq` },
      { label: 'Seguimiento de pedido', to: `/tienda/${slug}/seguimiento` },
    ] },
  ];
  const hasVisit = Boolean(address || horario || waUrl);

  return (
    <footer style={{ background: mix(t.primary, 4, '#F8F6F5'), color: t.ink }}>
      <div className={`mx-auto grid max-w-[1280px] gap-10 px-4 py-14 sm:grid-cols-2 lg:px-8 ${hasVisit ? 'lg:grid-cols-[1.6fr_1fr_1fr_1.3fr]' : 'lg:grid-cols-[1.6fr_1fr_1fr]'}`}>
        <div>
          <div className="inline-flex"><Logo tienda={tienda} diseno={diseno} t={t} /></div>
          {tagline && <p className="mt-4 whitespace-pre-line text-[12.5px] leading-relaxed" style={{ color: t.muted }}>{tagline}</p>}
          {intro && <p className="mt-3 max-w-xs whitespace-pre-line text-[12.5px] leading-relaxed" style={{ color: t.muted }}>{intro}</p>}
          {socials.length > 0 && (
            <div className="mt-5 flex gap-1">
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-9 w-9 items-center justify-center transition-opacity hover:opacity-60" style={{ color: t.ink }}>
                  <Icon icon={s.icon} width={18} />
                </a>
              ))}
            </div>
          )}
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">{col.title}</h4>
            <ul className="mt-5 space-y-2.5 text-[12.5px]" style={{ color: t.muted }}>
              {col.items.map((it) => <li key={it.label}><button type="button" onClick={() => navigate(it.to)} className="text-left transition-colors hover:text-stone-900">{it.label}</button></li>)}
            </ul>
          </div>
        ))}
        {hasVisit && (
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">{editable(diseno?.maquillajeFooterContactTitle, 'Contáctanos')}</h4>
            <ul className="mt-5 space-y-2.5 text-[12.5px]" style={{ color: t.muted }}>
              {waUrl && <li><a href={waUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-medium hover:underline" style={{ color: t.ink }}><Icon icon="ic:baseline-whatsapp" width={16} />Escríbenos por WhatsApp</a></li>}
              {address && <li className="flex gap-2"><Icon icon="solar:map-point-linear" width={16} className="mt-0.5 shrink-0" />{address}</li>}
              {horario && <li className="flex gap-2"><Icon icon="solar:clock-circle-linear" width={16} className="mt-0.5 shrink-0" />{horario}</li>}
            </ul>
          </div>
        )}
      </div>
      <div className="border-t" style={{ borderColor: t.line }}>
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2 px-4 py-5 text-[11px] uppercase tracking-[0.12em] lg:px-8" style={{ color: t.muted }}>
          <span>© {new Date().getFullYear()} {storeName}</span>
          <span>Todos los derechos reservados</span>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────── Product card ──
/**
 * Tarjeta de producto (estado propio de cantidad aislado). Con variantes (tono, tamaño)
 * lleva a elegir en la ficha en vez de agregar a ciegas.
 */
export function BlushProductCard({ producto, slug, t, onOpen, onAdd }: { producto: any; slug: string; t: Theme; onOpen: () => void; onAdd: (qty: number) => void }) {
  const pricing = getProductPricing(producto);
  const stock = Number(producto?.stock ?? 1);
  const isOut = sinStock(stock);
  const hasVariants = Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const colors = getFashionColors(producto);
  const category = nameOf(producto?.categoria);
  const [qty, setQty] = useState(1);

  return (
    <article className="group relative flex h-full cursor-pointer flex-col" onClick={onOpen}>
      <div className="relative aspect-[4/5] overflow-hidden" style={{ background: t.card }}>
        <div className="absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1.5">
          {pricing.enOferta && <span className="px-2 py-1 text-[9.5px] font-semibold uppercase tracking-[0.14em]" style={{ background: t.accent, color: t.onAccent }}>-{pricing.porcentajeDescuento}%</span>}
          {isOut ? <span className="bg-white/90 px-2 py-1 text-[9.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: t.muted }}>Agotado</span>
            : !hasVariants && pocasUnidades(stock) ? <span className="bg-white/90 px-2 py-1 text-[9.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: t.ink }}>Últimas {stock}</span> : null}
        </div>
        <div className="absolute right-2 top-2 z-10 [&_button:nth-child(n+2)]:opacity-0 [&_button]:transition-opacity group-hover:[&_button:nth-child(n+2)]:opacity-100 [@media(hover:none)]:[&_button:nth-child(n+2)]:opacity-100" onClick={(e) => e.stopPropagation()}>
          <ProductCardActions producto={producto} slug={slug} cp={t.accent} />
        </div>
        {producto?.imagenUrl ? (
          <img src={producto.imagenUrl} alt={producto.descripcion} loading="lazy" className={`h-full w-full object-contain p-6 mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-[1.05] ${isOut ? 'opacity-50 grayscale' : ''}`} />
        ) : (
          <Monogram t={t} text={producto?.descripcion} />
        )}
      </div>

      <div className="flex flex-1 flex-col pt-3.5">
        <h3 title={producto?.descripcion} className="line-clamp-2 text-[13.5px] font-medium leading-snug" style={{ color: t.ink }}>{producto?.descripcion}</h3>
        {category && <p className="mt-0.5 truncate text-[12px] lowercase" style={{ color: t.muted }}>{category}</p>}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[13.5px] font-semibold" style={{ color: t.ink }}>{blMoney(pricing.precioFinal)}</span>
          {pricing.enOferta && <span className="text-[12px] line-through" style={{ color: t.muted }}>{blMoney(pricing.precioRegular)}</span>}
        </div>
        {(colors.length > 0 || Number(producto?.ratingCount || 0) > 0) && (
          <div className="mt-2 flex items-center justify-between gap-2">
            {colors.length > 0 ? (
              <span className="flex items-center gap-1.5">
                <span className="flex -space-x-1">{colors.slice(0, 5).map((c) => <span key={c.name} title={c.name} className="h-3.5 w-3.5 rounded-full ring-2 ring-white" style={{ background: c.hex }} />)}</span>
                <span className="text-[11px]" style={{ color: t.muted }}>{colors.length} {colors.length === 1 ? 'tono' : 'tonos'}</span>
              </span>
            ) : <span />}
            <Stars producto={producto} t={t} size={11} />
          </div>
        )}

        <div className="mt-auto flex items-stretch gap-2 pt-3.5" onClick={(e) => e.stopPropagation()}>
          {!hasVariants && !isOut && (
            <div className="flex h-9 w-[76px] shrink-0 items-center justify-between" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
              <button type="button" aria-label="Restar" onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-9 w-6 items-center justify-center text-[14px]" style={{ color: t.muted }}>−</button>
              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setQty(d === '' ? 1 : Math.max(1, parseInt(d, 10))); }} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[12.5px] font-medium outline-none focus:ring-0" style={{ color: t.ink }} />
              <button type="button" aria-label="Sumar" onClick={() => setQty(qty + 1)} className="flex h-9 w-6 items-center justify-center text-[14px]" style={{ color: t.muted }}>+</button>
            </div>
          )}
          <button
            type="button"
            disabled={isOut}
            onClick={() => { if (isOut) return; if (hasVariants) onOpen(); else onAdd(Math.max(1, qty)); }}
            className={`${btnCls} h-9 min-w-0 flex-1 px-2 text-[10.5px] disabled:cursor-not-allowed`}
            style={isOut ? { background: t.card, color: t.muted } : hasVariants ? { boxShadow: `inset 0 0 0 1px ${t.ink}`, color: t.ink } : { background: t.accent, color: t.onAccent }}
          >
            <span className="truncate">{isOut ? 'Agotado' : hasVariants ? (colors.length ? 'Elegir tono' : 'Ver opciones') : 'Agregar'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────── Cart modal ──
export function BlushCartModal({ isOpen, onClose, carrito, actualizarCantidad, onCheckout, t, tienda, diseno }: any) {
  const items: any[] = carrito || [];
  const total = items.reduce((a, it) => a + Number(it.precioUnitario || 0) * Number(it.cantidad || 1), 0);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(waNumber, 'x'));
  const pedirWa = () => {
    if (!items.length) return;
    const detail = items.map((it) => `• ${Number(it.cantidad || 1)} x ${it.descripcion} - ${blMoney(Number(it.precioUnitario || 0) * Number(it.cantidad || 1))}`).join('\n');
    const url = buildStorePurchaseWhatsappUrl(waNumber, `Hola, quiero pedir estos productos en ${storeNameOf(tienda)}:\n\n${detail}\n\nTotal estimado: ${blMoney(total)}`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  const drawerStyle: CSSProperties = { background: t.bg, fontFamily: t.font };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button type="button" aria-label="Cerrar carrito" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-stone-900/30 backdrop-blur-[2px]" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 280 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[430px] flex-col shadow-2xl" style={drawerStyle} role="dialog" aria-label="Carrito">
            <header className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: t.line }}>
              <div>
                <h2 className="text-[15px] font-semibold uppercase tracking-[0.16em]" style={{ color: t.ink }}>Tu bolsa</h2>
                <p className="mt-0.5 text-[12px]" style={{ color: t.muted }}>{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
              </div>
              <button type="button" aria-label="Cerrar" onClick={onClose} className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-60" style={{ color: t.ink }}><Icon icon="solar:close-square-linear" width={22} /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {!items.length ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: t.blush, color: t.primaryInk }}><Icon icon="solar:bag-3-linear" width={34} /></span>
                  <h3 className="mt-5 text-[20px]" style={{ color: t.ink, fontFamily: t.serif }}>Tu bolsa está vacía</h3>
                  <p className="mt-1.5 max-w-[260px] text-[13px]" style={{ color: t.muted }}>Descubre tus nuevos favoritos.</p>
                  <button type="button" onClick={onClose} className={`${btnCls} mt-6 h-11 px-7`} style={{ background: t.accent, color: t.onAccent }}>Seguir comprando</button>
                </div>
              ) : (
                <ul className="divide-y" style={{ borderColor: t.line }}>
                  {items.map((item) => {
                    const id = item.cartId || item.id;
                    const qty = Number(item.cantidad || 1);
                    const price = Number(item.precioUnitario || 0);
                    return (
                      <li key={id} className="relative grid grid-cols-[80px_1fr] gap-4 py-4 first:pt-0" style={{ borderColor: t.line }}>
                        <button type="button" aria-label="Quitar" onClick={() => actualizarCantidad(id, 0)} className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center text-stone-400 transition-colors hover:text-rose-500"><Icon icon="solar:trash-bin-minimalistic-linear" width={16} /></button>
                        <div className="h-[100px] overflow-hidden" style={{ background: t.card }}>
                          {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-2 mix-blend-multiply" /> : <Monogram t={t} text={item.descripcion} size={30} />}
                        </div>
                        <div className="flex min-w-0 flex-col pr-7">
                          <h3 className="line-clamp-2 text-[13px] font-medium leading-snug" style={{ color: t.ink }}>{item.descripcion}</h3>
                          <p className="mt-0.5 text-[12px]" style={{ color: t.muted }}>{blMoney(price)}</p>
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <div className="flex h-8 items-center" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                              <button type="button" aria-label="Restar" onClick={() => actualizarCantidad(id, qty - 1)} className="flex w-8 items-center justify-center" style={{ color: t.muted }}>−</button>
                              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); actualizarCantidad(id, d === '' ? 1 : parseInt(d, 10)); }} onFocus={(e) => e.currentTarget.select()} className="w-8 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[12.5px] font-medium outline-none focus:ring-0" style={{ color: t.ink }} />
                              <button type="button" aria-label="Sumar" onClick={() => actualizarCantidad(id, qty + 1)} className="flex w-8 items-center justify-center" style={{ color: t.muted }}>+</button>
                            </div>
                            <span className="text-[14px] font-semibold" style={{ color: t.ink }}>{blMoney(price * qty)}</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {items.length > 0 && (
              <footer className="border-t px-6 py-5" style={{ borderColor: t.line, background: t.blushSoft }}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: t.muted }}>Subtotal</span>
                  <span className="text-[20px] font-semibold" style={{ color: t.ink }}>{blMoney(total)}</span>
                </div>
                <p className="mb-4 text-[11.5px]" style={{ color: t.muted }}>El envío se calcula en el checkout según tu forma de entrega.</p>
                <button type="button" onClick={() => { onClose(); onCheckout(); }} className={`${btnCls} h-12 w-full`} style={{ background: t.accent, color: t.onAccent }}>
                  Ir a pagar <Icon icon="solar:arrow-right-linear" width={16} />
                </button>
                {hasWa && (
                  <button type="button" onClick={pedirWa} className={`${btnCls} mt-2.5 h-11 w-full bg-white`} style={{ color: t.ink, boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                    <Icon icon="ic:baseline-whatsapp" width={17} className="text-[#25D366]" /> Pedir por WhatsApp
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
