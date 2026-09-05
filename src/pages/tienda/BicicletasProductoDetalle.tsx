import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { getProductPricing, withPricing, withPricingList } from '@/templates/shared/pricing';
import { onTiendaCartCleared } from '@/utils/tiendaCart';
import {
  findFashionVariant,
  getDefaultVariantSelection,
  getFashionColorGallery,
  getFashionColorImage,
  getFashionColors,
  getFashionSizes,
  getVariantOptionNames,
  variantValues,
} from '@/templates/urbano/fashionVariants';
import { VELO, VeloCartModal, VeloFooter, VeloHeader, VeloProductCard, VeloProductImage, VeloStars, VeloWhatsAppFab, veloFont, veloPrimary, waLink, withAlpha } from '@/templates/bicicletas/BicicletasParts';
import { veloCard, veloFade, veloPage, veloSection, veloStagger, veloTap, veloViewport } from '@/templates/bicicletas/motion';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

const money = (v: number) => `S/ ${Number(v || 0).toFixed(2)}`;
const getImg = (p: any) => p?.imagenUrl || p?.imagen || '';
const nameOf = (p: any) => p?.descripcion || p?.nombre || 'Producto';
const catOf = (p: any) => (typeof p?.categoria === 'object' ? p?.categoria?.nombre : p?.categoria) || '';
const marcaOf = (p: any) => (typeof p?.marca === 'object' ? p?.marca?.nombre : p?.marca) || '';

export function BicicletasProductoDetalleView({
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
  const primary = veloPrimary(cp || diseno?.colorPrimario);
  const font = veloFont(diseno);
  const pricing = getProductPricing(producto);

  const name = nameOf(producto);
  const marca = marcaOf(producto);
  const categoria = catOf(producto);
  const desc = producto?.detalle || producto?.descripcionCorta ||
    'Una máquina construida para rendir. Cuadro ligero, componentes de precisión y geometría pensada para que rindas al máximo en cada salida.';
  const ratingAvg = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const reviews = Number(producto?.reviewsCount || producto?.ratingCount || 0);

  // ── Variantes (color con imágenes por color + talla) ────────────────────
  const hasVariants = Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const optionNames = useMemo(() => getVariantOptionNames(producto), [producto]);
  const colorOptions = useMemo(() => getFashionColors(producto), [producto]);
  const sizeOptions = useMemo(() => getFashionSizes(producto), [producto]);

  const [variantSel, setVariantSel] = useState<Record<string, string>>({});
  useEffect(() => { setVariantSel(getDefaultVariantSelection(producto)); }, [producto?.id]);

  // Resuelve el valor elegido tolerando diferencias de nombre de clave (Color/color/…).
  const selectedColor = variantSel[optionNames.color]
    || Object.entries(variantSel).find(([k]) => k.toLowerCase().includes('color') || k.toLowerCase().includes('colour'))?.[1]
    || '';
  const selectedSize = variantSel[optionNames.size]
    || Object.entries(variantSel).find(([k]) => /talla|size|tama/.test(k.toLowerCase()))?.[1]
    || '';
  const activeVariant = useMemo(() => findFashionVariant(producto, variantSel), [producto, variantSel]);
  const needsSelection = hasVariants && (colorOptions.length > 0 || sizeOptions.length > 0) && !activeVariant;

  // Precio/stock según la variante elegida.
  const variantPrice = Number(activeVariant?.precioUnitario ?? NaN);
  const activePricing = Number.isFinite(variantPrice)
    ? { precioFinal: variantPrice, precioRegular: Math.max(pricing.precioRegular, variantPrice), enOferta: pricing.enOferta && pricing.precioRegular > variantPrice, porcentajeDescuento: pricing.enOferta && pricing.precioRegular > variantPrice ? Math.round(((pricing.precioRegular - variantPrice) / pricing.precioRegular) * 100) : 0 }
    : pricing;
  const stock = activeVariant ? Number(activeVariant.stock ?? 0) : Number(producto?.stock ?? 12);
  const outOfStock = hasVariants ? (!!activeVariant && stock <= 0) : stock <= 0;

  // Galería: SIEMPRE todas las imágenes (cada una etiquetada con su color) a un
  // costado. Al elegir un color se salta a su imagen y se resalta; cada miniatura
  // lleva un punto con su color para indicar a cuál pertenece.
  const norm = (v: any) => String(v || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();
  const colorHexByName = useMemo(
    () => Object.fromEntries(colorOptions.map((c) => [norm(c.name), c.hex])),
    [colorOptions],
  );
  // Disponibilidad tolerante a diferencias de mayúsculas/acentos entre las opciones
  // y los valores guardados en las variantes (la comparación estricta fallaba).
  const variantAvailable = (sel: Record<string, string>) => {
    if (!hasVariants) return true;
    const entries = Object.entries(sel).filter(([, v]) => v);
    return producto.variantes.some((v: any) => {
      const vals = variantValues(v);
      return entries.every(([k, val]) => norm(vals[k]) === norm(val)) && Number(v?.stock ?? 0) > 0;
    });
  };
  const galleryEntries = useMemo(() => {
    const entries: { src: string; color?: string }[] = [];
    const seen = new Set<string>();
    const pathKey = (u: string) => { try { return new URL(u).pathname; } catch { return u; } };
    const push = (src: any, color?: string) => {
      const url = typeof src === 'object' ? (src?.url || src?.imagenUrl || '') : src;
      if (!url) return;
      const k = pathKey(url);
      if (seen.has(k)) return;
      seen.add(k);
      entries.push({ src: url, color });
    };
    // Primero las imágenes por color (así quedan etiquetadas con su color)…
    colorOptions.forEach((c) => getFashionColorGallery(producto, c.name).forEach((u) => push(u, c.name)));
    // …luego las imágenes generales del producto (sin color).
    [getImg(producto), ...(Array.isArray(producto?.imagenes) ? producto.imagenes : []), ...(Array.isArray(producto?.imagenesExtra) ? producto.imagenesExtra : []), ...(Array.isArray(producto?.galeria) ? producto.galeria : [])].forEach((u) => push(u, undefined));
    return entries;
  }, [producto, colorOptions]);
  const gallery = useMemo(() => galleryEntries.map((e) => e.src), [galleryEntries]);
  const [activeImage, setActiveImage] = useState(0);
  // Al elegir un color, saltar a su imagen (o a la primera imagen etiquetada con ese color).
  // Si la miniatura activa YA pertenece al color elegido (p.ej. el usuario hizo clic en
  // una miniatura), se respeta y no se salta.
  useEffect(() => {
    if (!selectedColor) return;
    const current = galleryEntries[activeImage];
    if (current && norm(current.color) === norm(selectedColor)) return;
    const target = getFashionColorGallery(producto, selectedColor)[0] || getFashionColorImage(producto, selectedColor) || '';
    let idx = target ? galleryEntries.findIndex((e) => e.src === target) : -1;
    if (idx < 0) idx = galleryEntries.findIndex((e) => norm(e.color) === norm(selectedColor));
    // Color sin imágenes propias → mostrar la imagen principal del producto.
    if (idx < 0) { const base = getImg(producto); idx = base ? galleryEntries.findIndex((e) => e.src === base) : -1; }
    if (idx >= 0) setActiveImage(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColor, galleryEntries, producto]);

  const [qty, setQty] = useState(1);

  const go = (url: string, page?: 'home' | 'catalogo' | 'producto' | 'checkout') => {
    if (onNavigate && page) { onNavigate(page); return; }
    if (previewPlantillaId) { navigate(`${url}?previewPlantilla=${encodeURIComponent(previewPlantillaId)}`); return; }
    navigate(url);
  };

  const setVariant = (optionName: string, value: string) => {
    let next = { ...variantSel, [optionName]: value };
    // Si la combinación no existe, completa las OTRAS opciones desde una variante que
    // tenga este valor (comparación normalizada), conservando el valor elegido tal cual.
    if (!findFashionVariant(producto, next) && hasVariants) {
      const fallback = producto.variantes.find((v: any) => norm(variantValues(v)[optionName]) === norm(value) && Number(v?.stock ?? 0) > 0)
        || producto.variantes.find((v: any) => norm(variantValues(v)[optionName]) === norm(value));
      // Usa los valores REALES de la variante (casing correcto) para que findFashionVariant/precio/stock coincidan.
      if (fallback) next = { ...variantValues(fallback) };
    }
    setVariantSel(next);
  };

  const add = (n = qty) => {
    const label = Object.values(variantSel).filter(Boolean).join(' / ');
    const img = (selectedColor ? getFashionColorImage(producto, selectedColor) : '') || activeVariant?.imagenUrl || getImg(producto);
    const item = hasVariants
      ? {
          ...producto,
          id: activeVariant?.id ? `${producto.id}-var-${activeVariant.id}` : producto.id,
          cartId: activeVariant?.id ? `${producto.id}-var-${activeVariant.id}` : producto.id,
          productoId: producto.id,
          varianteId: activeVariant?.id,
          variante: variantSel,
          varianteLabel: label,
          descripcion: `${name}${label ? ` - ${label}` : ''}`,
          precioUnitario: activePricing.precioFinal,
          precioRegular: activePricing.precioRegular,
          enOferta: activePricing.enOferta,
          imagenUrl: img,
          cantidad: n,
        }
      : { ...producto, ...pricing, precioUnitario: pricing.precioFinal, cantidad: n, id: producto.id, productoId: producto.id };
    if (onAddToCart) onAddToCart(item);
    else actualizarCantidad(item.id ?? producto.id, (carrito.find((c) => String(c.id) === String(item.id ?? producto.id))?.cantidad || 0) + n);
    setMostrarCarrito(true);
  };
  const buyNow = () => { add(qty); go(`/tienda/${slug}/checkout`, 'checkout'); };

  const cartCount = carrito.reduce((s, i) => s + Number(i?.cantidad || 1), 0);
  const relatedFiltered = related.filter((p) => String(p.id) !== String(producto.id)).slice(0, 4);

  return (
    <motion.div initial="hidden" animate="show" variants={veloPage} className="min-h-screen" style={{ backgroundColor: VELO.cloud, fontFamily: font }}>
      <VeloHeader
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
      <div className="border-b" style={{ borderColor: VELO.line, background: `linear-gradient(120% 120% at 85% 0%, #FFFFFF, ${VELO.mist} 65%)` }}>
        <div className="mx-auto max-w-7xl px-6 py-6 text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
          <button type="button" onClick={() => go(`/tienda/${slug}`, 'home')} className="hover:text-neutral-900">Inicio</button>
          <span className="mx-2">/</span>
          <button type="button" onClick={() => go(`/tienda/${slug}/catalogo`, 'catalogo')} className="hover:text-neutral-900">Tienda</button>
          <span className="mx-2">/</span>
          <span className="text-neutral-700">{name}</span>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Galería: SIEMPRE todas las miniaturas a un costado (columna vertical).
              Cada miniatura lleva un punto con su color; al elegir un color se salta
              a su imagen y se resalta la miniatura correspondiente. */}
          <motion.div variants={veloFade} className="flex gap-3 md:gap-4">
            {gallery.length > 1 && (
              <div className="flex max-h-[440px] w-16 shrink-0 flex-col gap-3 overflow-y-auto pr-0.5 md:max-h-[560px] md:w-[92px]">
                {galleryEntries.slice(0, 12).map((entry, i) => {
                  const isColorMatch = !!entry.color && !!selectedColor && norm(entry.color) === norm(selectedColor);
                  const dotHex = entry.color ? (colorHexByName[norm(entry.color)] || VELO.steel) : '';
                  return (
                    <button
                      key={`${entry.src}-${i}`}
                      type="button"
                      onClick={() => {
                        setActiveImage(i);
                        // Inverso: al elegir una miniatura de un color, selecciona ese color.
                        if (entry.color && norm(entry.color) !== norm(selectedColor)) setVariant(optionNames.color, entry.color);
                      }}
                      aria-label={`Ver imagen ${i + 1}${entry.color ? ` (${entry.color})` : ''}`}
                      title={entry.color || ''}
                      className="relative aspect-square w-full shrink-0 overflow-hidden border-2 p-1.5 transition-colors"
                      style={{ backgroundColor: '#fff', borderColor: i === activeImage ? primary : (isColorMatch ? withAlpha(primary, '66') : VELO.line) }}
                    >
                      <img src={entry.src} alt="" className="h-full w-full object-contain" />
                      {entry.color && (
                        <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full ring-1 ring-white" style={{ backgroundColor: dotHex }} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="relative aspect-square min-w-0 flex-1 overflow-hidden border p-6" style={{ backgroundColor: '#fff', borderColor: VELO.line }}>
              {gallery[activeImage] ? (
                <img src={gallery[activeImage]} alt={name} className="h-full w-full object-contain" />
              ) : (
                <VeloProductImage producto={producto} />
              )}
              {activePricing.enOferta && (
                <span className="absolute left-0 top-0 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white" style={{ backgroundColor: primary }}>
                  -{activePricing.porcentajeDescuento}%
                </span>
              )}
            </div>
          </motion.div>

          {/* Info */}
          <motion.div variants={veloSection}>
            {marca && <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: VELO.steel }}>{marca}</p>}
            <h1 className="mt-2 text-4xl font-bold uppercase leading-[0.95] md:text-5xl" style={{ fontFamily: VELO.display, color: VELO.ink }}>{name}</h1>

            <div className="mt-4 flex items-center gap-3">
              <VeloStars rating={ratingAvg || 5} count={reviews} />
              <span className="text-sm text-neutral-400">{categoria || 'Bicicletas'}</span>
            </div>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-4xl font-bold" style={{ fontFamily: VELO.display, color: VELO.ink }}>{money(activePricing.precioFinal)}</span>
              {activePricing.enOferta && <span className="text-lg font-medium text-neutral-400 line-through">{money(activePricing.precioRegular)}</span>}
            </div>

            <p className="mt-6 max-w-lg text-sm leading-relaxed text-neutral-600">{desc}</p>

            {/* Variantes: color con imágenes por color (swatches) + talla (pills) */}
            {(colorOptions.length > 0 || sizeOptions.length > 0) && (
              <div className="mt-7 space-y-6">
                {colorOptions.length > 0 && (
                  <div>
                    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500">
                      {optionNames.color}{selectedColor && <span className="ml-2 normal-case tracking-normal text-neutral-900">{selectedColor}</span>}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {colorOptions.map((c) => {
                        const active = norm(selectedColor) === norm(c.name);
                        const available = variantAvailable({ ...variantSel, [optionNames.color]: c.name });
                        const light = ['#FFFFFF', '#F8FAFC', '#FACC15', '#F5E6C8'].includes((c.hex || '').toUpperCase());
                        return (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => setVariant(optionNames.color, c.name)}
                            title={c.name + (available ? '' : ' (agotado)')}
                            aria-pressed={active}
                            className={`relative flex h-10 w-10 items-center justify-center rounded-full ring-1 transition-transform hover:scale-110 ${available ? '' : 'opacity-35'}`}
                            style={{ backgroundColor: c.hex || '#CBD5E1', boxShadow: active ? `0 0 0 2px #fff, 0 0 0 4px ${primary}` : undefined, ['--tw-ring-color' as any]: 'rgba(14,14,18,0.16)' }}
                          >
                            {c.useImage && c.image && (
                              <img
                                src={c.image}
                                alt={c.name}
                                className="pointer-events-none absolute inset-0 h-full w-full rounded-full object-cover"
                                draggable={false}
                              />
                            )}
                            {active && (
                              <Icon
                                icon="mdi:check"
                                width={17}
                                className="relative"
                                style={{
                                  color: c.useImage && c.image ? '#fff' : light ? '#111114' : '#fff',
                                  filter: c.useImage && c.image ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.55))' : undefined,
                                }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {sizeOptions.length > 0 && (
                  <div>
                    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500">
                      {optionNames.size}{selectedSize && <span className="ml-2 normal-case tracking-normal text-neutral-900">{selectedSize}</span>}
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {sizeOptions.map((s) => {
                        const active = norm(selectedSize) === norm(s);
                        const available = variantAvailable({ ...variantSel, [optionNames.size]: s });
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setVariant(optionNames.size, s)}
                            className={`min-w-[52px] border px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] transition-colors ${available ? '' : 'opacity-40'}`}
                            style={active ? { backgroundColor: VELO.ink, color: '#fff', borderColor: VELO.ink } : { backgroundColor: '#fff', color: VELO.ink, borderColor: VELO.line }}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex items-center gap-2 text-sm">
              {needsSelection ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase" style={{ backgroundColor: VELO.mist, color: VELO.steel }}>
                  <Icon icon="solar:hand-shake-linear" width={14} /> Elige una combinación
                </span>
              ) : (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase ${outOfStock ? 'bg-neutral-100 text-neutral-500' : 'text-white'}`} style={outOfStock ? undefined : { backgroundColor: VELO.ink }}>
                  <Icon icon={outOfStock ? 'solar:close-circle-bold' : 'solar:check-circle-bold'} width={14} />
                  {outOfStock ? 'Agotado' : `Disponible${activeVariant ? ` · ${stock} und.` : ''}`}
                </span>
              )}
            </div>

            {/* Acciones */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="inline-flex h-[52px] items-center border bg-white" style={{ borderColor: VELO.line }}>
                <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-[52px] w-12 place-items-center text-lg text-neutral-500 hover:text-neutral-900">−</button>
                <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                <button type="button" onClick={() => setQty(qty + 1)} className="grid h-[52px] w-12 place-items-center text-lg text-neutral-500 hover:text-neutral-900">+</button>
              </div>
              <motion.button
                type="button"
                disabled={outOfStock || needsSelection}
                onClick={() => add()}
                whileHover={outOfStock || needsSelection ? undefined : { scale: 1.02, y: -2 }}
                whileTap={outOfStock || needsSelection ? undefined : veloTap}
                className="flex h-[52px] flex-1 items-center justify-center gap-2 px-6 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: primary }}
              >
                <Icon icon="solar:cart-large-2-linear" width={17} /> Añadir al carrito
              </motion.button>
            </div>
            <motion.button
              type="button"
              disabled={outOfStock || needsSelection}
              onClick={buyNow}
              whileHover={outOfStock || needsSelection ? undefined : { y: -2 }}
              whileTap={outOfStock || needsSelection ? undefined : veloTap}
              className="mt-3 w-full border py-4 text-xs font-bold uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderColor: VELO.ink, color: VELO.ink }}
            >
              Comprar ahora
            </motion.button>

            {/* Beneficios */}
            <div className="mt-8 grid gap-4 border-t pt-8 sm:grid-cols-3" style={{ borderColor: VELO.line }}>
              {[
                ['mdi:wrench-outline', 'Armado incluido'],
                ['solar:shield-check-linear', 'Garantía real'],
                ['solar:box-minimalistic-linear', 'Envío a domicilio'],
              ].map(([icon, text]) => (
                <div key={text} className="flex items-center gap-2.5 text-xs font-semibold text-neutral-600">
                  <Icon icon={icon} width={20} style={{ color: primary }} />
                  {text}
                </div>
              ))}
            </div>

            {/* Compartir */}
            <div className="mt-8 flex items-center gap-3 border-t pt-6" style={{ borderColor: VELO.line }}>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500">Compartir</span>
              {['mdi:whatsapp', 'mdi:facebook', 'mdi:instagram'].map((ic) => (
                <a key={ic} href={ic === 'mdi:whatsapp' ? waLink(tienda, `Hola, me interesa: ${name}`) : '#'} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-full border text-neutral-500 transition-colors hover:text-neutral-900" style={{ borderColor: VELO.line, backgroundColor: withAlpha(primary, '0d') }}>
                  <Icon icon={ic} width={17} />
                </a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Descripción larga */}
        <motion.section initial="hidden" whileInView="show" viewport={veloViewport} variants={veloSection} className="mt-14 border bg-white p-8 md:p-10" style={{ borderColor: VELO.line }}>
          <h2 className="text-2xl font-bold uppercase" style={{ fontFamily: VELO.display, color: VELO.ink }}>Ficha técnica</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-600">{producto?.descripcionLarga ? String(producto.descripcionLarga).replace(/<[^>]+>/g, ' ') : desc}</p>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <p><span className="font-bold" style={{ color: VELO.ink }}>Categoría:</span> <span className="text-neutral-500">{categoria || '—'}</span></p>
            <p><span className="font-bold" style={{ color: VELO.ink }}>Marca:</span> <span className="text-neutral-500">{marca || '—'}</span></p>
            <p><span className="font-bold" style={{ color: VELO.ink }}>SKU:</span> <span className="text-neutral-500">{producto?.codigo || producto?.sku || '—'}</span></p>
            <p><span className="font-bold" style={{ color: VELO.ink }}>Disponibilidad:</span> <span className="text-neutral-500">{outOfStock ? 'Agotado' : `${stock} unidades`}</span></p>
          </div>
        </motion.section>

        {/* Relacionados */}
        {relatedFiltered.length > 0 && (
          <motion.section initial="hidden" whileInView="show" viewport={veloViewport} variants={veloSection} className="mt-16">
            <div className="mb-8 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: primary }}>Descubre más</p>
              <h2 className="mt-2 text-3xl font-bold uppercase tracking-[0.04em]" style={{ fontFamily: VELO.display, color: VELO.ink }}>También te puede interesar</h2>
            </div>
            <motion.div variants={veloStagger} className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {relatedFiltered.map((p) => (
                <VeloProductCard key={p.id} producto={p} slug={slug} cp={primary} onAddToCart={onAddToCart || ((prod) => actualizarCantidad(prod.id, 1))} onClick={() => go(`/tienda/${slug}/producto/${p.id}`, 'producto')} />
              ))}
            </motion.div>
          </motion.section>
        )}
      </main>

      <VeloFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <VeloWhatsAppFab tienda={tienda} />

      {setCarrito && (
        <VeloCartModal
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
export default function BicicletasProductoDetalle() {
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
    try { const saved = localStorage.getItem(`tienda:${slug}:carrito`); if (saved) setCarrito(JSON.parse(saved)); } catch {}
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
          axios.get(`${BASE_URL}/public/store/${slug}`),
          axios.get(`${BASE_URL}/public/store/${slug}/categories`),
          axios.get(`${BASE_URL}/public/store/${slug}/products/${id}`),
        ]);
        const store = storeRes.data.data || storeRes.data;
        const product = withPricing(productRes.data.data || productRes.data);
        setTienda(store);
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

  const actualizarCantidad = (productoId: number | string, cantidad: number) => {
    setCarrito((current) => {
      const exists = current.some((item) => item.id === productoId || item.productoId === productoId);
      if (cantidad <= 0) return current.filter((item) => item.id !== productoId && item.productoId !== productoId);
      if (exists) return current.map((item) => (item.id === productoId || item.productoId === productoId) ? { ...item, cantidad } : item);
      if (producto) {
        const pr = getProductPricing(producto);
        return [...current, { ...producto, ...pr, precioUnitario: pr.precioFinal, cantidad, id: producto.id, productoId: producto.id }];
      }
      return current;
    });
  };

  const memoStore = useMemo(() => tienda || {}, [tienda]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-white"><Icon icon="eos-icons:loading" className="h-12 w-12 animate-spin text-gray-300" /></div>;
  if (!producto) return null;

  return (
    <BicicletasProductoDetalleView
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
