/**
 * La condición que decide si se ve el botón "Hacer Nota de venta".
 *
 * Tiene test propio porque su versión anterior dejó a un cliente sin la
 * función durante días sin que saltara nada: exigía la orden cobrada, LINNA
 * MODA cobra contraentrega, y sus dos órdenes estaban en PAGO_PARCIAL. El
 * botón no aparecía nunca y ellos lo reportaron como que la opción "no está
 * habilitada".
 */
import { puedeHacerNotaDeVenta } from '../utils/puedeHacerNotaDeVenta';

const OT = { tipoDoc: 'OT', convertidoA: null, saldo: 0, estadoEnvioSunat: null };

describe('cuándo se ofrece hacer la Nota de venta', () => {
    it('una orden vigente, sí', () => {
        expect(puedeHacerNotaDeVenta(OT)).toBe(true);
    });

    it('una orden con saldo pendiente, TAMBIÉN', () => {
        // El caso de LINNA MODA: contraentrega. Las dos órdenes que tienen en
        // el sistema son PAGO_PARCIAL, con saldo de S/ 105 y S/ 205.
        expect(puedeHacerNotaDeVenta({ ...OT, saldo: 105 } as any)).toBe(true);
        expect(puedeHacerNotaDeVenta({ ...OT, saldo: 205 } as any)).toBe(true);
    });

    it('una orden sin ningún pago, también', () => {
        expect(
            puedeHacerNotaDeVenta({ ...OT, saldo: 155, estadoPago: 'PENDIENTE_PAGO' } as any),
        ).toBe(true);
    });
});

describe('cuándo NO', () => {
    it('si no es una Orden de Trabajo', () => {
        // Una nota de venta se formaliza con el otro menú, no con este.
        expect(puedeHacerNotaDeVenta({ ...OT, tipoDoc: 'NV' })).toBe(false);
        expect(puedeHacerNotaDeVenta({ ...OT, tipoDoc: 'COT' })).toBe(false);
    });

    it('si está anulada', () => {
        expect(puedeHacerNotaDeVenta({ ...OT, estadoEnvioSunat: 'ANULADO' })).toBe(false);
        // El estado también puede venir de la fila de la tabla y no del item.
        expect(puedeHacerNotaDeVenta(OT, 'ANULADO')).toBe(false);
    });

    it('si ya se convirtió: una segunda nota duplicaría la venta', () => {
        expect(puedeHacerNotaDeVenta({ ...OT, convertidoA: 'NV01-10' })).toBe(false);
    });

    it('sin item no revienta', () => {
        expect(puedeHacerNotaDeVenta(null)).toBe(false);
        expect(puedeHacerNotaDeVenta(undefined)).toBe(false);
    });
});
