import { useState } from 'react';
import moment from 'moment';
import { useComprasStore, ICompra } from '@/zustand/compras';
import { useDebounce } from '@/hooks/useDebounce';
import {
    INITIAL_COMPRAS_STATE,
    VISIBLE_COMPRAS_COLUMNS,
    ESTADO_PAGO_OPTIONS,
    IComprasViewModelState,
} from './ComprasModel';

export const useComprasViewModel = () => {
    const { listarCompras, compras, totalCompras } = useComprasStore();
    const [state, setState] = useState<IComprasViewModelState>(INITIAL_COMPRAS_STATE);

    const debounce = useDebounce(state.filters.search, 600);

    // Pagination
    const indexOfLastItem = state.currentPage * state.itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - state.itemsPerPage;
    const pages = Array.from(
        { length: Math.ceil((totalCompras || 0) / state.itemsPerPage) },
        (_, i) => i + 1
    );

    // Helpers
    const calcularDiasVencidos = (fechaVencimiento: string | undefined, fechaEmision: string) => {
        const targetDate = fechaVencimiento ? moment(fechaVencimiento) : moment(fechaEmision);
        return moment().diff(targetDate, 'days');
    };

    const buildParams = () => {
        const { filters } = state;
        const params: any = {
            page: state.currentPage,
            limit: state.itemsPerPage,
            search: debounce,
            estadoPago: filters.estadoPago === 'TODOS' ? undefined : filters.estadoPago,
        };
        if (filters.fechaInicio) params.fechaInicio = filters.fechaInicio;
        if (filters.fechaFin) params.fechaFin = filters.fechaFin;
        if (filters.sedeId) params.sedeId = filters.sedeId;
        return params;
    };

    const refresh = () => listarCompras(buildParams());

    // Table data
    const tableData = compras?.map((item: ICompra) => {
        const diasVencidos = calcularDiasVencidos(item.fechaVencimiento, item.fechaEmision);
        let estadoLabel = 'PENDIENTE';
        switch (item.estadoPago) {
            case 'PAGO_PARCIAL': estadoLabel = 'PAGO PARCIAL'; break;
            case 'PENDIENTE_PAGO': estadoLabel = 'PENDIENTE DE PAGO'; break;
            case 'COMPLETADO': estadoLabel = 'PAGADO'; break;
            default: estadoLabel = item.estadoPago;
        }
        return {
            id: item.id,
            'Fecha': moment(item.fechaEmision).format('DD/MM/YYYY'),
            'Proveedor': item.proveedor?.nombre || item.proveedor?.nroDoc || 'Sin nombre',
            'Comprobante': `${item.serie}-${item.numero}`,
            'Total': `S/ ${Number(item.total).toFixed(2)}`,
            'Saldo': `S/ ${Number(item.saldo || 0).toFixed(2)}`,
            'Días Venc.': diasVencidos > 0 ? diasVencidos : 0,
            'Estado': item.estado,
            'Pago': estadoLabel,
            _raw: item,
        };
    });

    // Stats derived from current page
    const totalPorPagar = compras?.reduce((sum: number, item: any) => sum + Number(item.saldo || 0), 0) || 0;
    const totalVencidos = compras?.filter((item: any) => calcularDiasVencidos(item.fechaVencimiento, item.fechaEmision) > 0).length || 0;

    // Actions
    const actions = {
        // Filters
        setSearch: (value: string) =>
            setState(prev => ({ ...prev, currentPage: 1, filters: { ...prev.filters, search: value } })),
        setEstadoPago: (value: string) =>
            setState(prev => ({ ...prev, currentPage: 1, filters: { ...prev.filters, estadoPago: value } })),
        setSedeId: (id: number | null) =>
            setState(prev => ({ ...prev, currentPage: 1, filters: { ...prev.filters, sedeId: id } })),
        handleDate: (date: string, name: string) => {
            if (!moment(date, 'DD/MM/YYYY', true).isValid()) return;
            const formatted = moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD');
            setState(prev => ({
                ...prev,
                currentPage: 1,
                filters: { ...prev.filters, [name]: formatted },
            }));
        },
        // Pagination
        setcurrentPage: (page: number) => setState(prev => ({ ...prev, currentPage: page })),
        setitemsPerPage: (items: number) => setState(prev => ({ ...prev, itemsPerPage: items })),
        // Modal: Detalle
        openDetalle: (id: number) => setState(prev => ({ ...prev, isOpenDetalle: true, selectedCompraId: id })),
        closeDetalle: () => setState(prev => ({ ...prev, isOpenDetalle: false, selectedCompraId: null })),
        // Modal: Pago
        openPago: (compra: ICompra) => setState(prev => ({ ...prev, selectedCompra: compra, showPaymentModal: true })),
        closePago: () => setState(prev => ({ ...prev, showPaymentModal: false, selectedCompra: null })),
        handlePaymentSuccess: () => {
            setState(prev => ({ ...prev, showPaymentModal: false, selectedCompra: null }));
            refresh();
        },
        // Modal: Historial
        openHistorial: (compra: ICompra) => setState(prev => ({ ...prev, selectedCompra: compra, showHistorialModal: true })),
        closeHistorial: () => setState(prev => ({ ...prev, showHistorialModal: false, selectedCompra: null })),
        // Modal: Nueva Compra
        openNuevaCompra: () => setState(prev => ({ ...prev, showNuevaCompraModal: true })),
        closeNuevaCompra: () => setState(prev => ({ ...prev, showNuevaCompraModal: false })),
        handleNuevaCompraSuccess: () => {
            setState(prev => ({ ...prev, showNuevaCompraModal: false }));
        },
        // Refresh
        refresh,
        listarCompras,
        buildParams,
    };

    return {
        ...state,
        compras,
        totalCompras,
        tableData,
        totalPorPagar,
        totalVencidos,
        debounce,
        indexOfLastItem,
        indexOfFirstItem,
        pages,
        actions,
        VISIBLE_COMPRAS_COLUMNS,
        ESTADO_PAGO_OPTIONS,
    };
};
