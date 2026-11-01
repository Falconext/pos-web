/**
 * "WhatsApp por QR" (Evolution): estados de la tarjeta, refresco del QR
 * (temporizador y socket), código de emparejamiento, prueba, envío del
 * comprobante, desconexión con confirmación y errores del backend.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WhatsappConexionCard from '../WhatsappConexionCard';
import WhatsappConexionAcceso from '../WhatsappConexionAcceso';
import {
    formatearCodigoEmparejamiento,
    formatearNumeroWhatsapp,
    normalizarCelularPe,
    segundosRefrescoQr,
    usoDiario,
    type ConexionWhatsapp,
} from '../whatsappConexion';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPatch = jest.fn();
const mockDel = jest.fn();
const mockAlert = jest.fn();
let oyenteSocket: ((p: unknown) => void) | null = null;

jest.mock('@/utils/fetch', () => ({
    get: (...a: unknown[]) => mockGet(...a),
    post: (...a: unknown[]) => mockPost(...a),
    patch: (...a: unknown[]) => mockPatch(...a),
    del: (...a: unknown[]) => mockDel(...a),
}));
jest.mock('@/zustand/alert', () => ({ __esModule: true, default: () => ({ alert: mockAlert }) }));
jest.mock('@/zustand/notificaciones', () => ({
    suscribirWhatsappConexion: (fn: (p: unknown) => void) => {
        oyenteSocket = fn;
        return () => {
            oyenteSocket = null;
        };
    },
}));
jest.mock('@iconify/react', () => ({ Icon: () => null }));

const BASE: ConexionWhatsapp = {
    disponible: true,
    proveedor: 'EVOLUTION',
    estado: 'NO_CONECTADO',
    numero: null,
    nombrePerfil: null,
    conectadoEn: null,
    desconectadoEn: null,
    enviadosHoy: 0,
    topeDiario: 300,
    takiyActivo: false,
    enviarComprobante: false,
};
const CONECTADO: ConexionWhatsapp = {
    ...BASE,
    estado: 'CONECTADO',
    numero: '51987654321',
    nombrePerfil: 'Bodega Rosa',
    conectadoEn: '2026-11-01T15:05:00.000Z',
    enviadosHoy: 12,
};
const QR1 = 'data:image/png;base64,QR1';
const QR2 = 'data:image/png;base64,QR2';

const ok = <T,>(data: T) => Promise.resolve({ success: true, data });
const falla = (error: string) => Promise.resolve({ success: false, error });

/** GET: /whatsapp/conexion → estados en orden (el último se repite); /qr → qrs en orden. */
function rutasGet(conexiones: ConexionWhatsapp[], qrs: unknown[] = []) {
    let ic = 0;
    let iq = 0;
    mockGet.mockImplementation((url: string) => {
        if (url === '/whatsapp/conexion/qr') {
            const r = qrs[Math.min(iq++, qrs.length - 1)];
            return r instanceof Error ? falla(r.message) : ok(r);
        }
        return ok(conexiones[Math.min(ic++, conexiones.length - 1)]);
    });
}

beforeEach(() => {
    jest.useRealTimers();
    mockGet.mockReset();
    mockPost.mockReset();
    mockPatch.mockReset();
    mockDel.mockReset();
    mockAlert.mockReset();
    oyenteSocket = null;
});

describe('whatsappConexion (puro)', () => {
    it('normaliza celulares peruanos', () => {
        expect(normalizarCelularPe('987 654 321')).toBe('987654321');
        expect(normalizarCelularPe('+51 987-654-321')).toBe('987654321');
        expect(normalizarCelularPe('51987654321')).toBe('987654321');
        expect(normalizarCelularPe('12345678')).toBeNull();
        expect(normalizarCelularPe('887654321')).toBeNull();
        expect(normalizarCelularPe('')).toBeNull();
    });
    it('formatea número y código', () => {
        expect(formatearNumeroWhatsapp('51987654321')).toBe('+51 987 654 321');
        expect(formatearNumeroWhatsapp('5491122334455')).toBe('+5491122334455');
        expect(formatearNumeroWhatsapp(null)).toBe('');
        expect(formatearCodigoEmparejamiento('kdrz6cnb')).toBe('KDRZ-6CNB');
    });
    it('refresco del QR acotado y uso diario', () => {
        expect(segundosRefrescoQr(20)).toBe(20);
        expect(segundosRefrescoQr(0)).toBe(20);
        expect(segundosRefrescoQr(2)).toBe(10);
        expect(segundosRefrescoQr(999)).toBe(60);
        expect(usoDiario(0, 0)).toEqual({ porcentaje: 0, nivel: 'normal' });
        expect(usoDiario(240, 300).nivel).toBe('alto');
        expect(usoDiario(300, 300)).toEqual({ porcentaje: 100, nivel: 'agotado' });
    });
});

describe('WhatsappConexionCard', () => {
    it('disponible=false: no muestra nada y avisa al padre', async () => {
        rutasGet([{ ...BASE, disponible: false }]);
        const onDisponible = jest.fn();
        const { container } = render(<WhatsappConexionCard onDisponible={onDisponible} />);
        await waitFor(() => expect(onDisponible).toHaveBeenCalledWith(false));
        expect(container).toBeEmptyDOMElement();
    });

    it('error al cargar (backend sin el módulo): tampoco muestra nada', async () => {
        mockGet.mockReturnValue(falla('Cannot GET /whatsapp/conexion'));
        const onDisponible = jest.fn();
        const { container } = render(<WhatsappConexionCard onDisponible={onDisponible} />);
        await waitFor(() => expect(onDisponible).toHaveBeenCalledWith(false));
        expect(container).toBeEmptyDOMElement();
    });

    it('NO_CONECTADO: explica qué se envía, botón Conectar y aviso de Evolution', async () => {
        rutasGet([BASE]);
        render(<WhatsappConexionCard />);
        expect(await screen.findByRole('button', { name: /Vincular mi WhatsApp/ })).toBeInTheDocument();
        expect(screen.getByText(/Avisos de despacho/)).toBeInTheDocument();
        expect(screen.getByText(/comprobante en PDF/)).toBeInTheDocument();
        expect(screen.getByText('Conexión con tecnología Evolution API')).toBeInTheDocument();
        expect(screen.getByText(/envíos masivos/)).toBeInTheDocument();
    });

    it('usuario no admin: ve el estado pero no puede conectar', async () => {
        rutasGet([BASE]);
        render(<WhatsappConexionCard esAdmin={false} />);
        expect(await screen.findByText(/Solo el administrador/)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Vincular mi WhatsApp/ })).toBeNull();
    });

    it('Conectar → muestra el QR y los pasos; el QR se refresca con expiraEnSeg', async () => {
        jest.useFakeTimers();
        rutasGet([BASE], [{ estado: 'CONECTANDO', qr: QR2, codigoEmparejamiento: null, expiraEnSeg: 20 }]);
        mockPost.mockReturnValue(ok({ estado: 'CONECTANDO', qr: QR1, codigoEmparejamiento: null, expiraEnSeg: 20 }));
        render(<WhatsappConexionCard />);
        fireEvent.click(await screen.findByRole('button', { name: /Vincular mi WhatsApp/ }));
        const img = await screen.findByAltText(/Código QR/);
        expect(mockPost).toHaveBeenCalledWith('/whatsapp/conexion', {});
        expect(img).toHaveAttribute('src', QR1);
        expect(screen.getByText(/Dispositivos vinculados/)).toBeInTheDocument();
        expect(screen.getByTestId('wa-estado')).toHaveTextContent('Esperando escaneo');

        await act(async () => {
            jest.advanceTimersByTime(19_000);
        });
        expect(mockGet).not.toHaveBeenCalledWith('/whatsapp/conexion/qr');
        await act(async () => {
            jest.advanceTimersByTime(1_000);
        });
        expect(mockGet).toHaveBeenCalledWith('/whatsapp/conexion/qr');
        await waitFor(() => expect(screen.getByAltText(/Código QR/)).toHaveAttribute('src', QR2));
    });

    it('al escanear (refresco devuelve CONECTADO) pasa a conectado y avisa una vez', async () => {
        jest.useFakeTimers();
        rutasGet([BASE, CONECTADO], [{ estado: 'CONECTADO', qr: null, codigoEmparejamiento: null, expiraEnSeg: 20 }]);
        mockPost.mockReturnValue(ok({ estado: 'CONECTANDO', qr: QR1, codigoEmparejamiento: null, expiraEnSeg: 20 }));
        render(<WhatsappConexionCard />);
        fireEvent.click(await screen.findByRole('button', { name: /Vincular mi WhatsApp/ }));
        await screen.findByAltText(/Código QR/);
        await act(async () => {
            jest.advanceTimersByTime(20_000);
        });
        expect(await screen.findByTestId('wa-numero')).toHaveTextContent('+51 987 654 321');
        expect(mockAlert).toHaveBeenCalledWith(expect.stringMatching(/quedó conectado/), 'success');
        expect(mockAlert).toHaveBeenCalledTimes(1);
    });

    it('socket: un QR nuevo reemplaza la imagen y un cambio de estado recarga', async () => {
        rutasGet([{ ...BASE, estado: 'CONECTANDO' }, CONECTADO], [{ estado: 'CONECTANDO', qr: QR1, codigoEmparejamiento: null, expiraEnSeg: 20 }]);
        render(<WhatsappConexionCard />);
        // Recargó la página a mitad: pide el QR solo.
        await waitFor(() => expect(screen.getByAltText(/Código QR/)).toHaveAttribute('src', QR1));
        act(() => oyenteSocket?.({ estado: 'CONECTANDO', qr: QR2, codigoEmparejamiento: null }));
        expect(screen.getByAltText(/Código QR/)).toHaveAttribute('src', QR2);
        act(() => oyenteSocket?.({ basura: true }));
        expect(screen.getByAltText(/Código QR/)).toHaveAttribute('src', QR2);
        act(() => oyenteSocket?.({ estado: 'CONECTADO', qr: null, codigoEmparejamiento: null }));
        expect(await screen.findByTestId('wa-numero')).toBeInTheDocument();
    });

    it('activa=false: no refresca el QR mientras la sección está cerrada', async () => {
        jest.useFakeTimers();
        rutasGet([{ ...BASE, estado: 'CONECTANDO' }], [{ estado: 'CONECTANDO', qr: QR1, codigoEmparejamiento: null, expiraEnSeg: 20 }]);
        render(<WhatsappConexionCard activa={false} />);
        await screen.findByText('Esperando escaneo');
        await act(async () => {
            jest.advanceTimersByTime(60_000);
        });
        expect(mockGet).not.toHaveBeenCalledWith('/whatsapp/conexion/qr');
    });

    it('error al refrescar el QR: lo dice y reintenta en el siguiente ciclo', async () => {
        jest.useFakeTimers();
        rutasGet(
            [{ ...BASE, estado: 'CONECTANDO' }],
            [new Error('El servidor de WhatsApp no está disponible en este momento. Intenta en unos minutos.'), { estado: 'CONECTANDO', qr: QR1, codigoEmparejamiento: null, expiraEnSeg: 20 }],
        );
        render(<WhatsappConexionCard />);
        expect(await screen.findByRole('alert')).toHaveTextContent(/no está disponible/);
        await act(async () => {
            jest.advanceTimersByTime(20_000);
        });
        await waitFor(() => expect(screen.getByAltText(/Código QR/)).toHaveAttribute('src', QR1));
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('vincular con número: valida 9 dígitos y muestra el código de 8 letras', async () => {
        rutasGet([BASE], [{ estado: 'CONECTANDO', qr: QR1, codigoEmparejamiento: null, expiraEnSeg: 20 }]);
        mockPost.mockReturnValue(ok({ estado: 'CONECTANDO', qr: QR1, codigoEmparejamiento: 'KDRZ6CNB', expiraEnSeg: 20 }));
        render(<WhatsappConexionCard />);
        fireEvent.click(await screen.findByRole('button', { name: /vincular con mi número/ }));
        const campo = screen.getByLabelText(/Tu celular con WhatsApp/);
        fireEvent.change(campo, { target: { value: '12345' } });
        fireEvent.click(screen.getByRole('button', { name: /Pedir código/ }));
        expect(mockPost).not.toHaveBeenCalled();
        expect(mockAlert).toHaveBeenCalledWith(expect.stringMatching(/no es válido/), 'warning');

        fireEvent.change(campo, { target: { value: '+51 987 654 321' } });
        fireEvent.click(screen.getByRole('button', { name: /Pedir código/ }));
        expect(await screen.findByTestId('wa-codigo')).toHaveTextContent('KDRZ-6CNB');
        expect(mockPost).toHaveBeenCalledWith('/whatsapp/conexion', { numero: '987654321' });
        expect(screen.getByText(/Vincular con el número de teléfono/)).toBeInTheDocument();
    });

    it('error al conectar: muestra el mensaje del backend tal cual', async () => {
        rutasGet([BASE]);
        mockPost.mockReturnValue(falla('La conexión de WhatsApp por QR aún no está habilitada para tu empresa.'));
        render(<WhatsappConexionCard />);
        fireEvent.click(await screen.findByRole('button', { name: /Vincular mi WhatsApp/ }));
        await waitFor(() => expect(mockAlert).toHaveBeenCalledWith('La conexión de WhatsApp por QR aún no está habilitada para tu empresa.', 'error'));
        expect(screen.getByTestId('wa-estado')).toHaveTextContent('Sin conectar');
    });

    it('CONECTADO: número, perfil, uso de hoy y Takiy como respaldo', async () => {
        rutasGet([{ ...CONECTADO, takiyActivo: true }]);
        render(<WhatsappConexionCard />);
        expect(await screen.findByTestId('wa-numero')).toHaveTextContent('+51 987 654 321');
        expect(screen.getByText('Bodega Rosa')).toBeInTheDocument();
        expect(screen.getByTestId('wa-uso')).toHaveTextContent('12 / 300');
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '12');
        expect(screen.getByTestId('wa-takiy-respaldo')).toHaveTextContent(/Takiy queda como respaldo/);
    });

    it('tope diario agotado: lo avisa', async () => {
        rutasGet([{ ...CONECTADO, enviadosHoy: 300 }]);
        render(<WhatsappConexionCard />);
        expect(await screen.findByText(/Llegaste al tope de hoy/)).toBeInTheDocument();
    });

    it('interruptor "Enviar el comprobante al emitir" hace PATCH y refleja la respuesta', async () => {
        rutasGet([CONECTADO]);
        mockPatch.mockReturnValue(ok({ ...CONECTADO, enviarComprobante: true }));
        render(<WhatsappConexionCard />);
        const sw = await screen.findByRole('switch', { name: 'Enviar el comprobante al emitir' });
        expect(sw).toHaveAttribute('aria-checked', 'false');
        fireEvent.click(sw);
        await waitFor(() => expect(sw).toHaveAttribute('aria-checked', 'true'));
        expect(mockPatch).toHaveBeenCalledWith('/whatsapp/conexion', { enviarComprobante: true });
    });

    it('interruptor con error: no cambia y muestra el error', async () => {
        rutasGet([CONECTADO]);
        mockPatch.mockReturnValue(falla('Indica si se envía el comprobante al emitir (enviarComprobante: true o false).'));
        render(<WhatsappConexionCard />);
        const sw = await screen.findByRole('switch', { name: 'Enviar el comprobante al emitir' });
        fireEvent.click(sw);
        await waitFor(() => expect(mockAlert).toHaveBeenCalledWith(expect.stringMatching(/Indica si se envía/), 'error'));
        expect(sw).toHaveAttribute('aria-checked', 'false');
    });

    it('prueba: sin número va al celular del dueño; ok=false muestra el error', async () => {
        rutasGet([CONECTADO]);
        mockPost
            .mockReturnValueOnce(ok({ ok: true }))
            .mockReturnValueOnce(ok({ ok: false, error: 'Ese número no tiene WhatsApp.' }));
        render(<WhatsappConexionCard />);
        const boton = await screen.findByRole('button', { name: /Enviar mensaje de prueba/ });
        fireEvent.click(boton);
        await waitFor(() => expect(mockAlert).toHaveBeenCalledWith(expect.stringMatching(/prueba enviado/), 'success'));
        expect(mockPost).toHaveBeenLastCalledWith('/whatsapp/conexion/prueba', {});

        fireEvent.change(screen.getByLabelText(/Probar con el celular/), { target: { value: '912 345 678' } });
        fireEvent.click(boton);
        await waitFor(() => expect(mockAlert).toHaveBeenCalledWith('Ese número no tiene WhatsApp.', 'error'));
        expect(mockPost).toHaveBeenLastCalledWith('/whatsapp/conexion/prueba', { numero: '912345678' });
    });

    it('prueba con número inválido no llama al backend', async () => {
        rutasGet([CONECTADO]);
        render(<WhatsappConexionCard />);
        fireEvent.change(await screen.findByLabelText(/Probar con el celular/), { target: { value: '123' } });
        fireEvent.click(screen.getByRole('button', { name: /Enviar mensaje de prueba/ }));
        expect(mockPost).not.toHaveBeenCalled();
        expect(mockAlert).toHaveBeenCalledWith(expect.stringMatching(/no es válido/), 'warning');
    });

    it('desconectar pide confirmación; "No" no hace nada y "Sí" llama DELETE', async () => {
        rutasGet([CONECTADO]);
        mockDel.mockReturnValue(ok(BASE));
        render(<WhatsappConexionCard />);
        fireEvent.click(await screen.findByRole('button', { name: /^Desconectar$/ }));
        expect(screen.getByRole('alertdialog')).toHaveTextContent(/¿Desconectar tu WhatsApp/);
        fireEvent.click(screen.getByRole('button', { name: /No, mantener/ }));
        expect(screen.queryByRole('alertdialog')).toBeNull();
        expect(mockDel).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: /^Desconectar$/ }));
        fireEvent.click(screen.getByRole('button', { name: /Sí, desconectar/ }));
        await waitFor(() => expect(mockDel).toHaveBeenCalledWith('/whatsapp/conexion'));
        expect(await screen.findByRole('button', { name: /Vincular mi WhatsApp/ })).toBeInTheDocument();
        expect(mockAlert).toHaveBeenCalledWith(expect.stringMatching(/se desconectó/), 'success');
    });

    it('desconectar con error: sigue conectado y lo dice', async () => {
        rutasGet([CONECTADO]);
        mockDel.mockReturnValue(falla('No se pudo contactar al servidor de WhatsApp. Intenta de nuevo en unos minutos.'));
        render(<WhatsappConexionCard />);
        fireEvent.click(await screen.findByRole('button', { name: /^Desconectar$/ }));
        fireEvent.click(screen.getByRole('button', { name: /Sí, desconectar/ }));
        await waitFor(() => expect(mockAlert).toHaveBeenCalledWith(expect.stringMatching(/No se pudo contactar/), 'error'));
        expect(screen.getByTestId('wa-numero')).toBeInTheDocument();
    });

    it('DESCONECTADO: alerta clara y "Volver a conectar" pide un QR nuevo', async () => {
        rutasGet([{ ...CONECTADO, estado: 'DESCONECTADO', desconectadoEn: '2026-11-01T18:00:00.000Z', takiyActivo: true }]);
        mockPost.mockReturnValue(ok({ estado: 'CONECTANDO', qr: QR1, codigoEmparejamiento: null, expiraEnSeg: 20 }));
        render(<WhatsappConexionCard />);
        const alerta = await screen.findByRole('alert');
        expect(alerta).toHaveTextContent(/Tu WhatsApp se desconectó/);
        expect(alerta).toHaveTextContent(/Takiy como respaldo/);
        fireEvent.click(screen.getByRole('button', { name: /Volver a conectar/ }));
        expect(await screen.findByAltText(/Código QR/)).toHaveAttribute('src', QR1);
    });

    it('Cancelar mientras espera el escaneo borra la instancia', async () => {
        rutasGet([{ ...BASE, estado: 'CONECTANDO' }], [{ estado: 'CONECTANDO', qr: QR1, codigoEmparejamiento: null, expiraEnSeg: 20 }]);
        mockDel.mockReturnValue(ok(BASE));
        render(<WhatsappConexionCard />);
        await screen.findByAltText(/Código QR/);
        fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
        expect(await screen.findByRole('button', { name: /Vincular mi WhatsApp/ })).toBeInTheDocument();
    });
});

describe('WhatsappConexionAcceso', () => {
    const montar = (data: ConexionWhatsapp, props: Parameters<typeof WhatsappConexionAcceso>[0] = {}) => {
        mockGet.mockReturnValue(ok(data));
        return render(
            <MemoryRouter>
                <WhatsappConexionAcceso {...props} />
            </MemoryRouter>,
        );
    };

    it('sin la función habilitada no muestra nada', async () => {
        const onConexion = jest.fn();
        const { container } = montar({ ...BASE, disponible: false }, { onConexion });
        await waitFor(() => expect(onConexion).toHaveBeenCalled());
        expect(container).toBeEmptyDOMElement();
    });

    it('sin conectar: enlace a Configuración', async () => {
        montar(BASE);
        const link = await screen.findByRole('link', { name: /Vincular por QR/ });
        expect(link).toHaveAttribute('href', '/administrador/perfil?tab=configuracion&seccion=whatsapp-qr');
    });

    it('conectado: muestra el número y avisa al padre; con onAbrir es botón', async () => {
        const onAbrir = jest.fn();
        const onConexion = jest.fn();
        montar(CONECTADO, { onAbrir, onConexion });
        expect(await screen.findByText(/\+51 987 654 321/)).toBeInTheDocument();
        expect(onConexion).toHaveBeenCalledWith(expect.objectContaining({ estado: 'CONECTADO' }));
        fireEvent.click(screen.getByRole('button', { name: /Ver/ }));
        expect(onAbrir).toHaveBeenCalled();
    });
});
