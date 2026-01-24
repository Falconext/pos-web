import { Icon } from '@iconify/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

    const handleSearchTrigger = () => {
        if (onSearch) {
            onSearch();
        }
    };

    return (
        <header className="bg-white sticky top-0 z-50 shadow-sm font-sans">
            {/* Top Bar */}
            <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4 md:gap-8 min-h-[80px]">

                {/* Left: Logo */}
                <div className="flex-shrink-0 cursor-pointer flex items-center gap-2" onClick={() => navigate(`/tienda/${slug}`)}>
                    {tienda.logo ? (
                        <div className="flex items-center gap-2">
                            <img src={tienda.logo} alt={tienda.nombreComercial} className="w-10 h-10 object-contain" />
                            <span className="text-md font-bold text-gray-900 tracking-tight hidden md:block">
                                {tienda.nombreComercial}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1">
                            <Icon icon="solar:bag-heart-bold" className="text-[#ff9900]" width={32} />
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                {tienda.nombreComercial || 'PioMart'}
                            </h1>
                        </div>
                    )}
                </div>

                {/* Center: Search Bar */}
                <div className="flex-1 max-w-xl relative hidden md:block">
                    <div className="relative z-50 flex">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={search}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchTrigger()}
                                placeholder="Buscar producto"
                                className="w-full pl-9 pr-4 py-3 bg-gray-100/50 border border-gray-100 rounded-l-full text-sm text-gray-700 outline-none focus:bg-white focus:ring-1 focus:ring-[#ff9900]/30 transition-all"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-40">
                                <Icon icon="solar:magnifer-linear" />
                            </div>
                        </div>
                        <button
                            onClick={handleSearchTrigger}
                            className="bg-[#ff9900] hover:bg-[#e68a00] text-white px-8 py-3 rounded-r-full font-bold text-sm transition-colors flex items-center">
                            Buscar
                        </button>
                    </div>

                    {/* Search Dropdown - inside the search container for proper positioning */}
                    {isSearchFocused && (
                        <>
                            <div className="fixed inset-0 bg-black/5 z-30" onClick={() => setIsSearchFocused(false)} />
                            <div className="absolute top-full left-0 right-0 mt-2 p-6 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[60]">
                                <h3 className="text-gray-900 font-bold mb-4 text-sm tracking-wide">Búsquedas Populares</h3>
                                {recommendedProducts.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {recommendedProducts.slice(0, 6).map((item, i) => (
                                            <a href={`/tienda/${slug}/producto/${item.id}`} key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer block group">
                                                <img src={item.imagenUrl || 'https://via.placeholder.com/40'} className="w-10 h-10 object-contain bg-gray-100 rounded-lg p-1" />
                                                <div className="text-xs font-bold text-gray-800 truncate group-hover:text-[#ff9900] transition-colors">{item.descripcion}</div>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-sm">Empieza a escribir para buscar...</p>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-4 md:gap-7">

                    {/* Track Order - Visible on Desktop/Tablet */}
                    <button
                        onClick={() => navigate(`/tienda/${slug}/seguimiento`)}
                        className="flex flex-col items-center gap-1 group text-gray-500 hover:text-[#ff9900] transition-colors"
                    >
                        <Icon icon="solar:delivery-linear" width={26} className="group-hover:scale-110 transition-transform" />
                    </button>

                    {/* Cart - Oculto si hideCart es true */}
                    {!hideCart && (
                        <button onClick={onToggleCart} className="flex flex-col items-center gap-1 group text-gray-500 hover:text-[#ff9900] transition-colors relative">
                            <Icon icon="solar:bag-3-linear" width={26} className="group-hover:scale-110 transition-transform" />
                            {carritoCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-[#ff9900] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                    {carritoCount}
                                </span>
                            )}
                        </button>
                    )}

                    {/* Admin Menu - Solo visible si está logueado */}
                    {isLoggedIn && (
                        <>
                            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setIsAdminOpen(!isAdminOpen)} ref={adminMenuRef}>
                                <div className="w-9 h-9 rounded-full bg-[#045659] flex items-center justify-center text-white group-hover:bg-[#0b4a4d] transition-colors">
                                    <Icon icon="solar:settings-linear" width={20} />
                                </div>
                                <div className="hidden md:flex flex-col text-xs">
                                    <span className="text-gray-400">Panel</span>
                                    <span className="font-bold text-gray-800 group-hover:text-[#045659] transition-colors">Administrador</span>
                                </div>

                                {/* Dropdown moved inside to remain within adminMenuRef logic */}
                                {isAdminOpen && (
                                    <div
                                        className="fixed top-[75px] right-4 md:right-8 w-64 bg-white border border-gray-100 shadow-xl z-[70] py-2 rounded-xl text-gray-800 animate-in slide-in-from-top-2 cursor-default"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="px-4 py-2 border-b border-gray-100">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Panel de Administración</span>
                                        </div>
                                        <ul className="text-sm font-medium">
                                            <li>
                                                <button
                                                    onClick={() => {
                                                        navigate('/administrador/tienda/pedidos');
                                                        setTimeout(() => setIsAdminOpen(false), 150);
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 block group"
                                                >
                                                    <Icon icon="solar:bag-check-linear" width={20} className="text-[#ff9900]" />
                                                    <span className="group-hover:text-[#ff9900] transition-colors">Ver Pedidos</span>
                                                </button>
                                            </li>
                                            <li>
                                                <button
                                                    onClick={() => {
                                                        navigate('/administrador/tienda/configuracion');
                                                        setTimeout(() => setIsAdminOpen(false), 150);
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 block group"
                                                >
                                                    <Icon icon="solar:shop-linear" width={20} className="text-[#045659]" />
                                                    <span className="group-hover:text-[#045659] transition-colors">Configuración de Tienda</span>
                                                </button>
                                            </li>
                                            <li>
                                                <button
                                                    onClick={() => {
                                                        navigate('/administrador/kardex/productos');
                                                        setTimeout(() => setIsAdminOpen(false), 150);
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 block group"
                                                >
                                                    <Icon icon="solar:box-linear" width={20} className="text-purple-500" />
                                                    <span className="group-hover:text-purple-600 transition-colors">Gestionar Productos</span>
                                                </button>
                                            </li>
                                            <li>
                                                <button
                                                    onClick={() => {
                                                        navigate('/administrador');
                                                        setTimeout(() => setIsAdminOpen(false), 150);
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 block group"
                                                >
                                                    <Icon icon="solar:bill-list-linear" width={20} className="text-blue-500" />
                                                    <span className="group-hover:text-blue-600 transition-colors">Facturación</span>
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Bottom Nav Bar - Categories */}
            {categories.length > 0 && (
                <div className="border-t border-gray-100">
                    <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-3 flex items-center gap-3 md:gap-8 overflow-x-auto no-scrollbar">

                        {/* Categories Dropdown Button */}
                        <div className="relative z-50">
                            <button
                                className="bg-[#045659]/10 text-[#045659] hover:bg-[#045659] hover:text-white px-5 py-2.5 rounded-full flex items-center gap-2 text-sm font-bold transition-all whitespace-nowrap"
                                onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                            >
                                <Icon icon="solar:hamburger-menu-linear" width={18} />
                                <span>Ver Categorías</span>
                                <Icon icon="solar:alt-arrow-down-linear" width={14} className={`transition-transform ${isCatDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Category Pills - Quick Access */}
                        <nav className="flex items-center gap-3 text-sm font-semibold text-gray-600">
                            {categories.slice(0, 5).map((cat, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onSelectCategory(typeof cat === 'string' ? cat : cat.nombre)}
                                    className="hover:text-[#ff9900] transition-colors whitespace-nowrap px-3 py-1.5 rounded-full hover:bg-gray-50"
                                >
                                    {typeof cat === 'string' ? cat : cat.nombre}
                                </button>
                            ))}
                        </nav>

                    </div>
                </div>
            )}

            {/* Categories Dropdown - Outside overflow container */}
            {isCatDropdownOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsCatDropdownOpen(false)} />
                    <div className="fixed left-4 md:left-8 top-[140px] w-64 bg-white border border-gray-100 shadow-xl z-50 py-2 rounded-xl text-gray-800 animate-in slide-in-from-top-2">
                        <div className="px-4 py-2 border-b border-gray-100">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Categorías</span>
                        </div>
                        <ul className="text-sm font-medium max-h-64 overflow-y-auto">
                            <li>
                                <button
                                    onClick={() => { onSelectCategory(''); setIsCatDropdownOpen(false); }}
                                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2 text-gray-600 hover:text-[#ff9900] transition-colors"
                                >
                                    <Icon icon="solar:widget-linear" width={18} />
                                    Todas las categorías
                                </button>
                            </li>
                            {categories.map((cat, idx) => (
                                <li key={idx}>
                                    <button
                                        onClick={() => { onSelectCategory(typeof cat === 'string' ? cat : cat.nombre); setIsCatDropdownOpen(false); }}
                                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2 text-gray-600 hover:text-[#ff9900] transition-colors"
                                    >
                                        <Icon icon="solar:tag-linear" width={18} />
                                        {typeof cat === 'string' ? cat : cat.nombre}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            )}

            {/* Admin Dropdown - Outside normal flow with high z-index */}


        </header >
    );
}
