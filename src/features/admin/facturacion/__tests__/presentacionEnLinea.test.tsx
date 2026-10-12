/**
 * Cambiar la presentación de una línea ya agregada al carrito.
 *
 * Pedido de un cliente que mostró cómo lo hace otro sistema: en la línea de
 * venta, un desplegable UNIDAD / PACK / CAJA que al cambiar ajusta el precio y
 * el stock. Antes había que borrar la línea y volver a agregar el producto
 * desde la tarjeta correcta del catálogo.
 *
 * Lo que de verdad hay que proteger acá son dos cuentas:
 *
 *  1. El precio de un paquete NO es unidades × precio unitario. Un six-pack
 *     puede costar S/ 45 cuando la unidad vale S/ 6 (6×6 = 36). Si la línea
 *     derivara el precio, el negocio regalaría S/ 9 por pack.
 *  2. La cantidad se conserva EN PRESENTACIONES: 1 caja pasa a ser 1 unidad,
 *     no 12. Es lo que espera quien está mirando "1" en la pantalla.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@iconify/react', () => ({ Icon: () => null }));
const alertMock = jest.fn();
jest.mock('@/zustand/alert', () => ({
    __esModule: true,
    default: Object.assign(() => ({ alert: alertMock }), { getState: () => ({ alert: alertMock }) }),
}));

import { POSCartLayout } from '../components/POSCartLayout';

// Cerveza: unidad S/ 6, six-pack S/ 45 (no 36), caja de 12 S/ 84.
const PRODUCTO = {
    id: 84,
    descripcion: 'CERVEZA PILSEN BT 630 ML',
    precioUnitario: 6,
    paquetes: [
        { codigo: 'SP-84', alias: 'SIX PACK', unidadesPorPaquete: 6, precioPaquete: 45 },
        { codigo: 'CJ-84', alias: 'CAJA', unidadesPorPaquete: 12, precioPaquete: 84 },
    ],
};

const linea = (over: any = {}) => ({
    id: 84,
    descripcion: 'CERVEZA PILSEN BT 630 ML',
    cantidad: 1,
    precioUnitario: 6,
    total: '6.00',
    stock: 54,
    ...over,
});

const montarVm = (over: any = {}) => ({
    products: [PRODUCTO],
    productsInvoice: [linea()],
    monedaSimbolo: 'S/',
    permitirVentaSinStock: false,
    avisarSobreventa: false,
    updateProductInvoice: jest.fn(),
    handleDeleteProductByIndex: jest.fn(),
    // El real recalcula totales; acá solo interesa la cantidad que recibe.
    calculateLineItem: (item: any, cantidad: number) => ({
        cantidad,
        precioUnitario: item.precioUnitario,
        total: (Number(item.precioUnitario) * cantidad).toFixed(2),
    }),
    ...over,
});

const montar = (vm: any) => {
    render(<POSCartLayout vm={vm} />);
    return screen.getByTestId('presentacion-0') as HTMLSelectElement;
};

describe('selector de presentación en la línea', () => {
    beforeEach(() => alertMock.mockClear());

    it('ofrece la unidad suelta y cada paquete configurado', () => {
        const select = montar(montarVm());
        const opciones = Array.from(select.options).map((o) => o.textContent);
        expect(opciones).toEqual(['UNIDAD', 'SIX PACK', 'CAJA']);
    });

    it('al pasar a six-pack cobra el precio del pack, no unidades × unitario', () => {
        const vm = montarVm();
        fireEvent.change(montar(vm), { target: { value: 'SP-84' } });

        const [, actualizado] = vm.updateProductInvoice.mock.calls[0];
        // 45 / 6 = 7.50 por unidad. Si derivara de la unidad daría 6.00 y el
        // pack se vendería a 36.
        expect(Number(actualizado.precioUnitario)).toBeCloseTo(7.5, 4);
        expect(actualizado.esPaquete).toBe(true);
        expect(actualizado.unidadesPorPaquete).toBe(6);
    });

    it('conserva la cantidad en presentaciones: 1 six-pack son 6 unidades', () => {
        const vm = montarVm();
        fireEvent.change(montar(vm), { target: { value: 'SP-84' } });
        expect(vm.updateProductInvoice.mock.calls[0][1].cantidad).toBe(6);
    });

    it('de caja a unidad vuelve a 1, no a 12', () => {
        const vm = montarVm({
            productsInvoice: [linea({ cantidad: 12, esPaquete: true, unidadesPorPaquete: 12, precioUnitario: 7 })],
        });
        fireEvent.change(montar(vm), { target: { value: '' } });

        const [, actualizado] = vm.updateProductInvoice.mock.calls[0];
        expect(actualizado.cantidad).toBe(1);
        expect(Number(actualizado.precioUnitario)).toBeCloseTo(6, 4);
        expect(actualizado.esPaquete).toBe(false);
    });

    it('la línea del paquete toma el nombre del paquete', () => {
        const vm = montarVm();
        fireEvent.change(montar(vm), { target: { value: 'CJ-84' } });
        expect(vm.updateProductInvoice.mock.calls[0][1].descripcion).toBe('CAJA');
    });

    it('al volver a la unidad recupera el nombre del producto', () => {
        const vm = montarVm({
            productsInvoice: [linea({
                cantidad: 12,
                esPaquete: true,
                unidadesPorPaquete: 12,
                descripcion: 'CAJA',
                descripcionBase: 'CERVEZA PILSEN BT 630 ML',
            })],
        });
        fireEvent.change(montar(vm), { target: { value: '' } });
        expect(vm.updateProductInvoice.mock.calls[0][1].descripcion).toBe('CERVEZA PILSEN BT 630 ML');
    });

    it('no deja pasar a una presentación que no alcanza el stock', () => {
        // 5 cajas = 60 unidades y solo hay 54.
        const vm = montarVm({ productsInvoice: [linea({ cantidad: 5, stock: 54 })] });
        fireEvent.change(montar(vm), { target: { value: 'CJ-84' } });

        expect(vm.updateProductInvoice).not.toHaveBeenCalled();
        expect(alertMock).toHaveBeenCalledWith(expect.stringMatching(/solo hay 54/i), 'warning');
    });

    it('con sobreventa habilitada sí deja', () => {
        const vm = montarVm({
            productsInvoice: [linea({ cantidad: 5, stock: 54 })],
            permitirVentaSinStock: true,
        });
        fireEvent.change(montar(vm), { target: { value: 'CJ-84' } });
        expect(vm.updateProductInvoice).toHaveBeenCalled();
    });

    it('un producto sin paquetes no muestra desplegable', () => {
        const vm = montarVm({ products: [{ ...PRODUCTO, paquetes: [] }] });
        render(<POSCartLayout vm={vm} />);
        expect(screen.queryByTestId('presentacion-0')).toBeNull();
    });
});
