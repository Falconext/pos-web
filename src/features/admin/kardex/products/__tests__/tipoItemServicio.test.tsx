/**
 * El selector "Tipo de ítem" tiene que estar en TODOS los rubros.
 *
 * Reportado por un negocio de ropa/calzado: quería cobrar el delivery dentro de
 * la venta, creó un producto y le quedaba stock 0, así que el POS no lo dejaba
 * venderlo. Probó cambiando la unidad de medida a "servicio" y no pasó nada
 * —ese código solo viaja al XML de SUNAT—. Lo que manda es
 * `atributosTecnicos.tipoProducto`, y el único control que lo escribe estaba
 * escondido detrás de la ficha técnica de cómputo.
 *
 * Lo que se prueba acá es el componente real, no una copia de la regla.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductBasicForm } from '../components/ProductBasicForm';

// Los hijos pesados no son el objeto de esta prueba; se reemplazan por marcas
// visibles para poder afirmar si la sección de inventario se muestra o no.
jest.mock('../components/ProductStockManager', () => ({
    ProductStockManager: () => <div data-testid="stock-manager">inventario</div>,
}));
jest.mock('../components/ProductSedesDisponibles', () => ({
    ProductSedesDisponibles: () => null,
}));
jest.mock('../components/ProductVariantsManager', () => ({
    ProductVariantsManager: () => <div data-testid="variantes">variantes</div>,
}));
jest.mock('../components/ProductFinancialAnalysis', () => ({
    ProductFinancialAnalysis: () => null,
}));
jest.mock('../components/ProductPriceListsPanel', () => ({
    __esModule: true, default: () => null,
}));
jest.mock('../components/ModalEtiquetasBarras', () => ({
    __esModule: true, default: () => null,
}));
jest.mock('@/components/BarcodeScannerInput', () => ({
    BarcodeScannerInput: () => null,
}));
jest.mock('@iconify/react', () => ({ Icon: () => null }));
jest.mock('@iconify/react/dist/iconify.js', () => ({ Icon: () => null }), { virtual: true });
jest.mock('@/utils/apiClient', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
jest.mock('@/services/tipoCambio.service', () => ({ tipoCambioService: { obtener: jest.fn() } }));
jest.mock('@/zustand/alert', () => ({ __esModule: true, default: () => ({ alert: jest.fn() }) }));
jest.mock('@/zustand/auth', () => ({
    useAuthStore: (sel: any) => sel({ auth: { rol: 'ADMIN_EMPRESA', ocultarPrecioCosto: false } }),
}));

/** Las secciones que el ViewModel enciende para un rubro de ropa/calzado. */
const seccionesDeModa = {
    fichaComputo: false,      // ← el rubro NO es cómputo ni motos
    seriesGarantia: false,
    inventario: true,
    lotes: false,
    farmacia: false,
    localizacion: false,
};

const vmBase = (overrides: any = {}) => ({
    isFarmacia: false, esDrogueria: false, esFarmaceutico: false,
    isFabricacion: false, isRestaurante: false, isMobile: false, isEdit: false,
    isModaRubro: true,
    features: { usaVariantes: true },
    productSections: seccionesDeModa,
    labels: {},
    formValues: {
        nombre: 'DELIVERY', descripcion: '', categoriaId: 0, marcaId: 0,
        unidadMedidaId: 1, stock: 0, stockMinimo: 0, stockMaximo: 0,
        precioUnitario: 5, costo: 0, atributosTecnicos: {},
    },
    errors: {},
    unitOfMeasure: [{ id: 1, codigo: 'NIU', nombre: 'UNIDAD' }],
    categories: [], brands: [], gruposModificadores: [], gruposSeleccionados: [],
    isCategorizing: false, tieneGestionProvisiones: false, tieneTienda: false,
    tieneGestionLotes: false, generandoCodigoBarras: false,
    handleChange: jest.fn(), handleChangeSelect: jest.fn(),
    handleAutoCategorize: jest.fn(), handlePrecioUnitarioBlur: jest.fn(),
    setShowMedicamentoModal: jest.fn(), setShowLotesModal: jest.fn(),
    toggleGrupoSeleccionado: jest.fn(), setFormValues: jest.fn(),
    addCategory: jest.fn(), addBrand: jest.fn(), generarCodigoBarras: jest.fn(),
    ...overrides,
});

describe('Tipo de ítem en un rubro que no es cómputo', () => {
    it('EL DEFECTO: en ropa/calzado el selector tiene que aparecer igual', () => {
        render(<ProductBasicForm vm={vmBase() as any} />);
        expect(screen.getByText('Tipo de ítem')).toBeInTheDocument();
        expect(screen.getByText('Servicio')).toBeInTheDocument();
    });

    it('al elegir Servicio se guarda tipoProducto y el stock queda en cero', () => {
        const setFormValues = jest.fn();
        render(<ProductBasicForm vm={vmBase({ setFormValues }) as any} />);

        fireEvent.click(screen.getByText('Servicio'));

        expect(setFormValues).toHaveBeenCalledTimes(1);
        const guardado = setFormValues.mock.calls[0][0];
        expect(guardado.atributosTecnicos.tipoProducto).toBe('SERVICIO');
        expect(guardado.stock).toBe(0);
        expect(guardado.stockMinimo).toBe(0);
        expect(guardado.stockMaximo).toBe(0);
    });

    it('volver a Producto físico borra la marca de servicio', () => {
        const setFormValues = jest.fn();
        const vm = vmBase({ setFormValues });
        vm.formValues.atributosTecnicos = { tipoProducto: 'SERVICIO' };
        render(<ProductBasicForm vm={vm as any} />);

        fireEvent.click(screen.getByText('Producto físico'));

        const guardado = setFormValues.mock.calls[0][0];
        expect(guardado.atributosTecnicos.tipoProducto).toBeUndefined();
    });
});

describe('Un servicio no pide stock', () => {
    it('siendo producto físico sí se muestra la gestión de inventario', () => {
        render(<ProductBasicForm vm={vmBase() as any} />);
        expect(screen.queryByTestId('stock-manager')).toBeInTheDocument();
    });

    it('siendo servicio NO se muestra la gestión de inventario', () => {
        // Es el reclamo textual: "no le pide el stock y lo que no debería".
        const vm = vmBase();
        vm.formValues.atributosTecnicos = { tipoProducto: 'SERVICIO' };
        render(<ProductBasicForm vm={vm as any} />);
        expect(screen.queryByTestId('stock-manager')).not.toBeInTheDocument();
    });

    it('siendo servicio tampoco se ofrece la gestión de lotes', () => {
        const vm = vmBase({ productSections: { ...seccionesDeModa, lotes: true } });
        vm.formValues.atributosTecnicos = { tipoProducto: 'SERVICIO' };
        render(<ProductBasicForm vm={vm as any} />);
        expect(screen.queryByText('Gestión de Lotes')).not.toBeInTheDocument();
    });
});

describe('No se arrastra la ficha técnica de cómputo', () => {
    it('el rubro de ropa ve el Tipo de ítem pero NO la ficha técnica', () => {
        // Es la condición que puso el usuario: el selector sí, la ficha no.
        render(<ProductBasicForm vm={vmBase() as any} />);
        expect(screen.getByText('Tipo de ítem')).toBeInTheDocument();
        expect(screen.queryByText('Ficha técnica')).not.toBeInTheDocument();
    });

    it('en cómputo sigue apareciendo el selector, como antes', () => {
        const vm = vmBase({
            isModaRubro: false,
            productSections: { ...seccionesDeModa, fichaComputo: true },
        });
        render(<ProductBasicForm vm={vm as any} />);
        expect(screen.getByText('Tipo de ítem')).toBeInTheDocument();
    });
});
