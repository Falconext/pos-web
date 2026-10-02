/**
 * Desglose del stock de un modelo por sus variantes (color, talla, …).
 *
 * Pedido de un negocio de ropa y calzado: el inventario muestra "77" para un
 * modelo y no hay dónde ver cuántos quedan en S, en M o en XL. El dato ya
 * existe —cada variante es un producto con su propio stock— pero la lista solo
 * mostraba el total del padre.
 *
 * Vive aparte de la pantalla para poder probar las reglas que importan sin
 * montar la tabla entera: cuáles variantes cuentan, cómo se nombran las
 * columnas y por qué el total tiene que cuadrar con el badge de la lista.
 */

/** El stock de una variante en una sede concreta. */
export interface StockEnSede {
    sedeId: number;
    stock: number;
}

export interface FilaVariante {
    id: number;
    sku: string;
    /** { Color: 'Negro', Talla: 'S' } — tal cual lo guarda la variante. */
    atributos: Record<string, string>;
    /** "Negro / S", para mostrar en una sola celda. */
    etiqueta: string;
    stock: number;
    porSede: StockEnSede[];
}

const texto = (valor: unknown): string => String(valor ?? '').trim();

/**
 * Solo las variantes ACTIVAS.
 *
 * Es la misma regla con la que el backend arma el stock del padre
 * (`sincronizarStockPadre`: suma de las variantes ACTIVO). Si acá entraran las
 * desactivadas, el desglose sumaría más que el número que el usuario ve en la
 * lista y el reporte quedaría desacreditado de entrada.
 */
const esActiva = (variante: any): boolean =>
    texto(variante?.estado).toUpperCase() !== 'INACTIVO';

/** ¿Este producto tiene tallas/colores que valga la pena desglosar? */
export const tieneVariantes = (producto: any): boolean =>
    Array.isArray(producto?.variantes) && producto.variantes.some(esActiva);

/**
 * Las columnas de atributos, en el orden en que el usuario las configuró.
 *
 * El orden sale del padre (`opcionesAtributos`), no de las variantes: así
 * "Color" y "Talla" salen siempre en el mismo orden aunque alguna variante
 * tenga las claves al revés. Si el padre no lo trae, se cae al orden de
 * aparición en las variantes.
 */
export const nombresDeAtributos = (producto: any): string[] => {
    const delPadre = Array.isArray(producto?.opcionesAtributos)
        ? producto.opcionesAtributos
              .map((opcion: any) => texto(opcion?.nombre))
              .filter((nombre: string) => nombre !== '')
        : [];

    const vistos = new Set<string>(delPadre);
    const extras: string[] = [];
    for (const variante of producto?.variantes ?? []) {
        if (!esActiva(variante)) continue;
        for (const clave of Object.keys(variante?.valoresAtributos ?? {})) {
            const nombre = texto(clave);
            if (nombre !== '' && !vistos.has(nombre)) {
                vistos.add(nombre);
                extras.push(nombre);
            }
        }
    }
    return [...delPadre, ...extras];
};

/** "Negro / S" a partir de los valores, en el orden de las columnas. */
export const etiquetaDeVariante = (
    atributos: Record<string, string>,
    orden: string[],
): string => {
    const enOrden = orden
        .map((nombre) => texto(atributos[nombre]))
        .filter((valor) => valor !== '');
    if (enOrden.length > 0) return enOrden.join(' / ');
    // Sin columnas conocidas: lo que haya, para no mostrar una fila en blanco.
    return Object.values(atributos)
        .map(texto)
        .filter((valor) => valor !== '')
        .join(' / ');
};

/**
 * Las filas del desglose.
 *
 * `sedeId` opcional: cuando la pantalla está filtrada por una sede, el stock
 * que se muestra tiene que ser el de ESA sede, no el global — si no, el
 * desglose contradice al total que la misma lista está mostrando.
 */
export const filasDeVariantes = (
    producto: any,
    sedeId?: number,
): FilaVariante[] => {
    const orden = nombresDeAtributos(producto);
    return (producto?.variantes ?? [])
        .filter(esActiva)
        .map((variante: any): FilaVariante => {
            const atributos: Record<string, string> = {};
            for (const [clave, valor] of Object.entries(
                variante?.valoresAtributos ?? {},
            )) {
                atributos[texto(clave)] = texto(valor);
            }

            const porSede: StockEnSede[] = (variante?.stocks ?? []).map(
                (fila: any) => ({
                    sedeId: Number(fila?.sedeId),
                    stock: Number(fila?.stock ?? 0),
                }),
            );

            const deLaSede = sedeId
                ? porSede.find((fila) => fila.sedeId === Number(sedeId))
                : undefined;

            return {
                id: Number(variante?.id),
                sku: texto(variante?.codigo),
                atributos,
                etiqueta: etiquetaDeVariante(atributos, orden),
                stock: sedeId
                    ? Number(deLaSede?.stock ?? 0)
                    : Number(variante?.stock ?? 0),
                porSede,
            };
        });
};

/** Lo que suma el desglose: tiene que coincidir con el badge de la lista. */
export const totalDeFilas = (filas: FilaVariante[]): number =>
    filas.reduce((suma, fila) => suma + fila.stock, 0);

/** Cuántas combinaciones quedaron sin una sola unidad. */
export const sinStock = (filas: FilaVariante[]): number =>
    filas.filter((fila) => fila.stock <= 0).length;
