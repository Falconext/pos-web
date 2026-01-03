import { Icon } from '@iconify/react';
import { useState } from 'react';

interface ProductCardProps {
    producto: any;
    slug: string;
    diseno: any;
    onAddToCart: (producto: any) => void;
    onClick?: () => void;
}

export default function ProductCardGlamora({ producto, slug, diseno, onAddToCart, onClick }: ProductCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);

    const getBotonStyle = () => {
        switch (diseno.estiloBoton) {
            case 'square': return 'rounded-none';
            case 'pill': return 'rounded-full';
            default: return 'rounded-xl';
        }
    };

    const btnRadius = getBotonStyle();

    return (
        <div
            className="group flex flex-col h-full bg-white cursor-pointer rounded-xl p-6"
            onClick={onClick}
        >
            {/* Image Container - Aspect Ratio Square/Portrait with Gray BG per reference */}
            <div
                className="relative w-full aspect-[3/4] overflow-hidden rounded-2xl mb-4"
            >
                {/* Loader placeholder */}
                {!imageLoaded && producto.imagenUrl && (
                    <div className="absolute inset-0 animate-pulse" />
                )}

                {producto.imagenUrl ? (
                    <img
                        src={producto.imagenUrl}
                        alt={producto.descripcion}
                        onLoad={() => setImageLoaded(true)}
                        className={`w-full h-full object-scale-down object-center transition-all duration-700 ease-in-out group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        loading="lazy"
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-gray-300">
                        <Icon icon="mdi:image-off" width={48} strokeWidth={1} />
                    </div>
                )}
            </div>

            {/* Info - Matches Reference: Title left, Price right, Category bubbles below */}
            <div className="flex flex-col flex-1 gap-3">
                <div className="flex justify-between items-start gap-4">
                    <h3
                        className="text-sm font-bold text-gray-900 uppercase tracking-wide line-clamp-2 min-h-[2.8rem]"
                        style={{ lineHeight: '1.4' }}
                    >
                        {producto.descripcion}
                    </h3>
                    <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                        S/ {Number(producto.precioUnitario).toFixed(2)}
                    </span>
                </div>

                {/* Categories as Color Swatch Replacements */}
                <div className="flex flex-wrap gap-2">
                    <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600"
                    >
                        {producto.categoria?.nombre || 'General'}
                    </span>
                </div>

                {/* Add to Cart Button */}
                <div className="mt-auto">
                    <button
                        onClick={(e) => { e.stopPropagation(); onAddToCart(producto); }}
                        className={`w-full bg-black text-white py-3 ${btnRadius} text-[10px] font-bold uppercase tracking-widest hover:bg-gray-900 transition-all active:scale-95 flex items-center justify-center gap-2`}
                    >
                        <Icon icon="solar:cart-large-minimalistic-bold" width={16} />
                        Agregar al carrito
                    </button>
                </div>
            </div>
        </div>
    );
}
