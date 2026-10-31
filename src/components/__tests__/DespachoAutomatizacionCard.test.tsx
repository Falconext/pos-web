/**
 * Avisos de despacho con texto aparte para provincia (agencia). Lo que se
 * cuida: la variante es opcional, se muestra solo al prenderla, se guarda
 * (o se borra al apagarla) y no se guarda prendida pero vacía.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DespachoAutomatizacionCard from '../DespachoAutomatizacionCard';
import { errorProvincia, payloadProvincia, provinciaActivaDesde } from '../despachoMensajes';

const mockGet = jest.fn();
const mockPut = jest.fn();
const mockAlert = jest.fn();

jest.mock('@/utils/fetch', () => ({
    get: (...a: unknown[]) => mockGet(...a),
    put: (...a: unknown[]) => mockPut(...a),
    patch: jest.fn(),
}));
jest.mock('@/zustand/alert', () => ({ __esModule: true, default: () => ({ alert: mockAlert }) }));
jest.mock('@/lib/branding', () => ({ BRAND: { website: 'https://krezka.test' } }));
jest.mock('@/components/Select', () => ({ __esModule: true, default: () => null }));
jest.mock('@iconify/react', () => ({ Icon: () => null }));

const BASE = {
    mensajeEnCamino: 'Lima {{nombre}}',
    mensajeEntregado: 'Entregado {{pedido}}',
    mensajeEnAgencia: 'Llegó a {{agencia}}',
    notificarEnCamino: true,
    notificarEntregado: true,
    recordatorioRecojoDias: 0,
    pagoRepartidorPropio: null,
    pagoRepartidorContratado: null,
    habilitadoPorPlan: true,
    mensajesEditables: true,
};

const montar = async (data: Record<string, unknown>) => {
    mockGet.mockResolvedValue({ data: { ...BASE, ...data } });
    render(<DespachoAutomatizacionCard />);
    await screen.findByText('Estado: En Camino');
};

beforeEach(() => {
    mockGet.mockReset();
    mockPut.mockReset().mockResolvedValue({ data: {} });
    mockAlert.mockReset();
});

describe('despachoMensajes (puro)', () => {
    const textos = { mensajeEnCaminoAgencia: 'Va a {{agencia}}', mensajeEntregadoAgencia: '  ' };

    it('se prende solo la variante que tiene texto', () => {
        expect(provinciaActivaDesde({ mensajeEnCaminoAgencia: 'x', mensajeEntregadoAgencia: null })).toEqual({
            mensajeEnCaminoAgencia: true,
            mensajeEntregadoAgencia: false,
        });
    });

    it('apagada o vacía se guarda null (vuelve al texto general)', () => {
        expect(payloadProvincia(textos, { mensajeEnCaminoAgencia: true, mensajeEntregadoAgencia: false })).toEqual({
            mensajeEnCaminoAgencia: 'Va a {{agencia}}',
            mensajeEntregadoAgencia: null,
        });
        expect(payloadProvincia(textos, { mensajeEnCaminoAgencia: false, mensajeEntregadoAgencia: false }).mensajeEnCaminoAgencia).toBeNull();
    });

    it('prendida pero vacía no se puede guardar', () => {
        expect(errorProvincia(textos, { mensajeEnCaminoAgencia: true, mensajeEntregadoAgencia: true })).toMatch(/Entregado/);
        expect(errorProvincia(textos, { mensajeEnCaminoAgencia: true, mensajeEntregadoAgencia: false })).toBeNull();
    });
});

describe('DespachoAutomatizacionCard: provincia', () => {
    it('sin texto de provincia: no hay segundo cuadro ni etiqueta "Lima"', async () => {
        await montar({});
        expect(screen.queryByLabelText('Recojo en agencia')).toBeNull();
        expect(screen.queryByText('A domicilio (motorizado o courier)')).toBeNull();
        expect(screen.getAllByRole('switch', { name: /Mensaje para recojo en agencia/ })).toHaveLength(2);
    });

    it('al prenderla aparece el cuadro con texto de ejemplo y su vista previa', async () => {
        await montar({});
        fireEvent.click(screen.getByRole('switch', { name: 'Mensaje para recojo en agencia: Estado: En Camino' }));
        const cuadro = screen.getByLabelText('Recojo en agencia') as HTMLTextAreaElement;
        expect(cuadro.value).toMatch(/\{\{agencia\}\}/);
        expect(screen.getByText('A domicilio (motorizado o courier)')).toBeTruthy();
        expect(screen.getByText(/Lo recogerás en Shalom Cusco Centro/)).toBeTruthy();
    });

    it('guarda el texto de provincia junto con lo demás', async () => {
        await montar({});
        fireEvent.click(screen.getByRole('switch', { name: 'Mensaje para recojo en agencia: Estado: Entregado' }));
        fireEvent.change(screen.getByLabelText('Recojo en agencia'), { target: { value: 'Recogiste en {{agencia}}' } });
        fireEvent.click(screen.getByText('Guardar cambios'));
        await waitFor(() => expect(mockPut).toHaveBeenCalled());
        expect(mockPut.mock.calls[0][1]).toMatchObject({
            mensajeEnCamino: 'Lima {{nombre}}',
            mensajeEntregadoAgencia: 'Recogiste en {{agencia}}',
            mensajeEnCaminoAgencia: null,
        });
    });

    it('llega guardada: arranca prendida; al apagarla se manda null', async () => {
        await montar({ mensajeEnCaminoAgencia: 'Provincia {{agencia}}' });
        expect((screen.getByLabelText('Recojo en agencia') as HTMLTextAreaElement).value).toBe('Provincia {{agencia}}');
        fireEvent.click(screen.getByRole('switch', { name: 'Mensaje para recojo en agencia: Estado: En Camino' }));
        fireEvent.click(screen.getByText('Guardar cambios'));
        await waitFor(() => expect(mockPut).toHaveBeenCalled());
        expect(mockPut.mock.calls[0][1].mensajeEnCaminoAgencia).toBeNull();
    });

    it('prendida y vacía: avisa y no guarda', async () => {
        await montar({});
        fireEvent.click(screen.getByRole('switch', { name: 'Mensaje para recojo en agencia: Estado: En Camino' }));
        fireEvent.change(screen.getByLabelText('Recojo en agencia'), { target: { value: '   ' } });
        fireEvent.click(screen.getByText('Guardar cambios'));
        expect(mockAlert).toHaveBeenCalledWith(expect.stringMatching(/En camino/), 'warning');
        expect(mockPut).not.toHaveBeenCalled();
    });

    it('prendida y vacía pero con el aviso apagado: guarda null, no bloquea', async () => {
        await montar({});
        fireEvent.click(screen.getByRole('switch', { name: 'Mensaje para recojo en agencia: Estado: Entregado' }));
        fireEvent.change(screen.getByLabelText('Recojo en agencia'), { target: { value: '' } });
        fireEvent.click(screen.getByRole('switch', { name: 'Avisar: Estado: Entregado' }));
        fireEvent.click(screen.getByText('Guardar cambios'));
        await waitFor(() => expect(mockPut).toHaveBeenCalled());
        expect(mockPut.mock.calls[0][1]).toMatchObject({ notificarEntregado: false, mensajeEntregadoAgencia: null });
    });

    it('la tarjeta de agencia avisa que la clave y el saldo se agregan solos', async () => {
        await montar({});
        expect(screen.getByText(/los agregamos al final/)).toBeTruthy();
    });
});
