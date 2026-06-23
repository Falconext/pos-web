import { getFashionColors, getFashionSizes } from './fashionVariants';

interface UrbanoProductCardProps {
    producto: any;
    slug: string;
    onClick: () => void;
    onAddToCart: () => void;
}

export default function UrbanoProductCard({ producto, onClick }: UrbanoProductCardProps) {
    const price = Number(producto.precioUnitario || 0);
    const colors = getFashionColors(producto);
    const sizes = getFashionSizes(producto);
    const image = producto.imagenUrl || producto.imagenesExtra?.[0] || '/assets/templates/urbano/coleccion1.png';

    return (
        <div className="flex flex-col group cursor-pointer" onClick={onClick} style={{ fontFamily: '"Inter", sans-serif' }}>
            {/* Image Container */}
            <div className="w-full aspect-[4/5] bg-[#F4F5F6] overflow-hidden mb-4 relative">
                <img 
                    src={image} 
                    alt={producto.descripcion} 
                    className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-105"
                />
            </div>

            {/* Product Info */}
            <div className="flex flex-col items-start w-full px-1">
                <div className="flex justify-between w-full items-start mb-1">
                    <h3 className="text-xs sm:text-[13px] font-bold text-gray-900 truncate pr-4">
                        {producto.descripcion}
                    </h3>
                </div>
                
                <p className="text-[11px] font-bold text-gray-500 mb-3">
                    S/. {price.toFixed(2)}
                </p>

                {(colors.length > 0 || sizes.length > 0) && (
                    <div className="flex w-full items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                            {colors.slice(0, 5).map((color) => (
                                <div
                                    key={color.name}
                                    className="h-3.5 w-3.5 border border-gray-200"
                                    style={{ backgroundColor: color.hex }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                        {sizes.length > 0 && (
                            <span className="truncate text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                {sizes.slice(0, 4).join(' / ')}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
