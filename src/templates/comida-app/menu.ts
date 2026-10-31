import type { DefItemMenu } from '@/components/tienda/navTienda';

/**
 * "Ofertas" del header web y de la barra inferior (mismo botón, misma clave).
 * Sin destino elegido: la categoría de nombre parecido o el menú completo.
 */
export const COMIDA_APP_MENU: DefItemMenu[] = [
  { textoKey: 'comidaAppMenu1Text', accionKey: 'comidaAppMenu1Action', textoPorDefecto: 'Ofertas' },
];
