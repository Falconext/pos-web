/**
 * Botones del menú y tarjetas de servicios de la plantilla Spa que el dueño
 * puede editar (texto y destino) desde "Personalizar tienda". Archivo liviano:
 * lo usan la plantilla y el panel (`liveEditorFields`).
 */
import type { DefItemMenu } from '@/components/tienda/navTienda';
import type { DefBloque } from '@/templates/shared/destinoBloque';

export const SPA_MENU: DefItemMenu[] = [
  { textoKey: 'spaMenu1Text', accionKey: 'spaMenu1Action', textoPorDefecto: 'Servicios' },
];

/** Servicios estrella del inicio: la categoría parecida o, si no existe, la búsqueda de siempre. */
export const SPA_SERVICIOS: DefBloque[] = [
  { textoKey: 'spaService1Text', accionKey: 'spaService1Action', textoPorDefecto: 'Faciales & Skincare', categorias: ['Faciales', 'Facial', 'Skincare'], busqueda: 'facial' },
  { textoKey: 'spaService2Text', accionKey: 'spaService2Action', textoPorDefecto: 'Masajes & Corporales', categorias: ['Masajes', 'Masaje', 'Corporales'], busqueda: 'masaje' },
  { textoKey: 'spaService3Text', accionKey: 'spaService3Action', textoPorDefecto: 'Uñas · Mani & Pedi', categorias: ['Uñas', 'Manicure', 'Pedicure'], busqueda: 'uñas' },
  { textoKey: 'spaService4Text', accionKey: 'spaService4Action', textoPorDefecto: 'Cabello & Maquillaje', categorias: ['Cabello', 'Peluquería', 'Maquillaje'], busqueda: 'cabello' },
];
