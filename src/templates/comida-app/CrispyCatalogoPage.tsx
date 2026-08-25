import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateCatalogoPageProps } from '@/templates/shared/types';
import ProductCustomizationModal from '@/components/tienda/ProductCustomizationModal';
import { FOOD, FoodCartModal, FoodProductCard, FoodSearchBar, FoodShell, FoodSubHeader, foodPrimary } from './CrispyParts';
import { foodCard, foodPage, foodStagger, foodViewport } from './motion';

function getName(item: any) { return typeof item === 'string' ? item : item?.nombre; }

export default function CrispyCatalogoPage({
  tienda, slug, diseno, cp, navigate,
  productos, sortedProductos, loading, total, page, cargarProductos,
  allCategorías, selectedCategorías, setSelectedCategorías, toggleCategory,
  sortBy, setSortBy, hasActiveFilters, setSelectedMarcas, setPriceRange, minPrice, maxPrice,
  search, setSearch,
  carrito, setCarrito, mostrarCarrito, setMostrarCarrito, actualizarCantidad, irACheckout,
  handleAgregarProducto, agregarAlCarritoDirecto,
  showPersonalizarModal, setShowPersonalizarModal, productoAPersonalizar, setProductoAPersonalizar, modificadoresProducto,
}: TemplateCatalogoPageProps) {
  const primary = foodPrimary(cp);
  const categoryList = allCategorías.filter(getName);

  const clearFilters = () => { setSelectedCategorías([]); setSelectedMarcas([]); setPriceRange([minPrice, maxPrice]); setSearch(''); };

  return (
    <FoodShell slug={slug} active="menu" cp={primary} diseno={diseno} tienda={tienda} carrito={carrito} onOpenCart={() => setMostrarCarrito(true)} categories={allCategorías}>
      <motion.div initial="hidden" animate="show" variants={foodPage}>
        <div className="lg:hidden">
          <FoodSubHeader title={diseno?.comidaAppMenuTitle || 'Menú'} slug={slug} cp={primary} carrito={carrito} onOpenCart={() => setMostrarCarrito(true)} />
        </div>
        <h1 className="hidden pt-8 text-[30px] font-extrabold lg:block" style={{ color: FOOD.ink }}>{diseno?.comidaAppMenuTitle || 'Menú'}</h1>
        <FoodSearchBar
          value={search}
          setValue={setSearch}
          placeholder={diseno?.comidaAppSearchPlaceholder || 'Busca tu antojo...'}
          onSubmit={(e, v) => { e.preventDefault(); setSearch(v || ''); setSelectedCategorías([]); }}
        />

        {/* Chips de categoría */}
        {categoryList.length > 0 && (
          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:flex-wrap lg:overflow-visible lg:px-0">
            <button type="button" onClick={() => setSelectedCategorías([])} className="shrink-0 rounded-full px-4 py-2 text-[12px] font-bold" style={selectedCategorías.length === 0 ? { backgroundColor: primary, color: '#fff' } : { backgroundColor: '#fff', color: FOOD.ink }}>Todo</button>
            {categoryList.slice(0, 14).map((cat: any, i: number) => {
              const name = getName(cat);
              const active = selectedCategorías.includes(name);
              return (
                <button key={`${name}-${i}`} type="button" onClick={() => toggleCategory(name)} className="shrink-0 rounded-full px-4 py-2 text-[12px] font-bold" style={active ? { backgroundColor: primary, color: '#fff' } : { backgroundColor: '#fff', color: FOOD.ink }}>{name}</button>
              );
            })}
          </div>
        )}

        {/* Orden */}
        <div className="flex items-center justify-between px-4 pt-4 lg:px-0">
          <p className="text-[12px] font-bold" style={{ color: FOOD.soft }}>{sortedProductos.length} platos</p>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-full bg-white px-3 py-1.5 text-[12px] font-bold shadow-sm outline-none" style={{ color: FOOD.ink }}>
            <option value="relevance">Recomendado</option>
            <option value="price-asc">Menor precio</option>
            <option value="price-desc">Mayor precio</option>
            <option value="name-asc">A-Z</option>
          </select>
        </div>

        {/* Grid */}
        <div className="px-4 py-4 lg:px-0 lg:py-6">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-3xl" style={{ backgroundColor: '#00000008' }} />)}</div>
          ) : sortedProductos.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
              <Icon icon="mdi:food-off-outline" className="mx-auto mb-3 text-5xl" style={{ color: FOOD.muted }} />
              <h3 className="text-base font-extrabold" style={{ color: FOOD.ink }}>Sin resultados</h3>
              <p className="mt-1 text-sm font-medium" style={{ color: FOOD.soft }}>Prueba con otra categoría.</p>
              {hasActiveFilters && <button type="button" onClick={clearFilters} className="mt-4 rounded-full px-5 py-2.5 text-[12px] font-extrabold text-white" style={{ backgroundColor: primary }}>Limpiar</button>}
            </div>
          ) : (
            <>
              <motion.div variants={foodStagger} initial="hidden" animate="show" viewport={foodViewport} className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
                {sortedProductos.map((p) => (
                  <motion.div key={p.id} variants={foodCard}>
                    <FoodProductCard producto={p} slug={slug} cp={primary} onAddToCart={handleAgregarProducto} onClick={() => navigate(`/tienda/${slug}/producto/${p.id}`)} />
                  </motion.div>
                ))}
              </motion.div>
              {productos.length < total && (
                <div className="mt-6 flex justify-center">
                  <button type="button" onClick={() => cargarProductos(page + 1)} className="rounded-full bg-white px-8 py-3 text-[12px] font-extrabold shadow-sm" style={{ color: FOOD.ink }}>Cargar más</button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      <FoodCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={irACheckout} cp={primary} tienda={tienda} />
      {showPersonalizarModal && productoAPersonalizar && (
        <ProductCustomizationModal
          isOpen={showPersonalizarModal}
          onClose={() => { setShowPersonalizarModal(false); setProductoAPersonalizar(null); }}
          product={productoAPersonalizar}
          modifiers={modificadoresProducto}
          onConfirm={(producto, mods) => { agregarAlCarritoDirecto(producto, mods); setShowPersonalizarModal(false); setProductoAPersonalizar(null); }}
        />
      )}
    </FoodShell>
  );
}
