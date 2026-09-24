import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useCompareStore } from '@/zustand/compare';

interface TiendaCompareBarProps {
  slug: string;
  cp: string;
  /** Navega a la ficha del producto (recibe el item de comparación). */
  onGoProduct: (item: any) => void;
}

const money = (value: any) => `S/ ${Number(value || 0).toFixed(2)}`;

/**
 * Barra flotante + modal de comparación genérico (sin dependencias de plantilla).
 * Reutilizable en home y catálogo para que el botón "Comparar" de cada card
 * tenga siempre una UI visible que reaccione.
 */
export default function TiendaCompareBar({ slug, cp, onGoProduct }: TiendaCompareBarProps) {
  const { getBySlug, clear: clearCompare, remove } = useCompareStore();
  const [open, setOpen] = useState(false);
  const items = getBySlug(slug);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="fixed bottom-4 left-1/2 z-[9998] w-max max-w-[95vw] -translate-x-1/2"
          >
            <div className="flex items-center gap-3 rounded-2xl bg-gray-900 px-4 py-3 text-white shadow-2xl">
              <div className="flex -space-x-2">
                {items.slice(0, 3).map((item) => (
                  <div key={item.id} className="h-8 w-8 overflow-hidden rounded-full border-2 border-gray-800 bg-white">
                    {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain" /> : <div className="h-full w-full bg-gray-200" />}
                  </div>
                ))}
              </div>
              <span className="whitespace-nowrap text-sm font-bold">{items.length} para comparar</span>
              <button onClick={() => setOpen(true)} className="whitespace-nowrap rounded-xl px-4 py-1.5 text-sm font-black text-[#111] transition-transform hover:scale-[1.03]" style={{ background: cp }}>
                Comparar
              </button>
              <button onClick={() => clearCompare(slug)} className="text-gray-400 transition-colors hover:text-white" aria-label="Limpiar comparación">
                <Icon icon="solar:close-circle-bold" width={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && items.length > 0 && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h2 className="text-xl font-black text-[#111]">Comparar productos</h2>
                <button onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200">
                  <Icon icon="solar:close-circle-bold" width={22} />
                </button>
              </div>
              <div className="overflow-auto p-6">
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(180px, 1fr))` }}>
                  {items.map((item) => (
                    <div key={item.id} className="flex flex-col rounded-xl border border-gray-200 p-4">
                      <button onClick={() => remove(item.id, slug)} className="mb-2 self-end text-gray-300 transition-colors hover:text-red-500" aria-label="Quitar">
                        <Icon icon="solar:trash-bin-trash-bold" width={16} />
                      </button>
                      <button onClick={() => { setOpen(false); onGoProduct(item); }} className="flex h-32 items-center justify-center rounded-lg bg-gray-50 p-2">
                        {item.imagenUrl ? <img src={item.imagenUrl} alt={item.descripcion} className="max-h-full max-w-full object-contain" /> : <Icon icon="solar:box-bold-duotone" width={48} className="text-gray-200" />}
                      </button>
                      <h3 className="mt-3 line-clamp-2 min-h-[40px] text-sm font-black text-[#111]">{item.descripcion}</h3>
                      <dl className="mt-3 space-y-2 text-xs">
                        <div className="flex justify-between border-t border-gray-100 pt-2"><dt className="text-gray-400">Precio</dt><dd className="font-black text-[#111]">{money(item.precioUnitario)}</dd></div>
                        <div className="flex justify-between border-t border-gray-100 pt-2"><dt className="text-gray-400">Marca</dt><dd className="font-semibold text-gray-700">{item.marca || '—'}</dd></div>
                        <div className="flex justify-between border-t border-gray-100 pt-2"><dt className="text-gray-400">Categoría</dt><dd className="font-semibold text-gray-700">{item.categoria || '—'}</dd></div>
                        <div className="flex justify-between border-t border-gray-100 pt-2"><dt className="text-gray-400">Stock</dt><dd className="font-semibold text-gray-700">{item.stock ?? '—'}</dd></div>
                      </dl>
                      <button onClick={() => { setOpen(false); onGoProduct(item); }} className="mt-4 rounded-md py-2 text-xs font-black text-[#111] transition-transform hover:scale-[1.02]" style={{ background: cp }}>
                        Ver producto
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
}
