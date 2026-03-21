import { useEffect, useState, useMemo } from 'react';
import moment from 'moment';
import { useFinanzasStore } from '@/zustand/finanzas';
import { IChartDataFormatted } from './FinanceDashboardModel';

export const valueFormatter = (number: number) =>
    `S/ ${Number(number || 0).toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

export function useFinanceDashboardViewModel() {
    const { kpis, chartData, getResumenFinanciero, isLoading } = useFinanzasStore();

    const [fechaInicio, setFechaInicio] = useState<string>(
        moment(new Date(new Date().getFullYear(), new Date().getMonth(), 1)).format('YYYY-MM-DD')
    );
    const [fechaFin, setFechaFin] = useState<string>(
        moment(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)).format('YYYY-MM-DD')
    );

    useEffect(() => {
        if (fechaInicio && fechaFin) {
            getResumenFinanciero(fechaInicio, fechaFin);
        }
    }, [fechaInicio, fechaFin]);

    const formattedChartData: IChartDataFormatted[] = useMemo(() => {
        return (chartData ?? []).map((row: any) => {
            const [y, m, d] = String(row?.fecha ?? '').split('-').map(Number);
            const fechaLocal = new Date(y, (m || 1) - 1, d || 1);
            const mesShort = fechaLocal.toLocaleString('es-ES', { month: 'short' });
            const mesCap = mesShort.charAt(0).toUpperCase() + mesShort.slice(1);
            return {
                date: `${mesCap} ${fechaLocal.getDate()}`,
                Ingresos: row?.ingresos ?? 0,
                Egresos: row?.egresos ?? 0,
            };
        });
    }, [chartData]);

    const handleDateChange = (date: string, name: string) => {
        if (!moment(date, 'DD/MM/YYYY', true).isValid()) return;

        const formattedDate = moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD');
        if (name === "fechaInicio") {
            setFechaInicio(formattedDate);
        } else if (name === "fechaFin") {
            setFechaFin(formattedDate);
        }
    };

    const refreshData = () => {
        if (fechaInicio && fechaFin) {
            getResumenFinanciero(fechaInicio, fechaFin);
        }
    };

    return {
        // State
        fechaInicio,
        fechaFin,
        isLoading,
        kpis,
        formattedChartData,

        // Handlers
        handleDateChange,
        refreshData,

        // Utils
        valueFormatter
    };
}
