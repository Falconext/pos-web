/** Una fila de GET compras/ordenes/sugerido-por-marca. */
export interface FilaPedidoMarca {
    productoId: number;
    descripcion: string;
    variante: string | null;
    stock: number;
    stockMinimo: number;
    vendidos: number;
    costo: number;
    tipoAfectacionIGV: string | null;
    sugerido: number;
}

export interface LineaPedidoMarca {
    productoId: number;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    gravado: boolean;
    unidadesPorPaquete: null;
}

/** Afectación IGV (Catálogo 07): solo 10-17 gravado. Sin dato → gravado. */
const esGravado = (tipo: string | null) => {
    const cod = String(tipo ?? '10').trim();
    return cod === '' || cod.startsWith('1');
};

/**
 * Las líneas de la orden para lo que se escribió en la grilla: una por
 * producto (o tono) con cantidad > 0. El tono va en la descripción porque al
 * proveedor se le pide "Base Colorfix — Tono: 170-N", no "Base Colorfix".
 * El costo viene sin IGV; con "Precios con IGV incluido" entra con su IGV.
 */
export function lineasDePedidoMarca(
    filas: FilaPedidoMarca[],
    cantidades: Record<number, string>,
    factorCosto = 1,
): LineaPedidoMarca[] {
    return filas.flatMap((f) => {
        const cantidad = Math.floor(Number(cantidades[f.productoId]) || 0);
        if (cantidad <= 0) return [];
        const gravado = esGravado(f.tipoAfectacionIGV);
        return [{
            productoId: f.productoId,
            descripcion: f.variante ? `${f.descripcion} — ${f.variante}` : f.descripcion,
            cantidad,
            precioUnitario: Number(((Number(f.costo) || 0) * (gravado ? factorCosto : 1)).toFixed(2)),
            gravado,
            unidadesPorPaquete: null,
        }];
    });
}
