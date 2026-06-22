import React from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

interface ModaHeroProps {
  cp: string;
  slug: string;
  diseno?: any;
  productos?: any[];
}

export default function ModaHero({ cp, slug, diseno, productos }: ModaHeroProps) {
  const navigate = useNavigate();

  const heroTitle = diseno?.heroTitle || "Where Fashion";
  const heroTitleAccent = "Meets Confidence";
  const heroSubtitle = diseno?.heroSubtitle || "Curated styles, luxurious fabrics, and effortless elegance all in one place. Dress the way you dream.";

  return (
    <div className="w-full flex flex-col gap-6" style={{ fontFamily: '"Inter", sans-serif' }}>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
        
        {/* Left Pane: Text & Call to Actions */}
        <div className="bg-white rounded-[2rem] p-8 md:p-14 flex flex-col justify-center border border-gray-100 shadow-sm relative overflow-hidden">
          
          {/* Abstract faint blob */}
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-5" style={{ backgroundColor: cp || '#B58863' }}></div>
          
          <div className="relative z-10">
            <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-bold text-gray-900 leading-[1.1] mb-2 tracking-tight">
              {heroTitle}
            </h1>
            <h2 className="text-5xl md:text-6xl lg:text-[4.5rem] text-gray-900 leading-[1.1] mb-6" style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic' }}>
              {heroTitleAccent}
            </h2>
            
            <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-10 max-w-md">
              {heroSubtitle}
            </p>
            
            <div className="flex flex-wrap items-center gap-6 mb-16">
              <button 
                onClick={() => slug === "preview" ? window.dispatchEvent(new CustomEvent("preview-nav", { detail: "catalogo" })) : navigate(`/tienda/${slug}/catalogo`)}
                className="px-8 py-3.5 bg-gray-900 text-white font-semibold rounded-full hover:bg-black transition-colors flex items-center gap-2 shadow-md"
              >
                Start Shopping 
                <Icon icon="solar:arrow-right-linear" width={18} />
              </button>
              
              <button className="flex items-center gap-3 text-gray-800 font-semibold hover:text-gray-600 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center">
                  <Icon icon="solar:play-bold" width={18} className="ml-1" />
                </div>
                Watch Video
              </button>
            </div>

            {/* Info Cards Row */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <Icon icon="solar:delivery-bold-duotone" width={28} className="text-gray-800 mb-3" />
                <h4 className="font-bold text-gray-900 mb-1">Fast Shipping</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Instant and reliable delivery to your doorstep.</p>
              </div>
              <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <Icon icon="solar:card-bold-duotone" width={28} className="text-gray-800 mb-3" />
                <h4 className="font-bold text-gray-900 mb-1">Secure Payment</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Enjoy stress-free transactions with our trusted payment partners.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane: Image & Floating Card */}
        <div className="relative rounded-[2rem] overflow-hidden min-h-[500px] lg:min-h-full bg-[#B58863]">
          
          {/* Abstract background shapes */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-[120%] h-[120%] bg-[#A37452] rounded-full mix-blend-multiply opacity-40"></div>
            <div className="absolute bottom-0 left-0 w-[80%] h-[60%] bg-[#C69B7A] rounded-[100%] mix-blend-overlay opacity-80" style={{ transform: 'rotate(-15deg)' }}></div>
            <div className="absolute top-20 -left-20 w-96 h-96 bg-[#D8B49B] rounded-full mix-blend-screen opacity-30"></div>
          </div>

          {/* Model Image */}
          <div className="absolute inset-0 z-10 flex items-end justify-center pt-10">
            <img 
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop" 
              alt="Fashion Model" 
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                // Fallback if unsplash image fails
                (e.target as HTMLImageElement).src = '/assets/autopartes/banner1.png';
              }}
            />
          </div>

          {/* Floating Community Card */}
          <div className="absolute bottom-8 right-8 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-white/20 max-w-[260px]">
            <h4 className="font-bold text-gray-900 mb-1">Join our active community</h4>
            <p className="text-xs text-gray-500 mb-4">As easy as a click away.</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white overflow-hidden flex items-center justify-center">
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              
              <button className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-black transition-colors">
                <Icon icon="solar:add-linear" width={18} />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
