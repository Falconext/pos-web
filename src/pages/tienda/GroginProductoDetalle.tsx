import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { getProductPricing, withPricing, withPricingList } from '@/templates/shared/pricing';
import { getApiculturaVariantData, findApiculturaVariant, optionValueAvailable, buildVariantCartItem, colorValueHex, type ApiculturaVariantData } from '@/templates/apicultura/variantUtils';
import { onTiendaCartCleared } from '@/utils/tiendaCart';
import { GRO, GroCartModal, GroFooter, GroHeader, GroProductCard, GroProductImage, GroWhatsAppFab, StarRating, groFont, groPrimary, waLink } from '@/templates/abarrotes/GroginParts';
import { groCard, groFade, groPage, groSection, groStagger, groTap, groViewport } from '@/templates/abarrotes/motion';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

const money = (v: number) => `S/ ${Number(v || 0).toFixed(2)}`;
const getImg = (p: any) => p?.imagenUrl || p?.imagen || '';
const nameOf = (p: any) => p?.descripcion || p?.nombre || 'Producto';
const catOf = (p: any) => (typeof p?.categoria === 'object' ? p?.categoria?.nombre : p?.categoria) || '';
const marcaOf = (p: any) => (typeof p?.marca === 'object' ? p?.marca?.nombre : p?.marca) || '';

/** HTML enriquecido → texto plano (quita etiquetas y decodifica entidades &nbsp; &amp; ...). */
const htmlToText = (html: string): string => {
  if (typeof document !== 'undefined') {
    const el = document.createElement('div');
    el.innerHTML = html;
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
};

/** Selector de variantes (color con swatch + otras opciones como pills), estilo Grogin. */
function GroVariantSelector({ data, selection, onChange, primary, producto }: {
  data: ApiculturaVariantData;
  selection: Record<string, string>;
  onChange: (s: Record<string, string>) => void;
  primary: string;
  producto: any;
}) {
  if (!data.options.length) return null;
  const eq = (a: string, b: string) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
  return (
    <div className="mt-6 space-y-4">
      {data.options.map((option) => (
        <div key={option.name}>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: GRO.inkSoft }}>{option.name}</span>
            {selection[option.name] && <span className="text-[13px] font-bold" style={{ color: GRO.ink }}>{selection[option.name]}</span>}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {option.values.map((value) => {
              const selected = eq(selection[option.name], value.label);
              const available = optionValueAvailable(data.choices, selection, option.name, value.label);
              if (option.type === 'color') {
                return (
                  <button key={value.label} type="button" disabled={!available} onClick={() => onChange({ ...selection, [option.name]: value.label })} title={value.label} aria-label={value.label}
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full ring-2 transition-transform disabled:cursor-not-allowed disabled:opacity-30 ${selected ? 'scale-105' : 'hover:scale-105'}`}
                    style={{ ['--tw-ring-color' as any]: selected ? primary : GRO.line }}>
                    <span className="h-6 w-6 rounded-full ring-1 ring-black/10" style={{ backgroundColor: value.hex || colorValueHex(value.label, producto) }} />
                  </button>
                );
              }
              return (
                <button key={value.label} type="button" disabled={!available} onClick={() => onChange({ ...selection, [option.name]: value.label })}
                  className="rounded-lg border px-4 py-2 text-[12px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  style={selected ? { backgroundColor: primary, color: '#fff', borderColor: primary } : { backgroundColor: '#fff', color: GRO.ink, borderColor: GRO.line }}>
                  {value.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function GroginProductoDetalleView({
  tienda, slug, producto, related = [], allCategories = [], cp,
  carrito, setCarrito, mostrarCarrito, setMostrarCarrito, actualizarCantidad, onNavigate, onAddToCart,
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
  const primary = groPrimary(cp || diseno?.colorPrimario);
  const font = groFont(diseno);
  const pricing = getProductPricing(producto);

  const name = nameOf(producto);
  const marca = marcaOf(producto);
  const categoria = catOf(producto);
  const rawDesc = producto?.detalle || producto?.descripcionCorta || '';
  const desc = rawDesc ? htmlToText(String(rawDesc)) : 'Producto seleccionado de la mejor calidad, ideal para tu despensa. Frescura y buen precio garantizados.';
  const rating = Number(producto?.ratingAvg || producto?.ratingPromedio || 0) || 5;

  const variantData = useMemo(() => getApiculturaVariantData(producto), [producto]);
  const hasVariants = variantData.choices.length > 0 && variantData.options.length > 0;
  const [variantSel, setVariantSel] = useState<Record<string, string>>(variantData.defaultSelection || {});
  useEffect(() => { setVariantSel(variantData.defaultSelection || {}); }, [variantData.signature]);
  const selectedVariant = useMemo(() => findApiculturaVariant(variantData.choices, variantSel), [variantData.choices, variantSel]);

  const activePricing = hasVariants && selectedVariant
    ? { precioFinal: selectedVariant.precioFinal, precioRegular: selectedVariant.precioRegular, enOferta: selectedVariant.enOferta, porcentajeDescuento: selectedVariant.porcentajeDescuento }
    : pricing;
  const stock = hasVariants ? Number(selectedVariant?.stock ?? 0) : Number(producto?.stock ?? 20);
  const outOfStock = stock <= 0;

  const extraImages = Array.isArray(producto?.imagenesExtra) ? producto.imagenesExtra : [];
  const gallery = [getImg(producto), ...extraImages].filter(Boolean);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const variantImage = hasVariants ? (selectedVariant?.image || '') : '';
  const mainImage = variantImage || gallery[activeImage] || '';

  const go = (url: string, page?: 'home' | 'catalogo' | 'producto' | 'checkout') => {
    if (onNavigate && page) { onNavigate(page); return; }
    if (previewPlantillaId) { navigate(`${url}?previewPlantilla=${encodeURIComponent(previewPlantillaId)}`); return; }
    navigate(url);
  };

  const add = (n = qty) => {
    const item = hasVariants
      ? buildVariantCartItem(producto, selectedVariant, n)
      : { ...producto, ...pricing, precioUnitario: pricing.precioFinal, cantidad: n, id: producto.id, productoId: producto.id };
    if (onAddToCart) {
      onAddToCart(item);
    } else if (setCarrito) {
      const key = item.cartId || item.id;
      const existing = carrito.find((c) => String(c.cartId || c.id) === String(key));
      setCarrito(existing
        ? carrito.map((c) => String(c.cartId || c.id) === String(key) ? { ...c, cantidad: Number(c.cantidad || 1) + n } : c)
        : [...carrito, item]);
    } else {
      actualizarCantidad(producto.id, (carrito.find((c) => c.id === producto.id)?.cantidad || 0) + n);
    }
    setMostrarCarrito(true);
  };
  const buyNow = () => { add(qty); go(`/tienda/${slug}/checkout`, 'checkout'); };

  const cartCount = carrito.reduce((s, i) => s + Number(i?.cantidad || 1), 0);
  const relatedFiltered = related.filter((p) => String(p.id) !== String(producto.id)).slice(0, 5);

  return (
    <motion.div initial="hidden" animate="show" variants={groPage} className="min-h-screen" style={{ backgroundColor: GRO.soft, fontFamily: font }}>
      <GroHeader
        tienda={tienda}
        slug={slug}
        cp={primary}
        diseno={diseno}
        carritoSize={cartCount}
        onOpenCart={() => setMostrarCarrito(true)}
        allCategories={allCategories}
        onSearchSubmit={(event, value) => { event.preventDefault(); if (value?.trim()) go(`/tienda/${slug}/catalogo`, 'catalogo'); }}
      />

      <div className="border-b bg-white" style={{ borderColor: GRO.line }}>
        <div className="mx-auto max-w-7xl px-5 py-4 text-xs font-medium md:px-6" style={{ color: GRO.inkSoft }}>
          <button type="button" onClick={() => go(`/tienda/${slug}`, 'home')} className="hover:text-neutral-900">Inicio</button>
          <span className="mx-2">/</span>
          <button type="button" onClick={() => go(`/tienda/${slug}/catalogo`, 'catalogo')} className="hover:text-neutral-900">Tienda</button>
          <span className="mx-2">/</span>
          <span style={{ color: GRO.ink }}>{name}</span>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-12">
        <div className="grid gap-8 rounded-3xl border bg-white p-5 md:grid-cols-2 md:p-8" style={{ borderColor: GRO.line }}>
          {/* Galería */}
          <motion.div variants={groFade}>
            <div className="relative aspect-square overflow-hidden rounded-2xl p-8" style={{ backgroundColor: GRO.soft2 }}>
              {mainImage ? <img src={mainImage} alt={name} className="h-full w-full object-contain" /> : <GroProductImage producto={producto} />}
              {activePricing.enOferta && (
                <span className="absolute left-4 top-4 rounded-md px-2.5 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: GRO.pink }}>-{activePricing.porcentajeDescuento}%</span>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {gallery.slice(0, 5).map((src, i) => (
                  <button key={i} type="button" onClick={() => setActiveImage(i)} className="h-20 w-20 overflow-hidden rounded-xl border-2 p-1.5 transition-colors" style={{ backgroundColor: GRO.soft2, borderColor: i === activeImage ? primary : 'transparent' }}>
                    <img src={src} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div variants={groSection}>
            {marca && <p className="text-[12px] font-bold" style={{ color: GRO.green }}>{marca}</p>}
            <h1 className="mt-1.5 text-3xl font-bold leading-tight md:text-4xl" style={{ fontFamily: GRO.display, color: GRO.ink }}>{name}</h1>
            <div className="mt-3 flex items-center gap-3">
              <StarRating value={rating} count={Number(producto?.reviewsCount || 0) || undefined} size={16} />
              <span className="text-sm" style={{ color: GRO.inkSoft }}>{categoria || 'Abarrotes'}</span>
            </div>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-4xl font-extrabold" style={{ fontFamily: GRO.display, color: GRO.green }}>{money(activePricing.precioFinal)}</span>
              {activePricing.enOferta && <span className="text-lg font-medium text-neutral-400 line-through">{money(activePricing.precioRegular)}</span>}
            </div>

            <p className="mt-5 max-w-lg text-sm leading-relaxed" style={{ color: GRO.inkSoft }}>{desc}</p>

            {hasVariants && <GroVariantSelector data={variantData} selection={variantSel} onChange={setVariantSel} primary={primary} producto={producto} />}

            <div className="mt-5">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${outOfStock ? 'bg-neutral-100 text-neutral-500' : ''}`} style={outOfStock ? undefined : { backgroundColor: GRO.greenSoft, color: GRO.greenDark }}>
                <Icon icon={outOfStock ? 'solar:close-circle-bold' : 'solar:check-circle-bold'} width={14} />
                {outOfStock ? 'Agotado' : (hasVariants ? `${stock} disponibles` : 'En stock')}
              </span>
            </div>

            {/* Acciones */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex h-[52px] items-center rounded-full border bg-white" style={{ borderColor: GRO.line }}>
                <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-[52px] w-12 place-items-center text-lg text-neutral-500 hover:text-neutral-900">−</button>
                <span className="w-8 text-center text-sm font-bold">{qty}</span>
                <button type="button" onClick={() => setQty(qty + 1)} className="grid h-[52px] w-12 place-items-center text-lg hover:opacity-80" style={{ color: GRO.green }}>+</button>
              </div>
              <motion.button type="button" disabled={outOfStock} onClick={() => add()} whileHover={outOfStock ? undefined : { scale: 1.02, y: -2 }} whileTap={outOfStock ? undefined : groTap}
                className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: primary }}>
                <Icon icon="solar:cart-plus-bold" width={18} /> Agregar al carrito
              </motion.button>
            </div>
            <motion.button type="button" disabled={outOfStock} onClick={buyNow} whileHover={outOfStock ? undefined : { y: -2 }} whileTap={outOfStock ? undefined : groTap}
              className="mt-3 w-full rounded-full border py-3.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50" style={{ borderColor: GRO.ink, color: GRO.ink }}>
              Comprar ahora
            </motion.button>

            <div className="mt-7 grid gap-4 border-t pt-6 sm:grid-cols-3" style={{ borderColor: GRO.line }}>
              {[
                ['solar:delivery-linear', 'Envío el mismo día'],
                ['solar:leaf-linear', 'Producto fresco'],
                ['solar:shield-check-linear', 'Compra protegida'],
              ].map(([icon, text]) => (
                <div key={text} className="flex items-center gap-2 text-xs" style={{ color: GRO.inkSoft }}>
                  <Icon icon={icon} width={20} style={{ color: GRO.green }} /> {text}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3 border-t pt-5" style={{ borderColor: GRO.line }}>
              <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: GRO.inkSoft }}>Compartir</span>
              {['mdi:whatsapp', 'mdi:facebook', 'mdi:instagram'].map((ic) => (
                <a key={ic} href={ic === 'mdi:whatsapp' ? waLink(tienda, `Hola, me interesa: ${name}`) : '#'} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-full border text-neutral-500 transition-colors hover:text-neutral-900" style={{ borderColor: GRO.line }}>
                  <Icon icon={ic} width={17} />
                </a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Descripción larga */}
        <motion.section initial="hidden" whileInView="show" viewport={groViewport} variants={groSection} className="mt-8 rounded-2xl border bg-white p-6 md:p-8" style={{ borderColor: GRO.line }}>
          <h2 className="text-xl font-bold" style={{ fontFamily: GRO.display, color: GRO.ink }}>Detalles del producto</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7" style={{ color: GRO.inkSoft }}>{producto?.descripcionLarga ? htmlToText(String(producto.descripcionLarga)) : desc}</p>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <p><span className="font-bold" style={{ color: GRO.ink }}>Categoría:</span> <span style={{ color: GRO.inkSoft }}>{categoria || '—'}</span></p>
            <p><span className="font-bold" style={{ color: GRO.ink }}>Marca:</span> <span style={{ color: GRO.inkSoft }}>{marca || '—'}</span></p>
            <p><span className="font-bold" style={{ color: GRO.ink }}>SKU:</span> <span style={{ color: GRO.inkSoft }}>{producto?.codigo || producto?.sku || '—'}</span></p>
            <p><span className="font-bold" style={{ color: GRO.ink }}>Disponibilidad:</span> <span style={{ color: GRO.inkSoft }}>{outOfStock ? 'Agotado' : `${stock} unidades`}</span></p>
          </div>
        </motion.section>

        {relatedFiltered.length > 0 && (
          <motion.section initial="hidden" whileInView="show" viewport={groViewport} variants={groSection} className="mt-12">
            <div className="mb-6">
              <p className="text-[12px] font-bold" style={{ color: GRO.green }}>Te puede interesar</p>
              <h2 className="mt-1 text-2xl font-bold" style={{ fontFamily: GRO.display, color: GRO.ink }}>Productos relacionados</h2>
            </div>
            <motion.div variants={groStagger} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {relatedFiltered.map((p) => (
                <GroProductCard key={p.id} producto={p} slug={slug} cp={primary} onAddToCart={onAddToCart || ((prod) => actualizarCantidad(prod.id, 1))} onClick={() => go(`/tienda/${slug}/producto/${p.id}`, 'producto')} />
              ))}
            </motion.div>
          </motion.section>
        )}
      </main>

      <GroFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <GroWhatsAppFab tienda={tienda} />

      {setCarrito && (
        <GroCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => go(`/tienda/${slug}/checkout`, 'checkout')} cp={primary} tienda={tienda} />
      )}
    </motion.div>
  );
}

/* ─────────────── Wrapper que hace fetch (tienda real) ─────────────── */
export default function GroginProductoDetalle() {
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
          const relatedRes = await axios.get(`${BASE_URL}/public/store/${slug}/products`, { params: { category, limit: 8 } });
          const arr = Array.isArray(relatedRes.data?.data?.data) ? relatedRes.data.data.data : Array.isArray(relatedRes.data?.data) ? relatedRes.data.data : [];
          setRelated(withPricingList(arr.filter((item: any) => Number(item.id) !== Number(id)).slice(0, 5)));
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
    <GroginProductoDetalleView
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
