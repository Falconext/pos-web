/**
 * Banco de preguntas frecuentes del chat de soporte.
 *
 * Responde lo de siempre sin que nadie del equipo tenga que hacerlo y sin IA:
 * la búsqueda es por palabras, en el navegador, y no cuesta nada por consulta.
 * Lo que no se resuelve acá llega al equipo por el chat.
 *
 * Al redactar: el nombre de los botones y menús tal cual se ve en pantalla, y
 * pasos cortos. Si una pregunta llega muchas veces al chat, se agrega acá.
 */

export interface PreguntaSoporte {
    id: string;
    tema: TemaSoporte;
    pregunta: string;
    /** Respuesta corta, en el idioma del negocio. */
    respuesta: string;
    /** Pasos en orden, si hace falta hacer algo. */
    pasos?: string[];
    /** Pantalla donde se hace, para el botón "Ir ahí". */
    ruta?: string;
    /** Otras formas de preguntarlo, para que la búsqueda lo encuentre. */
    claves?: string[];
}

export type TemaSoporte =
    | 'Facturación'
    | 'Ventas y caja'
    | 'Productos'
    | 'Compras'
    | 'Envíos'
    | 'Tienda virtual'
    | 'IA de Ventas'
    | 'Mi cuenta';

export const TEMAS_SOPORTE: TemaSoporte[] = [
    'Facturación',
    'Ventas y caja',
    'Productos',
    'Compras',
    'Envíos',
    'Tienda virtual',
    'IA de Ventas',
    'Mi cuenta',
];

export const PREGUNTAS_SOPORTE: PreguntaSoporte[] = [
    // ── Facturación ──────────────────────────────────────────────────────────
    {
        id: 'emitir-comprobante',
        tema: 'Facturación',
        pregunta: '¿Cómo emito una boleta o factura?',
        respuesta: 'Desde Nuevo comprobante eliges el tipo, el cliente y los productos, y al cobrar se envía sola a SUNAT.',
        pasos: [
            'Entra a Comprobantes y pulsa Nuevo comprobante.',
            'Elige Boleta o Factura (la factura pide el RUC del cliente).',
            'Agrega los productos y pulsa Continuar pago.',
            'Elige el medio de pago y confirma.',
        ],
        ruta: '/administrador/facturacion/nuevo',
        claves: ['emitir', 'vender', 'boleta', 'factura', 'nuevo comprobante', 'facturar'],
    },
    {
        id: 'sunat-rechazo',
        tema: 'Facturación',
        pregunta: 'SUNAT rechazó mi comprobante, ¿qué hago?',
        respuesta: 'Mira el motivo en el menú del comprobante con "Ver error SUNAT", corrige el dato y vuelve a emitirlo. El número del rechazado se reutiliza, así que no queda un hueco en tu serie.',
        pasos: [
            'En Comprobantes, abre el menú ⋮ del comprobante rechazado.',
            'Pulsa "Ver error SUNAT" para ver el motivo.',
            'Corrige el dato (por ejemplo el RUC o la dirección del cliente) y emite de nuevo.',
        ],
        ruta: '/administrador/facturacion/comprobantes',
        claves: ['rechazado', 'rechazo', 'error sunat', 'observado', 'no paso'],
    },
    {
        id: 'sunat-pendiente',
        tema: 'Facturación',
        pregunta: 'Mi comprobante sigue pendiente de SUNAT',
        respuesta: 'Si SUNAT está lenta o caída, el sistema lo reenvía solo cada cierto tiempo: no lo vuelvas a emitir ni lo anules. Si quieres confirmarlo ya, usa "Verificar en SUNAT" en su menú.',
        pasos: [
            'En Comprobantes, abre el menú ⋮ del comprobante.',
            'Pulsa "Verificar en SUNAT" o "Reemitir a SUNAT".',
        ],
        ruta: '/administrador/facturacion/comprobantes',
        claves: ['pendiente', 'no llega', 'sunat caida', 'no envia', 'cdr', 'en proceso'],
    },
    {
        id: 'anular-comprobante',
        tema: 'Facturación',
        pregunta: '¿Cómo anulo una boleta o factura?',
        respuesta: 'Una boleta o factura aceptada por SUNAT no se borra: se anula con una nota de crédito, o con "Dar de Baja" si estás dentro del plazo de SUNAT.',
        pasos: [
            'En Comprobantes, abre el menú ⋮ del comprobante.',
            'Elige "Generar NC (Anular)" para anularlo con nota de crédito.',
            'O "Dar de Baja" si SUNAT todavía lo permite para ese documento.',
        ],
        ruta: '/administrador/facturacion/comprobantes',
        claves: ['anular', 'baja', 'nota de credito', 'cancelar', 'eliminar factura', 'devolver'],
    },
    {
        id: 'nota-venta-a-comprobante',
        tema: 'Facturación',
        pregunta: '¿Cómo paso una nota de venta a boleta o factura?',
        respuesta: 'Desde el menú de la nota de venta la conviertes, sin volver a descontar stock ni a cobrar. Si facturaste solo una parte, el menú te ofrece emitir el saldo.',
        pasos: [
            'Entra a Comprobantes informales (notas de venta).',
            'Abre el menú ⋮ de la nota y elige convertir a Boleta o Factura.',
            'Si son varias notas del mismo cliente, selecciónalas y conviértelas juntas.',
        ],
        ruta: '/administrador/facturacion/comprobantes-informales',
        claves: ['convertir', 'nota de venta', 'nv', 'pasar a factura', 'saldo'],
    },
    {
        id: 'guia-remision',
        tema: 'Facturación',
        pregunta: '¿Cómo hago una guía de remisión?',
        respuesta: 'Puedes crearla desde cero en Guías de remisión, o desde una factura con "Generar Guía de Remisión" en su menú, que ya trae el cliente y los productos.',
        ruta: '/administrador/facturacion/guia-remision',
        claves: ['guia', 'remision', 'traslado', 'transportista', 'gre'],
    },
    {
        id: 'enviar-comprobante-cliente',
        tema: 'Facturación',
        pregunta: '¿Cómo le mando el comprobante al cliente?',
        respuesta: 'En el menú del comprobante tienes "Enviar WhatsApp" y "Enviar Email". También puedes descargar el PDF, el XML y el CDR.',
        ruta: '/administrador/facturacion/comprobantes',
        claves: ['enviar', 'whatsapp', 'correo', 'email', 'pdf', 'xml', 'cdr', 'descargar'],
    },
    {
        id: 'cotizacion',
        tema: 'Facturación',
        pregunta: '¿Cómo hago una cotización?',
        respuesta: 'En Cotizaciones creas la cotización y la mandas en PDF por WhatsApp. Cuando el cliente acepta, la conviertes en boleta, factura o nota de venta.',
        ruta: '/administrador/facturacion/cotizaciones',
        claves: ['cotizar', 'proforma', 'presupuesto'],
    },
    {
        id: 'retencion',
        tema: 'Facturación',
        pregunta: 'Mi cliente es agente de retención',
        respuesta: 'Márcalo en la ficha del cliente como agente de retención del IGV. La retención del 3% se aplica sola en sus facturas mayores a S/ 700.',
        ruta: '/administrador/clientes',
        claves: ['retencion', '3%', 'agente'],
    },

    // ── Ventas y caja ────────────────────────────────────────────────────────
    {
        id: 'abrir-cerrar-caja',
        tema: 'Ventas y caja',
        pregunta: '¿Cómo abro y cierro la caja?',
        respuesta: 'En Caja abres el turno con el fondo inicial y al final lo cierras contando el dinero. El sistema te muestra el esperado y la diferencia, y puedes imprimir el arqueo.',
        ruta: '/administrador/ventas/caja',
        claves: ['caja', 'turno', 'arqueo', 'cuadre', 'cierre', 'apertura'],
    },
    {
        id: 'caja-no-cuadra',
        tema: 'Ventas y caja',
        pregunta: 'Mi caja no cuadra',
        respuesta: 'Casi siempre es un pago registrado con otro medio (por ejemplo Yape marcado como efectivo) o un gasto o ingreso que no se anotó. Revisa los movimientos del turno por medio de pago.',
        pasos: [
            'Abre el detalle del turno en Caja.',
            'Compara cada medio de pago con lo que tienes (efectivo, Yape, tarjeta).',
            'Registra el gasto o el ingreso de caja que falte.',
        ],
        ruta: '/administrador/ventas/caja',
        claves: ['descuadre', 'diferencia', 'falta dinero', 'sobra'],
    },
    {
        id: 'credito-cuentas-cobrar',
        tema: 'Ventas y caja',
        pregunta: '¿Cómo vendo al crédito y cobro después?',
        respuesta: 'Al emitir eliges la forma de pago Crédito (puedes registrar un pago inicial). Lo pendiente queda en Cuentas por cobrar, donde registras cada abono.',
        ruta: '/administrador/ventas/pagos/cuentas-cobrar',
        claves: ['credito', 'deuda', 'abono', 'cuentas por cobrar', 'pago pendiente'],
    },
    {
        id: 'usuarios-permisos',
        tema: 'Ventas y caja',
        pregunta: '¿Cómo creo un usuario para mi vendedor o cajera?',
        respuesta: 'En Usuarios creas el acceso y eliges qué módulos puede ver. También puedes impedir que cree o borre productos.',
        ruta: '/administrador/usuarios',
        claves: ['usuario', 'vendedor', 'cajera', 'permiso', 'acceso', 'empleado'],
    },
    {
        id: 'listas-precio',
        tema: 'Ventas y caja',
        pregunta: '¿Puedo tener precios distintos (mayorista, mesa, llevar)?',
        respuesta: 'Sí, con Listas de precio. El cajero elige la lista al cobrar, y si el cliente tiene una lista asignada se aplica sola.',
        ruta: '/administrador/listas-precio',
        claves: ['mayorista', 'precio especial', 'lista de precios', 'por mayor'],
    },

    // ── Productos ────────────────────────────────────────────────────────────
    {
        id: 'importar-productos',
        tema: 'Productos',
        pregunta: '¿Cómo cargo mis productos desde Excel?',
        respuesta: 'En Kardex → Productos descarga la plantilla de Excel, llénala con tus productos y súbela. Verás una vista previa antes de guardar.',
        ruta: '/administrador/kardex/productos',
        claves: ['importar', 'excel', 'cargar', 'masivo', 'plantilla'],
    },
    {
        id: 'ajustar-stock',
        tema: 'Productos',
        pregunta: 'El stock no coincide, ¿cómo lo corrijo?',
        respuesta: 'Ajusta el stock del producto indicando el motivo (merma, conteo, regalo). Queda registrado en el kardex y en Mermas, así sabes por qué cambió.',
        ruta: '/administrador/kardex/productos',
        claves: ['stock', 'inventario', 'ajuste', 'merma', 'no coincide', 'conteo'],
    },
    {
        id: 'traslados-sedes',
        tema: 'Productos',
        pregunta: '¿Cómo paso mercadería de una sede a otra?',
        respuesta: 'Con un traslado en Kardex: eliges la sede que envía, la que recibe y los productos. El stock baja en una y sube en la otra.',
        ruta: '/administrador/kardex/traslados',
        claves: ['traslado', 'sede', 'almacen', 'mover stock', 'transferir'],
    },
    {
        id: 'variantes',
        tema: 'Productos',
        pregunta: '¿Cómo registro tallas y colores?',
        respuesta: 'En la ficha del producto agregas variantes (talla, color) con su propio stock. El inventario te muestra el desglose por talla y color.',
        ruta: '/administrador/kardex/productos',
        claves: ['talla', 'color', 'variante', 'modelo'],
    },
    {
        id: 'codigo-barras',
        tema: 'Productos',
        pregunta: '¿Puedo vender con lector de código de barras?',
        respuesta: 'Sí. Registra el código de barras en la ficha del producto (puede tener varios) y en el POS escanea: el producto entra solo al carrito.',
        ruta: '/administrador/kardex/productos',
        claves: ['codigo de barras', 'lector', 'escanear', 'ean'],
    },

    // ── Compras ──────────────────────────────────────────────────────────────
    {
        id: 'registrar-compra',
        tema: 'Compras',
        pregunta: '¿Cómo registro una compra a mi proveedor?',
        respuesta: 'En Compras registras el documento del proveedor con sus productos: el stock sube y el costo se actualiza. También puedes subir una foto de la factura o importar desde Excel.',
        ruta: '/administrador/compras',
        claves: ['compra', 'proveedor', 'mercaderia', 'factura de compra', 'ingreso'],
    },
    {
        id: 'orden-compra',
        tema: 'Compras',
        pregunta: '¿Cómo le hago un pedido al proveedor?',
        respuesta: 'Con una Orden de compra: la mandas en PDF y, cuando llega la mercadería, la recibes y se convierte en compra.',
        ruta: '/administrador/compras/ordenes',
        claves: ['orden de compra', 'pedido proveedor', 'oc'],
    },

    // ── Envíos ───────────────────────────────────────────────────────────────
    {
        id: 'envio-shalom',
        tema: 'Envíos',
        pregunta: '¿Cómo envío un pedido por Shalom u Olva?',
        respuesta: 'Desde el Panel de ventas coordinas el envío de la venta: eliges el courier y la agencia, y si tienes Shalom Pro conectado se genera la guía.',
        pasos: [
            'Entra a Ventas → Panel de ventas.',
            'En la venta, abre Editar despacho o Coordinar envío.',
            'Elige courier, agencia destino y los datos del destinatario.',
        ],
        ruta: '/administrador/ventas',
        claves: ['shalom', 'olva', 'envio', 'despacho', 'courier', 'agencia', 'provincia'],
    },
    {
        id: 'rotulos',
        tema: 'Envíos',
        pregunta: '¿Cómo imprimo los rótulos de los paquetes?',
        respuesta: 'En el Panel de ventas, el botón "Rótulos" imprime los de todos los despachos que estás viendo, uno por página.',
        ruta: '/administrador/ventas',
        claves: ['rotulo', 'etiqueta', 'imprimir paquete'],
    },

    // ── Tienda virtual ───────────────────────────────────────────────────────
    {
        id: 'tienda-diseno',
        tema: 'Tienda virtual',
        pregunta: '¿Cómo cambio el diseño de mi tienda virtual?',
        respuesta: 'En Tienda virtual → Diseño y template eliges la plantilla y la editas en vivo: logo, colores, banners y categorías.',
        ruta: '/administrador/tienda/template',
        claves: ['tienda', 'plantilla', 'diseño', 'web', 'banner', 'logo'],
    },
    {
        id: 'tienda-pedidos',
        tema: 'Tienda virtual',
        pregunta: '¿Dónde veo los pedidos de mi tienda virtual?',
        respuesta: 'En Tienda virtual → Pedidos, y también en el Panel de ventas. Desde ahí lo marcas como pagado, le escribes al cliente y haces su boleta o factura.',
        ruta: '/administrador/tienda/pedidos',
        claves: ['pedido tienda', 'pedidos web', 'compra online'],
    },
    {
        id: 'mercado-pago',
        tema: 'Tienda virtual',
        pregunta: '¿Cómo cobro con tarjeta o Yape en mi tienda?',
        respuesta: 'Conecta tu cuenta de Mercado Pago desde tu perfil. La plata cae en tu cuenta y el pedido se confirma solo cuando el pago se aprueba.',
        ruta: '/administrador/perfil',
        claves: ['mercado pago', 'tarjeta', 'yape', 'pasarela', 'cobrar online'],
    },

    // ── IA de Ventas ─────────────────────────────────────────────────────────
    {
        id: 'ia-conectar-whatsapp',
        tema: 'IA de Ventas',
        pregunta: '¿Cómo conecto mi WhatsApp a la IA de Ventas?',
        respuesta: 'Desde tu perfil, con el botón de WhatsApp. Si quieres seguir usando el WhatsApp Business de tu celular, usa "Usar el WhatsApp Business de mi celular".',
        ruta: '/administrador/perfil',
        claves: ['whatsapp', 'conectar', 'numero', 'bot', 'meta'],
    },
    {
        id: 'ia-pausar',
        tema: 'IA de Ventas',
        pregunta: '¿Cómo hago para que la IA deje de responder un chat?',
        respuesta: 'En el chat pulsa "Tomar chat": la IA se calla en esa conversación. Cuando termines, "Devolver a la IA". Si respondes a mano, la IA se pausa sola unas horas.',
        ruta: '/administrador/leads',
        claves: ['pausar', 'tomar chat', 'apagar ia', 'callar', 'responder yo'],
    },
    {
        id: 'ia-ensenar',
        tema: 'IA de Ventas',
        pregunta: 'La IA respondió algo mal, ¿cómo la corrijo?',
        respuesta: 'En Mi vendedor agrega la información o la regla que le faltó (precios, envíos, formas de pago). La IA responde con lo que tiene ahí y con tu catálogo.',
        ruta: '/administrador/leads',
        claves: ['respondio mal', 'enseñar', 'corregir ia', 'mi vendedor', 'configurar ia'],
    },

    // ── Mi cuenta ────────────────────────────────────────────────────────────
    {
        id: 'mi-plan',
        tema: 'Mi cuenta',
        pregunta: '¿Hasta cuándo tengo el sistema y cómo pago?',
        respuesta: 'En Mi plan ves tu vencimiento, lo pendiente y tu historial de pagos. Si estás por vencer, ahí mismo tienes el botón para coordinar el pago.',
        ruta: '/administrador/mi-plan',
        claves: ['plan', 'pagar', 'mensualidad', 'vence', 'renovar', 'suscripcion'],
    },
    {
        id: 'logo-datos-empresa',
        tema: 'Mi cuenta',
        pregunta: '¿Cómo cambio el logo o los datos que salen en mis comprobantes?',
        respuesta: 'En tu Perfil actualizas el logo, la dirección, el teléfono y los datos que se imprimen en tus comprobantes.',
        ruta: '/administrador/perfil',
        claves: ['logo', 'direccion', 'datos empresa', 'perfil', 'ticket'],
    },
    {
        id: 'nueva-funcion',
        tema: 'Mi cuenta',
        pregunta: 'Quiero pedir una mejora o una función nueva',
        respuesta: 'Escríbenos por este chat con lo que necesitas y un ejemplo. Lo que pidas se sube al cierre del día o, como máximo, la noche siguiente.',
        claves: ['mejora', 'funcion nueva', 'sugerencia', 'pedido', 'agregar'],
    },
];

/** Minúsculas, sin tildes y sin signos: como escribe la gente. */
const normalizar = (t: string) =>
    t
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9ñ%\s]/g, ' ');

/** Palabras que aparecen en casi toda pregunta y no ayudan a encontrar nada. */
const VACIAS = new Set([
    'como', 'que', 'cual', 'donde', 'para', 'por', 'con', 'una', 'uno', 'los', 'las', 'del',
    'mis', 'tengo', 'quiero', 'puedo', 'hago', 'hacer', 'esta', 'este', 'sale', 'sistema',
    'hola', 'buenas', 'buenos', 'dias', 'tardes', 'noches', 'ayuda', 'favor', 'porfavor',
]);

/** Raíz corta: "facturas" y "facturación" cuentan igual. */
const raiz = (p: string) => p.slice(0, Math.max(4, Math.min(p.length, 6)));

const palabras = (t: string) =>
    [...new Set(normalizar(t).split(/\s+/).filter((p) => p.length >= 3 && !VACIAS.has(p)))];

/**
 * Las preguntas que mejor calzan con lo que escribió, de la más a la menos
 * parecida. Pesa más la palabra que está en la pregunta o en sus claves que la
 * que solo aparece en la respuesta.
 */
export function buscarPreguntas(texto: string, max = 5): PreguntaSoporte[] {
    const buscadas = palabras(texto).map(raiz);
    if (!buscadas.length) return [];
    const puntuadas = PREGUNTAS_SOPORTE.map((p) => {
        const titulo = palabras(`${p.pregunta} ${(p.claves ?? []).join(' ')}`).map(raiz);
        const cuerpo = palabras(`${p.respuesta} ${(p.pasos ?? []).join(' ')}`).map(raiz);
        let puntos = 0;
        for (const b of buscadas) {
            if (titulo.includes(b)) puntos += 3;
            else if (cuerpo.includes(b)) puntos += 1;
        }
        return { p, puntos };
    });
    return puntuadas
        .filter((x) => x.puntos >= 3)
        .sort((a, b) => b.puntos - a.puntos)
        .slice(0, max)
        .map((x) => x.p);
}
