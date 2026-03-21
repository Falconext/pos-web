import { renderHook, act } from '@testing-library/react';
import { useComprasViewModel } from '../useComprasViewModel';
import { useComprasStore } from '@/zustand/compras';

jest.mock('@/zustand/compras', () => ({
    useComprasStore: jest.fn(),
}));

const mockListarCompras = jest.fn();
const mockCompras = [
    {
        id: 1,
        fechaEmision: '2026-01-15',
        fechaVencimiento: '2026-01-30',
        proveedor: { nombre: 'Proveedor SAC', nroDoc: '20123456789' },
        serie: 'F001',
        numero: '000001',
        total: 1000,
        saldo: 500,
        estado: 'REGISTRADO',
        estadoPago: 'PAGO_PARCIAL',
    },
    {
        id: 2,
        fechaEmision: '2026-01-20',
        proveedor: { nombre: 'Distribuidor EIRL', nroDoc: '10987654321' },
        serie: 'F001',
        numero: '000002',
        total: 2000,
        saldo: 0,
        estado: 'REGISTRADO',
        estadoPago: 'COMPLETADO',
    },
];

describe('useComprasViewModel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useComprasStore as unknown as jest.Mock).mockReturnValue({
            listarCompras: mockListarCompras,
            compras: mockCompras,
            totalCompras: 2,
        });
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useComprasViewModel());
        expect(result.current.currentPage).toBe(1);
        expect(result.current.itemsPerPage).toBe(50);
        expect(result.current.filters.estadoPago).toBe('TODOS');
        expect(result.current.filters.search).toBe('');
        expect(result.current.isOpenDetalle).toBe(false);
        expect(result.current.showNuevaCompraModal).toBe(false);
    });

    it('should build tableData with correct formatting', () => {
        const { result } = renderHook(() => useComprasViewModel());
        const table = result.current.tableData;
        expect(table).toHaveLength(2);
        expect(table![0]['Comprobante']).toBe('F001-000001');
        expect(table![0]['Total']).toBe('S/ 1000.00');
        expect(table![0]['Pago']).toBe('PAGO PARCIAL');
        expect(table![1]['Pago']).toBe('PAGADO');
    });

    it('should calculate stats correctly', () => {
        const { result } = renderHook(() => useComprasViewModel());
        // totalPorPagar = 500 + 0 = 500
        expect(result.current.totalPorPagar).toBe(500);
    });

    it('should open and close detalle modal', () => {
        const { result } = renderHook(() => useComprasViewModel());
        act(() => { result.current.actions.openDetalle(1); });
        expect(result.current.isOpenDetalle).toBe(true);
        expect(result.current.selectedCompraId).toBe(1);
        act(() => { result.current.actions.closeDetalle(); });
        expect(result.current.isOpenDetalle).toBe(false);
        expect(result.current.selectedCompraId).toBeNull();
    });

    it('should open and close nueva compra modal', () => {
        const { result } = renderHook(() => useComprasViewModel());
        act(() => { result.current.actions.openNuevaCompra(); });
        expect(result.current.showNuevaCompraModal).toBe(true);
        act(() => { result.current.actions.closeNuevaCompra(); });
        expect(result.current.showNuevaCompraModal).toBe(false);
    });

    it('should update search filter', () => {
        const { result } = renderHook(() => useComprasViewModel());
        act(() => { result.current.actions.setSearch('Proveedor'); });
        expect(result.current.filters.search).toBe('Proveedor');
        expect(result.current.currentPage).toBe(1); // reset on search
    });

    it('should update estadoPago filter', () => {
        const { result } = renderHook(() => useComprasViewModel());
        act(() => { result.current.actions.setEstadoPago('PENDIENTE_PAGO'); });
        expect(result.current.filters.estadoPago).toBe('PENDIENTE_PAGO');
    });

    it('should handle pago modal lifecycle', () => {
        const { result } = renderHook(() => useComprasViewModel());
        const compra = mockCompras[0] as any;
        act(() => { result.current.actions.openPago(compra); });
        expect(result.current.showPaymentModal).toBe(true);
        expect(result.current.selectedCompra).toEqual(compra);
        act(() => { result.current.actions.closePago(); });
        expect(result.current.showPaymentModal).toBe(false);
        expect(result.current.selectedCompra).toBeNull();
    });

    it('should update pagination', () => {
        const { result } = renderHook(() => useComprasViewModel());
        act(() => { result.current.actions.setcurrentPage(2); });
        expect(result.current.currentPage).toBe(2);
        act(() => { result.current.actions.setitemsPerPage(25); });
        expect(result.current.itemsPerPage).toBe(25);
    });
});
