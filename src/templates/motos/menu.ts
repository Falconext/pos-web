import type { DefItemMenu } from '@/components/tienda/navTienda';

/**
 * Botones del menú de la plantilla motos. Sin destino elegido, cada uno va a la
 * categoría real de nombre parecido; si no hay, Servicio y Envíos van a
 * contacto (son consultas, no productos) y el resto al catálogo.
 */
export const MOTOS_MENU: DefItemMenu[] = [
  { textoKey: 'motosMenu1Text', accionKey: 'motosMenu1Action', textoPorDefecto: 'Servicio', rutaPorDefecto: '/contacto' },
  { textoKey: 'motosMenu2Text', accionKey: 'motosMenu2Action', textoPorDefecto: 'Tuning' },
  { textoKey: 'motosMenu3Text', accionKey: 'motosMenu3Action', textoPorDefecto: 'Repuestos' },
  { textoKey: 'motosMenu4Text', accionKey: 'motosMenu4Action', textoPorDefecto: 'Equipamiento' },
  { textoKey: 'motosMenu5Text', accionKey: 'motosMenu5Action', textoPorDefecto: 'Envíos y garantía', rutaPorDefecto: '/contacto' },
];

/** Columna "Servicio" del pie de página: el botón que lleva a productos. */
export const MOTOS_FOOTER_MENU: DefItemMenu[] = [
  { textoKey: 'motosFooterMenu1Text', accionKey: 'motosFooterMenu1Action', textoPorDefecto: 'Repuestos y accesorios' },
];
