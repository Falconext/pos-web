import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { TemplateHomePageProps } from '@/templates/shared/types';
import { mostradorTheme } from './MostradorParts';

/**
 * Plantilla Mostrador: la tienda arranca en el catálogo (no hay portada).
 * El inicio redirige al catálogo conservando la consulta (filtros, ?previewPlantilla=…).
 */
export default function MostradorHomePage({ slug, diseno }: TemplateHomePageProps) {
  const navigate = useNavigate();
  const { search } = useLocation();
  useEffect(() => {
    if (slug) navigate(`/tienda/${slug}/catalogo${search}`, { replace: true });
  }, [slug, search, navigate]);
  const t = mostradorTheme(diseno);
  return <div className="min-h-screen" style={{ background: t.bg }}><div className="h-[150px]" style={{ background: t.band }} /></div>;
}
