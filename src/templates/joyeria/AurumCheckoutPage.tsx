import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateCheckoutPageProps } from '@/templates/shared/types';
import ConfirmOrderModal from '@/components/tienda/ConfirmOrderModal';
import PaymentConfirmationModal from '@/components/tienda/PaymentConfirmationModal';
import { AUR, AurFooter, AurHeader, AurProductImage, AurWhatsAppFab, aurFont, aurPrimary } from './AurumParts';
import { aurCard, aurPage, aurSection, aurStagger, aurTap, aurViewport } from './motion';

function money(value: number) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

function inputClass(hasError?: boolean) {
  return `mt-2 h-[52px] w-full rounded-xl border bg-white px-4 text-sm text-neutral-900 outline-none transition-colors ${
    hasError ? 'border-red-400' : 'border-neutral-200 focus:border-[var(--aur-cp)]'
  }`;
}

export default function AurumCheckoutPage(props: TemplateCheckoutPageProps) {
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

  const primary = aurPrimary(cp);
  const font = aurFont(diseno);
  const cartCount = carritoState.reduce((sum, item) => sum + Number(item.cantidad || 1), 0);
  const canSubmit = !enviando && carritoState.length > 0;
  const deliveryType = formData.tipoEntrega || 'delivery';
  const ocultarEnvio = Boolean(diseno?.joyeriaOcultarEnvio);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={aurPage}
      className="min-h-screen"
      style={{ backgroundColor: AUR.cream, fontFamily: font, ['--aur-cp' as any]: AUR.ink }}
    >
      <AurHeader
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

      <section className="relative overflow-hidden border-b" style={{ borderColor: AUR.line, background: `linear-gradient(120% 120% at 80% 0%, ${AUR.nude}, ${AUR.cream} 60%)` }}>
        <div className="mx-auto max-w-7xl px-6 py-12 text-center md:py-14">
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
            <a href={`/tienda/${slug}`} className="hover:text-neutral-900">Inicio</a>
            <span className="mx-2">/</span>
            <span className="text-neutral-700">Finalizar compra</span>
          </div>
          <h1 className="mt-3 text-5xl font-bold lowercase tracking-tight md:text-6xl" style={{ fontFamily: AUR.serif, color: AUR.ink }}>finaliza tu pedido</h1>
        </div>
      </section>

      <motion.main variants={aurSection} className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_430px]">
          <section className="space-y-8">
            {/* Paso 1 — datos */}
            <motion.div initial="hidden" whileInView="show" viewport={aurViewport} variants={aurCard} className="rounded-2xl border bg-white p-6 md:p-8" style={{ borderColor: AUR.line }}>
              <div className="mb-7 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ backgroundColor: AUR.ink }}>
                  <Icon icon="solar:user-rounded-linear" width={22} />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Paso 1</p>
                  <h2 className="text-3xl" style={{ fontFamily: AUR.serif, color: AUR.ink }}>Tus datos</h2>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Nombre completo</span>
                  <input name="clienteNombre" value={formData.clienteNombre || ''} onChange={handleChange} className={inputClass(erroresForm.clienteNombre)} />
                  {erroresForm.clienteNombre && <p className="mt-2 text-xs font-medium text-red-500">{erroresForm.clienteNombre}</p>}
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Celular</span>
                  <input name="clienteTelefono" value={formData.clienteTelefono || ''} onChange={handleChange} className={inputClass(erroresForm.clienteTelefono)} />
                  {erroresForm.clienteTelefono && <p className="mt-2 text-xs font-medium text-red-500">{erroresForm.clienteTelefono}</p>}
                </label>
                <label className="block md:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Correo</span>
                  <input name="clienteEmail" type="email" value={formData.clienteEmail || ''} onChange={handleChange} className={inputClass(erroresForm.clienteEmail)} />
                  {erroresForm.clienteEmail && <p className="mt-2 text-xs font-medium text-red-500">{erroresForm.clienteEmail}</p>}
                </label>
              </div>
            </motion.div>

            {/* Paso 2 — entrega y pago */}
            <motion.div initial="hidden" whileInView="show" viewport={aurViewport} variants={aurCard} className="rounded-2xl border bg-white p-6 md:p-8" style={{ borderColor: AUR.line }}>
              <div className="mb-7 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ backgroundColor: AUR.charcoal }}>
                  <Icon icon="solar:delivery-linear" width={22} style={{ color: AUR.goldSoft }} />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Paso 2</p>
                  <h2 className="text-3xl" style={{ fontFamily: AUR.serif, color: AUR.ink }}>Entrega y pago</h2>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Tipo de entrega</span>
                  <select name="tipoEntrega" value={deliveryType} onChange={handleChange} className={inputClass(erroresForm.tipoEntrega)}>
                    {configEnvio?.aceptaRecojo !== false && <option value="recojo">Recojo en tienda</option>}
                    {configEnvio?.aceptaEnvio !== false && <option value="delivery">Envío a domicilio</option>}
                  </select>
                  {erroresForm.tipoEntrega && <p className="mt-2 text-xs font-medium text-red-500">{erroresForm.tipoEntrega}</p>}
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Medio de pago</span>
                  <select name="medioPago" value={formData.medioPago || 'efectivo'} onChange={handleChange} className={inputClass(erroresForm.medioPago)}>
                    {configPago?.aceptaEfectivo !== false && <option value="efectivo">Efectivo</option>}
                    {configPago?.aceptaYape !== false && <option value="yape">Yape</option>}
                    {configPago?.aceptaPlin !== false && <option value="plin">Plin</option>}
                    {configPago?.aceptaTarjeta && <option value="tarjeta">Tarjeta</option>}
                  </select>
                  {erroresForm.medioPago && <p className="mt-2 text-xs font-medium text-red-500">{erroresForm.medioPago}</p>}
                </label>
                <label className="block md:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Dirección de entrega</span>
                  <input name="direccionEntrega" value={formData.direccionEntrega || ''} onChange={handleChange} className={inputClass(erroresForm.direccionEntrega)} />
                  {erroresForm.direccionEntrega && <p className="mt-2 text-xs font-medium text-red-500">{erroresForm.direccionEntrega}</p>}
                </label>
                <label className="block md:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Nota del pedido (opcional)</span>
                  <textarea name="notaPedido" value={formData.notaPedido || ''} onChange={handleChange} rows={3} className="mt-2 w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-4 text-sm text-neutral-900 outline-none transition-colors focus:border-[var(--aur-cp)]" placeholder="¿Es un regalo? Indícanos el grabado o una dedicatoria..." />
                </label>
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="show" viewport={aurViewport} variants={aurStagger} className="grid gap-4 md:grid-cols-3">
              {[
                ['solar:diamond-linear', 'Autenticidad', 'Certificado en cada pieza.'],
                ['solar:gift-linear', 'Listo para regalar', 'Estuche premium sin costo.'],
                ['solar:chat-round-dots-linear', 'Asesoría', 'Te acompañamos por WhatsApp.'],
              ].map(([icon, title, text]) => (
                <motion.div key={title} variants={aurCard} className="rounded-2xl border bg-white p-6" style={{ borderColor: AUR.line }}>
                  <Icon icon={icon} width={26} style={{ color: AUR.ink }} />
                  <p className="mt-4 text-sm font-semibold" style={{ color: AUR.ink }}>{title}</p>
                  <p className="mt-1.5 text-xs leading-5 text-neutral-500">{text}</p>
                </motion.div>
              ))}
            </motion.div>

            {suggestedProducts.length > 0 && (
              <motion.div initial="hidden" whileInView="show" viewport={aurViewport} variants={aurSection} className="rounded-2xl border bg-white p-6 md:p-8" style={{ borderColor: AUR.line }}>
                <div className="mb-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: AUR.gold }}>Completa tu joyero</p>
                    <h2 className="text-3xl" style={{ fontFamily: AUR.serif, color: AUR.ink }}>También te encantará</h2>
                  </div>
                  <a href={`/tienda/${slug}/catalogo`} className="text-xs font-semibold uppercase tracking-[0.14em] hover:opacity-70" style={{ color: AUR.ink }}>Ver todo</a>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestedProducts.slice(0, 3).map((producto) => (
                    <button
                      key={producto.id}
                      type="button"
                      onClick={() => onAddToCart(producto)}
                      className="group flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors hover:border-neutral-900/25"
                      style={{ borderColor: AUR.line }}
                    >
                      <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl" style={{ backgroundColor: AUR.mist }}>
                        <AurProductImage producto={producto} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-sm font-medium" style={{ color: AUR.ink }}>{producto.descripcion}</span>
                        <span className="mt-1 block text-sm font-semibold" style={{ color: AUR.ink }}>{money(producto.precioUnitario)}</span>
                      </span>
                      <Icon icon="solar:add-circle-linear" width={22} className="text-neutral-400 transition-colors group-hover:text-neutral-900" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </section>

          {/* Resumen */}
          <motion.aside initial="hidden" animate="show" variants={aurCard} className="h-fit overflow-hidden rounded-2xl border bg-white shadow-[0_30px_60px_-40px_rgba(27,23,18,0.5)] lg:sticky lg:top-28" style={{ borderColor: AUR.line }}>
            <div className="border-b p-6" style={{ borderColor: AUR.line }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Tu pedido</p>
              <h2 className="mt-1 text-3xl" style={{ fontFamily: AUR.serif, color: AUR.ink }}>Resumen</h2>
            </div>

            <div className="max-h-[440px] overflow-y-auto px-6">
              {carritoState.length === 0 ? (
                <div className="my-6 rounded-2xl bg-neutral-50 p-8 text-center">
                  <Icon icon="solar:bag-cross-linear" className="mx-auto text-4xl text-neutral-300" />
                  <p className="mt-3 text-sm font-medium text-neutral-500">Tu carrito está vacío.</p>
                  <a href={`/tienda/${slug}/catalogo`} className="mt-5 inline-flex rounded-full px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white" style={{ backgroundColor: AUR.ink }}>Ver colección</a>
                </div>
              ) : (
                carritoState.map((item) => {
                  const itemId = item.cartId || item.id;
                  const qty = Number(item.cantidad || 1);
                  const price = Number(item.precioUnitario || item.precio || 0);
                  return (
                    <div key={itemId} className="flex gap-4 border-b py-5" style={{ borderColor: AUR.line }}>
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl" style={{ backgroundColor: AUR.mist }}>
                        <AurProductImage producto={item} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium leading-5" style={{ color: AUR.ink }}>{item.descripcion}</p>
                        <p className="mt-1 text-sm font-semibold" style={{ color: AUR.ink }}>{money(price * qty)}</p>
                        <div className="mt-2.5 flex items-center justify-between gap-3">
                          <div className="flex h-9 items-center rounded-full bg-neutral-100">
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
              <div className="mx-6 mt-5 rounded-xl p-4 text-xs font-medium leading-5" style={{ backgroundColor: AUR.mist, color: AUR.ink }}>
                Te faltan {money(freeDeliveryRemaining)} para el envío gratis.
              </div>
            )}

            <div className="p-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-neutral-500"><span>Subtotal</span><span className="font-medium" style={{ color: AUR.ink }}>{money(calcularSubtotal())}</span></div>
                {!ocultarEnvio && <div className="flex justify-between text-neutral-500"><span>Envío</span><span className="font-medium" style={{ color: AUR.ink }}>{money(calcularCostoEnvio())}</span></div>}
                <div className="flex items-baseline justify-between border-t pt-4" style={{ borderColor: AUR.line }}>
                  <span className="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500">Total</span>
                  <span className="text-3xl font-semibold" style={{ fontFamily: AUR.serif, color: AUR.ink }}>{money(ocultarEnvio ? calcularSubtotal() : calcularTotal())}</span>
                </div>
              </div>

              <motion.button
                type="button"
                disabled={!canSubmit}
                onClick={onSubmit}
                className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full text-xs font-bold uppercase tracking-[0.12em] shadow-lg transition-transform disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: primary, color: AUR.ink }}
                whileHover={canSubmit ? { scale: 1.02, y: -2 } : undefined}
                whileTap={canSubmit ? aurTap : undefined}
              >
                {enviando ? 'Enviando pedido...' : 'Confirmar pedido'}
                <Icon icon="solar:arrow-right-linear" />
              </motion.button>

              <div className="mt-5 grid grid-cols-2 gap-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                <span className="rounded-full bg-neutral-100 px-2 py-3">Pago seguro</span>
                <span className="rounded-full bg-neutral-100 px-2 py-3">Datos protegidos</span>
              </div>
            </div>
          </motion.aside>
        </div>
      </motion.main>

      <AurFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={[]} />
      <AurWhatsAppFab tienda={tienda} />

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
        tiendaColor={AUR.ink}
      />
    </motion.div>
  );
}
