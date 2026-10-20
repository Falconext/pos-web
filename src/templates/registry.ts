import React from 'react';
import { cargaPerezosa } from '@/lib/cargaPerezosa';

// Cada plantilla se descarga solo si la tienda la usa (antes iban las 32 en el
// mismo archivo que el panel). Las páginas la pintan con <Componente />, así que
// el Suspense de App.tsx cubre la espera.
import type { 
  TemplateHomePageProps, 
  TemplateCatalogoPageProps, 
  TemplateCheckoutPageProps,
  TemplateSeguimientoPageProps
} from './shared/types';

// Moda
const ModaHomePage = cargaPerezosa(() => import('./moda/ModaHomePage'));
const ModaCatalogoPage = cargaPerezosa(() => import('./moda/ModaCatalogoPage'));
const ModaCheckoutPage = cargaPerezosa(() => import('./moda/ModaCheckoutPage'));
const ModaSeguimientoPage = cargaPerezosa(() => import('./moda/ModaSeguimientoPage'));

// Autopartes
const AutopartesHomePage = cargaPerezosa(() => import('./autopartes/AutopartesHomePage'));
const AutopartesCatalogoPage = cargaPerezosa(() => import('./autopartes/AutopartesCatalogoPage'));
const AutopartesCheckoutPage = cargaPerezosa(() => import('./autopartes/AutopartesCheckoutPage'));

// Tecnologia
const TecnologiaHomePage = cargaPerezosa(() => import('./tecnologia/TecnologiaHomePage'));
const TecnologiaCatalogoPage = cargaPerezosa(() => import('./tecnologia/TecnologiaCatalogoPage'));
const TecnologiaCheckoutPage = cargaPerezosa(() => import('./tecnologia/TecnologiaCheckoutPage'));

// Maye
const MayeHomePage = cargaPerezosa(() => import('./maye/MayeHomePage'));
const MayeCatalogoPage = cargaPerezosa(() => import('./maye/MayeCatalogoPage'));
const MayeCheckoutPage = cargaPerezosa(() => import('./maye/MayeCheckoutPage'));

// Gadgets
const GadgetsHomePage = cargaPerezosa(() => import('./gadgets/GadgetsHomePage'));
const GadgetsCatalogoPage = cargaPerezosa(() => import('./gadgets/GadgetsCatalogoPage'));
const GadgetsCheckoutPage = cargaPerezosa(() => import('./gadgets/GadgetsCheckoutPage'));

// Urbano
const UrbanoHomePage = cargaPerezosa(() => import('./urbano/UrbanoHomePage'));
const UrbanoCatalogoPage = cargaPerezosa(() => import('./urbano/UrbanoCatalogoPage'));
const UrbanoCheckoutPage = cargaPerezosa(() => import('./urbano/UrbanoCheckoutPage'));
const UrbanoSeguimientoPage = cargaPerezosa(() => import('./urbano/UrbanoSeguimientoPage'));

// Apicultura
const ApiculturaHomePage = cargaPerezosa(() => import('./apicultura/ApiculturaHomePage'));
const ApiculturaCatalogoPage = cargaPerezosa(() => import('./apicultura/ApiculturaCatalogoPage'));
const ApiculturaCheckoutPage = cargaPerezosa(() => import('./apicultura/ApiculturaCheckoutPage'));

// Construccion
const ConstruccionHomePage = cargaPerezosa(() => import('./construccion/ConstruccionHomePage'));
const ConstruccionCatalogoPage = cargaPerezosa(() => import('./construccion/ConstruccionCatalogoPage'));
const ConstruccionCheckoutPage = cargaPerezosa(() => import('./construccion/ConstruccionCheckoutPage'));

// Falcon (tecnología)
const FalconHomePage = cargaPerezosa(() => import('./falcon/FalconHomePage'));
const FalconCatalogoPage = cargaPerezosa(() => import('./falcon/FalconCatalogoPage'));
const FalconCheckoutPage = cargaPerezosa(() => import('./falcon/FalconCheckoutPage'));

// Antojo (pizzería + frappes + cremoladas)
const AntojoHomePage = cargaPerezosa(() => import('./antojo/AntojoHomePage'));
const AntojoCatalogoPage = cargaPerezosa(() => import('./antojo/AntojoCatalogoPage'));
const AntojoCheckoutPage = cargaPerezosa(() => import('./antojo/AntojoCheckoutPage'));

// Luxury (perfumería de lujo)
const LuxuryHomePage = cargaPerezosa(() => import('./luxury/LuxuryHomePage'));
const LuxuryCatalogoPage = cargaPerezosa(() => import('./luxury/LuxuryCatalogoPage'));
const LuxuryCheckoutPage = cargaPerezosa(() => import('./luxury/LuxuryCheckoutPage'));

// Spa (salón de belleza & spa)
const SpaHomePage = cargaPerezosa(() => import('./spa/SpaHomePage'));
const SpaCatalogoPage = cargaPerezosa(() => import('./spa/SpaCatalogoPage'));
const SpaCheckoutPage = cargaPerezosa(() => import('./spa/SpaCheckoutPage'));

// Carteras (Luxora — carteras, bolsos y accesorios de lujo)
const CarterasHomePage = cargaPerezosa(() => import('./carteras/CarterasHomePage'));
const CarterasCatalogoPage = cargaPerezosa(() => import('./carteras/CarterasCatalogoPage'));
const CarterasCheckoutPage = cargaPerezosa(() => import('./carteras/CarterasCheckoutPage'));

// Joyería (Aurum — joyería fina de alta gama)
const AurumHomePage = cargaPerezosa(() => import('./joyeria/AurumHomePage'));
const AurumCatalogoPage = cargaPerezosa(() => import('./joyeria/AurumCatalogoPage'));
const AurumCheckoutPage = cargaPerezosa(() => import('./joyeria/AurumCheckoutPage'));

// Abarrotes (Grogin — abarrotes / minimarket / supermercado)
const GroginHomePage = cargaPerezosa(() => import('./abarrotes/GroginHomePage'));
const GroginCatalogoPage = cargaPerezosa(() => import('./abarrotes/GroginCatalogoPage'));
const GroginCheckoutPage = cargaPerezosa(() => import('./abarrotes/GroginCheckoutPage'));

// Supermercado (FreshMart — grocery verde/blanco)
const FreshMartHomePage = cargaPerezosa(() => import('./supermercado/FreshMartHomePage'));
const FreshMartCatalogoPage = cargaPerezosa(() => import('./supermercado/FreshMartCatalogoPage'));
const FreshMartCheckoutPage = cargaPerezosa(() => import('./supermercado/FreshMartCheckoutPage'));

// Ropa Hombre (Urbanic — moda masculina editorial)
const RopaHombreHomePage = cargaPerezosa(() => import('./ropa-hombre/RopaHombreHomePage'));
const RopaHombreCatalogoPage = cargaPerezosa(() => import('./ropa-hombre/RopaHombreCatalogoPage'));
const RopaHombreCheckoutPage = cargaPerezosa(() => import('./ropa-hombre/RopaHombreCheckoutPage'));

// Bicicletas (Vonica — bicicletas, ciclismo & deportes)
const BicicletasHomePage = cargaPerezosa(() => import('./bicicletas/BicicletasHomePage'));
const BicicletasCatalogoPage = cargaPerezosa(() => import('./bicicletas/BicicletasCatalogoPage'));
const BicicletasCheckoutPage = cargaPerezosa(() => import('./bicicletas/BicicletasCheckoutPage'));

// Moda minimal (Norda — ropa & calzado minimalista estilo Everlane)
const ModaMinimalHomePage = cargaPerezosa(() => import('./moda-minimal/ModaMinimalHomePage'));
const ModaMinimalCatalogoPage = cargaPerezosa(() => import('./moda-minimal/ModaMinimalCatalogoPage'));
const ModaMinimalCheckoutPage = cargaPerezosa(() => import('./moda-minimal/ModaMinimalCheckoutPage'));

// Comida app (Crispy — app de comida / delivery)
const CrispyHomePage = cargaPerezosa(() => import('./comida-app/CrispyHomePage'));
const CrispyCatalogoPage = cargaPerezosa(() => import('./comida-app/CrispyCatalogoPage'));
const CrispyCheckoutPage = cargaPerezosa(() => import('./comida-app/CrispyCheckoutPage'));

// Motos (Voltia Motos — venta de motos + servicio/taller mecánico)
const MotosHomePage = cargaPerezosa(() => import('./motos/MotosHomePage'));
const MotosCatalogoPage = cargaPerezosa(() => import('./motos/MotosCatalogoPage'));
const MotosCheckoutPage = cargaPerezosa(() => import('./motos/MotosCheckoutPage'));

// Hoodie (Hoodie — ropa urbana / streetwear editorial)
const HoodieHomePage = cargaPerezosa(() => import('./hoodie/HoodieHomePage'));
const HoodieCatalogoPage = cargaPerezosa(() => import('./hoodie/HoodieCatalogoPage'));
const HoodieCheckoutPage = cargaPerezosa(() => import('./hoodie/HoodieCheckoutPage'));

// Tones (Tones — ropa infantil / bebé cálida y premium)
const TonesHomePage = cargaPerezosa(() => import('./tones/TonesHomePage'));
const TonesCatalogoPage = cargaPerezosa(() => import('./tones/TonesCatalogoPage'));
const TonesCheckoutPage = cargaPerezosa(() => import('./tones/TonesCheckoutPage'));

// Farmacia (MediCare — farmacia / botica / medicamentos, verde médico premium)
const FarmaciaHomePage = cargaPerezosa(() => import('./farmacia/FarmaciaHomePage'));
const FarmaciaCatalogoPage = cargaPerezosa(() => import('./farmacia/FarmaciaCatalogoPage'));
const FarmaciaCheckoutPage = cargaPerezosa(() => import('./farmacia/FarmaciaCheckoutPage'));

// Zapatos (Stride — zapatería / zapatillas / calzado, oliva + beige premium)
const StrideHomePage = cargaPerezosa(() => import('./zapatos/StrideHomePage'));
const StrideCatalogoPage = cargaPerezosa(() => import('./zapatos/StrideCatalogoPage'));
const StrideCheckoutPage = cargaPerezosa(() => import('./zapatos/StrideCheckoutPage'));

// Mueblería (Nórdica — muebles / decoración / hogar, escandinavo cálido)
const NordicaHomePage = cargaPerezosa(() => import('./muebleria/NordicaHomePage'));
const NordicaCatalogoPage = cargaPerezosa(() => import('./muebleria/NordicaCatalogoPage'));
const NordicaCheckoutPage = cargaPerezosa(() => import('./muebleria/NordicaCheckoutPage'));

// Mascotas (Patitas — veterinaria / pet shop, cálido y juguetón)
const PatitasHomePage = cargaPerezosa(() => import('./mascotas/PatitasHomePage'));
const PatitasCatalogoPage = cargaPerezosa(() => import('./mascotas/PatitasCatalogoPage'));
const PatitasCheckoutPage = cargaPerezosa(() => import('./mascotas/PatitasCheckoutPage'));

// Maquillaje (Blush — maquillaje / cosméticos / skincare, rosa nude premium)
const BlushHomePage = cargaPerezosa(() => import('./maquillaje/BlushHomePage'));
const BlushCatalogoPage = cargaPerezosa(() => import('./maquillaje/BlushCatalogoPage'));
const BlushCheckoutPage = cargaPerezosa(() => import('./maquillaje/BlushCheckoutPage'));

// Retail (Vitrina — comercio minorista / bazar / tienda multi-categoría)
const VitrinaHomePage = cargaPerezosa(() => import('./retail/VitrinaHomePage'));
const VitrinaCatalogoPage = cargaPerezosa(() => import('./retail/VitrinaCatalogoPage'));
const VitrinaCheckoutPage = cargaPerezosa(() => import('./retail/VitrinaCheckoutPage'));
// Bolsos (Rosé — carteras / bolsos / marroquinería, rosa y vino con serif de lujo)
const RoseHomePage = cargaPerezosa(() => import('./bolsos/RoseHomePage'));
const RoseCatalogoPage = cargaPerezosa(() => import('./bolsos/RoseCatalogoPage'));
const RoseCheckoutPage = cargaPerezosa(() => import('./bolsos/RoseCheckoutPage'));

// Moda Elegante (Élan — moda femenina, ropa y calzado, lujo minimal editorial)
const ElanHomePage = cargaPerezosa(() => import('./moda-elegante/ElanHomePage'));
const ElanCatalogoPage = cargaPerezosa(() => import('./moda-elegante/ElanCatalogoPage'));
const ElanCheckoutPage = cargaPerezosa(() => import('./moda-elegante/ElanCheckoutPage'));

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
  farmacia: {
    id: 'farmacia',
    HomePage: FarmaciaHomePage,
    CatalogoPage: FarmaciaCatalogoPage,
    CheckoutPage: FarmaciaCheckoutPage,
  },
  // 'salud' es el diseño asignado al rubro Farmacia/Botica → usa la plantilla MediCare
  salud: {
    id: 'salud',
    HomePage: FarmaciaHomePage,
    CatalogoPage: FarmaciaCatalogoPage,
    CheckoutPage: FarmaciaCheckoutPage,
  },
  zapatos: {
    id: 'zapatos',
    HomePage: StrideHomePage,
    CatalogoPage: StrideCatalogoPage,
    CheckoutPage: StrideCheckoutPage,
  },
  muebleria: {
    id: 'muebleria',
    HomePage: NordicaHomePage,
    CatalogoPage: NordicaCatalogoPage,
    CheckoutPage: NordicaCheckoutPage,
  },
  mascotas: {
    id: 'mascotas',
    HomePage: PatitasHomePage,
    CatalogoPage: PatitasCatalogoPage,
    CheckoutPage: PatitasCheckoutPage,
  },
  'moda-elegante': {
    id: 'moda-elegante',
    HomePage: ElanHomePage,
    CatalogoPage: ElanCatalogoPage,
    CheckoutPage: ElanCheckoutPage,
  },
  maquillaje: {
    id: 'maquillaje',
    HomePage: BlushHomePage,
    CatalogoPage: BlushCatalogoPage,
    CheckoutPage: BlushCheckoutPage,
  },
  bolsos: {
    id: 'bolsos',
    HomePage: RoseHomePage,
    CatalogoPage: RoseCatalogoPage,
    CheckoutPage: RoseCheckoutPage,
  },
  retail: {
    id: 'retail',
    HomePage: VitrinaHomePage,
    CatalogoPage: VitrinaCatalogoPage,
    CheckoutPage: VitrinaCheckoutPage,
  },
};
