import { Icon } from '@iconify/react';
import { useRef } from 'react';

interface CategoryCirclesProps {
    categories: any[];
    selectedCats: string[];
    onSelectCategory: (cat: string) => void;
}

export default function CategoryCircles({ categories, selectedCats, onSelectCategory }: CategoryCirclesProps) {

    // Images mapping for categories - mocked for demo but uses real if available
    const getCategoryImage = (cat: any) => {
        if (typeof cat === 'object' && cat.imagenUrl) return cat.imagenUrl;

        const name = typeof cat === 'object' ? cat.nombre || cat.codigo : cat;
        if (!name) return 'https://via.placeholder.com/200';

        const lower = name.toLowerCase();
        if (lower.includes('tech') || lower.includes('celular') || lower.includes('laptop')) return 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&q=80&w=200';
        if (lower.includes('moda') || lower.includes('ropa') || lower.includes('mujer')) return 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=200';
        if (lower.includes('hogar') || lower.includes('mueble')) return 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=200';
        if (lower.includes('belleza') || lower.includes('cosm')) return 'https://images.unsplash.com/photo-1596462502278-27bfdd403cc2?auto=format&fit=crop&q=80&w=200';
        if (lower.includes('deporte') || lower.includes('zapat')) return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=200';
        if (lower.includes('joya')) return 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=200';
        if (lower.includes('music')) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=200';
        return 'https://via.placeholder.com/200';
    };

    return (
        <div className="py-12 max-w-screen-xl mx-auto px-4 md:px-8">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Compra por Marca</h2>
                <p className="text-gray-500 max-w-2xl mx-auto text-base">
                    Descubre tus marcas favoritas y encuentra los mejores productos seleccionados para ti.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
                {categories.map((cat, index) => {
                    const catName = typeof cat === 'object' ? (cat as any).nombre || (cat as any).codigo : cat;
                    const isSelected = selectedCats.includes(catName);
                    const img = getCategoryImage(cat);
                    const isHoveredMock = false; // index === 2; // Removed mock hover for cleanliness

                    return (
                        <div
                            key={index}
                            onClick={() => onSelectCategory(catName)}
                            className={`
                                group relative bg-white rounded-3xl p-4 md:p-6 flex flex-col items-center justify-between gap-3 md:gap-4 cursor-pointer transition-all duration-300 border
                                ${isSelected
                                    ? 'border-[#045659] shadow-xl scale-105 z-10'
                                    : 'border-transparent shadow-sm hover:shadow-lg hover:border-gray-100 hover:-translate-y-1'
                                }
                            `}
                        >
                            {/* Circle Image Wrapper - with blue glow if active */}
                            <div className={`
                                w-20 h-20 md:w-24 md:h-24 rounded-full p-1 relative z-10 bg-white
                                ${isSelected ? 'ring-2 ring-[#045659] shadow-lg' : ''}
                            `}>
                                <div className="w-full h-full rounded-full overflow-hidden relative">
                                    <img
                                        src={img}
                                        alt={catName}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                </div>
                            </div>

                            {/* Text Content */}
                            <div className="text-center w-full z-10">
                                <h3 className="font-bold text-gray-900 text-xs md:text-sm lg:text-base mb-2 md:mb-3 leading-tight min-h-[2.5em] flex items-center justify-center">{catName}</h3>

                                {/* Button Logic */}
                                <div className={`
                                    inline-flex items-center gap-1 text-[10px] md:text-xs font-bold py-1 md:py-1.5 px-2 md:px-3 rounded-full transition-colors duration-300
                                    ${isSelected || isHoveredMock
                                        ? 'bg-[#045659] text-white hover:bg-[#034042]'
                                        : 'bg-transparent text-gray-400 group-hover:text-[#045659]'
                                    }
                                `}>
                                    <span>Ver Más</span>
                                    <Icon icon={isSelected ? "solar:arrow-right-bold" : "solar:arrow-right-up-linear"} className={isSelected ? "" : "text-xs"} />
                                </div>
                            </div>

                            {/* Background Decoration */}
                            {(isSelected) && (
                                <div className="absolute inset-0 bg-blue-50/30 rounded-3xl -z-0" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
