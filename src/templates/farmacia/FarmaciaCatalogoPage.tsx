import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, MotionConfig, motion, type Variants } from 'framer-motion';
import type { TemplateCatalogoPageProps } from '@/templates/shared/types';
import ProductCustomizationModal from '@/components/tienda/ProductCustomizationModal';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import { FarmaciaHeader, FarmaciaFooter, FarmaciaCartModal, FarmaciaProductCard, farmaciaTheme, useFarmaciaFont, editable, fmMoney } from './FarmaciaParts';
import { PageHero, GridSkeleton, getName, type Theme } from './FarmaciaSections';
import { fmEase, mix } from './motion';

// Valores que entiende Catalogo.tsx (el ordenamiento se hace allí).
const SORTS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'name-asc', label: 'Nombre A–Z' },
];

// Escalonado con tope: aunque haya 40 productos, la grilla termina de entrar en <0.6s.
const cardIn: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show: (i: number) => ({ opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: fmEase, delay: Math.min(i, 12) * 0.035 } }),
};

export default function FarmaciaCatalogoPage(props: TemplateCatalogoPageProps) {
  const {
    tienda, slug, diseno, navigate, sortedProductos, loading, total, page, cargarProductos,
    allCategorías, allMarcas, filteredMarcas, selectedCategorías, setSelectedCategorías, selectedMarcas, setSelectedMarcas,
    priceRange, setPriceRange, minPrice, maxPrice, sortBy, setSortBy, hasActiveFilters, toggleCategory, toggleBrand,
    search, setSearch, carrito, setCarrito, mostrarCarrito, setMostrarCarrito, actualizarCantidad, irACheckout,
    handleAgregarProducto, agregarAlCarritoDirecto, showMobileFilters, setShowMobileFilters,
    showPersonalizarModal, setShowPersonalizarModal, productoAPersonalizar, setProductoAPersonalizar, modificadoresProducto,
  } = props as any;

  useFarmaciaFont();
  const t = farmaciaTheme(diseno);
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

  // Clave de la grilla: al cambiar filtros/orden, las tarjetas vuelven a entrar escalonadas.
  const gridKey = [selCats.join('|'), selBrands.join('|'), search, sortBy, (priceRange || []).join('-')].join('#');

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...(search ? [{ key: 's', label: `“${search}”`, onRemove: () => setSearch('') }] : []),
    ...selCats.map((c) => ({ key: `c-${c}`, label: c, onRemove: () => toggleCategory(c) })),
    ...selBrands.map((m) => ({ key: `m-${m}`, label: m, onRemove: () => toggleBrand(m) })),
    ...(priceActive ? [{ key: 'p', label: `${fmMoney(priceRange[0])} – ${fmMoney(priceRange[1])}`, onRemove: () => setPriceRange([minPrice, maxPrice]) }] : []),
  ];

  const filters = (
    <FilterPanel
      t={t}
      categories={categories}
      marcas={marcas}
      selCats={selCats}
      selBrands={selBrands}
      toggleCategory={toggleCategory}
      toggleBrand={toggleBrand}
      priceRange={priceRange}
      setPriceRange={setPriceRange}
      minPrice={minPrice}
      maxPrice={maxPrice}
      hasActiveFilters={hasActiveFilters}
      clear={clearFilters}
    />
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, fontFamily: t.font }}>
        <FarmaciaHeader tienda={tienda || {}} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} onSearch={(v: string) => setSearch(v)} navigate={navigate} />

        <PageHero
          t={t}
          crumbs={[{ label: 'Inicio', onClick: () => navigate(`/tienda/${slug}`) }, { label: 'Catálogo' }]}
          eyebrow={selCats.length === 1 ? 'Categoría' : 'Catálogo'}
          title={selCats.length === 1 ? selCats[0] : editable(diseno?.farmaciaCatalogTitle, 'Nuestro catálogo')}
          subtitle={loading ? 'Cargando productos…' : <><strong style={{ color: t.ink }}>{totalCount}</strong> {totalCount === 1 ? 'producto disponible' : 'productos disponibles'} con asesoría farmacéutica.</>}
        >
          <CatalogSearch t={t} value={search || ''} onSubmit={setSearch} />
        </PageHero>

        {/* Chips de categoría con pastilla animada */}
        {categories.length > 0 && (
          <div className="sticky top-0 z-20 border-b bg-white/85 backdrop-blur-md" style={{ borderColor: t.line }}>
            <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:px-6" role="tablist" aria-label="Categorías">
              {[null, ...categories].map((c) => {
                const active = c === null ? selCats.length === 0 : selCats.length === 1 && selCats[0] === c;
                return (
                  <button key={c ?? '__all'} type="button" role="tab" aria-selected={active} onClick={() => pickCategory(c)} className="relative shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold transition-colors duration-300" style={{ color: active ? t.onPrimary : t.ink }}>
                    {active && <motion.span layoutId="fm-cat-pill" className="absolute inset-0 rounded-full" style={{ background: t.primary }} transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                    {!active && <span className="absolute inset-0 rounded-full border" style={{ borderColor: t.line }} />}
                    <span className="relative">{c ?? 'Todas'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <main className="mx-auto flex max-w-7xl gap-8 px-4 py-10 lg:px-6">
          <aside className="hidden w-[272px] shrink-0 lg:block">
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: fmEase }} className="sticky top-24 rounded-3xl border bg-white p-6" style={{ borderColor: t.line }}>
              {filters}
            </motion.div>
          </aside>

          <section className="min-w-0 flex-1">
            {/* Toolbar */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13.5px] font-semibold text-gray-500">
                {loading ? 'Buscando…' : <>Mostrando <strong style={{ color: t.ink }}>{shown}</strong> de <strong style={{ color: t.ink }}>{totalCount}</strong></>}
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowMobileFilters(true)} className="inline-flex h-11 items-center gap-2 rounded-full border bg-white px-4 text-[13px] font-bold lg:hidden" style={{ borderColor: t.line, color: t.ink }}>
                  <Icon icon="solar:filter-bold-duotone" width={18} style={{ color: t.primary }} /> Filtros
                  {activeChips.length > 0 && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-black" style={{ background: t.accent, color: t.onAccent }}>{activeChips.length}</span>}
                </button>
                <label className="relative inline-flex h-11 items-center rounded-full border bg-white pl-4 pr-10" style={{ borderColor: t.line }}>
                  <Icon icon="solar:sort-vertical-linear" width={17} className="mr-2" style={{ color: t.primary }} />
                  <select aria-label="Ordenar" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="appearance-none border-0 bg-transparent bg-none py-0 pl-0 pr-1 text-[13px] font-bold outline-none focus:ring-0" style={{ color: t.ink }}>
                    {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <Icon icon="solar:alt-arrow-down-linear" width={16} className="pointer-events-none absolute right-4 text-gray-400" />
                </label>
              </div>
            </div>

            {/* Filtros activos */}
            <AnimatePresence initial={false}>
              {activeChips.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: fmEase }} className="overflow-hidden">
                  <div className="mb-6 flex flex-wrap items-center gap-2">
                    <AnimatePresence initial={false}>
                      {activeChips.map((c) => (
                        <motion.button layout key={c.key} type="button" onClick={c.onRemove} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.2 }} className="group inline-flex items-center gap-1.5 rounded-full py-1.5 pl-3.5 pr-2 text-[12.5px] font-bold" style={{ background: mix(t.primary, 12), color: t.primary }}>
                          {c.label}
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/70 transition-colors group-hover:bg-white"><Icon icon="solar:close-circle-linear" width={14} /></span>
                        </motion.button>
                      ))}
                    </AnimatePresence>
                    <button type="button" onClick={clearFilters} className="ml-1 text-[12.5px] font-bold text-gray-500 underline-offset-4 hover:underline">Limpiar todo</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {loading && shown === 0 ? (
              <GridSkeleton t={t} count={8} cols="lg:grid-cols-4" />
            ) : shown === 0 ? (
              <EmptyState t={t} search={search} onClear={clearFilters} />
            ) : (
              <>
                <motion.div key={gridKey} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                  {products.map((p, i) => (
                    <motion.div key={p.id ?? i} custom={i} variants={cardIn} className="h-full">
                      <FarmaciaProductCard producto={p} slug={slug} t={t} onOpen={() => goProduct(p)} onAdd={(q: number) => handleAgregarProducto({ ...p, __cantidad: q })} />
                    </motion.div>
                  ))}
                </motion.div>

                {totalCount > shown && (
                  <div className="mx-auto mt-12 flex max-w-xs flex-col items-center text-center">
                    <p className="text-[13px] font-semibold text-gray-500">Has visto {shown} de {totalCount} productos</p>
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ background: t.line }}>
                      <motion.div className="h-full rounded-full" style={{ background: t.primary }} initial={false} animate={{ width: `${Math.min(100, (shown / totalCount) * 100)}%` }} transition={{ duration: 0.6, ease: fmEase }} />
                    </div>
                    <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} disabled={loading} onClick={() => cargarProductos(page + 1)} className="mt-5 inline-flex h-12 items-center gap-2 rounded-full px-8 text-[14px] font-black disabled:opacity-60" style={{ background: t.primary, color: t.onPrimary }}>
                      {loading ? <><Icon icon="solar:refresh-bold" className="animate-spin" width={18} /> Cargando…</> : <>Cargar más productos <Icon icon="solar:alt-arrow-down-linear" width={18} /></>}
                    </motion.button>
                  </div>
                )}
              </>
            )}
          </section>
        </main>

        {/* Drawer de filtros (móvil) */}
        <AnimatePresence>
          {showMobileFilters && (
            <>
              <motion.button type="button" aria-label="Cerrar filtros" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMobileFilters(false)} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] lg:hidden" />
              <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 30, stiffness: 260 }} className="fixed inset-y-0 left-0 z-50 flex w-[88%] max-w-sm flex-col bg-white lg:hidden">
                <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: t.line }}>
                  <h3 className="text-lg font-black" style={{ color: t.ink }}>Filtros</h3>
                  <button type="button" aria-label="Cerrar" onClick={() => setShowMobileFilters(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500"><Icon icon="solar:close-circle-bold" width={22} /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-6">{filters}</div>
                <div className="border-t p-5" style={{ borderColor: t.line }}>
                  <button type="button" onClick={() => setShowMobileFilters(false)} className="h-12 w-full rounded-full text-[14px] font-black" style={{ background: t.accent, color: t.onAccent }}>Ver {shown} resultados</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <FarmaciaFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <FarmaciaCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={irACheckout} t={t} tienda={tienda} diseno={diseno} />
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
/** Buscador del hero: estado local (no dispara búsquedas por cada tecla) y aplica al enviar. */
function CatalogSearch({ t, value, onSubmit }: { t: Theme; value: string; onSubmit: (v: string) => void }) {
  const [q, setQ] = useState(value);
  useEffect(() => setQ(value), [value]);
  return (
    <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12, ease: fmEase }} onSubmit={(e) => { e.preventDefault(); onSubmit(q.trim()); }} className="mt-7 flex h-14 max-w-2xl items-center rounded-full border bg-white pl-5 pr-1.5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)]" style={{ borderColor: t.line }}>
      <Icon icon="solar:magnifer-linear" width={20} className="shrink-0 text-gray-400" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca por nombre, principio activo o categoría…" aria-label="Buscar productos" className="min-w-0 flex-1 border-0 bg-transparent px-3 text-[15px] text-gray-700 outline-none focus:ring-0" />
      {q && <button type="button" aria-label="Borrar búsqueda" onClick={() => { setQ(''); onSubmit(''); }} className="mr-1 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"><Icon icon="solar:close-circle-bold" width={18} /></button>}
      <button type="submit" className="h-11 rounded-full px-6 text-[14px] font-black" style={{ background: t.accent, color: t.onAccent }}>Buscar</button>
    </motion.form>
  );
}

function FilterGroup({ t, title, children, defaultOpen = true }: { t: Theme; title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b pb-5 last:border-b-0 last:pb-0" style={{ borderColor: t.line }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between py-1 text-left">
        <span className="text-[13px] font-black uppercase tracking-[0.12em]" style={{ color: t.ink }}>{title}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="text-gray-400"><Icon icon="solar:alt-arrow-down-linear" width={18} /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: fmEase }} className="overflow-hidden">
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckRow({ t, label, checked, onChange }: { t: Theme; label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={onChange} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-[13.5px] font-semibold transition-colors hover:bg-black/[0.03]" style={{ color: t.ink }}>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors duration-200" style={checked ? { background: t.primary, borderColor: t.primary, color: t.onPrimary } : { borderColor: '#CBD5E1' }}>
        <AnimatePresence>{checked && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}><Icon icon="solar:check-read-linear" width={14} /></motion.span>}</AnimatePresence>
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
        <p className="flex items-center gap-2 text-[16px] font-black" style={{ color: t.ink }}><Icon icon="solar:filter-bold-duotone" width={20} style={{ color: t.primary }} /> Filtrar</p>
        {hasActiveFilters && <button type="button" onClick={clear} className="text-[12px] font-bold" style={{ color: t.accent }}>Limpiar</button>}
      </div>

      <FilterGroup t={t} title="Categorías">
        {categories.length === 0 ? <p className="px-2 text-[12.5px] text-gray-400">Sin categorías</p> : (
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
            <div className="flex items-center justify-between text-[13px] font-bold" style={{ color: t.ink }}>
              <span className="rounded-lg px-2.5 py-1" style={{ background: t.soft }}>{fmMoney(minPrice)}</span>
              <span className="rounded-lg px-2.5 py-1" style={{ background: t.soft }}>{fmMoney(max)}</span>
            </div>
            <input
              type="range"
              aria-label="Precio máximo"
              min={minPrice}
              max={maxPrice}
              step="0.1"
              value={max}
              onChange={(e) => setPriceRange([minPrice, Number(e.target.value)])}
              className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full"
              style={{ accentColor: t.primary, background: `linear-gradient(90deg, ${t.primary} ${pct}%, ${t.line} ${pct}%)` }}
            />
          </div>
        </FilterGroup>
      )}
    </div>
  );
}

function EmptyState({ t, search, onClear }: { t: Theme; search?: string; onClear: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: fmEase }} className="flex flex-col items-center justify-center rounded-3xl border border-dashed bg-white px-6 py-20 text-center" style={{ borderColor: t.line }}>
      <span className="flex h-20 w-20 items-center justify-center rounded-3xl" style={{ background: mix(t.primary, 10), color: t.primary }}><Icon icon="solar:magnifer-zoom-out-bold-duotone" width={42} /></span>
      <h3 className="mt-6 text-[22px] font-black tracking-tight" style={{ color: t.ink }}>{search ? `Sin resultados para “${search}”` : 'No encontramos productos'}</h3>
      <p className="mt-2 max-w-sm text-[14px] text-gray-500">Prueba con otro nombre o principio activo, o quita algunos filtros.</p>
      <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={onClear} className="mt-7 h-12 rounded-full px-7 text-[14px] font-black" style={{ background: t.primary, color: t.onPrimary }}>Ver todo el catálogo</motion.button>
    </motion.div>
  );
}
