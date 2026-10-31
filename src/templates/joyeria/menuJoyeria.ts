/**
 * Botones del menú de la plantilla Joyería (Aurum) que el dueño puede editar
 * (texto y destino) desde "Personalizar tienda". Archivo liviano: lo usan la
 * plantilla y el panel (`liveEditorFields`).
 */
import type { DefItemMenu } from '@/components/tienda/navTienda';

export const JOYERIA_MENU: DefItemMenu[] = [
  { textoKey: 'joyeriaMenu1Text', accionKey: 'joyeriaMenu1Action', textoPorDefecto: 'novedades', rutaPorDefecto: '/catalogo?sort=new' },
  { textoKey: 'joyeriaMenu2Text', accionKey: 'joyeriaMenu2Action', textoPorDefecto: 'colección' },
];
