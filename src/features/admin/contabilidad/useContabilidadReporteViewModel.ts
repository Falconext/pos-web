import { useState, useEffect } from 'react';
import moment from 'moment';
import { useAccountingStore } from '@/zustand/accounting';
import { useAuthStore } from '@/zustand/auth';

const useDateFilter = () => {
    const { auth } = useAuthStore();
    const [isHoveredExp, setIsHoveredExp] = useState(false);
    const [fechaInicio, setFechaInicio] = useState<string>(moment(new Date()).format('YYYY-MM-DD'));
    const [fechaFin, setFechaFin] = useState<string>(moment(new Date()).format('YYYY-MM-DD'));

    const handleDate = (date: string, name: string) => {
        if (!moment(date, 'DD/MM/YYYY', true).isValid()) return;
        if (name === 'fechaInicio') setFechaInicio(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'));
        else if (name === 'fechaFin') setFechaFin(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'));
    };

    return { auth, fechaInicio, fechaFin, isHoveredExp, setIsHoveredExp, handleDate };
};

export const useReporteViewModel = (): { reports: any[]; resumenReporte: any; isHoveredExp: boolean; setIsHoveredExp: (v: boolean) => void; handleDate: (date: string, name: string) => void; handleExport: () => void; } => {
    const { reportInvoices, getAllReportInvoice, resumenReporte, exportExcelReport } = useAccountingStore();
    const { auth, fechaInicio, fechaFin, isHoveredExp, setIsHoveredExp, handleDate } = useDateFilter();

    useEffect(() => {
        getAllReportInvoice({ fechaInicio, fechaFin, empresaId: auth?.empresaId });
    }, [fechaFin, fechaInicio, auth]);

    const reports = reportInvoices?.map((item: any) => ({
        comprobante: item?.comprobante, serie: item?.serie, correlativo: item?.correlativo,
        ruc: item?.cliente?.nroDoc, cliente: item?.cliente?.nombre,
        fecha: moment(item?.fechaEmision).format('DD/MM/YYYY'), estado: item?.estadoEnvioSunat,
        montoGravadas: item?.mtoOperGravadas.toFixed(2), montoIGV: item?.mtoIGV.toFixed(2),
        total: `S/ ${item?.mtoImpVenta.toFixed(2)}`
    }));

    const handleExport = () => exportExcelReport({ empresaId: auth?.empresaId, fechaInicio, fechaFin });

    return { reports, resumenReporte, isHoveredExp, setIsHoveredExp, handleDate, handleExport };
};

export const useReporteInformalesViewModel = (): { reports: any[]; resumenReporteInformal: any; isHoveredExp: boolean; setIsHoveredExp: (v: boolean) => void; handleDate: (date: string, name: string) => void; handleExport: () => void; } => {
    const { reportInvoicesInformal, getAllReportInvoiceInformal, resumenReporteInformal, exportExcelReportInformal } = useAccountingStore();
    const { auth, fechaInicio, fechaFin, isHoveredExp, setIsHoveredExp, handleDate } = useDateFilter();

    useEffect(() => {
        getAllReportInvoiceInformal({ fechaInicio, fechaFin, empresaId: auth?.empresaId });
    }, [fechaFin, fechaInicio, auth]);

    const reports = reportInvoicesInformal?.map((item: any) => ({
        comprobante: item?.comprobante, serie: item?.serie, correlativo: item?.correlativo,
        ruc: item?.cliente?.nroDoc, cliente: item?.cliente?.nombre,
        fecha: moment(item?.fechaEmision).format('DD/MM/YYYY'), estadoPago: item?.estadoPago,
        saldo: item?.saldo ? `S/ ${item.saldo.toFixed(2)}` : 'S/ 0.00',
        medioPago: item?.medioPago || '-', estadoOT: item?.estadoOT || '-',
        adelanto: item?.adelanto ? `S/ ${item.adelanto.toFixed(2)}` : 'S/ 0.00',
        total: `S/ ${item?.mtoImpVenta.toFixed(2)}`
    }));

    const handleExport = () => exportExcelReportInformal({ empresaId: auth?.empresaId, fechaInicio, fechaFin });

    return { reports, resumenReporteInformal, isHoveredExp, setIsHoveredExp, handleDate, handleExport };
};
