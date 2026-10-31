/**
 * Botones del menú de la plantilla Carteras (Luxora) que el dueño puede editar
 * (texto y destino) desde "Personalizar tienda". Archivo liviano: lo usan la
 * plantilla y el panel (`liveEditorFields`).
 */
import type { DefItemMenu } from '@/components/tienda/navTienda';

export const CARTERAS_MENU: DefItemMenu[] = [
  { textoKey: 'carterasMenu1Text', accionKey: 'carterasMenu1Action', textoPorDefecto: 'Novedades', rutaPorDefecto: '/catalogo?sort=new' },
];
