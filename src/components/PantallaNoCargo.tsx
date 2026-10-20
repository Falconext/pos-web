import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Cambia al navegar: así un error en una pantalla no deja rotas las demás. */
  clave?: string;
}

interface State {
  error: Error | null;
}

/**
 * Si una pantalla no se pudo descargar (ver cargaPerezosa) o falló al pintarse,
 * se muestra esto en vez de dejar la página en blanco.
 */
export default class PantallaNoCargo extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prev: Props) {
    if (prev.clave !== this.props.clave && this.state.error) this.setState({ error: null });
  }

  componentDidCatch(error: Error) {
    console.error('Pantalla no cargó:', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const descarga = /dynamically imported module|Loading chunk|Importing a module script failed/i.test(this.state.error.message);
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6" role="alert">
        <div className="max-w-sm text-center">
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            {descarga ? 'Hay una versión nueva del sistema' : 'Esta pantalla no se pudo abrir'}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {descarga
              ? 'Recarga la página para usarla. No se pierde nada de lo que ya guardaste.'
              : 'Recarga la página. Si vuelve a pasar, avísanos qué estabas haciendo.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900"
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }
}
