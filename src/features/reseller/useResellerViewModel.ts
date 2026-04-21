import { useEffect } from 'react';
import { useAuthStore } from '@/zustand/auth';
import { useResellerPanelStore } from '@/zustand/reseller-panel';

export const useResellerDashboardViewModel = () => {
    const { auth } = useAuthStore();
    const { stats, clientes, getDashboard, getClientes } = useResellerPanelStore();

    useEffect(() => {
        if (auth?.resellerId) {
            getDashboard(auth.resellerId);
            getClientes(auth.resellerId);
        }
    }, [auth]);

    return { auth, stats, clientes };
};

export const useResellerRecargasViewModel = () => {
    const { auth } = useAuthStore();
    const { recargas, getRecargas, stats, getDashboard, renovaciones, renovacionesResumen, getRenovaciones } = useResellerPanelStore();

    useEffect(() => {
        if (auth?.resellerId) {
            getRecargas(auth.resellerId);
            getDashboard(auth.resellerId);
            getRenovaciones(auth.resellerId);
        }
    }, [auth]);

    return { recargas, stats, renovaciones, renovacionesResumen, getRenovaciones, auth };
};
