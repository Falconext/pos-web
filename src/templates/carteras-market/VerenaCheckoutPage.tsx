import type { ChangeEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { MotionConfig, motion } from 'framer-motion';
import ConfirmOrderModal from '@/components/tienda/ConfirmOrderModal';
import PaymentConfirmationModal from '@/components/tienda/PaymentConfirmationModal';
import { BancoLogo } from '@/components/shared/BancoLogo';
import MedioPagoSelector from '@/components/tienda/MedioPagoSelector';
import type { TemplateCheckoutPageProps } from '@/templates/shared/types';
import { verenaTheme, useVerenaFont, ed, vrMoney, storeNameOf, type Theme } from './VerenaParts';
import { vrEase, vrHeroText, vrStagger } from './motion';

export default function VerenaCheckoutPage(props: TemplateCheckoutPageProps) {
  const {
    slug, tienda, diseno, carritoState, updateQuantity, removeItem, formData, erroresForm, handleChange,
    configPago, configEnvio, enviando, calcularSubtotal, calcularCostoEnvio, calcularTotal,
    freeDeliveryThreshold, freeDeliveryRemaining, freeDeliveryProgress, onSubmit,
  } = props;

  useVerenaFont();
  const navigate = useNavigate();
  const t = verenaTheme(diseno);
  const storeName = storeNameOf(tienda) || 'la tienda';
  const items: any[] = carritoState || [];
  const subtotal = calcularSubtotal();
  const envio = calcularCostoEnvio();
  const total = calcularTotal();
  const errors = erroresForm || {};
  const form = formData || {};

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, fontFamily: t.font }}>
        <header className="border-b bg-white" style={{ borderColor: t.line }}>
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-6">
            <button type="button" onClick={() => navigate(`/tienda/${slug}`)} className="flex items-center gap-2.5">
              {tienda?.logo ? <img src={tienda.logo} alt={storeName} className="h-10 w-auto max-w-[160px] object-contain" /> : (
                <>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: t.primary, color: t.onPrimary }}><Icon icon="solar:bag-4-bold" width={22} /></span>
                  <span className="text-[19px] font-extrabold tracking-[-0.02em]" style={{ color: t.ink }}>{storeName}</span>
                </>
              )}
            </button>
            <span className="inline-flex items-center gap-2 text-[13.5px] font-semibold" style={{ color: t.primary }}>
              <Icon icon="solar:shield-check-linear" width={19} /> Compra segura
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-10 lg:px-6">
          <motion.div variants={vrStagger} initial="hidden" animate="show">
            <motion.button variants={vrHeroText} type="button" onClick={() => navigate(`/tienda/${slug}/catalogo`)} className="inline-flex items-center gap-1.5 text-[13.5px] font-medium" style={{ color: t.muted }}>
              <Icon icon="solar:arrow-left-linear" width={16} /> Seguir comprando
            </motion.button>
            <motion.h1 variants={vrHeroText} className="mt-3 text-[36px] font-bold leading-tight tracking-[-0.02em] sm:text-[42px]" style={{ color: t.ink, fontFamily: t.serif }}>
              {ed(diseno, 'CheckoutTitle', 'Finalizar compra')}
            </motion.h1>
          </motion.div>

          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
            <section className="min-w-0 flex-1 space-y-5">
              {items.length === 0 ? (
                <div className="rounded-3xl border border-dashed bg-white px-8 py-16 text-center" style={{ borderColor: t.line }}>
                  <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full" style={{ background: t.cream, color: t.primary }}><Icon icon="solar:bag-3-linear" width={38} /></span>
                  <h2 className="mt-5 text-[22px] font-bold" style={{ color: t.ink }}>Tu carrito está vacío</h2>
                  <button type="button" onClick={() => navigate(`/tienda/${slug}/catalogo`)} className="mt-6 rounded-xl px-6 py-3 text-[14.5px] font-bold" style={{ background: t.primary, color: t.onPrimary }}>Ver la colección</button>
                </div>
              ) : (
                <>
                  <Card t={t} step={1} icon="solar:bag-3-linear" title="Productos del pedido">
                    <ul className="divide-y" style={{ borderColor: t.line }}>
                      {items.map((item) => {
                        const id = item.cartId || item.id;
                        const qty = Number(item.cantidad || 1);
                        const price = Number(item.precioUnitario || 0);
                        return (
                          <li key={id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0" style={{ borderColor: t.line }}>
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl" style={{ background: t.tile }}>
                              {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-1.5 mix-blend-multiply" /> : <Icon icon="solar:bag-4-bold-duotone" width={30} style={{ color: t.primary }} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="line-clamp-2 text-[14.5px] font-semibold leading-snug" style={{ color: t.ink }}>{item.descripcion}</h3>
                              <p className="mt-0.5 text-[13px]" style={{ color: t.muted }}>{vrMoney(price)} c/u</p>
                              <button type="button" onClick={() => removeItem(id)} className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-semibold text-rose-500"><Icon icon="solar:trash-bin-minimalistic-linear" width={14} /> Quitar</button>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex h-9 items-center overflow-hidden rounded-lg border" style={{ borderColor: t.line }}>
                                <button type="button" aria-label="Restar" onClick={() => updateQuantity(id, qty - 1)} className="w-8 text-[16px] font-semibold hover:bg-black/[0.04]" style={{ color: t.muted }}>−</button>
                                <span className="flex w-9 items-center justify-center text-[14px] font-bold" style={{ color: t.ink }}>{qty}</span>
                                <button type="button" aria-label="Sumar" onClick={() => updateQuantity(id, qty + 1)} className="w-8 text-[16px] font-semibold hover:bg-black/[0.04]" style={{ color: t.muted }}>+</button>
                              </div>
                              <span className="text-[16px] font-bold" style={{ color: t.ink }}>{vrMoney(price * qty)}</span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </Card>

                  {configEnvio && (configEnvio.aceptaEnvio || configEnvio.aceptaRecojo) && (
                    <Card t={t} step={2} icon="solar:delivery-linear" title="¿Cómo quieres recibirlo?">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {configEnvio.aceptaEnvio && (
                          <DeliveryOption t={t} name="tipoEntrega" value="ENVIO" checked={form.tipoEntrega === 'ENVIO'} onChange={handleChange} icon="solar:delivery-linear" title="Envío a domicilio" sub={Number(configEnvio.costoEnvio) > 0 ? vrMoney(Number(configEnvio.costoEnvio)) : 'Costo según tu zona'} />
                        )}
                        {configEnvio.aceptaRecojo && (
                          <DeliveryOption t={t} name="tipoEntrega" value="RECOJO" checked={form.tipoEntrega === 'RECOJO'} onChange={handleChange} icon="solar:shop-2-linear" title="Recojo en tienda" sub="Sin costo" />
                        )}
                      </div>
                    </Card>
                  )}

                  <Card t={t} step={3} icon="solar:user-linear" title="Tus datos">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field t={t} label="Nombre completo *" error={errors.clienteNombre}><input type="text" name="clienteNombre" autoComplete="name" value={form.clienteNombre || ''} onChange={handleChange} className={inputCls} placeholder="Como aparece en tu DNI" /></Field>
                      <Field t={t} label="Teléfono *" error={errors.clienteTelefono}><input type="tel" name="clienteTelefono" autoComplete="tel" value={form.clienteTelefono || ''} onChange={handleChange} className={inputCls} placeholder="9XX XXX XXX" /></Field>
                      <Field t={t} label="Correo (opcional)" className="sm:col-span-2"><input type="email" name="clienteEmail" autoComplete="email" value={form.clienteEmail || ''} onChange={handleChange} className={inputCls} placeholder="tucorreo@ejemplo.com" /></Field>
                      {form.tipoEntrega === 'ENVIO' && (
                        <>
                          <Field t={t} label="Dirección de entrega *" error={errors.clienteDireccion} className="sm:col-span-2"><input type="text" name="clienteDireccion" autoComplete="street-address" value={form.clienteDireccion || ''} onChange={handleChange} className={inputCls} placeholder="Calle, número, distrito" /></Field>
                          <Field t={t} label="Referencia (opcional)" className="sm:col-span-2"><input type="text" name="clienteReferencia" value={form.clienteReferencia || ''} onChange={handleChange} className={inputCls} placeholder="Frente a…, piso, interior" /></Field>
                        </>
                      )}
                    </div>
                  </Card>

                  <Card t={t} step={4} icon="solar:wallet-linear" title="Método de pago">
                    <MedioPagoSelector configPago={configPago} value={form.medioPago} onChange={handleChange} accent={t.primary} radius="12px" />
                    {form.medioPago === 'TRANSFERENCIA' && configPago?.cuentasBancarias?.length > 0 && (
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {configPago.cuentasBancarias.map((c: any) => (
                          <div key={c.id} className="flex items-center gap-4 rounded-xl border p-4" style={{ borderColor: t.line, background: t.cream }}>
                            <BancoLogo banco={c.banco} size={44} />
                            <div className="min-w-0"><p className="font-mono text-[14px] font-bold" style={{ color: t.ink }}>{c.numeroCuenta}</p>{c.cci && <p className="text-[12px]" style={{ color: t.muted }}>CCI: {c.cci}</p>}{c.titular && <p className="text-[12px]" style={{ color: t.muted }}>{c.titular}</p>}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  <Card t={t} icon="solar:notes-linear" title="Nota del pedido (opcional)">
                    <div className="rounded-xl border bg-white px-4 py-3" style={{ borderColor: t.line }}>
                      <textarea name="observaciones" value={form.observaciones || ''} onChange={handleChange} rows={3} placeholder="Color preferido, horario de entrega, envoltura de regalo…" className="w-full resize-none border-0 bg-transparent bg-none p-0 text-[14.5px] outline-none placeholder:text-[#A3A7A9] focus:ring-0" style={{ color: t.ink }} />
                    </div>
                  </Card>
                </>
              )}
            </section>

            <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-[380px]">
              <div className="overflow-hidden rounded-3xl border bg-white" style={{ borderColor: t.line }}>
                <div className="px-6 pb-4 pt-6">
                  <h2 className="text-[20px] font-bold" style={{ color: t.ink }}>Resumen del pedido</h2>
                  <p className="text-[13px]" style={{ color: t.muted }}>{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
                </div>
                <ul className="max-h-64 space-y-3 overflow-y-auto border-y px-6 py-4" style={{ borderColor: t.line }}>
                  {items.map((item) => (
                    <li key={item.cartId || item.id} className="grid grid-cols-[48px_1fr_auto] items-center gap-3">
                      <div className="relative flex h-12 w-12 items-center justify-center rounded-lg" style={{ background: t.tile }}>
                        {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" /> : <Icon icon="solar:bag-4-linear" style={{ color: t.primary }} />}
                        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10.5px] font-bold" style={{ background: t.primary, color: t.onPrimary }}>{item.cantidad}</span>
                      </div>
                      <p className="line-clamp-2 text-[12.5px] leading-snug" style={{ color: t.muted }}>{item.descripcion}</p>
                      <span className="text-[13px] font-bold" style={{ color: t.ink }}>{vrMoney(Number(item.precioUnitario || 0) * Number(item.cantidad || 1))}</span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-3 px-6 py-5">
                  <Row t={t} label="Subtotal" value={vrMoney(subtotal)} />
                  <Row t={t} label="Envío" value={envio === 0 ? 'Gratis' : vrMoney(envio)} />
                  {freeDeliveryThreshold > 0 && freeDeliveryRemaining > 0 && (
                    <div className="rounded-xl px-3.5 py-3" style={{ background: t.cream }}>
                      <p className="text-[12.5px] font-semibold" style={{ color: t.primary }}>Agrega {vrMoney(freeDeliveryRemaining)} y tu envío es gratis</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white"><motion.div className="h-full rounded-full" style={{ background: t.primary }} initial={false} animate={{ width: `${freeDeliveryProgress}%` }} transition={{ duration: 0.5, ease: vrEase }} /></div>
                    </div>
                  )}
                  {errors._minimo && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-rose-600">{errors._minimo}</p>}
                  <div className="flex items-baseline justify-between border-t pt-4" style={{ borderColor: t.line }}>
                    <span className="text-[15px] font-bold" style={{ color: t.ink }}>Total</span>
                    <span className="text-[30px] font-bold tracking-[-0.02em]" style={{ color: t.ink }}>{vrMoney(total)}</span>
                  </div>
                  <motion.button type="button" whileHover={enviando || !items.length ? undefined : { y: -2 }} whileTap={enviando || !items.length ? undefined : { scale: 0.98 }} onClick={onSubmit} disabled={enviando || items.length === 0} className="flex h-[54px] w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold disabled:cursor-not-allowed disabled:opacity-50" style={{ background: t.primary, color: t.onPrimary }}>
                    {enviando ? <><Icon icon="solar:refresh-linear" className="animate-spin" width={18} /> Procesando…</> : <>{ed(diseno, 'CheckoutButton', 'Confirmar pedido')} <Icon icon="solar:arrow-right-linear" width={19} /></>}
                  </motion.button>
                  <p className="flex items-center justify-center gap-1.5 text-[12px]" style={{ color: t.muted }}><Icon icon="solar:lock-keyhole-minimalistic-linear" width={14} /> Recibirás un código para seguir tu pedido</p>
                </div>
              </div>
            </aside>
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

const inputCls = 'h-6 w-full min-w-0 border-0 bg-transparent bg-none p-0 text-[14.5px] font-medium text-[#17191B] outline-none placeholder:font-normal placeholder:text-[#A3A7A9] focus:ring-0';

function Card({ t, step, icon, title, children }: { t: Theme; step?: number; icon: string; title: string; children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: vrEase }} className="rounded-3xl border bg-white p-6" style={{ borderColor: t.line }}>
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: t.cream, color: t.primary }}><Icon icon={icon} width={21} /></span>
        <h2 className="text-[17px] font-bold" style={{ color: t.ink }}>{step ? <span style={{ color: t.muted }}>{step}. </span> : null}{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

/** Contenedor con borde (el input va sin borde para no chocar con los estilos globales de formularios). */
function Field({ t, label, error, className = '', children }: { t: Theme; label: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[12.5px] font-semibold" style={{ color: t.muted }}>{label}</span>
      <span className="flex h-12 items-center rounded-xl border bg-white px-4 transition-shadow focus-within:shadow-[0_0_0_3px_rgba(31,59,45,0.12)]" style={{ borderColor: error ? '#F43F5E' : t.line }}>{children}</span>
      {error && <span className="mt-1 block text-[12px] font-medium text-rose-500">{error}</span>}
    </label>
  );
}

function DeliveryOption({ t, name, value, checked, onChange, icon, title, sub }: { t: Theme; name: string; value: string; checked: boolean; onChange: (e: ChangeEvent<any>) => void; icon: string; title: string; sub: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-4 transition-colors" style={checked ? { borderColor: t.primary, background: t.cream } : { borderColor: t.line }}>
      <input type="radio" className="hidden" name={name} value={value} checked={checked} onChange={onChange} />
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={checked ? { background: t.primary, color: t.onPrimary } : { background: t.cream, color: t.ink }}><Icon icon={icon} width={21} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-bold" style={{ color: t.ink }}>{title}</span>
        <span className="block text-[12.5px]" style={{ color: t.muted }}>{sub}</span>
      </span>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2" style={{ borderColor: checked ? t.primary : '#CFC8BD' }}>
        {checked && <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.primary }} />}
      </span>
    </label>
  );
}

function Row({ t, label, value }: { t: Theme; label: string; value: string }) {
  return (
    <div className="flex justify-between text-[14px]">
      <span style={{ color: t.muted }}>{label}</span>
      <span className="font-semibold" style={{ color: t.ink }}>{value}</span>
    </div>
  );
}
