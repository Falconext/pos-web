/**
 * Metadatos SEO de una página de tienda, tal como los arma el backend
 * (`GET /api/public/seo?path=…`, pos-bd src/seo/seo.service.ts).
 *
 * Este archivo lo importa `middleware.ts` (Vercel, Node) y también la SPA:
 * no puede usar el alias `@/` ni nada del navegador.
 */
export interface PaginaSeo {
  status: 200 | 404;
  tipo: string;
  titulo: string;
  descripcion: string;
  canonical: string | null;
  imagen: string | null;
  imagenAlt: string | null;
  robots: string;
  sitio: string | null;
  ogType: 'website' | 'product';
  precio?: string;
  moneda?: string;
  /** Portada de la tienda: código de google-site-verification del negocio. */
  verificacionGoogle?: string | null;
  jsonLd: Record<string, unknown>[];
}

const esc = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** JSON dentro de <script>: "</script>" en un nombre de producto cerraría la etiqueta. */
const jsonSeguro = (o: unknown) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

/**
 * Reemplaza en el index.html de la SPA el título y las etiquetas genéricas de
 * la marca por las de la página. Se quitan las originales (description, og:*,
 * twitter:*) y se agrega un bloque nuevo antes de </head>: así no quedan dos
 * og:title y WhatsApp no elige el equivocado.
 */
export function inyectarSeo(html: string, seo: PaginaSeo): string {
  const meta = (atributo: 'name' | 'property', clave: string, valor?: string | null) =>
    valor ? `<meta ${atributo}="${clave}" content="${esc(valor)}" />` : '';

  const bloque = [
    `<title>${esc(seo.titulo)}</title>`,
    meta('name', 'description', seo.descripcion),
    meta('name', 'robots', seo.robots),
    // Con esto el dueño registra SU tienda (prefijo de URL) en Search Console
    // y ve sus propias búsquedas, sin tocar el dominio de Krezka.
    meta('name', 'google-site-verification', seo.verificacionGoogle),
    seo.canonical ? `<link rel="canonical" href="${esc(seo.canonical)}" />` : '',
    meta('property', 'og:type', seo.ogType),
    meta('property', 'og:site_name', seo.sitio),
    meta('property', 'og:locale', 'es_PE'),
    meta('property', 'og:title', seo.titulo),
    meta('property', 'og:description', seo.descripcion),
    meta('property', 'og:url', seo.canonical),
    meta('property', 'og:image', seo.imagen),
    seo.imagen ? meta('property', 'og:image:alt', seo.imagenAlt) : '',
    seo.precio ? meta('property', 'product:price:amount', seo.precio) : '',
    seo.precio ? meta('property', 'product:price:currency', seo.moneda || 'PEN') : '',
    meta('name', 'twitter:card', seo.imagen ? 'summary_large_image' : 'summary'),
    meta('name', 'twitter:title', seo.titulo),
    meta('name', 'twitter:description', seo.descripcion),
    meta('name', 'twitter:image', seo.imagen),
    ...seo.jsonLd.map((o) => `<script type="application/ld+json">${jsonSeguro(o)}</script>`),
  ]
    .filter(Boolean)
    .join('\n  ');

  const limpio = html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+name="(description|robots|google-site-verification|twitter:[^"]+)"[^>]*>\s*/gi, '')
    .replace(/<meta\s+property="(og:[^"]+|product:[^"]+)"[^>]*>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '');

  return limpio.includes('</head>') ? limpio.replace('</head>', `  ${bloque}\n</head>`) : `${bloque}\n${limpio}`;
}

/**
 * robots.txt del dominio de la app. Las tiendas se pueden indexar; el panel,
 * el checkout, el seguimiento de pedidos y las vistas previas no. En los
 * despliegues de prueba (*.vercel.app) no se indexa nada.
 */
export function robotsTxt(origen: string): string {
  const host = new URL(origen).hostname;
  if (host.endsWith('.vercel.app') || host === 'localhost' || host.startsWith('127.')) {
    return 'User-agent: *\nDisallow: /\n';
  }
  return [
    'User-agent: *',
    'Allow: /tienda/',
    'Disallow: /administrador',
    'Disallow: /reseller',
    'Disallow: /login',
    'Disallow: /tienda/login',
    'Disallow: /tienda/home',
    'Disallow: /tienda/preview',
    'Disallow: /tienda/*/checkout',
    'Disallow: /tienda/*/seguimiento',
    'Disallow: /diseno-preview',
    '',
    `Sitemap: ${origen.replace(/\/$/, '')}/sitemap.xml`,
    '',
  ].join('\n');
}

/** Rutas de /tienda que son del panel o de vista previa, no de una tienda. */
export function esRutaDeTiendaPublica(pathname: string): boolean {
  const m = /^\/tienda\/([^/]+)/.exec(pathname);
  if (!m) return false;
  return !['login', 'home', 'preview'].includes(m[1]);
}
