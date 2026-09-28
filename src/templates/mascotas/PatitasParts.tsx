import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { getProductPricing } from '@/templates/shared/pricing';
import { readableText } from '@/templates/shared/color';
import { getFashionColors } from '@/templates/urbano/fashionVariants';
import ProductCardActions from '@/components/tienda/ProductCardActions';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { mix, ptEase } from './motion';

/**
 * Piezas base de la plantilla Mascotas (Patitas): tema, header, footer, tarjeta y carrito.
 * Regla de la plantilla: nada inventado. Si un dato no existe en la tienda, la UI se oculta.
 */

export const ptMoney = (v: any) => `S/ ${Number(v || 0).toFixed(2)}`;
export const editable = (v: any, fallback: string) => String(v || '').trim() || fallback;
export const storeNameOf = (tienda: any, fallback = 'Patitas') => tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || fallback;
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

const BASE_BG = '#FBF6EE'; // crema cálida de la referencia
const SKY = '#BFD8EC';     // celeste suave de los círculos de la referencia (neutro, no es color de marca)

// ── Design tokens (verde salvia + naranja de la referencia; Nunito/Fredoka del design system) ──
export function patitasTheme(diseno: any) {
  const primary = diseno?.colorPrimario || '#5E7E4F'; // verde salvia (botones, barra superior, footer)
  const accent = diseno?.colorAccento || '#EE7B37';   // naranja (palabra destacada, ahorro, badges)
  const rawBg = String(diseno?.colorSecundario || '').trim();
  const bgLum = luminance(rawBg);
  // "Color de fondo" global: claro → tal cual; saturado u oscuro → tinte suave sobre la crema.
  const bg = !rawBg ? BASE_BG : bgLum !== null && bgLum < 0.78 ? mix(rawBg, 8, BASE_BG) : rawBg;
  const ink = '#2A2E26';
  const lum = (c: string) => luminance(c);
  const pl = lum(primary);
  const al = lum(accent);
  return {
    primary,
    accent,
    /** Principal/acento como texto sobre fondo claro: si son muy claros, caen a tinta. */
    primaryInk: pl !== null && pl > 0.45 ? ink : primary,
    accentInk: al !== null && al > 0.5 ? ink : accent,
    bg,
    ink,
    muted: '#76786E',
    soft: mix(ink, 4, bg),
    line: mix(ink, 9, bg),
    sky: SKY,
    onPrimary: readableText(primary),
    onAccent: readableText(accent),
    /** Colores de los círculos de categoría (ritmo de la referencia: verde, celeste, naranja…). */
    circles: [mix(primary, 38, '#fff'), SKY, mix(accent, 55, '#fff'), mix(primary, 26, '#fff'), mix(SKY, 70, '#fff'), mix(accent, 80, '#fff')],
    font: `'${diseno?.tipografia || 'Nunito'}', 'Segoe UI', system-ui, sans-serif`,
    logoFont: `'Fredoka', '${diseno?.tipografia || 'Nunito'}', system-ui, sans-serif`,
  };
}
export type Theme = ReturnType<typeof patitasTheme>;

/** Inyecta Nunito + Fredoka una sola vez. */
export function usePatitasFont() {
  useEffect(() => {
    const id = 'patitas-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Fredoka:wght@500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
}

/** Botón píldora de la referencia. */
export const btnCls = 'inline-flex items-center justify-center gap-2 rounded-full text-[13.5px] font-bold transition-[filter,transform] hover:brightness-110 active:scale-[0.98]';

/** Estrellas reales; si aún no tiene reseñas, "Nuevo" (nunca estrellas de relleno). */
export function Stars({ producto, t, size = 12 }: { producto: any; t: Theme; size?: number }) {
  const rating = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const count = Number(producto?.ratingCount || producto?.reviewsCount || 0);
  if (!(rating > 0 && count > 0)) return <span className="rounded-full px-2 py-0.5 text-[10.5px] font-bold" style={{ background: mix(t.primary, 12, '#fff'), color: t.primaryInk }}>Nuevo</span>;
  const r = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="flex" style={{ color: '#F2A93B' }}>
        {Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon={i < r ? 'solar:star-bold' : 'solar:star-linear'} width={size} style={i < r ? undefined : { color: t.line }} />)}
      </span>
      <span className="text-[11px] font-semibold" style={{ color: t.muted }}>({count})</span>
    </span>
  );
}

export function Logo({ tienda, diseno, t, onClick, light = false }: { tienda: any; diseno: any; t: Theme; onClick?: () => void; light?: boolean }) {
  const name = editable(diseno?.mascotasLogoText, storeNameOf(tienda));
  const content = tienda?.logo ? (
    <img src={tienda.logo} alt={name} className="h-10 w-auto max-w-[170px] object-contain" />
  ) : (
    <span className="flex items-center gap-2">
      <Icon icon="ph:paw-print-fill" width={28} style={{ color: light ? '#fff' : t.primaryInk }} />
      <span className="max-w-[200px] truncate text-[23px] font-semibold tracking-[-0.01em]" style={{ fontFamily: t.logoFont, color: light ? '#fff' : t.primaryInk }}>{name}</span>
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
  if (tienda?.aceptaEnvio !== false) s.push({ icon: 'solar:delivery-linear', label: 'Delivery a domicilio', sub: envio > 0 ? `Desde ${ptMoney(envio)}` : 'Costo al finalizar tu compra' });
  if (tienda?.aceptaRecojo) {
    const min = Number(tienda?.tiempoPreparacionMin || 0);
    s.push({ icon: 'solar:shop-2-linear', label: 'Recojo en tienda', sub: min > 0 ? `Listo en ~${min} min` : 'Sin costo de envío' });
  }
  if (hasWhatsapp) s.push({ icon: 'solar:chat-round-like-linear', label: 'Te asesoramos', sub: 'Por WhatsApp' });
  s.push({ icon: 'solar:shield-check-linear', label: 'Compra segura', sub: 'Confirmas antes de pagar' });
  s.push({ icon: 'solar:map-arrow-square-linear', label: 'Seguimiento', sub: 'Código para tu pedido' });
  return s.slice(0, 4);
}

// ─────────────────────────────────────────────────────────────── Header ──
/**
 * Barra superior + header. Estado propio (menú de categorías, búsqueda, menú móvil) aislado aquí.
 */
export function PatitasHeader({ tienda, slug, diseno, categories, t, cartCount, favCount, onOpenCart, onOpenFav, navigate, active }: any) {
  const [menu, setMenu] = useState<null | 'cats' | 'search' | 'mobile'>(null);
  const [q, setQ] = useState('');
  const catsRef = useRef<HTMLDivElement>(null);
  const cats: string[] = categories || [];
  const go = (to: string) => { setMenu(null); navigate(to); };
  const services = buildServices(tienda);
  const topText = editable(diseno?.mascotasTopText, services.slice(0, 2).map((s) => s.label).join('  ·  '));

  useEffect(() => {
    if (menu !== 'cats') return;
    const close = (e: MouseEvent) => { if (!catsRef.current?.contains(e.target as Node)) setMenu(null); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  const navBtn = (label: string, key: string, to: string) => (
    <button key={key} type="button" onClick={() => go(to)} className="relative rounded-full px-3.5 py-2 text-[14px] font-bold transition-colors hover:bg-black/[0.04]" style={{ color: active === key ? t.primaryInk : t.ink }}>
      {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-30">
      {!isOn(diseno?.mascotasTopHidden) && topText && (
        <div className="px-4 py-2 text-center text-[12.5px] font-semibold" style={{ background: t.primary, color: t.onPrimary }}>
          <Icon icon="ph:paw-print-fill" width={14} className="mr-1.5 inline -translate-y-px" />{topText}
        </div>
      )}
      <div className="border-b backdrop-blur-md" style={{ borderColor: t.line, background: mix(t.bg, 90, 'transparent') }}>
        <div className="mx-auto grid h-[70px] max-w-[1280px] grid-cols-[1fr_auto] items-center gap-4 px-4 lg:grid-cols-[1fr_auto_1fr] lg:px-8">
          <div className="justify-self-start"><Logo tienda={tienda} diseno={diseno} t={t} onClick={() => go(`/tienda/${slug}`)} /></div>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
            {navBtn(editable(diseno?.mascotasNavHome, 'Inicio'), 'home', `/tienda/${slug}`)}
            {navBtn(editable(diseno?.mascotasNavShop, 'Tienda'), 'catalog', `/tienda/${slug}/catalogo`)}
            {cats.length > 0 && (
              <div ref={catsRef} className="relative">
                <button type="button" onClick={() => setMenu(menu === 'cats' ? null : 'cats')} aria-expanded={menu === 'cats'} className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[14px] font-bold hover:bg-black/[0.04]" style={{ color: t.ink }}>
                  {editable(diseno?.mascotasNavCategories, 'Categorías')}
                  <Icon icon="solar:alt-arrow-down-linear" width={14} className={`transition-transform ${menu === 'cats' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {menu === 'cats' && (
                    // Envoltorio: centra con translate de Tailwind y solo anima opacidad; el hijo anima `y`.
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="absolute left-1/2 top-full z-40 mt-3 w-64 -translate-x-1/2">
                      <motion.div initial={{ y: 8 }} animate={{ y: 0 }} exit={{ y: 6 }} transition={{ duration: 0.2, ease: ptEase }} className="rounded-2xl border bg-white p-2 shadow-[0_24px_50px_-28px_rgba(42,46,38,0.45)]" style={{ borderColor: t.line }}>
                        {cats.slice(0, 12).map((c) => (
                          <button key={c} type="button" onClick={() => go(`/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13.5px] font-semibold hover:bg-black/[0.04]" style={{ color: t.ink }}>
                            {c}<Icon icon="solar:alt-arrow-right-linear" width={14} style={{ color: t.muted }} />
                          </button>
                        ))}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            {navBtn(editable(diseno?.mascotasNavContact, 'Ayuda'), 'contact', `/tienda/${slug}/contacto`)}
          </nav>

          <div className="flex items-center gap-0.5 justify-self-end">
            <IconBtn t={t} label="Buscar" icon="solar:magnifer-linear" onClick={() => setMenu(menu === 'search' ? null : 'search')} />
            <IconBtn t={t} label="Favoritos" icon="solar:heart-linear" onClick={onOpenFav} badge={favCount} />
            <IconBtn t={t} label="Carrito" icon="solar:cart-large-2-linear" onClick={onOpenCart} badge={cartCount} strong />
            <span className="lg:hidden"><IconBtn t={t} label="Menú" icon={menu === 'mobile' ? 'solar:close-circle-linear' : 'solar:hamburger-menu-linear'} onClick={() => setMenu(menu === 'mobile' ? null : 'mobile')} /></span>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {menu === 'search' && (
            <motion.form key="search" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: ptEase }} onSubmit={(e) => { e.preventDefault(); go(`/tienda/${slug}/catalogo${q.trim() ? `?search=${encodeURIComponent(q.trim())}` : ''}`); }} className="border-t" style={{ borderColor: t.line }} role="search">
              <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-3 px-4 lg:px-8">
                <Icon icon="solar:magnifer-linear" width={18} style={{ color: t.muted }} />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={editable(diseno?.mascotasSearchPlaceholder, 'Busca alimento, juguetes, camas…')} aria-label="Buscar productos" className="min-w-0 flex-1 appearance-none border-0 bg-transparent bg-none p-0 text-[14.5px] font-semibold outline-none placeholder:font-medium placeholder:text-stone-400 focus:ring-0" style={{ color: t.ink }} />
                <button type="submit" className={`${btnCls} h-9 px-5`} style={{ background: t.primary, color: t.onPrimary }}>Buscar</button>
              </div>
            </motion.form>
          )}
          {menu === 'mobile' && (
            <motion.nav key="mobile" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: ptEase }} className="border-t px-4 pb-4 pt-2 lg:hidden" style={{ borderColor: t.line }} aria-label="Menú móvil">
              {[
                { label: editable(diseno?.mascotasNavHome, 'Inicio'), to: `/tienda/${slug}` },
                { label: editable(diseno?.mascotasNavShop, 'Tienda'), to: `/tienda/${slug}/catalogo` },
                ...cats.slice(0, 6).map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })),
                { label: editable(diseno?.mascotasNavContact, 'Ayuda'), to: `/tienda/${slug}/contacto` },
              ].map((it, i) => (
                <button key={`${it.label}-${i}`} type="button" onClick={() => go(it.to)} className="flex w-full items-center justify-between rounded-xl px-2 py-3 text-left text-[14.5px] font-semibold" style={{ color: t.ink }}>
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
      <Icon icon={icon} width={22} />
      {badge > 0 && <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-extrabold" style={strong ? { background: t.accent, color: t.onAccent } : { background: t.ink, color: '#fff' }}>{badge}</span>}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────── Footer ──
export function PatitasFooter({ tienda, slug, diseno, t, categories, navigate }: any) {
  const storeName = storeNameOf(tienda);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const waUrl = buildStorePurchaseWhatsappUrl(waNumber, 'Hola, tengo una consulta.');
  const joinUrl = buildStorePurchaseWhatsappUrl(waNumber, `Hola, quiero unirme a la comunidad de ${storeName} para recibir novedades.`);
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
    ...(cats.length ? [{ title: 'Tienda', items: [...cats.map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })), { label: 'Ver todo', to: `/tienda/${slug}/catalogo` }] }] : [{ title: 'Tienda', items: [{ label: 'Catálogo', to: `/tienda/${slug}/catalogo` }] }]),
    { title: 'Ayuda', items: [
      { label: 'Contacto', to: `/tienda/${slug}/contacto` },
      { label: 'Preguntas frecuentes', to: `/tienda/${slug}/contacto#faq` },
      { label: 'Seguimiento de pedido', to: `/tienda/${slug}/seguimiento` },
    ] },
  ];
  const tagline = optional(diseno?.mascotasFooterTagline, 'Mejores cuidados.\nMascotas más felices.');
  const light = t.onPrimary === '#ffffff';
  const intro = String(diseno?.mascotasFooterText || tienda?.descripcionTienda || '').trim();
  const hasIntro = Boolean(joinUrl || intro);
  const sub = light ? 'rgba(255,255,255,.78)' : mix(t.onPrimary, 70, t.primary);

  return (
    <footer style={{ background: t.primary, color: t.onPrimary }}>
      <div className={`mx-auto grid max-w-[1280px] gap-10 px-4 py-12 md:grid-cols-2 lg:px-8 ${hasIntro ? 'lg:grid-cols-[1.5fr_repeat(3,1fr)_1.2fr]' : 'lg:grid-cols-[repeat(3,1fr)_1.2fr]'}`}>
        {hasIntro && <div>
          {joinUrl ? (
            <>
              <p className="flex items-center gap-2 text-[17px] font-extrabold"><Icon icon="ph:paw-print-fill" width={20} />{editable(diseno?.mascotasClubTitle, 'Únete a la manada')}</p>
              <p className="mt-1.5 max-w-xs text-[13px]" style={{ color: sub }}>{editable(diseno?.mascotasClubText, 'Recibe novedades, ofertas y consejos por WhatsApp.')}</p>
              <a href={joinUrl} target="_blank" rel="noopener noreferrer" className={`${btnCls} mt-4 h-11 px-5`} style={{ background: t.accent, color: t.onAccent }}>
                <Icon icon="ic:baseline-whatsapp" width={18} /> {editable(diseno?.mascotasClubButton, 'Unirme por WhatsApp')}
              </a>
            </>
          ) : (
            <p className="max-w-xs whitespace-pre-line text-[13px]" style={{ color: sub }}>{intro}</p>
          )}
        </div>}
        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="text-[14px] font-extrabold">{col.title}</h4>
            <ul className="mt-4 space-y-2 text-[13px]" style={{ color: sub }}>
              {col.items.map((it) => <li key={it.label}><button type="button" onClick={() => navigate(it.to)} className="text-left transition-opacity hover:opacity-100 hover:underline">{it.label}</button></li>)}
            </ul>
          </div>
        ))}
        {(address || horario) ? (
          <div>
            <h4 className="text-[14px] font-extrabold">Visítanos</h4>
            <ul className="mt-4 space-y-2 text-[13px]" style={{ color: sub }}>
              {address && <li className="flex gap-2"><Icon icon="solar:map-point-linear" width={16} className="mt-0.5 shrink-0" />{address}</li>}
              {horario && <li className="flex gap-2"><Icon icon="solar:clock-circle-linear" width={16} className="mt-0.5 shrink-0" />{horario}</li>}
            </ul>
          </div>
        ) : <div className="hidden lg:block" />}
        <div className="lg:justify-self-end">
          <Logo tienda={tienda} diseno={diseno} t={t} light={light} />
          {tagline && <p className="mt-2 whitespace-pre-line text-[13px]" style={{ color: sub }}>{tagline}</p>}
          {socials.length > 0 && (
            <div className="mt-4 flex gap-1.5">
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25">
                  <Icon icon={s.icon} width={18} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-white/15">
        <p className="mx-auto max-w-[1280px] px-4 py-5 text-[12px] lg:px-8" style={{ color: sub }}>© {new Date().getFullYear()} {storeName}. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────── Product card ──
/**
 * Tarjeta de producto (estado propio de cantidad aislado). Con variantes (talla, sabor, peso)
 * lleva a elegir en la ficha en vez de agregar a ciegas.
 */
export function PatitasProductCard({ producto, slug, t, onOpen, onAdd }: { producto: any; slug: string; t: Theme; onOpen: () => void; onAdd: (qty: number) => void }) {
  const pricing = getProductPricing(producto);
  const stock = Number(producto?.stock ?? 1);
  const isOut = stock <= 0;
  const hasVariants = Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const colors = getFashionColors(producto).slice(0, 4);
  const [qty, setQty] = useState(1);

  return (
    <article className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-28px_rgba(42,46,38,0.45)]" style={{ borderColor: t.line }} onClick={onOpen}>
      <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
        {pricing.enOferta && <span className="rounded-full px-2.5 py-1 text-[10.5px] font-extrabold" style={{ background: t.accent, color: t.onAccent }}>-{pricing.porcentajeDescuento}%</span>}
        {isOut ? <span className="rounded-full bg-stone-800 px-2.5 py-1 text-[10.5px] font-extrabold text-white">Agotado</span>
          : !hasVariants && stock <= 5 ? <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10.5px] font-extrabold" style={{ color: t.ink }}>¡Últimas {stock}!</span> : null}
      </div>
      <div className="absolute right-3 top-3 z-10 [&_button:nth-child(n+2)]:opacity-0 [&_button]:transition-opacity group-hover:[&_button:nth-child(n+2)]:opacity-100 [@media(hover:none)]:[&_button:nth-child(n+2)]:opacity-100" onClick={(e) => e.stopPropagation()}>
        <ProductCardActions producto={producto} slug={slug} cp={t.primary} />
      </div>

      <div className="relative m-2 flex aspect-[5/4] items-center justify-center overflow-hidden rounded-xl" style={{ background: t.soft }}>
        {producto?.imagenUrl ? (
          <img src={producto.imagenUrl} alt={producto.descripcion} loading="lazy" className={`h-full w-full object-contain p-4 mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.06] ${isOut ? 'opacity-50 grayscale' : ''}`} />
        ) : (
          <Icon icon="ph:paw-print-duotone" width={60} style={{ color: mix(t.ink, 22, t.bg) }} />
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-1">
        <h3 title={producto?.descripcion} className="line-clamp-2 min-h-[38px] text-[14px] font-bold leading-snug" style={{ color: t.ink }}>{producto?.descripcion}</h3>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[15.5px] font-extrabold" style={{ color: t.ink }}>{ptMoney(pricing.precioFinal)}</span>
          {pricing.enOferta && <span className="text-[12px] font-semibold line-through" style={{ color: t.muted }}>{ptMoney(pricing.precioRegular)}</span>}
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <Stars producto={producto} t={t} />
          {colors.length > 0 && <div className="flex -space-x-1">{colors.map((c) => <span key={c.name} title={c.name} className="h-3.5 w-3.5 rounded-full ring-2 ring-white" style={{ background: c.hex }} />)}</div>}
        </div>

        <div className="mt-auto flex flex-wrap items-stretch gap-2 pt-4 sm:flex-nowrap" onClick={(e) => e.stopPropagation()}>
          {!hasVariants && !isOut && (
            <div className="flex h-10 w-full shrink-0 items-center justify-between rounded-full px-1 sm:w-[82px]" style={{ background: t.soft }}>
              <button type="button" aria-label="Restar" onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-8 w-7 items-center justify-center text-base font-bold" style={{ color: t.muted }}>−</button>
              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setQty(d === '' ? 1 : Math.max(1, parseInt(d, 10))); }} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[13px] font-extrabold outline-none focus:ring-0" style={{ color: t.ink }} />
              <button type="button" aria-label="Sumar" onClick={() => setQty(qty + 1)} className="flex h-8 w-7 items-center justify-center text-base font-bold" style={{ color: t.muted }}>+</button>
            </div>
          )}
          <button
            type="button"
            disabled={isOut}
            onClick={() => { if (isOut) return; if (hasVariants) onOpen(); else onAdd(Math.max(1, qty)); }}
            className={`${btnCls} h-10 min-w-0 flex-1 basis-full px-3 text-[12.5px] disabled:cursor-not-allowed disabled:opacity-50 sm:basis-auto`}
            style={isOut ? { background: t.soft, color: t.muted } : hasVariants ? { background: mix(t.primary, 12, '#fff'), color: t.primaryInk } : { background: t.primary, color: t.onPrimary }}
          >
            <span className="truncate">{isOut ? 'Agotado' : hasVariants ? 'Ver opciones' : 'Agregar'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────── Cart modal ──
export function PatitasCartModal({ isOpen, onClose, carrito, actualizarCantidad, onCheckout, t, tienda, diseno }: any) {
  const items: any[] = carrito || [];
  const total = items.reduce((a, it) => a + Number(it.precioUnitario || 0) * Number(it.cantidad || 1), 0);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(waNumber, 'x'));
  const pedirWa = () => {
    if (!items.length) return;
    const detail = items.map((it) => `• ${Number(it.cantidad || 1)} x ${it.descripcion} - ${ptMoney(Number(it.precioUnitario || 0) * Number(it.cantidad || 1))}`).join('\n');
    const url = buildStorePurchaseWhatsappUrl(waNumber, `Hola, quiero pedir estos productos en ${storeNameOf(tienda)}:\n\n${detail}\n\nTotal estimado: ${ptMoney(total)}`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  const drawerStyle: CSSProperties = { background: t.bg, fontFamily: t.font };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button type="button" aria-label="Cerrar carrito" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-stone-900/35 backdrop-blur-[2px]" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 260 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[430px] flex-col shadow-2xl" style={drawerStyle} role="dialog" aria-label="Carrito">
            <header className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: t.line }}>
              <div>
                <h2 className="text-[21px] font-extrabold" style={{ color: t.ink }}>Tu carrito</h2>
                <p className="mt-0.5 text-[12.5px] font-semibold" style={{ color: t.muted }}>{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
              </div>
              <button type="button" aria-label="Cerrar" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/[0.05]" style={{ color: t.ink }}><Icon icon="solar:close-circle-linear" width={22} /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {!items.length ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: mix(t.primary, 14, '#fff'), color: t.primaryInk }}><Icon icon="ph:paw-print-duotone" width={40} /></span>
                  <h3 className="mt-5 text-[18px] font-extrabold" style={{ color: t.ink }}>Tu carrito está vacío</h3>
                  <p className="mt-1.5 max-w-[260px] text-[13px]" style={{ color: t.muted }}>Encuentra todo lo que tu engreído necesita.</p>
                  <button type="button" onClick={onClose} className={`${btnCls} mt-6 h-11 px-6`} style={{ background: t.primary, color: t.onPrimary }}>Seguir comprando</button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => {
                    const id = item.cartId || item.id;
                    const qty = Number(item.cantidad || 1);
                    const price = Number(item.precioUnitario || 0);
                    return (
                      <li key={id} className="relative grid grid-cols-[84px_1fr] gap-3 rounded-2xl border bg-white p-3" style={{ borderColor: t.line }}>
                        <button type="button" aria-label="Quitar" onClick={() => actualizarCantidad(id, 0)} className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-500"><Icon icon="solar:trash-bin-minimalistic-linear" width={16} /></button>
                        <div className="flex h-[84px] items-center justify-center overflow-hidden rounded-xl" style={{ background: t.soft }}>
                          {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-1.5 mix-blend-multiply" /> : <Icon icon="ph:paw-print-duotone" width={30} style={{ color: t.muted }} />}
                        </div>
                        <div className="min-w-0 pr-7">
                          <h3 className="line-clamp-2 text-[13px] font-bold leading-snug" style={{ color: t.ink }}>{item.descripcion}</h3>
                          <div className="mt-2.5 flex items-center justify-between">
                            <div className="flex h-9 items-center overflow-hidden rounded-full" style={{ background: t.soft }}>
                              <button type="button" aria-label="Restar" onClick={() => actualizarCantidad(id, qty - 1)} className="flex w-8 items-center justify-center text-base font-bold" style={{ color: t.muted }}>−</button>
                              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); actualizarCantidad(id, d === '' ? 1 : parseInt(d, 10)); }} onFocus={(e) => e.currentTarget.select()} className="w-9 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[13px] font-extrabold outline-none focus:ring-0" style={{ color: t.ink }} />
                              <button type="button" aria-label="Sumar" onClick={() => actualizarCantidad(id, qty + 1)} className="flex w-8 items-center justify-center text-base font-bold" style={{ color: t.muted }}>+</button>
                            </div>
                            <span className="text-[14.5px] font-extrabold" style={{ color: t.ink }}>{ptMoney(price * qty)}</span>
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
                  <span className="text-[22px] font-extrabold" style={{ color: t.ink }}>{ptMoney(total)}</span>
                </div>
                <p className="mb-4 text-[11.5px]" style={{ color: t.muted }}>El envío se calcula en el checkout según tu forma de entrega.</p>
                <button type="button" onClick={() => { onClose(); onCheckout(); }} className={`${btnCls} h-12 w-full`} style={{ background: t.primary, color: t.onPrimary }}>
                  Ir a pagar <Icon icon="solar:arrow-right-linear" width={17} />
                </button>
                {hasWa && (
                  <button type="button" onClick={pedirWa} className={`${btnCls} mt-2.5 h-11 w-full`} style={{ background: t.soft, color: t.ink }}>
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
