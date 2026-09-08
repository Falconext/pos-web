import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { getProductPricing } from '@/templates/shared/pricing';

const fmt = (value: number) => `S/ ${Number(value || 0).toFixed(2)}`;

function renderStars(rating: number, count: number) {
  // Rating honesto: si no hay reseñas se muestran estrellas grises (no 5 falsas).
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex text-[#ff9d00]">
        {Array.from({ length: 5 }).map((_, index) => (
          <Icon key={index} icon={index < rounded ? 'solar:star-bold' : 'solar:star-linear'} width={16} className={index < rounded ? '' : 'text-gray-300'} />
        ))}
      </div>
      <span className="text-[11px] font-bold text-gray-400">{count > 0 ? `(${count})` : 'Nuevo'}</span>
    </div>
  );
}

function Countdown({ seed }: { seed: number }) {
  const days = 80 + (seed % 70);
  return (
    <div className="flex gap-1.5">
      {[
        [days, 'DÍAS'],
        [String((seed * 3) % 24).padStart(2, '0'), 'HRS'],
        [String((seed * 7) % 60).padStart(2, '0'), 'MIN'],
        [String((seed * 11) % 60).padStart(2, '0'), 'SEG'],
      ].map(([value, label]) => (
        <span key={label} className="rounded-md bg-red-50 px-2 py-1 text-center text-[11px] font-black leading-tight text-red-500">
          {value}<br />{label}
        </span>
      ))}
    </div>
  );
}

/**
 * Tarjeta de producto del template Ferretería (Hammer). Compartida entre el
 * home y el catálogo para que ambos se vean iguales.
 */
export default function HammerCatalogCard({ producto, cp, cta, onOpen, onAdd }: { producto: any; cp: string; cta?: string; onOpen: () => void; onAdd: (cantidad?: number) => void }) {
  const ctaColor = cta || cp; // "Color de acento / CTA" con fallback al color principal
  const pricing = getProductPricing(producto);
  const hasVariants = Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const rating = Number(producto?.ratingAvg || producto?.ratingPromedio || producto?.promedioRating || 0);
  const ratingCount = Number(producto?.ratingCount || producto?.reviewsCount || producto?.totalReviews || 0);
  const stock = Number(producto?.stock ?? 1);
  const isOutOfStock = stock <= 0;
  const lowStock = !isOutOfStock && stock <= 5;
  const idSeed = Number(producto?.id || 1);

  const [qty, setQty] = useState(1);
  const [qtyText, setQtyText] = useState('1');
  useEffect(() => { setQtyText(String(qty)); }, [qty]);

  const commitQty = () => {
    const parsed = parseInt(qtyText.replace(/\D/g, ''), 10);
    const next = Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
    setQty(next);
    setQtyText(String(next));
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group relative flex cursor-pointer flex-col rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-shadow duration-300 hover:border-gray-300 hover:shadow-xl"
      onClick={onOpen}
    >
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
        {pricing.enOferta && (
          <span className="rounded-md px-2 py-1 text-[10px] font-black text-[#111]" style={{ background: cp }}>
            -{pricing.porcentajeDescuento}%
          </span>
        )}
        {isOutOfStock ? (
          <span className="rounded-md bg-gray-800 px-2 py-1 text-[10px] font-black text-white">Sin stock</span>
        ) : lowStock ? (
          <span className="rounded-md bg-red-500 px-2 py-1 text-[10px] font-black text-white">¡Últimas {stock}!</span>
        ) : null}
      </div>

      <div className="relative flex h-[230px] items-center justify-center overflow-hidden rounded-lg bg-gray-50 p-4">
        {producto.imagenUrl ? (
          <img src={producto.imagenUrl} alt={producto.descripcion} className={`max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`} />
        ) : (
          <Icon icon="solar:box-bold-duotone" width={86} className="text-gray-200" />
        )}
        {pricing.enOferta && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
            <Countdown seed={idSeed} />
          </div>
        )}
        <div className="absolute right-2 top-2 hidden flex-col overflow-hidden rounded-md bg-white shadow-lg group-hover:flex">
          {['solar:heart-linear', 'solar:chart-2-linear', 'solar:eye-linear'].map((icon) => (
            <button key={icon} type="button" onClick={(event) => event.stopPropagation()} className="flex h-9 w-9 items-center justify-center border-b border-gray-100 text-gray-600 transition-colors last:border-b-0 hover:text-[#111]">
              <Icon icon={icon} width={17} />
            </button>
          ))}
        </div>
      </div>

      <h3 title={producto.descripcion} className="mt-4 min-h-[42px] break-words text-[15px] font-black leading-snug text-[#151515] line-clamp-2">{producto.descripcion}</h3>
      <div className="mt-2">{renderStars(rating, ratingCount)}</div>
      <div className="mt-2 flex items-center gap-2 text-[18px] font-black text-[#151515]">
        {pricing.enOferta && <span className="text-[14px] font-bold text-gray-400 line-through">{fmt(pricing.precioRegular)}</span>}
        <span>{fmt(pricing.precioFinal)}</span>
      </div>
      <p className="mt-0.5 text-[11px] font-semibold text-gray-400">IGV incluido</p>

      <div className="mt-auto pt-4">
        {hasVariants ? (
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); onOpen(); }}
            className="w-full rounded-md px-4 py-3 text-[14px] font-black text-[#111] transition-all hover:brightness-95"
            style={{ background: ctaColor }}
          >
            Ver opciones
          </button>
        ) : (
          <div className="flex items-stretch gap-2" onClick={(event) => event.stopPropagation()}>
            <div className="flex h-11 w-[76px] shrink-0 items-center justify-between rounded-md border border-gray-200 bg-white px-1.5 text-[13px] font-black">
              <button type="button" disabled={isOutOfStock} onClick={() => setQty(Math.max(1, qty - 1))} className="px-1 text-lg leading-none text-gray-600 disabled:text-gray-300">−</button>
              <input
                type="text"
                inputMode="numeric"
                aria-label="Cantidad"
                disabled={isOutOfStock}
                value={qtyText}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  setQtyText(digits);
                  if (digits !== '') setQty(parseInt(digits, 10));
                }}
                onBlur={commitQty}
                onFocus={(e) => e.currentTarget.select()}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                className="w-full min-w-0 appearance-none border-0 bg-transparent p-0 text-center font-black text-[#111] outline-none focus:ring-0 disabled:text-gray-300"
              />
              <button type="button" disabled={isOutOfStock} onClick={() => setQty(Math.max(1, qty) + 1)} className="px-1 text-lg leading-none text-gray-600 disabled:text-gray-300">+</button>
            </div>
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => { if (!isOutOfStock) onAdd(Math.max(1, qty)); }}
              className="flex min-w-0 flex-1 items-center justify-center gap-1.5 truncate rounded-md px-2 py-3 text-[13px] font-black text-[#111] transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
              style={isOutOfStock ? undefined : { background: ctaColor }}
            >
              <Icon icon="solar:cart-plus-bold" width={18} className="shrink-0" />
              <span className="truncate">{isOutOfStock ? 'Sin stock' : 'Agregar'}</span>
            </button>
          </div>
        )}
      </div>
    </motion.article>
  );
}
