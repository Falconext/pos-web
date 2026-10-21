const firstValue = (...values: any[]) =>
  values.find((value) => value !== undefined && value !== null && String(value).trim() !== '') ?? null;

export const normalizeSerialsForCart = (value: any) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === 'object') return firstValue(item.numeroSerie, item.serie, item.codigo, item.valor, '');
        return String(item).trim();
      })
      .filter(Boolean)
      .join('\n');
  }
  if (typeof value === 'string') return value.trim();
  return '';
};

export const getDetalleProductImage = (detalle: any) =>
  firstValue(
    detalle?.imagenUrl,
    detalle?.imagenUrlDisplay,
    detalle?.producto?.imagenUrlDisplay,
    detalle?.producto?.imagenUrl,
    detalle?.producto?.imagen,
    detalle?.producto?.imageUrl,
  );

export const getDetalleSerials = (detalle: any) =>
  normalizeSerialsForCart(firstValue(detalle?.numerosSerie, detalle?.series, detalle?.productoSeries));

export const mapDetalleToInvoiceProduct = (detalle: any) => {
  const producto = detalle?.producto || {};
  // Línea guardada SIN producto de catálogo (kit vendido como una línea, ítem
  // libre): el detalle trae `productoId: null` explícito. Antes caía al `id`
  // del propio detalle y, al convertir esa Nota de Venta, se mandaba como
  // productoId un número que no es de ningún producto (o, peor, de otro).
  const sinProducto = detalle && 'productoId' in detalle && detalle.productoId == null && !producto?.id;
  const productoId = sinProducto ? 0 : Number(firstValue(producto?.id, detalle?.productoId, detalle?.id) || 0);
  const precioUnitario = Number(firstValue(detalle?.mtoPrecioUnitario, detalle?.precioUnitario, detalle?.precioUnit, producto?.precioUnitario) || 0);
  const cantidad = Number(firstValue(detalle?.cantidad, detalle?.cantidadInicial) || 1);
  const imagenUrl = getDetalleProductImage(detalle);
  const numerosSerie = getDetalleSerials(detalle);

  return {
    ...detalle,
    id: sinProducto ? null : productoId || detalle?.id,
    productoId: sinProducto ? null : productoId,
    ...(sinProducto ? { esItemLibre: true } : {}),
    // El kit conserva su combo (`...detalle` trae comboId): el backend
    // descuenta sus componentes y el reporte de packs lo cuenta.
    ...(sinProducto && detalle?.comboId ? { esKit: true, comboId: Number(detalle.comboId) } : {}),
    descripcion: firstValue(detalle?.descripcion, producto?.descripcion, 'Producto'),
    cantidad,
    cantidadInicial: cantidad,
    cantidadOriginal: cantidad,
    precioUnitario,
    descuento: Number(detalle?.descuento ?? 0),
    unidad: firstValue(detalle?.unidad, detalle?.unidadMedida, producto?.unidadMedida?.codigo, producto?.unidadMedida?.nombre, 'NIU'),
    unidadMedida: detalle?.unidadMedida || { nombre: firstValue(detalle?.unidad, producto?.unidadMedida?.nombre, 'NIU') },
    unidadMedidaNombre: firstValue(detalle?.unidad, detalle?.unidadMedida, producto?.unidadMedida?.nombre, 'NIU'),
    stock: Number(firstValue(producto?.stock, detalle?.stock, 999) || 999),
    estado: producto?.estado || detalle?.estado || 'ACTIVO',
    atributosTecnicos: firstValue(detalle?.atributosTecnicos, producto?.atributosTecnicos, undefined),
    imagenUrl,
    imagenUrlDisplay: firstValue(detalle?.imagenUrlDisplay, producto?.imagenUrlDisplay, imagenUrl),
    // El detalle guardado NO tiene código: solo `productoId`. El del producto
    // llega en la respuesta pero se perdía acá, y la columna CÓDIGO del A4
    // salía con un guion en todas las líneas.
    codigo: firstValue(detalle?.codigo, producto?.codigo, undefined),
    codigoBarras: firstValue(detalle?.codigoBarras, producto?.codigoBarras, undefined),
    ...(numerosSerie ? { numerosSerie } : {}),
  };
};
