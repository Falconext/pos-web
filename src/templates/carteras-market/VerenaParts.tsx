import { useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { getProductPricing } from '@/templates/shared/pricing';
import { readableText } from '@/templates/shared/color';
import { sinStock, pocasUnidades } from '@/templates/shared/ventaSinStock';
import ProductCardActions from '@/components/tienda/ProductCardActions';
import { useFavoritosStore } from '@/zustand/favoritos';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { mix, vrEase } from './motion';

/**
 * Verena — plantilla de carteras con estructura de marketplace premium.
 * Regla de la plantilla: nada inventado. Teléfonos, descuentos, reseñas, relojes y
 * medios de pago salen de la tienda real; si un dato falta, la UI se oculta.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

/** Prefijo de los campos del editor en vivo (id `carteras-market` → camelCase). */
export const VR = 'carterasMarket';

export const vrMoney = (v: any) => `S/ ${Number(v || 0).toFixed(2)}`;
export const editable = (v: any, fallback: string) => String(v ?? '').trim() || fallback;
/** Texto del editor con respaldo. */
export const ed = (diseno: any, key: string, fallback: string) => editable(diseno?.[`${VR}${key}`], fallback);
/** Texto opcional: si el dueño lo deja vacío, se oculta (undefined = usar el respaldo). */
export const optional = (diseno: any, key: string, fallback: string) => {
  const raw = diseno?.[`${VR}${key}`];
  return raw === undefined || raw === null ? fallback : String(raw).trim();
};
export const isOn = (diseno: any, key: string) => {
  const v = diseno?.[`${VR}${key}`];
  return v === true || v === 'true' || v === 1 || v === '1';
};
export const nameOf = (v: any): string => (v && typeof v === 'object' ? v.nombre || v.descripcion || '' : typeof v === 'string' ? v : '');
export const storeNameOf = (tienda: any) => tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || '';

export function verenaTheme(diseno: any) {
  const primary = diseno?.colorPrimario || '#1F3B2D'; // verde bosque (barra superior, botones, newsletter)
  const accent = diseno?.colorAccento || '#D9733B';   // terracota (destacados, tarjeta de ayuda)
  const bg = diseno?.colorSecundario || '#FCFAF6';     // marfil del lienzo
  return {
    primary,
    accent,
    bg,
    ink: '#17191B',
    muted: '#6A6E70',
    surface: '#FFFFFF',
    /** Crema de hero y categorías: se calienta sobre el fondo elegido por el dueño. */
    cream: `color-mix(in srgb, ${bg} 52%, #EDE2D2)`,
    /** Fondo de la foto de producto (las fotos con fondo blanco se funden con multiply). */
    tile: `color-mix(in srgb, ${bg} 62%, #F1ECE4)`,
    line: '#ECE5DA',
    onPrimary: readableText(primary),
    onAccent: readableText(accent),
    font: `'${diseno?.tipografia || 'DM Sans'}', 'Segoe UI', system-ui, sans-serif`,
    serif: `'Playfair Display', Georgia, 'Times New Roman', serif`,
  };
}
export type Theme = ReturnType<typeof verenaTheme>;

/** Inyecta DM Sans + Playfair Display una sola vez. */
export function useVerenaFont() {
  useEffect(() => {
    const id = 'verena-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Playfair+Display:wght@600;700;800&display=swap';
    document.head.appendChild(link);
  }, []);
}

export function formatPhone(raw: any) {
  const value = String(raw || '').trim();
  if (!value) return value;
  const digits = value.replace(/\D/g, '');
  let n = digits;
  if (digits.length === 11 && digits.startsWith('51')) n = digits.slice(2);
  else if (digits.length === 9) n = digits;
  else return value;
  return `+51 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
}

/** Estrellas con el rating REAL; sin reseñas muestra "Nuevo" (nunca estrellas falsas). */
export function Stars({ rating = 0, count = 0, size = 14 }: { rating?: number; count?: number; size?: number }) {
  if (!count) return <span className="text-[11.5px] font-semibold text-[#8A8E90]">Nuevo</span>;
  const r = Math.round(rating);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex" style={{ color: '#E8A33D' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Icon key={i} icon={i < r ? 'solar:star-bold' : 'solar:star-linear'} width={size} className={i < r ? '' : 'text-[#D7D2CA]'} />
        ))}
      </div>
      <span className="text-[11.5px] font-medium text-[#8A8E90]">({count})</span>
    </div>
  );
}

// ───────────────────────────────────────────────────────── Barra superior ──
type TopItem = { key: string; icon: string; label: string };

function topbarItems(tienda: any, diseno: any): TopItem[] {
  const items: TopItem[] = [];
  const envio = Number(tienda?.costoEnvioFijo || 0);
  const prep = Number(tienda?.tiempoPreparacionMin || 0);
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(tienda?.whatsappTienda ?? diseno?.whatsappTienda, ''));
  if (tienda?.aceptaEnvio !== false) items.push({ key: 'ship', icon: 'solar:delivery-linear', label: optional(diseno, 'TopbarShip', envio > 0 ? `Envío a domicilio desde ${vrMoney(envio)}` : 'Envío a domicilio') });
  if (tienda?.aceptaRecojo) items.push({ key: 'pick', icon: 'solar:shop-2-linear', label: optional(diseno, 'TopbarPickup', prep > 0 ? `Recojo en tienda en ${prep} min` : 'Recojo en tienda') });
  items.push({ key: 'secure', icon: 'solar:shield-check-linear', label: optional(diseno, 'TopbarSecure', 'Compra 100% segura') });
  if (hasWa) items.push({ key: 'help', icon: 'solar:chat-round-dots-linear', label: optional(diseno, 'TopbarSupport', 'Atención por WhatsApp') });
  return items.filter((i) => i.label);
}

// ───────────────────────────────────────────────────────────────── Header ──
export type NavFn = (url: string) => void;

export function VerenaHeader({
  tienda, slug, diseno, categories, t, cartCount, favCount, onOpenCart, onOpenFav, onSearch, navigate, active = 'home',
}: {
  tienda: any; slug: string; diseno: any; categories: string[]; t: Theme; cartCount: number; favCount: number;
  onOpenCart: () => void; onOpenFav: () => void; onSearch: (q: string) => void; navigate: NavFn; active?: 'home' | 'shop' | 'contact' | 'none';
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState('');
  const storeName = storeNameOf(tienda) || ed(diseno, 'LogoText', 'Mi tienda');
  const tagline = optional(diseno, 'LogoTagline', 'Carteras y accesorios');
  const items = isOn(diseno, 'TopbarHidden') ? [] : topbarItems(tienda, diseno);
  const cats = (categories || []).slice(0, 4);
  const go = (url: string) => { setMenuOpen(false); setShopOpen(false); navigate(url); };
  const submit = (e: FormEvent) => { e.preventDefault(); setSearchOpen(false); setMenuOpen(false); onSearch(q.trim()); };

  const links: { key: string; label: string; url: string; isActive: boolean }[] = [
    { key: 'home', label: ed(diseno, 'NavHome', 'Inicio'), url: `/tienda/${slug}`, isActive: active === 'home' },
    ...cats.map((c) => ({ key: `c-${c}`, label: c, url: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`, isActive: false })),
    { key: 'contact', label: ed(diseno, 'NavContact', 'Contacto'), url: `/tienda/${slug}/contacto`, isActive: active === 'contact' },
  ];

  return (
    <header className="relative z-40">
      {/* Barra superior: beneficios reales de la tienda */}
      {items.length > 0 && (
        <div style={{ background: t.primary, color: t.onPrimary }}>
          <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2.5 text-[12.5px] font-medium lg:px-6">
            {items.map((it, i) => (
              <span key={it.key} className={`items-center ${i === 0 ? 'inline-flex' : 'hidden md:inline-flex'}`}>
                {i > 0 && <span aria-hidden className="mx-5 h-3.5 w-px opacity-30" style={{ background: t.onPrimary }} />}
                <Icon icon={it.icon} width={16} className="mr-2 shrink-0 opacity-90" />
                {it.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="border-b bg-white" style={{ borderColor: t.line }}>
        <div className="mx-auto flex h-[76px] max-w-7xl items-center gap-4 px-4 lg:px-6">
          <button type="button" aria-label="Abrir menú" onClick={() => setMenuOpen(true)} className="-ml-1 flex h-10 w-10 items-center justify-center rounded-full lg:hidden" style={{ color: t.ink }}>
            <Icon icon="solar:hamburger-menu-linear" width={24} />
          </button>

          <button type="button" onClick={() => go(`/tienda/${slug}`)} className="flex min-w-0 items-center gap-2.5 text-left lg:shrink-0">
            {tienda?.logo ? (
              <img src={tienda.logo} alt={storeName} className="h-11 w-auto max-w-[170px] object-contain" />
            ) : (
              <>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11" style={{ background: t.primary, color: t.onPrimary }}>
                  <Icon icon="solar:bag-4-bold" width={24} />
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-[18px] font-extrabold tracking-[-0.02em] sm:text-[21px]" style={{ color: t.ink }}>{storeName}</span>
                  {tagline && <span className="hidden truncate text-[11.5px] font-medium sm:block" style={{ color: t.muted }}>{tagline}</span>}
                </span>
              </>
            )}
          </button>

          {/* Navegación (desktop) */}
          <nav className="mx-auto hidden items-center gap-1 lg:flex" aria-label="Principal">
            {links.slice(0, 1).map((l) => <NavLink key={l.key} t={t} label={l.label} active={l.isActive} onClick={() => go(l.url)} />)}
            <div className="relative" onMouseLeave={() => setShopOpen(false)}>
              <button type="button" aria-expanded={shopOpen} onMouseEnter={() => setShopOpen(true)} onClick={() => setShopOpen((v) => !v)} className="relative flex items-center gap-1 px-3 py-2 text-[14.5px] font-semibold" style={{ color: t.ink }}>
                {ed(diseno, 'NavShop', 'Tienda')}
                <Icon icon="solar:alt-arrow-down-linear" width={15} className={`transition-transform duration-300 ${shopOpen ? 'rotate-180' : ''}`} />
                {active === 'shop' && <span className="absolute inset-x-3 -bottom-[3px] h-[2px] rounded-full" style={{ background: t.ink }} />}
              </button>
              <AnimatePresence>
                {shopOpen && (
                  <motion.div key="shop-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="absolute left-1/2 top-full z-50 w-[520px] -translate-x-1/2 pt-3">
                  <motion.div initial={{ y: 8 }} animate={{ y: 0 }} transition={{ duration: 0.22, ease: vrEase }}>
                    <div className="rounded-2xl border bg-white p-5 shadow-[0_30px_60px_-30px_rgba(23,25,27,0.35)]" style={{ borderColor: t.line }}>
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: t.muted }}>Categorías</p>
                      {categories.length ? (
                        <div className="mt-3 grid grid-cols-2 gap-1">
                          {categories.slice(0, 14).map((c) => (
                            <button key={c} type="button" onClick={() => go(`/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}`)} className="truncate rounded-lg px-3 py-2 text-left text-[14px] font-medium transition-colors hover:bg-black/[0.04]" style={{ color: t.ink }}>{c}</button>
                          ))}
                        </div>
                      ) : <p className="mt-3 text-[13.5px]" style={{ color: t.muted }}>Pronto tendremos categorías.</p>}
                      <button type="button" onClick={() => go(`/tienda/${slug}/catalogo`)} className="mt-4 flex w-full items-center justify-between rounded-xl px-4 py-3 text-[14px] font-bold" style={{ background: t.cream, color: t.primary }}>
                        Ver todo el catálogo <Icon icon="solar:arrow-right-linear" width={18} />
                      </button>
                    </div>
                  </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {links.slice(1).map((l) => <NavLink key={l.key} t={t} label={l.label} active={l.isActive} onClick={() => go(l.url)} />)}
          </nav>

          {/* Iconos */}
          <div className="ml-auto flex shrink-0 items-center gap-0.5 lg:ml-0">
            {/* En móvil el buscador vive dentro del menú: así el carrito nunca se sale del header. */}
            <span className="hidden sm:block"><IconBtn t={t} label="Buscar" icon="solar:magnifer-linear" onClick={() => setSearchOpen((v) => !v)} /></span>
            <span className="hidden sm:block"><IconBtn t={t} label="Seguir mi pedido" icon="solar:box-linear" onClick={() => go(`/tienda/${slug}/seguimiento`)} /></span>
            <IconBtn t={t} label="Favoritos" icon="solar:heart-linear" onClick={onOpenFav} badge={favCount} />
            <IconBtn t={t} label="Carrito" icon="solar:bag-3-linear" onClick={onOpenCart} badge={cartCount} strong />
          </div>
        </div>

        {/* Buscador desplegable */}
        <AnimatePresence initial={false}>
          {searchOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: vrEase }} className="overflow-hidden border-t" style={{ borderColor: t.line }}>
              <form onSubmit={submit} className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-4">
                <div className="flex h-12 flex-1 items-center rounded-full border bg-white pl-5 pr-1.5" style={{ borderColor: t.line }}>
                  <Icon icon="solar:magnifer-linear" width={19} style={{ color: t.muted }} />
                  <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={ed(diseno, 'SearchPlaceholder', 'Busca carteras, mochilas, billeteras…')} aria-label="Buscar productos" className="min-w-0 flex-1 border-0 bg-transparent bg-none px-3 text-[15px] outline-none focus:ring-0" style={{ color: t.ink }} />
                  <button type="submit" className="h-9 rounded-full px-5 text-[13.5px] font-bold" style={{ background: t.primary, color: t.onPrimary }}>Buscar</button>
                </div>
                <button type="button" aria-label="Cerrar buscador" onClick={() => setSearchOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/[0.04]" style={{ color: t.muted }}><Icon icon="solar:close-circle-linear" width={22} /></button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Menú móvil */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button type="button" aria-label="Cerrar menú" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenuOpen(false)} className="fixed inset-0 z-50 bg-black/45 lg:hidden" />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 30, stiffness: 260 }} className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col bg-white lg:hidden">
              <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: t.line }}>
                <span className="text-[18px] font-extrabold" style={{ color: t.ink }}>{storeName}</span>
                <button type="button" aria-label="Cerrar" onClick={() => setMenuOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.05]"><Icon icon="solar:close-circle-linear" width={22} /></button>
              </div>
              <form onSubmit={submit} className="px-5 pt-4">
                <div className="flex h-11 items-center rounded-full border px-4" style={{ borderColor: t.line }}>
                  <Icon icon="solar:magnifer-linear" width={18} style={{ color: t.muted }} />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar productos" aria-label="Buscar productos" className="min-w-0 flex-1 border-0 bg-transparent bg-none px-2 text-[14.5px] outline-none focus:ring-0" />
                </div>
              </form>
              <nav className="flex-1 overflow-y-auto px-3 py-4">
                {[{ label: ed(diseno, 'NavHome', 'Inicio'), url: `/tienda/${slug}` }, { label: 'Todo el catálogo', url: `/tienda/${slug}/catalogo` }, ...categories.map((c) => ({ label: c, url: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })), { label: 'Seguir mi pedido', url: `/tienda/${slug}/seguimiento` }, { label: ed(diseno, 'NavContact', 'Contacto'), url: `/tienda/${slug}/contacto` }].map((l, i) => (
                  <button key={`${l.label}-${i}`} type="button" onClick={() => go(l.url)} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[15px] font-semibold hover:bg-black/[0.04]" style={{ color: t.ink }}>
                    {l.label} <Icon icon="solar:alt-arrow-right-linear" width={16} style={{ color: t.muted }} />
                  </button>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

function NavLink({ t, label, active, onClick }: { t: Theme; label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group relative max-w-[150px] truncate px-3 py-2 text-[14.5px] font-semibold" style={{ color: t.ink }}>
      {label}
      <span className={`absolute inset-x-3 -bottom-[3px] h-[2px] origin-left rounded-full transition-transform duration-300 ${active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} style={{ background: t.ink }} />
    </button>
  );
}

function IconBtn({ t, label, icon, onClick, badge = 0, strong = false }: { t: Theme; label: string; icon: string; onClick: () => void; badge?: number; strong?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-black/[0.05]" style={{ color: t.ink }}>
      <Icon icon={icon} width={strong ? 25 : 24} />
      {badge > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full px-1 text-[10.5px] font-bold" style={{ background: t.primary, color: t.onPrimary }}>{badge > 99 ? '99+' : badge}</span>
      )}
    </button>
  );
}

// ────────────────────────────────────────────────────── Medios de pago reales ──
export type PayMethod = { key: string; label: string; icon?: string; color?: string };
const payCache = new Map<string, PayMethod[]>();
const PREVIEW_METHODS: PayMethod[] = [
  { key: 'visa', label: 'Visa', icon: 'logos:visa' },
  { key: 'mc', label: 'Mastercard', icon: 'logos:mastercard' },
  { key: 'yape', label: 'Yape', color: '#742284' },
  { key: 'plin', label: 'Plin', color: '#00A3A6' },
];

function toMethods(cfg: any): PayMethod[] {
  if (!cfg) return [];
  const m: PayMethod[] = [];
  if (cfg.aceptaTarjeta) { m.push({ key: 'visa', label: 'Visa', icon: 'logos:visa' }); m.push({ key: 'mc', label: 'Mastercard', icon: 'logos:mastercard' }); }
  if (cfg.aceptaMercadoPago) m.push({ key: 'mp', label: 'Mercado Pago', icon: 'simple-icons:mercadopago', color: '#00A8E8' });
  if (cfg.yapeNumero || cfg.yapeQrUrl || cfg.yapeQR) m.push({ key: 'yape', label: 'Yape', color: '#742284' });
  if (cfg.plinNumero || cfg.plinQrUrl || cfg.plinQR) m.push({ key: 'plin', label: 'Plin', color: '#00A3A6' });
  if (Array.isArray(cfg.cuentasBancarias) && cfg.cuentasBancarias.length) m.push({ key: 'bank', label: 'Transferencia', icon: 'solar:card-transfer-linear' });
  if (cfg.aceptaEfectivo) m.push({ key: 'cash', label: 'Efectivo', icon: 'solar:wad-of-money-linear' });
  return m;
}

/** Medios de pago configurados en la tienda (una consulta por slug, cacheada). */
export function usePaymentMethods(slug: string): PayMethod[] {
  const [methods, setMethods] = useState<PayMethod[]>(() => (slug === 'preview' ? PREVIEW_METHODS : payCache.get(slug) || []));
  useEffect(() => {
    if (!slug || slug === 'preview') return;
    const cached = payCache.get(slug);
    if (cached) { setMethods(cached); return; }
    let alive = true;
    axios.get(`${BASE_URL}/public/store/${slug}/payment-config`)
      .then((res) => { const list = toMethods(res.data?.data ?? res.data); payCache.set(slug, list); if (alive) setMethods(list); })
      .catch(() => { payCache.set(slug, []); });
    return () => { alive = false; };
  }, [slug]);
  return methods;
}

export function PaymentBadges({ methods, dark = false }: { methods: PayMethod[]; dark?: boolean }) {
  if (!methods.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {methods.map((m) => (
        <span key={m.key} title={m.label} className={`flex h-8 min-w-[48px] items-center justify-center gap-1.5 rounded-md px-2.5 text-[11.5px] font-bold ${dark ? 'bg-white' : 'border bg-white'}`} style={{ borderColor: '#ECE5DA', color: m.color || '#17191B' }}>
          {m.icon ? <Icon icon={m.icon} width={m.icon.startsWith('logos:') ? 34 : 17} style={m.color ? { color: m.color } : undefined} /> : null}
          {(!m.icon || !m.icon.startsWith('logos:')) && <span>{m.label}</span>}
        </span>
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────── Footer ──
export function VerenaFooter({ tienda, slug, diseno, t, categories, navigate }: { tienda: any; slug: string; diseno: any; t: Theme; categories: string[]; navigate: NavFn }) {
  const storeName = storeNameOf(tienda) || ed(diseno, 'LogoText', 'Mi tienda');
  const methods = usePaymentMethods(slug);
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const hasWa = Boolean(buildStorePurchaseWhatsappUrl(waNumber, ''));
  const address = [tienda?.direccion, tienda?.distrito].filter(Boolean).join(', ');
  const socials = [
    tienda?.facebookUrl ? { icon: 'ic:baseline-facebook', label: 'Facebook', url: tienda.facebookUrl } : null,
    tienda?.instagramUrl ? { icon: 'mdi:instagram', label: 'Instagram', url: tienda.instagramUrl } : null,
    tienda?.tiktokUrl ? { icon: 'ic:baseline-tiktok', label: 'TikTok', url: tienda.tiktokUrl } : null,
  ].filter(Boolean) as { icon: string; label: string; url: string }[];
  const cols: { title: string; items: { label: string; to: string }[] }[] = [
    { title: 'Tienda', items: [
      { label: 'Inicio', to: `/tienda/${slug}` },
      { label: 'Todo el catálogo', to: `/tienda/${slug}/catalogo` },
      ...(categories || []).slice(0, 4).map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })),
    ] },
    { title: 'Ayuda', items: [
      { label: 'Contacto', to: `/tienda/${slug}/contacto` },
      { label: 'Seguir mi pedido', to: `/tienda/${slug}/seguimiento` },
      { label: 'Preguntas frecuentes', to: `/tienda/${slug}/contacto#faq` },
    ] },
  ];
  const text = optional(diseno, 'FooterText', String(tienda?.descripcionTienda || '').trim() || 'Carteras y accesorios elegidos con cuidado, con envío seguro y atención cercana.');

  return (
    <footer className="mt-4 border-t bg-white" style={{ borderColor: t.line }}>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.8fr_1.25fr] lg:px-6">
        <div>
          <div className="flex items-center gap-2.5">
            {tienda?.logo ? <img src={tienda.logo} alt={storeName} className="h-11 w-auto max-w-[170px] object-contain" /> : (
              <>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: t.primary, color: t.onPrimary }}><Icon icon="solar:bag-4-bold" width={22} /></span>
                <span className="text-[20px] font-extrabold tracking-[-0.02em]" style={{ color: t.ink }}>{storeName}</span>
              </>
            )}
          </div>
          {text && <p className="mt-5 max-w-xs text-[14px] leading-relaxed" style={{ color: t.muted }}>{text}</p>}
          <div className="mt-5 space-y-2 text-[13.5px]" style={{ color: t.muted }}>
            {address && <p className="flex items-start gap-2"><Icon icon="solar:map-point-linear" width={17} className="mt-0.5 shrink-0" /> {address}</p>}
            {tienda?.horarioAtencion && <p className="flex items-start gap-2"><Icon icon="solar:clock-circle-linear" width={17} className="mt-0.5 shrink-0" /> {tienda.horarioAtencion}</p>}
          </div>
          {socials.length > 0 && (
            <div className="mt-6 flex gap-2.5">
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:-translate-y-0.5" style={{ background: t.ink, color: '#fff' }}><Icon icon={s.icon} width={19} /></a>
              ))}
            </div>
          )}
        </div>

        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="text-[15px] font-bold" style={{ color: t.ink }}>{col.title}</h4>
            <ul className="mt-5 space-y-3 text-[14px]">
              {col.items.map((it) => (
                <li key={`${col.title}-${it.label}`}><button type="button" onClick={() => navigate(it.to)} className="max-w-full truncate text-left transition-colors hover:text-[#17191B]" style={{ color: t.muted }}>{it.label}</button></li>
              ))}
            </ul>
          </div>
        ))}

        {hasWa ? <FooterNews t={t} diseno={diseno} waNumber={waNumber} storeName={storeName} /> : (
          <div>
            <h4 className="text-[15px] font-bold" style={{ color: t.ink }}>Compra con confianza</h4>
            <p className="mt-5 text-[14px] leading-relaxed" style={{ color: t.muted }}>Paga de forma segura y sigue tu pedido en todo momento con tu código de seguimiento.</p>
          </div>
        )}
      </div>

      <div style={{ background: t.primary, color: t.onPrimary }}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-4 text-[12.5px] sm:flex-row lg:px-6">
          <p className="opacity-85">© {new Date().getFullYear()} {storeName}. Todos los derechos reservados.</p>
          <PaymentBadges methods={methods} dark />
        </div>
      </div>
    </footer>
  );
}

/** "Mantente al día": arma el mensaje y abre WhatsApp. Nunca simula una suscripción. */
function FooterNews({ t, diseno, waNumber, storeName }: { t: Theme; diseno: any; waNumber: any; storeName: string }) {
  const [name, setName] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const who = name.trim() ? `Soy ${name.trim()}. ` : '';
    const url = buildStorePurchaseWhatsappUrl(waNumber, `Hola ${storeName}. ${who}Quiero recibir sus novedades y ofertas por WhatsApp.`);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <div>
      <h4 className="text-[15px] font-bold" style={{ color: t.ink }}>{ed(diseno, 'FooterNewsTitle', 'Mantente al día')}</h4>
      <p className="mt-5 text-[14px] leading-relaxed" style={{ color: t.muted }}>{ed(diseno, 'FooterNewsText', 'Recibe novedades y ofertas directo en tu WhatsApp.')}</p>
      <form onSubmit={submit} className="mt-4 flex h-12 items-center overflow-hidden rounded-xl border bg-white" style={{ borderColor: t.line }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" aria-label="Tu nombre" className="min-w-0 flex-1 border-0 bg-transparent bg-none px-4 text-[14px] outline-none focus:ring-0" style={{ color: t.ink }} />
        <button type="submit" className="flex h-full items-center gap-1.5 px-4 text-[13.5px] font-bold" style={{ background: t.primary, color: t.onPrimary }}>
          <Icon icon="ic:baseline-whatsapp" width={18} /> Unirme
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────── Product card ──
/** Corazón visible en reposo; al pasar el mouse cede su lugar al riel completo (favorito, zoom, comparar). */
function CardActions({ producto, slug, t }: { producto: any; slug: string; t: Theme }) {
  const { toggleFavorito, isFavorito } = useFavoritosStore();
  const fav = isFavorito(producto?.id, slug);
  return (
    <div className="absolute right-2.5 top-2.5 z-10" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        onClick={() => toggleFavorito({ id: producto.id, descripcion: producto.descripcion, precioUnitario: Number(producto.precioUnitario || 0), imagenUrl: producto.imagenUrl, slug })}
        className="absolute right-0 top-0 hidden h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm transition-opacity duration-200 lg:flex lg:group-hover:pointer-events-none lg:group-hover:opacity-0"
        style={{ color: fav ? '#E11D48' : t.ink }}
      >
        <Icon icon={fav ? 'solar:heart-bold' : 'solar:heart-linear'} width={19} />
      </button>
      <div className="transition-opacity duration-200 lg:pointer-events-none lg:opacity-0 lg:group-hover:pointer-events-auto lg:group-hover:opacity-100">
        <ProductCardActions producto={producto} slug={slug} cp={t.primary} />
      </div>
    </div>
  );
}

export function VerenaProductCard({ producto, slug, t, diseno, onOpen, onAdd }: { producto: any; slug: string; t: Theme; diseno?: any; onOpen: () => void; onAdd: (qty: number) => void }) {
  const pricing = getProductPricing(producto);
  const rating = Number(producto?.ratingAvg || 0);
  const ratingCount = Number(producto?.ratingCount || 0);
  const stock = Number(producto?.stock ?? 1);
  const isOut = sinStock(stock);
  const hasVariants = Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const [qty, setQty] = useState(1);

  const badge = isOut
    ? { label: 'Agotado', bg: '#3F4246', fg: '#fff' }
    : pricing.enOferta
      ? { label: `Oferta -${pricing.porcentajeDescuento}%`, bg: t.primary, fg: t.onPrimary }
      : producto?.destacado
        ? { label: ed(diseno, 'BadgeFeatured', 'Destacado'), bg: t.accent, fg: t.onAccent }
        : pocasUnidades(stock)
          ? { label: `¡Últimas ${stock}!`, bg: mix(t.accent, 16), fg: t.accent }
          : null;

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: vrEase }}
      onClick={onOpen}
      className="group relative flex h-full cursor-pointer flex-col rounded-2xl border bg-white p-3 transition-shadow duration-300 hover:shadow-[0_26px_50px_-30px_rgba(23,25,27,0.45)]"
      style={{ borderColor: t.line }}
    >
      {badge && <span className="absolute left-3 top-3 z-10 rounded-md px-2.5 py-1 text-[11px] font-bold" style={{ background: badge.bg, color: badge.fg }}>{badge.label}</span>}
      <CardActions producto={producto} slug={slug} t={t} />

      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl" style={{ background: t.tile }}>
        {producto?.imagenUrl ? (
          <img src={producto.imagenUrl} alt={producto?.descripcion || ''} loading="lazy" className={`h-full w-full object-contain p-4 mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.06] ${isOut ? 'opacity-50 grayscale' : ''}`} />
        ) : (
          <Icon icon="solar:bag-4-bold-duotone" width={70} style={{ color: mix(t.primary, 45) }} />
        )}
      </div>

      <div className="flex flex-1 flex-col px-1 pt-3.5">
        <h3 title={producto?.descripcion} className="line-clamp-2 min-h-[40px] text-[14.5px] font-semibold leading-snug" style={{ color: t.ink }}>{producto?.descripcion}</h3>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
          <div className="leading-tight">
            <span className="block whitespace-nowrap text-[16px] font-bold sm:text-[17px]" style={{ color: t.ink }}>{vrMoney(pricing.precioFinal)}</span>
            {pricing.enOferta && <span className="block text-[12.5px] font-medium text-[#9A9EA0] line-through">{vrMoney(pricing.precioRegular)}</span>}
          </div>
          {!hasVariants && !isOut && (
            <div className="flex h-8 w-[70px] shrink-0 items-center justify-between rounded-lg border px-0.5" style={{ borderColor: t.line }} onClick={(e) => e.stopPropagation()}>
              <button type="button" aria-label="Restar" onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-7 w-5 items-center justify-center text-[16px] leading-none" style={{ color: t.muted }}>−</button>
              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setQty(d === '' ? 1 : Math.max(1, parseInt(d, 10))); }} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[13.5px] font-bold outline-none focus:ring-0" style={{ color: t.ink }} />
              <button type="button" aria-label="Sumar" onClick={() => setQty(qty + 1)} className="flex h-7 w-5 items-center justify-center text-[16px] leading-none" style={{ color: t.muted }}>+</button>
            </div>
          )}
        </div>
        <div className="mt-1.5"><Stars rating={rating} count={ratingCount} size={13} /></div>

        <div className="mt-auto pt-3.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            disabled={isOut}
            onClick={() => { if (isOut) return; if (hasVariants) onOpen(); else onAdd(Math.max(1, qty)); }}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg px-3 text-[13.5px] font-bold transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:bg-[#E9E5DE] disabled:text-[#9A9EA0]"
            style={isOut ? undefined : { background: t.primary, color: t.onPrimary }}
          >
            <Icon icon={hasVariants ? 'solar:palette-round-linear' : 'solar:cart-large-2-linear'} width={17} className="shrink-0" />
            {isOut ? <span className="truncate">Agotado</span>
              : hasVariants ? <span className="truncate">Ver opciones</span>
                : String(diseno?.[`${VR}CardButton`] || '').trim()
                  ? <span className="truncate">{ed(diseno, 'CardButton', 'Agregar al carrito')}</span>
                  : <><span className="sm:hidden">Agregar</span><span className="hidden truncate sm:inline">Agregar al carrito</span></>}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

// ─────────────────────────────────────────────────────────────── Carrito ──
export function VerenaCartModal({ isOpen, onClose, carrito, actualizarCantidad, onCheckout, t, tienda, diseno }: { isOpen: boolean; onClose: () => void; carrito: any[]; setCarrito?: (c: any[]) => void; actualizarCantidad: (id: any, qty: number) => void; onCheckout: () => void; t: Theme; tienda: any; diseno: any }) {
  const items: any[] = carrito || [];
  const total = items.reduce((a, it) => a + Number(it.precioUnitario || 0) * Number(it.cantidad || 1), 0);
  const storeName = storeNameOf(tienda) || 'la tienda';
  const waUrl = items.length
    ? buildStorePurchaseWhatsappUrl(
      tienda?.whatsappTienda ?? diseno?.whatsappTienda,
      `Hola, quiero pedir estos productos en ${storeName}:\n\n${items.map((it) => `• ${Number(it.cantidad || 1)} x ${it.descripcion} - ${vrMoney(Number(it.precioUnitario || 0) * Number(it.cantidad || 1))}`).join('\n')}\n\nTotal estimado: ${vrMoney(total)}`,
    )
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button type="button" aria-label="Cerrar carrito" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" />
          <motion.aside role="dialog" aria-label="Carrito" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 250 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: t.line }}>
              <div>
                <h2 className="text-[22px] font-bold" style={{ color: t.ink }}>Tu carrito</h2>
                <p className="text-[13px]" style={{ color: t.muted }}>{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
              </div>
              <button type="button" aria-label="Cerrar" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.05] transition-colors hover:bg-black/[0.09]"><Icon icon="solar:close-circle-linear" width={22} /></button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-5" style={{ background: t.bg }}>
              {!items.length ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: t.cream, color: t.primary }}><Icon icon="solar:bag-3-linear" width={38} /></span>
                  <h3 className="mt-5 text-[18px] font-bold" style={{ color: t.ink }}>Tu carrito está vacío</h3>
                  <p className="mt-1.5 text-[14px]" style={{ color: t.muted }}>Explora la tienda y elige tu próxima favorita.</p>
                  <button type="button" onClick={onClose} className="mt-6 rounded-xl px-6 py-3 text-[14px] font-bold" style={{ background: t.primary, color: t.onPrimary }}>Seguir comprando</button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => {
                    const id = item.cartId || item.id;
                    const qty = Number(item.cantidad || 1);
                    return (
                      <li key={id} className="relative grid grid-cols-[80px_1fr] gap-3 rounded-2xl border bg-white p-3" style={{ borderColor: t.line }}>
                        <button type="button" aria-label="Quitar" onClick={() => actualizarCantidad(id, 0)} className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-[#9A9EA0] transition-colors hover:bg-rose-50 hover:text-rose-500"><Icon icon="solar:trash-bin-minimalistic-linear" width={16} /></button>
                        <div className="flex h-20 items-center justify-center rounded-xl" style={{ background: t.tile }}>
                          {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-1.5 mix-blend-multiply" /> : <Icon icon="solar:bag-4-bold-duotone" width={30} style={{ color: t.primary }} />}
                        </div>
                        <div className="min-w-0 pr-7">
                          <h3 className="line-clamp-2 text-[13.5px] font-semibold leading-snug" style={{ color: t.ink }}>{item.descripcion}</h3>
                          <div className="mt-2.5 flex items-center justify-between">
                            <div className="flex h-9 items-center overflow-hidden rounded-lg border" style={{ borderColor: t.line }}>
                              <button type="button" aria-label="Restar" onClick={() => actualizarCantidad(id, qty - 1)} className="w-8 text-[16px] font-semibold hover:bg-black/[0.04]" style={{ color: t.muted }}>−</button>
                              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); actualizarCantidad(id, d === '' ? 1 : parseInt(d, 10)); }} onFocus={(e) => e.currentTarget.select()} className="w-10 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[13.5px] font-bold outline-none focus:ring-0" style={{ color: t.ink }} />
                              <button type="button" aria-label="Sumar" onClick={() => actualizarCantidad(id, qty + 1)} className="w-8 text-[16px] font-semibold hover:bg-black/[0.04]" style={{ color: t.muted }}>+</button>
                            </div>
                            <span className="text-[15px] font-bold" style={{ color: t.ink }}>{vrMoney(Number(item.precioUnitario || 0) * qty)}</span>
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
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[14px] font-medium" style={{ color: t.muted }}>Subtotal</span>
                  <span className="text-[24px] font-bold" style={{ color: t.ink }}>{vrMoney(total)}</span>
                </div>
                <p className="mb-4 text-[12.5px]" style={{ color: t.muted }}>El envío se calcula en el siguiente paso según tu ubicación.</p>
                <button type="button" onClick={() => { onClose(); onCheckout(); }} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold transition-[filter] hover:brightness-110" style={{ background: t.primary, color: t.onPrimary }}>
                  Ir a pagar <Icon icon="solar:arrow-right-linear" width={19} />
                </button>
                {waUrl && (
                  <a href={waUrl} target="_blank" rel="noopener noreferrer" className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border text-[14px] font-semibold transition-colors hover:bg-black/[0.03]" style={{ borderColor: t.line, color: t.ink }}>
                    <Icon icon="ic:baseline-whatsapp" width={20} className="text-[#1FA855]" /> Pedir por WhatsApp
                  </a>
                )}
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
