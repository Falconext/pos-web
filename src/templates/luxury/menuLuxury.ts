/**
 * Botones del menú y destinos de la plantilla Luxury (perfumería) que el dueño
 * puede editar (texto y destino) desde "Personalizar tienda". Archivo liviano:
 * lo usan la plantilla y el panel (`liveEditorFields`).
 */
import type { DefItemMenu } from '@/components/tienda/navTienda';
import type { DefBloque } from '@/templates/shared/destinoBloque';

export const LUXURY_MENU: DefItemMenu[] = [
  { textoKey: 'luxuryMenu1Text', accionKey: 'luxuryMenu1Action', textoPorDefecto: 'Colección' },
];

/** Tarjetas "Colecciones" del inicio: van a la categoría parecida; si la tienda no la tiene, al catálogo. */
export const LUXURY_COLECCIONES: DefBloque[] = [
  { textoKey: 'luxuryCollection1Text', accionKey: 'luxuryCollection1Action', textoPorDefecto: 'Para ella', categorias: ['Mujer', 'Mujeres', 'Dama', 'Damas', 'Femenino'] },
  { textoKey: 'luxuryCollection2Text', accionKey: 'luxuryCollection2Action', textoPorDefecto: 'Para él', categorias: ['Hombre', 'Hombres', 'Caballero', 'Caballeros', 'Masculino'] },
  { textoKey: 'luxuryCollection3Text', accionKey: 'luxuryCollection3Action', textoPorDefecto: 'Unisex', categorias: ['Unisex'] },
  { textoKey: 'luxuryCollection4Text', accionKey: 'luxuryCollection4Action', textoPorDefecto: 'Nicho selecto', categorias: ['Nicho'] },
];

/** Familias olfativas del inicio: la categoría parecida o, si no existe, la búsqueda de siempre. */
export const LUXURY_FAMILIAS: DefBloque[] = [
  { textoKey: 'luxuryFamily1Text', accionKey: 'luxuryFamily1Action', textoPorDefecto: 'Floral', busqueda: 'floral' },
  { textoKey: 'luxuryFamily2Text', accionKey: 'luxuryFamily2Action', textoPorDefecto: 'Amaderado', busqueda: 'amaderado' },
  { textoKey: 'luxuryFamily3Text', accionKey: 'luxuryFamily3Action', textoPorDefecto: 'Cítrico', busqueda: 'citrico' },
  { textoKey: 'luxuryFamily4Text', accionKey: 'luxuryFamily4Action', textoPorDefecto: 'Oriental', busqueda: 'oriental' },
  { textoKey: 'luxuryFamily5Text', accionKey: 'luxuryFamily5Action', textoPorDefecto: 'Fresco', busqueda: 'fresco' },
  { textoKey: 'luxuryFamily6Text', accionKey: 'luxuryFamily6Action', textoPorDefecto: 'Dulce', busqueda: 'dulce' },
];

/** Botones del hero: "Explorar colección" (catálogo) y "Ver ofertas" (categoría Ofertas o búsqueda "oferta"). */
export const LUXURY_HERO_BOTONES: DefBloque[] = [
  { textoKey: 'luxuryHeroButton', accionKey: 'luxuryHeroAction', textoPorDefecto: 'Explorar colección' },
  { textoKey: 'luxuryHeroButton2', accionKey: 'luxuryHeroButton2Action', textoPorDefecto: 'Ver ofertas', categorias: ['Ofertas'], busqueda: 'oferta' },
];
