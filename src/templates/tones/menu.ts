import type { DefItemMenu } from '@/components/tienda/navTienda';

/** Botones configurables del menú de Tones (antes "Novedades" fijo). */
export const TONES_MENU: DefItemMenu[] = [
  { textoKey: 'tonesMenu1Text', accionKey: 'tonesMenu1Action', textoPorDefecto: 'Novedades', destinoPorDefecto: 'catalog', rutaPorDefecto: '/catalogo?sort=new' },
];
