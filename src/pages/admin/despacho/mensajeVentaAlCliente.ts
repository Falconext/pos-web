/**
 * El mensaje que el dueño le manda al cliente desde SU WhatsApp cuando cerró
 * la venta por fuera del bot.
 *
 * Hierba Sana (27-10): vende por su número personal, registra la venta en
 * Krezka y quiere avisarle al cliente con un mensaje armado: el comprobante,
 * los datos de Shalom y la clave de recojo SOLO si ya pagó todo, más el
 * aviso de que el asesor de ventas (la IA, desde el número del negocio) le
 * hará el seguimiento. Por eso es solo para quien tiene IA de Ventas.
 *
 * La clave de recojo es la llave del paquete: dársela a quien todavía debe es
 * entregarle la mercadería sin cobrar.
 */

export interface DatosMensajeVenta {
    cliente: string;
    referencia: string;
    /** "Boleta", "Nota de venta"… */
    tipoDocumento: string;
    pdfUrl?: string | null;
    courier?: string | null;
    agenciaDestino?: string | null;
    nroOrden?: string | null;
    claveOrden?: string | null;
    claveEnvio?: string | null;
    saldo: number;
    negocio: string;
}

const vacio = (v?: string | null) => !v || v.trim() === '' || v.trim() === '—';

/** "PEREZ GOMEZ, ANA LUCIA" → "Ana"; "ana lucía pérez" → "Ana". */
export function primerNombre(cliente: string): string {
    const limpio = String(cliente ?? '').trim();
    if (!limpio || /^clientes? varios$/i.test(limpio) || /^wsp\b/i.test(limpio)) return '';
    const nombres = limpio.includes(',') ? limpio.split(',')[1] : limpio;
    const primero = nombres.trim().split(/\s+/)[0] ?? '';
    return primero ? primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase() : '';
}

export function mensajeVentaAlCliente(d: DatosMensajeVenta): string {
    const nombre = primerNombre(d.cliente);
    const debe = Number(d.saldo ?? 0) > 0.01;
    const esShalom = /SHALOM/i.test(String(d.courier ?? ''));
    const lineas: string[] = [
        `Hola${nombre ? ` ${nombre}` : ''} 👋, gracias por tu compra en ${d.negocio} 🌿`,
        '',
        `🧾 Tu ${d.tipoDocumento.toLowerCase()} ${d.referencia}${d.pdfUrl ? `: ${d.pdfUrl}` : ''}`,
    ];

    if (esShalom && !vacio(d.nroOrden)) {
        // "Shalom Arequipa Av. Parra" → "agencia Arequipa Av. Parra": sin repetir Shalom.
        const agencia = vacio(d.agenciaDestino) ? '' : String(d.agenciaDestino).trim().replace(/^shalom\s+/i, '');
        lineas.push('', `🚚 Tu pedido va por Shalom${agencia ? ` a la agencia ${agencia}` : ''}`);
        lineas.push(`N° de orden: ${d.nroOrden}`);
        if (!vacio(d.claveOrden)) lineas.push(`Código de orden: ${d.claveOrden}`);
    }

    if (debe) {
        lineas.push('', `💳 Saldo pendiente: S/ ${Number(d.saldo).toFixed(2)}`);
        if (esShalom) lineas.push('Apenas completes el pago te enviamos la clave para recoger tu pedido.');
    } else if (esShalom && !vacio(d.claveEnvio)) {
        lineas.push('', `🔑 Clave de recojo: ${d.claveEnvio}`, 'No la compartas: con ella se entrega tu paquete.');
    }

    lineas.push(
        '',
        `Nuestro asesor de ventas de ${d.negocio} te escribirá para hacer el seguimiento de tu pedido hasta que llegue a su destino. ¡Gracias por tu confianza! 🙌`,
    );
    return lineas.join('\n');
}

/**
 * El enlace que abre WhatsApp con el mensaje. Va a api.whatsapp.com y no a
 * wa.me: el redireccionamiento de wa.me cambia cada emoji por "�" (probado
 * 27-10), y este mensaje lleva varios.
 */
export function enlaceWhatsApp(celular: string, mensaje: string): string {
    const digitos = String(celular || '').replace(/\D/g, '');
    const numero = digitos.startsWith('51') ? digitos : `51${digitos}`;
    return `https://api.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(mensaje)}`;
}

const TIPO_DOCUMENTO: Record<string, string> = {
    BOLETA: 'Boleta',
    FACTURA: 'Factura',
    NOTA_VENTA: 'Nota de venta',
    TICKET: 'Ticket',
};

export function nombreDelDocumento(tipo: string): string {
    return TIPO_DOCUMENTO[tipo] ?? 'Comprobante';
}
