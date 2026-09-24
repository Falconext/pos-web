import type { ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { MotionConfig, motion } from 'framer-motion';
import ConfirmOrderModal from '@/components/tienda/ConfirmOrderModal';
import PaymentConfirmationModal from '@/components/tienda/PaymentConfirmationModal';
import { BancoLogo } from '@/components/shared/BancoLogo';
import MedioPagoSelector from '@/components/tienda/MedioPagoSelector';
import type { TemplateCheckoutPageProps } from '@/templates/shared/types';
import { StrideMark, strideTheme, useStrideFont, editable, stMoney, storeNameOf, displayStyle, type Theme } from './StrideParts';
import { mix, stEase, stItem, stStagger } from './motion';

/** Campo sin bordes globales (border-0 + bg-none + focus:ring-0); el contorno es un box-shadow propio. */
function Field({ t, error, className = '', children }: { t: Theme; error?: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <div className="rounded-2xl bg-white transition-shadow focus-within:shadow-[inset_0_0_0_1.5px_var(--st-focus)]" style={{ boxShadow: `inset 0 0 0 1px ${error ? '#F43F5E' : t.line}`, ['--st-focus' as any]: t.primaryInk }}>
        {children}
      </div>
      {error && <p className="mt-1.5 pl-2 text-[12px] font-medium text-rose-500">{error}</p>}
    </div>
  );
}
const inputCls = 'h-12 w-full appearance-none rounded-2xl border-0 bg-transparent bg-none px-4 text-[14px] font-medium text-stone-900 outline-none placeholder:text-stone-400 focus:ring-0';

function Block({ t, icon, title, children }: { t: Theme; icon: string; title: string; children: ReactNode }) {
  return (
    <motion.section variants={stItem} className="rounded-[24px] border bg-white p-5 sm:p-6" style={{ borderColor: t.line }}>
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: t.soft, color: t.primaryInk }}><Icon icon={icon} width={20} /></span>
        <h2 className="text-[14px] font-extrabold uppercase" style={displayStyle(t, { color: t.ink })}>{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

export default function StrideCheckoutPage(props: TemplateCheckoutPageProps) {
  const {
    slug, tienda, diseno, carritoState, updateQuantity, removeItem, formData, erroresForm, handleChange,
    configPago, configEnvio, enviando, calcularSubtotal, calcularCostoEnvio, calcularTotal,
    freeDeliveryThreshold, freeDeliveryRemaining, freeDeliveryProgress, onSubmit,
  } = props as any;

  useStrideFont();
  const navigate = useNavigate();
  const t = strideTheme(diseno);
  const storeName = editable(diseno?.zapatosLogoText, storeNameOf(tienda));
  const items: any[] = carritoState || [];
  const errs = erroresForm || {};
  const form = formData || {};
  const subtotal = calcularSubtotal();
  const envio = calcularCostoEnvio();
  const total = calcularTotal();

  const deliveryOption = (value: 'ENVIO' | 'RECOJO', icon: string, label: string, extra?: string) => {
    const active = form.tipoEntrega === value;
    return (
      <label className="flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-4 text-[13.5px] font-semibold transition-shadow" style={{ boxShadow: `inset 0 0 0 ${active ? 2 : 1}px ${active ? t.primary : t.line}`, background: active ? mix(t.primary, 6, '#fff') : '#fff', color: t.ink }}>
        <input type="radio" className="sr-only" name="tipoEntrega" value={value} checked={active} onChange={handleChange} />
        <Icon icon={icon} width={21} style={{ color: t.primaryInk }} /> {label}
        {extra && <span className="ml-auto text-[12px]" style={{ color: t.muted }}>{extra}</span>}
      </label>
    );
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, fontFamily: t.font }}>
        <header className="border-b" style={{ borderColor: t.line }}>
          <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-4 lg:px-8">
            <button type="button" onClick={() => navigate(`/tienda/${slug}`)} className="flex items-center gap-2.5">
              {tienda?.logo ? <img src={tienda.logo} alt={storeName} className="h-10 w-auto max-w-[160px] object-contain" /> : <>
                <StrideMark color={t.primaryInk} />
                <span className="text-[16px] font-extrabold uppercase" style={displayStyle(t, { color: t.ink })}>{storeName}</span>
              </>}
            </button>
            <div className="flex items-center gap-2 text-[12.5px] font-semibold" style={{ color: t.muted }}><Icon icon="solar:shield-check-linear" width={19} style={{ color: t.primaryInk }} /> <span className="hidden sm:inline">Compra segura</span></div>
          </div>
        </header>

        <main className="mx-auto max-w-[1320px] px-4 py-8 lg:px-8">
          <button type="button" onClick={() => navigate(`/tienda/${slug}/catalogo`)} className="mb-5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: t.muted }}><Icon icon="solar:arrow-left-linear" width={16} /> Seguir comprando</button>
          <h1 className="text-[28px] font-extrabold uppercase leading-none sm:text-[36px]" style={displayStyle(t, { color: t.ink })}>{editable(diseno?.zapatosCheckoutTitle, 'Finalizar compra')}</h1>

          <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-start">
            <motion.div variants={stStagger} initial="hidden" animate="show" className="min-w-0 flex-1 space-y-5">
              {items.length === 0 ? (
                <motion.div variants={stItem} className="rounded-[24px] border border-dashed bg-white/60 px-8 py-16 text-center" style={{ borderColor: t.line }}>
                  <Icon icon="mdi:shoe-sneaker" width={64} className="mx-auto" style={{ color: t.muted }} />
                  <h2 className="mt-5 text-[18px] font-extrabold uppercase" style={displayStyle(t, { color: t.ink })}>Tu carrito está vacío</h2>
                  <button type="button" onClick={() => navigate(`/tienda/${slug}/catalogo`)} className="mt-6 rounded-full px-6 py-3 text-[13.5px] font-bold" style={{ background: t.primary, color: t.onPrimary }}>Ver catálogo</button>
                </motion.div>
              ) : (
                <>
                  <Block t={t} icon="solar:bag-4-linear" title="Tu pedido">
                    <ul className="divide-y" style={{ borderColor: t.line }}>
                      {items.map((item) => {
                        const id = item.cartId || item.id; const qty = Number(item.cantidad || 1); const price = Number(item.precioUnitario || 0);
                        return (
                          <li key={id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0" style={{ borderColor: t.line }}>
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl" style={{ background: t.soft }}>
                              {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-1.5 mix-blend-multiply" /> : <Icon icon="mdi:shoe-sneaker" width={30} style={{ color: t.muted }} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="line-clamp-2 text-[13.5px] font-bold leading-snug" style={{ color: t.ink }}>{item.descripcion}</h3>
                              <p className="mt-0.5 text-[12px]" style={{ color: t.muted }}>{stMoney(price)} c/u</p>
                              <button type="button" onClick={() => removeItem(id)} className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-rose-500"><Icon icon="solar:trash-bin-minimalistic-linear" width={14} /> Quitar</button>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex h-9 items-center overflow-hidden rounded-full border" style={{ borderColor: t.line }}>
                                <button type="button" aria-label="Restar" onClick={() => updateQuantity(id, qty - 1)} className="flex w-8 items-center justify-center text-base font-bold" style={{ color: t.muted }}>−</button>
                                <span className="w-7 text-center text-[13px] font-bold" style={{ color: t.ink }}>{qty}</span>
                                <button type="button" aria-label="Sumar" onClick={() => updateQuantity(id, qty + 1)} className="flex w-8 items-center justify-center text-base font-bold" style={{ color: t.muted }}>+</button>
                              </div>
                              <span className="text-[15px] font-extrabold" style={{ color: t.ink }}>{stMoney(price * qty)}</span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </Block>

                  {configEnvio && (configEnvio.aceptaEnvio || configEnvio.aceptaRecojo) && (
                    <Block t={t} icon="solar:delivery-linear" title="Entrega">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {configEnvio.aceptaEnvio && deliveryOption('ENVIO', 'solar:delivery-linear', 'Envío a domicilio', Number(configEnvio.costoEnvio) > 0 ? stMoney(Number(configEnvio.costoEnvio)) : undefined)}
                        {configEnvio.aceptaRecojo && deliveryOption('RECOJO', 'solar:shop-2-linear', 'Recojo en tienda', 'Gratis')}
                      </div>
                    </Block>
                  )}

                  <Block t={t} icon="solar:user-linear" title="Tus datos">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field t={t} error={errs.clienteNombre}><input type="text" name="clienteNombre" autoComplete="name" placeholder="Nombre completo *" value={form.clienteNombre || ''} onChange={handleChange} className={inputCls} /></Field>
                      <Field t={t} error={errs.clienteTelefono}><input type="tel" name="clienteTelefono" autoComplete="tel" placeholder="Celular *" value={form.clienteTelefono || ''} onChange={handleChange} className={inputCls} /></Field>
                      <Field t={t} className="sm:col-span-2"><input type="email" name="clienteEmail" autoComplete="email" placeholder="Correo (opcional)" value={form.clienteEmail || ''} onChange={handleChange} className={inputCls} /></Field>
                      {form.tipoEntrega === 'ENVIO' && (
                        <>
                          <Field t={t} error={errs.clienteDireccion} className="sm:col-span-2"><input type="text" name="clienteDireccion" autoComplete="street-address" placeholder="Dirección de entrega *" value={form.clienteDireccion || ''} onChange={handleChange} className={inputCls} /></Field>
                          <Field t={t} className="sm:col-span-2"><input type="text" name="clienteReferencia" placeholder="Referencia (opcional)" value={form.clienteReferencia || ''} onChange={handleChange} className={inputCls} /></Field>
                        </>
                      )}
                    </div>
                  </Block>

                  <Block t={t} icon="solar:card-linear" title="Pago">
                    <MedioPagoSelector configPago={configPago} value={form.medioPago} onChange={handleChange} accent={t.primary} radius="16px" />
                    {form.medioPago === 'TRANSFERENCIA' && configPago?.cuentasBancarias?.length > 0 && (
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {configPago.cuentasBancarias.map((c: any) => (
                          <div key={c.id} className="flex items-center gap-4 rounded-2xl p-4" style={{ background: t.soft }}>
                            <BancoLogo banco={c.banco} size={44} />
                            <div className="min-w-0"><p className="font-mono text-[13px] font-bold" style={{ color: t.ink }}>{c.numeroCuenta}</p>{c.cci && <p className="text-[11.5px]" style={{ color: t.muted }}>CCI: {c.cci}</p>}{c.titular && <p className="text-[11.5px]" style={{ color: t.muted }}>{c.titular}</p>}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Block>

                  <Block t={t} icon="solar:notes-linear" title="Nota (opcional)">
                    <Field t={t}><textarea name="observaciones" rows={3} placeholder="Talla a confirmar, horario de entrega, etc." value={form.observaciones || ''} onChange={handleChange} className="w-full resize-none appearance-none rounded-2xl border-0 bg-transparent bg-none p-4 text-[14px] font-medium text-stone-900 outline-none placeholder:text-stone-400 focus:ring-0" /></Field>
                  </Block>
                </>
              )}
            </motion.div>

            <motion.aside initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: stEase, delay: 0.1 }} className="w-full shrink-0 md:sticky md:top-6 md:w-[380px]">
              <div className="overflow-hidden rounded-[24px] border bg-white" style={{ borderColor: t.line }}>
                <div className="px-6 pb-4 pt-6">
                  <h2 className="text-[15px] font-extrabold uppercase" style={displayStyle(t, { color: t.ink })}>Resumen</h2>
                </div>
                <div className="max-h-64 space-y-3 overflow-y-auto border-b px-6 pb-4" style={{ borderColor: t.line }}>
                  {items.length === 0 ? <p className="py-6 text-center text-[13px]" style={{ color: t.muted }}>Sin productos.</p> : items.map((item) => (
                    <div key={item.cartId || item.id} className="grid grid-cols-[48px_1fr_auto] items-center gap-3">
                      <div className="relative"><div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl" style={{ background: t.soft }}>{item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" /> : <Icon icon="mdi:shoe-sneaker" style={{ color: t.muted }} />}</div><span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold" style={{ background: t.primary, color: t.onPrimary }}>{item.cantidad}</span></div>
                      <p className="line-clamp-2 text-[12px] font-medium leading-snug" style={{ color: t.ink }}>{item.descripcion}</p>
                      <span className="text-[12.5px] font-bold" style={{ color: t.ink }}>{stMoney(Number(item.precioUnitario || 0) * Number(item.cantidad || 1))}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 px-6 py-5">
                  <div className="flex justify-between text-[13px]" style={{ color: t.muted }}><span>Subtotal</span><span className="font-bold" style={{ color: t.ink }}>{stMoney(subtotal)}</span></div>
                  <div className="flex justify-between text-[13px]" style={{ color: t.muted }}><span>Envío</span><span className="font-bold" style={{ color: t.ink }}>{envio === 0 ? 'Gratis' : stMoney(envio)}</span></div>
                  {freeDeliveryThreshold > 0 && freeDeliveryRemaining > 0 && (
                    <div className="rounded-2xl px-3.5 py-2.5" style={{ background: t.soft }}>
                      <p className="text-[12px] font-semibold" style={{ color: t.ink }}>Agrega {stMoney(freeDeliveryRemaining)} para envío gratis</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full" style={{ width: `${freeDeliveryProgress}%`, background: t.primary }} /></div>
                    </div>
                  )}
                  {errs._minimo && <p className="rounded-2xl bg-rose-50 px-3.5 py-2.5 text-[12px] font-semibold text-rose-500">{errs._minimo}</p>}
                  <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: t.line }}><span className="text-[13px] font-bold uppercase" style={{ color: t.ink }}>Total</span><span className="text-[28px] font-extrabold" style={{ color: t.ink }}>{stMoney(total)}</span></div>
                  <button type="button" onClick={onSubmit} disabled={enviando || items.length === 0} className="flex h-[54px] w-full items-center justify-between rounded-full pl-6 pr-1.5 text-[14px] font-bold transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50" style={{ background: t.primary, color: t.onPrimary }}>
                    {enviando ? 'Procesando…' : editable(diseno?.zapatosCheckoutButton, 'Confirmar pedido')}
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90" style={{ color: t.ink }}><Icon icon={enviando ? 'solar:refresh-linear' : 'solar:arrow-right-linear'} width={18} className={enviando ? 'animate-spin' : ''} /></span>
                  </button>
                  <p className="text-center text-[11px]" style={{ color: t.muted }}>Revisas y confirmas tu pedido antes de enviarlo.</p>
                </div>
              </div>
            </motion.aside>
          </div>
        </main>

        {props.pedidoCreado && (
          <PaymentConfirmationModal
            isOpen={props.showPaymentModal}
            onClose={() => { props.setShowPaymentModal(false); window.location.href = `/tienda/${props.slug}/seguimiento?codigo=${props.pedidoCreado.codigoSeguimiento}`; }}
            orderData={{ id: props.pedidoCreado.id, codigoSeguimiento: props.pedidoCreado.codigoSeguimiento, total: props.pedidoCreado.total || props.calcularTotal(), medioPago: form.medioPago, tipoEntrega: form.tipoEntrega, clienteNombre: form.clienteNombre }}
            paymentConfig={props.configPago ? { yapeQR: props.configPago.yapeQR || props.configPago.yapeQrUrl || undefined, plinQR: props.configPago.plinQR || props.configPago.plinQrUrl || undefined, yapeNumero: props.configPago.yapeNumero || undefined, plinNumero: props.configPago.plinNumero || undefined, whatsappTienda: props.configPago?.whatsappTienda ?? props.tienda?.whatsappTienda ?? props.tienda?.diseno?.whatsappTienda, cuentasBancarias: props.configPago.cuentasBancarias || undefined } : undefined}
            storeSlug={props.slug || ''}
          />
        )}
        <ConfirmOrderModal isOpen={props.showConfirmModal} onClose={() => props.setShowConfirmModal(false)} onConfirm={props.enviarPedido} total={props.calcularTotal()} loading={props.enviando} tiendaColor={t.primary} />
      </div>
    </MotionConfig>
  );
}
