import { useEffect, useMemo, useState } from 'react';
import { useConfiguracionTiendaViewModel } from '@/features/admin/tienda/useConfiguracionTiendaViewModel';
import { Icon } from '@iconify/react';
import Button from '@/components/Button';
import InputPro from '@/components/InputPro';
import {
  ALL_PLANTILLAS,
  getPurchasedPremiumTemplates,
  isTemplateAllowedForRubro,
  isTemplatePremiumLocked,
  resolveTemplateId,
} from '@/components/tienda/resolveTemplate';
import { LIVE_EDITOR_FIELDS } from '@/components/tienda/liveEditorFields';
import { useAuthStore } from '@/zustand/auth';
import useAlertStore from '@/zustand/alert';
import apiClient from '@/utils/apiClient';

type PlantillaVentaConfig = {
  id: string;
  premium?: boolean;
  precioSoles?: number;
  premiumNote?: string;
};

const PREMIUM_TEMPLATE_DETAILS: Record<string, { headline: string; features: string[]; pages: string[] }> = {
  maye: {
    headline: 'Experiencia ecommerce premium para tiendas tecnológicas con portada editorial, secciones comerciales y microinteracciones.',
    features: ['Home premium con banners compuestos', 'Productos destacados y ofertas configurables', 'Animaciones profesionales', 'Personalización en vivo de textos, imágenes y productos'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Carrito lateral'],
  },
  falcon: {
    headline: 'Marketplace tecnológico completo tipo Gadgetize, pensado para vender gadgets, cómputo y accesorios con una experiencia más robusta.',
    features: ['Home con hero, banners laterales y categorías circulares', 'Blog integrado editable', 'Carrito lateral premium', 'Checkout profesional', 'Selector de productos destacados'],
    pages: ['Inicio', 'Catálogo', 'Blog', 'Detalle de producto', 'Checkout', 'Carrito lateral'],
  },
  construccion: {
    headline: 'Plantilla profesional tipo ferretería para herramientas, materiales de obra y ventas con alto ticket.',
    features: ['Diseño especializado para ferretería', 'Catálogo con filtros profesionales', 'Checkout adaptado a pedidos de tienda', 'Página de contacto', 'Carrito lateral personalizado'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },
  apicultura: {
    headline: 'Diseño cálido y premium para miel, productos naturales, alimentos artesanales y marcas orgánicas.',
    features: ['Portada visual con enfoque natural', 'Secciones de beneficios y confianza', 'Checkout limpio', 'Página de contacto', 'Personalización visual avanzada'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto'],
  },
  carteras: {
    headline: 'Boutique editorial de lujo (estilo Luxora) para carteras, bolsos y accesorios: estética beige/crema/negro con tipografía serif y acabados premium.',
    features: ['Home editorial con hero, garantías, categorías y más vendidos', 'Banners promocionales y bloque Club/Newsletter', 'Detalle de producto con galería y swatches', 'Checkout y contacto premium', 'Personalización en vivo de textos e imágenes'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },
  joyeria: {
    headline: 'Marketplace cálido de joyería (estilo Aurum/Arcade): fondo crema, tipografía grotesque en minúsculas (Space Grotesk) y acento dorado configurable, pensado para joyería, oro, plata y piedras preciosas.',
    features: ['Hero slider de 3 slides con barra tipo "Dream" (solo-imagen o con textos y botón, cada uno enlazable)', 'Home tipo feed: "lo más querido", tiles de materiales, dreamboards/colecciones y sección "próximamente"', 'Detalle de joya con selector de variantes de color (swatches oro/plata/oro rosa/gemas) y tallas, con precio/stock por variante', 'Banner de grabado personalizado, favoritos + carrito lateral y newsletter', 'Checkout y contacto premium con personalización en vivo de textos, imágenes y enlaces'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },
  abarrotes: {
    headline: 'Supermercado de abarrotes estilo grocery (Grogin): luminoso verde fresco + navy con acento morado en el hero y rating amarillo, tipografía Quicksand. Ideal para minimarket, bodega y supermercado.',
    features: ['Hero slider de 3 slides (solo-imagen o con textos, precio y botón, cada uno enlazable)', 'Círculos de categorías + selección destacada con rating y "Agregar al carrito"', 'Banners promocionales + fila de productos y banda de salud/seguridad', 'Más vendidos, tarjetas promocionales inferiores, favoritos y carrito lateral', 'Detalle con variantes (presentación/tamaño), checkout y contacto; personalización en vivo de textos, imágenes y enlaces'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },
  supermercado: {
    headline: 'Supermercado grocery verde & blanco (estilo FreshMart): barra utilitaria, buscador con categorías, hero con badge de descuento, "¿Por qué elegirnos?", testimonios y footer con métodos de pago. Ideal para minimarket, bodega y supermercado.',
    features: ['Hero slider de 3 slides (solo-imagen o con textos, badge y botón, cada uno enlazable) + tira de garantías', '"Compra por categoría" en tarjetas + banner "Súper ahorro" y tarjeta de entrega rápida', '"Ofertas del día" con tarjetas "Agregar al carrito" + "¿Por qué elegirnos?" (5 ventajas)', 'Testimonios + contador de clientes + newsletter; favoritos y carrito lateral', 'Detalle con variantes, checkout y contacto; personalización en vivo de textos, imágenes y enlaces'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },
  'ropa-hombre': {
    headline: 'Tienda editorial de ropa de hombre (estilo Urbanic): estética beige/crema/negro con tipografía serif, pensada para moda masculina moderna.',
    features: ['Hero slider de 3 slides (solo-imagen o con textos y botón, cada uno enlazable)', 'Home con garantías, categorías y más buscados con swatches de color', 'Banners promocionales y bloque Club/Newsletter', 'Detalle de producto con galería + checkout y contacto premium', 'Personalización en vivo de textos, imágenes y enlaces'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },
  bicicletas: {
    headline: 'Tienda racing para bicicletas, ciclismo y deportes (estilo Vonica): estética blanco/negro con acento rojo de alta energía y titulares condensados en mayúsculas.',
    features: ['Hero slider de 3 slides (solo-imagen o con textos y botón, cada uno enlazable)', 'Banda de colecciones destacadas + tira de garantías y categorías', 'Más vendidos con rating de estrellas, badges NEW/descuento y swatches de color', 'Banners promocionales y bloque Club/Newsletter', 'Detalle con ficha técnica + checkout y contacto premium', 'Personalización en vivo de textos, imágenes y enlaces'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },
  motos: {
    headline: 'Concesionario y taller premium para venta de motos + servicio mecánico (estilo Voltia Motos): home claro tipo bento con acento azul eléctrico, footer oscuro y titulares condensados en mayúsculas (Archivo/Oswald).',
    features: ['Hero bento: banner slider de 3 slides (solo-imagen o con textos y botón, cada uno enlazable) + tarjeta de equipamiento', 'Tira de categorías (ofertas/preventa + categorías reales), buscador ancho y tarjetas de servicios', 'Carrusel de marcas y más vendidos con botones Comprar/Añadir', 'Banners oscuros de agenda de service (taller, vía WhatsApp) y financiamiento + newsletter', 'Redes sociales editables que aparecen solas según los enlaces configurados', 'Detalle con ficha técnica, favoritos + carrito lateral, checkout y contacto premium'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },
  hoodie: {
    headline: 'Tienda editorial de ropa urbana / streetwear (estilo magazine "Hoodie"): estética beige/greige cálida con negro carbón y logotipo grotesco gigante (Archivo), pensada para hoodies, polos, moda urbana y boutiques.',
    features: ['Hero magazine: logotipo gigante + slider de 3 slides (solo-imagen o con textos y botón, cada uno enlazable)', 'Sidebar editorial: nueva colección, garantías, oferta destacada, testimonio y newsletter', 'Compra por colección, más vendidos con rating de estrellas y marquee animado', 'Detalle con galería, selector de tallas, favoritos + carrito lateral', 'Checkout y contacto premium con personalización en vivo de textos, imágenes y enlaces'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },
  tones: {
    headline: 'Tienda editorial cálida para ropa infantil y de bebé (estilo "tones"): estética crema/greige con marrón cacao, tarjetas redondeadas y títulos en minúsculas amables (Quicksand), pensada para ropa de niños, bebés y moda infantil.',
    features: ['Hero con tarjeta translúcida + slider de 3 slides (solo-imagen o con textos y botón, cada uno enlazable)', '"Nuestros favoritos", dos tarjetas split (niñas/niños) y tiles por categoría', 'Bloque destacado + productos y banner ancho "básicos para su día a día"', 'Catálogo limpio de 3 columnas con título grande, chips por categoría y tarjetas con swatches de color', 'Detalle con galería, selector de tallas, favoritos + carrito lateral', 'Checkout, contacto y footer con newsletter; personalización en vivo de textos, imágenes y enlaces'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },
  'moda-minimal': {
    headline: 'Tienda minimalista de ropa y calzado (estética estilo Everlane): monocroma blanco/negro, tipografía sans limpia, mucho espacio en blanco y enlaces subrayados.',
    features: ['Hero slider de 3 slides a pantalla completa (solo-imagen o con textos y botón, cada uno enlazable)', 'Tiles por categoría y grillas de producto sobrias con hover de segunda imagen', 'Banner editorial + sección de valores y "los favoritos"', 'Detalle limpio con galería, checkout y contacto minimalistas', 'Personalización en vivo de textos, imágenes y enlaces'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },
  zapatos: {
    headline: 'Tienda premium para zapaterías y tiendas de zapatillas (estilo sneaker store): beige cálido con CTA oliva, titulares en grotesca ancha y tarjetas redondeadas.',
    features: ['Hero slider de 3 slides con beneficios reales de la tienda en vidrio (solo-imagen o con textos y botón, cada uno enlazable)', 'Buscador + chips de categorías con íconos, destacados en carrusel y 4 bloques grandes de categoría', 'Tarjetas con rango real de tallas, colores y rating real o "Nuevo"', 'Ficha con selector de talla y color real, galería por color, zoom y barra de compra fija', 'Guía "Encuentra tu par ideal", comunidad por WhatsApp y personalización en vivo de textos, imágenes y enlaces'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },
  muebleria: {
    headline: 'Tienda premium para mueblerías, decoración y hogar (estilo escandinavo): fondo lino cálido, botones nogal, acento verde bosque y notas manuscritas.',
    features: ['Hero slider de 3 slides con estadísticas reales de tu catálogo (solo-imagen o con textos y botón, cada uno enlazable)', 'Círculos por ambiente con fotos reales, dos banners de colección y favoritos con rating real o "Nuevo"', 'Bloque de historia con panel de valores, fila de valores e inspiración con collage', 'Testimonios con reseñas reales aprobadas, galería con enlace a Instagram y comunidad por WhatsApp', 'Ficha con variantes reales, galería por color, zoom y barra de compra fija; todo editable en vivo'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },
  'moda-elegante': {
    headline: 'Boutique de moda con estética de lujo minimal editorial: blanco, negro y arena, títulos serif y etiquetas en mayúsculas.',
    features: ['Barra de anuncios rotativa, menú lateral y buscador de ancho completo', 'Hero slider de 3 slides + círculos de categoría con "Novedades" y colecciones editoriales', 'Selección destacada en 6 columnas con segunda foto al pasar el mouse y agregar rápido con cantidad', 'Banda de ofertas con el % real (reloj solo si la oferta tiene fecha de fin), inspiración enlazada a tu Instagram y newsletter por WhatsApp', 'Ficha con tallas y colores reales, zoom y barra de compra fija; todo editable en vivo'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Bolsa lateral'],
  },
  bolsos: {
    headline: 'Boutique de carteras, bolsos y accesorios: rosa y vino sobre blanco cálido, títulos serif en mayúsculas y un toque caligráfico.',
    features: ['Hero slider de 3 slides con sello del descuento real máximo (solo si tienes ofertas) y fila de valores de marca', 'Compra por categoría en círculos con fotos reales y productos destacados en 6 columnas', 'Tres banners promocionales editables, ofertas con reloj solo si la oferta tiene fecha de fin y franja de beneficios reales', 'Galería enlazada a tu Instagram, comunidad por WhatsApp y footer con tus medios de pago reales', 'Ficha con colores y medidas reales, zoom y barra de compra fija; todo editable en vivo'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },
  mascotas: {
    headline: 'Tienda cálida y juguetona para veterinarias y pet shops: fondo crema, verde salvia y naranja, tipografía redondeada.',
    features: ['Hero slider de 3 slides con palabra destacada y beneficios reales de tu tienda', 'Tarjeta de categorías con círculos de color y fotos reales de tus productos', 'Recomendados en carrusel con rating real o "Nuevo", cantidad, favoritos y comparador', 'Combos reales con el ahorro calculado de tus precios, guías de cuidado editables y testimonios con reseñas reales', 'Ficha con variantes reales (talla, sabor, peso), zoom y barra de compra fija; todo editable en vivo'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },
  celulares: {
    headline: 'Tienda de celulares y accesorios: azul eléctrico, banner navy redondeado y botones píldora, lista para vender tecnología.',
    features: ['Header con buscador grande, fila de categorías y botón de ofertas que aparece solo si tienes ofertas', 'Hero slider de 3 slides con firma manuscrita y tus beneficios reales', 'Celulares destacados en tarjetas horizontales con la capacidad real de cada equipo, comparador real y "¿Por qué tu tienda?"', 'Accesorios de la categoría que elijas, ofertas con reloj real, dos promos editables y novedades por WhatsApp', 'Ficha con variantes, zoom y barra fija; footer navy con tus medios de pago; todo editable en vivo'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },
  esencial: {
    headline: 'Tienda de moda minimal cálida: marfil, salvia y titulares serif, con logo centrado y fotos a todo el ancho.',
    features: ['Barra de anuncio con tus formas de entrega reales y menú lateral con todas tus categorías', 'Hero slider de 3 slides a todo el ancho (solo imagen o con textos y dos botones, cada uno enlazable)', 'Compra por categoría en 6 bloques con tus fotos reales y looks curados editables', 'Nuestra selección con tus destacados, favoritos con valoraciones reales y promo de temporada con el % solo si hay ofertas reales', 'Ficha con tallas y colores reales, zoom y barra fija; novedades por WhatsApp; todo editable en vivo'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Bolsa lateral'],
  },
  hogar: {
    headline: 'Tienda en mosaico estilo escandinavo para mueblerías, decoración y hogar: gris cálido, tarjetas hueso, pasteles y titulares grandes.',
    features: ['Header flotante en píldora y hero en mosaico con tu producto estrella, sello giratorio, precio y "Agregar"', 'Categoría destacada y tarjeta de entrega con tus datos reales; cinta de palabras grandes', '"Encuentra tu rincón" con tus categorías en mosaico y selección de la casa con filtros por categoría', '"Nuestra forma" con texto que se enciende al bajar y cifras reales, promesas reales, reseñas reales y carta por WhatsApp', 'Ficha con variantes, zoom y barra fija; footer oscuro con tu nombre a todo el ancho; todo editable en vivo'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Bolsa lateral'],
  },
  olmo: {
    headline: 'Tienda editorial de carteras y accesorios: verde botella, crema y arena, Playfair Display con remate en cursiva.',
    features: ['Barra de avisos con tus beneficios reales y header limpio con menú de categorías, búsqueda, mi pedido, favoritos y bolsa', 'Hero con foto en arco sobre un gran círculo y tarjeta flotante que rota tus productos reales', '"Compra por categoría" en círculos con el conteo real de piezas', 'Banner de ofertas con sello del descuento real máximo y contador hasta la fecha fin real; rieles "En oferta" y "Favoritas de la casa"', 'Círculo de clientas por WhatsApp, franja de valores, reseñas reales y ficha con variantes, zoom y "Comprar ahora"; todo editable en vivo'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },
  kartera: {
    headline: 'Tienda de carteras y accesorios con energía de "tienda de ofertas": violeta + lima, titulares extra bold y header oscuro con buscador.',
    features: ['Header oscuro de dos niveles con buscador ancho, mega-menú de categorías y avisos de ofertas por WhatsApp', 'Hero con titular resaltado en lima y tus productos reales flotando con su descuento real', 'Ofertas del día con contador hasta la fecha fin real, últimas unidades con tu stock real y más populares', 'Banner "Arma tu look", club por WhatsApp, beneficios de compra en forma de cupón y bloque "Compra rápida" con un mini pedido que se compra de verdad', 'Reseñas reales, ficha con variantes, zoom y barra fija; todo editable en vivo'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },  amora: {
    headline: 'Tienda de carteras fresca y amable: blanco limpio, verde y coral, pasteles suaves y un toque manuscrito en los titulares.',
    features: ['Header claro con buscador ancho, accesos con etiqueta (Mi pedido, Favoritos, Contacto) y fila "Comprar por categoría" con tus categorías reales', 'Hero con palabra manuscrita, foto grande editable y tarjetas con tu envío, recojo y horario reales', 'Colecciones con su número real de productos, "Elegidos para ti" con tus destacados y franja de funciones que sí hacen algo', 'Ofertas reales con reloj hasta la fecha fin real, "Comprar es así de fácil", banners de colección y comunidad por WhatsApp', 'Inspiración por categoría, reseñas reales, footer menta con medios de pago reales; ficha con variantes y zoom; todo editable en vivo'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },

  mostrador: {
    headline: 'Tienda de UNA sola página: sin portada, el cliente entra directo al catálogo y compra en pocos toques.',
    features: ['Categorías con el número real de productos, buscador por nombre o código y orden por precio o nombre', 'Tarjetas con código, precio y "+" que se vuelve selector de cantidad del carrito', 'Vista rápida del producto (fotos, variantes, cantidad, descripción y video) sin salir del catálogo', 'Carga infinita al bajar y panel de información con tus datos reales (entrega, horario, pagos, WhatsApp)', 'Colores de tu marca en la cabecera; carrito y checkout incluidos'],
    pages: ['Catálogo (inicio)', 'Vista rápida', 'Carrito lateral', 'Checkout'],
  },
  maison: {
    headline: 'Boutique cálida para carteras y accesorios: crema, cuero coñac y oliva profundo, con titulares en serif clásica y botones rectangulares.',
    features: ['Barra superior con tu envío gratis real, menú con desplegable de categorías y hero partido con sello "Nueva colección"', 'Franja de beneficios reales y "Compra por categoría" con ícono y número real de productos', 'Destacados en 6 columnas y dos banners: el oscuro usa tu descuento real máximo y el reloj solo con fecha de fin', 'Testimonios reales en carrusel y pie oliva con novedades por WhatsApp y tus medios de pago', 'Ficha con variantes por color, zoom y barra fija; checkout y contacto con tus canales reales; todo editable en vivo'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },
  floreria: {
    headline: 'Florería de lujo para ramos de rosas y arreglos florales: marfil, rubor y dorado, titulares en serif fina y pétalos que caen.',
    features: ['Hero slider con titular en dos tonos, botón de video opcional y barra de beneficios reales en vidrio', 'Catálogo de ocasiones con fotos y conteo real, y ramos populares con tus destacados primero', '"Arma tu ramo" con tus productos reales por paso (flores, envoltura, extras…) y total en vivo', 'Por qué elegirnos, opiniones reales aprobadas, suscripción por WhatsApp y banda final con foto', 'Ficha con variantes, video, zoom y barra fija; checkout con dedicatoria; todo editable en vivo'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },
  canasta: {
    headline: 'Supermercado online fresco y verde para bodegas, minimarkets y abarrotes: titulares grandes, sellos amarillos de descuento y footer verde oscuro.',
    features: ['Barra superior con envío gratis real, buscador con resultados en vivo, ubicación de tu tienda y carrito con total', 'Hero de 3 slides con sello, beneficios reales y círculos de categoría con tus fotos', 'Ofertas del día con % y reloj solo si la oferta tiene fecha de fin real; sellos "Hasta X%" calculados de tus precios', 'Recomendados + "Mejor valorados" con reseñas reales, beneficios, testimonios reales y comunidad por WhatsApp', 'Tarjetas con unidad de venta (kg, litro…), cantidad, favoritos y comparador; todo editable en vivo'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },
  retail: {
    headline: 'Tienda multi-categoría cálida y moderna para comercio minorista, bazar y tiendas por departamento: fondo crema, teal + naranja y titular serif.',
    features: ['Header con buscador central y menú de categorías; hero slider de 3 slides con palabra destacada subrayada', 'Franja de categorías con fotos reales, barra de beneficios reales y recomendados en carrusel', 'Tres banners de campaña editables, ofertas con contador de la fecha fin real y "Descubre más"', 'Banda de confianza con reseñas y cifras reales, club por WhatsApp y footer con tus medios de pago reales', 'Tarjetas con rating real, cantidad, favoritos y comparador; ficha con variantes, zoom y barra fija; todo editable en vivo'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },
  maquillaje: {
    headline: 'Tienda de lujo sereno para maquillaje, cosméticos y skincare: rosa empolvado, botones tinta, títulos en mayúsculas espaciadas y logotipo en serif.',
    features: ['Hero slider de 3 slides con foto + texto sobre degradado rosado (solo-imagen o con textos y botón, cada uno enlazable)', 'Barra de beneficios reales, destacados en carrusel, dos banners de colección y categorías populares', 'Tarjetas con tonos reales, cantidad, favoritos y comparador; ofertas con contador de la fecha fin real', 'Comunidad de Instagram y club por WhatsApp (solo si la tienda los tiene)', 'Ficha con selector de tono y tamaño real, galería por color, zoom y barra de compra fija; todo editable en vivo'],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito lateral'],
  },
  'comida-app': {
    headline: 'Experiencia tipo app de delivery para comida: interfaz mobile-first centrada que se ve igual en web y en celular, fondo crema con acentos rojo/naranja.',
    features: ['Hero slider de 3 slides (solo-imagen o con textos y botón, cada uno enlazable)', 'Círculos de categoría, combos con badges/rating/precio y botón "+"', 'Banner de ofertas y barra inferior de pestañas tipo app', 'Detalle con barra de acción fija (cantidad + agregar) y carrito bottom-sheet', 'Personalización en vivo de textos, imágenes y enlaces'],
    pages: ['Inicio', 'Menú', 'Detalle de producto', 'Checkout', 'Contacto', 'Carrito bottom-sheet'],
  },
};

const mergePlantillaConfig = (plantilla: any, config?: PlantillaVentaConfig) => ({
  ...plantilla,
  premium: config?.premium ?? plantilla.premium,
  precioSoles: config?.precioSoles ?? plantilla.precioSoles,
  premiumNote: config?.premiumNote ?? plantilla.premiumNote,
});

const getTemplateDetails = (plantilla: any) => {
  const specific = PREMIUM_TEMPLATE_DETAILS[plantilla.id];
  if (specific) return specific;
  return {
    headline: plantilla.description || 'Diseño avanzado para mejorar la presentación de tu tienda y diferenciar tu marca.',
    features: [
      'Diseño optimizado para mobile y escritorio',
      'Secciones comerciales listas para vender',
      'Estilo visual profesional según el rubro',
      'Compatible con catálogo, carrito y checkout',
    ],
    pages: ['Inicio', 'Catálogo', 'Detalle de producto', 'Checkout'],
  };
};


/** Las plantillas genéricas del inicio: ya no se ofrecen al elegir diseño. */
const PLANTILLAS_RETIRADAS = new Set(['moderna', 'minimal', 'elegante', 'tecnica', 'mercado', 'salud', 'menu', 'gadgets']);

function SeccionPlantillas({ titulo, detalle, icono, children }: { titulo: string; detalle: string; icono: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      <div className="mb-3 flex items-baseline gap-2">
        <Icon icon={icono} className="self-center text-base text-indigo-500" />
        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{titulo}</h4>
        <span className="text-xs text-gray-400">{detalle}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{children}</div>
    </section>
  );
}

export default function TemplateTienda() {
  const vm = useConfiguracionTiendaViewModel();
  const auth = useAuthStore(s => s.auth);
  const { alert } = useAlertStore();
  const rubroNombre = vm.config?.rubro?.nombre || auth?.empresa?.rubro?.nombre || '';
  const rubroId = vm.config?.rubro?.id || (auth as any)?.empresa?.rubroId || (auth as any)?.empresa?.rubro?.id;
  const activePlantillaId = vm.config?.diseno?.plantillaId;
  const activeTemplateId = resolveTemplateId(activePlantillaId);
  // Las plantillas con editor en vivo personalizan banners/imágenes directo en la tienda,
  // así que aquí se ocultan los "Banners de Tienda Virtual" (sistema antiguo) para evitar duplicidad.
  const usesLiveTemplateEditor = Object.prototype.hasOwnProperty.call(LIVE_EDITOR_FIELDS, activeTemplateId);
  const [rubroPlantillaId, setRubroPlantillaId] = useState<string | null>(null);
  const [loadingRubroPlantilla, setLoadingRubroPlantilla] = useState(false);
  const [plantillasConfig, setPlantillasConfig] = useState<Record<string, PlantillaVentaConfig>>({});
  const [previewPlantilla, setPreviewPlantilla] = useState<any | null>(null);
  const plantillasPremiumCompradas = useMemo(
    () => getPurchasedPremiumTemplates(vm.config?.diseno),
    [vm.config?.diseno],
  );

  useEffect(() => {
    let mounted = true;
    apiClient.get('/diseno-rubro/plantillas/config')
      .then(({ data }) => {
        if (!mounted) return;
        const payload = (data as any)?.data ?? data;
        const lista = Array.isArray(payload) ? payload : [];
        const map = lista.reduce<Record<string, PlantillaVentaConfig>>((acc, item: PlantillaVentaConfig) => {
          if (item?.id) acc[item.id] = item;
          return acc;
        }, {});
        setPlantillasConfig(map);
      })
      .catch(() => {
        if (mounted) setPlantillasConfig({});
      });

    return () => { mounted = false; };
  }, []);

  const plantillasCatalogo = useMemo(
    () => ALL_PLANTILLAS.map(plantilla => mergePlantillaConfig(plantilla, plantillasConfig[plantilla.id])),
    [plantillasConfig],
  );

  // Plantillas que el ADMIN_SISTEMA habilitó para este rubro (CSV en diseno-rubro).
  useEffect(() => {
    let mounted = true;
    if (!rubroId) {
      setRubroPlantillaId(null);
      return;
    }

    setLoadingRubroPlantilla(true);
    apiClient.get(`/diseno-rubro/${rubroId}`)
      .then(({ data }) => {
        if (!mounted) return;
        const payload = data?.data ?? data;
        const plantillaId = typeof payload?.plantillaId === 'string' ? payload.plantillaId : null;
        setRubroPlantillaId(plantillaId);
      })
      .catch(() => {
        if (mounted) setRubroPlantillaId(null);
      })
      .finally(() => {
        if (mounted) setLoadingRubroPlantilla(false);
      });

    return () => { mounted = false; };
  }, [rubroId]);

  // IDs habilitados para el rubro: lo que asignó el admin manda. Si el admin aún no
  // configuró este rubro, caemos al permiso por defecto del catálogo de plantillas.
  const allowedPlantillaIds = useMemo(() => {
    // Lo que el admin asignó al rubro, sin ids retirados ni que ya no existen.
    const existe = new Set(plantillasCatalogo.map(p => p.id));
    const fromAdmin = (rubroPlantillaId || '').split(',').map(s => s.trim())
      .filter(id => id && existe.has(id as any) && !PLANTILLAS_RETIRADAS.has(id));
    if (fromAdmin.length > 0) return fromAdmin;
    if (rubroNombre) {
      // Solo las pensadas para el rubro: las universales (sin rubros) van abajo.
      const porRubro = plantillasCatalogo
        .filter(p => !PLANTILLAS_RETIRADAS.has(p.id) && (p.rubrosPermitidos?.length ?? 0) > 0 && isTemplateAllowedForRubro(p, rubroNombre))
        .map(p => p.id);
      if (porRubro.length > 0) return porRubro;
    }
    return [] as string[];
  }, [plantillasCatalogo, rubroPlantillaId, rubroNombre]);

  // Todo el catálogo se puede elegir; las del rubro solo van primero como
  // recomendadas. Las 8 plantillas genéricas del inicio ya no se ofrecen (una
  // tienda que todavía usa una la sigue viendo, marcada como su diseño activo).
  const visible = (p: { id: string }) => !PLANTILLAS_RETIRADAS.has(p.id) || p.id === activeTemplateId;
  const recomendadas = useMemo(
    () => plantillasCatalogo.filter(p => visible(p) && allowedPlantillaIds.includes(p.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allowedPlantillaIds, plantillasCatalogo, activeTemplateId],
  );
  const otras = useMemo(
    () => plantillasCatalogo.filter(p => visible(p) && !allowedPlantillaIds.includes(p.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allowedPlantillaIds, plantillasCatalogo, activeTemplateId],
  );

  // La plantilla activa es la que el emprendedor eligió (override).
  const seleccionada = activeTemplateId;

  const elegirPlantilla = (id: string) => {
    if (id === activePlantillaId || vm.saving) return;
    const plantilla = plantillasCatalogo.find(item => item.id === id);
    if (plantilla && isTemplatePremiumLocked(plantilla, vm.config?.diseno)) {
      alert(`La plantilla ${plantilla.label} es premium. Solicita la compra para activarla.`, 'warning');
      return;
    }
    vm.actualizarDiseno({ plantillaId: id });
  };

  const solicitarPlantillaPremium = (plantilla: any) => {
    const mensaje = encodeURIComponent(
      `Hola, quiero comprar la plantilla premium ${plantilla.label} para mi tienda. Precio: S/ ${Number(plantilla.precioSoles || 0).toFixed(2)}.`,
    );
    window.open(`https://wa.me/?text=${mensaje}`, '_blank');
  };

  const getPreviewUrl = (plantillaId: string) => {
    if (formData.slugTienda) {
      const params = new URLSearchParams({
        previewPlantilla: plantillaId,
        previewOrigen: 'template',
      });
      return `/tienda/${formData.slugTienda}?${params.toString()}`;
    }

    const diseno = vm.config?.diseno || {};
    const params = new URLSearchParams({
      plantillaId,
      colorPrimario: diseno.colorPrimario || '#6A6CFF',
      colorSecundario: diseno.colorSecundario || '#ffffff',
      colorAccento: diseno.colorAccento || '#FF6B6B',
      tipografia: diseno.tipografia || 'Inter',
      rubroNombre: rubroNombre || 'Tienda',
    });
    return `/diseno-preview?${params.toString()}`;
  };

  const renderTarjeta = (plantilla: any) => {
              const isOn = seleccionada === plantilla.id;
              const isPremium = Boolean(plantilla.premium);
              const isPurchased = plantillasPremiumCompradas.includes(plantilla.id);
              const isLocked = isTemplatePremiumLocked(plantilla, vm.config?.diseno);
              const details = getTemplateDetails(plantilla);

              return (
                <div
                  key={plantilla.id}
                  className={`relative text-left p-4 rounded-xl border-2 transition-all flex flex-col hover:border-indigo-300 dark:hover:border-indigo-700
                    ${isOn ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-sm' : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                >
                  {isOn && (
                    <span className="absolute top-2 right-2">
                      <Icon icon="solar:check-circle-bold" className="text-indigo-600 text-sm" />
                    </span>
                  )}

                  {isPremium && (
                    <span className={`absolute top-2 ${isOn ? 'right-8' : 'right-2'} inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wider ${isPurchased ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                      <Icon icon={isPurchased ? 'solar:unlock-bold' : 'solar:lock-keyhole-bold'} className="text-xs" />
                      {isPurchased ? 'Comprada' : 'Premium'}
                    </span>
                  )}

                  <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: plantilla.accentColor + '18' }}>
                    <Icon icon={plantilla.icon} className="text-xl" style={{ color: plantilla.accentColor }} />
                  </div>

                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-1">{plantilla.label}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {plantilla.description}
                  </p>

                  {isPremium && (
                    <div className="mt-3 space-y-3 rounded-xl border border-amber-100 bg-amber-50/70 p-3 dark:border-amber-900/40 dark:bg-amber-900/10">
                      <div>
                        <p className="text-lg font-black text-gray-900 dark:text-white">S/ {Number(plantilla.precioSoles || 0).toFixed(2)}</p>
                        <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                          {plantilla.premiumNote || 'Compra única aparte del plan'}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        {details.features.slice(0, 3).map((feature) => (
                          <p key={feature} className="flex items-start gap-1.5 text-[10px] font-semibold leading-snug text-gray-700 dark:text-gray-300">
                            <Icon icon="solar:check-circle-bold" className="mt-0.5 flex-shrink-0 text-emerald-500" />
                            {feature}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewPlantilla(plantilla)}
                      className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-50 dark:bg-slate-800 dark:text-gray-200 dark:ring-slate-700"
                    >
                      {isPremium ? 'Ver qué incluye' : 'Vista previa'}
                    </button>
                    <button
                      type="button"
                      onClick={() => elegirPlantilla(plantilla.id)}
                      disabled={vm.saving || isLocked}
                      className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all disabled:cursor-not-allowed
                        ${isOn
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                          : isLocked
                            ? 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-gray-500'
                            : 'bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-gray-900'}`}
                    >
                      {isOn ? 'Diseño activo' : isLocked ? 'Bloqueada' : 'Usar diseño'}
                    </button>
                    {isLocked && (
                      <button
                        type="button"
                        onClick={() => solicitarPlantillaPremium(plantilla)}
                        className="rounded-full bg-amber-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-amber-600"
                      >
                        Comprar
                      </button>
                    )}
                  </div>
                </div>
              );
  };

  const { formData, saving } = vm;

  // Sync live changes to iframe
  useEffect(() => {
    const iframe = document.getElementById('live-editor-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        { type: 'UPDATE_DISENO', payload: vm.config?.diseno || {} },
        '*'
      );
    }
  }, [vm.config?.diseno]);

  if (vm.loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-[#0A0D14]">
        <Icon icon="eos-icons:loading" className="w-12 h-12 text-gray-400" />
      </div>
    );
  }

  if (!vm.config?.plan?.tieneTienda) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-white dark:bg-[#111827] rounded-lg shadow text-center border dark:border-slate-800">
        <Icon icon="mdi:store-off" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2 dark:text-white">Template de tienda no disponible</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Tu plan actual no incluye tienda virtual.</p>
        <Button onClick={() => window.location.href = '/administrador/perfil'}>Ver Planes</Button>
      </div>
    );
  }


  return (
    <div className="min-h-screen pb-4 px-2 bg-gray-50 dark:bg-[#0A0D14]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Icon icon="solar:palette-round-bold-duotone" className="text-indigo-600 dark:text-indigo-400" />
            Diseño y Template de Tienda
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Personaliza plantilla, banners e imágenes visuales del template.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.location.href = '/administrador/tienda/configuracion'}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-200 text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-900 transition-all"
          >
            <Icon icon="solar:settings-bold" className="text-lg" />
            Config. general
          </button>
          {formData.slugTienda && (
            <button
              type="button"
              onClick={vm.abrirTienda}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <Icon icon="solar:shop-2-bold" className="text-lg" />
              Ver mi tienda
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Lanzador del editor en vivo (modo WordPress) */}
        <button
          type="button"
          onClick={() => {
            if (!formData.slugTienda) { alert('Primero configura el nombre de tu tienda (slug)', 'warning'); return; }
            window.open(`/tienda/${formData.slugTienda}?edit=1`, '_blank');
          }}
          className="group w-full text-left rounded-2xl p-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 transition-all active:scale-[0.99] flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 min-w-0">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Icon icon="solar:magic-stick-3-bold" className="text-2xl" />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-black leading-tight">Personalizar mi tienda en vivo</p>
              <p className="text-sm text-white/80">Abre tu tienda real y edita textos, colores e imágenes con un panel lateral, viendo los cambios al instante.</p>
            </div>
          </div>
          <Icon icon="solar:arrow-right-bold" className="text-2xl flex-shrink-0 transition-transform group-hover:translate-x-1" />
        </button>

        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Icon icon="solar:shop-2-bold-duotone" className="text-xl text-indigo-500" />
            Plantilla de Tienda
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Elige el diseño con el que se verá tu tienda. Arriba están los recomendados para tu rubro y abajo todos los demás: puedes usar cualquiera.
            {loadingRubroPlantilla ? ' Cargando diseños del rubro...' : ' El cambio se aplica al instante en tu tienda virtual.'}
          </p>

          {recomendadas.length > 0 && (
            <SeccionPlantillas
              titulo={`Recomendados para ${rubroNombre || 'tu rubro'}`}
              detalle="Pensados para lo que vendes."
              icono="solar:star-bold-duotone"
            >
              {recomendadas.map(renderTarjeta)}
            </SeccionPlantillas>
          )}
          <SeccionPlantillas
            titulo={recomendadas.length > 0 ? 'También te podría interesar' : 'Todos los diseños'}
            detalle="Cualquiera sirve para tu tienda: elige el que más te guste."
            icono="solar:widget-5-bold-duotone"
          >
            {otras.map(renderTarjeta)}
          </SeccionPlantillas>
        </div>
      </div>
      {previewPlantilla && (() => {
        const details = getTemplateDetails(previewPlantilla);
        const isPremium = Boolean(previewPlantilla.premium);
        const isPurchased = plantillasPremiumCompradas.includes(previewPlantilla.id);
        const isLocked = isTemplatePremiumLocked(previewPlantilla, vm.config?.diseno);
        const isActivePreview = activeTemplateId === previewPlantilla.id;

        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3 sm:p-5">
            <div className="flex max-h-[94vh] w-full max-w-[min(1800px,96vw)] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#111827]">
              <div className="flex flex-col gap-4 border-b border-gray-100 p-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${previewPlantilla.accentColor}18`, color: previewPlantilla.accentColor }}>
                      <Icon icon={previewPlantilla.icon} className="text-2xl" />
                    </span>
                    <div>
                      <h3 className="text-xl font-black text-gray-950 dark:text-white">{previewPlantilla.label}</h3>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{previewPlantilla.description}</p>
                    </div>
                  </div>
                  {isPremium && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        <Icon icon="solar:crown-bold" />
                        Premium · S/ {Number(previewPlantilla.precioSoles || 0).toFixed(2)}
                      </span>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{previewPlantilla.premiumNote || 'Compra única aparte del plan'}</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewPlantilla(null)}
                  className="self-end rounded-2xl bg-gray-100 p-3 text-gray-500 transition hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 sm:self-start"
                >
                  <Icon icon="solar:close-circle-bold" className="text-xl" />
                </button>
              </div>

              <div className="grid min-h-0 flex-1 lg:grid-cols-[360px_minmax(0,1fr)]">
                <aside className="space-y-5 overflow-y-auto border-b border-gray-100 p-5 dark:border-slate-800 lg:border-b-0 lg:border-r">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-gray-400">Por qué cuesta más</p>
                    <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-700 dark:text-gray-300">{details.headline}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-gray-400">Incluye</p>
                    <div className="mt-3 space-y-2">
                      {details.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-2 rounded-2xl bg-gray-50 p-3 text-sm font-semibold text-gray-700 dark:bg-slate-900 dark:text-gray-300">
                          <Icon icon="solar:check-circle-bold" className="mt-0.5 flex-shrink-0 text-emerald-500" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-gray-400">Páginas listas</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {details.pages.map((page) => (
                        <span key={page} className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                          {page}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {isLocked ? (
                      <button
                        type="button"
                        onClick={() => solicitarPlantillaPremium(previewPlantilla)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white transition hover:bg-amber-600"
                      >
                        <Icon icon="solar:cart-check-bold" className="text-lg" />
                        Comprar plantilla
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          elegirPlantilla(previewPlantilla.id);
                          setPreviewPlantilla(null);
                        }}
                        disabled={isActivePreview || vm.saving}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-950 px-4 py-3 text-sm font-black text-white transition hover:bg-black disabled:opacity-60 dark:bg-white dark:text-gray-950"
                      >
                        <Icon icon={isPurchased || !isPremium ? 'solar:check-circle-bold' : 'solar:unlock-bold'} className="text-lg" />
                        {isActivePreview ? 'Ya está activa' : 'Usar esta plantilla'}
                      </button>
                    )}
                    <a
                      href={getPreviewUrl(previewPlantilla.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-black text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:text-gray-200 dark:hover:bg-slate-800"
                    >
                      <Icon icon="solar:eye-bold" className="text-lg" />
                      Abrir preview completo
                    </a>
                  </div>
                </aside>

                <div className="min-h-[620px] bg-gray-100 p-3 dark:bg-slate-950 sm:p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-bold text-gray-500 shadow-sm dark:bg-slate-900 dark:text-gray-300">
                    <span className="inline-flex items-center gap-2">
                      <Icon icon="solar:monitor-bold" className="text-base text-indigo-500" />
                      Vista escritorio
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Icon icon={formData.slugTienda ? 'solar:box-bold' : 'solar:test-tube-bold'} className="text-base text-emerald-500" />
                      {formData.slugTienda ? 'Con tus productos reales' : 'Con productos demo'}
                    </span>
                  </div>
                  <div className="h-[calc(100%-56px)] min-h-[560px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800">
                    <iframe
                      title={`Preview ${previewPlantilla.label}`}
                      src={getPreviewUrl(previewPlantilla.id)}
                      loading="lazy"
                      className="h-full min-h-[560px] w-full bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
