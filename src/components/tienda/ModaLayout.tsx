import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ModaHeader from './ModaHeader';
import ModaHero from './ModaHero';
import ModaFeaturedCollections from './ModaFeaturedCollections';
import ModaBestSelling from './ModaBestSelling';
import ModaNewArrivals from './ModaNewArrivals';
import ModaPromoBanner from './ModaPromoBanner';
import ModaFooter from './ModaFooter';
import ShoppingCartModal from './ShoppingCartModal';

interface ModaLayoutProps {
  tienda: any;
  slug: string;
  productos: any[];
  allCategories: any[];
  cp: string;
  diseno: any;
  carrito: any[];
  setCarrito: (carrito: any[]) => void;
  mostrarCarrito: boolean;
  setMostrarCarrito: (value: boolean) => void;
  agregarAlCarrito: (producto: any) => void;
  actualizarCantidad: (id: number | string, cantidad: number) => void;
  loading: boolean;
}

export default function ModaLayout({
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
}: ModaLayoutProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const cartCount = carrito.reduce((sum, item) => sum + Number(item.cantidad || 1), 0);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const q = search.trim();
    if (q) navigate(`/tienda/${slug}/catalogo?search=${encodeURIComponent(q)}`);
  };

  const irACheckout = () => {
    navigate(`/tienda/${slug}/checkout`, { state: { carrito, tienda } });
  };

  return (
    <div
      className="min-h-screen bg-[#FAF9F6] text-gray-900"
      style={{ fontFamily: `'${diseno?.tipografia || 'Inter'}', sans-serif` }}
    >
      <ModaHeader
        tienda={tienda}
        slug={slug}
        cp={cp}
        carritoSize={cartCount}
        onOpenCart={() => setMostrarCarrito(!mostrarCarrito)}
        searchQuery={search}
        setSearchQuery={setSearch}
        onSearchSubmit={handleSearchSubmit}
        allCategories={allCategories}
      />

      <main className="w-full">
        {loading ? (
          <div className="h-[calc(100vh-94px)] min-h-[560px] bg-neutral-200 animate-pulse" />
        ) : (
          <>
            <ModaHero cp={cp} slug={slug} diseno={diseno} productos={productos.slice(0, 3)} />
            <ModaFeaturedCollections slug={slug} productos={productos} onAddToCart={agregarAlCarrito} />
            <div className="max-w-7xl mx-auto px-4 xl:px-8 py-14 md:py-16">
              <ModaBestSelling slug={slug} cp={cp} productos={productos} />
              <ModaNewArrivals slug={slug} productos={productos} />
              <ModaPromoBanner slug={slug} />
            </div>
          </>
        )}
      </main>

      <ModaFooter tiendaNombre={tienda?.nombre || 'Styliq'} />

      <ShoppingCartModal
        isOpen={mostrarCarrito}
        onClose={() => setMostrarCarrito(false)}
        carrito={carrito}
        tienda={tienda}
        actualizarCantidad={actualizarCantidad}
        onCheckout={irACheckout}
        slug={slug}
        setCarrito={setCarrito}
      />
    </div>
  );
}
