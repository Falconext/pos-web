/**
 * Bloques de categoría del home ("Categorías destacadas") configurables desde
 * el editor en vivo, con el mismo criterio en todas las plantillas:
 *
 * - `<prefijo>Tile{n}Cat`   → categoría fijada para el bloque n (select).
 * - `<prefijo>Tile{n}Title` → título visible (opcional; por defecto el nombre).
 * - `<prefijo>Tile{n}Image` → imagen (opcional; por defecto la de la categoría
 *                             y, si no tiene, el fallback de la plantilla).
 *
 * Los bloques sin categoría fijada se rellenan con las categorías reales de la
 * tienda (orden del backend), excluyendo las ya fijadas en otro bloque.
 */
export interface CategoryTile {
  /** Nombre real de la categoría (para el enlace al catálogo). */
  nombre: string;
  /** Texto que se muestra en el bloque. */
  label: string;
  /** Imagen ya resuelta (editor > categoría > fallback). */
  imagenUrl: string;
  /** true cuando el bloque viene de un nombre de relleno (no existe como categoría). */
  placeholder?: boolean;
}

export interface BuildCategoryTilesOptions {
  allCategories: any[] | undefined;
  diseno: any;
  prefix: string;
  count: number;
  fallbackImages: string[];
  /** Nombres de relleno cuando la tienda aún no tiene categorías. Sin esto, devuelve [] en ese caso. */
  fallbackNames?: string[];
}

const norm = (v: any) => String(v ?? '').trim().toLowerCase();

export function buildCategoryTiles({ allCategories, diseno, prefix, count, fallbackImages, fallbackNames }: BuildCategoryTilesOptions): CategoryTile[] {
  const catList = (allCategories || [])
    .map((cat: any) => (typeof cat === 'string' ? { nombre: cat } : cat))
    .filter((cat: any) => cat?.nombre);
  const pickedNames = Array.from({ length: count }, (_, i) => String(diseno?.[`${prefix}Tile${i + 1}Cat`] || '').trim());
  const anyPicked = pickedNames.some(Boolean);
  if (!catList.length && !anyPicked && !fallbackNames?.length) return [];

  const findCat = (nombre: string) => catList.find((c: any) => norm(c.nombre) === norm(nombre));
  const autoPool = catList.filter((c: any) => !pickedNames.some((p) => p && norm(p) === norm(c.nombre)));

  const tiles: CategoryTile[] = [];
  for (let i = 0; i < count; i++) {
    const picked = pickedNames[i];
    const auto = picked ? undefined : autoPool.shift();
    const fallbackName = fallbackNames?.[i];
    const nombre = picked || auto?.nombre || fallbackName;
    if (!nombre) continue; // sin categoría para este bloque
    const real = picked ? findCat(picked) : auto;
    const title = String(diseno?.[`${prefix}Tile${i + 1}Title`] || '').trim() || nombre;
    const image = diseno?.[`${prefix}Tile${i + 1}Image`] || real?.imagenUrl || real?.imagen || (fallbackImages.length ? fallbackImages[i % fallbackImages.length] : '');
    tiles.push({ nombre, label: title, imagenUrl: image, placeholder: !picked && !auto });
  }
  return tiles;
}

/** Campos de texto del editor (select de categoría + título) para `count` bloques. */
export function categoryTileTextFields(prefix: string, count: number, group = 'Categorías destacadas') {
  const fields: Array<{ key: string; label: string; placeholder: string; group: string; type?: 'categorySelect' }> = [];
  for (let n = 1; n <= count; n++) {
    fields.push({ key: `${prefix}Tile${n}Cat`, label: `Bloque ${n}: categoría`, placeholder: 'Automática', group, type: 'categorySelect' });
    fields.push({ key: `${prefix}Tile${n}Title`, label: `Bloque ${n}: título (opcional)`, placeholder: 'Se usa el nombre de la categoría', group });
  }
  return fields;
}

/** Campos de imagen del editor para `count` bloques. */
export function categoryTileImageFields(prefix: string, count: number, fallbacks: string[], sizeHint = 'rec. 800×1000px') {
  return Array.from({ length: count }, (_, i) => ({
    key: `${prefix}Tile${i + 1}Image`,
    label: `Categoría destacada ${i + 1}: imagen`,
    hint: i === 0
      ? `Foto del bloque ${i + 1} de categorías (${sizeHint}). Si no subes ninguna, se usa la imagen de la categoría o un ejemplo.`
      : `Foto del bloque ${i + 1} de categorías (${sizeHint}).`,
    fallback: fallbacks.length ? fallbacks[i % fallbacks.length] : '',
  }));
}
