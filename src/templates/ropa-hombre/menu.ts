import type { DefItemMenu } from '@/components/tienda/navTienda';

/** "Novedades" del header (y de "La casa" en el pie): texto ya editable, ahora con destino. */
export const ROPA_HOMBRE_MENU: DefItemMenu[] = [
  { textoKey: 'ropaHombreNavNew', accionKey: 'ropaHombreNavNewAction', textoPorDefecto: 'Novedades', destinoPorDefecto: 'catalog', rutaPorDefecto: '/catalogo?sort=new' },
];
