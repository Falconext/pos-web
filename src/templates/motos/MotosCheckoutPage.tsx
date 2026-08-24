import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateCheckoutPageProps } from '@/templates/shared/types';
import ConfirmOrderModal from '@/components/tienda/ConfirmOrderModal';
import PaymentConfirmationModal from '@/components/tienda/PaymentConfirmationModal';
import { MOTO, MotoFooter, MotoHeader, MotoProductImage, MotoWhatsAppFab, money, motoFont, motoPrimary } from './MotosParts';
import { motoCard, motoPage, motoSection, motoStagger, motoTap, motoViewport } from './motion';

function inputClass(hasError?: boolean) {
  return `mt-2 h-[52px] w-full rounded-lg border px-4 text-sm outline-none transition-colors ${
    hasError ? 'border-red-500' : 'focus:border-[var(--moto-cp)]'
  }`;
}

export default function MotosCheckoutPage(props: TemplateCheckoutPageProps) {
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

  const primary = motoPrimary(cp);
  const font = motoFont(diseno);
  const cartCount = carritoState.reduce((sum, item) => sum + Number(item.cantidad || 1), 0);
  const canSubmit = !enviando && carritoState.length > 0;
  const deliveryType = formData.tipoEntrega || 'delivery';
  const ocultarEnvio = Boolean(diseno?.motosOcultarEnvio);
  const inputStyle = { borderColor: MOTO.line, backgroundColor: MOTO.soft, color: MOTO.ink } as const;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={motoPage}
      className="min-h-screen"
      style={{ backgroundColor: MOTO.page, fontFamily: font, ['--moto-cp' as any]: primary }}
    >
      <MotoHeader
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

      <section className="relative overflow-hidden border-b" style={{ borderColor: MOTO.line, backgroundColor: MOTO.card }}>
        <div className="mx-auto max-w-7xl px-6 py-12 text-center md:py-14">
          <div className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: MOTO.faint }}>
            <a href={`/tienda/${slug}`} className="hover:text-neutral-900">Inicio</a>
            <span className="mx-2">/</span>
            <span style={{ color: MOTO.muted }}>Finalizar compra</span>
          </div>
          <h1 className="mt-3 text-4xl font-extrabold uppercase tracking-[0.02em] md:text-5xl" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>Finaliza tu pedido</h1>
        </div>
      </section>

      <motion.main variants={motoSection} className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_430px]">
          <section className="space-y-8">
            {/* Paso 1 — datos */}
            <motion.div initial="hidden" whileInView="show" viewport={motoViewport} variants={motoCard} className="rounded-2xl border p-6 md:p-8" style={{ backgroundColor: MOTO.card, borderColor: MOTO.line }}>
              <div className="mb-7 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg text-white" style={{ backgroundColor: primary }}>
                  <Icon icon="solar:user-rounded-linear" width={22} />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: MOTO.faint }}>Paso 1</p>
                  <h2 className="text-2xl font-bold uppercase" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>Tus datos</h2>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MOTO.muted }}>Nombre completo</span>
                  <input name="clienteNombre" value={formData.clienteNombre || ''} onChange={handleChange} className={inputClass(erroresForm.clienteNombre)} style={inputStyle} />
                  {erroresForm.clienteNombre && <p className="mt-2 text-xs font-medium text-red-500">{erroresForm.clienteNombre}</p>}
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MOTO.muted }}>Celular</span>
                  <input name="clienteTelefono" value={formData.clienteTelefono || ''} onChange={handleChange} className={inputClass(erroresForm.clienteTelefono)} style={inputStyle} />
                  {erroresForm.clienteTelefono && <p className="mt-2 text-xs font-medium text-red-500">{erroresForm.clienteTelefono}</p>}
                </label>
                <label className="block md:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MOTO.muted }}>Correo</span>
                  <input name="clienteEmail" type="email" value={formData.clienteEmail || ''} onChange={handleChange} className={inputClass(erroresForm.clienteEmail)} style={inputStyle} />
                  {erroresForm.clienteEmail && <p className="mt-2 text-xs font-medium text-red-500">{erroresForm.clienteEmail}</p>}
                </label>
              </div>
            </motion.div>

            {/* Paso 2 — entrega y pago */}
            <motion.div initial="hidden" whileInView="show" viewport={motoViewport} variants={motoCard} className="rounded-2xl border p-6 md:p-8" style={{ backgroundColor: MOTO.card, borderColor: MOTO.line }}>
              <div className="mb-7 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ backgroundColor: MOTO.soft, color: primary }}>
                  <Icon icon="solar:delivery-linear" width={22} />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: MOTO.faint }}>Paso 2</p>
                  <h2 className="text-2xl font-bold uppercase" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>Entrega y pago</h2>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MOTO.muted }}>Tipo de entrega</span>
                  <select name="tipoEntrega" value={deliveryType} onChange={handleChange} className={inputClass(erroresForm.tipoEntrega)} style={inputStyle}>
                    {configEnvio?.aceptaRecojo !== false && <option value="recojo">Recojo en tienda</option>}
                    {configEnvio?.aceptaEnvio !== false && <option value="delivery">Envío a domicilio</option>}
                  </select>
                  {erroresForm.tipoEntrega && <p className="mt-2 text-xs font-medium text-red-500">{erroresForm.tipoEntrega}</p>}
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MOTO.muted }}>Medio de pago</span>
                  <select name="medioPago" value={formData.medioPago || 'efectivo'} onChange={handleChange} className={inputClass(erroresForm.medioPago)} style={inputStyle}>
                    {configPago?.aceptaEfectivo !== false && <option value="efectivo">Efectivo</option>}
                    {configPago?.aceptaYape !== false && <option value="yape">Yape</option>}
                    {configPago?.aceptaPlin !== false && <option value="plin">Plin</option>}
                    {configPago?.aceptaTarjeta && <option value="tarjeta">Tarjeta</option>}
                    {configPago?.aceptaMercadoPago && <option value="MERCADO_PAGO">Mercado Pago</option>}
                  </select>
                  {erroresForm.medioPago && <p className="mt-2 text-xs font-medium text-red-500">{erroresForm.medioPago}</p>}
                </label>
                <label className="block md:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MOTO.muted }}>Dirección de entrega</span>
                  <input name="direccionEntrega" value={formData.direccionEntrega || ''} onChange={handleChange} className={inputClass(erroresForm.direccionEntrega)} style={inputStyle} />
                  {erroresForm.direccionEntrega && <p className="mt-2 text-xs font-medium text-red-500">{erroresForm.direccionEntrega}</p>}
                </label>
                <label className="block md:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MOTO.muted }}>Nota del pedido (opcional)</span>
                  <textarea name="notaPedido" value={formData.notaPedido || ''} onChange={handleChange} rows={3} className="mt-2 w-full resize-none rounded-lg border px-4 py-4 text-sm outline-none transition-colors focus:border-[var(--moto-cp)]" style={inputStyle} placeholder="¿Placa, color o referencia? Cuéntanos aquí..." />
                </label>
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="show" viewport={motoViewport} variants={motoStagger} className="grid gap-4 md:grid-cols-3">
              {[
                ['solar:shield-check-linear', 'Garantía oficial', 'Respaldo de fábrica y taller propio.'],
                ['solar:wrench-linear', 'Entrega lista', 'Moto revisada y a punto para rodar.'],
                ['solar:chat-round-dots-linear', 'Asesoría', 'Te acompañamos por WhatsApp.'],
              ].map(([icon, title, text]) => (
                <motion.div key={title} variants={motoCard} className="rounded-2xl border p-6" style={{ backgroundColor: MOTO.card, borderColor: MOTO.line }}>
                  <Icon icon={icon} width={26} style={{ color: primary }} />
                  <p className="mt-4 text-sm font-bold uppercase" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>{title}</p>
                  <p className="mt-1.5 text-xs leading-5" style={{ color: MOTO.muted }}>{text}</p>
                </motion.div>
              ))}
            </motion.div>

            {suggestedProducts.length > 0 && (
              <motion.div initial="hidden" whileInView="show" viewport={motoViewport} variants={motoSection} className="rounded-2xl border p-6 md:p-8" style={{ backgroundColor: MOTO.card, borderColor: MOTO.line }}>
                <div className="mb-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: primary }}>Completa tu setup</p>
                    <h2 className="text-2xl font-bold uppercase" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>También te servirá</h2>
                  </div>
                  <a href={`/tienda/${slug}/catalogo`} className="text-xs font-bold uppercase tracking-[0.12em] hover:opacity-70" style={{ color: primary }}>Ver todo</a>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestedProducts.slice(0, 3).map((producto) => (
                    <button
                      key={producto.id}
                      type="button"
                      onClick={() => onAddToCart(producto)}
                      className="group flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors hover:border-white/25"
                      style={{ borderColor: MOTO.line, backgroundColor: MOTO.soft }}
                    >
                      <span className="h-16 w-16 shrink-0 overflow-hidden rounded-lg" style={{ backgroundColor: MOTO.card }}>
                        <MotoProductImage producto={producto} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-sm font-semibold" style={{ color: MOTO.ink }}>{producto.descripcion}</span>
                        <span className="mt-1 block text-sm font-bold" style={{ color: primary }}>{money(producto.precioUnitario)}</span>
                      </span>
                      <Icon icon="solar:add-circle-linear" width={22} style={{ color: MOTO.faint }} className="transition-colors group-hover:text-neutral-900" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </section>

          {/* Resumen */}
          <motion.aside initial="hidden" animate="show" variants={motoCard} className="h-fit overflow-hidden rounded-2xl border shadow-[0_30px_60px_-40px_rgba(0,0,0,0.9)] lg:sticky lg:top-28" style={{ backgroundColor: MOTO.card, borderColor: MOTO.line }}>
            <div className="border-b p-6" style={{ borderColor: MOTO.line }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: MOTO.faint }}>Tu pedido</p>
              <h2 className="mt-1 text-2xl font-bold uppercase" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>Resumen</h2>
            </div>

            <div className="max-h-[440px] overflow-y-auto px-6">
              {carritoState.length === 0 ? (
                <div className="my-6 rounded-2xl p-8 text-center" style={{ backgroundColor: MOTO.soft }}>
                  <Icon icon="solar:cart-cross-linear" className="mx-auto text-4xl" style={{ color: MOTO.faint }} />
                  <p className="mt-3 text-sm font-medium" style={{ color: MOTO.muted }}>Tu carrito está vacío.</p>
                  <a href={`/tienda/${slug}/catalogo`} className="mt-5 inline-flex rounded-lg px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white" style={{ backgroundColor: primary }}>Ver catálogo</a>
                </div>
              ) : (
                carritoState.map((item) => {
                  const itemId = item.cartId || item.id;
                  const qty = Number(item.cantidad || 1);
                  const price = Number(item.precioUnitario || item.precio || 0);
                  return (
                    <div key={itemId} className="flex gap-4 border-b py-5" style={{ borderColor: MOTO.line }}>
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg" style={{ backgroundColor: MOTO.soft }}>
                        <MotoProductImage producto={item} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold leading-5" style={{ color: MOTO.ink }}>{item.descripcion}</p>
                        <p className="mt-1 text-sm font-bold" style={{ color: primary }}>{money(price * qty)}</p>
                        <div className="mt-2.5 flex items-center justify-between gap-3">
                          <div className="flex h-9 items-center rounded-lg border" style={{ borderColor: MOTO.line, backgroundColor: MOTO.soft }}>
                            <button type="button" onClick={() => updateQuantity(itemId, qty - 1)} className="h-9 w-9 text-sm font-bold" style={{ color: MOTO.muted }}>-</button>
                            <span className="w-8 text-center text-sm font-semibold" style={{ color: MOTO.ink }}>{qty}</span>
                            <button type="button" onClick={() => updateQuantity(itemId, qty + 1)} className="h-9 w-9 text-sm font-bold" style={{ color: MOTO.muted }}>+</button>
                          </div>
                          <button type="button" onClick={() => removeItem(itemId)} className="flex h-9 w-9 items-center justify-center rounded-full text-red-500 hover:bg-red-500/10">
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
              <div className="mx-6 mt-5 rounded-lg p-4 text-xs font-medium leading-5" style={{ backgroundColor: MOTO.soft, color: MOTO.body }}>
                Te faltan {money(freeDeliveryRemaining)} para el envío gratis.
              </div>
            )}

            <div className="p-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between" style={{ color: MOTO.muted }}><span>Subtotal</span><span className="font-medium" style={{ color: MOTO.ink }}>{money(calcularSubtotal())}</span></div>
                {!ocultarEnvio && <div className="flex justify-between" style={{ color: MOTO.muted }}><span>Envío</span><span className="font-medium" style={{ color: MOTO.ink }}>{money(calcularCostoEnvio())}</span></div>}
                <div className="flex items-baseline justify-between border-t pt-4" style={{ borderColor: MOTO.line }}>
                  <span className="text-sm font-semibold uppercase tracking-[0.1em]" style={{ color: MOTO.muted }}>Total</span>
                  <span className="text-3xl font-extrabold" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>{money(ocultarEnvio ? calcularSubtotal() : calcularTotal())}</span>
                </div>
              </div>

              <motion.button
                type="button"
                disabled={!canSubmit}
                onClick={onSubmit}
                className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-lg text-xs font-bold uppercase tracking-[0.14em] text-white shadow-lg transition-transform disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: primary }}
                whileHover={canSubmit ? { scale: 1.02, y: -2 } : undefined}
                whileTap={canSubmit ? motoTap : undefined}
              >
                {enviando ? 'Enviando pedido...' : 'Confirmar pedido'}
                <Icon icon="solar:arrow-right-linear" />
              </motion.button>

              <div className="mt-5 grid grid-cols-2 gap-2 text-center text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: MOTO.muted }}>
                <span className="rounded-lg px-2 py-3" style={{ backgroundColor: MOTO.soft }}>Pago seguro</span>
                <span className="rounded-lg px-2 py-3" style={{ backgroundColor: MOTO.soft }}>Datos protegidos</span>
              </div>
            </div>
          </motion.aside>
        </div>
      </motion.main>

      <MotoFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={[]} />
      <MotoWhatsAppFab tienda={tienda} />

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
        tiendaColor={primary}
      />
    </motion.div>
  );
}
