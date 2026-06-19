import React from 'react';
import { Icon } from '@iconify/react';

interface Props {
  cp: string;
}

export default function AutopartesTopSelling({ cp }: Props) {
  const categories = [
    {
      title: 'Motor y Rendimiento',
      items: [
        { name: 'Aceites de Motor Racing & Motorsport', img: '/assets/autopartes/producto.png' },
        { name: 'Motores Turboalimentados', img: '/assets/autopartes/producto.png' },
        { name: 'Motores de Aspiración Natural', img: '/assets/autopartes/producto.png' },
        { name: 'Sensor de Presión de Sobrealimentación', img: '/assets/autopartes/producto.png' }
      ]
    },
    {
      title: 'Llantas y Ruedas',
      items: [
        { name: 'Llantas de Verano', img: '/assets/autopartes/producto.png' },
        { name: 'Llantas de Pista', img: '/assets/autopartes/producto.png' },
        { name: 'Llantas de Motocicleta', img: '/assets/autopartes/producto.png' },
        { name: 'Llantas para Camión Ligero', img: '/assets/autopartes/producto.png' }
      ]
    },
    {
      title: 'Sistema Eléctrico y Electrónica',
      items: [
        { name: 'Reguladores de Voltaje', img: '/assets/autopartes/producto.png' },
        { name: 'Relés de Gestión de Batería', img: '/assets/autopartes/producto.png' },
        { name: 'Bujías de Precalentamiento', img: '/assets/autopartes/producto.png' },
        { name: 'Sensores de Temperatura', img: '/assets/autopartes/producto.png' }
      ]
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 xl:px-8 py-16">
      
      <div className="text-center mb-10 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex gap-[3px]">
            <div className="w-3 h-0.5 bg-red-600 transform -skew-x-[30deg]" style={{ backgroundColor: cp }}></div>
            <div className="w-3 h-0.5 bg-red-600 transform -skew-x-[30deg]" style={{ backgroundColor: cp }}></div>
          </div>
          <span className="text-sm font-bold text-red-600" style={{ color: cp }}>Por Categorías</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-[#0B1340] tracking-tight">
          Productos Más Vendidos de la Semana
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {categories.map((cat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col">
            <h3 className="text-lg font-black text-gray-900 mb-6">{cat.title}</h3>
            
            <div className="flex flex-col">
              {cat.items.map((item, i) => (
                <div key={i} className={`flex items-center gap-4 py-4 ${i !== 3 ? 'border-b border-gray-100' : ''}`}>
                  <div className="w-20 h-20 rounded bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 p-2">
                    <img src={item.img} alt="thumb" className="w-full h-full object-contain mix-blend-multiply opacity-80" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex text-[#F5B01D] text-[10px] mb-1">
                      <Icon icon="solar:star-bold" /><Icon icon="solar:star-bold" /><Icon icon="solar:star-bold" /><Icon icon="solar:star-bold" /><Icon icon="solar:star-bold" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 leading-tight mb-2 line-clamp-2">
                      {item.name}
                    </h4>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-gray-400 line-through">S/ 55.00</span>
                      <span className="text-sm font-black text-red-600">S/ 55.00</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
