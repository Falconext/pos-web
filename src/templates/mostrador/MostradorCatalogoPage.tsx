import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { TemplateCatalogoPageProps } from '@/templates/shared/types';
import ProductCustomizationModal from '@/components/tienda/ProductCustomizationModal';
import { persistTiendaCart } from '@/utils/tiendaCart';
import {
  MostradorHeader, MostradorFooter, MostradorCartModal, MostradorProductCard, mostradorTheme, useMostradorFont,
  editable, isOn, isLive, btnCls, primaryBtn, type Theme,
} from './MostradorParts';
import { MostradorQuickView, type CartLine } from './MostradorQuickView';
import { useStoreTotal } from './MostradorExtras';
import { moCardIn, moEase } from './motion';
import { useEditorEnVivo } from './MostradorEditorEnVivo';
import { productoEnCategoria } from '@/components/tienda/navTienda';

// Valores que entiende Catalogo.tsx (el ordenamiento se hace allí).
const SORTS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'price-asc', label: 'Menor precio' },
  { value: 'price-desc', label: 'Mayor precio' },
  { value: 'name-asc', label: 'A – Z' },
];
const getName = (item: any) => (typeof item === 'string' ? item : item?.nombre || item?.name || '');

/**
 * Plantilla Mostrador: la tienda ES el catálogo (una sola página). El inicio y la ficha redirigen aquí;
 * el producto se ve en una vista rápida y todo termina en el carrito → checkout.
 */
export default function MostradorCatalogoPage(props: TemplateCatalogoPageProps) {
  const {
    tienda, slug, diseno: disenoTienda, sortedProductos, productos: allLoaded, loading, total, page, cargarProductos,
    allCategorías, selectedCategorías, setSelectedCategorías, sortBy, setSortBy, search, setSearch,
    carrito, setCarrito, mostrarCarrito, setMostrarCarrito, actualizarCantidad, irACheckout,
    handleAgregarProducto, agregarAlCarritoDirecto,
    showPersonalizarModal, setShowPersonalizarModal, productoAPersonalizar, setProductoAPersonalizar, modificadoresProducto,
  } = props as any;

  // Mostrador no tiene portada: el editor en vivo del dueño vive en el catálogo.
  const { diseno, editor } = useEditorEnVivo(slug, disenoTienda);
  useMostradorFont();
  const t = mostradorTheme(diseno);
  const routerNavigate = useNavigate();
  const [params] = useSearchParams();
  const live = isLive(slug);
  const [quick, setQuick] = useState<any>(null);

  const categories: string[] = useMemo(() => (allCategorías || []).map(getName).filter(Boolean), [allCategorías]);
  const products: any[] = Array.isArray(sortedProductos) ? sortedProductos : [];
  const shown = products.length;
  const totalCount = Math.max(Number(total) || 0, shown);
  const selCats: string[] = selectedCategorías || [];
  const activeCat = selCats.length === 1 ? selCats[0] : null;
  const cart: any[] = carrito || [];
  const cartCount = cart.reduce((s: number, i: any) => s + Number(i?.cantidad || 1), 0);
  const qtyInCart = useMemo(() => {
    const m = new Map<string, number>();
    cart.forEach((it) => { if (!it?.modificadores?.length && !String(it?.id ?? '').includes('::')) m.set(String(it.id), Number(it.cantidad || 1)); });
    return m;
  }, [cart]);

  // Ficha compartida por enlace (/producto/:id redirige aquí con ?producto=ID): abre la vista rápida.
  useEffect(() => {
    const id = params.get('producto');
    if (id && live) setQuick({ id: Number(id) || id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickCategory = (c: string | null) => { setSelectedCategorías(c ? [c] : []); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goHome = () => { setSelectedCategorías([]); setSearch(''); };
  // El logo vuelve a "Todo" (la tienda es esta página); el resto de destinos navega normal.
  const headerNavigate = (to: string) => { if (to.endsWith('/catalogo')) goHome(); else if (live) routerNavigate(to); };

  /** Une una línea al carrito (misma línea → suma cantidades). Devuelve el carrito resultante. */
  const mergeLine = (cur: any[], line: CartLine) => {
    const i = cur.findIndex((c) => String(c.id) === String(line.id) && !c.modificadores?.length);
    if (i < 0) return [...cur, line];
    const copy = [...cur];
    copy[i] = { ...copy[i], cantidad: Number(copy[i].cantidad || 1) + Number(line.cantidad || 1) };
    return copy;
  };
  const addLine = (line: CartLine) => setCarrito(mergeLine(cart, line));
  const buyNow = (line: CartLine) => {
    const next = mergeLine(cart, line);
    setCarrito(next);
    setQuick(null);
    if (!live) { irACheckout(); return; }
    // Se persiste antes de navegar: el checkout lee este carrito y no debe ver el de antes del clic.
    persistTiendaCart(slug, next);
    routerNavigate(`/tienda/${slug}/checkout${params.get('previewPlantilla') ? `?previewPlantilla=${params.get('previewPlantilla')}` : ''}`, { state: { carrito: next, tienda } });
  };
  const closeQuick = useCallback(() => setQuick(null), []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen overflow-x-clip" style={{ background: t.bg, fontFamily: t.font }}>
        <MostradorHeader tienda={tienda || {}} slug={slug} diseno={diseno} t={t} cartCount={cartCount} onOpenCart={() => setMostrarCarrito(true)} navigate={headerNavigate} />

        <main className="relative z-10 mx-auto grid max-w-[1400px] gap-4 px-3 pb-10 pt-1 lg:grid-cols-[250px_minmax(0,1fr)] lg:px-6">
          {/* Categorías (escritorio) */}
          <aside className="hidden lg:block">
            <nav aria-label="Categorías" className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-white p-2 shadow-[0_20px_50px_-40px_rgba(31,35,40,0.5)] [scrollbar-width:thin]">
              <CatItem t={t} label={editable(diseno?.mostradorAllLabel, 'Todo')} active={!activeCat} count={<AllCount t={t} slug={slug} fallback={live ? null : (allLoaded || []).length} />} onClick={() => pickCategory(null)} />
              {categories.map((c) => (
                <CatItem key={c} t={t} label={c} active={activeCat === c} count={<CatCount t={t} slug={slug} category={c} products={allLoaded} />} onClick={() => pickCategory(c)} />
              ))}
            </nav>
          </aside>

          <section className="min-w-0 rounded-2xl bg-white p-3 shadow-[0_20px_50px_-40px_rgba(31,35,40,0.5)] sm:p-5">
            <Toolbar t={t} diseno={diseno} search={search || ''} onSearch={setSearch} cartCount={cartCount} onOpenCart={() => setMostrarCarrito(true)} />

            {/* Categorías (móvil): chips deslizables */}
            {categories.length > 0 && (
              <div className="-mx-3 mt-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
                {[null, ...categories].map((c) => {
                  const on = c === null ? !activeCat : activeCat === c;
                  return (
                    <button key={c ?? '__all'} type="button" onClick={() => pickCategory(c)} className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[12.5px] font-semibold" style={on ? primaryBtn(t) : { background: t.card, color: t.ink }}>
                      {c ?? editable(diseno?.mostradorAllLabel, 'Todo')}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex max-w-full overflow-x-auto rounded-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Ordenar" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                {SORTS.map((s, i) => {
                  const on = (sortBy || 'relevance') === s.value;
                  return (
                    <button key={s.value} type="button" role="tab" aria-selected={on} onClick={() => setSortBy(s.value)} className="relative h-10 shrink-0 whitespace-nowrap px-3 text-[13px] font-semibold transition-colors sm:px-4" style={{ color: on ? t.onPrimary : t.ink, borderLeft: i ? `1px solid ${t.line}` : undefined }}>
                      {on && <motion.span layoutId="mo-sort" className="absolute inset-0" style={{ background: t.primary }} transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
                      <span className="relative">{s.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[13px]" style={{ color: t.muted }}>
                {loading && !shown ? 'Cargando…' : <><strong style={{ color: t.ink }}>{totalCount.toLocaleString('es-PE')}</strong> {totalCount === 1 ? 'producto' : 'productos'}{activeCat ? <> en <strong style={{ color: t.ink }}>{activeCat}</strong></> : null}</>}
              </p>
            </div>

            <AnimatePresence initial={false}>
              {(search || activeCat) && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: moEase }} className="overflow-hidden">
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {search && <button type="button" onClick={() => setSearch('')} className="inline-flex items-center gap-1.5 rounded-full py-1.5 pl-3 pr-2 text-[12px] font-semibold" style={{ background: t.soft, color: t.primaryInk }}>“{search}”<Icon icon="solar:close-circle-linear" width={15} /></button>}
                    {activeCat && <button type="button" onClick={() => pickCategory(null)} className="inline-flex items-center gap-1.5 rounded-full py-1.5 pl-3 pr-2 text-[12px] font-semibold" style={{ background: t.soft, color: t.primaryInk }}>{activeCat}<Icon icon="solar:close-circle-linear" width={15} /></button>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4">
              {loading && shown === 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4.2] animate-pulse rounded-2xl" style={{ background: t.card }} />)}</div>
              ) : shown === 0 ? (
                <Empty t={t} search={search} onClear={goHome} />
              ) : (
                <>
                  <motion.div key={[selCats.join('|'), search, sortBy].join('#')} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {products.map((p, i) => (
                      <motion.div key={p.id ?? i} custom={i % 30} variants={moCardIn} className="h-full">
                        <MostradorProductCard
                          producto={p}
                          t={t}
                          inCart={qtyInCart.get(String(p.id)) || 0}
                          onOpen={() => setQuick(p)}
                          onAdd={() => handleAgregarProducto({ ...p, __cantidad: 1 })}
                          onSetQty={(n) => actualizarCantidad(p.id, Math.max(0, n))}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                  <LoadMore t={t} hasMore={totalCount > shown} loading={loading} shown={shown} total={totalCount} onMore={() => cargarProductos(page + 1)} auto={!isOn(diseno?.mostradorInfiniteHidden)} />
                </>
              )}
            </div>
          </section>
        </main>

        <MostradorFooter tienda={tienda} slug={slug} diseno={diseno} t={t} />

        <MostradorCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={irACheckout} t={t} tienda={tienda} diseno={diseno} />
        <MostradorQuickView t={t} slug={slug} producto={quick} tienda={tienda} diseno={diseno} onClose={closeQuick} onAddLine={addLine} onBuyNow={buyNow} />

        {showPersonalizarModal && productoAPersonalizar && (
          <ProductCustomizationModal
            isOpen={showPersonalizarModal}
            onClose={() => { setShowPersonalizarModal(false); setProductoAPersonalizar(null); }}
            product={productoAPersonalizar}
            modifiers={modificadoresProducto}
            onConfirm={(producto: any, mods: any[]) => { agregarAlCarritoDirecto(producto, mods); setShowPersonalizarModal(false); setProductoAPersonalizar(null); }}
          />
        )}
        {editor}
      </div>
    </MotionConfig>
  );
}

// ─────────────────────────────────────────────────────────── piezas ──
function CatItem({ t, label, count, active, onClick }: { t: Theme; label: string; count: ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-current={active} className="relative flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-left text-[13.5px] font-semibold transition-colors hover:bg-black/[0.025]" style={{ color: active ? t.primaryInk : t.ink }}>
      {active && <motion.span layoutId="mo-cat" className="absolute inset-0 rounded-xl" style={{ background: t.soft }} transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
      <span className="relative min-w-0 leading-snug">{label}</span>
      <span className="relative shrink-0 text-[12.5px] font-semibold tabular-nums" style={{ color: active ? t.primaryInk : t.muted }}>{count}</span>
    </button>
  );
}

/** Conteo real de la categoría: API (total) en la tienda; en el preview, los productos de ejemplo. Aislado por fila. */
function CatCount({ t, slug, category, products }: { t: Theme; slug: string; category: string; products: any[] }) {
  const n = useStoreTotal(slug, category);
  const local = isLive(slug) ? null : (products || []).filter((p) => productoEnCategoria(p, category)).length;
  const v = n ?? local;
  return v === null || v === undefined ? <span className="inline-block h-3 w-6 animate-pulse rounded" style={{ background: t.card }} /> : <>{v.toLocaleString('es-PE')}</>;
}
function AllCount({ t, slug, fallback }: { t: Theme; slug: string; fallback: number | null }) {
  const n = useStoreTotal(slug);
  const v = n ?? fallback;
  return v === null ? <span className="inline-block h-3 w-8 animate-pulse rounded" style={{ background: t.card }} /> : <>{v.toLocaleString('es-PE')}</>;
}

/** Buscador + botón "Buscar" + carrito, como la referencia. Estado local: aplica al enviar. */
function Toolbar({ t, diseno, search, onSearch, cartCount, onOpenCart }: { t: Theme; diseno: any; search: string; onSearch: (v: string) => void; cartCount: number; onOpenCart: () => void }) {
  const [q, setQ] = useState(search);
  useEffect(() => setQ(search), [search]);
  return (
    <div className="flex items-center gap-2">
      <form role="search" onSubmit={(e) => { e.preventDefault(); onSearch(q.trim()); }} className="flex min-w-0 flex-1 items-center gap-2">
        <div className="flex h-11 min-w-0 flex-1 items-center rounded-xl px-3.5 sm:max-w-[360px]" style={{ background: t.card, boxShadow: `inset 0 0 0 1px ${t.line}` }}>
          <Icon icon="solar:magnifer-linear" width={18} style={{ color: t.muted }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={editable(diseno?.mostradorSearchPlaceholder, 'Nombre o código del producto')} aria-label="Buscar productos" className="min-w-0 flex-1 appearance-none border-0 bg-transparent bg-none px-2.5 text-[14px] outline-none placeholder:text-stone-400 focus:ring-0" style={{ color: t.ink }} />
          {q && <button type="button" aria-label="Borrar" onClick={() => { setQ(''); onSearch(''); }} className="flex h-7 w-7 items-center justify-center" style={{ color: t.muted }}><Icon icon="solar:close-circle-linear" width={17} /></button>}
        </div>
        <button type="submit" className={`${btnCls} h-11 shrink-0 px-5`} style={primaryBtn(t)}>{editable(diseno?.mostradorSearchButton, 'Buscar')}</button>
      </form>
      <button type="button" onClick={onOpenCart} aria-label={`Carrito (${cartCount})`} className="relative ml-auto hidden h-11 w-14 shrink-0 items-center justify-center rounded-xl sm:flex" style={{ boxShadow: `inset 0 0 0 1.5px ${t.primary}`, color: t.primaryInk }}>
        <Icon icon="solar:cart-large-2-linear" width={21} />
        {cartCount > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-extrabold" style={{ background: t.accent, color: t.onAccent }}>{cartCount}</span>}
      </button>
    </div>
  );
}

/** Carga infinita: un centinela al final pide la página siguiente; el botón queda de respaldo. Estado aislado. */
function LoadMore({ t, hasMore, loading, shown, total, onMore, auto }: { t: Theme; hasMore: boolean; loading: boolean; shown: number; total: number; onMore: () => void; auto: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  useEffect(() => { if (!loading) busy.current = false; }, [loading]);
  useEffect(() => {
    if (!auto || !hasMore || typeof IntersectionObserver === 'undefined') return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && !busy.current && !loading) { busy.current = true; onMore(); } }, { rootMargin: '600px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [auto, hasMore, loading, onMore]);
  if (!hasMore) return shown > 12 ? <p className="mt-8 text-center text-[12.5px]" style={{ color: t.muted }}>Viste los {total.toLocaleString('es-PE')} productos</p> : null;
  return (
    <div ref={ref} className="mx-auto mt-8 flex max-w-xs flex-col items-center text-center">
      <p className="text-[12.5px]" style={{ color: t.muted }}>{shown.toLocaleString('es-PE')} de {total.toLocaleString('es-PE')} productos</p>
      <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full" style={{ background: t.card }}>
        <motion.div className="h-full origin-left rounded-full" style={{ background: t.primary }} initial={false} animate={{ scaleX: Math.min(1, shown / Math.max(1, total)) }} transition={{ duration: 0.5, ease: moEase }} />
      </div>
      <button type="button" disabled={loading} onClick={onMore} className={`${btnCls} mt-4 h-11 px-6 disabled:opacity-60`} style={{ background: t.soft, color: t.primaryInk }}>
        {loading ? <><Icon icon="solar:refresh-linear" className="animate-spin" width={16} /> Cargando…</> : 'Ver más productos'}
      </button>
    </div>
  );
}

function Empty({ t, search, onClear }: { t: Theme; search?: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl px-6 py-20 text-center" style={{ background: t.card }}>
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white" style={{ color: t.primaryInk }}><Icon icon="solar:magnifer-linear" width={28} /></span>
      <h3 className="mt-5 text-[17px] font-extrabold" style={{ color: t.ink }}>{search ? `Sin resultados para “${search}”` : 'No hay productos aquí'}</h3>
      <p className="mt-1.5 max-w-sm text-[13px]" style={{ color: t.muted }}>Prueba con otro nombre, un código o mira todo el catálogo.</p>
      <button type="button" onClick={onClear} className={`${btnCls} mt-6 h-11 px-6`} style={primaryBtn(t)}>Ver todo</button>
    </div>
  );
}

