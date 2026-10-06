import { esAdministrador, esSupervisor, puedeLeerVentasDeTodos } from '../alcanceLectura';

/**
 * Decide si se dibuja el filtro por vendedor y el selector de sede.
 *
 * Es espejo del backend: si acá se mostrara de más, el backend igual recorta
 * —esta función decide qué se ve, no qué se permite— pero si se muestra de
 * menos, el supervisor no puede usar el permiso que sí tiene.
 */
const admin = { rol: 'ADMIN_EMPRESA' };
const supervisor = { rol: 'USUARIO_EMPRESA', convertirEnSupervisor: true };
const cajera = { rol: 'USUARIO_EMPRESA', convertirEnSupervisor: false };

describe('alcance de lectura en el panel', () => {
    it('al supervisor se le muestra el filtro por vendedor', () => {
        expect(puedeLeerVentasDeTodos(supervisor)).toBe(true);
    });

    it('a la cajera no', () => {
        expect(puedeLeerVentasDeTodos(cajera)).toBe(false);
        expect(puedeLeerVentasDeTodos({ rol: 'USUARIO_EMPRESA' })).toBe(false);
    });

    it('a los administradores sí, como siempre', () => {
        expect(puedeLeerVentasDeTodos(admin)).toBe(true);
        expect(puedeLeerVentasDeTodos({ rol: 'ADMIN_SISTEMA' })).toBe(true);
    });

    it('el supervisor no se confunde con un administrador', () => {
        expect(esSupervisor(supervisor)).toBe(true);
        expect(esAdministrador(supervisor)).toBe(false);
    });

    it('un admin marcado supervisor sigue siendo admin', () => {
        expect(esSupervisor({ rol: 'ADMIN_EMPRESA', convertirEnSupervisor: true })).toBe(false);
        expect(puedeLeerVentasDeTodos({ rol: 'ADMIN_EMPRESA', convertirEnSupervisor: true })).toBe(true);
    });

    it('sin sesión no se muestra nada de más', () => {
        expect(puedeLeerVentasDeTodos(null)).toBe(false);
        expect(puedeLeerVentasDeTodos(undefined)).toBe(false);
        expect(puedeLeerVentasDeTodos({})).toBe(false);
    });

    it('un valor nulo del campo no se interpreta como permiso', () => {
        expect(puedeLeerVentasDeTodos({ rol: 'USUARIO_EMPRESA', convertirEnSupervisor: null })).toBe(false);
    });

    it('el RESELLER no entra por esta puerta', () => {
        expect(puedeLeerVentasDeTodos({ rol: 'RESELLER' })).toBe(false);
    });
});

describe('las tres pantallas usan la misma regla', () => {
    const fs = require('fs');
    const path = require('path');
    const leer = (p: string) => fs.readFileSync(path.join(__dirname, '../../', p), 'utf8');

    const pantallas = [
        'pages/admin/facturacion/Comprobantes.tsx',
        'pages/admin/facturacion/ComprobantesInformales.tsx',
        'pages/admin/despacho/usePanelVentasViewModel.ts',
    ];

    it('ninguna vuelve a comparar el rol a mano', () => {
        for (const p of pantallas) {
            const fuente = leer(p);
            const linea = fuente
                .split('\n')
                .find((l: string) => l.includes('canFilterByUsuario') && l.includes('='));
            expect(`${p}: ${linea?.trim()}`).toContain('puedeLeerVentasDeTodos');
        }
    });
});
