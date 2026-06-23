
export type PlantillaId =
  | 'moderna'
  | 'minimal'
  | 'elegante'
  | 'tecnica'
  | 'mercado'
  | 'salud'
  | 'menu'
  | 'gadgets'
  | 'autopartes'
  | 'moda'
  | 'urbano';

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
  /** Restricted to specific subscription plans. If undefined or empty, allowed for all plans. */
  planesPermitidos?: string[];
  /** Restricted to specific rubros (by name). If undefined or empty, allowed for all rubros. */
  rubrosPermitidos?: string[];
}

export function normalizeRubroName(value?: string | null): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function isTemplateAllowedForRubro(template: Pick<TemplateConfig, 'rubrosPermitidos'>, rubroNombre?: string | null): boolean {
  if (!template.rubrosPermitidos || template.rubrosPermitidos.length === 0) return true;

  const rubro = normalizeRubroName(rubroNombre);
  if (!rubro) return true;

  return template.rubrosPermitidos.some((permitido) => {
    const allowed = normalizeRubroName(permitido);
    if (!allowed) return false;
    return rubro === allowed || rubro.includes(allowed) || allowed.includes(rubro);
  });
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
    rubrosPermitidos: ['Retail y comercio', 'Comercio minorista', 'Artesanía y decoración', 'Librería y Papelería', 'Otros servicios', 'Venta de materiales de construcción'],
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
    rubrosPermitidos: ['Retail y comercio', 'Comercio minorista', 'Artesanía y decoración', 'Belleza y cuidado personal', 'Textil y confección', 'Textil y confecciones', 'Moda, Ropa Y Calzado', 'Moda', 'Ropa', 'Calzado'],
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
    rubrosPermitidos: ['Textil y confección', 'Textil y confecciones', 'Belleza y cuidado personal', 'Artesanía y decoración', 'Moda, Ropa Y Calzado', 'Moda', 'Ropa', 'Calzado'],
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
    rubrosPermitidos: ['Ferretería', 'Tecnología y software', 'Ventas de accesorios y repuestos de cómputo', 'Tecnologías de la información', 'Automotriz y repuestos', 'Construcción y obras', 'Venta de materiales de construcción'],
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
    rubrosPermitidos: ['Bodega y Abarrotes', 'Supermarket', 'Minimarket', 'Comercio minorista'],
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
    rubrosPermitidos: ['Farmacia', 'Botica', 'Farmacia Veterinaria', 'Salud y bienestar'],
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
    rubrosPermitidos: ['Restaurante y alimentos', 'Restaurantes y comida', 'Panadería y Pastelería'],
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
    rubrosPermitidos: ['Tecnología y software', 'Ventas de accesorios y repuestos de cómputo', 'Tecnologías de la información'],
  },
  autopartes: {
    cardComponent: 'ProductCardPio',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: true,
    showCategoryCircles: false,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-square',
    label: 'Autopartes',
    description: 'Diseño oscuro e industrial con selector de vehículos. Ideal para repuestos y accesorios.',
    accentColor: '#D92D20',
    icon: 'solar:wheel-bold',
    planesPermitidos: ['CORPORATIVO', 'VIP'],
    rubrosPermitidos: ['Automotriz y repuestos'],
  },
  moda: {
    cardComponent: 'ProductCardPio', // We can update this later if we create a specific card for moda
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: false,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: true,
    showSidebar: true,
    imageAspect: 'aspect-[3/4]',
    label: 'Moda',
    description: 'Diseño ultra limpio, estética editorial, tipografías finas. Ideal para ropa y alta costura.',
    accentColor: '#B58863',
    icon: 'solar:hanger-bold',
    rubrosPermitidos: ['Textil y confección', 'Textil y confecciones', 'Moda, Ropa Y Calzado', 'Moda', 'Ropa', 'Calzado', 'Boutique'],
  },
  'urbano': {
    cardComponent: 'ProductCardPio',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: false,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: false,
    imageAspect: 'aspect-[3/4]',
    label: 'Urbano',
    description: 'Diseño street y contemporáneo, oscuro y minimalista. Ideal para marcas modernas.',
    accentColor: '#111827',
    icon: 'solar:t-shirt-bold',
    rubrosPermitidos: ['Moda', 'Ropa', 'Textil y confección', 'Moda Urbana'],
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
