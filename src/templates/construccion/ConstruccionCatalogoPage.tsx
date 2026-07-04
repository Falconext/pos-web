import { Icon } from '@iconify/react';
import type { TemplateCatalogoPageProps } from '@/templates/shared/types';
import TecnologiaHeader from '@/components/tienda/TecnologiaHeader';
import TecnologiaCartModal from '@/components/tienda/TecnologiaCartModal';
import ProductCardGromuse from '@/components/tienda/ProductCardGromuse';
import ProductCustomizationModal from '@/components/tienda/ProductCustomizationModal';

const getName = (item: any) => (typeof item === 'string' ? item : item?.nombre || item?.name || '');

function FilterPanel({
  allCategorías,
  allMarcas,
  filteredMarcas,
  selectedCategorías,
  selectedMarcas,
  toggleCategory,
  toggleBrand,
  priceRange,
  setPriceRange,
  minPrice,
  maxPrice,
  cp,
  hasActiveFilters,
  clear,
}: any) {
  return (
    <div className="space-y-6">
      {allCategorías.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-gray-400">Categorías</p>
          <div className="space-y-2">
            {allCategorías.map((cat: any, index: number) => {
              const name = getName(cat);
              const active = selectedCategorías.includes(name);
              return (
                <button
                  key={`${name}-${index}`}
                  type="button"
                  onClick={() => toggleCategory(name)}
                  className="flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm font-bold transition-colors"
                  style={active ? { borderColor: cp, color: '#111827', background: `${cp}18` } : { borderColor: '#E5E7EB', color: '#4B5563' }}
                >
                  {name}
                  {active && <Icon icon="solar:check-circle-bold" width={16} style={{ color: cp }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {allMarcas.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-gray-400">Marcas</p>
          <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
            {filteredMarcas.map((brand: any, index: number) => {
              const name = getName(brand);
              const active = selectedMarcas.includes(name);
              return (
                <button
                  key={`${name}-${index}`}
                  type="button"
                  onClick={() => toggleBrand(name)}
                  className="flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm font-bold transition-colors"
                  style={active ? { borderColor: cp, color: '#111827', background: `${cp}18` } : { borderColor: '#E5E7EB', color: '#4B5563' }}
                >
                  {name}
                  {active && <Icon icon="solar:check-circle-bold" width={16} style={{ color: cp }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">Precio mínimo</p>
          <span className="rounded-lg bg-gray-900 px-2 py-1 text-xs font-black text-white">S/ {priceRange[0]}</span>
        </div>
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          value={priceRange[0]}
          onChange={(event) => setPriceRange([Number(event.target.value), priceRange[1]])}
          className="w-full"
          style={{ accentColor: cp }}
        />
        <div className="mt-1 flex justify-between text-[10px] font-bold text-gray-400">
          <span>S/ {minPrice}</span>
          <span>S/ {maxPrice}</span>
        </div>
      </div>

      {hasActiveFilters && (
        <button type="button" onClick={clear} className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-black text-white">
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

export default function ConstruccionCatalogoPage({
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
  allMarcas,
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
  const clearFilters = () => {
    setSelectedCategorías([]);
    setSelectedMarcas([]);
    setPriceRange([minPrice, maxPrice]);
    setSearch('');
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF]" style={{ fontFamily: `'${diseno?.tipografia || 'Inter'}', sans-serif` }}>
      <TecnologiaHeader
        tienda={tienda || {}}
        slug={slug}
        cp={cp}
        carritoSize={carrito.length}
        onOpenCart={() => setMostrarCarrito(true)}
        searchQuery={search}
        setSearchQuery={setSearch}
        onSearchSubmit={(event, value) => {
          event.preventDefault();
          setSearch(value);
          setSelectedCategorías([]);
          setSelectedMarcas([]);
          setPriceRange([minPrice, maxPrice]);
        }}
        allCategories={allCategorías}
      />

      <section className="bg-[#111827] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
          <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: cp }}>Catálogo de obra</p>
          <h1 className="mt-3 text-4xl font-black">Materiales y herramientas</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold text-white/60">
            Filtra por categoría, marca y precio para encontrar rápido lo que necesitas para tu proyecto.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-gray-500">
            Mostrando <span className="font-black text-gray-950">{sortedProductos.length}</span> de {total} productos
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMobileFilters(true)}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-black text-gray-800 lg:hidden"
            >
              <Icon icon="solar:filter-bold" width={16} />
              Filtros
            </button>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 outline-none"
            >
              <option value="relevance">Relevantes</option>
              <option value="price-asc">Precio menor</option>
              <option value="price-desc">Precio mayor</option>
              <option value="name-asc">A-Z</option>
            </select>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:block">
            <FilterPanel
              allCategorías={allCategorías}
              allMarcas={allMarcas}
              filteredMarcas={filteredMarcas}
              selectedCategorías={selectedCategorías}
              selectedMarcas={selectedMarcas}
              toggleCategory={toggleCategory}
              toggleBrand={toggleBrand}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              minPrice={minPrice}
              maxPrice={maxPrice}
              cp={cp}
              hasActiveFilters={hasActiveFilters}
              clear={clearFilters}
            />
          </aside>

          <section>
            {loading ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 12 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-xl bg-white" />)}
              </div>
            ) : sortedProductos.length === 0 ? (
              <div className="rounded-2xl bg-white px-6 py-20 text-center">
                <Icon icon="solar:box-linear" className="mx-auto mb-4 text-6xl text-gray-300" />
                <h3 className="text-xl font-black text-gray-950">Sin productos</h3>
                <p className="mt-2 text-sm font-semibold text-gray-500">Prueba limpiando los filtros o cambiando la búsqueda.</p>
                <button type="button" onClick={clearFilters} className="mt-6 rounded-xl px-5 py-3 text-sm font-black text-[#111827]" style={{ background: cp }}>
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {sortedProductos.map((producto) => (
                    <ProductCardGromuse
                      key={producto.id}
                      producto={producto}
                      slug={slug}
                      diseno={{ ...diseno, colorPrimario: cp }}
                      onAddToCart={() => handleAgregarProducto(producto)}
                      onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)}
                    />
                  ))}
                </div>
                {productos.length < total && (
                  <div className="mt-10 flex justify-center">
                    <button type="button" onClick={() => cargarProductos(page + 1)} className="rounded-xl px-7 py-3 text-sm font-black text-[#111827]" style={{ background: cp }}>
                      Cargar más
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      {showMobileFilters && (
        <div className="fixed inset-0 z-[200] lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[86vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-lg font-black text-gray-950">Filtros</p>
              <button type="button" onClick={() => setShowMobileFilters(false)} className="rounded-full bg-gray-100 p-2">
                <Icon icon="solar:close-circle-bold" width={20} />
              </button>
            </div>
            <FilterPanel
              allCategorías={allCategorías}
              allMarcas={allMarcas}
              filteredMarcas={filteredMarcas}
              selectedCategorías={selectedCategorías}
              selectedMarcas={selectedMarcas}
              toggleCategory={toggleCategory}
              toggleBrand={toggleBrand}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              minPrice={minPrice}
              maxPrice={maxPrice}
              cp={cp}
              hasActiveFilters={hasActiveFilters}
              clear={clearFilters}
            />
            <button type="button" onClick={() => setShowMobileFilters(false)} className="mt-5 w-full rounded-xl px-5 py-3 text-sm font-black text-[#111827]" style={{ background: cp }}>
              Ver resultados
            </button>
          </div>
        </div>
      )}

      <TecnologiaCartModal
        isOpen={mostrarCarrito}
        onClose={() => setMostrarCarrito(false)}
        carrito={carrito}
        setCarrito={setCarrito}
        actualizarCantidad={actualizarCantidad}
        onCheckout={irACheckout}
        cp={cp}
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
    </div>
  );
}
