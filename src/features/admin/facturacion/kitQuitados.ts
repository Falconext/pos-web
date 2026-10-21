/**
 * Quitar productos de un kit en el carrito (kit vendido como una línea).
 * Pedido de florería: "el Detalle Te Amo pero sin chocolates". El kit no se
 * edita en el catálogo; solo esta venta lleva menos cosas, baja el precio en
 * la parte de lo quitado y el backend descuenta stock solo de lo que queda
 * (DetalleComprobante.kitQuitados).
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
 * Precio del kit con lo que queda: la parte de lo quitado se calcula por su
 * precio suelto dentro del total de los componentes (igual que se reparte el
 * precio de un kit al venderlo en líneas separadas). Sin precios, por cantidad.
 */
export function precioKitSin(precioCompleto: number, componentes: ComponenteKit[], quitados: number[]): number {
    if (!quitados.length) return redondear2(precioCompleto);
    const fuera = new Set(quitados);
    const peso = (c: ComponenteKit) => c.cantidad * c.precio;
    const conPrecio = componentes.some((c) => peso(c) > 0);
    const medida = conPrecio ? peso : (c: ComponenteKit) => c.cantidad;
    const total = componentes.reduce((s, c) => s + medida(c), 0);
    if (total <= 0) return redondear2(precioCompleto);
    const queda = componentes.filter((c) => !fuera.has(c.productoId)).reduce((s, c) => s + medida(c), 0);
    return redondear2(precioCompleto * (queda / total));
}

/** "DETALLE TE AMO (SIN CHOCOLATES FERRERO X3)": así sale en el comprobante y el ticket. */
export function descripcionKitSin(nombre: string, componentes: ComponenteKit[], quitados: number[]): string {
    const fuera = componentes.filter((c) => quitados.includes(c.productoId)).map((c) => c.descripcion).filter(Boolean);
    return fuera.length ? `${nombre} (SIN ${fuera.join(', ')})` : nombre;
}

/** Quita o devuelve un producto. null = no se puede (dejaría el kit vacío). */
export function alternarQuitado(componentes: ComponenteKit[], quitados: number[], productoId: number): number[] | null {
    if (quitados.includes(productoId)) return quitados.filter((id) => id !== productoId);
    const nuevos = [...quitados, productoId];
    return componentes.every((c) => nuevos.includes(c.productoId)) ? null : nuevos;
}
