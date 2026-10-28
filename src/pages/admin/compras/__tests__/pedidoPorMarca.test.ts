import { lineasDePedidoMarca, type FilaPedidoMarca } from '../pedidoPorMarca';

const fila = (p: Partial<FilaPedidoMarca>): FilaPedidoMarca => ({
    productoId: 1, descripcion: 'Base Colorfix', variante: null, stock: 0, stockMinimo: 0,
    vendidos: 0, costo: 50, tipoAfectacionIGV: '10', sugerido: 0, ...p,
});

describe('lineasDePedidoMarca', () => {
    it('una línea por producto con cantidad, con el tono en la descripción', () => {
        const filas = [fila({ productoId: 11, variante: 'Tono: 170-N' }), fila({ productoId: 12, variante: 'Tono: 210-F' })];
        expect(lineasDePedidoMarca(filas, { 11: '3', 12: '0' })).toEqual([
            { productoId: 11, descripcion: 'Base Colorfix — Tono: 170-N', cantidad: 3, precioUnitario: 50, gravado: true, unidadesPorPaquete: null },
        ]);
    });

    it('con IGV incluido el costo gravado entra ×1.18 y el exonerado no', () => {
        const filas = [fila({ productoId: 1, costo: 10 }), fila({ productoId: 2, costo: 10, tipoAfectacionIGV: '20' })];
        const l = lineasDePedidoMarca(filas, { 1: '1', 2: '1' }, 1.18);
        expect(l.map((x) => [x.precioUnitario, x.gravado])).toEqual([[11.8, true], [10, false]]);
    });

    it('ignora vacíos, negativos y decimales los trunca', () => {
        const filas = [fila({ productoId: 1 }), fila({ productoId: 2 }), fila({ productoId: 3 })];
        expect(lineasDePedidoMarca(filas, { 1: '', 2: '-4', 3: '2.7' }).map((x) => x.cantidad)).toEqual([2]);
    });
});
