import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface SliderBannersProps {
    tienda: any;
    diseno: any;
}

export default function SliderBanners({ tienda, diseno }: SliderBannersProps) {
    const navigate = useNavigate();
    const { slug } = useParams();
    const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({});

    const handleImageLoad = (index: number) => {
        setImagesLoaded(prev => ({ ...prev, [index]: true }));
    };

    const handleBannerClick = (url: string) => {
        if (!url) return;

        // Handle external links
        if (url.startsWith('http') || url.startsWith('//')) {
            window.location.href = url;
            return;
        }

        // Handle absolute internal paths (user copied full path possibly without domain)
        // If it starts with /tienda or tienda, treat as absolute from root
        if (url.startsWith('/tienda') || url.startsWith('tienda')) {
            const absolutePath = url.startsWith('/') ? url : `/${url}`;
            navigate(absolutePath);
            return;
        }

        // Handle relative paths (e.g. "producto/123")
        // Clean leading slash from relative path only
        const relativePath = url.startsWith('/') ? url.substring(1) : url;

        // Navigate relative to store slug to keep user in store context
        navigate(`/tienda/${slug}/${relativePath}`);
    };

    // Mockup Banners Data - Matching "PioMart" Style (Spanish)
    const mockBanners = [
        {
            id: 'main-1',
            type: 'main', // Large Slider
            titulo: 'Mejores Muebles',
            subtitulo: 'Salas, comedores y escritorios para crear la armonía perfecta en tu hogar.',
            boton: 'Ver Catálogo',
            imagenUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=2070', // Sofa/Furniture
            bgGradient: 'bg-[#E5EADF]' // Light sage/gray background - Soft and clean
        },
        {
            id: 'main-2',
            type: 'main',
            titulo: 'Iluminación Moderna',
            subtitulo: 'Ilumina tus espacios con nuestra colección exclusiva de lámparas.',
            boton: 'Ver Colección',
            imagenUrl: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&q=80&w=1935', // Lamp
            bgGradient: 'bg-[#F0F0F0]'
        },
        {
            id: 'side-1',
            type: 'sidebar', // Tall Right Banner
            titulo: 'Estilos Para Tu Temporada',
            subtitulo: 'Gran Liquidación 50%',
            boton: 'Comprar',
            imagenUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1020', // Fashion Model
            bgGradient: 'bg-[#FDF3E7]' // Light beige/peach
        },
        {
            id: 'sub-1',
            type: 'sub', // Bottom Left 1
            titulo: 'Moda Hombres',
            subtitulo: 'Liquidación 50%',
            boton: 'Ver Más',
            imagenUrl: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&q=80&w=1000', // Men Fashion
            bgGradient: 'bg-[#E6F0F5]' // Light blueish gray
        },
        {
            id: 'sub-2',
            type: 'sub', // Bottom Left 2
            titulo: 'Verano',
            subtitulo: 'Hasta 30% Dscto en Tienda',
            highlighedText: '30% OFF',
            boton: null, // No button, just clickable card
            imagenUrl: 'https://images.unsplash.com/photo-1519238263496-6362d74c1123?auto=format&fit=crop&q=80&w=1000', // Kid/Summer
            bgGradient: 'bg-[#FFF0F0]' // Very light pink
        }
    ];

    // Use store banners if available, otherwise use mock
    const hasLiveBanners = tienda?.banners && Array.isArray(tienda.banners) && tienda.banners.length > 0;

    // Process live banners to match expected structure
    const processedLiveBanners = hasLiveBanners ? tienda.banners.map((b: any) => {
        let type = 'sub';
        let bgGradient = 'bg-gray-100';

        // Simple mapping based on order
        if (b.orden === 0) { type = 'main'; bgGradient = 'bg-[#E3EDE5]'; } // 1st = Main
        else if (b.orden === 1) { type = 'main'; bgGradient = 'bg-[#F0F0F0]'; } // 2nd = Main (if exists)
        else if (b.orden === 2) { type = 'sidebar'; bgGradient = 'bg-[#FDF3E7]'; } // 3rd = Sidebar
        else { type = 'sub'; bgGradient = 'bg-[#E6F0F5]'; } // Rest = Sub

        return {
            id: b.id,
            type,
            titulo: b.titulo || '',
            subtitulo: b.subtitulo || '',
            boton: b.linkUrl ? (b.boton || 'Ver más') : null, // Show button if link exists
            imagenUrl: b.imagenUrl,
            bgGradient,
            linkUrl: b.linkUrl,
            highlighedText: b.orden >= 3 ? 'Oferta' : undefined
        };
    }) : [];

    const bannersToUse = hasLiveBanners ? processedLiveBanners : mockBanners;

    // --- LOGIC UPDATE: Intelligent Slot Filling ---
    // 1. Main Banner: Always the first available one
    const mainBanner = bannersToUse.length > 0 ? bannersToUse[0] : null;

    // Filter remaining
    const remainingAfterMain = bannersToUse.filter((b: any) => b !== mainBanner);

    // 2. Side Banner: Explicit sidebar OR the next available one
    let sideBanner = remainingAfterMain.find((b: any) => b.type === 'sidebar');
    if (!sideBanner && remainingAfterMain.length > 0) {
        sideBanner = remainingAfterMain[0];
    }

    // Filter remaining
    const remainingAfterSide = remainingAfterMain.filter((b: any) => b !== sideBanner);

    // 3. Sub Banners: Use ALL remaining banners
    const subBanners = remainingAfterSide;

    const renderButton = (text: string | null, colorClass: string = 'bg-[#045659]') => {
        if (!text) return null;
        return (
            <button className={`${colorClass} text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all`}>
                {text}
            </button>
        );
    };

    if (!mainBanner) return null;

    return (
        <div className="max-w-screen-xl mx-auto px-3 md:px-8 py-4 md:py-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-6 h-auto lg:h-[520px]">

                {/* LEFT COLUMN: Main + Sub Banners */}
                <div className="lg:col-span-8 flex flex-col gap-6 h-full">

                    {/* TOP: Main Banner (Static, no slider) */}
                    <div className="w-full lg:flex-1 relative rounded-2xl md:rounded-3xl overflow-hidden shadow-sm group h-[320px] lg:h-auto">
                        <div className={`absolute inset-0 ${mainBanner.bgGradient}`}>
                            <div className="h-full w-full flex flex-col md:flex-row items-center relative">
                                {/* Content Top/Left */}
                                <div
                                    className={`w-full md:w-1/2 p-6 md:p-12 z-20 flex flex-col justify-center items-start h-[60%] md:h-full ${mainBanner.linkUrl ? 'cursor-pointer' : ''}`}
                                    onClick={() => handleBannerClick(mainBanner.linkUrl)}
                                >
                                    <span className="inline-block bg-white/60 backdrop-blur-sm text-[#045659] text-xs font-bold px-3 py-1 rounded-md mb-2 md:mb-4 uppercase tracking-wider">
                                        Tendencia
                                    </span>
                                    <h2 className="text-2xl md:text-5xl font-extrabold text-[#1a1a1a] mb-2 md:mb-4 leading-tight">
                                        {mainBanner.titulo}
                                    </h2>
                                    <p className="text-gray-600 mb-4 md:mb-8 text-xs md:text-base max-w-sm leading-relaxed line-clamp-2 md:line-clamp-none">
                                        {mainBanner.subtitulo}
                                    </p>
                                    <div onClick={(e) => { e.stopPropagation(); handleBannerClick(mainBanner.linkUrl); }}>
                                        {renderButton(mainBanner.boton)}
                                    </div>
                                </div>

                                {/* Image Bottom/Right */}
                                <div className="w-full h-[40%] md:absolute md:right-0 md:top-0 md:bottom-0 md:w-1/2 md:h-full">
                                    <img
                                        src={mainBanner.imagenUrl}
                                        className={`w-full h-full object-contain object-bottom md:object-center top-0 relative transition-transform duration-700 ease-in-out ${imagesLoaded[mainBanner.id] ? 'opacity-100' : 'opacity-0'}`}
                                        onLoad={() => handleImageLoad(mainBanner.id)}
                                        alt={mainBanner.titulo}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[var(--tw-gradient-from)] via-transparent to-transparent md:hidden" />
                                </div>

                                {/* Decoration */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[450px] md:h-[450px] bg-white/30 rounded-full blur-3xl -z-10" />
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM: Sub Banners Grid */}
                    <div className="min-h-[150px] grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                        {subBanners.map((banner: any) => (
                            <div
                                key={banner.id}
                                className={`rounded-xl md:rounded-3xl overflow-hidden relative shadow-sm hover:shadow-md transition-all group ${banner.bgGradient} ${banner.linkUrl ? 'cursor-pointer' : ''} h-[160px] md:h-auto`}
                                onClick={() => handleBannerClick(banner.linkUrl)}
                            >
                                <div className="absolute inset-0 flex items-center justify-between p-3 md:p-6">
                                    <div className="w-1/2 z-10 flex flex-col items-start justify-center h-full">
                                        <div className="text-xs font-bold text-[#E94E55] mb-1 uppercase tracking-wide">
                                            {banner.highlighedText || 'Oferta'}
                                        </div>
                                        <h3 className="text-xl md:text-2xl font-extrabold text-[#1a1a1a] mb-2 md:mb-4 leading-tight line-clamp-2 pr-1">
                                            {banner.titulo}
                                        </h3>
                                        {banner.boton ? (
                                            <button className="bg-[#1a1a1a] text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-[#333] transition-colors shadow-lg">
                                                {banner.boton}
                                            </button>
                                        ) : (
                                            <div className="text-[#045659] font-black text-lg md:text-3xl">
                                                {banner.subtitulo}
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-1/2 h-full absolute right-0 bottom-0">
                                        <img
                                            src={banner.imagenUrl}
                                            className="w-full h-full object-cover object-bottom transition-transform duration-500 group-hover:scale-110"
                                            alt={banner.titulo}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>

                {/* RIGHT COLUMN: Tall Sidebar Banner */}
                {sideBanner && (
                    <div className="lg:col-span-4 h-[320px] lg:h-full relative rounded-2xl md:rounded-3xl overflow-hidden shadow-sm group bg-[#F7ECDC]">
                        <div className="absolute inset-0 flex flex-col md:block h-full w-full">
                            {/* Text Content */}
                            <div className="p-6 md:p-8 flex flex-col justify-center items-start h-[60%] md:h-full lg:absolute lg:inset-0 lg:z-20">
                                <span className="text-[#8B5E3C] font-bold mb-2 uppercase tracking-wide text-xs md:text-base">Colección</span>
                                <h2 className="text-2xl md:text-5xl font-extrabold text-[#1a1a1a] mb-3 md:mb-6 leading-[1.1]">
                                    {sideBanner.titulo}
                                </h2>
                                <p className="text-gray-700 mb-4 text-xs md:text-sm font-medium line-clamp-2 md:line-clamp-none">
                                    {sideBanner.subtitulo}
                                </p>
                                <button className="bg-[#A05C33] text-white px-6 py-2 md:px-8 md:py-3 rounded-full text-xs md:text-sm font-bold shadow-xl hover:bg-[#8B4D28] transition-colors w-fit md:mt-auto md:mb-12 lg:mb-0">
                                    {sideBanner.boton || 'Comprar'}
                                </button>
                            </div>

                            {/* Image Content */}
                            <div className="w-full h-[40%] md:absolute md:bottom-0 md:right-0 md:w-full md:h-3/5 lg:h-2/2 lg:z-10 md:p-4">
                                <img
                                    src={sideBanner.imagenUrl}
                                    className="w-full h-full object-contain md:object-cover object-bottom md:object-top lg:object-bottom transition-transform duration-700"
                                    alt={sideBanner.titulo}
                                />
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
