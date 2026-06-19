import React, { useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import AutopartesHeader from './AutopartesHeader';
import AutopartesHero from './AutopartesHero';
import ProductCardAutopartes from './ProductCardAutopartes';
import AutopartesCartModal from './AutopartesCartModal';
import AutopartesFeaturedCategories from './AutopartesFeaturedCategories';
import AutopartesPromoBanners from './AutopartesPromoBanners';
import AutopartesTrendingProducts from './AutopartesTrendingProducts';
import AutopartesDealsOfTheWeek from './AutopartesDealsOfTheWeek';
import AutopartesBrands from './AutopartesBrands';
import AutopartesTopSelling from './AutopartesTopSelling';
import AutopartesFooter from './AutopartesFooter';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

interface AutopartesLayoutProps {
  tienda: any;
  slug: string;
  productos: any[];
  allCategories: (string | { nombre: string; imagenUrl?: string })[];
  cp: string;
  diseno: any;
  carrito: any[];
  setCarrito: (c: any[]) => void;
  mostrarCarrito: boolean;
  setMostrarCarrito: (v: boolean) => void;
  agregarAlCarrito: (p: any) => void;
  actualizarCantidad: (id: number | string, cantidad: number) => void;
  loading: boolean;
}

export default function AutopartesLayout({
  tienda,
  slug,
  productos,
  allCategories,
  cp,
  diseno,
  carrito,
  setCarrito,
  mostrarCarrito,
  setMostrarCarrito,
  agregarAlCarrito,
  actualizarCantidad,
  loading,
}: AutopartesLayoutProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // Slicing for homepage grids
  const featured = productos.slice(0, 8);
  const newArrivals = [...productos].reverse().slice(0, 8);

  const irACheckout = () => navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      slug === "preview" ? window.dispatchEvent(new CustomEvent("preview-nav", { detail: "catalogo" })) : navigate(`/tienda/${slug}/catalogo?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF5F5]" style={{ fontFamily: `'${diseno.tipografia || 'Inter'}', sans-serif` }}>
      {/* Header */}
      <AutopartesHeader 
        tienda={tienda}
        slug={slug}
        cp={cp}
        carritoSize={carrito.length}
        onOpenCart={() => setMostrarCarrito(!mostrarCarrito)}
        searchQuery={search}
        setSearchQuery={setSearch}
        onSearchSubmit={handleSearchSubmit}
        allCategories={allCategories}
      />

      <main className="w-full max-w-7xl mx-auto px-4 xl:px-8 py-8 md:py-10">
        
        {/* Hero Section */}
        <div className="mb-4">
          <AutopartesHero cp={cp} slug={slug} />
        </div>

        {/* Featured Categories Area */}
        <AutopartesFeaturedCategories cp={cp} slug={slug} />

        {/* Promo Banners Area */}
        <div className="mt-8 mb-16">
          <AutopartesPromoBanners cp={cp} slug={slug} />
        </div>

        {/* Featured Products */}
        {featured.length > 0 && (
          <div className="mb-16">
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

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                 {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-white rounded-xl h-[340px]"></div>
                ))}
              </div>
            ) : (
              <motion.div 
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {featured.map((p) => (
                  <motion.div key={p.id} variants={itemVariants}>
                    <ProductCardAutopartes 
                      producto={p} 
                      slug={slug} 
                      diseno={diseno} 
                      onAddToCart={agregarAlCarrito}
                      onClick={() => navigate(`/tienda/${slug}/producto/${p.id}`)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* Trending Searches Products Area */}
        {productos.length > 0 && (
          <AutopartesTrendingProducts 
            cp={cp} 
            slug={slug} 
            productos={[...productos].reverse()} 
            diseno={diseno} 
            onAddToCart={agregarAlCarrito} 
          />
        )}

      </main>

      {/* Full width deals section */}
      <AutopartesDealsOfTheWeek cp={cp} slug={slug} productos={productos} />

      {/* Brands Banner */}
      <AutopartesBrands cp={cp} slug={slug} />

      {/* Top Selling section */}
      <div className="bg-[#FAF5F5]">
        <AutopartesTopSelling cp={cp} />
      </div>

      <AutopartesFooter tienda={tienda} slug={slug} diseno={diseno} />

      {/* Slide-out Cart */}
      <AutopartesCartModal 
        isOpen={mostrarCarrito}
        onClose={() => setMostrarCarrito(false)}
        carrito={carrito}
        setCarrito={setCarrito}
        actualizarCantidad={actualizarCantidad}
        onCheckout={irACheckout}
        cp={cp}
      />
    </div>
  );
}
