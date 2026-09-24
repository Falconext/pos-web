import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ConfirmOrderModal from '@/components/tienda/ConfirmOrderModal';
import PaymentConfirmationModal from '@/components/tienda/PaymentConfirmationModal';
import { BancoLogo } from '@/components/shared/BancoLogo';
import MedioPagoSelector from '@/components/tienda/MedioPagoSelector';
import type { TemplateCheckoutPageProps } from '@/templates/shared/types';
import { farmaciaTheme, useFarmaciaFont, editable, fmMoney } from './FarmaciaParts';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function FarmaciaCheckoutPage(props: TemplateCheckoutPageProps) {
  const {
    slug, tienda, diseno, carritoState, updateQuantity, removeItem, formData, erroresForm, handleChange,
    configPago, configEnvio, enviando, calcularSubtotal, calcularCostoEnvio, calcularTotal,
    freeDeliveryThreshold, freeDeliveryRemaining, freeDeliveryProgress, onSubmit,
  } = props as any;

  useFarmaciaFont();
  const navigate = useNavigate();
  const t = farmaciaTheme(diseno);
  const storeName = tienda?.nombreComercial || tienda?.nombre || tienda?.razonSocial || 'MediCare';
  const subtotal = calcularSubtotal();
  const envio = calcularCostoEnvio();
  const total = calcularTotal();

  const inputCls = (field: string) => `h-12 w-full rounded-xl border bg-white px-4 text-sm font-semibold text-gray-900 outline-none transition-colors placeholder:text-gray-400 ${erroresForm?.[field] ? 'border-rose-500' : ''}`;

  const SectionTitle = ({ icon, children }: any) => (
    <div className="mb-5 flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: t.soft, color: t.primary }}><Icon icon={icon} width={20} /></span>
      <h2 className="text-lg font-black" style={{ color: t.ink }}>{children}</h2>
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, fontFamily: t.font }}>
      <header className="text-white" style={{ background: t.primary, color: t.onPrimary }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 lg:px-6">
          <button type="button" onClick={() => navigate(`/tienda/${slug}`)} className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: t.accent, color: t.onAccent }}><Icon icon="solar:health-bold" width={22} /></span>
            <span className="text-[20px] font-black lowercase">{storeName}</span>
          </button>
          <div className="flex items-center gap-2 text-sm font-bold opacity-90"><Icon icon="solar:shield-check-bold" width={20} /> Compra 100% segura</div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 md:flex-row md:items-start lg:px-6">
        <section className="min-w-0 flex-1 space-y-6">
          {carritoState.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-white px-8 py-16 text-center" style={{ borderColor: t.line }}>
              <Icon icon="solar:cart-large-minimalistic-linear" width={72} className="mx-auto text-gray-300" />
              <h1 className="mt-5 text-2xl font-black" style={{ color: t.ink }}>Tu carrito está vacío</h1>
              <button type="button" onClick={() => navigate(`/tienda/${slug}/catalogo`)} className="mt-7 rounded-full px-6 py-3 text-sm font-black" style={{ background: t.accent, color: t.onAccent }}>Ver catálogo</button>
            </div>
          ) : (
            <>
              <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl border bg-white p-6" style={{ borderColor: t.line }}>
                <SectionTitle icon="solar:cart-large-2-bold">Productos del pedido</SectionTitle>
                <div className="space-y-3">
                  {carritoState.map((item: any) => {
                    const id = item.cartId || item.id; const qty = Number(item.cantidad || 1); const price = Number(item.precioUnitario || 0);
                    return (
                      <div key={id} className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center" style={{ borderColor: t.line }}>
                        <div className="flex h-20 w-full shrink-0 items-center justify-center rounded-lg sm:w-20" style={{ background: t.soft }}>
                          {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-1" /> : <Icon icon="solar:pill-bold" width={34} style={{ color: t.primary }} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[15px] font-bold leading-snug" style={{ color: t.ink }}>{item.descripcion}</h3>
                          <button type="button" onClick={() => removeItem(id)} className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-rose-500"><Icon icon="solar:trash-bin-trash-linear" width={14} /> Quitar</button>
                        </div>
                        <div className="flex shrink-0 items-center justify-between gap-4 sm:min-w-[150px] sm:flex-col sm:items-end">
                          <div className="flex h-10 overflow-hidden rounded-lg border" style={{ borderColor: t.line }}>
                            <button type="button" onClick={() => updateQuantity(id, qty - 1)} className="flex w-9 items-center justify-center text-lg font-bold hover:bg-gray-50">−</button>
                            <span className="flex w-11 items-center justify-center border-x text-sm font-black" style={{ borderColor: t.line }}>{qty}</span>
                            <button type="button" onClick={() => updateQuantity(id, qty + 1)} className="flex w-9 items-center justify-center text-lg font-bold hover:bg-gray-50">+</button>
                          </div>
                          <span className="text-lg font-black" style={{ color: t.ink }}>{fmMoney(price * qty)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {configEnvio && (configEnvio.aceptaEnvio || configEnvio.aceptaRecojo) && (
                <div className="rounded-2xl border bg-white p-6" style={{ borderColor: t.line }}>
                  <SectionTitle icon="solar:delivery-bold">Método de entrega</SectionTitle>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {configEnvio.aceptaEnvio && (
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-4 text-sm font-black" style={formData.tipoEntrega === 'ENVIO' ? { borderColor: t.accent, background: `${t.accent}12`, color: t.ink } : { borderColor: t.line, color: '#6B7280' }}>
                        <input type="radio" className="hidden" name="tipoEntrega" value="ENVIO" checked={formData.tipoEntrega === 'ENVIO'} onChange={handleChange} />
                        <Icon icon="solar:delivery-bold" width={22} /> Envío a domicilio
                        {configEnvio.costoEnvio > 0 && <span className="ml-auto text-xs">{fmMoney(Number(configEnvio.costoEnvio))}</span>}
                      </label>
                    )}
                    {configEnvio.aceptaRecojo && (
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-4 text-sm font-black" style={formData.tipoEntrega === 'RECOJO' ? { borderColor: t.accent, background: `${t.accent}12`, color: t.ink } : { borderColor: t.line, color: '#6B7280' }}>
                        <input type="radio" className="hidden" name="tipoEntrega" value="RECOJO" checked={formData.tipoEntrega === 'RECOJO'} onChange={handleChange} />
                        <Icon icon="solar:shop-bold" width={22} /> Recojo en tienda
                      </label>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border bg-white p-6" style={{ borderColor: t.line }}>
                <SectionTitle icon="solar:user-bold">Datos del cliente</SectionTitle>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><input type="text" name="clienteNombre" placeholder="Nombre completo *" value={formData.clienteNombre} onChange={handleChange} className={inputCls('clienteNombre')} style={{ borderColor: erroresForm.clienteNombre ? undefined : t.line }} />{erroresForm.clienteNombre && <p className="mt-1 text-xs text-rose-500">{erroresForm.clienteNombre}</p>}</div>
                  <div><input type="tel" name="clienteTelefono" placeholder="Teléfono *" value={formData.clienteTelefono} onChange={handleChange} className={inputCls('clienteTelefono')} style={{ borderColor: erroresForm.clienteTelefono ? undefined : t.line }} />{erroresForm.clienteTelefono && <p className="mt-1 text-xs text-rose-500">{erroresForm.clienteTelefono}</p>}</div>
                  <div className="sm:col-span-2"><input type="email" name="clienteEmail" placeholder="Correo electrónico (opcional)" value={formData.clienteEmail} onChange={handleChange} className={inputCls('clienteEmail')} style={{ borderColor: t.line }} /></div>
                  {formData.tipoEntrega === 'ENVIO' && (
                    <>
                      <div className="sm:col-span-2"><input type="text" name="clienteDireccion" placeholder="Dirección de entrega *" value={formData.clienteDireccion} onChange={handleChange} className={inputCls('clienteDireccion')} style={{ borderColor: erroresForm.clienteDireccion ? undefined : t.line }} />{erroresForm.clienteDireccion && <p className="mt-1 text-xs text-rose-500">{erroresForm.clienteDireccion}</p>}</div>
                      <input type="text" name="clienteReferencia" placeholder="Referencia (opcional)" value={formData.clienteReferencia} onChange={handleChange} className="h-12 rounded-xl border bg-white px-4 text-sm font-semibold outline-none placeholder:text-gray-400 sm:col-span-2" style={{ borderColor: t.line }} />
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6" style={{ borderColor: t.line }}>
                <SectionTitle icon="solar:wallet-money-bold">Método de pago</SectionTitle>
                <MedioPagoSelector configPago={configPago} value={formData.medioPago} onChange={handleChange} accent={t.accent} radius="12px" />
                {formData.medioPago === 'TRANSFERENCIA' && configPago?.cuentasBancarias?.length > 0 && (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {configPago.cuentasBancarias.map((c: any) => (
                      <div key={c.id} className="flex items-center gap-4 rounded-xl border p-4" style={{ borderColor: t.line, background: t.soft }}>
                        <BancoLogo banco={c.banco} size={44} />
                        <div className="min-w-0"><p className="font-mono text-sm font-black" style={{ color: t.ink }}>{c.numeroCuenta}</p>{c.cci && <p className="text-xs font-semibold text-gray-500">CCI: {c.cci}</p>}{c.titular && <p className="text-xs font-semibold text-gray-600">{c.titular}</p>}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border bg-white p-6" style={{ borderColor: t.line }}>
                <SectionTitle icon="solar:notes-bold">Nota del pedido</SectionTitle>
                <textarea name="observaciones" placeholder="Indicación especial, horario de entrega, etc. (opcional)" value={formData.observaciones} onChange={handleChange} rows={3} className="w-full resize-none rounded-xl border bg-white p-4 text-sm font-semibold outline-none placeholder:text-gray-400" style={{ borderColor: t.line }} />
              </div>
            </>
          )}
        </section>

        <aside className="w-full shrink-0 md:sticky md:top-6 md:w-[370px]">
          <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: t.line }}>
            <div className="px-6 py-5 text-white" style={{ background: t.primary, color: t.onPrimary }}>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] opacity-70">Resumen</p>
              <h2 className="mt-0.5 text-2xl font-black">Tu pedido</h2>
            </div>
            <div className="max-h-72 space-y-3 overflow-y-auto border-b px-5 py-4" style={{ borderColor: t.line }}>
              {carritoState.length === 0 ? <p className="py-8 text-center text-sm font-semibold text-gray-400">Sin productos.</p> : carritoState.map((item: any) => (
                <div key={item.cartId || item.id} className="grid grid-cols-[46px_1fr_auto] items-center gap-3">
                  <div className="relative"><div className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ background: t.soft }}>{item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-1" /> : <Icon icon="solar:pill-linear" style={{ color: t.primary }} />}</div><span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black" style={{ background: t.accent, color: t.onAccent }}>{item.cantidad}</span></div>
                  <p className="line-clamp-2 text-xs font-bold leading-snug text-gray-600">{item.descripcion}</p>
                  <span className="text-xs font-black" style={{ color: t.ink }}>{fmMoney(Number(item.precioUnitario || 0) * Number(item.cantidad || 1))}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3 px-6 py-5">
              <div className="flex justify-between text-sm font-semibold text-gray-500"><span>Subtotal</span><span className="font-black" style={{ color: t.ink }}>{fmMoney(subtotal)}</span></div>
              <div className="flex justify-between text-sm font-semibold text-gray-500"><span>Envío</span><span className="font-black" style={{ color: t.ink }}>{envio === 0 ? 'Gratis' : fmMoney(envio)}</span></div>
              {freeDeliveryThreshold > 0 && freeDeliveryRemaining > 0 && (
                <div className="rounded-xl px-3 py-2" style={{ background: t.soft }}><p className="text-xs font-bold" style={{ color: t.primary }}>Agrega {fmMoney(freeDeliveryRemaining)} para envío gratis</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full" style={{ width: `${freeDeliveryProgress}%`, background: t.accent }} /></div></div>
              )}
              {erroresForm._minimo && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-500">{erroresForm._minimo}</p>}
              <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: t.line }}><span className="text-sm font-black uppercase" style={{ color: t.ink }}>Total</span><span className="text-3xl font-black" style={{ color: t.ink }}>{fmMoney(total)}</span></div>
              <button type="button" onClick={onSubmit} disabled={enviando || carritoState.length === 0} className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-4 text-sm font-black uppercase tracking-wide shadow-lg transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50" style={{ background: t.accent, color: t.onAccent }}>
                {enviando ? <><Icon icon="solar:refresh-bold" className="animate-spin" width={16} /> Procesando…</> : <>{editable(diseno?.farmaciaCheckoutConfirmLabel, 'Confirmar pedido')} <Icon icon="solar:arrow-right-bold" width={18} /></>}
              </button>
            </div>
          </div>
        </aside>
      </main>

      {props.pedidoCreado && (
        <PaymentConfirmationModal
          isOpen={props.showPaymentModal}
          onClose={() => { props.setShowPaymentModal(false); window.location.href = `/tienda/${props.slug}/seguimiento?codigo=${props.pedidoCreado.codigoSeguimiento}`; }}
          orderData={{ id: props.pedidoCreado.id, codigoSeguimiento: props.pedidoCreado.codigoSeguimiento, total: props.pedidoCreado.total || props.calcularTotal(), medioPago: props.formData.medioPago, tipoEntrega: props.formData.tipoEntrega, clienteNombre: props.formData.clienteNombre }}
          paymentConfig={props.configPago ? { yapeQR: props.configPago.yapeQR || props.configPago.yapeQrUrl || undefined, plinQR: props.configPago.plinQR || props.configPago.plinQrUrl || undefined, yapeNumero: props.configPago.yapeNumero || undefined, plinNumero: props.configPago.plinNumero || undefined, whatsappTienda: props.configPago?.whatsappTienda ?? props.tienda?.whatsappTienda ?? props.tienda?.diseno?.whatsappTienda, cuentasBancarias: props.configPago.cuentasBancarias || undefined } : undefined}
          storeSlug={props.slug || ''}
        />
      )}
      <ConfirmOrderModal isOpen={props.showConfirmModal} onClose={() => props.setShowConfirmModal(false)} onConfirm={props.enviarPedido} total={props.calcularTotal()} loading={props.enviando} tiendaColor={t.accent} />
    </div>
  );
}
