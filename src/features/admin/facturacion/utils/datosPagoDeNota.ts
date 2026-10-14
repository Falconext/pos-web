/**
 * Datos de cobro y condiciones de un comprobante informal, para que el POS los
 * reciba tal cual al EDITARLO o al CONVERTIRLO.
 *
 * Al convertir no viajaban, así que el POS volvía a pedir el método de pago de
 * cero y perdía el descuento global, la moneda y el crédito del documento
 * original. Vive acá y no dentro de una pantalla porque lo usan la lista de
 * notas informales y la de Órdenes de Trabajo, y las dos tienen que mandar
 * exactamente lo mismo: si una se queda corta, la conversión pierde datos solo
 * desde esa pantalla y es un bug difícil de ver.
 */
export const datosPagoDeNota = (item: any) => ({
    vendedorCampoId: item?.vendedorCampoId,
    vendedorCampoNombre: item?.vendedorCampoNombre,
    medioPago: item?.medioPago,
    paymentDetails: item?.paymentDetails,
    saldo: item?.saldo,
    mtoImpVenta: item?.mtoImpVenta,
    estadoPago: item?.estadoPago,
    mtoDescuentoGlobal: item?.mtoDescuentoGlobal,
    formaPagoTipo: item?.formaPagoTipo,
    fechaVencimientoCredito: item?.fechaVencimientoCredito,
    cuotas: item?.cuotas,
    tipoMoneda: item?.tipoMoneda,
    tipoCambio: item?.tipoCambio,
});
