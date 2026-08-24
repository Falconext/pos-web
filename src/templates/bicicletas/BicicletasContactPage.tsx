import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { VELO, VeloCartModal, VeloFooter, VeloHeader, VeloWhatsAppFab, veloFont, veloPrimary, waLink, withAlpha } from './BicicletasParts';
import { veloCard, veloPage, veloSection, veloStagger, veloTap, veloViewport } from './motion';

function pickContact(tienda: any, diseno: any) {
  return {
    address: diseno?.bicicletasContactAddress || tienda?.direccionTienda || tienda?.direccionFiscal || tienda?.direccion || '',
    phone: diseno?.bicicletasContactPhone || tienda?.whatsappTienda || tienda?.telefono || tienda?.celular || '',
    email: diseno?.bicicletasContactEmail || tienda?.email || tienda?.correo || '',
    hours: diseno?.bicicletasContactHours || tienda?.horarioAtencion || '',
  };
}

export default function BicicletasContactPage({
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
  const primary = veloPrimary(cp);
  const font = veloFont(diseno);
  const [sent, setSent] = useState(false);
  const contact = pickContact(tienda, diseno);
  const mapQuery = encodeURIComponent(contact.address || tienda?.nombreComercial || tienda?.razonSocial || 'Peru');
  const displayAddress = contact.address || 'Dirección no configurada';
  const displayPhone = contact.phone || 'Teléfono no configurado';
  const displayEmail = contact.email || 'Correo no configurado';
  const displayHours = contact.hours || 'Lun a Sáb · 09:00 – 20:00';

  const go = (page: 'home' | 'catalogo' | 'checkout' | 'contacto') => {
    if (onNavigate) { onNavigate(page); return; }
    window.location.href = page === 'home' ? `/tienda/${slug}` : `/tienda/${slug}/${page}`;
  };

  const inputCls = 'mt-2 h-12 w-full border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition-colors focus:border-[var(--velo-cp)]';

  return (
    <motion.div initial="hidden" animate="show" variants={veloPage} className="min-h-screen" style={{ backgroundColor: VELO.cloud, fontFamily: font, ['--velo-cp' as any]: primary }}>
      <VeloHeader
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

      <section className="relative overflow-hidden border-b" style={{ borderColor: VELO.line, background: `linear-gradient(120% 120% at 80% 0%, #FFFFFF, ${VELO.mist} 65%)` }}>
        <div className="mx-auto max-w-7xl px-6 py-12 text-center md:py-16">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
            <button type="button" onClick={() => go('home')} className="hover:text-neutral-900">Inicio</button>
            <span className="mx-2">/</span>
            <span className="text-neutral-700">Contacto</span>
          </div>
          <h1 className="mt-3 text-4xl font-bold uppercase tracking-[0.04em] md:text-5xl" style={{ fontFamily: VELO.display, color: VELO.ink }}>{diseno?.bicicletasContactHeading || 'Hablemos'}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-neutral-500">{diseno?.bicicletasContactSubheading || '¿Buscas la bici perfecta o necesitas mantenimiento? Nuestro equipo de ciclistas te asesora.'}</p>
        </div>
      </section>

      <motion.main variants={veloSection} className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
          <motion.div variants={veloCard} className="min-h-[420px] overflow-hidden border md:min-h-[560px]" style={{ borderColor: VELO.line }}>
            <iframe
              title="Mapa de contacto"
              src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
              className="h-full min-h-[420px] w-full border-0 md:min-h-[560px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>

          <motion.form
            variants={veloCard}
            className="border bg-white p-7 md:p-9"
            style={{ borderColor: VELO.line }}
            onSubmit={(event) => { event.preventDefault(); setSent(true); }}
          >
            <h2 className="text-2xl font-bold uppercase" style={{ fontFamily: VELO.display, color: VELO.ink }}>{diseno?.bicicletasContactTitle || 'Escríbenos'}</h2>
            <p className="mt-2 text-sm text-neutral-500">Completa el formulario o contáctanos por WhatsApp.</p>

            <label className="mt-6 block text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">
              Tu nombre
              <input required className={inputCls} />
            </label>
            <label className="mt-5 block text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">
              Tu correo
              <input required type="email" className={inputCls} />
            </label>
            <label className="mt-5 block text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">
              Tu mensaje
              <textarea rows={5} className="mt-2 w-full resize-none border border-neutral-200 bg-white p-4 text-sm text-neutral-900 outline-none transition-colors focus:border-[var(--velo-cp)]" />
            </label>
            {sent && (
              <p className="mt-4 px-4 py-3 text-sm font-medium" style={{ backgroundColor: withAlpha(primary, '14'), color: primary }}>
                ¡Gracias! Mensaje registrado en esta vista. Configura el canal de contacto de la tienda para recibirlo.
              </p>
            )}
            <motion.button
              type="submit"
              className="mt-6 w-full py-4 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-lg"
              style={{ backgroundColor: primary }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={veloTap}
            >
              {diseno?.bicicletasContactSubmitLabel || 'Enviar mensaje'}
            </motion.button>
            <a
              href={waLink(tienda, 'Hola, quiero hacer una consulta')}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 border py-3.5 text-xs font-bold uppercase tracking-[0.14em] transition-colors"
              style={{ borderColor: VELO.ink, color: VELO.ink }}
            >
              <Icon icon="mdi:whatsapp" width={18} /> Escríbenos por WhatsApp
            </a>
          </motion.form>
        </div>

        <motion.section initial="hidden" whileInView="show" viewport={veloViewport} variants={veloStagger} className="mt-10 grid gap-4 md:grid-cols-4">
          {[
            ['solar:map-point-linear', 'Dirección', displayAddress],
            ['solar:phone-linear', 'Teléfono', displayPhone],
            ['solar:letter-linear', 'Correo', displayEmail],
            ['solar:clock-circle-linear', 'Horario', displayHours],
          ].map(([icon, label, text], index) => (
            <motion.div key={`${label}-${index}`} variants={veloCard} className="border bg-white p-6" style={{ borderColor: VELO.line }}>
              <span className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ backgroundColor: primary }}>
                <Icon icon={icon} width={20} />
              </span>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: VELO.steel }}>{label}</p>
              <p className="mt-1 text-sm leading-6 text-neutral-700">{text}</p>
            </motion.div>
          ))}
        </motion.section>
      </motion.main>

      <VeloFooter tienda={tienda} slug={slug} diseno={diseno} cp={primary} categories={allCategories} />
      <VeloWhatsAppFab tienda={tienda} />

      {setCarrito && actualizarCantidad && (
        <VeloCartModal
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
