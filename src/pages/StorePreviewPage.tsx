import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ProductCardXtra from '@/components/tienda/ProductCardXtra';
import ProductCardCatalog from '@/components/tienda/ProductCardCatalog';
import { getRubroDemo, type DemoProduct, type RubroDemo } from '@/data/rubroDemo';

interface PreviewConfig {
  plantillaId?: string;
  colorPrimario?: string;
  colorSecundario?: string;
  colorAccento?: string;
  tipografia?: string;
  rubroNombre?: string;
}

type PreviewPage = 'home' | 'catalogo' | 'producto';


// ─── Shared Header ─────────────────────────────────────────────────────────────
function PreviewHeader({
  demo,
  cp,
  cartCount,
  currentPage,
  onNav,
  activeCategory,
  onSelectCategory,
}: {
  demo: RubroDemo;
  cp: string;
  cartCount: number;
  currentPage: PreviewPage;
  onNav: (page: PreviewPage) => void;
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}) {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const initials = demo.storeName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const wordFirst = demo.storeName.split(' ')[0];
  const wordRest = demo.storeName.split(' ').slice(1).join(' ');
  const categories = demo.categories.filter(c => c !== 'Todos');

  const selectCategory = (category: string) => {
    onSelectCategory(category);
    setIsCategoryOpen(false);
    onNav('catalogo');
  };

  return (
    <header className="sticky z-40 bg-white border-b border-gray-100 shadow-sm" style={{ top: 36 }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-5">
        <div className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer" onClick={() => onNav('home')}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ background: cp }}>
            {initials}
          </div>
          <div className="leading-tight">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">{wordFirst}</p>
            <p className="font-black text-gray-900 text-base leading-none">{wordRest || wordFirst}<span style={{ color: cp }}>.</span></p>
          </div>
        </div>

        <div className="relative hidden lg:block flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsCategoryOpen((open) => !open)}
            className="h-11 inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-black text-gray-800 shadow-sm hover:border-gray-300 hover:shadow-md transition-all"
          >
            <span className="h-7 w-7 rounded-xl flex items-center justify-center text-white" style={{ background: cp }}>
              <Icon icon="solar:widget-5-bold-duotone" width={16} />
            </span>
            Categorías
            <Icon icon="solar:alt-arrow-down-bold" width={14} className={`transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
          </button>

          {isCategoryOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsCategoryOpen(false)} />
              <div className="absolute left-0 top-[calc(100%+10px)] z-50 w-80 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl">
                <div className="border-b border-gray-100 px-5 py-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Explorar categorías</p>
                  <p className="mt-1 text-sm font-bold text-gray-900">Selecciona una familia</p>
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                  <button type="button" onClick={() => selectCategory('Todos')} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-gray-800 hover:bg-gray-50">
                    <span className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center"><Icon icon="solar:widget-bold" width={18} /></span>
                    Todos los productos
                  </button>
                  {categories.map((name) => (
                    <button key={name} type="button" onClick={() => selectCategory(name)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-gray-800 hover:bg-gray-50">
                      <span className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${cp}14`, color: cp }}><Icon icon="solar:tag-bold-duotone" width={18} /></span>
                      <span className="min-w-0 flex-1 truncate">{name}</span>
                      {activeCategory === name && <Icon icon="solar:check-circle-bold" width={16} style={{ color: cp }} />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex-1 relative">
          <div className="h-11 hidden md:flex items-center gap-3 rounded-2xl bg-gray-50/90 px-4 shadow-sm">
            <Icon icon="solar:magnifer-linear" className="text-gray-400 text-sm flex-shrink-0" />
            <span className="text-sm font-semibold text-gray-400">Buscar productos, marcas o códigos...</span>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto flex-shrink-0">
          <button className="relative p-2.5 rounded-xl border border-gray-200 text-gray-600 bg-white">
            <Icon icon="solar:heart-linear" className="text-xl" />
          </button>
          <button className="relative p-2.5 rounded-xl border border-gray-200 text-gray-600 bg-white">
            <Icon icon="solar:bag-2-linear" className="text-xl" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">{cartCount}</span>
            )}
          </button>
          <button className="p-2.5 rounded-xl border border-gray-200 text-gray-600 bg-white hidden md:flex">
            <Icon icon="solar:delivery-linear" className="text-xl" />
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Prose classes (sin @tailwindcss/typography) ──────────────────────────────
const PROSE = [
  'text-sm text-gray-600 leading-relaxed',
  '[&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mb-2 [&_h2]:mt-4',
  '[&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-gray-800 [&_h3]:mb-2 [&_h3]:mt-3',
  '[&_p]:mb-3 [&_p]:leading-relaxed',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1',
  '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1',
  '[&_li]:text-gray-600',
  '[&_strong]:font-bold [&_strong]:text-gray-800',
  '[&_table]:w-full [&_table]:text-xs [&_table]:border-collapse [&_table]:mb-4',
  '[&_td]:border [&_td]:border-gray-200 [&_td]:px-3 [&_td]:py-2',
  '[&_th]:border [&_th]:border-gray-200 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-gray-50 [&_th]:font-bold',
].join(' ');

function buildDemoHtml(producto: DemoProduct): string {
  return `
<h2>Descripción del producto</h2>
<p>${producto.descripcion} — ideal para uso profesional y doméstico. Fabricado con materiales de alta calidad para garantizar rendimiento y durabilidad.</p>
<h2>Características principales</h2>
<ul>
  <li><strong>Marca:</strong> ${producto.marca.nombre}</li>
  <li><strong>Categoría:</strong> ${producto.categoria.nombre}</li>
  <li><strong>Stock disponible:</strong> ${producto.stock} unidades</li>
  <li><strong>Garantía:</strong> 12 meses con el fabricante</li>
  <li><strong>Origen:</strong> Importado, certificado de calidad</li>
</ul>
<h2>Especificaciones técnicas</h2>
<table>
  <thead><tr><th>Especificación</th><th>Detalle</th></tr></thead>
  <tbody>
    <tr><td>Modelo</td><td>${producto.descripcion.split(' ').slice(0, 3).join(' ')}</td></tr>
    <tr><td>Marca</td><td>${producto.marca.nombre}</td></tr>
    <tr><td>Categoría</td><td>${producto.categoria.nombre}</td></tr>
    <tr><td>Garantía</td><td>12 meses</td></tr>
    <tr><td>Condición</td><td>Nuevo, sellado de fábrica</td></tr>
  </tbody>
</table>
<h2>¿Qué incluye?</h2>
<ol>
  <li>1x ${producto.descripcion}</li>
  <li>Manual de usuario en español</li>
  <li>Certificado de garantía</li>
  <li>Accesorios de instalación</li>
</ol>
<p><strong>Nota:</strong> Las imágenes son referenciales. Para consultas sobre compatibilidad contáctanos por WhatsApp.</p>
  `.trim();
}

function PreviewDescripcion({ cp, producto }: { cp: string; producto: DemoProduct }) {
  const [open, setOpen] = useState(true);
  const html = buildDemoHtml(producto);
  return (
    <div className="mt-10 rounded-2xl border border-gray-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${cp}15` }}>
            <Icon icon="solar:document-text-bold-duotone" width={18} style={{ color: cp }} />
          </div>
          <div>
            <span className="text-sm font-bold text-gray-900">Descripción completa</span>
            <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: cp }}>
              Demo
            </span>
          </div>
        </div>
        <Icon
          icon="solar:alt-arrow-down-bold"
          width={16}
          className="text-gray-400 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      {open && (
        <div className={`px-6 py-6 bg-white ${PROSE}`} dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </div>
  );
}

// ─── Filter sidebar ─────────────────────────────────────────────────────────────
function FilterSidebar({ categories, cp, activeCategory, onSelectCategory }: { categories: string[]; cp: string; activeCategory: string; onSelectCategory: (c: string) => void }) {
  const [priceMin, setPriceMin] = useState(100);
  return (
    <aside className="w-52 flex-shrink-0 space-y-6 text-sm">
      <h3 className="font-bold text-gray-900 text-base">Filtros</h3>
      <div>
        <p className="font-semibold text-gray-700 mb-2.5">Categorías</p>
        <div className="space-y-2">
          {categories.filter(c => c !== 'Todos').slice(0, 5).map(cat => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={activeCategory === cat || activeCategory === 'Todos'} onChange={() => onSelectCategory(activeCategory === cat ? 'Todos' : cat)} className="rounded border-gray-300" style={{ accentColor: cp }} />
              <span className="text-gray-600 text-xs">{cat}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="font-semibold text-gray-700 mb-2.5">Condición</p>
        <div className="space-y-2">
          {['Nuevo', 'Segunda mano'].map(c => (
            <label key={c} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300" style={{ accentColor: cp }} />
              <span className="text-gray-600 text-xs">{c}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-gray-700">Precio mínimo</p>
          <span className="text-[11px] font-bold text-white px-1.5 py-0.5 rounded" style={{ background: cp }}>S/ {priceMin}</span>
        </div>
        <input type="range" min={0} max={500} value={priceMin} onChange={e => setPriceMin(Number(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ accentColor: cp }} />
        <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>S/ 0</span><span>S/ 500</span></div>
      </div>
      <div>
        <p className="font-semibold text-gray-700 mb-2">Precio exacto</p>
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <span className="px-2.5 py-2 bg-gray-50 text-gray-400 text-xs border-r border-gray-200">S/</span>
          <input type="number" defaultValue={100} className="flex-1 px-2.5 py-2 text-xs text-gray-700 outline-none" />
        </div>
      </div>
    </aside>
  );
}

// ─── PAGE: HOME ────────────────────────────────────────────────────────────────
function HomePage({ demo, cp, diseno, onNav, onProduct, onAddToCart }: { demo: RubroDemo; cp: string; diseno: any; onNav: (p: PreviewPage) => void; onProduct: (p: DemoProduct) => void; onAddToCart: () => void }) {
  const [headlinePre, ...headlineRest] = demo.heroKeyword.split(' ');
  const offset = Math.ceil(demo.products.length / 2);
  const related = [...demo.products.slice(offset), ...demo.products.slice(0, offset)];

  return (
    <div>
      {/* Hero */}
      <section className="mx-4 lg:mx-8 my-4 rounded-3xl overflow-hidden relative" style={{ background: '#0B1340', minHeight: 520 }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 22px, rgba(255,255,255,0.025) 22px, rgba(255,255,255,0.025) 23px)' }} />
        <div className="relative grid grid-cols-1 lg:grid-cols-2 items-center min-h-[520px]">
          <div className="px-8 lg:px-16 py-14 lg:py-20">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white mb-6" style={{ background: `${cp}30`, border: `1px solid ${cp}50` }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cp }} />
              Nuevos productos disponibles
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-5">
              Obtén{' '}
              <span style={{ color: cp }}>{headlinePre}</span>
              {headlineRest.length > 0 && <> <span style={{ color: cp }}>{headlineRest.join(' ')}</span></>}
              <br />Al Mejor Precio.
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-md">{demo.heroDesc}</p>
            <div className="flex items-center gap-4 flex-wrap">
              <button onClick={() => onNav('catalogo')} className="flex items-center gap-3 px-6 py-3 rounded-full text-white font-bold text-sm shadow-lg hover:opacity-90 transition-opacity" style={{ background: cp }}>
                Explorar Ahora
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"><Icon icon="solar:arrow-right-bold" className="text-sm" /></span>
              </button>
              <button className="flex items-center gap-3 text-white text-sm font-medium hover:opacity-80 transition-opacity">
                <span className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center bg-white/10">
                  <Icon icon="solar:play-bold" className="text-sm" />
                </span>
                Ver Promoción
              </button>
            </div>
          </div>
          <div className="relative flex items-center justify-center h-64 lg:h-auto lg:min-h-[520px] px-8 lg:px-12 pb-8 lg:pb-0">
            <div className="absolute w-64 h-64 rounded-full blur-3xl opacity-25 pointer-events-none" style={{ background: cp, right: '5%', top: '15%' }} />
            <div className="absolute w-52 h-52 rounded-full blur-2xl opacity-35 pointer-events-none" style={{ background: 'radial-gradient(circle, #e879f9 0%, #f97316 100%)', right: '20%', top: '20%' }} />
            <div className="relative z-10">
              <img src={demo.products[0].imagenUrl} alt={demo.products[0].descripcion} className="w-72 h-72 lg:w-80 lg:h-80 object-cover rounded-2xl drop-shadow-2xl cursor-pointer hover:scale-105 transition-transform duration-300" onClick={() => onProduct(demo.products[0])} style={{ filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.5))' }} />
              <div className="absolute bottom-2 -right-4 lg:-right-8 z-20 bg-white rounded-2xl shadow-2xl p-3 flex items-center gap-3 cursor-pointer" style={{ minWidth: 200 }} onClick={() => onProduct(demo.products[1])}>
                <img src={demo.products[1].imagenUrl} alt="" className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 line-clamp-1 leading-tight">{demo.products[1].descripcion}</p>
                  <p className="text-xs text-gray-400 mt-0.5">S/ <span className="font-semibold" style={{ color: cp }}>{demo.products[1].precioUnitario.toFixed(2)}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-xl text-gray-900">Productos Populares</h2>
            <p className="text-xs text-gray-400 mt-0.5">{demo.products.length} productos</p>
          </div>
          <button onClick={() => onNav('catalogo')} className="text-sm font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: cp }}>
            Ver todo <Icon icon="solar:alt-arrow-right-bold" className="text-sm" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {demo.products.slice(0, 8).map(p => (
            <ProductCardXtra key={p.id} producto={p} slug="preview" diseno={diseno} onAddToCart={onAddToCart} onClick={() => onProduct(p)} />
          ))}
        </div>
      </section>

      {/* Related */}
      <section className="bg-gray-50/60 py-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-xl text-gray-900">Productos que te podrían interesar</h2>
              <p className="text-xs text-gray-400 mt-0.5">{related.length} productos</p>
            </div>
            <button onClick={() => onNav('catalogo')} className="text-sm font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: cp }}>
              Ver todo <Icon icon="solar:alt-arrow-right-bold" className="text-sm" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.slice(0, 8).map((p, i) => (
              <ProductCardXtra key={`${p.id}-r${i}`} producto={p} slug="preview" diseno={diseno} onAddToCart={onAddToCart} onClick={() => onProduct(p)} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── PAGE: CATÁLOGO ────────────────────────────────────────────────────────────
function CatalogoPage({ demo, cp, onProduct, onAddToCart }: { demo: RubroDemo; cp: string; onProduct: (p: DemoProduct) => void; onAddToCart: () => void }) {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const filtered = activeCategory === 'Todos' ? demo.products : demo.products.filter(p => p.categoria.nombre === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
      {/* Results header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-600">
          1 – {filtered.length} de <span className="font-medium">{demo.products.length * 71}</span> resultados para{' '}
          <span className="font-semibold" style={{ color: cp }}>"{activeCategory === 'Todos' ? demo.storeName : activeCategory}"</span>
        </p>
        <div className="flex items-center gap-1 text-sm text-gray-600 cursor-pointer">
          Ordenar por <Icon icon="solar:alt-arrow-down-bold" className="text-sm ml-0.5" />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {demo.categories.filter(c => c !== 'Todos').slice(0, 2).map(cat => (
          <span key={cat} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors">
            {cat}
            <Icon icon="solar:close-circle-bold" className="text-sm text-gray-400" />
          </span>
        ))}
      </div>

      {/* Sidebar + Grid */}
      <div className="flex gap-8 items-start">
        <FilterSidebar categories={demo.categories} cp={cp} activeCategory={activeCategory} onSelectCategory={setActiveCategory} />
        <div className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(p => (
              <div key={p.id} className="cursor-pointer" onClick={() => onProduct(p)}>
                <ProductCardCatalog producto={p} slug="" cp={cp} onAddToCart={onAddToCart} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: PRODUCTO DETALLE ────────────────────────────────────────────────────
function ProductoPage({ producto, demo, cp, diseno, onNav, onProduct, onAddToCart }: { producto: DemoProduct; demo: RubroDemo; cp: string; diseno: any; onNav: (p: PreviewPage) => void; onProduct: (p: DemoProduct) => void; onAddToCart: () => void }) {
  const [cantidad, setCantidad] = useState(1);
  const price = Number(producto.precioUnitario || 0);
  const originalPrice = Number(producto.precioOriginal || 0);
  const hasDiscount = !!(originalPrice && originalPrice > price);
  const discountPct = hasDiscount ? Math.round((1 - price / originalPrice) * 100) : 0;
  const starRating = [4, 4.5, 5, 4, 4.5][producto.id % 5];
  const fullStars = Math.floor(starRating);
  const hasHalf = starRating % 1 !== 0;
  const related = demo.products.filter(p => p.id !== producto.id).slice(0, 8);

  return (
    <div className="pb-16">
      <div className="max-w-screen-xl mx-auto px-5 md:px-8 py-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8">
          <button onClick={() => onNav('home')} className="hover:text-gray-700 transition-colors">Inicio</button>
          <Icon icon="solar:alt-arrow-right-linear" width={12} />
          <button onClick={() => onNav('catalogo')} className="hover:text-gray-700 transition-colors">Catálogo</button>
          <Icon icon="solar:alt-arrow-right-linear" width={12} />
          <span className="font-semibold text-gray-700 truncate max-w-[40vw]">{producto.descripcion}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Image */}
          <div>
            <div className="rounded-3xl flex items-center justify-center aspect-square overflow-hidden mb-4" style={{ background: '#F4F6FF' }}>
              <img src={producto.imagenUrl} alt={producto.descripcion} className="w-full h-full object-contain p-10 hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="flex gap-3 justify-center">
              {[producto.imagenUrl, ...demo.products.slice(0, 3).map(p => p.imagenUrl)].slice(0, 4).map((img, i) => (
                <div key={i} className="w-16 h-16 rounded-xl overflow-hidden border-2" style={{ borderColor: i === 0 ? cp : '#e5e7eb' }}>
                  <img src={img} alt="" className="w-full h-full object-contain p-1 bg-gray-50" />
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{demo.storeName}</span>
              {hasDiscount && (
                <span className="text-[10px] font-black text-white px-2 py-0.5 rounded-full" style={{ background: cp }}>-{discountPct}% OFF</span>
              )}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ color: '#22C55E', borderColor: '#22C55E' }}>
                En Stock: {producto.stock}
              </span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-black text-gray-900 leading-tight mb-4">{producto.descripcion}</h1>

            <div className="flex items-center gap-1.5 mb-5">
              {Array.from({ length: 5 }, (_, i) => {
                const n = i + 1;
                return (
                  <Icon key={n} icon={n <= fullStars ? 'solar:star-bold' : hasHalf && n === fullStars + 1 ? 'solar:star-half-bold' : 'solar:star-linear'} className={`text-lg ${n <= fullStars || (hasHalf && n === fullStars + 1) ? 'text-amber-400' : 'text-gray-200'}`} />
                );
              })}
              <span className="text-xs text-gray-400 ml-1">{starRating} · {((producto.id * 23 + 7) % 90) + 3} reseñas</span>
            </div>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-black text-gray-900">S/ {price.toFixed(2)}</span>
              {hasDiscount && <span className="text-lg text-gray-400 line-through">S/ {originalPrice.toFixed(2)}</span>}
            </div>

            <p className="text-sm text-gray-500 leading-relaxed mb-6 border-t border-gray-100 pt-5">
              {demo.heroDesc}
            </p>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-4 py-2.5">
                <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} className="text-gray-500 hover:text-gray-900 font-bold text-lg w-6 h-6 flex items-center justify-center">−</button>
                <span className="font-bold text-gray-900 w-6 text-center">{cantidad}</span>
                <button onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))} className="text-gray-500 hover:text-gray-900 font-bold text-lg w-6 h-6 flex items-center justify-center">+</button>
              </div>
              <button onClick={onAddToCart} className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity" style={{ background: cp }}>
                <Icon icon="solar:cart-large-2-bold" width={18} />
                Agregar al carrito
              </button>
            </div>

            <button className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gray-900 hover:bg-black flex items-center justify-center gap-2 transition-colors mb-6">
              <Icon icon="solar:lightning-bolt-bold" width={16} />
              Comprar ahora
            </button>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { icon: 'solar:truck-bold-duotone', color: cp, title: 'Entrega rápida', sub: 'Coordinada con la tienda' },
                { icon: 'solar:shield-check-bold-duotone', color: '#22C55E', title: 'Compra segura', sub: 'Atención por WhatsApp' },
              ].map(({ icon, color, title, sub }) => (
                <div key={title} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <Icon icon={icon} width={24} style={{ color }} className="flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">{title}</p>
                    <p className="text-[11px] text-gray-500">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-gray-400 space-y-1 border-t border-gray-100 pt-4">
              <p><span className="font-semibold text-gray-600">Categoría:</span> {producto.categoria.nombre}</p>
              <p><span className="font-semibold text-gray-600">Marca:</span> {producto.marca.nombre}</p>
            </div>
          </div>
        </div>

        {/* Descripción rica — demo */}
        <PreviewDescripcion cp={cp} producto={producto} />

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-10 border-t border-gray-100 pt-12">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Productos similares</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map(rp => (
                <ProductCardXtra key={rp.id} producto={rp} slug="preview" diseno={diseno} onAddToCart={onAddToCart} onClick={() => { onProduct(rp); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 py-10 border-t border-gray-100" style={{ background: '#fafafa' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs" style={{ background: cp }}>
              {demo.storeName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-black text-gray-900 text-sm">{demo.storeName}<span style={{ color: cp }}>.</span></p>
              <p className="text-[11px] text-gray-400">{demo.slogan}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} {demo.storeName} · Powered by <strong className="text-gray-600">Falconext</strong></p>
        </div>
      </footer>
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
export default function StorePreviewPage() {
  const [config, setConfig] = useState<PreviewConfig>({});
  const [demo, setDemo] = useState<RubroDemo>(getRubroDemo(''));
  const [page, setPage] = useState<PreviewPage>('home');
  const [selectedProduct, setSelectedProduct] = useState<DemoProduct | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState('Todos');

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl: PreviewConfig = {
        plantillaId: params.get('plantillaId') || undefined,
        colorPrimario: params.get('colorPrimario') || undefined,
        colorSecundario: params.get('colorSecundario') || undefined,
        colorAccento: params.get('colorAccento') || undefined,
        tipografia: params.get('tipografia') || undefined,
        rubroNombre: params.get('rubroNombre') || undefined,
      };
      if (Object.values(fromUrl).some(Boolean)) {
        setConfig(fromUrl);
        setDemo(getRubroDemo(fromUrl.rubroNombre ?? ''));
        setActiveCategory('Todos');
        sessionStorage.setItem('store-preview-config', JSON.stringify(fromUrl));
        return;
      }
      const raw = sessionStorage.getItem('store-preview-config');
      if (raw) {
        const parsed: PreviewConfig = JSON.parse(raw);
        setConfig(parsed);
        setDemo(getRubroDemo(parsed.rubroNombre ?? ''));
        setActiveCategory('Todos');
      }
    } catch { }
  }, []);

  const cp = config.colorPrimario ?? demo.colorDefault ?? '#6A6CFF';
  const cs = config.colorSecundario ?? '#ffffff';
  const ca = config.colorAccento ?? '#FF6B6B';
  const tf = config.tipografia ?? 'Inter';
  const diseno = { colorPrimario: cp, colorSecundario: cs, colorAccento: ca, tipografia: tf };

  const goToProduct = (p: DemoProduct) => {
    setSelectedProduct(p);
    setPage('producto');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPage = (p: PreviewPage) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = () => setCartCount(c => c + 1);

  return (
    <div style={{ fontFamily: `'${tf}', sans-serif`, background: cs, minHeight: '100vh', color: '#111' }}>

      {/* Admin preview bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-2 text-xs font-semibold text-white" style={{ background: '#0d1117' }}>
        <div className="flex items-center gap-2">
          <Icon icon="solar:eye-bold" className="text-sm" />
          <span>MODO PREVIEW</span>
          <span className="opacity-30">·</span>
          <span className="opacity-60">{config.rubroNombre ?? 'Tienda Demo'}</span>
          <span className="opacity-30">·</span>
          <span className="opacity-40">Plantilla: {config.plantillaId ?? 'gadgets'}</span>
          <span className="opacity-30">·</span>
          <span className="px-2 py-0.5 rounded bg-white/10 text-white/80">
            {page === 'home' ? 'Inicio' : page === 'catalogo' ? 'Catálogo' : 'Detalle de Producto'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {page !== 'home' && (
            <button onClick={() => goToPage(page === 'producto' ? 'catalogo' : 'home')} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <Icon icon="solar:alt-arrow-left-bold" />
              Volver
            </button>
          )}
          <button onClick={() => window.close()} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            <Icon icon="solar:close-circle-bold" />
            Cerrar
          </button>
        </div>
      </div>

      <div style={{ paddingTop: 36 }}>
        <PreviewHeader demo={demo} cp={cp} cartCount={cartCount} currentPage={page} onNav={goToPage} activeCategory={activeCategory} onSelectCategory={setActiveCategory} />

        {page === 'home' && (
          <HomePage demo={demo} cp={cp} diseno={diseno} onNav={goToPage} onProduct={goToProduct} onAddToCart={addToCart} />
        )}
        {page === 'catalogo' && (
          <CatalogoPage demo={demo} cp={cp} onProduct={goToProduct} onAddToCart={addToCart} />
        )}
        {page === 'producto' && selectedProduct && (
          <ProductoPage producto={selectedProduct} demo={demo} cp={cp} diseno={diseno} onNav={goToPage} onProduct={goToProduct} onAddToCart={addToCart} />
        )}

        {/* Footer on home/catalogo pages */}
        {page !== 'producto' && (
          <footer className="py-10 border-t border-gray-100" style={{ background: '#fafafa' }}>
            <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs" style={{ background: cp }}>
                  {demo.storeName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-gray-900 text-sm">{demo.storeName}<span style={{ color: cp }}>.</span></p>
                  <p className="text-[11px] text-gray-400">{demo.slogan}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">© {new Date().getFullYear()} {demo.storeName} · Powered by <strong className="text-gray-600">Falconext</strong></p>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
