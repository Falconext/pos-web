import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { FOOD, FoodCartModal, FoodShell, FoodSubHeader, foodPrimary, storeName, waLink } from './CrispyParts';
import { foodPage, foodTap } from './motion';

function pickContact(tienda: any, diseno: any) {
  return {
    address: diseno?.comidaAppContactAddress || tienda?.direccionTienda || tienda?.direccion || '',
    phone: diseno?.comidaAppContactPhone || tienda?.whatsappTienda || tienda?.telefono || '',
    email: diseno?.comidaAppContactEmail || tienda?.email || tienda?.correo || '',
    hours: diseno?.comidaAppContactHours || tienda?.horarioAtencion || '',
  };
}

export default function CrispyContactPage({
  tienda, slug, diseno, cp,
  carrito = [], setCarrito, mostrarCarrito = false, setMostrarCarrito, actualizarCantidad, onNavigate,
}: {
  tienda: any; slug: string; diseno: any; cp: string;
  allCategories?: any[]; carrito?: any[]; setCarrito?: (items: any[]) => void;
  mostrarCarrito?: boolean; setMostrarCarrito?: (v: boolean) => void;
  actualizarCantidad?: (id: any, cantidad: number) => void;
  onNavigate?: (page: 'home' | 'catalogo' | 'producto' | 'checkout' | 'contacto') => void;
}) {
  const primary = foodPrimary(cp);
  const [sent, setSent] = useState(false);
  const c = pickContact(tienda, diseno);
  const mapQuery = encodeURIComponent(c.address || tienda?.nombreComercial || 'Peru');
  const name = storeName(tienda, diseno);

  const go = (page: 'home' | 'checkout') => {
    if (onNavigate) { onNavigate(page); return; }
    window.location.href = page === 'home' ? `/tienda/${slug}` : `/tienda/${slug}/${page}`;
  };

  return (
    <FoodShell slug={slug} active="profile" cp={primary} diseno={diseno} tienda={tienda} carrito={carrito} onOpenCart={() => setMostrarCarrito?.(true)}>
      <motion.div initial="hidden" animate="show" variants={foodPage}>
        <div className="lg:hidden">
          <FoodSubHeader title={diseno?.comidaAppContactHeading || 'Contáctanos'} slug={slug} cp={primary} carrito={carrito} onOpenCart={() => setMostrarCarrito?.(true)} onBack={() => go('home')} />
        </div>
        <h1 className="hidden pb-2 pt-8 text-[30px] font-extrabold lg:block" style={{ color: FOOD.ink }}>{diseno?.comidaAppContactHeading || 'Contáctanos'}</h1>

        <div className="space-y-4 px-4 pt-2 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0 lg:px-0">
          {/* Tarjeta marca */}
          <div className="flex items-center gap-3 rounded-3xl p-4 text-white shadow-sm" style={{ backgroundColor: FOOD.red }}>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20"><Icon icon="mdi:silverware-fork-knife" width={24} /></span>
            <div>
              <p className="text-[17px] font-extrabold leading-tight">{name}</p>
              <p className="text-[12px] font-medium text-white/85">{diseno?.comidaAppContactSubheading || 'Estamos para atenderte 🍽️'}</p>
            </div>
          </div>

          {/* Mapa */}
          <div className="overflow-hidden rounded-3xl shadow-sm">
            <iframe title="Mapa" src={`https://www.google.com/maps?q=${mapQuery}&output=embed`} className="h-52 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              ['solar:map-point-linear', 'Dirección', c.address || 'No configurada'],
              ['solar:phone-linear', 'Teléfono', c.phone || 'No configurado'],
              ['solar:letter-linear', 'Correo', c.email || 'No configurado'],
              ['solar:clock-circle-linear', 'Horario', c.hours || 'Lun a Dom'],
            ].map(([icon, label, val], i) => (
              <div key={i} className="rounded-3xl bg-white p-4 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl" style={{ backgroundColor: FOOD.peach, color: primary }}><Icon icon={icon} width={18} /></span>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: FOOD.muted }}>{label}</p>
                <p className="mt-0.5 line-clamp-2 text-[13px] font-semibold" style={{ color: FOOD.ink }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="rounded-3xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-[15px] font-extrabold" style={{ color: FOOD.ink }}>{diseno?.comidaAppContactTitle || 'Escríbenos'}</h2>
            <input required placeholder="Tu nombre" className="mb-3 h-12 w-full rounded-2xl border-0 px-4 text-sm font-medium outline-none focus:ring-2" style={{ backgroundColor: FOOD.cream, ['--tw-ring-color' as any]: primary }} />
            <input required type="email" placeholder="Tu correo" className="mb-3 h-12 w-full rounded-2xl border-0 px-4 text-sm font-medium outline-none focus:ring-2" style={{ backgroundColor: FOOD.cream, ['--tw-ring-color' as any]: primary }} />
            <textarea rows={3} placeholder="Tu mensaje" className="mb-3 w-full resize-none rounded-2xl border-0 px-4 py-3 text-sm font-medium outline-none focus:ring-2" style={{ backgroundColor: FOOD.cream, ['--tw-ring-color' as any]: primary }} />
            {sent && <p className="mb-3 rounded-2xl px-3 py-2.5 text-sm font-semibold" style={{ backgroundColor: FOOD.peach, color: FOOD.ink }}>¡Gracias! Mensaje registrado en esta vista.</p>}
            <motion.button whileTap={foodTap} type="submit" className="w-full rounded-2xl py-3.5 text-sm font-extrabold text-white shadow-md" style={{ backgroundColor: primary }}>{diseno?.comidaAppContactSubmitLabel || 'Enviar'}</motion.button>
            <a href={waLink(tienda, 'Hola, quiero hacer una consulta')} target="_blank" rel="noreferrer" className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-extrabold" style={{ backgroundColor: '#25D366', color: '#fff' }}><Icon icon="mdi:whatsapp" width={18} /> WhatsApp</a>
          </form>
        </div>
      </motion.div>

      {setCarrito && actualizarCantidad && (
        <FoodCartModal isOpen={mostrarCarrito} onClose={() => setMostrarCarrito?.(false)} carrito={carrito} setCarrito={setCarrito} actualizarCantidad={actualizarCantidad} onCheckout={() => go('checkout')} cp={primary} tienda={tienda} />
      )}
    </FoodShell>
  );
}
