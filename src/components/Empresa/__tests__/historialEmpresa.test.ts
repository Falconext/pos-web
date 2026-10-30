import { detalleDelLog } from '../historialEmpresa';

describe('detalleDelLog', () => {
    it('traduce las series SUNAT a nombres legibles', () => {
        const detalle = JSON.stringify([
            { tipoDoc: '01', serie: 'F0A1', correlativo: 1, activo: true },
            { tipoDoc: '07:03', serie: 'BCA1', correlativo: 1, activo: false },
        ]);
        expect(detalleDelLog('SERIES_SUNAT_ACTUALIZADAS', detalle)).toEqual({
            tipo: 'series',
            series: [
                { texto: 'Factura F0A1', activo: true },
                { texto: 'NC boleta BCA1', activo: false },
            ],
        });
    });

    it('si el detalle no es JSON de series lo deja como texto', () => {
        expect(detalleDelLog('SERIES_SUNAT_ACTUALIZADAS', 'a mano')).toEqual({ tipo: 'texto', texto: 'a mano' });
        expect(detalleDelLog('CREADA', 'Plan X')).toEqual({ tipo: 'texto', texto: 'Plan X' });
        expect(detalleDelLog('CREADA', null)).toBeNull();
    });
});
