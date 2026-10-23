/**
 * Pantalla "API de Krezka": qué es, las claves, un probador (sandbox) y el
 * código listo para copiar. Pedido de Diego (2026-10-22): que la API tenga su
 * propia pantalla y no solo una sección en Configuración, con ejemplos que se
 * puedan probar sin tocar datos reales y enlace al portal de desarrolladores.
 *
 * Todo lo de acá es puro: las rutas, sus ejemplos y cómo se escribe cada
 * llamada en curl, JavaScript y PHP.
 */

/** Documentación completa en el portal de desarrolladores. */
export const PORTAL_DESARROLLADORES = 'https://developers.falconext.pe/erp';

export type Metodo = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface Ruta {
    id: string;
    metodo: Metodo;
    /** Con `{id}` donde va el id del producto o de la venta. */
    ruta: string;
    titulo: string;
    descripcion: string;
    /** Query de ejemplo (sin el `?`). */
    query?: string;
    /** Cuerpo de ejemplo, en JSON con sangría. */
    cuerpo?: object;
    /** Lleva Idempotency-Key. */
    idempotente?: boolean;
    grupo: 'Catálogo' | 'Stock' | 'Ventas' | 'Clientes' | 'Avisos' | 'Datos';
}

export const RUTAS: Ruta[] = [
    {
        id: 'listar-productos',
        metodo: 'GET',
        ruta: '/products',
        query: 'limit=5&published=true',
        titulo: 'Listar productos',
        descripcion: 'Productos con precio, oferta vigente, fotos, stock disponible por sede y variantes. Filtros: search, category_id, location_id, published, limit, cursor.',
        grupo: 'Catálogo',
    },
    {
        id: 'ver-producto',
        metodo: 'GET',
        ruta: '/products/{id}',
        titulo: 'Ver un producto',
        descripcion: 'Un producto con todo su detalle: variantes (tallas/colores), paquetes, lotes y stock.',
        grupo: 'Catálogo',
    },
    {
        id: 'crear-producto',
        metodo: 'POST',
        ruta: '/products',
        idempotente: true,
        titulo: 'Crear un producto',
        descripcion: 'name y price son obligatorios. El stock inicial queda en tu kardex.',
        cuerpo: { name: 'Polo básico algodón', price: 49.9, sku: 'POLO-001', stock: 10, published_in_store: true },
        grupo: 'Catálogo',
    },
    {
        id: 'editar-producto',
        metodo: 'PATCH',
        ruta: '/products/{id}',
        titulo: 'Editar un producto',
        descripcion: 'Cambia nombre, precio, oferta, categoría o código. El stock no se cambia acá.',
        cuerpo: { price: 45.9, sale_price: 39.9, sale_ends_on: '2026-12-31' },
        grupo: 'Catálogo',
    },
    {
        id: 'ajustar-stock',
        metodo: 'POST',
        ruta: '/products/{id}/stock_adjustments',
        idempotente: true,
        titulo: 'Ajustar el stock',
        descripcion: 'change (cuánto suma o resta) o quantity (cómo queda), con un motivo. Queda en tu kardex.',
        cuerpo: { change: -2, reason: 'damaged', note: 'Se rompieron en el almacén' },
        grupo: 'Stock',
    },
    {
        id: 'crear-venta',
        metodo: 'POST',
        ruta: '/sales',
        idempotente: true,
        titulo: 'Registrar una venta',
        descripcion: 'Emite la boleta o factura igual que tu POS: baja el stock, entra a caja y va a SUNAT. Con RUC sale factura; sales_note no va a SUNAT.',
        cuerpo: {
            customer: { document_type: 'dni', document_number: '12345678', name: 'Ana Pérez' },
            items: [
                { product_id: 123, quantity: 2 },
                { description: 'Envío a domicilio', quantity: 1, unit_price: 10 },
            ],
            payment: { method: 'card', reference: 'MP-998877' },
            external_id: 'WEB-1001',
        },
        grupo: 'Ventas',
    },
    {
        id: 'ver-venta',
        metodo: 'GET',
        ruta: '/sales/{id}',
        titulo: 'Ver una venta',
        descripcion: 'Su estado en SUNAT (pending, accepted, rejected…), el motivo si falló y el PDF.',
        grupo: 'Ventas',
    },
    {
        id: 'crear-venta-libre',
        metodo: 'POST',
        ruta: '/sales',
        idempotente: true,
        titulo: 'Facturar sin catálogo',
        descripcion: 'Si tu web tiene su propio catálogo y stock: manda cada línea con description y unit_price (con IGV). tax: taxed, exempt o unaffected; unit: NIU o ZZ. No mueve stock en Krezka.',
        cuerpo: {
            items: [
                { description: 'Polera algodón talla M', quantity: 2, unit_price: 59 },
                { description: 'Envío a domicilio', quantity: 1, unit_price: 12, unit: 'ZZ' },
            ],
            payment: { method: 'card', reference: 'PAGO-8891' },
            external_id: 'PEDIDO-1001',
        },
        grupo: 'Ventas',
    },
    {
        id: 'anular-venta',
        metodo: 'POST',
        ruta: '/sales/{id}/void',
        idempotente: true,
        titulo: 'Anular una venta',
        descripcion: 'Nota de venta: se anula directo. Boleta o factura aceptada: se emite su nota de crédito. Devuelve el stock y quita el cobro.',
        cuerpo: { reason: 'El cliente devolvió el pedido' },
        grupo: 'Ventas',
    },
    {
        id: 'pdf-venta',
        metodo: 'GET',
        ruta: '/sales/{id}/pdf',
        query: 'format=a4',
        titulo: 'PDF de una venta',
        descripcion: 'El enlace al PDF (a4, ticket o a5), el mismo que imprime tu panel.',
        grupo: 'Ventas',
    },
    {
        id: 'listar-ventas',
        metodo: 'GET',
        ruta: '/sales',
        query: 'limit=10',
        titulo: 'Listar ventas',
        descripcion: 'Las ventas que llegaron por la API, de la más reciente. Filtro: external_id.',
        grupo: 'Ventas',
    },
    {
        id: 'listar-clientes',
        metodo: 'GET',
        ruta: '/customers',
        query: 'search=&limit=10',
        titulo: 'Listar clientes',
        descripcion: 'Busca por nombre, documento, correo o celular. Filtro: document_number.',
        grupo: 'Clientes',
    },
    { id: 'ver-cliente', metodo: 'GET', ruta: '/customers/{id}', titulo: 'Ver un cliente', descripcion: 'Un cliente con su documento y datos de contacto.', grupo: 'Clientes' },
    {
        id: 'crear-cliente',
        metodo: 'POST',
        ruta: '/customers',
        idempotente: true,
        titulo: 'Crear un cliente',
        descripcion: 'document_type (dni, ruc, ce, passport), document_number y name. No se duplica por documento.',
        cuerpo: { document_type: 'ruc', document_number: '20123456789', name: 'Empresa Cliente SAC', email: 'compras@cliente.pe', phone: '987654321' },
        grupo: 'Clientes',
    },
    {
        id: 'editar-cliente',
        metodo: 'PATCH',
        ruta: '/customers/{id}',
        titulo: 'Editar un cliente',
        descripcion: 'Nombre, correo, celular o dirección. El documento no se cambia.',
        cuerpo: { email: 'nuevo@cliente.pe' },
        grupo: 'Clientes',
    },
    {
        id: 'crear-webhook',
        metodo: 'POST',
        ruta: '/webhook_endpoints',
        titulo: 'Recibir avisos (webhook)',
        descripcion: 'Tu servidor recibe un aviso firmado cuando SUNAT acepta, observa o rechaza una venta, o cuando se anula. Guarda el secret: se muestra una sola vez.',
        cuerpo: { url: 'https://tu-web.pe/krezka/avisos', events: ['sale.accepted', 'sale.rejected', 'sale.voided'] },
        grupo: 'Avisos',
    },
    { id: 'listar-webhooks', metodo: 'GET', ruta: '/webhook_endpoints', titulo: 'Tus webhooks', descripcion: 'Los endpoints registrados (sin el secret).', grupo: 'Avisos' },
    { id: 'probar-webhook', metodo: 'POST', ruta: '/webhook_endpoints/{id}/test', titulo: 'Probar un webhook', descripcion: 'Manda un aviso de ejemplo firmado a tu servidor (id we_…).', grupo: 'Avisos' },
    { id: 'borrar-webhook', metodo: 'DELETE', ruta: '/webhook_endpoints/{id}', titulo: 'Borrar un webhook', descripcion: 'Deja de mandar avisos a ese endpoint.', grupo: 'Avisos' },
    {
        id: 'crear-categoria',
        metodo: 'POST',
        ruta: '/categories',
        idempotente: true,
        titulo: 'Crear categoría',
        descripcion: 'Si ya existe con ese nombre, la respuesta trae su id.',
        cuerpo: { name: 'Bebidas' },
        grupo: 'Datos',
    },
    {
        id: 'crear-marca',
        metodo: 'POST',
        ruta: '/brands',
        idempotente: true,
        titulo: 'Crear marca',
        descripcion: 'Si ya existe con ese nombre, la respuesta trae su id.',
        cuerpo: { name: 'Inca Kola' },
        grupo: 'Datos',
    },
    { id: 'sedes', metodo: 'GET', ruta: '/locations', titulo: 'Sedes', descripcion: 'Tus sedes, para location_id.', grupo: 'Datos' },
    { id: 'categorias', metodo: 'GET', ruta: '/categories', titulo: 'Categorías', descripcion: 'Tus categorías, para category_id.', grupo: 'Datos' },
    { id: 'marcas', metodo: 'GET', ruta: '/brands', titulo: 'Marcas', descripcion: 'Tus marcas, para brand_id.', grupo: 'Datos' },
    { id: 'unidades', metodo: 'GET', ruta: '/units', titulo: 'Unidades', descripcion: 'Unidades de medida de SUNAT, para unit.', grupo: 'Datos' },
];

export const rutaPorId = (id: string): Ruta => RUTAS.find((r) => r.id === id) ?? RUTAS[0];

export const necesitaId = (r: Ruta) => r.ruta.includes('{id}');

/** La URL completa, con el id y la query puestos. */
export const urlDe = (base: string, r: Ruta, id: string, query: string): string => {
    const ruta = r.ruta.replace('{id}', encodeURIComponent(id.trim() || '{id}'));
    const q = query.trim().replace(/^\?/, '');
    return `${base.replace(/\/+$/, '')}${ruta}${q ? `?${q}` : ''}`;
};

export const tipoDeClave = (clave: string): 'test' | 'live' | null =>
    clave.startsWith('sk_test_') ? 'test' : clave.startsWith('sk_live_') ? 'live' : null;

/** El cuerpo escrito por el usuario: JSON válido o el motivo por el que no lo es. */
export const leerCuerpo = (texto: string): { ok: true; valor: unknown } | { ok: false; error: string } => {
    if (!texto.trim()) return { ok: true, valor: undefined };
    try {
        return { ok: true, valor: JSON.parse(texto) };
    } catch (e: any) {
        return { ok: false, error: `El cuerpo no es un JSON válido: ${e?.message ?? 'revisa comas y comillas'}` };
    }
};

export type Lenguaje = 'curl' | 'javascript' | 'php';

const CLAVE_EJEMPLO = 'TU_CLAVE';

/** La misma llamada, lista para copiar en el lenguaje elegido. */
export const codigoPara = (lenguaje: Lenguaje, r: Ruta, url: string, cuerpo?: unknown): string => {
    const json = cuerpo === undefined ? undefined : JSON.stringify(cuerpo, null, 2);
    if (lenguaje === 'curl') {
        const lineas = [`curl -X ${r.metodo} "${url}"`, `  -H "Authorization: Bearer ${CLAVE_EJEMPLO}"`];
        if (json) lineas.push('  -H "Content-Type: application/json"');
        if (r.idempotente) lineas.push('  -H "Idempotency-Key: $(uuidgen)"');
        if (json) lineas.push(`  -d '${json.replace(/'/g, "'\\''")}'`);
        return lineas.join(' \\\n');
    }
    if (lenguaje === 'javascript') {
        const headers = [`    Authorization: 'Bearer ${CLAVE_EJEMPLO}',`];
        if (json) headers.push(`    'Content-Type': 'application/json',`);
        if (r.idempotente) headers.push(`    'Idempotency-Key': crypto.randomUUID(),`);
        return [
            `const res = await fetch('${url}', {`,
            `  method: '${r.metodo}',`,
            `  headers: {`,
            ...headers,
            `  },`,
            ...(json ? [`  body: JSON.stringify(${json.replace(/\n/g, '\n  ')}),`] : []),
            `});`,
            `const data = await res.json();`,
            `if (!res.ok) console.error(data.error.message); // dice qué campo y qué hacer`,
        ].join('\n');
    }
    const headers = [`    'Authorization: Bearer ${CLAVE_EJEMPLO}',`];
    if (json) headers.push(`    'Content-Type: application/json',`);
    if (r.idempotente) headers.push(`    'Idempotency-Key: ' . bin2hex(random_bytes(16)),`);
    return [
        `<?php`,
        `$ch = curl_init('${url}');`,
        `curl_setopt_array($ch, [`,
        `  CURLOPT_CUSTOMREQUEST => '${r.metodo}',`,
        `  CURLOPT_RETURNTRANSFER => true,`,
        `  CURLOPT_HTTPHEADER => [`,
        ...headers,
        `  ],`,
        ...(json ? [`  CURLOPT_POSTFIELDS => json_encode(${phpArray(cuerpo, 1)}),`] : []),
        `]);`,
        `$data = json_decode(curl_exec($ch), true);`,
    ].join('\n');
};

/** Un valor JSON escrito como arreglo de PHP. */
const phpArray = (v: unknown, nivel: number): string => {
    const sangria = '  '.repeat(nivel + 1);
    const cierre = '  '.repeat(nivel);
    if (Array.isArray(v)) return `[\n${v.map((x) => `${sangria}${phpArray(x, nivel + 1)}`).join(',\n')}\n${cierre}]`;
    if (v && typeof v === 'object') {
        return `[\n${Object.entries(v as Record<string, unknown>)
            .map(([k, x]) => `${sangria}'${k}' => ${phpArray(x, nivel + 1)}`)
            .join(',\n')}\n${cierre}]`;
    }
    if (typeof v === 'string') return `'${v.replace(/'/g, "\\'")}'`;
    return String(v);
};

/** Respuesta del probador, ya formateada para mostrar. */
export interface Respuesta {
    estado: number;
    ms: number;
    cuerpo: string;
}
