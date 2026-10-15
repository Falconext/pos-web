import { useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from '@/utils/apiClient';

/**
 * El estado de la suscripción visto por el empresario.
 *
 * Son dos hooks porque son dos usos distintos: el aviso del encabezado solo
 * necesita saber si debe algo (y se monta en TODAS las pantallas, así que pide
 * lo mínimo), mientras que la pantalla "Mi plan" además trae el historial.
 */

export interface EstadoSuscripcion {
    plan: { nombre: string; costo: number | string } | null;
    fechaExpiracion: string;
    /** Desde cuándo es cliente. */
    clienteDesde?: string | null;
    vencida: boolean;
    enGracia: boolean;
    bloqueada: boolean;
    diasRestantes: number;
    cobroPendiente: {
        id: number;
        periodo: string;
        monto: number;
        fechaVencimiento: string;
    } | null;
}

export interface EstadoCobroAutomatico {
    /** Falconext tiene la pasarela configurada y la cuenta puede usarla. */
    disponible: boolean;
    activo: boolean;
    pasarela: string | null;
    estadoPasarela: string | null;
}

export interface CobroPropio {
    id: number;
    periodo: string;
    planNombre: string | null;
    monto: number | string;
    estado: 'PENDIENTE' | 'APLICADO' | 'RECHAZADO' | 'ANULADO';
    medioPago: string | null;
    referencia: string | null;
    fechaVencimiento: string;
    fechaCobro: string | null;
    cubreHasta: string | null;
}

const desempacar = (res: any) => res?.data?.data ?? res?.data ?? null;

/** Días que faltan para el vencimiento (negativo si ya pasó). */
export const diasParaVencer = (iso?: string | null) => {
    if (!iso) return null;
    const ms = new Date(iso).getTime() - Date.now();
    return Math.ceil(ms / 86400000);
};

/**
 * Solo el estado. Lo usa el aviso del encabezado.
 *
 * Si el backend todavía no tiene el endpoint (despliegues desfasados) devuelve
 * null en silencio: un panel entero no puede romperse porque un aviso no cargó.
 */
export function useEstadoSuscripcion(activo: boolean) {
    const [estado, setEstado] = useState<EstadoSuscripcion | null>(null);

    useEffect(() => {
        if (!activo) return;
        let vivo = true;
        apiClient
            .get('/suscripcion/cobros/mi-estado')
            .then((res) => {
                if (vivo) setEstado(desempacar(res));
            })
            .catch(() => {
                /* sin aviso, el panel sigue funcionando igual */
            });
        return () => {
            vivo = false;
        };
    }, [activo]);

    return estado;
}

export function useMiPlanViewModel() {
    const [estado, setEstado] = useState<EstadoSuscripcion | null>(null);
    const [automatico, setAutomatico] = useState<EstadoCobroAutomatico | null>(null);
    const [activando, setActivando] = useState(false);
    const [cobros, setCobros] = useState<CobroPropio[]>([]);
    const [totalPagado, setTotalPagado] = useState(0);
    const [mesesPagados, setMesesPagados] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError(false);
        try {
            const [est, hist, auto] = await Promise.all([
                apiClient.get('/suscripcion/cobros/mi-estado'),
                apiClient.get('/suscripcion/cobros/mi-historial'),
                // Si el backend todavía no lo tiene, la sección no se muestra:
                // no puede tumbar la pantalla entera.
                apiClient.get('/suscripcion/cobros/cobro-automatico').catch(() => null),
            ]);
            setEstado(desempacar(est));
            setAutomatico(auto ? desempacar(auto) : null);
            const h = desempacar(hist);
            setCobros(h?.cobros ?? []);
            setTotalPagado(Number(h?.totalPagado ?? 0));
            setMesesPagados(Number(h?.mesesPagados ?? 0));
        } catch {
            setError(true);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    /**
     * Cuánto del ciclo ya transcurrió, para la barra de progreso.
     *
     * Se calcula contra los 30 días anteriores al vencimiento y no contra la
     * fecha de activación: un cliente de dos años tendría la barra siempre
     * llena y no diría nada.
     */
    const avanceCiclo = useMemo(() => {
        const dias = diasParaVencer(estado?.fechaExpiracion);
        if (dias === null) return 0;
        const restantes = Math.max(0, Math.min(30, dias));
        return ((30 - restantes) / 30) * 100;
    }, [estado?.fechaExpiracion]);

    /**
     * Pide el enlace de autorización y manda al empresario a Mercado Pago.
     * El alta no la confirma el navegador: la confirma el webhook de MP, así
     * que al volver solo se recarga el estado.
     */
    const activarCobroAutomatico = useCallback(async () => {
        setActivando(true);
        try {
            const { data } = await apiClient.post('/suscripcion/cobros/cobro-automatico/activar', {});
            const url = desempacar({ data })?.urlAutorizacion ?? data?.data?.urlAutorizacion;
            if (url) {
                window.location.href = url;
                return { ok: true };
            }
            return { ok: false, mensaje: 'Mercado Pago no devolvió el enlace de autorización.' };
        } catch (e: any) {
            return { ok: false, mensaje: e?.response?.data?.message ?? 'No se pudo activar el cobro automático.' };
        } finally {
            setActivando(false);
        }
    }, []);

    const cancelarCobroAutomatico = useCallback(async () => {
        setActivando(true);
        try {
            await apiClient.post('/suscripcion/cobros/cobro-automatico/cancelar', {});
            await cargar();
            return { ok: true };
        } catch (e: any) {
            return { ok: false, mensaje: e?.response?.data?.message ?? 'No se pudo cancelar.' };
        } finally {
            setActivando(false);
        }
    }, [cargar]);

    return {
        estado,
        automatico,
        activando,
        activarCobroAutomatico,
        cancelarCobroAutomatico,
        cobros,
        totalPagado,
        mesesPagados,
        cargando,
        error,
        avanceCiclo,
        recargar: cargar,
    };
}
