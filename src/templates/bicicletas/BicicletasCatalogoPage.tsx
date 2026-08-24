import { type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateCatalogoPageProps } from '@/templates/shared/types';
import ProductCustomizationModal from '@/components/tienda/ProductCustomizationModal';
import { VELO, VeloCartModal, VeloCatalogCard, VeloFooter, VeloHeader, VeloWhatsAppFab, veloFont, veloPrimary } from './BicicletasParts';
import { veloCard, veloPage, veloSection, veloStagger, veloViewport } from './motion';

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
    <motion.div variants={veloCard} initial="hidden" whileInView="show" viewport={veloViewport} className="border bg-white p-6" style={{ borderColor: VELO.line }}>
      <h3 className="mb-5 border-b pb-4 text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: VELO.ink, borderColor: VELO.line }}>{title}</h3>
      {children}
    </motion.div>
  );
}

/** Mapa de nombres de color (ES/EN) → hex, para renderizar swatches en el filtro de Color. */
const COLOR_HEX: Record<string, string> = {
  negro: '#111114', black: '#111114',
  blanco: '#F4F4F5', white: '#F4F4F5',
  gris: '#9CA3AF', grey: '#9CA3AF', gray: '#9CA3AF', plata: '#C0C4CC', plateado: '#C0C4CC', silver: '#C0C4CC',
  rojo: '#E30613', red: '#E30613',
  azul: '#2563EB', blue: '#2563EB',
  'azul marino': '#1E3A5F', 'dark blue': '#1E3A5F', celeste: '#38BDF8',
  verde: '#16A34A', green: '#16A34A', lima: '#84CC16',
  naranja: '#F97316', orange: '#F97316',
  amarillo: '#FACC15', yellow: '#FACC15',
  morado: '#7C3AED', purple: '#7C3AED', violeta: '#7C3AED',
  rosa: '#EC4899', pink: '#EC4899',
  dorado: '#B08D5D', gold: '#B08D5D', marron: '#7C5A3A', cafe: '#7C5A3A', brown: '#7C5A3A',
};

function colorToHex(name: string): string {
  const key = String(name || '').trim().toLowerCase();
  return COLOR_HEX[key] || '#CBD5E1';
}

/** Filtro de Color con swatches (dots). */
function ColorFacet({ facet, selected, onToggle, primary }: { facet: any; selected: string[]; onToggle: (key: string, value: string) => void; primary: string }) {
  return (
    <SidebarBox title={facet.label || 'Color'}>
      <div className="flex flex-wrap gap-3">
        {facet.options.map((opt: any) => {
          const active = selected.includes(opt.value);
          const hex = colorToHex(opt.label || opt.value);
          const light = ['#F4F4F5', '#FACC15', '#84CC16', '#38BDF8'].includes(hex);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(facet.key, opt.value)}
              title={`${opt.label}${opt.count ? ` (${opt.count})` : ''}`}
              className="flex h-8 w-8 items-center justify-center rounded-full ring-1 transition-transform hover:scale-110"
              style={{ backgroundColor: hex, boxShadow: active ? `0 0 0 2px #fff, 0 0 0 4px ${primary}` : undefined, ['--tw-ring-color' as any]: 'rgba(14,14,18,0.14)' }}
              aria-pressed={active}
              aria-label={opt.label}
            >
              {active && <Icon icon="mdi:check" width={15} style={{ color: light ? '#111114' : '#fff' }} />}
            </button>
          );
        })}
      </div>
    </SidebarBox>
  );
}

/** Filtro genérico de atributo (checkboxes): talla, rueda, freno, material... */
function AttrFacet({ facet, selected, onToggle, primary }: { facet: any; selected: string[]; onToggle: (key: string, value: string) => void; primary: string }) {
  return (
    <SidebarBox title={facet.label}>
      <div className="max-h-56 space-y-4 overflow-y-auto pr-1">
        {facet.options.map((opt: any) => {
          const checked = selected.includes(opt.value);
          return (
            <label key={opt.value} className="flex cursor-pointer items-center gap-3 text-sm text-neutral-600">
              <span className="flex h-5 w-5 items-center justify-center border bg-white" style={checked ? { backgroundColor: primary, borderColor: primary } : { borderColor: VELO.steel }}>
                {checked && <Icon icon="mdi:check" width={13} className="text-white" />}
              </span>
              <input type="checkbox" checked={checked} onChange={() => onToggle(facet.key, opt.value)} className="hidden" />
              <span className="flex-1">{opt.label}</span>
              {opt.count > 0 && <span className="text-[11px] font-semibold text-neutral-300">{opt.count}</span>}
            </label>
          );
        })}
      </div>
    </SidebarBox>
  );
}

export default function BicicletasCatalogoPage({
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
  atributoFacets = [],
  selectedAtributos = {},
  setSelectedAtributos,
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
  showPersonalizarModal,
  setShowPersonalizarModal,
  productoAPersonalizar,
  setProductoAPersonalizar,
  modificadoresProducto,
}: TemplateCatalogoPageProps) {
  const primary = veloPrimary(cp);
  const font = veloFont(diseno);

  const clearFilters = () => {
    setSelectedCategorías([]);
    setSelectedMarcas([]);
    setPriceRange([minPrice, maxPrice]);
    setSelectedAtributos?.({});
    setSearch('');
  };
  const onToggleAtributo = (key: string, value: string) => {
    if (toggleAtributo) { toggleAtributo(key, value); return; }
    setSelectedAtributos?.((prev) => {
      const cur = prev[key] || [];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      const out = { ...prev, [key]: next };
      if (!next.length) delete out[key];
      return out;
    });
  };

  const categoryList = allCategorías.filter(getName);
  const brandList = filteredMarcas.filter(getName);
  const totalLabel = total || sortedProductos.length;
  const colorFacet = (atributoFacets as any[]).find((f) => f.key === 'color');
  const otherFacets = (atributoFacets as any[]).filter((f) => f.key !== 'color' && f.options?.length);

  return (
    <motion.div initial="hidden" animate="show" variants={veloPage} className="min-h-screen" style={{ backgroundColor: VELO.cloud, fontFamily: font }}>
      <VeloHeader
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

      <section className="relative overflow-hidden border-b" style={{ borderColor: VELO.line, background: `linear-gradient(120% 120% at 80% 0%, #FFFFFF, ${VELO.mist} 65%)` }}>
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-14">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
            <button type="button" onClick={() => navigate(`/tienda/${slug}`)} className="hover:text-neutral-900">Inicio</button>
            <span className="mx-2">/</span>
            <span className="text-neutral-700">Tienda</span>
          </div>
          <h1 className="mt-3 text-4xl font-bold uppercase tracking-[0.04em] md:text-5xl" style={{ fontFamily: VELO.display, color: VELO.ink }}>Toda la colección</h1>
        </div>
      </section>

      {categoryList.length > 0 && (
        <div className="mx-auto max-w-7xl px-6 pt-8">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategorías([])}
              className="px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] transition-colors"
              style={selectedCategorías.length === 0 ? { backgroundColor: primary, color: '#fff' } : { backgroundColor: '#fff', color: VELO.ink, border: `1px solid ${VELO.line}` }}
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
                  className="px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] transition-colors"
                  style={active ? { backgroundColor: primary, color: '#fff' } : { backgroundColor: '#fff', color: VELO.ink, border: `1px solid ${VELO.line}` }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <motion.main variants={veloSection} className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6 lg:sticky lg:top-28 lg:h-fit">
            {categoryList.length > 0 && (
              <SidebarBox title="Categoría">
                <div className="space-y-4">
                  {categoryList.slice(0, 12).map((cat: any, index: number) => {
                    const name = getName(cat);
                    const checked = selectedCategorías.includes(name);
                    return (
                      <label key={`${name}-${index}`} className="flex cursor-pointer items-center gap-3 text-sm text-neutral-600">
                        <span className="flex h-5 w-5 items-center justify-center border bg-white" style={checked ? { backgroundColor: primary, borderColor: primary } : { borderColor: VELO.steel }}>
                          {checked && <Icon icon="mdi:check" width={13} className="text-white" />}
                        </span>
                        <input type="checkbox" checked={checked} onChange={() => toggleCategory(name)} className="hidden" />
                        <span>{name}</span>
                      </label>
                    );
                  })}
                </div>
              </SidebarBox>
            )}

            {brandList.length > 0 && (
              <SidebarBox title="Marcas">
                <div className="space-y-4">
                  {brandList.slice(0, 12).map((brand: any, index: number) => {
                    const name = getName(brand);
                    const checked = selectedMarcas.includes(name);
                    const count = Number(brand?.productosCount || brand?.count || filterCount(productos, 'marca', name));
                    return (
                      <label key={`${name}-${index}`} className="flex cursor-pointer items-center gap-3 text-sm text-neutral-600">
                        <span className="flex h-5 w-5 items-center justify-center border bg-white" style={checked ? { backgroundColor: primary, borderColor: primary } : { borderColor: VELO.steel }}>
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

            {otherFacets.map((facet) => (
              <AttrFacet key={facet.key} facet={facet} selected={selectedAtributos[facet.key] || []} onToggle={onToggleAtributo} primary={primary} />
            ))}

            <SidebarBox title="Precio">
              <div className="mb-3 flex items-center justify-between text-xs font-bold text-neutral-500">
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
                <button type="button" onClick={clearFilters} className="mt-5 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white" style={{ backgroundColor: VELO.ink }}>
                  Limpiar filtros
                </button>
              )}
            </SidebarBox>

            {colorFacet && colorFacet.options?.length > 0 && (
              <ColorFacet facet={colorFacet} selected={selectedAtributos.color || []} onToggle={onToggleAtributo} primary={primary} />
            )}
          </aside>

          <section className="min-w-0">
            <div className="mb-8 flex flex-col justify-between gap-4 border bg-white p-4 md:flex-row md:items-center" style={{ borderColor: VELO.line }}>
              <p className="px-2 text-sm text-neutral-500">
                <span className="font-bold" style={{ color: VELO.ink }}>{sortedProductos.length}</span> de <span className="font-bold" style={{ color: VELO.ink }}>{totalLabel}</span> productos
              </p>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-11 min-w-[210px] border bg-neutral-50 px-5 text-sm font-semibold text-neutral-600 outline-none" style={{ borderColor: VELO.line }}>
                <option value="relevance">Orden recomendado</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="name-asc">Nombre A-Z</option>
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-2xl bg-black/[0.04]" />)}
              </div>
            ) : sortedProductos.length === 0 ? (
              <motion.div variants={veloCard} initial="hidden" animate="show" className="border bg-white p-16 text-center" style={{ borderColor: VELO.line }}>
                <Icon icon="mdi:bike" className="mx-auto mb-4 text-6xl" style={{ color: VELO.steel }} />
                <h3 className="text-2xl font-bold uppercase" style={{ fontFamily: VELO.display, color: VELO.ink }}>No encontramos ese producto</h3>
                <p className="mt-2 text-sm text-neutral-500">Prueba con otra categoría o limpia los filtros.</p>
                <button type="button" onClick={clearFilters} className="mt-6 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white" style={{ backgroundColor: primary }}>Limpiar filtros</button>
              </motion.div>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  <motion.div key="grid" variants={veloStagger} initial="hidden" animate="show" exit={{ opacity: 0, y: 12, transition: { duration: 0.18 } }} className="grid grid-cols-2 gap-px bg-black/[0.06] xl:grid-cols-3">
                    {sortedProductos.map((producto) => (
                      <VeloCatalogCard key={producto.id} producto={producto} slug={slug} cp={primary} onAddToCart={handleAgregarProducto} onClick={() => navigate(`/tienda/${slug}/producto/${producto.id}`)} />
                    ))}
                  </motion.div>
                </AnimatePresence>
                {productos.length < total && (
                  <div className="mt-12 flex justify-center">
                    <button type="button" onClick={() => cargarProductos(page + 1)} className="px-8 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-lg" style={{ backgroundColor: primary }}>
                      Cargar más
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </motion.main>

      <VeloFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategorías} />
      <VeloWhatsAppFab tienda={tienda} />

      <VeloCartModal
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
