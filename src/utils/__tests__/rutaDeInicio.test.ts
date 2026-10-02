/**
 * A dónde cae el usuario al entrar al panel.
 *
 * Pedido: una empresa cuyo plan tiene SOLO el módulo de Contabilidad debe
 * aterrizar en el Reporte de contabilidad. Caía en Arqueo de caja.
 *
 * La causa no era el mapa de rutas sino un choque de alias: 'reportes' y
 * 'contabilidad' son el mismo módulo con dos nombres, 'reportes' va primero en
 * la lista de módulos, y apuntaba a otra pantalla.
 */
import { getAvailableModules, getRedirectPath, hasPermission } from '../permissions';

/** Un usuario cuyo plan tiene exactamente estos módulos. */
const conPlan = (...codigos: string[]) => ({
    rol: 'ADMIN_EMPRESA' as const,
    permisos: ['*'],
    empresa: { plan: { modulosAsignados: codigos.map((codigo) => ({ modulo: { codigo } })) } },
});

const INICIO = '/administrador';
const REPORTE = '/administrador/contabilidad/reporte';

describe('Plan con SOLO Contabilidad', () => {
    const usuario = conPlan('contabilidad');

    it('EL DEFECTO: aterriza en el Reporte, no en Arqueo', () => {
        expect(getRedirectPath(usuario, INICIO)).toBe(REPORTE);
    });

    it('no tiene dashboard, que es lo que dispara la redirección', () => {
        // AdminLayout solo redirige cuando falta el módulo dashboard.
        expect(hasPermission(usuario, 'dashboard')).toBe(false);
    });

    it('el alias hace que "reportes" también cuente como permitido', () => {
        // Es la raíz del problema: ambos códigos son el mismo módulo.
        expect(hasPermission(usuario, 'reportes')).toBe(true);
        expect(getAvailableModules(usuario)).toContain('reportes');
    });
});

describe('El plan nombrado con el código viejo llega al mismo lugar', () => {
    it('un plan con "reportes" también aterriza en el Reporte', () => {
        expect(getRedirectPath(conPlan('reportes'), INICIO)).toBe(REPORTE);
    });
});

describe('Lo que ya funcionaba no cambia', () => {
    it('con dashboard se queda en el inicio de siempre', () => {
        expect(getRedirectPath(conPlan('dashboard', 'contabilidad'), INICIO)).toBe(INICIO);
    });

    it('un plan completo también se queda en el inicio', () => {
        expect(getRedirectPath(conPlan('dashboard', 'comprobantes', 'kardex'), INICIO)).toBe(INICIO);
    });

    it('sin dashboard pero con Comprobantes va a Comprobantes', () => {
        expect(getRedirectPath(conPlan('comprobantes'), INICIO))
            .toBe('/administrador/facturacion/comprobantes');
    });

    it('sin dashboard pero con Kardex va a Kardex', () => {
        expect(getRedirectPath(conPlan('kardex'), INICIO)).toBe('/administrador/kardex');
    });

    it('ADMIN_SISTEMA no se redirige a ningún lado', () => {
        expect(getRedirectPath({ rol: 'ADMIN_SISTEMA' }, INICIO)).toBe(INICIO);
    });

    it('sin usuario, al login', () => {
        expect(getRedirectPath(null, INICIO)).toBe('/login');
    });
});

describe('Bordes que no deben tumbar el panel', () => {
    it('un plan sin ningún módulo no deja al usuario en el limbo', () => {
        expect(getRedirectPath(conPlan(), INICIO)).toBe(INICIO);
    });

    it('un módulo desconocido cae al inicio en vez de a una ruta inventada', () => {
        expect(getRedirectPath(conPlan('modulo-que-no-existe'), INICIO)).toBe(INICIO);
    });
});
