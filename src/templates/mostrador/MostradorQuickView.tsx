import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { getProductPricing, withPricing } from '@/templates/shared/pricing';
import { sinStock, pocasUnidades } from '@/templates/shared/ventaSinStock';
import {
  getFashionColors, getFashionColorGallery, getDefaultVariantSelection, findFashionVariant,
  isFashionVariantAvailable, getVariantOptionNames,
} from '@/templates/urbano/fashionVariants';
import ProductoVideo from '@/components/tienda/ProductoVideo';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';
import { NoPhoto, btnCls, moMoney, nameOf, primaryBtn, isLive, type Theme } from './MostradorParts';
import { announceAdded } from './MostradorExtras';
import { moEase, mix } from './motion';

/**
 * Vista rápida del producto: es la "ficha" de esta plantilla de una sola página.
 * Carga la ficha completa de la API (galería, variantes, descripción, video) y deja elegir la opción,
 * la cantidad y agregar al carrito o comprar ya, sin salir del catálogo. Todo el estado vive aquí.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';
const optionsOf = (p: any): { nombre: string; valores: string[] }[] => (Array.isArray(p?.opcionesAtributos) ? p.opcionesAtributos : []);
const htmlToText = (html: any): string => {
  let s = String(html || '').replace(/<\/(p|div|li|h[1-6])>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
  if (typeof document !== 'undefined') { const ta = document.createElement('textarea'); ta.innerHTML = s; s = ta.value; }
  return s.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n').trim();
};

export type CartLine = Record<string, any>;

export function MostradorQuickView({ t, slug, producto: base, tienda, diseno, onClose, onAddLine, onBuyNow }: {
  t: Theme; slug: string; producto: any | null; tienda: any; diseno: any;
  onClose: () => void;
  /** Agrega una línea ya armada (con id único por variante) al carrito. */
  onAddLine: (line: CartLine) => void;
  /** Agrega y lleva al checkout. */
  onBuyNow: (line: CartLine) => void;
}) {
  const [full, setFull] = useState<any>(null);
  const producto = full || base;

  useEffect(() => {
    setFull(null);
    if (!base?.id || !isLive(slug)) return;
    let alive = true;
    axios.get(`${BASE_URL}/public/store/${slug}/products/${base.id}`)
      .then((r) => { if (alive) setFull(withPricing(r.data?.data || r.data)); })
      .catch(() => { /* se queda con los datos del listado */ });
    return () => { alive = false; };
  }, [base?.id, slug]);

  useEffect(() => {
    if (!base) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [base, onClose]);

  return (
    <AnimatePresence>
      {base && (
        <motion.div key="qv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[55] flex items-end justify-center bg-stone-900/45 backdrop-blur-[2px] sm:items-center sm:p-6" onClick={onClose} role="dialog" aria-label={producto?.descripcion}>
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ duration: 0.28, ease: moEase }} onClick={(e) => e.stopPropagation()} className="relative flex max-h-[92vh] w-full max-w-[920px] flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl" style={{ fontFamily: t.font }}>
            <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm" style={{ color: t.ink }}><Icon icon="solar:close-circle-linear" width={22} /></button>
            <QuickViewBody key={producto?.id} t={t} producto={producto} tienda={tienda} diseno={diseno} loadingFull={isLive(slug) && !full} onAddLine={onAddLine} onBuyNow={onBuyNow} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function QuickViewBody({ t, producto, tienda, diseno, loadingFull, onAddLine, onBuyNow }: { t: Theme; producto: any; tienda: any; diseno: any; loadingFull: boolean; onAddLine: (l: CartLine) => void; onBuyNow: (l: CartLine) => void }) {
  const pricing = getProductPricing(producto);
  const options = optionsOf(producto);
  const hasVariants = options.length > 0 && Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const colorName = getVariantOptionNames(producto).color;
  const colors = useMemo(() => getFashionColors(producto), [producto]);
  const [selection, setSelection] = useState<Record<string, string>>(() => getDefaultVariantSelection(producto));
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [hint, setHint] = useState(false);
  useEffect(() => { setSelection(getDefaultVariantSelection(producto)); }, [producto?.variantes?.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedColor = selection[colorName] || colors[0]?.name || '';
  const activeVariant = useMemo(() => (hasVariants ? findFashionVariant(producto, selection) : null), [producto, selection, hasVariants]);
  const allSelected = hasVariants ? options.every((o) => !!selection[o.nombre]) : true;
  const stock = activeVariant ? Number(activeVariant.stock || 0) : Number(producto?.stock ?? 0);
  const isOut = hasVariants ? allSelected && sinStock(stock) : sinStock(stock);
  const canAdd = hasVariants ? allSelected && !!activeVariant && !sinStock(stock) : !sinStock(stock);
  const price = activeVariant ? Number(activeVariant.precioUnitario || pricing.precioFinal) : pricing.precioFinal;
  const missing = hasVariants ? options.find((o) => !selection[o.nombre])?.nombre : '';
  const images: string[] = useMemo(() => {
    const byColor = hasVariants && selectedColor ? getFashionColorGallery(producto, selectedColor) : [];
    if (byColor.length) return byColor;
    const extra = Array.isArray(producto?.imagenesExtra) ? producto.imagenesExtra.map((x: any) => (typeof x === 'string' ? x : x?.url || x?.imagenUrl)) : [];
    return Array.from(new Set([producto?.imagenUrl, ...extra].filter(Boolean))) as string[];
  }, [producto, selectedColor, hasVariants]);
  useEffect(() => setImg(0), [images.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  const description = producto?.descripcionLarga ? htmlToText(producto.descripcionLarga) : '';
  const code = String(activeVariant?.codigo || producto?.codigo || '').trim();
  const categoria = nameOf(producto?.categoria);
  const marca = nameOf(producto?.marca);
  // La unidad llega como objeto { codigo: 'NIU', nombre: 'Unidad' }; "Unidad" no aporta, se muestra solo si dice algo (kg, caja, docena…).
  const unidad = (() => { const n = String(nameOf(producto?.unidadMedida) || '').trim().toLowerCase(); return n && n !== 'unidad' && n !== 'und' ? n : ''; })();
  const waNumber = tienda?.whatsappTienda ?? diseno?.whatsappTienda;
  const variantKey = hasVariants ? options.map((o) => selection[o.nombre]).filter(Boolean).join(' / ') : '';
  const askUrl = buildStorePurchaseWhatsappUrl(waNumber, `Hola, tengo una consulta sobre ${code ? `[${code}] ` : ''}${producto?.descripcion}${variantKey ? ` (${variantKey})` : ''}.`);

  /** Línea de carrito: cada combinación de variante es su propia línea (id único) para poder editarla. */
  const buildLine = (): CartLine => {
    const id = variantKey ? `${producto.id}::${variantKey}` : producto.id;
    return {
      ...producto,
      id,
      cartId: String(id),
      productoId: producto.id,
      varianteId: activeVariant?.id,
      valoresAtributos: activeVariant?.valoresAtributos || (hasVariants ? selection : undefined),
      precioUnitario: price,
      precioBase: price,
      precioOferta: undefined,
      imagenUrl: images[0] || producto?.imagenUrl,
      cantidad: Math.max(1, qty),
      descripcion: variantKey ? `${producto.descripcion} — ${variantKey}` : producto.descripcion,
      codigo: activeVariant?.codigo || producto?.codigo,
      modificadores: [],
    };
  };
  const add = (buy = false) => {
    if (!canAdd) { setHint(true); return; }
    const line = buildLine();
    if (buy) { onBuyNow(line); return; }
    onAddLine(line);
    announceAdded(line, line.cantidad);
  };
  const src = images[img];

  return (
    <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[1.05fr_1fr]">
      <div className="relative p-3 md:p-4">
        <div className="relative aspect-square overflow-hidden rounded-2xl" style={{ background: t.card }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={src || 'none'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0">
              {src ? <img src={src} alt={producto?.descripcion} className={`h-full w-full object-contain mix-blend-multiply ${isOut ? 'opacity-60 grayscale' : ''}`} /> : <NoPhoto t={t} size={80} />}
            </motion.div>
          </AnimatePresence>
          {pricing.enOferta && !activeVariant && <span className="absolute left-3 top-3 rounded-md px-2 py-0.5 text-[12px] font-extrabold" style={{ background: t.accent, color: t.onAccent }}>-{pricing.porcentajeDescuento}%</span>}
        </div>
        {images.length > 1 && (
          <div className="mt-2.5 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {images.slice(0, 8).map((im, i) => (
              <button key={`${im}-${i}`} type="button" aria-label={`Ver imagen ${i + 1}`} onClick={() => setImg(i)} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl" style={{ background: t.card, boxShadow: i === img ? `inset 0 0 0 2px ${t.primary}` : `inset 0 0 0 1px ${t.line}` }}>
                <img src={im} alt="" className="h-full w-full object-contain mix-blend-multiply" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col px-5 pb-5 md:py-6 md:pl-2 md:pr-7">
        <div className="flex flex-wrap items-center gap-2 pr-10 text-[11.5px] font-semibold">
          {code && <span className="rounded-md px-2 py-0.5" style={{ background: t.card, color: t.muted }}>{code}</span>}
          {categoria && <span className="rounded-md px-2 py-0.5" style={{ background: t.softer, color: t.primaryInk }}>{categoria}</span>}
          {marca && <span style={{ color: t.muted }}>{marca}</span>}
        </div>
        <h2 className="mt-2.5 text-[22px] font-extrabold leading-tight tracking-[-0.01em]" style={{ color: t.ink }}>{producto?.descripcion}</h2>
        <div className="mt-3 flex items-baseline gap-2.5">
          <span className="text-[28px] font-extrabold leading-none" style={{ color: t.ink }}>{moMoney(price)}</span>
          {pricing.enOferta && !activeVariant && <span className="text-[14px] line-through" style={{ color: t.muted }}>{moMoney(pricing.precioRegular)}</span>}
          {unidad && <span className="text-[12px]" style={{ color: t.muted }}>/ {unidad}</span>}
        </div>

        {hasVariants && colors.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-[12px] font-bold" style={{ color: t.ink }}>{colorName}: <span className="font-medium" style={{ color: t.muted }}>{selectedColor || 'Elige uno'}</span></p>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => {
                const on = selectedColor === c.name;
                const ok = isFashionVariantAvailable(producto, { [colorName]: c.name });
                return (
                  <button key={c.name} type="button" title={c.name} aria-label={c.name} aria-pressed={on} onClick={() => { setHint(false); setSelection((cur) => ({ ...cur, [colorName]: c.name })); }} className="relative flex h-10 w-10 items-center justify-center rounded-full" style={{ boxShadow: on ? `0 0 0 2px ${t.primary}` : `inset 0 0 0 1px ${t.line}`, opacity: ok ? 1 : 0.4 }}>
                    {c.useImage && c.image ? <img src={c.image} alt="" className="h-8 w-8 rounded-full object-cover" /> : <span className="h-8 w-8 rounded-full" style={{ background: c.hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.1)' }} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {hasVariants && options.filter((o) => o.nombre !== colorName || !colors.length).map((op) => (
          <div key={op.nombre} className="mt-4">
            <p className="mb-2 text-[12px] font-bold" style={{ color: t.ink }}>{op.nombre}</p>
            <div className="flex flex-wrap gap-1.5">
              {op.valores.map((val) => {
                const on = selection[op.nombre] === val;
                const ok = isFashionVariantAvailable(producto, { ...selection, [op.nombre]: val });
                return (
                  <button key={val} type="button" disabled={!ok} aria-pressed={on} onClick={() => { setHint(false); setSelection((cur) => ({ ...cur, [op.nombre]: val })); }} className="h-9 min-w-[48px] rounded-lg px-3 text-[12.5px] font-semibold disabled:cursor-not-allowed disabled:opacity-40" style={on ? { background: t.primary, color: t.onPrimary } : { background: '#fff', color: t.ink, boxShadow: `inset 0 0 0 1px ${t.line}` }}>{val}</button>
                );
              })}
            </div>
          </div>
        ))}

        <p className="mt-4 inline-flex items-center gap-2 text-[12.5px] font-semibold" style={{ color: isOut ? t.muted : pocasUnidades(stock) ? t.accentInk : '#16A34A' }}>
          <Icon icon={isOut ? 'solar:close-circle-linear' : 'solar:check-circle-linear'} width={17} />
          {hasVariants && !allSelected ? `Elige ${String(missing || 'una opción').toLowerCase()} para ver disponibilidad` : isOut ? 'Sin stock' : pocasUnidades(stock) ? `Quedan ${stock}` : 'Disponible'}
        </p>

        <div className="mt-4 flex gap-2">
          <div className="flex h-12 w-[124px] shrink-0 items-center justify-between rounded-xl px-1" style={{ background: t.card }}>
            <button type="button" aria-label="Restar" disabled={isOut} onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-10 w-9 items-center justify-center text-[18px] font-bold disabled:opacity-30" style={{ color: t.ink }}>−</button>
            <input type="text" inputMode="numeric" aria-label="Cantidad" disabled={isOut} value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setQty(d === '' ? 1 : Math.max(1, parseInt(d, 10))); }} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 appearance-none border-0 bg-transparent bg-none p-0 text-center text-[15px] font-extrabold outline-none focus:ring-0" style={{ color: t.ink }} />
            <button type="button" aria-label="Sumar" disabled={isOut} onClick={() => setQty(qty + 1)} className="flex h-10 w-9 items-center justify-center text-[18px] font-bold disabled:opacity-30" style={{ color: t.ink }}>+</button>
          </div>
          <button type="button" disabled={isOut} onClick={() => add(false)} className={`${btnCls} h-12 flex-1 disabled:cursor-not-allowed disabled:opacity-45`} style={primaryBtn(t)}>
            <Icon icon="solar:cart-plus-linear" width={19} /> {isOut ? 'Agotado' : 'Agregar al carrito'}
          </button>
        </div>
        <button type="button" disabled={isOut} onClick={() => add(true)} className={`${btnCls} mt-2 h-11 w-full bg-white disabled:cursor-not-allowed disabled:opacity-45`} style={{ color: t.ink, boxShadow: `inset 0 0 0 1.5px ${t.ink}` }}>Comprar ahora</button>
        <AnimatePresence>
          {hint && !canAdd && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-2 text-[12.5px] font-semibold" style={{ color: t.accentInk }}>{missing ? `Selecciona ${missing.toLowerCase()} para continuar.` : 'Esta combinación no está disponible.'}</motion.p>}
        </AnimatePresence>
        {askUrl && (
          <a href={askUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12.5px] font-semibold" style={{ background: mix('#1FA855', 8, '#fff'), color: '#167C3F' }}>
            <Icon icon="ic:baseline-whatsapp" width={19} /> Consultar este producto por WhatsApp
          </a>
        )}

        {loadingFull && !description ? (
          <div className="mt-5 space-y-2">{[0, 1].map((i) => <div key={i} className="h-3 animate-pulse rounded" style={{ background: t.card, width: i ? '70%' : '95%' }} />)}</div>
        ) : description ? (
          <div className="mt-5 border-t pt-4" style={{ borderColor: t.line }}>
            <p className="mb-1.5 text-[12px] font-bold" style={{ color: t.ink }}>Descripción</p>
            <p className="whitespace-pre-line text-[13px] leading-relaxed" style={{ color: mix(t.ink, 78, '#fff') }}>{description}</p>
          </div>
        ) : null}
        <ProductoVideo url={producto?.videoUrl} borde={t.line} className="mt-4" />
      </div>
    </div>
  );
}
