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

  const heroTitle = diseno?.modaHeroTitle || diseno?.heroTitle || 'DENIM,\nREIMAGINADO';
  const heroSubtitle = diseno?.modaHeroSubtitle || diseno?.heroSubtitle || 'Cortes wide-leg, lavados y prendas listas para cualquier look urbano.';
  const heroEyebrow = diseno?.modaHeroEyebrow || 'NUEVA TEMPORADA DENIM';
  const heroImage =
    diseno?.modaHeroImage ||
    diseno?.heroImageUrl ||
    diseno?.heroImage ||
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=90&w=2400';

  const goCatalog = (query?: string) => {
    if (slug === 'preview') {
      window.dispatchEvent(new CustomEvent('preview-nav', { detail: 'catalogo' }));
      return;
    }
    navigate(query ? `/tienda/${slug}/catalogo?search=${encodeURIComponent(query)}` : `/tienda/${slug}/catalogo`);
  };

  return (
    <section className="relative min-h-[calc(100vh-158px)] overflow-hidden bg-[#D9D9D4] text-[#15243B]">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt={heroTitle}
          className="h-full w-full object-cover object-center md:object-[65%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#D9D9D4]/95 via-[#D9D9D4]/74 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-158px)] max-w-[1600px] items-center px-6 py-16 md:px-16 lg:px-[11vw]">
        <div className="max-w-[620px]">
          <p className="text-[14px] font-medium uppercase tracking-[0.08em] text-[#15243B]/88">
            {heroEyebrow}
          </p>
          <div className="mt-7 h-px w-[118px] bg-[#15243B]/45" />
          <h1 className="mt-9 whitespace-pre-line text-[58px] font-light leading-[0.98] tracking-[-0.055em] text-[#15243B] sm:text-[76px] lg:text-[92px] xl:text-[108px]">
            {heroTitle}
          </h1>
          <p className="mt-6 max-w-[560px] text-[14px] leading-relaxed text-[#15243B]/78">
            {heroSubtitle}
          </p>
          <button
            onClick={() => goCatalog('denim')}
            className="mt-9 h-[54px] bg-[#15243B] px-10 text-[14px] font-black uppercase tracking-wide text-white transition-colors hover:bg-black"
          >
            Comprar ahora
          </button>
        </div>
      </div>

      <button
        onClick={() => goCatalog('sale')}
        className="absolute left-0 top-1/2 z-20 hidden -translate-y-1/2 rounded-r-md bg-white px-4 py-5 text-[13px] font-black uppercase tracking-[0.02em] text-black shadow-sm [writing-mode:vertical-rl] hover:bg-black hover:text-white md:block"
      >
        10% OFF!
      </button>

      <button
        className="absolute right-8 bottom-7 z-20 hidden h-12 w-12 items-center justify-center rounded-full bg-white/80 text-[#15243B] shadow-sm backdrop-blur-sm transition-colors hover:bg-black hover:text-white md:flex"
        aria-label="Chat"
      >
        <Icon icon="solar:chat-round-dots-bold" width={24} />
      </button>
    </section>
  );
}
