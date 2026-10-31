import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { obtenerTiendaPublica } from '@/lib/tiendaPublica';
import { getProductPricing, withPricing, withPricingList } from '@/templates/shared/pricing';
import { onTiendaCartCleared } from '@/utils/tiendaCart';
import { MOTO, MotoCartModal, MotoFooter, MotoHeader, MotoProductCard, MotoProductImage, MotoWhatsAppFab, money, motoFont, motoPrimary, waLink, withAlpha } from '@/templates/motos/MotosParts';
import { motoCard, motoFade, motoPage, motoSection, motoStagger, motoTap, motoViewport } from '@/templates/motos/motion';
import ProductoVideo from '@/components/tienda/ProductoVideo';

import { recordarVentaSinStock, sinStock } from '@/templates/shared/ventaSinStock';
import {
  findFashionVariant, getDefaultVariantSelection, getFashionColorGallery, getFashionColors,
  getVariantOptionNames, isFashionVariantAvailable,
} from '@/templates/urbano/fashionVariants';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

const getImg = (p: any) => p?.imagenUrl || p?.imagen || '';
const nameOf = (p: any) => p?.descripcion || p?.nombre || 'Producto';
const catOf = (p: any) => (typeof p?.categoria === 'object' ? p?.categoria?.nombre : p?.categoria) || '';
const marcaOf = (p: any) => (typeof p?.marca === 'object' ? p?.marca?.nombre : p?.marca) || '';
const optionsOf = (p: any): { nombre: string; valores: string[] }[] => (Array.isArray(p?.opcionesAtributos) ? p.opcionesAtributos : []);
/** Identidad de una línea del carrito: cada variante (color, cilindrada…) va en su propia línea. */
const lineaId = (c: any) => String(c?.cartId ?? c?.productoId ?? c?.id);
/** Texto del primer párrafo de un HTML, para el resumen de arriba. */
const primerParrafo = (html: string) => {
  if (!html) return '';
  const m = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(html);
  const texto = (m ? m[1] : html).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  return texto.length > 240 ? `${texto.slice(0, 237).trimEnd()}…` : texto;
};
const PROSA_MOTO = [
  'text-[15px] leading-7 break-words',
  '[&_p]:mb-4',
  '[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2.5 [&_ul]:pl-5 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:space-y-2.5 [&_ol]:pl-5',
  '[&_li]:pl-1 [&_li::marker]:text-neutral-400',
  '[&_strong]:font-bold [&_strong]:text-neutral-900 [&_b]:font-bold [&_b]:text-neutral-900',
  '[&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-neutral-900 [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:font-bold [&_h3]:text-neutral-900',
  '[&_a]:underline [&_table]:mb-4 [&_table]:w-full [&_table]:text-sm [&_td]:border [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left',
].join(' ');

export function MotosProductoDetalleView({
  tienda,
  slug,
  producto,
  related = [],
  allCategories = [],
  cp,
  carrito,
  setCarrito,
  mostrarCarrito,
  setMostrarCarrito,
  actualizarCantidad,
  onNavigate,
  onAddToCart,
}: {
  tienda: any;
  slug: string;
  producto: any;
  related?: any[];
  allCategories?: any[];
  cp?: string;
  carrito: any[];
  setCarrito?: (items: any[]) => void;
  mostrarCarrito: boolean;
  setMostrarCarrito: (value: boolean) => void;
  actualizarCantidad: (productoId: number | string, cantidad: number) => void;
  onNavigate?: (page: 'home' | 'catalogo' | 'producto' | 'checkout') => void;
  onAddToCart?: (producto: any) => void;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const previewPlantillaId = searchParams.get('previewPlantilla');
  const diseno = tienda?.diseno || {};
  const primary = motoPrimary(cp || diseno?.colorPrimario);
  const font = motoFont(diseno);
  const pricing = getProductPricing(producto);

  const name = nameOf(producto);
  const marca = marcaOf(producto);
  const categoria = catOf(producto);
  // ── Variantes reales (color / cilindrada / lo que haya), igual que en ropa ──
  const options = optionsOf(producto);
  const hasVariants = options.length > 0 && Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const colorName = getVariantOptionNames(producto).color;
  const colors = useMemo(() => getFashionColors(producto), [producto]);
  const [selection, setSelection] = useState<Record<string, string>>(() => getDefaultVariantSelection(producto));
  const [hint, setHint] = useState(false);
  useEffect(() => { setSelection(getDefaultVariantSelection(producto)); setHint(false); }, [producto?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const selectedColor = selection[colorName] || colors[0]?.name || '';
  const activeVariant = useMemo(() => (hasVariants ? findFashionVariant(producto, selection) : null), [producto, selection, hasVariants]);
  const allSelected = hasVariants ? options.every((o) => !!selection[o.nombre]) : true;
  const missing = hasVariants ? options.find((o) => !selection[o.nombre])?.nombre : '';

  const stock = activeVariant ? Number(activeVariant.stock || 0) : Number(producto?.stock ?? 6);
  const outOfStock = hasVariants ? allSelected && sinStock(stock) : sinStock(stock);
  const canAdd = hasVariants ? allSelected && !!activeVariant && !sinStock(stock) : !sinStock(stock);
  const price = activeVariant ? Number(activeVariant.precioUnitario || pricing.precioFinal) : pricing.precioFinal;
  const showStrike = !activeVariant && pricing.enOferta;
  const descripcionLarga = String(producto?.descripcionLarga || '').trim();
  // Arriba va un resumen: el primer párrafo de la descripción larga, si no hay
  // uno corto propio. El texto genérico de "moto eléctrica" queda solo de
  // último recurso (se veía en cascos y repuestos).
  const desc = producto?.detalle || producto?.descripcionCorta || primerParrafo(descripcionLarga) ||
    'Una moto pensada para el día a día. Entrega lista para rodar, con garantía y respaldo de taller propio.';
  const ratingAvg = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const stars = Math.max(1, Math.min(5, Math.round(ratingAvg || 5)));

  const gallery: string[] = useMemo(() => {
    const byColor = hasVariants && selectedColor ? getFashionColorGallery(producto, selectedColor) : [];
    if (byColor.length) return byColor;
    const extra = Array.isArray(producto?.imagenesExtra) ? producto.imagenesExtra.map((x: any) => (typeof x === 'string' ? x : x?.url || x?.imagenUrl)) : [];
    return Array.from(new Set([getImg(producto), ...extra].filter(Boolean))) as string[];
  }, [producto, selectedColor, hasVariants]);
  const [activeImage, setActiveImage] = useState(0);
  useEffect(() => { setActiveImage(0); }, [selectedColor]);
  const [llena, setLlena] = useState(false);
  const [qty, setQty] = useState(1);

  const go = (url: string, page?: 'home' | 'catalogo' | 'producto' | 'checkout') => {
    if (onNavigate && page) { onNavigate(page); return; }
    if (previewPlantillaId) { navigate(`${url}?previewPlantilla=${encodeURIComponent(previewPlantillaId)}`); return; }
    navigate(url);
  };

  // Sirve para la moto de la ficha y para las de "También te puede interesar".
  // Antes los relacionados pasaban por actualizarCantidad(id, 1), que al no
  // encontrar el id agregaba la moto de la FICHA: dos líneas de la misma moto
  // y ninguna de la que el cliente eligió.
  const pushItem = (item: any) => {
    const previo = carrito.find((c) => lineaId(c) === lineaId(item));
    if (onAddToCart) onAddToCart(item);
    else if (setCarrito) {
      setCarrito(previo
        ? carrito.map((c) => (lineaId(c) === lineaId(item) ? { ...c, cantidad: Number(c.cantidad || 0) + item.cantidad } : c))
        : [...carrito, item]);
    } else actualizarCantidad(lineaId(item), Number(previo?.cantidad || 0) + item.cantidad);
    setMostrarCarrito(true);
  };
  const addToCart = (prod: any, n: number) => {
    const pr = getProductPricing(prod);
    pushItem({ ...prod, ...pr, precioUnitario: pr.precioFinal, cantidad: n, id: prod.id, productoId: prod.id, cartId: String(prod.id) });
  };
  /** La moto de la ficha, con la variante elegida (cada combinación es su propia línea). */
  const add = (n = qty) => {
    if (!canAdd) { setHint(true); return false; }
    if (!hasVariants) { addToCart(producto, n); return true; }
    const variantKey = options.map((o) => selection[o.nombre]).filter(Boolean).join(' / ');
    pushItem({
      ...producto,
      ...pricing,
      id: producto.id,
      productoId: producto.id,
      cartId: `${producto.id}::${variantKey}`,
      varianteId: activeVariant?.id,
      valoresAtributos: activeVariant?.valoresAtributos || selection,
      precioUnitario: price,
      precioFinal: price,
      precioOferta: undefined,
      enOferta: false,
      imagenUrl: gallery[0] || activeVariant?.imagenUrl || producto?.imagenUrl,
      cantidad: Math.max(1, n),
      descripcion: `${producto.descripcion} — ${variantKey}`,
      codigo: activeVariant?.codigo || producto?.codigo,
    });
    return true;
  };
  const buyNow = () => { if (add(qty)) go(`/tienda/${slug}/checkout`, 'checkout'); };

  const cartCount = carrito.reduce((s, i) => s + Number(i?.cantidad || 1), 0);
  const relatedFiltered = related.filter((p) => String(p.id) !== String(producto.id)).slice(0, 4);

  return (
    <motion.div initial="hidden" animate="show" variants={motoPage} className="min-h-screen" style={{ backgroundColor: MOTO.page, fontFamily: font }}>
      <MotoHeader
        tienda={tienda}
        slug={slug}
        cp={primary}
        diseno={diseno}
        carritoSize={cartCount}
        onOpenCart={() => setMostrarCarrito(true)}
        allCategories={allCategories}
        onSearchSubmit={(event, value) => {
          event.preventDefault();
          if (value?.trim()) go(`/tienda/${slug}/catalogo`, 'catalogo');
        }}
      />

      {/* Breadcrumb */}
      <div className="border-b" style={{ borderColor: MOTO.line, backgroundColor: MOTO.card }}>
        <div className="mx-auto max-w-7xl px-6 py-6 text-xs font-medium uppercase tracking-[0.16em]" style={{ color: MOTO.faint }}>
          <button type="button" onClick={() => go(`/tienda/${slug}`, 'home')} className="hover:text-neutral-900">Inicio</button>
          <span className="mx-2">/</span>
          <button type="button" onClick={() => go(`/tienda/${slug}/catalogo`, 'catalogo')} className="hover:text-neutral-900">Catálogo</button>
          <span className="mx-2">/</span>
          <span style={{ color: MOTO.muted }}>{name}</span>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          {/* Galería — imagen completa sobre fondo de estudio */}
          <motion.div variants={motoFade}>
            <div className="group relative overflow-hidden rounded-3xl border" style={{ borderColor: MOTO.line, background: `radial-gradient(120% 120% at 50% 0%, ${withAlpha(primary, '14')} 0%, ${MOTO.card} 55%)` }}>
              {marca && (
                <span className="absolute left-5 top-5 z-10 rounded-full border bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur" style={{ borderColor: MOTO.line, color: MOTO.ink }}>{marca}</span>
              )}
              {pricing.enOferta && (
                <span className="absolute right-5 top-5 z-10 rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-sm" style={{ backgroundColor: MOTO.sale }}>
                  Oferta -{pricing.porcentajeDescuento}%
                </span>
              )}
              {/* Antes la foto iba chica, con margen y drop-shadow, y se veía un
                  cuadro blanco flotando. Una foto cuadrada (la mayoría) ahora
                  llena el recuadro de borde a borde; una apaisada se ve completa
                  y multiply funde su fondo blanco con el de estudio. */}
              <div className={`flex aspect-square w-full items-center justify-center ${llena ? '' : 'p-6 md:p-8'}`}>
                {gallery[activeImage] ? (
                  <img
                    src={gallery[activeImage]}
                    alt={name}
                    onLoad={(e) => {
                      const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                      setLlena(h > 0 && Math.abs(w / h - 1) <= 0.15);
                    }}
                    className={`h-full w-full transition-transform duration-[800ms] ease-out group-hover:scale-[1.04] ${llena ? 'object-cover' : 'object-contain mix-blend-multiply'}`}
                  />
                ) : (
                  <MotoProductImage producto={producto} imgClassName="!object-contain" />
                )}
              </div>
            </div>
            {gallery.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {gallery.slice(0, 6).map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border-2 p-2 transition-colors"
                    style={{ background: 'linear-gradient(180deg, #FFFFFF, #F1F3F6)', borderColor: i === activeImage ? primary : MOTO.line }}
                  >
                    <img src={src} alt="" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info — tarjeta sticky */}
          <motion.div variants={motoSection} className="h-fit lg:sticky lg:top-28">
            <div className="rounded-3xl border p-7 shadow-[0_1px_2px_rgba(15,18,26,0.04)] md:p-8" style={{ backgroundColor: MOTO.card, borderColor: MOTO.line }}>
              {marca && <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: primary }}>{marca}</p>}
              <h1 className="mt-2 text-3xl font-extrabold uppercase leading-[1.02] tracking-[-0.01em] md:text-4xl" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>{name}</h1>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-base leading-none" style={{ color: primary }}>{'★'.repeat(stars)}<span style={{ color: MOTO.raise }}>{'★'.repeat(5 - stars)}</span></span>
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold" style={{ backgroundColor: MOTO.soft, color: MOTO.body }}>
                  <Icon icon="solar:tag-linear" width={13} /> {categoria || 'Motos'}
                </span>
              </div>

              <div className="mt-6 flex items-end justify-between gap-3 rounded-2xl p-5" style={{ backgroundColor: MOTO.soft }}>
                <div className="flex items-baseline gap-2.5">
                  {!activeVariant && <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: MOTO.faint }}>Desde</span>}
                  <span className="text-4xl font-extrabold" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>{money(price)}</span>
                </div>
                <div className="flex flex-col items-end">
                  {showStrike && <span className="text-sm font-medium line-through" style={{ color: MOTO.faint }}>{money(pricing.precioRegular)}</span>}
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: outOfStock ? MOTO.faint : '#16A34A' }}>
                    <Icon icon={outOfStock ? 'solar:close-circle-bold' : 'solar:check-circle-bold'} width={14} />
                    {hasVariants && !allSelected ? 'Elige una opción' : outOfStock ? 'Agotado' : 'En stock'}
                  </span>
                </div>
              </div>

              <p className="mt-5 text-sm leading-relaxed" style={{ color: MOTO.body }}>{desc}</p>

              {/* Color */}
              {hasVariants && colors.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: MOTO.ink }}>
                    {colorName}: <span className="font-semibold normal-case tracking-normal" style={{ color: MOTO.muted }}>{selectedColor || 'Elige uno'}</span>
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {colors.map((c) => {
                      const active = selectedColor === c.name;
                      const available = isFashionVariantAvailable(producto, { [colorName]: c.name });
                      return (
                        <button
                          key={c.name}
                          type="button"
                          title={c.name}
                          aria-label={c.name}
                          aria-pressed={active}
                          onClick={() => { setHint(false); setSelection((cur) => ({ ...cur, [colorName]: c.name })); }}
                          className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border-2 bg-white transition-colors"
                          style={{ borderColor: active ? primary : MOTO.line, opacity: available ? 1 : 0.45 }}
                        >
                          {c.useImage && c.image
                            ? <img src={c.image} alt="" className="h-9 w-9 rounded-md object-contain mix-blend-multiply" />
                            : <span className="h-7 w-7 rounded-full" style={{ background: c.hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.12)' }} />}
                          {!available && <span aria-hidden className="absolute h-px w-14 rotate-45" style={{ background: MOTO.faint }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cilindrada, versión y demás opciones */}
              {hasVariants && options.filter((o) => o.nombre !== colorName).map((op) => (
                <div key={op.nombre} className="mt-5">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: MOTO.ink }}>
                    {op.nombre}{selection[op.nombre] && <span className="font-semibold normal-case tracking-normal" style={{ color: MOTO.muted }}>: {selection[op.nombre]}</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {op.valores.map((val) => {
                      const active = selection[op.nombre] === val;
                      const available = isFashionVariantAvailable(producto, { ...selection, [op.nombre]: val });
                      return (
                        <button
                          key={val}
                          type="button"
                          disabled={!available}
                          aria-pressed={active}
                          onClick={() => { setHint(false); setSelection((cur) => ({ ...cur, [op.nombre]: val })); }}
                          className="relative min-w-[3.25rem] rounded-lg border-2 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] transition-colors disabled:cursor-not-allowed"
                          style={active
                            ? { borderColor: primary, backgroundColor: withAlpha(primary, '12'), color: primary }
                            : { borderColor: MOTO.line, backgroundColor: MOTO.card, color: available ? MOTO.ink : MOTO.faint }}
                        >
                          {val}
                          {!available && <span aria-hidden className="absolute left-1/2 top-1/2 h-px w-3/4 -translate-x-1/2 -rotate-12" style={{ background: MOTO.faint }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {hasVariants && hint && !canAdd && (
                <p className="mt-4 text-xs font-semibold" style={{ color: primary }}>
                  {!allSelected ? `Elige ${String(missing || 'una opción').toLowerCase()} para continuar.` : 'Esta combinación no tiene stock. Prueba otra.'}
                </p>
              )}

              {/* Acciones */}
              <div className="mt-6 flex items-center gap-3">
                <div className="inline-flex h-[52px] items-center rounded-lg border" style={{ borderColor: MOTO.line, backgroundColor: MOTO.soft }}>
                  <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-[52px] w-11 place-items-center text-lg" style={{ color: MOTO.muted }}>−</button>
                  <span className="w-8 text-center text-sm font-semibold" style={{ color: MOTO.ink }}>{qty}</span>
                  <button type="button" onClick={() => setQty(qty + 1)} className="grid h-[52px] w-11 place-items-center text-lg" style={{ color: MOTO.muted }}>+</button>
                </div>
                <motion.button
                  type="button"
                  disabled={outOfStock}
                  onClick={() => add()}
                  whileHover={outOfStock ? undefined : { scale: 1.02, y: -2 }}
                  whileTap={outOfStock ? undefined : motoTap}
                  className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-lg px-6 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: primary }}
                >
                  <Icon icon="solar:cart-plus-linear" width={17} /> Añadir al carrito
                </motion.button>
              </div>
              <motion.button
                type="button"
                disabled={outOfStock}
                onClick={buyNow}
                whileHover={outOfStock ? undefined : { y: -2 }}
                whileTap={outOfStock ? undefined : motoTap}
                className="mt-3 w-full rounded-lg py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: MOTO.ink }}
              >
                Comprar ahora
              </motion.button>

              {/* Beneficios */}
              <div className="mt-7 grid gap-3 border-t pt-6 sm:grid-cols-3" style={{ borderColor: MOTO.line }}>
                {[
                  ['solar:shield-check-linear', 'Garantía oficial'],
                  ['solar:wrench-linear', 'Taller propio'],
                  ['solar:box-minimalistic-linear', 'Entrega nacional'],
                ].map(([icon, text]) => (
                  <div key={text} className="flex items-center gap-2 text-xs" style={{ color: MOTO.body }}>
                    <Icon icon={icon} width={18} style={{ color: primary }} />
                    {text}
                  </div>
                ))}
              </div>

              {/* Financiamiento + compartir */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-6" style={{ borderColor: MOTO.line }}>
                <span className="inline-flex items-center gap-2 text-xs font-semibold" style={{ color: MOTO.body }}>
                  <Icon icon="solar:card-linear" width={16} style={{ color: primary }} /> Financiamiento disponible
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: MOTO.faint }}>Compartir</span>
                  {['mdi:whatsapp', 'mdi:facebook', 'mdi:instagram'].map((ic) => (
                    <a key={ic} href={ic === 'mdi:whatsapp' ? waLink(tienda, `Hola, me interesa: ${name}`) : '#'} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-lg border transition-colors hover:bg-black/[0.03]" style={{ borderColor: MOTO.line, color: MOTO.muted }}>
                      <Icon icon={ic} width={17} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Descripción larga */}
        <motion.section initial="hidden" whileInView="show" viewport={motoViewport} variants={motoSection} className="mt-8 rounded-3xl border p-8 shadow-[0_1px_2px_rgba(15,18,26,0.04)] md:p-10" style={{ backgroundColor: MOTO.card, borderColor: MOTO.line }}>
          <div className="flex items-center gap-2.5">
            <span className="h-px w-6" style={{ backgroundColor: primary }} />
            <h2 className="text-2xl font-extrabold uppercase tracking-[0.02em]" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>Descripción</h2>
          </div>
          {/* HTML del editor de producto, como en la plantilla clásica. Antes se
              le quitaban las etiquetas y la lista quedaba en un solo párrafo. */}
          {descripcionLarga
            ? <div className={`mt-5 max-w-4xl ${PROSA_MOTO}`} style={{ color: MOTO.body }} dangerouslySetInnerHTML={{ __html: descripcionLarga }} />
            : <p className="mt-4 max-w-3xl text-sm leading-7" style={{ color: MOTO.body }}>{desc}</p>}
          <div className="mt-6 grid gap-3 border-t pt-6 text-sm sm:grid-cols-2" style={{ borderColor: MOTO.line }}>
            <p><span className="font-semibold" style={{ color: MOTO.ink }}>Categoría:</span> <span style={{ color: MOTO.muted }}>{categoria || '—'}</span></p>
            <p><span className="font-semibold" style={{ color: MOTO.ink }}>Marca:</span> <span style={{ color: MOTO.muted }}>{marca || '—'}</span></p>
            <p><span className="font-semibold" style={{ color: MOTO.ink }}>SKU:</span> <span style={{ color: MOTO.muted }}>{producto?.codigo || producto?.sku || '—'}</span></p>
            <p><span className="font-semibold" style={{ color: MOTO.ink }}>Disponibilidad:</span> <span style={{ color: MOTO.muted }}>{outOfStock ? 'Agotado' : `${stock} unidades`}</span></p>
          </div>
        </motion.section>

        {/* Relacionados */}
        <ProductoVideo url={producto?.videoUrl} />
        {relatedFiltered.length > 0 && (
          <motion.section initial="hidden" whileInView="show" viewport={motoViewport} variants={motoSection} className="mt-16">
            <div className="mb-8 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: primary }}>Descubre más</p>
              <h2 className="mt-2 text-3xl font-extrabold uppercase tracking-[0.02em]" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>También te puede interesar</h2>
            </div>
            <motion.div variants={motoStagger} className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
              {relatedFiltered.map((p) => (
                <MotoProductCard key={p.id} producto={p} slug={slug} cp={primary} onAddToCart={(prod) => addToCart(prod, 1)} onClick={() => go(`/tienda/${slug}/producto/${p.id}`, 'producto')} />
              ))}
            </motion.div>
          </motion.section>
        )}
      </main>

      <MotoFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <MotoWhatsAppFab tienda={tienda} />

      {setCarrito && (
        <MotoCartModal
          isOpen={mostrarCarrito}
          onClose={() => setMostrarCarrito(false)}
          carrito={carrito}
          setCarrito={setCarrito}
          actualizarCantidad={actualizarCantidad}
          onCheckout={() => go(`/tienda/${slug}/checkout`, 'checkout')}
          cp={primary}
          tienda={tienda}
        />
      )}
    </motion.div>
  );
}

/* ─────────────── Wrapper que hace fetch (tienda real) ─────────────── */
// Carritos guardados con el bug de los relacionados traen la misma moto en dos
// líneas: se juntan en una sumando cantidades.
const unirRepetidos = (items: any[]) => {
  if (!Array.isArray(items)) return [];
  const porId = new Map<string, any>();
  for (const it of items) {
    const k = lineaId(it);
    const ya = porId.get(k);
    porId.set(k, ya ? { ...ya, cantidad: Number(ya.cantidad || 0) + Number(it?.cantidad || 0) } : it);
  }
  return [...porId.values()];
};

export default function MotosProductoDetalle() {
  const { slug = '', id = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const previewPlantillaId = searchParams.get('previewPlantilla');
  const [tienda, setTienda] = useState<any>(null);
  const [producto, setProducto] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    try { const saved = localStorage.getItem(`tienda:${slug}:carrito`); if (saved) setCarrito(unirRepetidos(JSON.parse(saved))); } catch {}
    return onTiendaCartCleared(slug, () => { setCarrito([]); setMostrarCarrito(false); });
  }, [slug]);

  useEffect(() => {
    if (slug) localStorage.setItem(`tienda:${slug}:carrito`, JSON.stringify(carrito));
  }, [carrito, slug]);

  useEffect(() => {
    if (!slug || !id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [storeRes, catRes, productRes] = await Promise.all([
          obtenerTiendaPublica(slug),
          axios.get(`${BASE_URL}/public/store/${slug}/categories`),
          axios.get(`${BASE_URL}/public/store/${slug}/products/${id}`),
        ]);
        const store = storeRes.data.data || storeRes.data;
        const product = withPricing(productRes.data.data || productRes.data);
        setTienda(recordarVentaSinStock(store));
        setAllCategories(Array.isArray(catRes.data?.data) ? catRes.data.data : []);
        setProducto(product);
        const category = catOf(product);
        if (category) {
          const relatedRes = await axios.get(`${BASE_URL}/public/store/${slug}/products`, { params: { category, limit: 6 } });
          const arr = Array.isArray(relatedRes.data?.data?.data) ? relatedRes.data.data.data : Array.isArray(relatedRes.data?.data) ? relatedRes.data.data : [];
          setRelated(withPricingList(arr.filter((item: any) => Number(item.id) !== Number(id)).slice(0, 4)));
        }
      } catch {
        navigate(`/tienda/${slug}${previewPlantillaId ? `?previewPlantilla=${encodeURIComponent(previewPlantillaId)}` : ''}`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, id, navigate, previewPlantillaId]);

  // El modal del carrito identifica cada línea por cartId (una por variante):
  // comparar por producto movía o borraba todas las variantes juntas.
  const actualizarCantidad = (lineaKey: number | string, cantidad: number) => {
    const k = String(lineaKey);
    const es = (item: any) => lineaId(item) === k || (!item.cartId && String(item.id) === k);
    setCarrito((current) => {
      const exists = current.some(es);
      if (cantidad <= 0) return current.filter((item) => !es(item));
      if (exists) return current.map((item) => (es(item) ? { ...item, cantidad } : item));
      if (producto) {
        const pr = getProductPricing(producto);
        return [...current, { ...producto, ...pr, precioUnitario: pr.precioFinal, cantidad, id: producto.id, productoId: producto.id }];
      }
      return current;
    });
  };

  const memoStore = useMemo(() => tienda || {}, [tienda]);

  if (loading) return <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: MOTO.page }}><Icon icon="eos-icons:loading" className="h-12 w-12 animate-spin" style={{ color: MOTO.faint }} /></div>;
  if (!producto) return null;

  return (
    <MotosProductoDetalleView
      tienda={memoStore}
      slug={slug}
      producto={producto}
      related={related}
      allCategories={allCategories}
      carrito={carrito}
      setCarrito={setCarrito}
      mostrarCarrito={mostrarCarrito}
      setMostrarCarrito={setMostrarCarrito}
      actualizarCantidad={actualizarCantidad}
    />
  );
}
