/**
 * Disponibilidad y prioridad de venta del producto.
 *
 * Son los dos campos que usa la IA de Ventas para no prometer lo que no hay
 * y para ofrecer primero lo que el negocio quiere mover. Existían en la base
 * desde el bloque B, pero solo se podían poner por API: el dueño no tenía
 * dónde tocarlos, así que en la práctica no existían.
 *
 * "Disponible" no es lo mismo que "con stock": muchos de estos negocios no
 * llevan inventario real, y lo que importa es si lo pueden entregar.
 */
import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useProductModalViewModel } from '../useProductModalViewModel';
import { useAlertStore } from '@/zustand/alert';
import { disparosService } from '@/services/crm.service';

type ViewProps = ReturnType<typeof useProductModalViewModel>;

const OPCIONES: {
  valor: string;
  label: string;
  detalle: string;
  icon: string;
  clases: string;
}[] = [
  {
    valor: 'INMEDIATA',
    label: 'Disponible',
    detalle: 'Se entrega de inmediato.',
    icon: 'solar:check-circle-bold-duotone',
    clases:
      'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-300',
  },
  {
    valor: 'BAJO_PEDIDO',
    label: 'Bajo pedido',
    detalle: 'La IA deriva a un asesor para fijar la fecha.',
    icon: 'solar:calendar-bold-duotone',
    clases:
      'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300',
  },
  {
    valor: 'NO_DISPONIBLE',
    label: 'No disponible',
    detalle: 'La IA no lo ofrece ni manda avisos sobre él.',
    icon: 'solar:close-circle-bold-duotone',
    clases:
      'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800/50 dark:bg-rose-900/20 dark:text-rose-300',
  },
];

/** Los únicos valores que acepta el backend (1 media, 2 alta, 3 muy alta). */
const PRIORIDADES: { valor: number; label: string }[] = [
  { valor: 0, label: 'Normal' },
  { valor: 1, label: 'Media' },
  { valor: 2, label: 'Alta' },
  { valor: 3, label: 'Muy alta' },
];

export const ProductDisponibilidadIa: React.FC<{ vm: ViewProps }> = ({ vm }) => {
  const { alert } = useAlertStore();
  const { formValues, handleChange, isEdit } = vm as unknown as {
    formValues: Record<string, unknown>;
    handleChange: (e: { target: { name: string; value: string } }) => void;
    isEdit: boolean;
  };
  const [avisando, setAvisando] = useState(false);

  // Sin valor guardado se asume disponible: es lo que el negocio espera de un
  // producto que acaba de cargar.
  const actual = String(formValues?.disponibilidad ?? 'INMEDIATA');
  const prioridad = Number(formValues?.prioridadVenta ?? 0);
  const productoId = Number(formValues?.productoId ?? 0);

  const poner = (name: string, value: string) =>
    handleChange({ target: { name, value } });

  /**
   * 33.1 — avisa a quien lo pidió y no lo encontró.
   *
   * Es un botón y no algo que pase solo al guardar porque el dueño tiene que
   * poder decidirlo: si acaba de entrar una caja de 3 unidades, avisarle a 40
   * personas es prometer lo que no va a poder cumplir.
   */
  const avisarListaDeEspera = async () => {
    setAvisando(true);
    try {
      const r = await disparosService.avisarProductoDisponible(productoId);
      alert(
        r.avisados > 0
          ? `Se avisará a ${r.avisados} cliente${r.avisados === 1 ? '' : 's'} que lo había${r.avisados === 1 ? '' : 'n'} pedido.`
          : r.motivo
            ? `No se avisó a nadie: ${r.motivo}`
            : 'Nadie había preguntado por este producto.',
        r.avisados > 0 ? 'success' : 'info',
      );
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'No se pudo avisar', 'error');
    } finally {
      setAvisando(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-gray-200 p-3 dark:border-slate-800">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
        <Icon icon="solar:magic-stick-3-bold-duotone" className="text-violet-500" />
        Para la IA de Ventas
      </p>

      <div className="grid grid-cols-3 gap-1.5">
        {OPCIONES.map((o) => (
          <button
            key={o.valor}
            type="button"
            data-testid={`disp-${o.valor}`}
            title={o.detalle}
            onClick={() => poner('disponibilidad', o.valor)}
            className={`rounded-lg border p-2 text-left transition-colors ${
              actual === o.valor
                ? o.clases
                : 'border-gray-200 text-gray-500 hover:border-violet-300 dark:border-slate-700 dark:text-gray-400'
            }`}
          >
            <Icon icon={o.icon} className="text-base" />
            <p className="text-[11px] font-black leading-tight">{o.label}</p>
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[10px] text-gray-400">
        {OPCIONES.find((o) => o.valor === actual)?.detalle}
      </p>

      {/* El botón solo tiene sentido con el producto ya guardado y disponible. */}
      {isEdit && productoId > 0 && actual === 'INMEDIATA' && (
        <button
          type="button"
          onClick={avisarListaDeEspera}
          disabled={avisando}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-violet-200 py-1.5 text-[11px] font-bold text-violet-700 hover:bg-violet-50 disabled:opacity-60 dark:border-violet-900/40 dark:text-violet-300"
        >
          <Icon
            icon={avisando ? 'eos-icons:loading' : 'solar:bell-bing-bold-duotone'}
            className={avisando ? 'animate-spin' : ''}
          />
          {avisando ? 'Avisando…' : 'Avisar a quien lo pidió y no había'}
        </button>
      )}

      {/* La escala es 1 a 3, la que acepta el backend. Un campo libre de 0 a
          100 dejaba poner valores que la API rechaza, y el usuario se habría
          enterado recién al guardar. */}
      <div className="mt-3 border-t border-gray-100 pt-2 dark:border-slate-800">
        <p className="mb-1.5 text-[11px] font-bold text-gray-600 dark:text-gray-300">
          Empuje al ofrecerlo
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {PRIORIDADES.map((p) => (
            <button
              key={p.valor}
              type="button"
              data-testid={`prio-${p.valor}`}
              onClick={() => poner('prioridadVenta', String(p.valor))}
              className={`rounded-lg border py-1 text-[11px] font-black transition-colors ${
                prioridad === p.valor
                  ? 'border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-900/20 dark:text-violet-300'
                  : 'border-gray-200 text-gray-500 hover:border-violet-300 dark:border-slate-700 dark:text-gray-400'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-gray-400">
          Entre productos que sirven para lo mismo, la IA ofrece primero el de
          mayor empuje.
        </p>
      </div>
    </div>
  );
};
