import { Icon } from '@iconify/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useEscapeKey from '@/hooks/useEscapeKey';

interface StoreHeaderProps {
    tienda: any;
    slug: string;
    carritoCount: number;
    onToggleCart: () => void;
    isAdminOpen: boolean;
    setIsAdminOpen: (open: boolean) => void;
    adminMenuRef: any;
    search: string;
    setSearch: (s: string) => void;
    categories: (string | { nombre: string; imagenUrl?: string })[];
    onSelectCategory: (cat: string) => void;
    recommendedProducts?: any[];
    hideCart?: boolean;
}

export default function StoreHeader({
    tienda,
    slug,
    carritoCount,
    onToggleCart,
    isAdminOpen,
    setIsAdminOpen,
    adminMenuRef,
    search,
    setSearch,
    categories = [],
    onSelectCategory,
    recommendedProducts = [],
    onSearch,
    hideCart = false
}: StoreHeaderProps & { onSearch?: () => void }) {
    const navigate = useNavigate();
    const isLoggedIn = !!localStorage.getItem('ACCESS_TOKEN');
    const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    useEscapeKey(() => setIsSearchFocused(false), isSearchFocused);
    useEscapeKey(() => setIsCatDropdownOpen(false), isCatDropdownOpen);
    useEscapeKey(() => setIsAdminOpen(false), isAdminOpen);

    const handleSearchTrigger = () => { if (onSearch) onSearch(); };

    return (
        <header className="fixed top-0 left-0 right-0 z-[100] font-sans bg-white shadow-sm">

            {/* ── Main Row ── */}
            <div className="max-w-screen-xl mx-auto px-5 md:px-8 py-3 flex items-center gap-4">

                {/* Logo */}
                <div
                    className="flex-shrink-0 cursor-pointer flex items-center gap-2"
                    onClick={() => navigate(`/tienda/${slug}`)}
                >
                    {tienda.logo ? (
                        <img src={tienda.logo} alt={tienda.nombreComercial} className="w-9 h-9 object-contain" />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-[#FF9500] flex items-center justify-center">
                            <Icon icon="solar:shop-bold" className="text-white" width={20} />
                        </div>
                    )}
                    <span className="text-lg font-black text-[#1A1A1A] tracking-tight hidden md:block">
                        {tienda.nombreComercial || 'Mi Tienda'}
                    </span>
                </div>

                {/* Deals Pill */}
                <button
                    onClick={() => document.getElementById('productos-populares')?.scrollIntoView({ behavior: 'smooth' })}
                    className="hidden md:flex items-center gap-1.5 bg-[#FF9500] text-white text-sm font-bold px-4 py-2 rounded-full flex-shrink-0 hover:bg-[#E08500] transition-colors"
                >
                    <Icon icon="solar:tag-bold" width={16} />
                    Deals
                </button>

                {/* Search Bar */}
                <div className="flex-1 relative">
                    <div className="flex items-center focus:outline-none gap-2 bg-[#F5F5F5] rounded-full px-4 border border-transparent focus-within:border-[#FF9500]/30 transition-colors">
                        <Icon icon="solar:magnifer-linear" className="text-[#999] flex-shrink-0" width={18} />
                        <input
                            type="text"
                            value={search}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchTrigger()}
                            placeholder="Buscar producto..."
                            className="flex-1 bg-transparent focus:outline-none text-sm text-[#1A1A1A] border-none placeholder-[#999]"
                        />
                    </div>

                    {/* Search Dropdown */}
                    {isSearchFocused && recommendedProducts.length > 0 && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsSearchFocused(false)} />
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-[60] p-4">
                                <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest mb-3">Productos destacados</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {recommendedProducts.slice(0, 6).map((item, i) => (
                                        <a
                                            href={`/tienda/${slug}/producto/${item.id}`}
                                            key={i}
                                            className="flex items-center gap-3 p-2 hover:bg-[#FAF6F1] rounded-xl group"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-[#FAF6F1] flex items-center justify-center flex-shrink-0">
                                                <img src={item.imagenUrl || ''} className="w-full h-full object-contain rounded-xl p-1" alt="" />
                                            </div>
                                            <span className="text-xs font-semibold text-[#1A1A1A] truncate group-hover:text-[#FF9500] transition-colors">
                                                {item.descripcion}
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Right Icons */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Favorites */}
                    <button className="p-2 text-[#FF9500] hover:bg-[#FFF3E0] rounded-full transition-colors">
                        <Icon icon="solar:heart-linear" width={24} />
                    </button>

                    {/* Cart */}
                    {!hideCart && (
                        <button
                            onClick={onToggleCart}
                            className="relative p-2 text-[#FF9500] hover:bg-[#FFF3E0] rounded-full transition-colors"
                        >
                            <Icon icon="solar:cart-large-2-linear" width={24} />
                            {carritoCount > 0 && (
                                <span className="absolute top-0 right-0 bg-[#FF9500] text-white text-[9px] font-black w-4.5 h-4.5 w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white">
                                    {carritoCount > 9 ? '9+' : carritoCount}
                                </span>
                            )}
                        </button>
                    )}

                    {/* Track Order */}
                    <button
                        onClick={() => navigate(`/tienda/${slug}/seguimiento`)}
                        className="p-2 text-[#FF9500] hover:bg-[#FFF3E0] rounded-full transition-colors hidden md:block"
                        title="Rastrear pedido"
                    >
                        <Icon icon="solar:delivery-linear" width={24} />
                    </button>

                    {/* Admin */}
                    {isLoggedIn && (
                        <div className="relative" onClick={() => setIsAdminOpen(!isAdminOpen)} ref={adminMenuRef}>
                            <button className="p-2 text-[#FF9500] hover:bg-[#FFF3E0] rounded-full transition-colors">
                                <Icon icon="solar:user-circle-linear" width={24} />
                            </button>
                            {isAdminOpen && (
                                <div
                                    className="fixed top-[110px] right-4 md:right-8 w-60 bg-white border border-gray-100 shadow-2xl z-[70] py-2 rounded-2xl animate-in slide-in-from-top-2"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <span className="text-[10px] font-black text-[#999] uppercase tracking-widest">Administración</span>
                                    </div>
                                    <ul className="py-1">
                                        {[
                                            { icon: 'solar:bag-check-bold', label: 'Ver Pedidos', color: '#FF9500', path: '/administrador/tienda/pedidos' },
                                            { icon: 'solar:shop-bold', label: 'Config. Tienda', color: '#22C55E', path: '/administrador/tienda/configuracion' },
                                            { icon: 'solar:box-bold', label: 'Productos', color: '#7C3AED', path: '/administrador/kardex/productos' },
                                            { icon: 'solar:bill-list-bold', label: 'Facturación', color: '#2563EB', path: '/administrador' },
                                        ].map(({ icon, label, color, path }) => (
                                            <li key={path}>
                                                <button
                                                    onClick={() => { navigate(path); setTimeout(() => setIsAdminOpen(false), 150); }}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-[#FAF6F1] flex items-center gap-3 text-sm"
                                                >
                                                    <Icon icon={icon} width={16} style={{ color }} />
                                                    <span className="text-[#1A1A1A] font-medium">{label}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Category Nav Row ── */}
            <div className="border-t border-gray-100">
                <div className="max-w-screen-xl mx-auto px-5 md:px-8 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">

                    {/* All Categories Dropdown */}
                    <div className="relative flex-shrink-0">
                        <button
                            onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                            className="flex items-center gap-1.5 bg-[#2D2D2D] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-black transition-colors whitespace-nowrap"
                        >
                            <Icon icon="solar:hamburger-menu-bold" width={14} />
                            Categorías
                            <Icon icon="solar:alt-arrow-down-linear" width={10} className={`transition-transform ${isCatDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {/* Category Pills */}
                    {categories.slice(0, 8).map((cat, idx) => {
                        const name = typeof cat === 'string' ? cat : cat.nombre;
                        return (
                            <button
                                key={idx}
                                onClick={() => onSelectCategory(name)}
                                className="flex items-center gap-1.5 bg-[#2D2D2D] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-black transition-colors whitespace-nowrap flex-shrink-0"
                            >
                                <Icon icon="solar:tag-bold" width={12} />
                                {name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Categories Full Dropdown */}
            {isCatDropdownOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsCatDropdownOpen(false)} />
                    <div className="fixed left-5 md:left-8 top-[130px] w-60 bg-white border border-gray-100 shadow-2xl z-50 py-2 rounded-2xl animate-in slide-in-from-top-2">
                        <div className="px-4 py-2 border-b border-gray-100">
                            <span className="text-[10px] font-black text-[#999] uppercase tracking-widest">Todas las Categorías</span>
                        </div>
                        <ul className="max-h-64 overflow-y-auto py-1">
                            <li>
                                <button
                                    onClick={() => { onSelectCategory(''); setIsCatDropdownOpen(false); }}
                                    className="w-full text-left px-4 py-2.5 hover:bg-[#FAF6F1] flex items-center gap-2.5 text-sm text-[#1A1A1A] font-medium"
                                >
                                    <Icon icon="solar:widget-bold" width={16} className="text-[#FF9500]" />
                                    Todos los productos
                                </button>
                            </li>
                            {categories.map((cat, idx) => {
                                const name = typeof cat === 'string' ? cat : cat.nombre;
                                return (
                                    <li key={idx}>
                                        <button
                                            onClick={() => { onSelectCategory(name); setIsCatDropdownOpen(false); }}
                                            className="w-full text-left px-4 py-2.5 hover:bg-[#FAF6F1] flex items-center gap-2.5 text-sm text-[#1A1A1A] font-medium"
                                        >
                                            <Icon icon="solar:tag-bold" width={16} className="text-[#FF9500]" />
                                            {name}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </>
            )}
        </header>
    );
}
