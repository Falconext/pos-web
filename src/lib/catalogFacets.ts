/**
 * catalogFacets — Facetas dinámicas de atributos técnicos para el catálogo de tienda.
 *
 * Los productos guardan sus especificaciones en `atributosTecnicos` (JSON de texto
 * libre, p.ej. { procesador: "Intel Core i5-1235U", memoriaRam: "8GB" }).
 * Aquí derivamos, a partir de los productos ya cargados, un set de filtros
 * (facetas) auto-adaptable a la categoría seleccionada. El procesador se agrupa
 * en buckets legibles (i3/i5/i7, Ryzen 3/5/7, Celeron, Atom...) y el resto de
 * atributos usa sus valores distintos tal cual.
 */

export interface FacetOption {
  /** Etiqueta visible (ej. "Intel Core i5"). */
  label: string;
  /** Token enviado al backend para el contains-match (ej. "i5"). */
  value: string;
  /** Cuántos productos coinciden. */
  count: number;
}

export interface AtributoFacet {
  /** Clave dentro de atributosTecnicos (ej. "procesador"). */
  key: string;
  /** Título de la sección (ej. "Procesador"). */
  label: string;
  options: FacetOption[];
}

/**
 * Lista blanca de atributos que SÍ son buenas facetas de compra. Todo lo demás
 * (interfaz, conector, potencia, puertos, seguridad, garantía, batería, etc.) se
 * ignora para no llenar el sidebar de filtros de 1 solo producto.
 */
const ALLOWED_FACET_KEYS = new Set([
  'procesador',
  'memoriaRam',
  'almacenamiento',
  'tipoAlmacenamiento',
  'tipoDisco',
  'tarjetaGrafica',
  'pantalla',
  'resolucionPantalla',
  'sistemaOperativo',
  'color',
  'material',
]);

/** Etiquetas amigables para claves conocidas. */
const ATTR_LABELS: Record<string, string> = {
  procesador: 'Procesador',
  memoriaRam: 'Memoria RAM',
  almacenamiento: 'Almacenamiento',
  tipoAlmacenamiento: 'Tipo de disco',
  tipoDisco: 'Tipo de disco',
  tarjetaGrafica: 'Tarjeta gráfica',
  pantalla: 'Pantalla',
  resolucionPantalla: 'Resolución',
  sistemaOperativo: 'Sistema operativo',
  color: 'Color',
  material: 'Material',
};

/** Orden preferente de las facetas (las no listadas van después, alfabéticas). */
const ATTR_ORDER = [
  'procesador',
  'memoriaRam',
  'almacenamiento',
  'tipoAlmacenamiento',
  'tipoDisco',
  'tarjetaGrafica',
  'pantalla',
  'resolucionPantalla',
  'sistemaOperativo',
  'color',
  'material',
];

const MAX_OPTIONS_PER_FACET = 12;
const MAX_DISTINCT_FOR_GENERIC = 15;

/** camelCase → "Camel Case". */
function prettifyKey(key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Agrupa un valor de procesador en un bucket legible. Devuelve null si no lo reconoce. */
function bucketProcesador(raw: string): FacetOption | null {
  const v = raw.toLowerCase();
  const buckets: [RegExp, string, string][] = [
    [/core\s*i9|\bi9\b/, 'Intel Core i9', 'i9'],
    [/core\s*i7|\bi7\b/, 'Intel Core i7', 'i7'],
    [/core\s*i5|\bi5\b/, 'Intel Core i5', 'i5'],
    [/core\s*i3|\bi3\b/, 'Intel Core i3', 'i3'],
    [/celeron/, 'Intel Celeron', 'Celeron'],
    [/atom/, 'Intel Atom', 'Atom'],
    [/pentium/, 'Intel Pentium', 'Pentium'],
    [/ryzen\s*9|\br9\b/, 'AMD Ryzen 9', 'Ryzen 9'],
    [/ryzen\s*7|\br7\b/, 'AMD Ryzen 7', 'Ryzen 7'],
    [/ryzen\s*5|\br5\b/, 'AMD Ryzen 5', 'Ryzen 5'],
    [/ryzen\s*3|\br3\b/, 'AMD Ryzen 3', 'Ryzen 3'],
    [/apple\s*m\d|\bm[1-4]\b/, 'Apple M', 'Apple M'],
    [/snapdragon/, 'Snapdragon', 'Snapdragon'],
  ];
  for (const [re, label, value] of buckets) {
    if (re.test(v)) return { label, value, count: 0 };
  }
  return null;
}

/** Agrupa memoria RAM por capacidad (ej. "16GB DDR5" → "16GB"). */
function bucketRam(raw: string): FacetOption | null {
  const m = raw.match(/(\d+)\s*gb/i);
  if (!m) return null;
  return { label: `${m[1]} GB`, value: `${m[1]}GB`, count: 0 };
}

/** Agrupa almacenamiento por capacidad (ej. "SSD 1TB NVMe" → "1TB"). */
function bucketAlmacenamiento(raw: string): FacetOption | null {
  const tb = raw.match(/(\d+)\s*tb/i);
  if (tb) return { label: `${tb[1]} TB`, value: `${tb[1]}TB`, count: 0 };
  const gb = raw.match(/(\d+)\s*gb/i);
  if (gb) return { label: `${gb[1]} GB`, value: `${gb[1]}GB`, count: 0 };
  return null;
}

/** Buckets por clave: normaliza texto libre en opciones limpias. */
const KEY_BUCKETS: Record<string, (raw: string) => FacetOption | null> = {
  procesador: bucketProcesador,
  memoriaRam: bucketRam,
  almacenamiento: bucketAlmacenamiento,
};

function normalizeCategoria(p: any): string {
  return String(p?.categoria?.nombre ?? p?.categoria ?? '').trim().toLowerCase();
}

/**
 * Deriva las facetas de atributos a partir de los productos, contextualizadas a
 * las categorías seleccionadas (si hay). Solo incluye facetas con ≥2 opciones.
 */
export function deriveAtributoFacets(
  productos: any[],
  selectedCategorias: string[] = [],
): AtributoFacet[] {
  if (!Array.isArray(productos) || productos.length === 0) return [];

  const cats = selectedCategorias.map((c) => c.trim().toLowerCase()).filter(Boolean);
  const scoped = cats.length
    ? productos.filter((p) => cats.includes(normalizeCategoria(p)))
    : productos;

  // key -> (value -> FacetOption)
  const facetMap = new Map<string, Map<string, FacetOption>>();

  for (const p of scoped) {
    const attrs = p?.atributosTecnicos;
    if (!attrs || typeof attrs !== 'object') continue;

    for (const [key, rawVal] of Object.entries(attrs)) {
      if (!ALLOWED_FACET_KEYS.has(key)) continue;
      if (rawVal === null || rawVal === undefined) continue;
      if (typeof rawVal === 'boolean') continue;
      const raw = String(rawVal).trim();
      if (!raw || raw.length > 60) continue;

      const bucketFn = KEY_BUCKETS[key];
      const bucket = bucketFn ? bucketFn(raw) : null;
      const option: FacetOption = bucket ?? { label: raw, value: raw, count: 0 };

      let opts = facetMap.get(key);
      if (!opts) {
        opts = new Map<string, FacetOption>();
        facetMap.set(key, opts);
      }
      const existing = opts.get(option.value);
      if (existing) existing.count += 1;
      else opts.set(option.value, { ...option, count: 1 });
    }
  }

  const facets: AtributoFacet[] = [];
  for (const [key, opts] of facetMap.entries()) {
    if (opts.size < 2) continue;
    // Un atributo sin bucket con demasiados valores distintos no es buena faceta.
    if (!KEY_BUCKETS[key] && opts.size > MAX_DISTINCT_FOR_GENERIC) continue;

    const options = Array.from(opts.values())
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, MAX_OPTIONS_PER_FACET);

    facets.push({
      key,
      label: ATTR_LABELS[key] ?? prettifyKey(key),
      options,
    });
  }

  facets.sort((a, b) => {
    const ia = ATTR_ORDER.indexOf(a.key);
    const ib = ATTR_ORDER.indexOf(b.key);
    if (ia !== -1 || ib !== -1) {
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    }
    return a.label.localeCompare(b.label);
  });

  return facets;
}

/** Construye el parámetro `atributos` para el backend: "procesador:i5|i7;memoriaRam:8GB". */
export function buildAtributosParam(selected: Record<string, string[]>): string {
  return Object.entries(selected)
    .filter(([, vals]) => Array.isArray(vals) && vals.length > 0)
    .map(([k, vals]) => `${k}:${vals.join('|')}`)
    .join(';');
}

/** Parsea el parámetro `atributos` de la URL a un objeto de selección. */
export function parseAtributosParam(raw: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  if (!raw) return out;
  for (const grupo of raw.split(';')) {
    const idx = grupo.indexOf(':');
    if (idx === -1) continue;
    const key = grupo.slice(0, idx).trim();
    const vals = grupo
      .slice(idx + 1)
      .split('|')
      .map((v) => v.trim())
      .filter(Boolean);
    if (key && vals.length) out[key] = vals;
  }
  return out;
}
