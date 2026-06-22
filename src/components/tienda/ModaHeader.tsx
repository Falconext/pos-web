import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { Link, useNavigate } from 'react-router-dom';

interface ModaHeaderProps {
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

export default function ModaHeader({
  tienda,
  slug,
  cp,
  carritoSize,
  onOpenCart,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  allCategories = []
}: ModaHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="w-full bg-[#FAF9F6] border-b border-gray-100/50 flex flex-col">
      <div className="w-full max-w-7xl mx-auto px-4 xl:px-8 py-4 flex items-center justify-between gap-6">
        
        {/* Mobile Menu Icon (Hidden on Desktop) */}
        <button className="lg:hidden text-gray-800">
          <Icon icon="solar:hamburger-menu-linear" width={24} />
        </button>

        {/* Search Bar (Left side as in the image) */}
        <div className="hidden lg:flex flex-1 max-w-[300px]">
          <form onSubmit={onSearchSubmit} className="flex items-center w-full bg-white rounded-full overflow-hidden shadow-sm border border-gray-100 px-4 py-2">
            <div className="text-indigo-400 mr-2">
              <Icon icon="solar:magic-stick-3-bold-duotone" width={18} />
            </div>
            <input
              type="text"
              placeholder="Ai Search Clothe"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400"
            />
            <button type="submit" className="text-gray-400 hover:text-gray-800 transition-colors">
              <Icon icon="solar:magnifer-linear" width={20} />
            </button>
          </form>
        </div>

        {/* Logo (Centered) */}
        <div className="flex-1 flex justify-center">
          <Link to={`/tienda/${slug}`} className="flex items-center gap-2">
            {tienda?.logo ? (
              <img src={tienda.logo} alt={tienda.nombre} className="h-8 w-auto object-contain" />
            ) : (
              <span className="text-3xl font-serif font-bold text-gray-900 tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                Styliq<span style={{ color: cp || '#B58863' }}>.</span>
              </span>
            )}
          </Link>
        </div>

        {/* Links & Icons Right */}
        <div className="flex-1 flex items-center justify-end gap-6">
          {/* Icons */}
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-700 shadow-sm border border-gray-100 hover:scale-105 transition-transform">
              <Icon icon="solar:heart-bold" width={20} className="text-gray-700" />
            </button>
            
            <button 
              onClick={onOpenCart}
              className="relative w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-700 shadow-sm border border-gray-100 hover:scale-105 transition-transform cursor-pointer"
            >
              <Icon icon="solar:bag-3-bold" width={20} />
              {carritoSize > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-900 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {carritoSize}
                </span>
              )}
            </button>

            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-700 shadow-sm border border-gray-100 hover:scale-105 transition-transform">
              <Icon icon="solar:user-bold" width={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
