import { useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from '@/utils/apiClient';
import useAlertStore from '@/zustand/alert';

/**
 * La bandeja de mensualidades de los clientes directos.
 *
 * Es la contraparte del motor del backend (`CobroEmpresaService`): emite lo que
 * se debe, deja registrar el pago cuando entra la plata y muestra en qué anda
 * cada empresa. Los clientes de reseller no aparecen acá — su ciclo se paga del
 * saldo del reseller y vive en su propio panel.
 */

export interface Cobro {
    id: number;
    periodo: string;
    planNombre: string | null;
    monto: number | string;
    estado: 'PENDIENTE' | 'APLICADO' | 'RECHAZADO' | 'ANULADO';
    intento: number;
    motivo: string | null;
    medioPago: string | null;
    referencia: string | null;
    fechaVencimiento: string;
    fechaCobro: string | null;
    cubreHasta: string | null;
    descripcion: string | null;
    empresa?: {
        id: number;
        razonSocial: string;
        ruc: string;
        estado: string;
        fechaExpiracion: string;
    };
}

export interface ResumenCobros {
    periodo: string;
    cobrado: { monto: number; empresas: number };
    pendiente: { monto: number; empresas: number };
    noPagado: { monto: number; empresas: number };
}

/**
 * Cada estado con su color y su palabra. El color no es decoración: es lo que
 * permite barrer la tabla sin leer.
 *
 * Van dos cosas distintas a propósito: `color` es el tono del fondo y de los
 * gráficos, y `clsTexto` el color del texto. El tono vivo (#F59E0B sobre
 * blanco da 2,1:1) es ilegible como texto, así que en claro se usa su versión
 * oscura y en oscuro la viva — que ahí sí contrasta. Con un solo hex no se
 * puede: un estilo en línea no sabe en qué tema está.
 */
export const ESTADOS_COBRO = [
    { value: 'PENDIENTE', label: 'Por cobrar', icon: 'solar:clock-circle-bold-duotone', color: '#F59E0B', clsTexto: 'text-amber-700 dark:text-amber-400' },
    { value: 'APLICADO', label: 'Pagado', icon: 'solar:check-circle-bold-duotone', color: '#10B981', clsTexto: 'text-emerald-700 dark:text-emerald-400' },
    { value: 'RECHAZADO', label: 'No pagado', icon: 'solar:close-circle-bold-duotone', color: '#EF4444', clsTexto: 'text-red-700 dark:text-red-400' },
    { value: 'ANULADO', label: 'Anulado', icon: 'solar:forbidden-circle-bold-duotone', color: '#6B7280', clsTexto: 'text-gray-600 dark:text-gray-400' },
] as const;

export const MEDIOS_PAGO = [
    { value: 'YAPE', label: 'Yape', icon: 'solar:smartphone-bold-duotone', color: '#7C3AED', clsTexto: 'text-violet-700 dark:text-violet-400' },
    { value: 'PLIN', label: 'Plin', icon: 'solar:smartphone-2-bold-duotone', color: '#06B6D4', clsTexto: 'text-cyan-700 dark:text-cyan-400' },
    { value: 'TRANSFERENCIA', label: 'Transferencia', icon: 'solar:transfer-horizontal-bold-duotone', color: '#2563EB', clsTexto: 'text-blue-700 dark:text-blue-400' },
    { value: 'EFECTIVO', label: 'Efectivo', icon: 'solar:wad-of-money-bold-duotone', color: '#10B981', clsTexto: 'text-emerald-700 dark:text-emerald-400' },
    { value: 'MERCADO_PAGO', label: 'Mercado Pago', icon: 'solar:card-bold-duotone', color: '#0284C7', clsTexto: 'text-sky-700 dark:text-sky-400' },
    { value: 'OTRO', label: 'Otro', icon: 'solar:tag-bold-duotone', color: '#6B7280', clsTexto: 'text-gray-600 dark:text-gray-400' },
] as const;

export const infoEstado = (valor: string) =>
    ESTADOS_COBRO.find((e) => e.value === valor) ?? ESTADOS_COBRO[3];

export const infoMedio = (valor?: string | null) =>
    MEDIOS_PAGO.find((m) => m.value === valor) ?? MEDIOS_PAGO[MEDIOS_PAGO.length - 1];

/** "2026-10" del mes en curso. */
const periodoActual = () => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
};

/** Los últimos 12 meses, para el selector de periodo. */
export const periodosRecientes = () => {
    const out: { id: string; value: string }[] = [];
    const base = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
        const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        out.push({
            id,
            value: d.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }),
        });
    }
    return out;
};

/** Un pago de un mes pasado que se está cargando al historial. */
const HISTORICO_VACIO = {
    empresaId: '',
    periodo: '',
    monto: '',
    medioPago: 'YAPE',
    referencia: '',
    fechaCobro: new Date().toISOString().slice(0, 10),
};

const PAGO_VACIO = {
    medioPago: 'YAPE',
    referencia: '',
    monto: '',
    fechaCobro: new Date().toISOString().slice(0, 10),
};

export function useCobrosViewModel() {
    const { alert } = useAlertStore();

    const [cobros, setCobros] = useState<Cobro[]>([]);
    const [resumen, setResumen] = useState<ResumenCobros | null>(null);
    const [cargando, setCargando] = useState(true);
    const [procesando, setProcesando] = useState<'emitir' | 'vencidos' | null>(null);

    const [periodo, setPeriodo] = useState(periodoActual());
    const [estado, setEstado] = useState('');
    const [busqueda, setBusqueda] = useState('');

    // Pago que se está registrando (null = modal cerrado).
    const [cobroAPagar, setCobroAPagar] = useState<Cobro | null>(null);
    const [showHistorico, setShowHistorico] = useState(false);
    const [formHistorico, setFormHistorico] = useState(HISTORICO_VACIO);
    const [empresas, setEmpresas] = useState<{ id: number; razonSocial: string }[]>([]);
    const [formPago, setFormPago] = useState(PAGO_VACIO);
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            const params = new URLSearchParams();
            if (periodo) params.set('periodo', periodo);
            if (estado) params.set('estado', estado);
            params.set('limit', '200');
            const [lista, res] = await Promise.all([
                apiClient.get(`/suscripcion/cobros?${params.toString()}`),
                apiClient.get(`/suscripcion/cobros/resumen?periodo=${periodo}`),
            ]);
            setCobros(lista.data?.data?.items ?? lista.data?.items ?? []);
            setResumen(res.data?.data ?? res.data ?? null);
        } catch {
            alert('No se pudieron cargar los cobros', 'error');
        } finally {
            setCargando(false);
        }
    }, [periodo, estado, alert]);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    /** Emite las mensualidades que toca este ciclo. Es la misma acción del cron,
     *  disponible a mano para no depender de la hora del servidor. */
    const emitirMensualidades = useCallback(async () => {
        setProcesando('emitir');
        try {
            const { data } = await apiClient.post('/suscripcion/cobros/generar', {});
            const r = data?.data ?? data;
            alert(
                r?.emitidos > 0
                    ? `Se emitieron ${r.emitidos} mensualidad(es).`
                    : 'No había mensualidades nuevas que emitir.',
                r?.emitidos > 0 ? 'success' : 'info',
            );
            await cargar();
        } catch {
            alert('No se pudieron emitir las mensualidades', 'error');
        } finally {
            setProcesando(null);
        }
    }, [alert, cargar]);

    /** Avisa a los que están en gracia y suspende a los que ya la agotaron. */
    const procesarVencidos = useCallback(async () => {
        setProcesando('vencidos');
        try {
            const { data } = await apiClient.post('/suscripcion/cobros/procesar-vencidos', {});
            const r = data?.data ?? data;
            alert(
                `Vencidos procesados: ${r?.avisados ?? 0} avisado(s), ${r?.suspendidas ?? 0} suspendida(s).`,
                (r?.suspendidas ?? 0) > 0 ? 'warning' : 'success',
            );
            await cargar();
        } catch {
            alert('No se pudieron procesar los vencidos', 'error');
        } finally {
            setProcesando(null);
        }
    }, [alert, cargar]);

    /**
     * Las empresas para el selector del histórico. Se piden recién al abrir el
     * modal: son 43 y no hacen falta para la pantalla normal.
     */
    const abrirHistorico = useCallback(async () => {
        setFormHistorico({ ...HISTORICO_VACIO, periodo });
        setShowHistorico(true);
        if (empresas.length) return;
        try {
            // Misma ruta y forma que usa el panel de Empresas: /empresa/listar
            // devuelve { data: { empresas, page, total, totalPages } }.
            const { data } = await apiClient.get('/empresa/listar', { params: { page: 1, limit: 500 } });
            const lista = data?.data?.empresas ?? [];
            setEmpresas(
                (Array.isArray(lista) ? lista : [])
                    .map((e: any) => ({ id: e.id, razonSocial: e.razonSocial }))
                    .sort((a: any, b: any) => String(a.razonSocial).localeCompare(String(b.razonSocial))),
            );
        } catch {
            alert('No se pudo cargar la lista de empresas', 'error');
        }
    }, [periodo, empresas.length, alert]);

    const guardarHistorico = useCallback(async () => {
        const f = formHistorico;
        const monto = parseFloat(f.monto);
        if (!f.empresaId) return alert('Elige la empresa', 'warning');
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(f.periodo)) return alert('El periodo debe ser AAAA-MM', 'warning');
        if (!Number.isFinite(monto) || monto <= 0) return alert('Ingresa un monto válido', 'warning');
        setGuardando(true);
        try {
            await apiClient.post('/suscripcion/cobros/historico', {
                empresaId: Number(f.empresaId),
                periodo: f.periodo,
                monto,
                medioPago: f.medioPago,
                referencia: f.referencia || undefined,
                fechaCobro: new Date(`${f.fechaCobro}T12:00:00`).toISOString(),
            });
            alert('Pago cargado al historial.', 'success');
            setShowHistorico(false);
            await cargar();
        } catch (e: any) {
            alert(e?.response?.data?.message ?? 'No se pudo cargar el pago', 'error');
        } finally {
            setGuardando(false);
        }
    }, [formHistorico, alert, cargar]);

    const abrirPago = useCallback((cobro: Cobro) => {
        setCobroAPagar(cobro);
        setFormPago({ ...PAGO_VACIO, monto: String(Number(cobro.monto).toFixed(2)) });
    }, []);

    const cerrarPago = useCallback(() => setCobroAPagar(null), []);

    const confirmarPago = useCallback(async () => {
        if (!cobroAPagar) return;
        const monto = parseFloat(formPago.monto);
        if (!Number.isFinite(monto) || monto <= 0) {
            alert('Ingresa un monto válido', 'warning');
            return;
        }
        setGuardando(true);
        try {
            await apiClient.post(`/suscripcion/cobros/${cobroAPagar.id}/registrar-pago`, {
                medioPago: formPago.medioPago,
                referencia: formPago.referencia || undefined,
                monto,
                fechaCobro: formPago.fechaCobro
                    ? new Date(`${formPago.fechaCobro}T12:00:00`).toISOString()
                    : undefined,
            });
            alert('Pago registrado. La suscripción quedó extendida.', 'success');
            setCobroAPagar(null);
            await cargar();
        } catch (e: any) {
            alert(e?.response?.data?.message ?? 'No se pudo registrar el pago', 'error');
        } finally {
            setGuardando(false);
        }
    }, [cobroAPagar, formPago, alert, cargar]);

    /** La búsqueda es local: la lista del periodo ya está en memoria y así el
     *  filtrado responde mientras se escribe, sin un viaje al servidor por tecla. */
    const cobrosVisibles = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        if (!q) return cobros;
        return cobros.filter(
            (c) =>
                c.empresa?.razonSocial?.toLowerCase().includes(q) ||
                c.empresa?.ruc?.includes(q) ||
                c.planNombre?.toLowerCase().includes(q),
        );
    }, [cobros, busqueda]);

    /** Cuántos hay de cada estado, para los chips del filtro. */
    const conteoPorEstado = useMemo(() => {
        const base: Record<string, number> = { PENDIENTE: 0, APLICADO: 0, RECHAZADO: 0, ANULADO: 0 };
        cobros.forEach((c) => {
            base[c.estado] = (base[c.estado] ?? 0) + 1;
        });
        return base;
    }, [cobros]);

    return {
        cobros: cobrosVisibles,
        totalSinFiltrar: cobros.length,
        resumen,
        cargando,
        procesando,
        periodo,
        setPeriodo,
        estado,
        setEstado,
        busqueda,
        setBusqueda,
        conteoPorEstado,
        cargar,
        emitirMensualidades,
        procesarVencidos,
        cobroAPagar,
        abrirPago,
        cerrarPago,
        formPago,
        setFormPago,
        guardando,
        confirmarPago,
        showHistorico,
        setShowHistorico,
        formHistorico,
        setFormHistorico,
        empresas,
        abrirHistorico,
        guardarHistorico,
    };
}
