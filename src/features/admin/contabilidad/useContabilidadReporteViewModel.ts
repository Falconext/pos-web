import { useState, useEffect } from 'react';
import moment from 'moment';
import { useAccountingStore } from '@/zustand/accounting';
import { useAuthStore } from '@/zustand/auth';
import { useSedesStore } from '@/zustand/sedes';
import { puedeLeerVentasDeTodos } from '@/utils/alcanceLectura';

const useDateFilter = () => {
    const { auth } = useAuthStore();
    const [isHoveredExp, setIsHoveredExp] = useState(false);
    const [fechaInicio, setFechaInicio] = useState<string>(moment().startOf('month').format('YYYY-MM-DD'));
    const [fechaFin, setFechaFin] = useState<string>(moment().format('YYYY-MM-DD'));

    const handleDate = (date: string, name: string) => {
        if (!moment(date, 'DD/MM/YYYY', true).isValid()) return;
        if (name === 'fechaInicio') setFechaInicio(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'));
        else if (name === 'fechaFin') setFechaFin(moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD'));
    };

    return { auth, fechaInicio, fechaFin, isHoveredExp, setIsHoveredExp, handleDate };
};

export const useReporteViewModel = () => {
    const { reportInvoices, excluidosReporte, getAllReportInvoice, resumenReporte, exportExcelReport, exportPdfReport } = useAccountingStore();
    const { auth, fechaInicio, fechaFin, isHoveredExp, setIsHoveredExp, handleDate } = useDateFilter();
    const { sedes, listarSedes } = useSedesStore();
    const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null);
    const [isExportingPdf, setIsExportingPdf] = useState(false);

    // El backend clava al usuario común en su sede (sedeIdParaListado); ofrecerle
    // "Todas las sedes" era mentirle. Admin y supervisor sí eligen.
    const canFilterSede = puedeLeerVentasDeTodos(auth as any);

    const sedesOptions = [
        { id: 0, value: "Todas las sedes" },
        ...sedes.map(s => ({ id: s.id, value: s.esPrincipal ? `${s.nombre} (Principal)` : s.nombre }))
    ];

    const handleSelectSede = (id: any, _value: string) => {
        setSelectedSedeId(id === 0 ? null : Number(id));
    };

    useEffect(() => {
        if (canFilterSede) listarSedes();
    }, [canFilterSede]);

    useEffect(() => {
        const params: any = { fechaInicio, fechaFin };
        if (selectedSedeId) params.sedeId = selectedSedeId;
        getAllReportInvoice(params);
    }, [fechaFin, fechaInicio, auth, selectedSedeId]);

    const estadoPagoLabel: Record<string, string> = {
        COMPLETADO: 'Pagado',
        PENDIENTE_PAGO: 'Pendiente',
        PAGO_PARCIAL: 'Parcial',
        ANULADO: 'Anulado',
    };

    const mapRow = (item: any) => {
        const moneda = item?.tipoMoneda || 'PEN';
        const fmt = (v: any) => v != null ? Number(v).toFixed(2) : '0.00';
        // El backend ya manda los importes EN SOLES (factura en US$ × TC del
        // comprobante), igual que en Compras; el valor del documento en dólares
        // se muestra en la columna moneda, no se le pone "$" a un monto en soles.
        const simbol = 'S/';
        const tc = Number(item?.tipoCambio) || 0;
        const monedaLabel = moneda === 'USD'
            ? `US$ ${fmt(item?.mtoImpVentaDoc ?? item?.mtoImpVenta)}${tc > 0 ? ` · TC ${tc.toFixed(3)}` : ''}`
            : 'PEN';
        const formaPago = (item?.formaPagoTipo || '').toUpperCase() === 'CREDITO' ? 'Crédito' : 'Contado';
        return {
            sede: item?.sede?.nombre || '-',
            comprobante: item?.comprobante,
            serie: item?.serie,
            correlativo: item?.correlativo,
            ruc: item?.cliente?.nroDoc || '-',
            cliente: item?.cliente?.nombre || '-',
            vendedor: item?.usuario?.nombre || '-',
            fecha: moment(item?.fechaEmision).utcOffset(-5 * 60).format('DD/MM/YYYY'),
            // La clave lleva "Doc" a propósito: el DataTable pasa a minúsculas
            // cualquier texto salvo en columnas que "parecen código" (serie, doc…);
            // sin esto "US$ 375.00 · TC 3.750" saldría como "Us$ … · tc …".
            monedaDoc: monedaLabel,
            formaPago,
            medioPago: item?.medioPago || '-',
            estadoSunat: item?.estadoEnvioSunat,
            estadoPago: estadoPagoLabel[item?.estadoPago] || item?.estadoPago || '-',
            gravadas: fmt(item?.mtoOperGravadas),
            inafectas: fmt(item?.mtoOperInafectas),
            exoneradas: fmt(item?.mtoOperExoneradas),
            exportacion: fmt(item?.mtoOperExportacion),
            igv: fmt(item?.mtoIGV),
            total: `${simbol} ${fmt(item?.mtoImpVenta)}`,
            saldo: item?.saldo != null && Number(item.saldo) > 0 ? `${simbol} ${fmt(item.saldo)}` : '-',
            motivo: item?.motivo?.descripcion || '-',
            // La clave lleva "Doc" por lo mismo que `monedaDoc`: que el DataTable
            // no pase "SUNAT" a "sunat".
            motivoDocExcluido: item?.motivoExclusion || '-',
        };
    };

    const reports = reportInvoices?.map(mapRow);
    const excluidos = (excluidosReporte ?? []).map(mapRow);

    // Lectura conjunta de anulados / NC / rechazados. Criterio SUNAT (y SIRE):
    // el anulado SUMA en su mes de emisión; lo resta su NC en el mes en que ella
    // se emitió; el rechazado no existe para SUNAT. Sin este desglose, ver
    // "Anulado" en una fila y "Nota de Crédito: 0.00" parecía un error.
    const cuenta = (items: any[]) => ({
        n: items.length,
        monto: items.reduce((t: number, i: any) => t + Number(i?.mtoImpVenta || 0), 0),
    });
    const notasResumen = {
        anulados: cuenta((reportInvoices ?? []).filter((i: any) => i?.estadoEnvioSunat === 'ANULADO' && i?.tipoDoc !== '07')),
        ncAnulacion: cuenta((reportInvoices ?? []).filter((i: any) => i?.tipoDoc === '07' && ['01', '06'].includes(i?.motivo?.codigo))),
        rechazados: cuenta(excluidosReporte ?? []),
    };

    const handleExport = () => {
        const params: any = { fechaInicio, fechaFin };
        if (selectedSedeId) params.sedeId = selectedSedeId;
        exportExcelReport(params);
    };

    const handleExportPdf = async (formato: 'zip' | 'pdf') => {
        const params: any = { fechaInicio, fechaFin };
        if (selectedSedeId) params.sedeId = selectedSedeId;
        setIsExportingPdf(true);
        try {
            await exportPdfReport(params, formato);
        } finally {
            setIsExportingPdf(false);
        }
    };

    return { reports, excluidos, notasResumen, resumenReporte, fechaInicio, fechaFin, isHoveredExp, setIsHoveredExp, handleDate, handleExport, handleExportPdf, isExportingPdf, canFilterSede, sedesOptions, handleSelectSede };
};

export const useReporteInformalesViewModel = () => {
    const { reportInvoicesInformal, getAllReportInvoiceInformal, resumenReporteInformal, exportExcelReportInformal } = useAccountingStore();
    const { auth, fechaInicio, fechaFin, isHoveredExp, setIsHoveredExp, handleDate } = useDateFilter();
    const { sedes, listarSedes } = useSedesStore();
    const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null);

    const canFilterSede = puedeLeerVentasDeTodos(auth as any);

    const sedesOptions = [
        { id: 0, value: "Todas las sedes" },
        ...sedes.map(s => ({ id: s.id, value: s.esPrincipal ? `${s.nombre} (Principal)` : s.nombre }))
    ];

    const handleSelectSede = (id: any, _value: string) => {
        setSelectedSedeId(id === 0 ? null : Number(id));
    };

    useEffect(() => {
        if (canFilterSede) listarSedes();
    }, [canFilterSede]);

    useEffect(() => {
        const params: any = { fechaInicio, fechaFin };
        if (selectedSedeId) params.sedeId = selectedSedeId;
        getAllReportInvoiceInformal(params);
    }, [fechaFin, fechaInicio, auth, selectedSedeId]);

    const reports = reportInvoicesInformal?.map((item: any) => ({
        sede: item?.sede?.nombre || '-',
        comprobante: item?.comprobante, serie: item?.serie, correlativo: item?.correlativo,
        ruc: item?.cliente?.nroDoc, cliente: item?.cliente?.nombre,
        fecha: moment(item?.fechaEmision).format('DD/MM/YYYY'), estadoPago: item?.estadoPago,
        saldo: item?.saldo != null ? `S/ ${Number(item.saldo).toFixed(2)}` : 'S/ 0.00',
        medioPago: item?.medioPago || '-', estadoOT: item?.estadoOT || '-',
        adelanto: item?.adelanto != null ? `S/ ${Number(item.adelanto).toFixed(2)}` : 'S/ 0.00',
        total: `S/ ${item?.mtoImpVenta != null ? Number(item.mtoImpVenta).toFixed(2) : '0.00'}`
    }));

    const handleExport = () => {
        const params: any = { fechaInicio, fechaFin };
        if (selectedSedeId) params.sedeId = selectedSedeId;
        exportExcelReportInformal(params);
    };

    return { reports, resumenReporteInformal, fechaInicio, fechaFin, isHoveredExp, setIsHoveredExp, handleDate, handleExport, canFilterSede, sedesOptions, handleSelectSede };
};

const estadoPagoLabel: Record<string, string> = {
    COMPLETADO: 'Pagado',
    PENDIENTE_PAGO: 'Pendiente',
    PAGO_PARCIAL: 'Parcial',
    ANULADO: 'Anulado',
};

export const useReporteComprasViewModel = () => {
    const { reportCompras, getAllReportCompras, resumenReporteCompras, exportExcelReportCompras } = useAccountingStore();
    const { auth, fechaInicio, fechaFin, isHoveredExp, setIsHoveredExp, handleDate } = useDateFilter();
    const { sedes, listarSedes } = useSedesStore();
    const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null);

    const canFilterSede = puedeLeerVentasDeTodos(auth as any);

    const sedesOptions = [
        { id: 0, value: "Todas las sedes" },
        ...sedes.map(s => ({ id: s.id, value: s.esPrincipal ? `${s.nombre} (Principal)` : s.nombre }))
    ];

    const handleSelectSede = (id: any, _value: string) => {
        setSelectedSedeId(id === 0 ? null : Number(id));
    };

    useEffect(() => {
        if (canFilterSede) listarSedes();
    }, [canFilterSede]);

    useEffect(() => {
        const params: any = { fechaInicio, fechaFin };
        if (selectedSedeId) params.sedeId = selectedSedeId;
        getAllReportCompras(params);
    }, [fechaFin, fechaInicio, auth, selectedSedeId]);

    const fmt = (v: any) => v != null ? Number(v).toFixed(2) : '0.00';

    const reports = reportCompras?.map((item: any) => {
        const moneda = item?.moneda || 'PEN';
        // El backend ya manda los importes EN SOLES (factura en US$ × TC de la
        // compra); el valor del documento en dólares se muestra en la columna moneda.
        const simbol = 'S/';
        const tc = Number(item?.tipoCambio) || 1;
        const monedaLabel = moneda === 'USD'
            ? `US$ ${fmt(item?.totalDoc ?? item?.total)} · TC ${tc.toFixed(3)}`
            : 'PEN';
        return {
            sede: item?.sede?.nombre || '-',
            comprobante: item?.tipoDoc || '-',
            serie: item?.serie || '-',
            numero: item?.numero || '-',
            ruc: item?.proveedor?.nroDoc || '-',
            proveedor: item?.proveedor?.nombre || '-',
            fecha: moment(item?.fechaEmision).utcOffset(-5 * 60).format('DD/MM/YYYY'),
            monedaDoc: monedaLabel, // ver nota en useReporteViewModel
            estadoPago: estadoPagoLabel[item?.estadoPago] || item?.estadoPago || '-',
            gravadas: `${simbol} ${fmt(item?.subtotal)}`,
            igv: `${simbol} ${fmt(item?.igv)}`,
            total: `${simbol} ${fmt(item?.total)}`,
            saldo: item?.saldo != null && Number(item.saldo) > 0 ? `${simbol} ${fmt(item.saldo)}` : '-',
        };
    });

    const handleExport = () => {
        const params: any = { fechaInicio, fechaFin };
        if (selectedSedeId) params.sedeId = selectedSedeId;
        exportExcelReportCompras(params);
    };

    return { reports, resumenReporteCompras, fechaInicio, fechaFin, isHoveredExp, setIsHoveredExp, handleDate, handleExport, canFilterSede, sedesOptions, handleSelectSede };
};

const CATEGORIA_GASTO_LABEL: Record<string, string> = {
    PUBLICIDAD: 'Publicidad',
    SUELDOS: 'Sueldos',
    ENVIOS: 'Envíos',
    COMISIONES: 'Comisiones',
    ALQUILER: 'Alquiler',
    OTROS: 'Otros',
    PERSONALIZADA: 'Personalizada',
};

export const useReporteGastosViewModel = () => {
    const { reportGastos, getAllReportGastos, resumenReporteGastos, exportExcelReportGastos } = useAccountingStore();
    const { auth, fechaInicio, fechaFin, isHoveredExp, setIsHoveredExp, handleDate } = useDateFilter();

    useEffect(() => {
        getAllReportGastos({ fechaInicio, fechaFin });
    }, [fechaFin, fechaInicio, auth]);

    const fmt = (v: any) => v != null ? Number(v).toFixed(2) : '0.00';

    const reports = reportGastos?.map((item: any) => ({
        fecha: moment(item?.fecha).utcOffset(-5 * 60).format('DD/MM/YYYY'),
        categoria: CATEGORIA_GASTO_LABEL[item?.categoria] || item?.categoria || '-',
        etiqueta: item?.etiqueta || '-',
        descripcion: item?.descripcion || '-',
        recurrente: item?.recurrenteDiario ? 'Sí' : 'No',
        monto: `S/ ${fmt(item?.monto)}`,
    }));

    const handleExport = () => {
        exportExcelReportGastos({ fechaInicio, fechaFin });
    };

    return { reports, resumenReporteGastos, fechaInicio, fechaFin, isHoveredExp, setIsHoveredExp, handleDate, handleExport };
};
