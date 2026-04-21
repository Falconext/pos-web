import { Icon } from '@iconify/react';
import { useState } from 'react';

interface PromoBannersProps {
    tienda?: any;
    banners?: {
        titulo: string;
        subtitulo?: string;
        badge?: string;
        boton?: string;
        imagenUrl?: string;
        bgColor: string;
        textColor?: string;
        badgeColor?: string;
    }[];
}

const DEFAULT_BANNERS = [
    {
        titulo: 'Productos seleccionados con el mayor cuidado',
        subtitulo: '',
        badge: 'Garantía de calidad',
        boton: 'Ver más',
        imagenUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600',
        bgColor: '#C8F5C0',
        textColor: '#1A1A1A',
        badgeColor: '#22C55E',
    },
    {
        titulo: 'Para el confort y la comodidad de tu hogar',
        subtitulo: 'Accesorios, decoración y más — elegidos para ti.',
        badge: '',
        boton: 'Ver más',
        imagenUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=600',
        bgColor: '#FFD49A',
        textColor: '#1A1A1A',
        badgeColor: '',
    },
];

export default function PromoBanners({ tienda, banners }: PromoBannersProps) {
    const [imgLoaded, setImgLoaded] = useState<Record<number, boolean>>({});
    const cards = banners || DEFAULT_BANNERS;

    return (
        <div className="max-w-screen-xl mx-auto px-5 md:px-8 mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map((card, i) => (
                    <div
                        key={i}
                        className="relative rounded-3xl overflow-hidden h-[220px] md:h-[260px] cursor-pointer group"
                        style={{ backgroundColor: card.bgColor }}
                    >
                        {/* Text */}
                        <div className="absolute left-0 top-0 bottom-0 w-[55%] p-7 flex flex-col justify-between z-10">
                            <div>
                                {card.badge && (
                                    <span
                                        className="inline-flex items-center gap-1.5 text-white text-[10px] font-black px-3 py-1.5 rounded-full mb-4"
                                        style={{ backgroundColor: card.badgeColor || '#22C55E' }}
                                    >
                                        <Icon icon="solar:check-circle-bold" width={11} />
                                        {card.badge}
                                    </span>
                                )}
                                <h3 className="text-xl md:text-2xl font-black leading-[1.2]" style={{ color: card.textColor || '#1A1A1A' }}>
                                    {card.titulo}
                                </h3>
                                {card.subtitulo && (
                                    <p className="text-sm text-[#555] mt-2 leading-relaxed">{card.subtitulo}</p>
                                )}
                            </div>
                            {card.boton && (
                                <button className="w-fit flex items-center gap-2 bg-white text-[#1A1A1A] text-xs font-bold px-5 py-2.5 rounded-full hover:shadow-md transition-shadow">
                                    {card.boton}
                                    <Icon icon="solar:alt-arrow-right-bold" width={12} />
                                </button>
                            )}
                        </div>

                        {/* Image */}
                        {card.imagenUrl && (
                            <div className="absolute right-0 bottom-0 top-0 w-[48%]">
                                <img
                                    src={card.imagenUrl}
                                    alt={card.titulo}
                                    className={`w-full h-full object-contain object-bottom transition-transform duration-500 group-hover:scale-105 ${imgLoaded[i] ? 'opacity-100' : 'opacity-0'}`}
                                    onLoad={() => setImgLoaded(p => ({ ...p, [i]: true }))}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
