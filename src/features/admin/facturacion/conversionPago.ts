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

/** Lo mínimo para decidir cuánto precargar como "recibido". */
export interface OrigenCobro extends OrigenConversion {
  mtoImpVenta?: number | null;
}

/**
 * Cuánto poner en el campo "recibido" del modal de pago.
 *
 * Al CONVERTIR tiene que cubrir el TOTAL: lo que el documento de origen ya
 * cobró más lo que se cobra en este momento. Precargar solo lo ya cobrado
 * funcionaba mientras el origen estuviera pagado entero (pagado === total ⇒ el
 * modal daba "Exacto"); con un cobro parcial —el caso normal de una Orden de
 * Trabajo, que casi siempre lleva adelanto— quedaba en "FALTA S/ x" y EMITIR
 * bloqueado: no había forma de convertirla. El backend sigue registrando en
 * caja solo la diferencia, así que el adelanto no se cobra dos veces.
 *
 * Al EDITAR se precarga lo que el documento ya tenía pagado: editar no es
 * cobrar de nuevo.
 *
 * Si hereda el crédito el total no aplica: ese saldo se financia con un
 * cronograma, no entra a caja ahora.
 */
export const recibidoInicialDeConversion = (
  origen: OrigenCobro,
  opts: { esConversion: boolean },
): number => {
  const total = Math.max(0, Number(origen?.mtoImpVenta || 0));
  const pagado = Math.max(0, total - Math.max(0, Number(origen?.saldo || 0)));
  return opts.esConversion && !heredaCredito(origen) ? total : pagado;
};
