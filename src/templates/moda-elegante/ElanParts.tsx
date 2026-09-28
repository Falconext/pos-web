import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { getProductPricing } from '@/templates/shared/pricing';
import { readableText } from '@/templates/shared/color';
import { getFashionColors } from '@/templates/urbano/fashionVariants';
import ProductCardActions from '@/components/tienda/ProductCardActions';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { elEase, mix } from './motion';

/**
 * Piezas base de la plantilla Moda Elegante (Élan): tema, barra de anuncios, header, footer,
 * tarjeta y carrito. Regla de la plantilla: nada inventado. Si un dato no existe en la tienda, la UI se oculta.
 */

export const elMoney = (v: any) => `S/ ${Number(v || 0).toFixed(2)}`;
export const editable = (v: any, fallback: string) => String(v || '').trim() || fallback;
export const storeNameOf = (tienda: any, fallback = 'Élan') => tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || fallback;
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

const BASE_BG = '#FFFFFF';

// ── Design tokens (negro + camel de la referencia; Playfair Display + Inter del design system) ──
export function elanTheme(diseno: any) {
  const primary = diseno?.colorPrimario || '#161412'; // negro cálido: botones, barra superior
  const accent = diseno?.colorAccento || '#8B6B4E';   // camel: etiquetas, ofertas, bandas arena
  const rawBg = String(diseno?.colorSecundario || '').trim();
  const bgLum = luminance(rawBg);
  // "Color de fondo" global: claro → tal cual; saturado u oscuro → tinte muy suave sobre blanco.
  const bg = !rawBg ? BASE_BG : bgLum !== null && bgLum < 0.78 ? mix(rawBg, 6, BASE_BG) : rawBg;
  const ink = '#161412';
  const pl = luminance(primary);
  const al = luminance(accent);
  const body = diseno?.tipografia || 'Inter';
  return {
    primary,
    accent,
    /** Principal/acento como texto sobre fondo claro: si son muy claros, caen a tinta. */
    primaryInk: pl !== null && pl > 0.45 ? ink : primary,
    accentInk: al !== null && al > 0.42 ? mix(accent, 55, ink) : accent,
    bg,
    ink,
    muted: '#77716B',
    /** Fondo de fotos y bloques neutros (piedra muy clara). */
    soft: mix(accent, 7, '#F4F2EF'),
    /** Arena: bandas beige de la referencia; sigue al color de acento. */
    sand: mix(accent, 16, '#FBF9F6'),
    line: mix(ink, 11, bg),
    onPrimary: readableText(primary),
    onAccent: readableText(accent),
    font: `'${body}', 'Helvetica Neue', system-ui, sans-serif`,
    display: `'Playfair Display', Georgia, 'Times New Roman', serif`,
  };
}
export type Theme = ReturnType<typeof elanTheme>;

/** Inyecta Playfair Display + Inter una sola vez. */
export function useElanFont() {
  useEffect(() => {
    const id = 'elan-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
}

/** Botón rectangular en mayúsculas de la referencia. */
export const btnCls = 'inline-flex items-center justify-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] transition-[filter,transform,background-color,color] duration-300 hover:brightness-[1.15] active:scale-[0.99]';
/** Etiqueta pequeña en mayúsculas (títulos de sección, eyebrows). */
export const labelCls = 'text-[11.5px] font-semibold uppercase tracking-[0.18em]';

/** Estrellas solo si hay reseñas reales (en la tarjeta no se muestra nada si no hay). */
export function Stars({ producto, t, size = 12 }: { producto: any; t: Theme; size?: number }) {
  const rating = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const count = Number(producto?.ratingCount || producto?.reviewsCount || 0);
  if (!(rating > 0 && count > 0)) return null;
  const r = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="flex" style={{ color: t.ink }}>
        {Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon={i < r ? 'solar:star-bold' : 'solar:star-linear'} width={size} style={i < r ? undefined : { color: t.line }} />)}
      </span>
      <span className="text-[11px]" style={{ color: t.muted }}>({count})</span>
    </span>
  );
}

/** Logo: imagen de la tienda o wordmark serif espaciado (como la referencia). */
export function Logo({ tienda, diseno, t, onClick, light = false, size = 'md' }: { tienda: any; diseno: any; t: Theme; onClick?: () => void; light?: boolean; size?: 'md' | 'lg' }) {
  const name = editable(diseno?.modaEleganteLogoText, storeNameOf(tienda));
  const color = light ? '#fff' : t.ink;
  const content = tienda?.logo ? (
    <img src={tienda.logo} alt={name} className={`${size === 'lg' ? 'h-12' : 'h-10'} w-auto max-w-[180px] object-contain`} />
  ) : (
    <span className={`block max-w-[64vw] truncate uppercase sm:max-w-[360px] ${size === 'lg' ? 'text-[24px] tracking-[0.3em]' : 'text-[21px] tracking-[0.34em] sm:text-[25px]'}`} style={{ fontFamily: t.display, color, paddingLeft: '0.34em' }}>{name}</span>
  );
  return onClick ? <button type="button" onClick={onClick} aria-label={`Inicio de ${name}`} className="flex shrink-0 items-center">{content}</button> : <div className="flex shrink-0 items-center">{content}</div>;
}

// ─────────────────────────────────────────────────────────── Beneficios ──
export type Service = { icon: string; label: string; sub: string };

/** Beneficios derivados de la configuración real de la tienda (nada de promesas inventadas). */
export function buildServices(tienda: any, hasWhatsapp = false): Service[] {
  const s: Service[] = [];
  const envio = Number(tienda?.costoEnvioFijo || 0);
  if (tienda?.aceptaEnvio !== false) s.push({ icon: 'solar:delivery-linear', label: 'Envío a domicilio', sub: envio > 0 ? `Desde ${elMoney(envio)}` : 'Costo al finalizar tu compra' });
  if (tienda?.aceptaRecojo) {
    const min = Number(tienda?.tiempoPreparacionMin || 0);
    s.push({ icon: 'solar:shop-2-linear', label: 'Recojo en tienda', sub: min > 0 ? `Listo en ~${min} min` : 'Sin costo de envío' });
  }
  s.push({ icon: 'solar:shield-check-linear', label: 'Compra segura', sub: 'Confirmas antes de pagar' });
  if (hasWhatsapp) s.push({ icon: 'solar:chat-round-dots-linear', label: 'Asesoría de estilo', sub: 'Te ayudamos por WhatsApp' });
  s.push({ icon: 'solar:map-arrow-square-linear', label: 'Seguimiento', sub: 'Código para tu pedido' });
  return s.slice(0, 4);
}

// ──────────────────────────────────────────────────── Barra de anuncios ──
/** Mensajes rotativos de la barra negra. Aislada: su intervalo solo re-renderiza este componente. */
function AnnouncementBar({ t, messages }: { t: Theme; messages: string[] }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (messages.length < 2 || paused) return;
    const id = window.setTimeout(() => setIdx((v) => (v + 1) % messages.length), 4500);
    return () => window.clearTimeout(id);
  }, [idx, paused, messages.length]);
  if (!messages.length) return null;
  const step = (d: number) => setIdx((v) => (v + d + messages.length) % messages.length);
  const arrow = (d: number, icon: string, label: string) => messages.length > 1 && (
    <button type="button" aria-label={label} onClick={() => step(d)} className="flex h-9 w-9 shrink-0 items-center justify-center opacity-80 transition-opacity hover:opacity-100">
      <Icon icon={icon} width={14} />
    </button>
  );
  return (
    <div className="relative z-40" style={{ background: t.primary, color: t.onPrimary }} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="mx-auto flex h-9 max-w-[1440px] items-center justify-center gap-2 px-2">
        {arrow(-1, 'solar:alt-arrow-left-linear', 'Mensaje anterior')}
        <div className="relative h-9 w-full max-w-[560px] overflow-hidden" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: elEase }} className="absolute inset-0 truncate px-1 text-center text-[10px] font-semibold uppercase leading-9 tracking-[0.12em] sm:text-[11px] sm:tracking-[0.2em]">
              {messages[idx]}
            </motion.p>
          </AnimatePresence>
        </div>
        {arrow(1, 'solar:alt-arrow-right-linear', 'Mensaje siguiente')}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── Header ──
/**
 * Barra de anuncios + header centrado (MENÚ · logo · íconos) + buscador de ancho completo.
 * Estado propio (menú lateral, búsqueda) aislado aquí.
 */
export function ElanHeader({ tienda, slug, diseno, categories, t, cartCount, favCount, onOpenCart, onOpenFav, navigate, showSearch = true }: any) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const cats: string[] = categories || [];
  const go = (to: string) => { setOpen(false); navigate(to); };
  const services = useMemo(() => buildServices(tienda), [tienda]);
  const messages = useMemo(() => {
    const custom = [1, 2, 3].map((n) => String(diseno?.[`modaEleganteTop${n}`] || '').trim()).filter(Boolean);
    if (custom.length) return custom;
    return services.slice(0, 3).map((s) => `${s.label} · ${s.sub}`);
  }, [diseno, services]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open]);

  const links = [
    { label: editable(diseno?.modaEleganteNavHome, 'Inicio'), to: `/tienda/${slug}` },
    { label: editable(diseno?.modaEleganteNavShop, 'Ver toda la tienda'), to: `/tienda/${slug}/catalogo` },
  ];
  const help = [
    { label: editable(diseno?.modaEleganteNavContact, 'Contacto'), to: `/tienda/${slug}/contacto` },
    { label: 'Preguntas frecuentes', to: `/tienda/${slug}/contacto#faq` },
    { label: 'Seguimiento de pedido', to: `/tienda/${slug}/seguimiento` },
  ];

  return (
    <>
      {!isOn(diseno?.modaEleganteTopHidden) && <AnnouncementBar t={t} messages={messages} />}
      <header className="sticky top-0 z-30 border-b backdrop-blur-md" style={{ borderColor: t.line, background: mix(t.bg, 94, 'transparent') }}>
        <div className="mx-auto grid h-[68px] max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 lg:h-[76px] lg:px-10">
          <button type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-label="Abrir menú" className="flex h-11 items-center gap-3 justify-self-start pr-2" style={{ color: t.ink }}>
            <Icon icon="solar:hamburger-menu-linear" width={22} />
            <span className="hidden text-[11.5px] font-semibold uppercase tracking-[0.18em] sm:inline">Menú</span>
          </button>
          <Logo tienda={tienda} diseno={diseno} t={t} onClick={() => go(`/tienda/${slug}`)} />
          <div className="flex items-center gap-0.5 justify-self-end">
            <IconBtn t={t} label="Seguimiento de pedido" icon="solar:user-linear" onClick={() => go(`/tienda/${slug}/seguimiento`)} className="hidden sm:flex" />
            <IconBtn t={t} label="Favoritos" icon="solar:heart-linear" onClick={onOpenFav} badge={favCount} />
            <IconBtn t={t} label="Bolsa de compras" icon="solar:bag-3-linear" onClick={onOpenCart} badge={cartCount} strong />
          </div>
        </div>
      </header>

      {showSearch && (
        <div className="mx-auto max-w-[1440px] px-4 pt-4 lg:px-10">
          <form onSubmit={(e) => { e.preventDefault(); go(`/tienda/${slug}/catalogo${q.trim() ? `?search=${encodeURIComponent(q.trim())}` : ''}`); }} className="flex h-12 items-center gap-3 border px-4 transition-colors focus-within:border-current" style={{ borderColor: t.line, color: t.ink, background: '#fff' }} role="search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={editable(diseno?.modaEleganteSearchPlaceholder, 'Busca prendas, calzado, accesorios…')} aria-label="Buscar productos" className="min-w-0 flex-1 appearance-none border-0 bg-transparent bg-none p-0 text-[13.5px] outline-none placeholder:text-stone-400 focus:ring-0" style={{ color: t.ink }} />
            <button type="submit" aria-label="Buscar" className="flex h-10 w-10 items-center justify-center" style={{ color: t.ink }}><Icon icon="solar:magnifer-linear" width={19} /></button>
          </form>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <>
            <motion.button type="button" aria-label="Cerrar menú" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-[2px]" />
            <motion.nav initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 32, stiffness: 280 }} className="fixed inset-y-0 left-0 z-50 flex w-[88%] max-w-[400px] flex-col" style={{ background: t.bg, fontFamily: t.font }} aria-label="Menú principal">
              <div className="flex h-[68px] items-center justify-between border-b px-6" style={{ borderColor: t.line }}>
                <span className={labelCls} style={{ color: t.ink }}>Menú</span>
                <button type="button" aria-label="Cerrar" onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center" style={{ color: t.ink }}><Icon icon="solar:close-square-linear" width={22} /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {links.map((it) => (
                  <button key={it.to} type="button" onClick={() => go(it.to)} className="flex w-full items-center justify-between py-3 text-left text-[22px] leading-tight" style={{ color: t.ink, fontFamily: t.display }}>
                    {it.label}<Icon icon="solar:arrow-right-linear" width={18} style={{ color: t.muted }} />
                  </button>
                ))}
                {cats.length > 0 && (
                  <>
                    <p className={`${labelCls} mt-8`} style={{ color: t.muted }}>{editable(diseno?.modaEleganteNavCategories, 'Categorías')}</p>
                    <ul className="mt-2">
                      {cats.slice(0, 16).map((c) => (
                        <li key={c}>
                          <button type="button" onClick={() => go(`/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`)} className="flex w-full items-center justify-between border-b py-3.5 text-left text-[14px]" style={{ color: t.ink, borderColor: t.line }}>
                            {c}<Icon icon="solar:alt-arrow-right-linear" width={15} style={{ color: t.muted }} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <p className={`${labelCls} mt-8`} style={{ color: t.muted }}>Ayuda</p>
                <ul className="mt-2">
                  {help.map((it) => (
                    <li key={it.to}><button type="button" onClick={() => go(it.to)} className="py-2.5 text-left text-[13.5px] hover:underline" style={{ color: t.ink }}>{it.label}</button></li>
                  ))}
                </ul>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function IconBtn({ t, label, icon, onClick, badge = 0, strong = false, className = 'flex' }: { t: Theme; label: string; icon: string; onClick: () => void; badge?: number; strong?: boolean; className?: string }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={`relative h-11 w-11 items-center justify-center transition-opacity hover:opacity-70 ${className}`} style={{ color: t.ink }}>
      <Icon icon={icon} width={22} />
      {badge > 0 && <span className="absolute right-1 top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[9.5px] font-bold" style={strong ? { background: t.primary, color: t.onPrimary } : { background: t.accent, color: t.onAccent }}>{badge}</span>}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────── Footer ──
export function ElanFooter({ tienda, slug, diseno, t, categories, navigate }: any) {
  const storeName = storeNameOf(tienda);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const waUrl = buildStorePurchaseWhatsappUrl(waNumber, 'Hola, tengo una consulta.');
  const address = (() => {
    const out: string[] = [];
    for (const raw of [tienda?.direccion, tienda?.distrito]) {
      const v = String(raw || '').trim();
      if (v && !out.some((x) => x.toLowerCase().includes(v.toLowerCase()))) out.push(v);
    }
    return out.join(', ');
  })();
  const horario = String(tienda?.horarioAtencion || '').trim();
  const socials = [
    tienda?.instagramUrl ? { icon: 'mdi:instagram', label: 'Instagram', url: tienda.instagramUrl } : null,
    tienda?.facebookUrl ? { icon: 'ic:baseline-facebook', label: 'Facebook', url: tienda.facebookUrl } : null,
    tienda?.tiktokUrl ? { icon: 'ic:baseline-tiktok', label: 'TikTok', url: tienda.tiktokUrl } : null,
    waUrl ? { icon: 'ic:baseline-whatsapp', label: 'WhatsApp', url: waUrl } : null,
  ].filter(Boolean) as { icon: string; label: string; url: string }[];
  const cats: string[] = (categories || []).slice(0, 7);
  const cols: { title: string; items: { label: string; to: string }[] }[] = [
    { title: 'Tienda', items: [...cats.map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })), { label: cats.length ? 'Ver todo' : 'Catálogo', to: `/tienda/${slug}/catalogo` }] },
    { title: 'Ayuda', items: [
      { label: 'Contacto', to: `/tienda/${slug}/contacto` },
      { label: 'Preguntas frecuentes', to: `/tienda/${slug}/contacto#faq` },
      { label: 'Seguimiento de pedido', to: `/tienda/${slug}/seguimiento` },
    ] },
  ];
  const tagline = optional(diseno?.modaEleganteFooterTagline, 'Moda atemporal.\nEstilo para cada día.');

  return (
    <footer className="border-t" style={{ borderColor: t.line, background: t.bg }}>
      <div className={`mx-auto grid max-w-[1440px] gap-10 px-4 py-14 sm:grid-cols-2 lg:px-10 ${address || horario ? 'lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]' : 'lg:grid-cols-[1.6fr_1fr_1fr]'}`}>
        <div>
          <Logo tienda={tienda} diseno={diseno} t={t} size="lg" />
          {tagline && <p className="mt-4 whitespace-pre-line text-[13px] leading-relaxed" style={{ color: t.muted }}>{tagline}</p>}
          {socials.length > 0 && (
            <div className="mt-5 flex gap-1">
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-60" style={{ color: t.ink }}>
                  <Icon icon={s.icon} width={19} />
                </a>
              ))}
            </div>
          )}
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <h4 className={labelCls} style={{ color: t.ink }}>{col.title}</h4>
            <ul className="mt-5 space-y-2.5 text-[13px]" style={{ color: t.muted }}>
              {col.items.map((it) => <li key={it.label}><button type="button" onClick={() => navigate(it.to)} className="text-left transition-colors hover:text-stone-900">{it.label}</button></li>)}
            </ul>
          </div>
        ))}
        {(address || horario) && (
          <div>
            <h4 className={labelCls} style={{ color: t.ink }}>Visítanos</h4>
            <ul className="mt-5 space-y-3 text-[13px]" style={{ color: t.muted }}>
              {address && <li className="flex gap-2.5"><Icon icon="solar:map-point-linear" width={16} className="mt-0.5 shrink-0" />{address}</li>}
              {horario && <li className="flex gap-2.5"><Icon icon="solar:clock-circle-linear" width={16} className="mt-0.5 shrink-0" />{horario}</li>}
            </ul>
          </div>
        )}
      </div>
      <div className="border-t" style={{ borderColor: t.line }}>
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-5 text-[11.5px] lg:px-10" style={{ color: t.muted }}>
          <p>© {new Date().getFullYear()} {storeName}. Todos los derechos reservados.</p>
          <button type="button" onClick={() => navigate(`/tienda/${slug}/seguimiento`)} className="hover:text-stone-900">Seguimiento de pedido</button>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────── Product card ──
/**
 * Tarjeta editorial (foto 4:5 sobre piedra clara, nombre, precio, colores). El "Agregar" rápido con
 * cantidad vive sobre la foto (hover en escritorio; botón de bolsa en táctil). Estado propio aislado.
 * Con variantes (talla/color) lleva a elegir en la ficha en vez de agregar a ciegas.
 */
export function ElanProductCard({ producto, slug, t, onOpen, onAdd, fit = 'cover' }: { producto: any; slug: string; t: Theme; onOpen: () => void; onAdd: (qty: number) => void; fit?: 'cover' | 'contain' }) {
  const pricing = getProductPricing(producto);
  const stock = Number(producto?.stock ?? 1);
  const isOut = stock <= 0;
  const hasVariants = Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const colors = getFashionColors(producto).slice(0, 5);
  const extra = Array.isArray(producto?.imagenesExtra) ? producto.imagenesExtra.map((x: any) => (typeof x === 'string' ? x : x?.url || x?.imagenUrl)).find((u: any) => u && u !== producto?.imagenUrl) : null;
  const [qty, setQty] = useState(1);
  const imgCls = fit === 'contain' ? 'object-contain p-5' : 'object-cover';

  const quick = (e: React.MouseEvent) => { e.stopPropagation(); if (isOut) return; if (hasVariants) onOpen(); else onAdd(Math.max(1, qty)); };

  return (
    <article className="group relative flex h-full cursor-pointer flex-col" onClick={onOpen}>
      <div className="relative aspect-[4/5] overflow-hidden" style={{ background: t.soft }}>
        {producto?.imagenUrl ? (
          <>
            <img src={producto.imagenUrl} alt={producto.descripcion} loading="lazy" className={`absolute inset-0 h-full w-full mix-blend-multiply transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.04] ${imgCls} ${extra ? 'group-hover:opacity-0' : ''} ${isOut ? 'opacity-50 grayscale' : ''}`} />
            {extra && <img src={extra} alt="" loading="lazy" className={`absolute inset-0 h-full w-full opacity-0 mix-blend-multiply transition-opacity duration-700 group-hover:opacity-100 ${imgCls}`} />}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center"><Icon icon="ph:coat-hanger-thin" width={64} style={{ color: mix(t.ink, 25, t.soft) }} /></div>
        )}

        <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
          {pricing.enOferta && <span className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ background: t.accent, color: t.onAccent }}>-{pricing.porcentajeDescuento}%</span>}
          {isOut ? <span className="bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: t.ink }}>Agotado</span>
            : !hasVariants && stock <= 3 ? <span className="bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: t.ink }}>Últimas {stock}</span> : null}
        </div>
        <div className="absolute right-2 top-2 z-10 [&_button:nth-child(n+2)]:opacity-0 [&_button]:transition-opacity group-hover:[&_button:nth-child(n+2)]:opacity-100 [@media(hover:none)]:[&_button:nth-child(n+2)]:hidden" onClick={(e) => e.stopPropagation()}>
          <ProductCardActions producto={producto} slug={slug} cp={t.primary} />
        </div>

        {/* Agregar rápido: barra sobre la foto (escritorio) */}
        {!isOut && (
          <div className="absolute inset-x-2 bottom-2 z-10 hidden translate-y-2 opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:hover)]:flex" onClick={(e) => e.stopPropagation()}>
            {!hasVariants && (
              <div className="flex h-10 w-[92px] shrink-0 items-center justify-between bg-white/95 px-1 backdrop-blur">
                <button type="button" aria-label="Restar" onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-8 w-7 items-center justify-center text-[15px]" style={{ color: t.muted }}>−</button>
                <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setQty(d === '' ? 1 : Math.max(1, parseInt(d, 10))); }} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[12.5px] font-semibold outline-none focus:ring-0" style={{ color: t.ink }} />
                <button type="button" aria-label="Sumar" onClick={() => setQty(qty + 1)} className="flex h-8 w-7 items-center justify-center text-[15px]" style={{ color: t.muted }}>+</button>
              </div>
            )}
            <button type="button" onClick={quick} className={`${btnCls} h-10 min-w-0 flex-1 px-3 text-[10.5px]`} style={{ background: t.primary, color: t.onPrimary }}>
              <span className="truncate">{hasVariants ? 'Elegir talla' : 'Agregar'}</span>
            </button>
          </div>
        )}
        {/* Táctil: botón de bolsa siempre visible */}
        {!isOut && (
          <button type="button" aria-label={hasVariants ? 'Elegir opciones' : 'Agregar a la bolsa'} onClick={quick} className="absolute bottom-2 right-2 z-10 hidden h-10 w-10 items-center justify-center bg-white/95 shadow-sm [@media(hover:none)]:flex" style={{ color: t.ink }}>
            <Icon icon={hasVariants ? 'solar:tuning-2-linear' : 'solar:bag-3-linear'} width={18} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col pt-3">
        <h3 title={producto?.descripcion} className="line-clamp-2 text-[13px] leading-snug" style={{ color: t.ink }}>{producto?.descripcion}</h3>
        <div className="mt-auto pt-1.5">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[13px] font-semibold" style={{ color: pricing.enOferta ? t.accentInk : t.ink }}>{elMoney(pricing.precioFinal)}</span>
            {pricing.enOferta && <span className="text-[12px] line-through" style={{ color: t.muted }}>{elMoney(pricing.precioRegular)}</span>}
          </div>
          {(colors.length > 0 || Number(producto?.ratingCount || 0) > 0) && (
            <div className="mt-2 flex items-center justify-between gap-2">
              {colors.length > 0 ? <div className="flex gap-1.5">{colors.map((c) => <span key={c.name} title={c.name} className="h-3 w-3 rounded-full" style={{ background: c.hex, boxShadow: `0 0 0 1px ${t.bg}, 0 0 0 2px ${mix(t.ink, 14, t.bg)}` }} />)}</div> : <span />}
              <Stars producto={producto} t={t} size={10} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────── Cart modal ──
export function ElanCartModal({ isOpen, onClose, carrito, actualizarCantidad, onCheckout, t, tienda, diseno }: any) {
  const items: any[] = carrito || [];
  const total = items.reduce((a, it) => a + Number(it.precioUnitario || 0) * Number(it.cantidad || 1), 0);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(waNumber, 'x'));
  const pedirWa = () => {
    if (!items.length) return;
    const detail = items.map((it) => `• ${Number(it.cantidad || 1)} x ${it.descripcion} - ${elMoney(Number(it.precioUnitario || 0) * Number(it.cantidad || 1))}`).join('\n');
    const url = buildStorePurchaseWhatsappUrl(waNumber, `Hola, quiero pedir estos productos en ${storeNameOf(tienda)}:\n\n${detail}\n\nTotal estimado: ${elMoney(total)}`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  const drawerStyle: CSSProperties = { background: t.bg, fontFamily: t.font };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button type="button" aria-label="Cerrar bolsa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-[2px]" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 280 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col shadow-2xl" style={drawerStyle} role="dialog" aria-label="Bolsa de compras">
            <header className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: t.line }}>
              <div>
                <h2 className="text-[24px] leading-none" style={{ color: t.ink, fontFamily: t.display }}>Tu bolsa</h2>
                <p className="mt-1.5 text-[11.5px] uppercase tracking-[0.14em]" style={{ color: t.muted }}>{items.length} {items.length === 1 ? 'artículo' : 'artículos'}</p>
              </div>
              <button type="button" aria-label="Cerrar" onClick={onClose} className="flex h-11 w-11 items-center justify-center" style={{ color: t.ink }}><Icon icon="solar:close-square-linear" width={22} /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {!items.length ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Icon icon="ph:bag-simple-thin" width={64} style={{ color: t.muted }} />
                  <h3 className="mt-5 text-[22px]" style={{ color: t.ink, fontFamily: t.display }}>Tu bolsa está vacía</h3>
                  <p className="mt-2 max-w-[260px] text-[13px]" style={{ color: t.muted }}>Descubre las piezas de la temporada.</p>
                  <button type="button" onClick={onClose} className={`${btnCls} mt-7 h-12 px-8`} style={{ background: t.primary, color: t.onPrimary }}>Seguir comprando</button>
                </div>
              ) : (
                <ul className="divide-y" style={{ borderColor: t.line }}>
                  {items.map((item) => {
                    const id = item.cartId || item.id;
                    const qty = Number(item.cantidad || 1);
                    const price = Number(item.precioUnitario || 0);
                    return (
                      <li key={id} className="relative grid grid-cols-[88px_1fr] gap-4 py-4" style={{ borderColor: t.line }}>
                        <div className="aspect-[4/5] w-[88px] overflow-hidden" style={{ background: t.soft }}>
                          {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-cover mix-blend-multiply" /> : <div className="flex h-full items-center justify-center"><Icon icon="ph:coat-hanger-thin" width={30} style={{ color: t.muted }} /></div>}
                        </div>
                        <div className="flex min-w-0 flex-col pr-7">
                          <h3 className="line-clamp-2 text-[13px] leading-snug" style={{ color: t.ink }}>{item.descripcion}</h3>
                          <p className="mt-1 text-[12px]" style={{ color: t.muted }}>{elMoney(price)}</p>
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex h-9 items-center border" style={{ borderColor: t.line }}>
                              <button type="button" aria-label="Restar" onClick={() => actualizarCantidad(id, qty - 1)} className="flex h-full w-8 items-center justify-center" style={{ color: t.muted }}>−</button>
                              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); actualizarCantidad(id, d === '' ? 1 : parseInt(d, 10)); }} onFocus={(e) => e.currentTarget.select()} className="w-8 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[12.5px] font-semibold outline-none focus:ring-0" style={{ color: t.ink }} />
                              <button type="button" aria-label="Sumar" onClick={() => actualizarCantidad(id, qty + 1)} className="flex h-full w-8 items-center justify-center" style={{ color: t.muted }}>+</button>
                            </div>
                            <span className="text-[13.5px] font-semibold" style={{ color: t.ink }}>{elMoney(price * qty)}</span>
                          </div>
                        </div>
                        <button type="button" aria-label="Quitar" onClick={() => actualizarCantidad(id, 0)} className="absolute right-0 top-4 flex h-8 w-8 items-center justify-center text-stone-400 transition-colors hover:text-stone-900"><Icon icon="solar:close-circle-linear" width={18} /></button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {items.length > 0 && (
              <footer className="border-t px-6 py-5" style={{ borderColor: t.line }}>
                <div className="mb-1 flex items-center justify-between">
                  <span className={labelCls} style={{ color: t.ink }}>Subtotal</span>
                  <span className="text-[20px] font-semibold" style={{ color: t.ink }}>{elMoney(total)}</span>
                </div>
                <p className="mb-4 text-[11.5px]" style={{ color: t.muted }}>El envío se calcula en el checkout según tu forma de entrega.</p>
                <button type="button" onClick={() => { onClose(); onCheckout(); }} className={`${btnCls} h-[52px] w-full`} style={{ background: t.primary, color: t.onPrimary }}>
                  Finalizar compra <Icon icon="solar:arrow-right-linear" width={16} />
                </button>
                {hasWa && (
                  <button type="button" onClick={pedirWa} className={`${btnCls} mt-2.5 h-12 w-full border`} style={{ borderColor: t.ink, color: t.ink }}>
                    <Icon icon="ic:baseline-whatsapp" width={17} /> Pedir por WhatsApp
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
