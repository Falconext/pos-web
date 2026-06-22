import React from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

interface ModaPromoBannerProps {
  slug: string;
}

export default function ModaPromoBanner({ slug }: ModaPromoBannerProps) {
  const navigate = useNavigate();

  return (
    <section className="w-full mb-20" style={{ fontFamily: '"Inter", sans-serif' }}>
      <div className="w-full bg-white rounded-[2rem] overflow-hidden flex flex-col md:flex-row shadow-sm border border-gray-100">
        
        {/* Left Side: Image */}
        <div className="w-full md:w-1/2 h-[300px] md:h-[400px]">
          <img 
            src="https://images.unsplash.com/photo-1515347619252-8d348b569ea4?auto=format&fit=crop&q=80&w=1200" 
            alt="Promo Model" 
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Right Side: Content */}
        <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4 tracking-tight">
            Limited-Time Deals on This <span style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 'normal' }}>Season's</span><br/>
            <span style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 'normal' }}>Must-Haves!</span>
          </h2>
          
          <p className="text-sm text-gray-500 leading-relaxed max-w-sm mb-8 font-medium">
            Curated styles, luxurious fabrics, and effortless elegance all in one place. Dress the way you dream.
          </p>

          <div>
            <button 
              onClick={() => slug === "preview" ? window.dispatchEvent(new CustomEvent("preview-nav", { detail: "catalogo" })) : navigate(`/tienda/${slug}/catalogo`)}
              className="px-6 py-3 bg-[#2A2A2A] text-white text-sm font-semibold rounded-full hover:bg-black transition-colors inline-flex items-center gap-2"
            >
              Start Shopping <Icon icon="solar:arrow-right-linear" width={18} />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
