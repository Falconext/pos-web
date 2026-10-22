/**
 * Pantalla "API de Krezka": probador y código para copiar. Lo que se muestra
 * tiene que ser exactamente lo que la web del cliente va a mandar.
 */
import { PORTAL_DESARROLLADORES, RUTAS, codigoPara, leerCuerpo, rutaPorId, tipoDeClave, urlDe } from '../ApiKrezkaModel';

const BASE = 'https://api.krezka.com/api/v1/erp';

describe('rutas', () => {
    it('cubre catálogo, stock y ventas, y los POST llevan Idempotency-Key', () => {
        const ids = RUTAS.map((r) => r.id);
        expect(ids).toEqual(expect.arrayContaining(['listar-productos', 'crear-producto', 'ajustar-stock', 'crear-venta', 'ver-venta']));
        for (const r of RUTAS.filter((x) => x.metodo === 'POST')) expect(r.idempotente).toBe(true);
    });

    it('los ejemplos usan los nombres de campo que acepta la API', () => {
        expect(rutaPorId('crear-producto').cuerpo).toHaveProperty('published_in_store');
        expect(rutaPorId('ajustar-stock').cuerpo).toMatchObject({ reason: 'damaged' });
        expect(rutaPorId('crear-venta').cuerpo).toMatchObject({ payment: { method: 'card' } });
    });

    it('el portal es developers.falconext.pe/erp', () => {
        expect(PORTAL_DESARROLLADORES).toBe('https://developers.falconext.pe/erp');
    });
});

describe('url', () => {
    it('pone el id y la query', () => {
        expect(urlDe(BASE, rutaPorId('ver-producto'), '42', '')).toBe(`${BASE}/products/42`);
        expect(urlDe(BASE, rutaPorId('listar-productos'), '', '?limit=5')).toBe(`${BASE}/products?limit=5`);
        expect(urlDe(`${BASE}/`, rutaPorId('ver-venta'), '', '')).toBe(`${BASE}/sales/%7Bid%7D`);
    });
});

describe('clave y cuerpo', () => {
    it('reconoce clave de prueba y real', () => {
        expect(tipoDeClave('sk_test_abc')).toBe('test');
        expect(tipoDeClave('sk_live_abc')).toBe('live');
        expect(tipoDeClave('abc')).toBeNull();
    });

    it('avisa si el JSON está mal', () => {
        expect(leerCuerpo('{"a":1}')).toEqual({ ok: true, valor: { a: 1 } });
        expect(leerCuerpo('')).toEqual({ ok: true, valor: undefined });
        const r = leerCuerpo('{a:1}');
        expect(r.ok).toBe(false);
    });
});

describe('código para copiar', () => {
    const venta = rutaPorId('crear-venta');
    const url = `${BASE}/sales`;

    it('curl con clave, idempotencia y cuerpo', () => {
        const c = codigoPara('curl', venta, url, { a: "d'Ana" });
        expect(c).toContain(`curl -X POST "${url}"`);
        expect(c).toContain('Authorization: Bearer TU_CLAVE');
        expect(c).toContain('Idempotency-Key: $(uuidgen)');
        expect(c).toContain(`"a": "d'\\''Ana"`);
    });

    it('JavaScript con fetch y manejo del error', () => {
        const c = codigoPara('javascript', venta, url, { a: 1 });
        expect(c).toContain(`await fetch('${url}'`);
        expect(c).toContain("'Idempotency-Key': crypto.randomUUID()");
        expect(c).toContain('data.error.message');
    });

    it('PHP con arreglo nativo', () => {
        const c = codigoPara('php', venta, url, { items: [{ product_id: 1 }], payment: { method: 'card' } });
        expect(c).toContain('<?php');
        expect(c).toContain("'product_id' => 1");
        expect(c).toContain("'method' => 'card'");
        expect(c).toContain('random_bytes(16)');
    });

    it('un GET no lleva cuerpo ni idempotencia', () => {
        const c = codigoPara('curl', rutaPorId('listar-productos'), `${BASE}/products`);
        expect(c).not.toContain('Idempotency-Key');
        expect(c).not.toContain('-d ');
    });
});
