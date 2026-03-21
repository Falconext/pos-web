import { useState, useEffect } from 'react';
import moment from 'moment';
import { useAccountingStore } from '@/zustand/accounting';
import { useAuthStore } from '@/zustand/auth';

export const useArqueoViewModel = () => {
    const { arqueoData, getAllArqueo, exportExcelArqueo } = useAccountingStore();
    const { auth } = useAuthStore();
    const [isHoveredExp, setIsHoveredExp] = useState(false);
    const [fechaInicio, setFechaInicio] = useState<string>(moment(new Date()).format('YYYY-MM-DD'));
    const [fechaFin, setFechaFin] = useState<string>(moment(new Date()).format('YYYY-MM-DD'));

    const handleDate = (date: string, name: string) => {
        if (!moment(date, 'DD/MM/YYYY', true).isValid()) return;
        if (name === 'fechaInicio') setFechaInicio(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'));
        else if (name === 'fechaFin') setFechaFin(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'));
    };

    useEffect(() => {
        getAllArqueo({ fechaInicio, fechaFin, empresaId: auth?.empresaId });
    }, [fechaFin, fechaInicio, auth]);

    const movimientos = arqueoData?.movimientosCaja?.map((item: any) => ({
        tipoMovimiento: item?.tipo,
        documento: item?.documento,
        cliente: item?.cliente,
        fecha: moment(item?.fecha).format('DD/MM/YYYY HH:mm'),
        concepto: item?.concepto,
        medioPago: item?.medioPago,
        monto: `S/ ${item?.monto.toFixed(2)}`,
        referencia: item?.referencia || '-',
    })) || [];

    const handleExport = () => exportExcelArqueo({ empresaId: auth?.empresaId, fechaInicio, fechaFin });

    return { arqueoData, movimientos, resumen: arqueoData?.resumen, isHoveredExp, setIsHoveredExp, handleDate, handleExport };
};
