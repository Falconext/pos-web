/**
 * El modal de eliminar empresa frente a respuestas que no son la vista previa.
 *
 * `get()` de `utils/fetch` NO lanza cuando la petición falla: devuelve
 * `{ success: false, error }`. La primera versión de este modal hacía
 * `r?.data ?? r` y le entregaba ese objeto al render, que reventaba al leer
 * `totalFilas` de algo que no era la previa:
 *
 *   Uncaught TypeError: Cannot read properties of undefined (reading 'toLocaleString')
 *
 * Pasó de verdad, en la pantalla de empresas: la empresa ya no existía, el
 * backend respondió 404 y el modal entero se cayó — sin mostrar nada, y
 * dejando al admin sin saber qué había pasado.
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@iconify/react', () => ({ Icon: () => null }));
jest.mock('@/components/Button', () => ({
    __esModule: true,
    default: ({ children, ...p }: any) => <button {...p}>{children}</button>,
}));

const getMock = jest.fn();
jest.mock('@/utils/fetch', () => ({ get: (...a: any[]) => getMock(...a) }));

import ModalEliminarEmpresa from '../ModalEliminarEmpresa';

const EMPRESA = { id: 15, razonSocial: 'JAMBLE PERU E.I.R.L.', ruc: '20614504774' };

const pintar = (onConfirmar = jest.fn()) =>
    render(
        <ModalEliminarEmpresa empresa={EMPRESA} onCancelar={jest.fn()} onConfirmar={onConfirmar} />,
    );

beforeEach(() => getMock.mockReset());

describe('cuando la vista previa no se puede traer', () => {
    it('muestra el error en vez de caerse', async () => {
        getMock.mockResolvedValue({ success: false, error: 'Empresa no encontrada' });
        pintar();
        expect(await screen.findByText('Empresa no encontrada')).toBeInTheDocument();
        // Lo importante: el modal sigue en pie.
        expect(screen.getByText('Eliminar empresa')).toBeInTheDocument();
    });

    it('tampoco se cae si la respuesta llega con otra forma', async () => {
        // Un wrapper distinto, un 500 que devuelve HTML, un campo renombrado:
        // nada de eso debe tumbar la pantalla.
        getMock.mockResolvedValue({ cualquierCosa: true });
        pintar();
        await waitFor(() => expect(screen.getByText('Eliminar empresa')).toBeInTheDocument());
        expect(screen.queryByText(/Se eliminarán/)).not.toBeInTheDocument();
    });
});

describe('cuando la vista previa llega bien', () => {
    beforeEach(() => {
        getMock.mockResolvedValue({
            success: true,
            data: {
                totalFilas: 317,
                tablasAfectadas: 12,
                detalle: [
                    { tabla: 'Notificacion', filas: 189 },
                    { tabla: 'ResellerMovimiento', filas: 98 },
                ],
            },
        });
    });

    it('dice cuántos registros se pierden y en qué tablas', async () => {
        pintar();
        expect(await screen.findByText(/317/)).toBeInTheDocument();
        expect(screen.getByText('Notificacion')).toBeInTheDocument();
    });
});

describe('la confirmación por RUC', () => {
    beforeEach(() => getMock.mockResolvedValue({ success: true, data: { totalFilas: 0, tablasAfectadas: 0, detalle: [] } }));

    it('el botón está bloqueado hasta escribir el RUC exacto', async () => {
        pintar();
        const boton = await screen.findByText('Eliminar definitivamente');
        expect(boton).toBeDisabled();

        fireEvent.change(screen.getByPlaceholderText('20614504774'), { target: { value: '2061450477' } });
        expect(boton).toBeDisabled(); // le falta un dígito

        fireEvent.change(screen.getByPlaceholderText('20614504774'), { target: { value: '20614504774' } });
        expect(boton).toBeEnabled();
    });

    it('manda el RUC escrito al confirmar', async () => {
        const onConfirmar = jest.fn().mockResolvedValue(undefined);
        pintar(onConfirmar);
        await screen.findByText('Eliminar definitivamente');
        fireEvent.change(screen.getByPlaceholderText('20614504774'), { target: { value: '20614504774' } });
        fireEvent.click(screen.getByText('Eliminar definitivamente'));
        await waitFor(() => expect(onConfirmar).toHaveBeenCalledWith('20614504774'));
    });

    it('si el borrado falla lo muestra, no lo deja en la consola', async () => {
        // Antes salía como "Uncaught (in promise)" y el modal se quedaba igual,
        // como si no hubiera pasado nada.
        const onConfirmar = jest.fn().mockRejectedValue(new Error('No se pudo eliminar: falló Sede'));
        pintar(onConfirmar);
        await screen.findByText('Eliminar definitivamente');
        fireEvent.change(screen.getByPlaceholderText('20614504774'), { target: { value: '20614504774' } });
        fireEvent.click(screen.getByText('Eliminar definitivamente'));
        expect(await screen.findByText(/falló Sede/)).toBeInTheDocument();
    });
});
