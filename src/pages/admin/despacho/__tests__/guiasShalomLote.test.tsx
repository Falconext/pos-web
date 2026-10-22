/**
 * Guías de Shalom en lote (pedido 2026-10-21): IMPORTEMOS JUNTOS llegó a
 * generar 37 guías en un día abriendo cada despacho.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { generarEnLote, pendientesDeGuia, rotulosDeGeneradas, type FilaPanelParaGuia } from '../guiasShalomLote';

const crearGuia = jest.fn();
jest.mock('@/services/shalom.service', () => ({
    shalomService: { crearGuia: (...a: any[]) => crearGuia(...a) },
    mensajeErrorShalom: (e: any, porDefecto: string) => e?.response?.data?.message || porDefecto,
}));
jest.mock('@/components/Modal', () => ({
    __esModule: true,
    default: ({ children, title }: any) => (
        <div>
            <h1>{title}</h1>
            {children}
        </div>
    ),
}));
jest.mock('@iconify/react', () => ({ Icon: () => null }));

import { GuiasShalomLoteModal } from '../GuiasShalomLoteModal';

const fila = (p: Partial<FilaPanelParaGuia>): FilaPanelParaGuia => ({
    comprobanteId: 1,
    referencia: 'NV01-1',
    cliente: 'Juan Pérez',
    courier: 'SHALOM_PRO',
    estadoDespacho: 'PREPARANDO',
    nroOrden: '',
    agenciaDestino: 'CUSCO PARQUE INDUSTRIAL',
    celularDest: '987654321',
    clienteTelefono: '',
    ...p,
});

describe('qué despachos necesitan guía', () => {
    it('solo Shalom, en Preparando y sin N° de orden', () => {
        const r = pendientesDeGuia([
            fila({ comprobanteId: 1 }),
            fila({ comprobanteId: 2, nroOrden: '100610492' }),
            fila({ comprobanteId: 3, courier: 'OLVA' }),
            fila({ comprobanteId: 4, estadoDespacho: 'EN_CAMINO' }),
            fila({ comprobanteId: 5, courier: 'SHALOM_COD' }),
            fila({ comprobanteId: null }),
            fila({ comprobanteId: 6, despachoEnComprobanteId: 1 }),
            fila({ comprobanteId: 7, estadoSunat: 'ANULADO' }),
            fila({ comprobanteId: 8, estadoSunat: 'RECHAZADO' }),
            fila({ comprobanteId: 9, estadoPagoRaw: 'ANULADO' }),
        ]);
        expect(r.map((p) => p.comprobanteId)).toEqual([1, 5]);
    });

    it('marca lo que falta y toma el celular del cliente si el despacho no tiene', () => {
        const [sinAgencia, conTelefonoCliente] = pendientesDeGuia([
            fila({ comprobanteId: 1, agenciaDestino: '—', celularDest: '' }),
            fila({ comprobanteId: 2, celularDest: '—', clienteTelefono: '911222333' }),
        ]);
        expect(sinAgencia.faltan).toEqual(['agencia de destino', 'celular']);
        expect(conTelefonoCliente.faltan).toEqual([]);
        expect(conTelefonoCliente.celular).toBe('911222333');
    });
});

describe('generarEnLote', () => {
    it('va de a uno, sigue después de un error y separa la que ya tenía guía', async () => {
        const orden: number[] = [];
        const estados: Record<number, any> = {};
        let enCurso = 0;
        let maxEnCurso = 0;
        await generarEnLote(
            [1, 2, 3],
            async (id) => {
                enCurso++;
                maxEnCurso = Math.max(maxEnCurso, enCurso);
                orden.push(id);
                await Promise.resolve();
                enCurso--;
                if (id === 2) throw new Error('Falta el nombre o el documento del destinatario para generar la guía.');
                if (id === 3) throw new Error('Este despacho ya tiene la guía 100 registrada.');
                return { nroOrden: '845123' };
            },
            (id, e) => { estados[id] = e; },
            () => false,
            (e) => (e as Error).message,
        );
        expect(orden).toEqual([1, 2, 3]);
        expect(maxEnCurso).toBe(1);
        expect(estados[1]).toEqual({ estado: 'ok', nroOrden: '845123' });
        expect(estados[2].estado).toBe('error');
        expect(estados[3].estado).toBe('omitida');
    });

    it('detener corta antes de la siguiente y marca las que faltaban', async () => {
        let parar = false;
        const estados: Record<number, any> = {};
        const crear = jest.fn(async () => { parar = true; return { nroOrden: '1' }; });
        await generarEnLote([1, 2, 3], crear, (id, e) => { estados[id] = e; }, () => parar, () => '');
        expect(crear).toHaveBeenCalledTimes(1);
        expect(estados[2]).toEqual({ estado: 'detenida' });
        expect(estados[3]).toEqual({ estado: 'detenida' });
    });

    it('los rótulos son solo de las que salieron bien', () => {
        const pendientes = pendientesDeGuia([fila({ comprobanteId: 1 }), fila({ comprobanteId: 2, referencia: 'NV01-2' })]);
        const r = rotulosDeGeneradas(pendientes, { 1: { estado: 'ok', nroOrden: '9' }, 2: { estado: 'error', mensaje: 'x' } });
        expect(r).toEqual([{ comprobanteId: 1, referencia: 'NV01-1', courier: 'SHALOM_PRO', celular: '987654321' }]);
    });
});

describe('el modal', () => {
    beforeEach(() => crearGuia.mockReset());

    const pendientes = pendientesDeGuia([
        fila({ comprobanteId: 1, referencia: 'NV01-1', cliente: 'Juan' }),
        fila({ comprobanteId: 2, referencia: 'NV01-2', cliente: 'María' }),
        fila({ comprobanteId: 3, referencia: 'NV01-3', cliente: 'Pedro', agenciaDestino: '' }),
    ]);

    it('genera las marcadas, muestra cada resultado y ofrece los rótulos', async () => {
        crearGuia
            .mockResolvedValueOnce({ nroOrden: '845123' })
            .mockRejectedValueOnce({ response: { data: { message: 'Falta el nombre o el documento del destinatario para generar la guía.' } } });
        const onImprimirRotulos = jest.fn();
        const onTerminado = jest.fn();
        render(
            <GuiasShalomLoteModal
                pendientes={pendientes}
                onClose={() => undefined}
                onTerminado={onTerminado}
                onImprimirRotulos={onImprimirRotulos}
                onCorregir={() => undefined}
            />,
        );

        // La que no tiene agencia no se puede marcar.
        expect(screen.getByTestId('guia-lote-check-3')).toBeDisabled();
        expect(screen.getByText('Falta agencia de destino')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('guias-lote-generar'));

        await waitFor(() => expect(screen.getByTestId('guias-lote-resumen')).toHaveTextContent('Listo.'));
        expect(crearGuia.mock.calls.map((c) => c[0])).toEqual([1, 2]);
        expect(screen.getByTestId('guia-lote-ok-1')).toHaveTextContent('Guía 845123');
        expect(screen.getByTestId('guia-lote-error-2')).toHaveTextContent('Falta el nombre o el documento');
        expect(screen.getByTestId('guia-lote-corregir-2')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('guias-lote-rotulos'));
        expect(onImprimirRotulos).toHaveBeenCalledWith([{ comprobanteId: 1, referencia: 'NV01-1', courier: 'SHALOM_PRO', celular: '987654321' }]);

        fireEvent.click(screen.getByTestId('guias-lote-cerrar'));
        expect(onTerminado).toHaveBeenCalled();
    });

    it('si desmarcas una, no la genera', async () => {
        crearGuia.mockResolvedValue({ nroOrden: '1' });
        render(
            <GuiasShalomLoteModal pendientes={pendientes} onClose={() => undefined} onTerminado={() => undefined} onImprimirRotulos={() => undefined} onCorregir={() => undefined} />,
        );
        fireEvent.click(screen.getByTestId('guia-lote-check-2'));
        expect(screen.getByTestId('guias-lote-generar')).toHaveTextContent('Generar 1 guía');
        fireEvent.click(screen.getByTestId('guias-lote-generar'));
        await waitFor(() => expect(screen.getByTestId('guias-lote-resumen')).toHaveTextContent('Listo.'));
        expect(crearGuia).toHaveBeenCalledTimes(1);
        expect(crearGuia).toHaveBeenCalledWith(1);
    });
});
