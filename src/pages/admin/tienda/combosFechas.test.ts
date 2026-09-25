/**
 * Las fechas del kit viajan entre el calendario (DD/MM/YYYY) y la API
 * (YYYY-MM-DD). Al borrar la fecha o dejarla a medias, la conversión a ciegas
 * producía "undefined-undefined-": el campo mostraba "/undefined/undefined" y
 * al guardar el backend respondía "fechaFin must be a valid ISO 8601 date
 * string". Un campo opcional vacío tiene que quedar vacío.
 */
import { aIso, aDiaMesAnio } from './combosFechas';

describe('Fechas del kit', () => {
  describe('del calendario a la API', () => {
    it('convierte una fecha completa', () => {
      expect(aIso('27/09/2026')).toBe('2026-09-27');
    });

    it('una fecha vacía queda vacía, no "undefined-undefined-"', () => {
      expect(aIso('')).toBe('');
      expect(aIso(undefined as any)).toBe('');
    });

    it('una fecha a medias tampoco se guarda', () => {
      expect(aIso('27/')).toBe('');
      expect(aIso('27/09')).toBe('');
      expect(aIso('/undefined/undefined27/')).toBe('');
    });
  });

  describe('de la API al calendario', () => {
    it('muestra la fecha guardada en formato peruano', () => {
      expect(aDiaMesAnio('2026-09-27')).toBe('27/09/2026');
      expect(aDiaMesAnio('2026-09-27T00:00:00.000Z')).toBe('27/09/2026');
    });

    it('sin fecha guardada, el campo sale vacío', () => {
      expect(aDiaMesAnio('')).toBe('');
      expect(aDiaMesAnio(undefined)).toBe('');
      expect(aDiaMesAnio('undefined-undefined-')).toBe('');
    });
  });

  it('ida y vuelta: lo que se guarda es lo que se vuelve a ver', () => {
    expect(aDiaMesAnio(aIso('25/09/2026'))).toBe('25/09/2026');
  });
});
