import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

interface ModaHeroProps {
  cp: string;
  slug: string;
  diseno?: any;
  productos?: any[];
}

export default function ModaHero({ slug, diseno }: ModaHeroProps) {
  const navigate = useNavigate();

  const heroTitle = diseno?.heroTitle || 'Summer Essentials';
  const heroSubtitle = diseno?.heroSubtitle || 'Discover seasonal styles';
  const heroImage =
    diseno?.heroImageUrl ||
    diseno?.heroImage ||
    'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=85&w=2400';

  const goCatalog = (query?: string) => {
    if (slug === 'preview') {
      window.dispatchEvent(new CustomEvent('preview-nav', { detail: 'catalogo' }));
      return;
    }
    navigate(query ? `/tienda/${slug}/catalogo?search=${encodeURIComponent(query)}` : `/tienda/${slug}/catalogo`);
  };

  return (
    <section className="relative w-full h-[calc(100vh-94px)] min-h-[560px] overflow-hidden bg-black">
      <img
        src={heroImage}
        alt={heroTitle}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-black/42" />

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-5 text-center text-white">
        <h1 className="text-[52px] sm:text-[72px] lg:text-[96px] leading-none font-normal tracking-[-0.02em]">
          {heroTitle}
        </h1>
        <p className="mt-8 text-[16px] font-semibold">{heroSubtitle}</p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-6">
          <button
            onClick={() => goCatalog('men')}
            className="h-12 min-w-[178px] bg-white text-black text-[15px] font-semibold rounded-md hover:bg-black hover:text-white border border-white transition-colors"
          >
            SHOP MEN
          </button>
          <button
            onClick={() => goCatalog('women')}
            className="h-12 min-w-[178px] bg-white text-black text-[15px] font-semibold rounded-md hover:bg-black hover:text-white border border-white transition-colors"
          >
            SHOP WOMEN
          </button>
        </div>
      </div>

      <div className="absolute left-5 bottom-0 z-20 hidden md:flex items-end">
        <div className="relative bg-white text-black px-6 py-4 rounded-t-lg shadow-xl">
          <button className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-black text-white border border-white flex items-center justify-center">
            <Icon icon="solar:close-circle-bold" width={18} />
          </button>
          <span className="text-[16px] font-medium">Get Early Access</span>
        </div>
      </div>

      <button
        className="absolute right-8 bottom-6 z-20 h-[60px] w-[60px] rounded-full bg-white/55 text-white backdrop-blur-sm hover:bg-black transition-colors flex items-center justify-center"
        aria-label="Chat"
      >
        <Icon icon="solar:chat-round-dots-bold" width={28} />
      </button>
    </section>
  );
}
