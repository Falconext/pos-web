import type React from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { getProductPricing } from '@/templates/shared/pricing';
import { useFavoritosStore } from '@/zustand/favoritos';
import { motoCard, motoEase, motoHover, motoSection, motoViewport } from './motion';

/**
 * Identidad visual de la plantilla "Voltia Motos" (venta de motos + servicio/taller mecánico).
 *
 * Estética CLARA premium tech inspirada en concesionarios de motos eléctricas: fondo gris muy
 * claro, tarjetas blancas con sombras suaves, layout bento, tipografía condensada en mayúsculas
 * (Archivo/Oswald) y acento azul eléctrico. Las secciones de servicio/footer son oscuras para
 * dar contraste editorial. `cp` (colorPrimario del diseño) es el color de ACENTO configurable
 * desde el editor — por defecto azul eléctrico. El rojo se reserva para etiquetas de oferta.
 */
export const MOTO = {
  page: '#F3F4F6',         // fondo página (gris muy claro)
  card: '#FFFFFF',         // superficies blancas
  soft: '#EEF0F3',         // superficies suaves / inputs
  raise: '#E4E7EC',        // hover / bordes activos
  line: 'rgba(15,18,26,0.09)',
  lineSoft: 'rgba(15,18,26,0.06)',
  ink: '#14161C',          // titulares / texto principal
  body: '#3B4048',         // texto de cuerpo
  muted: '#6B7280',        // secundario
  faint: '#9AA1AD',        // terciario
  blue: '#2563EB',         // acento eléctrico por defecto
  blueDark: '#1D4ED8',
  sale: '#E11D2A',         // rojo oferta
  // secciones oscuras (footer + banners destacados)
  night: '#0B0C10',
  nightSoft: '#15171F',
  onNight: '#EAECF2',
  onNightMuted: '#9AA3B2',
  display: "'Archivo', 'Oswald', ui-sans-serif, system-ui, sans-serif",
} as const;

export const motoPrimary = (cp?: string) => cp || MOTO.blue;
export const motoFont = (diseno?: any) => `'${diseno?.tipografia || 'Inter'}', ui-sans-serif, system-ui, sans-serif`;

/** Añade transparencia hex (#RRGGBB + alpha 00-ff) de forma segura. */
export function withAlpha(hex: string, alpha: string) {
  return /^#([0-9a-fA-F]{6})$/.test(hex) ? `${hex}${alpha}` : hex;
}

export function storeName(tienda: any, diseno: any) {
  return diseno?.motosLogoText || tienda?.nombreComercial || tienda?.razonSocial || tienda?.nombre || 'Voltia Motos';
}

/** Número de WhatsApp de la tienda. */
export function waLink(tienda: any, message = 'Hola, quiero más información sobre sus motos y servicios') {
  const raw = String(tienda?.whatsappTienda || tienda?.whatsapp || tienda?.telefono || '').replace(/[^\d]/g, '');
  const phone = raw || '51999999999';
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export const money = (v: number) => `S/ ${Number(v || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export interface SocialLink { key: string; icon: string; url: string; label: string }

/** Normaliza una URL agregando https:// si falta. */
function normUrl(u?: string) {
  const s = String(u || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (/^www\./i.test(s) || s.includes('.')) return `https://${s}`;
  return '';
}

/**
 * Construye la lista de redes sociales a mostrar. Solo incluye las que tienen un
 * enlace configurado (override en `diseno.motos*Url` o el ajuste de la tienda
 * `tienda.*Url`). WhatsApp se arma con el teléfono de la tienda si existe.
 * Así los iconos se van agregando dinámicamente según lo que configure el negocio.
 */
export function getSocials(tienda: any, diseno: any): SocialLink[] {
  const list: SocialLink[] = [];
  const push = (key: string, icon: string, label: string, raw?: string) => {
    const url = normUrl(raw);
    if (url) list.push({ key, icon, url, label });
  };
  push('facebook', 'mdi:facebook', 'Facebook', diseno?.motosFacebookUrl || tienda?.facebookUrl);
  push('instagram', 'mdi:instagram', 'Instagram', diseno?.motosInstagramUrl || tienda?.instagramUrl);
  push('tiktok', 'ic:baseline-tiktok', 'TikTok', diseno?.motosTiktokUrl || tienda?.tiktokUrl);
  push('youtube', 'mdi:youtube', 'YouTube', diseno?.motosYoutubeUrl || tienda?.youtubeUrl);
  push('telegram', 'mdi:telegram', 'Telegram', diseno?.motosTelegramUrl || tienda?.telegramUrl);
  const waOverride = normUrl(diseno?.motosWhatsappUrl);
  if (waOverride) list.push({ key: 'whatsapp', icon: 'mdi:whatsapp', url: waOverride, label: 'WhatsApp' });
  else if (tienda?.whatsappTienda || tienda?.whatsapp || tienda?.telefono) list.push({ key: 'whatsapp', icon: 'mdi:whatsapp', url: waLink(tienda), label: 'WhatsApp' });
  return list;
}

/* ─────────────────────────── Imagen de producto ─────────────────────────── */

export function MotoProductImage({ producto, imgClassName = '' }: { producto: any; imgClassName?: string }) {
  const img = producto?.imagenUrl || producto?.imagen || '';
  const [broken, setBroken] = useState(false);
  if (img && !broken) {
    return <img src={img} alt={producto?.descripcion || 'Producto'} loading="lazy" onError={() => setBroken(true)} className={`h-full w-full object-cover ${imgClassName}`} />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ background: `linear-gradient(150deg, ${MOTO.soft}, ${MOTO.raise})` }}>
      <Icon icon="mdi:motorbike-electric" className="text-6xl" style={{ color: MOTO.faint }} />
    </div>
  );
}

/* ──────────────────────────────── Product card ──────────────────────────── */

export function MotoProductCard({
  producto,
  slug = '',
  cp,
  onAddToCart,
  onClick,
}: {
  producto: any;
  slug?: string;
  cp: string;
  onAddToCart?: (producto: any) => void;
  onClick?: () => void;
}) {
  const primary = motoPrimary(cp);
  const { toggleFavorito, isFavorito } = useFavoritosStore();
  const wish = isFavorito(Number(producto?.id), slug);
  const pricing = getProductPricing(producto);
  const toggleWish = () => toggleFavorito({
    id: Number(producto?.id),
    descripcion: producto?.descripcion || producto?.nombre || 'Producto',
    precioUnitario: pricing.precioFinal,
    imagenUrl: producto?.imagenUrl || producto?.imagen || '',
    slug,
  });
  const marca = typeof producto?.marca === 'object' ? producto?.marca?.nombre : producto?.marca;
  const addPayload = { ...producto, precioUnitario: pricing.precioFinal, precioRegular: pricing.precioRegular, enOferta: pricing.enOferta };

  return (
    <motion.article
      variants={motoCard}
      initial="hidden"
      whileInView="show"
      viewport={motoViewport}
      whileHover={motoHover}
      layout
      className="group relative flex flex-col overflow-hidden rounded-2xl border shadow-[0_1px_2px_rgba(15,18,26,0.04)] transition-shadow hover:shadow-[0_18px_40px_-22px_rgba(15,18,26,0.35)]"
      style={{ backgroundColor: MOTO.card, borderColor: MOTO.line }}
    >
      <button type="button" onClick={onClick} className="relative block aspect-[5/4] w-full overflow-hidden" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F1F3F6 100%)' }}>
        {pricing.enOferta && (
          <span className="absolute right-3 top-3 z-10 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white shadow-sm" style={{ backgroundColor: MOTO.sale }}>
            Oferta
          </span>
        )}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); toggleWish(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); toggleWish(); } }}
          className="absolute left-3 top-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border bg-white shadow-sm transition-colors"
          style={{ borderColor: MOTO.line, color: wish ? primary : MOTO.muted }}
          title="Favorito"
        >
          <Icon icon={wish ? 'solar:heart-bold' : 'solar:heart-linear'} width={17} />
        </span>
        <div className="flex h-full w-full items-center justify-center p-5 transition-transform duration-[700ms] ease-out group-hover:scale-[1.06]">
          {(producto?.imagenUrl || producto?.imagen) ? (
            <img
              src={producto.imagenUrl || producto.imagen}
              alt={producto?.descripcion || 'Producto'}
              loading="lazy"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <MotoProductImage producto={producto} imgClassName="!object-contain" />
          )}
        </div>
      </button>

      <div className="flex flex-1 flex-col px-4 pb-4">
        {marca && <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: primary }}>{marca}</p>}
        <button type="button" onClick={onClick} className="text-left">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-[15px] font-bold uppercase leading-tight tracking-[0.01em]" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>{producto?.descripcion}</h3>
        </button>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: MOTO.faint }}>Desde</span>
          <span className="text-[19px] font-extrabold" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>{money(pricing.precioFinal)}</span>
          {pricing.enOferta && <span className="text-xs font-medium line-through" style={{ color: MOTO.faint }}>{money(pricing.precioRegular)}</span>}
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={onClick}
            className="flex h-11 w-full items-center justify-center gap-1.5 rounded-lg text-[11px] font-bold uppercase tracking-[0.08em] text-white transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: primary }}
          >
            <Icon icon="solar:eye-linear" width={15} /> Comprar
          </button>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onAddToCart?.(addPayload); }}
          className="mt-2 flex h-10 items-center justify-center gap-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-[0.08em] transition-colors hover:bg-black/[0.03]"
          style={{ borderColor: MOTO.line, color: MOTO.body }}
        >
          <Icon icon="solar:cart-plus-linear" width={16} /> Añadir al carrito
        </button>
      </div>
    </motion.article>
  );
}

/* ─────────────────────────────────── Header ─────────────────────────────── */

const NAV_LINKS = ['Servicio', 'Tuning', 'Repuestos', 'Equipamiento', 'Envíos y garantía'];

export function MotoHeader({
  tienda,
  slug,
  cp,
  diseno,
  carritoSize,
  onOpenCart,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  allCategories = [],
}: {
  tienda: any;
  slug: string;
  cp: string;
  diseno?: any;
  carritoSize: number;
  onOpenCart: () => void;
  searchQuery?: string;
  setSearchQuery?: (value: string) => void;
  onSearchSubmit?: (e: React.FormEvent, value?: string) => void;
  allCategories?: any[];
}) {
  const primary = motoPrimary(cp);
  const name = storeName(tienda, diseno);
  const [openFavs, setOpenFavs] = useState(false);
  const { getFavoritosBySlug, removeFavorito } = useFavoritosStore();
  const favoritos = getFavoritosBySlug(slug);
  const socials = getSocials(tienda, diseno);
  const categories = allCategories.map((cat) => (typeof cat === 'string' ? cat : cat?.nombre)).filter(Boolean).slice(0, 4);
  const phoneStore = diseno?.motosHeaderPhone || tienda?.whatsappTienda || tienda?.telefono || '+51 999 955 41 43';
  const phoneService = diseno?.motosHeaderPhoneService || tienda?.celular || '+51 999 938 47 39';
  const goProduct = (id: any) => {
    if (slug === 'preview') { window.dispatchEvent(new CustomEvent('preview-nav', { detail: 'catalogo' })); return; }
    window.location.href = `/tienda/${slug}/producto/${id}`;
  };

  const CONTACT_COLS = [
    { label: 'Tienda', phone: phoneStore },
    { label: 'Servicio técnico', phone: phoneService },
  ];

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: motoEase }}
        className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderColor: MOTO.line }}
      >
        {/* Fila superior: logo + contactos + acciones */}
        <div className="mx-auto flex h-[64px] max-w-7xl items-center gap-4 px-6">
          <a href={`/tienda/${slug}`} className="flex shrink-0 items-center gap-2.5 leading-none">
            {tienda?.logo ? (
              <img src={tienda.logo} alt={name} className="h-9 object-contain" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `linear-gradient(135deg, ${MOTO.ink}, ${MOTO.nightSoft})` }}>
                <Icon icon="mdi:motorbike-electric" width={20} className="text-white" />
              </span>
            )}
            <span className="hidden flex-col sm:flex">
              <span className="text-lg font-extrabold uppercase tracking-[0.02em]" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>{name}</span>
            </span>
          </a>

          <div className="ml-4 hidden items-center gap-7 lg:flex">
            {CONTACT_COLS.map((c) => (
              <div key={c.label} className="leading-tight">
                <p className="text-[11px]" style={{ color: MOTO.faint }}>{c.label}</p>
                <a href={`tel:${String(c.phone).replace(/[^\d+]/g, '')}`} className="flex items-center gap-1 text-[13px] font-bold" style={{ color: MOTO.ink }}>
                  <Icon icon="solar:phone-bold" width={12} style={{ color: primary }} /> {c.phone}
                </a>
              </div>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <a href={waLink(tienda, 'Hola, tengo una consulta')} target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 rounded-lg border px-4 py-2.5 text-[12px] font-bold md:flex" style={{ borderColor: MOTO.line, color: MOTO.ink }}>
              <Icon icon="solar:question-circle-linear" width={16} /> Hacer consulta
            </a>
            <a href={waLink(tienda, 'Hola, quiero que me llamen')} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-[12px] font-bold text-white transition-transform hover:-translate-y-0.5" style={{ backgroundColor: primary }}>
              <Icon icon="solar:phone-calling-linear" width={16} /> Te llamamos
            </a>
            <a href={`/tienda/${slug}/seguimiento`} className="flex h-10 w-10 items-center justify-center rounded-lg border transition-colors hover:bg-black/[0.03]" style={{ borderColor: MOTO.line, color: MOTO.ink }} title="Mi cuenta / Seguir pedido">
              <Icon icon="solar:user-linear" width={20} />
            </a>
          </div>
        </div>

        {/* Fila inferior: catálogo + nav + búsqueda + iconos */}
        <div className="border-t" style={{ borderColor: MOTO.lineSoft }}>
          <div className="mx-auto flex h-[56px] max-w-7xl items-center gap-3 px-6">
            <a href={`/tienda/${slug}/catalogo`} className="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.06em]" style={{ backgroundColor: MOTO.soft, color: MOTO.ink }}>
              <Icon icon="solar:widget-2-bold" width={16} /> Catálogo
            </a>
            <nav className="hidden items-center gap-1 lg:flex">
              {NAV_LINKS.map((label) => (
                <a key={label} href={`/tienda/${slug}/catalogo`} className="rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors" style={{ color: MOTO.body }} onMouseEnter={(e) => (e.currentTarget.style.color = MOTO.ink)} onMouseLeave={(e) => (e.currentTarget.style.color = MOTO.body)}>{label}</a>
              ))}
              <a href={`/tienda/${slug}/contacto`} className="rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors" style={{ color: MOTO.body }} onMouseEnter={(e) => (e.currentTarget.style.color = MOTO.ink)} onMouseLeave={(e) => (e.currentTarget.style.color = MOTO.body)}>Contacto</a>
            </nav>

            <div className="ml-auto flex items-center gap-1.5">
              {socials.length > 0 && (
                <div className="hidden items-center gap-1 border-r pr-2 md:flex" style={{ borderColor: MOTO.line }}>
                  {socials.map((s) => (
                    <a key={s.key} href={s.url} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-black/[0.04]" style={{ color: MOTO.muted }} title={s.label} aria-label={s.label}>
                      <Icon icon={s.icon} width={17} />
                    </a>
                  ))}
                </div>
              )}
              <button type="button" onClick={() => setOpenFavs(true)} className="relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-black/[0.04]" style={{ color: MOTO.ink }} title="Favoritos">
                <Icon icon="solar:heart-linear" width={21} />
                {favoritos.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: primary }}>{favoritos.length}</span>
                )}
              </button>
              <button type="button" onClick={onOpenCart} className="relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-black/[0.04]" style={{ color: MOTO.ink }} title="Carrito">
                <Icon icon="solar:cart-large-2-linear" width={21} />
                {carritoSize > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: primary }}>{carritoSize}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Categorías reales (mobile) */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto border-t px-6 py-2.5 lg:hidden" style={{ borderColor: MOTO.lineSoft }}>
            {categories.map((category) => (
              <a key={category} href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(category)}`} className="shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ borderColor: MOTO.line, color: MOTO.body }}>{category}</a>
            ))}
          </div>
        )}
      </motion.header>

      <MotoFavoritesModal open={openFavs} onClose={() => setOpenFavs(false)} slug={slug} cp={primary} favoritos={favoritos} onRemove={removeFavorito} onProduct={goProduct} />
    </>
  );
}

/* ─────────────────────────── WhatsApp flotante ──────────────────────────── */

export function MotoWhatsAppFab({ tienda }: { tienda: any }) {
  return (
    <a
      href={waLink(tienda)}
      target="_blank"
      rel="noreferrer"
      className="group fixed bottom-6 right-6 z-50 flex h-14 items-center gap-0 overflow-hidden rounded-full text-white shadow-[0_14px_34px_-10px_rgba(37,211,102,0.7)]"
      style={{ backgroundColor: '#25D366' }}
      aria-label="Escríbenos por WhatsApp"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center">
        <Icon icon="mdi:whatsapp" width={28} />
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-[200px] group-hover:pr-6">
        ¿Te asesoramos?
      </span>
    </a>
  );
}

/* ─────────────────────────────────── Footer ─────────────────────────────── */

export function MotoFooter({ tienda, slug, diseno, cp, categories = [] }: { tienda: any; slug: string; diseno?: any; cp: string; categories?: any[] }) {
  const primary = motoPrimary(cp);
  const name = storeName(tienda, diseno);
  const cats = categories.map((cat) => (typeof cat === 'string' ? cat : cat?.nombre)).filter(Boolean).slice(0, 5);
  const phone = diseno?.motosFooterPhone || tienda?.whatsappTienda || tienda?.telefono || '+51 999 999 999';
  const socials = getSocials(tienda, diseno);

  return (
    <motion.footer initial="hidden" whileInView="show" viewport={motoViewport} variants={motoSection} style={{ backgroundColor: MOTO.night, color: MOTO.onNight }}>
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: `linear-gradient(135deg, ${primary}, ${MOTO.nightSoft})` }}>
              <Icon icon="mdi:motorbike-electric" width={22} className="text-white" />
            </span>
            <h3 className="text-2xl font-extrabold uppercase tracking-[0.04em]" style={{ fontFamily: MOTO.display, color: '#fff' }}>{name}</h3>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-7" style={{ color: MOTO.onNightMuted }}>
            {diseno?.motosFooterText || tienda?.descripcionTienda || 'Concesionario y taller especializado en motos eléctricas. Venta, servicio técnico, repuestos y accesorios con garantía oficial.'}
          </p>
          {socials.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {socials.map((s) => (
                <a key={s.key} href={s.url} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-lg border transition-colors hover:border-white/30" style={{ borderColor: 'rgba(255,255,255,0.12)', color: MOTO.onNightMuted, backgroundColor: MOTO.nightSoft }} title={s.label} aria-label={s.label}>
                  <Icon icon={s.icon} width={19} />
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: primary }}>Catálogo</h4>
          <div className="space-y-3 text-sm" style={{ color: MOTO.onNightMuted }}>
            {cats.length ? (
              cats.map((cat) => (
                <a key={cat} href={`/tienda/${slug}/catalogo?category=${encodeURIComponent(cat)}`} className="block transition-colors hover:text-white">{cat}</a>
              ))
            ) : (
              <a href={`/tienda/${slug}/catalogo`} className="block transition-colors hover:text-white">Ver todo</a>
            )}
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: primary }}>Servicio</h4>
          <div className="space-y-3 text-sm" style={{ color: MOTO.onNightMuted }}>
            <a href={`/tienda/${slug}/contacto`} className="block transition-colors hover:text-white">Agenda tu service</a>
            <a href={`/tienda/${slug}/seguimiento`} className="block transition-colors hover:text-white">Seguir mi pedido</a>
            <a href={`/tienda/${slug}/catalogo`} className="block transition-colors hover:text-white">Repuestos y accesorios</a>
            <a href={`/tienda/${slug}/contacto`} className="block transition-colors hover:text-white">Contacto</a>
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: primary }}>Atención</h4>
          <p className="text-sm" style={{ color: MOTO.onNightMuted }}>{phone}</p>
          <p className="mt-3 text-sm" style={{ color: MOTO.onNightMuted }}>{diseno?.motosFooterEmail || tienda?.email || tienda?.correo || 'ventas@voltiamotos.pe'}</p>
          <a href={waLink(tienda, 'Hola, quiero una llamada')} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white" style={{ backgroundColor: primary }}>
            <Icon icon="solar:phone-calling-linear" width={14} /> Te llamamos
          </a>
        </div>
      </div>
      <div className="border-t px-6 py-5 text-center text-xs" style={{ borderColor: 'rgba(255,255,255,0.1)', color: MOTO.onNightMuted }}>© 2026 {name}. Powered by Falconext.</div>
    </motion.footer>
  );
}

/* ─────────────────────────── Modal / Drawer carrito ─────────────────────── */

export function MotoCartModal({
  isOpen,
  onClose,
  carrito,
  actualizarCantidad,
  onCheckout,
  cp,
  tienda,
}: {
  isOpen: boolean;
  onClose: () => void;
  carrito: any[];
  setCarrito?: (c: any[]) => void;
  actualizarCantidad: (id: number | string, cantidad: number) => void;
  onCheckout: () => void;
  cp: string;
  tienda?: any;
}) {
  const primary = motoPrimary(cp);
  const total = carrito.reduce((acc, item) => acc + Number(item.precioUnitario || item.precio || 0) * Number(item.cantidad || 1), 0);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  const cotizar = () => {
    if (!carrito.length) return;
    const nombre = tienda?.nombreComercial || tienda?.razonSocial || tienda?.nombre || 'la tienda';
    const lineas = carrito.map((i) => `• ${i.cantidad || 1}x ${i.descripcion} — ${money(Number(i.precioUnitario || i.precio || 0) * Number(i.cantidad || 1))}`).join('\n');
    const msg = `Hola ${nombre}, quiero cotizar estos productos:\n\n${lineas}\n\nTotal estimado: ${money(total)}`;
    window.open(waLink(tienda, msg), '_blank', 'noopener,noreferrer');
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] isolate" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/45 backdrop-blur-sm" />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed inset-y-0 right-0 flex w-full max-w-md flex-col shadow-2xl"
            style={{ backgroundColor: MOTO.page }}
          >
            <div className="flex items-center justify-between border-b bg-white px-6 py-5" style={{ borderColor: MOTO.line }}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: withAlpha(primary, '14'), color: primary }}>
                  <Icon icon="solar:cart-large-2-bold" width={20} />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: MOTO.faint }}>Tu garaje</p>
                  <h3 className="text-xl font-bold uppercase leading-none" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>Carrito</h3>
                </div>
              </div>
              <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5" style={{ color: MOTO.muted }} title="Cerrar">
                <Icon icon="solar:close-circle-linear" width={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              {carrito.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                  <Icon icon="solar:cart-cross-linear" className="text-5xl" style={{ color: MOTO.faint }} />
                  <p className="mt-4 text-sm font-medium" style={{ color: MOTO.muted }}>Tu carrito está vacío.</p>
                </div>
              ) : (
                carrito.map((item) => {
                  const itemId = item.cartId || item.id;
                  const qty = Number(item.cantidad || 1);
                  const price = Number(item.precioUnitario || item.precio || 0);
                  return (
                    <div key={itemId} className="flex gap-4 border-b py-5" style={{ borderColor: MOTO.line }}>
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white ring-1" style={{ ['--tw-ring-color' as any]: MOTO.line }}>
                        <MotoProductImage producto={item} imgClassName="!object-contain p-1" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold leading-5" style={{ color: MOTO.ink }}>{item.descripcion}</p>
                        <p className="mt-1 text-sm font-bold" style={{ color: primary }}>{money(price * qty)}</p>
                        <div className="mt-2.5 flex items-center justify-between gap-3">
                          <div className="flex h-9 items-center rounded-lg border bg-white" style={{ borderColor: MOTO.line }}>
                            <button type="button" onClick={() => actualizarCantidad(itemId, qty - 1)} className="h-9 w-9 text-sm font-bold" style={{ color: MOTO.muted }}>-</button>
                            <span className="w-8 text-center text-sm font-semibold" style={{ color: MOTO.ink }}>{qty}</span>
                            <button type="button" onClick={() => actualizarCantidad(itemId, qty + 1)} className="h-9 w-9 text-sm font-bold" style={{ color: MOTO.muted }}>+</button>
                          </div>
                          <button type="button" onClick={() => actualizarCantidad(itemId, 0)} className="flex h-9 w-9 items-center justify-center rounded-full text-red-500 hover:bg-red-50">
                            <Icon icon="solar:trash-bin-trash-linear" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {carrito.length > 0 && (
              <div className="border-t bg-white px-6 py-5" style={{ borderColor: MOTO.line }}>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: MOTO.muted }}>Total</span>
                  <span className="text-2xl font-extrabold" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>{money(total)}</span>
                </div>
                <button type="button" onClick={onCheckout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-4 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-lg transition-transform hover:-translate-y-0.5" style={{ backgroundColor: primary }}>
                  Finalizar compra <Icon icon="solar:arrow-right-linear" width={16} />
                </button>
                <button type="button" onClick={cotizar} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border py-3.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:bg-black/[0.03]" style={{ borderColor: MOTO.line, color: MOTO.ink }}>
                  <Icon icon="mdi:whatsapp" width={18} /> Cotizar por WhatsApp
                </button>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ─────────────────────────── Modal / Drawer favoritos ───────────────────── */

export function MotoFavoritesModal({
  open,
  onClose,
  slug,
  cp,
  favoritos,
  onRemove,
  onProduct,
}: {
  open: boolean;
  onClose: () => void;
  slug: string;
  cp: string;
  favoritos: any[];
  onRemove: (id: number, slug: string) => void;
  onProduct: (id: number | string) => void;
}) {
  const primary = motoPrimary(cp);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] isolate" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/45 backdrop-blur-sm" />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed inset-y-0 right-0 flex w-full max-w-md flex-col shadow-2xl"
            style={{ backgroundColor: MOTO.page }}
          >
            <div className="flex items-center justify-between border-b bg-white px-6 py-5" style={{ borderColor: MOTO.line }}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: withAlpha(primary, '14'), color: primary }}>
                  <Icon icon="solar:heart-bold" width={20} />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: MOTO.faint }}>Tu garaje soñado</p>
                  <h3 className="text-xl font-bold uppercase leading-none" style={{ fontFamily: MOTO.display, color: MOTO.ink }}>Favoritos</h3>
                </div>
              </div>
              <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5" style={{ color: MOTO.muted }} title="Cerrar">
                <Icon icon="solar:close-circle-linear" width={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              {favoritos.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                  <Icon icon="solar:heart-linear" className="text-5xl" style={{ color: MOTO.faint }} />
                  <p className="mt-4 text-sm font-medium" style={{ color: MOTO.muted }}>Aún no tienes favoritos.</p>
                  <p className="mt-1 text-xs" style={{ color: MOTO.faint }}>Toca el corazón en una moto para guardarla aquí.</p>
                </div>
              ) : (
                favoritos.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b py-5" style={{ borderColor: MOTO.line }}>
                    <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white ring-1" style={{ ['--tw-ring-color' as any]: MOTO.line }}>
                      <MotoProductImage producto={item} imgClassName="!object-contain p-1" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="block text-left">
                        <p className="line-clamp-2 text-sm font-semibold leading-5" style={{ color: MOTO.ink }}>{item.descripcion}</p>
                      </button>
                      <p className="mt-1 text-sm font-bold" style={{ color: primary }}>{money(item.precioUnitario)}</p>
                      <div className="mt-2.5 flex items-center gap-3">
                        <button type="button" onClick={() => { onProduct(item.id); onClose(); }} className="rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white" style={{ backgroundColor: primary }}>
                          Ver moto
                        </button>
                        <button type="button" onClick={() => onRemove(Number(item.id), slug)} className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 hover:bg-red-50" title="Quitar">
                          <Icon icon="solar:trash-bin-trash-linear" width={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t bg-white px-6 py-5" style={{ borderColor: MOTO.line }}>
              <a href={`/tienda/${slug}/catalogo`} className="flex w-full items-center justify-center gap-2 rounded-lg border py-3.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:bg-black/[0.03]" style={{ borderColor: MOTO.line, color: MOTO.ink }}>
                Seguir explorando
              </a>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
