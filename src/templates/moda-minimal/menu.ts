import type { DefItemMenu } from '@/components/tienda/navTienda';

/**
 * Botones 1–4 del menú (reutilizan los textos `modaMinimalNav1..4` que los
 * dueños ya escribieron). Sin destino elegido: la categoría de nombre parecido;
 * si no hay, "Novedades" muestra lo más nuevo y el resto el catálogo.
 * El 5.º ("Nosotros") sigue yendo a contacto.
 */
export const MODA_MINIMAL_MENU: DefItemMenu[] = [
  { textoKey: 'modaMinimalNav1', accionKey: 'modaMinimalNav1Action', textoPorDefecto: 'Novedades', rutaPorDefecto: '/catalogo?sort=new' },
  { textoKey: 'modaMinimalNav2', accionKey: 'modaMinimalNav2Action', textoPorDefecto: 'Ropa' },
  { textoKey: 'modaMinimalNav3', accionKey: 'modaMinimalNav3Action', textoPorDefecto: 'Calzado' },
  { textoKey: 'modaMinimalNav4', accionKey: 'modaMinimalNav4Action', textoPorDefecto: 'Colección' },
];
