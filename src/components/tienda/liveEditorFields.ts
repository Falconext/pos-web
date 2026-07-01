/**
 * Configuración declarativa de los campos editables por plantilla.
 * Usado por el Live Editor (StoreLiveEditorDrawer) para renderizar los
 * formularios dinámicos sobre la tienda pública en "modo WordPress".
 */

export interface ImageFieldDef {
  key: string;
  label: string;
  hint: string;
  fallback: string;
}

export interface TextFieldDef {
  key: string;
  label: string;
  placeholder: string;
  /** Agrupador visual dentro del panel */
  group?: string;
  /** 'categorySelect' = desplegable con las categorías reales de la tienda */
  type?: 'text' | 'categorySelect';
}

export interface ProductFieldDef {
  key: string;
  label: string;
}

export type LinkFieldTarget = 'catalog' | 'category' | 'search' | 'product' | 'url' | 'none';

export interface LinkFieldDef {
  key: string;
  label: string;
  group?: string;
  defaultType?: LinkFieldTarget;
}

// ─────────────────────────────────────────────────────────────────────────────
// IMÁGENES
// ─────────────────────────────────────────────────────────────────────────────
export const AUTOPARTES_IMAGE_FIELDS: ImageFieldDef[] = [
  { key: 'autopartesHeroImageUrl', label: 'Hero principal', hint: 'Banner grande superior', fallback: '/assets/templates/autopartes/banner1.png' },
  { key: 'autopartesSideTopImageUrl', label: 'Hero lateral superior', hint: 'Tarjeta derecha superior', fallback: '/assets/templates/autopartes/banner2.png' },
  { key: 'autopartesSideBottomImageUrl', label: 'Hero lateral inferior', hint: 'Tarjeta derecha inferior', fallback: '/assets/templates/autopartes/banner3.png' },
  { key: 'autopartesVehicleImageUrl', label: 'Selector de vehículo', hint: 'Fondo de búsqueda por auto', fallback: '/assets/templates/autopartes/banner4.png' },
  { key: 'autopartesPromoLeftImageUrl', label: 'Promo izquierda', hint: 'Campaña llantas/ruedas', fallback: '/assets/templates/autopartes/llantas.png' },
  { key: 'autopartesPromoRightImageUrl', label: 'Promo derecha', hint: 'Campaña luces/faros', fallback: '/assets/templates/autopartes/luces.png' },
  { key: 'autopartesCommunityImageUrl', label: 'Comunidad', hint: 'Bloque comunidad automotriz', fallback: '/assets/templates/autopartes/comunidad.png' },
  { key: 'autopartesSupportImageUrl', label: 'Asistencia', hint: 'Bloque soporte/asistencia', fallback: '/assets/templates/autopartes/asistencia.png' },
  { key: 'autopartesBrandsImageUrl', label: 'Marcas', hint: 'Banner lateral de marcas', fallback: '/assets/templates/autopartes/marcas.png' },
  { key: 'autopartesProductImageUrl', label: 'Producto destacado', hint: 'Imagen base para ofertas/top selling', fallback: '/assets/templates/autopartes/producto.png' },
  { key: 'autopartesCategoryImageUrl', label: 'Categorías destacadas', hint: 'Imagen circular de categorías', fallback: '/assets/templates/autopartes/producto.png' },
  { key: 'autopartesWidgetOneImageUrl', label: 'Widget 1', hint: 'Tarjeta inferior izquierda', fallback: '/assets/templates/autopartes/widget1.png' },
  { key: 'autopartesWidgetTwoImageUrl', label: 'Widget 2', hint: 'Tarjeta inferior centro', fallback: '/assets/templates/autopartes/widget2.png' },
  { key: 'autopartesWidgetThreeImageUrl', label: 'Widget 3', hint: 'Tarjeta inferior derecha', fallback: '/assets/templates/autopartes/widget3.png' },
];

export const MODA_IMAGE_FIELDS: ImageFieldDef[] = [
  { key: 'modaHeroImg', label: 'Banner del hero (escritorio)', hint: 'Se muestra en pantallas grandes', fallback: '/assets/templates/moda/banner.webp' },
  { key: 'modaHeroImgMobile', label: 'Banner del hero (móvil)', hint: 'Se muestra en celulares', fallback: '/assets/templates/moda/bannermobile.webp' },
  { key: 'modaPromoImg', label: 'Banner Promocional', hint: 'Fondo del bloque promo', fallback: '/assets/templates/moda/promo.png' },
  { key: 'modaTrend1Image', label: 'Tendencia 1', hint: 'Imagen de tendencia', fallback: '' },
  { key: 'modaTrend2Image', label: 'Tendencia 2', hint: 'Imagen de tendencia', fallback: '' },
  { key: 'modaTrend3Image', label: 'Tendencia 3', hint: 'Imagen de tendencia', fallback: '' },
  { key: 'modaTrend4Image', label: 'Tendencia 4', hint: 'Imagen de tendencia', fallback: '' },
  { key: 'modaStyle1Image', label: 'Estilo 1', hint: 'Imagen de estilo', fallback: '' },
  { key: 'modaStyle2Image', label: 'Estilo 2', hint: 'Imagen de estilo', fallback: '' },
  { key: 'modaStyle3Image', label: 'Estilo 3', hint: 'Imagen de estilo', fallback: '' },
  { key: 'modaStyle4Image', label: 'Estilo 4', hint: 'Imagen de estilo', fallback: '' },
  { key: 'modaStyle5Image', label: 'Estilo 5', hint: 'Imagen de estilo', fallback: '' },
  { key: 'modaCollection1Image', label: 'Colección 1', hint: 'Imagen de colección', fallback: '' },
  { key: 'modaCollection2Image', label: 'Colección 2', hint: 'Imagen de colección', fallback: '' },
  { key: 'modaCollection3Image', label: 'Colección 3', hint: 'Imagen de colección', fallback: '' },
  { key: 'modaCollection4Image', label: 'Colección 4', hint: 'Imagen de colección', fallback: '' },
];

export const MAYE_IMAGE_FIELDS: ImageFieldDef[] = [
  { key: 'mayeHeroImageUrl', label: 'Hero principal', hint: 'Banner grande superior', fallback: '/assets/templates/maye/laptoppc.png' },
  { key: 'mayeSideTopImageUrl', label: 'Hero lateral superior', hint: 'Tarjeta superior derecha', fallback: '/assets/templates/maye/colecciones.png' },
  { key: 'mayeSideBottomImageUrl', label: 'Hero lateral inferior', hint: 'Tarjeta inferior derecha', fallback: '/assets/templates/maye/tarjetas.png' },
  { key: 'mayeVehicleImageUrl', label: 'Buscador tech', hint: 'Fondo del bloque de búsqueda', fallback: '/assets/templates/maye/filtradocategorias.png' },
  { key: 'mayePromoLeftImageUrl', label: 'Promo izquierda', hint: 'Banner de componentes', fallback: '/assets/templates/maye/coleccion.png' },
  { key: 'mayePromoRightImageUrl', label: 'Promo derecha', hint: 'Banner de periféricos', fallback: '/assets/templates/maye/rgb.png' },
  { key: 'mayeCommunityImageUrl', label: 'Comunidad', hint: 'Bloque comunidad tech', fallback: '/assets/templates/maye/comunidadtec.png' },
  { key: 'mayeSupportImageUrl', label: 'Soporte', hint: 'Bloque asistencia técnica', fallback: '/assets/templates/maye/24horastec.png' },
  { key: 'mayeBrandsImageUrl', label: 'Marcas', hint: 'Banner lateral de marcas', fallback: '/assets/templates/maye/marcastec.png' },
  { key: 'mayeCategory1ImageUrl', label: 'Categoría 1', hint: 'Imagen circular: Laptops y PCs', fallback: '/assets/templates/maye/catlaptopspc.png' },
  { key: 'mayeCategory2ImageUrl', label: 'Categoría 2', hint: 'Imagen circular: Componentes', fallback: '/assets/templates/maye/componentes.png' },
  { key: 'mayeCategory3ImageUrl', label: 'Categoría 3', hint: 'Imagen circular: Periféricos', fallback: '/assets/templates/maye/perifericos.png' },
  { key: 'mayeWidgetOneImageUrl', label: 'Widget 1', hint: 'Miniatura para top ventas', fallback: '/assets/templates/maye/comprarahora1.png' },
  { key: 'mayeWidgetTwoImageUrl', label: 'Widget 2', hint: 'Miniatura para top ventas', fallback: '/assets/templates/maye/comprarahora2.png' },
  { key: 'mayeWidgetThreeImageUrl', label: 'Widget 3', hint: 'Miniatura para top ventas', fallback: '/assets/templates/maye/comprarahora3.png' },
  { key: 'mayeCatalogBannerUrl', label: 'Banner catálogo', hint: 'Banner superior de la página de catálogo', fallback: '/assets/templates/maye/catalogo.png' },
];

export const TECNOLOGIA_IMAGE_FIELDS: ImageFieldDef[] = [
  { key: 'tecnologiaHeroImageUrl', label: 'Banner principal', hint: 'Imagen grande del inicio (hero)', fallback: '/assets/templates/tecnologia/banner.png' },
];

export const URBANO_IMAGE_FIELDS: ImageFieldDef[] = [
  { key: 'urbanoHeroImg', label: 'Hero Banner', hint: 'Fondo principal', fallback: '/assets/templates/urbano/banner.png' },
  { key: 'urbanoCat1Img', label: 'Categoría 1', hint: 'Primera imagen en split categories', fallback: '/assets/templates/urbano/coleccion5.png' },
  { key: 'urbanoCat2Img', label: 'Categoría 2', hint: 'Segunda imagen', fallback: '/assets/templates/urbano/coleccion6.png' },
  { key: 'urbanoCat3Img', label: 'Categoría 3', hint: 'Tercera imagen', fallback: '/assets/templates/urbano/coleccion7.png' },
  { key: 'urbanoCat4Img', label: 'Categoría 4', hint: 'Cuarta imagen', fallback: '/assets/templates/urbano/coleccion8.png' },
  { key: 'urbanoBottomBannerImg', label: 'Banner Inferior', hint: 'Imagen de fondo', fallback: '/assets/templates/urbano/wear.png' },
  { key: 'urbanoShopTheLookImg', label: 'Compra el look', hint: 'Foto de modelo y outfit', fallback: '/assets/templates/urbano/shoplook.png' },
  { key: 'urbanoFeatureModelImg', label: 'Feature Highlight', hint: 'Foto de contexto', fallback: '/assets/templates/urbano/coleccion9.png' },
  { key: 'urbanoGallery1', label: 'Galería 1', hint: 'Imágenes inferiores 1', fallback: '/assets/templates/urbano/coleccion2.png' },
  { key: 'urbanoGallery2', label: 'Galería 2', hint: 'Imágenes inferiores 2', fallback: '/assets/templates/urbano/coleccion3.png' },
  { key: 'urbanoGallery3', label: 'Galería 3', hint: 'Imágenes inferiores 3', fallback: '/assets/templates/urbano/coleccion4.png' },
  { key: 'urbanoGallery4', label: 'Galería 4', hint: 'Imágenes inferiores 4', fallback: '/assets/templates/urbano/coleccion5.png' },
  { key: 'urbanoGallery5', label: 'Galería 5', hint: 'Imágenes inferiores 5', fallback: '/assets/templates/urbano/coleccion6.png' },
];

// ─────────────────────────────────────────────────────────────────────────────
// TEXTOS
// ─────────────────────────────────────────────────────────────────────────────
const AUTOPARTES_TEXT_FIELDS: TextFieldDef[] = [
  { key: 'heroTitle', label: 'Título del banner', placeholder: 'Repuestos de Alto Rendimiento', group: 'Hero' },
  { key: 'heroSubtitle', label: 'Subtítulo del banner', placeholder: 'Encuentra los mejores repuestos...', group: 'Hero' },
  { key: 'comunidadTitle', label: 'Título de la comunidad', placeholder: 'Sé parte de nuestra comunidad', group: 'Comunidad' },
  { key: 'comunidadText', label: 'Texto descriptivo', placeholder: 'Únete para ofertas exclusivas', group: 'Comunidad' },
  { key: 'widgetOneTitle', label: 'Widget 1: Título', placeholder: 'Llantas y Ruedas', group: 'Widgets promocionales' },
  { key: 'widgetOneSubtitle', label: 'Widget 1: Subtítulo', placeholder: '¡Potencia tu Setup!', group: 'Widgets promocionales' },
  { key: 'widgetTwoTitle', label: 'Widget 2: Título', placeholder: 'ACEITE MOTOR', group: 'Widgets promocionales' },
  { key: 'widgetTwoSubtitle', label: 'Widget 2: Subtítulo', placeholder: '¡Rendimiento Suave!', group: 'Widgets promocionales' },
  { key: 'widgetThreeTitle', label: 'Widget 3: Título', placeholder: 'COMPRA 1 LLEVA 1!', group: 'Widgets promocionales' },
  { key: 'widgetThreeSubtitle', label: 'Widget 3: Subtítulo', placeholder: '¡Aprovecha ahora!', group: 'Widgets promocionales' },
];

const URBANO_TEXT_FIELDS: TextFieldDef[] = [
  { key: 'urbanoStoreName', label: 'Nombre de tienda (logo)', placeholder: 'BLNK o Nombre Empresa', group: 'Principal' },
  { key: 'urbanoHeroSubtitle', label: 'Hero subtítulo', placeholder: 'Nueva colección', group: 'Hero' },
  { key: 'urbanoHeroTitle', label: 'Hero título', placeholder: 'Estilo urbano para la ciudad', group: 'Hero' },
  { key: 'urbanoHeroBtn', label: 'Hero botón', placeholder: '[ VER COLECCIÓN ]', group: 'Hero' },
  { key: 'urbanoAnnouncementText', label: 'Barra superior', placeholder: '[ VER COLECCIÓN ]', group: 'Header' },
  { key: 'urbanoCat1Text', label: 'Categoría 1', placeholder: 'Automática', group: 'Categorías', type: 'categorySelect' },
  { key: 'urbanoCat2Text', label: 'Categoría 2', placeholder: 'Automática', group: 'Categorías', type: 'categorySelect' },
  { key: 'urbanoCat3Text', label: 'Categoría 3', placeholder: 'Automática', group: 'Categorías', type: 'categorySelect' },
  { key: 'urbanoCat4Text', label: 'Categoría 4', placeholder: 'Automática', group: 'Categorías', type: 'categorySelect' },
  { key: 'urbanoMarqueeText', label: 'Marquesina central', placeholder: 'MODA URBANA / NUEVA COLECCIÓN...', group: 'Bloques' },
  { key: 'urbanoShopTheLookTitle', label: 'Título "Compra el look"', placeholder: 'COMPRA EL LOOK', group: 'Bloques' },
  { key: 'urbanoBottomBannerText', label: 'Marquesina inferior', placeholder: 'VISTE A TU MANERA.', group: 'Bloques' },
  { key: 'urbanoBottomBannerBtn', label: 'Botón banner inferior', placeholder: '[ VER COLECCIÓN ]', group: 'Bloques' },
  { key: 'urbanoFeatureLabel', label: 'Etiqueta producto macro', placeholder: 'CASACA', group: 'Bloques' },
  { key: 'urbanoSlogan', label: 'Slogan footer', placeholder: 'Moda urbana minimalista...', group: 'Footer' },
  { key: 'urbanoFooterTitle', label: 'Footer: título contacto', placeholder: 'Atención', group: 'Footer' },
  { key: 'urbanoFooterHelpText', label: 'Footer: texto contacto', placeholder: 'Compra desde la tienda oficial...', group: 'Footer' },
  { key: 'urbanoFooterPhone', label: 'Footer: WhatsApp', placeholder: '+51 999 999 999', group: 'Footer' },
  { key: 'urbanoFooterEmail', label: 'Footer: email', placeholder: 'contacto@tutienda.com', group: 'Footer' },
  { key: 'urbanoInstagramUrl', label: 'Instagram', placeholder: 'https://instagram.com/tu-tienda', group: 'Redes' },
  { key: 'urbanoTiktokUrl', label: 'TikTok', placeholder: 'https://tiktok.com/@tu-tienda', group: 'Redes' },
  { key: 'urbanoFacebookUrl', label: 'Facebook', placeholder: 'https://facebook.com/tu-tienda', group: 'Redes' },
  { key: 'urbanoTwitterUrl', label: 'X / Twitter', placeholder: 'https://x.com/tu-tienda', group: 'Redes' },
];

const MAYE_TEXT_FIELDS: TextFieldDef[] = [
  { key: 'mayeHeaderCategoryLabel', label: 'Botón categorías', placeholder: 'Categorías', group: 'Header' },
  { key: 'mayeSearchPlaceholder', label: 'Placeholder buscador', placeholder: 'Buscar producto...', group: 'Header' },
  { key: 'mayeQuickLink1', label: 'Acceso rápido 1', placeholder: 'Laptops y PCs', group: 'Header', type: 'categorySelect' },
  { key: 'mayeQuickLink2', label: 'Acceso rápido 2', placeholder: 'Procesadores y RAM', group: 'Header', type: 'categorySelect' },
  { key: 'mayeQuickLink3', label: 'Acceso rápido 3', placeholder: 'Almacenamiento', group: 'Header', type: 'categorySelect' },
  { key: 'mayeQuickLink4', label: 'Acceso rápido 4', placeholder: 'Tarjetas Gráficas', group: 'Header', type: 'categorySelect' },
  { key: 'mayeHeroEyebrow', label: 'Etiqueta hero', placeholder: 'Más vendidos de la semana', group: 'Hero' },
  { key: 'heroTitle', label: 'Título hero', placeholder: 'Laptops y PCs\\nAlta Gama', group: 'Hero' },
  { key: 'heroSubtitle', label: 'Subtítulo hero', placeholder: 'Equipos y accesorios de última generación...', group: 'Hero' },
  { key: 'mayeHeroButton', label: 'Botón hero', placeholder: 'Ver catálogo', group: 'Hero' },
  { key: 'mayeSideTopLabel', label: 'Lateral superior: etiqueta', placeholder: 'Procesadores y RAM', group: 'Hero lateral' },
  { key: 'mayeSideTopBadge', label: 'Lateral superior: badge', placeholder: 'Ej: Promo vigente', group: 'Hero lateral' },
  { key: 'mayeSideTopTitle', label: 'Lateral superior: título', placeholder: '¡Colecciones!', group: 'Hero lateral' },
  { key: 'mayeSideTopButton', label: 'Lateral superior: botón', placeholder: 'Ver Ahora', group: 'Hero lateral' },
  { key: 'mayeSideBottomBadge', label: 'Lateral inferior: badge', placeholder: 'Ej: Oferta activa', group: 'Hero lateral' },
  { key: 'mayeSideBottomTitle', label: 'Lateral inferior: título', placeholder: 'Periféricos RGB', group: 'Hero lateral' },
  { key: 'mayeSideBottomButton', label: 'Lateral inferior: botón', placeholder: 'Comprar Ahora', group: 'Hero lateral' },
  { key: 'mayeFinderTitle', label: 'Buscador: título', placeholder: 'Busca tu Equipo Ideal', group: 'Buscador tech' },
  { key: 'mayeFinderText', label: 'Buscador: texto', placeholder: 'Colección de más de 10,000+ productos tecnológicos', group: 'Buscador tech' },
  { key: 'mayeFeaturedCategoriesTitle', label: 'Título categorías', placeholder: 'Categorías Destacadas', group: 'Categorías' },
  { key: 'mayeFeaturedCategoriesText', label: 'Texto categorías', placeholder: 'Encuentra los mejores equipos tecnológicos...', group: 'Categorías' },
  { key: 'mayeCategory1Title', label: 'Categoría destacada 1', placeholder: 'Laptops y PCs', group: 'Categorías', type: 'categorySelect' },
  { key: 'mayeCategory2Title', label: 'Categoría destacada 2', placeholder: 'Componentes de PC', group: 'Categorías', type: 'categorySelect' },
  { key: 'mayeCategory3Title', label: 'Categoría destacada 3', placeholder: 'Periféricos', group: 'Categorías', type: 'categorySelect' },
  { key: 'mayePromoLeftLabel', label: 'Promo izquierda: etiqueta', placeholder: 'Colección destacada', group: 'Promos' },
  { key: 'mayePromoLeftTitle', label: 'Promo izquierda: título', placeholder: 'Colección de Componentes de PC', group: 'Promos' },
  { key: 'mayePromoLeftButton', label: 'Promo izquierda: botón', placeholder: 'Ver Ahora', group: 'Promos' },
  { key: 'mayePromoRightLabel', label: 'Promo derecha: etiqueta', placeholder: 'Mejores Marcas', group: 'Promos' },
  { key: 'mayePromoRightSubtitle', label: 'Promo derecha: subtítulo', placeholder: 'Luces y Faros', group: 'Promos' },
  { key: 'mayePromoRightTitle', label: 'Promo derecha: título', placeholder: 'Mega Oferta', group: 'Promos' },
  { key: 'mayePromoRightButton', label: 'Promo derecha: botón', placeholder: 'Comprar Ahora', group: 'Promos' },
  { key: 'mayeFeaturedProductsLabel', label: 'Etiqueta productos', placeholder: 'Producto Destacado', group: 'Productos' },
  { key: 'mayeFeaturedProductsTitle', label: 'Título productos', placeholder: 'Productos por Categoría', group: 'Productos' },
  { key: 'mayeTrendingProductsTitle', label: 'Título más buscados', placeholder: 'Productos Más Buscados', group: 'Productos' },
  { key: 'comunidadText', label: 'Comunidad: etiqueta', placeholder: 'Únete al Club', group: 'Comunidad' },
  { key: 'comunidadTitle', label: 'Comunidad: título', placeholder: 'Sé parte de nuestra\\nComunidad Tech', group: 'Comunidad' },
  { key: 'mayeCommunityButton', label: 'Comunidad: botón', placeholder: 'Unirse Ahora', group: 'Comunidad' },
  { key: 'mayeSupportLabel', label: 'Soporte: etiqueta', placeholder: 'Soporte al Cliente', group: 'Comunidad' },
  { key: 'mayeSupportTitle', label: 'Soporte: título', placeholder: 'Asistencia Experta 24h Soporte', group: 'Comunidad' },
  { key: 'mayeSupportButton', label: 'Soporte: botón', placeholder: 'Empezar', group: 'Comunidad' },
  { key: 'mayeDealsLabel', label: 'Ofertas: etiqueta', placeholder: 'Mejores Ofertas', group: 'Ofertas' },
  { key: 'mayeDealsTitle', label: 'Ofertas: título', placeholder: 'Ofertas de la Semana', group: 'Ofertas' },
  { key: 'mayeBrandsFlashLabel', label: 'Marcas: promo', placeholder: 'Selección destacada', group: 'Marcas' },
  { key: 'mayeBrandsFlashTitle', label: 'Marcas: banner', placeholder: 'Accesorios\\npara Reparación\\nde Equipos', group: 'Marcas' },
  { key: 'mayeBrandsLabel', label: 'Marcas: etiqueta', placeholder: 'Nuestras Marcas', group: 'Marcas' },
  { key: 'mayeBrandsTitle', label: 'Marcas: título', placeholder: 'Comprar por Marcas', group: 'Marcas' },
  { key: 'mayeTopSellingLabel', label: 'Top ventas: etiqueta', placeholder: 'Top Ventas', group: 'Top ventas' },
  { key: 'mayeTopSellingTitle', label: 'Top ventas: título', placeholder: 'Productos Más Vendidos', group: 'Top ventas' },
  { key: 'mayeTopSellingText', label: 'Top ventas: texto', placeholder: 'Explora nuestros productos más populares...', group: 'Top ventas' },
  { key: 'tiktokLiveUrl', label: 'Producto: TikTok', placeholder: 'https://www.tiktok.com/@tu-tienda', group: 'Accesos de producto' },
  { key: 'googleReviewsUrl', label: 'Producto: opiniones Google', placeholder: 'https://g.page/r/tu-negocio/review', group: 'Accesos de producto' },
  { key: 'shalomUrl', label: 'Producto: agencias Shalom', placeholder: 'https://www.shalom.pe/agencias', group: 'Accesos de producto' },
  { key: 'ubicacionUrl', label: 'Producto: URL local de recojo', placeholder: 'https://maps.google.com/?q=...', group: 'Accesos de producto' },
  { key: 'ubicacionDireccion', label: 'Producto: dirección local de recojo', placeholder: 'Av. Principal 123, Lima', group: 'Accesos de producto' },
  { key: 'mayeFooterHelpTitle', label: 'Footer: título', placeholder: 'Información de Ayuda', group: 'Footer' },
  { key: 'mayeFooterHelpText', label: 'Footer: texto', placeholder: 'Muestra de manera destacada...', group: 'Footer' },
  { key: 'mayeFooterPhone', label: 'Footer: teléfono', placeholder: '+51 999 999 999', group: 'Footer' },
  { key: 'mayeFooterEmail', label: 'Footer: email', placeholder: 'contacto@tutienda.com', group: 'Footer' },
  { key: 'mayeFooterFeature1Title', label: 'Footer beneficio 1', placeholder: 'Despacho coordinado', group: 'Footer beneficios' },
  { key: 'mayeFooterFeature1Text', label: 'Footer beneficio 1 texto', placeholder: 'Envios o recojo segun tu tienda', group: 'Footer beneficios' },
  { key: 'mayeFooterFeature2Title', label: 'Footer beneficio 2', placeholder: 'Pagos confiables', group: 'Footer beneficios' },
  { key: 'mayeFooterFeature2Text', label: 'Footer beneficio 2 texto', placeholder: 'Medios de pago configurados', group: 'Footer beneficios' },
  { key: 'mayeFooterFeature3Title', label: 'Footer beneficio 3', placeholder: 'Atención postventa', group: 'Footer beneficios' },
  { key: 'mayeFooterFeature3Text', label: 'Footer beneficio 3 texto', placeholder: 'Cambios y garantia segun politica de tienda', group: 'Footer beneficios' },
  { key: 'mayeFooterFeature4Title', label: 'Footer beneficio 4', placeholder: 'Soporte de compra', group: 'Footer beneficios' },
  { key: 'mayeFooterFeature4Text', label: 'Footer beneficio 4 texto', placeholder: 'Contacto antes y despues del pedido', group: 'Footer beneficios' },
];

const TECNOLOGIA_TEXT_FIELDS: TextFieldDef[] = [
  { key: 'tecnologiaHeroLabel', label: 'Etiqueta hero', placeholder: 'Nuevos productos disponibles', group: 'Hero' },
  { key: 'tecnologiaHeroTitle', label: 'Título hero', placeholder: 'Obtén Los Mejores\\nDispositivos\\nAl Mejor Precio.', group: 'Hero' },
  { key: 'tecnologiaHeroSubtitle', label: 'Subtítulo hero', placeholder: 'Laptops, celulares, accesorios y gaming al mejor precio...', group: 'Hero' },
  { key: 'tecnologiaHeroButton', label: 'Botón principal', placeholder: 'Explorar Ahora', group: 'Hero' },
  { key: 'tecnologiaHeroPromoButton', label: 'Botón secundario', placeholder: 'Ver Promoción', group: 'Hero' },
  { key: 'tecnologiaPopularTitle', label: 'Título productos populares', placeholder: 'Productos Populares', group: 'Productos' },
  { key: 'tecnologiaPopularText', label: 'Texto productos populares', placeholder: '8 productos', group: 'Productos' },
  { key: 'tecnologiaSuggestedTitle', label: 'Título productos sugeridos', placeholder: 'Productos que te podrían interesar', group: 'Productos' },
  { key: 'tecnologiaSuggestedText', label: 'Texto productos sugeridos', placeholder: 'Productos recomendados para ti', group: 'Productos' },
  { key: 'tecnologiaFooterText', label: 'Footer: descripción', placeholder: 'Equipos, componentes y accesorios tecnológicos...', group: 'Footer' },
  { key: 'tecnologiaFooterPhone', label: 'Footer: teléfono', placeholder: '+51 999 999 999', group: 'Footer' },
  { key: 'tecnologiaFooterEmail', label: 'Footer: email', placeholder: 'contacto@tutienda.com', group: 'Footer' },
  { key: 'tecnologiaInstagramUrl', label: 'Instagram', placeholder: 'https://instagram.com/tu-tienda', group: 'Redes' },
  { key: 'tecnologiaFacebookUrl', label: 'Facebook', placeholder: 'https://facebook.com/tu-tienda', group: 'Redes' },
  { key: 'tecnologiaTiktokUrl', label: 'TikTok', placeholder: 'https://tiktok.com/@tu-tienda', group: 'Redes' },
  { key: 'tecnologiaTwitterUrl', label: 'X / Twitter', placeholder: 'https://x.com/tu-tienda', group: 'Redes' },
];

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTOS DESTACADOS
// ─────────────────────────────────────────────────────────────────────────────
const URBANO_PRODUCT_FIELDS: ProductFieldDef[] = [
  { key: 'urbanoShopTheLookProducts', label: "Productos en 'Compra el look'" },
  { key: 'urbanoFeatureProducts', label: "Productos en 'Completa el look'" },
];

const MAYE_PRODUCT_FIELDS: ProductFieldDef[] = [
  { key: 'mayeFeaturedProducts', label: 'Productos destacados de portada' },
  { key: 'mayeTrendingProducts', label: 'Productos más buscados' },
  { key: 'mayeDealsProducts', label: 'Productos en ofertas de la semana' },
  { key: 'mayeTopSellingProducts', label: 'Productos en top ventas' },
];

const TECNOLOGIA_PRODUCT_FIELDS: ProductFieldDef[] = [
  { key: 'tecnologiaPopularProducts', label: 'Productos populares de portada' },
  { key: 'tecnologiaSuggestedProducts', label: 'Productos sugeridos' },
];

const MODA_LINK_FIELDS: LinkFieldDef[] = [
  { key: 'modaHeroAction', label: 'Banner del hero', group: 'Hero', defaultType: 'catalog' },
];

const MAYE_LINK_FIELDS: LinkFieldDef[] = [
  { key: 'mayeHeroAction', label: 'Hero principal', group: 'Hero', defaultType: 'catalog' },
  { key: 'mayeSideTopAction', label: 'Banner lateral superior', group: 'Hero', defaultType: 'category' },
  { key: 'mayeSideBottomAction', label: 'Banner lateral inferior', group: 'Hero', defaultType: 'category' },
  { key: 'mayeFinderAction', label: 'Botón ver todo catálogo', group: 'Hero', defaultType: 'catalog' },
  { key: 'mayeCategory1Action', label: 'Categoría destacada 1', group: 'Categorías', defaultType: 'category' },
  { key: 'mayeCategory2Action', label: 'Categoría destacada 2', group: 'Categorías', defaultType: 'category' },
  { key: 'mayeCategory3Action', label: 'Categoría destacada 3', group: 'Categorías', defaultType: 'category' },
  { key: 'mayeAllCategoriesAction', label: 'Botón todas las categorías', group: 'Categorías', defaultType: 'catalog' },
  { key: 'mayePromoLeftAction', label: 'Promo izquierda', group: 'Promos', defaultType: 'catalog' },
  { key: 'mayePromoRightAction', label: 'Promo derecha', group: 'Promos', defaultType: 'catalog' },
  { key: 'mayeCommunityAction', label: 'Bloque comunidad', group: 'Comunidad', defaultType: 'catalog' },
  { key: 'mayeSupportAction', label: 'Bloque soporte', group: 'Comunidad', defaultType: 'catalog' },
  { key: 'mayeBrandsFlashAction', label: 'Promo de marcas', group: 'Marcas', defaultType: 'catalog' },
  { key: 'mayeBrandsMoreAction', label: 'Botón más marcas', group: 'Marcas', defaultType: 'catalog' },
  { key: 'mayeWidgetOneAction', label: 'Widget inferior 1', group: 'Widgets', defaultType: 'catalog' },
  { key: 'mayeWidgetTwoAction', label: 'Widget inferior 2', group: 'Widgets', defaultType: 'catalog' },
  { key: 'mayeWidgetThreeAction', label: 'Widget inferior 3', group: 'Widgets', defaultType: 'catalog' },
];

const TECNOLOGIA_LINK_FIELDS: LinkFieldDef[] = [
  { key: 'tecnologiaHeroAction', label: 'Hero principal', group: 'Hero', defaultType: 'catalog' },
  { key: 'tecnologiaHeroPromoAction', label: 'Botón secundario del hero', group: 'Hero', defaultType: 'catalog' },
  { key: 'tecnologiaPopularAction', label: 'Ver todo productos populares', group: 'Productos', defaultType: 'catalog' },
  { key: 'tecnologiaSuggestedAction', label: 'Ver todo productos sugeridos', group: 'Productos', defaultType: 'catalog' },
];

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRO POR PLANTILLA
// ─────────────────────────────────────────────────────────────────────────────
export interface LiveEditorPlantillaConfig {
  textFields: TextFieldDef[];
  imageFields: ImageFieldDef[];
  productFields: ProductFieldDef[];
  linkFields: LinkFieldDef[];
}

const EMPTY: LiveEditorPlantillaConfig = { textFields: [], imageFields: [], productFields: [], linkFields: [] };

export const LIVE_EDITOR_FIELDS: Record<string, LiveEditorPlantillaConfig> = {
  autopartes: { textFields: AUTOPARTES_TEXT_FIELDS, imageFields: AUTOPARTES_IMAGE_FIELDS, productFields: [], linkFields: [] },
  urbano: { textFields: URBANO_TEXT_FIELDS, imageFields: URBANO_IMAGE_FIELDS, productFields: URBANO_PRODUCT_FIELDS, linkFields: [] },
  moda: { textFields: [], imageFields: MODA_IMAGE_FIELDS, productFields: [], linkFields: MODA_LINK_FIELDS },
  maye: { textFields: MAYE_TEXT_FIELDS, imageFields: MAYE_IMAGE_FIELDS, productFields: MAYE_PRODUCT_FIELDS, linkFields: MAYE_LINK_FIELDS },
  tecnologia: { textFields: TECNOLOGIA_TEXT_FIELDS, imageFields: TECNOLOGIA_IMAGE_FIELDS, productFields: TECNOLOGIA_PRODUCT_FIELDS, linkFields: TECNOLOGIA_LINK_FIELDS },
};

export function getLiveEditorConfig(plantillaId?: string | null): LiveEditorPlantillaConfig {
  return LIVE_EDITOR_FIELDS[String(plantillaId || '')] ?? EMPTY;
}

export const COLOR_FIELDS: { key: string; label: string; fallback: string }[] = [
  { key: 'colorPrimario', label: 'Color principal', fallback: '#111827' },
  { key: 'colorSecundario', label: 'Color de fondo', fallback: '#ffffff' },
  { key: 'colorAccento', label: 'Color de acento / CTA', fallback: '#FF6B6B' },
];
