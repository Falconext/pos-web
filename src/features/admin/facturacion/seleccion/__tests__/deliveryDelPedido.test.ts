/**
 * El delivery de un pedido del chat no se factura (2026-10-22): el panel
 * muestra al convertir el mismo total que va a salir en la boleta.
 */
import { notaParaFacturar } from '../deliveryDelPedido';
import { notaDeVentaDataConjunta } from '../facturarJuntas';
import { notaElegidaDe } from '../seleccionNotas';

const linea = (descripcion: string, precio: number, productoId: number | null) => ({
    productoId,
    descripcion,
    cantidad: 1,
    unidad: productoId ? 'NIU' : 'ZZ',
    mtoPrecioUnitario: precio,
    mtoValorVenta: Math.round((precio / 1.18) * 100) / 100,
    igv: Math.round((precio - precio / 1.18) * 100) / 100,
});

const nota = (o: Record<string, any> = {}) => ({
    id: 10,
    serie: 'NV01',
    correlativo: 8,
    tipoDoc: 'NV',
    clienteId: 7,
    cliente: { id: 7, nombre: 'Diego', nroDoc: '47065472' },
    fechaEmision: '2026-10-22',
    tipoMoneda: 'PEN',
    mtoImpVenta: 46,
    saldo: 0,
    estadoPago: 'COMPLETADO',
    observaciones: 'Entregar por la tarde',
    pedidoDelChat: true,
    detalles: [linea('Moringa 90 cápsulas', 31, 1), linea('ENVÍO DELIVERY', 15, null)],
    ...o,
});

describe('convertir una nota del chat', () => {
    it('saca el delivery del total y lo deja en observaciones', () => {
        const n = notaParaFacturar(nota());
        expect(n.detalles.map((d: any) => d.descripcion)).toEqual(['Moringa 90 cápsulas']);
        expect(n.mtoImpVenta).toBe(31);
        expect(n.saldo).toBe(0);
        expect(n.observaciones).toBe(
            'Entregar por la tarde\nENVÍO DELIVERY: S/ 15.00 (servicio de delivery, se cobra aparte y no forma parte del total)',
        );
    });

    it('lo cobrado va primero a la mercadería: pagó 20 de 46, a la boleta le quedan 11', () => {
        const n = notaParaFacturar(nota({ saldo: 26, estadoPago: 'PAGO_PARCIAL' }));
        expect(n.mtoImpVenta).toBe(31);
        expect(n.saldo).toBe(11);
        expect(n.estadoPago).toBe('PAGO_PARCIAL');
    });

    it('una nota hecha a mano con "ENVÍO" queda igual', () => {
        const original = nota({ pedidoDelChat: false });
        expect(notaParaFacturar(original)).toBe(original);
    });

    it('al facturar varias juntas, el total y las líneas tampoco llevan el delivery', () => {
        const otra = nota({ id: 11, correlativo: 9, pedidoDelChat: false, mtoImpVenta: 31, detalles: [linea('Moringa 90 cápsulas', 31, 1)] });
        const datos = notaDeVentaDataConjunta([notaElegidaDe(nota()), notaElegidaDe(otra)]);
        expect(datos.mtoImpVenta).toBe(62);
        expect(datos.productos.some((p: any) => /ENV[IÍ]O/.test(p.descripcion))).toBe(false);
        expect(datos.observaciones).toContain('ENVÍO DELIVERY: S/ 15.00');
    });
});
