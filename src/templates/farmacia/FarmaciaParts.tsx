import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { getProductPricing } from '@/templates/shared/pricing';
import { readableText } from '@/templates/shared/color';
import ProductCardActions from '@/components/tienda/ProductCardActions';
import { buildStorePurchaseWhatsappUrl } from '@/utils/storeWhatsapp';

// ── Design tokens (paleta verde médico "MediCare", editable vía Personalizar) ──
export const fmMoney = (v: any) => `S/ ${Number(v || 0).toFixed(2)}`;
export const editable = (v: any, fallback: string) => String(v || '').trim() || fallback;

export function farmaciaTheme(diseno: any) {
  const primary = diseno?.colorPrimario || '#0C6B58'; // verde médico profundo (header/nav)
  const accent = diseno?.colorAccento || '#16A34A';   // verde salud (CTA)
  const bg = diseno?.colorSecundario || '#F1FBF7';     // fondo mint muy claro
  return {
    primary,
    accent,
    bg,
    ink: '#123B35',
    soft: '#EAF4F1',
    line: '#E2EFEA',
    onPrimary: readableText(primary),
    onAccent: readableText(accent),
    font: `'${diseno?.tipografia || 'Figtree'}', 'Segoe UI', system-ui, sans-serif`,
  };
}

/** Inyecta la fuente Figtree/Noto Sans una sola vez para el look premium. */
export function useFarmaciaFont() {
  useEffect(() => {
    const id = 'farmacia-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&family=Noto+Sans:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
}

export function Stars({ rating = 0, count, size = 14 }: { rating?: number; count?: number; size?: number }) {
  const r = Math.round(rating);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex" style={{ color: '#F5A623' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Icon key={i} icon={i < r ? 'solar:star-bold' : 'solar:star-linear'} width={size} className={i < r ? '' : 'text-gray-300'} />
        ))}
      </div>
      {count !== undefined && <span className="text-[11px] font-semibold text-gray-400">{count > 0 ? `(${count})` : 'Nuevo'}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── Header ──
export function FarmaciaHeader({
  tienda, slug, diseno, categories, t, cartCount, favCount, onOpenCart, onOpenFav, onSearch, navigate,
}: any) {
  const [q, setQ] = useState('');
  const storeName = tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || 'MediCare';
  const phone = formatPhone(tienda?.whatsappTienda || tienda?.telefono); // sin número inventado: si no hay, se oculta
  const horario = String(tienda?.horarioAtencion || '').trim();
  const navItems: { label: string; to: string }[] = [
    { label: editable(diseno?.farmaciaNavHome, 'Inicio'), to: `/tienda/${slug}` },
    { label: editable(diseno?.farmaciaNavShop, 'Catálogo'), to: `/tienda/${slug}/catalogo` },
    ...(categories || []).slice(0, 3).map((c: string) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })),
    { label: editable(diseno?.farmaciaNavContact, 'Contacto'), to: `/tienda/${slug}/contacto` },
  ];

  return (
    <header className="relative z-30">
      {/* Topbar */}
      <div className="text-white" style={{ background: t.primary }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-[12px] font-semibold lg:px-6" style={{ color: t.onPrimary }}>
          <div className="flex items-center gap-5">
            <span className="hidden items-center gap-1.5 sm:inline-flex"><Icon icon="solar:medical-kit-linear" width={15} /> {editable(diseno?.farmaciaTopbarLeft, 'Farmacia con receta y venta libre')}</span>
          </div>
          <div className="flex items-center gap-4 opacity-90">
            {horario && <span className="hidden items-center gap-1.5 md:inline-flex"><Icon icon="solar:clock-circle-linear" width={15} /> {horario}</span>}
            <button type="button" onClick={() => navigate(`/tienda/${slug}/contacto`)} className="inline-flex items-center gap-1.5 hover:opacity-70"><Icon icon="solar:chat-round-dots-linear" width={15} /> Contáctanos</button>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="border-b bg-white" style={{ borderColor: t.line }}>
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 lg:px-6">
          <button type="button" onClick={() => navigate(`/tienda/${slug}`)} className="flex shrink-0 items-center gap-2">
            {tienda?.logo ? (
              <img src={tienda.logo} alt={storeName} className="h-11 w-auto max-w-[180px] object-contain" />
            ) : (
              <>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: t.accent, color: t.onAccent }}>
                  <Icon icon="solar:health-bold" width={24} />
                </span>
                <span className="text-[22px] font-black lowercase tracking-tight" style={{ color: t.ink, fontWeight: 900 }}>{storeName}</span>
              </>
            )}
          </button>

          <form
            onSubmit={(e) => { e.preventDefault(); onSearch(q); }}
            className="mx-auto hidden h-12 w-full max-w-2xl items-center overflow-hidden rounded-full border md:flex"
            style={{ borderColor: t.line }}
          >
            <div className="hidden items-center gap-1 border-r px-4 text-[13px] font-semibold text-gray-500 lg:flex" style={{ borderColor: t.line }}>
              {editable(diseno?.farmaciaSearchCategory, 'Todas las categorías')} <Icon icon="solar:alt-arrow-down-linear" width={16} />
            </div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={editable(diseno?.farmaciaSearchPlaceholder, 'Busca medicamentos, vitaminas, cuidado…')} className="min-w-0 flex-1 border-0 bg-transparent px-4 text-[14px] text-gray-700 outline-none focus:ring-0" />
            <button type="submit" className="mr-1 flex h-9 items-center gap-1.5 rounded-full px-5 text-[13px] font-bold" style={{ background: t.accent, color: t.onAccent }}>
              <Icon icon="solar:magnifer-linear" width={17} /> Buscar
            </button>
          </form>

          <div className="ml-auto flex items-center gap-4 md:ml-0">
            {phone && (
              <div className="hidden items-center gap-2 lg:flex">
                <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: t.soft, color: t.primary }}><Icon icon="solar:phone-calling-rounded-bold" width={22} /></span>
                <div className="leading-tight">
                  <p className="text-[11px] font-semibold text-gray-400">Llámanos</p>
                  <p className="text-[14px] font-black" style={{ color: t.ink }}>{phone}</p>
                </div>
              </div>
            )}
            <button type="button" onClick={onOpenFav} className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:opacity-80" style={{ background: t.soft, color: t.primary }} title="Favoritos">
              <Icon icon="solar:heart-linear" width={22} />
              {favCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">{favCount}</span>}
            </button>
            <button type="button" onClick={onOpenCart} className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:opacity-90" style={{ background: t.accent, color: t.onAccent }} title="Mi carrito">
              <Icon icon="solar:cart-large-2-bold" width={22} />
              {cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-black" style={{ color: t.ink }}>{cartCount}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Category nav */}
      <div className="hidden border-b bg-white lg:block" style={{ borderColor: t.line }}>
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 lg:px-6">
          <button type="button" onClick={() => navigate(`/tienda/${slug}/catalogo`)} className="mr-3 my-2 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-bold text-white" style={{ background: t.primary, color: t.onPrimary }}>
            <Icon icon="solar:widget-5-bold" width={18} /> {editable(diseno?.farmaciaCategoriesLabel, 'Categorías')}
          </button>
          <nav className="flex min-w-0 items-center gap-1 overflow-x-auto py-1 text-[13.5px] font-semibold [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ color: t.ink }}>
            {navItems.map((item, i) => (
              <button key={`${item.label}-${i}`} type="button" onClick={() => navigate(item.to)} className="whitespace-nowrap rounded-lg px-3.5 py-2 transition-colors hover:bg-black/5">{item.label}</button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────── Footer ──
export function FarmaciaFooter({ tienda, slug, diseno, t, categories, navigate }: any) {
  const storeName = tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || 'MediCare';
  const phone = formatPhone(tienda?.whatsappTienda || tienda?.telefono); // sin número inventado: si no hay, se oculta
  // Solo enlaces a páginas que existen (nada de "términos" o "programas" inventados).
  const cats: string[] = (categories || []).slice(0, 5);
  const cols: { title: string; items: { label: string; to: string }[] }[] = [
    { title: 'Tienda', items: [
      { label: 'Inicio', to: `/tienda/${slug}` },
      { label: 'Catálogo', to: `/tienda/${slug}/catalogo` },
      { label: 'Seguimiento de pedido', to: `/tienda/${slug}/seguimiento` },
    ] },
    { title: 'Ayuda', items: [
      { label: 'Contáctanos', to: `/tienda/${slug}/contacto` },
      { label: 'Preguntas frecuentes', to: `/tienda/${slug}/contacto#faq` },
    ] },
    ...(cats.length ? [{ title: 'Categorías', items: cats.map((c) => ({ label: c, to: `/tienda/${slug}/catalogo?category=${encodeURIComponent(c)}` })) }] : []),
  ];
  return (
    <footer className="text-white" style={{ background: t.primary, color: t.onPrimary }}>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: t.accent, color: t.onAccent }}><Icon icon="solar:health-bold" width={24} /></span>
            <span className="text-[22px] font-black lowercase">{storeName}</span>
          </div>
          <p className="mt-5 max-w-xs text-[13.5px] leading-relaxed opacity-80">{editable(diseno?.farmaciaFooterText, 'Tu farmacia de confianza. Medicamentos, vitaminas y productos de cuidado con entrega rápida y atención profesional.')}</p>
          <div className="mt-6 space-y-2.5 text-[13.5px] opacity-90">
            {tienda?.direccion && <p className="flex items-start gap-2.5"><Icon icon="solar:map-point-linear" width={18} className="mt-0.5 shrink-0" /> {[tienda.direccion, tienda?.distrito].filter(Boolean).join(', ')}</p>}
            {phone && <p className="flex items-center gap-2.5"><Icon icon="solar:phone-linear" width={18} /> {phone}</p>}
            {tienda?.email && <p className="flex items-center gap-2.5"><Icon icon="solar:letter-linear" width={18} /> {tienda.email}</p>}
          </div>
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="text-[15px] font-black">{col.title}</h4>
            <ul className="mt-5 space-y-3 text-[13.5px] opacity-80">
              {col.items.map((it) => (
                <li key={it.label}><button type="button" onClick={() => navigate(it.to)} className="text-left transition-opacity hover:opacity-100">{it.label}</button></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-[12.5px] opacity-80 sm:flex-row lg:px-6">
          <p>© {new Date().getFullYear()} {storeName}. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2">
            {['logos:visa', 'logos:mastercard', 'simple-icons:mercadopago'].map((ic) => (
              <span key={ic} className="flex h-7 w-11 items-center justify-center rounded bg-white/90 px-1"><Icon icon={ic} width={30} /></span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────── Product card ──
export function FarmaciaProductCard({ producto, slug, t, onOpen, onAdd, compact = false }: any) {
  const pricing = getProductPricing(producto);
  const rating = Number(producto?.ratingAvg || producto?.ratingPromedio || 0);
  const ratingCount = Number(producto?.ratingCount || producto?.reviewsCount || 0);
  const stock = Number(producto?.stock ?? 1);
  const isOut = stock <= 0;
  const hasVariants = Array.isArray(producto?.variantes) && producto.variantes.length > 0;
  const [qty, setQty] = useState(1);
  const availPct = Math.max(6, Math.min(100, (stock / Math.max(stock, 60)) * 100));
  // Etiqueta honesta: marca real, si no la categoría; nunca una marca inventada.
  const brandLabel = (typeof producto?.marca === 'object' ? producto?.marca?.nombre : producto?.marca)
    || (typeof producto?.categoria === 'object' ? producto?.categoria?.nombre : producto?.categoria)
    || '';

  if (compact) {
    return (
      <button type="button" onClick={onOpen} className="group flex w-full items-center gap-3 rounded-xl border bg-white p-2.5 text-left transition-all hover:shadow-md" style={{ borderColor: t.line }}>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg" style={{ background: t.soft }}>
          {producto?.imagenUrl ? <img src={producto.imagenUrl} alt={producto.descripcion} className="h-full w-full object-contain p-1 mix-blend-multiply" /> : <Icon icon="solar:pill-bold" width={26} style={{ color: t.primary }} />}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-2 text-[12.5px] font-bold leading-snug" style={{ color: t.ink }}>{producto?.descripcion}</h4>
          <div className="mt-1"><Stars rating={rating} count={ratingCount} size={12} /></div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[14px] font-black" style={{ color: t.ink }}>{fmMoney(pricing.precioFinal)}</span>
            {pricing.enOferta && <span className="text-[11px] font-semibold text-gray-400 line-through">{fmMoney(pricing.precioRegular)}</span>}
          </div>
        </div>
      </button>
    );
  }

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="group relative flex h-full flex-col rounded-2xl border bg-white p-3.5 transition-shadow duration-300 hover:shadow-[0_22px_44px_-24px_rgba(15,23,42,0.38)]"
      style={{ borderColor: t.line }}
      onClick={onOpen}
    >
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
        {pricing.enOferta && <span className="rounded-full px-2.5 py-1 text-[10px] font-black text-white" style={{ background: t.accent, color: t.onAccent }}>-{pricing.porcentajeDescuento}%</span>}
        {isOut ? <span className="rounded-full bg-gray-800 px-2.5 py-1 text-[10px] font-black text-white">Agotado</span>
          : stock <= 5 ? <span className="rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-black text-white">¡Últimas {stock}!</span> : null}
      </div>
      <div className="absolute right-2 top-2 z-10 hidden group-hover:block">
        <ProductCardActions producto={producto} slug={slug} cp={t.primary} />
      </div>

      <div className="relative flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl" style={{ background: t.soft }}>
        {producto?.imagenUrl ? (
          <img src={producto.imagenUrl} alt={producto.descripcion} className={`max-h-full max-w-full object-contain p-2 mix-blend-multiply transition-transform duration-300 group-hover:scale-105 ${isOut ? 'opacity-50 grayscale' : ''}`} />
        ) : (
          <Icon icon="solar:pills-3-bold-duotone" width={64} style={{ color: t.primary }} />
        )}
      </div>

      <p className="mt-3 min-h-[16px] truncate text-[11px] font-bold uppercase tracking-wide" style={{ color: t.accent }}>{brandLabel}</p>
      <h3 title={producto?.descripcion} className="mt-1 line-clamp-2 min-h-[38px] cursor-pointer text-[13.5px] font-bold leading-snug" style={{ color: t.ink }}>{producto?.descripcion}</h3>
      <div className="mt-2"><Stars rating={rating} count={ratingCount} /></div>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-[19px] font-black" style={{ color: t.ink }}>{fmMoney(pricing.precioFinal)}</span>
        {pricing.enOferta && <span className="pb-0.5 text-[13px] font-semibold text-gray-400 line-through">{fmMoney(pricing.precioRegular)}</span>}
      </div>

      {/* Availability bar */}
      <div className="mt-2.5">
        <div className="h-1.5 overflow-hidden rounded-full" style={{ background: t.line }}>
          <div className="h-full rounded-full" style={{ width: `${availPct}%`, background: t.accent }} />
        </div>
        <p className="mt-1 text-[11px] font-semibold text-gray-400">{isOut ? 'Sin stock' : `Disponibles: ${stock}`}</p>
      </div>

      <div className="mt-auto flex items-stretch gap-2 pt-3" onClick={(e) => e.stopPropagation()}>
        {!hasVariants && (
          <div className="flex h-10 w-[72px] shrink-0 items-center justify-between rounded-lg border px-1.5 text-[13px] font-bold" style={{ borderColor: t.line }}>
            <button type="button" disabled={isOut} onClick={() => setQty(Math.max(1, qty - 1))} className="px-1 text-base leading-none text-gray-500 disabled:text-gray-300">−</button>
            <input type="text" inputMode="numeric" aria-label="Cantidad" disabled={isOut} value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); setQty(d === '' ? 1 : parseInt(d, 10)); }} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 appearance-none border-0 bg-transparent p-0 text-center font-bold outline-none focus:ring-0" style={{ color: t.ink }} />
            <button type="button" disabled={isOut} onClick={() => setQty(Math.max(1, qty) + 1)} className="px-1 text-base leading-none text-gray-500 disabled:text-gray-300">+</button>
          </div>
        )}
        <button
          type="button"
          disabled={isOut}
          onClick={() => { if (isOut) return; hasVariants ? onOpen() : onAdd(Math.max(1, qty)); }}
          className="flex min-w-0 flex-1 items-center justify-center gap-1.5 truncate rounded-lg px-3 py-2.5 text-[13px] font-bold transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          style={isOut ? undefined : { background: t.accent, color: t.onAccent }}
        >
          <Icon icon={hasVariants ? 'solar:eye-bold' : 'solar:cart-plus-bold'} width={17} className="shrink-0" />
          <span className="truncate">{isOut ? 'Agotado' : hasVariants ? 'Ver opciones' : 'Agregar'}</span>
        </button>
      </div>
    </motion.article>
  );
}

// ─────────────────────────────────────────────────────────────── Cart modal ──
export function FarmaciaCartModal({ isOpen, onClose, carrito, actualizarCantidad, onCheckout, t, tienda, diseno }: any) {
  const total = (carrito || []).reduce((a: number, it: any) => a + Number(it.precioUnitario || 0) * Number(it.cantidad || 1), 0);
  const storeName = tienda?.nombreComercial || tienda?.nombre || 'MediCare';
  const cotizar = () => {
    if (!carrito?.length) return;
    const detail = carrito.map((it: any) => `• ${Number(it.cantidad || 1)} x ${it.descripcion} - ${fmMoney(Number(it.precioUnitario || 0) * Number(it.cantidad || 1))}`).join('\n');
    const msg = `Hola, quiero pedir estos productos en ${storeName}:\n\n${detail}\n\nTotal estimado: ${fmMoney(total)}`;
    const url = buildStorePurchaseWhatsappUrl(tienda?.whatsappTienda ?? diseno?.whatsappTienda, msg);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button type="button" aria-label="Cerrar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 240 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between px-6 py-5 text-white" style={{ background: t.primary, color: t.onPrimary }}>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-70">Tu pedido</p>
                <h2 className="mt-0.5 text-2xl font-black">Mi carrito</h2>
                <p className="mt-0.5 text-[13px] opacity-80">{carrito?.length || 0} {(carrito?.length || 0) === 1 ? 'producto' : 'productos'}</p>
              </div>
              <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"><Icon icon="solar:close-circle-bold" width={24} /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5" style={{ background: t.bg }}>
              {!carrito?.length ? (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed bg-white px-8 text-center" style={{ borderColor: t.line }}>
                  <span className="flex h-20 w-20 items-center justify-center rounded-full text-white" style={{ background: t.primary, color: t.onPrimary }}><Icon icon="solar:cart-large-minimalistic-linear" width={40} /></span>
                  <h3 className="mt-5 text-lg font-black" style={{ color: t.ink }}>Tu carrito está vacío</h3>
                  <p className="mt-1.5 text-sm text-gray-500">Agrega medicamentos o productos de cuidado para continuar.</p>
                  <button type="button" onClick={onClose} className="mt-6 rounded-full px-6 py-2.5 text-sm font-bold" style={{ background: t.accent, color: t.onAccent }}>Seguir comprando</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {carrito.map((item: any) => {
                    const id = item.cartId || item.id;
                    const qty = Number(item.cantidad || 1);
                    const price = Number(item.precioUnitario || 0);
                    return (
                      <div key={id} className="relative grid grid-cols-[76px_1fr] gap-3 rounded-2xl border bg-white p-3" style={{ borderColor: t.line }}>
                        <button type="button" onClick={() => actualizarCantidad(id, 0)} className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-500"><Icon icon="solar:trash-bin-trash-bold" width={15} /></button>
                        <div className="flex h-[76px] items-center justify-center rounded-xl" style={{ background: t.soft }}>
                          {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-1.5" /> : <Icon icon="solar:pill-bold" width={30} style={{ color: t.primary }} />}
                        </div>
                        <div className="min-w-0 pr-7">
                          <h3 className="line-clamp-2 text-[13px] font-bold leading-snug" style={{ color: t.ink }}>{item.descripcion}</h3>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex h-9 items-center overflow-hidden rounded-lg border" style={{ borderColor: t.line }}>
                              <button type="button" onClick={() => actualizarCantidad(id, qty - 1)} className="flex w-8 items-center justify-center text-base font-bold text-gray-500 hover:bg-gray-50">−</button>
                              <input type="text" inputMode="numeric" aria-label="Cantidad" value={qty} onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); actualizarCantidad(id, d === '' ? 1 : parseInt(d, 10)); }} onFocus={(e) => e.currentTarget.select()} className="w-11 appearance-none border-x bg-transparent p-0 text-center text-[13px] font-bold outline-none focus:ring-0" style={{ borderColor: t.line, color: t.ink }} />
                              <button type="button" onClick={() => actualizarCantidad(id, qty + 1)} className="flex w-8 items-center justify-center text-base font-bold text-gray-500 hover:bg-gray-50">+</button>
                            </div>
                            <span className="text-[15px] font-black" style={{ color: t.ink }}>{fmMoney(price * qty)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {carrito?.length > 0 && (
              <footer className="border-t bg-white px-6 py-5" style={{ borderColor: t.line }}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-500">Subtotal</span>
                  <span className="text-2xl font-black" style={{ color: t.ink }}>{fmMoney(total)}</span>
                </div>
                <p className="mb-4 rounded-lg px-3 py-2 text-[11.5px] font-semibold text-gray-500" style={{ background: t.soft }}>El costo de envío se calcula en el checkout según tu ubicación.</p>
                <button type="button" onClick={() => { onClose(); onCheckout(); }} className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-black uppercase tracking-wide transition-transform hover:scale-[1.01]" style={{ background: t.accent, color: t.onAccent }}>
                  Ir a pagar <Icon icon="solar:arrow-right-bold" width={18} />
                </button>
                <button type="button" onClick={cotizar} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50" style={{ borderColor: t.line }}>
                  <Icon icon="ic:baseline-whatsapp" width={20} className="text-[#25D366]" /> Pedir por WhatsApp
                </button>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function formatPhone(raw: any) {
  const value = String(raw || '').trim();
  if (!value) return value;
  const digits = value.replace(/\D/g, '');
  let n = digits;
  if (digits.length === 11 && digits.startsWith('51')) n = digits.slice(2);
  else if (digits.length === 9) n = digits;
  else return value;
  return `+51 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
}
