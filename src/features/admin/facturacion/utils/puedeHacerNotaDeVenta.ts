/**
 * ¿Esta Orden de Trabajo puede convertirse en Nota de venta?
 *
 * Vive fuera del JSX porque la versión anterior costó un cliente entero sin
 * que nadie lo notara. La condición incluía `saldo <= 0` —solo órdenes ya
 * cobradas— y LINNA MODA cobra CONTRAENTREGA: sus dos órdenes estaban en
 * PAGO_PARCIAL, así que el botón no aparecía nunca. Lo reportaron como "aún
 * no se pudo habilitar la opción", porque desde su lado la función no
 * existía.
 *
 * Una orden con saldo SÍ se convierte: el saldo viaja a la nota como cuenta
 * por cobrar y se cobra al entregar, que es justo lo que pide el
 * contraentrega. La nota tiene que existir ANTES de la entrega porque es con
 * ella que se programa el envío.
 */
export interface OrdenConvertible {
  tipoDoc?: unknown;
  convertidoA?: unknown;
  estadoEnvioSunat?: unknown;
}

export const puedeHacerNotaDeVenta = (
  item: OrdenConvertible | null | undefined,
  estadoEnvioSunat?: unknown,
): boolean => {
  if (!item) return false;
  if (String(item.tipoDoc) !== 'OT') return false;
  // Una orden anulada sería una venta por un trabajo dado de baja.
  const estado = estadoEnvioSunat ?? item.estadoEnvioSunat;
  if (estado === 'ANULADO') return false;
  // Ya convertida: una segunda nota duplicaría la venta, el stock y la
  // comisión. El backend lo rechaza igual; acá se esconde el botón para que
  // nadie llegue al error.
  if (item.convertidoA) return false;
  return true;
};
