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
    // ── Anuncio ──────────────────────────────────────────────────────────────
    {
        id: '2026-09-mercado-pago',
        fecha: '2026-09-11',
        titulo: 'Mercado Pago llega el 25 de noviembre a todas las tiendas virtuales',
        descripcion:
            'Desde el 25 de noviembre tus clientes podrán pagar con tarjeta, Yape y billeteras en tu tienda virtual a través de Mercado Pago, con el cobro conciliado solo en tu caja. Niky ya lo tiene en la mira: te avisamos aquí el mismo día del lanzamiento.',
        categoria: 'Tienda virtual',
        tipo: 'NUEVO',
        // La tienda virtual (tieneTienda) solo existe en Negocio y Corporativo.
        planes: ['NEGOCIO', 'CORPORATIVO'],
        estado: 'PROXIMAMENTE',
        donde: 'Tienda Virtual → Configuración → Medios de pago (desde el 25/11)',
    },

    // ── 11 de septiembre ─────────────────────────────────────────────────────
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
        titulo: 'Las observaciones de la venta se recuerdan solas',
        descripcion:
            'Lo que escribes en Observaciones al configurar una venta se guarda automáticamente y se propone en la siguiente, para no tipear siempre lo mismo. Un botón Limpiar lo borra cuando quieras.',
        categoria: 'Facturación',
        tipo: 'MEJORA',
        donde: 'Crear comprobante → Configurar venta → Observaciones',
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
