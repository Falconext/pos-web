import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SliderBannersProps {
    tienda: any;
    diseno: any;
}

export default function SliderBanners({ tienda, diseno }: SliderBannersProps) {
    const navigate = useNavigate();
    const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({});

    const handleImageLoad = (index: number) => {
        setImagesLoaded(prev => ({ ...prev, [index]: true }));
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
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[520px]">

                {/* LEFT COLUMN: Main + Sub Banners */}
                <div className="lg:col-span-8 flex flex-col gap-6 h-full">

                    {/* TOP: Main Banner (Static, no slider) */}
                    <div className="flex-1 relative rounded-3xl overflow-hidden shadow-sm group h-[300px] lg:h-auto">
                        <div className={`absolute inset-0 ${mainBanner.bgGradient}`}>
                            <div className="h-full w-full flex items-center relative">
                                {/* Content Left */}
                                <div
                                    className={`w-full md:w-1/2 p-8 md:p-12 z-20 flex flex-col justify-center items-start ${mainBanner.linkUrl ? 'cursor-pointer' : ''}`}
                                    onClick={() => mainBanner.linkUrl && navigate(mainBanner.linkUrl)}
                                >
                                    <span className="inline-block bg-white/60 backdrop-blur-sm text-[#045659] text-xs font-bold px-3 py-1 rounded-md mb-4 uppercase tracking-wider">
                                        Tendencia
                                    </span>
                                    <h2 className="text-3xl md:text-5xl font-extrabold text-[#1a1a1a] mb-4 leading-tight">
                                        {mainBanner.titulo}
                                    </h2>
                                    <p className="text-gray-600 mb-8 text-sm md:text-base max-w-sm leading-relaxed">
                                        {mainBanner.subtitulo}
                                    </p>
                                    <div onClick={(e) => { e.stopPropagation(); mainBanner.linkUrl && navigate(mainBanner.linkUrl); }}>
                                        {renderButton(mainBanner.boton)}
                                    </div>
                                </div>

                                {/* Image Right */}
                                <div className="absolute right-0 top-0 bottom-0 w-3/5 md:w-1/2">
                                    <img
                                        src={mainBanner.imagenUrl}
                                        className={`w-full h-full object-contain top-4 relative object-center group-hover:translate-x-0 transition-transform duration-700 ease-in-out ${imagesLoaded[mainBanner.id] ? 'opacity-100' : 'opacity-0'}`}
                                        onLoad={() => handleImageLoad(mainBanner.id)}
                                        alt={mainBanner.titulo}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--tw-gradient-from)] via-transparent to-transparent md:hidden" />
                                </div>

                                {/* Decoration */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[450px] md:h-[450px] bg-white/30 rounded-full blur-3xl -z-10" />
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM: Sub Banners Grid */}
                    <div className="min-h-[200px] grid grid-cols-1 md:grid-cols-2 gap-6">
                        {subBanners.map((banner: any) => (
                            <div
                                key={banner.id}
                                className={`rounded-3xl overflow-hidden relative shadow-sm hover:shadow-md transition-all group ${banner.bgGradient} ${banner.linkUrl ? 'cursor-pointer' : ''}`}
                                onClick={() => banner.linkUrl && navigate(banner.linkUrl)}
                            >
                                <div className="absolute inset-0 flex items-center justify-between p-6">
                                    <div className="w-1/2 z-10 flex flex-col items-start justify-center h-full">
                                        <div className="text-xs font-bold text-[#E94E55] mb-1 uppercase tracking-wide">
                                            {banner.highlighedText || 'Oferta'}
                                        </div>
                                        <h3 className="text-xl md:text-2xl font-extrabold text-[#1a1a1a] mb-4 leading-tight">
                                            {banner.titulo}
                                        </h3>
                                        {banner.boton ? (
                                            <button className="bg-[#1a1a1a] text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-[#333] transition-colors shadow-lg">
                                                {banner.boton}
                                            </button>
                                        ) : (
                                            <div className="text-[#045659] font-black text-2xl lg:text-3xl">
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
                    <div className="lg:col-span-4 h-[400px] lg:h-full relative rounded-3xl overflow-hidden shadow-sm group bg-[#F7ECDC]">
                        <div className="absolute inset-0 p-8 flex flex-col h-full z-20">
                            <span className="text-[#8B5E3C] font-bold mb-2 uppercase tracking-wide">Colección</span>
                            <h2 className="text-3xl md:text-5xl font-extrabold text-[#1a1a1a] mb-6 leading-[1.1]">
                                {sideBanner.titulo}
                            </h2>
                            <p className="text-gray-700 mb-6 text-sm font-medium">
                                {sideBanner.subtitulo}
                            </p>
                            <button className="bg-[#A05C33] text-white px-8 py-3 rounded-full text-sm font-bold shadow-xl hover:bg-[#8B4D28] transition-colors w-fit mt-auto mb-12 lg:mb-0">
                                {sideBanner.boton || 'Comprar'}
                            </button>
                        </div>
                        <div className="absolute bottom-0 right-0 w-full h-3/5 lg:h-2/2 z-10 p-4">
                            <img
                                src={sideBanner.imagenUrl}
                                className="w-full h-full object-cover object-top lg:object-bottom transition-transform duration-700"
                                alt={sideBanner.titulo}
                            />
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
