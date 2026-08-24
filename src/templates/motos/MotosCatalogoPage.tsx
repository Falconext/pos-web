import { type ReactNode, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateCatalogoPageProps } from '@/templates/shared/types';
import ProductCustomizationModal from '@/components/tienda/ProductCustomizationModal';
import { MOTO, MotoCartModal, MotoFooter, MotoHeader, MotoProductCard, MotoWhatsAppFab, motoFont, motoPrimary, withAlpha } from './MotosParts';
import { motoCard, motoPage, motoSection, motoStagger } from './motion';

function getName(item: any) {
  return typeof item === 'string' ? item : item?.nombre;
}

function filterCount(products: any[], key: 'categoria' | 'marca', name: string) {
  return products.filter((product) => {
    const value = product?.[key];
    const current = typeof value === 'object' ? value?.nombre : value;
    return String(current || '').toLowerCase() === String(name || '').toLowerCase();
  }).length;
}

/* ── Sección de filtro colapsable ───────────────────────────────────────── */
function FilterSection({ title, count, defaultOpen = true, children }: { title: string; count?: number; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b pb-4" style={{ borderColor: MOTO.line }}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between py-3 text-left">
        <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: MOTO.ink }}>
          {title}
          {count ? <span className="rounded-full px-1.5 text-[10px] font-bold text-white" style={{ backgroundColor: MOTO.blue }}>{count}</span> : null}
        </span>
        <Icon icon="solar:alt-arrow-down-linear" width={18} className="transition-transform" style={{ color: MOTO.muted, transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckRow({ label, count, checked, onToggle, primary }: { label: string; count?: number; checked: boolean; onToggle: () => void; primary: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-2 text-sm" style={{ color: checked ? MOTO.ink : MOTO.body }}>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors" style={checked ? { backgroundColor: primary, borderColor: primary } : { borderColor: MOTO.line, backgroundColor: MOTO.card }}>
        {checked && <Icon icon="mdi:check" width={13} className="text-white" />}
      </span>
      <input type="checkbox" checked={checked} onChange={onToggle} className="hidden" />
      <span className="flex-1">{label}</span>
      {count != null && count > 0 && <span className="text-xs" style={{ color: MOTO.faint }}>{count}</span>}
    </label>
  );
}

export default function MotosCatalogoPage({
  tienda,
  slug,
  diseno,
  cp,
  navigate,
  productos,
  sortedProductos,
  allProductos,
  loading,
  total,
  page,
  cargarProductos,
  allCategorías,
  filteredMarcas,
  selectedCategorías,
  setSelectedCategorías,
  selectedMarcas,
  setSelectedMarcas,
  priceRange,
  setPriceRange,
  minPrice,
  maxPrice,
  sortBy,
  setSortBy,
  hasActiveFilters,
  toggleCategory,
  toggleBrand,
  atributoFacets,
  selectedAtributos,
  toggleAtributo,
  search,
  setSearch,
  carrito,
  setCarrito,
  mostrarCarrito,
  setMostrarCarrito,
  actualizarCantidad,
  irACheckout,
  handleAgregarProducto,
  agregarAlCarritoDirecto,
  showMobileFilters,
  setShowMobileFilters,
  showPersonalizarModal,
  setShowPersonalizarModal,
  productoAPersonalizar,
  setProductoAPersonalizar,
  modificadoresProducto,
}: TemplateCatalogoPageProps) {
  const primary = motoPrimary(cp);
  const font = motoFont(diseno);
  const facets = atributoFacets || [];
  const selAttr = selectedAtributos || {};
  const toggleAttr = toggleAtributo || (() => {});
  const productPool = (allProductos && allProductos.length ? allProductos : productos) || [];

  const clearFilters = () => {
    setSelectedCategorías([]);
    setSelectedMarcas([]);
    setPriceRange([minPrice, maxPrice]);
    setSearch('');
    if (toggleAtributo) Object.entries(selAttr).forEach(([k, vals]) => (vals as string[]).forEach((v) => toggleAtributo(k, v)));
  };

  const categoryList = allCategorías.filter(getName);
  const brandList = filteredMarcas.filter(getName);
  const totalLabel = total || sortedProductos.length;
  const priceActive = priceRange[0] > minPrice || priceRange[1] < maxPrice;

  // Chips de filtros activos
  const activeChips: { label: string; onRemove: () => void }[] = [
    ...selectedCategorías.map((c) => ({ label: c, onRemove: () => toggleCategory(c) })),
    ...selectedMarcas.map((m) => ({ label: m, onRemove: () => toggleBrand(m) })),
    ...(priceActive ? [{ label: `S/ ${priceRange[0]} – S/ ${priceRange[1]}`, onRemove: () => setPriceRange([minPrice, maxPrice]) }] : []),
    ...Object.entries(selAttr).flatMap(([k, vals]) => (vals as string[]).map((v) => ({ label: v, onRemove: () => toggleAttr(k, v) }))),
  ];

  const setMin = (v: number) => setPriceRange([Math.min(v, priceRange[1]), priceRange[1]]);
  const setMax = (v: number) => setPriceRange([priceRange[0], Math.max(v, priceRange[0])]);

  const FiltersContent = (
    <div className="space-y-1">
      {categoryList.length > 0 && (
        <FilterSection title="Categoría" count={selectedCategorías.length}>
          <div className="max-h-64 space-y-0.5 overflow-y-auto pr-1">
            {categoryList.slice(0, 20).map((cat: any, i: number) => {
              const name = getName(cat);
              return (
                <CheckRow key={`${name}-${i}`} label={name} count={filterCount(productPool, 'categoria', name)} checked={selectedCategorías.includes(name)} onToggle={() => toggleCategory(name)} primary={primary} />
              );
            })}
          </div>
        </FilterSection>
      )}

      {brandList.length > 0 && (
        <FilterSection title="Marca" count={selectedMarcas.length}>
          <div className="max-h-64 space-y-0.5 overflow-y-auto pr-1">
            {brandList.slice(0, 20).map((brand: any, i: number) => {
              const name = getName(brand);
              const count = Number(brand?.productosCount || brand?.count || filterCount(productPool, 'marca', name));
              return (
                <CheckRow key={`${name}-${i}`} label={name} count={count} checked={selectedMarcas.includes(name)} onToggle={() => toggleBrand(name)} primary={primary} />
              );
            })}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Precio" count={priceActive ? 1 : 0}>
        <div className="pt-2">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex-1 rounded-lg border px-3 py-2" style={{ borderColor: MOTO.line, backgroundColor: MOTO.card }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: MOTO.faint }}>Mín</p>
              <p className="text-sm font-bold" style={{ color: MOTO.ink }}>S/ {priceRange[0]}</p>
            </div>
            <span className="text-sm" style={{ color: MOTO.faint }}>—</span>
            <div className="flex-1 rounded-lg border px-3 py-2" style={{ borderColor: MOTO.line, backgroundColor: MOTO.card }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: MOTO.faint }}>Máx</p>
              <p className="text-sm font-bold" style={{ color: MOTO.ink }}>S/ {priceRange[1]}</p>
            </div>
          </div>
          <input type="range" min={minPrice} max={maxPrice} value={priceRange[0]} onChange={(e) => setMin(Number(e.target.value))} className="w-full" style={{ accentColor: primary }} />
          <input type="range" min={minPrice} max={maxPrice} value={priceRange[1]} onChange={(e) => setMax(Number(e.target.value))} className="mt-2 w-full" style={{ accentColor: primary }} />
        </div>
      </FilterSection>

      {/* Filtros técnicos dinámicos del rubro (cilindrada, tipo, color, año, etc.) */}
      {facets.map((facet) => {
        const sel = (selAttr[facet.key] as string[]) || [];
        return (
          <FilterSection key={facet.key} title={facet.label} count={sel.length} defaultOpen={sel.length > 0}>
            <div className="max-h-64 space-y-0.5 overflow-y-auto pr-1">
              {facet.options.map((opt) => (
                <CheckRow key={opt.value} label={opt.label} count={opt.count} checked={sel.includes(opt.value)} onToggle={() => toggleAttr(facet.key, opt.value)} primary={primary} />
              ))}
            </div>
          </FilterSection>
        );
      })}

      {hasActiveFilters && (
        <button type="button" onClick={clearFilters} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors hover:bg-black/[0.03]" style={{ borderColor: MOTO.line, color: MOTO.ink }}>
          <Icon icon="solar:refresh-linear" width={15} /> Limpiar filtros
        </button>
      )}
    </div>
  );

  return (
    <motion.div initial="hidden" animate="show" variants={motoPage} className="min-h-screen" style={{ backgroundColor: MOTO.page, fontFamily: font }}>
      <MotoHeader
        tienda={tienda}
        slug={slug}
        cp={primary}
        diseno={diseno}
        carritoSize={carrito.reduce((sum, item) => sum + Number(item.cantidad || 1), 0)}
        onOpenCart={() => setMostrarCarrito(true)}
        searchQuery={search}
        setSearchQuery={setSearch}
        allCategories={allCategorías}
        onSearchSubmit={(event, value) => {
          event.preventDefault();
          setSearch(value || '');
        }}
      />

      {/* Cabecera */}
      <section className="relative overflow-hidden border-b" style={{ borderColor: MOTO.line, backgroundColor: MOTO.card }}>
        <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
          <div className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: MOTO.faint }}>
            <button type="button" onClick={() => navigate(`/tienda/${slug}`)} className="hover:text-neutral-900">Inicio</button>
            <span className="mx-2">/</span>
            <span style={{ color: MOTO.muted }}>Catálogo</span>
          </div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold uppercase tracking-[-0.01em] md:text-5xl" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>Catálogo</h1>
              <p className="mt-2 text-sm" style={{ color: MOTO.muted }}>Explora motos, repuestos y accesorios. Filtra por lo que te importa.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Buscador ancho */}
      <div className="mx-auto max-w-7xl px-6 pt-8">
        <form
          onSubmit={(e) => { e.preventDefault(); }}
          className="flex items-center gap-2 rounded-2xl border bg-white p-2 shadow-[0_1px_2px_rgba(15,18,26,0.04)]"
          style={{ borderColor: MOTO.line }}
        >
          <Icon icon="solar:magnifer-linear" width={20} className="ml-3 shrink-0" style={{ color: MOTO.faint }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={diseno?.motosSearchPlaceholder || 'Buscar moto, repuesto, accesorio...'}
            className="h-11 flex-1 border-0 bg-transparent px-2 text-base outline-none focus:ring-0"
            style={{ color: MOTO.ink }}
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="mr-1 flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-black/[0.04]" style={{ color: MOTO.muted }} title="Limpiar">
              <Icon icon="solar:close-circle-linear" width={20} />
            </button>
          )}
        </form>
      </div>

      <motion.main variants={motoSection} className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[290px_1fr]">
          {/* Sidebar desktop */}
          <aside className="hidden lg:block lg:sticky lg:top-28 lg:h-fit">
            <div className="rounded-2xl border p-6" style={{ backgroundColor: MOTO.card, borderColor: MOTO.line }}>
              <div className="mb-2 flex items-center gap-2">
                <Icon icon="solar:filter-bold" width={18} style={{ color: primary }} />
                <h2 className="text-sm font-extrabold uppercase tracking-[0.12em]" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>Filtros</h2>
              </div>
              {FiltersContent}
            </div>
          </aside>

          {/* Contenido */}
          <section className="min-w-0">
            {/* Toolbar */}
            <div className="mb-6 flex flex-col gap-4 rounded-2xl border bg-white p-4 md:flex-row md:items-center md:justify-between" style={{ borderColor: MOTO.line }}>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setShowMobileFilters(true)} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] lg:hidden" style={{ borderColor: MOTO.line, color: MOTO.ink }}>
                  <Icon icon="solar:filter-linear" width={16} /> Filtros{activeChips.length ? ` (${activeChips.length})` : ''}
                </button>
                <p className="px-1 text-sm" style={{ color: MOTO.muted }}>
                  <span className="font-bold" style={{ color: MOTO.ink }}>{sortedProductos.length}</span> de <span className="font-bold" style={{ color: MOTO.ink }}>{totalLabel}</span> productos
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden text-xs font-semibold uppercase tracking-[0.1em] sm:inline" style={{ color: MOTO.faint }}>Ordenar</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-11 min-w-[200px] rounded-lg border px-4 text-sm font-medium outline-none" style={{ borderColor: MOTO.line, backgroundColor: MOTO.soft, color: MOTO.ink }}>
                  <option value="relevance">Recomendado</option>
                  <option value="price-asc">Precio: menor a mayor</option>
                  <option value="price-desc">Precio: mayor a menor</option>
                  <option value="name-asc">Nombre A-Z</option>
                </select>
              </div>
            </div>

            {/* Chips de filtros activos */}
            {activeChips.length > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                {activeChips.map((chip, i) => (
                  <button key={`${chip.label}-${i}`} type="button" onClick={chip.onRemove} className="inline-flex items-center gap-1.5 rounded-full py-1.5 pl-3 pr-2 text-xs font-semibold transition-colors" style={{ backgroundColor: withAlpha(primary, '14'), color: primary }}>
                    {chip.label}
                    <Icon icon="solar:close-circle-bold" width={15} />
                  </button>
                ))}
                <button type="button" onClick={clearFilters} className="text-xs font-bold uppercase tracking-[0.08em] underline-offset-2 hover:underline" style={{ color: MOTO.muted }}>Limpiar todo</button>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 gap-4 md:gap-6 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => <div key={i} className="aspect-[5/4] animate-pulse rounded-2xl bg-black/[0.05]" />)}
              </div>
            ) : sortedProductos.length === 0 ? (
              <motion.div variants={motoCard} initial="hidden" animate="show" className="rounded-2xl border p-16 text-center" style={{ backgroundColor: MOTO.card, borderColor: MOTO.line }}>
                <Icon icon="mdi:motorbike-electric" className="mx-auto mb-4 text-6xl" style={{ color: MOTO.faint }} />
                <h3 className="text-xl font-bold uppercase" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>No encontramos resultados</h3>
                <p className="mt-2 text-sm" style={{ color: MOTO.muted }}>Prueba con otra categoría o limpia los filtros.</p>
                <button type="button" onClick={clearFilters} className="mt-6 rounded-lg px-6 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white" style={{ backgroundColor: primary }}>Limpiar filtros</button>
              </motion.div>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  <motion.div key="grid" variants={motoStagger} initial="hidden" animate="show" exit={{ opacity: 0, y: 12, transition: { duration: 0.18 } }} className="grid grid-cols-2 gap-4 md:gap-6 xl:grid-cols-3">
                    {sortedProductos.map((producto) => (
                      <MotoProductCard key={producto.id} producto={producto} slug={slug} cp={primary} onAddToCart={handleAgregarProducto} onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)} />
                    ))}
                  </motion.div>
                </AnimatePresence>
                {productos.length < total && (
                  <div className="mt-12 flex justify-center">
                    <button type="button" onClick={() => cargarProductos(page + 1)} className="rounded-lg px-8 py-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-lg transition-transform hover:-translate-y-0.5" style={{ backgroundColor: primary }}>
                      Cargar más
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </motion.main>

      {/* Drawer de filtros (mobile) */}
      <AnimatePresence>
        {showMobileFilters && (
          <div className="fixed inset-0 z-[9998] lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMobileFilters(false)} className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 26, stiffness: 220 }} className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col" style={{ backgroundColor: MOTO.page }}>
              <div className="flex items-center justify-between border-b bg-white px-5 py-4" style={{ borderColor: MOTO.line }}>
                <div className="flex items-center gap-2">
                  <Icon icon="solar:filter-bold" width={18} style={{ color: primary }} />
                  <h2 className="text-base font-extrabold uppercase tracking-[0.1em]" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>Filtros</h2>
                </div>
                <button type="button" onClick={() => setShowMobileFilters(false)} className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5" style={{ color: MOTO.muted }}>
                  <Icon icon="solar:close-circle-linear" width={22} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-2">{FiltersContent}</div>
              <div className="border-t bg-white px-5 py-4" style={{ borderColor: MOTO.line }}>
                <button type="button" onClick={() => setShowMobileFilters(false)} className="w-full rounded-lg py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-white" style={{ backgroundColor: primary }}>
                  Ver {sortedProductos.length} resultados
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <MotoFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategorías} />
      <MotoWhatsAppFab tienda={tienda} />

      <MotoCartModal
        isOpen={mostrarCarrito}
        onClose={() => setMostrarCarrito(false)}
        carrito={carrito}
        setCarrito={setCarrito}
        actualizarCantidad={actualizarCantidad}
        onCheckout={irACheckout}
        cp={primary}
        tienda={tienda}
      />
      {showPersonalizarModal && productoAPersonalizar && (
        <ProductCustomizationModal
          isOpen={showPersonalizarModal}
          onClose={() => {
            setShowPersonalizarModal(false);
            setProductoAPersonalizar(null);
          }}
          product={productoAPersonalizar}
          modifiers={modificadoresProducto}
          onConfirm={(producto, mods) => {
            agregarAlCarritoDirecto(producto, mods);
            setShowPersonalizarModal(false);
            setProductoAPersonalizar(null);
          }}
        />
      )}
    </motion.div>
  );
}
