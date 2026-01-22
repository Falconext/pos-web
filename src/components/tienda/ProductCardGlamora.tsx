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

    // Extraction of integer and decimal parts for styling
    const price = Number(producto.precioUnitario || 0);
    const priceInt = Math.floor(price);
    const priceDec = price.toFixed(2).split('.')[1];

    // Determine category name and unit safely
    const categoryName = producto.categoria && typeof producto.categoria === 'object'
        ? (producto.categoria.nombre || 'General')
        : (producto.categoria || 'General');

    const unidadMedida = producto.unidadMedida
        ? (typeof producto.unidadMedida === 'object' ? producto.unidadMedida.nombre : producto.unidadMedida)
        : '';

    return (
        <div className="group flex flex-col h-full bg-white overflow-hidden rounded-xl border border-gray-100">
            {/* Clickable Product Info Area - navigates to product detail */}
            <div
                className="flex flex-col items-center cursor-pointer flex-1"
                onClick={onClick}
            >
                {/* Image Area - Centered & Clean */}
                <div className="p-6 pb-4 flex items-center justify-center relative w-full">
                    {producto.imagenUrl ? (
                        <img
                            src={producto.imagenUrl}
                            alt={producto.descripcion}
                            onLoad={() => setImageLoaded(true)}
                            className={`w-32 h-32 object-contain transition-transform duration-500 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-32 h-32 flex items-center justify-center text-gray-200">
                            <Icon icon="solar:box-linear" className="w-12 h-12" />
                        </div>
                    )}
                </div>

                {/* Content - Centered */}
                <div className="flex flex-col items-center px-4 pb-2 text-center flex-1 w-full">
                    {/* Title */}
                    <h3 className="text-[#045659] font-bold text-base leading-tight mb-1 line-clamp-2 min-h-[2.5rem]">
                        {producto.descripcion}
                    </h3>

                    {/* Subtitle - Category in parentheses */}
                    <p className="text-gray-400 text-xs font-normal mb-3">
                        ({categoryName})
                    </p>

                    {/* Unit of Measure */}
                    {unidadMedida && (
                        <p className="text-gray-500 text-xs mb-2">
                            {unidadMedida}
                        </p>
                    )}

                    {/* Price - Large & Centered */}
                    <div className="flex items-start text-[#045659] leading-none mb-4">
                        <span className="text-3xl font-extrabold tracking-tight">
                            {priceInt}.
                        </span>
                        <span className="text-lg font-bold align-top mt-0.5">
                            {priceDec}S/
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom Button Area - Add to Cart */}
            <div className="relative w-full">
                {/* Background section */}
                <div className="bg-[#EDE9E3] h-14 w-full relative flex items-center justify-center rounded-b-xl">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onAddToCart(producto);
                        }}
                        className="w-full h-full flex items-center justify-center hover:bg-[#e8ede3] transition-colors rounded-b-xl cursor-pointer"
                        aria-label="Agregar al carrito"
                    >
                        <Icon icon="mdi:plus" className="w-8 h-8 text-[#2d6a6d] group-hover/btn:scale-110 transition-transform font-bold" />
                    </button>
                </div>
            </div>
        </div>
    );
}
