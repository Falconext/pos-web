import { Icon } from '@iconify/react';

interface MembershipBannerProps {
    tienda?: any;
}

export default function MembershipBanner({ tienda }: MembershipBannerProps) {
    const storeName = tienda?.nombreComercial || 'Nuestra Tienda';

    return (
        <div className="max-w-screen-xl mx-auto px-5 md:px-8 mb-10">
            <div className="relative rounded-3xl overflow-hidden bg-[#F5EEE6] h-[220px] md:h-[260px]">

                {/* Text Side */}
                <div className="absolute left-0 top-0 bottom-0 w-full md:w-[50%] p-8 md:p-12 flex flex-col justify-center z-10">
                    <h2 className="text-2xl md:text-3xl font-black text-[#1A1A1A] leading-[1.2] mb-2">
                        Únete a la familia <span className="text-[#FF9500]">{storeName}</span>
                        {' '}y obtén{' '}
                        <span className="text-[#FF9500]">10% OFF</span>
                        {' '}en tu primer pedido
                    </h2>
                    <p className="text-sm text-[#777] mb-6">
                        Porque mereces lo mejor 🎉
                    </p>
                    <button className="w-fit flex items-center gap-2 bg-[#FF9500] hover:bg-[#E08500] text-white text-sm font-bold px-7 py-3 rounded-full transition-colors shadow-sm">
                        <Icon icon="solar:user-plus-bold" width={16} />
                        Suscribirse
                    </button>
                </div>

                {/* Orange right section with images */}
                <div className="absolute right-0 top-0 bottom-0 w-[50%] bg-[#FF9500] hidden md:flex items-end justify-center rounded-l-[80px] overflow-hidden">
                    <div className="flex items-end justify-center gap-2 h-full w-full pt-8 px-4">
                        {/* Decorative product/category images */}
                        <img
                            src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=200"
                            alt=""
                            className="h-3/4 object-contain object-bottom opacity-90"
                        />
                        <img
                            src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200"
                            alt=""
                            className="h-3/5 object-contain object-bottom opacity-90"
                        />
                        <img
                            src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=200"
                            alt=""
                            className="h-2/3 object-contain object-bottom opacity-90"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
