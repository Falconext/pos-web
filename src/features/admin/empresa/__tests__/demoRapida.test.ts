import { mensajeDeAcceso, planesVendibles, planParaDemo, rucCompleto } from '../demoRapida';

const planes = [
    { id: 1, nombre: 'BÁSICO', costo: 49.9, producto: 'facturacion', plataforma: 'krezka' },
    { id: 2, nombre: 'CORPORATIVO', costo: 99.9, producto: 'facturacion', plataforma: 'krezka' },
    { id: 3, nombre: 'FULL 1000', costo: 199, producto: 'facturacion', plataforma: 'krezka' },
    { id: 4, nombre: 'Prueba', costo: 0, producto: 'facturacion', plataforma: 'krezka', esPrueba: true },
    { id: 5, nombre: 'Hotel Pro', costo: 300, producto: 'hotel', plataforma: 'krezka' },
    { id: 7, nombre: 'DEVELOPERS · CUENTA', costo: 0, producto: 'facturacion', plataforma: 'krezka' },
    { id: 6, nombre: 'Otro', costo: 500, producto: 'facturacion', plataforma: 'falconext' },
];

describe('demo rápida', () => {
    it('solo planes vendibles del producto y la marca, del más caro al más barato', () => {
        expect(planesVendibles(planes, 'facturacion', 'krezka').map((p) => p.id)).toEqual([3, 2, 1]);
    });

    it('la demo arranca en Corporativo; si no hay, en el más caro', () => {
        const vendibles = planesVendibles(planes, 'facturacion', 'krezka');
        expect(planParaDemo(vendibles)?.id).toBe(2);
        expect(planParaDemo(vendibles.filter((p) => p.id !== 2))?.id).toBe(3);
        expect(planParaDemo([])).toBeUndefined();
    });

    it('RUC de 11 dígitos', () => {
        expect(rucCompleto('20123456789')).toBe(true);
        expect(rucCompleto('2012345678')).toBe(false);
        expect(rucCompleto('2012345678a')).toBe(false);
    });

    it('el mensaje lleva acceso y vencimiento', () => {
        const m = mensajeDeAcceso({
            razonSocial: 'ACME SAC',
            email: 'a@b.pe',
            password: 'Xy7kPq2mNa',
            vence: '2026-11-13T15:00:00.000Z',
            url: 'https://app.krezka.com/login',
            marca: 'Krezka',
        });
        expect(m).toContain('https://app.krezka.com/login');
        expect(m).toContain('Usuario: a@b.pe');
        expect(m).toContain('Contraseña: Xy7kPq2mNa');
        expect(m).toContain('13 de noviembre');
    });
});
