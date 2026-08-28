import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { FM, FmCartModal, FmFooter, FmHeader, FmWhatsAppFab, fmFont, fmPrimary, waLink, withAlpha } from './FreshMartParts';
import { fmCard, fmPage, fmSection, fmStagger, fmTap, fmViewport } from './motion';

function pickContact(tienda: any, diseno: any) {
  return {
    address: diseno?.supermercadoContactAddress || tienda?.direccionTienda || tienda?.direccionFiscal || tienda?.direccion || '',
    phone: diseno?.supermercadoContactPhone || tienda?.whatsappTienda || tienda?.telefono || tienda?.celular || '',
    email: diseno?.supermercadoContactEmail || tienda?.email || tienda?.correo || '',
    hours: diseno?.supermercadoContactHours || tienda?.horarioAtencion || '',
  };
}

export default function FreshMartContactPage({
  tienda, slug, diseno, cp, allCategories = [], carrito = [], setCarrito, mostrarCarrito = false, setMostrarCarrito, actualizarCantidad, onNavigate,
}: {
  tienda: any; slug: string; diseno: any; cp: string; allCategories?: any[]; carrito?: any[];
  setCarrito?: (items: any[]) => void; mostrarCarrito?: boolean; setMostrarCarrito?: (v: boolean) => void;
  actualizarCantidad?: (id: any, cantidad: number) => void;
  onNavigate?: (page: 'home' | 'catalogo' | 'producto' | 'checkout' | 'contacto') => void;
}) {
  const primary = fmPrimary(cp);
  const font = fmFont(diseno);
  const [sent, setSent] = useState(false);
  const contact = pickContact(tienda, diseno);
  const mapQuery = encodeURIComponent(contact.address || tienda?.nombreComercial || tienda?.razonSocial || 'Peru');
  const displayAddress = contact.address || 'Dirección no configurada';
  const displayPhone = contact.phone || 'Teléfono no configurado';
  const displayEmail = contact.email || 'Correo no configurado';
  const displayHours = contact.hours || 'Lun a Dom · 8:00 – 22:00';
  const cartTotal = carrito.reduce((s, i) => s + Number(i.precioUnitario || 0) * Number(i.cantidad || 1), 0);

  const go = (page: 'home' | 'catalogo' | 'checkout' | 'contacto') => { if (onNavigate) { onNavigate(page); return; } window.location.href = page === 'home' ? `/tienda/${slug}` : `/tienda/${slug}/${page}`; };
  const inputCls = 'mt-2 h-12 w-full rounded-lg border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition-colors focus:border-[var(--fm-cp)]';

  return (
    <motion.div initial="hidden" animate="show" variants={fmPage} className="min-h-screen" style={{ backgroundColor: FM.soft, fontFamily: font, ['--fm-cp' as any]: primary }}>
      <FmHeader tienda={tienda} slug={slug} cp={primary} diseno={diseno} carritoSize={carrito.reduce((s, i) => s + Number(i.cantidad || 1), 0)} cartTotal={cartTotal} onOpenCart={() => setMostrarCarrito?.(true)} allCategories={allCategories} onSearchSubmit={(e, v) => { e.preventDefault(); const t = v?.trim(); if (t) window.location.href = `/tienda/${slug}/catalogo?search=${encodeURIComponent(t)}`; }} />

      <div className="border-b bg-white" style={{ borderColor: FM.line }}>
        <div className="mx-auto max-w-7xl px-5 py-8 text-center md:px-6 md:py-12">
          <div className="text-xs font-medium" style={{ color: FM.inkSoft }}><button type="button" onClick={() => go('home')} className="hover:text-neutral-900">Inicio</button><span className="mx-2">/</span><span style={{ color: FM.ink }}>Contacto</span></div>
          <h1 className="mt-2 text-3xl font-extrabold md:text-4xl" style={{ fontFamily: FM.display, color: FM.ink }}>{diseno?.supermercadoContactHeading || 'Estamos para ayudarte'}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: FM.inkSoft }}>{diseno?.supermercadoContactSubheading || '¿Tienes una consulta sobre tu pedido o nuestros productos? Escríbenos y te respondemos rápido.'}</p>
        </div>
      </div>

      <motion.main variants={fmSection} className="mx-auto max-w-7xl px-5 py-12 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <motion.div variants={fmCard} className="min-h-[400px] overflow-hidden rounded-xl border bg-white md:min-h-[540px]" style={{ borderColor: FM.line }}>
            <iframe title="Mapa de contacto" src={`https://www.google.com/maps?q=${mapQuery}&output=embed`} className="h-full min-h-[400px] w-full border-0 md:min-h-[540px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </motion.div>
          <motion.form variants={fmCard} className="rounded-xl border bg-white p-6 md:p-8" style={{ borderColor: FM.line }} onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
            <h2 className="text-xl font-bold" style={{ fontFamily: FM.display, color: FM.ink }}>{diseno?.supermercadoContactTitle || 'Escríbenos'}</h2>
            <p className="mt-1.5 text-sm" style={{ color: FM.inkSoft }}>Completa el formulario o contáctanos por WhatsApp.</p>
            <label className="mt-5 block text-[11px] font-bold uppercase tracking-wide" style={{ color: FM.inkSoft }}>Tu nombre<input required className={inputCls} /></label>
            <label className="mt-4 block text-[11px] font-bold uppercase tracking-wide" style={{ color: FM.inkSoft }}>Tu correo<input required type="email" className={inputCls} /></label>
            <label className="mt-4 block text-[11px] font-bold uppercase tracking-wide" style={{ color: FM.inkSoft }}>Tu mensaje<textarea rows={5} className="mt-2 w-full resize-none rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-900 outline-none transition-colors focus:border-[var(--fm-cp)]" /></label>
            {sent && <p className="mt-4 rounded-lg px-4 py-3 text-sm font-medium" style={{ backgroundColor: withAlpha(primary, '18'), color: FM.greenDark }}>¡Gracias! Mensaje registrado en esta vista. Configura el canal de contacto de la tienda para recibirlo.</p>}
            <motion.button type="submit" className="mt-5 w-full rounded-lg py-3.5 text-sm font-bold text-white shadow-lg" style={{ backgroundColor: primary }} whileHover={{ scale: 1.02, y: -2 }} whileTap={fmTap}>{diseno?.supermercadoContactSubmitLabel || 'Enviar mensaje'}</motion.button>
            <a href={waLink(tienda, 'Hola, quiero hacer una consulta')} target="_blank" rel="noreferrer" className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-sm font-bold transition-colors" style={{ borderColor: '#25D366', color: '#128C4B' }}><Icon icon="mdi:whatsapp" width={18} /> Escríbenos por WhatsApp</a>
          </motion.form>
        </div>
        <motion.section initial="hidden" whileInView="show" viewport={fmViewport} variants={fmStagger} className="mt-8 grid gap-4 md:grid-cols-4">
          {[['solar:map-point-linear', 'Dirección', displayAddress], ['solar:phone-linear', 'Teléfono', displayPhone], ['solar:letter-linear', 'Correo', displayEmail], ['solar:clock-circle-linear', 'Horario', displayHours]].map(([icon, label, text], i) => (
            <motion.div key={`${label}-${i}`} variants={fmCard} className="rounded-xl border bg-white p-5" style={{ borderColor: FM.line }}>
              <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: FM.greenSoft, color: FM.greenDark }}><Icon icon={icon} width={20} /></span>
              <p className="mt-3.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: FM.green }}>{label}</p>
              <p className="mt-1 text-sm leading-6" style={{ color: FM.ink }}>{text}</p>
            </motion.div>
          ))}
        </motion.section>
      </motion.main>

      <FmFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <FmWhatsAppFab tienda={tienda} />
      {setCarrito && actualizarCantidad && <FmCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito?.(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => go('checkout')} cp={primary} tienda={tienda} />}
    </motion.div>
  );
}
