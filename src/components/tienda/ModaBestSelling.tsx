import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

interface ModaBestSellingProps {
  slug: string;
  cp: string;
  productos: any[];
}

export default function ModaBestSelling({ slug, cp, productos }: ModaBestSellingProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');

  const tabs = ['All', 'Suit Coat', 'Shirts', 'Jeans', 'Jacket', 'Hoody'];

  // Mocking the top 3 best sellers with specific images to match design aesthetics
  const bestSellers = [
    {
      id: 1,
      title: "Velora Double-Breasted Suit",
      price: 239.00,
      image: "https://images.unsplash.com/photo-1594938298596-eb5fd3c2266d?auto=format&fit=crop&q=80&w=800",
      badge: { text: "10%", type: "dark" },
      colors: ['#D1BCA6', '#222222']
    },
    {
      id: 2,
      title: "The Duchess Tailored Set",
      price: 203.47,
      image: "https://images.unsplash.com/photo-1593030736226-fa4453a3e633?auto=format&fit=crop&q=80&w=800",
      badge: { text: "New Arrival", type: "light" },
      colors: ['#D1BCA6', '#222222']
    },
    {
      id: 3,
      title: "Tan Stretch Slim Fit Suit Coat",
      price: 189.00,
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800",
      badge: { text: "New Arrival", type: "light" },
      colors: ['#D1BCA6', '#222222']
    }
  ];

  return (
    <section className="w-full mb-20" style={{ fontFamily: '"Inter", sans-serif' }}>
      
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
          Best Selling Products
        </h2>
        
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border ${
                activeTab === tab 
                  ? 'bg-[#2A2A2A] text-white border-[#2A2A2A]' 
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Top Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {bestSellers.map((product) => (
          <div key={product.id} className="group cursor-pointer flex flex-col" onClick={() => slug === "preview" ? window.dispatchEvent(new CustomEvent("preview-nav", { detail: "catalogo" })) : navigate(`/tienda/${slug}/producto/${product.id}`)}>
            <div className="w-full aspect-[3/4] rounded-[2rem] overflow-hidden bg-white mb-4 relative border border-gray-100 shadow-sm">
              <img 
                src={product.image} 
                alt={product.title} 
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
              />
              
              {/* Badge */}
              <div className={`absolute top-5 left-5 px-3 py-1 rounded-md text-xs font-bold ${
                product.badge.type === 'dark' ? 'bg-[#2A2A2A] text-white' : 'bg-[#C1A58F] text-white'
              }`}>
                {product.badge.text}
              </div>
            </div>

            <div className="flex items-start justify-between px-2">
              <div>
                <h3 className="font-bold text-gray-900 text-[15px] mb-2">{product.title}</h3>
                <p className="font-bold text-sm text-gray-800">${product.price.toFixed(2)}</p>
              </div>
              
              {/* Swatches */}
              <div className="flex items-center gap-1.5 pt-1">
                {product.colors.map((color, idx) => (
                  <div 
                    key={idx} 
                    className="w-3.5 h-3.5 rounded-sm border border-gray-200 shadow-sm"
                    style={{ backgroundColor: color }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Banners Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Banner */}
        <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-center min-h-[320px]">
          {/* Faint background text */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none w-full text-center">
            <span className="text-[120px] font-black text-gray-50 opacity-50 tracking-tighter">Conf</span>
          </div>
          
          <div className="relative z-10 max-w-[60%]">
            <h3 className="text-3xl font-bold text-gray-900 leading-tight mb-2">
              Your Style Upgrade
            </h3>
            <h3 className="text-4xl text-gray-900 leading-tight mb-4" style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic' }}>
              Starts Here!
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-6">
              Curated styles, luxurious fabrics, and effortless elegance all in one place. Dress the way you dream.
            </p>
            <button 
              onClick={() => slug === "preview" ? window.dispatchEvent(new CustomEvent("preview-nav", { detail: "catalogo" })) : navigate(`/tienda/${slug}/catalogo`)}
              className="px-6 py-2.5 bg-[#2A2A2A] text-white text-sm font-semibold rounded-full hover:bg-black transition-colors inline-flex items-center gap-2"
            >
              Start Shopping <Icon icon="solar:arrow-right-linear" width={16} />
            </button>
          </div>

          {/* Model Image */}
          <div className="absolute bottom-0 right-0 w-[45%] h-[90%] z-0 flex items-end">
            <img 
              src="https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&q=80&w=800" 
              alt="Model" 
              className="w-full h-full object-contain object-bottom filter grayscale"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/autopartes/banner2.png';
              }}
            />
          </div>
        </div>

        {/* Right Banner */}
        <div className="bg-[#B58863] rounded-[2rem] overflow-hidden min-h-[320px] relative">
          <img 
            src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=1200" 
            alt="Girls laughing" 
            className="w-full h-full object-cover object-center"
          />
        </div>

      </div>

    </section>
  );
}
