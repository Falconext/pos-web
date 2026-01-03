import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface SliderBannersProps {
    tienda: any;
    diseno: any;
}

export default function SliderBanners({ tienda, diseno }: SliderBannersProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({});

    const handleImageLoad = (index: number) => {
        setImagesLoaded(prev => ({ ...prev, [index]: true }));
    };

    // Banners por defecto si no hay configurados (mockup para "hermosa y profesional")
    const defaultBanners = [
        {
            id: 1,
            titulo: 'Ofertas de Temporada',
            subtitulo: 'Descuentos de hasta 50%',
            bgGradient: `linear-gradient(135deg, ${diseno.colorPrimario || '#f97316'}, ${diseno.colorSecundario || '#ef4444'})`,
            imagen: null, // Usar gradiente
            boton: 'Ver ofertas'
        },
        {
            id: 2,
            titulo: 'Nuevos Productos',
            subtitulo: 'Descubre lo último en nuestro catálogo',
            bgGradient: `linear-gradient(135deg, ${diseno.colorSecundario || '#ef4444'}, ${diseno.colorAccento || '#3b82f6'})`,
            imagen: null,
            boton: 'Explorar'
        },
        {
            id: 3,
            titulo: 'Envío Gratis',
            subtitulo: 'En compras mayores a S/ 100',
            bgGradient: `linear-gradient(135deg, ${diseno.colorAccento || '#3b82f6'}, ${diseno.colorPrimario || '#f97316'})`,
            imagen: null,
            boton: 'Más info'
        }
    ];

    // Si la tienda tiene banners reales (feature premium), usarlos. Si no, usar defaults bonitos.
    // Asumimos que tienda.banners vendría del backend si tuviera el feature.
    const banners = tienda.banners && tienda.banners.length > 0 ? tienda.banners : defaultBanners;

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [banners.length]);

    const getBordeRadius = () => {
        switch (diseno.bordeRadius) {
            case 'none': return 'rounded-none';
            case 'small': return 'rounded-lg';
            case 'large': return 'rounded-2xl';
            case 'full': return 'rounded-[2rem]'; // More rounded
            default: return 'rounded-2xl';
        }
    };

    const borderRadius = getBordeRadius();

    // Lógica de Grid (Split Layout)
    const hasSideBanner = banners.length > 1;
    const mainBanners = hasSideBanner ? banners.slice(0, banners.length - 1) : banners;
    const sideBanner = hasSideBanner ? banners[banners.length - 1] : null;

    // Ajustar slide index si cambia la longitud
    useEffect(() => {
        if (currentSlide >= mainBanners.length) {
            setCurrentSlide(0);
        }
    }, [mainBanners.length]);

    // Timer para slider
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % mainBanners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [mainBanners.length]);

    const renderBannerContent = (banner: any, showText = true) => (
        <>
            {banner.imagenUrl ? (
                <div className="relative w-full h-full">
                    {/* Skeleton loader */}
                    {!imagesLoaded[banner.id] && (
                        <div className="absolute inset-0 bg-gray-200 animate-pulse z-20" />
                    )}

                    <img
                        src={banner.imagenUrl}
                        alt={banner.titulo || 'Banner'}
                        className={`w-full h-full object-cover transition-opacity duration-700 ease-in-out ${imagesLoaded[banner.id] ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => handleImageLoad(banner.id)}
                    />
                </div>
            ) : (
                <div
                    className="w-full h-full relative"
                    style={{ background: banner.bgGradient }}
                >
                    {showText && (
                        <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-12 text-white">
                            <span className="inline-block py-1 px-3 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold uppercase tracking-wider mb-3 border border-white/30 w-fit">
                                Destacado
                            </span>
                            <h2 className="text-3xl md:text-5xl font-bold mb-3 leading-tight">
                                {banner.titulo}
                            </h2>
                            <p className="text-base md:text-lg mb-6 opacity-90">
                                {banner.subtitulo}
                            </p>
                            <button
                                className="bg-white text-gray-900 px-6 py-2.5 rounded-full font-bold hover:bg-gray-100 transition-transform hover:scale-105 active:scale-95 shadow-lg w-fit"
                                style={{ color: diseno.colorPrimario }}
                            >
                                {banner.boton || 'Ver más'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );

    return (
        <div className={`grid grid-cols-1 ${hasSideBanner ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-6 mb-12`}>
            {/* Main Slider (Left) */}
            <div className={`relative w-full h-[300px] md:h-[420px] overflow-hidden ${borderRadius} shadow-sm group md:col-span-2`}>
                {mainBanners.map((banner: any, index: number) => (
                    <div
                        key={banner.id}
                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    >
                        {renderBannerContent(banner, true)}
                    </div>
                ))}

                {/* Indicadores Slider */}
                {mainBanners.length > 1 && (
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
                        {mainBanners.map((_: any, index: number) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-8 bg-white' : 'bg-white/50 hover:bg-white/80'}`}
                                aria-label={`Ir a slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Side Banner (Right) */}
            {hasSideBanner && sideBanner && (
                <div className={`relative w-full h-[300px] md:h-[420px] overflow-hidden ${borderRadius} shadow-sm md:col-span-1 block`}>
                    {renderBannerContent(sideBanner, true)}
                </div>
            )}
        </div>
    );
}
