/**
 * Novedades del sistema — lo que ve el empresario en /administrador/novedades.
 *
 * Es un catálogo curado a mano, no un volcado del historial de git: cada entrada
 * está redactada en el idioma del negocio ("genera la guía sola al cerrar la
 * venta") y no en el del código. Al publicar una versión, agrega aquí lo que el
 * cliente realmente nota; los arreglos internos no van.
 *
 * `planes` debe reflejar el gate REAL del código (no lo que nos gustaría vender):
 * si dudas de dónde está limitada una función, márcala como 'TODOS' antes que
 * prometer algo que el plan del cliente no le va a dar.
 */

export type PlanNovedad = 'EMPRENDEDOR' | 'NEGOCIO' | 'CORPORATIVO';

/** Dónde está disponible la función. Todo lo que listamos existe en web. */
export type Plataforma = 'WEB' | 'MOVIL';

/**
 * Madurez de la función:
 *  - `DISPONIBLE` (por defecto): publicada y estable.
 *  - `BETA`: ya se puede usar, pero recién sale y puede cambiar.
 *  - `PROXIMAMENTE`: anunciada pero todavía no habilitada para los clientes.
 */
export type EstadoNovedad = 'DISPONIBLE' | 'BETA' | 'PROXIMAMENTE';

/** Etiqueta del tipo de cambio, para el color del chip. */
export type TipoNovedad = 'NUEVO' | 'MEJORA' | 'CORRECCION';

export interface Novedad {
    /** Slug estable: se usa para recordar hasta dónde leyó el usuario. */
    id: string;
    /** Fecha de publicación (YYYY-MM-DD). */
    fecha: string;
    titulo: string;
    /** Qué gana el negocio con esto, en una o dos frases. */
    descripcion: string;
    categoria: string;
    tipo: TipoNovedad;
    /** Planes donde la función está disponible. Vacío = todos los planes. */
    planes?: PlanNovedad[];
    /** Dónde encontrarlo en el sistema. */
    donde?: string;
    /** Condición extra que no es de plan (p. ej. un módulo contratado aparte). */
    nota?: string;
    /**
     * Plataformas donde funciona. Omitirlo significa SOLO WEB (el caso más
     * común: casi todo sale primero en el panel). Marca 'MOVIL' únicamente si
     * lo verificaste en el código de `falconext-mype-mobile` — prometer una
     * función que la app no tiene es peor que no mencionarla.
     */
    plataformas?: Plataforma[];
    /** Madurez. Omitirlo = `DISPONIBLE`. */
    estado?: EstadoNovedad;
}

export const TODOS_LOS_PLANES: PlanNovedad[] = ['EMPRENDEDOR', 'NEGOCIO', 'CORPORATIVO'];

/** Novedades ordenadas de la más reciente a la más antigua. */
export const NOVEDADES: Novedad[] = [
    // ── Octubre 2026 (19-09 → 26-10) ────────────────────────────────────────
    {
        id: '2026-10-tienda-envio-agencia',
        fecha: '2026-10-29',
        titulo: 'Tu tienda virtual ya ofrece recojo en agencia Shalom u Olva',
        descripcion:
            'Tu cliente elige en el checkout la agencia donde recoge y deja su DNI. El pedido te llega con todo eso y con un clic lo pasas a nota de venta con el envío ya armado, aunque todavía no te haya pagado.',
        categoria: 'Tienda virtual',
        tipo: 'NUEVO',
        donde: 'Tienda virtual → Configuración → Envío por agencia · Tienda virtual → Pedidos → NV',
        nota: 'Viene apagado: marca Shalom y/o Olva en la configuración de envío de tu tienda.',
    },
    {
        id: '2026-10-ia-puntaje-derivacion',
        fecha: '2026-10-29',
        titulo: 'Puntaje de tu vendedor IA y cuándo pasa el chat a tu equipo',
        descripcion:
            'Ves de 0 a 100 qué tan listo está tu vendedor, con lo que le falta y un botón para completarlo. Y eliges con casillas en qué casos te pasa el chat (reclamos, mayoristas, cancelaciones…) y cuáles resuelve solo.',
        categoria: 'IA de Ventas',
        tipo: 'NUEVO',
        donde: 'IA de Ventas → Mi vendedor',
        nota: 'Requiere el módulo IA de Ventas contratado.',
    },
    {
        id: '2026-10-ia-menu-bienvenida',
        fecha: '2026-10-29',
        titulo: 'Menú de bienvenida con botones en WhatsApp',
        descripcion:
            'Tu saludo sale exacto, con preguntas que el cliente responde tocando un botón (qué busca, dónde compra, su rubro). Después sigue tu vendedor sabiendo lo que eligió, o pasa el chat a una persona si así lo marcaste.',
        categoria: 'IA de Ventas',
        tipo: 'NUEVO',
        donde: 'IA de Ventas → Mi vendedor → Personalidad → Menú de bienvenida',
        nota: 'Requiere el módulo IA de Ventas contratado. Viene apagado. En Instagram y Messenger las opciones salen numeradas.',
    },
    {
        id: '2026-10-whatsapp-coexistencia',
        fecha: '2026-10-26',
        titulo: 'Sigue usando el WhatsApp Business de tu celular mientras la IA responde',
        descripcion:
            'Conectas tu número sin perder la app del teléfono: lo que contestas desde el celular aparece en el chat del panel y la IA se calla 2 horas en esa conversación para no pisarte. Ideal para anuncios de TikTok que llevan directo a tu WhatsApp.',
        categoria: 'IA de Ventas',
        tipo: 'NUEVO',
        donde: 'Perfil → Configuración → WhatsApp → Usar el WhatsApp Business de mi celular',
        nota: 'Requiere el módulo IA de Ventas contratado. En la app se desactivan las listas de difusión y WhatsApp para Windows.',
        estado: 'BETA',
    },
    {
        id: '2026-10-ia-visitas-tienda',
        fecha: '2026-10-26',
        titulo: 'La IA agenda visitas a tu tienda y recuerda la víspera',
        descripcion:
            'Cuando el cliente dice "voy a ir", la IA agenda la visita, le manda la ubicación, la foto de la fachada y cómo llegar, y le recuerda un día antes. En Visitas marcas si vino o no.',
        categoria: 'IA de Ventas',
        tipo: 'NUEVO',
        donde: 'IA de Ventas → Visitas · Mi vendedor → Entrega → Tu tienda física',
        nota: 'Requiere el módulo IA de Ventas contratado.',
    },
    {
        id: '2026-10-ia-despedida',
        fecha: '2026-10-26',
        titulo: 'Mensaje de despedida al cerrar la conversación',
        descripcion:
            'Escribes cómo se despide tu negocio y sale al cerrar la venta, cuando el cliente lo va a pensar o cuando deja de responder.',
        categoria: 'IA de Ventas',
        tipo: 'NUEVO',
        donde: 'IA de Ventas → Mi vendedor',
        nota: 'Requiere el módulo IA de Ventas contratado. Viene apagado.',
    },
    {
        id: '2026-10-ir-al-chat-cliente',
        fecha: '2026-10-26',
        titulo: 'Abre el chat del cliente desde la venta, el embudo o un aviso',
        descripcion:
            '"Ver chat del cliente" en el menú de cada comprobante y nota de venta, botón Chat en el embudo y en la ficha, y los avisos de la campana te llevan directo a la conversación.',
        categoria: 'IA de Ventas',
        tipo: 'MEJORA',
        donde: 'Comprobantes / Notas de venta → menú · IA de Ventas → Embudo',
        nota: 'Requiere el módulo IA de Ventas contratado.',
    },
    {
        id: '2026-10-saldo-nota-a-factura',
        fecha: '2026-10-26',
        titulo: 'Emite lo que faltó de una nota de venta facturada en parte',
        descripcion:
            'Si de una nota facturaste solo algunos productos, su menú muestra cuánto falta y ofrece "Saldo a Factura" o "Saldo a Boleta": el POS abre con lo pendiente, sin descontar stock ni cobrar dos veces.',
        categoria: 'Facturación',
        tipo: 'NUEVO',
        donde: 'Comprobantes → Notas de venta → menú de la nota',
    },
    {
        id: '2026-10-guia-rechazo-correlativo',
        fecha: '2026-10-26',
        titulo: 'Guía de remisión: el rechazo de SUNAT se ve claro y el número no se pierde',
        descripcion:
            'Si SUNAT rechaza la guía ves un aviso rojo con el motivo y la lista muestra su estado real. Editarla ya no le cambia el correlativo.',
        categoria: 'Facturación',
        tipo: 'CORRECCION',
        donde: 'Comprobantes → Guías de remisión',
    },
    {
        id: '2026-10-reprecio-masivo',
        fecha: '2026-10-25',
        titulo: 'Reprecio masivo: cambia los precios de toda una lista de una vez',
        descripcion:
            'Sube, baja o fija la utilidad sobre el costo, por monto o por porcentaje. Ves el antes y el después de cada producto (packs incluidos) antes de guardar, y todo queda en un historial que puedes deshacer.',
        categoria: 'Productos',
        tipo: 'NUEVO',
        donde: 'Kardex → Reprecio masivo',
        nota: 'Solo el administrador de la empresa.',
    },
    {
        id: '2026-10-plantillas-tienda',
        fecha: '2026-10-25',
        titulo: '19 plantillas nuevas para tu tienda virtual',
        descripcion:
            'Florería con "Arma tu ramo", Mostrador (una sola página directo al catálogo), Hogar, Canasta, Celulares, Esencial, Farmacia, Zapatos, Retail, Mueblería, Mascotas, Moda elegante, Maquillaje, Bolsos y cinco de carteras (Maison, Verena, Kartera, Olmo y Amora). Todas gratis y editables en vivo.',
        categoria: 'Tienda virtual',
        tipo: 'NUEVO',
        planes: ['NEGOCIO', 'CORPORATIVO'],
        donde: 'Tienda virtual → Diseño y template',
        nota: 'Cada plantilla aparece según el rubro de tu empresa.',
    },
    {
        id: '2026-10-rotulo-sin-clave',
        fecha: '2026-10-24',
        titulo: 'La clave de retiro de Shalom ya no se imprime en el rótulo',
        descripcion:
            'Con la clave a la vista en el paquete cualquiera podía retirarlo: ahora solo le llega al cliente por WhatsApp. Si la quieres en el rótulo, hay una casilla para volver a ponerla.',
        categoria: 'Envíos',
        tipo: 'MEJORA',
        planes: ['CORPORATIVO'],
        donde: 'Perfil → Configuración → Crear guías en Shalom Pro',
    },
    {
        id: '2026-10-pago-segun-repartidor',
        fecha: '2026-10-24',
        titulo: 'El aviso "pedido en camino" dice cómo pagarle al repartidor',
        descripcion:
            'Configuras qué formas de pago acepta tu repartidor propio y cuáles uno contratado, y el WhatsApp de "en camino" le dice al cliente cuánto pagar y cómo.',
        categoria: 'Envíos',
        tipo: 'NUEVO',
        planes: ['CORPORATIVO'],
        donde: 'Perfil → Configuración → Automatización de despacho → Cómo pagar al repartidor',
        nota: 'Necesita tu WhatsApp conectado.',
    },
    {
        id: '2026-10-recordatorio-recojo-agencia',
        fecha: '2026-10-23',
        titulo: 'Recordatorio automático para recoger el pedido en la agencia',
        descripcion:
            'Mientras el paquete siga en la agencia de Shalom u Olva, el cliente recibe un WhatsApp al día (de 1 a 7 días, tú eliges) con el saldo si falta pagar. Se corta cuando lo recoge o responde.',
        categoria: 'Envíos',
        tipo: 'NUEVO',
        planes: ['CORPORATIVO'],
        donde: 'Perfil → Configuración → Automatización de despacho',
        nota: 'Viene apagado. Necesita el rastreo automático y tu WhatsApp conectado. Meta cobra cada mensaje a tu cuenta.',
    },
    {
        id: '2026-10-mi-vendedor',
        fecha: '2026-10-22',
        titulo: '"Mi vendedor": configura tu vendedor IA en una sola pantalla',
        descripcion:
            'Personalidad, conocimiento, entrega, pagos y ajustes ordenados por pestañas. El módulo tiene su propio menú: Chats, Embudo, Visitas, Analítica, Avisos y Mi vendedor.',
        categoria: 'IA de Ventas',
        tipo: 'NUEVO',
        donde: 'IA de Ventas → Mi vendedor',
        nota: 'Requiere el módulo IA de Ventas contratado.',
    },
    {
        id: '2026-10-reporte-diario-whatsapp',
        fecha: '2026-10-22',
        titulo: 'Resumen del día por WhatsApp a las 9 p. m.',
        descripcion:
            'Si lo activas, cada noche te llega por WhatsApp lo que se vendió en el día. Un botón te manda el de hoy para probarlo.',
        categoria: 'IA de Ventas',
        tipo: 'NUEVO',
        donde: 'IA de Ventas → Mi vendedor → Ajustes → Reporte diario',
        nota: 'Requiere el módulo IA de Ventas contratado. Llega a los administradores con celular registrado.',
    },
    {
        id: '2026-10-anuncio-trajo-venta',
        fecha: '2026-10-22',
        titulo: 'Qué anuncio de Facebook o Instagram te trajo cada venta',
        descripcion:
            'El chat marca a los clientes que llegaron desde un anuncio y en Analítica ves cuánto vendió cada uno, para saber dónde poner tu presupuesto.',
        categoria: 'IA de Ventas',
        tipo: 'NUEVO',
        donde: 'IA de Ventas → Analítica · chip "Anuncio" en Chats',
        nota: 'Requiere el módulo IA de Ventas contratado.',
    },
    {
        id: '2026-10-recompra-por-producto',
        fecha: '2026-10-22',
        titulo: 'Cada producto dice a los cuántos días se vuelve a comprar',
        descripcion:
            'Pones los días de recompra en la ficha del producto y la IA le escribe al cliente cuando se le está por acabar.',
        categoria: 'IA de Ventas',
        tipo: 'MEJORA',
        donde: 'Productos → ficha → bloque IA de Ventas',
        nota: 'Requiere el módulo IA de Ventas contratado.',
    },
    {
        id: '2026-10-notas-de-voz-imagenes-chat',
        fecha: '2026-10-22',
        titulo: 'Manda notas de voz e imágenes desde el chat del panel',
        descripcion:
            'Grabas un audio y al cliente le llega como nota de voz de WhatsApp, transcrita para la IA. También envías imágenes o pegas una captura.',
        categoria: 'IA de Ventas',
        tipo: 'NUEVO',
        donde: 'IA de Ventas → Chats',
        nota: 'Requiere el módulo IA de Ventas contratado.',
    },
    {
        id: '2026-10-entradas-salidas',
        fecha: '2026-10-22',
        titulo: 'Entradas y salidas de varios productos en un solo documento',
        descripcion:
            'Registras de una vez la mercadería que entra o sale sin ser compra ni venta (inventario inicial, bonificación, consumo, regalo), con su motivo. Queda como documento NE/NS imprimible y en el kardex.',
        categoria: 'Productos',
        tipo: 'NUEVO',
        donde: 'Kardex → Entradas y salidas',
    },
    {
        id: '2026-10-compra-pago-mixto',
        fecha: '2026-10-22',
        titulo: 'Paga una compra con varios medios a la vez',
        descripcion:
            'Una compra al contado se reparte, por ejemplo, una parte en efectivo y otra por Yape o transferencia.',
        categoria: 'Compras',
        tipo: 'MEJORA',
        donde: 'Compras → Nueva compra → Pago mixto',
    },
    {
        id: '2026-10-caja-ingresos-turnos',
        fecha: '2026-10-22',
        titulo: 'Ingresos de caja y turnos que pasan la medianoche',
        descripcion:
            'Registras el dinero que entra a la caja sin ser venta y se suma al esperado del cierre. El turno de noche sigue abierto después de las 12 (hasta 48 horas) y el dueño ve las cajas abiertas de su equipo.',
        categoria: 'Caja',
        tipo: 'MEJORA',
        donde: 'Ventas → Caja y bancos → Ingreso de caja',
    },
    {
        id: '2026-10-kit-quitar-producto',
        fecha: '2026-10-22',
        titulo: 'Quita un producto de un kit solo en esa venta',
        descripcion:
            'Desde el carrito, en "Qué lleva", quitas un componente: el precio baja y el stock descuenta solo lo entregado, sin tocar el kit del catálogo.',
        categoria: 'Ventas',
        tipo: 'NUEVO',
        donde: 'Nuevo comprobante → carrito → kit → Qué lleva',
    },
    {
        id: '2026-10-api-krezka',
        fecha: '2026-10-22',
        titulo: 'Conecta la página web de tu negocio con Krezka',
        descripcion:
            'Tu web muestra tu catálogo, precios y stock al día y puede registrar ventas en Krezka. Las claves se generan en el panel y hay modo de prueba.',
        categoria: 'Integraciones',
        tipo: 'NUEVO',
        donde: 'Perfil → Configuración → Claves API',
        nota: 'Módulo "API de Krezka" contratado aparte. Solo lo ve el administrador.',
    },
    {
        id: '2026-10-guias-shalom-lote',
        fecha: '2026-10-21',
        titulo: 'Genera las guías de Shalom de muchas ventas de una vez',
        descripcion:
            'El botón "Guías Shalom" genera en tanda las guías de los despachos que aún no tienen, muestra el avance, se puede detener y te frena antes si un DNI o celular está mal.',
        categoria: 'Envíos',
        tipo: 'NUEVO',
        planes: ['CORPORATIVO'],
        donde: 'Ventas → Panel de ventas → Guías Shalom',
        nota: 'Requiere tu cuenta Shalom Pro conectada.',
    },
    {
        id: '2026-10-cobro-link-mercadopago-ia',
        fecha: '2026-10-21',
        titulo: 'El vendedor IA cobra con un link de Mercado Pago',
        descripcion:
            'La IA manda el link por el saldo exacto del pedido y, cuando el pago se aprueba, queda validado solo, sin revisar capturas.',
        categoria: 'IA de Ventas',
        tipo: 'NUEVO',
        donde: 'IA de Ventas → Mi vendedor → Ajustes',
        nota: 'Requiere el módulo IA de Ventas contratado. Necesita Mercado Pago conectado. Pago mínimo S/ 5.',
    },
    {
        id: '2026-10-ia-lee-foto-pdf',
        fecha: '2026-10-21',
        titulo: 'El vendedor IA entiende las fotos y los PDF que manda el cliente',
        descripcion:
            'Si el cliente manda la foto de un producto o un PDF, la IA lo lee y responde con lo que tienes. Los vouchers en PDF se abren en el embudo.',
        categoria: 'IA de Ventas',
        tipo: 'MEJORA',
        donde: 'IA de Ventas → Chats',
        nota: 'Requiere el módulo IA de Ventas contratado.',
    },
    {
        id: '2026-10-credito-pago-inicial',
        fecha: '2026-10-21',
        titulo: 'Boleta o factura a crédito con pago inicial',
        descripcion:
            'Registras lo que el cliente paga hoy y el resto queda a crédito, con el envío incluido en el saldo.',
        categoria: 'Facturación',
        tipo: 'NUEVO',
        donde: 'Nuevo comprobante → Crédito',
    },
    {
        id: '2026-10-notas-venta-varias',
        fecha: '2026-10-20',
        titulo: 'Trabaja con varias notas de venta a la vez',
        descripcion:
            'Eliges varias notas del mismo cliente y haces una sola boleta o factura, las cobras juntas, coordinas un solo envío, armas la orden de compra al proveedor o mandas el estado de cuenta por WhatsApp.',
        categoria: 'Ventas',
        tipo: 'NUEVO',
        donde: 'Comprobantes → Notas de venta → seleccionar varias',
    },
    {
        id: '2026-10-packs-alerta-stock',
        fecha: '2026-10-20',
        titulo: 'Packs más vendidos y aviso diario de stock bajo',
        descripcion:
            'En Kits y packs ves qué pack vende más y cuánto deja. Cada mañana te llega la lista de productos por reponer, por correo con Excel o por WhatsApp.',
        categoria: 'Productos',
        tipo: 'NUEVO',
        donde: 'Kardex → Kits y packs · Perfil → Configuración → Alertas de stock bajo',
        nota: 'El aviso por WhatsApp requiere tu número conectado.',
    },
    {
        id: '2026-10-seo-tienda',
        fecha: '2026-10-20',
        titulo: 'Tu tienda aparece mejor en Google y al compartirla por WhatsApp',
        descripcion:
            'Cada tienda y producto sale con su título, foto y descripción, con sitemap y un bloque "Google" con texto sugerido por la IA. Además, la tienda carga más rápido.',
        categoria: 'Tienda virtual',
        tipo: 'NUEVO',
        planes: ['NEGOCIO', 'CORPORATIVO'],
        donde: 'Tienda → Configuración → Google (SEO)',
    },
    {
        id: '2026-10-ia-pedidos-precisos',
        fecha: '2026-10-20',
        titulo: 'El vendedor IA registra pedidos y pagos con menos errores',
        descripcion:
            'La cotización llega tal como la arma el sistema, pide los datos de entrega en un solo mensaje, el envío entra como línea de la nota, un número de operación ya no paga dos pedidos y retoma la conversación si el cliente deja de responder.',
        categoria: 'IA de Ventas',
        tipo: 'MEJORA',
        nota: 'Requiere el módulo IA de Ventas contratado.',
    },
    {
        id: '2026-10-descuento-en-monto',
        fecha: '2026-10-19',
        titulo: 'Descuento por línea en soles, no solo en porcentaje',
        descripcion:
            'Al editar un producto del carrito eliges si el descuento va en % o en monto (S/ o US$).',
        categoria: 'Ventas',
        tipo: 'MEJORA',
        donde: 'Nuevo comprobante → carrito → editar línea',
    },
    {
        id: '2026-10-detalle-item',
        fecha: '2026-10-19',
        titulo: 'Detalle de varias líneas por ítem en cotizaciones y notas',
        descripcion:
            'Cada ítem puede llevar un detalle largo (alcance de un servicio, medidas) que sale en la cotización o nota impresa, no en la boleta ni la factura.',
        categoria: 'Ventas',
        tipo: 'MEJORA',
        donde: 'Nuevo comprobante / Cotización → ítem → Detalle adicional',
    },
    {
        id: '2026-10-costo-por-sede',
        fecha: '2026-10-19',
        titulo: 'Cada sede lleva su propio costo promedio',
        descripcion:
            'Una compra cara en una sede ya no encarece las demás. Los traslados se valorizan al costo de la sede que envía, y el kardex, la rentabilidad y el inventario valorizado usan el costo de cada sede.',
        categoria: 'Productos',
        tipo: 'MEJORA',
        donde: 'Kardex → Productos',
    },
    {
        id: '2026-10-reporte-contable-sire',
        fecha: '2026-10-18',
        titulo: 'El Reporte contable cuadra con el SIRE',
        descripcion:
            'Los rechazados ya no suman pero se listan aparte, también en el Excel; lo exonerado y la exportación van en su columna y lo facturado en dólares se pasa a soles.',
        categoria: 'Contabilidad',
        tipo: 'CORRECCION',
        donde: 'Contabilidad → Reporte → Comprobantes SUNAT',
    },
    {
        id: '2026-10-kardex-filtro-stock',
        fecha: '2026-10-18',
        titulo: 'Filtra productos por stock bajo, sin stock o un rango',
        descripcion:
            'El filtro de stock busca en todo el catálogo, no solo en la página, y el "stock bajo" del dashboard coincide con el del kardex.',
        categoria: 'Productos',
        tipo: 'MEJORA',
        donde: 'Kardex → Productos → filtro Stock',
    },
    {
        id: '2026-10-correcciones-ventas',
        fecha: '2026-10-18',
        titulo: 'Correcciones en ventas y comprobantes',
        descripcion:
            'Al reimprimir un pago mixto vuelve a salir cuánto se pagó en cada medio, editar una nota y pasarla a Boleta o Factura ahora sí emite, editar un comprobante ya no cambia el precio solo y la compra leída por foto ya no queda sin IGV.',
        categoria: 'Ventas',
        tipo: 'CORRECCION',
    },
    {
        id: '2026-10-ia-ventas-vendedor',
        fecha: '2026-10-16',
        titulo: 'Tu vendedor IA registra el pedido y revisa el voucher',
        descripcion:
            'La IA aplica tus descuentos por pack y zonas de envío, registra el pedido como nota de venta y lee la foto del comprobante de pago para que una persona lo valide. Si no puede responder, te avisa.',
        categoria: 'IA de Ventas',
        tipo: 'NUEVO',
        donde: 'IA de Ventas → Chats',
        nota: 'Requiere el módulo IA de Ventas contratado.',
    },
    {
        id: '2026-10-ia-ventas-bandeja',
        fecha: '2026-10-16',
        titulo: 'Bandeja de chats: responde tú o deja que responda la IA',
        descripcion:
            'Tres columnas (chats, conversación y ficha del cliente): escribes a mano, "Tomar chat" pausa la IA en esa conversación y "Devolver a la IA" la reactiva.',
        categoria: 'IA de Ventas',
        tipo: 'MEJORA',
        donde: 'IA de Ventas → Chats',
        nota: 'Requiere el módulo IA de Ventas contratado.',
    },
    {
        id: '2026-10-listas-precio-pos',
        fecha: '2026-10-16',
        titulo: 'Listas de precios: para llevar, en mesa o mayorista',
        descripcion:
            'El cajero elige la lista en el POS y el carrito se reprecia solo, respetando unidad o pack; cambia de lista al elegir un cliente con precio pactado. Asignas listas a clientes, sedes o usuarios, con descuento por lista y precio mínimo y máximo.',
        categoria: 'Ventas',
        tipo: 'NUEVO',
        donde: 'Kardex → Listas de precio · selector en Nuevo comprobante',
        nota: 'El selector aparece si tienes más de una lista.',
    },
    {
        id: '2026-10-mi-plan',
        fecha: '2026-10-15',
        titulo: 'Mi plan: hasta cuándo tienes el sistema y qué ya pagaste',
        descripcion:
            'Ves tu plan, el vencimiento, la mensualidad pendiente y el historial de pagos. Si estás por vencer te avisa con un botón para coordinar el pago por WhatsApp.',
        categoria: 'Cuenta',
        tipo: 'NUEVO',
        donde: 'Menú lateral → Mi plan',
        nota: 'Solo el administrador de la empresa.',
    },
    {
        id: '2026-10-ot-a-nota-venta',
        fecha: '2026-10-14',
        titulo: 'Convierte una orden de trabajo en nota de venta',
        descripcion:
            'Una OT cobrada pasa a nota de venta con un clic, también con saldo pendiente.',
        categoria: 'Facturación',
        tipo: 'MEJORA',
        donde: 'Comprobantes informales → menú de la OT',
    },
    {
        id: '2026-10-orden-compra-cajas',
        fecha: '2026-10-14',
        titulo: 'Pide al proveedor por cajas en la orden de compra',
        descripcion:
            'Pides por caja o paquete, escaneando o desde la lista; al recibir el total cuadra y el PDF sale en cajas.',
        categoria: 'Compras',
        tipo: 'MEJORA',
        donde: 'Compras → Órdenes de compra',
    },
    {
        id: '2026-10-ia-embudo-avisos',
        fecha: '2026-10-13',
        titulo: 'Embudo de ventas, analítica, ficha del cliente y avisos que recuperan ventas',
        descripcion:
            'Las conversaciones avanzan por un embudo que puedes arrastrar, Analítica muestra cuánto vende la IA y la ficha junta historial, pedidos y pagos. Los avisos automáticos (carrito abandonado, pago pendiente, volvió el stock) salen con plantillas aprobadas por Meta.',
        categoria: 'IA de Ventas',
        tipo: 'NUEVO',
        donde: 'IA de Ventas → Embudo / Analítica / Avisos',
        nota: 'Requiere el módulo IA de Ventas contratado.',
    },
    {
        id: '2026-10-correlativos-sunat',
        fecha: '2026-10-13',
        titulo: 'Aviso de correlativos faltantes y numeración sin huecos',
        descripcion:
            'La lista avisa si falta un número en una serie, el número de un rechazo se reutiliza y no deja emitir con fecha anterior a la del comprobante previo.',
        categoria: 'Facturación',
        tipo: 'MEJORA',
        donde: 'Comprobantes',
    },
    {
        id: '2026-10-caja-arqueo',
        fecha: '2026-10-13',
        titulo: 'Imprime el arqueo del turno y cierra turnos olvidados',
        descripcion:
            'Cierras un turno de otro día con su propio esperado; el arqueo imprimible trae el cuadre y separa compras de gastos.',
        categoria: 'Caja',
        tipo: 'MEJORA',
        donde: 'Ventas → Caja',
    },
    {
        id: '2026-10-stock-negativo',
        fecha: '2026-10-13',
        titulo: 'Vende aunque el sistema marque stock cero',
        descripcion:
            'Una opción permite seguir vendiendo cuando el stock del sistema está en cero, para negocios que cargan su inventario después.',
        categoria: 'Productos',
        tipo: 'NUEVO',
        donde: 'Perfil → Configuración → Ventas y caja → Permitir stock negativo',
    },
    {
        id: '2026-10-usuario-sin-alta-productos',
        fecha: '2026-10-13',
        titulo: 'Que la cajera venda pero no cree ni borre productos',
        descripcion:
            'Nuevo permiso por usuario. Además, al crear un usuario te avisa en el acto si el correo ya está ocupado.',
        categoria: 'Usuarios',
        tipo: 'NUEVO',
        donde: 'Usuarios → Editar usuario',
    },
    {
        id: '2026-10-presentacion-carrito',
        fecha: '2026-10-12',
        titulo: 'Cambia la presentación desde la línea del carrito',
        descripcion:
            'Pasas de unidad a pack o caja sin borrar la línea, y el pack se cobra a su precio de pack.',
        categoria: 'Ventas',
        tipo: 'MEJORA',
        donde: 'Nuevo comprobante → carrito',
    },
    {
        id: '2026-10-ia-disponibilidad-producto',
        fecha: '2026-10-10',
        titulo: 'Dile a la IA qué productos priorizar y cuáles van bajo pedido',
        descripcion:
            'En cada producto marcas si la IA debe ofrecerlo primero, venderlo bajo pedido o no ofrecerlo.',
        categoria: 'IA de Ventas',
        tipo: 'NUEVO',
        donde: 'Productos → Editar → Para la IA de Ventas',
        nota: 'Requiere el módulo IA de Ventas contratado.',
    },
    {
        id: '2026-10-tienda-variantes-video',
        fecha: '2026-10-09',
        titulo: 'Tienda virtual: variantes en la ficha, pedidos sin stock y video del producto',
        descripcion:
            'El comprador elige talla, color y presentación y paga ese precio; un interruptor permite pedir productos agotados, y un video de TikTok, YouTube o Instagram se ve en la ficha.',
        categoria: 'Tienda virtual',
        tipo: 'MEJORA',
        planes: ['NEGOCIO', 'CORPORATIVO'],
        donde: 'Tienda → Configuración · Productos → Editar → Video del producto',
    },
    {
        id: '2026-10-clientes-alias',
        fecha: '2026-10-09',
        titulo: 'Busca clientes por su apodo',
        descripcion:
            'Le pones un alias al cliente y lo encuentras así al crear un comprobante.',
        categoria: 'Clientes',
        tipo: 'NUEVO',
        donde: 'Clientes → Editar → Alias',
    },
    {
        id: '2026-10-aviso-sunat-caida',
        fecha: '2026-10-09',
        titulo: 'Aviso cuando SUNAT no está respondiendo',
        descripcion:
            'La lista avisa que SUNAT está caída y que el sistema reenvía solo, así nadie reemite ni anula por error.',
        categoria: 'Facturación',
        tipo: 'MEJORA',
        donde: 'Comprobantes',
    },
    {
        id: '2026-10-envios-reporte-foto',
        fecha: '2026-10-08',
        titulo: 'Reporte de envíos por courier y foto de la entrega',
        descripcion:
            'Estadísticas y Excel por rango de fechas: destinos, envíos por courier, cuánto cobraste y cuánto pagaste. Además subes la foto de la entrega como prueba.',
        categoria: 'Envíos',
        tipo: 'NUEVO',
        planes: ['NEGOCIO', 'CORPORATIVO'],
        donde: 'Ventas → Panel de ventas → Exportar → Reporte de envíos',
    },
    {
        id: '2026-10-panel-ventas-producto',
        fecha: '2026-10-07',
        titulo: 'Panel de ventas: Excel por producto y eliges qué rótulos imprimir',
        descripcion:
            'Exportas el detalle por producto, ves la fecha de envío y el supervisor ya filtra por vendedor.',
        categoria: 'Ventas',
        tipo: 'MEJORA',
        planes: ['NEGOCIO', 'CORPORATIVO'],
        donde: 'Ventas → Panel de ventas → Exportar / Rótulos',
    },
    {
        id: '2026-10-tallas-en-camino',
        fecha: '2026-10-02',
        titulo: 'Stock por talla y color, lo que viene en camino y pedidos por curva de tallas',
        descripcion:
            'Desglose por talla y color en el inventario y en el catálogo PDF, "+N en camino" y "Puedo prometer", y orden de compra por curva de tallas.',
        categoria: 'Productos',
        tipo: 'NUEVO',
        donde: 'Productos → lista · Compras → Órdenes de compra → Curva de tallas',
    },
    {
        id: '2026-10-mermas',
        fecha: '2026-10-02',
        titulo: 'Mermas: cuánto perdiste, en qué y por qué',
        descripcion:
            'Al ajustar el stock se pide el motivo, y la pantalla de Mermas te muestra cuánto se perdió por cada causa.',
        categoria: 'Productos',
        tipo: 'NUEVO',
        donde: 'Kardex → Mermas',
    },
    {
        id: '2026-10-servicio-todos-rubros',
        fecha: '2026-10-02',
        titulo: 'Crea servicios en cualquier rubro',
        descripcion:
            'Delivery, instalación o mano de obra como ítem de tipo Servicio, sin pedir stock.',
        categoria: 'Productos',
        tipo: 'MEJORA',
        donde: 'Productos → Nuevo → Tipo de ítem',
    },
    {
        id: '2026-10-nv-fecha-atras',
        fecha: '2026-10-01',
        titulo: 'Fecha las notas de venta hasta 5 días atrás',
        descripcion:
            'Para registrar ventas que hiciste y no anotaste a tiempo. La factura y la boleta siguen con los plazos de SUNAT.',
        categoria: 'Facturación',
        tipo: 'MEJORA',
        donde: 'Nuevo comprobante → Fecha de emisión',
    },
    {
        id: '2026-09-retencion-por-cliente',
        fecha: '2026-09-30',
        titulo: 'Retención del 3% marcada en el cliente agente de retención',
        descripcion:
            'Solo aplica a facturas mayores a S/ 700 y el PDF muestra lo retenido.',
        categoria: 'Facturación',
        tipo: 'MEJORA',
        donde: 'Clientes → ficha → Agente de retención del IGV',
    },
    {
        id: '2026-09-producto-desactivado-pos',
        fecha: '2026-09-30',
        titulo: 'Desactivar un producto ahora sí lo saca del punto de venta',
        descripcion:
            'Y la casilla "Permite vender" por sede vuelve a funcionar.',
        categoria: 'Productos',
        tipo: 'CORRECCION',
    },
    {
        id: '2026-09-cliente-recurrente',
        fecha: '2026-09-29',
        titulo: 'Panel de ventas: cuántas veces te compró cada cliente',
        descripcion:
            'Una columna nueva marca a los clientes recurrentes para que sepas a quién cuidar.',
        categoria: 'Ventas',
        tipo: 'NUEVO',
        donde: 'Ventas → Panel de ventas',
    },
    {
        id: '2026-09-sire-contador-sunat',
        fecha: '2026-09-29',
        titulo: 'SIRE: el contador aprueba compras y traes tus compras desde SUNAT',
        descripcion:
            'Apruebas o deniegas cada compra con motivo (las denegadas no entran al registro de compras), cruzas con la propuesta de SUNAT y "Traer mis compras de SUNAT" recupera las facturas que nunca registraste.',
        categoria: 'Contabilidad',
        tipo: 'NUEVO',
        donde: 'SIRE → Libro de compras',
        nota: 'Aparece si tu plan incluye SIRE. Requiere la credencial de API de SUNAT (Menú SOL).',
    },
    {
        id: '2026-09-correcciones-conversion',
        fecha: '2026-09-29',
        titulo: 'Correcciones al convertir notas de venta',
        descripcion:
            'Convertir una nota ya cobrada no duplica el cobro, una nota a crédito ya pagada se convierte al contado y el PDF muestra la unidad de medida real.',
        categoria: 'Facturación',
        tipo: 'CORRECCION',
    },
    {
        id: '2026-09-comision-fin-de-semana',
        fecha: '2026-09-28',
        titulo: 'Comisión distinta para sábado y domingo',
        descripcion:
            'La comisión la cobra quien vende ese día; si dejas el campo vacío se paga igual todos los días.',
        categoria: 'Ventas',
        tipo: 'NUEVO',
        donde: 'Productos → ficha → Comisión de sábado y domingo',
    },
    {
        id: '2026-09-nota-pedido-a-comprobante',
        fecha: '2026-09-25',
        titulo: 'La nota de pedido también se convierte en boleta o factura',
        descripcion:
            'Igual que la nota de venta, con un clic desde su menú.',
        categoria: 'Facturación',
        tipo: 'MEJORA',
    },
    {
        id: '2026-09-ley-amazonia',
        fecha: '2026-09-24',
        titulo: 'Ley de Amazonía en tus comprobantes',
        descripcion:
            'Lo activas una vez y tus comprobantes llevan la leyenda que exige SUNAT; los productos nuevos y el ítem libre nacen exonerados.',
        categoria: 'Facturación',
        tipo: 'NUEVO',
        donde: 'Perfil → Configuración → Impuestos',
    },
    {
        id: '2026-09-guia-documentos-relacionados',
        fecha: '2026-09-24',
        titulo: 'Guía de remisión con documentos relacionados y datos de transporte completos',
        descripcion:
            'Documentos relacionados, vehículos y conductores secundarios y fecha de entrega; las guías a personas con DNI ya no las rechaza SUNAT.',
        categoria: 'Facturación',
        tipo: 'MEJORA',
        donde: 'Comprobantes → Guías de remisión',
    },
    {
        id: '2026-09-cotizar-sin-stock',
        fecha: '2026-09-22',
        titulo: 'Cotiza aunque no tengas stock',
        descripcion:
            'La cotización ya no te frena por stock y suma la forma de pago "Crédito 7 días".',
        categoria: 'Facturación',
        tipo: 'MEJORA',
        donde: 'Cotizaciones → Nueva cotización',
    },
    {
        id: '2026-09-consumo-propio-igv',
        fecha: '2026-09-21',
        titulo: 'Compras de consumo propio y tu IGV del mes',
        descripcion:
            'Gasolina, útiles o servicios no entran al inventario y restan en tu ganancia sin IGV. El bloque "IGV del mes" muestra lo cobrado, el crédito fiscal y lo que toca pagar.',
        categoria: 'Finanzas',
        tipo: 'NUEVO',
        donde: 'Compras → Nueva compra · Finanzas → Análisis financiero → Rentabilidad',
    },
    {
        id: '2026-09-pos-a-tu-medida',
        fecha: '2026-09-21',
        titulo: 'El POS se adapta a tu forma de vender',
        descripcion:
            'Eliges con qué comprobante arranca cada venta, puedes exigir boleta o factura cuando pagan con Yape, Plin, transferencia o tarjeta, y decides si la búsqueda se mantiene al agregar un producto.',
        categoria: 'Ventas',
        tipo: 'NUEVO',
        donde: 'Perfil → Configuración → Comprobantes e impresión / Ventas y caja',
    },
    {
        id: '2026-09-shalom-claves-tamano-rotulo',
        fecha: '2026-09-21',
        titulo: 'Shalom: tus propias claves de retiro, tamaño del paquete y rótulo 80×50',
        descripcion:
            'Defines tus claves de retiro, eliges el tamaño del paquete con su tarifa e imprimes el rótulo en formato 80×50 mm.',
        categoria: 'Envíos',
        tipo: 'MEJORA',
        planes: ['CORPORATIVO'],
        donde: 'Perfil → Configuración → Shalom Pro · Panel de ventas → Rótulo',
    },
    {
        id: '2026-09-notas-venta-coordinar-envio',
        fecha: '2026-09-21',
        titulo: 'Coordina el envío desde la lista de notas de venta',
        descripcion:
            'Además, Registrar pago e Historial de pagos tienen nuevo diseño y los recibos ya no se pisan entre sí.',
        categoria: 'Envíos',
        tipo: 'MEJORA',
        donde: 'Comprobantes → Notas de venta → menú',
    },

    // ── 18 de septiembre: lanzamiento ────────────────────────────────────────
    {
        id: '2026-09-mercado-pago',
        fecha: '2026-09-18',
        titulo: 'Mercado Pago en tu tienda virtual',
        descripcion:
            'Tus clientes ya pueden pagar con tarjeta, Yape y billeteras en tu tienda virtual a través de Mercado Pago. Conectas tu propia cuenta de Mercado Pago desde el perfil (si no tienes una, se crea gratis en minutos), la plata cae directo en ella y el pedido se confirma solo cuando el pago está aprobado.',
        categoria: 'Tienda virtual',
        tipo: 'NUEVO',
        // La tienda virtual (tieneTienda) solo existe en Negocio y Corporativo.
        planes: ['NEGOCIO', 'CORPORATIVO'],
        donde: 'Perfil → Medios de pago → Conectar Mercado Pago',
        nota: 'Mercado Pago acepta pagos desde S/ 5. Krezka cobra S/ 1 por cada pago aprobado.',
    },
    {
        id: '2026-09-despacho-cliente-wsp-dni',
        fecha: '2026-09-18',
        titulo: 'Cliente registrado solo con WhatsApp: el DNI se completa con RENIEC al despachar',
        descripcion:
            'Si la venta se hizo a un cliente que registraste solo con su celular, al coordinar el envío por Shalom u Olva el sistema te pide el DNI, trae el nombre desde RENIEC y, si quieres, corrige la ficha del cliente de paso. En el Panel de ventas verás el aviso "Falta DNI para la guía" en las ventas que lo necesitan.',
        categoria: 'Envíos',
        tipo: 'NUEVO',
        planes: ['NEGOCIO', 'CORPORATIVO'],
        donde: 'Ventas → Panel de ventas → Editar despacho → Destinatario',
    },
    {
        id: '2026-09-rotulos-en-lote',
        fecha: '2026-09-18',
        titulo: 'Imprime todos los rótulos del día de una vez',
        descripcion:
            'Botón "Rótulos" en el Panel de ventas: imprime en una sola tanda el rótulo de todos los despachos en Preparando que estás viendo (Shalom, Olva o reparto propio), uno por página, con referencia, destinatario y agencia destino. Respeta los filtros y la búsqueda, así sacas solo los de una agencia si quieres.',
        categoria: 'Envíos',
        tipo: 'NUEVO',
        planes: ['NEGOCIO', 'CORPORATIVO'],
        donde: 'Ventas → Panel de ventas → Rótulos',
    },
    {
        id: '2026-09-coordinar-envio-panel',
        fecha: '2026-09-18',
        titulo: 'Coordinar el envío de una venta que salió sin despacho',
        descripcion:
            'Las ventas emitidas sin envío ahora tienen "Coordinar envío" en el menú del Panel de ventas: crea el seguimiento y abre el despacho para elegir courier, agencia y generar la guía, sin tener que reemitir nada.',
        categoria: 'Envíos',
        tipo: 'MEJORA',
        planes: ['NEGOCIO', 'CORPORATIVO'],
        donde: 'Ventas → Panel de ventas → menú de la venta → Coordinar envío',
    },
    {
        id: '2026-09-pedidos-tienda-panel',
        fecha: '2026-09-18',
        titulo: 'Los pedidos de la tienda virtual se gestionan desde el Panel de ventas',
        descripcion:
            'Los pedidos de tu tienda se ven en todas las sedes y ya tienen acciones en el panel: abrir el pedido, marcarlo como pagado, escribirle al cliente por WhatsApp y hacer la boleta o factura con las cantidades correctas.',
        categoria: 'Tienda virtual',
        tipo: 'MEJORA',
        planes: ['NEGOCIO', 'CORPORATIVO'],
        donde: 'Ventas → Panel de ventas → Tienda',
    },
    {
        id: '2026-09-importar-compras-excel',
        fecha: '2026-09-17',
        titulo: 'Importa tus compras desde Excel, con stock por sede',
        descripcion:
            'Descarga la plantilla precargada con tu catálogo y el stock de cada sede, llénala con la compra y súbela: el sistema arma una compra por proveedor y documento, actualiza costos y kardex, y deja la cuenta por pagar. Si tienes varias sedes, puedes repartir una misma compra entre ellas ("Distribuir") tanto en Nueva compra como en el Excel.',
        categoria: 'Compras',
        tipo: 'NUEVO',
        donde: 'Compras → Importar desde Excel · Nueva compra → Distribuir',
    },
    {
        id: '2026-09-conciliacion-excel-pdf',
        fecha: '2026-09-17',
        titulo: 'Conciliación bancaria en Excel y PDF con origen y contraparte',
        descripcion:
            'El estado de cuenta del banco se cruza con tus ventas, compras y gastos y sale a Excel (tabla completa, con la hoja de conciliación primero) y a PDF con Origen · Contraparte por movimiento. Las fechas del Excel del banco ya se leen bien aunque vengan como fecha real o como número.',
        categoria: 'Finanzas',
        tipo: 'MEJORA',
        planes: ['NEGOCIO', 'CORPORATIVO'],
        donde: 'Finanzas → Conciliación bancaria → Exportar',
    },
    {
        id: '2026-09-reportes-ventas-con-igv',
        fecha: '2026-09-17',
        titulo: 'Reportes de productos y categorías con el IGV bien tratado',
        descripcion:
            'Los reportes por producto y por categoría mostraban las ventas sin IGV y no cuadraban con lo cobrado. Ahora muestran la venta tal como se cobró y, en la rentabilidad, el IGV se descuenta también en las notas de venta y en los PDF, para que la utilidad sea la real.',
        categoria: 'Finanzas',
        tipo: 'CORRECCION',
        donde: 'Finanzas → Análisis financiero → Productos / Categorías',
    },
    {
        id: '2026-09-importar-productos-sin-codigo',
        fecha: '2026-09-17',
        titulo: 'Importar productos: filas sin código ya no frenan la carga',
        descripcion:
            'Si agregas productos al final del Excel sin ponerles CÓDIGO, el sistema les asigna el siguiente correlativo y los crea igual. Además detecta si el archivo viene con los códigos corridos (renumerados) y te avisa antes de pisar tu catálogo. La carga masiva se abre bien desde el menú Herramientas.',
        categoria: 'Productos',
        tipo: 'CORRECCION',
        donde: 'Productos → Herramientas → Importar Excel',
    },
    {
        id: '2026-09-pedidos-tienda-correcciones',
        fecha: '2026-09-17',
        titulo: 'Pedidos de tienda: cantidades correctas al facturar y pedidos vacíos bloqueados',
        descripcion:
            'Al hacer la boleta o factura desde un pedido de la tienda se perdían las cantidades (todo salía en 1). Y la tienda ya no acepta pedidos sin productos ni sin nombre o celular del cliente.',
        categoria: 'Tienda virtual',
        tipo: 'CORRECCION',
        planes: ['NEGOCIO', 'CORPORATIVO'],
    },

    // ── 12 de septiembre ─────────────────────────────────────────────────────
    {
        id: '2026-09-quitar-sede-stock-cero',
        fecha: '2026-09-12',
        titulo: 'Quitar un producto de una sede dejando su stock en 0',
        descripcion:
            'Si cargaste stock en la sede equivocada, ahora puedes quitar el producto de esa sede y dejarlo en 0 con una salida registrada en el kardex, en vez de tener que trasladarlo. El sistema te explica la diferencia (traslado vs. carga por error) antes de confirmar, tanto desde el menú del producto como en la asignación masiva.',
        categoria: 'Productos',
        tipo: 'NUEVO',
        planes: ['NEGOCIO', 'CORPORATIVO'],
        donde: 'Kardex → Inventario → Acciones → Quitar de la sede',
    },
    {
        id: '2026-09-dashboard-sede-activa',
        fecha: '2026-09-12',
        titulo: 'Dashboard y Movimientos arrancan en tu sede',
        descripcion:
            'El Dashboard y los Movimientos del Kardex se abren mostrando la sede activa de la cabecera, y el administrador puede cambiar a otra sede o ver todas desde el selector, esté en la sede que esté. Los usuarios asignados a una sede ven solo la suya.',
        categoria: 'Finanzas',
        tipo: 'MEJORA',
        planes: ['NEGOCIO', 'CORPORATIVO'],
        donde: 'Dashboard · Kardex → Movimientos → filtro Sede',
    },

    // ── 11 de septiembre ─────────────────────────────────────────────────────
    {
        id: '2026-09-stock-por-caja',
        fecha: '2026-09-11',
        titulo: 'Ingresa stock por cajas y códigos por presentación',
        descripcion:
            'En la gestión de inventario eliges "Ingresar en" Unidades o Caja ×N según las presentaciones del producto: agregar, quitar, reemplazar y el stock inicial aceptan cantidad de cajas y se convierten a unidades, con el detalle visible antes de guardar. Cada presentación (caja, paquete) puede llevar su propio código interno junto a los códigos de barra adicionales.',
        categoria: 'Productos',
        tipo: 'NUEVO',
        donde: 'Productos → ficha → Gestión de inventario · Códigos de barra adicionales',
    },
    {
        id: '2026-09-calculadora-sueltas-cajas',
        fecha: '2026-09-11',
        titulo: 'La calculadora de stock suma sueltas + cajas',
        descripcion:
            'Al contar inventario, propone tu stock actual como unidades sueltas y las unidades por caja del producto; el total sale solo: sueltas + cajas × unidades (por ejemplo, 39 sueltas + 10 cajas de 10 = 139).',
        categoria: 'Productos',
        tipo: 'MEJORA',
        donde: 'Productos → ficha → Calculadora de stock',
    },
    {
        id: '2026-09-couriers-mapa',
        fecha: '2026-09-11',
        titulo: 'Tablero de couriers Shalom y Olva, con mapa',
        descripcion:
            'Una vista nueva para tus envíos: cuánto sale por cada courier y por tus repartidores, tasa y tiempo de entrega, flete y cobros contra entrega, qué está en camino y qué ya se retrasó, con rastreo desde la misma tabla. Además un mapa del Perú con las ciudades a donde más envías.',
        categoria: 'Envíos',
        tipo: 'NUEVO',
        planes: ['NEGOCIO', 'CORPORATIVO'],
        donde: 'Ventas → Couriers Shalom / Olva',
        nota: 'Aparece cuando tu plan tiene Shalom u Olva habilitados.',
    },
    {
        id: '2026-09-clientes-y-envios',
        fecha: '2026-09-11',
        titulo: 'Qué ciudades y qué clientes te compran más',
        descripcion:
            'Pestaña nueva en el Análisis Financiero: ciudades que más te compran (por el destino del envío o la ubicación del cliente), ranking de clientes, tu cliente más fiel, y el ranking de repartidores y couriers por envíos entregados.',
        categoria: 'Clientes',
        tipo: 'NUEVO',
        donde: 'Finanzas → Análisis Financiero → Clientes y envíos',
        nota: 'Usa el período "Histórico" para medir la fidelidad con todo lo vendido.',
    },
    {
        id: '2026-09-catalogo-por-sede',
        fecha: '2026-09-11',
        titulo: 'Catálogo independiente por sede',
        descripcion:
            'Si lo activas, cada sede maneja sus propios productos: lo que creas o importas desde una sede queda solo en esa sede, el inventario y el punto de venta muestran únicamente lo disponible ahí, y desde la ficha eliges en qué sedes está cada producto. Puedes asignar productos a una sede de forma masiva.',
        categoria: 'Productos',
        tipo: 'NUEVO',
        planes: ['NEGOCIO', 'CORPORATIVO'],
        donde: 'Perfil → Configuración → Sedes y catálogo',
        nota: 'Viene apagado (catálogo compartido): tiene sentido cuando manejas más de una sede.',
    },
    {
        id: '2026-09-marca-sistema',
        fecha: '2026-09-11',
        titulo: 'Comprobantes solo con tu marca',
        descripcion:
            'Ahora decides si el pie "Sistema punto de venta · Desarrollado por" sale o no en tus comprobantes. Apágalo y el ticket, el A4, el A5 y la cotización se imprimen únicamente con los datos de tu negocio, tanto en la impresión como en el PDF que envías por WhatsApp o correo.',
        categoria: 'Facturación',
        tipo: 'MEJORA',
        donde: 'Perfil → Configuración → Impresión de comprobantes',
        // El PDF lo rinde el servidor, así que aplica también a lo que la app comparte.
        plataformas: ['WEB', 'MOVIL'],
    },
    {
        id: '2026-09-observaciones-recordadas',
        fecha: '2026-09-11',
        titulo: 'Observaciones de la venta: fijas por negocio o recordadas',
        descripcion:
            'Define en tu Perfil un texto fijo de OBSERVACIONES y el punto de venta lo propone en cada venta nueva. Además, lo que escribas al configurar una venta se recuerda solo en ese equipo para la siguiente, con un botón Limpiar para borrarlo cuando quieras.',
        categoria: 'Facturación',
        tipo: 'MEJORA',
        donde: 'Perfil → Configuración → Impresión de comprobantes · Crear comprobante → Configurar venta',
    },
    {
        id: '2026-09-rastreo-ultimo-estado',
        fecha: '2026-09-11',
        titulo: 'El rastreo no pierde el último estado conocido',
        descripcion:
            'Si Shalom u Olva no responden por un momento, el sistema conserva el último estado del envío y lo muestra marcado como "último estado conocido", en vez de dejarte la ventana vacía.',
        categoria: 'Envíos',
        tipo: 'CORRECCION',
        planes: ['NEGOCIO', 'CORPORATIVO'],
        plataformas: ['WEB', 'MOVIL'],
    },

    // ── 08 y 09 de septiembre ────────────────────────────────────────────────
    {
        id: '2026-09-finanzas-por-sede',
        fecha: '2026-09-09',
        titulo: 'Análisis Financiero por sede',
        descripcion:
            'Elige una sede y la Rentabilidad, las Categorías, los Productos y los Métodos de pago se calculan solo con lo de esa sede. Los gastos marcados "toda la empresa" se informan aparte para no cargárselos a una sola.',
        categoria: 'Finanzas',
        tipo: 'MEJORA',
        planes: ['NEGOCIO', 'CORPORATIVO'],
        donde: 'Finanzas → Análisis Financiero → selector Sede',
        nota: 'Los usuarios de una sede ven siempre la suya.',
    },
    {
        id: '2026-09-cotizacion-sin-igv',
        fecha: '2026-09-09',
        titulo: 'Cotización con precios unitarios sin IGV',
        descripcion:
            'Opción para imprimir la columna de precio como valor unitario (sin IGV) y el importe de la línea como valor de venta, como lo piden muchas empresas para comparar propuestas. Los totales siguen mostrando gravadas, IGV y total.',
        categoria: 'Facturación',
        tipo: 'NUEVO',
        donde: 'Cotizaciones → Configurar formato → Precios unitarios sin IGV',
    },
    {
        id: '2026-09-cotizacion-observaciones-pie',
        fecha: '2026-09-09',
        titulo: 'Cotización: observaciones por renglón y pie editable',
        descripcion:
            'Cada línea que escribes en Observaciones sale como un punto aparte en el PDF, y el mensaje final de agradecimiento ahora lo redactas tú (o dejas el de siempre). Los saltos de línea también se respetan en boletas y facturas.',
        categoria: 'Facturación',
        tipo: 'MEJORA',
        donde: 'Cotizaciones → Configurar formato → Mensaje de agradecimiento',
    },
    {
        id: '2026-09-kardex-excel',
        fecha: '2026-09-08',
        titulo: 'Exportar los movimientos del Kardex a Excel',
        descripcion:
            'Los movimientos de inventario que estás viendo (con sus filtros de fecha, producto y tipo) se descargan en Excel o CSV con un clic, listos para revisar con tu contador.',
        categoria: 'Productos',
        tipo: 'NUEVO',
        donde: 'Kardex → Movimientos → Exportar',
    },
    {
        id: '2026-09-panel-ventas-sede-excel',
        fecha: '2026-09-08',
        titulo: 'Panel de ventas: filtro por sede y Excel por producto',
        descripcion:
            'El panel del día se puede filtrar por sede y los filtros quedaron agrupados para no ocupar toda la pantalla. El Excel exportado ahora trae una fila por producto vendido y la columna Total Unid.',
        categoria: 'Ventas',
        tipo: 'MEJORA',
        donde: 'Ventas → Panel de ventas',
    },
    {
        id: '2026-09-caja-turnos-abiertos',
        fecha: '2026-09-08',
        titulo: 'Aviso de turnos de caja sin cerrar',
        descripcion:
            'Al abrir caja, el sistema te avisa si quedó un turno anterior abierto para que lo cierres antes de seguir. Los arqueos ya cerrados quedan protegidos y no se pueden alterar.',
        categoria: 'Ventas',
        tipo: 'MEJORA',
        donde: 'Ventas → Caja y bancos',
        // En la app: la caja móvil usa los mismos endpoints de apertura/cierre.
        plataformas: ['WEB', 'MOVIL'],
    },
    {
        id: '2026-09-gastos-caja-finanzas',
        fecha: '2026-09-08',
        titulo: 'Los gastos de caja chica ya cuentan en tus finanzas',
        descripcion:
            'Lo que registras como gasto desde la caja (pasajes, compras menores, propinas) ahora aparece en la Rentabilidad, en el Dashboard y en Contabilidad como egreso del día, sin que tengas que volver a cargarlo. Además siguen visibles después de cerrar el turno.',
        categoria: 'Finanzas',
        tipo: 'MEJORA',
        donde: 'Finanzas → Análisis Financiero → Rentabilidad',
    },
    {
        id: '2026-09-comisiones-correcciones',
        fecha: '2026-09-10',
        titulo: 'Comisiones: se pagan aunque SUNAT ya tuviera el comprobante',
        descripcion:
            'Cuando SUNAT respondía que la boleta o factura ya estaba registrada, la comisión del vendedor no se generaba; ahora sí. El corte diario de comisiones también usa la hora del Perú, así una venta de la noche ya no se pasaba al día siguiente.',
        categoria: 'Ventas',
        tipo: 'CORRECCION',
        donde: 'Mis Comisiones · Comisiones del equipo',
    },
    {
        id: '2026-09-envios-correcciones',
        fecha: '2026-09-09',
        titulo: 'Envíos: adelanto sin duplicar y guías de Shalom más seguras',
        descripcion:
            'Al coordinar el envío de una venta con adelanto ya no se registraba el pago dos veces. Shalom ya no da por creada una guía que rechazó, pide el tipo de producto y no adivina la agencia destino cuando el nombre es ambiguo: te la pide a ti.',
        categoria: 'Envíos',
        tipo: 'CORRECCION',
        planes: ['NEGOCIO', 'CORPORATIVO'],
    },

    // ── 07 de septiembre ─────────────────────────────────────────────────────
    {
        id: '2026-09-ventas-por-producto',
        fecha: '2026-09-07',
        titulo: 'Qué producto te deja más plata',
        descripcion:
            'Una vista nueva ordena tus productos por lo que realmente aportan: unidades, ingreso, costo, ganancia y margen, con el acumulado día a día del mes para ver cómo se fue armando la venta.',
        categoria: 'Finanzas',
        tipo: 'NUEVO',
        donde: 'Finanzas → Análisis Financiero → Productos',
        nota: 'El margen sale del costo promedio del producto: si no lo cargaste, aparecerá como 100%.',
        // En la app: pestaña "Productos" en `FinanzasScreen`.
        plataformas: ['WEB', 'MOVIL'],
    },
    {
        id: '2026-09-olva-courier',
        fecha: '2026-09-07',
        titulo: 'Olva Courier integrado',
        descripcion:
            'Ya puedes elegir Olva como courier en tus despachos: busca la agencia de destino del catálogo oficial, rastrea el envío sin salir del sistema y, si tu plan lo incluye, genera la guía desde el panel. El estado del pedido avanza solo: En camino → En agencia → Entregado.',
        categoria: 'Envíos',
        tipo: 'NUEVO',
        planes: ['NEGOCIO', 'CORPORATIVO'],
        donde: 'Despacho · Perfil → Configuración → Envíos Olva Courier',
        nota: 'Generar las guías está disponible en el plan Corporativo.',
        // En la app: configuración en "Couriers", rastreo y guía desde Panel de ventas.
        plataformas: ['WEB', 'MOVIL'],
        // Recién publicada: la integración es nueva y puede ajustarse.
        estado: 'BETA',
    },
    {
        id: '2026-09-qr-sunat',
        fecha: '2026-09-07',
        titulo: 'QR de SUNAT en tus comprobantes',
        descripcion:
            'Activa el QR del comprobante electrónico al pie del ticket, A4 y A5. Tu cliente lo escanea y ve su boleta o factura en línea desde el celular, sin que le tengas que mandar nada.',
        categoria: 'Facturación',
        tipo: 'NUEVO',
        donde: 'Perfil → Configuración → Impresión de comprobantes',
        // En la app: el PDF lo rinde el servidor (`/comprobante/:id/generar-pdf`), así que el QR sale también en la app; se configura desde el panel web.
        plataformas: ['WEB', 'MOVIL'],
    },
    {
        id: '2026-09-formato-impresion',
        fecha: '2026-09-07',
        titulo: 'Formato de impresión por defecto',
        descripcion:
            'Elige una vez si tu negocio imprime en ticket, A4 o A5 y el sistema lo deja preseleccionado en cada venta y en cada reimpresión. También puedes activar que la impresión se abra sola al emitir, para no perder un clic por venta.',
        categoria: 'Facturación',
        tipo: 'MEJORA',
        donde: 'Perfil → Configuración → Impresión de comprobantes',
        // En la app: `getFormatoImpresionDefault()` en `services/api.ts` preselecciona
        // el formato y `getImprimirAutomaticoPref()` abre la impresión al emitir.
        plataformas: ['WEB', 'MOVIL'],
    },
    {
        id: '2026-09-etiquetas-codigo-barras',
        fecha: '2026-09-07',
        titulo: 'Etiquetas de código de barras',
        descripcion:
            'Genera códigos EAN-13 propios para los productos que no traen uno de fábrica e imprime sus etiquetas directamente desde la ficha del producto.',
        categoria: 'Productos',
        tipo: 'NUEVO',
        donde: 'Productos → ficha del producto',
        // En la app: `utils/ean13.ts` + pantalla de etiquetas en la app.
        plataformas: ['WEB', 'MOVIL'],
    },
    {
        id: '2026-09-shalom-guia-automatica',
        fecha: '2026-09-07',
        titulo: 'La guía de Shalom se genera al cerrar la venta',
        descripcion:
            'Con el interruptor activado, al terminar una venta con despacho la guía se crea sola en Shalom Pro y el N° de orden queda cargado en el despacho, listo para el rastreo. Ya no hay que generarla a mano una por una.',
        categoria: 'Envíos',
        tipo: 'MEJORA',
        planes: ['CORPORATIVO'],
        donde: 'Perfil → Configuración → Crear guías en Shalom Pro',
        // En la app: interruptor en Empresa → Couriers.
        plataformas: ['WEB', 'MOVIL'],
    },

    // ── 06 de septiembre ─────────────────────────────────────────────────────
    {
        id: '2026-09-shalom-pro',
        fecha: '2026-09-06',
        titulo: 'Crear guías de Shalom desde el panel',
        descripcion:
            'Conecta la cuenta de Shalom Pro de tu negocio y emite las guías de tus pedidos sin entrar a la web de Shalom. El N° de orden y la clave se guardan solos en el despacho.',
        categoria: 'Envíos',
        tipo: 'NUEVO',
        planes: ['CORPORATIVO'],
        donde: 'Perfil → Configuración → Crear guías en Shalom Pro',
        // En la app: Empresa → Couriers para conectar, y el botón del Panel de ventas.
        plataformas: ['WEB', 'MOVIL'],
    },
    {
        id: '2026-09-pdf-ticket-a5',
        fecha: '2026-09-06',
        titulo: 'Comprobantes en ticket 80mm y A5',
        descripcion:
            'El PDF del comprobante ahora se genera en los tres tamaños desde el servidor, así que sale idéntico lo imprimas desde la computadora, lo descargues o lo abras en la app. El ticket de 80mm tiene su propio diseño y ya no es un A4 reducido.',
        categoria: 'Facturación',
        tipo: 'MEJORA',
        // En la app: `FormatoPdfComprobante` y `?formato=` en `services/api.ts`.
        plataformas: ['WEB', 'MOVIL'],
    },
    {
        id: '2026-09-nota-venta-diseno',
        fecha: '2026-09-06',
        titulo: 'La nota de venta se ve como tu cotización',
        descripcion:
            'Las notas de venta usan el mismo diseño cuidado de las cotizaciones, con tus cuentas bancarias y el QR de pago si lo tienes activado.',
        categoria: 'Facturación',
        tipo: 'MEJORA',
        // En la app: la plantilla vive en el servidor, la app pide ese mismo PDF.
        plataformas: ['WEB', 'MOVIL'],
    },
    {
        id: '2026-09-sire-revision',
        fecha: '2026-09-06',
        titulo: 'Revisión del periodo antes de declarar',
        descripcion:
            'Libro de Ventas y Compras muestran el resumen del periodo, el IGV resultante y el cotejo contra la propuesta de SUNAT, para que detectes diferencias antes de presentar y no después.',
        categoria: 'Contabilidad',
        tipo: 'NUEVO',
        donde: 'SIRE → Libro de Ventas · Libro de Compras',
        // Anunciada; todavía no habilitada para los clientes.
        estado: 'PROXIMAMENTE',
    },
    {
        id: '2026-09-sire-txt',
        fecha: '2026-09-06',
        titulo: 'El TXT del SIRE sale en el formato oficial',
        descripcion:
            'Corregimos el archivo del Registro de Ventas (RVIE) para que respete el formato y el nombre oficial de SUNAT, y para que las compras anuladas dejen de sumar.',
        categoria: 'Contabilidad',
        tipo: 'CORRECCION',
        // Anunciada; todavía no habilitada para los clientes.
        estado: 'PROXIMAMENTE',
    },

    // ── 05 de septiembre ─────────────────────────────────────────────────────
    {
        id: '2026-09-capital-inmovilizado',
        fecha: '2026-09-05',
        titulo: 'Cuánto dinero tienes parado en inventario',
        descripcion:
            'Finanzas te muestra el capital inmovilizado: cuánto de tu plata está detenida en mercadería sin vender. Útil para decidir qué comprar y qué liquidar.',
        categoria: 'Finanzas',
        tipo: 'NUEVO',
        donde: 'Finanzas → Inventario',
        // En la app: `valorInventario` en `AnalisisFinancieroScreen`.
        plataformas: ['WEB', 'MOVIL'],
    },
    {
        id: '2026-09-combos-rediseno',
        fecha: '2026-09-05',
        titulo: 'Combos con un diseño más claro',
        descripcion:
            'Rediseñamos las tarjetas de combos y el buscador para que armarlos y encontrarlos sea más rápido.',
        categoria: 'Productos',
        tipo: 'MEJORA',
    },

    // ── 04 de septiembre ─────────────────────────────────────────────────────
    {
        id: '2026-09-linea-gratuita',
        fecha: '2026-09-04',
        titulo: 'Marcar un producto como premio o bonificación',
        descripcion:
            'Puedes marcar una línea del comprobante como gratuita (premio, bonificación, muestra) y el sistema la declara correctamente ante SUNAT sin cobrarla. Antes, una línea gratuita se terminaba cobrando al emitir.',
        categoria: 'Facturación',
        tipo: 'CORRECCION',
        // En la app: operaciones gratuitas por línea en Nueva Venta y en el detalle del comprobante.
        plataformas: ['WEB', 'MOVIL'],
    },
    {
        id: '2026-09-orden-compra',
        fecha: '2026-09-04',
        titulo: 'N° de Orden de Compra del cliente',
        descripcion:
            'Registra la orden de compra de tu cliente en el comprobante y en la guía de remisión — lo piden casi todas las empresas grandes para pagarte. Incluye la excepción SUNAT M1/L para vehículos.',
        categoria: 'Facturación',
        tipo: 'NUEVO',
    },
    {
        id: '2026-09-calculadora-stock',
        fecha: '2026-09-04',
        titulo: 'Calculadora de stock por cajas y paquetes',
        descripcion:
            'Al cargar stock ya no tienes que multiplicar de memoria: indicas cuántas cajas y cuántas unidades trae cada una, y el sistema calcula el total.',
        categoria: 'Productos',
        tipo: 'MEJORA',
        donde: 'Kardex → ingreso de stock',
    },
    {
        id: '2026-09-cotizacion-automatica-ia',
        fecha: '2026-09-04',
        titulo: 'La IA arma la cotización desde el chat',
        descripcion:
            'Cuando el prospecto confirma qué quiere y cuánto, la IA prepara un borrador de cotización automáticamente. Es opcional: se activa con un interruptor para que no aparezcan documentos sorpresa.',
        categoria: 'IA de Ventas',
        tipo: 'NUEVO',
        donde: 'IA de Ventas → Configurar IA',
        nota: 'Requiere el módulo IA de Ventas contratado.',
    },
    {
        id: '2026-09-ventas-mobile',
        fecha: '2026-09-04',
        titulo: 'Las ventas de la app ya cuentan en caja',
        descripcion:
            'Algunas ventas emitidas desde el celular no se estaban contando en los reportes de caja por una diferencia de mayúsculas en la forma de pago. Corregido.',
        categoria: 'Facturación',
        tipo: 'CORRECCION',
        // En la app: la corrección es justamente sobre las ventas emitidas desde la app.
        plataformas: ['WEB', 'MOVIL'],
    },

    // ── 03 de septiembre ─────────────────────────────────────────────────────
    {
        id: '2026-09-ia-datos-reales',
        fecha: '2026-09-03',
        titulo: 'La IA responde con tu stock y tus precios reales',
        descripcion:
            'La IA de Ventas dejó de improvisar: responde con los productos, precios, categorías y stock que tienes cargados en el sistema, y envía la foto del producto o tu catálogo por WhatsApp cuando el prospecto pide más información.',
        categoria: 'IA de Ventas',
        tipo: 'MEJORA',
        nota: 'Requiere el módulo IA de Ventas contratado.',
    },
    {
        id: '2026-09-ia-seguimiento',
        fecha: '2026-09-03',
        titulo: 'Seguimiento automático a los prospectos',
        descripcion:
            'Si un prospecto deja de responder, la IA lo reengancha sola dentro de la ventana de 24 horas de WhatsApp, sin costo de plantilla.',
        categoria: 'IA de Ventas',
        tipo: 'NUEVO',
        donde: 'IA de Ventas → Configurar IA',
        nota: 'Requiere el módulo IA de Ventas contratado.',
    },
    {
        id: '2026-09-pos-stock',
        fecha: '2026-09-03',
        titulo: 'El POS muestra primero lo que sí tienes',
        descripcion:
            'Al buscar productos para una venta, los que tienen stock aparecen arriba. Menos ventas frenadas por elegir un producto agotado.',
        categoria: 'Facturación',
        tipo: 'MEJORA',
        // En la app: priorización de stock en el POS de la app.
        plataformas: ['WEB', 'MOVIL'],
    },
    {
        id: '2026-09-editar-sku',
        fecha: '2026-09-03',
        titulo: 'Editar el código (SKU) de un producto',
        descripcion:
            'Ya puedes corregir el código de un producto ya creado, sin tener que borrarlo y volver a cargarlo.',
        categoria: 'Productos',
        tipo: 'CORRECCION',
        // En la app: corrección del backend; `ProductFormScreen` ya manda `codigo`.
        plataformas: ['WEB', 'MOVIL'],
    },
    {
        id: '2026-09-nota-pedido-venta',
        fecha: '2026-09-03',
        titulo: 'La Nota de Pedido cuenta como venta',
        descripcion:
            'Las notas de pedido ya suman en tus reportes de ventas, así que los totales del día cuadran con lo que realmente vendiste.',
        categoria: 'Facturación',
        tipo: 'CORRECCION',
        // En la app: corrección del backend, común a ambos.
        plataformas: ['WEB', 'MOVIL'],
    },

    // ── 02 de septiembre ─────────────────────────────────────────────────────
    {
        id: '2026-09-codigo-vs-barras',
        fecha: '2026-09-02',
        titulo: 'Código y código de barras separados',
        descripcion:
            'La plantilla de importación y exportación de productos distingue tu código interno del código de barras, así que dejaron de mezclarse al cargar productos en lote.',
        categoria: 'Productos',
        tipo: 'MEJORA',
        // En la app: la app usa `/productos/plantilla` e `/productos/importar`.
        plataformas: ['WEB', 'MOVIL'],
    },
    {
        id: '2026-09-import-upsert',
        fecha: '2026-09-02',
        titulo: 'Reimportar clientes ya no duplica',
        descripcion:
            'Al volver a importar tu lista de clientes o proveedores, el sistema actualiza la dirección y los datos del que ya existe en vez de crear un duplicado.',
        categoria: 'Clientes',
        tipo: 'CORRECCION',
    },
    {
        id: '2026-09-banco-movimientos',
        fecha: '2026-09-02',
        titulo: 'Banco y proveedor visibles en los movimientos',
        descripcion:
            'Los movimientos de compra muestran el nombre del proveedor, y al registrar el pago de un comprobante puedes indicar por qué banco entró.',
        categoria: 'Finanzas',
        tipo: 'MEJORA',
        // En la app: pantalla Bancos con saldos y movimientos, a la par de la web.
        plataformas: ['WEB', 'MOVIL'],
    },

    // ── 01 de septiembre ─────────────────────────────────────────────────────
    {
        id: '2026-09-ia-ventas',
        fecha: '2026-09-01',
        titulo: 'Módulo IA de Ventas',
        descripcion:
            'Una IA atiende tus WhatsApp entrantes, califica al prospecto y te pasa la conversación cuando está listo para comprar. Lleva el panel de prospectos, el chat en vivo y el contexto de tu negocio.',
        categoria: 'IA de Ventas',
        tipo: 'NUEVO',
        donde: 'IA de Ventas',
        nota: 'Requiere el módulo IA de Ventas contratado.',
    },
];

/** Categorías presentes, para los filtros de la página. */
export const CATEGORIAS_NOVEDADES = Array.from(
    new Set(NOVEDADES.map((n) => n.categoria)),
).sort((a, b) => a.localeCompare(b, 'es'));

/** Normaliza el nombre del plan de la empresa a uno de los tres niveles. */
export const normalizarPlan = (nombrePlan?: string | null): PlanNovedad | null => {
    const raw = String(nombrePlan ?? '')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    if (raw.includes('CORPORAT')) return 'CORPORATIVO';
    if (raw.includes('NEGOCIO')) return 'NEGOCIO';
    if (raw.includes('EMPRENDEDOR')) return 'EMPRENDEDOR';
    return null;
};

/** Estado de la novedad (sin `estado` = disponible). */
export const estadoDeNovedad = (n: Novedad): EstadoNovedad => n.estado ?? 'DISPONIBLE';

/** `true` si todavía no está habilitada para los clientes. */
export const esProximamente = (n: Novedad): boolean =>
    estadoDeNovedad(n) === 'PROXIMAMENTE';

/** Plataformas de la novedad (sin `plataformas` = solo web). */
export const plataformasDeNovedad = (n: Novedad): Plataforma[] =>
    n.plataformas && n.plataformas.length > 0 ? n.plataformas : ['WEB'];

/** `true` si además del panel web funciona en la app móvil. */
export const estaEnMovil = (n: Novedad): boolean =>
    plataformasDeNovedad(n).includes('MOVIL');

/** Planes donde la novedad está disponible (sin `planes` = todos). */
export const planesDeNovedad = (n: Novedad): PlanNovedad[] =>
    n.planes && n.planes.length > 0 ? n.planes : TODOS_LOS_PLANES;

/** `true` si el plan de la empresa incluye la novedad. */
export const novedadIncluidaEnPlan = (n: Novedad, plan: PlanNovedad | null): boolean => {
    if (!n.planes || n.planes.length === 0) return true;
    if (!plan) return false;
    return n.planes.includes(plan);
};

/** Agrupa por mes (clave 'YYYY-MM'), conservando el orden de `NOVEDADES`. */
export const agruparPorMes = (lista: Novedad[]): Array<[string, Novedad[]]> => {
    const grupos = new Map<string, Novedad[]>();
    for (const n of lista) {
        const mes = n.fecha.slice(0, 7);
        const actual = grupos.get(mes);
        if (actual) actual.push(n);
        else grupos.set(mes, [n]);
    }
    return Array.from(grupos.entries());
};

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** '2026-09' → 'Septiembre 2026'. */
export const etiquetaMes = (clave: string): string => {
    const [anio, mes] = clave.split('-');
    return `${MESES[Number(mes) - 1] ?? ''} ${anio}`.trim();
};

/** Fecha de la novedad más reciente, para el indicador de "sin leer". */
export const ultimaFechaNovedad = (): string =>
    NOVEDADES.reduce((max, n) => (n.fecha > max ? n.fecha : max), '');

const CLAVE_VISTAS = 'NOVEDADES_VISTAS_HASTA';

/** Fecha hasta la que el usuario ya leyó las novedades. */
export const leerUltimaVisita = (): string => {
    try {
        return localStorage.getItem(CLAVE_VISTAS) ?? '';
    } catch {
        return '';
    }
};

export const marcarNovedadesVistas = (): void => {
    try {
        localStorage.setItem(CLAVE_VISTAS, ultimaFechaNovedad());
    } catch {
        /* modo privado o storage bloqueado: el badge simplemente sigue visible */
    }
};

/**
 * `true` si al usuario le queda algo por ver. Es la única condición para que el
 * panel abra las novedades solo: sirve tanto para quien acaba de iniciar sesión
 * como para quien ya estaba dentro cuando se publicó algo nuevo.
 *
 * Se apaga sola: abrir el modal llama a `marcarNovedadesVistas()`, así que la
 * siguiente vez ya no hay nada sin ver y no vuelve a saltar.
 */
export const hayNovedadesSinVer = (): boolean => contarNovedadesSinVer() > 0;

/** Cuántas novedades no ha visto el usuario. */
export const contarNovedadesSinVer = (): number => {
    const desde = leerUltimaVisita();
    if (!desde) return NOVEDADES.length;
    return NOVEDADES.filter((n) => n.fecha > desde).length;
};
