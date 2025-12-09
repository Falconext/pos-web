import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface SliderBannersProps {
    tienda: any;
    diseno: any;
}

export default function SliderBanners({ tienda, diseno }: SliderBannersProps) {
    const [currentSlide, setCurrentSlide] = useState(0);

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
            case 'small': return 'rounded';
            case 'large': return 'rounded-2xl';
            case 'full': return 'rounded-3xl';
            default: return 'rounded-xl';
        }
    };

    const borderRadius = getBordeRadius();

    return (
        <div className={`relative w-full h-[300px] md:h-[400px] overflow-hidden ${borderRadius} shadow-lg mb-8 group`}>
            {banners.map((banner: any, index: number) => (
                <div
                    key={banner.id}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                    style={{
                        background: banner.imagenUrl ? `url(${banner.imagenUrl}) center/cover no-repeat` : banner.bgGradient
                    }}
                >
                    {/* Overlay si hay imagen para mejorar legibilidad */}
                    {banner.imagenUrl && <div className="absolute inset-0 bg-black/40"></div>}

                    <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 text-white">
                        <div className={`transition-all duration-700 transform ${index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                            <span className="inline-block py-1 px-3 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold uppercase tracking-wider mb-4 border border-white/30">
                                Destacado
                            </span>
                            <h2 className="text-4xl md:text-6xl font-bold mb-4 leading-tight max-w-2xl">
                                {banner.titulo}
                            </h2>
                            <p className="text-lg md:text-xl mb-8 opacity-90 max-w-xl">
                                {banner.subtitulo}
                            </p>
                            <button
                                className={`bg-white text-gray-900 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-transform hover:scale-105 active:scale-95 shadow-lg`}
                                style={{ color: diseno.colorPrimario }}
                            >
                                {banner.boton || 'Ver más'}
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            {/* Indicadores */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
                {banners.map((_: any, index: number) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-8 bg-white' : 'bg-white/50 hover:bg-white/80'
                            }`}
                        aria-label={`Ir a slide ${index + 1}`}
                    />
                ))}
            </div>

            {/* Flechas de navegación (visibles en hover) */}
            <button
                onClick={() => setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100 z-20"
            >
                <Icon icon="mdi:chevron-left" width={32} />
            </button>
            <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % banners.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100 z-20"
            >
                <Icon icon="mdi:chevron-right" width={32} />
            </button>
        </div>
    );
}
