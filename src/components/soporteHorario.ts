/**
 * Horario de atención del soporte, hora de Perú:
 *   lunes a viernes  9:00 – 18:00
 *   sábados          9:00 – 13:00
 *   domingos         cerrado
 *
 * Vive aparte del widget para poder probarlo sin arrastrar el cliente de API
 * y todo lo que cuelga de él.
 */

const HORA_INICIO = 9;
const HORA_FIN_SEMANA = 18;
const HORA_FIN_SABADO = 13;

/** Un solo lugar para el horario, para que la pantalla y la regla no se separen. */
export const TEXTO_HORARIO =
  'Lun a vie de 9:00 a 6:00 p.m. · Sáb de 9:00 a 1:00 p.m.';

/** Lo que se sube y cuándo: la expectativa que el empresario necesita tener. */
export const TEXTO_DESPLIEGUE =
  'Lo que nos pidas se sube al cierre del día; como máximo, la noche siguiente.';

const DOMINGO = 0;
const SABADO = 6;

/** Hora y día en Lima, sin depender del reloj ni la zona del navegador. */
const enLima = (ahora: Date) => {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima',
    hour: 'numeric',
    hour12: false,
    weekday: 'short',
  }).formatToParts(ahora);
  const dias = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    hora: Number(partes.find((p) => p.type === 'hour')?.value),
    dia: dias.indexOf(partes.find((p) => p.type === 'weekday')?.value ?? ''),
  };
};

const cierreDe = (dia: number) =>
  dia === SABADO ? HORA_FIN_SABADO : HORA_FIN_SEMANA;

/**
 * ¿Se está atendiendo en este momento?
 *
 * Hora Y día se resuelven en America/Lima: un empresario con el equipo mal
 * configurado, o conectándose de viaje, vería "estamos atendiendo" a las 3 de
 * la mañana y se quedaría esperando una respuesta que no va a llegar.
 */
export const dentroDeHorario = (ahora = new Date()): boolean => {
  const { hora, dia } = enLima(ahora);
  if (dia === DOMINGO) return false;
  return hora >= HORA_INICIO && hora < cierreDe(dia);
};

const NOMBRE_DIA = [
  'el domingo',
  'el lunes',
  'el martes',
  'el miércoles',
  'el jueves',
  'el viernes',
  'el sábado',
];

/**
 * Cuándo vuelve a haber alguien, en palabras y corto: entra en una línea del
 * encabezado del widget.
 *
 * Fuera de hora, lo que el empresario necesita saber no es que está cerrado
 * —eso ya lo ve— sino si le conviene esperar. "El lunes 9:00 a.m." le deja
 * decidir; "fuera de horario" lo deja en el aire.
 */
export const proximaAtencion = (ahora = new Date()): string => {
  const { hora, dia } = enLima(ahora);

  // Todavía no abrimos, pero hoy sí se atiende.
  if (dia !== DOMINGO && hora < HORA_INICIO) return 'hoy 9:00 a.m.';

  // Ya cerró (o es domingo): el próximo día hábil, saltando el domingo.
  let siguiente = (dia + 1) % 7;
  let saltos = 1;
  while (siguiente === DOMINGO) {
    siguiente = (siguiente + 1) % 7;
    saltos++;
  }
  return saltos === 1 ? 'mañana 9:00 a.m.' : `${NOMBRE_DIA[siguiente]} 9:00 a.m.`;
};
