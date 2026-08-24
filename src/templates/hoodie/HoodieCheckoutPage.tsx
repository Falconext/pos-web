import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateCheckoutPageProps } from '@/templates/shared/types';
import ConfirmOrderModal from '@/components/tienda/ConfirmOrderModal';
import PaymentConfirmationModal from '@/components/tienda/PaymentConfirmationModal';
import { HD, HdFooter, HdHeader, HdProductImage, HdWhatsAppFab, hdFont, hdPrimary } from './HoodieParts';
import { hdCard, hdPage, hdSection, hdStagger, hdTap, hdViewport } from './motion';

function money(value: number) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

function inputClass(hasError?: boolean) {
  return `mt-2 h-[52px] w-full rounded-xl border bg-white px-4 text-sm text-neutral-900 outline-none transition-colors ${
    hasError ? 'border-red-400' : 'border-neutral-200 focus:border-[var(--hd-cp)]'
  }`;
}

export default function HoodieCheckoutPage(props: TemplateCheckoutPageProps) {
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

  const primary = hdPrimary(cp);
  const font = hdFont(diseno);
  const cartCount = carritoState.reduce((sum, item) => sum + Number(item.cantidad || 1), 0);
  const canSubmit = !enviando && carritoState.length > 0;
  const deliveryType = formData.tipoEntrega || 'delivery';
  const ocultarEnvio = Boolean(diseno?.hoodieOcultarEnvio);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={hdPage}
      className="min-h-screen"
      style={{ backgroundColor: HD.cream, fontFamily: font, ['--hd-cp' as any]: HD.ink }}
    >
      <HdHeader
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

      <section className="relative overflow-hidden border-b" style={{ borderColor: HD.line, background: `linear-gradient(120% 120% at 80% 0%, ${HD.sand}, ${HD.cream} 62%)` }}>
        <div className="mx-auto max-w-[1240px] px-6 py-12 text-center md:py-14">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            <a href={`/tienda/${slug}`} className="hover:text-neutral-900">Inicio</a>
            <span className="mx-2">/</span>
            <span className="text-neutral-700">Finalizar compra</span>
          </div>
          <h1 className="mt-3 text-4xl uppercase tracking-[-0.02em] md:text-6xl" style={{ fontFamily: HD.display, fontWeight: 900, color: HD.ink }}>Finaliza tu pedido</h1>
        </div>
      </section>

      <motion.main variants={hdSection} className="mx-auto max-w-[1240px] px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_430px]">
          <section className="space-y-8">
            {/* Paso 1 — datos */}
            <motion.div initial="hidden" whileInView="show" viewport={hdViewport} variants={hdCard} className="rounded-[22px] border p-6 md:p-8" style={{ backgroundColor: HD.panel, borderColor: HD.line }}>
              <div className="mb-7 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ backgroundColor: HD.ink }}>
                  <Icon icon="solar:user-rounded-linear" width={22} />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">Paso 1</p>
                  <h2 className="text-2xl uppercase tracking-[-0.01em]" style={{ fontFamily: HD.display, fontWeight: 900, color: HD.ink }}>Tus datos</h2>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-500">Nombre completo</span>
                  <input name="clienteNombre" value={formData.clienteNombre || ''} onChange={handleChange} className={inputClass(erroresForm.clienteNombre)} />
                  {erroresForm.clienteNombre && <p className="mt-2 text-xs font-medium text-red-500">{erroresForm.clienteNombre}</p>}
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-500">Celular</span>
                  <input name="clienteTelefono" value={formData.clienteTelefono || ''} onChange={handleChange} className={inputClass(erroresForm.clienteTelefono)} />
                  {erroresForm.clienteTelefono && <p className="mt-2 text-xs font-medium text-red-500">{erroresForm.clienteTelefono}</p>}
                </label>
                <label className="block md:col-span-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-500">Correo</span>
                  <input name="clienteEmail" type="email" value={formData.clienteEmail || ''} onChange={handleChange} className={inputClass(erroresForm.clienteEmail)} />
                  {erroresForm.clienteEmail && <p className="mt-2 text-xs font-medium text-red-500">{erroresForm.clienteEmail}</p>}
                </label>
              </div>
            </motion.div>

            {/* Paso 2 — entrega y pago */}
            <motion.div initial="hidden" whileInView="show" viewport={hdViewport} variants={hdCard} className="rounded-[22px] border p-6 md:p-8" style={{ backgroundColor: HD.panel, borderColor: HD.line }}>
              <div className="mb-7 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ backgroundColor: HD.charcoal }}>
                  <Icon icon="solar:delivery-linear" width={22} style={{ color: HD.nude }} />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">Paso 2</p>
                  <h2 className="text-2xl uppercase tracking-[-0.01em]" style={{ fontFamily: HD.display, fontWeight: 900, color: HD.ink }}>Entrega y pago</h2>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-500">Tipo de entrega</span>
                  <select name="tipoEntrega" value={deliveryType} onChange={handleChange} className={inputClass(erroresForm.tipoEntrega)}>
                    {configEnvio?.aceptaRecojo !== false && <option value="recojo">Recojo en tienda</option>}
                    {configEnvio?.aceptaEnvio !== false && <option value="delivery">Envío a domicilio</option>}
                  </select>
                  {erroresForm.tipoEntrega && <p className="mt-2 text-xs font-medium text-red-500">{erroresForm.tipoEntrega}</p>}
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-500">Medio de pago</span>
                  <select name="medioPago" value={formData.medioPago || 'efectivo'} onChange={handleChange} className={inputClass(erroresForm.medioPago)}>
                    {configPago?.aceptaEfectivo !== false && <option value="efectivo">Efectivo</option>}
                    {configPago?.aceptaYape !== false && <option value="yape">Yape</option>}
                    {configPago?.aceptaPlin !== false && <option value="plin">Plin</option>}
                    {configPago?.aceptaTarjeta && <option value="tarjeta">Tarjeta</option>}
                    {configPago?.aceptaMercadoPago && <option value="MERCADO_PAGO">Mercado Pago</option>}
                  </select>
                  {erroresForm.medioPago && <p className="mt-2 text-xs font-medium text-red-500">{erroresForm.medioPago}</p>}
                </label>
                <label className="block md:col-span-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-500">Dirección de entrega</span>
                  <input name="direccionEntrega" value={formData.direccionEntrega || ''} onChange={handleChange} className={inputClass(erroresForm.direccionEntrega)} />
                  {erroresForm.direccionEntrega && <p className="mt-2 text-xs font-medium text-red-500">{erroresForm.direccionEntrega}</p>}
                </label>
                <label className="block md:col-span-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-500">Nota del pedido (opcional)</span>
                  <textarea name="notaPedido" value={formData.notaPedido || ''} onChange={handleChange} rows={3} className="mt-2 w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-4 text-sm text-neutral-900 outline-none transition-colors focus:border-[var(--hd-cp)]" placeholder="¿Talla, color o referencia? Cuéntanos aquí..." />
                </label>
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="show" viewport={hdViewport} variants={hdStagger} className="grid gap-4 md:grid-cols-3">
              {[
                ['solar:medal-ribbon-star-linear', 'Calidad premium', 'Telas seleccionadas a mano.'],
                ['solar:box-minimalistic-linear', 'Envío cuidado', 'Empaque protegido sin costo.'],
                ['solar:chat-round-dots-linear', 'Asesoría', 'Te acompañamos por WhatsApp.'],
              ].map(([icon, title, text]) => (
                <motion.div key={title} variants={hdCard} className="rounded-[22px] border p-6" style={{ backgroundColor: HD.panel, borderColor: HD.line }}>
                  <Icon icon={icon} width={26} style={{ color: HD.ink }} />
                  <p className="mt-4 text-sm font-bold" style={{ color: HD.ink }}>{title}</p>
                  <p className="mt-1.5 text-xs leading-5 text-neutral-500">{text}</p>
                </motion.div>
              ))}
            </motion.div>

            {suggestedProducts.length > 0 && (
              <motion.div initial="hidden" whileInView="show" viewport={hdViewport} variants={hdSection} className="rounded-[22px] border p-6 md:p-8" style={{ backgroundColor: HD.panel, borderColor: HD.line }}>
                <div className="mb-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: HD.taupe }}>Completa tu look</p>
                    <h2 className="text-2xl uppercase tracking-[-0.01em]" style={{ fontFamily: HD.display, fontWeight: 900, color: HD.ink }}>También te encantará</h2>
                  </div>
                  <a href={`/tienda/${slug}/catalogo`} className="text-xs font-bold uppercase tracking-[0.12em] hover:opacity-70" style={{ color: HD.ink }}>Ver todo</a>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestedProducts.slice(0, 3).map((producto) => (
                    <button
                      key={producto.id}
                      type="button"
                      onClick={() => onAddToCart(producto)}
                      className="group flex items-center gap-3 rounded-2xl border bg-white p-3 text-left transition-colors hover:border-neutral-900/25"
                      style={{ borderColor: HD.line }}
                    >
                      <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl" style={{ backgroundColor: HD.sand }}>
                        <HdProductImage producto={producto} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-sm font-medium" style={{ color: HD.ink }}>{producto.descripcion}</span>
                        <span className="mt-1 block text-sm font-bold" style={{ color: HD.ink }}>{money(producto.precioUnitario)}</span>
                      </span>
                      <Icon icon="solar:add-circle-linear" width={22} className="text-neutral-400 transition-colors group-hover:text-neutral-900" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </section>

          {/* Resumen */}
          <motion.aside initial="hidden" animate="show" variants={hdCard} className="h-fit overflow-hidden rounded-[22px] border shadow-[0_30px_60px_-42px_rgba(21,18,14,0.5)] lg:sticky lg:top-28" style={{ backgroundColor: HD.panel, borderColor: HD.line }}>
            <div className="border-b p-6" style={{ borderColor: HD.line }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">Tu pedido</p>
              <h2 className="mt-1 text-2xl uppercase tracking-[-0.01em]" style={{ fontFamily: HD.display, fontWeight: 900, color: HD.ink }}>Resumen</h2>
            </div>

            <div className="max-h-[440px] overflow-y-auto px-6">
              {carritoState.length === 0 ? (
                <div className="my-6 rounded-2xl bg-white p-8 text-center">
                  <Icon icon="solar:bag-cross-linear" className="mx-auto text-4xl text-neutral-300" />
                  <p className="mt-3 text-sm font-medium text-neutral-500">Tu carrito está vacío.</p>
                  <a href={`/tienda/${slug}/catalogo`} className="mt-5 inline-flex rounded-full px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white" style={{ backgroundColor: HD.ink }}>Ver tienda</a>
                </div>
              ) : (
                carritoState.map((item) => {
                  const itemId = item.cartId || item.id;
                  const qty = Number(item.cantidad || 1);
                  const price = Number(item.precioUnitario || item.precio || 0);
                  return (
                    <div key={itemId} className="flex gap-4 border-b py-5" style={{ borderColor: HD.line }}>
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl" style={{ backgroundColor: HD.sand }}>
                        <HdProductImage producto={item} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium leading-5" style={{ color: HD.ink }}>{item.descripcion}</p>
                        <p className="mt-1 text-sm font-bold" style={{ color: HD.ink }}>{money(price * qty)}</p>
                        <div className="mt-2.5 flex items-center justify-between gap-3">
                          <div className="flex h-9 items-center rounded-full bg-white ring-1" style={{ ['--tw-ring-color' as any]: HD.line }}>
                            <button type="button" onClick={() => updateQuantity(itemId, qty - 1)} className="h-9 w-9 text-sm font-bold text-neutral-600">-</button>
                            <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                            <button type="button" onClick={() => updateQuantity(itemId, qty + 1)} className="h-9 w-9 text-sm font-bold text-neutral-600">+</button>
                          </div>
                          <button type="button" onClick={() => removeItem(itemId)} className="flex h-9 w-9 items-center justify-center rounded-full text-red-500 hover:bg-red-50">
                            <Icon icon="solar:trash-bin-trash-linear" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {!ocultarEnvio && freeDeliveryRemaining > 0 && carritoState.length > 0 && (
              <div className="mx-6 mt-5 rounded-xl p-4 text-xs font-medium leading-5" style={{ backgroundColor: HD.sand, color: HD.ink }}>
                Te faltan {money(freeDeliveryRemaining)} para el envío gratis.
              </div>
            )}

            <div className="p-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-neutral-500"><span>Subtotal</span><span className="font-medium" style={{ color: HD.ink }}>{money(calcularSubtotal())}</span></div>
                {!ocultarEnvio && <div className="flex justify-between text-neutral-500"><span>Envío</span><span className="font-medium" style={{ color: HD.ink }}>{money(calcularCostoEnvio())}</span></div>}
                <div className="flex items-baseline justify-between border-t pt-4" style={{ borderColor: HD.line }}>
                  <span className="text-sm font-bold uppercase tracking-[0.1em] text-neutral-500">Total</span>
                  <span className="text-3xl font-bold" style={{ fontFamily: HD.display, color: HD.ink }}>{money(ocultarEnvio ? calcularSubtotal() : calcularTotal())}</span>
                </div>
              </div>

              <motion.button
                type="button"
                disabled={!canSubmit}
                onClick={onSubmit}
                className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full text-xs font-bold uppercase tracking-[0.16em] text-white shadow-lg transition-transform disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: HD.ink }}
                whileHover={canSubmit ? { scale: 1.02, y: -2 } : undefined}
                whileTap={canSubmit ? hdTap : undefined}
              >
                {enviando ? 'Enviando pedido...' : 'Confirmar pedido'}
                <Icon icon="solar:arrow-right-linear" />
              </motion.button>

              <div className="mt-5 grid grid-cols-2 gap-2 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-500">
                <span className="rounded-full bg-white px-2 py-3">Pago seguro</span>
                <span className="rounded-full bg-white px-2 py-3">Datos protegidos</span>
              </div>
            </div>
          </motion.aside>
        </div>
      </motion.main>

      <HdFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={[]} />
      <HdWhatsAppFab tienda={tienda} />

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
        tiendaColor={HD.ink}
      />
    </motion.div>
  );
}
