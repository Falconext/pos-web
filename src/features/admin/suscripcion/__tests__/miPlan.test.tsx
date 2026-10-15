/**
 * Lo que el empresario ve de su suscripción.
 *
 * Dos piezas y una regla de negocio detrás de cada una:
 *
 *  1. El aviso del encabezado aparece cuando debe algo y NO se puede cerrar si
 *     ya venció. Dejar posponer el aviso que avisa de perder el acceso es
 *     ayudarlo a perderlo.
 *  2. El aviso es solo para el empresario: ni el administrador del sistema ni
 *     el reseller tienen mensualidad que pagar, y verlo sería ruido.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

jest.mock('@iconify/react', () => ({ Icon: () => null }));

const get = jest.fn();
jest.mock('@/utils/apiClient', () => ({
    __esModule: true,
    default: { get: (...a: any[]) => get(...a) },
}));

let rolActual = 'ADMIN_EMPRESA';
jest.mock('@/zustand/auth', () => ({
    useAuthStore: () => ({ auth: { rol: rolActual } }),
}));

import AvisoSuscripcion from '@/components/AvisoSuscripcion';
import MiPlanPage from '@/pages/admin/MiPlan';

const enDias = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString();
};

const estado = (over: any = {}) => ({
    plan: { nombre: 'CORPORATIVO', costo: 99.9 },
    fechaExpiracion: enDias(20),
    vencida: false,
    enGracia: false,
    bloqueada: false,
    diasRestantes: 0,
    cobroPendiente: null,
    ...over,
});

const montarAviso = (est: any) => {
    get.mockResolvedValue({ data: { data: est } });
    return render(
        <MemoryRouter>
            <AvisoSuscripcion />
        </MemoryRouter>,
    );
};

beforeEach(() => {
    jest.clearAllMocks();
    rolActual = 'ADMIN_EMPRESA';
    localStorage.clear();
});

describe('Aviso de suscripción', () => {
    it('no molesta cuando falta mucho para vencer', async () => {
        montarAviso(estado());
        await waitFor(() => expect(get).toHaveBeenCalled());
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('avisa cuando está por vencer y deja posponerlo', async () => {
        montarAviso(estado({ fechaExpiracion: enDias(3) }));
        expect(await screen.findByRole('status')).toBeInTheDocument();
        expect(screen.getByText(/vence en 3 días/i)).toBeInTheDocument();
        expect(screen.getByLabelText('Recordarme mañana')).toBeInTheDocument();
    });

    it('si ya venció, el aviso es de alerta y NO se puede cerrar', async () => {
        montarAviso(
            estado({ fechaExpiracion: enDias(-2), vencida: true, enGracia: true, diasRestantes: 1 }),
        );
        expect(await screen.findByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/queda 1 día para regularizarlo/i)).toBeInTheDocument();
        expect(screen.queryByLabelText('Recordarme mañana')).not.toBeInTheDocument();
    });

    it('no se le muestra al administrador del sistema', async () => {
        rolActual = 'ADMIN_SISTEMA';
        montarAviso(estado({ fechaExpiracion: enDias(-2), vencida: true, enGracia: true, diasRestantes: 1 }));
        await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
        // Ni siquiera pregunta por un estado que no le corresponde.
        expect(get).not.toHaveBeenCalled();
    });

    it('si el backend no responde, el panel sigue sin aviso', async () => {
        get.mockRejectedValue(new Error('404'));
        render(
            <MemoryRouter>
                <AvisoSuscripcion />
            </MemoryRouter>,
        );
        await waitFor(() => expect(get).toHaveBeenCalled());
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
});

describe('Pantalla Mi plan', () => {
    const montarPagina = (est: any, historial: any) => {
        get.mockImplementation((url: string) =>
            url.includes('mi-historial')
                ? Promise.resolve({ data: { data: historial } })
                : Promise.resolve({ data: { data: est } }),
        );
        return render(
            <MemoryRouter>
                <MiPlanPage />
            </MemoryRouter>,
        );
    };

    it('muestra el plan, el vencimiento y lo pagado', async () => {
        montarPagina(estado(), {
            cobros: [
                {
                    id: 1, periodo: '2026-09', planNombre: 'CORPORATIVO', monto: 99.9,
                    estado: 'APLICADO', medioPago: 'YAPE', referencia: 'OP-9',
                    fechaVencimiento: enDias(-10), fechaCobro: enDias(-10), cubreHasta: enDias(20),
                },
            ],
            totalPagado: 99.9,
            mesesPagados: 1,
        });
        // El nombre del plan sale dos veces: en la cabecera y en la fila del historial.
        expect((await screen.findAllByText('CORPORATIVO')).length).toBeGreaterThan(0);
        expect(screen.getByText('Activo hasta')).toBeInTheDocument();
        expect(screen.getByText('Meses pagados')).toBeInTheDocument();
        expect(screen.getByText('Pagado')).toBeInTheDocument();
        expect(screen.getByText('Op. OP-9')).toBeInTheDocument();
    });

    it('cuando debe, muestra el monto y cómo coordinar el pago', async () => {
        montarPagina(
            estado({
                fechaExpiracion: enDias(-1),
                vencida: true,
                enGracia: true,
                diasRestantes: 2,
                cobroPendiente: { id: 5, periodo: '2026-10', monto: 99.9, fechaVencimiento: enDias(-1) },
            }),
            { cobros: [], totalPagado: 0, mesesPagados: 0 },
        );
        expect(await screen.findByText('Tienes una mensualidad por pagar')).toBeInTheDocument();
        expect(screen.getAllByText('Coordinar pago').length).toBeGreaterThan(0);
        expect(screen.getByText('Venció el')).toBeInTheDocument();
    });

    it('sin deuda lo dice y no inventa una acción de pago', async () => {
        montarPagina(estado(), { cobros: [], totalPagado: 0, mesesPagados: 0 });
        expect(await screen.findByText('No tienes pagos pendientes.')).toBeInTheDocument();
        expect(screen.queryByText('Coordinar pago')).not.toBeInTheDocument();
    });
});
