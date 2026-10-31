/**
 * Menús configurables y navegación sin recarga de las plantillas falcon,
 * construccion, joyeria (Aurum), carteras (Luxora), luxury y spa.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { FalconFooter, FalconHeader } from '@/templates/falcon/FalconShared';
import ConstruccionHeader from '@/templates/construccion/ConstruccionHeader';
import { ConstruccionFooter } from '@/templates/construccion/ConstruccionHomePage';
import { AurFooter, AurHeader } from '@/templates/joyeria/AurumParts';
import { LuxHeader } from '@/templates/carteras/CarterasParts';
import { LuxuryHeader } from '@/templates/luxury/LuxuryParts';
import { SpaFooter, SpaHeader } from '@/templates/spa/SpaParts';
import { bloquesConDestino } from '@/templates/shared/destinoBloque';
import { LUXURY_COLECCIONES, LUXURY_FAMILIAS, LUXURY_HERO_BOTONES } from '@/templates/luxury/menuLuxury';
import { SPA_SERVICIOS } from '@/templates/spa/menuSpa';
import { getLiveEditorConfig } from '@/components/tienda/liveEditorFields';

beforeAll(() => {
  // framer-motion (whileInView) necesita IntersectionObserver; jsdom no lo trae.
  (globalThis as any).IntersectionObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  };
});

function Ubicacion() {
  const loc = useLocation();
  return <output data-testid="ubicacion">{`${loc.pathname}${loc.search}`}</output>;
}

function montar(ui: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={['/tienda/demo']}>
      <Routes>
        <Route path="*" element={<>{ui}<Ubicacion /></>} />
      </Routes>
    </MemoryRouter>,
  );
}

const enlace = (nombre: string | RegExp) => screen.getByRole('link', { name: nombre });
const ubicacion = () => screen.getByTestId('ubicacion').textContent;

const CATS = [{ nombre: 'Ofertas' }, { nombre: 'Colecciones' }, { nombre: 'Servicios' }, { nombre: 'Taladros' }];
const TIENDA = { nombreComercial: 'Demo' };

describe('falcon', () => {
  const header = (diseno: any = {}) => (
    <FalconHeader tienda={TIENDA} slug="demo" green="#1a8d4e" cartCount={0} cartTotal={0} onOpenCart={() => {}} diseno={diseno} categories={CATS} />
  );

  it('"Ofertas" del header filtra por la categoría parecida y navega sin recargar', () => {
    montar(header());
    const ofertas = enlace('Ofertas');
    expect(ofertas).toHaveAttribute('href', '/tienda/demo/catalogo?category=Ofertas');
    fireEvent.click(ofertas);
    expect(ubicacion()).toBe('/tienda/demo/catalogo?category=Ofertas');
  });

  it('"Ofertas" respeta el texto y el destino del editor; "Sin enlace" lo oculta', () => {
    const { unmount } = montar(header({ falconNavOffers: 'Remate', falconNavOffersActionType: 'search', falconNavOffersActionValue: 'remate' }));
    expect(enlace('Remate')).toHaveAttribute('href', '/tienda/demo/catalogo?search=remate');
    unmount();
    montar(header({ falconNavOffersActionType: 'none' }));
    expect(screen.queryByRole('link', { name: 'Ofertas' })).toBeNull();
  });

  it('footer: Inicio/Nosotros/Tienda fijos, Novedades ordena por nuevo y Atención va a seguimiento/contacto', () => {
    montar(<FalconFooter tienda={TIENDA} slug="demo" green="#1a8d4e" categories={[]} diseno={{}} />);
    expect(enlace('Inicio')).toHaveAttribute('href', '/tienda/demo');
    expect(enlace('Nosotros')).toHaveAttribute('href', '/tienda/demo/contacto');
    expect(enlace('Tienda')).toHaveAttribute('href', '/tienda/demo/catalogo');
    expect(enlace('Novedades')).toHaveAttribute('href', '/tienda/demo/catalogo?sort=new');
    expect(enlace('Mi cuenta')).toHaveAttribute('href', '/tienda/demo/seguimiento');
    expect(enlace('Rastrea tu pedido')).toHaveAttribute('href', '/tienda/demo/seguimiento');
    expect(enlace('Cambios/Devoluciones')).toHaveAttribute('href', '/tienda/demo/contacto');
    expect(enlace('Productos')).toHaveAttribute('href', '/tienda/demo/catalogo');
  });

  it('footer: sin redes configuradas no hay íconos "#"; con Instagram sale solo ese', () => {
    const { container, unmount } = montar(<FalconFooter tienda={TIENDA} slug="demo" green="#1a8d4e" diseno={{}} />);
    expect(container.querySelector('a[href="#"]')).toBeNull();
    expect(screen.queryByText('Síguenos')).toBeNull();
    unmount();
    const r = montar(<FalconFooter tienda={{ ...TIENDA, instagramUrl: 'https://instagram.com/demo' }} slug="demo" green="#1a8d4e" diseno={{}} />);
    expect(r.container.querySelector('a[href="https://instagram.com/demo"]')).toHaveAttribute('target', '_blank');
  });
});

describe('construccion', () => {
  const header = (diseno: any = {}) => (
    <ConstruccionHeader tienda={TIENDA} slug="demo" diseno={diseno} accent="#ffb400" cartCount={0} onOpenCart={() => {}} categories={CATS} />
  );

  it('Categorías/Productos/Ofertas destacadas son configurables y conservan su badge', () => {
    montar(header({ construccionNavProductsActionType: 'category', construccionNavProductsActionValue: 'Taladros', construccionNavOffersActionType: 'none' }));
    const categorias = enlace(/Categorías/);
    expect(within(categorias).getByText('OFERTA')).toBeInTheDocument();
    const productos = enlace(/Productos/);
    expect(productos).toHaveAttribute('href', '/tienda/demo/catalogo?category=Taladros');
    expect(within(productos).getByText('TOP')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ofertas destacadas' })).toBeNull();
    fireEvent.click(productos);
    expect(ubicacion()).toBe('/tienda/demo/catalogo?category=Taladros');
  });

  it('el buscador navega sin recargar (vacío → catálogo)', () => {
    montar(header());
    fireEvent.change(screen.getByPlaceholderText('Buscar...'), { target: { value: 'martillo' } });
    fireEvent.submit(screen.getByPlaceholderText('Buscar...').closest('form')!);
    expect(ubicacion()).toBe('/tienda/demo/catalogo?search=martillo');
  });

  it('footer: Novedades ordena por lo más nuevo', () => {
    montar(<ConstruccionFooter tienda={TIENDA} slug="demo" cp="#ffb400" categories={[]} diseno={{}} />);
    expect(enlace('Novedades')).toHaveAttribute('href', '/tienda/demo/catalogo?sort=new');
  });
});

describe('joyeria (Aurum)', () => {
  it('novedades → sort=new y colección → categoría parecida', () => {
    montar(<AurHeader tienda={TIENDA} slug="demo" cp="#c9a96e" diseno={{}} carritoSize={0} onOpenCart={() => {}} allCategories={CATS} />);
    expect(enlace('novedades')).toHaveAttribute('href', '/tienda/demo/catalogo?sort=new');
    expect(enlace('colección')).toHaveAttribute('href', '/tienda/demo/catalogo?category=Colecciones');
  });

  it('footer: redes sin URL no se muestran (WhatsApp sí)', () => {
    const { container } = montar(<AurFooter tienda={TIENDA} slug="demo" cp="#c9a96e" diseno={{}} />);
    expect(container.querySelector('a[href="#"]')).toBeNull();
    expect(container.querySelector('a[href^="https://wa.me/"]')).not.toBeNull();
  });
});

describe('carteras (Luxora)', () => {
  it('Novedades configurable a una URL externa abre otra pestaña', () => {
    montar(<LuxHeader tienda={TIENDA} slug="demo" cp="#1a1613" diseno={{ carterasMenu1ActionType: 'url', carterasMenu1ActionUrl: 'https://ejemplo.com/lookbook' }} carritoSize={0} onOpenCart={() => {}} allCategories={[]} />);
    const novedades = enlace('Novedades');
    expect(novedades).toHaveAttribute('href', 'https://ejemplo.com/lookbook');
    expect(novedades).toHaveAttribute('target', '_blank');
  });
});

describe('luxury', () => {
  it('"Colección" del header es configurable', () => {
    montar(<LuxuryHeader tienda={TIENDA} slug="demo" cp="#7c5cbf" diseno={{ luxuryMenu1Text: 'Fragancias' }} carritoSize={0} onOpenCart={() => {}} allCategories={[]} />);
    expect(enlace('Fragancias')).toHaveAttribute('href', '/tienda/demo/catalogo');
  });

  it('colecciones: categoría real parecida o catálogo (no un catálogo vacío)', () => {
    const r = bloquesConDestino(LUXURY_COLECCIONES, { diseno: {}, slug: 'demo', categorias: [{ nombre: 'MUJERES' }] });
    expect(r.map((b) => b.href)).toEqual([
      '/tienda/demo/catalogo?category=MUJERES',
      '/tienda/demo/catalogo',
      '/tienda/demo/catalogo',
      '/tienda/demo/catalogo',
    ]);
  });

  it('familias olfativas: búsqueda de siempre si no hay categoría; "Sin enlace" la quita', () => {
    const r = bloquesConDestino(LUXURY_FAMILIAS, { diseno: { luxuryFamily6ActionType: 'none' }, slug: 'demo', categorias: [{ nombre: 'Florales' }] });
    expect(r).toHaveLength(5);
    expect(r[0].href).toBe('/tienda/demo/catalogo?category=Florales');
    expect(r[2].href).toBe('/tienda/demo/catalogo?search=citrico');
  });

  it('"Ver ofertas" busca "oferta" por defecto y respeta el destino elegido', () => {
    const def = bloquesConDestino(LUXURY_HERO_BOTONES, { diseno: {}, slug: 'demo', categorias: [] });
    expect(def[1].href).toBe('/tienda/demo/catalogo?search=oferta');
    const cfg = bloquesConDestino(LUXURY_HERO_BOTONES, { diseno: { luxuryHeroButton2ActionType: 'category', luxuryHeroButton2ActionValue: 'Sale' }, slug: 'demo', categorias: [] });
    expect(cfg[1].href).toBe('/tienda/demo/catalogo?category=Sale');
  });
});

describe('spa', () => {
  it('"Servicios" del header va a la categoría Servicios', () => {
    montar(<SpaHeader tienda={TIENDA} slug="demo" cp="#c48b9f" diseno={{}} carritoSize={0} onOpenCart={() => {}} allCategories={CATS} />);
    // El primero es el botón del menú (el segundo, la categoría real listada a continuación).
    expect(screen.getAllByRole('link', { name: 'Servicios' })[0]).toHaveAttribute('href', '/tienda/demo/catalogo?category=Servicios');
  });

  it('servicios del inicio: categoría parecida o la búsqueda de antes', () => {
    const r = bloquesConDestino(SPA_SERVICIOS, { diseno: {}, slug: 'demo', categorias: [{ nombre: 'Masajes' }] });
    expect(r.map((b) => b.href)).toEqual([
      '/tienda/demo/catalogo?search=facial',
      '/tienda/demo/catalogo?category=Masajes',
      '/tienda/demo/catalogo?search=u%C3%B1as',
      '/tienda/demo/catalogo?search=cabello',
    ]);
  });

  it('vista previa: los enlaces avisan al editor en vez de navegar', () => {
    const escuchar = jest.fn();
    window.addEventListener('preview-nav', escuchar);
    montar(<SpaFooter tienda={TIENDA} slug="preview" cp="#c48b9f" diseno={{}} />);
    fireEvent.click(screen.getAllByRole('link', { name: 'Contacto' })[0]);
    window.removeEventListener('preview-nav', escuchar);
    expect(escuchar).toHaveBeenCalledTimes(1);
    expect((escuchar.mock.calls[0][0] as CustomEvent).detail).toBe('contacto');
    expect(ubicacion()).toBe('/tienda/demo');
  });
});

describe('panel "Personalizar tienda"', () => {
  const claves = (id: string) => {
    const c = getLiveEditorConfig(id);
    return {
      textos: c.textFields.map((f) => f.key),
      enlaces: c.linkFields.map((f) => f.key),
      imagenes: c.imageFields.map((f) => f.key),
    };
  };

  it('luxury y spa ya tienen configuración propia', () => {
    const lux = claves('luxury');
    expect(lux.textos).toEqual(expect.arrayContaining(['luxuryLogoText', 'luxuryHeroTitle', 'luxuryCupon', 'luxuryOcultarEnvio', 'luxuryMenu1Text', 'luxuryCollection1Text']));
    expect(lux.enlaces).toEqual(expect.arrayContaining(['luxuryMenu1Action', 'luxuryCollection4Action', 'luxuryFamily6Action', 'luxuryHeroButton2Action']));
    const spa = claves('spa');
    expect(spa.textos).toEqual(expect.arrayContaining(['spaLogoText', 'spaHeroTitle2', 'spaOcultarEnvio', 'spaMenu1Text']));
    expect(spa.imagenes).toEqual(expect.arrayContaining(['spaHeroImage', 'spaService1Image']));
    expect(spa.enlaces).toEqual(expect.arrayContaining(['spaMenu1Action', 'spaService4Action']));
  });

  it('cada plantilla expone los destinos de sus botones y no campos muertos', () => {
    expect(claves('falcon').enlaces).toEqual(expect.arrayContaining(['falconNavOffersAction', 'falconMenu2Action', 'falconMenu8Action']));
    expect(claves('construccion').enlaces).toEqual(expect.arrayContaining(['construccionNavCategoriesAction', 'construccionNavProductsAction', 'construccionNavOffersAction', 'construccionMenu1Action']));
    expect(claves('joyeria').enlaces).toEqual(expect.arrayContaining(['joyeriaMenu1Action', 'joyeriaMenu2Action', 'joyeriaPromoAction', 'joyeriaClubAction']));
    expect(claves('joyeria').textos).not.toEqual(expect.arrayContaining(['joyeriaHeroButton2']));
    expect(claves('joyeria').textos).not.toContain('joyeriaLogoTagline');
    expect(claves('carteras').enlaces).toEqual(expect.arrayContaining(['carterasMenu1Action', 'carterasHeroButton2Action', 'carterasPromoAction', 'carterasClubAction']));
  });

  it('las claves no se repiten dentro de una plantilla', () => {
    for (const id of ['falcon', 'construccion', 'joyeria', 'carteras', 'luxury', 'spa']) {
      const { textos, enlaces } = claves(id);
      expect(new Set(textos).size).toBe(textos.length);
      expect(new Set(enlaces).size).toBe(enlaces.length);
    }
  });
});
