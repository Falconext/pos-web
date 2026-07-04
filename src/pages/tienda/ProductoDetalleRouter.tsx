import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import ProductoDetalle from './ProductoDetalle';
import GadgetsProductoDetalle from './GadgetsProductoDetalle';
import AutopartesProductoDetalle from './AutopartesProductoDetalle';
import ModaProductoDetalle from './ModaProductoDetalle';
import TecnologiaProductoDetalle from './TecnologiaProductoDetalle';
import MayeProductoDetalle from './MayeProductoDetalle';
import ApiculturaProductoDetalle from './ApiculturaProductoDetalle';

import UrbanoProductoDetalle from './UrbanoProductoDetalle';
import { resolveTemplateId } from '@/components/tienda/resolveTemplate';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

const DETAIL_PAGE_BY_TEMPLATE: Record<string, ComponentType> = {
  gadgets: GadgetsProductoDetalle,
  autopartes: AutopartesProductoDetalle,
  tecnologia: TecnologiaProductoDetalle,
  construccion: TecnologiaProductoDetalle,
  maye: MayeProductoDetalle,
  moda: ModaProductoDetalle,
  urbano: UrbanoProductoDetalle,
  apicultura: ApiculturaProductoDetalle,
};

export default function ProductoDetalleRouter() {
  const { slug } = useParams();
  const [plantillaId, setPlantillaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    axios.get(`${BASE_URL}/public/store/${slug}`)
      .then((res) => {
        const tienda = res.data.data || res.data;
        setPlantillaId(tienda?.diseno?.plantillaId || '');
      })
      .catch(() => setPlantillaId(''))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Icon icon="eos-icons:loading" className="w-12 h-12 text-gray-300 animate-spin" />
      </div>
    );
  }

  const DetailPage = DETAIL_PAGE_BY_TEMPLATE[resolveTemplateId(plantillaId)];
  if (DetailPage) return <DetailPage />;
  return <ProductoDetalle />;
}
