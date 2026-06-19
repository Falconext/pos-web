import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import ProductoDetalle from './ProductoDetalle';
import GadgetsProductoDetalle from './GadgetsProductoDetalle';
import AutopartesProductoDetalle from './AutopartesProductoDetalle';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

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

  if (plantillaId === 'gadgets') return <GadgetsProductoDetalle />;
  if (plantillaId === 'autopartes') return <AutopartesProductoDetalle />;
  return <ProductoDetalle />;
}
