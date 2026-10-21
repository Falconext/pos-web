/**
 * Puntaje SEO de un producto, al estilo de Rank Math: una lista de chequeo que
 * dice qué falta, con un número de 0 a 100. Lo pidió un cliente que viene de
 * WordPress (audio 2026-10-20): su encargada de marketing completa título,
 * palabra clave y descripción por producto y quiere ver si quedó bien sin
 * saber de código.
 *
 * Las reglas de texto (título "Producto | Tienda", descripción automática) son
 * las mismas del backend (pos-bd src/seo/seo-texto.ts): la vista previa tiene
 * que mostrar lo que de verdad le llega a Google.
 */

export interface DatosSeoProducto {
  nombre: string;
  nombreTienda: string;
  precio?: number | null;
  categoria?: string | null;
  descripcionLarga?: string | null;
  seoTitulo?: string | null;
  seoDescripcion?: string | null;
  seoPalabraClave?: string | null;
  cantidadFotos: number;
}

export interface ChequeoSeo {
  id: string;
  ok: boolean;
  peso: number;
  texto: string;
  ayuda?: string;
}

export const LIMITE_TITULO = 60;
export const LIMITE_DESCRIPCION = 160;

const limpiar = (t?: string | null) =>
  String(t || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizar = (t?: string | null) =>
  limpiar(t)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const MENORES = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'o', 'u', 'en', 'con', 'para', 'por', 'a', 'al', 'sin']);
const SIGLAS = /^(?:[A-Z]\.){1,5}[A-Z]?\.?$|^(?:SAC|SAA|SA|EIRL|SRL|SAS|SL|RUC)\.?,?$/;

/** Igual que pos-bd seo-texto.ts: solo suaviza lo que viene casi todo en MAYÚSCULAS. */
export function suavizarMayusculas(texto: string, modo: 'frase' | 'titulo' = 'frase'): string {
  const t = limpiar(texto);
  const letras = t.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
  if (letras.length < 4) return t;
  const mayus = letras.replace(/[^A-ZÁÉÍÓÚÜÑ]/g, '').length;
  if (mayus / letras.length < 0.7) return t;
  const bajo = t.toLowerCase();
  if (modo === 'frase') return bajo.charAt(0).toUpperCase() + bajo.slice(1);
  const originales = t.split(' ');
  return bajo
    .split(' ')
    .map((w, i) => {
      if (SIGLAS.test(originales[i] ?? '')) return originales[i];
      return i > 0 && MENORES.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

const conPunto = (t: string) => (/[.!?…]$/.test(t) ? t : `${t}.`);

export function recortar(texto: string, max: number): string {
  const t = limpiar(texto);
  if (t.length <= max) return t;
  const corte = t.slice(0, max - 1);
  const espacio = corte.lastIndexOf(' ');
  return `${(espacio > max * 0.6 ? corte.slice(0, espacio) : corte).replace(/[\s,;:.–-]+$/, '')}…`;
}

/** Título que verá Google: el propio, o "Producto | Tienda" (≤ 60). */
export function tituloEfectivo(d: DatosSeoProducto): string {
  const propio = limpiar(d.seoTitulo);
  if (propio) return recortar(propio, LIMITE_TITULO);
  const nombre = suavizarMayusculas(d.nombre, 'frase');
  const sufijo = ` | ${suavizarMayusculas(d.nombreTienda, 'titulo')}`;
  if (nombre.length + sufijo.length <= LIMITE_TITULO) return `${nombre}${sufijo}`;
  const espacio = LIMITE_TITULO - sufijo.length;
  return espacio >= 25 ? `${recortar(nombre, espacio)}${sufijo}` : recortar(nombre, LIMITE_TITULO);
}

/** Descripción que verá Google: la propia, o la automática del backend. */
export function descripcionEfectiva(d: DatosSeoProducto): string {
  const propia = limpiar(d.seoDescripcion);
  if (propia) return recortar(propia, LIMITE_DESCRIPCION);
  const larga = limpiar(d.descripcionLarga);
  const precio = d.precio && d.precio > 0 ? `S/ ${d.precio.toFixed(2)}` : '';
  if (larga.length >= 50) return recortar(`${larga}${precio ? ` ${precio}.` : ''}`, LIMITE_DESCRIPCION);
  return recortar(
    `${conPunto(`${suavizarMayusculas(d.nombre, 'frase')}${d.categoria ? ` (${limpiar(d.categoria).toLowerCase()})` : ''}${precio ? ` a ${precio}` : ''} en ${suavizarMayusculas(d.nombreTienda, 'titulo')}`)} Compra online o pide por WhatsApp.`,
    LIMITE_DESCRIPCION,
  );
}

const contiene = (texto: string, clave: string) => !!clave && normalizar(texto).includes(clave);

export function chequeosSeo(d: DatosSeoProducto): ChequeoSeo[] {
  const clave = normalizar(d.seoPalabraClave);
  const titulo = tituloEfectivo(d);
  const desc = descripcionEfectiva(d);
  const larga = limpiar(d.descripcionLarga);
  const palabrasLarga = larga ? larga.split(' ').length : 0;
  const lt = limpiar(d.seoTitulo || titulo).length;
  const ld = limpiar(d.seoDescripcion || desc).length;

  return [
    {
      id: 'clave',
      ok: !!clave,
      peso: 10,
      texto: 'Tiene palabra clave',
      ayuda: 'Lo que escribiría un cliente en Google para encontrar este producto, por ejemplo "ramo de rosas a domicilio".',
    },
    { id: 'clave-titulo', ok: contiene(titulo, clave), peso: 15, texto: 'La palabra clave está en el título' },
    { id: 'clave-desc', ok: contiene(desc, clave), peso: 10, texto: 'La palabra clave está en la descripción para Google' },
    {
      id: 'clave-larga',
      ok: contiene(larga, clave),
      peso: 10,
      texto: 'La palabra clave aparece en la descripción del producto',
    },
    {
      id: 'titulo-largo',
      ok: lt >= 30 && lt <= LIMITE_TITULO,
      peso: 15,
      texto: `Título de 30 a ${LIMITE_TITULO} caracteres (tiene ${lt})`,
      ayuda: 'Más corto desaprovecha espacio; más largo, Google lo corta con "…".',
    },
    {
      id: 'desc-largo',
      ok: ld >= 110 && ld <= LIMITE_DESCRIPCION,
      peso: 15,
      texto: `Descripción para Google de 110 a ${LIMITE_DESCRIPCION} caracteres (tiene ${ld})`,
    },
    {
      id: 'contenido',
      ok: palabrasLarga >= 30,
      peso: 10,
      texto: `Descripción del producto con al menos 30 palabras (tiene ${palabrasLarga})`,
      ayuda: 'Google posiciona mejor las páginas que explican el producto: tamaño, materiales, para qué ocasión.',
    },
    { id: 'foto', ok: d.cantidadFotos >= 1, peso: 10, texto: 'Tiene foto (también es la que sale en WhatsApp)' },
    { id: 'fotos', ok: d.cantidadFotos >= 2, peso: 5, texto: 'Tiene más de una foto' },
  ];
}

export function puntajeSeo(d: DatosSeoProducto): { puntaje: number; nivel: 'bien' | 'mejorable' | 'bajo' } {
  const puntaje = chequeosSeo(d).reduce((s, c) => s + (c.ok ? c.peso : 0), 0);
  return { puntaje, nivel: puntaje >= 80 ? 'bien' : puntaje >= 50 ? 'mejorable' : 'bajo' };
}
