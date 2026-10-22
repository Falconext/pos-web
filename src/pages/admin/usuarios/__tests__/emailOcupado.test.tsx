/**
 * Avisar que el correo ya está tomado, mientras se escribe.
 *
 * El reclamo: la empresa A da de alta a vendedor1@gmail.com y la empresa B
 * intenta lo mismo. No se puede —el correo es la llave de entrada al sistema y
 * es única en toda la plataforma—, pero eso se descubría recién al pulsar
 * Guardar, con el formulario entero lleno.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ModalUsuario from '../ModalUsuario';
import { get } from '@/utils/fetch';

jest.mock('@/utils/fetch', () => ({ get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), del: jest.fn() }));
jest.mock('@iconify/react', () => ({ Icon: () => null }));
jest.mock('@/components/Modal', () => ({ __esModule: true, default: ({ children, isOpenModal }: any) => (isOpenModal ? <div>{children}</div> : null) }));
jest.mock('@/zustand/users', () => ({
  useUsersStore: () => ({ createUser: jest.fn(), updateUser: jest.fn(), loading: false }),
  MODULOS_SISTEMA: [],
}));
jest.mock('@/zustand/modulos', () => ({ useModulosStore: () => ({ modulos: [], getAllModulos: jest.fn() }) }));
jest.mock('@/zustand/alert', () => ({ __esModule: true, default: () => ({ alert: jest.fn() }) }));
jest.mock('@/zustand/sedes', () => ({ useSedesStore: () => ({ sedes: [], listarSedes: jest.fn() }) }));
jest.mock('@/zustand/auth', () => ({ useAuthStore: () => ({ auth: { rol: 'ADMIN_EMPRESA', empresa: { producto: 'facturacion', nombreComercial: 'Inversiones Minera' } } }) }));

const campoCorreo = () => screen.getByPlaceholderText('usuario@empresa.com');

const escribir = (valor: string) =>
  fireEvent.change(campoCorreo(), { target: { name: 'email', value: valor } });

const abrir = () =>
  render(<ModalUsuario isOpen onClose={jest.fn()} isEdit={false} user={null as any} />);

beforeEach(() => { jest.clearAllMocks(); jest.useFakeTimers(); });
afterEach(() => { jest.useRealTimers(); });

/** Deja pasar el debounce y la respuesta. */
const esperarConsulta = async () => {
  await waitFor(() => { jest.advanceTimersByTime(600); });
};

describe('Correo ya usado por otra empresa', () => {
  it('avisa en el formulario cuando el correo está tomado', async () => {
    (get as jest.Mock).mockResolvedValue({ data: { disponible: false } });
    abrir();
    escribir('vendedor1@gmail.com');
    await esperarConsulta();
    await waitFor(() => expect(screen.getByText(/ya está en uso/i)).toBeTruthy());
  });

  it('dice qué hacer, no solo que está mal', async () => {
    (get as jest.Mock).mockResolvedValue({ data: { disponible: false } });
    abrir();
    escribir('vendedor1@gmail.com');
    await esperarConsulta();
    await waitFor(() => expect(screen.getByText(/usa otro correo/i)).toBeTruthy());
  });

  it('no avisa nada si el correo está libre', async () => {
    (get as jest.Mock).mockResolvedValue({ data: { disponible: true } });
    abrir();
    escribir('nuevo@gmail.com');
    await esperarConsulta();
    await waitFor(() => expect(screen.queryByText(/ya está en uso/i)).toBeNull());
  });

  it('no consulta con el correo a medio escribir', async () => {
    abrir();
    escribir('vendedor1@gma');
    await esperarConsulta();
    expect(get).not.toHaveBeenCalled();
  });

  it('si la consulta falla no bloquea el formulario', async () => {
    (get as jest.Mock).mockRejectedValue(new Error('sin red'));
    abrir();
    escribir('vendedor1@gmail.com');
    await esperarConsulta();
    await waitFor(() => expect(screen.queryByText(/ya está en uso/i)).toBeNull());
  });
});
