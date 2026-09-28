/**
 * De dónde sale el origen del WebSocket.
 *
 * Visto en producción de Krezka: la consola repetía
 * `WebSocket connection to 'wss://https://socket.io/?EIO=4' failed` sin parar.
 * No era el servidor: la URL se armaba mal en el navegador.
 *
 * `'https://api.krezka.com/api'.replace('/api', '')` borra la PRIMERA
 * aparición, que cae dentro de `//api.`, y devuelve `https:/.krezka.com/api`.
 * socket.io no puede parsear eso y cae a su host por defecto.
 *
 * El detalle que lo mantuvo escondido: en `app.falconext.pe` funcionaba bien.
 * Solo rompe en dominios que empiezan con `api.`.
 */

/** La misma regla que usa notificaciones.ts. */
const sinSufijoApi = (url: string) => url.replace(/\/api\/?$/, '');

describe('Origen del WebSocket', () => {
  it('EL DEFECTO: el recorte sin ancla rompe los dominios que empiezan con api.', () => {
    expect('https://api.krezka.com/api'.replace('/api', '')).toBe('https:/.krezka.com/api');
  });

  it('recorta solo el /api del final', () => {
    expect(sinSufijoApi('https://api.krezka.com/api')).toBe('https://api.krezka.com');
  });

  it('funciona igual en los dominios donde nunca falló', () => {
    expect(sinSufijoApi('https://app.falconext.pe/api')).toBe('https://app.falconext.pe');
    expect(sinSufijoApi('http://localhost:4001/api')).toBe('http://localhost:4001');
  });

  it('tolera la barra final', () => {
    expect(sinSufijoApi('https://api.krezka.com/api/')).toBe('https://api.krezka.com');
  });

  it('no toca un /api que no esté al final', () => {
    // Un proxy con la API colgando de un subpath no debe perderlo.
    expect(sinSufijoApi('https://krezka.com/api/v2')).toBe('https://krezka.com/api/v2');
  });

  it('deja intacta una URL que ya viene sin /api', () => {
    expect(sinSufijoApi('https://api.krezka.com')).toBe('https://api.krezka.com');
  });
});
