import React from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

interface Props {
  cp: string;
  slug: string;
  productos: any[];
}

export default function AutopartesDealsOfTheWeek({ cp, slug, productos }: Props) {
  const navigate = useNavigate();

  return (
    <div className="w-full mb-16">
      
      {/* Dark background section */}
      <div className="w-full bg-[#111111] relative pt-16 pb-28 md:pb-32 px-4">
        {/* Background image fade */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url(/assets/autopartes/producto.png)', backgroundSize: 'cover', backgroundPosition: 'center', maskImage: 'linear-gradient(to bottom, black 50%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent)' }}></div>
        
        <div className="w-full max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex gap-[3px]">
              <div className="w-3 h-0.5 transform -skew-x-[30deg]" style={{ backgroundColor: cp }}></div>
              <div className="w-3 h-0.5 transform -skew-x-[30deg]" style={{ backgroundColor: cp }}></div>
            </div>
            <span className="text-sm font-bold" style={{ color: cp }}>Mejores Ofertas</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-8">
            Ofertas de la Semana
          </h2>

          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Left: Featured Product (Carousel) */}
            <div className="flex-1 bg-white rounded-xl p-8 flex flex-col relative gap-6">
              {/* Arrows */}
              <button className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-md hover:bg-red-200 z-20">
                <Icon icon="solar:arrow-left-linear" />
              </button>
              <button className="absolute right-[-16px] top-1/2 -translate-y-1/2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-700 z-20">
                <Icon icon="solar:arrow-right-linear" />
              </button>

              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-full md:w-1/2 flex justify-center">
                  <img src="/assets/autopartes/producto.png" alt="Disco de Freno" className="w-[80%] aspect-square object-contain mix-blend-multiply" />
                </div>

                <div className="w-full md:w-1/2 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex text-[#F5B01D] text-xs">
                      <Icon icon="solar:star-bold" /><Icon icon="solar:star-bold" /><Icon icon="solar:star-bold" /><Icon icon="solar:star-bold" /><Icon icon="solar:star-linear" />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">(126) Reseñas</span>
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-4">
                    Disco de Freno Profesional
                  </h3>
                  
                  <div className="flex items-baseline gap-3 mb-6">
                    <span className="text-2xl font-black text-red-600">S/ 239.52</span>
                    <span className="text-sm font-bold text-gray-400 line-through">S/ 362.00</span>
                  </div>

                  <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                    <span>Disponibles: 334</span>
                    <span>Vendidos: 1</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full mb-6 overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full bg-red-600 w-[85%] rounded-full"></div>
                  </div>

                  <div className="flex gap-3 mb-8">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 border border-gray-200 rounded flex items-center justify-center text-base font-black text-gray-900 mb-1">172</div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">Días</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 border border-gray-200 rounded flex items-center justify-center text-base font-black text-gray-900 mb-1">14</div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">Hrs</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 border border-gray-200 rounded flex items-center justify-center text-base font-black text-gray-900 mb-1">14</div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">Mins</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 border border-gray-200 rounded flex items-center justify-center text-base font-black text-gray-900 mb-1">56</div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">Segs</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="px-5 py-2.5 bg-[#1A1A1A] text-white font-bold rounded text-xs hover:bg-black transition-colors">
                      Añadir al Carrito
                    </button>
                    <button className="w-10 h-10 bg-red-600 text-white rounded flex items-center justify-center hover:bg-red-700 transition-colors">
                      <Icon icon="solar:heart-bold" />
                    </button>
                    <button className="w-10 h-10 border border-gray-200 text-gray-500 rounded flex items-center justify-center hover:bg-gray-50 transition-colors">
                      <Icon icon="solar:eye-linear" />
                    </button>
                    <button className="w-10 h-10 border border-gray-200 text-gray-500 rounded flex items-center justify-center hover:bg-gray-50 transition-colors">
                      <Icon icon="solar:refresh-linear" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Thumbnails */}
              <div className="flex justify-between items-center gap-4 mt-4 px-4">
                {[
                  '/assets/autopartes/producto.png',
                  '/assets/autopartes/producto.png',
                  '/assets/autopartes/producto.png',
                  '/assets/autopartes/producto.png',
                  '/assets/autopartes/producto.png'
                ].map((img, i) => (
                  <div key={i} className={`flex-1 aspect-square rounded border flex items-center justify-center p-2 cursor-pointer transition-colors ${i === 0 ? 'border-red-500' : 'border-gray-100 hover:border-gray-300'}`}>
                    <img src={img} alt="thumb" className="w-full h-full object-contain mix-blend-multiply opacity-80" />
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-[350px] xl:w-[380px] bg-white rounded-xl pt-0 overflow-hidden flex flex-col border border-gray-100">
              <div className="bg-[#DB4437] text-white font-bold text-base py-3 px-6 text-center w-max mx-auto rounded-b-xl mb-4 relative shadow-[0_4px_10px_rgba(220,38,38,0.2)]">
                <div className="absolute top-0 left-[-8px] w-0 h-0 border-t-[8px] border-t-red-900 border-l-[8px] border-l-transparent"></div>
                <div className="absolute top-0 right-[-8px] w-0 h-0 border-t-[8px] border-t-red-900 border-r-[8px] border-r-transparent"></div>
                Producto Más Vendido
              </div>
              
              <div className="flex flex-col px-6 pb-6">
                {[
                  { name: 'Aceites de Motor Racing & Motorsport', img: '/assets/autopartes/producto.png' },
                  { name: 'Cilindro Maestro de Embrague', img: '/assets/autopartes/producto.png' },
                  { name: 'Bomba de Combustible', img: '/assets/autopartes/producto.png' },
                  { name: 'Llantas y Ruedas', img: '/assets/autopartes/producto.png' }
                ].map((item, idx) => (
                  <div key={idx} className={`flex items-center gap-4 py-4 ${idx !== 3 ? 'border-b border-gray-100' : ''}`}>
                    <div className="w-16 h-16 rounded bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                      <img src={item.img} alt="thumb" className="w-[80%] h-[80%] object-contain mix-blend-multiply opacity-80" />
                    </div>
                    <div className="flex flex-col flex-1">
                      <div className="flex text-[#F5B01D] text-[10px] mb-1">
                        <Icon icon="solar:star-bold" /><Icon icon="solar:star-bold" /><Icon icon="solar:star-bold" /><Icon icon="solar:star-bold" /><Icon icon="solar:star-bold" />
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 leading-tight mb-1.5 line-clamp-2">
                        {item.name}
                      </h4>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[11px] font-bold text-gray-400 line-through">S/ 55.00</span>
                        <span className="text-sm font-black text-red-600">S/ 55.00</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 3 Promos Bottom */}
      <div className="w-full max-w-7xl mx-auto mt-[-5rem] md:mt-[-6rem] px-4 xl:px-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Promo 1 */}
          <div className="bg-[#0B0B0B] rounded-xl overflow-hidden p-6 relative flex flex-col justify-center min-h-[200px] border border-gray-800 shadow-xl group">
            <div className="absolute inset-0 w-full h-full opacity-60 transition-transform duration-500 group-hover:scale-110 pointer-events-none z-0">
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0B] to-transparent z-10"></div>
              <img src="/assets/autopartes/widget1.png" className="w-full h-full object-cover" alt="Tires" />
            </div>
            <div className="relative z-20 max-w-[65%]">
              <span className="inline-block px-2 py-0.5 bg-[#00C4B5] text-white text-[9px] font-bold rounded mb-2">Top Marcas</span>
              <h3 className="text-xl font-black text-white leading-tight mb-1">Llantas y Ruedas</h3>
              <p className="text-[10px] text-gray-300 mb-5">¡Mantente seguro en la Vía!</p>
              <button className="text-xs font-bold text-red-500 flex items-center gap-1 hover:text-red-400 transition-colors">
                Comprar Ahora <Icon icon="solar:arrow-right-up-linear" className="bg-red-500 text-white rounded-full w-4 h-4 p-0.5" />
              </button>
            </div>
          </div>

          {/* Promo 2 */}
          <div className="bg-[#F5B01D] rounded-xl overflow-hidden p-6 relative flex flex-col justify-center min-h-[200px] shadow-xl group">
            <div className="absolute inset-0 w-full h-full opacity-90 transition-transform duration-500 group-hover:scale-110 pointer-events-none z-0">
               <img src="/assets/autopartes/widget2.png" alt="Oil" className="w-full h-full object-cover mix-blend-multiply" />
            </div>
            <div className="relative z-10 max-w-[65%]">
              <h3 className="text-2xl font-black text-white leading-tight mb-1">ACEITE MOTOR</h3>
              <p className="text-[10px] text-gray-200 font-bold mb-4">¡Rendimiento Suave!</p>
              <button className="px-4 py-1.5 bg-white text-black font-bold text-xs rounded hover:bg-gray-100 transition-colors w-max">
                Comprar Ahora
              </button>
            </div>
          </div>

          {/* Promo 3 */}
          <div className="bg-gradient-to-r from-[#DB4437] to-[#E65C00] rounded-xl overflow-hidden p-6 relative flex flex-col justify-center min-h-[200px] shadow-xl group">
            <div className="absolute inset-0 w-full h-full opacity-90 transition-transform duration-500 group-hover:scale-110 pointer-events-none z-0">
               <div className="absolute inset-0 bg-gradient-to-r from-[#DB4437]/80 to-transparent z-10"></div>
               <img src="/assets/autopartes/widget3.png" alt="Suspension" className="w-full h-full object-cover mix-blend-overlay" />
            </div>
            <div className="relative z-10 max-w-[70%]">
              <span className="inline-block px-2 py-0.5 bg-[#00C4B5] text-white text-[9px] font-bold rounded mb-2">Top Marcas</span>
              <h3 className="text-xl md:text-2xl font-black text-white leading-tight mb-1">COMPRA 1 LLEVA 1!</h3>
              <p className="text-[10px] text-white/80 mb-4">¡Mantente seguro en la Vía!</p>
              
              <div className="flex items-center gap-3">
                <button className="px-4 py-1.5 bg-white text-[#DB4437] font-bold text-xs rounded hover:bg-gray-100 transition-colors">
                  Comprar Ahora
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
