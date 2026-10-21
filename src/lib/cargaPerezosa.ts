import { lazy, type ComponentType } from 'react';

const CLAVE_RECARGA = 'carga-perezosa-recargo';
/** Si ya se recargó hace menos que esto, no se vuelve a recargar. */
const VENTANA_MS = 10_000;

/**
 * `React.lazy` que sobrevive a un despliegue nuevo.
 *
 * Al partir la app en pedazos, cada pantalla se descarga recién al abrirla. Si
 * entre tanto se desplegó una versión nueva, el pedazo viejo ya no existe y el
 * import falla ("Failed to fetch dynamically imported module"): sin esto, la
 * pantalla quedaba en blanco. Se recarga la página para traer la versión nueva.
 *
 * Se guarda la HORA de la recarga y no un "ya recargué" que se borra al cargar
 * bien: el layout y otras pantallas cargan bien en la misma visita, borraban la
 * marca y el pedazo faltante recargaba la página en bucle.
 */
export function cargaPerezosa<T extends ComponentType<any>>(importar: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      return await importar();
    } catch (error) {
      if (typeof window === 'undefined' || !debeRecargar()) throw error;
      window.location.reload();
      // La recarga corta todo; esta promesa nunca se resuelve.
      return new Promise<{ default: T }>(() => {});
    }
  });
}

export function debeRecargar(ahora = Date.now()): boolean {
  try {
    const ultima = Number(sessionStorage.getItem(CLAVE_RECARGA) || 0);
    if (ahora - ultima < VENTANA_MS) return false;
    sessionStorage.setItem(CLAVE_RECARGA, String(ahora));
    return true;
  } catch {
    // Sin sessionStorage no hay forma de cortar un bucle: mejor mostrar el error.
    return false;
  }
}
