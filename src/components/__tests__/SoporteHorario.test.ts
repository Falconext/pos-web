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
import { dentroDeHorario, proximaAtencion } from '../soporteHorario';

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

/**
 * Cuándo volvemos, en palabras.
 *
 * Fuera de hora el empresario no necesita que le digan que está cerrado —eso
 * ya lo ve—, sino si le conviene esperar. Acá está el valor real del aviso, y
 * también los bordes: el sábado por la tarde el "mañana" sería mentira.
 */
describe('Cuándo volvemos a atender', () => {
  it('antes de abrir, es hoy mismo', () => {
    expect(proximaAtencion(enLima(LUNES, 7))).toBe('hoy 9:00 a.m.');
    expect(proximaAtencion(enLima(SABADO, 8, 30))).toBe('hoy 9:00 a.m.');
  });

  it('tras cerrar un día de semana, es mañana', () => {
    expect(proximaAtencion(enLima(LUNES, 19))).toBe('mañana 9:00 a.m.');
  });

  it('el viernes de noche es mañana, porque el sábado sí se atiende', () => {
    expect(proximaAtencion(enLima(VIERNES, 20))).toBe('mañana 9:00 a.m.');
  });

  it('el sábado por la tarde NO es mañana: mañana es domingo', () => {
    // El borde que hace falso un "mañana" genérico.
    expect(proximaAtencion(enLima(SABADO, 15))).toBe('el lunes 9:00 a.m.');
  });

  it('el domingo sí es mañana, que ya es lunes', () => {
    expect(proximaAtencion(enLima(DOMINGO, 11))).toBe('mañana 9:00 a.m.');
    expect(proximaAtencion(enLima(DOMINGO, 7))).toBe('mañana 9:00 a.m.');
  });

  it('se resuelve en Lima, no en UTC', () => {
    // Domingo 19:30 de Lima ya es lunes en UTC. Si el día saliera de UTC,
    // diría "hoy desde las 9" un domingo por la noche.
    expect(proximaAtencion(new Date('2026-09-28T00:30:00Z'))).toBe('mañana 9:00 a.m.');
  });
});
});
