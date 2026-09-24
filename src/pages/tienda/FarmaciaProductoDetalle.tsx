import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { onTiendaCartCleared } from '@/utils/tiendaCart';
import { getProductPricing, withPricing, withPricingList } from '@/templates/shared/pricing';
import { useFavoritosStore } from '@/zustand/favoritos';
import FavoritesDrawer from '@/components/tienda/FavoritesDrawer';
import TiendaCompareBar from '@/components/tienda/TiendaCompareBar';
import TiendaFloatingButtons from '@/components/tienda/TiendaFloatingButtons';
import ProductCardActions from '@/components/tienda/ProductCardActions';
import {
  FarmaciaHeader, FarmaciaFooter, FarmaciaCartModal,
  farmaciaTheme, useFarmaciaFont, fmMoney, Stars,
} from '@/templates/farmacia/FarmaciaParts';
import { ProductRail, OfferCountdown, buildServices, soonestOfferEnd, storeChannels, getName, type Theme } from '@/templates/farmacia/FarmaciaSections';
import { fmEase, fmHeroText, fmStagger, mix } from '@/templates/farmacia/motion';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

const nameOf = (v: any): string => (v && typeof v === 'object' ? v.nombre || v.descripcion || '' : typeof v === 'string' ? v : '');
const isUrl = (v: any) => typeof v === 'string' && /^https?:\/\//i.test(v.trim());

export function FarmaciaProductoDetalleView({ tienda, slug, producto, related = [], allCategories = [], carrito, setCarrito, mostrarCarrito, setMostrarCarrito, actualizarCantidad, onNavigate, onAddToCart }: any) {
  useFarmaciaFont();
  const navigate = useNavigate();
  const diseno = tienda?.diseno || {};
  const t = farmaciaTheme(diseno);
  const ch = storeChannels(tienda, diseno);
  const pricing = getProductPricing(producto);
  const [qty, setQty] = useState(1);
  const [showFav, setShowFav] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);
  useEffect(() => setQty(1), [producto?.id]); // al abrir otro producto, la cantidad vuelve a 1

  const images: string[] = useMemo(() => {
    const extra = Array.isArray(producto?.imagenesExtra) ? producto.imagenesExtra.map((x: any) => (typeof x === 'string' ? x : x?.url || x?.imagenUrl)) : [];
    return Array.from(new Set([producto?.imagenUrl, ...extra].filter(Boolean))) as string[];
  }, [producto]);
  const stock = Number(producto?.stock || 0);
  const isOut = stock <= 0;
  const marca = nameOf(producto?.marca);
  const categoria = nameOf(producto?.categoria);
  const unidad = nameOf(producto?.unidadMedida);
  const rating = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const ratingCount = Number(producto?.ratingCount || producto?.reviewsCount || 0);
  const offerEnd = pricing.enOferta ? soonestOfferEnd([producto]) : null;
  const savings = pricing.enOferta ? Math.max(0, pricing.precioRegular - pricing.precioFinal) : 0;
  const categories = (allCategories || []).map(getName).filter(Boolean);
  const cartCount = (carrito || []).reduce((s: number, i: any) => s + Number(i?.cantidad || 1), 0);
  const services = buildServices(tienda).slice(0, 3);

  const go = (url: string, page?: string) => { if (onNavigate && page) onNavigate(page); else navigate(url); };
  const goProduct = (p: any) => go(`/tienda/${slug}/producto/${p.id}`, 'producto');

  const addItem = (p: any, quantity = 1, openCart = true) => {
    const pr = getProductPricing(p);
    const cantidad = Math.max(1, quantity);
    const item = { ...p, ...pr, precioUnitario: pr.precioFinal, cantidad, id: p.id, productoId: p.id };
    if (onAddToCart) onAddToCart(item);
    else {
      const current = carrito || [];
      const exists = current.find((c: any) => c.id === p.id || c.productoId === p.id);
      const next = exists
        ? current.map((c: any) => (c.id === p.id || c.productoId === p.id) ? { ...c, cantidad: Number(c.cantidad || 1) + cantidad } : c)
        : [...current, item];
      setCarrito(next);
      localStorage.setItem(`tienda:${slug}:carrito`, JSON.stringify(next)); // el checkout lee de aquí
    }
    if (openCart) setMostrarCarrito(true);
  };
  const addMain = () => { if (!isOut) addItem(producto, qty); };
  const buyNow = () => { if (isOut) return; addItem(producto, qty, false); go(`/tienda/${slug}/checkout`, 'checkout'); };
  const askUrl = ch.wa(`Hola, tengo una consulta sobre el producto: ${producto?.descripcion}`);

  const stockTone = isOut
    ? { bg: '#F1F5F9', fg: '#64748B', icon: 'solar:close-circle-bold', text: 'Sin stock por ahora' }
    : stock <= 10
      ? { bg: '#FEF3C7', fg: '#B45309', icon: 'solar:danger-triangle-bold', text: `¡Quedan solo ${stock} unidades!` }
      : { bg: mix(t.primary, 10), fg: t.primary, icon: 'solar:check-circle-bold', text: `Disponible · ${stock} unidades` };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden pb-24" style={{ background: t.bg, fontFamily: t.font }}>
        <FarmaciaHeader tienda={tienda} slug={slug} diseno={diseno} categories={categories} t={t} cartCount={cartCount} favCount={favoritos.length} onOpenCart={() => setMostrarCarrito(true)} onOpenFav={() => setShowFav(true)} onSearch={(v: string) => go(`/tienda/${slug}/catalogo?search=${encodeURIComponent(v)}`, 'catalogo')} navigate={navigate} />

        <nav aria-label="Ruta" className="border-b bg-white" style={{ borderColor: t.line }}>
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-1.5 px-4 py-4 text-[12.5px] font-semibold text-gray-500 lg:px-6">
            <button type="button" onClick={() => go(`/tienda/${slug}`, 'home')} className="hover:text-gray-800">Inicio</button>
            <Icon icon="solar:alt-arrow-right-linear" width={13} className="text-gray-400" />
            <button type="button" onClick={() => go(`/tienda/${slug}/catalogo`, 'catalogo')} className="hover:text-gray-800">Catálogo</button>
            {categoria && <>
              <Icon icon="solar:alt-arrow-right-linear" width={13} className="text-gray-400" />
              <button type="button" onClick={() => go(`/tienda/${slug}/catalogo?category=${encodeURIComponent(categoria)}`, 'catalogo')} className="hover:text-gray-800">{categoria}</button>
            </>}
            <Icon icon="solar:alt-arrow-right-linear" width={13} className="text-gray-400" />
            <span className="line-clamp-1 max-w-[260px]" style={{ color: t.ink }}>{producto?.descripcion}</span>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
          <section className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
            <Gallery t={t} images={images} name={producto?.descripcion} producto={producto} slug={slug} discount={pricing.enOferta ? pricing.porcentajeDescuento : 0} isOut={isOut} />

            {/* ── Info ── */}
            <motion.div variants={fmStagger} initial="hidden" animate="show">
              <motion.div variants={fmHeroText} className="flex flex-wrap items-center gap-2">
                {categoria && <button type="button" onClick={() => go(`/tienda/${slug}/catalogo?category=${encodeURIComponent(categoria)}`, 'catalogo')} className="rounded-full px-3 py-1 text-[11.5px] font-black uppercase tracking-wider" style={{ background: mix(t.primary, 12), color: t.primary }}>{categoria}</button>}
                {marca && <span className="rounded-full border px-3 py-1 text-[11.5px] font-bold uppercase tracking-wider text-gray-500" style={{ borderColor: t.line }}>{marca}</span>}
              </motion.div>

              <motion.h1 variants={fmHeroText} className="mt-4 text-[30px] font-black leading-[1.1] tracking-[-0.02em] sm:text-[36px]" style={{ color: t.ink }}>{producto?.descripcion}</motion.h1>

              <motion.div variants={fmHeroText} className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-gray-500">
                <Stars rating={rating} count={ratingCount} size={16} />
                {producto?.codigo && <span className="font-semibold">Código: <span style={{ color: t.ink }}>{producto.codigo}</span></span>}
              </motion.div>

              {/* Precio */}
              <motion.div variants={fmHeroText} className="mt-6 rounded-3xl p-6" style={{ background: `linear-gradient(135deg, ${mix(t.primary, 8)} 0%, ${mix(t.accent, 5)} 100%)` }}>
                <div className="flex flex-wrap items-end gap-3">
                  <span className="text-[40px] font-black leading-none tracking-[-0.02em]" style={{ color: t.ink }}>{fmMoney(pricing.precioFinal)}</span>
                  {pricing.enOferta && <span className="pb-1 text-[18px] font-semibold text-gray-400 line-through">{fmMoney(pricing.precioRegular)}</span>}
                  {pricing.enOferta && <span className="mb-1 rounded-full px-2.5 py-1 text-[12px] font-black" style={{ background: t.accent, color: t.onAccent }}>-{pricing.porcentajeDescuento}%</span>}
                </div>
                <p className="mt-2 text-[12.5px] font-semibold text-gray-500">
                  IGV incluido{unidad ? ` · Precio por ${unidad.toLowerCase()}` : ''}
                  {savings > 0 && <span className="ml-2 font-black" style={{ color: t.primary }}>Ahorras {fmMoney(savings)}</span>}
                </p>
                {offerEnd && (
                  <div className="mt-5 flex flex-wrap items-center gap-4 border-t pt-5" style={{ borderColor: mix(t.primary, 15) }}>
                    <p className="text-[12px] font-black uppercase tracking-[0.14em]" style={{ color: t.primary }}>La oferta termina en</p>
                    <OfferCountdown t={t} endsAt={offerEnd} size="sm" />
                  </div>
                )}
              </motion.div>

              <motion.div variants={fmHeroText} className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold" style={{ background: stockTone.bg, color: stockTone.fg }}>
                <Icon icon={stockTone.icon} width={18} /> {stockTone.text}
              </motion.div>

              {/* Cantidad + CTAs */}
              <motion.div variants={fmHeroText} ref={ctaRef} className="mt-6 flex flex-col gap-3 sm:flex-row">
                <QtyStepper t={t} qty={qty} setQty={setQty} disabled={isOut} />
                <motion.button type="button" whileHover={isOut ? undefined : { y: -2 }} whileTap={isOut ? undefined : { scale: 0.97 }} disabled={isOut} onClick={addMain} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl text-[15px] font-black disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400" style={isOut ? undefined : { background: t.accent, color: t.onAccent, boxShadow: `0 18px 40px -20px ${mix(t.accent, 90, 'transparent')}` }}>
                  <Icon icon="solar:cart-plus-bold" width={20} /> {isOut ? 'Sin stock' : 'Agregar al carrito'}
                </motion.button>
              </motion.div>
              <motion.button variants={fmHeroText} type="button" whileHover={isOut ? undefined : { y: -2 }} whileTap={isOut ? undefined : { scale: 0.98 }} disabled={isOut} onClick={buyNow} className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-black disabled:cursor-not-allowed disabled:opacity-50" style={{ background: t.primary, color: t.onPrimary }}>
                <Icon icon="solar:bolt-bold" width={19} /> Comprar ahora
              </motion.button>

              {askUrl && (
                <motion.a variants={fmHeroText} href={askUrl} target="_blank" rel="noopener noreferrer" className="group mt-5 flex items-center gap-4 rounded-2xl border bg-white p-4 transition-shadow hover:shadow-[0_18px_40px_-26px_rgba(15,23,42,0.4)]" style={{ borderColor: t.line }}>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: '#E7F8EE', color: '#1FA855' }}><Icon icon="ic:baseline-whatsapp" width={26} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-black" style={{ color: t.ink }}>¿Dudas sobre este producto?</p>
                    <p className="text-[12.5px] text-gray-500">Pregúntale a nuestro químico farmacéutico por WhatsApp</p>
                  </div>
                  <Icon icon="solar:arrow-right-linear" width={20} className="text-gray-400 transition-transform duration-300 group-hover:translate-x-1" />
                </motion.a>
              )}

              <motion.ul variants={fmHeroText} className="mt-5 divide-y rounded-2xl border bg-white" style={{ borderColor: t.line }}>
                {services.map((s) => (
                  <li key={s.label} className="flex items-center gap-3 px-4 py-3.5" style={{ borderColor: t.line }}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: s.bg, color: s.fg }}><Icon icon={s.icon} width={19} /></span>
                    <p className="text-[13.5px]"><span className="font-black" style={{ color: t.ink }}>{s.label}</span> <span className="text-gray-500">· {s.sub}</span></p>
                  </li>
                ))}
              </motion.ul>

              <motion.p variants={fmHeroText} className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-gray-500">
                <Icon icon="solar:document-medicine-linear" width={16} className="mt-0.5 shrink-0" style={{ color: t.primary }} />
                Si este medicamento requiere receta médica, te la solicitaremos antes del despacho.
              </motion.p>
            </motion.div>
          </section>

          <DetailTabs t={t} producto={producto} tienda={tienda} ch={ch} marca={marca} categoria={categoria} unidad={unidad} />
        </main>

        {related.length > 0 && (
          <ProductRail t={t} eyebrow="Relacionados" title="También te puede interesar" products={related} slug={slug} onOpen={goProduct} onAdd={(p: any, q?: number) => addItem(p, q)} />
        )}

        <FarmaciaFooter tienda={tienda} slug={slug} diseno={diseno} t={t} categories={categories} navigate={navigate} />

        <StickyBuyBar t={t} watchRef={ctaRef} producto={producto} price={pricing.precioFinal} isOut={isOut} onAdd={addMain} onBuy={buyNow} />
        <TiendaFloatingButtons diseno={diseno} tienda={tienda} />
        <FarmaciaCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => go(`/tienda/${slug}/checkout`, 'checkout')} t={t} tienda={tienda} diseno={diseno} />
        <FavoritesDrawer open={showFav} slug={slug} cp={t.primary} favoritos={favoritos} onClose={() => setShowFav(false)} onProduct={(item: any) => { setShowFav(false); goProduct(item); }} onRemove={(id: any, s: string) => removeFavorito(id, s)} />
        <TiendaCompareBar slug={slug} cp={t.primary} onGoProduct={(item: any) => goProduct(item)} />
      </div>
    </MotionConfig>
  );
}

// ═══════════════════════════════════════════════════════════════ GALERÍA ══
/** Galería aislada: el zoom sigue al mouse escribiendo transform-origin por ref (sin re-renders). */
function Gallery({ t, images, name, producto, slug, discount, isOut }: { t: Theme; images: string[]; name?: string; producto: any; slug: string; discount: number; isOut: boolean }) {
  const [idx, setIdx] = useState(0);
  const [zooming, setZooming] = useState(false);
  const zoomRef = useRef<HTMLDivElement>(null);
  const canHover = useMemo(() => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(hover: hover)').matches), []);
  useEffect(() => setIdx(0), [images]);
  const src = images[idx];
  const step = (d: number) => setIdx((v) => (v + d + images.length) % images.length);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: fmEase }} className="lg:sticky lg:top-6 lg:self-start">
      <div
        className="group relative aspect-square overflow-hidden rounded-[32px] border bg-white"
        style={{ borderColor: t.line, cursor: src && canHover ? 'zoom-in' : 'default' }}
        onMouseEnter={() => src && canHover && setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        onMouseMove={(e) => {
          if (!zoomRef.current) return;
          const r = e.currentTarget.getBoundingClientRect();
          zoomRef.current.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
        }}
      >
        <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
          {discount > 0 && <span className="rounded-full px-3 py-1 text-[12px] font-black" style={{ background: t.accent, color: t.onAccent }}>-{discount}%</span>}
          {isOut && <span className="rounded-full bg-gray-800 px-3 py-1 text-[12px] font-black text-white">Agotado</span>}
        </div>
        <div className="absolute right-4 top-4 z-10"><ProductCardActions producto={producto} slug={slug} cp={t.primary} /></div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={src || 'empty'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="absolute inset-0">
            <div ref={zoomRef} className="h-full w-full transition-transform duration-300 ease-out" style={{ transform: zooming ? 'scale(1.9)' : 'scale(1)' }}>
              {src ? (
                <img src={src} alt={name || ''} className={`h-full w-full object-contain p-10 mix-blend-multiply ${isOut ? 'opacity-60 grayscale' : ''}`} />
              ) : (
                <div className="flex h-full w-full items-center justify-center" style={{ background: t.soft }}><Icon icon="solar:pills-3-bold-duotone" width={150} style={{ color: t.primary }} /></div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {images.length > 1 && [{ d: -1, icon: 'solar:alt-arrow-left-linear', pos: 'left-4', label: 'Imagen anterior' }, { d: 1, icon: 'solar:alt-arrow-right-linear', pos: 'right-4', label: 'Imagen siguiente' }].map((b) => (
          <button key={b.d} type="button" aria-label={b.label} onClick={() => step(b.d)} className={`absolute ${b.pos} top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border bg-white/90 opacity-0 shadow-sm backdrop-blur transition-opacity duration-300 group-hover:opacity-100`} style={{ borderColor: t.line, color: t.ink }}>
            <Icon icon={b.icon} width={20} />
          </button>
        ))}
        {src && canHover && !zooming && (
          <span className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-gray-500 opacity-0 shadow-sm transition-opacity duration-300 group-hover:opacity-100">
            <Icon icon="solar:magnifer-zoom-in-linear" width={13} className="mr-1 inline" />Pasa el mouse para ampliar
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
          {images.slice(0, 6).map((img, i) => (
            <button key={img} type="button" aria-label={`Ver imagen ${i + 1}`} onClick={() => setIdx(i)} className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border bg-white p-2" style={{ borderColor: t.line }}>
              {i === idx && <motion.span layoutId="fm-thumb-ring" className="absolute -inset-px rounded-2xl border-2" style={{ borderColor: t.primary }} transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
              <img src={img} alt="" className="h-full w-full object-contain mix-blend-multiply" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function QtyStepper({ t, qty, setQty, disabled }: { t: Theme; qty: number; setQty: (n: number) => void; disabled: boolean }) {
  const [text, setText] = useState(String(qty));
  useEffect(() => setText(String(qty)), [qty]);
  return (
    <div className="flex h-14 w-full items-center justify-between rounded-2xl border bg-white px-2 sm:w-40" style={{ borderColor: t.line }}>
      <motion.button type="button" whileTap={{ scale: 0.85 }} aria-label="Restar" disabled={disabled} onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-50 disabled:text-gray-300"><Icon icon="solar:minus-circle-linear" width={22} /></motion.button>
      <input
        type="text"
        inputMode="numeric"
        aria-label="Cantidad"
        disabled={disabled}
        value={text}
        onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setText(d); if (d) setQty(parseInt(d, 10)); }}
        onBlur={() => { const n = Math.max(1, parseInt(text || '1', 10) || 1); setQty(n); setText(String(n)); }}
        onFocus={(e) => e.currentTarget.select()}
        className="w-full min-w-0 appearance-none border-0 bg-transparent p-0 text-center text-[17px] font-black outline-none focus:ring-0"
        style={{ color: t.ink }}
      />
      <motion.button type="button" whileTap={{ scale: 0.85 }} aria-label="Sumar" disabled={disabled} onClick={() => setQty(Math.max(1, qty) + 1)} className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-50 disabled:text-gray-300"><Icon icon="solar:add-circle-linear" width={22} /></motion.button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════ PESTAÑAS ══
function DetailTabs({ t, producto, tienda, ch, marca, categoria, unidad }: { t: Theme; producto: any; tienda: any; ch: ReturnType<typeof storeChannels>; marca: string; categoria: string; unidad: string }) {
  const specs: [string, string][] = Object.entries(producto?.atributosTecnicos || {})
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '' && typeof v !== 'object')
    .map(([k, v]) => [k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase()), String(v)]);
  const rows: [string, string][] = [];
  if (producto?.codigo) rows.push(['Código', String(producto.codigo)]);
  if (categoria) rows.push(['Categoría', categoria]);
  if (marca) rows.push(['Marca', marca]);
  if (unidad) rows.push(['Presentación', unidad]);
  rows.push(...specs);

  const envio = Number(tienda?.costoEnvioFijo || 0);
  const minPrep = Number(tienda?.tiempoPreparacionMin || 0);
  const shipping = [
    { icon: 'solar:delivery-bold-duotone', title: 'Delivery', text: tienda?.aceptaEnvio === false ? 'Por ahora no realizamos envíos a domicilio.' : envio > 0 ? `Envío a domicilio desde ${fmMoney(envio)}.` : 'Envío a domicilio. El costo se muestra al finalizar tu compra.' },
    { icon: 'solar:shop-2-bold-duotone', title: 'Recojo en tienda', text: tienda?.aceptaRecojo ? `Listo ${minPrep > 0 ? `en aprox. ${minPrep} min` : 'en poco tiempo'}${ch.pickupAddress ? ` en ${ch.pickupAddress}` : ''}.` : 'Por ahora solo realizamos envíos.' },
    { icon: 'solar:map-arrow-square-bold-duotone', title: 'Seguimiento', text: 'Al confirmar tu compra recibirás un código para seguir el estado de tu pedido.' },
  ];
  const tabs = [{ key: 'desc', label: 'Descripción' }, ...(rows.length ? [{ key: 'spec', label: 'Especificaciones' }] : []), { key: 'ship', label: 'Envío y recojo' }];
  const [active, setActive] = useState('desc');
  const fichaUrl = isUrl(producto?.fichaTecnica) ? producto.fichaTecnica : null;

  return (
    <section className="mt-16">
      <div className="flex gap-1 overflow-x-auto border-b [scrollbar-width:none]" style={{ borderColor: t.line }} role="tablist">
        {tabs.map((tab) => (
          <button key={tab.key} type="button" role="tab" aria-selected={active === tab.key} onClick={() => setActive(tab.key)} className="relative shrink-0 px-5 py-4 text-[15px] font-black transition-colors duration-300" style={{ color: active === tab.key ? t.ink : '#94A3B8' }}>
            {tab.label}
            {active === tab.key && <motion.span layoutId="fm-detail-tab" className="absolute inset-x-3 -bottom-px h-[3px] rounded-full" style={{ background: t.primary }} transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: fmEase }} className="py-8">
          {active === 'desc' && (
            <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
              <div className="text-[15px] leading-[1.75] text-gray-600">
                {producto?.descripcionLarga ? (
                  <p className="whitespace-pre-line">{producto.descripcionLarga}</p>
                ) : (
                  <p>{producto?.descripcion}{categoria ? `, disponible en nuestra sección de ${categoria.toLowerCase()}` : ''}. Para información detallada sobre su uso, composición y contraindicaciones, revisa el prospecto del empaque o consulta con nuestro químico farmacéutico.</p>
                )}
                {fichaUrl && (
                  <a href={fichaUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full border bg-white px-5 py-2.5 text-[13.5px] font-bold" style={{ borderColor: t.line, color: t.primary }}>
                    <Icon icon="solar:document-text-bold-duotone" width={19} /> Ver ficha técnica
                  </a>
                )}
              </div>
              <div className="rounded-3xl p-6" style={{ background: mix(t.primary, 7) }}>
                <p className="flex items-center gap-2 text-[13px] font-black uppercase tracking-[0.12em]" style={{ color: t.primary }}><Icon icon="solar:shield-warning-bold-duotone" width={18} /> Uso responsable</p>
                <ul className="mt-4 space-y-3 text-[13.5px] leading-relaxed text-gray-600">
                  {['Lee las indicaciones del empaque antes de usar.', 'No te automediques: consulta a tu médico o químico farmacéutico.', 'Conserva en lugar fresco y seco, fuera del alcance de los niños.'].map((x) => (
                    <li key={x} className="flex gap-2.5"><Icon icon="solar:check-circle-linear" width={17} className="mt-0.5 shrink-0" style={{ color: t.primary }} />{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {active === 'spec' && (
            <dl className="overflow-hidden rounded-3xl border bg-white" style={{ borderColor: t.line }}>
              {rows.map(([k, v], i) => (
                <div key={`${k}-${i}`} className="grid grid-cols-[minmax(120px,220px)_1fr] gap-4 px-6 py-4 text-[14px]" style={{ background: i % 2 ? 'white' : mix(t.primary, 3) }}>
                  <dt className="font-bold text-gray-500">{k}</dt>
                  <dd className="font-semibold" style={{ color: t.ink }}>{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {active === 'ship' && (
            <div className="grid gap-4 sm:grid-cols-3">
              {shipping.map((s) => (
                <div key={s.title} className="rounded-3xl border bg-white p-6" style={{ borderColor: t.line }}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: mix(t.primary, 11), color: t.primary }}><Icon icon={s.icon} width={26} /></span>
                  <p className="mt-4 text-[15px] font-black" style={{ color: t.ink }}>{s.title}</p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-gray-500">{s.text}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════ BARRA FIJA ══
/** Barra de compra fija: aparece cuando el bloque de botones sale de pantalla hacia arriba. Estado aislado. */
function StickyBuyBar({ t, watchRef, producto, price, isOut, onAdd, onBuy }: { t: Theme; watchRef: RefObject<HTMLDivElement | null>; producto: any; price: number; isOut: boolean; onAdd: () => void; onBuy: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = watchRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [watchRef]);
  if (isOut) return null;
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ y: 110 }} animate={{ y: 0 }} exit={{ y: 110 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 shadow-[0_-18px_40px_-28px_rgba(15,23,42,0.45)] backdrop-blur-md" style={{ borderColor: t.line }}>
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:pr-24 lg:px-6 lg:pr-24">
            {producto?.imagenUrl && <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:flex" style={{ background: t.soft }}><img src={producto.imagenUrl} alt="" className="h-10 w-10 object-contain mix-blend-multiply" /></span>}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-bold" style={{ color: t.ink }}>{producto?.descripcion}</p>
              <p className="text-[16px] font-black" style={{ color: t.primary }}>{fmMoney(price)}</p>
            </div>
            <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={onAdd} className="flex h-12 items-center gap-2 rounded-full px-5 text-[14px] font-black" style={{ background: t.accent, color: t.onAccent }}>
              <Icon icon="solar:cart-plus-bold" width={19} /> <span className="hidden sm:inline">Agregar</span>
            </motion.button>
            <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={onBuy} className="hidden h-12 items-center gap-2 rounded-full px-6 text-[14px] font-black md:flex" style={{ background: t.primary, color: t.onPrimary }}>
              Comprar ahora
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════ WRAPPER (datos) ══
export default function FarmaciaProductoDetalle() {
  const { slug = '', id = '' } = useParams();
  const navigate = useNavigate();
  const [tienda, setTienda] = useState<any>(null);
  const [producto, setProducto] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    try { const saved = localStorage.getItem(`tienda:${slug}:carrito`); if (saved) setCarrito(JSON.parse(saved)); } catch { /* carrito corrupto: se ignora */ }
    return onTiendaCartCleared(slug, () => { setCarrito([]); setMostrarCarrito(false); });
  }, [slug]);

  useEffect(() => {
    if (carrito.length > 0) localStorage.setItem(`tienda:${slug}:carrito`, JSON.stringify(carrito));
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
        window.scrollTo({ top: 0 });
        // Relacionados: primero la misma categoría; si son pocos, se completa con otros productos de la tienda.
        const listOf = (res: any) => (Array.isArray(res.data?.data?.data) ? res.data.data.data : Array.isArray(res.data?.data) ? res.data.data : []);
        const category = product.categoria?.nombre || product.categoria;
        let pool: any[] = category ? listOf(await axios.get(`${BASE_URL}/public/store/${slug}/products`, { params: { category, limit: 9 } })) : [];
        pool = pool.filter((item: any) => Number(item.id) !== Number(id));
        if (pool.length < 4) {
          const seen = new Set(pool.map((p: any) => Number(p.id)));
          const more = listOf(await axios.get(`${BASE_URL}/public/store/${slug}/products`, { params: { limit: 12 } }))
            .filter((item: any) => Number(item.id) !== Number(id) && !seen.has(Number(item.id)));
          pool = [...pool, ...more];
        }
        setRelated(withPricingList(pool.slice(0, 8)));
      } catch {
        navigate(`/tienda/${slug}`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, id, navigate]);

  const actualizarCantidad = (productoId: number | string, cantidad: number) => {
    const next = cantidad <= 0
      ? carrito.filter((item) => item.id !== productoId && item.productoId !== productoId)
      : carrito.map((item) => (item.id === productoId || item.productoId === productoId) ? { ...item, cantidad } : item);
    setCarrito(next);
    localStorage.setItem(`tienda:${slug}:carrito`, JSON.stringify(next));
  };

  const memoStore = useMemo(() => tienda || {}, [tienda]);

  if (loading && !producto) return <div className="flex min-h-screen items-center justify-center bg-white"><Icon icon="solar:refresh-bold" className="h-12 w-12 animate-spin text-gray-300" /></div>;
  if (!producto) return null;

  return (
    <FarmaciaProductoDetalleView
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
