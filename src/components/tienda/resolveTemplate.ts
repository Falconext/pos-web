
export type PlantillaId =
  | 'moderna'
  | 'minimal'
  | 'elegante'
  | 'tecnica'
  | 'mercado'
  | 'salud'
  | 'menu'
  | 'gadgets';

export interface BannerSlotDef {
  orden: number;
  tipo: 'hero' | 'side' | 'promo' | 'membership' | 'slider';
  label: string;
  description: string;
  recomendado: string;
}

export interface TemplateConfig {
  /** Component used for each product card */
  cardComponent: string;
  /** Grid columns on desktop */
  gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' | 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' | 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  /** Show discount badge */
  showDiscount: boolean;
  /** Show stock indicator */
  showStock: boolean;
  /** Show category circles on homepage */
  showCategoryCircles: boolean;
  /** true = carousel/slider, false = classic hero+side layout */
  bannerIsSlider: boolean;
  /** Banner slots for this template. Empty = no banners */
  bannerSlots: BannerSlotDef[];
  /** Show combos section */
  showCombos: boolean;
  /** Show sidebar filters in catalog */
  showSidebar: boolean;
  /** Card aspect ratio for images */
  imageAspect: 'aspect-square' | 'aspect-[4/3]' | 'aspect-[3/4]';
  /** Display name */
  label: string;
  /** Short description */
  description: string;
  /** Preview thumbnail color (for admin UI) */
  accentColor: string;
  /** Icon for admin UI */
  icon: string;
}

const CLASSIC_BANNER_SLOTS: BannerSlotDef[] = [
  { orden: 0, tipo: 'hero',       label: 'Banner hero',          description: 'Principal con título, subtítulo e imagen', recomendado: '1200×500px' },
  { orden: 1, tipo: 'side',       label: 'Tarjeta derecha sup.', description: 'Categoría o producto destacado',            recomendado: '600×250px' },
  { orden: 2, tipo: 'side',       label: 'Tarjeta derecha inf.', description: 'Categoría o producto destacado',            recomendado: '600×250px' },
  { orden: 3, tipo: 'promo',      label: 'Promo izquierdo',      description: 'Campaña o categoría (fondo verde)',         recomendado: '700×280px' },
  { orden: 4, tipo: 'promo',      label: 'Promo derecho',        description: 'Campaña o categoría (fondo naranja)',       recomendado: '700×280px' },
  { orden: 5, tipo: 'membership', label: 'Banner membresía',     description: 'Ancho completo, encima de "También te podría interesar"', recomendado: '1400×360px' },
];

export const SLIDER_BANNER_SLOTS: BannerSlotDef[] = [
  { orden: 0, tipo: 'slider', label: 'Slide 1', description: 'Primera diapositiva del carrusel', recomendado: '1400×500px' },
  { orden: 1, tipo: 'slider', label: 'Slide 2', description: 'Segunda diapositiva del carrusel', recomendado: '1400×500px' },
  { orden: 2, tipo: 'slider', label: 'Slide 3', description: 'Tercera diapositiva del carrusel', recomendado: '1400×500px' },
];

export const TEMPLATES: Record<PlantillaId, TemplateConfig> = {
  moderna: {
    cardComponent: 'ProductCardPio',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: CLASSIC_BANNER_SLOTS,
    showCombos: true,
    showSidebar: true,
    imageAspect: 'aspect-square',
    label: 'Moderna',
    description: 'Tarjetas grandes con imagen destacada. Ideal para tiendas generales y retail.',
    accentColor: '#6A6CFF',
    icon: 'solar:shop-2-bold',
  },
  minimal: {
    cardComponent: 'ProductCardEmox',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: false,
    bannerIsSlider: false,
    bannerSlots: CLASSIC_BANNER_SLOTS,
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-square',
    label: 'Minimal',
    description: 'Diseño limpio y compacto. Más productos visibles, menos distracción.',
    accentColor: '#18181B',
    icon: 'solar:minimalistic-magnifer-bold',
  },
  elegante: {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: false,
    showStock: false,
    showCategoryCircles: false,
    bannerIsSlider: false,
    bannerSlots: CLASSIC_BANNER_SLOTS,
    showCombos: false,
    showSidebar: false,
    imageAspect: 'aspect-[3/4]',
    label: 'Elegante',
    description: 'Foco en imagen vertical tipo lookbook. Perfecto para ropa, belleza y joyería.',
    accentColor: '#D4A0C5',
    icon: 'solar:star-bold',
  },
  tecnica: {
    cardComponent: 'ProductCardGromuse',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: true,
    showCategoryCircles: false,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: true,
    showSidebar: true,
    imageAspect: 'aspect-[4/3]',
    label: 'Técnica',
    description: 'Especificaciones técnicas visibles. Ideal para tecnología, ferretería y repuestos.',
    accentColor: '#1E3A5F',
    icon: 'solar:cpu-bold',
  },
  mercado: {
    cardComponent: 'ProductCardGromuse',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    showDiscount: true,
    showStock: true,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: CLASSIC_BANNER_SLOTS,
    showCombos: true,
    showSidebar: true,
    imageAspect: 'aspect-square',
    label: 'Mercado',
    description: 'Grid denso tipo supermercado. Ideal para bodegas, abarrotes y mayoristas.',
    accentColor: '#16A34A',
    icon: 'solar:cart-large-2-bold',
  },
  salud: {
    cardComponent: 'ProductCardPio',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: false,
    showStock: true,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-square',
    label: 'Salud',
    description: 'Búsqueda prominente, filtros por laboratorio y presentación. Para farmacias y boticas.',
    accentColor: '#0EA5E9',
    icon: 'solar:pill-bold',
  },
  menu: {
    cardComponent: 'ProductCardPio',
    gridCols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    showDiscount: false,
    showStock: false,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: true,
    showSidebar: false,
    imageAspect: 'aspect-[4/3]',
    label: 'Menú',
    description: 'Vista tipo carta de restaurante. Categorías como secciones, orden por mesa o delivery.',
    accentColor: '#EA580C',
    icon: 'solar:cup-hot-bold',
  },
  gadgets: {
    cardComponent: 'ProductCardXtra',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: CLASSIC_BANNER_SLOTS,
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-square',
    label: 'Gadgets',
    description: 'Cards con ticker de oferta, rating y badges animados. Ideal para tecnología, accesorios y cómputo.',
    accentColor: '#1E3A5F',
    icon: 'solar:cpu-bold',
  },
};

export const DEFAULT_TEMPLATE: PlantillaId = 'moderna';

export function resolveTemplate(plantillaId?: string | null): TemplateConfig {
  const key = (plantillaId ?? DEFAULT_TEMPLATE) as PlantillaId;
  return TEMPLATES[key] ?? TEMPLATES[DEFAULT_TEMPLATE];
}

export function resolveCardComponent(plantillaId?: string | null): string {
  return resolveTemplate(plantillaId).cardComponent;
}

export const ALL_PLANTILLAS = Object.entries(TEMPLATES).map(([id, cfg]) => ({
  id: id as PlantillaId,
  ...cfg,
}));

export function isSliderTemplate(plantillaId?: string | null): boolean {
  return resolveTemplate(plantillaId).bannerIsSlider;
}

export function getBannerSlots(plantillaId?: string | null): BannerSlotDef[] {
  return resolveTemplate(plantillaId).bannerSlots;
}

export const SLIDER_MAX_COUNT = 3;
