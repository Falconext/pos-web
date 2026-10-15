/**
 * La bandeja de cobros, por lo que tiene que resistir.
 *
 * Es una pantalla donde se registra plata y se reactivan cuentas, así que lo
 * que se protege acá no es el diseño sino tres cosas:
 *
 *  1. Que el botón de cobrar aparezca SOLO donde hay algo que cobrar. Ofrecer
 *     "registrar pago" sobre uno ya pagado invita a cobrar dos veces.
 *  2. Que el monto propuesto sea el emitido, para que quien registra no tenga
 *     que acordarse de cuánto era.
 *  3. Que un cobro vencido se vea vencido: es la fila que hay que mirar.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * En jsdom no hay CSS, así que se montan a la vez la tabla de escritorio y las
 * tarjetas de móvil y cada dato aparece dos veces. En el navegador solo una de
 * las dos existe (`hidden` es display:none, que además la saca del árbol de
 * accesibilidad). Por eso acá se consulta siempre en plural.
 */
const primero = async (texto: string | RegExp) => (await screen.findAllByText(texto))[0];

jest.mock('@iconify/react', () => ({ Icon: () => null }));

const alertMock = jest.fn();
jest.mock('@/zustand/alert', () => ({
    __esModule: true,
    default: Object.assign(() => ({ alert: alertMock }), {
        getState: () => ({ alert: alertMock }),
    }),
}));

jest.mock('@/components/Select', () => ({
    __esModule: true,
    default: ({ value }: any) => <div data-testid="select">{value}</div>,
}));

const get = jest.fn();
const post = jest.fn();
jest.mock('@/utils/apiClient', () => ({
    __esModule: true,
    default: {
        get: (...a: any[]) => get(...a),
        post: (...a: any[]) => post(...a),
    },
}));

import CobrosPage from '@/pages/admin/sistema/Cobros';

const ayer = () => {
    const d = new Date();
    d.setDate(d.getDate() - 4);
    return d.toISOString();
};

const COBROS = [
    {
        id: 1,
        periodo: '2026-10',
        planNombre: 'CORPORATIVO',
        monto: 99.9,
        estado: 'PENDIENTE',
        intento: 1,
        motivo: null,
        medioPago: null,
        referencia: null,
        fechaVencimiento: ayer(),
        fechaCobro: null,
        cubreHasta: null,
        descripcion: null,
        empresa: { id: 90, razonSocial: 'VETERINARIA IRBA', ruc: '20616097076', estado: 'ACTIVO', fechaExpiracion: ayer() },
    },
    {
        id: 2,
        periodo: '2026-10',
        planNombre: 'NEGOCIO',
        monto: 69.9,
        estado: 'APLICADO',
        intento: 1,
        motivo: null,
        medioPago: 'YAPE',
        referencia: 'OP-77',
        fechaVencimiento: new Date().toISOString(),
        fechaCobro: new Date().toISOString(),
        cubreHasta: null,
        descripcion: null,
        empresa: { id: 71, razonSocial: 'CHOCOLATERIA BORDA', ruc: '20600000001', estado: 'ACTIVO', fechaExpiracion: new Date().toISOString() },
    },
];

beforeEach(() => {
    jest.clearAllMocks();
    get.mockImplementation((url: string) =>
        url.includes('resumen')
            ? Promise.resolve({
                data: {
                    data: {
                        periodo: '2026-10',
                        cobrado: { monto: 69.9, empresas: 1 },
                        pendiente: { monto: 99.9, empresas: 1 },
                        noPagado: { monto: 0, empresas: 0 },
                    },
                },
            })
            : Promise.resolve({ data: { data: { items: COBROS, total: 2 } } }),
    );
    post.mockResolvedValue({ data: { data: {} } });
});

describe('Bandeja de cobros', () => {
    it('muestra las empresas del periodo con su monto', async () => {
        render(<CobrosPage />);
        expect(await primero('VETERINARIA IRBA')).toBeInTheDocument();
        expect(screen.getAllByText('CHOCOLATERIA BORDA').length).toBeGreaterThan(0);
        // El monto sale en la fila de escritorio y en la tarjeta móvil.
        expect(screen.getAllByText('S/ 99.90').length).toBeGreaterThan(0);
    });

    it('solo ofrece cobrar lo que no está pagado', async () => {
        render(<CobrosPage />);
        await primero('VETERINARIA IRBA');
        // Un cobro pendiente (fila + tarjeta móvil = 2 botones), el pagado ninguno.
        expect(screen.getAllByText('Registrar pago')).toHaveLength(2);
    });

    it('marca el vencido para que salte a la vista', async () => {
        render(<CobrosPage />);
        await primero('VETERINARIA IRBA');
        expect(screen.getAllByText(/Venció hace 4 días/).length).toBeGreaterThan(0);
    });

    it('al abrir el pago propone el monto emitido', async () => {
        render(<CobrosPage />);
        await primero('VETERINARIA IRBA');
        fireEvent.click(screen.getAllByText('Registrar pago')[0]);
        const monto = await screen.findByLabelText('Monto');
        expect((monto as HTMLInputElement).value).toBe('99.90');
    });

    it('registra el pago con el medio elegido', async () => {
        render(<CobrosPage />);
        await primero('VETERINARIA IRBA');
        fireEvent.click(screen.getAllByText('Registrar pago')[0]);
        await screen.findByLabelText('Monto');
        fireEvent.click(screen.getByText('Transferencia'));
        fireEvent.click(screen.getByText('Confirmar pago'));
        await waitFor(() => {
            expect(post).toHaveBeenCalledWith(
                '/suscripcion/cobros/1/registrar-pago',
                expect.objectContaining({ medioPago: 'TRANSFERENCIA', monto: 99.9 }),
            );
        });
    });

    it('no envía un monto inválido', async () => {
        render(<CobrosPage />);
        await primero('VETERINARIA IRBA');
        fireEvent.click(screen.getAllByText('Registrar pago')[0]);
        const monto = await screen.findByLabelText('Monto');
        fireEvent.change(monto, { target: { value: '0' } });
        fireEvent.click(screen.getByText('Confirmar pago'));
        await waitFor(() => expect(alertMock).toHaveBeenCalledWith('Ingresa un monto válido', 'warning'));
        expect(post).not.toHaveBeenCalled();
    });

    it('la búsqueda filtra por RUC sin ir al servidor', async () => {
        render(<CobrosPage />);
        await primero('VETERINARIA IRBA');
        const llamadasAntes = get.mock.calls.length;
        fireEvent.change(screen.getByLabelText('Buscar empresa, RUC o plan'), {
            target: { value: '20616097076' },
        });
        await waitFor(() => expect(screen.queryAllByText('CHOCOLATERIA BORDA')).toHaveLength(0));
        expect(screen.getAllByText('VETERINARIA IRBA').length).toBeGreaterThan(0);
        expect(get.mock.calls.length).toBe(llamadasAntes);
    });
});
