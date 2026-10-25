import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

/**
 * Plantilla Mostrador (tienda de una sola página): la ficha del producto es la vista rápida del catálogo.
 * Un enlace directo a /producto/:id (compartido o indexado) abre el catálogo con esa vista rápida.
 */
export default function MostradorProductoDetalle() {
  const { slug = '', id = '' } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const qs = new URLSearchParams(search);
    qs.set('producto', id);
    navigate(`/tienda/${slug}/catalogo?${qs.toString()}`, { replace: true });
  }, [slug, id, search, navigate]);
  return null;
}
