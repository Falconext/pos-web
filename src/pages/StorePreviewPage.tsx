import { useState, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import ProductCardXtra from '@/components/tienda/ProductCardXtra';
import ProductCardCatalog from '@/components/tienda/ProductCardCatalog';
import AutopartesHeader from '@/components/tienda/AutopartesHeader';
import AutopartesHero from '@/components/tienda/AutopartesHero';
import AutopartesFeaturedCategories from '@/components/tienda/AutopartesFeaturedCategories';
import AutopartesPromoBanners from '@/components/tienda/AutopartesPromoBanners';
import ProductCardAutopartes from '@/components/tienda/ProductCardAutopartes';
import ProductCardGromuse from '@/components/tienda/ProductCardGromuse';
import AutopartesTrendingProducts from '@/components/tienda/AutopartesTrendingProducts';
import AutopartesDealsOfTheWeek from '@/components/tienda/AutopartesDealsOfTheWeek';
import AutopartesBrands from '@/components/tienda/AutopartesBrands';
import AutopartesTopSelling from '@/components/tienda/AutopartesTopSelling';
import AutopartesFooter from '@/components/tienda/AutopartesFooter';
import AutopartesCatalog from '@/components/tienda/AutopartesCatalog';
import AutopartesCartModal from '@/components/tienda/AutopartesCartModal';
import ModaCartModal from '@/components/tienda/ModaCartModal';
import UrbanoCartModal from '@/components/tienda/UrbanoCartModal';
import ModaCheckoutPage from '@/templates/moda/ModaCheckoutPage';
import UrbanoCheckoutPage from '@/templates/urbano/UrbanoCheckoutPage';
import { UrbanoProductoPreviewPage } from '@/pages/tienda/UrbanoProductoPreviewPage';
import UrbanoCatalogoPage from '@/templates/urbano/UrbanoCatalogoPage';
import AutopartesCheckout from '@/pages/tienda/AutopartesCheckout';
import ModaHeader from '@/components/tienda/ModaHeader';
import ModaHero from '@/components/tienda/ModaHero';
import ModaBestSelling from '@/components/tienda/ModaBestSelling';
import ModaHomeSections from '@/components/tienda/ModaHomeSections';
import ModaFooter from '@/components/tienda/ModaFooter';
import { getRubroDemo, type DemoProduct, type RubroDemo } from '@/data/rubroDemo';

interface PreviewConfig {
  plantillaId?: string;
  colorPrimario?: string;
  colorSecundario?: string;
  colorAccento?: string;
  tipografia?: string;
  rubroNombre?: string;
}

type PreviewPage = 'home' | 'catalogo' | 'producto' | 'checkout';

const URBANO_PREVIEW_ASSETS = [
  '/assets/templates/urbano/coleccion1.png',
  '/assets/templates/urbano/coleccion2.png',
  '/assets/templates/urbano/coleccion3.png',
  '/assets/templates/urbano/coleccion4.png',
  '/assets/templates/urbano/coleccion5.png',
  '/assets/templates/urbano/coleccion6.png',
  '/assets/templates/urbano/coleccion7.png',
  '/assets/templates/urbano/coleccion8.png',
  '/assets/templates/urbano/coleccion9.png',
  '/assets/templates/urbano/coleccion10.png',
];

const MODA_CATALOG_PREVIEW = [
  ['Camisa corset con lazo', 'PLM', 66.8, 76.9, 'https://images.unsplash.com/photo-1507680434567-5739c80be1ac?auto=format&fit=crop&q=90&w=900', 2],
  ['Conjunto saco y pantalon arena', 'ARGUE CULTURE', 81.8, 99.8, 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&q=90&w=900', 4],
  ['Pantalon drapeado grafito', 'BLAEXIT', 58.9, 67.9, 'https://images.unsplash.com/photo-1506629905607-d405b7a30db9?auto=format&fit=crop&q=90&w=900', 3],
  ['Traje negro oversize wide-leg', 'ARGUE CULTURE', 91.9, 99.9, 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=90&w=900', 2],
  ['Camisa blanca de lino con lazo', 'ORO', 50.9, 50.9, 'https://images.unsplash.com/photo-1542327897-d73f4005b533?auto=format&fit=crop&q=90&w=900', 2],
  ['Camisa floral pastel boton-up', 'PLM', 72.9, 83.9, 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=90&w=900', 3],
  ['Pantalon cargo denim fruncido', 'GRACE RUB', 64.9, 74.9, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=90&w=900', 2],
  ['Pantalon acid wash stacked', 'ASTT STUDIO', 82.9, 96.9, 'https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&q=90&w=900', 1],
  ['Traje wide-leg con cuello scarf', 'ARGUE CULTURE', 73.8, 89.9, 'https://images.unsplash.com/photo-1520975682031-a9c3f8e4f69a?auto=format&fit=crop&q=90&w=900', 6],
  ['Loafers negros de cuero patente', 'JCAESAR', 149.6, 194.48, 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&q=90&w=900', 1],
  ['Camisa poplin boxy oversize', 'CLP', 95.9, 109.9, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=90&w=900', 3],
  ['Casaca negra hooded oversize', 'GY', 44.9, 69.9, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=90&w=900', 3],
] as const;

const MODA_FILTER_GROUPS = [
  { label: 'Género', key: 'genero', options: ['Hombre', 'Mujer', 'Unisex'] },
  { label: 'Color', key: 'color', options: ['Negro', 'Blanco', 'Arena', 'Azul', 'Denim'] },
  { label: 'Marca', key: 'marca', options: ['PLM', 'ARGUE CULTURE', 'BLAEXIT', 'ORO', 'JCAESAR', 'GY'] },
  { label: 'Tipo de producto', key: 'tipo', options: ['Camisas', 'Pantalones', 'Casacas', 'Calzado'] },
  { label: 'Precio', key: 'precio', options: ['Hasta S/ 70', 'S/ 70 - S/ 100', 'Más de S/ 100'] },
  { label: 'Ocasión', key: 'ocasion', options: ['Diario', 'Oficina', 'Noche', 'Fin de semana'] },
  { label: 'Estilo', key: 'estilo', options: ['Minimal', 'Urbano', 'Elegante', 'Street'] },
] as const;

function modaPreviewProducts(products: DemoProduct[]) {
  return MODA_CATALOG_PREVIEW.map(([descripcion, marca, precioUnitario, precioOriginal, imagenUrl, coloresDisponibles], index) => ({
    ...(products[index] || {}),
    id: products[index]?.id || `moda-preview-catalog-${index + 1}`,
    descripcion,
    marca,
    precioUnitario,
    precioOriginal,
    imagenUrl,
    coloresDisponibles,
    genero: ['Hombre', 'Hombre', 'Unisex', 'Hombre', 'Hombre', 'Mujer', 'Unisex', 'Hombre', 'Mujer', 'Unisex', 'Hombre', 'Mujer'][index] || 'Unisex',
    color: ['Blanco', 'Arena', 'Negro', 'Negro', 'Blanco', 'Azul', 'Denim', 'Negro', 'Negro', 'Negro', 'Blanco', 'Negro'][index] || 'Negro',
    tipo: ['Camisas', 'Pantalones', 'Pantalones', 'Casacas', 'Camisas', 'Camisas', 'Pantalones', 'Pantalones', 'Casacas', 'Calzado', 'Camisas', 'Casacas'][index] || 'Camisas',
    ocasion: ['Noche', 'Oficina', 'Diario', 'Noche', 'Diario', 'Fin de semana', 'Diario', 'Oficina', 'Noche', 'Diario', 'Fin de semana', 'Diario'][index] || 'Diario',
    estilo: ['Elegante', 'Minimal', 'Urbano', 'Elegante', 'Minimal', 'Street', 'Urbano', 'Street', 'Elegante', 'Minimal', 'Urbano', 'Street'][index] || 'Urbano',
  }));
}

function modaFilterMatches(product: any, filters: Record<string, string>) {
  return Object.entries(filters).every(([key, value]) => {
    if (!value) return true;
    if (key === 'precio') {
      const price = Number(product.precioUnitario || 0);
      if (value === 'Hasta S/ 70') return price <= 70;
      if (value === 'S/ 70 - S/ 100') return price > 70 && price <= 100;
      if (value === 'Más de S/ 100') return price > 100;
    }
    return String(product[key] || '').toLowerCase() === value.toLowerCase();
  });
}

function sortModaProducts(products: any[], sort: string) {
  const list = [...products];
  if (sort === 'precio-asc') return list.sort((a, b) => Number(a.precioUnitario || 0) - Number(b.precioUnitario || 0));
  if (sort === 'precio-desc') return list.sort((a, b) => Number(b.precioUnitario || 0) - Number(a.precioUnitario || 0));
  if (sort === 'nombre') return list.sort((a, b) => String(a.descripcion || '').localeCompare(String(b.descripcion || '')));
  return list;
}

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
              diseno.plantillaId === 'autopartes' ? (
                <ProductCardGromuse key={`${p.id}-r${i}`} producto={p} slug="preview" diseno={diseno} onAddToCart={onAddToCart} onClick={() => onProduct(p)} />
              ) : (
                <ProductCardXtra key={`${p.id}-r${i}`} producto={p} slug="preview" diseno={diseno} onAddToCart={onAddToCart} onClick={() => onProduct(p)} />
              )
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

// ─── PAGE: MODA PRODUCTO DETALLE ──────────────────────────────────────────────
function ModaProductoPreviewPage({ producto, demo, cp, diseno, onNav, onProduct, onAddToCart }: { producto: DemoProduct; demo: RubroDemo; cp: string; diseno: any; onNav: (p: PreviewPage) => void; onProduct: (p: DemoProduct) => void; onAddToCart: () => void }) {
  const [cantidad, setCantidad] = useState(1);
  const [selectedImage, setSelectedImage] = useState(producto.imagenUrl);
  const price = Number(producto.precioUnitario || 0);
  const originalPrice = Number(producto.precioOriginal || 0);
  const hasDiscount = !!(originalPrice && originalPrice > price);
  const discountPct = hasDiscount ? Math.round((1 - price / originalPrice) * 100) : 0;
  const starRating = [4, 4.5, 5, 4, 4.5][producto.id % 5];
  const fullStars = Math.floor(starRating);
  const hasHalf = starRating % 1 !== 0;
  const related = demo.products.filter(p => p.id !== producto.id).slice(0, 4);
  const demoImages = [producto.imagenUrl, ...demo.products.slice(0, 3).map(p => p.imagenUrl)];
  const demoColors = ['#B58863', '#1A1A1A', '#C0392B', '#3498DB'];
  const demoSizes = ['XS', 'S', 'M', 'L', 'XL'];
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState(2);

  return (
    <div className="pb-16 bg-[#FAF9F6]">
      <div className="w-full max-w-7xl mx-auto px-4 xl:px-8 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8">
          <button onClick={() => onNav('home')} className="hover:text-gray-700 transition-colors font-medium">Inicio</button>
          <Icon icon="solar:alt-arrow-right-linear" width={12} />
          <button onClick={() => onNav('catalogo')} className="hover:text-gray-700 transition-colors font-medium">Catálogo</button>
          <Icon icon="solar:alt-arrow-right-linear" width={12} />
          <span className="font-semibold text-gray-700 truncate max-w-[160px]">{producto.descripcion}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

          {/* Images */}
          <div className="flex flex-col gap-4">
            <div className="relative overflow-hidden rounded-3xl bg-[#F5F0EB] aspect-[4/5]">
              <img src={selectedImage} alt={producto.descripcion} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              {hasDiscount && (
                <span className="absolute top-4 left-4 text-[10px] font-black text-white px-3 py-1.5 rounded-full tracking-wider" style={{ backgroundColor: '#1A1A1A' }}>
                  -{discountPct}% OFF
                </span>
              )}
              <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center hover:scale-110 transition-transform">
                <Icon icon="solar:heart-linear" width={20} className="text-gray-600" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {demoImages.slice(0, 4).map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(img)}
                  className="flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all"
                  style={{ borderColor: selectedImage === img ? '#1A1A1A' : '#E5E7EB' }}>
                  <img src={img} alt="" className="w-full h-full object-cover bg-[#F5F0EB]" />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col pt-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">{demo.storeName}</p>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight mb-3">{producto.descripcion}</h1>

            {/* Stars */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => {
                  const n = i + 1;
                  const icon = n <= fullStars ? 'solar:star-bold' : hasHalf && n === fullStars + 1 ? 'solar:star-half-bold' : 'solar:star-outline';
                  const color = n <= fullStars || (hasHalf && n === fullStars + 1) ? '#1A1A1A' : '#D1D5DB';
                  return <Icon key={i} icon={icon} width={14} style={{ color }} />;
                })}
              </div>
              <span className="text-xs text-gray-500 font-medium">{starRating.toFixed(1)} ({((producto.id * 23 + 7) % 90) + 3} reseñas)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-3xl font-black text-gray-900">S/ {price.toFixed(2)}</span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-gray-400 line-through font-medium">S/ {originalPrice.toFixed(2)}</span>
                  <span className="text-xs font-black text-white px-2 py-0.5 rounded-full bg-gray-900">-{discountPct}%</span>
                </>
              )}
            </div>

            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full mb-5 w-fit">
              <Icon icon="solar:check-circle-bold" width={14} /> En Stock ({producto.stock})
            </span>

            {/* Color selector */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Color disponible</p>
                <p className="text-xs font-semibold text-gray-700">{['Camel', 'Negro', 'Rojo', 'Azul'][selectedColor]}</p>
              </div>
              <div className="flex gap-2.5">
                {demoColors.map((color, i) => (
                  <button key={i} onClick={() => setSelectedColor(i)}
                    className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: selectedColor === i ? '#1A1A1A' : 'transparent',
                      boxShadow: selectedColor === i ? '0 0 0 2px #fff, 0 0 0 4px #1A1A1A' : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Size selector */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Talla</p>
                <button className="text-xs font-semibold text-gray-500 underline underline-offset-2">Ver guía de tallas</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {demoSizes.map((size, i) => (
                  <button key={i} onClick={() => setSelectedSize(i)}
                    className="min-w-[2.75rem] h-10 px-3 rounded-xl border-2 text-sm font-bold transition-all"
                    style={{
                      borderColor: selectedSize === i ? '#1A1A1A' : '#E5E7EB',
                      backgroundColor: selectedSize === i ? '#1A1A1A' : '#fff',
                      color: selectedSize === i ? '#fff' : '#374151',
                    }}>
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Qty + Bag + Favorite */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center bg-gray-100 rounded-xl px-1 py-1 gap-1 border border-gray-200">
                <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white hover:text-gray-900 transition-all font-bold text-lg">−</button>
                <span className="w-9 text-center font-black text-gray-900 text-sm">{cantidad}</span>
                <button onClick={() => setCantidad(cantidad + 1)} className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white hover:text-gray-900 transition-all font-bold text-lg">+</button>
              </div>
              <button className="w-12 h-12 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-gray-900 transition-all">
                <Icon icon="solar:heart-linear" width={20} className="text-gray-600" />
              </button>
              <button onClick={onAddToCart} className="flex-1 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gray-900 text-white hover:opacity-90 active:scale-95 transition-all">
                <Icon icon="solar:bag-3-bold" width={18} /> Añadir a la bolsa
              </button>
            </div>

            {/* Buy now */}
            <button className="w-full h-12 rounded-xl border-2 border-gray-900 text-gray-900 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-900 hover:text-white transition-all mb-6 active:scale-95">
              <Icon icon="solar:lightning-bolt-bold" width={16} /> Comprar ahora
            </button>

            {/* Info cards */}
            <div className="space-y-2 mb-5">
              {[
                { icon: 'solar:delivery-bold-duotone', title: 'Entrega rápida', desc: 'Coordinada directamente con la tienda' },
                { icon: 'solar:refresh-bold-duotone', title: 'Cambios y devoluciones', desc: 'Devoluciones fáciles dentro de 7 días' },
                { icon: 'solar:shield-check-bold-duotone', title: 'Pago seguro', desc: 'Atención y soporte vía WhatsApp' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-center gap-3 bg-white rounded-2xl p-3.5 border border-gray-100">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <Icon icon={icon} width={20} className="text-gray-700" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{title}</p>
                    <p className="text-[11px] text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-gray-400 border-t border-gray-100 pt-4">
              <p><span className="font-semibold text-gray-500">Categoría:</span> {typeof producto.categoria === 'object' ? (producto.categoria as any)?.nombre : producto.categoria}</p>
              <p className="mt-1"><span className="font-semibold text-gray-500">Marca:</span> {typeof producto.marca === 'object' ? (producto.marca as any)?.nombre : producto.marca}</p>
            </div>
          </div>
        </div>

        {/* You may also like */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-black text-gray-900 mb-2">También te puede gustar</h2>
            <p className="text-sm text-gray-400 mb-8">Estilos curados, piezas premium y tendencias de moda para expresar tu estilo único.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {related.map(p => {
                const rPrice = Number(p.precioUnitario || 0);
                const rOrig = Number(p.precioOriginal || 0);
                const rDisc = rOrig > 0 && rOrig > rPrice;
                return (
                  <button key={p.id} onClick={() => { onProduct(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-left group w-full">
                    <div className="relative overflow-hidden rounded-2xl bg-[#F5F0EB] aspect-[3/4] mb-3">
                      <img src={p.imagenUrl} alt={p.descripcion} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
                      {rDisc && (
                        <span className="absolute top-3 left-3 text-[10px] font-black text-white px-2.5 py-1 rounded-full bg-gray-900">
                          -{Math.round((1 - rPrice / rOrig) * 100)}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1 truncate">{typeof p.categoria === 'object' ? (p.categoria as any)?.nombre : p.categoria}</p>
                    <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 mb-2">{p.descripcion}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-gray-900">S/ {rPrice.toFixed(2)}</span>
                      {rDisc && <span className="text-xs text-gray-400 line-through">S/ {rOrig.toFixed(2)}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}
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
  const [carrito, setCarrito] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [showFilters, setShowFilters] = useState(false);
  const [modaOpenFilter, setModaOpenFilter] = useState<string | null>('genero');
  const [modaFilters, setModaFilters] = useState<Record<string, string>>({});
  const [modaSort, setModaSort] = useState('relevancia');

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

  useEffect(() => {
    const handleNav = (e: Event) => {
      const targetPage = (e as CustomEvent).detail;
      setPage(targetPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('preview-nav', handleNav);
    return () => window.removeEventListener('preview-nav', handleNav);
  }, []);

  const cp = config.colorPrimario ?? demo.colorDefault ?? '#6A6CFF';
  const cs = config.colorSecundario ?? '#ffffff';
  const ca = config.colorAccento ?? '#FF6B6B';
  const tf = config.tipografia ?? 'Poppins';
  const previewFont = config.plantillaId === 'moda' ? 'Poppins' : tf;
  const urbanoPreviewProducts = demo.products.map((product, index) => ({
    ...product,
    imagenUrl: URBANO_PREVIEW_ASSETS[index % URBANO_PREVIEW_ASSETS.length],
  }));
  const urbanoPreviewCategories = demo.categories
    .filter((category) => category !== 'Todos')
    .map((category, index) => ({
      nombre: category,
      imagenUrl: URBANO_PREVIEW_ASSETS[(index + 4) % URBANO_PREVIEW_ASSETS.length],
    }));
  const modaCatalogProducts = useMemo(() => modaPreviewProducts(demo.products), [demo.products]);
  const modaVisibleProducts = useMemo(() => {
    return sortModaProducts(modaCatalogProducts.filter((product) => modaFilterMatches(product, modaFilters)), modaSort);
  }, [modaCatalogProducts, modaFilters, modaSort]);
  const toggleModaFilter = (key: string, value: string) => {
    setModaFilters((current) => ({
      ...current,
      [key]: current[key] === value ? '' : value,
    }));
  };
  const diseno = {
    ...config,
    colorPrimario: cp,
    colorSecundario: cs,
    colorAccento: ca,
    tipografia: tf,
    ...(config.plantillaId === 'urbano'
      ? {
        urbanoHeroImg: '/assets/templates/urbano/banner.png',
        urbanoBottomBannerImg: '/assets/templates/urbano/wear.png',
        urbanoShopTheLookImg: '/assets/templates/urbano/shoplook.png',
        urbanoFeatureModelImg: '/assets/templates/urbano/jacket.png',
        urbanoGallery1: '/assets/templates/urbano/coleccion2.png',
        urbanoGallery2: '/assets/templates/urbano/coleccion3.png',
        urbanoGallery3: '/assets/templates/urbano/coleccion4.png',
        urbanoGallery4: '/assets/templates/urbano/coleccion5.png',
        urbanoGallery5: '/assets/templates/urbano/coleccion6.png',
      }
      : {}),
  };

  const goToProduct = (p: DemoProduct) => {
    setSelectedProduct(p);
    setPage('producto');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPage = (p: PreviewPage) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (p: DemoProduct) => {
    setCarrito(prev => {
      const existing = prev.find(item => item.id === p.id);
      if (existing) {
        return prev.map(item => item.id === p.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, { ...p, cantidad: 1 }];
    });
    setIsCartOpen(true);
  };

  const actualizarCantidad = (id: number | string, cantidad: number) => {
    if (cantidad <= 0) {
      setCarrito(prev => prev.filter(item => item.id !== id));
    } else {
      setCarrito(prev => prev.map(item => item.id === id ? { ...item, cantidad } : item));
    }
  };

  return (
    <div style={{ fontFamily: `'${previewFont}', sans-serif`, background: cs, minHeight: '100vh', color: '#111' }}>

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
            {page === 'home' ? 'Inicio' : page === 'catalogo' ? 'Catálogo' : page === 'checkout' ? 'Checkout' : 'Detalle de Producto'}
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
        {config.plantillaId === 'autopartes' ? (
          page !== 'checkout' ? (
            <AutopartesHeader
              tienda={{ nombre: demo.storeName, logo: '' }}
              slug="preview"
              cp={cp}
              carritoSize={carrito.reduce((sum, item) => sum + item.cantidad, 0)}
              onOpenCart={() => setIsCartOpen(true)}
              searchQuery=""
              setSearchQuery={() => { }}
              onSearchSubmit={(e, value) => { e.preventDefault(); goToPage('catalogo'); }}
              allCategories={demo.categories.filter(c => c !== 'Todos')}
            />
          ) : null
        ) : config.plantillaId === 'moda' ? (
          page !== 'checkout' ? (
            <ModaHeader
              tienda={{ nombre: demo.storeName, logo: '' }}
              slug="preview"
              cp={cp}
              carritoSize={carrito.reduce((sum, item) => sum + item.cantidad, 0)}
              onOpenCart={() => setIsCartOpen(true)}
              searchQuery=""
              setSearchQuery={() => { }}
              onSearchSubmit={(e) => { e.preventDefault(); goToPage('catalogo'); }}
              allCategories={demo.categories.filter(c => c !== 'Todos')}
            />
          ) : null
        ) : config.plantillaId === 'urbano' ? (
          null // Urbano handles its own headers
        ) : (
          <PreviewHeader demo={demo} cp={cp} cartCount={carrito.reduce((sum, item) => sum + item.cantidad, 0)} currentPage={page} onNav={goToPage} activeCategory={activeCategory} onSelectCategory={setActiveCategory} />
        )}

        {isCartOpen && (
          config.plantillaId === 'moda' ? (
            <ModaCartModal
              isOpen={isCartOpen}
              carrito={carrito}
              tienda={{ nombre: demo.storeName }}
              setCarrito={setCarrito}
              onClose={() => setIsCartOpen(false)}
              actualizarCantidad={actualizarCantidad}
              onCheckout={() => { setIsCartOpen(false); goToPage('checkout'); }}
            />
          ) : config.plantillaId === 'urbano' ? (
            <UrbanoCartModal
              isOpen={isCartOpen}
              carrito={carrito}
              tienda={{ nombre: demo.storeName }}
              setCarrito={setCarrito}
              onClose={() => setIsCartOpen(false)}
              actualizarCantidad={actualizarCantidad}
              onCheckout={() => { setIsCartOpen(false); goToPage('checkout'); }}
            />
          ) : (
            <AutopartesCartModal
              isOpen={isCartOpen}
              cp={cp}
              carrito={carrito}
              setCarrito={setCarrito}
              onClose={() => setIsCartOpen(false)}
              actualizarCantidad={actualizarCantidad}
              onCheckout={() => { setIsCartOpen(false); goToPage('checkout'); }}
            />
          )
        )}

        {page === 'home' && config.plantillaId === 'autopartes' ? (
          <div className="bg-[#FAF5F5]">
            <div className="w-full max-w-7xl mx-auto px-4 xl:px-8 py-8 md:py-10">
              <AutopartesHero cp={cp} slug="preview" diseno={diseno} productos={demo.products.slice(0, 3)} />
              <AutopartesFeaturedCategories cp={cp} slug="preview" />
              <div className="mt-8 mb-16">
                <AutopartesPromoBanners cp={cp} slug="preview" />
              </div>
            </div>
            <section className="w-full max-w-7xl mx-auto px-4 xl:px-8 py-16">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex gap-[3px]">
                      <div className="w-4 h-0.5 transform -skew-x-[30deg]" style={{ backgroundColor: cp }}></div>
                      <div className="w-4 h-0.5 transform -skew-x-[30deg]" style={{ backgroundColor: cp }}></div>
                    </div>
                    <span className="text-sm font-bold" style={{ color: cp }}>Producto Destacado</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                    Productos por Categoría
                  </h2>
                </div>

                <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
                  <div className="flex flex-col flex-1 min-w-[160px]">
                    <span className="text-[10px] text-gray-500 font-bold mb-1 ml-1">Categoría Principal</span>
                    <div className="bg-white border border-gray-200 rounded px-3 py-2 flex items-center justify-between cursor-pointer hover:border-gray-300 transition-colors">
                      <span className="text-xs font-bold text-gray-700">Motor y Rendimiento</span>
                      <Icon icon="solar:alt-arrow-down-linear" className="text-gray-400" />
                    </div>
                  </div>
                  <div className="flex flex-col flex-1 min-w-[140px]">
                    <span className="text-[10px] text-gray-500 font-bold mb-1 ml-1">Sub Categoría</span>
                    <div className="bg-white border border-gray-200 rounded px-3 py-2 flex items-center justify-between cursor-pointer hover:border-gray-300 transition-colors">
                      <span className="text-xs font-bold text-gray-700">Todas las Piezas</span>
                      <Icon icon="solar:alt-arrow-down-linear" className="text-gray-400" />
                    </div>
                  </div>
                  <div className="flex flex-col justify-end mt-2 md:mt-0 md:h-[50px] w-full md:w-auto">
                    <button className="h-[34px] bg-[#1A1A1A] text-white px-5 rounded text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-black transition-colors md:mt-auto">
                      <Icon icon="solar:magnifer-linear" />
                      Buscar
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {demo.products.slice(0, 8).map(product => (
                  <ProductCardAutopartes
                    key={product.id}
                    producto={product}
                    slug="preview"
                    diseno={diseno}
                    onAddToCart={() => {
                      addToCart(product);
                    }}
                  />
                ))}
              </div>
            </section>

            <section className="w-full max-w-7xl mx-auto px-4 xl:px-8 pb-16">
              <AutopartesTrendingProducts
                cp={cp}
                slug="preview"
                productos={[...demo.products].reverse()}
                diseno={diseno}
                onAddToCart={(p) => {
                  addToCart(p);
                }}
              />
            </section>

            <AutopartesDealsOfTheWeek cp={cp} slug="preview" productos={demo.products} />
            <AutopartesBrands cp={cp} slug="preview" />

            <div className="bg-[#FAF5F5]">
              <AutopartesTopSelling cp={cp} />
            </div>
          </div>
        ) : page === 'home' && config.plantillaId === 'moda' ? (
          <div className="w-full bg-[#FAF9F6] text-[14px]">
            <ModaHero cp={cp} slug="preview" diseno={diseno} productos={demo.products.slice(0, 3)} />
            <ModaBestSelling slug="preview" cp={cp} productos={demo.products} genero="hombre" titulo="Más vendidos hombre" />
            <ModaBestSelling slug="preview" cp={cp} productos={demo.products} genero="mujer" titulo="Más vendidos mujer" offset={10} />
            <ModaHomeSections slug="preview" productos={demo.products} />
          </div>
        ) : page === 'home' && config.plantillaId === 'urbano' ? (
          <UrbanoCatalogoPage
            slug="preview"
            tienda={{ nombre: demo.storeName, slogan: demo.slogan, diseno }}
            productos={urbanoPreviewProducts}
            allCategories={urbanoPreviewCategories}
            cp={cp}
            carritoSize={carrito.length}
            onOpenCart={() => { }}
            onAddToCart={(p) => addToCart(p)}
            onProduct={(p) => goToProduct(p)}
            searchQuery=""
            setSearchQuery={() => { }}
            onSearchSubmit={() => { }}
          />
        ) : page === 'home' ? (
          <HomePage demo={demo} cp={cp} diseno={diseno} onNav={goToPage} onProduct={goToProduct} onAddToCart={() => addToCart(demo.products[0])} />
        ) : null}
        {page === 'catalogo' && (
          config.plantillaId === 'autopartes' ? (
            <AutopartesCatalog demo={demo} cp={cp} onProduct={goToProduct} onAddToCart={addToCart} />
          ) : config.plantillaId === 'moda' ? (
            <div className="w-full min-h-screen bg-white pb-16 text-black">
              <div className="mx-auto max-w-[1720px] px-5 pb-10 pt-6 md:px-10 lg:px-16">
                <nav className="mb-12 text-[11px] text-neutral-500">
                  <button onClick={() => goToPage('home')} className="hover:text-black">Inicio</button>
                  <span className="mx-2">/</span>
                  <span>Más vendidos hombre</span>
                </nav>

                <header className="mx-auto mb-14 max-w-[760px] text-center">
                  <h1 className="text-[36px] font-medium lowercase leading-none tracking-[-0.055em] md:text-[54px]">
                    más vendidos hombre
                  </h1>
                  <p className="mt-8 text-[14px] leading-6 text-black">
                    Explora nuestras prendas favoritas: camisas destacadas, pantalones wide-leg, casacas y esenciales urbanos para todos los días.
                  </p>
                </header>

                <div className="grid gap-8 lg:grid-cols-[255px_1fr] lg:gap-10">
                  <aside className="hidden lg:block">
                    <div className="sticky top-[180px]">
                      <h2 className="mb-5 text-[24px] font-normal lowercase tracking-[-0.04em]">filtros</h2>
                      <div className="border-t border-neutral-300">
                        {MODA_FILTER_GROUPS.map((filter) => (
                          <div key={filter.key} className="border-b border-neutral-300">
                            <button
                              type="button"
                              onClick={() => setModaOpenFilter(modaOpenFilter === filter.key ? null : filter.key)}
                              className="flex h-[64px] w-full items-center justify-between text-left text-[13px] font-semibold"
                            >
                              {filter.label}
                              <Icon icon={modaOpenFilter === filter.key ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'} width={16} />
                            </button>
                            {modaOpenFilter === filter.key && (
                              <div className="space-y-3 pb-5 text-[13px]">
                                {filter.options.map((option) => (
                                  <button
                                    key={option}
                                    type="button"
                                    onClick={() => toggleModaFilter(filter.key, option)}
                                    className={`block text-left ${modaFilters[filter.key] === option ? 'font-black text-black' : 'text-neutral-600 hover:text-black'}`}
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {Object.values(modaFilters).some(Boolean) && (
                        <button onClick={() => setModaFilters({})} className="mt-6 text-[12px] font-semibold underline underline-offset-4">
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  </aside>

                  <section className="min-w-0">
                    <div className="mb-9 flex items-center justify-between gap-4">
                      <button
                        onClick={() => setShowFilters(true)}
                        className="inline-flex items-center gap-2 border border-neutral-300 px-4 py-2 text-[13px] font-medium lg:hidden"
                      >
                        filtros
                        <Icon icon="solar:filter-linear" width={16} />
                      </button>
                      <p className="hidden text-[12px] text-black lg:block">{modaVisibleProducts.length} productos</p>
                      <label className="ml-auto inline-flex items-center gap-2 text-[12px]">
                        <span className="text-neutral-500">Ordenar por</span>
                        <select value={modaSort} onChange={(event) => setModaSort(event.target.value)} className="bg-transparent pr-5 text-[12px] font-medium outline-none">
                          <option value="relevancia">Más relevante</option>
                          <option value="precio-asc">Precio menor a mayor</option>
                          <option value="precio-desc">Precio mayor a menor</option>
                          <option value="nombre">Nombre A-Z</option>
                        </select>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-x-7 gap-y-16 md:grid-cols-3 xl:grid-cols-4 xl:gap-x-9 xl:gap-y-20">
                      {modaVisibleProducts.map((product, index) => {
                        const price = Number(product.precioUnitario || 0);
                        const original = Number(product.precioOriginal || product.precioUnitario || 0);
                        const saving = original > price ? original - price : [10.1, 18, 9, 8, 16.1, 44.88, 14, 25][index % 8];
                        return (
                          <article key={product.id} className="group text-center">
                            <button type="button" onClick={() => goToProduct(product)} className="relative block w-full text-left">
                              <span className="absolute left-2 top-0 z-10 rounded-[2px] bg-black px-2 py-1 text-[11px] font-black uppercase leading-none tracking-[0.06em] text-white">
                                AHORRA S/ {saving.toFixed(2)}
                              </span>
                              <div className="aspect-[0.82] w-full overflow-hidden bg-white">
                                <img
                                  src={product.imagenUrl}
                                  alt={product.descripcion}
                                  className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.025]"
                                />
                              </div>
                            </button>
                            <button type="button" onClick={() => goToProduct(product)} className="mt-9 block w-full text-center">
                              <p className="text-[10px] font-black uppercase tracking-[0.22em]">{product.marca || 'KREZKA'}</p>
                              <h3 className="mx-auto mt-3 line-clamp-1 max-w-[270px] text-[14px] font-normal leading-6 text-black">
                                {product.descripcion}
                              </h3>
                              <div className="mt-1 flex items-center justify-center gap-2 text-[14px] font-normal">
                                <span>S/ {price.toFixed(2)}</span>
                                {original > price && <span className="text-neutral-400 line-through">S/ {original.toFixed(2)}</span>}
                              </div>
                              <p className="mt-4 text-[13px] text-neutral-500">
                                {product.coloresDisponibles || 1} {(product.coloresDisponibles || 1) === 1 ? 'color disponible' : 'colores disponibles'}
                              </p>
                            </button>
                          </article>
                        );
                      })}
                    </div>
                    {modaVisibleProducts.length === 0 && (
                      <div className="py-20 text-center">
                        <p className="text-[18px] font-semibold">No hay productos con esos filtros.</p>
                        <button onClick={() => setModaFilters({})} className="mt-4 h-11 bg-black px-8 text-[13px] font-semibold text-white">
                          Limpiar filtros
                        </button>
                      </div>
                    )}
                  </section>
                </div>

                {showFilters && (
                  <div className="fixed inset-0 z-[200] lg:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
                    <div className="absolute bottom-0 left-0 right-0 bg-white p-5 shadow-2xl">
                      <div className="mb-5 flex items-center justify-between">
                        <span className="text-[24px] font-medium lowercase">filtros</span>
                        <button onClick={() => setShowFilters(false)}>
                          <Icon icon="solar:close-circle-linear" width={28} />
                        </button>
                      </div>
                      <div className="border-t border-neutral-300">
                        {MODA_FILTER_GROUPS.map((filter) => (
                          <div key={filter.key} className="border-b border-neutral-300">
                            <button
                              type="button"
                              onClick={() => setModaOpenFilter(modaOpenFilter === filter.key ? null : filter.key)}
                              className="flex h-[58px] w-full items-center justify-between text-[13px] font-semibold"
                            >
                              {filter.label}
                              <Icon icon={modaOpenFilter === filter.key ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'} width={16} />
                            </button>
                            {modaOpenFilter === filter.key && (
                              <div className="space-y-3 pb-5">
                                {filter.options.map((option) => (
                                  <button
                                    key={option}
                                    type="button"
                                    onClick={() => toggleModaFilter(filter.key, option)}
                                    className={`block text-left text-[13px] ${modaFilters[filter.key] === option ? 'font-black text-black' : 'text-neutral-600'}`}
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setShowFilters(false)} className="mt-6 h-11 w-full bg-black text-[13px] font-semibold text-white">
                        Ver {modaVisibleProducts.length} productos
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <CatalogoPage demo={demo} cp={cp} onProduct={goToProduct} onAddToCart={() => { }} />
          )
        )}

        {page === 'producto' && selectedProduct && (
          config.plantillaId === 'urbano' ? (
            <UrbanoProductoPreviewPage producto={selectedProduct} demo={demo} cp={cp} diseno={diseno} onNav={goToPage} onProduct={goToProduct} onAddToCart={() => addToCart(selectedProduct)} />
          ) : config.plantillaId === 'moda' ? (
            <ModaProductoPreviewPage producto={selectedProduct} demo={demo} cp={cp} diseno={diseno} onNav={goToPage} onProduct={goToProduct} onAddToCart={() => addToCart(selectedProduct)} />
          ) : (
            <ProductoPage producto={selectedProduct} demo={demo} cp={cp} diseno={diseno} onNav={goToPage} onProduct={goToProduct} onAddToCart={() => addToCart(selectedProduct)} />
          )
        )}
        {page === 'checkout' && (
          config.plantillaId === 'moda' ? (
            <ModaCheckoutPage
              slug="preview"
              tienda={{ nombre: demo.storeName, diseno }}
              diseno={diseno}
              cp={cp}
              pedidoCreado={null}
              carritoState={carrito}
              setCarritoState={setCarrito}
              formData={{}}
              erroresForm={{}}
              handleChange={() => { }}
              configPago={{ aceptaEfectivo: true, aceptaTarjeta: true, culqiPublicKey: 'pk_test' }}
              configEnvio={{ aceptaEnvio: true, costoEnvio: 15 }}
              enviando={false}
              search=""
              setSearch={() => { }}
              searchResults={[]}
              suggestedProducts={[]}
              updateQuantity={actualizarCantidad}
              removeItem={(id) => actualizarCantidad(id, 0)}
              calcularSubtotal={() => carrito.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0)}
              calcularCostoEnvio={() => 15}
              calcularTotal={() => carrito.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0) + 15}
              onSubmit={() => alert('¡Compra completada en modo demo!')}
              onAddToCart={addToCart}
              freeDeliveryThreshold={0}
              freeDeliveryRemaining={0}
              freeDeliveryProgress={0}
              showConfirmModal={false}
              setShowConfirmModal={() => { }}
              showPaymentModal={false}
              setShowPaymentModal={() => { }}
              enviarPedido={async () => { alert('Pedido Enviado Demo'); }}
            />
          ) : config.plantillaId === 'autopartes' ? (
            <AutopartesCheckout
              slug="preview"
              tienda={{ nombre: demo.storeName, diseno }}
              carrito={carrito}
              formData={{}}
              erroresForm={{}}
              configPago={{ aceptaEfectivo: true, aceptaTarjeta: true, culqiPublicKey: 'pk_test' }}
              configEnvio={{ aceptaEnvio: true, costoEnvio: 15 }}
              enviando={false}
              search=""
              setSearch={() => { }}
              searchResults={[]}
              suggestedProducts={[]}
              handleChange={() => { }}
              updateQuantity={actualizarCantidad}
              removeItem={(id) => actualizarCantidad(id, 0)}
              calcularSubtotal={() => carrito.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0)}
              calcularCostoEnvio={() => 15}
              calcularTotal={() => carrito.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0) + 15}
              onSubmit={() => alert('¡Compra completada en modo demo!')}
              onAddToCart={addToCart}
              freeDeliveryThreshold={0}
              freeDeliveryRemaining={0}
              freeDeliveryProgress={0}
            />
          ) : config.plantillaId === 'urbano' ? (
            <UrbanoCheckoutPage
              slug="preview"
              tienda={{ nombre: demo.storeName, diseno }}
              diseno={diseno}
              cp={cp}
              pedidoCreado={null}
              carritoState={carrito}
              setCarritoState={setCarrito}
              formData={{}}
              erroresForm={{}}
              handleChange={() => { }}
              configPago={{ aceptaEfectivo: true, aceptaTarjeta: true, culqiPublicKey: 'pk_test' }}
              configEnvio={{ aceptaEnvio: true, costoEnvio: 15 }}
              enviando={false}
              search=""
              setSearch={() => { }}
              searchResults={[]}
              suggestedProducts={[]}
              updateQuantity={actualizarCantidad}
              removeItem={(id) => actualizarCantidad(id, 0)}
              calcularSubtotal={() => carrito.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0)}
              calcularCostoEnvio={() => 15}
              calcularTotal={() => carrito.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0) + 15}
              onSubmit={() => alert('¡Compra completada en modo demo!')}
              onAddToCart={addToCart}
              freeDeliveryThreshold={0}
              freeDeliveryRemaining={0}
              freeDeliveryProgress={0}
              showConfirmModal={false}
              setShowConfirmModal={() => { }}
              showPaymentModal={false}
              setShowPaymentModal={() => { }}
              enviarPedido={async () => { alert('Pedido Enviado Demo'); }}
            />
          ) : (
            <div className="py-20 text-center font-bold text-gray-500">Checkout Preview (Generic)</div>
          )
        )}

        {/* Footer on home/catalogo pages */}
        {config.plantillaId === 'autopartes' ? (
          page !== 'checkout' && <AutopartesFooter tienda={null} slug="preview" diseno={diseno} />
        ) : config.plantillaId === 'moda' ? (
          page !== 'checkout' && <ModaFooter tiendaNombre={demo.storeName} />
        ) : config.plantillaId === 'urbano' ? (
          null // Hombre Urbano handles its own footers inside its pages
        ) : page !== 'producto' && (
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
