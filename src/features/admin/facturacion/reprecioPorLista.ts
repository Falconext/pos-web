// Qué líneas del carrito se repreciar cuando el cajero cambia de lista de
// precios, y a qué precio queda cada una.
//
// Vive aparte del ViewModel porque es donde estuvo el error caro: el POS
// cambiaba de lista, el catálogo mostraba el precio nuevo y la línea ya
// cargada se quedaba con el viejo — se servía en el bar a precio de licorería.

export interface LineaReprecio {
    /** Índice en `productsInvoice`, para poder actualizar esa línea. */
    index: number;
    productoId: number;
    /** '' = unidad base; si no, el código de la presentación (paquete). */
    presentacionCodigo: string;
    /** Unidades que trae el paquete; 1 si la línea es por unidad. */
    uPaquete: number;
}

/**
 * Las líneas que tienen precio de lista. Quedan fuera los combos y los ítems
 * libres: no son productos del catálogo, así que ninguna lista los tarifa.
 */
export function lineasReprecificables(items: any[]): LineaReprecio[] {
    return (items || []).reduce<LineaReprecio[]>((acc, item: any, index: number) => {
        const productoId = Number(item?.productoId ?? item?.id);
        if (!productoId || item?.comboId || item?.esItemLibre) return acc;

        const unidades = Number(item?.unidadesPorPaquete) || 1;
        const esPaquete = Boolean(item?.esPaquete) && unidades > 1;
        // `presentacionCodigo` es la identidad de la presentación elegida. Las
        // líneas viejas (o las de un carrito a medio migrar) no lo traen: para
        // esas se cae a `codigoBarras`, que es lo que guardaba la tarjeta de
        // paquete. Leerlo SOLO de `codigoBarras` era el bug: cuando la cajera
        // cambiaba la presentación desde el desplegable, ese campo seguía
        // siendo el del producto y la lista devolvía el precio de la unidad.
        const codigoPresentacion = esPaquete
            ? String(item?.presentacionCodigo ?? item?.codigoBarras ?? '')
            : String(item?.presentacionCodigo ?? '');
        acc.push({
            index,
            productoId,
            presentacionCodigo: codigoPresentacion,
            uPaquete: esPaquete ? unidades : 1,
        });
        return acc;
    }, []);
}

/**
 * Precio base de la línea a partir del precio que devuelve la lista.
 *
 * Para un paquete la lista fija el precio del PACK completo, pero la línea
 * guarda el precio por unidad (la cantidad del carrito está en unidades).
 */
export function precioBaseDeLinea(precioDeLista: number, uPaquete: number): number {
    const unidades = Number(uPaquete) || 1;
    return Number(precioDeLista) / (unidades > 0 ? unidades : 1);
}

/** Un precio solo se aplica si es un número positivo; si no, la línea no se toca. */
export function precioAplicable(valor: unknown): boolean {
    const n = Number(valor);
    return valor != null && Number.isFinite(n) && n > 0;
}

/**
 * De las líneas reprecificables, cuáles se tocan realmente.
 *
 * El reprecio por lista se dispara en dos situaciones distintas y no deben
 * tratarse igual:
 *
 * - **Automático**, al resolverse la lista del cliente/sede nada más cargar la
 *   pantalla. Acá las líneas traídas de un comprobante ya emitido CONSERVAN su
 *   precio: abrir una venta vieja para corregir el nombre del cliente no puede
 *   cambiarle el total sin que nadie lo pida.
 * - **Manual**, cuando el cajero elige otra tarifa. Ahí sí se aplican a todo:
 *   es una decisión suya, con causa visible en pantalla.
 */
export function lineasAReprecificar<T extends { index: number }>(
    lineas: T[],
    carrito: any[],
    opts?: { respetarPrecioDelDocumento?: boolean },
): T[] {
    if (!opts?.respetarPrecioDelDocumento) return lineas;
    return lineas.filter((l) => !carrito?.[l.index]?.precioDelDocumento);
}
