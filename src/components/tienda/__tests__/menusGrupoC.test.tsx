/**
 * Menús configurables y navegación sin recarga de las plantillas tones,
 * ropa-hombre, urbano, autopartes, moda, maye, apicultura y antojo.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { TnHeader, TnFooter } from '@/templates/tones/TonesParts';
import { UrbHeader, UrbFooter } from '@/templates/ropa-hombre/RopaHombreParts';
import UrbanoHeader from '@/templates/urbano/UrbanoHeader';
import AutopartesHeader from '@/components/tienda/AutopartesHeader';
import AutopartesFooter from '@/components/tienda/AutopartesFooter';
import ModaHeader from '@/components/tienda/ModaHeader';
import ModaFooter from '@/components/tienda/ModaFooter';
import MayeHeader from '@/components/tienda/MayeHeader';
import { AntojoFooter, AntojoHeader } from '@/templates/antojo/AntojoParts';
import { irAAccionConfigurada } from '@/templates/shared/accionConfigurada';
import { getLiveEditorConfig } from '@/components/tienda/liveEditorFields';

jest.mock('@iconify/react', () => ({ Icon: () => null }));

// Los pies con `whileInView` (framer-motion) lo necesitan y jsdom no lo trae.
beforeAll(() => {
  (globalThis as any).IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} };
});

function Donde() {
  const l = useLocation();
  return <p data-testid="ruta">{l.pathname + l.search}</p>;
}

const montar = (ui: React.ReactNode) => render(
  <MemoryRouter initialEntries={['/tienda/s']}>
    <Routes><Route path="*" element={<>{ui}<Donde /></>} /></Routes>
  </MemoryRouter>,
);
const ruta = () => screen.getByTestId('ruta').textContent;
const hrefs = (container: HTMLElement) => Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));

const noop = () => {};

// ─── tones ───────────────────────────────────────────────────────────────────
describe('tones', () => {
  const header = (diseno: any, cats: any[] = []) => (
    <TnHeader tienda={{}} slug="s" cp="#000" diseno={diseno} carritoSize={0} onOpenCart={noop} allCategories={cats} />
  );
  it('"Novedades" sin configurar va a sort=new y navega sin recargar', () => {
    montar(header({}));
    const link = screen.getAllByText('Novedades')[0];
    expect(link.getAttribute('href')).toBe('/tienda/s/catalogo?sort=new');
    fireEvent.click(link);
    expect(ruta()).toBe('/tienda/s/catalogo?sort=new');
  });
  it('texto y destino configurables; "Sin enlace" lo oculta', () => {
    const { unmount } = montar(header({ tonesMenu1Text: 'Bebés', tonesMenu1ActionType: 'category', tonesMenu1ActionValue: 'Bebé' }));
    expect(screen.getAllByText('Bebés')[0].getAttribute('href')).toBe('/tienda/s/catalogo?category=Beb%C3%A9');
    unmount();
    montar(header({ tonesMenu1ActionType: 'none' }));
    expect(screen.queryByText('Novedades')).toBeNull();
  });
  it('el pie no recarga la página', () => {
    montar(<TnFooter tienda={{}} slug="s" cp="#000" categories={['Bodys']} />);
    fireEvent.click(screen.getByText('Bodys'));
    expect(ruta()).toBe('/tienda/s/catalogo?category=Bodys');
  });
});

// ─── ropa-hombre ─────────────────────────────────────────────────────────────
describe('ropa-hombre', () => {
  const t = { primary: '#000', onPrimary: '#fff', ink: '#000', bg: '#fff', line: '#eee', muted: '#999', accent: '#c00' };
  it('"Novedades" del header y del pie usan el mismo destino configurable', () => {
    const navigate = jest.fn();
    const diseno = { ropaHombreNavNew: 'Recién llegados', ropaHombreNavNewActionType: 'search', ropaHombreNavNewActionValue: 'lino' };
    const { container } = render(<MemoryRouter><UrbHeader tienda={{}} slug="s" diseno={diseno} categories={[]} t={t} cartCount={0} favCount={0} navigate={navigate} /><UrbFooter tienda={{}} slug="s" diseno={diseno} t={t} categories={[]} navigate={navigate} /></MemoryRouter>);
    const botones = within(container).getAllByText('Recién llegados');
    expect(botones).toHaveLength(2);
    botones.forEach((b) => fireEvent.click(b));
    expect(navigate.mock.calls.map((c) => c[0])).toEqual(['/tienda/s/catalogo?search=lino', '/tienda/s/catalogo?search=lino']);
  });
  it('sin configurar: novedades (sort=new)', () => {
    const navigate = jest.fn();
    render(<MemoryRouter><UrbHeader tienda={{}} slug="s" diseno={{}} categories={[]} t={t} cartCount={0} favCount={0} navigate={navigate} /></MemoryRouter>);
    fireEvent.click(screen.getByText('Novedades'));
    expect(navigate).toHaveBeenCalledWith('/tienda/s/catalogo?sort=new');
  });
});

// ─── urbano ──────────────────────────────────────────────────────────────────
describe('urbano', () => {
  const header = (diseno: any, categories: any[] = []) => (
    <UrbanoHeader tienda={{}} slug="s" cp="#000" carritoSize={0} onOpenCart={noop} diseno={diseno} categories={categories} />
  );
  it('"Colecciones" va a la categoría parecida o al destino elegido', () => {
    const { unmount } = montar(header({}, ['Colección']));
    fireEvent.click(screen.getAllByText('Colecciones')[0]);
    expect(ruta()).toBe('/tienda/s/catalogo?category=Colecci%C3%B3n');
    unmount();
    montar(header({ urbanoMenu1Text: 'Drops', urbanoMenu1ActionType: 'search', urbanoMenu1ActionValue: 'drop' }));
    fireEvent.click(screen.getAllByText('Drops')[0]);
    expect(ruta()).toBe('/tienda/s/catalogo?search=drop');
  });
});

// ─── autopartes ──────────────────────────────────────────────────────────────
describe('autopartes', () => {
  const header = (diseno: any, cats: any[] = []) => (
    <AutopartesHeader tienda={{ diseno }} slug="s" cp="#c00" carritoSize={0} onOpenCart={noop} searchQuery="" setSearchQuery={noop} onSearchSubmit={noop} allCategories={cats} />
  );
  it('el desplegable "Categorías" filtra con ?category= (antes ?q=, ignorado)', () => {
    montar(header({}, [{ nombre: 'Frenos' }]));
    fireEvent.click(screen.getByText('Categorías'));
    fireEvent.click(screen.getByText('Frenos'));
    expect(ruta()).toBe('/tienda/s/catalogo?category=Frenos');
  });
  it('acceso rápido: categoría parecida; si no, busca su término', () => {
    const { unmount } = montar(header({}, [{ nombre: 'BATERIAS' }]));
    fireEvent.click(screen.getAllByText('Baterías')[0]);
    expect(ruta()).toBe('/tienda/s/catalogo?category=BATERIAS');
    unmount();
    montar(header({}, [{ nombre: 'Frenos' }]));
    fireEvent.click(screen.getAllByText('Tienda de Llantas')[0]);
    expect(ruta()).toBe('/tienda/s/catalogo?search=Llanta');
  });
  it('acceso rápido configurable y ocultable', () => {
    montar(header({ autopartesMenu1Text: 'Aros', autopartesMenu1ActionType: 'category', autopartesMenu1ActionValue: 'Aros', autopartesMenu2ActionType: 'none' }));
    expect(screen.queryByText('Fluidos y Lubricantes')).toBeNull();
    fireEvent.click(screen.getAllByText('Aros')[0]);
    expect(ruta()).toBe('/tienda/s/catalogo?category=Aros');
  });
  it('el pie ya no tiene enlaces muertos (#)', () => {
    const { container } = montar(<AutopartesFooter tienda={{ facebookUrl: 'https://fb.com/x' }} slug="s" diseno={{}} />);
    expect(hrefs(container).filter((h) => !h || h === '#')).toEqual([]);
    fireEvent.click(screen.getByText('Rastrear Tu Pedido'));
    expect(ruta()).toBe('/tienda/s/seguimiento');
  });
});

// ─── moda ────────────────────────────────────────────────────────────────────
describe('moda', () => {
  const header = (diseno: any, cats: any[] = []) => (
    <ModaHeader tienda={{}} slug="s" cp="#000" carritoSize={0} onOpenCart={noop} searchQuery="" setSearchQuery={noop} onSearchSubmit={noop} allCategories={cats} diseno={diseno} />
  );
  it('"Nuevos ingresos" → novedades; "Mujer" → categoría parecida; "Ofertas" → búsqueda', () => {
    montar(header({}, ['MUJER']));
    fireEvent.click(screen.getAllByText('Nuevos ingresos')[0]);
    expect(ruta()).toBe('/tienda/s/catalogo?sort=new');
    fireEvent.click(screen.getAllByText('Mujer')[0]);
    expect(ruta()).toBe('/tienda/s/catalogo?category=MUJER');
    fireEvent.click(screen.getAllByText('Ofertas')[0]);
    expect(ruta()).toBe('/tienda/s/catalogo?search=Ofertas');
  });
  it('"Sin enlace" oculta el botón', () => {
    montar(header({ modaMenu6ActionType: 'none' }));
    expect(screen.queryByText('Estilo')).toBeNull();
  });
  it('el pie ya no tiene enlaces muertos ni datos inventados', () => {
    const { container } = montar(<ModaFooter tiendaNombre="X" slug="s" tienda={{}} />);
    expect(hrefs(container).filter((h) => !h || h === '#')).toEqual([]);
    expect(container.textContent).not.toContain('+51 999 999 999');
    fireEvent.click(screen.getByText('Rastrea tu pedido'));
    expect(ruta()).toBe('/tienda/s/seguimiento');
  });
});

// ─── maye ────────────────────────────────────────────────────────────────────
describe('maye', () => {
  it('los accesos rápidos elegidos van primero aunque la tienda tenga categorías', () => {
    const { container } = montar(
      <MayeHeader tienda={{}} slug="s" cp="#000" carritoSize={0} onOpenCart={noop} searchQuery="" setSearchQuery={noop} onSearchSubmit={noop}
        allCategories={['Monitores', 'Laptops', 'Mouse']} diseno={{ mayeQuickLink1: 'Mouse' }} />,
    );
    const textos = Array.from(container.querySelectorAll('button')).map((b) => b.textContent?.trim());
    const i = textos.indexOf('Mouse');
    expect(textos.slice(i, i + 3)).toEqual(['Mouse', 'Monitores', 'Laptops']);
  });
});

// ─── antojo ──────────────────────────────────────────────────────────────────
describe('antojo', () => {
  it('header y pie navegan sin recargar', () => {
    montar(<><AntojoHeader tienda={{}} slug="s" cp="#c00" carritoSize={0} onOpenCart={noop} allCategories={['Pizzas']} /><AntojoFooter tienda={{}} slug="s" cp="#c00" /></>);
    fireEvent.click(screen.getAllByText('Carta')[0]);
    expect(ruta()).toBe('/tienda/s/catalogo');
    fireEvent.click(screen.getAllByText('Pizzas')[0]);
    expect(ruta()).toBe('/tienda/s/catalogo?category=Pizzas');
  });
  it('el panel ya expone su configuración', () => {
    const cfg = getLiveEditorConfig('antojo');
    expect(cfg.textFields.map((f) => f.key)).toContain('antojoHeroTitle');
    expect(cfg.linkFields.map((f) => f.key)).toEqual(['antojoHeroAction', 'antojoPromoHotAction', 'antojoPromoColdAction']);
    expect(cfg.productFields).toHaveLength(2);
  });
});

// ─── enlaces de bloques (apicultura / antojo) ────────────────────────────────
describe('irAAccionConfigurada', () => {
  it('lee las claves planas que guarda el panel', () => {
    const nav = jest.fn();
    irAAccionConfigurada({ apiculturaHeroActionType: 'category', apiculturaHeroActionValue: 'Miel' }, 'apiculturaHeroAction', 's', nav);
    expect(nav).toHaveBeenCalledWith('/tienda/s/catalogo?category=Miel');
  });
  it('respeta el formato viejo (objeto) y el fallback', () => {
    const nav = jest.fn();
    irAAccionConfigurada({ antojoPromoHotAction: { type: 'search', search: 'calzone' } }, 'antojoPromoHotAction', 's', nav);
    irAAccionConfigurada({}, 'antojoPromoHotAction', 's', nav, '/tienda/s/catalogo?search=pizza');
    expect(nav.mock.calls.map((c) => c[0])).toEqual(['/tienda/s/catalogo?search=calzone', '/tienda/s/catalogo?search=pizza']);
  });
  it('"Sin enlace" no navega y la URL externa abre otra pestaña', () => {
    const nav = jest.fn();
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);
    irAAccionConfigurada({ kType: 'none' }, 'k', 's', nav);
    irAAccionConfigurada({ kType: 'url', kUrl: 'https://wa.me/51' }, 'k', 's', nav);
    expect(nav).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledWith('https://wa.me/51', '_blank', 'noopener,noreferrer');
    open.mockRestore();
  });
});

// ─── panel = plantilla ───────────────────────────────────────────────────────
describe('panel', () => {
  it('cada plantilla expone los destinos de su menú', () => {
    const links = (id: string) => getLiveEditorConfig(id).linkFields.map((f) => f.key);
    expect(links('tones')).toEqual(expect.arrayContaining(['tonesMenu1Action', 'tonesFeatureAction', 'tonesBannerAction']));
    expect(links('ropa-hombre')).toContain('ropaHombreNavNewAction');
    expect(links('urbano')).toEqual(['urbanoMenu1Action']);
    expect(links('autopartes')).toHaveLength(7);
    expect(links('moda')).toHaveLength(8);
    const textos = (id: string) => getLiveEditorConfig(id).textFields.map((f) => f.key);
    expect(textos('urbano')).toContain('urbanoFeatureTitle');
    expect(textos('urbano')).not.toContain('urbanoFeatureLabel');
    expect(textos('apicultura')).not.toContain('apiculturaNewsletterTitle');
  });
});
