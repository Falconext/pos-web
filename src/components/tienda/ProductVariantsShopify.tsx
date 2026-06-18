import React from 'react';

interface Option {
  nombre: string;
  valores: string[];
}

interface Variant {
  id: number;
  precioUnitario: number | string;
  stock: number;
  valoresAtributos: Record<string, string>;
  imagenUrl?: string | null;
}

interface Props {
  opciones: Option[];
  variantes: Variant[];
  selecciones: Record<string, string>;
  onChange: (opcion: string, valor: string) => void;
}

export default function ProductVariantsShopify({ opciones, variantes, selecciones, onChange }: Props) {
  if (!opciones || opciones.length === 0) return null;

  return (
    <div className="mb-6 space-y-4">
      {opciones.map((op, idx) => (
        <div key={idx}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-900">{op.nombre}</span>
            <span className="text-xs text-gray-500">{selecciones[op.nombre] || 'Seleccionar'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {op.valores.map((val) => {
              const isSelected = selecciones[op.nombre] === val;
              // Opcional: verificar si la variante existe para deshabilitar botones
              return (
                <button
                  key={val}
                  onClick={() => onChange(op.nombre, val)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                    isSelected
                      ? 'border-black bg-black text-white shadow-md'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
