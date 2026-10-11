/**
 * Disponibilidad y prioridad de venta en el editor de producto.
 *
 * El riesgo real acá no es el render: es que el campo se vea, el usuario lo
 * cambie, el modal diga "guardado" y el valor no haya llegado al backend. En
 * este repo ese bug ya pasó con el SKU y con los precios mayoristas, así que
 * el caso que más importa es el último de este archivo.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const postMock = jest.fn();
const alertMock = jest.fn();

jest.mock('@/utils/apiClient', () => ({
  __esModule: true,
  default: { post: (u: string, b: unknown) => postMock(u, b) },
}));
jest.mock('@/zustand/alert', () => ({
  __esModule: true,
  default: () => ({ alert: alertMock }),
  useAlertStore: () => ({ alert: alertMock }),
}));
jest.mock('@iconify/react', () => ({ Icon: () => null }));

import { ProductDisponibilidadIa } from '../ProductDisponibilidadIa';

const vmFalso = (over: Record<string, unknown> = {}) => {
  const cambios: { name: string; value: string }[] = [];
  return {
    cambios,
    vm: {
      formValues: { productoId: 12, disponibilidad: 'INMEDIATA', prioridadVenta: 0, ...over },
      handleChange: (e: { target: { name: string; value: string } }) =>
        cambios.push({ ...e.target }),
      isEdit: true,
    } as never,
  };
};

beforeEach(() => {
  postMock.mockReset();
  alertMock.mockReset();
});

describe('los tres estados de disponibilidad', () => {
  it('muestra los CUATRO que pidió el negocio', () => {
    const { vm } = vmFalso({ disponibilidad: 'BAJO_PEDIDO' });
    render(<ProductDisponibilidadIa vm={vm} />);
    for (const e of ['INMEDIATA', 'BAJO_PEDIDO', 'NO_DISPONIBLE', 'NO_COMERCIAL']) {
      expect(screen.getByTestId(`disp-${e}`)).toBeInTheDocument();
    }
    // Y explica qué hace la IA con el estado elegido.
    expect(screen.getByText(/sin prometer fecha/i)).toBeInTheDocument();
  });

  it('distingue agotado de descontinuado, que es la diferencia que importa', () => {
    // Agotado puede volver y se avisa; descontinuado no, y prometer un aviso
    // sería una promesa que nadie va a cumplir.
    const { vm } = vmFalso({ disponibilidad: 'NO_DISPONIBLE' });
    render(<ProductDisponibilidadIa vm={vm} />);
    expect(screen.getByTestId('disp-NO_DISPONIBLE')).toHaveTextContent('Agotado');
    expect(screen.getByTestId('disp-NO_COMERCIAL')).toHaveTextContent('Descontinuado');
    expect(screen.getByText(/puede volver. Se avisa a quien lo pidió/i)).toBeInTheDocument();
  });

  it('un producto sin valor guardado se asume disponible', () => {
    const { vm } = vmFalso({ disponibilidad: undefined });
    render(<ProductDisponibilidadIa vm={vm} />);
    expect(screen.getByText(/se entrega de inmediato/i)).toBeInTheDocument();
  });

  it('elegir uno lo manda al formulario con el nombre del campo del backend', () => {
    const { vm, cambios } = vmFalso();
    render(<ProductDisponibilidadIa vm={vm} />);
    fireEvent.click(screen.getByTestId('disp-NO_DISPONIBLE'));
    expect(cambios).toEqual([
      { name: 'disponibilidad', value: 'NO_DISPONIBLE' },
    ]);
  });

  it('la prioridad se elige entre los valores que el backend acepta', () => {
    // Antes era un campo libre de 0 a 100: se podía poner 80, y la API lo
    // rechaza (@Min(1) @Max(3)). El usuario se habría enterado al guardar.
    const { vm, cambios } = vmFalso();
    render(<ProductDisponibilidadIa vm={vm} />);
    expect(screen.queryByRole('spinbutton')).toBeNull();
    fireEvent.click(screen.getByTestId('prio-4'));
    expect(cambios).toEqual([{ name: 'prioridadVenta', value: '4' }]);
  });

  it('ofrece los cuatro niveles del negocio más "sin preferencia"', () => {
    const { vm } = vmFalso();
    render(<ProductDisponibilidadIa vm={vm} />);
    for (const v of [0, 1, 2, 3, 4]) {
      expect(screen.getByTestId(`prio-${v}`)).toBeInTheDocument();
    }
    expect(screen.queryByTestId('prio-5')).toBeNull();
  });
});

describe('avisar a la lista de espera (33.1)', () => {
  it('el botón solo aparece con el producto guardado y disponible', () => {
    const { vm } = vmFalso({ disponibilidad: 'NO_DISPONIBLE' });
    render(<ProductDisponibilidadIa vm={vm} />);
    expect(screen.queryByText(/avisar a quien lo pidió/i)).toBeNull();
  });

  it('ni en un producto nuevo, que todavía no tiene id', () => {
    const { vm } = vmFalso({ productoId: 0 });
    render(<ProductDisponibilidadIa vm={vm} />);
    expect(screen.queryByText(/avisar a quien lo pidió/i)).toBeNull();
  });

  it('avisa y dice a cuántos', async () => {
    postMock.mockResolvedValue({ data: { data: { avisados: 7 } } });
    const { vm } = vmFalso();
    render(<ProductDisponibilidadIa vm={vm} />);
    fireEvent.click(screen.getByText(/avisar a quien lo pidió/i));

    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith(
        '/leads/crm/disparadores/producto/12/volvio',
        {},
      ),
    );
    expect(alertMock).toHaveBeenCalledWith(
      expect.stringContaining('7 clientes'),
      'success',
    );
  });

  it('si el backend dice que no corresponde, se muestra su motivo', async () => {
    // El backend vuelve a mirar la disponibilidad: no se puede avisar de algo
    // que sigue agotado, por más que la pantalla diga otra cosa.
    postMock.mockResolvedValue({
      data: { data: { avisados: 0, motivo: 'el producto no está disponible' } },
    });
    const { vm } = vmFalso();
    render(<ProductDisponibilidadIa vm={vm} />);
    fireEvent.click(screen.getByText(/avisar a quien lo pidió/i));
    await waitFor(() =>
      expect(alertMock).toHaveBeenCalledWith(
        'No se avisó a nadie: el producto no está disponible',
        'info',
      ),
    );
  });

  it('sin nadie esperando, lo dice sin parecer un error', async () => {
    postMock.mockResolvedValue({ data: { data: { avisados: 0 } } });
    const { vm } = vmFalso();
    render(<ProductDisponibilidadIa vm={vm} />);
    fireEvent.click(screen.getByText(/avisar a quien lo pidió/i));
    await waitFor(() =>
      expect(alertMock).toHaveBeenCalledWith(
        'Nadie había preguntado por este producto.',
        'info',
      ),
    );
  });
});
