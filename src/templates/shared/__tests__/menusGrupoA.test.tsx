import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { MotoFooter, MotoHeader } from '@/templates/motos/MotosParts';
import { MinHeader } from '@/templates/moda-minimal/ModaMinimalParts';
import { GroHeader } from '@/templates/abarrotes/GroginParts';
import { FmHeader } from '@/templates/supermercado/FreshMartParts';
import { FoodShell } from '@/templates/comida-app/CrispyParts';
import { VeloHeader } from '@/templates/bicicletas/BicicletasParts';
import { hrefDeBloque, pistaDeBoton } from '@/templates/shared/enlacesTienda';
import { LIVE_EDITOR_FIELDS } from '@/components/tienda/liveEditorFields';

// framer-motion (whileInView del footer) necesita IntersectionObserver; jsdom no lo trae.
beforeAll(() => {
  (globalThis as any).IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
});

const CATS = [{ nombre: 'REPUESTOS' }, { nombre: 'Cascos' }, { nombre: 'Calzado' }, { nombre: 'Ofertas' }];

function Donde() {
  const l = useLocation();
  return <p data-testid="ruta">{l.pathname + l.search}</p>;
}

const montar = (ui: React.ReactElement) => render(
  <MemoryRouter initialEntries={['/tienda/bbs']}>
    <Routes><Route path="*" element={<>{ui}<Donde /></>} /></Routes>
  </MemoryRouter>,
);

const hrefDe = (texto: string) => screen.getAllByText(texto)[0].closest('a')?.getAttribute('href');

describe('motos · menú del header', () => {
  const header = (diseno: any = {}, allCategories: any[] = CATS) => montar(
    <MotoHeader tienda={{}} slug="bbs" cp="" diseno={diseno} carritoSize={0} onOpenCart={() => {}} allCategories={allCategories} />,
  );

  it('sin configurar: Repuestos filtra por la categoría parecida, Tuning va al catálogo, Servicio/Envíos a contacto', () => {
    header();
    expect(hrefDe('Repuestos')).toBe('/tienda/bbs/catalogo?category=REPUESTOS');
    expect(hrefDe('Tuning')).toBe('/tienda/bbs/catalogo');
    expect(hrefDe('Servicio')).toBe('/tienda/bbs/contacto');
    expect(hrefDe('Envíos y garantía')).toBe('/tienda/bbs/contacto');
  });

  it('"Sin enlace" oculta el botón', () => {
    header({ motosMenu2ActionType: 'none' });
    expect(screen.queryByText('Tuning')).toBeNull();
    expect(screen.getAllByText('Repuestos').length).toBeGreaterThan(0);
  });

  it('respeta texto y categoría elegidos en el editor', () => {
    header({ motosMenu4Text: 'Cascos y más', motosMenu4ActionType: 'category', motosMenu4ActionValue: 'Cascos' });
    expect(hrefDe('Cascos y más')).toBe('/tienda/bbs/catalogo?category=Cascos');
  });

  it('URL externa abre otra pestaña', () => {
    header({ motosMenu5ActionType: 'url', motosMenu5ActionUrl: 'https://wa.me/51999' });
    const a = screen.getByText('Envíos y garantía').closest('a')!;
    expect(a.getAttribute('target')).toBe('_blank');
  });

  it('el clic cambia de página sin recargar', () => {
    header();
    fireEvent.click(screen.getByText('Repuestos'));
    expect(screen.getByTestId('ruta').textContent).toBe('/tienda/bbs/catalogo?category=REPUESTOS');
  });

  it('pie de página: "Repuestos y accesorios" configurable', () => {
    montar(<MotoFooter tienda={{}} slug="bbs" cp="" categories={CATS} diseno={{ motosFooterMenu1ActionType: 'search', motosFooterMenu1ActionValue: 'filtro' }} />);
    expect(hrefDe('Repuestos y accesorios')).toBe('/tienda/bbs/catalogo?search=filtro');
    fireEvent.click(screen.getByText('Agenda tu service'));
    expect(screen.getByTestId('ruta').textContent).toBe('/tienda/bbs/contacto');
  });
});

describe('moda-minimal · menú', () => {
  const header = (diseno: any = {}) => montar(
    <MinHeader tienda={{}} slug="bbs" cp="" diseno={diseno} carritoSize={0} onOpenCart={() => {}} allCategories={CATS} />,
  );
  it('Novedades → lo más nuevo; Calzado → su categoría; Nosotros → contacto', () => {
    header({ modaMinimalNav5: 'Nosotros' });
    const nav = screen.getAllByRole('navigation')[0];
    fireEvent.click(within(nav).getByText('Novedades'));
    expect(screen.getByTestId('ruta').textContent).toBe('/tienda/bbs/catalogo?sort=new');
    fireEvent.click(within(nav).getByText('Calzado'));
    expect(screen.getByTestId('ruta').textContent).toBe('/tienda/bbs/catalogo?category=Calzado');
    fireEvent.click(within(nav).getByText('Nosotros'));
    expect(screen.getByTestId('ruta').textContent).toBe('/tienda/bbs/contacto');
  });
  it('conserva el texto que el dueño ya había escrito y oculta los "Sin enlace"', () => {
    header({ modaMinimalNav2: 'Mujer', modaMinimalNav4ActionType: 'none' });
    const nav = screen.getAllByRole('navigation')[0];
    expect(within(nav).getByText('Mujer')).toBeTruthy();
    expect(within(nav).queryByText('Colección')).toBeNull();
  });
});

describe('abarrotes y supermercado · Ofertas', () => {
  it('Grogin: Ofertas filtra por la categoría Ofertas y se puede ocultar', () => {
    const { unmount } = montar(<GroHeader tienda={{}} slug="bbs" cp="" diseno={{}} carritoSize={0} onOpenCart={() => {}} allCategories={[{ nombre: 'Lácteos' }, { nombre: 'Ofertas' }]} />);
    expect(screen.getAllByText('Ofertas').map((n) => n.closest('a')?.getAttribute('href'))).toContain('/tienda/bbs/catalogo?category=Ofertas');
    unmount();
    montar(<GroHeader tienda={{}} slug="bbs" cp="" diseno={{ abarrotesMenu1ActionType: 'none' }} carritoSize={0} onOpenCart={() => {}} allCategories={[{ nombre: 'Lácteos' }]} />);
    expect(screen.queryByText('Ofertas')).toBeNull();
  });
  it('FreshMart: "Ofertas flash" sin categoría parecida va al catálogo', () => {
    montar(<FmHeader tienda={{}} slug="bbs" cp="" diseno={{}} carritoSize={0} onOpenCart={() => {}} allCategories={[{ nombre: 'Frutas' }]} />);
    expect(screen.getByText(/Ofertas flash/).closest('a')?.getAttribute('href')).toBe('/tienda/bbs/catalogo');
  });
  it('FreshMart: redes sin enlace no se muestran (antes "#")', () => {
    const { container } = montar(<FmHeader tienda={{}} slug="bbs" cp="" diseno={{}} carritoSize={0} onOpenCart={() => {}} allCategories={CATS} />);
    expect(container.querySelector('a[href="#"]')).toBeNull();
  });
});

describe('comida-app · Ofertas (header web y barra inferior)', () => {
  it('ambos usan el mismo destino configurado', () => {
    montar(<FoodShell slug="bbs" active="home" cp="" diseno={{ comidaAppMenu1ActionType: 'category', comidaAppMenu1ActionValue: 'Combos', comidaAppMenu1Text: 'Promos' }} tienda={{}} carrito={[]} categories={CATS}><div /></FoodShell>);
    const botones = screen.getAllByText('Promos');
    expect(botones).toHaveLength(2);
    fireEvent.click(botones[1]);
    expect(screen.getByTestId('ruta').textContent).toBe('/tienda/bbs/catalogo?category=Combos');
  });
  it('"Sin enlace" lo quita de ambos', () => {
    montar(<FoodShell slug="bbs" active="home" cp="" diseno={{ comidaAppMenu1ActionType: 'none' }} tienda={{}} carrito={[]} categories={[{ nombre: 'Combos' }]}><div /></FoodShell>);
    expect(screen.queryByText('Ofertas')).toBeNull();
  });
});

describe('bicicletas · navegación sin recarga', () => {
  it('Contacto del header navega dentro de la app', () => {
    montar(<VeloHeader tienda={{}} slug="bbs" cp="" diseno={{}} carritoSize={0} onOpenCart={() => {}} allCategories={CATS} />);
    fireEvent.click(screen.getAllByText('Contacto')[0]);
    expect(screen.getByTestId('ruta').textContent).toBe('/tienda/bbs/contacto');
  });
});

describe('hrefDeBloque (CTAs del home)', () => {
  it('automático: categoría parecida, si no la ruta por defecto', () => {
    expect(hrefDeBloque({}, 'motosGearAction', { slug: 's', categorias: [{ nombre: 'EQUIPAMIENTO' }], pistas: ['Equipamiento'] })).toBe('/tienda/s/catalogo?category=EQUIPAMIENTO');
    expect(hrefDeBloque({}, 'motosPreorderAction', { slug: 's', categorias: [], pistas: ['Preventa'], rutaPorDefecto: '/catalogo?sort=new' })).toBe('/tienda/s/catalogo?sort=new');
  });
  it('elegido en el editor gana; "Sin enlace" = null', () => {
    expect(hrefDeBloque({ abarrotesPromoOneActionType: 'search', abarrotesPromoOneActionValue: 'arroz' }, 'abarrotesPromoOneAction', { slug: 's' })).toBe('/tienda/s/catalogo?search=arroz');
    expect(hrefDeBloque({ xActionType: 'none' }, 'xAction', { slug: 's', pistas: ['Ofertas'], categorias: CATS })).toBeNull();
  });
  it('pistaDeBoton quita el verbo del botón', () => {
    expect(pistaDeBoton('Comprar calzado')).toBe('calzado');
    expect(pistaDeBoton('Ver ofertas')).toBe('ofertas');
  });
});

describe('panel = plantilla', () => {
  const claves = (id: string) => {
    const c = (LIVE_EDITOR_FIELDS as any)[id];
    return { text: c.textFields.map((f: any) => f.key) as string[], link: c.linkFields.map((f: any) => f.key) as string[] };
  };
  it.each(['motos', 'moda-minimal', 'abarrotes', 'supermercado', 'comida-app', 'bicicletas'])('%s: sin claves repetidas', (id) => {
    const { text, link } = claves(id);
    expect(new Set(text).size).toBe(text.length);
    expect(new Set(link).size).toBe(link.length);
  });
  it('motos expone el menú y ya no los títulos que la plantilla no muestra', () => {
    const { text, link } = claves('motos');
    expect(link).toEqual(expect.arrayContaining(['motosMenu1Action', 'motosMenu5Action', 'motosFooterMenu1Action', 'motosGearAction', 'motosSaleAction', 'motosPreorderAction', 'motosServiceCard4Action']));
    expect(text).toEqual(expect.arrayContaining(['motosMenu1Text', 'motosFooterMenu1Text']));
    ['motosBrandsTitle', 'motosCategoriesTitle', 'motosLogoTagline', 'motosServicesEyebrow', 'motosServicesTitle'].forEach((k) => expect(text).not.toContain(k));
  });
  it('abarrotes, supermercado, comida-app y moda-minimal exponen sus enlaces nuevos', () => {
    expect(claves('abarrotes').link).toEqual(expect.arrayContaining(['abarrotesMenu1Action', 'abarrotesCardOneAction', 'abarrotesPromoOneAction']));
    expect(claves('supermercado').link).toEqual(expect.arrayContaining(['supermercadoMenu1Action', 'supermercadoSaverAction', 'supermercadoDeliveryAction', 'supermercadoHeroButton2Action']));
    expect(claves('comida-app').link).toEqual(expect.arrayContaining(['comidaAppMenu1Action', 'comidaAppPromoAction']));
    expect(claves('moda-minimal').link).toEqual(expect.arrayContaining(['modaMinimalNav1Action', 'modaMinimalHeroButton2Action', 'modaMinimalEditorialAction']));
    expect(claves('moda-minimal').text).toEqual(expect.arrayContaining(['modaMinimalNav1', 'modaMinimalNav5']));
  });
});
