import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { getProductPricing, withPricing, withPricingList } from '@/templates/shared/pricing';
import { useFavoritosStore } from '@/zustand/favoritos';
import { onTiendaCartCleared } from '@/utils/tiendaCart';
import {
  getFashionColors,
  getFashionColorGallery,
  getDefaultVariantSelection,
  findFashionVariant,
  isFashionVariantAvailable,
  getVariantOptionNames,
} from '@/templates/urbano/fashionVariants';
import { MIN, MinCartModal, MinFooter, MinHeader, MinProductCard, MinProductImage, MinWhatsAppFab, minFont, minPrimary, waLink } from '@/templates/moda-minimal/ModaMinimalParts';
import { minFade, minPage, minSection, minStagger, minViewport } from '@/templates/moda-minimal/motion';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

const money = (v: number) => `S/ ${Number(v || 0).toFixed(2)}`;
const getImg = (p: any) => p?.imagenUrl || p?.imagen || '';
const nameOf = (p: any) => p?.descripcion || p?.nombre || 'Producto';
const catOf = (p: any) => (typeof p?.categoria === 'object' ? p?.categoria?.nombre : p?.categoria) || '';
const marcaOf = (p: any) => (typeof p?.marca === 'object' ? p?.marca?.nombre : p?.marca) || '';
const optionsOf = (p: any): { nombre: string; valores: string[] }[] => (Array.isArray(p?.opcionesAtributos) ? p.opcionesAtributos : []);

/* ── Estrellas de rating ── */
function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const v = Math.max(0, Math.min(5, value));
  return (
    <span className="inline-flex items-center" aria-label={`${v} de 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Icon key={i} icon={i + 1 <= Math.round(v) ? 'solar:star-bold' : 'solar:star-linear'} width={size} style={{ color: i + 1 <= Math.round(v) ? MIN.ink : MIN.muted }} />
      ))}
    </span>
  );
}

/* ── Acordeón ── */
function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b" style={{ borderColor: MIN.line }}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between py-4 text-left">
        <span className="text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: MIN.ink }}>{title}</span>
        <Icon icon={open ? 'solar:minus-square-linear' : 'solar:add-square-linear'} width={18} style={{ color: MIN.soft }} />
      </button>
      {open && <div className="pb-5 text-sm leading-7" style={{ color: MIN.soft }}>{children}</div>}
    </div>
  );
}

export function ModaMinimalProductoDetalleView({
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
  const primary = minPrimary(cp || diseno?.colorPrimario);
  const font = minFont(diseno);
  const pricing = getProductPricing(producto);

  const { toggleFavorito, isFavorito } = useFavoritosStore();
  const wish = isFavorito(Number(producto?.id), slug);

  const name = nameOf(producto);
  const marca = marcaOf(producto);
  const categoria = catOf(producto);
  const desc = producto?.detalle || producto?.descripcionCorta ||
    'Una prenda pensada para durar: materiales nobles, confección cuidada y un corte atemporal que se adapta a tu día a día.';

  const ratingAvg = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const reviewCount = Number(producto?.ratingCount || producto?.reviewsCount || producto?.numResenas || 0);

  /* ── Variantes reales del producto (colores, tallas, fotos por color) ── */
  const options = optionsOf(producto);
  const colorName = getVariantOptionNames(producto).color;
  const colors = getFashionColors(producto);
  const hasVariants = options.length > 0;

  const [selection, setSelection] = useState<Record<string, string>>(() => getDefaultVariantSelection(producto));
  const [hint, setHint] = useState(false);

  const selectedColor = selection[colorName] || colors[0]?.name || '';
  const activeVariant = useMemo(() => findFashionVariant(producto, selection), [producto, selection]);
  const allSelected = hasVariants ? options.every((o) => !!selection[o.nombre]) : true;

  const variantStock = activeVariant ? Number(activeVariant.stock || 0) : Number(producto?.stock ?? 12);
  const outOfStock = hasVariants ? (allSelected ? variantStock <= 0 : false) : Number(producto?.stock ?? 12) <= 0;
  const canAdd = hasVariants ? (allSelected && variantStock > 0) : !outOfStock;

  const displayPrice = activeVariant ? Number(activeVariant.precioUnitario || 0) : pricing.precioFinal;
  const showStrike = !activeVariant && pricing.enOferta;

  // Galería: fotos guardadas por color; si no hay, imagen principal + extras.
  const galleryImages = useMemo(() => {
    const byColor = selectedColor ? getFashionColorGallery(producto, selectedColor) : [];
    if (byColor.length) return byColor;
    const extra = Array.isArray(producto?.imagenesExtra) ? producto.imagenesExtra : [];
    return [getImg(producto), ...extra].filter(Boolean);
  }, [producto, selectedColor]);

  const selectValue = (opName: string, value: string) => {
    setHint(false);
    setSelection((cur) => ({ ...cur, [opName]: value }));
  };

  const go = (url: string, page?: 'home' | 'catalogo' | 'producto' | 'checkout') => {
    if (onNavigate && page) { onNavigate(page); return; }
    if (previewPlantillaId) { navigate(`${url}?previewPlantilla=${encodeURIComponent(previewPlantillaId)}`); return; }
    navigate(url);
  };

  const buildItem = () => {
    const variantKey = options.map((o) => selection[o.nombre]).filter(Boolean).join(' / ');
    const cartId = variantKey ? `${producto.id}::${variantKey}` : String(producto.id);
    const img = galleryImages[0] || activeVariant?.imagenUrl || getImg(producto);
    return {
      ...producto,
      id: producto.id,
      productoId: producto.id,
      cartId,
      varianteId: activeVariant?.id,
      valoresAtributos: activeVariant?.valoresAtributos || (hasVariants ? selection : undefined),
      precioUnitario: displayPrice,
      precioOferta: undefined,
      imagenUrl: img,
      imagen: img,
      cantidad: 1,
      descripcion: variantKey ? `${name} — ${variantKey}` : name,
      codigo: activeVariant?.codigo || producto?.codigo,
    };
  };

  const add = () => {
    if (!canAdd) { setHint(true); return; }
    const item = buildItem();
    if (onAddToCart) onAddToCart(item);
    else actualizarCantidad(item.cartId, 1);
    setMostrarCarrito(true);
  };
  const buyNow = () => { if (!canAdd) { setHint(true); return; } add(); go(`/tienda/${slug}/checkout`, 'checkout'); };

  const toggleWish = () => toggleFavorito({
    id: Number(producto?.id),
    descripcion: name,
    precioUnitario: displayPrice,
    imagenUrl: galleryImages[0] || getImg(producto),
    slug,
  });

  const cartCount = carrito.reduce((s, i) => s + Number(i?.cantidad || 1), 0);
  const relatedFiltered = related.filter((p) => String(p.id) !== String(producto.id)).slice(0, 4);

  const factor = Number(diseno?.modaMinimalPdpTraditionalFactor) || 2;
  const traditional = displayPrice * factor;

  const nonColorOptions = options.filter((o) => o.nombre !== colorName);
  const missingLabel = hasVariants ? options.find((o) => !selection[o.nombre])?.nombre : '';

  return (
    <motion.div initial="hidden" animate="show" variants={minPage} className="min-h-screen" style={{ backgroundColor: MIN.paper, fontFamily: font }}>
      <MinHeader
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
      <div className="border-b" style={{ borderColor: MIN.line }}>
        <div className="mx-auto max-w-7xl px-6 py-4 text-[11px] font-medium uppercase tracking-[0.12em] md:px-8" style={{ color: MIN.muted }}>
          <button type="button" onClick={() => go(`/tienda/${slug}`, 'home')} className="hover:text-black">Inicio</button>
          <span className="mx-2">/</span>
          <button type="button" onClick={() => go(`/tienda/${slug}/catalogo`, 'catalogo')} className="hover:text-black">Tienda</button>
          <span className="mx-2">/</span>
          <span style={{ color: MIN.soft }}>{name}</span>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-12">
        <div className="grid items-start gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16">
          {/* Galería apilada (fotos guardadas por color) */}
          <motion.div variants={minFade} className="space-y-3">
            {galleryImages.length ? (
              galleryImages.map((src, i) => (
                <div key={`${src}-${i}`} className="aspect-[3/4] overflow-hidden" style={{ backgroundColor: MIN.stone }}>
                  <img src={src} alt={`${name} ${i + 1}`} loading={i === 0 ? 'eager' : 'lazy'} className="h-full w-full object-cover" />
                </div>
              ))
            ) : (
              <div className="aspect-[3/4] overflow-hidden" style={{ backgroundColor: MIN.stone }}>
                <MinProductImage producto={producto} />
              </div>
            )}
          </motion.div>

          {/* Info (sticky) */}
          <motion.div variants={minSection} className="lg:sticky lg:top-24 lg:self-start">
            {marca && <p className="text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: MIN.muted }}>{marca}</p>}
            <h1 className="mt-1 text-2xl font-medium tracking-tight md:text-3xl" style={{ color: MIN.ink }}>{name}</h1>

            <div className="mt-3 flex items-center gap-3">
              <Stars value={ratingAvg || 5} />
              <a href="#resenas" className="text-[12px] underline" style={{ color: MIN.soft }}>
                {reviewCount > 0 ? `${reviewCount} reseña${reviewCount === 1 ? '' : 's'}` : 'Sé el primero en opinar'}
              </a>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl" style={{ color: showStrike ? MIN.sale : MIN.ink }}>{money(displayPrice)}</span>
              {showStrike && <span className="text-base text-neutral-400 line-through">{money(pricing.precioRegular)}</span>}
            </div>

            <p className="mt-5 max-w-md text-sm leading-relaxed" style={{ color: MIN.soft }}>{desc}</p>

            {/* Color (variantes reales) */}
            {colors.length > 0 && (
              <div className="mt-7">
                <div className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: MIN.ink }}>
                  {colorName}: <span className="font-normal" style={{ color: MIN.soft }}>{selectedColor || 'Selecciona'}</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {colors.map((c) => {
                    const active = selectedColor === c.name;
                    const available = isFashionVariantAvailable(producto, { ...selection, [colorName]: c.name });
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => selectValue(colorName, c.name)}
                        title={c.name}
                        aria-label={c.name}
                        className="relative flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-105"
                        style={{ boxShadow: active ? `0 0 0 2px #fff, 0 0 0 3px ${MIN.ink}` : `inset 0 0 0 1px ${MIN.line}`, opacity: available ? 1 : 0.4 }}
                      >
                        {c.image ? (
                          <img src={c.image} alt={c.name} className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <span className="h-7 w-7 rounded-full" style={{ backgroundColor: c.hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)' }} />
                        )}
                        {!available && <span className="absolute inset-0 m-auto h-px w-8 rotate-45" style={{ backgroundColor: MIN.muted }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Otras opciones (Talla, etc.) desde las variantes reales */}
            {nonColorOptions.map((op) => (
              <div key={op.nombre} className="mt-6">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: MIN.ink }}>
                    {op.nombre}{selection[op.nombre] ? `: ${selection[op.nombre]}` : ''}
                  </span>
                  <span className="text-[11px] underline" style={{ color: MIN.soft }}>{diseno?.modaMinimalPdpSizeGuideLabel || 'Guía de tallas'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {op.valores.map((val) => {
                    const active = selection[op.nombre] === val;
                    const available = isFashionVariantAvailable(producto, { ...selection, [op.nombre]: val });
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => selectValue(op.nombre, val)}
                        disabled={!available}
                        className="flex h-11 min-w-[52px] items-center justify-center px-3 text-sm transition-colors disabled:cursor-not-allowed"
                        style={active
                          ? { backgroundColor: MIN.ink, color: '#fff' }
                          : available
                            ? { border: `1px solid ${MIN.line}`, color: MIN.ink }
                            : { border: `1px solid ${MIN.line}`, color: MIN.muted, opacity: 0.45 }}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {hint && !canAdd && (
              <p className="mt-4 text-xs" style={{ color: MIN.sale }}>
                {missingLabel ? `Selecciona ${missingLabel.toLowerCase()} para continuar.` : 'Esta combinación no está disponible.'}
              </p>
            )}

            {/* Acciones */}
            <div className="mt-7">
              <button
                type="button"
                disabled={outOfStock}
                onClick={add}
                className="flex h-13 w-full items-center justify-center py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: MIN.ink }}
              >
                {outOfStock ? 'Agotado' : 'Añadir a la bolsa'}
              </button>
              <div className="mt-3 flex gap-3">
                <button type="button" disabled={outOfStock} onClick={buyNow} className="flex h-12 flex-1 items-center justify-center border py-3 text-[11px] font-semibold uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-50" style={{ borderColor: MIN.ink, color: MIN.ink }}>
                  Comprar ahora
                </button>
                <button type="button" onClick={toggleWish} title="Favorito" className="flex h-12 w-12 items-center justify-center border" style={{ borderColor: MIN.line }}>
                  <Icon icon={wish ? 'solar:heart-bold' : 'solar:heart-linear'} width={19} style={{ color: wish ? primary : MIN.ink }} />
                </button>
              </div>
            </div>

            {/* Envío / modelo */}
            <div className="mt-5 space-y-2 text-[13px]" style={{ color: MIN.soft }}>
              <p className="flex items-center gap-2"><Icon icon="solar:delivery-linear" width={16} style={{ color: MIN.ink }} /> Envío gratis desde S/ 199 · devoluciones en 30 días</p>
              {diseno?.modaMinimalPdpModelNote && (
                <p className="flex items-center gap-2"><Icon icon="solar:ruler-linear" width={16} style={{ color: MIN.ink }} /> {diseno.modaMinimalPdpModelNote}</p>
              )}
            </div>

            {/* Acordeones */}
            <div className="mt-8 border-t" style={{ borderColor: MIN.line }}>
              <Accordion title={diseno?.modaMinimalPdpDetailsTitle || 'Detalles'} defaultOpen>
                {producto?.descripcionLarga ? String(producto.descripcionLarga).replace(/<[^>]+>/g, ' ') : (diseno?.modaMinimalPdpDetailsText || desc)}
                <div className="mt-4 grid gap-1.5 text-[13px]">
                  <p><span className="font-medium" style={{ color: MIN.ink }}>Categoría:</span> {categoria || '—'}</p>
                  <p><span className="font-medium" style={{ color: MIN.ink }}>SKU:</span> {activeVariant?.codigo || producto?.codigo || producto?.sku || '—'}</p>
                  <p><span className="font-medium" style={{ color: MIN.ink }}>Disponibilidad:</span> {outOfStock ? 'Agotado' : `${variantStock} unidades`}</p>
                </div>
              </Accordion>
              <Accordion title={diseno?.modaMinimalPdpMaterialsTitle || 'Materiales y cuidado'}>
                {diseno?.modaMinimalPdpMaterialsText || 'Materiales seleccionados por su calidad y durabilidad. Lavar a máquina en frío, secar al aire y planchar a temperatura media.'}
              </Accordion>
              <Accordion title={diseno?.modaMinimalPdpShippingTitle || 'Envíos y devoluciones'}>
                {diseno?.modaMinimalPdpShippingText || 'Envíos a todo el país. Cambios y devoluciones sin costo dentro de los 30 días posteriores a la entrega.'}
              </Accordion>
            </div>

            {/* Precio transparente */}
            <div className="mt-8 border p-6" style={{ borderColor: MIN.line, backgroundColor: MIN.cream }}>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: MIN.ink }}>{diseno?.modaMinimalPdpTransparencyTitle || 'Precio transparente'}</p>
              <p className="mt-2 text-[13px] leading-6" style={{ color: MIN.soft }}>{diseno?.modaMinimalPdpTransparencyText || 'Creemos en precios honestos: pagas por la calidad de la prenda, no por el margen.'}</p>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[12px]"><span style={{ color: MIN.ink }}>Nuestro precio</span><span className="font-semibold" style={{ color: MIN.ink }}>{money(displayPrice)}</span></div>
                  <div className="h-2 w-1/2" style={{ backgroundColor: MIN.ink }} />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-[12px]"><span style={{ color: MIN.muted }}>Precio tradicional</span><span className="line-through" style={{ color: MIN.muted }}>{money(traditional)}</span></div>
                  <div className="h-2 w-full" style={{ backgroundColor: MIN.stone }} />
                </div>
              </div>
              <p className="mt-3 text-[10px]" style={{ color: MIN.muted }}>* Comparativa referencial configurable por la tienda.</p>
            </div>

            {/* Compartir */}
            <div className="mt-6 flex items-center gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: MIN.muted }}>Compartir</span>
              {['mdi:whatsapp', 'mdi:facebook', 'mdi:instagram'].map((ic) => (
                <a key={ic} href={ic === 'mdi:whatsapp' ? waLink(tienda, `Hola, me interesa: ${name}`) : '#'} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center border text-neutral-500 transition-colors hover:text-black" style={{ borderColor: MIN.line }}>
                  <Icon icon={ic} width={16} />
                </a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Reseñas (resumen real) */}
        <motion.section id="resenas" initial="hidden" whileInView="show" viewport={minViewport} variants={minSection} className="mt-16 border-t pt-10" style={{ borderColor: MIN.line }}>
          <h2 className="text-xl font-medium tracking-tight" style={{ color: MIN.ink }}>Opiniones</h2>
          {reviewCount > 0 ? (
            <div className="mt-4 flex items-center gap-4">
              <span className="text-4xl font-semibold" style={{ color: MIN.ink }}>{(ratingAvg || 0).toFixed(1)}</span>
              <div>
                <Stars value={ratingAvg} size={16} />
                <p className="mt-1 text-sm" style={{ color: MIN.soft }}>Basado en {reviewCount} reseña{reviewCount === 1 ? '' : 's'}</p>
              </div>
            </div>
          ) : (
            <p className="mt-3 max-w-md text-sm" style={{ color: MIN.soft }}>Este producto aún no tiene reseñas. Sé el primero en compartir tu experiencia.</p>
          )}
        </motion.section>

        {/* Relacionados */}
        {relatedFiltered.length > 0 && (
          <motion.section initial="hidden" whileInView="show" viewport={minViewport} variants={minSection} className="mt-16">
            <h2 className="mb-8 text-xl font-medium tracking-tight" style={{ color: MIN.ink }}>También te puede gustar</h2>
            <motion.div variants={minStagger} className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
              {relatedFiltered.map((p) => (
                <MinProductCard key={p.id} producto={p} slug={slug} cp={primary} onAddToCart={onAddToCart || ((prod) => actualizarCantidad(prod.id, 1))} onClick={() => go(`/tienda/${slug}/producto/${p.id}`, 'producto')} />
              ))}
            </motion.div>
          </motion.section>
        )}
      </main>

      <MinFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <MinWhatsAppFab tienda={tienda} />

      {setCarrito && (
        <MinCartModal
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
export default function ModaMinimalProductoDetalle() {
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

  // Carrito por cartId (respeta cada variante como línea propia).
  const addToCart = (item: any) => {
    const cartId = String(item.cartId || item.id);
    setCarrito((cur) => {
      const idx = cur.findIndex((c) => String(c.cartId || c.id) === cartId);
      if (idx >= 0) {
        const copy = [...cur];
        copy[idx] = { ...copy[idx], cantidad: Number(copy[idx].cantidad || 1) + Number(item.cantidad || 1) };
        return copy;
      }
      return [...cur, { ...item, cartId, cantidad: Number(item.cantidad || 1) }];
    });
  };

  const actualizarCantidad = (cartId: number | string, cantidad: number) => {
    setCarrito((cur) => {
      if (cantidad <= 0) return cur.filter((i) => String(i.cartId || i.id) !== String(cartId));
      const idx = cur.findIndex((i) => String(i.cartId || i.id) === String(cartId));
      if (idx >= 0) {
        const copy = [...cur];
        copy[idx] = { ...copy[idx], cantidad };
        return copy;
      }
      return cur;
    });
  };

  const memoStore = useMemo(() => tienda || {}, [tienda]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-white"><Icon icon="eos-icons:loading" className="h-12 w-12 animate-spin text-gray-300" /></div>;
  if (!producto) return null;

  return (
    <ModaMinimalProductoDetalleView
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
      onAddToCart={addToCart}
    />
  );
}
