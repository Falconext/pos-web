/**
 * Comprar por caja cuando el stock se lleva en unidades.
 *
 * Es el caso de cualquier bodega o distribuidora: "compro en caja y vendo en
 * unidades". Lo que la empresaria sabe al recibir la mercadería son dos cosas
 * —cuántas cajas y cuánto pagó por caja— y lo que el sistema necesita son
 * otras dos: cuántas unidades entran al almacén y a qué costo cada una. Esta
 * es la conversión entre ambas.
 *
 * El costo del paquete SIEMPRE se habla CON IGV, que es como viene en la
 * boleta del proveedor. La conversión al modo de la compra (con o sin IGV) se
 * hace acá, no en la pantalla.
 *
 * Vive aparte del modal para poder probarse: dentro de un componente de 1700
 * líneas la regla solo se podía verificar reimplementándola.
 */

export interface ModoIgv {
  /** El producto paga IGV. Un exonerado/inafecto no se divide entre 1.18. */
  esGravado: boolean;
  /** La compra se captura con los precios ya con IGV embebido. */
  compraIncluyeIgv: boolean;
}

export interface LineaEnUnidades {
  /** Unidades que entran al almacén. El stock y el kardex van en unidades. */
  cantidad: number;
  /** Costo de UNA unidad: es contra lo que se mide el margen al vender. */
  precioUnitario: number;
  subtotal: number;
  /** Cajas, para rotular la línea sin volver a dividir. */
  paquetes: number;
}

/** Costo de una unidad a partir de lo que costó la caja completa. */
export const costoUnitarioDesdePaquete = (
  costoPaqueteConIgv: number,
  unidadesPorPaquete: number,
  { esGravado, compraIncluyeIgv }: ModoIgv,
): number => {
  const costoDeLaLinea =
    compraIncluyeIgv || !esGravado
      ? costoPaqueteConIgv
      : costoPaqueteConIgv / 1.18;
  const unidades = Number(unidadesPorPaquete) || 0;
  // 4 decimales: con cajas grandes, redondear a 2 mueve el costo lo suficiente
  // como para que el margen salga mal.
  return unidades > 0 ? Number((costoDeLaLinea / unidades).toFixed(4)) : 0;
};

/** De "5 cajas a S/ 36 cada una" a "30 unidades a S/ 6.00". */
export const expandirPaqueteAUnidades = (
  entrada: {
    paquetes: number;
    costoPaqueteConIgv: number;
    unidadesPorPaquete: number;
  } & ModoIgv,
): LineaEnUnidades => {
  const paquetes = Math.max(0, Number(entrada.paquetes) || 0);
  const unidadesPorPaquete = Math.max(1, Number(entrada.unidadesPorPaquete) || 1);
  const precioUnitario = costoUnitarioDesdePaquete(
    Math.max(0, Number(entrada.costoPaqueteConIgv) || 0),
    unidadesPorPaquete,
    entrada,
  );
  const cantidad = paquetes * unidadesPorPaquete;
  return {
    cantidad,
    precioUnitario,
    subtotal: Number((cantidad * precioUnitario).toFixed(4)),
    paquetes,
  };
};

/**
 * Rótulo de la línea. Lleva las cajas REALES, no un "1 paq." fijo: la línea
 * queda así en el kardex y en el detalle de la compra, y decir "1 paquete"
 * cuando son 5 es describir mal lo que entró.
 */
export const etiquetaDePaquete = (
  descripcionBase: string,
  paquetes: number,
  unidadesPorPaquete: number,
): string =>
  unidadesPorPaquete > 1
    ? `${descripcionBase} (${paquetes} paq. x${unidadesPorPaquete})`
    : descripcionBase;

export interface DesglosePaquete {
  /** Unidades sueltas que entran al almacén. */
  unidades: number;
  /** Lo que costó cada unidad, CON IGV: es la cuenta que ella puede verificar
   *  de cabeza contra la boleta (S/ 36 la caja de 6 → S/ 6.00). */
  precioUnitarioConIgv: number;
  /** Lo que se le paga al proveedor por estas cajas, CON IGV. */
  total: number;
}

/**
 * El desglose que se le MUESTRA al usuario mientras escribe.
 *
 * Va con IGV a propósito, aunque la línea de la compra se guarde en neto: el
 * rótulo pide el costo "tal como sale en la boleta del proveedor", así que las
 * cifras de al lado tienen que estar en esa misma moneda. Si una dice S/ 6.00
 * y la otra S/ 5.08 para la misma caja, el usuario no sabe cuál creer.
 *
 * Existe para que el bloque del escaneo y la fila manual muestren lo mismo:
 * antes cada uno tenía su propia cuenta escrita en el JSX y daban distinto.
 */
export const desglosePorPaquete = (
  paquetes: number,
  costoPaqueteConIgv: number,
  unidadesPorPaquete: number,
): DesglosePaquete => {
  const cajas = Math.max(0, Number(paquetes) || 0);
  const porPaquete = Math.max(0, Number(costoPaqueteConIgv) || 0);
  const porCaja = Math.max(1, Number(unidadesPorPaquete) || 1);
  return {
    unidades: cajas * porCaja,
    precioUnitarioConIgv: Number((porPaquete / porCaja).toFixed(2)),
    total: Number((cajas * porPaquete).toFixed(2)),
  };
};
