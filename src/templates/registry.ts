import React from 'react';
import type { 
  TemplateHomePageProps, 
  TemplateCatalogoPageProps, 
  TemplateCheckoutPageProps 
} from './shared/types';

// Moda
import ModaHomePage from './moda/ModaHomePage';
import ModaCatalogoPage from './moda/ModaCatalogoPage';
import ModaCheckoutPage from './moda/ModaCheckoutPage';

// Autopartes
import AutopartesHomePage from './autopartes/AutopartesHomePage';
import AutopartesCatalogoPage from './autopartes/AutopartesCatalogoPage';
import AutopartesCheckoutPage from './autopartes/AutopartesCheckoutPage';

// Gadgets
import GadgetsHomePage from './gadgets/GadgetsHomePage';
import GadgetsCatalogoPage from './gadgets/GadgetsCatalogoPage';
import GadgetsCheckoutPage from './gadgets/GadgetsCheckoutPage';

// Urbano
import UrbanoHomePage from './urbano/UrbanoHomePage';
import UrbanoCatalogoPage from './urbano/UrbanoCatalogoPage';
import UrbanoCheckoutPage from './urbano/UrbanoCheckoutPage';

export interface TemplateConfig {
  id: string;
  HomePage: React.ComponentType<TemplateHomePageProps>;
  CatalogoPage: React.ComponentType<TemplateCatalogoPageProps>;
  CheckoutPage: React.ComponentType<TemplateCheckoutPageProps>;
  // DetallePage (próximamente en otra iteración)
}

export const templateRegistry: Record<string, TemplateConfig> = {
  moda: {
    id: 'moda',
    HomePage: ModaHomePage,
    CatalogoPage: ModaCatalogoPage,
    CheckoutPage: ModaCheckoutPage,
  },
  autopartes: {
    id: 'autopartes',
    HomePage: AutopartesHomePage,
    CatalogoPage: AutopartesCatalogoPage,
    CheckoutPage: AutopartesCheckoutPage,
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
  },
};
