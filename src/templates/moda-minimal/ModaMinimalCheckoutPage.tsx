import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateCheckoutPageProps } from '@/templates/shared/types';
import ConfirmOrderModal from '@/components/tienda/ConfirmOrderModal';
import PaymentConfirmationModal from '@/components/tienda/PaymentConfirmationModal';
import { MIN, MinFooter, MinHeader, MinProductImage, MinWhatsAppFab, minFont, minPrimary } from './ModaMinimalParts';
import { minCard, minPage, minSection, minViewport } from './motion';

function money(value: number) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

function inputClass(hasError?: boolean) {
  return `mt-2 h-12 w-full border bg-white px-4 text-sm text-neutral-900 outline-none transition-colors ${
    hasError ? 'border-red-400' : 'border-neutral-300 focus:border-[var(--min-cp)]'
  }`;
}

export default function ModaMinimalCheckoutPage(props: TemplateCheckoutPageProps) {
  const {
    slug,
    tienda,
    diseno,
    cp,
    carritoState,
    updateQuantity,
    removeItem,
    formData,
    erroresForm,
    handleChange,
    configPago,
    configEnvio,
    enviando,
    suggestedProducts,
    search,
    setSearch,
    calcularSubtotal,
    calcularCostoEnvio,
    calcularTotal,
    onSubmit,
    onAddToCart,
    freeDeliveryRemaining,
    showConfirmModal,
    setShowConfirmModal,
    showPaymentModal,
    setShowPaymentModal,
    pedidoCreado,
    enviarPedido,
  } = props;

  const primary = minPrimary(cp);
  const font = minFont(diseno);
  const cartCount = carritoState.reduce((sum, item) => sum + Number(item.cantidad || 1), 0);
  const canSubmit = !enviando && carritoState.length > 0;
  const deliveryType = formData.tipoEntrega || 'delivery';
  const ocultarEnvio = Boolean(diseno?.modaMinimalOcultarEnvio);

  return (
    <motion.div initial="hidden" animate="show" variants={minPage} className="min-h-screen" style={{ backgroundColor: MIN.paper, fontFamily: font, ['--min-cp' as any]: MIN.ink }}>
      <MinHeader
        tienda={tienda}
        slug={slug}
        cp={primary}
        diseno={diseno}
        carritoSize={cartCount}
        onOpenCart={() => (window.location.href = `/tienda/${slug}/catalogo`)}
        searchQuery={search}
        setSearchQuery={setSearch}
        allCategories={[]}
        onSearchSubmit={(event, value) => {
          event.preventDefault();
          if (value?.trim()) window.location.href = `/tienda/${slug}/catalogo?search=${encodeURIComponent(value.trim())}`;
        }}
      />

      <section className="border-b" style={{ borderColor: MIN.line }}>
        <div className="mx-auto max-w-7xl px-6 py-10 md:px-8 md:py-12">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: MIN.muted }}>
            <a href={`/tienda/${slug}`} className="hover:text-black">Inicio</a>
            <span className="mx-2">/</span>
            <span style={{ color: MIN.soft }}>Finalizar compra</span>
          </div>
          <h1 className="mt-2 text-3xl font-medium tracking-tight md:text-4xl" style={{ color: MIN.ink }}>Finaliza tu pedido</h1>
        </div>
      </section>

      <motion.main variants={minSection} className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
          <section className="space-y-10">
            {/* Paso 1 */}
            <motion.div initial="hidden" whileInView="show" viewport={minViewport} variants={minCard}>
              <div className="mb-5 flex items-baseline gap-3">
                <span className="text-lg font-semibold" style={{ color: MIN.muted }}>01</span>
                <h2 className="text-lg font-medium uppercase tracking-[0.08em]" style={{ color: MIN.ink }}>Tus datos</h2>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MIN.soft }}>Nombre completo</span>
                  <input name="clienteNombre" value={formData.clienteNombre || ''} onChange={handleChange} className={inputClass(erroresForm.clienteNombre)} />
                  {erroresForm.clienteNombre && <p className="mt-2 text-xs font-medium text-red-500">{erroresForm.clienteNombre}</p>}
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MIN.soft }}>Celular</span>
                  <input name="clienteTelefono" value={formData.clienteTelefono || ''} onChange={handleChange} className={inputClass(erroresForm.clienteTelefono)} />
                  {erroresForm.clienteTelefono && <p className="mt-2 text-xs font-medium text-red-500">{erroresForm.clienteTelefono}</p>}
                </label>
                <label className="block md:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MIN.soft }}>Correo</span>
                  <input name="clienteEmail" type="email" value={formData.clienteEmail || ''} onChange={handleChange} className={inputClass(erroresForm.clienteEmail)} />
                  {erroresForm.clienteEmail && <p className="mt-2 text-xs font-medium text-red-500">{erroresForm.clienteEmail}</p>}
                </label>
              </div>
            </motion.div>

            {/* Paso 2 */}
            <motion.div initial="hidden" whileInView="show" viewport={minViewport} variants={minCard}>
              <div className="mb-5 flex items-baseline gap-3">
                <span className="text-lg font-semibold" style={{ color: MIN.muted }}>02</span>
                <h2 className="text-lg font-medium uppercase tracking-[0.08em]" style={{ color: MIN.ink }}>Entrega y pago</h2>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MIN.soft }}>Tipo de entrega</span>
                  <select name="tipoEntrega" value={deliveryType} onChange={handleChange} className={inputClass(erroresForm.tipoEntrega)}>
                    {configEnvio?.aceptaRecojo !== false && <option value="recojo">Recojo en tienda</option>}
                    {configEnvio?.aceptaEnvio !== false && <option value="delivery">Envío a domicilio</option>}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MIN.soft }}>Medio de pago</span>
                  <select name="medioPago" value={formData.medioPago || 'efectivo'} onChange={handleChange} className={inputClass(erroresForm.medioPago)}>
                    {configPago?.aceptaEfectivo !== false && <option value="efectivo">Efectivo</option>}
                    {configPago?.aceptaYape !== false && <option value="yape">Yape</option>}
                    {configPago?.aceptaPlin !== false && <option value="plin">Plin</option>}
                    {configPago?.aceptaTarjeta && <option value="tarjeta">Tarjeta</option>}
                  </select>
                </label>
                <label className="block md:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MIN.soft }}>Dirección de entrega</span>
                  <input name="direccionEntrega" value={formData.direccionEntrega || ''} onChange={handleChange} className={inputClass(erroresForm.direccionEntrega)} />
                  {erroresForm.direccionEntrega && <p className="mt-2 text-xs font-medium text-red-500">{erroresForm.direccionEntrega}</p>}
                </label>
                <label className="block md:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MIN.soft }}>Nota del pedido (opcional)</span>
                  <textarea name="notaPedido" value={formData.notaPedido || ''} onChange={handleChange} rows={3} className="mt-2 w-full resize-none border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition-colors focus:border-[var(--min-cp)]" placeholder="¿Talla, color o alguna referencia?" />
                </label>
              </div>
            </motion.div>

            {suggestedProducts.length > 0 && (
              <motion.div initial="hidden" whileInView="show" viewport={minViewport} variants={minSection} className="border-t pt-8" style={{ borderColor: MIN.line }}>
                <h2 className="mb-5 text-lg font-medium" style={{ color: MIN.ink }}>Completa tu look</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestedProducts.slice(0, 3).map((producto) => (
                    <button key={producto.id} type="button" onClick={() => onAddToCart(producto)} className="group flex items-center gap-3 border p-3 text-left transition-colors hover:border-black" style={{ borderColor: MIN.line }}>
                      <span className="h-16 w-14 shrink-0 overflow-hidden" style={{ backgroundColor: MIN.stone }}>
                        <MinProductImage producto={producto} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-sm font-medium" style={{ color: MIN.ink }}>{producto.descripcion}</span>
                        <span className="mt-1 block text-sm" style={{ color: MIN.ink }}>{money(producto.precioUnitario)}</span>
                      </span>
                      <Icon icon="solar:add-circle-linear" width={20} className="text-neutral-400 transition-colors group-hover:text-black" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </section>

          {/* Resumen */}
          <motion.aside initial="hidden" animate="show" variants={minCard} className="h-fit border lg:sticky lg:top-24" style={{ borderColor: MIN.line }}>
            <div className="border-b p-6" style={{ borderColor: MIN.line }}>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em]" style={{ color: MIN.ink }}>Resumen</h2>
            </div>

            <div className="max-h-[440px] overflow-y-auto px-6">
              {carritoState.length === 0 ? (
                <div className="my-8 text-center">
                  <Icon icon="solar:bag-cross-linear" className="mx-auto text-4xl text-neutral-300" />
                  <p className="mt-3 text-sm" style={{ color: MIN.soft }}>Tu carrito está vacío.</p>
                  <a href={`/tienda/${slug}/catalogo`} className="mt-5 inline-flex bg-black px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">Ver tienda</a>
                </div>
              ) : (
                carritoState.map((item) => {
                  const itemId = item.cartId || item.id;
                  const qty = Number(item.cantidad || 1);
                  const price = Number(item.precioUnitario || item.precio || 0);
                  return (
                    <div key={itemId} className="flex gap-4 border-b py-5" style={{ borderColor: MIN.line }}>
                      <div className="h-24 w-20 shrink-0 overflow-hidden" style={{ backgroundColor: MIN.stone }}>
                        <MinProductImage producto={item} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium leading-5" style={{ color: MIN.ink }}>{item.descripcion}</p>
                        <p className="mt-1 text-sm" style={{ color: MIN.ink }}>{money(price * qty)}</p>
                        <div className="mt-2.5 flex items-center justify-between gap-3">
                          <div className="flex h-8 items-center border" style={{ borderColor: MIN.line }}>
                            <button type="button" onClick={() => updateQuantity(itemId, qty - 1)} className="h-8 w-8 text-sm text-neutral-600">-</button>
                            <span className="w-8 text-center text-sm">{qty}</span>
                            <button type="button" onClick={() => updateQuantity(itemId, qty + 1)} className="h-8 w-8 text-sm text-neutral-600">+</button>
                          </div>
                          <button type="button" onClick={() => removeItem(itemId)} className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 underline hover:text-black">Quitar</button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {!ocultarEnvio && freeDeliveryRemaining > 0 && carritoState.length > 0 && (
              <div className="mx-6 mt-5 p-4 text-xs leading-5" style={{ backgroundColor: MIN.cream, color: MIN.ink }}>
                Te faltan {money(freeDeliveryRemaining)} para el envío gratis.
              </div>
            )}

            <div className="p-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between" style={{ color: MIN.soft }}><span>Subtotal</span><span style={{ color: MIN.ink }}>{money(calcularSubtotal())}</span></div>
                {!ocultarEnvio && <div className="flex justify-between" style={{ color: MIN.soft }}><span>Envío</span><span style={{ color: MIN.ink }}>{money(calcularCostoEnvio())}</span></div>}
                <div className="flex items-baseline justify-between border-t pt-4" style={{ borderColor: MIN.line }}>
                  <span className="text-sm font-semibold uppercase tracking-[0.12em]" style={{ color: MIN.soft }}>Total</span>
                  <span className="text-2xl font-semibold" style={{ color: MIN.ink }}>{money(ocultarEnvio ? calcularSubtotal() : calcularTotal())}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={!canSubmit}
                onClick={onSubmit}
                className="mt-6 flex h-13 w-full items-center justify-center py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: MIN.ink }}
              >
                {enviando ? 'Enviando pedido...' : 'Confirmar pedido'}
              </button>
              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.1em]" style={{ color: MIN.muted }}>
                <Icon icon="solar:lock-keyhole-minimalistic-linear" width={14} /> Pago seguro
              </div>
            </div>
          </motion.aside>
        </div>
      </motion.main>

      <MinFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={[]} />
      <MinWhatsAppFab tienda={tienda} />

      {pedidoCreado && (
        <PaymentConfirmationModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            window.location.href = `/tienda/${slug}/seguimiento?codigo=${pedidoCreado.codigoSeguimiento}`;
          }}
          orderData={{
            id: pedidoCreado.id,
            codigoSeguimiento: pedidoCreado.codigoSeguimiento,
            total: pedidoCreado.total || calcularTotal(),
            medioPago: formData.medioPago,
            tipoEntrega: formData.tipoEntrega,
            clienteNombre: formData.clienteNombre,
          }}
          paymentConfig={configPago}
          storeSlug={slug}
        />
      )}

      <ConfirmOrderModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={enviarPedido}
        total={calcularTotal()}
        loading={enviando}
        tiendaColor={MIN.ink}
      />
    </motion.div>
  );
}
