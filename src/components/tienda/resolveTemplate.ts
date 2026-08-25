
export type PlantillaId =
  | 'moderna'
  | 'minimal'
  | 'elegante'
  | 'tecnica'
  | 'construccion'
  | 'mercado'
  | 'salud'
  | 'menu'
  | 'gadgets'
  | 'autopartes'
  | 'tecnologia'
  | 'maye'
  | 'moda'
  | 'urbano'
  | 'apicultura'
  | 'antojo'
  | 'falcon'
  | 'luxury'
  | 'spa'
  | 'carteras'
  | 'joyeria'
  | 'ropa-hombre'
  | 'bicicletas'
  | 'motos'
  | 'hoodie'
  | 'tones'
  | 'moda-minimal'
  | 'comida-app';

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
  /** Requires a separate template purchase before activation. */
  premium?: boolean;
  /** One-time price in PEN for premium templates. */
  precioSoles?: number;
  /** Short premium positioning text for admin UI. */
  premiumNote?: string;
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
  construccion: {
    cardComponent: 'ProductCardGromuse',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: true,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: CLASSIC_BANNER_SLOTS,
    showCombos: true,
    showSidebar: true,
    imageAspect: 'aspect-[4/3]',
    label: 'Ferretería',
    description: 'Plantilla tipo Hammer para ferreterías, herramientas profesionales y materiales de obra.',
    accentColor: '#F59E0B',
    icon: 'solar:buildings-3-bold',
    rubrosPermitidos: ['Ferretería', 'Construcción y obras', 'Venta de materiales de construcción', 'Materiales de construcción'],
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
  tecnologia: {
    cardComponent: 'ProductCardTecnologia',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: true,
    showCategoryCircles: false,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-square',
    label: 'Tecnología',
    description: 'Diseño oscuro y moderno para productos tecnológicos.',
    accentColor: '#3B82F6',
    icon: 'solar:laptop-minimalistic-bold',
    planesPermitidos: ['CORPORATIVO', 'VIP'],
    rubrosPermitidos: ['Tecnología y software', 'Ventas de accesorios y repuestos de cómputo', 'Tecnologías de la información'],
  },
  maye: {
    cardComponent: 'ProductCardMaye',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: true,
    showCategoryCircles: false,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-square',
    label: 'Maye',
    description: 'Experiencia ecommerce premium para tecnología: home editorial, microinteracciones y personalización avanzada.',
    accentColor: '#2563EB',
    icon: 'solar:shop-bold',
    premium: true,
    precioSoles: 199,
    premiumNote: 'Compra única aparte del plan',
    rubrosPermitidos: [],
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
  apicultura: {
    cardComponent: 'ProductCardPio',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: true,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-square',
    label: 'Apicultura',
    description: 'Diseño cálido tipo miel premium para productos naturales, apícolas y alimentos artesanales.',
    accentColor: '#FFD72E',
    icon: 'solar:jar-of-pills-bold',
    rubrosPermitidos: ['Apicultura', 'Miel', 'Productos naturales', 'Agricultura', 'Alimentos naturales', 'Panadería y Pastelería', 'Restaurante y alimentos'],
  },
  antojo: {
    cardComponent: 'ProductCardPio',
    gridCols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: true,
    showSidebar: false,
    imageAspect: 'aspect-[4/3]',
    label: 'Antojo',
    description: 'Carta apetitosa y divertida para pizzería, frappes y cremoladas. Badges caliente/helado, hero cálido y categorías circulares.',
    accentColor: '#E23744',
    icon: 'solar:pizza-bold',
    rubrosPermitidos: ['Restaurante y alimentos', 'Restaurantes y comida', 'Pizzería', 'Pizzeria', 'Heladería', 'Heladeria', 'Cremoladas', 'Frappes', 'Postres y dulces', 'Cafetería', 'Cafeteria', 'Panadería y Pastelería', 'Comida rápida'],
  },
  falcon: {
    cardComponent: 'ProductCardPio',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    showDiscount: true,
    showStock: true,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-square',
    label: 'Falcon',
    description: 'Marketplace tecnológico tipo Gadgetize: hero con banners, círculos de categorías y grilla de productos. Ideal para tecnología, cómputo y gadgets.',
    accentColor: '#1a8d4e',
    icon: 'solar:bolt-bold',
    rubrosPermitidos: ['Tecnología y software', 'Ventas de accesorios y repuestos de cómputo', 'Tecnologías de la información'],
  },
  luxury: {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: false,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-[3/4]',
    label: 'Luxury Essence',
    description: 'Boutique de lujo para perfumería: hero editorial, colecciones por género, familias olfativas, marcas premium y ambiente claro con secciones oscuras. Color primario personalizable (púrpura + oro/negro).',
    accentColor: '#6D28D9',
    icon: 'mdi:bottle-tonic-plus-outline',
    rubrosPermitidos: ['Perfumería', 'Perfumeria', 'Perfumes y fragancias', 'Belleza y cuidado personal', 'Cosmética', 'Cosmetica', 'Cosméticos', 'Retail y comercio', 'Comercio minorista'],
  },
  spa: {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: false,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-square',
    label: 'Aura Spa',
    description: 'Web de lujo para salón de belleza y spa: hero editorial, servicios (faciales, masajes, uñas, cabello), membresías, galería, testimonios, equipo y reservas por WhatsApp. Paleta nude & rosa empolvado, color primario personalizable.',
    accentColor: '#BE837C',
    icon: 'mdi:spa-outline',
    rubrosPermitidos: ['Belleza y cuidado personal', 'Spa', 'Salón de belleza', 'Salon de belleza', 'Peluquería', 'Peluqueria', 'Estética', 'Estetica', 'Barbería', 'Barberia', 'Cosmética', 'Cosmetica', 'Cosméticos', 'Bienestar', 'Servicios de belleza'],
  },
  carteras: {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: false,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-square',
    label: 'Luxora',
    description: 'Boutique editorial de lujo para carteras, bolsos y accesorios: hero elegante, tira de garantías, comprar por categoría, más vendidos con swatches, banners promocionales, club/newsletter y footer premium. Estética beige/crema/negro con tipografía serif; color de acento personalizable.',
    accentColor: '#B08D5D',
    icon: 'solar:bag-4-bold',
    premium: true,
    precioSoles: 499,
    premiumNote: 'Diseño premium valorizado en US$ 10,000 · compra única aparte del plan',
    rubrosPermitidos: ['Carteras', 'Carteras y accesorios', 'Marroquinería', 'Marroquineria', 'Bolsos', 'Accesorios', 'Accesorios de moda', 'Moda, Ropa Y Calzado', 'Moda', 'Ropa', 'Calzado', 'Textil y confección', 'Textil y confecciones', 'Boutique'],
  },
  joyeria: {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: false,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-square',
    label: 'Aurum',
    description: 'Boutique editorial de joyería fina: hero slider de 3 slides (solo-imagen o con textos y botón), tira de garantías, comprar por categoría, piezas favoritas con materiales (oro/plata/gemas), banners de grabado y club, newsletter y footer premium. Estética marfil/oro con tipografía serif de alto contraste (Cormorant); color de acento personalizable. Todo editable en vivo.',
    accentColor: '#A67C3D',
    icon: 'solar:diamond-bold',
    rubrosPermitidos: ['Joyería', 'Joyeria', 'Joyería y relojería', 'Joyeria y relojeria', 'Joyería y bisutería', 'Joyeria y bisuteria'],
  },
  'ropa-hombre': {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: false,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-[3/4]',
    label: 'Urbanic',
    description: 'Tienda editorial de ropa de hombre: hero slider de 3 slides (solo-imagen o con textos), tira de garantías, comprar por categoría, más buscados con swatches, banners promocionales, club/newsletter y footer premium. Estética beige/crema/negro con tipografía serif; color de acento personalizable. Todo editable en vivo.',
    accentColor: '#8C6A45',
    icon: 'solar:t-shirt-bold',
    rubrosPermitidos: ['Moda', 'Ropa', 'Moda, Ropa Y Calzado', 'Moda Urbana'],
  },
  bicicletas: {
    cardComponent: 'ProductCardGromuse',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: true,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-square',
    label: 'Vonica',
    description: 'Tienda racing para bicicletas, ciclismo y deportes (estilo Vonica): hero slider de 3 slides (solo-imagen o con textos y botón, cada uno enlazable), banda de colecciones destacadas, tira de garantías, categorías, más vendidos con rating y swatches, banners promocionales, club/newsletter y footer premium. Estética blanco/negro con acento rojo de alta energía y titulares condensados. Todo editable en vivo.',
    accentColor: '#E30613',
    icon: 'mdi:bike-fast',
    rubrosPermitidos: ['Bicicletas', 'Ciclismo', 'Bicicletas y accesorios', 'Deportes', 'Deportes y outdoor', 'Deportes y fitness', 'Artículos deportivos', 'Tienda deportiva', 'Outdoor'],
  },
  motos: {
    cardComponent: 'ProductCardGromuse',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: true,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-[4/3]',
    label: 'Voltia Motos',
    description: 'Concesionario y taller premium para venta de motos + servicio mecánico: home claro tipo bento con banner slider de 3 slides (solo-imagen o con textos y botón, cada uno enlazable) + tarjeta de equipamiento, tira de categorías (ofertas/preventa + categorías reales), buscador ancho, tarjetas de servicios (service/tuning/equipamiento/accesorios), carrusel de marcas, más vendidos con botones Comprar/Añadir, banners oscuros de agenda de service (taller, vía WhatsApp) y financiamiento, newsletter, detalle con ficha técnica + checkout y contacto. Redes sociales editables que aparecen solas según los enlaces configurados. Estética blanca/gris clara con acento azul eléctrico, footer oscuro y titulares condensados en mayúsculas (Archivo/Oswald); color de acento personalizable. Todo editable en vivo.',
    accentColor: '#2563EB',
    icon: 'mdi:motorbike-electric',
    rubrosPermitidos: ['Motos', 'Motos eléctricas', 'Motocicletas', 'Venta de motos', 'Vehículos', 'Automotriz y repuestos', 'Taller mecánico', 'Servicio automotriz', 'Mecánica', 'Motos y repuestos', 'Concesionario'],
  },
  hoodie: {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: false,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-square',
    label: 'Hoodie',
    description: 'Tienda editorial de ropa urbana / streetwear (estilo magazine): hero con logotipo gigante + slider de 3 slides (solo-imagen o con textos y botón, cada uno enlazable) y sidebar editorial (nueva colección, garantías, oferta destacada, testimonio, newsletter), banda de colecciones, más vendidos con rating, marquee y footer premium. Estética beige/greige cálida con negro carbón y tipografía display grotesca de alto peso (Archivo); color de acento personalizable. Favoritos + carrito con modales propios. Todo editable en vivo.',
    accentColor: '#15120E',
    icon: 'solar:hanger-2-bold',
    rubrosPermitidos: ['Ropa', 'Moda', 'Moda, Ropa Y Calzado', 'Moda Urbana', 'Streetwear', 'Ropa urbana', 'Textil y confección', 'Textil y confecciones', 'Boutique', 'Calzado', 'Accesorios de moda'],
  },
  tones: {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: false,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: false,
    imageAspect: 'aspect-[4/3]',
    label: 'Tones',
    description: 'Tienda editorial cálida para ropa infantil y de bebé (estilo "tones"): hero con tarjeta translúcida + slider de 3 slides (solo-imagen o con textos y botón, cada uno enlazable), "nuestros favoritos", dos tarjetas split (niñas/niños), tiles por categoría, bloque destacado + productos, banner ancho y footer marrón con newsletter. Catálogo limpio de 3 columnas con título grande y chips por categoría. Estética crema/greige con marrón cacao, tarjetas redondeadas, títulos en minúsculas amables (Quicksand) y etiquetas en mayúsculas (Plus Jakarta Sans); color de acento personalizable. Favoritos + carrito con modales propios. Todo editable en vivo.',
    accentColor: '#463A31',
    icon: 'solar:t-shirt-bold',
    rubrosPermitidos: ['Ropa infantil', 'Ropa de bebé', 'Ropa de bebe', 'Moda infantil', 'Ropa para niños', 'Ropa para ninos', 'Ropa bebé', 'Bebés', 'Bebes', 'Ropa infantil y bebé'],
  },
  'moda-minimal': {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: false,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-[3/4]',
    label: 'Norda',
    description: 'Tienda minimalista de ropa y calzado (estética estilo Everlane): monocroma blanco/negro, tipografía sans limpia, mucho espacio en blanco y enlaces subrayados. Hero slider de 3 slides a pantalla completa (solo-imagen o con textos y botón, cada uno enlazable), tiles por categoría, grillas de producto sobrias con hover de segunda imagen, banner editorial, sección de valores, "los favoritos" y newsletter. Color de acento personalizable; todo editable en vivo.',
    accentColor: '#171614',
    icon: 'solar:hanger-2-bold',
    rubrosPermitidos: ['Moda', 'Ropa', 'Calzado', 'Moda, Ropa Y Calzado', 'Textil y confección', 'Textil y confecciones', 'Boutique', 'Moda Urbana'],
  },
  'comida-app': {
    cardComponent: 'ProductCardPio',
    gridCols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: true,
    showSidebar: false,
    imageAspect: 'aspect-[4/3]',
    label: 'Comida (App)',
    description: 'Experiencia tipo app de delivery para cualquier comida (pollería, cevichería, anticuchos, pizzería, hamburguesería, etc.): responsive real — app mobile-first en celular y layout web con navbar y buscador en escritorio. Fondo crema con acentos rojo/naranja, hero slider de 3 slides, círculos de categoría, combos con badges/rating/precio, banner de ofertas y barra inferior de pestañas. Detalle con acción fija/inline y carrito bottom-sheet. Color de acento personalizable; todo editable en vivo.',
    accentColor: '#E8542A',
    icon: 'mdi:silverware-fork-knife',
    rubrosPermitidos: ['Restaurante y alimentos', 'Restaurantes y comida', 'Comida rápida', 'Pollería', 'Polleria', 'Pizzería', 'Pizzeria', 'Hamburguesería', 'Cafetería', 'Cafeteria', 'Panadería y Pastelería', 'Heladería', 'Heladeria', 'Fast food', 'Delivery'],
  },
};

export const DEFAULT_TEMPLATE: PlantillaId = 'moderna';

export function resolveTemplateId(plantillaId?: string | null): PlantillaId {
  const raw = String(plantillaId || DEFAULT_TEMPLATE)
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .find(Boolean) || DEFAULT_TEMPLATE;
  return Object.prototype.hasOwnProperty.call(TEMPLATES, raw) ? raw as PlantillaId : DEFAULT_TEMPLATE;
}

export function resolveTemplate(plantillaId?: string | null): TemplateConfig {
  const key = resolveTemplateId(plantillaId);
  return TEMPLATES[key] ?? TEMPLATES[DEFAULT_TEMPLATE];
}

export function resolveCardComponent(plantillaId?: string | null): string {
  return resolveTemplate(plantillaId).cardComponent;
}

export const ALL_PLANTILLAS = Object.entries(TEMPLATES).map(([id, cfg]) => ({
  id: id as PlantillaId,
  ...cfg,
}));

export const PREMIUM_TEMPLATE_PURCHASE_KEYS = [
  'plantillasPremiumCompradas',
  'premiumTemplatesPurchased',
  'templatesComprados',
  'plantillaPremiumComprada',
  'templatePremiumPurchased',
  'templateComprado',
] as const;

export function getPurchasedPremiumTemplates(diseno?: Record<string, any> | null): string[] {
  if (!diseno || typeof diseno !== 'object') return [];

  const values = PREMIUM_TEMPLATE_PURCHASE_KEYS.flatMap((key) => {
    const raw = diseno[key];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') return raw.split(',');
    return [];
  });
  const detailKeys = diseno.plantillasPremiumComprasDetalle && typeof diseno.plantillasPremiumComprasDetalle === 'object' && !Array.isArray(diseno.plantillasPremiumComprasDetalle)
    ? Object.keys(diseno.plantillasPremiumComprasDetalle)
    : [];

  return Array.from(new Set([...values, ...detailKeys].map((value) => String(value).trim()).filter(Boolean)));
}

export function isTemplatePurchased(plantillaId: string, diseno?: Record<string, any> | null): boolean {
  return getPurchasedPremiumTemplates(diseno).includes(plantillaId);
}

export function isTemplatePremiumLocked(
  template: Pick<TemplateConfig, 'premium'> & { id: string },
  diseno?: Record<string, any> | null,
): boolean {
  return Boolean(template.premium && !isTemplatePurchased(template.id, diseno));
}

export function isSliderTemplate(plantillaId?: string | null): boolean {
  return resolveTemplate(plantillaId).bannerIsSlider;
}

export function getBannerSlots(plantillaId?: string | null): BannerSlotDef[] {
  return resolveTemplate(plantillaId).bannerSlots;
}

export const SLIDER_MAX_COUNT = 3;
