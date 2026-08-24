import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { TN, TnCartModal, TnFooter, TnHeader, TnWhatsAppFab, tnFont, tnPrimary, waLink, withAlpha } from './TonesParts';
import { tnCard, tnPage, tnSection, tnStagger, tnTap, tnViewport } from './motion';

function pickContact(tienda: any, diseno: any) {
  return {
    address: diseno?.tonesContactAddress || tienda?.direccionTienda || tienda?.direccionFiscal || tienda?.direccion || '',
    phone: diseno?.tonesContactPhone || tienda?.whatsappTienda || tienda?.telefono || tienda?.celular || '',
    email: diseno?.tonesContactEmail || tienda?.email || tienda?.correo || '',
    hours: diseno?.tonesContactHours || tienda?.horarioAtencion || '',
  };
}

export default function TonesContactPage({
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
  const primary = tnPrimary(cp);
  const font = tnFont(diseno);
  const [sent, setSent] = useState(false);
  const contact = pickContact(tienda, diseno);
  const mapQuery = encodeURIComponent(contact.address || tienda?.nombreComercial || tienda?.razonSocial || 'Peru');
  const displayAddress = contact.address || 'Dirección no configurada';
  const displayPhone = contact.phone || 'Teléfono no configurado';
  const displayEmail = contact.email || 'Correo no configurado';
  const displayHours = contact.hours || 'Lun a Sáb · 10:00 – 20:00';

  const go = (page: 'home' | 'catalogo' | 'checkout' | 'contacto') => {
    if (onNavigate) { onNavigate(page); return; }
    window.location.href = page === 'home' ? `/tienda/${slug}` : `/tienda/${slug}/${page}`;
  };

  const inputCls = 'mt-2 h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition-colors focus:border-[var(--tn-cp)]';

  return (
    <motion.div initial="hidden" animate="show" variants={tnPage} className="min-h-screen" style={{ backgroundColor: TN.cream, fontFamily: font, ['--tn-cp' as any]: TN.cocoa }}>
      <TnHeader
        tienda={tienda}
        slug={slug}
        cp={primary}
        diseno={diseno}
        carritoSize={carrito.reduce((sum, item) => sum + Number(item.cantidad || 1), 0)}
        onOpenCart={() => setMostrarCarrito?.(true)}
        allCategories={allCategories}
        onSearchSubmit={(event, value) => {
          event.preventDefault();
          const term = value?.trim();
          if (term) window.location.href = `/tienda/${slug}/catalogo?search=${encodeURIComponent(term)}`;
        }}
      />

      <section className="mx-auto max-w-[1240px] px-4 pt-10 md:px-6 md:pt-12">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          <button type="button" onClick={() => go('home')} className="hover:text-neutral-900">Inicio</button>
          <span className="mx-2">/</span>
          <span className="text-neutral-600">Contacto</span>
        </div>
        <h1 className="mt-2 text-4xl lowercase tracking-[-0.01em] md:text-5xl" style={{ fontFamily: TN.brand, fontWeight: 700, color: TN.ink }}>{diseno?.tonesContactHeading || 'hablemos'}</h1>
        <p className="mt-2 max-w-md text-sm text-neutral-500">{diseno?.tonesContactSubheading || '¿Buscas la talla ideal o tienes una consulta? Nuestro equipo te asesora con gusto.'}</p>
      </section>

      <motion.main variants={tnSection} className="mx-auto max-w-[1240px] px-4 py-10 md:px-6 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
          <motion.div variants={tnCard} className="min-h-[420px] overflow-hidden rounded-[24px] border md:min-h-[560px]" style={{ borderColor: TN.line }}>
            <iframe
              title="Mapa de contacto"
              src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
              className="h-full min-h-[420px] w-full border-0 md:min-h-[560px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>

          <motion.form
            variants={tnCard}
            className="rounded-[24px] border p-7 md:p-9"
            style={{ backgroundColor: TN.panel, borderColor: TN.line }}
            onSubmit={(event) => { event.preventDefault(); setSent(true); }}
          >
            <h2 className="text-2xl lowercase" style={{ fontFamily: TN.brand, fontWeight: 700, color: TN.ink }}>{diseno?.tonesContactTitle || 'escríbenos'}</h2>
            <p className="mt-2 text-sm text-neutral-500">Completa el formulario o contáctanos por WhatsApp.</p>

            <label className="mt-6 block text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-500">
              Tu nombre
              <input required className={inputCls} />
            </label>
            <label className="mt-5 block text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-500">
              Tu correo
              <input required type="email" className={inputCls} />
            </label>
            <label className="mt-5 block text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-500">
              Tu mensaje
              <textarea rows={5} className="mt-2 w-full resize-none rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-900 outline-none transition-colors focus:border-[var(--tn-cp)]" />
            </label>
            {sent && (
              <p className="mt-4 rounded-xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: withAlpha(primary, '14'), color: primary }}>
                ¡Gracias! Mensaje registrado en esta vista. Configura el canal de contacto de la tienda para recibirlo.
              </p>
            )}
            <motion.button
              type="submit"
              className="mt-6 w-full rounded-full py-4 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-lg"
              style={{ backgroundColor: TN.cocoa }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={tnTap}
            >
              {diseno?.tonesContactSubmitLabel || 'Enviar mensaje'}
            </motion.button>
            <a
              href={waLink(tienda, 'Hola, quiero hacer una consulta')}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border py-3.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors"
              style={{ borderColor: TN.lineStrong, color: TN.cocoa }}
            >
              <Icon icon="mdi:whatsapp" width={18} /> Escríbenos por WhatsApp
            </a>
          </motion.form>
        </div>

        <motion.section initial="hidden" whileInView="show" viewport={tnViewport} variants={tnStagger} className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ['solar:map-point-linear', 'Dirección', displayAddress],
            ['solar:phone-linear', 'Teléfono', displayPhone],
            ['solar:letter-linear', 'Correo', displayEmail],
            ['solar:clock-circle-linear', 'Horario', displayHours],
          ].map(([icon, label, text], index) => (
            <motion.div key={`${label}-${index}`} variants={tnCard} className="rounded-[22px] border p-6" style={{ backgroundColor: TN.panel, borderColor: TN.line }}>
              <span className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ background: `linear-gradient(135deg, ${TN.espresso}, ${TN.cocoa})` }}>
                <Icon icon={icon} width={20} />
              </span>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: TN.taupe }}>{label}</p>
              <p className="mt-1 text-sm leading-6 text-neutral-700">{text}</p>
            </motion.div>
          ))}
        </motion.section>
      </motion.main>

      <TnFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <TnWhatsAppFab tienda={tienda} />

      {setCarrito && actualizarCantidad && (
        <TnCartModal
          isOpen={mostrarCarrito}
          onClose={() => setMostrarCarrito?.(false)}
          carrito={carrito}
          setCarrito={setCarrito}
          actualizarCantidad={actualizarCantidad}
          onCheckout={() => go('checkout')}
          cp={primary}
          tienda={tienda}
        />
      )}
    </motion.div>
  );
}
