
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
  | 'abarrotes'
  | 'supermercado'
  | 'ropa-hombre'
  | 'bicicletas'
  | 'motos'
  | 'hoodie'
  | 'tones'
  | 'moda-minimal'
  | 'comida-app'
  | 'farmacia'
  | 'zapatos'
  | 'muebleria'
  | 'mascotas'
  | 'moda-elegante'
  | 'maquillaje'
  | 'bolsos'
  | 'retail'
  | 'canasta'
  | 'floreria'
  | 'maison'
  | 'mostrador'
  | 'hogar'
  | 'kartera'
  | 'olmo'
  | 'amora'
  | 'esencial'
  | 'celulares'
  | 'carteras-market';

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
  abarrotes: {
    cardComponent: 'ProductCardGromuse',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    showDiscount: true,
    showStock: true,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-square',
    label: 'Grogin',
    description: 'Supermercado de abarrotes estilo Grocery (Grogin): hero slider de 3 slides (solo-imagen o con textos/precio y botón, cada uno enlazable), círculos de categorías, selección destacada con rating y "Agregar al carrito", banners promocionales + fila de productos, banda de salud/seguridad, más vendidos y tarjetas promocionales inferiores. Buscador ancho, favoritos y carrito lateral. Estética luminosa verde fresco + navy con acento morado en el hero y amarillo en el rating, tipografía Quicksand; color de acento personalizable. Todo editable en vivo.',
    accentColor: '#3BB77E',
    icon: 'solar:cart-large-2-bold',
    rubrosPermitidos: ['Abarrotes', 'Minimarket', 'Mini market', 'Bodega', 'Supermercado', 'Supermercados', 'Market', 'Tienda de abarrotes', 'Comestibles', 'Alimentos', 'Alimentos y bebidas', 'Retail y comercio', 'Comercio minorista'],
  },
  supermercado: {
    cardComponent: 'ProductCardGromuse',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    showDiscount: true,
    showStock: true,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-square',
    label: 'FreshMart',
    description: 'Supermercado grocery verde & blanco (estilo FreshMart): barra utilitaria superior, buscador con categorías, hero slider de 3 slides (solo-imagen o con textos, badge y botón, cada uno enlazable) + badge circular de descuento y tira de garantías, "Compra por categoría", banner "Súper ahorro" + tarjeta de entrega rápida, "Ofertas del día" con tarjetas "Agregar al carrito", "¿Por qué elegirnos?", testimonios + contador de clientes + newsletter, y footer verde oscuro con métodos de pago. Tipografía Poppins; color de acento personalizable. Todo editable en vivo.',
    accentColor: '#4CA82F',
    icon: 'solar:bag-4-bold',
    rubrosPermitidos: ['Abarrotes', 'Minimarket', 'Mini market', 'Bodega', 'Supermercado', 'Supermercados', 'Market', 'Tienda de abarrotes', 'Comestibles', 'Alimentos', 'Alimentos y bebidas', 'Retail y comercio', 'Comercio minorista'],
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
  farmacia: {
    cardComponent: 'ProductCardPio',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    showDiscount: true,
    showStock: true,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: true,
    showSidebar: true,
    imageAspect: 'aspect-square',
    label: 'Farmacia (MediCare)',
    description: 'Farmacia / botica / medicamentos estilo e-commerce médico premium (Dcare): verde médico + acento salud, topbar + buscador central con categorías, barra de servicios (consulta, laboratorio, farmacia local), hero + banners promocionales, ofertas relámpago con contador, compra por categoría, combos populares, columnas Nuevos/Tendencia/Oferta, marcas destacadas, recomendados y newsletter. Tarjetas con rating, % de descuento, barra de disponibilidad y selector de cantidad; favoritos, comparador y zoom. Detalle con galería, cantidad y relacionados. Color principal y de acento personalizables; todo editable en vivo.',
    accentColor: '#16A34A',
    icon: 'solar:health-bold',
    rubrosPermitidos: ['Farmacia', 'Botica', 'Farmacia Veterinaria', 'Salud y bienestar'],
  },
  zapatos: {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-square',
    label: 'Zapatos (Stride)',
    description: 'Zapatería / zapatillas / calzado premium estilo sneaker store: fondo beige cálido con CTA oliva y titulares en grotesca ancha. Hero slider de 3 slides (solo-imagen o con textos y botón, cada uno enlazable) con beneficios reales en vidrio, buscador + chips de categorías con íconos, destacados en carrusel, 4 bloques grandes de categoría, ofertas con contador real, guía "Encuentra tu par ideal", recién llegados, comunidad por WhatsApp y barra de confianza. Tarjetas con rango real de tallas, colores, rating real o "Nuevo", cantidad, favoritos, comparador y zoom. Ficha con selector de talla/color real, galería por color y barra de compra fija. Colores personalizables; todo editable en vivo.',
    accentColor: '#4B5237',
    icon: 'mdi:shoe-sneaker',
    rubrosPermitidos: ['Calzado', 'Zapatería', 'Zapateria', 'Zapatillas', 'Moda, ropa y calzado', 'Moda, Ropa Y Calzado', 'Moda', 'Deportes y recreación'],
  },
  muebleria: {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-[4/3]',
    label: 'Mueblería (Nórdica)',
    description: 'Mueblería / decoración / hogar de estilo escandinavo cálido: fondo lino, botones nogal y acento verde bosque, titulares en peso medio y notas manuscritas. Hero slider de 3 slides con estadísticas reales, barra de beneficios reales, círculos por ambiente con fotos reales, dos banners de colección, favoritos, ofertas con contador real, bloque de historia con panel de valores, inspiración, testimonios con reseñas reales aprobadas, galería (enlace a Instagram si existe) y comunidad por WhatsApp. Ficha con variantes reales, galería por color, zoom y barra de compra fija. Colores personalizables; todo editable en vivo.',
    accentColor: '#7A5A40',
    icon: 'solar:sofa-2-bold',
    rubrosPermitidos: ['Mueblería', 'Muebleria', 'Muebles', 'Decoración', 'Decoracion', 'Artesanía y decoración', 'Hogar', 'Carpintería', 'Carpinteria', 'Colchones'],
  },
  mascotas: {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: true,
    showSidebar: true,
    imageAspect: 'aspect-[4/3]',
    label: 'Mascotas (Patitas)',
    description: 'Veterinaria / pet shop cálido y juguetón: fondo crema, verde salvia y naranja, tipografía Nunito redondeada. Hero slider de 3 slides con palabra destacada y beneficios reales, tarjeta de categorías con círculos de color, recomendados en carrusel, combos reales con ahorro calculado del precio real, guías de cuidado editables, testimonios con reseñas reales aprobadas y footer verde con comunidad por WhatsApp. Ficha con variantes reales (talla, sabor, peso), zoom y barra de compra fija. Colores personalizables; todo editable en vivo.',
    accentColor: '#5E7E4F',
    icon: 'ph:paw-print-fill',
    rubrosPermitidos: ['Veterinaria', 'Farmacia Veterinaria', 'Pet shop', 'Petshop', 'Mascotas', 'Clínica veterinaria', 'Agroveterinaria'],
  },
  'moda-elegante': {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-[3/4]',
    label: 'Élan',
    description: 'Moda femenina, ropa y calzado con estética de lujo minimal editorial: blanco, negro y arena, títulos serif (Playfair Display) y etiquetas en mayúsculas. Barra de anuncios rotativa, menú lateral, buscador de ancho completo, hero slider de 3 slides, círculos de categoría con "Novedades", colecciones editoriales, selección destacada en 6 columnas con segunda foto al pasar el mouse, banda de ofertas con el descuento real (y reloj solo si la oferta tiene fecha de fin), beneficios reales, inspiración de estilo enlazada a tu Instagram y newsletter por WhatsApp. Ficha con tallas/colores reales y zoom. Colores personalizables; todo editable en vivo.',
    accentColor: '#161412',
    icon: 'solar:hanger-2-bold',
    rubrosPermitidos: ['Moda', 'Ropa', 'Calzado', 'Moda, Ropa Y Calzado', 'Moda femenina', 'Ropa de mujer', 'Boutique', 'Textil y confección', 'Textil y confecciones', 'Zapatería', 'Zapateria', 'Accesorios de moda'],
  },
  maquillaje: {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: false,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-[3/4]',
    label: 'Maquillaje (Blush)',
    description: 'Maquillaje / cosméticos / skincare de lujo sereno: rosa empolvado + botones tinta, títulos en mayúsculas espaciadas (Jost) y logotipo en serif (Playfair). Barra de anuncio con tus formas de entrega reales, hero slider de 3 slides con foto y texto sobre degradado rosado (solo-imagen o con textos, cada uno enlazable), barra de beneficios reales, destacados en carrusel de 5, dos banners de colección, ofertas con contador real, categorías populares, comunidad de Instagram (solo si existe) y club por WhatsApp. Tarjetas con tonos reales, cantidad, favoritos, comparador y zoom. Ficha con selector de tono/tamaño real, galería por color y barra de compra fija. Colores personalizables; todo editable en vivo.',
    accentColor: '#C98B86',
    icon: 'mdi:lipstick',
    rubrosPermitidos: ['Maquillaje', 'Cosméticos', 'Cosmeticos', 'Cosmética', 'Cosmetica', 'Belleza', 'Belleza y cuidado personal', 'Skincare', 'Perfumería', 'Perfumeria', 'Bazar, Perfumería y accesorios', 'Salon & Spa', 'Salón & Spa', 'Salón de belleza'],
  },
  bolsos: {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-square',
    label: 'Carteras (Rosé)',
    description: 'Tienda de carteras, bolsos y accesorios con estética de boutique: rosa y vino sobre blanco cálido, títulos serif en mayúsculas y un toque caligráfico. Barra de beneficios reales, hero slider de 3 slides con sello del descuento REAL máximo, fila de valores de marca, compra por categoría en círculos, productos destacados en 6 columnas, 3 banners promocionales, ofertas con reloj solo si la oferta tiene fecha de fin, beneficios, galería enlazada a tu Instagram, comunidad por WhatsApp y footer con tus medios de pago reales. Ficha con colores/medidas reales, zoom y barra de compra fija. Colores personalizables; todo editable en vivo.',
    accentColor: '#6B1D38',
    icon: 'ph:handbag-fill',
    rubrosPermitidos: ['Carteras', 'Bolsos', 'Carteras y bolsos', 'Carteras y accesorios', 'Accesorios', 'Accesorios de moda', 'Marroquinería', 'Marroquineria', 'Mochilas', 'Maletas', 'Moda', 'Moda, ropa y calzado', 'Moda, Ropa Y Calzado', 'Boutique'],
  },
  canasta: {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    showDiscount: true,
    showStock: true,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-[4/3]',
    label: 'Abarrotes (Canasta)',
    description: 'Supermercado online fresco y verde para bodegas, minimarkets y abarrotes: barra superior verde con envío gratis real, header con buscador de resultados en vivo, ubicación y carrito con total, barra de categorías con "Ofertas", hero slider de 3 slides con sello circular y beneficios reales, círculos de categoría, banner de temporada con sello "Hasta X%" calculado de tus ofertas, "Ofertas del día" con reloj solo si la oferta tiene fecha de fin, dos banners de categoría, recomendados + "Mejor valorados" con reseñas reales, beneficios, testimonios reales, comunidad por WhatsApp y footer verde oscuro con tus medios de pago. Tarjetas con unidad de venta, cantidad, favoritos y comparador. Colores personalizables; todo editable en vivo.',
    accentColor: '#1F7A3A',
    icon: 'solar:cart-large-2-bold',
    rubrosPermitidos: ['Bodega y Abarrotes', 'Supermarket', 'Minimarket', 'Abarrotes', 'Mini market', 'Bodega', 'Supermercado', 'Supermercados', 'Market', 'Tienda de abarrotes', 'Comestibles', 'Alimentos', 'Alimentos y bebidas', 'Frutas y verduras', 'Productos naturales y suplementos', 'Carnicería y Embutidos', 'Comercio minorista'],
  },
  retail: {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    showDiscount: true,
    showStock: true,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-square',
    label: 'Retail (Vitrina)',
    description: 'Tienda multi-categoría para comercio minorista, bazar y tiendas por departamento, cálida y moderna: fondo crema, teal + naranja y titular serif con subrayado a mano. Header con buscador central y menú de categorías, hero slider de 3 slides con foto de estilo de vida (solo-imagen o con textos, cada uno enlazable), franja de categorías superpuesta con fotos reales, barra de beneficios reales, recomendados en carrusel, tres banners de campaña, ofertas con contador real, "Descubre más", banda de confianza con reseñas y cifras reales, club por WhatsApp y footer con tus medios de pago reales. Tarjetas con rating real, cantidad, favoritos, comparador y zoom. Ficha con variantes reales, zoom y barra de compra fija. Colores personalizables; todo editable en vivo.',
    accentColor: '#1F5E5B',
    icon: 'solar:shop-2-bold',
    rubrosPermitidos: ['Comercio minorista', 'Comercio', 'Retail', 'Bazar', 'Bazar, Perfumería y accesorios', 'Tienda por departamentos', 'Tienda', 'Variedades', 'Regalos', 'Importaciones', 'Minorista', 'Mayorista', 'Distribuidora', 'Librería y Papelería', 'Artesanía y decoración'],
  },  floreria: {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-[3/4]',
    label: 'Florería (Pétala)',
    description: 'Florería de lujo para ramos de rosas y arreglos florales: marfil, rubor y botones dorados, titulares en serif fina (Cormorant) y pétalos que caen en el hero. Hero slider de 3 slides con titular en dos tonos y botón de video opcional, barra de beneficios reales en vidrio, catálogo de ocasiones con conteo real, ramos populares, "Arma tu ramo" con tus productos reales (flores, envoltura, extras…) y total en vivo, por qué elegirnos, opiniones reales, suscripción por WhatsApp y banda final con foto. Tarjetas con cantidad, favoritos, comparador y zoom; ficha con variantes, video y barra fija. Colores personalizables; todo editable en vivo.',
    accentColor: '#9A7044',
    icon: 'ph:flower-tulip-fill',
    rubrosPermitidos: ['Florería', 'Floreria', 'Flores', 'Arreglos florales', 'Ramos', 'Regalos', 'Detalles', 'Artesanía y decoración', 'Eventos', 'Decoración de eventos', 'Comercio minorista'],
  },  maison: {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-square',
    label: 'Carteras (Maison)',
    description: 'Boutique cálida para carteras, bolsos y accesorios: crema, cuero coñac y oliva profundo, titulares en serif clásica (Libre Caslon). Barra superior con tu envío gratis real, menú con desplegable de categorías, hero partido con palabra destacada en cursiva y sello circular "Nueva colección", franja de beneficios reales, compra por categoría con ícono y conteo real, destacados en 6 columnas, dos banners (el oscuro muestra tu descuento real máximo y el reloj solo si la oferta tiene fecha de fin), testimonios reales en carrusel y pie oliva con novedades por WhatsApp y tus medios de pago. Tarjetas con cantidad, favoritos, comparador y zoom; ficha con variantes por color. Colores personalizables; todo editable en vivo.',
    accentColor: '#8A4B2C',
    icon: 'ph:handbag-simple-fill',
    rubrosPermitidos: ['Cartera y accesorios', 'Carteras', 'Bolsos', 'Carteras y bolsos', 'Carteras y accesorios', 'Accesorios', 'Accesorios de moda', 'Marroquinería', 'Marroquineria', 'Mochilas', 'Maletas', 'Moda', 'Moda, ropa y calzado', 'Moda, Ropa Y Calzado', 'Boutique', 'Bazar, Perfumería y accesorios'],
  },
  mostrador: {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: true,
    showCategoryCircles: false,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-square',
    label: 'Mostrador (catálogo de una página)',
    description: 'Tienda de UNA sola página para el negocio que no quiere portada: el cliente entra directo al catálogo. Cabecera con el degradado de tu marca, categorías con su número real de productos, buscador por nombre o código, orden por precio o nombre, carga infinita y tarjetas con código, precio y botón "+" que se vuelve selector de cantidad del carrito. El producto se abre en una vista rápida (fotos, variantes, cantidad, descripción, video) y todo termina en el carrito y el checkout. Panel de información con tus datos reales (entrega, horario, dirección, medios de pago, WhatsApp). Colores personalizables.',
    accentColor: '#F0782E',
    icon: 'solar:widget-4-bold',
  },


  hogar: {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: false,
    imageAspect: 'aspect-[3/4]',
    label: 'Hogar (Calma)',
    description: 'Mueblería, decoración y objetos para el hogar con estética escandinava en mosaico (bento): gris cálido, tarjetas hueso redondeadas, pasteles suaves y titulares grandes en Bricolage Grotesque. Header flotante en píldora, hero en mosaico con tu producto estrella (sello giratorio, precio y "Agregar"), categoría destacada y entrega con tus datos reales, cinta de palabras grandes, "Encuentra tu rincón" con tus categorías en mosaico, selección de la casa con filtros por categoría, bloque "Nuestra forma" con texto que se enciende al bajar y cifras reales, promesas con tus beneficios reales, reseñas reales, carta por WhatsApp y footer oscuro con tu nombre a todo el ancho. Ficha con variantes, zoom y barra de compra fija. Colores personalizables; todo editable en vivo.',
    accentColor: '#1C1A17',
    icon: 'ph:armchair-fill',
    rubrosPermitidos: ['Mueblería', 'Muebleria', 'Muebles', 'Decoración', 'Decoracion', 'Artesanía y decoración', 'Hogar', 'Hogar y decoración', 'Carpintería', 'Carpinteria', 'Colchones', 'Iluminación', 'Textiles para el hogar'],
  },
  kartera: {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: true,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: false,
    imageAspect: 'aspect-square',
    label: 'Kartera (Ofertas)',
    description: 'Carteras, bolsos y accesorios con el estilo enérgico de una tienda de ofertas: violeta + lima sobre crema, Rubik extra bold. Header oscuro de dos niveles con buscador ancho y mega-menú de categorías, hero con titular resaltado y tus productos reales flotando con su descuento real, categorías en mosaico, "Ofertas del día" con contador hasta la fecha fin real, banner "Arma tu look" y club por WhatsApp, más populares, últimas unidades con el stock real, beneficios de compra en forma de cupón, avisos de ofertas por WhatsApp, bloque "Compra rápida" con pasos, medios de pago reales y un mini pedido que se compra de verdad, y reseñas reales. Ficha con variantes, zoom y barra fija. Colores personalizables; todo editable en vivo.',
    accentColor: '#5B2EE6',
    icon: 'ph:handbag-simple-fill',
    rubrosPermitidos: ['Cartera y accesorios', 'Carteras', 'Carteras y accesorios', 'Bolsos', 'Marroquinería', 'Marroquineria', 'Accesorios', 'Bazar, Perfumería y accesorios', 'Moda, ropa y calzado', 'Moda', 'Ropa'],
  },
  olmo: {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: true,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: false,
    imageAspect: 'aspect-[3/4]',
    label: 'Olmo (Editorial)',
    description: 'Carteras, mochilas y accesorios con estética editorial cálida: verde botella, crema y arena, Playfair Display con remate en cursiva. Barra de avisos con tus beneficios reales, hero con foto en arco sobre un gran círculo y una tarjeta flotante que rota tus productos reales, "Compra por categoría" en círculos con el conteo real de piezas, banner de ofertas con sello del descuento real máximo y contador hasta la fecha fin real, rieles "En oferta" y "Favoritas de la casa", círculo de clientas por WhatsApp, franja de valores y reseñas reales. Ficha con variantes, zoom y "Comprar ahora". Colores personalizables; todo editable en vivo.',
    accentColor: '#24392F',
    icon: 'ph:handbag-simple-fill',
    rubrosPermitidos: ['Cartera y accesorios', 'Carteras', 'Carteras y accesorios', 'Bolsos', 'Marroquinería', 'Marroquineria', 'Accesorios', 'Bazar, Perfumería y accesorios', 'Moda, ropa y calzado', 'Moda', 'Ropa'],
  },
  amora: {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: true,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: false,
    imageAspect: 'aspect-square',
    label: 'Amora (Fresca)',
    description: 'Carteras, bolsos y accesorios con el estilo fresco y amable de una tienda moderna: blanco limpio, verde y coral, pasteles suaves, Poppins y un toque manuscrito. Header claro con buscador ancho, accesos con etiqueta (Mi pedido, Favoritos, Contacto) y fila "Comprar por categoría" con tus categorías reales; hero con palabra manuscrita, foto grande y tarjetas de tus beneficios reales; colecciones con su número real de productos, "Elegidos para ti" con tus destacados, franja de funciones que sí hacen algo, ofertas reales con reloj hasta la fecha fin real, "Comprar es así de fácil", banners de colección y comunidad por WhatsApp, inspiración por categoría, reseñas reales y footer menta con medios de pago reales. Ficha con variantes, zoom y barra fija. Colores personalizables; todo editable en vivo.',
    accentColor: '#2E7D32',
    icon: 'ph:handbag-simple-fill',
    rubrosPermitidos: ['Cartera y accesorios', 'Carteras', 'Carteras y accesorios', 'Bolsos', 'Marroquinería', 'Marroquineria', 'Accesorios', 'Bazar, Perfumería y accesorios', 'Moda, ropa y calzado', 'Moda', 'Ropa'],
  },

  esencial: {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: false,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: true,
    imageAspect: 'aspect-[3/4]',
    label: 'Esencial (Esencia)',
    description: 'Moda y ropa con estética minimal cálida: fondo marfil, botones salvia y titulares serif (Gilda Display). Barra de anuncio con tus formas de entrega reales, header con menú lateral y logo centrado, hero slider de 3 slides a todo el ancho, compra por categoría en 6 bloques con tus fotos reales, looks curados editables, nuestra selección con tus destacados primero, favoritos con valoraciones reales (o básicos si aún no hay reseñas), promo de temporada que solo muestra el % si tienes ofertas reales, beneficios reales y footer con novedades por WhatsApp y tus medios de pago. Ficha con tallas y colores reales, zoom y barra de compra fija. Colores personalizables; todo editable en vivo.',
    accentColor: '#8A9884',
    icon: 'ph:coat-hanger-fill',
    rubrosPermitidos: ['Moda', 'Ropa', 'Moda, ropa y calzado', 'Moda, Ropa Y Calzado', 'Boutique', 'Moda femenina', 'Ropa de mujer', 'Ropa de hombre', 'Textil y confección', 'Textil y confecciones', 'Accesorios de moda'],
  },

  celulares: {
    cardComponent: 'ProductCardGlamora',
    gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    showDiscount: true,
    showStock: true,
    showCategoryCircles: true,
    bannerIsSlider: false,
    bannerSlots: [],
    showCombos: false,
    showSidebar: false,
    imageAspect: 'aspect-square',
    label: 'Celulares (Nexo)',
    description: 'Tienda de celulares, accesorios y tecnología: azul eléctrico, banner navy redondeado y botones píldora (Manrope + DM Sans). Barra superior con tus beneficios reales, header con buscador grande y fila de categorías con botón de ofertas (solo si tienes ofertas), hero slider de 3 slides con firma manuscrita, categorías en bloques, celulares destacados en tarjetas horizontales con la capacidad real de cada equipo, comparador real, "¿Por qué tu tienda?" con tus beneficios reales, accesorios de la categoría que elijas, ofertas con reloj solo si hay fecha de fin, dos promos editables, beneficios, novedades por WhatsApp y footer navy con tus medios de pago. Ficha con variantes, zoom y barra fija. Colores personalizables; todo editable en vivo.',
    accentColor: '#1F6BF0',
    icon: 'solar:smartphone-2-bold',
    rubrosPermitidos: ['Celulares', 'Telefonía', 'Telefonia', 'Tecnología', 'Tecnologia', 'Electrónica', 'Electronica', 'Accesorios de celulares', 'Accesorios', 'Gadgets', 'Ventas de accesorios y repuestos de cómputo', 'Cómputo', 'Computo'],
  },

  'carteras-market': {
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
    label: 'Carteras (Verena)',
    description: 'Carteras y accesorios con estructura de marketplace premium: barra superior con tus beneficios reales, header con menú de categorías y buscador, hero en tarjeta crema con titular en serif, 3 diapositivas editables y tarjeta flotante con tus reseñas reales (o tus productos), "Compra por categoría" con fotos de tus categorías o productos, productos destacados en grilla de 6, ofertas con reloj solo si hay fecha de fin real, franja de beneficios con tarjeta de ayuda por WhatsApp, comunidad por WhatsApp y footer con tus medios de pago reales. Ficha con colores y opciones reales, zoom y barra de compra fija. Verde bosque, terracota y marfil personalizables; todo editable en vivo.',
    accentColor: '#1F3B2D',
    icon: 'solar:bag-4-bold',
    rubrosPermitidos: ['Carteras', 'Cartera y accesorios', 'Carteras y accesorios', 'Carteras y bolsos', 'Bolsos', 'Marroquinería', 'Marroquineria', 'Accesorios', 'Accesorios de moda', 'Mochilas', 'Maletas', 'Moda', 'Moda, Ropa Y Calzado', 'Boutique', 'Comercio minorista', 'Retail'],
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
