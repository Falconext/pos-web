import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { GRO, GroCartModal, GroFooter, GroHeader, GroWhatsAppFab, groFont, groPrimary, waLink, withAlpha } from './GroginParts';
import { groCard, groPage, groSection, groStagger, groTap, groViewport } from './motion';

function pickContact(tienda: any, diseno: any) {
  return {
    address: diseno?.abarrotesContactAddress || tienda?.direccionTienda || tienda?.direccionFiscal || tienda?.direccion || '',
    phone: diseno?.abarrotesContactPhone || tienda?.whatsappTienda || tienda?.telefono || tienda?.celular || '',
    email: diseno?.abarrotesContactEmail || tienda?.email || tienda?.correo || '',
    hours: diseno?.abarrotesContactHours || tienda?.horarioAtencion || '',
  };
}

export default function GroginContactPage({
  tienda,
  slug,
  diseno,
  cp,
  allCategories = [],
  carrito = [],
  setCarrito,
  mostrarCarrito = false,
  setMostrarCarrito,
  actualizarCantidad,
  onNavigate,
}: {
  tienda: any;
  slug: string;
  diseno: any;
  cp: string;
  allCategories?: any[];
  carrito?: any[];
  setCarrito?: (items: any[]) => void;
  mostrarCarrito?: boolean;
  setMostrarCarrito?: (value: boolean) => void;
  actualizarCantidad?: (id: any, cantidad: number) => void;
  onNavigate?: (page: 'home' | 'catalogo' | 'producto' | 'checkout' | 'contacto') => void;
}) {
  const primary = groPrimary(cp);
  const font = groFont(diseno);
  const [sent, setSent] = useState(false);
  const contact = pickContact(tienda, diseno);
  const mapQuery = encodeURIComponent(contact.address || tienda?.nombreComercial || tienda?.razonSocial || 'Peru');
  const displayAddress = contact.address || 'Dirección no configurada';
  const displayPhone = contact.phone || 'Teléfono no configurado';
  const displayEmail = contact.email || 'Correo no configurado';
  const displayHours = contact.hours || 'Lun a Dom · 8:00 – 22:00';

  const go = (page: 'home' | 'catalogo' | 'checkout' | 'contacto') => {
    if (onNavigate) { onNavigate(page); return; }
    window.location.href = page === 'home' ? `/tienda/${slug}` : `/tienda/${slug}/${page}`;
  };

  const inputCls = 'mt-2 h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition-colors focus:border-[var(--gro-cp)]';

  return (
    <motion.div initial="hidden" animate="show" variants={groPage} className="min-h-screen" style={{ backgroundColor: GRO.soft, fontFamily: font, ['--gro-cp' as any]: primary }}>
      <GroHeader
        tienda={tienda}
        slug={slug}
        cp={primary}
        diseno={diseno}
        carritoSize={carrito.reduce((sum, item) => sum + Number(item.cantidad || 1), 0)}
        onOpenCart={() => setMostrarCarrito?.(true)}
        allCategories={allCategories}
        onSearchSubmit={(event, value) => { event.preventDefault(); const t = value?.trim(); if (t) window.location.href = `/tienda/${slug}/catalogo?search=${encodeURIComponent(t)}`; }}
      />

      <div className="border-b bg-white" style={{ borderColor: GRO.line }}>
        <div className="mx-auto max-w-7xl px-5 py-8 text-center md:px-6 md:py-12">
          <div className="text-xs font-medium" style={{ color: GRO.inkSoft }}>
            <button type="button" onClick={() => go('home')} className="hover:text-neutral-900">Inicio</button>
            <span className="mx-2">/</span>
            <span style={{ color: GRO.ink }}>Contacto</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl" style={{ fontFamily: GRO.display, color: GRO.ink }}>{diseno?.abarrotesContactHeading || 'Estamos para ayudarte'}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: GRO.inkSoft }}>{diseno?.abarrotesContactSubheading || '¿Tienes una consulta sobre tu pedido o nuestros productos? Escríbenos y te respondemos rápido.'}</p>
        </div>
      </div>

      <motion.main variants={groSection} className="mx-auto max-w-7xl px-5 py-12 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <motion.div variants={groCard} className="min-h-[400px] overflow-hidden rounded-2xl border bg-white md:min-h-[540px]" style={{ borderColor: GRO.line }}>
            <iframe title="Mapa de contacto" src={`https://www.google.com/maps?q=${mapQuery}&output=embed`} className="h-full min-h-[400px] w-full border-0 md:min-h-[540px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </motion.div>

          <motion.form variants={groCard} className="rounded-2xl border bg-white p-6 md:p-8" style={{ borderColor: GRO.line }} onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
            <h2 className="text-xl font-bold" style={{ fontFamily: GRO.display, color: GRO.ink }}>{diseno?.abarrotesContactTitle || 'Escríbenos'}</h2>
            <p className="mt-1.5 text-sm" style={{ color: GRO.inkSoft }}>Completa el formulario o contáctanos por WhatsApp.</p>
            <label className="mt-5 block text-[11px] font-bold uppercase tracking-wide" style={{ color: GRO.inkSoft }}>Tu nombre<input required className={inputCls} /></label>
            <label className="mt-4 block text-[11px] font-bold uppercase tracking-wide" style={{ color: GRO.inkSoft }}>Tu correo<input required type="email" className={inputCls} /></label>
            <label className="mt-4 block text-[11px] font-bold uppercase tracking-wide" style={{ color: GRO.inkSoft }}>Tu mensaje<textarea rows={5} className="mt-2 w-full resize-none rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-900 outline-none transition-colors focus:border-[var(--gro-cp)]" /></label>
            {sent && <p className="mt-4 rounded-xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: withAlpha(primary, '18'), color: GRO.greenDark }}>¡Gracias! Mensaje registrado en esta vista. Configura el canal de contacto de la tienda para recibirlo.</p>}
            <motion.button type="submit" className="mt-5 w-full rounded-full py-3.5 text-sm font-bold text-white shadow-lg" style={{ backgroundColor: primary }} whileHover={{ scale: 1.02, y: -2 }} whileTap={groTap}>{diseno?.abarrotesContactSubmitLabel || 'Enviar mensaje'}</motion.button>
            <a href={waLink(tienda, 'Hola, quiero hacer una consulta')} target="_blank" rel="noreferrer" className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border py-3 text-sm font-bold transition-colors" style={{ borderColor: '#25D366', color: '#128C4B' }}><Icon icon="mdi:whatsapp" width={18} /> Escríbenos por WhatsApp</a>
          </motion.form>
        </div>

        <motion.section initial="hidden" whileInView="show" viewport={groViewport} variants={groStagger} className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ['solar:map-point-linear', 'Dirección', displayAddress],
            ['solar:phone-linear', 'Teléfono', displayPhone],
            ['solar:letter-linear', 'Correo', displayEmail],
            ['solar:clock-circle-linear', 'Horario', displayHours],
          ].map(([icon, label, text], i) => (
            <motion.div key={`${label}-${i}`} variants={groCard} className="rounded-2xl border bg-white p-5" style={{ borderColor: GRO.line }}>
              <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: GRO.greenSoft, color: GRO.greenDark }}><Icon icon={icon} width={20} /></span>
              <p className="mt-3.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: GRO.green }}>{label}</p>
              <p className="mt-1 text-sm leading-6" style={{ color: GRO.ink }}>{text}</p>
            </motion.div>
          ))}
        </motion.section>
      </motion.main>

      <GroFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <GroWhatsAppFab tienda={tienda} />

      {setCarrito && actualizarCantidad && (
        <GroCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito?.(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => go('checkout')} cp={primary} tienda={tienda} />
      )}
    </motion.div>
  );
}
