/**
 * El pie (footer) de cada plantilla, suelto, para páginas genéricas de la
 * tienda (Libro de Reclamaciones) que no tienen versión por plantilla.
 *
 * Cada pie se descarga solo si la tienda usa esa plantilla. Las claves son las
 * mismas del `templateRegistry`: una prueba verifica que no falte ninguna y
 * que todas muestren el enlace al Libro de Reclamaciones.
 */
import { Suspense, useMemo, type ComponentType } from 'react';
import { cargaPerezosa } from '@/lib/cargaPerezosa';
import { useIrEnTienda } from '@/components/tienda/navTienda';
import Footer from '@/components/tienda/Footer';

export interface PropsPie {
  tienda: any;
  slug: string;
  diseno: any;
  cp: string;
  /** Nombres de categorías. */
  categories: string[];
  navigate: (to: string) => void;
}

type Modulo = { default: ComponentType<PropsPie> };
export type CargadorPie = () => Promise<Modulo>;

const pie = (C: ComponentType<PropsPie>): Modulo => ({ default: C });

/** Plantillas con tema (`t`) y `navigate`, como las arma su portada. */
function conTema(Comp: ComponentType<any>, tema: (diseno: any) => unknown): Modulo {
  return pie((p) => <Comp {...p} t={tema(p.diseno)} />);
}

export const PIES_DE_PLANTILLA: Record<string, CargadorPie> = {
  moda: () => import('@/components/tienda/ModaFooter').then((m) => pie((p) => <m.default tienda={p.tienda} slug={p.slug} diseno={p.diseno} tiendaNombre={p.tienda?.nombre || p.tienda?.nombreComercial || ''} />)),
  autopartes: () => import('@/components/tienda/AutopartesFooter').then((m) => pie((p) => <m.default tienda={p.tienda} slug={p.slug} diseno={p.diseno} categories={p.categories} />)),
  tecnologia: () => import('@/components/tienda/TecnologiaFooter').then((m) => pie((p) => <m.default tienda={p.tienda} slug={p.slug} diseno={p.diseno} categories={p.categories} />)),
  maye: () => import('@/components/tienda/MayeFooter').then((m) => pie((p) => <m.default tienda={p.tienda} slug={p.slug} diseno={p.diseno} />)),
  gadgets: () => Promise.resolve(pie((p) => <Footer tienda={p.tienda} diseno={p.diseno} slug={p.slug} />)),
  urbano: () => import('@/templates/urbano/UrbanoFooter').then((m) => pie((p) => <m.default tienda={p.tienda} slug={p.slug} diseno={p.diseno} categories={p.categories} />)),
  apicultura: () => import('@/templates/apicultura/ApiculturaParts').then((m) => pie(m.ApiculturaFooter)),
  construccion: () => import('@/templates/construccion/ConstruccionHomePage').then((m) => pie(m.ConstruccionFooter)),
  falcon: () => import('@/templates/falcon/FalconShared').then((m) => pie((p) => <m.FalconFooter {...p} green={m.resolveFalconGreen(p.diseno, p.cp)} />)),
  antojo: () => import('@/templates/antojo/AntojoParts').then((m) => pie(m.AntojoFooter)),
  luxury: () => import('@/templates/luxury/LuxuryParts').then((m) => pie(m.LuxuryFooter)),
  spa: () => import('@/templates/spa/SpaParts').then((m) => pie(m.SpaFooter)),
  carteras: () => import('@/templates/carteras/CarterasParts').then((m) => pie(m.LuxFooter)),
  joyeria: () => import('@/templates/joyeria/AurumParts').then((m) => pie(m.AurFooter)),
  abarrotes: () => import('@/templates/abarrotes/GroginParts').then((m) => pie(m.GroFooter)),
  supermercado: () => import('@/templates/supermercado/FreshMartParts').then((m) => pie(m.FmFooter)),
  'ropa-hombre': () => import('@/templates/ropa-hombre/RopaHombreParts').then((m) => conTema(m.UrbFooter, m.urbTheme)),
  bicicletas: () => import('@/templates/bicicletas/BicicletasParts').then((m) => pie(m.VeloFooter)),
  motos: () => import('@/templates/motos/MotosParts').then((m) => pie(m.MotoFooter)),
  hoodie: () => import('@/templates/hoodie/HoodieParts').then((m) => conTema(m.HdFooter, m.hdTheme)),
  tones: () => import('@/templates/tones/TonesParts').then((m) => pie(m.TnFooter)),
  'moda-minimal': () => import('@/templates/moda-minimal/ModaMinimalParts').then((m) => pie(m.MinFooter)),
  'comida-app': () => import('@/templates/comida-app/CrispyParts').then((m) => pie(m.FoodFooter)),
  farmacia: () => import('@/templates/farmacia/FarmaciaParts').then((m) => conTema(m.FarmaciaFooter, m.farmaciaTheme)),
  salud: () => import('@/templates/farmacia/FarmaciaParts').then((m) => conTema(m.FarmaciaFooter, m.farmaciaTheme)),
  zapatos: () => import('@/templates/zapatos/StrideParts').then((m) => conTema(m.StrideFooter, m.strideTheme)),
  muebleria: () => import('@/templates/muebleria/NordicaParts').then((m) => conTema(m.NordicaFooter, m.nordicaTheme)),
  mascotas: () => import('@/templates/mascotas/PatitasParts').then((m) => conTema(m.PatitasFooter, m.patitasTheme)),
  'moda-elegante': () => import('@/templates/moda-elegante/ElanParts').then((m) => conTema(m.ElanFooter, m.elanTheme)),
  maquillaje: () => import('@/templates/maquillaje/BlushParts').then((m) => conTema(m.BlushFooter, m.blushTheme)),
  bolsos: () => import('@/templates/bolsos/RoseParts').then((m) => conTema(m.RoseFooter, m.roseTheme)),
  retail: () => import('@/templates/retail/VitrinaParts').then((m) => conTema(m.VitrinaFooter, m.vitrinaTheme)),
  canasta: () => import('@/templates/canasta/CanastaParts').then((m) => conTema(m.CanastaFooter, m.canastaTheme)),
  floreria: () => import('@/templates/floreria/PetalaParts').then((m) => conTema(m.PetalaFooter, m.petalaTheme)),
  maison: () => import('@/templates/maison/MaisonParts').then((m) => conTema(m.MaisonFooter, m.maisonTheme)),
  mostrador: () => import('@/templates/mostrador/MostradorParts').then((m) => conTema(m.MostradorFooter, m.mostradorTheme)),
  hogar: () => import('@/templates/hogar/CalmaParts').then((m) => conTema(m.CalmaFooter, m.calmaTheme)),
  kartera: () => import('@/templates/kartera/KarteraParts').then((m) => conTema(m.KtFooter, m.ktTheme)),
  olmo: () => import('@/templates/olmo/OlmoParts').then((m) => conTema(m.OlmoFooter, m.olTheme)),
  amora: () => import('@/templates/amora/AmoraParts').then((m) => conTema(m.AmFooter, m.amTheme)),
  esencial: () => import('@/templates/esencial/EsenciaParts').then((m) => conTema(m.EsenciaFooter, m.esenciaTheme)),
  celulares: () => import('@/templates/celulares/NexoParts').then((m) => conTema(m.NexoFooter, m.nexoTheme)),
  'carteras-market': () => import('@/templates/carteras-market/VerenaParts').then((m) => conTema(m.VerenaFooter, m.verenaTheme)),
};

const perezosos = new Map<string, ComponentType<PropsPie>>();
function piePerezoso(id: string): ComponentType<PropsPie> | null {
  const cargar = PIES_DE_PLANTILLA[id];
  if (!cargar) return null;
  if (!perezosos.has(id)) perezosos.set(id, cargaPerezosa(cargar));
  return perezosos.get(id)!;
}

interface Props {
  templateId: string;
  tienda: any;
  slug: string;
  diseno: any;
  categories?: string[];
}

/** Pie de la plantilla activa; sin plantilla conocida, el pie genérico. */
export default function PieDePlantilla({ templateId, tienda, slug, diseno, categories = [] }: Props) {
  const navigate = useIrEnTienda(slug, diseno);
  const Pie = useMemo(() => piePerezoso(templateId), [templateId]);
  const cp = diseno?.colorPrimario || '#111827';
  if (!Pie) return <Footer tienda={tienda || {}} diseno={diseno} slug={slug} />;
  return (
    <Suspense fallback={<div className="h-40" aria-hidden="true" />}>
      <Pie tienda={tienda} slug={slug} diseno={diseno} cp={cp} categories={categories} navigate={navigate} />
    </Suspense>
  );
}
