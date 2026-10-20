import { esRutaDeTiendaPublica, inyectarSeo, robotsTxt, type PaginaSeo } from '../inyectarSeo';

const INDEX = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" href="/favicon.png" />
  <title>Krezka - Sistema de Facturación</title>
  <meta name="description" content="Krezka - Facturación electrónica" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Krezka - Sistema de Facturación" />
  <meta property="og:image" content="https://app.krezka.com/og.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Krezka" />
</head>
<body><div id="root"></div></body>
</html>`;

const seo = (p: Partial<PaginaSeo> = {}): PaginaSeo => ({
  status: 200,
  tipo: 'producto',
  titulo: 'Ramo buchón de 50 rosas | Rosas & Asociados',
  descripcion: 'Ramo buchón de 50 rosas a S/ 320.00 en "Rosas & Asociados".',
  canonical: 'https://app.krezka.com/tienda/rosas/producto/34847/ramo-buchon-de-50-rosas',
  imagen: 'https://api.krezka.com/api/public/img/productos/x.webp?w=1200&f=jpg',
  imagenAlt: 'Ramo buchón de 50 rosas',
  robots: 'index, follow, max-image-preview:large',
  sitio: 'Rosas & Asociados',
  ogType: 'product',
  precio: '320.00',
  moneda: 'PEN',
  jsonLd: [{ '@type': 'Product', name: 'Ramo </script><script>alert(1)</script>' }],
  ...p,
});

describe('inyectarSeo', () => {
  const html = inyectarSeo(INDEX, seo());

  it('cambia el título y deja un solo og:title, el de la página', () => {
    expect(html).toContain('<title>Ramo buchón de 50 rosas | Rosas &amp; Asociados</title>');
    expect(html).not.toContain('Krezka - Sistema de Facturación');
    expect(html.match(/property="og:title"/g)).toHaveLength(1);
    expect(html.match(/name="description"/g)).toHaveLength(1);
    expect(html.match(/name="twitter:title"/g)).toHaveLength(1);
  });

  it('canónico, imagen, precio y robots', () => {
    expect(html).toContain('<link rel="canonical" href="https://app.krezka.com/tienda/rosas/producto/34847/ramo-buchon-de-50-rosas" />');
    expect(html).toContain('<meta property="og:image" content="https://api.krezka.com/api/public/img/productos/x.webp?w=1200&amp;f=jpg" />');
    expect(html).toContain('<meta property="product:price:amount" content="320.00" />');
    expect(html).toContain('<meta name="robots" content="index, follow, max-image-preview:large" />');
  });

  it('escapa comillas en atributos y no deja cerrar el <script> del JSON-LD', () => {
    expect(html).toContain('content="Ramo buchón de 50 rosas a S/ 320.00 en &quot;Rosas &amp; Asociados&quot;."');
    expect(html).not.toContain('</script><script>alert(1)');
    expect(html).toContain('\\u003c/script\\u003e');
    const ld = /<script type="application\/ld\+json">(.*?)<\/script>/.exec(html)![1];
    expect(JSON.parse(ld).name).toBe('Ramo </script><script>alert(1)</script>');
  });

  it('conserva lo demás del head y el body intacto', () => {
    expect(html).toContain('<link rel="icon" href="/favicon.png" />');
    expect(html).toContain('<meta charset="UTF-8" />');
    expect(html).toContain('<body><div id="root"></div></body>');
  });

  it('sin imagen ni canónico no deja etiquetas vacías', () => {
    const h = inyectarSeo(INDEX, seo({ imagen: null, canonical: null, precio: undefined, jsonLd: [] }));
    expect(h).not.toContain('og:image');
    expect(h).not.toContain('rel="canonical"');
    expect(h).not.toContain('product:price');
    expect(h).toContain('<meta name="twitter:card" content="summary" />');
  });
});

describe('robots.txt', () => {
  it('producción: tiendas sí, panel y checkout no, con sitemap', () => {
    const r = robotsTxt('https://app.krezka.com');
    expect(r).toContain('Allow: /tienda/');
    expect(r).toContain('Disallow: /administrador');
    expect(r).toContain('Disallow: /tienda/*/checkout');
    expect(r).toContain('Sitemap: https://app.krezka.com/sitemap.xml');
  });
  it('despliegues de prueba no se indexan', () => {
    expect(robotsTxt('https://pos-web-git-x.vercel.app')).toBe('User-agent: *\nDisallow: /\n');
  });
});

describe('esRutaDeTiendaPublica', () => {
  it('tiendas sí; login, home y preview no', () => {
    expect(esRutaDeTiendaPublica('/tienda/rosas')).toBe(true);
    expect(esRutaDeTiendaPublica('/tienda/rosas/producto/1/ramo')).toBe(true);
    expect(esRutaDeTiendaPublica('/tienda/login')).toBe(false);
    expect(esRutaDeTiendaPublica('/tienda/preview/producto/3')).toBe(false);
    expect(esRutaDeTiendaPublica('/administrador')).toBe(false);
  });
});
