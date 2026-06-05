import { useState, useEffect, useCallback } from 'react';
import { get, post, patch, del } from '@/utils/fetch';
import useAlertStore from '@/zustand/alert';
import {
    PnlResponse,
    EvolucionPoint,
    GastoOperativo,
    GastoFormData,
} from './RentabilidadModel';

// ─── State shape ─────────────────────────────────────────────────────────────

interface RentabilidadState {
    mesActual: number;
    anioActual: number;
    pnl: PnlResponse | null;
    evolucion: EvolucionPoint[];
    gastos: GastoOperativo[];
    isLoading: boolean;
    isModalOpen: boolean;
    gastoEditando: GastoOperativo | null;
    isSaving: boolean;
}

// ─── ViewModel ────────────────────────────────────────────────────────────────

export function useRentabilidadViewModel() {
    const { alert } = useAlertStore();

    const now = new Date();
    const [state, setState] = useState<RentabilidadState>({
        mesActual: now.getMonth() + 1,
        anioActual: now.getFullYear(),
        pnl: null,
        evolucion: [],
        gastos: [],
        isLoading: false,
        isModalOpen: false,
        gastoEditando: null,
        isSaving: false,
    });

    // ─── Derived ──────────────────────────────────────────────────────────────

    const now2 = new Date();
    const currentMonth = now2.getMonth() + 1;
    const currentYear = now2.getFullYear();
    const isCurrentOrFuture =
        state.anioActual > currentYear ||
        (state.anioActual === currentYear && state.mesActual >= currentMonth);

    // ─── Fetchers ─────────────────────────────────────────────────────────────

    const fetchPnl = useCallback(async (mes: number, anio: number) => {
        const resp = await get<PnlResponse>(`analisis-financiero/pnl?mes=${mes}&anio=${anio}`);
        if (resp.data) {
            setState(prev => ({ ...prev, pnl: resp.data! }));
        }
    }, []);

    const fetchGastos = useCallback(async (mes: number, anio: number) => {
        const resp = await get<GastoOperativo[]>(`analisis-financiero/gastos?mes=${mes}&anio=${anio}`);
        if (resp.data) {
            setState(prev => ({ ...prev, gastos: resp.data! }));
        }
    }, []);

    const fetchEvolucion = useCallback(async () => {
        const resp = await get<EvolucionPoint[]>(`analisis-financiero/evolucion?meses=6`);
        if (resp.data) {
            setState(prev => ({ ...prev, evolucion: resp.data! }));
        }
    }, []);

    // ─── Load on mount and on mes/año change ──────────────────────────────────

    useEffect(() => {
        const load = async () => {
            setState(prev => ({ ...prev, isLoading: true }));
            try {
                await Promise.all([
                    fetchPnl(state.mesActual, state.anioActual),
                    fetchGastos(state.mesActual, state.anioActual),
                ]);
            } finally {
                setState(prev => ({ ...prev, isLoading: false }));
            }
        };
        load();
    }, [state.mesActual, state.anioActual]);

    // Fetch evolution only once on mount
    useEffect(() => {
        fetchEvolucion();
    }, []);

    // ─── Navigation ───────────────────────────────────────────────────────────

    const navegarMes = useCallback((delta: -1 | 1) => {
        setState(prev => {
            let mes = prev.mesActual + delta;
            let anio = prev.anioActual;

            if (mes < 1) {
                mes = 12;
                anio -= 1;
            } else if (mes > 12) {
                mes = 1;
                anio += 1;
            }

            return { ...prev, mesActual: mes, anioActual: anio };
        });
    }, []);

    // ─── Gasto CRUD ───────────────────────────────────────────────────────────

    const refreshPnlAndGastos = useCallback(async (mes: number, anio: number) => {
        setState(prev => ({ ...prev, isLoading: true }));
        try {
            await Promise.all([fetchPnl(mes, anio), fetchGastos(mes, anio)]);
        } finally {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, [fetchPnl, fetchGastos]);

    const crearGasto = useCallback(async (data: GastoFormData) => {
        setState(prev => ({ ...prev, isSaving: true }));
        try {
            const resp = await post<GastoOperativo>('analisis-financiero/gastos', data);
            if (resp.error) {
                alert(resp.error, 'error', 'Error');
                return false;
            }
            alert('Gasto registrado correctamente', 'success', 'Éxito');
            setState(prev => ({ ...prev, isModalOpen: false, gastoEditando: null }));
            await refreshPnlAndGastos(state.mesActual, state.anioActual);
            return true;
        } catch {
            alert('No se pudo registrar el gasto', 'error', 'Error');
            return false;
        } finally {
            setState(prev => ({ ...prev, isSaving: false }));
        }
    }, [state.mesActual, state.anioActual, alert, refreshPnlAndGastos]);

    const actualizarGasto = useCallback(async (id: number, data: Partial<GastoFormData>) => {
        setState(prev => ({ ...prev, isSaving: true }));
        try {
            const resp = await patch<GastoOperativo>(`analisis-financiero/gastos/${id}`, data);
            if (resp.error) {
                alert(resp.error, 'error', 'Error');
                return false;
            }
            alert('Gasto actualizado correctamente', 'success', 'Éxito');
            setState(prev => ({ ...prev, isModalOpen: false, gastoEditando: null }));
            await refreshPnlAndGastos(state.mesActual, state.anioActual);
            return true;
        } catch {
            alert('No se pudo actualizar el gasto', 'error', 'Error');
            return false;
        } finally {
            setState(prev => ({ ...prev, isSaving: false }));
        }
    }, [state.mesActual, state.anioActual, alert, refreshPnlAndGastos]);

    const eliminarGasto = useCallback(async (id: number) => {
        try {
            const resp = await del(`analisis-financiero/gastos/${id}`);
            if (resp.error) {
                alert(resp.error, 'error', 'Error');
                return false;
            }
            alert('Gasto eliminado', 'success', 'Éxito');
            await refreshPnlAndGastos(state.mesActual, state.anioActual);
            return true;
        } catch {
            alert('No se pudo eliminar el gasto', 'error', 'Error');
            return false;
        }
    }, [state.mesActual, state.anioActual, alert, refreshPnlAndGastos]);

    // ─── Modal helpers ────────────────────────────────────────────────────────

    const abrirModalCrear = useCallback(() => {
        setState(prev => ({ ...prev, isModalOpen: true, gastoEditando: null }));
    }, []);

    const abrirModalEditar = useCallback((gasto: GastoOperativo) => {
        setState(prev => ({ ...prev, isModalOpen: true, gastoEditando: gasto }));
    }, []);

    const cerrarModal = useCallback(() => {
        setState(prev => ({ ...prev, isModalOpen: false, gastoEditando: null }));
    }, []);

    // ─── Return ───────────────────────────────────────────────────────────────

    return {
        // State
        mesActual: state.mesActual,
        anioActual: state.anioActual,
        pnl: state.pnl,
        evolucion: state.evolucion,
        gastos: state.gastos,
        isLoading: state.isLoading,
        isModalOpen: state.isModalOpen,
        gastoEditando: state.gastoEditando,
        isSaving: state.isSaving,
        isCurrentOrFuture,

        // Actions
        navegarMes,
        crearGasto,
        actualizarGasto,
        eliminarGasto,
        abrirModalCrear,
        abrirModalEditar,
        cerrarModal,
    };
}
