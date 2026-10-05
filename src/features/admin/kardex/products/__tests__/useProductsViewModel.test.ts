import { renderHook as renderHookSinRouter, act, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { useProductsViewModel } from '../useProductsViewModel';
import { get as apiGet } from '@/utils/fetch';
import { useProductsStore } from '@/zustand/products';
import { useBrandsStore } from '@/zustand/brands';
import { useAuthStore } from '@/zustand/auth';
import useAlertStore from '@/zustand/alert';

// Mock dependencies
jest.mock('@/zustand/products', () => ({
    useProductsStore: jest.fn(),
}));
jest.mock('@/zustand/brands', () => ({
    useBrandsStore: jest.fn(),
}));
jest.mock('@/zustand/auth', () => ({
    useAuthStore: jest.fn(),
}));
jest.mock('@/zustand/alert', () => {
    // Se usa como hook (useAlertStore()) y como objeto desde otros stores
    // (useAlertStore.setState / .getState). Si falta setState, el store de
    // categorías revienta dentro del efecto y se lleva puesta la prueba.
    const alertar = jest.fn();
    const store: any = jest.fn(() => ({ success: false, loading: false, alert: alertar }));
    store.setState = jest.fn();
    store.getState = jest.fn(() => ({ alert: alertar, loading: false }));
    return { __esModule: true, default: store };
});
jest.mock('@/hooks/useDebounce', () => ({
    useDebounce: (value: any) => value,
}));
// Mock apiClient if needed, but VM uses store actions mostly.
jest.mock('@/utils/apiClient', () => ({
    __esModule: true,
    default: { get: jest.fn().mockResolvedValue({ data: {} }), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
}));
// El listado ya no sale del store: el hook pide `productos?...` por utils/fetch
// y guarda el resultado en su propio estado.
jest.mock('@/utils/fetch', () => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    del: jest.fn(),
}));

/**
 * El hook guarda la búsqueda y la página en la URL (useSearchParams), así que
 * necesita un Router alrededor: sin él react-router corta antes de ejecutar
 * nada del hook y las seis pruebas fallaban por el entorno, no por el código.
 */
const renderHook: typeof renderHookSinRouter = ((cb: any, options: any = {}) =>
    renderHookSinRouter(cb, {
        ...options,
        wrapper: ({ children }: { children: ReactNode }) =>
            createElement(MemoryRouter, null, children),
    })) as any;

describe('useProductsViewModel', () => {
    const mockGetAllProducts = jest.fn();
    const mockGetAllBrands = jest.fn();
    const mockAlert = jest.fn();

    /**
     * Última URL del LISTADO. El hook también pide `productos/resumen`, así que
     * mirar la última llamada a secas traía la del resumen y no la que importa.
     */
    const ultimaConsulta = () => {
        const urls = (apiGet as jest.Mock).mock.calls
            .map((c) => String(c[0]))
            .filter((u) => /^productos\?/.test(u));
        return urls.length ? urls[urls.length - 1] : '';
    };

    const responderListado = (productos: any[] = [], total = productos.length) =>
        (apiGet as jest.Mock).mockResolvedValue({ code: 1, data: { productos, total } });

    beforeEach(() => {
        jest.clearAllMocks();
        responderListado([]);

        (useProductsStore as unknown as jest.Mock).mockReturnValue({
            getAllProducts: mockGetAllProducts,
            totalProducts: 10,
            products: [],
            toggleStateProduct: jest.fn(),
            exportProducts: jest.fn(),
            importProducts: jest.fn(),
            deleteProduct: jest.fn(),
            deleteAllProducts: jest.fn(),
            setProductImage: jest.fn(),
        });

        (useBrandsStore as unknown as jest.Mock).mockReturnValue({
            brands: [],
            getAllBrands: mockGetAllBrands,
        });

        (useAuthStore as unknown as jest.Mock).mockReturnValue({
            auth: { empresaId: 1, empresa: { rubro: { nombre: 'General' } } },
        });

        (useAlertStore as unknown as jest.Mock).mockReturnValue({
            success: false,
            loading: false,
            alert: mockAlert,
        });

        // Mock getState for non-hook usage
        (useAlertStore as any).getState = () => ({ alert: mockAlert });
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useProductsViewModel());

        expect(result.current.currentPage).toBe(1);
        expect(result.current.itemsPerPage).toBe(50);
        expect(result.current.searchClient).toBe('');
        expect(result.current.isOpenModal).toBe(false);
    });

    it('should fetch products on mount', async () => {
        renderHook(() => useProductsViewModel());
        await waitFor(() => expect(ultimaConsulta()).not.toBe(''));
        expect(ultimaConsulta()).toContain('page=1');
        expect(ultimaConsulta()).toContain('limit=50');
        expect(ultimaConsulta()).toMatch(/^productos\?/);
    });

    it('should update search and fetch products', async () => {
        const { result } = renderHook(() => useProductsViewModel());
        await waitFor(() => expect(ultimaConsulta()).not.toBe(''));

        act(() => {
            result.current.actions.setSearchClient({ target: { value: 'test' } });
        });

        expect(result.current.searchClient).toBe('test');
        // useDebounce está mockeado al paso, así que el efecto dispara ya.
        await waitFor(() => expect(ultimaConsulta()).toContain('search=test'));
    });

    it('should handle pagination', async () => {
        const { result } = renderHook(() => useProductsViewModel());
        await waitFor(() => expect(ultimaConsulta()).not.toBe(''));

        act(() => {
            result.current.actions.setcurrentPage(2);
        });

        expect(result.current.currentPage).toBe(2);
        await waitFor(() => expect(ultimaConsulta()).toContain('page=2'));
    });

    it('should open modal for new product', () => {
        const { result } = renderHook(() => useProductsViewModel());

        act(() => {
            result.current.actions.setIsOpenModal(true);
        });

        expect(result.current.isOpenModal).toBe(true);
    });

    it('should load product data for editing', async () => {
        const mockProduct = { id: 123, descripcion: 'Test Product', precioUnitario: '10.00' };
        // El producto tiene que estar en la lista que el hook ya cargó: es de
        // ahí de donde handleGetProduct lo saca para llenar el formulario.
        responderListado([mockProduct], 1);

        const { result } = renderHook(() => useProductsViewModel());
        await waitFor(() => expect(result.current.products).toHaveLength(1));

        await act(async () => {
            await result.current.actions.handleGetProduct({ productoId: 123 });
        });

        expect(result.current.isOpenModal).toBe(true);
        expect(result.current.isEdit).toBe(true);
        expect(result.current.formValues.descripcion).toBe('Test Product');
    });
});
