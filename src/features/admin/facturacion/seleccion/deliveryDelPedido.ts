/**
 * El delivery de un pedido del chat no se factura (2026-10-22).
 *
 * El bot de IA de Ventas mete el envío en la nota de venta como una línea
 * libre ("ENVÍO DELIVERY") para que cuadre con la cotización y el adelanto.
 * La contadora de Hierba Sana pidió que el delivery NO sume al total de la
 * boleta ni de la guía: queda como observación. El backend lo saca al emitir
 * (delivery-del-pedido.ts); esto hace que el panel muestre desde el inicio el
 * mismo total que va a salir, y que lo ya cobrado no aparezca como un vuelto.
 *
 * Solo para notas que armó el bot (`pedidoDelChat`, lo marca el listado).
 */

export const esLineaDeDelivery = (det: any): boolean =>
    (det?.productoId === null || det?.productoId === undefined) &&
    /^\s*ENV[IÍ]O\b/i.test(String(det?.descripcion ?? ''));

const montoDeLinea = (det: any): number => {
    const conIgv = Number(det?.mtoValorVenta ?? 0) + Number(det?.igv ?? 0);
    if (conIgv > 0) return conIgv;
    return Number(det?.mtoPrecioUnitario ?? 0) * Number(det?.cantidad ?? 1);
};

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * La nota tal como se va a facturar: sin la línea de delivery, con el total y
 * el saldo de la mercadería y el delivery en las observaciones. Lo cobrado se
 * cuenta primero contra la mercadería: si pagó 20 de 46 (31 + 15 de envío),
 * a la boleta le quedan 11 y los 15 los cobra el repartidor.
 */
export function notaParaFacturar<T extends Record<string, any>>(item: T): T {
    if (!item?.pedidoDelChat) return item;
    const detalles: any[] = item.detalles ?? [];
    const delivery = detalles.filter(esLineaDeDelivery);
    const resto = detalles.filter((d) => !esLineaDeDelivery(d));
    if (!delivery.length || !resto.length) return item;

    const monto = r2(delivery.reduce((a, d) => a + montoDeLinea(d), 0));
    const que = delivery.length === 1 ? String(delivery[0].descripcion).trim() : 'Servicio de delivery';
    const nota = `${que}: S/ ${monto.toFixed(2)} (servicio de delivery, se cobra aparte y no forma parte del total)`;
    const previa = String(item.observaciones ?? '').trim();
    const total = r2(Math.max(0, Number(item.mtoImpVenta ?? 0) - monto));
    const saldo = r2(Math.max(0, Number(item.saldo ?? 0) - monto));

    return {
        ...item,
        detalles: resto,
        mtoImpVenta: total,
        saldo,
        estadoPago: saldo <= 0 ? 'COMPLETADO' : saldo < total ? 'PAGO_PARCIAL' : item.estadoPago,
        observaciones: previa.includes(nota) ? previa : previa ? `${previa}\n${nota}` : nota,
        deliveryFueraDelTotal: monto,
    };
}
