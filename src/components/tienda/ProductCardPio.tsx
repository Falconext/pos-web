import { Icon } from '@iconify/react';
import { useState } from 'react';

interface ProductCardProps {
    producto: any;
    slug: string;
    diseno: any;
    onAddToCart: (producto: any) => void;
    onClick?: () => void;
}

export default function ProductCardPio({ producto, diseno, onAddToCart, onClick }: ProductCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);

    // Parse price
    const price = Number(producto.precioUnitario || 0);
    const originalPrice = Number(producto.precioOriginal || 0);
    const hasDiscount = originalPrice > price;

    const colorPrimario = diseno?.colorPrimario || '#045659';

    return (
        <div
            className="group relative flex flex-col h-full bg-white border border-gray-100 rounded-2xl p-4 transition-all duration-300 hover:shadow-xl hover:border-gray-200 cursor-pointer"
            onClick={onClick}
        >

            {/* Image Container */}
            <div className="relative w-full aspect-square mb-4 overflow-hidden flex items-center justify-center p-2">
                {producto.imagenUrl ? (
                    <img
                        src={producto.imagenUrl}
                        alt={producto.descripcion}
                        onLoad={() => setImageLoaded(true)}
                        className={`max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-50 rounded-xl flex items-center justify-center">
                        <Icon icon="solar:box-linear" className="text-gray-300 w-16 h-16" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex flex-col flex-1">
                {/* Title */}
                <h3 className="text-gray-900 font-bold text-sm md:text-base leading-snug line-clamp-2 mb-1 min-h-[2.5em] group-hover:text-[#045659] transition-colors" title={producto.descripcion}>
                    {producto.descripcion}
                </h3>

                {/* Brand name mock */}
                <div className="flex items-center gap-1 text-xs text-gray-400 font-medium mb-3">
                    <Icon icon="solar:tag-linear" width={12} />
                    <span>{producto.marca?.nombre || 'Exclusivo'}</span>
                </div>

                {/* Bottom Action Area: Price swaps with Button on Hover */}
                <div className="mt-auto relative h-11 w-full flex items-center">
                    {/* Price - Visible by default, Disappears on Hover */}
                    <div className="absolute inset-0 flex items-baseline gap-2 transition-opacity duration-300 opacity-100 group-hover:opacity-0 z-10">
                        <span className="text-lg font-extrabold text-[#045659]">
                            S/ {price.toFixed(2)}
                        </span>
                        {hasDiscount && (
                            <span className="text-sm text-gray-400 line-through font-medium">
                                S/ {originalPrice.toFixed(2)}
                            </span>
                        )}
                    </div>

                    {/* Button - Hidden by default, Appears on Hover replacing Price */}
                    <div onClick={(e) => { e.stopPropagation(); onAddToCart(producto); }} className='absolute  inset-0 w-full h-full rounded-full bg-[#045659] text-white text-sm font-bold flex items-center justify-center gap-2 transition-opacity duration-300 opacity-0 group-hover:opacity-100 shadow-md z-20 hover:bg-[#034042]'>
                        <Icon icon="solar:cart-plus-bold" width={18} />
                        Añadir al Carrito
                    </div>
                </div>
            </div>
        </div>
    );
}
