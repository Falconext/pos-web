import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import type { TemplateCatalogoPageProps } from '@/templates/shared/types';
import ProductCustomizationModal from '@/components/tienda/ProductCustomizationModal';
import { MIN, MinCartModal, MinFooter, MinHeader, MinProductCard, MinWhatsAppFab, minFont, minPrimary } from './ModaMinimalParts';
import { minEase, minPage, minSection, minStagger } from './motion';

const CATALOG_BANNER_FALLBACK = 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1900&q=80';

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

/* ── Panel de filtros deslizante (estilo Everlane) ── */
function FilterDrawer({
  open,
  onClose,
  categoryList,
  brandList,
  productos,
  selectedCategorías,
  toggleCategory,
  setSelectedCategorías,
  selectedMarcas,
  toggleBrand,
  priceRange,
  setPriceRange,
  minPrice,
  maxPrice,
  clearFilters,
  resultCount,
}: any) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] isolate" style={{ fontFamily: MIN.sans }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40" />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.32, ease: minEase }}
            className="fixed inset-y-0 left-0 flex w-full max-w-sm flex-col border-r shadow-2xl"
            style={{ backgroundColor: MIN.paper, borderColor: MIN.line }}
          >
            <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: MIN.line }}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em]" style={{ color: MIN.ink }}>Filtrar</h3>
              <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center text-neutral-500 hover:text-black" title="Cerrar">
                <Icon icon="solar:close-circle-linear" width={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-2">
              {categoryList.length > 0 && (
                <div className="border-b py-5" style={{ borderColor: MIN.line }}>
                  <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: MIN.ink }}>Categoría</h4>
                  <div className="space-y-3">
                    <button type="button" onClick={() => setSelectedCategorías([])} className="block text-left text-sm" style={{ color: selectedCategorías.length === 0 ? MIN.ink : MIN.soft }}>
                      Todo
                    </button>
                    {categoryList.slice(0, 20).map((cat: any, i: number) => {
                      const name = getName(cat);
                      const active = selectedCategorías.includes(name);
                      return (
                        <button key={`${name}-${i}`} type="button" onClick={() => toggleCategory(name)} className="flex items-center gap-2 text-left text-sm" style={{ color: active ? MIN.ink : MIN.soft }}>
                          <span className="flex h-4 w-4 items-center justify-center border" style={active ? { backgroundColor: MIN.ink, borderColor: MIN.ink } : { borderColor: MIN.muted }}>
                            {active && <Icon icon="mdi:check" width={12} className="text-white" />}
                          </span>
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {brandList.length > 0 && (
                <div className="border-b py-5" style={{ borderColor: MIN.line }}>
                  <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: MIN.ink }}>Marca</h4>
                  <div className="space-y-3">
                    {brandList.slice(0, 14).map((brand: any, i: number) => {
                      const name = getName(brand);
                      const active = selectedMarcas.includes(name);
                      const count = Number(brand?.productosCount || brand?.count || filterCount(productos, 'marca', name));
                      return (
                        <button key={`${name}-${i}`} type="button" onClick={() => toggleBrand(name)} className="flex items-center gap-2 text-left text-sm" style={{ color: active ? MIN.ink : MIN.soft }}>
                          <span className="flex h-4 w-4 items-center justify-center border" style={active ? { backgroundColor: MIN.ink, borderColor: MIN.ink } : { borderColor: MIN.muted }}>
                            {active && <Icon icon="mdi:check" width={12} className="text-white" />}
                          </span>
                          {name}{count > 0 ? ` (${count})` : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="py-5">
                <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: MIN.ink }}>Precio</h4>
                <div className="mb-3 flex items-center justify-between text-xs" style={{ color: MIN.soft }}>
                  <span>S/ {priceRange[0]}</span>
                  <span>S/ {maxPrice}</span>
                </div>
                <input type="range" min={minPrice} max={maxPrice} value={priceRange[0]} onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])} className="w-full" style={{ accentColor: MIN.ink }} />
              </div>
            </div>

            <div className="border-t px-6 py-5" style={{ borderColor: MIN.line }}>
              <button type="button" onClick={onClose} className="flex w-full items-center justify-center py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white" style={{ backgroundColor: MIN.ink }}>
                Ver {resultCount} resultados
              </button>
              <button type="button" onClick={clearFilters} className="mt-3 w-full text-center text-[11px] font-semibold uppercase tracking-[0.12em] underline" style={{ color: MIN.soft }}>
                Limpiar filtros
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default function ModaMinimalCatalogoPage({
  tienda,
  slug,
  diseno,
  cp,
  navigate,
  productos,
  sortedProductos,
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
  const primary = minPrimary(cp);
  const font = minFont(diseno);

  const clearFilters = () => {
    setSelectedCategorías([]);
    setSelectedMarcas([]);
    setPriceRange([minPrice, maxPrice]);
    setSearch('');
  };

  const categoryList = allCategorías.filter(getName);
  const brandList = filteredMarcas.filter(getName);
  const totalLabel = total || sortedProductos.length;
  const activeCount = selectedCategorías.length + selectedMarcas.length + (priceRange[0] > minPrice ? 1 : 0) + (search ? 1 : 0);

  const bannerImage = diseno?.modaMinimalCatalogBannerImage || CATALOG_BANNER_FALLBACK;
  const bannerTitle = diseno?.modaMinimalCatalogTitle || 'Toda la colección';
  const bannerSubtitle = diseno?.modaMinimalCatalogSubtitle || 'Prendas y calzado atemporal, en materiales nobles y a un precio justo.';

  return (
    <motion.div initial="hidden" animate="show" variants={minPage} className="min-h-screen" style={{ backgroundColor: MIN.paper, fontFamily: font }}>
      <MinHeader
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
          setSelectedCategorías([]);
          setSelectedMarcas([]);
        }}
      />

      {/* Banner de categoría (editable) */}
      <section className="relative h-[220px] w-full overflow-hidden md:h-[300px]">
        <img src={bannerImage} alt={bannerTitle} className="h-full w-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.28)' }}>
          <div className="px-6 text-center text-white">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/85">
              <button type="button" onClick={() => navigate(`/tienda/${slug}`)} className="hover:underline">Inicio</button>
              <span className="mx-2">/</span>
              <span>Tienda</span>
            </div>
            <h1 className="text-3xl font-medium tracking-tight md:text-5xl">{bannerTitle}</h1>
            {bannerSubtitle && <p className="mx-auto mt-3 max-w-xl text-sm text-white/85">{bannerSubtitle}</p>}
          </div>
        </div>
      </section>

      {/* Toolbar: Filtrar · contador · Ordenar */}
      <div className="sticky top-16 z-30 border-b bg-white/95 backdrop-blur" style={{ borderColor: MIN.line }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3.5 md:px-8">
          <button
            type="button"
            onClick={() => setShowMobileFilters(true)}
            className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: MIN.ink }}
          >
            <Icon icon="solar:tuning-2-linear" width={18} /> Filtrar{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>

          <p className="hidden text-sm sm:block" style={{ color: MIN.soft }}>
            <span className="font-semibold" style={{ color: MIN.ink }}>{sortedProductos.length}</span> de {totalLabel} productos
          </p>

          <div className="flex items-center gap-2">
            <span className="hidden text-[12px] uppercase tracking-[0.1em] md:inline" style={{ color: MIN.muted }}>Ordenar</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-9 border bg-white px-3 text-sm outline-none" style={{ borderColor: MIN.line, color: MIN.ink }}>
              <option value="relevance">Recomendado</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="name-asc">Nombre A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chips de categoría + filtros activos */}
      {(categoryList.length > 0 || activeCount > 0) && (
        <div className="mx-auto max-w-7xl px-6 pt-6 md:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategorías([])}
              className="px-4 py-2 text-[11px] font-medium uppercase tracking-[0.1em] transition-colors"
              style={selectedCategorías.length === 0 ? { backgroundColor: MIN.ink, color: '#fff' } : { color: MIN.ink, border: `1px solid ${MIN.line}` }}
            >
              Todo
            </button>
            {categoryList.slice(0, 10).map((cat: any, index: number) => {
              const name = getName(cat);
              const active = selectedCategorías.includes(name);
              return (
                <button
                  key={`${name}-${index}`}
                  type="button"
                  onClick={() => toggleCategory(name)}
                  className="px-4 py-2 text-[11px] font-medium uppercase tracking-[0.1em] transition-colors"
                  style={active ? { backgroundColor: MIN.ink, color: '#fff' } : { color: MIN.ink, border: `1px solid ${MIN.line}` }}
                >
                  {name}
                </button>
              );
            })}
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className="ml-1 text-[11px] font-semibold uppercase tracking-[0.1em] underline" style={{ color: MIN.soft }}>
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grilla full-width 3 columnas */}
      <motion.main variants={minSection} className="mx-auto max-w-7xl px-6 py-10 md:px-8">
        {loading ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => <div key={index} className="aspect-[3/4] animate-pulse" style={{ backgroundColor: MIN.stone }} />)}
          </div>
        ) : sortedProductos.length === 0 ? (
          <div className="border py-20 text-center" style={{ borderColor: MIN.line }}>
            <Icon icon="solar:hanger-2-linear" className="mx-auto mb-4 text-5xl" style={{ color: MIN.muted }} />
            <h3 className="text-lg font-medium" style={{ color: MIN.ink }}>No encontramos esa prenda</h3>
            <p className="mt-2 text-sm" style={{ color: MIN.soft }}>Prueba con otra categoría o limpia los filtros.</p>
            <button type="button" onClick={clearFilters} className="mt-6 bg-black px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">Limpiar filtros</button>
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div key="grid" variants={minStagger} initial="hidden" animate="show" exit={{ opacity: 0, y: 10, transition: { duration: 0.18 } }} className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3">
                {sortedProductos.map((producto) => (
                  <MinProductCard key={producto.id} producto={producto} slug={slug} cp={primary} onAddToCart={handleAgregarProducto} onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)} />
                ))}
              </motion.div>
            </AnimatePresence>
            {productos.length < total && (
              <div className="mt-14 flex justify-center">
                <button type="button" onClick={() => cargarProductos(page + 1)} className="border px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ borderColor: MIN.ink, color: MIN.ink }}>
                  Cargar más
                </button>
              </div>
            )}
          </>
        )}
      </motion.main>

      <MinFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategorías} />
      <MinWhatsAppFab tienda={tienda} />

      <FilterDrawer
        open={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        categoryList={categoryList}
        brandList={brandList}
        productos={productos}
        selectedCategorías={selectedCategorías}
        toggleCategory={toggleCategory}
        setSelectedCategorías={setSelectedCategorías}
        selectedMarcas={selectedMarcas}
        toggleBrand={toggleBrand}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        minPrice={minPrice}
        maxPrice={maxPrice}
        clearFilters={clearFilters}
        resultCount={sortedProductos.length}
      />

      <MinCartModal
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
