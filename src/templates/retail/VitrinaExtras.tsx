import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { getProductPricing, withPricing } from '@/templates/shared/pricing';
import type { Theme } from './VitrinaParts';
import { vtEase, mix } from './motion';

/**
 * "Siguiente nivel" de la plantilla Retail (Vitrina): búsqueda predictiva, confirmación al agregar,
 * conteos reales, vistos recientemente y envío gratis. Cada pieza con estado propio vive aislada aquí
 * (nunca re-renderiza las tarjetas de la página). Todo sale de la API pública; nada inventado.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';
const money = (v: any) => `S/ ${Number(v || 0).toFixed(2)}`;
const isLive = (slug?: string) => Boolean(slug) && slug !== 'preview';

/** Lista de productos de la API pública (el endpoint anida { data: { data, total } }). */
function unwrapProducts(res: any): { items: any[]; total: number } {
  const d = res?.data?.data ?? res?.data;
  if (Array.isArray(d)) return { items: d, total: d.length };
  if (Array.isArray(d?.data)) return { items: d.data, total: Number(d.total ?? d.data.length) };
  return { items: [], total: 0 };
}

// ─────────────────────────────────────────────────────── Totales reales ──
const totalCache = new Map<string, Promise<number | null>>();
/** Total REAL de productos (opcionalmente por categoría) con caché por sesión. null = no disponible. */
export function fetchTotal(slug: string, category?: string): Promise<number | null> {
  const key = `${slug}::${category || ''}`;
  if (!totalCache.has(key)) {
    totalCache.set(key, axios.get(`${BASE_URL}/public/store/${slug}/products`, { params: { limit: 1, ...(category ? { category } : {}) } })
      .then((r) => { const { total } = unwrapProducts(r); return Number.isFinite(total) ? total : null; })
      .catch(() => { totalCache.delete(key); return null; }));
  }
  return totalCache.get(key)!;
}

export function useStoreTotal(slug: string, category?: string): number | null {
  const [total, setTotal] = useState<number | null>(null);
  useEffect(() => {
    if (!isLive(slug)) { setTotal(null); return; }
    let alive = true;
    fetchTotal(slug, category).then((n) => { if (alive) setTotal(n); });
    return () => { alive = false; };
  }, [slug, category]);
  return total;
}

/** "24 productos" (conteo real de la categoría) o el texto por defecto mientras carga / si no hay dato. */
export function CategoryCount({ slug, category, fallback, t }: { slug: string; category: string; fallback: string; t: Theme }) {
  const n = useStoreTotal(slug, category);
  return <span className="mt-0.5 text-[11.5px] font-bold" style={{ color: t.primaryInk }}>{n && n > 0 ? `${n} ${n === 1 ? 'producto' : 'productos'}` : fallback}</span>;
}

// ─────────────────────────────────────────────── Confirmación al agregar ──
type Added = { id: number; producto: any; qty: number };
const listeners = new Set<(a: Added) => void>();
let seq = 0;
/** Avisa que se agregó un producto al carrito (lo escucha el toast del header, en cualquier página). */
export function announceAdded(producto: any, qty = 1) {
  const a = { id: ++seq, producto, qty: Math.max(1, qty) };
  listeners.forEach((fn) => fn(a));
}

/** Toast "Agregado al carrito" con miniatura, cantidad y acceso al carrito. Estado y timer aislados. */
export function AddedToast({ t, onOpenCart }: { t: Theme; onOpenCart: () => void }) {
  const [item, setItem] = useState<Added | null>(null);
  useEffect(() => {
    const fn = (a: Added) => setItem(a);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  useEffect(() => {
    if (!item) return;
    const id = window.setTimeout(() => setItem(null), 3800);
    return () => window.clearTimeout(id);
  }, [item]);
  const price = item ? getProductPricing(item.producto).precioFinal : 0;
  return (
    <div className="pointer-events-none fixed inset-x-3 top-[140px] z-[45] flex justify-end sm:inset-x-auto sm:right-6 md:top-[84px] lg:top-[128px]" aria-live="polite">
      <AnimatePresence>
        {item && (
          <motion.div key={item.id} initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28, ease: vtEase }} className="pointer-events-auto w-full max-w-[360px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-24px_rgba(27,29,28,0.5)]" style={{ boxShadow: `inset 0 0 0 1px ${t.line}, 0 24px 60px -24px rgba(27,29,28,0.5)` }} role="status">
            <div className="flex items-center gap-3 p-3">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                {item.producto?.imagenUrl ? <img src={item.producto.imagenUrl} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" /> : <Icon icon="solar:bag-4-linear" width={24} style={{ color: t.primaryInk }} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[12px] font-extrabold" style={{ color: t.primaryInk }}><Icon icon="solar:check-circle-bold" width={15} /> Agregado al carrito</p>
                <p className="mt-0.5 line-clamp-1 text-[13px] font-bold" style={{ color: t.ink }}>{item.producto?.descripcion}</p>
                <p className="text-[12px]" style={{ color: t.muted }}>{item.qty} × {money(price)}</p>
              </div>
              <button type="button" aria-label="Cerrar aviso" onClick={() => setItem(null)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-black/[0.05]" style={{ color: t.muted }}><Icon icon="solar:close-circle-linear" width={18} /></button>
            </div>
            <div className="flex gap-2 border-t px-3 py-2.5" style={{ borderColor: t.line, background: t.softer }}>
              <button type="button" onClick={() => { setItem(null); onOpenCart(); }} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[12.5px] font-bold transition-[filter] hover:brightness-110" style={{ background: t.primary, color: t.onPrimary }}>
                <Icon icon="solar:cart-large-2-linear" width={16} /> Ver carrito
              </button>
              <button type="button" onClick={() => setItem(null)} className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-white text-[12.5px] font-bold" style={{ color: t.ink, boxShadow: `inset 0 0 0 1px ${t.line}` }}>Seguir comprando</button>
            </div>
            {/* Barra que se consume mientras el aviso está visible (solo transform). */}
            <motion.span aria-hidden className="block h-[3px] origin-left" style={{ background: t.accent }} initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: 3.8, ease: 'linear' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ───────────────────────────────────────────────────── Búsqueda predictiva ──
const recentKey = (slug: string) => `vitrina:busquedas:${slug}`;
const readRecentSearches = (slug: string): string[] => {
  try { const v = JSON.parse(localStorage.getItem(recentKey(slug)) || '[]'); return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 5) : []; } catch { return []; }
};
const saveRecentSearch = (slug: string, q: string) => {
  try { localStorage.setItem(recentKey(slug), JSON.stringify([q, ...readRecentSearches(slug).filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 5))); } catch { /* almacenamiento no disponible */ }
};

/**
 * Buscador del header con resultados en vivo (API pública, búsqueda por palabras), navegación con teclado
 * y búsquedas recientes del propio visitante. En el preview (sin API) funciona como buscador simple.
 */
export function SearchBox({ t, slug, placeholder, className, onSearch, onOpenProduct }: { t: Theme; slug: string; placeholder: string; className: string; onSearch: (q: string) => void; onOpenProduct: (p: any) => void }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<{ items: any[]; total: number }>({ items: [], total: 0 });
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);
  const term = q.trim();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  useEffect(() => {
    setActive(-1);
    if (!isLive(slug) || term.length < 2) { setRes({ items: [], total: 0 }); setLoading(false); return; }
    let alive = true;
    setLoading(true);
    const id = window.setTimeout(() => {
      axios.get(`${BASE_URL}/public/store/${slug}/products`, { params: { search: term, limit: 6 } })
        .then((r) => { if (alive) setRes(unwrapProducts(r)); })
        .catch(() => { if (alive) setRes({ items: [], total: 0 }); })
        .finally(() => { if (alive) setLoading(false); });
    }, 250);
    return () => { alive = false; window.clearTimeout(id); };
  }, [term, slug]);

  const submit = (value = term) => {
    const v = value.trim();
    if (v && isLive(slug)) saveRecentSearch(slug, v);
    setOpen(false);
    onSearch(v);
  };
  const pick = (p: any) => { if (term) saveRecentSearch(slug, term); setOpen(false); setQ(''); onOpenProduct(p); };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (!res.items.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((v) => (v + 1) % res.items.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((v) => (v <= 0 ? res.items.length - 1 : v - 1)); }
    if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(res.items[active]); }
  };
  const showRecent = open && !term && recent.length > 0;
  const showResults = open && term.length >= 2 && isLive(slug);

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <form role="search" onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex h-12 w-full items-center rounded-xl bg-white pl-4 pr-1.5" style={{ boxShadow: `inset 0 0 0 ${open ? 1.5 : 1}px ${open ? t.primaryInk : t.line}, 0 6px 20px -14px rgba(27,29,28,0.45)` }}>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => { setRecent(isLive(slug) ? readRecentSearches(slug) : []); setOpen(true); }}
          onKeyDown={onKey}
          placeholder={placeholder}
          aria-label="Buscar productos"
          aria-expanded={showResults || showRecent}
          aria-controls="vt-search-list"
          role="combobox"
          aria-autocomplete="list"
          className="min-w-0 flex-1 appearance-none border-0 bg-transparent bg-none p-0 text-[14px] outline-none placeholder:text-stone-400 focus:ring-0"
          style={{ color: t.ink }}
        />
        {q && <button type="button" aria-label="Borrar" onClick={() => { setQ(''); setOpen(true); }} className="mr-0.5 flex h-8 w-8 items-center justify-center rounded-lg" style={{ color: t.muted }}><Icon icon="solar:close-circle-linear" width={18} /></button>}
        <button type="submit" aria-label="Buscar" className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-black/[0.04]" style={{ color: t.ink }}>
          {loading ? <Icon icon="solar:refresh-linear" width={18} className="animate-spin" /> : <Icon icon="solar:magnifer-linear" width={20} />}
        </button>
      </form>

      <AnimatePresence>
        {(showResults || showRecent) && (
          <motion.div id="vt-search-list" role="listbox" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18, ease: vtEase }} className="absolute inset-x-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-2xl bg-white p-2 shadow-[0_28px_60px_-28px_rgba(27,29,28,0.55)]" style={{ boxShadow: `inset 0 0 0 1px ${t.line}, 0 28px 60px -28px rgba(27,29,28,0.55)` }}>
            {showRecent && (
              <>
                <p className="px-3 pb-1 pt-2 text-[11px] font-extrabold uppercase tracking-[0.12em]" style={{ color: t.muted }}>Búsquedas recientes</p>
                <div className="flex flex-wrap gap-1.5 px-2 pb-2">
                  {recent.map((r) => (
                    <button key={r} type="button" onClick={() => { setQ(r); submit(r); }} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold" style={{ background: t.softer, color: t.ink, boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                      <Icon icon="solar:history-linear" width={14} style={{ color: t.muted }} />{r}
                    </button>
                  ))}
                </div>
              </>
            )}
            {showResults && (
              loading && !res.items.length ? (
                <div className="space-y-2 p-2">{[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl" style={{ background: t.softer }} />)}</div>
              ) : !res.items.length ? (
                <p className="px-3 py-5 text-center text-[13px]" style={{ color: t.muted }}>Sin resultados para “{term}”. Prueba con otra palabra.</p>
              ) : (
                <>
                  {res.items.map((p, i) => {
                    const pr = getProductPricing(p);
                    return (
                      <button key={p.id} type="button" role="option" aria-selected={active === i} onMouseEnter={() => setActive(i)} onClick={() => pick(p)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors" style={{ background: active === i ? t.soft : undefined }}>
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                          {p.imagenUrl ? <img src={p.imagenUrl} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" /> : <Icon icon="solar:bag-4-linear" width={20} style={{ color: t.muted }} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-1 text-[13px] font-bold" style={{ color: t.ink }}>{p.descripcion}</span>
                          {p?.categoria?.nombre && <span className="block text-[11.5px]" style={{ color: t.muted }}>{p.categoria.nombre}</span>}
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-[13px] font-extrabold" style={{ color: t.ink }}>{money(pr.precioFinal)}</span>
                          {pr.enOferta && <span className="block text-[11px] line-through" style={{ color: t.muted }}>{money(pr.precioRegular)}</span>}
                        </span>
                      </button>
                    );
                  })}
                  <button type="button" onClick={() => submit()} className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-bold" style={{ background: t.softer, color: t.primaryInk }}>
                    Ver {res.total > res.items.length ? `los ${res.total} resultados` : 'todos los resultados'} <Icon icon="solar:arrow-right-linear" width={15} />
                  </button>
                </>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────── Vistos recientemente ──
const viewedKey = (slug: string) => `vitrina:vistos:${slug}`;
/** Registra la visita a una ficha (solo ids; los datos se piden frescos al mostrarlos). */
export function recordViewed(slug: string, id: any) {
  if (!isLive(slug) || id === undefined || id === null) return;
  try {
    const cur: any[] = JSON.parse(localStorage.getItem(viewedKey(slug)) || '[]');
    const next = [String(id), ...(Array.isArray(cur) ? cur.map(String) : []).filter((x) => x !== String(id))].slice(0, 12);
    localStorage.setItem(viewedKey(slug), JSON.stringify(next));
  } catch { /* almacenamiento no disponible */ }
}

/**
 * Productos vistos por ESTE visitante (localStorage), con datos frescos de la API (precio y stock actuales).
 * Carga aislada; si no hay historial (o solo el producto actual) no se muestra.
 */
export function useViewedProducts(slug: string, excludeId?: any, max = 8): any[] {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    if (!isLive(slug)) { setItems([]); return; }
    let ids: string[] = [];
    try { const v = JSON.parse(localStorage.getItem(viewedKey(slug)) || '[]'); ids = Array.isArray(v) ? v.map(String) : []; } catch { ids = []; }
    ids = ids.filter((x) => x !== String(excludeId ?? '')).slice(0, max);
    if (!ids.length) { setItems([]); return; }
    let alive = true;
    Promise.all(ids.map((id) => axios.get(`${BASE_URL}/public/store/${slug}/products/${id}`).then((r) => withPricing(r.data?.data || r.data)).catch(() => null)))
      .then((list) => { if (alive) setItems(list.filter((p: any) => p && p.id)); });
    return () => { alive = false; };
  }, [slug, excludeId, max]);
  return items;
}

// ──────────────────────────────────────────────────────── Envío gratis ──
const shipCache = new Map<string, Promise<number>>();
function fetchFreeShipping(slug: string): Promise<number> {
  if (!shipCache.has(slug)) {
    shipCache.set(slug, axios.get(`${BASE_URL}/public/store/${slug}/shipping-config`)
      .then((r) => Number((r.data?.data || r.data)?.envioGratisDesdeSoles || 0))
      .catch(() => { shipCache.delete(slug); return 0; }));
  }
  return shipCache.get(slug)!;
}

/** Progreso hacia el envío gratis REAL (envioGratisDesdeSoles). Sin umbral configurado → no se muestra. */
export function FreeShippingProgress({ t, slug, subtotal }: { t: Theme; slug: string; subtotal: number }) {
  const [umbral, setUmbral] = useState(0);
  useEffect(() => {
    if (!isLive(slug)) { setUmbral(0); return; }
    let alive = true;
    fetchFreeShipping(slug).then((n) => { if (alive) setUmbral(n); });
    return () => { alive = false; };
  }, [slug]);
  if (!(umbral > 0)) return null;
  const falta = Math.max(0, umbral - subtotal);
  const pct = Math.min(1, subtotal / umbral);
  return (
    <div className="mb-4 rounded-xl px-3.5 py-3" style={{ background: falta > 0 ? t.softer : mix(t.primary, 12, '#fff'), boxShadow: `inset 0 0 0 1px ${t.line}` }}>
      <p className="flex items-center gap-2 text-[12.5px] font-bold" style={{ color: t.ink }}>
        <Icon icon={falta > 0 ? 'solar:delivery-linear' : 'solar:check-circle-bold'} width={17} style={{ color: t.primaryInk }} />
        {falta > 0 ? <>Te faltan <span style={{ color: t.primaryInk }}>{money(falta)}</span> para el envío gratis</> : '¡Tu pedido tiene envío gratis!'}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
        <motion.div className="h-full origin-left rounded-full" style={{ background: t.primary }} initial={false} animate={{ scaleX: pct }} transition={{ duration: 0.5, ease: vtEase }} />
      </div>
    </div>
  );
}
