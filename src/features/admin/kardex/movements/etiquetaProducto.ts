/**
 * El nombre con el que se muestra un producto en el kardex.
 *
 * Las tallas y los colores son productos hijos: "Victoria Azul talla 35" es una
 * fila propia con `valoresAtributos` = { Talla: '35', Color: 'Azul' }. Según
 * cómo se haya creado el producto, su `descripcion` a veces ya trae la talla y
 * a veces es la del modelo a secas, y en ese segundo caso todas las variantes
 * se veían idénticas en la lista — imposible saber cuál se movió.
 *
 * Por eso se agrega cada valor que NO esté ya en el texto: nunca se repite
 * ("Victoria Azul 35 · 35") ni se pierde.
 */
export const etiquetaProducto = (producto: any): string => {
    const base = String(producto?.descripcion ?? '').trim();
    const valores = producto?.valoresAtributos;
    if (!valores || typeof valores !== 'object' || Array.isArray(valores)) return base;

    const yaEsta = (v: string) =>
        // Se compara por palabra entera: la talla "35" no debe darse por puesta
        // porque el nombre diga "350 ML".
        new RegExp(`(^|[^\\p{L}\\p{N}])${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}\\p{N}]|$)`, 'iu')
            .test(base);

    const faltantes = Object.values(valores)
        .map((v) => String(v ?? '').trim())
        .filter((v) => v.length > 0 && !yaEsta(v));

    return faltantes.length ? `${base} · ${faltantes.join(' · ')}` : base;
};

export default etiquetaProducto;
