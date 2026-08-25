import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { TemplateCheckoutPageProps } from '@/templates/shared/types';
import ConfirmOrderModal from '@/components/tienda/ConfirmOrderModal';
import PaymentConfirmationModal from '@/components/tienda/PaymentConfirmationModal';
import { FOOD, FoodProductImage, FoodShell, FoodSubHeader, foodPrimary } from './CrispyParts';
import { foodPage, foodTap } from './motion';

function money(v: number) { return `S/ ${Number(v || 0).toFixed(2)}`; }

export default function CrispyCheckoutPage(props: TemplateCheckoutPageProps) {
  const {
    slug, tienda, diseno, cp,
    carritoState, updateQuantity, removeItem,
    formData, erroresForm, handleChange,
    configPago, configEnvio, enviando,
    calcularSubtotal, calcularCostoEnvio, calcularTotal,
    onSubmit, freeDeliveryRemaining,
    showConfirmModal, setShowConfirmModal, showPaymentModal, setShowPaymentModal, pedidoCreado, enviarPedido,
  } = props;

  const primary = foodPrimary(cp);
  const canSubmit = !enviando && carritoState.length > 0;
  const deliveryType = formData.tipoEntrega || 'delivery';
  const ocultarEnvio = Boolean(diseno?.comidaAppOcultarEnvio);
  const inputCls = 'mt-1.5 h-12 w-full rounded-2xl border-0 bg-white px-4 text-sm font-medium shadow-sm outline-none focus:ring-2';

  return (
    <FoodShell slug={slug} active="orders" cp={primary} diseno={diseno} tienda={tienda} carrito={carritoState} onOpenCart={() => (window.location.href = `/tienda/${slug}/catalogo`)}>
      <motion.div initial="hidden" animate="show" variants={foodPage}>
        <div className="lg:hidden">
          <FoodSubHeader title="Finalizar pedido" slug={slug} cp={primary} carrito={carritoState} />
        </div>
        <h1 className="hidden pb-2 pt-8 text-[30px] font-extrabold lg:block" style={{ color: FOOD.ink }}>Finalizar pedido</h1>

        <div className="px-4 pt-2 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-6 lg:px-0 lg:pt-2">
          <div className="space-y-4">
          {/* Items */}
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-[15px] font-extrabold" style={{ color: FOOD.ink }}>Tu pedido</h2>
            {carritoState.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm font-semibold" style={{ color: FOOD.soft }}>Tu carrito está vacío.</p>
                <a href={`/tienda/${slug}/catalogo`} className="mt-3 inline-flex rounded-full px-5 py-2.5 text-[12px] font-extrabold text-white" style={{ backgroundColor: primary }}>Ver menú</a>
              </div>
            ) : carritoState.map((item) => {
              const itemId = item.cartId || item.id;
              const qty = Number(item.cantidad || 1);
              const price = Number(item.precioUnitario || item.precio || 0);
              return (
                <div key={itemId} className="flex items-center gap-3 border-b py-3 last:border-0" style={{ borderColor: FOOD.line }}>
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl" style={{ backgroundColor: FOOD.peach }}><FoodProductImage producto={item} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-bold" style={{ color: FOOD.ink }}>{item.descripcion}</p>
                    <p className="text-sm font-extrabold" style={{ color: primary }}>{money(price * qty)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => updateQuantity(itemId, qty - 1)} className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: FOOD.cream, color: FOOD.ink }}><Icon icon="solar:minus-linear" width={14} /></button>
                    <span className="w-5 text-center text-sm font-bold" style={{ color: FOOD.ink }}>{qty}</span>
                    <button type="button" onClick={() => updateQuantity(itemId, qty + 1)} className="flex h-7 w-7 items-center justify-center rounded-full text-white" style={{ backgroundColor: primary }}><Icon icon="solar:add-linear" width={14} /></button>
                    <button type="button" onClick={() => removeItem(itemId)} className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-red-500"><Icon icon="solar:trash-bin-trash-linear" width={15} /></button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Datos */}
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-[15px] font-extrabold" style={{ color: FOOD.ink }}>Tus datos</h2>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: FOOD.soft }}>Nombre</span>
              <input name="clienteNombre" value={formData.clienteNombre || ''} onChange={handleChange} className={inputCls} style={{ ['--tw-ring-color' as any]: primary }} />
              {erroresForm.clienteNombre && <p className="mt-1 text-xs font-medium text-red-500">{erroresForm.clienteNombre}</p>}
            </label>
            <label className="mt-3 block">
              <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: FOOD.soft }}>Celular</span>
              <input name="clienteTelefono" value={formData.clienteTelefono || ''} onChange={handleChange} className={inputCls} style={{ ['--tw-ring-color' as any]: primary }} />
              {erroresForm.clienteTelefono && <p className="mt-1 text-xs font-medium text-red-500">{erroresForm.clienteTelefono}</p>}
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: FOOD.soft }}>Entrega</span>
                <select name="tipoEntrega" value={deliveryType} onChange={handleChange} className={inputCls} style={{ ['--tw-ring-color' as any]: primary }}>
                  {configEnvio?.aceptaEnvio !== false && <option value="delivery">Delivery</option>}
                  {configEnvio?.aceptaRecojo !== false && <option value="recojo">Recojo</option>}
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: FOOD.soft }}>Pago</span>
                <select name="medioPago" value={formData.medioPago || 'efectivo'} onChange={handleChange} className={inputCls} style={{ ['--tw-ring-color' as any]: primary }}>
                  {configPago?.aceptaEfectivo !== false && <option value="efectivo">Efectivo</option>}
                  {configPago?.aceptaYape !== false && <option value="yape">Yape</option>}
                  {configPago?.aceptaPlin !== false && <option value="plin">Plin</option>}
                  {configPago?.aceptaTarjeta && <option value="tarjeta">Tarjeta</option>}
                </select>
              </label>
            </div>
            <label className="mt-3 block">
              <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: FOOD.soft }}>Dirección</span>
              <input name="direccionEntrega" value={formData.direccionEntrega || ''} onChange={handleChange} className={inputCls} style={{ ['--tw-ring-color' as any]: primary }} />
              {erroresForm.direccionEntrega && <p className="mt-1 text-xs font-medium text-red-500">{erroresForm.direccionEntrega}</p>}
            </label>
            <label className="mt-3 block">
              <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: FOOD.soft }}>Nota (opcional)</span>
              <textarea name="notaPedido" value={formData.notaPedido || ''} onChange={handleChange} rows={2} className="mt-1.5 w-full resize-none rounded-2xl border-0 bg-white px-4 py-3 text-sm font-medium shadow-sm outline-none focus:ring-2" style={{ ['--tw-ring-color' as any]: primary }} placeholder="Sin ají, tocar timbre..." />
            </label>
          </div>

          </div>

          {/* Columna derecha: totales + CTA (sticky en desktop) */}
          <div className="mt-4 space-y-4 lg:mt-0 lg:sticky lg:top-24">
          {/* Totales */}
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            {!ocultarEnvio && freeDeliveryRemaining > 0 && carritoState.length > 0 && (
              <div className="mb-3 rounded-2xl px-3 py-2.5 text-xs font-semibold" style={{ backgroundColor: FOOD.cream, color: FOOD.ink }}>Te faltan {money(freeDeliveryRemaining)} para el envío gratis 🎉</div>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between font-medium" style={{ color: FOOD.soft }}><span>Subtotal</span><span style={{ color: FOOD.ink }}>{money(calcularSubtotal())}</span></div>
              {!ocultarEnvio && <div className="flex justify-between font-medium" style={{ color: FOOD.soft }}><span>Envío</span><span style={{ color: FOOD.ink }}>{money(calcularCostoEnvio())}</span></div>}
              <div className="flex items-baseline justify-between border-t pt-2.5" style={{ borderColor: FOOD.line }}>
                <span className="text-sm font-bold" style={{ color: FOOD.soft }}>Total</span>
                <span className="text-2xl font-extrabold" style={{ color: FOOD.ink }}>{money(ocultarEnvio ? calcularSubtotal() : calcularTotal())}</span>
              </div>
            </div>
          </div>

            {/* CTA */}
            <motion.button whileTap={foodTap} type="button" disabled={!canSubmit} onClick={onSubmit} className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-extrabold text-white shadow-lg disabled:opacity-50" style={{ backgroundColor: primary }}>
              {enviando ? 'Enviando...' : 'Confirmar pedido'} <Icon icon="solar:arrow-right-linear" width={18} />
            </motion.button>
          </div>
        </div>
      </motion.div>

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
    </FoodShell>
  );
}
