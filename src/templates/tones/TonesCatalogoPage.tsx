import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateCatalogoPageProps } from '@/templates/shared/types';
import ProductCustomizationModal from '@/components/tienda/ProductCustomizationModal';
import { TN, TnCartModal, TnFooter, TnHeader, TnProductCard, TnWhatsAppFab, tnFont, tnPrimary } from './TonesParts';
import { tnCard, tnPage, tnSection, tnStagger } from './motion';

function getName(item: any) {
  return typeof item === 'string' ? item : item?.nombre;
}

export default function TonesCatalogoPage({
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
  selectedCategorías,
  setSelectedCategorías,
  setSelectedMarcas,
  priceRange,
  setPriceRange,
  minPrice,
  maxPrice,
  sortBy,
  setSortBy,
  hasActiveFilters,
  toggleCategory,
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
  const primary = tnPrimary(cp);
  const font = tnFont(diseno);

  const clearFilters = () => {
    setSelectedCategorías([]);
    setSelectedMarcas([]);
    setPriceRange([minPrice, maxPrice]);
    setSearch('');
  };

  const categoryList = allCategorías.filter(getName);
  const totalLabel = total || sortedProductos.length;
  const activeTitle = selectedCategorías.length === 1 ? selectedCategorías[0] : (diseno?.tonesShopTitle || 'Toda la colección');
  const subtitle = diseno?.tonesShopSubtitle || 'Básicos suaves y cómodos, listos para jugar, dormir y crecer.';

  return (
    <motion.div initial="hidden" animate="show" variants={tnPage} className="min-h-screen" style={{ backgroundColor: TN.cream, fontFamily: font }}>
      <TnHeader
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

      {/* Título de la sección */}
      <section className="mx-auto max-w-[1240px] px-4 pt-10 md:px-6 md:pt-12">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          <button type="button" onClick={() => navigate(`/tienda/${slug}`)} className="hover:text-neutral-900">Inicio</button>
          <span className="mx-2">/</span>
          <span className="text-neutral-600">Tienda</span>
        </div>
        <h1 className="mt-2 text-4xl uppercase tracking-[-0.01em] md:text-5xl" style={{ fontFamily: TN.display, fontWeight: 800, color: TN.ink }}>{activeTitle}</h1>
        <p className="mt-2 max-w-xl text-sm lowercase text-neutral-500">{subtitle}</p>
      </section>

      {/* Chips de categoría */}
      {categoryList.length > 0 && (
        <div className="mx-auto max-w-[1240px] px-4 pt-6 md:px-6">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategorías([])}
              className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] transition-colors"
              style={selectedCategorías.length === 0 ? { backgroundColor: TN.cocoa, color: '#fff' } : { backgroundColor: TN.panel, color: TN.ink, border: `1px solid ${TN.line}` }}
            >
              Todo
            </button>
            {categoryList.slice(0, 12).map((cat: any, index: number) => {
              const name = getName(cat);
              const active = selectedCategorías.includes(name);
              return (
                <button
                  key={`${name}-${index}`}
                  type="button"
                  onClick={() => toggleCategory(name)}
                  className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] transition-colors"
                  style={active ? { backgroundColor: TN.cocoa, color: '#fff' } : { backgroundColor: TN.panel, color: TN.ink, border: `1px solid ${TN.line}` }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <motion.main variants={tnSection} className="mx-auto max-w-[1240px] px-4 py-8 md:px-6">
        {/* Barra de orden */}
        <div className="mb-8 flex flex-col justify-between gap-4 rounded-[20px] border p-4 md:flex-row md:items-center" style={{ backgroundColor: TN.panel, borderColor: TN.line }}>
          <p className="px-2 text-sm text-neutral-500">
            <span className="font-bold" style={{ color: TN.ink }}>{sortedProductos.length}</span> de <span className="font-bold" style={{ color: TN.ink }}>{totalLabel}</span> prendas
          </p>
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className="rounded-full px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors" style={{ color: TN.cocoa, border: `1px solid ${TN.lineStrong}` }}>
                Limpiar
              </button>
            )}
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-11 min-w-[210px] rounded-full border bg-white px-5 text-sm font-medium text-neutral-600 outline-none" style={{ borderColor: TN.line }}>
              <option value="relevance">Orden recomendado</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="name-asc">Nombre A-Z</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => <div key={index} className="aspect-[4/5] animate-pulse rounded-[20px] bg-black/[0.05]" />)}
          </div>
        ) : sortedProductos.length === 0 ? (
          <motion.div variants={tnCard} initial="hidden" animate="show" className="rounded-[22px] border p-16 text-center" style={{ backgroundColor: TN.panel, borderColor: TN.line }}>
            <Icon icon="solar:t-shirt-linear" className="mx-auto mb-4 text-6xl" style={{ color: TN.taupe }} />
            <h3 className="text-xl lowercase" style={{ fontFamily: TN.brand, fontWeight: 700, color: TN.ink }}>No encontramos esa prenda</h3>
            <p className="mt-2 text-sm text-neutral-500">Prueba con otra categoría o limpia los filtros.</p>
            <button type="button" onClick={clearFilters} className="mt-6 rounded-full px-6 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white" style={{ backgroundColor: TN.cocoa }}>Limpiar filtros</button>
          </motion.div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div key="grid" variants={tnStagger} initial="hidden" animate="show" exit={{ opacity: 0, y: 12, transition: { duration: 0.18 } }} className="grid grid-cols-2 gap-5 lg:grid-cols-3">
                {sortedProductos.map((producto) => (
                  <TnProductCard key={producto.id} producto={producto} slug={slug} cp={primary} onAddToCart={handleAgregarProducto} onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)} />
                ))}
              </motion.div>
            </AnimatePresence>
            {productos.length < total && (
              <div className="mt-12 flex justify-center">
                <button type="button" onClick={() => cargarProductos(page + 1)} className="rounded-full px-8 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-lg" style={{ backgroundColor: TN.cocoa }}>
                  Cargar más
                </button>
              </div>
            )}
          </>
        )}
      </motion.main>

      <TnFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategorías} />
      <TnWhatsAppFab tienda={tienda} />

      <TnCartModal
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
