import { type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateCatalogoPageProps } from '@/templates/shared/types';
import TecnologiaCartModal from '@/components/tienda/TecnologiaCartModal';
import ProductCustomizationModal from '@/components/tienda/ProductCustomizationModal';
import { ANTOJO, AntojoFooter, AntojoHeader, AntojoProductCard, antojoDots } from './AntojoParts';
import { antojoCard, antojoPage, antojoSection, antojoStagger, antojoViewport } from './motion';

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

function SidebarBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <motion.div variants={antojoCard} initial="hidden" whileInView="show" viewport={antojoViewport} className="rounded-[24px] bg-white p-6 shadow-md shadow-black/5 ring-1 ring-black/5">
      <h3 className="mb-5 border-b border-neutral-100 pb-4 text-lg font-black text-neutral-900">{title}</h3>
      {children}
    </motion.div>
  );
}

export default function AntojoCatalogoPage({
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
  showPersonalizarModal,
  setShowPersonalizarModal,
  productoAPersonalizar,
  setProductoAPersonalizar,
  modificadoresProducto,
}: TemplateCatalogoPageProps) {
  const primary = cp || ANTOJO.tomato;

  const clearFilters = () => {
    setSelectedCategorías([]);
    setSelectedMarcas([]);
    setPriceRange([minPrice, maxPrice]);
    setSearch('');
  };

  const categoryList = allCategorías.filter(getName);
  const brandList = filteredMarcas.filter(getName);
  const totalLabel = total || sortedProductos.length;

  return (
    <motion.div initial="hidden" animate="show" variants={antojoPage} className="min-h-screen" style={{ backgroundColor: ANTOJO.cream, fontFamily: `'${diseno?.tipografia || 'Poppins'}', sans-serif` }}>
      <div style={{ background: `linear-gradient(135deg, ${primary}, ${ANTOJO.orange})` }}>
        <AntojoHeader
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
          overlay
        />
        <motion.section variants={antojoSection} className="relative px-5 pb-16 pt-6 text-center text-white">
          <div className="absolute inset-0 opacity-25" style={antojoDots} aria-hidden />
          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="text-sm font-black text-white/80">
              <button type="button" onClick={() => navigate(`/tienda/${slug}`)} className="hover:text-white">Inicio</button>
              <span className="mx-1">/</span>
              <span>Carta</span>
            </div>
            <h1 className="mt-3 text-4xl font-black md:text-5xl">Nuestra carta</h1>
          </div>
        </motion.section>
      </div>

      {/* Chips de categoría rápida */}
      {categoryList.length > 0 && (
        <div className="mx-auto max-w-7xl px-5 pt-8">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategorías([])}
              className="rounded-full px-4 py-2 text-sm font-black transition-colors"
              style={selectedCategorías.length === 0 ? { backgroundColor: primary, color: '#fff' } : { backgroundColor: '#fff', color: ANTOJO.ink }}
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
                  className="rounded-full px-4 py-2 text-sm font-black shadow-sm ring-1 ring-black/5 transition-colors"
                  style={active ? { backgroundColor: primary, color: '#fff' } : { backgroundColor: '#fff', color: ANTOJO.ink }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <motion.main variants={antojoSection} className="mx-auto max-w-7xl px-5 py-10">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6 lg:sticky lg:top-28 lg:h-fit">
            {brandList.length > 0 && (
              <SidebarBox title="Marcas">
                <div className="space-y-4">
                  {brandList.slice(0, 8).map((brand: any, index: number) => {
                    const name = getName(brand);
                    const checked = selectedMarcas.includes(name);
                    const count = Number(brand?.productosCount || brand?.count || filterCount(productos, 'marca', name));
                    return (
                      <label key={`${name}-${index}`} className="flex cursor-pointer items-center gap-3 text-sm font-bold text-neutral-500">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md border border-neutral-200 bg-white" style={checked ? { backgroundColor: primary, borderColor: primary } : undefined}>
                          {checked && <Icon icon="mdi:check" width={13} className="text-white" />}
                        </span>
                        <input type="checkbox" checked={checked} onChange={() => toggleBrand(name)} className="hidden" />
                        <span>{name}{count > 0 ? ` (${count})` : ''}</span>
                      </label>
                    );
                  })}
                </div>
              </SidebarBox>
            )}

            <SidebarBox title="Precio">
              <div className="mb-3 flex items-center justify-between text-xs font-black text-neutral-500">
                <span>S/ {priceRange[0]}</span>
                <span>S/ {maxPrice}</span>
              </div>
              <input
                type="range"
                min={minPrice}
                max={maxPrice}
                value={priceRange[0]}
                onChange={(event) => setPriceRange([Number(event.target.value), priceRange[1]])}
                className="w-full"
                style={{ accentColor: primary }}
              />
              {hasActiveFilters && (
                <button type="button" onClick={clearFilters} className="mt-5 rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-wide text-white" style={{ backgroundColor: ANTOJO.ink }}>
                  Limpiar filtros
                </button>
              )}
            </SidebarBox>

            <SidebarBox title="Antojo">
              <div className="space-y-3 text-sm font-bold">
                <button type="button" onClick={() => setSearch('pizza')} className="flex w-full items-center gap-2 text-left text-neutral-600 hover:text-neutral-900"><Icon icon="solar:fire-bold" style={{ color: ANTOJO.orange }} /> Caliente</button>
                <button type="button" onClick={() => setSearch('frappe')} className="flex w-full items-center gap-2 text-left text-neutral-600 hover:text-neutral-900"><Icon icon="solar:snowflake-bold" style={{ color: ANTOJO.mint }} /> Helado</button>
                <button type="button" onClick={() => setSearch('oferta')} className="flex w-full items-center gap-2 text-left text-neutral-600 hover:text-neutral-900"><Icon icon="solar:tag-price-bold" style={{ color: ANTOJO.tomato }} /> En oferta</button>
              </div>
            </SidebarBox>
          </aside>

          <section className="min-w-0">
            <div className="mb-8 flex flex-col justify-between gap-4 rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-black/5 md:flex-row md:items-center">
              <p className="px-2 text-sm font-bold text-neutral-500">
                <span className="text-neutral-900">{sortedProductos.length}</span> de <span className="text-neutral-900">{totalLabel}</span> antojos
              </p>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-11 min-w-[200px] rounded-full border border-neutral-100 bg-neutral-50 px-5 text-sm font-bold text-neutral-600 outline-none">
                <option value="relevance">Orden recomendado</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="name-asc">Nombre A-Z</option>
              </select>
            </div>

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, index) => <div key={index} className="h-[380px] animate-pulse rounded-[26px] bg-black/5" />)}
              </div>
            ) : sortedProductos.length === 0 ? (
              <motion.div variants={antojoCard} initial="hidden" animate="show" className="rounded-[26px] bg-white p-16 text-center shadow-sm ring-1 ring-black/5">
                <Icon icon="solar:donut-bitten-broken" className="mx-auto mb-4 text-6xl" style={{ color: ANTOJO.orange }} />
                <h3 className="text-xl font-black text-neutral-900">No encontramos ese antojo</h3>
                <p className="mt-2 text-sm font-semibold text-neutral-500">Prueba con otra categoría o limpia los filtros.</p>
                <button type="button" onClick={clearFilters} className="mt-6 rounded-full px-6 py-3 text-xs font-black uppercase tracking-wide text-white" style={{ backgroundColor: primary }}>Limpiar filtros</button>
              </motion.div>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  <motion.div key="grid" variants={antojoStagger} initial="hidden" animate="show" exit={{ opacity: 0, y: 12, transition: { duration: 0.18 } }} className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {sortedProductos.map((producto) => (
                      <AntojoProductCard key={producto.id} producto={producto} slug={slug} cp={primary} onAddToCart={handleAgregarProducto} onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)} />
                    ))}
                  </motion.div>
                </AnimatePresence>
                {productos.length < total && (
                  <div className="mt-12 flex justify-center">
                    <button type="button" onClick={() => cargarProductos(page + 1)} className="rounded-full px-8 py-4 text-xs font-black uppercase tracking-wide text-white shadow-lg" style={{ backgroundColor: primary }}>
                      Cargar más
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </motion.main>

      <AntojoFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategorías} />
      <TecnologiaCartModal
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
