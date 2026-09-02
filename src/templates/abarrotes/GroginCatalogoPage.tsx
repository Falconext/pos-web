import { type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateCatalogoPageProps } from '@/templates/shared/types';
import ProductCustomizationModal from '@/components/tienda/ProductCustomizationModal';
import { GRO, GroCartModal, GroFooter, GroHeader, GroProductCard, GroWhatsAppFab, groFont, groPrimary, titleCase } from './GroginParts';
import { groCard, groPage, groSection, groStagger, groViewport } from './motion';

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
    <motion.div variants={groCard} initial="hidden" whileInView="show" viewport={groViewport} className="rounded-2xl border bg-white p-5" style={{ borderColor: GRO.line }}>
      <h3 className="mb-4 text-sm font-bold" style={{ fontFamily: GRO.display, color: GRO.ink }}>{title}</h3>
      {children}
    </motion.div>
  );
}

export default function GroginCatalogoPage({
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
  const primary = groPrimary(cp);
  const font = groFont(diseno);

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
    <motion.div initial="hidden" animate="show" variants={groPage} className="min-h-screen" style={{ backgroundColor: GRO.soft, fontFamily: font }}>
      <GroHeader
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

      <div className="border-b bg-white" style={{ borderColor: GRO.line }}>
        <div className="mx-auto max-w-7xl px-5 py-5 md:px-6">
          <div className="text-xs font-medium" style={{ color: GRO.inkSoft }}>
            <button type="button" onClick={() => navigate(`/tienda/${slug}`)} className="hover:text-neutral-900">Inicio</button>
            <span className="mx-2">/</span>
            <span style={{ color: GRO.ink }}>Tienda</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold md:text-3xl" style={{ fontFamily: GRO.display, color: GRO.ink }}>Todos los productos</h1>
        </div>
      </div>

      <motion.main variants={groSection} className="mx-auto max-w-7xl px-5 py-8 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
            {categoryList.length > 0 && (
              <SidebarBox title="Categorías">
                <div className="space-y-1">
                  <button type="button" onClick={() => setSelectedCategorías([])} className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors" style={selectedCategorías.length === 0 ? { backgroundColor: GRO.greenSoft, color: GRO.greenDark } : { color: GRO.inkSoft }}>Todas</button>
                  {categoryList.slice(0, 14).map((cat: any, i: number) => {
                    const name = getName(cat);
                    const active = selectedCategorías.includes(name);
                    return (
                      <button key={`${name}-${i}`} type="button" onClick={() => toggleCategory(name)} className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors" style={active ? { backgroundColor: GRO.greenSoft, color: GRO.greenDark } : { color: GRO.inkSoft }}>{titleCase(name)}</button>
                    );
                  })}
                </div>
              </SidebarBox>
            )}

            {brandList.length > 0 && (
              <SidebarBox title="Marcas">
                <div className="space-y-3">
                  {brandList.slice(0, 10).map((brand: any, i: number) => {
                    const name = getName(brand);
                    const checked = selectedMarcas.includes(name);
                    const count = Number(brand?.productosCount || brand?.count || filterCount(productos, 'marca', name));
                    return (
                      <label key={`${name}-${i}`} className="flex cursor-pointer items-center gap-3 text-sm" style={{ color: GRO.inkSoft }}>
                        <span className="flex h-5 w-5 items-center justify-center rounded-md border" style={checked ? { backgroundColor: primary, borderColor: primary } : { borderColor: GRO.line }}>
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
              <div className="mb-3 flex items-center justify-between text-xs font-bold" style={{ color: GRO.inkSoft }}>
                <span>S/ {priceRange[0]}</span>
                <span>S/ {maxPrice}</span>
              </div>
              <input type="range" min={minPrice} max={maxPrice} value={priceRange[0]} onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])} className="w-full" style={{ accentColor: primary }} />
              {hasActiveFilters && (
                <button type="button" onClick={clearFilters} className="mt-4 rounded-full px-5 py-2.5 text-[12px] font-bold text-white" style={{ backgroundColor: primary }}>Limpiar filtros</button>
              )}
            </SidebarBox>
          </aside>

          <section className="min-w-0">
            <div className="mb-6 flex flex-col justify-between gap-3 rounded-2xl border bg-white p-4 md:flex-row md:items-center" style={{ borderColor: GRO.line }}>
              <p className="px-1 text-sm" style={{ color: GRO.inkSoft }}>
                <span className="font-bold" style={{ color: GRO.ink }}>{sortedProductos.length}</span> de <span className="font-bold" style={{ color: GRO.ink }}>{totalLabel}</span> productos
              </p>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-10 min-w-[210px] rounded-full border bg-neutral-50 px-5 text-sm font-medium outline-none" style={{ borderColor: GRO.line, color: GRO.ink }}>
                <option value="relevance">Orden recomendado</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="name-asc">Nombre A-Z</option>
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-black/[0.04]" />)}
              </div>
            ) : sortedProductos.length === 0 ? (
              <motion.div variants={groCard} initial="hidden" animate="show" className="rounded-2xl border bg-white p-16 text-center" style={{ borderColor: GRO.line }}>
                <Icon icon="solar:cart-cross-linear" className="mx-auto mb-4 text-6xl" style={{ color: GRO.green }} />
                <h3 className="text-xl font-bold" style={{ fontFamily: GRO.display, color: GRO.ink }}>No encontramos ese producto</h3>
                <p className="mt-2 text-sm" style={{ color: GRO.inkSoft }}>Prueba con otra categoría o limpia los filtros.</p>
                <button type="button" onClick={clearFilters} className="mt-6 rounded-full px-6 py-3 text-[12px] font-bold text-white" style={{ backgroundColor: primary }}>Limpiar filtros</button>
              </motion.div>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  <motion.div key="grid" variants={groStagger} initial="hidden" animate="show" exit={{ opacity: 0, y: 12, transition: { duration: 0.18 } }} className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                    {sortedProductos.map((producto) => (
                      <GroProductCard key={producto.id} producto={producto} slug={slug} cp={primary} onAddToCart={handleAgregarProducto} onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)} />
                    ))}
                  </motion.div>
                </AnimatePresence>
                {productos.length < total && (
                  <div className="mt-10 flex justify-center">
                    <button type="button" onClick={() => cargarProductos(page + 1)} className="rounded-full px-8 py-3.5 text-[13px] font-bold text-white shadow-lg" style={{ backgroundColor: primary }}>Cargar más productos</button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </motion.main>

      <GroFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategorías} />
      <GroWhatsAppFab tienda={tienda} />

      <GroCartModal
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
          onClose={() => { setShowPersonalizarModal(false); setProductoAPersonalizar(null); }}
          product={productoAPersonalizar}
          modifiers={modificadoresProducto}
          onConfirm={(producto, mods) => { agregarAlCarritoDirecto(producto, mods); setShowPersonalizarModal(false); setProductoAPersonalizar(null); }}
        />
      )}
    </motion.div>
  );
}
