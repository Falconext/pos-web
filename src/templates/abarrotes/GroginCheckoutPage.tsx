import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateCheckoutPageProps } from '@/templates/shared/types';
import ConfirmOrderModal from '@/components/tienda/ConfirmOrderModal';
import PaymentConfirmationModal from '@/components/tienda/PaymentConfirmationModal';
import { GRO, GroFooter, GroHeader, GroProductImage, GroWhatsAppFab, groFont, groPrimary } from './GroginParts';
import { groCard, groPage, groSection, groStagger, groTap, groViewport } from './motion';

function money(value: number) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

function inputClass(hasError?: boolean) {
  return `mt-2 h-[50px] w-full rounded-xl border bg-white px-4 text-sm text-neutral-900 outline-none transition-colors ${
    hasError ? 'border-red-400' : 'border-neutral-200 focus:border-[var(--gro-cp)]'
  }`;
}

export default function GroginCheckoutPage(props: TemplateCheckoutPageProps) {
  const {
    slug, tienda, diseno, cp,
    carritoState, updateQuantity, removeItem,
    formData, erroresForm, handleChange,
    configPago, configEnvio, enviando,
    suggestedProducts, search, setSearch,
    calcularSubtotal, calcularCostoEnvio, calcularTotal,
    onSubmit, onAddToCart, freeDeliveryRemaining,
    showConfirmModal, setShowConfirmModal,
    showPaymentModal, setShowPaymentModal,
    pedidoCreado, enviarPedido,
  } = props;

  const primary = groPrimary(cp);
  const font = groFont(diseno);
  const cartCount = carritoState.reduce((sum, item) => sum + Number(item.cantidad || 1), 0);
  const canSubmit = !enviando && carritoState.length > 0;
  const deliveryType = formData.tipoEntrega || 'delivery';
  const ocultarEnvio = Boolean(diseno?.abarrotesOcultarEnvio);

  return (
    <motion.div initial="hidden" animate="show" variants={groPage} className="min-h-screen" style={{ backgroundColor: GRO.soft, fontFamily: font, ['--gro-cp' as any]: primary }}>
      <GroHeader
        tienda={tienda}
        slug={slug}
        cp={primary}
        diseno={diseno}
        carritoSize={cartCount}
        onOpenCart={() => (window.location.href = `/tienda/${slug}/catalogo`)}
        searchQuery={search}
        setSearchQuery={setSearch}
        allCategories={[]}
        onSearchSubmit={(event, value) => { event.preventDefault(); if (value?.trim()) window.location.href = `/tienda/${slug}/catalogo?search=${encodeURIComponent(value.trim())}`; }}
      />

      <div className="border-b bg-white" style={{ borderColor: GRO.line }}>
        <div className="mx-auto max-w-7xl px-5 py-5 md:px-6">
          <div className="text-xs font-medium" style={{ color: GRO.inkSoft }}>
            <a href={`/tienda/${slug}`} className="hover:text-neutral-900">Inicio</a>
            <span className="mx-2">/</span>
            <span style={{ color: GRO.ink }}>Finalizar compra</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold md:text-3xl" style={{ fontFamily: GRO.display, color: GRO.ink }}>Finaliza tu pedido</h1>
        </div>
      </div>

      <motion.main variants={groSection} className="mx-auto max-w-7xl px-5 py-8 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <section className="space-y-6">
            <motion.div initial="hidden" whileInView="show" viewport={groViewport} variants={groCard} className="rounded-2xl border bg-white p-6 md:p-7" style={{ borderColor: GRO.line }}>
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ backgroundColor: primary }}><Icon icon="solar:user-rounded-linear" width={21} /></span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: GRO.inkSoft }}>Paso 1</p>
                  <h2 className="text-xl font-bold" style={{ fontFamily: GRO.display, color: GRO.ink }}>Tus datos</h2>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: GRO.inkSoft }}>Nombre completo</span>
                  <input name="clienteNombre" value={formData.clienteNombre || ''} onChange={handleChange} className={inputClass(erroresForm.clienteNombre)} />
                  {erroresForm.clienteNombre && <p className="mt-1.5 text-xs font-medium text-red-500">{erroresForm.clienteNombre}</p>}
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: GRO.inkSoft }}>Celular</span>
                  <input name="clienteTelefono" value={formData.clienteTelefono || ''} onChange={handleChange} className={inputClass(erroresForm.clienteTelefono)} />
                  {erroresForm.clienteTelefono && <p className="mt-1.5 text-xs font-medium text-red-500">{erroresForm.clienteTelefono}</p>}
                </label>
                <label className="block md:col-span-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: GRO.inkSoft }}>Correo</span>
                  <input name="clienteEmail" type="email" value={formData.clienteEmail || ''} onChange={handleChange} className={inputClass(erroresForm.clienteEmail)} />
                  {erroresForm.clienteEmail && <p className="mt-1.5 text-xs font-medium text-red-500">{erroresForm.clienteEmail}</p>}
                </label>
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="show" viewport={groViewport} variants={groCard} className="rounded-2xl border bg-white p-6 md:p-7" style={{ borderColor: GRO.line }}>
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ backgroundColor: GRO.ink }}><Icon icon="solar:delivery-linear" width={21} /></span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: GRO.inkSoft }}>Paso 2</p>
                  <h2 className="text-xl font-bold" style={{ fontFamily: GRO.display, color: GRO.ink }}>Entrega y pago</h2>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: GRO.inkSoft }}>Tipo de entrega</span>
                  <select name="tipoEntrega" value={deliveryType} onChange={handleChange} className={inputClass(erroresForm.tipoEntrega)}>
                    {configEnvio?.aceptaRecojo !== false && <option value="recojo">Recojo en tienda</option>}
                    {configEnvio?.aceptaEnvio !== false && <option value="delivery">Envío a domicilio</option>}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: GRO.inkSoft }}>Medio de pago</span>
                  <select name="medioPago" value={formData.medioPago || 'efectivo'} onChange={handleChange} className={inputClass(erroresForm.medioPago)}>
                    {configPago?.aceptaEfectivo !== false && <option value="efectivo">Efectivo</option>}
                    {configPago?.aceptaYape !== false && <option value="yape">Yape</option>}
                    {configPago?.aceptaPlin !== false && <option value="plin">Plin</option>}
                    {configPago?.aceptaTarjeta && <option value="tarjeta">Tarjeta</option>}
                  </select>
                </label>
                <label className="block md:col-span-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: GRO.inkSoft }}>Dirección de entrega</span>
                  <input name="direccionEntrega" value={formData.direccionEntrega || ''} onChange={handleChange} className={inputClass(erroresForm.direccionEntrega)} />
                  {erroresForm.direccionEntrega && <p className="mt-1.5 text-xs font-medium text-red-500">{erroresForm.direccionEntrega}</p>}
                </label>
                <label className="block md:col-span-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: GRO.inkSoft }}>Nota del pedido (opcional)</span>
                  <textarea name="notaPedido" value={formData.notaPedido || ''} onChange={handleChange} rows={3} className="mt-2 w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-sm text-neutral-900 outline-none transition-colors focus:border-[var(--gro-cp)]" placeholder="Referencias de entrega, horario preferido..." />
                </label>
              </div>
            </motion.div>

            {suggestedProducts.length > 0 && (
              <motion.div initial="hidden" whileInView="show" viewport={groViewport} variants={groStagger} className="rounded-2xl border bg-white p-6 md:p-7" style={{ borderColor: GRO.line }}>
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold" style={{ color: GRO.green }}>No olvides</p>
                    <h2 className="text-xl font-bold" style={{ fontFamily: GRO.display, color: GRO.ink }}>También te puede faltar</h2>
                  </div>
                  <a href={`/tienda/${slug}/catalogo`} className="text-xs font-bold" style={{ color: GRO.green }}>Ver todo</a>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestedProducts.slice(0, 3).map((producto) => (
                    <button key={producto.id} type="button" onClick={() => onAddToCart(producto)} className="group flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors hover:border-[var(--gro-cp)]" style={{ borderColor: GRO.line }}>
                      <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl p-1.5" style={{ backgroundColor: GRO.soft2 }}><GroProductImage producto={producto} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-sm font-semibold" style={{ color: GRO.ink }}>{producto.descripcion}</span>
                        <span className="mt-0.5 block text-sm font-extrabold" style={{ color: GRO.green }}>{money(producto.precioUnitario)}</span>
                      </span>
                      <Icon icon="solar:add-circle-linear" width={22} className="text-neutral-400 transition-colors group-hover:text-[var(--gro-cp)]" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </section>

          <motion.aside initial="hidden" animate="show" variants={groCard} className="h-fit overflow-hidden rounded-2xl border bg-white shadow-[0_24px_50px_-38px_rgba(37,61,78,0.5)] lg:sticky lg:top-24" style={{ borderColor: GRO.line }}>
            <div className="border-b p-6" style={{ borderColor: GRO.line }}>
              <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: GRO.inkSoft }}>Tu pedido</p>
              <h2 className="mt-0.5 text-xl font-bold" style={{ fontFamily: GRO.display, color: GRO.ink }}>Resumen</h2>
            </div>

            <div className="max-h-[420px] overflow-y-auto px-6">
              {carritoState.length === 0 ? (
                <div className="my-6 rounded-2xl bg-neutral-50 p-8 text-center">
                  <Icon icon="solar:cart-cross-linear" className="mx-auto text-4xl text-neutral-300" />
                  <p className="mt-3 text-sm font-medium text-neutral-500">Tu carrito está vacío.</p>
                  <a href={`/tienda/${slug}/catalogo`} className="mt-4 inline-flex rounded-full px-5 py-2.5 text-[12px] font-bold text-white" style={{ backgroundColor: primary }}>Ver productos</a>
                </div>
              ) : (
                carritoState.map((item) => {
                  const itemId = item.cartId || item.id;
                  const qty = Number(item.cantidad || 1);
                  const price = Number(item.precioUnitario || item.precio || 0);
                  return (
                    <div key={itemId} className="flex gap-4 border-b py-5" style={{ borderColor: GRO.line }}>
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl p-1.5" style={{ backgroundColor: GRO.soft2 }}><GroProductImage producto={item} /></div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold leading-5" style={{ color: GRO.ink }}>{item.descripcion}</p>
                        <p className="mt-1 text-sm font-extrabold" style={{ color: GRO.green }}>{money(price * qty)}</p>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <div className="flex h-8 items-center rounded-full bg-neutral-100">
                            <button type="button" onClick={() => updateQuantity(itemId, qty - 1)} className="h-8 w-8 text-sm font-bold text-neutral-600">-</button>
                            <span className="w-7 text-center text-sm font-bold">{qty}</span>
                            <button type="button" onClick={() => updateQuantity(itemId, qty + 1)} className="h-8 w-8 text-sm font-bold" style={{ color: GRO.green }}>+</button>
                          </div>
                          <button type="button" onClick={() => removeItem(itemId)} className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 hover:bg-red-50"><Icon icon="solar:trash-bin-trash-linear" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {!ocultarEnvio && freeDeliveryRemaining > 0 && carritoState.length > 0 && (
              <div className="mx-6 mt-4 rounded-xl p-3.5 text-xs font-semibold leading-5" style={{ backgroundColor: GRO.greenSoft, color: GRO.greenDark }}>
                Te faltan {money(freeDeliveryRemaining)} para el envío gratis.
              </div>
            )}

            <div className="p-6">
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between" style={{ color: GRO.inkSoft }}><span>Subtotal</span><span className="font-semibold" style={{ color: GRO.ink }}>{money(calcularSubtotal())}</span></div>
                {!ocultarEnvio && <div className="flex justify-between" style={{ color: GRO.inkSoft }}><span>Envío</span><span className="font-semibold" style={{ color: GRO.ink }}>{money(calcularCostoEnvio())}</span></div>}
                <div className="flex items-baseline justify-between border-t pt-3.5" style={{ borderColor: GRO.line }}>
                  <span className="text-sm font-bold uppercase tracking-wide" style={{ color: GRO.inkSoft }}>Total</span>
                  <span className="text-2xl font-extrabold" style={{ fontFamily: GRO.display, color: GRO.green }}>{money(ocultarEnvio ? calcularSubtotal() : calcularTotal())}</span>
                </div>
              </div>
              <motion.button type="button" disabled={!canSubmit} onClick={onSubmit} className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-bold text-white shadow-lg transition-transform disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: primary }} whileHover={canSubmit ? { scale: 1.02, y: -2 } : undefined} whileTap={canSubmit ? groTap : undefined}>
                {enviando ? 'Enviando pedido...' : 'Confirmar pedido'} <Icon icon="solar:arrow-right-linear" />
              </motion.button>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center text-[10px] font-bold uppercase tracking-wide" style={{ color: GRO.inkSoft }}>
                <span className="rounded-full bg-neutral-100 px-2 py-2.5">Pago seguro</span>
                <span className="rounded-full bg-neutral-100 px-2 py-2.5">Datos protegidos</span>
              </div>
            </div>
          </motion.aside>
        </div>
      </motion.main>

      <GroFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={[]} />
      <GroWhatsAppFab tienda={tienda} />

      {pedidoCreado && (
        <PaymentConfirmationModal
          isOpen={showPaymentModal}
          onClose={() => { setShowPaymentModal(false); window.location.href = `/tienda/${slug}/seguimiento?codigo=${pedidoCreado.codigoSeguimiento}`; }}
          orderData={{ id: pedidoCreado.id, codigoSeguimiento: pedidoCreado.codigoSeguimiento, total: pedidoCreado.total || calcularTotal(), medioPago: formData.medioPago, tipoEntrega: formData.tipoEntrega, clienteNombre: formData.clienteNombre }}
          paymentConfig={configPago}
          storeSlug={slug}
        />
      )}
      <ConfirmOrderModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={enviarPedido} total={calcularTotal()} loading={enviando} tiendaColor={primary} />
    </motion.div>
  );
}
