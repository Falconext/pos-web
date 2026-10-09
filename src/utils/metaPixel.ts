/**
 * D1 — Pixel de Meta de la tienda.
 *
 * Sin esto, una campaña pagada no sabe qué anuncio trajo la venta y el
 * negocio invierte a ciegas. El id lo configura cada empresa y llega con los
 * datos de la tienda; sin id no se carga nada, que es lo correcto para quien
 * no hace campañas.
 *
 * Solo en la tienda pública: el panel de administración no se mide.
 */

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[] };
    _fbq?: unknown;
  }
}

/** Qué pixel está cargado. Evita montarlo dos veces al navegar. */
let pixelActivo: string | null = null;

/**
 * Carga el pixel una sola vez. Llamar de nuevo con el mismo id no hace nada;
 * con otro id (otra tienda en la misma pestaña) lo cambia.
 */
export function iniciarPixel(id?: string | null): void {
  const pixel = (id ?? '').trim();
  if (!pixel || typeof window === 'undefined') return;
  if (pixelActivo === pixel) return;

  if (!window.fbq) {
    // El fragmento estándar de Meta: deja una cola para que los eventos
    // disparados antes de que cargue el script no se pierdan.
    const cola: unknown[] = [];
    const fbq = Object.assign(
      (...args: unknown[]) => {
        cola.push(args);
      },
      { queue: cola },
    );
    window.fbq = fbq;
    window._fbq = fbq;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }

  window.fbq?.('init', pixel);
  pixelActivo = pixel;
}

/**
 * Registra un evento. Si no hay pixel configurado no pasa nada: la tienda
 * funciona igual, simplemente no se mide.
 */
export function rastrear(
  evento: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout',
  datos?: Record<string, unknown>,
): void {
  if (!pixelActivo || typeof window === 'undefined') return;
  window.fbq?.('track', evento, datos);
}

/** Lo que Meta espera de un producto. Los ids van como texto. */
export function datosDeProducto(producto: {
  id?: number | string;
  precioUnitario?: number | string;
  precioOferta?: number | string | null;
  cantidad?: number;
}): Record<string, unknown> {
  const precio = Number(producto.precioOferta ?? producto.precioUnitario ?? 0);
  return {
    content_ids: [String(producto.id ?? '')],
    content_type: 'product',
    value: Number.isFinite(precio) ? precio : 0,
    currency: 'PEN',
    ...(producto.cantidad ? { contents_quantity: producto.cantidad } : {}),
  };
}

/** Solo para los tests: olvida qué pixel estaba cargado. */
export function _reiniciarPixel(): void {
  pixelActivo = null;
}
