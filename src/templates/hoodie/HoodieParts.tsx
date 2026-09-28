import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { getProductPricing } from '@/templates/shared/pricing';
import { readableText } from '@/templates/shared/color';
import { getFashionColors, getFashionColorGallery } from '@/templates/urbano/fashionVariants';
import ProductCardActions from '@/components/tienda/ProductCardActions';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { mix, hdEase } from './motion';

/**
 * Plantilla Hoodie (Drop culture): streetwear de alto contraste.
 * Hueso + bloques negros + acento ácido; Anton (display), Space Grotesk (texto), JetBrains Mono (etiquetas).
 * Bordes duros, sin radios. Regla: nada inventado; si un dato no existe, la UI se oculta.
 */

export const hdMoney = (v: any) => `S/ ${Number(v || 0).toFixed(2)}`;
export const editable = (v: any, fallback: string) => String(v || '').trim() || fallback;
export const optional = (v: any, fallback: string) => (v === undefined || v === null ? fallback : String(v).trim());
export const storeNameOf = (tienda: any, fallback = 'DROP') => tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || fallback;
export const nameOf = (v: any): string => (v && typeof v === 'object' ? v.nombre || v.descripcion || '' : typeof v === 'string' ? v : '');
export const isOn = (v: any) => v === true || v === 'true' || v === '1';

function luminance(color: string): number | null {
  let hex = String(color || '').trim().replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const lin = (i: number) => { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(0) + 0.7152 * lin(2) + 0.0722 * lin(4);
}

const BASE_BG = '#EDEDE8'; // hueso frío

export function hdTheme(diseno: any) {
  const primary = diseno?.colorPrimario || '#0B0B0B'; // bloques y botones
  const accent = diseno?.colorAccento || '#D4FF3F';   // ácido (marquesinas, stickers, hover)
  const rawBg = String(diseno?.colorSecundario || '').trim();
  const bgLum = luminance(rawBg);
  const bg = !rawBg ? BASE_BG : bgLum !== null && bgLum < 0.78 ? mix(rawBg, 8, BASE_BG) : rawBg;
  const ink = '#0B0B0B';
  const pl = luminance(primary);
  const al = luminance(accent);
  return {
    primary,
    primaryInk: pl !== null && pl > 0.45 ? ink : primary,
    accent,
    accentInk: al !== null && al > 0.55 ? ink : accent,
    bg,
    ink,
    muted: '#63635E',
    soft: '#F7F7F4',
    sand: accent,
    line: ink,
    hair: mix(ink, 16, bg),
    onPrimary: readableText(primary),
    onAccent: readableText(accent),
    font: `'${diseno?.tipografia && diseno.tipografia !== 'Inter' ? diseno.tipografia : 'Space Grotesk'}', system-ui, sans-serif`,
    display: `'Anton', 'Impact', sans-serif`,
    mono: `'JetBrains Mono', ui-monospace, monospace`,
  };
}
export type Theme = ReturnType<typeof hdTheme>;
export const display = (t: Theme, extra?: CSSProperties): CSSProperties => ({ fontFamily: t.display, textTransform: 'uppercase', letterSpacing: '-0.01em', ...extra });
export const mono = (t: Theme, extra?: CSSProperties): CSSProperties => ({ fontFamily: t.mono, ...extra });

export function useHdFont() {
  useEffect(() => {
    const id = 'hoodie-drop-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap';
    document.head.appendChild(link);
  }, []);
}

/** Botón de bloque: borde duro, mono en mayúsculas. */
export const btnCls = 'inline-flex items-center justify-center gap-2 rounded-none text-[12px] font-bold uppercase tracking-[0.08em] transition-[background-color,color,transform] active:translate-y-px';

/** Etiqueta de índice estilo "[ 01 ] TEXTO". */
export function Tag({ t, children, className = '', color }: { t: Theme; children: ReactNode; className?: string; color?: string }) {
  return <span className={`text-[11px] font-medium uppercase tracking-[0.06em] ${className}`} style={mono(t, { color: color || t.muted })}>{children}</span>;
}

export function Stars({ producto, t }: { producto: any; t: Theme; size?: number }) {
  const rating = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const count = Number(producto?.ratingCount || producto?.reviewsCount || 0);
  if (!(rating > 0 && count > 0)) return <Tag t={t}>Nuevo</Tag>;
  return <Tag t={t} color={t.ink}>★ {rating.toFixed(1)} ({count})</Tag>;
}

export type Service = { icon: string; label: string; sub: string };
export function buildServices(tienda: any, hasWhatsapp = false): Service[] {
  const s: Service[] = [];
  const envio = Number(tienda?.costoEnvioFijo || 0);
  if (tienda?.aceptaEnvio !== false) s.push({ icon: 'ph:truck-bold', label: 'Envío a domicilio', sub: envio > 0 ? `Desde ${hdMoney(envio)}` : 'Costo al pagar' });
  if (tienda?.aceptaRecojo) {
    const min = Number(tienda?.tiempoPreparacionMin || 0);
    s.push({ icon: 'ph:storefront-bold', label: 'Recojo en tienda', sub: min > 0 ? `Listo en ~${min} min` : 'Sin costo' });
  }
  if (hasWhatsapp) s.push({ icon: 'ph:chat-circle-dots-bold', label: 'Talla por WhatsApp', sub: 'Te asesoramos' });
  s.push({ icon: 'ph:lock-key-bold', label: 'Compra segura', sub: 'Confirmas antes de pagar' });
  s.push({ icon: 'ph:barcode-bold', label: 'Seguimiento', sub: 'Código de pedido' });
  return s.slice(0, 4);
}

// ─────────────────────────────────────────────────────────────── Marquesina ──
const MARQUEE_CSS = `
@keyframes hd-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.hd-marquee { animation: hd-marquee var(--hd-speed, 28s) linear infinite; }
.hd-marquee:hover { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .hd-marquee { animation: none; } }
`;
/** Cinta infinita (solo CSS: no re-renderiza nada). */
export function Marquee({ items, bg, color, t, big = false, speed = 28 }: { items: string[]; bg: string; color: string; t: Theme; big?: boolean; speed?: number }) {
  const list = items.filter(Boolean);
  if (!list.length) return null;
  const row = [...list, ...list, ...list, ...list];
  return (
    <div className="overflow-hidden" style={{ background: bg, color }}>
      <style>{MARQUEE_CSS}</style>
      <div className="hd-marquee flex w-max items-center" style={{ ['--hd-speed' as any]: `${speed}s` }}>
        {[0, 1].map((k) => (
          <div key={k} aria-hidden={k === 1} className="flex shrink-0 items-center">
            {row.map((txt, i) => (
              <span key={`${k}-${i}`} className={`flex items-center whitespace-nowrap ${big ? 'gap-8 px-8 py-4 text-[44px] leading-none sm:text-[64px]' : 'gap-5 px-5 py-2 text-[11px] font-medium uppercase tracking-[0.08em]'}`} style={big ? display(t) : mono(t)}>
                {txt}<span aria-hidden className={big ? 'text-[28px]' : ''}>✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Logo({ tienda, diseno, t, color, size = 30 }: { tienda: any; diseno: any; t: Theme; color: string; size?: number }) {
  const name = editable(diseno?.hoodieLogoText, storeNameOf(tienda));
  return tienda?.logo
    ? <img src={tienda.logo} alt={name} className="h-10 w-auto max-w-[170px] object-contain" />
    : <span className="max-w-[260px] truncate leading-none" style={display(t, { color, fontSize: size })}>{name}</span>;
}

// ─────────────────────────────────────────────────────────────── Header ──
/** Marquesina de anuncio + header de índice. Menús y búsqueda con estado aislado aquí. */
export function HdHeader({ tienda, slug, diseno, categories, t, cartCount, favCount, onOpenCart, onOpenFav, navigate }: any) {
  const [menu, setMenu] = useState<null | 'cats' | 'search' | 'mobile'>(null);
  const [q, setQ] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const cats: string[] = categories || [];
  const go = (to: string) => { setMenu(null); navigate(to); };
  const announce = optional(diseno?.hoodieAnnouncement, buildServices(tienda).slice(0, 3).map((s) => s.label).join('  ✦  '));

  useEffect(() => {
    if (menu !== 'cats') return;
    const close = (e: MouseEvent) => { const n = e.target as Node; if (!triggerRef.current?.contains(n) && !panelRef.current?.contains(n)) setMenu(null); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  const navBtn = (label: string, onClick: () => void, extra?: ReactNode) => (
    <button type="button" onClick={onClick} className="group inline-flex items-center gap-1 px-2 py-2 text-[12px] font-medium uppercase transition-colors" style={mono(t, { color: t.ink })}>
      <span className="opacity-40 transition-opacity group-hover:opacity-100">[</span>{label}{extra}<span className="opacity-40 transition-opacity group-hover:opacity-100">]</span>
    </button>
  );

  return (
    <header className="sticky top-0 z-40">
      {announce && !isOn(diseno?.hoodieAnnouncementHidden) && <Marquee t={t} items={announce.split(/\s*✦\s*/)} bg={t.primary} color={t.accent === t.primary ? t.onPrimary : t.accent} />}
      <div className="border-b" style={{ background: t.bg, borderColor: t.ink }}>
        <div className="mx-auto grid h-[68px] max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 lg:px-8">
          <nav className="flex items-center" aria-label="Principal">
            <button type="button" aria-label="Menú" onClick={() => setMenu(menu === 'mobile' ? null : 'mobile')} className="lg:hidden" style={{ color: t.ink }}><Icon icon={menu === 'mobile' ? 'ph:x-bold' : 'ph:list-bold'} width={24} /></button>
            <div className="hidden items-center lg:flex">
              {navBtn(editable(diseno?.hoodieNavShop, 'Tienda'), () => go(`/tienda/${slug}/catalogo`))}
              {cats.length > 0 && (
                <span ref={triggerRef as any}>
                  {navBtn(editable(diseno?.hoodieNavCategories, 'Categorías'), () => setMenu(menu === 'cats' ? null : 'cats'), <Icon icon="ph:arrow-down-bold" width={11} className={`ml-1 transition-transform ${menu === 'cats' ? 'rotate-180' : ''}`} />)}
                </span>
              )}
              {navBtn(editable(diseno?.hoodieNavContact, 'Ayuda'), () => go(`/tienda/${slug}/contacto`))}
            </div>
          </nav>

          <button type="button" onClick={() => go(`/tienda/${slug}`)} className="flex items-center justify-center"><Logo tienda={tienda} diseno={diseno} t={t} color={t.ink} /></button>

          <div className="flex items-center justify-end" style={{ color: t.ink }}>
            <span className="hidden sm:inline">{navBtn('Buscar', () => setMenu(menu === 'search' ? null : 'search'))}</span>
            <button type="button" aria-label="Buscar" onClick={() => setMenu(menu === 'search' ? null : 'search')} className="px-2 sm:hidden"><Icon icon="ph:magnifying-glass-bold" width={21} /></button>
            <span className="hidden md:inline">{navBtn(`Fav ${favCount}`, onOpenFav)}</span>
            <button type="button" onClick={onOpenCart} className={`${btnCls} ml-2 h-10 px-4`} style={{ background: t.primary, color: t.onPrimary, fontFamily: t.mono }}>Bolsa ({cartCount})</button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {menu === 'cats' && (
            <motion.div key="cats" ref={panelRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="hidden border-t lg:block" style={{ background: t.primary, color: t.onPrimary, borderColor: t.ink }}>
              <div className="mx-auto grid max-w-[1600px] grid-cols-3 gap-x-10 px-8 py-8">
                {cats.slice(0, 15).map((c, i) => (
                  <button key={c} type="button" onClick={() => go(`/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`)} className="group flex items-baseline gap-3 border-b py-2 text-left" style={{ borderColor: mix(t.onPrimary, 16, t.primary) }}>
                    <span className="text-[11px]" style={mono(t, { color: mix(t.onPrimary, 50, t.primary) })}>{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-[34px] leading-none transition-colors" style={display(t)}><span className="group-hover:[color:var(--hd-acc)]" style={{ ['--hd-acc' as any]: t.accent }}>{c}</span></span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          {menu === 'search' && (
            <motion.form key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} onSubmit={(e) => { e.preventDefault(); go(`/tienda/${slug}/catalogo${q.trim() ? `?search=${encodeURIComponent(q.trim())}` : ''}`); }} className="border-t" style={{ borderColor: t.ink, background: t.bg }} role="search">
              <div className="mx-auto flex h-20 max-w-[1600px] items-center gap-4 px-4 lg:px-8">
                <Tag t={t} color={t.ink}>[ Buscar ]</Tag>
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={editable(diseno?.hoodieSearchPlaceholder, 'HOODIES, POLOS, JOGGERS…')} aria-label="Buscar productos" className="min-w-0 flex-1 appearance-none border-0 bg-transparent bg-none p-0 text-[36px] uppercase outline-none placeholder:text-stone-400 focus:ring-0" style={display(t, { color: t.ink })} />
                <button type="submit" className={`${btnCls} h-12 px-6`} style={{ background: t.accent, color: t.onAccent, fontFamily: t.mono }}>Ir →</button>
              </div>
            </motion.form>
          )}
          {menu === 'mobile' && (
            <motion.nav key="mobile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="border-t px-4 pb-6 pt-2 lg:hidden" style={{ borderColor: t.ink, background: t.primary, color: t.onPrimary }} aria-label="Menú móvil">
              {[
                { label: 'Inicio', to: `/tienda/${slug}` },
                { label: editable(diseno?.hoodieNavShop, 'Tienda'), to: `/tienda/${slug}/catalogo` },
                ...cats.slice(0, 8).map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })),
                { label: editable(diseno?.hoodieNavContact, 'Ayuda'), to: `/tienda/${slug}/contacto` },
                { label: `Favoritos (${favCount})`, to: '__fav' },
              ].map((it, i) => (
                <button key={`${it.label}-${i}`} type="button" onClick={() => (it.to === '__fav' ? (setMenu(null), onOpenFav()) : go(it.to))} className="block w-full border-b py-3 text-left text-[30px] leading-none" style={display(t, { borderColor: mix(t.onPrimary, 16, t.primary) })}>{it.label}</button>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────── Footer ──
export function HdFooter({ tienda, slug, diseno, t, categories, navigate }: any) {
  const storeName = editable(diseno?.hoodieLogoText, storeNameOf(tienda));
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const waUrl = buildStorePurchaseWhatsappUrl(waNumber, 'Hola, tengo una consulta.');
  const address = [tienda?.direccion, tienda?.distrito].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  const horario = String(tienda?.horarioAtencion || '').trim();
  const socials = [
    tienda?.instagramUrl ? { label: 'Instagram', url: tienda.instagramUrl } : null,
    tienda?.tiktokUrl ? { label: 'TikTok', url: tienda.tiktokUrl } : null,
    tienda?.facebookUrl ? { label: 'Facebook', url: tienda.facebookUrl } : null,
    waUrl ? { label: 'WhatsApp', url: waUrl } : null,
  ].filter(Boolean) as { label: string; url: string }[];
  const cats: string[] = (categories || []).slice(0, 6);
  const about = String(diseno?.hoodieFooterText || tienda?.descripcionTienda || '').trim();
  const sub = mix(t.onPrimary, 55, t.primary);
  const cols = [
    ...(cats.length ? [{ title: 'Tienda', items: cats.map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })) }] : []),
    { title: 'Navegar', items: [{ label: 'Inicio', to: `/tienda/${slug}` }, { label: 'Catálogo', to: `/tienda/${slug}/catalogo` }, { label: 'Ayuda', to: `/tienda/${slug}/contacto` }] },
    { title: 'Pedidos', items: [{ label: 'Seguimiento', to: `/tienda/${slug}/seguimiento` }, { label: 'Preguntas', to: `/tienda/${slug}/contacto#faq` }] },
  ];
  return (
    <footer style={{ background: t.primary, color: t.onPrimary }}>
      <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)_1fr] lg:px-8">
        <div>
          <Tag t={t} color={sub}>[ {storeName} ]</Tag>
          {about && <p className="mt-4 max-w-xs whitespace-pre-line text-[14px] leading-relaxed" style={{ color: sub }}>{about}</p>}
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <Tag t={t} color={sub}>{col.title}</Tag>
            <ul className="mt-4 space-y-2">
              {col.items.map((it) => <li key={it.label}><button type="button" onClick={() => navigate(it.to)} className="text-left text-[20px] leading-tight transition-colors" style={display(t)}><span className="hover:[color:var(--hd-acc)]" style={{ ['--hd-acc' as any]: t.accent }}>{it.label}</span></button></li>)}
            </ul>
          </div>
        ))}
        {(socials.length > 0 || address || horario) && (
          <div>
            <Tag t={t} color={sub}>Síguenos</Tag>
            <ul className="mt-4 space-y-2 text-[13px]" style={mono(t)}>
              {socials.map((s) => <li key={s.label}><a href={s.url} target="_blank" rel="noopener noreferrer" className="uppercase underline-offset-4 hover:underline">↗ {s.label}</a></li>)}
              {address && <li className="pt-2" style={{ color: sub }}>{address}</li>}
              {horario && <li style={{ color: sub }}>{horario}</li>}
            </ul>
          </div>
        )}
      </div>
      <div className="overflow-hidden border-t px-2" style={{ borderColor: mix(t.onPrimary, 18, t.primary) }}>
        <p aria-hidden className="select-none whitespace-nowrap text-center leading-[0.82]" style={display(t, { fontSize: 'clamp(72px, 19vw, 360px)', color: t.bg })}>{storeName}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 lg:px-8" style={mono(t, { color: sub, fontSize: 11 })}>
        <span>© {new Date().getFullYear()} {storeName.toUpperCase()}</span>
        <span>{String(tienda?.distrito || '').toUpperCase()}</span>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────── Product card ──
/**
 * Tarjeta cuadrada de bordes duros. Hover: segunda foto y barra inferior invertida.
 * Cantidad con estado propio. Con variantes (talla/color) lleva a elegir en la ficha.
 */
export function HdProductCard({ producto, slug, t, onOpen, onAdd, index }: { producto: any; slug: string; t: Theme; onOpen: () => void; onAdd: (qty: number) => void; index?: number }) {
  const pricing = getProductPricing(producto);
  const stock = Number(producto?.stock ?? 1);
  const isOut = stock <= 0;
  const hasVariants = Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const colors = getFashionColors(producto).slice(0, 5);
  const extra = Array.isArray(producto?.imagenesExtra) ? producto.imagenesExtra.map((x: any) => (typeof x === 'string' ? x : x?.url)).filter(Boolean) : [];
  const alt = extra.find((u: string) => u !== producto?.imagenUrl) || (colors[0] ? getFashionColorGallery(producto, colors[0].name).find((u) => u !== producto?.imagenUrl) : '') || '';
  const [qty, setQty] = useState(1);
  const [imgFailed, setImgFailed] = useState(false); // URL rota → se muestra el placeholder, no el texto alt

  return (
    <article className="group relative flex h-full cursor-pointer flex-col" style={{ background: t.bg }} onClick={onOpen}>
      <div className="relative aspect-square overflow-hidden" style={{ background: t.soft }}>
        {producto?.imagenUrl && !imgFailed ? (
          <>
            <img src={producto.imagenUrl} alt={producto.descripcion} loading="lazy" onError={() => setImgFailed(true)} className={`absolute inset-0 h-full w-full object-contain p-6 mix-blend-multiply transition-[opacity,transform] duration-500 group-hover:scale-[1.04] ${alt ? 'group-hover:opacity-0' : ''} ${isOut ? 'opacity-50 grayscale' : ''}`} />
            {alt && <img src={alt} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-contain p-6 opacity-0 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-100" />}
          </>
        ) : <div className="flex h-full items-center justify-center"><Icon icon="ph:hoodie-bold" width={70} style={{ color: mix(t.ink, 20, t.soft) }} /></div>}
        {index !== undefined && <span className="absolute bottom-3 left-3 text-[11px]" style={mono(t, { color: t.muted })}>{String(index + 1).padStart(3, '0')}</span>}
        <div className="absolute left-0 top-0 z-10 flex flex-col items-start">
          {pricing.enOferta && <span className="px-2 py-1 text-[11px] font-bold" style={mono(t, { background: t.accent, color: t.onAccent })}>-{pricing.porcentajeDescuento}%</span>}
          {isOut ? <span className="px-2 py-1 text-[11px] font-bold uppercase" style={mono(t, { background: t.ink, color: '#fff' })}>Agotado</span>
            : !hasVariants && stock <= 5 ? <span className="px-2 py-1 text-[11px] font-bold uppercase" style={mono(t, { background: t.ink, color: '#fff' })}>Últimas {stock}</span> : null}
        </div>
        <div className="absolute right-2 top-2 z-10 [&_button]:!rounded-none [&_button]:!shadow-none [&_button:nth-child(n+2)]:opacity-0 [&_button]:transition-opacity group-hover:[&_button:nth-child(n+2)]:opacity-100 [@media(hover:none)]:[&_button:nth-child(n+2)]:opacity-100" style={{ ['--tw-border-opacity' as any]: 1 }} onClick={(e) => e.stopPropagation()}>
          <ProductCardActions producto={producto} slug={slug} cp={t.primary} />
        </div>
      </div>

      <div className="flex flex-1 flex-col border-t p-4" style={{ borderColor: t.ink }}>
        <h3 title={producto?.descripcion} className="line-clamp-2 min-h-[36px] text-[13.5px] font-bold uppercase leading-[1.3]" style={{ color: t.ink }}>{producto?.descripcion}</h3>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="flex items-baseline gap-2 text-[14px] font-bold" style={mono(t, { color: t.ink })}>
            {hdMoney(pricing.precioFinal)}
            {pricing.enOferta && <span className="text-[11.5px] font-normal line-through" style={{ color: t.muted }}>{hdMoney(pricing.precioRegular)}</span>}
          </p>
          {colors.length > 1 ? <span className="flex gap-1">{colors.map((c) => <span key={c.name} title={c.name} className="h-3 w-3" style={{ background: c.hex, boxShadow: `inset 0 0 0 1px ${t.ink}` }} />)}</span> : <Stars producto={producto} t={t} />}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-4 sm:flex-row sm:items-stretch sm:gap-0" onClick={(e) => e.stopPropagation()}>
          {!hasVariants && !isOut && (
            <div className="flex h-10 w-full shrink-0 items-stretch border sm:w-[84px]" style={{ borderColor: t.ink }}>
              <button type="button" aria-label="Restar" onClick={() => setQty(Math.max(1, qty - 1))} className="w-7 text-[15px] font-bold" style={{ color: t.ink }}>−</button>
              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setQty(d === '' ? 1 : Math.max(1, parseInt(d, 10))); }} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[12.5px] font-bold outline-none focus:ring-0" style={mono(t, { color: t.ink })} />
              <button type="button" aria-label="Sumar" onClick={() => setQty(qty + 1)} className="w-7 text-[15px] font-bold" style={{ color: t.ink }}>+</button>
            </div>
          )}
          <button
            type="button"
            disabled={isOut}
            onClick={() => { if (isOut) return; if (hasVariants) onOpen(); else onAdd(Math.max(1, qty)); }}
            className={`${btnCls} h-10 w-full min-w-0 px-3 sm:w-auto sm:flex-1 disabled:cursor-not-allowed disabled:opacity-40 [&:not(:disabled):hover]:[background:var(--hd-acc)] [&:not(:disabled):hover]:[color:var(--hd-on-acc)]`}
            style={{ background: t.primary, color: t.onPrimary, fontFamily: t.mono, ['--hd-acc' as any]: t.accent, ['--hd-on-acc' as any]: t.onAccent }}
          >
            <span className="truncate">{isOut ? 'Agotado' : hasVariants ? 'Elegir talla →' : 'Agregar →'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────── Cart ──
export function HdCartModal({ isOpen, onClose, carrito, actualizarCantidad, onCheckout, t, tienda, diseno }: any) {
  const items: any[] = carrito || [];
  const total = items.reduce((a, it) => a + Number(it.precioUnitario || 0) * Number(it.cantidad || 1), 0);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(waNumber, 'x'));
  const pedirWa = () => {
    if (!items.length) return;
    const detail = items.map((it) => `• ${Number(it.cantidad || 1)} x ${it.descripcion} - ${hdMoney(Number(it.precioUnitario || 0) * Number(it.cantidad || 1))}`).join('\n');
    const url = buildStorePurchaseWhatsappUrl(waNumber, `Hola, quiero pedir en ${storeNameOf(tienda)}:\n\n${detail}\n\nTotal estimado: ${hdMoney(total)}`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button type="button" aria-label="Cerrar bolsa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-black/50" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.35, ease: hdEase }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col border-l" style={{ background: t.bg, borderColor: t.ink, fontFamily: t.font }} role="dialog" aria-label="Bolsa">
            <header className="flex items-center justify-between px-5 py-4" style={{ background: t.primary, color: t.onPrimary }}>
              <h2 className="text-[34px] leading-none" style={display(t)}>Bolsa ({items.length})</h2>
              <button type="button" aria-label="Cerrar" onClick={onClose}><Icon icon="ph:x-bold" width={24} /></button>
            </header>
            <div className="flex-1 overflow-y-auto">
              {!items.length ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <p className="text-[48px] leading-none" style={display(t, { color: t.ink })}>Vacía</p>
                  <Tag t={t} className="mt-3">[ Aún no agregas nada ]</Tag>
                  <button type="button" onClick={onClose} className={`${btnCls} mt-8 h-12 px-8`} style={{ background: t.accent, color: t.onAccent, fontFamily: t.mono }}>Ver el drop →</button>
                </div>
              ) : (
                <ul>
                  {items.map((item) => {
                    const id = item.cartId || item.id;
                    const qty = Number(item.cantidad || 1);
                    const price = Number(item.precioUnitario || 0);
                    return (
                      <li key={id} className="grid grid-cols-[92px_1fr] border-b" style={{ borderColor: t.ink }}>
                        <div className="aspect-square border-r" style={{ background: t.soft, borderColor: t.ink }}>{item.imagenUrl && <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-2 mix-blend-multiply" />}</div>
                        <div className="flex min-w-0 flex-col p-3">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="line-clamp-2 text-[12.5px] font-bold uppercase leading-snug" style={{ color: t.ink }}>{item.descripcion}</h3>
                            <button type="button" aria-label="Quitar" onClick={() => actualizarCantidad(id, 0)} className="shrink-0" style={{ color: t.ink }}><Icon icon="ph:x-bold" width={16} /></button>
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <div className="flex h-8 items-stretch border" style={{ borderColor: t.ink }}>
                              <button type="button" aria-label="Restar" onClick={() => actualizarCantidad(id, qty - 1)} className="w-7 font-bold" style={{ color: t.ink }}>−</button>
                              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); actualizarCantidad(id, d === '' ? 1 : parseInt(d, 10)); }} onFocus={(e) => e.currentTarget.select()} className="w-8 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[12px] font-bold outline-none focus:ring-0" style={mono(t, { color: t.ink })} />
                              <button type="button" aria-label="Sumar" onClick={() => actualizarCantidad(id, qty + 1)} className="w-7 font-bold" style={{ color: t.ink }}>+</button>
                            </div>
                            <span className="text-[14px] font-bold" style={mono(t, { color: t.ink })}>{hdMoney(price * qty)}</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {items.length > 0 && (
              <footer className="border-t p-5" style={{ borderColor: t.ink }}>
                <div className="flex items-baseline justify-between">
                  <Tag t={t} color={t.ink}>Subtotal</Tag>
                  <span className="text-[34px] leading-none" style={display(t, { color: t.ink })}>{hdMoney(total)}</span>
                </div>
                <Tag t={t} className="mt-1 block">Envío calculado al pagar</Tag>
                <button type="button" onClick={() => { onClose(); onCheckout(); }} className={`${btnCls} mt-5 h-14 w-full text-[14px]`} style={{ background: t.accent, color: t.onAccent, fontFamily: t.mono }}>Ir a pagar →</button>
                {hasWa && <button type="button" onClick={pedirWa} className={`${btnCls} mt-2 h-12 w-full border`} style={{ borderColor: t.ink, color: t.ink, fontFamily: t.mono }}>Pedir por WhatsApp</button>}
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
