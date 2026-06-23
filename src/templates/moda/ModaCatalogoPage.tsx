/**
 * ModaCatalogoPage
 * Catálogo completo del template Moda.
 * Extraído de Catalogo.tsx para mantener ese archivo limpio.
 */
import { Icon } from '@iconify/react';
import ModaHeader from '@/components/tienda/ModaHeader';
import ModaFooter from '@/components/tienda/ModaFooter';
import ShoppingCartModal from '@/components/tienda/ShoppingCartModal';
import ProductCustomizationModal from '@/components/tienda/ProductCustomizationModal';
import type { TemplateCatalogoPageProps } from '@/templates/shared/types';

export default function ModaCatalogoPage({
  tienda, slug, diseno, cp, navigate,
  productos, sortedProductos, loading, total, page, cargarProductos,
  allCategorías, allMarcas, filteredMarcas,
  selectedCategorías, setSelectedCategorías, selectedMarcas, setSelectedMarcas,
  priceRange, setPriceRange, minPrice, maxPrice,
  sortBy, setSortBy, hasActiveFilters,
  toggleCategory, toggleBrand,
  search, setSearch,
  carrito, setCarrito, mostrarCarrito, setMostrarCarrito,
  actualizarCantidad, irACheckout, handleAgregarProducto, agregarAlCarritoDirecto,
  showMobileFilters, setShowMobileFilters,
  showPersonalizarModal, setShowPersonalizarModal,
  productoAPersonalizar, setProductoAPersonalizar, modificadoresProducto,
}: TemplateCatalogoPageProps) {
  return (
    <div className="min-h-screen bg-[#FAF9F6]" style={{ fontFamily: `'${diseno.tipografia || 'Inter'}', sans-serif` }}>
      <ModaHeader
        tienda={tienda || {}}
        slug={slug || ''}
        cp={cp}
        carritoSize={carrito.reduce((s: number, i: any) => s + Number(i.cantidad || 1), 0)}
        onOpenCart={() => setMostrarCarrito(!mostrarCarrito)}
        searchQuery={search}
        setSearchQuery={setSearch}
        onSearchSubmit={e => { e.preventDefault(); const q = search.trim(); if (q) setSearch(q); }}
        allCategories={allCategorías}
      />

      <main className="w-full max-w-7xl mx-auto px-4 xl:px-8 py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
          <button onClick={() => navigate(`/tienda/${slug}`)} className="hover:text-gray-700 transition-colors font-medium">Inicio</button>
          <Icon icon="solar:alt-arrow-right-linear" width={12} />
          <span className="font-semibold text-gray-700">Catálogo</span>
        </nav>

        {/* Page header */}
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">
              {selectedCategorías[0] || 'Todos los productos'}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {sortedProductos.length} producto{sortedProductos.length !== 1 ? 's' : ''} encontrado{sortedProductos.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-700 bg-white hover:border-gray-900 transition-all"
            >
              <Icon icon="solar:filter-bold" width={16} />
              Filtros
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-gray-900" />}
            </button>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-sm font-semibold text-gray-700 border-2 border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:border-gray-900 cursor-pointer appearance-none pr-8 transition-all hover:border-gray-900"
            >
              <option value="relevance">Más relevantes</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="name-asc">Nombre A-Z</option>
            </select>
          </div>
        </div>

        {/* Active filter chips */}
        {(selectedCategorías.length > 0 || selectedMarcas.length > 0) && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {[...selectedCategorías, ...selectedMarcas].map(chip => (
              <span
                key={chip}
                onClick={() => { toggleCategory(chip); toggleBrand(chip); }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-900 text-white text-xs font-bold cursor-pointer hover:bg-gray-700 transition-colors"
              >
                {chip}
                <Icon icon="solar:close-circle-bold" className="text-gray-400" width={14} />
              </span>
            ))}
            <button
              onClick={() => { setSelectedMarcas([]); setSelectedCategorías([]); setPriceRange([minPrice, maxPrice]); }}
              className="text-xs font-semibold text-gray-400 hover:text-gray-700 underline underline-offset-2"
            >
              Limpiar todo
            </button>
          </div>
        )}

        {/* Main grid + sidebar */}
        <div className="flex gap-8 items-start">

          {/* Sidebar */}
          <aside className="w-56 flex-shrink-0 hidden lg:block sticky top-24 space-y-6">
            {allCategorías.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Categorías</p>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategorías([])}
                    className={`w-full text-left text-sm px-3 py-2 rounded-xl font-semibold transition-all ${selectedCategorías.length === 0 ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    Todos
                  </button>
                  {allCategorías.map((cat, i) => {
                    const name = typeof cat === 'string' ? cat : cat.nombre;
                    const active = selectedCategorías.includes(name);
                    return (
                      <button
                        key={i}
                        onClick={() => toggleCategory(name)}
                        className={`w-full text-left text-sm px-3 py-2 rounded-xl font-semibold transition-all ${active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {allMarcas.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Marcas</p>
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                  {filteredMarcas.map((brand, i) => {
                    const name = typeof brand === 'string' ? brand : brand.nombre;
                    const active = selectedMarcas.includes(name);
                    return (
                      <button
                        key={i}
                        onClick={() => toggleBrand(name)}
                        className={`w-full text-left text-sm px-3 py-2 rounded-xl font-semibold transition-all ${active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Precio</p>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input type="number" placeholder="Desde" value={priceRange[0]}
                    onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="w-1/2 bg-white border-2 border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-gray-900 transition-colors" />
                  <input type="number" placeholder="Hasta" value={priceRange[1]}
                    onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-1/2 bg-white border-2 border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-gray-900 transition-colors" />
                </div>
                <input type="range" min={minPrice} max={maxPrice} value={priceRange[1]}
                  onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-full accent-gray-900" />
                <div className="flex justify-between text-[11px] text-gray-400 font-semibold">
                  <span>S/ {minPrice}</span><span>S/ {maxPrice}</span>
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => { setSelectedMarcas([]); setSelectedCategorías([]); setPriceRange([minPrice, maxPrice]); }}
                className="w-full py-2.5 text-xs font-bold rounded-xl border-2 border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-all"
              >
                Limpiar filtros
              </button>
            )}
          </aside>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-[#F0EBE3] rounded-2xl aspect-[3/4] mb-3" />
                    <div className="bg-gray-100 rounded h-3 w-3/4 mb-2" />
                    <div className="bg-gray-100 rounded h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : sortedProductos.length === 0 ? (
              <div className="py-24 text-center">
                <Icon icon="solar:box-linear" className="text-6xl mx-auto mb-4 text-gray-200" />
                <h3 className="text-lg font-black text-gray-900 mb-2">Sin resultados</h3>
                <p className="text-sm text-gray-500 mb-6">Prueba ajustando los filtros o buscando algo diferente.</p>
                <button
                  onClick={() => { setSearch(''); setSelectedMarcas([]); setSelectedCategorías([]); setPriceRange([minPrice, maxPrice]); }}
                  className="text-sm font-bold px-6 py-3 rounded-xl border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                  {sortedProductos.map(producto => {
                    const price = Number(producto.precioUnitario || 0);
                    const original = Number(producto.precioOriginal || 0);
                    const hasDisc = original > 0 && original > price;
                    return (
                      <button
                        key={producto.id}
                        onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)}
                        className="text-left group w-full"
                      >
                        <div className="relative overflow-hidden rounded-2xl bg-[#F5F0EB] aspect-[3/4] mb-3">
                          {producto.imagenUrl ? (
                            <img src={producto.imagenUrl} alt={producto.descripcion}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Icon icon="solar:box-linear" className="text-gray-300 text-5xl" />
                            </div>
                          )}
                          {hasDisc && (
                            <span className="absolute top-3 left-3 text-[10px] font-black text-white px-2.5 py-1 rounded-full tracking-wider bg-gray-900">
                              -{Math.round((1 - price / original) * 100)}%
                            </span>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); handleAgregarProducto(producto); }}
                            className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-200 bg-white text-gray-900 text-xs font-bold px-5 py-2.5 rounded-full shadow-lg hover:bg-gray-900 hover:text-white"
                          >
                            Añadir a la bolsa
                          </button>
                        </div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1 truncate">
                          {typeof producto.categoria === 'object' ? producto.categoria?.nombre : producto.categoria || 'Moda'}
                        </p>
                        <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 mb-2">{producto.descripcion}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-gray-900">S/ {price.toFixed(2)}</span>
                          {hasDisc && <span className="text-xs text-gray-400 line-through">S/ {original.toFixed(2)}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {productos.length < total && (
                  <div className="mt-12 flex justify-center">
                    <button
                      onClick={() => { const next = page + 1; cargarProductos(next); }}
                      className="px-8 py-3.5 rounded-xl font-bold text-sm border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all"
                    >
                      Cargar más productos
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile filter drawer */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-[200] lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilters(false)} />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <span className="font-black text-gray-900">Filtros</span>
                <button onClick={() => setShowMobileFilters(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <Icon icon="solar:close-circle-bold" width={18} className="text-gray-600" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
                {allCategorías.length > 0 && (
                  <div>
                    <p className="font-bold text-gray-800 mb-3 text-sm">Categorías</p>
                    <div className="flex flex-wrap gap-2">
                      {allCategorías.map((cat, i) => {
                        const name = typeof cat === 'string' ? cat : cat.nombre;
                        const active = selectedCategorías.includes(name);
                        return (
                          <button key={i} onClick={() => toggleCategory(name)}
                            className="px-4 py-2 rounded-full text-xs font-bold border-2 transition-all"
                            style={active ? { background: '#1A1A1A', borderColor: '#1A1A1A', color: 'white' } : { borderColor: '#E5E7EB', color: '#6B7280' }}>
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {filteredMarcas.length > 0 && (
                  <div>
                    <p className="font-bold text-gray-800 mb-3 text-sm">Marcas</p>
                    <div className="flex flex-wrap gap-2">
                      {filteredMarcas.map((brand, i) => {
                        const name = typeof brand === 'string' ? brand : brand.nombre;
                        const active = selectedMarcas.includes(name);
                        return (
                          <button key={i} onClick={() => toggleBrand(name)}
                            className="px-4 py-2 rounded-full text-xs font-bold border-2 transition-all"
                            style={active ? { background: '#1A1A1A', borderColor: '#1A1A1A', color: 'white' } : { borderColor: '#E5E7EB', color: '#6B7280' }}>
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
                {hasActiveFilters && (
                  <button onClick={() => { setSelectedMarcas([]); setSelectedCategorías([]); setPriceRange([minPrice, maxPrice]); }}
                    className="flex-1 py-3 rounded-2xl text-sm font-bold border-2 border-gray-900 text-gray-900">
                    Limpiar
                  </button>
                )}
                <button onClick={() => setShowMobileFilters(false)}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white bg-gray-900">
                  Ver {sortedProductos.length} resultados
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <ModaFooter tiendaNombre={tienda?.nombreComercial || tienda?.nombre || 'Styliq'} />

      <ShoppingCartModal
        isOpen={mostrarCarrito}
        onClose={() => setMostrarCarrito(false)}
        carrito={carrito}
        tienda={tienda || {}}
        actualizarCantidad={actualizarCantidad}
        onCheckout={irACheckout}
        slug={slug || ''}
        setCarrito={setCarrito}
      />

      {showPersonalizarModal && productoAPersonalizar && (
        <ProductCustomizationModal
          isOpen={showPersonalizarModal}
          onClose={() => { setShowPersonalizarModal(false); setProductoAPersonalizar(null); }}
          product={productoAPersonalizar}
          modifiers={modificadoresProducto}
          onConfirm={(producto, mods) => { agregarAlCarritoDirecto(producto, mods); setShowPersonalizarModal(false); setProductoAPersonalizar(null); }}
        />
      )}
    </div>
  );
}
