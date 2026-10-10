/**
 * D2 — QA de render del carrito.
 *
 * Lo que se comprueba aquí no es el cálculo (eso está en
 * utils/__tests__/reglasDescuento.test.ts) sino lo que el cliente VE y el
 * enlace al que lo manda el botón.
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import ShoppingCartModal from '../ShoppingCartModal';

/** Lo que de verdad devuelve GET /api/public/store/hierba-sana-qa. */
const TIENDA = {
  whatsappTienda: '51925085731',
  reglasDescuento: {
    precioUnitarioMinimo: 20,
    envioCuentaEnTotal: true,
    tramos: [
      { descuento: 10, unidades: 3, totalMayorQue: 90 },
      { descuento: 20, unidades: 5, totalMayorQue: 170 },
      { descuento: 30, unidades: 7, totalMayorQue: 250 },
    ],
  },
};

const producto = (id: number, nombre: string, precio: number, cantidad = 1) => ({
  id,
  nombre,
  precioUnitario: precio,
  cantidad,
  imagenes: [],
});

function montar(carrito: unknown[], tienda: unknown = TIENDA) {
  return render(
    <MemoryRouter>
      <ShoppingCartModal
        isOpen
        carrito={carrito as never[]}
        tienda={tienda as never}
        onClose={() => {}}
        onCheckout={() => {}}
        actualizarCantidad={() => {}}
        slug="hierba-sana-qa"
      />
    </MemoryRouter>,
  );
}

const enlaceWsp = () =>
  (screen.queryAllByRole('link').find((a) =>
    (a as HTMLAnchorElement).href.includes('wa.me'),
  ) as HTMLAnchorElement | undefined);

describe('el descuento que ve el cliente', () => {
  it('no muestra línea de descuento cuando no corresponde', () => {
    montar([producto(1, 'Moringa', 31, 2)]);
    expect(screen.queryByText(/descuento por pack/i)).toBeNull();
  });

  it('muestra el descuento cuando el carrito ya lo alcanza', () => {
    montar([producto(1, 'Moringa', 31, 2), producto(2, 'Berberina', 60)]);
    expect(screen.getByText(/descuento por pack/i)).toBeInTheDocument();
    expect(screen.getByText('−S/ 10.00')).toBeInTheDocument();
  });

  it('empuja al siguiente tramo solo cuando el monto ya alcanza', () => {
    montar([producto(1, 'Moringa', 46, 4)]);
    expect(screen.getByText(/1 producto más llegas al/i)).toBeInTheDocument();
  });

  it('NO empuja cuando además le falta monto', () => {
    const { container } = montar([producto(1, 'Moringa', 25, 4)]);
    expect(container.textContent).not.toMatch(/llegas al/i);
  });
});

describe('el paso al chat', () => {
  it('el botón apunta al número de la tienda', () => {
    montar([producto(1, 'Moringa', 31, 2)]);
    expect(enlaceWsp()?.href).toContain('wa.me/51925085731');
  });

  it('el mensaje lleva el prefijo que la IA reconoce y los productos', () => {
    montar([producto(1, 'Moringa 100 cápsulas', 31, 2), producto(2, 'Berberina', 60)]);
    const texto = decodeURIComponent(enlaceWsp()!.href.split('text=')[1]);
    expect(texto.startsWith('PEDIDO WEB')).toBe(true);
    expect(texto).toContain('2x Moringa 100 cápsulas');
    expect(texto).toContain('1x Berberina');
    expect(texto).toContain('Descuento por pack: S/ 10.00');
  });

  it('sin número configurado no se muestra el botón: mejor nada que un enlace roto', () => {
    montar([producto(1, 'Moringa', 31, 2)], {
      ...TIENDA,
      whatsappTienda: null,
    });
    expect(enlaceWsp()).toBeUndefined();
  });
});

describe('una tienda que no usa la IA de ventas', () => {
  it('el carrito funciona igual, sin descuentos ni botón', () => {
    const { container } = montar([producto(1, 'Moringa', 31, 9)], {});
    expect(container.textContent).toContain('S/ 279.00');
    expect(screen.queryByText(/descuento por pack/i)).toBeNull();
    expect(enlaceWsp()).toBeUndefined();
  });
});
