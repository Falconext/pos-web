import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { getProductPricing } from '@/templates/shared/pricing';
import { readableText } from '@/templates/shared/color';
import { getFashionColors } from '@/templates/urbano/fashionVariants';
import ProductCardActions from '@/components/tienda/ProductCardActions';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { mix, ndEase } from './motion';

import { sinStock, pocasUnidades } from '@/templates/shared/ventaSinStock';
/**
 * Piezas base de la plantilla Mueblería (Nórdica): tema, header, footer, tarjeta y carrito.
 * Regla de la plantilla: nada inventado. Si un dato no existe en la tienda, la UI se oculta.
 */

export const ndMoney = (v: any) => `S/ ${Number(v || 0).toFixed(2)}`;
export const editable = (v: any, fallback: string) => String(v || '').trim() || fallback;
export const storeNameOf = (tienda: any, fallback = 'Nórdica') => tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || fallback;
export const nameOf = (v: any): string => (v && typeof v === 'object' ? v.nombre || v.descripcion || '' : typeof v === 'string' ? v : '');
export const isOn = (v: any) => v === true || v === 'true' || v === '1';

/** Luminancia relativa (0–1) de un hex; null si no es un hex válido. */
function luminance(color: string): number | null {
  let hex = String(color || '').trim().replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const lin = (i: number) => { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(0) + 0.7152 * lin(2) + 0.0722 * lin(4);
}

const BASE_BG = '#F7F3EE'; // lino cálido de la referencia

// ── Design tokens (madera + lino + verde bosque de la referencia; neutros cálidos del design system) ──
export function nordicaTheme(diseno: any) {
  const primary = diseno?.colorPrimario || '#7A5A40'; // nogal (botones, marca)
  const accent = diseno?.colorAccento || '#3F4B3E';   // verde bosque (panel de valores, ofertas)
  // "Color de fondo" global: claro → tal cual; saturado u oscuro → tinte suave sobre el lino,
  // para que el texto oscuro y las tarjetas blancas sigan siendo legibles.
  const rawBg = String(diseno?.colorSecundario || '').trim();
  const bgLum = luminance(rawBg);
  const bg = !rawBg ? BASE_BG : bgLum !== null && bgLum < 0.78 ? mix(rawBg, 8, BASE_BG) : rawBg;
  const ink = '#2B2621';
  const primaryLum = luminance(primary);
  return {
    primary,
    /** Principal usado como texto/ícono sobre fondo claro: si es muy claro, cae a tinta. */
    primaryInk: primaryLum !== null && primaryLum > 0.45 ? ink : primary,
    accent,
    bg,
    ink,
    muted: '#857B72',
    soft: mix(ink, 5, bg),         // fondo de imagen de producto
    sand: mix(primary, 12, '#FBF8F4'), // botón "Agregar" (arena, como la referencia)
    line: mix(ink, 10, bg),
    onPrimary: readableText(primary),
    onAccent: readableText(accent),
    font: `'${diseno?.tipografia || 'Plus Jakarta Sans'}', 'Segoe UI', system-ui, sans-serif`,
    script: `'Caveat', cursive`,
  };
}
export type Theme = ReturnType<typeof nordicaTheme>;

/** Inyecta Plus Jakarta Sans + Caveat (notas manuscritas) una sola vez. */
export function useNordicaFont() {
  useEffect(() => {
    const id = 'nordica-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Caveat:wght@500;600&display=swap';
    document.head.appendChild(link);
  }, []);
}

/** Botón rectangular de la referencia: mayúsculas pequeñas, tracking amplio y flecha. */
export const btnCls = 'inline-flex items-center justify-center gap-2 rounded-[4px] text-[11.5px] font-semibold uppercase tracking-[0.14em] transition-[filter,transform] hover:brightness-110 active:scale-[0.98]';

/** Estrellas reales del producto; si aún no tiene reseñas, "Nuevo" (nunca estrellas de relleno). */
export function Stars({ producto, t, size = 12 }: { producto: any; t: Theme; size?: number }) {
  const rating = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const count = Number(producto?.ratingCount || producto?.reviewsCount || 0);
  if (!(rating > 0 && count > 0)) return <span className="text-[11px] font-medium" style={{ color: t.muted }}>Nuevo</span>;
  const r = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="flex" style={{ color: '#D9A43B' }}>
        {Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon={i < r ? 'solar:star-bold' : 'solar:star-linear'} width={size} style={i < r ? undefined : { color: t.line }} />)}
      </span>
      <span className="text-[11px]" style={{ color: t.muted }}>({count})</span>
    </span>
  );
}

function Wordmark({ tienda, diseno, t, onClick, center = false }: { tienda: any; diseno: any; t: Theme; onClick?: () => void; center?: boolean }) {
  const name = editable(diseno?.muebleriaLogoText, storeNameOf(tienda));
  const tagline = String(diseno?.muebleriaLogoTagline ?? '').trim();
  const content = tienda?.logo ? (
    <img src={tienda.logo} alt={name} className="h-10 w-auto max-w-[170px] object-contain" />
  ) : (
    <span className={`flex flex-col leading-none ${center ? 'items-center' : 'items-center'}`}>
      <span className="max-w-[200px] truncate text-[17px] font-medium uppercase tracking-[0.32em]" style={{ color: t.ink }}>{name}</span>
      {tagline && <span className="mt-1 text-[8.5px] font-medium uppercase tracking-[0.4em]" style={{ color: t.muted }}>{tagline}</span>}
    </span>
  );
  return onClick ? <button type="button" onClick={onClick} className="flex shrink-0 items-center">{content}</button> : <div className="flex shrink-0 items-center">{content}</div>;
}

// ─────────────────────────────────────────────────────────────── Header ──
/**
 * Barra de anuncio + header. Estado propio (menú de categorías, búsqueda, menú móvil)
 * aislado aquí: abrir un menú no re-renderiza la página.
 */
export function NordicaHeader({ tienda, slug, diseno, categories, t, cartCount, favCount, onOpenCart, onOpenFav, navigate, active }: any) {
  const [menu, setMenu] = useState<null | 'cats' | 'search' | 'mobile'>(null);
  const [q, setQ] = useState('');
  const catsRef = useRef<HTMLDivElement>(null);
  const cats: string[] = categories || [];
  const go = (to: string) => { setMenu(null); navigate(to); };
  const services = buildServices(tienda);
  const left = editable(diseno?.muebleriaTopLeft, services.slice(0, 2).map((s) => s.label).join(' · '));
  const right = String(diseno?.muebleriaTopRight ?? '').trim();

  useEffect(() => {
    if (menu !== 'cats') return;
    const close = (e: MouseEvent) => { if (!catsRef.current?.contains(e.target as Node)) setMenu(null); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  const navBtn = (label: string, key: string, to: string) => (
    <button key={key} type="button" onClick={() => go(to)} className="relative py-2 text-[13px] font-medium transition-colors hover:opacity-70" style={{ color: t.ink }}>
      {label}
      {active === key && <span className="absolute inset-x-0 -bottom-0.5 h-[1.5px]" style={{ background: t.ink }} />}
    </button>
  );

  return (
    <header className="sticky top-0 z-30">
      {!isOn(diseno?.muebleriaTopHidden) && (left || right) && (
        <div className="hidden text-[11.5px] sm:block" style={{ background: t.soft, color: mix(t.ink, 70, t.bg) }}>
          <div className="mx-auto flex h-9 max-w-[1280px] items-center justify-between px-4 lg:px-8">
            <span>{left}</span>
            {right && <span>{right}</span>}
          </div>
        </div>
      )}
      <div className="border-b backdrop-blur-md" style={{ borderColor: t.line, background: mix('#FFFFFF', 88, 'transparent') }}>
        <div className="mx-auto grid h-[68px] max-w-[1280px] grid-cols-[1fr_auto] items-center gap-6 px-4 lg:grid-cols-[1fr_auto_1fr] lg:px-8">
          <div className="justify-self-start"><Wordmark tienda={tienda} diseno={diseno} t={t} onClick={() => go(`/tienda/${slug}`)} /></div>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Principal">
            {navBtn(editable(diseno?.muebleriaNavHome, 'Inicio'), 'home', `/tienda/${slug}`)}
            {navBtn(editable(diseno?.muebleriaNavShop, 'Catálogo'), 'catalog', `/tienda/${slug}/catalogo`)}
            {cats.length > 0 && (
              <div ref={catsRef} className="relative">
                <button type="button" onClick={() => setMenu(menu === 'cats' ? null : 'cats')} aria-expanded={menu === 'cats'} className="inline-flex items-center gap-1 py-2 text-[13px] font-medium" style={{ color: t.ink }}>
                  {editable(diseno?.muebleriaNavCategories, 'Ambientes')}
                  <Icon icon="solar:alt-arrow-down-linear" width={14} className={`transition-transform ${menu === 'cats' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {menu === 'cats' && (
                    // Envoltorio: centra con translate de Tailwind y solo anima opacidad; el hijo anima `y`. Nunca ambos en el mismo nodo.
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="absolute left-1/2 top-full z-40 mt-3 w-64 -translate-x-1/2">
                    <motion.div initial={{ y: 8 }} animate={{ y: 0 }} exit={{ y: 6 }} transition={{ duration: 0.2, ease: ndEase }} className="rounded-[10px] border bg-white p-2 shadow-[0_24px_50px_-28px_rgba(43,38,33,0.45)]" style={{ borderColor: t.line }}>
                      {cats.slice(0, 12).map((c) => (
                        <button key={c} type="button" onClick={() => go(`/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`)} className="flex w-full items-center justify-between rounded-[6px] px-3 py-2.5 text-left text-[13px] hover:bg-black/[0.04]" style={{ color: t.ink }}>
                          {c}<Icon icon="solar:alt-arrow-right-linear" width={14} style={{ color: t.muted }} />
                        </button>
                      ))}
                    </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            {navBtn(editable(diseno?.muebleriaNavContact, 'Contacto'), 'contact', `/tienda/${slug}/contacto`)}
          </nav>

          <div className="flex items-center gap-1 justify-self-end">
            <IconBtn t={t} label="Buscar" icon="solar:magnifer-linear" onClick={() => setMenu(menu === 'search' ? null : 'search')} />
            <IconBtn t={t} label="Favoritos" icon="solar:heart-linear" onClick={onOpenFav} badge={favCount} />
            <IconBtn t={t} label="Carrito" icon="solar:bag-3-linear" onClick={onOpenCart} badge={cartCount} strong />
            <span className="lg:hidden"><IconBtn t={t} label="Menú" icon={menu === 'mobile' ? 'solar:close-circle-linear' : 'solar:hamburger-menu-linear'} onClick={() => setMenu(menu === 'mobile' ? null : 'mobile')} /></span>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {menu === 'search' && (
            <motion.form key="search" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: ndEase }} onSubmit={(e) => { e.preventDefault(); go(`/tienda/${slug}/catalogo${q.trim() ? `?search=${encodeURIComponent(q.trim())}` : ''}`); }} className="border-t" style={{ borderColor: t.line }} role="search">
              <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-3 px-4 lg:px-8">
                <Icon icon="solar:magnifer-linear" width={18} style={{ color: t.muted }} />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={editable(diseno?.muebleriaSearchPlaceholder, 'Busca sofás, mesas, lámparas…')} aria-label="Buscar productos" className="min-w-0 flex-1 appearance-none border-0 bg-transparent bg-none p-0 text-[14px] outline-none placeholder:text-stone-400 focus:ring-0" style={{ color: t.ink }} />
                <button type="submit" className={`${btnCls} h-9 px-4`} style={{ background: t.primary, color: t.onPrimary }}>Buscar</button>
              </div>
            </motion.form>
          )}
          {menu === 'mobile' && (
            <motion.nav key="mobile" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: ndEase }} className="border-t px-4 pb-4 pt-2 lg:hidden" style={{ borderColor: t.line }} aria-label="Menú móvil">
              {[
                { label: editable(diseno?.muebleriaNavHome, 'Inicio'), to: `/tienda/${slug}` },
                { label: editable(diseno?.muebleriaNavShop, 'Catálogo'), to: `/tienda/${slug}/catalogo` },
                ...cats.slice(0, 6).map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })),
                { label: editable(diseno?.muebleriaNavContact, 'Contacto'), to: `/tienda/${slug}/contacto` },
              ].map((it, i) => (
                <button key={`${it.label}-${i}`} type="button" onClick={() => go(it.to)} className="flex w-full items-center justify-between rounded-[6px] px-2 py-3 text-left text-[14px]" style={{ color: t.ink }}>
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

function IconBtn({ t, label, icon, onClick, badge = 0, strong = false }: { t: Theme; label: string; icon: string; onClick: () => void; badge?: number; strong?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-black/[0.04]" style={{ color: t.ink }}>
      <Icon icon={icon} width={21} />
      {badge > 0 && <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold" style={strong ? { background: t.primary, color: t.onPrimary } : { background: t.ink, color: '#fff' }}>{badge}</span>}
    </button>
  );
}

// ─────────────────────────────────────────────────────────── Beneficios ──
export type Service = { icon: string; label: string; sub: string };

/** Beneficios derivados de la configuración real de la tienda (nada de promesas inventadas). */
export function buildServices(tienda: any, hasWhatsapp = false): Service[] {
  const s: Service[] = [];
  const envio = Number(tienda?.costoEnvioFijo || 0);
  if (tienda?.aceptaEnvio !== false) s.push({ icon: 'solar:delivery-linear', label: 'Entrega a domicilio', sub: envio > 0 ? `Desde ${ndMoney(envio)}` : 'Costo al finalizar tu compra' });
  if (tienda?.aceptaRecojo) {
    const min = Number(tienda?.tiempoPreparacionMin || 0);
    s.push({ icon: 'solar:shop-2-linear', label: 'Recojo en tienda', sub: min > 0 ? `Listo en ~${min} min` : 'Sin costo de envío' });
  }
  if (hasWhatsapp) s.push({ icon: 'solar:ruler-pen-linear', label: 'Asesoría de medidas', sub: 'Te ayudamos por WhatsApp' });
  s.push({ icon: 'solar:shield-check-linear', label: 'Compra segura', sub: 'Confirmas antes de pagar' });
  s.push({ icon: 'solar:map-arrow-square-linear', label: 'Seguimiento', sub: 'Código para tu pedido' });
  return s.slice(0, 4);
}

// ─────────────────────────────────────────────────────────────── Footer ──
export function NordicaFooter({ tienda, slug, diseno, t, categories, navigate }: any) {
  const storeName = storeNameOf(tienda);
  const waUrl = buildStorePurchaseWhatsappUrl(tienda?.whatsappTienda ?? diseno?.whatsappTienda, 'Hola, tengo una consulta.');
  const address = [tienda?.direccion, tienda?.distrito].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  const horario = String(tienda?.horarioAtencion || '').trim();
  const socials = [
    tienda?.instagramUrl ? { icon: 'mdi:instagram', label: 'Instagram', url: tienda.instagramUrl } : null,
    tienda?.facebookUrl ? { icon: 'ic:baseline-facebook', label: 'Facebook', url: tienda.facebookUrl } : null,
    tienda?.tiktokUrl ? { icon: 'ic:baseline-tiktok', label: 'TikTok', url: tienda.tiktokUrl } : null,
    waUrl ? { icon: 'ic:baseline-whatsapp', label: 'WhatsApp', url: waUrl } : null,
  ].filter(Boolean) as { icon: string; label: string; url: string }[];
  const cats: string[] = (categories || []).slice(0, 7);
  const cols: { title: string; items: { label: string; to: string }[] }[] = [
    ...(cats.length ? [{ title: 'Ambientes', items: [...cats.map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })), { label: 'Ver todo', to: `/tienda/${slug}/catalogo` }] }] : []),
    { title: 'Tienda', items: [
      { label: 'Inicio', to: `/tienda/${slug}` },
      { label: 'Catálogo', to: `/tienda/${slug}/catalogo` },
      { label: 'Contacto', to: `/tienda/${slug}/contacto` },
    ] },
    { title: 'Atención', items: [
      { label: 'Seguimiento de pedido', to: `/tienda/${slug}/seguimiento` },
      { label: 'Preguntas frecuentes', to: `/tienda/${slug}/contacto#faq` },
    ] },
  ];
  const about = String(diseno?.muebleriaFooterText || tienda?.descripcionTienda || '').trim();
  const closing = String(diseno?.muebleriaFooterClosing ?? '').trim();

  return (
    <footer className="border-t bg-white" style={{ borderColor: t.line }}>
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-[1.6fr_repeat(4,1fr)] lg:px-8">
        <div>
          <div className="inline-flex"><Wordmark tienda={tienda} diseno={diseno} t={t} /></div>
          {about && <p className="mt-5 max-w-xs whitespace-pre-line text-[13px] leading-relaxed" style={{ color: t.muted }}>{about}</p>}
          {socials.length > 0 && (
            <div className="mt-6 flex gap-1.5">
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/[0.05]" style={{ color: t.ink }}>
                  <Icon icon={s.icon} width={18} />
                </a>
              ))}
            </div>
          )}
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="text-[13px] font-semibold" style={{ color: t.ink }}>{col.title}</h4>
            <ul className="mt-4 space-y-2.5 text-[13px]" style={{ color: t.muted }}>
              {col.items.map((it) => <li key={it.label}><button type="button" onClick={() => navigate(it.to)} className="text-left transition-colors hover:text-stone-900">{it.label}</button></li>)}
            </ul>
          </div>
        ))}
        {(address || horario) && (
          <div>
            <h4 className="text-[13px] font-semibold" style={{ color: t.ink }}>Visítanos</h4>
            <ul className="mt-4 space-y-2.5 text-[13px]" style={{ color: t.muted }}>
              {address && <li className="flex gap-2"><Icon icon="solar:map-point-linear" width={16} className="mt-0.5 shrink-0" />{address}</li>}
              {horario && <li className="flex gap-2"><Icon icon="solar:clock-circle-linear" width={16} className="mt-0.5 shrink-0" />{horario}</li>}
            </ul>
          </div>
        )}
      </div>
      <div className="border-t" style={{ borderColor: t.line }}>
        <div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-2 px-4 py-5 text-[12px] sm:flex-row lg:px-8" style={{ color: t.muted }}>
          <p>© {new Date().getFullYear()} {storeName}. Todos los derechos reservados.</p>
          {closing && <p>{closing}</p>}
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────── Product card ──
/**
 * Tarjeta de producto. Estado propio (cantidad) aislado en la tarjeta.
 * Con variantes (color/material/medida) no agrega a ciegas: lleva a elegir en la ficha.
 */
export function NordicaProductCard({ producto, slug, t, onOpen, onAdd }: { producto: any; slug: string; t: Theme; onOpen: () => void; onAdd: (qty: number) => void }) {
  const pricing = getProductPricing(producto);
  const stock = Number(producto?.stock ?? 1);
  const isOut = sinStock(stock);
  const hasVariants = Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const colors = getFashionColors(producto).slice(0, 4);
  const subtitle = nameOf(producto?.categoria) || nameOf(producto?.marca);
  const [qty, setQty] = useState(1);

  return (
    <article className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[10px] border bg-white transition-shadow duration-300 hover:shadow-[0_22px_44px_-30px_rgba(43,38,33,0.45)]" style={{ borderColor: t.line }} onClick={onOpen}>
      <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
        {pricing.enOferta && <span className="rounded-[4px] px-2 py-1 text-[10.5px] font-semibold" style={{ background: t.accent, color: t.onAccent }}>-{pricing.porcentajeDescuento}%</span>}
        {isOut ? <span className="rounded-[4px] bg-stone-800 px-2 py-1 text-[10.5px] font-semibold text-white">Agotado</span>
          : !hasVariants && pocasUnidades(stock) ? <span className="rounded-[4px] bg-white/90 px-2 py-1 text-[10.5px] font-semibold" style={{ color: t.ink }}>Últimas {stock}</span> : null}
      </div>
      <div className="absolute right-3 top-3 z-10 [&_button:nth-child(n+2)]:opacity-0 [&_button]:transition-opacity group-hover:[&_button:nth-child(n+2)]:opacity-100 [@media(hover:none)]:[&_button:nth-child(n+2)]:opacity-100" onClick={(e) => e.stopPropagation()}>
        <ProductCardActions producto={producto} slug={slug} cp={t.primary} />
      </div>

      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden" style={{ background: t.soft }}>
        {producto?.imagenUrl ? (
          <img src={producto.imagenUrl} alt={producto.descripcion} loading="lazy" className={`h-full w-full object-contain p-5 mix-blend-multiply transition-transform duration-700 group-hover:scale-[1.05] ${isOut ? 'opacity-50 grayscale' : ''}`} />
        ) : (
          <Icon icon="solar:sofa-2-linear" width={64} style={{ color: mix(t.ink, 22, t.bg) }} />
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 title={producto?.descripcion} className="line-clamp-2 min-h-[38px] text-[14px] font-medium leading-snug" style={{ color: t.ink }}>{producto?.descripcion}</h3>
        {subtitle && <p className="mt-0.5 truncate text-[11.5px]" style={{ color: t.muted }}>{subtitle}</p>}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[15px] font-semibold" style={{ color: t.ink }}>{ndMoney(pricing.precioFinal)}</span>
          {pricing.enOferta && <span className="text-[12px] line-through" style={{ color: t.muted }}>{ndMoney(pricing.precioRegular)}</span>}
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <Stars producto={producto} t={t} />
          {colors.length > 0 && (
            <div className="flex -space-x-1">{colors.map((c) => <span key={c.name} title={c.name} className="h-3.5 w-3.5 rounded-full ring-2 ring-white" style={{ background: c.hex }} />)}</div>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-stretch gap-2 pt-4 sm:flex-nowrap" onClick={(e) => e.stopPropagation()}>
          {!hasVariants && !isOut && (
            <div className="flex h-10 w-full shrink-0 items-center justify-between rounded-[4px] px-1 sm:w-[78px]" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
              <button type="button" aria-label="Restar" onClick={() => setQty(Math.max(1, qty - 1))} className="px-1.5 text-base leading-none" style={{ color: t.muted }}>−</button>
              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setQty(d === '' ? 1 : Math.max(1, parseInt(d, 10))); }} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[13px] font-semibold outline-none focus:ring-0" style={{ color: t.ink }} />
              <button type="button" aria-label="Sumar" onClick={() => setQty(qty + 1)} className="px-1.5 text-base leading-none" style={{ color: t.muted }}>+</button>
            </div>
          )}
          <button
            type="button"
            disabled={isOut}
            onClick={() => { if (isOut) return; if (hasVariants) onOpen(); else onAdd(Math.max(1, qty)); }}
            className={`${btnCls} h-10 min-w-0 flex-1 basis-full px-3 disabled:cursor-not-allowed disabled:opacity-50 sm:basis-auto`}
            style={{ background: t.sand, color: t.ink }}
          >
            <span className="truncate">{isOut ? 'Agotado' : hasVariants ? 'Ver opciones' : 'Agregar'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────── Cart modal ──
export function NordicaCartModal({ isOpen, onClose, carrito, actualizarCantidad, onCheckout, t, tienda, diseno }: any) {
  const items: any[] = carrito || [];
  const total = items.reduce((a, it) => a + Number(it.precioUnitario || 0) * Number(it.cantidad || 1), 0);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(waNumber, 'x'));
  const pedirWa = () => {
    if (!items.length) return;
    const detail = items.map((it) => `• ${Number(it.cantidad || 1)} x ${it.descripcion} - ${ndMoney(Number(it.precioUnitario || 0) * Number(it.cantidad || 1))}`).join('\n');
    const url = buildStorePurchaseWhatsappUrl(waNumber, `Hola, quiero pedir estos productos en ${storeNameOf(tienda)}:\n\n${detail}\n\nTotal estimado: ${ndMoney(total)}`);
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
                <h2 className="text-[20px] font-medium tracking-tight" style={{ color: t.ink }}>Tu carrito</h2>
                <p className="mt-0.5 text-[12.5px]" style={{ color: t.muted }}>{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
              </div>
              <button type="button" aria-label="Cerrar" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/[0.05]" style={{ color: t.ink }}><Icon icon="solar:close-circle-linear" width={22} /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {!items.length ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white" style={{ color: t.primaryInk }}><Icon icon="solar:sofa-2-linear" width={38} /></span>
                  <h3 className="mt-5 text-[17px] font-medium" style={{ color: t.ink }}>Tu carrito está vacío</h3>
                  <p className="mt-1.5 max-w-[260px] text-[13px]" style={{ color: t.muted }}>Explora el catálogo y encuentra piezas para cada ambiente.</p>
                  <button type="button" onClick={onClose} className={`${btnCls} mt-6 h-11 px-6`} style={{ background: t.primary, color: t.onPrimary }}>Seguir comprando</button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => {
                    const id = item.cartId || item.id;
                    const qty = Number(item.cantidad || 1);
                    const price = Number(item.precioUnitario || 0);
                    return (
                      <li key={id} className="relative grid grid-cols-[84px_1fr] gap-3 rounded-[10px] border bg-white p-3" style={{ borderColor: t.line }}>
                        <button type="button" aria-label="Quitar" onClick={() => actualizarCantidad(id, 0)} className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-500"><Icon icon="solar:trash-bin-minimalistic-linear" width={16} /></button>
                        <div className="flex h-[84px] items-center justify-center overflow-hidden rounded-[6px]" style={{ background: t.soft }}>
                          {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-1.5 mix-blend-multiply" /> : <Icon icon="solar:sofa-2-linear" width={30} style={{ color: t.muted }} />}
                        </div>
                        <div className="min-w-0 pr-7">
                          <h3 className="line-clamp-2 text-[13px] font-medium leading-snug" style={{ color: t.ink }}>{item.descripcion}</h3>
                          <div className="mt-2.5 flex items-center justify-between">
                            <div className="flex h-9 items-center overflow-hidden rounded-[4px]" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                              <button type="button" aria-label="Restar" onClick={() => actualizarCantidad(id, qty - 1)} className="flex w-8 items-center justify-center text-base" style={{ color: t.muted }}>−</button>
                              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); actualizarCantidad(id, d === '' ? 1 : parseInt(d, 10)); }} onFocus={(e) => e.currentTarget.select()} className="w-9 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[13px] font-semibold outline-none focus:ring-0" style={{ color: t.ink }} />
                              <button type="button" aria-label="Sumar" onClick={() => actualizarCantidad(id, qty + 1)} className="flex w-8 items-center justify-center text-base" style={{ color: t.muted }}>+</button>
                            </div>
                            <span className="text-[14px] font-semibold" style={{ color: t.ink }}>{ndMoney(price * qty)}</span>
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
                  <span className="text-[21px] font-semibold" style={{ color: t.ink }}>{ndMoney(total)}</span>
                </div>
                <p className="mb-4 text-[11.5px]" style={{ color: t.muted }}>El envío se calcula en el checkout según tu forma de entrega.</p>
                <button type="button" onClick={() => { onClose(); onCheckout(); }} className={`${btnCls} h-12 w-full`} style={{ background: t.primary, color: t.onPrimary }}>
                  Ir a pagar <Icon icon="solar:arrow-right-linear" width={16} />
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
