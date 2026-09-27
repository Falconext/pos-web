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

/** Texto fijo del horario, para que la pantalla y esta regla no se separen. */
export const TEXTO_HORARIO =
  'Lunes a viernes de 9:00 a 6:00 p.m. · Sábados de 9:00 a 1:00 p.m.';

/**
 * ¿Se está atendiendo en este momento?
 *
 * Se resuelve en America/Lima y no con el reloj del navegador —hora Y día—:
 * un empresario con el equipo mal configurado, o conectándose de viaje, vería
 * "estamos atendiendo" a las 3 de la mañana y se quedaría esperando una
 * respuesta que no va a llegar.
 */
export const dentroDeHorario = (ahora = new Date()): boolean => {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima',
    hour: 'numeric',
    hour12: false,
    weekday: 'short',
  }).formatToParts(ahora);

  const hora = Number(partes.find((p) => p.type === 'hour')?.value);
  const dia = partes.find((p) => p.type === 'weekday')?.value;

  if (dia === 'Sun') return false;
  const cierre = dia === 'Sat' ? HORA_FIN_SABADO : HORA_FIN_SEMANA;
  return hora >= HORA_INICIO && hora < cierre;
};
