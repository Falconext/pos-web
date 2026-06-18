import { Icon } from '@iconify/react';
import { useState } from 'react';
import ProductCardActions from '@/components/tienda/ProductCardActions';

interface ProductCardProps {
    producto: any;
    slug: string;
    diseno: any;
    onAddToCart: (producto: any) => void;
    onClick?: () => void;
}

export default function ProductCardEmox({ producto, slug, diseno, onAddToCart, onClick }: ProductCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <div
            className="group flex flex-col h-full bg-white rounded-xl p-4 transition-all duration-300 hover:shadow-lg cursor-pointer border border-transparent hover:border-gray-100"
            onClick={onClick}
        >
            {/* Image Container */}
            <div className="relative w-full aspect-square bg-[#F4F6F8] rounded-2xl mb-4 overflow-hidden flex items-center justify-center p-4">
                {/* Action buttons */}
                <div className="absolute top-3 right-3 z-10">
                  <ProductCardActions producto={producto} slug={slug} cp={diseno?.colorPrimario || '#000'} />
                </div>

                {producto.imagenUrl ? (
                    <img
                        src={producto.imagenUrl}
                        alt={producto.descripcion}
                        onLoad={() => setImageLoaded(true)}
                        className={`max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        loading="lazy"
                    />
                ) : (
                    <Icon icon="solar:box-linear" className="text-gray-300 w-16 h-16" />
                )}
            </div>

            {/* Info */}
            <div className="flex flex-col flex-1 gap-1">
                <h3 className="text-gray-900 font-medium text-[15px] leading-snug line-clamp-2 min-h-[42px]" title={producto.descripcion}>
                    {producto.descripcion}
                </h3>

                <div className="mt-1" />

                {/* Price & Add Button */}
                <div className="mt-3 flex items-end justify-between">
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-gray-900">
                            S/ {Number(producto.precioUnitario).toFixed(2)}
                        </span>
                        {/* Mock old price if needed */}
                        {/* <span className="text-xs text-gray-400 line-through">S/ {(Number(producto.precioUnitario) * 1.2).toFixed(2)}</span> */}
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); onAddToCart(producto); }}
                        className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                    >
                        Agregar
                    </button>
                </div>
            </div>
        </div>
    );
}
