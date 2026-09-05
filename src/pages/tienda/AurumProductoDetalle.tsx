import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { getProductPricing, withPricing, withPricingList } from '@/templates/shared/pricing';
import { getApiculturaVariantData, findApiculturaVariant, optionValueAvailable, buildVariantCartItem, type ApiculturaVariantData } from '@/templates/apicultura/variantUtils';
import { onTiendaCartCleared } from '@/utils/tiendaCart';
import { AUR, AurCartModal, AurFooter, AurHeader, AurProductCard, AurProductImage, AurWhatsAppFab, aurFont, aurPrimary, waLink, withAlpha } from '@/templates/joyeria/AurumParts';
import { aurCard, aurFade, aurPage, aurSection, aurStagger, aurTap, aurViewport } from '@/templates/joyeria/motion';
import { getFashionColorImage } from '@/templates/urbano/fashionVariants';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

const money = (v: number) => `S/ ${Number(v || 0).toFixed(2)}`;
const getImg = (p: any) => p?.imagenUrl || p?.imagen || '';
const nameOf = (p: any) => p?.descripcion || p?.nombre || 'Joya';
const catOf = (p: any) => (typeof p?.categoria === 'object' ? p?.categoria?.nombre : p?.categoria) || '';
const marcaOf = (p: any) => (typeof p?.marca === 'object' ? p?.marca?.nombre : p?.marca) || '';

/** Convierte HTML enriquecido a texto plano: quita etiquetas y decodifica entidades (&nbsp;, &amp;, ...). */
const htmlToText = (html: string): string => {
  if (typeof document !== 'undefined') {
    const el = document.createElement('div');
    el.innerHTML = html;
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
};

/** Paleta de colores específica de joyería (metales y gemas), usada para los swatches. */
const normColor = (s: string) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const JEWEL_HEX: [RegExp, string][] = [
  [/oro\s*rosa|oro\s*rosad|rose\s*gold|rosad|\brose\b/, '#E4B7A0'],
  [/oro\s*blanco|white\s*gold/, '#E9E7E2'],
  [/oro\s*amarillo|amarill|\byellow\b/, '#E6C200'],
  [/\boro\b|dorad|\bgold\b/, '#D4AF37'],
  [/plata|silver|\b925\b|acero|platin/, '#C4C4CC'],
  [/negro|onix|onyx|grafit|\bblack\b/, '#201C18'],
  [/perla|marfil|nacar|nacre|pearl/, '#F1ECE1'],
  [/blanc|\bwhite\b/, '#F5F2EC'],
  [/bronce|cobre|bronze|copper/, '#B87333'],
  [/champan|champagne|champ/, '#EFE1B8'],
  [/turques|turquoise/, '#3FC0BE'],
  [/esmeralda|emerald|\bverde\b|\bgreen\b/, '#2E8B57'],
  [/rubi|\brojo\b|ruby|\bred\b|granate|carmesi/, '#9B111E'],
  [/zafiro|sapphire|\bazul\b|\bblue\b/, '#1B4B8F'],
  [/amatista|morad|violeta|purple|lila/, '#7A4FA0'],
];
function jewelHex(label: string): string {
  const n = normColor(label);
  for (const [re, hex] of JEWEL_HEX) if (re.test(n)) return hex;
  return '';
}
// Grises que el admin deja cuando no reconoce el color: no representan nada.
const AUR_PLACEHOLDER_HEX = new Set(['#cbd5e1', '#e5e7eb', '#e5e5e5', '#ddd', '#dddddd']);

function resolveColorHex(label: string, producto: any, fallback?: string): string {
  const overrides = producto?.atributosTecnicos?.coloresTienda;
  if (overrides && typeof overrides === 'object' && overrides[label]) return overrides[label];
  return jewelHex(label) || fallback || '#E5E5E5';
}

/**
 * Swatch del color: hex cuando el color tiene uno propio; si quedó en gris
 * placeholder y hay foto de ese color, se pinta la foto.
 */
function resolveColorSwatch(label: string, producto: any, fallback?: string) {
  const hex = resolveColorHex(label, producto, fallback);
  const overrides = producto?.atributosTecnicos?.coloresTienda;
  const override = overrides && typeof overrides === 'object' ? overrides[label] : '';
  const overrideEsReal =
    typeof override === 'string' &&
    override.trim() !== '' &&
    !AUR_PLACEHOLDER_HEX.has(override.trim().toLowerCase());
  const tieneHexPropio = overrideEsReal || Boolean(jewelHex(label));
  const image = tieneHexPropio ? null : getFashionColorImage(producto, label);
  return { hex, image };
}

/** Selector de variantes (color con swatch hex + otras opciones como pills), estilo Aurum/Arcade. */
function AurVariantSelector({ data, selection, onChange, primary, producto }: {
  data: ApiculturaVariantData;
  selection: Record<string, string>;
  onChange: (s: Record<string, string>) => void;
  primary: string;
  producto: any;
}) {
  if (!data.options.length) return null;
  const eq = (a: string, b: string) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
  return (
    <div className="mt-7 space-y-5">
      {data.options.map((option) => (
        <div key={option.name}>
          <div className="mb-2.5 flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">{option.name}</span>
            {selection[option.name] && <span className="text-[13px] font-semibold" style={{ color: AUR.ink }}>{selection[option.name]}</span>}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {option.values.map((value) => {
              const selected = eq(selection[option.name], value.label);
              const available = optionValueAvailable(data.choices, selection, option.name, value.label);
              if (option.type === 'color') {
                return (
                  <button
                    key={value.label}
                    type="button"
                    disabled={!available}
                    onClick={() => onChange({ ...selection, [option.name]: value.label })}
                    title={value.label}
                    aria-label={value.label}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full ring-2 transition-transform disabled:cursor-not-allowed disabled:opacity-30 ${selected ? 'scale-105' : 'hover:scale-105'}`}
                    style={{ ['--tw-ring-color' as any]: selected ? primary : AUR.line }}
                  >
                    {(() => {
                      const swatch = resolveColorSwatch(value.label, producto, value.hex);
                      return swatch.image ? (
                        <img
                          src={swatch.image}
                          alt={value.label}
                          className="h-7 w-7 rounded-full object-cover ring-1 ring-black/10"
                          draggable={false}
                        />
                      ) : (
                        <span className="h-7 w-7 rounded-full ring-1 ring-black/10" style={{ backgroundColor: swatch.hex }} />
                      );
                    })()}
                    {selected && <Icon icon="solar:check-circle-bold" width={15} className="absolute -right-1 -top-1 rounded-full bg-white" style={{ color: primary }} />}
                  </button>
                );
              }
              return (
                <button
                  key={value.label}
                  type="button"
                  disabled={!available}
                  onClick={() => onChange({ ...selection, [option.name]: value.label })}
                  className="rounded-full border px-4 py-2 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  style={selected ? { backgroundColor: AUR.ink, color: '#fff', borderColor: AUR.ink } : { backgroundColor: '#fff', color: AUR.ink, borderColor: AUR.line }}
                >
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

export function AurumProductoDetalleView({
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
  const primary = aurPrimary(cp || diseno?.colorPrimario);
  const font = aurFont(diseno);
  const pricing = getProductPricing(producto);

  const name = nameOf(producto);
  const marca = marcaOf(producto);
  const categoria = catOf(producto);
  const rawDesc = producto?.detalle || producto?.descripcionCorta || '';
  const desc = rawDesc
    ? htmlToText(String(rawDesc))
    : 'Una pieza elaborada a mano con metales nobles y acabados impecables. Diseño atemporal pensado para acompañarte y perdurar por generaciones.';
  const ratingAvg = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const stars = Math.max(1, Math.min(5, Math.round(ratingAvg || 5)));

  // ── Variantes (color / opciones) ────────────────────────────────────────
  const variantData = useMemo(() => getApiculturaVariantData(producto), [producto]);
  const hasVariants = variantData.choices.length > 0 && variantData.options.length > 0;
  const [variantSel, setVariantSel] = useState<Record<string, string>>(variantData.defaultSelection || {});
  useEffect(() => { setVariantSel(variantData.defaultSelection || {}); }, [variantData.signature]);
  const selectedVariant = useMemo(() => findApiculturaVariant(variantData.choices, variantSel), [variantData.choices, variantSel]);

  const activePricing = hasVariants && selectedVariant
    ? { precioFinal: selectedVariant.precioFinal, precioRegular: selectedVariant.precioRegular, enOferta: selectedVariant.enOferta, porcentajeDescuento: selectedVariant.porcentajeDescuento }
    : pricing;
  const stock = hasVariants ? Number(selectedVariant?.stock ?? 0) : Number(producto?.stock ?? 12);
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
  const relatedFiltered = related.filter((p) => String(p.id) !== String(producto.id)).slice(0, 4);

  return (
    <motion.div initial="hidden" animate="show" variants={aurPage} className="min-h-screen" style={{ backgroundColor: AUR.cream, fontFamily: font }}>
      <AurHeader
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
      <div className="border-b" style={{ borderColor: AUR.line, background: `linear-gradient(120% 120% at 85% 0%, ${AUR.nude}, ${AUR.cream} 60%)` }}>
        <div className="mx-auto max-w-7xl px-6 py-6 text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
          <button type="button" onClick={() => go(`/tienda/${slug}`, 'home')} className="hover:text-neutral-900">Inicio</button>
          <span className="mx-2">/</span>
          <button type="button" onClick={() => go(`/tienda/${slug}/catalogo`, 'catalogo')} className="hover:text-neutral-900">Colección</button>
          <span className="mx-2">/</span>
          <span className="text-neutral-700">{name}</span>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Galería */}
          <motion.div variants={aurFade}>
            <div className="relative aspect-square overflow-hidden rounded-2xl border" style={{ backgroundColor: AUR.mist, borderColor: AUR.line }}>
              {mainImage ? (
                <img src={mainImage} alt={name} className="h-full w-full object-cover" />
              ) : (
                <AurProductImage producto={producto} />
              )}
              {activePricing.enOferta && (
                <span className="absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ backgroundColor: primary, color: AUR.ink }}>
                  -{activePricing.porcentajeDescuento}%
                </span>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {gallery.slice(0, 5).map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className="h-20 w-20 overflow-hidden rounded-xl border-2 transition-colors"
                    style={{ backgroundColor: AUR.mist, borderColor: i === activeImage ? AUR.ink : 'transparent' }}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div variants={aurSection}>
            {marca && <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: AUR.gold }}>{marca}</p>}
            <h1 className="mt-2 text-5xl leading-tight md:text-6xl" style={{ fontFamily: AUR.serif, color: AUR.ink }}>{name}</h1>

            <div className="mt-4 flex items-center gap-3">
              <span style={{ color: AUR.gold }}>{'★'.repeat(stars)}<span className="text-neutral-300">{'★'.repeat(5 - stars)}</span></span>
              <span className="text-sm text-neutral-400">{categoria || 'Joyería'}</span>
            </div>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-4xl font-semibold" style={{ fontFamily: AUR.serif, color: AUR.ink }}>{money(activePricing.precioFinal)}</span>
              {activePricing.enOferta && <span className="text-lg font-medium text-neutral-400 line-through">{money(activePricing.precioRegular)}</span>}
            </div>

            <p className="mt-6 max-w-lg text-sm leading-relaxed text-neutral-600">{desc}</p>

            {/* Selector de variantes (color / opciones) */}
            {hasVariants && <AurVariantSelector data={variantData} selection={variantSel} onChange={setVariantSel} primary={primary} producto={producto} />}

            <div className="mt-6 flex items-center gap-2 text-sm">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${outOfStock ? 'bg-neutral-100 text-neutral-500' : 'text-white'}`} style={outOfStock ? undefined : { backgroundColor: AUR.ink }}>
                <Icon icon={outOfStock ? 'solar:close-circle-bold' : 'solar:check-circle-bold'} width={14} />
                {outOfStock ? 'Agotado' : (hasVariants ? `${stock} disponibles` : 'Disponible')}
              </span>
            </div>

            {/* Acciones */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="inline-flex h-[52px] items-center rounded-full border bg-white" style={{ borderColor: AUR.line }}>
                <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-[52px] w-12 place-items-center text-lg text-neutral-500 hover:text-neutral-900">−</button>
                <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                <button type="button" onClick={() => setQty(qty + 1)} className="grid h-[52px] w-12 place-items-center text-lg text-neutral-500 hover:text-neutral-900">+</button>
              </div>
              <motion.button
                type="button"
                disabled={outOfStock}
                onClick={() => add()}
                whileHover={outOfStock ? undefined : { scale: 1.02, y: -2 }}
                whileTap={outOfStock ? undefined : aurTap}
                className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full px-6 text-xs font-bold uppercase tracking-[0.12em] shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: primary, color: AUR.ink }}
              >
                <Icon icon="solar:bag-4-linear" width={17} /> Añadir al carrito
              </motion.button>
            </div>
            <motion.button
              type="button"
              disabled={outOfStock}
              onClick={buyNow}
              whileHover={outOfStock ? undefined : { y: -2 }}
              whileTap={outOfStock ? undefined : aurTap}
              className="mt-3 w-full rounded-full border py-4 text-xs font-semibold uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderColor: AUR.ink, color: AUR.ink }}
            >
              Comprar ahora
            </motion.button>

            {/* Beneficios */}
            <div className="mt-8 grid gap-4 border-t pt-8 sm:grid-cols-3" style={{ borderColor: AUR.line }}>
              {[
                ['solar:diamond-linear', 'Autenticidad certificada'],
                ['solar:gift-linear', 'Estuche de regalo'],
                ['solar:box-minimalistic-linear', 'Envío asegurado'],
              ].map(([icon, text]) => (
                <div key={text} className="flex items-center gap-2.5 text-xs text-neutral-600">
                  <Icon icon={icon} width={20} style={{ color: AUR.ink }} />
                  {text}
                </div>
              ))}
            </div>

            {/* Compartir */}
            <div className="mt-8 flex items-center gap-3 border-t pt-6" style={{ borderColor: AUR.line }}>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Compartir</span>
              {['mdi:whatsapp', 'mdi:facebook', 'mdi:instagram'].map((ic) => (
                <a key={ic} href={ic === 'mdi:whatsapp' ? waLink(tienda, `Hola, me interesa: ${name}`) : '#'} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-full border text-neutral-500 transition-colors hover:text-neutral-900" style={{ borderColor: AUR.line, backgroundColor: withAlpha(primary, '0d') }}>
                  <Icon icon={ic} width={17} />
                </a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Descripción larga */}
        <motion.section initial="hidden" whileInView="show" viewport={aurViewport} variants={aurSection} className="mt-14 rounded-2xl border bg-white p-8 md:p-10" style={{ borderColor: AUR.line }}>
          <h2 className="text-3xl font-bold lowercase" style={{ fontFamily: AUR.serif, color: AUR.ink }}>sobre esta joya</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-600">{producto?.descripcionLarga ? htmlToText(String(producto.descripcionLarga)) : desc}</p>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <p><span className="font-semibold" style={{ color: AUR.ink }}>Categoría:</span> <span className="text-neutral-500">{categoria || '—'}</span></p>
            <p><span className="font-semibold" style={{ color: AUR.ink }}>Marca:</span> <span className="text-neutral-500">{marca || '—'}</span></p>
            <p><span className="font-semibold" style={{ color: AUR.ink }}>SKU:</span> <span className="text-neutral-500">{producto?.codigo || producto?.sku || '—'}</span></p>
            <p><span className="font-semibold" style={{ color: AUR.ink }}>Disponibilidad:</span> <span className="text-neutral-500">{outOfStock ? 'Agotado' : `${stock} unidades`}</span></p>
          </div>
        </motion.section>

        {/* Relacionados */}
        {relatedFiltered.length > 0 && (
          <motion.section initial="hidden" whileInView="show" viewport={aurViewport} variants={aurSection} className="mt-16">
            <div className="mb-8 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em]" style={{ color: AUR.gold }}>Descubre más</p>
              <h2 className="mt-2 text-4xl font-bold lowercase tracking-tight md:text-5xl" style={{ fontFamily: AUR.serif, color: AUR.ink }}>también te encantará</h2>
            </div>
            <motion.div variants={aurStagger} className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
              {relatedFiltered.map((p) => (
                <AurProductCard key={p.id} producto={p} slug={slug} cp={primary} onAddToCart={onAddToCart || ((prod) => actualizarCantidad(prod.id, 1))} onClick={() => go(`/tienda/${slug}/producto/${p.id}`, 'producto')} />
              ))}
            </motion.div>
          </motion.section>
        )}
      </main>

      <AurFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <AurWhatsAppFab tienda={tienda} />

      {setCarrito && (
        <AurCartModal
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
export default function AurumProductoDetalle() {
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
    <AurumProductoDetalleView
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
