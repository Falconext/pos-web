import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { MIN, MinCartModal, MinFooter, MinHeader, MinWhatsAppFab, minFont, minPrimary, waLink } from './ModaMinimalParts';
import { minCard, minPage, minSection, minStagger, minViewport } from './motion';

function pickContact(tienda: any, diseno: any) {
  return {
    address: diseno?.modaMinimalContactAddress || tienda?.direccionTienda || tienda?.direccionFiscal || tienda?.direccion || '',
    phone: diseno?.modaMinimalContactPhone || tienda?.whatsappTienda || tienda?.telefono || tienda?.celular || '',
    email: diseno?.modaMinimalContactEmail || tienda?.email || tienda?.correo || '',
    hours: diseno?.modaMinimalContactHours || tienda?.horarioAtencion || '',
  };
}

export default function ModaMinimalContactPage({
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
  const primary = minPrimary(cp);
  const font = minFont(diseno);
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

  const inputCls = 'mt-2 h-12 w-full border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition-colors focus:border-[var(--min-cp)]';

  return (
    <motion.div initial="hidden" animate="show" variants={minPage} className="min-h-screen" style={{ backgroundColor: MIN.paper, fontFamily: font, ['--min-cp' as any]: MIN.ink }}>
      <MinHeader
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

      <section className="border-b" style={{ borderColor: MIN.line }}>
        <div className="mx-auto max-w-7xl px-6 py-12 md:px-8 md:py-16">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: MIN.muted }}>
            <button type="button" onClick={() => go('home')} className="hover:text-black">Inicio</button>
            <span className="mx-2">/</span>
            <span style={{ color: MIN.soft }}>Contacto</span>
          </div>
          <h1 className="mt-2 text-3xl font-medium tracking-tight md:text-4xl" style={{ color: MIN.ink }}>{diseno?.modaMinimalContactHeading || 'Hablemos'}</h1>
          <p className="mt-3 max-w-md text-sm" style={{ color: MIN.soft }}>{diseno?.modaMinimalContactSubheading || '¿Buscas tu talla ideal o tienes una consulta? Estamos para ayudarte.'}</p>
        </div>
      </section>

      <motion.main variants={minSection} className="mx-auto max-w-7xl px-6 py-14 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.9fr]">
          <motion.div variants={minCard} className="min-h-[420px] overflow-hidden border md:min-h-[540px]" style={{ borderColor: MIN.line }}>
            <iframe
              title="Mapa de contacto"
              src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
              className="h-full min-h-[420px] w-full border-0 md:min-h-[540px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>

          <motion.form
            variants={minCard}
            className="border p-7 md:p-9"
            style={{ borderColor: MIN.line }}
            onSubmit={(event) => { event.preventDefault(); setSent(true); }}
          >
            <h2 className="text-xl font-medium" style={{ color: MIN.ink }}>{diseno?.modaMinimalContactTitle || 'Escríbenos'}</h2>
            <p className="mt-2 text-sm" style={{ color: MIN.soft }}>Completa el formulario o contáctanos por WhatsApp.</p>

            <label className="mt-6 block text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MIN.soft }}>
              Tu nombre
              <input required className={inputCls} />
            </label>
            <label className="mt-5 block text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MIN.soft }}>
              Tu correo
              <input required type="email" className={inputCls} />
            </label>
            <label className="mt-5 block text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MIN.soft }}>
              Tu mensaje
              <textarea rows={5} className="mt-2 w-full resize-none border border-neutral-300 bg-white p-4 text-sm text-neutral-900 outline-none transition-colors focus:border-[var(--min-cp)]" />
            </label>
            {sent && (
              <p className="mt-4 px-4 py-3 text-sm" style={{ backgroundColor: MIN.cream, color: MIN.ink }}>
                ¡Gracias! Mensaje registrado en esta vista. Configura el canal de contacto de la tienda para recibirlo.
              </p>
            )}
            <button type="submit" className="mt-6 w-full py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white" style={{ backgroundColor: MIN.ink }}>
              {diseno?.modaMinimalContactSubmitLabel || 'Enviar mensaje'}
            </button>
            <a
              href={waLink(tienda, 'Hola, quiero hacer una consulta')}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 border py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ borderColor: MIN.ink, color: MIN.ink }}
            >
              <Icon icon="mdi:whatsapp" width={17} /> Escríbenos por WhatsApp
            </a>
          </motion.form>
        </div>

        <motion.section initial="hidden" whileInView="show" viewport={minViewport} variants={minStagger} className="mt-10 grid gap-px border md:grid-cols-4" style={{ borderColor: MIN.line, backgroundColor: MIN.line }}>
          {[
            ['solar:map-point-linear', 'Dirección', displayAddress],
            ['solar:phone-linear', 'Teléfono', displayPhone],
            ['solar:letter-linear', 'Correo', displayEmail],
            ['solar:clock-circle-linear', 'Horario', displayHours],
          ].map(([icon, label, text], index) => (
            <motion.div key={`${label}-${index}`} variants={minCard} className="bg-white p-6">
              <Icon icon={icon} width={20} style={{ color: MIN.ink }} />
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MIN.muted }}>{label}</p>
              <p className="mt-1 text-sm leading-6" style={{ color: MIN.soft }}>{text}</p>
            </motion.div>
          ))}
        </motion.section>
      </motion.main>

      <MinFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <MinWhatsAppFab tienda={tienda} />

      {setCarrito && actualizarCantidad && (
        <MinCartModal
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
