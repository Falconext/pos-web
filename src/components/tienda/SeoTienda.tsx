import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { get } from '@/utils/fetch';
import { esRutaDeTiendaPublica, type PaginaSeo } from '@/lib/seoTienda/inyectarSeo';

/**
 * Título, descripción y canónico al navegar DENTRO de la tienda.
 *
 * La primera carga ya llega con todo escrito por el middleware de Vercel
 * (middleware.ts). Pero al pasar de un producto a otro sin recargar, el <head>
 * se quedaba con el de la primera página: la pestaña decía otra cosa y Google,
 * que sí ejecuta JavaScript al renderizar, podía tomar el título equivocado.
 */
export default function SeoTienda() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (!esRutaDeTiendaPublica(pathname)) return;
    let vigente = true;
    const q = new URLSearchParams({ path: pathname });
    const categoria = new URLSearchParams(search).get('category');
    if (categoria) q.set('category', categoria);
    get<PaginaSeo>(`public/seo?${q}`).then((r) => {
      if (vigente && r.success && r.data) aplicar(r.data);
    });
    return () => {
      vigente = false;
    };
  }, [pathname, search]);

  return null;
}

function aplicar(seo: PaginaSeo) {
  if (seo.titulo) document.title = seo.titulo;
  meta('name', 'description', seo.descripcion);
  meta('name', 'robots', seo.robots);
  meta('property', 'og:title', seo.titulo);
  meta('property', 'og:description', seo.descripcion);
  meta('property', 'og:url', seo.canonical);
  meta('property', 'og:image', seo.imagen);
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (seo.canonical) {
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = seo.canonical;
  } else {
    link?.remove();
  }
}

function meta(atributo: 'name' | 'property', clave: string, valor?: string | null) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${atributo}="${clave}"]`);
  if (!valor) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(atributo, clave);
    document.head.appendChild(el);
  }
  el.setAttribute('content', valor);
}
