import type { ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { MotionConfig, motion } from 'framer-motion';
import ConfirmOrderModal from '@/components/tienda/ConfirmOrderModal';
import PaymentConfirmationModal from '@/components/tienda/PaymentConfirmationModal';
import { BancoLogo } from '@/components/shared/BancoLogo';
import MedioPagoSelector from '@/components/tienda/MedioPagoSelector';
import type { TemplateCheckoutPageProps } from '@/templates/shared/types';
import { Logo, Monogram, blushTheme, useBlushFont, editable, blMoney, btnCls, type Theme } from './BlushParts';
import { blEase, blItem, blStagger, mix } from './motion';

/** Campo sin bordes globales (border-0 + bg-none + focus:ring-0); el contorno es un box-shadow propio. */
function Field({ t, error, className = '', children }: { t: Theme; error?: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <div className="bg-white transition-shadow focus-within:shadow-[inset_0_0_0_1.5px_var(--bl-focus)]" style={{ boxShadow: `inset 0 0 0 1px ${error ? '#F43F5E' : t.line}`, ['--bl-focus' as any]: t.ink }}>
        {children}
      </div>
      {error && <p className="mt-1.5 text-[12px] text-rose-500">{error}</p>}
    </div>
  );
}
const inputCls = 'h-12 w-full appearance-none rounded-none border-0 bg-transparent bg-none px-4 text-[14px] text-stone-900 outline-none placeholder:text-stone-400 focus:ring-0';

function Block({ t, step, title, children }: { t: Theme; step: number; title: string; children: ReactNode }) {
  return (
    <motion.section variants={blItem} className="border bg-white p-5 sm:p-7" style={{ borderColor: t.line }}>
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold" style={{ background: t.blush, color: t.ink }}>{step}</span>
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: t.ink }}>{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

export default function BlushCheckoutPage(props: TemplateCheckoutPageProps) {
  const {
    slug, tienda, diseno, carritoState, updateQuantity, removeItem, formData, erroresForm, handleChange,
    configPago, configEnvio, enviando, calcularSubtotal, calcularCostoEnvio, calcularTotal,
    freeDeliveryThreshold, freeDeliveryRemaining, freeDeliveryProgress, onSubmit,
  } = props as any;

  useBlushFont();
  const navigate = useNavigate();
  const t = blushTheme(diseno);
  const items: any[] = carritoState || [];
  const errs = erroresForm || {};
  const form = formData || {};
  const subtotal = calcularSubtotal();
  const envio = calcularCostoEnvio();
  const total = calcularTotal();
  const hasDelivery = Boolean(configEnvio && (configEnvio.aceptaEnvio || configEnvio.aceptaRecojo));
  let step = 1;

  const deliveryOption = (value: 'ENVIO' | 'RECOJO', icon: string, label: string, extra?: string) => {
    const active = form.tipoEntrega === value;
    return (
      <label className="flex cursor-pointer items-center gap-3 px-4 py-4 text-[13.5px] transition-shadow" style={{ boxShadow: `inset 0 0 0 ${active ? 1.5 : 1}px ${active ? t.ink : t.line}`, background: active ? t.blushSoft : '#fff', color: t.ink }}>
        <input type="radio" className="sr-only" name="tipoEntrega" value={value} checked={active} onChange={handleChange} />
        <Icon icon={icon} width={20} /> {label}
        {extra && <span className="ml-auto text-[12px]" style={{ color: t.muted }}>{extra}</span>}
      </label>
    );
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden" style={{ background: mix(t.primary, 3, '#FAF9F8'), fontFamily: t.font }}>
        <header className="border-b bg-white" style={{ borderColor: t.line }}>
          <div className="mx-auto grid h-[76px] max-w-[1320px] grid-cols-[1fr_auto_1fr] items-center px-4 lg:px-8">
            <button type="button" onClick={() => navigate(`/tienda/${slug}/catalogo`)} className="inline-flex items-center gap-1.5 justify-self-start text-[11px] uppercase tracking-[0.14em]" style={{ color: t.muted }}><Icon icon="solar:arrow-left-linear" width={15} /> <span className="hidden sm:inline">Seguir comprando</span></button>
            <Logo tienda={tienda} diseno={diseno} t={t} onClick={() => navigate(`/tienda/${slug}`)} />
            <div className="flex items-center gap-2 justify-self-end text-[11px] uppercase tracking-[0.14em]" style={{ color: t.muted }}><Icon icon="solar:lock-keyhole-minimalistic-linear" width={17} style={{ color: t.ink }} /> <span className="hidden sm:inline">Compra segura</span></div>
          </div>
        </header>

        <main className="mx-auto max-w-[1320px] px-4 py-10 lg:px-8">
          <h1 className="text-[28px] font-semibold uppercase tracking-[0.04em] sm:text-[36px]" style={{ color: t.ink }}>{editable(diseno?.maquillajeCheckoutTitle, 'Finalizar compra')}</h1>

          <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-start">
            <motion.div variants={blStagger} initial="hidden" animate="show" className="min-w-0 flex-1 space-y-4">
              {items.length === 0 ? (
                <motion.div variants={blItem} className="px-8 py-16 text-center" style={{ background: t.blushSoft }}>
                  <Icon icon="solar:bag-3-linear" width={48} className="mx-auto" style={{ color: t.primaryInk }} />
                  <h2 className="mt-5 text-[22px]" style={{ color: t.ink, fontFamily: t.serif }}>Tu bolsa está vacía</h2>
                  <button type="button" onClick={() => navigate(`/tienda/${slug}/catalogo`)} className={`${btnCls} mt-6 h-11 px-7`} style={{ background: t.accent, color: t.onAccent }}>Ver catálogo</button>
                </motion.div>
              ) : (
                <>
                  <Block t={t} step={step++} title="Tu pedido">
                    <ul className="divide-y" style={{ borderColor: t.line }}>
                      {items.map((item) => {
                        const id = item.cartId || item.id; const qty = Number(item.cantidad || 1); const price = Number(item.precioUnitario || 0);
                        return (
                          <li key={id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0" style={{ borderColor: t.line }}>
                            <div className="h-20 w-16 shrink-0 overflow-hidden" style={{ background: t.card }}>
                              {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-1.5 mix-blend-multiply" /> : <Monogram t={t} text={item.descripcion} size={26} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="line-clamp-2 text-[13.5px] font-medium leading-snug" style={{ color: t.ink }}>{item.descripcion}</h3>
                              <p className="mt-0.5 text-[12px]" style={{ color: t.muted }}>{blMoney(price)} c/u</p>
                              <button type="button" onClick={() => removeItem(id)} className="mt-1 text-[11.5px] underline underline-offset-4" style={{ color: t.muted }}>Quitar</button>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex h-9 items-center" style={{ boxShadow: `inset 0 0 0 1px ${t.line}` }}>
                                <button type="button" aria-label="Restar" onClick={() => updateQuantity(id, qty - 1)} className="flex w-8 items-center justify-center" style={{ color: t.muted }}>−</button>
                                <span className="w-7 text-center text-[13px] font-medium" style={{ color: t.ink }}>{qty}</span>
                                <button type="button" aria-label="Sumar" onClick={() => updateQuantity(id, qty + 1)} className="flex w-8 items-center justify-center" style={{ color: t.muted }}>+</button>
                              </div>
                              <span className="text-[14px] font-semibold" style={{ color: t.ink }}>{blMoney(price * qty)}</span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </Block>

                  {hasDelivery && (
                    <Block t={t} step={step++} title="Entrega">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {configEnvio.aceptaEnvio && deliveryOption('ENVIO', 'solar:delivery-linear', 'Envío a domicilio', Number(configEnvio.costoEnvio) > 0 ? blMoney(Number(configEnvio.costoEnvio)) : undefined)}
                        {configEnvio.aceptaRecojo && deliveryOption('RECOJO', 'solar:shop-2-linear', 'Recojo en tienda', 'Gratis')}
                      </div>
                    </Block>
                  )}

                  <Block t={t} step={step++} title="Tus datos">
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

                  <Block t={t} step={step++} title="Pago">
                    <MedioPagoSelector configPago={configPago} value={form.medioPago} onChange={handleChange} accent={t.ink} radius="2px" />
                    {form.medioPago === 'TRANSFERENCIA' && configPago?.cuentasBancarias?.length > 0 && (
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {configPago.cuentasBancarias.map((c: any) => (
                          <div key={c.id} className="flex items-center gap-4 p-4" style={{ background: t.blushSoft }}>
                            <BancoLogo banco={c.banco} size={44} />
                            <div className="min-w-0"><p className="font-mono text-[13px] font-semibold" style={{ color: t.ink }}>{c.numeroCuenta}</p>{c.cci && <p className="text-[11.5px]" style={{ color: t.muted }}>CCI: {c.cci}</p>}{c.titular && <p className="text-[11.5px]" style={{ color: t.muted }}>{c.titular}</p>}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Block>

                  <Block t={t} step={step++} title="Nota (opcional)">
                    <Field t={t}><textarea name="observaciones" rows={3} placeholder="Tono elegido, horario de entrega, referencia…" value={form.observaciones || ''} onChange={handleChange} className="w-full resize-none appearance-none rounded-none border-0 bg-transparent bg-none p-4 text-[14px] text-stone-900 outline-none placeholder:text-stone-400 focus:ring-0" /></Field>
                  </Block>
                </>
              )}
            </motion.div>

            <motion.aside initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: blEase, delay: 0.1 }} className="w-full shrink-0 md:sticky md:top-6 md:w-[380px]">
              <div className="border bg-white" style={{ borderColor: t.line }}>
                <div className="px-6 pb-4 pt-6"><h2 className="text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: t.ink }}>Resumen</h2></div>
                <div className="max-h-64 space-y-3 overflow-y-auto border-b px-6 pb-4" style={{ borderColor: t.line }}>
                  {items.length === 0 ? <p className="py-6 text-center text-[13px]" style={{ color: t.muted }}>Sin productos.</p> : items.map((item) => (
                    <div key={item.cartId || item.id} className="grid grid-cols-[44px_1fr_auto] items-center gap-3">
                      <div className="relative"><div className="h-14 w-11 overflow-hidden" style={{ background: t.card }}>{item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" /> : <Monogram t={t} text={item.descripcion} size={18} />}</div><span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-semibold" style={{ background: t.accent, color: t.onAccent }}>{item.cantidad}</span></div>
                      <p className="line-clamp-2 text-[12px] leading-snug" style={{ color: t.ink }}>{item.descripcion}</p>
                      <span className="text-[12.5px] font-medium" style={{ color: t.ink }}>{blMoney(Number(item.precioUnitario || 0) * Number(item.cantidad || 1))}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 px-6 py-5">
                  <div className="flex justify-between text-[13px]" style={{ color: t.muted }}><span>Subtotal</span><span className="font-medium" style={{ color: t.ink }}>{blMoney(subtotal)}</span></div>
                  <div className="flex justify-between text-[13px]" style={{ color: t.muted }}><span>Envío</span><span className="font-medium" style={{ color: t.ink }}>{envio === 0 ? 'Gratis' : blMoney(envio)}</span></div>
                  {freeDeliveryThreshold > 0 && freeDeliveryRemaining > 0 && (
                    <div className="px-3.5 py-2.5" style={{ background: t.blushSoft }}>
                      <p className="text-[12px]" style={{ color: t.ink }}>Agrega {blMoney(freeDeliveryRemaining)} para envío gratis</p>
                      <div className="mt-2 h-[3px] overflow-hidden bg-white"><div className="h-full" style={{ width: `${freeDeliveryProgress}%`, background: t.ink }} /></div>
                    </div>
                  )}
                  {errs._minimo && <p className="bg-rose-50 px-3.5 py-2.5 text-[12px] text-rose-500">{errs._minimo}</p>}
                  <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: t.line }}><span className="text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: t.ink }}>Total</span><span className="text-[26px] font-semibold" style={{ color: t.ink }}>{blMoney(total)}</span></div>
                  <button type="button" onClick={onSubmit} disabled={enviando || items.length === 0} className={`${btnCls} h-[52px] w-full disabled:cursor-not-allowed disabled:opacity-50`} style={{ background: t.accent, color: t.onAccent }}>
                    {enviando ? <><Icon icon="solar:refresh-linear" className="animate-spin" width={16} /> Procesando…</> : editable(diseno?.maquillajeCheckoutButton, 'Confirmar pedido')}
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
        <ConfirmOrderModal isOpen={props.showConfirmModal} onClose={() => props.setShowConfirmModal(false)} onConfirm={props.enviarPedido} total={props.calcularTotal()} loading={props.enviando} tiendaColor={t.accent} />
      </div>
    </MotionConfig>
  );
}
