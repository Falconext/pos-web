import { fechasDeRango } from '../rangoPacks';

describe('fechasDeRango (días de Lima)', () => {
  // 20/10/2026 a las 21:00 de Lima = 21/10 02:00 UTC: sigue siendo el 20 en Lima.
  const ahora = new Date('2026-10-21T02:00:00Z');

  it('hoy y este mes usan el día de Lima, no el de UTC', () => {
    expect(fechasDeRango('hoy', ahora)).toEqual({ fechaInicio: '2026-10-20', fechaFin: '2026-10-20' });
    expect(fechasDeRango('mes', ahora)).toEqual({ fechaInicio: '2026-10-01', fechaFin: '2026-10-20' });
  });

  it('7 días incluye hoy', () => {
    expect(fechasDeRango('7d', ahora)).toEqual({ fechaInicio: '2026-10-14', fechaFin: '2026-10-20' });
  });

  it('mes pasado completo, también en enero', () => {
    expect(fechasDeRango('mes-pasado', ahora)).toEqual({ fechaInicio: '2026-09-01', fechaFin: '2026-09-30' });
    expect(fechasDeRango('mes-pasado', new Date('2027-01-15T15:00:00Z'))).toEqual({
      fechaInicio: '2026-12-01',
      fechaFin: '2026-12-31',
    });
  });

  it('este año desde el 1 de enero', () => {
    expect(fechasDeRango('anio', ahora)).toEqual({ fechaInicio: '2026-01-01', fechaFin: '2026-10-20' });
  });
});
