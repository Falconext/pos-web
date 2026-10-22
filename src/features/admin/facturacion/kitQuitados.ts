/**
 * Quitar productos de un kit en el carrito (kit vendido como una línea).
 * Pedido de florería: "el Detalle Te Amo pero sin chocolates". El kit no se
 * edita en el catálogo y la línea sigue con el nombre del kit; solo esta venta
 * lleva menos cosas, baja lo que cuesta suelto lo quitado y el backend descuenta
 * stock solo de lo que queda (DetalleComprobante.kitQuitados).
 */

export interface ComponenteKit {
    productoId: number;
    descripcion: string;
    cantidad: number;
    /** Precio de venta suelto del producto (por unidad). */
    precio: number;
}

export const componentesDeCombo = (combo: any): ComponenteKit[] =>
    (combo?.items || [])
        .filter((it: any) => Number(it?.productoId ?? it?.producto?.id) > 0)
        .map((it: any) => ({
            productoId: Number(it?.productoId ?? it?.producto?.id),
            descripcion: String(it?.producto?.descripcion || '').toUpperCase(),
            cantidad: Number(it?.cantidad || 1),
            precio: Number(it?.producto?.precioUnitario || 0),
        }));

const redondear2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Precio del kit con lo que queda: se resta lo que cuesta suelto lo quitado
 * (una tarjeta de S/ 1 baja S/ 1). Nunca baja de 0.
 */
export function precioKitSin(precioCompleto: number, componentes: ComponenteKit[], quitados: number[]): number {
    const fuera = new Set(quitados);
    const resta = componentes.filter((c) => fuera.has(c.productoId)).reduce((s, c) => s + c.cantidad * c.precio, 0);
    return redondear2(Math.max(0, precioCompleto - resta));
}

/** Quita o devuelve un producto. null = no se puede (dejaría el kit vacío). */
export function alternarQuitado(componentes: ComponenteKit[], quitados: number[], productoId: number): number[] | null {
    if (quitados.includes(productoId)) return quitados.filter((id) => id !== productoId);
    const nuevos = [...quitados, productoId];
    return componentes.every((c) => nuevos.includes(c.productoId)) ? null : nuevos;
}
