import type { DefItemMenu } from '@/components/tienda/navTienda';

/**
 * Botones del menú de la plantilla motos. Sin destino elegido, cada uno va a la
 * categoría real de nombre parecido; si no hay, Servicio y Envíos abren el
 * WhatsApp de la tienda con el mensaje listo (así se agenda un servicio o se
 * consulta un envío en Perú); sin número, van a contacto. El resto, al catálogo.
 */
export const MOTOS_MENU: DefItemMenu[] = [
  { textoKey: 'motosMenu1Text', accionKey: 'motosMenu1Action', textoPorDefecto: 'Servicio', rutaPorDefecto: '/contacto', whatsappTexto: 'Hola, quiero agendar un servicio para mi moto.' },
  { textoKey: 'motosMenu2Text', accionKey: 'motosMenu2Action', textoPorDefecto: 'Tuning' },
  { textoKey: 'motosMenu3Text', accionKey: 'motosMenu3Action', textoPorDefecto: 'Repuestos' },
  { textoKey: 'motosMenu4Text', accionKey: 'motosMenu4Action', textoPorDefecto: 'Equipamiento' },
  { textoKey: 'motosMenu5Text', accionKey: 'motosMenu5Action', textoPorDefecto: 'Envíos y garantía', rutaPorDefecto: '/contacto', whatsappTexto: 'Hola, quiero consultar sobre envíos y garantía.' },
];

/** Columna "Servicio" del pie de página: el botón que lleva a productos. */
export const MOTOS_FOOTER_MENU: DefItemMenu[] = [
  { textoKey: 'motosFooterMenu1Text', accionKey: 'motosFooterMenu1Action', textoPorDefecto: 'Repuestos y accesorios' },
];
