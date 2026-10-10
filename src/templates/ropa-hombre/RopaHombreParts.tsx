import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { getProductPricing } from '@/templates/shared/pricing';
import { readableText } from '@/templates/shared/color';
import { getFashionColors, getFashionColorGallery } from '@/templates/urbano/fashionVariants';
import ProductCardActions from '@/components/tienda/ProductCardActions';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { mix, urEase } from './motion';

import { sinStock, pocasUnidades } from '@/templates/shared/ventaSinStock';
/**
 * Plantilla Ropa hombre (Urbanic · Atelier): lujo silencioso, sastrería masculina.
 * Hueso + espresso + camel, serif editorial (Cormorant Garamond) con Inter.
 * Regla: nada inventado. Si un dato no existe en la tienda, la UI se oculta.
 */

export const urMoney = (v: any) => `S/ ${Number(v || 0).toFixed(2)}`;
export const editable = (v: any, fallback: string) => String(v || '').trim() || fallback;
export const optional = (v: any, fallback: string) => (v === undefined || v === null ? fallback : String(v).trim());
export const storeNameOf = (tienda: any, fallback = 'Atelier') => tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || fallback;
export const nameOf = (v: any): string => (v && typeof v === 'object' ? v.nombre || v.descripcion || '' : typeof v === 'string' ? v : '');
export const isOn = (v: any) => v === true || v === 'true' || v === '1';

function luminance(color: string): number | null {
  let hex = String(color || '').trim().replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const lin = (i: number) => { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(0) + 0.7152 * lin(2) + 0.0722 * lin(4);
}

const BASE_BG = '#F4F0E9'; // hueso

export function urbTheme(diseno: any) {
  const primary = diseno?.colorPrimario || '#1C1917'; // espresso (botones, bloques, footer)
  const accent = diseno?.colorAccento || '#9C7446';   // camel (detalles, ofertas)
  const rawBg = String(diseno?.colorSecundario || '').trim();
  const bgLum = luminance(rawBg);
  // "Color de fondo" global: claro → tal cual; saturado u oscuro → tinte suave sobre el hueso.
  const bg = !rawBg ? BASE_BG : bgLum !== null && bgLum < 0.78 ? mix(rawBg, 8, BASE_BG) : rawBg;
  const ink = '#1C1917';
  const pl = luminance(primary);
  const al = luminance(accent);
  return {
    primary,
    primaryInk: pl !== null && pl > 0.45 ? ink : primary,
    accent,
    accentInk: al !== null && al > 0.5 ? ink : accent,
    bg,
    ink,
    muted: '#77706A',
    soft: mix(ink, 6, bg),
    sand: mix(ink, 4, '#fff'),
    line: mix(ink, 12, bg),
    onPrimary: readableText(primary),
    onAccent: readableText(accent),
    font: `'${diseno?.tipografia || 'Inter'}', 'Helvetica Neue', system-ui, sans-serif`,
    serif: `'Cormorant Garamond', 'Times New Roman', serif`,
  };
}
export type Theme = ReturnType<typeof urbTheme>;
export const serif = (t: Theme, extra?: CSSProperties): CSSProperties => ({ fontFamily: t.serif, ...extra });

export function useUrbFont() {
  useEffect(() => {
    const id = 'urbanic-atelier-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);
}

/** Botón de la casa: rectangular, mayúsculas pequeñas con tracking amplio. */
export const btnCls = 'inline-flex items-center justify-center gap-2.5 rounded-none text-[11px] font-semibold uppercase tracking-[0.22em] transition-[filter,opacity,transform] hover:opacity-90 active:scale-[0.99]';

export function Stars({ producto, t, size = 11 }: { producto: any; t: Theme; size?: number }) {
  const rating = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const count = Number(producto?.ratingCount || producto?.reviewsCount || 0);
  if (!(rating > 0 && count > 0)) return <span className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: t.muted }}>Nuevo</span>;
  const r = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-1" style={{ color: t.ink }}>
      <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon={i < r ? 'solar:star-bold' : 'solar:star-linear'} width={size} style={i < r ? undefined : { color: t.line }} />)}</span>
      <span className="text-[10.5px]" style={{ color: t.muted }}>({count})</span>
    </span>
  );
}

export type Service = { icon: string; label: string; sub: string };
/** Servicios derivados de la configuración real de la tienda. */
export function buildServices(tienda: any, hasWhatsapp = false): Service[] {
  const s: Service[] = [];
  const envio = Number(tienda?.costoEnvioFijo || 0);
  if (tienda?.aceptaEnvio !== false) s.push({ icon: 'ph:package-thin', label: 'Envío a domicilio', sub: envio > 0 ? `Desde ${urMoney(envio)}` : 'Costo al finalizar tu compra' });
  if (tienda?.aceptaRecojo) {
    const min = Number(tienda?.tiempoPreparacionMin || 0);
    s.push({ icon: 'ph:storefront-thin', label: 'Recojo en tienda', sub: min > 0 ? `Listo en ~${min} min` : 'Sin costo de envío' });
  }
  if (hasWhatsapp) s.push({ icon: 'ph:chat-circle-text-thin', label: 'Asesoría de estilo', sub: 'Personal, por WhatsApp' });
  s.push({ icon: 'ph:shield-check-thin', label: 'Compra segura', sub: 'Confirmas antes de pagar' });
  s.push({ icon: 'ph:map-trifold-thin', label: 'Seguimiento', sub: 'Código para tu pedido' });
  return s.slice(0, 4);
}

function Wordmark({ tienda, diseno, t, color, onClick, size = 22 }: { tienda: any; diseno: any; t: Theme; color: string; onClick?: () => void; size?: number }) {
  const name = editable(diseno?.ropaHombreLogoText, storeNameOf(tienda));
  const tagline = String(diseno?.ropaHombreLogoTagline ?? '').trim();
  const content = tienda?.logo ? (
    <img src={tienda.logo} alt={name} className="h-10 w-auto max-w-[170px] object-contain" />
  ) : (
    <span className="flex flex-col items-center leading-none">
      <span className="max-w-[240px] truncate font-medium uppercase tracking-[0.28em]" style={serif(t, { color, fontSize: size })}>{name}</span>
      {tagline && <span className="mt-1.5 text-[8.5px] font-medium uppercase tracking-[0.42em]" style={{ color, opacity: 0.7 }}>{tagline}</span>}
    </span>
  );
  return onClick ? <button type="button" onClick={onClick} className="flex items-center">{content}</button> : <div className="flex items-center">{content}</div>;
}

// ─────────────────────────────────────────────────────────────── Header ──
/**
 * Header de la casa. Con `overlay` (home) es transparente sobre el hero y se vuelve sólido al hacer scroll.
 * Scroll, menú de colección, búsqueda y menú móvil: estado aislado aquí.
 */
export function UrbHeader({ tienda, slug, diseno, categories, t, cartCount, favCount, onOpenCart, onOpenFav, navigate, overlay = false }: any) {
  const [menu, setMenu] = useState<null | 'cats' | 'search' | 'mobile'>(null);
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState('');
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const cats: string[] = categories || [];
  const go = (to: string) => { setMenu(null); navigate(to); };
  const announce = optional(diseno?.ropaHombreAnnouncement, buildServices(tienda).slice(0, 2).map((s) => s.label).join('   ·   '));

  useEffect(() => {
    if (!overlay) return;
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [overlay]);
  useEffect(() => {
    if (menu !== 'cats') return;
    const close = (e: MouseEvent) => { const n = e.target as Node; if (!triggerRef.current?.contains(n) && !panelRef.current?.contains(n)) setMenu(null); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  const clear = overlay && !scrolled && !menu;
  const fg = clear ? '#FFFFFF' : t.ink;
  const link = 'relative py-2 text-[11px] font-medium uppercase tracking-[0.2em] transition-opacity hover:opacity-60';

  return (
    <header className={`${overlay ? 'fixed' : 'sticky'} inset-x-0 top-0 z-40`}>
      {announce && !isOn(diseno?.ropaHombreAnnouncementHidden) && (
        <div className="px-4 py-2 text-center text-[10.5px] font-medium uppercase tracking-[0.24em]" style={{ background: t.primary, color: t.onPrimary }}>{announce}</div>
      )}
      <div className="transition-[background-color,border-color,backdrop-filter] duration-500" style={{ background: clear ? 'transparent' : mix(t.bg, 94, 'transparent'), borderBottom: `1px solid ${clear ? 'rgba(255,255,255,.18)' : t.line}`, backdropFilter: clear ? 'none' : 'blur(12px)' }}>
        <div className="mx-auto grid h-[76px] max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:px-10">
          <nav className="flex items-center gap-7" aria-label="Principal">
            <button type="button" aria-label="Menú" onClick={() => setMenu(menu === 'mobile' ? null : 'mobile')} className="lg:hidden" style={{ color: fg }}><Icon icon={menu === 'mobile' ? 'ph:x-thin' : 'ph:list-thin'} width={26} /></button>
            {cats.length > 0 && (
              <div ref={triggerRef} className="relative hidden lg:block">
                <button type="button" onClick={() => setMenu(menu === 'cats' ? null : 'cats')} aria-expanded={menu === 'cats'} className={`${link} inline-flex items-center gap-1.5`} style={{ color: fg }}>
                  {editable(diseno?.ropaHombreNavCollections, 'Colección')}<Icon icon="ph:caret-down-thin" width={13} className={`transition-transform ${menu === 'cats' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
            <button type="button" onClick={() => go(`/tienda/${slug}/catalogo`)} className={`${link} hidden lg:block`} style={{ color: fg }}>{editable(diseno?.ropaHombreNavNew, 'Novedades')}</button>
            <button type="button" onClick={() => go(`/tienda/${slug}/contacto`)} className={`${link} hidden lg:block`} style={{ color: fg }}>{editable(diseno?.ropaHombreNavContact, 'Contacto')}</button>
          </nav>

          <Wordmark tienda={tienda} diseno={diseno} t={t} color={fg} onClick={() => go(`/tienda/${slug}`)} />

          <div className="flex items-center justify-end gap-1 sm:gap-3" style={{ color: fg }}>
            <button type="button" aria-label="Buscar" onClick={() => setMenu(menu === 'search' ? null : 'search')} className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-60"><Icon icon="ph:magnifying-glass-thin" width={22} /></button>
            <button type="button" aria-label="Favoritos" onClick={onOpenFav} className="relative hidden h-10 w-10 items-center justify-center transition-opacity hover:opacity-60 sm:flex">
              <Icon icon="ph:heart-thin" width={22} />
              {favCount > 0 && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full" style={{ background: t.accent }} />}
            </button>
            <button type="button" onClick={onOpenCart} className={`${link} flex items-center gap-2`} aria-label="Bolsa">
              <Icon icon="ph:handbag-thin" width={22} className="sm:hidden" />
              <span className="hidden sm:inline">{editable(diseno?.ropaHombreBagLabel, 'Bolsa')}</span>
              <span className="tabular-nums">({cartCount})</span>
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {menu === 'cats' && (
            <motion.div key="cats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: urEase }} className="hidden border-t lg:block" style={{ borderColor: t.line, background: t.bg }}>
              <div ref={panelRef} className="mx-auto grid max-w-[1440px] grid-cols-4 gap-x-10 gap-y-3 px-10 py-10">
                {cats.slice(0, 16).map((c) => (
                  <button key={c} type="button" onClick={() => go(`/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`)} className="group flex items-center gap-3 text-left" style={{ color: t.ink }}>
                    <span className="text-[22px] leading-tight transition-transform duration-500 group-hover:translate-x-1.5" style={serif(t)}>{c}</span>
                  </button>
                ))}
                <button type="button" onClick={() => go(`/tienda/${slug}/catalogo`)} className="mt-2 w-max text-[11px] font-semibold uppercase tracking-[0.22em] underline underline-offset-4" style={{ color: t.ink }}>Ver toda la colección</button>
              </div>
            </motion.div>
          )}
          {menu === 'search' && (
            <motion.form key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: urEase }} onSubmit={(e) => { e.preventDefault(); go(`/tienda/${slug}/catalogo${q.trim() ? `?search=${encodeURIComponent(q.trim())}` : ''}`); }} className="border-t" style={{ borderColor: t.line, background: t.bg }} role="search">
              <div className="mx-auto flex h-20 max-w-[1440px] items-center gap-4 px-5 lg:px-10">
                <Icon icon="ph:magnifying-glass-thin" width={24} style={{ color: t.muted }} />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={editable(diseno?.ropaHombreSearchPlaceholder, 'Buscar camisas, sacos, pantalones…')} aria-label="Buscar productos" className="min-w-0 flex-1 appearance-none border-0 bg-transparent bg-none p-0 text-[26px] outline-none placeholder:text-stone-400 focus:ring-0" style={serif(t, { color: t.ink })} />
                <button type="submit" className={`${btnCls} h-11 px-6`} style={{ background: t.primary, color: t.onPrimary }}>Buscar</button>
              </div>
            </motion.form>
          )}
          {menu === 'mobile' && (
            <motion.nav key="mobile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="border-t px-5 pb-6 pt-3 lg:hidden" style={{ borderColor: t.line, background: t.bg }} aria-label="Menú móvil">
              {[
                { label: 'Inicio', to: `/tienda/${slug}` },
                { label: editable(diseno?.ropaHombreNavNew, 'Novedades'), to: `/tienda/${slug}/catalogo` },
                ...cats.slice(0, 8).map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })),
                { label: editable(diseno?.ropaHombreNavContact, 'Contacto'), to: `/tienda/${slug}/contacto` },
              ].map((it, i) => (
                <button key={`${it.label}-${i}`} type="button" onClick={() => go(it.to)} className="block w-full border-b py-3.5 text-left text-[22px]" style={serif(t, { color: t.ink, borderColor: t.line })}>{it.label}</button>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────── Footer ──
export function UrbFooter({ tienda, slug, diseno, t, categories, navigate }: any) {
  const storeName = editable(diseno?.ropaHombreLogoText, storeNameOf(tienda));
  const waUrl = buildStorePurchaseWhatsappUrl(tienda?.whatsappTienda ?? diseno?.whatsappTienda, 'Hola, tengo una consulta.');
  const address = [tienda?.direccion, tienda?.distrito].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  const horario = String(tienda?.horarioAtencion || '').trim();
  const socials = [
    tienda?.instagramUrl ? { label: 'Instagram', url: tienda.instagramUrl } : null,
    tienda?.facebookUrl ? { label: 'Facebook', url: tienda.facebookUrl } : null,
    tienda?.tiktokUrl ? { label: 'TikTok', url: tienda.tiktokUrl } : null,
    waUrl ? { label: 'WhatsApp', url: waUrl } : null,
  ].filter(Boolean) as { label: string; url: string }[];
  const cats: string[] = (categories || []).slice(0, 6);
  const about = String(diseno?.ropaHombreFooterText || tienda?.descripcionTienda || '').trim();
  const sub = mix(t.onPrimary, 62, t.primary);
  const cols = [
    ...(cats.length ? [{ title: 'Colección', items: cats.map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })) }] : []),
    { title: 'La casa', items: [{ label: 'Inicio', to: `/tienda/${slug}` }, { label: 'Novedades', to: `/tienda/${slug}/catalogo` }, { label: 'Contacto', to: `/tienda/${slug}/contacto` }] },
    { title: 'Atención', items: [{ label: 'Seguimiento de pedido', to: `/tienda/${slug}/seguimiento` }, { label: 'Preguntas frecuentes', to: `/tienda/${slug}/contacto#faq` }] },
  ];
  return (
    <footer style={{ background: t.primary, color: t.onPrimary }}>
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 pb-10 pt-20 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)_1fr] lg:px-10">
        <div>
          {about ? <p className="max-w-xs whitespace-pre-line text-[22px] leading-snug" style={serif(t)}>{about}</p> : <p className="max-w-xs text-[22px] leading-snug" style={serif(t)}>{editable(diseno?.ropaHombreFooterClaim, 'Vestir bien es una forma de respeto.')}</p>}
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.24em]" style={{ color: sub }}>{col.title}</h4>
            <ul className="mt-5 space-y-3 text-[13.5px]">
              {col.items.map((it) => <li key={it.label}><button type="button" onClick={() => navigate(it.to)} className="text-left transition-opacity hover:opacity-60">{it.label}</button></li>)}
            </ul>
          </div>
        ))}
        {(address || horario || socials.length > 0) && (
          <div>
            <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.24em]" style={{ color: sub }}>Visítanos</h4>
            <ul className="mt-5 space-y-3 text-[13.5px]">
              {address && <li>{address}</li>}
              {horario && <li style={{ color: sub }}>{horario}</li>}
              {socials.map((s) => <li key={s.label}><a href={s.url} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">{s.label}</a></li>)}
            </ul>
          </div>
        )}
      </div>
      <div className="overflow-hidden px-5 lg:px-10">
        <p aria-hidden className="select-none whitespace-nowrap text-center font-medium uppercase leading-[0.8] tracking-[0.06em]" style={serif(t, { fontSize: 'clamp(56px, 13vw, 210px)', color: mix(t.onPrimary, 14, t.primary) })}>{storeName}</p>
      </div>
      <div className="border-t" style={{ borderColor: mix(t.onPrimary, 14, t.primary) }}>
        <p className="mx-auto max-w-[1440px] px-5 py-6 text-[11px] uppercase tracking-[0.2em] lg:px-10" style={{ color: sub }}>© {new Date().getFullYear()} {storeName}</p>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────── Product card ──
/**
 * Tarjeta retrato: segunda foto al pasar el mouse (extra o galería del primer color) y "añadir rápido"
 * que sube desde la base de la foto (siempre visible en pantallas táctiles). Cantidad aislada aquí.
 */
export function UrbProductCard({ producto, slug, t, onOpen, onAdd }: { producto: any; slug: string; t: Theme; onOpen: () => void; onAdd: (qty: number) => void }) {
  const pricing = getProductPricing(producto);
  const stock = Number(producto?.stock ?? 1);
  const isOut = sinStock(stock);
  const hasVariants = Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const colors = getFashionColors(producto).slice(0, 5);
  const extra = Array.isArray(producto?.imagenesExtra) ? producto.imagenesExtra.map((x: any) => (typeof x === 'string' ? x : x?.url)).filter(Boolean) : [];
  const alt = extra.find((u: string) => u !== producto?.imagenUrl) || (colors[0] ? getFashionColorGallery(producto, colors[0].name).find((u) => u !== producto?.imagenUrl) : '') || '';
  const category = nameOf(producto?.categoria);
  const [qty, setQty] = useState(1);
  const [imgFailed, setImgFailed] = useState(false); // URL rota → se muestra el placeholder, no el texto alt

  return (
    <article className="group relative flex h-full cursor-pointer flex-col" onClick={onOpen}>
      <div className="relative aspect-[4/5] overflow-hidden" style={{ background: t.soft }}>
        {producto?.imagenUrl && !imgFailed ? (
          <>
            <img src={producto.imagenUrl} alt={producto.descripcion} loading="lazy" onError={() => setImgFailed(true)} className={`absolute inset-0 h-full w-full object-cover mix-blend-multiply transition-[opacity,transform] duration-[900ms] ease-out group-hover:scale-[1.03] ${alt ? 'group-hover:opacity-0' : ''} ${isOut ? 'opacity-60 grayscale' : ''}`} />
            {alt && <img src={alt} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 mix-blend-multiply transition-opacity duration-[900ms] group-hover:opacity-100" />}
          </>
        ) : (
          <div className="flex h-full items-center justify-center"><Icon icon="ph:t-shirt-thin" width={70} style={{ color: mix(t.ink, 25, t.bg) }} /></div>
        )}
        <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1">
          {pricing.enOferta && <span className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ background: t.accent, color: t.onAccent }}>-{pricing.porcentajeDescuento}%</span>}
          {isOut ? <span className="bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: t.ink }}>Agotado</span>
            : !hasVariants && pocasUnidades(stock) ? <span className="bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: t.ink }}>Últimas {stock}</span> : null}
        </div>
        <div className="absolute right-3 top-3 z-10 [&_button]:!rounded-none [&_button]:!border-0 [&_button]:!shadow-none [&_button:nth-child(n+2)]:opacity-0 [&_button]:transition-opacity group-hover:[&_button:nth-child(n+2)]:opacity-100 [@media(hover:none)]:[&_button:nth-child(n+2)]:opacity-100" onClick={(e) => e.stopPropagation()}>
          <ProductCardActions producto={producto} slug={slug} cp={t.primary} />
        </div>
        {/* Añadir rápido: sube desde la base (solo CSS; sin transform de framer en este nodo) */}
        {!isOut && (
          <div className="absolute inset-x-0 bottom-0 z-10 flex translate-y-full items-stretch transition-transform duration-500 ease-out group-hover:translate-y-0 [@media(hover:none)]:translate-y-0" onClick={(e) => e.stopPropagation()}>
            {!hasVariants && (
              <div className="flex w-[92px] shrink-0 items-center justify-between bg-white/95 px-2 backdrop-blur" style={{ color: t.ink }}>
                <button type="button" aria-label="Restar" onClick={() => setQty(Math.max(1, qty - 1))} className="px-1.5 py-3 text-base leading-none">−</button>
                <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setQty(d === '' ? 1 : Math.max(1, parseInt(d, 10))); }} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[12px] font-semibold outline-none focus:ring-0" />
                <button type="button" aria-label="Sumar" onClick={() => setQty(qty + 1)} className="px-1.5 py-3 text-base leading-none">+</button>
              </div>
            )}
            <button type="button" onClick={() => (hasVariants ? onOpen() : onAdd(Math.max(1, qty)))} className={`${btnCls} min-h-[44px] flex-1 px-3 !text-[10.5px]`} style={{ background: t.primary, color: t.onPrimary }}>
              {hasVariants ? 'Elegir talla' : 'Añadir'}
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col pt-4">
        {category && <p className="text-[10px] font-medium uppercase tracking-[0.22em]" style={{ color: t.muted }}>{category}</p>}
        <h3 title={producto?.descripcion} className="mt-1.5 line-clamp-2 text-[17px] leading-snug" style={serif(t, { color: t.ink })}>{producto?.descripcion}</h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <p className="flex items-baseline gap-2 text-[13px]" style={{ color: t.ink }}>
            <span className="font-medium">{urMoney(pricing.precioFinal)}</span>
            {pricing.enOferta && <span className="text-[12px] line-through" style={{ color: t.muted }}>{urMoney(pricing.precioRegular)}</span>}
          </p>
          {colors.length > 1 ? (
            <span className="flex items-center gap-1">{colors.map((c) => <span key={c.name} title={c.name} className="h-2.5 w-2.5 rounded-full" style={{ background: c.hex, boxShadow: `0 0 0 1px ${t.line}` }} />)}</span>
          ) : <Stars producto={producto} t={t} />}
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────── Cart ──
export function UrbCartModal({ isOpen, onClose, carrito, actualizarCantidad, onCheckout, t, tienda, diseno }: any) {
  const items: any[] = carrito || [];
  const total = items.reduce((a, it) => a + Number(it.precioUnitario || 0) * Number(it.cantidad || 1), 0);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(waNumber, 'x'));
  const pedirWa = () => {
    if (!items.length) return;
    const detail = items.map((it) => `• ${Number(it.cantidad || 1)} x ${it.descripcion} - ${urMoney(Number(it.precioUnitario || 0) * Number(it.cantidad || 1))}`).join('\n');
    const url = buildStorePurchaseWhatsappUrl(waNumber, `Hola, quiero pedir en ${storeNameOf(tienda)}:\n\n${detail}\n\nTotal estimado: ${urMoney(total)}`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button type="button" aria-label="Cerrar bolsa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-black/40" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.55, ease: urEase }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col" style={{ background: t.bg, fontFamily: t.font }} role="dialog" aria-label="Bolsa">
            <header className="flex items-center justify-between border-b px-7 py-6" style={{ borderColor: t.line }}>
              <h2 className="text-[28px] leading-none" style={serif(t, { color: t.ink })}>Tu bolsa <span className="text-[16px]" style={{ color: t.muted }}>({items.length})</span></h2>
              <button type="button" aria-label="Cerrar" onClick={onClose} style={{ color: t.ink }}><Icon icon="ph:x-thin" width={26} /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-7 py-6">
              {!items.length ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="text-[26px]" style={serif(t, { color: t.ink })}>Tu bolsa está vacía</p>
                  <p className="mt-2 max-w-[260px] text-[13px]" style={{ color: t.muted }}>Descubre las piezas de la colección.</p>
                  <button type="button" onClick={onClose} className={`${btnCls} mt-8 h-12 px-8`} style={{ background: t.primary, color: t.onPrimary }}>Seguir comprando</button>
                </div>
              ) : (
                <ul className="divide-y" style={{ borderColor: t.line }}>
                  {items.map((item) => {
                    const id = item.cartId || item.id;
                    const qty = Number(item.cantidad || 1);
                    const price = Number(item.precioUnitario || 0);
                    return (
                      <li key={id} className="grid grid-cols-[88px_1fr] gap-4 py-5 first:pt-0" style={{ borderColor: t.line }}>
                        <div className="aspect-[4/5] overflow-hidden" style={{ background: t.soft }}>{item.imagenUrl && <img src={item.imagenUrl} alt="" className="h-full w-full object-cover mix-blend-multiply" />}</div>
                        <div className="flex min-w-0 flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="line-clamp-2 text-[16px] leading-snug" style={serif(t, { color: t.ink })}>{item.descripcion}</h3>
                            <button type="button" aria-label="Quitar" onClick={() => actualizarCantidad(id, 0)} className="shrink-0 text-[10.5px] uppercase tracking-[0.18em] underline underline-offset-4" style={{ color: t.muted }}>Quitar</button>
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex h-9 items-center" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                              <button type="button" aria-label="Restar" onClick={() => actualizarCantidad(id, qty - 1)} className="w-8 text-base" style={{ color: t.ink }}>−</button>
                              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); actualizarCantidad(id, d === '' ? 1 : parseInt(d, 10)); }} onFocus={(e) => e.currentTarget.select()} className="w-9 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[12.5px] outline-none focus:ring-0" style={{ color: t.ink }} />
                              <button type="button" aria-label="Sumar" onClick={() => actualizarCantidad(id, qty + 1)} className="w-8 text-base" style={{ color: t.ink }}>+</button>
                            </div>
                            <span className="text-[14px] font-medium" style={{ color: t.ink }}>{urMoney(price * qty)}</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {items.length > 0 && (
              <footer className="border-t px-7 py-6" style={{ borderColor: t.line }}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] uppercase tracking-[0.22em]" style={{ color: t.muted }}>Subtotal</span>
                  <span className="text-[26px]" style={serif(t, { color: t.ink })}>{urMoney(total)}</span>
                </div>
                <p className="mb-5 mt-1 text-[11.5px]" style={{ color: t.muted }}>Envío calculado en el checkout.</p>
                <button type="button" onClick={() => { onClose(); onCheckout(); }} className={`${btnCls} h-14 w-full`} style={{ background: t.primary, color: t.onPrimary }}>Finalizar compra</button>
                {hasWa && <button type="button" onClick={pedirWa} className={`${btnCls} mt-3 h-12 w-full`} style={{ boxShadow: `inset 0 0 0 1px ${t.ink}`, color: t.ink }}>Pedir por WhatsApp</button>}
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
