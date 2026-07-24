import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useCompareStore } from '@/zustand/compare';
import { mayeFloating, mayeModal, mayeOverlay, mayeTap } from '@/lib/motion/maye';

interface MayeCompareWidgetProps {
  slug: string;
  cp: string;
  /** Navega a la página del producto (recibe el item de comparación). */
  onGoProduct: (item: any) => void;
}

/**
 * Barra flotante + modal de comparación para la plantilla Maye.
 * Reutilizable en el layout (home) y en la página de catálogo, para que el
 * botón "Comparar" de cada card tenga siempre una UI visible que reaccione.
 */
export default function MayeCompareWidget({ slug, cp, onGoProduct }: MayeCompareWidgetProps) {
  const { getBySlug, clear: clearCompare } = useCompareStore();
  const [showCompareModal, setShowCompareModal] = useState(false);
  const compareItems = getBySlug(slug);

  return (
    <>
      <AnimatePresence>
        {compareItems.length > 0 && (
          <motion.div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto w-max max-w-[95vw]" variants={mayeFloating} initial="initial" animate="animate" exit="exit">
            <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-3 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4">
              <div className="flex -space-x-2 flex-shrink-0">
                {compareItems.slice(0, 3).map(item => (
                  <div key={item.id} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-gray-800 overflow-hidden bg-white">
                    {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="w-full h-full object-contain" /> : <div className="w-full h-full bg-gray-200" />}
                  </div>
                ))}
              </div>
              <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">{compareItems.length} para comparar</span>
              <motion.button onClick={() => setShowCompareModal(true)} className="px-3 sm:px-4 py-1.5 rounded-xl font-bold text-xs sm:text-sm text-white whitespace-nowrap" style={{ background: cp }} whileHover={{ y: -1, scale: 1.04 }} whileTap={mayeTap}>Ver</motion.button>
              <button onClick={() => clearCompare(slug)} className="text-gray-400 hover:text-white transition-colors flex-shrink-0" aria-label="Limpiar comparación">
                <Icon icon="solar:close-circle-bold" width={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCompareModal && (
          <motion.div className="fixed inset-0 z-[998] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowCompareModal(false)} variants={mayeOverlay} initial="initial" animate="animate" exit="exit">
            <motion.div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-3xl overflow-auto max-h-[90vh]" onClick={e => e.stopPropagation()} variants={mayeModal}>
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
                <h3 className="font-black text-gray-900 text-base sm:text-lg">Comparar productos</h3>
                <div className="flex items-center gap-3">
                  <button onClick={() => clearCompare(slug)} className="text-xs transition-opacity hover:opacity-80" style={{ color: cp }}>Limpiar</button>
                  <button onClick={() => setShowCompareModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors" aria-label="Cerrar comparación">
                    <Icon icon="solar:close-circle-bold" width={18} />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <td className="p-4 font-semibold text-gray-500 text-xs uppercase">Detalle</td>
                      {compareItems.map(item => (
                        <td key={item.id} className="p-4 text-center">
                          <div className="flex flex-col items-center gap-2">
                            {item.imagenUrl && <img src={item.imagenUrl} alt={item.descripcion} className="w-16 h-16 object-contain" />}
                            <span className="text-xs font-bold text-gray-800 line-clamp-2 text-center">{item.descripcion}</span>
                            <button onClick={() => { setShowCompareModal(false); onGoProduct(item); }} className="text-[11px] font-bold text-white px-3 py-1 rounded-full" style={{ background: cp }}>Ver producto</button>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Precio', fn: (i: any) => `S/ ${Number(i.precioUnitario).toFixed(2)}` },
                      { label: 'Categoría', fn: (i: any) => i.categoria || '-' },
                      { label: 'Marca', fn: (i: any) => i.marca || '-' },
                      { label: 'Stock', fn: (i: any) => i.stock ?? '-' },
                    ].map(({ label, fn }) => (
                      <tr key={label} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="p-4 text-xs font-semibold text-gray-500">{label}</td>
                        {compareItems.map(item => (
                          <td key={item.id} className="p-4 text-center text-sm text-gray-700">{fn(item)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
