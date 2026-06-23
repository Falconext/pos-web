import React, { useMemo, useState } from 'react';
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

type MenuKey = 'men' | 'women' | null;

const menuBase = {
  men: {
    label: 'Men',
    shipping: 'FREE SHIPPING FROM S/150 TO ALL PERU',
    first: ['New Arrivals', 'White Sneakers', 'Bestsellers', 'Wedding', 'A Journey Shared in Brasil', 'Heineken x Filling Pieces'],
    shoes: ['New Arrivals', 'All Shoes', 'Sneakers', 'Loafers | Derbies', 'Sandals | Slides'],
    silhouettes: ['Loafer', 'Mondo', 'Low Top', 'Cruiser', 'Tiebreak', 'Riviera', 'Derby'],
    clothing: ['New Arrivals', 'All Clothing', 'Knitwear', 'T-Shirts | Longsleeves', 'Shirts | Polos', 'Tank Tops', 'Hoodies | Sweatshirts', 'Jackets | Overshirts', 'Pants', 'Shorts | Swimshorts', 'Denim', 'Co-ords | Sets'],
    cards: [
      {
        title: "Shop our Men's Shoes",
        image: 'https://images.unsplash.com/photo-1515347619252-8d348b569ea4?auto=format&fit=crop&q=80&w=900',
      },
      {
        title: "Shop our Men's Clothing",
        image: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&q=80&w=900',
      },
    ],
  },
  women: {
    label: 'Women',
    shipping: 'FREE TOTE BAG WITH EVERY ORDER, ADD YOURS IN THE CART',
    first: ['New Arrivals', 'White Sneakers', 'Bestsellers', 'Wedding', 'Heineken x Filling Pieces', 'Just Eat Takeaway.com x Filling Pieces'],
    shoes: ['New Arrivals', 'All Shoes', 'Sneakers', 'Loafers', 'Sandals | Slides'],
    silhouettes: ['Loafer', 'Low Top', 'Mondo', 'Cruiser'],
    clothing: ['New Arrivals', 'All Clothing', 'Knitwear', 'T-Shirts | Shirts', 'Tank Tops', 'Hoodies | Sweatshirts', 'Jackets | Overshirts', 'Shirts | Polos', 'Pants | Jeans', 'Shorts', 'Denim', 'Co-ords | Sets'],
    cards: [
      {
        title: "Shop our Women's Shoes",
        image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=900',
      },
      {
        title: "Shop our Women's Clothing",
        image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=900',
      },
    ],
  },
};

export default function ModaHeader({
  tienda,
  slug,
  carritoSize,
  onOpenCart,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  allCategories = [],
}: ModaHeaderProps) {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState<MenuKey>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const brandName = useMemo(() => {
    const name = tienda?.nombre || 'Filling Pieces';
    return String(name).replace(/\s+/g, ' ').trim().toUpperCase();
  }, [tienda?.nombre]);

  const goCatalog = (query?: string) => {
    if (slug === 'preview') {
      window.dispatchEvent(new CustomEvent('preview-nav', { detail: 'catalogo' }));
      return;
    }
    navigate(query ? `/tienda/${slug}/catalogo?search=${encodeURIComponent(query)}` : `/tienda/${slug}/catalogo`);
  };

  const menu = activeMenu ? menuBase[activeMenu] : null;

  return (
    <header className="relative z-[80] w-full bg-white text-black" onMouseLeave={() => setActiveMenu(null)}>
      <div className="h-[38px] bg-black text-white flex items-center justify-center px-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.03em]">
          {menu?.shipping || '30 EASY DAYS RETURN POLICY'}
        </p>
      </div>

      <div className="h-[56px] border-b border-black/90 bg-white flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4 min-w-0">
          <button
            className="lg:hidden -ml-1"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Abrir menu"
          >
            <Icon icon={mobileOpen ? 'solar:close-circle-linear' : 'solar:hamburger-menu-linear'} width={24} />
          </button>
          <Link to={`/tienda/${slug}`} className="flex items-center">
            {tienda?.logo ? (
              <img src={tienda.logo} alt={tienda.nombre} className="h-8 max-w-[180px] object-contain" />
            ) : (
              <span className="text-[20px] md:text-[22px] font-medium tracking-[0.16em] leading-none border-b border-black pb-0.5 truncate max-w-[220px]">
                {brandName}
              </span>
            )}
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-7 text-[15px] font-medium">
          {(['men', 'women'] as const).map((key) => (
            <button
              key={key}
              onMouseEnter={() => setActiveMenu(key)}
              onClick={() => goCatalog(key)}
              className={`leading-none pb-1 border-b transition-colors ${activeMenu === key ? 'border-black' : 'border-transparent hover:border-black'}`}
            >
              {menuBase[key].label}
            </button>
          ))}
          <button onClick={() => goCatalog('mundo')} className="leading-none pb-1 border-b border-transparent hover:border-black">
            Our World
          </button>
          <button onClick={() => goCatalog('ofertas')} className="leading-none pb-1 border-b border-transparent hover:border-black">
            Rewards
          </button>
        </nav>

        <div className="hidden lg:flex items-center gap-4 text-[14px] font-medium uppercase">
          <form onSubmit={onSearchSubmit} className="flex items-center gap-1">
            <Icon icon="solar:magnifer-linear" width={18} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="SEARCH"
              className="w-[70px] bg-transparent outline-none placeholder:text-black"
            />
          </form>
          <button className="flex items-center gap-1 hover:opacity-60">
            <Icon icon="solar:user-linear" width={18} />
            LOGIN
          </button>
          <button className="flex items-center gap-1 hover:opacity-60" onClick={() => goCatalog('favoritos')}>
            <Icon icon="solar:heart-linear" width={18} />
            WISHLIST
          </button>
          <button className="flex items-center gap-1 hover:opacity-60" onClick={onOpenCart}>
            <Icon icon="solar:bag-4-linear" width={18} />
            BAG ({carritoSize})
          </button>
        </div>

        <button className="lg:hidden flex items-center gap-1 text-sm font-semibold" onClick={onOpenCart}>
          <Icon icon="solar:bag-4-linear" width={20} />
          {carritoSize}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-black p-5 shadow-xl">
          <div className="grid gap-4 text-lg font-medium">
            <button onClick={() => goCatalog('men')} className="text-left">Men</button>
            <button onClick={() => goCatalog('women')} className="text-left">Women</button>
            {allCategories.slice(0, 6).map((category: any) => {
              const name = typeof category === 'string' ? category : category?.nombre;
              if (!name) return null;
              return <button key={name} onClick={() => goCatalog(name)} className="text-left">{name}</button>;
            })}
          </div>
        </div>
      )}

      {menu && (
        <div className="hidden lg:grid absolute top-full left-0 w-full h-[402px] bg-white border-b border-black shadow-sm grid-cols-[15%_15%_15%_15%_20%_20%]">
          <div className="border-r border-black px-8 py-8">
            <MenuList items={menu.first} onItemClick={goCatalog} markNew />
          </div>
          <div className="border-r border-black px-8 py-8">
            <MenuGroup title="Shoes" items={menu.shoes} onItemClick={goCatalog} />
            <MenuGroup title="Silhouettes" items={menu.silhouettes} onItemClick={goCatalog} className="mt-8" />
          </div>
          <div className="border-r border-black px-8 py-8">
            <MenuGroup title="Clothing" items={menu.clothing} onItemClick={goCatalog} />
          </div>
          <div className="border-r border-black px-8 py-8">
            <MenuGroup title="Accessories" items={['All Accessories', 'Gift Cards', 'Socks', 'Caps']} onItemClick={goCatalog} />
          </div>
          {menu.cards.map((card) => (
            <button
              key={card.title}
              onClick={() => goCatalog(card.title)}
              className="relative overflow-hidden group text-white text-center"
            >
              <img src={card.image} alt={card.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors" />
              <span className="relative z-10 h-full flex items-center justify-center px-8 text-[16px] font-bold leading-snug">
                {card.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

function MenuGroup({
  title,
  items,
  onItemClick,
  className = '',
}: {
  title: string;
  items: string[];
  onItemClick: (query?: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[14px] text-gray-500 mb-2">{title}</p>
      <MenuList items={items} onItemClick={onItemClick} />
    </div>
  );
}

function MenuList({
  items,
  onItemClick,
  markNew = false,
}: {
  items: string[];
  onItemClick: (query?: string) => void;
  markNew?: boolean;
}) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, index) => (
        <li key={item}>
          <button
            onClick={() => onItemClick(item)}
            className="text-left text-[15px] leading-[1.25] hover:underline underline-offset-4"
          >
            {item}
            {markNew && [0, 1, 3, 5].includes(index) && (
              <span className="ml-1 align-super text-[8px] text-slate-500 font-bold">NEW</span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
