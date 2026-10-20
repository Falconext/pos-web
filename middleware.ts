/**
 * SEO de las tiendas virtuales (Routing Middleware de Vercel).
 *
 * La tienda es una SPA: el servidor entregaba siempre el mismo index.html con
 * el título de la marca, y Google y WhatsApp (que no ejecuta JavaScript) veían
 * "Krezka - Sistema de Facturación" en cada tienda y cada producto. Aquí, antes
 * de entregar el HTML, se piden al backend los metadatos de la página
 * (título, descripción, canónico, imagen, JSON-LD) y se escriben en el <head>.
 * React arranca igual que antes encima del mismo HTML.
 *
 * Mismo HTML para personas y bots (nada depende del user-agent). Si el backend
 * tarda o falla, se entrega el index.html de siempre: el SEO nunca tumba la
 * tienda.
 */
import { esRutaDeTiendaPublica, inyectarSeo, robotsTxt, type PaginaSeo } from './src/lib/seoTienda/inyectarSeo';

export const config = {
  matcher: ['/tienda/:path*', '/robots.txt', '/sitemap.xml'],
};

const ESPERA_SEO_MS = 800;

function apiBase(host: string): string {
  const env = typeof process !== 'undefined' ? process.env.SEO_API_URL : undefined;
  if (env) return env.replace(/\/$/, '');
  return host.includes('falconext') ? 'https://api.falconext.pe' : 'https://api.krezka.com';
}

// El index.html cambia solo en cada despliegue: se guarda un minuto por instancia.
let indexCache: { html: string; hasta: number } | null = null;

async function obtenerIndex(origen: string): Promise<string | null> {
  if (indexCache && indexCache.hasta > Date.now()) return indexCache.html;
  try {
    const r = await fetch(`${origen}/index.html`, { signal: AbortSignal.timeout(1500) });
    if (!r.ok) return null;
    const html = await r.text();
    indexCache = { html, hasta: Date.now() + 60_000 };
    return html;
  } catch {
    return null;
  }
}

async function obtenerSeo(api: string, url: URL): Promise<PaginaSeo | null> {
  try {
    const q = new URLSearchParams({ path: url.pathname });
    const categoria = url.searchParams.get('category');
    if (categoria) q.set('category', categoria);
    const r = await fetch(`${api}/api/public/seo?${q}`, { signal: AbortSignal.timeout(ESPERA_SEO_MS) });
    if (!r.ok) return null;
    const json = await r.json();
    return (json?.data ?? json) as PaginaSeo;
  } catch {
    return null;
  }
}

async function reenviarXml(destino: string): Promise<Response> {
  try {
    const r = await fetch(destino, { signal: AbortSignal.timeout(5000) });
    return new Response(await r.text(), {
      status: r.status,
      headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=600, s-maxage=3600' },
    });
  } catch {
    return new Response('Sitemap no disponible', { status: 503, headers: { 'content-type': 'text/plain' } });
  }
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return undefined;
  const url = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;
  const api = apiBase(host);

  if (url.pathname === '/robots.txt') {
    return new Response(robotsTxt(url.origin), {
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' },
    });
  }
  if (url.pathname === '/sitemap.xml') {
    return reenviarXml(`${api}/api/public/seo/sitemap.xml?host=${encodeURIComponent(host)}`);
  }
  const sitemapTienda = /^\/tienda\/([^/]+)\/sitemap\.xml$/.exec(url.pathname);
  if (sitemapTienda) {
    return reenviarXml(`${api}/api/public/seo/sitemap/${encodeURIComponent(decodeURIComponent(sitemapTienda[1]))}.xml`);
  }

  // Archivos (imágenes, js) y rutas del panel siguen su camino normal.
  if (!esRutaDeTiendaPublica(url.pathname) || /\.[a-z0-9]{2,5}$/i.test(url.pathname)) return undefined;

  const [html, seo] = await Promise.all([obtenerIndex(url.origin), obtenerSeo(api, url)]);
  if (!html) return undefined;

  const cabeceras: Record<string, string> = {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'public, max-age=0, must-revalidate',
  };
  if (!seo) return new Response(html, { headers: cabeceras });
  if (seo.robots?.startsWith('noindex')) cabeceras['x-robots-tag'] = 'noindex';
  // 404 real para tiendas y productos que no existen: si no, Google indexa
  // páginas vacías. La SPA igual pinta su propio "no encontrado".
  return new Response(inyectarSeo(html, seo), { status: seo.status === 404 ? 404 : 200, headers: cabeceras });
}
