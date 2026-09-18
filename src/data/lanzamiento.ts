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
    version: '2026-09-18',
    eyebrow: 'Actualización · Septiembre 2026',
    titulo: 'Cobra, envía y controla mejor',
    subtitulo:
        'Mercado Pago en tu tienda virtual, envíos por Shalom y Olva sin fricción, compras desde Excel y decenas de mejoras pedidas por negocios como el tuyo.',
    heroImagen: '/assets/lanzamiento/hero.jpg',
    desde: '2026-09-01',
    destacados: [
        {
            id: 'mercado-pago',
            etiqueta: 'Nuevo · Tienda virtual',
            titulo: 'Mercado Pago en tu tienda virtual',
            descripcion:
                'Tus clientes pagan con tarjeta, Yape o su billetera de Mercado Pago sin salir de tu tienda. Conectas tu propia cuenta en un clic, la plata cae directo en ella y el pedido se confirma solo cuando el pago está aprobado.',
            puntos: [
                'Tarjetas de crédito y débito, Yape y saldo de Mercado Pago.',
                'La plata va a TU cuenta de Mercado Pago, no pasa por nadie más.',
                'El pedido pasa a Confirmado solo, sin que revises vouchers.',
                'Pagos desde S/ 5. Krezka cobra S/ 1 por cada pago aprobado.',
            ],
            icono: 'solar:card-transfer-bold-duotone',
            imagen: '/assets/lanzamiento/mercado-pago.jpg',
            acento: 'sky',
            donde: 'Perfil → Medios de pago → Conectar Mercado Pago',
            planes: ['NEGOCIO', 'CORPORATIVO'],
        },
        {
            id: 'app-movil',
            etiqueta: 'App · Android y iPhone',
            titulo: 'Krezka en tu celular',
            descripcion:
                'La app de Krezka ya está en Google Play y en App Store. Vende, cotiza y consulta tu stock desde el celular; lo que registras en la app cae en la misma caja y en los mismos reportes que el panel web.',
            puntos: [
                'Ventas y cotizaciones desde el celular, con PDF para enviar por WhatsApp.',
                'Las ventas de la app cuentan en tu caja y en tus reportes al instante.',
                'Productos con variantes, precios y stock actualizados.',
                'Búscala como "Krezka" en Google Play y App Store.',
            ],
            icono: 'solar:smartphone-bold-duotone',
            imagen: '/assets/lanzamiento/app-movil.jpg',
            acento: 'amber',
            donde: 'Google Play · App Store',
        },
        {
            id: 'shalom',
            etiqueta: 'Envíos · Shalom y Olva',
            titulo: 'Del pedido a la agencia sin salir del panel',
            descripcion:
                'Genera la guía de Shalom desde la venta, imprime los rótulos de todos los despachos del día de una vez y completa el DNI del cliente con RENIEC cuando lo registraste solo con su WhatsApp.',
            puntos: [
                'Guía de Shalom con N° de orden y clave de retiro propia por envío.',
                'Botón "Rótulos": todos los despachos en Preparando, uno por página.',
                'Cliente solo con WhatsApp → ingresas el DNI y el nombre viene de RENIEC.',
                'Tablero de couriers con mapa del Perú y rastreo con avisos.',
            ],
            icono: 'solar:box-bold-duotone',
            imagen: '/assets/lanzamiento/shalom.jpg',
            acento: 'violet',
            donde: 'Ventas → Panel de ventas → Editar despacho / Rótulos',
            planes: ['NEGOCIO', 'CORPORATIVO'],
        },
        {
            id: 'compras',
            etiqueta: 'Compras e inventario',
            titulo: 'Compras desde Excel y stock por sede',
            descripcion:
                'Descarga la plantilla con tu catálogo y el stock de cada sede, llénala con la compra y súbela: costos, kardex y cuenta por pagar quedan listos. Si tienes varias sedes, reparte la misma compra entre ellas.',
            puntos: [
                'Una compra por proveedor y documento, con vista previa antes de guardar.',
                '"Distribuir" una compra entre sedes en un solo documento.',
                'Stock por cajas y códigos por presentación.',
                'Conciliación bancaria exportable a Excel y PDF.',
            ],
            icono: 'solar:cart-large-4-bold-duotone',
            imagen: '/assets/lanzamiento/compras.jpg',
            acento: 'emerald',
            donde: 'Compras → Importar desde Excel',
        },
    ],
    proximamente: {
        id: 'soporte',
        etiqueta: 'Próximamente',
        titulo: 'Niky te responde',
        subtitulo:
            'Soporte en vivo desde tu panel: escríbenos por el chat y el equipo de Krezka te contesta ahí mismo, sin WhatsApp ni correos. Dudas, incidencias y pedidos de mejoras, con historial y sin salir del sistema.',
        puntos: [
            'Chat de soporte dentro del panel',
            'Historial de tus conversaciones',
            'Respuestas del equipo Krezka en horario de atención',
        ],
        imagen: '/assets/lanzamiento/soporte.jpg',
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
