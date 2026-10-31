import fs from 'fs';
import path from 'path';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { FarmaciaFooter, FarmaciaHeader, farmaciaTheme } from '@/templates/farmacia/FarmaciaParts';
import { useEditorEnVivo } from '@/templates/mostrador/MostradorEditorEnVivo';
import { getLiveEditorConfig } from '@/components/tienda/liveEditorFields';
import { deriveAtributoFacets } from '@/lib/catalogFacets';
import { useAuthStore } from '@/zustand/auth';

// El drawer real pide categorías a la API: aquí basta saber que se monta y con qué.
jest.mock('@/components/tienda/StoreLiveEditorDrawer', () => ({
  __esModule: true,
  default: ({ diseno, onChange, defaultOpen }: any) => (
    <div data-testid="editor" data-open={String(!!defaultOpen)}>
      <span data-testid="logo">{diseno?.mostradorLogoText || ''}</span>
      <button type="button" onClick={() => onChange({ mostradorLogoText: 'Nuevo nombre' })}>cambiar</button>
    </div>
  ),
}));

const Ubicacion = () => {
  const l = useLocation();
  return <p data-testid="loc">{l.pathname + l.search}</p>;
};

const t = farmaciaTheme({});
const headerProps = (slug: string, diseno: any = {}) => ({
  tienda: { nombre: 'Botica' }, slug, diseno, categories: ['Vitaminas', 'Dermo', 'Bebés', 'Otros'], t,
  cartCount: 0, favCount: 0, onOpenCart: () => {}, onOpenFav: () => {}, onSearch: () => {},
});

const enRuta = (ui: React.ReactNode, entrada = '/tienda/bot') => render(
  <MemoryRouter initialEntries={[entrada]}>
    <Routes><Route path="*" element={<>{ui}<Ubicacion /></>} /></Routes>
  </MemoryRouter>,
);

describe('farmacia: menú', () => {
  it('textos de Inicio y Catálogo salen del editor', () => {
    enRuta(<FarmaciaHeader {...headerProps('bot', { farmaciaNavHome: 'Portada', farmaciaNavShop: 'Productos' })} />);
    expect(screen.getByText('Portada')).toBeTruthy();
    expect(screen.getByText('Productos')).toBeTruthy();
  });
  it('categoría del menú filtra y navega sin recargar', () => {
    enRuta(<FarmaciaHeader {...headerProps('bot')} />);
    fireEvent.click(screen.getByText('Vitaminas'));
    expect(screen.getByTestId('loc').textContent).toBe('/tienda/bot/catalogo?category=Vitaminas');
  });
  it('solo las 3 primeras categorías van en la barra', () => {
    enRuta(<FarmaciaHeader {...headerProps('bot')} />);
    expect(screen.queryByText('Otros')).toBeNull();
  });
  it('conserva la vista previa de plantilla', () => {
    enRuta(<FarmaciaHeader {...headerProps('bot', { __previewQuery: 'previewPlantilla=farmacia&previewOrigen=template' })} />);
    fireEvent.click(screen.getByText('Contacto'));
    expect(screen.getByTestId('loc').textContent).toBe('/tienda/bot/contacto?previewPlantilla=farmacia&previewOrigen=template');
  });
  it('en el editor (slug preview) avisa con preview-nav', () => {
    const vistos: string[] = [];
    const on = (e: Event) => vistos.push((e as CustomEvent).detail);
    window.addEventListener('preview-nav', on);
    enRuta(<FarmaciaHeader {...headerProps('preview')} />, '/tienda/preview');
    fireEvent.click(screen.getByText('Catálogo'));
    window.removeEventListener('preview-nav', on);
    expect(vistos).toEqual(['catalogo']);
    expect(screen.getByTestId('loc').textContent).toBe('/tienda/preview');
  });
  it('el pie navega sin recargar', () => {
    enRuta(<FarmaciaFooter tienda={{}} slug="bot" diseno={{}} t={t} categories={['Dermo']} />);
    fireEvent.click(screen.getByText('Dermo'));
    expect(screen.getByTestId('loc').textContent).toBe('/tienda/bot/catalogo?category=Dermo');
  });
});

/** Las claves del panel deben existir en la plantilla y viceversa (las de texto). */
const fuente = (dir: string) => fs.readdirSync(path.join(__dirname, '..', dir))
  .filter((f) => f.endsWith('.tsx')).map((f) => fs.readFileSync(path.join(__dirname, '..', dir, f), 'utf8')).join('\n');

describe('panel = plantilla', () => {
  it.each(['farmacia', 'salud'])('%s expone Inicio, Catálogo y el botón de confirmar', (id) => {
    const keys = getLiveEditorConfig(id).textFields.map((f) => f.key);
    expect(keys).toEqual(expect.arrayContaining(['farmaciaNavHome', 'farmaciaNavShop', 'farmaciaNavContact', 'farmaciaCheckoutConfirmLabel']));
  });
  it.each([['farmacia', 'farmacia'], ['mostrador', 'mostrador']])('cada texto del panel de %s se usa en la plantilla', (id, dir) => {
    const src = fuente(dir);
    const sinUso = getLiveEditorConfig(id).textFields.map((f) => f.key).filter((k) => !src.includes(k));
    expect(sinUso).toEqual([]);
  });
});

describe('mostrador: editor en vivo en el catálogo', () => {
  const Prueba = ({ slug }: { slug: string }) => {
    const { diseno, editor } = useEditorEnVivo(slug, { plantillaId: 'mostrador', mostradorLogoText: 'Bodega' });
    return <><h1>{diseno.mostradorLogoText}</h1>{editor}</>;
  };
  afterEach(() => act(() => { useAuthStore.setState({ auth: null } as any); }));

  it('un visitante no ve el editor', () => {
    useAuthStore.setState({ auth: { empresa: { slugTienda: 'otra' } } } as any);
    enRuta(<Prueba slug="bodega" />, '/tienda/bodega/catalogo');
    expect(screen.queryByTestId('editor')).toBeNull();
  });
  it('el dueño lo ve, ?edit=1 lo abre y los cambios se ven al instante', async () => {
    useAuthStore.setState({ auth: { empresa: { slugTienda: 'bodega' } } } as any);
    enRuta(<Prueba slug="bodega" />, '/tienda/bodega/catalogo?edit=1');
    const editor = await screen.findByTestId('editor');
    expect(editor.getAttribute('data-open')).toBe('true');
    expect(screen.getByRole('heading').textContent).toBe('Bodega');
    fireEvent.click(screen.getByText('cambiar'));
    expect(screen.getByRole('heading').textContent).toBe('Nuevo nombre');
  });
  it('sin ?edit=1 queda cerrado', async () => {
    useAuthStore.setState({ auth: { empresa: { slugTienda: 'bodega' } } } as any);
    enRuta(<Prueba slug="bodega" />, '/tienda/bodega/catalogo');
    expect((await screen.findByTestId('editor')).getAttribute('data-open')).toBe('false');
  });
});

describe('facetas del catálogo con categorías adicionales', () => {
  const productos = [
    { id: 1, categoria: { nombre: 'Laptops' }, atributosTecnicos: { memoriaRam: '8GB' } },
    { id: 2, categoria: { nombre: 'Gamer' }, categoriasExtra: [{ id: 9, nombre: 'Laptops' }], atributosTecnicos: { memoriaRam: '16GB' } },
    { id: 3, categoria: { nombre: 'Monitores' }, atributosTecnicos: { memoriaRam: '32GB' } },
  ];
  it('un producto con la categoría como adicional entra en las facetas', () => {
    const ram = deriveAtributoFacets(productos, ['laptops']).find((f) => f.key === 'memoriaRam');
    expect(ram?.options.map((o) => o.value).sort()).toEqual(['16GB', '8GB']);
  });
  it('sin filtro usa todos', () => {
    const ram = deriveAtributoFacets(productos, []).find((f) => f.key === 'memoriaRam');
    expect(ram?.options).toHaveLength(3);
  });
});
