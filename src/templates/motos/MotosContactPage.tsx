import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { MOTO, MotoCartModal, MotoFooter, MotoHeader, MotoWhatsAppFab, motoFont, motoPrimary, waLink, withAlpha } from './MotosParts';
import { motoCard, motoPage, motoSection, motoStagger, motoTap, motoViewport } from './motion';

function pickContact(tienda: any, diseno: any) {
  return {
    address: diseno?.motosContactAddress || tienda?.direccionTienda || tienda?.direccionFiscal || tienda?.direccion || '',
    phone: diseno?.motosContactPhone || tienda?.whatsappTienda || tienda?.telefono || tienda?.celular || '',
    email: diseno?.motosContactEmail || tienda?.email || tienda?.correo || '',
    hours: diseno?.motosContactHours || tienda?.horarioAtencion || '',
  };
}

export default function MotosContactPage({
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
  const primary = motoPrimary(cp);
  const font = motoFont(diseno);
  const [sent, setSent] = useState(false);
  const contact = pickContact(tienda, diseno);
  const mapQuery = encodeURIComponent(contact.address || tienda?.nombreComercial || tienda?.razonSocial || 'Peru');
  const displayAddress = contact.address || 'Dirección no configurada';
  const displayPhone = contact.phone || 'Teléfono no configurado';
  const displayEmail = contact.email || 'Correo no configurado';
  const displayHours = contact.hours || 'Lun a Sáb · 09:00 – 19:00';
  const inputStyle = { borderColor: MOTO.line, backgroundColor: MOTO.soft, color: MOTO.ink } as const;

  const go = (page: 'home' | 'catalogo' | 'checkout' | 'contacto') => {
    if (onNavigate) { onNavigate(page); return; }
    window.location.href = page === 'home' ? `/tienda/${slug}` : `/tienda/${slug}/${page}`;
  };

  const inputCls = 'mt-2 h-12 w-full rounded-lg border px-4 text-sm outline-none transition-colors focus:border-[var(--moto-cp)]';

  return (
    <motion.div initial="hidden" animate="show" variants={motoPage} className="min-h-screen" style={{ backgroundColor: MOTO.page, fontFamily: font, ['--moto-cp' as any]: primary }}>
      <MotoHeader
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

      <section className="relative overflow-hidden border-b" style={{ borderColor: MOTO.line, backgroundColor: MOTO.card }}>
        <div className="mx-auto max-w-7xl px-6 py-12 text-center md:py-16">
          <div className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: MOTO.faint }}>
            <button type="button" onClick={() => go('home')} className="hover:text-neutral-900">Inicio</button>
            <span className="mx-2">/</span>
            <span style={{ color: MOTO.muted }}>Contacto</span>
          </div>
          <h1 className="mt-3 text-4xl font-extrabold uppercase tracking-[0.02em] md:text-5xl" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>{diseno?.motosContactHeading || 'Visítanos o escríbenos'}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm" style={{ color: MOTO.muted }}>{diseno?.motosContactSubheading || '¿Buscas tu próxima moto o necesitas un service? Nuestro equipo te asesora con gusto.'}</p>
        </div>
      </section>

      <motion.main variants={motoSection} className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
          <motion.div variants={motoCard} className="min-h-[420px] overflow-hidden rounded-2xl border md:min-h-[560px]" style={{ borderColor: MOTO.line }}>
            <iframe
              title="Mapa de contacto"
              src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
              className="h-full min-h-[420px] w-full border-0 md:min-h-[560px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>

          <motion.form
            variants={motoCard}
            className="rounded-2xl border p-7 md:p-9"
            style={{ backgroundColor: MOTO.card, borderColor: MOTO.line }}
            onSubmit={(event) => { event.preventDefault(); setSent(true); }}
          >
            <h2 className="text-2xl font-bold uppercase" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>{diseno?.motosContactTitle || 'Escríbenos'}</h2>
            <p className="mt-2 text-sm" style={{ color: MOTO.muted }}>Completa el formulario o contáctanos por WhatsApp.</p>

            <label className="mt-6 block text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MOTO.muted }}>
              Tu nombre
              <input required className={inputCls} style={inputStyle} />
            </label>
            <label className="mt-5 block text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MOTO.muted }}>
              Tu correo
              <input required type="email" className={inputCls} style={inputStyle} />
            </label>
            <label className="mt-5 block text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: MOTO.muted }}>
              Tu mensaje
              <textarea rows={5} className="mt-2 w-full resize-none rounded-lg border p-4 text-sm outline-none transition-colors focus:border-[var(--moto-cp)]" style={inputStyle} />
            </label>
            {sent && (
              <p className="mt-4 rounded-lg px-4 py-3 text-sm font-medium" style={{ backgroundColor: withAlpha(primary, '22'), color: primary }}>
                ¡Gracias! Mensaje registrado en esta vista. Configura el canal de contacto de la tienda para recibirlo.
              </p>
            )}
            <motion.button
              type="submit"
              className="mt-6 w-full rounded-lg py-4 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-lg"
              style={{ backgroundColor: primary }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={motoTap}
            >
              {diseno?.motosContactSubmitLabel || 'Enviar mensaje'}
            </motion.button>
            <a
              href={waLink(tienda, 'Hola, quiero hacer una consulta sobre motos y servicios')}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border py-3.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-white/25"
              style={{ borderColor: MOTO.line, color: MOTO.body }}
            >
              <Icon icon="mdi:whatsapp" width={18} /> Escríbenos por WhatsApp
            </a>
          </motion.form>
        </div>

        <motion.section initial="hidden" whileInView="show" viewport={motoViewport} variants={motoStagger} className="mt-10 grid gap-4 md:grid-cols-4">
          {[
            ['solar:map-point-linear', 'Dirección', displayAddress],
            ['solar:phone-linear', 'Teléfono', displayPhone],
            ['solar:letter-linear', 'Correo', displayEmail],
            ['solar:clock-circle-linear', 'Horario', displayHours],
          ].map(([icon, label, text], index) => (
            <motion.div key={`${label}-${index}`} variants={motoCard} className="rounded-2xl border p-6" style={{ backgroundColor: MOTO.card, borderColor: MOTO.line }}>
              <span className="flex h-11 w-11 items-center justify-center rounded-lg text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${MOTO.blueDark})` }}>
                <Icon icon={icon} width={20} />
              </span>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: primary }}>{label}</p>
              <p className="mt-1 text-sm leading-6" style={{ color: MOTO.body }}>{text}</p>
            </motion.div>
          ))}
        </motion.section>
      </motion.main>

      <MotoFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <MotoWhatsAppFab tienda={tienda} />

      {setCarrito && actualizarCantidad && (
        <MotoCartModal
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
