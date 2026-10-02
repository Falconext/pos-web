/**
 * Por qué se ajusta el stock a mano.
 *
 * Pedido de DEMENVER: el inventario dejaba quitar nueve audífonos pero no decir
 * por qué. En el kardex todo salía como "Ajuste manual de stock desde
 * inventario (-9)" y lo único guardado era quién lo hizo; cuando después
 * preguntaban por qué faltaban, no había respuesta en ningún lado.
 */
import * as fs from 'fs';
import * as path from 'path';
import {
    MOTIVOS_INGRESO,
    MOTIVOS_SALIDA,
    conceptoDelAjuste,
    etiquetaDeMotivo,
    faltaMotivo,
    motivosPara,
} from '../motivoAjusteStock';

describe('Se ofrecen los motivos que corresponden', () => {
    it('al quitar stock, los de salida', () => {
        const codigos = motivosPara('restar').map((m) => m.codigo);
        expect(codigos).toContain('MERMA');
        expect(codigos).toContain('PERDIDA');
        expect(codigos).toContain('CONSUMO_INTERNO');
    });

    it('al agregar stock, los de ingreso', () => {
        // El caso que contó DEMENVER: encontraron una unidad de más en la caja.
        const codigos = motivosPara('sumar').map((m) => m.codigo);
        expect(codigos).toContain('ENCONTRADO');
        expect(codigos).toContain('DEVOLUCION_CLIENTE');
        expect(codigos).not.toContain('MERMA');
    });

    it('sin ajuste no se pide motivo', () => {
        expect(motivosPara('ninguno')).toEqual([]);
    });

    it('todos los motivos tienen código y etiqueta legible', () => {
        for (const m of [...MOTIVOS_SALIDA, ...MOTIVOS_INGRESO]) {
            expect(m.codigo).toMatch(/^[A-Z_]+$/);
            expect(m.etiqueta.length).toBeGreaterThan(3);
        }
    });
});

describe('No se guarda un ajuste sin explicación', () => {
    it('falta el motivo si no se eligió ninguno', () => {
        expect(faltaMotivo({ tipo: 'restar', motivo: '' })).toBe(true);
        expect(faltaMotivo({ tipo: 'restar', motivo: null })).toBe(true);
    });

    it('con un motivo elegido alcanza', () => {
        expect(faltaMotivo({ tipo: 'restar', motivo: 'MERMA' })).toBe(false);
    });

    it('"Otro" sin explicación no vale', () => {
        // "Otro motivo" a secas no explica nada: es volver al problema.
        expect(faltaMotivo({ tipo: 'restar', motivo: 'OTRO' })).toBe(true);
        expect(faltaMotivo({ tipo: 'restar', motivo: 'OTRO', detalle: '  ' })).toBe(true);
        expect(faltaMotivo({ tipo: 'restar', motivo: 'OTRO', detalle: 'se cayó de la repisa' })).toBe(false);
    });

    it('si no hay ajuste, no se pide nada', () => {
        expect(faltaMotivo({ tipo: 'ninguno' })).toBe(false);
    });
});

describe('Lo que queda escrito en el kardex', () => {
    it('el motivo va adelante: es lo único que se ve en la lista', () => {
        expect(conceptoDelAjuste({ tipo: 'restar', motivo: 'MERMA', cantidad: 9 }))
            .toBe('Merma (producto roto o dañado) · Ajuste de inventario (-9)');
    });

    it('un ingreso lleva signo +', () => {
        expect(conceptoDelAjuste({ tipo: 'sumar', motivo: 'ENCONTRADO', cantidad: 1 }))
            .toContain('(+1)');
    });

    it('sin motivo no queda un separador colgando', () => {
        expect(conceptoDelAjuste({ tipo: 'restar', cantidad: 2 }))
            .toBe('Ajuste de inventario (-2)');
    });
});

describe('Front y backend hablan el mismo idioma', () => {
    /**
     * Si el POS ofrece un motivo que el backend no conoce, el kardex guardaría
     * el código crudo ("MERMA") en vez de la frase. Esta prueba lo impide.
     */
    it('cada motivo del POS existe en la tabla del backend', () => {
        // __tests__ → products → kardex → admin → features → src → frontend →
        // la raíz del proyecto, donde vive `backend/`.
        const tabla = path.join(
            __dirname, '..', '..', '..', '..', '..', '..', '..',
            'backend', 'src', 'producto', 'motivo-ajuste-stock.ts',
        );
        if (!fs.existsSync(tabla)) {
            throw new Error(`No encontré la tabla del backend en ${tabla}. ` +
                'Si este repo no tiene el backend al lado, ajusta la ruta.');
        }
        const backend = fs.readFileSync(tabla, 'utf-8');
        for (const m of [...MOTIVOS_SALIDA, ...MOTIVOS_INGRESO]) {
            expect(backend).toContain(`${m.codigo}:`);
        }
    });
});

describe('Traducir un código suelto', () => {
    it('devuelve la etiqueta', () => {
        expect(etiquetaDeMotivo('VENCIDO')).toBe('Vencido o en mal estado');
    });

    it('un código desconocido se muestra tal cual', () => {
        expect(etiquetaDeMotivo('XYZ')).toBe('XYZ');
    });

    it('sin código, texto vacío', () => {
        expect(etiquetaDeMotivo(null)).toBe('');
    });
});
