import { chequeosSeo, descripcionEfectiva, puntajeSeo, tituloEfectivo, type DatosSeoProducto } from '../puntajeSeo';

const base = (d: Partial<DatosSeoProducto> = {}): DatosSeoProducto => ({
  nombre: 'Ramo buchón de 50 rosas',
  nombreTienda: 'Rosas & Asociados',
  precio: 320,
  categoria: 'Ramos y arreglos',
  cantidadFotos: 0,
  ...d,
});

describe('vista previa (mismas reglas que el backend)', () => {
  it('sin campos propios: "Producto | Tienda" y descripción automática con precio', () => {
    expect(tituloEfectivo(base())).toBe('Ramo buchón de 50 rosas | Rosas & Asociados');
    expect(descripcionEfectiva(base())).toBe(
      'Ramo buchón de 50 rosas (ramos y arreglos) a S/ 320.00 en Rosas & Asociados. Compra online o pide por WhatsApp.',
    );
  });
  it('los campos propios mandan y se recortan al límite', () => {
    const d = base({ seoTitulo: 'Ramo buchón de 50 rosas rojas a domicilio en Lima | Rosas & Asociados SAC', seoDescripcion: 'x '.repeat(120) });
    expect(tituloEfectivo(d).length).toBeLessThanOrEqual(60);
    expect(descripcionEfectiva(d).length).toBeLessThanOrEqual(160);
  });
});

describe('igual que el backend', () => {
  it('suaviza mayúsculas y no deja doble punto', () => {
    const d = base({ nombre: 'ROSA ROJA (TALLO)', nombreTienda: 'AUTOPARTES S.A.', categoria: null, precio: 4 });
    expect(tituloEfectivo(d)).toBe('Rosa roja (tallo) | Autopartes S.A.');
    expect(descripcionEfectiva(d)).toBe('Rosa roja (tallo) a S/ 4.00 en Autopartes S.A. Compra online o pide por WhatsApp.');
  });
});

describe('puntaje', () => {
  it('producto sin nada: bajo, y dice qué falta', () => {
    const r = puntajeSeo(base());
    expect(r.nivel).toBe('bajo');
    const faltan = chequeosSeo(base()).filter((c) => !c.ok).map((c) => c.id);
    expect(faltan).toEqual(expect.arrayContaining(['clave', 'foto', 'contenido']));
  });

  it('producto completo: 100', () => {
    const d = base({
      seoPalabraClave: 'ramo buchón',
      seoTitulo: 'Ramo buchón de 50 rosas rojas | Rosas & Asociados',
      seoDescripcion:
        'Ramo buchón de 50 rosas rojas premium con papel coreano. Entrega el mismo día en San Borja y Lima. Pide online o por WhatsApp.',
      descripcionLarga:
        'Nuestro ramo buchón reúne cincuenta rosas rojas premium seleccionadas a mano, envueltas en papel coreano y cinta satinada. Ideal para aniversarios, cumpleaños y declaraciones. Incluye tarjeta dedicatoria y entrega a domicilio en Lima.',
      cantidadFotos: 3,
    });
    expect(puntajeSeo(d)).toEqual({ puntaje: 100, nivel: 'bien' });
  });

  it('la palabra clave se compara sin tildes ni mayúsculas', () => {
    const d = base({ seoPalabraClave: 'RAMO BUCHON' });
    expect(chequeosSeo(d).find((c) => c.id === 'clave-titulo')?.ok).toBe(true);
  });
});
