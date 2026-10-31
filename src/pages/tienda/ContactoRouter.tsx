import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { resolveTemplateId } from '@/components/tienda/resolveTemplate';
import CargandoTienda from '@/components/tienda/CargandoTienda';
import StoreWhatsAppButton from '@/components/tienda/StoreWhatsAppButton';
import ApiculturaContactPage from '@/templates/apicultura/ApiculturaContactPage';
import ConstruccionContactPage from '@/templates/construccion/ConstruccionContactPage';
import FalconContactPage from '@/templates/falcon/FalconContactPage';
import LuxuryContactPage from '@/templates/luxury/LuxuryContactPage';
import SpaContactPage from '@/templates/spa/SpaContactPage';
import CarterasContactPage from '@/templates/carteras/CarterasContactPage';
import AurumContactPage from '@/templates/joyeria/AurumContactPage';
import GroginContactPage from '@/templates/abarrotes/GroginContactPage';
import FreshMartContactPage from '@/templates/supermercado/FreshMartContactPage';
import RopaHombreContactPage from '@/templates/ropa-hombre/RopaHombreContactPage';
import BicicletasContactPage from '@/templates/bicicletas/BicicletasContactPage';
import MotosContactPage from '@/templates/motos/MotosContactPage';
import HoodieContactPage from '@/templates/hoodie/HoodieContactPage';
import TonesContactPage from '@/templates/tones/TonesContactPage';
import ModaMinimalContactPage from '@/templates/moda-minimal/ModaMinimalContactPage';
import CrispyContactPage from '@/templates/comida-app/CrispyContactPage';
import FarmaciaContactPage from '@/templates/farmacia/FarmaciaContactPage';
import StrideContactPage from '@/templates/zapatos/StrideContactPage';
import NordicaContactPage from '@/templates/muebleria/NordicaContactPage';
import PatitasContactPage from '@/templates/mascotas/PatitasContactPage';
import RoseContactPage from '@/templates/bolsos/RoseContactPage';
import CalmaContactPage from '@/templates/hogar/CalmaContactPage';
import KarteraContactPage from '@/templates/kartera/KarteraContactPage';
import OlmoContactPage from '@/templates/olmo/OlmoContactPage';
import AmoraContactPage from '@/templates/amora/AmoraContactPage';
import EsenciaContactPage from '@/templates/esencial/EsenciaContactPage';
import NexoContactPage from '@/templates/celulares/NexoContactPage';
import VerenaContactPage from '@/templates/carteras-market/VerenaContactPage';
import BlushContactPage from '@/templates/maquillaje/BlushContactPage';
import VitrinaContactPage from '@/templates/retail/VitrinaContactPage';
import CanastaContactPage from '@/templates/canasta/CanastaContactPage';
import PetalaContactPage from '@/templates/floreria/PetalaContactPage';
import MaisonContactPage from '@/templates/maison/MaisonContactPage';
import ElanContactPage from '@/templates/moda-elegante/ElanContactPage';
import { useStorePreviewNavigation } from '@/utils/useStorePreviewNavigation';

import { recordarVentaSinStock } from '@/templates/shared/ventaSinStock';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

export default function ContactoRouter() {
  const { slug } = useParams();
  // ?previewPlantilla=<id> muestra la tienda real con otra plantilla (igual que home/catálogo/detalle).
  const [searchParams] = useSearchParams();
  const previewPlantillaId = searchParams.get('previewPlantilla');
  useStorePreviewNavigation(previewPlantillaId);
  const [tienda, setTienda] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorTienda, setErrorTienda] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      setErrorTienda(false);
      try {
        const storeRes = await axios.get(`${BASE_URL}/public/store/${slug}`);
        setTienda(recordarVentaSinStock(storeRes.data?.data || storeRes.data));
        const catRes = await axios.get(`${BASE_URL}/public/store/${slug}/categories`);
        setCategories(Array.isArray(catRes.data?.data) ? catRes.data.data : []);
      } catch (e) {
        // Sin tienda no hay plantilla: reintentar en vez de pintar el contacto por defecto.
        if (!(axios.isAxiosError(e) && e.response?.status === 404)) setErrorTienda(true);
      } finally {
        setLoading(false);
      }
    };
    load();
    try {
      const saved = localStorage.getItem(`tienda:${slug}:carrito`);
      if (saved) setCarrito(JSON.parse(saved));
    } catch {}
  }, [slug, intento]);

  useEffect(() => {
    if (!slug) return;
    localStorage.setItem(`tienda:${slug}:carrito`, JSON.stringify(carrito));
  }, [carrito, slug]);

  const updateQuantity = (itemId: number | string, cantidad: number) => {
    setCarrito((current) => cantidad <= 0
      ? current.filter((item) => String(item.cartId || item.id) !== String(itemId))
      : current.map((item) => String(item.cartId || item.id) === String(itemId) ? { ...item, cantidad } : item));
  };

  if (loading || (errorTienda && !tienda)) {
    return <CargandoTienda error={!loading} onReintentar={() => setIntento((n) => n + 1)} />;
  }

  const disenoBase = tienda?.diseno || {};
  const diseno = previewPlantillaId ? { ...disenoBase, plantillaId: previewPlantillaId } : disenoBase;
  const cp = diseno?.colorPrimario || '#FFD72E';
  const templateId = resolveTemplateId(diseno?.plantillaId);

  return (
    <>
      {templateId === 'luxury' ? (
        <LuxuryContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'spa' ? (
        <SpaContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'carteras' ? (
        <CarterasContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'joyeria' ? (
        <AurumContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'abarrotes' ? (
        <GroginContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'supermercado' ? (
        <FreshMartContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'ropa-hombre' ? (
        <RopaHombreContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'bicicletas' ? (
        <BicicletasContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'motos' ? (
        <MotosContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'hoodie' ? (
        <HoodieContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'tones' ? (
        <TonesContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'comida-app' ? (
        <CrispyContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'moda-minimal' ? (
        <ModaMinimalContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'falcon' ? (
        <FalconContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'farmacia' || templateId === 'salud' ? (
        <FarmaciaContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'zapatos' ? (
        <StrideContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'muebleria' ? (
        <NordicaContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'moda-elegante' ? (
        <ElanContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'floreria' ? (
        <PetalaContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'canasta' ? (
        <CanastaContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'maison' ? (
        <MaisonContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'retail' ? (
        <VitrinaContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'maquillaje' ? (
        <BlushContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'kartera' ? (
        <KarteraContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'olmo' ? (
        <OlmoContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'amora' ? (
        <AmoraContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'carteras-market' ? (
        <VerenaContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'hogar' ? (
        <CalmaContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'esencial' ? (
        <EsenciaContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'celulares' ? (
        <NexoContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'bolsos' ? (
        <RoseContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'mascotas' ? (
        <PatitasContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : templateId === 'construccion' ? (
        <ConstruccionContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      ) : (
        <ApiculturaContactPage
          tienda={tienda}
          slug={slug || ''}
          diseno={diseno}
          cp={cp}
          allCategories={categories}
          carrito={carrito}
          setCarrito={setCarrito}
          mostrarCarrito={mostrarCarrito}
          setMostrarCarrito={setMostrarCarrito}
          actualizarCantidad={updateQuantity}
        />
      )}
      <StoreWhatsAppButton tienda={tienda} />
    </>
  );
}
