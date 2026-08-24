import { type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateCatalogoPageProps } from '@/templates/shared/types';
import ProductCustomizationModal from '@/components/tienda/ProductCustomizationModal';
import { URB, UrbCartModal, UrbFooter, UrbHeader, UrbProductCard, UrbWhatsAppFab, urbFont, urbPrimary } from './RopaHombreParts';
import { urbCard, urbPage, urbSection, urbStagger, urbViewport } from './motion';

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
    <motion.div variants={urbCard} initial="hidden" whileInView="show" viewport={urbViewport} className="rounded-2xl border bg-white p-6" style={{ borderColor: URB.line }}>
      <h3 className="mb-5 border-b pb-4 text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: URB.ink, borderColor: URB.line }}>{title}</h3>
      {children}
    </motion.div>
  );
}

export default function RopaHombreCatalogoPage({
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
  const primary = urbPrimary(cp);
  const font = urbFont(diseno);

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
    <motion.div initial="hidden" animate="show" variants={urbPage} className="min-h-screen" style={{ backgroundColor: URB.cream, fontFamily: font }}>
      <UrbHeader
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

      <section className="relative overflow-hidden border-b" style={{ borderColor: URB.line, background: `linear-gradient(120% 120% at 80% 0%, ${URB.nude}, ${URB.cream} 60%)` }}>
        <div className="mx-auto max-w-7xl px-6 py-12 text-center md:py-16">
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
            <button type="button" onClick={() => navigate(`/tienda/${slug}`)} className="hover:text-neutral-900">Inicio</button>
            <span className="mx-2">/</span>
            <span className="text-neutral-700">Tienda</span>
          </div>
          <h1 className="mt-3 text-4xl uppercase tracking-[0.1em] md:text-5xl" style={{ fontFamily: URB.serif, color: URB.ink }}>Nuestra colección</h1>
        </div>
      </section>

      {categoryList.length > 0 && (
        <div className="mx-auto max-w-7xl px-6 pt-8">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategorías([])}
              className="rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] transition-colors"
              style={selectedCategorías.length === 0 ? { backgroundColor: URB.ink, color: '#fff' } : { backgroundColor: '#fff', color: URB.ink, border: `1px solid ${URB.line}` }}
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
                  className="rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] transition-colors"
                  style={active ? { backgroundColor: URB.ink, color: '#fff' } : { backgroundColor: '#fff', color: URB.ink, border: `1px solid ${URB.line}` }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <motion.main variants={urbSection} className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6 lg:sticky lg:top-28 lg:h-fit">
            {brandList.length > 0 && (
              <SidebarBox title="Marcas">
                <div className="space-y-4">
                  {brandList.slice(0, 10).map((brand: any, index: number) => {
                    const name = getName(brand);
                    const checked = selectedMarcas.includes(name);
                    const count = Number(brand?.productosCount || brand?.count || filterCount(productos, 'marca', name));
                    return (
                      <label key={`${name}-${index}`} className="flex cursor-pointer items-center gap-3 text-sm text-neutral-600">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md border bg-white" style={checked ? { backgroundColor: URB.ink, borderColor: URB.ink } : { borderColor: URB.tan }}>
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
              <div className="mb-3 flex items-center justify-between text-xs font-semibold text-neutral-500">
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
                style={{ accentColor: URB.ink }}
              />
              {hasActiveFilters && (
                <button type="button" onClick={clearFilters} className="mt-5 rounded-full px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white" style={{ backgroundColor: URB.ink }}>
                  Limpiar filtros
                </button>
              )}
            </SidebarBox>
          </aside>

          <section className="min-w-0">
            <div className="mb-8 flex flex-col justify-between gap-4 rounded-2xl border bg-white p-4 md:flex-row md:items-center" style={{ borderColor: URB.line }}>
              <p className="px-2 text-sm text-neutral-500">
                <span className="font-semibold" style={{ color: URB.ink }}>{sortedProductos.length}</span> de <span className="font-semibold" style={{ color: URB.ink }}>{totalLabel}</span> productos
              </p>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-11 min-w-[210px] rounded-full border bg-neutral-50 px-5 text-sm font-medium text-neutral-600 outline-none" style={{ borderColor: URB.line }}>
                <option value="relevance">Orden recomendado</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="name-asc">Nombre A-Z</option>
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-10 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, index) => <div key={index} className="aspect-[4/5] animate-pulse rounded-2xl bg-black/[0.04]" />)}
              </div>
            ) : sortedProductos.length === 0 ? (
              <motion.div variants={urbCard} initial="hidden" animate="show" className="rounded-2xl border bg-white p-16 text-center" style={{ borderColor: URB.line }}>
                <Icon icon="solar:hanger-2-linear" className="mx-auto mb-4 text-6xl" style={{ color: URB.tan }} />
                <h3 className="text-xl" style={{ fontFamily: URB.serif, color: URB.ink }}>No encontramos esa prenda</h3>
                <p className="mt-2 text-sm text-neutral-500">Prueba con otra categoría o limpia los filtros.</p>
                <button type="button" onClick={clearFilters} className="mt-6 rounded-full px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white" style={{ backgroundColor: URB.ink }}>Limpiar filtros</button>
              </motion.div>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  <motion.div key="grid" variants={urbStagger} initial="hidden" animate="show" exit={{ opacity: 0, y: 12, transition: { duration: 0.18 } }} className="grid grid-cols-2 gap-x-6 gap-y-10 xl:grid-cols-3">
                    {sortedProductos.map((producto) => (
                      <UrbProductCard key={producto.id} producto={producto} slug={slug} cp={primary} onAddToCart={handleAgregarProducto} onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)} />
                    ))}
                  </motion.div>
                </AnimatePresence>
                {productos.length < total && (
                  <div className="mt-12 flex justify-center">
                    <button type="button" onClick={() => cargarProductos(page + 1)} className="rounded-full px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white shadow-lg" style={{ backgroundColor: URB.ink }}>
                      Cargar más
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </motion.main>

      <UrbFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategorías} />
      <UrbWhatsAppFab tienda={tienda} />

      <UrbCartModal
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
