import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { TemplateCatalogoPageProps } from '@/templates/shared/types';
import ProductCustomizationModal from '@/components/tienda/ProductCustomizationModal';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import { StrideHeader, StrideFooter, StrideCartModal, StrideProductCard, strideTheme, useStrideFont, editable, stMoney, displayStyle, type Theme } from './StrideParts';
import { PageHero, GridSkeleton, getName, categoryIcon } from './StrideSections';
import { mix, stCardIn, stEase } from './motion';

// Valores que entiende Catalogo.tsx (el ordenamiento se hace allí).
const SORTS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'name-asc', label: 'Nombre A–Z' },
];

export default function StrideCatalogoPage(props: TemplateCatalogoPageProps) {
  const {
    tienda, slug, diseno, navigate, sortedProductos, loading, total, page, cargarProductos,
    allCategorías, allMarcas, filteredMarcas, selectedCategorías, setSelectedCategorías, selectedMarcas, setSelectedMarcas,
    priceRange, setPriceRange, minPrice, maxPrice, sortBy, setSortBy, hasActiveFilters, toggleCategory, toggleBrand,
    search, setSearch, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, actualizarCantidad, irACheckout,
    handleAgregarProducto, agregarAlCarritoDirecto, showMobileFilters, setShowMobileFilters,
    showPersonalizarModal, setShowPersonalizarModal, productoAPersonalizar, setProductoAPersonalizar, modificadoresProducto,
  } = props as any;

  useStrideFont();
  const t = strideTheme(diseno);
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
    ...(priceActive ? [{ key: 'p', label: `${stMoney(priceRange[0])} – ${stMoney(priceRange[1])}`, onRemove: () => setPriceRange([minPrice, maxPrice]) }] : []),
  ];

  const filters = (
    <FilterPanel t={t} categories={categories} marcas={marcas} selCats={selCats} selBrands={selBrands} toggleCategory={toggleCategory} toggleBrand={toggleBrand} priceRange={priceRange} setPriceRange={setPriceRange} minPrice={minPrice} maxPrice={maxPrice} hasActiveFilters={hasActiveFilters} clear={clearFilters} />
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, fontFamily: t.font }}>
        <StrideHeader tienda={tienda || {}} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} navigate={navigate} />

        <PageHero
          t={t}
          image={diseno?.zapatosCatalogImage || 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=80'}
          crumbs={[{ label: 'Inicio', onClick: () => navigate(`/tienda/${slug}`) }, { label: 'Catálogo' }]}
          eyebrow={selCats.length === 1 ? 'Categoría' : editable(diseno?.zapatosCatalogEyebrow, 'Catálogo')}
          title={selCats.length === 1 ? selCats[0] : editable(diseno?.zapatosCatalogTitle, 'Todos los modelos')}
          subtitle={loading && !shown ? 'Cargando modelos…' : <><strong style={{ color: t.ink }}>{totalCount}</strong> {totalCount === 1 ? 'modelo disponible' : 'modelos disponibles'}</>}
        >
          <CatalogSearch t={t} value={search || ''} onSubmit={setSearch} />
        </PageHero>

        {categories.length > 0 && (
          <div className="sticky top-[72px] z-20 mt-4 backdrop-blur-md" style={{ background: mix(t.bg, 88, 'transparent') }}>
            <div className="mx-auto flex max-w-[1320px] gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] lg:px-8 [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Categorías">
              {[null, ...categories].map((c) => {
                const active = c === null ? selCats.length === 0 : selCats.length === 1 && selCats[0] === c;
                return (
                  <button key={c ?? '__all'} type="button" role="tab" aria-selected={active} onClick={() => pickCategory(c)} className="relative inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-[12.5px] font-semibold transition-colors duration-300" style={{ color: active ? t.onPrimary : t.ink }}>
                    {active ? <motion.span layoutId="st-cat-pill" className="absolute inset-0 rounded-full" style={{ background: t.primary }} transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                      : <span className="absolute inset-0 rounded-full border bg-white" style={{ borderColor: t.line }} />}
                    <Icon icon={c ? categoryIcon(c) : 'solar:widget-4-linear'} width={16} className="relative" style={{ color: active ? t.onPrimary : t.primaryInk }} />
                    <span className="relative">{c ?? 'Todos'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <main className="mx-auto flex max-w-[1320px] gap-8 px-4 py-8 lg:px-8">
          <aside className="hidden w-[260px] shrink-0 lg:block">
            <div className="sticky top-[140px] rounded-[24px] border bg-white p-6" style={{ borderColor: t.line }}>{filters}</div>
          </aside>

          <section className="min-w-0 flex-1">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13px]" style={{ color: t.muted }}>
                {loading && !shown ? 'Buscando…' : <>Mostrando <strong style={{ color: t.ink }}>{shown}</strong> de <strong style={{ color: t.ink }}>{totalCount}</strong></>}
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowMobileFilters(true)} className="inline-flex h-11 items-center gap-2 rounded-full border bg-white px-4 text-[12.5px] font-semibold lg:hidden" style={{ borderColor: t.line, color: t.ink }}>
                  <Icon icon="solar:tuning-2-linear" width={17} style={{ color: t.primaryInk }} /> Filtros
                  {activeChips.length > 0 && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold" style={{ background: t.primary, color: t.onPrimary }}>{activeChips.length}</span>}
                </button>
                <label className="relative inline-flex h-11 items-center rounded-full border bg-white pl-4 pr-10" style={{ borderColor: t.line }}>
                  <Icon icon="solar:sort-vertical-linear" width={16} className="mr-2" style={{ color: t.primaryInk }} />
                  <select aria-label="Ordenar" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="appearance-none border-0 bg-transparent bg-none py-0 pl-0 pr-1 text-[12.5px] font-semibold outline-none focus:ring-0" style={{ color: t.ink }}>
                    {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <Icon icon="solar:alt-arrow-down-linear" width={15} className="pointer-events-none absolute right-4" style={{ color: t.muted }} />
                </label>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {activeChips.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: stEase }} className="overflow-hidden">
                  <div className="mb-5 flex flex-wrap items-center gap-2">
                    {activeChips.map((c) => (
                      <button key={c.key} type="button" onClick={c.onRemove} className="group inline-flex items-center gap-1.5 rounded-full py-1.5 pl-3.5 pr-2 text-[12px] font-semibold" style={{ background: mix(t.primary, 12, '#fff'), color: t.primaryInk }}>
                        {c.label}<Icon icon="solar:close-circle-linear" width={15} />
                      </button>
                    ))}
                    <button type="button" onClick={clearFilters} className="ml-1 text-[12px] font-semibold underline-offset-4 hover:underline" style={{ color: t.muted }}>Limpiar todo</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {loading && shown === 0 ? (
              <GridSkeleton t={t} count={6} cols="xl:grid-cols-3" />
            ) : shown === 0 ? (
              <EmptyState t={t} search={search} onClear={clearFilters} />
            ) : (
              <>
                <motion.div key={gridKey} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                  {products.map((p, i) => (
                    <motion.div key={p.id ?? i} custom={i} variants={stCardIn} className="h-full">
                      <StrideProductCard producto={p} slug={slug} t={t} onOpen={() => goProduct(p)} onAdd={(q: number) => handleAgregarProducto({ ...p, __cantidad: q })} />
                    </motion.div>
                  ))}
                </motion.div>

                {totalCount > shown && (
                  <div className="mx-auto mt-12 flex max-w-xs flex-col items-center text-center">
                    <p className="text-[12.5px]" style={{ color: t.muted }}>Has visto {shown} de {totalCount} modelos</p>
                    <div className="mt-3 h-1 w-full overflow-hidden rounded-full" style={{ background: t.line }}>
                      <motion.div className="h-full origin-left rounded-full" style={{ background: t.primary }} initial={false} animate={{ scaleX: Math.min(1, shown / totalCount) }} transition={{ duration: 0.6, ease: stEase }} />
                    </div>
                    <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} disabled={loading} onClick={() => cargarProductos(page + 1)} className="mt-5 inline-flex h-12 items-center gap-2 rounded-full px-7 text-[13.5px] font-bold disabled:opacity-60" style={{ background: t.primary, color: t.onPrimary }}>
                      {loading ? <><Icon icon="solar:refresh-linear" className="animate-spin" width={17} /> Cargando…</> : <>Cargar más <Icon icon="solar:alt-arrow-down-linear" width={17} /></>}
                    </motion.button>
                  </div>
                )}
              </>
            )}
          </section>
        </main>

        <AnimatePresence>
          {showMobileFilters && (
            <>
              <motion.button type="button" aria-label="Cerrar filtros" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMobileFilters(false)} className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-[2px] lg:hidden" />
              <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 30, stiffness: 260 }} className="fixed inset-y-0 left-0 z-50 flex w-[88%] max-w-sm flex-col lg:hidden" style={{ background: t.bg, fontFamily: t.font }}>
                <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: t.line }}>
                  <h3 className="text-[16px] font-extrabold uppercase" style={displayStyle(t, { color: t.ink })}>Filtros</h3>
                  <button type="button" aria-label="Cerrar" onClick={() => setShowMobileFilters(false)} className="flex h-10 w-10 items-center justify-center rounded-full border bg-white" style={{ borderColor: t.line, color: t.ink }}><Icon icon="solar:close-circle-linear" width={21} /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-6">{filters}</div>
                <div className="border-t p-5" style={{ borderColor: t.line }}>
                  <button type="button" onClick={() => setShowMobileFilters(false)} className="h-12 w-full rounded-full text-[13.5px] font-bold" style={{ background: t.primary, color: t.onPrimary }}>Ver {shown} resultados</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <StrideFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <StrideCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={irACheckout} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.primary} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.primary} onGoProduct={(item: any) => goProduct(item)} />

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
function CatalogSearch({ t, value, onSubmit }: { t: Theme; value: string; onSubmit: (v: string) => void }) {
  const [q, setQ] = useState(value);
  useEffect(() => setQ(value), [value]);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(q.trim()); }} className="mt-6 flex h-[52px] max-w-xl items-center rounded-full border bg-white pl-5 pr-1.5" style={{ borderColor: t.line }} role="search">
      <Icon icon="solar:magnifer-linear" width={18} style={{ color: t.muted }} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca por modelo, marca o talla…" aria-label="Buscar productos" className="min-w-0 flex-1 border-0 bg-transparent bg-none px-3 text-[14px] outline-none placeholder:text-stone-400 focus:ring-0" style={{ color: t.ink }} />
      {q && <button type="button" aria-label="Borrar búsqueda" onClick={() => { setQ(''); onSubmit(''); }} className="mr-1 flex h-8 w-8 items-center justify-center rounded-full hover:bg-stone-100" style={{ color: t.muted }}><Icon icon="solar:close-circle-linear" width={18} /></button>}
      <button type="submit" className="h-10 rounded-full px-5 text-[13px] font-bold" style={{ background: t.primary, color: t.onPrimary }}>Buscar</button>
    </form>
  );
}

function FilterGroup({ t, title, children, defaultOpen = true }: { t: Theme; title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b pb-5 last:border-b-0 last:pb-0" style={{ borderColor: t.line }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between py-1 text-left">
        <span className="text-[11.5px] font-extrabold uppercase tracking-[0.06em]" style={displayStyle(t, { color: t.ink })}>{title}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} style={{ color: t.muted }}><Icon icon="solar:alt-arrow-down-linear" width={17} /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: stEase }} className="overflow-hidden">
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckRow({ t, label, checked, onChange }: { t: Theme; label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={onChange} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-[13px] font-medium transition-colors hover:bg-stone-50" style={{ color: t.ink }}>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors duration-200" style={checked ? { background: t.primary, borderColor: t.primary, color: t.onPrimary } : { borderColor: t.line }}>
        {checked && <Icon icon="solar:check-read-linear" width={14} />}
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
        <p className="flex items-center gap-2 text-[14px] font-extrabold uppercase" style={displayStyle(t, { color: t.ink })}><Icon icon="solar:tuning-2-linear" width={18} style={{ color: t.primaryInk }} /> Filtrar</p>
        {hasActiveFilters && <button type="button" onClick={clear} className="text-[12px] font-semibold" style={{ color: t.accent }}>Limpiar</button>}
      </div>
      <FilterGroup t={t} title="Categorías">
        {categories.length === 0 ? <p className="px-2 text-[12px]" style={{ color: t.muted }}>Sin categorías</p> : (
          <div className="max-h-72 space-y-0.5 overflow-y-auto pr-1">
            {categories.map((c: string) => <CheckRow key={c} t={t} label={c} checked={selCats.includes(c)} onChange={() => toggleCategory(c)} />)}
          </div>
        )}
      </FilterGroup>
      {marcas.length > 0 && (
        <FilterGroup t={t} title="Marcas" defaultOpen={marcas.length <= 8}>
          <div className="max-h-60 space-y-0.5 overflow-y-auto pr-1">
            {marcas.map((m: string) => <CheckRow key={m} t={t} label={m} checked={selBrands.includes(m)} onChange={() => toggleBrand(m)} />)}
          </div>
        </FilterGroup>
      )}
      {maxPrice > minPrice && (
        <FilterGroup t={t} title="Precio">
          <div className="px-1">
            <div className="flex items-center justify-between text-[12.5px] font-semibold" style={{ color: t.ink }}>
              <span className="rounded-full px-2.5 py-1" style={{ background: t.soft }}>{stMoney(minPrice)}</span>
              <span className="rounded-full px-2.5 py-1" style={{ background: t.soft }}>{stMoney(max)}</span>
            </div>
            <input type="range" aria-label="Precio máximo" min={minPrice} max={maxPrice} step="0.1" value={max} onChange={(e) => setPriceRange([minPrice, Number(e.target.value)])} className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full border-0 focus:ring-0" style={{ accentColor: t.primary, background: `linear-gradient(90deg, ${t.primary} ${pct}%, ${t.line} ${pct}%)` }} />
          </div>
        </FilterGroup>
      )}
    </div>
  );
}

function EmptyState({ t, search, onClear }: { t: Theme; search?: string; onClear: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: stEase }} className="flex flex-col items-center justify-center rounded-[26px] border border-dashed bg-white/60 px-6 py-20 text-center" style={{ borderColor: t.line }}>
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white" style={{ color: t.primaryInk }}><Icon icon="mdi:shoe-sneaker" width={40} /></span>
      <h3 className="mt-6 text-[18px] font-extrabold uppercase" style={displayStyle(t, { color: t.ink })}>{search ? `Sin resultados para “${search}”` : 'No encontramos modelos'}</h3>
      <p className="mt-2 max-w-sm text-[13.5px]" style={{ color: t.muted }}>Prueba con otro nombre o quita algunos filtros.</p>
      <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={onClear} className="mt-7 h-12 rounded-full px-7 text-[13.5px] font-bold" style={{ background: t.primary, color: t.onPrimary }}>Ver todo el catálogo</motion.button>
    </motion.div>
  );
}
