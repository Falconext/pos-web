import { hasPermission } from '../permissions';

/**
 * El bloque "Para la IA de Ventas" de la ficha de producto.
 *
 * Disponibilidad y empuje son campos que SOLO lee la IA de Ventas. Ese módulo
 * no viene en los planes: se contrata aparte (en el seed está en
 * `MODULOS_NO_AUTOASIGNAR`). Al negocio que no lo tiene esos campos no le hacen
 * nada y solo le ensucian la ficha, así que la sección se gatea con
 * `hasPermission(user, 'leads')` — el mismo criterio con el que el módulo
 * aparece o no en el menú.
 *
 * Este test fija la regla en los dos sentidos: un gate que siempre esconde es
 * tan incorrecto como uno que nunca esconde.
 */
describe('Gate del bloque "Para la IA de Ventas"', () => {
  const conModulos = (codigos: string[] | undefined, rol = 'ADMIN_EMPRESA') =>
    ({
      rol,
      permisos: ['*'],
      empresa: {
        plan: codigos
          ? { modulosAsignados: codigos.map((codigo) => ({ modulo: { codigo } })) }
          : {},
      },
    }) as any;

  it('se muestra si el plan contrató IA de Ventas', () => {
    expect(hasPermission(conModulos(['kardex', 'ventas', 'leads']), 'leads')).toBe(true);
  });

  it('NO se muestra con un plan sin IA de Ventas, por completo que sea', () => {
    // Caso real: el plan "Corporativo Anual" trae de todo menos `leads`.
    const corporativo = [
      'compras', 'comprobantes', 'contabilidad', 'dashboard', 'kardex',
      'mi-negocio', 'notificaciones', 'sedes', 'tienda', 'usuarios', 'ventas',
    ];
    expect(hasPermission(conModulos(corporativo), 'leads')).toBe(false);
  });

  it('un vendedor sin el módulo tampoco lo ve', () => {
    const user = {
      rol: 'USUARIO_EMPRESA',
      permisos: ['kardex', 'ventas'],
      empresa: { plan: { modulosAsignados: [{ modulo: { codigo: 'kardex' } }] } },
    } as any;
    expect(hasPermission(user, 'leads')).toBe(false);
  });

  it('con el módulo en el plan, el vendedor que lo tiene asignado sí lo ve', () => {
    const user = {
      rol: 'USUARIO_EMPRESA',
      permisos: ['kardex', 'leads'],
      empresa: {
        plan: { modulosAsignados: [{ modulo: { codigo: 'kardex' } }, { modulo: { codigo: 'leads' } }] },
      },
    } as any;
    expect(hasPermission(user, 'leads')).toBe(true);
  });

  it('plan sin configurar no restringe: no se le apaga la ficha a nadie por falta de datos', () => {
    // `modulosAsignados` undefined ≠ lista vacía. Es la convención del módulo
    // de permisos y acá se respeta igual que en el resto del panel.
    expect(hasPermission(conModulos(undefined), 'leads')).toBe(true);
  });

  it('sin sesión no se muestra', () => {
    expect(hasPermission(null, 'leads')).toBe(false);
  });
});
