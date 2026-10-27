/**
 * Lanzamiento destacado — la "portada" que se muestra una sola vez por versión
 * (estilo página de actualización de un juego): unos pocos bloques grandes con
 * imagen y, debajo, el listado de lo nuevo / mejoras / correcciones del periodo,
 * que se toma solo de `NOVEDADES` (no hay que escribirlo dos veces).
 *
 * Para publicar otro lanzamiento: cambia `version`, `desde`, textos e imágenes.
 * Las imágenes van en `public/assets/lanzamiento/`; si alguna falta se dibuja un
 * marcador con el icono, así que se puede publicar sin tenerlas todas.
 */
import { NOVEDADES, type Novedad, type PlanNovedad, type TipoNovedad } from './novedades';

export interface DestacadoLanzamiento {
    /** Slug para el índice lateral. */
    id: string;
    /** Etiqueta corta sobre el título ("NUEVO", "ENVÍOS"). */
    etiqueta: string;
    titulo: string;
    descripcion: string;
    /** Puntos concretos que se ganan con esto. */
    puntos: string[];
    /** Icono (iconify) del marcador cuando no hay imagen y del índice. */
    icono: string;
    /** Ruta pública de la imagen (16:9 recomendado, 1600×900). */
    imagen?: string;
    /** Color de acento del bloque. */
    acento: 'violet' | 'sky' | 'emerald' | 'amber' | 'rose';
    /** Dónde encontrarlo. */
    donde?: string;
    /** Planes donde aplica. Vacío = todos. */
    planes?: PlanNovedad[];
}

/**
 * Bloque de cierre "Próximamente": una portada a pantalla completa (imagen de
 * fondo, texto centrado abajo) que adelanta lo que viene en la siguiente versión.
 */
export interface ProximamenteLanzamiento {
    id: string;
    etiqueta: string;
    titulo: string;
    subtitulo: string;
    /** Puntos cortos de lo que traerá. */
    puntos: string[];
    /** Imagen de fondo panorámica (21:9, 2000×860): personajes al centro/arriba, tercio inferior oscuro para el texto. */
    imagen?: string;
    icono: string;
}

export interface Lanzamiento {
    /** Cambia con cada lanzamiento: es la marca de "ya lo vi". */
    version: string;
    /** Texto pequeño sobre el título. */
    eyebrow: string;
    titulo: string;
    subtitulo: string;
    /** Imagen de fondo del hero (21:9 recomendado, 2000×860). */
    heroImagen?: string;
    /** Novedades desde esta fecha (YYYY-MM-DD) entran en los listados. */
    desde: string;
    destacados: DestacadoLanzamiento[];
    proximamente?: ProximamenteLanzamiento;
}

export const LANZAMIENTO: Lanzamiento = {
    version: '2026-10-27',
    eyebrow: 'Actualización · Octubre 2026',
    titulo: 'Vende más con menos trabajo',
    subtitulo:
        'Un vendedor IA que atiende, cobra y te avisa por WhatsApp, listas de precios para cada tipo de cliente, 19 plantillas nuevas para tu tienda y una caja que cuadra sola. Más de 70 mejoras pedidas por negocios como el tuyo.',
    // Las imágenes de octubre van en public/assets/lanzamiento/2026-10/. Mientras
    // falten se dibuja el marcador con el icono (ver la cabecera de este archivo).
    heroImagen: '/assets/lanzamiento/2026-10/hero.jpg',
    desde: '2026-09-19',
    destacados: [
        {
            id: 'ia-ventas',
            etiqueta: 'Nuevo · IA de Ventas',
            titulo: 'Tu vendedor por WhatsApp que atiende, cobra y te avisa',
            descripcion:
                'La IA responde con tu catálogo real, arma el pedido, cobra y deja todo ordenado en una bandeja y un embudo. Tú entras cuando quieras, desde el panel o desde tu celular.',
            puntos: [
                'Precio y stock en vivo; el pedido queda como nota de venta con tus descuentos y zonas de envío.',
                'Cobra con link de Mercado Pago o lee el voucher que te manda el cliente.',
                'Tomas el chat cuando quieras, mandas notas de voz y sigues usando el WhatsApp Business de tu celular.',
                'Agenda visitas a tu tienda, te dice qué anuncio trajo la venta y te manda el resumen del día a las 9 p. m.',
            ],
            icono: 'solar:chat-round-money-bold-duotone',
            imagen: '/assets/lanzamiento/2026-10/ia-ventas.jpg',
            acento: 'violet',
            donde: 'IA de Ventas → Chats · Mi vendedor',
        },
        {
            id: 'listas-precio',
            etiqueta: 'Nuevo · Ventas',
            titulo: 'Listas de precios y reprecio masivo',
            descripcion:
                'Un precio para llevar, otro en mesa, otro mayorista. Y cuando sube tu costo, cambias cientos de precios en una pasada sin miedo a equivocarte.',
            puntos: [
                'El cajero elige la lista en el POS y el carrito se reprecia solo, por unidad o pack.',
                'La lista cambia sola al elegir un cliente con precio pactado.',
                'Reprecio por monto, por % o fijando la utilidad, con vista previa del antes y el después.',
                'Historial con deshacer: los productos sin costo no se tocan.',
            ],
            icono: 'solar:tag-price-bold-duotone',
            imagen: '/assets/lanzamiento/2026-10/listas-precio.jpg',
            acento: 'emerald',
            donde: 'Kardex → Listas de precio · Reprecio masivo',
        },
        {
            id: 'tienda',
            etiqueta: 'Nuevo · Tienda virtual',
            titulo: '19 plantillas nuevas y tu tienda en Google',
            descripcion:
                'Más estilos para tu rubro, gratis y editables en vivo, y una tienda que se encuentra mejor en Google y se ve bien al compartirla por WhatsApp.',
            puntos: [
                'Florería con "Arma tu ramo", Mostrador de una sola página, Hogar, Canasta y Celulares.',
                'Moda y accesorios: Élan, Esencial, Zapatos, Rosé y cinco de carteras.',
                'Título, foto y descripción por producto para Google, con texto sugerido por la IA.',
                'Talla, color, presentación y video del producto en la ficha.',
            ],
            icono: 'solar:shop-2-bold-duotone',
            imagen: '/assets/lanzamiento/2026-10/tienda.jpg',
            acento: 'sky',
            donde: 'Tienda virtual → Diseño y template',
            planes: ['NEGOCIO', 'CORPORATIVO'],
        },
        {
            id: 'caja-inventario',
            etiqueta: 'Mejora · Caja e inventario',
            titulo: 'Caja que cuadra e inventario que se explica solo',
            descripcion:
                'Cierra cualquier turno, registra lo que entra y sale, y entiende por qué baja tu stock en cada sede.',
            puntos: [
                'Ingresos de caja, turnos de noche hasta 48 horas y arqueo imprimible.',
                'Mermas con motivo, y entradas y salidas de varios productos en un solo documento.',
                'Stock por talla y color, con lo que viene en camino.',
                'Cada sede con su propio costo promedio.',
            ],
            icono: 'solar:safe-square-bold-duotone',
            imagen: '/assets/lanzamiento/2026-10/caja-inventario.jpg',
            acento: 'amber',
            donde: 'Ventas → Caja y bancos · Kardex',
        },
    ],
    proximamente: {
        id: 'canales',
        etiqueta: 'Próximamente',
        titulo: 'Tu vendedor IA en Instagram, Messenger y TikTok',
        subtitulo:
            'La misma IA que hoy vende por WhatsApp va a responder los mensajes y comentarios de Instagram, Messenger y TikTok, todo en la misma bandeja.',
        puntos: [
            'DMs de Instagram y Messenger',
            'Comentarios de Instagram respondidos por privado',
            'Mensajes directos de TikTok',
        ],
        imagen: '/assets/lanzamiento/2026-10/proximamente.jpg',
        icono: 'solar:chat-round-dots-bold-duotone',
    },
};

/** Novedades del periodo del lanzamiento, separadas por tipo (en orden de la lista). */
export const novedadesDelLanzamiento = (): Record<TipoNovedad, Novedad[]> => {
    const base: Record<TipoNovedad, Novedad[]> = { NUEVO: [], MEJORA: [], CORRECCION: [] };
    for (const n of NOVEDADES) {
        if (n.fecha >= LANZAMIENTO.desde) base[n.tipo].push(n);
    }
    return base;
};

const CLAVE_VISTO = 'LANZAMIENTO_VISTO';

/** `true` si el usuario todavía no vio la portada de esta versión. */
export const hayLanzamientoSinVer = (): boolean => {
    try {
        return localStorage.getItem(CLAVE_VISTO) !== LANZAMIENTO.version;
    } catch {
        return false;
    }
};

export const marcarLanzamientoVisto = (): void => {
    try {
        localStorage.setItem(CLAVE_VISTO, LANZAMIENTO.version);
    } catch {
        /* storage bloqueado: se mostrará otra vez, sin más consecuencia */
    }
};
