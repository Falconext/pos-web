import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';

interface SliderBannersProps {
    tienda: any;
    diseno: any;
}

export default function SliderBanners({ tienda, diseno }: SliderBannersProps) {
    const navigate = useNavigate();
    const { slug } = useParams();
    const [imgLoaded, setImgLoaded] = useState<Record<string, boolean>>({});

    const handleBannerClick = (url?: string) => {
        if (!url) return;
        if (url.startsWith('http') || url.startsWith('//')) { window.location.href = url; return; }
        if (url.startsWith('/tienda') || url.startsWith('tienda')) {
            navigate(url.startsWith('/') ? url : `/${url}`); return;
        }
        navigate(`/tienda/${slug}/${url.startsWith('/') ? url.substring(1) : url}`);
    };

    // Side category cards (top-right and bottom-right)
    const sideCards = [
        {
            id: 'side-dogs',
            label: tienda?.banners?.[2]?.titulo || 'Destacados',
            imagenUrl: tienda?.banners?.[2]?.imagenUrl || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=500',
            linkUrl: tienda?.banners?.[2]?.linkUrl || '',
            bgColor: '#F5EEE6',
        },
        {
            id: 'side-cats',
            label: tienda?.banners?.[3]?.titulo || 'Novedades',
            imagenUrl: tienda?.banners?.[3]?.imagenUrl || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=500',
            linkUrl: tienda?.banners?.[3]?.linkUrl || '',
            bgColor: '#F5EEE6',
        },
    ];

    // Main hero banner data
    const hasLive = tienda?.banners?.length > 0;
    const mainBanner = hasLive ? {
        titulo: tienda.banners[0]?.titulo || 'Ofertas Especiales',
        subtitulo: tienda.banners[0]?.subtitulo || 'Descubre las mejores ofertas de la semana en productos seleccionados.',
        boton: tienda.banners[0]?.boton || 'Ver más',
        imagenUrl: tienda.banners[0]?.imagenUrl || '',
        linkUrl: tienda.banners[0]?.linkUrl || '',
    } : {
        titulo: 'Ofertas Especiales para Ti',
        subtitulo: 'Descubre descuentos semanales en productos de primera calidad y los mejores precios del mercado.',
        boton: 'Ver más',
        imagenUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=800',
        linkUrl: '',
    };

    return (
        <div className="max-w-screen-xl mx-auto px-5 md:px-8 mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[440px]">

                {/* ── Main Orange Hero Banner ── */}
                <div
                    className="lg:col-span-9 relative rounded-3xl overflow-hidden cursor-pointer group h-[340px] lg:h-full bg-[#FF9500]"
                    onClick={() => handleBannerClick(mainBanner.linkUrl)}
                >
                    {/* Decorative circle */}
                    <div className="absolute right-[28%] top-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-[#FFB347] opacity-60 pointer-events-none" />

                    {/* Text Content */}
                    <div className="absolute left-0 top-0 bottom-0 w-full md:w-[45%] p-8 md:p-12 flex flex-col justify-center z-10">
                        <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.1] mb-4">
                            {mainBanner.titulo}
                        </h2>
                        <p className="text-white/85 text-sm md:text-base leading-relaxed mb-8 max-w-xs">
                            {mainBanner.subtitulo}
                        </p>
                        {mainBanner.boton && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleBannerClick(mainBanner.linkUrl); }}
                                className="w-fit flex items-center gap-2 bg-white text-[#1A1A1A] text-sm font-bold px-6 py-3 rounded-full hover:bg-[#FFF3E0] transition-colors shadow-sm"
                            >
                                {mainBanner.boton}
                                <Icon icon="solar:alt-arrow-right-bold" width={14} />
                            </button>
                        )}
                    </div>

                    {/* Hero Image */}
                    {mainBanner.imagenUrl && (
                        <div className="absolute right-0 bottom-0 top-0 w-[55%] hidden md:block">
                            <img
                                src={mainBanner.imagenUrl}
                                alt={mainBanner.titulo}
                                className={`w-full h-full object-contain object-bottom transition-transform duration-700 group-hover:scale-105 ${imgLoaded['main'] ? 'opacity-100' : 'opacity-0'}`}
                                onLoad={() => setImgLoaded(p => ({ ...p, main: true }))}
                            />
                        </div>
                    )}
                </div>

                {/* ── Right Side: 2 Stacked Category Cards ── */}
                <div className="lg:col-span-3 flex flex-row lg:flex-col gap-4 h-[180px] lg:h-full">
                    {sideCards.map((card) => (
                        <div
                            key={card.id}
                            className="flex-1 relative rounded-2xl overflow-hidden cursor-pointer group"
                            style={{ backgroundColor: card.bgColor }}
                            onClick={() => handleBannerClick(card.linkUrl)}
                        >
                            <div className="absolute top-4 left-4 z-10">
                                <h3 className="text-xl font-black text-[#1A1A1A] leading-tight">{card.label}</h3>
                            </div>
                            <img
                                src={card.imagenUrl}
                                alt={card.label}
                                className={`absolute bottom-0 right-0 w-full h-full object-contain object-bottom transition-transform duration-500 group-hover:scale-110 ${imgLoaded[card.id] ? 'opacity-100' : 'opacity-0'}`}
                                onLoad={() => setImgLoaded(p => ({ ...p, [card.id]: true }))}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
