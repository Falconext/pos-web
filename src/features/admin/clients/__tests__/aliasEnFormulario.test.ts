/**
 * El alias del cliente tiene que existir en el formulario que el empresario
 * abre de verdad, y tiene que llegar hasta el backend.
 *
 * Esta prueba nace del mismo error que ya nos costó la casilla de Agente de
 * Retención: el campo se agregó a `src/pages/admin/clientes/ModalCliente.tsx`,
 * que no lo importa nadie —es código muerto—, mientras el formulario vivo es
 * `features/admin/clients/shared/ModalClient.tsx`. Y hubo un segundo tramo
 * roto: `zustand/clients.ts` filtra el payload con una lista blanca, así que
 * un campo ausente de esa lista se escribe en pantalla y se descarta al
 * guardar, sin error visible.
 *
 * Por eso se verifica la cadena completa: ruta → vista → modal → payload.
 */
import * as fs from 'fs';
import * as path from 'path';

const raiz = path.join(__dirname, '..', '..', '..', '..');
const leer = (rel: string) => fs.readFileSync(path.join(raiz, rel), 'utf-8');

describe('Alias · está en el formulario que se usa', () => {
    it('la ruta /administrador/clientes llega a ClientsView', () => {
        expect(leer('App.tsx')).toContain('path="clientes"');
        expect(leer('pages/admin/Clientes.tsx')).toContain('features/admin/clients/ClientsView');
    });

    it('ClientsView monta el modal de clientes', () => {
        expect(leer('features/admin/clients/ClientsView.tsx')).toMatch(/ModalClient\b/);
    });

    it('ese modal —y no otro— tiene el campo alias', () => {
        const vivo = leer('features/admin/clients/shared/ModalClient.tsx');
        expect(vivo).toMatch(/name="alias"/);
        expect(vivo).toMatch(/formValues\?\.alias/);
    });
});

describe('Alias · llega hasta el backend', () => {
    it('está en la lista blanca del payload', () => {
        // Sin esto el alias se escribe y se descarta al guardar: el mismo
        // defecto que ya nos pasó con precios mayorista y con el SKU.
        expect(leer('zustand/clients.ts')).toContain("'alias'");
    });

    it('está declarado en las interfaces del cliente', () => {
        const tipos = leer('interfaces/clients.ts');
        // En IClient para poder mostrarlo/buscarlo, y en IFormClient para editarlo.
        expect(tipos.match(/alias/g)?.length).toBeGreaterThanOrEqual(2);
    });

    it('el formulario arranca con el alias vacío, no indefinido', () => {
        expect(leer('features/admin/clients/ClientsModel.ts')).toMatch(/alias:\s*''/);
    });
});
