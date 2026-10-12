/**
 * Buscar al cliente al crear un comprobante.
 *
 * El caso que motivó el alias: el negocio tiene guardado "PANADERIA SAN LUIS
 * S.A.C." pero todos le dicen "Lucho". Escribir "lucho" no encontraba nada y el
 * vendedor terminaba creando el cliente de nuevo o emitiendo a CLIENTES VARIOS.
 */
import { filtrarClientes } from '../buscarCliente';

const LUCHO = {
  id: 1,
  nombre: 'PANADERIA SAN LUIS S.A.C.',
  alias: 'Lucho',
  nroDoc: '20481234567',
  telefono: '987654321',
};
const ESQUINA = {
  id: 2,
  nombre: 'INVERSIONES MARTINEZ E.I.R.L.',
  alias: 'La bodega de la esquina',
  nroDoc: '20559876543',
};
const SIN_ALIAS = { id: 3, nombre: 'COMERCIAL ANDINA SAC', nroDoc: '20551112223' };
const TODOS = [LUCHO, ESQUINA, SIN_ALIAS];

const ids = (r: any[]) => r.map((c) => c.id);

describe('Buscar cliente por alias', () => {
  it('lo encuentra escribiendo el apodo', () => {
    expect(ids(filtrarClientes(TODOS, 'lucho'))).toEqual([1]);
  });

  it('funciona con una parte del alias', () => {
    expect(ids(filtrarClientes(TODOS, 'esquina'))).toEqual([2]);
  });

  it('no distingue mayúsculas ni tildes', () => {
    expect(ids(filtrarClientes(TODOS, 'LUCHO'))).toEqual([1]);
    expect(ids(filtrarClientes([{ ...LUCHO, alias: 'Pánadería' }], 'panaderia'))).toEqual([1]);
  });
});

describe('Buscar cliente · lo de siempre sigue funcionando', () => {
  it('por nombre', () => {
    expect(ids(filtrarClientes(TODOS, 'andina'))).toEqual([3]);
  });

  it('por documento', () => {
    expect(ids(filtrarClientes(TODOS, '20481234567'))).toEqual([1]);
  });

  it('por teléfono', () => {
    expect(ids(filtrarClientes(TODOS, '987654321'))).toEqual([1]);
  });

  it('un cliente sin alias no se rompe ni desaparece', () => {
    expect(ids(filtrarClientes(TODOS, 'comercial'))).toEqual([3]);
  });
});

describe('Buscar cliente · los bordes', () => {
  it('no sugiere nada con menos de 3 letras: la lista taparía el formulario', () => {
    expect(filtrarClientes(TODOS, 'lu')).toEqual([]);
    expect(filtrarClientes(TODOS, '')).toEqual([]);
  });

  it('si no coincide con nada, no devuelve a nadie', () => {
    expect(filtrarClientes(TODOS, 'zzzzz')).toEqual([]);
  });

  it('aguanta una lista vacía o inválida', () => {
    expect(filtrarClientes([], 'lucho')).toEqual([]);
    expect(filtrarClientes(null as any, 'lucho')).toEqual([]);
  });

  it('corta la lista para que quepa debajo del campo', () => {
    const muchos = Array.from({ length: 20 }, (_, i) => ({ id: i, nombre: 'CLIENTE PRUEBA', nroDoc: '1' }));
    expect(filtrarClientes(muchos, 'prueba')).toHaveLength(6);
  });
});
