import { useEffect } from 'react';
import { useAuthStore } from '@/zustand/auth';
import { useResellerPanelStore } from '@/zustand/reseller-panel';

export const useResellerDashboardViewModel = () => {
    const { auth } = useAuthStore();
    const { stats, getDashboard } = useResellerPanelStore();

    useEffect(() => {
        if (auth?.resellerId) getDashboard(auth.resellerId);
    }, [auth]);

    return { auth, stats };
};

export const useResellerRecargasViewModel = () => {
    const { auth } = useAuthStore();
    const { recargas, getRecargas, stats, getDashboard } = useResellerPanelStore();

    useEffect(() => {
        if (auth?.resellerId) {
            getRecargas(auth.resellerId);
            getDashboard(auth.resellerId);
        }
    }, [auth]);

    return { recargas, stats };
};
