/**
 * D2 — el descuento por pack, calculado en el carrito.
 *
 * Es el mismo cálculo que hace el backend en `leads/reglas-descuento.ts`, y
 * tiene que dar EXACTAMENTE lo mismo: si el carrito dice S/ 127 y la IA dice
 * S/ 137 por los mismos productos, el cliente deja de creerle a los dos.
 *
 * Por eso trabaja en céntimos enteros igual que allá: con decimales,
 * 0.1 + 0.2 no es 0.3 y el total se descuadra cada tantas ventas.
 *
 * Los tramos NO viven aquí: llegan con los datos de la tienda, porque cada
 * empresa tiene los suyos.
 */

export interface TramoDescuento {
  descuento: number;
  unidades: number;
  /** El total tiene que SUPERAR este monto; igualarlo no basta. */
  totalMayorQue: number;
}

export interface ReglasDescuento {
  precioUnitarioMinimo: number;
  envioCuentaEnTotal: boolean;
  tramos: TramoDescuento[];
}

export interface ItemCarrito {
  precioUnitario: number | string;
  cantidad: number | string;
}

export interface ResultadoDescuento {
  subtotal: number;
  envio: number;
  total: number;
  unidadesValidas: number;
  descuento: number;
  montoAPagar: number;
  /** Qué le falta para el siguiente escalón, si está a una o dos unidades. */
  faltaParaSiguiente: { unidades: number; descuento: number } | null;
}

const MAX_UNIDADES_A_SUGERIR = 2;
const aCentimos = (soles: number) => Math.round(soles * 100);
const aSoles = (centimos: number) => centimos / 100;

export function calcularDescuento(
  items: ItemCarrito[],
  envio: number,
  reglas?: ReglasDescuento | null,
): ResultadoDescuento {
  const subtotalC = items.reduce(
    (acc, i) =>
      acc + aCentimos(Number(i.precioUnitario) || 0) * Math.max(0, Number(i.cantidad) || 0),
    0,
  );
  const envioC = aCentimos(Number(envio) || 0);
  const totalC = subtotalC + envioC;

  const vacio: ResultadoDescuento = {
    subtotal: aSoles(subtotalC),
    envio: aSoles(envioC),
    total: aSoles(totalC),
    unidadesValidas: 0,
    descuento: 0,
    montoAPagar: aSoles(totalC),
    faltaParaSiguiente: null,
  };
  // Una tienda sin tramos configurados simplemente no hace descuentos.
  if (!reglas?.tramos?.length) return vacio;

  const baseC = reglas.envioCuentaEnTotal ? totalC : subtotalC;
  const minimoC = aCentimos(reglas.precioUnitarioMinimo);
  const unidadesValidas = items.reduce(
    (acc, i) =>
      aCentimos(Number(i.precioUnitario) || 0) > minimoC
        ? acc + Math.max(0, Number(i.cantidad) || 0)
        : acc,
    0,
  );

  const ordenados = [...reglas.tramos].sort((a, b) => b.descuento - a.descuento);
  const alcanzado = ordenados.find(
    (t) => unidadesValidas >= t.unidades && baseC > aCentimos(t.totalMayorQue),
  );
  const descuentoC = alcanzado ? aCentimos(alcanzado.descuento) : 0;

  return {
    ...vacio,
    unidadesValidas,
    descuento: aSoles(descuentoC),
    montoAPagar: aSoles(totalC - descuentoC),
    faltaParaSiguiente: siguienteAlAlcance(
      ordenados,
      unidadesValidas,
      baseC,
      alcanzado?.descuento ?? 0,
    ),
  };
}

/**
 * El tramo más bajo que todavía no alcanza, cuando solo le faltan unidades y
 * son pocas. Si además le falta dinero no se sugiere: decirle "te falta una
 * unidad" cuando también le faltan S/ 70 es empujarlo a una compra que no
 * esperaba.
 */
function siguienteAlAlcance(
  tramosOrdenados: TramoDescuento[],
  unidadesValidas: number,
  baseC: number,
  descuentoActual: number,
): { unidades: number; descuento: number } | null {
  const candidatos = tramosOrdenados
    .filter((t) => t.descuento > descuentoActual)
    .sort((a, b) => a.descuento - b.descuento);

  for (const t of candidatos) {
    if (baseC <= aCentimos(t.totalMayorQue)) continue;
    const faltan = t.unidades - unidadesValidas;
    if (faltan > 0 && faltan <= MAX_UNIDADES_A_SUGERIR) {
      return { unidades: faltan, descuento: t.descuento };
    }
  }
  return null;
}

export const soles = (monto: number): string => `S/ ${monto.toFixed(2)}`;

/**
 * El pedido, escrito para que el asistente del chat lo entienda y lo retome
 * sin que el cliente tenga que repetirlo.
 *
 * El prefijo "PEDIDO WEB" es la señal: con eso la IA sabe que no es una
 * consulta suelta sino un carrito ya armado.
 */
export function mensajeDePedido(
  items: { nombre?: string; descripcion?: string; precioUnitario: number | string; cantidad: number | string }[],
  calculo: ResultadoDescuento,
): string {
  const lineas = ['PEDIDO WEB', ''];
  for (const i of items) {
    const nombre = i.nombre || i.descripcion || 'Producto';
    lineas.push(`${i.cantidad}x ${nombre} - ${soles(Number(i.precioUnitario) || 0)}`);
  }
  lineas.push('', `Subtotal: ${soles(calculo.subtotal)}`);
  if (calculo.descuento > 0) {
    lineas.push(`Descuento por pack: ${soles(calculo.descuento)}`);
  }
  // El envío NO va aquí: depende del distrito, y eso lo pregunta el chat.
  lineas.push('', 'Quiero coordinar la entrega.');
  return lineas.join('\n');
}

/**
 * El enlace de WhatsApp con el pedido ya escrito.
 *
 * Se le antepone el código de país si no lo trae: el campo del panel sugiere
 * "+51 999 999 999", pero quien escriba solo los 9 dígitos generaba un enlace
 * a un número inexistente, y el fallo es mudo — WhatsApp abre y dice que ese
 * número no existe, y el negocio nunca se entera de los pedidos que perdió.
 */
export function enlaceDePedido(numero: string, mensaje: string): string {
  const digitos = String(numero || '').replace(/\D/g, '');
  const limpio = digitos.startsWith('51') ? digitos : `51${digitos}`;
  return `https://wa.me/${limpio}?text=${encodeURIComponent(mensaje)}`;
}
