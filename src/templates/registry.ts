import React from 'react';
import type { 
  TemplateHomePageProps, 
  TemplateCatalogoPageProps, 
  TemplateCheckoutPageProps,
  TemplateSeguimientoPageProps
} from './shared/types';

// Moda
import ModaHomePage from './moda/ModaHomePage';
import ModaCatalogoPage from './moda/ModaCatalogoPage';
import ModaCheckoutPage from './moda/ModaCheckoutPage';
import ModaSeguimientoPage from './moda/ModaSeguimientoPage';

// Autopartes
import AutopartesHomePage from './autopartes/AutopartesHomePage';
import AutopartesCatalogoPage from './autopartes/AutopartesCatalogoPage';
import AutopartesCheckoutPage from './autopartes/AutopartesCheckoutPage';

// Tecnologia
import TecnologiaHomePage from './tecnologia/TecnologiaHomePage';
import TecnologiaCatalogoPage from './tecnologia/TecnologiaCatalogoPage';
import TecnologiaCheckoutPage from './tecnologia/TecnologiaCheckoutPage';

// Maye
import MayeHomePage from './maye/MayeHomePage';
import MayeCatalogoPage from './maye/MayeCatalogoPage';
import MayeCheckoutPage from './maye/MayeCheckoutPage';

// Gadgets
import GadgetsHomePage from './gadgets/GadgetsHomePage';
import GadgetsCatalogoPage from './gadgets/GadgetsCatalogoPage';
import GadgetsCheckoutPage from './gadgets/GadgetsCheckoutPage';

// Urbano
import UrbanoHomePage from './urbano/UrbanoHomePage';
import UrbanoCatalogoPage from './urbano/UrbanoCatalogoPage';
import UrbanoCheckoutPage from './urbano/UrbanoCheckoutPage';
import UrbanoSeguimientoPage from './urbano/UrbanoSeguimientoPage';

// Apicultura
import ApiculturaHomePage from './apicultura/ApiculturaHomePage';
import ApiculturaCatalogoPage from './apicultura/ApiculturaCatalogoPage';
import ApiculturaCheckoutPage from './apicultura/ApiculturaCheckoutPage';

// Construccion
import ConstruccionHomePage from './construccion/ConstruccionHomePage';
import ConstruccionCatalogoPage from './construccion/ConstruccionCatalogoPage';
import ConstruccionCheckoutPage from './construccion/ConstruccionCheckoutPage';

// Falcon (tecnología)
import FalconHomePage from './falcon/FalconHomePage';
import FalconCatalogoPage from './falcon/FalconCatalogoPage';
import FalconCheckoutPage from './falcon/FalconCheckoutPage';

// Antojo (pizzería + frappes + cremoladas)
import AntojoHomePage from './antojo/AntojoHomePage';
import AntojoCatalogoPage from './antojo/AntojoCatalogoPage';
import AntojoCheckoutPage from './antojo/AntojoCheckoutPage';

// Luxury (perfumería de lujo)
import LuxuryHomePage from './luxury/LuxuryHomePage';
import LuxuryCatalogoPage from './luxury/LuxuryCatalogoPage';
import LuxuryCheckoutPage from './luxury/LuxuryCheckoutPage';

// Spa (salón de belleza & spa)
import SpaHomePage from './spa/SpaHomePage';
import SpaCatalogoPage from './spa/SpaCatalogoPage';
import SpaCheckoutPage from './spa/SpaCheckoutPage';

// Carteras (Luxora — carteras, bolsos y accesorios de lujo)
import CarterasHomePage from './carteras/CarterasHomePage';
import CarterasCatalogoPage from './carteras/CarterasCatalogoPage';
import CarterasCheckoutPage from './carteras/CarterasCheckoutPage';

// Joyería (Aurum — joyería fina de alta gama)
import AurumHomePage from './joyeria/AurumHomePage';
import AurumCatalogoPage from './joyeria/AurumCatalogoPage';
import AurumCheckoutPage from './joyeria/AurumCheckoutPage';

// Abarrotes (Grogin — abarrotes / minimarket / supermercado)
import GroginHomePage from './abarrotes/GroginHomePage';
import GroginCatalogoPage from './abarrotes/GroginCatalogoPage';
import GroginCheckoutPage from './abarrotes/GroginCheckoutPage';

// Supermercado (FreshMart — grocery verde/blanco)
import FreshMartHomePage from './supermercado/FreshMartHomePage';
import FreshMartCatalogoPage from './supermercado/FreshMartCatalogoPage';
import FreshMartCheckoutPage from './supermercado/FreshMartCheckoutPage';

// Ropa Hombre (Urbanic — moda masculina editorial)
import RopaHombreHomePage from './ropa-hombre/RopaHombreHomePage';
import RopaHombreCatalogoPage from './ropa-hombre/RopaHombreCatalogoPage';
import RopaHombreCheckoutPage from './ropa-hombre/RopaHombreCheckoutPage';

// Bicicletas (Vonica — bicicletas, ciclismo & deportes)
import BicicletasHomePage from './bicicletas/BicicletasHomePage';
import BicicletasCatalogoPage from './bicicletas/BicicletasCatalogoPage';
import BicicletasCheckoutPage from './bicicletas/BicicletasCheckoutPage';

// Moda minimal (Norda — ropa & calzado minimalista estilo Everlane)
import ModaMinimalHomePage from './moda-minimal/ModaMinimalHomePage';
import ModaMinimalCatalogoPage from './moda-minimal/ModaMinimalCatalogoPage';
import ModaMinimalCheckoutPage from './moda-minimal/ModaMinimalCheckoutPage';

// Comida app (Crispy — app de comida / delivery)
import CrispyHomePage from './comida-app/CrispyHomePage';
import CrispyCatalogoPage from './comida-app/CrispyCatalogoPage';
import CrispyCheckoutPage from './comida-app/CrispyCheckoutPage';

// Motos (Voltia Motos — venta de motos + servicio/taller mecánico)
import MotosHomePage from './motos/MotosHomePage';
import MotosCatalogoPage from './motos/MotosCatalogoPage';
import MotosCheckoutPage from './motos/MotosCheckoutPage';

// Hoodie (Hoodie — ropa urbana / streetwear editorial)
import HoodieHomePage from './hoodie/HoodieHomePage';
import HoodieCatalogoPage from './hoodie/HoodieCatalogoPage';
import HoodieCheckoutPage from './hoodie/HoodieCheckoutPage';

// Tones (Tones — ropa infantil / bebé cálida y premium)
import TonesHomePage from './tones/TonesHomePage';
import TonesCatalogoPage from './tones/TonesCatalogoPage';
import TonesCheckoutPage from './tones/TonesCheckoutPage';

export interface TemplateConfig {
  id: string;
  HomePage: React.ComponentType<TemplateHomePageProps>;
  CatalogoPage: React.ComponentType<TemplateCatalogoPageProps>;
  CheckoutPage: React.ComponentType<TemplateCheckoutPageProps>;
  SeguimientoPage?: React.ComponentType<TemplateSeguimientoPageProps>;
  // DetallePage (próximamente en otra iteración)
}

export const templateRegistry: Record<string, TemplateConfig> = {
  moda: {
    id: 'moda',
    HomePage: ModaHomePage,
    CatalogoPage: ModaCatalogoPage,
    CheckoutPage: ModaCheckoutPage,
    SeguimientoPage: ModaSeguimientoPage,
  },
  autopartes: {
    id: 'autopartes',
    HomePage: AutopartesHomePage,
    CatalogoPage: AutopartesCatalogoPage,
    CheckoutPage: AutopartesCheckoutPage,
  },
  tecnologia: {
    id: 'tecnologia',
    HomePage: TecnologiaHomePage,
    CatalogoPage: TecnologiaCatalogoPage,
    CheckoutPage: TecnologiaCheckoutPage,
  },
  maye: {
    id: 'maye',
    HomePage: MayeHomePage,
    CatalogoPage: MayeCatalogoPage,
    CheckoutPage: MayeCheckoutPage,
  },
  gadgets: {
    id: 'gadgets',
    HomePage: GadgetsHomePage,
    CatalogoPage: GadgetsCatalogoPage,
    CheckoutPage: GadgetsCheckoutPage,
  },
  'urbano': {
    id: 'urbano',
    HomePage: UrbanoHomePage,
    CatalogoPage: UrbanoCatalogoPage as any,
    CheckoutPage: UrbanoCheckoutPage,
    SeguimientoPage: UrbanoSeguimientoPage,
  },
  apicultura: {
    id: 'apicultura',
    HomePage: ApiculturaHomePage,
    CatalogoPage: ApiculturaCatalogoPage,
    CheckoutPage: ApiculturaCheckoutPage,
  },
  construccion: {
    id: 'construccion',
    HomePage: ConstruccionHomePage,
    CatalogoPage: ConstruccionCatalogoPage,
    CheckoutPage: ConstruccionCheckoutPage,
  },
  falcon: {
    id: 'falcon',
    HomePage: FalconHomePage,
    CatalogoPage: FalconCatalogoPage,
    CheckoutPage: FalconCheckoutPage,
  },
  antojo: {
    id: 'antojo',
    HomePage: AntojoHomePage,
    CatalogoPage: AntojoCatalogoPage,
    CheckoutPage: AntojoCheckoutPage,
  },
  luxury: {
    id: 'luxury',
    HomePage: LuxuryHomePage,
    CatalogoPage: LuxuryCatalogoPage,
    CheckoutPage: LuxuryCheckoutPage,
  },
  spa: {
    id: 'spa',
    HomePage: SpaHomePage,
    CatalogoPage: SpaCatalogoPage,
    CheckoutPage: SpaCheckoutPage,
  },
  carteras: {
    id: 'carteras',
    HomePage: CarterasHomePage,
    CatalogoPage: CarterasCatalogoPage,
    CheckoutPage: CarterasCheckoutPage,
  },
  joyeria: {
    id: 'joyeria',
    HomePage: AurumHomePage,
    CatalogoPage: AurumCatalogoPage,
    CheckoutPage: AurumCheckoutPage,
  },
  abarrotes: {
    id: 'abarrotes',
    HomePage: GroginHomePage,
    CatalogoPage: GroginCatalogoPage,
    CheckoutPage: GroginCheckoutPage,
  },
  supermercado: {
    id: 'supermercado',
    HomePage: FreshMartHomePage,
    CatalogoPage: FreshMartCatalogoPage,
    CheckoutPage: FreshMartCheckoutPage,
  },
  'ropa-hombre': {
    id: 'ropa-hombre',
    HomePage: RopaHombreHomePage,
    CatalogoPage: RopaHombreCatalogoPage,
    CheckoutPage: RopaHombreCheckoutPage,
  },
  bicicletas: {
    id: 'bicicletas',
    HomePage: BicicletasHomePage,
    CatalogoPage: BicicletasCatalogoPage,
    CheckoutPage: BicicletasCheckoutPage,
  },
  motos: {
    id: 'motos',
    HomePage: MotosHomePage,
    CatalogoPage: MotosCatalogoPage,
    CheckoutPage: MotosCheckoutPage,
  },
  hoodie: {
    id: 'hoodie',
    HomePage: HoodieHomePage,
    CatalogoPage: HoodieCatalogoPage,
    CheckoutPage: HoodieCheckoutPage,
  },
  tones: {
    id: 'tones',
    HomePage: TonesHomePage,
    CatalogoPage: TonesCatalogoPage,
    CheckoutPage: TonesCheckoutPage,
  },
  'moda-minimal': {
    id: 'moda-minimal',
    HomePage: ModaMinimalHomePage,
    CatalogoPage: ModaMinimalCatalogoPage,
    CheckoutPage: ModaMinimalCheckoutPage,
  },
  'comida-app': {
    id: 'comida-app',
    HomePage: CrispyHomePage,
    CatalogoPage: CrispyCatalogoPage,
    CheckoutPage: CrispyCheckoutPage,
  },
};
