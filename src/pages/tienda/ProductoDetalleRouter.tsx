import { useEffect, useState } from 'react';
import { cargaPerezosa } from '@/lib/cargaPerezosa';
import { datosDeProducto, iniciarPixel, rastrear } from '@/utils/metaPixel';
import type { ComponentType } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import ProductoDetalle from './ProductoDetalle';
const GadgetsProductoDetalle = cargaPerezosa(() => import('./GadgetsProductoDetalle'));
const AutopartesProductoDetalle = cargaPerezosa(() => import('./AutopartesProductoDetalle'));
const ModaProductoDetalle = cargaPerezosa(() => import('./ModaProductoDetalle'));
const TecnologiaProductoDetalle = cargaPerezosa(() => import('./TecnologiaProductoDetalle'));
const ConstruccionProductoDetalle = cargaPerezosa(() => import('./ConstruccionProductoDetalle'));
const FalconProductoDetalle = cargaPerezosa(() => import('./FalconProductoDetalle'));
const MayeProductoDetalle = cargaPerezosa(() => import('./MayeProductoDetalle'));
const ApiculturaProductoDetalle = cargaPerezosa(() => import('./ApiculturaProductoDetalle'));
const LuxuryProductoDetalle = cargaPerezosa(() => import('./LuxuryProductoDetalle'));
const SpaProductoDetalle = cargaPerezosa(() => import('./SpaProductoDetalle'));
const CarterasProductoDetalle = cargaPerezosa(() => import('./CarterasProductoDetalle'));
const AurumProductoDetalle = cargaPerezosa(() => import('./AurumProductoDetalle'));
const GroginProductoDetalle = cargaPerezosa(() => import('./GroginProductoDetalle'));
const FreshMartProductoDetalle = cargaPerezosa(() => import('./FreshMartProductoDetalle'));
const RopaHombreProductoDetalle = cargaPerezosa(() => import('./RopaHombreProductoDetalle'));
const BicicletasProductoDetalle = cargaPerezosa(() => import('./BicicletasProductoDetalle'));
const MotosProductoDetalle = cargaPerezosa(() => import('./MotosProductoDetalle'));
const HoodieProductoDetalle = cargaPerezosa(() => import('./HoodieProductoDetalle'));
const TonesProductoDetalle = cargaPerezosa(() => import('./TonesProductoDetalle'));
const ModaMinimalProductoDetalle = cargaPerezosa(() => import('./ModaMinimalProductoDetalle'));
const CrispyProductoDetalle = cargaPerezosa(() => import('./CrispyProductoDetalle'));
const FarmaciaProductoDetalle = cargaPerezosa(() => import('./FarmaciaProductoDetalle'));
const StrideProductoDetalle = cargaPerezosa(() => import('./StrideProductoDetalle'));
const NordicaProductoDetalle = cargaPerezosa(() => import('./NordicaProductoDetalle'));
const PatitasProductoDetalle = cargaPerezosa(() => import('./PatitasProductoDetalle'));
const BlushProductoDetalle = cargaPerezosa(() => import('./BlushProductoDetalle'));
const VitrinaProductoDetalle = cargaPerezosa(() => import('./VitrinaProductoDetalle'));
const CanastaProductoDetalle = cargaPerezosa(() => import('./CanastaProductoDetalle'));
const PetalaProductoDetalle = cargaPerezosa(() => import('./PetalaProductoDetalle'));
const MaisonProductoDetalle = cargaPerezosa(() => import('./MaisonProductoDetalle'));
const MostradorProductoDetalle = cargaPerezosa(() => import('./MostradorProductoDetalle'));
const ElanProductoDetalle = cargaPerezosa(() => import('./ElanProductoDetalle'));
const RoseProductoDetalle = cargaPerezosa(() => import('./RoseProductoDetalle'));
const CalmaProductoDetalle = cargaPerezosa(() => import('./CalmaProductoDetalle'));
const KarteraProductoDetalle = cargaPerezosa(() => import('./KarteraProductoDetalle'));
const OlmoProductoDetalle = cargaPerezosa(() => import('./OlmoProductoDetalle'));
const AmoraProductoDetalle = cargaPerezosa(() => import('./AmoraProductoDetalle'));
const EsenciaProductoDetalle = cargaPerezosa(() => import('./EsenciaProductoDetalle'));
const NexoProductoDetalle = cargaPerezosa(() => import('./NexoProductoDetalle'));
const VerenaProductoDetalle = cargaPerezosa(() => import('./VerenaProductoDetalle'));

const UrbanoProductoDetalle = cargaPerezosa(() => import('./UrbanoProductoDetalle'));
import { resolveTemplateId } from '@/components/tienda/resolveTemplate';
import { useStorePreviewNavigation } from '@/utils/useStorePreviewNavigation';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

// Fichas por plantilla, descargadas solo cuando se abren (ver cargaPerezosa).
const DETAIL_PAGE_BY_TEMPLATE: Record<string, ComponentType> = {
  gadgets: GadgetsProductoDetalle,
  autopartes: AutopartesProductoDetalle,
  tecnologia: TecnologiaProductoDetalle,
  construccion: ConstruccionProductoDetalle,
  falcon: FalconProductoDetalle,
  maye: MayeProductoDetalle,
  moda: ModaProductoDetalle,
  urbano: UrbanoProductoDetalle,
  apicultura: ApiculturaProductoDetalle,
  luxury: LuxuryProductoDetalle,
  spa: SpaProductoDetalle,
  carteras: CarterasProductoDetalle,
  joyeria: AurumProductoDetalle,
  abarrotes: GroginProductoDetalle,
  supermercado: FreshMartProductoDetalle,
  'ropa-hombre': RopaHombreProductoDetalle,
  bicicletas: BicicletasProductoDetalle,
  motos: MotosProductoDetalle,
  hoodie: HoodieProductoDetalle,
  tones: TonesProductoDetalle,
  'moda-minimal': ModaMinimalProductoDetalle,
  'comida-app': CrispyProductoDetalle,
  farmacia: FarmaciaProductoDetalle,
  salud: FarmaciaProductoDetalle,
  zapatos: StrideProductoDetalle,
  muebleria: NordicaProductoDetalle,
  mascotas: PatitasProductoDetalle,
  maquillaje: BlushProductoDetalle,
  retail: VitrinaProductoDetalle,
  canasta: CanastaProductoDetalle,
  floreria: PetalaProductoDetalle,
  maison: MaisonProductoDetalle,
  mostrador: MostradorProductoDetalle,
  'moda-elegante': ElanProductoDetalle,
  bolsos: RoseProductoDetalle,
  hogar: CalmaProductoDetalle,
  kartera: KarteraProductoDetalle,
  olmo: OlmoProductoDetalle,
  amora: AmoraProductoDetalle,
  esencial: EsenciaProductoDetalle,
  celulares: NexoProductoDetalle,
  'carteras-market': VerenaProductoDetalle,
};

export default function ProductoDetalleRouter() {
  const { slug, id } = useParams();
  const [searchParams] = useSearchParams();
  const previewPlantillaId = searchParams.get('previewPlantilla');
  useStorePreviewNavigation(previewPlantillaId);
  const [plantillaId, setPlantillaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (previewPlantillaId) {
      setPlantillaId(previewPlantillaId);
      setLoading(false);
      return;
    }
    if (!slug) return;
    axios.get(`${BASE_URL}/public/store/${slug}`)
      .then((res) => {
        const tienda = res.data.data || res.data;
        setPlantillaId(tienda?.diseno?.plantillaId || '');
        // El ViewContent va aquí y no en cada página de detalle: hay 25
        // plantillas distintas y, puesto en cada una, alguna se quedaría sin
        // medir y nadie se daría cuenta hasta leer un informe raro.
        iniciarPixel(tienda?.metaPixelId);
        if (id) rastrear('ViewContent', datosDeProducto({ id }));
      })
      .catch(() => setPlantillaId(''))
      .finally(() => setLoading(false));
  }, [slug, id, previewPlantillaId]);

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
