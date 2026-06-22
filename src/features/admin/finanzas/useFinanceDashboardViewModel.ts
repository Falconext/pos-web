import { useEffect, useState, useMemo } from 'react';
import moment from 'moment';
import { useFinanzasStore } from '@/zustand/finanzas';
import { useAuthStore } from '@/zustand/auth';
import { useSedesStore } from '@/zustand/sedes';
import { IChartDataFormatted } from './FinanceDashboardModel';
import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { FinanceReportPDF } from './FinanceReportPDF';

export const valueFormatter = (number: number) =>
    `S/ ${Number(number || 0).toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

export function useFinanceDashboardViewModel() {
    const { kpis, chartData, metodosPago, conciliacion, getResumenFinanciero, isLoading } = useFinanzasStore();
    const { auth, sedeActiva } = useAuthStore();
    const { sedes, listarSedes } = useSedesStore();

    const isAdmin = auth?.rol === 'ADMIN_EMPRESA' || auth?.rol === 'ADMIN_SISTEMA';
    const esPrincipal = !sedeActiva || sedeActiva.esPrincipal === true;
    const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null);
    const effectiveSedeId = esPrincipal ? selectedSedeId : (sedeActiva?.id ?? null);

    const sedesOptions = [
        { id: 0, value: 'Todas las sedes' },
        ...sedes.map(s => ({ id: s.id, value: s.esPrincipal ? `${s.nombre}` : s.nombre }))
    ];

    const [fechaInicio, setFechaInicio] = useState<string>(
        moment(new Date(new Date().getFullYear(), new Date().getMonth(), 1)).format('YYYY-MM-DD')
    );
    const [fechaFin, setFechaFin] = useState<string>(
        moment(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)).format('YYYY-MM-DD')
    );

    useEffect(() => {
        if (isAdmin && esPrincipal) listarSedes();
    }, [isAdmin, esPrincipal]);

    useEffect(() => {
        if (fechaInicio && fechaFin) {
            getResumenFinanciero(fechaInicio, fechaFin, effectiveSedeId);
        }
    }, [fechaInicio, fechaFin, effectiveSedeId]);

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
            getResumenFinanciero(fechaInicio, fechaFin, effectiveSedeId);
        }
    };

    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const handleExportPDF = async () => {
        setIsGeneratingPDF(true);
        try {
            const sedeName = sedeActiva?.nombre ?? (esPrincipal ? 'Todas las sedes' : undefined);
            const empresa = auth?.empresa
                ? { nombre: auth.empresa.razonSocial || auth.empresa.nombre, ruc: auth.empresa.ruc, direccion: auth.empresa.direccion }
                : null;

            const blob = await pdf(
                React.createElement(FinanceReportPDF, {
                    kpis,
                    chartData: chartData ?? [],
                    fechaInicio,
                    fechaFin,
                    empresa,
                    sedeName,
                }) as any
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `reporte-financiero-${fechaInicio}-${fechaFin}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Error generando PDF:', e);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    return {
        // State
        fechaInicio,
        fechaFin,
        isLoading,
        kpis,
        metodosPago,
        conciliacion,
        formattedChartData,

        // Sede filtering
        isAdmin,
        esPrincipal,
        sedesOptions,
        handleSelectSede: (id: any) => setSelectedSedeId(id === 0 ? null : Number(id)),

        // Handlers
        handleDateChange,
        refreshData,
        handleExportPDF,
        isGeneratingPDF,

        // Utils
        valueFormatter
    };
}
