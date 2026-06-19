import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { Link, useNavigate } from 'react-router-dom';

interface AutopartesHeaderProps {
  tienda: any;
  slug: string;
  cp: string;
  carritoSize: number;
  onOpenCart: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  allCategories?: any[];
}

export default function AutopartesHeader({
  tienda,
  slug,
  cp,
  carritoSize,
  onOpenCart,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  allCategories = []
}: AutopartesHeaderProps) {
  const navigate = useNavigate();
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  // Fallback links if categories are few
  const quickLinks = ['Tyre Shop', 'Fluids & Lubricants', 'Batteries', 'Tools', 'Trucks', 'Motorcycles', 'EV BAY'];

  return (
    <header className="w-full bg-white border-b border-gray-100 flex flex-col">
      {/* Top Bar */}
      <div className="w-full max-w-7xl mx-auto px-4 xl:px-8 py-4 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link to={`/tienda/${slug}`} className="flex items-center gap-2 flex-shrink-0">
          {tienda?.logo ? (
            <img src={tienda.logo} alt={tienda.nombre} className="h-10 w-auto object-contain" />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: cp }}>
                <Icon icon="solar:wheel-bold" width={24} />
              </div>
              <span className="text-2xl font-black text-gray-900 tracking-tight hidden sm:block">
                {tienda?.nombre || 'Tu Tienda'}
              </span>
            </div>
          )}
        </Link>

        {/* Search Bar (Center) */}
        <div className="flex-1 max-w-2xl hidden md:block">
          <form onSubmit={onSearchSubmit} className="flex items-center w-full bg-[#F3F4F6] rounded-md overflow-hidden border border-gray-200">
            <div className="pl-4 text-gray-400">
              <Icon icon="solar:magnifer-linear" width={20} />
            </div>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none px-3 py-3 text-sm text-gray-800"
            />
            <button type="submit" className="px-6 py-3 font-bold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: '#0B1120' }}>
              Buscar
            </button>
          </form>
        </div>

        {/* Icons Right */}
        <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
          <button className="relative text-gray-600 hover:text-gray-900 transition-colors hidden lg:block">
            <Icon icon="solar:bell-linear" width={24} />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">3</span>
          </button>
          <button className="relative text-gray-600 hover:text-gray-900 transition-colors hidden lg:block">
            <Icon icon="solar:refresh-linear" width={24} />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">2</span>
          </button>
          <button 
            onClick={onOpenCart}
            className="relative flex items-center gap-2 group cursor-pointer"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-red-500 group-hover:bg-red-50 transition-colors">
                <Icon icon="solar:bag-3-bold" width={26} />
              </div>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[11px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {carritoSize}
              </span>
            </div>
            <div className="hidden lg:flex flex-col items-start leading-tight">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Artículos</span>
              <span className="text-sm font-black text-gray-900">S/ 0.00 <Icon icon="solar:alt-arrow-down-linear" className="inline ml-0.5" /></span>
            </div>
          </button>
          <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
              <Icon icon="solar:user-bold" width={24} className="text-gray-400 mt-2" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] text-gray-500">¡Hola!</span>
              <span className="text-sm font-bold text-gray-900">Usuario</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Nav Bar (Contained) */}
      <div className="w-full bg-white text-white pb-4">
        <div className="w-full max-w-7xl mx-auto px-4 xl:px-8 flex items-stretch">
          {/* Categories Dropdown Button */}
          <div className="relative z-50">
            <button 
              onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
              className="flex items-center justify-between gap-6 px-6 h-14 w-64 text-white font-bold transition-opacity hover:opacity-95 rounded-l-md"
              style={{ backgroundColor: cp }}
            >
              <div className="flex items-center gap-3">
                <Icon icon="solar:hamburger-menu-linear" width={22} />
                <span>Categorías</span>
              </div>
              <Icon icon={isCategoryMenuOpen ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"} width={20} />
            </button>
            
            {/* Dropdown Menu */}
            {isCategoryMenuOpen && (
              <div className="absolute top-full left-0 w-full bg-white border border-gray-200 shadow-xl rounded-b-lg overflow-hidden py-2 z-50">
                {allCategories.length > 0 ? (
                  allCategories.map((cat: any) => {
                    const name = typeof cat === 'string' ? cat : cat.nombre;
                    return (
                      <button 
                        key={name}
                        onClick={() => {
                          setSearchQuery(name);
                          setIsCategoryMenuOpen(false);
                          // We trigger a search by navigating to catalog
                          slug === "preview" ? window.dispatchEvent(new CustomEvent("preview-nav", { detail: "catalogo" })) : navigate(`/tienda/${slug}/catalogo?q=${encodeURIComponent(name)}`);
                        }}
                        className="w-full text-left px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                      >
                        {name}
                      </button>
                    )
                  })
                ) : (
                  <div className="px-5 py-3 text-sm text-gray-500">No categories found</div>
                )}
              </div>
            )}

            {isCategoryMenuOpen && allCategories.length === 0 && (
              <div className="absolute top-full left-0 w-full bg-white border border-gray-200 shadow-xl rounded-b-lg overflow-hidden py-2">
                {quickLinks.map(link => (
                  <button 
                    key={link}
                    onClick={() => {
                      setSearchQuery(link);
                      setIsCategoryMenuOpen(false);
                      slug === "preview" ? window.dispatchEvent(new CustomEvent("preview-nav", { detail: "catalogo" })) : navigate(`/tienda/${slug}/catalogo?q=${encodeURIComponent(link)}`);
                    }}
                    className="w-full text-left px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                  >
                    {link}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links (Desktop) inside dark bar */}
          <div className="hidden lg:flex items-center flex-1 overflow-x-auto no-scrollbar bg-[#1A1A1A] rounded-r-md px-2">
            {quickLinks.map((link) => (
              <button 
                key={link} 
                onClick={() => {
                  setSearchQuery(link);
                  slug === "preview" ? window.dispatchEvent(new CustomEvent("preview-nav", { detail: "catalogo" })) : navigate(`/tienda/${slug}/catalogo?q=${encodeURIComponent(link)}`);
                }}
                className="px-5 h-full flex items-center text-sm font-bold text-gray-300 hover:text-white whitespace-nowrap transition-colors border-b-2 border-transparent hover:border-white"
              >
                {link}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
