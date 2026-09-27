/**
 * El horario de atención que muestra el widget de soporte.
 *
 * Se calcula en America/Lima a propósito: un empresario con el reloj del
 * equipo mal puesto, o conectándose desde otro país, vería "estamos
 * atendiendo" a las 3 de la mañana y se quedaría esperando una respuesta que
 * no va a llegar hasta las 9.
 */

const HORA_INICIO = 9;
const HORA_FIN = 18;

/** Misma función que usa el widget. */
const dentroDeHorario = (ahora: Date) => {
  const hora = Number(
    new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      hour: 'numeric',
      hour12: false,
    }).format(ahora),
  );
  return hora >= HORA_INICIO && hora < HORA_FIN;
};

/** Una hora concreta de Perú, que es UTC-5 todo el año (no tiene horario de verano). */
const horaDeLima = (h: number, m = 0) =>
  new Date(Date.UTC(2026, 8, 28, h + 5, m));

describe('Horario de atención del soporte', () => {
  it('a las 9:00 en punto ya se atiende', () => {
    expect(dentroDeHorario(horaDeLima(9))).toBe(true);
  });

  it('a media tarde se atiende', () => {
    expect(dentroDeHorario(horaDeLima(14, 30))).toBe(true);
  });

  it('a las 17:59 todavía se atiende', () => {
    expect(dentroDeHorario(horaDeLima(17, 59))).toBe(true);
  });

  it('a las 18:00 ya no: las 6 de la tarde es el cierre, no el último minuto', () => {
    expect(dentroDeHorario(horaDeLima(18))).toBe(false);
  });

  it('a las 8:59 todavía no', () => {
    expect(dentroDeHorario(horaDeLima(8, 59))).toBe(false);
  });

  it('de madrugada no', () => {
    expect(dentroDeHorario(horaDeLima(3))).toBe(false);
    expect(dentroDeHorario(horaDeLima(23))).toBe(false);
  });

  it('usa la hora de Perú, no la del equipo del empresario', () => {
    // Las 20:00 de España son las 13:00 en Lima: se atiende.
    const tardeEnEspana = new Date('2026-09-28T18:00:00Z');
    expect(dentroDeHorario(tardeEnEspana)).toBe(true);

    // Las 08:00 de Lima vistas desde Japón siguen siendo las 08:00 de Lima.
    const mananaEnLima = new Date('2026-09-28T13:00:00Z');
    expect(dentroDeHorario(mananaEnLima)).toBe(false);
  });
});
