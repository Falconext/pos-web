import { enlaceWhatsApp, mensajeVentaAlCliente, primerNombre } from '../mensajeVentaAlCliente';

const BASE = {
    cliente: 'QUISPE HUAMAN, ROSA MARIA',
    referencia: 'NV01-25',
    tipoDocumento: 'Nota de venta',
    pdfUrl: 'https://s3/nv01-25.pdf',
    courier: 'SHALOM',
    agenciaDestino: 'Shalom Arequipa Av. Parra',
    nroOrden: '100747124',
    claveOrden: '9WNC',
    claveEnvio: '4821',
    saldo: 0,
    negocio: 'Hierba Sana',
};

describe('mensaje al cliente de una venta por fuera', () => {
    it('pagado: comprobante, datos de Shalom, clave y el seguimiento del asesor', () => {
        const m = mensajeVentaAlCliente(BASE);
        expect(m).toContain('Hola Rosa');
        expect(m).toContain('nota de venta NV01-25: https://s3/nv01-25.pdf');
        expect(m).toContain('va por Shalom a la agencia Arequipa Av. Parra');
        expect(m).toContain('N° de orden: 100747124');
        expect(m).toContain('Código de orden: 9WNC');
        expect(m).toContain('Clave de recojo: 4821');
        expect(m).toContain('asesor de ventas de Hierba Sana');
    });

    it('con saldo NO va la clave: va lo que debe', () => {
        const m = mensajeVentaAlCliente({ ...BASE, saldo: 30 });
        expect(m).not.toContain('4821');
        expect(m).toContain('Saldo pendiente: S/ 30.00');
        expect(m).toContain('te enviamos la clave');
    });

    it('reparto propio: sin bloque de Shalom ni clave', () => {
        const m = mensajeVentaAlCliente({ ...BASE, courier: 'REPARTO_PROPIO', nroOrden: '', claveEnvio: '' });
        expect(m).not.toContain('Shalom');
        expect(m).not.toContain('Clave');
    });

    it('sin PDF el mensaje igual sale', () => {
        expect(mensajeVentaAlCliente({ ...BASE, pdfUrl: null })).toContain('Tu nota de venta NV01-25\n');
    });

    it.each([
        ['QUISPE HUAMAN, ROSA MARIA', 'Rosa'],
        ['ana lucía pérez', 'Ana'],
        ['CLIENTES VARIOS', ''],
        ['WSP 991065217', ''],
    ])('primer nombre de "%s" → "%s"', (c, n) => expect(primerNombre(c)).toBe(n));

    it('el enlace va directo a api.whatsapp.com (wa.me rompe los emojis)', () => {
        const u = enlaceWhatsApp('987 654 321', 'Hola 👋');
        expect(u).toBe('https://api.whatsapp.com/send?phone=51987654321&text=Hola%20%F0%9F%91%8B');
        expect(enlaceWhatsApp('51987654321', 'x')).toContain('phone=51987654321&');
    });
});
