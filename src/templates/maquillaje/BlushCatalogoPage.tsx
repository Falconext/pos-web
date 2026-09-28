import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { TemplateCatalogoPageProps } from '@/templates/shared/types';
import ProductCustomizationModal from '@/components/tienda/ProductCustomizationModal';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import { BlushHeader, BlushFooter, BlushCartModal, BlushProductCard, blushTheme, useBlushFont, editable, blMoney, btnCls, MAQUILLAJE_IMG, type Theme } from './BlushParts';
import { PageHero, GridSkeleton, getName } from './BlushSections';
import { blCardIn, blEase, mix } from './motion';

// Valores que entiende Catalogo.tsx (el ordenamiento se hace allí).
const SORTS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'name-asc', label: 'Nombre A–Z' },
];

export default function BlushCatalogoPage(props: TemplateCatalogoPageProps) {
  const {
    tienda, slug, diseno, navigate, sortedProductos, loading, total, page, cargarProductos,
    allCategorías, allMarcas, filteredMarcas, selectedCategorías, setSelectedCategorías, selectedMarcas, setSelectedMarcas,
    priceRange, setPriceRange, minPrice, maxPrice, sortBy, setSortBy, hasActiveFilters, toggleCategory, toggleBrand,
    search, setSearch, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, actualizarCantidad, irACheckout,
    handleAgregarProducto, agregarAlCarritoDirecto, showMobileFilters, setShowMobileFilters,
    showPersonalizarModal, setShowPersonalizarModal, productoAPersonalizar, setProductoAPersonalizar, modificadoresProducto,
  } = props as any;

  useBlushFont();
  const t = blushTheme(diseno);
  const [showFav, setShowFav] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);

  const categories: string[] = useMemo(() => (allCategorías || []).map(getName).filter(Boolean), [allCategorías]);
  const marcas: string[] = useMemo(() => (filteredMarcas || allMarcas || []).map(getName).filter(Boolean), [filteredMarcas, allMarcas]);
  const products: any[] = Array.isArray(sortedProductos) ? sortedProductos : [];
  const shown = products.length;
  const totalCount = Math.max(Number(total) || 0, shown);
  const selCats: string[] = selectedCategorías || [];
  const selBrands: string[] = selectedMarcas || [];
  const priceActive = Array.isArray(priceRange) && (priceRange[0] > minPrice || priceRange[1] < maxPrice);

  const cartCount = (carrito || []).reduce((s: number, i: any) => s + Number(i?.cantidad || 1), 0);
  const goProduct = (p: any) => navigate(`/tienda/${slug}/producto/${p.id}`);
  const clearFilters = () => { setSelectedCategorías([]); setSelectedMarcas([]); setPriceRange([minPrice, maxPrice]); setSearch(''); };
  const pickCategory = (c: string | null) => setSelectedCategorías(c ? [c] : []);
  // Al cambiar filtros/orden, la grilla vuelve a entrar escalonada.
  const gridKey = [selCats.join('|'), selBrands.join('|'), search, sortBy, (priceRange || []).join('-')].join('#');

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...(search ? [{ key: 's', label: `“${search}”`, onRemove: () => setSearch('') }] : []),
    ...selCats.map((c) => ({ key: `c-${c}`, label: c, onRemove: () => toggleCategory(c) })),
    ...selBrands.map((m) => ({ key: `m-${m}`, label: m, onRemove: () => toggleBrand(m) })),
    ...(priceActive ? [{ key: 'p', label: `${blMoney(priceRange[0])} – ${blMoney(priceRange[1])}`, onRemove: () => setPriceRange([minPrice, maxPrice]) }] : []),
  ];

  const filters = (
    <FilterPanel t={t} categories={categories} marcas={marcas} selCats={selCats} selBrands={selBrands} toggleCategory={toggleCategory} toggleBrand={toggleBrand} priceRange={priceRange} setPriceRange={setPriceRange} minPrice={minPrice} maxPrice={maxPrice} hasActiveFilters={hasActiveFilters} clear={clearFilters} />
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, fontFamily: t.font }}>
        <BlushHeader tienda={tienda || {}} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={navigate} active="catalog" activeCategory={selCats.length === 1 ? selCats[0] : undefined} />

        <PageHero
          t={t}
          image={diseno?.maquillajeCatalogImage || MAQUILLAJE_IMG.catalog}
          crumbs={[{ label: 'Inicio', onClick: () => navigate(`/tienda/${slug}`) }, { label: 'Tienda' }]}
          eyebrow={selCats.length === 1 ? 'Categoría' : editable(diseno?.maquillajeCatalogEyebrow, 'Tienda')}
          title={selCats.length === 1 ? selCats[0] : editable(diseno?.maquillajeCatalogTitle, 'Todo para tu rutina')}
          subtitle={loading && !shown ? 'Cargando productos…' : <><strong style={{ color: t.ink }}>{totalCount}</strong> {totalCount === 1 ? 'producto disponible' : 'productos disponibles'}</>}
        >
          <CatalogSearch t={t} value={search || ''} onSubmit={setSearch} placeholder={editable(diseno?.maquillajeSearchPlaceholder, 'Busca labiales, bases, sérums…')} />
        </PageHero>

        {categories.length > 0 && (
          <div className="sticky top-[76px] z-20 border-b backdrop-blur-md" style={{ background: mix(t.bg, 92, 'transparent'), borderColor: t.line }}>
            <div className="mx-auto flex max-w-[1320px] gap-6 overflow-x-auto px-4 [scrollbar-width:none] lg:px-8 [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Categorías">
              {[null, ...categories].map((c) => {
                const active = c === null ? selCats.length === 0 : selCats.length === 1 && selCats[0] === c;
                return (
                  <button key={c ?? '__all'} type="button" role="tab" aria-selected={active} onClick={() => pickCategory(c)} className="relative flex h-12 shrink-0 items-center whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.16em] transition-colors duration-300" style={{ color: active ? t.ink : t.muted }}>
                    {c ?? 'Todo'}
                    {active && <motion.span layoutId="bl-cat-line" className="absolute inset-x-0 bottom-0 h-[2px]" style={{ background: t.ink }} transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <main className="mx-auto flex max-w-[1320px] gap-10 px-4 py-9 lg:px-8">
          <aside className="hidden w-[240px] shrink-0 lg:block">
            <div className="sticky top-[150px]">{filters}</div>
          </aside>

          <section className="min-w-0 flex-1">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12.5px]" style={{ color: t.muted }}>
                {loading && !shown ? 'Buscando…' : <>Mostrando <strong style={{ color: t.ink }}>{shown}</strong> de <strong style={{ color: t.ink }}>{totalCount}</strong></>}
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowMobileFilters(true)} className="inline-flex h-11 items-center gap-2 px-4 text-[11px] font-medium uppercase tracking-[0.14em] lg:hidden" style={{ boxShadow: `inset 0 0 0 1px ${t.line}`, color: t.ink }}>
                  <Icon icon="solar:tuning-2-linear" width={16} /> Filtros
                  {activeChips.length > 0 && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-semibold" style={{ background: t.primary, color: t.onPrimary }}>{activeChips.length}</span>}
                </button>
                <label className="relative inline-flex h-11 items-center pl-4 pr-10" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                  <span className="mr-2 text-[11px] uppercase tracking-[0.14em]" style={{ color: t.muted }}>Ordenar</span>
                  <select aria-label="Ordenar" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="appearance-none border-0 bg-transparent bg-none py-0 pl-0 pr-1 text-[12.5px] font-medium outline-none focus:ring-0" style={{ color: t.ink }}>
                    {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <Icon icon="solar:alt-arrow-down-linear" width={14} className="pointer-events-none absolute right-4" style={{ color: t.muted }} />
                </label>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {activeChips.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: blEase }} className="overflow-hidden">
                  <div className="mb-6 flex flex-wrap items-center gap-2">
                    {activeChips.map((c) => (
                      <button key={c.key} type="button" onClick={c.onRemove} className="inline-flex items-center gap-1.5 py-1.5 pl-3 pr-2 text-[11.5px] font-medium" style={{ background: t.blush, color: t.ink }}>
                        {c.label}<Icon icon="solar:close-circle-linear" width={14} />
                      </button>
                    ))}
                    <button type="button" onClick={clearFilters} className="ml-1 text-[11.5px] underline underline-offset-4" style={{ color: t.muted }}>Limpiar todo</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {loading && shown === 0 ? (
              <GridSkeleton t={t} count={8} cols="lg:grid-cols-3 xl:grid-cols-4" />
            ) : shown === 0 ? (
              <EmptyState t={t} search={search} onClear={clearFilters} />
            ) : (
              <>
                <motion.div key={gridKey} initial="hidden" animate="show" className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4">
                  {products.map((p, i) => (
                    <motion.div key={p.id ?? i} custom={i} variants={blCardIn} className="h-full">
                      <BlushProductCard producto={p} slug={slug} t={t} onOpen={() => goProduct(p)} onAdd={(q: number) => handleAgregarProducto({ ...p, __cantidad: q })} />
                    </motion.div>
                  ))}
                </motion.div>

                {totalCount > shown && (
                  <div className="mx-auto mt-14 flex max-w-xs flex-col items-center text-center">
                    <p className="text-[12px]" style={{ color: t.muted }}>Has visto {shown} de {totalCount} productos</p>
                    <div className="mt-3 h-[2px] w-full overflow-hidden" style={{ background: t.line }}>
                      <motion.div className="h-full origin-left" style={{ background: t.ink }} initial={false} animate={{ scaleX: Math.min(1, shown / totalCount) }} transition={{ duration: 0.6, ease: blEase }} />
                    </div>
                    <button type="button" disabled={loading} onClick={() => cargarProductos(page + 1)} className={`${btnCls} mt-6 h-12 px-8 disabled:opacity-60`} style={{ boxShadow: `inset 0 0 0 1px ${t.ink}`, color: t.ink }}>
                      {loading ? <><Icon icon="solar:refresh-linear" className="animate-spin" width={15} /> Cargando…</> : 'Cargar más'}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </main>

        <AnimatePresence>
          {showMobileFilters && (
            <>
              <motion.button type="button" aria-label="Cerrar filtros" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMobileFilters(false)} className="fixed inset-0 z-50 bg-stone-900/35 backdrop-blur-[2px] lg:hidden" />
              <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 32, stiffness: 280 }} className="fixed inset-y-0 left-0 z-50 flex w-[88%] max-w-sm flex-col lg:hidden" style={{ background: t.bg, fontFamily: t.font }}>
                <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: t.line }}>
                  <h3 className="text-[13px] font-semibold uppercase tracking-[0.18em]" style={{ color: t.ink }}>Filtros</h3>
                  <button type="button" aria-label="Cerrar" onClick={() => setShowMobileFilters(false)} className="flex h-10 w-10 items-center justify-center" style={{ color: t.ink }}><Icon icon="solar:close-square-linear" width={22} /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-6">{filters}</div>
                <div className="border-t p-5" style={{ borderColor: t.line }}>
                  <button type="button" onClick={() => setShowMobileFilters(false)} className={`${btnCls} h-12 w-full`} style={{ background: t.accent, color: t.onAccent }}>Ver {shown} resultados</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <BlushFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <BlushCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={irACheckout} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.accent} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.accent} onGoProduct={(item: any) => goProduct(item)} />

        {showPersonalizarModal && productoAPersonalizar && (
          <ProductCustomizationModal
            isOpen={showPersonalizarModal}
            onClose={() => { setShowPersonalizarModal(false); setProductoAPersonalizar(null); }}
            product={productoAPersonalizar}
            modifiers={modificadoresProducto}
            onConfirm={(producto: any, mods: any[]) => { agregarAlCarritoDirecto(producto, mods); setShowPersonalizarModal(false); setProductoAPersonalizar(null); }}
          />
        )}
      </div>
    </MotionConfig>
  );
}

// ─────────────────────────────────────────────────────────── piezas ──
/** Buscador del hero con estado local: aplica al enviar, no en cada tecla. */
function CatalogSearch({ t, value, onSubmit, placeholder }: { t: Theme; value: string; onSubmit: (v: string) => void; placeholder: string }) {
  const [q, setQ] = useState(value);
  useEffect(() => setQ(value), [value]);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(q.trim()); }} className="mt-7 flex h-[52px] max-w-xl items-center bg-white pl-5 pr-1.5" role="search">
      <Icon icon="solar:magnifer-linear" width={18} style={{ color: t.muted }} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label="Buscar productos" className="min-w-0 flex-1 border-0 bg-transparent bg-none px-3 text-[14px] outline-none placeholder:text-stone-400 focus:ring-0" style={{ color: t.ink }} />
      {q && <button type="button" aria-label="Borrar búsqueda" onClick={() => { setQ(''); onSubmit(''); }} className="mr-1 flex h-8 w-8 items-center justify-center" style={{ color: t.muted }}><Icon icon="solar:close-circle-linear" width={18} /></button>}
      <button type="submit" className={`${btnCls} h-10 px-5`} style={{ background: t.accent, color: t.onAccent }}>Buscar</button>
    </form>
  );
}

function FilterGroup({ t, title, children, defaultOpen = true }: { t: Theme; title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b pb-5 last:border-b-0" style={{ borderColor: t.line }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between py-1 text-left">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: t.ink }}>{title}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} style={{ color: t.muted }}><Icon icon="solar:alt-arrow-down-linear" width={15} /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: blEase }} className="overflow-hidden">
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckRow({ t, label, checked, onChange }: { t: Theme; label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={onChange} className="flex w-full items-center gap-3 py-1.5 text-left text-[13px] transition-opacity hover:opacity-70" style={{ color: t.ink }}>
      <span className="flex h-4 w-4 shrink-0 items-center justify-center transition-colors duration-200" style={checked ? { background: t.ink, color: '#fff' } : { boxShadow: `inset 0 0 0 1px ${mix(t.ink, 35, '#fff')}` }}>
        {checked && <Icon icon="solar:check-read-linear" width={12} />}
      </span>
      <span className="leading-snug">{label}</span>
    </button>
  );
}

function FilterPanel({ t, categories, marcas, selCats, selBrands, toggleCategory, toggleBrand, priceRange, setPriceRange, minPrice, maxPrice, hasActiveFilters, clear }: any) {
  const max = Number(priceRange?.[1] ?? maxPrice);
  const pct = maxPrice > minPrice ? ((max - minPrice) / (maxPrice - minPrice)) * 100 : 100;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em]" style={{ color: t.ink }}>Filtrar</p>
        {hasActiveFilters && <button type="button" onClick={clear} className="text-[11.5px] underline underline-offset-4" style={{ color: t.muted }}>Limpiar</button>}
      </div>
      <FilterGroup t={t} title="Categorías">
        {categories.length === 0 ? <p className="text-[12px]" style={{ color: t.muted }}>Sin categorías</p> : (
          <div className="max-h-72 overflow-y-auto pr-1">
            {categories.map((c: string) => <CheckRow key={c} t={t} label={c} checked={selCats.includes(c)} onChange={() => toggleCategory(c)} />)}
          </div>
        )}
      </FilterGroup>
      {marcas.length > 0 && (
        <FilterGroup t={t} title="Marcas" defaultOpen={marcas.length <= 8}>
          <div className="max-h-60 overflow-y-auto pr-1">
            {marcas.map((m: string) => <CheckRow key={m} t={t} label={m} checked={selBrands.includes(m)} onChange={() => toggleBrand(m)} />)}
          </div>
        </FilterGroup>
      )}
      {maxPrice > minPrice && (
        <FilterGroup t={t} title="Precio">
          <div>
            <div className="flex items-center justify-between text-[12px]" style={{ color: t.ink }}>
              <span>{blMoney(minPrice)}</span>
              <span className="font-medium">{blMoney(max)}</span>
            </div>
            <input type="range" aria-label="Precio máximo" min={minPrice} max={maxPrice} step="0.1" value={max} onChange={(e) => setPriceRange([minPrice, Number(e.target.value)])} className="mt-4 h-[3px] w-full cursor-pointer appearance-none border-0 focus:ring-0" style={{ accentColor: t.ink, background: `linear-gradient(90deg, ${t.ink} ${pct}%, ${t.line} ${pct}%)` }} />
          </div>
        </FilterGroup>
      )}
    </div>
  );
}

function EmptyState({ t, search, onClear }: { t: Theme; search?: string; onClear: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: blEase }} className="flex flex-col items-center justify-center px-6 py-20 text-center" style={{ background: t.blushSoft }}>
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white" style={{ color: t.primaryInk }}><Icon icon="solar:magnifer-linear" width={26} /></span>
      <h3 className="mt-6 text-[22px]" style={{ color: t.ink, fontFamily: t.serif }}>{search ? `Sin resultados para “${search}”` : 'No encontramos productos'}</h3>
      <p className="mt-2 max-w-sm text-[13px]" style={{ color: t.muted }}>Prueba con otro nombre o quita algunos filtros.</p>
      <button type="button" onClick={onClear} className={`${btnCls} mt-7 h-12 px-7`} style={{ background: t.accent, color: t.onAccent }}>Ver todo el catálogo</button>
    </motion.div>
  );
}
