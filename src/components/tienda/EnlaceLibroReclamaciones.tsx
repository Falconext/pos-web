import type { CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { EnlaceTienda } from '@/components/tienda/navTienda';
import IconoLibroReclamaciones from '@/features/libroReclamaciones/IconoLibroReclamaciones';

interface Props {
  /** Slug de la tienda; si no llega se toma de la URL. */
  slug?: string;
  diseno?: any;
  className?: string;
  style?: CSSProperties;
  iconSize?: number;
}

/**
 * Enlace al Libro de Reclamaciones virtual, obligatorio y visible en toda
 * tienda (Ley 29571). Va en el pie de cada plantilla y hereda su color y
 * tipografía; navega sin recargar como el resto de la tienda.
 */
export default function EnlaceLibroReclamaciones({ slug, diseno, className = '', style, iconSize = 18 }: Props) {
  const params = useParams();
  const s = slug || params.slug || '';
  return (
    <EnlaceTienda
      href={`/tienda/${s}/libro-reclamaciones`}
      slug={s}
      diseno={diseno}
      data-testid="enlace-libro-reclamaciones"
      className={`inline-flex items-center gap-1.5 whitespace-nowrap underline-offset-4 transition-opacity hover:underline hover:opacity-90 ${className}`}
      style={style}
    >
      <IconoLibroReclamaciones size={iconSize} className="shrink-0" />
      <span>Libro de Reclamaciones</span>
    </EnlaceTienda>
  );
}
