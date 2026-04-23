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
    const [wished, setWished] = useState(false);
    const [added, setAdded] = useState(false);

    const price = Number(producto.precioUnitario || 0);
    const originalPrice = Number(producto.precioOriginal || 0);
    const hasDiscount = originalPrice > price;
    const discountPct = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

    // Mock deterministic flags based on product id
    const isVetApproved = (producto.id % 3 === 0);
    const isSpecialDeal = hasDiscount && (producto.id % 2 === 0);

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAddToCart(producto);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
    };

    const handleWish = (e: React.MouseEvent) => {
        e.stopPropagation();
        setWished(w => !w);
    };

    return (
        <div
            className="group flex flex-col bg-white rounded-2xl overflow-hidden cursor-pointer transition-shadow duration-200 hover:shadow-md"
            onClick={onClick}
        >
            {/* Image Area */}
            <div className="relative bg-[#FAF6F1] aspect-square overflow-hidden">

                {/* Top Seller Badge */}
                <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
                    <span className="bg-[#FF9500] text-white text-[9px] font-black px-2.5 py-1 rounded-full">
                        Top Seller
                    </span>
                    {isVetApproved && (
                        <span className="bg-[#22C55E] text-white text-[9px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                            <Icon icon="solar:check-circle-bold" width={10} />
                            Garantizado
                        </span>
                    )}
                </div>

                {/* Heart */}
                <button
                    onClick={handleWish}
                    className="absolute top-2.5 right-2.5 z-10 w-7 h-7 flex items-center justify-center"
                    title="Favorito"
                >
                    <Icon
                        icon={wished ? 'solar:heart-bold' : 'solar:heart-linear'}
                        width={20}
                        className={wished ? 'text-[#FF9500]' : 'text-[#BBBBB0]'}
                    />
                </button>

                {/* Product Image */}
                {producto.imagenUrl ? (
                    <img
                        src={producto.imagenUrl}
                        alt={producto.descripcion}
                        onLoad={() => setImageLoaded(true)}
                        className={`w-full h-full object-contain bg-[#fff] p-6 transition-transform duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Icon icon="solar:box-linear" className="text-[#DDD]" width={48} />
                    </div>
                )}
            </div>

            {/* Card Body */}
            <div className="flex flex-col flex-1 px-3 pt-3 pb-0">

                {/* Discount badges row */}
                {hasDiscount && (
                    <div className="flex items-center gap-1.5 mb-2">
                        <span className="bg-[#EF4444] text-white text-[9px] font-black px-2 py-0.5 rounded">
                            -{discountPct}%
                        </span>
                        {isSpecialDeal && (
                            <span className="bg-[#FF9500] text-white text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-0.5">
                                <Icon icon="solar:fire-bold" width={9} />
                                Oferta
                            </span>
                        )}
                    </div>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-1">
                    {hasDiscount ? (
                        <>
                            <span className="text-base font-black text-[#EF4444]">
                                S/ {price.toFixed(2)}
                            </span>
                            <span className="text-xs text-[#999] line-through">
                                S/ {originalPrice.toFixed(2)}
                            </span>
                        </>
                    ) : (
                        <span className="text-base font-black text-[#1A1A1A]">
                            S/ {price.toFixed(2)}
                        </span>
                    )}
                </div>

                {/* Product Name */}
                <h3
                    className="text-xs text-[#555] leading-snug line-clamp-2 mb-2 min-h-[2.4em]"
                    title={producto.descripcion}
                >
                    {producto.descripcion}
                </h3>

                <div className="mb-3" />
            </div>

            {/* Buy Button - Full Width Bottom */}
            <div className='p-3'>
                <button
                    onClick={handleAdd}
                    className={`w-full rounded-xl flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors ${added
                        ? 'bg-[#22C55E] text-white'
                        : 'bg-[#FEF0DC] text-[#FF9503] hover:bg-[#FF9503] hover:text-white'
                        }`}
                >
                    <Icon icon={added ? 'solar:check-circle-bold' : 'solar:cart-large-2-bold'} width={18} />
                    {added ? '¡Añadido!' : 'Comprar'}
                </button>
            </div>
        </div>
    );
}
