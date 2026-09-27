/**
 * El horario de atención que muestra el widget de soporte:
 *   lunes a viernes  9:00 – 18:00
 *   sábados          9:00 – 13:00
 *   domingos         cerrado
 *
 * Se calcula en America/Lima a propósito: un empresario con el reloj del
 * equipo mal puesto, o conectándose desde otro país, vería "estamos
 * atendiendo" a las 3 de la mañana y se quedaría esperando una respuesta que
 * no va a llegar hasta el lunes.
 */
import { dentroDeHorario } from '../soporteHorario';

/**
 * Una hora concreta de Perú, que es UTC-5 todo el año (no tiene horario de
 * verano). Septiembre 2026: el 28 cae lunes, así que 26=sábado y 27=domingo.
 */
const enLima = (dia: number, hora: number, min = 0) =>
  new Date(Date.UTC(2026, 8, dia, hora + 5, min));

const LUNES = 28;
const VIERNES = 25;
const SABADO = 26;
const DOMINGO = 27;

describe('Horario de atención del soporte', () => {
  it('los días de semana se atiende de 9 a 6', () => {
    expect(dentroDeHorario(enLima(LUNES, 9))).toBe(true);
    expect(dentroDeHorario(enLima(LUNES, 14, 30))).toBe(true);
    expect(dentroDeHorario(enLima(VIERNES, 17, 59))).toBe(true);
  });

  it('a las 6 de la tarde ya cerró: es el cierre, no el último minuto', () => {
    expect(dentroDeHorario(enLima(LUNES, 18))).toBe(false);
    expect(dentroDeHorario(enLima(VIERNES, 18, 1))).toBe(false);
  });

  it('antes de las 9 todavía no', () => {
    expect(dentroDeHorario(enLima(LUNES, 8, 59))).toBe(false);
    expect(dentroDeHorario(enLima(LUNES, 3))).toBe(false);
  });

  // ── El sábado, que cierra más temprano ────────────────────────────────────
  it('el sábado se atiende de 9 a 1', () => {
    expect(dentroDeHorario(enLima(SABADO, 9))).toBe(true);
    expect(dentroDeHorario(enLima(SABADO, 12, 59))).toBe(true);
  });

  it('el sábado a la 1 de la tarde ya cerró, aunque entre semana siga abierto', () => {
    // Es el error fácil: aplicarle al sábado el cierre de los días de semana.
    expect(dentroDeHorario(enLima(SABADO, 13))).toBe(false);
    expect(dentroDeHorario(enLima(SABADO, 16))).toBe(false);
    // A esa misma hora, un lunes sí se atiende.
    expect(dentroDeHorario(enLima(LUNES, 16))).toBe(true);
  });

  // ── El domingo, cerrado entero ────────────────────────────────────────────
  it('el domingo no se atiende a ninguna hora', () => {
    expect(dentroDeHorario(enLima(DOMINGO, 9))).toBe(false);
    expect(dentroDeHorario(enLima(DOMINGO, 11))).toBe(false);
    expect(dentroDeHorario(enLima(DOMINGO, 15))).toBe(false);
  });

  // ── La zona horaria ───────────────────────────────────────────────────────
  it('usa la hora de Perú, no la del equipo del empresario', () => {
    // 2026-09-28 18:00 UTC = lunes 13:00 en Lima → se atiende.
    expect(dentroDeHorario(new Date('2026-09-28T18:00:00Z'))).toBe(true);
    // 2026-09-28 13:00 UTC = lunes 08:00 en Lima → todavía no.
    expect(dentroDeHorario(new Date('2026-09-28T13:00:00Z'))).toBe(false);
  });

  it('el día también se resuelve en Lima, no en UTC', () => {
    // Lunes 00:30 UTC es domingo 19:30 en Lima: cerrado, aunque en UTC ya
    // sea lunes. Sin resolver el día en Lima, esto diría que se atiende.
    expect(dentroDeHorario(new Date('2026-09-28T00:30:00Z'))).toBe(false);
  });
});
