/**
 * El botón de borrar chat, desde el lado de quien lo aprieta.
 *
 * Existe para poder PROBAR: hasta ahora cada prueba quedaba pegada y la
 * siguiente arrancaba con el historial de la anterior, así que no se podía
 * volver a ver el saludo inicial ni repetir un flujo desde cero.
 *
 * Lo que se defiende acá: que pida confirmación —no se deshace— y que lo que
 * ve el usuario después del borrado sea verdad. Dejar la tarjeta del
 * prospecto en pantalla haría creer que falló.
 */
import { renderHook, act, waitFor } from '@testing-library/react';

const alertMock = jest.fn();
jest.mock('@/zustand/alert', () => ({
    __esModule: true,
    default: () => ({ alert: alertMock, loading: false }),
}));

const api = {
    fetchProspectos: jest.fn().mockResolvedValue([]),
    fetchResumen: jest.fn().mockResolvedValue({ total: 0 }),
    fetchConversaciones: jest.fn().mockResolvedValue([]),
    fetchConfig: jest.fn().mockResolvedValue({}),
    fetchConversacion: jest.fn(),
    eliminarConversacion: jest.fn(),
};
jest.mock('@/services/leads.service', () => api);

import { useLeadsViewModel } from '../useLeadsViewModel';

const CONV = {
    id: 69,
    telefonoProspecto: '51919755320',
    nombreProspecto: 'StiloColecta',
    cantidadMensajes: 24,
    mensajes: [],
    prospecto: null,
};

beforeEach(() => {
    jest.clearAllMocks();
    api.fetchProspectos.mockResolvedValue([]);
    api.fetchResumen.mockResolvedValue({ total: 0 });
    api.fetchConversaciones.mockResolvedValue([]);
    api.fetchConfig.mockResolvedValue({});
    api.fetchConversacion.mockResolvedValue(CONV);
    api.eliminarConversacion.mockResolvedValue({ eliminada: true });
});

describe('borrar el chat abierto', () => {
    it('lo borra, lo cierra y vuelve a cargar el tablero', async () => {
        // Las tres cosas importan: si el chat se queda abierto o la tarjeta
        // sigue en el tablero, parece que no se borró.
        const { result } = renderHook(() => useLeadsViewModel());
        await act(async () => {
            await result.current.actions.abrirConversacion(69);
        });
        expect(result.current.conversacion).not.toBeNull();

        api.fetchProspectos.mockClear();
        await act(async () => {
            await result.current.actions.borrarConversacion(69);
        });

        expect(api.eliminarConversacion).toHaveBeenCalledWith(69);
        expect(result.current.conversacion).toBeNull();
        expect(api.fetchProspectos).toHaveBeenCalled();
    });

    it('avisa que ya se puede volver a probar', async () => {
        const { result } = renderHook(() => useLeadsViewModel());
        await act(async () => {
            await result.current.actions.borrarConversacion(69);
        });
        expect(alertMock).toHaveBeenCalledWith(
            expect.stringMatching(/desde cero/i),
            'success',
        );
    });

    it('si falla lo dice y no cierra el chat', async () => {
        // Cerrarlo daría por bueno un borrado que no pasó.
        api.eliminarConversacion.mockRejectedValue(new Error('Conversación no encontrada'));
        const { result } = renderHook(() => useLeadsViewModel());
        await act(async () => {
            await result.current.actions.abrirConversacion(69);
        });
        await act(async () => {
            await result.current.actions.borrarConversacion(69);
        });
        expect(result.current.conversacion).not.toBeNull();
        expect(alertMock).toHaveBeenCalledWith('Conversación no encontrada', 'error');
    });
});

describe('los chats de prueba', () => {
    it('se listan aparte: sin prospecto no saldrían en ninguna columna', async () => {
        // Desde que los números del propio negocio quedaron fuera del embudo,
        // sus chats no tienen prospecto. Sin esta lista serían invisibles y
        // nadie podría leerlos ni borrarlos.
        api.fetchConversaciones.mockResolvedValue([
            { ...CONV, prospecto: null },
            { id: 52, telefonoProspecto: '51991065217', nombreProspecto: 'Diego', cantidadMensajes: 10, prospecto: { puntaje: 95, estado: 'CONVERTIDO' } },
        ]);
        const { result } = renderHook(() => useLeadsViewModel());
        await waitFor(() => expect(result.current.chatsDePrueba).toHaveLength(1));
        expect(result.current.chatsDePrueba[0].id).toBe(69);
    });

    it('si el listado falla, el tablero igual carga', async () => {
        // Es información secundaria: no puede tumbar la pantalla principal.
        api.fetchConversaciones.mockRejectedValue(new Error('500'));
        const { result } = renderHook(() => useLeadsViewModel());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.chatsDePrueba).toEqual([]);
        expect(alertMock).not.toHaveBeenCalledWith(
            expect.anything(),
            'error',
        );
    });
});
