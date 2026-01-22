import { Icon } from '@iconify/react';
import { useState } from 'react';

interface ProductCardProps {
    producto: any;
    slug: string;
    diseno: any;
    onAddToCart: (producto: any) => void;
    onClick?: () => void;
}

export default function ProductCardGromuse({ producto, diseno, onAddToCart, onClick }: ProductCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);

    // Parse price to separate integer and decimal for styling
    const priceStr = Number(producto.precioUnitario || 0).toFixed(2);
    const [intPart, decPart] = priceStr.split('.');

    const colorPrimario = diseno?.colorPrimario || '#045659';

    return (
        <div
            className="group relative flex flex-col h-full bg-white border border-gray-200 rounded-xl p-4 hover:shadow-xl transition-all duration-300 cursor-pointer"
            onClick={onClick}
        >
            {/* Image Container */}
            <div className="relative w-full aspect-[4/3] mb-4 overflow-hidden flex items-center justify-center">
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

            {/* Info - Left Aligned */}
            <div className="flex flex-col flex-1 gap-1">
                {/* Brand / Unit (Optional) */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    {producto.marca?.nombre ? (
                        <>
                            <Icon icon="solar:tag-horizontal-linear" />
                            <span>{producto.marca.nombre}</span>
                        </>
                    ) : (
                        <span className="text-gray-400">
                            {typeof producto.unidadMedida === 'object'
                                ? (producto.unidadMedida.nombre || producto.unidadMedida.codigo || 'Unidad')
                                : (producto.unidadMedida || 'Unidad')}
                        </span>
                    )}
                </div>

                <h3 className="text-gray-800 font-bold text-base leading-snug line-clamp-2 min-h-[2.5em] group-hover:text-blue-600 transition-colors" title={producto.descripcion}>
                    {producto.descripcion}
                </h3>

                {/* Price */}
                <div className="mt-auto pt-2 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-gray-900">
                        S/ {Number(producto.precioUnitario).toFixed(2)}
                    </span>
                    {producto.precioOriginal && Number(producto.precioOriginal) > Number(producto.precioUnitario) && (
                        <span className="text-sm text-gray-400 line-through">
                            S/ {Number(producto.precioOriginal).toFixed(2)}
                        </span>
                    )}
                </div>

                {/* Add Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onAddToCart(producto); }}
                    className="mt-4 w-full py-2.5 rounded-full flex items-center justify-center gap-2 text-sm font-bold text-white shadow-sm transition-all hover:brightness-90 hover:shadow-md"
                    style={{ backgroundColor: colorPrimario }}
                >
                    <Icon icon="solar:cart-plus-bold" width={18} />
                    Añadir al Carrito
                </button>
            </div>
        </div>
    );
}
