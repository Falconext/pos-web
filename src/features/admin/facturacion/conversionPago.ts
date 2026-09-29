/**
 * Qué condición de pago hereda un informal al convertirse en comprobante.
 *
 * Vive aparte del ViewModel para poder probarse de verdad: mientras la regla
 * estuvo embebida en el hook, la prueba la reimplementaba y no tocaba una línea
 * del código que corre en producción.
 */

/** Lo mínimo que hace falta saber del documento de origen. */
export interface OrigenConversion {
  formaPagoTipo?: string | null;
  /** Lo que todavía se debe. 0, null o negativo = está pagado. */
  saldo?: number | null;
}

/**
 * ¿La conversión mantiene la condición de crédito?
 *
 * Solo si todavía queda saldo. Una venta a crédito ya cobrada entera no tiene
 * nada que financiar, y heredarle el crédito dejaba al empresario sin poder
 * emitir: el modal pedía un cronograma por un saldo inexistente y la emisión
 * moría con "todas las cuotas deben tener monto mayor a cero".
 * (Reportado por OWENSOFT al convertir NV01-297, S/280 ya cobrados.)
 */
export const heredaCredito = (origen: OrigenConversion): boolean => {
  const saldoPendiente = Math.max(0, Number(origen?.saldo || 0));
  return (
    String(origen?.formaPagoTipo || '').toUpperCase() === 'CREDITO' &&
    saldoPendiente > 0
  );
};
