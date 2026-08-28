import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateCheckoutPageProps } from '@/templates/shared/types';
import ConfirmOrderModal from '@/components/tienda/ConfirmOrderModal';
import PaymentConfirmationModal from '@/components/tienda/PaymentConfirmationModal';
import { ANTOJO, AntojoFooter, AntojoHeader, AntojoProductCard, AntojoProductImage, antojoDots } from './AntojoParts';
import { antojoCard, antojoHover, antojoPage, antojoSection, antojoStagger, antojoTap, antojoViewport } from './motion';

function money(value: number) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

function inputClass(hasError?: boolean) {
  return `mt-2 h-[52px] w-full rounded-xl border bg-white px-4 text-sm font-bold text-neutral-900 outline-none transition-colors ${
    hasError ? 'border-red-400' : 'border-neutral-200 focus:border-[var(--antojo-cp)]'
  }`;
}

export default function AntojoCheckoutPage(props: TemplateCheckoutPageProps) {
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

  const primary = cp || ANTOJO.tomato;
  const cartCount = carritoState.reduce((sum, item) => sum + Number(item.cantidad || 1), 0);
  const canSubmit = !enviando && carritoState.length > 0;
  const deliveryType = formData.tipoEntrega || 'delivery';
  const ocultarEnvio = Boolean(diseno?.antojoOcultarEnvio);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={antojoPage}
      className="min-h-screen"
      style={{ backgroundColor: ANTOJO.cream, fontFamily: `'${diseno?.tipografia || 'Poppins'}', sans-serif`, ['--antojo-cp' as any]: primary }}
    >
      <div style={{ background: `linear-gradient(135deg, ${primary}, ${ANTOJO.orange})` }}>
        <AntojoHeader
          tienda={tienda}
          slug={slug}
          cp={primary}
          diseno={diseno}
          carritoSize={cartCount}
          onOpenCart={() => undefined}
          searchQuery={search}
          setSearchQuery={setSearch}
          allCategories={[]}
          onSearchSubmit={(event, value) => {
            event.preventDefault();
            if (value?.trim()) window.location.href = `/tienda/${slug}/catalogo?search=${encodeURIComponent(value.trim())}`;
          }}
          overlay
        />
        <motion.section variants={antojoSection} className="relative px-5 pb-16 pt-6 text-center text-white">
          <div className="absolute inset-0 opacity-25" style={antojoDots} aria-hidden />
          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="text-sm font-black text-white/80">
              <a href={`/tienda/${slug}`} className="hover:text-white">Inicio</a>
              <span className="mx-1">/</span>
              <span>Finalizar pedido</span>
            </div>
            <h1 className="mt-3 text-4xl font-black md:text-5xl">{diseno?.antojoCheckoutTitle || 'Casi listo tu antojo'}</h1>
          </div>
        </motion.section>
      </div>

      <motion.main variants={antojoSection} className="mx-auto max-w-7xl px-5 py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_430px]">
          <section className="space-y-8">
            <motion.div initial="hidden" whileInView="show" viewport={antojoViewport} variants={antojoCard} className="rounded-[26px] bg-white p-6 shadow-md shadow-black/5 ring-1 ring-black/5 md:p-8">
              <div className="mb-7 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ backgroundColor: primary }}>
                  <Icon icon="solar:user-rounded-bold" width={24} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-neutral-400">Paso 1</p>
                  <h2 className="text-2xl font-black text-neutral-900">Tus datos</h2>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.15em] text-neutral-500">Nombre completo</span>
                  <input name="clienteNombre" value={formData.clienteNombre || ''} onChange={handleChange} className={inputClass(erroresForm.clienteNombre)} />
                  {erroresForm.clienteNombre && <p className="mt-2 text-xs font-bold text-red-500">{erroresForm.clienteNombre}</p>}
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.15em] text-neutral-500">Celular</span>
                  <input name="clienteTelefono" value={formData.clienteTelefono || ''} onChange={handleChange} className={inputClass(erroresForm.clienteTelefono)} />
                  {erroresForm.clienteTelefono && <p className="mt-2 text-xs font-bold text-red-500">{erroresForm.clienteTelefono}</p>}
                </label>
                <label className="block md:col-span-2">
                  <span className="text-xs font-black uppercase tracking-[0.15em] text-neutral-500">Correo</span>
                  <input name="clienteEmail" type="email" value={formData.clienteEmail || ''} onChange={handleChange} className={inputClass(erroresForm.clienteEmail)} />
                  {erroresForm.clienteEmail && <p className="mt-2 text-xs font-bold text-red-500">{erroresForm.clienteEmail}</p>}
                </label>
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="show" viewport={antojoViewport} variants={antojoCard} className="rounded-[26px] bg-white p-6 shadow-md shadow-black/5 ring-1 ring-black/5 md:p-8">
              <div className="mb-7 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ backgroundColor: ANTOJO.orange }}>
                  <Icon icon="solar:delivery-bold" width={24} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-neutral-400">Paso 2</p>
                  <h2 className="text-2xl font-black text-neutral-900">Entrega y pago</h2>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.15em] text-neutral-500">Tipo de entrega</span>
                  <select name="tipoEntrega" value={deliveryType} onChange={handleChange} className={inputClass(erroresForm.tipoEntrega)}>
                    {configEnvio?.aceptaRecojo !== false && <option value="recojo">Recojo en tienda</option>}
                    {configEnvio?.aceptaEnvio !== false && <option value="delivery">Delivery</option>}
                  </select>
                  {erroresForm.tipoEntrega && <p className="mt-2 text-xs font-bold text-red-500">{erroresForm.tipoEntrega}</p>}
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.15em] text-neutral-500">Medio de pago</span>
                  <select name="medioPago" value={formData.medioPago || 'efectivo'} onChange={handleChange} className={inputClass(erroresForm.medioPago)}>
                    {configPago?.aceptaEfectivo !== false && <option value="efectivo">Efectivo</option>}
                    {configPago?.aceptaYape !== false && <option value="yape">Yape</option>}
                    {configPago?.aceptaPlin !== false && <option value="plin">Plin</option>}
                    {configPago?.aceptaTarjeta && <option value="tarjeta">Tarjeta</option>}
                    {configPago?.aceptaMercadoPago && <option value="MERCADO_PAGO">Mercado Pago</option>}
                  </select>
                  {erroresForm.medioPago && <p className="mt-2 text-xs font-bold text-red-500">{erroresForm.medioPago}</p>}
                </label>
                <label className="block md:col-span-2">
                  <span className="text-xs font-black uppercase tracking-[0.15em] text-neutral-500">Dirección de entrega</span>
                  <input name="direccionEntrega" value={formData.direccionEntrega || ''} onChange={handleChange} className={inputClass(erroresForm.direccionEntrega)} />
                  {erroresForm.direccionEntrega && <p className="mt-2 text-xs font-bold text-red-500">{erroresForm.direccionEntrega}</p>}
                </label>
                <label className="block md:col-span-2">
                  <span className="text-xs font-black uppercase tracking-[0.15em] text-neutral-500">Nota del pedido</span>
                  <textarea name="notaPedido" value={formData.notaPedido || ''} onChange={handleChange} rows={4} className="mt-2 w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-4 text-sm font-bold text-neutral-900 outline-none transition-colors focus:border-[var(--antojo-cp)]" placeholder="Sin cebolla, extra queso, punto de referencia..." />
                </label>
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="show" viewport={antojoViewport} variants={antojoStagger} className="grid gap-4 md:grid-cols-3">
              {[
                ['solar:fire-bold', 'Recién hecho', 'Preparamos tu pedido al momento.'],
                ['solar:clock-circle-bold', 'Rápido', 'Coordinamos entrega o recojo al toque.'],
                ['solar:chat-round-dots-bold', 'Atención directa', 'Te acompañamos por WhatsApp.'],
              ].map(([icon, title, text]) => (
                <motion.div key={title} variants={antojoCard} whileHover={antojoHover} className="rounded-[22px] bg-white p-6 ring-1 ring-black/5">
                  <Icon icon={icon} width={28} style={{ color: primary }} />
                  <p className="mt-4 text-sm font-black text-neutral-900">{title}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-neutral-500">{text}</p>
                </motion.div>
              ))}
            </motion.div>

            {suggestedProducts.length > 0 && (
              <motion.div initial="hidden" whileInView="show" viewport={antojoViewport} variants={antojoSection} className="rounded-[26px] bg-white p-6 shadow-md shadow-black/5 ring-1 ring-black/5 md:p-8">
                <div className="mb-7 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.2em]" style={{ color: ANTOJO.orange }}>¿Un antojo más?</p>
                    <h2 className="text-2xl font-black text-neutral-900">Súmalo a tu pedido</h2>
                  </div>
                  <a href={`/tienda/${slug}/catalogo`} className="text-sm font-black text-neutral-900 hover:opacity-70">Ver carta</a>
                </div>
                <motion.div variants={antojoStagger} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestedProducts.slice(0, 3).map((producto) => (
                    <AntojoProductCard key={producto.id} producto={producto} slug={slug} cp={primary} onAddToCart={onAddToCart} onClick={() => { window.location.href = `/tienda/${slug}/producto/${producto.id}`; }} />
                  ))}
                </motion.div>
              </motion.div>
            )}
          </section>

          <motion.aside initial="hidden" animate="show" variants={antojoCard} className="h-fit overflow-hidden rounded-[26px] bg-white shadow-xl shadow-black/10 ring-1 ring-black/5 lg:sticky lg:top-28">
            <div className="border-b border-neutral-100 p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400">Tu pedido</p>
              <h2 className="mt-1 text-2xl font-black text-neutral-900">Resumen</h2>
            </div>

            <div className="max-h-[440px] overflow-y-auto px-6">
              {carritoState.length === 0 ? (
                <div className="my-6 rounded-2xl bg-neutral-50 p-8 text-center">
                  <Icon icon="solar:bag-cross-bold" className="mx-auto text-4xl text-neutral-300" />
                  <p className="mt-3 text-sm font-bold text-neutral-500">Tu carrito está vacío.</p>
                  <a href={`/tienda/${slug}/catalogo`} className="mt-5 inline-flex rounded-full px-5 py-3 text-xs font-black uppercase text-white" style={{ backgroundColor: primary }}>Ver la carta</a>
                </div>
              ) : (
                carritoState.map((item) => {
                  const itemId = item.cartId || item.id;
                  const qty = Number(item.cantidad || 1);
                  const price = Number(item.precioUnitario || item.precio || 0);
                  return (
                    <div key={itemId} className="flex gap-4 border-b border-neutral-100 py-5">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-neutral-50">
                        <AntojoProductImage producto={item} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-black leading-5 text-neutral-900">{item.descripcion}</p>
                        <p className="mt-1 text-sm font-black" style={{ color: primary }}>{money(price * qty)}</p>
                        <div className="mt-2.5 flex items-center justify-between gap-3">
                          <div className="flex h-9 items-center rounded-full bg-neutral-100">
                            <button type="button" onClick={() => updateQuantity(itemId, qty - 1)} className="h-9 w-9 text-sm font-black">-</button>
                            <span className="w-8 text-center text-sm font-black">{qty}</span>
                            <button type="button" onClick={() => updateQuantity(itemId, qty + 1)} className="h-9 w-9 text-sm font-black">+</button>
                          </div>
                          <button type="button" onClick={() => removeItem(itemId)} className="flex h-9 w-9 items-center justify-center rounded-full text-red-500 hover:bg-red-50">
                            <Icon icon="solar:trash-bin-trash-bold" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {!ocultarEnvio && freeDeliveryRemaining > 0 && carritoState.length > 0 && (
              <div className="mx-6 mt-5 rounded-2xl p-4 text-xs font-bold leading-5 text-neutral-800" style={{ backgroundColor: `${ANTOJO.mint}22` }}>
                Te faltan {money(freeDeliveryRemaining)} para el delivery gratis 🛵
              </div>
            )}

            <div className="p-6">
              <div className="space-y-3 text-sm font-bold">
                <div className="flex justify-between text-neutral-500"><span>Subtotal</span><span>{money(calcularSubtotal())}</span></div>
                {!ocultarEnvio && <div className="flex justify-between text-neutral-500"><span>Delivery</span><span>{money(calcularCostoEnvio())}</span></div>}
                <div className="flex justify-between border-t border-neutral-100 pt-4 text-3xl font-black text-neutral-900"><span>Total</span><span>{money(ocultarEnvio ? calcularSubtotal() : calcularTotal())}</span></div>
              </div>

              <motion.button
                type="button"
                disabled={!canSubmit}
                onClick={onSubmit}
                className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full text-sm font-black uppercase tracking-wide text-white shadow-lg transition-transform disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: primary }}
                whileHover={canSubmit ? { scale: 1.02, y: -2 } : undefined}
                whileTap={canSubmit ? antojoTap : undefined}
              >
                {enviando ? 'Enviando pedido...' : 'Confirmar pedido'}
                <Icon icon="solar:arrow-right-bold" />
              </motion.button>

              <div className="mt-5 grid grid-cols-2 gap-2 text-center text-[11px] font-black uppercase tracking-wide text-neutral-500">
                <span className="rounded-full bg-neutral-100 px-2 py-3">Pedido seguro</span>
                <span className="rounded-full bg-neutral-100 px-2 py-3">Datos protegidos</span>
              </div>
            </div>
          </motion.aside>
        </div>
      </motion.main>

      <AntojoFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={[]} />

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
